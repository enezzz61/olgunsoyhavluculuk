import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { downloadImageFromGridFsByFileName } from "@/lib/gridfs-upload";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const fileName = segments?.join("/") || "";

  if (!fileName) {
    return new NextResponse("Dosya bulunamadi", { status: 404, headers: { "content-type": "text/plain" } });
  }

  try {
    const { buffer, contentType } = await downloadImageFromGridFsByFileName(fileName);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    const fallbackPath = path.join(process.cwd(), "public", "uploads", path.basename(fileName));
    try {
      const buffer = await fs.readFile(fallbackPath);
      const contentType = fileName.toLowerCase().endsWith(".png") ? "image/png" : fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : fileName.toLowerCase().endsWith(".webp") ? "image/webp" : "application/octet-stream";

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new NextResponse("Dosya bulunamadi", {
        status: 404,
        headers: { "content-type": "text/plain" },
      });
    }
  }
}
