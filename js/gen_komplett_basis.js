/* ---------- Komplettaufgaben: mehrere Teile, ein durchgehender Rechenweg (Typen A–E) ---------- */
const KZNAME = {
  zuschlag: 'den Kalkulationszuschlag',
  faktor: 'den Kalkulationsfaktor',
  spanne: 'die Handelsspanne',
  hkz: 'den Handlungskostenzuschlag',
  gwz: 'den Gewinnzuschlag',
  gewinn: 'den Gewinn in Prozent',
  hkzK: 'den Handlungskostenzuschlagssatz',
  gwzK: 'den Gewinnzuschlagssatz'
};
const joinUnd = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1] : a[0]);
const letter = i => String.fromCharCode(97 + i) + ')';
const kzAsk = ids =>
  joinUnd(ids.map(k => KZNAME[k] + (KZ[k].dec != null ? ' (' + KZ[k].dec + ' Nachkommastellen)' : '')));
const kzTitleOf = ids => joinUnd(ids.map(k => KZ[k].title));
const preLines = c => {
  const p = [];
  if (c.pausch != null) p.push(`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`);
  if (c.packN) p.push(`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`);
  return p;
};
// Ersatzwert: weicht bewusst vom richtigen Wert ab
const wrongEuro = (v, c) => {
  const f = pick(c.r, [0.95, 0.96, 0.97, 1.03, 1.04, 1.05]);
  let e = Math.round(v * f * 10) / 10;
  if (Math.abs(e - v) < 0.15) e = Math.round((v + 0.5) * 10) / 10;
  return e;
};
const wrongSatz = (v, c) => {
  let e = Math.round((v * (c.r() < 0.5 ? 0.8 : 1.2)) / 5) * 5;
  if (e < 5) e = 5;
  if (Math.abs(e - v) < 1.5) e += 5;
  return e;
};
const ersNote = (von, nach, was) =>
  `\n▸ Falls Sie ${von} nicht lösen konnten, rechnen Sie hier mit ${was} weiter.`;
const grundl = n => (n <= 1 ? 'a)' : n === 2 ? 'a) und b)' : 'a), b) und c)');
const Qauf = (n, extra) => `Ermitteln Sie auf der Grundlage Ihrer Ergebnisse aus ${grundl(n)} ${extra || ''}`;
const KTITLE = {
  BP: 'Bezugspreis',
  SKP: 'Selbstkostenpreis',
  BVP: 'Barverkaufspreis',
  LVP: 'Listenverkaufspreis',
  LEP: 'Höchster Listeneinkaufspreis'
};
const TGT = {
  BP: 'den Bezugspreis',
  SKP: 'den Selbstkostenpreis',
  BVP: 'den Barverkaufspreis',
  LVP: 'den Listenverkaufspreis (netto)',
  LEP: 'den höchsten Listeneinkaufspreis',
  G: 'den Gewinn in Euro'
};
const syn = (t, c) => (c.r() < 0.5 ? t : t.split('Kundenskonto').join('Kundenkonto'));
const pushKO = (title, opt, fn) => GEN.komplett.push({ title, opt, fn });
const tGVerk = c => `Der Gewinnzuschlag beträgt ${c.g} %. ` + tVerk(c);
const ersTask = (c, t) => Object.assign(t, { pre: preLines(c) });
const ASKJE = c => (c.packN ? ' je Stück' : ' je ' + sg(c));
