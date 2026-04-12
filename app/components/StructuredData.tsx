"use client";

export const StructuredData = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "CoffeeRoastery"],
    name: "FELICITY COFFEE ROASTERS",
    description: "神奈川県葉山町の自家焙煎スペシャルティコーヒー専門店",
    url: "https://felicity.cafe",
    telephone: "+81-90-XXXX-XXXX",
    address: {
      "@type": "PostalAddress",
      streetAddress: "2432-3 Kamiyamaguchi",
      addressLocality: "Hayama-cho",
      addressRegion: "Kanagawa",
      postalCode: "240-0112",
      addressCountry: "JP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 35.1571,
      longitude: 139.5721,
    },
    image: "https://felicity.cafe/og-image.jpg",
    priceRange: "¥¥",
    sameAs: ["https://www.instagram.com/felicity_hayama"],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Friday", "Saturday", "Sunday"],
      opens: "10:30",
      closes: "17:30",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
