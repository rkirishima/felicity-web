import { Footer } from '@/app/components/Footer';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'ニュース | Felicity',
  description: 'Felicityの最新ニュースと情報',
};

export default function NewsPage() {
  return (
    <div className="bg-[#F4EFE4] min-h-screen">
      {/* Simple top bar */}
      <div className="bg-[#F4EFE4] border-b border-[#DDD5C5] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[#2C2416] hover:text-[#8C7B6B] text-sm font-light">
            ← Home
          </Link>
          <h1 className="text-[#2C2416] font-light">ニュース</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <main className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#8C7B6B] mb-16">Felicityの最新情報をお届けします</p>

          {/* News Article */}
          <article className="bg-white rounded-sm shadow-sm overflow-hidden mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Images Column */}
              <div className="flex flex-col">
                <div className="relative w-full bg-[#DDD5C5]" style={{ height: '300px' }}>
                  <Image
                    src="/images/news/food-truck.jpg"
                    alt="Felicity Coffee Roasters Food Truck"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="relative w-full bg-[#DDD5C5]" style={{ height: '300px' }}>
                  <Image
                    src="/images/news/roasting.jpg"
                    alt="Felicity Coffee Roasters Probat Roasting"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              {/* Content Column */}
              <div className="p-8 flex flex-col justify-center">
                <p className="text-[12px] text-[#8C7B6B] mb-2 uppercase tracking-widest">
                  2026年3月30日
                </p>
                <h2 className="text-2xl font-light text-[#2C2416] mb-4">
                  Felicity Coffee Roasters / キッチンカーがスタート
                </h2>
                <div className="text-[14px] text-[#5C5451] leading-relaxed space-y-4">
                  <p>
                    Felicityではこのたび、自家焙煎事業「Felicity Coffee Roasters（FCR）」とキッチンカーでのコーヒー提供をスタートしました。
                  </p>
                  <p>
                    葉山の店舗で大切にしてきた「いっぱいのシアワセ」を、これからは焙煎した豆と移動するコーヒースタンドを通して、もっとさまざまな場所へ届けていきます。
                  </p>
                  <p>
                    焙煎所では、産地ごとの個性を丁寧に引き出しながら、日常に寄り添うクリーンで心地よい味わいを追求しています。
                  </p>
                  <p>
                    キッチンカーでは、Felicityらしい一杯をそのまま外へ持ち出し、街やイベント、さまざまなシーンでお楽しみいただけます。
                  </p>
                  <p>
                    キッチンカーの出店情報や営業日は、Instagramにて随時ご案内いたします。
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* VISIT Section */}
      <section className="bg-[#EDE5D8] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Map */}
          <div className="mb-12 rounded-sm overflow-hidden h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3256.6789012345!2d139.6102834!3d35.2673650!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018cc5c5c5c5c5d%3A0x5c5c5c5c5c5c5c5c!2sFelicity%20Cafe!5e0!3m2!1sja!2sjp!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Address */}
            <div className="flex gap-4">
              <div className="w-6 h-6 flex-shrink-0">
                <svg className="w-full h-full stroke-[#8C7B6B]" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[14px] font-light text-[#2C2416] mb-2">アクセス</h3>
                <p className="text-[13px] text-[#8C7B6B] leading-relaxed">
                  〒240-0112<br />
                  神奈川県三浦郡葉山町<br />
                  上山口2432-3
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4">
              <div className="w-6 h-6 flex-shrink-0">
                <svg className="w-full h-full stroke-[#8C7B6B]" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 2m6-11a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[14px] font-light text-[#2C2416] mb-2">営業時間</h3>
                <p className="text-[13px] text-[#8C7B6B] leading-relaxed">
                  平日: 11:00 - 17:00<br />
                  土日: 9:00 - 17:00<br />
                  定休: 水・木
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex gap-4">
              <div className="w-6 h-6 flex-shrink-0">
                <svg className="w-full h-full stroke-[#8C7B6B]" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[14px] font-light text-[#2C2416] mb-2">連絡先</h3>
                <p className="text-[13px] text-[#8C7B6B] leading-relaxed">
                  <a href="mailto:info@felicity.cafe" className="hover:text-[#2C2416] transition-colors">
                    info@felicity.cafe
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer locale="ja" />
    </div>
  );
}
