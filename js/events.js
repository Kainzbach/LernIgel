/* =====================================================================
   Ereignisse
   ===================================================================== */
const partOf = el => { const c = el.closest('.tcard'); return c ? +c.dataset.part : -1; };
function onEdit(e) {
  const tr = e.target.closest('tr'); if (!tr) return;
  const pi = partOf(tr); if (pi < 0) return;
  const r = getRows(pi).find(x => String(x.id) === tr.dataset.id); if (!r) return;
  const c = e.target.classList;
  if (c.contains('vz')) { r.sign = e.target.value; e.target.classList.toggle('vz-empty', r.sign === ''); }
  else if (c.contains('nm')) { r.name = e.target.value; fitNameCol(tr.closest('.tcard')); }
  else if (c.contains('p1')) r.p1 = e.target.value;
  else if (c.contains('p2')) r.p2 = e.target.value;
  else if (c.contains('amt')) r.amt = e.target.value;
  else return;
  r.st = null;
  tr.querySelectorAll('.ok,.bad,.follow,.neutral').forEach(el => el.classList.remove('ok', 'bad', 'follow', 'neutral'));
}
const PARTS = $('parts');
PARTS.addEventListener('input', e => {
  onEdit(e);
  const el = e.target;
  if (el.dataset.vr != null && el.closest('.vr')) { const id = TASKS[cur].id; (vrByTask[id] = vrByTask[id] || [])[+el.dataset.vr] = el.value; el.parentElement.querySelector('.live').textContent = '= ' + vrLive(el.value); return; }
  const box = el.closest('.kz');
  if (box && el.dataset.f) {
    const s = getKz(TASKS[cur].id, box.dataset.kz);
    s[el.dataset.f] = el.value; s.st = null;
    box.querySelectorAll('input').forEach(i => i.classList.remove('ok', 'bad', 'follow'));
    const lv = box.querySelector('.live'); if (lv) lv.textContent = liveText(s);
  }
});
PARTS.addEventListener('change', e => { if (e.target.classList.contains('pct-cb')) { setPct(e.target.checked); return; } onEdit(e); });
PARTS.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const card = b.closest('.tcard'); if (!card) return;
  const pi = +card.dataset.part;
  if (b.classList.contains('alt-b')) {
    const m = b.dataset.alt; altChoice[TASKS[cur].id + '#' + pi] = m;
    card.querySelectorAll('.alt-b').forEach(x => x.classList.toggle('on', x === b));
    card.querySelector('.alt-kw').hidden = m !== 'kw'; card.querySelector('.alt-tab').hidden = m === 'kw'; if (m === 'table') fitNameCol(card);
    return;
  }
  if (b.classList.contains('btn-top')) { const nr = newRow(); getRows(pi).unshift(nr); renderTable(pi, nr.id); return; }
  if (b.classList.contains('btn-bottom')) { const nr = newRow(); getRows(pi).push(nr); renderTable(pi, nr.id); return; }
  if (b.classList.contains('btn-fill')) {
    const t = TASKS[cur]; normTask(t); const p = t.parts[pi]; if (!p || !p.table) return;
    const rows = getRows(pi);
    if (rows.some(r => r.name.trim() || r.amt.trim()) && !(await ask('Die vorhandenen Zeilen dieses Teils durch das leere Schema ersetzen?', 'Ersetzen'))) return;
    const ks = partKeys(t, p); if (b.dataset.dir === 'up') ks.reverse();
    const list = ks.map(k => { const r = newRow(); r.name = SCH[k].alias[0]; return r; });
    rowsByTask[rowsKey(t, pi)] = list; renderTable(pi); return;
  }
  const tr = b.closest('tr'); if (!tr) return;
  const rows = getRows(pi);
  const i = rows.findIndex(x => String(x.id) === tr.dataset.id); if (i < 0) return;
  if (b.classList.contains('del')) {
    rows.splice(i, 1);
    if (!rows.length) rows.push(newRow());
    renderTable(pi);
  } else if (b.classList.contains('up')) {
    const nr = newRow(); rows.splice(i, 0, nr); renderTable(pi, nr.id);
  }
});
$('btn-check').addEventListener('click', check);
$('result').addEventListener('click', e => {
  const b = e.target.closest('.reveal'); if (!b) return;
  const box = b.closest('tr, .wayBox'); if (!box) return;
  box.querySelectorAll('.rv').forEach(x => { x.hidden = false; }); b.remove();
  const id = TASKS[cur].id; if (!prog.help[id]) { prog.help[id] = 1; prog.dirty = true; saveProg(); }
  const h = $('res-help'); h.textContent = 'Aufgedeckt: Spätere Verbesserungen zählen weiter, werden im Menü aber gelb mit ↻ markiert.'; h.hidden = false;
});
$('btn-reset').addEventListener('click', async () => {
  if (!(await ask('Alle Eingaben dieser Aufgabe löschen?', 'Löschen'))) return;
  const id = TASKS[cur].id; Object.keys(rowsByTask).forEach(k => { if (k === id || k.startsWith(id + '#')) delete rowsByTask[k]; }); delete vrByTask[id]; delete lastScore[id]; delete kzState[id]; renderAll();
});

