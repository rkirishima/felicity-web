"use client";

export const StructuredData = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "CoffeeRoastery"],
    name: "FELICITY COFFEE ROASTERS",
    description: "神奈川県葉山町の自家焙煎スペシャルティコーヒー専門店",
    url: "https://felicity.cafe",
    telephone: "+81-90-0000-0000",
    address: {
      "@type": "PostalAddress",
      streetAddress: "神奈川県三浦郡葉山町上山口2432-3",
      addressLocality: "葉山町",
      addressRegion: "神奈川県",
      postalCode: "240-0113",
      addressCountry: "JP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 35.2757,
      longitude: 139.6062,
    },
    image: "/og-image.jpg",
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
