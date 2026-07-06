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

    // サーバ側で認証（メールは返らない＝列挙防止）。成功時にセッショントークンを受領。
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    })
    if (!res.ok) {
      setError('お客様番号またはパスワードが正しくありません')
      setLoading(false)
      return
    }
    const { access_token, refresh_token } = await res.json()

    const supabase = createClient()
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token })
    if (sessionError) {
      setError('お客様番号またはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#EAEAEA] px-4">
        <div className="max-w-6xl mx-auto h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="DESIGN BOX ホーム">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="DESIGN BOX" className="h-7 w-auto" />
          </Link>
          <Link href="/apply" className="text-sm text-[#6B7280] hover:text-[#111111] transition-colors">新規お申し込み</Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-xs font-black text-gradient uppercase tracking-widest">Login</span>
            <h1 className="text-3xl font-black text-[#111111] mt-2 mb-2">ログイン</h1>
            <p className="text-[#6B7280] text-sm">アカウント情報を入力してください</p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 sm:p-8">
            {error && (
              <div className="bg-[#FFF0F6] border border-red-100 text-[#E85C97] rounded-xl px-4 py-3 text-sm mb-5">
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
                  className="w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E85C97]/20 focus:border-[#E85C97] transition-all bg-[#FAFAFA]"
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
                  className="w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E85C97]/20 focus:border-[#E85C97] transition-all bg-[#FAFAFA]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full font-bold py-4 rounded-full transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[#ABABAB]">
              アカウントをお持ちでない方は
              <Link href="/apply" className="text-[#E85C97] hover:underline ml-1">
                こちらから申し込み
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
