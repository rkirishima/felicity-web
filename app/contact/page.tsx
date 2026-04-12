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
                駐車場あり（無料）
              </p>
            </div>

            {/* Hours */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                営業時間
              </h2>
              <div className="space-y-1 text-[15px] text-[#2C2416]">
                <p>月・火・金 — 11:00 – 17:00</p>
                <p>土・日 — 9:00 – 17:00</p>
                <p className="text-[#8C7B6B]">定休日: 水・木</p>
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
      </div>
    </main>
  );
}
