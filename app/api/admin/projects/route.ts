import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { sendDeliveryEmail } from '@/lib/resend'
import { notifySlack } from '@/lib/slack'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data } = await service.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? service : null
}

export async function GET(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const month = searchParams.get('month')

  let query = service
    .from('image_requests')
    .select('*, users(company_name, contact_name, email)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (month) query = query.eq('billing_month', month)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString()

  const { error } = await service.from('image_requests').update(updateData).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, requestId } = await req.json()

  if (action === 'deliver') {
    // Get request and user info
    const { data: requestData } = await service
      .from('image_requests')
      .select('*, users(email, company_name)')
      .eq('id', requestId)
      .single()

    let emailSent = false
    let emailError: string | null = null
    if (requestData?.users) {
      try {
        await sendDeliveryEmail({
          email: requestData.users.email,
          companyName: requestData.users.company_name,
          requestId,
          driveUrl: requestData.delivered_image_url ?? null,
        })
        await notifySlack(`【納品完了】${requestData.users.company_name} / 依頼ID: ${requestId}`)
        emailSent = true
      } catch (e) {
        console.error('Delivery email failed:', e)
        emailError = e instanceof Error ? e.message : String(e)
      }
    }

    // ステータス更新（メール送信失敗でも更新する）
    const { error: updateError } = await service.from('image_requests').update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', requestId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    return NextResponse.json({ ok: true, emailSent, emailError })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
