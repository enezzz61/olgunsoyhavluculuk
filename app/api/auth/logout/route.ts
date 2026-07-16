import { clearSessionCookie } from "@/lib/session";
import { apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/auth/logout");
  await clearSessionCookie();
  logApiEvent(context, "auth.logout.succeeded");
  return apiJson(context, { ok: true });
}
