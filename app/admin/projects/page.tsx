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
  image_size: string
  template_name: string
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
  delivered_image_url: string | null
  users?: { company_name: string; contact_name: string; email: string; login_id: string }
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [updating, setUpdating] = useState('')
  const [delivering, setDelivering] = useState('')

  const fetchRequests = async () => {
    const supabase = createClient()
    let query = supabase
      .from('image_requests')
      .select('*, users(company_name, contact_name, email, login_id)')
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

  // 管理画面からの納品：メール送信＋ステータスをdeliveredに更新
  const handleDeliver = async (req: Request) => {
    if (!confirm(`${req.users?.company_name} に納品メールを送信しますか？`)) return
    setDelivering(req.id)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deliver',
          requestId: req.id,
          imageUrl: req.delivered_image_url || null,
        }),
      })
      if (res.ok) {
        setRequests(prev => prev.map(r =>
          r.id === req.id ? { ...r, status: 'delivered', delivered_at: new Date().toISOString() } : r
        ))
        if (selectedRequest?.id === req.id) {
          setSelectedRequest(prev => prev ? { ...prev, status: 'delivered' } : null)
        }
        alert('✅ 納品完了・メールを送信しました')
      } else {
        const d = await res.json()
        alert('エラー: ' + (d.error || '納品に失敗しました'))
      }
    } finally {
      setDelivering('')
    }
  }

  const exportCSV = () => {
    const headers = ['依頼ID', 'お客様番号', '会社名', 'ステータス', 'テンプレート', '種類', 'サイズ', 'テキスト', '請求月', '依頼日', '納品日']
    const rows = requests.map(r => [
      r.id,
      r.users?.login_id ?? '',
      r.users?.company_name ?? '',
      r.status,
      r.template_name ?? '',
      r.image_type,
      r.image_size ?? '',
      r.text_content ?? '',
      r.billing_month ?? '',
      new Date(r.created_at).toLocaleDateString('ja-JP'),
      r.delivered_at ? new Date(r.delivered_at).toLocaleDateString('ja-JP') : '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
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

  // ステータス別件数
  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
        {/* サマリーカード */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: '依頼中', key: 'pending', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
            { label: '制作中', key: 'in_progress', color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { label: '納品済', key: 'delivered', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: '合計', key: 'total', color: 'text-[#E60023] bg-[#FFE8EC] border-red-200' },
          ].map(({ label, key, color }) => (
            <div key={key} className={`rounded-2xl border p-4 ${color}`}>
              <p className="text-xs font-semibold opacity-70">{label}</p>
              <p className="text-2xl font-black mt-1">
                {key === 'total' ? requests.length : (counts[key] || 0)}
              </p>
            </div>
          ))}
        </div>

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
          <button onClick={() => { setLoading(true); fetchRequests() }}
            className="border border-[#EFEFEF] bg-white text-[#767676] px-4 py-2 rounded-full text-sm hover:bg-[#F1EFEF] transition-all">
            🔄 更新
          </button>
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
                    <th className={thClass}>お客様番号</th>
                    <th className={thClass}>会社名</th>
                    <th className={thClass}>テンプレート / 種類</th>
                    <th className={thClass}>ステータス</th>
                    <th className={thClass}>依頼日</th>
                    <th className={thClass}>プレビュー</th>
                    <th className={thClass}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EFEF]">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className={`${tdClass} font-mono text-xs text-[#767676]`}>{req.users?.login_id}</td>
                      <td className={`${tdClass} font-semibold text-[#111111]`}>{req.users?.company_name}</td>
                      <td className={`${tdClass} text-[#767676] max-w-xs`}>
                        <p className="font-medium text-[#111111] truncate max-w-[160px]">{req.template_name || req.image_type}</p>
                        <p className="text-xs text-[#ABABAB]">{req.image_size}</p>
                      </td>
                      <td className={tdClass}><StatusBadge status={req.status} /></td>
                      <td className={`${tdClass} text-[#ABABAB] text-xs`}>{new Date(req.created_at).toLocaleDateString('ja-JP')}</td>
                      <td className={tdClass}>
                        {req.delivered_image_url ? (
                          <a href={req.delivered_image_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                            Drive確認
                          </a>
                        ) : (
                          <span className="text-xs text-[#ABABAB]">-</span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => setSelectedRequest(req)}
                            className="text-xs text-[#E60023] hover:underline font-semibold">
                            詳細
                          </button>
                          {req.status === 'pending' && (
                            <button onClick={() => updateStatus(req.id, 'in_progress')} disabled={updating === req.id}
                              className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50">
                              制作開始
                            </button>
                          )}
                          {(req.status === 'pending' || req.status === 'in_progress') && req.delivered_image_url && (
                            <button onClick={() => handleDeliver(req)} disabled={delivering === req.id}
                              className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors disabled:opacity-50">
                              {delivering === req.id ? '送信中...' : '📤 納品する'}
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

      {/* 詳細モーダル */}
      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="依頼詳細" size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={selectedRequest.status} />
              <span className="text-sm text-[#767676]">{selectedRequest.billing_month?.replace('-', '年')}月</span>
              <span className="text-xs bg-[#F1EFEF] text-[#767676] px-2 py-0.5 rounded-full font-mono">
                {selectedRequest.users?.login_id}
              </span>
            </div>

            {/* Driveプレビュー */}
            {selectedRequest.delivered_image_url && (
              <div className="bg-[#F1EFEF] rounded-2xl p-4">
                <p className="text-xs font-semibold text-[#767676] mb-2">📁 Googleドライブ画像</p>
                <a href={selectedRequest.delivered_image_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all">
                  {selectedRequest.delivered_image_url}
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['会社名', selectedRequest.users?.company_name],
                ['担当者', selectedRequest.users?.contact_name],
                ['メール', selectedRequest.users?.email],
                ['テンプレート', selectedRequest.template_name || '-'],
                ['種類', selectedRequest.image_type],
                ['サイズ', selectedRequest.image_size || '-'],
                ['テキスト内容', selectedRequest.text_content || '-'],
                ['備考', selectedRequest.notes || '-'],
              ].map(([label, value]) => (
                <div key={label}
                  className={`${label === '備考' || label === 'テキスト内容' ? 'col-span-2' : ''} bg-[#F1EFEF] rounded-xl p-3`}>
                  <span className="text-xs font-semibold text-[#767676] block mb-0.5">{label}</span>
                  <span className="text-sm text-[#111111] break-all">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              {selectedRequest.status === 'pending' && (
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'in_progress')}
                  disabled={updating === selectedRequest.id}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-full text-sm hover:bg-blue-700 transition-all font-bold disabled:opacity-50">
                  制作開始にする
                </button>
              )}
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress') && selectedRequest.delivered_image_url && (
                <button
                  onClick={() => handleDeliver(selectedRequest)}
                  disabled={delivering === selectedRequest.id}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-full text-sm hover:bg-emerald-700 transition-all font-bold disabled:opacity-50">
                  {delivering === selectedRequest.id ? '送信中...' : '📤 納品する（メール送信）'}
                </button>
              )}
              {selectedRequest.status === 'delivered' && (
                <div className="flex-1 bg-[#F1EFEF] text-[#767676] py-3 rounded-full text-sm text-center font-semibold">
                  ✅ 納品済み {selectedRequest.delivered_at && `（${new Date(selectedRequest.delivered_at).toLocaleDateString('ja-JP')}）`}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
