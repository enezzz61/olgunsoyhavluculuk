import { GridFSBucket, MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { Readable } from "stream";

function getMongoConnectionString() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    process.env.MONGO_URL?.trim() ||
    process.env.MONGODB_URL?.trim() ||
    ""
  );
}

export async function uploadImageToGridFs(file: File, options?: { fileName?: string }) {
  const connectionString = getMongoConnectionString();
  if (!connectionString) {
    throw new Error("MongoDB connection string missing");
  }

  const client = new MongoClient(connectionString);
  await client.connect();

  const dbName = connectionString.match(/\/([^/?#]+)(?:\?|#|$)/)?.[1] || "olgunsoy";
  const db = client.db(dbName);
  const bucket = new GridFSBucket(db, { bucketName: "uploads" });
  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = Readable.from(buffer);
  const fileName = options?.fileName || `${Date.now()}-${randomUUID()}-${file.name}`;
  const uploadStream = bucket.openUploadStream(fileName);

  await new Promise<void>((resolve, reject) => {
    stream.pipe(uploadStream).on("finish", resolve).on("error", reject);
  });

  await client.close();
  return { fileId: uploadStream.id.toString(), fileName };
}
