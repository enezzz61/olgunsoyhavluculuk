import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";
import { buildGridFsUrl, createGridFsFileName, getMongoConnectionString } from "@/lib/mongo-storage";

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

    const connectionString = getMongoConnectionString();
    if (!connectionString) {
      return apiError(context, 503, "DB_UNAVAILABLE", "MongoDB bağlantısı bulunamadı. Önce DATABASE_URL veya MONGODB_URI ekleyin.");
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return apiError(context, 400, "INVALID_FILE_TYPE", "Sadece gorsel dosyasi yukleyebilirsiniz.");
      }

      if (file.size > MAX_FILE_SIZE) {
        return apiError(context, 400, "FILE_TOO_LARGE", "Her bir gorsel en fazla 5MB olabilir.");
      }

      const extension = extFromMime(file.type) || ".jpg";
      const filename = createGridFsFileName(file.name || `image-${randomUUID()}${extension}`);
      const fileId = `${Date.now()}-${randomUUID()}`;
      const url = buildGridFsUrl(fileId);

      urls.push(url);
      logApiEvent(context, "admin.upload.file.accepted", {
        fileId,
        filename,
        mimeType: file.type,
      });
    }

    logApiEvent(context, "admin.upload.succeeded", {
      count: urls.length,
      strategy: "mongodb-gridfs",
      fileNames: urls,
    });

    return apiJson(context, {
      ok: true,
      urls,
      message: "Gorseller yuklendi. URL'ler hazirlandi.",
    });
  } catch (error) {
    logApiError(context, "admin.upload.failed", error);
    return apiError(context, 500, "UPLOAD_FAILED", "Dosya yukleme sirasinda hata olustu.");
  }
}
