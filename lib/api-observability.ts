import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit-log";

type JsonObject = Record<string, unknown>;

export type RequestContext = {
  requestId: string;
  route: string;
  method: string;
  ip: string;
  userAgent: string;
};

export function getRequestContext(request: Request, route: string): RequestContext {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown";

  return {
    requestId,
    route,
    method: request.method,
    ip,
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

function headersWithRequestId(headersInit: HeadersInit | undefined, requestId: string) {
  const headers = new Headers(headersInit);
  headers.set("x-request-id", requestId);
  return headers;
}

export function apiJson<T>(context: RequestContext, body: T, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: headersWithRequestId(init?.headers, context.requestId),
  });
}

export function apiError(
  context: RequestContext,
  status: number,
  code: string,
  message: string,
  init?: ResponseInit,
) {
  return apiJson(
    context,
    {
      ok: false,
      code,
      message,
      requestId: context.requestId,
    },
    {
      ...init,
      status,
    },
  );
}

export function logApiEvent(context: RequestContext, event: string, details?: JsonObject) {
  const userId = typeof details?.userId === "string" ? details.userId : undefined;

  console.info(
    "[api-event]",
    JSON.stringify({
      event,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      ip: context.ip,
      userAgent: context.userAgent,
      ...(details || {}),
    }),
  );

  void recordAuditLog({
    requestId: context.requestId,
    route: context.route,
    method: context.method,
    ip: context.ip,
    userAgent: context.userAgent,
    level: "info",
    event,
    userId,
    details,
  }).catch(() => {
    // Keep API responses resilient even if audit persistence fails.
  });
}

export function logApiError(
  context: RequestContext,
  event: string,
  error: unknown,
  details?: JsonObject,
) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;
  const userId = typeof details?.userId === "string" ? details.userId : undefined;

  console.error(
    "[api-error]",
    JSON.stringify({
      event,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      ip: context.ip,
      userAgent: context.userAgent,
      message,
      stack,
      ...(details || {}),
    }),
  );

  void recordAuditLog({
    requestId: context.requestId,
    route: context.route,
    method: context.method,
    ip: context.ip,
    userAgent: context.userAgent,
    level: "error",
    event,
    message,
    userId,
    details: {
      ...(details || {}),
      stack,
    },
  }).catch(() => {
    // Keep API responses resilient even if audit persistence fails.
  });
}
