import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type UploadStrategy = "auto" | "local" | "data-url";

function isLikelyVercelOrServerless() {
  return Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.NODE_ENV === "production");
}

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return "";
}

function resolveUploadStrategy(): UploadStrategy {
  const raw = String(process.env.UPLOAD_STRATEGY || "auto").trim().toLowerCase();
  if (raw === "local" || raw === "data-url") {
    return raw;
  }

  if (isLikelyVercelOrServerless()) {
    return "data-url";
  }

  return "local";
}

function toDataUrl(mime: string, buffer: Buffer) {
  const safeMime = mime.startsWith("image/") ? mime : "image/jpeg";
  return `data:${safeMime};base64,${buffer.toString("base64")}`;
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

    const strategy = resolveUploadStrategy();
    const useDataUrlOnly = strategy === "data-url";
    const allowDataUrlFallback = strategy !== "local";
    const canWriteLocally = !useDataUrlOnly;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!useDataUrlOnly) {
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        if (!allowDataUrlFallback) {
          throw error;
        }

        logApiError(context, "admin.upload.local-dir-unavailable", error);
      }
    }

    const urls: string[] = [];
    let usedDataUrlFallback = false;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return apiError(context, 400, "INVALID_FILE_TYPE", "Sadece gorsel dosyasi yukleyebilirsiniz.");
      }

      if (file.size > MAX_FILE_SIZE) {
        return apiError(context, 400, "FILE_TOO_LARGE", "Her bir gorsel en fazla 5MB olabilir.");
      }

      const extension = extFromMime(file.type) || path.extname(file.name) || ".jpg";
      const filename = `${Date.now()}-${randomUUID()}${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      if (useDataUrlOnly) {
        urls.push(toDataUrl(file.type, buffer));
        usedDataUrlFallback = true;
        continue;
      }

      const filePath = path.join(uploadsDir, filename);
      try {
        await writeFile(filePath, buffer);
        urls.push(`/uploads/${filename}`);
      } catch (error) {
        if (!allowDataUrlFallback) {
          throw error;
        }

        logApiError(context, "admin.upload.local-write-failed", error, { filename });
        urls.push(toDataUrl(file.type, buffer));
        usedDataUrlFallback = true;
      }
    }

    logApiEvent(context, "admin.upload.succeeded", {
      count: urls.length,
      strategy,
      usedDataUrlFallback,
    });

    const message = usedDataUrlFallback
      ? "Gorseller yuklendi ama sunucuda kalici dosya depolama bulunamadigi icin data-url olarak kaydedildi. Bu ortamda kalici dosya yazimi desteklenmiyor; gerekiyorsa sunucu tarafinda yazma izni veya bir depolama servisi kullanin."
      : canWriteLocally
        ? "Gorseller yuklendi."
        : undefined;

    return apiJson(context, { ok: true, urls, message });
  } catch (error) {
    logApiError(context, "admin.upload.failed", error);
    return apiError(
      context,
      500,
      "UPLOAD_FAILED",
      "Dosya yukleme sirasinda hata olustu. Canli ortamda yazma izni yoksa UPLOAD_STRATEGY=data-url ile deneyin.",
    );
  }
}
