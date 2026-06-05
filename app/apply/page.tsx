'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const TERMS = `画像作成サブスクサービス（仮）利用規約

第1条（目的）
本規約は、画像作成サブスクサービス（仮）（以下「本サービス」といいます）の利用条件を定めるものです。

第2条（利用申し込み）
本サービスの利用希望者は、本規約に同意の上、所定の申し込み手続きを行うものとします。申し込みの承諾をもって、本サービスの利用契約（以下「本契約」といいます）が成立するものとします。

第3条（料金）
1. 本サービスの利用料金は月額20,000円（税抜）とします。
2. 利用料金は毎月月初に翌月分を請求いたします。
3. 支払い方法はクレジットカード払いのみとします。

第4条（依頼回数）
1. 月間依頼回数は10回を上限とします。
2. 未使用の依頼回数は翌月に繰り越すことができません。

第5条（納品）
1. 依頼受付から原則3〜5営業日以内に納品します。
2. 修正は1依頼につき2回まで無料で対応します。
3. 修正依頼は納品後7日以内にお申し出ください。

第6条（禁止事項）
利用者は以下の行為を行ってはなりません。
1. 法令または公序良俗に違反するコンテンツの制作依頼
2. 第三者の知的財産権を侵害する行為
3. 本サービスの運営を妨げる行為
4. その他、当社が不適切と判断する行為

第7条（解約）
1. 利用者は月末までに解約の申し出を行うことで、翌月末をもって本契約を解約できます。
2. 解約の申し出はマイページまたは所定のメールアドレス宛にご連絡ください。

第8条（免責事項）
当社は、本サービスの提供に関して、利用者または第三者が被った損害について、当社の故意または重過失による場合を除き、責任を負わないものとします。

第9条（個人情報の取り扱い）
当社は、利用者の個人情報を本サービスの提供に必要な範囲で利用し、法令に基づく場合を除き、第三者に提供しません。

第10条（規約の変更）
当社は、必要と判断した場合、利用者への通知なく本規約を変更できるものとします。変更後も本サービスを利用した場合、変更後の規約に同意したものとみなします。

以上`

export default function ApplyPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginId, setLoginId] = useState('')
  const [termsScrolled, setTermsScrolled] = useState(false)
  const termsRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    emailConfirm: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleTermsScroll = () => {
    const el = termsRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setTermsScrolled(true)
    }
  }

  const validateStep1 = () => {
    if (!form.companyName || !form.contactName || !form.email || !form.phone || !form.password) {
      setError('すべての項目を入力してください')
      return false
    }
    if (form.email !== form.emailConfirm) {
      setError('メールアドレスが一致しません')
      return false
    }
    if (form.password !== form.passwordConfirm) {
      setError('パスワードが一致しません')
      return false
    }
    if (form.password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setError('正しいメールアドレスを入力してください')
      return false
    }
    setError('')
    return true
  }

  const handleStep1Next = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          contactName: form.contactName,
          phone: form.phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '申し込みに失敗しました')
      setLoginId(data.loginId)
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '申し込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all bg-[#FAFAFA]"
  const labelClass = "block text-xs font-semibold text-[#111111] mb-1.5"

  return (
    <div className="min-h-screen bg-[#F1EFEF]">
      {/* Header */}
      <header className="bg-white border-b border-[#EFEFEF] px-4">
        <div className="max-w-6xl mx-auto h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#E60023] flex items-center justify-center text-white font-bold text-xs">画</span>
            <span className="font-bold text-[#111111] text-sm hidden sm:block">画像作成サブスクサービス（仮）</span>
          </Link>
          <Link href="/login" className="text-sm text-[#767676] hover:text-[#111111] transition-colors">ログインはこちら</Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Sign Up</span>
          <h1 className="text-3xl font-black text-[#111111] mt-2 mb-2">新規お申し込み</h1>
          <p className="text-[#767676] text-sm">必要事項を入力してアカウントを作成してください</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {[{ label: '基本情報', n: 1 }, { label: '利用規約', n: 2 }, { label: '完了', n: 3 }].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.n < step ? 'bg-[#E60023] text-white' :
                  s.n === step ? 'bg-[#E60023] text-white ring-4 ring-[#FFE8EC]' :
                  'bg-[#EFEFEF] text-[#ABABAB]'
                }`}>
                  {s.n < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.n}
                </div>
                <span className={`text-xs mt-1 ${s.n <= step ? 'text-[#E60023] font-semibold' : 'text-[#ABABAB]'}`}>{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-2 mb-4 ${s.n < step ? 'bg-[#E60023]' : 'bg-[#EFEFEF]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 sm:p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-base font-bold text-[#111111] mb-5">基本情報の入力</h2>
              {error && (
                <div className="bg-[#FFE8EC] border border-red-100 text-[#E60023] rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                {[
                  { name: 'companyName', label: '会社名・屋号', placeholder: '株式会社〇〇', type: 'text' },
                  { name: 'contactName', label: '担当者名', placeholder: '山田 太郎', type: 'text' },
                  { name: 'email', label: 'メールアドレス', placeholder: 'example@company.com', type: 'email' },
                  { name: 'emailConfirm', label: 'メールアドレス（確認）', placeholder: 'example@company.com', type: 'email' },
                  { name: 'phone', label: '電話番号', placeholder: '090-1234-5678', type: 'tel' },
                  { name: 'password', label: 'パスワード', placeholder: '8文字以上', type: 'password' },
                  { name: 'passwordConfirm', label: 'パスワード（確認）', placeholder: 'パスワードを再入力', type: 'password' },
                ].map(({ name, label, placeholder, type }) => (
                  <div key={name}>
                    <label className={labelClass}>{label} <span className="text-[#E60023]">*</span></label>
                    <input
                      type={type}
                      name={name}
                      value={form[name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleStep1Next}
                className="mt-6 w-full bg-[#E60023] text-white font-bold py-4 rounded-full hover:bg-[#C0001E] transition-all shadow-md shadow-red-100"
              >
                次へ：利用規約を確認する
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-base font-bold text-[#111111] mb-2">利用規約の確認</h2>
              <p className="text-xs text-[#767676] mb-4">最後までスクロールして読むと同意ボタンが有効になります。</p>
              <div
                ref={termsRef}
                onScroll={handleTermsScroll}
                className="border border-[#EFEFEF] rounded-2xl p-4 h-64 overflow-y-scroll text-sm text-[#767676] whitespace-pre-wrap leading-relaxed mb-4 bg-[#FAFAFA]"
              >
                {TERMS}
              </div>
              {error && (
                <div className="bg-[#FFE8EC] border border-red-100 text-[#E60023] rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!termsScrolled || loading}
                className={`w-full font-bold py-4 rounded-full transition-all ${
                  termsScrolled && !loading
                    ? 'bg-[#E60023] text-white hover:bg-[#C0001E] shadow-md shadow-red-100'
                    : 'bg-[#EFEFEF] text-[#ABABAB] cursor-not-allowed'
                }`}
              >
                {loading ? '送信中...' : '利用規約に同意して申し込む'}
              </button>
              <button
                onClick={() => setStep(1)}
                className="mt-3 w-full text-sm text-[#767676] hover:text-[#111111] py-2 transition-colors"
              >
                ← 前に戻る
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFE8EC] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-[#E60023]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-[#111111] mb-2">お申し込みが完了しました！</h2>
              <p className="text-[#767676] text-sm mb-6">ご登録のメールアドレスにログインIDをお送りしました。</p>

              {loginId && (
                <div className="bg-[#FFE8EC] rounded-2xl p-4 mb-6 text-left">
                  <p className="text-xs text-[#E60023] font-semibold mb-1">ログインID</p>
                  <p className="text-lg font-black text-[#E60023]">{loginId}</p>
                  <p className="text-xs text-[#767676] mt-2">このIDはメールにも記載されています。大切に保管してください。</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 mb-6 text-left">
                <p className="font-semibold mb-2">次のステップ</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>ログインする</li>
                  <li>ダッシュボードから決済情報を登録する</li>
                  <li>画像依頼を開始する</li>
                </ol>
              </div>

              <Link href="/login" className="block w-full bg-[#E60023] text-white font-bold py-4 rounded-full hover:bg-[#C0001E] transition-all shadow-md shadow-red-100">
                ログインページへ
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#ABABAB] mt-6">
          すでにアカウントをお持ちの方は
          <Link href="/login" className="text-[#E60023] hover:underline ml-1">こちら</Link>
        </p>
      </div>
    </div>
  )
}
