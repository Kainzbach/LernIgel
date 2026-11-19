/* =====================================================================
   Kennzahlen – Differenz-Aufgabe: Einkauf vorwärts bis SKP, Verkauf rückwärts ab LVP, Gewinn als Differenz (wird von B und D mitgenutzt)
   Wird von defineKz() (gen_kz.js) aufgerufen; H enthält die gemeinsamen Hilfsfunktionen.
   ===================================================================== */
KZ_SEC.push(function (H) {
  const { ask, kzPart, QK, preOf, DIRD, badG } = H;
  const diffTask = (c, id, o) => {
    o = o || {};
    c.kr = c.kr || 10;
    const base = truth({ steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) });
    c.lvp = Math.round(base.LVP / 10) * 10;
    const steps = [].concat(
      einkaufVor(c),
      hkVor(Object.assign({}, c, { g: null }), 'BP'),
      [['LVP', u => c.lvp]],
      verkaufRueck(c),
      [['G', u => r2(u('BVP') - u('SKP'))]]
    );
    return {
      from: 'LEP',
      to: 'LVP',
      kzBase: 'LVP',
      given: ['LVP'],
      dirOf: DIRD,
      pre: preOf(c),
      bad: badG(steps),
      text:
        [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ') +
        tPackHinweis(c) +
        `\n\nFür ${c.ware} soll ein Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} angesetzt werden. ` +
        tVerk(c) +
        '\n\na) ' +
        Q +
        'den Gewinn in Euro je ' +
        sg(c) +
        `.\n\nb) ${QK}${ask(id)}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart(id, 'b)')],
      steps
    };
  };
  H.diffTask = diffTask;
});
