import { apiError, apiJson, getRequestContext } from "@/lib/api-observability";
import { createPasswordResetRequest } from "@/lib/password-reset";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/auth/request-password-reset");

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const purpose = String(body.purpose || "user") === "admin" ? "admin" : "user";

    const result = await createPasswordResetRequest(email, purpose);
    return result.ok
      ? apiJson(context, { ok: true, message: result.message })
      : apiError(context, 400, "PASSWORD_RESET_FAILED", result.message);
  } catch (error) {
    console.error("Request password reset error:", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Şifre sıfırlama isteği oluşturulamadı.");
  }
}
