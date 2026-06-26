'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Stats {
  totalUsers: number
  activeUsers: number
  pendingRequests: number
  inProgressRequests: number
  deliveredThisMonth: number
  unpaidCount: number
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const billingMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }

      const { data: userData } = await supabase
        .from('users').select('role').eq('id', session.user.id).single()
      if (userData?.role !== 'admin') { router.push('/admin/login'); return }

      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: pending },
        { count: inProgress },
        { count: delivered },
        { count: unpaid },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('image_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('image_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('image_requests').select('*', { count: 'exact', head: true }).eq('status', 'delivered').eq('billing_month', billingMonth),
        supabase.from('billing_records').select('*', { count: 'exact', head: true }).eq('status', 'unpaid').eq('billing_month', billingMonth),
      ])

      setStats({
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        pendingRequests: pending ?? 0,
        inProgressRequests: inProgress ?? 0,
        deliveredThisMonth: delivered ?? 0,
        unpaidCount: unpaid ?? 0,
      })
      setLoading(false)
    }
    init()
  }, [router, billingMonth])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin/projects', label: '案件管理', icon: '🎨', desc: '依頼の確認・ステータス変更・納品' },
    { href: '/admin/billing', label: '請求管理', icon: '💰', desc: 'CSV取込・支払い状況確認' },
    { href: '/admin/users', label: 'ユーザー管理', icon: '👥', desc: '登録ユーザー一覧・有効化・PW再設定' },
    { href: '/admin/remaining', label: '依頼数管理', icon: '📊', desc: 'ユーザーの残り依頼数確認' },
    { href: '/admin/feedback', label: 'フィードバック', icon: '⭐', desc: '評価・コメント一覧' },
  ]

  return (
    <div className="min-h-screen bg-[#F1EFEF]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#E60023] flex items-center justify-center text-white font-bold text-xs">管</span>
            <span className="font-bold text-[#111111] text-sm">管理ダッシュボード</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-[#767676] hover:text-[#111111] px-3 py-1.5 rounded-full hover:bg-[#F1EFEF] transition-all">ログアウト</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold text-[#E60023] uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-black text-[#111111]">管理ダッシュボード</h1>
          <p className="text-[#767676] text-sm mt-0.5">{billingMonth.replace('-', '年')}月 概要</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#E60023] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: '総ユーザー数', value: stats?.totalUsers, red: false },
                { label: '有効ユーザー', value: stats?.activeUsers, red: false },
                { label: '依頼中', value: stats?.pendingRequests, red: false },
                { label: '制作中', value: stats?.inProgressRequests, red: false },
                { label: '今月納品', value: stats?.deliveredThisMonth, red: false },
                { label: '未払い', value: stats?.unpaidCount, red: (stats?.unpaidCount ?? 0) > 0 },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <div className={`text-2xl font-black ${item.red ? 'text-[#E60023]' : 'text-[#111111]'}`}>{item.value}</div>
                  <div className="text-xs text-[#767676] mt-1">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-3xl p-6 shadow-sm card-hover"
                >
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <div className="font-bold text-[#111111] mb-1">{item.label}</div>
                  <div className="text-xs text-[#767676]">{item.desc}</div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-[#E60023] font-semibold">
                    開く
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
