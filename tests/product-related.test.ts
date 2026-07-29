import test from "node:test";
import assert from "node:assert/strict";
import { isDatabaseObjectId, isMockProductId, shouldQueryProductCatalog } from "../lib/product-related";

test("detects mock product IDs", () => {
  assert.equal(isMockProductId("mock-hv-103"), true);
  assert.equal(isMockProductId("6a58de01810720fb995faa02"), false);
});

test("detects Mongo-style object IDs", () => {
  assert.equal(isDatabaseObjectId("6a58de01810720fb995faa02"), true);
  assert.equal(isDatabaseObjectId("mock-hv-103"), false);
});

test("only queries the catalog for real database IDs", () => {
  assert.equal(shouldQueryProductCatalog("6a58de01810720fb995faa02"), true);
  assert.equal(shouldQueryProductCatalog("mock-hv-103"), false);
});
