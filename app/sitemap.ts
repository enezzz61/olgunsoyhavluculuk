import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { canUseMockData, getMockProducts, isDbUnavailableError } from "@/lib/db-fallback";
import { legalDocuments } from "@/lib/legal-documents";
import { getSiteUrl } from "@/lib/seo";

const staticRoutes = [
  { route: "", changeFrequency: "daily" as const, priority: 1 },
  { route: "/urunler", changeFrequency: "daily" as const, priority: 0.9 },
  { route: "/kargo-takip", changeFrequency: "weekly" as const, priority: 0.6 },
  { route: "/yasal", changeFrequency: "monthly" as const, priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const basePages: MetadataRoute.Sitemap = staticRoutes.map(({ route, changeFrequency, priority }) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const legalPages: MetadataRoute.Sitemap = legalDocuments.map((document) => ({
    url: `${siteUrl}/yasal/${document.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  let productPages: MetadataRoute.Sitemap = [];

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    productPages = products.map((product) => ({
      url: `${siteUrl}/urunler/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    if (!isDbUnavailableError(error)) {
      throw error;
    }

    if (canUseMockData()) {
      productPages = getMockProducts().map((product) => ({
        url: `${siteUrl}/urunler/${product.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    } else {
      productPages = [];
    }
  }

  return [...basePages, ...legalPages, ...productPages];
}
