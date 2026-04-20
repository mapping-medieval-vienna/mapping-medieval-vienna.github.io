# Mapping Medieval Vienna

Digitale Edition von vier mittelalterlichen Wiener Grundbüchern des frühen 15. Jahrhunderts,
gehostet als statische Website auf GitHub Pages.

**Live:** https://mapping-medieval-vienna.github.io/

## Projektstruktur

```
/
├── index.html                  Startseite
├── viewer.html                 Edition-Viewer
├── info.html                   Info-Seiten-Renderer
├── search.html                 Suchseite
├── anno-domini.jpg             Header-Bild
├── build-search-index.py       Erzeugt data/search-index.json
├── css/
│   ├── main.css                Haupt-CSS (Viewer)
│   ├── info.css                CSS für Infoseiten
│   └── search.css              CSS für Suchseite
├── js/
│   ├── viewer.js               TEI-Parsing, Navigation, IIIF
│   ├── info.js                 Markdown-Laden, Sidebar
│   └── search.js               Suchlogik
├── lib/
│   ├── openseadragon.min.js    IIIF-Viewer (lokal)
│   ├── marked.min.js           Markdown-Renderer (lokal)
│   └── openseadragon-images/   OSD-Navigations-Icons
├── data/
│   ├── KB-E.xml                TEI-Edition Kaufbuch E
│   ├── KB-E2_GB-C.xml          TEI-Edition Kaufbuch E2 / Gewerbuch C
│   ├── GB-D.xml                TEI-Edition Gewerbuch D
│   ├── GB-E.xml                TEI-Edition Gewerbuch E
│   └── search-index.json       Suchindex (erzeugt von build-search-index.py)
└── pages/                      Markdown-Infoseiten
    ├── projekt/index.md
    ├── edition/
    ├── auswertung/
    ├── workflows/
    ├── hilfsmittel/
    ├── datenschutz.md
    └── impressum.md
```

## Die vier Editionen

| URL-Kürzel | Titel | Zeitraum |
|------------|-------|----------|
| `KB-E` | Kaufbuch E | |
| `KB-E2_GB-C` | Kaufbuch E2 / Gewerbuch C | |
| `GB-D` | Gewerbuch D | ca. 1438–1473 |
| `GB-E` | Gewerbuch E | ca. 1474–1517 |

Kaufbuch E2 und Gewerbuch C liegen in einer gemeinsamen TEI-Datei und einem
gemeinsamen Viewer-Aufruf. Sinnvolle Einstiegspunkte: S. 3 (KB-E2) und S. 81 (GB-C).

## Suchindex aktualisieren

Nach Änderungen an den TEI-Dateien muss der Suchindex neu erzeugt werden:

```bash
python3 build-search-index.py
```

Das Skript liest alle vier TEI-Dateien aus `data/` und schreibt `data/search-index.json`.

## Lokale Entwicklung

Da Dateien per `fetch()` geladen werden, ist ein lokaler HTTP-Server nötig
(direktes Öffnen als `file://` funktioniert nicht):

```bash
python3 -m http.server 8000
```

Dann im Browser:
- Startseite: `http://localhost:8000/`
- Edition: `http://localhost:8000/viewer.html?e=GB-D`
- Suche: `http://localhost:8000/search.html`
- Infoseite: `http://localhost:8000/info.html?p=edition/ueber-die-edition`

## Deployment auf GitHub Pages

Push auf `main` löst automatisch das Deployment aus (`.github/workflows/deploy.yml`).

Einmalige Einrichtung im Repository unter *Settings → Pages*:
- Source: **GitHub Actions**

## Infoseiten bearbeiten

Die Infoseiten sind einfache Markdown-Dateien in `pages/`. Sie können direkt bearbeitet
werden, ohne dass sonst etwas geändert werden muss. Seiten, die nur eine Überschrift
enthalten, werden automatisch als „in Vorbereitung" angezeigt.

## Abhängigkeiten

Alle Bibliotheken sind lokal eingebunden, kein CDN, keine Build-Tools nötig:

- [OpenSeadragon 4.1](https://openseadragon.github.io/) – IIIF-Faksimile-Viewer
- [marked](https://marked.js.org/) – Markdown-Renderer
