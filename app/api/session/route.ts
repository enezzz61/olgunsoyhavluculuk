import { getSessionUser } from "@/lib/session";
import { apiJson, getRequestContext } from "@/lib/api-observability";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/session");
  try {
    const user = await getSessionUser();
    return apiJson(context, { user });
  } catch (error) {
    console.error("Session error:", error);
    return apiJson(context, { user: null });
  }
}
