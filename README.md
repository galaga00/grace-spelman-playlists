# Grace Spelman Playlist Library

Public, mobile-friendly directory of 149 complete Spotify playlists assembled from music shared by the Grace Spelman Music Project. The collection contains 4,450 playable tracks and is grouped by publication year and month. Source labels distinguish direct playlist copies, subscriber-email captures, rolling weekly snapshots, and historical reconstructions.

- Live URL: <https://galaga00.github.io/grace-spelman-playlists/>
- Public source: <https://github.com/galaga00/grace-spelman-playlists>
- Local workspace: `/Volumes/2TB_RED/_MY_PROJECTS_/codex/Grace Spelman Playlist Directory/local`
- Private automation source: <https://github.com/galaga00/grace-spelman-spotify-automation>

The public repository contains only public newsletter titles/links, Spotify names/links, dates, counts, artwork URLs, and a preservation-method label. It does not contain newsletter bodies, Make blueprints, credentials, personal email addresses, paid song lists, or the private historical source document.

Every record is a complete owned playlist. The validator also requires the actual Spotify name to begin with the Grace Spelman identifier and every record to declare its provenance. At present, 148 are historically exact; the May 8, 2026 New Music Friday card is explicitly marked for review because it was copied from the rolling playlist in August rather than reconstructed from the dated May list. Six historical source links that Spotify has retired are counted on the page but are not represented by empty or broken playlist cards.

## Automatic updates

After Make successfully creates and fills a playlist, one GitHub repository-dispatch request sends only:

- playlist title
- public Spotify URL
- verified track count
- publication date
- public newsletter URL
- preservation method (`subscriber_email_playlist`, `email_rolling_snapshot`, or `email_explicit_tracks`)

The `Add a completed playlist` workflow validates the payload, looks up public Spotify artwork, deduplicates by Spotify playlist ID, updates `playlists.json`, and commits the result. That commit publishes the refreshed GitHub Pages site.

The upsert guard rejects playlists whose live Spotify name does not begin with `Grace Spelman -` or `Grace Spelman —`, whose public newsletter URL is missing or invalid, or whose preservation method is unknown. This prevents future generic names such as `F15 #04`, incomplete directory cards, and source-ambiguous entries from entering the directory.

There is no additional polling and no additional OpenAI request. Provenance is included in the existing GitHub dispatch, so it adds no Make operation. Make uses one lightweight text-parser operation per matched Grace email and one GitHub dispatch operation per completed playlist. Standard GitHub Pages workflow usage has no known marginal charge for this public repository.

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
