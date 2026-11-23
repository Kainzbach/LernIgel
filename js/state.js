/* =====================================================================
   Zustand
   ===================================================================== */
let cur = 0,
  uid = 0,
  best = {};
const vrByTask = {};
const rowsByTask = {};
const lastScore = {};
const kzState = {};
function getKz(taskId, id) {
  if (!kzState[taskId]) kzState[taskId] = {};
  if (!kzState[taskId][id]) kzState[taskId][id] = { z: '', n: '', s: '', st: null };
  return kzState[taskId][id];
}
function liveText(s) {
  const z = evalExpr(s.z),
    n = evalExpr(s.n);
  return z != null && n != null && n !== 0 ? fmtMax(z / n, 5) : '–';
}
try {
  best = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
} catch (e) {
  best = {};
}
const SET_KEY = 'ksk-lernigel-set',
  HELP_MIN = 5;
let settings = { help: false, theme: 'auto' };
try {
  const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null');
  if (s && typeof s === 'object') settings = Object.assign(settings, s);
} catch (e) {}
// Darstellung: Hell, Dunkel oder nach Geräteeinstellung (Automatisch)
const darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function applyTheme() {
  const t = settings.theme;
  const dark = t === 'dark' || (t !== 'light' && darkMq && darkMq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
applyTheme();
if (darkMq && darkMq.addEventListener) darkMq.addEventListener('change', applyTheme);
const doneCount = () => Object.keys(best).length;
const helpAvailable = () => doneCount() >= HELP_MIN;
const helpOn = () => settings.help && helpAvailable();
function saveSettings() {
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(settings));
  } catch (e) {}
}
const PROG_KEY = 'ksk-lernigel-v2';
let prog = { help: {}, dirty: false };
try {
  const p = JSON.parse(localStorage.getItem(PROG_KEY) || 'null');
  if (p && typeof p === 'object') prog = Object.assign(prog, p);
} catch (e) {}
function saveProg() {
  try {
    localStorage.setItem(PROG_KEY, JSON.stringify(prog));
  } catch (e) {}
}
function hasDraft(id) {
  const rows = Object.keys(rowsByTask)
      .filter(k => k === id || k.startsWith(id + '#'))
      .map(k => rowsByTask[k])
      .reduce((a, x) => a.concat(x), []),
    kz = kzState[id];
  return !!(
    (rows && rows.some(r => r.name.trim() || r.amt.trim())) ||
    (kz && Object.values(kz).some(s => s.z.trim() || s.n.trim() || s.s.trim())) ||
    (vrByTask[id] || []).some(x => String(x).trim())
  );
}
const tone = p => (p >= 92 ? 'g' : p >= 50 ? 'y' : 'r');
function statusOf(id) {
  const b = best[id];
  if (b != null)
    return prog.help[id]
      ? { cls: 'h', text: 'Bestwert ' + b + ' % ↻' }
      : { cls: tone(b), text: 'Bestwert ' + b + ' %' };
  if (hasDraft(id)) return { cls: 'draft', text: 'Entwurf' };
  return { cls: '', text: 'offen' };
}
// Zähler für zufällige Aufgaben eines Bereichs
function randStats(area) {
  const pre = area === 'kennzahlen' ? 'z-kz_' : 'z-' + area + '-';
  const ids = Object.keys(best).filter(id => id.startsWith(pre));
  const ok = ids.filter(id => best[id] === 100).length;
  // Reihenfolge der Abgabe = Reihenfolge der gespeicherten Einträge; recent = Prozentwerte der letzten 10
  return { n: ids.length, ok, recent: ids.slice(-10).map(id => best[id]) };
}
const isRandom = t => String(t.id).startsWith('z-');
function saveBest() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(best));
  } catch (e) {}
}
const newRow = () => ({ id: ++uid, sign: '', name: '', p1: '', p2: '', amt: '', st: null });
let curPart = 0;
const tableParts = t => (t.parts || []).filter(p => p.table).length;
const rowsKey = (t, i) => (tableParts(t) > 1 ? t.id + '#' + i : t.id);
function getRows(i) {
  const t = TASKS[cur];
  normTask(t);
  const key = rowsKey(t, i == null ? curPart : i);
  if (!rowsByTask[key]) rowsByTask[key] = [newRow(), newRow(), newRow()];
  return rowsByTask[key];
}
