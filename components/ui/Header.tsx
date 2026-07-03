'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/** DESIGNBOX 公式ロゴ（横型・アイコン＋ワードマーク） */
function BrandLogo() {
  return (
    <Link href="/" className="flex items-center select-none" aria-label="DESIGN BOX ホーム">
      <Image
        src="/logo-horizontal.png"
        alt="DESIGN BOX"
        width={480}
        height={199}
        priority
        className="h-8 w-auto"
      />
    </Link>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'サービスの特徴', href: '#service' },
    { label: '制作実績', href: '#gallery' },
    { label: '料金プラン', href: '#pricing' },
    { label: 'ご利用の流れ', href: '#how-it-works' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EAEAEA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          <BrandLogo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#4B4B52] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F8F8FA] transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-[#111111] font-medium px-4 py-2 rounded-full hover:bg-[#F8F8FA] transition-all"
            >
              ログイン
            </Link>
            <Link
              href="/apply"
              className="btn-gradient text-sm font-bold px-5 py-2.5 rounded-full"
            >
              無料で始める
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-full text-[#111111] hover:bg-[#F8F8FA] transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#EAEAEA] px-4 pb-5 pt-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#111111] py-2.5 px-3 rounded-xl hover:bg-[#F8F8FA] transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="border-t border-[#EAEAEA] mt-3 pt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className="text-sm text-center py-2.5 border border-[#EAEAEA] rounded-full text-[#111111] font-medium hover:bg-[#F8F8FA] transition-all"
              onClick={() => setMenuOpen(false)}
            >
              ログイン
            </Link>
            <Link
              href="/apply"
              className="btn-gradient text-sm text-center py-3 rounded-full font-bold"
              onClick={() => setMenuOpen(false)}
            >
              無料で始める
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
