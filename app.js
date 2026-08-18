const grid = document.querySelector("#playlist-grid");
const errorMessage = document.querySelector("#load-error");
const playlistCount = document.querySelector("#playlist-count");
const completeCount = document.querySelector("#complete-count");
const trackCount = document.querySelector("#track-count");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function createCard(playlist) {
  const article = document.createElement("article");
  article.className = "playlist-card";
  article.classList.toggle("playlist-card--partial", playlist.status === "partial");

  const image = document.createElement("img");
  image.className = "playlist-art";
  image.alt = "";
  image.loading = "lazy";
  image.width = 300;
  image.height = 300;
  if (playlist.image) {
    image.src = playlist.image;
  }

  const body = document.createElement("div");
  body.className = "playlist-body";

  const meta = document.createElement("div");
  meta.className = "playlist-meta";

  const status = document.createElement("span");
  status.className = `status-badge status-badge--${playlist.status}`;
  status.textContent = playlist.status === "partial" ? "Older version" : "Verified complete";
  meta.append(status);

  const count = document.createElement("span");
  count.textContent = `${playlist.trackCount.toLocaleString()} tracks`;
  meta.append(count);

  if (playlist.publishedAt) {
    const date = document.createElement("time");
    date.dateTime = playlist.publishedAt;
    date.textContent = dateFormatter.format(new Date(`${playlist.publishedAt}T12:00:00`));
    meta.append(date);
  }

  const title = document.createElement("h3");
  title.className = "playlist-title";
  title.textContent = playlist.title;

  const note = document.createElement("p");
  note.className = "playlist-note";
  note.textContent = playlist.note || "A complete playlist ready to open on Spotify.";

  const link = document.createElement("a");
  link.className = "spotify-link";
  link.href = playlist.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open in Spotify";
  link.setAttribute("aria-label", `Open ${playlist.title} in Spotify`);

  body.append(meta, title, note, link);
  article.append(image, body);
  return article;
}

function createSection(titleText, descriptionText, playlists) {
  const section = document.createElement("section");
  section.className = "playlist-section";

  const heading = document.createElement("div");
  heading.className = "playlist-section-heading";

  const title = document.createElement("h3");
  title.textContent = titleText;

  const description = document.createElement("p");
  description.textContent = descriptionText;

  const cards = document.createElement("div");
  cards.className = "playlist-grid";
  cards.replaceChildren(...playlists.map(createCard));

  heading.append(title, description);
  section.append(heading, cards);
  return section;
}

async function loadPlaylists() {
  try {
    const response = await fetch("playlists.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Playlist data returned ${response.status}`);

    const playlists = await response.json();
    playlists.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

    const complete = playlists.filter((playlist) => playlist.status === "complete");
    const partial = playlists.filter((playlist) => playlist.status === "partial");

    grid.replaceChildren(
      createSection(
        "Verified complete playlists",
        "These are the fullest versions recovered from the newsletters and linked sources.",
        complete,
      ),
      createSection(
        "Older and partial versions",
        "These nine playlists still appear in Spotify. They are kept here for completeness, but may contain only the tracks visible in an earlier email or extraction.",
        partial,
      ),
    );
    playlistCount.textContent = playlists.length.toLocaleString();
    completeCount.textContent = complete.length.toLocaleString();
    trackCount.textContent = complete
      .reduce((sum, playlist) => sum + playlist.trackCount, 0)
      .toLocaleString();
  } catch (error) {
    console.error(error);
    grid.replaceChildren();
    errorMessage.hidden = false;
  }
}

loadPlaylists();
