'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function FeedbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    overallRating: 0,
    qualityRating: 0,
    speedRating: 0,
    comment: '',
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      // Check if already submitted
      const { data } = await supabase
        .from('feedbacks')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('billing_month', monthParam)
        .single()
      if (data) setSubmitted(true)
    }
    init()
  }, [router, monthParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.overallRating === 0) { alert('総合評価を選択してください'); return }
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('feedbacks').insert({
      user_id: userId,
      billing_month: monthParam,
      overall_rating: form.overallRating,
      quality_rating: form.qualityRating,
      speed_rating: form.speedRating,
      comment: form.comment,
    })

    if (error) {
      alert('送信に失敗しました: ' + error.message)
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div>
      <label className="block text-xs font-bold text-[#111111] mb-2">{label}</label>
      <div className="flex gap-1.5 items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-all hover:scale-110 ${star <= value ? 'text-amber-400' : 'text-[#EFEFEF]'}`}
          >
            ★
          </button>
        ))}
        <span className="ml-1.5 text-xs text-[#767676]">{value > 0 ? `${value}点` : '未評価'}</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F1EFEF]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <Link href="/dashboard" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] hover:bg-[#F1EFEF] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-bold text-[#111111]">フィードバック</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 sm:p-8">
          <div className="mb-6">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Feedback</span>
            <h2 className="text-xl font-black text-[#111111] mt-1">{monthParam.replace('-', '年')}月のサービス評価</h2>
            <p className="text-sm text-[#767676] mt-1">今月のサービスについてご意見をお聞かせください</p>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#FFE8EC] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🙏</div>
              <h3 className="font-black text-[#111111] mb-2">ご回答ありがとうございました</h3>
              <p className="text-sm text-[#767676] mb-6">いただいたご意見はサービス改善に活用いたします。</p>
              <Link href="/dashboard" className="text-[#E60023] hover:underline text-sm font-semibold">ダッシュボードに戻る</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <StarRating label="総合評価 *" value={form.overallRating} onChange={v => setForm(p => ({ ...p, overallRating: v }))} />
              <StarRating label="画像クオリティ" value={form.qualityRating} onChange={v => setForm(p => ({ ...p, qualityRating: v }))} />
              <StarRating label="対応スピード" value={form.speedRating} onChange={v => setForm(p => ({ ...p, speedRating: v }))} />
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-2">コメント（任意）</label>
                <textarea
                  value={form.comment}
                  onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                  rows={4}
                  placeholder="ご感想やご要望があればご記入ください"
                  className="w-full border border-[#EFEFEF] rounded-2xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all bg-[#FAFAFA] resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E60023] text-white font-bold py-4 rounded-full hover:bg-[#C0001E] transition-all disabled:opacity-50 shadow-md shadow-red-100"
              >
                {loading ? '送信中...' : 'フィードバックを送信する'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F1EFEF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#E60023] border-t-transparent rounded-full animate-spin" /></div>}>
      <FeedbackContent />
    </Suspense>
  )
}
