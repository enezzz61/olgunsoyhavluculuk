import { prisma } from "@/lib/prisma";
import { apiJson, apiError, getRequestContext, logApiError } from "@/lib/api-observability";
import { canUseMockData, getMockProducts, isDbUnavailableError } from "@/lib/db-fallback";
import { getImageSource } from "@/lib/image-fallback";

export const revalidate = 60;

function mapProduct(product: { image: string; gallery: string } & Record<string, unknown>) {
  const normalizedImage = getImageSource(product.image);
  let gallery: string[] = [normalizedImage];
  try {
    const parsed = JSON.parse(product.gallery || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      gallery = parsed.map((item) => getImageSource(String(item)));
    }
  } catch {
    gallery = [normalizedImage];
  }

  return {
    ...product,
    image: normalizedImage,
    gallery,
  };
}

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/products");
  try {
    if (canUseMockData()) {
      return apiJson(context, getMockProducts().map((product) => mapProduct(product as never)), {
        headers: {
          "x-data-source": "mock",
        },
      });
    }

    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      include: {
        wholesaleTiers: {
          orderBy: { minQty: "asc" },
        },
      },
    });

    return apiJson(context, products.map((product) => mapProduct(product)));
  } catch (error) {
    if (isDbUnavailableError(error) && canUseMockData()) {
      return apiJson(context, getMockProducts().map((product) => mapProduct(product as never)), {
        headers: {
          "x-data-source": "mock",
        },
      });
    }

    logApiError(context, "products.fetch_failed", error);
    if (canUseMockData()) {
      return apiJson(context, getMockProducts().map((product) => mapProduct(product as never)), {
        headers: {
          "x-data-source": "mock-fallback",
        },
      });
    }
    return apiError(context, 500, "PRODUCTS_FETCH_ERROR", "Urunler yuklenemedi");
  }
}
