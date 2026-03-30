import Link from "next/link";
import type { Locale } from "@/app/lib/translations";

interface LanguageToggleProps {
  currentLocale: Locale;
  currentPath: string;
}

export function LanguageToggle({ currentLocale, currentPath }: LanguageToggleProps) {
  // Remove locale prefix from path to create toggle links
  const cleanPath = currentPath
    .replace(/^\/en/, '')
    .replace(/^\/ja/, '')
    .replace(/\/$/, '') || '/';

  const otherLocale = currentLocale === 'en' ? 'ja' : 'en';
  
  // When toggling to Japanese from English, use `/` (root) as default
  // When toggling to English from Japanese, use `/en/`
  let otherLocalePath: string;
  if (otherLocale === 'en') {
    otherLocalePath = `/en${cleanPath}`;
  } else {
    // Toggling to Japanese
    if (cleanPath === '/') {
      otherLocalePath = '/'; // Root is Japanese default
    } else {
      otherLocalePath = `/ja${cleanPath}`;
    }
  }

  const otherLabel = otherLocale === 'en' ? 'EN' : 'JP';

  return (
    <Link
      href={otherLocalePath}
      className="font-mono text-[9px] sm:text-[12px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
      aria-label={`Switch to ${otherLabel}`}
    >
      {otherLabel}
    </Link>
  );
}
