import { prisma } from "@/lib/prisma";
import { resolveCarrierTimeline } from "@/lib/shipping-adapters";
import { apiError, apiJson, getRequestContext } from "@/lib/api-observability";

export async function GET(
  request: Request,
  context: { params: Promise<{ trackingCode: string }> },
) {
  const requestContext = getRequestContext(request, "/api/tracking/[trackingCode]");
  const params = await context.params;
  const trackingCode = decodeURIComponent(params.trackingCode || "").trim();

  if (!trackingCode) {
    return apiError(requestContext, 400, "VALIDATION_ERROR", "Takip kodu gerekli.");
  }

  const order = await prisma.order.findFirst({
    where: { trackingCode },
    include: {
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });

  if (!order) {
    return apiError(requestContext, 404, "TRACKING_NOT_FOUND", "Takip kodu bulunamadi.");
  }

  const timeline = await resolveCarrierTimeline({
    carrier: order.cargoCompany,
    trackingCode: order.trackingCode || trackingCode,
    status: order.status,
    createdAt: order.createdAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
  });

  return apiJson(requestContext, {
    ok: true,
    order: {
      id: order.id,
      total: order.total,
      status: order.status,
      cargoCompany: timeline.carrier,
      trackingCode: order.trackingCode,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      items: order.items,
      events: timeline.events,
    },
  });
}
