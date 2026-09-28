// 業販の公開ページ。
//
// ログイン後の注文画面(/wholesale/order)と同じ読み物を出すが、単価は一切
// 載せない。価格の確認と発注はメールでのお問い合わせから始めてもらう。
// 検索から新規の取引先に見つけてもらうためのページなので、ここだけは
// インデックスを許可する(/wholesale/ 配下は robots.txt で Disallow のまま)。

import type { Metadata } from 'next';
import Link from 'next/link';
import { WHOLESALE_BEANS } from '@/app/lib/wholesale';
import { getBreadcrumbSchema } from '@/app/lib/schema';
import {
  FlavourMap,
  GREEN,
  Hero,
  PublicBeanCard,
  RoastingQuality,
  WhyFelicity,
  eyebrow,
  panel,
} from './sections';

export const metadata: Metadata = {
  title: '業販・卸売 | FELICITY COFFEE ROASTERS',
  description:
    'カフェ・レストラン・ホテル・オフィスさま向けに、葉山の自社焙煎所からシングルオリジンのコーヒー豆を1kg単位でお届けします。焙煎度合いのご相談、オリジナルブレンドの開発、抽出レシピのご提案まで。',
  alternates: { canonical: 'https://felicity.cafe/wholesale' },
  robots: { index: true, follow: true },
  openGraph: {
    title: '業販・卸売 | FELICITY COFFEE ROASTERS',
    description:
      '葉山の自社焙煎所から、そのお店に合う一杯を。カフェ・レストラン・ホテル・オフィスさま向けの業販のご案内。',
    url: 'https://felicity.cafe/wholesale',
    type: 'website',
  },
};

const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'ホーム', url: 'https://felicity.cafe/' },
  { name: '業販・卸売', url: 'https://felicity.cafe/wholesale' },
]);

// お問い合わせに必要な項目を最初から本文に入れておく。ここで聞いておかないと
// お見積りを出すのにもう一往復かかる項目ばかり。
const mailto =
  'mailto:info@felicity.cafe?subject=' +
  encodeURIComponent('業販・卸売のお問い合わせ') +
  '&body=' +
  encodeURIComponent(
    [
      'FELICITY COFFEE ROASTERS 御中',
      '',
      '業販についてお伺いしたくご連絡いたしました。',
      '',
      '■ 会社名・店舗名：',
      '■ ご担当者名：',
      '■ ご住所：',
      '■ お電話番号：',
      '■ ご希望の豆・月あたりのご使用量（kg）：',
      '■ 納品方法のご希望（発送 / 直接引き取り）：',
      '■ ご質問・ご要望：',
      '',
    ].join('\n'),
  );

const TERMS: { en: string; value: string }[] = [
  { en: 'Minimum Order', value: '1回3kgから・1銘柄につき1kgから。月間の最低量はありません' },
  { en: 'Custom Blend', value: 'オリジナルブレンドの開発は3kgから。ヒアリングと試作を重ねて、そのお店の一杯を決めていきます' },
  { en: 'Lead Time', value: 'ご注文から発送まで約3日' },
  { en: 'Delivery', value: '宅配便でお届けします。ご注文金額に応じて送料無料になります' },
  { en: 'Payment', value: '銀行振込またはクレジットカード。継続のお取引では月末締めもご相談いただけます' },
  { en: 'Package', value: 'アロマバルブ付きの業務用アルミバッグ。豆・粉・個包装に対応し、挽き目もご指定いただけます' },
];

export default function WholesalePublicPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <header className="border-b border-[#DDD5C5]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="font-mono text-xs tracking-[0.22em] text-[#2C2416] uppercase hover:text-[#8C7B6B] transition-colors"
          >
            Felicity
          </Link>
          <Link
            href="/wholesale/login"
            className="text-[11px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors"
          >
            取引先ログイン
          </Link>
        </div>
      </header>

      <Hero />
      <WhyFelicity />
      <RoastingQuality />
      <FlavourMap beans={WHOLESALE_BEANS} />

      <section className="max-w-5xl mx-auto px-6 pt-20">
        <p className={eyebrow}>Coffee Collection</p>
        <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
          産地とつくり手の個性を、一杯に。
        </h2>
        <p className="mt-4 max-w-2xl text-[14px] text-[#8C7B6B] font-light leading-relaxed">
          1kg単位でお届けしています。入荷状況により銘柄は入れ替わります。
          卸価格はお問い合わせいただいた際にお見積りとしてお送りします。
        </p>

        <div className="mt-10 space-y-px">
          {WHOLESALE_BEANS.map((bean) => (
            <PublicBeanCard key={bean.slug} bean={bean} />
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pt-20">
        <p className={eyebrow}>Wholesale / Order</p>
        <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
          必要な分から、継続しやすく。
        </h2>

        <dl className="mt-10">
          {TERMS.map((row) => (
            <div
              key={row.en}
              className="grid sm:grid-cols-[180px_minmax(0,1fr)] gap-2 sm:gap-8 border-t border-[#DDD5C5] py-5"
            >
              <dt className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#8C7B6B] sm:pt-1">
                {row.en}
              </dt>
              <dd className="text-[15px] text-[#2C2416] font-light leading-relaxed">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* サンプルと問い合わせ — 価格を出さないぶん、次の一歩をはっきり示す */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        <p className={eyebrow}>Start with a cup</p>
        <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
          まずは試飲から、お気軽に。
        </h2>

        <div className={`${panel} mt-10 p-8 sm:p-10 grid md:grid-cols-2 gap-10`}>
          <div className="space-y-4">
            <p className="text-[15px] text-[#2C2416] font-light leading-[1.9]">
              気になる銘柄を3種類まで、サンプルのご用意が可能です。
              店舗名・所在地・ご提供方法をお知らせのうえ、お問い合わせください。豆選びからご相談いただけます。
            </p>
            <p className="text-[14px] text-[#8C7B6B] font-light leading-relaxed">
              お見積り、焙煎度合いのご相談、抽出レシピの作成、スタッフの方への淹れ方のご説明、
              メニュー用の豆紹介文のご提供まで承ります。葉山の店舗でも試飲いただけます。
            </p>
          </div>

          <div className="space-y-5">
            <a
              href={mailto}
              className="inline-block bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-4 rounded-sm hover:bg-[#6A9DB3] transition-colors"
            >
              業販について問い合わせる
            </a>
            <p className="text-[13px] text-[#8C7B6B] font-light leading-relaxed">
              メールソフトが開かない場合は{' '}
              <a
                href="mailto:info@felicity.cafe"
                className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
              >
                info@felicity.cafe
              </a>{' '}
              宛に、会社名・ご担当者名・ご連絡先・ご希望の豆と月あたりのご使用量をお送りください。
              お見積りと、ご注文用アカウントをお送りします。
            </p>
            <p className="text-[13px] text-[#8C7B6B] font-light">
              すでにお取引のあるお客さまは{' '}
              <Link
                href="/wholesale/login"
                className="underline underline-offset-2 hover:text-[#2C2416] transition-colors"
                style={{ color: GREEN }}
              >
                取引先ログイン
              </Link>
              から、いつでもご発注いただけます。
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-[#DDD5C5] pt-8 text-[13px] text-[#8C7B6B] font-light leading-relaxed">
          <p>FELICITY COFFEE ROASTERS</p>
          <p>〒240-0115 神奈川県三浦郡葉山町上山口2432-3</p>
          <p>info@felicity.cafe ／ 080-8758-4368</p>
        </div>
      </section>
    </>
  );
}
