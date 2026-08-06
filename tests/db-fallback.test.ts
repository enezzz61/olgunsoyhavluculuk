import test from "node:test";
import assert from "node:assert/strict";
import { canUseMockData } from "../lib/db-fallback";
import { isDatabaseConfigured } from "../lib/prisma";

test("uses real data in development when a database URL is configured", () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    MOCK_DB: process.env.MOCK_DB,
  };

  try {
    process.env.DATABASE_URL = "mongodb://www.olgunsoyhavluculuk.com:27017/olgunsoy";
    delete process.env.MOCK_DB;

    assert.equal(canUseMockData(), false);
  } finally {
    if (previous.DATABASE_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previous.DATABASE_URL;
    }

    if (previous.MOCK_DB === undefined) {
      delete process.env.MOCK_DB;
    } else {
      process.env.MOCK_DB = previous.MOCK_DB;
    }
  }
});

test("does not use mock data unless explicitly enabled", () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    MOCK_DB: process.env.MOCK_DB,
  };

  try {
    delete process.env.DATABASE_URL;
    delete process.env.MONGODB_URI;
    delete process.env.MOCK_DB;

    assert.equal(canUseMockData(), false);
  } finally {
    if (previous.DATABASE_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previous.DATABASE_URL;
    }

    if (previous.MONGODB_URI === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = previous.MONGODB_URI;
    }

    if (previous.MOCK_DB === undefined) {
      delete process.env.MOCK_DB;
    } else {
      process.env.MOCK_DB = previous.MOCK_DB;
    }
  }
});

test("uses MongoDB connection strings from alternative env vars", () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    MOCK_DB: process.env.MOCK_DB,
  };

  try {
    delete process.env.DATABASE_URL;
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/olgunsoy";
    delete process.env.MOCK_DB;

    assert.equal(canUseMockData(), false);
    assert.equal(isDatabaseConfigured(), true);
  } finally {
    if (previous.DATABASE_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previous.DATABASE_URL;
    }

    if (previous.MONGODB_URI === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = previous.MONGODB_URI;
    }

    if (previous.MOCK_DB === undefined) {
      delete process.env.MOCK_DB;
    } else {
      process.env.MOCK_DB = previous.MOCK_DB;
    }
  }
});
