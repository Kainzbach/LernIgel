/* =====================================================================
   Komplettaufgaben Typ F und Registrierung aller Komplettaufgaben
   ===================================================================== */

// F: Vorwärts bis LVP, Kennzahlen, dann Preis eines Mitbewerbers rückwärts bis zum Bezugspreis (zweite Rechenkette, eigene Zeilen mit Anhang 2)
const wrapF = (f, x) => u => f(k => u(k + x));
const sfxSteps = (steps, x) =>
  steps.map(st => {
    const o = [st[0] + x, wrapF(st[1], x)];
    if (st[2]) o.push(st[2].map(f => wrapF(f, x)));
    return o;
  });
function KF(title, o) {
  pushKO(title, { noVp: !!o.noVp, pausch: !!o.pausch, pack: !!o.pack, mkLvp: false }, c => {
    const steps1 = [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c));
    const tr1 = truth({ steps: steps1 });
    const e = wrongEuro(tr1.LVP, c);
    const at = o.lvpM ? 'LVP' : 'BVP';
    const m = Math.round((Math.round(tr1[at] * (0.86 + c.r() * 0.08)) - 0.01) * 100) / 100;
    const base2 =
      at === 'BVP'
        ? [['BVP', u => m]].concat(gRueck(c), hkRueck(c))
        : [['LVP', u => m]].concat(verkaufRueck(c), gRueck(c), hkRueck(c));
    const steps = steps1.concat(sfxSteps(base2, '2'));
    const intro = [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + '\n\n' + tHkG(c) + ' ' + tVerk(c);
    const qa = `a) ${Q}den Listenverkaufspreis (netto)${ASKJE(c)}.${tPackHinweis(c)}`;
    const qb =
      `b) ${Qauf(1, 'unter Angabe des Rechenweges ')}${kzAsk(o.kz)}.` +
      ersNote('a)', 'b)', `einem Listenverkaufspreis von ${eur(e)}`);
    const daten = joinUnd(
      [
        c.ks ? c.ks + ' % Kundenskonto' : '',
        c.vp ? c.vp + ' % Vertreterprovision' : '',
        c.hk + ' % Handlungskostenzuschlag',
        c.kr + ' % Kundenrabatt',
        c.g + ' % Gewinnzuschlag'
      ].filter(Boolean)
    );
    const preis = at === 'BVP' ? 'Barverkaufspreis' : 'Listenverkaufspreis (netto)';
    const qc =
      at === 'BVP'
        ? `c) Sechs Monate nach der Einführung bietet ein Mitbewerber ${c.ware} zu einem ${preis} von ${eur(m)}${ASKJE(c)} an. Ermitteln Sie unter Angabe des Kalkulationsschemas, zu welchem Bezugspreis${ASKJE(c)} die ${FIRMA} ${c.ware} beziehen müsste, um ebenfalls zu diesem Preis anbieten zu können. Verwenden Sie dabei die folgenden Daten: ${daten}.`
        : `c) Sechs Monate nach der Einführung bietet ein Mitbewerber ${c.ware} zu einem ${preis} von ${eur(m)}${ASKJE(c)} an. Ermitteln Sie, zu welchem Bezugspreis${ASKJE(c)} die ${FIRMA} ${c.ware} beziehen müsste, um ebenfalls zu diesem Preis anbieten zu können. Rechnen Sie mit den bisherigen Sätzen.`;
    return ersTask(c, {
      from: 'LEP',
      to: 'LVP',
      kzBase: 'LVP',
      dirOf: k => (sfxOf(k) ? 'r' : 'v'),
      given: [],
      steps,
      parts: [
        { label: 'a)', title: KTITLE.LVP, table: true, from: 'LEP', to: 'LVP' },
        { label: 'b)', title: kzTitleOf(o.kz), kz: o.kz, ersatz: { LVP: e } },
        Object.assign(
          {
            label: 'c)',
            title: 'Bezugspreis für den Preis des Mitbewerbers',
            table: true,
            from: 'BP',
            to: at,
            sfx: '2',
            given: [at],
            ans: true
          },
          at === 'LVP' ? { alt: 'kw', kwPrice: m } : {}
        )
      ],
      text: syn(intro + '\n\n' + qa + '\n\n' + qb + '\n\n' + qc, c)
    });
  });
}

// Reihenfolge gemischt: Typen und Tabellenzahl wechseln (14 Aufgaben mit einer Tabelle, 6 mit zwei)
KA('Vorwärts bis zum Listenverkaufspreis, dann Kennzahlen', { kz: ['faktor', 'spanne'] });
KC('Handlungskostenzuschlag ermitteln, dann Selbstkostenpreis', { sat: ['hkzK'], from: 'BP', to: 'SKP' });
KF('Vorwärts, Kennzahlen und Preis eines Mitbewerbers (Barverkaufspreis)', { kz: ['faktor', 'spanne'] });
KE('Rückwärts bis zum Listeneinkaufspreis, dann Kennzahlen', { kz: ['zuschlag', 'faktor', 'spanne'] });
KA('Vorwärts mit Bezugskostenpauschale, dann Kennzahl', { kz: ['spanne'], pausch: true });
KC('Handlungskostenzuschlag ermitteln, dann Listenverkaufspreis', { sat: ['hkzK'], from: 'LEP', to: 'LVP' });
KF('Vorwärts, Kennzahlen und Preis eines Mitbewerbers (Listenverkaufspreis)', {
  kz: ['faktor', 'spanne'],
  lvpM: true
});
KA('Vorwärts mit Stückpreis aus der Packung, dann Kennzahlen', {
  kz: ['zuschlag', 'spanne'],
  pack: true,
  noVp: true
});
KE('Rückwärts ohne Provision, dann Kennzahlen', { kz: ['faktor', 'spanne'], noVp: true });
KB('Selbstkosten, Barverkaufspreis und Gewinn', { kz: ['gewinn'] });
KC('Gewinnzuschlag ermitteln, dann Barverkaufspreis', { sat: ['gwzK'], from: 'BP', to: 'BVP' });
KA('Barverkaufspreis, dann Kennzahlen', { kz: ['gewinn', 'spanne'], to: 'BVP', distract: true });
KF('Vorwärts mit Bezugskostenpauschale, Kennzahlen und Mitbewerber (Barverkaufspreis)', {
  kz: ['zuschlag', 'spanne'],
  pausch: true
});
KE('Rückwärts mit Bezugskostenpauschale, dann Kennzahlen', { kz: ['zuschlag', 'spanne'], pausch: true });
KC('Handlungskosten- und Gewinnzuschlag ermitteln, dann Barverkaufspreis', {
  sat: ['hkzK', 'gwzK'],
  from: 'BP',
  to: 'BVP'
});
KD('Packung, Selbstkostenpreis und Listenverkaufspreis', { pack: true, noVp: true });
KA('Vorwärts mit Pauschale bis zum Barverkaufspreis, dann Kennzahl', {
  kz: ['gewinn'],
  to: 'BVP',
  pausch: true,
  distract: true
});
KF('Vorwärts mit Stückpreis aus der Packung, Kennzahlen und Mitbewerber (Listenverkaufspreis)', {
  kz: ['faktor'],
  lvpM: true,
  pack: true,
  noVp: true
});
KC('Gewinnzuschlag ermitteln, dann Listenverkaufspreis', { sat: ['gwzK'], from: 'LEP', to: 'LVP' });
KA('Vorwärts mit Stückpreis bis zum Barverkaufspreis, dann Kennzahl', {
  kz: ['gewinn'],
  to: 'BVP',
  pack: true,
  noVp: true,
  distract: true
});
