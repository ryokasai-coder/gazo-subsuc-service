'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// 店舗情報設定ページ。
// ここで登録した店名・住所・電話番号は、依頼フォーム（アクセス・店舗情報テンプレ等）の
// {store_name}/{address}/{tel} に自動プリフィルされ、毎回の手入力を不要にする。
export default function StoreSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // 店舗情報（店名=company_name／電話=phone／住所=address）
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: userData } = await supabase
        .from('users')
        .select('company_name, phone, address')
        .eq('id', session.user.id)
        .single()
      if (userData) {
        setCompanyName(userData.company_name ?? '')
        setPhone(userData.phone ?? '')
        setAddress(userData.address ?? '')
      }
      setLoading(false)
    }
    init()
  }, [router])

  const handleSave = async () => {
    if (!companyName.trim()) { setError('店名を入力してください'); return }
    setSaving(true); setError(''); setSaved(false)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // RLS（users_self）により本人行のみ更新可能
      const { error: updateError } = await supabase
        .from('users')
        .update({
          company_name: companyName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
      if (updateError) throw new Error(updateError.message)
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E85C97]/20 focus:border-[#E85C97] transition-all bg-[#FAFAFA]"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E85C97] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA]">
      {/* Header */}
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="DESIGN BOX ホーム">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="DESIGN BOX" className="h-7 w-auto" />
          </Link>
          <Link href="/dashboard" className="text-xs text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all">
            ← ダッシュボードへ
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-xs font-black text-gradient uppercase tracking-widest mb-1">Store settings</p>
          <h1 className="text-xl font-black text-[#111111]">店舗情報</h1>
          <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
            ここに登録した情報は、画像制作の依頼フォーム（アクセス・店舗情報などのテンプレ）に自動で入力されます。毎回の入力の手間が省けます。
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#111111] mb-1.5">
              店名 <span className="text-[#E85C97]">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="例：Cafe LUMIERE"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111111] mb-1.5">住所</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="例：〒123-4567 東京都〇〇区〇〇1-2-3"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111111] mb-1.5">電話番号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="例：03-1234-5678"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-sm text-[#E85C97] bg-[#FFF0F6] rounded-xl px-4 py-3">{error}</p>
          )}
          {saved && (
            <p className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3">店舗情報を保存しました。</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gradient w-full font-bold py-4 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
