export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fallback = "http://localhost:3000";
  const raw = fromEnv || fallback;
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
