import test from "node:test";
import assert from "node:assert/strict";
import { validatePassword } from "../lib/password-rules";

test("validatePassword reports uppercase, lowercase and number requirements", () => {
  const result = validatePassword("abc123");

  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((message) => message.includes("büyük harf")));
  assert.ok(result.errors.some((message) => message.includes("küçük harf")));
  assert.ok(result.errors.some((message) => message.includes("rakam")));
});
