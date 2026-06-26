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
  const { error } = await service
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
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
    const { error } = await service.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'パスワードリセットメールを送信しました' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
