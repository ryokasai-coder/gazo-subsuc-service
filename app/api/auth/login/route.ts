import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { loginId } = await req.json()

  if (!loginId) {
    return NextResponse.json({ error: 'ログインIDを入力してください' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('users')
    .select('email')
    .eq('login_id', loginId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'ログインIDが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ email: data.email })
}
