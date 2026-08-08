import test from "node:test";
import assert from "node:assert/strict";
import { getImageExtension, isSupportedImageFile } from "../lib/image-upload-validation";
import { buildUploadedImageUrl } from "../lib/image-upload-validation";

test("accepts jpg files even when MIME type is missing", () => {
  assert.equal(isSupportedImageFile({ name: "photo.jpg", type: "" }), true);
  assert.equal(getImageExtension({ name: "photo.jpg", type: "" }), ".jpg");
});

test("accepts png and webp files by MIME or extension", () => {
  assert.equal(isSupportedImageFile({ name: "photo.png", type: "image/png" }), true);
  assert.equal(isSupportedImageFile({ name: "photo.webp", type: "image/webp" }), true);
});

test("rejects unsupported image formats", () => {
  assert.equal(isSupportedImageFile({ name: "photo.gif", type: "image/gif" }), false);
  assert.equal(isSupportedImageFile({ name: "photo.bmp", type: "image/bmp" }), false);
});

test("builds /api/uploads/<filename> URLs for saved product images", () => {
  assert.equal(buildUploadedImageUrl("1785330841078-65719ce3-05fa-4cb1-afde-169bdf9d4697.jpg"), "/api/uploads/1785330841078-65719ce3-05fa-4cb1-afde-169bdf9d4697.jpg");
});

test("sanitizes path-like values when building upload URL", () => {
  assert.equal(buildUploadedImageUrl("/tmp/foo/bar.png"), "/api/uploads/bar.png");
});
