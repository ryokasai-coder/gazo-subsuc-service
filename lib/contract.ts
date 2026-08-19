// ─── 契約・解約の算出ロジック ───────────────────────────────────────
// 顧客ページ / 解約API / 管理画面 / Cron で共用する純関数群。
// 方針（2026-08-19 確定）:
//   ・解約ロジックは「仕様案どおり」＝解約すると当月末で利用終了・次回請求は発生しない（綺麗に切れる）。
//   ・無料期間は「組み込む」＝初回契約日から2ヶ月無料・3ヶ月目から課金。
//     無料期間の1ヶ月目（初回契約日から1ヶ月間）は解約申請不可（利用規約 第7条）。
// 月次更新は毎月1日を基準（次回更新日＝翌月1日、解約時の利用期限＝当月末日）。
import { addMonths, endOfMonth, startOfMonth, isBefore, format } from 'date-fns'

export const MONTHLY_FEE = 5000            // 月額（税抜）
export const MONTHLY_LIMIT = 10            // 月間の利用可能回数
export const FREE_PERIOD_MONTHS = 2        // 無料期間（初回契約日から）

export type CancellationStatus = 'active' | 'cancel_requested' | 'cancelled'

export interface ContractUserFields {
  contract_start_date?: string | null
  created_at?: string | null
  cancellation_status?: string | null
  cancel_requested_at?: string | null
  service_end_date?: string | null
}

export interface ContractInfo {
  contractStartDate: Date
  freePeriodEndDate: Date        // 無料期間の終了境界（初回契約日 + 2ヶ月）。この日から課金対象
  billingStartMonth: Date        // 課金開始月（3ヶ月目）の初日
  isInFreePeriod: boolean        // 現在が無料期間中か
  nextRenewalDate: Date          // 次回更新日（翌月1日）
  serviceEndDateIfCancel: Date   // 今解約した場合の利用期限（当月末日）
  cancelAvailableFrom: Date      // 解約申請が可能になる日（初回契約日 + 1ヶ月）
  canCancel: boolean             // 現時点で解約申請できるか（無料1ヶ月目は不可）
}

// 契約開始日を解決（contract_start_date 優先、無ければ created_at、それも無ければ now）
export function resolveContractStart(user: ContractUserFields, now: Date): Date {
  const raw = user.contract_start_date ?? user.created_at
  if (raw) {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d
  }
  return now
}

export function getContractInfo(user: ContractUserFields, now: Date = new Date()): ContractInfo {
  const contractStartDate = resolveContractStart(user, now)
  const freePeriodEndDate = addMonths(contractStartDate, FREE_PERIOD_MONTHS)
  const cancelAvailableFrom = addMonths(contractStartDate, 1)

  return {
    contractStartDate,
    freePeriodEndDate,
    billingStartMonth: startOfMonth(freePeriodEndDate),
    isInFreePeriod: isBefore(now, freePeriodEndDate),
    nextRenewalDate: startOfMonth(addMonths(now, 1)),
    serviceEndDateIfCancel: endOfMonth(now),
    cancelAvailableFrom,
    // 無料期間の1ヶ月目（初回契約日から1ヶ月間）は解約不可。それ以降は可能。
    canCancel: !isBefore(now, cancelAvailableFrom),
  }
}

// 保存済みステータスと利用期限から「実効ステータス」を導出する。
// cancel_requested のまま利用期限を過ぎていれば cancelled 扱い（Cron 反映前でも読み取り側で正しく表示）。
export function effectiveCancellationStatus(user: ContractUserFields, now: Date = new Date()): CancellationStatus {
  const stored = (user.cancellation_status ?? 'active') as CancellationStatus
  if (stored === 'cancel_requested' && user.service_end_date) {
    // 利用期限（末日）当日までは利用可。末日 23:59:59 を過ぎたら解約済み扱い。
    const end = new Date(user.service_end_date)
    end.setHours(23, 59, 59, 999)
    if (now > end) return 'cancelled'
  }
  return stored
}

// 新規の画像依頼が可能か（解約済み＝利用期限超過なら不可。申請中でも期限内なら可）。
export function canRequestNewImage(user: ContractUserFields, now: Date = new Date()): boolean {
  return effectiveCancellationStatus(user, now) !== 'cancelled'
}

// ── 表示用フォーマッタ ──
export function formatJpDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return format(date, 'yyyy年M月d日')
}

export function formatJpMonth(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return format(date, 'yyyy年M月')
}

export const CANCELLATION_STATUS_LABEL: Record<CancellationStatus, string> = {
  active: '契約中',
  cancel_requested: '解約申請済み',
  cancelled: '解約済み',
}

// ── 解約理由（STEP⑧）と理由別の引き止め内容（§13）──
export interface CancelReason {
  key: string
  label: string
  needsDetail?: boolean          // 選択時に自由記述欄を表示
  // 理由別の引き止め表示（§13）。未設定＝標準の継続/代替案のみ
  retention?: { message: string; strongHold: boolean }
}

export const CANCEL_REASONS: CancelReason[] = [
  {
    key: 'rarely_used',
    label: '利用する機会が少なかった',
    retention: {
      message: '今月はまだ制作枠が残っています。必要な画像がある場合は、契約終了日まで引き続きご利用いただけます。',
      strongHold: true,
    },
  },
  {
    key: 'finished',
    label: '必要な画像制作が終了した',
    retention: {
      message: 'ご利用ありがとうございました。今後また画像制作が必要になった際には、再度ご契約いただけます。',
      strongHold: false,
    },
  },
  {
    key: 'price',
    label: '月額料金が合わなかった',
    retention: {
      message: `現在のプランは月額${MONTHLY_FEE.toLocaleString()}円（税抜）で、毎月最大${MONTHLY_LIMIT}回まで画像制作をご利用いただけます。`,
      strongHold: true,
    },
  },
  {
    key: 'service_mismatch',
    label: 'サービス内容が合わなかった',
    needsDetail: true,
    retention: {
      message: 'サービス改善のため、差し支えなければご意見をお聞かせください。',
      strongHold: false,
    },
  },
  { key: 'request_flow', label: '依頼方法が合わなかった' },
  { key: 'other_service', label: '他のサービスを利用する' },
  { key: 'other', label: 'その他', needsDetail: true },
  { key: 'no_answer', label: '回答しない' },
]

export function getCancelReason(key: string | null | undefined): CancelReason | undefined {
  if (!key) return undefined
  return CANCEL_REASONS.find(r => r.key === key)
}

export function cancelReasonLabel(key: string | null | undefined): string {
  return getCancelReason(key)?.label ?? '—'
}
