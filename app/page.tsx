import Link from 'next/link'
import Header from '@/components/ui/Header'

const faqs = [
  { q: '月10回とはどういう意味ですか？', a: '1ヶ月（毎月1日〜末日）の間に画像制作を依頼できる回数が10回です。1回につき1種類の画像制作となります。' },
  { q: '未使用分は翌月に繰り越せますか？', a: '恐れ入りますが、翌月への繰り越しはできません。月内にぜひご活用ください。' },
  { q: '納品までどのくらいかかりますか？', a: '必要素材および制作情報をご提出後、原則14営業日以内に初稿をご提出いたします。内容や混雑状況により変動する場合があります。' },
  { q: '修正は何回までできますか？', a: '修正回数についてはお申込み後にサポートよりご案内いたします。' },
  { q: 'どんな画像を依頼できますか？', a: 'SNS投稿用・広告バナー・LP用ビジュアル・チラシ・POP・メニュー表・YouTubeサムネイルなど幅広く対応しています。' },
  { q: '解約はいつでもできますか？', a: '解約希望日の1ヶ月前までにお手続きいただければ解約可能です。違約金等はございません。' },
]

const features = [
  { icon: '💰', title: '月額定額でコスト削減', desc: '都度発注より大幅コストダウン。月額固定で予算管理が楽に。' },
  { icon: '⚡', title: '原則14営業日以内納品', desc: '専任チームが素早く対応。急ぎの案件もご相談ください。' },
  { icon: '🎨', title: 'プロのクオリティ', desc: '経験豊富なデザイナーが担当。ブランドガイドライン対応も可能。' },
  { icon: '📱', title: 'スマホから簡単依頼', desc: 'いつでもどこでも依頼・確認。モバイル対応のダッシュボード。' },
  { icon: '🔄', title: 'あらゆる用途に対応', desc: 'SNS・広告・Web・印刷物。制作可能な画像の種類が豊富。' },
  { icon: '📊', title: '進捗をリアルタイム確認', desc: 'ダッシュボードでいつでも依頼状況を確認できます。' },
]

const steps = [
  { step: '01', title: '本申込フォーム入力', desc: '必要事項を入力してアカウントを作成。ログインIDをメールでお送りします。', icon: '📝' },
  { step: '02', title: 'お支払い方法登録', desc: '登録URLから支払い方法を登録。完了後すぐにご依頼いただけます。', icon: '💳' },
  { step: '03', title: '画像依頼フォーム入力', desc: '専用フォームから詳細を入力して送信。参考画像・素材のアップロードも可能。', icon: '🎨' },
  { step: '04', title: '制作・納品', desc: '原則14営業日以内に初稿をご提出。メールで納品のご連絡をいたします。', icon: '✅' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ─── Hero ─── */}
      <section className="bg-[#F1EFEF] pt-16 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#FFE8EC] text-[#E60023] text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-[#E60023] rounded-full animate-pulse" />
            月額定額制 画像制作サービス
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#111111] leading-[1.15] mb-6 tracking-tight">
            高品質な画像制作を<br />
            <span className="text-[#E60023]">月額定額</span>でご利用
          </h1>
          <p className="text-lg text-[#767676] max-w-xl mx-auto mb-10 leading-relaxed">
            SNS投稿・広告バナー・POP・メニュー表など、プロのデザイナーが月10回まで制作。都度発注の手間なく、コストを抑えた高品質なビジュアルを。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-[#E60023] text-white font-bold px-8 py-4 rounded-full hover:bg-[#C0001E] transition-all shadow-lg shadow-red-200 text-base">
              無料で申し込む
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#pricing" className="inline-flex items-center justify-center bg-white text-[#111111] font-semibold px-8 py-4 rounded-full border border-[#EFEFEF] hover:border-[#D4D4D4] hover:shadow-md transition-all text-base">
              料金を確認する
            </a>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-4 max-w-md mx-auto">
            {[['月10回', '依頼可能'], ['¥20,000', '月額（税抜）'], ['14営業日', '以内に初稿']].map(([val, label]) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-xl font-black text-[#111111]">{val}</div>
                <div className="text-xs text-[#767676] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Service intro ─── */}
      <section id="service" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Service</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">こんなお悩みを解決します</h2>
            <p className="text-[#767676] text-base">デザイン費用が高い・毎回発注が手間・クオリティが安定しない。そんな課題を一気に解決。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-[#F1EFEF] rounded-3xl p-6 card-hover cursor-default">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-[#111111] text-base mb-2">{f.title}</h3>
                <p className="text-sm text-[#767676] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-4 bg-[#F1EFEF]">
        <div className="max-w-lg mx-auto text-center">
          <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">シンプルな料金プラン</h2>
          <p className="text-[#767676] mb-10">複雑なオプションなし。1つのプランで全機能をご利用いただけます。</p>

          <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8 sm:p-10 text-left">
            <div className="inline-flex items-center bg-[#FFE8EC] text-[#E60023] text-xs font-bold px-3 py-1 rounded-full mb-6">
              スタンダードプラン
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black text-[#111111]">20,000</span>
              <span className="text-[#767676] mb-2 text-sm">円 / 月（税抜）</span>
            </div>
            <p className="text-[#767676] text-xs mb-8">※税込 22,000円</p>

            <ul className="space-y-3 mb-8">
              {[
                '月10回まで画像制作依頼可能',
                '必要素材提出後、原則14営業日以内に初稿納品',
                'SNS投稿・広告バナー・POP・チラシなど全用途対応',
                '写真・ロゴ等の素材はお客様ご提供',
                'ダッシュボードで依頼・進捗管理',
                '1ヶ月単位の自動更新制',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-[#FFE8EC] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#E60023]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <Link href="/apply" className="block w-full text-center bg-[#E60023] text-white font-bold py-4 rounded-full hover:bg-[#C0001E] transition-all shadow-md shadow-red-100 text-base">
              このプランで申し込む
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">ご利用の流れ</h2>
            <p className="text-[#767676]">お申し込みから画像受取まで4ステップ</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-[#F1EFEF] rounded-3xl p-6 h-full card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-9 h-9 bg-[#E60023] text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">
                      {s.step}
                    </span>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <h3 className="font-bold text-[#111111] text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-[#767676] leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 bg-white rounded-full border border-[#EFEFEF] items-center justify-center -translate-y-1/2">
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

      {/* ─── Delivery ─── */}
      <section id="delivery" className="py-20 px-4 bg-[#F1EFEF]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Delivery</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2">納品について</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: '⏱ 納品期限', content: '必要素材および制作情報のご提出後、原則14営業日以内に初稿をご提出いたします。' },
              { title: '📦 制作に必要な素材', content: '画像制作に必要な写真・ロゴ・テキスト等は原則お客様にてご提供をお願いいたします。' },
              { title: '🌐 ご利用について', content: '制作した画像はSNS・広告・Webサイト・販促物等にご自由にご利用いただけます。' },
              { title: '📋 注意事項', content: '内容や混雑状況により納品日程が変動する場合があります。予めご了承ください。' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm card-hover">
                <h3 className="font-bold text-[#111111] mb-2 text-sm">{item.title}</h3>
                <p className="text-[#767676] text-sm leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contract ─── */}
      <section id="contract" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Contract</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2">ご契約・更新について</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: '契約期間', a: '1ヶ月単位の自動更新制です。' },
              { q: '解約のタイミング', a: '解約希望日の1ヶ月前までにお手続きください。' },
              { q: '画像の利用範囲', a: '制作した画像はSNS・広告・Webサイト・販促物等にご自由にご利用いただけます。' },
              { q: '支払い方法', a: '請求管理ロボ経由でのお支払いとなります。詳細はお申込み後にご案内いたします。' },
            ].map((item) => (
              <div key={item.q} className="flex gap-4 bg-[#F1EFEF] rounded-2xl px-5 py-4">
                <span className="text-[#E60023] font-bold text-sm flex-shrink-0 pt-0.5 min-w-[80px]">{item.q}</span>
                <span className="text-[#767676] text-sm leading-relaxed">{item.a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gallery ─── */}
      <section id="gallery" className="py-20 px-4 bg-[#F1EFEF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">Gallery</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 mb-3">制作実績ギャラリー</h2>
            <p className="text-[#767676]">납품実績の一部をご紹介します</p>
          </div>
          {/* Masonry-style grid */}
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {[
              { h: 'h-48' }, { h: 'h-64' }, { h: 'h-56' }, { h: 'h-44' },
              { h: 'h-60' }, { h: 'h-52' }, { h: 'h-48' }, { h: 'h-64' },
            ].map((item, i) => (
              <div
                key={i}
                className={`${item.h} bg-white rounded-2xl break-inside-avoid flex items-center justify-center shadow-sm card-hover`}
              >
                <div className="text-center">
                  <div className="w-10 h-10 bg-[#F1EFEF] rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-[#ABABAB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#ABABAB]">制作事例</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#E60023] uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2">よくある質問</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-[#F1EFEF] rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-semibold text-[#111111] list-none select-none">
                  <span className="text-sm pr-4">{faq.q}</span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-open:rotate-180 transition-transform">
                    <svg className="w-3.5 h-3.5 text-[#767676]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-[#767676] leading-relaxed border-t border-white/60 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-4 bg-[#E60023]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            まずはアカウントを作成
          </h2>
          <p className="text-red-100 mb-10 text-base">
            登録後に決済設定を行えば当日から依頼可能。<br className="hidden sm:block" />最短即日スタートできます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center bg-white text-[#E60023] font-bold px-8 py-4 rounded-full hover:bg-red-50 transition-all shadow-lg text-base">
              無料で申し込む
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-base">
              ログインはこちら
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#111111] text-[#767676] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-[#E60023] flex items-center justify-center text-white font-bold text-xs">画</span>
                <span className="text-white font-bold text-sm">画像作成サブスクサービス（仮）</span>
              </div>
              <p className="text-xs">月額定額の画像制作サービス</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#service" className="hover:text-white transition-colors">サービス紹介</a>
              <a href="#pricing" className="hover:text-white transition-colors">料金プラン</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/apply" className="hover:text-white transition-colors">お申し込み</Link>
              <Link href="/login" className="hover:text-white transition-colors">ログイン</Link>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs">
            &copy; 2024 画像作成サブスクサービス（仮）. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
