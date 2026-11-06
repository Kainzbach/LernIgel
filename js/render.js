/* =====================================================================
   Darstellung
   ===================================================================== */
// Rundungshinweis automatisch aus den verlangten Kennzahlen
// Zahl und Einheit (%, €) dürfen nicht durch einen Zeilenumbruch getrennt werden
const nb = str => String(str).replace(/(\d) (%|€)/g, '$1\u00A0$2');
function roundingHint(t) {
  const by = {};
  (t.kz || []).forEach(id => { const d = KZ[id]; (by[d.dec] = by[d.dec] || []).push(d.title); });
  const part = Object.keys(by).sort((a, b) => a - b).map(dec => {
    const names = by[dec]; const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' und ' + names[names.length - 1] : names[0];
    return list + ' auf ' + dec + ' Nachkommastellen';
  });
  return part.length ? 'Rundung: ' + part.join(', ') + '.' : '';
}
// Allgemeine Datentabelle in der Aufgabe: { head: [...], rows: [[...], ...] }; erste Spalte links, weitere rechtsbündig
function dataTableHtml(d) {
  const th = d.head.map((h, i) => `<th${i ? ' class="n"' : ''}>${esc(nb(h))}</th>`).join('');
  const tr = d.rows.map(r => '<tr>' + r.map((c, i) => `<td${i ? ' class="n"' : ''}>${esc(nb(c))}</td>`).join('') + '</tr>').join('');
  return `<table class="datatab"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}
function kontoHtml(k) {
  const f = v => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const n = Math.max(k.soll.length, k.haben.length);
  const sum = k.haben.reduce((x, y) => x + y[1], 0);
  const side = (name, list, cls) => {
    let rows = '';
    list.forEach(a => { rows += `<tr><td>${esc(a[0])}</td><td class="n">${f(a[1])}</td></tr>`; });
    rows += `<tr class="sum"><td></td><td class="n">${f(sum)}</td></tr>`;
    return `<table class="konto-side ${cls}"><thead><tr><th colspan="2">${name}</th></tr></thead><tbody>${rows}</tbody></table>`;
  };
  // Breite Ansicht: eine Tabelle mit 4 Spalten, Zeilen von Soll und Haben liegen immer auf gleicher Höhe
  let wr = '';
  for (let i = 0; i < n; i++) {
    const a = k.soll[i], b = k.haben[i];
    wr += `<tr><td class="lb">${a ? esc(a[0]) : ''}</td><td class="n">${a ? f(a[1]) : ''}</td><td class="lb hv">${b ? esc(b[0]) : ''}</td><td class="n">${b ? f(b[1]) : ''}</td></tr>`;
  }
  wr += `<tr class="sum"><td></td><td class="n">${f(sum)}</td><td class="hv"></td><td class="n">${f(sum)}</td></tr>`;
  const wide = `<table class="konto-wide"><colgroup><col style="width:37%"><col style="width:20%"><col style="width:23%"><col style="width:20%"></colgroup><thead><tr><th colspan="2">Soll</th><th colspan="2" class="hv">Haben</th></tr></thead><tbody>${wr}</tbody></table>`;
  return `<div class="konto"><div class="konto-title">${esc(k.title)} <span style="font-weight:400">(Beträge in €)</span></div>${wide}<div class="konto-grid">${side('Soll', k.soll, 'so')}${side('Haben', k.haben, 'ha')}</div></div>`;
}
function renderTabs() {
  $('tabs').innerHTML = TASKS.map((t, i) => {
    const b = best[t.id];
    return `<button class="tab ${i === cur ? 'active' : ''}" data-i="${i}">${i + 1}. ${esc(t.title)}<small>${b != null ? 'Bestes Ergebnis: ' + b + ' %' : 'noch nicht bearbeitet'}</small></button>`;
  }).join('');
  document.querySelectorAll('.tab').forEach(el => el.addEventListener('click', () => { cur = +el.dataset.i; renderAll(); }));
}
function rowHtml(r) {
  const st = r.st || {};
  const opts = [['', 'leer'], ['+', '+'], ['-', '−'], ['=', '=']]
    .map(([v, l]) => `<option value="${v}"${r.sign === v ? ' selected' : ''}>${l}</option>`).join('');
  return `<tr data-id="${r.id}">
    <td class="c-vz"><select class="vz ${st.sign || ''}${r.sign === '' ? ' vz-empty' : ''}" aria-label="Vorzeichen">${opts}</select></td>
    <td class="c-nm"><input class="nm ${st.name || ''}" placeholder="Bezeichnung" value="${esc(r.name)}" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Bezeichnung"></td>
    <td class="c-p c-p1"><input class="p1" placeholder="%" inputmode="decimal" value="${esc(r.p1)}" autocomplete="off" aria-label="Prozent links"></td>
    <td class="c-p c-p2"><input class="p2" placeholder="%" inputmode="decimal" value="${esc(r.p2)}" autocomplete="off" aria-label="Prozent rechts"></td>
    <td class="c-amt"><input class="amt ${st.amt || ''}" placeholder="Betrag" inputmode="decimal" value="${esc(r.amt)}" autocomplete="off" aria-label="Betrag"></td>
    <td class="c-act"><button class="ico up" title="Zeile darüber einfügen">+↑</button> <button class="ico del" title="Zeile löschen">✕</button></td>
  </tr>`;
}
function renderTable(focusId) {
  $('rows').innerHTML = getRows().map(rowHtml).join('');
  fitNameCol();
  if (focusId) {
    const el = document.querySelector(`tr[data-id="${focusId}"] .nm`);
    if (el) el.focus();
  }
}
// Bezeichnungsspalte so breit wie der längste eingegebene Name (min. 7 Zeichen, max. so breit wie "Handlungskostenzuschlag")
let measureCtx = null;
function fitNameCol() {
  const inp = document.querySelector('#rows .nm');
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  let font = '16px system-ui, sans-serif';
  if (inp) { const cs = getComputedStyle(inp); font = `${cs.fontSize} ${cs.fontFamily}`; }
  measureCtx.font = font;
  const w = s => measureCtx.measureText(s).width;
  let longest = 0;
  getRows().forEach(r => { longest = Math.max(longest, w(r.name)); });
  const px = Math.ceil(Math.min(Math.max(longest, w('MMMMMMM')), w('Handlungskostenzuschlag'))) + 28;
  $('col-nm').style.width = px + 'px';
  // Schmale Fläche (z. B. Laptop mit kleinem Fenster): feste Spalten enger, damit nicht gewischt werden muss
  const wrap = $('sheet').parentElement; const avail = wrap ? wrap.clientWidth : 9999;
  const np = $('sheet').classList.contains('nopct');
  const c = (avail && avail < 700) ? { vz: 66, p: 62, amt: 112, act: 68 } : { vz: 78, p: 84, amt: 140, act: 84 };
  const sh = $('sheet');
  sh.style.setProperty('--w-vz', c.vz + 'px'); sh.style.setProperty('--w-p', c.p + 'px'); sh.style.setProperty('--w-amt', c.amt + 'px'); sh.style.setProperty('--w-act', c.act + 'px');
  sh.style.setProperty('--tw', (c.vz + px + (np ? 0 : 2 * c.p) + c.amt + c.act) + 'px');
}
const PCT_KEY = 'ksk-lernapp-pct';
function setPct(on) {
  $('sheet').classList.toggle('nopct', !on); $('pct-toggle').checked = on;
  try { localStorage.setItem(PCT_KEY, on ? '1' : '0'); } catch (e) {}
  try { fitNameCol(); } catch (e) {}
}
$('pct-toggle').addEventListener('change', e => setPct(e.target.checked));
try { if (localStorage.getItem(PCT_KEY) === '0') setPct(false); } catch (e) {}
let resizeT = null;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { try { fitNameCol(); } catch (e) {} }, 120); });
function renderKz() {
  const t = normTask(TASKS[cur]);
  const kzParts = t.parts.filter(p => p.kz && p.kz.length);
  $('kz-card').style.display = kzParts.length ? '' : 'none';
  $('kz-list').innerHTML = kzParts.map(p => {
    const multi = p.kz.length > 1;
    const title = partTitle(p);
    const head = title ? `<h3 class="part-title">${esc(title)}</h3>` : '';
    const blocks = p.kz.map(id => {
      const d = KZ[id]; const s = getKz(t.id, id); const st = s.st || {};
      const sub = multi ? `<h4 class="kz-sub">${esc(d.title)}</h4>` : (head ? '' : `<h3>${esc(d.title)}</h3>`);
      return `<div class="kz" data-kz="${id}">
      ${sub}
      <div class="frac">
        <div class="parts">
          <input data-f="z" class="${st.z || ''}" value="${esc(s.z)}" placeholder="Zähler" autocomplete="off" spellcheck="false" aria-label="Zähler ${esc(d.title)}">
          <div class="bar"></div>
          <input data-f="n" class="${st.n || ''}" value="${esc(s.n)}" placeholder="Nenner" autocomplete="off" spellcheck="false" aria-label="Nenner ${esc(d.title)}">
        </div>
        <div class="eq">= <span class="live">${liveText(s)}</span></div>
      </div>
      <div class="sent"><span class="lbl">${esc(d.sentence)}</span> <input data-f="s" class="${st.s || ''}" value="${esc(s.s)}" inputmode="decimal" autocomplete="off" aria-label="Ergebnis ${esc(d.title)}"> <span class="unit">${esc(d.unit)}</span></div>
    </div>`;
    }).join('');
    return `<div class="card">${head}${blocks}</div>`;
  }).join('');
}
function renderResult() {
  const t = normTask(TASKS[cur]);
  const res = lastScore[t.id];
  $('result').classList.toggle('show', !!res);
  $('res-table-wrap').style.display = t.noTable ? 'none' : '';
  $('legend').textContent = t.noTable
    ? 'Bei Kennzahlen zählen Zähler, Nenner und Ergebnis je 1 Punkt. Ein Wert, der aus Ihren eigenen Vorwerten folgerichtig berechnet ist, zählt als richtig (gelb).'
    : 'Pro Tabellenzeile gibt es 4 Punkte: Bezeichnung, Vorzeichen, Betrag, Reihenfolge. Bei Kennzahlen zählen Zähler, Nenner und Ergebnis je 1 Punkt. Ein Wert, der aus Ihren eigenen Vorwerten folgerichtig berechnet ist, zählt als richtig (gelb). Prozente in der Tabelle sind nur eine Hilfe und fließen nicht in die Punkte ein.';
  const tp = t.parts.find(p => p.table);
  const tt = tp ? partTitle(tp) : '';
  $('res-table-title').textContent = tt; $('res-table-title').style.display = tt ? '' : 'none';
  if (res) {
    $('score-big').textContent = res.pts + ' von ' + res.max + ' Punkten (' + res.pct + ' %)';
    $('score-note').textContent = grade(res.pct);
    $('score-bar').style.width = res.pct + '%';
    $('score-parts').innerHTML = (res.parts || []).filter(x => x.title).map(x => `<span class="${x.pts === x.max ? 't-ok' : ''}">${esc(x.title)}: ${x.pts} von ${x.max}</span>`).join('');
    $('res-rows').innerHTML = res.rowsHtml;
    $('res-kz').innerHTML = res.kzHtml || '';
    $('res-notes').innerHTML = res.notesHtml;
  }
}
function renderAll() {
  const t = normTask(TASKS[cur]);
  renderTabs();
  $('task-text').innerHTML = t.text.split(/(\{\{konto\}\}|\{\{tabelle\}\})/).map(seg =>
    seg === '{{konto}}' ? (t.konto ? kontoHtml(t.konto) : '') : seg === '{{tabelle}}' ? (t.tabelle ? dataTableHtml(t.tabelle) : '') : esc(nb(seg))).join('');
  $('task-hint').textContent = roundingHint(t);
  const tp = t.parts.find(p => p.table);
  const tt = tp ? partTitle(tp) : '';
  $('table-title').textContent = tt; $('table-title').style.display = tt ? '' : 'none';
  $('table-card').style.display = t.noTable ? 'none' : '';
  renderTable();
  renderKz();
  renderResult();
}

