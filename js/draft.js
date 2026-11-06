/* =====================================================================
   Entwurf speichern (Handy und Computer, nur auf diesem Gerät)
   ===================================================================== */
const DRAFT_KEY = 'ksk-lernapp-draft';
let saveTimer = null;
function saveDraft() {
  try {
    const d = { cur, tasks: {} };
    TASKS.forEach(t => {
      const rows = rowsByTask[t.id], kz = kzState[t.id];
      if (!rows && !kz) return;
      d.tasks[t.id] = {
        rows: (rows || []).map(r => ({ sign: r.sign, name: r.name, p1: r.p1, p2: r.p2, amt: r.amt })),
        kz: Object.fromEntries(Object.entries(kz || {}).map(([k, v]) => [k, { z: v.z, n: v.n, s: v.s }]))
      };
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch (e) {}
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 300); }
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!d || !d.tasks) return;
    TASKS.forEach((t, i) => {
      const x = d.tasks[t.id]; if (!x) return;
      if (Array.isArray(x.rows) && x.rows.length) {
        rowsByTask[t.id] = x.rows.slice(0, 60).map(r => Object.assign(newRow(), { sign: String(r.sign || ''), name: String(r.name || ''), p1: String(r.p1 || ''), p2: String(r.p2 || ''), amt: String(r.amt || '') }));
      }
      Object.entries(x.kz || {}).forEach(([id, v]) => { if (KZ[id]) Object.assign(getKz(t.id, id), { z: String(v.z || ''), n: String(v.n || ''), s: String(v.s || '') }); });
    });
    if (Number.isInteger(d.cur) && d.cur >= 0 && d.cur < TASKS.length) cur = d.cur;
  } catch (e) {}
}
document.addEventListener('input', scheduleSave);
document.addEventListener('change', scheduleSave);
document.addEventListener('click', () => setTimeout(scheduleSave, 0));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveDraft(); });
window.addEventListener('pagehide', saveDraft);

loadDraft();
renderAll();
