'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import ImageRequestForm, { type RequestFormData } from '@/components/forms/ImageRequestForm'

interface UsageLimit {
  used_count: number
  total_limit: number
}

interface ImageRequest {
  id: string
  status: string
  production_types: string[]
  design_image: string
  created_at: string
  delivered_at: string | null
}

interface User {
  id: string
  company_name: string
  contact_name: string
  is_payment_registered: boolean
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [usage, setUsage] = useState<UsageLimit | null>(null)
  const [requests, setRequests] = useState<ImageRequest[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'delivered'>('pending')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const billingMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setUser(userData)

      if (userData && !userData.is_payment_registered && userData.role !== 'admin') {
        setShowPaymentModal(true)
      }

      const { data: usageData } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('billing_month', billingMonth)
        .single()
      setUsage(usageData ?? { used_count: 0, total_limit: 10 })

      const { data: requestData } = await supabase
        .from('image_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('billing_month', billingMonth)
        .order('created_at', { ascending: false })
      setRequests(requestData ?? [])
      setLoading(false)
    }
    init()
  }, [router, billingMonth])

  const handleRequestSubmit = async (formData: RequestFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          production_types: formData.production_types,
          production_purpose: formData.production_purpose,
          design_image: formData.design_image,
          template_id: formData.template_id || null,
          template_name: formData.template_name || null,
          target: formData.target,
          media_types: formData.media_types,
          image_size: formData.image_size,
          custom_size: formData.custom_size,
          text_content: formData.text_content,
          cta_action: formData.cta_action,
          delivery_speed: formData.delivery_speed,
          other_requests: formData.other_requests,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '依頼の送信に失敗しました')
      }
      setShowRequestForm(false)
      // Refresh
      window.location.reload()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '依頼の送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredRequests = requests.filter(r => r.status === activeTab)
  const remaining = (usage?.total_limit ?? 10) - (usage?.used_count ?? 0)

  const usedPct = Math.round(((usage?.used_count ?? 0) / (usage?.total_limit ?? 10)) * 100)

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
          <div className="flex items-center gap-1">
            <Link href="/dashboard/settings" className="text-xs text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all">店舗情報</Link>
            <Link href="/dashboard/history" className="text-xs text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all">履歴</Link>
            <Link href="/dashboard/feedback" className="text-xs text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all">フィードバック</Link>
            <button onClick={handleLogout} className="text-xs text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all">ログアウト</button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero CTA card */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gradient uppercase tracking-widest mb-1">
                {billingMonth.replace('-', '年')}月
              </p>
              <h1 className="text-xl font-black text-[#111111] truncate">{user?.company_name} 様</h1>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className={`text-4xl font-black leading-none ${remaining <= 2 ? 'text-[#E85C97]' : 'text-[#111111]'}`}>
                  {remaining}
                </span>
                <span className="text-sm text-[#ABABAB]">回 残り / {usage?.total_limit ?? 10}回</span>
              </div>
              <div className="w-full max-w-[200px] bg-[#F8F8FA] rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${usedPct >= 80 ? 'bg-[#E85C97]' : 'bg-[#111111]'}`}
                  style={{ width: `${Math.min(usedPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#ABABAB] mt-1.5">未使用分の翌月繰越は不可</p>
            </div>
            <button
              onClick={() => {
                if (!user?.is_payment_registered && user?.role !== 'admin') { setShowPaymentModal(true); return }
                if (remaining <= 0) { alert('今月の依頼上限に達しています'); return }
                setShowRequestForm(true)
              }}
              disabled={remaining <= 0}
              className="btn-gradient inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-full text-base disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
            >
              <span className="text-lg leading-none">＋</span>新しい依頼をする
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '使用回数', value: `${usage?.used_count ?? 0}`, sub: `/ ${usage?.total_limit ?? 10}回` },
            { label: '依頼中', value: `${requests.filter(r => r.status === 'pending').length}`, sub: '件' },
            { label: '制作中', value: `${requests.filter(r => r.status === 'in_progress').length}`, sub: '件' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-[#6B7280] mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-[#111111]">{stat.value}</span>
                <span className="text-xs text-[#ABABAB]">{stat.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Request list */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#F8F8FA] px-2 pt-2 gap-1">
            {([
              ['pending', '依頼中'],
              ['in_progress', '制作中'],
              ['delivered', '納品済み'],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  activeTab === tab
                    ? 'bg-[#111111] text-white'
                    : 'text-[#6B7280] hover:bg-[#F8F8FA]'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#F8F8FA] text-[#6B7280]'}`}>
                  {requests.filter(r => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-[#ABABAB]">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">
                {activeTab === 'pending' ? '依頼中の案件はありません' :
                 activeTab === 'in_progress' ? '制作中の案件はありません' :
                 '納品済みの案件はありません'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F8F8FA]">
              {filteredRequests.map(req => (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111111] text-sm truncate">
                      {(req.production_types ?? []).slice(0, 2).join('・') || '依頼'}
                    </p>
                    <p className="text-xs text-[#ABABAB] mt-0.5">
                      {req.design_image ?? ''}{req.design_image ? ' • ' : ''}{new Date(req.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment modal（お支払いは請求書方式：請求管理ロボ。担当者が設定後に依頼可能になる） */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="お支払い設定について">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[#FFF0F6] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🧾</div>
          <p className="text-[#6B7280] mb-6 text-sm leading-relaxed">
            お支払いは<strong className="text-[#111111]">請求書でのご案内</strong>となります。<br />
            担当者がお支払い設定を行った後、デザイン依頼をご利用いただけます。<br />
            ご不明点は担当者までお問い合わせください。
          </p>
          <button
            onClick={() => setShowPaymentModal(false)}
            className="btn-gradient w-full font-bold py-4 rounded-full"
          >
            確認しました
          </button>
        </div>
      </Modal>

      {/* Request form modal */}
      <Modal
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        title="画像依頼フォーム"
        size="lg"
      >
        <ImageRequestForm
          onSubmit={handleRequestSubmit}
          onCancel={() => setShowRequestForm(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}
