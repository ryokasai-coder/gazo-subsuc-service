'use client'

import Link from 'next/link'
import SubPageHeader from '@/components/ui/SubPageHeader'
import { useAccount } from '@/lib/useAccount'
import {
  MONTHLY_FEE,
  MONTHLY_LIMIT,
  formatJpDate,
  CANCELLATION_STATUS_LABEL,
} from '@/lib/contract'

const PLAN_FEATURES = [
  `月${MONTHLY_LIMIT}回まで画像制作可能`,
  '1依頼につき1回まで修正可能',
  '同時依頼2件まで',
  '翌月への利用回数繰り越しなし',
  '専用フォームから画像制作を依頼可能',
]

// STEP④｜プランについて（画像制作サブスクについて）
export default function PlanPage() {
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
      <SubPageHeader backHref="/dashboard/contract" backLabel="契約情報へ" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-xs font-black text-gradient uppercase tracking-widest mb-1">Plan</p>
          <h1 className="text-xl font-black text-[#111111]">画像制作サブスクについて</h1>
        </div>

        {/* 現在ご利用中のプラン */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <p className="text-xs text-[#6B7280] mb-1">現在ご利用中のプラン</p>
          <p className="text-lg font-black text-[#111111]">画像制作サブスク</p>
          <p className="text-sm text-[#E85C97] font-bold mt-0.5">月額：{MONTHLY_FEE.toLocaleString()}円（税抜）</p>
        </div>

        {/* ご利用いただけるサービス */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <p className="text-sm font-bold text-[#111111] mb-3">ご利用いただけるサービス</p>
          <ul className="space-y-2">
            {PLAN_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#111111]">
                <span className="text-[#E85C97] mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 現在の利用状況 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <p className="text-sm font-bold text-[#111111] mb-2">現在の利用状況</p>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-xs text-[#6B7280]">今月の利用</span>
              <p className="text-2xl font-black text-[#111111]">{usage.used_count} <span className="text-sm text-[#ABABAB] font-normal">/ {MONTHLY_LIMIT}回</span></p>
            </div>
            <div>
              <span className="text-xs text-[#6B7280]">残り利用回数</span>
              <p className="text-2xl font-black text-[#E85C97]">{Math.max(remaining, 0)}<span className="text-sm text-[#ABABAB] font-normal">回</span></p>
            </div>
          </div>
        </div>

        {/* 契約情報 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <p className="text-sm font-bold text-[#111111] mb-2">契約情報</p>
          <div className="text-sm text-[#6B7280] space-y-1">
            <p>契約開始日：<span className="text-[#111111]">{formatJpDate(contract.contractStartDate)}</span></p>
            {status === 'active'
              ? <p>次回更新日：<span className="text-[#111111]">{formatJpDate(contract.nextRenewalDate)}</span></p>
              : <p>契約終了日：<span className="text-[#111111]">{formatJpDate(user?.service_end_date)}</span></p>}
          </div>
        </div>

        {/* ページ最下部：解約導線 */}
        {status === 'active' ? (
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
              サービスのご利用を終了される場合は、以下より解約手続きを行っていただけます。
            </p>
            <Link
              href="/dashboard/cancel"
              className="block text-center text-sm text-[#6B7280] hover:text-[#E85C97] underline underline-offset-4 py-2 transition-colors"
            >
              解約をご希望の場合はこちら
            </Link>
          </div>
        ) : (
          <div className="bg-[#F8F8FA] rounded-3xl p-6 text-center">
            <p className="text-sm text-[#6B7280]">現在のステータス：{CANCELLATION_STATUS_LABEL[status]}</p>
          </div>
        )}
      </div>
    </div>
  )
}
