'use client';

interface FooterProps {
  locale: 'ja' | 'en';
}

export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#DDD5C5] text-[#2C2416] py-16 px-4 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* About */}
          <div className="min-h-[80px]">
            <h3 className="text-[13px] font-light mb-3 uppercase tracking-widest">
              {locale === 'ja' ? 'について' : 'About'}
            </h3>
            <p className="text-[12px] text-[#8C7B6B] leading-relaxed">
              {locale === 'ja'
                ? '葉山のカフェでシングルオリジンのコーヒーを提供しています。'
                : 'Specialty coffee café in Hayama, Japan.'}
            </p>
          </div>

          {/* Contact */}
          <div className="min-h-[80px]">
            <h3 className="text-[13px] font-light mb-3 uppercase tracking-widest">
              {locale === 'ja' ? 'お問い合わせ' : 'Contact'}
            </h3>
            <a href="mailto:info@felicity.cafe" className="text-[12px] text-[#8C7B6B] hover:text-[#2C2416] transition-colors block">
              info@felicity.cafe
            </a>
          </div>

          {/* Social */}
          <div className="min-h-[80px]">
            <h3 className="text-[13px] font-light mb-3 uppercase tracking-widest">
              {locale === 'ja' ? 'フォロー' : 'Follow'}
            </h3>
            <a
              href="https://www.instagram.com/felicity_hayama"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[#8C7B6B] hover:text-[#2C2416] transition-colors block"
            >
              Instagram
            </a>
          </div>
        </div>

        <div className="border-t border-[#C8B89A] pt-8">
          <p className="text-[11px] text-[#8C7B6B] text-center">
            © {currentYear} Felicity. {locale === 'ja' ? '無断転載・複製を禁止します。' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
