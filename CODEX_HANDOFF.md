# Codex handoff

Read `README.md` first.

## Boundaries

- This is the public, static playlist directory only.
- The private Gmail/Make/OpenAI automation remains at `/Volumes/2TB_RED/_MY_PROJECTS_/codex/spotify` and `https://github.com/galaga00/grace-spelman-spotify-automation`.
- Never copy Make blueprints, newsletter text, email addresses, credentials, paywalled material, or obsolete/test playlist IDs into this public repository.
- Future playlist records are event-driven through GitHub `repository_dispatch`; do not add a polling job.
- Every playlist record must have `status: "complete"` or `"review"`, a positive track count, a supported `provenance.method`, a compatible fidelity (`exact` or `verified-available`), and a `spotifyName` beginning with the Grace Spelman identifier.
- The directory intentionally excludes obsolete partial/test playlists. Current inventory: 162 playlists and 4,971 playable tracks; 156 have historically exact provenance, six are visibly marked partial with verified/source counts, and six retired source links are shown only as a summary count.
- Preserve year/month grouping, source-method labels, owned Spotify and original-post links, optional Apple links, and every card's TIDAL transfer button. Never reproduce newsletter body text, paid track lists, or the private historical document URL.

## Service links — 2026-09-10

- All 162 cards have a visitor-initiated TIDAL transfer dialog; future cards inherit it automatically. The visitor connects their own TIDAL account in TuneMyMusic. Austin explicitly prefers this and does not want subscriptions.
- Apple backfill currently verifies 52 cards, including 16 current rolling NMF links. Another 110 Apple links remain unverified after subscribed-browser access stalled. Do not describe the Apple backfill as complete. Private report: `data/apple-link-backfill-report.json` in the automation repo.
- `appleMusicUrl` is optional and canonical. `appleMusicIsRolling: true` marks the known current NMF Apple URL. Never represent that link as a historical snapshot.
- Make module 35 extracts the last Apple Music link with the newsletter URL; modules 31/32 carry it in their existing dispatch. Subscriber query strings are removed before dispatch. The GitHub resolver follows only bounded, approved redirects and rejects album/song URLs.
- No new schedule, module, AI call, Make credit, paid service, or streaming account was added. Existing nightly behavior remains.
- `npm test` exercises ingestion and URL safety. Local browser smoke covered four viewport sizes, clipboard success/denial, and focus restoration. No TIDAL account authorization or real transfer was tested.

## Production

- GitHub repo: <https://github.com/galaga00/grace-spelman-playlists>
- GitHub Pages URL: <https://galaga00.github.io/grace-spelman-playlists/>
- Production branch: `main`
- Deploy method: GitHub Actions `Publish playlist directory` on relevant pushes to `main`
- Update method: Make scenario `5959064` dispatches `playlist_created` after either successful music route
- Link retention: Make module `35` extracts the public newsletter URL; modules `31` and `32` include their route’s provenance method; ingestion rejects missing or non-Grace `source_url` values and unknown provenance

## Verification

1. Run `npm run validate`.
2. Serve the site locally and check phone, tablet, and desktop viewports.
3. Confirm all public cards open the expected Spotify playlist.
4. Confirm the rendered stats are 162 public playlists, 156 historically exact, six verified partial, 4,971 tracks, and six retired links until a production newsletter changes the inventory.
5. Confirm a test repository-dispatch upserts an existing record without creating a duplicate before relying on the first live newsletter.

For GitHub/source-of-truth, dirty-work, commit/push, and deployment hygiene, also use:
`/Users/austinhill/.codex/skills/project-hygiene/SKILL.md`
