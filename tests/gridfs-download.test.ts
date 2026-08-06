import assert from "node:assert/strict";
import test from "node:test";
import { getGridFsContentType, getGridFsObjectId } from "@/lib/gridfs-upload";

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
