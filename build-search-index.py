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

NS = 'http://www.tei-c.org/ns/1.0'
EDITIONS = [
    ('KB-E',       'Kaufbuch E'),
    ('KB-E2_GB-C', 'Kaufbuch E2 / Gewährbuch C'),
    ('GB-D',       'Gewährbuch D'),
    ('GB-E',       'Gewährbuch E'),
]

def text(el):
    """Get all text content of an element, stripped."""
    return ' '.join(''.join(el.itertext()).split())

def clean_marker_text(s):
    """Remove leading # and whitespace from standardized marker texts."""
    return re.sub(r'^[#\s]+', '', s).strip()

def extract_before_marker(ab_xml_str, marker):
    """Extract standardized text appearing directly before a circled marker."""
    # Capture text after last lb/tag boundary up to the marker
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
    """Collect all text values of rs elements with a given type."""
    vals = []
    for rs in ab.findall(f'.//{{{NS}}}rs[@type="{rs_type}"]'):
        t = text(rs)
        if t:
            vals.append(t)
    return vals

def extract_measure(ab, measure_type='preis'):
    """Get standardised measure text for a given type only."""
    for m in ab.findall(f'.//{{{NS}}}measure'):
        if m.get('type') == measure_type:
            t = text(m)
            if t:
                return t
    return ''

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

        record = {
            'id':      entry_n,
            'xmlId':   xml_id,
            'edition': edition_key,
            'page':    page_map.get(xml_id, ''),
            # People
            'von':     rs_texts(ab, 'von'),
            'an':      rs_texts(ab, 'an'),
            # Object: standardized ID before Ⓞ marker, descriptive text from rs
            'objId':   extract_before_marker(ab_str, 'Ⓞ'),
            'objekt':  rs_texts(ab, 'objekt'),
            # Location: standardized form before Ⓛ marker (preferred), rs text as fallback
            'lage':    extract_all_before_marker(ab_str, 'Ⓛ') or rs_texts(ab, 'lage'),
            'neben':   rs_texts(ab, 'neben'),
            # Date: normalized form before Ⓓ marker
            'datum':   extract_before_marker(ab_str, 'Ⓓ').split('/')[0].strip(),
            # Price only (not fees)
            'preis':   extract_measure(ab, 'preis'),
        }
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

    out_path.write_text(
        json.dumps(all_records, ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8'
    )
    print(f"\nWrote {len(all_records)} records to {out_path}")
    size_kb = out_path.stat().st_size / 1024
    print(f"Index size: {size_kb:.0f} KB")
    if missing:
        print(f"Note: missing files not indexed: {', '.join(missing)}")

if __name__ == '__main__':
    main()
