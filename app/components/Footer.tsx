'use client';

interface FooterProps {
  locale: 'ja' | 'en';
}

export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2C2416] text-[#F4EFE4] py-12 px-4 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-[14px] font-light mb-4 uppercase tracking-widest">
              {locale === 'ja' ? 'について' : 'About'}
            </h3>
            <p className="text-[12px] text-[#DDD5C5] leading-relaxed">
              {locale === 'ja'
                ? '葉山のカフェでシングルオリジンのコーヒーを提供しています。'
                : 'Specialty coffee café in Hayama, Japan.'}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[14px] font-light mb-4 uppercase tracking-widest">
              {locale === 'ja' ? 'お問い合わせ' : 'Contact'}
            </h3>
            <a href="mailto:info@felicity.cafe" className="text-[12px] text-[#DDD5C5] hover:text-[#7AAFC4] transition-colors">
              info@felicity.cafe
            </a>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-[14px] font-light mb-4 uppercase tracking-widest">
              {locale === 'ja' ? 'フォロー' : 'Follow'}
            </h3>
            <a
              href="https://www.instagram.com/felicity_hayama"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[#DDD5C5] hover:text-[#7AAFC4] transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>

        <div className="border-t border-[#5C5451] pt-8">
          <p className="text-[11px] text-[#8C7B6B] text-center">
            © {currentYear} Felicity Café. {locale === 'ja' ? '無断転載・複製を禁止します。' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
