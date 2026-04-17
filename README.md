# Mapping Medieval Vienna

Digitale Edition von vier mittelalterlichen Wiener Grundbüchern des frühen 15. Jahrhunderts,
gehostet als statische Website auf GitHub Pages.

## Projektstruktur

```
/
├── index.html                  Startseite
├── viewer.html                 Edition-Viewer
├── info.html                   Info-Seiten-Renderer
├── anno-domini.jpg             Header-Bild
├── css/
│   ├── main.css                Haupt-CSS (Viewer)
│   └── info.css                CSS für Infoseiten
├── js/
│   ├── viewer.js               TEI-Parsing, Navigation, IIIF
│   ├── info.js                 Markdown-Laden, Sidebar
│   └── marked.min.js           Markdown-Renderer (lokal)
├── lib/
│   ├── openseadragon.min.js    IIIF-Viewer (lokal)
│   └── images/                 OSD-Navigations-Icons
├── data/                       TEI-Dateien (nicht im Repo)
│   ├── KB-E.xml
│   ├── KB-E2_GB-C.xml
│   ├── GB-D.xml
│   └── GB-E.xml
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

| URL-Kürzel | Titel |
|------------|-------|
| `KB-E` | Kaufbuch E |
| `KB-E2_GB-C` | Kaufbuch E2 / Gewährbuch C |
| `GB-D` | Gewährbuch D |
| `GB-E` | Gewährbuch E |

## TEI-Dateien

Die TEI-Dateien (`data/*.xml`) sind nicht im Repository versioniert – sie sind zu groß
für GitHub (größte Datei ca. 12 MB) und werden separat bereitgestellt.
Vor dem Deployment müssen sie manuell in `data/` abgelegt werden.

## Lokale Entwicklung

Da die TEI- und Markdown-Dateien per `fetch()` geladen werden, ist ein lokaler
HTTP-Server nötig (direktes Öffnen als `file://` funktioniert nicht):

```bash
python3 -m http.server 8000
```

Dann im Browser:
- Startseite: `http://localhost:8000/`
- Edition: `http://localhost:8000/viewer.html?e=GB-D`
- Infoseite: `http://localhost:8000/info.html?p=edition/ueber-die-edition`

## Deployment auf GitHub Pages

Push auf `main` löst automatisch das Deployment aus (`.github/workflows/deploy.yml`).
Die TEI-Dateien müssen vor dem Push in `data/` liegen, oder separat hochgeladen werden.

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
