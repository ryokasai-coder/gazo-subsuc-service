'use client'

import { useState } from 'react'

const STEPS = ['制作内容', '目的・ターゲット', 'テキスト・素材', '確認']

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

export interface RequestFormData {
  production_types: string[]
  production_types_other: string
  production_purpose: string[]
  design_image: string
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

export default function ImageRequestForm({ onSubmit, onCancel, loading }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<RequestFormData>(initial)
  const [error, setError] = useState('')

  const update = <K extends keyof RequestFormData>(key: K, val: RequestFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

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
      <div className="flex items-center mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-[#E60023] text-white' :
              i === step ? 'bg-[#E60023] text-white ring-4 ring-[#FFE8EC]' :
              'bg-[#EFEFEF] text-[#ABABAB]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-1 text-xs hidden sm:block truncate ${i <= step ? 'text-[#E60023] font-semibold' : 'text-[#ABABAB]'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-[#E60023]' : 'bg-[#EFEFEF]'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-[#FFE8EC] border border-red-100 text-[#E60023] rounded-xl px-4 py-2.5 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step 0 */}
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

      {/* Step 1 */}
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

      {/* Step 2 */}
      {step === 2 && (
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

      {/* Step 3: 確認 */}
      {step === 3 && (
        <div className="bg-[#F1EFEF] rounded-2xl p-4 space-y-2 text-sm max-h-80 overflow-y-auto">
          {[
            ['制作内容', [...form.production_types, form.production_types_other ? `その他: ${form.production_types_other}` : ''].filter(Boolean).join('、') || '未選択'],
            ['制作目的', form.production_purpose.join('、') || '未選択'],
            ['デザインイメージ', form.design_image || '未選択'],
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
