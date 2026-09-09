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
  // ── サロン新規オープン告知（高級感・女性向け）──
  'salon-open': [
    { key: 'store_name', label: 'サロン名', placeholder: '例：Relax Spa LUMIERE', required: true, maxLength: 18 },
    { key: 'catch_copy', label: 'キャッチコピー', placeholder: '例：極上のスパ＆マッサージを、隠れ家で。', maxLength: 26 },
    { key: 'open_date', label: 'オープン日', placeholder: '例：10.31 THU', maxLength: 14 },
    { key: 'strength_1', label: '強み①', placeholder: '例：駅徒歩5分', default: '駅徒歩5分', maxLength: 12 },
    { key: 'strength_2', label: '強み②', placeholder: '例：完全個室', default: '完全個室', maxLength: 12 },
    { key: 'strength_3', label: '強み③', placeholder: '例：確かな技術', default: '確かな技術', maxLength: 12 },
    { key: 'offer', label: 'オープン特典', placeholder: '例：オープン記念 初回20%OFF', maxLength: 22 },
    { key: 'tel', label: 'ご予約電話番号', placeholder: '例：03-1234-5678', maxLength: 18 },
  ],
  // ── エステ・サロン 集客キャンペーン（清潔感・女性向け）──
  'esthe-campaign': [
    { key: 'store_name', label: 'サロン名', placeholder: '例：Beauté Premier', required: true, maxLength: 18 },
    { key: 'main_catch', label: 'メインキャッチ', placeholder: '例：エステで叶える、うるおい肌。', required: true, maxLength: 24 },
    { key: 'course_name', label: 'コース名', placeholder: '例：フェイシャル体験コース', maxLength: 18 },
    { key: 'regular_price', label: '通常価格（数字のみ）', placeholder: '例：11000', numeric: true, maxLength: 6 },
    { key: 'special_price', label: '特別価格（数字のみ）', placeholder: '例：5500', numeric: true, maxLength: 6 },
    { key: 'feature_1', label: '選ばれる理由①', placeholder: '例：完全個室のプライベート空間', default: '完全個室', maxLength: 16 },
    { key: 'feature_2', label: '選ばれる理由②', placeholder: '例：経験豊富なエステティシャン', default: '経験豊富な担当者', maxLength: 16 },
    { key: 'feature_3', label: '選ばれる理由③', placeholder: '例：オーダーメイド施術', default: 'オーダーメイド施術', maxLength: 16 },
  ],
  // ── お持ち帰りメニュー表（情報整理型・和モダン）──
  'takeout-menu': [
    { key: 'title', label: 'タイトル', placeholder: '例：お持ち帰りメニュー', default: 'お持ち帰りメニュー', maxLength: 16 },
    { key: 'business_hours', label: '営業時間', placeholder: '例：11:00〜14:30', maxLength: 24 },
    { key: 'menu_items', label: 'メニュー（1行に「商品名 価格」／最大8行）', type: 'textarea', placeholder: '唐揚げ弁当 650\nのり弁当 450\nおにぎり 180', hint: '1行1商品・最大8行', maxLength: 26, maxLines: 8 },
    { key: 'special', label: 'おすすめバッジ', placeholder: '例：人気No.1', maxLength: 10 },
    { key: 'note', label: '注記', placeholder: '例：全て税込価格です', default: '全て税込価格', maxLength: 20 },
  ],
  // ── お弁当メニュー（和風・高級感／テイクアウト）──
  'bento-menu': [
    { key: 'store_name', label: '店名', placeholder: '例：和み亭', required: true, maxLength: 16 },
    { key: 'title', label: '見出し', placeholder: '例：こだわりのお弁当', default: 'こだわりのお弁当', maxLength: 16 },
    { key: 'menu_items', label: 'お弁当（1行に「商品名 価格 説明」／最大5行）', type: 'textarea', placeholder: '特上カルビ弁当 2200 旨みたっぷり\n幕の内弁当 1200 彩り豊か', hint: '1行1商品・最大5行', maxLength: 30, maxLines: 5 },
    { key: 'note', label: '注記', placeholder: '例：ご飯は白米・もち麦米が選べます', maxLength: 26 },
    { key: 'tel', label: 'ご注文電話番号', placeholder: '例：03-1234-5678', maxLength: 18 },
  ],
  // ── LINE友だち登録案内（操作手順つき）──
  'line-friend-guide': [
    { key: 'store_name', label: '店名・会社名', placeholder: '例：Cafe LUMIERE', maxLength: 18 },
    { key: 'account_id', label: 'LINE ID（@付き）', placeholder: '例：@lumiere_cafe', required: true, maxLength: 20 },
    { key: 'benefit_text', label: '登録メリット', placeholder: '例：イベント情報やクーポンをGET！', default: 'お得な情報やクーポンをGET！', maxLength: 22 },
    { key: 'step1_desc', label: '手順①（QRコードで登録）', placeholder: '例：友だち追加→QRコードを選び、読み取る', default: '「友だち追加」→「QRコード」から読み取る', maxLength: 30 },
    { key: 'step2_desc', label: '手順②（ID検索で登録）', placeholder: '例：友だち追加→検索→IDを入力', default: '「友だち追加」→「検索」でIDを入力', maxLength: 30 },
    { key: 'cta', label: '呼びかけ文', placeholder: '例：友だち登録募集中！', default: '友だち登録募集中！', maxLength: 18 },
  ],

  // ══ DESIGN BOX 新規テンプレ11種（2026-08-20 追加・飲食／db-food-*）══
  // 出典: Downloads/DESIGN BOX 新規テンプレート11種｜画像・JSON・Driveリンク.xlsx
  // 見本画像は public/templates/tpl-db-food-*.jpg（referenceImage）。生成は buildFoodPrompt。

  // ① 縦書き商品ヒーロー
  'db-food-vertical-hero': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['明るい和モダン', '高級和風', '爽やか', '力強い'], default: '明るい和モダン' },
    { key: 'main_title', label: '商品名', placeholder: '例：炭火香る さば重', required: true, maxLength: 15 },
    { key: 'description', label: '商品の特徴', placeholder: '例：皮は香ばしく、身はふっくら', maxLength: 40 },
    { key: 'badge_text', label: '丸バッジの文言', placeholder: '例：季節限定', maxLength: 8 },
    { key: 'service_time', label: '提供時間・区分', placeholder: '例：昼 11:00–15:00', maxLength: 18 },
    { key: 'price', label: '価格', placeholder: '例：1,280円', maxLength: 10 },
    { key: 'palette', label: '配色', type: 'select', options: ['ミント×ネイビー×オレンジ', '生成り×黒×朱色', '水色×白×濃紺', 'おまかせ'], default: 'おまかせ' },
  ],
  // ② 情報充実テイクアウトメニュー
  'db-food-takeout-dense': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['和モダン', '親しみやすい', 'ポップ', '落ち着いた'], default: '和モダン' },
    { key: 'main_title', label: 'メニュー名', placeholder: '例：鉄板ぎょうざ', required: true, maxLength: 16 },
    { key: 'main_catch', label: 'メインキャッチ', placeholder: '例：外はパリッと中はジューシー', maxLength: 20 },
    { key: 'products', label: '主力商品（1行に「商品名 個数 価格 説明」／最大2行）', type: 'textarea', placeholder: '鉄板ぎょうざ 6個 480円 熱々をそのまま\n特製水餃子 5個 450円 もちもち', hint: '1行1商品・最大2行。写真は下でアップロード', maxLength: 34, maxLines: 2 },
    { key: 'flavors', label: '味・ソース（1行に「名称 説明」／最大5行）', type: 'textarea', placeholder: '味噌だれ こく深い\nゆず胡椒 さっぱり', hint: '1行1件・最大5行', maxLength: 26, maxLines: 5 },
    { key: 'toppings', label: 'トッピング（1行に「名称 追加価格」／最大4行）', type: 'textarea', placeholder: '大盛り +150円\nチーズ +100円', hint: '1行1件・最大4行', maxLength: 20, maxLines: 4 },
    { key: 'order_steps', label: '注文・受取方法（1行に「見出し 説明」／最大3行）', type: 'textarea', placeholder: '注文 電話またはLINEで\n受取 店頭カウンター', hint: '1行1段階・最大3行', maxLength: 26, maxLines: 3 },
    { key: 'footer_notes', label: '下部案内（1行に「見出し 説明」／最大3行）', type: 'textarea', placeholder: '営業時間 11:00-20:00', hint: '入力がある項目のみ表示・最大3行', maxLength: 26, maxLines: 3 },
    { key: 'palette', label: '配色', type: 'select', options: ['ミント×紫×コーラル', '紺×生成り×赤', '茶×クリーム×緑', 'おまかせ'], default: 'おまかせ' },
  ],
  // ③ 4商品フォトグリッド
  'db-food-four-grid': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['パステル', 'カラフル', 'ナチュラル', 'クール'], default: 'パステル' },
    { key: 'main_title', label: '企画・メニュー名', placeholder: '例：選べる彩りボウル', required: true, maxLength: 18 },
    { key: 'price_text', label: '価格・価格訴求', placeholder: '例：ランチ限定 680円', maxLength: 12 },
    { key: 'items', label: '商品4件（1行に「商品名」／4行）', type: 'textarea', placeholder: 'サーモンボウル\nアボカドボウル\nチキンボウル\n彩り野菜ボウル', hint: '4商品・各写真は下でアップロード', maxLength: 18, maxLines: 4 },
    { key: 'palette', label: '配色', type: 'select', options: ['ラベンダー×ミント×オレンジ', '青×黄×白', 'ベージュ×緑×赤', 'おまかせ'], default: 'おまかせ' },
  ],
  // ④ 写真付き縦型メニュー一覧
  'db-food-list-menu': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['和モダン', 'ナチュラル', '高級感', 'クール'], default: '和モダン' },
    { key: 'main_title', label: 'メニュー名', placeholder: '例：炭火串焼き MENU', required: true, maxLength: 14 },
    { key: 'items', label: '商品一覧（1行に「商品名 価格」／最大8行）', type: 'textarea', placeholder: '正肉 180円\nつくね 200円\nねぎま 190円', hint: '1行1商品・最大8行', maxLength: 24, maxLines: 8 },
    { key: 'featured_items', label: '下部おすすめ（1行に「商品名 価格」／最大2行）', type: 'textarea', placeholder: '特上盛り合わせ 1,280円', hint: '1行1商品・最大2行', maxLength: 24, maxLines: 2 },
    { key: 'palette', label: '配色', type: 'select', options: ['紺×桃×生成り', '黒×金×白', '緑×ベージュ×朱', 'おまかせ'], default: 'おまかせ' },
  ],
  // ⑤ エディトリアル3品メニュー
  'db-food-editorial-brunch': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['上品', 'ナチュラル', 'フェミニン', 'モダン'], default: '上品' },
    { key: 'main_title', label: 'メニュー名', placeholder: '例：WEEKEND BRUNCH', required: true, maxLength: 18 },
    { key: 'items', label: 'メイン商品3件（1行に「商品名 価格 説明」／3行）', type: 'textarea', placeholder: 'エッグベネディクト 1,200円 半熟卵ととろけるソース\nパンケーキ 980円 ふわふわ食感', hint: '3商品・各写真は下でアップロード', maxLength: 34, maxLines: 3 },
    { key: 'option_groups', label: '追加メニュー（1行に「グループ名：項目1, 項目2…」／最大2行）', type: 'textarea', placeholder: 'ドリンク：コーヒー, 紅茶, ジュース', hint: '1行1グループ・最大2行', maxLength: 40, maxLines: 2 },
    { key: 'info_cards', label: '下部案内（1行に「見出し 本文」／最大2行）', type: 'textarea', placeholder: '営業時間 土日 8:00-14:00', hint: '入力がある項目のみ表示・最大2行', maxLength: 40, maxLines: 2 },
    { key: 'palette', label: '配色', type: 'select', options: ['セージ×ラベンダー×生成り', '白×黒×グレー', 'ベージュ×茶×緑', 'おまかせ'], default: 'おまかせ' },
  ],
  // ⑥ 超大型価格キャンペーン
  'db-food-price-impact': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['力強い', 'ネオン', 'ポップ', 'スポーティー'], default: '力強い' },
    { key: 'campaign_title', label: 'キャンペーン名', placeholder: '例：OPEN記念', required: true, maxLength: 14 },
    { key: 'main_price', label: 'メイン価格', placeholder: '例：690円', required: true, maxLength: 8 },
    { key: 'period', label: '期間', placeholder: '例：5.16–5.22', required: true, maxLength: 24 },
    { key: 'condition', label: '利用条件', placeholder: '例：お一人様1回まで', maxLength: 42 },
    { key: 'items', label: '対象商品3件（1行に「商品名 特徴 価格」／3行）', type: 'textarea', placeholder: '唐揚げ ジューシー 690円\nハンバーグ 肉汁たっぷり 690円', hint: '3商品・各写真は下でアップロード', maxLength: 30, maxLines: 3 },
    { key: 'footer_text', label: '最下部の案内', placeholder: '例：全店舗共通・テイクアウトOK', maxLength: 50 },
    { key: 'palette', label: '配色', type: 'select', options: ['青×ライム×紫', '赤×黒×白', 'オレンジ×紺×白', 'おまかせ'], default: 'おまかせ' },
  ],
  // ⑦ イラスト付きオープニングイベント
  'db-food-opening-event': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['パステル', '温かい', 'ナチュラル', '子ども向け'], default: 'パステル' },
    { key: 'event_title', label: 'イベント名', placeholder: '例：BAKERY OPENING DAY', required: true, maxLength: 22 },
    { key: 'event_date', label: '開催日', placeholder: '例：9.14 SUN', required: true, maxLength: 16 },
    { key: 'event_time', label: '開催時間', placeholder: '例：10:00-17:00', maxLength: 18 },
    { key: 'offers', label: '特典・企画（1行に「見出し 説明 価格」／最大2行）', type: 'textarea', placeholder: '先着50名 焼きたてパンプレゼント\n本日限定 全品10%OFF', hint: '1行1件・最大2行', maxLength: 34, maxLines: 2 },
    { key: 'features', label: '特徴（1行に「見出し」／最大4行）', type: 'textarea', placeholder: '駐車場あり\nテラス席\nペットOK', hint: '1行1件・最大4行', maxLength: 16, maxLines: 4 },
    { key: 'access_text', label: 'アクセス・受取案内', type: 'textarea', placeholder: '○○駅から徒歩5分', hint: '最大2行', maxLength: 40, maxLines: 2 },
    { key: 'palette', label: '配色', type: 'select', options: ['ラベンダー×コーラル×深緑', '黄緑×桃×黄', '水色×赤×生成り', 'おまかせ'], default: 'おまかせ' },
  ],
  // ⑧ 高級スイーツ・プロダクトヒーロー
  'db-food-luxury-product': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['ラグジュアリー', 'モード', 'ロマンティック', 'クール'], default: 'ラグジュアリー' },
    { key: 'category_left', label: '左上カテゴリ', placeholder: '例：CREPE', maxLength: 10 },
    { key: 'category_right', label: '右上カテゴリ', placeholder: '例：SEASONAL', maxLength: 10 },
    { key: 'main_title', label: '英字商品名', placeholder: '例：STRAWBERRY PISTACHIO', required: true, maxLength: 28 },
    { key: 'script_subtitle', label: '筆記体サブタイトル', placeholder: '例：Ruby Garden', maxLength: 18 },
    { key: 'description', label: '商品説明（最大3行）', type: 'textarea', placeholder: '厳選した苺とピスタチオの\n贅沢なマリアージュ', maxLength: 38, maxLines: 3 },
    { key: 'palette', label: '配色', type: 'select', options: ['濃紺×淡桃×生成り', '深緑×金×白', '黒×赤紫×銀', 'おまかせ'], default: 'おまかせ' },
  ],
  // ⑨ 季節の和スイーツ
  'db-food-seasonal-shaved-ice': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['上品', '涼しげ', '華やか', '伝統的'], default: '上品' },
    { key: 'main_title', label: '商品名', placeholder: '例：苺みるくかき氷', required: true, maxLength: 14 },
    { key: 'sub_catch', label: '季節のキャッチ', placeholder: '例：夏のご褒美スイーツ', maxLength: 18 },
    { key: 'english_title', label: '英字タイトル', placeholder: '例：STRAWBERRY KAKIGORI', maxLength: 26 },
    { key: 'badge_text', label: '販売区分', placeholder: '例：季節限定', maxLength: 8 },
    { key: 'price', label: '価格', placeholder: '例：980円', maxLength: 10 },
    { key: 'palette', label: '配色', type: 'select', options: ['薄紫×苺色×水色', '白×抹茶×金', '紺×白×朱', 'おまかせ'], default: 'おまかせ' },
  ],
  // ⑩ 具材解説サンドイッチ
  'db-food-ingredient-anatomy': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['クール', 'ポップ', 'ナチュラル', 'ミニマル'], default: 'クール' },
    { key: 'main_title', label: '商品名', placeholder: '例：アボカドシュリンプサンド', required: true, maxLength: 20 },
    { key: 'ingredients', label: '具材・構成要素（1行に「表示名 位置の説明」／最大7行）', type: 'textarea', placeholder: 'アボカド 上段のクリーミーな層\nエビ 中央のメイン具材\nレタス みずみずしい葉物', hint: '1行1具材・最大7行。写真の断面と一致させます', maxLength: 30, maxLines: 7 },
    { key: 'palette', label: '配色', type: 'select', options: ['水色×紺×コーラル', '白×オレンジ', '生成り×緑×茶', 'おまかせ'], default: 'おまかせ' },
  ],
  // ⑪ 写真全面＋超大型タイポグラフィ
  'db-food-oversized-photo-type': [
    { key: 'tone', label: 'トーン（雰囲気）', type: 'select', options: ['エディトリアル', 'ストリート', 'モダン', '温かい'], default: 'エディトリアル' },
    { key: 'main_title', label: '大型タイトル', placeholder: '例：ROASTED VEGGIE FOCACCIA', required: true, maxLength: 24 },
    { key: 'location_label', label: '地域・短い副題', placeholder: '例：KOBE HARBOR', maxLength: 18 },
    { key: 'brand_sentence', label: 'ブランドメッセージ', placeholder: '例：素材にこだわる、街のパン工房', maxLength: 52 },
    { key: 'hours', label: '営業時間', placeholder: '例：8:00-19:00', maxLength: 24 },
    { key: 'closed_day', label: '定休日', placeholder: '例：月曜定休', maxLength: 18 },
    { key: 'palette', label: '文字・写真の色調', type: 'select', options: ['ティール×コーラル×生成り', '暖色写真×白文字', 'モノクロ×差し色', 'おまかせ'], default: 'おまかせ' },
  ],

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
    { key: "point_1_title", label: "point1(タイトル)", maxLength: 28 },
    { key: "point_1_desc", label: "point1(説明)", maxLength: 60 },
    { key: "point_2_title", label: "point2(タイトル)", maxLength: 28 },
    { key: "point_2_desc", label: "point2(説明)", maxLength: 60 },
    { key: "point_3_title", label: "point3(タイトル)", maxLength: 28 },
    { key: "point_3_desc", label: "point3(説明)", maxLength: 60 },
    { key: "side_banner_text", label: "縦帯コピー", maxLength: 60 },
    { key: "checklist_title", label: "チェックリスト見出し", default: "◯◯のこだわり", maxLength: 60 },
    { key: "check_1", label: "check1", maxLength: 40 },
    { key: "check_5", label: "check5", maxLength: 40 },
    { key: "item_name_1", label: "商品名1", maxLength: 28 },
    { key: "price_1", label: "価格1", numeric: true, maxLength: 8 },
    { key: "item_desc_1", label: "商品説明1", maxLength: 60 },
    { key: "item_name_2", label: "商品名2", maxLength: 28 },
    { key: "price_2", label: "価格2", numeric: true, maxLength: 8 },
    { key: "item_desc_2", label: "商品説明2", maxLength: 60 },
    { key: "item_name_3", label: "商品名3", maxLength: 28 },
    { key: "price_3", label: "価格3", numeric: true, maxLength: 8 },
    { key: "item_desc_3", label: "商品説明3", maxLength: 60 },
    { key: "review_1_title", label: "review1(タイトル)", maxLength: 28 },
    { key: "review_1_comment", label: "review1(コメント)", maxLength: 40 },
    { key: "review_1_profile", label: "review1(プロフィール)", maxLength: 40 },
    { key: "review_2_title", label: "review2(タイトル)", maxLength: 28 },
    { key: "review_2_comment", label: "review2(コメント)", maxLength: 40 },
    { key: "review_2_profile", label: "review2(プロフィール)", maxLength: 40 },
    { key: "review_3_title", label: "review3(タイトル)", maxLength: 28 },
    { key: "review_3_comment", label: "review3(コメント)", maxLength: 40 },
    { key: "review_3_profile", label: "review3(プロフィール)", maxLength: 40 },
    { key: "coupon_text", label: "クーポン文言", maxLength: 60 },
    { key: "coupon_step_1", label: "coupon_step1", maxLength: 40 },
    { key: "coupon_step_2", label: "coupon_step2", maxLength: 40 },
    { key: "coupon_step_3", label: "coupon_step3", maxLength: 40 },
    { key: "hours", label: "営業時間", maxLength: 40 },
    { key: "holiday", label: "定休日", maxLength: 40 },
    { key: "tel", label: "電話番号", maxLength: 40 },
    { key: "address", label: "住所", maxLength: 40 },
    { key: "station_access", label: "駅からのアクセス", maxLength: 40 },
  ],
  'line_benefits': [
    { key: "headline_prefix", label: "headline_prefix", default: "友だち追加で", maxLength: 28 },
    { key: "headline_main", label: "headline_main", default: "お得なクーポンプレゼント!", maxLength: 28 },
    { key: "headline_sub", label: "headline_sub", default: "うれしい特典がたくさん!", maxLength: 28 },
    { key: "line_id", label: "LINE ID", maxLength: 40 },
    { key: "benefit_1_text", label: "benefit1(テキスト)", maxLength: 60 },
    { key: "benefit_2_title", label: "benefit2(タイトル)", maxLength: 28 },
    { key: "benefit_2_desc", label: "benefit2(説明)", maxLength: 60 },
    { key: "benefit_3_title", label: "benefit3(タイトル)", maxLength: 28 },
    { key: "benefit_3_desc", label: "benefit3(説明)", maxLength: 60 },
    { key: "step_1_label", label: "step1(ラベル)", maxLength: 28 },
    { key: "step_1_desc", label: "step1(説明)", maxLength: 60 },
    { key: "step_2_label", label: "step2(ラベル)", maxLength: 28 },
    { key: "step_2_desc", label: "step2(説明)", maxLength: 60 },
    { key: "step_3_label", label: "step3(ラベル)", maxLength: 28 },
    { key: "step_3_desc", label: "step3(説明)", maxLength: 60 },
    { key: "bottom_note_1", label: "bottom_note1", default: "さらに!友だち限定の特典も配信中!", maxLength: 60 },
    { key: "bottom_note_2", label: "bottom_note2", default: "今すぐ登録してお得をゲットしよう!", maxLength: 60 },
  ],
  'sns_annotation': [
    { key: "caption_1", label: "caption1", maxLength: 40 },
    { key: "caption_2", label: "caption2", maxLength: 40 },
    { key: "caption_3", label: "caption3", maxLength: 40 },
    { key: "caption_4", label: "caption4", maxLength: 40 },
    { key: "caption_5", label: "caption5", maxLength: 40 },
    { key: "caption_6", label: "caption6", maxLength: 40 },
    { key: "caption_7", label: "caption7", maxLength: 40 },
    { key: "caption_8", label: "caption8", maxLength: 40 },
    { key: "caption_9", label: "caption9", maxLength: 40 },
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
    { key: "sub_item_1_name", label: "sub_item1(名前)", maxLength: 28 },
    { key: "sub_price_1", label: "sub_price1", numeric: true, maxLength: 8 },
    { key: "sub_desc_1", label: "sub_desc1", maxLength: 60 },
    { key: "sub_item_2_name", label: "sub_item2(名前)", maxLength: 28 },
    { key: "sub_price_2", label: "sub_price2", numeric: true, maxLength: 8 },
    { key: "sub_desc_2", label: "sub_desc2", maxLength: 60 },
    { key: "sub_item_3_name", label: "sub_item3(名前)", maxLength: 28 },
    { key: "sub_price_3", label: "sub_price3", numeric: true, maxLength: 8 },
    { key: "sub_desc_3", label: "sub_desc3", maxLength: 60 },
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
    { key: "original_price_1", label: "original_price1", numeric: true, maxLength: 8 },
    { key: "sale_price_1", label: "sale_price1", numeric: true, maxLength: 8 },
    { key: "item_name_2", label: "商品名2", maxLength: 28 },
    { key: "original_price_2", label: "original_price2", numeric: true, maxLength: 8 },
    { key: "sale_price_2", label: "sale_price2", numeric: true, maxLength: 8 },
    { key: "item_name_3", label: "商品名3", maxLength: 28 },
    { key: "original_price_3", label: "original_price3", numeric: true, maxLength: 8 },
    { key: "sale_price_3", label: "sale_price3", numeric: true, maxLength: 8 },
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
    { key: "ingredient_1", label: "ingredient1", maxLength: 40 },
    { key: "ingredient_2", label: "ingredient2", maxLength: 40 },
    { key: "ingredient_3", label: "ingredient3", maxLength: 40 },
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
    { key: "flavor_1_name", label: "flavor1(名前)", maxLength: 28 },
    { key: "flavor_2_name", label: "flavor2(名前)", maxLength: 28 },
    { key: "flavor_3_name", label: "flavor3(名前)", maxLength: 28 },
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
    { key: "ingredient_1", label: "ingredient1", maxLength: 40 },
    { key: "ingredient_2", label: "ingredient2", maxLength: 40 },
    { key: "ingredient_3", label: "ingredient3", maxLength: 40 },
    { key: "ingredient_4", label: "ingredient4", maxLength: 40 },
    { key: "ingredient_5", label: "ingredient5", maxLength: 40 },
    { key: "ingredient_6", label: "ingredient6", maxLength: 40 },
    { key: "ingredient_7", label: "ingredient7", maxLength: 40 },
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
    { key: "corner_illustration_1", label: "corner_illustration1", maxLength: 40 },
    { key: "corner_illustration_2", label: "corner_illustration2", maxLength: 40 },
    { key: "corner_illustration_3", label: "corner_illustration3", maxLength: 40 },
    { key: "corner_illustration_4", label: "corner_illustration4", maxLength: 40 },
    { key: "corner_illustration_5", label: "corner_illustration5", maxLength: 40 },
    { key: "title_text", label: "大見出し", default: "BAKERY OPENING DAY", maxLength: 60 },
    { key: "event_date", label: "開催日", maxLength: 40 },
    { key: "event_hours", label: "営業時間", maxLength: 40 },
    { key: "offer_1_badge", label: "offer1(badge)", default: "先着100名様", maxLength: 28 },
    { key: "offer_1_title", label: "offer1(タイトル)", default: "焼きたてパンプレゼント", maxLength: 28 },
    { key: "offer_1_desc", label: "offer1(説明)", maxLength: 60 },
    { key: "offer_2_badge", label: "offer2(badge)", default: "数量限定", maxLength: 28 },
    { key: "offer_2_title", label: "offer2(タイトル)", default: "限定セット", maxLength: 28 },
    { key: "offer_2_price", label: "offer2(価格)", numeric: true, maxLength: 8 },
    { key: "offer_2_desc", label: "offer2(説明)", maxLength: 60 },
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
    { key: "item_1_comment", label: "item1(コメント)", maxLength: 40 },
    { key: "item_1_name", label: "item1(名前)", maxLength: 28 },
    { key: "item_2_comment", label: "item2(コメント)", maxLength: 40 },
    { key: "item_2_name", label: "item2(名前)", maxLength: 28 },
    { key: "item_3_comment", label: "item3(コメント)", maxLength: 40 },
    { key: "item_3_name", label: "item3(名前)", maxLength: 28 },
    { key: "shop_tagline", label: "キャッチコピー", default: "美味しい時間を、もっと身近に。", maxLength: 60 },
    { key: "shop_name", label: "店名", maxLength: 28 },
    { key: "shop_desc", label: "店舗説明", maxLength: 60 },
    { key: "notice_text", label: "案内文", maxLength: 60 },
  ],
  'weekend_brunch_plate': [
    { key: "item_1_name", label: "item1(名前)", default: "EGG", maxLength: 28 },
    { key: "item_1_price", label: "item1(価格)", numeric: true, maxLength: 8 },
    { key: "item_1_desc", label: "item1(説明)", maxLength: 60 },
    { key: "item_2_name", label: "item2(名前)", default: "SALAD", maxLength: 28 },
    { key: "item_2_price", label: "item2(価格)", numeric: true, maxLength: 8 },
    { key: "item_2_desc", label: "item2(説明)", maxLength: 60 },
    { key: "item_3_name", label: "item3(名前)", default: "PANCAKE", maxLength: 28 },
    { key: "item_3_price", label: "item3(価格)", numeric: true, maxLength: 8 },
    { key: "item_3_desc", label: "item3(説明)", maxLength: 60 },
    { key: "section_title_en", label: "セクション英題", default: "WEEKEND BRUNCH", maxLength: 28 },
    { key: "section_title_jp", label: "セクション和題", default: "選べるプレート", maxLength: 28 },
    { key: "drink_list", label: "ドリンク一覧(改行区切り)", maxLength: 60 },
    { key: "topping_list", label: "トッピング一覧(改行区切り)", maxLength: 60 },
    { key: "drink_set_desc", label: "DRINK SET説明", maxLength: 60 },
    { key: "sweet_set_price", label: "SWEET SET価格", default: "+300円", numeric: true, maxLength: 8 },
    { key: "sweet_set_desc", label: "SWEET SET説明", maxLength: 60 },
  ],
  'yakitori_menu': [
    { key: "item_1_name", label: "item1(名前)", default: "もも ねぎま", maxLength: 28 },
    { key: "item_2_name", label: "item2(名前)", default: "つくね(たれ・月見)", maxLength: 28 },
    { key: "item_3_name", label: "item3(名前)", default: "ささみおろしポン酢", maxLength: 28 },
    { key: "item_5_name", label: "item5(名前)", default: "うずら玉子", maxLength: 28 },
    { key: "item_8_name", label: "item8(名前)", default: "しいたけ", maxLength: 28 },
    { key: "extra_1_name", label: "extra1(名前)", default: "鶏だし茶漬け", maxLength: 28 },
    { key: "extra_2_name", label: "extra2(名前)", default: "焼きおにぎり", maxLength: 28 },
    { key: "category_tag", label: "カテゴリ", default: "串火", maxLength: 28 },
    { key: "menu_label", label: "メニュー表記", default: "MENU", maxLength: 28 },
    { key: "item_1_price", label: "item1(価格)", default: "280", numeric: true, maxLength: 8 },
    { key: "item_2_price", label: "item2(価格)", default: "320", numeric: true, maxLength: 8 },
    { key: "item_3_price", label: "item3(価格)", default: "300", numeric: true, maxLength: 8 },
    { key: "item_4_name", label: "item4(名前)", default: "砂肝", maxLength: 28 },
    { key: "item_4_price", label: "item4(価格)", default: "260", numeric: true, maxLength: 8 },
    { key: "item_5_price", label: "item5(価格)", default: "240", numeric: true, maxLength: 8 },
    { key: "item_6_name", label: "item6(名前)", default: "皮(パリパリ)", maxLength: 28 },
    { key: "item_6_price", label: "item6(価格)", default: "220", numeric: true, maxLength: 8 },
    { key: "item_7_name", label: "item7(名前)", default: "ぼんじり", maxLength: 28 },
    { key: "item_7_price", label: "item7(価格)", default: "280", numeric: true, maxLength: 8 },
    { key: "item_8_price", label: "item8(価格)", default: "240", numeric: true, maxLength: 8 },
    { key: "extra_1_price", label: "extra1(価格)", default: "380", numeric: true, maxLength: 8 },
    { key: "extra_2_price", label: "extra2(価格)", default: "280", numeric: true, maxLength: 8 },
  ],
  'colorful_bowl_lunch': [
    { key: "item_1_name", label: "item1(名前)", maxLength: 28 },
    { key: "item_2_name", label: "item2(名前)", maxLength: 28 },
    { key: "item_3_name", label: "item3(名前)", maxLength: 28 },
    { key: "item_4_name", label: "item4(名前)", maxLength: 28 },
    { key: "banner_title", label: "バナータイトル", default: "選べる彩りボウル", maxLength: 28 },
    { key: "banner_badge", label: "バナーバッジ", default: "ランチ限定", maxLength: 28 },
    { key: "price", label: "価格", numeric: true, maxLength: 8 },
  ],
  'teppan_gyoza_menu': [
    { key: "category_tag", label: "カテゴリ", default: "香ばし餃子", maxLength: 28 },
    { key: "title_text", label: "大見出し", default: "鉄板ぎょうざ", maxLength: 60 },
    { key: "subtitle_text", label: "サブタイトル", default: "外はパリッと中はジューシー!", maxLength: 60 },
    { key: "takeout_badge", label: "持ち帰りバッジ", default: "持ち帰りできます", maxLength: 28 },
    { key: "type_1_name", label: "type1(名前)", default: "焼き餃子", maxLength: 28 },
    { key: "type_1_qty", label: "type1(数量)", default: "8個", maxLength: 8 },
    { key: "type_1_price", label: "type1(価格)", default: "720", numeric: true, maxLength: 8 },
    { key: "type_1_desc", label: "type1(説明)", maxLength: 60 },
    { key: "type_2_label", label: "type2(ラベル)", default: "しそ", maxLength: 28 },
    { key: "type_2_name", label: "type2(名前)", default: "しそ餃子", maxLength: 28 },
    { key: "type_2_qty", label: "type2(数量)", default: "8個", maxLength: 8 },
    { key: "type_2_price", label: "type2(価格)", default: "780", numeric: true, maxLength: 8 },
    { key: "type_2_desc", label: "type2(説明)", maxLength: 60 },
    { key: "commitment_title", label: "こだわり見出し", default: "こだわりの餃子", maxLength: 28 },
    { key: "commitment_1", label: "commitment1", maxLength: 40 },
    { key: "commitment_2", label: "commitment2", maxLength: 40 },
    { key: "commitment_3", label: "commitment3", maxLength: 40 },
    { key: "sauce_1_name", label: "sauce1(名前)", default: "定番醤油ダレ", maxLength: 28 },
    { key: "sauce_1_desc", label: "sauce1(説明)", maxLength: 60 },
    { key: "sauce_2_name", label: "sauce2(名前)", default: "さっぱり柚子ダレ", maxLength: 28 },
    { key: "sauce_2_desc", label: "sauce2(説明)", maxLength: 60 },
    { key: "sauce_3_name", label: "sauce3(名前)", default: "ピリ辛ラー油ダレ", maxLength: 28 },
    { key: "sauce_3_desc", label: "sauce3(説明)", maxLength: 60 },
    { key: "sauce_4_name", label: "sauce4(名前)", default: "まろやか味噌ダレ", maxLength: 28 },
    { key: "sauce_4_desc", label: "sauce4(説明)", maxLength: 60 },
    { key: "sauce_5_name", label: "sauce5(名前)", default: "塩ダレ", maxLength: 28 },
    { key: "sauce_5_desc", label: "sauce5(説明)", maxLength: 60 },
    { key: "topping_1_name", label: "topping1(名前)", default: "半熟味玉", maxLength: 28 },
    { key: "topping_1_price", label: "topping1(価格)", default: "120", numeric: true, maxLength: 8 },
    { key: "topping_2_name", label: "topping2(名前)", default: "ねぎ増し", maxLength: 28 },
    { key: "topping_2_price", label: "topping2(価格)", default: "100", numeric: true, maxLength: 8 },
    { key: "topping_3_name", label: "topping3(名前)", default: "メンマ", maxLength: 28 },
    { key: "topping_3_price", label: "topping3(価格)", default: "100", numeric: true, maxLength: 8 },
    { key: "topping_4_name", label: "topping4(名前)", default: "大葉増し", maxLength: 28 },
    { key: "topping_4_price", label: "topping4(価格)", default: "100", numeric: true, maxLength: 8 },
    { key: "addon_note", label: "追加注記", default: "焼き餃子・しそ餃子各種", maxLength: 60 },
    { key: "addon_price", label: "追加料金", default: "360", numeric: true, maxLength: 8 },
    { key: "step_1_label", label: "step1(ラベル)", default: "注文する", maxLength: 28 },
    { key: "step_1_desc", label: "step1(説明)", maxLength: 60 },
    { key: "step_2_label", label: "step2(ラベル)", default: "受け取る", maxLength: 28 },
    { key: "step_2_desc", label: "step2(説明)", maxLength: 60 },
    { key: "step_3_label", label: "step3(ラベル)", default: "おうちで楽しむ", maxLength: 28 },
    { key: "step_3_desc", label: "step3(説明)", maxLength: 60 },
    { key: "reheat_pan_desc", label: "温め方(フライパン)", maxLength: 60 },
    { key: "reheat_microwave_desc", label: "温め方(電子レンジ)", maxLength: 60 },
    { key: "bottom_badge_1_title", label: "bottom_badge1(タイトル)", default: "スマホから簡単注文", maxLength: 28 },
    { key: "bottom_badge_1_desc", label: "bottom_badge1(説明)", maxLength: 60 },
    { key: "bottom_badge_2_title", label: "bottom_badge2(タイトル)", default: "まとめて注文OK", maxLength: 28 },
    { key: "bottom_badge_2_desc", label: "bottom_badge2(説明)", maxLength: 60 },
    { key: "bottom_badge_3_title", label: "bottom_badge3(タイトル)", default: "店頭受取", maxLength: 28 },
    { key: "bottom_badge_3_desc", label: "bottom_badge3(説明)", maxLength: 60 },
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

const SEASON_COLOR: Record<string, string> = { 春: '淡いピンク', 夏: '爽やかな水色', 秋: '温かいオレンジ', 冬: '白銀' }
const SEASON_MOTIF: Record<string, string> = { 春: '桜の花びら', 夏: 'ひまわりや涼しげな波', 秋: '紅葉やイチョウ', 冬: '雪の結晶' }

// ══ DESIGN BOX 新規テンプレ11種（飲食・db-food-*）の生成 ══════════════
// 全11種で共通のガードレール（共通ルール sheet「全11テンプレート共通」準拠）。
// 事実の創作を禁止し、見本画像の固定構成を維持させる。
const COMMON_FOOD_GUARDRAILS = [
  '・価格・割引率・期間・営業時間・住所・電話番号・限定数・受賞歴は、入力にないものを絶対に創作しない（該当区画は非表示にする）。',
  '・アップロードされた写真の料理の同一性を保ち、頼まれていないトッピングや別商品に変えない。',
  '・日本語と数字は正確に描画し、文字化け・見切れ・はみ出しを作らない。本文を読めないほど小さくしない。',
  '・見本画像の固定構成（配置・比率・骨格）を維持し、内容と配色だけを入力に合わせて変更する。',
]

interface FoodSpec { title: string; orientation: string; layout: string[]; instruction: string }
const FOOD_TEMPLATE_SPECS: Record<string, FoodSpec> = {
  'db-food-vertical-hero': {
    title: '縦書き商品ヒーロー', orientation: '縦長1080×1350',
    layout: ['見出し：中央上部から縦方向に超大型', '説明：左右に細い縦書き', '写真：中央下部、横幅70〜90%', 'バッジ：写真付近の丸型', '下部：最下部に提供時間と価格'],
    instruction: '縦書き主体の構成、文字スケール、写真位置、左右説明、丸バッジ、下部帯を固定する。横書き中心の構成へ変更しない。',
  },
  'db-food-takeout-dense': {
    title: '情報充実テイクアウトメニュー', orientation: '縦長1080×1350',
    layout: ['ヒーロー：上部左にタイトル、右に主力写真', '主力商品：中上段に2カード', '味・ソース：横一列', 'トッピング：横一列', '注文方法：下段に注文方法と温め方', '下部：最下部に3分割案内'],
    instruction: '情報ブロックの段数と順序を維持し、文章を小さく詰め込まず各上限内に要約する。電話・地図・住所は入力がある場合だけ表示する。',
  },
  'db-food-four-grid': {
    title: '4商品フォトグリッド', orientation: '正方形1080×1080',
    layout: ['写真：上2枚・下2枚の同寸グリッド', '見出し：中央の太い帯', '価格：中央帯で最大級', 'ラベル：各写真上部'],
    instruction: '2×2写真と中央帯の構造を変更しない。4商品が同じ重要度で見えるよう写真サイズを統一する。',
  },
  'db-food-list-menu': {
    title: '写真付き縦型メニュー一覧', orientation: '縦長1080×1350',
    layout: ['タイトル：左上の縦組みまたは短いタイトル', '主役写真：右上の横長写真', 'サムネイル：左列', '一覧：中央〜右に商品名・点線・価格', 'おすすめ：最下部に2商品'],
    instruction: '縦方向の一覧性を優先し、商品名と価格の行位置を揃える。最大数を超える場合は省略せず表示する。',
  },
  'db-food-editorial-brunch': {
    title: 'エディトリアル3品メニュー', orientation: '縦長1080×1350',
    layout: ['メイン商品：上部に3列', '見出し：中央', '追加メニュー：中段2列', '案内：下段2カード', '余白：広い余白を固定'],
    instruction: '余白と整列を最優先し、情報不足時に装飾や文章を勝手に増やさない。3品の写真比率を統一する。',
  },
  'db-food-price-impact': {
    title: '超大型価格キャンペーン', orientation: '正方形1080×1080',
    layout: ['告知：上端', '価格：上半分に超大型・斜め', '期間：価格直下の帯', '対象商品：下段に3分割', '下部：最下部の濃色帯'],
    instruction: '価格を最重要要素として固定し、3商品を同じ幅で配置する。割引・税込表記・期間を入力なしで作らない。',
  },
  'db-food-opening-event': {
    title: 'イラスト付きオープニングイベント', orientation: '縦長1080×1350',
    layout: ['装飾：上部周囲に商品モチーフ', '見出し：上部中央', '開催日：見出し直下', '特典：中央2カード', '特徴：横4個', 'アクセス：最下部'],
    instruction: '友好的な構成を維持する。架空の地図・住所・電話番号を生成しない。商品写真がない場合は一般的な装飾イラストだけ使用する。',
  },
  'db-food-luxury-product': {
    title: '高級スイーツ・プロダクトヒーロー', orientation: '縦長1080×1350',
    layout: ['カテゴリ：左右上端', '見出し：上部に超大型英字', '筆記体：見出しへ重ねる', '写真：中央〜下部に単品', '説明：左下'],
    instruction: '単色背景、大型英字、中央商品という骨格を固定する。ロゴ・URL・架空ブランドを追加しない。商品写真を別商品へ変えない。',
  },
  'db-food-seasonal-shaved-ice': {
    title: '季節の和スイーツ', orientation: '縦長1080×1350',
    layout: ['見出し：上部大型', 'キャッチ：見出し直下', '英字：中央上部の筆記体', '写真：中央下部', '装飾：四隅の和柄', '下部：最下部の白帯'],
    instruction: '和柄の位置と中央商品の構成を維持し、配色と商品内容を変更する。価格・限定表記は入力時のみ使用する。',
  },
  'db-food-ingredient-anatomy': {
    title: '具材解説サンドイッチ', orientation: '正方形1080×1080',
    layout: ['見出し：左上に大型積み上げ', '写真：右から大きくはみ出す', 'ラベル：左に縦並び', '引き出し線：各具材へ水平線'],
    instruction: '写真の断面と具材名を一致させる。写真に存在しない素材を追加しない。大型写真と左ラベルの構成を固定する。',
  },
  'db-food-oversized-photo-type': {
    title: '写真全面＋超大型タイポグラフィ', orientation: '縦長1080×1350',
    layout: ['写真：全面', '見出し：上半分を覆う超大型文字', '地域：見出し直下', 'メッセージ：中段', '営業時間：下部の小型情報'],
    instruction: '写真全面と巨大文字の比率を固定する。文字が料理の主役部分を完全に隠さないようコントラストと改行を調整する。店舗名・地域・営業時間を推測しない。',
  },
}

// 新規飲食テンプレの最終プロンプトを組み立てる（レイアウト＋入力内容＋トーン/配色＋厳守事項）。
function buildFoodPrompt(templateId: string, f: Record<string, string>, hasPhoto: boolean): string {
  const spec = FOOD_TEMPLATE_SPECS[templateId]
  const defs = TEMPLATE_FIELDS[templateId] ?? []
  const tone = (f.tone || '').trim()
  const palette = (f.palette || '').trim()

  const contentLines: string[] = []
  for (const d of defs) {
    if (d.key === 'tone' || d.key === 'palette') continue
    const v = (f[d.key] ?? '').trim()
    if (!v) continue
    if (d.type === 'textarea') {
      const lines = v.split('\n').map(s => s.trim()).filter(Boolean)
      if (!lines.length) continue
      contentLines.push(`・${d.label.replace(/（.*$/, '')}：`)
      for (const ln of lines) contentLines.push(`　- ${ln}`)
    } else {
      contentLines.push(`・${d.label}：「${v}」`)
    }
  }

  return [
    `飲食店向けの「${spec.title}」デザイン(${spec.orientation})を作成してください。添付の見本画像と同じ構成を踏襲します。`,
    '■レイアウト（この構成を厳守。文字は各エリア内に収め、はみ出さないこと）',
    ...spec.layout.map(l => `・${l}`),
    '■内容（下記の入力内容に置き換える。空欄の項目は表示しない）',
    ...(contentLines.length ? contentLines : ['・入力内容に応じて構成する']),
    tone ? `■トーン（雰囲気）：${tone}` : '',
    palette && palette !== 'おまかせ' ? `■配色：${palette}` : '■配色：写真になじむ高コントラストの3色でまとめる',
    '■厳守事項',
    ...COMMON_FOOD_GUARDRAILS,
    `・${spec.instruction}`,
    hasPhoto ? '■添付画像を主役の写真として使用してください（複数枚あれば各区画へ割り当て）。' : '■写真がないため、料理は自然で美味しそうなイメージとして表現してください。',
  ].filter(Boolean).join('\n')
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
  out += '\n\n■重要：上で置き換える文字は、見本の元の文字を残さず完全に差し替えてください（複数行の見出しは全行を置き換える）。上の指示で触れていない文字要素は、見本のサンプル文言（店名・商品名・価格・キャッチ等）をそのまま残さず、空欄にするか自然に削除してください。装飾・イラスト・配色・レイアウトは維持してください。'
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
      NO_ADD, A4,
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
      NO_ADD, A4,
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
      NO_ADD, A4,
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
      NO_ADD, A4,
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
      NO_ADD, A4,
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
      NO_ADD, A4,
    ].filter(Boolean).join('\n')
  }
  return ''
}

// 最終プロンプトを組み立てる。fieldsは mergeFieldDefaults 済み（＝制限適用済み）を想定。
export function buildPrompt(templateId: string, f: Record<string, string>, hasPhoto: boolean): string {
  // 参考画像方式6テンプレ（依頼書）は差し替え指示を返す（参考画像はAPI側で付与）
  if (REFERENCE_TEMPLATE_IDS.has(templateId)) return buildReferencePrompt(templateId, f)
  // 新規飲食テンプレ（db-food-*）は共通ビルダーで生成
  if (FOOD_TEMPLATE_SPECS[templateId]) return buildFoodPrompt(templateId, f, hasPhoto)
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
  // サロン新規オープン告知（高級感・女性向け）
  if (templateId === 'salon-open') {
    const strengths = [f.strength_1 || '駅徒歩5分', f.strength_2 || '完全個室', f.strength_3 || '確かな技術']
    return [
      'サロン・リラクゼーション店の新規オープン告知ポスター(正方形1080×1080)を作成してください。',
      '■背景：上質な内装イメージ（白いカーテン・木製家具・観葉植物・キャンドル）。ベージュ〜グレージュの落ち着いた高級感。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      hasPhoto ? '・中央〜背景：添付の写真（施術やサロン内観）を上品に配置' : '・中央：施術やくつろぎのイメージを上品に配置',
      `・右上：丸型ロゴバッジにサロン名「${f.store_name}」`,
      f.catch_copy ? `・左上：キャッチコピー「${f.catch_copy}」` : '',
      `・右側：円形バッジ3つに強み「${strengths[0]}」「${strengths[1]}」「${strengths[2]}」`,
      `・左下：超大型文字「OPEN」${f.open_date ? `＋オープン日「${f.open_date}」` : ''}`,
      f.offer ? `・オレンジの角丸バッジ：オープン特典「${f.offer}」` : '',
      f.tel ? `・下部：ご予約「${f.tel}」＋予約QRアイコン` : '',
      '■デザイン：フォント=英字はセリフ細字、日本語は明朝系、数字は極太。カラー=ベージュ・グレージュ・オレンジ（アクセント）・ホワイト。上質・非日常・女性向けリラクゼーション。',
      '■日本語の文字は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をサロンのイメージ写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // エステ・サロン 集客キャンペーン（清潔感・女性向け）
  if (templateId === 'esthe-campaign') {
    const reasons = [f.feature_1 || '完全個室', f.feature_2 || '経験豊富な担当者', f.feature_3 || 'オーダーメイド施術']
    const price = (f.regular_price && f.special_price)
      ? `通常${f.regular_price}円 → 特別${f.special_price}円`
      : (f.special_price ? `特別価格 ${f.special_price}円` : '')
    return [
      'エステサロンの集客・キャンペーン告知ポスター(正方形1080×1080)を作成してください。',
      '■背景：フェイシャル施術を受ける女性のイメージ＋やわらかいピンク〜ベージュゴールドの単色。清潔感と上質感。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      hasPhoto ? '・上部：添付の写真（施術・サロン）を大きく配置' : '・上部：フェイシャル施術のイメージを大きく配置',
      `・中央：メインキャッチ「${f.main_catch}」（大きく上品に）`,
      `・サロン名帯：「${f.store_name}」`,
      `・アイコン3点：選ばれる理由「${reasons[0]}」「${reasons[1]}」「${reasons[2]}」`,
      f.course_name ? `・キャンペーン帯：「初めての方限定」＋コース名「${f.course_name}」` : '・キャンペーン帯：「初めての方限定」',
      price ? `・価格：${price}（特別価格を大きく強調）` : '',
      '■デザイン：フォント=見出しは丸ゴシック太字、英字ロゴはセリフ細字。カラー=ピンク／ベージュ・ゴールド系。上質・清潔感・女性向け・信頼感。',
      '■日本語と数字（価格）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を施術イメージ写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // お持ち帰りメニュー表（情報整理型・和モダン）
  if (templateId === 'takeout-menu') {
    const menuLines = (f.menu_items || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 8)
      .map(l => {
        const p = l.split(/\s+/)
        return p.length >= 2 ? `・${p.slice(0, -1).join(' ')} … ${p[p.length - 1]}` : `・${l}`
      }).join('\n')
    return [
      'テイクアウト店向けのお持ち帰りメニュー表(正方形1080×1080)を作成してください。',
      '■背景：白〜薄いクリーム。上部にネイビーの帯。和モダンで清潔感のある情報整理型。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上部ネイビー帯：タイトル「${f.title || 'お持ち帰りメニュー'}」（白文字）＋右上に「※全て税込価格」`,
      f.business_hours ? `・営業時間：「${f.business_hours}」` : '',
      menuLines ? `・中央：商品名（左）＋点線＋価格（右）で整然と並べる：\n${menuLines}` : '',
      f.special ? `・人気商品に赤バッジ「${f.special}」` : '',
      hasPhoto ? '・右側または各項目に添付の商品写真を配置' : '',
      f.note ? `・最下部：注記「${f.note}」` : '',
      '■デザイン：フォント=明朝体＋ゴシック体ミックス。カラー=ネイビー・白・赤（バッジ）・クリーム。読みやすく整理された和モダン・テイクアウト感。',
      '■日本語と数字（商品名・価格）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像を商品写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // お弁当メニュー（和風・高級感／テイクアウト）
  if (templateId === 'bento-menu') {
    const menuLines = (f.menu_items || '')
      .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5)
      .map(l => `・${l}`).join('\n')
    return [
      'お弁当・テイクアウト店向けの和風メニュー表(正方形1080×1080)を作成してください。',
      '■背景：黒〜濃い色の落ち着いた背景。金と赤茶のアクセントで和の高級感。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・左上：筆文字風の店名「${f.store_name}」${f.title ? `＋「${f.title}」` : ''}`,
      hasPhoto ? '・中央〜右：添付のお弁当写真を美味しそうに配置' : '・中央〜右：お弁当を美味しそうに配置',
      menuLines ? `・各商品：商品名／価格（円・税込）／説明を整理して表示：\n${menuLines}` : '',
      f.note ? `・補足テキスト：「${f.note}」` : '',
      f.tel ? `・最下部帯：ご注文「${f.tel}」＋注文QRアイコン` : '',
      '■デザイン：フォント=店名は筆文字風、メニュー名はゴシック太字、価格は赤系ボックス。カラー=黒・金・赤茶。和の高級感・食欲をそそる。',
      '■日本語と数字（商品名・価格）は正確に描画し、指定以外の文字や見切れは入れないこと。',
      hasPhoto ? '■添付画像をお弁当の写真として使用してください。' : '',
    ].filter(Boolean).join('\n')
  }
  // LINE友だち登録案内（操作手順つき）
  if (templateId === 'line-friend-guide') {
    return [
      'LINE公式アカウントの友だち登録案内(正方形1080×1080)を作成してください。',
      '■背景：上段はLINEグリーンの帯、下段は白＋山・家・木などのフラットイラスト。親しみやすく分かりやすい。',
      '■配置（この配置を厳守。文字は各エリア内に収め、はみ出さないこと）',
      `・上段中央：大見出し「LINE公式アカウント」＋ID「${f.account_id}」`,
      `・上段右：吹き出しバッジ「${f.benefit_text || 'お得な情報やクーポンをGET！'}」`,
      `・帯見出し：「${f.cta || '友だち登録募集中！'}」`,
      '・中段左：友だち追加の手順を2つ、丸番号付きで説明：',
      `　→ 手順1「QRコードで登録」：${f.step1_desc || '「友だち追加」→「QRコード」から読み取る'}`,
      `　→ 手順2「ID検索で登録」：${f.step2_desc || '「友だち追加」→「検索」でIDを入力'}`,
      hasPhoto ? '・中段右：スマホ画面のモックアップ内に添付のQRコードを配置' : '・中段右：スマホ画面のモックアップ内にQRコード枠を配置',
      f.store_name ? `・最下部：店名「${f.store_name}」` : '',
      '■デザイン：フォント=見出しは太字ゴシック、重要部分は黄色マーカー風。カラー=LINEグリーン＋白＋黄色アクセント。親しみやすくシンプルな操作案内。',
      '■日本語・記号（LINE ID）は正確に描画し、指定以外の文字や見切れは入れないこと。',
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
  // ★混線防止：ベーステンプレは各々「■背景」「■デザイン（配色・フォント）」を固定で持つ。
  //   これを残したままパンフレット統一トーンを足すと、テンプレ固有色と統一トーンが同一
  //   プロンプト内で衝突し、ページごとに世界観がバラつく（＝他のデザインが混ざる）。
  //   そこでベースからは配色・背景・装飾・フォントの指定行を取り除き、レイアウト（■配置）と
  //   文字の正確性・写真の扱いだけを残す。見た目の統一は下記トーンに一本化する。
  const layoutOnly = base
    .split('\n')
    .filter(line => !/^■\s*(背景|デザイン)[：:]/.test(line))
    .join('\n')
  return [
    layoutOnly,
    '',
    '━━ パンフレット統一デザイン指定（全ページ共通・レイアウト以外はこの指定だけに従う）━━',
    `■これは「${ctx.storeName || 'お店'}」のご案内パンフレット 全${ctx.totalPages}ページのうち ${ctx.pageNo}ページ目です。全ページで背景・配色・フォント・装飾を完全に統一し、シリーズとして違和感のない見た目にしてください。`,
    ...(ctx.size ? [`■出力サイズ：${ctx.size} に統一（全ページ同じサイズ・アスペクト比で作成すること）。`] : []),
    `■背景：${t.bg}（全ページ共通。ページごとに背景色や雰囲気を変えないこと）`,
    `■装飾：${t.decoration}`,
    `■フォント：${t.font}`,
    `■配色：${t.palette}（この配色のみを使用し、他の色調は混ぜないこと）`,
    `■左上に「${ctx.pageNo}/${ctx.totalPages}」のページ番号バッジ（${t.badge}）を必ず配置。`,
    '■上記の背景・配色・フォント・装飾は全ページで厳密に統一する。各ページで用いるのは「■配置」のレイアウト指示のみとし、配色・背景の解釈をページごとに変えないこと。',
  ].join('\n')
}
