'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BillingImport from '@/components/admin/BillingImport'

interface BillingRecord {
  id: string
  user_id: string | null
  billing_name: string
  billing_code: string
  billing_month: string
  invoice_number: string
  product_name: string
  billing_amount: number
  payment_due: string | null
  payment_date: string | null
  clearing_status: string
  users?: { company_name: string; email: string }
}

interface BillingContract {
  id: string
  billing_code: string
  product_name: string
  unit_price: number
  billing_type: string
  users?: { company_name: string }
}

interface UserRow {
  id: string
  company_name: string
}

const STATUS_STYLES: Record<string, string> = {
  '完了': 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200',
  '未収': 'text-[#E60023] bg-[#FFE8EC] ring-1 ring-red-200',
  '未処理': 'text-[#767676] bg-[#F1EFEF]',
}

export default function AdminBillingPage() {
  const router = useRouter()
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [contracts, setContracts] = useState<BillingContract[]>([])
  const [allUsers, setAllUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7))
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUnlinked, setFilterUnlinked] = useState(false)
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'records' | 'contracts'>('records')

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let q = supabase
      .from('billing_records')
      .select('*, users(company_name, email)')
      .eq('billing_month', billingMonth)
      .order('created_at', { ascending: false })
    if (filterStatus) q = q.eq('clearing_status', filterStatus)
    if (filterUnlinked) q = q.is('user_id', null)
    const { data: recs } = await q
    setRecords((recs as BillingRecord[]) ?? [])

    const { data: cons } = await supabase
      .from('billing_contracts')
      .select('*, users(company_name)')
      .eq('billing_type', '1')
      .order('created_at', { ascending: false })
    setContracts((cons as BillingContract[]) ?? [])

    const { data: users } = await supabase.from('users').select('id, company_name')
    setAllUsers((users as UserRow[]) ?? [])

    setLoading(false)
  }, [billingMonth, filterStatus, filterUnlinked])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      const { data: ud } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (ud?.role !== 'admin') { router.push('/admin/login'); return }
      fetchData()
    }
    init()
  }, [router, fetchData])

  const handleLink = async (recordId: string, billingCode: string) => {
    const userId = linkInputs[recordId]
    if (!userId) { alert('ユーザーを選択してください'); return }
    const res = await fetch('/api/admin/billing/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, billingCode, userId }),
    })
    if (res.ok) {
      setLinkInputs(prev => { const n = { ...prev }; delete n[recordId]; return n })
      fetchData()
    } else {
      const d = await res.json()
      alert('エラー: ' + d.error)
    }
  }

  const sendDunning = async (userId: string, email: string) => {
    if (!confirm(`${email} に督促メールを送信しますか？`)) return
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dunning', userId }),
    })
    alert('督促メールを送信しました')
  }

  // Summary counts
  const completed = records.filter(r => r.clearing_status === '完了')
  const uncollected = records.filter(r => r.clearing_status === '未収')
  const unprocessed = records.filter(r => r.clearing_status === '未処理')
  const unlinked = records.filter(r => !r.user_id)
  const activeContracts = contracts.length

  const totalCompleted = completed.reduce((s, r) => s + (r.billing_amount ?? 0), 0)
  const totalUncollected = uncollected.reduce((s, r) => s + (r.billing_amount ?? 0), 0)
  const totalUnprocessed = unprocessed.reduce((s, r) => s + (r.billing_amount ?? 0), 0)

  const thClass = "text-left px-4 py-3 text-xs font-semibold text-[#767676] whitespace-nowrap"
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
          <h1 className="font-bold text-[#111111]">請求管理</h1>
          <div className="ml-auto">
            <select value={billingMonth} onChange={e => setBillingMonth(e.target.value)}
              className="border border-[#EFEFEF] rounded-full px-4 py-2 text-sm text-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 transition-all">
              {months.map(m => <option key={m} value={m}>{m.replace('-', '年')}月</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <BillingImport billingMonth={billingMonth} onImported={fetchData} />

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border-t-2 border-emerald-400">
            <div className="text-2xl font-black text-[#111111]">{completed.length}件</div>
            <div className="text-xs text-[#767676] mt-0.5">完了</div>
            <div className="text-sm font-semibold text-emerald-600">¥{totalCompleted.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border-t-2 border-[#E60023]">
            <div className="text-2xl font-black text-[#E60023]">{uncollected.length}件</div>
            <div className="text-xs text-[#767676] mt-0.5">未収</div>
            <div className="text-sm font-semibold text-[#E60023]">¥{totalUncollected.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border-t-2 border-[#ABABAB]">
            <div className="text-2xl font-black text-[#111111]">{unprocessed.length}件</div>
            <div className="text-xs text-[#767676] mt-0.5">未処理</div>
            <div className="text-sm font-semibold text-[#767676]">¥{totalUnprocessed.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border-t-2 border-[#111111]">
            <div className="text-2xl font-black text-[#111111]">{activeContracts}社</div>
            <div className="text-xs text-[#767676] mt-0.5">契約中顧客数</div>
            <div className="text-sm text-[#ABABAB]">月額契約</div>
          </div>
        </div>

        {unlinked.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">未紐付けの顧客が {unlinked.length} 件あります</p>
              <p className="text-xs text-amber-700 mt-0.5">下の一覧から「ユーザー紐付け」ボタンで紐付けてください。</p>
            </div>
          </div>
        )}

        {uncollected.length > 0 && (
          <div className="bg-[#FFE8EC] border border-red-100 rounded-2xl p-4">
            <h3 className="font-bold text-[#E60023] mb-2.5 text-sm">🚨 未収アラート（{uncollected.length}件）</h3>
            <div className="space-y-2">
              {uncollected.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#E60023]">
                    {r.users?.company_name ?? r.billing_name ?? r.billing_code} — ¥{r.billing_amount?.toLocaleString() ?? '-'}
                  </span>
                  {r.user_id && (
                    <button onClick={() => sendDunning(r.user_id!, r.users?.email ?? '')}
                      className="text-xs bg-white text-[#E60023] font-semibold px-3 py-1 rounded-full border border-red-200 hover:bg-red-50 transition-all">
                      督促メール送信
                    </button>
                  )}
                </div>
              ))}
              {uncollected.length > 5 && <p className="text-xs text-[#E60023] opacity-70">他 {uncollected.length - 5} 件…</p>}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm w-fit">
          {(['records', 'contracts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === tab ? 'bg-[#111111] text-white shadow-sm' : 'text-[#767676] hover:bg-[#F1EFEF]'
              }`}>
              {tab === 'records' ? '請求明細' : '請求情報（契約マスタ）'}
            </button>
          ))}
        </div>

        {activeTab === 'records' && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#F1EFEF]">
              <h3 className="font-bold text-[#111111] text-sm">請求明細一覧</h3>
              <div className="ml-auto flex gap-2 flex-wrap">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="border border-[#EFEFEF] rounded-full px-3 py-1.5 text-sm text-[#111111] bg-white focus:outline-none">
                  <option value="">すべて</option>
                  <option value="完了">完了</option>
                  <option value="未収">未収</option>
                  <option value="未処理">未処理</option>
                </select>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer text-[#767676]">
                  <input type="checkbox" checked={filterUnlinked} onChange={e => setFilterUnlinked(e.target.checked)} className="accent-[#E60023] rounded" />
                  未紐付けのみ
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F1EFEF] border-b border-[#EFEFEF]">
                  <tr>
                    <th className={thClass}>顧客名</th>
                    <th className={thClass}>請求先コード</th>
                    <th className={thClass}>商品名</th>
                    <th className={thClass}>請求金額</th>
                    <th className={thClass}>決済期限</th>
                    <th className={thClass}>消込ステータス</th>
                    <th className={thClass}>紐付け</th>
                    <th className={thClass}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EFEF]">
                  {records.map(rec => (
                    <tr key={rec.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className={`${tdClass} font-semibold text-[#111111]`}>
                        {rec.users?.company_name ?? rec.billing_name ?? <span className="text-[#ABABAB] italic text-xs">未紐付け</span>}
                      </td>
                      <td className={`${tdClass} font-mono text-xs text-[#767676]`}>{rec.billing_code}</td>
                      <td className={`${tdClass} text-[#767676] max-w-xs truncate`}>{rec.product_name}</td>
                      <td className={`${tdClass} font-semibold text-[#111111]`}>¥{rec.billing_amount?.toLocaleString() ?? '-'}</td>
                      <td className={`${tdClass} text-[#ABABAB] text-xs`}>{rec.payment_due ?? '-'}</td>
                      <td className={tdClass}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[rec.clearing_status] ?? 'text-[#767676] bg-[#F1EFEF]'}`}>
                          {rec.clearing_status ?? '未処理'}
                        </span>
                      </td>
                      <td className={`${tdClass} text-xs`}>
                        {rec.user_id ? <span className="text-emerald-600 font-semibold">◎ 紐付済</span> : <span className="text-amber-500">△ 未紐付</span>}
                      </td>
                      <td className={tdClass}>
                        {!rec.user_id && (
                          <div className="flex items-center gap-1">
                            <select value={linkInputs[rec.id] ?? ''} onChange={e => setLinkInputs(p => ({ ...p, [rec.id]: e.target.value }))}
                              className="border border-[#EFEFEF] rounded-lg px-1.5 py-1 text-xs w-32 bg-white">
                              <option value="">ユーザー選択</option>
                              {allUsers.map(u => <option key={u.id} value={u.id}>{u.company_name}</option>)}
                            </select>
                            <button onClick={() => handleLink(rec.id, rec.billing_code)}
                              className="text-xs bg-[#FFE8EC] text-[#E60023] font-semibold px-2.5 py-1 rounded-full hover:bg-red-100 transition-all">
                              保存
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#E60023] border-t-transparent rounded-full animate-spin" /></div>}
              {!loading && records.length === 0 && <div className="text-center py-12 text-[#ABABAB] text-sm">データがありません</div>}
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1EFEF]">
              <h3 className="font-bold text-[#111111] text-sm">請求情報（契約中：billing_type=1）</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F1EFEF] border-b border-[#EFEFEF]">
                  <tr>
                    <th className={thClass}>顧客名</th>
                    <th className={thClass}>請求先コード</th>
                    <th className={thClass}>商品名</th>
                    <th className={thClass}>単価</th>
                    <th className={thClass}>紐付け</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EFEF]">
                  {contracts.map(con => (
                    <tr key={con.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className={`${tdClass} font-semibold text-[#111111]`}>
                        {con.users?.company_name ?? <span className="text-[#ABABAB] italic text-xs">未紐付け</span>}
                      </td>
                      <td className={`${tdClass} font-mono text-xs text-[#767676]`}>{con.billing_code}</td>
                      <td className={`${tdClass} text-[#767676]`}>{con.product_name}</td>
                      <td className={`${tdClass} font-semibold text-[#111111]`}>¥{con.unit_price?.toLocaleString() ?? '-'}</td>
                      <td className={`${tdClass} text-xs`}>
                        {con.users ? <span className="text-emerald-600 font-semibold">◎ 紐付済</span> : <span className="text-amber-500">△ 未紐付</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && contracts.length === 0 && <div className="text-center py-12 text-[#ABABAB] text-sm">データがありません</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
