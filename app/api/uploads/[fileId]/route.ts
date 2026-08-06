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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(message, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}
