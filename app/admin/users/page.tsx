'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface User {
  id: string
  login_id: string
  email: string
  company_name: string
  contact_name: string
  phone: string
  role: string
  is_active: boolean
  is_payment_registered: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data.filter((u: User) => u.role !== 'admin'))
    }
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      const { data: ud } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (ud?.role !== 'admin') { router.push('/admin/login'); return }
      fetchUsers()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const toggleActive = async (user: User) => {
    setActionLoading(user.id + '_active')
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    }
    setActionLoading('')
  }

  const resetPassword = async (user: User) => {
    if (!confirm(`${user.company_name} にパスワードリセットメールを送信しますか？`)) return
    setActionLoading(user.id + '_pw')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_password', userId: user.id }),
    })
    const data = await res.json()
    if (res.ok) {
      alert('✅ パスワードリセットメールを送信しました')
    } else {
      alert('エラー: ' + data.error)
    }
    setActionLoading('')
  }

  const filtered = users.filter(u =>
    u.company_name?.includes(search) ||
    u.login_id?.includes(search) ||
    u.email?.includes(search)
  )

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
          <h1 className="font-bold text-[#111111]">ユーザー管理</h1>
          <div className="ml-auto">
            <input
              type="text"
              placeholder="会社名・ID・メールで検索"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-[#EFEFEF] rounded-full px-4 py-2 text-sm text-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all w-64"
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* サマリー */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-black text-[#111111]">{users.length}</div>
            <div className="text-xs text-[#767676] mt-1">総ユーザー数</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-black text-emerald-600">{users.filter(u => u.is_payment_registered).length}</div>
            <div className="text-xs text-[#767676] mt-1">決済登録済み</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-black text-amber-500">{users.filter(u => !u.is_payment_registered).length}</div>
            <div className="text-xs text-[#767676] mt-1">決済未登録</div>
          </div>
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
                    <th className={thClass}>会社名 / 担当者</th>
                    <th className={thClass}>メール</th>
                    <th className={thClass}>決済登録</th>
                    <th className={thClass}>ステータス</th>
                    <th className={thClass}>登録日</th>
                    <th className={thClass}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EFEF]">
                  {filtered.map(user => (
                    <tr key={user.id} className={`transition-colors ${user.is_active ? 'hover:bg-[#FAFAFA]' : 'bg-gray-50 opacity-60'}`}>
                      <td className={`${tdClass} font-mono text-xs font-bold text-[#E60023]`}>{user.login_id}</td>
                      <td className={tdClass}>
                        <p className="font-semibold text-[#111111]">{user.company_name}</p>
                        <p className="text-xs text-[#ABABAB]">{user.contact_name}</p>
                      </td>
                      <td className={`${tdClass} text-xs text-[#767676]`}>{user.email}</td>
                      <td className={tdClass}>
                        {user.is_payment_registered ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200">登録済</span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-200">未登録</span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={actionLoading === user.id + '_active'}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all disabled:opacity-50 ${
                            user.is_active
                              ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                              : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {actionLoading === user.id + '_active' ? '...' : user.is_active ? '有効' : '無効'}
                        </button>
                      </td>
                      <td className={`${tdClass} text-xs text-[#ABABAB]`}>
                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className={tdClass}>
                        <button
                          onClick={() => resetPassword(user)}
                          disabled={actionLoading === user.id + '_pw'}
                          className="text-xs bg-[#F1EFEF] text-[#767676] px-2.5 py-1 rounded-full hover:bg-[#E0DEDE] transition-all disabled:opacity-50"
                        >
                          {actionLoading === user.id + '_pw' ? '送信中...' : 'PW再設定'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-[#ABABAB] text-sm">
                  {search ? '検索結果がありません' : 'ユーザーがいません'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
