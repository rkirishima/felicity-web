import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/app/components/Header';

export const metadata = {
  title: 'COFFEE × FLOWER サブスク | FELICITY × PAUSE',
  description: '葉山発。自家焙煎コーヒーと季節の花を毎月お届けするサブスクリプション。FELICITY COFFEE ROASTERS × PAUSE のコラボレーション。',
};

const plans = [
  {
    id: 'small',
    name: 'S',
    coffee: '豆 100g',
    flower: '季節の花束 S',
    price: 3800,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB_S,
    note: '一人暮らしや少量ずつ楽しみたい方に',
    color: 'border-[#C8B89A]',
  },
  {
    id: 'medium',
    name: 'M',
    coffee: '豆 200g',
    flower: '季節の花束 M',
    price: 5800,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB_M,
    note: '最も人気のスタンダードプラン',
    color: 'border-[#8FAF8A]',
    featured: true,
  },
  {
    id: 'large',
    name: 'L',
    coffee: '豆 200g',
    flower: 'アレンジメント',
    price: 8800,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB_L,
    note: '特別な空間を演出したい方に',
    color: 'border-[#7AAFC4]',
  },
];

export default function SubscribePage() {
  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      <Header locale="ja" pathname="/subscribe" contactLabel="お問い合わせ" />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="min-h-screen grid md:grid-cols-2">
        {/* Left — Coffee */}
        <div className="relative bg-[#2C2416] flex flex-col justify-end p-12 md:p-16 min-h-[50vh] md:min-h-screen">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/beans-1.jpg"
              alt="Felicity coffee beans"
              fill
              className="object-cover opacity-30"
              priority
            />
          </div>
          <div className="relative z-10">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#C8B89A] uppercase mb-4">
              Felicity Coffee Roasters
            </p>
            <h1 className="text-[clamp(48px,7vw,96px)] font-light text-white leading-none tracking-tight">
              COFFEE
            </h1>
          </div>
        </div>

        {/* Right — Flower */}
        <div className="relative bg-[#3D5A4A] flex flex-col justify-end p-12 md:p-16 min-h-[50vh] md:min-h-screen">
          <div className="absolute inset-0 overflow-hidden opacity-20">
            {/* Flower photo placeholder — replace with actual image */}
            <div className="w-full h-full bg-gradient-to-br from-[#5A7A5A] to-[#2D4A3A]" />
          </div>
          <div className="relative z-10">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#A8C8A0] uppercase mb-4">
              PAUSE Flower
            </p>
            <h1 className="text-[clamp(48px,7vw,96px)] font-light text-white leading-none tracking-tight">
              FLOWER
            </h1>
          </div>
        </div>

        {/* Center badge */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-[#F4EFE4] rounded-full w-24 h-24 md:w-32 md:h-32 flex items-center justify-center shadow-2xl">
            <span className="font-mono text-[#2C2416] text-[11px] md:text-[13px] tracking-[0.15em] text-center leading-tight">
              ×
            </span>
          </div>
        </div>
      </section>

      {/* ── Lead ──────────────────────────────────────────────────────── */}
      <section className="bg-[#2C2416] py-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#8FAF8A] uppercase mb-8">
            A new subscription from Hayama
          </p>
          <h2 className="text-[clamp(28px,4vw,42px)] font-light text-white leading-relaxed mb-8">
            葉山のキッチンカーで生まれた、<br />コーヒーとお花のサブスクリプション。
          </h2>
          <p className="text-[15px] text-[#C8B89A] leading-relaxed font-light">
            FELICITY COFFEE ROASTERS と PAUSE が、毎月あなたのもとへ届けます。<br />
            PROBAT で丁寧に焙煎したスペシャルティコーヒーと、<br />
            PAUSEが選ぶ季節のお花を、一緒に。
          </p>
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 bg-[#F4EFE4]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-6">
              Our Story
            </p>
            <h3 className="text-[clamp(24px,3vw,34px)] font-light text-[#2C2416] leading-tight mb-8">
              晴れた日だけ、<br />葉山に現れるキッチンカー。
            </h3>
            <p className="text-[15px] text-[#8C7B6B] leading-relaxed mb-6">
              週に2日、天気のいい日だけ。FELICITY のキッチンカーが葉山の街に現れます。
              そこで出会ったのが、花屋 PAUSE。コーヒーの香りと花の色が隣り合う、
              あの空気感をそのまま届けたい——それがこのサブスクの始まりです。
            </p>
            <a
              href="https://pause-flower.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] text-[#8FAF8A] uppercase hover:text-[#3D5A4A] transition-colors"
            >
              PAUSE について →
            </a>
          </div>
          <div className="relative aspect-square bg-[#EDE5D8] rounded-sm overflow-hidden">
            <Image
              src="/beans-3.jpg"
              alt="Felicity kitchen car"
              fill
              className="object-cover"
            />
            {/* Replace with kitchen car or collaboration photo */}
          </div>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────────────────── */}
      <section id="plans" className="py-24 px-8 bg-[#EDE5D8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-4">
              Subscription Plans
            </p>
            <h2 className="text-[clamp(28px,4vw,40px)] font-light text-[#2C2416]">
              毎月1回、一緒にお届けします
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-[#F4EFE4] rounded-sm border-t-4 ${plan.color} p-8 flex flex-col ${plan.featured ? 'shadow-lg scale-[1.02]' : ''}`}
              >
                {plan.featured && (
                  <p className="font-mono text-[9px] tracking-[0.2em] text-[#8FAF8A] uppercase mb-4">
                    Most Popular
                  </p>
                )}
                <div className="mb-6">
                  <h3 className="text-[40px] font-light text-[#2C2416] leading-none mb-1">
                    Plan {plan.name}
                  </h3>
                  <p className="text-[13px] text-[#8C7B6B]">{plan.note}</p>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#2C2416] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[8px]">C</span>
                    </span>
                    <span className="text-[14px] text-[#2C2416]">{plan.coffee}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#8FAF8A] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[8px]">F</span>
                    </span>
                    <span className="text-[14px] text-[#2C2416]">{plan.flower}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#DDD5C5] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#8C7B6B] text-[8px]">送</span>
                    </span>
                    <span className="text-[14px] text-[#8C7B6B]">送料込み・月1回</span>
                  </div>
                </div>

                <div className="border-t border-[#DDD5C5] pt-6 mb-6">
                  <p className="text-[13px] text-[#8C7B6B] mb-1">月額</p>
                  <p className="text-[36px] font-light text-[#2C2416] leading-none">
                    ¥{plan.price.toLocaleString('ja-JP')}
                  </p>
                  <p className="text-[11px] text-[#8C7B6B] mt-1">税込 / いつでも解約可</p>
                </div>

                <Link
                  href={`/subscribe/checkout?plan=${plan.id}`}
                  className="w-full block text-center bg-[#2C2416] text-white py-4 rounded-sm font-mono text-[12px] tracking-[0.1em] uppercase hover:bg-[#1a1410] transition-colors"
                >
                  このプランで申し込む
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-[12px] text-[#8C7B6B] mt-8">
            初回発送は申し込み翌月から。クレジットカード決済。毎月自動更新。
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-24 px-8 bg-[#F4EFE4]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-4">
              How it works
            </p>
            <h2 className="text-[clamp(24px,3vw,36px)] font-light text-[#2C2416]">
              届くまでの流れ
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'プランを選ぶ', desc: 'S・M・L の中からお好みのプランをお選びください。いつでも解約できます。' },
              { step: '02', title: '毎月自動更新', desc: '月に一度、カードから自動引き落とし。発送前にメールでお知らせします。' },
              { step: '03', title: 'お手元に届く', desc: '焙煎したてのコーヒーとPAUSEのお花が、一緒に届きます。' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <p className="font-mono text-[48px] font-light text-[#DDD5C5] leading-none mb-4">{step}</p>
                <h3 className="text-[18px] font-light text-[#2C2416] mb-3">{title}</h3>
                <p className="text-[13px] text-[#8C7B6B] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 bg-[#3D5A4A]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[clamp(28px,4vw,40px)] font-light text-white mb-6">
            はじめてみませんか。
          </h2>
          <p className="text-[14px] text-[#A8C8A0] mb-10">
            いつでも解約可能。初回発送は申し込み翌月から。
          </p>
          <a
            href="#plans"
            className="inline-block bg-white text-[#2C2416] font-mono text-[12px] tracking-[0.15em] uppercase px-10 py-4 hover:bg-[#F4EFE4] transition-colors rounded-sm"
          >
            プランを見る
          </a>
        </div>
      </section>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <section className="py-12 px-8 bg-[#2C2416]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-[#8C7B6B]">
          <span>FELICITY COFFEE ROASTERS × PAUSE</span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-[#C8B89A] transition-colors">felicity.cafe</Link>
            <a href="https://pause-flower.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#A8C8A0] transition-colors">pause-flower.com</a>
          </div>
        </div>
      </section>
    </main>
  );
}
