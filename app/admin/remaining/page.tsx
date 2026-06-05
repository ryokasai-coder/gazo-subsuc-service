'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface UserUsage {
  user_id: string
  used_count: number
  max_count: number
  users: { company_name: string; contact_name: string; email: string }
}

export default function AdminRemainingPage() {
  const router = useRouter()
  const [usages, setUsages] = useState<UserUsage[]>([])
  const [loading, setLoading] = useState(true)
  const billingMonth = new Date().toISOString().slice(0, 7)

  // Calculate pacing
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const dayOfMonth = today.getDate()
  const pacingRate = dayOfMonth / daysInMonth
  const expectedCount = Math.floor(10 * pacingRate)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      const { data: ud } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (ud?.role !== 'admin') { router.push('/admin/login'); return }

      const { data } = await supabase
        .from('usage_limits')
        .select('*, users(company_name, contact_name, email)')
        .eq('billing_month', billingMonth)
        .order('used_count', { ascending: true })
      setUsages((data as UserUsage[]) ?? [])
      setLoading(false)
    }
    init()
  }, [router, billingMonth])

  const getStatus = (usedCount: number) => {
    if (usedCount >= 10) return { label: '上限到達', color: 'text-gray-500 bg-gray-100' }
    if (usedCount >= expectedCount) return { label: 'ペース良好', color: 'text-green-700 bg-green-100' }
    if (usedCount >= expectedCount - 2) return { label: 'やや遅れ', color: 'text-yellow-700 bg-yellow-100' }
    return { label: 'ペース遅れ', color: 'text-red-700 bg-red-100' }
  }

  return (
    <div className="min-h-screen bg-[#F1EFEF]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <Link href="/admin" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] hover:bg-[#F1EFEF] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-bold text-[#111111]">依頼数管理</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl p-4 mb-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-[#FFE8EC] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111111]">
              {billingMonth.replace('-', '年')}月 — {dayOfMonth}日時点（月間進捗 {Math.round(pacingRate * 100)}%）
            </p>
            <p className="text-xs text-[#767676] mt-0.5">ペース通りの依頼数：<strong className="text-[#E60023]">{expectedCount}回 / 10回</strong></p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#E60023] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : usages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
            <p className="text-[#ABABAB] text-sm">今月のデータがありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F1EFEF] border-b border-[#EFEFEF]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#767676]">会社名</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#767676]">依頼数</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#767676]">進捗</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#767676]">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EFEF]">
                {usages.map(u => {
                  const status = getStatus(u.used_count)
                  const pct = (u.used_count / u.max_count) * 100
                  return (
                    <tr key={u.user_id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#111111]">{u.users?.company_name}</p>
                        <p className="text-xs text-[#ABABAB]">{u.users?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-[#111111]">{u.used_count}</span>
                        <span className="text-[#ABABAB]"> / {u.max_count}</span>
                      </td>
                      <td className="px-4 py-3 w-44">
                        <div className="w-32 bg-[#F1EFEF] rounded-full h-2">
                          <div
                            className="bg-[#E60023] h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#ABABAB] mt-1 block">{Math.round(pct)}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
