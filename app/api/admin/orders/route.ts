import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";
import { sendOrderStatusNotification } from "@/lib/order-notifications";

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
    const rawOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    const userIds = Array.from(new Set(rawOrders.map((order) => order.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    orders = rawOrders.map((order) => ({
      ...order,
      user: userMap.get(order.userId) || {
        id: order.userId,
        name: "Silinmis Kullanici",
        email: "-",
      },
    }));
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
  const reason = String(body.reason || "").trim();

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
  let userData: { id: string; name: string; email: string } | null = null;
  try {
    updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    userData = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { id: true, name: true, email: true },
    });

    updated = {
      ...updated,
      user: userData || {
        id: updated.userId,
        name: "Silinmis Kullanici",
        email: "-",
      },
    };
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
    reason: reason || undefined,
  });

  try {
    await sendOrderStatusNotification({
      orderId,
      status,
      userEmail: userData?.email,
      reason,
    });
  } catch (notificationError) {
    logApiEvent(context, "admin.order.notification_failed", {
      orderId,
      status,
      error: notificationError instanceof Error ? notificationError.message : String(notificationError),
    });
  }

  return apiJson(context, { ok: true, order: updated });
}
