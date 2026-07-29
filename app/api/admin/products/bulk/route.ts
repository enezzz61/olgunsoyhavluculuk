import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, createMockProduct, isDbUnavailableError, updateMockProduct, updateMockProductBySku } from "@/lib/db-fallback";
import type { Product, WholesaleTier } from "@/lib/products";

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const text = String(value || "").trim().toLowerCase();
  if (!text) {
    return fallback;
  }

  return ["true", "1", "evet", "yes", "on", "aktif"].includes(text);
}

function parseGallery(value: unknown, fallbackImage: string) {
  if (Array.isArray(value)) {
    const urls = value.map((item) => String(item || "").trim()).filter(Boolean);
    return urls.length ? Array.from(new Set(urls)) : [fallbackImage];
  }

  const urls = String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  return urls.length ? Array.from(new Set(urls)) : [fallbackImage];
}

function parseTiers(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((tier: { minQty?: number; unitPrice?: number }) => ({
        minQty: Number(tier.minQty || 0),
        unitPrice: Number(tier.unitPrice || 0),
      }))
      .filter((tier) => tier.minQty > 0 && tier.unitPrice > 0);
  }

  const text = String(value || "").trim();
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text) as Array<{ minQty?: number; unitPrice?: number }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((tier) => ({
        minQty: Number(tier.minQty || 0),
        unitPrice: Number(tier.unitPrice || 0),
      }))
      .filter((tier) => tier.minQty > 0 && tier.unitPrice > 0);
  } catch {
    return [];
  }
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRow(row: Record<string, unknown>) {
  const sku = String(row.sku || row.SKU || "").trim();
  const name = String(row.name || row.Name || row["urunAdi"] || row["ürünAdi"] || "").trim();
  const category = String(row.category || row.Category || "Genel").trim();
  const image = String(row.image || row.Image || row.gorsel || row["görsel"] || "").trim();
  const gallery = parseGallery(row.gallery || row.Gallery || row.images, image || "https://via.placeholder.com/300x300");
  const wholesaleTiers = parseTiers(row.wholesaleTiers || row.WholesaleTiers || row.tiers);

  return {
    sku: sku || `SKU-${Date.now()}`,
    name: name || "Yeni Havlu",
    category: category || "Genel",
    image: gallery[0],
    gallery,
    retailPrice: toNumber(row.retailPrice || row["retail price"] || row.fiyat || row.price, 0),
    stockCount: toNumber(row.stockCount || row["stock count"] || row.stok || row.quantity, 0),
    stockStatus: ["stokta", "az_stokta", "tukendi"].includes(String(row.stockStatus || row["stock status"] || "stokta").trim())
      ? String(row.stockStatus || row["stock status"] || "stokta").trim()
      : "stokta",
    wholesaleEnabled: parseBoolean(row.wholesaleEnabled || row["wholesale enabled"] || row.toptan),
    description: String(row.description || row.Description || "").trim(),
    active: parseBoolean(row.active, true),
    wholesaleTiers,
  };
}

async function syncTiers(productId: string, tiers: Array<{ minQty: number; unitPrice: number }>) {
  await prisma.wholesaleTier.deleteMany({ where: { productId } });
  if (!tiers.length) {
    return;
  }

  await prisma.wholesaleTier.createMany({
    data: tiers.map((tier) => ({
      productId,
      minQty: tier.minQty,
      unitPrice: tier.unitPrice,
    })),
  });
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/admin/products/bulk");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError(context, 400, "VALIDATION_ERROR", "Excel dosyasi gerekli.");
    }

    const isCsv = /\.csv$/i.test(file.name) || file.type.includes("csv");
    if (!/\.(xlsx|xls|csv)$/i.test(file.name) && !file.type.includes("spreadsheet") && !isCsv) {
      return apiError(context, 400, "INVALID_FILE_TYPE", "Sadece Excel veya CSV dosyasi yukleyebilirsiniz.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = isCsv
      ? XLSX.read(buffer.toString("utf-8"), { type: "string" })
      : XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return apiError(context, 400, "VALIDATION_ERROR", "Excel dosyasi bos.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (!rows.length) {
      return apiError(context, 400, "VALIDATION_ERROR", "Excel icinde satir bulunamadi.");
    }

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; sku: string; reason: string }> = [];

    const uniqueRows = new Map<string, Record<string, unknown>>();
    let duplicateCount = 0;
    for (const row of rows) {
      const sku = String(row.sku || row.SKU || "").trim() || String(row.sku || row.SKU || "");
      const normalizedSku = sku.trim();
      if (!normalizedSku) {
        duplicateCount += 1;
        continue;
      }

      if (uniqueRows.has(normalizedSku)) {
        duplicateCount += 1;
        continue;
      }

      uniqueRows.set(normalizedSku, row);
    }

    let rowIndex = 0;
    for (const row of uniqueRows.values()) {
      rowIndex += 1;
      const data = normalizeRow(row);

      if (!data.sku || !data.name) {
        failedCount += 1;
        errors.push({ row: rowIndex, sku: String(data.sku || ""), reason: "SKU veya ürün adı eksik." });
        continue;
      }

      try {
        if (canUseMockData() && process.env.MOCK_DB === "true") {
          const updated = updateMockProductBySku(data.sku, {
            sku: data.sku,
            name: data.name,
            category: data.category,
            image: data.image,
            gallery: data.gallery,
            retailPrice: data.retailPrice,
            stockCount: data.stockCount,
            stockStatus: data.stockStatus,
            wholesaleEnabled: data.wholesaleEnabled,
            description: data.description,
            active: data.active,
          } as Partial<Product>);

          if (updated) {
            updatedCount += 1;
            continue;
          }

          createMockProduct({
            id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            sku: data.sku,
            name: data.name,
            category: data.category,
            image: data.image,
            gallery: data.gallery,
            retailPrice: data.retailPrice,
            stockCount: data.stockCount,
            stockStatus: data.stockStatus,
            wholesaleEnabled: data.wholesaleEnabled,
            description: data.description,
            wholesaleTiers: data.wholesaleTiers.map((tier: { minQty: number; unitPrice: number }, index: number) => ({
              id: `mock-tier-${index}-${Math.random().toString(36).slice(2, 6)}`,
              productId: `mock-${Date.now()}`,
              ...tier,
            })) as WholesaleTier[],
            active: data.active,
          } as Product);

          createdCount += 1;
          continue;
        }

        const existing = await prisma.product.findUnique({
          where: { sku: data.sku },
          select: { id: true },
        });

        if (existing) {
          const updated = await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: data.name,
              category: data.category,
              image: data.image,
              gallery: JSON.stringify(data.gallery),
              retailPrice: data.retailPrice,
              stockStatus: data.stockStatus,
              wholesaleEnabled: data.wholesaleEnabled,
              description: data.description,
              active: data.active,
            },
          });

          await syncTiers(updated.id, data.wholesaleEnabled ? data.wholesaleTiers : []);
          updatedCount += 1;
          logApiEvent(context, "admin.product.bulk-updated", { productId: updated.id, sku: updated.sku });
          continue;
        }

        const created = await prisma.product.create({
          data: {
            sku: data.sku,
            name: data.name,
            category: data.category,
            image: data.image,
            gallery: JSON.stringify(data.gallery),
            retailPrice: data.retailPrice,
            stockStatus: data.stockStatus,
            wholesaleEnabled: data.wholesaleEnabled,
            description: data.description,
            active: data.active,
            wholesaleTiers: {
              create: data.wholesaleEnabled ? data.wholesaleTiers : [],
            },
          },
          include: {
            wholesaleTiers: {
              orderBy: { minQty: "asc" },
            },
          },
        });

        logApiEvent(context, "admin.product.bulk-created", { productId: created.id, sku: created.sku });
        createdCount += 1;
      } catch (error) {
        if (isDbUnavailableError(error) && canUseMockData()) {
          const updated = updateMockProductBySku(data.sku, {
            sku: data.sku,
            name: data.name,
            category: data.category,
            image: data.image,
            gallery: data.gallery,
            retailPrice: data.retailPrice,
            stockCount: data.stockCount,
            stockStatus: data.stockStatus,
            wholesaleEnabled: data.wholesaleEnabled,
            description: data.description,
            active: data.active,
          } as Partial<Product>);

          if (updated) {
            updatedCount += 1;
            continue;
          }

          createMockProduct({
            id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            sku: data.sku,
            name: data.name,
            category: data.category,
            image: data.image,
            gallery: data.gallery,
            retailPrice: data.retailPrice,
            stockCount: data.stockCount,
            stockStatus: data.stockStatus,
            wholesaleEnabled: data.wholesaleEnabled,
            description: data.description,
            wholesaleTiers: data.wholesaleTiers.map((tier: { minQty: number; unitPrice: number }, index: number) => ({
              id: `mock-tier-${index}-${Math.random().toString(36).slice(2, 6)}`,
              productId: `mock-${Date.now()}`,
              ...tier,
            })) as WholesaleTier[],
            active: data.active,
          } as Product);

          createdCount += 1;
          continue;
        }

        failedCount += 1;
        errors.push({ row: rowIndex, sku: data.sku, reason: error instanceof Error ? error.message : "Bilinmeyen hata." });
      }
    }

    return apiJson(context, {
      ok: true,
      message: `${createdCount} urun eklendi, ${updatedCount} urun guncellendi, ${duplicateCount + failedCount} satir atlandi.`,
      createdCount,
      updatedCount,
      failedCount,
      duplicateCount,
      errors,
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    return apiError(context, 500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Excel yuklenemedi.");
  }
}
