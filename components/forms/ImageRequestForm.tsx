'use client'

import { useState } from 'react'

const STEPS = ['制作内容', 'デザイン・サイズ', 'テンプレート', 'テキスト・素材', '確認']

const PRODUCTION_TYPES = [
  '今月の予定・営業カレンダー', '商品紹介', 'メニュー紹介', 'キャンペーン紹介',
  'クーポン告知', 'LINE登録促進', 'Google口コミ依頼', 'イベント告知',
  '新商品告知', '季節限定メニュー', 'スタッフ紹介', '店舗紹介',
  'お客様の声・口コミ紹介', 'ビフォーアフター', '求人募集', 'LP風画像',
  'バナー画像', 'POP作成', 'メニュー表作成', 'チラシ作成',
  'SNS投稿画像', 'ストーリーズ画像', 'リールサムネイル', 'YouTubeサムネイル',
]

const PURPOSES = [
  '集客', '来店促進', 'LINE登録', 'Google口コミ獲得', '認知拡大',
  '採用', 'リピート促進', '商品販売', 'お任せ',
]

const DESIGN_IMAGES = [
  { label: '高級感', emoji: '✨' },
  { label: 'シンプル', emoji: '⬜' },
  { label: 'インパクト重視', emoji: '⚡' },
  { label: 'SNS映え', emoji: '📸' },
  { label: '信頼感', emoji: '🏢' },
  { label: 'かわいい', emoji: '🌸' },
  { label: 'ナチュラル', emoji: '🌿' },
  { label: 'お任せ', emoji: '🎨' },
]

const TARGETS = ['新規客', 'リピーター', '常連客', '求職者', '法人・企業', 'お任せ']

const MEDIA_TYPES = [
  'Instagramフィード', 'Instagramストーリーズ', 'Instagramリール',
  'LINE', 'Googleビジネスプロフィール', 'Webサイト・LP',
  'チラシ・フライヤー', '店内POP・ポスター', 'YouTube', 'その他',
]

const IMAGE_SIZES = [
  { label: '正方形 (1080×1080)', value: '正方形(1080x1080px)' },
  { label: '縦長 (1080×1350)', value: '縦長(1080x1350px)' },
  { label: 'ストーリーズ (1080×1920)', value: 'ストーリーズ(1080x1920px)' },
  { label: '横長 (1200×628)', value: '横長(1200x628px)' },
  { label: 'カスタム', value: 'カスタム' },
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
  layoutIcon: string        // レイアウトを表す絵文字
  bgColor: string           // プレビュー背景色
  accentColor: string       // アクセントカラー（Tailwind class）
  productionTags: string[]  // 対応する制作内容キーワード
  designTags: string[]      // 対応するデザインイメージ（空=全対応）
}

const TEMPLATES: Template[] = [
  // ── SNS・フィード系 ──
  {
    id: 'sns-photo-overlay',
    name: '写真メイン＋テキストオーバーレイ',
    description: '大きな写真の上にキャッチコピーを重ねるSNS定番レイアウト',
    layoutIcon: '🖼️',
    bgColor: 'bg-gradient-to-br from-gray-800 to-gray-600',
    accentColor: 'text-white',
    productionTags: ['SNS投稿画像', '商品紹介', '新商品告知', '季節限定メニュー', 'メニュー紹介'],
    designTags: ['高級感', 'SNS映え', 'インパクト重視', 'お任せ'],
  },
  {
    id: 'sns-color-text',
    name: 'カラー背景＋テキスト中心',
    description: '鮮やかな背景色に大きなテキストで一目で伝わるデザイン',
    layoutIcon: '🎨',
    bgColor: 'bg-gradient-to-br from-rose-500 to-pink-400',
    accentColor: 'text-white',
    productionTags: ['SNS投稿画像', 'キャンペーン紹介', 'クーポン告知', 'イベント告知'],
    designTags: ['インパクト重視', 'SNS映え', 'かわいい', 'お任せ'],
  },
  {
    id: 'sns-grid-layout',
    name: 'グリッド分割レイアウト',
    description: '画像や情報を格子状に並べて整理感を出すレイアウト',
    layoutIcon: '▦',
    bgColor: 'bg-gradient-to-br from-slate-100 to-slate-200',
    accentColor: 'text-slate-700',
    productionTags: ['メニュー紹介', '商品紹介', 'スタッフ紹介', 'メニュー表作成'],
    designTags: ['シンプル', '信頼感', 'お任せ'],
  },
  {
    id: 'sns-story-vertical',
    name: 'ストーリーズ縦型フルスクリーン',
    description: 'ストーリーズ・リール専用の縦型フルスクリーンデザイン',
    layoutIcon: '📱',
    bgColor: 'bg-gradient-to-b from-purple-600 to-pink-500',
    accentColor: 'text-white',
    productionTags: ['ストーリーズ画像', 'リールサムネイル', 'LINE登録促進'],
    designTags: ['SNS映え', 'インパクト重視', 'かわいい', 'お任せ'],
  },

  // ── キャンペーン・クーポン系 ──
  {
    id: 'campaign-discount',
    name: '割引率・価格を大きく強調',
    description: '「20%OFF」「¥980」など数字を主役にしたキャンペーン訴求',
    layoutIcon: '🏷️',
    bgColor: 'bg-gradient-to-br from-red-500 to-orange-400',
    accentColor: 'text-white',
    productionTags: ['キャンペーン紹介', 'クーポン告知', '季節限定メニュー'],
    designTags: ['インパクト重視', 'SNS映え', 'お任せ'],
  },
  {
    id: 'campaign-limited',
    name: '期間限定バナー',
    description: '「〇月〇日まで」の期限と特典を目立たせる限定感バナー',
    layoutIcon: '⏰',
    bgColor: 'bg-gradient-to-br from-amber-500 to-yellow-400',
    accentColor: 'text-white',
    productionTags: ['キャンペーン紹介', 'クーポン告知', 'イベント告知', '季節限定メニュー'],
    designTags: ['インパクト重視', 'SNS映え', '高級感', 'お任せ'],
  },
  {
    id: 'campaign-stamp',
    name: 'シール・スタンプ風',
    description: 'ポップなスタンプ・シール風デザインで親しみやすい訴求',
    layoutIcon: '🏅',
    bgColor: 'bg-gradient-to-br from-green-400 to-teal-400',
    accentColor: 'text-white',
    productionTags: ['クーポン告知', 'キャンペーン紹介', 'LINE登録促進'],
    designTags: ['かわいい', 'SNS映え', 'お任せ'],
  },

  // ── 商品・メニュー系 ──
  {
    id: 'product-hero',
    name: '商品ヒーロー写真',
    description: '商品写真を大きく使い、名前と価格をシンプルに添えるレイアウト',
    layoutIcon: '🛍️',
    bgColor: 'bg-gradient-to-br from-stone-100 to-amber-50',
    accentColor: 'text-stone-800',
    productionTags: ['商品紹介', '新商品告知', 'メニュー紹介', '季節限定メニュー'],
    designTags: ['高級感', 'シンプル', 'ナチュラル', 'お任せ'],
  },
  {
    id: 'menu-grid',
    name: 'メニューグリッド',
    description: '複数メニューを写真付きで一覧表示するメニューボード風',
    layoutIcon: '🍽️',
    bgColor: 'bg-gradient-to-br from-orange-50 to-amber-100',
    accentColor: 'text-orange-900',
    productionTags: ['メニュー紹介', 'メニュー表作成', '商品紹介'],
    designTags: ['シンプル', 'ナチュラル', '高級感', 'お任せ'],
  },
  {
    id: 'product-before-after',
    name: 'ビフォーアフター2分割',
    description: '左右または上下に分割して変化・効果をわかりやすく見せる',
    layoutIcon: '↔️',
    bgColor: 'bg-gradient-to-r from-gray-200 to-blue-100',
    accentColor: 'text-gray-800',
    productionTags: ['ビフォーアフター', '商品紹介'],
    designTags: ['シンプル', '信頼感', 'お任せ'],
  },

  // ── 告知・イベント系 ──
  {
    id: 'event-calendar',
    name: 'カレンダー・スケジュール表',
    description: '月間予定や営業日をカレンダー形式で一覧表示',
    layoutIcon: '📅',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    accentColor: 'text-indigo-900',
    productionTags: ['今月の予定・営業カレンダー', 'イベント告知'],
    designTags: ['シンプル', '信頼感', 'お任せ'],
  },
  {
    id: 'event-announcement',
    name: 'イベント告知バナー',
    description: '日時・場所・概要を視覚的にわかりやすくまとめた告知デザイン',
    layoutIcon: '📣',
    bgColor: 'bg-gradient-to-br from-violet-500 to-purple-400',
    accentColor: 'text-white',
    productionTags: ['イベント告知', 'キャンペーン紹介'],
    designTags: ['インパクト重視', 'SNS映え', 'お任せ'],
  },
  {
    id: 'event-steps',
    name: 'ステップ説明図',
    description: '3〜4ステップで手順や流れをわかりやすく図解するレイアウト',
    layoutIcon: '➡️',
    bgColor: 'bg-gradient-to-br from-sky-100 to-cyan-100',
    accentColor: 'text-sky-900',
    productionTags: ['LINE登録促進', 'Google口コミ依頼', 'イベント告知'],
    designTags: ['シンプル', '信頼感', 'お任せ'],
  },

  // ── 集客・SNS系 ──
  {
    id: 'line-qr',
    name: 'LINE登録QRコード付き',
    description: 'QRコードを大きく配置してLINE友だち追加を促すデザイン',
    layoutIcon: '📲',
    bgColor: 'bg-gradient-to-br from-green-500 to-emerald-400',
    accentColor: 'text-white',
    productionTags: ['LINE登録促進'],
    designTags: ['シンプル', 'インパクト重視', 'かわいい', 'お任せ'],
  },
  {
    id: 'review-request',
    name: 'クチコミ依頼カード',
    description: '口コミ投稿の方法を丁寧に案内する親しみやすいデザイン',
    layoutIcon: '⭐',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    accentColor: 'text-amber-900',
    productionTags: ['Google口コミ依頼', 'お客様の声・口コミ紹介'],
    designTags: ['シンプル', 'ナチュラル', '信頼感', 'お任せ'],
  },
  {
    id: 'voice-testimonial',
    name: 'お客様の声カード',
    description: '引用符で囲んだ口コミテキストを写真と共に見せるデザイン',
    layoutIcon: '💬',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-100',
    accentColor: 'text-rose-800',
    productionTags: ['お客様の声・口コミ紹介'],
    designTags: ['シンプル', 'ナチュラル', 'かわいい', 'お任せ'],
  },

  // ── 採用・スタッフ系 ──
  {
    id: 'recruit-person',
    name: 'スタッフ・人物写真メイン',
    description: 'スタッフの笑顔写真を大きく使い親しみやすさを演出',
    layoutIcon: '👤',
    bgColor: 'bg-gradient-to-br from-orange-100 to-amber-50',
    accentColor: 'text-orange-900',
    productionTags: ['スタッフ紹介', '求人募集'],
    designTags: ['ナチュラル', 'かわいい', '信頼感', 'お任せ'],
  },
  {
    id: 'recruit-info',
    name: '求人情報リスト型',
    description: '給与・時間・待遇などをリスト形式で見やすく整理した求人デザイン',
    layoutIcon: '📋',
    bgColor: 'bg-gradient-to-br from-blue-600 to-indigo-500',
    accentColor: 'text-white',
    productionTags: ['求人募集'],
    designTags: ['信頼感', 'シンプル', 'インパクト重視', 'お任せ'],
  },

  // ── 店舗・ブランド系 ──
  {
    id: 'shop-intro',
    name: '店舗・ブランド紹介',
    description: '店舗の雰囲気・強みをビジュアルで伝えるブランド訴求デザイン',
    layoutIcon: '🏪',
    bgColor: 'bg-gradient-to-br from-stone-700 to-stone-500',
    accentColor: 'text-white',
    productionTags: ['店舗紹介'],
    designTags: ['高級感', '信頼感', 'ナチュラル', 'お任せ'],
  },

  // ── LP・バナー系 ──
  {
    id: 'lp-hero',
    name: 'ヒーローバナー（横長）',
    description: 'Webサイトのファーストビューに使うキャッチーな横長バナー',
    layoutIcon: '🖥️',
    bgColor: 'bg-gradient-to-r from-slate-800 to-slate-600',
    accentColor: 'text-white',
    productionTags: ['LP風画像', 'バナー画像', 'チラシ作成'],
    designTags: ['高級感', '信頼感', 'インパクト重視', 'お任せ'],
  },
  {
    id: 'lp-vertical',
    name: '縦型LP風',
    description: '情報をスクロール形式で上から下へ流す縦長のLP風デザイン',
    layoutIcon: '📄',
    bgColor: 'bg-gradient-to-b from-white to-gray-50',
    accentColor: 'text-gray-800',
    productionTags: ['LP風画像', 'チラシ作成'],
    designTags: ['シンプル', '信頼感', 'お任せ'],
  },
  {
    id: 'pop-store',
    name: '店内POP・ポスター',
    description: '店頭・レジ周りに置くPOP向けのシンプルで目立つデザイン',
    layoutIcon: '🪧',
    bgColor: 'bg-gradient-to-br from-red-600 to-rose-500',
    accentColor: 'text-white',
    productionTags: ['POP作成', 'クーポン告知', 'キャンペーン紹介'],
    designTags: ['インパクト重視', 'かわいい', 'お任せ'],
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTubeサムネイル',
    description: 'クリックしたくなるYouTubeサムネイル専用レイアウト',
    layoutIcon: '▶️',
    bgColor: 'bg-gradient-to-br from-red-600 to-red-400',
    accentColor: 'text-white',
    productionTags: ['YouTubeサムネイル', 'リールサムネイル'],
    designTags: ['インパクト重視', 'SNS映え', 'お任せ'],
  },
  {
    id: 'natural-simple',
    name: 'ナチュラル・手書き風',
    description: '温かみのある手書き風フォントと自然色を使ったほっこりデザイン',
    layoutIcon: '🌿',
    bgColor: 'bg-gradient-to-br from-green-50 to-lime-100',
    accentColor: 'text-green-800',
    productionTags: ['商品紹介', 'メニュー紹介', '店舗紹介', 'お客様の声・口コミ紹介'],
    designTags: ['ナチュラル', 'かわいい', 'お任せ'],
  },
]

// ─── テンプレートレコメンドロジック ───────────────────────────────────
function getRecommendedTemplates(productionTypes: string[], designImage: string): Template[] {
  const scored = TEMPLATES.map(t => {
    let score = 0
    // 制作内容マッチ（最重要）
    const typeMatch = productionTypes.filter(pt =>
      t.productionTags.some(tag => pt.includes(tag) || tag.includes(pt))
    ).length
    score += typeMatch * 10

    // デザインイメージマッチ
    if (t.designTags.length === 0 || t.designTags.includes(designImage)) {
      score += 5
    }
    if (t.designTags.includes('お任せ')) {
      score += 1 // 汎用テンプレートは少し加点
    }

    return { template: t, score }
  })

  // スコア順にソートし、上位6件返す（スコア0以上のもの）
  const filtered = scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(x => x.template)

  // 6件未満なら「お任せ」系で補完
  if (filtered.length < 3) {
    const fallbacks = TEMPLATES.filter(
      t => t.designTags.includes('お任せ') && !filtered.find(f => f.id === t.id)
    ).slice(0, 3 - filtered.length)
    return [...filtered, ...fallbacks]
  }

  return filtered
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

function RadioGroup({ options, selected, onChange }: {
  options: string[]
  selected: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            selected === opt
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
      {/* プレビュー */}
      <div className={`${template.bgColor} h-24 flex items-center justify-center relative`}>
        <span className="text-4xl">{template.layoutIcon}</span>
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

  const update = <K extends keyof RequestFormData>(key: K, val: RequestFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // Step2で表示するテンプレート
  const recommendedTemplates = getRecommendedTemplates(form.production_types, form.design_image)

  const validate = () => {
    if (step === 0) {
      const types = form.production_types_other
        ? [...form.production_types, form.production_types_other]
        : form.production_types
      if (types.length === 0) { setError('制作内容を1つ以上選択してください'); return false }
    }
    if (step === 1) {
      if (!form.design_image) { setError('デザインイメージを選択してください'); return false }
      if (!form.image_size) { setError('画像サイズを選択してください'); return false }
    }
    if (step === 2) {
      if (!form.template_id) { setError('テンプレートを1つ選択してください'); return false }
    }
    setError(''); return true
  }

  const handleNext = () => { if (validate()) setStep(s => s + 1) }

  const handleSubmit = async () => {
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
      <div className="flex items-center mb-5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-[#E60023] text-white' :
              i === step ? 'bg-[#E60023] text-white ring-4 ring-[#FFE8EC]' :
              'bg-[#EFEFEF] text-[#ABABAB]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-1 text-xs hidden sm:block truncate max-w-[60px] ${i <= step ? 'text-[#E60023] font-semibold' : 'text-[#ABABAB]'}`}>{s}</span>
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
          <Field label="① 制作内容を選択（複数可）" required>
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

          <Field label="② 制作目的（複数可）">
            <CheckGroup options={PURPOSES} selected={form.production_purpose} onChange={v => update('production_purpose', v)} />
          </Field>
        </div>
      )}

      {/* Step 1: デザイン・サイズ */}
      {step === 1 && (
        <div className="space-y-5">
          <Field label="③ デザインイメージ" required>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DESIGN_IMAGES.map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => update('design_image', d.label)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    form.design_image === d.label
                      ? 'bg-[#FFE8EC] border-[#E60023] text-[#E60023]'
                      : 'bg-[#FAFAFA] border-[#EFEFEF] text-[#767676] hover:border-[#E60023]'
                  }`}
                >
                  <div className="text-xl mb-1">{d.emoji}</div>
                  <div className="text-xs font-semibold">{d.label}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="④ ターゲット">
            <RadioGroup options={TARGETS} selected={form.target} onChange={v => update('target', v)} />
          </Field>

          <Field label="⑤ 掲載予定の媒体（複数可）">
            <CheckGroup options={MEDIA_TYPES} selected={form.media_types} onChange={v => update('media_types', v)} />
          </Field>

          <Field label="⑥ 画像サイズ" required>
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
            {form.image_size === 'カスタム' && (
              <input type="text" value={form.custom_size} onChange={e => update('custom_size', e.target.value)} placeholder="例: 800x600px" className={`mt-2 ${inputClass}`} />
            )}
          </Field>
        </div>
      )}

      {/* Step 2: テンプレート選択 */}
      {step === 2 && (
        <div className="space-y-4">
          {/* 選択サマリ */}
          <div className="bg-[#F1EFEF] rounded-2xl px-4 py-3 text-xs text-[#767676] flex flex-wrap gap-2 items-center">
            <span className="font-bold text-[#111111]">選択内容：</span>
            {form.production_types.slice(0, 2).map(t => (
              <span key={t} className="bg-[#E60023]/10 text-[#E60023] px-2 py-0.5 rounded-full font-semibold">{t}</span>
            ))}
            {form.production_types.length > 2 && (
              <span className="text-[#ABABAB]">他{form.production_types.length - 2}件</span>
            )}
            {form.design_image && (
              <span className="bg-[#111111]/10 text-[#111111] px-2 py-0.5 rounded-full font-semibold">{form.design_image}</span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-[#111111] mb-3">
              おすすめテンプレート <span className="text-[#E60023]">*</span>
              <span className="text-[#767676] font-normal ml-1">— 選択内容に合うパターンを表示しています</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recommendedTemplates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={form.template_id === t.id}
                  onSelect={() => {
                    update('template_id', t.id)
                    update('template_name', t.name)
                  }}
                />
              ))}
            </div>
          </div>

          {/* すべて見る */}
          <details className="mt-2">
            <summary className="text-xs text-[#767676] cursor-pointer hover:text-[#E60023] transition-colors font-semibold">
              全テンプレートから選ぶ（{TEMPLATES.length}種類）
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              {TEMPLATES.filter(t => !recommendedTemplates.find(r => r.id === t.id)).map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={form.template_id === t.id}
                  onSelect={() => {
                    update('template_id', t.id)
                    update('template_name', t.name)
                  }}
                />
              ))}
            </div>
          </details>

          {form.template_id && (
            <div className="bg-[#FFE8EC] rounded-xl px-4 py-3 text-xs text-[#E60023] font-semibold">
              ✓ 選択中：{form.template_name}
            </div>
          )}
        </div>
      )}

      {/* Step 3: テキスト・素材 */}
      {step === 3 && (
        <div className="space-y-5">
          <Field label="⑦ テキスト・内容">
            <textarea value={form.text_content} onChange={e => update('text_content', e.target.value)} rows={3} placeholder="画像に入れたい文言、キャッチコピー、日付など" className={textareaClass} />
          </Field>

          <Field label="⑧ 使用素材アップロード（ロゴ・写真など）">
            <input type="file" multiple accept="image/*,.pdf,.ai" onChange={e => update('materialFiles', Array.from(e.target.files ?? []))}
              className="w-full text-sm text-[#767676] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFE8EC] file:text-[#E60023] hover:file:bg-red-100" />
            <p className="text-xs text-[#ABABAB] mt-1">jpg/png/ai/pdf・最大10MB</p>
          </Field>

          <Field label="⑨ 参考画像アップロード">
            <input type="file" multiple accept="image/*,.pdf" onChange={e => update('referenceFiles', Array.from(e.target.files ?? []))}
              className="w-full text-sm text-[#767676] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFE8EC] file:text-[#E60023] hover:file:bg-red-100" />
            <p className="text-xs text-[#ABABAB] mt-1">jpg/png/ai/pdf・最大10MB</p>
          </Field>

          <Field label="⑩ CTAアクション（誘導先・ボタンテキスト）">
            <textarea value={form.cta_action} onChange={e => update('cta_action', e.target.value)} rows={2} placeholder="例: 「詳しくはプロフィールのURLへ」「LINEで予約する」" className={textareaClass} />
          </Field>

          <Field label="⑪ 希望納期">
            <div className="space-y-2">
              {DELIVERY_SPEEDS.map(s => (
                <label key={s.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="delivery_speed" value={s.value} checked={form.delivery_speed === s.value} onChange={() => update('delivery_speed', s.value)} className="accent-[#E60023]" />
                  <span className={`text-sm ${form.delivery_speed === s.value ? 'text-[#E60023] font-semibold' : 'text-[#767676]'}`}>{s.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="⑫ その他要望">
            <textarea value={form.other_requests} onChange={e => update('other_requests', e.target.value)} rows={3} placeholder="その他ご要望があればご記入ください" className={textareaClass} />
          </Field>
        </div>
      )}

      {/* Step 4: 確認 */}
      {step === 4 && (
        <div className="bg-[#F1EFEF] rounded-2xl p-4 space-y-2 text-sm max-h-80 overflow-y-auto">
          {[
            ['制作内容', [...form.production_types, form.production_types_other ? `その他: ${form.production_types_other}` : ''].filter(Boolean).join('、') || '未選択'],
            ['制作目的', form.production_purpose.join('、') || '未選択'],
            ['デザインイメージ', form.design_image || '未選択'],
            ['テンプレート', form.template_name || '未選択'],
            ['ターゲット', form.target || '未選択'],
            ['媒体', form.media_types.join('、') || '未選択'],
            ['サイズ', form.image_size === 'カスタム' ? `カスタム: ${form.custom_size}` : form.image_size || '未選択'],
            ['テキスト', form.text_content || 'なし'],
            ['CTAアクション', form.cta_action || 'なし'],
            ['希望納期', form.delivery_speed || '未選択'],
            ['その他要望', form.other_requests || 'なし'],
            ['素材ファイル', form.materialFiles.length > 0 ? form.materialFiles.map(f => f.name).join(', ') : 'なし'],
            ['参考画像', form.referenceFiles.length > 0 ? form.referenceFiles.map(f => f.name).join(', ') : 'なし'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className="text-[#767676] flex-shrink-0 w-28 text-xs font-semibold">{label}</span>
              <span className="text-[#111111] break-all text-xs">{value}</span>
            </div>
          ))}
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
