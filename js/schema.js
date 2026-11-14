/* =====================================================================
   SCHEMA (Handelskalkulation, immer von oben nach unten)
   sign: '=' Start/Summe, '+' Zuschlag, '-' Abzug
   alias: erlaubte Schreibweisen (exakt, Groß-/Kleinschreibung zählt)
   ===================================================================== */
const SCHEMA = [
  { key: 'LEP',  sign: '=', alias: ['Listeneinkaufspreis', 'LEP'] },
  { key: 'LR',   sign: '-', alias: ['Lieferrabatt', 'Lieferantenrabatt', 'Liefererrabatt', 'LR', 'LRB'] },
  { key: 'ZEP',  sign: '=', alias: ['Zieleinkaufspreis', 'ZEP'] },
  { key: 'LS',   sign: '-', alias: ['Lieferskonto', 'Lieferantenskonto', 'Liefererskonto', 'LS', 'LSK'] },
  { key: 'BEP',  sign: '=', alias: ['Bareinkaufspreis', 'BEP'] },
  { key: 'BZK',  sign: '+', alias: ['Bezugskosten', 'BZK'] },
  { key: 'BP',   sign: '=', alias: ['Bezugspreis', 'Einstandspreis', 'BP', 'EP'] },
  { key: 'HK',   sign: '+', alias: ['Handlungskostenzuschlag', 'HKZ'] },
  { key: 'SKP',  sign: '=', alias: ['Selbstkostenpreis', 'SKP'] },
  { key: 'G',    sign: '+', alias: ['Gewinnzuschlag', 'GWZ'] },
  { key: 'BVP',  sign: '=', alias: ['Barverkaufspreis', 'BVP'] },
  { key: 'KS',   sign: '+', alias: ['Kundenskonto', 'Kundenkonto', 'KS', 'KSK'] },
  { key: 'VP',   sign: '+', alias: ['Vertreterprovision', 'VP'] },
  { key: 'ZVP',  sign: '=', alias: ['Zielverkaufspreis', 'ZVP'] },
  { key: 'KR',   sign: '+', alias: ['Kundenrabatt', 'KR', 'KRB'] },
  { key: 'LVP',  sign: '=', alias: ['Listenverkaufspreis', 'LVP'] }
];
const SCH = {}; const ALIAS = {}; const ORDER = SCHEMA.map(s => s.key);
SCHEMA.forEach(s => { SCH[s.key] = s; s.alias.forEach(a => { ALIAS[a] = s.key; }); });
// Zweite Rechenkette in einer Aufgabe (z. B. Preis eines Mitbewerbers): gleiche Zeilen, eigene Werte. Schlüssel mit Anhang, z. B. 'BP2'.
const SFX = ['2'];
SFX.forEach(x => SCHEMA.forEach(s => { SCH[s.key + x] = Object.assign({}, s, { key: s.key + x, base: s.key, sfx: x }); }));
const baseKey = k => (SCH[k] && SCH[k].base) || k;
const sfxOf = k => (SCH[k] && SCH[k].sfx) || '';

let EXACT = false; // true = Rechnung ohne Zwischenrundung (nur für die Prüfung der Kennzahlen)
const r2 = x => EXACT ? x : Math.round((x + Number.EPSILON) * 100) / 100;

/* =====================================================================
   KENNZAHLEN (Bruch aus Zähler und Nenner + Satzfeld)
   u(k): Wert der Zeile k, b: Schlüssel des Verkaufspreises, den die Aufgabe nutzt
   (LVP, ZVP oder BVP). mult = 100 bei Prozent (das ×100 gehört in den Zähler).
   dec = Nachkommastellen im Ergebnis.
   ===================================================================== */
const f2 = v => fmtMax(Math.round(v * 100) / 100, 2);
const KZ = {
  zuschlag: { title: 'Kalkulationszuschlag', sentence: 'Der Kalkulationszuschlag beträgt:', unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u(b) - u('BP')) * 100, den: (u, b) => u('BP'),
              wnum: (u, b) => `(${f2(u(b))} − ${f2(u('BP'))}) × 100` },
  faktor:   { title: 'Kalkulationsfaktor',   sentence: 'Der Kalkulationsfaktor beträgt:',   unit: '',  dec: 4, mult: 1,
              num: (u, b) => u(b), den: (u, b) => u('BP'), wnum: (u, b) => f2(u(b)) },
  hkz:      { title: 'Handlungskostenzuschlag', sentence: 'Der Handlungskostenzuschlag beträgt:', unit: '%', dec: 2, mult: 100,
              num: (u, b) => u('HK') * 100, den: (u, b) => u('BP'), wnum: (u, b) => `${f2(u('HK'))} × 100` },
  gwz:      { title: 'Gewinnzuschlag',       sentence: 'Der Gewinnzuschlag beträgt:',       unit: '%', dec: 2, mult: 100,
              num: (u, b) => u('G') * 100, den: (u, b) => u('SKP'), wnum: (u, b) => `${f2(u('G'))} × 100` },
  hkzK:     { title: 'Handlungskostenzuschlag', sentence: 'Der Handlungskostenzuschlag beträgt:', unit: '%', dec: 2, mult: 100,
              num: (u, b) => u('HKS') * 100, den: (u, b) => u('WE'), wnum: (u, b) => `${f2(u('HKS'))} × 100` },
  gwzK:     { title: 'Gewinnzuschlag',       sentence: 'Der Gewinnzuschlag beträgt:',       unit: '%', dec: 2, mult: 100,
              num: (u, b) => u('GS') * 100, den: (u, b) => u('SKS'), wnum: (u, b) => `${f2(u('GS'))} × 100` },
  spanne:   { title: 'Handelsspanne',        sentence: 'Die Handelsspanne beträgt:',        unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u(b) - u('BP')) * 100, den: (u, b) => u(b),
              wnum: (u, b) => `(${f2(u(b))} − ${f2(u('BP'))}) × 100` },
  spannegv: { title: 'Handelsspanne',        sentence: 'Die durchschnittliche Handelsspanne beträgt:', unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u('WV') - u('WE')) * 100, den: (u, b) => u('WV'),
              wnum: (u, b) => `(${f2(u('WV'))} − ${f2(u('WE'))}) × 100` },
  gewinn:   { title: 'Gewinn in Prozent',    sentence: 'Der Gewinn beträgt:',               unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u('BVP') - u('SKP')) * 100, den: (u, b) => u('SKP'),
              wnum: (u, b) => `(${f2(u('BVP'))} − ${f2(u('SKP'))}) × 100` }
};

