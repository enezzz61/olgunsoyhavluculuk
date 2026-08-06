import test from "node:test";
import assert from "node:assert/strict";
import { buildGridFsUrl, getMongoConnectionString, getMongoDatabaseName } from "../lib/mongo-storage";

test("reads the MongoDB connection string from the environment", () => {
  process.env.DATABASE_URL = "mongodb://127.0.0.1:27017/olgunsoy";
  delete process.env.MONGODB_URI;

  assert.equal(getMongoConnectionString(), "mongodb://127.0.0.1:27017/olgunsoy");
});

test("parses the MongoDB database name from the connection string", () => {
  process.env.DATABASE_URL = "mongodb://127.0.0.1:27017/olgunsoy";

  assert.equal(getMongoDatabaseName(), "olgunsoy");
});

test("builds a public upload URL for a GridFS object", () => {
  assert.equal(buildGridFsUrl("507f1f77bcf86cd799439011"), "/api/uploads/507f1f77bcf86cd799439011");
});
