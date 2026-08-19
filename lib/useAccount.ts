'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  getContractInfo,
  effectiveCancellationStatus,
  type ContractInfo,
  type CancellationStatus,
} from '@/lib/contract'

// 契約・解約系ページ（契約情報/プラン/解約フロー）で共用するアカウント読み込みフック。
// users を select('*') で取得するため、マイグレーション未適用でも欠損列は undefined になり安全。
export interface AccountUser {
  id: string
  company_name: string
  contact_name: string | null
  email: string
  is_payment_registered: boolean
  is_active: boolean
  role: string
  created_at: string
  contract_start_date: string | null
  cancellation_status: string | null
  cancel_requested_at: string | null
  cancel_reason: string | null
  cancel_reason_detail: string | null
  service_end_date: string | null
}

export interface UseAccountResult {
  loading: boolean
  user: AccountUser | null
  usage: { used_count: number; total_limit: number }
  remaining: number
  contract: ContractInfo | null
  status: CancellationStatus
}

export function useAccount(): UseAccountResult {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AccountUser | null>(null)
  const [usage, setUsage] = useState<{ used_count: number; total_limit: number }>({ used_count: 0, total_limit: 10 })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const billingMonth = new Date().toISOString().slice(0, 7)

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setUser((userData as AccountUser) ?? null)

      const { data: usageData } = await supabase
        .from('usage_limits')
        .select('used_count, total_limit')
        .eq('user_id', session.user.id)
        .eq('billing_month', billingMonth)
        .single()
      if (usageData) setUsage(usageData)

      setLoading(false)
    }
    init()
  }, [router])

  const now = new Date()
  const contract = user ? getContractInfo(user, now) : null
  const status: CancellationStatus = user ? effectiveCancellationStatus(user, now) : 'active'
  const remaining = (usage.total_limit ?? 10) - (usage.used_count ?? 0)

  return { loading, user, usage, remaining, contract, status }
}
