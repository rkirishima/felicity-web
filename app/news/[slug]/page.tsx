import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Footer } from '@/app/components/Footer';
import { BulletinBoard } from '@/app/components/BulletinBoard';
import { newsArticles, getArticleBySlug, articleExcerpt } from '@/app/lib/news';
import { getArticleSchema, getBreadcrumbSchema } from '@/app/lib/schema';

const BASE_URL = 'https://felicity.cafe';

export function generateStaticParams() {
  return newsArticles.map((article) => ({ slug: article.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'ニュース | FELICITY COFFEE ROASTERS' };

  const url = `${BASE_URL}/news/${article.id}`;
  const description = articleExcerpt(article, 'ja');
  const image = `${BASE_URL}${article.photos[0]}`;

  return {
    title: article.title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ja: url,
        en: `${BASE_URL}/en/news/${article.id}`,
      },
    },
    openGraph: {
      type: 'article',
      locale: 'ja_JP',
      url,
      title: article.title,
      description,
      publishedTime: article.published,
      images: [{ url: image }],
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const url = `${BASE_URL}/news/${article.id}`;
  const articleSchema = getArticleSchema({
    headline: article.title,
    description: articleExcerpt(article, 'ja'),
    url,
    image: `${BASE_URL}${article.photos[0]}`,
    datePublished: article.published,
    locale: 'ja',
  });
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'ホーム', url: `${BASE_URL}/` },
    { name: 'ニュース', url: `${BASE_URL}/news` },
    { name: article.title, url },
  ]);

  return (
    <div className="bg-[#F4EFE4] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-[#F4EFE4] border-b border-[#DDD5C5] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/news" className="text-[#2C2416] hover:text-[#8C7B6B] text-sm font-light">
            ← ニュース一覧
          </Link>
          <h1 className="text-[#2C2416] font-light">ニュース</h1>
          <div className="w-16" />
        </div>
      </div>

      <main className="py-16 px-4">
        <article className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <BulletinBoard photos={article.photos} alts={article.alts} />
            <div>
              <p className="text-[11px] text-[#8C7B6B] mb-3 uppercase tracking-widest font-mono">
                {article.date}
              </p>
              <h2 className="text-[28px] font-light text-[#2C2416] mb-6 leading-snug">
                {article.title}
              </h2>
              <div className="text-[15px] text-[#5C5451] leading-relaxed space-y-4">
                {article.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer locale="ja" />
    </div>
  );
}
