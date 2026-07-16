import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "olgunsoy_session";

function getSessionSecret() {
  const sessionSecret = process.env.SESSION_SECRET?.trim();
  if (sessionSecret) {
    return sessionSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }

  return "dev-session-secret-change-me";
}

function toBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return padded;
}

function fromBase64Url(value: string) {
  const decoded = atob(toBase64(value));
  return decoded;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signPayload(payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

async function parseSessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signPayload(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = fromBase64Url(encodedPayload);
  try {
    const parsed = JSON.parse(payload) as {
      user?: { id?: string; isAdmin?: boolean };
      expiresAt?: number;
    };

    if (!parsed.user?.id || !Number.isFinite(parsed.expiresAt ?? NaN)) {
      return null;
    }

    if ((parsed.expiresAt ?? 0) <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: parsed.user.id,
      isAdmin: typeof parsed.user.isAdmin === "boolean" ? parsed.user.isAdmin : null,
    };
  } catch {
    const [userId, expiresAtRaw, isAdminRaw] = payload.split(".");
    const expiresAt = Number(expiresAtRaw);

    if (!userId || !Number.isFinite(expiresAt)) {
      return null;
    }

    if (expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId,
      isAdmin: typeof isAdminRaw === "string" ? isAdminRaw === "1" : null,
    };
  }
}

async function isAdminFromCurrentSession(request: NextRequest) {
  const missing = { ok: false as const, reason: "missing" as const };
  const invalid = { ok: false as const, reason: "invalid" as const };

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return missing;
  }

  const parsed = await parseSessionToken(token);
  if (!parsed) {
    return invalid;
  }

  return {
    ok: true as const,
    userId: parsed.userId,
    isAdmin: parsed.isAdmin,
  };
}

type SessionApiUser = {
  id: string;
  isAdmin: boolean;
};

async function readAdminFromSessionApi(request: NextRequest, expectedUserId: string) {
  const cookie = request.headers.get("cookie") || "";
  const url = new URL("/api/session", request.url);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      cookie,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { user?: SessionApiUser | null };
  if (!data.user || data.user.id !== expectedUserId) {
    return false;
  }

  return Boolean(data.user.isAdmin);
}

function unauthorizedApiResponse() {
  return NextResponse.json({ ok: false, message: "Yetkisiz." }, { status: 401 });
}

function forbiddenApiResponse() {
  return NextResponse.json({ ok: false, message: "Admin yetkisi gerekli." }, { status: 403 });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isAdminLoginPage = pathname === "/admin/giris";
  const isAdminPage = (pathname === "/admin" || pathname.startsWith("/admin/")) && !isAdminLoginPage;

  if (!isAdminApi && !isAdminPage && !isAdminLoginPage) {
    return NextResponse.next();
  }

  if (isAdminLoginPage) {
    return NextResponse.next();
  }

  const session = await isAdminFromCurrentSession(request);
  if (!session.ok) {
    if (isAdminApi) {
      return unauthorizedApiResponse();
    }

    const loginUrl = new URL("/admin/giris", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let isAdmin = session.isAdmin;
  if (isAdmin === null) {
    isAdmin = await readAdminFromSessionApi(request, session.userId);
  }

  if (!isAdmin) {
    if (isAdminApi) {
      return forbiddenApiResponse();
    }

    const accountUrl = new URL("/hesap", request.url);
    accountUrl.searchParams.set("forbidden", "1");
    return NextResponse.redirect(accountUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
