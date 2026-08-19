'use client'

import Link from 'next/link'
import SubPageHeader from '@/components/ui/SubPageHeader'
import { useAccount } from '@/lib/useAccount'
import {
  MONTHLY_FEE,
  MONTHLY_LIMIT,
  CANCELLATION_STATUS_LABEL,
  formatJpDate,
  formatJpMonth,
} from '@/lib/contract'

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F8F8FA] last:border-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-[#E85C97]' : 'text-[#111111]'}`}>{value}</span>
    </div>
  )
}

// STEP③｜契約情報
export default function ContractPage() {
  const { loading, user, usage, remaining, contract, status } = useAccount()

  if (loading || !contract) {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E85C97] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA]">
      <SubPageHeader backHref="/dashboard/billing" backLabel="契約・お支払いへ" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-xs font-black text-gradient uppercase tracking-widest mb-1">Contract</p>
          <h1 className="text-xl font-black text-[#111111]">契約情報</h1>
        </div>

        {/* 解約申請済み／解約済みの案内 */}
        {status !== 'active' && (
          <div className="bg-[#FFF0F6] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#E85C97]">{CANCELLATION_STATUS_LABEL[status]}</p>
            <p className="text-xs text-[#6B7280] mt-1">
              {status === 'cancel_requested'
                ? `${formatJpDate(user?.service_end_date)}まではサービスをご利用いただけます。同日以降は自動更新・請求は発生しません。`
                : 'サービスのご利用は終了しています。'}
            </p>
          </div>
        )}

        {/* 現在のご契約 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <p className="text-sm font-bold text-[#111111] mb-2">現在のご契約</p>
          <Row label="プラン" value="画像制作サブスク" />
          <Row label="月額料金" value={`${MONTHLY_FEE.toLocaleString()}円（税抜）`} />
          <Row label="契約開始日" value={formatJpDate(contract.contractStartDate)} />
          {contract.isInFreePeriod && (
            <>
              <Row label="無料期間" value={`${formatJpDate(contract.contractStartDate)} 〜 ${formatJpDate(contract.freePeriodEndDate)}`} accent />
              <Row label="課金開始月" value={formatJpMonth(contract.billingStartMonth)} />
            </>
          )}
          {status === 'active'
            ? <Row label="次回更新日" value={formatJpDate(contract.nextRenewalDate)} />
            : <Row label="契約終了日" value={formatJpDate(user?.service_end_date)} accent />}
        </div>

        {/* ご利用状況 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <p className="text-sm font-bold text-[#111111] mb-2">ご利用状況</p>
          <Row label="今月の利用回数" value={`${usage.used_count} / ${MONTHLY_LIMIT}回`} />
          <Row label="残り利用回数" value={`${Math.max(remaining, 0)}回`} accent />
        </div>

        {/* プランについて誘導 */}
        <Link
          href="/dashboard/plan"
          className="block bg-white rounded-3xl shadow-sm p-6 hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#111111]">プランについて</p>
              <p className="text-xs text-[#6B7280] mt-1">
                現在ご利用いただいているサービス内容やご利用条件をご確認いただけます。
              </p>
            </div>
            <span className="text-[#ABABAB] text-lg">›</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
