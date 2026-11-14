/* =====================================================================
   Aufgaben-Generatoren: aus einem Startwert (seed) entsteht immer dieselbe Aufgabe.
   Feste Aufgaben je Bereich = feste seeds; "Zufällig" = neuer seed.
   Jede Aufgabe wird geprüft: Rechnung mit und ohne Zwischenrundung weicht höchstens 0,5 Cent ab.
   ===================================================================== */
function rngOf(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const between = (r, lo, hi, st) => Math.round((lo + Math.floor(r() * (Math.floor((hi - lo) / st + 1e-9) + 1)) * st) * 100) / 100;
const eur = v => fmt(v);
const sg = c => c.eh[0], pl = c => c.eh[1];

// Gemeinsame Werte einer Aufgabe würfeln
function drawCtx(r, o) {
  o = o || {};
  const L = pick(r, LIEFERANTEN); const w = pick(r, WAREN[L.id]);
  const c = { L, ware: w[0], eh: EINH[w[1]], kunden: w.slice(5).map(k => KUNDEN[k]) };
  c.lep = between(r, w[2], w[3], w[4]);
  c.lr = pick(r, [5, 8, 10, 12, 15, 20]); c.ls = pick(r, [2, 3]);
  if (o.pack) { c.eh = EINH.stk; c.packN = pick(r, [10, 12, 20, 24, 25, 50]); c.lepPack = Math.round(c.lep * c.packN * 100) / 100; }
  if (o.pausch) { c.n = pick(r, [10, 20, 25, 40, 50]); c.bzk = pick(r, [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]); c.pausch = Math.round(c.bzk * c.n * 100) / 100; }
  else c.bzk = Math.max(1, between(r, 1, Math.max(2, Math.round(c.lep * 0.08)), 0.5));
  c.hk = pick(r, [20, 25, 30, 35, 40, 45]); c.g = pick(r, [8, 10, 12, 15, 18, 20, 25]);
  c.ks = pick(r, [2, 3]); c.vp = o.noVp ? 0 : pick(r, [0, 3, 4, 5]); c.kr = pick(r, [5, 8, 10, 12, 15]);
  c.nenneKunde = r() < 0.6 && c.kunden.length > 0; c.kunde = c.kunden.length ? pick(r, c.kunden) : '';
  return c;
}
const datPl = w => /(e|er|el)$/.test(w) ? w + 'n' : w;
const where = c => c.L.name + ' (' + c.L.ort + (c.L.land ? ', ' + c.L.land : '') + ')';
const tEinkauf = c => `Die ${FIRMA} bezieht ${c.ware} von der ${where(c)} zu einem Listeneinkaufspreis von ${eur(c.packN ? c.lepPack : c.lep)} je ${c.packN ? 'Karton zu ' + c.packN + ' Stück' : sg(c)}.`;
const tPackHinweis = c => c.packN ? ' Rechnen Sie zuerst den Listeneinkaufspreis je Stück aus.' : (c.pausch != null ? ` Rechnen Sie zuerst die Bezugskosten je ${sg(c)} aus.` : '');
const tRabatt = c => `Der Lieferant gewährt ${c.lr} % Liefererrabatt und ${c.ls} % Liefererskonto.`;
const tBzk = c => c.pausch != null
  ? `Für eine Lieferung von ${c.n} ${c.n === 1 ? sg(c) : datPl(pl(c))} fallen Bezugskosten von insgesamt ${eur(c.pausch)} an.`
  : `Die Bezugskosten betragen ${eur(c.bzk)} je ${sg(c)}.`;
const tHkG = c => `Bei der Preisgestaltung rechnet das Unternehmen mit einem Handlungskostenzuschlag von ${c.hk} % und einem Gewinnzuschlag von ${c.g} %.`;
const tHk = c => `Der Handlungskostenzuschlag beträgt ${c.hk} %.`;
const tKunde = c => (c.nenneKunde ? ` Die Ware ist für ${c.kunde} bestimmt.` : '');
const tVerk = c => { const a = [`${c.ks} % Kundenskonto`]; if (c.vp) a.push(`${c.vp} % Vertreterprovision`); if (c.kr) a.push(`${c.kr} % Kundenrabatt`);
  return `Den Kunden werden ${a.length > 1 ? a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1] : a[0]} eingeräumt.`; };
const tVerkMarkt = c => { const a = []; if (c.kr) a.push(`${c.kr} % Kundenrabatt`); a.push(`${c.ks} % Kundenskonto`); if (c.vp) a.push(`${c.vp} % Vertreterprovision`);
  return `Bei der Preisgestaltung rechnet das Unternehmen mit ${a.slice(0, -1).join(', ')} und ${a[a.length - 1]}.`; };
const Q = 'Ermitteln Sie unter Angabe des Kalkulationsschemas ';

// Verkaufsseite rückwärts ohne LVP (Start beim Zielverkaufspreis)
function zvpRueck(c) {
  const s = [];
  if (c.ks) s.push(['KS', u => pc(u('ZVP'), c.ks)]);
  if (c.vp) s.push(['VP', u => pc(u('ZVP'), c.vp)]);
  s.push(['BVP', u => r2(u('ZVP') - (u('KS') || 0) - (u('VP') || 0))]);
  return s;
}
const gRueck = c => [['SKP', u => up(u('BVP'), -c.g)], ['G', u => r2(u('BVP') - u('SKP'))]];
const hkRueck = c => [['BP', u => up(u('SKP'), -c.hk)], ['HK', u => r2(u('SKP') - u('BP'))]];
const stepsEinkaufVor = c => einkaufVor(c);

/* ---------- Die Aufgabentypen ---------- */
const GEN = { vorwaerts: [], rueckwaerts: [], komplett: [] };
const V = (title, opt, fn) => GEN.vorwaerts.push({ title, opt, fn });
const R = (title, opt, fn) => GEN.rueckwaerts.push({ title, opt, fn });
const vorTask = (c, o) => Object.assign({ dirOf: () => 'v', kzBase: 'LVP' }, o);

V('Bezugspreis', {}, c => vorTask(c, { from: 'LEP', to: 'BP',
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + Q + 'den Bezugspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Bezugspreis', table: true }], steps: einkaufVor(c) }));
V('Selbstkostenpreis', {}, c => vorTask(c, { from: 'LEP', to: 'SKP',
  text: [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ') + '\n\n' + Q + 'den Selbstkostenpreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Selbstkostenpreis', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP')) }));
V('Barverkaufspreis', {}, c => vorTask(c, { from: 'LEP', to: 'BVP',
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + tKunde(c) + '\n\n' + Q + 'den Barverkaufspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Barverkaufspreis', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP')) }));
V('Listenverkaufspreis', {}, c => vorTask(c, { from: 'LEP', to: 'LVP',
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ' ' + tVerk(c) + tKunde(c) + '\n\n' + Q + 'den Listenverkaufspreis (netto) je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Listenverkaufspreis', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }));
V('Listenverkaufspreis ohne Vertreterprovision', { noVp: true }, c => vorTask(c, { from: 'LEP', to: 'LVP',
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ' ' + tVerk(c) + '\n\n' + Q + 'den Listenverkaufspreis (netto) je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Listenverkaufspreis', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }));
V('Start beim Bezugspreis', {}, c => { const bp = Math.round(c.lep * (1 - c.lr / 100) * 100) / 100; c.bp = bp; const d = Object.assign({}, c, { lr: null, ls: null, bzk: null });
  return vorTask(d, { from: 'BP', to: 'LVP', given: ['BP'], ctx: d,
    text: `Die ${FIRMA} bezieht ${c.ware} von der ${where(c)}. Der Bezugspreis beträgt ${eur(bp)} je ${sg(c)}.\n\n` + tHkG(c) + ' ' + tVerk(c) + '\n\n' + Q + 'den Listenverkaufspreis (netto) je ' + sg(c) + '.',
    parts: [{ label: '', title: 'Listenverkaufspreis', table: true }], steps: [].concat([['BP', u => bp]], hkVor(c, 'BP'), verkaufVor(c)) }); });
V('Bezugskosten als Pauschale', { pausch: true }, c => vorTask(c, { from: 'LEP', to: 'LVP', pre: [`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`],
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ' ' + tVerk(c) + '\n\n' + Q + 'den Listenverkaufspreis (netto) je ' + sg(c) + '.' + tPackHinweis(c),
  parts: [{ label: '', title: 'Listenverkaufspreis', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }));
V('Stückpreis aus der Packung', { pack: true, noVp: true }, c => vorTask(c, { from: 'LEP', to: 'BVP', pre: [`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`],
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + '\n\n' + Q + 'den Barverkaufspreis je Stück.' + tPackHinweis(c),
  parts: [{ label: '', title: 'Barverkaufspreis je Stück', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP')) }));
V('Stückpreis aus der Packung bis zum Listenverkaufspreis', { pack: true, noVp: true }, c => vorTask(c, { from: 'LEP', to: 'LVP', pre: [`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`],
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ' ' + tVerk(c) + '\n\n' + Q + 'den Listenverkaufspreis (netto) je Stück.' + tPackHinweis(c),
  parts: [{ label: '', title: 'Listenverkaufspreis je Stück', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }));
V('Zielverkaufspreis', { noKr: true }, c => { c.kr = 0; return vorTask(c, { from: 'LEP', to: 'ZVP', kzBase: 'ZVP',
  text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ' ' + tVerk(c) + '\n\n' + Q + 'den Zielverkaufspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Zielverkaufspreis', table: true }], steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }); });

const rueckTask = (c, o) => Object.assign({ dirOf: () => 'r', kzBase: 'LVP' }, o);
const lvpGiven = c => `Am Markt lässt sich ein Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} durchsetzen.`;
R('Barverkaufspreis', { mkLvp: true }, c => rueckTask(c, { from: 'BVP', to: 'LVP', given: ['LVP'],
  text: `Die ${FIRMA} verkauft ${c.ware} zu einem Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)}. ` + tVerkMarkt(c) + '\n\n' + Q + 'den Barverkaufspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Barverkaufspreis', table: true }], steps: [['LVP', u => c.lvp]].concat(verkaufRueck(c)) }));
R('Zielverkaufspreis', { mkLvp: true, noVp: true }, c => rueckTask(c, { from: 'ZVP', to: 'LVP', given: ['LVP'],
  text: `Die ${FIRMA} verkauft ${c.ware} zu einem Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)}. Dabei werden ${c.kr} % Kundenrabatt eingeräumt.\n\n` + Q + 'den Zielverkaufspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Zielverkaufspreis', table: true }], steps: [['LVP', u => c.lvp], ['KR', u => pc(u('LVP'), c.kr)], ['ZVP', u => r2(u('LVP') - u('KR'))]] }));
R('Selbstkostenpreis', { mkLvp: true }, c => rueckTask(c, { from: 'SKP', to: 'LVP', given: ['LVP'],
  text: lvpGiven(c) + ' ' + tVerkMarkt(c) + ` Der Gewinnzuschlag beträgt ${c.g} %.\n\n` + Q + 'den Selbstkostenpreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Selbstkostenpreis', table: true }], steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c)) }));
R('Bezugspreis', { mkLvp: true }, c => rueckTask(c, { from: 'BP', to: 'LVP', given: ['LVP'],
  text: lvpGiven(c) + ' ' + tVerkMarkt(c) + ` Der Gewinnzuschlag beträgt ${c.g} %, der Handlungskostenzuschlag ${c.hk} %.\n\n` + Q + 'den Bezugspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Bezugspreis', table: true }], steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c)) }));
R('Höchster Listeneinkaufspreis', { mkLvp: true }, c => rueckTask(c, { from: 'LEP', to: 'LVP', given: ['LVP'],
  text: `Die ${FIRMA} möchte ${c.ware} in ihr Sortiment aufnehmen. ` + lvpGiven(c) + '\n\n' + tVerkMarkt(c) + ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` + tRabatt(c) + ' ' + tBzk(c) + '\n\n' + Q + 'den höchsten Listeneinkaufspreis, zu dem das Unternehmen einkaufen kann.',
  parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
  steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c)) }));
R('Start beim Barverkaufspreis', { mkBvp: true }, c => rueckTask(c, { from: 'LEP', to: 'BVP', given: ['BVP'],
  text: `Die ${FIRMA} kann ${c.ware} zu einem Barverkaufspreis von ${eur(c.bvp)} je ${sg(c)} verkaufen. ` + tHkG(c) + ' ' + tRabatt(c) + ' ' + tBzk(c) + '\n\n' + Q + 'den höchsten Listeneinkaufspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }], steps: [].concat([['BVP', u => c.bvp]], gRueck(c), hkRueck(c), einkaufRueck(c)) }));
R('Start beim Zielverkaufspreis', { mkZvp: true }, c => rueckTask(c, { from: 'BP', to: 'ZVP', given: ['ZVP'],
  text: `Der Zielverkaufspreis für ${c.ware} beträgt ${eur(c.zvp)} je ${sg(c)}. Es werden ${c.ks} % Kundenskonto` + (c.vp ? ` und ${c.vp} % Vertreterprovision` : '') + ` gewährt. ` + tHkG(c) + '\n\n' + Q + 'den Bezugspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Bezugspreis', table: true }], steps: [].concat([['ZVP', u => c.zvp]], zvpRueck(c), gRueck(c), hkRueck(c)) }));
R('Höchster Listeneinkaufspreis aus dem Bezugspreis', { mkBp: true }, c => rueckTask(c, { from: 'LEP', to: 'BP', given: ['BP'],
  text: `Die ${FIRMA} darf für ${c.ware} höchstens einen Bezugspreis von ${eur(c.bp)} je ${sg(c)} zahlen. ` + tRabatt(c) + ' ' + tBzk(c) + '\n\n' + Q + 'den höchsten Listeneinkaufspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }], steps: [['BP', u => c.bp]].concat(einkaufRueck(c)) }));
R('Höchster Listeneinkaufspreis mit Bezugskostenpauschale', { mkLvp: true, pausch: true }, c => rueckTask(c, { from: 'LEP', to: 'LVP', given: ['LVP'], pre: [`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`],
  text: lvpGiven(c) + '\n\n' + tVerkMarkt(c) + ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` + tRabatt(c) + ' ' + tBzk(c) + '\n\n' + Q + 'den höchsten Listeneinkaufspreis je ' + sg(c) + '.' + tPackHinweis(c),
  parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
  steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c)) }));
R('Höchster Listeneinkaufspreis ohne Provision', { mkLvp: true, noVp: true }, c => rueckTask(c, { from: 'LEP', to: 'LVP', given: ['LVP'],
  text: lvpGiven(c) + '\n\n' + tVerkMarkt(c) + ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` + tRabatt(c) + ' ' + tBzk(c) + '\n\n' + Q + 'den höchsten Listeneinkaufspreis je ' + sg(c) + '.',
  parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
  steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c)) }));

/* ---------- Komplettaufgaben: mehrere Teile, ein durchgehender Rechenweg (Typen A–E) ---------- */
const KZNAME = { zuschlag: 'den Kalkulationszuschlag', faktor: 'den Kalkulationsfaktor', spanne: 'die Handelsspanne', hkz: 'den Handlungskostenzuschlag', gwz: 'den Gewinnzuschlag', gewinn: 'den Gewinn in Prozent', hkzK: 'den Handlungskostenzuschlagssatz', gwzK: 'den Gewinnzuschlagssatz' };
const joinUnd = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1] : a[0];
const letter = i => String.fromCharCode(97 + i) + ')';
const kzAsk = ids => joinUnd(ids.map(k => KZNAME[k] + (KZ[k].dec != null ? ' (' + KZ[k].dec + ' Nachkommastellen)' : '')));
const kzTitleOf = ids => joinUnd(ids.map(k => KZ[k].title));
const preLines = c => { const p = []; if (c.pausch != null) p.push(`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`); if (c.packN) p.push(`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`); return p; };
// Ersatzwert: weicht bewusst vom richtigen Wert ab
const wrongEuro = (v, c) => { const f = pick(c.r, [0.95, 0.96, 0.97, 1.03, 1.04, 1.05]); let e = Math.round(v * f * 10) / 10; if (Math.abs(e - v) < 0.15) e = Math.round((v + 0.5) * 10) / 10; return e; };
const wrongSatz = (v, c) => { let e = Math.round(v * (c.r() < 0.5 ? 0.8 : 1.2) / 5) * 5; if (e < 5) e = 5; if (Math.abs(e - v) < 1.5) e += 5; return e; };
const ersNote = (von, nach, was) => `\n▸ Falls Sie ${von} nicht lösen konnten, rechnen Sie hier mit ${was} weiter.`;
const grundl = n => n <= 1 ? 'a)' : n === 2 ? 'a) und b)' : 'a), b) und c)';
const Qauf = (n, extra) => `Ermitteln Sie auf der Grundlage Ihrer Ergebnisse aus ${grundl(n)} ${extra || ''}`;
const KTITLE = { BP: 'Bezugspreis', SKP: 'Selbstkostenpreis', BVP: 'Barverkaufspreis', LVP: 'Listenverkaufspreis', LEP: 'Höchster Listeneinkaufspreis' };
const TGT = { BP: 'den Bezugspreis', SKP: 'den Selbstkostenpreis', BVP: 'den Barverkaufspreis', LVP: 'den Listenverkaufspreis (netto)', LEP: 'den höchsten Listeneinkaufspreis', G: 'den Gewinn in Euro' };
const syn = (t, c) => c.r() < 0.5 ? t : t.split('Kundenskonto').join('Kundenkonto');
const pushKO = (title, opt, fn) => GEN.komplett.push({ title, opt, fn });
const tGVerk = c => `Der Gewinnzuschlag beträgt ${c.g} %. ` + tVerk(c);
const ersTask = (c, t) => Object.assign(t, { pre: preLines(c) });
const ASKJE = c => (c.packN ? ' je Stück' : ' je ' + sg(c));

// A: Vorwärts durchgehend, danach Kennzahlen aus dem Ergebnis (Ersatzwert für das Ergebnis aus a)
function KA(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: false }, c => {
    const to = o.to || 'LVP';
    const steps = [].concat(einkaufVor(c), hkVor(c, 'BP'), to === 'LVP' ? verkaufVor(c) : []);
    const tr = truth({ steps }); const e = wrongEuro(tr[to], c);
    const intro = [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ((to === 'LVP' || o.distract) ? ' ' + tVerk(c) : '');
    const qa = `a) ${Q}${TGT[to]}${ASKJE(c)}.${tPackHinweis(c)}`;
    const qb = `b) ${Qauf(1, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.` + ersNote('a)', 'b)', `einem ${SCH[to].alias[0]} von ${eur(e)}`);
    return ersTask(c, { from: 'LEP', to, kzBase: to, dirOf: () => 'v', given: [], steps,
      parts: [{ label: 'a)', title: KTITLE[to], table: true, from: 'LEP', to }, { label: 'b)', title: kzTitleOf(o.kz), kz: o.kz, ersatz: { [to]: e } }],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb, c) });
  });
}
// E: Rückwärts durchgehend (Listenverkaufspreis gegeben), danach Kennzahlen
function KE(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, mkLvp: true }, c => {
    const steps = [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c));
    const tr = truth({ steps }); const e = wrongEuro(tr.BP, c);
    const intro = `Die ${FIRMA} möchte ${c.ware} in ihr Sortiment aufnehmen. ` + lvpGiven(c) + '\n\n' + tVerkMarkt(c) + ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` + tRabatt(c) + ' ' + tBzk(c);
    const qa = `a) ${Q}den höchsten Listeneinkaufspreis je ${sg(c)}.${tPackHinweis(c)}`;
    const qb = `b) ${Qauf(1, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.` + ersNote('a)', 'b)', `einem Bezugspreis von ${eur(e)}`);
    return ersTask(c, { from: 'LEP', to: 'LVP', kzBase: 'LVP', dirOf: () => 'r', given: ['LVP'], steps,
      parts: [{ label: 'a)', title: KTITLE.LEP, table: true }, { label: 'b)', title: kzTitleOf(o.kz), kz: o.kz, ersatz: { BP: e } }],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb, c) });
  });
}
// B: Vorwärts bis Selbstkostenpreis, dann Barverkaufspreis rückwärts ab Listenverkaufspreis, Gewinn als Differenz
function KB(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: true }, c => {
    const base = truth({ steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }); c.lvp = Math.round(base.LVP / 10) * 10;
    const steps = [].concat(einkaufVor(c), hkVor(Object.assign({}, c, { g: null }), 'BP'), [['LVP', u => c.lvp]], verkaufRueck(c), [['G', u => r2(u('BVP') - u('SKP'))]]);
    const dirOf = k => k === 'G' ? 'd' : ['KR', 'ZVP', 'KS', 'VP', 'BVP'].includes(k) ? 'r' : 'v';
    const tr = truth({ steps }); const e1 = wrongEuro(tr.SKP, c); let e2 = Math.round((e1 + tr.G * (c.r() < 0.5 ? 0.85 : 1.15)) * 10) / 10; if (Math.abs(e2 - tr.BVP) < 0.4) e2 = Math.round((e2 + 1.5) * 10) / 10; if (e2 - e1 < 0.3) e2 = Math.round((e1 + 0.5) * 10) / 10;
    const intro = [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ');
    const qa = `a) ${Q}den Selbstkostenpreis${ASKJE(c)}.${tPackHinweis(c)}`;
    const kz = o.kz || ['gewinn'];
    const qb = `b) Die ${FIRMA} möchte ${c.ware} zu einem Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} anbieten. ${tVerk(c)} Ermitteln Sie auf der Grundlage Ihres Ergebnisses aus a) unter Angabe des Kalkulationsschemas den Barverkaufspreis${ASKJE(c)} und den Gewinn in Euro. Berechnen Sie außerdem ${kzAsk(kz)}.` + ersNote('a)', 'b)', `Selbstkosten von ${eur(e1)}`);
    return ersTask(c, { from: 'LEP', to: 'LVP', kzBase: 'LVP', dirOf, given: ['LVP'], steps,
      parts: [{ label: 'a)', title: KTITLE.SKP, table: true, from: 'LEP', to: 'SKP' },
              { label: 'b)', title: 'Barverkaufspreis und Gewinn in Euro', table: true, from: 'SKP', to: 'LVP', rank: ['G', 'SKP', 'BVP', 'KS', 'VP', 'ZVP', 'KR', 'LVP'], signs: { G: '=' }, rankAlt: ['SKP', 'G', 'BVP', 'KS', 'VP', 'ZVP', 'KR', 'LVP'], ersatz: { SKP: e1 } },
              { title: kzTitleOf(kz), kz }],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb, c) });
  });
}
// D: Packung/Pauschale möglich, Schnitt am Selbstkostenpreis, Teil b) bringt neue Sätze
function KD(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: false }, c => {
    const steps = [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c));
    const tr = truth({ steps }); const e = wrongEuro(tr.SKP, c);
    const intro = [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ');
    const qa = `a) ${Q}den Selbstkostenpreis${ASKJE(c)}.${tPackHinweis(c)}`;
    const qb = `b) ${tGVerk(c)} Ermitteln Sie auf der Grundlage Ihres Ergebnisses aus a) unter Angabe des Kalkulationsschemas den Listenverkaufspreis (netto)${ASKJE(c)}.` + ersNote('a)', 'b)', `Selbstkosten von ${eur(e)}`);
    const parts = [{ label: 'a)', title: KTITLE.SKP, table: true, from: 'LEP', to: 'SKP' }, { label: 'b)', title: KTITLE.LVP, table: true, from: 'SKP', to: 'LVP', ersatz: { SKP: e } }];
    let text = intro + '\n\n' + qa + '\n\n' + qb;
    if (o.kz) { parts.push({ label: 'c)', title: kzTitleOf(o.kz), kz: o.kz }); text += `\n\nc) ${Qauf(2, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.`; }
    return ersTask(c, { from: 'LEP', to: 'LVP', kzBase: 'LVP', dirOf: () => 'v', given: [], steps, parts, text: syn(text, c) });
  });
}
// C: Erst einen Satz aus Kostenzahlen ermitteln (Kennzahl), dann damit das Schema rechnen
function KC(title, o) {
  pushKO(title, { noVp: !!o.noVp, mkLvp: false, pausch: false, mkBp: o.from === 'BP' }, c => {
    const hk = o.sat.includes('hkzK'), gw = o.sat.includes('gwzK'); const S = [];
    if (hk) { c.we = between(c.r, 150000, 900000, 10000); const pct = 18 + c.r() * 40; c.hks = Math.round(c.we * pct / 100 / 10) * 10; S.push(['WE', u => c.we], ['HKS', u => c.hks], ['HKSATZ', u => EXACT ? u('HKS') * 100 / u('WE') : Math.round(u('HKS') * 100 / u('WE') * 100) / 100]); c.hk = Math.round(c.hks * 100 / c.we * 100) / 100; }
    if (gw) { c.sks = between(c.r, 400000, 2400000, 10000); const pct = 5 + c.r() * 17; c.gs = Math.round(c.sks * pct / 100 / 10) * 10; S.push(['SKS', u => c.sks], ['GS', u => c.gs], ['GWSATZ', u => EXACT ? u('GS') * 100 / u('SKS') : Math.round(u('GS') * 100 / u('SKS') * 100) / 100]); c.g = Math.round(c.gs * 100 / c.sks * 100) / 100; }
    const to = o.to, from = o.from; const steps = [].concat(S);
    const einkauf = from === 'LEP' ? einkaufVor(c) : [['BP', u => c.bp]];
    steps.push(...einkauf);
    steps.push(['HK', u => r2(u('BP') * (hk ? u('HKSATZ') : c.hk) / 100)], ['SKP', u => r2(u('BP') + u('HK'))]);
    if (to !== 'SKP') { steps.push(['G', u => r2(u('SKP') * (gw ? u('GWSATZ') : c.g) / 100)], ['BVP', u => r2(u('SKP') + u('G'))]); if (to === 'LVP') steps.push(...verkaufVor(c)); }
    const tr = truth({ steps });
    const bez = c.r() < 0.5 ? 'Bezugspreis' : 'Einstandspreis';
    const lines = []; if (hk) lines.push(`Wareneinsatz ${eur(c.we)}`, `Summe der Handlungskosten ${eur(c.hks)}`); if (gw) lines.push(`Selbstkosten insgesamt ${eur(c.sks)}`, `erzielter Gewinn insgesamt ${eur(c.gs)}`);
    const intro = `Die Kostenrechnung der ${FIRMA} liefert folgende Zahlen:\n${lines.join('\n')}`;
    const ids = o.sat; const ers = {}; const parts = []; const bits = [];
    if (hk) { ers.HKSATZ = wrongSatz(tr.HKSATZ, c); bits.push(`einem Handlungskostenzuschlag von ${fmtPct(ers.HKSATZ)} %`); }
    if (gw) { ers.GWSATZ = wrongSatz(tr.GWSATZ, c); bits.push(`einem Gewinnzuschlag von ${fmtPct(ers.GWSATZ)} %`); }
    const qa = `a) Ermitteln Sie ${kzAsk(ids)}!`;
    const qnote = ersNote('a)', 'b)', joinUnd(bits));
    let qb;
    if (from === 'LEP') qb = `b) ${[tEinkauf(c), tRabatt(c), tBzk(c)].join(' ')}${!gw && to === 'LVP' ? ' Der Gewinnzuschlag beträgt ' + c.g + ' %. ' + tVerk(c) : ''}\nKalkulieren Sie unter Angabe des Kalkulationsschemas ${TGT[to]} je ${sg(c)}.`;
    else qb = `b) Die ${FIRMA} bezieht ${c.ware} zu einem ${bez} von ${eur(c.bp)} je ${sg(c)}.${gw && !hk ? ' Der Handlungskostenzuschlag beträgt ' + c.hk + ' %.' : ''}\nKalkulieren Sie unter Angabe des Kalkulationsschemas ${TGT[to]} je ${sg(c)}.`;
    return { from, to, kzBase: 'LVP', dirOf: () => 'v', given: from === 'BP' ? ['BP'] : [], steps, kzFirst: true, pre: [], noVpOk: true,
      parts: [{ label: 'a)', title: kzTitleOf(ids), kz: ids, feeds: Object.assign({}, hk ? { hkzK: 'HKSATZ' } : {}, gw ? { gwzK: 'GWSATZ' } : {}) },
              { label: 'b)', title: KTITLE[to], table: true, from, to, ersatz: ers }],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb + qnote, c) };
  });
}

// F: Vorwärts bis LVP, Kennzahlen, dann Preis eines Mitbewerbers rückwärts bis zum Bezugspreis (zweite Rechenkette, eigene Zeilen mit Anhang 2)
const wrapF = (f, x) => u => f(k => u(k + x));
const sfxSteps = (steps, x) => steps.map(st => { const o = [st[0] + x, wrapF(st[1], x)]; if (st[2]) o.push(st[2].map(f => wrapF(f, x))); return o; });
function KF(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: false }, c => {
    const steps1 = [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c));
    const tr1 = truth({ steps: steps1 }); const e = wrongEuro(tr1.LVP, c);
    const at = o.lvpM ? 'LVP' : 'BVP';
    const m = Math.round((Math.round(tr1[at] * (0.86 + c.r() * 0.08)) - 0.01) * 100) / 100;
    const base2 = at === 'BVP' ? [['BVP', u => m]].concat(gRueck(c), hkRueck(c)) : [['LVP', u => m]].concat(verkaufRueck(c), gRueck(c), hkRueck(c));
    const steps = steps1.concat(sfxSteps(base2, '2'));
    const intro = [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ' ' + tVerk(c);
    const qa = `a) ${Q}den Listenverkaufspreis (netto)${ASKJE(c)}.${tPackHinweis(c)}`;
    const qb = `b) ${Qauf(1, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.` + ersNote('a)', 'b)', `einem Listenverkaufspreis von ${eur(e)}`);
    const daten = joinUnd([c.ks ? c.ks + ' % Kundenskonto' : '', c.vp ? c.vp + ' % Vertreterprovision' : '', c.hk + ' % Handlungskostenzuschlag', c.kr + ' % Kundenrabatt', c.g + ' % Gewinnzuschlag'].filter(Boolean));
    const preis = at === 'BVP' ? 'Barverkaufspreis' : 'Listenverkaufspreis (netto)';
    const qc = at === 'BVP'
      ? `c) Sechs Monate nach der Einführung bietet ein Mitbewerber ${c.ware} zu einem ${preis} von ${eur(m)}${ASKJE(c)} an. Ermitteln Sie unter Angabe des Kalkulationsschemas, zu welchem Bezugspreis${ASKJE(c)} die ${FIRMA} ${c.ware} beziehen müsste, um ebenfalls zu diesem Preis anbieten zu können. Verwenden Sie dabei die folgenden Daten: ${daten}.`
      : `c) Sechs Monate nach der Einführung bietet ein Mitbewerber ${c.ware} zu einem ${preis} von ${eur(m)}${ASKJE(c)} an. Ermitteln Sie, zu welchem Bezugspreis${ASKJE(c)} die ${FIRMA} ${c.ware} beziehen müsste, um ebenfalls zu diesem Preis anbieten zu können. Rechnen Sie mit den bisherigen Sätzen.`;
    return ersTask(c, { from: 'LEP', to: 'LVP', kzBase: 'LVP', dirOf: k => sfxOf(k) ? 'r' : 'v', given: [], steps,
      parts: [{ label: 'a)', title: KTITLE.LVP, table: true, from: 'LEP', to: 'LVP' }, { label: 'b)', title: kzTitleOf(o.kz), kz: o.kz, ersatz: { LVP: e } },
              Object.assign({ label: 'c)', title: 'Bezugspreis für den Preis des Mitbewerbers', table: true, from: 'BP', to: at, sfx: '2', given: [at], ans: true }, at === 'LVP' ? { alt: 'kw', kwPrice: m } : {})],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb + '\n\n' + qc, c) });
  });
}

// Reihenfolge gemischt: Typen und Tabellenzahl wechseln (14 Aufgaben mit einer Tabelle, 6 mit zwei)
KA('Vorwärts bis zum Listenverkaufspreis, dann Kennzahlen', { kz: ['faktor', 'spanne'] });
KC('Handlungskostenzuschlag ermitteln, dann Selbstkostenpreis', { sat: ['hkzK'], from: 'BP', to: 'SKP' });
KF('Vorwärts, Kennzahlen und Preis eines Mitbewerbers (Barverkaufspreis)', { kz: ['faktor', 'spanne'] });
KE('Rückwärts bis zum Listeneinkaufspreis, dann Kennzahlen', { kz: ['zuschlag', 'faktor', 'spanne'] });
KA('Vorwärts mit Bezugskostenpauschale, dann Kennzahl', { kz: ['spanne'], pausch: true });
KC('Handlungskostenzuschlag ermitteln, dann Listenverkaufspreis', { sat: ['hkzK'], from: 'LEP', to: 'LVP' });
KF('Vorwärts, Kennzahlen und Preis eines Mitbewerbers (Listenverkaufspreis)', { kz: ['faktor', 'spanne'], lvpM: true });
KA('Vorwärts mit Stückpreis aus der Packung, dann Kennzahlen', { kz: ['zuschlag', 'spanne'], pack: true, noVp: true });
KE('Rückwärts ohne Provision, dann Kennzahlen', { kz: ['faktor', 'spanne'], noVp: true });
KB('Selbstkosten, Barverkaufspreis und Gewinn', { kz: ['gewinn'] });
KC('Gewinnzuschlag ermitteln, dann Barverkaufspreis', { sat: ['gwzK'], from: 'BP', to: 'BVP' });
KA('Barverkaufspreis, dann Kennzahlen', { kz: ['gewinn', 'spanne'], to: 'BVP', distract: true });
KF('Vorwärts mit Bezugskostenpauschale, Kennzahlen und Mitbewerber (Barverkaufspreis)', { kz: ['zuschlag', 'spanne'], pausch: true });
KE('Rückwärts mit Bezugskostenpauschale, dann Kennzahlen', { kz: ['zuschlag', 'spanne'], pausch: true });
KC('Handlungskosten- und Gewinnzuschlag ermitteln, dann Barverkaufspreis', { sat: ['hkzK', 'gwzK'], from: 'BP', to: 'BVP' });
KD('Packung, Selbstkostenpreis und Listenverkaufspreis', { pack: true, noVp: true });
KA('Vorwärts mit Pauschale bis zum Barverkaufspreis, dann Kennzahl', { kz: ['gewinn'], to: 'BVP', pausch: true, distract: true });
KF('Vorwärts mit Stückpreis aus der Packung, Kennzahlen und Mitbewerber (Listenverkaufspreis)', { kz: ['faktor'], lvpM: true, pack: true, noVp: true });
KC('Gewinnzuschlag ermitteln, dann Listenverkaufspreis', { sat: ['gwzK'], from: 'LEP', to: 'LVP' });
KA('Vorwärts mit Stückpreis bis zum Barverkaufspreis, dann Kennzahl', { kz: ['gewinn'], to: 'BVP', pack: true, noVp: true, distract: true });

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
    if (o.kzF === 2) { c.lvp = half(c.bp * (1.4 + r() * 0.8)); c.bvp = c.lvp; c.mEin = between(r, 20, 200, 10); c.mVerk = c.mEin - between(r, 2, 15, 1); c.art = pick(r, ['BB', 'KS', 'NZ', 'TR', 'WL']) + between(r, 1000, 9999, 1); }
    if (o.kzF === 3) { c.skp = half(c.lep * 1.2); c.bvp = half(c.skp * (1.05 + r() * 0.2)); }
  }
}
function validTask(t) {
  try {
    normTask(t); const a = truth(t), b = truthExact(t);
    for (const s of t.steps) { const k = s[0]; if (!isFinite(a[k]) || a[k] < 0 || Math.abs(a[k] - b[k]) > 0.005001) return false; const fr = (Math.abs(b[k]) * 100) % 1; if (Math.abs(fr - 0.5) < 1e-4) return false; }
    if (a.G !== undefined && a.G <= 0 && !t.noTable) return false;
    if (a.LEP !== undefined && a.LEP <= 0) return false;
    return true;
  } catch (e) { return false; }
}
function buildTask(area, gi, seed, id) {
  const g = GEN[area][gi];
  for (let att = 0; att < 4000; att++) {
    const r = rngOf(seed * 7919 + att * 104729 + gi * 31 + 1);
    const c = drawCtx(r, g.opt); prep(c, r, g.opt);
    const t = g.fn(c); if (t.bad) continue;
    t.id = id; t.title = g.title; t.area = area; t.c = t.ctx || c;
    t.vr = t.vr || [];
    if (c.pausch != null && /Bezugskosten je/.test((t.pre || []).join(' ') + (t.text || ''))) t.vr.push({ label: 'Bezugskosten je ' + sg(c), hint: 'Pauschale ÷ Menge', value: c.bzk });
    if (c.packN) t.vr.push({ label: 'Listeneinkaufspreis je Stück', hint: 'Preis der Packung ÷ Stückzahl', value: c.lep });
    t.text = t.text.split('{{firma}}').join(FIRMA); if (t.konto) t.konto.title = t.konto.title.split('{{firma}}').join(FIRMA);
    if (!t.noTable) {
      normTask(t);
      const have = t.steps.map(s => s[0]);
      rangeKeys(t).forEach(k => { if (!have.includes(k)) t.steps.push([k, u => 0]); });
      t.parts.filter(pp => pp.table && pp.sfx).forEach(pp => partKeys(t, pp).forEach(k => { if (!t.steps.some(x => x[0] === k)) t.steps.push([k, u => 0]); }));
      t.pct = mkPct(t.ctx || c);
    } else { t.pct = {}; }
    if (validTask(t)) return t;
  }
  throw new Error('Aufgabe nicht erzeugbar: ' + area + ' ' + gi);
}
const FIXED = {}; // Bereich -> Liste der IDs der 10 festen Aufgaben
defineKz();
Object.keys(GEN).forEach(area => {
  FIXED[area] = GEN[area].map((g, gi) => { const id = (area.startsWith('kz_') ? area : area.slice(0, 3)) + '-' + (gi + 1); TASKS.push(buildTask(area, gi, 1000 + gi * 17, id)); return id; });
});
// Zufällige Aufgabe: ID enthält Typ und Startwert, damit sie nach dem Neuladen wieder entsteht
function randomTaskId(area) { if (area === 'kennzahlen') area = KZ_AREAS[Math.floor(Math.random() * KZ_AREAS.length)].id; return 'z-' + area + '-' + Math.floor(Math.random() * GEN[area].length) + '-' + Math.floor(Math.random() * 1e6); }
function ensureTask(id) {
  let i = TASKS.findIndex(t => t.id === id); if (i >= 0) return i;
  const m = /^z-(\w+)-(\d+)-(\d+)$/.exec(id); if (!m || !GEN[m[1]] || !GEN[m[1]][+m[2]]) return -1;
  TASKS.push(buildTask(m[1], +m[2], +m[3], id)); if (typeof applyDraftTo === 'function') applyDraftTo(TASKS[TASKS.length - 1]); return TASKS.length - 1;
}

/* ---------- Musterweg ---------- */
function wayLine(k, d, t, tr, c) {
  const f = eur, U = tr;
  const sk = (c.ks || 0) + (c.vp || 0);
  const pr = (a, p) => `${f(a)} × ${fmtPct(p)} % = ${f(pc(a, p))}`;
  const v = {
    LR: () => pr(U.LEP, c.lr), ZEP: () => `${f(U.LEP)} − ${f(U.LR)} = ${f(U.ZEP)}`, LS: () => pr(U.ZEP, c.ls), BEP: () => `${f(U.ZEP)} − ${f(U.LS)} = ${f(U.BEP)}`,
    BZK: () => `fester Betrag: ${f(U.BZK)}`, BP: () => `${f(U.BEP)} + ${f(U.BZK)} = ${f(U.BP)}`, HK: () => pr(U.BP, c.hk), SKP: () => `${f(U.BP)} + ${f(U.HK)} = ${f(U.SKP)}`,
    G: () => pr(U.SKP, c.g), BVP: () => `${f(U.SKP)} + ${f(U.G)} = ${f(U.BVP)}`, ZVP: () => `${f(U.BVP)} ÷ ${fmtPct(100 - sk)} × 100 = ${f(U.ZVP)}`,
    KS: () => pr(U.ZVP, c.ks), VP: () => pr(U.ZVP, c.vp), LVP: () => `${f(U.ZVP)} ÷ ${fmtPct(100 - c.kr)} × 100 = ${f(U.LVP)}`, KR: () => pr(U.LVP, c.kr)
  };
  const r = {
    KR: () => pr(U.LVP, c.kr), ZVP: () => `${f(U.LVP)} − ${f(U.KR)} = ${f(U.ZVP)}`, KS: () => pr(U.ZVP, c.ks), VP: () => pr(U.ZVP, c.vp),
    BVP: () => `${f(U.ZVP)}${U.KS ? ' − ' + f(U.KS) : ''}${U.VP ? ' − ' + f(U.VP) : ''} = ${f(U.BVP)}`, SKP: () => `${f(U.BVP)} ÷ ${100 + c.g} × 100 = ${f(U.SKP)}`, G: () => `${f(U.BVP)} − ${f(U.SKP)} = ${f(U.G)}`,
    BP: () => `${f(U.SKP)} ÷ ${100 + c.hk} × 100 = ${f(U.BP)}`, HK: () => `${f(U.SKP)} − ${f(U.BP)} = ${f(U.HK)}`, BZK: () => `fester Betrag: ${f(U.BZK)}`, BEP: () => `${f(U.BP)} − ${f(U.BZK)} = ${f(U.BEP)}`,
    ZEP: () => `${f(U.BEP)} ÷ ${100 - c.ls} × 100 = ${f(U.ZEP)}`, LS: () => `${f(U.ZEP)} − ${f(U.BEP)} = ${f(U.LS)}`, LEP: () => `${f(U.ZEP)} ÷ ${100 - c.lr} × 100 = ${f(U.LEP)}`, LR: () => `${f(U.LEP)} − ${f(U.ZEP)} = ${f(U.LR)}`
  };
  const dd = { G: () => `${f(U.BVP)} − ${f(U.SKP)} = ${f(U.G)}` };
  const fn = d === 'd' ? dd[k] : d === 'r' ? r[k] : v[k];
  try { return fn ? fn() : ''; } catch (e) { return ''; }
}
function buildWayHtml(task) {
  const tr = truth(task); const c = task.ctx || task.c || {}; const li = [];
  (task.pre || []).forEach(x => li.push(`<tr><td colspan="2">${esc(nb(x))}</td></tr>`));
  const tableWay = () => {
  if (!task.noTable) {
    const keys = rangeKeys(task); const given = task.given || [];
    task.steps.map(s => s[0]).filter(k => keys.includes(k) && tr[k] !== 0 || given.includes(k)).forEach(k => {
      if (!SCH[k]) return;
      const txt = (given.includes(k) ? '' : wayLine(k, task.dirOf ? task.dirOf(k) : 'v', task, tr, task.c)) || 'gegeben';
      li.push(`<tr><td><strong>${esc(SCH[k].alias[0])}</strong></td><td>${esc(nb(txt))}</td></tr>`);
    });
  }
  };
  const sfxHtml = () => {
  (task.parts || []).filter(pp => pp.table && pp.sfx).forEach(pp => {
    const x = pp.sfx; const tr2 = {}; Object.keys(tr).forEach(k => { if (sfxOf(k) === x) tr2[baseKey(k)] = tr[k]; });
    li.push(`<tr><td colspan="2"><strong>${esc(partTitle(pp))}</strong></td></tr>`);
    rangeKeysFor(task, pp).filter(k => tr2[k] !== 0 || (pp.given || []).includes(k)).forEach(k => {
      const txt = ((pp.given || []).includes(k) ? '' : wayLine(k, 'r', task, tr2, task.c)) || 'gegeben';
      li.push(`<tr><td><strong>${esc(SCH[k].alias[0])}</strong></td><td>${esc(nb(txt))}</td></tr>`);
    });
  });
  (task.parts || []).filter(pp => pp.alt).forEach(pp => {
    const x = pp.sfx || ''; const fT = tr.LVP / tr.BP;
    li.push(`<tr><td colspan="2"><strong>Kurzweg über den Kalkulationsfaktor</strong></td></tr>`);
    li.push(`<tr><td><strong>Kalkulationsfaktor</strong></td><td>${esc(nb(eur(tr.LVP) + ' ÷ ' + eur(tr.BP) + ' = ' + fmtDec(Math.round(fT * 1e4) / 1e4, 4)))}</td></tr>`);
    li.push(`<tr><td><strong>Bezugspreis</strong></td><td>${esc(nb(eur(pp.kwPrice) + ' ÷ ' + fmtDec(Math.round(fT * 1e4) / 1e4, 4) + ' ≈ ' + eur(tr['BP' + x]) + ' (Abweichung bis 5 Cent möglich)'))}</td></tr>`);
  });
  };
  const kzHtmlWay = ids => {
  ids.forEach(id => {
    const d = KZ[id]; const base = task.kzBase || 'LVP'; const z = d.num(k => tr[k], base), n = d.den(k => tr[k], base);
    const rd = Math.pow(10, d.dec); const zw = d.wnum ? d.wnum(k => tr[k], base) : fmtMax(z, 4);
    li.push(`<tr><td><strong>${esc(d.title)}</strong></td><td>${esc(nb(zw + ' ÷ ' + fmtMax(n, 4) + ' = ' + fmtDec(Math.round(z / n * rd) / rd, d.dec) + (d.unit ? ' ' + d.unit : '')))}</td></tr>`);
  });
  };
  const firstSfx = (task.parts || []).findIndex(pp => pp.table && pp.sfx);
  const kzBefore = (task.parts || []).filter((pp, pi) => pp.kz && pp.kz.length && (firstSfx < 0 || pi < firstSfx)).reduce((x, pp) => x.concat(pp.kz), []);
  const kzAfter = (task.parts || []).filter((pp, pi) => pp.kz && pp.kz.length && firstSfx >= 0 && pi > firstSfx).reduce((x, pp) => x.concat(pp.kz), []);
  if (task.kzFirst) kzHtmlWay(kzBefore);
  tableWay();
  if (!task.kzFirst) kzHtmlWay(kzBefore);
  sfxHtml(); kzHtmlWay(kzAfter);
  return `<h4>Musterweg</h4><table class="res way"><tbody>${li.join('')}</tbody></table>`;
}
