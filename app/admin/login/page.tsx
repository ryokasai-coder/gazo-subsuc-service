'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // login_idからメアドを取得
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId }),
    })
    if (!res.ok) {
      setError('IDまたはパスワードが正しくありません')
      setLoading(false)
      return
    }
    const { email } = await res.json()

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('IDまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (userData?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('管理者権限がありません')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#F5308A] flex items-center justify-center mx-auto mb-4 text-white font-black text-xl">管</div>
          <h1 className="text-2xl font-black text-white">管理者ログイン</h1>
          <p className="text-[#767676] text-sm mt-1">画像サブスクサービス 管理画面</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10">
          {error && (
            <div className="bg-[#F5308A]/20 border border-[#F5308A]/30 text-[#FFF0F7] rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#ABABAB] mb-1.5">管理者ID</label>
              <input
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                required
                placeholder="例：ADMIN-001"
                className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5308A]/40 focus:border-[#F5308A]/60 transition-all placeholder-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#ABABAB] mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5308A]/40 focus:border-[#F5308A]/60 transition-all placeholder-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F5308A] text-white font-bold py-4 rounded-full hover:bg-[#D81B79] transition-all disabled:opacity-50 shadow-lg shadow-red-900/30 mt-2"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
