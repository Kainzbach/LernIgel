/* =====================================================================
   Kennzahlen – D: Gewinnzuschlag
   Wird von defineKz() (gen_kz.js) aufgerufen; H enthält die gemeinsamen Hilfsfunktionen.
   ===================================================================== */
KZ_SEC.push(function (H) {
  const { kzTask, ask, kzPart, QK, preOf, einkaufText, dateTab, nf, dat, add, diffTask } = H;
  const GZ = 'kz_gwz';
  add(GZ, 'Aus Selbstkostenpreis und Gewinn', { kzF: 1 }, c => {
    const g = Math.round(c.skp * c.g) / 100;
    return kzTask({
      text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}. Die ${FIRMA} rechnet mit einem Gewinn von ${eur(g)} je ${sg(c)}.\n\nBerechnen Sie ${ask('gwz')}.`,
      parts: [kzPart('gwz')],
      steps: [
        ['SKP', u => c.skp],
        ['G', u => g]
      ]
    });
  });
  add(GZ, 'Aus Selbstkostenpreis und Barverkaufspreis', { kzF: 3 }, c =>
    kzTask({
      text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}, der Barverkaufspreis ${eur(c.bvp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask('gwz')}.`,
      parts: [kzPart('gwz')],
      steps: [
        ['SKP', u => c.skp],
        ['BVP', u => c.bvp],
        ['G', u => r2(u('BVP') - u('SKP'))]
      ]
    })
  );
  add(GZ, 'Aus dem Jahresergebnis', { kzF: 1 }, c => {
    const n = pick(c.r, [400, 600, 800, 1200, 1500, 2000]);
    const g = Math.round(c.skp * c.g) / 100;
    const X = Math.round(c.skp * n * 100) / 100,
      G = Math.round(g * n * 100) / 100;
    return kzTask({
      text: `Die ${FIRMA} hat im Geschäftsjahr ${nf(n)} ${pl(c)} ${c.ware} verkauft. Die Selbstkosten betrugen insgesamt ${eur(X)}, der erzielte Gewinn insgesamt ${eur(G)}.\n\nBerechnen Sie ${ask('gwz')}.`,
      parts: [kzPart('gwz')],
      steps: [
        ['SKP', u => X],
        ['G', u => G]
      ]
    });
  });
  add(GZ, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 1 }, c => {
    const g = Math.round(c.skp * c.g) / 100;
    return kzTask({
      text: `Die ${FIRMA} hat für einen Artikel die Daten aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask('gwz')} für ${c.ware}.`,
      tabelle: {
        head: ['Art.-Nr.', 'Selbstkosten­preis je Stück', 'Gewinn je Stück', 'Menge verkauft'],
        rows: [[dateTab(c), eur(c.skp), eur(g), String(between(c.r, 20, 200, 10))]]
      },
      parts: [kzPart('gwz')],
      steps: [
        ['SKP', u => c.skp],
        ['G', u => g]
      ]
    });
  });
  const gzAus = c => {
    const e = [].concat(einkaufVor(c), hkVor(Object.assign({}, c, { g: null }), 'BP'));
    const skp = truth({ steps: e }).SKP;
    const g = Math.round(skp * c.g) / 100;
    return vorTask(c, {
      from: 'LEP',
      to: 'SKP',
      given: ['G'],
      pre: preOf(c),
      text:
        einkaufText(c, tHk(c) + ` Die ${FIRMA} rechnet mit einem Gewinn von ${eur(g)} je ${sg(c)}.`) +
        `\n\na) ` +
        Q +
        'den Selbstkostenpreis je ' +
        sg(c) +
        `.\n\nb) ${QK}${ask('gwz')}.`,
      parts: [{ label: 'a)', title: 'Selbstkostenpreis', table: true }, kzPart('gwz', 'b)')],
      steps: [].concat(e, [['G', u => g]])
    });
  };
  add(GZ, 'Erst Selbstkostenpreis, dann Gewinnzuschlag', {}, gzAus);
  add(GZ, 'Erst Selbstkostenpreis mit Pauschale', { pausch: true }, gzAus);
  add(GZ, 'Erst Selbstkostenpreis aus dem Karton', { pack: true }, gzAus);
  add(GZ, 'Gewinnzuschlag aus Einkauf und Listenverkaufspreis', {}, c => diffTask(c, 'gwz'));
  add(GZ, 'Gewinnzuschlag ohne Vertreterprovision', { noVp: true }, c => diffTask(c, 'gwz'));
  add(GZ, 'Gewinn je Stück aus dem Gesamtgewinn', { kzF: 1 }, c => {
    const n = pick(c.r, [20, 40, 50, 80, 100, 200]);
    const g = Math.round(c.skp * c.g) / 100;
    const G = Math.round(g * n * 100) / 100;
    return kzTask({
      text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}. Beim Verkauf von ${nf(n)} ${dat(pl(c))} erzielt die ${FIRMA} einen Gesamtgewinn von ${eur(G)}.\n\nBerechnen Sie ${ask('gwz')}. Rechnen Sie zuerst den Gewinn je ${sg(c)} aus.`,
      vr: [{ label: 'Gewinn je ' + sg(c), hint: 'Gesamtgewinn ÷ Menge', value: g }],
      parts: [kzPart('gwz')],
      steps: [
        ['SKP', u => c.skp],
        ['G', u => g]
      ]
    });
  });
});
