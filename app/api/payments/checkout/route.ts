import { prisma } from "@/lib/prisma";
import { createOrderFromPaymentSession } from "@/lib/payment-order";
import { resolveUnitPrice } from "@/lib/pricing";
import type { Product } from "@/lib/products";
import { getSessionUser } from "@/lib/session";
import { createIyzicoCheckoutForm, getBaseUrl, isIyzicoConfigured } from "@/lib/iyzico";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError, getMockProducts } from "@/lib/db-fallback";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/payments/checkout");
  let user = null as Awaited<ReturnType<typeof getSessionUser>>;
  try {
    user = await getSessionUser();
    if (!user) {
      return apiError(context, 401, "UNAUTHORIZED", "Bu işlem için önce giriş yapmalısınız.");
    }

    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? (body.items as CheckoutItem[]) : [];
    const shippingAddressId = body?.shippingAddressId as string | undefined;
    const paymentMethod = String(body?.paymentMethod || "credit-card");

    if (!items.length) {
      return apiError(context, 400, "EMPTY_CART", "Sepet bos.");
    }

    if (!user?.id) {
      return apiError(context, 401, "UNAUTHORIZED", "Bu işlem için giriş yapmanız gerekiyor.");
    }

    // Separate mock and real product IDs
    const mockProductIds = items.filter(item => item.productId.startsWith("mock-")).map(item => item.productId);
    const realProductIds = items.filter(item => !item.productId.startsWith("mock-")).map(item => item.productId);

    let products: Product[] = [];
    
    // Fetch real products from DB only if there are any
    if (realProductIds.length > 0) {
      try {
        products = await prisma.product.findMany({
          where: { id: { in: realProductIds } },
          include: { wholesaleTiers: true },
        });
      } catch (error) {
        if (!isDbUnavailableError(error)) throw error;
      }
    }

    // Add mock products
    if (mockProductIds.length > 0 && canUseMockData()) {
      const mockProducts = getMockProducts();
      const mockProductsInCart = mockProducts.filter(p => mockProductIds.includes(p.id));
      products = [...products, ...mockProductsInCart];
    }

    const basketItems: Array<{
      id: string;
      name: string;
      category1: string;
      itemType: "PHYSICAL";
      price: string;
    }> = [];

    let total = 0;

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        continue;
      }

      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitPrice = resolveUnitPrice({ product, role: user.role, qty: quantity }).unitPrice;
      total += unitPrice * quantity;

      basketItems.push({
        id: product.id,
        name: product.name,
        category1: product.category || "Genel",
        itemType: "PHYSICAL",
        price: (unitPrice * quantity).toFixed(2),
      });
    }

    if (!basketItems.length) {
      return apiError(context, 400, "NO_VALID_ITEMS", "Gecerli urun bulunamadi.");
    }

    const shippingAddress = shippingAddressId
      ? await prisma.address.findFirst({
          where: {
            id: shippingAddressId,
            userId: user.id,
          },
        })
      : null;

    if (!shippingAddress) {
      return apiError(context, 400, "VALIDATION_ERROR", "Odeme icin gecerli teslimat adresi seciniz.");
    }

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        stripeSessionId: `pending-${Date.now()}`,
        amount: total,
        status: "pending",
        metadata: JSON.stringify({ shippingAddressId, cart: items }),
      },
    });

    const baseUrl = getBaseUrl();
    const useMockPayment = process.env.MOCK_PAYMENTS === "true";

    if (!isIyzicoConfigured() && !useMockPayment) {
      return apiError(
        context,
        503,
        "PAYMENT_PROVIDER_UNAVAILABLE",
        "Canlı ödeme sağlayıcısı ayarlanmamış. Lütfen daha sonra tekrar deneyin.",
      );
    }

    if (paymentMethod === "bank-transfer") {
      return apiError(
        context,
        400,
        "BANK_TRANSFER_DISABLED",
        "Banka havalesi / EFT yöntemi şu anda aktif değildir. Lütfen kredi kartı ile devam edin.",
      );
    }

    if (useMockPayment) {
      return apiError(
        context,
        503,
        "PAYMENT_PROVIDER_UNAVAILABLE",
        "Canlı ödeme sağlayıcısı ayarlanmamış. Lütfen daha sonra tekrar deneyin.",
      );
    }

    const addressText = `${shippingAddress.address}, ${shippingAddress.district}/${shippingAddress.city}`;
    const contactName = shippingAddress.fullName || user.name;
    const callbackUrl = `${baseUrl}/odeme/basarili`;

    try {
      const session = await createIyzicoCheckoutForm({
        conversationId: payment.id,
        basketId: payment.id,
        email: user.email,
        fullName: contactName,
        userId: user.id,
        totalTry: total,
        callbackUrl,
        shippingAddress: {
          contactName,
          city: shippingAddress.city,
          country: "Turkey",
          address: addressText,
          zipCode: shippingAddress.postalCode || "34000",
        },
        billingAddress: {
          contactName,
          city: shippingAddress.city,
          country: "Turkey",
          address: addressText,
          zipCode: shippingAddress.postalCode || "34000",
        },
        basketItems,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripeSessionId: session.token },
      });

      logApiEvent(context, "payment.checkout.session_created", {
        paymentId: payment.id,
        amount: total,
        userId: user.id,
        provider: "iyzico",
      });

      return apiJson(context, { ok: true, url: session.paymentPageUrl });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logApiEvent(context, "payment.checkout.iyzico_failed", {
        userId: user.id,
        paymentId: payment.id,
        error: errorMessage,
      });

      return apiError(
        context,
        502,
        "PAYMENT_PROVIDER_ERROR",
        `Ödeme sağlayıcısı hata verdi: ${errorMessage}`,
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
    logApiError(context, "payment.checkout.failed", error);
    return apiError(context, 500, "CHECKOUT_FAILED", `Odeme altyapisi hazir degil. Detay: ${errorMessage}`);
  }
}
