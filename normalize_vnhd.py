"""
Phonologische Normalisierung für frühneuhochdeutsches Wiener Deutsch (ca. 1420–1517).

Normalisiert sowohl historische Schreibvarianten als auch moderne Sucheingaben
auf eine gemeinsame kanonische Form, damit beide gegeneinander verglichen werden können.

Verwendung:
    from normalize_vnhd import normalize
    norm_text = normalize("hausfraw")  # → gleich wie normalize("hausfrau")
"""

import re


def normalize(text: str) -> str:
    s = text.lower()

    # 1. Moderne Umlaute und ß
    s = s.replace('ä', 'a')
    s = s.replace('ö', 'o')
    s = s.replace('ü', 'u')
    s = s.replace('ß', 's')

    # 2. Diphthong-Vereinheitlichung → ei
    s = s.replace('ey', 'ei')
    s = s.replace('ay', 'ei')
    s = s.replace('ai', 'ei')

    # 3. Suffix-Stripping (vor Vokal-Regeln)
    s = re.sub(r'em\b', 'm', s)
    s = re.sub(r'en\b', 'n', s)
    s = re.sub(r'e\b',  '',  s)
    s = re.sub(r'nn\b', 'n', s)

    # 4. u/w → u  (hausfraw → hausfrau)
    s = s.replace('w', 'u')

    # 5. o/u → u  (Conrad/Kunrat → gleiche Normalform)
    s = s.replace('o', 'u')

    # 6. pf/ph → f, p → b
    s = s.replace('pf', 'f')
    s = s.replace('ph', 'f')
    s = s.replace('p', 'b')

    # 7. f/v → f
    s = s.replace('v', 'f')

    # 8. i/y → i
    s = s.replace('y', 'i')

    # 9. K-Cluster → k (längste zuerst)
    for variant in ('gkch', 'gkh', 'ckh', 'kch', 'chk', 'ck', 'gk', 'kh', 'gh', 'ch', 'c'):
        s = s.replace(variant, 'k')

    # 10. Z-Cluster → s (vor D-Regel)
    for variant in ('cz', 'tz', 'z'):
        s = s.replace(variant, 's')

    # 11. D-Cluster → d
    for variant in ('dt', 'tt'):
        s = s.replace(variant, 'd')
    s = s.replace('t', 'd')

    # 12. Doppelkonsonanten → einfach
    for c in ('s', 'l', 'f', 'g', 'n', 'r', 'd'):
        s = s.replace(c + c, c)

    return s


if __name__ == '__main__':
    gruppen = [
        ('hausfrau',  'hausfraw',  'hawsfraw'),
        ('strasse',   'strass',    'strazz',   'stras', 'straz', 'strasz'),
        ('brunnen',   'prun',      'brunn'),
        ('vleisch',   'vlaisch',   'fleisch'),
        ('pey',       'bei',       'bai',       'bay'),
        ('heinz',     'haintz',    'heins'),
        ('hoffmann',  'hofman',    'hofmann'),
        ('chunrat',   'chunrad',   'conrat',    'konrad', 'Conrad', 'Kunrat'),
        ('pfister',   'phister'),
        ('ulreich',   'vlreich'),
    ]

    print("Konsistenz-Check:")
    for gruppe in gruppen:
        normen = [normalize(w) for w in gruppe]
        gleich = len(set(normen)) == 1
        status = '✓' if gleich else '✗'
        details = '  →  ' + normen[0] if gleich else ''
        print(f"  {status}  {', '.join(gruppe)}{details}")
        if not gleich:
            for w, n in zip(gruppe, normen):
                print(f"       {w:15s} → {n}")

    print()
    print("Einzelne Normalisierungen:")
    for w in ['Scheffstraße', 'scheffstrass', 'Stubentor', 'Stubmthor',
              'hausfraw', 'hausfrau', 'Ottinger', 'ottinger', 'Conrad', 'Kunrat', 'Conrat', 'Chunrad']:
        print(f"  {w:20s} → {normalize(w)}")
