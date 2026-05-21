// ── Password gate ─────────────────────────────────────────
const gate     = document.getElementById("gate");
const gateForm = document.getElementById("gate-form");
const gatePwd  = document.getElementById("gate-password");
const gateErr  = document.getElementById("gate-error");

if (gate && gate.style.display !== "none") {
  gateForm.addEventListener("submit", e => {
    e.preventDefault();
    if (gatePwd.value === SITE_PASSWORD) {
      sessionStorage.setItem("site_auth", "1");
      gate.classList.add("unlocking");
      gate.addEventListener("transitionend", () => gate.remove(), { once: true });
    } else {
      gatePwd.value = "";
      gateErr.classList.remove("hidden");
      gateErr.style.animation = "none";
      gateErr.offsetHeight;
      gateErr.style.animation = "";
    }
  });
}

// ── Hero scroll fade ──────────────────────────────────────
const hero = document.querySelector(".hero");
const heroHeight = () => hero.offsetHeight;

window.addEventListener("scroll", () => {
  const progress = Math.min(window.scrollY / (heroHeight() * 0.25), 1);
  hero.style.opacity = 1 - progress;
}, { passive: true });

// ── World map ─────────────────────────────────────────────
const map = L.map("world-map", {
  center: [20, 0],
  zoom: 2,
  worldCopyJump: true,
  scrollWheelZoom: false,
});

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
}).addTo(map);

// ── Map markers & journey line ────────────────────────────
let markerLayer = null;
let journeyLine = null;
let arrowLayer  = null;

// Which trip folder is currently open (null = all pins shown)
window.openTripId = null;

function getBearing(from, to) {
  const φ1 = from[0] * Math.PI / 180;
  const φ2 = to[0]   * Math.PI / 180;
  const Δλ = (to[1] - from[1]) * Math.PI / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// The map shows exactly one trip: an open folder, else the current trip, else nothing.
function activeMapTripId() {
  if (window.openTripId != null) return window.openTripId;
  const current = (window.blogTrips ?? []).find(t => t.isCurrent);
  return current ? current._id : null;
}

function updateMapCaption() {
  const cap = document.getElementById("map-caption");
  if (!cap) return;
  const trips = window.blogTrips ?? [];

  if (window.openTripId != null) {
    const t = trips.find(tr => tr._id === window.openTripId);
    cap.textContent = t ? `Viewing past trip: ${t.name}` : "";
    cap.className = "map-caption viewing";
    return;
  }
  const current = trips.find(t => t.isCurrent);
  if (current) {
    cap.textContent = `Currently traveling: ${current.name}`;
    cap.className = "map-caption current";
  } else {
    cap.textContent = "Not currently traveling";
    cap.className = "map-caption inactive";
  }
}

function renderMapMarkers() {
  if (markerLayer) { map.removeLayer(markerLayer); markerLayer = null; }
  if (journeyLine) { map.removeLayer(journeyLine); journeyLine = null; }
  if (arrowLayer)  { map.removeLayer(arrowLayer);  arrowLayer  = null; }

  updateMapCaption();

  const tripId = activeMapTripId();
  if (tripId == null) { map.setView([20, 0], 2); return; } // empty map → world view

  const pool = (window.blogEntries ?? []).filter(
    e => isFinite(e.latitude) && isFinite(e.longitude) && e.tripId === tripId
  );
  if (!pool.length) { map.setView([20, 0], 2); return; }

  const sorted = [...pool].sort((a, b) => a.date.localeCompare(b.date));
  const coords = sorted.map(e => [e.latitude, e.longitude]);

  journeyLine = L.polyline(coords, {
    color: "#4da6ff", weight: 1.5, opacity: 0.45, dashArray: "5 9",
  }).addTo(map);

  const arrows = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const deg = getBearing(coords[i], coords[i + 1]) - 90;
    const mid = [(coords[i][0] + coords[i+1][0]) / 2, (coords[i][1] + coords[i+1][1]) / 2];
    const icon = L.divIcon({
      className: "",
      html: `<svg width="12" height="12" viewBox="0 0 12 12"
               style="transform:rotate(${deg}deg);transform-origin:6px 6px;display:block">
               <polyline points="1,1 10,6 1,11"
                 fill="none" stroke="#4da6ff" stroke-width="1.5"
                 stroke-opacity="0.5" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`,
      iconSize: [12, 12], iconAnchor: [6, 6],
    });
    arrows.push(L.marker(mid, { icon, interactive: false }));
  }
  arrowLayer = L.layerGroup(arrows).addTo(map);

  const markers = sorted.map(e =>
    L.circleMarker([e.latitude, e.longitude], {
      radius: 6, fillColor: "#4da6ff", color: "#ffffff",
      weight: 1.5, opacity: 1, fillOpacity: 0.88,
    }).bindPopup(
      `<strong style="font-family:Consolas,monospace">${e.location}</strong><br>
       <span style="color:#8a95a8;font-size:0.8em">${e.date}</span>`
    )
  );
  markerLayer = L.layerGroup(markers).addTo(map);

  // Zoom the map to frame the selected trip's pins
  if (coords.length === 1) {
    map.setView(coords[0], 11);
  } else {
    map.fitBounds(coords, { padding: [30, 30], maxZoom: 13 });
  }
}

// ── Trip folder toggle ────────────────────────────────────
window.toggleTripFolder = function(tripId) {
  const isOpen = window.openTripId === tripId;
  window.openTripId = isOpen ? null : tripId;

  // Update all folder states without full re-render
  document.querySelectorAll(".trip-folder").forEach(folder => {
    const fid = parseInt(folder.dataset.tripId);
    const open = fid === window.openTripId;
    folder.querySelector(".trip-folder-body").classList.toggle("hidden", !open);
    folder.querySelector(".trip-folder-arrow").textContent = open ? "▼" : "▶";
  });

  renderMapMarkers();
};

// ── Entry / trip rendering ────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function formatCoords(lat, lng) {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lngStr}`;
}

function makeEntryCard(e) {
  const article = document.createElement("article");
  article.className = "entry";
  article.innerHTML = `
    <div class="entry-header">
      <span class="entry-location"></span>
      <span class="entry-date"></span>
    </div>
    <div class="entry-coords"></div>
    <p class="entry-notes"></p>
  `;
  article.querySelector(".entry-location").textContent = e.location;
  article.querySelector(".entry-date").textContent     = formatDate(e.date);
  article.querySelector(".entry-coords").textContent   = formatCoords(e.latitude, e.longitude);
  article.querySelector(".entry-notes").textContent    = e.notes;
  return article;
}

function renderEntries() {
  const allEntries = window.blogEntries ?? [];
  const allTrips   = window.blogTrips   ?? [];

  // Reset a stale open folder (its trip may have been deleted)
  if (window.openTripId != null && !allTrips.some(t => t._id === window.openTripId)) {
    window.openTripId = null;
  }

  renderMapMarkers();
  if (typeof renderSummary === "function") renderSummary();

  const container = document.getElementById("entries");

  if (!allEntries.length) {
    container.innerHTML = '<p class="entries-empty">No entries yet — check back soon.</p>';
    return;
  }

  container.innerHTML = "";

  const currentTrip = allTrips.find(t => t.isCurrent) ?? null;

  // ── Current trip entries (shown flat at top) ──────────
  const currentIds = currentTrip
    ? allEntries.filter(e => e.tripId === currentTrip._id)
                .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  if (currentTrip && currentIds.length) {
    const label = document.createElement("div");
    label.className = "current-trip-label";
    label.innerHTML = `<span class="trip-current-badge">current</span> ${escapeHtml(currentTrip.name)}`;
    container.appendChild(label);
    currentIds.forEach(e => container.appendChild(makeEntryCard(e)));
  }

  // ── Past trip folders ─────────────────────────────────
  const pastTrips = allTrips.filter(t => !t.isCurrent);
  pastTrips.forEach(trip => {
    const tripEntries = allEntries
      .filter(e => e.tripId === trip._id)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!tripEntries.length) return;

    const isOpen = window.openTripId === trip._id;
    const folder = document.createElement("div");
    folder.className = "trip-folder";
    folder.dataset.tripId = trip._id;

    folder.innerHTML = `
      <button class="trip-folder-header" onclick="toggleTripFolder(${trip._id})">
        <span class="trip-folder-arrow">${isOpen ? "▼" : "▶"}</span>
        <span class="trip-folder-name">${escapeHtml(trip.name)}</span>
        <span class="trip-folder-count">${tripEntries.length} post${tripEntries.length !== 1 ? "s" : ""}</span>
      </button>
      <div class="trip-folder-body ${isOpen ? "" : "hidden"}"></div>
    `;

    const body = folder.querySelector(".trip-folder-body");
    tripEntries.forEach(e => body.appendChild(makeEntryCard(e)));
    container.appendChild(folder);
  });

  // ── Unassigned entries ────────────────────────────────
  const assignedIds = new Set(allEntries.filter(e => e.tripId != null).map(e => e._id));
  const unassigned  = allEntries
    .filter(e => !assignedIds.has(e._id))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (unassigned.length) {
    if (currentTrip || pastTrips.some(t => allEntries.some(e => e.tripId === t._id))) {
      const label = document.createElement("div");
      label.className = "current-trip-label";
      label.textContent = "Other Posts";
      container.appendChild(label);
    }
    unassigned.forEach(e => container.appendChild(makeEntryCard(e)));
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

renderEntries();

// ── Gemini summary ────────────────────────────────────────
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function renderSummary() {
  const section = document.getElementById("summary-section");
  const el      = document.getElementById("summary-text");
  if (!el) return;

  const recent = [...(window.blogEntries ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  if (!recent.length) { section.style.display = "none"; return; }
  section.style.display = "";

  if (!GEMINI_API_KEY) {
    el.textContent = "Add your Gemini API key to config.js to enable AI summaries.";
    return;
  }

  const cacheHash = recent.map(e => `${e._id}:${e.date}:${e.notes?.length}`).join("|");
  const cached = localStorage.getItem("summary_hash") === cacheHash
    && localStorage.getItem("summary_text");
  if (cached) { el.textContent = cached; return; }

  el.textContent = "";
  el.classList.add("loading");

  const entriesText = recent.map((e, i) =>
    `Entry ${i + 1}: ${e.date} — ${e.location}\n${e.notes}`
  ).join("\n\n");

  const prompt =
    "You are writing for a personal travel blog. Based on the following three most recent " +
    "travel entries, write a 2–3 sentence first-person narrative summary that is evocative " +
    "and concise. No markdown, no bullet points — plain prose only.\n\n" + entriesText;

  try {
    const res  = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) {
      localStorage.setItem("summary_hash", cacheHash);
      localStorage.setItem("summary_text", text);
      el.textContent = text;
    } else {
      el.textContent = "Summary unavailable.";
    }
  } catch {
    el.textContent = "Could not reach Gemini. Check your API key or network.";
  } finally {
    el.classList.remove("loading");
  }
}

renderSummary();
