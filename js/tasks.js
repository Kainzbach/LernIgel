/* =====================================================================
   AUFGABEN
   steps: [Schlüssel, Rechenweg(u), optionale Alternativ-Rechenwege]
   kz: Liste der verlangten Kennzahlen, kzBase: genutzter Verkaufspreis
   noTable: true = Aufgabe ohne Kalkulationstabelle (nur Werte gegeben)
          u(k) liefert den Wert der Zeile k. Reihenfolge = Rechenreihenfolge.
   from/to: Bereich des Schemas, der verlangt wird. Das Schema ist IMMER vollständig: Jede Zeile muss da sein.
   Kommt eine Zeile in der Aufgabe nicht vor, bekommt sie in steps den Wert 0; richtig ist dann Betrag leer, 0, /, x oder -.
   (skip/merge werden nicht mehr verwendet.)
   pct: erwartete Prozente je Zeile als [Wert, Grundwert-Nr., 'r' (Satz/Ergebnis) | 'b' (neue 100 %)]
   ===================================================================== */
/* ---------- Rechenregeln (Weg A), zentral ----------
   Gewinn und Handlungskosten: Aufschlag auf die Zeile darüber.
   Rabatt, Skonto, Provision: Prozentsatz vom GRÖSSEREN Wert (ZEP, ZVP, LVP, LEP).
     - größerer Wert bekannt:   Prozent × Wert, abziehen
     - kleinerer Wert bekannt:  durch (1 − Prozentsatz) teilen
   Bezugskosten: fester Eurobetrag. ---------- */
const pc = (x, p) => r2(x * p / 100);
const up = (x, p) => r2(x / (1 - p / 100));

// Einkauf vorwärts: LEP → BEP (→ BZK → BP)
function einkaufVor(c) {
  const s = [['LEP', u => c.lep], ['LR', u => pc(u('LEP'), c.lr)], ['ZEP', u => r2(u('LEP') - u('LR'))],
             ['LS', u => pc(u('ZEP'), c.ls)], ['BEP', u => r2(u('ZEP') - u('LS'))]];
  if (c.bzk != null) s.push(['BZK', u => c.bzk], ['BP', u => r2(u('BEP') + u('BZK'))]);
  return s;
}
// Handlungskosten und Gewinn vorwärts: Basis → SKP (→ G → BVP)
function hkVor(c, base) {
  const s = [['HK', u => pc(u(base), c.hk)], ['SKP', u => r2(u(base) + u('HK'))]];
  if (c.g != null) s.push(['G', u => pc(u('SKP'), c.g)], ['BVP', u => r2(u('SKP') + u('G'))]);
  return s;
}
// Verkaufsseite vorwärts: BVP → LVP
function verkaufVor(c) {
  const sk = (c.ks || 0) + (c.vp || 0);
  const s = [['ZVP', u => up(u('BVP'), sk)]];
  if (c.ks) s.push(['KS', u => pc(u('ZVP'), c.ks)]);
  if (c.vp) s.push(['VP', u => pc(u('ZVP'), c.vp)]);
  s.push(['LVP', u => up(u('ZVP'), c.kr)], ['KR', u => pc(u('LVP'), c.kr)]);
  return s;
}
// Verkaufsseite rückwärts: LVP gegeben → BVP
function verkaufRueck(c) {
  const s = [['KR', u => pc(u('LVP'), c.kr)], ['ZVP', u => r2(u('LVP') - u('KR'))]];
  if (c.ks) s.push(['KS', u => pc(u('ZVP'), c.ks)]);
  if (c.vp) s.push(['VP', u => pc(u('ZVP'), c.vp)]);
  s.push(['BVP', u => r2(u('ZVP') - (u('KS') || 0) - (u('VP') || 0))]);
  return s;
}
// Prozent-Hilfe (nicht gewertet) aus den Sätzen der Aufgabe
function mkPct(c) {
  const p = {};
  if (c.lr != null) {
    p.LEP = [[100, 0, 'r']]; p.LR = [[c.lr, 0, 'r']]; p.ZEP = [[100 - c.lr, 0, 'r'], [100, 1, 'b']];
    p.LS = [[c.ls, 1, 'r']]; p.BEP = [[100 - c.ls, 1, 'r']];
    if (c.bzk != null) { p.BZK = []; p.BP = [[100, 2, 'b']]; } else if (c.hk != null) p.BEP.push([100, 2, 'b']);
  } else p.BP = [[100, 2, 'b']];
  if (c.hk != null) {
    p.HK = [[c.hk, 2, 'r']]; p.SKP = [[100 + c.hk, 2, 'r'], [100, 3, 'b']];
    p.G = c.g != null ? [[c.g, 3, 'r']] : [];
    p.BVP = c.g != null ? [[100 + c.g, 3, 'r']] : [];
  }
  const sk = (c.ks || 0) + (c.vp || 0);
  if (sk) {
    p.ZVP = [[100, 5, 'b']]; p.BVP = (p.BVP || []).concat([[100 - sk, 5, 'r']]);
    if (c.ks) p.KS = [[c.ks, 5, 'r']];
    if (c.vp) p.VP = [[c.vp, 5, 'r']];
    if (c.kr) { p.ZVP.push([100 - c.kr, 6, 'r']); p.KR = [[c.kr, 6, 'r']]; p.LVP = [[100, 6, 'b']]; }
  }
  return p;
}

// Einkauf rückwärts: BP gegeben → LEP
function einkaufRueck(c) {
  const s = [];
  if (c.bzk != null) s.push(['BZK', u => c.bzk], ['BEP', u => r2(u('BP') - u('BZK'))]);
  s.push(['ZEP', u => up(u('BEP'), c.ls)], ['LS', u => r2(u('ZEP') - u('BEP'))],
         ['LEP', u => up(u('ZEP'), c.lr)], ['LR', u => r2(u('LEP') - u('ZEP'))]);
  return s;
}

/* Name des Unternehmens in allen Aufgaben: hier zentral ändern */
const FIRMA = 'Kainzbach & Co. KG';

const C1 = { lep: 800, lr: 10, ls: 2, bzk: 40, hk: 30, g: 10, ks: 2, vp: 4, kr: 12 };
const C2 = { lr: 12, ls: 2, bzk: 30, hk: 25, g: 8, ks: 2, vp: 3, kr: 10 };
const C3 = { lep: 1200, lr: 10, ls: 2, bzk: 0, hk: 45, ks: 2, kr: 12 };

const TASKS = [
  {
    id: 's1', title: 'Vorwärtskalkulation', from: 'LEP', to: 'LVP',
    text: 'Die {{firma}} bezieht Bremsscheiben zu einem Listeneinkaufspreis von 800,00 € je Satz. Der Lieferant gewährt 10 % Liefererrabatt und 2 % Liefererskonto, die Bezugskosten betragen 40,00 € je Satz.\n\nBei der Preisgestaltung rechnet das Unternehmen mit einem Handlungskostenzuschlag von 30 % und einem Gewinnzuschlag von 10 %. Den Kunden werden 2 % Kundenskonto, 4 % Vertreterprovision und 12 % Kundenrabatt eingeräumt.\n\na) Ermitteln Sie unter Angabe des Kalkulationsschemas den Listenverkaufspreis (netto) für einen Satz Bremsscheiben.\n\nb) Ermitteln Sie auf der Grundlage der Ergebnisse aus a) den Kalkulationszuschlag, den Kalkulationsfaktor und die Handelsspanne.',
    parts: [
      { label: 'a)', title: 'Listenverkaufspreis', table: true },
      { label: 'b)', title: 'Kalkulationszuschlag, Kalkulationsfaktor und Handelsspanne', kz: ['zuschlag', 'faktor', 'spanne'] }
    ],
    kzBase: 'LVP',
    steps: [].concat(einkaufVor(C1), hkVor(C1, 'BP'), verkaufVor(C1)),
    pct: mkPct(C1)
  },
  {
    id: 's2', title: 'Rückwärtskalkulation', from: 'LEP', to: 'LVP',
    text: 'Die {{firma}} möchte Stoßdämpfer in ihr Sortiment aufnehmen. Am Markt lässt sich ein Listenverkaufspreis von 640,00 € je Satz durchsetzen.\n\nBei der Preisgestaltung rechnet das Unternehmen mit 10 % Kundenrabatt, 2 % Kundenskonto, 3 % Vertreterprovision, einem Handlungskostenzuschlag von 25 % und einem Gewinnzuschlag von 8 %. Der Lieferant gewährt 12 % Liefererrabatt und 2 % Liefererskonto, die Bezugskosten betragen 30,00 € je Satz.\n\na) Ermitteln Sie unter Angabe des Kalkulationsschemas den höchsten Listeneinkaufspreis, zu dem das Unternehmen die Stoßdämpfer einkaufen kann.\n\nb) Ermitteln Sie auf der Grundlage der Ergebnisse aus a) den Kalkulationszuschlag, den Kalkulationsfaktor und die Handelsspanne.',
    parts: [
      { label: 'a)', title: 'Höchstens möglicher Listeneinkaufspreis', table: true },
      { label: 'b)', title: 'Kalkulationszuschlag, Kalkulationsfaktor und Handelsspanne', kz: ['zuschlag', 'faktor', 'spanne'] }
    ],
    kzBase: 'LVP',
    steps: [].concat([['LVP', u => 640]], verkaufRueck(C2),
      [['SKP', u => up(u('BVP'), -C2.g)], ['G', u => r2(u('BVP') - u('SKP'))], ['BP', u => up(u('SKP'), -C2.hk)], ['HK', u => r2(u('SKP') - u('BP'))]],
      einkaufRueck(C2)),
    pct: mkPct(C2)
  },
  {
    id: 's3', title: 'Gewinn in Euro und Prozent', from: 'LEP', to: 'LVP',
    text: 'Die {{firma}} bezieht Reifensätze zu einem Listeneinkaufspreis von 1.200,00 € je Satz. Der Lieferant gewährt 10 % Liefererrabatt und 2 % Liefererskonto. Der Handlungskostenzuschlag beträgt 45 %.\n\nDie Reifensätze sollen den Kunden zu einem Listenverkaufspreis von 2.000,00 € je Satz angeboten werden. Dabei werden 12 % Kundenrabatt und 2 % Kundenskonto gewährt.\n\na) Ermitteln Sie unter Angabe des Kalkulationsschemas den Gewinn in Euro.\n\nb) Ermitteln Sie den Gewinn in Prozent.',
    parts: [
      { label: 'a)', title: 'Gewinn in Euro', table: true },
      { label: 'b)', title: 'Gewinn in Prozent', kz: ['gewinn'] }
    ],
    kzBase: 'LVP',
    steps: [].concat(einkaufVor(C3), hkVor(C3, 'BP'), [['LVP', u => 2000]],
      verkaufRueck(C3), [['VP', u => 0], ['G', u => r2(u('BVP') - u('SKP'))]]),
    pct: mkPct(C3)
  },
  {
    id: 's4', title: 'Handelsspanne', from: 'BP', to: 'BVP', noTable: true,
    text: 'Die {{firma}} hat für das erste Quartal die Daten eines Artikels aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie die Handelsspanne für die Bremsbeläge in Prozent.',
    tabelle: { head: ['Art.-Nr.', 'Bezugs\u00ADpreis je Stück', 'Barverkaufs\u00ADpreis je Stück', 'Menge eingekauft', 'Menge verkauft'], rows: [['BB2210', '52,00 €', '92,50 €', '40', '36']] },
    parts: [{ label: '', title: 'Handelsspanne', kz: ['spanne'] }],
    kzBase: 'BVP',
    steps: [['BP', u => 52], ['BVP', u => 92.5]],
    pct: {}
  },
  {
    id: 's5', title: 'Allgemeine Handelsspanne', from: 'BP', to: 'BVP', noTable: true,
    text: 'Die Buchhaltung der {{firma}} hat zum Jahresende das unten abgebildete Gewinn- und Verlustkonto abgeschlossen.{{konto}}Berechnen Sie daraus die durchschnittliche Handelsspanne in Prozent.',
    konto: { title: 'Gewinn- und Verlustkonto (930) der {{firma}}',
      soll: [['301 Wareneingang', 2900000], ['402 Gehälter', 640000], ['404 Sozialabgaben', 130000], ['430 Energie und Betriebsstoffe', 38000], ['481 Bürobedarf', 70000], ['491 Abschreibungen', 150000], ['Saldo', 272000]],
      haben: [['801 Warenverkauf', 4200000]] },
    parts: [{ label: '', title: 'Durchschnittliche Handelsspanne', kz: ['spannegv'] }],
    steps: [['WV', u => 4200000], ['WE', u => 2900000]],
    pct: {}
  }
];
TASKS.forEach(t => { t.text = t.text.split('{{firma}}').join(FIRMA); if (t.konto) t.konto.title = t.konto.title.split('{{firma}}').join(FIRMA); });


