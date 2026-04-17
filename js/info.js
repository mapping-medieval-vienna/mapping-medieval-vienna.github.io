/* Mapping Medieval Vienna – info page renderer */

// Site map: defines all pages, their URLs, labels, and which ones are empty
const SITE_MAP = [
  {
    label: "Projekt",
    pages: [
      { p: "projekt/index", label: "Über das Projekt" },
    ]
  },
  {
    label: "Edition",
    pages: [
      { p: "edition/ueber-die-edition",  label: "Über die Edition" },
      { p: "edition/seitenkonkordanz",   label: "Seitenkonkordanz" },
    ]
  },
  {
    label: "Auswertung",
    pages: [
      { p: "auswertung/ueber-die-auswertung", label: "Über die Auswertung" },
      { p: "auswertung/formular-ansicht",     label: "Formular-Ansicht" },
      { p: "auswertung/haeuser",              label: "Häuser",   wip: true },
      { p: "auswertung/personen",             label: "Personen", wip: true },
    ]
  },
  {
    label: "Workflows",
    pages: [
      { p: "workflows/ueber-die-workflows",      label: "Über die Workflows" },
      { p: "workflows/transkription",            label: "Transkription" },
      { p: "workflows/transkriptionsrichtlinien",label: "Transkriptionsrichtlinien" },
      { p: "workflows/formular-erstellung",      label: "Formular-Erstellung" },
      { p: "workflows/extraktion-der-daten",     label: "Extraktion der Daten" },
    ]
  },
  {
    label: "Hilfsmittel",
    pages: [
      { p: "hilfsmittel/ueber-die-hilfsmittel",  label: "Über die Hilfsmittel" },
      { p: "hilfsmittel/modell-fuer-transkribus", label: "Modell für Transkribus" },
      { p: "hilfsmittel/gazetteer",               label: "Gazetteer",         wip: true },
      { p: "hilfsmittel/heiligenkalender",        label: "Heiligenkalender",  wip: true },
      { p: "hilfsmittel/python-skripte",          label: "Python-Skripte",    wip: true },
    ]
  },
  {
    label: "Rechtliches",
    pages: [
      { p: "datenschutz", label: "Datenschutz" },
      { p: "impressum",   label: "Impressum" },
    ]
  },
];

/* ── Bootstrap ── */
document.addEventListener("DOMContentLoaded", () => {
  buildNav();

  const params = new URLSearchParams(location.search);
  const page = params.get("p") || "projekt/index";
  loadPage(page);
});

/* ── Build sidebar nav ── */
function buildNav() {
  const nav = document.getElementById("info-nav-inner");
  const params = new URLSearchParams(location.search);
  const current = params.get("p") || "projekt/index";

  for (const section of SITE_MAP) {
    const heading = document.createElement("div");
    heading.className = "info-nav-section";
    heading.textContent = section.label;
    nav.appendChild(heading);

    for (const page of section.pages) {
      const a = document.createElement("a");
      a.className = "info-nav-link" + (page.p === current ? " active" : "");
      a.href = "info.html?p=" + page.p;
      a.textContent = page.label;
      if (page.wip) {
        const badge = document.createElement("span");
        badge.className = "wip-badge";
        badge.textContent = "in Vorbereitung";
        a.appendChild(badge);
      }
      nav.appendChild(a);
    }
  }
}

/* ── Load and render a markdown page ── */
function loadPage(p) {
  // Update active state in nav
  document.querySelectorAll(".info-nav-link").forEach(a => {
    const href = new URL(a.href).searchParams.get("p");
    a.classList.toggle("active", href === p);
  });

  // Update document title
  const allPages = SITE_MAP.flatMap(s => s.pages);
  const meta = allPages.find(x => x.p === p);
  if (meta) document.title = meta.label + " – Mapping Medieval Vienna";

  const content = document.getElementById("info-content");
  content.innerHTML = '<p style="color:var(--col-muted);font-family:var(--font-ui);font-size:13px;">Lade…</p>';

  fetch("pages/" + p + ".md")
    .then(r => {
      if (!r.ok) throw new Error("Nicht gefunden");
      return r.text();
    })
    .then(md => {
      // Check if page is essentially empty (only a heading)
      const lines = md.trim().split("\n").filter(l => l.trim());
      const isEmpty = lines.length <= 1;

      if (isEmpty) {
        const title = lines[0] ? lines[0].replace(/^#+\s*/, "") : "";
        content.innerHTML =
          "<h1>" + escHtml(title) + "</h1>" +
          '<p class="wip-notice">Diese Seite ist in Vorbereitung.</p>';
      } else {
        content.innerHTML = marked.parse(md);
      }
    })
    .catch(() => {
      content.innerHTML = '<p class="wip-notice">Seite nicht gefunden.</p>';
    });
}

function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
