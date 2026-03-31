import { Footer } from '@/app/components/Footer';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'News | Felicity',
  description: 'Latest news and updates from Felicity',
};

export default function NewsPageEN() {
  return (
    <>
      {/* Simple Header with Back Link */}
      <header className="sticky top-0 left-0 right-0 z-[50] bg-[#F4EFE4] border-b border-[#DDD5C5] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/en" className="text-[#2C2416] hover:text-[#8C7B6B] text-sm">
            ← Back
          </Link>
          <span className="text-[#2C2416] font-light">News</span>
          <div className="w-12" />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="bg-[#F4EFE4] pt-16 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-[#2C2416] mb-2">News</h1>
          <p className="text-[#8C7B6B] mb-16">Latest updates from Felicity</p>

          {/* News Article */}
          <article className="bg-white rounded-sm shadow-sm overflow-hidden mb-16">
            <div className="flex flex-col">
              <div className="relative w-full aspect-video bg-[#DDD5C5]">
                <Image
                  src="/images/news/food-truck.jpg"
                  alt="Felicity Coffee Roasters Food Truck Launch"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="p-8">
                <p className="text-[12px] text-[#8C7B6B] mb-2 uppercase tracking-widest">
                  March 30, 2026
                </p>
                <h2 className="text-2xl font-light text-[#2C2416] mb-4">
                  Felicity Coffee Roasters / Food Truck Launch
                </h2>
                <div className="text-[14px] text-[#5C5451] leading-relaxed space-y-4">
                  <p>
                    Felicity is now launching two new ventures: "Felicity Coffee Roasters (FCR)" – our in-house roasting operation, and our food truck – specialty coffee on the move.
                  </p>
                  <p>
                    The spirit of "いっぱいのシアワセ" (one cup, full of happiness) that we've cultivated at our Hayama café will now reach more places through freshly roasted beans and our mobile coffee stand.
                  </p>
                  <p>
                    At our roastery, we carefully highlight the character of each origin, pursuing clean and comforting flavors for everyday moments.
                  </p>
                  <p>
                    Through our food truck, we bring Felicity's signature coffee beyond the café – to the streets, events, and everywhere our community gathers.
                  </p>
                  <p>
                    Food truck schedules and appearances will be announced on Instagram.
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3256.6789012345!2d139.6102834!3d35.2673650!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018cc5c5c5c5c5d%3A0x5c5c5c5c5c5c5c5c!2sFelicity%20Cafe!5e0!3m2!1sen!2sjp!4v1234567890"
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
