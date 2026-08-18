const grid = document.querySelector("#playlist-grid");
const errorMessage = document.querySelector("#load-error");
const playlistCount = document.querySelector("#playlist-count");
const completeCount = document.querySelector("#complete-count");
const trackCount = document.querySelector("#track-count");
const unavailableCount = document.querySelector("#unavailable-count");

const RETIRED_SOURCE_COUNT = 6;

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

  const status = document.createElement("span");
  status.className = "status-badge";
  status.textContent = "Complete";

  const count = document.createElement("span");
  count.textContent = `${playlist.trackCount.toLocaleString()} tracks`;

  const date = document.createElement("time");
  date.dateTime = playlist.publishedAt;
  date.textContent = dateFormatter.format(new Date(`${playlist.publishedAt}T12:00:00`));
  meta.append(status, count, date);

  const title = document.createElement("h5");
  title.className = "playlist-title";
  title.textContent = playlist.title;

  const note = document.createElement("p");
  note.className = "playlist-note";
  note.textContent = playlist.note || "A complete public playlist ready to open on Spotify.";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const spotifyLink = document.createElement("a");
  spotifyLink.className = "spotify-link";
  spotifyLink.href = playlist.url;
  spotifyLink.target = "_blank";
  spotifyLink.rel = "noopener noreferrer";
  spotifyLink.textContent = "Open in Spotify";
  spotifyLink.setAttribute("aria-label", `Open ${playlist.title} in Spotify`);
  actions.append(spotifyLink);

  if (playlist.sourceUrl) {
    const sourceLink = document.createElement("a");
    sourceLink.className = "source-link";
    sourceLink.href = playlist.sourceUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = "Newsletter";
    sourceLink.setAttribute("aria-label", `Open the newsletter for ${playlist.title}`);
    actions.append(sourceLink);
  }

  body.append(meta, title, note, actions);
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
    const complete = playlists
      .filter((playlist) => playlist.status === "complete")
      .sort((left, right) => {
        const byDate = right.publishedAt.localeCompare(left.publishedAt);
        return byDate || left.title.localeCompare(right.title);
      });
    const byYear = groupBy(complete, (playlist) => playlist.publishedAt.slice(0, 4));
    const years = [...byYear.keys()];

    grid.replaceChildren(
      createYearNavigation(years),
      ...[...byYear.entries()].map(([year, yearPlaylists]) =>
        createYearSection(year, yearPlaylists),
      ),
    );

    playlistCount.textContent = complete.length.toLocaleString();
    completeCount.textContent = complete.length.toLocaleString();
    trackCount.textContent = complete
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
