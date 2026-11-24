/* =====================================================================
   Komplettaufgaben Typ D und C
   ===================================================================== */

// D: Packung/Pauschale möglich, Schnitt am Selbstkostenpreis, Teil b) bringt neue Sätze
function KD(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: false }, c => {
    const steps = [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c));
    const tr = truth({ steps });
    const e = wrongEuro(tr.SKP, c);
    const intro = [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ');
    const qa = `a) ${Q}den Selbstkostenpreis${ASKJE(c)}.${tPackHinweis(c)}`;
    const qb =
      `b) ${tGVerk(c)} Ermitteln Sie auf der Grundlage Ihres Ergebnisses aus a) unter Angabe des Kalkulationsschemas den Listenverkaufspreis (netto)${ASKJE(c)}.` +
      ersNote('a)', 'b)', `Selbstkosten von ${eur(e)}`);
    const parts = [
      { label: 'a)', title: KTITLE.SKP, table: true, from: 'LEP', to: 'SKP' },
      { label: 'b)', title: KTITLE.LVP, table: true, from: 'SKP', to: 'LVP', ersatz: { SKP: e } }
    ];
    let text = intro + '\n\n' + qa + '\n\n' + qb;
    if (o.kz) {
      parts.push({ label: 'c)', title: kzTitleOf(o.kz), kz: o.kz });
      text += `\n\nc) ${Qauf(2, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.`;
    }
    return ersTask(c, {
      from: 'LEP',
      to: 'LVP',
      kzBase: 'LVP',
      dirOf: () => 'v',
      given: [],
      steps,
      parts,
      text: syn(text, c)
    });
  });
}
// C: Erst einen Satz aus Kostenzahlen ermitteln (Kennzahl), dann damit das Schema rechnen
function KC(title, o) {
  pushKO(title, { noVp: !!o.noVp, mkLvp: false, pausch: false, mkBp: o.from === 'BP' }, c => {
    const hk = o.sat.includes('hkzK'),
      gw = o.sat.includes('gwzK');
    const S = [];
    if (hk) {
      c.we = between(c.r, 150000, 900000, 10000);
      const pct = 18 + c.r() * 40;
      c.hks = Math.round((c.we * pct) / 100 / 10) * 10;
      S.push(
        ['WE', u => c.we],
        ['HKS', u => c.hks],
        [
          'HKSATZ',
          u => (EXACT ? (u('HKS') * 100) / u('WE') : Math.round(((u('HKS') * 100) / u('WE')) * 100) / 100)
        ]
      );
      c.hk = Math.round(((c.hks * 100) / c.we) * 100) / 100;
    }
    if (gw) {
      c.sks = between(c.r, 400000, 2400000, 10000);
      const pct = 5 + c.r() * 17;
      c.gs = Math.round((c.sks * pct) / 100 / 10) * 10;
      S.push(
        ['SKS', u => c.sks],
        ['GS', u => c.gs],
        [
          'GWSATZ',
          u => (EXACT ? (u('GS') * 100) / u('SKS') : Math.round(((u('GS') * 100) / u('SKS')) * 100) / 100)
        ]
      );
      c.g = Math.round(((c.gs * 100) / c.sks) * 100) / 100;
    }
    const to = o.to,
      from = o.from;
    const steps = [].concat(S);
    const einkauf = from === 'LEP' ? einkaufVor(c) : [['BP', u => c.bp]];
    steps.push(...einkauf);
    steps.push(
      ['HK', u => r2((u('BP') * (hk ? u('HKSATZ') : c.hk)) / 100)],
      ['SKP', u => r2(u('BP') + u('HK'))]
    );
    if (to !== 'SKP') {
      steps.push(
        ['G', u => r2((u('SKP') * (gw ? u('GWSATZ') : c.g)) / 100)],
        ['BVP', u => r2(u('SKP') + u('G'))]
      );
      if (to === 'LVP') steps.push(...verkaufVor(c));
    }
    const tr = truth({ steps });
    const bez = c.r() < 0.5 ? 'Bezugspreis' : 'Einstandspreis';
    const lines = [];
    if (hk) lines.push(`Wareneinsatz ${eur(c.we)}`, `Summe der Handlungskosten ${eur(c.hks)}`);
    if (gw) lines.push(`Selbstkosten insgesamt ${eur(c.sks)}`, `erzielter Gewinn insgesamt ${eur(c.gs)}`);
    const intro = `Die Kostenrechnung der ${FIRMA} liefert folgende Zahlen:\n${lines.join('\n')}`;
    const ids = o.sat;
    const ers = {};
    const parts = [];
    const bits = [];
    if (hk) {
      ers.HKSATZ = wrongSatz(tr.HKSATZ, c);
      bits.push(`einem Handlungskostenzuschlag von ${fmtPct(ers.HKSATZ)} %`);
    }
    if (gw) {
      ers.GWSATZ = wrongSatz(tr.GWSATZ, c);
      bits.push(`einem Gewinnzuschlag von ${fmtPct(ers.GWSATZ)} %`);
    }
    const qa = `a) Ermitteln Sie ${kzAsk(ids)}!`;
    const qnote = ersNote('a)', 'b)', joinUnd(bits));
    let qb;
    if (from === 'LEP')
      qb = `b) ${[tEinkauf(c), tRabatt(c), tBzk(c)].join(' ')}${!gw && to === 'LVP' ? ' Der Gewinnzuschlag beträgt ' + c.g + ' %. ' + tVerk(c) : ''}\nKalkulieren Sie unter Angabe des Kalkulationsschemas ${TGT[to]} je ${sg(c)}.`;
    else
      qb = `b) Die ${FIRMA} bezieht ${c.ware} zu einem ${bez} von ${eur(c.bp)} je ${sg(c)}.${gw && !hk ? ' Der Handlungskostenzuschlag beträgt ' + c.hk + ' %.' : ''}\nKalkulieren Sie unter Angabe des Kalkulationsschemas ${TGT[to]} je ${sg(c)}.`;
    return {
      from,
      to,
      kzBase: 'LVP',
      dirOf: () => 'v',
      given: from === 'BP' ? ['BP'] : [],
      steps,
      kzFirst: true,
      pre: [],
      parts: [
        {
          label: 'a)',
          title: kzTitleOf(ids),
          kz: ids,
          feeds: Object.assign({}, hk ? { hkzK: 'HKSATZ' } : {}, gw ? { gwzK: 'GWSATZ' } : {})
        },
        { label: 'b)', title: KTITLE[to], table: true, from, to, ersatz: ers }
      ],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb + qnote, c)
    };
  });
}
