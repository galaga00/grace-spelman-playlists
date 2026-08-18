# Codex handoff

Read `README.md` first.

## Boundaries

- This is the public, static playlist directory only.
- The private Gmail/Make/OpenAI automation remains at `/Volumes/2TB_RED/_MY_PROJECTS_/codex/spotify` and `https://github.com/galaga00/grace-spelman-spotify-automation`.
- Never copy Make blueprints, newsletter text, email addresses, credentials, paywalled material, or obsolete/test playlist IDs into this public repository.
- Future playlist records are event-driven through GitHub `repository_dispatch`; do not add a polling job.
- Every playlist record must have `status: "complete"`, a positive track count, and a `spotifyName` beginning with the Grace Spelman identifier.
- The directory intentionally excludes obsolete partial/test playlists. Current verified inventory: 145 complete playlists and 4,327 playable tracks; six retired source links are shown only as a summary count.
- Preserve year/month grouping and both card links: the owned Spotify playlist and the public newsletter URL. Never reproduce newsletter body text.

## Production

- GitHub repo: <https://github.com/galaga00/grace-spelman-playlists>
- GitHub Pages URL: <https://galaga00.github.io/grace-spelman-playlists/>
- Production branch: `main`
- Deploy method: GitHub Actions `Publish playlist directory` on relevant pushes to `main`
- Update method: Make scenario `5959064` dispatches `playlist_created` after either successful music route

## Verification

1. Run `npm run validate`.
2. Serve the site locally and check phone, tablet, and desktop viewports.
3. Confirm all public cards open the expected Spotify playlist.
4. Confirm the rendered stats are 145 complete playlists, 4,327 tracks, and six retired links until new production newsletters change the inventory.
5. Confirm a test repository-dispatch upserts an existing record without creating a duplicate before relying on the first live newsletter.

For GitHub/source-of-truth, dirty-work, commit/push, and deployment hygiene, also use:
`/Users/austinhill/.codex/skills/project-hygiene/SKILL.md`
