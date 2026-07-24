import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext } from "@/lib/api-observability";
import { getHomeAnnouncementText, saveHomeAnnouncementText } from "@/lib/site-settings";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/site-settings");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const homeAnnouncementText = await getHomeAnnouncementText();
    return apiJson(context, {
      ok: true,
      homeAnnouncementText,
    });
  } catch {
    return apiJson(context, {
      ok: true,
      homeAnnouncementText: "",
    });
  }
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/admin/site-settings");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const body = await request.json();
    const homeAnnouncementText = await saveHomeAnnouncementText(body?.homeAnnouncementText);

    return apiJson(context, {
      ok: true,
      message: "Ana sayfa duyurusu güncellendi.",
      homeAnnouncementText,
    });
  } catch {
    return apiError(context, 500, "INTERNAL_ERROR", "Ayar kaydedilemedi.");
  }
}
