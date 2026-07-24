import { prisma } from "@/lib/prisma";
import { createOrderFromPaymentSession } from "@/lib/payment-order";
import { getSessionUser } from "@/lib/session";
import { isIyzicoConfigured, retrieveIyzicoCheckoutForm } from "@/lib/iyzico";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";
import { canUseMockData } from "@/lib/db-fallback";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/payments/confirm");
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiError(context, 401, "UNAUTHORIZED", "Yetkisiz.");
    }

    const body = await request.json();
    const sessionId = String(body.sessionId || "");

    if (!sessionId) {
      return apiError(context, 400, "VALIDATION_ERROR", "sessionId gerekli.");
    }

    const isMockSession = sessionId.startsWith("mock_");

    if (isMockSession) {
      return apiError(context, 400, "MOCK_PAYMENT_DISABLED", "Mock ödeme modu devre dışı. Gerçek ödeme sağlayıcısı kullanılmalıdır.");
    }

    const payment = await prisma.payment.findUnique({ where: { stripeSessionId: sessionId } });
    if (!payment || payment.userId !== user.id) {
      return apiError(context, 404, "PAYMENT_NOT_FOUND", "Odeme kaydi bulunamadi.");
    }

    if (payment.orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true },
      });
      return apiJson(context, { ok: true, message: "Siparis zaten olusturulmus.", order: existingOrder });
    }

    if (!isIyzicoConfigured()) {
      return apiError(context, 500, "IYZICO_CONFIG_MISSING", "Canli odeme dogrulamasi icin Iyzico ayarlari gerekli.");
    }

    const checkoutResult = await retrieveIyzicoCheckoutForm({
      token: sessionId,
      conversationId: payment.id,
    });

    if (checkoutResult.status !== "success" || checkoutResult.paymentStatus !== "SUCCESS") {
      return apiError(context, 400, "PAYMENT_NOT_COMPLETED", checkoutResult.errorMessage || "Odeme henuz tamamlanmadi.");
    }

    const metadata = payment.metadata ? JSON.parse(payment.metadata) as { cart?: unknown; shippingAddressId?: string } : {};
    const cartJson = JSON.stringify(Array.isArray(metadata.cart) ? metadata.cart : []);
    const shippingAddressId = metadata.shippingAddressId;
    const result = await createOrderFromPaymentSession({
      paymentReference: sessionId,
      cartJson,
      shippingAddressId,
    });

    if (result.ok) {
      logApiEvent(context, "payment.confirm.succeeded", {
        userId: user.id,
        sessionId,
      });
      return apiJson(context, result, { status: 200 });
    }

    logApiEvent(context, "payment.confirm.order_creation_failed", {
      userId: user.id,
      sessionId,
    });
    return apiError(context, 400, "ORDER_CREATION_FAILED", result.message || "Siparis olusturulamadi.");
  } catch (error) {
    logApiError(context, "payment.confirm.failed", error);
    return apiError(context, 500, "PAYMENT_CONFIRM_FAILED", "Odeme dogrulanamadi.");
  }
}
