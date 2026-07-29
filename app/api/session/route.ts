import { getSessionUser } from "@/lib/session";
import { apiJson, getRequestContext } from "@/lib/api-observability";
import { canUseMockData } from "@/lib/db-fallback";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/session");
  try {
    if (canUseMockData()) {
      return apiJson(context, { user: null }, {
        headers: {
          "x-data-source": "mock",
        },
      });
    }
    const user = await getSessionUser();
    return apiJson(context, { user });
  } catch (error) {
    console.error("Session error:", error);
    return apiJson(context, { user: null });
  }
}
