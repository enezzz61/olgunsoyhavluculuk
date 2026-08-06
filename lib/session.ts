import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";
import { findMockUserById } from "@/lib/mock-auth";

const SESSION_COOKIE = "olgunsoy_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
};

type SessionTokenPayload = {
  user: SessionUser;
  expiresAt: number;
};

function getSessionSecret() {
  const sessionSecret = process.env.SESSION_SECRET?.trim() || process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (sessionSecret) {
    return sessionSecret;
  }

  if (process.env.NODE_ENV === "production") {
    const fallbackSecret = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || process.env.VERCEL_URL?.trim() || "olgunsoy-fallback-session-secret";
    console.warn("[session] SESSION_SECRET missing; using a deployment fallback secret.");
    return fallbackSecret;
  }

  return "dev-session-secret-change-me";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function createSessionToken(user: SessionUser) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = JSON.stringify({ user, expiresAt } satisfies SessionTokenPayload);
  const encodedPayload = toBase64Url(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseSessionToken(token: string): SessionUser | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const provided = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  const payload = fromBase64Url(encodedPayload);
  try {
    const parsed = JSON.parse(payload) as SessionTokenPayload;
    if (!parsed.user?.id || !parsed.user?.email || !parsed.user?.name) {
      return null;
    }

    if (!Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed.user;
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
      id: userId,
      name: userId,
      email: "",
      role: "perakende",
      isAdmin: isAdminRaw === "1",
    };
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const parsed = parseSessionToken(token);
  if (!parsed) {
    return null;
  }

  if (canUseMockData()) {
    const mockUser = findMockUserById(parsed.id);
    if (mockUser) {
      return {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        isAdmin: mockUser.isAdmin,
      };
    }
  }

  try {
    return await prisma.user.findUnique({
      where: { id: parsed.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return parsed;
    }

    throw error;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin() {
  const user = await getSessionUser();
  return Boolean(user?.isAdmin);
}
