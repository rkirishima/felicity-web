import { Footer } from '@/app/components/Footer';
import { BulletinBoard } from '@/app/components/BulletinBoard';
import { newsArticles } from '@/app/lib/news';
import Link from 'next/link';

export const metadata = {
  title: 'News | Felicity',
  description: 'Latest news from Felicity Coffee Roasters',
};

export default function NewsPageEn() {
  return (
    <div className="bg-[#F4EFE4] min-h-screen">
      <div className="bg-[#F4EFE4] border-b border-[#DDD5C5] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/en" className="text-[#2C2416] hover:text-[#8C7B6B] text-sm font-light">← Home</Link>
          <h1 className="text-[#2C2416] font-light">News</h1>
          <div className="w-16" />
        </div>
      </div>
      <main className="py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-24">
          {newsArticles.map((article, idx) => (
            <article key={article.id}>
              {idx > 0 && (
                <div className="flex items-center gap-4 mb-12">
                  <div className="flex-1 h-px bg-[#DDD5C5]" />
                  <p className="font-mono text-[9px] tracking-[0.2em] text-[#8C7B6B] uppercase">Archive</p>
                  <div className="flex-1 h-px bg-[#DDD5C5]" />
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <BulletinBoard photos={article.photos} alts={article.alts} />
                <div>
                  <p className="text-[11px] text-[#8C7B6B] mb-3 uppercase tracking-widest font-mono">{article.date_en}</p>
                  <h2 className="text-[22px] font-light text-[#2C2416] mb-6 leading-snug">{article.title_en}</h2>
                  <div className="text-[14px] text-[#5C5451] leading-relaxed space-y-4">
                    {article.body_en.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer locale="en" />
    </div>
  );
}
