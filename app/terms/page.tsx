import Link from 'next/link'
import type { Metadata } from 'next'
import { TERMS_SECTIONS, TERMS_INTRO, TERMS_EFFECTIVE_DATE } from '@/lib/legal'

export const metadata: Metadata = {
  title: '利用規約 | DESIGN BOX',
  description: 'DESIGN BOX（画像制作サブスクサービス）の利用規約です。',
}

// 利用規約（公開ページ）
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F8FA]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="DESIGN BOX ホーム">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="DESIGN BOX" className="h-7 w-auto" />
          </Link>
          <Link href="/" className="text-xs text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all">
            ← トップへ
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#111111]">利用規約</h1>
          <p className="text-xs text-[#ABABAB] mt-1">最終改定日：{TERMS_EFFECTIVE_DATE}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
          <p className="text-sm text-[#111111] leading-relaxed mb-6">{TERMS_INTRO}</p>

          <div className="space-y-6">
            {TERMS_SECTIONS.map(section => (
              <section key={section.article}>
                <h2 className="text-sm font-bold text-[#111111] mb-2">
                  {section.article}（{section.title}）
                </h2>
                <div className="space-y-1.5">
                  {section.body.map((p, i) => (
                    <p key={i} className="text-sm text-[#6B7280] leading-relaxed">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="text-sm text-[#6B7280] mt-8 text-right">以上</p>
        </div>
      </div>
    </div>
  )
}
