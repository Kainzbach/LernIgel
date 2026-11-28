/* =====================================================================
   Lernen (Handelskalkulation): Einführung, Schema (Vorwärts, Rückwärts, Differenz), Kennzahlen A–Z, Formelblatt.
   Alle Zahlen kommen aus den Rechenfunktionen der Aufgaben (tasks.js: einkaufVor, hkVor, verkaufVor, verkaufRueck,
   einkaufRueck, mkPct), damit Erklärung und Aufgaben nie voneinander abweichen.
   ===================================================================== */
const lnBase = () => HKB + '/lernen';
const LN_PDF = { hell: 'assets/formelblatt-hell.pdf', dunkel: 'assets/formelblatt-dunkel.pdf' };
const lnState = { form: 'vorwaerts', bsp: { vorwaerts: 0, rueckwaerts: 0, differenz: 0 }, bspOpen: {}, kzBsp: {}, kz: '', card: '' };

const LN_NAME = {
  LEP: 'Listeneinkaufspreis', LR: 'Liefererrabatt', ZEP: 'Zieleinkaufspreis', LS: 'Liefererskonto',
  BEP: 'Bareinkaufspreis', BZK: 'Bezugskosten', BP: 'Bezugspreis', HK: 'Handlungskosten', SKP: 'Selbstkostenpreis',
  G: 'Gewinn', BVP: 'Barverkaufspreis', KS: 'Kundenskonto', VP: 'Vertreterprovision', ZVP: 'Zielverkaufspreis',
  KR: 'Kundenrabatt', LVP: 'Listenverkaufspreis'
};
const LN_WAS = {
  LEP: 'Der Preis laut Preisliste des Lieferanten, noch ohne Abzüge.',
  LR: 'Der Preisnachlass, den der Lieferant gewährt.',
  ZEP: 'Der Preis nach Abzug des Rabatts. Er gilt bei Zahlung auf Ziel.',
  LS: 'Der Preisnachlass bei schneller Zahlung.',
  BEP: 'Der Preis bei Zahlung innerhalb der Skontofrist.',
  BZK: 'Kosten für Fracht, Verpackung und Versand, die der Händler trägt.',
  BP: 'Was die Ware den Händler wirklich kostet, bevor die Betriebskosten dazukommen.',
  HK: 'Die Kosten des Betriebs (Miete, Löhne, Strom), die auf die Ware umgelegt werden.',
  SKP: 'Alle Kosten der Ware zusammen: Bezugspreis plus Handlungskosten.',
  G: 'Der Gewinn: das, was nach allen Kosten übrig bleiben soll.',
  BVP: 'Der Preis, den der Händler bei Barzahlung des Kunden bekommen will.',
  KS: 'Der Preisnachlass, den der Kunde bei schneller Zahlung abziehen darf.',
  VP: 'Die Provision für den Vertreter. Sie wird nur angegeben, wenn sie vorkommt.',
  ZVP: 'Der Preis, den der Kunde bei Zahlung auf Ziel zahlt.',
  KR: 'Der Preisnachlass, den der Kunde als Rabatt abziehen darf.',
  LVP: 'Der Preis laut Liste, den der Kunde sieht (netto).'
};
const lnE = fmt,
  lnP = x => fmtPct(x) + ' %',
  lnD = (x, n) => fmtDec(x, n == null ? 2 : n);

/* Rechenweg einer Zeile als Text. d: 'v' von oben, 'r' von unten, 'd' (Gewinn bei Differenz) */
function lnWie(k, d, c, u) {
  const B = c.bzk != null ? 'BP' : 'BEP';
  const sk = (c.ks || 0) + (c.vp || 0);
  const gegeben = `Steht in der Aufgabe: ${lnE(u[k])}.`;
  if (d === 'v' || d === 'd') {
    const v = {
      LEP: () => gegeben,
      LR: () => `${lnP(c.lr)} von ${lnE(u.LEP)} = ${lnE(u.LR)}.`,
      ZEP: () => `LEP − LR = ${lnE(u.LEP)} − ${lnE(u.LR)} = ${lnE(u.ZEP)}.`,
      LS: () => `${lnP(c.ls)} von ${lnE(u.ZEP)} = ${lnE(u.LS)}.`,
      BEP: () => `ZEP − LS = ${lnE(u.ZEP)} − ${lnE(u.LS)} = ${lnE(u.BEP)}.`,
      BZK: () => gegeben,
      BP: () => `BEP + BZK = ${lnE(u.BEP)} + ${lnE(u.BZK)} = ${lnE(u.BP)}.`,
      HK: () => `${lnP(c.hk)} von ${lnE(u[B])} = ${lnE(u.HK)}.`,
      SKP: () => `${B} + HK = ${lnE(u[B])} + ${lnE(u.HK)} = ${lnE(u.SKP)}.`,
      G: () => d === 'd' ? `BVP − SKP = ${lnE(u.BVP)} − ${lnE(u.SKP)} = ${lnE(u.G)}.` : `${lnP(c.g)} von ${lnE(u.SKP)} = ${lnE(u.G)}.`,
      BVP: () => `SKP + G = ${lnE(u.SKP)} + ${lnE(u.G)} = ${lnE(u.BVP)}.`,
      ZVP: () => `BVP ÷ ${lnD(1 - sk / 100)} = ${lnE(u.BVP)} ÷ ${lnD(1 - sk / 100)} = ${lnE(u.ZVP)}.`,
      KS: () => `${lnP(c.ks)} von ${lnE(u.ZVP)} = ${lnE(u.KS)}.`,
      VP: () => `${lnP(c.vp)} von ${lnE(u.ZVP)} = ${lnE(u.VP)}.`,
      LVP: () => `ZVP ÷ ${lnD(1 - c.kr / 100)} = ${lnE(u.ZVP)} ÷ ${lnD(1 - c.kr / 100)} = ${lnE(u.LVP)}.`,
      KR: () => `${lnP(c.kr)} von ${lnE(u.LVP)} = ${lnE(u.KR)}.`
    };
    return v[k]();
  }
  const r = {
    LVP: () => gegeben,
    KR: () => `${lnP(c.kr)} von ${lnE(u.LVP)} = ${lnE(u.KR)}.`,
    ZVP: () => `LVP − KR = ${lnE(u.LVP)} − ${lnE(u.KR)} = ${lnE(u.ZVP)}.`,
    KS: () => `${lnP(c.ks)} von ${lnE(u.ZVP)} = ${lnE(u.KS)}.`,
    VP: () => `${lnP(c.vp)} von ${lnE(u.ZVP)} = ${lnE(u.VP)}.`,
    BVP: () => `ZVP − KS${c.vp ? ' − VP' : ''} = ${lnE(u.ZVP)} − ${lnE(u.KS || 0)}${c.vp ? ' − ' + lnE(u.VP) : ''} = ${lnE(u.BVP)}.`,
    SKP: () => `BVP ÷ ${lnD(1 + c.g / 100)} = ${lnE(u.BVP)} ÷ ${lnD(1 + c.g / 100)} = ${lnE(u.SKP)}.`,
    G: () => `BVP − SKP = ${lnE(u.BVP)} − ${lnE(u.SKP)} = ${lnE(u.G)}.`,
    HK: () => `SKP − ${B} = ${lnE(u.SKP)} − ${lnE(u[B])} = ${lnE(u.HK)}.`,
    BZK: () => gegeben,
    BEP: () => c.bzk != null
      ? `BP − BZK = ${lnE(u.BP)} − ${lnE(u.BZK)} = ${lnE(u.BEP)}.`
      : `SKP ÷ ${lnD(1 + c.hk / 100)} = ${lnE(u.SKP)} ÷ ${lnD(1 + c.hk / 100)} = ${lnE(u.BEP)}.`,
    ZEP: () => `BEP ÷ ${lnD(1 - c.ls / 100)} = ${lnE(u.BEP)} ÷ ${lnD(1 - c.ls / 100)} = ${lnE(u.ZEP)}.`,
    LS: () => `ZEP − BEP = ${lnE(u.ZEP)} − ${lnE(u.BEP)} = ${lnE(u.LS)}.`,
    LEP: () => `ZEP ÷ ${lnD(1 - c.lr / 100)} = ${lnE(u.ZEP)} ÷ ${lnD(1 - c.lr / 100)} = ${lnE(u.LEP)}.`,
    LR: () => `LEP − ZEP = ${lnE(u.LEP)} − ${lnE(u.ZEP)} = ${lnE(u.LR)}.`,
    BP: () => `SKP ÷ ${lnD(1 + c.hk / 100)} = ${lnE(u.SKP)} ÷ ${lnD(1 + c.hk / 100)} = ${lnE(u.BP)}.`
  };
  return r[k]();
}
/* „Worauf bezieht sich der Prozentsatz?“ */
function lnWorauf(k, c, form) {
  const sk = (c.ks || 0) + (c.vp || 0);
  const t = {
    LEP: 'Der Listeneinkaufspreis ist 100 %.',
    LR: 'Auf den Listeneinkaufspreis (LEP). Er ist 100 %.',
    ZEP: `Der ZEP ist ${lnP(100 - (c.lr || 0))} des LEP. Für das Skonto wird er zum neuen Ausgangswert und ist selbst 100 %.`,
    LS: 'Auf den Zieleinkaufspreis (ZEP). Er ist 100 %.',
    BEP: `Der BEP ist ${lnP(100 - (c.ls || 0))} des ZEP.${c.bzk == null ? ' Danach ist er der Ausgangswert für die Handlungskosten (100 %).' : ''}`,
    BZK: 'Kein Prozentsatz: Die Bezugskosten sind ein fester Eurobetrag.',
    BP: 'Der Bezugspreis ist 100 %. Auf ihn rechnen sich die Handlungskosten.',
    HK: `Auf den ${c.bzk != null ? 'Bezugspreis (BP)' : 'Bareinkaufspreis (BEP)'}. Er ist 100 %.`,
    SKP: `Der SKP ist ${lnP(100 + (c.hk || 0))}. Für den Gewinn wird er zum neuen Ausgangswert (100 %).`,
    G: form === 'differenz' ? 'Keiner. Als Prozent bezieht sich der Gewinn später auf den SKP.' : 'Auf den Selbstkostenpreis (SKP). Er ist 100 %.',
    BVP: `${c.g != null ? 'Der BVP ist ' + lnP(100 + c.g) + ' des SKP. ' : ''}Für Skonto und Provision ist der ZVP 100 %, der BVP ist ${lnP(100 - sk)} davon.`,
    KS: 'Auf den Zielverkaufspreis (ZVP). Er ist 100 %.',
    VP: 'Auf den Zielverkaufspreis (ZVP). Er ist 100 %.',
    ZVP: `Der ZVP ist 100 % (Basis für Skonto und Provision) und zugleich ${lnP(100 - (c.kr || 0))} des LVP.`,
    KR: 'Auf den Listenverkaufspreis (LVP). Er ist 100 %.',
    LVP: 'Der Listenverkaufspreis ist 100 %. Auf ihn rechnet sich der Kundenrabatt.'
  };
  return t[k];
}

/* Beispiele: Eingaben je Form, daraus Schritte, Werte und Prozentspalten (mit den Funktionen der Aufgaben) */
function lnBuild(form, c, text) {
  const B = c.bzk != null ? 'BP' : 'BEP';
  let steps;
  if (form === 'vorwaerts') steps = [].concat(einkaufVor(c), hkVor(c, B), verkaufVor(c));
  else if (form === 'rueckwaerts')
    steps = [].concat(
      [['LVP', u => c.lvp]],
      verkaufRueck(c),
      [
        ['SKP', u => up(u('BVP'), -c.g)],
        ['G', u => r2(u('BVP') - u('SKP'))],
        [B, u => up(u('SKP'), -c.hk)],
        ['HK', u => r2(u('SKP') - u(B))]
      ],
      einkaufRueck(c)
    );
  else
    steps = [].concat(einkaufVor(c), hkVor(Object.assign({}, c, { g: null }), B), [['LVP', u => c.lvp]], verkaufRueck(c), [
      ['G', u => r2(u('BVP') - u('SKP'))]
    ]);
  const u = truth({ steps });
  const keys = ORDER.filter(k => u[k] != null);
  const pct = mkPct(c);
  return { form, c, u, keys, pct, text, steps };
}
const LN_BSP = {
  vorwaerts: [
    lnBuild('vorwaerts', { lep: 200, lr: 10, ls: 2, bzk: 12, hk: 25, g: 8, ks: 2, vp: 0, kr: 10 },
      'Die {{firma}} bezieht Motorenöl zu einem Listeneinkaufspreis von 200,00 €. Der Lieferant gewährt 10 % Liefererrabatt und 2 % Liefererskonto, die Bezugskosten betragen 12,00 €. Das Unternehmen rechnet mit 25 % Handlungskostenzuschlag und 8 % Gewinnzuschlag. Den Kunden werden 2 % Kundenskonto und 10 % Kundenrabatt gewährt. Gesucht ist der Listenverkaufspreis.'),
    lnBuild('vorwaerts', { lep: 450, lr: 10, ls: 3, bzk: 25, hk: 20, g: 8, ks: 2, vp: 5, kr: 5 },
      'Die {{firma}} bezieht Navigationsgeräte zu einem Listeneinkaufspreis von 450,00 €. Der Lieferant gewährt 10 % Liefererrabatt und 3 % Liefererskonto, die Bezugskosten betragen 25,00 €. Der Handlungskostenzuschlag beträgt 20 %, der Gewinnzuschlag 8 %. Den Kunden werden 2 % Kundenskonto, 5 % Vertreterprovision und 5 % Kundenrabatt gewährt. Gesucht ist der Listenverkaufspreis.')
  ],
  rueckwaerts: [
    lnBuild('rueckwaerts', { lvp: 2200, lr: 20, ls: 2, bzk: 28.8, hk: 20, g: 10, ks: 4, vp: 0, kr: 10 },
      'Die {{firma}} kann einen Artikel am Markt zu einem Listenverkaufspreis von 2.200,00 € durchsetzen. Sie rechnet mit 10 % Kundenrabatt, 4 % Kundenskonto, 10 % Gewinnzuschlag und 20 % Handlungskostenzuschlag. Der Lieferant gewährt 20 % Liefererrabatt und 2 % Liefererskonto, die Bezugskosten betragen 28,80 €. Gesucht ist der höchste Listeneinkaufspreis.'),
    lnBuild('rueckwaerts', { lvp: 1000, lr: 20, ls: 2, hk: 25, g: 8, ks: 2, vp: 5, kr: 10 },
      'Ein Artikel soll zu einem Listenverkaufspreis von 1.000,00 € verkauft werden. Es gelten 10 % Kundenrabatt, 2 % Kundenskonto und 5 % Vertreterprovision, der Gewinnzuschlag beträgt 8 % und der Handlungskostenzuschlag 25 %. Der Lieferant gewährt 20 % Liefererrabatt und 2 % Liefererskonto, Bezugskosten fallen nicht an. Gesucht ist der höchste Listeneinkaufspreis.')
  ],
  differenz: [
    lnBuild('differenz', { lep: 1200, lr: 10, ls: 2, hk: 45, ks: 2, kr: 12, lvp: 2000 },
      'Die {{firma}} bezieht Reifensätze zu einem Listeneinkaufspreis von 1.200,00 €. Der Lieferant gewährt 10 % Liefererrabatt und 2 % Liefererskonto, der Handlungskostenzuschlag beträgt 45 %. Der Listenverkaufspreis soll 2.000,00 € sein, bei 12 % Kundenrabatt und 2 % Kundenskonto. Gesucht ist der Gewinn in Euro.'),
    lnBuild('differenz', { lep: 250, lr: 20, ls: 3, bzk: 6, hk: 30, ks: 2, vp: 5, kr: 10, lvp: 340 },
      'Ein Artikel kostet im Einkauf 250,00 € (Listenpreis). Der Lieferant gewährt 20 % Liefererrabatt und 3 % Liefererskonto, die Bezugskosten betragen 6,00 €. Der Handlungskostenzuschlag beträgt 30 %. Der Listenverkaufspreis liegt bei 340,00 €, mit 10 % Kundenrabatt, 2 % Kundenskonto und 5 % Vertreterprovision. Gesucht ist der Gewinn in Euro.')
  ]
};
const LN_FORM = {
  vorwaerts: {
    name: 'Vorwärts',
    sub: 'Der Einkaufspreis ist bekannt, gesucht ist der Verkaufspreis.',
    wie: [
      'Von oben nach unten: Sie beginnen beim Listeneinkaufspreis (LEP).',
      'Zuschläge (+) zählen Sie dazu, Abzüge (−) ziehen Sie ab. Die Prozentsätze stehen in der Aufgabe.',
      'Am Ende steht der Listenverkaufspreis (LVP).'
    ]
  },
  rueckwaerts: {
    name: 'Rückwärts',
    sub: 'Der Verkaufspreis ist bekannt, gesucht ist der höchste Einkaufspreis.',
    wie: [
      'Von unten nach oben: Sie beginnen beim Listenverkaufspreis (LVP).',
      'Die Vorzeichen kehren sich um: Was vorwärts addiert wird, ziehen Sie jetzt ab, und umgekehrt.',
      'Am Ende steht der höchste Listeneinkaufspreis (LEP).'
    ]
  },
  differenz: {
    name: 'Differenz',
    sub: 'Der Einkauf und der Verkaufspreis sind bekannt, gesucht ist das, was dazwischen übrig bleibt.',
    wie: [
      'Von oben rechnen Sie vorwärts bis zum Selbstkostenpreis (SKP).',
      'Von unten rechnen Sie rückwärts bis zum Barverkaufspreis (BVP).',
      'Der Gewinn ist der Unterschied: <b>G = BVP − SKP</b>.'
    ]
  }
};

/* ---------- Zeilen und Tabellen ---------- */
function lnDirOf(form, k) {
  if (form === 'vorwaerts') return 'v';
  if (form === 'rueckwaerts') return 'r';
  return k === 'G' ? 'd' : ['KR', 'ZVP', 'KS', 'VP', 'BVP', 'LVP'].includes(k) ? 'r' : 'v';
}
function lnSign(form, k) {
  const s = SCH[k].sign;
  if (form === 'rueckwaerts') return s === '+' ? '−' : s === '-' ? '+' : '=';
  return s === '-' ? '−' : s;
}
const lnSg = s => `<span class="ln-sg ${s === '=' ? 'e' : s === '+' ? 'p' : 'm'}" aria-hidden="true">${s}</span>`;
function lnInfo(b, k) {
  const d = lnDirOf(b.form, k);
  return (
    `<b>Was ist das?</b>${esc(k === 'G' && b.form === 'differenz' ? 'Der Gewinn: das, was vom Verkaufspreis nach allen Kosten übrig bleibt.' : LN_WAS[k])}` +
    `<b>Wie entsteht der Wert?</b>${esc(lnWie(k, d, b.c, b.u))}` +
    `<b>Worauf bezieht sich der Prozentsatz?</b>${esc(lnWorauf(k, b.c, b.form))}`
  );
}
function lnRows(b) {
  const task = { pct: b.pct };
  return b.keys.map(k => {
    const pcs = placement(pctOf(task, k), 'basis');
    const d = lnDirOf(b.form, k);
    return {
      k,
      sign: lnSign(b.form, k),
      name: LN_NAME[k],
      sum: SCH[k].sign === '=',
      p1: pcs[0] != null ? fmtPct(pcs[0]) : '',
      p2: pcs[1] != null ? fmtPct(pcs[1]) : '',
      amt: fmt(b.u[k]),
      dir: b.form === 'differenz' ? (k === 'G' ? 'g' : d) : '',
      info: lnInfo(b, k)
    };
  });
}
const lnDirTxt = { v: '<span class="up">↓ von oben</span>', r: '<span class="dn">↑ von unten</span>', g: '<b>= BVP − SKP</b>' };
function lnVpZeile(b) {
  // Vertreterprovision gibt es nur in manchen Aufgaben. Kommt sie im Beispiel nicht vor, steht sie als Hinweis zwischen KS und ZVP.
  return !b.keys.includes('VP') && b.keys.includes('ZVP');
}
function lnTable(b, hover) {
  const rows = lnRows(b);
  const diff = b.form === 'differenz';
  let h = `<table class="ln-t"><thead><tr><th class="vz">VZ</th><th class="l">Bezeichnung</th><th class="l">Abk.</th><th>%</th><th>%</th><th>Betrag in €</th>${diff ? '<th class="l">Gerechnet</th>' : ''}</tr></thead><tbody>`;
  rows.forEach(r => {
    h += `<tr${hover ? ` tabindex="0" data-k="${r.k}"` : ''} class="${r.sum ? 'sum' : ''}${r.dir === 'g' ? ' hl' : ''}"><td class="vz">${lnSg(r.sign)}</td><td class="l">${r.name}</td><td class="ab">${r.k}</td><td>${r.p1}</td><td>${r.p2}</td><td class="am">${r.amt}</td>${diff ? `<td class="w">${lnDirTxt[r.dir]}</td>` : ''}</tr>`;
    if (r.k === 'KS' && lnVpZeile(b))
      h += `<tr class="opt"><td class="vz">${lnSg(lnSign(b.form, 'VP'))}</td><td class="l">Vertreterprovision <small>(nur angeben, wenn sie vorkommt)</small></td><td class="ab">VP</td><td></td><td></td><td></td>${diff ? '<td></td>' : ''}</tr>`;
  });
  return h + '</tbody></table>';
}
function lnCards(b) {
  const rows = lnRows(b);
  let h = '<div class="ln-cards">';
  rows.forEach(r => {
    const tag = b.form === 'differenz' ? `<small class="${r.dir === 'v' ? 'up' : r.dir === 'r' ? 'dn' : ''}">${r.dir === 'v' ? '↓ von oben gerechnet' : r.dir === 'r' ? '↑ von unten gerechnet' : '= BVP − SKP'}</small>` : '';
    const pc = [r.p1, r.p2].filter(Boolean).map(x => x + ' %').join(' | ');
    h += `<div class="ln-card${r.dir === 'g' ? ' hl' : ''}${lnState.card === b.form + r.k ? ' open' : ''}" data-ln-card="${b.form + r.k}"><button class="ln-ch" type="button" aria-expanded="${lnState.card === b.form + r.k}" data-ln="card" data-id="${b.form + r.k}">${lnSg(r.sign)}<span class="nm${r.sum ? ' b' : ''}">${r.name} (${r.k})${tag}${pc ? `<small class="pc">${pc}</small>` : ''}</span><span class="am">${r.amt}</span><span class="chev" aria-hidden="true"></span></button><div class="ln-ex">${r.info}</div></div>`;
    if (r.k === 'KS' && lnVpZeile(b))
      h += `<div class="ln-card opt"><div class="ln-ch static">${lnSg(lnSign(b.form, 'VP'))}<span class="nm">Vertreterprovision (VP)<small>nur angeben, wenn sie vorkommt</small></span></div></div>`;
  });
  return h + '</div>';
}
/* Rechenschritte eines Beispiels in Rechenreihenfolge */
function lnSteps(b) {
  const order = b.steps.map(s => s[0]).filter(k => b.keys.includes(k));
  const seen = {};
  let h = '<ol class="ln-steps">';
  order.forEach(k => {
    if (seen[k] || (k === 'LVP' && b.form === 'vorwaerts' && false)) return;
    seen[k] = 1;
    h += `<li><span class="no"></span><span><b>${LN_NAME[k]} (${k}):</b> ${esc(lnWie(k, lnDirOf(b.form, k), b.c, b.u))}</span></li>`;
  });
  return h + '</ol>';
}
function lnBspHtml(form) {
  const i = lnState.bsp[form];
  const b = LN_BSP[form][i];
  const open = !!lnState.bspOpen[form];
  const tabs = [0, 1].map(n => `<button type="button" class="ln-tab${n === i ? ' on' : ''}" data-ln="bsp" data-form="${form}" data-n="${n}">Beispiel ${n + 1}</button>`).join('');
  const ergebnis = form === 'vorwaerts' ? `Listenverkaufspreis ${lnE(b.u.LVP)}` : form === 'rueckwaerts' ? `höchster Listeneinkaufspreis ${lnE(b.u.LEP)}` : `Gewinn ${lnE(b.u.G)} (${lnP(Math.round(((b.u.G * 100) / b.u.SKP) * 100) / 100)} vom SKP)`;
  return `<div class="ln-box ln-bsp"><button type="button" class="ln-bh" aria-expanded="${open}" data-ln="bspopen" data-form="${form}">Beispiele<span class="chev"></span></button>${
    open
      ? `<div class="ln-bb"><div class="ln-tabs">${tabs}</div><p class="ln-task">${esc(b.text.replace('{{firma}}', FIRMA))}</p>${lnSteps(b)}<p class="ln-res">Ergebnis: <b>${ergebnis}</b></p><div class="ln-tw static">${lnTable(b, false)}</div></div>`
      : ''
  }</div>`;
}
function lnSchemaHtml(form) {
  const f = LN_FORM[form];
  const b = LN_BSP[form][0];
  const tabs = Object.keys(LN_FORM)
    .map(k => `<a class="ln-tab${k === form ? ' on' : ''}" href="${lnBase()}/schema/${k}" data-ln="go">${LN_FORM[k].name}</a>`)
    .join('');
  return (
    `<div class="ln-page">${backLink(lnBase(), 'Lernen')}<h1>Das Schema im Überblick</h1><p class="ln-sub">${f.sub}</p><div class="ln-tabs">${tabs}</div>` +
    `<div class="ln-box"><b>So gehen Sie vor:</b><ol>${f.wie.map(x => `<li>${x}</li>`).join('')}</ol></div>` +
    `<p class="ln-hint">Die Zahlen zeigen Beispiel 1. Fahren Sie mit der Maus über eine Zeile oder tippen Sie darauf, dann erscheint die Erklärung. Die Vertreterprovision (VP) geben Sie nur an, wenn sie in der Aufgabe vorkommt.</p>` +
    `<div class="ln-split"><div class="ln-tw">${lnTable(b, true)}</div><div class="ln-side"><div class="ln-bub" id="ln-bub" hidden></div></div></div>${lnCards(b)}` +
    `<div id="ln-bsp">${lnBspHtml(form)}</div>` +
    `<p class="ln-note">Die Prozentspalten arbeiten wie in den Übungen: Jede Rechenkette hat ihre eigene Spalte, der Ausgangswert steht oben mit 100.</p>` +
    `<p class="ln-fehler">${fehlerHinweisHtml()}</p></div>`
  );
}

/* ---------- Einführung ---------- */
function lnIntroHtml() {
  const cards = [
    ['1 Einkauf', 'Was zahlt der Händler wirklich?', 'Bezugspreis', 'Listenpreis minus Rabatt und Skonto, plus Lieferkosten.'],
    ['2 Kosten', 'Was kostet der Betrieb?', 'Selbstkostenpreis', 'Miete, Löhne und Strom werden auf die Ware verteilt.'],
    ['3 Gewinn', 'Was soll übrig bleiben?', 'Barverkaufspreis', 'Selbstkostenpreis plus Gewinn: Davon lebt der Händler.'],
    ['4 Kunde', 'Was sieht der Kunde?', 'Listenverkaufspreis', 'Der Preis enthält Skonto und Rabatt, die der Kunde abziehen darf.']
  ];
  return (
    `<div class="ln-page">${backLink(lnBase(), 'Lernen')}<h1>Worum geht es bei der Kalkulation?</h1><p class="ln-sub">Handelskalkulation · Lernen</p>` +
    `<div class="ln-box">Ein Händler kauft Ware ein und verkauft sie weiter. Er darf nicht einfach den Einkaufspreis verlangen. Aus dem Verkaufspreis muss er <b>alles bezahlen</b>, was nebenbei entsteht, und am Ende soll <b>etwas übrig bleiben</b>. Die Kalkulation rechnet aus, welcher Preis dafür nötig ist.</div>` +
    `<div class="ln-four">${cards.map(c => `<div class="ln-c4"><b class="n">${c[0]}</b><span>${c[1]}</span><strong>${c[2]}</strong><small>${c[3]}</small></div>`).join('')}</div>` +
    `<div class="ln-box"><b>Drei Richtungen:</b> Vorwärts (vom Einkauf zum Verkaufspreis), Rückwärts (vom Marktpreis zum höchsten Einkaufspreis), Differenz (wie viel bleibt übrig?).</div>` +
    `<div class="ln-row"><a class="ln-btn" href="${lnBase()}/schema/vorwaerts">Weiter: Schema →</a></div><p class="ln-fehler">${fehlerHinweisHtml()}</p></div>`
  );
}

/* ---------- Kennzahlen ---------- */
const lnV1 = LN_BSP.vorwaerts[0], lnR1 = LN_BSP.rueckwaerts[0], lnD1 = LN_BSP.differenz[0], lnD2 = LN_BSP.differenz[1];
const lnPdfLinks = `<a href="${LN_PDF.hell}" target="_blank" rel="noopener">Formelblatt als PDF</a>`;
const LN_KZ = [
  {
    slug: 'durchschnittliche-handelsspanne', name: 'Durchschnittliche Handelsspanne', kind: 'dp', an: 'WV', bn: 'WE', basen: 'Warenverkauf (WV)',
    was: 'Sie zeigt, wie viel Prozent des Warenverkaufs nach Abzug des Wareneinsatzes beim Händler bleiben. Sie wird nicht für einen einzelnen Artikel gerechnet, sondern für mehrere Artikel oder einen ganzen Zeitraum.',
    formel: ['(WV − WE) × 100', 'WV'],
    nutzen: 'Sie zeigt, wie viel vom Umsatz übrig bleibt, um Handlungskosten zu decken und Gewinn zu erzielen. Damit lassen sich Zeiträume oder Warengruppen vergleichen.',
    merke: 'Im Nenner steht der Warenverkauf, nicht der Wareneinsatz. Das Ergebnis liegt immer unter 100 %.',
    deut: r => `Von 100 € Warenverkauf bleiben ${fmtPct(r)} € nach Abzug des Wareneinsatzes.`,
    ex: [
      { intro: 'Ein Unternehmen hat im Geschäftsjahr einen Warenverkauf (WV) von 512.400,00 € und einen Wareneinsatz (WE) von 359.700,00 €.', A: 512400, B: 359700, base: 512400 },
      (() => {
        const we = Math.round(4200 * 38.5 * 100) / 100, wv = Math.round(4200 * 52.9 * 100) / 100;
        return { intro: `Es wurden 4.200 Stück verkauft. Der Bezugspreis je Stück war 38,50 €, der Verkaufspreis 52,90 €. Zuerst rechnen Sie Wareneinsatz und Warenverkauf aus: WE = 4.200 × 38,50 € = ${lnE(we)}, WV = 4.200 × 52,90 € = ${lnE(wv)}.`, A: wv, B: we, base: wv };
      })()
    ]
  },
  {
    slug: 'gewinn-in-prozent', name: 'Gewinn in Prozent', kind: 'dp', an: 'BVP', bn: 'SKP', basen: 'Selbstkostenpreis (SKP)',
    was: 'Sie zeigt, wie viel Prozent der Selbstkosten als Gewinn übrig bleiben. Der Gewinn wird hier erst aus zwei Preisen ermittelt: Gewinn = Barverkaufspreis − Selbstkostenpreis.',
    formel: ['(BVP − SKP) × 100', 'SKP'],
    nutzen: 'Damit prüfen Sie, ob sich ein Verkaufspreis lohnt. Es ist dieselbe Rechnung wie beim Gewinnzuschlag, nur mit Preisen statt mit dem Gewinn in Euro.',
    merke: 'Grundwert ist der Selbstkostenpreis, nicht der Verkaufspreis.',
    deut: r => `Auf 100 € Selbstkosten kommen ${fmtPct(r)} € Gewinn.`,
    ex: [
      { intro: `Aus dem Schema (Differenz, Beispiel 1): Der Barverkaufspreis (BVP) ist ${lnE(lnD1.u.BVP)} und der Selbstkostenpreis (SKP) ist ${lnE(lnD1.u.SKP)}.`, A: lnD1.u.BVP, B: lnD1.u.SKP, base: lnD1.u.SKP },
      { intro: `Aus dem Schema (Differenz, Beispiel 2): Der Barverkaufspreis (BVP) ist ${lnE(lnD2.u.BVP)} und der Selbstkostenpreis (SKP) ist ${lnE(lnD2.u.SKP)}.`, A: lnD2.u.BVP, B: lnD2.u.SKP, base: lnD2.u.SKP }
    ]
  },
  {
    slug: 'gewinnzuschlag', name: 'Gewinnzuschlag', kind: 'pc', zn: 'G', basen: 'Selbstkostenpreis (SKP)',
    was: 'Er zeigt, wie viel Prozent Gewinn der Händler auf die Selbstkosten aufschlägt. Der Gewinn (G) ist dabei der Betrag in Euro.',
    formel: ['G × 100', 'SKP'],
    nutzen: 'Mit dem Gewinnzuschlag rechnen Sie in der Vorwärtskalkulation vom Selbstkostenpreis zum Barverkaufspreis: SKP + G = BVP.',
    merke: 'Aus der Kostenrechnung gerechnet nimmt man den Gewinn geteilt durch die Selbstkosten der Periode.',
    deut: r => `Auf 100 € Selbstkosten schlägt der Händler ${fmtPct(r)} € Gewinn auf.`,
    ex: [
      { intro: `Aus dem Schema (Vorwärts, Beispiel 1): Der Gewinn (G) ist ${lnE(lnV1.u.G)} und der Selbstkostenpreis (SKP) ist ${lnE(lnV1.u.SKP)}.`, Z: lnV1.u.G, base: lnV1.u.SKP },
      { intro: 'Aus der Kostenrechnung: Der Gewinn der Periode beträgt 46.900,00 € und die Selbstkosten (SKS) betragen 308.000,00 €.', Z: 46900, base: 308000, basen: 'Selbstkosten (SKS)', zlab: 'Gewinn' }
    ]
  },
  {
    slug: 'handelsspanne', name: 'Handelsspanne', kind: 'dp', an: 'LVP', bn: 'BP', basen: 'Listenverkaufspreis (LVP)',
    was: 'Sie zeigt, wie viel Prozent des Verkaufspreises (netto) der Händler über dem Bezugspreis verlangt. Sie ist also der Rohgewinn, bezogen auf den Verkaufspreis.',
    formel: ['(LVP − BP) × 100', 'LVP'],
    nutzen: 'Sie zeigt, wie viel vom Verkaufspreis nach Abzug des Bezugspreises beim Händler bleibt. Die Handelsspanne ist immer kleiner als der Kalkulationszuschlag.',
    merke: 'Im Unterschied zum Kalkulationszuschlag ist der Grundwert der Verkaufspreis (LVP), nicht der Bezugspreis.',
    deut: r => `Von jedem Euro Verkaufspreis bleiben etwa ${Math.round(r)} Cent nach Abzug des Bezugspreises beim Händler.`,
    ex: [
      { intro: `Aus dem Schema (Vorwärts, Beispiel 1): Der Bezugspreis (BP) ist ${lnE(lnV1.u.BP)} und der Listenverkaufspreis (LVP) ist ${lnE(lnV1.u.LVP)}.`, A: lnV1.u.LVP, B: lnV1.u.BP, base: lnV1.u.LVP },
      { intro: `Aus dem Schema (Rückwärts, Beispiel 1): Der Bezugspreis (BP) ist ${lnE(lnR1.u.BP)} und der Listenverkaufspreis (LVP) ist ${lnE(lnR1.u.LVP)}.`, A: lnR1.u.LVP, B: lnR1.u.BP, base: lnR1.u.LVP }
    ]
  },
  {
    slug: 'handlungskostenzuschlag', name: 'Handlungskostenzuschlag', kind: 'pc', zn: 'HK', basen: 'Bezugspreis (BP)',
    was: 'Er zeigt, wie viel Prozent der Betrieb für Miete, Löhne, Strom und andere Kosten auf den Bezugspreis aufschlägt. Die Handlungskosten (HK) sind dabei der Betrag in Euro.',
    formel: ['HK × 100', 'BP'],
    nutzen: 'Mit dem Handlungskostenzuschlag rechnen Sie vom Bezugspreis zum Selbstkostenpreis: BP + HK = SKP.',
    merke: 'In der Kalkulation ist der Grundwert der Bezugspreis. Aus der Kostenrechnung rechnet man die Handlungskosten geteilt durch den Wareneinsatz.',
    deut: (r, e) => `Auf 100 € ${e.basen && /Wareneinsatz/.test(e.basen) ? 'Wareneinsatz' : 'Bezugspreis'} kommen ${fmtPct(r)} € Handlungskosten.`,
    ex: [
      { intro: `Aus dem Schema (Vorwärts, Beispiel 1): Der Bezugspreis (BP) ist ${lnE(lnV1.u.BP)} und die Handlungskosten (HK) sind ${lnE(lnV1.u.HK)}.`, Z: lnV1.u.HK, base: lnV1.u.BP },
      { intro: 'Aus der Kostenrechnung: Die Handlungskosten (HK) betragen 81.450,00 € und der Wareneinsatz (WE) beträgt 184.500,00 €.', Z: 81450, base: 184500, basen: 'Wareneinsatz (WE)', zlab: 'HK' }
    ]
  },
  {
    slug: 'kalkulationsfaktor', name: 'Kalkulationsfaktor', kind: 'rt',
    was: 'Er sagt, mit welcher Zahl Sie den Bezugspreis multiplizieren, um den Listenverkaufspreis zu bekommen. Er ist der Kalkulationszuschlag ohne Prozent: 1 + Zuschlag ÷ 100.',
    formel: ['LVP', 'BP'],
    nutzen: 'Mit dem Faktor rechnen Sie in einem Schritt vom Bezugspreis zum Listenverkaufspreis: BP × Faktor = LVP. Das lohnt sich, wenn viele Artikel gleich kalkuliert werden.',
    merke: 'Der Faktor ist keine Prozentzahl und hat deshalb kein × 100. Er wird mit vier Nachkommastellen angegeben.',
    deut: r => `Der Bezugspreis wird mit ${lnD(r, 4)} multipliziert, um den Listenverkaufspreis zu erhalten.`,
    ex: [
      { intro: `Aus dem Schema (Vorwärts, Beispiel 1): Der Bezugspreis (BP) ist ${lnE(lnV1.u.BP)} und der Listenverkaufspreis (LVP) ist ${lnE(lnV1.u.LVP)}.`, A: lnV1.u.LVP, B: lnV1.u.BP },
      { intro: `Aus dem Schema (Rückwärts, Beispiel 1): Der Bezugspreis (BP) ist ${lnE(lnR1.u.BP)} und der Listenverkaufspreis (LVP) ist ${lnE(lnR1.u.LVP)}.`, A: lnR1.u.LVP, B: lnR1.u.BP }
    ]
  },
  {
    slug: 'kalkulationszuschlag', name: 'Kalkulationszuschlag', kind: 'dp', an: 'LVP', bn: 'BP', basen: 'Bezugspreis (BP)',
    was: 'Er zeigt, um wie viel Prozent der Verkaufspreis über dem Bezugspreis liegt. Er sagt also, wie stark der Händler den Preis aufschlägt.',
    formel: ['(LVP − BP) × 100', 'BP'],
    nutzen: 'Er fasst Handlungskosten, Gewinn, Skonto, Rabatt und Provision in einem Satz zusammen. Damit kommen Sie schnell vom Bezugspreis zum Verkaufspreis und können Angebote vergleichen.',
    merke: 'Grundwert ist immer der Bezugspreis. Der Faktor ist dasselbe ohne Prozent: LVP ÷ BP.',
    deut: r => `Auf jeden Euro Bezugspreis schlägt der Händler etwa ${Math.round(r)} Cent auf.`,
    ex: [
      { intro: `Aus dem Schema (Vorwärts, Beispiel 1): Der Bezugspreis (BP) ist ${lnE(lnV1.u.BP)} und der Listenverkaufspreis (LVP) ist ${lnE(lnV1.u.LVP)}.`, A: lnV1.u.LVP, B: lnV1.u.BP, base: lnV1.u.BP },
      { intro: `Aus dem Schema (Rückwärts, Beispiel 1): Der Bezugspreis (BP) ist ${lnE(lnR1.u.BP)} und der Listenverkaufspreis (LVP) ist ${lnE(lnR1.u.LVP)}.`, A: lnR1.u.LVP, B: lnR1.u.BP, base: lnR1.u.BP }
    ]
  }
];
const lnFmtNum = v => lnD(v, 2);
/* Schritte, Probe und Ergebnis einer Kennzahl-Rechnung (gleiche Rundung wie die Seite: Ergebnis 2 Stellen, Faktor 4 Stellen) */
function lnKzRechnung(k, e) {
  const rd = (x, n) => Math.round((x + Number.EPSILON) * Math.pow(10, n)) / Math.pow(10, n);
  const basen = e.basen || k.basen;
  if (k.kind === 'dp') {
    const d = rd(e.A - e.B, 2), z = rd(d * 100, 2), res = rd(z / e.base, 2);
    const back = rd((e.base * res) / 100, 2);
    return {
      res,
      steps: [
        [`Unterschied in Euro:`, `${k.an} − ${k.bn} = ${lnE(e.A)} − ${lnE(e.B)} = ${lnE(d)}`, 'Das ist der Betrag, der im Zähler steht.'],
        ['Mal 100:', `${lnE(d)} × 100 = ${lnFmtNum(z)}`, 'So wird das Ergebnis ein Prozentwert.'],
        ['Teilen durch den Grundwert:', `${lnFmtNum(z)} ÷ ${lnE(e.base)} = ${lnD(res)} %`, `Grundwert: ${basen}. Er ist 100 %.`]
      ],
      probe: `${lnP(res)} von ${lnE(e.base)} sind ${lnE(back)}. ${Math.abs(back - d) <= 0.011 ? `Das entspricht dem Unterschied aus Schritt 1 (${lnE(d)}), also stimmt es.` : `Das entspricht dem Unterschied aus Schritt 1 (${lnE(d)}) bis auf Rundung.`}`,
      unit: ' %'
    };
  }
  if (k.kind === 'pc') {
    const z = rd(e.Z * 100, 2), res = rd(z / e.base, 2);
    const back = rd((e.base * res) / 100, 2);
    const zl = e.zlab || k.zn;
    return {
      res,
      steps: [
        ['Mal 100:', `${zl} × 100 = ${lnE(e.Z)} × 100 = ${lnFmtNum(z)}`, 'So wird das Ergebnis ein Prozentwert.'],
        ['Teilen durch den Grundwert:', `${lnFmtNum(z)} ÷ ${lnE(e.base)} = ${lnD(res)} %`, `Grundwert: ${basen}. Er ist 100 %.`]
      ],
      probe: `${lnP(res)} von ${lnE(e.base)} sind ${lnE(back)}. ${Math.abs(back - e.Z) <= 0.011 ? `Das entspricht dem Betrag aus der Aufgabe (${lnE(e.Z)}), also stimmt es.` : `Das entspricht dem Betrag aus der Aufgabe (${lnE(e.Z)}) bis auf Rundung.`}`
    };
  }
  const res = rd(e.A / e.B, 4);
  return {
    res,
    steps: [['Teilen:', `LVP ÷ BP = ${lnE(e.A)} ÷ ${lnE(e.B)} = ${lnD(res, 4)}`, 'Der Bezugspreis ist der Grundwert, ein × 100 gibt es hier nicht.']],
    probe: `${lnE(e.B)} × ${lnD(res, 4)} = ${lnE(rd(e.B * res, 2))}. Das ergibt (gerundet) den Listenverkaufspreis ${lnE(e.A)}, also stimmt es.`
  };
}
function lnKzBody(k) {
  const n = lnState.kzBsp[k.slug] || 0;
  const e = k.ex[n];
  const r = lnKzRechnung(k, e);
  const tabs = [0, 1].map(i => `<button type="button" class="ln-tab${i === n ? ' on' : ''}" data-ln="kzb" data-slug="${k.slug}" data-n="${i}">Beispiel ${i + 1}</button>`).join('');
  const unit = k.kind === 'rt' ? '' : ' in %';
  return (
    `<div class="ln-l">Was ist das?</div><p>${k.was}</p>` +
    `<div class="ln-l">Formel</div><div class="ln-fm"><b>${k.name}</b> = <span class="fr"><span class="n">${k.formel[0]}</span><span class="d">${k.formel[1]}</span></span><span>${unit.trim()}</span></div>` +
    `<div class="ln-l">Beispiele</div><div class="ln-tabs">${tabs}</div><p>${e.intro}</p>` +
    `<ol class="ln-steps">${r.steps.map((s, i) => `<li><span class="no"></span><span><b>${s[0]}</b> ${i === r.steps.length - 1 ? s[1].replace(/= ([^=]+)$/, '= <span class="res">$1</span>') : s[1]}<small>${s[2]}</small></span></li>`).join('')}</ol>` +
    `<div class="ln-l">Probe</div><p>${r.probe}</p><div class="ln-l">Was heißt das?</div><p>${k.deut(r.res, e)}</p>` +
    `<div class="ln-l">Wofür nutzt man es?</div><p>${k.nutzen}</p><div class="ln-l">Merke</div><p>${k.merke}</p>` +
    `<div class="ln-row"><a class="ln-btn" href="${HKU}/kennzahlen/${KZ_AREAS.find(a => a.name === k.name).id}">Jetzt üben →</a>${lnPdfLinks}</div>`
  );
}
function lnKennzahlenHtml(open) {
  const items = LN_KZ.map(k => {
    const o = k.slug === open;
    return `<div class="ln-acc${o ? ' open' : ''}"><a class="ln-ah" href="${lnBase()}/kennzahlen${o ? '' : '/' + k.slug}" data-ln="go" aria-expanded="${o}"><span>${k.name}</span><span class="chev"></span></a>${o ? `<div class="ln-ab" id="ln-kzb">${lnKzBody(k)}</div>` : ''}</div>`;
  }).join('');
  return (
    `<div class="ln-page">${backLink(lnBase(), 'Lernen')}<h1>Kennzahlen</h1><p class="ln-sub">Sieben Kennzahlen von A bis Z. Tippen Sie eine an, dann sehen Sie die Erklärung.</p>` +
    `<div class="ln-box ln-pdf"><b>Alle Formeln als PDF</b><div class="ln-pdfr"><span>Hell (weiß, zum Ansehen, Drucken und Speichern)</span><a href="${LN_PDF.hell}" target="_blank" rel="noopener">Ansehen oder drucken</a><a href="${LN_PDF.hell}" download>Speichern</a></div><div class="ln-pdfr"><span>Dunkel (schwarz, zum Ansehen und Speichern)</span><a href="${LN_PDF.dunkel}" target="_blank" rel="noopener">Ansehen</a><a href="${LN_PDF.dunkel}" download>Speichern</a></div></div>` +
    `<div class="ln-accs">${items}</div><p class="ln-fehler">${fehlerHinweisHtml()}</p></div>`
  );
}

/* ---------- Seiten und Ereignisse ---------- */
function showLernen(parts) {
  // parts: ksk / handelskalkulation / lernen / [einfuehrung | schema/<form> | kennzahlen/<slug>]
  const sec = parts[3];
  let html, titel = 'Lernen';
  if (!sec) {
    showMenu(
      `${backLink(HKB, 'Handelskalkulation')}<div class="wm-box">${wordmark()}</div><h2>Lernen</h2><div class="tiles">${tileHtml({ href: lnBase() + '/einfuehrung', icon: 'bulb', label: 'Einführung' })}${tileHtml({ href: lnBase() + '/schema/vorwaerts', icon: 'layers', label: 'Schema' })}${tileHtml({ href: lnBase() + '/kennzahlen', icon: 'pct', label: 'Kennzahlen' })}</div><p class="hinweis">${fehlerHinweisHtml()}</p>`,
      true
    );
    document.title = 'LernIgel – Lernen';
    return;
  }
  if (sec === 'einfuehrung') {
    html = lnIntroHtml();
    titel = 'Einführung';
  } else if (sec === 'schema') {
    const f = LN_FORM[parts[4]] ? parts[4] : 'vorwaerts';
    lnState.form = f;
    html = lnSchemaHtml(f);
    titel = 'Schema ' + LN_FORM[f].name;
  } else if (sec === 'kennzahlen') {
    const k = LN_KZ.find(x => x.slug === parts[4]);
    lnState.kz = k ? k.slug : '';
    html = lnKennzahlenHtml(lnState.kz);
    titel = 'Kennzahlen' + (k ? ' ' + k.name : '');
  } else {
    location.replace(lnBase());
    return;
  }
  showMenu(html, true);
  const m = $('menu');
  m.classList.add('lernen');
  const ig = m.querySelector('.igel-menu');
  if (ig) ig.remove();
  document.title = 'LernIgel – Lernen: ' + titel;
}
function lnGo(href) {
  history.replaceState(null, '', href);
  route();
}
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-ln]');
  if (!t) {
    const row = ev.target.closest('.ln-t tr[data-k]');
    if (row) lnShowBub(row, true);
    return;
  }
  const a = t.dataset.ln;
  if (a === 'go') {
    ev.preventDefault();
    lnGo(t.getAttribute('href'));
  } else if (a === 'card') {
    lnState.card = lnState.card === t.dataset.id ? '' : t.dataset.id;
    const form = LN_FORM[lnState.form] ? lnState.form : 'vorwaerts';
    $('menu').querySelectorAll('.ln-card[data-ln-card]').forEach(c => {
      const o = c.dataset.lnCard === lnState.card;
      c.classList.toggle('open', o);
      c.querySelector('.ln-ch').setAttribute('aria-expanded', o);
    });
  } else if (a === 'bspopen') {
    lnState.bspOpen[t.dataset.form] = !lnState.bspOpen[t.dataset.form];
    $('ln-bsp').innerHTML = lnBspHtml(t.dataset.form);
  } else if (a === 'bsp') {
    lnState.bsp[t.dataset.form] = +t.dataset.n;
    $('ln-bsp').innerHTML = lnBspHtml(t.dataset.form);
  } else if (a === 'kzb') {
    lnState.kzBsp[t.dataset.slug] = +t.dataset.n;
    $('ln-kzb').innerHTML = lnKzBody(LN_KZ.find(k => k.slug === t.dataset.slug));
  }
});
function lnShowBub(row, pin) {
  const bub = $('ln-bub');
  if (!bub) return;
  const form = lnState.form;
  const b = LN_BSP[form][0];
  bub.innerHTML = lnInfo(b, row.dataset.k);
  bub.hidden = false;
  const side = bub.parentNode,
    split = side.parentNode;
  const top = row.getBoundingClientRect().top - split.getBoundingClientRect().top;
  const max = Math.max(0, split.offsetHeight - bub.offsetHeight);
  bub.style.top = Math.min(Math.max(0, top - 20), max) + 'px';
  split.querySelectorAll('tr.on').forEach(x => x.classList.remove('on'));
  row.classList.add('on');
}
document.addEventListener('mouseover', ev => {
  const row = ev.target.closest && ev.target.closest('.ln-t tr[data-k]');
  if (row) lnShowBub(row);
});
document.addEventListener('focusin', ev => {
  const row = ev.target.closest && ev.target.closest('.ln-t tr[data-k]');
  if (row) lnShowBub(row);
});
