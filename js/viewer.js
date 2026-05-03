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
    "KB-E2_GB-C": "Kaufbuch E2 / Gewerbuch C",
    "GB-D":       "Gewerbuch D",
    "GB-E":       "Gewerbuch E",
  };
  document.title = (titles[edition] || edition) + " – Mapping Medieval Vienna";
  document.getElementById("edition-title").textContent = titles[edition] || edition;

  const toggleBtn = document.getElementById("toggle-form");
  const labelLine = document.getElementById("toggle-label-line");
  const labelForm = document.getElementById("toggle-label-form");

  function updateToggleLabels() {
    const isForm = toggleBtn.getAttribute("aria-checked") === "true";
    labelLine.classList.toggle("active", !isForm);
    labelForm.classList.toggle("active", isForm);
  }
  updateToggleLabels();

  toggleBtn.addEventListener("click", () => {
    const isForm = toggleBtn.getAttribute("aria-checked") === "true";
    toggleBtn.setAttribute("aria-checked", isForm ? "false" : "true");
    updateToggleLabels();
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

  function newPage(pbNode) {
    currentPage = {
      n:             pbNode.getAttribute("n"),
      facs:          pbNode.getAttribute("facs"),
      entries:       [],   // entry divs that begin on this page
      continuations: [],   // {entry, parts} – p[@part M|F] of entries begun earlier
      headings:      [],
    };
    pages.push(currentPage);
  }

  function walkEntry(entryNode) {
    // Walk the children of an entry, respecting <pb> inside it.
    // <p part="I"> or <p> without part → entry starts on currentPage.
    // <p part="M|F"> after a <pb> → continuation on the new currentPage.
    let startPage = currentPage;
    let pendingParts = [];   // p-nodes collected before a <pb>

    for (const child of entryNode.childNodes) {
      if (child.nodeType !== 1) continue;
      const local = child.localName;

      if (local === "pb") {
        // Flush pending parts to startPage.entries (first flush) or
        // to a continuation on currentPage (subsequent flushes).
        if (pendingParts.length > 0) {
          if (currentPage === startPage) {
            startPage.entries.push({ entry: entryNode, parts: pendingParts });
          } else {
            currentPage.continuations.push({ entry: entryNode, parts: pendingParts });
          }
          pendingParts = [];
        }
        // Register the new page.
        newPage(child);
        // startPage stays the original page so the entry shows up there.
      } else if (local === "p" || local === "note" || local === "fw") {
        pendingParts.push(child);
      }
      // head, other elements: ignore for part-splitting purposes
    }

    // Flush remaining parts.
    if (pendingParts.length > 0) {
      if (currentPage === startPage) {
        // Entry fits entirely on one page – store the whole entryNode for
        // compatibility with the existing formular rendering path.
        startPage.entries.push({ entry: entryNode, parts: pendingParts, whole: true });
      } else {
        currentPage.continuations.push({ entry: entryNode, parts: pendingParts });
      }
    }
  }

  function walk(node) {
    if (node.nodeType !== 1) return;
    const local = node.localName;
    if (local === "pb") {
      newPage(node);
    } else if (local === "div" && node.getAttribute("type") === "entry") {
      if (currentPage) walkEntry(node);
      return;
    } else if (local === "div" && (node.getAttribute("type") === "section-alphabetical" || node.getAttribute("type") === "section-temporal")) {
      const head = Array.from(node.children).find(c => c.localName === "head");
      if (head && currentPage) currentPage.headings.push(head);
    } else if (local === "head" && node.getAttribute("type") === "heading-main") {
      if (currentPage) currentPage.headings.push(node);
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
    if (p.entries.length === 0 && p.continuations.length === 0) btn.style.opacity = "0.4";
    btn.title = p.entries.length + " Einträge" + (p.continuations.length ? " (+ Fortsetzung)" : "");
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
  const formMode = document.getElementById("toggle-form").getAttribute("aria-checked") === "true";
  const pane = document.getElementById("transcript-pane");
  const controls = document.getElementById("pane-controls");
  const page = pages[idx];

  pane.innerHTML = "";
  pane.appendChild(controls);

  // Render headings (always, including on pages without entries)
  for (const head of (page.headings || [])) {
    pane.appendChild(teiToHtml(head));
  }

  const hasContent = page.entries.length > 0 || page.continuations.length > 0;
  if (!hasContent) {
    const msg = document.createElement("p");
    msg.style.cssText = "color:var(--col-muted);font-family:var(--font-ui);font-size:13px;margin-top:1rem;";
    msg.textContent = "Keine Einträge auf dieser Seite.";
    pane.appendChild(msg);
    return;
  }

  // In line-accurate mode: show continuations first, then entries begun here.
  // In formular mode: show only entries begun here (formular has no page-break info).
  if (!formMode) {
    for (const cont of page.continuations) {
      pane.appendChild(renderEntryParts(cont.entry, cont.parts, /* isContinuation */ true));
    }
  }

  for (const item of page.entries) {
    const wrapper = document.createElement("div");
    wrapper.className = "entry";

    const entryNode = item.entry;
    const id = entryNode.getAttribute("n") || entryNode.getAttributeNS("http://www.w3.org/XML/1998/namespace", "id");
    const label = document.createElement("div");
    label.className = "entry-head";
    label.textContent = id;
    wrapper.appendChild(label);

    for (const note of Array.from(entryNode.children).filter(c => c.localName === "note" && c.getAttribute("type") === "kommentar")) {
      const commentDiv = document.createElement("div");
      commentDiv.className = "entry-comment";
      commentDiv.textContent = note.textContent.trim();
      wrapper.appendChild(commentDiv);
    }

    if (formMode) {
      const ab = findChild(entryNode, "ab", "formular");
      if (ab) wrapper.appendChild(teiToHtml(ab));
    } else {
      for (const part of item.parts) {
        wrapper.appendChild(teiToHtml(part));
      }
    }

    pane.appendChild(wrapper);
  }
}

/* ── Render a continuation (p[@part M|F] nodes of an entry begun earlier) ── */
function renderEntryParts(entryNode, parts, isContinuation) {
  const wrapper = document.createElement("div");
  wrapper.className = "entry" + (isContinuation ? " entry-continuation" : "");

  const id = entryNode.getAttribute("n") || entryNode.getAttributeNS("http://www.w3.org/XML/1998/namespace", "id");
  const label = document.createElement("div");
  label.className = "entry-head";
  label.textContent = id + (isContinuation ? " (Forts.)" : "");
  wrapper.appendChild(label);

  for (const part of parts) {
    wrapper.appendChild(teiToHtml(part));
  }
  return wrapper;
}

/* ── TEI → HTML ── */
function teiToHtml(node, inFormularAb) {
  // inFormularAb: true when direct parent is <ab type="formular"> or a <seg> inside one
  if (node.nodeType === 3) return document.createTextNode(node.textContent);
  if (node.nodeType !== 1) return document.createDocumentFragment();

  const tag = node.localName;

  if (tag === "lb") {
    if (inFormularAb) {
      // lb between slots in formular → visible gap
      const spacer = document.createElement("div");
      spacer.className = "tei-leerzeile";
      return spacer;
    }
    return document.createElement("br");
  }
  if (tag === "pb") return document.createDocumentFragment();

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

  // Is this node the formular ab itself, or a seg directly inside one?
  const isFormularAb = tag === "ab" && type === "formular";
  const isSegInFormular = tag === "seg" && inFormularAb;
  const childInFormular = isFormularAb || isSegInFormular;

  if (childInFormular) {
    // Group each slot (rs/measure/date) together with its preceding annotation tokens
    // into a <div class="tei-slot"> block for correct border and indentation.
    let pendingAnnotation = null; // span holding annotation text before the next slot

    const flushSlot = (slotNode) => {
      const wrapper = document.createElement("div");
      wrapper.className = "tei-slot";
      if (pendingAnnotation) {
        wrapper.appendChild(pendingAnnotation);
        pendingAnnotation = null;
      }
      if (slotNode) wrapper.appendChild(teiToHtml(slotNode, false));
      el.appendChild(wrapper);
    };

    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        // Text node: annotation token(s) before the next slot
        if (child.textContent.trim()) {
          if (!pendingAnnotation) {
            pendingAnnotation = document.createElement("span");
            pendingAnnotation.className = "tei-annotation";
          }
          pendingAnnotation.appendChild(document.createTextNode(child.textContent));
        }
      } else {
        const cLocal = child.localName;
        if (cLocal === "rs" || cLocal === "measure" || cLocal === "date") {
          flushSlot(child);
        } else {
          // lb → leerzeile, or other elements
          if (pendingAnnotation) { el.appendChild(pendingAnnotation); pendingAnnotation = null; }
          const converted = teiToHtml(child, false);
          if (converted) el.appendChild(converted);
        }
      }
    }
    // Flush any trailing annotation without a slot
    if (pendingAnnotation) el.appendChild(pendingAnnotation);
  } else {
    for (const child of node.childNodes) {
      const converted = teiToHtml(child, false);
      if (converted) el.appendChild(converted);
    }
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

  const infoUrl = IIIF_BASE + facs + "/info.json";
  viewer.open(infoUrl);
}

/* ── OpenSeadragon ── */
function initOSD() {
  viewer = OpenSeadragon({
    id:                    "openseadragon",
    prefixUrl:             "lib/openseadragon-images/",
    showNavigationControl: true,
    visibilityRatio:       0.8,
    minZoomLevel:          0.3,
    defaultZoomLevel:      0,
    showNavigator:         false,
    navigatorPosition:     "BOTTOM_RIGHT",
    gestureSettingsMouse:  { scrollToZoom: true },
  });
}

/* ── Status ── */
function showStatus(msg) {
  document.getElementById("page-nav").innerHTML =
    '<div style="padding:1rem;font-family:var(--font-ui);font-size:13px;color:var(--col-muted);">' + msg + '</div>';
}
