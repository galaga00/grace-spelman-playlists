# Grace Spelman Playlist Library

Public, mobile-friendly directory of 162 Spotify playlists assembled from music shared by the Grace Spelman Music Project. The collection contains 4,971 playable tracks and is grouped by publication year and month. Source labels distinguish direct playlist copies, subscriber-email captures, dated text archives, screenshot transcriptions, rolling weekly snapshots, and historical reconstructions.

- Live URL: <https://galaga00.github.io/grace-spelman-playlists/>
- Public source: <https://github.com/galaga00/grace-spelman-playlists>
- Local workspace: `/Volumes/2TB_RED/_MY_PROJECTS_/codex/Grace Spelman Playlist Directory/local`
- Private automation source: <https://github.com/galaga00/grace-spelman-spotify-automation>

The public repository contains public newsletter titles/links, Spotify names/links, canonical Apple Music playlist URLs, dates, counts, artwork URLs, and preservation labels. It does not contain newsletter bodies, Make blueprints, credentials, personal email addresses, paid song lists, or the private historical source document.

## Apple Music and TIDAL

Every existing and future card offers **Transfer to TIDAL**. Its dialog supplies the owned Spotify archive URL and instructions for [TuneMyMusic](https://www.tunemymusic.com/transfer/spotify-to-tidal). Visitors choose Spotify, load from that URL, then connect their own TIDAL account and complete the transfer. Austin needs no TIDAL account or subscription. The site does not sign visitors in, perform transfers, or retain streaming credentials. TuneMyMusic's allowance/pricing and catalog matching apply.

As of September 10, 2026, 52 cards also have verified original Apple Music links. Sixteen are explicitly marked **Apple Music · current** because Grace's New Music Friday playlist rolls forward; it does not preserve the card's historical week. All counts and Exact/Partial labels refer to the owned Spotify archive. Another 110 cards await Apple-link verification; a missing button does not mean Grace never provided one. The private automation repo holds the checkpointed backfill report.

Every record is an owned playlist whose included tracks were verified on Spotify. The validator also requires the actual Spotify name to begin with the Grace Spelman identifier and every record to declare its provenance. At present, 156 playlists are historically exact and six are visibly marked partial because one or more uncertain or unavailable source entries were omitted instead of being replaced with guesses. Six historical source links that Spotify has retired are counted on the page but are not represented by empty or broken playlist cards.

The 2026 New Music Friday repair added dated text archives and transcriptions from Spotify screenshots in the private historical document. Each card identifies which of those sources was used. Partial cards show both the verified Spotify count and the source-entry count; screenshot overlap duplicates are collapsed and explained in the card note.

## Automatic updates

After Make successfully creates and fills a playlist, one GitHub repository-dispatch request sends only:

- playlist title
- public Spotify URL
- verified track count
- publication date
- public newsletter URL
- preservation method (`subscriber_email_playlist`, `email_rolling_snapshot`, or `email_explicit_tracks`)
- optional Apple Music playlist URL or clean Substack content redirect (subscriber query parameters removed before dispatch)

The `Add a completed playlist` workflow validates the payload, looks up public Spotify artwork, deduplicates by Spotify playlist ID, updates `playlists.json`, and commits the result. That commit publishes the refreshed GitHub Pages site.

The Apple resolver accepts only HTTPS Apple playlist URLs or clean Substack redirect paths, checks every redirect host, and follows at most four hops. Album/song links are omitted. An unavailable optional Apple link does not block Spotify publication, and replaying a payload without a link retains the existing one. Verified rolling Spotify snapshots fall back to Grace's known current Apple playlist with its explicit current label.

The upsert guard rejects playlists whose live Spotify name does not begin with `Grace Spelman -` or `Grace Spelman —`, whose public newsletter URL is missing or invalid, or whose preservation method is unknown. It accepts exact or verified-partial entries only when their status and fidelity agree. This prevents future generic names such as `F15 #04`, source-ambiguous cards, and partial playlists presented as complete from entering the directory.

There is no additional polling and no additional OpenAI request. Provenance is included in the existing GitHub dispatch, so it adds no Make operation. Make uses one lightweight text-parser operation per matched Grace email and one GitHub dispatch operation per completed playlist. Standard GitHub Pages workflow usage has no known marginal charge for this public repository.

Apple extraction extends those same modules: zero additional Make credits, scheduled checks, or AI calls. TIDAL instructions run entirely in the browser. No paid transfer service or subscription is configured.

## Local verification

```bash
npm test
npm run validate
npm run serve
```

Then open <http://localhost:4173>.

Service-link QA passed at 320, 390, 820, and 1440 pixels, including dialog focus/closing, correct source URLs, clipboard success and manual-copy fallback. Ingestion tests cover optional-service failure, redirect restrictions, replay deduplication, and rolling labels. No transfer into a TIDAL account was performed.

## Kill switches

- Disable or remove the two GitHub dispatch modules in Make to stop automatic additions; the existing site remains online.
- Disable GitHub Pages in repository settings to unpublish the site.
- Make a Spotify playlist private to remove public access to that playlist; the directory card will remain until its data entry is removed.
