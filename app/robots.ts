import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/checkout/success/", "/subscribe/success/"],
      },
      {
        userAgent: "AdsBot-Google",
        allow: "/",
      },
    ],
    sitemap: "https://felicity.cafe/sitemap.xml",
  };
}
