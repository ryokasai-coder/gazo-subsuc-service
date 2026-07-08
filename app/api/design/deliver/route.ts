import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendDeliveryEmail } from '@/lib/resend'
import { google } from 'googleapis'

async function getGoogleDriveClient() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64
  if (!keyBase64) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not set')
  const key = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'))
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  folderName: string
): Promise<string> {
  // 共有ドライブ対応: supportsAllDrives: true が必須
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  })
  return folder.data.id!
}

export async function POST(req: NextRequest) {
  try {
    const service = createServiceClient()

    // Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await service.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data including email
    const { data: userData } = await service
      .from('users')
      .select('login_id, company_name, email')
      .eq('id', user.id)
      .single()
    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const { imageType, imageSize } = body

    // 単一/複数（パンフレット）を正規化。images配列があればそれを、無ければ単一 imageDataUrl を1件として扱う（後方互換）。
    type PageItem = { imageDataUrl: string; templateName?: string; textContent?: string }
    const rawImages: PageItem[] = Array.isArray(body.images) && body.images.length > 0
      ? (body.images as PageItem[])
      : (body.imageDataUrl
          ? [{ imageDataUrl: body.imageDataUrl, templateName: body.templateName, textContent: body.textContent }]
          : [])
    if (rawImages.length === 0) {
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 })
    }

    // ─── 使用回数チェック（deliver = 実際の依頼フロー。ページ数分を消費）───
    // 残数 = total_limit - used_count。必要数（ページ数）が残数を超える場合は中断（Drive保存に進まない）。
    const usageMonth = new Date().toISOString().slice(0, 7)
    const { data: usageRow } = await service
      .from('usage_limits')
      .select('id, used_count, total_limit')
      .eq('user_id', user.id)
      .eq('billing_month', usageMonth)
      .maybeSingle()
    const currentUsed = usageRow?.used_count ?? 0
    const usageLimit = usageRow?.total_limit ?? 10
    const remaining = usageLimit - currentUsed
    const needed = rawImages.length
    if (needed > remaining) {
      return NextResponse.json(
        {
          error: needed > 1
            ? `今月の残り回数が不足しています（残り${remaining}回・このパンフレットは${needed}ページ必要です）`
            : `今月の依頼上限（${usageLimit}回）に達しています`,
        },
        { status: 400 }
      )
    }

    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    if (!parentFolderId) {
      return NextResponse.json({ error: 'Google Drive設定が完了していません' }, { status: 500 })
    }

    const drive = await getGoogleDriveClient()

    // お客様番号フォルダを取得または作成（共有ドライブ対応）
    const customerFolderId = await getOrCreateFolder(drive, parentFolderId, userData.login_id)

    // パンフレット（複数ページ）はサブフォルダにまとめて保存
    let targetFolderId = customerFolderId
    if (needed > 1) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)
      const brochureName = `${(body.brochureTitle ? String(body.brochureTitle) : 'パンフレット').replace(/[\/\\:*?"<>|]/g, '_')}_${stamp}`
      targetFolderId = await getOrCreateFolder(drive, customerFolderId, brochureName)
    }

    const billingMonth = usageMonth
    const { PassThrough } = await import('stream')
    const results: Array<{ driveUrl: string; previewUrl: string; fileId: string; requestId?: string }> = []
    let insertedCount = 0 // 使用回数はDBに記録できた枚数分のみ消費（元仕様を踏襲）

    for (let i = 0; i < rawImages.length; i++) {
      const item = rawImages[i]
      if (!item?.imageDataUrl) continue

      const base64Data = item.imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      if (imageBuffer.length > 4 * 1024 * 1024) {
        return NextResponse.json({ error: `画像サイズが大きすぎます（${i + 1}枚目）` }, { status: 413 })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const pageLabel = needed > 1 ? `${String(i + 1).padStart(2, '0')}_` : ''
      const safeName = (item.templateName || 'design').replace(/[\/\\:*?"<>|]/g, '_')
      const fileName = `${pageLabel}${safeName}_${timestamp}.jpg`

      const passThrough = new PassThrough()
      passThrough.end(imageBuffer)

      // ファイルアップロード（共有ドライブ対応）
      const fileRes = await drive.files.create({
        requestBody: { name: fileName, parents: [targetFolderId], mimeType: 'image/jpeg' },
        media: { mimeType: 'image/jpeg', body: passThrough },
        fields: 'id',
        supportsAllDrives: true,
      })
      const fileId = fileRes.data.id!

      // 公開アクセス設定（共有ドライブ対応）
      await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      })

      const driveUrl = `https://drive.google.com/file/d/${fileId}/view`
      const previewUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`

      // DBに保存（statusはpending: 管理画面から納品操作するまで納品しない）
      const { data: requestData, error: reqError } = await service
        .from('image_requests')
        .insert({
          user_id: user.id,
          image_type: imageType || 'SNS投稿',
          image_size: imageSize || '正方形(1080x1080px)',
          text_content: item.textContent || '',
          // template_name 列は本番DBに存在しないため insert から除外（含めると insert 全体が失敗し記録が残らない）
          status: 'pending',
          delivered_image_url: driveUrl,   // 管理画面でプレビュー用
          billing_month: billingMonth,
        })
        .select()
        .single()

      if (reqError) {
        console.error('DB insert error:', reqError)
      } else {
        insertedCount += 1
      }
      results.push({ driveUrl, previewUrl, fileId, requestId: requestData?.id })
    }

    // ─── 使用回数を加算（DBに記録できた枚数分。加算後も used_count <= total_limit：残数チェック済み）───
    // 算出式: used_count += insertedCount（保存できたページ数）。端数なし（整数）。
    if (insertedCount > 0) {
      if (usageRow) {
        await service
          .from('usage_limits')
          .update({ used_count: currentUsed + insertedCount, updated_at: new Date().toISOString() })
          .eq('id', usageRow.id)
      } else {
        await service
          .from('usage_limits')
          .insert({ user_id: user.id, billing_month: usageMonth, used_count: insertedCount, total_limit: 10 })
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
      // 後方互換：先頭ページを従来のトップレベルフィールドにも入れる
      driveUrl: results[0]?.driveUrl,
      previewUrl: results[0]?.previewUrl,
      fileId: results[0]?.fileId,
      requestId: results[0]?.requestId,
    })
  } catch (err: unknown) {
    console.error('Deliver error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
