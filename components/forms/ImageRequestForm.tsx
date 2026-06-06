'use client'

import { useState } from 'react'
import { TemplatePreview } from '@/components/ui/TemplatePreview'

const STEPS = ['制作内容', 'テンプレート選択', '詳細・確認']

const PRODUCTION_TYPES = [
  '今月の予定・営業カレンダー', '商品紹介', 'メニュー紹介', 'キャンペーン紹介',
  'クーポン告知', 'LINE登録促進', 'Google口コミ依頼', 'イベント告知',
  '新商品告知', '季節限定メニュー', 'スタッフ紹介', '店舗紹介',
  'お客様の声・口コミ紹介', 'ビフォーアフター', '求人募集', 'LP風画像',
  'バナー画像', 'POP作成', 'メニュー表作成', 'チラシ作成',
  'SNS投稿画像', 'ストーリーズ画像', 'リールサムネイル', 'YouTubeサムネイル',
]

const DESIGN_FILTERS = ['高級感', 'シンプル', 'インパクト', 'SNS映え', 'かわいい', 'ナチュラル', 'お任せ']

const IMAGE_SIZES = [
  { label: '正方形 (1080×1080)', value: '正方形(1080x1080px)' },
  { label: '縦長 (1080×1350)', value: '縦長(1080x1350px)' },
  { label: 'ストーリーズ (1080×1920)', value: 'ストーリーズ(1080x1920px)' },
  { label: '横長 (1200×628)', value: '横長(1200x628px)' },
]

const DELIVERY_SPEEDS = [
  { label: '通常（14営業日以内）', value: '通常' },
  { label: 'お急ぎ（要相談）', value: 'お急ぎ' },
  { label: '特に希望なし', value: '特に希望なし' },
]

// ─── テンプレート定義 ──────────────────────────────────────────────
export interface Template {
  id: string
  name: string
  description: string
  layoutType: string       // SVGプレビュー用
  bgFrom: string           // グラデーション開始色
  bgTo: string             // グラデーション終了色
  productionTags: string[]
  designTags: string[]
}

// テンプレートIDとlayoutTypeのマッピング
const TEMPLATE_LAYOUT_MAP: Record<string, { layoutType: string; bgFrom: string; bgTo: string }> = {
  'sns-photo-overlay':    { layoutType: 'photo-overlay',  bgFrom: '#4b5563', bgTo: '#374151' },
  'sns-color-text':       { layoutType: 'color-text',     bgFrom: '#f43f5e', bgTo: '#fb7185' },
  'sns-grid-layout':      { layoutType: 'grid-2x2',       bgFrom: '#f1f5f9', bgTo: '#e2e8f0' },
  'sns-story-vertical':   { layoutType: 'story-vertical', bgFrom: '#7c3aed', bgTo: '#ec4899' },
  'campaign-discount':    { layoutType: 'number-big',     bgFrom: '#ef4444', bgTo: '#f97316' },
  'campaign-limited':     { layoutType: 'banner-limit',   bgFrom: '#f59e0b', bgTo: '#fbbf24' },
  'campaign-stamp':       { layoutType: 'stamp',          bgFrom: '#22c55e', bgTo: '#14b8a6' },
  'product-hero':         { layoutType: 'product-card',   bgFrom: '#f5f0eb', bgTo: '#fffbf0' },
  'menu-grid':            { layoutType: 'menu-list',      bgFrom: '#fff7ed', bgTo: '#fef3c7' },
  'product-before-after': { layoutType: 'before-after',  bgFrom: '#e5e7eb', bgTo: '#dbeafe' },
  'event-calendar':       { layoutType: 'calendar',       bgFrom: '#eff6ff', bgTo: '#e0e7ff' },
  'event-announcement':   { layoutType: 'event-banner',   bgFrom: '#8b5cf6', bgTo: '#a78bfa' },
  'event-steps':          { layoutType: 'steps-3',        bgFrom: '#e0f2fe', bgTo: '#cffafe' },
  'line-qr':              { layoutType: 'qr-code',        bgFrom: '#22c55e', bgTo: '#10b981' },
  'review-request':       { layoutType: 'quote-card',     bgFrom: '#fffbeb', bgTo: '#fef3c7' },
  'voice-testimonial':    { layoutType: 'quote-card',     bgFrom: '#fff1f2', bgTo: '#ffe4e6' },
  'recruit-person':       { layoutType: 'person-info',    bgFrom: '#ffedd5', bgTo: '#fffbeb' },
  'recruit-info':         { layoutType: 'info-list',      bgFrom: '#2563eb', bgTo: '#4f46e5' },
  'shop-intro':           { layoutType: 'shop-hero',      bgFrom: '#44403c', bgTo: '#78716c' },
  'lp-hero':              { layoutType: 'hero-wide',      bgFrom: '#1e293b', bgTo: '#475569' },
  'lp-vertical':          { layoutType: 'lp-stack',       bgFrom: '#f8fafc', bgTo: '#f1f5f9' },
  'pop-store':            { layoutType: 'pop-border',     bgFrom: '#dc2626', bgTo: '#f43f5e' },
  'youtube-thumbnail':    { layoutType: 'youtube-thumb',  bgFrom: '#dc2626', bgTo: '#ef4444' },
  'natural-simple':       { layoutType: 'natural',        bgFrom: '#f0fdf4', bgTo: '#f7fee7' },
}

const TEMPLATES: Template[] = [
  {
    id: 'sns-photo-overlay',
    name: '写真メイン＋テキストオーバーレイ',
    description: '大きな写真の上にキャッチコピーを重ねるSNS定番レイアウト',
    ...TEMPLATE_LAYOUT_MAP['sns-photo-overlay'],
    productionTags: ['SNS投稿画像', '商品紹介', '新商品告知', '季節限定メニュー', 'メニュー紹介'],
    designTags: ['高級感', 'SNS映え', 'インパクト', 'お任せ'],
  },
  {
    id: 'sns-color-text',
    name: 'カラー背景＋テキスト中心',
    description: '鮮やかな背景色に大きなテキストで一目で伝わるデザイン',
    ...TEMPLATE_LAYOUT_MAP['sns-color-text'],
    productionTags: ['SNS投稿画像', 'キャンペーン紹介', 'クーポン告知', 'イベント告知'],
    designTags: ['インパクト', 'SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'sns-grid-layout',
    name: 'グリッド分割レイアウト',
    description: '画像や情報を格子状に並べて整理感を出すレイアウト',
    ...TEMPLATE_LAYOUT_MAP['sns-grid-layout'],
    productionTags: ['メニュー紹介', '商品紹介', 'スタッフ紹介', 'メニュー表作成'],
    designTags: ['シンプル', 'お任せ'],
  },
  {
    id: 'sns-story-vertical',
    name: 'ストーリーズ縦型フルスクリーン',
    description: 'ストーリーズ・リール専用の縦型フルスクリーンデザイン',
    ...TEMPLATE_LAYOUT_MAP['sns-story-vertical'],
    productionTags: ['ストーリーズ画像', 'リールサムネイル', 'LINE登録促進'],
    designTags: ['SNS映え', 'インパクト', 'かわいい', 'お任せ'],
  },
  {
    id: 'campaign-discount',
    name: '割引率・価格を大きく強調',
    description: '「20%OFF」「¥980」など数字を主役にしたキャンペーン訴求',
    ...TEMPLATE_LAYOUT_MAP['campaign-discount'],
    productionTags: ['キャンペーン紹介', 'クーポン告知', '季節限定メニュー'],
    designTags: ['インパクト', 'SNS映え', 'お任せ'],
  },
  {
    id: 'campaign-limited',
    name: '期間限定バナー',
    description: '「〇月〇日まで」の期限と特典を目立たせる限定感バナー',
    ...TEMPLATE_LAYOUT_MAP['campaign-limited'],
    productionTags: ['キャンペーン紹介', 'クーポン告知', 'イベント告知', '季節限定メニュー'],
    designTags: ['インパクト', 'SNS映え', '高級感', 'お任せ'],
  },
  {
    id: 'campaign-stamp',
    name: 'シール・スタンプ風',
    description: 'ポップなスタンプ・シール風デザインで親しみやすい訴求',
    ...TEMPLATE_LAYOUT_MAP['campaign-stamp'],
    productionTags: ['クーポン告知', 'キャンペーン紹介', 'LINE登録促進'],
    designTags: ['かわいい', 'SNS映え', 'お任せ'],
  },
  {
    id: 'product-hero',
    name: '商品ヒーロー写真',
    description: '商品写真を大きく使い、名前と価格をシンプルに添えるレイアウト',
    ...TEMPLATE_LAYOUT_MAP['product-hero'],
    productionTags: ['商品紹介', '新商品告知', 'メニュー紹介', '季節限定メニュー'],
    designTags: ['高級感', 'シンプル', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'menu-grid',
    name: 'メニューグリッド',
    description: '複数メニューを写真付きで一覧表示するメニューボード風',
    ...TEMPLATE_LAYOUT_MAP['menu-grid'],
    productionTags: ['メニュー紹介', 'メニュー表作成', '商品紹介'],
    designTags: ['シンプル', 'ナチュラル', '高級感', 'お任せ'],
  },
  {
    id: 'product-before-after',
    name: 'ビフォーアフター2分割',
    description: '左右または上下に分割して変化・効果をわかりやすく見せる',
    ...TEMPLATE_LAYOUT_MAP['product-before-after'],
    productionTags: ['ビフォーアフター', '商品紹介'],
    designTags: ['シンプル', 'お任せ'],
  },
  {
    id: 'event-calendar',
    name: 'カレンダー・スケジュール表',
    description: '月間予定や営業日をカレンダー形式で一覧表示',
    ...TEMPLATE_LAYOUT_MAP['event-calendar'],
    productionTags: ['今月の予定・営業カレンダー', 'イベント告知'],
    designTags: ['シンプル', 'お任せ'],
  },
  {
    id: 'event-announcement',
    name: 'イベント告知バナー',
    description: '日時・場所・概要を視覚的にわかりやすくまとめた告知デザイン',
    ...TEMPLATE_LAYOUT_MAP['event-announcement'],
    productionTags: ['イベント告知', 'キャンペーン紹介'],
    designTags: ['インパクト', 'SNS映え', 'お任せ'],
  },
  {
    id: 'event-steps',
    name: 'ステップ説明図',
    description: '3〜4ステップで手順や流れをわかりやすく図解するレイアウト',
    ...TEMPLATE_LAYOUT_MAP['event-steps'],
    productionTags: ['LINE登録促進', 'Google口コミ依頼', 'イベント告知'],
    designTags: ['シンプル', 'お任せ'],
  },
  {
    id: 'line-qr',
    name: 'LINE登録QRコード付き',
    description: 'QRコードを大きく配置してLINE友だち追加を促すデザイン',
    ...TEMPLATE_LAYOUT_MAP['line-qr'],
    productionTags: ['LINE登録促進'],
    designTags: ['シンプル', 'インパクト', 'かわいい', 'お任せ'],
  },
  {
    id: 'review-request',
    name: 'クチコミ依頼カード',
    description: '口コミ投稿の方法を丁寧に案内する親しみやすいデザイン',
    ...TEMPLATE_LAYOUT_MAP['review-request'],
    productionTags: ['Google口コミ依頼', 'お客様の声・口コミ紹介'],
    designTags: ['シンプル', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'voice-testimonial',
    name: 'お客様の声カード',
    description: '引用符で囲んだ口コミテキストを写真と共に見せるデザイン',
    ...TEMPLATE_LAYOUT_MAP['voice-testimonial'],
    productionTags: ['お客様の声・口コミ紹介'],
    designTags: ['シンプル', 'ナチュラル', 'かわいい', 'お任せ'],
  },
  {
    id: 'recruit-person',
    name: 'スタッフ・人物写真メイン',
    description: 'スタッフの笑顔写真を大きく使い親しみやすさを演出',
    ...TEMPLATE_LAYOUT_MAP['recruit-person'],
    productionTags: ['スタッフ紹介', '求人募集'],
    designTags: ['ナチュラル', 'かわいい', 'お任せ'],
  },
  {
    id: 'recruit-info',
    name: '求人情報リスト型',
    description: '給与・時間・待遇などをリスト形式で見やすく整理した求人デザイン',
    ...TEMPLATE_LAYOUT_MAP['recruit-info'],
    productionTags: ['求人募集'],
    designTags: ['シンプル', 'インパクト', 'お任せ'],
  },
  {
    id: 'shop-intro',
    name: '店舗・ブランド紹介',
    description: '店舗の雰囲気・強みをビジュアルで伝えるブランド訴求デザイン',
    ...TEMPLATE_LAYOUT_MAP['shop-intro'],
    productionTags: ['店舗紹介'],
    designTags: ['高級感', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'lp-hero',
    name: 'ヒーローバナー（横長）',
    description: 'Webサイトのファーストビューに使うキャッチーな横長バナー',
    ...TEMPLATE_LAYOUT_MAP['lp-hero'],
    productionTags: ['LP風画像', 'バナー画像', 'チラシ作成'],
    designTags: ['高級感', 'インパクト', 'お任せ'],
  },
  {
    id: 'lp-vertical',
    name: '縦型LP風',
    description: '情報をスクロール形式で上から下へ流す縦長のLP風デザイン',
    ...TEMPLATE_LAYOUT_MAP['lp-vertical'],
    productionTags: ['LP風画像', 'チラシ作成'],
    designTags: ['シンプル', 'お任せ'],
  },
  {
    id: 'pop-store',
    name: '店内POP・ポスター',
    description: '店頭・レジ周りに置くPOP向けのシンプルで目立つデザイン',
    ...TEMPLATE_LAYOUT_MAP['pop-store'],
    productionTags: ['POP作成', 'クーポン告知', 'キャンペーン紹介'],
    designTags: ['インパクト', 'かわいい', 'お任せ'],
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTubeサムネイル',
    description: 'クリックしたくなるYouTubeサムネイル専用レイアウト',
    ...TEMPLATE_LAYOUT_MAP['youtube-thumbnail'],
    productionTags: ['YouTubeサムネイル', 'リールサムネイル'],
    designTags: ['インパクト', 'SNS映え', 'お任せ'],
  },
  {
    id: 'natural-simple',
    name: 'ナチュラル・手書き風',
    description: '温かみのある手書き風フォントと自然色を使ったほっこりデザイン',
    ...TEMPLATE_LAYOUT_MAP['natural-simple'],
    productionTags: ['商品紹介', 'メニュー紹介', '店舗紹介', 'お客様の声・口コミ紹介'],
    designTags: ['ナチュラル', 'かわいい', 'お任せ'],
  },
]

// ─── テンプレートレコメンドロジック ───────────────────────────────────
function getFilteredTemplates(
  productionTypes: string[],
  designFilter: string,
): Template[] {
  return TEMPLATES.filter(t => {
    if (designFilter && designFilter !== 'お任せ') {
      if (!t.designTags.includes(designFilter) && !t.designTags.includes('お任せ')) return false
    }
    return true
  }).sort((a, b) => {
    const aMatch = productionTypes.filter(pt =>
      a.productionTags.some(tag => pt.includes(tag) || tag.includes(pt))
    ).length
    const bMatch = productionTypes.filter(pt =>
      b.productionTags.some(tag => pt.includes(tag) || tag.includes(pt))
    ).length
    return bMatch - aMatch
  })
}

// ─── 型定義 ──────────────────────────────────────────────────────────
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
}

// ─── UIコンポーネント ─────────────────────────────────────────────────
function CheckGroup({ options, selected, onChange }: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            selected.includes(opt)
              ? 'bg-[#E60023] text-white border-[#E60023] shadow-sm'
              : 'bg-white text-[#767676] border-[#EFEFEF] hover:border-[#E60023] hover:text-[#E60023]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── テンプレートカード ───────────────────────────────────────────────
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
          ? 'border-[#E60023] shadow-lg shadow-red-100 scale-[1.02]'
          : 'border-[#EFEFEF] hover:border-[#E60023]/50'
      }`}
    >
      {/* SVGプレビュー */}
      <div className="relative">
        <TemplatePreview
          layoutType={template.layoutType}
          bgFrom={template.bgFrom}
          bgTo={template.bgTo}
        />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-[#E60023] rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
            ✓
          </div>
        )}
      </div>
      {/* 情報 */}
      <div className="p-3 bg-white">
        <p className="text-xs font-black text-[#111111] leading-tight mb-1">{template.name}</p>
        <p className="text-[10px] text-[#767676] leading-snug">{template.description}</p>
      </div>
    </button>
  )
}

// ─── メインフォーム ───────────────────────────────────────────────────
export default function ImageRequestForm({ onSubmit, onCancel, loading }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<RequestFormData>(initial)
  const [error, setError] = useState('')
  const [designFilter, setDesignFilter] = useState('お任せ')

  const update = <K extends keyof RequestFormData>(key: K, val: RequestFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const filteredTemplates = getFilteredTemplates(form.production_types, designFilter)

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
    }
    setError(''); return true
  }

  const handleNext = () => { if (validate()) setStep(s => s + 1) }

  const handleSubmit = async () => {
    if (!validate()) return
    await onSubmit({
      ...form,
      production_types: form.production_types_other
        ? [...form.production_types, `その他: ${form.production_types_other}`]
        : form.production_types,
    })
  }

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-bold text-[#111111] mb-2">
        {label} {required && <span className="text-[#E60023]">*</span>}
      </label>
      {children}
    </div>
  )

  const inputClass = "w-full border border-[#EFEFEF] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all bg-[#FAFAFA]"
  const textareaClass = `${inputClass} resize-none`

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-[#E60023] text-white' :
              i === step ? 'bg-[#E60023] text-white ring-4 ring-[#FFE8EC]' :
              'bg-[#EFEFEF] text-[#ABABAB]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-1 text-xs hidden sm:block truncate max-w-[80px] ${i <= step ? 'text-[#E60023] font-semibold' : 'text-[#ABABAB]'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-1.5 flex-shrink-0 ${i < step ? 'bg-[#E60023]' : 'bg-[#EFEFEF]'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-[#FFE8EC] border border-red-100 text-[#E60023] rounded-xl px-4 py-2.5 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step 0: 制作内容 */}
      {step === 0 && (
        <div className="space-y-5">
          <Field label="制作内容を選択（複数可）" required>
            <CheckGroup options={PRODUCTION_TYPES} selected={form.production_types} onChange={v => update('production_types', v)} />
            <input
              type="text"
              value={form.production_types_other}
              onChange={e => update('production_types_other', e.target.value)}
              placeholder="その他（自由入力）"
              className={`mt-2 ${inputClass}`}
            />
            {form.production_types.length > 0 && (
              <p className="text-xs text-[#E60023] mt-1 font-semibold">選択中: {form.production_types.length}件</p>
            )}
          </Field>
        </div>
      )}

      {/* Step 1: テンプレート選択 */}
      {step === 1 && (
        <div className="space-y-4">
          {/* デザインフィルター */}
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
                      ? 'bg-[#E60023] text-white border-[#E60023] shadow-sm'
                      : 'bg-white text-[#767676] border-[#EFEFEF] hover:border-[#E60023] hover:text-[#E60023]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* テンプレートグリッド */}
          <div>
            <p className="text-xs font-bold text-[#111111] mb-3">
              テンプレートを選択 <span className="text-[#E60023]">*</span>
              <span className="text-[#767676] font-normal ml-1">（{filteredTemplates.length}件表示中）</span>
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
            <div className="bg-[#FFE8EC] rounded-xl px-4 py-3 text-xs text-[#E60023] font-semibold">
              ✓ 選択中：{form.template_name}
            </div>
          )}
        </div>
      )}

      {/* Step 2: 詳細入力 + 確認 */}
      {step === 2 && (
        <div className="space-y-5">
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
                    className="accent-[#E60023]"
                  />
                  <span className={`text-sm transition-colors ${form.image_size === s.value ? 'text-[#E60023] font-semibold' : 'text-[#767676]'}`}>{s.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="テキスト内容">
            <textarea
              value={form.text_content}
              onChange={e => update('text_content', e.target.value)}
              rows={3}
              placeholder="画像に入れたい文言、キャッチコピー、日付など"
              className={textareaClass}
            />
          </Field>

          <Field label="素材アップロード（ロゴ・写真など）">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.ai"
              onChange={e => update('materialFiles', Array.from(e.target.files ?? []))}
              className="w-full text-sm text-[#767676] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFE8EC] file:text-[#E60023] hover:file:bg-red-100"
            />
            <p className="text-xs text-[#ABABAB] mt-1">jpg/png/ai/pdf・最大10MB</p>
          </Field>

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
                    className="accent-[#E60023]"
                  />
                  <span className={`text-sm ${form.delivery_speed === s.value ? 'text-[#E60023] font-semibold' : 'text-[#767676]'}`}>{s.label}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* 確認サマリー */}
          <div className="bg-[#F1EFEF] rounded-2xl p-4 space-y-2 text-sm">
            <p className="text-xs font-bold text-[#111111] mb-3">依頼内容の確認</p>
            {[
              ['制作内容', [...form.production_types, form.production_types_other ? `その他: ${form.production_types_other}` : ''].filter(Boolean).join('、') || '未選択'],
              ['テンプレート', form.template_name || '未選択'],
              ['サイズ', form.image_size || '未選択'],
              ['テキスト', form.text_content || 'なし'],
              ['素材ファイル', form.materialFiles.length > 0 ? form.materialFiles.map(f => f.name).join(', ') : 'なし'],
              ['納期', form.delivery_speed],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-[#767676] flex-shrink-0 w-24 text-xs font-semibold">{label}</span>
                <span className="text-[#111111] break-all text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(s => s - 1)}
            className="flex-1 border border-[#EFEFEF] text-[#767676] font-semibold py-3 rounded-full hover:bg-[#F1EFEF] transition-all">
            戻る
          </button>
        ) : (
          <button type="button" onClick={onCancel}
            className="flex-1 border border-[#EFEFEF] text-[#767676] font-semibold py-3 rounded-full hover:bg-[#F1EFEF] transition-all">
            キャンセル
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={handleNext}
            className="flex-1 bg-[#E60023] text-white font-bold py-3 rounded-full hover:bg-[#C0001E] transition-all shadow-md shadow-red-100">
            次へ
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-[#E60023] text-white font-bold py-3 rounded-full hover:bg-[#C0001E] transition-all disabled:opacity-50 shadow-md shadow-red-100">
            {loading ? '送信中...' : '依頼を確定する'}
          </button>
        )}
      </div>
    </div>
  )
}
