import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";

const allowedStatuses = new Set<string>([
  "odeme_alindi",
  "hazirlaniyor",
  "kargoda",
  "teslim_edildi",
  "iptal",
]);

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/orders");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  let orders;
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        return apiJson(context, { ok: true, orders: [] });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }

  return apiJson(context, { ok: true, orders });
}

export async function PATCH(request: Request) {
  const context = getRequestContext(request, "/api/admin/orders");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const body = await request.json();
  const orderId = String(body.orderId || "").trim();
  const statusRaw = String(body.status || "").trim();
  const cargoCompany = String(body.cargoCompany || "").trim();
  const trackingCode = String(body.trackingCode || "").trim();

  if (!orderId || !allowedStatuses.has(statusRaw)) {
    return apiError(context, 400, "VALIDATION_ERROR", "Gecerli siparis ve durum gerekli.");
  }

  const status = statusRaw as OrderStatus;

  const updateData: {
    status: OrderStatus;
    cargoCompany?: string | null;
    trackingCode?: string | null;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
  } = {
    status,
  };

  if (cargoCompany) {
    updateData.cargoCompany = cargoCompany;
  }

  if (trackingCode) {
    updateData.trackingCode = trackingCode;
  }

  if (status === "kargoda" && !trackingCode) {
    return apiError(context, 400, "VALIDATION_ERROR", "Kargoda durumu icin takip kodu gerekli.");
  }

  if (status === "kargoda") {
    updateData.shippedAt = new Date();
  }

  if (status === "teslim_edildi") {
    updateData.deliveredAt = new Date();
  }

  if (status === "iptal") {
    updateData.shippedAt = null;
    updateData.deliveredAt = null;
  }

  let updated;
  try {
    updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        return apiJson(context, { ok: true, order: { id: orderId, status, cargoCompany: cargoCompany || null, trackingCode: trackingCode || null } });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }

  logApiEvent(context, "admin.order.status_updated", {
    orderId,
    status,
  });

  return apiJson(context, { ok: true, order: updated });
}
