import test from "node:test";
import assert from "node:assert/strict";
import { buildOrderReceiptHtml } from "../lib/order-workflow";

test("buildOrderReceiptHtml includes items and shipping address", () => {
  const html = buildOrderReceiptHtml(
    {
      id: "ord_123",
      total: 1800,
      createdAt: "2026-07-29T12:00:00.000Z",
      user: { name: "Ali Demir", email: "ali@example.com" },
      items: [
        { name: "Elma", quantity: 2, unitPrice: 500, lineTotal: 1000 },
        { name: "Armut", quantity: 1, unitPrice: 800, lineTotal: 800 },
      ],
      shippingAddress: {
        fullName: "Ali Demir",
        phone: "05551234567",
        city: "İstanbul",
        district: "Kadıköy",
        address: "Atatürk Cd. No:1",
        postalCode: "34710",
      },
    },
    { name: "Ali Demir", email: "ali@example.com" },
    "https://example.com/logo.jpg",
  );

  assert.match(html, /Elma/);
  assert.match(html, /Atatürk Cd\. No:1/);
  assert.match(html, /Kadıköy/);
  assert.match(html, /https:\/\/example\.com\/logo\.jpg/);
});
