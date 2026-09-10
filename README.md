# Grace Spelman Playlist Library

Public, mobile-friendly directory of 149 complete Spotify playlists assembled from music shared by the Grace Spelman Music Project. The collection contains 4,450 playable tracks and is grouped by newsletter year and month.

- Live URL: <https://galaga00.github.io/grace-spelman-playlists/>
- Public source: <https://github.com/galaga00/grace-spelman-playlists>
- Local workspace: `/Volumes/2TB_RED/_MY_PROJECTS_/codex/Grace Spelman Playlist Directory/local`
- Private automation source: <https://github.com/galaga00/grace-spelman-spotify-automation>

The public repository contains only public newsletter titles/links, Spotify names/links, dates, counts, and artwork URLs. It does not contain newsletter bodies, Make blueprints, credentials, personal email addresses, or paid-newsletter source material.

Every record is a verified complete owned playlist. The validator also requires the actual Spotify name to begin with the Grace Spelman identifier. Six historical source links that Spotify has retired are counted on the page but are not represented by empty or broken playlist cards.

## Automatic updates

After Make successfully creates and fills a playlist, one GitHub repository-dispatch request sends only:

- playlist title
- public Spotify URL
- verified track count
- publication date
- public newsletter URL

The `Add a completed playlist` workflow validates the payload, looks up public Spotify artwork, deduplicates by Spotify playlist ID, updates `playlists.json`, and commits the result. That commit publishes the refreshed GitHub Pages site.

The upsert guard rejects playlists whose live Spotify name does not begin with `Grace Spelman -` or `Grace Spelman —`, or whose public newsletter URL is missing or invalid. This prevents future generic names such as `F15 #04` and incomplete directory cards from entering the directory.

There is no additional polling and no additional OpenAI request. Make uses one lightweight text-parser operation per matched Grace email and one GitHub dispatch operation per completed playlist. Standard GitHub Pages workflow usage has no known marginal charge for this public repository.

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
