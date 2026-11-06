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
  { key: 'KS',   sign: '+', alias: ['Kundenskonto', 'KS', 'KSK'] },
  { key: 'VP',   sign: '+', alias: ['Vertreterprovision', 'VP'] },
  { key: 'ZVP',  sign: '=', alias: ['Zielverkaufspreis', 'ZVP'] },
  { key: 'KR',   sign: '+', alias: ['Kundenrabatt', 'KR', 'KRB'] },
  { key: 'LVP',  sign: '=', alias: ['Listenverkaufspreis', 'LVP'] }
];
const SCH = {}; const ALIAS = {}; const ORDER = SCHEMA.map(s => s.key);
SCHEMA.forEach(s => { SCH[s.key] = s; s.alias.forEach(a => { ALIAS[a] = s.key; }); });

let EXACT = false; // true = Rechnung ohne Zwischenrundung (nur für die Prüfung der Kennzahlen)
const r2 = x => EXACT ? x : Math.round((x + Number.EPSILON) * 100) / 100;

/* =====================================================================
   KENNZAHLEN (Bruch aus Zähler und Nenner + Satzfeld)
   u(k): Wert der Zeile k, b: Schlüssel des Verkaufspreises, den die Aufgabe nutzt
   (LVP, ZVP oder BVP). mult = 100 bei Prozent (das ×100 gehört in den Zähler).
   dec = Nachkommastellen im Ergebnis.
   ===================================================================== */
const KZ = {
  zuschlag: { title: 'Kalkulationszuschlag', sentence: 'Der Kalkulationszuschlag beträgt:', unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u(b) - u('BP')) * 100, den: (u, b) => u('BP') },
  faktor:   { title: 'Kalkulationsfaktor',   sentence: 'Der Kalkulationsfaktor beträgt:',   unit: '',  dec: 4, mult: 1,
              num: (u, b) => u('LVP'), den: (u, b) => u('BP') },
  spanne:   { title: 'Handelsspanne',        sentence: 'Die Handelsspanne beträgt:',        unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u(b) - u('BP')) * 100, den: (u, b) => u(b) },
  spannegv: { title: 'Handelsspanne',        sentence: 'Die durchschnittliche Handelsspanne beträgt:', unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u('WV') - u('WE')) * 100, den: (u, b) => u('WV') },
  gewinn:   { title: 'Gewinn in Prozent',    sentence: 'Der Gewinn beträgt:',               unit: '%', dec: 2, mult: 100,
              num: (u, b) => (u('BVP') - u('SKP')) * 100, den: (u, b) => u('SKP') }
};

