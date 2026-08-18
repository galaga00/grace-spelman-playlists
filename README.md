# Grace Spelman Playlist Library

Public, mobile-friendly directory of all 19 Spotify playlists assembled from music shared by the Grace Spelman Music Project: 10 verified complete versions plus nine older or partial versions.

- Live URL: <https://galaga00.github.io/grace-spelman-playlists/>
- Public source: <https://github.com/galaga00/grace-spelman-playlists>
- Local workspace: `/Volumes/2TB_RED/_MY_PROJECTS_/codex/Grace Spelman Playlist Directory/local`
- Private automation source: <https://github.com/galaga00/grace-spelman-spotify-automation>

The public repository contains only playlist titles, Spotify links, dates, counts, and artwork URLs. It does not contain newsletter bodies, Make blueprints, credentials, personal email addresses, or paid-newsletter source material.

Each record has a `status` of `complete` or `partial`. The public page separates those groups and counts tracks only from verified complete playlists, avoiding inflated totals from duplicate or incomplete versions.

## Automatic updates

After Make successfully creates and fills a playlist, one GitHub repository-dispatch request sends only:

- playlist title
- public Spotify URL
- verified track count
- publication date

The `Add a completed playlist` workflow validates the payload, looks up public Spotify artwork, deduplicates by Spotify playlist ID, updates `playlists.json`, and commits the result. That commit publishes the refreshed GitHub Pages site.

There is no additional polling and no additional OpenAI request. The Make addition is expected to use one non-AI credit per completed playlist. Standard GitHub Pages workflow usage has no known marginal charge for this public repository.

## Local verification

```bash
npm run validate
npm run serve
```

Then open <http://localhost:4173>.

## Kill switches

- Disable or remove the two GitHub dispatch modules in Make to stop automatic additions; the existing site remains online.
- Disable GitHub Pages in repository settings to unpublish the site.
- Make a Spotify playlist private to remove public access to that playlist; the directory card will remain until its data entry is removed.
