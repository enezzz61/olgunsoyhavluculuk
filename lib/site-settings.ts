import { prisma } from "@/lib/prisma";

const DEFAULT_HOME_ANNOUNCEMENT = "1000 TL VE ÜZERİ SİPARİŞLERDE KARGO ÜCRETSİZ";
const HOME_ANNOUNCEMENT_KEY = "homeAnnouncementText";

export function getDefaultHomeAnnouncementText() {
  return DEFAULT_HOME_ANNOUNCEMENT;
}

export function normalizeHomeAnnouncementText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || getDefaultHomeAnnouncementText();
}

export async function getHomeAnnouncementText() {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: HOME_ANNOUNCEMENT_KEY } });
    return normalizeHomeAnnouncementText(setting?.value);
  } catch {
    return getDefaultHomeAnnouncementText();
  }
}

export async function saveHomeAnnouncementText(value: string | null | undefined) {
  const normalized = normalizeHomeAnnouncementText(value);

  try {
    await prisma.siteSetting.upsert({
      where: { key: HOME_ANNOUNCEMENT_KEY },
      update: { value: normalized },
      create: { key: HOME_ANNOUNCEMENT_KEY, value: normalized },
    });
  } catch {
    return normalized;
  }

  return normalized;
}
