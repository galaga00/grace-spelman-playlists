import { readFile } from "node:fs/promises";

const playlists = JSON.parse(await readFile(new URL("../playlists.json", import.meta.url), "utf8"));
const seen = new Set();
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

if (!Array.isArray(playlists) || playlists.length === 0) {
  throw new Error("playlists.json must contain at least one playlist");
}

for (const playlist of playlists) {
  if (!/^[A-Za-z0-9]+$/.test(playlist.id)) throw new Error(`Invalid playlist ID: ${playlist.id}`);
  if (seen.has(playlist.id)) throw new Error(`Duplicate playlist ID: ${playlist.id}`);
  seen.add(playlist.id);

  if (playlist.url !== `https://open.spotify.com/playlist/${playlist.id}`) {
    throw new Error(`URL does not match playlist ID: ${playlist.id}`);
  }
  if (!playlist.title || !Number.isInteger(playlist.trackCount) || playlist.trackCount < 1) {
    throw new Error(`Invalid playlist metadata: ${playlist.id}`);
  }
  if (!["complete", "review"].includes(playlist.status)) {
    throw new Error(`Invalid status: ${playlist.id}`);
  }
  if (!/^Grace Spelman(?:\s[-—])/.test(playlist.spotifyName || "")) {
    throw new Error(`Spotify name is missing the Grace Spelman identifier: ${playlist.id}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(playlist.publishedAt)) {
    throw new Error(`Invalid publishedAt: ${playlist.id}`);
  }
  if (!/^https:\/\/gracespelmanmusicproject\.substack\.com\/p\//.test(playlist.sourceUrl || "")) {
    throw new Error(`Invalid newsletter URL: ${playlist.id}`);
  }
  if (!["original_post", "new_music_friday_hub"].includes(playlist.sourceLabel)) {
    throw new Error(`Invalid or missing source label: ${playlist.id}`);
  }
  if (!provenanceMethods.has(playlist.provenance?.method)) {
    throw new Error(`Invalid or missing provenance method: ${playlist.id}`);
  }
  const validFidelities = new Set(["exact", "verified-available", "historical-date-unverified"]);
  if (!validFidelities.has(playlist.provenance.fidelity)) {
    throw new Error(`Invalid provenance fidelity: ${playlist.id}`);
  }
  if (playlist.status === "review" && playlist.provenance.fidelity === "exact") {
    throw new Error(`Review playlist cannot claim exact fidelity: ${playlist.id}`);
  }
  if (playlist.sourceTrackCount !== undefined &&
      (!Number.isInteger(playlist.sourceTrackCount) || playlist.sourceTrackCount <= playlist.trackCount)) {
    throw new Error(`Invalid sourceTrackCount: ${playlist.id}`);
  }
}

const publicPlaylists = playlists.filter((playlist) => ["complete", "review"].includes(playlist.status));
const historicallyExact = publicPlaylists.filter(
  (playlist) => playlist.provenance.fidelity === "exact",
);
console.log(
  `Validated ${playlists.length} public playlists: ${historicallyExact.length} exact, ${publicPlaylists.length - historicallyExact.length} verified partial, with ${publicPlaylists.reduce((sum, playlist) => sum + playlist.trackCount, 0)} playable tracks.`,
);
