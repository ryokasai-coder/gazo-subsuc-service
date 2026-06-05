import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '画像作成サブスクサービス（仮）',
  description: '月額定額で高品質な画像制作をサブスクリプション提供。月10回まで依頼可能。',
  keywords: '画像制作, サブスクリプション, デザイン, 月額定額',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className={`${notoSansJP.className} antialiased bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  )
}
