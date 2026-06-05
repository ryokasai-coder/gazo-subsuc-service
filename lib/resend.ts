import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = () =>
  'noreply@' + (process.env.NEXT_PUBLIC_SERVICE_URL?.replace('https://', '').replace('http://', '') ?? 'example.com')

export async function sendWelcomeEmail({ email, loginId, tempPassword }: {
  email: string; loginId: string; tempPassword: string
}) {
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: '【画像作成サブスクサービス（仮）】ログインIDのご案内',
    html: `
      <p>この度はお申込みいただきありがとうございます。</p>
      <p>以下の情報でログインをお願いいたします。</p>
      <ul>
        <li>ログインID: ${loginId}</li>
        <li>仮パスワード: ${tempPassword}</li>
        <li>ログインURL: ${process.env.NEXT_PUBLIC_SERVICE_URL}/login</li>
      </ul>
      <p>ご利用開始には決済登録が必要です。<br/>
      決済登録が完了しましたら画像依頼フォームをご利用いただけます。</p>
    `
  })
}

export async function sendReminderEmail({ user, usedCount, requiredCount, thresholdDay, billingMonth }: {
  user: { email: string; company_name: string; contact_name?: string }
  usedCount: number
  requiredCount: number
  thresholdDay: number
  billingMonth: string
}) {
  const [year, month] = billingMonth.split('-')
  await resend.emails.send({
    from: FROM(),
    to: user.email,
    subject: '【画像作成サブスクサービス（仮）】今月の画像依頼はお済みですか？',
    html: `
      <p>${user.company_name} ${user.contact_name ?? ''} 様</p>
      <p>いつもご利用いただきありがとうございます。</p>
      <p>今月（${year}年${month}月）の画像制作依頼状況をお知らせします。</p>
      <hr/>
      <p>今月の依頼状況：<strong>${usedCount} 回 / 10回</strong></p>
      <p>${month}月${thresholdDay}日時点の目安：${requiredCount} 回</p>
      <hr/>
      <p>月額料金に含まれる10回の依頼枠がまだ残っています。<br/>
      未使用分の翌月繰越はできませんので、ぜひご活用ください！</p>
      <p><a href="${process.env.NEXT_PUBLIC_SERVICE_URL}/dashboard">今すぐ依頼する</a></p>
    `
  })
}

export async function sendFeedbackEmail({ email, companyName, contactName, billingMonth }: {
  email: string; companyName: string; contactName?: string; billingMonth: string
}) {
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: '【画像作成サブスクサービス（仮）】今月のサービスに関するアンケートのお願い',
    html: `
      <p>${companyName} ${contactName ?? ''} 様</p>
      <p>いつもご利用いただきありがとうございます。</p>
      <p>今月（${billingMonth}）のサービスについてアンケートにご協力ください。</p>
      <p><a href="${process.env.NEXT_PUBLIC_SERVICE_URL}/dashboard/feedback?month=${billingMonth}">アンケートに回答する</a></p>
    `
  })
}

export async function sendDeliveryEmail({ email, companyName, requestId }: {
  email: string; companyName: string; requestId: string
}) {
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: '【画像作成サブスクサービス（仮）】納品のご連絡',
    html: `
      <p>${companyName} 様</p>
      <p>ご依頼いただいた画像制作が完了しました。</p>
      <p><a href="${process.env.NEXT_PUBLIC_SERVICE_URL}/dashboard/history">依頼履歴から確認する</a></p>
      <p>依頼ID: ${requestId}</p>
    `
  })
}

export async function sendDunningEmail({ email, companyName }: {
  email: string; companyName: string
}) {
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: '【画像作成サブスクサービス（仮）】お支払いのご確認',
    html: `
      <p>${companyName} 様</p>
      <p>お支払いが確認できていない月が2ヶ月以上続いています。</p>
      <p>ご確認のほどよろしくお願いいたします。</p>
      <p>お心当たりがない場合はサポートまでご連絡ください。</p>
    `
  })
}
