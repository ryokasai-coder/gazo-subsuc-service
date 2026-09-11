// 参考画像方式テンプレの固定参考画像（Image 1）＋共通システム指示。
// ※server専用。参考画像(Image 1)は Google Drive から取得する方式（lib/reference-images-drive.ts）。
// 参考画像の実体は Google Drive（フォルダ 1Ga45WomVySjTLED5nuO9ctbAg320EhxB）。以前は本ファイルにbase64同梱していたが軽量化のため撤去。
// テンプレID⇔DriveファイルIDの対応は reference-images-drive.ts の DRIVE_FILE_IDS。

export const SYSTEM_INSTRUCTION = [
  'あなたはプロの販促デザイナーです。',
  '入力される1枚目の画像(Image 1)は固定の参考デザインテンプレート、2枚目以降の画像は顧客側で用意された画像です(写真の場合とQRコード・ロゴ画像の場合があり、テンプレートによって異なります)。',
  'Image 1のレイアウト・配色・装飾・フォントの雰囲気は完全に維持したまま、指示に従って該当箇所だけを差し替えて1枚の画像を生成してください。',
  'Image 1に存在しない装飾・ロゴ・文字は追加しないでください。',
].join(String.fromCharCode(10))

export interface ReferenceImage { mime: string; data: string }

// base64同梱は廃止（軽量化）。参考画像は reference-images-drive.ts の getReferenceImage が Drive から取得する。
// この空マップは getReferenceImage のフォールバック用に型互換のため残置。
export const REFERENCE_IMAGES: Record<string, ReferenceImage> = {}
