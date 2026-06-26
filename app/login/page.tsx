'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
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
      setError('お客様番号またはパスワードが正しくありません')
      setLoading(false)
      return
    }
    const { email } = await res.json()

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('お客様番号またはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F1EFEF] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#EFEFEF] px-4">
        <div className="max-w-6xl mx-auto h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#E60023] flex items-center justify-center text-white font-bold text-xs">D</span>
            <span className="font-bold text-[#111111] text-sm hidden sm:block">DESIGN BOX</span>
          </Link>
          <Link href="/apply" className="text-sm text-[#767676] hover:text-[#111111] transition-colors">新規お申し込み</Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Login</span>
            <h1 className="text-3xl font-black text-[#111111] mt-2 mb-2">ログイン</h1>
            <p className="text-[#767676] text-sm">アカウント情報を入力してください</p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 sm:p-8">
            {error && (
              <div className="bg-[#FFE8EC] border border-red-100 text-[#E60023] rounded-xl px-4 py-3 text-sm mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5">お客様番号</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  placeholder="例：C-0001"
                  className="w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all bg-[#FAFAFA]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5">パスワード</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="パスワード"
                  className="w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all bg-[#FAFAFA]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E60023] text-white font-bold py-4 rounded-full hover:bg-[#C0001E] transition-all disabled:opacity-50 shadow-md shadow-red-100 mt-2"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[#ABABAB]">
              アカウントをお持ちでない方は
              <Link href="/apply" className="text-[#E60023] hover:underline ml-1">
                こちらから申し込み
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
