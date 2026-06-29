export interface NewsArticle {
  id: string;
  /** ISO date (YYYY-MM-DD) used for sitemap lastmod and Article datePublished. */
  published: string;
  date: string;
  date_en: string;
  title: string;
  title_en: string;
  body: string[];
  body_en: string[];
  photos: string[]; // min 1, max 3
  alts: string[];
}

export const newsArticles: NewsArticle[] = [
  {
    id: 'glutenfree-bread-popup-2026-07',
    published: '2026-06-29',
    date: '2026年6月29日',
    date_en: 'June 29, 2026',
    title: 'Seri Gopan（せりごパン）ポップアップ開催決定！',
    title_en: 'Seri Gopan Pop-Up — It\'s Happening!',
    body: [
      'Felicityにて、葉山発のグルテンフリーベーカリー「Seri Gopan（せりごパン）」のポップアップ開催が決定しました！第一弾は7月8日（水）・7月22日（水）の2日間です。',
      '2023年、葉山の地で生まれたSeri Gopan。「BAKED BY SERI」の名のとおり、店主・せりさんが一つひとつ心を込めて焼き上げる、グルテンフリーのパンとお菓子です。小麦粉を使わず米粉などを生かすことで、からだにやさしく、毎日でも気持ちよく食べられる味わいを大切にしています。',
      '米粉ならではのもっちりとした食感と、素材本来のやさしい甘み。シンプルだからこそ、噛むほどにおいしさが広がります。グルテンフリーははじめてという方にも、ぜひ一度味わっていただきたいパンたちです。',
      '同じ葉山で「いっぱいのシアワセ」を届けてきたFelicityにとって、Seri Gopanのものづくりへの想いには、どこか通じ合うものを感じています。焼きたてのパンと一杯のコーヒーで、ゆっくりとした時間を過ごしていただけたら嬉しいです。',
      '両日とも10:00〜15:00頃まで、Felicity（葉山）店頭にて開催します。商品はなくなり次第終了となる場合があります。',
      'これからの暑い季節は焼き物にとって難しい時期ではありますが、告知を重ねながら少しずつ盛り上げていけたらと思っています。最新情報は出店者「せりごパン」（Instagram @seri_gopan）でもご案内します。',
    ],
    body_en: [
      'We are thrilled to announce a pop-up at Felicity by Seri Gopan, a gluten-free bakery born in Hayama! The first two dates are Wednesday, July 8 and Wednesday, July 22, 2026.',
      'Founded in Hayama in 2023 and true to its "Baked by Seri" name, Seri Gopan is a labor of love — every gluten-free bread and sweet is shaped and baked by hand, one at a time, by its baker, Seri. By working with rice flour rather than wheat, she creates bakes that are gentle on the body and easy to enjoy every day.',
      'Expect the wonderfully chewy texture only rice flour can give, alongside the mellow, natural sweetness of simple, honest ingredients — the kind of bread that tastes better with every bite. Even if it is your first time trying gluten-free, these are loaves worth seeking out.',
      'As a fellow Hayama maker devoted to a cup full of happiness, Felicity feels a real kinship with the heart Seri Gopan pours into its craft. We hope you will linger a while over fresh bread and a cup of our coffee.',
      'On both days we will be open from around 10:00 to 15:00 at Felicity (Hayama). Items may sell out before closing.',
      'Summer is a tough season for baked goods, but we hope to build this up little by little. Follow the baker, Seri Gopan, on Instagram (@seri_gopan) for the latest.',
    ],
    photos: [
      '/images/news/serigopan-beach.jpg',
      '/images/news/serigopan-bread.jpg',
      '/images/news/serigopan-logo.jpg',
    ],
    alts: [
      'せりごパンの店主と焼きたてのパン（葉山の海辺にて）',
      'グルテンフリーの丸パン',
      'Seri Gopan（せりごパン）ロゴ',
    ],
  },
  {
    id: 'fcr-launch-2026-03',
    published: '2026-03-30',
    date: '2026年3月30日',
    date_en: 'March 30, 2026',
    title: 'Felicity Coffee Roasters / キッチンカーがスタート',
    title_en: 'Felicity Coffee Roasters & Food Truck Launch',
    body: [
      'Felicityではこのたび、自家焙煎事業「Felicity Coffee Roasters（FCR）」とキッチンカーでのコーヒー提供をスタートしました。',
      '葉山の店舗で大切にしてきた「いっぱいのシアワセ」を、これからは焙煎した豆と移動するコーヒースタンドを通して、もっとさまざまな場所へ届けていきます。',
      '焙煎所では、産地ごとの個性を丁寧に引き出しながら、日常に寄り添うクリーンで心地よい味わいを追求しています。',
    ],
    body_en: [
      'We are excited to announce the launch of Felicity Coffee Roasters (FCR) and our new food truck, bringing our specialty coffee experience beyond the walls of our Hayama shop.',
      'The happiness we have cultivated in Hayama will now travel with us — through freshly roasted beans and a mobile coffee stand reaching new places and people.',
      'At our roastery, we carefully draw out the character of each origin, pursuing a clean and comforting cup that fits naturally into everyday life.',
    ],
    photos: [
      '/images/news/food-truck.jpg',
      '/images/news/roasting.jpg',
    ],
    alts: ['Felicity Food Truck', 'Felicity Coffee Roasting'],
  },
];

export const latestArticle = newsArticles[0];

/** Look up a single article by its slug (the `id` field doubles as the URL slug). */
export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return newsArticles.find((a) => a.id === slug);
}

/** Plain-text excerpt for meta descriptions / OG (trimmed to ~155 chars). */
export function articleExcerpt(
  article: NewsArticle,
  locale: 'ja' | 'en' = 'ja'
): string {
  const text = (locale === 'en' ? article.body_en : article.body).join(' ');
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text;
}
