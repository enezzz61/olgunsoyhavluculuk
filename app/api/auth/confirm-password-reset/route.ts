import { apiError, apiJson, getRequestContext } from "@/lib/api-observability";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { validatePassword } from "@/lib/password-rules";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/auth/confirm-password-reset");

  try {
    const body = await request.json();
    const token = String(body.token || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return apiError(context, 400, "VALIDATION_ERROR", passwordValidation.errors.join(" "));
    }

    const result = await consumePasswordResetToken(token, newPassword);
    return result.ok
      ? apiJson(context, { ok: true, message: result.message })
      : apiError(context, 400, "PASSWORD_RESET_FAILED", result.message);
  } catch (error) {
    console.error("Confirm password reset error:", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Şifre sıfırlama işlemi başarısız oldu.");
  }
}
