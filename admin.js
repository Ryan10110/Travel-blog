// ── Change this to your preferred password ───────────────
const ADMIN_PASSWORD = "travel";

const STORAGE_KEY = "blog_entries";

// ── Data ─────────────────────────────────────────────────
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

// ── Auth ──────────────────────────────────────────────────
let isLoggedIn = false;

// ── Drawer ────────────────────────────────────────────────
const burgerBtn = document.getElementById("burger-btn");
const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerClose = document.getElementById("drawer-close");
const drawerContent = document.getElementById("drawer-content");

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
    document.getElementById("ryan-login-btn").addEventListener("click", openLoginModal);
  } else {
    drawerContent.innerHTML = `
      <div class="drawer-user">Ryan <span class="drawer-checkmark">&#10003;</span></div>
      <button id="drawer-post-btn" class="drawer-btn">Post</button>
      <button id="drawer-analytics-btn" class="drawer-btn">Analytics</button>
      <button id="drawer-logout-btn" class="drawer-link">Logout</button>
    `;
    document.getElementById("drawer-post-btn").addEventListener("click", () => {
      closeDrawer();
      openPostPanel();
    });
    document.getElementById("drawer-analytics-btn").addEventListener("click", () => {
      closeDrawer();
      openAnalyticsPanel();
    });
    document.getElementById("drawer-logout-btn").addEventListener("click", () => {
      isLoggedIn = false;
      closeDrawer();
    });
  }
}

// ── Login modal ───────────────────────────────────────────
const loginModal = document.getElementById("login-modal");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

function openLoginModal() {
  loginModal.classList.remove("hidden");
  loginPassword.value = "";
  loginError.classList.add("hidden");
  setTimeout(() => loginPassword.focus(), 50);
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
}

document.getElementById("login-cancel").addEventListener("click", closeLoginModal);
document.getElementById("login-submit").addEventListener("click", attemptLogin);
loginPassword.addEventListener("keydown", e => { if (e.key === "Enter") attemptLogin(); });

function attemptLogin() {
  if (loginPassword.value === ADMIN_PASSWORD) {
    isLoggedIn = true;
    closeLoginModal();
    renderDrawerContent();
  } else {
    loginError.classList.remove("hidden");
    loginPassword.value = "";
    loginPassword.focus();
  }
}

// ── Post panel ────────────────────────────────────────────
const postPanel = document.getElementById("post-panel");
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

  html += `<div class="post-list-section"><h3>Existing Posts</h3>`;
  if (!sorted.length) {
    html += `<p class="entries-empty">No posts yet.</p>`;
  } else {
    for (const e of sorted) {
      html += `
        <div class="post-list-item">
          <div class="post-list-info">
            <span class="post-list-location">${escapeHtml(e.location)}</span>
            <span class="post-list-date">${e.date}</span>
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

  html += `
    <div class="export-section">
      <button id="export-btn" class="btn-secondary">Export entries.js</button>
    </div>
  `;

  postPanelBody.innerHTML = html;

  document.getElementById("post-form").addEventListener("submit", e => {
    e.preventDefault();
    const idVal = document.getElementById("form-id").value;
    const entry = {
      _id: idVal !== "" ? parseInt(idVal) : nextId(),
      date: document.getElementById("form-date").value,
      location: document.getElementById("form-location").value.trim(),
      latitude:  (document.getElementById("form-lat-dir").value === "S" ? -1 : 1)
                 * Math.abs(parseFloat(document.getElementById("form-lat").value)),
      longitude: (document.getElementById("form-lng-dir").value === "W" ? -1 : 1)
                 * Math.abs(parseFloat(document.getElementById("form-lng").value)),
      notes: document.getElementById("form-notes").value.trim(),
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
const analyticsBody = document.getElementById("analytics-body");

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
      <div class="stat-card">
        <div class="stat-number">${all.length}</div>
        <div class="stat-label">Total Posts</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${uniqueLocations}</div>
        <div class="stat-label">Unique Locations</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${sorted[0].date}</div>
        <div class="stat-label">First Entry</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${sorted[sorted.length - 1].date}</div>
        <div class="stat-label">Latest Entry</div>
      </div>
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

// ── GitHub auto-publish ───────────────────────────────────
function setPublishStatus(state) {
  const el = document.getElementById("publish-status");
  if (!el) return;
  el.className = "publish-status " + state;
  const labels = {
    syncing:   "⏳ Publishing...",
    published: "✓ Live in ~60s",
    error:     "⚠ Publish failed — check token in config.js",
  };
  el.textContent = labels[state] ?? "";
}

async function publishToGitHub() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return;
  setPublishStatus("syncing");
  try {
    const apiBase = `https://api.github.com/repos/${GITHUB_REPO}/contents/entries.js`;
    const headers = {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    // Fetch current file SHA (required by GitHub API to update a file)
    const getRes = await fetch(apiBase, { headers });
    if (!getRes.ok) throw new Error(`GET ${getRes.status}`);
    const { sha } = await getRes.json();

    // Encode updated entries.js as base64
    const clean  = window.blogEntries.map(({ _id, ...rest }) => rest);
    const js     = `const entries = ${JSON.stringify(clean, null, 2)};\n`;
    const b64    = btoa(unescape(encodeURIComponent(js)));

    // Commit
    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify({ message: "Update blog entries", content: b64, sha }),
    });
    if (!putRes.ok) throw new Error(`PUT ${putRes.status}`);
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
});

// ── Helpers ───────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}
