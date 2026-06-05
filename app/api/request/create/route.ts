import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { notifySlack } from '@/lib/slack'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const billingMonth = new Date().toISOString().slice(0, 7)
  const serviceClient = createServiceClient()

  // Check user
  const { data: userData } = await serviceClient
    .from('users')
    .select('company_name, contact_name, is_payment_registered, is_active, role')
    .eq('id', user.id)
    .single()

  if (!userData?.is_active) return NextResponse.json({ error: 'アカウントが無効です' }, { status: 403 })
  if (!userData?.is_payment_registered && userData?.role !== 'admin') return NextResponse.json({ error: '決済登録が必要です' }, { status: 403 })

  // Check usage limit
  const { data: usageData } = await serviceClient
    .from('usage_limits')
    .select('*')
    .eq('user_id', user.id)
    .eq('billing_month', billingMonth)
    .single()

  const usedCount = usageData?.used_count ?? 0
  const maxCount = usageData?.max_count ?? 10

  if (usedCount >= maxCount) {
    return NextResponse.json({ error: '今月の依頼上限（10回）に達しています' }, { status: 400 })
  }

  // Insert request
  const { data: requestData, error: insertError } = await serviceClient
    .from('image_requests')
    .insert({
      user_id: user.id,
      billing_month: billingMonth,
      production_types: body.production_types ?? [],
      production_purpose: body.production_purpose ?? [],
      design_image: body.design_image,
      target: body.target,
      media_types: body.media_types ?? [],
      image_size: body.image_size,
      custom_size: body.custom_size,
      text_content: body.text_content,
      material_urls: body.material_urls ?? [],
      reference_urls: body.reference_urls ?? [],
      cta_action: body.cta_action,
      delivery_speed: body.delivery_speed,
      other_requests: body.other_requests,
      template_id: body.template_id ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  // Update usage limit
  if (usageData) {
    await serviceClient
      .from('usage_limits')
      .update({ used_count: usedCount + 1, updated_at: new Date().toISOString() })
      .eq('id', usageData.id)
  } else {
    await serviceClient
      .from('usage_limits')
      .insert({ user_id: user.id, billing_month: billingMonth, used_count: 1, max_count: 10 })
  }

  // Slack notification
  const types = (body.production_types ?? []).join(', ') || '未設定'
  await notifySlack(
    `【新規依頼】${userData.company_name}\n制作内容: ${types}\n依頼ID: ${requestData.id}`
  )

  return NextResponse.json({ id: requestData.id })
}
