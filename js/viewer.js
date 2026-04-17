/* Mapping Medieval Vienna – edition viewer (v3) */

const IIIF_BASE = "https://img.typed.fu-berlin.de/iiif/2/";
const TEI_NS = "http://www.tei-c.org/ns/1.0";

let viewer = null;
let pages = [];
let currentPageIdx = -1;
let xmlDoc = null;

/* ── Bootstrap ── */
document.addEventListener("DOMContentLoaded", () => {
  initOSD();

  const params = new URLSearchParams(location.search);
  const edition = params.get("e");
  if (!edition) { showStatus("Keine Edition angegeben (URL-Parameter ?e= fehlt)."); return; }

  const titles = {
    "KB-E":       "Kaufbuch E",
    "KB-E2_GB-C": "Kaufbuch E2 / Gewährbuch C",
    "GB-D":       "Gewährbuch D",
    "GB-E":       "Gewährbuch E",
  };
  document.title = (titles[edition] || edition) + " – Mapping Medieval Vienna";
  document.getElementById("edition-title").textContent = titles[edition] || edition;

  document.getElementById("toggle-form").addEventListener("change", () => {
    if (currentPageIdx >= 0) renderTranscript(currentPageIdx);
  });

  document.getElementById("btn-prev").addEventListener("click", () => showPage(currentPageIdx - 1));
  document.getElementById("btn-next").addEventListener("click", () => showPage(currentPageIdx + 1));

  // Handle browser back/forward
  window.addEventListener("hashchange", () => {
    const n = location.hash.slice(1);
    if (n) {
      const idx = pages.findIndex(p => p.n === n);
      if (idx >= 0 && idx !== currentPageIdx) showPage(idx, false);
    }
  });

  loadEdition("data/" + edition + ".xml");
});

/* ── Load & parse TEI ── */
function loadEdition(url) {
  showStatus("Lade Edition…");
  fetch(url)
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status + " beim Laden von " + url);
      return r.text();
    })
    .then(text => {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(text, "application/xml");
      const err = xmlDoc.querySelector("parsererror");
      if (err) throw new Error("XML-Fehler: " + err.textContent.slice(0, 200));
      buildPageIndex();
      renderNav();
      // Start on page from hash, or first page
      const hashN = location.hash.slice(1);
      const startIdx = hashN ? Math.max(0, pages.findIndex(p => p.n === hashN)) : 0;
      showPage(startIdx);
    })
    .catch(e => showStatus("Fehler: " + e.message));
}

/* ── Build page index via document-order traversal ── */
function buildPageIndex() {
  pages = [];
  let currentPage = null;

  function walk(node) {
    if (node.nodeType !== 1) return;
    const local = node.localName;
    if (local === "pb") {
      currentPage = { n: node.getAttribute("n"), facs: node.getAttribute("facs"), entries: [] };
      pages.push(currentPage);
    } else if (local === "div" && node.getAttribute("type") === "entry") {
      if (currentPage) currentPage.entries.push(node);
      return;
    }
    for (const child of node.children) walk(child);
  }

  const body = xmlDoc.getElementsByTagNameNS(TEI_NS, "body")[0]
             || xmlDoc.getElementsByTagName("body")[0];
  if (!body) throw new Error("Kein <body> gefunden");
  walk(body);
}

/* ── Navigation ── */
function renderNav() {
  const nav = document.getElementById("page-nav");
  nav.innerHTML = '<h3>Seiten</h3>';
  pages.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = "page-link";
    btn.textContent = p.n;
    if (p.entries.length === 0) btn.style.opacity = "0.4";
    btn.title = p.entries.length + " Einträge";
    btn.onclick = () => showPage(i);
    nav.appendChild(btn);
  });

  // Set nav width to fit content
  // We'll let CSS handle this with width:max-content + min/max constraints
}

function showPage(idx, pushHash = true) {
  if (idx < 0 || idx >= pages.length) return;
  currentPageIdx = idx;

  // Update hash without triggering hashchange handler loop
  if (pushHash) {
    history.pushState(null, "", location.pathname + location.search + "#" + pages[idx].n);
  }

  // Update nav highlight
  document.querySelectorAll(".page-link").forEach((el, i) => el.classList.toggle("active", i === idx));
  const active = document.querySelector(".page-link.active");
  if (active) active.scrollIntoView({ block: "nearest" });

  // Update prev/next button state
  document.getElementById("btn-prev").disabled = idx === 0;
  document.getElementById("btn-next").disabled = idx === pages.length - 1;

  renderTranscript(idx);
  loadFacsimile(idx);
}

/* ── Render transcript ── */
function renderTranscript(idx) {
  const formMode = document.getElementById("toggle-form").checked;
  const pane = document.getElementById("transcript-pane");
  const controls = document.getElementById("pane-controls");
  const page = pages[idx];

  pane.innerHTML = "";
  pane.appendChild(controls);

  if (page.entries.length === 0) {
    const msg = document.createElement("p");
    msg.style.cssText = "color:var(--col-muted);font-family:var(--font-ui);font-size:13px;margin-top:1rem;";
    msg.textContent = "Keine Einträge auf dieser Seite.";
    pane.appendChild(msg);
    return;
  }

  for (const entry of page.entries) {
    const wrapper = document.createElement("div");
    wrapper.className = "entry";

    const id = entry.getAttribute("n") || entry.getAttributeNS("http://www.w3.org/XML/1998/namespace", "id");
    const label = document.createElement("div");
    label.className = "entry-head";
    label.textContent = id;
    wrapper.appendChild(label);

    if (formMode) {
      const ab = findChild(entry, "ab", "formular");
      if (ab) wrapper.appendChild(teiToHtml(ab));
    } else {
      const ps = findAllByLocalName(entry, "p");
      if (ps.length > 0) {
        ps.forEach(p => wrapper.appendChild(teiToHtml(p)));
      } else {
        for (const child of entry.children) {
          if (child.localName !== "head") wrapper.appendChild(teiToHtml(child));
        }
      }
    }

    pane.appendChild(wrapper);
  }
}

/* ── TEI → HTML ── */
function teiToHtml(node) {
  if (node.nodeType === 3) return document.createTextNode(node.textContent);
  if (node.nodeType !== 1) return document.createDocumentFragment();

  const tag = node.localName;
  if (tag === "lb")  return document.createElement("br");
  if (tag === "pb")  return document.createDocumentFragment();

  const tagMap = {
    ab: "div", p: "div", seg: "span", rs: "span",
    date: "span", measure: "span", del: "del", add: "ins",
    fw: "div", head: "div", div: "div", note: "span", hi: "span",
  };
  const el = document.createElement(tagMap[tag] || "span");

  const type = node.getAttribute("type");
  if (type) el.dataset.teiType = type;
  const classes = ["tei-" + tag];
  if (type) classes.push("tei-" + tag + "-" + type);
  if (tag === "rs" && type) classes.push("tei-rs-" + type);
  el.className = classes.join(" ");

  for (const child of node.childNodes) {
    const converted = teiToHtml(child);
    if (converted) el.appendChild(converted);
  }
  return el;
}

/* ── Helpers ── */
function findChild(parent, localName, typeAttr) {
  for (const child of parent.children) {
    if (child.localName === localName &&
        (!typeAttr || child.getAttribute("type") === typeAttr)) return child;
  }
  return null;
}
function findAllByLocalName(parent, localName) {
  return Array.from(parent.children).filter(c => c.localName === localName);
}

/* ── Facsimile / IIIF ── */
function loadFacsimile(idx) {
  const facs = pages[idx].facs;
  if (!facs || !viewer) return;
  document.getElementById("facs-label").textContent = "Faksimile – S. " + pages[idx].n;

  viewer.open({ type: "image", url: IIIF_BASE + facs + "/full/full/0/default.jpg", buildPyramid: false });
  fetch(IIIF_BASE + facs + "/info.json")
    .then(r => r.ok ? r.json() : null)
    .then(info => { if (info && info["@id"]) viewer.open(info["@id"] + "/info.json"); })
    .catch(() => {});
}

/* ── OpenSeadragon ── */
function initOSD() {
  viewer = OpenSeadragon({
    id:                    "openseadragon",
    prefixUrl:             "lib/images/",
    showNavigationControl: true,
    visibilityRatio:       0.8,
    minZoomLevel:          0.3,
    defaultZoomLevel:      0,
    showNavigator:         true,
    navigatorPosition:     "BOTTOM_RIGHT",
    gestureSettingsMouse:  { scrollToZoom: true },
  });
}

/* ── Status ── */
function showStatus(msg) {
  document.getElementById("page-nav").innerHTML =
    '<div style="padding:1rem;font-family:var(--font-ui);font-size:13px;color:var(--col-muted);">' + msg + '</div>';
}
