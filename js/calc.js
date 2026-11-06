/* =====================================================================
   Taschenrechner (Knopf oben rechts, standardmäßig aus, Verlauf der letzten 5)
   ===================================================================== */
const CALC_KEY = 'ksk-lernapp-calc';
const calc = { expr: '', hist: [], fresh: false };
function calcOut(v) { return String(+v.toFixed(8)).replace('.', ','); }
// Schrift verkleinern, bis der Text ins Feld passt (statt abzuschneiden)
function fitText(el, minPx) {
  el.style.fontSize = '';
  let s = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth && s > minPx) { s -= 0.5; el.style.fontSize = s + 'px'; }
  el.scrollLeft = el.scrollWidth;
}
function calcRender() {
  const disp = $('calc-disp');
  disp.textContent = calc.expr || '0';
  $('calc-hist').innerHTML = calc.hist.slice().reverse().map(h => `<div title="${esc(h.e)} = ${esc(h.r)}">${esc(h.e)} = ${esc(h.r)}</div>`).join('');
  if ($('calc').classList.contains('show')) {
    fitText(disp, 11);
    document.querySelectorAll('#calc-hist div').forEach(d => fitText(d, 8));
  }
}
function calcPress(k) {
  if (k === 'C') { calc.expr = ''; calc.fresh = false; }
  else if (k === '⌫') { calc.expr = calc.expr.slice(0, -1); calc.fresh = false; }
  else if (k === '=') {
    const v = evalExpr(calc.expr);
    if (v == null) { $('calc-disp').textContent = 'Fehler'; return; }
    const out = calcOut(v);
    calc.hist.push({ e: calc.expr, r: out });
    if (calc.hist.length > 5) calc.hist.shift();
    calc.expr = out; calc.fresh = true;
  } else {
    if (calc.fresh && /[0-9,(]/.test(k)) calc.expr = '';
    calc.fresh = false;
    calc.expr += k;
  }
  calcRender();
}
function setCalc(open) {
  $('calc').classList.toggle('show', open);
  $('btn-calc').setAttribute('aria-pressed', open ? 'true' : 'false');
  try { localStorage.setItem(CALC_KEY, open ? '1' : '0'); } catch (e) {}
  if (open) { $('calc').focus(); calcRender(); }
  calcSpace();
}
// Solange der Rechner offen ist, bekommt die Seite unten Platz, damit alles (z. B. "Fertig") darüber gescrollt werden kann
function calcSpace() {
  const c = $('calc');
  document.body.style.paddingBottom = c.classList.contains('show') ? (c.offsetHeight + 24) + 'px' : '';
}
window.addEventListener('resize', () => { try { calcSpace(); } catch (e) {} });
$('btn-calc').addEventListener('click', () => setCalc(!$('calc').classList.contains('show')));
$('calc-keys').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { calcPress(b.dataset.k); $('calc').focus(); } });
$('calc').addEventListener('keydown', e => {
  const map = { '*': '×', '/': '÷', '-': '−', '.': ',', Enter: '=', Backspace: '⌫', Escape: 'C' };
  let k = map[e.key] || e.key;
  if (/^[0-9,+−×÷()%=⌫C]$/.test(k)) { e.preventDefault(); calcPress(k); }
});
try { if (localStorage.getItem(CALC_KEY) === '1') setCalc(true); } catch (e) {}
calcRender();

