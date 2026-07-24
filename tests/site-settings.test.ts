import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultHomeAnnouncementText, normalizeHomeAnnouncementText } from "../lib/site-settings";

test("normalizeHomeAnnouncementText trims whitespace and falls back to default", () => {
  assert.equal(normalizeHomeAnnouncementText("  Kampanya metni  "), "Kampanya metni");
  assert.equal(normalizeHomeAnnouncementText("   "), getDefaultHomeAnnouncementText());
});
