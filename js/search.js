/* Mapping Medieval Vienna – search */

const EDITION_LABELS = {
  'KB-E':       'Kaufbuch E',
  'KB-E2_GB-C': 'Kaufbuch E2 / Gewährbuch C',
  'GB-D':       'Gewährbuch D',
  'GB-E':       'Gewährbuch E',
};

const YEAR_MIN = 1420;
const YEAR_MAX = 1517;

let index = null;

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  const p = new URLSearchParams(location.search);

  if (p.get('q'))       document.getElementById('q-text').value        = p.get('q');
  if (p.get('person'))  document.getElementById('q-person').value      = p.get('person');
  if (p.get('rolle'))   document.getElementById('q-person-rolle').value = p.get('rolle');
  if (p.get('objekt'))  document.getElementById('q-objekt').value      = p.get('objekt');
  if (p.get('lage'))    document.getElementById('q-lage').value        = p.get('lage');

  // Year defaults: only override if param present
  const fromEl = document.getElementById('q-year-from');
  const toEl   = document.getElementById('q-year-to');
  if (p.get('from')) fromEl.value = p.get('from');
  if (p.get('to'))   toEl.value   = p.get('to');

  // Year validation on blur
  fromEl.addEventListener('blur', () => {
    let from = parseInt(fromEl.value) || YEAR_MIN;
    let to   = parseInt(toEl.value)   || YEAR_MAX;
    from = Math.max(YEAR_MIN, Math.min(YEAR_MAX, from));
    if (from > to) to = from;
    fromEl.value = from;
    toEl.value   = to;
  });
  toEl.addEventListener('blur', () => {
    let from = parseInt(fromEl.value) || YEAR_MIN;
    let to   = parseInt(toEl.value)   || YEAR_MAX;
    to = Math.max(YEAR_MIN, Math.min(YEAR_MAX, to));
    if (to < from) from = to;
    fromEl.value = from;
    toEl.value   = to;
  });

  document.getElementById('search-form').addEventListener('submit', e => {
    e.preventDefault();
    runSearch();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    document.getElementById('q-text').value           = '';
    document.getElementById('q-person').value         = '';
    document.getElementById('q-person-rolle').value   = 'alle';
    document.getElementById('q-objekt').value         = '';
    document.getElementById('q-lage').value           = '';
    fromEl.value = YEAR_MIN;
    toEl.value   = YEAR_MAX;
    document.getElementById('results').innerHTML      = '';
    document.getElementById('result-count').textContent = '';
    history.replaceState(null, '', 'search.html');
  });

  loadIndex().then(() => {
    if ([...p.values()].some(v => v)) runSearch();
  });
});

/* ── Load index ── */
function loadIndex() {
  return fetch('data/search-index.json')
    .then(r => {
      if (!r.ok) throw new Error('Index nicht gefunden');
      return r.json();
    })
    .then(data => { index = data; })
    .catch(e => {
      document.getElementById('results').innerHTML =
        '<p class="search-error">Suchindex nicht verfügbar: ' + e.message + '</p>';
    });
}

/* ── Run search ── */
function runSearch() {
  if (!index) return;

  const q        = norm(document.getElementById('q-text').value);
  const qPerson  = norm(document.getElementById('q-person').value);
  const qRolle   = document.getElementById('q-person-rolle').value;
  const qObjekt  = norm(document.getElementById('q-objekt').value);
  const qLage    = norm(document.getElementById('q-lage').value);
  const yearFrom = parseInt(document.getElementById('q-year-from').value) || null;
  const yearTo   = parseInt(document.getElementById('q-year-to').value)   || null;

  // Update URL
  const params = new URLSearchParams();
  if (q)                     params.set('q',      document.getElementById('q-text').value.trim());
  if (qPerson)               params.set('person', document.getElementById('q-person').value.trim());
  if (qPerson && qRolle !== 'alle') params.set('rolle', qRolle);
  if (qObjekt)               params.set('objekt', document.getElementById('q-objekt').value.trim());
  if (qLage)                 params.set('lage',   document.getElementById('q-lage').value.trim());
  // Only store year params if non-default
  if (yearFrom && yearFrom !== YEAR_MIN) params.set('from', yearFrom);
  if (yearTo   && yearTo   !== YEAR_MAX) params.set('to',   yearTo);
  history.replaceState(null, '', 'search.html' + (params.toString() ? '?' + params.toString() : ''));

  // Nothing entered (year defaults don't count as "something entered")
  const anythingEntered = q || qPerson || qObjekt || qLage
    || (yearFrom && yearFrom !== YEAR_MIN)
    || (yearTo   && yearTo   !== YEAR_MAX);
  if (!anythingEntered) {
    document.getElementById('results').innerHTML = '';
    document.getElementById('result-count').textContent = '';
    return;
  }

  const results = index.filter(r => {
    // Year filter
    const year = r.datum ? parseInt(r.datum.split('/')[0].trim().slice(0, 4)) : null;
    if (yearFrom && yearFrom !== YEAR_MIN && (!year || year < yearFrom)) return false;
    if (yearTo   && yearTo   !== YEAR_MAX && (!year || year > yearTo))   return false;

    // Person filter
    if (qPerson) {
      if (!matchesPerson(r, qPerson, qRolle)) return false;
    }

    // Objekt filter (includes neben-IDs)
    if (qObjekt && !matchesObjekt(r, qObjekt)) return false;

    // Lage filter
    if (qLage && !matchesAny(r.lage, qLage)) return false;

    // Free text: von, an, objekt, objIds, lage, neben text, neben IDs
    if (q) {
      const haystack = [
        ...(r.von      || []),
        ...(r.an       || []),
        ...(r.objekt   || []),
        ...(r.objIds   || []),
        ...(r.lage     || []),
        ...(r.neben    || []),
        ...(r.nebenIds || []),
      ].map(norm).join(' ');
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  results.sort((a, b) => {
    const ya = a.datum ? parseInt(a.datum.slice(0, 4)) : -Infinity;
    const yb = b.datum ? parseInt(b.datum.slice(0, 4)) : -Infinity;
    return ya - yb;
  });

  renderResults(results, [q, qPerson, qObjekt, qLage].filter(t => t.length > 0));
}

/* ── Render results ── */
function renderResults(results, activeTerms = []) {
  const countEl   = document.getElementById('result-count');
  const resultsEl = document.getElementById('results');

  if (results.length === 0) {
    countEl.textContent = 'Keine Treffer';
    resultsEl.innerHTML = '';
    return;
  }

  countEl.textContent = results.length === 1 ? '1 Treffer' : results.length + ' Treffer';

  resultsEl.innerHTML = '';
  const MAX   = 200;
  const shown = results.slice(0, MAX);

  shown.forEach(r => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const viewerUrl = `viewer.html?e=${r.edition}#${r.page}`;

    let html = `<div class="result-header">`;
    html += `<a class="result-id" href="${viewerUrl}">${esc(r.id)}</a>`;
    html += `<span class="result-edition">${esc(EDITION_LABELS[r.edition] || r.edition)}</span>`;
    if (r.page) html += `<span class="result-page">S. ${esc(r.page)}</span>`;
    html += `</div><dl class="result-fields">`;

    const joinArr = (v) => Array.isArray(v) ? v.map(String).join('; ') : String(v ?? '');

    if (r.von?.length)    html += field('Von',    joinArr(r.von));
    if (r.an?.length)     html += field('An',     joinArr(r.an));
    if (r.objekt?.length) {
      const objTxt = joinArr(r.objekt);
      const objIds = (r.objIds || []).map(id => `<span class="obj-id">${esc(String(id))}</span>`).join(' ');
      html += field('Objekt', objTxt, objIds ? ' ' + objIds : '');
    }
    if (r.lage?.length)   html += field('Lage',   joinArr(r.lage));
    if (r.neben?.length)  html += field('Neben',  joinArr(r.neben));
    if (r.datum)          html += field('Datum',  String(r.datum));
    if (r.preis?.length)  {
      const preisArr = Array.isArray(r.preis) ? r.preis : [r.preis];
      html += field('Preis', preisArr.map(v => esc(String(v))).join('<br>'), '', true);
    }

    html += `</dl>`;
    card.innerHTML = html;
    highlightCard(card, activeTerms);
    resultsEl.appendChild(card);
  });

  if (results.length > MAX) {
    const note = document.createElement('p');
    note.className = 'result-truncated';
    note.textContent = `Nur die ersten ${MAX} von ${results.length} Treffern werden angezeigt. Bitte Suche einschränken.`;
    resultsEl.appendChild(note);
  }
}

function field(label, value, extra = '', raw = false) {
  const val = raw ? value : esc(value);
  return `<div class="result-field"><dt>${label}</dt><dd>${val}${extra}</dd></div>`;
}

/* ── Helpers ── */
function norm(s) {
  return (s || '').toLowerCase().trim();
}

function matchesAny(arr, q) {
  if (!arr || !arr.length) return false;
  return arr.some(v => norm(v).includes(q));
}

/**
 * Person search:
 * - "alle": von + an + neben-Text
 * - "von":  only von
 * - "an":   only an
 * - "neben": only neben-Text
 */
function matchesPerson(r, q, rolle) {
  switch (rolle) {
    case 'von':   return matchesAny(r.von, q);
    case 'an':    return matchesAny(r.an,  q);
    case 'neben': return matchesAny(r.neben, q);
    default:      // "alle"
      return matchesAny(r.von, q) || matchesAny(r.an, q) || matchesAny(r.neben, q);
  }
}

/**
 * Objekt search: text + own ID + neben-IDs
 */
function matchesObjekt(r, q) {
  if (matchesAny(r.objekt, q)) return true;
  if (r.objIds && r.objIds.some(id => norm(id).includes(q))) return true;
  if (r.nebenIds && r.nebenIds.some(id => norm(id).includes(q))) return true;
  return false;
}

function esc(s) {
  return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/**
 * Highlight all activeTerms in the text nodes of <dd> elements within a card.
 * Works on the DOM after innerHTML is set, so it's safe with existing HTML structure.
 */
function highlightCard(card, activeTerms) {
  if (!activeTerms.length) return;
  // Build a single regex that matches any of the terms (case-insensitive)
  const escaped = activeTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp('(' + escaped.join('|') + ')', 'gi');

  card.querySelectorAll('dd').forEach(dd => {
    highlightTextNodes(dd, re);
  });
}

function highlightTextNodes(node, re) {
  // Walk child nodes; replace text nodes that match
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeType === 3) { // text node
      const text = child.textContent;
      if (re.test(text)) {
        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0, m;
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const mark = document.createElement('mark');
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.replaceChild(frag, child);
      }
      re.lastIndex = 0;
    } else if (child.nodeType === 1 && child.tagName !== 'MARK') {
      highlightTextNodes(child, re);
    }
  }
}
