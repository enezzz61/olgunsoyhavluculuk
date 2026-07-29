import type { OrderStatus } from "@/lib/order-status";

export type ShippingEvent = {
  code: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
};

export type SupportedCarrier = "Yurtici Kargo" | "Aras Kargo" | "MNG Kargo";

export type CarrierTimelineInput = {
  carrier?: string | null;
  trackingCode: string;
  status: OrderStatus;
  createdAt: Date;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
};

export type CarrierTimelineResult = {
  carrier: SupportedCarrier;
  events: ShippingEvent[];
  source: "external" | "mock";
};

export function normalizeCarrier(value?: string | null): SupportedCarrier {
  const normalized = (value || "").toLowerCase();

  if (normalized.includes("aras")) {
    return "Aras Kargo";
  }

  if (normalized.includes("mng")) {
    return "MNG Kargo";
  }

  return "Yurtici Kargo";
}

function stageCount(status: OrderStatus) {
  if (status === "odeme_alindi") {
    return 1;
  }
  if (status === "hazirlaniyor") {
    return 2;
  }
  if (status === "kargoda") {
    return 4;
  }
  if (status === "teslim_edildi") {
    return 5;
  }
  return 1;
}

export function buildMockCarrierEvents(input: {
  carrier?: string | null;
  trackingCode: string;
  status: OrderStatus;
  createdAt: Date;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}) {
  const carrier = normalizeCarrier(input.carrier);
  const base = input.createdAt;
  const shippedAt = input.shippedAt || new Date(base.getTime() + 18 * 60 * 60 * 1000);
  const deliveredAt =
    input.deliveredAt || new Date(shippedAt.getTime() + 30 * 60 * 60 * 1000);

  const full: ShippingEvent[] = [
    {
      code: "payment_verified",
      title: "Odeme Dogrulandi",
      description: `${input.trackingCode} kaydi olusturuldu.`,
      location: "Istanbul Dagitim Merkezi",
      timestamp: base.toISOString(),
    },
    {
      code: "package_prepared",
      title: "Paket Hazirlandi",
      description: `Paket ${carrier} teslim hattina alindi.`,
      location: "Istanbul Depo",
      timestamp: new Date(base.getTime() + 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      code: "accepted_by_carrier",
      title: "Kargo Firmasi Teslim Aldi",
      description: `${carrier} transfer sureci baslatildi.`,
      location: "Istanbul Transfer",
      timestamp: shippedAt.toISOString(),
    },
    {
      code: "in_transit",
      title: "Transfer Merkezinde",
      description: "Gonderi hedef subeye yonlendiriliyor.",
      location: "Ankara Transfer Merkezi",
      timestamp: new Date(shippedAt.getTime() + 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      code: "delivered",
      title: "Teslim Edildi",
      description: "Gonderi aliciya teslim edildi.",
      location: "Teslimat Subesi",
      timestamp: deliveredAt.toISOString(),
    },
  ];

  if (input.status === "iptal") {
    return [
      {
        code: "cancelled",
        title: "Siparis Iptal",
        description: "Siparis gonderime cikmadan iptal edildi.",
        location: "Satis Merkezi",
        timestamp: base.toISOString(),
      },
    ];
  }

  return {
    carrier,
    events: full.slice(0, stageCount(input.status)),
  };
}

function toMockTimeline(input: CarrierTimelineInput): CarrierTimelineResult {
  const timeline = buildMockCarrierEvents(input);
  const carrier = "carrier" in timeline ? timeline.carrier : normalizeCarrier(input.carrier);
  const events = "events" in timeline ? timeline.events : timeline;

  return {
    carrier,
    events,
    source: "mock",
  };
}

function normalizeString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function toIsoTimestamp(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

function mapExternalEvents(payload: unknown): ShippingEvent[] {
  const rawPayload = payload as
    | {
        events?: Array<Record<string, unknown>>;
        trackingEvents?: Array<Record<string, unknown>>;
        trackingHistory?: Array<Record<string, unknown>>;
        statuses?: Array<Record<string, unknown>>;
      }
    | Array<Record<string, unknown>>
    | null
    | undefined;

  const rawEvents = Array.isArray(rawPayload)
    ? rawPayload
    : Array.isArray(rawPayload?.events)
      ? rawPayload.events
      : Array.isArray(rawPayload?.trackingEvents)
        ? rawPayload.trackingEvents
        : Array.isArray(rawPayload?.trackingHistory)
          ? rawPayload.trackingHistory
          : Array.isArray(rawPayload?.statuses)
            ? rawPayload.statuses
            : [];

  return rawEvents.map((event, index) => ({
    code: normalizeString(event.code ?? event.status ?? event.statusCode ?? event.stateCode ?? event.state ?? `event_${index + 1}`),
    title: normalizeString(event.title ?? event.label ?? event.statusText ?? event.statusDescription ?? event.description ?? event.message ?? event.state ?? "Durum Guncellemesi"),
    description: normalizeString(event.description ?? event.detail ?? event.message ?? event.statusDescription ?? event.summary ?? event.note ?? event.information ?? "Durum guncellendi."),
    location: normalizeString(event.location ?? event.branch ?? event.city ?? event.destination ?? event.address ?? "Bilinmiyor"),
    timestamp: toIsoTimestamp(event.timestamp ?? event.date ?? event.createdAt ?? event.time ?? event.eventDate ?? event.eventTime),
  }));
}

function normalizeProvider(value?: string | null) {
  const normalized = (value || "").toLowerCase();

  if (normalized.includes("aras")) {
    return "aras";
  }

  if (normalized.includes("mng")) {
    return "mng";
  }

  if (normalized.includes("yurti") || normalized.includes("yurtici")) {
    return "yurticikargo";
  }

  return "generic";
}

function buildTrackingEndpoint(input: CarrierTimelineInput) {
  const baseUrl = process.env.CARGO_API_BASE_URL?.trim();
  if (!baseUrl) {
    return null;
  }

  const normalizedCarrier = normalizeCarrier(input.carrier);
  const provider = normalizeProvider(process.env.CARGO_PROVIDER || normalizedCarrier);
  const trackingCode = encodeURIComponent(input.trackingCode);
  const customPath = process.env.CARGO_API_TRACKING_PATH?.trim();

  if (customPath) {
    return customPath
      .replace("{trackingCode}", input.trackingCode)
      .replace("{carrier}", normalizedCarrier)
      .replace("{provider}", provider)
      .replace("{encodedTrackingCode}", trackingCode);
  }

  const base = baseUrl.replace(/\/$/, "");
  return `${base}/tracking/${trackingCode}?carrier=${encodeURIComponent(normalizedCarrier)}`;
}

function extractExternalTimeline(payload: unknown) {
  const rawPayload = payload as Record<string, unknown> | null | undefined;
  const dataPayload = (rawPayload?.data as Record<string, unknown> | undefined) || undefined;
  const resultPayload = (rawPayload?.result as Record<string, unknown> | undefined) || undefined;
  const responsePayload = (rawPayload?.response as Record<string, unknown> | undefined) || undefined;

  const carrier = normalizeString(
    rawPayload?.carrier ??
      rawPayload?.courier ??
      rawPayload?.provider ??
      dataPayload?.carrier ??
      dataPayload?.courier ??
      resultPayload?.carrier ??
      responsePayload?.carrier,
  );

  const eventsPayload =
    (rawPayload?.events as Array<Record<string, unknown>> | undefined) ??
    (rawPayload?.trackingEvents as Array<Record<string, unknown>> | undefined) ??
    (rawPayload?.trackingHistory as Array<Record<string, unknown>> | undefined) ??
    (rawPayload?.statuses as Array<Record<string, unknown>> | undefined) ??
    (dataPayload?.events as Array<Record<string, unknown>> | undefined) ??
    (dataPayload?.trackingEvents as Array<Record<string, unknown>> | undefined) ??
    (dataPayload?.trackingHistory as Array<Record<string, unknown>> | undefined) ??
    (dataPayload?.statuses as Array<Record<string, unknown>> | undefined) ??
    (resultPayload?.events as Array<Record<string, unknown>> | undefined) ??
    (resultPayload?.trackingEvents as Array<Record<string, unknown>> | undefined) ??
    (resultPayload?.trackingHistory as Array<Record<string, unknown>> | undefined) ??
    (resultPayload?.statuses as Array<Record<string, unknown>> | undefined) ??
    (responsePayload?.events as Array<Record<string, unknown>> | undefined) ??
    (responsePayload?.trackingEvents as Array<Record<string, unknown>> | undefined) ??
    (responsePayload?.trackingHistory as Array<Record<string, unknown>> | undefined) ??
    (responsePayload?.statuses as Array<Record<string, unknown>> | undefined) ??
    (rawPayload as Array<Record<string, unknown>> | undefined) ??
    (dataPayload as Array<Record<string, unknown>> | undefined) ??
    (resultPayload as Array<Record<string, unknown>> | undefined) ??
    (responsePayload as Array<Record<string, unknown>> | undefined);

  return {
    carrier,
    events: mapExternalEvents(eventsPayload),
  };
}

function shouldUseMockShipping() {
  const mockFlag = process.env.MOCK_SHIPPING;
  if (mockFlag === "true") {
    return true;
  }

  if (mockFlag === "false") {
    return false;
  }

  return !process.env.CARGO_API_BASE_URL;
}

export async function resolveCarrierTimeline(input: CarrierTimelineInput): Promise<CarrierTimelineResult> {
  if (shouldUseMockShipping()) {
    return toMockTimeline(input);
  }

  const baseUrl = process.env.CARGO_API_BASE_URL?.trim();
  if (!baseUrl) {
    return toMockTimeline(input);
  }

  const timeoutRaw = Number(process.env.CARGO_API_TIMEOUT_MS || "5000");
  const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 5000;
  const normalizedCarrier = normalizeCarrier(input.carrier);
  const token = process.env.CARGO_API_KEY?.trim() || process.env.CARGO_API_TOKEN?.trim();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (process.env.CARGO_API_CLIENT_ID?.trim()) {
    headers["x-client-id"] = process.env.CARGO_API_CLIENT_ID.trim();
  }

  const endpoint = buildTrackingEndpoint(input);
  if (!endpoint) {
    return toMockTimeline(input);
  }

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Carrier API failed with status ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const timeline = extractExternalTimeline(payload);
    const events = timeline.events;

    if (!events.length) {
      throw new Error("Carrier API returned empty events");
    }

    return {
      carrier: normalizeCarrier(timeline.carrier || normalizedCarrier),
      events,
      source: "external",
    };
  } catch (error) {
    console.warn("[shipping] Carrier API failed, using mock timeline", {
      trackingCode: input.trackingCode,
      carrier: normalizedCarrier,
      message: error instanceof Error ? error.message : String(error),
    });

    return toMockTimeline(input);
  }
}
