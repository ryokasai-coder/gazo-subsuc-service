import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendReminderEmail } from '@/lib/resend'

const THRESHOLDS = [
  { day: 3,  required: 1  },
  { day: 6,  required: 2  },
  { day: 9,  required: 3  },
  { day: 12, required: 4  },
  { day: 15, required: 5  },
  { day: 18, required: 6  },
  { day: 21, required: 7  },
  { day: 24, required: 8  },
  { day: 27, required: 9  },
  { day: 30, required: 10 },
]

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const dayOfMonth = today.getDate()
  const billingMonth = today.toISOString().slice(0, 7)
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().slice(0, 7)

  // 当日以降の全閾値（その日以前の閾値で未送信のものをまとめて処理）
  const activeThresholds = THRESHOLDS.filter(t => dayOfMonth >= t.day)
  if (activeThresholds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No active thresholds today' })
  }

  const service = createServiceClient()

  const { data: users } = await service
    .from('users')
    .select('id, email, company_name, contact_name')
    .eq('is_active', true)
    .eq('is_payment_registered', true)

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    // 当月の依頼済み回数を取得
    const { count: usedCount } = await service
      .from('image_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${billingMonth}-01`)
      .lt('created_at', `${nextMonth}-01`)

    const used = usedCount ?? 0

    for (const threshold of activeThresholds) {
      // 依頼数が閾値の必要数を下回っている場合のみ
      if (used < threshold.required) {
        // 既に送信済みかチェック（重複防止）
        const { data: alreadySent } = await service
          .from('reminder_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('billing_month', billingMonth)
          .eq('threshold_day', threshold.day)
          .maybeSingle()

        if (!alreadySent) {
          try {
            await sendReminderEmail({
              user,
              usedCount: used,
              requiredCount: threshold.required,
              thresholdDay: threshold.day,
              billingMonth,
            })
            // 送信履歴を記録
            await service.from('reminder_logs').insert({
              user_id: user.id,
              billing_month: billingMonth,
              threshold_day: threshold.day,
              required_count: threshold.required,
            })
            sent++
          } catch (e: unknown) {
            errors.push(`${user.email} (day=${threshold.day}): ${e instanceof Error ? e.message : String(e)}`)
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors, dayOfMonth, billingMonth })
}
