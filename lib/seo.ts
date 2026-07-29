export function getSiteUrl() {
  const fromPublicEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fromAppEnv = process.env.APP_URL?.trim();
  const fromVercel = process.env.VERCEL_URL?.trim();

  const fallback = "https://www.olgunsoyhavluculuk.com";

  const raw = fromPublicEnv || fromAppEnv || (fromVercel ? `https://${fromVercel}` : "") || fallback;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}
