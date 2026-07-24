import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionUser } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";
import { findMockUserById } from "@/lib/mock-auth";

export async function DELETE(request: Request) {
  const context = getRequestContext(request, "/api/auth/delete");
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return apiError(context, 401, "UNAUTHORIZED", "Yetkisiz.");
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "").trim();

  if (!password) {
    return apiError(context, 400, "VALIDATION_ERROR", "Hesap silme için şifrenizi girin.");
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!userRecord) {
      return apiError(context, 404, "USER_NOT_FOUND", "Kullanici bulunamadi.");
    }

    const valid = await compare(password, userRecord.password);
    if (!valid) {
      return apiError(context, 401, "INVALID_CREDENTIALS", "Şifre hatalı.");
    }

    await prisma.address.deleteMany({ where: { userId: userRecord.id } });
    await prisma.order.deleteMany({ where: { userId: userRecord.id } });
    await prisma.payment.deleteMany({ where: { userId: userRecord.id } });
    await prisma.user.delete({ where: { id: userRecord.id } });

    await clearSessionCookie();

    logApiEvent(context, "auth.account.deleted", { userId: userRecord.id, email: userRecord.email });
    return apiJson(context, { ok: true, message: "Hesabınız silindi." });
  } catch (error) {
    if (isDbUnavailableError(error) && canUseMockData()) {
      const mockUser = findMockUserById(sessionUser.id);
      if (!mockUser || mockUser.password !== password) {
        return apiError(context, 401, "INVALID_CREDENTIALS", "Şifre hatalı.");
      }

      await clearSessionCookie();
      return apiJson(context, { ok: true, message: "Hesabınız silindi." });
    }

    throw error;
  }
}
