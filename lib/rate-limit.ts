import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = {
  count: number;
  resetAt: number;
};

type LimitConfig = {
  max: number;
  windowMs: number;
};

type LimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type FixedWindowDuration = `${number} s` | `${number} m` | `${number} h` | `${number} d`;

declare global {
  var __olgunsoyRateLimitStore: Map<string, Bucket> | undefined;
  var __olgunsoyUpstashRedis: Redis | undefined;
  var __olgunsoyRateLimiters: Map<string, Ratelimit> | undefined;
}

function getStore() {
  if (!globalThis.__olgunsoyRateLimitStore) {
    globalThis.__olgunsoyRateLimitStore = new Map<string, Bucket>();
  }

  return globalThis.__olgunsoyRateLimitStore;
}

function windowToDuration(windowMs: number): FixedWindowDuration {
  if (windowMs % (60 * 1000) === 0) {
    return `${windowMs / (60 * 1000)} m`;
  }

  return `${Math.ceil(windowMs / 1000)} s`;
}

function getUpstashRedis() {
  if (globalThis.__olgunsoyUpstashRedis) {
    return globalThis.__olgunsoyUpstashRedis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[rate-limit] Upstash env vars missing; using in-memory fallback.");
      return null;
    }
    return null;
  }

  globalThis.__olgunsoyUpstashRedis = new Redis({
    url,
    token,
  });

  return globalThis.__olgunsoyUpstashRedis;
}

function getLimiter(config: LimitConfig) {
  if (!globalThis.__olgunsoyRateLimiters) {
    globalThis.__olgunsoyRateLimiters = new Map<string, Ratelimit>();
  }

  const key = `${config.max}:${config.windowMs}`;
  const existing = globalThis.__olgunsoyRateLimiters.get(key);
  if (existing) {
    return existing;
  }

  const redis = getUpstashRedis();
  if (!redis) {
    return null;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(config.max, windowToDuration(config.windowMs)),
    prefix: "olgunsoy:ratelimit",
    analytics: false,
  });

  globalThis.__olgunsoyRateLimiters.set(key, limiter);
  return limiter;
}

function checkRateLimitInMemory(key: string, config: LimitConfig): LimitResult {
  const now = Date.now();
  const store = getStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= config.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function checkRateLimit(key: string, config: LimitConfig): Promise<LimitResult> {
  const limiter = getLimiter(config);
  if (!limiter) {
    return checkRateLimitInMemory(key, config);
  }

  const result = await limiter.limit(key);
  if (result.success) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
  };
}
