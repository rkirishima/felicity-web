import { ExperiencesSection } from "@/app/components/ExperiencesSection";
import { CollapsibleAbout } from "@/app/components/CollapsibleAbout";
import { BulletinBoard } from "@/app/components/BulletinBoard";
import { latestArticle } from "@/app/lib/news";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/app/components/Header";
import { MerchSection } from "@/app/components/MerchSection";
import { CoffeeGrid } from "@/app/components/CoffeeGrid";
import HeroCarousel from "@/app/components/HeroCarousel";
import { getMessages } from "@/app/lib/translations";

export const metadata = {
  title: "FELICITY COFFEE ROASTERS | スペシャルティコーヒー",
  description: "葉山のスペシャルティコーヒー専門店。",
  canonical: "https://felicity.cafe/",
};

export default function Home() {
  const messages = getMessages('ja');
  const { homepage, experiences } = messages;

  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Header locale="ja" pathname="/" contactLabel={homepage.nav.contact} />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden mt-16 md:mt-0">
        {/* Video carousel */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel />
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>

        {/* Centered content */}

        {/* Centered content */}
        <div className="relative z-20 md:z-50 text-center flex flex-col items-center justify-center h-full">
          {/* Logo */}
          <div className="mb-3 md:mb-6 flex items-center">
            <Image
              src="/felicity-logo-white.png"
              alt="Felicity"
              width={1604}
              height={663}
              priority
              className="h-16 md:h-24 w-auto brightness-[1.2]"
              style={{ filter: 'brightness(1.3) drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
            />
          </div>

          {/* Tagline */}
          <p className="font-light text-white text-[clamp(8px,1.5vw,14px)] md:text-[clamp(10px,2.2vw,18px)] tracking-[0.08em] drop-shadow-md">
            いっぱいのシアワセ
          </p>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
          <a href="#philosophy" aria-label={homepage.scrollAriaLabel} className="text-white/60 hover:text-white transition-colors">
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <line x1="8" y1="0" x2="8" y2="18" stroke="currentColor" strokeWidth="1" />
              <polyline points="3,13 8,19 13,13" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────────────────── */}
      <section id="philosophy" className="bg-[#F4EFE4] pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-8">
          <p className="font-mono text-[9px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-8">
            Our Story
          </p>
          
          <h2 className="text-[clamp(20px,3vw,28px)] font-light text-[#2C2416] leading-tight mb-12">
            Why Coffee, Why Hayama
          </h2>

          <div className="space-y-6 text-[16px] font-light text-[#2C2416] leading-relaxed">
            <CollapsibleAbout content={messages.about.content} />
          </div>

          <div className="mt-16 pt-8 border-t border-[#DDD5C5]">
            <p className="font-mono text-[8px] tracking-[0.2em] text-[#8C7B6B] uppercase">
              Hayama, Kanagawa — Est. 2024
            </p>
          </div>
        </div>
      </section>

      {/* ── Coffee ──────────────────────────────────────────────────────── */}
      <section id="coffee" className="bg-[#EDE5D8] pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-8">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-12">
            {homepage.coffee.label}
          </p>

          <h2 className="text-[clamp(36px,5vw,52px)] font-light text-[#2C2416] leading-tight mb-16">
            Single-Origin Specialty
          </h2>

          <CoffeeGrid locale="ja" />
        </div>
      </section>

      {/* ── Merch ───────────────────────────────────────────────────────── */}
      <MerchSection language="ja" apparel={homepage.merch.apparel} />
      {/* ── Experiences ─────────────────────────────────────────────────── */}
      <ExperiencesSection locale="ja" />
      {/* ── News ─────────────────────────────────────────────────────── */}
      <section id="news" className="bg-[#EDE5D8] pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-8">
          <p className="font-mono text-[9px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-12">News</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <BulletinBoard photos={latestArticle.photos} alts={latestArticle.alts} />
            <div>
              <p className="text-[11px] text-[#8C7B6B] mb-3 uppercase tracking-widest font-mono">{latestArticle.date}</p>
              <h2 className="text-[22px] font-light text-[#2C2416] mb-6 leading-snug">{latestArticle.title}</h2>
              <div className="text-[14px] text-[#5C5451] leading-relaxed space-y-4 mb-8">
                {latestArticle.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <Link href="/news" className="font-mono text-[10px] tracking-[0.14em] text-[#7AAFC4] hover:text-[#2C2416] transition-colors uppercase">
                すべてのニュース →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Visit ───────────────────────────────────────────────────────── */}
      <section id="visit" className="bg-[#F4EFE4] pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-8">
          <p className="font-mono text-[9px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-12">
            {homepage.visit.label}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            {/* Left: info */}
            <div>
              <p className="text-[15px] font-light text-[#2C2416] leading-relaxed mb-8">
                {homepage.visit.address}
              </p>

              <table className="w-full text-sm mb-8">
                <tbody className="divide-y divide-[#DDD5C5]">
                  {homepage.visit.hours.map(({ day, hours }) => (
                    <tr key={day}>
                      <td className="font-mono text-[10px] tracking-[0.1em] text-[#8C7B6B] py-3 pr-8 w-32">
                        {day}
                      </td>
                      <td className="text-[13px] font-light text-[#2C2416] py-3">
                        {hours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <a
                href="https://www.instagram.com/felicity_hayama"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] tracking-[0.14em] text-[#7AAFC4] hover:text-[#2C2416] transition-colors uppercase"
              >
                @felicity_hayama
              </a>
            </div>

            {/* Right: Google Maps */}
            <div className="h-64 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3254.567!2d139.6102834!3d35.2673650!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6019d1234567%3A0xfelicity!2sFelicity%20Cafe!5e0!3m2!1sen!2sjp!4v1711270800000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#F4EFE4] py-12">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-4">
            {homepage.footer.copyright}
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <Link
              href="/about"
              className="font-mono text-[8px] sm:text-[10px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
            >
              {homepage.footer.about}
            </Link>
            <a
              href="https://www.instagram.com/felicity_hayama"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[8px] sm:text-[10px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
            >
              {homepage.footer.instagram}
            </a>
            <a
              href="/ja/disclosure"
              className="font-mono text-[8px] sm:text-[10px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
            >
              {homepage.footer.disclosure}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
