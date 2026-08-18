import { readFile } from "node:fs/promises";

const playlists = JSON.parse(await readFile(new URL("../playlists.json", import.meta.url), "utf8"));
const seen = new Set();

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
  if (!playlist.title || !Number.isInteger(playlist.trackCount) || playlist.trackCount < 0) {
    throw new Error(`Invalid playlist metadata: ${playlist.id}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(playlist.publishedAt)) {
    throw new Error(`Invalid publishedAt: ${playlist.id}`);
  }
}

console.log(`Validated ${playlists.length} playlists and ${playlists.reduce((sum, playlist) => sum + playlist.trackCount, 0)} tracks.`);
