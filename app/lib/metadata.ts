import type { Metadata } from "next";

const BASE_URL = "https://felicity.cafe";

const META_CONTENT = {
  en: {
    title: "FELICITY COFFEE ROASTERS | Specialty Coffee in Hayama",
    description:
      "Specialty coffee roasters in Hayama, Kanagawa. Single origin beans, roasting workshops, café, and merchandise.",
    keywords: [
      "specialty coffee",
      "coffee roasters",
      "Hayama",
      "single origin",
      "coffee beans",
      "roasting workshop",
      "café",
      "Kanagawa",
      "Japan",
    ],
  },
  ja: {
    title: "FELICITY COFFEE ROASTERS | 葉山のスペシャルティコーヒー",
    description:
      "神奈川県葉山町のスペシャルティコーヒー専門店。シングルオリジン豆の販売・焙煎ワークショップ・カフェ。",
    keywords: [
      "葉山",
      "コーヒー",
      "スペシャルティコーヒー",
      "シングルオリジン",
      "焙煎",
      "カフェ",
      "ワークショップ",
      "神奈川県",
      "珈琲豆",
    ],
  },
};

const PAGE_CONTENT = {
  home: {
    en: {
      title: "FELICITY COFFEE ROASTERS | Specialty Coffee in Hayama",
      description:
        "Specialty coffee roasters in Hayama, Kanagawa. Single origin beans, roasting workshops, café, and merchandise.",
    },
    ja: {
      title: "FELICITY COFFEE ROASTERS | 葉山のスペシャルティコーヒー",
      description:
        "神奈川県葉山町のスペシャルティコーヒー専門店。シングルオリジン豆の販売・焙煎ワークショップ・カフェ。",
    },
  },
  about: {
    en: {
      title: "About Felicity | FELICITY COFFEE ROASTERS",
      description:
        "The story behind Felicity. A specialty coffee destination in Hayama dedicated to sourcing exceptional beans and sharing the art of roasting.",
    },
    ja: {
      title: "フェリシティについて | FELICITY COFFEE ROASTERS",
      description:
        "葉山のスペシャルティコーヒー専門店。創業の想い、こだわり、ワークショップについてご紹介します。",
    },
  },
};

export function getBaseMetadata(locale: "en" | "ja" = "ja"): Metadata {
  const content = META_CONTENT[locale];

  return {
    metadataBase: new URL(BASE_URL),
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    viewport: "width=device-width, initial-scale=1",
    robots: "index, follow",
    alternates: {
      canonical: BASE_URL,
      languages: {
        en: `${BASE_URL}/en`,
        ja: `${BASE_URL}`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: BASE_URL,
      siteName: "FELICITY COFFEE ROASTERS",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${content.title}`,
          type: "image/jpeg",
        },
      ],
      locale: locale === "en" ? "en_US" : "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
      images: ["/og-image.jpg"],
      creator: "@felicity_hayama",
    },
  };
}

export function getPageMetadata(
  page: "home" | "about" | "products",
  locale: "en" | "ja" = "ja",
  overrides?: Partial<Metadata>
): Metadata {
  const baseMetadata = getBaseMetadata(locale);
  const pageContent = PAGE_CONTENT[page as keyof typeof PAGE_CONTENT];

  if (!pageContent) {
    return baseMetadata;
  }

  const content = pageContent[locale];

  return {
    ...baseMetadata,
    title: content.title,
    description: content.description,
    ...overrides,
  };
}

export function getProductMetadata(
  productName: string,
  productSlug: string,
  country: string,
  process: string,
  price: string,
  weight: string,
  locale: "en" | "ja" = "ja"
): Metadata {
  const baseMetadata = getBaseMetadata(locale);
  const title =
    locale === "en"
      ? `${productName} | FELICITY COFFEE ROASTERS`
      : `${productName} | FELICITY COFFEE ROASTERS`;
  const description =
    locale === "en"
      ? `${country} ${process} specialty coffee. ${weight} — ${price}`
      : `${country}産 ${process}精製 ${weight} ${price}`;

  return {
    ...baseMetadata,
    title,
    description,
    alternates: {
      ...baseMetadata.alternates,
      canonical: `${BASE_URL}/products/${productSlug}`,
      languages: {
        en: `${BASE_URL}/en/products/${productSlug}`,
        ja: `${BASE_URL}/products/${productSlug}`,
      },
    },
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description,
      url: `${BASE_URL}/products/${productSlug}`,
      type: "website",
      images: [
        {
          url: `/images/${country.toLowerCase().replace(/\s/g, "-")}.jpg`,
          width: 1200,
          height: 630,
          alt: productName,
        },
      ],
    },
  };
}
