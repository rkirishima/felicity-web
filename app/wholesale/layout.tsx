import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "業販 | FELICITY COFFEE ROASTERS",
  description: "取引先さま専用の業販注文ページです。",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F4EFE4]">{children}</div>;
}
