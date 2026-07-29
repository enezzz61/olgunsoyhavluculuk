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
    return src;
  }

  return fallbackSrc;
}
