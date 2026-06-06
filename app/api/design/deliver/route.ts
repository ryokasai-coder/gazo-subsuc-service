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
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
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
    const { imageDataUrl, templateName, textContent, imageType, imageSize } = body

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 })
    }

    // Convert base64 to buffer
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Check size limit (Vercel 4.5MB)
    if (imageBuffer.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: '画像サイズが大きすぎます。テキスト量を減らすか別のサイズを選択してください。' }, { status: 413 })
    }

    // Google Drive upload
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    if (!parentFolderId) {
      return NextResponse.json({ error: 'Google Drive設定が完了していません' }, { status: 500 })
    }

    const drive = await getGoogleDriveClient()

    // お客様番号フォルダを取得または作成
    const customerFolderId = await getOrCreateFolder(drive, parentFolderId, userData.login_id)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `${(templateName || 'design').replace(/[\/\\:*?"<>|]/g, '_')}_${timestamp}.png`

    // Buffer → ReadableStream (Node.js環境対応)
    const { PassThrough } = await import('stream')
    const passThrough = new PassThrough()
    passThrough.end(imageBuffer)

    const fileRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [customerFolderId],
        mimeType: 'image/png',
      },
      media: {
        mimeType: 'image/png',
        body: passThrough,
      },
      fields: 'id',
    })

    const fileId = fileRes.data.id!

    // 公開アクセス設定
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    })

    const driveUrl = `https://drive.google.com/file/d/${fileId}/view`
    const previewUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`

    // DBに保存
    const { data: requestData, error: reqError } = await service
      .from('image_requests')
      .insert({
        user_id: user.id,
        image_type: imageType || 'SNS投稿',
        image_size: imageSize || '正方形(1080x1080px)',
        text_content: textContent || '',
        template_name: templateName || '',
        status: 'delivered',
        delivered_image_url: driveUrl,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (reqError) {
      console.error('DB insert error:', reqError)
    }

    // メール送信
    const emailTarget = userData.email || user.email
    if (emailTarget && requestData?.id) {
      try {
        await sendDeliveryEmail({
          email: emailTarget,
          companyName: userData.company_name || '',
          requestId: requestData.id,
        })
      } catch (mailErr) {
        console.error('Email send error:', mailErr)
        // メール失敗しても納品は成功扱い
      }
    }

    return NextResponse.json({
      success: true,
      driveUrl,
      previewUrl,
      fileId,
      requestId: requestData?.id,
    })
  } catch (err: unknown) {
    console.error('Deliver error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
