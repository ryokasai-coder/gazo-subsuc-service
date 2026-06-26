import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendWelcomeEmail } from '@/lib/resend'

async function generateLoginId(supabase: ReturnType<typeof createServiceClient>): Promise<string> {
  const { data } = await supabase
    .from('users')
    .select('login_id')
    .like('login_id', 'C-%')
    .order('login_id', { ascending: false })
    .limit(1)
  const last = data?.[0]?.login_id
  const lastNum = last ? parseInt(last.replace('C-', ''), 10) : 0
  const next = (lastNum + 1).toString().padStart(4, '0')
  return `C-${next}`
}

export async function POST(req: NextRequest) {
  const { email, password, companyName, contactName, phone } = await req.json()
  const supabase = createServiceClient()

  const loginId = await generateLoginId(supabase)

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Create user record
  const { error: dbError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    login_id: loginId,
    company_name: companyName,
    contact_name: contactName,
    phone,
    is_payment_registered: false,
    is_active: true,
  })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

  try {
    await sendWelcomeEmail({ email, loginId, tempPassword: '' })
  } catch (e) {
    console.error('Email send failed:', e)
  }

  return NextResponse.json({ loginId })
}
