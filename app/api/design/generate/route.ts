import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// AI画像生成（Gemini Nano Banana 2 / gemini-3.1-flash-image）
// prompt＋（任意で）素材写真を受け取り、生成画像を dataURL で返す。
// ※月10回の使用回数は納品(deliver)で消費。1依頼あたりの生成回数(最大3)はクライアント側で制御。
const MODEL = 'gemini-3.1-flash-image'

export async function POST(req: NextRequest) {
  try {
    const service = createServiceClient()

    // 認証（deliverと同じ方式）
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await service.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '画像生成の設定が未完了です（GEMINI_API_KEY）' }, { status: 500 })
    }

    const { prompt, photoDataUrl } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: prompt }]
    if (photoDataUrl && typeof photoDataUrl === 'string') {
      const m = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(photoDataUrl)
      if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } })
    }

    // キーはURLに載せず x-goog-api-key ヘッダで送る
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('Gemini generate error:', res.status, errText.slice(0, 500))
      return NextResponse.json(
        { error: 'デザインの制作に失敗しました。もう一度お試しください' },
        { status: 502 }
      )
    }

    const json = await res.json()
    const outParts = json?.candidates?.[0]?.content?.parts ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img = outParts.find((p: any) => p?.inlineData?.data)
    if (!img) {
      console.error('Gemini generate: no image in response', JSON.stringify(json).slice(0, 500))
      return NextResponse.json({ error: 'デザインを制作できませんでした。もう一度お試しください' }, { status: 502 })
    }

    const mimeType = img.inlineData.mimeType || 'image/png'
    const imageDataUrl = `data:${mimeType};base64,${img.inlineData.data}`
    return NextResponse.json({ success: true, imageDataUrl })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
