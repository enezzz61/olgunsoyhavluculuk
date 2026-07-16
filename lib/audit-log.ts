import type { AuditLevel, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditLogInput = {
  requestId: string;
  route: string;
  method: string;
  ip?: string;
  userAgent?: string;
  level: AuditLevel;
  event: string;
  message?: string;
  userId?: string;
  details?: Record<string, unknown>;
};

function normalizeDetails(details: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (!details) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue;
  } catch {
    return { note: "details_serialization_failed" } as Prisma.InputJsonValue;
  }
}

export async function recordAuditLog(input: AuditLogInput) {
  try {
    await prisma.apiAuditLog.create({
      data: {
        requestId: input.requestId,
        route: input.route,
        method: input.method,
        ip: input.ip,
        userAgent: input.userAgent,
        level: input.level,
        event: input.event,
        message: input.message,
        userId: input.userId,
        details: normalizeDetails(input.details),
      },
    });
  } catch (error) {
    // Silently fail if audit log can't be recorded (e.g., transactions not supported)
    console.warn("Failed to record audit log:", error);
  }
}
