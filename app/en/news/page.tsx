import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

const newsItems = [
  {
    id: '1',
    date: 'March 30, 2026',
    title: 'Felicity Coffee Roasters / Food Truck Launch',
    content: `Felicity is now launching two new ventures: "Felicity Coffee Roasters (FCR)" – our in-house roasting operation, and our food truck – specialty coffee on the move.

The spirit of "いっぱいのシアワセ" (one cup, full of happiness) that we've cultivated at our Hayama café will now reach more places through freshly roasted beans and our mobile coffee stand.

At our roastery, we carefully highlight the character of each origin, pursuing clean and comforting flavors for everyday moments.

Through our food truck, we bring Felicity's signature coffee beyond the café – to the streets, events, and everywhere our community gathers.

Food truck schedules and appearances will be announced on Instagram.`,
    image: '/images/news/food-truck.jpg',
  },
];

export const metadata = {
  title: 'News | Felicity Café',
  description: 'Latest news and updates from Felicity',
};

export default function NewsPageEN() {
  return (
    <>
      <Header locale="en" pathname="/en/news" contactLabel="Contact" />
      <main className="min-h-screen bg-[#F4EFE4] py-16 px-4 pt-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-[#2C2416] mb-2">News</h1>
          <p className="text-[#8C7B6B] mb-12">Latest updates from Felicity</p>

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
      <Footer locale="en" />
    </>
  );
}
