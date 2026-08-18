const grid = document.querySelector("#playlist-grid");
const errorMessage = document.querySelector("#load-error");
const playlistCount = document.querySelector("#playlist-count");
const trackCount = document.querySelector("#track-count");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function createCard(playlist) {
  const article = document.createElement("article");
  article.className = "playlist-card";

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

async function loadPlaylists() {
  try {
    const response = await fetch("playlists.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Playlist data returned ${response.status}`);

    const playlists = await response.json();
    playlists.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

    grid.replaceChildren(...playlists.map(createCard));
    playlistCount.textContent = playlists.length.toLocaleString();
    trackCount.textContent = playlists
      .reduce((sum, playlist) => sum + playlist.trackCount, 0)
      .toLocaleString();
  } catch (error) {
    console.error(error);
    grid.replaceChildren();
    errorMessage.hidden = false;
  }
}

loadPlaylists();
