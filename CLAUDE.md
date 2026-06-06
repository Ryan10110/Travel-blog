# Ryan's Travel Blog — Project Summary

A personal, **password-gated static travel blog**. No build step and no backend —
just HTML/CSS/vanilla JS opened in a browser (or served as static files). A
visitor enters the site password, then sees a dark-themed world map of trips and
the written entries.

Folder: `Travel Blog/` — its own standalone Git repo (split out from a shared repo
that also held the unrelated `Watchfloor/` news app). Remote:
`https://github.com/Ryan10110/Travel-blog`.

---

## Run it

It's a static site — just open `index.html` in a browser. (For the map tiles and
GitHub publishing to behave, serving over http is nicer, e.g. `python3 -m http.server`
in this folder, then open the printed localhost URL.)

First-time setup:
```bash
cp config.example.js config.js   # then fill in your real values (see below)
```

---

## How it works

- **`index.html`** — the page shell. Loads Leaflet (map), then the local scripts
  in order: `config.js`, `entries.js`, `trips.js`, `admin.js`, `main.js`.
- **`main.js`** — the front-end:
  - **Password gate**: visitors must type `SITE_PASSWORD` (from `config.js`) to
    see anything.
  - **World map** (Leaflet + CARTO dark tiles): renders markers and a journey
    line for the active trip.
  - **Gemini summary**: an AI feature that calls the Google Gemini API
    (`gemini-2.0-flash`, client-side) using `GEMINI_API_KEY`.
- **`admin.js`** — an in-page admin drawer to add/edit **entries** and **trips**,
  then **auto-publish** by committing `entries.js` / `trips.js` back to the GitHub
  repo via the GitHub Contents API. The publish **token is entered in the browser
  and stored in `localStorage` only** — never in the repo.
- **`entries.js`** — array of journal entries (`date`, `location`, lat/long,
  `notes`). **`trips.js`** — array of trips (groups of entries).
- **`styles.css`** — all styling (dark theme, hero, map, drawer).

---

## Config & secrets

`config.js` holds site config and is **gitignored** — it is NOT committed or
published. `config.example.js` is the committed template; copy it to `config.js`
and fill in:

| Constant | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini key for the AI summary (get one at aistudio.google.com). |
| `SITE_PASSWORD` | The password visitors must enter to view the site. |
| `GITHUB_TOKEN` | Leave blank here — paste the publish token in the admin panel instead (saved in the browser). |
| `GITHUB_REPO` | The `owner/repo` the admin panel publishes data files to. |

> ⚠️ **Client-side exposure:** because everything runs in the browser, anything in
> `config.js` (the Gemini key, the site password) is visible to anyone who loads a
> **publicly deployed** copy of the site. Gitignoring `config.js` keeps secrets out
> of the **source repo**, which is enough when the site is only run locally/privately.
> For true secrecy on a public deployment you'd need a small backend to hold the
> key server-side (the sibling Watchfloor app uses that pattern with a `.env`).

---

## Git / repo

- Standalone Git repo, separate from `Watchfloor/`. One clean initial commit.
- `.gitignore` excludes `.DS_Store` and `config.js`.
- Pushed to GitHub `Ryan10110/Travel-blog` (history was reset to a fresh start
  during the repo split).

---

## History (why this is its own repo now)

Originally this blog and the `Watchfloor/` news app shared a single Git repo (with
both as subfolders). On 2026-06-06 they were split into **two independent repos**
with fresh history so each can live and be published on GitHub separately. A
previously-committed Gemini key was found exposed; it was **removed from the repo**
(now gitignored), **rotated** to a new key, and the new key lives only in the local
`config.js`.
