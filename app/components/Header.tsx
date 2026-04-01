'use client';

import Link from "next/link";
import Image from "next/image";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { ResponsiveNav } from "@/app/components/ResponsiveNav";
import { useCart } from "@/app/hooks/useCart";
import { useState, useEffect } from "react";

interface HeaderProps {
  locale: 'ja' | 'en';
  pathname: string;
  contactLabel: string;
}

export function Header({ locale, pathname, contactLabel }: HeaderProps) {
  const getTotalItems = useCart((state) => state.getTotalItems);
  const openCart = useCart((state) => state.openCart);
  const itemCount = getTotalItems();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-auto py-2 bg-[#F4EFE4] md:bg-[#F4EFE4]/95 backdrop-blur-sm border-b border-[#DDD5C5]">
      <div className="max-w-6xl mx-auto px-8 flex items-center justify-between gap-8">
        <Link href={locale === 'en' ? '/en/' : '/'} className="flex items-center flex-shrink-0 -ml-2">
          <Image
            src="/felicity-logo.png"
            alt="Felicity"
            width={2560}
            height={1600}
            priority
            className="h-16 w-auto scale-90"
          />
        </Link>
        
        {/* Desktop Nav + Mobile Hamburger */}
        <ResponsiveNav locale={locale} pathname={pathname} />
        
        {/* Right: Language Toggle + Contact + Instagram + Cart */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Language Toggle */}
          <LanguageToggle currentLocale={locale} currentPath={pathname} />
          {/* Contact */}
          <a
            href="mailto:info@felicity.cafe"
            aria-label="Email contact"
            className="text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="https://www.instagram.com/felicity_hayama"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
          {/* Cart Icon */}
          <button
            onClick={openCart}
            aria-label="Open shopping cart"
            className="relative text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#7AAFC4] text-white text-[10px] font-mono font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
