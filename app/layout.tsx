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
  metadataBase: new URL('https://gazo-subsuc-service.vercel.app'),
  title: {
    default: 'DESIGN BOX｜デザインを、もっと自由に。',
    template: '%s｜DESIGN BOX',
  },
  description:
    '月額5,000円でデザイン依頼。SNS投稿・広告バナー・販促物を、プロのデザイナーが月10回・最短3営業日でお届けするデザインサブスクサービス。',
  keywords: 'デザイン制作, サブスクリプション, 画像制作, バナー, SNS, 月額定額, DESIGN BOX',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://gazo-subsuc-service.vercel.app',
    siteName: 'DESIGN BOX',
    title: 'DESIGN BOX｜デザインを、もっと自由に。',
    description:
      '月額5,000円でデザイン依頼。SNS投稿・広告バナー・販促物を、プロのデザイナーが月10回・最短3営業日でお届け。',
    images: [{ url: '/ogp.png', width: 1200, height: 800, alt: 'DESIGN BOX' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DESIGN BOX｜デザインを、もっと自由に。',
    description: '月額5,000円でデザイン依頼。プロのデザイナーが月10回・最短3営業日でお届け。',
    images: ['/ogp.png'],
  },
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
