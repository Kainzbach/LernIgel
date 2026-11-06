/* =====================================================================
   Auswertung
   ===================================================================== */
function evaluate(task) {
  normTask(task);
  const tr = truth(task); const trE = truthExact(task);
  const keys = task.noTable ? [] : rangeKeys(task);
  const rows = task.noTable ? [] : getRows();
  rows.forEach(r => { r.st = null; r._weak = false; });
  const used = rows.filter(r => r.name.trim() || r.amt.trim() || r.p1.trim() || r.p2.trim());
  const found = {}, order = [], notes = [];

  used.forEach(r => {
    const nm = r.name.trim(); let key = nm ? ALIAS[nm] : null;
    if (!key && nm && WEAK[nm]) { key = WEAK[nm]; r._weak = true; }
    if (key && !keys.includes(key) && task.merge && task.merge[key]) key = task.merge[key];
    const line = rows.indexOf(r) + 1;
    if (!key) { r.st = { name: 'bad' }; notes.push(`Zeile ${line}: Bezeichnung „${esc(nm || 'leer')}“ nicht erkannt. Prüfen Sie die Schreibweise (Groß-/Kleinschreibung zählt).`); return; }
    if (!keys.includes(key)) { r.st = { name: 'neutral' }; notes.push(`Zeile ${line}: „${esc(nm)}“ gehört nicht zu dieser Aufgabe und wird nicht gewertet.`); return; }
    if (found[key]) { r.st = { name: 'neutral' }; notes.push(`Zeile ${line}: „${esc(nm)}“ steht doppelt, nur die erste Zeile wird gewertet.`); return; }
    found[key] = r; order.push(key);
  });

  const uv = {};
  keys.forEach(k => { if (found[k]) { const v = parseNum(found[k].amt); if (!isNaN(v)) uv[k] = Math.abs(v); } });

  let prev = -1; const posOk = {};
  // Kundenskonto und Verkaufsprovision dürfen in beliebiger Reihenfolge stehen (gleicher Rang)
  const rank = k => keys.indexOf((k === 'VP' && keys.includes('KS')) ? 'KS' : k);
  // Beide Richtungen sind richtig: von oben nach unten (LEP → LVP) oder von unten nach oben (LVP → LEP)
  const dirOk = dir => { const res = {}; let pv = dir > 0 ? -1 : Infinity; order.forEach(k => { const i = rank(k); if (dir > 0 ? i >= pv : i <= pv) { res[k] = true; pv = i; } else res[k] = false; }); return res; };
  const up_ = dirOk(1), down_ = dirOk(-1);
  const cnt = o => order.filter(k => o[k]).length;
  const reversed = cnt(down_) > cnt(up_);
  Object.assign(posOk, reversed ? down_ : up_);
  if (reversed) notes.push('Ihr Schema steht von unten nach oben. Das gilt als richtig, die Vorzeichen sind dann umgekehrt (+ und −).');

  // Spaltenvariante für die Prozent-Hilfe erkennen
  const score = { basis: 0, satz: 0 };
  keys.forEach(k => {
    const r = found[k]; if (!r) return;
    const nums = task.pct[k] || [];
    ['basis', 'satz'].forEach(v => {
      const p = placement(nums, v);
      [r.p1, r.p2].forEach((txt, i) => { const n = parseNum(txt); if (!isNaN(n) && p[i] === n) score[v]++; });
    });
  });
  const variant = score.satz > score.basis ? 'satz' : 'basis';

  // Von unten nach oben gerechnet: Vorzeichen sind umgekehrt (+ ↔ −), „=“ bleibt
  const expSign = k => { const g = SCH[k].sign; return reversed ? (g === '+' ? '-' : g === '-' ? '+' : g) : g; };
  let pts = 0; const items = [];
  keys.forEach(k => {
    const r = found[k]; const it = { key: k, tv: tr[k], sg: expSign(k) };
    if (!r) { it.missing = true; items.push(it); return; }
    const st = { name: r._weak ? 'follow' : 'ok' }; it.weak = !!r._weak; it.userName = r.name.trim();
    it.signOk = normSign(r.sign) === normSign(it.sg);
    st.sign = it.signOk ? 'ok' : 'bad';
    const v = parseNum(r.amt);
    it.userAmt = v; it.userSign = r.sign;
    // Kommt eine Zeile in der Aufgabe nicht vor (Sollwert 0): leer, 0, /, x oder - ist richtig
    const rawAmt = r.amt.trim();
    const zeroOk = tr[k] === 0 && /^(0+([.,]0+)?|\/|x|X|-|–|—)?$/.test(rawAmt);
    if (zeroOk || (!isNaN(v) && Math.abs(Math.abs(v) - tr[k]) <= TOL + 1e-9)) it.amt = 'ok';
    else if (!isNaN(v) && followVals(task, k, uv, tr).some(f => Math.abs(Math.abs(v) - f) <= TOL + 1e-9)) it.amt = 'follow';
    else it.amt = isNaN(v) ? 'empty' : 'bad';
    st.amt = it.amt === 'ok' ? 'ok' : it.amt === 'follow' ? 'follow' : 'bad';
    it.posOk = posOk[k];
    // Prozent (nicht gewertet)
    const exp = (task.pct[k] || []);
    const expNums = exp.map(e => e[0]).sort((a, b) => a - b);
    const userNums = [parseNum(r.p1), parseNum(r.p2)].filter(n => !isNaN(n)).sort((a, b) => a - b);
    const ep = placement(exp, variant);
    it.pctExp = exp.length ? `${ep[0] != null ? fmtPct(ep[0]) : '–'} | ${ep[1] != null ? fmtPct(ep[1]) : '–'}` : '';
    if (!exp.length && !userNums.length) it.pct = 'none';
    else if (!userNums.length) it.pct = 'empty';
    else if (JSON.stringify(expNums) === JSON.stringify(userNums)) it.pct = 'ok';
    else it.pct = 'diff';
    pts += (it.weak ? 0 : 1) + (it.signOk ? 1 : 0) + (it.amt === 'ok' || it.amt === 'follow' ? 1 : 0) + (it.posOk ? 1 : 0);
    r.st = st; items.push(it);
  });

  // Kennzahlen (Bruch + Satzfeld)
  const tablePts = pts;
  const kzItems = []; const kzPts = {};
  (task.kz || []).forEach(id => {
    const d = KZ[id]; const s = getKz(task.id, id); const base = task.kzBase || 'LVP';
    const T = k => tr[k];
    const U = k => (uv[k] != null) ? uv[k] : tr[k];
    const zE = d.num(k => trE[k], base), nE = d.den(k => trE[k], base);
    const zT = d.num(T, base), nT = d.den(T, base), zU = d.num(U, base), nU = d.den(U, base);
    const zv = evalExpr(s.z), nv = evalExpr(s.n), sv = parseNum(s.s);
    const close = (a, b, t) => a != null && !isNaN(a) && Math.abs(a - b) <= t + 1e-9;
    const rd = x => Math.round(x * Math.pow(10, d.dec)) / Math.pow(10, d.dec);
    const same = (a, b) => !isNaN(a) && Math.abs(rd(a) - b) < 1e-9;
    const tolZ = TOL * d.mult;
    const zst = zv == null ? 'empty' : close(zv, zT, tolZ) ? 'ok' : close(zv, zU, tolZ) ? 'follow' : 'bad';
    const nst = nv == null ? 'empty' : close(nv, nT, TOL) ? 'ok' : close(nv, nU, TOL) ? 'follow' : 'bad';
    const r5 = x => Math.round(x * 1e5) / 1e5;
    const anySame = (a, x) => same(a, rd(x)) || same(a, rd(r5(x)));
    const expT = rd(zT / nT);
    const sst = isNaN(sv) ? 'empty'
      : (anySame(sv, zT / nT) || anySame(sv, zE / nE)) ? 'ok'
      : (anySame(sv, zU / nU) || (zv != null && nv != null && nv !== 0 && anySame(sv, zv / nv))) ? 'follow' : 'bad';
    const hint = (zst === 'bad' && d.mult === 100 && zv != null && close(zv * 100, zT, tolZ))
      ? 'Das ×100 fehlt im Zähler.' : '';
    const good = x => (x === 'ok' || x === 'follow') ? 1 : 0;
    const kp = good(zst) + good(nst) + good(sst); kzPts[id] = kp; pts += kp;
    s.st = { z: zst === 'empty' ? 'bad' : zst, n: nst === 'empty' ? 'bad' : nst, s: sst === 'empty' ? 'bad' : sst };
    kzItems.push({ id, d, zst, nst, sst, zT, nT, expT, zv, nv, sv, hint });
  });

  const max = keys.length * 4 + (task.kz || []).length * 3;
  const parts = task.parts.map(p => ({ title: partTitle(p), pts: p.table ? tablePts : p.kz.reduce((a, id) => a + (kzPts[id] || 0), 0), max: p.table ? keys.length * 4 : p.kz.length * 3 }));
  return { pts, max, pct: Math.round(pts / max * 100), items, kzItems, parts, notes, variant };
}

function buildKzHtml(kzItems, task) {
  if (!kzItems.length) return '';
  const cell = (st, ok, got, exp, extra) => {
    if (st === 'ok') return `<span class="t-ok">✓</span> ${exp}`;
    if (st === 'follow') return `<span class="t-follow">folgerichtig ✓</span> <span class="muted">(Lösung: ${exp})</span>`;
    if (st === 'empty') return `<span class="t-bad">✗ leer</span> <span class="muted">(richtig: ${exp})</span>`;
    return `<span class="t-bad">✗</span> <span class="muted">(Ihr Wert: ${got}, richtig: ${exp})</span>${extra ? ' <span class="t-bad">' + extra + '</span>' : ''}`;
  };
  const rowOf = k => {
    const d = k.d;
    const z = cell(k.zst, null, k.zv != null ? fmtMax(k.zv, 4) : '', fmtMax(k.zT, 4), k.hint);
    const n = cell(k.nst, null, k.nv != null ? fmtMax(k.nv, 4) : '', fmtMax(k.nT, 4));
    const e = cell(k.sst, null, isNaN(k.sv) ? '' : fmtMax(k.sv, 6), fmtDec(k.expT, d.dec) + (d.unit ? ' ' + d.unit : ''));
    return `<tr><td><strong>${esc(d.title)}</strong></td><td data-l="Zähler">${z}</td><td data-l="Nenner">${n}</td><td data-l="Ergebnis">${e}</td></tr>`;
  };
  return task.parts.filter(p => p.kz && p.kz.length).map(p => {
    const items = kzItems.filter(k => p.kz.includes(k.id));
    return `<h4>${esc(partTitle(p) || 'Kennzahlen')}</h4><table class="res"><thead><tr><th>Kennzahl</th><th>Zähler</th><th>Nenner</th><th>Ergebnis</th></tr></thead><tbody>${items.map(rowOf).join('')}</tbody></table>`;
  }).join('');
}

function buildRowsHtml(items) {
  return items.map(it => {
    const sc = Object.assign({}, SCH[it.key], { sign: it.sg || SCH[it.key].sign });
    const soll = `<strong>${esc(signLabel(sc.sign) === '=' ? '=' : signLabel(sc.sign))}</strong> ${esc(sc.alias[0])}<br><span class="muted">${esc(sc.alias.slice(1).join(' / '))}</span>`;
    if (it.missing) return `<tr class="missing"><td>${soll}</td><td class="t-bad" data-l="Bezeichnung">Zeile fehlt</td><td data-l="Vz"><strong class="t-bad">${esc(signLabel(sc.sign))}</strong></td><td data-l="Betrag"><span class="t-bad">richtig:</span> ${fmt(it.tv)}</td><td data-l="Reihenfolge">–</td><td data-l="Prozent">–</td></tr>`;
    const signCell = it.signOk ? '<span class="t-ok">✓</span>' : `<span class="t-bad">✗</span> <span class="muted">(Ihr Wert: ${it.userSign === '' ? 'leer' : esc(signLabel(it.userSign))}, richtig: ${esc(signLabel(sc.sign))})</span>`;
    let amtCell;
    if (it.amt === 'ok') amtCell = `<span class="t-ok">✓</span> ${fmt(it.tv)}`;
    else if (it.amt === 'follow') amtCell = `<span class="t-follow">folgerichtig ✓</span> <span class="muted">(Lösung: ${fmt(it.tv)})</span>`;
    else if (it.amt === 'empty') amtCell = `<span class="t-bad">✗ leer</span> <span class="muted">(richtig: ${fmt(it.tv)})</span>`;
    else amtCell = `<span class="t-bad">✗</span> <span class="muted">(Ihr Wert: ${fmt(it.userAmt)}, richtig: ${fmt(it.tv)})</span>`;
    const posCell = it.posOk ? '<span class="t-ok">✓</span>' : '<span class="t-bad">✗</span> <span class="muted">(steht an der falschen Stelle)</span>';
    let pctCell;
    if (it.pct === 'ok') pctCell = '<span class="t-ok">✓</span>';
    else if (it.pct === 'none') pctCell = '<span class="muted">–</span>';
    else pctCell = `<span class="muted">${it.pct === 'empty' ? 'leer' : 'abweichend'}, erwartet: ${esc(it.pctExp || 'keine')}</span>`;
    return `<tr><td>${soll}</td><td data-l="Bezeichnung">${it.weak ? `<span class="t-follow">gelb</span> <span class="muted">(„${esc(it.userName)}“ ist nicht falsch, richtig ist: ${esc(sc.alias[0])}, 1 Punkt Abzug)</span>` : '<span class="t-ok">✓</span>'}</td><td data-l="Vorzeichen">${signCell}</td><td data-l="Betrag">${amtCell}</td><td data-l="Reihenfolge">${posCell}</td><td data-l="Prozent">${pctCell}</td></tr>`;
  }).join('');
}

// Eigenes Bestätigungsfenster (window.confirm wird in Vorschaufenstern oft blockiert)
function ask(msg, yes) {
  return new Promise(resolve => {
    $('dlg-text').textContent = msg;
    $('dlg-yes').textContent = yes || 'Ja';
    $('overlay').classList.add('show');
    $('dlg-yes').focus();
    const done = v => {
      $('overlay').classList.remove('show');
      $('dlg-yes').onclick = $('dlg-no').onclick = null;
      resolve(v);
    };
    $('dlg-yes').onclick = () => done(true);
    $('dlg-no').onclick = () => done(false);
  });
}

async function check() {
  const task = TASKS[cur];
  const tableUsed = task.noTable ? [] : getRows().filter(r => r.name.trim() || r.amt.trim());
  const kzUsed = (task.kz || []).filter(id => { const s = getKz(task.id, id); return s.z.trim() || s.n.trim() || s.s.trim(); });
  const msg = (tableUsed.length === 0 && kzUsed.length === 0)
    ? 'Es ist noch nichts eingetragen. Trotzdem abgeben?'
    : 'Aufgabe jetzt abgeben und auswerten lassen?';
  if (!(await ask(msg, 'Abgeben'))) return;
  const res = evaluate(task);
  res.rowsHtml = buildRowsHtml(res.items);
  res.kzHtml = buildKzHtml(res.kzItems, task);
  res.notesHtml = res.notes.map(n => `<li>${n}</li>`).join('');
  lastScore[task.id] = res;
  if (best[task.id] == null || res.pct > best[task.id]) { best[task.id] = res.pct; saveBest(); }
  renderTabs(); renderTable(); renderKz(); renderResult();
  $('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

