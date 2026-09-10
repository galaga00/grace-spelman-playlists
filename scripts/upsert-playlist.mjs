import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resolveAppleMusicUrl, ROLLING_APPLE_MUSIC_URL, isRollingAppleMusicUrl } from "./apple-music.mjs";

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

function playlistIdFromUrl(value) {
  const candidate = String(value || "").trim();
  return candidate.match(
    /^https:\/\/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)(?:[/?#].*)?$/,
  )?.[1];
}

async function fetchVisibleSpotifyTrackCount(playlistId) {
  const response = await fetch(`https://open.spotify.com/embed/playlist/${playlistId}`);
  if (!response.ok) {
    throw new Error(`Spotify verification returned ${response.status} for ${playlistId}`);
  }

  const html = await response.text();
  const rows = new Set(
    [...html.matchAll(/data-testid="tracklist-row-(\d+)"/g)].map((match) => match[1]),
  );
  if (rows.size === 0 && parsedCount > 0) {
    throw new Error(`Spotify verification found no playable rows for ${playlistId}`);
  }
  return rows.size;
}

const expectedVisibleCount = Math.min(parsedCount, 100);
const destinationVisibleCount = await fetchVisibleSpotifyTrackCount(id);
if (destinationVisibleCount !== expectedVisibleCount) {
  throw new Error(
    `Destination playlist verification failed: expected ${expectedVisibleCount} visible tracks, found ${destinationVisibleCount}`,
  );
}

const sourcePlaylistId = playlistIdFromUrl(payload.source_playlist_url);
if (payload.source_playlist_url && !sourcePlaylistId) {
  throw new Error("source_playlist_url must be an open.spotify.com playlist URL");
}
if (sourcePlaylistId) {
  const sourceVisibleCount = await fetchVisibleSpotifyTrackCount(sourcePlaylistId);
  if (sourceVisibleCount !== expectedVisibleCount) {
    throw new Error(
      `Source playlist verification failed: expected ${expectedVisibleCount} visible tracks, found ${sourceVisibleCount}`,
    );
  }
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
const sourceUrl = String(payload.source_url || "").trim();
const sourceLabel = String(payload.source_label || "original_post").trim();
const playlists = JSON.parse(await readFile(dataPath, "utf8"));
const existing = playlists.find((playlist) => playlist.id === id);
let appleMusicUrl = existing?.appleMusicUrl;
if (payload.apple_music_url) {
  try {
    const resolved = await resolveAppleMusicUrl(payload.apple_music_url);
    if (resolved) appleMusicUrl = resolved;
    else console.warn("Apple Music link was not a playlist; publishing the Spotify archive without a new Apple link.");
  } catch {
    console.warn("Apple Music link could not be resolved; publishing the Spotify archive without a new Apple link.");
  }
}
const provenanceMethods = new Set([
  "substack_spotify_copy",
  "subscriber_email_playlist",
  "email_rolling_snapshot",
  "google_doc_text",
  "google_doc_screenshots",
  "linked_album_reconstruction",
  "email_explicit_tracks",
  "late_rolling_copy",
]);
const provenanceMethod = String(
  payload.provenance_method ||
    existing?.provenance?.method ||
    "subscriber_email_playlist",
).trim();

if (!appleMusicUrl && provenanceMethod === "email_rolling_snapshot" && sourcePlaylistId === "0W2Jrqv2ZCGhcGWvNpWCe2") {
  appleMusicUrl = ROLLING_APPLE_MUSIC_URL;
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
  throw new Error("published_at must use YYYY-MM-DD");
}

if (!["complete", "review"].includes(status)) {
  throw new Error("status must be complete or review");
}

if (!/^https:\/\/gracespelmanmusicproject\.substack\.com\/p\//.test(sourceUrl)) {
  throw new Error("source_url must be a Grace Spelman newsletter URL");
}

if (!["original_post", "new_music_friday_hub"].includes(sourceLabel)) {
  throw new Error("source_label is not supported");
}

if (!provenanceMethods.has(provenanceMethod)) {
  throw new Error("provenance_method is not supported");
}

const entry = {
  id,
  title: displayTitle,
  spotifyName,
  url: normalizedUrl,
  trackCount: parsedCount,
  publishedAt,
  status,
  ...(payload.source_track_count
    ? { sourceTrackCount: Number.parseInt(payload.source_track_count, 10) }
    : {}),
  image: spotifyMetadata.thumbnail_url || existing?.image || "",
  sourceUrl,
  sourceLabel,
  ...(appleMusicUrl ? { appleMusicUrl } : {}),
  ...(isRollingAppleMusicUrl(appleMusicUrl) ? { appleMusicIsRolling: true } : {}),
  provenance: {
    method: provenanceMethod,
    fidelity: String(
      payload.fidelity ||
        (provenanceMethod === "late_rolling_copy"
          ? "historical-date-unverified"
          : status === "review"
            ? "verified-available"
            : "exact"),
    ),
  },
  note: String(
    payload.note ||
      existing?.note ||
      "A complete public playlist ready to open on Spotify.",
  ).trim(),
};

const removeIds = new Set(
  Array.isArray(payload.remove_ids) ? payload.remove_ids.map(String) : [],
);
const updated = playlists.filter(
  (playlist) => playlist.id !== id && !removeIds.has(playlist.id),
);
updated.push(entry);
updated.sort((a, b) =>
  (b.publishedAt || "").localeCompare(a.publishedAt || "") ||
  a.title.localeCompare(b.title),
);

await writeFile(dataPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`Upserted ${displayTitle} (${id})`);
