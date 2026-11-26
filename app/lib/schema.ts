/**
 * JSON-LD Schema utilities for SEO
 * Supports bilingual schemas for EN/JP versions
 */

export interface SchemaParams {
  locale?: "en" | "ja";
  url?: string;
  productSlug?: string;
}

const BUSINESS_INFO = {
  name: "FELICITY COFFEE ROASTERS",
  nameJa: "FELICITY COFFEE ROASTERS",
  description: {
    en: "Specialty coffee roasters in Hayama, Kanagawa. Single origin beans, roasting workshops, café, and merchandise.",
    ja: "神奈川県葉山町のスペシャルティコーヒー専門店。シングルオリジン豆の販売・焙煎ワークショップ・カフェ。",
  },
  url: "https://felicity.cafe",
  image: "https://felicity.cafe/og-image.jpg",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2432-3 Kamiyamaguchi",
    addressLocality: "Hayama-cho",
    addressRegion: "Kanagawa",
    postalCode: "240-0115",
    addressCountry: "JP",
    name: "2432-3 Kamiyamaguchi, Hayama-cho, Miura-gun, Kanagawa, 240-0115 Japan",
  },
  phone: "+81-80-8758-4368",
  email: "info@felicity.cafe",
  priceRange: "¥¥",
  // 出典は Googleビジネスプロフィール（2026-10-14 時点）。
  // 金曜は定休のため、意図的に dayOfWeek から外してある。
  // ここを直すときは messages/{ja,en}.json と contact ページも必ず一緒に直すこと。
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "11:00",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/PublicHolidays",
      opens: "10:00",
      closes: "17:00",
    },
  ],
  closedDays: ["Friday"],
};

/**
 * Canonical "same business" links. AI search / local ranking leans on these to
 * confirm this is one real business. Keep in sync with
 * app/components/StructuredData.tsx (SAME_AS) and the Google Business Profile.
 */
export const SAME_AS = [
  "https://www.instagram.com/felicity_hayama",
  "https://line.me/R/ti/p/felicity_hayama",
  "https://maps.app.goo.gl/iSc827DwNWg5ASz68",
  "https://tabelog.com/kanagawa/A1406/A140602/14095646/",
];

/**
 * CafeOrCoffeeShop schema (main business)
 */
export function getCafeSchema(locale: "en" | "ja" = "ja") {
  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": "https://felicity.cafe#cafe",
    name: BUSINESS_INFO.name,
    alternateName: "Felicity",
    url: BUSINESS_INFO.url,
    description: BUSINESS_INFO.description[locale],
    image: BUSINESS_INFO.image,
    address: BUSINESS_INFO.address,
    ...(BUSINESS_INFO.phone ? { telephone: BUSINESS_INFO.phone } : {}),
    email: BUSINESS_INFO.email,
    priceRange: BUSINESS_INFO.priceRange,
    servesCuisine: "Specialty Coffee",
    openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
    areaServed: {
      "@type": "City",
      name: "Hayama",
      containedInPlace: {
        "@type": "State",
        name: "Kanagawa",
      },
    },
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: [
        {
          "@type": "MenuSection",
          name: locale === "en" ? "Coffee Beans" : "コーヒー豆",
          description: locale === "en" ? "Single origin coffee beans" : "シングルオリジン豆",
          hasMenuItem: [
            {
              "@type": "MenuItem",
              name: "Brazil Santa Alina",
              description: locale === "en" ? "Brazil, Washed" : "ブラジル、ウォッシュ",
              offers: {
                "@type": "Offer",
                price: "2800",
                priceCurrency: "JPY",
              },
            },
            {
              "@type": "MenuItem",
              name: "Ethiopia Yirgacheffe G1",
              description: locale === "en" ? "Ethiopia, Natural" : "エチオピア、ナチュラル",
              offers: {
                "@type": "Offer",
                price: "1800",
                priceCurrency: "JPY",
              },
            },
            {
              "@type": "MenuItem",
              name: "Papua New Guinea Sucafina",
              description: locale === "en" ? "Papua New Guinea, Washed" : "パプアニューギニア、ウォッシュ",
              offers: {
                "@type": "Offer",
                price: "2200",
                priceCurrency: "JPY",
              },
            },
          ],
        },
      ],
    },
    sameAs: SAME_AS,
  };
}

/**
 * LocalBusiness schema (additional business info)
 */
export function getLocalBusinessSchema(locale: "en" | "ja" = "ja") {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://felicity.cafe#business",
    name: BUSINESS_INFO.name,
    url: BUSINESS_INFO.url,
    description: BUSINESS_INFO.description[locale],
    image: BUSINESS_INFO.image,
    address: BUSINESS_INFO.address,
    ...(BUSINESS_INFO.phone ? { telephone: BUSINESS_INFO.phone } : {}),
    email: BUSINESS_INFO.email,
    openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 35.26735426386272,
      longitude: 139.61026716170105,
    },
  };
}

/**
 * Product schema for coffee beans
 */
export function getProductSchema(
  productName: string,
  origin: string,
  process: string,
  price: string,
  weight: string,
  gtin: string,
  locale: "en" | "ja" = "ja"
) {
  const priceValue = price.replace(/[^\d]/g, "") || "0";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://felicity.cafe#product-${gtin}`,
    name: productName,
    description: `${origin} ${process} specialty coffee from Felicity`,
    brand: {
      "@type": "Brand",
      name: BUSINESS_INFO.name,
    },
    image: `https://felicity.cafe/images/${origin.toLowerCase().replace(/\s/g, "-")}.jpg`,
    sku: gtin,
    gtin: gtin,
    weight: {
      "@type": "QuantitativeValue",
      value: weight.replace(/[a-zA-Z]/g, "").trim(),
      unitCode: "GRM",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: priceValue,
      priceCurrency: "JPY",
    },
  };
}

/**
 * Event schema for workshops
 */
export function getEventSchema(locale: "en" | "ja" = "ja") {
  const eventName = locale === "en" ? "Roasting Workshop" : "焙煎ワークショップ";
  const eventDescription =
    locale === "en"
      ? "Hands-on coffee roasting workshop. Learn roasting techniques and take home your roasted beans."
      : "コーヒーの焙煎体験ワークショップ。焙煎の基礎から実践までを学べます。";

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": "https://felicity.cafe#workshop",
    name: eventName,
    description: eventDescription,
    image: "https://felicity.cafe/og-image.jpg",
    // TODO: drive these from real upcoming-workshop data. A past startDate is
    // treated as a stale/expired event by Google and should never ship.
    startDate: "2026-04-11T10:00:00+09:00",
    endDate: "2026-04-11T12:30:00+09:00",
    organizer: {
      "@type": "Organization",
      name: BUSINESS_INFO.name,
      url: BUSINESS_INFO.url,
    },
    location: {
      "@type": "Place",
      name: BUSINESS_INFO.name,
      address: BUSINESS_INFO.address,
    },
    offers: {
      "@type": "Offer",
      price: "6500",
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
    },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };
}

/**
 * Organization schema (corporate info)
 */
export function getOrganizationSchema(locale: "en" | "ja" = "ja") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://felicity.cafe#org",
    name: BUSINESS_INFO.name,
    url: BUSINESS_INFO.url,
    logo: "https://felicity.cafe/og-image.jpg",
    description: BUSINESS_INFO.description[locale],
    sameAs: SAME_AS,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      ...(BUSINESS_INFO.phone ? { telephone: BUSINESS_INFO.phone } : {}),
      email: BUSINESS_INFO.email,
      areaServed: "JP",
      availableLanguage: ["en", "ja"],
    },
    address: BUSINESS_INFO.address,
    foundingDate: "2024",
  };
}

/**
 * Article / BlogPosting schema for individual news posts.
 */
export function getArticleSchema(params: {
  headline: string;
  description: string;
  url: string;
  image: string;
  datePublished: string; // ISO (YYYY-MM-DD)
  locale?: "en" | "ja";
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${params.url}#article`,
    headline: params.headline,
    description: params.description,
    image: params.image,
    datePublished: params.datePublished,
    dateModified: params.datePublished,
    inLanguage: params.locale === "en" ? "en" : "ja",
    mainEntityOfPage: { "@type": "WebPage", "@id": params.url },
    author: { "@type": "Organization", name: BUSINESS_INFO.name, url: BUSINESS_INFO.url },
    publisher: {
      "@type": "Organization",
      name: BUSINESS_INFO.name,
      url: BUSINESS_INFO.url,
      logo: { "@type": "ImageObject", url: "https://felicity.cafe/favicon.png" },
    },
  };
}

/**
 * BreadcrumbList schema
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQ content — single source of truth for both the visible FAQ on the contact
 * page and the FAQPage JSON-LD. Google requires the structured data to match
 * the on-page text, so always render these items visibly wherever this schema
 * is emitted. AI search engines (AI Overviews / AI Mode) lean heavily on Q&A.
 *
 * Every answer here is a confirmed fact (owner, 2026-11). Do NOT add a question
 * whose answer isn't visibly shown on the page.
 */
export const FAQ_ITEMS_JA: Array<{ q: string; a: string }> = [
  {
    q: "場所はどこですか？アクセス方法は？",
    a: "神奈川県三浦郡葉山町上山口2432-3 です。「新沢」バス停の目の前で、JR逗子駅からバスで約20分。無料駐車場が10台分あります（店裏2台＋徒歩200m先に8台）。",
  },
  {
    q: "営業時間と定休日を教えてください。",
    a: "月〜木は11:00〜17:00、土・日・祝は10:00〜17:00です。金曜日が定休日です。",
  },
  {
    q: "店内で飲めますか？席はありますか？",
    a: "店内に約30席（禁煙）、喫煙できるテラス席が2席あります。コーヒーや焼き菓子を店内でお楽しみいただけます。",
  },
  {
    q: "予約は必要ですか？",
    a: "通常のご来店は予約不要です。席のご予約も承っていますので、お電話またはInstagramのDMからお気軽にどうぞ。",
  },
  {
    q: "支払い方法は何が使えますか？",
    a: "キャッシュレス専用店です（現金はお使いいただけません）。クレジットカード・交通系ICカード・各種QR決済（PayPayなど）に対応しています。",
  },
  {
    q: "どんなコーヒーが買えますか？",
    a: "シングルオリジンのスペシャルティコーヒー豆を自家焙煎で販売しています（ブラジル、エチオピア イルガチェフェ、パプアニューギニアなど）。店内でも一杯ずつご提供しています。",
  },
  {
    q: "テイクアウトやWi-Fi、ペットの同伴はできますか？",
    a: "テイクアウト可、フリーWi-Fiあり。ペットは1階席のみ同伴いただけます。",
  },
  {
    q: "ワークショップやイベントはありますか？",
    a: "焙煎を学べるワークショップを不定期で開催しています。また毎週火曜日の朝はピラティスも開催中です。最新の日程はInstagram（@felicity_hayama）でお知らせしています。",
  },
];

/**
 * FAQPage schema. Emit only on a page that visibly renders the same items
 * (currently /contact).
 */
export function getFaqSchema(
  items: Array<{ q: string; a: string }> = FAQ_ITEMS_JA,
  pageUrl = "https://felicity.cafe/contact"
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/**
 * Aggregate offers for all products
 */
export function getAggregateOfferSchema(locale: "en" | "ja" = "ja") {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    "@id": "https://felicity.cafe#offers",
    name: locale === "en" ? "Coffee Beans" : "コーヒー豆",
    priceCurrency: "JPY",
    lowPrice: "1800",
    highPrice: "2800",
    offerCount: "3",
    availability: "https://schema.org/InStock",
  };
}
