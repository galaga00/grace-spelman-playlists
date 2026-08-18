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
const publishedAt = String(payload.published_at || payload.publishedAt || new Date().toISOString().slice(0, 10));
const status = String(payload.status || "complete").trim().toLowerCase();

if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
  throw new Error("published_at must use YYYY-MM-DD");
}

if (!["complete", "partial"].includes(status)) {
  throw new Error("status must be complete or partial");
}

const playlists = JSON.parse(await readFile(dataPath, "utf8"));
const existing = playlists.find((playlist) => playlist.id === id);
const entry = {
  id,
  title,
  url: normalizedUrl,
  trackCount: parsedCount,
  publishedAt,
  status,
  image: spotifyMetadata.thumbnail_url || existing?.image || "",
  note: String(
    payload.note ||
      existing?.note ||
      (status === "complete"
        ? "A complete playlist ready to open on Spotify."
        : "An older or partial playlist version retained for completeness."),
  ).trim(),
};

const updated = playlists.filter((playlist) => playlist.id !== id);
updated.push(entry);
updated.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

await writeFile(dataPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`Upserted ${title} (${id})`);
