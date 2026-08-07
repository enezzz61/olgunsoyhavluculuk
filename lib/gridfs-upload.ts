import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import { promises as fs } from "node:fs";
import path from "node:path";
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

export function getGridFsContentType(file: { metadata?: { contentType?: string } | null; contentType?: string | null }) {
  return file.metadata?.contentType || file.contentType || "application/octet-stream";
}

export function getGridFsObjectId(fileId: string) {
  if (!fileId) return null;
  try {
    return new ObjectId(fileId);
  } catch {
    return null;
  }
}

export async function uploadImageLocally(file: File, options?: { fileName?: string; outputDir?: string }) {
  const outputDir = options?.outputDir || path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(outputDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = options?.fileName || `${Date.now()}-${randomUUID()}-${file.name}`;
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, buffer);
  return { fileId: fileName, fileName, contentType: file.type || "application/octet-stream" };
}

export async function uploadImageToGridFs(file: File, options?: { fileName?: string }) {
  const connectionString = getMongoConnectionString();
  if (!connectionString) {
    return uploadImageLocally(file, options);
  }

  try {
    const client = new MongoClient(connectionString);
    await client.connect();

    const dbName = connectionString.match(/\/([^/?#]+)(?:\?|#|$)/)?.[1] || "olgunsoy";
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);
    const fileName = options?.fileName || `${Date.now()}-${randomUUID()}-${file.name}`;
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    await new Promise<void>((resolve, reject) => {
      stream.pipe(uploadStream).on("finish", resolve).on("error", reject);
    });

    await client.close();
    return { fileId: uploadStream.id.toString(), fileName, contentType: file.type || "application/octet-stream" };
  } catch {
    return uploadImageLocally(file, options);
  }
}

export async function downloadImageFromGridFs(fileId: string) {
  const connectionString = getMongoConnectionString();
  if (!connectionString) {
    throw new Error("MongoDB connection string missing");
  }

  const objectId = getGridFsObjectId(fileId);
  if (!objectId) {
    throw new Error("Invalid GridFS file id");
  }

  const client = new MongoClient(connectionString);
  await client.connect();

  const dbName = connectionString.match(/\/([^/?#]+)(?:\?|#|$)/)?.[1] || "olgunsoy";
  const db = client.db(dbName);
  const bucket = new GridFSBucket(db, { bucketName: "uploads" });
  const downloadStream = bucket.openDownloadStream(objectId);
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    downloadStream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    downloadStream.on("error", reject);
    downloadStream.on("end", resolve);
  });

  await client.close();
  return {
    buffer: Buffer.concat(chunks),
    contentType: getGridFsContentType(
      ((await db.collection("uploads.files").findOne({ _id: objectId })) as {
        metadata?: { contentType?: string } | null;
        contentType?: string | null;
      } | null) || {},
    ),
  };
}

export async function downloadImageFromGridFsByFileName(fileName: string) {
  const connectionString = getMongoConnectionString();
  if (!connectionString) {
    throw new Error("MongoDB connection string missing");
  }

  const client = new MongoClient(connectionString);
  await client.connect();

  const dbName = connectionString.match(/\/([^/?#]+)(?:\?|#|$)/)?.[1] || "olgunsoy";
  const db = client.db(dbName);
  const fileRecord = (await db.collection("uploads.files").findOne({ filename: fileName })) as {
    _id?: unknown;
    metadata?: { contentType?: string } | null;
    contentType?: string | null;
  } | null;

  await client.close();

  if (!fileRecord?._id) {
    throw new Error("GridFS file not found");
  }

  return downloadImageFromGridFs(String(fileRecord._id));
}
