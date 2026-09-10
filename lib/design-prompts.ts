// ─── テンプレ別プロンプト組立（AI画像生成 Nano Banana 2 用）─────────────
// 出典: H:\マイドライブ\Funrix\DESIGNBOX\designbox_ai_prompt_spec.md（画像プロンプト・参考画像.docx）
// 全11テンプレ（バナー/新商品/商品ヒーロー/写真オーバーレイ/各種メニュー表/表紙/LINE-QR/カレンダー/縦型LP）実装済み。
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
  // ══ 参考画像方式6テンプレ（2026-09-02 追加・依頼書「AI画像生成サービス実装依頼書」）══
  // 出典: Downloads/画像プロンプト・参考画像.docx 末尾6点を参考画像(Image 1)として使用。
  // 生成は buildReferencePrompt。参考画像バイト＋顧客画像(Image 2)を generate API がGeminiへ送る。
  // ※繰り返し項目はtextarea行方式。値に空白を含む項目は「／」区切り（whitespace分割の崩れ防止）。

  // 5-1 スパ&マッサージ OPEN告知（references/01_spa_open.png / Image2=メイン施術写真）
  'spa_open': [
    { key: 'shop_name', label: 'サロン名（右上ロゴバッジ）', placeholder: '例：リラクゼーション凛', required: true, maxLength: 18 },
    { key: 'catch_copy', label: 'キャッチコピー（左上）', placeholder: '例：日常を忘れる、極上の癒やし空間で', maxLength: 30 },
    { key: 'sub_notice_text', label: '見出し下の説明文', placeholder: '例：厳選オイルとていねいな手技でお疲れをリセット', maxLength: 44 },
    { key: 'open_label', label: 'OPEN表記の語句', placeholder: 'OPEN', default: 'OPEN', maxLength: 12 },
    { key: 'open_date', label: 'オープン日', placeholder: '例：11.15 SUN', maxLength: 16 },
    { key: 'features', label: '特長バッジ（1行に1つ・3行まで）', type: 'textarea', placeholder: '駅徒歩3分\n完全個室\n国家資格保有', hint: '右側の白い円形バッジ3つに入ります', maxLength: 12, maxLines: 3 },
    { key: 'reservation_label', label: '予約ボックスの文言', placeholder: 'ご予約専用', default: 'ご予約専用', maxLength: 16 },
    { key: 'campaigns', label: '特典ボックス（1行に「特典名／割引内容／期限」・2行まで）', type: 'textarea', placeholder: '全メニュー／初回限定30%OFF／2026年12月31日\n友だち紹介で／¥500割引／2027年1月31日', hint: '下部の特典ボックス2つ。項目は「／」で区切ってください', maxLength: 60, maxLines: 2 },
  ],
  // 5-2 焼肉弁当メニュー（references/02_yakiniku_bento.png / Image2=一番大きい弁当写真）
  'yakiniku_bento': [
    { key: 'shop_name', label: '店名（左上の毛筆ロゴ）', placeholder: '例：焼肉 和牛亭', required: true, maxLength: 16 },
    { key: 'tagline_label', label: 'ロゴ下の表記', placeholder: '焼肉弁当', default: '焼肉弁当', maxLength: 12 },
    { key: 'seasonal_mark_text', label: '飾り印の文字', placeholder: '秋', default: '秋', maxLength: 4 },
    { key: 'items', label: 'お弁当（1行に「商品名／価格／説明」・4行まで）', type: 'textarea', placeholder: '特上カルビ弁当／1200／自家製だれ\n上ロース弁当／980／やわらか', hint: '一番大きい枠が顧客写真に置き換わります。価格は数字のみ', maxLength: 40, maxLines: 4 },
    { key: 'rice_note', label: 'ご飯に関する注記', placeholder: '例：ご飯大盛り無料', maxLength: 24 },
    { key: 'tel', label: '電話番号', placeholder: '例：03-1234-5678', maxLength: 18 },
    { key: 'reception_hours', label: '受付時間', placeholder: '例：10:00〜19:00', maxLength: 20 },
    { key: 'pickup_hours', label: 'お渡し時間', placeholder: '例：11:00〜20:00', maxLength: 20 },
    { key: 'holiday', label: '定休日', placeholder: '例：毎週水曜', maxLength: 16 },
    { key: 'address', label: '住所', placeholder: '例：東京都〇〇区〇〇1-2-3', maxLength: 30 },
    { key: 'order_qr_label', label: '注文QRのラベル', placeholder: 'ご注文はこちらから', default: 'ご注文はこちらから', maxLength: 20 },
  ],
  // 5-3 テイクアウト弁当メニュー（references/03_takeout_bento.png / Image2=一番目立つ写真タイル）
  'takeout_bento': [
    { key: 'headline', label: '見出しコピー（3行想定）', placeholder: '例：できたて手作り／お弁当／はじめました', required: true, maxLength: 30 },
    { key: 'intro_text', label: '紹介文', placeholder: '例：地元食材にこだわった手作り弁当をお届けします', maxLength: 40 },
    { key: 'shop_tagline', label: 'ロゴ下のタグライン', placeholder: 'お弁当・お惣菜', default: 'お弁当・お惣菜', maxLength: 16 },
    { key: 'delivery_badge_text', label: '宅配バッジの文言', placeholder: '1個から宅配承ります', default: '1個から宅配承ります', maxLength: 20 },
    { key: 'items', label: '商品（1行に「商品名／価格」・6行まで）', type: 'textarea', placeholder: '唐揚げ弁当／650\nのり弁当／450', hint: '6品グリッド。価格は数字のみ', maxLength: 30, maxLines: 6 },
    { key: 'features', label: '特徴アイコン（1行に1つ・3行まで）', type: 'textarea', placeholder: 'できたて\n国産食材\n毎日日替わり', maxLength: 16, maxLines: 3 },
    { key: 'shop_name', label: '店名', placeholder: '例：お弁当 和ごはん', maxLength: 18 },
    { key: 'address', label: '住所', maxLength: 30 },
    { key: 'hours', label: '営業時間', placeholder: '例：10:00〜19:00', maxLength: 24 },
    { key: 'holiday', label: '定休日', placeholder: '例：日曜', maxLength: 16 },
    { key: 'tel', label: '電話番号', maxLength: 18 },
    { key: 'fax', label: 'FAX', maxLength: 18 },
    { key: 'notice_text', label: 'フッターの注意書き', placeholder: '例：前日までのご予約がおすすめです', maxLength: 40 },
    { key: 'order_qr_label', label: '注文QRのラベル', placeholder: 'WEB注文はこちらから', default: 'WEB注文はこちらから', maxLength: 20 },
  ],
  // 5-4 エステ集客・ピンク（references/04_esthe_pink.png / Image2=メイン施術写真）
  'esthe_pink': [
    { key: 'ribbon_text', label: '上部リボンの文言', placeholder: '大人女性のための', default: '大人女性のための', maxLength: 16 },
    { key: 'headline', label: '見出しコピー', placeholder: '例：エステで叶えるうるおい肌', required: true, maxLength: 26 },
    { key: 'salon_name', label: 'サロン名', placeholder: '例：Beauté Premier', required: true, maxLength: 18 },
    { key: 'anniversary_badge', label: '周年バッジ（右上）', placeholder: '例：開業5周年', maxLength: 14 },
    { key: 'sub_catch', label: '訴求フレーズ（右上）', placeholder: '例：初めての方限定', maxLength: 20 },
    { key: 'features', label: '特徴アイコン（1行に1つ・3行まで）', type: 'textarea', placeholder: '完全個室\n経験豊富な担当者\nオーダーメイド施術', maxLength: 16, maxLines: 3 },
    { key: 'course_name', label: '体験コース名', placeholder: '例：フェイシャル体験コース', maxLength: 20 },
    { key: 'checks', label: 'コース内容チェック（1行に1つ・5行まで）', type: 'textarea', placeholder: 'カウンセリング\nクレンジング\nフェイシャル\n保湿ケア\nアフターティー', maxLength: 20, maxLines: 5 },
    { key: 'regular_price', label: '通常価格（数字のみ）', placeholder: '例：11000', numeric: true, maxLength: 6 },
    { key: 'special_price', label: '特別価格（数字のみ）', placeholder: '例：3980', numeric: true, maxLength: 6 },
    { key: 'campaign_notes', label: 'キャンペーン注意書き', placeholder: 'お一人様1回限り／他の割引との併用不可', default: 'お一人様1回限り／他の割引との併用不可', maxLength: 40 },
    { key: 'reasons_title', label: '「選ばれる理由」の見出し', placeholder: '当サロンが選ばれる理由', default: '当サロンが選ばれる理由', maxLength: 20 },
    { key: 'reasons', label: '選ばれる理由（1行に1つ・5行まで）', type: 'textarea', placeholder: '高い技術力\n丁寧なカウンセリング\n清潔な空間\n続けやすい料金\n駅チカ', maxLength: 24, maxLines: 5 },
    { key: 'line_promo_text', label: 'LINE友だち登録欄の文言', placeholder: '友だち追加でお得なクーポンをプレゼント!', default: '友だち追加でお得なクーポンをプレゼント!', maxLength: 30 },
    { key: 'tel', label: '電話番号', maxLength: 18 },
    { key: 'hours', label: '受付時間・定休日', placeholder: '例：10:00〜20:00 / 不定休', maxLength: 26 },
    { key: 'address', label: '住所', maxLength: 30 },
    { key: 'access', label: '最寄駅・アクセス', placeholder: '例：〇〇駅 徒歩5分', maxLength: 24 },
  ],
  // 5-5 エステ集客・ゴールド（references/05_esthe_gold.png / Image2=メイン施術写真）
  'esthe_gold': [
    { key: 'headline', label: '見出しコピー', placeholder: '例：エステで叶えるうるおい肌', required: true, maxLength: 26 },
    { key: 'salon_name', label: 'サロン名', placeholder: '例：PREMIÈRE BEAUTÉ', required: true, maxLength: 18 },
    { key: 'sub_catch', label: '訴求フレーズ（右・縦書き）', placeholder: '例：自信あふれる毎日を', maxLength: 20 },
    { key: 'features', label: '特徴アイコン（1行に1つ・3行まで）', type: 'textarea', placeholder: '完全個室\n経験豊富な担当者\nオーダーメイド施術', maxLength: 16, maxLines: 3 },
    { key: 'course_name', label: '体験コース名', placeholder: '例：フェイシャル体験コース', maxLength: 20 },
    { key: 'checks', label: 'コース内容チェック（1行に1つ・5行まで）', type: 'textarea', placeholder: 'カウンセリング\nクレンジング\nフェイシャル\n保湿ケア\nアフターティー', maxLength: 20, maxLines: 5 },
    { key: 'regular_price', label: '通常価格（数字のみ）', placeholder: '例：13000', numeric: true, maxLength: 6 },
    { key: 'special_price', label: '特別価格（数字のみ）', placeholder: '例：4500', numeric: true, maxLength: 6 },
    { key: 'campaign_notes', label: 'キャンペーン注意書き', placeholder: 'お一人様1回限り／他の割引との併用不可', default: 'お一人様1回限り／他の割引との併用不可', maxLength: 40 },
    { key: 'reasons_title', label: '「選ばれる理由」の見出し', placeholder: '当サロンが選ばれる理由', default: '当サロンが選ばれる理由', maxLength: 20 },
    { key: 'reasons', label: '選ばれる理由（1行に1つ・5行まで）', type: 'textarea', placeholder: '高い技術力\n丁寧なカウンセリング\n清潔な空間\n続けやすい料金\n駅チカ', maxLength: 24, maxLines: 5 },
    { key: 'courses', label: 'コース料金3つ（1行に「コース名／時間／説明／価格」・3行）', type: 'textarea', placeholder: 'フェイシャル／60分／毛穴ケア／8000\nボディ／90分／全身ほぐし／12000\n痩身／90分／部分集中／14000', hint: '下部の3つの料金ボックス。項目は「／」で区切る。価格は数字のみ', maxLength: 44, maxLines: 3 },
    { key: 'line_promo_text', label: 'LINE予約欄の文言', placeholder: 'ご予約はLINEで簡単予約', default: 'ご予約はLINEで簡単予約', maxLength: 30 },
    { key: 'tel', label: '電話番号', maxLength: 18 },
    { key: 'address', label: '住所', maxLength: 30 },
    { key: 'access', label: '最寄駅・アクセス', placeholder: '例：〇〇駅 徒歩3分', maxLength: 24 },
  ],
  // 5-6 LINE公式アカウント友だち登録案内（references/06_line_guide.png / Image2=顧客のQRコード画像）
  'line_guide': [
    { key: 'line_id', label: 'LINE ID', placeholder: '例：@sample_salon', required: true, maxLength: 20 },
    { key: 'promo_text', label: '吹き出しの訴求文言', placeholder: '例：友だち追加でお得なクーポンをGET！', maxLength: 26 },
    { key: 'headline', label: '大見出し', placeholder: '友だち登録募集中!', default: '友だち登録募集中!', maxLength: 20 },
    { key: 'method_section_title', label: 'セクションタイトル', placeholder: 'LINE「友だち追加」方法', default: 'LINE「友だち追加」方法', maxLength: 22 },
    { key: 'method_1_label', label: '方法1のラベル', placeholder: '「QRコード」で登録', default: '「QRコード」で登録', maxLength: 20 },
    { key: 'method_1_instructions', label: '方法1の説明文', placeholder: '例：カメラでQRコードを読み取ってください', maxLength: 44 },
    { key: 'method_2_label', label: '方法2のラベル', placeholder: '「ID検索」で登録', default: '「ID検索」で登録', maxLength: 20 },
    { key: 'method_2_instructions', label: '方法2の説明文', placeholder: '例：IDを検索して友だち追加してください', maxLength: 44 },
    { key: 'company_name', label: '会社名・店舗名（フッター）', placeholder: '例：株式会社〇〇クリエイティブ', maxLength: 24 },
  ],
  'ramen_main': [
    { key: "shop_name", label: "店名", maxLength: 28 },
    { key: "headline", label: "見出し", maxLength: 28 },
    { key: "title", label: "大見出し", maxLength: 28 },
    { key: "sub_copy", label: "帯コピー", maxLength: 60 },
    { key: "point_1_title", label: "こだわり1(タイトル)", maxLength: 28 },
    { key: "point_1_desc", label: "こだわり1(説明)", maxLength: 60 },
    { key: "point_2_title", label: "こだわり2(タイトル)", maxLength: 28 },
    { key: "point_2_desc", label: "こだわり2(説明)", maxLength: 60 },
    { key: "point_3_title", label: "こだわり3(タイトル)", maxLength: 28 },
    { key: "point_3_desc", label: "こだわり3(説明)", maxLength: 60 },
    { key: "side_banner_text", label: "縦帯コピー", maxLength: 60 },
    { key: "checklist_title", label: "チェックリスト見出し", default: "◯◯のこだわり", maxLength: 60 },
    { key: "check_1", label: "こだわり項目1", maxLength: 40 },
    { key: "check_5", label: "こだわり項目5", maxLength: 40 },
    { key: "item_name_1", label: "商品名1", maxLength: 28 },
    { key: "price_1", label: "価格1", numeric: true, maxLength: 8 },
    { key: "item_desc_1", label: "商品説明1", maxLength: 60 },
    { key: "item_name_2", label: "商品名2", maxLength: 28 },
    { key: "price_2", label: "価格2", numeric: true, maxLength: 8 },
    { key: "item_desc_2", label: "商品説明2", maxLength: 60 },
    { key: "item_name_3", label: "商品名3", maxLength: 28 },
    { key: "price_3", label: "価格3", numeric: true, maxLength: 8 },
    { key: "item_desc_3", label: "商品説明3", maxLength: 60 },
    { key: "review_1_title", label: "お客様の声1(タイトル)", maxLength: 28 },
    { key: "review_1_comment", label: "お客様の声1(コメント)", maxLength: 40 },
    { key: "review_1_profile", label: "お客様の声1(プロフィール)", maxLength: 40 },
    { key: "review_2_title", label: "お客様の声2(タイトル)", maxLength: 28 },
    { key: "review_2_comment", label: "お客様の声2(コメント)", maxLength: 40 },
    { key: "review_2_profile", label: "お客様の声2(プロフィール)", maxLength: 40 },
    { key: "review_3_title", label: "お客様の声3(タイトル)", maxLength: 28 },
    { key: "review_3_comment", label: "お客様の声3(コメント)", maxLength: 40 },
    { key: "review_3_profile", label: "お客様の声3(プロフィール)", maxLength: 40 },
    { key: "coupon_text", label: "クーポン文言", maxLength: 60 },
    { key: "coupon_step_1", label: "クーポン手順1", maxLength: 40 },
    { key: "coupon_step_2", label: "クーポン手順2", maxLength: 40 },
    { key: "coupon_step_3", label: "クーポン手順3", maxLength: 40 },
    { key: "hours", label: "営業時間", maxLength: 40 },
    { key: "holiday", label: "定休日", maxLength: 40 },
    { key: "tel", label: "電話番号", maxLength: 40 },
    { key: "address", label: "住所", maxLength: 40 },
    { key: "station_access", label: "駅からのアクセス", maxLength: 40 },
  ],
  'line_benefits': [
    { key: "headline_prefix", label: "見出し(前半)", default: "友だち追加で", maxLength: 28 },
    { key: "headline_main", label: "見出し(メイン)", default: "お得なクーポンプレゼント!", maxLength: 28 },
    { key: "headline_sub", label: "サブ見出し", default: "うれしい特典がたくさん!", maxLength: 28 },
    { key: "line_id", label: "LINE ID", maxLength: 40 },
    { key: "benefit_1_text", label: "特典1(テキスト)", maxLength: 60 },
    { key: "benefit_2_title", label: "特典2(タイトル)", maxLength: 28 },
    { key: "benefit_2_desc", label: "特典2(説明)", maxLength: 60 },
    { key: "benefit_3_title", label: "特典3(タイトル)", maxLength: 28 },
    { key: "benefit_3_desc", label: "特典3(説明)", maxLength: 60 },
    { key: "step_1_label", label: "ステップ1(ラベル)", maxLength: 28 },
    { key: "step_1_desc", label: "ステップ1(説明)", maxLength: 60 },
    { key: "step_2_label", label: "ステップ2(ラベル)", maxLength: 28 },
    { key: "step_2_desc", label: "ステップ2(説明)", maxLength: 60 },
    { key: "step_3_label", label: "ステップ3(ラベル)", maxLength: 28 },
    { key: "step_3_desc", label: "ステップ3(説明)", maxLength: 60 },
    { key: "bottom_note_1", label: "下部の案内1", default: "さらに!友だち限定の特典も配信中!", maxLength: 60 },
    { key: "bottom_note_2", label: "下部の案内2", default: "今すぐ登録してお得をゲットしよう!", maxLength: 60 },
  ],
  'sns_annotation': [
    { key: "caption_1", label: "吹き出しコメント1", maxLength: 40 },
    { key: "caption_2", label: "吹き出しコメント2", maxLength: 40 },
    { key: "caption_3", label: "吹き出しコメント3", maxLength: 40 },
    { key: "caption_4", label: "吹き出しコメント4", maxLength: 40 },
    { key: "caption_5", label: "吹き出しコメント5", maxLength: 40 },
    { key: "caption_6", label: "吹き出しコメント6", maxLength: 40 },
    { key: "caption_7", label: "吹き出しコメント7", maxLength: 40 },
    { key: "caption_8", label: "吹き出しコメント8", maxLength: 40 },
    { key: "caption_9", label: "吹き出しコメント9", maxLength: 40 },
    { key: "shop_name_label", label: "店名ラベル", maxLength: 28 },
  ],
  'calendar': [
    { key: "title_text", label: "大見出し", default: "営業カレンダー", maxLength: 60 },
    { key: "thank_you_note", label: "感謝メッセージ", default: "いつもご来店ありがとうございます", maxLength: 60 },
    { key: "shop_name", label: "店名", maxLength: 28 },
    { key: "year_month", label: "年月", maxLength: 40 },
    { key: "hours", label: "営業時間", maxLength: 40 },
    { key: "holiday", label: "定休日", maxLength: 40 },
    { key: "feature_menu_name", label: "限定メニュー名", maxLength: 28 },
    { key: "feature_menu_period", label: "実施期間", maxLength: 60 },
    { key: "day_tags", label: "日付タグ(日:内容 を改行区切り)", maxLength: 28 },
    { key: "legend_text", label: "凡例", maxLength: 60 },
    { key: "notice_text", label: "案内文", maxLength: 60 },
    { key: "footer_note", label: "最下部の一言", default: "皆さまのご来店を心よりお待ちしております!", maxLength: 60 },
  ],
  'recommend_menu': [
    { key: "heading", label: "見出し", maxLength: 28 },
    { key: "tagline", label: "タグライン", maxLength: 60 },
    { key: "badge_text", label: "バッジ文言", maxLength: 60 },
    { key: "hero_item_name", label: "メイン商品名", maxLength: 28 },
    { key: "hero_price", label: "メイン価格", numeric: true, maxLength: 8 },
    { key: "hero_desc", label: "メイン説明", maxLength: 60 },
    { key: "sub_item_1_name", label: "サブ商品1(名前)", maxLength: 28 },
    { key: "sub_price_1", label: "サブ価格1", numeric: true, maxLength: 8 },
    { key: "sub_desc_1", label: "サブ説明1", maxLength: 60 },
    { key: "sub_item_2_name", label: "サブ商品2(名前)", maxLength: 28 },
    { key: "sub_price_2", label: "サブ価格2", numeric: true, maxLength: 8 },
    { key: "sub_desc_2", label: "サブ説明2", maxLength: 60 },
    { key: "sub_item_3_name", label: "サブ商品3(名前)", maxLength: 28 },
    { key: "sub_price_3", label: "サブ価格3", numeric: true, maxLength: 8 },
    { key: "sub_desc_3", label: "サブ説明3", maxLength: 60 },
    { key: "extra_menu_intro", label: "メニュー前置き", default: "その他のメニューもご用意しております", maxLength: 60 },
    { key: "extra_menu_tags", label: "タグ一覧", maxLength: 28 },
    { key: "banner_text_1", label: "バナー1", maxLength: 60 },
    { key: "banner_text_2", label: "バナー2", maxLength: 60 },
  ],
  'spring_sale': [
    { key: "badge_text", label: "バッジ文言", maxLength: 60 },
    { key: "title", label: "大見出し", maxLength: 28 },
    { key: "subtitle", label: "吹き出し", maxLength: 28 },
    { key: "discount_rate", label: "割引率", numeric: true, maxLength: 8 },
    { key: "date_range", label: "期間", maxLength: 40 },
    { key: "desc_text", label: "説明文", maxLength: 60 },
    { key: "item_name_1", label: "商品名1", maxLength: 28 },
    { key: "original_price_1", label: "通常価格1", numeric: true, maxLength: 8 },
    { key: "sale_price_1", label: "割引後価格1", numeric: true, maxLength: 8 },
    { key: "item_name_2", label: "商品名2", maxLength: 28 },
    { key: "original_price_2", label: "通常価格2", numeric: true, maxLength: 8 },
    { key: "sale_price_2", label: "割引後価格2", numeric: true, maxLength: 8 },
    { key: "item_name_3", label: "商品名3", maxLength: 28 },
    { key: "original_price_3", label: "通常価格3", numeric: true, maxLength: 8 },
    { key: "sale_price_3", label: "割引後価格3", numeric: true, maxLength: 8 },
    { key: "footer_text", label: "締めコピー", maxLength: 60 },
  ],
  'single_item_dark': [
    { key: "badge_text", label: "バッジ文言", maxLength: 60 },
    { key: "catch_copy", label: "キャッチコピー", maxLength: 60 },
    { key: "desc_text", label: "説明文", maxLength: 60 },
    { key: "item_name", label: "商品名", maxLength: 28 },
    { key: "price", label: "価格", numeric: true, maxLength: 8 },
    { key: "feature_1_title", label: "特長1(タイトル)", maxLength: 28 },
    { key: "feature_1_desc", label: "特長1(説明)", maxLength: 60 },
    { key: "feature_2_title", label: "特長2(タイトル)", maxLength: 28 },
    { key: "feature_2_desc", label: "特長2(説明)", maxLength: 60 },
    { key: "feature_3_title", label: "特長3(タイトル)", maxLength: 28 },
    { key: "feature_3_desc", label: "特長3(説明)", maxLength: 60 },
  ],
  'smoothie_single': [
    { key: "use_logo_image", label: "ロゴ画像を使う", type: "select", options: ["false", "true"], default: "false" },
    { key: "callout_text", label: "手描き一言", maxLength: 60 },
    { key: "new_badge_text", label: "NEWバッジ", maxLength: 60 },
    { key: "title_en_1", label: "英字1", default: "MIX", maxLength: 28 },
    { key: "title_en_2", label: "英字2", default: "SMOOTHIE", maxLength: 28 },
    { key: "title_jp", label: "タイトル(和文)", maxLength: 28 },
    { key: "period_badge_label", label: "期間バッジ", default: "期間限定", maxLength: 60 },
    { key: "start_date", label: "開始日", maxLength: 40 },
    { key: "start_weekday", label: "開始曜日", maxLength: 40 },
    { key: "start_label", label: "開始ラベル", default: "START!", maxLength: 28 },
    { key: "brand_name", label: "ブランド名", maxLength: 28 },
    { key: "brand_tagline", label: "ブランド一言", maxLength: 60 },
    { key: "flavor_title", label: "フレーバー見出し", maxLength: 28 },
    { key: "ingredient_1", label: "材料1", maxLength: 40 },
    { key: "ingredient_2", label: "材料2", maxLength: 40 },
    { key: "ingredient_3", label: "材料3", maxLength: 40 },
    { key: "bottom_badge_text", label: "下部バッジ", maxLength: 60 },
    { key: "size_label", label: "サイズ表記", maxLength: 28 },
    { key: "price", label: "価格", numeric: true, maxLength: 8 },
    { key: "takeout_label", label: "テイクアウト表記", default: "テイクアウトOK!", maxLength: 28 },
  ],
  'smoothie_trio': [
    { key: "callout_text", label: "手描き一言", maxLength: 60 },
    { key: "new_badge_text", label: "NEWバッジ", maxLength: 60 },
    { key: "title_line_1", label: "大見出し1行目", default: "ごろっと", maxLength: 28 },
    { key: "title_line_2", label: "大見出し2行目", default: "フルーツ", maxLength: 28 },
    { key: "title_line_3", label: "大見出し3行目", default: "スムージー", maxLength: 28 },
    { key: "period_badge_label", label: "期間バッジ", maxLength: 60 },
    { key: "start_date", label: "開始日", maxLength: 40 },
    { key: "start_weekday", label: "開始曜日", maxLength: 40 },
    { key: "start_label", label: "開始ラベル", maxLength: 28 },
    { key: "flavor_1_name", label: "フレーバー1(名前)", maxLength: 28 },
    { key: "flavor_2_name", label: "フレーバー2(名前)", maxLength: 28 },
    { key: "flavor_3_name", label: "フレーバー3(名前)", maxLength: 28 },
    { key: "size_label", label: "サイズ表記", maxLength: 28 },
    { key: "price", label: "価格", numeric: true, maxLength: 8 },
    { key: "sub_catch", label: "サブコピー", maxLength: 60 },
    { key: "feature_1_title", label: "特長1(タイトル)", maxLength: 28 },
    { key: "feature_1_desc", label: "特長1(説明)", maxLength: 60 },
    { key: "feature_2_title", label: "特長2(タイトル)", maxLength: 28 },
    { key: "feature_2_desc", label: "特長2(説明)", maxLength: 60 },
    { key: "feature_3_title", label: "特長3(タイトル)", maxLength: 28 },
    { key: "feature_3_desc", label: "特長3(説明)", maxLength: 60 },
  ],
  'veggie_focaccia_poster': [
    { key: "title_line_1", label: "大見出し1行目", default: "ROASTED VEGGIE", maxLength: 28 },
    { key: "title_line_2", label: "大見出し2行目", default: "FOCACCIA", maxLength: 28 },
    { key: "location_name", label: "地名/店舗名", default: "KOBE HARBOR", maxLength: 28 },
    { key: "tagline", label: "タグライン", default: "A BRIGHT, CRUNCHY SANDWICH MADE FOR LUNCH.", maxLength: 60 },
    { key: "hours", label: "営業時間", maxLength: 40 },
    { key: "holiday", label: "定休日", maxLength: 40 },
  ],
  'ingredient_diagram_sandwich': [
    { key: "title_line_1", label: "大見出し1行目", maxLength: 28 },
    { key: "title_line_2", label: "大見出し2行目", maxLength: 28 },
    { key: "ingredient_1", label: "具材1", maxLength: 40 },
    { key: "ingredient_2", label: "具材2", maxLength: 40 },
    { key: "ingredient_3", label: "具材3", maxLength: 40 },
    { key: "ingredient_4", label: "具材4", maxLength: 40 },
    { key: "ingredient_5", label: "具材5", maxLength: 40 },
    { key: "ingredient_6", label: "具材6", maxLength: 40 },
    { key: "ingredient_7", label: "具材7", maxLength: 40 },
  ],
  'strawberry_milk_kakigori': [
    { key: "title_jp", label: "タイトル(和文)", maxLength: 28 },
    { key: "subtitle_jp", label: "サブタイトル", maxLength: 28 },
    { key: "title_en_script", label: "英語表記", maxLength: 28 },
    { key: "badge_text", label: "バッジ文言", default: "季節限定", maxLength: 60 },
    { key: "price", label: "価格", numeric: true, maxLength: 8 },
  ],
  'strawberry_pistachio_crepe': [
    { key: "label_left", label: "左ラベル", default: "CREPE", maxLength: 28 },
    { key: "label_right", label: "右ラベル", default: "SEASONAL", maxLength: 28 },
    { key: "title_line_1", label: "大見出し1行目", maxLength: 28 },
    { key: "title_line_2", label: "大見出し2行目", maxLength: 28 },
    { key: "subtitle_script", label: "サブタイトル(筆記体)", maxLength: 28 },
    { key: "desc_text", label: "説明文", maxLength: 60 },
  ],
  'bakery_opening_day': [
    { key: "business_genre", label: "業種", maxLength: 40 },
    { key: "logo_icon_desc", label: "ロゴアイコン", maxLength: 60 },
    { key: "shop_name", label: "店名", default: "Sunny Hearth", maxLength: 28 },
    { key: "shop_name_sub", label: "店名(英字)", default: "BAKERY", maxLength: 28 },
    { key: "corner_illustration_1", label: "コーナー装飾1", maxLength: 40 },
    { key: "corner_illustration_2", label: "コーナー装飾2", maxLength: 40 },
    { key: "corner_illustration_3", label: "コーナー装飾3", maxLength: 40 },
    { key: "corner_illustration_4", label: "コーナー装飾4", maxLength: 40 },
    { key: "corner_illustration_5", label: "コーナー装飾5", maxLength: 40 },
    { key: "title_text", label: "大見出し", default: "BAKERY OPENING DAY", maxLength: 60 },
    { key: "event_date", label: "開催日", maxLength: 40 },
    { key: "event_hours", label: "営業時間", maxLength: 40 },
    { key: "offer_1_badge", label: "特典1(バッジ)", default: "先着100名様", maxLength: 28 },
    { key: "offer_1_title", label: "特典1(タイトル)", default: "焼きたてパンプレゼント", maxLength: 28 },
    { key: "offer_1_desc", label: "特典1(説明)", maxLength: 60 },
    { key: "offer_2_badge", label: "特典2(バッジ)", default: "数量限定", maxLength: 28 },
    { key: "offer_2_title", label: "特典2(タイトル)", default: "限定セット", maxLength: 28 },
    { key: "offer_2_price", label: "特典2(価格)", numeric: true, maxLength: 8 },
    { key: "offer_2_desc", label: "特典2(説明)", maxLength: 60 },
    { key: "feature_1", label: "特長1", maxLength: 40 },
    { key: "feature_2", label: "特長2", maxLength: 40 },
    { key: "feature_3", label: "特長3", maxLength: 40 },
    { key: "feature_4", label: "特長4", maxLength: 40 },
    { key: "access_label", label: "アクセス欄ラベル", default: "アクセス", maxLength: 28 },
    { key: "shop_catch", label: "店舗キャッチ", maxLength: 60 },
    { key: "shop_desc", label: "店舗説明", maxLength: 60 },
    { key: "footer_note", label: "最下部の一言", default: "皆さまのご来店を心よりお待ちしております!", maxLength: 60 },
  ],
  'new_open_690_campaign': [
    { key: "top_banner_label", label: "上部帯ラベル", default: "NEW OPEN!", maxLength: 28 },
    { key: "top_banner_text", label: "上部帯テキスト", default: "皆さまのご来店をお待ちしています!", maxLength: 60 },
    { key: "badge_text", label: "バッジ文言", default: "OPEN記念", maxLength: 60 },
    { key: "period_label", label: "期間表記", default: "7日間限定!", maxLength: 60 },
    { key: "price", label: "価格", default: "690", numeric: true, maxLength: 8 },
    { key: "campaign_period", label: "キャンペーン期間", maxLength: 60 },
    { key: "campaign_conditions", label: "利用条件", maxLength: 60 },
    { key: "item_1_comment", label: "商品1(コメント)", maxLength: 40 },
    { key: "item_1_name", label: "商品1(名前)", maxLength: 28 },
    { key: "item_2_comment", label: "商品2(コメント)", maxLength: 40 },
    { key: "item_2_name", label: "商品2(名前)", maxLength: 28 },
    { key: "item_3_comment", label: "商品3(コメント)", maxLength: 40 },
    { key: "item_3_name", label: "商品3(名前)", maxLength: 28 },
    { key: "shop_tagline", label: "キャッチコピー", default: "美味しい時間を、もっと身近に。", maxLength: 60 },
    { key: "shop_name", label: "店名", maxLength: 28 },
    { key: "shop_desc", label: "店舗説明", maxLength: 60 },
    { key: "notice_text", label: "案内文", maxLength: 60 },
  ],
  'weekend_brunch_plate': [
    { key: "item_1_name", label: "商品1(名前)", default: "EGG", maxLength: 28 },
    { key: "item_1_price", label: "商品1(価格)", numeric: true, maxLength: 8 },
    { key: "item_1_desc", label: "商品1(説明)", maxLength: 60 },
    { key: "item_2_name", label: "商品2(名前)", default: "SALAD", maxLength: 28 },
    { key: "item_2_price", label: "商品2(価格)", numeric: true, maxLength: 8 },
    { key: "item_2_desc", label: "商品2(説明)", maxLength: 60 },
    { key: "item_3_name", label: "商品3(名前)", default: "PANCAKE", maxLength: 28 },
    { key: "item_3_price", label: "商品3(価格)", numeric: true, maxLength: 8 },
    { key: "item_3_desc", label: "商品3(説明)", maxLength: 60 },
    { key: "section_title_en", label: "セクション英題", default: "WEEKEND BRUNCH", maxLength: 28 },
    { key: "section_title_jp", label: "セクション和題", default: "選べるプレート", maxLength: 28 },
    { key: "drink_list", label: "ドリンク一覧(改行区切り)", maxLength: 60 },
    { key: "topping_list", label: "トッピング一覧(改行区切り)", maxLength: 60 },
    { key: "drink_set_desc", label: "DRINK SET説明", maxLength: 60 },
    { key: "sweet_set_price", label: "SWEET SET価格", default: "+300円", numeric: true, maxLength: 8 },
    { key: "sweet_set_desc", label: "SWEET SET説明", maxLength: 60 },
  ],
  'yakitori_menu': [
    { key: "item_1_name", label: "商品1(名前)", default: "もも ねぎま", maxLength: 28 },
    { key: "item_2_name", label: "商品2(名前)", default: "つくね(たれ・月見)", maxLength: 28 },
    { key: "item_3_name", label: "商品3(名前)", default: "ささみおろしポン酢", maxLength: 28 },
    { key: "item_5_name", label: "商品5(名前)", default: "うずら玉子", maxLength: 28 },
    { key: "item_8_name", label: "商品8(名前)", default: "しいたけ", maxLength: 28 },
    { key: "extra_1_name", label: "追加メニュー1(名前)", default: "鶏だし茶漬け", maxLength: 28 },
    { key: "extra_2_name", label: "追加メニュー2(名前)", default: "焼きおにぎり", maxLength: 28 },
    { key: "category_tag", label: "カテゴリ", default: "串火", maxLength: 28 },
    { key: "menu_label", label: "メニュー表記", default: "MENU", maxLength: 28 },
    { key: "item_1_price", label: "商品1(価格)", default: "280", numeric: true, maxLength: 8 },
    { key: "item_2_price", label: "商品2(価格)", default: "320", numeric: true, maxLength: 8 },
    { key: "item_3_price", label: "商品3(価格)", default: "300", numeric: true, maxLength: 8 },
    { key: "item_4_name", label: "商品4(名前)", default: "砂肝", maxLength: 28 },
    { key: "item_4_price", label: "商品4(価格)", default: "260", numeric: true, maxLength: 8 },
    { key: "item_5_price", label: "商品5(価格)", default: "240", numeric: true, maxLength: 8 },
    { key: "item_6_name", label: "商品6(名前)", default: "皮(パリパリ)", maxLength: 28 },
    { key: "item_6_price", label: "商品6(価格)", default: "220", numeric: true, maxLength: 8 },
    { key: "item_7_name", label: "商品7(名前)", default: "ぼんじり", maxLength: 28 },
    { key: "item_7_price", label: "商品7(価格)", default: "280", numeric: true, maxLength: 8 },
    { key: "item_8_price", label: "商品8(価格)", default: "240", numeric: true, maxLength: 8 },
    { key: "extra_1_price", label: "追加メニュー1(価格)", default: "380", numeric: true, maxLength: 8 },
    { key: "extra_2_price", label: "追加メニュー2(価格)", default: "280", numeric: true, maxLength: 8 },
  ],
  'colorful_bowl_lunch': [
    { key: "item_1_name", label: "商品1(名前)", maxLength: 28 },
    { key: "item_2_name", label: "商品2(名前)", maxLength: 28 },
    { key: "item_3_name", label: "商品3(名前)", maxLength: 28 },
    { key: "item_4_name", label: "商品4(名前)", maxLength: 28 },
    { key: "banner_title", label: "バナータイトル", default: "選べる彩りボウル", maxLength: 28 },
    { key: "banner_badge", label: "バナーバッジ", default: "ランチ限定", maxLength: 28 },
    { key: "price", label: "価格", numeric: true, maxLength: 8 },
  ],
  'teppan_gyoza_menu': [
    { key: "category_tag", label: "カテゴリ", default: "香ばし餃子", maxLength: 28 },
    { key: "title_text", label: "大見出し", default: "鉄板ぎょうざ", maxLength: 60 },
    { key: "subtitle_text", label: "サブタイトル", default: "外はパリッと中はジューシー!", maxLength: 60 },
    { key: "takeout_badge", label: "持ち帰りバッジ", default: "持ち帰りできます", maxLength: 28 },
    { key: "type_1_name", label: "種類1(名前)", default: "焼き餃子", maxLength: 28 },
    { key: "type_1_qty", label: "種類1(数量)", default: "8個", maxLength: 8 },
    { key: "type_1_price", label: "種類1(価格)", default: "720", numeric: true, maxLength: 8 },
    { key: "type_1_desc", label: "種類1(説明)", maxLength: 60 },
    { key: "type_2_label", label: "種類2(ラベル)", default: "しそ", maxLength: 28 },
    { key: "type_2_name", label: "種類2(名前)", default: "しそ餃子", maxLength: 28 },
    { key: "type_2_qty", label: "種類2(数量)", default: "8個", maxLength: 8 },
    { key: "type_2_price", label: "種類2(価格)", default: "780", numeric: true, maxLength: 8 },
    { key: "type_2_desc", label: "種類2(説明)", maxLength: 60 },
    { key: "commitment_title", label: "こだわり見出し", default: "こだわりの餃子", maxLength: 28 },
    { key: "commitment_1", label: "こだわり1", maxLength: 40 },
    { key: "commitment_2", label: "こだわり2", maxLength: 40 },
    { key: "commitment_3", label: "こだわり3", maxLength: 40 },
    { key: "sauce_1_name", label: "タレ1(名前)", default: "定番醤油ダレ", maxLength: 28 },
    { key: "sauce_1_desc", label: "タレ1(説明)", maxLength: 60 },
    { key: "sauce_2_name", label: "タレ2(名前)", default: "さっぱり柚子ダレ", maxLength: 28 },
    { key: "sauce_2_desc", label: "タレ2(説明)", maxLength: 60 },
    { key: "sauce_3_name", label: "タレ3(名前)", default: "ピリ辛ラー油ダレ", maxLength: 28 },
    { key: "sauce_3_desc", label: "タレ3(説明)", maxLength: 60 },
    { key: "sauce_4_name", label: "タレ4(名前)", default: "まろやか味噌ダレ", maxLength: 28 },
    { key: "sauce_4_desc", label: "タレ4(説明)", maxLength: 60 },
    { key: "sauce_5_name", label: "タレ5(名前)", default: "塩ダレ", maxLength: 28 },
    { key: "sauce_5_desc", label: "タレ5(説明)", maxLength: 60 },
    { key: "topping_1_name", label: "トッピング1(名前)", default: "半熟味玉", maxLength: 28 },
    { key: "topping_1_price", label: "トッピング1(価格)", default: "120", numeric: true, maxLength: 8 },
    { key: "topping_2_name", label: "トッピング2(名前)", default: "ねぎ増し", maxLength: 28 },
    { key: "topping_2_price", label: "トッピング2(価格)", default: "100", numeric: true, maxLength: 8 },
    { key: "topping_3_name", label: "トッピング3(名前)", default: "メンマ", maxLength: 28 },
    { key: "topping_3_price", label: "トッピング3(価格)", default: "100", numeric: true, maxLength: 8 },
    { key: "topping_4_name", label: "トッピング4(名前)", default: "大葉増し", maxLength: 28 },
    { key: "topping_4_price", label: "トッピング4(価格)", default: "100", numeric: true, maxLength: 8 },
    { key: "addon_note", label: "追加注記", default: "焼き餃子・しそ餃子各種", maxLength: 60 },
    { key: "addon_price", label: "追加料金", default: "360", numeric: true, maxLength: 8 },
    { key: "step_1_label", label: "ステップ1(ラベル)", default: "注文する", maxLength: 28 },
    { key: "step_1_desc", label: "ステップ1(説明)", maxLength: 60 },
    { key: "step_2_label", label: "ステップ2(ラベル)", default: "受け取る", maxLength: 28 },
    { key: "step_2_desc", label: "ステップ2(説明)", maxLength: 60 },
    { key: "step_3_label", label: "ステップ3(ラベル)", default: "おうちで楽しむ", maxLength: 28 },
    { key: "step_3_desc", label: "ステップ3(説明)", maxLength: 60 },
    { key: "reheat_pan_desc", label: "温め方(フライパン)", maxLength: 60 },
    { key: "reheat_microwave_desc", label: "温め方(電子レンジ)", maxLength: 60 },
    { key: "bottom_badge_1_title", label: "下部バッジ1(タイトル)", default: "スマホから簡単注文", maxLength: 28 },
    { key: "bottom_badge_1_desc", label: "下部バッジ1(説明)", maxLength: 60 },
    { key: "bottom_badge_2_title", label: "下部バッジ2(タイトル)", default: "まとめて注文OK", maxLength: 28 },
    { key: "bottom_badge_2_desc", label: "下部バッジ2(説明)", maxLength: 60 },
    { key: "bottom_badge_3_title", label: "下部バッジ3(タイトル)", default: "店頭受取", maxLength: 28 },
    { key: "bottom_badge_3_desc", label: "下部バッジ3(説明)", maxLength: 60 },
  ],
  'charcoal_saba_ju': [
    { key: "title_text", label: "大見出し", default: "炭火香るさば重", maxLength: 60 },
    { key: "desc_text_1", label: "説明文1", maxLength: 60 },
    { key: "desc_text_2", label: "キャッチ", maxLength: 60 },
    { key: "desc_text_3", label: "説明文", maxLength: 60 },
    { key: "serving_tip_title", label: "食べ方見出し", default: "おすすめのお召し上がり方", maxLength: 60 },
    { key: "serving_tip_desc", label: "食べ方説明", maxLength: 60 },
    { key: "badge_text", label: "バッジ文言", default: "季節限定", maxLength: 60 },
    { key: "hours", label: "営業時間", maxLength: 40 },
    { key: "price", label: "価格", numeric: true, maxLength: 8 },
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

// ══ 参考画像方式6テンプレ（依頼書）の生成 ══════════════════════════════
// buildPromptが返すのは「Image 1(参考画像)に対する差し替え指示」だけ。
// 参考画像バイト・顧客画像(Image 2)・共通システム指示(SYSTEM_INSTRUCTION)は
// generate API 側で付与する（lib/reference-images.ts）。
export const REFERENCE_TEMPLATE_IDS = new Set<string>([
  'spa_open', 'yakiniku_bento', 'takeout_bento', 'esthe_pink', 'esthe_gold', 'line_guide',
  'ramen_main', 'line_benefits', 'sns_annotation', 'calendar', 'recommend_menu', 'spring_sale', 'single_item_dark', 'smoothie_single', 'smoothie_trio', 'veggie_focaccia_poster', 'ingredient_diagram_sandwich', 'strawberry_milk_kakigori', 'strawberry_pistachio_crepe', 'bakery_opening_day', 'new_open_690_campaign', 'weekend_brunch_plate', 'yakitori_menu', 'colorful_bowl_lunch', 'teppan_gyoza_menu', 'charcoal_saba_ju',
])

export const REFERENCE_PROMPT_TEMPLATES: Record<string, string> = {
  'ramen_main': `写真は5箇所あります。それぞれ対応するImageに置き換えてください。トリミング比率・アングル・湯気やライティングの雰囲気はImage 1に合わせてください。
- トップ中央の大きい丼写真 → Image 2に置き換え
- 人気メニュー1枚目の写真 → Image 3に置き換え
- 人気メニュー2枚目の写真 → Image 4に置き換え
- 人気メニュー3枚目の写真 → Image 5に置き換え
- 右下の店舗外観写真 → Image 6に置き換え

- 左上の店舗ロゴ文字を「{shop_name}」に変更してください。
- トップの見出しコピーを「{headline}」、大見出しを「{title}」、その下の帯コピーを「{sub_copy}」に変更してください。
- 3つのこだわりバッジを「{point_1_title}/{point_1_desc}」「{point_2_title}/{point_2_desc}」「{point_3_title}/{point_3_desc}」に変更してください(アイコン・枠デザインは変更しないでください)。
- 右側の縦帯コピーを「{side_banner_text}」に変更してください。
- 「{checklist_title}」の項目を「{check_1}」〜「{check_5}」に変更してください。
- 人気メニュー3品の名前・価格・説明文を「{item_name_1} {price_1}円 {item_desc_1}」「{item_name_2} {price_2}円 {item_desc_2}」「{item_name_3} {price_3}円 {item_desc_3}」に変更してください。
- お客様の声3件を「{review_1_title}/{review_1_comment}/{review_1_profile}」「{review_2_title}/{review_2_comment}/{review_2_profile}」「{review_3_title}/{review_3_comment}/{review_3_profile}」に変更してください。人物アイコン・星の数のデザインは変更しないでください。
- LINEクーポン帯の文言を「{coupon_text}」に変更してください。
- クーポン帯の3ステップラベルを「{coupon_step_1}」「{coupon_step_2}」「{coupon_step_3}」に変更してください。
- クーポン帯のQRコードをImage 7の顧客QRコードに置き換えてください。
- フッターの営業時間を「{hours}」、定休日を「{holiday}」、電話番号を「{tel}」、住所を「{address}」、駅からのアクセス表記を「{station_access}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。`,
  'line_benefits': `- 上部の見出しを「{headline_prefix}」「{headline_main}」、その下のサブ文言を「{headline_sub}」に変更してください。
- スマホ画面内のQRコードをImage 2に置き換え、LINE IDの表記を「{line_id}」に変更してください。
- 特典1のテキストを「{benefit_1_text}」に変更してください。
- 特典2のタイトルを「{benefit_2_title}」、説明を「{benefit_2_desc}」に変更してください。
- 特典3のタイトルを「{benefit_3_title}」、説明を「{benefit_3_desc}」に変更してください。
- 3ステップ登録案内を「{step_1_label}/{step_1_desc}」「{step_2_label}/{step_2_desc}」「{step_3_label}/{step_3_desc}」に変更してください。
- 下部の案内文を「{bottom_note_1}」「{bottom_note_2}」に変更してください。
- アイコン・イラスト(メガホン、ギフト、キャラクター等)は変更しないでください(装飾イラストのため)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。`,
  'sns_annotation': `Image 1の背景写真をImage 2の顧客写真に置き換えてください。手描き風の白い線・吹き出し・キラキラ装飾のスタイルはImage 1と完全に同じにしてください。

吹き出しコメントは以下の内容・配置で描いてください(Image 2に写っている具材や見た目に合わせて自然な位置に配置してください)。
- 「{caption_1}」
- 「{caption_2}」
- 「{caption_3}」
- 「{caption_4}」
- 「{caption_5}」
- 「{caption_6}」
- 「{caption_7}」
- 「{caption_8}」
- 「{caption_9}」
- 左下のレシート風ラベルの店名を「{shop_name_label}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。`,
  'calendar': `- タイトルを「{title_text}」に変更してください。
- 上部の一言メッセージを「{thank_you_note}」に変更してください。
- 左上の限定メニューサムネイル写真をImage 2の顧客写真に置き換えてください。
- 店舗名を「{shop_name}」、年月表記を「{year_month}」に変更してください。
- 右上の営業時間を「{hours}」、定休日を「{holiday}」に変更してください。
- 限定メニュー名を「{feature_menu_name}」、実施期間を「{feature_menu_period}」に変更してください。
- カレンダー内の日付ごとの特典タグを次の内容で正確に配置してください: {day_tags}(各タグは対応する日付マスの中に収めてください)。
- 下部の凡例を「{legend_text}」に変更してください。
- 下部の予告文を「{notice_text}」に変更してください。
- 最下部の一言メッセージを「{footer_note}」に変更してください。
- カレンダーの曜日の並び・マスの数はImage 1と同じ7列構成を維持し、日付の数字は{year_month}の実際のカレンダー通りに正しく並べてください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。`,
  'recommend_menu': `写真は4箇所あります。それぞれ対応するImageに置き換えてください。トリミング比率はImage 1に合わせてください。
- 大きいメイン写真 → Image 2に置き換え
- サブ写真1枚目 → Image 3に置き換え
- サブ写真2枚目 → Image 4に置き換え
- サブ写真3枚目 → Image 5に置き換え

- 見出しを「{heading}」、タグラインを「{tagline}」、右上のバッジを「{badge_text}」に変更してください。
- メイン商品の名前「{hero_item_name}」、価格「{hero_price}円」、説明「{hero_desc}」に変更してください。
- サブ3品の名前・価格・説明文を「{sub_item_1_name} {sub_price_1}円 {sub_desc_1}」「{sub_item_2_name} {sub_price_2}円 {sub_desc_2}」「{sub_item_3_name} {sub_price_3}円 {sub_desc_3}」に変更してください。
- タグ一覧の上にある一言を「{extra_menu_intro}」に変更してください。
- 下部のタグ一覧を「{extra_menu_tags}」に変更してください。
- バナー2つを「{banner_text_1}」「{banner_text_2}」に変更してください(バナーの色・形状は変更しないでください)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。`,
  'spring_sale': `写真は4箇所あります。それぞれ対応するImageに置き換えてください。
- 右側の大きい丼写真 → Image 2に置き換え
- 下部の商品写真1枚目 → Image 3に置き換え
- 下部の商品写真2枚目 → Image 4に置き換え
- 下部の商品写真3枚目 → Image 5に置き換え

- 上部の赤い帯バッジを「{badge_text}」、大見出しを「{title}」、右上の吹き出しを「{subtitle}」に変更してください。
- 割引率の大きな数字を「{discount_rate}」に変更してください。
- 期間表記を「{date_range}」に変更してください。
- 説明文を「{desc_text}」に変更してください。
- 下部3品の名前・通常価格・割引後価格を「{item_name_1} {original_price_1}円→{sale_price_1}円」「{item_name_2} {original_price_2}円→{sale_price_2}円」「{item_name_3} {original_price_3}円→{sale_price_3}円」に変更してください。
- 下部の締めのコピーを「{footer_text}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。`,
  'single_item_dark': `- 中央〜右の写真をImage 2の顧客写真に置き換えてください。
- 左上のバッジを「{badge_text}」、大見出しコピーを「{catch_copy}」に変更してください。
- 左側の説明文を「{desc_text}」に変更してください。
- 商品名を「{item_name}」、価格を「{price}円」に変更してください。
- 下部の3つの特徴丸バッジを「{feature_1_title}/{feature_1_desc}」「{feature_2_title}/{feature_2_desc}」「{feature_3_title}/{feature_3_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。`,
  'smoothie_single': `- 中央のスムージー写真をImage 2の顧客写真に置き換えてください。周囲のフルーツの飛沫演出やライティングの雰囲気はImage 1に合わせてください。
- 上部の手描き風の一言を「{callout_text}」に変更してください。
- 黄色い丸バッジの文言を「{new_badge_text}」に変更してください。
- 大見出しを「{title_en_1}」「{title_en_2}」、その下のカタカナ表記を「{title_jp}」に変更してください。
- 緑の丸バッジを「{period_badge_label}」「{start_date}」「{start_weekday}」「{start_label}」に変更してください。
- 【ロゴ画像あり版】カップに貼られた丸いブランドシールを、Image 3のロゴ画像にそのまま置き換えてください。シールの円形の縁取り・カップへの貼り付き方(曲面に沿ったなじみ方)はImage 1と同じにしてください。
- 【ロゴ画像なし版】カップに貼られた丸いブランドシールの文字を「{brand_name}」「{brand_tagline}」に変更してください(シールのイラスト・配置スタイルはImage 1のまま維持してください)。
- 右側の白いメモ風ボックスのタイトルを「{flavor_title}」、チェックリスト3項目を「{ingredient_1}」「{ingredient_2}」「{ingredient_3}」に変更してください。
- 左下のピンク丸バッジを「{bottom_badge_text}」に変更してください。
- 右下の価格バッジを「{size_label}」「{price}円(税込)」に変更してください。
- 下部のリボンを「{takeout_label}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。`,
  'smoothie_trio': `写真は3箇所あります。それぞれ対応するImageに置き換えてください。
- 左側のスムージー写真 → Image 2に置き換え
- 中央のスムージー写真 → Image 3に置き換え
- 右側のスムージー写真 → Image 4に置き換え

- 上部の手描き風の一言を「{callout_text}」に変更してください。
- 吹き出しバッジの文言を「{new_badge_text}」に変更してください。
- 大見出しを「{title_line_1}」「{title_line_2}」「{title_line_3}」に変更してください。
- 黄色い丸バッジを「{period_badge_label}」「{start_date}」「{start_weekday}」「{start_label}」に変更してください。
- 各カップに貼られた丸いシールの文字を、左から「{flavor_1_name}」「{flavor_2_name}」「{flavor_3_name}」に変更してください(シールのイラスト・アイコンは変更しないでください)。
- 左下の価格バッジを「{size_label}」「{price}円」「税込」に変更してください。
- 中央下部の手描き下線付きコピーを「{sub_catch}」に変更してください。
- 下部の3つの特徴アイコンを「{feature_1_title}/{feature_1_desc}」「{feature_2_title}/{feature_2_desc}」「{feature_3_title}/{feature_3_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。`,
  'veggie_focaccia_poster': `- 背景の商品写真をImage 2の顧客写真に置き換えてください。
- 大見出しを「{title_line_1}」「{title_line_2}」に変更してください。
- その下の地名/店舗名を「{location_name}」に変更してください。
- キャッチコピーを「{tagline}」に変更してください。
- 下部の営業時間を「{hours}」、定休日を「{holiday}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。`,
  'ingredient_diagram_sandwich': `- 商品写真をImage 2の顧客写真に置き換えてください。
- 大見出しを「{title_line_1}」「{title_line_2}」に変更してください。
- 引き出し線のラベルを上から順に「{ingredient_1}」「{ingredient_2}」「{ingredient_3}」「{ingredient_4}」「{ingredient_5}」「{ingredient_6}」「{ingredient_7}」に変更し、Image 2で対応する層を指すように引き出し線の位置を調整してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(3:5程度)、高解像度でお願いします。`,
  'strawberry_milk_kakigori': `- 中央の商品写真をImage 2の顧客写真に置き換えてください。
- 毛筆体の大見出しを「{title_jp}」に変更してください。
- その下のサブタイトルを「{subtitle_jp}」に変更してください。
- スクリプト体の英語表記を「{title_en_script}」に変更してください。
- 下部のバッジを「{badge_text}」、価格を「{price}円」に変更してください。
- 和柄の装飾パターンは変更しないでください(装飾のため)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。`,
  'strawberry_pistachio_crepe': `- 中央の商品写真をImage 2の顧客写真に置き換えてください。
- 左上のラベルを「{label_left}」、右上のラベルを「{label_right}」に変更してください。
- 大見出しを「{title_line_1}」「{title_line_2}」に変更してください。
- スクリプト体のサブタイトルを「{subtitle_script}」に変更してください。
- 左下の説明文を「{desc_text}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。`,
  'bakery_opening_day': `このテンプレートは実写を使わず、Image 1と同じ手描き風イラストのタッチ・パステルカラーの配色・装飾フレームのスタイルで構成してください。今回の業種は「{business_genre}」です。

- 中央上部のロゴアイコンを「{logo_icon_desc}」の絵柄に変更してください(Image 1と同じ線画タッチ・配色で描いてください)。ロゴ横のテキストを「{shop_name}」「{shop_name_sub}」に変更してください。
- 四隅のコーナー装飾イラストを、Image 1と同じ配置・同じ手描きタッチのまま、それぞれ「{corner_illustration_1}」「{corner_illustration_2}」「{corner_illustration_3}」「{corner_illustration_4}」「{corner_illustration_5}」の絵柄に変更してください。
- 大見出しを「{title_text}」に変更してください。
- 日付を「{event_date}」、営業時間を「{event_hours}」に変更してください。
- 特典ボックス1を「{offer_1_badge}」「{offer_1_title}」「{offer_1_desc}」に変更してください。
- 特典ボックス2を「{offer_2_badge}」「{offer_2_title}」「{offer_2_price}円」「{offer_2_desc}」に変更してください。
- 4つの特徴バッジを「{feature_1}」「{feature_2}」「{feature_3}」「{feature_4}」に変更してください(バッジ内の小さなアイコンは、対応する文言の内容に合わせて自然に描き変えてください)。
- 左下のアクセス欄のラベルを「{access_label}」に変更してください。地図イラストは簡略化された図のまま、実際の道路の正確な再現は不要です。
- 右側の店舗紹介を「{shop_name}」「{shop_catch}」「{shop_desc}」に変更してください。
- 最下部の一言を「{footer_note}」に変更してください。
- 花・葉・水玉などの背景装飾は変更しないでください(業種に関わらず共通の装飾のため)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。`,
  'new_open_690_campaign': `写真は3箇所あります。それぞれ対応するImageに置き換えてください。
- 左側の商品写真 → Image 2に置き換え
- 中央の商品写真 → Image 3に置き換え
- 右側の商品写真 → Image 4に置き換え

- 上部の帯を「{top_banner_label}」「{top_banner_text}」に変更してください。
- 右上の丸バッジを「{badge_text}」に変更してください。
- 「{period_label}」の表記を変更してください。
- 中央の大きな価格数字を「{price}」に変更してください。
- キャンペーン期間を「{campaign_period}」、利用条件を「{campaign_conditions}」に変更してください。
- 3品それぞれの吹き出しコメントと商品名を「{item_1_comment}」/「{item_1_name}」、「{item_2_comment}」/「{item_2_name}」、「{item_3_comment}」/「{item_3_name}」に変更してください(価格は{price}円で統一)。
- フッターのキャッチコピーを「{shop_tagline}」、店舗名を「{shop_name}」、説明文を「{shop_desc}」に変更してください。
- 下部の案内文を「{notice_text}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。`,
  'weekend_brunch_plate': `写真は3箇所あります。それぞれ対応するImageに置き換えてください。
- 1品目の写真 → Image 2に置き換え
- 2品目の写真 → Image 3に置き換え
- 3品目の写真 → Image 4に置き換え

- 3品の名前・価格・説明文を「{item_1_name} {item_1_price}円 {item_1_desc}」「{item_2_name} {item_2_price}円 {item_2_desc}」「{item_3_name} {item_3_price}円 {item_3_desc}」に変更してください。
- セクションタイトルを「{section_title_en}」「{section_title_jp}」に変更してください。
- セットドリンクの一覧を次の内容に変更してください: {drink_list}
- 追加トッピングの一覧を次の内容に変更してください: {topping_list}
- DRINK SETボックスの説明を「{drink_set_desc}」に変更してください。
- SWEET SETボックスの価格を「{sweet_set_price}」、説明を「{sweet_set_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。`,
  'yakitori_menu': `写真は8箇所あります。それぞれ対応するImageに置き換えてください。
- 上部の串焼き集合写真 → Image 2に置き換え
- {item_1_name}の串写真 → Image 3に置き換え
- {item_2_name}の串写真 → Image 4に置き換え
- {item_3_name}の串写真 → Image 5に置き換え
- {item_5_name}の串写真 → Image 6に置き換え
- {item_8_name}の串写真 → Image 7に置き換え
- {extra_1_name}の写真 → Image 8に置き換え
- {extra_2_name}の写真 → Image 9に置き換え

- 左上のカテゴリ表記を「{category_tag}」、その下を「{menu_label}」に変更してください。
- 品目リストを「{item_1_name} {item_1_price}円」「{item_2_name} {item_2_price}円」「{item_3_name} {item_3_price}円」「{item_4_name} {item_4_price}円」「{item_5_name} {item_5_price}円」「{item_6_name} {item_6_price}円」「{item_7_name} {item_7_price}円」「{item_8_name} {item_8_price}円」に変更してください。
- 下部の追加メニュー2品を「{extra_1_name} {extra_1_price}円」「{extra_2_name} {extra_2_price}円」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。`,
  'colorful_bowl_lunch': `写真は4箇所あります。それぞれ対応するImageに置き換えてください。
- 左上の写真 → Image 2に置き換え
- 右上の写真 → Image 3に置き換え
- 左下の写真 → Image 4に置き換え
- 右下の写真 → Image 5に置き換え

- 4品の名前を左上から順に「{item_1_name}」「{item_2_name}」「{item_3_name}」「{item_4_name}」に変更してください(色タグの配色は変更しないでください)。
- 中央バナーのタイトルを「{banner_title}」、バッジを「{banner_badge}」、価格を「{price}円」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。`,
  'teppan_gyoza_menu': `- メイン写真をImage 2の顧客写真に置き換えてください。
- 左上のカテゴリタグを「{category_tag}」、大見出しを「{title_text}」に変更してください。
- サブタイトルを「{subtitle_text}」、持ち帰りバッジを「{takeout_badge}」に変更してください。
- 2つの餃子タイプボックスを「{type_1_name} {type_1_qty} {type_1_price}円 {type_1_desc}」「{type_2_label}/{type_2_name} {type_2_qty} {type_2_price}円 {type_2_desc}」に変更してください。
- 「{commitment_title}」の3項目を「{commitment_1}」「{commitment_2}」「{commitment_3}」に変更してください。
- 選べるタレ5種を「{sauce_1_name}/{sauce_1_desc}」「{sauce_2_name}/{sauce_2_desc}」「{sauce_3_name}/{sauce_3_desc}」「{sauce_4_name}/{sauce_4_desc}」「{sauce_5_name}/{sauce_5_desc}」に変更してください(アイコンの配色は変更しないでください)。
- トッピング4種を「{topping_1_name} +{topping_1_price}円」「{topping_2_name} +{topping_2_price}円」「{topping_3_name} +{topping_3_price}円」「{topping_4_name} +{topping_4_price}円」に変更してください。
- 追加料金ボックスを「{addon_note} 追加+{addon_price}円」に変更してください。
- お持ち帰りの流れ3ステップを「{step_1_label}/{step_1_desc}」「{step_2_label}/{step_2_desc}」「{step_3_label}/{step_3_desc}」に変更してください。
- 温め直し方を「フライパン:{reheat_pan_desc}」「電子レンジ:{reheat_microwave_desc}」に変更してください。
- 下部3つのバッジを「{bottom_badge_1_title}/{bottom_badge_1_desc}」「{bottom_badge_2_title}/{bottom_badge_2_desc}」「{bottom_badge_3_title}/{bottom_badge_3_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。`,
  'charcoal_saba_ju': `- 中央の商品写真をImage 2の顧客写真に置き換えてください。
- 中央の大見出しを「{title_text}」に変更してください。
- 右上の説明文を「{desc_text_1}」、その下のキャッチを「{desc_text_2}」に変更してください。
- 左側の説明文を「{desc_text_3}」に変更してください。
- 「{serving_tip_title}」の説明を「{serving_tip_desc}」に変更してください。
- 右側の丸バッジを「{badge_text}」に変更してください。
- 下部バーの営業時間を「{hours}」、価格を「{price}円」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。`,
}

// 07〜26 は「差し替え指示テンプレ(REFERENCE_PROMPT_TEMPLATES)」の {key} を実値で置換して生成する。
// （01〜06 は buildReferencePrompt の個別ブランチ。将来的に統合してよい）
function fillReferenceTemplate(templateId: string, tpl: string, f: Record<string, string>): string {
  let out = tpl
  // smoothie_single: ロゴ画像あり/なしで指示行を出し分け（use_logo_image フラグ）
  if (templateId === 'smoothie_single') {
    const useLogo = String(f.use_logo_image || '').toLowerCase() === 'true'
    out = out
      .split('\n')
      .filter(line => {
        if (line.includes('【ロゴ画像あり版】')) return useLogo
        if (line.includes('【ロゴ画像なし版】')) return !useLogo
        return true
      })
      .join('\n')
      .replace(/【ロゴ画像(?:あり|なし)版】/g, '')
  }
  // 空欄のみの指示行はドロップ（"「」に変更" という無意味な指示を送らない）。
  // プレースホルダを含まない行（写真スロット・注意書き・出力指定など）は常に残す。
  out = out
    .split('\n')
    .filter(line => {
      const keys = [...line.matchAll(/\{(\w+)\}/g)].map(m => m[1])
      if (keys.length === 0) return true
      return keys.some(k => (f[k] ?? '').toString().trim() !== '')
    })
    .join('\n')
  // {key} を実値で置換（残った行の空プレースホルダは空文字）。fはmergeFieldDefaults済みを想定。
  out = out.replace(/\{(\w+)\}/g, (_m, k: string) => (f[k] ?? '').toString())
  // 見本の元テキスト残り・部分置換・未指定要素へのサンプル文言残存を防ぐ共通の後処理指示。
  out += '\n\n' + REF_POST
  return out
}

// textareaを行→列に分解するヘルパー（列区切りは全角／・半角/の両対応）
function refRows(v: string | undefined): string[] {
  return (v || '').split('\n').map(s => s.trim()).filter(Boolean)
}
function refCols(line: string): string[] {
  return line.split(/[／/]/).map(s => s.trim())
}
const A4 = '出力はA4縦相当のアスペクト比、高解像度でお願いします。'
const NO_ADD = 'Image 1にない装飾・ロゴ・文字は追加しないでください。'
// 見本の元テキスト残り・部分置換・未指定要素へのサンプル文言残存を防ぐ共通の後処理指示（07〜26と01〜06で共用）。
const REF_POST = '■重要：上で置き換える文字は、見本の元の文字を残さず完全に差し替えてください（複数行の見出しは全行を置き換える）。上の指示で触れていない文字要素は、見本のサンプル文言（店名・商品名・価格・キャッチ等）をそのまま残さず、空欄にするか自然に削除してください。装飾・イラスト・配色・レイアウトは維持してください。'

function buildReferencePrompt(templateId: string, f: Record<string, string>): string {
  const tpl = REFERENCE_PROMPT_TEMPLATES[templateId]
  if (tpl) return fillReferenceTemplate(templateId, tpl, f)
  if (templateId === 'spa_open') {
    const feats = refRows(f.features)
    const camps = refRows(f.campaigns).map(refCols)
    const openLabel = f.open_label || 'OPEN'
    return [
      'Image 1の中央メイン写真をImage 2の顧客写真に置き換えてください。切り抜き比率・配置はImage 1に合わせてください。',
      f.shop_name ? `右上の円形ロゴバッジのテキストを「${f.shop_name}」に変更してください。バッジの形状・配色は変更しないでください。` : '',
      f.catch_copy ? `左上のキャッチコピーを「${f.catch_copy}」に変更し、Image 1と同じ書体・配置で表示してください。` : '',
      f.sub_notice_text ? `見出し下の説明文を「${f.sub_notice_text}」に変更してください。` : '',
      f.open_date ? `中央下部の"${openLabel}"表記の日付部分を「${f.open_date}」に変更してください。` : '',
      feats.length ? `右側の白い円形バッジ3つのテキストをそれぞれ${feats.map(x => `「${x}」`).join('')}に変更してください。バッジの形状・並び順は変更しないでください。` : '',
      f.reservation_label ? `テラコッタ色の予約ボックスの文言を「${f.reservation_label}」に変更してください。QRコード風アイコンはImage 1のまま維持してください。` : '',
      camps.length ? `下部の特典ボックス2つを${camps.map(c => `「${c[0] || ''} ${c[1] || ''}${c[2] ? `(期間限定:${c[2]}まで)` : ''}」`).join('')}に変更してください。ボックスの色・形状は変更しないでください。` : '',
      NO_ADD, A4, REF_POST,
    ].filter(Boolean).join('\n')
  }
  if (templateId === 'yakiniku_bento') {
    const items = refRows(f.items).map(refCols)
    const footer = [
      f.tel && `電話番号を「${f.tel}」`, f.reception_hours && `受付時間を「${f.reception_hours}」`,
      f.pickup_hours && `お渡し時間を「${f.pickup_hours}」`, f.holiday && `定休日を「${f.holiday}」`,
      f.address && `住所を「${f.address}」`,
    ].filter(Boolean).join('、')
    return [
      f.shop_name ? `左上の毛筆ロゴ部分のテキストを「${f.shop_name}」に変更してください。書体・配色のスタイルはImage 1と同じにしてください。` : '',
      f.tagline_label ? `ロゴ下の表記を「${f.tagline_label}」に変更してください。` : '',
      f.seasonal_mark_text ? `左上の飾り印の文字を「${f.seasonal_mark_text}」に変更してください。` : '',
      '弁当写真枠のうち最も大きい枠をImage 2の顧客写真に置き換えてください。残りの写真枠(グリル・外観夜景・冷蔵庫内など)はImage 1と同じ俯瞰構図・照明・盛り付け感を保ってください。',
      items.length ? `各弁当の商品名・価格・説明を${items.map(c => `「${c[0] || ''} ${c[1] ? c[1] + '円' : ''} ${c[2] || ''}」`).join('')}に変更してください。` : '',
      f.rice_note ? `ご飯に関する注記を「${f.rice_note}」に変更してください。` : '',
      footer ? `フッターの${footer}に変更してください。` : '',
      f.order_qr_label ? `フッター右下のQRコードのラベルを「${f.order_qr_label}」に変更してください。QRコード自体はImage 1のまま維持してください。` : '',
      NO_ADD, A4, REF_POST,
    ].filter(Boolean).join('\n')
  }
  if (templateId === 'takeout_bento') {
    const items = refRows(f.items).map(refCols)
    const feats = refRows(f.features)
    const footer = [
      f.shop_name && `店舗名を「${f.shop_name}」`, f.address && `住所を「${f.address}」`,
      f.hours && `営業時間を「${f.hours}」`, f.holiday && `定休日を「${f.holiday}」`,
      f.tel && `電話を「${f.tel}」`, f.fax && `FAXを「${f.fax}」`,
    ].filter(Boolean).join('、')
    return [
      '上部3枚の写真タイルのうち一番目立つ1枚をImage 2の顧客写真に置き換えてください。他はImage 1と同じ雰囲気の弁当写真として生成してください。',
      f.headline ? `見出しコピーを「${f.headline}」に変更してください(3行構成は維持してください)。` : '',
      f.intro_text ? `中段の紹介文を「${f.intro_text}」に変更してください。` : '',
      f.shop_tagline ? `ロゴ下のタグラインを「${f.shop_tagline}」に変更してください。` : '',
      f.delivery_badge_text ? `宅配バッジの文言を「${f.delivery_badge_text}」に変更してください。` : '',
      items.length ? `6品グリッドの商品名・価格を${items.map(c => `「${c[0] || ''} ${c[1] ? c[1] + '円' : ''}」`).join('')}に変更してください。写真はImage 1と同じ構図感で生成してください。` : '',
      feats.length ? `3つの特徴アイコン文言を${feats.map(x => `「${x}」`).join('')}に変更してください。` : '',
      footer ? `フッターの${footer}に変更してください。` : '',
      f.notice_text ? `フッターの注意書きを「${f.notice_text}」に変更してください。` : '',
      f.order_qr_label ? `右下のQRコードのラベルを「${f.order_qr_label}」に変更してください。QRコード自体はImage 1のまま維持してください。` : '',
      NO_ADD, A4, REF_POST,
    ].filter(Boolean).join('\n')
  }
  if (templateId === 'esthe_pink') {
    const feats = refRows(f.features)
    const checks = refRows(f.checks)
    const reasons = refRows(f.reasons)
    const footer = [
      f.tel && `電話番号を「${f.tel}」`, f.hours && `受付時間・定休日を「${f.hours}」`,
      f.address && `住所を「${f.address}」`, f.access && `最寄駅情報を「${f.access}」`,
    ].filter(Boolean).join('、')
    const courseParts = [
      f.course_name && `コース名を「${f.course_name}」`,
      checks.length && `チェックリストを${checks.map(x => `「${x}」`).join('')}`,
      f.regular_price && `通常価格を「${f.regular_price}円」`,
      f.special_price && `特別価格を「${f.special_price}円」`,
      f.campaign_notes && `注意書きを「${f.campaign_notes}」`,
    ].filter(Boolean).join('、')
    return [
      f.ribbon_text ? `上部リボンの文言を「${f.ribbon_text}」に変更してください。` : '',
      f.headline ? `見出しコピーを「${f.headline}」に変更してください。` : '',
      f.salon_name ? `サロン名ボックスを「${f.salon_name}」に変更してください。` : '',
      f.anniversary_badge ? `右上の周年バッジを「${f.anniversary_badge}」に変更してください。` : '',
      f.sub_catch ? `周年バッジ下の訴求フレーズを「${f.sub_catch}」に変更してください。` : '',
      'メイン施術写真をImage 2の顧客写真に置き換えてください。他の写真枠(キャンペーン欄・内観など)はImage 1と同じ雰囲気を保ってください。',
      feats.length ? `3つの特徴アイコンの文言を${feats.map(x => `「${x}」`).join('')}に変更してください。` : '',
      courseParts ? `体験コースボックスの${courseParts}に変更してください。取り消し線+矢印の見せ方は変更しないでください。` : '',
      reasons.length ? `「${f.reasons_title || '選ばれる理由'}」の項目文言を${reasons.map(x => `「${x}」`).join('')}に変更してください。` : '',
      f.line_promo_text ? `LINE友だち登録欄の文言を「${f.line_promo_text}」に変更してください。QRコードはImage 1のまま維持してください。` : '',
      footer ? `フッターの${footer}に変更してください。アクセスマップは簡略図のまま駅名の文字だけ差し替えてください。` : '',
      NO_ADD, A4, REF_POST,
    ].filter(Boolean).join('\n')
  }
  if (templateId === 'esthe_gold') {
    const feats = refRows(f.features)
    const checks = refRows(f.checks)
    const reasons = refRows(f.reasons)
    const courses = refRows(f.courses).map(refCols)
    const footer = [
      f.tel && `電話番号を「${f.tel}」`, f.address && `住所を「${f.address}」`, f.access && `最寄駅情報を「${f.access}」`,
    ].filter(Boolean).join('、')
    const courseParts = [
      f.course_name && `コース名を「${f.course_name}」`,
      checks.length && `チェックリストを${checks.map(x => `「${x}」`).join('')}`,
      f.regular_price && `通常価格を「${f.regular_price}円」`,
      f.special_price && `特別価格を「${f.special_price}円」`,
      f.campaign_notes && `注意書きを「${f.campaign_notes}」`,
    ].filter(Boolean).join('、')
    return [
      f.headline ? `見出しコピーを「${f.headline}」に変更してください。` : '',
      f.salon_name ? `サロン名ボックスを「${f.salon_name}」に変更してください。` : '',
      f.sub_catch ? `右サイドの縦書き訴求フレーズを「${f.sub_catch}」に変更してください。` : '',
      'メイン施術写真をImage 2の顧客写真に置き換えてください。他の写真枠(キャンペーン欄・各コース写真)はImage 1と同じ雰囲気を保ってください。',
      feats.length ? `3つの特徴アイコンの文言を${feats.map(x => `「${x}」`).join('')}に変更してください。` : '',
      courseParts ? `体験コースボックスの${courseParts}に変更してください。` : '',
      reasons.length ? `「${f.reasons_title || '選ばれる理由'}」の項目文言を${reasons.map(x => `「${x}」`).join('')}に変更してください。` : '',
      courses.length ? `下部3つのコース料金ボックスを、${courses.map((c, i) => `${i + 1}つ目「${c[0] || ''} ${c[1] || ''} ${c[2] || ''} ${c[3] ? c[3] + '円' : ''}」`).join('、')}に変更してください。ボックスのデザインは変更しないでください。` : '',
      f.line_promo_text ? `LINE予約欄の文言を「${f.line_promo_text}」に変更してください。QRコードはImage 1のまま維持してください。` : '',
      footer ? `フッターの${footer}に変更してください。` : '',
      NO_ADD, A4, REF_POST,
    ].filter(Boolean).join('\n')
  }
  if (templateId === 'line_guide') {
    const m1 = [f.method_1_label && `ラベルを「${f.method_1_label}」`, f.method_1_instructions && `説明文を「${f.method_1_instructions}」`].filter(Boolean).join('、')
    const m2 = [f.method_2_label && `ラベルを「${f.method_2_label}」`, f.method_2_instructions && `説明文を「${f.method_2_instructions}」`].filter(Boolean).join('、')
    return [
      f.line_id ? `LINE IDの表記を「${f.line_id}」に変更してください(スマホ画面内表示とテキスト内表記の両方)。` : '',
      f.promo_text ? `吹き出しの訴求文言を「${f.promo_text}」に変更してください。` : '',
      f.headline ? `大見出しを「${f.headline}」に変更してください。` : '',
      f.method_section_title ? `セクションタイトルを「${f.method_section_title}」に変更してください。` : '',
      m1 ? `方法1の${m1}に変更してください。` : '',
      m2 ? `方法2の${m2}に変更してください。` : '',
      'スマホ画面内・本文中のQRコードをImage 2の顧客QRコード画像に置き換えてください。',
      f.company_name ? `フッターの会社名・店舗名を「${f.company_name}」に変更してください。` : '',
      '下部の丘・家・木・電気自動車のイラスト、レイアウト構成は変更しないでください。',
      NO_ADD, A4, REF_POST,
    ].filter(Boolean).join('\n')
  }
  return ''
}

// 最終プロンプトを組み立てる。fieldsは mergeFieldDefaults 済み（＝制限適用済み）を想定。
export function buildPrompt(templateId: string, f: Record<string, string>, _hasPhoto: boolean): string {
  // 参考画像方式テンプレ（全26種）は差し替え指示を返す（参考画像はAPI側で付与）。
  if (REFERENCE_TEMPLATE_IDS.has(templateId)) return buildReferencePrompt(templateId, f)
  return ''
}
