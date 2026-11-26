"use client";

/**
 * Site-wide JSON-LD business schema — rendered globally from app/layout.tsx.
 * This is the single source of truth for NAP (Name / Address / Phone) data that
 * search engines see. Keep every field byte-for-byte consistent with the live
 * contact page AND the Google Business Profile, or local ranking suffers.
 *
 * NOTE: `telephone` is intentionally omitted until a real, GBP-matching number
 * exists. A placeholder phone is worse than none (it breaks NAP consistency).
 */

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "2432-3 Kamiyamaguchi",
  addressLocality: "Hayama-cho",
  addressRegion: "Kanagawa",
  postalCode: "240-0115",
  addressCountry: "JP",
} as const;

// 出典は Googleビジネスプロフィール（2026-10-14 時点）。
// 金曜は定休のため dayOfWeek から外してある。
// ここを直すときは app/lib/schema.ts・messages/{ja,en}.json・contact ページも
// 必ず一緒に直すこと（同じ時間が5か所に複製されている）。
const OPENING_HOURS = [
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
    // National / public holidays keep weekend hours
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "https://schema.org/PublicHolidays",
    opens: "10:00",
    closes: "17:00",
  },
] as const;

// AI検索・地図は「同じ店の情報が各所で一致」しているほど信用する(sameAs)。
// app/lib/schema.ts の SAME_AS と必ず同じ内容にそろえること。
const SAME_AS = [
  "https://www.instagram.com/felicity_hayama",
  "https://line.me/R/ti/p/felicity_hayama",
  "https://maps.app.goo.gl/iSc827DwNWg5ASz68",
  "https://tabelog.com/kanagawa/A1406/A140602/14095646/",
];

export const StructuredData = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["CafeOrCoffeeShop", "LocalBusiness", "Store"],
        "@id": "https://felicity.cafe/#business",
        name: "FELICITY COFFEE ROASTERS",
        alternateName: "フェリシティ コーヒー ロースターズ",
        description:
          "神奈川県三浦郡葉山町の自家焙煎スペシャルティコーヒー専門店。シングルオリジン豆の販売・焙煎ワークショップ・カフェ。",
        url: "https://felicity.cafe",
        image: "https://felicity.cafe/og-image.jpg",
        logo: "https://felicity.cafe/favicon.png",
        telephone: "+81-80-8758-4368",
        email: "info@felicity.cafe",
        priceRange: "¥¥",
        currenciesAccepted: "JPY",
        paymentAccepted: "Credit Card, Transit IC Card, QR Code Payment (PayPay, etc.)",
        servesCuisine: "Specialty Coffee",
        address: ADDRESS,
        geo: {
          "@type": "GeoCoordinates",
          latitude: 35.26735426386272,
          longitude: 139.61026716170105,
        },
        hasMap: "https://maps.app.goo.gl/iSc827DwNWg5ASz68",
        openingHoursSpecification: OPENING_HOURS,
        areaServed: [
          { "@type": "City", name: "葉山町" },
          { "@type": "City", name: "逗子市" },
          { "@type": "AdministrativeArea", name: "Kanagawa" },
        ],
        sameAs: SAME_AS,
      },
      {
        "@type": "Organization",
        "@id": "https://felicity.cafe/#org",
        name: "FELICITY COFFEE ROASTERS",
        url: "https://felicity.cafe",
        logo: "https://felicity.cafe/favicon.png",
        sameAs: SAME_AS,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
