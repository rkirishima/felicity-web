import Image from 'next/image';
import Link from 'next/link';

// トップページの業販セクション。詳細と銘柄は /wholesale にあるので、ここは
// 「業販をやっている」ことが伝わればよく、価格は出さない。
const COPY = {
  ja: {
    label: 'Wholesale',
    heading: '葉山から、そのお店らしい一杯を。',
    body: 'カフェ・レストラン・ホテル・オフィスさま向けに、自社焙煎のシングルオリジンを1kg単位でお届けしています。',
    detail:
      '焙煎度合いのご相談、そのお店だけのオリジナルブレンドの開発、抽出レシピのご提案まで。まずは無料サンプルからお試しいただけます。',
    cta: '業販のご案内',
    login: '取引先ログイン',
    alt: '焙煎中の豆をトライヤーで確認しているところ',
  },
  en: {
    label: 'Wholesale',
    heading: 'Coffee made for your place.',
    body: 'We supply cafés, restaurants, hotels and offices with our own roasted single origins, by the kilogram.',
    detail:
      'Roast levels tuned to how you brew, original blends developed for your menu, and brewing recipes on request. Start with free samples.',
    cta: 'Wholesale',
    login: 'Trade sign in',
    alt: 'Checking the roast with a trier at the Probat',
  },
} as const;

export function WholesaleSection({ locale }: { locale: 'ja' | 'en' }) {
  const t = COPY[locale];

  return (
    <section id="wholesale" className="bg-[#F4EFE4] pt-20 pb-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-8">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-12">
          {t.label}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-light text-[#2C2416] leading-tight mb-8">
              {t.heading}
            </h2>
            <p className="text-[16px] text-[#2C2416] font-light leading-[1.9] mb-4">{t.body}</p>
            <p className="text-[14px] text-[#8C7B6B] font-light leading-[1.9] mb-10">{t.detail}</p>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/wholesale"
                className="inline-block bg-[#7AAFC4] text-[#2C2416] font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-sm hover:bg-[#6A9DB3] transition-colors"
              >
                {t.cta}
              </Link>
              <Link
                href="/wholesale/login"
                className="font-mono text-[10px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
              >
                {t.login} →
              </Link>
            </div>
          </div>

          <Image
            src="/images/wholesale/roasting-trier.jpg"
            alt={t.alt}
            width={619}
            height={1100}
            sizes="(max-width: 1024px) 100vw, 440px"
            className="w-full h-auto rounded-sm lg:max-h-[560px] lg:object-cover lg:object-top"
          />
        </div>
      </div>
    </section>
  );
}
