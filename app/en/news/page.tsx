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
      <main className="min-h-screen bg-[#F4EFE4] py-16 px-4" style={{ paddingTop: '120px' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-[#2C2416] mb-2">News</h1>
          <p className="text-[#8C7B6B] mb-12">Latest updates from Felicity</p>

          <div className="space-y-12">
            {newsItems.map((item) => (
              <article key={item.id} className="bg-white rounded-sm shadow-sm overflow-hidden">
                <div className="flex flex-col">
                  <div className="relative w-full h-64 bg-[#DDD5C5]" />
                  <div className="p-8">
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
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-[#2C2416] mb-12">Visit</h2>
          
          {/* Map */}
          <div className="mb-12 rounded-sm overflow-hidden h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3256.6789012345!2d139.6102834!3d35.2673650!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018cc5c5c5c5c5d%3A0x5c5c5c5c5c5c5c5c!2sFelicity%20Cafe!5e0!3m2!1sen!2sjp!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Location */}
            <div className="flex gap-4">
              <div className="w-6 h-6 flex-shrink-0">
                <svg className="w-full h-full stroke-[#8C7B6B]" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[14px] font-light text-[#2C2416] mb-2">Location</h3>
                <p className="text-[13px] text-[#8C7B6B] leading-relaxed">
                  2432-3 Kamiyamaguchi<br />
                  Hayama, Kanagawa<br />
                  240-0112 Japan
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
                <h3 className="text-[14px] font-light text-[#2C2416] mb-2">Hours</h3>
                <p className="text-[13px] text-[#8C7B6B] leading-relaxed">
                  Weekdays: 11:00 - 17:00<br />
                  Weekends: 9:00 - 17:00<br />
                  Closed: Wed & Thu
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
                <h3 className="text-[14px] font-light text-[#2C2416] mb-2">Contact</h3>
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

      <Footer locale="en" />
    </>
  );
}
