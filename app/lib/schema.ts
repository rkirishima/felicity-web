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
    postalCode: "240-0112",
    addressCountry: "JP",
    name: "2432-3 Kamiyamaguchi, Hayama-cho, Miura-gun, Kanagawa, 240-0112 Japan",
  },
  phone: "+81-90-XXXX-XXXX",
  email: "hello@felicity.cafe",
  priceRange: "¥¥",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Friday"],
      opens: "11:00",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "09:00",
      closes: "17:00",
    },
  ],
  closedDays: ["Wednesday", "Thursday"],
};

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
    telephone: BUSINESS_INFO.phone,
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
    sameAs: [
      "https://www.instagram.com/felicity_hayama",
      "https://line.me/R/ti/p/felicity_hayama",
    ],
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
    telephone: BUSINESS_INFO.phone,
    email: BUSINESS_INFO.email,
    openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 35.1571,
      longitude: 139.5721,
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
  const priceMatch = price.match(/(\d+)/);
  const priceValue = priceMatch ? priceMatch[1] : "0";

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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "24",
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
    sameAs: [
      "https://www.instagram.com/felicity_hayama",
      "https://line.me/R/ti/p/felicity_hayama",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      telephone: BUSINESS_INFO.phone,
      email: BUSINESS_INFO.email,
      areaServed: "JP",
      availableLanguage: ["en", "ja"],
    },
    address: BUSINESS_INFO.address,
    foundingDate: "2024",
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
