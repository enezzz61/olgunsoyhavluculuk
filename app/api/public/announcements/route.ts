import { apiJson, getRequestContext } from "@/lib/api-observability";
import { canUseMockData } from "@/lib/db-fallback";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/public/announcements");

  if (canUseMockData()) {
    return apiJson(context, {
      ok: true,
      announcements: [
        {
          id: "mock-announcement",
          title: "Kampanya başlıyor",
          body: "Özel sezon fırsatları bu hafta devam ediyor.",
          isActive: true,
          showOnHome: true,
        },
      ],
      featuredAnnouncement: {
        id: "mock-announcement",
        title: "Kampanya başlıyor",
        body: "Özel sezon fırsatları bu hafta devam ediyor.",
        isActive: true,
        showOnHome: true,
      },
    });
  }

  const announcements = await prisma.announcement.findMany({
    where: { isActive: true, showOnHome: true },
    orderBy: [{ createdAt: "desc" }],
    take: 5,
  });

  return apiJson(context, {
    ok: true,
    announcements,
    featuredAnnouncement: announcements[0] || null,
  });
}
