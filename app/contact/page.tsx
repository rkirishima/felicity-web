import type { Metadata } from 'next';
import Link from 'next/link';
import { LanguageToggle } from '@/app/components/LanguageToggle';
import { CafeChat } from '@/app/components/CafeChat';
import { getBreadcrumbSchema } from '@/app/lib/schema';

export const metadata: Metadata = {
  title: 'お問い合わせ | FELICITY COFFEE ROASTERS',
  description:
    '葉山のFELICITY COFFEE ROASTERSへのお問い合わせ、アクセス情報、ご予約はこちら。',
  alternates: {
    canonical: 'https://felicity.cafe/contact',
    languages: {
      ja: 'https://felicity.cafe/contact',
      en: 'https://felicity.cafe/en/contact',
    },
  },
};

// 業販のお問い合わせは定型の項目が埋まった状態でメールを開かせる。ここで聞いて
// おかないと、アカウントを発行するのにもう一往復必要になる項目ばかり。
const wholesaleMailto =
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

const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'ホーム', url: 'https://felicity.cafe/' },
  { name: 'お問い合わせ', url: 'https://felicity.cafe/contact' },
]);

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <header className="border-b border-[#DDD5C5] h-14 flex items-center px-8">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-mono text-xs tracking-[0.22em] text-[#2C2416] uppercase hover:text-[#8C7B6B] transition-colors"
            >
              Felicity
            </Link>
            <LanguageToggle currentLocale="ja" currentPath="/contact" />
          </div>
          <Link
            href="/"
            className="font-mono text-[12px] tracking-[0.16em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
          >
            ← 戻る
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 pt-16 pb-32">
        <p className="font-mono text-[11px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-8">
          Contact
        </p>
        <h1 className="text-[clamp(32px,5vw,48px)] font-light text-[#2C2416] tracking-tight leading-tight mb-16">
          お問い合わせ
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Left: Info */}
          <div className="space-y-8">
            {/* Address */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                アクセス
              </h2>
              <p className="text-[15px] text-[#2C2416] leading-relaxed">
                〒240-0115<br />
                神奈川県三浦郡葉山町上山口2432-3
              </p>
              <p className="text-[13px] text-[#8C7B6B] mt-2">
                駐車場あり（裏2台 + 徒歩200m先に8台・無料）
              </p>
            </div>

            {/* Hours */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                営業時間
              </h2>
              <div className="space-y-1 text-[15px] text-[#2C2416]">
                <p>月〜金 — 11:00 – 17:00</p>
                <p>土・日・祝 — 9:00 – 18:00</p>
                <p className="text-[13px] text-[#8C7B6B] mt-2">夏季は無休（毎日営業）</p>
              </div>
            </div>

            {/* Contact info */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                連絡先
              </h2>
              <div className="space-y-2 text-[15px]">
                <p>
                  <a
                    href="tel:+818087584368"
                    className="text-[#2C2416] hover:text-[#7AAFC4] transition-colors"
                  >
                    080-8758-4368
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:info@felicity.cafe"
                    className="text-[#2C2416] hover:text-[#7AAFC4] transition-colors"
                  >
                    info@felicity.cafe
                  </a>
                </p>
                <p>
                  <a
                    href="https://www.instagram.com/felicity_hayama"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2C2416] hover:text-[#7AAFC4] transition-colors"
                  >
                    @felicity_hayama
                  </a>
                </p>
              </div>
            </div>

            {/* Payment */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                お支払い
              </h2>
              <p className="text-[14px] text-[#8C7B6B]">
                クレジットカード / IC カード / PayPay（キャッシュレス）
              </p>
            </div>
          </div>

          {/* Right: Chat */}
          <div>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
              チャットで質問・ご予約
            </h2>
            <CafeChat locale="ja" />
          </div>
        </div>

        {/* Wholesale — the only way into the trade section is by asking us for
            an account, so this is the entry point for it. */}
        <section id="wholesale" className="mt-20 scroll-mt-20 border-t border-[#DDD5C5] pt-16">
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
            Wholesale
          </h2>
          <h3 className="text-[22px] font-light text-[#2C2416] mb-4">業販・卸売のお取引</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            <div className="space-y-4">
              <p className="text-[15px] text-[#2C2416] font-light leading-relaxed">
                カフェ・レストラン・ホテル・オフィスさま向けに、自家焙煎の
                コーヒー豆を1kg単位でお届けしています。焙煎度合いや挽き方のご相談、
                サンプルのご用意も承ります。
              </p>
              <p className="text-[14px] text-[#8C7B6B] font-light leading-relaxed">
                まずはメールでお問い合わせください。ご使用量やご希望をうかがったうえで、
                お見積りと専用ページのアカウントをお送りします。以降はご登録の
                メールアドレスでログインして、いつでもご発注いただけます。
              </p>
            </div>
            <div className="space-y-5">
              <a
                href={wholesaleMailto}
                className="inline-block bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-3 rounded-sm hover:bg-[#6A9DB3] transition-colors"
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
                宛に、会社名・ご担当者名・ご連絡先・ご希望の豆と月あたりのご使用量を
                お送りください。
              </p>
              <p className="text-[13px] text-[#8C7B6B] font-light leading-relaxed">
                取扱銘柄やお届けの条件は{' '}
                <a
                  href="/wholesale"
                  className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
                >
                  業販のご案内
                </a>
                {' '}をご覧ください。すでにお取引のあるお客さまは{' '}
                <a
                  href="/wholesale/login"
                  className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
                >
                  業販ログイン
                </a>
                へ。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
