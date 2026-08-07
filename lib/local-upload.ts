import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

function getUploadsDirectory(customDir?: string) {
  return customDir || path.join(process.cwd(), "public", "uploads");
}

function normalizeFileName(fileName: string) {
  return path.basename(String(fileName || "").trim());
}

export function getUploadContentType(fileName: string) {
  const normalized = normalizeFileName(fileName).toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function uploadImageToLocalStorage(file: File, options?: { fileName?: string; outputDir?: string }) {
  const outputDir = getUploadsDirectory(options?.outputDir);
  await fs.mkdir(outputDir, { recursive: true });

  const extension = path.extname(file.name || "").toLowerCase();
  const fallbackExtension = extension || ".jpg";
  const generatedName = `${Date.now()}-${randomUUID()}${fallbackExtension}`;
  const safeFileName = normalizeFileName(options?.fileName || generatedName);
  const filePath = path.join(outputDir, safeFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(filePath, buffer);

  return {
    fileId: safeFileName,
    fileName: safeFileName,
    contentType: file.type || getUploadContentType(safeFileName),
  };
}

export async function readUploadedImage(fileName: string, options?: { outputDir?: string }) {
  const safeFileName = normalizeFileName(fileName);
  if (!safeFileName) {
    throw new Error("File name missing");
  }

  const uploadsDir = getUploadsDirectory(options?.outputDir);
  const filePath = path.join(uploadsDir, safeFileName);
  const buffer = await fs.readFile(filePath);

  return {
    buffer,
    contentType: getUploadContentType(safeFileName),
  };
}