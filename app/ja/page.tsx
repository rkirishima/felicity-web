import Link from "next/link";
import { Header } from "@/app/components/Header";
import { getMessages } from "@/app/lib/translations";

export const metadata = {
  title: "FELICITY COFFEE ROASTERS | スペシャルティコーヒー",
  description: "葉山のスペシャルティコーヒー専門店。",
  canonical: "https://felicity.cafe/ja/",
};

export default function HomePageJA() {
  const messages = getMessages('ja');
  const { homepage, experiences } = messages;

  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Header locale="ja" pathname="/ja/" contactLabel={homepage.nav.contact} />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="h-screen bg-[#DDD5C5] flex flex-col items-center justify-center relative pt-14">
        <div className="text-center">
          <h1 className="text-[clamp(56px,10vw,92px)] font-light text-[#2C2416] tracking-[0.12em] leading-none">
            {homepage.title}
          </h1>
          <p className="font-mono text-xs tracking-[0.28em] text-[#7AAFC4] mt-6 uppercase">
            {homepage.tagline}
          </p>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <a href="#coffee" aria-label={homepage.scrollAriaLabel} className="text-[#8C7B6B]/60 hover:text-[#8C7B6B] transition-colors">
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <line x1="8" y1="0" x2="8" y2="18" stroke="currentColor" strokeWidth="1" />
              <polyline points="3,13 8,19 13,13" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── Coffee ──────────────────────────────────────────────────────── */}
      <section id="coffee" className="bg-[#EDE5D8] pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-8">
          <p className="font-mono text-[12px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-12">
            {homepage.coffee.label}
          </p>

          <h2 className="text-[clamp(40px,6vw,58px)] font-light text-[#2C2416] leading-tight mb-16">
            Single-Origin Specialty
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#DDD5C5] border border-[#DDD5C5]">
            {[
              { name: "Brazil Serra do Ciganos", country: "Brazil", process: "Natural", weight: "100g", price: "¥2,200" },
              { name: "Ethiopia Yirgacheffe G1", country: "Ethiopia", process: "Washed", weight: "100g", price: "¥2,400" },
              { name: "Papua New Guinea Suguba", country: "Papua New Guinea", process: "Washed", weight: "100g", price: "¥2,100" },
            ].map((product) => (
              <Link
                key={product.name}
                href={`/ja/products/${product.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="group block h-96 overflow-hidden bg-[#EDE5D8]"
              >
                {/* Image placeholder */}
                <div className="w-full h-[60%] bg-[#DDD5C5] flex items-center justify-center relative">
                  <span className="absolute top-3 left-3 font-mono text-[8px] tracking-[0.14em] text-[#2C2416] bg-[#C8B89A] px-2 py-1 uppercase">
                    近日公開
                  </span>
                </div>

                {/* Info */}
                <div className="h-[40%] px-6 py-5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-[20px] font-light text-[#2C2416] leading-snug tracking-tight">
                      {product.name}
                    </h2>
                    <p className="font-mono text-[12px] tracking-[0.2em] text-[#8C7B6B] mt-2 uppercase">
                      {product.country}&nbsp;&nbsp;/&nbsp;&nbsp;{product.process}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="font-mono text-[12px] tracking-[0.06em] text-[#8C7B6B]">
                      {product.weight}&nbsp;&nbsp;—&nbsp;&nbsp;
                      <span className="text-[#7AAFC4]">{product.price}</span>
                    </p>
                    <span className="font-mono text-[9px] tracking-[0.08em] text-[#C8B89A]">
                      GTIN
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experiences ────────────────────────────────────────────────────── */}
      <section id="experiences" className="bg-[#F4EFE4] pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-8">
          <p className="font-mono text-[11px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-12">
            {experiences.title}
          </p>

          <h2 className="text-[clamp(40px,6vw,58px)] font-light text-[#2C2416] leading-tight mb-8">
            {experiences.heading}
          </h2>

          <p className="text-[17px] font-light text-[#8C7B6B] leading-relaxed max-w-3xl mb-16">
            {experiences.explanation}
          </p>

          {/* 3-column grid of experiences */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {experiences.workshops.map((exp) => (
              <div key={exp.name} className="bg-[#EDE5D8] rounded-lg p-8 flex flex-col">
                <h3 className="text-[20px] font-light text-[#2C2416] mb-3">
                  {exp.name}
                </h3>
                <p className="text-[16px] font-light text-[#8C7B6B] leading-relaxed flex-grow">
                  {exp.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center border-t border-[#DDD5C5] pt-12">
            <p className="text-[16px] font-light text-[#2C2416] mb-4">
              {experiences.cta}
            </p>
            <a
              href="https://www.instagram.com/felicity_hayama"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-6 py-3 hover:bg-[#7AAFC4] hover:text-[#2C2416] transition-colors"
            >
              @felicity_hayama
            </a>
          </div>
        </div>
      </section>

      {/* ── Visit ───────────────────────────────────────────────────────── */}
      <section id="visit" className="bg-[#F4EFE4] pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-8">
          <p className="font-mono text-[11px] tracking-[0.3em] text-[#8C7B6B] uppercase mb-12">
            {homepage.visit.label}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            {/* Left: info */}
            <div>
              <p className="text-[16px] font-light text-[#2C2416] leading-relaxed mb-8">
                {homepage.visit.address}
              </p>

              <table className="w-full text-sm mb-8">
                <tbody className="divide-y divide-[#DDD5C5]">
                  {homepage.visit.hours.map(({ day, hours }) => (
                    <tr key={day}>
                      <td className="font-mono text-[12px] tracking-[0.1em] text-[#8C7B6B] py-3 pr-8 w-32">
                        {day}
                      </td>
                      <td className="text-[15px] font-light text-[#2C2416] py-3">
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
                className="font-mono text-[12px] tracking-[0.14em] text-[#7AAFC4] hover:text-[#2C2416] transition-colors uppercase"
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
          <p className="font-mono text-[12px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-4">
            {homepage.footer.copyright}
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <Link
              href="/ja/about"
              className="font-mono text-[10px] sm:text-[12px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
            >
              {homepage.footer.about}
            </Link>
            <a
              href="https://www.instagram.com/felicity_hayama"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] sm:text-[12px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors uppercase"
            >
              {homepage.footer.instagram}
            </a>
            <a
              href="/ja/disclosure"
              className="font-mono text-[10px] sm:text-[12px] tracking-[0.14em] text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
            >
              {homepage.footer.disclosure}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
