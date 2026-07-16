import { prisma } from "@/lib/prisma";
import { resolveUnitPrice } from "@/lib/pricing";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

export async function createOrderFromPaymentSession(params: {
  paymentReference: string;
  cartJson: string;
  shippingAddressId?: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: params.paymentReference },
    include: { user: true, order: { include: { items: true } } },
  });

  if (!payment) {
    return { ok: false, message: "Odeme kaydi bulunamadi." };
  }

  if (payment.orderId && payment.order) {
    return {
      ok: true,
      message: "Siparis zaten olusturulmus.",
      order: payment.order,
    };
  }

  const items = JSON.parse(params.cartJson || "[]") as CheckoutItem[];
  if (!items.length) {
    return { ok: false, message: "Sepet verisi bulunamadi." };
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { wholesaleTiers: true },
  });

  let total = 0;
  const orderItems = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return null;
      }
      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitPrice = resolveUnitPrice({
        product,
        role: payment.user.role,
        qty: quantity,
      }).unitPrice;
      const lineTotal = unitPrice * quantity;
      total += lineTotal;

      return {
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice,
        lineTotal,
      };
    })
    .filter(
      (item): item is { productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number } =>
        Boolean(item),
    );

  if (!orderItems.length) {
    return { ok: false, message: "Gecerli urun yok." };
  }

  try {
    // Check if payment exists and already has an order
    const current = await prisma.payment.findUnique({ where: { id: payment.id } });

    if (!current) {
      return { ok: false as const, message: "Odeme kaydi bulunamadi." };
    }

    if (current.orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: current.orderId },
        include: { items: true },
      });
      return {
        ok: true as const,
        message: "Siparis zaten olusturulmus.",
        order: existingOrder,
      };
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: payment.userId,
        total,
        shippingAddressId: params.shippingAddressId,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Update payment with order ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        orderId: order.id,
        amount: total,
      },
    });

    return {
      ok: true as const,
      message: "Odeme basarili, siparis olusturuldu.",
      order,
    };
  } catch (error) {
    return {
      ok: false as const,
      message: `Siparis olusturma hatasi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    };
  }
}
