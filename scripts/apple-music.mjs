// Grace's New Music Friday hub links to this current, changing playlist.
export const ROLLING_APPLE_MUSIC_URL = "https://music.apple.com/us/playlist/%C9%B4%E1%B4%87%E1%B4%A1-%E1%B4%8D%E1%B4%9C%EA%9C%B1%C9%AA%E1%B4%84-%EA%9C%B0%CA%80%C9%AA%E1%B4%85%E1%B4%80%CA%8F-graces-version/pl.u-4Jom843TaoYrBX";
export const isRollingAppleMusicUrl = value => normalizeAppleMusicUrl(value)?.endsWith("/pl.u-4Jom843TaoYrBX") || false;

export function normalizeAppleMusicUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.hostname !== "music.apple.com" || url.username || url.password || url.port) return null;
    if (!/^\/[a-z]{2}\/playlist\/[^/]+\/pl\.[A-Za-z0-9.-]+\/?$/.test(url.pathname)) return null;
    return `https://music.apple.com${url.pathname.replace(/\/$/, "")}`;
  } catch { return null; }
}

// Email redirects are content links. Never forward the subscriber-specific query string.
export function normalizeAppleCandidate(value) {
  const apple = normalizeAppleMusicUrl(value);
  if (apple) return apple;
  try {
    const url = new URL(String(value || ""));
    if (url.protocol === "https:" && url.hostname === "substack.com" && !url.username && !url.password && !url.port && /^\/redirect\/[a-f0-9-]{36}$/i.test(url.pathname)) {
      return `https://substack.com${url.pathname}`;
    }
  } catch {}
  return null;
}

export async function resolveAppleMusicUrl(value, request = fetch) {
  let url = normalizeAppleCandidate(value);
  if (!url) return null;
  const direct = normalizeAppleMusicUrl(url);
  if (direct) return direct;
  // Every redirect is checked before requesting it; unexpected hosts cannot be fetched.
  for (let hop = 0; hop < 4; hop++) {
    const response = await request(url, { redirect: "manual", signal: AbortSignal.timeout(10000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) return null;
    const location = response.headers.get("location");
    if (!location) return null;
    const next = new URL(location, url).href;
    const apple = normalizeAppleMusicUrl(next);
    if (apple) return apple;
    url = normalizeAppleCandidate(next);
    if (!url) return null;
  }
  return null;
}
