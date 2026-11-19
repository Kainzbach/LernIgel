/* =====================================================================
   Kennzahlen – C: Handlungskostenzuschlag
   Wird von defineKz() (gen_kz.js) aufgerufen; H enthält die gemeinsamen Hilfsfunktionen.
   ===================================================================== */
KZ_SEC.push(function (H) {
  const { kzTask, ask, kzPart, QK, preOf, einkaufText, dateTab, rnd, add } = H;
  const HK = 'kz_hkz';
  add(HK, 'Aus Bezugspreis und Handlungskosten', { kzF: 1 }, c => {
    const hk = Math.round(c.bp * c.hk) / 100;
    return kzTask({
      text: `Die ${FIRMA} bezieht ${c.ware} zu einem Bezugspreis von ${eur(c.bp)} je ${sg(c)}. Die Handlungskosten betragen ${eur(hk)} je ${sg(c)}.\n\nBerechnen Sie ${ask('hkz')}.`,
      parts: [kzPart('hkz')],
      steps: [
        ['BP', u => c.bp],
        ['HK', u => hk]
      ]
    });
  });
  add(HK, 'Aus der Kostenrechnung', {}, c => {
    const we = between(c.r, 150000, 900000, 5000),
      hk = rnd(we * (0.2 + c.r() * 0.3), 10);
    return kzTask({
      text: `Die Kostenrechnung eines Handelsbetriebs liefert folgende Zahlen:{{tabelle}}Ermitteln Sie ${ask('hkz')}.`,
      tabelle: {
        head: ['Position', 'Betrag'],
        rows: [
          ['Wareneinsatz', eur(we)],
          ['Summe der Handlungskosten', eur(hk)]
        ]
      },
      parts: [kzPart('hkz')],
      steps: [
        ['BP', u => we],
        ['HK', u => hk]
      ]
    });
  });
  add(HK, 'Aus mehreren Handlungskostenarten', {}, c => {
    const we = between(c.r, 300000, 900000, 5000);
    const a = rnd(we * (0.1 + c.r() * 0.05), 10),
      b = rnd(we * (0.04 + c.r() * 0.03), 10),
      d = rnd(we * (0.02 + c.r() * 0.02), 10),
      e = rnd(we * (0.01 + c.r() * 0.02), 10);
    return kzTask({
      text: `Die Kostenrechnung der ${FIRMA} weist für das Geschäftsjahr aus:{{tabelle}}Berechnen Sie ${ask('hkz')}.`,
      tabelle: {
        head: ['Position', 'Betrag'],
        rows: [
          ['Wareneinsatz', eur(we)],
          ['Personalkosten', eur(a)],
          ['Mieten und Nebenkosten', eur(b)],
          ['Werbung', eur(d)],
          ['Sonstige Verwaltungskosten', eur(e)]
        ]
      },
      parts: [kzPart('hkz')],
      steps: [
        ['BP', u => we],
        ['HK', u => a + b + d + e]
      ]
    });
  });
  add(HK, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 1 }, c => {
    const hk = Math.round(c.bp * c.hk) / 100;
    return kzTask({
      text: `Die ${FIRMA} hat für einen Artikel die Daten aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask('hkz')} für ${c.ware}.`,
      tabelle: {
        head: ['Art.-Nr.', 'Bezugs­preis je Stück', 'Handlungs­kosten je Stück', 'Menge eingekauft'],
        rows: [[dateTab(c), eur(c.bp), eur(hk), String(between(c.r, 20, 200, 10))]]
      },
      parts: [kzPart('hkz')],
      steps: [
        ['BP', u => c.bp],
        ['HK', u => hk]
      ]
    });
  });
  add(HK, 'Aus Bezugspreis und Selbstkostenpreis', { kzF: 1 }, c =>
    kzTask({
      text: `Für ${c.ware} beträgt der Bezugspreis ${eur(c.bp)} je ${sg(c)} und der Selbstkostenpreis ${eur(c.skp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask('hkz')}.`,
      parts: [kzPart('hkz')],
      steps: [
        ['BP', u => c.bp],
        ['SKP', u => c.skp],
        ['HK', u => r2(u('SKP') - u('BP'))]
      ]
    })
  );
  const hkAus = c => {
    const e = einkaufVor(c);
    const bp = truth({ steps: e }).BP;
    c.skp = Math.round(bp * (1.15 + c.r() * 0.3) * 100) / 100;
    return vorTask(c, {
      from: 'LEP',
      to: 'BP',
      given: ['SKP'],
      pre: preOf(c),
      text:
        einkaufText(c, `Der Selbstkostenpreis beträgt ${eur(c.skp)} je ${sg(c)}.`) +
        `\n\na) ` +
        Q +
        'den Bezugspreis je ' +
        sg(c) +
        `.\n\nb) ${QK}${ask('hkz')}.`,
      parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart('hkz', 'b)')],
      steps: [].concat(e, [
        ['SKP', u => c.skp],
        ['HK', u => r2(u('SKP') - u('BP'))]
      ])
    });
  };
  add(HK, 'Erst Bezugspreis, dann Handlungskostenzuschlag', {}, hkAus);
  add(HK, 'Erst Bezugspreis mit Pauschale, dann Zuschlag', { pausch: true }, hkAus);
  add(HK, 'Erst Bezugspreis aus dem Karton, dann Zuschlag', { pack: true }, hkAus);
  add(HK, 'Aus dem Gewinn- und Verlustkonto', {}, c => {
    const we = between(c.r, 1200000, 3600000, 50000),
      wv = Math.round((we * (1.35 + c.r() * 0.3)) / 10000) * 10000;
    const p = (a, b) => rnd(we * (a + c.r() * (b - a)), 1000);
    const g = p(0.1, 0.16),
      s = p(0.02, 0.04),
      m = p(0.02, 0.05),
      w = p(0.01, 0.03),
      ab = p(0.02, 0.05);
    const saldo = wv - we - g - s - m - w - ab;
    return kzTask({
      text: `Die Buchhaltung der {{firma}} hat zum Jahresende das unten abgebildete Gewinn- und Verlustkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('hkz')}. Zu den Handlungskosten zählen alle Aufwendungen außer dem Wareneingang.`,
      konto: {
        title: 'Gewinn- und Verlustkonto (930) der {{firma}}',
        soll: [
          ['301 Wareneingang', we],
          ['402 Gehälter', g],
          ['404 Sozialabgaben', s],
          ['420 Mieten', m],
          ['480 Werbung', w],
          ['491 Abschreibungen', ab],
          ['Saldo', saldo]
        ],
        haben: [['801 Warenverkauf', wv]]
      },
      parts: [kzPart('hkz')],
      steps: [
        ['BP', u => we],
        ['HK', u => g + s + m + w + ab]
      ],
      bad: saldo < 20000
    });
  });
  add(HK, 'Aus den Quartalswerten', {}, c => {
    const mo = ['Januar', 'Februar', 'März'];
    const we = [0, 1, 2].map(() => between(c.r, 60000, 140000, 1000));
    const hk = we.map(x => rnd(x * (0.2 + c.r() * 0.25), 10));
    return kzTask({
      text: `Die Kostenrechnung der ${FIRMA} weist für das erste Quartal folgende Werte aus:{{tabelle}}Berechnen Sie ${ask('hkz')} für das gesamte Quartal.`,
      tabelle: {
        head: ['Monat', 'Wareneinsatz', 'Handlungskosten'],
        rows: mo.map((m, i) => [m, eur(we[i]), eur(hk[i])])
      },
      parts: [kzPart('hkz')],
      steps: [
        ['BP', u => we[0] + we[1] + we[2]],
        ['HK', u => hk[0] + hk[1] + hk[2]]
      ]
    });
  });
});
