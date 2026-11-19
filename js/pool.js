/* =====================================================================
   Firmen- und Warenpool (alles erfunden). Preise in Euro.
   Lieferant -> Ware -> passender Kunde. Rolle "kunden" je Ware: Namen aus KUNDEN.
   ===================================================================== */
const E = { eigene: { name: 'Kainzbach GmbH & Co. KG', ort: 'Landshut' } };
const EINH = {
  stk: ['Stück', 'Stück'],
  pack: ['Packung', 'Packungen'],
  kan: ['Kanister', 'Kanister'],
  sack: ['Sack', 'Säcke'],
  satz: ['Satz', 'Sätze'],
  karton: ['Karton', 'Kartons']
};
const LIEFERANTEN = [
  { id: 'greenhill', name: 'Chemiewerk Greenhill GmbH', ort: 'Ludwigshafen am Rhein' },
  { id: 'parasol', name: 'Parasol Pharmaceuticals AG', ort: 'Köln' },
  { id: 'stempel', name: 'Staatliche Stempelwerke AG', ort: 'Frankfurt (Oder)' },
  { id: 'blackthorn', name: 'Blackthorn Academy Verlag GmbH', ort: 'Leipzig' },
  { id: 'cybercore', name: 'CyberCore Technologies KG', ort: 'Bremen' },
  { id: 'dampfwerk', name: 'Dampfwerk Digital GmbH', ort: 'Essen' },
  { id: 'aether', name: 'Äther Stiftung & Co. KG', ort: 'Stuttgart' },
  { id: 'neutron', name: 'Neutron S.A.', ort: 'Lyon', land: 'Frankreich' },
  { id: 'wuerfel', name: 'Würfelwerk Bergbau Sp. z o.o.', ort: 'Katowice', land: 'Polen' },
  { id: 'skylink', name: 'Skylink Systems Inc.', ort: 'Austin', land: 'USA' }
];
const KUNDEN = {
  eurocargo: 'Eurocargo Logistik AG',
  sprintwerk: 'Sprintwerk Logistik GmbH',
  brummbaer: 'Brummbär Pizzeria GmbH',
  pinguin: 'Pinguin Systemhaus GmbH',
  securanota: 'Securanota Datenschutz GmbH',
  frohnatur: 'Frohnatur Goy e. K.',
  klarblick: 'Klarblick Optik GmbH',
  silberstern: 'Silberstern Stiftung & Co. KG',
  kleinhase: 'Kleinhase AB',
  broetchen: 'Fettige Brötchen Inc.'
};
// Ware: [Name (Mehrzahl, steht ohne Artikel), Einheit, Preis von, Preis bis, Schrittweite, Kunden…]
const WAREN = {
  greenhill: [
    ['Reinigungsmittel', 'kan', 18, 60, 1, 'brummbaer', 'frohnatur', 'broetchen', 'kleinhase'],
    ['Industriekleber', 'kan', 25, 90, 1],
    ['Lacke', 'kan', 30, 110, 1],
    ['Düngemittel', 'sack', 12, 45, 1]
  ],
  parasol: [
    ['Desinfektionsmittel', 'kan', 20, 75, 1, 'brummbaer', 'frohnatur', 'broetchen', 'klarblick'],
    ['Verbandsmaterial', 'pack', 8, 40, 1],
    ['Pflaster', 'pack', 3, 15, 0.5, 'silberstern'],
    ['Vitaminpräparate', 'pack', 6, 30, 0.5]
  ],
  stempel: [
    ['Stempel', 'stk', 6, 35, 0.5, 'securanota'],
    ['Stempelkissen', 'stk', 2, 12, 0.5],
    ['Büromaterial', 'pack', 10, 60, 1, 'eurocargo', 'sprintwerk', 'klarblick', 'silberstern'],
    ['Siegel', 'pack', 5, 30, 0.5]
  ],
  blackthorn: [
    ['Lehrbücher', 'stk', 15, 70, 0.5, 'silberstern', 'securanota'],
    ['Lernkarten', 'pack', 4, 20, 0.5],
    ['Schulhefte', 'pack', 2, 14, 0.5, 'kleinhase', 'silberstern'],
    ['Kalender', 'stk', 4, 25, 0.5, 'klarblick', 'silberstern']
  ],
  cybercore: [
    ['Router', 'stk', 40, 250, 5, 'pinguin'],
    ['Sensoren', 'stk', 8, 80, 1, 'eurocargo', 'sprintwerk'],
    ['Netzwerkkabel', 'karton', 25, 120, 1, 'pinguin'],
    ['Platinen', 'stk', 5, 60, 1, 'pinguin']
  ],
  dampfwerk: [
    ['Messgeräte', 'stk', 60, 380, 5, 'klarblick'],
    ['Industriesteuerungen', 'stk', 150, 900, 10],
    ['3D-Drucker', 'stk', 220, 1400, 10]
  ],
  aether: [
    ['Wetterstationen', 'stk', 45, 320, 5, 'eurocargo', 'sprintwerk'],
    ['Regenbekleidung', 'satz', 20, 140, 1, 'eurocargo', 'sprintwerk', 'kleinhase'],
    ['Schirme', 'stk', 6, 45, 0.5, 'brummbaer', 'frohnatur', 'broetchen']
  ],
  neutron: [
    ['Tresore', 'stk', 120, 950, 10, 'securanota'],
    ['Schließfächer', 'stk', 80, 500, 10],
    ['Alarmanlagen', 'satz', 70, 420, 5],
    ['Schlösser', 'stk', 9, 70, 0.5, 'securanota']
  ],
  wuerfel: [
    ['Grillkohle', 'sack', 5, 22, 0.5, 'brummbaer', 'frohnatur', 'broetchen'],
    ['Steinsalz', 'sack', 4, 18, 0.5, 'brummbaer', 'frohnatur', 'broetchen'],
    ['Quarzsand', 'sack', 3, 15, 0.5],
    ['Natursteine', 'karton', 30, 160, 5]
  ],
  skylink: [
    ['Server', 'stk', 400, 2800, 20, 'pinguin', 'securanota'],
    ['Funkmodule', 'stk', 15, 120, 1, 'eurocargo', 'sprintwerk'],
    ['Satellitenempfänger', 'stk', 60, 340, 5]
  ]
};
