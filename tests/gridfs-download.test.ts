import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { getGridFsContentType, getGridFsObjectId, uploadImageLocally } from "@/lib/gridfs-upload";

test("derives content type from metadata when present", () => {
  const contentType = getGridFsContentType({
    metadata: { contentType: "image/png" },
  });

  assert.equal(contentType, "image/png");
});

test("falls back to a top-level content type", () => {
  const contentType = getGridFsContentType({
    contentType: "image/jpeg",
  });

  assert.equal(contentType, "image/jpeg");
});

test("parses a valid GridFS file id", () => {
  const objectId = getGridFsObjectId("507f1f77bcf86cd799439011");

  assert.ok(objectId);
});

test("writes a local fallback copy for uploads when MongoDB is unavailable", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-gridfs-test");
  await fs.mkdir(tempDir, { recursive: true });
  const file = new File(["test-image"], "test.png", { type: "image/png" });
  const result = await uploadImageLocally(file, { outputDir: tempDir, fileName: "fallback-test.png" });

  assert.equal(result.contentType, "image/png");
  assert.ok(result.fileId);
  const storedFile = path.join(tempDir, result.fileId);
  assert.equal(await fs.readFile(storedFile, "utf8"), "test-image");
});
