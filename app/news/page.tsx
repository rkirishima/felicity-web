import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

const newsItems = [
  {
    id: '1',
    date: '2026年3月30日',
    title: 'Felicity Coffee Roasters / キッチンカーがスタート',
    content: `Felicityではこのたび、自家焙煎事業「Felicity Coffee Roasters（FCR）」とキッチンカーでのコーヒー提供をスタートしました。

葉山の店舗で大切にしてきた「いっぱいのシアワセ」を、これからは焙煎した豆と移動するコーヒースタンドを通して、もっとさまざまな場所へ届けていきます。

焙煎所では、産地ごとの個性を丁寧に引き出しながら、日常に寄り添うクリーンで心地よい味わいを追求しています。

キッチンカーでは、Felicityらしい一杯をそのまま外へ持ち出し、街やイベント、さまざまなシーンでお楽しみいただけます。

キッチンカーの出店情報や営業日は、Instagramにて随時ご案内いたします。`,
    image: '/images/news/food-truck.jpg',
  },
];

export const metadata = {
  title: 'ニュース | Felicity Café',
  description: 'Felicityの最新ニュースと情報',
};

export default function NewsPage() {
  return (
    <>
      <Header locale="ja" pathname="/news" contactLabel="お問い合わせ" />
      <main className="min-h-screen bg-[#F4EFE4] py-16 px-4" style={{ paddingTop: '120px' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-[#2C2416] mb-2">ニュース</h1>
          <p className="text-[#8C7B6B] mb-12">Felicityの最新情報をお届けします</p>

          <div className="space-y-12">
            {newsItems.map((item) => (
              <article key={item.id} className="bg-white rounded-sm shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-auto bg-[#DDD5C5]" />
                  <div className="p-8 flex flex-col justify-center">
                    <p className="text-[12px] text-[#8C7B6B] mb-2 uppercase tracking-widest">
                      {item.date}
                    </p>
                    <h2 className="text-2xl font-light text-[#2C2416] mb-4">{item.title}</h2>
                    <div className="text-[14px] text-[#5C5451] leading-relaxed whitespace-pre-line">
                      {item.content}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* VISIT Section */}
      <section id="visit" className="bg-[#EDE5D8] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-[#2C2416] mb-12">訪問</h2>
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
                  </a><br />
                  <a href="https://www.instagram.com/felicity_hayama" target="_blank" rel="noopener noreferrer" className="hover:text-[#2C2416] transition-colors">
                    @felicity_hayama
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer locale="ja" />
    </>
  );
}
