import { NextResponse } from "next/server";
import { readUploadedImage } from "@/lib/local-upload";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const fileName = segments?.[segments.length - 1] || "";

  if (!fileName) {
    return new NextResponse("Dosya bulunamadi", { status: 404, headers: { "content-type": "text/plain" } });
  }

  try {
    const { buffer, contentType } = await readUploadedImage(fileName);
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
