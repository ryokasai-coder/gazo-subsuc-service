'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import StatusBadge from '@/components/ui/StatusBadge'

interface ImageRequest {
  id: string
  status: string
  purpose: string
  image_type: string
  format: string
  size: string
  billing_month: string
  created_at: string
  delivered_at: string | null
  delivery_file_urls: string[] | null
}

export default function HistoryPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ImageRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      let query = supabase
        .from('image_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (filterStatus) query = query.eq('status', filterStatus)
      if (filterMonth) query = query.eq('billing_month', filterMonth)

      const { data } = await query
      setRequests(data ?? [])
      setLoading(false)
    }
    init()
  }, [router, filterStatus, filterMonth])

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  const selectClass = "border border-[#EFEFEF] rounded-full px-4 py-2 text-sm text-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all"

  return (
    <div className="min-h-screen bg-[#F1EFEF]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <Link href="/dashboard" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] hover:bg-[#F1EFEF] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-bold text-[#111111]">依頼履歴</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectClass}>
            <option value="">すべてのステータス</option>
            <option value="pending">依頼中</option>
            <option value="in_progress">制作中</option>
            <option value="delivered">納品済み</option>
            <option value="cancelled">キャンセル</option>
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={selectClass}>
            <option value="">すべての月</option>
            {months.map(m => (
              <option key={m} value={m}>{m.replace('-', '年')}月</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#E60023] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-[#ABABAB] text-sm">依頼履歴がありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm divide-y divide-[#F1EFEF]">
            {requests.map(req => (
              <div key={req.id} className="px-6 py-5 hover:bg-[#FAFAFA] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusBadge status={req.status} />
                      <span className="text-xs text-[#ABABAB]">{req.billing_month.replace('-', '年')}月</span>
                    </div>
                    <p className="font-semibold text-[#111111] text-sm">{req.purpose}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-[#767676]">{req.image_type}</span>
                      {req.format && <span className="text-xs text-[#ABABAB]">• {req.format}</span>}
                      {req.size && <span className="text-xs text-[#ABABAB]">• {req.size}</span>}
                    </div>
                    <p className="text-xs text-[#ABABAB] mt-1">依頼日: {new Date(req.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
                {req.status === 'delivered' && req.delivery_file_urls && req.delivery_file_urls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F1EFEF]">
                    <p className="text-xs font-semibold text-[#767676] mb-2">納品ファイル</p>
                    <div className="flex flex-wrap gap-2">
                      {req.delivery_file_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-[#FFE8EC] text-[#E60023] px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors font-medium"
                        >
                          ファイル {i + 1} をダウンロード
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
