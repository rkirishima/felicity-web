import Link from "next/link";
import type { Metadata } from "next";
import { getMessages } from "@/app/lib/translations";
import { getBreadcrumbSchema } from "@/app/lib/schema";
import { LanguageToggle } from "@/app/components/LanguageToggle";

export const metadata: Metadata = {
  title: "フェリシティについて | FELICITY COFFEE ROASTERS",
  description: "なぜコーヒー、なぜ葉山 — 私たちの物語と哲学。",
  alternates: {
    canonical: "https://felicity.cafe/about",
    languages: {
      ja: "https://felicity.cafe/about",
      en: "https://felicity.cafe/en/about",
    },
  },
};

const breadcrumbSchema = getBreadcrumbSchema([
  { name: "ホーム", url: "https://felicity.cafe" },
  { name: "について", url: "https://felicity.cafe/about" },
]);

export default function AboutPage() {
  const messages = getMessages('ja');
  const { about } = messages;

  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-[#DDD5C5] h-14 flex items-center px-8">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-mono text-xs tracking-[0.22em] text-[#2C2416] uppercase hover:text-[#8C7B6B] transition-colors"
            >
              Felicity
            </Link>
            <LanguageToggle currentLocale="ja" currentPath="/about" />
          </div>
          <Link
            href="/"
            className="font-mono text-[9px] tracking-[0.16em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-8 pt-24 pb-32">
        <p className="font-mono text-[9px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-12">
          {about.subtitle}
        </p>

        <h1 className="text-[clamp(36px,5vw,56px)] font-light text-[#2C2416] tracking-tight leading-tight mb-16">
          {about.title}
        </h1>

        <div className="space-y-8 max-w-2xl text-[16px] font-light text-[#2C2416] leading-relaxed">
          {about.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-[#DDD5C5]">
          <p className="font-mono text-[9px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-1">
            Hayama, Kanagawa
          </p>
          <p className="font-mono text-[9px] tracking-[0.2em] text-[#C8B89A] uppercase">
            Est. 2024
          </p>
        </div>
      </article>
    </main>
  );
}
