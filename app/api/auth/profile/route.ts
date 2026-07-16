import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser, setSessionCookie } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { canUseMockData, isDbUnavailableError } from "@/lib/db-fallback";
import { findMockUserById, updateMockUser } from "@/lib/mock-auth";

export async function PATCH(request: Request) {
  const context = getRequestContext(request, "/api/auth/profile");
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return apiError(context, 401, "UNAUTHORIZED", "Yetkisiz.");
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const currentPassword = String(body.currentPassword || "").trim();
  const newPassword = String(body.newPassword || "").trim();

  if (!name && !newPassword) {
    return apiError(context, 400, "VALIDATION_ERROR", "Guncellenecek en az bir alan gerekli.");
  }

  let userRecord;
  try {
    userRecord = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        password: true,
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error) && canUseMockData()) {
      const mockUser = findMockUserById(sessionUser.id);
      if (!mockUser) {
        return apiError(context, 404, "USER_NOT_FOUND", "Kullanici bulunamadi.");
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          return apiError(context, 400, "VALIDATION_ERROR", "Yeni sifre en az 6 karakter olmali.");
        }

        if (!currentPassword) {
          return apiError(context, 400, "VALIDATION_ERROR", "Sifre degisimi icin mevcut sifre gerekli.");
        }

        if (mockUser.password !== currentPassword) {
          return apiError(context, 401, "INVALID_CREDENTIALS", "Mevcut sifre hatali.");
        }
      }

      const updatedMock = updateMockUser(mockUser.id, {
        name: name || undefined,
        password: newPassword || undefined,
      });

      if (!updatedMock) {
        return apiError(context, 404, "USER_NOT_FOUND", "Kullanici bulunamadi.");
      }

      await setSessionCookie({
        id: updatedMock.id,
        name: updatedMock.name,
        email: updatedMock.email,
        role: updatedMock.role,
        isAdmin: updatedMock.isAdmin,
      });

      logApiEvent(context, "auth.profile.updated", {
        userId: updatedMock.id,
        changedPassword: Boolean(newPassword),
        changedName: Boolean(name),
        source: "mock",
      });

      return apiJson(context, {
        ok: true,
        message: "Profil bilgileri guncellendi.",
        user: {
          id: updatedMock.id,
          name: updatedMock.name,
          email: updatedMock.email,
          role: updatedMock.role,
          isAdmin: updatedMock.isAdmin,
        },
      });
    }

    throw error;
  }

  if (!userRecord) {
    return apiError(context, 404, "USER_NOT_FOUND", "Kullanici bulunamadi.");
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return apiError(context, 400, "VALIDATION_ERROR", "Yeni sifre en az 6 karakter olmali.");
    }

    if (!currentPassword) {
      return apiError(context, 400, "VALIDATION_ERROR", "Sifre degisimi icin mevcut sifre gerekli.");
    }

    const valid = await compare(currentPassword, userRecord.password);
    if (!valid) {
      return apiError(context, 401, "INVALID_CREDENTIALS", "Mevcut sifre hatali.");
    }
  }

  const data: {
    name?: string;
    password?: string;
  } = {};

  if (name) {
    data.name = name;
  }

  if (newPassword) {
    data.password = await hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userRecord.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isAdmin: true,
    },
  });

  logApiEvent(context, "auth.profile.updated", {
    userId: updated.id,
    changedPassword: Boolean(newPassword),
    changedName: Boolean(name),
  });

  return apiJson(context, {
    ok: true,
    message: "Profil bilgileri guncellendi.",
    user: updated,
  });
}
