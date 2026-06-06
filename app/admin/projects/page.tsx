'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'

interface Request {
  id: string
  user_id: string
  status: string
  purpose: string
  image_type: string
  format: string
  size: string
  quantity: number
  style: string
  color_scheme: string
  text_content: string
  reference_url: string
  notes: string
  billing_month: string
  created_at: string
  delivered_at: string | null
  users?: { company_name: string; contact_name: string; email: string }
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [updating, setUpdating] = useState('')

  const fetchRequests = async () => {
    const supabase = createClient()
    let query = supabase
      .from('image_requests')
      .select('*, users(company_name, contact_name, email)')
      .order('created_at', { ascending: false })

    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterMonth) query = query.eq('billing_month', filterMonth)

    const { data } = await query
    setRequests((data as Request[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      const { data: ud } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (ud?.role !== 'admin') { router.push('/admin/login'); return }
      fetchRequests()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, filterStatus, filterMonth])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    const res = await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      if (selectedRequest?.id === id) setSelectedRequest(prev => prev ? { ...prev, status } : null)
    }
    setUpdating('')
  }

  const handleDeliver = async (req: Request) => {
    const imageUrl = prompt('納品画像のURL（Google Drive / Dropbox など）を入力してください\n（後から設定する場合は空白のままOK）')
    if (imageUrl === null) return // キャンセル
    await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deliver', requestId: req.id, imageUrl: imageUrl || null }),
    })
    await updateStatus(req.id, 'delivered')
    alert('納品完了・メールを送信しました')
  }

  const exportCSV = () => {
    const headers = ['依頼ID', '会社名', 'ステータス', '用途', '種類', '請求月', '依頼日']
    const rows = requests.map(r => [
      r.id,
      r.users?.company_name ?? '',
      r.status,
      r.purpose,
      r.image_type,
      r.billing_month,
      new Date(r.created_at).toLocaleDateString('ja-JP'),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const bom = '﻿'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `requests_${filterMonth}.csv`
    a.click()
  }

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  const selectClass = "border border-[#EFEFEF] rounded-full px-4 py-2 text-sm text-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all"
  const thClass = "text-left px-4 py-3 text-xs font-semibold text-[#767676]"
  const tdClass = "px-4 py-3"

  return (
    <div className="min-h-screen bg-[#F1EFEF]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <Link href="/admin" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] hover:bg-[#F1EFEF] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-bold text-[#111111]">案件管理</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/projects/master" className="text-sm border border-[#EFEFEF] text-[#767676] px-4 py-2 rounded-full hover:bg-[#F1EFEF] transition-all">
              案件マスタ
            </Link>
            <button onClick={exportCSV} className="text-sm border border-[#EFEFEF] text-[#767676] px-4 py-2 rounded-full hover:bg-[#F1EFEF] transition-all">
              CSV出力
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-5">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setLoading(true) }} className={selectClass}>
            <option value="">すべてのステータス</option>
            <option value="pending">依頼中</option>
            <option value="in_progress">制作中</option>
            <option value="delivered">納品済み</option>
            <option value="cancelled">キャンセル</option>
          </select>
          <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setLoading(true) }} className={selectClass}>
            {months.map(m => <option key={m} value={m}>{m.replace('-', '年')}月</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#E60023] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F1EFEF] border-b border-[#EFEFEF]">
                  <tr>
                    <th className={thClass}>会社名</th>
                    <th className={thClass}>用途</th>
                    <th className={thClass}>種類</th>
                    <th className={thClass}>ステータス</th>
                    <th className={thClass}>依頼日</th>
                    <th className={thClass}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EFEF]">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className={`${tdClass} font-semibold text-[#111111]`}>{req.users?.company_name}</td>
                      <td className={`${tdClass} text-[#767676] max-w-xs truncate`}>{req.purpose}</td>
                      <td className={`${tdClass} text-[#767676]`}>{req.image_type}</td>
                      <td className={tdClass}><StatusBadge status={req.status} /></td>
                      <td className={`${tdClass} text-[#ABABAB] text-xs`}>{new Date(req.created_at).toLocaleDateString('ja-JP')}</td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedRequest(req)} className="text-xs text-[#E60023] hover:underline font-semibold">詳細</button>
                          {req.status === 'pending' && (
                            <button onClick={() => updateStatus(req.id, 'in_progress')} disabled={updating === req.id}
                              className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                              制作開始
                            </button>
                          )}
                          {req.status === 'in_progress' && (
                            <button onClick={() => handleDeliver(req)} disabled={updating === req.id}
                              className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors">
                              納品する
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && (
                <div className="text-center py-12 text-[#ABABAB]">案件がありません</div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="依頼詳細" size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedRequest.status} />
              <span className="text-sm text-[#767676]">{selectedRequest.billing_month.replace('-', '年')}月</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['会社名', selectedRequest.users?.company_name],
                ['担当者', selectedRequest.users?.contact_name],
                ['メール', selectedRequest.users?.email],
                ['用途', selectedRequest.purpose],
                ['種類', selectedRequest.image_type],
                ['形式', selectedRequest.format || '-'],
                ['サイズ', selectedRequest.size || '-'],
                ['数量', String(selectedRequest.quantity)],
                ['スタイル', selectedRequest.style || '-'],
                ['カラー', selectedRequest.color_scheme || '-'],
                ['テキスト', selectedRequest.text_content || '-'],
                ['参考URL', selectedRequest.reference_url || '-'],
                ['備考', selectedRequest.notes || '-'],
              ].map(([label, value]) => (
                <div key={label} className={`${label === '備考' || label === 'テキスト' ? 'col-span-2' : ''} bg-[#F1EFEF] rounded-xl p-3`}>
                  <span className="text-xs font-semibold text-[#767676] block mb-0.5">{label}</span>
                  <span className="text-sm text-[#111111] break-all">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {selectedRequest.status === 'pending' && (
                <button onClick={() => { updateStatus(selectedRequest.id, 'in_progress'); setSelectedRequest(null) }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-full text-sm hover:bg-blue-700 transition-all font-bold">
                  制作開始にする
                </button>
              )}
              {selectedRequest.status === 'in_progress' && (
                <button onClick={() => { handleDeliver(selectedRequest); setSelectedRequest(null) }}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-full text-sm hover:bg-emerald-700 transition-all font-bold">
                  納品する（メール送信）
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
