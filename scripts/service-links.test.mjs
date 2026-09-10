import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { normalizeAppleMusicUrl, resolveAppleMusicUrl, ROLLING_APPLE_MUSIC_URL } from "./apple-music.mjs";

const apple = "https://music.apple.com/us/playlist/example/pl.u-55D6pE6c8lo79X";
const redirect = "https://substack.com/redirect/00000000-0000-0000-0000-000000000000";
const response = target => ({status:302, headers:new Headers({location:target})});

test("canonical links remove tracking and reject non-playlists", async () => {
  assert.equal(normalizeAppleMusicUrl(`${apple}?subscriber=private#fragment`), apple);
  assert.equal(normalizeAppleMusicUrl("https://music.apple.com/us/album/song/123?i=456"), null);
  assert.equal(normalizeAppleMusicUrl("https://music.apple.com.evil.example/us/playlist/example/pl.u-123"), null);
  assert.equal(normalizeAppleMusicUrl("https://user:pass@music.apple.com/us/playlist/example/pl.u-123"), null);
  assert.equal(await resolveAppleMusicUrl(apple, () => {throw new Error("must not request a direct URL");}), apple);
});

test("only approved redirect hosts are requested, without subscriber queries", async () => {
  const requested = [];
  const result = await resolveAppleMusicUrl(`${redirect}?j=private`, async (url, options) => {
    requested.push(url);
    assert.equal(options.redirect, "manual");
    return response(`${apple}?tracking=removed`);
  });
  assert.equal(result, apple);
  assert.deepEqual(requested, [redirect]);
  let requests = 0;
  assert.equal(await resolveAppleMusicUrl(redirect, async () => {requests++; return response("http://127.0.0.1/private");}), null);
  assert.equal(requests, 1);
  assert.equal(await resolveAppleMusicUrl("http://127.0.0.1/private", () => {throw new Error("unsafe request");}), null);
  requests = 0;
  assert.equal(await resolveAppleMusicUrl(redirect, async () => {requests++; return response(redirect);}), null);
  assert.equal(requests, 4);
});

test("ingestion preserves Spotify, optional links and replay safety", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "playlist-ingestion-test-"));
  try {
    await cp(new URL(".", import.meta.url), path.join(temporary, "scripts"), {recursive:true});
    const baseline = [{id:"test123",url:"https://open.spotify.com/playlist/test123",title:"Example",appleMusicUrl:apple,note:"Keep this note",image:"",provenance:{method:"subscriber_email_playlist",fidelity:"exact"}}];
    const preload = path.join(temporary, "mock-fetch.mjs");
    await writeFile(preload, `globalThis.fetch = async input => {
      const url = new URL(input);
      if (url.hostname === "open.spotify.com" && url.pathname.startsWith("/embed/playlist/")) return new Response('<div data-testid="tracklist-row-0"></div><div data-testid="tracklist-row-1"></div>');
      if (url.hostname === "open.spotify.com" && url.pathname === "/oembed") return Response.json({title:"Grace Spelman - Example"});
      if (url.hostname === "substack.com") throw new Error("Simulated optional service outage");
      throw new Error("Unexpected request: " + url.hostname);
    };`);
    const payload = {playlist_url:baseline[0].url,title:"Grace Spelman - Example",track_count:2,source_url:"https://gracespelmanmusicproject.substack.com/p/example",published_at:"2026-09-10"};
    const run = async value => {
      await promisify(execFile)(process.execPath, ["--import",preload,path.join(temporary,"scripts/upsert-playlist.mjs")], {env:{...process.env,PLAYLIST_PAYLOAD:JSON.stringify(value)}});
      return JSON.parse(await readFile(path.join(temporary,"playlists.json"),"utf8"));
    };
    await writeFile(path.join(temporary,"playlists.json"),JSON.stringify(baseline));
    for (const apple_music_url of [undefined, "https://evil.example/", redirect]) {
      const entries = await run({...payload,apple_music_url});
      assert.equal(entries.length, 1);
      assert.equal(entries[0].appleMusicUrl, apple);
      assert.equal(entries[0].trackCount, 2);
      assert.equal(entries[0].note, "Keep this note");
    }
    await writeFile(path.join(temporary,"playlists.json"),"[]");
    const weekly = await run({...payload,source_playlist_url:"https://open.spotify.com/playlist/0W2Jrqv2ZCGhcGWvNpWCe2",provenance_method:"email_rolling_snapshot"});
    assert.equal(weekly[0].appleMusicUrl, ROLLING_APPLE_MUSIC_URL);
    assert.equal(weekly[0].appleMusicIsRolling, true);
    await writeFile(path.join(temporary,"playlists.json"),"[]");
    const newEntry = await run({...payload,apple_music_url:`${apple}?tracking=removed`});
    assert.equal(newEntry[0].appleMusicUrl, apple);
    assert.equal(newEntry[0].appleMusicIsRolling, undefined);
  } finally { await rm(temporary, {recursive:true,force:true}); }
});
