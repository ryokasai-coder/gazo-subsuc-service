export async function notifySlack(message: string) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
    // Slack Webhookは成功時に200/"ok"を返す。失敗はログに残す（呼び出し側の処理は止めない）
    if (!res.ok) {
      console.error(`Slack通知失敗: ${res.status} ${await res.text().catch(() => '')}`)
    }
  } catch (e) {
    console.error('Slack通知でエラー:', e)
  }
}
