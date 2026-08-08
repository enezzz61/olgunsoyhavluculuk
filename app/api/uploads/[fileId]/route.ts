import { NextResponse } from "next/server";
import { readUploadedImage } from "@/lib/local-upload";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;

  try {
    const { buffer, contentType } = await readUploadedImage(fileId);

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
