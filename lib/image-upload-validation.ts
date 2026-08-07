export function buildUploadedImageUrl(fileName: string) {
  const normalized = String(fileName || "").trim();
  if (!normalized) return "";
  return `/uploads/${normalized.replace(/^\/+/, "")}`;
}

export function getImageExtension(file: { name?: string; type?: string }) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return ".png";
  if (name.endsWith(".webp")) return ".webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return ".jpg";

  const mime = (file.type || "").toLowerCase();
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  return ".jpg";
}

export function isSupportedImageFile(file: { name?: string; type?: string }) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) {
    return true;
  }

  const mime = (file.type || "").toLowerCase();
  return mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png" || mime === "image/webp";
}
