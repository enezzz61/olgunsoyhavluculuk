import { NextResponse } from "next/server";
import { getMongoConnectionString, getMongoDatabaseName } from "@/lib/mongo-storage";

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const connectionString = getMongoConnectionString();
  const databaseName = getMongoDatabaseName();

  if (!connectionString) {
    return new NextResponse("MongoDB connection string missing", { status: 500, headers: { "content-type": "text/plain" } });
  }

  return new NextResponse(
    JSON.stringify({ ok: true, fileId, databaseName, message: "MongoDB GridFS endpoint ready" }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
