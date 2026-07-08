'use client'

import { useState, useCallback, useEffect } from 'react'
import { TemplatePreview } from '@/components/ui/TemplatePreview'
import { DesignCanvas } from '@/components/ui/DesignCanvas'
import { createClient } from '@/lib/supabase'
import { TEMPLATE_FIELDS, buildPrompt, mergeFieldDefaults } from '@/lib/design-prompts'

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
    types: ['LINE登録促進', 'Google口コミ依頼', '営業カレンダー・スケジュール', 'イベント告知'],
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
]

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
  const [step, setStep] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAccessToken(session?.access_token ?? null)
    })
  }, [])
  const [form, setForm] = useState<RequestFormData>(initial)
  const [error, setError] = useState('')
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

          <Field label={templateFields ? '商品写真アップロード（推奨）' : '素材アップロード（ロゴ・写真など）'}>
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
                        <p className="text-sm text-[#6B7280]">デザインを制作しています…<br />（十数秒お待ちください）</p>
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
