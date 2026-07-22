'use client'

import { useEffect, useState } from 'react'

// トップページのヒーロー横に置く制作イメージ。
// お客様支給の画像（/hero-showcase.png）があればそれを表示し、
// 無い場合は制作実績ギャラリー画像のコラージュにフォールバックする（画像欠けで崩れないように）。
const HERO_IMAGE = '/hero-showcase.png'
const FALLBACK = [
  '/gallery/work-ramen-hero.jpg',
  '/gallery/work-smoothie-pink.jpg',
  '/gallery/work-cafe-cover.jpg',
  '/gallery/work-cafe-sweets.jpg',
]

export default function HeroShowcase() {
  // null=判定中 / true=支給画像あり / false=フォールバック
  const [hasHero, setHasHero] = useState<boolean | null>(null)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setHasHero(true)
    img.onerror = () => setHasHero(false)
    img.src = HERO_IMAGE
  }, [])

  // 判定中は場所だけ確保（レイアウトシフト防止）
  if (hasHero === null) {
    return <div className="w-full aspect-square rounded-3xl bg-white/60 animate-pulse" aria-hidden />
  }

  if (hasHero) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="DESIGN BOX の制作イメージ"
          className="w-full h-auto rounded-3xl shadow-[0_24px_60px_-20px_rgba(232,92,151,0.35)] ring-1 ring-black/[0.04]"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {FALLBACK.map((src, i) => (
        <figure
          key={src}
          className={`overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/[0.04] ${i % 2 === 1 ? 'translate-y-4' : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="制作実績デザイン"
            loading="lazy"
            className="w-full h-full object-cover aspect-square"
          />
        </figure>
      ))}
    </div>
  )
}
