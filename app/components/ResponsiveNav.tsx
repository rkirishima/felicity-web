'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ResponsiveNavProps {
  locale: 'ja' | 'en';
  pathname: string;
}

export function ResponsiveNav({ locale, pathname }: ResponsiveNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine the ABOUT link based on locale
  const aboutLink = locale === 'en' ? '/en/about' : locale === 'ja' ? '/ja/about' : '/about';

    const newsLink = '/#news';
  
  const navItems = [
    { label: 'ABOUT US', href: '#philosophy' },
    { label: 'COFFEE', href: '#coffee' },
    { label: 'GOODS', href: '#merch' },
    { label: 'EXPERIENCES', href: '#experiences' },
    { label: 'NEWS', href: newsLink },
    { label: 'VISIT', href: '#visit' },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Nav: Hidden on mobile, flex on sm+ */}
      <nav className="hidden sm:flex items-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="font-mono text-[12px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Hamburger Menu: Visible on mobile only */}
      <div className="sm:hidden relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          className="flex flex-col items-center justify-center w-8 h-8 gap-1.5 text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
        >
          {/* Hamburger icon */}
          <span
            className={`w-5 h-0.5 bg-current transition-all duration-300 origin-center ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-current transition-all duration-300 ${
              isOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-current transition-all duration-300 origin-center ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-[#F4EFE4] border border-[#DDD5C5] rounded-sm shadow-lg z-50">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block w-full px-6 py-3 font-mono text-[10px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] hover:bg-[#EDE5D8] transition-colors uppercase border-b border-[#DDD5C5] last:border-b-0"
                onClick={handleNavClick}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
