import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const disallowRules = [
    "/admin",
    "/admin/",
    "/hesap",
    "/hesap/",
    "/odeme",
    "/odeme/",
    "/sepet",
    "/sepet/",
    "/siparisler",
    "/siparisler/",
    "/api/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowRules,
      },
      {
        userAgent: ["Googlebot", "Bingbot"],
        allow: "/",
        disallow: disallowRules,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
