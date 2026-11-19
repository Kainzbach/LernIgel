/* =====================================================================
   Aufgabentypen Vorwärtskalkulation (Bezugspreis → Listenverkaufspreis), 10 feste Aufgaben
   ===================================================================== */

const vorTask = (c, o) => Object.assign({ dirOf: () => 'v', kzBase: 'LVP' }, o);

V('Bezugspreis', {}, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'BP',
    text: [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + Q + 'den Bezugspreis je ' + sg(c) + '.',
    parts: [{ label: '', title: 'Bezugspreis', table: true }],
    steps: einkaufVor(c)
  })
);
V('Selbstkostenpreis', {}, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'SKP',
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ') +
      '\n\n' +
      Q +
      'den Selbstkostenpreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Selbstkostenpreis', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'))
  })
);
V('Barverkaufspreis', {}, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'BVP',
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      tKunde(c) +
      '\n\n' +
      Q +
      'den Barverkaufspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Barverkaufspreis', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'))
  })
);
V('Listenverkaufspreis', {}, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'LVP',
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      ' ' +
      tVerk(c) +
      tKunde(c) +
      '\n\n' +
      Q +
      'den Listenverkaufspreis (netto) je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Listenverkaufspreis', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c))
  })
);
V('Listenverkaufspreis ohne Vertreterprovision', { noVp: true }, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'LVP',
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      ' ' +
      tVerk(c) +
      '\n\n' +
      Q +
      'den Listenverkaufspreis (netto) je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Listenverkaufspreis', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c))
  })
);
V('Start beim Bezugspreis', {}, c => {
  const bp = Math.round(c.lep * (1 - c.lr / 100) * 100) / 100;
  c.bp = bp;
  const d = Object.assign({}, c, { lr: null, ls: null, bzk: null });
  return vorTask(d, {
    from: 'BP',
    to: 'LVP',
    given: ['BP'],
    ctx: d,
    text:
      `Die ${FIRMA} bezieht ${c.ware} von der ${where(c)}. Der Bezugspreis beträgt ${eur(bp)} je ${sg(c)}.\n\n` +
      tHkG(c) +
      ' ' +
      tVerk(c) +
      '\n\n' +
      Q +
      'den Listenverkaufspreis (netto) je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Listenverkaufspreis', table: true }],
    steps: [].concat([['BP', u => bp]], hkVor(c, 'BP'), verkaufVor(c))
  });
});
V('Bezugskosten als Pauschale', { pausch: true }, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'LVP',
    pre: [`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`],
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      ' ' +
      tVerk(c) +
      '\n\n' +
      Q +
      'den Listenverkaufspreis (netto) je ' +
      sg(c) +
      '.' +
      tPackHinweis(c),
    parts: [{ label: '', title: 'Listenverkaufspreis', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c))
  })
);
V('Stückpreis aus der Packung', { pack: true, noVp: true }, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'BVP',
    pre: [`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`],
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      '\n\n' +
      Q +
      'den Barverkaufspreis je Stück.' +
      tPackHinweis(c),
    parts: [{ label: '', title: 'Barverkaufspreis je Stück', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'))
  })
);
V('Stückpreis aus der Packung bis zum Listenverkaufspreis', { pack: true, noVp: true }, c =>
  vorTask(c, {
    from: 'LEP',
    to: 'LVP',
    pre: [`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`],
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      ' ' +
      tVerk(c) +
      '\n\n' +
      Q +
      'den Listenverkaufspreis (netto) je Stück.' +
      tPackHinweis(c),
    parts: [{ label: '', title: 'Listenverkaufspreis je Stück', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c))
  })
);
V('Zielverkaufspreis', { noKr: true }, c => {
  c.kr = 0;
  return vorTask(c, {
    from: 'LEP',
    to: 'ZVP',
    kzBase: 'ZVP',
    text:
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      ' ' +
      tVerk(c) +
      '\n\n' +
      Q +
      'den Zielverkaufspreis je ' +
      sg(c) +
      '.',
    parts: [{ label: '', title: 'Zielverkaufspreis', table: true }],
    steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c))
  });
});
