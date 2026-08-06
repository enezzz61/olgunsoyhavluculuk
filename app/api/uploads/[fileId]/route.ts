import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { downloadImageFromGridFs } from "@/lib/gridfs-upload";

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;

  try {
    const { buffer, contentType } = await downloadImageFromGridFs(fileId);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    const fallbackPath = path.join(process.cwd(), "public", "uploads", fileId);
    try {
      const buffer = await fs.readFile(fallbackPath);
      const contentType = fileId.toLowerCase().endsWith(".png") ? "image/png" : fileId.toLowerCase().endsWith(".jpg") || fileId.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : fileId.toLowerCase().endsWith(".webp") ? "image/webp" : fileId.toLowerCase().endsWith(".gif") ? "image/gif" : "application/octet-stream";

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
