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
      <main className="min-h-screen bg-[#F4EFE4] py-16 px-4 pt-32">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-[18px] font-light text-[#2C2416] mb-4">アクセス</h3>
              <p className="text-[14px] text-[#8C7B6B] leading-relaxed mb-4">
                〒240-0112<br />
                神奈川県三浦郡葉山町上山口2432-3
              </p>
              <p className="text-[14px] text-[#8C7B6B]">
                📧 info@felicity.cafe<br />
                📱 Instagram: @felicity_hayama
              </p>
            </div>
            <div>
              <h3 className="text-[18px] font-light text-[#2C2416] mb-4">営業時間</h3>
              <p className="text-[14px] text-[#8C7B6B] leading-relaxed">
                平日: 11:00 - 17:00<br />
                土日: 9:00 - 17:00<br />
                定休日: 水曜・木曜
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer locale="ja" />
    </>
  );
}
