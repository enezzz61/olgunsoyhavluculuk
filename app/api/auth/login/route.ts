import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";
import { findMockUserByCredentials } from "@/lib/mock-auth";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/auth/login");
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const mode = body.mode === "admin" ? "admin" : "user";
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";

    // Check rate limits with error handling
    let byIp = { allowed: true, retryAfterSeconds: 0 };
    let byUser = { allowed: true, retryAfterSeconds: 0 };
    
    try {
      const [ipLimitPromise, userLimitPromise] = [
        checkRateLimit(`login:ip:${ip}`, {
          max: 20,
          windowMs: 10 * 60 * 1000,
        }),
        checkRateLimit(`login:user:${email || "unknown"}`, {
          max: 10,
          windowMs: 10 * 60 * 1000,
        }),
      ];
      
      [byIp, byUser] = await Promise.all([ipLimitPromise, userLimitPromise]);
    } catch (error) {
      console.error("Rate limit check error:", error);
      // Continue anyway if rate limit fails
    }

    if (!byIp.allowed || !byUser.allowed) {
      const retryAfterSeconds = Math.max(byIp.retryAfterSeconds, byUser.retryAfterSeconds, 60);
      logApiEvent(context, "auth.login.rate_limited", { email });
      return apiError(
        context,
        429,
        "RATE_LIMITED",
        "Cok fazla deneme yapildi. Lutfen daha sonra tekrar deneyin.",
        {
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        },
      );
    }

    let found;
    try {
      found = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      if (isDbUnavailableError(error)) {
        if (canUseMockData()) {
          const mockUser = findMockUserByCredentials(email, password);
          if (!mockUser) {
            logApiEvent(context, "auth.login.failed", { reason: "mock_user_not_found", email });
            return apiError(context, 401, "INVALID_CREDENTIALS", "E-posta veya sifre hatali.");
          }

          if (mode === "user" && mockUser.isAdmin) {
            logApiEvent(context, "auth.login.blocked", { reason: "admin_via_user_login", email, mode });
            return apiError(context, 403, "ADMIN_LOGIN_RESTRICTED", "Admin hesabi sadece admin giris sayfasindan acilabilir.");
          }

          if (mode === "admin" && !mockUser.isAdmin) {
            logApiEvent(context, "auth.login.blocked", { reason: "non_admin_via_admin_login", email, mode });
            return apiError(context, 403, "ADMIN_ONLY", "Bu sayfa sadece admin hesabina acik.");
          }

          await setSessionCookie({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            isAdmin: mockUser.isAdmin,
          });

          logApiEvent(context, "auth.login.succeeded", {
            userId: mockUser.id,
            role: mockUser.role,
            isAdmin: mockUser.isAdmin,
            source: "mock",
          });

          return apiJson(context, {
            ok: true,
            message: `Tekrar hos geldin ${mockUser.name}.`,
            user: {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              role: mockUser.role,
              isAdmin: mockUser.isAdmin,
            },
          });
        }

        return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
      }

      console.error("Unexpected error finding user:", error);
      throw error;
    }

    if (!found) {
      logApiEvent(context, "auth.login.failed", { reason: "user_not_found", email });
      return apiError(context, 401, "INVALID_CREDENTIALS", "E-posta veya sifre hatali.");
    }

    const valid = await compare(password, found.password);
    if (!valid) {
      logApiEvent(context, "auth.login.failed", { reason: "password_mismatch", email });
      return apiError(context, 401, "INVALID_CREDENTIALS", "E-posta veya sifre hatali.");
    }

    if (mode === "user" && found.isAdmin) {
      logApiEvent(context, "auth.login.blocked", { reason: "admin_via_user_login", email, mode });
      return apiError(context, 403, "ADMIN_LOGIN_RESTRICTED", "Admin hesabi sadece admin giris sayfasindan acilabilir.");
    }

    if (mode === "admin" && !found.isAdmin) {
      logApiEvent(context, "auth.login.blocked", { reason: "non_admin_via_admin_login", email, mode });
      return apiError(context, 403, "ADMIN_ONLY", "Bu sayfa sadece admin hesabina acik.");
    }

    await setSessionCookie({
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      isAdmin: found.isAdmin,
    });
    logApiEvent(context, "auth.login.succeeded", {
      userId: found.id,
      role: found.role,
      isAdmin: found.isAdmin,
    });

    return apiJson(context, {
      ok: true,
      message: `Tekrar hos geldin ${found.name}.`,
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        isAdmin: found.isAdmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Giris sirasinda hata olustu.");
  }
}
