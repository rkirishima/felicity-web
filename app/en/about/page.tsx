import Link from "next/link";
import type { Metadata } from "next";
import { getMessages } from "@/app/lib/translations";
import { getBreadcrumbSchema } from "@/app/lib/schema";
import { LanguageToggle } from "@/app/components/LanguageToggle";

export const metadata: Metadata = {
  title: "About FELICITY | FELICITY COFFEE ROASTERS",
  description: "Why Coffee, Why Hayama — Our story and philosophy.",
  alternates: {
    canonical: "https://felicity.cafe/en/about",
  },
};

const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Home", url: "https://felicity.cafe/en/" },
  { name: "About", url: "https://felicity.cafe/en/about" },
]);

export default function AboutPageEN() {
  const messages = getMessages('en');
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
              href="/en/"
              className="font-mono text-xs tracking-[0.22em] text-[#2C2416] uppercase hover:text-[#8C7B6B] transition-colors"
            >
              Felicity
            </Link>
            <LanguageToggle currentLocale="en" currentPath="/en/about" />
          </div>
          <Link
            href="/en/"
            className="font-mono text-[12px] tracking-[0.16em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-8 pt-24 pb-32">
        <p className="font-mono text-[11px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-12">
          {about.subtitle}
        </p>

        <h1 className="text-[clamp(40px,6vw,60px)] font-light text-[#2C2416] tracking-tight leading-tight mb-16">
          {about.title}
        </h1>

        <div className="space-y-8 max-w-2xl text-[18px] font-light text-[#2C2416] leading-relaxed">
          {about.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-[#DDD5C5]">
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-1">
            Hayama, Kanagawa
          </p>
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#C8B89A] uppercase">
            Est. 2024
          </p>
        </div>
      </article>
    </main>
  );
}
