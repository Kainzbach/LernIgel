/* =====================================================================
   Komplettaufgaben Typ A, E und B
   ===================================================================== */

// A: Vorwärts durchgehend, danach Kennzahlen aus dem Ergebnis (Ersatzwert für das Ergebnis aus a)
function KA(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: false }, c => {
    const to = o.to || 'LVP';
    const steps = [].concat(einkaufVor(c), hkVor(c, 'BP'), to === 'LVP' ? verkaufVor(c) : []);
    const tr = truth({ steps });
    const e = wrongEuro(tr[to], c);
    const intro =
      [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') +
      '\n\n' +
      tHkG(c) +
      (to === 'LVP' || o.distract ? ' ' + tVerk(c) : '');
    const qa = `a) ${Q}${TGT[to]}${ASKJE(c)}.${tPackHinweis(c)}`;
    const qb =
      `b) ${Qauf(1, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.` +
      ersNote('a)', 'b)', `einem ${SCH[to].alias[0]} von ${eur(e)}`);
    return ersTask(c, {
      from: 'LEP',
      to,
      kzBase: to,
      dirOf: () => 'v',
      given: [],
      steps,
      parts: [
        { label: 'a)', title: KTITLE[to], table: true, from: 'LEP', to },
        { label: 'b)', title: kzTitleOf(o.kz), kz: o.kz, ersatz: { [to]: e } }
      ],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb, c)
    });
  });
}
// E: Rückwärts durchgehend (Listenverkaufspreis gegeben), danach Kennzahlen
function KE(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, mkLvp: true }, c => {
    const steps = [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c), einkaufRueck(c));
    const tr = truth({ steps });
    const e = wrongEuro(tr.BP, c);
    const intro =
      `Die ${FIRMA} möchte ${c.ware} in ihr Sortiment aufnehmen. ` +
      lvpGiven(c) +
      '\n\n' +
      tVerkMarkt(c) +
      ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %. ` +
      tRabatt(c) +
      ' ' +
      tBzk(c);
    const qa = `a) ${Q}den höchsten Listeneinkaufspreis je ${sg(c)}.${tPackHinweis(c)}`;
    const qb =
      `b) ${Qauf(1, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.` +
      ersNote('a)', 'b)', `einem Bezugspreis von ${eur(e)}`);
    return ersTask(c, {
      from: 'LEP',
      to: 'LVP',
      kzBase: 'LVP',
      dirOf: () => 'r',
      given: ['LVP'],
      steps,
      parts: [
        { label: 'a)', title: KTITLE.LEP, table: true },
        { label: 'b)', title: kzTitleOf(o.kz), kz: o.kz, ersatz: { BP: e } }
      ],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb, c)
    });
  });
}
// B: Vorwärts bis Selbstkostenpreis, dann Barverkaufspreis rückwärts ab Listenverkaufspreis, Gewinn als Differenz
function KB(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: true }, c => {
    const base = truth({ steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) });
    c.lvp = Math.round(base.LVP / 10) * 10;
    const steps = [].concat(
      einkaufVor(c),
      hkVor(Object.assign({}, c, { g: null }), 'BP'),
      [['LVP', u => c.lvp]],
      verkaufRueck(c),
      [['G', u => r2(u('BVP') - u('SKP'))]]
    );
    const dirOf = k => (k === 'G' ? 'd' : ['KR', 'ZVP', 'KS', 'VP', 'BVP'].includes(k) ? 'r' : 'v');
    const tr = truth({ steps });
    const e1 = wrongEuro(tr.SKP, c);
    let e2 = Math.round((e1 + tr.G * (c.r() < 0.5 ? 0.85 : 1.15)) * 10) / 10;
    if (Math.abs(e2 - tr.BVP) < 0.4) e2 = Math.round((e2 + 1.5) * 10) / 10;
    if (e2 - e1 < 0.3) e2 = Math.round((e1 + 0.5) * 10) / 10;
    const intro = [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ');
    const qa = `a) ${Q}den Selbstkostenpreis${ASKJE(c)}.${tPackHinweis(c)}`;
    const kz = o.kz || ['gewinn'];
    const qb =
      `b) Die ${FIRMA} möchte ${c.ware} zu einem Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} anbieten. ${tVerk(c)} Ermitteln Sie auf der Grundlage Ihres Ergebnisses aus a) unter Angabe des Kalkulationsschemas den Barverkaufspreis${ASKJE(c)} und den Gewinn in Euro. Berechnen Sie außerdem ${kzAsk(kz)}.` +
      ersNote('a)', 'b)', `Selbstkosten von ${eur(e1)}`);
    return ersTask(c, {
      from: 'LEP',
      to: 'LVP',
      kzBase: 'LVP',
      dirOf,
      given: ['LVP'],
      steps,
      parts: [
        { label: 'a)', title: KTITLE.SKP, table: true, from: 'LEP', to: 'SKP' },
        {
          label: 'b)',
          title: 'Barverkaufspreis und Gewinn in Euro',
          table: true,
          from: 'SKP',
          to: 'LVP',
          rank: ['G', 'SKP', 'BVP', 'KS', 'VP', 'ZVP', 'KR', 'LVP'],
          signs: { G: '=' },
          rankAlt: ['SKP', 'G', 'BVP', 'KS', 'VP', 'ZVP', 'KR', 'LVP'],
          ersatz: { SKP: e1 }
        },
        { title: kzTitleOf(kz), kz }
      ],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb, c)
    });
  });
}
