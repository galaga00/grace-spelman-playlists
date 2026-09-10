const grid = document.querySelector("#playlist-grid");
const errorMessage = document.querySelector("#load-error");
const playlistCount = document.querySelector("#playlist-count");
const completeCount = document.querySelector("#complete-count");
const reviewCount = document.querySelector("#review-count");
const trackCount = document.querySelector("#track-count");
const unavailableCount = document.querySelector("#unavailable-count");

const RETIRED_SOURCE_COUNT = 6;

const PROVENANCE = {
  substack_spotify_copy: {
    label: "Linked playlist",
    description: "Exact copy of the Spotify playlist linked from the original Substack post.",
    fidelity: "exact",
  },
  subscriber_email_playlist: {
    label: "Subscriber email",
    description: "Exact copy of the Spotify playlist delivered in the subscriber email.",
    fidelity: "exact",
  },
  email_rolling_snapshot: {
    label: "Rolling snapshot",
    description: "Dated snapshot of Grace’s rolling New Music Friday playlist when the email arrived.",
    fidelity: "exact",
  },
  google_doc_text: {
    label: "Dated text archive",
    description: "Rebuilt from Grace’s dated historical song list; every included Spotify match was verified.",
    fidelity: "exact",
  },
  google_doc_screenshots: {
    label: "Screenshot transcription",
    description: "Transcribed from Grace’s dated Spotify screenshots, then verified track by track.",
    fidelity: "exact",
  },
  linked_album_reconstruction: {
    label: "Reconstructed",
    description: "Built from the albums and individual tracks Grace explicitly shared in the post.",
    fidelity: "exact",
  },
  email_explicit_tracks: {
    label: "Email track list",
    description: "Built from an explicit artist-and-title list in the subscriber email.",
    fidelity: "exact",
  },
  late_rolling_copy: {
    label: "Late rolling copy",
    description: "Copied from the rolling playlist after publication; its historical date match still needs review.",
    fidelity: "historical-date-unverified",
  },
};

function provenanceFor(playlist) {
  const source = PROVENANCE[playlist.provenance?.method] || PROVENANCE.substack_spotify_copy;
  return {
    ...source,
    fidelity: playlist.provenance?.fidelity || source.fidelity,
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function groupBy(items, keyForItem) {
  const groups = new Map();
  for (const item of items) {
    const key = keyForItem(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function createCard(playlist) {
  const article = document.createElement("article");
  article.className = "playlist-card";

  const image = document.createElement("img");
  image.className = "playlist-art";
  image.alt = "";
  image.loading = "lazy";
  image.width = 300;
  image.height = 300;
  if (playlist.image) image.src = playlist.image;
  image.addEventListener("error", () => image.removeAttribute("src"), { once: true });

  const body = document.createElement("div");
  body.className = "playlist-body";

  const meta = document.createElement("div");
  meta.className = "playlist-meta";

  const provenance = provenanceFor(playlist);
  const status = document.createElement("span");
  status.className = `status-badge ${provenance.fidelity === "exact" ? "is-exact" : "needs-review"}`;
  status.textContent = provenance.fidelity === "exact" ? "Exact" : "Partial";

  const source = document.createElement("span");
  source.className = "source-badge";
  source.textContent = provenance.label;

  const count = document.createElement("span");
  count.textContent = playlist.sourceTrackCount
    ? `${playlist.trackCount.toLocaleString()}/${playlist.sourceTrackCount.toLocaleString()} source tracks`
    : `${playlist.trackCount.toLocaleString()} tracks`;

  const date = document.createElement("time");
  date.dateTime = playlist.publishedAt;
  date.textContent = dateFormatter.format(new Date(`${playlist.publishedAt}T12:00:00`));
  meta.append(status, source, count, date);

  const title = document.createElement("h5");
  title.className = "playlist-title";
  title.textContent = playlist.title;

  const note = document.createElement("p");
  note.className = "playlist-note";
  note.textContent = playlist.note || "A complete public playlist ready to open on Spotify.";

  const provenanceSummary = document.createElement("p");
  provenanceSummary.className = "playlist-provenance";
  provenanceSummary.textContent = provenance.description;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const spotifyLink = document.createElement("a");
  spotifyLink.className = "spotify-link";
  spotifyLink.href = playlist.url;
  spotifyLink.target = "_blank";
  spotifyLink.rel = "noopener noreferrer";
  spotifyLink.textContent = "Spotify";
  spotifyLink.setAttribute("aria-label", `Open ${playlist.title} in Spotify`);
  actions.append(spotifyLink);

  if (playlist.sourceUrl) {
    const sourceLink = document.createElement("a");
    sourceLink.className = "source-link";
    sourceLink.href = playlist.sourceUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    const isHubLink = playlist.sourceLabel === "new_music_friday_hub";
    sourceLink.textContent = isHubLink ? "NMF hub" : "Original post";
    sourceLink.setAttribute(
      "aria-label",
      isHubLink
        ? `Open Grace Spelman’s New Music Friday hub for ${playlist.title}`
        : `Open the original Grace Spelman post for ${playlist.title}`,
    );
    actions.append(sourceLink);
  }

  body.append(meta, title, note, provenanceSummary, actions);
  article.append(image, body);
  return article;
}

function createMonthGroup(monthKey, playlists) {
  const section = document.createElement("section");
  section.className = "month-group";

  const heading = document.createElement("h4");
  heading.className = "month-heading";
  heading.textContent = monthFormatter.format(new Date(`${monthKey}-15T12:00:00`));

  const cards = document.createElement("div");
  cards.className = "playlist-grid";
  cards.replaceChildren(...playlists.map(createCard));

  section.append(heading, cards);
  return section;
}

function createYearSection(year, playlists) {
  const section = document.createElement("section");
  section.className = "playlist-section";
  section.id = `year-${year}`;

  const heading = document.createElement("div");
  heading.className = "playlist-section-heading";

  const title = document.createElement("h3");
  title.textContent = year;

  const totalTracks = playlists.reduce((sum, playlist) => sum + playlist.trackCount, 0);
  const description = document.createElement("p");
  description.textContent = `${playlists.length.toLocaleString()} playlists · ${totalTracks.toLocaleString()} playable tracks`;
  heading.append(title, description);

  const byMonth = groupBy(
    playlists,
    (playlist) => playlist.publishedAt.slice(0, 7),
  );
  const months = document.createElement("div");
  months.className = "month-groups";
  months.replaceChildren(
    ...[...byMonth.entries()].map(([month, monthPlaylists]) =>
      createMonthGroup(month, monthPlaylists),
    ),
  );

  section.append(heading, months);
  return section;
}

function createYearNavigation(years) {
  const navigation = document.createElement("nav");
  navigation.className = "year-nav";
  navigation.setAttribute("aria-label", "Jump to archive year");

  const label = document.createElement("span");
  label.textContent = "Jump to";
  navigation.append(label);

  for (const year of years) {
    const link = document.createElement("a");
    link.href = `#year-${year}`;
    link.textContent = year;
    navigation.append(link);
  }

  return navigation;
}

async function loadPlaylists() {
  try {
    const response = await fetch("playlists.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Playlist data returned ${response.status}`);

    const playlists = await response.json();
    const publicPlaylists = playlists
      .filter((playlist) => ["complete", "review"].includes(playlist.status))
      .sort((left, right) => {
        const byDate = right.publishedAt.localeCompare(left.publishedAt);
        return byDate || left.title.localeCompare(right.title);
      });
    const byYear = groupBy(publicPlaylists, (playlist) => playlist.publishedAt.slice(0, 4));
    const years = [...byYear.keys()];

    grid.replaceChildren(
      createYearNavigation(years),
      ...[...byYear.entries()].map(([year, yearPlaylists]) =>
        createYearSection(year, yearPlaylists),
      ),
    );

    playlistCount.textContent = publicPlaylists.length.toLocaleString();
    completeCount.textContent = publicPlaylists
      .filter((playlist) => provenanceFor(playlist).fidelity === "exact")
      .length.toLocaleString();
    reviewCount.textContent = publicPlaylists
      .filter((playlist) => provenanceFor(playlist).fidelity !== "exact")
      .length.toLocaleString();
    trackCount.textContent = publicPlaylists
      .reduce((sum, playlist) => sum + playlist.trackCount, 0)
      .toLocaleString();
    unavailableCount.textContent = RETIRED_SOURCE_COUNT.toLocaleString();
  } catch (error) {
    console.error(error);
    grid.replaceChildren();
    errorMessage.hidden = false;
  }
}

loadPlaylists();
