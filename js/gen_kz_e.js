/* =====================================================================
   Kennzahlen – E: Durchschnittliche Handelsspanne
   Wird von defineKz() (gen_kz.js) aufgerufen; H enthält die gemeinsamen Hilfsfunktionen.
   ===================================================================== */
KZ_SEC.push(function (H) {
  const { kzTask, ask, kzPart, rnd, add } = H;
  const GS = 'kz_gvs';
  const wePair = c => {
    const we = between(c.r, 1200000, 4200000, 50000),
      wv = Math.round((we * (1.25 + Math.floor(c.r() * 9) * 0.05)) / 10000) * 10000;
    return [we, wv];
  };
  const gvTask = o => kzTask(Object.assign({ parts: [kzPart('spannegv')] }, o));
  add(GS, 'Aus dem Gewinn- und Verlustkonto', { konto: true }, c => {
    const r = c.r;
    const we = between(r, 1200000, 4200000, 50000),
      wv = Math.round((we * (1.25 + Math.floor(r() * 9) * 0.05)) / 10000) * 10000;
    const part = (a, b) => Math.round((wv * (a + r() * (b - a))) / 1000) * 1000;
    const soll = [
      ['301 Wareneingang', we],
      ['402 Gehälter', part(0.1, 0.16)],
      ['404 Sozialabgaben', part(0.02, 0.04)],
      ['430 Energie und Betriebsstoffe', part(0.005, 0.015)],
      ['481 Bürobedarf', part(0.005, 0.02)],
      ['491 Abschreibungen', part(0.02, 0.05)]
    ];
    const saldo = wv - soll.reduce((a, x) => a + x[1], 0);
    soll.push(['Saldo', saldo]);
    return gvTask({
      text: `Die Buchhaltung der {{firma}} hat zum Jahresende das unten abgebildete Gewinn- und Verlustkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('spannegv')}.`,
      konto: {
        title: 'Gewinn- und Verlustkonto (930) der {{firma}}',
        soll,
        haben: [['801 Warenverkauf', wv]]
      },
      steps: [
        ['WV', u => wv],
        ['WE', u => we]
      ],
      bad: saldo < 20000
    });
  });
  add(GS, 'Aus Wareneinsatz und Warenverkauf', {}, c => {
    const [we, wv] = wePair(c);
    return gvTask({
      text: `Die ${FIRMA} hat im Geschäftsjahr einen Wareneinsatz von ${eur(we)} und Umsatzerlöse aus dem Warenverkauf von ${eur(wv)}.\n\nBerechnen Sie ${ask('spannegv')}.`,
      steps: [
        ['WV', u => wv],
        ['WE', u => we]
      ]
    });
  });
  add(GS, 'Aus dem Warenkonto', { konto: true }, c => {
    const [we, wv] = wePair(c);
    const ab = rnd(we * (0.08 + c.r() * 0.06), 10000),
      sb = rnd(we * (0.08 + c.r() * 0.06), 10000);
    const zug = we + sb - ab;
    const rohg = wv - we;
    return gvTask({
      text: `Die {{firma}} hat zum Jahresende das Warenkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('spannegv')}. Den Wareneinsatz müssen Sie aus Anfangsbestand, Zugängen und Schlussbestand ermitteln.`,
      konto: {
        title: 'Warenkonto der {{firma}}',
        soll: [
          ['Anfangsbestand', ab],
          ['Wareneingang', zug],
          ['Saldo (Rohgewinn)', rohg]
        ],
        haben: [
          ['Schlussbestand', sb],
          ['Warenverkauf', wv]
        ]
      },
      steps: [
        ['WV', u => wv],
        ['WE', u => we]
      ],
      bad: rohg < 20000 || we < 100000
    });
  });
  add(GS, 'Aus Anfangsbestand, Zugängen und Schlussbestand', {}, c => {
    const [we, wv] = wePair(c);
    const ab = rnd(we * (0.08 + c.r() * 0.06), 10000),
      sb = rnd(we * (0.08 + c.r() * 0.06), 10000);
    const zug = we + sb - ab;
    return gvTask({
      text: `Die ${FIRMA} hat zu Beginn des Jahres einen Warenbestand von ${eur(ab)}. Im Jahr wurden Waren für ${eur(zug)} eingekauft. Der Warenbestand am Jahresende beträgt ${eur(sb)}. Die Umsatzerlöse aus dem Warenverkauf betragen ${eur(wv)}.\n\nBerechnen Sie ${ask('spannegv')}.`,
      steps: [
        ['WV', u => wv],
        ['WE', u => we]
      ]
    });
  });
  add(GS, 'Aus den Quartalswerten', {}, c => {
    const q = ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'];
    const we = q.map(() => between(c.r, 200000, 800000, 10000));
    const wv = we.map(x => Math.round((x * (1.25 + c.r() * 0.4)) / 1000) * 1000);
    return gvTask({
      text: `Die ${FIRMA} hat folgende Quartalswerte ermittelt:{{tabelle}}Berechnen Sie ${ask('spannegv')} für das gesamte Jahr.`,
      tabelle: {
        head: ['Quartal', 'Wareneinsatz', 'Warenverkauf'],
        rows: q.map((x, i) => [x, eur(we[i]), eur(wv[i])])
      },
      steps: [
        ['WV', u => wv[0] + wv[1] + wv[2] + wv[3]],
        ['WE', u => we[0] + we[1] + we[2] + we[3]]
      ]
    });
  });
  add(GS, 'Aus zwei Sortimentsbereichen', {}, c => {
    const a = wePair(c),
      b = wePair(c);
    const sp = pick(c.r, [
      ['Sportbekleidung', 'Sportgeräte'],
      ['Haushaltswaren', 'Elektrogeräte'],
      ['Büromaterial', 'Bürotechnik'],
      ['Gartenbedarf', 'Gartengeräte']
    ]);
    return gvTask({
      text: `Die ${FIRMA} führt zwei Sortimentsbereiche:{{tabelle}}Berechnen Sie ${ask('spannegv')} für das gesamte Sortiment.`,
      tabelle: {
        head: ['Bereich', 'Wareneinsatz', 'Warenverkauf'],
        rows: [
          [sp[0], eur(a[0]), eur(a[1])],
          [sp[1], eur(b[0]), eur(b[1])]
        ]
      },
      steps: [
        ['WV', u => a[1] + b[1]],
        ['WE', u => a[0] + b[0]]
      ]
    });
  });
  add(GS, 'Aus Menge und Preisen', {}, c => {
    const n = between(c.r, 4000, 30000, 500),
      bp = between(c.r, 8, 60, 0.5),
      vp = Math.round(bp * (1.3 + c.r() * 0.5) * 2) / 2;
    return gvTask({
      text: `Die ${FIRMA} hat im Geschäftsjahr ${n.toLocaleString('de-DE')} Stück eines Artikels verkauft. Der durchschnittliche Bezugspreis betrug ${eur(bp)} je Stück, der durchschnittliche Verkaufspreis ${eur(vp)} je Stück.\n\nBerechnen Sie ${ask('spannegv')}. Rechnen Sie zuerst Wareneinsatz und Warenverkauf aus.`,
      vr: [
        { label: 'Wareneinsatz', hint: 'Menge × Bezugspreis', value: Math.round(n * bp * 100) / 100 },
        { label: 'Warenverkauf', hint: 'Menge × Verkaufspreis', value: Math.round(n * vp * 100) / 100 }
      ],
      steps: [
        ['WV', u => Math.round(n * vp * 100) / 100],
        ['WE', u => Math.round(n * bp * 100) / 100]
      ]
    });
  });
  add(GS, 'Mit Rücksendungen und Preisnachlässen', {}, c => {
    const [we, wv] = wePair(c);
    const rs = rnd(wv * (0.01 + c.r() * 0.02), 1000),
      nl = rnd(wv * (0.005 + c.r() * 0.015), 1000);
    const br = wv + rs + nl;
    return gvTask({
      text: `Die ${FIRMA} hat im Geschäftsjahr Warenverkäufe von ${eur(br)} gebucht. Davon wurden Waren im Wert von ${eur(rs)} zurückgesendet, und es wurden Preisnachlässe von ${eur(nl)} gewährt. Der Wareneinsatz beträgt ${eur(we)}.\n\nBerechnen Sie ${ask('spannegv')} auf der Grundlage der tatsächlich erzielten Verkaufserlöse.`,
      steps: [
        ['WV', u => br - rs - nl],
        ['WE', u => we]
      ]
    });
  });
  add(GS, 'Aus dem Gewinn- und Verlustkonto mit Zinsen', { konto: true }, c => {
    const r = c.r;
    const we = between(r, 1200000, 4200000, 50000),
      wv = Math.round((we * (1.25 + Math.floor(r() * 9) * 0.05)) / 10000) * 10000;
    const part = (a, b) => Math.round((wv * (a + r() * (b - a))) / 1000) * 1000;
    const soll = [
      ['301 Wareneingang', we],
      ['402 Gehälter', part(0.1, 0.16)],
      ['420 Mieten', part(0.02, 0.05)],
      ['491 Abschreibungen', part(0.02, 0.05)],
      ['751 Zinsaufwendungen', part(0.005, 0.015)]
    ];
    const zin = part(0.002, 0.008);
    const saldo = wv + zin - soll.reduce((a, x) => a + x[1], 0);
    soll.push(['Saldo', saldo]);
    return gvTask({
      text: `Die Buchhaltung der {{firma}} hat zum Jahresende das unten abgebildete Gewinn- und Verlustkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('spannegv')}. Zinserträge gehören nicht zum Warenverkauf.`,
      konto: {
        title: 'Gewinn- und Verlustkonto (930) der {{firma}}',
        soll,
        haben: [
          ['801 Warenverkauf', wv],
          ['771 Zinserträge', zin]
        ]
      },
      steps: [
        ['WV', u => wv],
        ['WE', u => we]
      ],
      bad: saldo < 20000
    });
  });
  add(GS, 'Aus Vorjahr und Berichtsjahr', {}, c => {
    const a = wePair(c),
      b = wePair(c);
    return gvTask({
      text: `Die ${FIRMA} vergleicht zwei Geschäftsjahre:{{tabelle}}Berechnen Sie ${ask('spannegv')} für das aktuelle Geschäftsjahr.`,
      tabelle: {
        head: ['Geschäftsjahr', 'Wareneinsatz', 'Warenverkauf'],
        rows: [
          ['Vorjahr', eur(a[0]), eur(a[1])],
          ['Aktuelles Jahr', eur(b[0]), eur(b[1])]
        ]
      },
      steps: [
        ['WV', u => b[1]],
        ['WE', u => b[0]]
      ]
    });
  });
});
