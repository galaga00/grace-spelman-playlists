import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "playlists.json");
const payload = JSON.parse(process.env.PLAYLIST_PAYLOAD || "{}");

const playlistUrl = String(payload.playlist_url || payload.url || "").trim();
const match = playlistUrl.match(/^https:\/\/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)(?:[/?#].*)?$/);

if (!match) {
  throw new Error("playlist_url must be an open.spotify.com playlist URL");
}

const id = match[1];
const normalizedUrl = `https://open.spotify.com/playlist/${id}`;
const parsedCount = Number.parseInt(payload.track_count ?? payload.trackCount, 10);

if (!Number.isInteger(parsedCount) || parsedCount < 0) {
  throw new Error("track_count must be a non-negative integer");
}

let spotifyMetadata = {};
try {
  const oembed = new URL("https://open.spotify.com/oembed");
  oembed.searchParams.set("url", normalizedUrl);
  const response = await fetch(oembed);
  if (response.ok) spotifyMetadata = await response.json();
} catch (error) {
  console.warn(`Spotify artwork lookup failed: ${error.message}`);
}

const title = String(payload.title || spotifyMetadata.title || "New playlist").trim();
const spotifyName = String(spotifyMetadata.title || payload.spotify_name || title).trim();
if (!/^Grace Spelman(?:\s[-—])/.test(spotifyName)) {
  throw new Error("Spotify playlist name must begin with the Grace Spelman identifier");
}
const displayTitle = String(
  payload.display_title || title.replace(/^Grace Spelman\s[-—]\s*/, ""),
).trim();
const publishedAt = String(payload.published_at || payload.publishedAt || new Date().toISOString().slice(0, 10));
const status = String(payload.status || "complete").trim().toLowerCase();

if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
  throw new Error("published_at must use YYYY-MM-DD");
}

if (status !== "complete") {
  throw new Error("status must be complete");
}

const playlists = JSON.parse(await readFile(dataPath, "utf8"));
const existing = playlists.find((playlist) => playlist.id === id);
const entry = {
  id,
  title: displayTitle,
  spotifyName,
  url: normalizedUrl,
  trackCount: parsedCount,
  publishedAt,
  status,
  image: spotifyMetadata.thumbnail_url || existing?.image || "",
  note: String(
    payload.note ||
      existing?.note ||
      "A complete public playlist ready to open on Spotify.",
  ).trim(),
  ...(payload.source_url || existing?.sourceUrl
    ? { sourceUrl: String(payload.source_url || existing.sourceUrl).trim() }
    : {}),
};

const updated = playlists.filter((playlist) => playlist.id !== id);
updated.push(entry);
updated.sort((a, b) => {
  if (a.status !== b.status) return a.status === "complete" ? -1 : 1;
  return (b.publishedAt || "").localeCompare(a.publishedAt || "");
});

await writeFile(dataPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`Upserted ${displayTitle} (${id})`);
