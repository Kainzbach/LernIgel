/* =====================================================================
   Kennzahlen: 7 Untermenüs mit je 10 festen Aufgaben (+ Zufall je Untermenü).
   Dies ist der Rahmen: Bereichsliste und gemeinsame Hilfsfunktionen. Die Aufgaben selbst stehen
   in gen_kz_a/diff/b/c/d/e.js. defineKz() wird von gen_bau.js vor den festen Aufgaben aufgerufen.
   ===================================================================== */
const KZ_AREAS = [
  { id: 'kz_gvs', kz: 'spannegv', name: 'Durchschnittliche Handelsspanne' },
  { id: 'kz_gewinn', kz: 'gewinn', name: 'Gewinn in Prozent' },
  { id: 'kz_gwz', kz: 'gwz', name: 'Gewinnzuschlag' },
  { id: 'kz_spanne', kz: 'spanne', name: 'Handelsspanne' },
  { id: 'kz_hkz', kz: 'hkz', name: 'Handlungskostenzuschlag' },
  { id: 'kz_faktor', kz: 'faktor', name: 'Kalkulationsfaktor' },
  { id: 'kz_zuschlag', kz: 'zuschlag', name: 'Kalkulationszuschlag' }
];

/* Die Abschnitte A–E liegen in gen_kz_a.js … gen_kz_e.js und tragen sich hier ein. */
const KZ_SEC = [];

function defineKz() {
  KZ_AREAS.forEach(a => {
    GEN[a.id] = [];
  });
  const kzTask = o => Object.assign({ noTable: true, from: 'BP', to: 'BVP', dirOf: () => 'g' }, o);
  const ASK = {
    zuschlag: 'den Kalkulationszuschlag',
    faktor: 'den Kalkulationsfaktor',
    spanne: 'die Handelsspanne',
    hkz: 'den Handlungskostenzuschlag',
    gwz: 'den Gewinnzuschlag',
    gewinn: 'den Gewinn',
    spannegv: 'die durchschnittliche Handelsspanne'
  };
  const ask = id => `${ASK[id]}${KZ[id].unit ? ' in Prozent' : ''}`;
  const kzPart = (id, label) => ({ label: label || '', title: KZ[id].title, kz: [id] });
  const QK = 'Ermitteln Sie auf der Grundlage Ihres Ergebnisses aus a) ';
  const preOf = c => {
    const p = [];
    if (c.pausch != null) p.push(`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`);
    if (c.packN) p.push(`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`);
    return p;
  };
  const einkaufText = (c, extra) =>
    [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + (extra ? ' ' + extra : '') + tPackHinweis(c);
  const DIRD = k => (k === 'G' ? 'd' : ['KR', 'ZVP', 'KS', 'VP', 'BVP'].includes(k) ? 'r' : 'v');
  const dateTab = c => pick(c.r, ['BB', 'KS', 'NZ', 'TR', 'WL']) + between(c.r, 1000, 9999, 1);
  const nf = n => n.toLocaleString('de-DE');
  const dat = w => (/(e|er|el)$/.test(w) ? w + 'n' : w);
  const badG = steps => {
    const t = truth({ steps });
    const q = t.G / t.SKP;
    return !(q >= 0.03 && q <= 0.35);
  };
  const rnd = (x, st) => Math.round(x / st) * st;

  // Aufgaben, die früher erst eine Schema-Tabelle verlangten, sind jetzt reine Kennzahl-Aufgaben:
  // die dafür nötigen Werte stehen direkt im Text (Bereich Kennzahlen = nur Kennzahlen)
  const CONVT = [
    'Aus der Kalkulation eines Artikels',
    'Aus einer Kalkulationsliste',
    'Aus dem Kalkulationsblatt',
    'Aus den Ergebnissen der Preisberechnung',
    'Aus der Kalkulationsübersicht',
    'Aus dem Preisblatt der Abteilung',
    'Aus der Kalkulationsrechnung',
    'Aus dem Kalkulationsprotokoll'
  ];
  const LBL = {
    BP: 'Bezugspreis',
    LVP: 'Listenverkaufspreis',
    SKP: 'Selbstkostenpreis',
    BVP: 'Barverkaufspreis',
    ZVP: 'Zielverkaufspreis',
    HK: 'Handlungskosten',
    G: 'Gewinn'
  };
  const pure = (t, c) => {
    normTask(t);
    const id = t.kz[0];
    const d = KZ[id];
    const tr = truth(t);
    const base = t.kzBase || 'LVP';
    const ks = new Set();
    const rec = k => {
      ks.add(k);
      return tr[k];
    };
    d.num(rec, base);
    d.den(rec, base);
    const keys = ORDER.filter(k => ks.has(k));
    c.packN = 0;
    c.pausch = null;
    const asked = ask(id);
    let text, tabelle;
    if (c.r() < 0.5) {
      const list = keys.map(k => `${LBL[k]} ${eur(tr[k])}`);
      const lst = list.length > 1 ? list.slice(0, -1).join(', ') + ' und ' + list[list.length - 1] : list[0];
      text = `Die Kalkulation der ${FIRMA} für ${c.ware} hat folgende Werte je ${sg(c)} ergeben: ${lst}.\n\nBerechnen Sie ${asked}.`;
    } else {
      text = `Die ${FIRMA} hat für einen Artikel folgende Kalkulationswerte erfasst:{{tabelle}}Berechnen Sie ${asked} für ${c.ware}.`;
      tabelle = {
        head: ['Art.-Nr.'].concat(keys.map(k => LBL[k] + ' je ' + sg(c))),
        rows: [[dateTab(c)].concat(keys.map(k => eur(tr[k])))]
      };
    }
    const o = kzTask({
      kzBase: base,
      text,
      parts: [kzPart(id)],
      steps: keys.map(k => [k, u => tr[k]]),
      bad: t.bad
    });
    if (tabelle) o.tabelle = tabelle;
    return o;
  };
  const convN = {};
  const add = (area, title, opt, fn) => {
    if (/table: true|diffTask|hkAus|gzAus/.test(String(fn))) {
      const n = (convN[area] = (convN[area] || 0) + 1);
      const inner = fn;
      GEN[area].push({ title: CONVT[n - 1] || 'Aus der Kalkulation ' + n, opt, fn: c => pure(inner(c), c) });
    } else GEN[area].push({ title, opt, fn });
  };

  const H = { kzTask, ask, kzPart, QK, preOf, einkaufText, DIRD, dateTab, nf, dat, badG, rnd, add };
  KZ_SEC.forEach(sec => sec(H));
}
