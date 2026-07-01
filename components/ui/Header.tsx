'use client'

import { useState } from 'react'
import Link from 'next/link'

/** グラデーションのボックスロゴ（DESIGNBOX） */
function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 select-none">
      <span className="relative w-8 h-8 rounded-[10px] bg-brand-gradient flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M3.34 7L12 12l8.66-5M12 12v10" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-black text-[#111111] text-[17px] tracking-tight">
        DESIGN<span className="text-gradient">BOX</span>
      </span>
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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#ECECEF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          <BrandLogo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#4B4B52] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F7F7F9] transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-[#111111] font-medium px-4 py-2 rounded-full hover:bg-[#F7F7F9] transition-all"
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
            className="md:hidden p-2 rounded-full text-[#111111] hover:bg-[#F7F7F9] transition-all"
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
        <div className="md:hidden bg-white border-t border-[#ECECEF] px-4 pb-5 pt-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#111111] py-2.5 px-3 rounded-xl hover:bg-[#F7F7F9] transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="border-t border-[#ECECEF] mt-3 pt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className="text-sm text-center py-2.5 border border-[#ECECEF] rounded-full text-[#111111] font-medium hover:bg-[#F7F7F9] transition-all"
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
