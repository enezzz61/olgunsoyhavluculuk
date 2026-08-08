export const DEFAULT_PRODUCT_FALLBACK_IMAGE = "/logo.jpg";

export function getImageSource(
  src: string | null | undefined,
  fallbackSrc = DEFAULT_PRODUCT_FALLBACK_IMAGE,
  hasError = false,
) {
  if (hasError) {
    return fallbackSrc;
  }

  if (typeof src === "string" && src.trim()) {
    const normalized = src.trim();
    if (normalized.startsWith("/api/uploads/")) {
      return normalized;
    }

    if (normalized.startsWith("/uploads/")) {
      return `/api${normalized}`;
    }

    if (normalized.startsWith("uploads/")) {
      return `/api/${normalized}`;
    }

    return normalized;
  }

  return fallbackSrc;
}
