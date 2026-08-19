import Link from 'next/link'

// 契約・解約系サブページ共通ヘッダー（戻るリンク付き）
export default function SubPageHeader({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="DESIGN BOX ホーム">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="DESIGN BOX" className="h-7 w-auto" />
        </Link>
        <Link href={backHref} className="text-xs text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all">
          ← {backLabel}
        </Link>
      </div>
    </header>
  )
}
