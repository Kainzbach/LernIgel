/* =====================================================================
   Kostenarten üben: je Beispiel zwei Entscheidungen (variabel/fix, Einzel-/Gemeinkosten).
   Eigene Ansicht (#v-ka), kein Taschenrechner. Bestwerte liegen wie bei allen Aufgaben in `best`.
   ===================================================================== */
const KA_ID = /^ka-\d+$/;
const KA_LABEL = { V: 'variable Kosten', F: 'fixe Kosten', EK: 'Einzelkosten', GK: 'Gemeinkosten' };
const kaAns = {}; // Aufgaben-ID -> [{ vf, eg }]
const kaMarks = {}; // Aufgaben-ID -> [{ vf, eg }] mit 'ok' | 'bad' | 'empty' nach dem Abgeben
const kaTask = id => KA_TASKS.find(t => t.id === id);
function kaGet(id) {
  const t = kaTask(id);
  if (!kaAns[id]) kaAns[id] = t.items.map(() => ({ vf: '', eg: '' }));
  return kaAns[id];
}
const kaAnswered = id => !!kaAns[id] && kaAns[id].some(a => a.vf || a.eg);
// Entwurf: nur Aufgaben mit Eintrag
function kaDraft() {
  const d = {};
  Object.keys(kaAns).forEach(id => {
    if (kaAnswered(id)) d[id] = kaAns[id].map(a => [a.vf, a.eg]);
  });
  return d;
}
function kaLoad(d) {
  if (!d || typeof d !== 'object') return;
  Object.keys(d).forEach(id => {
    const t = KA_ID.test(id) && kaTask(id);
    if (!t || !Array.isArray(d[id])) return;
    kaGet(id).forEach((a, i) => {
      const x = d[id][i] || [];
      a.vf = x[0] === 'V' || x[0] === 'F' ? x[0] : '';
      a.eg = x[1] === 'EK' || x[1] === 'GK' ? x[1] : '';
    });
  });
}
// Auswertung: 2 Punkte je Beispiel (einer je Entscheidung), leer = kein Punkt
function kaEvaluate(id) {
  const t = kaTask(id);
  const ans = kaGet(id);
  let pts = 0;
  const marks = t.items.map((it, i) => {
    const m = {};
    [
      ['vf', 1],
      ['eg', 2]
    ].forEach(([g, k]) => {
      const a = ans[i][g];
      m[g] = !a ? 'empty' : a === it[k] ? 'ok' : 'bad';
      if (m[g] === 'ok') pts++;
    });
    return m;
  });
  const max = t.items.length * 2;
  return { pts, max, pct: Math.round((pts / max) * 100), marks };
}
const kaBtn = (g, v, cur) =>
  `<button type="button" class="ka-b${cur === v ? ' on' : ''}" data-g="${g}" data-v="${v}" aria-pressed="${cur === v}">${KA_LABEL[v]}</button>`;
function kaItemHtml(id, i, withMarks) {
  const it = kaTask(id).items[i];
  const a = kaGet(id)[i];
  const mk = (withMarks && kaMarks[id] && kaMarks[id][i]) || {};
  const sym = s => (s === 'ok' ? ' ok' : s === 'bad' ? ' bad' : s === 'empty' ? ' empty' : '');
  const reveal = prog.help[id];
  let res = '';
  if (withMarks && kaMarks[id] && kaMarks[id][i]) {
    const wrong = mk.vf !== 'ok' || mk.eg !== 'ok';
    res = wrong
      ? `<div class="ka-res"><span class="t-bad">${mk.vf === 'empty' || mk.eg === 'empty' ? '✗ nicht ausgefüllt' : '✗ nicht richtig'}</span> ${reveal ? `<span class="muted">Lösung: ${KA_LABEL[it[1]]}, ${KA_LABEL[it[2]]}</span>` : '<button type="button" class="reveal" data-i="' + i + '">aufdecken</button>'}</div>`
      : '<div class="ka-res"><span class="t-ok">✓ richtig</span></div>';
  }
  return `<div class="card ka-item" data-i="${i}"><div class="ka-text"><span class="ka-nr">${i + 1}</span><span>${esc(it[0])}</span></div><div class="ka-btns"><div class="ka-grp${sym(mk.vf)}" data-g="vf"><div class="ka-lab">Variable oder fixe Kosten?</div>${kaBtn('vf', 'V', a.vf)}${kaBtn('vf', 'F', a.vf)}</div><div class="ka-grp${sym(mk.eg)}" data-g="eg"><div class="ka-lab">Einzel- oder Gemeinkosten?</div>${kaBtn('eg', 'EK', a.eg)}${kaBtn('eg', 'GK', a.eg)}</div></div>${res}</div>`;
}
let kaCur = null;
function kaRender() {
  const id = kaCur;
  const t = kaTask(id);
  $('ka-list').innerHTML = t.items.map((_, i) => kaItemHtml(id, i, true)).join('');
  kaRenderResult();
}
function kaRenderResult() {
  const r = kaLast[kaCur];
  $('ka-result').classList.toggle('show', !!r);
  if (!r) return;
  $('ka-big').textContent = r.pts + ' von ' + r.max + ' Punkten (' + r.pct + ' %)';
  $('ka-note').textContent = grade(r.pct);
  $('ka-bar').style.width = r.pct + '%';
  const help = prog.help[kaCur]
    ? 'Sie haben Lösungen aufgedeckt. Spätere Verbesserungen zählen weiter, der Bestwert wird mit ↻ markiert.'
    : '';
  $('ka-help').textContent = help;
  $('ka-help').hidden = !help;
}
const kaLast = {};
function showKaTask(id) {
  kaCur = id;
  document.body.className = 'is-task';
  calcLeave();
  $('v-menu').hidden = true;
  $('v-task').hidden = true;
  $('v-ka').hidden = false;
  $('ka-title').textContent = 'Kostenarten';
  document.title = 'LernIgel – Kostenarten: ' + kaTask(id).title;
  $('ka-head').textContent = kaTask(id).title;
  kaRender();
  window.scrollTo(0, 0);
}
function kaClick(e) {
  const rv = e.target.closest('.reveal');
  if (rv && $('ka-list').contains(rv)) {
    prog.help[kaCur] = true;
    prog.dirty = true;
    saveProg();
    kaRender();
    return;
  }
  const b = e.target.closest('.ka-b');
  if (!b) return;
  const i = +b.closest('.ka-item').dataset.i,
    g = b.dataset.g,
    v = b.dataset.v;
  const a = kaGet(kaCur)[i];
  a[g] = a[g] === v ? '' : v;
  // Markierung dieses Beispiels verschwindet, die Gesamtauswertung bleibt bis zum nächsten „Fertig“
  if (kaMarks[kaCur]) delete kaMarks[kaCur][i];
  const card = b.closest('.ka-item');
  card.querySelectorAll('.ka-grp').forEach(x => x.classList.remove('ok', 'bad', 'empty'));
  const rs = card.querySelector('.ka-res');
  if (rs) rs.remove();
  const grp = b.closest('.ka-grp');
  grp.querySelectorAll('.ka-b').forEach(x => {
    const on = x.dataset.v === a[g];
    x.classList.toggle('on', on);
    x.setAttribute('aria-pressed', on);
  });
  prog.dirty = true;
  saveProg();
}
async function kaCheck() {
  const id = kaCur;
  const msg = kaAnswered(id)
    ? 'Aufgabe jetzt abgeben und auswerten lassen?'
    : 'Es ist noch nichts eingetragen. Trotzdem abgeben?';
  if (!(await ask(msg, 'Abgeben'))) return;
  const r = kaEvaluate(id);
  kaMarks[id] = r.marks;
  kaLast[id] = r;
  if (best[id] == null || r.pct > best[id]) {
    best[id] = r.pct;
    saveBest();
  }
  prog.dirty = true;
  saveProg();
  kaRender();
  $('ka-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
async function kaReset() {
  const id = kaCur;
  if (kaAnswered(id) && !(await ask('Alle Eingaben dieser Aufgabe löschen und neu beginnen?', 'Neu beginnen'))) return;
  delete kaAns[id];
  delete kaMarks[id];
  delete kaLast[id];
  kaRender();
  scheduleSave();
}
$('ka-list').addEventListener('click', kaClick);
$('ka-check').addEventListener('click', kaCheck);
$('ka-reset').addEventListener('click', kaReset);
$('ka-back').addEventListener('click', () => {
  location.hash = KAU;
});
// Menüs: Thema Kostenarten
function showKostenarten(parts) {
  if (parts.length === 2) {
    const d = KA_TASKS.filter(t => best[t.id] != null).length;
    showMenu(
      `${backLink('#/ksk', 'Fach')}<div class="wm-box">${wordmark()}</div><h2>Kostenarten</h2><div class="tiles">${tileHtml({ href: KAU, icon: 'book', label: 'Üben', tag: d + ' von ' + KA_TASKS.length + ' bearbeitet' })}</div>${saveHint()}`,
      true
    );
    return;
  }
  if (parts[2] !== 'ueben' || parts.length > 4) {
    location.replace(KAB);
    return;
  }
  if (parts.length === 3) {
    const list = KA_TASKS.map((t, i) => {
      const st = statusOf(t.id);
      return `<li><button data-id="${t.id}"><span class="nr">${i + 1}</span><span class="tt">${esc(t.title)}</span><span class="st ${st.cls}">${st.text}</span></button></li>`;
    }).join('');
    showMenu(
      `${backLink(KAB, 'Kostenarten')}<h2>Kostenarten üben</h2><ul class="tasklist">${list}</ul>${KA_TASKS.some(t => prog.help[t.id]) ? '<p class="legend-h"><span class="st h">↻ gelb</span> mit aufgedeckter Lösung erreicht</p>' : ''}${saveHint()}`,
      true
    );
    $('menu')
      .querySelectorAll('.tasklist button')
      .forEach(b =>
        b.addEventListener('click', () => {
          location.hash = KAU + '/' + b.dataset.id;
        })
      );
    return;
  }
  if (!KA_ID.test(parts[3]) || !kaTask(parts[3])) {
    location.replace(KAU);
    return;
  }
  showKaTask(parts[3]);
}
