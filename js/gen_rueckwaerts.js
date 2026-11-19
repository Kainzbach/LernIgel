/* =====================================================================
   Aufgabentypen Rückwärtskalkulation (Listenverkaufspreis → Bezugspreis), 10 feste Aufgaben
   ===================================================================== */

const rueckTask = (c, o) => Object.assign({ dirOf: () => 'r', kzBase: 'LVP' }, o);
const lvpGiven = c =>
  `Am Markt lässt sich ein Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} durchsetzen.`;
R('Barverkaufspreis', { mkLvp: true }, c =>
  rueckTask(c, {
    from: 'BVP',
    to: 'LVP',
    given: ['LVP'],
    text:
      `Die ${FIRMA} verkauft ${c.ware} zu einem Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)}. ` +
      tVerkMarkt(c) +
      '\n\n' +
      Q +
      'den Barverkaufspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Barverkaufspreis', table: true }],
    steps: [['LVP', u => c.lvp]].concat(verkaufRueck(c))
  })
);
R('Zielverkaufspreis', { mkLvp: true, noVp: true }, c =>
  rueckTask(c, {
    from: 'ZVP',
    to: 'LVP',
    given: ['LVP'],
    text:
      `Die ${FIRMA} verkauft ${c.ware} zu einem Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)}. Dabei werden ${c.kr} % Kundenrabatt eingeräumt.\n\n` +
      Q +
      'den Zielverkaufspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Zielverkaufspreis', table: true }],
    steps: [
      ['LVP', u => c.lvp],
      ['KR', u => pc(u('LVP'), c.kr)],
      ['ZVP', u => r2(u('LVP') - u('KR'))]
    ]
  })
);
R('Selbstkostenpreis', { mkLvp: true }, c =>
  rueckTask(c, {
    from: 'SKP',
    to: 'LVP',
    given: ['LVP'],
    text:
      lvpGiven(c) +
      ' ' +
      tVerkMarkt(c) +
      ` Der Gewinnzuschlag beträgt ${c.g} %.\n\n` +
      Q +
      'den Selbstkostenpreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Selbstkostenpreis', table: true }],
    steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c))
  })
);
R('Bezugspreis', { mkLvp: true }, c =>
  rueckTask(c, {
    from: 'BP',
    to: 'LVP',
    given: ['LVP'],
    text:
      lvpGiven(c) +
      ' ' +
      tVerkMarkt(c) +
      ` Der Gewinnzuschlag beträgt ${c.g} %, der Handlungskostenzuschlag ${c.hk} %.\n\n` +
      Q +
      'den Bezugspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Bezugspreis', table: true }],
    steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c))
  })
);
R('Höchster Listeneinkaufspreis', { mkLvp: true }, c =>
  rueckTask(c, {
    from: 'LEP',
    to: 'LVP',
    given: ['LVP'],
    text:
      `Die ${FIRMA} möchte ${c.ware} in ihr Sortiment aufnehmen. ` +
      lvpGiven(c) +
      '\n\n' +
      tVerkMarkt(c) +
      ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` +
      tRabatt(c) +
      ' ' +
      tBzk(c) +
      '\n\n' +
      Q +
      'den höchsten Listeneinkaufspreis, zu dem das Unternehmen einkaufen kann.',
    parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
    steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c))
  })
);
R('Start beim Barverkaufspreis', { mkBvp: true }, c =>
  rueckTask(c, {
    from: 'LEP',
    to: 'BVP',
    given: ['BVP'],
    text:
      `Die ${FIRMA} kann ${c.ware} zu einem Barverkaufspreis von ${eur(c.bvp)} je ${sg(c)} verkaufen. ` +
      tHkG(c) +
      ' ' +
      tRabatt(c) +
      ' ' +
      tBzk(c) +
      '\n\n' +
      Q +
      'den höchsten Listeneinkaufspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
    steps: [].concat([['BVP', u => c.bvp]], gRueck(c), hkRueck(c), einkaufRueck(c))
  })
);
R('Start beim Zielverkaufspreis', { mkZvp: true }, c =>
  rueckTask(c, {
    from: 'BP',
    to: 'ZVP',
    given: ['ZVP'],
    text:
      `Der Zielverkaufspreis für ${c.ware} beträgt ${eur(c.zvp)} je ${sg(c)}. Es werden ${c.ks} % Kundenskonto` +
      (c.vp ? ` und ${c.vp} % Vertreterprovision` : '') +
      ` gewährt. ` +
      tHkG(c) +
      '\n\n' +
      Q +
      'den Bezugspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Bezugspreis', table: true }],
    steps: [].concat([['ZVP', u => c.zvp]], zvpRueck(c), gRueck(c), hkRueck(c))
  })
);
R('Höchster Listeneinkaufspreis aus dem Bezugspreis', { mkBp: true }, c =>
  rueckTask(c, {
    from: 'LEP',
    to: 'BP',
    given: ['BP'],
    text:
      `Die ${FIRMA} darf für ${c.ware} höchstens einen Bezugspreis von ${eur(c.bp)} je ${sg(c)} zahlen. ` +
      tRabatt(c) +
      ' ' +
      tBzk(c) +
      '\n\n' +
      Q +
      'den höchsten Listeneinkaufspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
    steps: [['BP', u => c.bp]].concat(einkaufRueck(c))
  })
);
R('Höchster Listeneinkaufspreis mit Bezugskostenpauschale', { mkLvp: true, pausch: true }, c =>
  rueckTask(c, {
    from: 'LEP',
    to: 'LVP',
    given: ['LVP'],
    pre: [`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`],
    text:
      lvpGiven(c) +
      '\n\n' +
      tVerkMarkt(c) +
      ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` +
      tRabatt(c) +
      ' ' +
      tBzk(c) +
      '\n\n' +
      Q +
      'den höchsten Listeneinkaufspreis je ' +
      sg(c) +
      '.' +
      tPackHinweis(c),
    parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
    steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c))
  })
);
R('Höchster Listeneinkaufspreis ohne Provision', { mkLvp: true, noVp: true }, c =>
  rueckTask(c, {
    from: 'LEP',
    to: 'LVP',
    given: ['LVP'],
    text:
      lvpGiven(c) +
      '\n\n' +
      tVerkMarkt(c) +
      ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` +
      tRabatt(c) +
      ' ' +
      tBzk(c) +
      '\n\n' +
      Q +
      'den höchsten Listeneinkaufspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Höchstens möglicher Listeneinkaufspreis', table: true }],
    steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c))
  })
);
