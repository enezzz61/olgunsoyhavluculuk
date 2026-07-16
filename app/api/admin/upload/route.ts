import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return "";
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/admin/upload");
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!files.length) {
      return apiError(context, 400, "VALIDATION_ERROR", "Yuklenecek gorsel bulunamadi.");
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return apiError(context, 400, "INVALID_FILE_TYPE", "Sadece gorsel dosyasi yukleyebilirsiniz.");
      }

      if (file.size > MAX_FILE_SIZE) {
        return apiError(context, 400, "FILE_TOO_LARGE", "Her bir gorsel en fazla 5MB olabilir.");
      }

      const extension = extFromMime(file.type) || path.extname(file.name) || ".jpg";
      const filename = `${Date.now()}-${randomUUID()}${extension}`;
      const filePath = path.join(uploadsDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      urls.push(`/uploads/${filename}`);
    }

    logApiEvent(context, "admin.upload.succeeded", { count: urls.length });
    return apiJson(context, { ok: true, urls });
  } catch (error) {
    logApiError(context, "admin.upload.failed", error);
    return apiError(context, 500, "UPLOAD_FAILED", "Dosya yukleme sirasinda hata olustu.");
  }
}
