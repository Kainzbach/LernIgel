/* =====================================================================
   Aufgabe bauen und prüfen: Zusatzwerte, buildTask, feste Aufgaben (FIXED), Zufallsaufgaben
   ===================================================================== */

/* ---------- Zusatzwerte, Bau, Prüfung ---------- */
const half = x => Math.round(x * 2) / 2;
function prep(c, r, o) {
  c.r = r;
  if (o.mkLvp) c.lvp = half(c.lep * (1.6 + r() * 1.0));
  if (o.mkBvp) c.bvp = half(c.lep * (1.4 + r() * 0.7));
  if (o.mkZvp) c.zvp = half(c.lep * (1.5 + r() * 0.8));
  if (o.mkBp) c.bp = half(c.lep * (0.85 + r() * 0.1));
  if (o.kzF) {
    c.bp = half(c.lep * (0.8 + r() * 0.15));
    if (o.kzF === 1) c.skp = half(c.bp * 1.3);
    if (o.kzF === 2) {
      c.lvp = half(c.bp * (1.4 + r() * 0.8));
      c.bvp = c.lvp;
      c.mEin = between(r, 20, 200, 10);
      c.mVerk = c.mEin - between(r, 2, 15, 1);
      c.art = pick(r, ['BB', 'KS', 'NZ', 'TR', 'WL']) + between(r, 1000, 9999, 1);
    }
    if (o.kzF === 3) {
      c.skp = half(c.lep * 1.2);
      c.bvp = half(c.skp * (1.05 + r() * 0.2));
    }
  }
}
function validTask(t) {
  try {
    normTask(t);
    const a = truth(t),
      b = truthExact(t);
    for (const s of t.steps) {
      const k = s[0];
      if (!isFinite(a[k]) || a[k] < 0 || Math.abs(a[k] - b[k]) > 0.005001) return false;
      const fr = (Math.abs(b[k]) * 100) % 1;
      if (Math.abs(fr - 0.5) < 1e-4) return false;
    }
    if (a.G !== undefined && a.G <= 0 && !t.noTable) return false;
    if (a.LEP !== undefined && a.LEP <= 0) return false;
    return true;
  } catch (e) {
    return false;
  }
}
function buildTask(area, gi, seed, id) {
  const g = GEN[area][gi];
  for (let att = 0; att < 4000; att++) {
    const r = rngOf(seed * 7919 + att * 104729 + gi * 31 + 1);
    const c = drawCtx(r, g.opt);
    prep(c, r, g.opt);
    const t = g.fn(c);
    if (t.bad) continue;
    t.id = id;
    t.title = g.title;
    t.area = area;
    t.c = t.ctx || c;
    t.vr = t.vr || [];
    if (c.pausch != null && /Bezugskosten je/.test((t.pre || []).join(' ') + (t.text || '')))
      t.vr.push({ label: 'Bezugskosten je ' + sg(c), hint: 'Pauschale ÷ Menge', value: c.bzk });
    if (c.packN)
      t.vr.push({
        label: 'Listeneinkaufspreis je Stück',
        hint: 'Preis der Packung ÷ Stückzahl',
        value: c.lep
      });
    t.text = t.text.split('{{firma}}').join(FIRMA);
    if (t.konto) t.konto.title = t.konto.title.split('{{firma}}').join(FIRMA);
    if (!t.noTable) {
      normTask(t);
      const have = t.steps.map(s => s[0]);
      rangeKeys(t).forEach(k => {
        if (!have.includes(k)) t.steps.push([k, u => 0]);
      });
      t.parts
        .filter(pp => pp.table && pp.sfx)
        .forEach(pp =>
          partKeys(t, pp).forEach(k => {
            if (!t.steps.some(x => x[0] === k)) t.steps.push([k, u => 0]);
          })
        );
      t.pct = mkPct(t.ctx || c);
    } else {
      t.pct = {};
    }
    if (validTask(t)) return t;
  }
  throw new Error('Aufgabe nicht erzeugbar: ' + area + ' ' + gi);
}
const FIXED = {}; // Bereich -> Liste der IDs der 10 festen Aufgaben
defineKz();
Object.keys(GEN).forEach(area => {
  FIXED[area] = GEN[area].map((g, gi) => {
    const id = (area.startsWith('kz_') ? area : area.slice(0, 3)) + '-' + (gi + 1);
    TASKS.push(buildTask(area, gi, 1000 + gi * 17, id));
    return id;
  });
});
// Zufällige Aufgabe: ID enthält Typ und Startwert, damit sie nach dem Neuladen wieder entsteht
function randomTaskId(area) {
  if (area === 'kennzahlen') area = KZ_AREAS[Math.floor(Math.random() * KZ_AREAS.length)].id;
  return (
    'z-' + area + '-' + Math.floor(Math.random() * GEN[area].length) + '-' + Math.floor(Math.random() * 1e6)
  );
}
function ensureTask(id) {
  let i = TASKS.findIndex(t => t.id === id);
  if (i >= 0) return i;
  const m = /^z-(\w+)-(\d+)-(\d+)$/.exec(id);
  if (!m || !GEN[m[1]] || !GEN[m[1]][+m[2]]) return -1;
  TASKS.push(buildTask(m[1], +m[2], +m[3], id));
  if (typeof applyDraftTo === 'function') applyDraftTo(TASKS[TASKS.length - 1]);
  return TASKS.length - 1;
}
