// ─── テンプレ別プロンプト組立（AI画像生成 Nano Banana 2 用）─────────────
// 出典: H:\マイドライブ\Funrix\DESIGNBOX\designbox_ai_prompt_spec.md（画像プロンプト・参考画像.docx）
// 現状は①期間限定バナーのみ本実装。残り6テンプレは順次追加する。
// ★崩れ防止：各項目に文字数・行数・数字のみ等の制限を持たせ、mergeFieldDefaultsで必ず適用する。

export interface PromptField {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'textarea' | 'select'
  options?: string[]
  default?: string
  required?: boolean
  hint?: string
  maxLength?: number   // 1行あたり/全体の最大文字数（崩れ防止）
  maxLines?: number    // textareaの最大行数（価格表など）
  numeric?: boolean    // 数字のみ許可（割引率など）
}

// ─── 入力サニタイズ（崩れ防止の共通処理）─────────────────────────────
// 制御文字・絵文字・異体字セレクタを除去、連続空白/改行を圧縮、前後トリム。
export function sanitizeInput(v: string, opts?: { allowNewlines?: boolean }): string {
  const src = v ?? ''
  let out = ''
  for (const ch of src) {
    if (ch === '\n') { out += opts?.allowNewlines ? '\n' : ' '; continue }
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x20 || cp === 0x7f) continue          // 制御文字
    if (cp >= 0x1f000 && cp <= 0x1ffff) continue    // 絵文字（サロゲート）
    if (cp >= 0x2600 && cp <= 0x27bf) continue      // 記号・絵文字
    if (cp >= 0x2190 && cp <= 0x21ff) { out += ch; continue } // 矢印は許可
    if (cp >= 0xfe00 && cp <= 0xfe0f) continue      // 異体字セレクタ
    out += ch
  }
  if (opts?.allowNewlines) out = out.replace(/\n{2,}/g, '\n')
  return out.replace(/[ \t]{2,}/g, ' ').trim()
}

// ─── 1項目の入力制限を適用（サニタイズ＋数字のみ＋文字数/行数上限）───
export function applyFieldLimits(f: PromptField, value: string): string {
  if (f.type === 'select') return value ?? ''
  if (f.numeric) return (value ?? '').replace(/[^0-9]/g, '').slice(0, f.maxLength ?? 3)
  if (f.type === 'textarea') {
    let lines = sanitizeInput(value, { allowNewlines: true }).split('\n')
    if (f.maxLines) lines = lines.slice(0, f.maxLines)
    if (f.maxLength) lines = lines.map(l => l.slice(0, f.maxLength))
    return lines.join('\n').trim()
  }
  const s = sanitizeInput(value)
  return f.maxLength ? s.slice(0, f.maxLength) : s
}

// テンプレIDごとの入力欄定義。ここに定義があるテンプレはAI生成、無いテンプレは従来のDesignCanvas。
export const TEMPLATE_FIELDS: Record<string, PromptField[]> = {
  'limited-banner': [
    { key: 'season', label: '季節（配色）', type: 'select', options: ['春', '夏', '秋', '冬'], default: '春' },
    { key: 'main_title', label: 'メインタイトル', placeholder: '例：春の感謝祭', required: true, maxLength: 14 },
    { key: 'discount', label: '割引率（％・数字のみ）', placeholder: '例：20', required: true, numeric: true, maxLength: 3 },
    { key: 'period', label: '期間', placeholder: '例：4.1(月)→4.30(火)', required: true, maxLength: 24 },
    { key: 'target_text', label: '対象バッジ', placeholder: '例：全品対象', default: '全品対象', maxLength: 8 },
    { key: 'badge_text', label: '上部リボンの文言', placeholder: '例：期間限定！', default: '期間限定！', maxLength: 10 },
    { key: 'sub_catch', label: 'サブキャッチ（右上）', placeholder: '例：今だけの特別価格！', default: '今だけの特別価格！', maxLength: 16 },
    {
      key: 'menu_items', label: '価格表（1行に「商品名 定価 割引後」／最大5行）', type: 'textarea',
      placeholder: '特製醤油ラーメン 950 760\n塩ラーメン 900 720\n味玉トッピング 120 96',
      hint: '空欄なら価格表は入りません。1行1商品・最大5行まで', maxLength: 22, maxLines: 5,
    },
    { key: 'cta', label: '最下部の一言', placeholder: '例：この機会をお見逃しなく！', default: 'この機会をお見逃しなく！', maxLength: 18 },
  ],
}

// フォーム入力(fields)＋各欄のdefaultをマージし、必ず入力制限を適用した実効値を返す
// （UIのmaxLengthを迂回されても、ここで崩れ防止の上限がかかる＝多層防御）
export function mergeFieldDefaults(templateId: string, fields: Record<string, string>): Record<string, string> {
  const defs = TEMPLATE_FIELDS[templateId] ?? []
  const merged: Record<string, string> = {}
  for (const f of defs) {
    const cleaned = applyFieldLimits(f, fields[f.key] ?? '')
    merged[f.key] = cleaned || (f.default ?? '')
  }
  return merged
}

const SEASON_COLOR: Record<string, string> = { 春: '淡いピンク', 夏: '爽やかな水色', 秋: '温かいオレンジ', 冬: '白銀' }
const SEASON_MOTIF: Record<string, string> = { 春: '桜の花びら', 夏: 'ひまわりや涼しげな波', 秋: '紅葉やイチョウ', 冬: '雪の結晶' }

// 最終プロンプトを組み立てる。fieldsは mergeFieldDefaults 済み（＝制限適用済み）を想定。
export function buildPrompt(templateId: string, f: Record<string, string>, hasPhoto: boolean): string {
  if (templateId === 'limited-banner') {
    const season = f.season || '春'
    const color = SEASON_COLOR[season] || '淡いピンク'
    const motif = SEASON_MOTIF[season] || '桜の花びら'
    // 価格表：「商品名 定価 割引後」→「商品名 定価→割引後円」に整形（最大5行）
    const menuLines = (f.menu_items || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5)
      .map(l => {
        const p = l.split(/\s+/)
        return p.length >= 3 ? `${p[0]} ${p[1]}→${p[2]}円` : l
      }).join('／')
    return [
      '飲食店向けの正方形セール告知ポスター(1080x1080)を作成してください。',
      `■背景：${season}をイメージした${color}のグラデーション。${motif}を背景全体にやわらかく散りばめる。`,
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部中央：赤いリボンバナーに白文字「${f.badge_text || '期間限定！'}」`,
      `・右上：ポップな手書き風文字「${f.sub_catch || '今だけの特別価格！'}」（黄色い下線）`,
      `・中央左：特大タイトル「${f.main_title}」`,
      `・その下：超特大の数字「${f.discount}%OFF」（メインカラー＋白フチ・画面の主役）`,
      `・左端：黄色い花形の丸バッジ「${f.target_text || '全品対象'}」`,
      hasPhoto ? '・右側：添付の商品写真を大きく、右端からはみ出すように配置' : '',
      `・中段：カラー帯に白文字「${f.period}まで」`,
      menuLines ? `・下部：メニュー価格テーブル（${menuLines}）` : '',
      `・最下部：カラー帯「${f.cta || 'この機会をお見逃しなく！'}」＋ギフトアイコン`,
      '■デザイン：フォント=丸ゴシック体・極太。カラー=季節のメインカラー＋白＋黄色バッジ。明るく賑やか・SNS映え・食欲をそそる。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を商品として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  return ''
}
