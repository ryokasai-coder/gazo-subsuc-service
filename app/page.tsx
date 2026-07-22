import Link from 'next/link'
import Header from '@/components/ui/Header'
import HeroShowcase from '@/components/ui/HeroShowcase'

const faqs = [
  { q: '月10回とはどういう意味ですか？', a: '1ヶ月（毎月1日〜末日）の間に画像制作を依頼できる回数が10回です。1回につき1種類の画像制作となります。' },
  { q: '未使用分は翌月に繰り越せますか？', a: '恐れ入りますが、翌月への繰り越しはできません。月内にぜひご活用ください。' },
  { q: '納品までどのくらいかかりますか？', a: '必要素材および制作情報をご提出後、原則3営業日以内に初稿をご提出いたします。内容や混雑状況により変動する場合があります。' },
  { q: '修正は何回までできますか？', a: '修正回数についてはお申込み後にサポートよりご案内いたします。' },
  { q: 'どんなデザインを依頼できますか？', a: 'SNS投稿用・広告バナー・LP用ビジュアル・チラシ・POP・メニュー表・YouTubeサムネイルなど幅広く対応しています。' },
  { q: '解約はいつでもできますか？', a: '解約希望日の1ヶ月前までにお手続きいただければ解約可能です。違約金等はございません。' },
]

const features = [
  { icon: '💰', title: '月額定額でコスト削減', desc: '都度発注より大幅コストダウン。月額固定で予算管理が楽に。' },
  { icon: '⚡', title: '最短3営業日で納品', desc: '専任チームが素早く対応。スピード感を持ってお届けします。' },
  { icon: '🎨', title: 'プロのクオリティ', desc: '経験豊富なデザイナーが担当。ブランドガイドライン対応も可能。' },
  { icon: '📱', title: 'スマホから簡単依頼', desc: 'いつでもどこでも依頼・確認。モバイル対応のダッシュボード。' },
  { icon: '🔄', title: 'あらゆる用途に対応', desc: 'SNS・広告・Web・印刷物。制作できるデザインの種類が豊富。' },
  { icon: '📊', title: '進捗をリアルタイム確認', desc: 'ダッシュボードでいつでも依頼状況を確認できます。' },
]

const steps = [
  { step: '01', title: '本申込フォーム入力', desc: '必要事項を入力してアカウントを作成。ログインIDをメールでお送りします。', icon: '📝' },
  { step: '02', title: 'お支払い方法登録', desc: '登録URLから支払い方法を登録。完了後すぐにご依頼いただけます。', icon: '💳' },
  { step: '03', title: 'デザイン依頼フォーム入力', desc: '専用フォームから詳細を入力して送信。参考画像・素材のアップロードも可能。', icon: '🎨' },
  { step: '04', title: '制作・納品', desc: '最短3営業日で初稿をご提出。メールで納品のご連絡をいたします。', icon: '✅' },
]

// 制作実績（実際の納品事例）。カテゴリラベルとともに視覚的に訴求。
const works = [
  { src: '/gallery/work-ramen-hero.jpg', cat: 'ラーメン店', type: 'メインビジュアル' },
  { src: '/gallery/work-smoothie-pink.jpg', cat: 'ドリンク', type: '新商品告知' },
  { src: '/gallery/work-cafe-cover.jpg', cat: 'カフェ', type: 'パンフレット' },
  { src: '/gallery/work-ramen-campaign.jpg', cat: '飲食店', type: 'セール告知' },
  { src: '/gallery/work-line-coupon.jpg', cat: '販促', type: 'LINEクーポン' },
  { src: '/gallery/work-ramen-menu.jpg', cat: 'ラーメン店', type: 'メニュー表' },
  { src: '/gallery/work-smoothie-blue.jpg', cat: 'ドリンク', type: '新商品告知' },
  { src: '/gallery/work-cafe-sweets.jpg', cat: 'カフェ', type: 'メニュー' },
  { src: '/gallery/work-ramen-recommend.jpg', cat: '飲食店', type: 'おすすめメニュー' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-[#F8F8FA] bg-brand-glow pt-20 pb-28 px-4">
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* 左：見出し・CTA */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 bg-white text-[#E85C97] text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm ring-1 ring-[#FFE3F0]">
              <span className="w-1.5 h-1.5 bg-brand-gradient rounded-full animate-pulse" />
              月額5,000円のデザインサブスク
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#111111] leading-[1.12] mb-6 tracking-tight">
              デザインを、<br />
              もっと<span className="text-gradient">自由</span>に。
            </h1>
            <p className="text-lg text-[#6B7280] max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              月額5,000円で、月10回までデザイン依頼。<br className="hidden sm:block" />
              SNS投稿・広告バナー・販促物を、プロのデザイナーが最短3営業日でお届け。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/apply" className="btn-gradient inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-full text-base">
                無料で始める
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#gallery" className="inline-flex items-center justify-center bg-white text-[#111111] font-semibold px-8 py-4 rounded-full border border-[#EAEAEA] hover:border-[#D4D4D4] hover:shadow-md transition-all text-base">
                制作実績を見る
              </a>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              {[['月10回', '依頼可能'], ['¥5,000', '月額（税抜）'], ['3営業日', '最短で初稿']].map(([val, label]) => (
                <div key={label} className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/[0.03]">
                  <div className="text-xl font-black text-[#111111]">{val}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 右：制作イメージ（「デザインをもっと自由に」の横に画像を追加） */}
          <div className="lg:pl-4">
            <HeroShowcase />
          </div>
        </div>
      </section>

      {/* ─── Gallery（制作実績を最上部でビジュアル訴求） ─── */}
      <section id="gallery" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-gradient uppercase tracking-widest">Works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">制作実績</h2>
            <p className="text-[#6B7280]">飲食・販促を中心に、幅広いデザインを制作しています。</p>
          </div>
          {/* Masonry-style grid（実画像） */}
          <div className="columns-2 sm:columns-3 lg:columns-3 gap-4 [column-fill:_balance]">
            {works.map((w) => (
              <figure
                key={w.src}
                className="relative mb-4 break-inside-avoid overflow-hidden rounded-2xl shadow-sm card-hover group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.src}
                  alt={`${w.cat}の${w.type}デザイン制作実績`}
                  loading="lazy"
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/65 to-transparent px-4 pt-10 pb-3">
                  <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {w.cat}
                  </span>
                  <span className="text-xs font-medium text-white/95">{w.type}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Service intro ─── */}
      <section id="service" className="py-20 px-4 bg-[#F8F8FA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-gradient uppercase tracking-widest">Why DESIGN BOX</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">こんなお悩みを解決します</h2>
            <p className="text-[#6B7280] text-base">デザイン費用が高い・毎回発注が手間・クオリティが安定しない。そんな課題を一気に解決。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-3xl p-6 card-hover cursor-default ring-1 ring-black/[0.03]">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-[#111111] text-base mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-lg mx-auto text-center">
          <span className="text-xs font-black text-gradient uppercase tracking-widest">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">シンプルな料金プラン</h2>
          <p className="text-[#6B7280] mb-10">複雑なオプションなし。1つのプランで全機能をご利用いただけます。</p>

          <div className="border-gradient rounded-3xl shadow-[0_16px_50px_-12px_rgba(255,138,199,0.28)] p-8 sm:p-10 text-left">
            <div className="inline-flex items-center bg-brand-gradient text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
              スタンダードプラン
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black text-gradient">5,000</span>
              <span className="text-[#6B7280] mb-2 text-sm">円 / 月（税抜）</span>
            </div>
            <p className="text-[#6B7280] text-xs mb-8">※税込 5,500円</p>

            <ul className="space-y-3 mb-8">
              {[
                '月10回まで画像制作依頼可能',
                '必要素材提出後、最短3営業日で初稿納品',
                'SNS投稿・広告バナー・POP・チラシなど全用途対応',
                '写真・ロゴ等の素材はお客様ご提供',
                'ダッシュボードで依頼・進捗管理',
                '1ヶ月単位の自動更新制',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-[#FFF0F6] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#E85C97]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm text-[#111111]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 mb-8 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <span className="text-sm text-amber-700">未使用分の翌月繰越はできません</span>
            </div>

            <Link href="/apply" className="btn-gradient block w-full text-center font-bold py-4 rounded-full text-base">
              このプランで申し込む
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-20 px-4 bg-[#F8F8FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-gradient uppercase tracking-widest">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">ご利用の流れ</h2>
            <p className="text-[#6B7280]">お申し込みからデザイン受取まで4ステップ</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white rounded-3xl p-6 h-full card-hover ring-1 ring-black/[0.03]">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-9 h-9 bg-brand-gradient text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">
                      {s.step}
                    </span>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <h3 className="font-bold text-[#111111] text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 bg-white rounded-full border border-[#EAEAEA] items-center justify-center -translate-y-1/2">
                    <svg className="w-3 h-3 text-[#ABABAB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-gradient uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2">よくある質問</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-[#F8F8FA] rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-semibold text-[#111111] list-none select-none">
                  <span className="text-sm pr-4">{faq.q}</span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-open:rotate-180 transition-transform">
                    <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-[#6B7280] leading-relaxed border-t border-white/60 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden py-20 px-4 bg-brand-gradient">
        <div className="relative max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            まずはアカウントを作成
          </h2>
          <p className="text-white/90 mb-10 text-base">
            登録後に決済設定を行えば当日から依頼可能。<br className="hidden sm:block" />最短即日スタートできます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center bg-white text-[#E85C97] font-bold px-8 py-4 rounded-full hover:bg-white/90 transition-all shadow-lg text-base">
              無料で始める
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center border-2 border-white/60 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-base">
              ログインはこちら
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#111111] text-[#9CA3AF] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-horizontal.png" alt="DESIGN BOX" className="h-8 w-auto mb-3 brightness-0 invert opacity-90" />
              <p className="text-xs">月額定額のデザイン制作サブスクサービス</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#gallery" className="hover:text-white transition-colors">制作実績</a>
              <a href="#service" className="hover:text-white transition-colors">サービスの特徴</a>
              <a href="#pricing" className="hover:text-white transition-colors">料金プラン</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/apply" className="hover:text-white transition-colors">お申し込み</Link>
              <Link href="/login" className="hover:text-white transition-colors">ログイン</Link>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs">
            &copy; 2026 DESIGN BOX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
