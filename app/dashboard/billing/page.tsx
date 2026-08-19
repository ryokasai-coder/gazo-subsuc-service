'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import SubPageHeader from '@/components/ui/SubPageHeader'
import { useAccount } from '@/lib/useAccount'
import {
  MONTHLY_FEE,
  CANCELLATION_STATUS_LABEL,
  formatJpDate,
} from '@/lib/contract'

interface BillingRecord {
  id: string
  billing_month: string | null
  billing_amount: number | null
  clearing_status: string | null
  payment_due: string | null
}

// STEP②｜契約・お支払い
export default function BillingPage() {
  const { loading, user, contract, status } = useAccount()
  const [records, setRecords] = useState<BillingRecord[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('billing_records')
        .select('id, billing_month, billing_amount, clearing_status, payment_due')
        .eq('user_id', session.user.id)
        .order('billing_month', { ascending: false })
        .limit(12)
      setRecords(data ?? [])
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E85C97] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA]">
      <SubPageHeader backHref="/dashboard" backLabel="ダッシュボードへ" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-xs font-black text-gradient uppercase tracking-widest mb-1">Billing</p>
          <h1 className="text-xl font-black text-[#111111]">契約・お支払い</h1>
        </div>

        {/* 契約情報 */}
        <Link
          href="/dashboard/contract"
          className="block bg-white rounded-3xl shadow-sm p-6 mb-4 hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#111111]">契約情報</p>
              <p className="text-xs text-[#6B7280] mt-1">
                プラン・契約開始日・次回更新日・ご利用状況を確認できます
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#FFF0F6] text-[#E85C97]">
                  {CANCELLATION_STATUS_LABEL[status]}
                </span>
                {contract && status === 'active' && (
                  <span className="text-xs text-[#ABABAB]">次回更新 {formatJpDate(contract.nextRenewalDate)}</span>
                )}
                {status !== 'active' && user?.service_end_date && (
                  <span className="text-xs text-[#ABABAB]">利用期限 {formatJpDate(user.service_end_date)}</span>
                )}
              </div>
            </div>
            <span className="text-[#ABABAB] text-lg">›</span>
          </div>
        </Link>

        {/* お支払い情報 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <p className="text-sm font-bold text-[#111111] mb-2">お支払い情報</p>
          <div className="text-sm text-[#6B7280] space-y-1">
            <p>月額料金：<strong className="text-[#111111]">{MONTHLY_FEE.toLocaleString()}円（税抜）</strong></p>
            <p>お支払い方法：請求書でのご案内</p>
          </div>
          <p className="text-xs text-[#ABABAB] mt-3 leading-relaxed">
            お支払いに関するご不明点は、担当者までお問い合わせください。
          </p>
        </div>

        {/* 請求履歴 */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F8F8FA]">
            <p className="text-sm font-bold text-[#111111]">請求履歴</p>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-10 text-[#ABABAB] text-sm">請求履歴はまだありません</div>
          ) : (
            <div className="divide-y divide-[#F8F8FA]">
              {records.map(r => (
                <div key={r.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <span className="text-[#111111]">{r.billing_month ?? '—'}</span>
                  <span className="text-[#6B7280]">
                    {r.billing_amount != null ? `${r.billing_amount.toLocaleString()}円` : '—'}
                  </span>
                  <span className="text-xs text-[#ABABAB]">{r.clearing_status ?? ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
