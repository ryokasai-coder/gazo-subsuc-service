// ─── メール送信（Gmail の SMTP 経由）─────────────────────────────────────────
// ※ファイル名は resend.ts のままだが、実装は nodemailer + SMTP（importパス互換のため踏襲）。
// 送信元 funlinksapoto@gmail.com から送る（ryo.kasai@funrix.co.jp は使用しない方針）。
//
// 必要な環境変数（Vercel Production / .env.local）:
//   SMTP_HOST   … smtp.gmail.com
//   SMTP_PORT   … 465
//   SMTP_SECURE … true
//   SMTP_USER   … funlinksapoto@gmail.com
//   SMTP_PASS   … Googleアカウントの「アプリパスワード」16文字（要2段階認証ON）
//   MAIL_FROM   … 'DESIGN BOX <funlinksapoto@gmail.com>'（任意・未設定なら既定を使用）
// ※Gmail SMTP は From を認証アカウント(funlinksapoto@gmail.com)に一致させる必要がある。
import nodemailer from 'nodemailer'

const FROM = () => process.env.MAIL_FROM || 'DESIGN BOX <funlinksapoto@gmail.com>'

let _transporter: nodemailer.Transporter | null = null
function getTransporter() {
  if (_transporter) return _transporter
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? 'true') === 'true', // 465=true / 587=false(STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  return _transporter
}

// 共通送信ヘルパー。SMTP未設定時は送信をスキップ（呼び出し側の処理は止めない）。
async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[mail] SMTP設定(SMTP_HOST/SMTP_USER/SMTP_PASS)が未設定のため送信をスキップしました')
    return
  }
  await getTransporter().sendMail({ from: FROM(), to, subject, html })
}

export async function sendWelcomeEmail({ email, loginId, tempPassword }: {
  email: string; loginId: string; tempPassword: string
}) {
  await sendMail({
    to: email,
    subject: '【DESIGN BOX】ログインIDのご案内',
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
    `,
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
  await sendMail({
    to: user.email,
    subject: '【DESIGN BOX】今月の画像依頼はお済みですか？',
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
    `,
  })
}

export async function sendFeedbackEmail({ email, companyName, contactName, billingMonth }: {
  email: string; companyName: string; contactName?: string; billingMonth: string
}) {
  await sendMail({
    to: email,
    subject: '【DESIGN BOX】今月のサービスに関するアンケートのお願い',
    html: `
      <p>${companyName} ${contactName ?? ''} 様</p>
      <p>いつもご利用いただきありがとうございます。</p>
      <p>今月（${billingMonth}）のサービスについてアンケートにご協力ください。</p>
      <p><a href="${process.env.NEXT_PUBLIC_SERVICE_URL}/dashboard/feedback?month=${billingMonth}">アンケートに回答する</a></p>
    `,
  })
}

export async function sendDeliveryEmail({ email, companyName, requestId, driveUrl }: {
  email: string; companyName: string; requestId: string; driveUrl?: string | null
}) {
  await sendMail({
    to: email,
    subject: '【DESIGN BOX】納品のご連絡',
    html: `
      <p>${companyName} 様</p>
      <p>ご依頼いただいた画像制作が完了しました。</p>
      ${driveUrl ? `<p><strong>▼ 納品画像はこちらからご確認ください</strong><br/><a href="${driveUrl}">${driveUrl}</a></p>` : ''}
      <p><a href="${process.env.NEXT_PUBLIC_SERVICE_URL}/dashboard/history">依頼履歴から確認する</a></p>
      <p>依頼ID: ${requestId}</p>
    `,
  })
}

export async function sendDunningEmail({ email, companyName }: {
  email: string; companyName: string
}) {
  await sendMail({
    to: email,
    subject: '【DESIGN BOX】お支払いのご確認',
    html: `
      <p>${companyName} 様</p>
      <p>お支払いが確認できていない月が2ヶ月以上続いています。</p>
      <p>ご確認のほどよろしくお願いいたします。</p>
      <p>お心当たりがない場合はサポートまでご連絡ください。</p>
    `,
  })
}
