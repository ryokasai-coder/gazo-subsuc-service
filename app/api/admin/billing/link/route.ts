import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data } = await service.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? service : null
}

export async function POST(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recordId, billingCode, userId } = await req.json()

  // userId直接指定がある場合はそのまま使用、なければbilling_codeで検索
  let resolvedUserId = userId as string | null
  let companyName = ''

  if (!resolvedUserId && billingCode) {
    const { data: userData } = await service
      .from('users')
      .select('id, company_name')
      .eq('billing_code', billingCode)
      .single()
    if (!userData) {
      return NextResponse.json({ error: `請求コード ${billingCode} に一致するユーザーが見つかりません` }, { status: 404 })
    }
    resolvedUserId = userData.id
    companyName = userData.company_name
  } else if (resolvedUserId) {
    const { data: userData } = await service
      .from('users')
      .select('id, company_name')
      .eq('id', resolvedUserId)
      .single()
    if (!userData) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    companyName = userData.company_name

    // billing_codeをユーザーに紐付け（以降の自動マッチのため）
    if (billingCode) {
      await service.from('users').update({ billing_code: billingCode }).eq('id', resolvedUserId)
    }
  }

  // billing_recordsを更新
  if (recordId) {
    const { error } = await service
      .from('billing_records')
      .update({ user_id: resolvedUserId })
      .eq('id', recordId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, companyName })
}
