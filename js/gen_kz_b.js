/* =====================================================================
   Kennzahlen – B: Gewinn in Prozent
   Wird von defineKz() (gen_kz.js) aufgerufen; H enthält die gemeinsamen Hilfsfunktionen.
   ===================================================================== */
KZ_SEC.push(function (H) {
  const { kzTask, ask, kzPart, QK, preOf, einkaufText, DIRD, dateTab, nf, badG, add, diffTask } = H;
  const GW = 'kz_gewinn';
  add(GW, 'Aus Selbstkosten- und Barverkaufspreis', { kzF: 3 }, c =>
    kzTask({
      text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}, der Barverkaufspreis ${eur(c.bvp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask('gewinn')}.`,
      parts: [kzPart('gewinn')],
      steps: [
        ['SKP', u => c.skp],
        ['BVP', u => c.bvp]
      ]
    })
  );
  add(GW, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 3 }, c => {
    const m1 = between(c.r, 20, 200, 10),
      m2 = m1 - between(c.r, 2, 15, 1);
    return kzTask({
      text: `Die ${FIRMA} hat für das erste Quartal die Daten eines Artikels aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask('gewinn')} für ${c.ware}.`,
      tabelle: {
        head: [
          'Art.-Nr.',
          'Selbstkosten­preis je Stück',
          'Barverkaufs­preis je Stück',
          'Menge eingekauft',
          'Menge verkauft'
        ],
        rows: [[dateTab(c), eur(c.skp), eur(c.bvp), String(m1), String(m2)]]
      },
      parts: [kzPart('gewinn')],
      steps: [
        ['SKP', u => c.skp],
        ['BVP', u => c.bvp]
      ]
    });
  });
  add(GW, 'Aus Gesamtwerten einer Periode', { kzF: 3 }, c => {
    const n = pick(c.r, [40, 60, 80, 120, 150, 200]);
    const X = Math.round(c.skp * n * 100) / 100,
      Y = Math.round(c.bvp * n * 100) / 100;
    return kzTask({
      text: `Die ${FIRMA} hat im letzten Monat ${nf(n)} ${pl(c)} ${c.ware} verkauft. Die Selbstkosten dafür betrugen insgesamt ${eur(X)}, die Barverkaufserlöse insgesamt ${eur(Y)}.\n\nBerechnen Sie ${ask('gewinn')}.`,
      parts: [kzPart('gewinn')],
      steps: [
        ['SKP', u => X],
        ['BVP', u => Y]
      ]
    });
  });
  add(GW, 'Gewinn aus Einkauf und Listenverkaufspreis', {}, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn mit Bezugskostenpauschale', { pausch: true }, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn ohne Vertreterprovision', { noVp: true }, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn bei Einkauf im Karton', { pack: true, noVp: true }, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn ab dem Bezugspreis', {}, c => {
    const bp = Math.round(c.lep * (1 - c.lr / 100) * 100) / 100;
    c.bp = bp;
    const d = Object.assign({}, c, { lr: null, ls: null, bzk: null });
    const base = truth({ steps: [].concat([['BP', u => bp]], hkVor(c, 'BP'), verkaufVor(c)) });
    c.lvp = Math.round(base.LVP / 10) * 10;
    const stp = [].concat(
      [['BP', u => bp]],
      hkVor(Object.assign({}, c, { g: null }), 'BP'),
      [['LVP', u => c.lvp]],
      verkaufRueck(c),
      [['G', u => r2(u('BVP') - u('SKP'))]]
    );
    return {
      from: 'BP',
      to: 'LVP',
      kzBase: 'LVP',
      given: ['BP', 'LVP'],
      ctx: d,
      dirOf: DIRD,
      bad: badG(stp),
      text:
        `Die ${FIRMA} bezieht ${c.ware} von der ${where(c)} zu einem Bezugspreis von ${eur(bp)} je ${sg(c)}. ` +
        tHk(c) +
        `\n\nFür ${c.ware} soll ein Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} angesetzt werden. ` +
        tVerk(c) +
        '\n\na) ' +
        Q +
        'den Gewinn in Euro je ' +
        sg(c) +
        `.\n\nb) ${QK}${ask('gewinn')}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart('gewinn', 'b)')],
      steps: stp
    };
  });
  add(GW, 'Gewinn bei Verkauf zum Zielverkaufspreis', { mkZvp: true, noVp: true }, c => {
    c.kr = 0;
    const stp = [].concat(
      einkaufVor(c),
      hkVor(Object.assign({}, c, { g: null }), 'BP'),
      [['ZVP', u => c.zvp]],
      zvpRueck(c),
      [['G', u => r2(u('BVP') - u('SKP'))]]
    );
    return {
      from: 'LEP',
      to: 'ZVP',
      kzBase: 'LVP',
      given: ['ZVP'],
      dirOf: DIRD,
      pre: preOf(c),
      bad: badG(stp),
      text:
        einkaufText(c) +
        ' ' +
        tHk(c) +
        `\n\nFür ${c.ware} soll ein Zielverkaufspreis von ${eur(c.zvp)} je ${sg(c)} angesetzt werden. Den Kunden werden ${c.ks} % Kundenskonto eingeräumt.\n\na) ` +
        Q +
        'den Gewinn in Euro je ' +
        sg(c) +
        `.\n\nb) ${QK}${ask('gewinn')}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart('gewinn', 'b)')],
      steps: stp
    };
  });
  add(GW, 'Gewinn bei bekanntem Barverkaufspreis', { mkBvp: true, noVp: true }, c => {
    c.kr = 0;
    c.ks = 0;
    const stp = [].concat(
      einkaufVor(c),
      hkVor(Object.assign({}, c, { g: null }), 'BP'),
      [['BVP', u => c.bvp]],
      [['G', u => r2(u('BVP') - u('SKP'))]]
    );
    return {
      from: 'LEP',
      to: 'BVP',
      kzBase: 'LVP',
      given: ['BVP'],
      dirOf: DIRD,
      pre: preOf(c),
      bad: badG(stp),
      text:
        einkaufText(c) +
        ' ' +
        tHk(c) +
        `\n\nFür ${c.ware} soll ein Barverkaufspreis von ${eur(c.bvp)} je ${sg(c)} angesetzt werden.\n\na) ` +
        Q +
        'den Gewinn in Euro je ' +
        sg(c) +
        `.\n\nb) ${QK}${ask('gewinn')}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart('gewinn', 'b)')],
      steps: stp
    };
  });
});
