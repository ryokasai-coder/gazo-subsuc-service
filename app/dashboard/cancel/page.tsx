'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SubPageHeader from '@/components/ui/SubPageHeader'
import { useAccount } from '@/lib/useAccount'
import {
  MONTHLY_FEE,
  MONTHLY_LIMIT,
  CANCEL_REASONS,
  getCancelReason,
  formatJpDate,
  CANCELLATION_STATUS_LABEL,
} from '@/lib/contract'

type Step = 'confirm' | 'usage' | 'retention' | 'reason' | 'reason_retention' | 'final' | 'done'

const primaryBtn = 'btn-gradient w-full font-bold py-4 rounded-full disabled:opacity-40 disabled:cursor-not-allowed'
const ghostBtn = 'w-full font-bold py-4 rounded-full border border-[#EFEFEF] text-[#6B7280] hover:bg-[#F8F8FA] transition-all'

export default function CancelPage() {
  const router = useRouter()
  const { loading, user, remaining, contract, status } = useAccount()

  const [step, setStep] = useState<Step>('confirm')
  const [reason, setReason] = useState<string>('')
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [endDateResult, setEndDateResult] = useState('')

  const keepUsing = () => router.push('/dashboard')

  const submitCancel = async () => {
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/cancel/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || null, reason_detail: detail || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '解約手続きに失敗しました')
      setEndDateResult(data.serviceEndDate)
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '解約手続きに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // 解約理由「次へ」：理由別分岐（§13）があれば表示、なければ最終確認へ
  const proceedFromReason = () => {
    const r = getCancelReason(reason)
    if (r?.retention) setStep('reason_retention')
    else setStep('final')
  }

  if (loading || !contract) {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E85C97] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // 既に解約申請済み／解約済み
  if (status !== 'active') {
    return (
      <Shell>
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
          <p className="text-3xl mb-3">🗂️</p>
          <p className="font-bold text-[#111111] mb-1">{CANCELLATION_STATUS_LABEL[status]}</p>
          <p className="text-sm text-[#6B7280] mb-6">
            {status === 'cancel_requested'
              ? `解約手続きは受付済みです。${formatJpDate(user?.service_end_date)}まではご利用いただけます。`
              : 'サービスのご利用は終了しています。'}
          </p>
          <Link href="/dashboard" className={primaryBtn + ' inline-block'}>マイページへ戻る</Link>
        </div>
      </Shell>
    )
  }

  // 無料期間1ヶ月目は解約申請不可（利用規約 第7条）
  if (!contract.canCancel) {
    return (
      <Shell>
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
          <p className="text-3xl mb-3">🗓️</p>
          <p className="font-bold text-[#111111] mb-1">現在は解約申請を受け付けておりません</p>
          <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
            無料期間の1ヶ月目（初回契約日から1ヶ月間）は解約の申請を行うことができません。<br />
            <strong className="text-[#111111]">{formatJpDate(contract.cancelAvailableFrom)}</strong> 以降に解約申請が可能になります。
          </p>
          <Link href="/dashboard/plan" className={ghostBtn + ' inline-block'}>プランについてへ戻る</Link>
        </div>
      </Shell>
    )
  }

  const endDate = formatJpDate(contract.serviceEndDateIfCancel)
  const nextRenewal = formatJpDate(contract.nextRenewalDate)
  const activeReason = getCancelReason(reason)

  return (
    <Shell>
      {/* STEP⑤ 解約前の確認 */}
      {step === 'confirm' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#111111] mb-1">解約手続き</h2>
          <p className="text-sm text-[#6B7280] mb-5">解約前に現在の契約内容をご確認ください。</p>
          <InfoBox rows={[
            ['現在のプラン', '画像制作サブスク'],
            ['月額料金', `${MONTHLY_FEE.toLocaleString()}円（税抜）`],
            ['次回更新日', nextRenewal],
            ['解約した場合のサービス利用期限', endDate],
          ]} />
          <div className="bg-[#FFF8FB] rounded-2xl p-4 mt-4 text-xs text-[#6B7280] space-y-1.5 leading-relaxed">
            <p>・{endDate}まではサービスをご利用いただけます。</p>
            <p>・{nextRenewal}以降の自動更新は停止されます。</p>
            <p>・次回更新以降の料金は発生しません。</p>
            <p>・解約後はサービスの利用ができなくなります。</p>
          </div>
          <div className="mt-6">
            <button onClick={() => setStep('usage')} className={primaryBtn}>次へ進む</button>
          </div>
        </div>
      )}

      {/* STEP⑥ サービス内容・利用状況の確認 */}
      {step === 'usage' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#111111] mb-1">解約前にご確認ください</h2>
          <p className="text-sm text-[#6B7280] mb-4">現在のプランでは、以下のサービスをご利用いただけます。</p>
          <ul className="space-y-2 mb-4">
            {[`月額${MONTHLY_FEE.toLocaleString()}円`, `月${MONTHLY_LIMIT}回まで画像制作可能`, '修正1回まで可能', '同時依頼2件まで'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#111111]"><span className="text-[#E85C97] mt-0.5">✓</span>{f}</li>
            ))}
          </ul>
          <p className="text-sm text-[#6B7280] bg-[#F8F8FA] rounded-2xl p-4 leading-relaxed">
            現在、今月の制作枠が <strong className="text-[#E85C97]">{Math.max(remaining, 0)}回</strong> 残っています。<br />
            このままサービスをご利用いただくことも可能です。
          </p>
          <div className="mt-6 space-y-3">
            <button onClick={keepUsing} className={primaryBtn}>このまま利用する</button>
            <button onClick={() => setStep('retention')} className={ghostBtn}>解約手続きを続ける</button>
          </div>
        </div>
      )}

      {/* STEP⑦ 継続・代替案の提示 */}
      {step === 'retention' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#111111] mb-1">解約する前に</h2>
          <p className="text-sm text-[#6B7280] mb-4">ご利用状況に合わせて、以下の方法もご検討いただけます。</p>
          <div className="space-y-3 mb-5">
            <div className="bg-[#F8F8FA] rounded-2xl p-4">
              <p className="text-sm font-bold text-[#111111] mb-1">今後も画像制作を利用する予定がある場合</p>
              <p className="text-xs text-[#6B7280]">月額{MONTHLY_FEE.toLocaleString()}円で毎月最大{MONTHLY_LIMIT}回までご利用いただけます。</p>
            </div>
            <div className="bg-[#F8F8FA] rounded-2xl p-4">
              <p className="text-sm font-bold text-[#111111] mb-1">一時的に利用しない場合</p>
              <p className="text-xs text-[#6B7280]">今後必要になった際には、再度ご契約いただくことも可能です。</p>
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={keepUsing} className={primaryBtn}>このまま利用する</button>
            <button onClick={() => setStep('reason')} className={ghostBtn}>解約手続きを続ける</button>
          </div>
        </div>
      )}

      {/* STEP⑧ 解約理由 */}
      {step === 'reason' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#111111] mb-1">解約理由を教えてください</h2>
          <p className="text-sm text-[#6B7280] mb-4">今後のサービス改善のため、差し支えなければ解約理由をお聞かせください。</p>
          <div className="space-y-2 mb-4">
            {CANCEL_REASONS.map(r => (
              <label key={r.key} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all ${reason === r.key ? 'border-[#E85C97] bg-[#FFF0F6]' : 'border-[#EFEFEF] hover:bg-[#FAFAFA]'}`}>
                <input type="radio" name="reason" value={r.key} checked={reason === r.key} onChange={() => setReason(r.key)} className="accent-[#E85C97]" />
                <span className="text-sm text-[#111111]">{r.label}</span>
              </label>
            ))}
          </div>
          {activeReason?.needsDetail && (
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="差し支えなければ詳細をお聞かせください"
              rows={3}
              className="w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E85C97]/20 focus:border-[#E85C97] bg-[#FAFAFA] mb-4"
            />
          )}
          <div className="space-y-3">
            <button onClick={proceedFromReason} disabled={!reason} className={primaryBtn}>次へ</button>
            <button onClick={() => setStep('retention')} className={ghostBtn}>戻る</button>
          </div>
        </div>
      )}

      {/* §13 理由別の引き止め */}
      {step === 'reason_retention' && activeReason?.retention && (
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#111111] mb-3">{activeReason.label}</h2>
          <p className="text-sm text-[#6B7280] bg-[#F8F8FA] rounded-2xl p-4 leading-relaxed mb-5">
            {activeReason.retention.message}
          </p>
          {activeReason.needsDetail && (
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="ご意見をお聞かせください"
              rows={3}
              className="w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E85C97]/20 focus:border-[#E85C97] bg-[#FAFAFA] mb-4"
            />
          )}
          <div className="space-y-3">
            {activeReason.retention.strongHold && (
              <button onClick={keepUsing} className={primaryBtn}>このまま利用する</button>
            )}
            <button
              onClick={() => setStep('final')}
              className={activeReason.retention.strongHold ? ghostBtn : primaryBtn}
            >
              {activeReason.needsDetail ? '送信して解約を続ける' : '解約を続ける'}
            </button>
          </div>
        </div>
      )}

      {/* STEP⑨ 最終確認 */}
      {step === 'final' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#111111] mb-4">解約内容をご確認ください</h2>
          <p className="text-sm text-[#6B7280] mb-3">以下の内容で解約します。</p>
          <InfoBox rows={[
            ['プラン', '画像制作サブスク'],
            ['月額料金', `${MONTHLY_FEE.toLocaleString()}円（税抜）`],
            ['解約日（利用期限）', endDate],
            ['次回更新', 'なし'],
            ['次回請求', 'なし'],
          ]} />
          <div className="bg-[#FFF8FB] rounded-2xl p-4 mt-4 text-xs text-[#6B7280] leading-relaxed">
            <p>{endDate}までは、現在のサービスをご利用いただけます。</p>
            <p>{nextRenewal}以降はサービスをご利用いただけなくなり、次回の自動更新・請求は発生しません。</p>
          </div>
          {error && <p className="text-sm text-[#E85C97] bg-[#FFF0F6] rounded-xl px-4 py-3 mt-4">{error}</p>}
          <div className="mt-6 space-y-3">
            <button onClick={submitCancel} disabled={submitting} className={primaryBtn}>
              {submitting ? '処理中...' : '解約を確定する'}
            </button>
            <button onClick={() => setStep('reason')} disabled={submitting} className={ghostBtn}>戻る</button>
          </div>
        </div>
      )}

      {/* STEP⑩ 解約完了 */}
      {step === 'done' && (
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 text-center">
          <p className="text-3xl mb-3">✅</p>
          <h2 className="text-base font-bold text-[#111111] mb-1">解約手続きが完了しました</h2>
          <p className="text-sm text-[#6B7280] mb-5">
            {user?.company_name} 様の解約手続きが完了しました。
          </p>
          <InfoBox rows={[
            ['契約終了日', endDateResult || endDate],
            ['次回更新', 'なし'],
            ['次回請求', 'なし'],
          ]} />
          <p className="text-xs text-[#6B7280] mt-4 leading-relaxed">
            {endDateResult || endDate}までは、引き続き画像制作サービスをご利用いただけます。<br />
            解約内容を登録メールアドレスへ送信しました。<br />
            これまでご利用いただき、ありがとうございました。
          </p>
          <div className="mt-6">
            <Link href="/dashboard" className={primaryBtn + ' inline-block'}>マイページへ戻る</Link>
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F8FA]">
      <SubPageHeader backHref="/dashboard/plan" backLabel="プランについてへ" />
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-xs font-black text-gradient uppercase tracking-widest mb-1">Cancellation</p>
          <h1 className="text-xl font-black text-[#111111]">解約手続き</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

function InfoBox({ rows }: { rows: [string, string][] }) {
  return (
    <div className="border border-[#EFEFEF] rounded-2xl overflow-hidden">
      {rows.map(([label, value], i) => (
        <div key={label} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-[#F8F8FA]' : ''}`}>
          <span className="text-xs text-[#6B7280]">{label}</span>
          <span className="text-sm font-semibold text-[#111111]">{value}</span>
        </div>
      ))}
    </div>
  )
}
