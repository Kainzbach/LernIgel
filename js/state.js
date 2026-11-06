/* =====================================================================
   Zustand
   ===================================================================== */
let cur = 0, uid = 0, best = {};
const rowsByTask = {}; const lastScore = {}; const kzState = {};
function getKz(taskId, id) {
  if (!kzState[taskId]) kzState[taskId] = {};
  if (!kzState[taskId][id]) kzState[taskId][id] = { z: '', n: '', s: '', st: null };
  return kzState[taskId][id];
}
function liveText(s) {
  const z = evalExpr(s.z), n = evalExpr(s.n);
  return (z != null && n != null && n !== 0) ? fmtMax(z / n, 5) : '–';
}
try { best = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { best = {}; }
function saveBest() { try { localStorage.setItem(STORE_KEY, JSON.stringify(best)); } catch (e) {} }
const newRow = () => ({ id: ++uid, sign: '', name: '', p1: '', p2: '', amt: '', st: null });
function getRows() {
  const id = TASKS[cur].id;
  if (!rowsByTask[id]) rowsByTask[id] = [newRow(), newRow(), newRow()];
  return rowsByTask[id];
}

