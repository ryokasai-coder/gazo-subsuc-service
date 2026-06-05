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
      <div className="min-h-screen bg-[#F1EFEF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E60023] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1EFEF]">
      {/* Header */}
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#E60023] flex items-center justify-center text-white font-bold text-xs">画</span>
            <span className="font-bold text-[#111111] text-sm hidden sm:block">画像作成サブスク</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/history" className="text-xs text-[#767676] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F1EFEF] transition-all">履歴</Link>
            <Link href="/dashboard/feedback" className="text-xs text-[#767676] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F1EFEF] transition-all">フィードバック</Link>
            <button onClick={handleLogout} className="text-xs text-[#767676] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F1EFEF] transition-all">ログアウト</button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <p className="text-xs font-bold text-[#E60023] uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-2xl font-black text-[#111111]">{user?.company_name} 様</h1>
          <p className="text-[#767676] text-sm mt-0.5">{billingMonth.replace('-', '年')}月のダッシュボード</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: '使用回数', value: `${usage?.used_count ?? 0}回`, sub: `/ ${usage?.total_limit ?? 10}回` },
            { label: '残り回数', value: `${remaining}回`, sub: '今月', red: remaining <= 2 },
            { label: '依頼中', value: `${requests.filter(r => r.status === 'pending').length}件` },
            { label: '制作中', value: `${requests.filter(r => r.status === 'in_progress').length}件` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-[#767676] mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${stat.red ? 'text-[#E60023]' : 'text-[#111111]'}`}>{stat.value}</span>
                {stat.sub && <span className="text-xs text-[#ABABAB]">{stat.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Usage card */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#111111]">今月の依頼状況</p>
            <span className="text-xs text-[#767676]">{usedPct}% 使用</span>
          </div>
          <div className="w-full bg-[#F1EFEF] rounded-full h-2.5 mb-1.5">
            <div
              className={`h-2.5 rounded-full transition-all ${usedPct >= 80 ? 'bg-[#E60023]' : 'bg-[#111111]'}`}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-[#ABABAB] mb-5">未使用分の翌月繰越は不可</p>
          <button
            onClick={() => {
              if (!user?.is_payment_registered && user?.role !== 'admin') { setShowPaymentModal(true); return }
              if (remaining <= 0) { alert('今月の依頼上限に達しています'); return }
              setShowRequestForm(true)
            }}
            className="inline-flex items-center gap-2 bg-[#E60023] text-white font-bold px-6 py-3 rounded-full hover:bg-[#C0001E] transition-all shadow-md shadow-red-100 text-sm"
          >
            <span>＋</span>新しい依頼をする
          </button>
        </div>

        {/* Request list */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#F1EFEF] px-2 pt-2 gap-1">
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
                    : 'text-[#767676] hover:bg-[#F1EFEF]'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#F1EFEF] text-[#767676]'}`}>
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
            <div className="divide-y divide-[#F1EFEF]">
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

      {/* Payment modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="決済登録が必要です">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[#FFE8EC] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💳</div>
          <p className="text-[#767676] mb-6 text-sm leading-relaxed">
            サービスをご利用いただくには<br />決済情報の登録が必要です。
          </p>
          <button
            onClick={() => {
              alert('決済登録ページへ遷移します（実装時に決済URLを設定してください）')
              setShowPaymentModal(false)
            }}
            className="w-full bg-[#E60023] text-white font-bold py-4 rounded-full hover:bg-[#C0001E] transition-all shadow-md shadow-red-100"
          >
            決済登録をする
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
