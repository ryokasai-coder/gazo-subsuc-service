import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { getContractInfo, getCancelReason } from '@/lib/contract'
import { sendCancellationEmail } from '@/lib/resend'
import { notifySlack } from '@/lib/slack'
import { format } from 'date-fns'

// 解約確定API（STEP⑨→⑩／自動処理⑯）
// 実行時: ステータスを解約申請済みに変更・契約終了日を記録・理由を保存・完了メール送信。
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const reasonKey: string | null = body.reason ?? null
  const reasonDetail: string | null = (body.reason_detail ?? '').trim() || null

  const service = createServiceClient()
  const { data: userData } = await service
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userData) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })

  // 既に解約申請済み／解約済みは二重処理しない
  if (userData.cancellation_status && userData.cancellation_status !== 'active') {
    return NextResponse.json({ error: 'すでに解約手続きが完了しています', already: true }, { status: 400 })
  }

  const now = new Date()
  const contract = getContractInfo(userData, now)

  // 無料期間の1ヶ月目は解約申請不可（利用規約 第7条）
  if (!contract.canCancel) {
    return NextResponse.json({
      error: `解約申請は${format(contract.cancelAvailableFrom, 'yyyy年M月d日')}以降に可能になります。`,
    }, { status: 400 })
  }

  // 解約理由のバリデーション（未知キーは保存しない）
  const validReason = getCancelReason(reasonKey) ? reasonKey : null

  // 利用期限＝当月末日（仕様案どおり：当月末で終了・次回請求なし）
  const serviceEndDate = format(contract.serviceEndDateIfCancel, 'yyyy-MM-dd')

  const { error: updateError } = await service
    .from('users')
    .update({
      cancellation_status: 'cancel_requested',
      cancel_requested_at: now.toISOString(),
      cancel_reason: validReason,
      cancel_reason_detail: reasonDetail,
      service_end_date: serviceEndDate,
      updated_at: now.toISOString(),
    })
    .eq('id', user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  const serviceEndLabel = format(contract.serviceEndDateIfCancel, 'yyyy年M月d日')

  // 完了メール（失敗しても解約自体は成立させる）
  try {
    await sendCancellationEmail({
      email: userData.email,
      companyName: userData.company_name,
      contactName: userData.contact_name ?? '',
      serviceEndDate: serviceEndLabel,
    })
  } catch (e) {
    console.error('[cancel] メール送信失敗:', e)
  }

  // Slack通知（社内向け）
  try {
    const reasonLabel = getCancelReason(validReason)?.label ?? '未選択'
    await notifySlack(
      `【解約申請】${userData.company_name}\n理由: ${reasonLabel}${reasonDetail ? `（${reasonDetail}）` : ''}\n利用期限: ${serviceEndLabel}`
    )
  } catch (e) {
    console.error('[cancel] Slack通知失敗:', e)
  }

  return NextResponse.json({ ok: true, serviceEndDate: serviceEndLabel })
}
