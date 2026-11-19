/* =====================================================================
   Aufgaben-Generatoren: aus einem Startwert (seed) entsteht immer dieselbe Aufgabe.
   Feste Aufgaben je Bereich = feste seeds; "Zufällig" = neuer seed.
   Jede Aufgabe wird geprüft: Rechnung mit und ohne Zwischenrundung weicht höchstens 0,5 Cent ab.
   ===================================================================== */
function rngOf(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const between = (r, lo, hi, st) =>
  Math.round((lo + Math.floor(r() * (Math.floor((hi - lo) / st + 1e-9) + 1)) * st) * 100) / 100;
const eur = v => fmt(v);
const sg = c => c.eh[0],
  pl = c => c.eh[1];

// Gemeinsame Werte einer Aufgabe würfeln
function drawCtx(r, o) {
  o = o || {};
  const L = pick(r, LIEFERANTEN);
  const w = pick(r, WAREN[L.id]);
  const c = { L, ware: w[0], eh: EINH[w[1]], kunden: w.slice(5).map(k => KUNDEN[k]) };
  c.lep = between(r, w[2], w[3], w[4]);
  c.lr = pick(r, [5, 8, 10, 12, 15, 20]);
  c.ls = pick(r, [2, 3]);
  if (o.pack) {
    c.eh = EINH.stk;
    c.packN = pick(r, [10, 12, 20, 24, 25, 50]);
    c.lepPack = Math.round(c.lep * c.packN * 100) / 100;
  }
  if (o.pausch) {
    c.n = pick(r, [10, 20, 25, 40, 50]);
    c.bzk = pick(r, [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]);
    c.pausch = Math.round(c.bzk * c.n * 100) / 100;
  } else c.bzk = Math.max(1, between(r, 1, Math.max(2, Math.round(c.lep * 0.08)), 0.5));
  c.hk = pick(r, [20, 25, 30, 35, 40, 45]);
  c.g = pick(r, [8, 10, 12, 15, 18, 20, 25]);
  c.ks = pick(r, [2, 3]);
  c.vp = o.noVp ? 0 : pick(r, [0, 3, 4, 5]);
  c.kr = pick(r, [5, 8, 10, 12, 15]);
  c.nenneKunde = r() < 0.6 && c.kunden.length > 0;
  c.kunde = c.kunden.length ? pick(r, c.kunden) : '';
  return c;
}
const datPl = w => (/(e|er|el)$/.test(w) ? w + 'n' : w);
const where = c => c.L.name + ' (' + c.L.ort + (c.L.land ? ', ' + c.L.land : '') + ')';
const tEinkauf = c =>
  `Die ${FIRMA} bezieht ${c.ware} von der ${where(c)} zu einem Listeneinkaufspreis von ${eur(c.packN ? c.lepPack : c.lep)} je ${c.packN ? 'Karton zu ' + c.packN + ' Stück' : sg(c)}.`;
const tPackHinweis = c =>
  c.packN
    ? ' Rechnen Sie zuerst den Listeneinkaufspreis je Stück aus.'
    : c.pausch != null
      ? ` Rechnen Sie zuerst die Bezugskosten je ${sg(c)} aus.`
      : '';
const tRabatt = c => `Der Lieferant gewährt ${c.lr} % Liefererrabatt und ${c.ls} % Liefererskonto.`;
const tBzk = c =>
  c.pausch != null
    ? `Für eine Lieferung von ${c.n} ${c.n === 1 ? sg(c) : datPl(pl(c))} fallen Bezugskosten von insgesamt ${eur(c.pausch)} an.`
    : `Die Bezugskosten betragen ${eur(c.bzk)} je ${sg(c)}.`;
const tHkG = c =>
  `Bei der Preisgestaltung rechnet das Unternehmen mit einem Handlungskostenzuschlag von ${c.hk} % und einem Gewinnzuschlag von ${c.g} %.`;
const tHk = c => `Der Handlungskostenzuschlag beträgt ${c.hk} %.`;
const tKunde = c => (c.nenneKunde ? ` Die Ware ist für ${c.kunde} bestimmt.` : '');
const tVerk = c => {
  const a = [`${c.ks} % Kundenskonto`];
  if (c.vp) a.push(`${c.vp} % Vertreterprovision`);
  if (c.kr) a.push(`${c.kr} % Kundenrabatt`);
  return `Den Kunden werden ${a.length > 1 ? a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1] : a[0]} eingeräumt.`;
};
const tVerkMarkt = c => {
  const a = [];
  if (c.kr) a.push(`${c.kr} % Kundenrabatt`);
  a.push(`${c.ks} % Kundenskonto`);
  if (c.vp) a.push(`${c.vp} % Vertreterprovision`);
  return `Bei der Preisgestaltung rechnet das Unternehmen mit ${a.slice(0, -1).join(', ')} und ${a[a.length - 1]}.`;
};
const Q = 'Ermitteln Sie unter Angabe des Kalkulationsschemas ';

// Verkaufsseite rückwärts ohne LVP (Start beim Zielverkaufspreis)
function zvpRueck(c) {
  const s = [];
  if (c.ks) s.push(['KS', u => pc(u('ZVP'), c.ks)]);
  if (c.vp) s.push(['VP', u => pc(u('ZVP'), c.vp)]);
  s.push(['BVP', u => r2(u('ZVP') - (u('KS') || 0) - (u('VP') || 0))]);
  return s;
}
const gRueck = c => [
  ['SKP', u => up(u('BVP'), -c.g)],
  ['G', u => r2(u('BVP') - u('SKP'))]
];
const hkRueck = c => [
  ['BP', u => up(u('SKP'), -c.hk)],
  ['HK', u => r2(u('SKP') - u('BP'))]
];
const stepsEinkaufVor = c => einkaufVor(c);

/* ---------- Die Aufgabentypen ---------- */
const GEN = { vorwaerts: [], rueckwaerts: [], komplett: [] };
const V = (title, opt, fn) => GEN.vorwaerts.push({ title, opt, fn });
const R = (title, opt, fn) => GEN.rueckwaerts.push({ title, opt, fn });
