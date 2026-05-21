// ── Passwords ─────────────────────────────────────────────
const ADMIN_PASSWORD = "travel"; // kept for reference, no longer required to log in

const STORAGE_KEY  = "blog_entries";
const TRIPS_KEY    = "blog_trips";
const GH_TOKEN_KEY = "gh_publish_token";

function getGithubToken() {
  return localStorage.getItem(GH_TOKEN_KEY) || GITHUB_TOKEN || "";
}
function setGithubToken(t) {
  localStorage.setItem(GH_TOKEN_KEY, t.trim());
}

// ── Entries data ──────────────────────────────────────────
function loadEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return entries.map((e, i) => ({ ...e, _id: i }));
}
function saveEntries(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  window.blogEntries = arr;
}
function nextId() {
  if (!window.blogEntries.length) return 0;
  return Math.max(...window.blogEntries.map(e => e._id ?? 0)) + 1;
}
window.blogEntries = loadEntries();

// ── Trips data ────────────────────────────────────────────
function loadTrips() {
  const stored = localStorage.getItem(TRIPS_KEY);
  if (stored) return JSON.parse(stored);
  return (typeof trips !== "undefined" ? trips : []).map((t, i) => ({ ...t, _id: i }));
}
function saveTrips(arr) {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(arr));
  window.blogTrips = arr;
}
function nextTripId() {
  if (!window.blogTrips.length) return 0;
  return Math.max(...window.blogTrips.map(t => t._id ?? 0)) + 1;
}
window.blogTrips = loadTrips();

// ── Auth ──────────────────────────────────────────────────
let isLoggedIn = false;

// ── Drawer ────────────────────────────────────────────────
const burgerBtn    = document.getElementById("burger-btn");
const drawer       = document.getElementById("drawer");
const drawerOverlay= document.getElementById("drawer-overlay");
const drawerClose  = document.getElementById("drawer-close");
const drawerContent= document.getElementById("drawer-content");

function openDrawer() {
  drawer.classList.add("open");
  drawerOverlay.classList.add("visible");
  renderDrawerContent();
}
function closeDrawer() {
  drawer.classList.remove("open");
  drawerOverlay.classList.remove("visible");
}

burgerBtn.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

function renderDrawerContent() {
  if (!isLoggedIn) {
    drawerContent.innerHTML = `<button id="ryan-login-btn" class="drawer-btn">Ryan Login</button>`;
    document.getElementById("ryan-login-btn").addEventListener("click", () => {
      isLoggedIn = true;
      renderDrawerContent();
    });
  } else {
    drawerContent.innerHTML = `
      <div class="drawer-user">Ryan <span class="drawer-checkmark">&#10003;</span></div>
      <button id="drawer-post-btn" class="drawer-btn">Post</button>
      <button id="drawer-trips-btn" class="drawer-btn">Trips</button>
      <button id="drawer-analytics-btn" class="drawer-btn">Analytics</button>
      <button id="drawer-logout-btn" class="drawer-link">Logout</button>
    `;
    document.getElementById("drawer-post-btn").addEventListener("click", () => {
      closeDrawer(); openPostPanel();
    });
    document.getElementById("drawer-trips-btn").addEventListener("click", () => {
      closeDrawer(); openTripsPanel();
    });
    document.getElementById("drawer-analytics-btn").addEventListener("click", () => {
      closeDrawer(); openAnalyticsPanel();
    });
    document.getElementById("drawer-logout-btn").addEventListener("click", () => {
      isLoggedIn = false;
      closeDrawer();
    });
  }
}

// ── Login modal (kept in DOM but no longer needed for access) ─
const loginModal   = document.getElementById("login-modal");
const loginPassword= document.getElementById("login-password");
const loginError   = document.getElementById("login-error");
function closeLoginModal() { loginModal.classList.add("hidden"); }
document.getElementById("login-cancel").addEventListener("click", closeLoginModal);
document.getElementById("login-submit").addEventListener("click", closeLoginModal);

// ── Trips panel ───────────────────────────────────────────
const tripsPanel     = document.getElementById("trips-panel");
const tripsPanelBody = document.getElementById("trips-panel-body");

function openTripsPanel() {
  tripsPanel.classList.remove("hidden");
  renderTripsPanel();
}

function renderTripsPanel() {
  const currentTrip = window.blogTrips.find(t => t.isCurrent);

  let html = `
    <div class="trip-status-banner ${currentTrip ? "active" : "inactive"}">
      ${currentTrip
        ? `Current trip: <strong>${escapeHtml(currentTrip.name)}</strong>`
        : "Current trip: <strong>none</strong> — not currently traveling"}
    </div>
    <div class="post-form-section">
      <h3>New Trip</h3>
      <form id="trip-form">
        <div class="form-row">
          <label>Trip Name</label>
          <input type="text" id="trip-name-input" placeholder="e.g. Europe Summer 2026" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Create Trip</button>
        </div>
      </form>
    </div>
    <div class="post-list-section">
      <h3>Existing Trips</h3>
  `;

  if (!window.blogTrips.length) {
    html += `<p class="entries-empty">No trips yet.</p>`;
  } else {
    for (const t of window.blogTrips) {
      const postCount = window.blogEntries.filter(e => e.tripId === t._id).length;
      html += `
        <div class="post-list-item">
          <div class="post-list-info">
            <span class="post-list-location">
              ${escapeHtml(t.name)}
              ${t.isCurrent ? '<span class="trip-current-badge">current</span>' : ""}
            </span>
            <span class="post-list-date">${postCount} post${postCount !== 1 ? "s" : ""}</span>
          </div>
          <div class="post-list-actions">
            ${t.isCurrent
              ? `<button class="btn-edit btn-end-trip" data-id="${t._id}">End Trip</button>`
              : `<button class="btn-edit btn-set-current" data-id="${t._id}">Set Current</button>`}
            <button class="btn-delete btn-trip-delete" data-id="${t._id}">Delete</button>
          </div>
        </div>
      `;
    }
  }
  html += `</div>`;
  tripsPanelBody.innerHTML = html;

  document.getElementById("trip-form").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("trip-name-input").value.trim();
    if (!name) return;
    // New trips are not current by default — set it manually when you start the trip
    window.blogTrips.push({ _id: nextTripId(), name, isCurrent: false });
    saveTrips(window.blogTrips);
    renderTripsPanel();
    renderEntries();
    publishToGitHub();
  });

  tripsPanelBody.querySelectorAll(".btn-set-current").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      window.blogTrips = window.blogTrips.map(t => ({ ...t, isCurrent: t._id === id }));
      saveTrips(window.blogTrips);
      renderTripsPanel();
      renderEntries();
      publishToGitHub();
    });
  });

  tripsPanelBody.querySelectorAll(".btn-end-trip").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      window.blogTrips = window.blogTrips.map(t =>
        t._id === id ? { ...t, isCurrent: false } : t
      );
      saveTrips(window.blogTrips);
      renderTripsPanel();
      renderEntries();
      publishToGitHub();
    });
  });

  tripsPanelBody.querySelectorAll(".btn-trip-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      const trip = window.blogTrips.find(t => t._id === id);
      const postCount = window.blogEntries.filter(e => e.tripId === id).length;
      const msg = postCount
        ? `Delete "${trip.name}"? Its ${postCount} post(s) will become unassigned.`
        : `Delete "${trip.name}"?`;
      if (!confirm(msg)) return;
      window.blogTrips = window.blogTrips.filter(t => t._id !== id);
      // Unassign any posts from this trip
      window.blogEntries = window.blogEntries.map(e =>
        e.tripId === id ? { ...e, tripId: null } : e
      );
      saveEntries(window.blogEntries);
      saveTrips(window.blogTrips);
      renderTripsPanel();
      renderEntries();
      publishToGitHub();
    });
  });
}

// ── Post panel ────────────────────────────────────────────
const postPanel     = document.getElementById("post-panel");
const postPanelBody = document.getElementById("post-panel-body");

function openPostPanel() {
  postPanel.classList.remove("hidden");
  renderPostPanel(null);
}
function closePostPanel() {
  postPanel.classList.add("hidden");
}

function renderPostPanel(editingId) {
  const editing = editingId != null
    ? window.blogEntries.find(e => e._id === editingId)
    : null;

  const today = new Date().toISOString().slice(0, 10);

  const tripOptions = window.blogTrips.map(t =>
    `<option value="${t._id}" ${editing?.tripId === t._id ? "selected" : ""}>
      ${escapeHtml(t.name)}${t.isCurrent ? " (current)" : ""}
    </option>`
  ).join("");

  let html = `
    <div class="post-form-section">
      <h3>${editing ? "Edit Post" : "New Post"}</h3>
      <form id="post-form">
        <input type="hidden" id="form-id" value="${editing != null ? editing._id : ""}" />
        <div class="form-row">
          <label>Date</label>
          <input type="date" id="form-date" value="${editing ? editing.date : today}" required />
        </div>
        <div class="form-row">
          <label>Location</label>
          <input type="text" id="form-location" placeholder="e.g. Tokyo, Japan"
            value="${editing ? escapeAttr(editing.location) : ""}" required />
        </div>
        <div class="form-row two-col">
          <div>
            <label>Latitude</label>
            <div class="coord-input">
              <input type="number" id="form-lat" step="any" min="0" max="90"
                placeholder="e.g. 35.6762"
                value="${editing ? Math.abs(editing.latitude) : ""}" required />
              <select id="form-lat-dir" class="coord-select">
                <option value="N" ${editing && editing.latitude < 0 ? "" : "selected"}>N</option>
                <option value="S" ${editing && editing.latitude < 0 ? "selected" : ""}>S</option>
              </select>
            </div>
          </div>
          <div>
            <label>Longitude</label>
            <div class="coord-input">
              <input type="number" id="form-lng" step="any" min="0" max="180"
                placeholder="e.g. 139.6503"
                value="${editing ? Math.abs(editing.longitude) : ""}" required />
              <select id="form-lng-dir" class="coord-select">
                <option value="E" ${editing && editing.longitude < 0 ? "" : "selected"}>E</option>
                <option value="W" ${editing && editing.longitude < 0 ? "selected" : ""}>W</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-row">
          <label>Trip</label>
          <select id="form-trip">
            <option value="">— No trip assigned —</option>
            ${tripOptions}
          </select>
        </div>
        <div class="form-row">
          <label>Notes</label>
          <textarea id="form-notes" rows="5" placeholder="Write about your experience...">${editing ? escapeHtml(editing.notes) : ""}</textarea>
        </div>
        <div class="form-actions">
          ${editing ? '<button type="button" id="form-cancel" class="btn-secondary">Cancel</button>' : ""}
          <button type="submit" class="btn-primary">${editing ? "Save Changes" : "Add Post"}</button>
        </div>
      </form>
    </div>
  `;

  const sorted = [...window.blogEntries].sort((a, b) => b.date.localeCompare(a.date));
  const tripName = id => window.blogTrips.find(t => t._id === id)?.name ?? "";

  html += `<div class="post-list-section"><h3>Existing Posts</h3>`;
  if (!sorted.length) {
    html += `<p class="entries-empty">No posts yet.</p>`;
  } else {
    for (const e of sorted) {
      html += `
        <div class="post-list-item">
          <div class="post-list-info">
            <span class="post-list-location">${escapeHtml(e.location)}</span>
            <span class="post-list-date">
              ${e.date}${e.tripId != null ? ` · <em>${escapeHtml(tripName(e.tripId))}</em>` : ""}
            </span>
          </div>
          <div class="post-list-actions">
            <button class="btn-edit" data-id="${e._id}">Edit</button>
            <button class="btn-delete" data-id="${e._id}">Delete</button>
          </div>
        </div>
      `;
    }
  }
  html += `</div>`;

  const savedToken = getGithubToken();
  html += `
    <div class="export-section">
      <button id="export-btn" class="btn-secondary">Export entries.js</button>
    </div>
    <div class="github-token-section">
      <h3>GitHub Auto-Publish</h3>
      <p class="github-token-hint">Paste your fine-grained token (Contents: read+write) once — saved in this browser only, never uploaded.</p>
      <div class="github-token-row">
        <input type="password" id="gh-token-input" placeholder="github_pat_..."
          value="${savedToken ? "••••••••••••••••" : ""}" autocomplete="off" />
        <button id="gh-token-save" class="btn-primary">Save</button>
        ${savedToken ? '<button id="gh-token-clear" class="btn-secondary">Clear</button>' : ""}
      </div>
      <p id="gh-token-status" class="github-token-status ${savedToken ? "saved" : ""}">
        ${savedToken ? "✓ Token saved in this browser" : ""}
      </p>
    </div>
  `;

  postPanelBody.innerHTML = html;

  document.getElementById("post-form").addEventListener("submit", e => {
    e.preventDefault();
    const idVal   = document.getElementById("form-id").value;
    const tripVal = document.getElementById("form-trip").value;
    const entry = {
      _id: idVal !== "" ? parseInt(idVal) : nextId(),
      date:      document.getElementById("form-date").value,
      location:  document.getElementById("form-location").value.trim(),
      latitude:  (document.getElementById("form-lat-dir").value === "S" ? -1 : 1)
                 * Math.abs(parseFloat(document.getElementById("form-lat").value)),
      longitude: (document.getElementById("form-lng-dir").value === "W" ? -1 : 1)
                 * Math.abs(parseFloat(document.getElementById("form-lng").value)),
      tripId:    tripVal !== "" ? parseInt(tripVal) : null,
      notes:     document.getElementById("form-notes").value.trim(),
    };

    if (idVal !== "") {
      const idx = window.blogEntries.findIndex(e => e._id === parseInt(idVal));
      window.blogEntries[idx] = entry;
    } else {
      window.blogEntries.unshift(entry);
    }

    saveEntries(window.blogEntries);
    renderEntries();
    renderPostPanel(null);
    publishToGitHub();
  });

  if (editing) {
    document.getElementById("form-cancel").addEventListener("click", () => renderPostPanel(null));
  }

  postPanelBody.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", () => renderPostPanel(parseInt(btn.dataset.id)));
  });

  postPanelBody.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this post? This cannot be undone.")) return;
      window.blogEntries = window.blogEntries.filter(e => e._id !== parseInt(btn.dataset.id));
      saveEntries(window.blogEntries);
      renderEntries();
      renderPostPanel(null);
      publishToGitHub();
    });
  });

  document.getElementById("gh-token-save").addEventListener("click", () => {
    const val = document.getElementById("gh-token-input").value.trim();
    if (!val || val.startsWith("•")) return;
    setGithubToken(val);
    renderPostPanel(null);
  });
  document.getElementById("gh-token-clear")?.addEventListener("click", () => {
    localStorage.removeItem(GH_TOKEN_KEY);
    renderPostPanel(null);
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const clean = window.blogEntries.map(({ _id, ...rest }) => rest);
    const js = `const entries = ${JSON.stringify(clean, null, 2)};\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([js], { type: "text/javascript" }));
    a.download = "entries.js";
    a.click();
  });
}

// ── Analytics panel ───────────────────────────────────────
const analyticsPanel = document.getElementById("analytics-panel");
const analyticsBody  = document.getElementById("analytics-body");

function openAnalyticsPanel() {
  analyticsPanel.classList.remove("hidden");
  const all = window.blogEntries;

  if (!all.length) {
    analyticsBody.innerHTML = `<p class="entries-empty">No posts yet.</p>`;
    return;
  }

  const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
  const uniqueLocations = new Set(all.map(e => e.location)).size;

  analyticsBody.innerHTML = `
    <div class="analytics-grid">
      <div class="stat-card"><div class="stat-number">${all.length}</div><div class="stat-label">Total Posts</div></div>
      <div class="stat-card"><div class="stat-number">${uniqueLocations}</div><div class="stat-label">Unique Locations</div></div>
      <div class="stat-card"><div class="stat-number">${window.blogTrips.length}</div><div class="stat-label">Trips</div></div>
      <div class="stat-card"><div class="stat-number">${sorted[sorted.length - 1].date}</div><div class="stat-label">Latest Entry</div></div>
    </div>
    <h3>All Posts</h3>
    <ul class="analytics-list">
      ${[...sorted].reverse().map(e => `
        <li>
          <span class="al-location">${escapeHtml(e.location)}</span>
          <span class="al-date">${e.date}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

// ── GitHub auto-publish (atomic: entries + trips in one commit) ──
function setPublishStatus(state) {
  const labels = {
    syncing:   "⏳ Publishing...",
    published: "✓ Live in ~60s",
    error:     "⚠ Publish failed — check token",
  };
  document.querySelectorAll(".publish-status").forEach(el => {
    el.className = "publish-status " + state;
    el.textContent = labels[state] ?? "";
  });
}

async function publishToGitHub() {
  const token = getGithubToken();
  if (!token || !GITHUB_REPO) return;
  setPublishStatus("syncing");

  const base    = `https://api.github.com/repos/${GITHUB_REPO}`;
  const headers = {
    Authorization:  `token ${token}`,
    Accept:         "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  try {
    // 1. Get current HEAD commit SHA
    const refRes = await fetch(`${base}/git/ref/heads/main`, { headers });
    if (!refRes.ok) throw new Error(`ref ${refRes.status}`);
    const { object: { sha: headSha } } = await refRes.json();

    // 2. Get tree SHA from that commit
    const commitRes = await fetch(`${base}/git/commits/${headSha}`, { headers });
    if (!commitRes.ok) throw new Error(`commit ${commitRes.status}`);
    const { tree: { sha: baseSha } } = await commitRes.json();

    // 3. Build file contents
    const cleanEntries = window.blogEntries.map(({ _id, ...r }) => r);
    const cleanTrips   = window.blogTrips.map(({ _id, ...r }) => r);

    // 4. Create new tree with both files
    const treeRes = await fetch(`${base}/git/trees`, {
      method: "POST", headers,
      body: JSON.stringify({
        base_tree: baseSha,
        tree: [
          { path: "entries.js", mode: "100644", type: "blob",
            content: `const entries = ${JSON.stringify(cleanEntries, null, 2)};\n` },
          { path: "trips.js",   mode: "100644", type: "blob",
            content: `const trips = ${JSON.stringify(cleanTrips, null, 2)};\n` },
        ],
      }),
    });
    if (!treeRes.ok) throw new Error(`tree ${treeRes.status}`);
    const { sha: newTreeSha } = await treeRes.json();

    // 5. Create new commit
    const newCommitRes = await fetch(`${base}/git/commits`, {
      method: "POST", headers,
      body: JSON.stringify({
        message: "Update blog entries and trips",
        tree: newTreeSha,
        parents: [headSha],
      }),
    });
    if (!newCommitRes.ok) throw new Error(`newCommit ${newCommitRes.status}`);
    const { sha: newCommitSha } = await newCommitRes.json();

    // 6. Advance the branch ref
    const patchRes = await fetch(`${base}/git/refs/heads/main`, {
      method: "PATCH", headers,
      body: JSON.stringify({ sha: newCommitSha }),
    });
    if (!patchRes.ok) throw new Error(`patch ${patchRes.status}`);

    setPublishStatus("published");
  } catch (err) {
    console.error("GitHub publish error:", err);
    setPublishStatus("error");
  }
}

// ── Panel close buttons ───────────────────────────────────
document.querySelectorAll(".panel-close").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.panel).classList.add("hidden");
  });
});

// ── Escape key ────────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  closeDrawer();
  closeLoginModal();
  closePostPanel();
  analyticsPanel.classList.add("hidden");
  tripsPanel.classList.add("hidden");
});

// ── Helpers ───────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}
