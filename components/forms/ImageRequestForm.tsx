'use client'

import { useState, useCallback, useEffect } from 'react'
import { TemplatePreview } from '@/components/ui/TemplatePreview'
import { DesignCanvas } from '@/components/ui/DesignCanvas'
import { createClient } from '@/lib/supabase'
import { TEMPLATE_FIELDS, buildPrompt, buildBrochurePrompt, BROCHURE_TONES, mergeFieldDefaults } from '@/lib/design-prompts'

// 1依頼あたりのAI生成回数の上限（初回1＋作り直し2＝計3回）
const MAX_GENERATIONS = 3

const STEPS = ['制作内容', 'テンプレート選択', '詳細入力', 'プレビュー・納品']

// ─── 制作内容カテゴリ（画像プロンプト・参考画像 集の内容に合わせて再編） ───
const PRODUCTION_TYPE_CATEGORIES = [
  {
    label: '新商品・キャンペーン',
    types: ['新商品告知', 'キャンペーン・セール告知', 'クーポン告知', '季節限定メニュー'],
  },
  {
    label: '商品・メニュー訴求',
    types: ['商品ヒーロー訴求', 'SNS投稿画像', 'お客様の声・口コミ風'],
  },
  {
    label: 'メニュー表',
    types: ['グランドメニュー表', 'ドリンクメニュー表', 'サイド・デザートメニュー表', 'お持ち帰りメニュー表'],
  },
  {
    label: '集客・お知らせ',
    types: ['LINE登録促進', 'Google口コミ依頼', '営業カレンダー・スケジュール', 'イベント告知', '新規オープン告知'],
  },
  {
    label: '店舗紹介・LP',
    types: ['メニュー表紙・ブランド紹介', '店舗紹介LP', '総合訴求LP'],
  },
]

const PRODUCTION_TYPES = PRODUCTION_TYPE_CATEGORIES.flatMap(c => c.types)

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
}

// ─── テンプレート定義（画像プロンプト・参考画像 集 準拠） ───
// 旧テンプレート群は全廃。プロンプト①の7マスター＋プロンプト②(カフェ・飲食)の
// 具体例を統合した全11種に統一。各テンプレは同集の対応デザイン（参考画像）と紐づき、
// layoutTypeはDesignCanvas（顧客が作成した画像がそのまま納品される）の対応レイアウトに対応。
const TEMPLATES: Template[] = [
  {
    id: 'limited-banner',
    name: '期間限定バナー',
    description: '季節カラーの背景に割引率や価格を大きく強調するセール告知デザイン。',
    sampleUses: '春の感謝祭20%OFF・周年セール・期間限定フェア',
    layoutType: 'banner-limit',
    bgFrom: '#f59e0b', bgTo: '#fbbf24',
    referenceImage: '/templates/tpl-banner-limit.jpg',
    productionTags: ['キャンペーン・セール告知', 'クーポン告知', '季節限定メニュー'],
    designTags: ['インパクト', 'SNS映え', 'お任せ'],
  },
  {
    id: 'new-product',
    name: '新商品告知（インパクト）',
    description: '大きな英字タイトルとシズル感のある商品写真で新商品の登場を訴求するデザイン。',
    sampleUses: '新商品スムージー・季節限定ドリンク・新メニュー登場',
    layoutType: 'color-text',
    bgFrom: '#f97316', bgTo: '#ec4899',
    referenceImage: '/templates/tpl-new-product.jpg',
    productionTags: ['新商品告知', '季節限定メニュー', 'SNS投稿画像'],
    designTags: ['インパクト', 'SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'product-hero',
    name: '商品ヒーロー写真（高級感）',
    description: 'ダーク背景に商品写真を大きく配し、ゴールドのアクセントで高級感を演出。',
    sampleUses: '看板メニュー・こだわりの一品・新商品ヒーロー',
    layoutType: 'product-card',
    bgFrom: '#1c1c1c', bgTo: '#3d3d3d',
    referenceImage: '/templates/tpl-product-hero.jpg',
    productionTags: ['商品ヒーロー訴求', '新商品告知'],
    designTags: ['高級感', 'シンプル', 'お任せ'],
  },
  {
    id: 'photo-overlay-callout',
    name: '写真メイン＋テキストオーバーレイ（SNS口コミ風）',
    description: '料理写真の各ポイントから手書き吹き出しコメントを引き出すSNS映えデザイン。',
    sampleUses: 'SNS投稿・お客様の声風・シズル感のある商品紹介',
    layoutType: 'photo-overlay',
    bgFrom: '#1c1c1c', bgTo: '#2d2d2d',
    referenceImage: '/templates/tpl-sns-callout.jpg',
    productionTags: ['SNS投稿画像', 'お客様の声・口コミ風', '商品ヒーロー訴求'],
    designTags: ['SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'menu-grid',
    name: 'グランドメニュー表（ナチュラル）',
    description: '人気No.1を大きく、他メニューをグリッドで整理したナチュラルなメニュー表デザイン。',
    sampleUses: 'グランドメニュー・おすすめメニュー・お持ち帰りメニュー',
    layoutType: 'menu-list',
    bgFrom: '#f0fdf4', bgTo: '#fef9c3',
    referenceImage: '/templates/tpl-menu-grid.jpg',
    productionTags: ['グランドメニュー表', 'お持ち帰りメニュー表'],
    designTags: ['ナチュラル', 'シンプル', 'お任せ'],
  },
  {
    id: 'drink-menu',
    name: 'ドリンクメニュー表',
    description: 'ドリンクを種類ごとに整理し、価格とともに一覧化するメニュー表デザイン。',
    sampleUses: 'ドリンクメニュー・カフェメニュー・アルコールメニュー',
    layoutType: 'menu-list',
    bgFrom: '#e0f2fe', bgTo: '#f0fdf4',
    referenceImage: '/templates/tpl-drink-menu.jpg',
    productionTags: ['ドリンクメニュー表'],
    designTags: ['ナチュラル', 'シンプル', 'お任せ'],
  },
  {
    id: 'sweets-menu',
    name: 'サイド・デザートメニュー表',
    description: 'スイーツやサイドメニューを写真付きグリッドで見せるメニュー表デザイン。',
    sampleUses: 'スイーツ・サイドメニュー・デザート表',
    layoutType: 'menu-list',
    bgFrom: '#fff1f2', bgTo: '#ffe4e6',
    referenceImage: '/templates/tpl-sweets-menu.jpg',
    productionTags: ['サイド・デザートメニュー表'],
    designTags: ['ナチュラル', 'かわいい', 'お任せ'],
  },
  {
    id: 'menu-cover',
    name: 'メニュー表紙・店舗ブランド紹介（高級感）',
    description: '店舗の世界観を伝える表紙・ブランド紹介ビジュアル。パンフレットの顔にも。',
    sampleUses: 'メニュー表紙・店舗紹介・ブランドイメージ',
    layoutType: 'shop-hero',
    bgFrom: '#1a1a2e', bgTo: '#16213e',
    referenceImage: '/templates/tpl-menu-cover.jpg',
    productionTags: ['メニュー表紙・ブランド紹介', '店舗紹介LP'],
    designTags: ['高級感', 'シンプル', 'お任せ'],
  },
  {
    id: 'line-qr',
    name: 'LINE登録QRコード付き',
    description: 'LINE友だち追加の特典とQRコードを目立たせる集客・登録促進デザイン。',
    sampleUses: '友だち追加クーポン・LINE登録特典・Google口コミ依頼',
    layoutType: 'qr-code',
    bgFrom: '#22c55e', bgTo: '#10b981',
    referenceImage: '/templates/tpl-line-qr.jpg',
    productionTags: ['LINE登録促進', 'Google口コミ依頼', 'クーポン告知'],
    designTags: ['かわいい', 'SNS映え', 'インパクト', 'お任せ'],
  },
  {
    id: 'calendar-schedule',
    name: 'カレンダー・スケジュール表',
    description: '営業日・定休日・特別イベントをカレンダー形式で伝える月間予定表デザイン。',
    sampleUses: '営業カレンダー・今月の予定・定休日お知らせ',
    layoutType: 'calendar',
    bgFrom: '#eff6ff', bgTo: '#e0e7ff',
    referenceImage: '/templates/tpl-calendar.jpg',
    productionTags: ['営業カレンダー・スケジュール', 'イベント告知'],
    designTags: ['シンプル', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'vertical-lp',
    name: '縦型LP風（総合訴求）',
    description: 'こだわり・人気メニュー・口コミ・LINE誘導までを1枚にまとめた縦長LPデザイン。',
    sampleUses: '店舗紹介LP・商品訴求LP・SNSプロフィール紹介',
    layoutType: 'lp-stack',
    bgFrom: '#1e293b', bgTo: '#475569',
    referenceImage: '/templates/tpl-vertical-lp.jpg',
    productionTags: ['総合訴求LP', '店舗紹介LP', 'メニュー表紙・ブランド紹介'],
    designTags: ['高級感', 'インパクト', 'お任せ'],
  },
  {
    id: 'salon-open',
    name: 'サロン新規オープン告知（高級感）',
    description: '上質な内装イメージに大きな「OPEN」と強み・特典を配した、サロン向けの開店告知デザイン。',
    sampleUses: 'スパ＆マッサージOPEN・リラクゼーション開店・新規オープン記念',
    layoutType: 'shop-hero',
    bgFrom: '#d8c7b8', bgTo: '#a89a8c',
    productionTags: ['新規オープン告知', 'イベント告知'],
    designTags: ['高級感', 'シンプル', 'お任せ'],
  },
  {
    id: 'esthe-campaign',
    name: 'エステ・サロン集客キャンペーン（清潔感）',
    description: 'フェイシャル施術イメージに体験コースの特別価格を訴求する、女性向けの集客キャンペーンデザイン。',
    sampleUses: 'フェイシャルエステ体験・初回限定キャンペーン・サロン集客',
    layoutType: 'color-text',
    bgFrom: '#f9c9d4', bgTo: '#e6c9a8',
    productionTags: ['キャンペーン・セール告知', 'クーポン告知', '新規オープン告知'],
    designTags: ['高級感', 'かわいい', 'シンプル', 'お任せ'],
  },
  {
    id: 'takeout-menu',
    name: 'お持ち帰りメニュー表（和モダン）',
    description: 'ネイビー帯＋点線で商品名と価格を整然と並べる、テイクアウト向けの情報整理型メニュー表。',
    sampleUses: 'お持ち帰りメニュー・テイクアウト価格表・弁当メニュー一覧',
    layoutType: 'menu-list',
    bgFrom: '#1e3a5f', bgTo: '#3d5a80',
    productionTags: ['お持ち帰りメニュー表', 'グランドメニュー表'],
    designTags: ['シンプル', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'bento-menu',
    name: 'お弁当メニュー（和風・高級感）',
    description: '黒×金×赤茶の和モダン配色で、お弁当を美味しそうに見せる高級感あるテイクアウトメニュー表。',
    sampleUses: '焼肉弁当・宅配弁当・仕出し弁当メニュー',
    layoutType: 'menu-list',
    bgFrom: '#1a1a1a', bgTo: '#3d2b1f',
    productionTags: ['お持ち帰りメニュー表', '商品ヒーロー訴求'],
    designTags: ['高級感', 'シンプル', 'お任せ'],
  },
  {
    id: 'line-friend-guide',
    name: 'LINE友だち登録案内（操作手順つき）',
    description: 'QRコード・ID検索の登録手順を丁寧に説明する、LINE公式アカウントの友だち追加案内デザイン。',
    sampleUses: 'LINE友だち登録案内・公式アカウント登録手順・お得情報の案内',
    layoutType: 'steps-3',
    bgFrom: '#22c55e', bgTo: '#4ade80',
    productionTags: ['LINE登録促進'],
    designTags: ['シンプル', 'かわいい', 'お任せ'],
  },
]

// テンプレ別の素材アップロード欄のラベル・説明。未定義なら汎用ラベル。
// needed: false のテンプレ（カレンダー等）はアップロード欄自体を非表示にする。
const MATERIAL_UPLOAD: Record<string, { label: string; hint: string; needed?: boolean }> = {
  'limited-banner':        { label: '商品写真アップロード（任意）', hint: '割引・セール対象の商品写真があれば添付' },
  'new-product':           { label: '商品写真アップロード（推奨）', hint: 'シズル感のある新商品の写真' },
  'product-hero':          { label: '商品写真アップロード（推奨・1点）', hint: '主役となる商品写真を1枚' },
  'photo-overlay-callout': { label: '料理写真アップロード（推奨）', hint: '写真を全面の背景として使用します' },
  'menu-grid':             { label: '一番人気の商品写真（任意）', hint: '一番人気メニューの写真があれば添付' },
  'drink-menu':            { label: '商品写真アップロード（任意）', hint: 'ドリンクの写真があれば添付' },
  'sweets-menu':           { label: '商品写真アップロード（任意）', hint: 'スイーツ・サイドの写真があれば添付' },
  'menu-cover':            { label: '店舗・スタッフ写真／ロゴ（任意）', hint: '店舗イメージ・スタッフ写真・ロゴがあれば添付' },
  'line-qr':              { label: 'QRコード画像アップロード（必須）', hint: 'LINE友だち追加用のQRコード画像を1枚アップロードしてください' },
  'calendar-schedule':     { label: '', hint: '', needed: false },
  'vertical-lp':           { label: '店舗・商品写真アップロード（推奨）', hint: '店舗や商品の写真があれば添付' },
  'salon-open':            { label: 'サロン・施術イメージ写真（任意）', hint: '施術風景やサロン内観の写真があれば添付' },
  'esthe-campaign':        { label: '施術イメージ写真（任意）', hint: 'フェイシャル・サロンの写真があれば添付' },
  'takeout-menu':          { label: '商品写真アップロード（任意）', hint: 'お持ち帰り商品の写真があれば添付' },
  'bento-menu':            { label: 'お弁当写真アップロード（推奨）', hint: 'お弁当の写真があれば添付' },
  'line-friend-guide':     { label: 'QRコード画像アップロード（必須）', hint: 'LINE友だち追加用のQRコード画像を1枚アップロードしてください' },
}

function getFilteredTemplates(productionTypes: string[], designFilter: string): Template[] {
  // デザインイメージ条件
  const byDesign = (t: Template) =>
    !designFilter || t.designTags.includes(designFilter) || t.designTags.includes('お任せ')
  // 制作内容条件（選択した制作内容に一致するテンプレのみ）
  const byProduction = (t: Template) =>
    productionTypes.length === 0 ||
    productionTypes.some(pt => t.productionTags.some(tag => pt.includes(tag) || tag.includes(pt)))
  const matched = TEMPLATES.filter(t => byDesign(t) && byProduction(t))
  // 制作内容に一致するテンプレが1件も無い場合のみ、デザイン条件のみの全件にフォールバック（0件回避）
  return matched.length > 0 ? matched : TEMPLATES.filter(byDesign)
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
  const [brochureMode, setBrochureMode] = useState(false) // パンフレット一括制作モード

  const update = <K extends keyof RequestFormData>(key: K, val: RequestFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // AI生成テンプレの入力欄を1つ更新
  const updateField = (fieldKey: string, val: string) => {
    setForm(prev => ({ ...prev, template_fields: { ...prev.template_fields, [fieldKey]: val } }))
  }

  const filteredTemplates = getFilteredTemplates(form.production_types, designFilter)

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
      // 素材写真は4.5MB制限対策で圧縮してから送る
      let photoDataUrl: string | undefined
      if (form.materialFiles[0]) {
        const raw = await fileToDataUrl(form.materialFiles[0])
        photoDataUrl = await compressImage(raw, 1200)
      }
      const res = await fetch('/api/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ prompt, photoDataUrl }),
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
      const types = form.production_types_other
        ? [...form.production_types, form.production_types_other]
        : form.production_types
      if (types.length === 0) { setError('制作内容を1つ以上選択してください'); return false }
    }
    if (step === 1) {
      if (!form.template_id) { setError('テンプレートを1つ選択してください'); return false }
    }
    if (step === 2) {
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
    // テンプレ選択(step1)を終えて詳細入力(step2)へ進む直前に、登録済み店舗情報を自動プリフィル
    if (step === 1) applyStorePrefill(form.template_id)
    // AI制作テンプレは、詳細入力(step2)→プレビュー(step3)に進む時点で自動的に制作を開始する
    const startGeneration = step === 2 && isAITemplate
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
          imageType: form.production_types[0] || 'SNS投稿',
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

  // パンフレット一括制作モードは専用フローに差し替え
  if (brochureMode) {
    return <BrochureBuilder accessToken={accessToken} onCancel={() => setBrochureMode(false)} />
  }

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

      {/* Step 0: 制作内容 */}
      {step === 0 && (
        <div className="space-y-4">
          {/* パンフレット一括制作の入口 */}
          <button
            type="button"
            onClick={() => setBrochureMode(true)}
            className="w-full text-left rounded-2xl border-2 border-[#E85C97]/30 bg-gradient-to-r from-[#FFF0F6] to-[#FFF7FB] px-4 py-3.5 hover:border-[#E85C97] transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📖</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#111111]">パンフレットをまとめて作る</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">表紙・メニュー・店内紹介・アクセスなど、複数ページを統一デザインで一括制作</p>
              </div>
              <span className="text-[#E85C97] text-lg group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </button>
          <div className="flex items-center gap-3 text-[10px] text-[#ABABAB]">
            <div className="flex-1 h-px bg-[#EFEFEF]" />
            または1枚ずつ制作
            <div className="flex-1 h-px bg-[#EFEFEF]" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#111111]">
              制作内容を選択（1つ） <span className="text-[#E85C97]">*</span>
            </label>
            {form.production_types[0] && (
              <span className="text-xs text-[#E85C97] font-semibold bg-[#FFF0F6] px-2 py-0.5 rounded-full">
                {form.production_types[0]}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {PRODUCTION_TYPE_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p className="text-[10px] font-bold text-[#ABABAB] uppercase tracking-widest mb-1.5">
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.types.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        production_types: [opt],
                        production_types_other: '',
                        template_id: '',
                        template_name: '',
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        form.production_types[0] === opt
                          ? 'bg-[#E85C97] text-white border-[#E85C97] shadow-sm'
                          : 'bg-white text-[#6B7280] border-[#EFEFEF] hover:border-[#E85C97] hover:text-[#E85C97]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={form.production_types_other}
            onChange={e => setForm(prev => ({
              ...prev,
              production_types_other: e.target.value,
              production_types: [],
              template_id: '',
              template_name: '',
            }))}
            placeholder="その他（上記にない場合は自由入力）"
            className={inputClass}
          />
        </div>
      )}

      {/* Step 1: テンプレート選択 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-[#111111] mb-2">デザインイメージで絞り込む</p>
            <div className="flex flex-wrap gap-2">
              {DESIGN_FILTERS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDesignFilter(f)}
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
                    update('design_image', designFilter !== 'お任せ' ? designFilter : form.design_image)
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

      {/* Step 2: 詳細入力 */}
      {step === 2 && (
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

      {/* Step 3: プレビュー・納品 */}
      {step === 3 && (
        <div className="space-y-5">
          {deliverResult ? (
            /* 納品完了 */
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
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
                  ['制作内容', [...form.production_types, form.production_types_other ? `その他: ${form.production_types_other}` : ''].filter(Boolean).join('、') || '未選択'],
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
                ) : '📤 このデザインで依頼する'}
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

// ─── パンフレット一括制作 ─────────────────────────────────────────
const BROCHURE_PAGES = [
  { id: 'menu-cover',    label: '表紙・ブランド紹介', icon: '📖' },
  { id: 'menu-grid',     label: 'グランド／ランチメニュー', icon: '🍽️' },
  { id: 'sweets-menu',   label: 'サイド・デザート', icon: '🍰' },
  { id: 'drink-menu',    label: 'ドリンクメニュー', icon: '🥤' },
  { id: 'shop-interior', label: '店内のご紹介', icon: '🪴' },
  { id: 'access-info',   label: 'アクセス・店舗情報', icon: '🗺️' },
]

function brochureCompress(dataUrl: string, maxWidth = 1080): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
function brochureFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function BrochureBuilder({ accessToken, onCancel }: { accessToken: string | null; onCancel: () => void }) {
  const [phase, setPhase] = useState<'config' | 'input' | 'result' | 'done'>('config')
  const [tone, setTone] = useState('ナチュラル')
  const [brochureSize, setBrochureSize] = useState('正方形(1080x1080px)') // 全ページ共通の画像サイズ
  const [storeName, setStoreName] = useState('')
  const [selected, setSelected] = useState<string[]>(BROCHURE_PAGES.map(p => p.id))
  const [fields, setFields] = useState<Record<string, Record<string, string>>>({})
  const [materials, setMaterials] = useState<Record<string, File[]>>({})
  const [images, setImages] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [delivering, setDelivering] = useState(false)
  const [doneCount, setDoneCount] = useState(0)
  const [error, setError] = useState('')
  const [regenId, setRegenId] = useState<string | null>(null) // 個別作り直し中のページID

  const pages = BROCHURE_PAGES.filter(p => selected.includes(p.id))

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const setField = (pid: string, key: string, val: string) =>
    setFields(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), [key]: val } }))

  const goInput = () => {
    if (!storeName.trim()) { setError('店名を入力してください'); return }
    if (selected.length === 0) { setError('ページを1つ以上選択してください'); return }
    setError(''); setPhase('input')
  }

  const handleGenerateAll = async () => {
    // 各ページの必須項目チェック
    for (const p of pages) {
      for (const f of (TEMPLATE_FIELDS[p.id] || [])) {
        if (f.required && !(fields[p.id]?.[f.key] ?? '').trim()) {
          setError(`「${p.label}」の「${f.label}」を入力してください`); return
        }
      }
    }
    setGenerating(true); setError('')
    const total = pages.length
    try {
      for (let i = 0; i < pages.length; i++) {
        const pg = pages[i]
        setProgress(`${i + 1}/${total}ページ目「${pg.label}」を制作中…`)
        const merged = mergeFieldDefaults(pg.id, fields[pg.id] || {})
        const files = materials[pg.id] || []
        const prompt = buildBrochurePrompt(pg.id, merged, files.length > 0, { tone, pageNo: i + 1, totalPages: total, storeName, size: brochureSize })
        let photoDataUrl: string | undefined
        if (files[0]) { photoDataUrl = await brochureCompress(await brochureFileToDataUrl(files[0]), 1200) }
        const res = await fetch('/api/design/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ prompt, photoDataUrl }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `${i + 1}ページ目の制作に失敗しました`)
        setImages(prev => ({ ...prev, [pg.id]: data.imageDataUrl }))
      }
      setPhase('result')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'デザインの制作に失敗しました')
    } finally { setGenerating(false); setProgress('') }
  }

  // 個別作り直し：指定ページだけを（修正後の入力で）再生成する
  const regenerateOne = async (pid: string) => {
    const idx = pages.findIndex(p => p.id === pid)
    if (idx < 0) return
    const pg = pages[idx]
    for (const f of (TEMPLATE_FIELDS[pg.id] || [])) {
      if (f.required && !(fields[pg.id]?.[f.key] ?? '').trim()) {
        setError(`「${pg.label}」の「${f.label}」を入力してください`); return
      }
    }
    setRegenId(pid); setError('')
    try {
      const merged = mergeFieldDefaults(pg.id, fields[pg.id] || {})
      const files = materials[pg.id] || []
      const prompt = buildBrochurePrompt(pg.id, merged, files.length > 0, { tone, pageNo: idx + 1, totalPages: pages.length, storeName, size: brochureSize })
      let photoDataUrl: string | undefined
      if (files[0]) { photoDataUrl = await brochureCompress(await brochureFileToDataUrl(files[0]), 1200) }
      const res = await fetch('/api/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ prompt, photoDataUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '作り直しに失敗しました')
      setImages(prev => ({ ...prev, [pg.id]: data.imageDataUrl }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '作り直しに失敗しました')
    } finally { setRegenId(null) }
  }

  const handleDeliverAll = async () => {
    setDelivering(true); setError('')
    try {
      const items: Array<{ imageDataUrl: string; templateName: string; textContent: string }> = []
      for (const pg of pages) {
        if (!images[pg.id]) continue
        const compressed = await brochureCompress(images[pg.id], 1080)
        items.push({
          imageDataUrl: compressed,
          templateName: pg.label,
          textContent: Object.values(fields[pg.id] || {}).filter(Boolean).join(' / '),
        })
      }
      if (items.length === 0) throw new Error('納品できるページがありません')
      const res = await fetch('/api/design/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          images: items,
          imageType: 'パンフレット',
          imageSize: brochureSize,
          brochureTitle: `${storeName} パンフレット`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '納品に失敗しました')
      setDoneCount(data.count ?? items.length)
      setPhase('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '納品に失敗しました')
    } finally { setDelivering(false) }
  }

  const inputCls = "w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E85C97]/20 focus:border-[#E85C97] transition-all bg-[#FAFAFA]"

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">📖</span>
        <h3 className="text-base font-bold text-[#111111]">パンフレット一括制作</h3>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-2.5">{error}</div>}

      {/* config：トーン・店名・ページ選択 */}
      {phase === 'config' && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1.5">店名・店舗名 <span className="text-[#E85C97]">*</span></label>
            <input value={storeName} onChange={e => setStoreName(e.target.value.slice(0, 20))} placeholder="例：カフェ 森のテラス" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1.5">デザインの雰囲気（全ページ共通）</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BROCHURE_TONES).map(([key, t]) => (
                <button key={key} type="button" onClick={() => setTone(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${tone === key ? 'bg-[#E85C97] text-white border-[#E85C97]' : 'bg-white text-[#6B7280] border-[#EFEFEF] hover:border-[#E85C97]'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1.5">画像サイズ（全ページ共通）</label>
            <div className="flex flex-wrap gap-2">
              {IMAGE_SIZES.map(s => (
                <button key={s.value} type="button" onClick={() => setBrochureSize(s.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${brochureSize === s.value ? 'bg-[#E85C97] text-white border-[#E85C97]' : 'bg-white text-[#6B7280] border-[#EFEFEF] hover:border-[#E85C97]'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#111111] block mb-1.5">作るページ・テンプレートを選択（{selected.length}ページ）</label>
            <p className="text-[11px] text-[#6B7280] mb-2">各ページの見本を確認して選んでください。選んだページ数分、今月の制作回数（月10回）を消費します。</p>
            <div className="space-y-2">
              {BROCHURE_PAGES.map(p => {
                const on = selected.includes(p.id)
                const no = pages.findIndex(x => x.id === p.id) + 1
                const ref = TEMPLATES.find(t => t.id === p.id)?.referenceImage
                return (
                  <button key={p.id} type="button" onClick={() => toggle(p.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${on ? 'border-[#E85C97] bg-[#FFF7FB]' : 'border-[#EFEFEF] bg-white hover:border-[#E85C97]/40'}`}>
                    {ref ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ref} alt={p.label} className="w-14 h-14 rounded-lg object-cover border border-[#EFEFEF] flex-shrink-0" />
                    ) : <span className="text-lg w-14 text-center flex-shrink-0">{p.icon}</span>}
                    <span className="flex-1 text-left">
                      <span className={`block text-sm font-medium ${on ? 'text-[#111111]' : 'text-[#6B7280]'}`}>{p.icon} {p.label}</span>
                      <span className="block text-[10px] text-[#ABABAB] mt-0.5">テンプレート見本</span>
                    </span>
                    {on
                      ? <span className="text-[11px] text-white bg-[#E85C97] w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">{no}</span>
                      : <span className="text-[10px] text-[#ABABAB] flex-shrink-0">選ぶ</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 border border-[#EFEFEF] text-[#6B7280] font-semibold py-3 rounded-full hover:bg-[#F8F8FA]">戻る</button>
            <button type="button" onClick={goInput} className="flex-1 bg-[#E85C97] text-white font-bold py-3 rounded-full hover:bg-[#D8477F] shadow-md shadow-red-100">次へ（内容入力）</button>
          </div>
        </div>
      )}

      {/* input：各ページの内容入力 */}
      {phase === 'input' && (
        <div className="space-y-5">
          <p className="text-[11px] text-[#6B7280]">各ページの内容を入力してください。全{pages.length}ページを統一デザインで制作します。</p>
          {pages.map((p, i) => (
            <div key={p.id} className="border border-[#EFEFEF] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white bg-[#E85C97] w-5 h-5 rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                <span className="text-sm font-bold text-[#111111]">{p.icon} {p.label}</span>
              </div>
              {(TEMPLATE_FIELDS[p.id] || []).map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[#6B7280] block mb-1">{f.label}{f.required && <span className="text-[#E85C97]"> *</span>}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={fields[p.id]?.[f.key] ?? ''} rows={3} placeholder={f.placeholder}
                      onChange={e => {
                        const lines = e.target.value.split('\n')
                        const capped = (f.maxLines ? lines.slice(0, f.maxLines) : lines).map(l => f.maxLength ? l.slice(0, f.maxLength) : l).join('\n')
                        setField(p.id, f.key, capped)
                      }}
                      className={`${inputCls} resize-none`} />
                  ) : f.type === 'select' ? (
                    <div className="flex flex-wrap gap-2">
                      {(f.options ?? []).map(opt => (
                        <button key={opt} type="button" onClick={() => setField(p.id, f.key, opt)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${(fields[p.id]?.[f.key] ?? f.default) === opt ? 'bg-[#E85C97] text-white border-[#E85C97]' : 'bg-white text-[#6B7280] border-[#EFEFEF]'}`}>{opt}</button>
                      ))}
                    </div>
                  ) : (
                    <input value={fields[p.id]?.[f.key] ?? ''} placeholder={f.placeholder}
                      onChange={e => setField(p.id, f.key, f.maxLength ? e.target.value.slice(0, f.maxLength) : e.target.value)}
                      className={inputCls} />
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-[#6B7280] block mb-1">写真・素材（任意・複数可）</label>
                <input type="file" multiple accept="image/*"
                  onChange={e => setMaterials(prev => ({ ...prev, [p.id]: Array.from(e.target.files ?? []) }))}
                  className="w-full text-xs text-[#6B7280] file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#FFF0F6] file:text-[#E85C97]" />
                {(materials[p.id]?.length ?? 0) > 0 && <p className="text-[10px] text-[#22c55e] mt-1 font-semibold">✓ {materials[p.id].length}件選択済み</p>}
              </div>
              {images[p.id] && (
                <div className="pt-3 border-t border-[#F3F3F3]">
                  <p className="text-[10px] text-[#6B7280] mb-1.5 font-semibold">現在の仕上がり（上の内容を直して作り直せます）</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[p.id]} alt={p.label} className="w-full rounded-lg border border-[#EFEFEF]" />
                  <button type="button" onClick={() => regenerateOne(p.id)} disabled={regenId !== null || generating}
                    className="mt-2 w-full border border-[#E85C97] text-[#E85C97] text-xs font-bold py-2 rounded-full hover:bg-[#FFF0F6] disabled:opacity-50">
                    {regenId === p.id ? '作り直し中…' : '🔄 このページだけ作り直す'}
                  </button>
                </div>
              )}
            </div>
          ))}
          {generating ? (
            <div className="rounded-2xl border-2 border-dashed border-[#EFEFEF] bg-[#F8F8FA] py-6 text-center">
              <svg className="animate-spin w-7 h-7 text-[#E85C97] mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-[#6B7280]">{progress}</p>
              <p className="text-[10px] text-[#ABABAB] mt-1">ページ数によっては少し時間がかかります</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button type="button" onClick={() => { setError(''); setPhase('config') }} className="flex-1 border border-[#EFEFEF] text-[#6B7280] font-semibold py-3 rounded-full hover:bg-[#F8F8FA]">戻る</button>
                <button type="button" onClick={handleGenerateAll} disabled={regenId !== null} className="flex-1 bg-[#E85C97] text-white font-bold py-3 rounded-full hover:bg-[#D8477F] shadow-md shadow-red-100 disabled:opacity-50">
                  {pages.some(p => images[p.id]) ? `すべて作り直す（全${pages.length}ページ）` : `${pages.length}ページを一括制作`}
                </button>
              </div>
              {pages.length > 0 && pages.every(p => images[p.id]) && (
                <button type="button" onClick={() => { setError(''); setPhase('result') }} className="w-full bg-[#111111] text-white font-bold py-3 rounded-full hover:bg-[#333333] transition-all">
                  プレビュー・納品へ進む →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* result：プレビュー＋一括納品 */}
      {phase === 'result' && (
        <div className="space-y-5">
          <p className="text-[11px] text-[#6B7280]">仕上がりをご確認ください。よろしければ一括で依頼できます。</p>
          <div className="grid grid-cols-2 gap-3">
            {pages.map((p, i) => (
              <div key={p.id} className="rounded-xl overflow-hidden border border-[#EFEFEF]">
                {images[p.id] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[p.id]} alt={p.label} className="w-full" />
                  </>
                ) : <div className="aspect-square bg-[#F8F8FA] flex items-center justify-center text-xs text-[#ABABAB]">未生成</div>}
                <p className="text-[10px] text-[#6B7280] px-2 py-1 font-medium">{i + 1}. {p.label}</p>
                <button type="button" onClick={() => regenerateOne(p.id)} disabled={regenId !== null || delivering}
                  className="w-full text-[11px] text-[#E85C97] font-bold py-1.5 border-t border-[#F3F3F3] hover:bg-[#FFF0F6] disabled:opacity-50">
                  {regenId === p.id ? '作り直し中…' : '🔄 作り直す'}
                </button>
              </div>
            ))}
          </div>
          {regenId && <p className="text-[11px] text-[#E85C97] text-center font-semibold">「{pages.find(p => p.id === regenId)?.label}」を作り直しています…</p>}
          <div className="bg-[#FFF7FB] rounded-xl px-4 py-2.5 text-[11px] text-[#6B7280]">
            この{pages.length}ページで今月の制作回数を <b className="text-[#E85C97]">{pages.length}回</b> 消費します。<br />
            気に入らないページは各画像の「🔄作り直す」で個別に、下の「すべて作り直す」で一括で作り直せます（作り直しは無料・回数は納品時のみ消費）。
          </div>
          <button type="button" onClick={handleGenerateAll} disabled={delivering || regenId !== null || generating}
            className="w-full border border-[#E85C97] text-[#E85C97] font-bold py-2.5 rounded-full hover:bg-[#FFF0F6] disabled:opacity-50">
            {generating ? (progress || '全ページを作り直し中…') : `🔄 すべて作り直す（全${pages.length}ページ）`}
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={() => setPhase('input')} disabled={delivering || regenId !== null} className="flex-1 border border-[#EFEFEF] text-[#6B7280] font-semibold py-3 rounded-full hover:bg-[#F8F8FA] disabled:opacity-50">✏️ 内容を修正</button>
            <button type="button" onClick={handleDeliverAll} disabled={delivering || regenId !== null} className="flex-1 bg-[#E85C97] text-white font-bold py-3 rounded-full hover:bg-[#D8477F] shadow-md shadow-red-100 disabled:opacity-50">
              {delivering ? 'Googleドライブに保存中...' : `📤 ${pages.length}ページを一括で依頼する`}
            </button>
          </div>
        </div>
      )}

      {/* done：完了 */}
      {phase === 'done' && (
        <div className="text-center py-8 space-y-3">
          <div className="text-4xl">🎉</div>
          <p className="text-base font-bold text-[#111111]">パンフレット{doneCount}ページを納品しました</p>
          <p className="text-xs text-[#6B7280]">Googleドライブのお客様番号フォルダ内に、パンフレット用フォルダとして保存されました。</p>
          <button type="button" onClick={onCancel} className="mt-2 bg-[#E85C97] text-white font-bold px-8 py-3 rounded-full hover:bg-[#D8477F] shadow-md shadow-red-100">完了</button>
        </div>
      )}
    </div>
  )
}
