import { randomUUID } from "node:crypto";

export function getMongoConnectionString() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    process.env.MONGO_URL?.trim() ||
    process.env.MONGODB_URL?.trim() ||
    ""
  );
}

export function getMongoDatabaseName() {
  const connectionString = getMongoConnectionString();
  if (!connectionString) return "olgunsoy";

  const match = connectionString.match(/\/([^/?#]+)(?:\?|#|$)/);
  if (match?.[1]) {
    return match[1];
  }

  return "olgunsoy";
}

export function buildGridFsUrl(fileId: string) {
  return `/api/uploads/${fileId}`;
}

export function createGridFsFileName(originalName: string) {
  const extension = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : "";
  return `${Date.now()}-${randomUUID()}${extension}`;
}
