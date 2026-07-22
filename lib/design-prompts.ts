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
  // 店内のご紹介（パンフレット向け・写真グリッド）
  'shop-interior': [
    { key: 'title', label: 'タイトル', placeholder: '例：店内のご紹介', default: '店内のご紹介', maxLength: 14 },
    { key: 'subtitle', label: 'サブタイトル', placeholder: '例：木のぬくもりを感じる、落ち着いた空間。', maxLength: 26 },
    { key: 'seat1_name', label: '席①の名前', placeholder: '例：ソファ席', maxLength: 12 },
    { key: 'seat1_desc', label: '席①の説明', placeholder: '例：ゆったりくつろげる人気のお席です。', maxLength: 22 },
    { key: 'seat2_name', label: '席②の名前', placeholder: '例：窓際のカウンター席', maxLength: 12 },
    { key: 'seat2_desc', label: '席②の説明', placeholder: '例：おひとり様もお気軽にどうぞ。', maxLength: 22 },
    { key: 'seat3_name', label: '席③の名前', placeholder: '例：テラス席（ペットOK）', maxLength: 12 },
    { key: 'seat3_desc', label: '席③の説明', placeholder: '例：緑を感じる開放的なテラス席。', maxLength: 22 },
    { key: 'note', label: '注記', placeholder: '例：ペット同伴はテラス席のみとなります。', maxLength: 28 },
  ],
  // アクセス・店舗情報（パンフレット向け・地図＋QR）
  'access-info': [
    { key: 'title', label: 'タイトル', placeholder: '例：アクセス・店舗情報', default: 'アクセス・店舗情報', maxLength: 14 },
    { key: 'subtitle', label: 'サブタイトル', placeholder: '例：皆さまのご来店を心よりお待ちしております。', maxLength: 28 },
    { key: 'access', label: '交通アクセス', placeholder: '例：○○駅より車で10分', maxLength: 24 },
    { key: 'parking', label: '駐車場', placeholder: '例：駐車場：10台完備', maxLength: 20 },
    { key: 'address', label: '住所', placeholder: '例：〒123-4567 ○○市○○町1-2-3', maxLength: 30 },
    { key: 'tel', label: '電話番号', placeholder: '例：03-1234-5678', maxLength: 18 },
    { key: 'business_hours', label: '営業時間', placeholder: '例：11:00〜17:00 (L.O.16:30)', maxLength: 26 },
    { key: 'closed_day', label: '定休日', placeholder: '例：水曜日', maxLength: 16 },
    { key: 'instagram', label: 'Instagram', placeholder: '例：@cafe_morinoterrace', maxLength: 24 },
    { key: 'sns_promo', label: 'SNS誘導文', placeholder: '例：最新情報はInstagramで更新中！', maxLength: 24 },
  ],
  // ─── サロン系（美容・リラク）─────────────────────────────────────
  // スパ・サロン新規オープン告知（高級感）
  'spa-open': [
    { key: 'salon_name', label: 'サロン名・店名', placeholder: '例：SPA & MASSAGE セカンドハウス', required: true, maxLength: 18 },
    { key: 'catch_copy', label: 'キャッチコピー', placeholder: '例：極上のスパ＆マッサージを体験', required: true, maxLength: 28 },
    { key: 'status', label: '大きく見せる文言', placeholder: '例：OPEN', default: 'OPEN', maxLength: 12 },
    { key: 'open_date', label: 'オープン日', placeholder: '例：10.31 THU', maxLength: 16 },
    { key: 'strength_1', label: '強み①（丸バッジ）', placeholder: '例：駅徒歩5分', default: '通いやすい', maxLength: 14 },
    { key: 'strength_2', label: '強み②（丸バッジ）', placeholder: '例：会員制で安心', default: '安心できる', maxLength: 14 },
    { key: 'strength_3', label: '強み③（丸バッジ）', placeholder: '例：確かな技術', default: '満足できる', maxLength: 14 },
    { key: 'lead_text', label: '案内文（最大2行）', type: 'textarea', placeholder: '例：オープンを記念してお得なキャンペーンをご用意しました。', maxLength: 30, maxLines: 2 },
    { key: 'offer_1', label: '特典①（内容）', placeholder: '例：初回50%OFF', maxLength: 20 },
    { key: 'offer_2', label: '特典②（内容）', placeholder: '例：ペア予約でドリンク無料', maxLength: 20 },
    { key: 'offer_deadline', label: '特典の期限', placeholder: '例：11月末まで', maxLength: 18 },
    { key: 'reservation_label', label: 'ご予約の案内文', placeholder: '例：ご予約専用（QRから）', default: 'ご予約はこちら', maxLength: 16 },
  ],
  // エステ・サロン集客キャンペーン
  'salon-campaign': [
    { key: 'color_theme', label: '配色', type: 'select', options: ['ピンク系', 'ベージュ・ゴールド系'], default: 'ピンク系' },
    { key: 'salon_name', label: 'サロン名', placeholder: '例：ビューティーサロン ルミエ', required: true, maxLength: 18 },
    { key: 'target_copy', label: '上部の一言（誰向けか）', placeholder: '例：大人女性のための', default: '大人女性のための', maxLength: 16 },
    { key: 'main_title', label: 'メインタイトル', placeholder: '例：エステで叶える', required: true, maxLength: 18 },
    { key: 'sub_title', label: '強調サブタイトル', placeholder: '例：うるおい肌と自信あふれる毎日へ', maxLength: 26 },
    { key: 'feature_1', label: '特徴①', placeholder: '例：完全個室のプライベート空間', default: '完全個室', maxLength: 20 },
    { key: 'feature_2', label: '特徴②', placeholder: '例：経験豊富なエステティシャン', default: '経験豊富な担当者', maxLength: 20 },
    { key: 'feature_3', label: '特徴③', placeholder: '例：肌質に合わせたオーダーメイド', default: 'オーダーメイド施術', maxLength: 20 },
    { key: 'course_name', label: '初回限定コース名', placeholder: '例：フェイシャル体験コース', maxLength: 20 },
    { key: 'regular_price', label: '通常価格', placeholder: '例：¥11,000', maxLength: 12 },
    { key: 'special_price', label: '特別価格', placeholder: '例：¥3,300', maxLength: 12 },
    { key: 'price_note', label: '価格の注記', placeholder: '例：お一人様1回限り・併用不可', maxLength: 24 },
    { key: 'tel', label: '電話番号', placeholder: '例：03-1234-5678', maxLength: 18 },
    { key: 'open_hours', label: '受付時間', placeholder: '例：10:00〜20:00', maxLength: 22 },
    { key: 'closed_day', label: '定休日', placeholder: '例：不定休', maxLength: 16 },
    { key: 'address', label: '住所', placeholder: '例：東京都〇〇区〇〇1-2-3', maxLength: 30 },
  ],
  // ─── テイクアウト・宅配系 ─────────────────────────────────────
  // お弁当・テイクアウトメニュー（和風・高級感）
  'bento-menu': [
    { key: 'shop_name', label: '店名', placeholder: '例：和み亭', required: true, maxLength: 16 },
    { key: 'item_type', label: '種別の見出し', placeholder: '例：お弁当メニュー', default: 'お弁当メニュー', maxLength: 14 },
    { key: 'menu_items', label: 'お弁当（1行に「商品名 価格 説明」／最大4行）', type: 'textarea', placeholder: '特上カルビ弁当 2200 カルビの旨みを贅沢に\n幕の内弁当 1200 彩り豊かな定番', hint: '1行1商品・最大4行', maxLength: 30, maxLines: 4 },
    { key: 'note_text', label: '補足（任意）', placeholder: '例：※ご飯は白米・もち麦米が選べます', maxLength: 30 },
    { key: 'reception_time', label: '受付時間', placeholder: '例：10:00〜19:00', maxLength: 20 },
    { key: 'handoff_time', label: 'お渡し時間', placeholder: '例：11:00〜20:00', maxLength: 20 },
    { key: 'tel', label: '電話番号', placeholder: '例：03-1234-5678', maxLength: 18 },
    { key: 'closed_day', label: '定休日', placeholder: '例：日曜', maxLength: 16 },
    { key: 'address', label: '住所', placeholder: '例：東京都〇〇区〇〇1-2-3', maxLength: 30 },
  ],
  // 宅配弁当メニュー（ナチュラル）
  'bento-delivery': [
    { key: 'shop_name', label: '店名', placeholder: '例：和みごはん', required: true, maxLength: 16 },
    { key: 'main_catch', label: 'メインキャッチ', placeholder: '例：できたて手作りお弁当はじめました', required: true, maxLength: 22 },
    { key: 'delivery_note', label: '宅配バッジの文言', placeholder: '例：1個から宅配承ります', default: '1個から宅配承ります', maxLength: 18 },
    { key: 'lead_text', label: '説明文（最大2行）', type: 'textarea', placeholder: '例：栄養バランスを考えた手作り弁当をお届け。会議用にも。', maxLength: 30, maxLines: 2 },
    { key: 'menu_items', label: 'お弁当（1行に「商品名 価格」／最大6行）', type: 'textarea', placeholder: '日替わり弁当 650\n唐揚げ弁当 700', hint: '1行1商品・最大6行', maxLength: 24, maxLines: 6 },
    { key: 'info_1', label: '案内①', placeholder: '例：配達エリア：店舗から3km以内', default: '配達エリアあり', maxLength: 24 },
    { key: 'info_2', label: '案内②', placeholder: '例：定期割引あります', default: '定期割引あり', maxLength: 24 },
    { key: 'info_3', label: '案内③', placeholder: '例：週5日以上のご注文で1個無料', maxLength: 24 },
    { key: 'tel', label: '電話番号', placeholder: '例：03-1234-5678', maxLength: 18 },
    { key: 'open_hours', label: '営業時間', placeholder: '例：9:00〜18:00', maxLength: 20 },
    { key: 'closed_day', label: '定休日', placeholder: '例：土日祝', maxLength: 16 },
    { key: 'address', label: '住所', placeholder: '例：東京都〇〇区〇〇1-2-3', maxLength: 30 },
  ],
  // LINE公式アカウント 友だち登録案内（手順説明）
  'line-register-guide': [
    { key: 'account_id', label: 'LINE ID（@から）', placeholder: '例：@sample_salon', required: true, maxLength: 24 },
    { key: 'benefit_text', label: '登録メリットの一言', placeholder: '例：イベント情報やプレゼントをGET！', default: 'お得な情報やクーポンをGET！', maxLength: 24 },
    { key: 'cta_text', label: '呼びかけ文', placeholder: '例：友だち登録募集中！', default: '友だち登録募集中！', maxLength: 18 },
    { key: 'step1_title', label: '手順①の見出し', placeholder: '例：「QRコード」で登録', default: '「QRコード」で登録', maxLength: 20 },
    { key: 'step1_desc', label: '手順①の説明（最大2行）', type: 'textarea', placeholder: '例：友だち追加→QRコードを選び、右のコードを読み取る', maxLength: 28, maxLines: 2 },
    { key: 'step2_title', label: '手順②の見出し', placeholder: '例：「ID検索」で登録', default: '「ID検索」で登録', maxLength: 20 },
    { key: 'step2_desc', label: '手順②の説明（最大2行）', type: 'textarea', placeholder: '例：友だち追加→検索を選び、上のIDで検索する', maxLength: 28, maxLines: 2 },
    { key: 'company_name', label: '店舗名・企業名', placeholder: '例：ビューティーサロン ルミエ', maxLength: 20 },
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
      `・下部：ゴールドのライン＋商品名「${f.product_name}」${f.price ? `＋価格「${f.price}」` : ''}`,
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
      f.no1_name ? `・上段（一番人気）：${hasPhoto ? '添付の商品写真＋' : ''}王冠バッジ＋「${f.no1_name}」${f.no1_price ? `「${f.no1_price}」` : ''}${f.no1_description ? `「${f.no1_description}」` : ''}` : '',
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
      `・最上部：店名「${f.store_name}」${f.sub_catch ? `＋サブキャッチ「${f.sub_catch}」` : ''}${hasPhoto ? '＋添付写真を横幅いっぱいに' : ''}`,
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
  // 店内のご紹介（写真グリッド）
  if (templateId === 'shop-interior') {
    const seats = [[f.seat1_name, f.seat1_desc], [f.seat2_name, f.seat2_desc], [f.seat3_name, f.seat3_desc]]
      .filter(([n]) => n).map(([n, d]) => `「${n}」${d ? `（${d}）` : ''}`).join('／')
    return [
      '飲食店の店内紹介ページ(正方形1080×1080)を作成してください。',
      '■背景：薄いベージュ＋四隅に葉っぱイラスト。落ち着いたナチュラル。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部：タイトル「${f.title || '店内のご紹介'}」（明朝体）${f.subtitle ? `＋サブ「${f.subtitle}」` : ''}`,
      hasPhoto ? '・中央：添付の店内写真を大きく1枚、その下に小さめの写真を3枚グリッド配置' : '・中央：店内イメージを大きく1枚＋小さめ3枚のグリッドで配置',
      seats ? `・下段の写真キャプション3つ：${seats}` : '',
      f.note ? `・最下部：注記「${f.note}」（小さめ）` : '',
      '■デザイン：フォント=明朝体＋細ゴシック。カラー=ベージュ・ダークグリーン・ブラウン。上品でナチュラル。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を店内写真として使用してください（複数枚あれば席ごとに割り当て）。' : '',
    ].filter(Boolean).join('\n')
  }
  // アクセス・店舗情報（地図＋QR）
  if (templateId === 'access-info') {
    const infos = [
      f.access && `・${f.access}`,
      f.parking && `・${f.parking}`,
      f.address && `・住所：${f.address}`,
      f.tel && `・TEL：${f.tel}`,
      f.business_hours && `・営業時間：${f.business_hours}`,
      f.closed_day && `・定休日：${f.closed_day}`,
      f.instagram && `・Instagram：${f.instagram}`,
    ].filter(Boolean).join('\n')
    return [
      '飲食店のアクセス・店舗情報ページ(正方形1080×1080)を作成してください。',
      '■背景：薄いベージュ＋四隅に葉っぱイラスト。落ち着いたナチュラル。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部：タイトル「${f.title || 'アクセス・店舗情報'}」（明朝体）${f.subtitle ? `＋サブ「${f.subtitle}」` : ''}`,
      '・左側：店舗情報をアイコン付きで縦に整理：',
      infos,
      '・右側：周辺の簡易地図イラスト（店舗位置に目印ピン＋店名ラベル）',
      hasPhoto ? '・下部：添付のQRコード画像＋店舗外観写真を配置' : '・下部：QRコード枠＋SNS誘導エリアを配置',
      f.sns_promo ? `・SNS誘導帯：緑帯に「${f.sns_promo}」＋QRコード` : '',
      '■デザイン：フォント=明朝体＋細ゴシック。カラー=ベージュ・ダークグリーン・ブラウン。整理感・読みやすさ重視。',
      '■日本語・数字・記号（住所・電話・営業時間）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をQRコード・外観写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ─── サロン系：スパ・サロン新規オープン告知（高級感）───
  if (templateId === 'spa-open') {
    const strengths = [f.strength_1 || '通いやすい', f.strength_2 || '安心できる', f.strength_3 || '満足できる']
    const offers = [f.offer_1, f.offer_2].filter(Boolean)
    return [
      'サロン・スパ向けの新規オープン告知ポスター(正方形1080×1080)を作成してください。',
      hasPhoto ? '■背景：添付の上質な内装・施術写真を全面に使用（白基調・清潔感）。' : '■背景：白いカーテンや木製家具、キャンドル、観葉植物のある上質で清潔感のあるサロン内装。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・右上：丸型ロゴバッジ「${f.salon_name}」`,
      `・左上：縦書きの上品なキャッチコピー「${f.catch_copy}」`,
      `・右側：円形バッジ3つ（強み訴求）「${strengths[0]}」「${strengths[1]}」「${strengths[2]}」`,
      `・中央〜左下：超大型文字「${f.status || 'OPEN'}」${f.open_date ? `＋オープン日「${f.open_date}」` : ''}`,
      `・オレンジの角丸バッジ「${f.reservation_label || 'ご予約はこちら'}」＋QRアイコン`,
      f.lead_text ? `・案内文「${f.lead_text}」（明朝系・2行まで）` : '',
      offers.length ? `・最下部：特典カード（グレーヘッダー＋番号バッジ）：${offers.map((o, i) => `特典${i + 1}「${o}」`).join('／')}${f.offer_deadline ? `（期間限定：${f.offer_deadline}まで）` : ''}` : '',
      '■デザイン：フォント=見出し英字はセリフ細字（高級感）・日本語は明朝系・数字は極太。カラー=ベージュ・グレージュ・オレンジ（アクセント）・ホワイト。上質・落ち着き・非日常・女性向けリラクゼーション。',
      '■日本語・数字・記号は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をサロンの内装・施術イメージ写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ─── サロン系：エステ・サロン集客キャンペーン ───
  if (templateId === 'salon-campaign') {
    const isPink = (f.color_theme || 'ピンク系') === 'ピンク系'
    const palette = isPink ? 'やわらかいピンク・白・ローズ' : 'ベージュ・ゴールド・白・ブラウン'
    const infos = [
      f.tel && `TEL：${f.tel}`,
      f.open_hours && `受付：${f.open_hours}`,
      f.closed_day && `定休：${f.closed_day}`,
      f.address && `住所：${f.address}`,
    ].filter(Boolean).join(' ／ ')
    return [
      'エステ・美容サロン向けの新規集客キャンペーンポスター(縦長1080×1350)を作成してください。',
      hasPhoto ? '■背景：上部に添付のフェイシャル施術を受ける女性の写真を大きく配置。下地は単色。' : '■背景：上部にフェイシャルエステを受ける女性のクローズアップ。下地はやわらかい単色。',
      `■配色テーマ：${palette}（${f.color_theme || 'ピンク系'}）。`,
      '■配置（上から順・この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部リボン：「${f.target_copy || '大人女性のための'}」`,
      `・メインタイトル「${f.main_title}」${f.sub_title ? `＋強調大文字「${f.sub_title}」` : ''}`,
      `・サロン名帯「${f.salon_name}」`,
      `・丸アイコン3点：「${f.feature_1 || '完全個室'}」「${f.feature_2 || '経験豊富な担当者'}」「${f.feature_3 || 'オーダーメイド施術'}」`,
      f.course_name ? `・キャンペーン帯：「初めての方限定」＋コース名「${f.course_name}」` : '・キャンペーン帯：「初めての方限定」',
      (f.regular_price || f.special_price) ? `・価格：${f.regular_price ? `通常価格「${f.regular_price}」→` : ''}特別価格「${f.special_price || ''}」を大きく強調` : '',
      f.price_note ? `・注記「${f.price_note}」（小さめ）` : '',
      infos ? `・最下部：店舗情報「${infos}」＋予約QRコード` : '・最下部：予約QRコード',
      '■デザイン：フォント=見出しは丸ゴシック太字・英字ロゴはセリフ細字。上質・清潔感・女性向け・信頼感。',
      '■日本語・数字・記号（価格・電話・住所）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を施術イメージ写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ─── テイクアウト系：お弁当・テイクアウトメニュー（和風・高級感）───
  if (templateId === 'bento-menu') {
    const menuLines = (f.menu_items || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 4)
      .map(l => {
        const p = l.split(/\s+/)
        return p.length >= 3 ? `${p[0]}／${p[1]}円／${p.slice(2).join(' ')}` : l
      }).map(l => `・${l}`).join('\n')
    const infos = [
      f.tel && `TEL：${f.tel}`,
      f.reception_time && `受付：${f.reception_time}`,
      f.handoff_time && `お渡し：${f.handoff_time}`,
      f.closed_day && `定休：${f.closed_day}`,
      f.address && `住所：${f.address}`,
    ].filter(Boolean).join(' ／ ')
    return [
      'テイクアウト向けの和風・高級感あるお弁当メニュー表(正方形1080×1080)を作成してください。',
      '■背景：黒基調＋和のテクスチャ。落ち着いた重厚感。',
      hasPhoto ? '■中央〜右：添付のお弁当写真を大きく（複数あれば斜めに配置し、それぞれ美味しそうに）。' : '■中央〜右：お弁当を美味しそうに大きく配置。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・左上：筆文字風の店名「${f.shop_name}」＋見出し「${f.item_type || 'お弁当メニュー'}」`,
      menuLines ? `・商品リスト（商品名・価格・説明を整理して表示）：\n${menuLines}` : '',
      f.note_text ? `・補足「${f.note_text}」（小さめ）` : '',
      infos ? `・最下部帯：店舗情報「${infos}」＋注文QRコード` : '・最下部帯：注文QRコード',
      '■デザイン：フォント=店名は筆文字風・メニュー名はゴシック太字・価格は赤系ボックス。カラー=黒・金・赤茶。高級焼肉・職人・重厚感・食欲喚起。',
      '■日本語・数字・記号（商品名・価格・電話・住所）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をお弁当写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ─── テイクアウト系：宅配弁当メニュー（ナチュラル）───
  if (templateId === 'bento-delivery') {
    const menuLines = (f.menu_items || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 6)
      .map(l => {
        const p = l.split(/\s+/)
        return p.length >= 2 ? `${p[0]}／${p.slice(1).join(' ')}円` : l
      }).map(l => `・${l}`).join('\n')
    const infos = [
      f.tel && `TEL：${f.tel}`,
      f.open_hours && `営業：${f.open_hours}`,
      f.closed_day && `定休：${f.closed_day}`,
      f.address && `住所：${f.address}`,
    ].filter(Boolean).join(' ／ ')
    return [
      '宅配・テイクアウト向けのナチュラルな手作り弁当メニュー(正方形1080×1080)を作成してください。',
      '■背景：クリーム〜ブラウン系のあたたかい配色。木目テーブルの雰囲気。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・中央帯：デリバリーのアイコン＋メインキャッチ「${f.main_catch}」${f.delivery_note ? `＋黒帯バッジ「${f.delivery_note}」` : ''}`,
      f.lead_text ? `・説明文「${f.lead_text}」（2行まで）` : '',
      hasPhoto ? '・中央グリッド：添付のお弁当写真を並べて配置（3×2程度）' : '・中央グリッド：お弁当を並べて配置',
      menuLines ? `・各弁当名・価格：\n${menuLines}` : '',
      `・アイコン行：「${f.info_1 || '配達エリアあり'}」「${f.info_2 || '定期割引あり'}」${f.info_3 ? `「${f.info_3}」` : ''}`,
      infos ? `・最下部帯：店舗情報「${infos}」＋注文QRコード` : '・最下部帯：注文QRコード',
      '■デザイン：フォント=見出しは太めゴシック・メニュー名は丸ゴシック。カラー=ブラウン・アイボリー・グリーン（アクセント）。手作り・あたたかみ・健康・オフィスランチ向け。',
      '■日本語・数字・記号（商品名・価格・電話・住所）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をお弁当写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // ─── LINE公式アカウント 友だち登録案内（手順説明）───
  if (templateId === 'line-register-guide') {
    return [
      'LINE公式アカウントの友だち登録案内(正方形1080×1080)を作成してください。',
      '■背景：上段はLINEグリーンの帯、下段は白背景＋フラットな山・家・木・車のイラスト。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上段中央：大見出し「LINE公式アカウント」＋ID「${f.account_id}」`,
      `・上段右：吹き出しバッジ「${f.benefit_text || 'お得な情報やクーポンをGET！'}」`,
      `・上段下部：帯見出し「${f.cta_text || '友だち登録募集中！'}」`,
      '・中段左：手順見出し「LINE友だち追加の方法」',
      `　- 手順1（丸番号①）：「${f.step1_title || '「QRコード」で登録'}」${f.step1_desc ? `／${f.step1_desc}` : ''}`,
      `　- 手順2（丸番号②）：「${f.step2_title || '「ID検索」で登録'}」${f.step2_desc ? `／${f.step2_desc}` : ''}`,
      hasPhoto ? '・中段右：スマートフォン画面のモックアップ内に添付のQRコード画像＋ID表示' : '・中段右：スマートフォン画面のモックアップ内にQRコード枠＋ID表示',
      f.company_name ? `・最下部：店舗名・企業名「${f.company_name}」` : '',
      '■デザイン：フォント=見出しは太字ゴシック・ハイライトはマーカー風の黄色背景。カラー=LINEグリーン＋白＋黄色アクセント。親しみやすく・シンプル・分かりやすい操作案内。',
      '■日本語・英数字（ID・手順）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をQRコードとして使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  return ''
}

// ─── パンフレット一括生成：全ページ統一トーンの指定 ───────────────────
// 各ページの背景・配色・フォント・装飾・ページ番号バッジを揃え、シリーズ感を出す。
export interface BrochureTone {
  label: string
  bg: string
  decoration: string
  font: string
  palette: string
  badge: string
}
export const BROCHURE_TONES: Record<string, BrochureTone> = {
  ナチュラル: {
    label: 'ナチュラル（ベージュ×グリーン）',
    bg: '薄いベージュ〜クリームの無地',
    decoration: '手描き風の葉っぱ・枝（ダークグリーン）を余白に上品に配置',
    font: '見出し=明朝体／本文=細めのゴシック体',
    palette: 'ベージュ・クリーム・ダークグリーン・ブラウン',
    badge: 'ダークグリーンの角丸バッジに白文字',
  },
  高級感: {
    label: '高級感（ネイビー×ゴールド）',
    bg: 'ネイビー〜ダークブルーの上質なテクスチャ',
    decoration: '細いゴールドのラインと小さな星・キラキラを控えめに配置',
    font: '見出し=明朝体／英字=セリフ体／本文=細ゴシック',
    palette: 'ネイビー・ブラック・ゴールド・ホワイト',
    badge: 'ゴールド枠の角丸バッジに白文字',
  },
  ポップ: {
    label: 'ポップ（明るい×元気）',
    bg: '明るいクリーム〜パステルの無地',
    decoration: '丸や吹き出し、手描き風のあしらいを楽しく配置',
    font: '見出し=丸ゴシック極太／本文=丸ゴシック',
    palette: 'イエロー・オレンジ・ピンク・ターコイズ',
    badge: 'ビタミンカラーの丸バッジに白文字',
  },
}

// ベースのテンプレプロンプトに、全ページ共通のパンフレット統一デザイン指定を付与する。
export function buildBrochurePrompt(
  templateId: string,
  f: Record<string, string>,
  hasPhoto: boolean,
  ctx: { tone: string; pageNo: number; totalPages: number; storeName: string; size?: string },
): string {
  const base = buildPrompt(templateId, f, hasPhoto)
  const t = BROCHURE_TONES[ctx.tone] || BROCHURE_TONES['ナチュラル']
  return [
    base,
    '',
    '━━ パンフレット統一デザイン指定（このページ＝1枚に対する指定・最優先で厳守）━━',
    // ★混在防止：統一するのは「トーン（背景・配色・フォント・装飾）」のみ。
    //   中身（テキスト・写真・構成）は上記で指定したこのページ分だけを描画させる。
    `■この画像は「${ctx.storeName || 'お店'}」のご案内パンフレットの ${ctx.pageNo}ページ目（全${ctx.totalPages}ページ中）を、1枚だけ描画したものです。`,
    '■【最重要】1枚の画像に、このページ用に上で指定した内容だけを描画してください。他のページのメニュー・文言・写真・レイアウトを、この画像に取り込んだり、並べて表示したり、混ぜたりしないこと。1枚に複数ページ分を詰め込まないこと。',
    '■全ページで「統一」するのは、背景・配色・フォント・装飾（＝下記トーン）だけです。各ページの中身（テキスト・写真・構成）は、そのページ専用に指定されたものだけを使い、他ページのものは一切持ち込まないこと。',
    ...(ctx.size ? [`■出力サイズ：${ctx.size} に統一（全ページ同じサイズ・アスペクト比で作成すること。ベース指定より優先）。`] : []),
    `■背景：${t.bg}`,
    `■装飾：${t.decoration}`,
    `■フォント：${t.font}`,
    `■配色：${t.palette}`,
    `■左上に「${ctx.pageNo}/${ctx.totalPages}」のページ番号バッジ（${t.badge}）を必ず配置。`,
    '■上記の統一トーンは、各ページ固有の配色指定よりも優先してください（余白・帯・見出しスタイルを他ページと揃える）。ただし優先するのはトーンのみで、他ページの「中身」を混ぜる意味ではありません。',
  ].join('\n')
}
