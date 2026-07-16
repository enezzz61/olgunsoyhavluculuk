import { AuditLevel, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/audit-logs");
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50;
  const pageParam = Number(url.searchParams.get("page") || 1);
  const page = Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1;
  const rawLevel = String(url.searchParams.get("level") || "").trim();
  const event = String(url.searchParams.get("event") || "").trim();

  const level =
    rawLevel === "info" || rawLevel === "warn" || rawLevel === "error"
      ? (rawLevel as AuditLevel)
      : undefined;

  const where: Prisma.ApiAuditLogWhereInput = {
    ...(level ? { level } : {}),
    ...(event ? { event: { contains: event } } : {}),
  };

  let total;
  let logs;
  try {
    [total, logs] = await Promise.all([
      prisma.apiAuditLog.count({ where }),
      prisma.apiAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      if (canUseMockData()) {
        return apiJson(context, { ok: true, logs: [], page, limit, total: 0, totalPages: 1 });
      }

      return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
    }

    throw error;
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return apiJson(context, { ok: true, logs, page, limit, total, totalPages });
}
