'use client';

interface FooterProps {
  locale: 'ja' | 'en';
}

export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#DDD5C5] text-[#2C2416] py-12 px-4 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Left: Copyright */}
          <div className="text-[12px] text-[#8C7B6B]">
            © {currentYear} Felicity
          </div>

          {/* Center: Links */}
          <div className="flex gap-6 text-[12px]">
            <a
              href="mailto:info@felicity.cafe"
              className="text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
            >
              {locale === 'ja' ? 'メール' : 'Email'}
            </a>
            <a
              href="https://www.instagram.com/felicity_hayama"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
            >
              Instagram
            </a>
            {locale === 'ja' && (
              <a
                href="/ja/disclosure"
                className="text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
              >
                特定商取引法
              </a>
            )}
          </div>

          {/* Right: Legal */}
          <div className="text-[11px] text-[#8C7B6B]">
            {locale === 'ja' ? '無断転載・複製を禁止します' : 'All rights reserved'}
          </div>
        </div>
      </div>
    </footer>
  );
}
