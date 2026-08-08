import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

function getUploadsDirectories(customDir?: string) {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  const defaults = [
    customDir,
    fromEnv,
    path.join(process.cwd(), "public", "uploads"),
    path.join(os.tmpdir(), "olgunsoy", "uploads"),
  ].filter((value): value is string => Boolean(value && value.trim()));

  return Array.from(new Set(defaults.map((item) => path.resolve(item))));
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
  const extension = path.extname(file.name || "").toLowerCase();
  const fallbackExtension = extension || ".jpg";
  const generatedName = `${Date.now()}-${randomUUID()}${fallbackExtension}`;
  const safeFileName = normalizeFileName(options?.fileName || generatedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  const candidateDirs = getUploadsDirectories(options?.outputDir);

  let lastError: unknown = null;
  for (const outputDir of candidateDirs) {
    try {
      await fs.mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, safeFileName);
      await fs.writeFile(filePath, buffer);

      return {
        fileId: safeFileName,
        fileName: safeFileName,
        contentType: file.type || getUploadContentType(safeFileName),
      };
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Unknown upload error";
  throw new Error(`Upload storage unavailable: ${message}`);
}

export async function readUploadedImage(fileName: string, options?: { outputDir?: string }) {
  const safeFileName = normalizeFileName(fileName);
  if (!safeFileName) {
    throw new Error("File name missing");
  }

  const candidateDirs = getUploadsDirectories(options?.outputDir);
  let lastError: unknown = null;
  for (const uploadsDir of candidateDirs) {
    try {
      const filePath = path.join(uploadsDir, safeFileName);
      const buffer = await fs.readFile(filePath);

      return {
        buffer,
        contentType: getUploadContentType(safeFileName),
      };
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : "File not found";
  throw new Error(`Unable to read uploaded image: ${message}`);
}