import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";
import { uploadImageToGridFs } from "@/lib/gridfs-upload";
import { buildUploadedImageUrl, getImageExtension, isSupportedImageFile } from "@/lib/image-upload-validation";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

    const urls: string[] = [];

    for (const file of files) {
      if (!isSupportedImageFile(file)) {
        return apiError(context, 400, "INVALID_FILE_TYPE", "Sadece jpg, png veya webp gorseli yukleyebilirsiniz.");
      }

      if (file.size > MAX_FILE_SIZE) {
        return apiError(context, 400, "FILE_TOO_LARGE", "Her bir gorsel en fazla 5MB olabilir.");
      }

      const extension = getImageExtension(file);
      const filename = `${Date.now()}-${randomUUID()}${extension}`;
      const result = await uploadImageToGridFs(file, { fileName: filename });
      const url = buildUploadedImageUrl(result.fileName || result.fileId);

      urls.push(url);
      logApiEvent(context, "admin.upload.file.accepted", {
        fileId: result.fileId,
        filename: result.fileName,
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
