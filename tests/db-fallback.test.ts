import test from "node:test";
import assert from "node:assert/strict";
import { canUseMockData } from "../lib/db-fallback";

test("uses real data in development when a database URL is configured", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    MOCK_DB: process.env.MOCK_DB,
  };

  try {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "mongodb://www.olgunsoyhavluculuk.com:27017/olgunsoy";
    delete process.env.MOCK_DB;

    assert.equal(canUseMockData(), false);
  } finally {
    if (previous.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previous.NODE_ENV;
    }

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

test("falls back to mock data when no database URL is configured", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    MOCK_DB: process.env.MOCK_DB,
  };

  try {
    process.env.NODE_ENV = "development";
    delete process.env.DATABASE_URL;
    delete process.env.MOCK_DB;

    assert.equal(canUseMockData(), true);
  } finally {
    if (previous.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previous.NODE_ENV;
    }

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
