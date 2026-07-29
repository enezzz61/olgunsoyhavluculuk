import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { prisma } from "@/lib/prisma";

type AnnouncementBody = {
  id?: string;
  title?: string;
  body?: string;
  isActive?: boolean;
  showOnHome?: boolean;
};

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "on", "yes"].includes(value.toLowerCase());
  }

  return fallback;
}

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/announcements");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isActive: "desc" }, { showOnHome: "desc" }, { createdAt: "desc" }],
  });

  return apiJson(context, { ok: true, announcements });
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/admin/announcements");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const body = (await request.json()) as AnnouncementBody;
    const title = normalizeText(body.title);
    const bodyText = normalizeText(body.body);
    const isActive = parseBoolean(body.isActive, true);
    const showOnHome = parseBoolean(body.showOnHome, true);

    if (!title || !bodyText) {
      return apiError(context, 400, "VALIDATION_ERROR", "Baslik ve duyuru metni gerekli.");
    }

    const created = await prisma.announcement.create({
      data: {
        title,
        body: bodyText,
        isActive,
        showOnHome,
      },
    });

    logApiEvent(context, "admin.announcement.created", { announcementId: created.id, title });

    return apiJson(context, { ok: true, message: "Duyuru olusturuldu.", announcement: created });
  } catch (error) {
    return apiError(context, 500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Duyuru kaydedilemedi.");
  }
}

export async function PATCH(request: Request) {
  const context = getRequestContext(request, "/api/admin/announcements");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const body = (await request.json()) as AnnouncementBody;
    const id = normalizeText(body.id);
    if (!id) {
      return apiError(context, 400, "VALIDATION_ERROR", "Duyuru id gerekli.");
    }

    const updateData = {
      title: body.title !== undefined ? normalizeText(body.title) : undefined,
      body: body.body !== undefined ? normalizeText(body.body) : undefined,
      isActive: body.isActive !== undefined ? parseBoolean(body.isActive, true) : undefined,
      showOnHome: body.showOnHome !== undefined ? parseBoolean(body.showOnHome, true) : undefined,
    };

    if (updateData.title === "" || updateData.body === "") {
      return apiError(context, 400, "VALIDATION_ERROR", "Baslik ve duyuru metni bos olamaz.");
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(updateData.title !== undefined ? { title: updateData.title } : {}),
        ...(updateData.body !== undefined ? { body: updateData.body } : {}),
        ...(updateData.isActive !== undefined ? { isActive: updateData.isActive } : {}),
        ...(updateData.showOnHome !== undefined ? { showOnHome: updateData.showOnHome } : {}),
      },
    });

    logApiEvent(context, "admin.announcement.updated", { announcementId: updated.id });

    return apiJson(context, { ok: true, message: "Duyuru guncellendi.", announcement: updated });
  } catch (error) {
    return apiError(context, 500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Duyuru guncellenemedi.");
  }
}

export async function DELETE(request: Request) {
  const context = getRequestContext(request, "/api/admin/announcements");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const body = (await request.json().catch(() => ({}))) as AnnouncementBody;
    const id = normalizeText(body.id);
    if (!id) {
      return apiError(context, 400, "VALIDATION_ERROR", "Duyuru id gerekli.");
    }

    await prisma.announcement.delete({ where: { id } });
    logApiEvent(context, "admin.announcement.deleted", { announcementId: id });

    return apiJson(context, { ok: true, message: "Duyuru silindi." });
  } catch (error) {
    return apiError(context, 500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Duyuru silinemedi.");
  }
}
