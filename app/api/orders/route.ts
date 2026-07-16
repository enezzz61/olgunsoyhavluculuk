import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { apiError, apiJson, getRequestContext } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/orders");
  const user = await getSessionUser();
  if (!user) {
    return apiError(context, 401, "UNAUTHORIZED", "Yetkisiz.");
  }

  let orders;
  try {
    orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
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

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/orders");
  const user = await getSessionUser();
  if (!user) {
    return apiError(context, 401, "UNAUTHORIZED", "Odeme icin once giris yapmaniz gerekiyor.");
  }

  return apiError(
    context,
    410,
    "ENDPOINT_DISABLED",
    "Dogrudan siparis olusturma kapatildi. Lutfen odeme adimini kullanin.",
  );
}
