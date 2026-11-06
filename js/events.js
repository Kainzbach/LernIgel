/* =====================================================================
   Ereignisse
   ===================================================================== */
function onEdit(e) {
  const tr = e.target.closest('tr'); if (!tr) return;
  const r = getRows().find(x => String(x.id) === tr.dataset.id); if (!r) return;
  const c = e.target.classList;
  if (c.contains('vz')) { r.sign = e.target.value; e.target.classList.toggle('vz-empty', r.sign === ''); }
  else if (c.contains('nm')) { r.name = e.target.value; fitNameCol(); }
  else if (c.contains('p1')) r.p1 = e.target.value;
  else if (c.contains('p2')) r.p2 = e.target.value;
  else if (c.contains('amt')) r.amt = e.target.value;
  else return;
  r.st = null;
  tr.querySelectorAll('.ok,.bad,.follow,.neutral').forEach(el => el.classList.remove('ok', 'bad', 'follow', 'neutral'));
}
$('rows').addEventListener('input', onEdit);
$('rows').addEventListener('change', onEdit);
$('rows').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const tr = b.closest('tr'); const rows = getRows();
  const i = rows.findIndex(x => String(x.id) === tr.dataset.id); if (i < 0) return;
  if (b.classList.contains('del')) {
    rows.splice(i, 1);
    if (!rows.length) rows.push(newRow());
    renderTable();
  } else if (b.classList.contains('up')) {
    const nr = newRow(); rows.splice(i, 0, nr); renderTable(nr.id);
  }
});
$('btn-top').addEventListener('click', () => { const nr = newRow(); getRows().unshift(nr); renderTable(nr.id); });
$('btn-bottom').addEventListener('click', () => { const nr = newRow(); getRows().push(nr); renderTable(nr.id); });
$('btn-check').addEventListener('click', check);
$('btn-reset').addEventListener('click', async () => {
  if (!(await ask('Alle Eingaben dieser Aufgabe löschen?', 'Löschen'))) return;
  const id = TASKS[cur].id; delete rowsByTask[id]; delete lastScore[id]; delete kzState[id]; renderAll();
});

// Kennzahl-Felder
$('kz-list').addEventListener('input', e => {
  const el = e.target; const box = el.closest('.kz');
  if (!box || !el.dataset.f) return;
  const s = getKz(TASKS[cur].id, box.dataset.kz);
  s[el.dataset.f] = el.value; s.st = null;
  box.querySelectorAll('input').forEach(i => i.classList.remove('ok', 'bad', 'follow'));
  box.querySelector('.live').textContent = liveText(s);
});

