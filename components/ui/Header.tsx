'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'サービス紹介', href: '#service' },
    { label: '料金プラン', href: '#pricing' },
    { label: 'ご利用の流れ', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EFEFEF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 select-none">
            <span className="w-8 h-8 rounded-lg bg-[#E60023] flex items-center justify-center text-white font-bold text-sm">画</span>
            <span className="font-bold text-[#111111] text-[15px] hidden sm:block">画像作成サブスク<span className="text-[#767676] font-normal text-xs ml-1">（仮）</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#767676] hover:text-[#111111] px-3 py-2 rounded-full hover:bg-[#F1EFEF] transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-[#111111] font-medium px-4 py-2 rounded-full hover:bg-[#F1EFEF] transition-all"
            >
              ログイン
            </Link>
            <Link
              href="/apply"
              className="text-sm bg-[#E60023] text-white font-semibold px-5 py-2 rounded-full hover:bg-[#C0001E] transition-all shadow-sm"
            >
              無料で申し込む
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-full text-[#111111] hover:bg-[#F1EFEF] transition-all"
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
        <div className="md:hidden bg-white border-t border-[#EFEFEF] px-4 pb-5 pt-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#111111] py-2.5 px-3 rounded-xl hover:bg-[#F1EFEF] transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="border-t border-[#EFEFEF] mt-3 pt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className="text-sm text-center py-2.5 border border-[#EFEFEF] rounded-full text-[#111111] font-medium hover:bg-[#F1EFEF] transition-all"
              onClick={() => setMenuOpen(false)}
            >
              ログイン
            </Link>
            <Link
              href="/apply"
              className="text-sm text-center py-2.5 bg-[#E60023] text-white rounded-full font-semibold hover:bg-[#C0001E] transition-all"
              onClick={() => setMenuOpen(false)}
            >
              無料で申し込む
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
