export interface CacheConfig {
  maxAgeSeconds: number;
  staleWhileRevalidateSeconds?: number;
  public?: boolean;
}

export function getStaticAssetCacheHeader(config?: CacheConfig): string {
  const maxAge = config?.maxAgeSeconds !== undefined ? config.maxAgeSeconds : 31536000;
  const isPublic = config?.public !== false ? "public" : "private";
  const swr = config?.staleWhileRevalidateSeconds ? `, stale-while-revalidate=${config.staleWhileRevalidateSeconds}` : "";
  return `${isPublic}, max-age=${maxAge}, immutable${swr}`;
}

export function getApiNoCacheHeader(): string {
  return "no-store, no-cache, must-revalidate, proxy-revalidate";
}
