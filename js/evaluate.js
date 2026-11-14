/* =====================================================================
   Auswertung
   ===================================================================== */
const prevUvByTask = {};
function evaluate(task) {
  normTask(task);
  const prev = prevUvByTask[task.id] || null;
  const tr = truth(task); const trE = truthExact(task);
  const tps = task.noTable ? [] : task.parts.map((p, i) => ({ p, i })).filter(x => x.p.table);
  const multi = tps.length > 1; const notes = []; const uv = {};

  // 1) Zeilen jedes Tabellenteils den Schema-Zeilen zuordnen
  const P = tps.map(({ p, i }) => {
    const keys = partKeys(task, p); const rows = getRows(i);
    rows.forEach(r => { r.st = null; r._weak = false; });
    const used = rows.filter(r => r.name.trim() || r.amt.trim() || r.p1.trim() || r.p2.trim());
    const found = {}, order = []; const pre = multi ? (p.label ? p.label + ' ' : '') : '';
    used.forEach(r => {
      const nm = r.name.trim(); let key = nm ? ALIAS[nm] : null;
      if (!key && nm && WEAK[nm]) { key = WEAK[nm]; r._weak = !WEAK_FULL[nm]; }
      if (key && !keys.includes(key + (p.sfx || '')) && task.merge && task.merge[key]) key = task.merge[key];
      if (key && p.sfx) key += p.sfx;
      const line = rows.indexOf(r) + 1;
      if (!key) { r.st = { name: 'bad' }; notes.push(`${pre}Zeile ${line}: Bezeichnung „${esc(nm || 'leer')}“ nicht erkannt. Prüfen Sie die Schreibweise (Groß-/Kleinschreibung zählt).`); return; }
      if (!keys.includes(key)) { r.st = { name: 'neutral' }; notes.push(`${pre}Zeile ${line}: „${esc(nm)}“ gehört nicht zu diesem Teil und wird nicht gewertet.`); return; }
      if (found[key]) { r.st = { name: 'neutral' }; notes.push(`${pre}Zeile ${line}: „${esc(nm)}“ steht doppelt, nur die erste Zeile wird gewertet.`); return; }
      found[key] = r; order.push(key);
    });
    // Eigene Werte (auch aus früheren Teilen) dienen als Grundlage für Folgewerte
    keys.forEach(k => { if (found[k] && !(p.ersatz && k in p.ersatz)) { const v = parseNum(found[k].amt); if (!isNaN(v) && uv[k] == null) uv[k] = Math.abs(v); } });
    return { p, i, keys, rows, found, order, pre };
  });

  // Satz aus einer Kennzahl-Teilaufgabe (z. B. Handlungskostenzuschlag aus der Kostenrechnung) ist Grundlage für Folgewerte
  task.parts.forEach(p => { if (p.feeds) Object.keys(p.feeds).forEach(id => { const v = parseNum(getKz(task.id, id).s); if (!isNaN(v) && v > 0) uv[p.feeds[id]] = v; }); });
  // Ersatzwert: fehlt der Wert aus einem früheren Teil, rechnet die Aufgabe mit dem vorgegebenen Wert weiter
  const ersK = []; task.parts.forEach(p => { const er = p.ersatz; if (er) Object.keys(er).forEach(k => { if (uv[k] == null) { uv[k] = er[k]; ersK.push(k); } }); });
  const uvN = Object.assign({}, uv); ersK.forEach(k => { delete uvN[k]; });

  // 2) Jeden Teil auswerten
  let pts = 0; const tables = [];
  P.forEach(Q => {
    const { keys, found, order, rows } = Q; const posOk = {};
    // Zweiter gültiger Weg (z. B. Gewinn zwischen SKP und BVP im normalen Schema): gilt, wenn der Gewinn so eingeordnet ist
    let RK = Q.p.rank, SG = Q.p.signs;
    if (Q.p.rankAlt) { const gi = order.indexOf('G'), si = order.indexOf('SKP'), bi = order.indexOf('BVP'); if (gi >= 0 && si >= 0 && bi >= 0 && gi > Math.min(si, bi) && gi < Math.max(si, bi)) { RK = Q.p.rankAlt; SG = Q.p.signsAlt || null; } }
    const rank = RK ? (k => { const b = baseKey(k); return RK.indexOf(b === 'VP' && !RK.includes('VP') ? 'KS' : b); }) : (k => keys.indexOf((baseKey(k) === 'VP' && keys.includes('KS' + sfxOf(k))) ? 'KS' + sfxOf(k) : k));
    const dirOk = dir => { const res = {}; let pv = dir > 0 ? -1 : Infinity; order.forEach(k => { const i = rank(k); if (dir > 0 ? i >= pv : i <= pv) { res[k] = true; pv = i; } else res[k] = false; }); return res; };
    const up_ = dirOk(1), down_ = dirOk(-1);
    const cnt = o => order.filter(k => o[k]).length;
    const reversed = cnt(down_) > cnt(up_);
    Object.assign(posOk, reversed ? down_ : up_);
    if (reversed) notes.push(`${Q.pre}Ihr Schema steht von unten nach oben. Das gilt als richtig, die Vorzeichen sind dann umgekehrt (+ und −).`);
    const score = { basis: 0, satz: 0 };
    keys.forEach(k => {
      const r = found[k]; if (!r) return;
      const nums = pctOf(task, k);
      ['basis', 'satz'].forEach(v => {
        const p = placement(nums, v);
        [r.p1, r.p2].forEach((txt, i) => { const n = parseNum(txt); if (!isNaN(n) && p[i] === n) score[v]++; });
      });
    });
    const variant = score.satz > score.basis ? 'satz' : 'basis';
    const expSign = k => { if (SG && SG[baseKey(k)]) return SG[baseKey(k)]; const g = SCH[k].sign; return reversed ? (g === '+' ? '-' : g === '-' ? '+' : g) : g; };
    let tp = 0; const items = [];
    keys.forEach(k => {
      const r = found[k]; const it = { key: k, tv: tr[k], sg: expSign(k) };
      if (!r) { if (baseKey(k) === 'VP' && tr[k] === 0) return; it.missing = true; items.push(it); return; }
      const st = { name: r._weak ? 'follow' : 'ok' }; it.weak = !!r._weak; it.userName = r.name.trim();
      it.signOk = normSign(r.sign) === normSign(it.sg);
      st.sign = it.signOk ? 'ok' : 'bad';
      const v = parseNum(r.amt);
      it.userAmt = v; it.userSign = r.sign;
      const rawAmt = r.amt.trim();
      const zeroOk = tr[k] === 0 && /^(0+([.,]0+)?|\/|x|X|-|–|—)?$/.test(rawAmt);
      if (zeroOk || (!isNaN(v) && Math.abs(Math.abs(v) - tr[k]) <= TOL + 1e-9)) it.amt = 'ok';
      else if (!isNaN(v) && [uv, uvN].some(UU => followVals(task, k, UU, tr).some(f => Math.abs(Math.abs(v) - Math.abs(f)) <= TOL + 1e-9))) it.amt = 'follow';
      else if (!isNaN(v) && Q.p.ersatz && k in Q.p.ersatz && uv[k] != null && Math.abs(Math.abs(v) - uv[k]) <= TOL + 1e-9) it.amt = 'follow';
      else if (!isNaN(v) && prev && followVals(task, k, Object.assign({}, uv, prev), tr).some(f => Math.abs(Math.abs(v) - Math.abs(f)) <= TOL + 1e-9)) it.amt = 'stale';
      else it.amt = isNaN(v) ? 'empty' : 'bad';
      st.amt = it.amt === 'ok' ? 'ok' : it.amt === 'follow' ? 'follow' : 'bad';
      it.posOk = posOk[k];
      const exp = pctOf(task, k);
      const expNums = exp.map(e => e[0]).sort((a, b) => a - b);
      const userNums = [parseNum(r.p1), parseNum(r.p2)].filter(n => !isNaN(n)).sort((a, b) => a - b);
      const ep = placement(exp, variant);
      it.pctExp = exp.length ? `${ep[0] != null ? fmtPct(ep[0]) : '–'} | ${ep[1] != null ? fmtPct(ep[1]) : '–'}` : '';
      if (!exp.length && !userNums.length) it.pct = 'none';
      else if (!userNums.length) it.pct = 'empty';
      else if (JSON.stringify(expNums) === JSON.stringify(userNums)) it.pct = 'ok';
      else it.pct = 'diff';
      tp += (it.weak ? 0 : 1) + (it.signOk ? 1 : 0) + (it.amt === 'ok' || it.amt === 'follow' ? 1 : 0) + (it.posOk ? 1 : 0);
      r.st = st; items.push(it);
    });
    // Kurzweg über den Kalkulationsfaktor (Wahl: Tabelle oder Rechnung, die bessere Wertung zählt; Toleranz hier 5 Cent)
    let kw = null, kwBetter = false, ans = null; const maxRows = items.length * 4; const maxP = maxRows + (Q.p.ans ? 1 : 0);
    if (Q.p.alt) {
      const x = Q.p.sfx || ''; const ks = getKz(task.id, 'kw' + x); const m = Q.p.kwPrice;
      const fT = tr.LVP / tr.BP; const fUser = parseNum(getKz(task.id, 'faktor').s);
      const zv = evalExpr(ks.z), nv = evalExpr(ks.n);
      const zst = zv == null ? 'empty' : Math.abs(zv - m) <= TOL + 1e-9 ? 'ok' : 'bad';
      const nst = nv == null ? 'empty' : Math.abs(nv - fT) <= 0.00006 ? 'ok' : (!isNaN(fUser) && Math.abs(nv - fUser) <= 1e-6) ? 'follow' : 'bad';
      const good = q => (q === 'ok' || q === 'follow') ? 1 : 0; const kp = good(zst) + good(nst);
      ks.st = { z: zst === 'empty' ? 'bad' : zst, n: nst === 'empty' ? 'bad' : nst };
      const scaled = Math.round(kp / 2 * maxRows);
      kw = { zst, nst, kp, zv, nv, m, fT, filled: zv != null || nv != null };
      if (kw.filled && scaled > tp) { tp = scaled; kwBetter = true; }
    }
    // Antwortfeld Bezugspreis: Pflichtfeld, 1 Punkt für beide Wege (5 Cent Toleranz nur beim Weg über den Kalkulationsfaktor)
    if (Q.p.ans) {
      const x = Q.p.sfx || ''; const as = getKz(task.id, 'ans' + x); const sv = parseNum(as.s); const exp = tr['BP' + x];
      const usedF = (kw && kw.nv != null && kw.nv > 0) ? kw.nv : (kw ? kw.fT : 1);
      let st = isNaN(sv) ? 'empty' : Math.abs(sv - exp) <= TOL + 1e-9 ? 'ok' : 'bad';
      if (st === 'bad' && uv['BP' + x] != null && Math.abs(sv - uv['BP' + x]) <= TOL + 1e-9) st = 'follow';
      if (st === 'bad' && kw && kw.filled && (Math.abs(sv - exp) <= 0.05 + 1e-9 || Math.abs(sv - kw.m / usedF) <= 0.05 + 1e-9)) st = 'ok';
      as.st = { s: st === 'empty' ? 'bad' : st };
      ans = { st, exp, sv }; if (st === 'ok' || st === 'follow') tp += 1;
    }
    pts += tp; tables.push({ i: Q.i, title: partTitle(Q.p), items, pts: tp, max: maxP, variant, kw, kwBetter, ans });
  });
  { const amtSt = {}; tables.forEach(t => t.items.forEach(it => { if (it.amt && amtSt[it.key] == null) amtSt[it.key] = it.amt; }));
    const order = task.steps.map(x => x[0]);
    tables.forEach(t => t.items.forEach(it => { if (it.amt !== 'follow') return;
      const c = order.slice(0, order.indexOf(it.key)).filter(k => sfxOf(k) === sfxOf(it.key)).find(k => amtSt[k] === 'bad' || amtSt[k] === 'empty' || amtSt[k] === 'stale');
      if (c && SCH[c]) it.cause = SCH[c].alias[0]; })); }
  const variant = tables.length ? tables[0].variant : 'basis';
  const items = tables.length ? tables[0].items : [];
  const keys = P.reduce((a, Q) => a.concat(Q.keys), []);

  // Kennzahlen (Bruch + Satzfeld)
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
    const PU = k => (prev && prev[k] != null) ? prev[k] : U(k);
    const zP = prev ? d.num(PU, base) : null, nP = prev ? d.den(PU, base) : null;
    const zst = zv == null ? 'empty' : close(zv, zT, tolZ) ? 'ok' : close(zv, zU, tolZ) ? 'follow' : (prev && close(zv, zP, tolZ)) ? 'stale' : 'bad';
    const nst = nv == null ? 'empty' : close(nv, nT, TOL) ? 'ok' : close(nv, nU, TOL) ? 'follow' : (prev && close(nv, nP, TOL)) ? 'stale' : 'bad';
    const r5 = x => Math.round(x * 1e5) / 1e5;
    const anySame = (a, x) => same(a, rd(x)) || same(a, rd(r5(x)));
    const expT = rd(zT / nT);
    const decCnt = x => { x = String(x).trim().replace(/[\s€%]/g, '').replace('−', '-'); if (x.includes(',')) x = x.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(x)) return 0; const m = x.match(/\.(\d+)$/); return m ? m[1].replace(/0+$/, '').length : 0; };
    const over = !isNaN(sv) && decCnt(s.s) > d.dec;
    const sst = isNaN(sv) ? 'empty'
      : over ? 'bad'
      : (anySame(sv, zT / nT) || anySame(sv, zE / nE)) ? 'ok'
      : (anySame(sv, zU / nU) || (zv != null && nv != null && nv !== 0 && anySame(sv, zv / nv))) ? 'follow'
      : (prev && anySame(sv, zP / nP)) ? 'stale' : 'bad';
    const hint = (zst === 'bad' && d.mult === 100 && zv != null && close(zv * 100, zT, tolZ))
      ? 'Das ×100 fehlt im Zähler.' : '';
    const good = x => (x === 'ok' || x === 'follow') ? 1 : 0;
    const kp = good(zst) + good(nst) + good(sst); kzPts[id] = kp; pts += kp;
    s.st = { z: zst === 'empty' ? 'bad' : zst, n: nst === 'empty' ? 'bad' : nst, s: sst === 'empty' ? 'bad' : sst };
    kzItems.push({ id, d, zst, nst, sst, over, zT, nT, expT, zv, nv, sv, hint, zW: d.wnum ? d.wnum(T, base) : '' });
  });

  const vrItems = (task.vr || []).map((v, i) => { const e = evalExpr((vrByTask[task.id] || [])[i]); return { v, e, st: e == null ? 'empty' : Math.abs(e - v.value) < 1e-4 ? 'ok' : 'bad' }; });
  const vrPts = vrItems.filter(x => x.st === 'ok').length; pts += vrPts;
  const max = tables.reduce((a, t) => a + t.items.length, 0) * 4 + task.parts.filter(p => p.table && p.ans).length + (task.kz || []).length * 3 + vrItems.length;
  const parts = task.parts.map(p => ({ title: partTitle(p), pts: p.table ? ((tables.find(x => x.i === task.parts.indexOf(p)) || {}).pts || 0) : p.kz.reduce((a, id) => a + (kzPts[id] || 0), 0), max: p.table ? ((tables.find(x => x.i === task.parts.indexOf(p)) || {}).max || 0) : p.kz.length * 3 }));
  if (vrItems.length) parts.push({ title: 'Vorrechnung', pts: vrPts, max: vrItems.length });
  return { uv, pts, max, pct: Math.round(pts / max * 100), items, tables, kzItems, vrItems, parts, notes, variant };
}

let HIDE = false, RV = false;
const rvw = html => { if (!HIDE) return html; RV = true; return `<span class="rv" hidden>${html}</span>`; };
const rvBtn = () => (HIDE && RV) ? ' <button class="reveal" type="button">aufdecken</button>' : '';
function buildVrHtml(vrItems, lab) {
  if (!vrItems.length) return '';
  const rows = vrItems.map(x => { RV = false;
    const mine = (vrByTask[x.v.value !== undefined ? TASKS[cur].id : ''] || [])[vrItems.indexOf(x)] || '';
    const c = x.st === 'ok' ? `<span class="t-ok">✓</span> ${fmtMax(x.v.value, 5)}`
      : x.st === 'empty' ? `<span class="t-bad">✗ leer</span> ${rvw('<span class="muted">(richtig: ' + fmtMax(x.v.value, 5) + ')</span>')}`
      : `<span class="t-bad">✗</span> <span class="muted">(Ihr Wert: ${fmtMax(x.e, 5)}${rvw(', richtig: ' + fmtMax(x.v.value, 5))})</span>`;
    return `<tr><td><strong>${esc(x.v.label)}</strong></td><td data-l="Ergebnis">${c}${rvBtn()}</td></tr>`; }).join('');
  return `<h4>Vorrechnung${lab ? ' zu ' + esc(lab) : ''}</h4><table class="res"><thead><tr><th>Zwischenergebnis</th><th>Ihr Ergebnis</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function buildKzHtml(kzItems, task) {
  if (!kzItems.length) return '';
  const cell = (st, ok, got, exp, extra) => {
    if (st === 'ok') return `<span class="t-ok">✓</span> ${exp}`;
    if (st === 'stale') return `<span class="t-follow">veraltet</span> <span class="muted">(bitte mit Ihrer Korrektur neu rechnen)</span>`;
    if (st === 'follow') return `<span class="t-follow">folgerichtig ✓</span> <span class="muted">(Lösung: ${exp})</span>`;
    if (st === 'empty') return `<span class="t-bad">✗ leer</span> ${rvw('<span class="muted">(richtig: ' + exp + ')</span>')}`;
    return `<span class="t-bad">✗</span> <span class="muted">(Ihr Wert: ${got}${rvw(', richtig: ' + exp)})</span>${extra ? ' ' + rvw('<span class="t-bad">' + extra + '</span>') : ''}`;
  };
  const rowOf = k => {
    const d = k.d; RV = false;
    const z = cell(k.zst, null, k.zv != null ? fmtMax(k.zv, 4) : '', (k.zW ? k.zW + ' = ' : '') + fmtMax(k.zT, 4), k.hint);
    const n = cell(k.nst, null, k.nv != null ? fmtMax(k.nv, 4) : '', fmtMax(k.nT, 4));
    const e = cell(k.sst, null, isNaN(k.sv) ? '' : fmtMax(k.sv, 6), fmtDec(k.expT, d.dec) + (d.unit ? ' ' + d.unit : '')) + (k.over ? `<div class="t-bad">Bitte auf ${d.dec} Nachkommastellen runden.</div>` : '');
    return `<tr><td><strong>${esc(d.title)}</strong>${rvBtn()}</td><td data-l="Zähler">${z}</td><td data-l="Nenner">${n}</td><td data-l="Ergebnis">${e}</td></tr>`;
  };
  return task.parts.filter(p => p.kz && p.kz.length).map(p => {
    const items = kzItems.filter(k => p.kz.includes(k.id));
    return `<h4>${esc(partTitle(p) || 'Kennzahlen')}</h4><table class="res"><thead><tr><th>Kennzahl</th><th>Zähler</th><th>Nenner</th><th>Ergebnis</th></tr></thead><tbody>${items.map(rowOf).join('')}</tbody></table>`;
  }).join('');
}

function buildRowsHtml(items) {
  return items.map(it => {
    RV = false;
    const sc = Object.assign({}, SCH[it.key], { sign: it.sg || SCH[it.key].sign });
    const soll = `<strong>${esc(signLabel(sc.sign) === '=' ? '=' : signLabel(sc.sign))}</strong> ${esc(sc.alias[0])}<br><span class="muted">${esc(sc.alias.slice(1).join(' / '))}</span>`;
    if (it.missing) return `<tr class="missing"><td>${soll}${(HIDE ? (RV = true, rvBtn()) : '')}</td><td class="t-bad" data-l="Bezeichnung">Zeile fehlt</td><td data-l="Vz">${rvw('<strong class="t-bad">' + esc(signLabel(sc.sign)) + '</strong>') || ''}</td><td data-l="Betrag">${rvw('<span class="t-bad">richtig:</span> ' + fmt(it.tv))}</td><td data-l="Reihenfolge">–</td><td data-l="Prozent">–</td></tr>`;
    const signCell = it.signOk ? '<span class="t-ok">✓</span>' : `<span class="t-bad">✗</span> <span class="muted">(Ihr Wert: ${it.userSign === '' ? 'leer' : esc(signLabel(it.userSign))}${rvw(', richtig: ' + esc(signLabel(sc.sign)))})</span>`;
    let amtCell;
    if (it.amt === 'ok') amtCell = `<span class="t-ok">✓</span> ${fmt(it.tv)}`;
    else if (it.amt === 'stale') amtCell = `<span class="t-follow">veraltet</span> <span class="muted">(bitte mit Ihrer Korrektur neu rechnen)</span>`;
    else if (it.amt === 'follow') amtCell = `<span class="t-follow">folgerichtig ✓</span>${it.cause ? ' <span class="muted">(baut auf „' + esc(it.cause) + '“ auf)</span>' : ''} <span class="muted">(Lösung: ${fmt(it.tv)})</span>`;
    else if (it.amt === 'empty') amtCell = `<span class="t-bad">✗ leer</span> ${rvw('<span class="muted">(richtig: ' + fmt(it.tv) + ')</span>')}`;
    else amtCell = `<span class="t-bad">✗</span> <span class="muted">(Ihr Wert: ${fmt(it.userAmt)}${rvw(', richtig: ' + fmt(it.tv))})</span>`;
    const posCell = it.posOk ? '<span class="t-ok">✓</span>' : '<span class="t-bad">✗</span> <span class="muted">(steht an der falschen Stelle)</span>';
    let pctCell;
    if (it.pct === 'ok') pctCell = '<span class="t-ok">✓</span>';
    else if (it.pct === 'none') pctCell = '<span class="muted">–</span>';
    else pctCell = `<span class="muted">${it.pct === 'empty' ? 'leer' : 'abweichend'}, erwartet: ${esc(it.pctExp || 'keine')}</span>`;
    return `<tr><td>${soll}${rvBtn()}</td><td data-l="Bezeichnung">${it.weak ? `<span class="t-follow">gelb</span> <span class="muted">(„${esc(it.userName)}“ ist nicht falsch${rvw(', richtig ist: ' + esc(sc.alias[0]))}, 1 Punkt Abzug)</span>` : '<span class="t-ok">✓</span>'}</td><td data-l="Vorzeichen">${signCell}</td><td data-l="Betrag">${amtCell}</td><td data-l="Reihenfolge">${posCell}</td><td data-l="Prozent">${pctCell}</td></tr>`;
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

// Ergebnis samt Anzeige aufbauen. Bei festen Aufgaben bleiben falsche Zeilen verdeckt, bis man sie aufdeckt.
function makeResult(task) {
  HIDE = !isRandom(task) && !prog.help[task.id]; RV = false;
  const res = evaluate(task);
  res.pending = false;
  res.rowsHtml = buildRowsHtml(res.items);
  const ft = task.parts.find(p => p.table); const vrH = buildVrHtml(res.vrItems, ft && ft.label);
  const kwHtml = t => { const k = t.kw; const c = (st, ok) => st === 'ok' ? `<span class="t-ok">✓</span> ${ok}` : st === 'follow' ? `<span class="t-follow">folgerichtig</span> ${ok}` : st === 'empty' ? '<span class="t-bad">✗ leer</span>' : '<span class="t-bad">✗</span>';
    return `<div class="wrap"><table class="res"><thead><tr><th>Rechnung über den Kalkulationsfaktor</th><th>Ihr Ergebnis</th></tr></thead><tbody><tr><td>Zähler (Preis des Mitbewerbers)</td><td>${c(k.zst, fmtMax(k.m, 2))}</td></tr><tr><td>Nenner (Kalkulationsfaktor)</td><td>${c(k.nst, fmtMax(k.fT, 4))}</td></tr></tbody></table></div>`; };
  const ansLine = t => t.ans ? `<p class="ansline">Bezugspreis (Antwortfeld): ${t.ans.st === 'ok' ? '<span class="t-ok">✓</span> ' + fmtMax(t.ans.exp, 2) + ' €' : t.ans.st === 'follow' ? '<span class="t-follow">folgerichtig</span>' : t.ans.st === 'empty' ? '<span class="t-bad">✗ leer</span> ' + rvw('<span class="muted">(richtig: ' + fmtMax(t.ans.exp, 2) + ' €)</span>') : '<span class="t-bad">✗</span> ' + rvw('<span class="muted">(richtig: ' + fmtMax(t.ans.exp, 2) + ' €)</span>')}</p>` : '';
  const tblHtml0 = t => t.kwBetter ? `<h4 class="res-h">${esc(t.title)}: ${t.pts} von ${t.max} Punkten (Weg über den Kalkulationsfaktor)</h4>${kwHtml(t)}` : `<h4 class="res-h">${esc(t.title)}: ${t.pts} von ${t.max} Punkten</h4><div class="wrap"><table class="res"><thead><tr><th>Soll</th><th>Bezeichnung</th><th>Vz</th><th>Betrag</th><th>Reihenfolge</th><th>Prozent (nicht gewertet)</th></tr></thead><tbody>${buildRowsHtml(t.items)}</tbody></table></div>`;
  const tblHtml = t => tblHtml0(t) + ansLine(t);
  const multi = res.tables.length > 1;
  const multiParts = multi || (task.parts.some(p => p.kz && p.kz.length) && res.tables.length && task.kzFirst);
  res.multiHtml = multiParts ? task.parts.map((p, pi) => { if (p.table) { const t = res.tables.find(x => x.i === pi); return t ? tblHtml(t) + (pi === task.parts.findIndex(q => q.table) ? vrH : '') : ''; } return (p.kz && p.kz.length) ? buildKzHtml(res.kzItems.filter(x => p.kz.includes(x.id)), task) : ''; }).join('') : '';
  res.kzHtml = multiParts ? '' : vrH + buildKzHtml(res.kzItems, task);
  const way = buildWayHtml(task);
  res.wayHtml = (HIDE && res.pct < 100) ? `<div class="wayBox"><button class="reveal" type="button">Musterweg zeigen</button><div class="rv" hidden>${way}</div></div>` : way;
  res.hideNote = HIDE && res.pct < 100;
  res.notesHtml = res.notes.map(n => `<li>${n}</li>`).join('');
  return res;
}
async function check() {
  const task = TASKS[cur];
  if (isRandom(task) && best[task.id] != null) return;
  const tableUsed = task.noTable ? [] : task.parts.map((p, i) => p.table ? getRows(i) : []).reduce((a, x) => a.concat(x), []).filter(r => r.name.trim() || r.amt.trim());
  const kzUsed = (task.kz || []).filter(id => { const s = getKz(task.id, id); return s.z.trim() || s.n.trim() || s.s.trim(); });
  const msg = (tableUsed.length === 0 && kzUsed.length === 0)
    ? 'Es ist noch nichts eingetragen. Trotzdem abgeben?'
    : (isRandom(task) ? 'Aufgabe jetzt abgeben? Eine Zufallsaufgabe zählt nur beim ersten Mal.' : 'Aufgabe jetzt abgeben und auswerten lassen?');
  if (!(await ask(msg, 'Abgeben'))) return;
  const res = makeResult(task);
  lastScore[task.id] = res; prevUvByTask[task.id] = res.uv;
  if (best[task.id] == null || (!isRandom(task) && res.pct > best[task.id])) { best[task.id] = res.pct; saveBest(); }
  prog.dirty = true; saveProg(); igelSay(res.pct);
  renderAll();
  $('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
