import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// 社内ツール。検索結果には絶対に出さない。
export const metadata: Metadata = {
  title: 'Felicity SEOコーチ',
  robots: { index: false, follow: false, nocache: true },
};

export default function SeoLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#F4EFE4] text-[#2C2416]">{children}</div>;
}
