/* Mapping Medieval Vienna – search */

const EDITION_LABELS = {
  'KB-E':       'Kaufbuch E',
  'KB-E2_GB-C': 'Kaufbuch E2 / Gewährbuch C',
  'GB-D':       'Gewährbuch D',
  'GB-E':       'Gewährbuch E',
};

let index = null;

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill from URL params
  const p = new URLSearchParams(location.search);
  if (p.get('q'))         document.getElementById('q-text').value    = p.get('q');
  if (p.get('von'))       document.getElementById('q-von').value     = p.get('von');
  if (p.get('an'))        document.getElementById('q-an').value      = p.get('an');
  if (p.get('objekt'))    document.getElementById('q-objekt').value  = p.get('objekt');
  if (p.get('lage'))      document.getElementById('q-lage').value    = p.get('lage');
  if (p.get('neben'))     document.getElementById('q-neben').value   = p.get('neben');
  if (p.get('from'))      document.getElementById('q-year-from').value = p.get('from');
  if (p.get('to'))        document.getElementById('q-year-to').value   = p.get('to');

  document.getElementById('search-form').addEventListener('submit', e => {
    e.preventDefault();
    runSearch();
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    document.getElementById('search-form').reset();
    document.getElementById('results').innerHTML = '';
    document.getElementById('result-count').textContent = '';
    history.replaceState(null, '', 'search.html');
  });

  // Load index then run if params present
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
  const qVon     = norm(document.getElementById('q-von').value);
  const qAn      = norm(document.getElementById('q-an').value);
  const qObjekt  = norm(document.getElementById('q-objekt').value);
  const qLage    = norm(document.getElementById('q-lage').value);
  const qNeben   = norm(document.getElementById('q-neben').value);
  const yearFrom = parseInt(document.getElementById('q-year-from').value) || null;
  const yearTo   = parseInt(document.getElementById('q-year-to').value)   || null;

  // Update URL
  const params = new URLSearchParams();
  if (q)       params.set('q',      document.getElementById('q-text').value.trim());
  if (qVon)    params.set('von',    document.getElementById('q-von').value.trim());
  if (qAn)     params.set('an',     document.getElementById('q-an').value.trim());
  if (qObjekt) params.set('objekt', document.getElementById('q-objekt').value.trim());
  if (qLage)   params.set('lage',   document.getElementById('q-lage').value.trim());
  if (qNeben)  params.set('neben',  document.getElementById('q-neben').value.trim());
  if (yearFrom) params.set('from',  yearFrom);
  if (yearTo)   params.set('to',    yearTo);
  history.replaceState(null, '', 'search.html?' + params.toString());

  // Nothing entered
  if (!q && !qVon && !qAn && !qObjekt && !qLage && !qNeben && !yearFrom && !yearTo) {
    document.getElementById('results').innerHTML = '';
    document.getElementById('result-count').textContent = '';
    return;
  }

  const results = index.filter(r => {
    // Year filter
    const year = r.datum ? parseInt(r.datum.split('/')[0].trim().slice(0, 4)) : null;
    if (yearFrom && (!year || year < yearFrom)) return false;
    if (yearTo   && (!year || year > yearTo))   return false;

    // Field-specific filters
    if (qVon    && !matchesAny(r.von,    qVon))    return false;
    if (qAn     && !matchesAny(r.an,     qAn))     return false;
    if (qObjekt && !matchesObjekt(r, qObjekt))      return false;
    if (qLage   && !matchesAny(r.lage,   qLage))   return false;
    if (qNeben  && !matchesAny(r.neben,  qNeben))  return false;

    // Free text: search across von, an, objekt, objId, lage, neben
    if (q) {
      const haystack = [
        ...(r.von    || []),
        ...(r.an     || []),
        ...(r.objekt || []),
        r.objId || '',
        ...(r.lage   || []),
        ...(r.neben  || []),
      ].map(norm).join(' ');
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  renderResults(results);
}

/* ── Render results ── */
function renderResults(results) {
  const countEl = document.getElementById('result-count');
  const resultsEl = document.getElementById('results');

  if (results.length === 0) {
    countEl.textContent = 'Keine Treffer';
    resultsEl.innerHTML = '';
    return;
  }

  countEl.textContent = results.length === 1 ? '1 Treffer' : results.length + ' Treffer';

  resultsEl.innerHTML = '';
  const MAX = 200;
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

    if (r.von?.length)    html += field('Von',    r.von.join('; '));
    if (r.an?.length)     html += field('An',     r.an.join('; '));
    if (r.objekt?.length) {
      const objTxt = r.objekt.join('; ');
      const objId  = r.objId ? ` <span class="obj-id">${esc(r.objId)}</span>` : '';
      html += field('Objekt', objTxt, objId);
    }
    if (r.lage?.length)   html += field('Lage',   r.lage.join('; '));
    if (r.neben?.length)  html += field('Neben',  r.neben.join('; '));
    if (r.datum)          html += field('Datum',  r.datum);
    if (r.preis)          html += field('Preis',  r.preis);

    html += `</dl>`;
    card.innerHTML = html;
    resultsEl.appendChild(card);
  });

  if (results.length > MAX) {
    const note = document.createElement('p');
    note.className = 'result-truncated';
    note.textContent = `Nur die ersten ${MAX} von ${results.length} Treffern werden angezeigt. Bitte Suche einschränken.`;
    resultsEl.appendChild(note);
  }
}

function field(label, value, extra = '') {
  return `<div class="result-field"><dt>${label}</dt><dd>${esc(value)}${extra}</dd></div>`;
}

/* ── Helpers ── */
function norm(s) {
  return (s || '').toLowerCase().trim();
}
function matchesAny(arr, q) {
  if (!arr || !arr.length) return false;
  return arr.some(v => norm(v).includes(q));
}
function matchesObjekt(r, q) {
  // Match against objekt text OR objId
  if (matchesAny(r.objekt, q)) return true;
  if (r.objId && norm(r.objId).includes(q)) return true;
  return false;
}
function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
