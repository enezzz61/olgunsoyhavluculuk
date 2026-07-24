import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { validatePassword } from "@/lib/password-rules";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/auth/reset-password");

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const newPassword = String(body.newPassword || "").trim();

    if (!email || !newPassword) {
      return apiError(context, 400, "VALIDATION_ERROR", "E-posta ve yeni sifre gerekli.");
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return apiError(context, 400, "VALIDATION_ERROR", passwordValidation.errors.join(" "));
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return apiError(context, 404, "USER_NOT_FOUND", "Bu e-posta ile kullanici bulunamadi.");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hash(newPassword, 10),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
      },
    });

    logApiEvent(context, "auth.reset_password.succeeded", {
      userId: updated.id,
      email: updated.email,
      isAdmin: updated.isAdmin,
    });

    return apiJson(context, {
      ok: true,
      message: "Sifre basariyla guncellendi.",
      user: updated,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Sifre guncellenirken hata olustu.");
  }
}
