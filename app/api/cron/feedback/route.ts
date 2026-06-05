import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendFeedbackEmail } from '@/lib/resend'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  // Only run on the 20th
  if (today.getDate() !== 20) {
    return NextResponse.json({ message: 'Not the 20th' })
  }

  const billingMonth = today.toISOString().slice(0, 7)
  const service = createServiceClient()

  // Get active users who haven't submitted feedback yet this month
  const { data: users } = await service
    .from('users')
    .select('id, email, company_name, contact_name')
    .eq('is_active', true)
    .eq('is_payment_registered', true)

  if (!users) return NextResponse.json({ sent: 0 })

  // Get users who already submitted feedback
  const { data: existingFeedback } = await service
    .from('feedbacks')
    .select('user_id')
    .eq('billing_month', billingMonth)

  const submittedUserIds = new Set(existingFeedback?.map((f: { user_id: string }) => f.user_id) ?? [])

  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    if (submittedUserIds.has(user.id)) continue

    // Only send if they made at least 1 request this month
    const { count } = await service
      .from('image_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('billing_month', billingMonth)

    if (!count || count === 0) continue

    try {
      await sendFeedbackEmail({
        email: user.email,
        companyName: user.company_name,
        contactName: user.contact_name,
        billingMonth,
      })
      sent++
    } catch (e: unknown) {
      errors.push(`${user.email}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json({ sent, errors })
}
