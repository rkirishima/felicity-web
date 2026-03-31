export interface NewsArticle {
  id: string;
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
    id: 'fcr-launch-2026-03',
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
