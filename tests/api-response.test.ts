import test from "node:test";
import assert from "node:assert/strict";
import { readApiErrorMessage } from "../lib/api-response";
import { getIyzicoConfigStatus, normalizeIyzicoErrorMessage } from "../lib/iyzico";

test("readApiErrorMessage returns the backend message when present", async () => {
  const response = new Response(JSON.stringify({ message: "API bilgileri bulunamadı" }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });

  assert.equal(await readApiErrorMessage(response, "Siparis olusturulamadi."), "API bilgileri bulunamadı");
});

test("readApiErrorMessage falls back to a generic message", async () => {
  const response = new Response("", {
    status: 500,
    headers: { "content-type": "text/plain" },
  });

  assert.equal(await readApiErrorMessage(response, "Siparis olusturulamadi."), "Siparis olusturulamadi.");
});

test("normalizeIyzicoErrorMessage explains missing API credentials", () => {
  const message = normalizeIyzicoErrorMessage("API bilgileri bulunamadı");
  assert.match(message, /IYZICO_API_KEY/);
  assert.match(message, /IYZICO_SECRET_KEY/);
});

test("getIyzicoConfigStatus reports the exact missing keys", () => {
  const original = process.env;
  process.env = { ...original, IYZICO_API_KEY: "", IYZICO_SECRET_KEY: "secret", IYZICO_BASE_URL: "https://api.iyzipay.com", IYZICO_IDENTITY_NUMBER: "12345678901" };

  try {
    const status = getIyzicoConfigStatus();
    assert.equal(status.configured, false);
    assert.deepEqual(status.missingKeys, ["IYZICO_API_KEY"]);
  } finally {
    process.env = original;
  }
});
