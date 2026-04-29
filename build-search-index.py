#!/usr/bin/env python3
"""
Mapping Medieval Vienna – Search index builder
Generates data/search-index.json from the four TEI files.
Run from the project root: python3 build-search-index.py
"""

import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from normalize_vnhd import normalize as norm_vnhd

NS = 'http://www.tei-c.org/ns/1.0'
EDITIONS = [
    ('KB-E',       'Kaufbuch E'),
    ('KB-E2_GB-C', 'Kaufbuch E2 / Gewerbuch C'),
    ('GB-D',       'Gewerbuch D'),
    ('GB-E',       'Gewerbuch E'),
]

def text(el):
    """Get all text content of an element, stripped."""
    return ' '.join(''.join(el.itertext()).split())

def clean_marker_text(s):
    """Remove leading # and whitespace from standardized marker texts."""
    return re.sub(r'^[#\s]+', '', s).strip()

def extract_before_marker(ab_xml_str, marker):
    """Extract standardized text appearing directly before a circled marker."""
    pattern = r'(?:/>|>)([^<\n]{1,80})' + re.escape(marker)
    m = re.search(pattern, ab_xml_str)
    if m:
        return clean_marker_text(m.group(1))
    return ''

def extract_all_before_marker(ab_xml_str, marker):
    """Extract all occurrences of standardized text before a marker."""
    pattern = r'(?:/>|>)([^<\n]{1,80})' + re.escape(marker)
    return [clean_marker_text(s) for s in re.findall(pattern, ab_xml_str) if s.strip().lstrip('#').strip()]

def rs_texts(ab, rs_type):
    """Collect all text values of rs elements with a given type.
    itertext() traverses all child nodes including <lb/>, so multi-line
    rs elements (text spanning several lines) are collected in full.
    Line breaks become spaces via the join/split normalization in text().
    """
    vals = []
    for rs in ab.findall(f'.//{{{NS}}}rs[@type="{rs_type}"]'):
        t = text(rs)
        if t:
            vals.append(t)
    return vals

DB_ID_RE = re.compile(r'^DB\d{4}[a-z]*$')

def extract_neben_ids(ab_xml_str):
    """
    Extract object IDs (before Ⓞ) that appear within neben rs elements.
    These are IDs of neighbouring houses, used for object search.
    Strategy: find all Ⓞ occurrences and check if they fall inside a neben rs.
    Since we're working with the raw XML string, we use a simple approach:
    extract text before each Ⓞ that is inside a neben context.
    """
    # Find all <rs type="neben">...</rs> blocks as strings
    neben_blocks = re.findall(
        r'<rs\b[^>]*type="neben"[^>]*>.*?</rs>', ab_xml_str, re.DOTALL
    )
    ids = []
    for block in neben_blocks:
        found = [v for v in extract_all_before_marker(block, 'Ⓞ') if DB_ID_RE.match(v)]
        ids.extend(found)
    return ids

def build_page_map(root):
    """Map each entry xml:id to its page number via document-order walk."""
    page_map = {}
    current_n = None

    def walk(node):
        nonlocal current_n
        tag = node.tag.split('}')[1] if '}' in node.tag else node.tag
        if tag == 'pb':
            current_n = node.get('n')
        elif tag == 'div' and node.get('type') == 'entry':
            xml_id = node.get('{http://www.w3.org/XML/1998/namespace}id', '')
            if xml_id and current_n:
                page_map[xml_id] = current_n
            return
        for child in node:
            walk(child)

    body = root.find(f'.//{{{NS}}}body')
    if body is not None:
        walk(body)
    return page_map

def process_file(edition_key, edition_label, path):
    records = []
    print(f"  Processing {path.name} ...", end=' ', flush=True)

    tree = ET.parse(path)
    root = tree.getroot()
    page_map = build_page_map(root)

    entries = root.findall(f'.//{{{NS}}}div[@type="entry"]')
    for entry in entries:
        xml_id = entry.get('{http://www.w3.org/XML/1998/namespace}id', '')
        entry_n = entry.get('n', '')
        ab = entry.find(f'{{{NS}}}ab[@type="formular"]')
        if ab is None:
            continue

        ab_str = ET.tostring(ab, encoding='unicode')

        notes = [n.text.strip() for n in entry.findall(f'{{{NS}}}note[@type="kommentar"]') if n.text]

        record = {
            'id':       entry_n,
            'xmlId':    xml_id,
            'edition':  edition_key,
            'page':     page_map.get(xml_id, ''),
            # People
            'von':      rs_texts(ab, 'von'),
            'an':       rs_texts(ab, 'an'),
            # Object: standardized IDs before Ⓞ marker (list), descriptive text from rs
            'objIds':   [v for v in extract_all_before_marker(ab_str, 'Ⓞ') if DB_ID_RE.match(v)],
            'objekt':   rs_texts(ab, 'objekt'),
            # Location: standardized form before Ⓛ marker (preferred), rs text as fallback
            'lage':     extract_all_before_marker(ab_str, 'Ⓛ') or rs_texts(ab, 'lage'),
            # Neben: text for person search, IDs for object search
            'neben':    rs_texts(ab, 'neben'),
            'nebenIds': extract_neben_ids(ab_str),
            # Date: normalized form before Ⓓ marker
            'datum':    extract_before_marker(ab_str, 'Ⓓ').split('/')[0].strip(),
            # Price: all standardized values before Ⓟ marker (list, display only)
            'preis':    extract_all_before_marker(ab_str, 'Ⓟ'),
            'kommentar': notes,
        }
        # Phonologically normalized fields for fuzzy search (frühneuhochdeutsch)
        def norm_list(lst): return [norm_vnhd(v) for v in lst]
        record['norm_von']    = norm_list(record['von'])
        record['norm_an']     = norm_list(record['an'])
        record['norm_lage']   = norm_list(record['lage'])
        record['norm_neben']  = norm_list(record['neben'])
        record['norm_objekt'] = norm_list(record['objekt'])
        # Remove empty values to keep JSON compact
        record = {k: v for k, v in record.items() if v != '' and v != []}
        records.append(record)

    print(f"{len(records)} entries")
    return records

def main():
    data_dir = Path('data')
    out_path = data_dir / 'search-index.json'

    all_records = []
    missing = []

    for key, label in EDITIONS:
        path = data_dir / f'{key}.xml'
        if not path.exists():
            print(f"  MISSING: {path} – skipping")
            missing.append(key)
            continue
        all_records.extend(process_file(key, label, path))

    lines = ',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in all_records)
    out_path.write_text(f'[\n{lines}\n]', encoding='utf-8')
    print(f"\nWrote {len(all_records)} records to {out_path}")
    size_kb = out_path.stat().st_size / 1024
    print(f"Index size: {size_kb:.0f} KB")
    if missing:
        print(f"Note: missing files not indexed: {', '.join(missing)}")

if __name__ == '__main__':
    main()
