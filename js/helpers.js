/* =====================================================================
   Hilfsfunktionen
   ===================================================================== */
const TOL = 0.02; // erlaubte Abweichung in Euro (überall)
// Alte, nicht mehr ganz richtige Bezeichnungen: zählen, geben aber gelb und 1 Punkt Abzug
const WEAK = { 'Handlungskosten': 'HK', 'HK': 'HK', 'Gewinn': 'G', 'G': 'G' };
const STORE_KEY = 'ksk-lernapp-best';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const normSign = s => (s === '' || s == null) ? '=' : s;
const signLabel = s => s === '-' ? '−' : s;

function parseNum(s) {
  if (s == null) return NaN;
  s = String(s).trim().replace(/[\s€%]/g, '').replace('−', '-');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
}
function fmt(v) { return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function fmtPct(v) { return v.toLocaleString('de-DE', { maximumFractionDigits: 2 }); }
function fmtDec(v, dec) { return v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
function fmtMax(v, dec) { return v.toLocaleString('de-DE', { maximumFractionDigits: dec }); }

// Rechnet eine Eingabe aus: Zahl oder einfache Rechnung wie (73,75-40,50)*100. Gibt null zurück, wenn ungültig.
function evalExpr(s) {
  if (s == null) return null;
  s = String(s).trim();
  if (!s) return null;
  s = s.replace(/−/g, '-').replace(/[×xX]/g, '*').replace(/[÷:]/g, '/').replace(/%/g, '/100').replace(/\s+/g, '');
  let bad = false;
  s = s.replace(/\d[\d.,]*/g, t => { const n = parseNum(t); if (isNaN(n)) bad = true; return '(' + n + ')'; });
  if (bad || !/^[\d.+\-*/()]+$/.test(s)) return null;
  try {
    const v = Function('"use strict"; return (' + s + ');')();
    return typeof v === 'number' && isFinite(v) ? v : null;
  } catch (e) { return null; }
}
function grade(p) {
  if (p >= 92) return 'Note 1 (sehr gut)';
  if (p >= 81) return 'Note 2 (gut)';
  if (p >= 67) return 'Note 3 (befriedigend)';
  if (p >= 50) return 'Note 4 (ausreichend)';
  if (p >= 30) return 'Note 5 (mangelhaft)';
  return 'Note 6 (ungenügend)';
}
function truthExact(task) { EXACT = true; try { return truth(task); } finally { EXACT = false; } }
function truth(task) {
  const t = {}; const u = k => t[k];
  task.steps.forEach(s => { t[s[0]] = s[1](u); });
  return t;
}
function followVals(task, key, userVals, tr) {
  const u = k => (userVals[k] != null && !isNaN(userVals[k])) ? userVals[k] : tr[k];
  const step = task.steps.find(s => s[0] === key);
  return [step[1]].concat(step[2] || []).map(f => f(u));
}
const partTitle = p => ((p.label ? p.label + ' ' : '') + (p.title || '')).trim();
// Teilaufgaben ableiten, falls eine Aufgabe keine eigenen hat
function normTask(t) {
  if (!t.parts) t.parts = [].concat(t.noTable ? [] : [{ table: true }], (t.kz && t.kz.length) ? [{ kz: t.kz }] : []);
  t.kz = t.parts.reduce((a, p) => a.concat(p.kz || []), []);
  return t;
}
function rangeKeys(task) {
  return ORDER.slice(ORDER.indexOf(task.from), ORDER.indexOf(task.to) + 1).filter(k => !(task.skip || []).includes(k));
}
function placement(nums, variant) {
  const out = [null, null];
  nums.forEach(([v, base, role]) => {
    let col = variant === 'basis' ? base % 2 : (role === 'b' ? 1 : 0);
    if (out[col] != null) col = 1 - col;
    out[col] = v;
  });
  return out;
}

