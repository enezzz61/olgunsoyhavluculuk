import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, createMockProduct, deleteMockProduct, getMockProducts, isDbUnavailableError, updateMockProduct } from "@/lib/db-fallback";
import type { Product } from "@/lib/products";

function parseGallery(value: unknown, fallbackImage: string) {
  const urls = Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : String(value || "")
        .split(/\r?\n|,/) 
        .map((item) => item.trim())
        .filter(Boolean);

  const unique = Array.from(new Set(urls));
  return unique.length ? unique : [fallbackImage];
}

function mapProduct(product: { image: string; gallery: string } & Record<string, unknown>) {
  let gallery: string[] = [product.image];
  try {
    const parsed = JSON.parse(product.gallery || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      gallery = parsed.map((item) => String(item));
    }
  } catch {
    gallery = [product.image];
  }

  return {
    ...product,
    gallery,
  };
}

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/products");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  let products;
  try {
    products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        wholesaleTiers: {
          orderBy: { minQty: "asc" },
        },
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        return apiJson(context, { ok: true, products: getMockProducts().map((product) => mapProduct(product as never)) });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }
  return apiJson(context, { ok: true, products: products.map((product) => mapProduct(product)) });
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/admin/products");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const body = await request.json();
  const wholesaleEnabled = Boolean(body.wholesaleEnabled);
  const stockStatus = String(body.stockStatus || "stokta").trim();
  const image = String(body.image || "https://via.placeholder.com/300x300").trim();
  const gallery = parseGallery(body.gallery, image);
  const tiers = Array.isArray(body.wholesaleTiers)
    ? body.wholesaleTiers
        .map((tier: { minQty?: number; unitPrice?: number }) => ({
          minQty: Number(tier.minQty || 0),
          unitPrice: Number(tier.unitPrice || 0),
        }))
        .filter((tier: { minQty: number; unitPrice: number }) => tier.minQty > 0 && tier.unitPrice > 0)
    : [];

  let created;
  try {
    created = await prisma.product.create({
      data: {
        sku: String(body.sku || `SKU-${Date.now()}`),
        name: String(body.name || "Yeni Havlu"),
        category: String(body.category || "Genel"),
        image: gallery[0],
        gallery: JSON.stringify(gallery),
        retailPrice: Number(body.retailPrice || 0),
        stockStatus: ["stokta", "az_stokta", "tukendi"].includes(stockStatus) ? stockStatus : "stokta",
        wholesaleEnabled,
        description: String(body.description || ""),
        active: body.active !== false,
        wholesaleTiers: {
          create: wholesaleEnabled ? tiers : [],
        },
      },
      include: {
        wholesaleTiers: {
          orderBy: { minQty: "asc" },
        },
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        const created = createMockProduct({
          id: `mock-${Date.now()}`,
          sku: String(body.sku || `SKU-${Date.now()}`),
          name: String(body.name || "Yeni Havlu"),
          category: String(body.category || "Genel"),
          image: gallery[0],
          gallery,
          retailPrice: Number(body.retailPrice || 0),
          stockCount: Number(body.stockCount || 0),
          stockStatus: ["stokta", "az_stokta", "tukendi"].includes(stockStatus) ? stockStatus : "stokta",
          wholesaleEnabled,
          description: String(body.description || ""),
          active: body.active !== false,
          wholesaleTiers: wholesaleEnabled
            ? tiers.map((tier: { minQty: number; unitPrice: number }, index: number) => ({
                id: `mock-tier-${index}`,
                productId: `mock-${Date.now()}`,
                ...tier,
              }))
            : [],
        } as never);

        return apiJson(context, { ok: true, product: mapProduct(created as never) });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }

  logApiEvent(context, "admin.product.created", { productId: created.id, sku: created.sku });

  return apiJson(context, { ok: true, product: mapProduct(created) });
}

export async function PATCH(request: Request) {
  const context = getRequestContext(request, "/api/admin/products");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const body = await request.json();
  const id = String(body.id || "");
  const wholesaleEnabled = Boolean(body.wholesaleEnabled);
  const stockStatus = String(body.stockStatus || "stokta").trim();
  const image = String(body.image || "https://via.placeholder.com/300x300").trim();
  const gallery = parseGallery(body.gallery, image);
  const tiers = Array.isArray(body.wholesaleTiers)
    ? body.wholesaleTiers
        .map((tier: { minQty?: number; unitPrice?: number }) => ({
          minQty: Number(tier.minQty || 0),
          unitPrice: Number(tier.unitPrice || 0),
        }))
        .filter((tier: { minQty: number; unitPrice: number }) => tier.minQty > 0 && tier.unitPrice > 0)
    : [];

  if (!id) {
    return apiError(context, 400, "VALIDATION_ERROR", "Urun id gerekli.");
  }

  let updated;
  try {
    await prisma.wholesaleTier.deleteMany({ where: { productId: id } });

    updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        image: gallery[0],
        gallery: JSON.stringify(gallery),
        retailPrice: body.retailPrice,
        stockStatus: ["stokta", "az_stokta", "tukendi"].includes(stockStatus) ? stockStatus : "stokta",
        wholesaleEnabled,
        description: body.description,
        active: body.active,
        wholesaleTiers: {
          create: wholesaleEnabled ? tiers : [],
        },
      },
      include: {
        wholesaleTiers: {
          orderBy: { minQty: "asc" },
        },
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        const updated = updateMockProduct(id, {
          sku: body.sku,
          name: body.name,
          category: body.category,
          image: gallery[0],
          gallery,
          retailPrice: Number(body.retailPrice || 0),
          stockCount: Number(body.stockCount || 0),
          stockStatus: ["stokta", "az_stokta", "tukendi"].includes(stockStatus) ? stockStatus : "stokta",
          wholesaleEnabled,
          description: body.description,
          active: body.active,
        } as Partial<Product>);

        if (!updated) {
          return apiError(context, 404, "NOT_FOUND", "Urun bulunamadi.");
        }

        return apiJson(context, { ok: true, product: mapProduct(updated as never) });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }

  logApiEvent(context, "admin.product.updated", { productId: updated.id, sku: updated.sku });

  return apiJson(context, { ok: true, product: mapProduct(updated) });
}

export async function DELETE(request: Request) {
  const context = getRequestContext(request, "/api/admin/products");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const body = await request.json();
  const id = String(body.id || "");

  if (!id) {
    return apiError(context, 400, "VALIDATION_ERROR", "Urun id gerekli.");
  }

  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        const deleted = deleteMockProduct(id);
        if (!deleted) {
          return apiError(context, 404, "NOT_FOUND", "Urun bulunamadi.");
        }

        return apiJson(context, { ok: true });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }

  logApiEvent(context, "admin.product.deleted", { productId: id });
  return apiJson(context, { ok: true });
}
