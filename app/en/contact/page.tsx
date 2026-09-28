import type { Metadata } from 'next';
import Link from 'next/link';
import { LanguageToggle } from '@/app/components/LanguageToggle';
import { CafeChat } from '@/app/components/CafeChat';
import { getBreadcrumbSchema } from '@/app/lib/schema';

export const metadata: Metadata = {
  title: 'Contact | FELICITY COFFEE ROASTERS',
  description:
    'Contact FELICITY COFFEE ROASTERS in Hayama, Japan. Directions, hours, and reservations.',
  alternates: {
    canonical: 'https://felicity.cafe/en/contact',
    languages: {
      ja: 'https://felicity.cafe/contact',
      en: 'https://felicity.cafe/en/contact',
    },
  },
};

// Opens the mail client with the details we'd otherwise have to ask for in a
// second round trip before an account can be issued.
const wholesaleMailto =
  'mailto:info@felicity.cafe?subject=' +
  encodeURIComponent('Wholesale enquiry') +
  '&body=' +
  encodeURIComponent(
    [
      'Dear FELICITY COFFEE ROASTERS,',
      '',
      "I'd like to ask about wholesale supply.",
      '',
      '- Company / venue:',
      '- Contact name:',
      '- Address:',
      '- Phone:',
      '- Coffees of interest and monthly volume (kg):',
      '- Preferred delivery (shipping / pick-up):',
      '- Questions:',
      '',
    ].join('\n'),
  );

const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Home', url: 'https://felicity.cafe/en/' },
  { name: 'Contact', url: 'https://felicity.cafe/en/contact' },
]);

export default function ContactPageEN() {
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
              href="/en/"
              className="font-mono text-xs tracking-[0.22em] text-[#2C2416] uppercase hover:text-[#8C7B6B] transition-colors"
            >
              Felicity
            </Link>
            <LanguageToggle currentLocale="en" currentPath="/en/contact" />
          </div>
          <Link
            href="/en/"
            className="font-mono text-[12px] tracking-[0.16em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 pt-16 pb-32">
        <p className="font-mono text-[11px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-8">
          Contact
        </p>
        <h1 className="text-[clamp(32px,5vw,48px)] font-light text-[#2C2416] tracking-tight leading-tight mb-16">
          Get in Touch
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Left: Info */}
          <div className="space-y-8">
            {/* Address */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                Location
              </h2>
              <p className="text-[15px] text-[#2C2416] leading-relaxed">
                2432-3 Kamiyamaguchi<br />
                Hayama-cho, Miura-gun<br />
                Kanagawa 240-0115, Japan
              </p>
              <p className="text-[13px] text-[#8C7B6B] mt-2">
                Free parking (2 behind shop + 8 spaces 200m away)
              </p>
            </div>

            {/* Hours */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                Hours
              </h2>
              <div className="space-y-1 text-[15px] text-[#2C2416]">
                <p>Mon – Fri — 11:00 – 17:00</p>
                <p>Sat, Sun &amp; public holidays — 9:00 – 18:00</p>
                <p className="text-[13px] text-[#8C7B6B] mt-2">Open daily through the summer</p>
              </div>
            </div>

            {/* Contact info */}
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
                Contact
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
                Payment
              </h2>
              <p className="text-[14px] text-[#8C7B6B]">
                Credit cards / IC cards / PayPay (cashless only)
              </p>
            </div>
          </div>

          {/* Right: Chat */}
          <div>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
              Chat with us
            </h2>
            <CafeChat locale="en" />
          </div>
        </div>

        {/* Wholesale — the trade section is account-only, so this is where a
            prospective partner starts. */}
        <section id="wholesale" className="mt-20 scroll-mt-20 border-t border-[#DDD5C5] pt-16">
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-3">
            Wholesale
          </h2>
          <h3 className="text-[22px] font-light text-[#2C2416] mb-4">Trade &amp; wholesale</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            <div className="space-y-4">
              <p className="text-[15px] text-[#2C2416] font-light leading-relaxed">
                We supply cafés, restaurants, hotels and offices with our own
                roasted coffee by the kilogram. Happy to talk through roast
                levels and grind, and to send samples.
              </p>
              <p className="text-[14px] text-[#8C7B6B] font-light leading-relaxed">
                Start with an email. Once we know your volume and what you are
                after, we send a quote and an account for the trade section —
                after that you sign in with your email address and order
                whenever you need to.
              </p>
            </div>
            <div className="space-y-5">
              <a
                href={wholesaleMailto}
                className="inline-block bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-3 rounded-sm hover:bg-[#6A9DB3] transition-colors"
              >
                Enquire about wholesale
              </a>
              <p className="text-[13px] text-[#8C7B6B] font-light leading-relaxed">
                If your mail client doesn&apos;t open, write to{' '}
                <a
                  href="mailto:info@felicity.cafe"
                  className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
                >
                  info@felicity.cafe
                </a>{' '}
                with your company, contact name, phone, and the coffees and
                monthly volume you have in mind.
              </p>
              <p className="text-[13px] text-[#8C7B6B] font-light leading-relaxed">
                Our coffees and delivery terms are on the{' '}
                <a
                  href="/wholesale"
                  className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
                >
                  wholesale page
                </a>
                . Existing trade customers{' '}
                <a
                  href="/wholesale/login"
                  className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
                >
                  sign in here
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
