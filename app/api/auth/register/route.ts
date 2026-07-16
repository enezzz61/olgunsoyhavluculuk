import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";
import { createMockUser, findMockUserByEmail } from "@/lib/mock-auth";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/auth/register");
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const role = body.role === "toptanci" ? UserRole.toptanci : UserRole.perakende;
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";

    if (!name || !email || password.length < 6) {
      return apiError(context, 400, "VALIDATION_ERROR", "Gecerli bilgiler giriniz.");
    }

    // Check rate limits with timeout
    let byIp = { allowed: true, retryAfterSeconds: 0 };
    let byUser = { allowed: true, retryAfterSeconds: 0 };
    
    try {
      const [ipLimitPromise, userLimitPromise] = [
        checkRateLimit(`register:ip:${ip}`, {
          max: 8,
          windowMs: 15 * 60 * 1000,
        }),
        checkRateLimit(`register:user:${email || "unknown"}`, {
          max: 5,
          windowMs: 15 * 60 * 1000,
        }),
      ];
      
      [byIp, byUser] = await Promise.all([ipLimitPromise, userLimitPromise]);
    } catch (error) {
      console.error("Rate limit check error:", error);
      // Continue anyway if rate limit fails
    }

    if (!byIp.allowed || !byUser.allowed) {
      const retryAfterSeconds = Math.max(byIp.retryAfterSeconds, byUser.retryAfterSeconds, 60);
      logApiEvent(context, "auth.register.rate_limited", { email });
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

    let existing;
    try {
      existing = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      if (isDbUnavailableError(error)) {
        if (canUseMockData()) {
          existing = findMockUserByEmail(email);
        } else {
          return apiError(context, 503, "DB_UNAVAILABLE", "Veritabani baglantisi hazir degil. Daha sonra tekrar deneyin.");
        }
      } else {
        console.error("Unexpected error checking user:", error);
        throw error;
      }
    }

    if (existing) {
      logApiEvent(context, "auth.register.conflict", { email });
      return apiError(context, 409, "EMAIL_ALREADY_EXISTS", "Bu e-posta ile kayitli kullanici var.");
    }

    const passwordHash = await hash(password, 10);
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role,
          isAdmin: false,
        },
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
        if (canUseMockData()) {
          const mockUser = createMockUser({
            name,
            email,
            password,
            role,
            isAdmin: false,
          });

          if (!mockUser) {
            logApiEvent(context, "auth.register.conflict", { email, source: "mock" });
            return apiError(context, 409, "EMAIL_ALREADY_EXISTS", "Bu e-posta ile kayitli kullanici var.");
          }

          await setSessionCookie({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            isAdmin: mockUser.isAdmin,
          });

          logApiEvent(context, "auth.register.succeeded", {
            userId: mockUser.id,
            role: mockUser.role,
            source: "mock",
          });

          return apiJson(context, {
            ok: true,
            message: "Kayit basarili.",
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

      console.error("Unexpected error creating user:", error);
      throw error;
    }

    await setSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
    });
    logApiEvent(context, "auth.register.succeeded", {
      userId: user.id,
      role: user.role,
    });

    return apiJson(context, { ok: true, message: "Kayit basarili.", user });
  } catch (error) {
    console.error("Register error:", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Kayit sirasinda hata olustu.");
  }
}
