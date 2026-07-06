import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { sendDunningEmail } from '@/lib/resend'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data } = await service.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? service : null
}

export async function GET() {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await service
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()

  // 更新可能フィールドをホワイトリスト化（role等の意図しない書換を防止）
  const ALLOWED = ['is_active', 'is_payment_registered', 'company_name', 'contact_name', 'phone', 'billing_code'] as const
  const safeUpdates: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (key in updates) safeUpdates[key] = updates[key]
  }
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: '更新可能な項目がありません' }, { status: 400 })
  }

  const { error } = await service
    .from('users')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, userId } = await req.json()

  if (action === 'dunning') {
    const { data: user } = await service.from('users').select('email, company_name').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    try {
      await sendDunningEmail({ email: user.email, companyName: user.company_name })
      return NextResponse.json({ ok: true })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
    }
  }

  if (action === 'reset_password') {
    const { data: user } = await service.from('users').select('email').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    // generateLink はリンク生成のみで送信しないため resetPasswordForEmail に変更（実際に送信される）。
    // ※実配信は Supabase の SMTP 設定に依存（未設定だと届かない → バックログ B2 参照）。
    const { error } = await service.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SERVICE_URL ?? ''}/login`,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'パスワードリセットメールを送信しました' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
