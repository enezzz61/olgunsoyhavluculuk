import test from "node:test";
import assert from "node:assert/strict";
import { getImageExtension, isSupportedImageFile } from "../lib/image-upload-validation";

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
