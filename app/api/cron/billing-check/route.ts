import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendDunningEmail } from '@/lib/resend'
import { notifySlack } from '@/lib/slack'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  // Only run on 25th-31st (end of month check)
  if (today.getDate() < 25) {
    return NextResponse.json({ message: 'Not end of month check period' })
  }

  const service = createServiceClient()

  // Get all active users
  const { data: users } = await service
    .from('users')
    .select('id, email, company_name, is_active')
    .eq('is_active', true)

  if (!users) return NextResponse.json({ checked: 0 })

  const blocked: string[] = []
  const dunned: string[] = []

  for (const user of users) {
    // Count unpaid months in last 3 months
    const months = Array.from({ length: 3 }).map((_, i) => {
      const d = new Date(today)
      d.setMonth(d.getMonth() - i - 1) // past months only
      return d.toISOString().slice(0, 7)
    })

    const { data: billingData } = await service
      .from('billing_records')
      .select('billing_month, clearing_status')
      .eq('user_id', user.id)
      .in('billing_month', months)

    if (!billingData) continue

    const unpaidMonths = billingData.filter((b: { clearing_status: string }) => b.clearing_status === '未収')

    if (unpaidMonths.length >= 2) {
      // Block access
      await service
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      blocked.push(user.email)

      // Send dunning email
      try {
        await sendDunningEmail({ email: user.email, companyName: user.company_name })
        dunned.push(user.email)
      } catch (e) {
        console.error('Dunning email failed:', e)
      }

      await notifySlack(
        `【滞納アラート】${user.company_name} (${user.email}) が${unpaidMonths.length}ヶ月未払いのためアクセスを停止しました`
      )
    }
  }

  return NextResponse.json({ checked: users.length, blocked, dunned })
}
