'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Feedback {
  id: string
  billing_month: string
  overall_rating: number
  quality_rating: number
  speed_rating: number
  comment: string
  created_at: string
  users?: { company_name: string; contact_name: string }
}

export default function AdminFeedbackPage() {
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7))

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      const { data: ud } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (ud?.role !== 'admin') { router.push('/admin/login'); return }

      const { data } = await supabase
        .from('feedbacks')
        .select('*, users(company_name, contact_name)')
        .eq('billing_month', billingMonth)
        .order('created_at', { ascending: false })
      setFeedbacks((data as Feedback[]) ?? [])
      setLoading(false)
    }
    init()
  }, [router, billingMonth])

  const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length

  const overallAvg = avg(feedbacks.map(f => f.overall_rating).filter(Boolean))
  const qualityAvg = avg(feedbacks.map(f => f.quality_rating).filter(Boolean))
  const speedAvg = avg(feedbacks.map(f => f.speed_rating).filter(Boolean))

  const Stars = ({ value }: { value: number }) => (
    <span className="text-yellow-400">{'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}</span>
  )

  return (
    <div className="min-h-screen bg-[#F7F7F9]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <Link href="/admin" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] hover:bg-[#F7F7F9] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-bold text-[#111111]">フィードバック管理</h1>
          <div className="ml-auto">
            <select
              value={billingMonth}
              onChange={e => { setBillingMonth(e.target.value); setLoading(true) }}
              className="border border-[#EFEFEF] rounded-full px-4 py-2 text-sm text-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#F5308A]/20 transition-all"
            >
              {months.map(m => <option key={m} value={m}>{m.replace('-', '年')}月</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {!loading && feedbacks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '回答数', value: feedbacks.length, unit: '件' },
              { label: '総合評価', value: overallAvg.toFixed(1), unit: '点' },
              { label: 'クオリティ', value: qualityAvg.toFixed(1), unit: '点' },
              { label: 'スピード', value: speedAvg.toFixed(1), unit: '点' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <div className="text-2xl font-black text-[#111111]">{item.value}<span className="text-sm font-normal text-[#767676]">{item.unit}</span></div>
                <div className="text-xs text-[#767676] mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#F5308A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-[#ABABAB] text-sm">この月のフィードバックはありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map(fb => (
              <div key={fb.id} className="bg-white rounded-3xl shadow-sm p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-[#111111]">{fb.users?.company_name}</p>
                    <p className="text-xs text-[#ABABAB]">{fb.users?.contact_name} • {new Date(fb.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Stars value={fb.overall_rating} />
                    <span className="text-xs text-[#767676]">総合 {fb.overall_rating}点</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-[#767676] mb-3">
                  {fb.quality_rating > 0 && <span>クオリティ: <Stars value={fb.quality_rating} /> {fb.quality_rating}点</span>}
                  {fb.speed_rating > 0 && <span>スピード: <Stars value={fb.speed_rating} /> {fb.speed_rating}点</span>}
                </div>
                {fb.comment && (
                  <p className="text-sm text-[#111111] bg-[#F7F7F9] rounded-2xl px-4 py-3">{fb.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
