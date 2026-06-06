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

export async function GET() {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // project_masters テーブルが存在しない場合もエラーにしない
  const { data, error } = await service
    .from('project_masters')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    // テーブル未存在などの場合は空配列を返す
    if (error.code === '42P01') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { user_id, brand_name, brand_colors, font_style, tone, notes } = body

  const { data, error } = await service
    .from('project_masters')
    .upsert({
      user_id,
      brand_name: brand_name || null,
      brand_colors: brand_colors || null,
      font_style: font_style || null,
      tone: tone || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'project_masters テーブルが存在しません。Supabase で作成してください。' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const { error } = await service.from('project_masters').delete().eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
