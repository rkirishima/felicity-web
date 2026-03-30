import type { MetadataRoute } from "next";
import { products } from "./lib/products";

export const dynamic = "force-static";

const BASE_URL = "https://felicity.cafe";

export default function sitemap(): MetadataRoute.Sitemap {
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
    // Japanese version explicit
    {
      url: `${BASE_URL}/ja/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          ja: `${BASE_URL}/ja/products/${product.slug}`,
          en: `${BASE_URL}/en/products/${product.slug}`,
        },
      },
    },
  ]);

  return [
    // Home pages
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
    {
      url: `${BASE_URL}/en`,
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
    {
      url: `${BASE_URL}/ja`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: {
        languages: {
          ja: `${BASE_URL}/ja`,
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
    {
      url: `${BASE_URL}/ja/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          ja: `${BASE_URL}/ja/about`,
          en: `${BASE_URL}/en/about`,
        },
      },
    },
    // Product listings
    {
      url: `${BASE_URL}/#coffee`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/#coffee`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ja/#coffee`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    // Workshop pages
    {
      url: `${BASE_URL}/#workshop`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/en/#workshop`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ja/#workshop`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...productEntries,
  ];
}
