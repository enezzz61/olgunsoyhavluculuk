import { apiError, getRequestContext } from "@/lib/api-observability";

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/payments/webhook");
  return apiError(
    context,
    410,
    "WEBHOOK_DISABLED",
    "Bu endpoint Stripe webhook icindi. Iyzico icin /api/payments/confirm akisi kullaniliyor.",
  );
}
