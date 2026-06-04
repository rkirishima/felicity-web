import type { MetadataRoute } from "next";
import { products } from "./lib/products";
import { newsArticles } from "./lib/news";

export const dynamic = "force-static";

const BASE_URL = "https://felicity.cafe";

export default function sitemap(): MetadataRoute.Sitemap {
  const newsEntries: MetadataRoute.Sitemap = newsArticles.flatMap((article) => {
    const lastModified = new Date(article.published);
    const ja = `${BASE_URL}/news/${article.id}`;
    const en = `${BASE_URL}/en/news/${article.id}`;
    const languages = { ja, en };
    return [
      { url: ja, lastModified, changeFrequency: "monthly" as const, priority: 0.6, alternates: { languages } },
      { url: en, lastModified, changeFrequency: "monthly" as const, priority: 0.6, alternates: { languages } },
    ];
  });

  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) => [
    // Japanese version (root)
    {
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          ja: `${BASE_URL}/products/${product.slug}`,
          en: `${BASE_URL}/en/products/${product.slug}`,
        },
      },
    },
    // English version
    {
      url: `${BASE_URL}/en/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          ja: `${BASE_URL}/products/${product.slug}`,
          en: `${BASE_URL}/en/products/${product.slug}`,
        },
      },
    },
  ]);

  return [
    // Primary home page
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
      alternates: {
        languages: {
          ja: BASE_URL,
          en: `${BASE_URL}/en`,
        },
      },
    },
    // English home page
    {
      url: `${BASE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: {
        languages: {
          ja: BASE_URL,
          en: `${BASE_URL}/en`,
        },
      },
    },
    // About pages
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          ja: `${BASE_URL}/about`,
          en: `${BASE_URL}/en/about`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          ja: `${BASE_URL}/about`,
          en: `${BASE_URL}/en/about`,
        },
      },
    },
    // Subscribe page
    {
      url: `${BASE_URL}/subscribe`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    // News pages
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          ja: `${BASE_URL}/news`,
          en: `${BASE_URL}/en/news`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/news`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          ja: `${BASE_URL}/news`,
          en: `${BASE_URL}/en/news`,
        },
      },
    },
    // Contact pages
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          ja: `${BASE_URL}/contact`,
          en: `${BASE_URL}/en/contact`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          ja: `${BASE_URL}/contact`,
          en: `${BASE_URL}/en/contact`,
        },
      },
    },
    // Disclosure
    {
      url: `${BASE_URL}/ja/disclosure`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    // News articles (individual)
    ...newsEntries,
    // Product listings
    ...productEntries,
  ];
}
