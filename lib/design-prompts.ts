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
  // ② 新商品告知（インパクト）
  'new-product': [
    { key: 'theme', label: 'トーン（配色）', type: 'select', options: ['ポップ', 'クール', 'ナチュラル', 'カラフル'], default: 'ポップ' },
    { key: 'main_title', label: '英字大タイトル', placeholder: '例：NEW', required: true, default: 'NEW', maxLength: 16 },
    { key: 'product_name', label: '商品名', placeholder: '例：MIXスムージー', required: true, maxLength: 16 },
    { key: 'sub_catch', label: 'サブキャッチ', placeholder: '例：新登場！夏の新定番', maxLength: 18 },
    { key: 'price', label: '価格（例：¥580）', placeholder: '例：¥580', maxLength: 10 },
    { key: 'description', label: '商品説明（最大2行）', type: 'textarea', placeholder: '例：5種のフルーツをぎゅっと', maxLength: 22, maxLines: 2 },
    { key: 'badge_text', label: 'バッジの文言', placeholder: '例：新登場', default: '新登場', maxLength: 8 },
  ],
  // ④ 商品ヒーロー写真（高級感）
  'product-hero': [
    { key: 'badge', label: '上部バッジ', placeholder: '例：当店人気No.1', default: '当店人気No.1', maxLength: 12 },
    { key: 'main_catch', label: 'メインキャッチ', placeholder: '例：こだわりの一杯', required: true, maxLength: 18 },
    { key: 'description', label: '商品説明（最大2行）', type: 'textarea', placeholder: '例：厳選素材を丁寧に仕上げた自慢の逸品', maxLength: 26, maxLines: 2 },
    { key: 'product_name', label: '商品名', placeholder: '例：特製醤油ラーメン', required: true, maxLength: 16 },
    { key: 'price', label: '価格（例：¥950）', placeholder: '例：¥950', maxLength: 10 },
    { key: 'feature_1', label: 'こだわり①', placeholder: '例：自家製麺', default: '自家製', maxLength: 10 },
    { key: 'feature_2', label: 'こだわり②', placeholder: '例：特製スープ', default: '特製スープ', maxLength: 10 },
    { key: 'feature_3', label: 'こだわり③', placeholder: '例：厳選具材', default: '厳選素材', maxLength: 10 },
  ],
  // ⑤ 写真メイン＋テキストオーバーレイ（SNS口コミ風）
  'photo-overlay-callout': [
    { key: 'callout_1', label: '吹き出し①', placeholder: '例：チャーシューほろほろ♡', required: true, maxLength: 14 },
    { key: 'callout_2', label: '吹き出し②', placeholder: '例：麺つるつる〜', maxLength: 14 },
    { key: 'callout_3', label: '吹き出し③', placeholder: '例：スープ濃厚！', maxLength: 14 },
    { key: 'callout_4', label: '吹き出し④', placeholder: '（任意）', maxLength: 14 },
    { key: 'callout_5', label: '吹き出し⑤', placeholder: '（任意）', maxLength: 14 },
    { key: 'callout_6', label: '吹き出し⑥', placeholder: '（任意）', maxLength: 14 },
    { key: 'main_comment', label: '最下部の大きな一言', placeholder: '例：しあわせすぎる〜今日のごほうび♡', default: 'しあわせすぎる〜♡', maxLength: 22 },
  ],
  // ③ LINE登録QRコード付き
  'line-qr': [
    { key: 'main_catch', label: 'メインキャッチ', placeholder: '例：友だち追加でお得なクーポンプレゼント！', required: true, maxLength: 24 },
    { key: 'benefit_1', label: '特典①', placeholder: '例：500円OFFクーポン', default: 'お得なクーポン', maxLength: 16 },
    { key: 'benefit_2', label: '特典②', placeholder: '例：新商品のお知らせ', default: '新商品のお知らせ', maxLength: 16 },
    { key: 'benefit_3', label: '特典③', placeholder: '例：誕生日クーポン', default: '誕生日特典', maxLength: 16 },
    { key: 'cta', label: '最下部の一言', placeholder: '例：今すぐ登録してお得をゲット！', default: '今すぐ登録してお得をゲット！', maxLength: 18 },
  ],
  // ⑥ グランドメニュー表（ナチュラル）
  'menu-grid': [
    { key: 'title', label: 'タイトル', placeholder: '例：おすすめメニュー', default: 'おすすめメニュー', maxLength: 16 },
    { key: 'no1_name', label: '一番人気の商品名', placeholder: '例：特製醤油ラーメン', maxLength: 14 },
    { key: 'no1_price', label: '一番人気の価格', placeholder: '例：¥950', maxLength: 10 },
    { key: 'no1_description', label: '一番人気の説明', placeholder: '例：当店自慢の看板メニュー', maxLength: 20 },
    { key: 'menu_items', label: 'メニュー一覧（1行に「商品名 価格 説明」／最大6行）', type: 'textarea', placeholder: '塩ラーメン ¥900 あっさり\n味噌ラーメン ¥950 濃厚', hint: '1行1商品・最大6行', maxLength: 30, maxLines: 6 },
    { key: 'special', label: '特典バッジ', placeholder: '例：大盛り無料', maxLength: 12 },
    { key: 'other_menus', label: 'その他メニュー', placeholder: '例：サイドメニュー各種あり', maxLength: 30 },
  ],
  // ⑥ ドリンクメニュー表
  'drink-menu': [
    { key: 'title', label: 'タイトル', placeholder: '例：ドリンクメニュー', default: 'ドリンクメニュー', maxLength: 16 },
    { key: 'no1_name', label: '一番人気のドリンク名', placeholder: '例：自家製レモネード', maxLength: 14 },
    { key: 'no1_price', label: '一番人気の価格', placeholder: '例：¥580', maxLength: 10 },
    { key: 'no1_description', label: '一番人気の説明', placeholder: '例：爽やかな自家製シロップ', maxLength: 20 },
    { key: 'menu_items', label: 'ドリンク一覧（1行に「商品名 価格 説明」／最大6行）', type: 'textarea', placeholder: 'カフェラテ ¥480 定番\nほうじ茶ラテ ¥500 香ばしい', hint: '1行1商品・最大6行', maxLength: 30, maxLines: 6 },
    { key: 'special', label: '特典バッジ', placeholder: '例：おかわり半額', maxLength: 12 },
    { key: 'other_menus', label: 'その他メニュー', placeholder: '例：ホット/アイス選べます', maxLength: 30 },
  ],
  // ⑥ サイド・デザートメニュー表
  'sweets-menu': [
    { key: 'title', label: 'タイトル', placeholder: '例：スイーツメニュー', default: 'スイーツメニュー', maxLength: 16 },
    { key: 'no1_name', label: '一番人気のスイーツ名', placeholder: '例：濃厚バスクチーズケーキ', maxLength: 14 },
    { key: 'no1_price', label: '一番人気の価格', placeholder: '例：¥600', maxLength: 10 },
    { key: 'no1_description', label: '一番人気の説明', placeholder: '例：しっとり濃厚な人気No.1', maxLength: 20 },
    { key: 'menu_items', label: 'スイーツ一覧（1行に「商品名 価格 説明」／最大6行）', type: 'textarea', placeholder: 'プリン ¥450 なめらか\nガトーショコラ ¥500 濃厚', hint: '1行1商品・最大6行', maxLength: 30, maxLines: 6 },
    { key: 'special', label: '特典バッジ', placeholder: '例：ドリンクセット50円引き', maxLength: 12 },
    { key: 'other_menus', label: 'その他メニュー', placeholder: '例：テイクアウトOK', maxLength: 30 },
  ],
  // ② カレンダー・スケジュール表
  'calendar-schedule': [
    { key: 'title', label: 'タイトル', placeholder: '例：営業カレンダー', default: '営業カレンダー', maxLength: 14 },
    { key: 'month', label: '対象の月', placeholder: '例：2026年4月', maxLength: 10 },
    { key: 'business_hours', label: '営業時間', placeholder: '例：11:00〜21:00', maxLength: 24 },
    { key: 'closed_day', label: '定休日', placeholder: '例：毎週水曜・第3木曜', maxLength: 20 },
    { key: 'special_events', label: '特別日（1行に「日付 内容」／最大5行）', type: 'textarea', placeholder: '4/10 ポイント2倍\n4/20 半額デー', hint: '1行1件・最大5行', maxLength: 24, maxLines: 5 },
    { key: 'footer_message', label: '下部メッセージ', placeholder: '例：ご来店お待ちしております', maxLength: 24 },
  ],
  // 店舗ブランド紹介（高級感）／メニュー表紙
  'menu-cover': [
    { key: 'store_name', label: '店名', placeholder: '例：Cafe LUMIERE', required: true, maxLength: 16 },
    { key: 'store_sub_name', label: 'サブネーム／英字表記', placeholder: '例：〜癒しのひととき〜', maxLength: 20 },
    { key: 'catch_copy', label: 'キャッチコピー', placeholder: '例：こだわりの一杯を、あなたに', maxLength: 24 },
    { key: 'description', label: '紹介文（最大2行）', type: 'textarea', placeholder: '例：厳選した豆と丁寧な抽出でお届けします', maxLength: 26, maxLines: 2 },
  ],
  // ⑦ 縦型LP風（総合訴求）
  'vertical-lp': [
    { key: 'store_name', label: '店名', placeholder: '例：Cafe LUMIERE', required: true, maxLength: 16 },
    { key: 'sub_catch', label: 'サブキャッチ', placeholder: '例：こだわりの一杯を、あなたに', maxLength: 20 },
    { key: 'feature_1', label: 'こだわり①', placeholder: '例：厳選素材', default: '厳選素材', maxLength: 14 },
    { key: 'feature_2', label: 'こだわり②', placeholder: '例：丁寧な手仕事', default: '丁寧な手仕事', maxLength: 14 },
    { key: 'feature_3', label: 'こだわり③', placeholder: '例：居心地の良い空間', default: '心地よい空間', maxLength: 14 },
    { key: 'menu_items', label: '人気メニュー（1行に「商品名 価格」／最大3行）', type: 'textarea', placeholder: '特製ラテ ¥480\nチーズケーキ ¥600', hint: '1行1商品・最大3行', maxLength: 28, maxLines: 3 },
    { key: 'review', label: 'お客様の声', placeholder: '例：また来たくなる素敵なお店！', maxLength: 26 },
    { key: 'coupon', label: 'LINE友だち特典', placeholder: '例：ドリンク1杯無料', maxLength: 18 },
    { key: 'store_info', label: '店舗情報（営業時間・定休日・住所など／最大3行）', type: 'textarea', placeholder: '11:00〜21:00\n定休日：水曜\n東京都〇〇1-2-3', hint: '最大3行', maxLength: 24, maxLines: 3 },
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
  // ② 新商品告知（インパクト）
  if (templateId === 'new-product') {
    const themeColor: Record<string, string> = { ポップ: '明るいイエロー＋ピンク', クール: '濃紺＋シルバー', ナチュラル: 'ベージュ＋グリーン', カラフル: 'レインボー配色' }
    const color = themeColor[f.theme] || '明るいイエロー＋ピンク'
    return [
      '飲食店向けの新商品告知ポスター(正方形1080×1080)を作成してください。',
      `■背景：${color}のポップで元気なデザイン。幾何学模様や吹き出し装飾を散りばめる。`,
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部：極太の英字大タイトル「${f.main_title}」（画面上部を大きく占める主役）`,
      `・上部右：赤や黄色のバッジに「${f.badge_text || '新登場'}」`,
      hasPhoto ? '・中央：添付の商品写真をシズル感たっぷりに大きく配置' : '・中央：商品を大きくイラスト調で配置',
      `・中央下：商品名「${f.product_name}」（丸ゴシック極太）`,
      f.sub_catch ? `・その下：サブキャッチ「${f.sub_catch}」` : '',
      f.description ? `・説明：「${f.description}」（小さめ・2行まで）` : '',
      f.price ? `・右下：価格「${f.price}」を大きく目立たせる` : '',
      '■デザイン：フォント=丸ゴシック極太。明るく賑やか・SNS映え・目を引くインパクト重視。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を商品として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ④ 商品ヒーロー写真（高級感）
  if (templateId === 'product-hero') {
    return [
      '飲食店向けの高級感ある商品訴求ポスター(正方形1080×1080)を作成してください。',
      '■背景：ダークブラウン〜黒の木目または単色テクスチャ。落ち着いた高級感。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部左：ゴールドのブラシストローク＋バッジ「${f.badge || '当店人気No.1'}」`,
      hasPhoto ? '・右側：添付の商品写真を大きく（湯気や光沢の演出、右端からはみ出す配置）' : '・右側：商品を大きく高級感ある演出で配置',
      `・左上：大型の白文字キャッチ「${f.main_catch}」（明朝体）`,
      f.description ? `・左中：商品説明「${f.description}」（白・小さめ・2行まで）` : '',
      `・下部：ゴールドのライン＋商品名「${f.product_name}」＋価格「${f.price || ''}」`,
      `・最下部：3つの黒丸バッジ「${f.feature_1 || '自家製'}」「${f.feature_2 || '特製'}」「${f.feature_3 || '厳選'}」`,
      '■デザイン：フォント=明朝体＋筆記体風。カラー=ブラック・ゴールド・ホワイト。高級感・上質感。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を商品として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ⑤ 写真メイン＋テキストオーバーレイ（SNS口コミ風）
  if (templateId === 'photo-overlay-callout') {
    const callouts = ['callout_1', 'callout_2', 'callout_3', 'callout_4', 'callout_5', 'callout_6']
      .map(k => f[k]).filter(Boolean)
    return [
      '飲食店向けのSNS口コミ風デザイン(正方形1080×1080)を作成してください。',
      hasPhoto ? '■背景：添付の料理写真を全面に使用。' : '■背景：シズル感のある料理写真を全面に。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      '・写真の各ポイントから手書き風の吹き出し（白線）を引き出す：',
      ...callouts.map((c, i) => `　→ 吹き出し${i + 1}「${c}」`),
      '・キラキラやハートの装飾を写真周辺にかわいく散りばめる',
      `・最下部：大きな手書き風の吹き出し「${f.main_comment || 'しあわせ〜♡'}」`,
      '■デザイン：フォント=手書き風フォント一択（白）。写真そのまま＋白の手書き文字のみ。SNS映え・かわいい。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を料理写真として全面に使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ③ LINE登録QRコード付き
  if (templateId === 'line-qr') {
    return [
      '飲食店向けのLINE友だち追加訴求ポスター(正方形1080×1080)を作成してください。',
      '■背景：LINEグリーンの濃淡グラデーション＋紙吹雪やキラキラ装飾。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部：メインキャッチ大文字「${f.main_catch}」`,
      hasPhoto ? '・左中央：スマホ風の枠に添付のQRコード画像を配置' : '・左中央：スマホ風の枠にQRコードのイラストを配置',
      '・右側：特典3つをナンバリングして縦並び',
      `　- 特典1「${f.benefit_1 || 'お得なクーポン'}」`,
      `　- 特典2「${f.benefit_2 || '新商品のお知らせ'}」`,
      `　- 特典3「${f.benefit_3 || '誕生日特典'}」`,
      '・右下：簡単3ステップ（丸アイコン＋矢印）',
      `・最下部：グリーン帯に白文字「${f.cta || '今すぐ登録してお得をゲット！'}」`,
      '■デザイン：フォント=丸ゴシック太字。カラー=LINEグリーン・白・イエロー。親しみやすく集客感。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をQRコードとして使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ⑥ メニュー表（グランド／ドリンク／スイーツ 共通）
  if (templateId === 'menu-grid' || templateId === 'drink-menu' || templateId === 'sweets-menu') {
    const menuLines = (f.menu_items || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 6)
      .map(l => `・${l}`).join('\n')
    const kind = templateId === 'drink-menu' ? 'ドリンク' : templateId === 'sweets-menu' ? 'スイーツ・デザート' : '料理'
    return [
      `飲食店向けのナチュラルな${kind}メニュー表(正方形1080×1080)を作成してください。`,
      '■背景：薄いベージュ＋四隅に葉っぱイラスト。うっすら和柄。落ち着いたナチュラル。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部：リーフ装飾＋タイトル「${f.title || 'おすすめメニュー'}」`,
      f.no1_name ? `・上段（一番人気）：${hasPhoto ? '添付の商品写真＋' : ''}王冠バッジ＋「${f.no1_name}」「${f.no1_price || ''}」「${f.no1_description || ''}」` : '',
      menuLines ? `・中段：メニュー一覧（商品名・価格・説明を整理して表示）\n${menuLines}` : '',
      f.special ? `・下部左：ゴールドの丸バッジ「${f.special}」` : '',
      f.other_menus ? `・下部：その他メニュー「${f.other_menus}」` : '',
      '■デザイン：フォント=明朝体＋ゴシック体ミックス。カラー=ベージュ・ダークグリーン・深赤・ゴールド。読みやすく上品。',
      '■日本語の文字（商品名・価格）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を一番人気の商品写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ② カレンダー・スケジュール表
  if (templateId === 'calendar-schedule') {
    const events = (f.special_events || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5)
      .map(l => `・${l}`).join('\n')
    return [
      '飲食店向けの月間営業カレンダー(正方形1080×1080)を作成してください。',
      '■背景：薄いベージュ＋上部に季節の枝イラスト。清潔感のあるデザイン。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部帯：黒背景に白文字「${f.title || '営業カレンダー'}」${f.month ? `＋「${f.month}」` : ''}`,
      f.business_hours ? `・右上ボックス：営業時間「${f.business_hours}」` : '',
      f.closed_day ? `・右上ボックス：定休日「${f.closed_day}」（定休日は赤丸「休」で表示）` : '',
      '・メイン：7列（月〜日）の月間カレンダーグリッド。日付を正確に配置。',
      events ? `・特別日はアイコン付きバッジで強調：\n${events}` : '',
      f.footer_message ? `・最下部：凡例＋メッセージ「${f.footer_message}」` : '',
      '■デザイン：フォント=明朝体＋ゴシック体ミックス。カラー=黒・赤・ベージュ＋アクセント。見やすく整然と。',
      '■日本語と数字（日付・営業時間）は正確に描画し、指定以外の文字や見切れは入れないこと。',
    ].filter(Boolean).join('\n')
  }
  // 店舗ブランド紹介（高級感）／メニュー表紙
  if (templateId === 'menu-cover') {
    return [
      '飲食店向けの店舗ブランド紹介・メニュー表紙ビジュアル(正方形1080×1080)を作成してください。',
      '■背景：ダークネイビー〜黒の上質なテクスチャ。ゴールドの細いラインで高級感を演出。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      hasPhoto ? '・中央または背景に添付の店舗・料理写真を印象的に配置' : '・中央に店舗の世界観を象徴するビジュアルを配置',
      `・中央：店名「${f.store_name}」（明朝体・大きく上品に）`,
      f.store_sub_name ? `・店名の下：サブネーム「${f.store_sub_name}」（細字）` : '',
      f.catch_copy ? `・上部または下部：キャッチコピー「${f.catch_copy}」` : '',
      f.description ? `・下部：紹介文「${f.description}」（小さめ・2行まで）` : '',
      '■デザイン：フォント=明朝体メイン。カラー=ネイビー・ブラック・ゴールド・ホワイト。洗練された高級感。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を店舗イメージ写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ⑦ 縦型LP風（総合訴求）
  if (templateId === 'vertical-lp') {
    const menuLines = (f.menu_items || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3)
      .map(l => `・${l}`).join('\n')
    return [
      '飲食店向けの縦型LP風の総合訴求デザイン(縦長1080×1350)を作成してください。',
      '■背景：黒〜ダークブラウン基調。上質でまとまりのあるデザイン。',
      '■配置（上から順・この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・最上部：店名「${f.store_name}」＋サブキャッチ「${f.sub_catch || ''}」${hasPhoto ? '＋添付写真を横幅いっぱいに' : ''}`,
      `・こだわり3つを横並び（アイコン付き）：「${f.feature_1 || '厳選素材'}」「${f.feature_2 || '丁寧な手仕事'}」「${f.feature_3 || '心地よい空間'}」`,
      menuLines ? `・人気メニュー：\n${menuLines}` : '',
      f.review ? `・お客様の声：「${f.review}」＋星評価` : '',
      f.coupon ? `・下部帯：LINE友だち限定「${f.coupon}」＋QRコード` : '',
      f.store_info ? `・最下部：店舗情報「${f.store_info.replace(/\n/g, ' / ')}」` : '',
      '■デザイン：フォント=明朝体メイン＋ゴシック補助。カラー=ブラック・ダークレッド・ゴールド・クリーム。情報を整理し上品に。',
      '■日本語と数字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を店舗・商品写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  return ''
}
