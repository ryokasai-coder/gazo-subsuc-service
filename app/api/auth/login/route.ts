import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// 認証をサーバ側で完結させ、メールアドレスを返さない（loginId列挙／メール漏洩の防止）。
// 成功時のみセッショントークンを返し、クライアントは setSession でログイン状態を確立する。
export async function POST(req: NextRequest) {
  const { loginId, password } = await req.json()

  // ログインID／パスワードの正否を区別しない共通エラー（enumeration対策）
  const GENERIC = NextResponse.json(
    { error: 'お客様番号またはパスワードが正しくありません' },
    { status: 401 }
  )

  if (!loginId || !password) return GENERIC

  // login_id → email（メールは返さずサーバ内でのみ使用）
  const service = createServiceClient()
  const { data: userRow } = await service
    .from('users')
    .select('email')
    .eq('login_id', loginId)
    .single()
  if (!userRow?.email) return GENERIC

  // anonクライアントでパスワード認証（セッションは永続化しない）
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data, error } = await anon.auth.signInWithPassword({
    email: userRow.email,
    password,
  })
  if (error || !data.session) return GENERIC

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
}
