import { prisma } from "@/lib/prisma";
import { apiJson, getRequestContext } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";
import { listMockUsers } from "@/lib/mock-auth";

export const revalidate = 60;

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/public/metrics");

  if (canUseMockData()) {
    const mockUsers = listMockUsers();
    return apiJson(context, {
      wholesaleCustomers: mockUsers.filter((user) => user.role === "toptanci").length,
      retailCustomers: mockUsers.filter((user) => user.role === "perakende").length,
      source: "mock",
    });
  }

  try {
    const [wholesaleCustomers, retailCustomers] = await Promise.all([
      prisma.user.count({
        where: { role: "toptanci" },
      }),
      prisma.user.count({
        where: { role: "perakende" },
      }),
    ]);

    return apiJson(context, {
      wholesaleCustomers,
      retailCustomers,
      source: "db",
    });
  } catch (error) {
    if (isDbUnavailableError(error) && canUseMockData()) {
      const wholesaleCustomers = listMockUsers().filter((user) => user.role === "toptanci").length;
      const retailCustomers = listMockUsers().filter((user) => user.role === "perakende").length;

      return apiJson(
        context,
        {
          wholesaleCustomers,
          retailCustomers,
          source: "mock",
        },
        {
          headers: {
            "x-data-source": "mock",
          },
        },
      );
    }

    throw error;
  }
}
