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

const OPENING_HOURS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "11:00",
    closes: "17:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Saturday", "Sunday"],
    opens: "09:00",
    closes: "17:00",
  },
  {
    // National / public holidays keep weekend hours
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "https://schema.org/PublicHolidays",
    opens: "09:00",
    closes: "17:00",
  },
] as const;

const SAME_AS = ["https://www.instagram.com/felicity_hayama"];

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
        paymentAccepted: "Credit Card, IC Card, PayPay",
        servesCuisine: "Specialty Coffee",
        address: ADDRESS,
        geo: {
          "@type": "GeoCoordinates",
          latitude: 35.26735426386272,
          longitude: 139.61026716170105,
        },
        hasMap:
          "https://www.google.com/maps/search/?api=1&query=35.26735426386272,139.61026716170105",
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
