import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError, getMockProducts } from "@/lib/db-fallback";
import { listMockUsers } from "@/lib/mock-auth";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/overview");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  let users;
  let products;
  let orders;
  let revenue;
  try {
    [users, products, orders, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
    ]);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        return apiJson(context, {
          ok: true,
          metrics: {
            users: listMockUsers().length,
            products: getMockProducts().length,
            orders: 0,
            revenue: 0,
          },
        });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }

  return apiJson(context, {
    ok: true,
    metrics: {
      users,
      products,
      orders,
      revenue: revenue._sum.total ?? 0,
    },
  });
}
