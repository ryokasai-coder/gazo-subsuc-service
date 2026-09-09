'use client'

import { useState, useCallback, useEffect } from 'react'
import { TemplatePreview } from '@/components/ui/TemplatePreview'
import { DesignCanvas } from '@/components/ui/DesignCanvas'
import { createClient } from '@/lib/supabase'
import { TEMPLATE_FIELDS, buildPrompt, mergeFieldDefaults } from '@/lib/design-prompts'

// 1依頼あたりのAI生成回数の上限（初回1＋作り直し2＝計3回）
const MAX_GENERATIONS = 3

const STEPS = ['テンプレート選択', '詳細入力', 'プレビュー・納品']

const DESIGN_FILTERS = ['高級感', 'シンプル', 'インパクト', 'SNS映え', 'かわいい', 'ナチュラル']

const IMAGE_SIZES = [
  { label: '正方形 (1080×1080)', value: '正方形(1080x1080px)' },
  { label: '縦長 (1080×1350)', value: '縦長(1080x1350px)' },
  { label: 'ストーリーズ (1080×1920)', value: 'ストーリーズ(1080x1920px)' },
  { label: '横長 (1200×628)', value: '横長(1200x628px)' },
]

const DELIVERY_SPEEDS = [
  { label: '通常（3営業日以内）', value: '通常' },
  { label: 'お急ぎ（要相談）', value: 'お急ぎ' },
  { label: '特に希望なし', value: '特に希望なし' },
]

// ─── テンプレート定義 ──────────────────────────────────────────────
export interface Template {
  id: string
  name: string
  description: string
  layoutType: string
  bgFrom: string
  bgTo: string
  productionTags: string[]
  designTags: string[]
  referenceImage?: string  // 参考画像（画像プロンプト集の実例サムネ）
  sampleUses?: string      // このテンプレで作れる画像の具体例
  hidden?: boolean         // 選択画面に出さない（後継テンプレに置き換えた旧テンプレ等）。定義は互換のため残す
}

// ─── テンプレート定義（画像プロンプト・参考画像 集 準拠） ───
// 旧テンプレート群は全廃。プロンプト①の7マスター＋プロンプト②(カフェ・飲食)の
// 具体例を統合した全11種に統一。各テンプレは同集の対応デザイン（参考画像）と紐づき、
// layoutTypeはDesignCanvas（顧客が作成した画像がそのまま納品される）の対応レイアウトに対応。
const TEMPLATES: Template[] = [
  // ★運用ルール: 新しく追加したテンプレは「上位（配列の先頭）」に置く。
  //   新規テンプレは、直下の参考画像ブロックの先頭に追記すること。
  // ══ 参考画像方式テンプレ（正典 = docs/AI画像生成プロンプト集_マスター.md・全26種）══
  // 参考画像(Image 1)＋顧客写真(Image 2..N)をGeminiへ渡し、テイストを保ったまま差し替え生成する。
  // ── 参考画像方式 07〜26（2026-09-09 追加）。参考画像=Image 1、顧客写真/QR/ロゴ=Image 2..N ──
  {
    id: 'ramen_main', name: 'ラーメン店 メインチラシ',
    description: 'こだわり・人気メニュー・お客様の声・LINEクーポンまで一枚に。写真5枚＋QRを差し替え。',
    sampleUses: 'ラーメン店の集客チラシ・新メニュー告知・来店促進',
    layoutType: 'shop-hero', bgFrom: '#7a1f1f', bgTo: '#3a0f0f',
    referenceImage: '/templates/tpl-ramen_main.jpg',
    productionTags: ['商品ヒーロー訴求', 'クーポン告知', '新規オープン告知'],
    designTags: ['インパクト', '高級感', 'お任せ'],
  },
  {
    id: 'line_benefits', name: 'LINE友だち追加 3特典',
    description: '3つの特典と3ステップ登録案内でLINE友だちを増やす。QRコードを差し込み。',
    sampleUses: 'LINE友だち登録促進・クーポン配布・リピート促進',
    layoutType: 'steps-3', bgFrom: '#22c55e', bgTo: '#16a34a',
    referenceImage: '/templates/tpl-line_benefits.jpg',
    productionTags: ['LINE登録促進', 'クーポン告知'],
    designTags: ['かわいい', 'シンプル', 'お任せ'],
  },
  {
    id: 'sns_annotation', name: '手描き風 料理写真ポスト',
    description: '料理写真に手描き風の吹き出しコメントを添えたSNS映えデザイン。写真1枚を差し替え。',
    sampleUses: 'SNS投稿・料理の魅力訴求・メニュー紹介',
    layoutType: 'photo-overlay', bgFrom: '#d97706', bgTo: '#92400e',
    referenceImage: '/templates/tpl-sns_annotation.jpg',
    productionTags: ['商品ヒーロー訴求'],
    designTags: ['SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'calendar', name: '営業カレンダー',
    description: '桜モチーフの営業カレンダー。限定メニュー写真と特典タグを差し替え。',
    sampleUses: '月間営業カレンダー・定休日案内・限定メニュー予告',
    layoutType: 'calendar', bgFrom: '#f9c9d4', bgTo: '#f4b6c2',
    referenceImage: '/templates/tpl-calendar.jpg',
    productionTags: ['イベント告知'],
    designTags: ['かわいい', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'recommend_menu', name: 'おすすめメニュー（リーフ柄）',
    description: 'リーフ柄のナチュラルなおすすめメニュー。メイン＋サブ3品の写真を差し替え。',
    sampleUses: 'おすすめメニュー・季節メニュー・カフェメニュー',
    layoutType: 'menu-list', bgFrom: '#4d7c4d', bgTo: '#2f5130',
    referenceImage: '/templates/tpl-recommend_menu.jpg',
    productionTags: ['グランドメニュー表', '商品ヒーロー訴求'],
    designTags: ['ナチュラル', 'シンプル', 'お任せ'],
  },
  {
    id: 'spring_sale', name: '春の感謝祭セール',
    description: '桜柄のセール告知。割引率・期間・対象商品3品を差し替え。',
    sampleUses: '期間限定セール・割引キャンペーン・周年感謝祭',
    layoutType: 'color-text', bgFrom: '#f472b6', bgTo: '#db2777',
    referenceImage: '/templates/tpl-spring_sale.jpg',
    productionTags: ['キャンペーン・セール告知', 'クーポン告知'],
    designTags: ['かわいい', 'インパクト', 'お任せ'],
  },
  {
    id: 'single_item_dark', name: '単品広告（黒背景）',
    description: '黒背景×金の高級感ある単品広告。商品写真1枚と特徴3点を差し替え。',
    sampleUses: '看板商品の訴求・高級商品の広告・単品プロモーション',
    layoutType: 'single-product', bgFrom: '#1a1a1a', bgTo: '#2d2416',
    referenceImage: '/templates/tpl-single_item_dark.jpg',
    productionTags: ['商品ヒーロー訴求'],
    designTags: ['高級感', 'インパクト', 'お任せ'],
  },
  {
    id: 'smoothie_single', name: 'スムージー単品訴求',
    description: '水しぶき演出の映えるスムージー広告。商品写真＋（任意で）ロゴを差し替え。',
    sampleUses: '新作ドリンク訴求・季節限定スムージー・カフェ新商品',
    layoutType: 'single-product', bgFrom: '#fbbf24', bgTo: '#f59e0b',
    referenceImage: '/templates/tpl-smoothie_single.jpg',
    productionTags: ['商品ヒーロー訴求', 'キャンペーン・セール告知'],
    designTags: ['SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'smoothie_trio', name: 'スムージー3種展開',
    description: '3種のスムージーを並べた訴求デザイン。3枚の写真を左から差し替え。',
    sampleUses: '複数フレーバー訴求・新作3種・ラインナップ紹介',
    layoutType: 'menu-grid', bgFrom: '#fb923c', bgTo: '#ea580c',
    referenceImage: '/templates/tpl-smoothie_trio.jpg',
    productionTags: ['商品ヒーロー訴求', 'グランドメニュー表'],
    designTags: ['SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'veggie_focaccia_poster', name: 'フォカッチャ英語ポスター',
    description: '大きな英語見出しと写真を組み合わせた洗練ポスター。商品写真1枚を差し替え。',
    sampleUses: 'カフェ・ベーカリーの商品ポスター・英語デザイン訴求',
    layoutType: 'shop-hero', bgFrom: '#0d9488', bgTo: '#115e59',
    referenceImage: '/templates/tpl-veggie_focaccia_poster.jpg',
    productionTags: ['商品ヒーロー訴求'],
    designTags: ['ナチュラル', 'SNS映え', 'シンプル', 'お任せ'],
  },
  {
    id: 'ingredient_diagram_sandwich', name: '具材ラベル図解',
    description: '断面写真に引き出し線で具材を解説する図解デザイン。断面写真1枚を差し替え。',
    sampleUses: 'サンドイッチ・バーガー等の具材訴求・こだわり紹介',
    layoutType: 'single-product', bgFrom: '#fde68a', bgTo: '#f5d76e',
    referenceImage: '/templates/tpl-ingredient_diagram_sandwich.jpg',
    productionTags: ['商品ヒーロー訴求'],
    designTags: ['シンプル', 'SNS映え', 'お任せ'],
  },
  {
    id: 'strawberry_milk_kakigori', name: '苺みるくかき氷',
    description: '和柄×毛筆の季節スイーツ訴求。商品写真1枚を差し替え。',
    sampleUses: '季節限定かき氷・和スイーツ・夏メニュー訴求',
    layoutType: 'single-product', bgFrom: '#f9a8d4', bgTo: '#be185d',
    referenceImage: '/templates/tpl-strawberry_milk_kakigori.jpg',
    productionTags: ['商品ヒーロー訴求', 'キャンペーン・セール告知'],
    designTags: ['かわいい', '高級感', 'お任せ'],
  },
  {
    id: 'strawberry_pistachio_crepe', name: 'ストロベリーピスタチオクレープ',
    description: '紺色背景の上品なスイーツ訴求。商品写真1枚を差し替え。',
    sampleUses: 'クレープ・スイーツ新作・季節限定デザート',
    layoutType: 'single-product', bgFrom: '#1e3a5f', bgTo: '#0f2038',
    referenceImage: '/templates/tpl-strawberry_pistachio_crepe.jpg',
    productionTags: ['商品ヒーロー訴求'],
    designTags: ['高級感', 'SNS映え', 'お任せ'],
  },
  {
    id: 'bakery_opening_day', name: 'ベーカリーOPEN告知（イラスト）',
    description: '手描き風イラストのOPEN告知。写真は使わず、業種に合わせてイラスト題材と文字を差し替え。',
    sampleUses: 'ベーカリー・カフェ・洋菓子店などの開店告知',
    layoutType: 'shop-hero', bgFrom: '#fcd9b6', bgTo: '#f6b98a',
    referenceImage: '/templates/tpl-bakery_opening_day.jpg',
    productionTags: ['新規オープン告知', 'イベント告知'],
    designTags: ['かわいい', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'new_open_690_campaign', name: 'NEW OPEN 690円均一',
    description: '筆文字風の大きな価格が映える均一キャンペーン。対象商品3枚を差し替え。',
    sampleUses: '新規オープン記念・均一価格キャンペーン・期間限定フェア',
    layoutType: 'color-text', bgFrom: '#1e3a5f', bgTo: '#84cc16',
    referenceImage: '/templates/tpl-new_open_690_campaign.jpg',
    productionTags: ['新規オープン告知', 'キャンペーン・セール告知'],
    designTags: ['インパクト', 'かわいい', 'お任せ'],
  },
  {
    id: 'weekend_brunch_plate', name: '週末ブランチ 選べるプレート',
    description: 'ナチュラルな罫線レイアウトのブランチメニュー。3品の写真を差し替え。',
    sampleUses: '週末限定メニュー・カフェランチ・選べるプレート',
    layoutType: 'menu-list', bgFrom: '#e8dcc8', bgTo: '#cdbb9a',
    referenceImage: '/templates/tpl-weekend_brunch_plate.jpg',
    productionTags: ['グランドメニュー表', '商品ヒーロー訴求'],
    designTags: ['ナチュラル', 'シンプル', 'お任せ'],
  },
  {
    id: 'yakitori_menu', name: '炭火串焼き MENU',
    description: '和風の串焼きメニュー表。集合写真＋各串＋〆物の写真を差し替え。',
    sampleUses: '焼き鳥・串焼き店のメニュー表・居酒屋メニュー',
    layoutType: 'menu-list', bgFrom: '#2a2118', bgTo: '#4a3826',
    referenceImage: '/templates/tpl-yakitori_menu.jpg',
    productionTags: ['グランドメニュー表'],
    designTags: ['高級感', 'シンプル', 'お任せ'],
  },
  {
    id: 'colorful_bowl_lunch', name: '選べる彩りボウル',
    description: 'カラフルな4分割のランチメニュー。4品の写真を差し替え。',
    sampleUses: 'ランチ限定ボウル・デリ・ヘルシーメニュー訴求',
    layoutType: 'menu-grid', bgFrom: '#f97316', bgTo: '#e11d48',
    referenceImage: '/templates/tpl-colorful_bowl_lunch.jpg',
    productionTags: ['グランドメニュー表', '商品ヒーロー訴求'],
    designTags: ['SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'teppan_gyoza_menu', name: '鉄板ぎょうざメニュー',
    description: '餃子の種類・タレ・トッピング・持ち帰りの流れまで網羅。メイン写真1枚を差し替え。',
    sampleUses: '餃子店メニュー・テイクアウト案内・こだわり訴求',
    layoutType: 'menu-list', bgFrom: '#166534', bgTo: '#1e3a5f',
    referenceImage: '/templates/tpl-teppan_gyoza_menu.jpg',
    productionTags: ['お持ち帰りメニュー表', 'グランドメニュー表'],
    designTags: ['シンプル', '高級感', 'お任せ'],
  },
  {
    id: 'charcoal_saba_ju', name: '炭火香るさば重',
    description: '水色背景×筆文字の和の単品訴求。商品写真1枚を差し替え。',
    sampleUses: '和食の看板商品・季節限定重・ランチ訴求',
    layoutType: 'single-product', bgFrom: '#a5d8e6', bgTo: '#5b9bb0',
    referenceImage: '/templates/tpl-charcoal_saba_ju.jpg',
    productionTags: ['商品ヒーロー訴求', 'キャンペーン・セール告知'],
    designTags: ['高級感', 'ナチュラル', 'お任せ'],
  },
  // ── 参考画像方式 01〜06（先行6種・2026-09-02追加）──
  {
    id: 'spa_open',
    name: 'スパ&マッサージ OPEN告知',
    description: '上質な参考デザインをもとに、サロン名・特典・OPEN日を差し替えて開店告知を制作。',
    sampleUses: 'スパ＆マッサージOPEN・リラクゼーション開店・新規オープン記念',
    layoutType: 'shop-hero',
    bgFrom: '#e9c9d4', bgTo: '#d8b8a8',
    referenceImage: '/templates/tpl-spa-open.jpg',
    productionTags: ['新規オープン告知', 'イベント告知'],
    designTags: ['高級感', 'かわいい', 'お任せ'],
  },
  {
    id: 'yakiniku_bento',
    name: '焼肉弁当メニュー',
    description: '和の高級感ある参考デザインをもとに、商品名・価格・店舗情報を差し替えて弁当メニューを制作。',
    sampleUses: '焼肉弁当・宅配弁当・仕出し弁当メニュー',
    layoutType: 'menu-list',
    bgFrom: '#1a1a1a', bgTo: '#3d2b1f',
    referenceImage: '/templates/tpl-yakiniku-bento.jpg',
    productionTags: ['お持ち帰りメニュー表', '商品ヒーロー訴求'],
    designTags: ['高級感', 'シンプル', 'お任せ'],
  },
  {
    id: 'takeout_bento',
    name: 'テイクアウト弁当メニュー',
    description: '手作り感のある参考デザインをもとに、6品の商品・価格・店舗情報を差し替えて制作。',
    sampleUses: 'お持ち帰り弁当・惣菜テイクアウト・日替わり弁当',
    layoutType: 'menu-list',
    bgFrom: '#f0e6d2', bgTo: '#e2d0b0',
    referenceImage: '/templates/tpl-takeout-bento.jpg',
    productionTags: ['お持ち帰りメニュー表', 'グランドメニュー表'],
    designTags: ['ナチュラル', 'シンプル', 'お任せ'],
  },
  {
    id: 'esthe_pink',
    name: 'エステ集客（ピンク）',
    description: '清潔感のあるピンクの参考デザインをもとに、体験コース・特別価格・選ばれる理由を差し替えて制作。',
    sampleUses: 'フェイシャルエステ体験・初回限定キャンペーン・サロン集客',
    layoutType: 'color-text',
    bgFrom: '#f9c9d4', bgTo: '#f4b6c2',
    referenceImage: '/templates/tpl-esthe-pink.jpg',
    productionTags: ['キャンペーン・セール告知', 'クーポン告知', '新規オープン告知'],
    designTags: ['かわいい', '高級感', 'お任せ'],
  },
  {
    id: 'esthe_gold',
    name: 'エステ集客（ゴールド）',
    description: '高級感のあるゴールドの参考デザインをもとに、体験コース・3つのコース料金を差し替えて制作。',
    sampleUses: 'エステ・痩身サロン集客・コース料金案内・体験キャンペーン',
    layoutType: 'color-text',
    bgFrom: '#e6d3a3', bgTo: '#c9a86a',
    referenceImage: '/templates/tpl-esthe-gold.jpg',
    productionTags: ['キャンペーン・セール告知', 'クーポン告知'],
    designTags: ['高級感', 'シンプル', 'お任せ'],
  },
  {
    id: 'line_guide',
    name: 'LINE公式 友だち登録案内',
    description: '親しみやすい参考デザインをもとに、LINE ID・訴求文・会社名を差し替え、QRコードを差し込んで制作。',
    sampleUses: 'LINE友だち登録案内・公式アカウント登録手順・お得情報の案内',
    layoutType: 'steps-3',
    bgFrom: '#22c55e', bgTo: '#4ade80',
    referenceImage: '/templates/tpl-line-guide.jpg',
    productionTags: ['LINE登録促進'],
    designTags: ['シンプル', 'かわいい', 'お任せ'],
  },
]

// テンプレ別の素材アップロード欄のラベル・説明。未定義なら汎用ラベル。
// needed: false のテンプレ（カレンダー等）はアップロード欄自体を非表示にする。
const MATERIAL_UPLOAD: Record<string, { label: string; hint: string; needed?: boolean }> = {
  // ── 参考画像方式6テンプレ（依頼書）。顧客画像=Image 2 は差し替えの主役なので必須 ──
  'spa_open':       { label: 'メイン写真アップロード（必須）', hint: '参考デザインの中央写真と差し替えます（施術・サロン内観など）' },
  'yakiniku_bento': { label: 'お弁当写真アップロード（必須）', hint: '参考デザインの一番大きい弁当写真と差し替えます' },
  'takeout_bento':  { label: 'お弁当写真アップロード（必須）', hint: '参考デザインの一番目立つ写真タイルと差し替えます' },
  'esthe_pink':     { label: '施術イメージ写真アップロード（必須）', hint: '参考デザインのメイン施術写真と差し替えます' },
  'esthe_gold':     { label: '施術イメージ写真アップロード（必須）', hint: '参考デザインのメイン施術写真と差し替えます' },
  'line_guide':     { label: 'QRコード画像アップロード（必須）', hint: 'LINE友だち追加用のQRコード画像を1枚。参考デザインのQR部分と差し替えます' },
  // ── 参考画像方式 07〜26。撮影/添付は「スロット順」に並べてアップロード（先頭がImage 2）──
  'ramen_main':      { label: 'メニュー写真（5枚）＋LINEクーポンQR（必須）', hint: '順番に：①中央の丼 ②③④人気メニュー3品 ⑤店舗外観、最後にLINEクーポンQR画像。計6枚をこの順で添付' },
  'line_benefits':   { label: 'QRコード画像アップロード（必須）', hint: 'LINE友だち追加用のQRコード画像を1枚' },
  'sns_annotation':  { label: '料理写真アップロード（必須・1枚）', hint: '主役の料理写真を1枚。吹き出しコメントは入力欄で調整' },
  'calendar':        { label: '限定メニュー写真（任意・1枚）', hint: '左上に載せる限定メニュー写真があれば1枚' },
  'recommend_menu':  { label: '商品写真（4枚）', hint: '順番に：①メイン ②③④サブ3品。計4枚をこの順で添付' },
  'spring_sale':     { label: '商品写真（4枚）', hint: '順番に：①メインの大きい写真 ②③④対象商品3品。計4枚をこの順で添付' },
  'single_item_dark':{ label: '商品写真アップロード（必須・1枚）', hint: '主役の商品写真を1枚' },
  'smoothie_single': { label: '商品写真（必須・1枚）＋ロゴ（任意）', hint: 'スムージーのカップ写真を1枚。ロゴを使う場合は入力欄で「ロゴ画像を使う=true」にして2枚目にロゴ画像を添付' },
  'smoothie_trio':   { label: 'スムージー写真（3枚・左から順）', hint: '左・中央・右の順で3枚を添付' },
  'veggie_focaccia_poster': { label: '商品写真アップロード（必須・1枚）', hint: 'サンドイッチ＋副菜など主役写真を1枚' },
  'ingredient_diagram_sandwich': { label: '断面が分かる商品写真（必須・1枚）', hint: '具材の重なりが見える断面写真を1枚' },
  'strawberry_milk_kakigori': { label: '商品写真アップロード（必須・1枚）', hint: 'かき氷の写真を1枚' },
  'strawberry_pistachio_crepe': { label: '商品写真アップロード（必須・1枚）', hint: 'クレープの写真を1枚' },
  'bakery_opening_day': { label: '写真は不要（イラストで制作）', hint: 'このテンプレは実写を使いません。業種・イラスト題材・文言は入力欄で指定' },
  'new_open_690_campaign': { label: '商品写真（3枚・左から順）', hint: '左・中央・右の順で対象商品3枚を添付' },
  'weekend_brunch_plate': { label: '料理写真（3枚・左から順）', hint: '1品目・2品目・3品目の順で3枚を添付' },
  'yakitori_menu':   { label: '写真（8枚・スロット順）', hint: '順番に：①串焼き集合 ②もも ③つくね ④ささみ ⑤うずら玉子 ⑥しいたけ ⑦鶏だし茶漬け ⑧焼きおにぎり。計8枚をこの順で添付' },
  'colorful_bowl_lunch': { label: '料理写真（4枚）', hint: '順番に：①左上 ②右上 ③左下 ④右下。計4枚をこの順で添付' },
  'teppan_gyoza_menu': { label: 'メイン写真アップロード（必須・1枚）', hint: '鉄板ぎょうざのメイン写真を1枚' },
  'charcoal_saba_ju': { label: '商品写真アップロード（必須・1枚）', hint: 'さば重の商品写真を1枚' },
}

function getFilteredTemplates(designFilter: string): Template[] {
  // デザインイメージ未選択なら全テンプレ表示。選択時はそのタグを持つテンプレのみに絞る。
  // hidden（後継に置き換えた旧テンプレ）は常に選択画面から除外する。
  const visible = TEMPLATES.filter(t => !t.hidden)
  if (!designFilter) return visible
  return visible.filter(t => t.designTags.includes(designFilter))
}

export interface RequestFormData {
  production_types: string[]
  production_types_other: string
  production_purpose: string[]
  design_image: string
  template_id: string
  template_name: string
  target: string
  media_types: string[]
  image_size: string
  custom_size: string
  text_content: string
  material_urls: string[]
  reference_urls: string[]
  cta_action: string
  delivery_speed: string
  other_requests: string
  materialFiles: File[]
  referenceFiles: File[]
  template_fields: Record<string, string>  // AI生成テンプレの入力欄値
}

interface Props {
  onSubmit: (data: RequestFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const initial: RequestFormData = {
  production_types: [],
  production_types_other: '',
  production_purpose: [],
  design_image: '',
  template_id: '',
  template_name: '',
  target: '',
  media_types: [],
  image_size: '',
  custom_size: '',
  text_content: '',
  material_urls: [],
  reference_urls: [],
  cta_action: '',
  delivery_speed: '通常',
  other_requests: '',
  materialFiles: [],
  referenceFiles: [],
  template_fields: {},
}

// ─── UIコンポーネント（関数の外に定義 ─────────────────────────────────
// ★ここがバグ修正の核心：Fieldをメインコンポーネントの外に置くことで
//   stateが変わるたびにremountされなくなる
function Field({ label, required, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#111111] mb-2">
        {label} {required && <span className="text-[#E85C97]">*</span>}
      </label>
      {children}
    </div>
  )
}


function TemplateCard({ template, selected, onSelect }: {
  template: Template
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all hover:shadow-md ${
        selected
          ? 'border-[#E85C97] shadow-lg shadow-red-100 scale-[1.02]'
          : 'border-[#EFEFEF] hover:border-[#E85C97]/50'
      }`}
    >
      <div className="relative">
        {template.referenceImage ? (
          // 参考画像（画像プロンプト集の実例）。「こんな画像が作れます」を実物で提示
          <div className="relative aspect-square overflow-hidden bg-[#F8F8FA]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={template.referenceImage}
              alt={`${template.name}の参考デザイン`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
              制作イメージ
            </span>
          </div>
        ) : (
          <TemplatePreview
            layoutType={template.layoutType}
            bgFrom={template.bgFrom}
            bgTo={template.bgTo}
          />
        )}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-[#E85C97] rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
            ✓
          </div>
        )}
      </div>
      <div className="p-3 bg-white">
        <p className="text-xs font-black text-[#111111] leading-tight mb-1">{template.name}</p>
        <p className="text-[10px] text-[#6B7280] leading-snug">{template.description}</p>
        {template.sampleUses && (
          <p className="text-[10px] text-[#E85C97] leading-snug mt-1.5 font-medium">
            例：{template.sampleUses}
          </p>
        )}
      </div>
    </button>
  )
}

// ─── メインフォーム ───────────────────────────────────────────────────
export default function ImageRequestForm({ onSubmit, onCancel, loading }: Props) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  // 登録済みの店舗情報（店名・電話・住所）。テンプレの{store_name}/{tel}/{address}へ自動プリフィルする
  const [storeInfo, setStoreInfo] = useState<{ company_name: string; phone: string; address: string } | null>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setAccessToken(session?.access_token ?? null)
      if (!session) return
      // 店舗情報を取得しておき、テンプレ選択時に対応フィールドへ自動プリフィルする
      const { data } = await supabase
        .from('users')
        .select('company_name, phone, address')
        .eq('id', session.user.id)
        .single()
      if (data) setStoreInfo({
        company_name: data.company_name ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
      })
    })
  }, [])
  const [form, setForm] = useState<RequestFormData>(initial)
  const [error, setError] = useState('')

  // 登録済み店舗情報を、選択テンプレの{store_name}/{tel}/{address}へ自動プリフィルする
  // （未入力の欄のみ・お客様の入力は上書きしない）。テンプレ選択→詳細入力へ進む時に呼ぶ。
  const applyStorePrefill = (templateId: string) => {
    if (!storeInfo || !templateId) return
    const fields = TEMPLATE_FIELDS[templateId]
    if (!fields) return
    const map: Record<string, string> = {
      store_name: storeInfo.company_name,
      tel: storeInfo.phone,
      address: storeInfo.address,
    }
    setForm(prev => {
      const nextFields = { ...prev.template_fields }
      let changed = false
      for (const f of fields) {
        const val = map[f.key]
        if (val && !(nextFields[f.key] ?? '').trim()) { nextFields[f.key] = val; changed = true }
      }
      return changed ? { ...prev, template_fields: nextFields } : prev
    })
  }
  const [designFilter, setDesignFilter] = useState('')
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null)
  const [delivering, setDelivering] = useState(false)
  const [deliverResult, setDeliverResult] = useState<{ driveUrl: string; previewUrl: string } | null>(null)
  // ─── AI生成（期間限定バナー等）─────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [generationCount, setGenerationCount] = useState(0) // この依頼で生成した回数（最大MAX_GENERATIONS）

  const update = <K extends keyof RequestFormData>(key: K, val: RequestFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // AI生成テンプレの入力欄を1つ更新
  const updateField = (fieldKey: string, val: string) => {
    setForm(prev => ({ ...prev, template_fields: { ...prev.template_fields, [fieldKey]: val } }))
  }

  const filteredTemplates = getFilteredTemplates(designFilter)

  const selectedTemplate = TEMPLATES.find(t => t.id === form.template_id)
  // 入力欄定義があるテンプレ = AI生成テンプレ（全テンプレ対応済み）。無ければ従来のDesignCanvas。
  const templateFields = TEMPLATE_FIELDS[form.template_id]
  const isAITemplate = !!templateFields

  const handleCanvasGenerated = useCallback((dataUrl: string) => {
    setCanvasDataUrl(dataUrl)
  }, [])

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })

  // AIで画像を生成（初回＋作り直し。上限MAX_GENERATIONS）
  const handleGenerate = async () => {
    if (generationCount >= MAX_GENERATIONS) return
    setGenerating(true)
    setError('')
    try {
      const merged = mergeFieldDefaults(form.template_id, form.template_fields)
      const hasPhoto = form.materialFiles.length > 0
      const prompt = buildPrompt(form.template_id, merged, hasPhoto)
      // 複数画像対応: アップロードされた素材をスロット順に全て圧縮して送る
      // （4.5MB制限対策で各1100pxに圧縮・最大12枚）。参考画像方式では Image2..N として使われる。
      const files = form.materialFiles.slice(0, 12)
      const photoDataUrls: string[] = []
      for (const f of files) {
        const raw = await fileToDataUrl(f)
        photoDataUrls.push(await compressImage(raw, 1100))
      }
      const res = await fetch('/api/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ prompt, photoDataUrls, templateId: form.template_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'デザインの制作に失敗しました')
      setCanvasDataUrl(data.imageDataUrl)
      setGenerationCount(c => c + 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'デザインの制作に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const validate = () => {
    if (step === 0) {
      if (!form.template_id) { setError('テンプレートを1つ選択してください'); return false }
    }
    if (step === 1) {
      if (!form.image_size) { setError('画像サイズを選択してください'); return false }
      // AI生成テンプレは必須入力欄をチェック
      if (templateFields) {
        for (const f of templateFields) {
          if (f.required && !(form.template_fields[f.key] ?? '').trim()) {
            setError(`「${f.label}」を入力してください`); return false
          }
        }
      }
    }
    setError(''); return true
  }

  const handleNext = () => {
    if (!validate()) return
    // テンプレ選択(step0)を終えて詳細入力(step1)へ進む直前に、登録済み店舗情報を自動プリフィル
    if (step === 0) applyStorePrefill(form.template_id)
    // AI制作テンプレは、詳細入力(step1)→プレビュー(step2)に進む時点で自動的に制作を開始する
    const startGeneration = step === 1 && isAITemplate
    setStep(s => s + 1)
    if (startGeneration) handleGenerate()
  }

  // 画像を圧縮してVercel 4.5MB制限に対応
  const compressImage = (dataUrl: string, maxWidth = 1080): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        // JPEGで圧縮（品質0.88）
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.src = dataUrl
    })
  }

  const handleDeliver = async () => {
    if (!canvasDataUrl) { setError('デザインが制作されていません'); return }
    setDelivering(true)
    setError('')
    try {
      // 圧縮してサイズを小さくする
      const compressed = await compressImage(canvasDataUrl, 1080)

      const res = await fetch('/api/design/deliver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          imageDataUrl: compressed,
          templateName: form.template_name,
          textContent: isAITemplate ? (form.template_fields.main_title || form.template_name) : form.text_content,
          imageType: form.template_name || 'AI制作画像',
          imageSize: form.image_size,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '依頼に失敗しました')
      setDeliverResult({ driveUrl: data.driveUrl, previewUrl: data.previewUrl })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '依頼に失敗しました')
    } finally {
      setDelivering(false)
    }
  }

  const inputClass = "w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E85C97]/20 focus:border-[#E85C97] transition-all bg-[#FAFAFA]"
  const textareaClass = `${inputClass} resize-none`

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-[#E85C97] text-white' :
              i === step ? 'bg-[#E85C97] text-white ring-4 ring-[#FFF0F6]' :
              'bg-[#EFEFEF] text-[#ABABAB]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-1 text-xs hidden sm:block truncate max-w-[80px] ${i <= step ? 'text-[#E85C97] font-semibold' : 'text-[#ABABAB]'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-1.5 flex-shrink-0 ${i < step ? 'bg-[#E85C97]' : 'bg-[#EFEFEF]'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-[#FFF0F6] border border-red-100 text-[#E85C97] rounded-xl px-4 py-2.5 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step 0: テンプレート選択 */}
      {step === 0 && (
        <div className="space-y-4">
          {/* パンフレット一括制作機能は廃止（2026-09-09）。入口を撤去してテンプレ選択に一本化。 */}
          <div>
            <p className="text-xs font-bold text-[#111111] mb-2">デザインイメージで絞り込む</p>
            <div className="flex flex-wrap gap-2">
              {DESIGN_FILTERS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDesignFilter(prev => prev === f ? '' : f)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    designFilter === f
                      ? 'bg-[#E85C97] text-white border-[#E85C97] shadow-sm'
                      : 'bg-white text-[#6B7280] border-[#EFEFEF] hover:border-[#E85C97] hover:text-[#E85C97]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#111111] mb-3">
              テンプレートを選択 <span className="text-[#E85C97]">*</span>
              <span className="text-[#6B7280] font-normal ml-1">（{filteredTemplates.length}件表示中）</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredTemplates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={form.template_id === t.id}
                  onSelect={() => {
                    update('template_id', t.id)
                    update('template_name', t.name)
                    update('design_image', designFilter || form.design_image)
                  }}
                />
              ))}
            </div>
          </div>

          {form.template_id && (
            <div className="bg-[#FFF0F6] rounded-xl px-4 py-3 text-xs text-[#E85C97] font-semibold">
              ✓ 選択中：{form.template_name}
            </div>
          )}
        </div>
      )}

      {/* Step 1: 詳細入力 */}
      {step === 1 && (
        <div className="md:flex md:gap-6 md:items-start">
          {/* 選択中テンプレの見本（PC=左サイド固定表示／スマホ=上部）。どんなデザインを作っているか常に見える */}
          {selectedTemplate?.referenceImage && (
            <div className="md:w-[38%] md:flex-shrink-0 mb-5 md:mb-0 md:sticky md:top-4">
              <p className="text-xs font-bold text-[#111111] mb-2">📋 選択中のテンプレート：{selectedTemplate.name}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedTemplate.referenceImage}
                alt={selectedTemplate.name}
                className="w-full rounded-xl border border-[#EFEFEF] shadow-sm"
              />
              <p className="text-[10px] text-[#ABABAB] mt-1.5 leading-relaxed">
                ※ 仕上がりの見本イメージです。実際のデザインは、入力いただいた内容をもとにAIが制作します。
              </p>
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-5">
          <Field label="画像サイズ" required>
            <div className="space-y-2">
              {IMAGE_SIZES.map(s => (
                <label key={s.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="image_size"
                    value={s.value}
                    checked={form.image_size === s.value}
                    onChange={() => update('image_size', s.value)}
                    className="accent-[#E85C97]"
                  />
                  <span className={`text-sm transition-colors ${form.image_size === s.value ? 'text-[#E85C97] font-semibold' : 'text-[#6B7280]'}`}>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {templateFields ? (
            /* AI生成テンプレ：テンプレ専用の入力欄 */
            <>
              <div className="bg-[#FFF0F6] rounded-xl px-4 py-2.5 text-[11px] text-[#E85C97] font-medium">
                ご入力内容をもとにデザインを制作します。次の画面で仕上がりイメージをご確認いただけます。
              </div>
              {templateFields.map(f => (
                <Field key={f.key} label={f.label} required={f.required}>
                  {f.type === 'select' ? (
                    <div className="flex flex-wrap gap-2">
                      {(f.options ?? []).map(opt => {
                        const cur = form.template_fields[f.key] ?? f.default ?? ''
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateField(f.key, opt)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              cur === opt
                                ? 'bg-[#E85C97] text-white border-[#E85C97] shadow-sm'
                                : 'bg-white text-[#6B7280] border-[#EFEFEF] hover:border-[#E85C97] hover:text-[#E85C97]'
                            }`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : f.type === 'textarea' ? (
                    <>
                      <textarea
                        value={form.template_fields[f.key] ?? ''}
                        onChange={e => {
                          const lines = e.target.value.split('\n')
                          const capped = (f.maxLines ? lines.slice(0, f.maxLines) : lines)
                            .map(l => (f.maxLength ? l.slice(0, f.maxLength) : l))
                            .join('\n')
                          updateField(f.key, capped)
                        }}
                        rows={4}
                        placeholder={f.placeholder}
                        className={textareaClass}
                      />
                      <p className="text-[10px] text-[#ABABAB] mt-1 text-right">
                        {(form.template_fields[f.key] ?? '').split('\n').filter(Boolean).length}
                        {f.maxLines ? ` / ${f.maxLines}行` : '行'}
                        {f.maxLength ? `・1行${f.maxLength}文字まで` : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        inputMode={f.numeric ? 'numeric' : undefined}
                        value={form.template_fields[f.key] ?? ''}
                        onChange={e => {
                          let v = e.target.value
                          if (f.numeric) v = v.replace(/[^0-9]/g, '')
                          if (f.maxLength) v = v.slice(0, f.maxLength)
                          updateField(f.key, v)
                        }}
                        maxLength={f.maxLength}
                        placeholder={f.placeholder}
                        className={inputClass}
                      />
                      {f.maxLength && !f.numeric && (
                        <p className="text-[10px] text-[#ABABAB] mt-1 text-right">
                          {(form.template_fields[f.key] ?? '').length} / {f.maxLength}文字
                        </p>
                      )}
                    </>
                  )}
                  {f.hint && <p className="text-xs text-[#ABABAB] mt-1">{f.hint}</p>}
                </Field>
              ))}
            </>
          ) : (
            <Field label="テキスト内容">
              <textarea
                value={form.text_content}
                onChange={e => update('text_content', e.target.value)}
                rows={4}
                placeholder={`画像に入れたい文言、キャッチコピー、日付など\n例：\n夏のキャンペーン実施中！\n7月31日まで20%OFF`}
                className={textareaClass}
              />
              <p className="text-xs text-[#ABABAB] mt-1">
                1行目がメインキャッチコピー、2行目以降がサブテキストになります
              </p>
            </Field>
          )}

          {(() => {
            const mu = MATERIAL_UPLOAD[form.template_id]
            // カレンダー等の画像不要テンプレはアップロード欄を非表示
            if (mu?.needed === false) return null
            const label = mu?.label || (templateFields ? '商品写真アップロード（推奨）' : '素材アップロード（ロゴ・写真など）')
            return (
              <Field label={label}>
                {mu?.hint && <p className="text-xs text-[#6B7280] mb-1.5">{mu.hint}</p>}
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.ai"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? [])
                    update('materialFiles', files)
                  }}
                  className="w-full text-sm text-[#6B7280] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFF0F6] file:text-[#E85C97] hover:file:bg-red-100"
                />
                {form.materialFiles.length > 0 && (
                  <p className="text-xs text-[#22c55e] mt-1 font-semibold">
                    ✓ {form.materialFiles.length}件のファイルを選択済み：{form.materialFiles.map(f => f.name).join(', ')}
                  </p>
                )}
                <p className="text-xs text-[#ABABAB] mt-1">jpg/png/ai/pdf・最大10MB</p>
              </Field>
            )
          })()}

          <Field label="希望納期">
            <div className="space-y-2">
              {DELIVERY_SPEEDS.map(s => (
                <label key={s.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery_speed"
                    value={s.value}
                    checked={form.delivery_speed === s.value}
                    onChange={() => update('delivery_speed', s.value)}
                    className="accent-[#E85C97]"
                  />
                  <span className={`text-sm ${form.delivery_speed === s.value ? 'text-[#E85C97] font-semibold' : 'text-[#6B7280]'}`}>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="その他ご要望・参考にしてほしいこと">
            <textarea
              value={form.other_requests}
              onChange={e => update('other_requests', e.target.value)}
              rows={3}
              placeholder={`例：\n・競合他社に似たデザインは避けてほしい\n・過去に作ってもらった〇〇と同じトーンで\n・参考URL: https://...`}
              className={textareaClass}
            />
          </Field>
          </div>
        </div>
      )}

      {/* Step 2: プレビュー・納品 */}
      {step === 2 && (
        <div className="space-y-5">
          {deliverResult ? (
            /* 納品完了 */
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-black text-[#111111]">納品完了！</p>
                <p className="text-sm text-[#6B7280] mt-1">Googleドライブにデザイン画像を保存しました</p>
              </div>
              {/* プレビュー画像 */}
              <div className="rounded-2xl overflow-hidden border border-[#EFEFEF] mx-auto max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={deliverResult.previewUrl}
                  alt="納品画像"
                  className="w-full"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <a
                href={deliverResult.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1a73e8] text-white font-bold px-6 py-3 rounded-full hover:bg-[#1557b0] transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 19h20L12 2zm0 3l7 13H5l7-13z"/>
                </svg>
                Googleドライブで確認する
              </a>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-sm text-[#6B7280] underline"
                >
                  ダッシュボードに戻る
                </button>
              </div>
            </div>
          ) : (
            /* プレビュー表示 */
            <>
              <div>
                <p className="text-xs font-bold text-[#111111] mb-1">完成デザインプレビュー</p>
                <p className="text-[10px] text-[#6B7280] mb-3">
                  {isAITemplate
                    ? 'ご入力内容をもとにデザインを制作しています。仕上がりイメージをご確認のうえ、気になる場合は作り直せます（1回のご依頼につき最大3回まで）。'
                    : 'ご入力内容をもとにデザインを制作しています。「依頼する」ボタンを押すと、このデザインで制作を確定します。'}
                </p>
                {isAITemplate ? (
                  /* AI制作パネル：詳細入力の「次へ」で自動的に制作開始 */
                  <div className="space-y-3">
                    {generating ? (
                      <div className="aspect-square rounded-2xl border-2 border-dashed border-[#EFEFEF] bg-[#F8F8FA] flex flex-col items-center justify-center text-center p-6">
                        <svg className="animate-spin w-8 h-8 text-[#E85C97] mb-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-sm text-[#6B7280]">デザインを制作しています…</p>
                      </div>
                    ) : canvasDataUrl ? (
                      <div className="rounded-2xl overflow-hidden border border-[#EFEFEF] bg-[#F8F8FA]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={canvasDataUrl} alt="デザインプレビュー" className="w-full" />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-2xl border-2 border-dashed border-[#EFEFEF] bg-[#F8F8FA] flex flex-col items-center justify-center text-center p-6">
                        <span className="text-4xl mb-2">🎨</span>
                        <p className="text-sm text-[#6B7280] mb-3">デザインがまだ制作されていません</p>
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={generationCount >= MAX_GENERATIONS}
                          className="bg-[#111111] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#333333] transition-all disabled:opacity-50 text-sm"
                        >
                          デザインを制作する
                        </button>
                      </div>
                    )}
                    {canvasDataUrl && !generating && (
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generationCount >= MAX_GENERATIONS}
                        className="w-full bg-white border border-[#EFEFEF] text-[#111111] font-bold py-3 rounded-full hover:bg-[#F8F8FA] transition-all disabled:opacity-50"
                      >
                        作り直す（残り{MAX_GENERATIONS - generationCount}回）
                      </button>
                    )}
                    {generationCount >= MAX_GENERATIONS && (
                      <p className="text-[11px] text-[#ABABAB] text-center">
                        作り直しは{MAX_GENERATIONS}回まで承っております。このデザインで依頼するか、「戻る」で入力を調整してください。
                      </p>
                    )}
                  </div>
                ) : selectedTemplate && form.image_size ? (
                  <DesignCanvas
                    layoutType={selectedTemplate.layoutType}
                    bgFrom={selectedTemplate.bgFrom}
                    bgTo={selectedTemplate.bgTo}
                    textContent={form.text_content}
                    templateName={form.template_name}
                    imageSize={form.image_size}
                    materialFile={form.materialFiles[0] ?? null}
                    onGenerated={handleCanvasGenerated}
                  />
                ) : (
                  <div className="bg-[#F8F8FA] rounded-2xl p-8 text-center text-[#6B7280] text-sm">
                    テンプレートまたはサイズが未選択です
                  </div>
                )}
              </div>

              {/* 確認サマリー */}
              <div className="bg-[#F8F8FA] rounded-2xl p-4 space-y-2 text-sm">
                <p className="text-xs font-bold text-[#111111] mb-3">依頼内容の確認</p>
                {[
                  ['テンプレート', form.template_name || '未選択'],
                  ['サイズ', form.image_size || '未選択'],
                  ['内容', isAITemplate ? (form.template_fields.main_title || form.template_name) : (form.text_content || 'なし')],
                  ['素材ファイル', form.materialFiles.length > 0 ? form.materialFiles.map(f => f.name).join(', ') : 'なし'],
                  ['納期', form.delivery_speed],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-[#6B7280] flex-shrink-0 w-24 text-xs font-semibold">{label}</span>
                    <span className="text-[#111111] break-all text-xs">{value}</span>
                  </div>
                ))}
              </div>

              {/* 納品ボタン */}
              <button
                type="button"
                onClick={handleDeliver}
                disabled={delivering || !canvasDataUrl}
                className="w-full bg-[#E85C97] text-white font-bold py-4 rounded-full hover:bg-[#D8477F] transition-all disabled:opacity-50 shadow-md shadow-red-100 text-base"
              >
                {delivering ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Googleドライブに保存中...
                  </span>
                ) : 'このデザインで依頼する'}
              </button>

              <p className="text-[10px] text-[#ABABAB] text-center">
                納品後、Googleドライブのお客様番号フォルダに自動保存されます
              </p>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      {!deliverResult && (
        <div className="flex gap-3 mt-5">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-[#EFEFEF] text-[#6B7280] font-semibold py-3 rounded-full hover:bg-[#F8F8FA] transition-all">
              戻る
            </button>
          ) : (
            <button type="button" onClick={onCancel}
              className="flex-1 border border-[#EFEFEF] text-[#6B7280] font-semibold py-3 rounded-full hover:bg-[#F8F8FA] transition-all">
              キャンセル
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" onClick={handleNext}
              className="flex-1 bg-[#E85C97] text-white font-bold py-3 rounded-full hover:bg-[#D8477F] transition-all shadow-md shadow-red-100">
              次へ
            </button>
          )}
        </div>
      )}
    </div>
  )
}

