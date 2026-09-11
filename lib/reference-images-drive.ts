// 参考画像(Image 1)を Google Drive から取得する方式。
// ※server専用（生成APIのみ import）。
//
// 背景: 従来は lib/reference-images.ts に26枚を base64 同梱していたが、
//       ファイルが約8MBに肥大化しリポジトリ/バンドルが重い（push時に接続リセット）。
//       マスター文書「参考画像の保存先（Google Drive）」の方式に沿って Drive から取得する。
//
// 認証: deliver(route) と同じサービスアカウント鍵(GOOGLE_SERVICE_ACCOUNT_KEY_BASE64)を
//       再利用する（新規サービスアカウントは不要）。読み取り専用スコープで生成。
// 前提: 対象の参考画像フォルダを、そのサービスアカウントのメール(client_email)に
//       「閲覧者」で共有しておくこと。共有が無いと 403。
//
// 方式: 参考画像は常に Google Drive から取得する（Phase 2b で base64 同梱を廃止＝軽量化）。
//       SA鍵(GOOGLE_SERVICE_ACCOUNT_KEY_BASE64)があれば Drive を叩く。取得できない場合は
//       reference-images.ts の REFERENCE_IMAGES（現在は空マップ）にフォールバック＝null。
//       ※旧 USE_DRIVE_REFERENCES フラグは不要になった（設定は残っていても無害）。

import { google } from 'googleapis'
import { REFERENCE_IMAGES, type ReferenceImage } from './reference-images'

// テンプレID → Google Drive ファイルID。
// ※マスター文書「参考画像の保存先（Google Drive）」の対応表と必ず一致させること。
//   フォルダ: https://drive.google.com/drive/folders/1Ga45WomVySjTLED5nuO9ctbAg320EhxB
const DRIVE_FILE_IDS: Record<string, string> = {
  spa_open: '1st2r2_A2ReQ5rpFn0dZNy3gjd8YSSN91',
  yakiniku_bento: '1tdW5aTWqBbSxQsXWZWs9HC5GWgL9T-dz',
  takeout_bento: '1-W6a9tYOwZ3cMCvRDPA2ud-nOZWza5yU',
  esthe_pink: '1lk8JJDOG8UulnC1ZyMb_WF0LmkcqhAZ4',
  esthe_gold: '13PVeIRSuJGUHihWikyOVuwXEvmcDrR39',
  line_guide: '1Ka4aVY4LqTkGG8Ky3Yjk9ZiHFE2QTF8-',
  ramen_main: '16qCLJmOeaZvp3IanjFWyhb9605dPqQ_l',
  line_benefits: '1ev1LJ-WTFgadFe9yhAfMOXXrVWrwHpNq',
  sns_annotation: '1zPZx_4n5Y5sAzm7_M0X9DAudpEIlL0ue',
  calendar: '1ogW6hPLFxDQ_IvIaMR0iBAXocp58bmTs',
  recommend_menu: '1Mb27_0vpFn5-UX7fOh6Zs4m6jjF4GYWf',
  spring_sale: '1NL8Zrt97MTf8rs-0EJt_ofkMkglkJ1xE',
  single_item_dark: '17RZBogesH8koSox9Nmy0gn-Tjq3mJVYD',
  smoothie_single: '1s-A_FvVBWQ-qKTlfMYPwq2jwA0z6NUor',
  smoothie_trio: '1_tBh0Ir5_wssmkfoRGNcIqWo7aFvNI3w',
  veggie_focaccia_poster: '1iPe2U4p4H7esh5OfUF6Odt7HuosLZgyK',
  ingredient_diagram_sandwich: '11-QkP4WNVZlwcVxDSa5TzE1VwqYuo4Pb',
  strawberry_milk_kakigori: '1k01tv9qWtdtM4I2UYOIEhdvjgwKL1RFy',
  strawberry_pistachio_crepe: '1Di1eCMzldPM1kZLJT900z6niZX1rqAkH',
  bakery_opening_day: '1l1tjbWeI827jYdwvuAnMradzW5W6jIYD',
  new_open_690_campaign: '1kqtjjvjP9WyIz1jb57v7J0CQ44hI0b2i',
  weekend_brunch_plate: '17xMDQrdEaX8IN3pr0VxkMhBAtYA_YIWb',
  yakitori_menu: '1GT6ZVf6MKHTq8HCS4v5mMo-x_r00LuoU',
  colorful_bowl_lunch: '1ayKrBkyipxQMsoea_c5Ejwvfq2s575Ln',
  teppan_gyoza_menu: '1xFPdW9i-dM_kSt1Sl6XPMjCRBS4wipZY',
  charcoal_saba_ju: '1sQFTeZtPJ6bK7yz6Gmk1msH_PTP8M9Uj',
}

// Drive読み取りクライアント（プロセス内で1回だけ生成）
let _driveClient: ReturnType<typeof google.drive> | null = null
function getDriveReadClient() {
  if (_driveClient) return _driveClient
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64
  if (!keyBase64) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not set')
  const key = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'))
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  _driveClient = google.drive({ version: 'v3', auth })
  return _driveClient
}

// 取得済み参考画像のメモリキャッシュ（ラムダ生存中は Drive へ再アクセスしない）。
// 参考画像を差し替えたら、デプロイ（＝新プロセス）でキャッシュはクリアされる。
const _cache: Record<string, ReferenceImage> = {}

async function fetchFromDrive(templateId: string): Promise<ReferenceImage | null> {
  const fileId = DRIVE_FILE_IDS[templateId]
  if (!fileId) return null
  if (_cache[templateId]) return _cache[templateId]

  const drive = getDriveReadClient()
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' },
  )
  const buf = Buffer.from(res.data as ArrayBuffer)
  // Drive上の参考画像は PNG。Gemini には base64 で渡す。
  const ref: ReferenceImage = { mime: 'image/png', data: buf.toString('base64') }
  _cache[templateId] = ref
  return ref
}

/**
 * 参考画像(Image 1)を取得する。
 * - USE_DRIVE_REFERENCES=true かつ SA鍵あり かつ 対応表にIDあり → Drive から取得（失敗時は base64 にフォールバック）
 * - それ以外（既定）→ 従来の base64 同梱(REFERENCE_IMAGES)
 * - どちらにも無ければ null（参考画像方式でないテンプレ）
 */
export async function getReferenceImage(templateId: string): Promise<ReferenceImage | null> {
  // 参考画像は Google Drive から取得する（base64 同梱は Phase 2b で廃止＝軽量化）。
  // SA鍵と対応IDがあれば Drive を叩く。失敗しても生成は止めない（reference=null で
  // 参考画像なし生成に落ちる。ハードクラッシュはしない）。
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 && DRIVE_FILE_IDS[templateId]) {
    try {
      const ref = await fetchFromDrive(templateId)
      if (ref) return ref
    } catch (e) {
      console.error('[reference-images] Drive取得に失敗:', templateId, e)
    }
  }
  // base64 同梱は廃止したため通常は null（REFERENCE_IMAGES は空マップ）。
  return REFERENCE_IMAGES[templateId] || null
}
