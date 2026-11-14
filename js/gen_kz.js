/* =====================================================================
   Kennzahlen: 7 Untermenüs mit je 10 festen Aufgaben (+ Zufall je Untermenü).
   Wird von gen.js über defineKz() aufgerufen, bevor die festen Aufgaben erzeugt werden.
   ===================================================================== */
const KZ_AREAS = [
  { id: 'kz_zuschlag', kz: 'zuschlag', name: 'Kalkulationszuschlag' },
  { id: 'kz_faktor', kz: 'faktor', name: 'Kalkulationsfaktor' },
  { id: 'kz_spanne', kz: 'spanne', name: 'Handelsspanne' },
  { id: 'kz_gewinn', kz: 'gewinn', name: 'Gewinn in Prozent' },
  { id: 'kz_hkz', kz: 'hkz', name: 'Handlungskostenzuschlag' },
  { id: 'kz_gwz', kz: 'gwz', name: 'Gewinnzuschlag' },
  { id: 'kz_gvs', kz: 'spannegv', name: 'Durchschnittliche Handelsspanne' }
];

function defineKz() {
  KZ_AREAS.forEach(a => { GEN[a.id] = []; });
  const kzTask = o => Object.assign({ noTable: true, from: 'BP', to: 'BVP', dirOf: () => 'g' }, o);
  const ASK = { zuschlag: 'den Kalkulationszuschlag', faktor: 'den Kalkulationsfaktor', spanne: 'die Handelsspanne', hkz: 'den Handlungskostenzuschlag', gwz: 'den Gewinnzuschlag', gewinn: 'den Gewinn', spannegv: 'die durchschnittliche Handelsspanne' };
  const ask = id => `${ASK[id]}${KZ[id].unit ? ' in Prozent' : ''}`;
  const kzPart = (id, label) => ({ label: label || '', title: KZ[id].title, kz: [id] });
  const QK = 'Ermitteln Sie auf der Grundlage Ihres Ergebnisses aus a) ';
  const preOf = c => {
    const p = [];
    if (c.pausch != null) p.push(`Bezugskosten je ${sg(c)}: ${eur(c.pausch)} ÷ ${c.n} = ${eur(c.bzk)}`);
    if (c.packN) p.push(`Listeneinkaufspreis je Stück: ${eur(c.lepPack)} ÷ ${c.packN} = ${eur(c.lep)}`);
    return p;
  };
  const einkaufText = (c, extra) => [tEinkauf(c), tRabatt(c), tBzk(c)].join(' ') + (extra ? ' ' + extra : '') + tPackHinweis(c);
  const DIRD = k => k === 'G' ? 'd' : ['KR', 'ZVP', 'KS', 'VP', 'BVP'].includes(k) ? 'r' : 'v';
  const dateTab = c => pick(c.r, ['BB', 'KS', 'NZ', 'TR', 'WL']) + between(c.r, 1000, 9999, 1);
  const nf = n => n.toLocaleString('de-DE');
  const dat = w => /(e|er|el)$/.test(w) ? w + 'n' : w;
  const badG = steps => { const t = truth({ steps }); const q = t.G / t.SKP; return !(q >= 0.03 && q <= 0.35); };
  const rnd = (x, st) => Math.round(x / st) * st;

  // Aufgaben, die früher erst eine Schema-Tabelle verlangten, sind jetzt reine Kennzahl-Aufgaben:
  // die dafür nötigen Werte stehen direkt im Text (Bereich Kennzahlen = nur Kennzahlen)
  const CONVT = ['Aus der Kalkulation eines Artikels', 'Aus einer Kalkulationsliste', 'Aus dem Kalkulationsblatt', 'Aus den Ergebnissen der Preisberechnung', 'Aus der Kalkulationsübersicht', 'Aus dem Preisblatt der Abteilung', 'Aus der Kalkulationsrechnung', 'Aus dem Kalkulationsprotokoll'];
  const LBL = { BP: 'Bezugspreis', LVP: 'Listenverkaufspreis', SKP: 'Selbstkostenpreis', BVP: 'Barverkaufspreis', ZVP: 'Zielverkaufspreis', HK: 'Handlungskosten', G: 'Gewinn' };
  const pure = (t, c) => {
    normTask(t); const id = t.kz[0]; const d = KZ[id]; const tr = truth(t); const base = t.kzBase || 'LVP'; const ks = new Set();
    const rec = k => { ks.add(k); return tr[k]; }; d.num(rec, base); d.den(rec, base);
    const keys = ORDER.filter(k => ks.has(k));
    c.packN = 0; c.pausch = null;
    const asked = ask(id); let text, tabelle;
    if (c.r() < 0.5) {
      const list = keys.map(k => `${LBL[k]} ${eur(tr[k])}`); const lst = list.length > 1 ? list.slice(0, -1).join(', ') + ' und ' + list[list.length - 1] : list[0];
      text = `Die Kalkulation der ${FIRMA} für ${c.ware} hat folgende Werte je ${sg(c)} ergeben: ${lst}.\n\nBerechnen Sie ${asked}.`;
    } else {
      text = `Die ${FIRMA} hat für einen Artikel folgende Kalkulationswerte erfasst:{{tabelle}}Berechnen Sie ${asked} für ${c.ware}.`;
      tabelle = { head: ['Art.-Nr.'].concat(keys.map(k => LBL[k] + ' je ' + sg(c))), rows: [[dateTab(c)].concat(keys.map(k => eur(tr[k])))] };
    }
    const o = kzTask({ kzBase: base, text, parts: [kzPart(id)], steps: keys.map(k => [k, u => tr[k]]), bad: t.bad });
    if (tabelle) o.tabelle = tabelle;
    return o;
  };
  const convN = {};
  const add = (area, title, opt, fn) => {
    if (/table: true|diffTask|hkAus|gzAus/.test(String(fn))) {
      const n = convN[area] = (convN[area] || 0) + 1; const inner = fn;
      GEN[area].push({ title: CONVT[n - 1] || ('Aus der Kalkulation ' + n), opt, fn: c => pure(inner(c), c) });
    } else GEN[area].push({ title, opt, fn });
  };

  /* ---------- A: Kalkulationszuschlag, Kalkulationsfaktor, Handelsspanne (gleiche 10 Aufgabensituationen) ---------- */
  const ZFS = (area, id) => {
    add(area, 'Aus Bezugs- und Listenverkaufspreis', { kzF: 2 }, c => kzTask({ kzBase: 'LVP',
      text: `Für ${c.ware} beträgt der Bezugspreis ${eur(c.bp)} je ${sg(c)} und der Listenverkaufspreis ${eur(c.lvp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask(id)}.`,
      parts: [kzPart(id)], steps: [['BP', u => c.bp], ['LVP', u => c.lvp]] }));
    if (id === 'spanne') {
      add(area, 'Aus Bezugs- und Zielverkaufspreis', { kzF: 2 }, c => kzTask({ kzBase: 'ZVP',
        text: `Die ${FIRMA} bezieht ${c.ware} zu einem Bezugspreis von ${eur(c.bp)} je ${sg(c)} und verkauft sie zu einem Zielverkaufspreis von ${eur(c.lvp)} je ${sg(c)}.\n\nBerechnen Sie ${ask(id)}.`,
        parts: [kzPart(id)], steps: [['BP', u => c.bp], ['ZVP', u => c.lvp]] }));
      add(area, 'Aus Bezugs- und Barverkaufspreis', { kzF: 2 }, c => { const v = half(c.bp * (1.2 + c.r() * 0.5));
        return kzTask({ kzBase: 'BVP',
          text: `Der Bezugspreis für ${c.ware} beträgt ${eur(c.bp)} je ${sg(c)}. Der Barverkaufspreis liegt bei ${eur(v)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask(id)}.`,
          parts: [kzPart(id)], steps: [['BP', u => c.bp], ['BVP', u => v]] }); });
    } else {
      add(area, 'Aus der Preisliste', { kzF: 2 }, c => kzTask({ kzBase: 'LVP',
        text: `Die ${FIRMA} hat für einen Artikel die Preisdaten aus ihrer Preisliste ausgelesen:{{tabelle}}Berechnen Sie ${ask(id)} für ${c.ware}.`,
        tabelle: { head: ['Art.-Nr.', 'Bezugs\u00ADpreis je ' + sg(c), 'Listenverkaufs\u00ADpreis je ' + sg(c)], rows: [[c.art, eur(c.bp), eur(c.lvp)]] },
        parts: [kzPart(id)], steps: [['BP', u => c.bp], ['LVP', u => c.lvp]] }));
      add(area, 'Nach einer Preiserhöhung des Lieferanten', { kzF: 2 }, c => { const nb = half(c.bp * (1.05 + c.r() * 0.15)); if (nb === c.bp) c.bp -= 0.5;
        return kzTask({ kzBase: 'LVP',
          text: `Der Lieferant erhöht den Bezugspreis für ${c.ware} von ${eur(c.bp)} auf ${eur(nb)} je ${sg(c)}. Der Listenverkaufspreis der ${FIRMA} bleibt unverändert bei ${eur(c.lvp)} je ${sg(c)}.\n\nBerechnen Sie ${ask(id)} nach der Preiserhöhung.`,
          parts: [kzPart(id)], steps: [['BP', u => nb], ['LVP', u => c.lvp]] }); });
    }
    add(area, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 2 }, c => { const v = half(c.bp * (1.2 + c.r() * 0.5));
      return kzTask({ kzBase: 'BVP', text: `Die ${FIRMA} hat für das erste Quartal die Daten eines Artikels aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask(id)} für ${c.ware}.`,
        tabelle: { head: ['Art.-Nr.', 'Bezugs­preis je Stück', 'Barverkaufs­preis je Stück', 'Menge eingekauft', 'Menge verkauft'], rows: [[c.art, eur(c.bp), eur(v), String(c.mEin), String(c.mVerk)]] },
        parts: [kzPart(id)], steps: [['BP', u => c.bp], ['BVP', u => v]] }); });
    add(area, 'Aus Gesamtwerten einer Lieferung', { kzF: 2 }, c => { const n = pick(c.r, [40, 60, 80, 120, 150, 200]); const X = Math.round(c.bp * n * 100) / 100, Y = Math.round(c.lvp * n * 100) / 100;
      return kzTask({ kzBase: 'LVP',
        text: `Die ${FIRMA} hat in diesem Monat ${nf(n)} ${pl(c)} ${c.ware} eingekauft. Der Bezugspreis betrug insgesamt ${eur(X)}. Verkauft wurden alle ${nf(n)} ${pl(c)} zu Listenverkaufspreisen von insgesamt ${eur(Y)}.\n\nBerechnen Sie ${ask(id)}.`,
        parts: [kzPart(id)], steps: [['BP', u => X], ['LVP', u => Y]] }); });
    add(area, 'Bezugspreis je Stück aus dem Karton', { kzF: 2 }, c => { c.eh = EINH.stk; const n = pick(c.r, [10, 12, 20, 24, 25, 50]); const X = Math.round(c.bp * n * 100) / 100;
      return kzTask({ kzBase: 'LVP',
        text: `Die ${FIRMA} bezieht ${c.ware} in Kartons zu ${n} Stück. Der Bezugspreis je Karton beträgt ${eur(X)}. Der Listenverkaufspreis beträgt ${eur(c.lvp)} je Stück.\n\nBerechnen Sie ${ask(id)}. Rechnen Sie zuerst den Bezugspreis je Stück aus.`,
        vr: [{ label: 'Bezugspreis je Stück', hint: 'Preis je Karton ÷ Stückzahl', value: c.bp }],
        parts: [kzPart(id)], steps: [['BP', u => c.bp], ['LVP', u => c.lvp]] }); });
    add(area, 'Erst Bezugspreis, dann Kennzahl', {}, c => { const e = einkaufVor(c); const bp = truth({ steps: e }).BP; c.lvp = half(bp * (1.4 + c.r() * 0.8));
      return vorTask(c, { from: 'LEP', to: 'BP', given: ['LVP'], pre: preOf(c),
        text: einkaufText(c) + ` Der Listenverkaufspreis beträgt ${eur(c.lvp)} je ${sg(c)}.\n\na) ` + Q + 'den Bezugspreis je ' + sg(c) + `.\n\nb) ${QK}${ask(id)}.`,
        parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart(id, 'b)')], steps: [].concat(e, [['LVP', u => c.lvp]]) }); });
    add(area, 'Erst Bezugspreis mit Pauschale, dann Kennzahl', { pausch: true }, c => { const e = einkaufVor(c); const bp = truth({ steps: e }).BP; c.lvp = half(bp * (1.4 + c.r() * 0.8));
      return vorTask(c, { from: 'LEP', to: 'BP', given: ['LVP'], pre: preOf(c),
        text: einkaufText(c) + ` Der Listenverkaufspreis beträgt ${eur(c.lvp)} je ${sg(c)}.\n\na) ` + Q + 'den Bezugspreis je ' + sg(c) + `.\n\nb) ${QK}${ask(id)}.`,
        parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart(id, 'b)')], steps: [].concat(e, [['LVP', u => c.lvp]]) }); });
    add(area, 'Erst Listenverkaufspreis, dann Kennzahl', {}, c => vorTask(c, { from: 'LEP', to: 'LVP', pre: preOf(c),
      text: einkaufText(c) + '\n\n' + tHkG(c) + ' ' + tVerk(c) + '\n\na) ' + Q + 'den Listenverkaufspreis (netto) je ' + sg(c) + `.\n\nb) ${QK}${ask(id)}.`,
      parts: [{ label: 'a)', title: 'Listenverkaufspreis', table: true }, kzPart(id, 'b)')], steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }));
    add(area, 'Rückwärts bis zum Bezugspreis, dann Kennzahl', { mkLvp: true }, c => rueckTask(c, { from: 'BP', to: 'LVP', given: ['LVP'],
      text: `Die ${FIRMA} möchte ${c.ware} in ihr Sortiment aufnehmen. ` + lvpGiven(c) + '\n\n' + tVerkMarkt(c) + ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %.\n\na) ` + Q + 'den höchstens zulässigen Bezugspreis je ' + sg(c) + `.\n\nb) ${QK}${ask(id)}.`,
      parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart(id, 'b)')], steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c)) }));
  };
  ZFS('kz_zuschlag', 'zuschlag'); ZFS('kz_faktor', 'faktor'); ZFS('kz_spanne', 'spanne');

  /* ---------- Differenz-Aufgabe: Einkauf vorwärts bis SKP, Verkauf rückwärts ab LVP, Gewinn als Differenz ---------- */
  const diffTask = (c, id, o) => { o = o || {}; c.kr = c.kr || 10;
    const base = truth({ steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c)) }); c.lvp = Math.round(base.LVP / 10) * 10;
    const steps = [].concat(einkaufVor(c), hkVor(Object.assign({}, c, { g: null }), 'BP'), [['LVP', u => c.lvp]], verkaufRueck(c), [['G', u => r2(u('BVP') - u('SKP'))]]);
    return { from: 'LEP', to: 'LVP', kzBase: 'LVP', given: ['LVP'], dirOf: DIRD, pre: preOf(c), bad: badG(steps),
      text: [tEinkauf(c), tRabatt(c), tBzk(c), tHk(c)].join(' ') + tPackHinweis(c) + `\n\nFür ${c.ware} soll ein Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} angesetzt werden. ` + tVerk(c) + '\n\na) ' + Q + 'den Gewinn in Euro je ' + sg(c) + `.\n\nb) ${QK}${ask(id)}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart(id, 'b)')],
      steps }; };

  /* ---------- B: Gewinn in Prozent ---------- */
  const GW = 'kz_gewinn';
  add(GW, 'Aus Selbstkosten- und Barverkaufspreis', { kzF: 3 }, c => kzTask({ text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}, der Barverkaufspreis ${eur(c.bvp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask('gewinn')}.`,
    parts: [kzPart('gewinn')], steps: [['SKP', u => c.skp], ['BVP', u => c.bvp]] }));
  add(GW, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 3 }, c => { const m1 = between(c.r, 20, 200, 10), m2 = m1 - between(c.r, 2, 15, 1);
    return kzTask({ text: `Die ${FIRMA} hat für das erste Quartal die Daten eines Artikels aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask('gewinn')} für ${c.ware}.`,
      tabelle: { head: ['Art.-Nr.', 'Selbstkosten­preis je Stück', 'Barverkaufs­preis je Stück', 'Menge eingekauft', 'Menge verkauft'], rows: [[dateTab(c), eur(c.skp), eur(c.bvp), String(m1), String(m2)]] },
      parts: [kzPart('gewinn')], steps: [['SKP', u => c.skp], ['BVP', u => c.bvp]] }); });
  add(GW, 'Aus Gesamtwerten einer Periode', { kzF: 3 }, c => { const n = pick(c.r, [40, 60, 80, 120, 150, 200]); const X = Math.round(c.skp * n * 100) / 100, Y = Math.round(c.bvp * n * 100) / 100;
    return kzTask({ text: `Die ${FIRMA} hat im letzten Monat ${nf(n)} ${pl(c)} ${c.ware} verkauft. Die Selbstkosten dafür betrugen insgesamt ${eur(X)}, die Barverkaufserlöse insgesamt ${eur(Y)}.\n\nBerechnen Sie ${ask('gewinn')}.`,
      parts: [kzPart('gewinn')], steps: [['SKP', u => X], ['BVP', u => Y]] }); });
  add(GW, 'Gewinn aus Einkauf und Listenverkaufspreis', {}, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn mit Bezugskostenpauschale', { pausch: true }, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn ohne Vertreterprovision', { noVp: true }, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn bei Einkauf im Karton', { pack: true, noVp: true }, c => diffTask(c, 'gewinn'));
  add(GW, 'Gewinn ab dem Bezugspreis', {}, c => { const bp = Math.round(c.lep * (1 - c.lr / 100) * 100) / 100; c.bp = bp; const d = Object.assign({}, c, { lr: null, ls: null, bzk: null });
    const base = truth({ steps: [].concat([['BP', u => bp]], hkVor(c, 'BP'), verkaufVor(c)) }); c.lvp = Math.round(base.LVP / 10) * 10;
    const stp = [].concat([['BP', u => bp]], hkVor(Object.assign({}, c, { g: null }), 'BP'), [['LVP', u => c.lvp]], verkaufRueck(c), [['G', u => r2(u('BVP') - u('SKP'))]]);
    return { from: 'BP', to: 'LVP', kzBase: 'LVP', given: ['BP', 'LVP'], ctx: d, dirOf: DIRD, bad: badG(stp),
      text: `Die ${FIRMA} bezieht ${c.ware} von der ${where(c)} zu einem Bezugspreis von ${eur(bp)} je ${sg(c)}. ` + tHk(c) + `\n\nFür ${c.ware} soll ein Listenverkaufspreis von ${eur(c.lvp)} je ${sg(c)} angesetzt werden. ` + tVerk(c) + '\n\na) ' + Q + 'den Gewinn in Euro je ' + sg(c) + `.\n\nb) ${QK}${ask('gewinn')}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart('gewinn', 'b)')],
      steps: stp }; });
  add(GW, 'Gewinn bei Verkauf zum Zielverkaufspreis', { mkZvp: true, noVp: true }, c => { c.kr = 0;
    const stp = [].concat(einkaufVor(c), hkVor(Object.assign({}, c, { g: null }), 'BP'), [['ZVP', u => c.zvp]], zvpRueck(c), [['G', u => r2(u('BVP') - u('SKP'))]]);
    return { from: 'LEP', to: 'ZVP', kzBase: 'LVP', given: ['ZVP'], dirOf: DIRD, pre: preOf(c), bad: badG(stp),
      text: einkaufText(c) + ' ' + tHk(c) + `\n\nFür ${c.ware} soll ein Zielverkaufspreis von ${eur(c.zvp)} je ${sg(c)} angesetzt werden. Den Kunden werden ${c.ks} % Kundenskonto eingeräumt.\n\na) ` + Q + 'den Gewinn in Euro je ' + sg(c) + `.\n\nb) ${QK}${ask('gewinn')}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart('gewinn', 'b)')],
      steps: stp }; });
  add(GW, 'Gewinn bei bekanntem Barverkaufspreis', { mkBvp: true, noVp: true }, c => { c.kr = 0; c.ks = 0;
    const stp = [].concat(einkaufVor(c), hkVor(Object.assign({}, c, { g: null }), 'BP'), [['BVP', u => c.bvp]], [['G', u => r2(u('BVP') - u('SKP'))]]);
    return { from: 'LEP', to: 'BVP', kzBase: 'LVP', given: ['BVP'], dirOf: DIRD, pre: preOf(c), bad: badG(stp),
      text: einkaufText(c) + ' ' + tHk(c) + `\n\nFür ${c.ware} soll ein Barverkaufspreis von ${eur(c.bvp)} je ${sg(c)} angesetzt werden.\n\na) ` + Q + 'den Gewinn in Euro je ' + sg(c) + `.\n\nb) ${QK}${ask('gewinn')}.`,
      parts: [{ label: 'a)', title: 'Gewinn in Euro', table: true }, kzPart('gewinn', 'b)')],
      steps: stp }; });

  /* ---------- C: Handlungskostenzuschlag ---------- */
  const HK = 'kz_hkz';
  add(HK, 'Aus Bezugspreis und Handlungskosten', { kzF: 1 }, c => { const hk = Math.round(c.bp * c.hk) / 100;
    return kzTask({ text: `Die ${FIRMA} bezieht ${c.ware} zu einem Bezugspreis von ${eur(c.bp)} je ${sg(c)}. Die Handlungskosten betragen ${eur(hk)} je ${sg(c)}.\n\nBerechnen Sie ${ask('hkz')}.`,
      parts: [kzPart('hkz')], steps: [['BP', u => c.bp], ['HK', u => hk]] }); });
  add(HK, 'Aus der Kostenrechnung', {}, c => { const we = between(c.r, 150000, 900000, 5000), hk = rnd(we * (0.2 + c.r() * 0.3), 10);
    return kzTask({ text: `Die Kostenrechnung eines Handelsbetriebs liefert folgende Zahlen:{{tabelle}}Ermitteln Sie ${ask('hkz')}.`,
      tabelle: { head: ['Position', 'Betrag'], rows: [['Wareneinsatz', eur(we)], ['Summe der Handlungskosten', eur(hk)]] },
      parts: [kzPart('hkz')], steps: [['BP', u => we], ['HK', u => hk]] }); });
  add(HK, 'Aus mehreren Handlungskostenarten', {}, c => { const we = between(c.r, 300000, 900000, 5000);
    const a = rnd(we * (0.10 + c.r() * 0.05), 10), b = rnd(we * (0.04 + c.r() * 0.03), 10), d = rnd(we * (0.02 + c.r() * 0.02), 10), e = rnd(we * (0.01 + c.r() * 0.02), 10);
    return kzTask({ text: `Die Kostenrechnung der ${FIRMA} weist für das Geschäftsjahr aus:{{tabelle}}Berechnen Sie ${ask('hkz')}.`,
      tabelle: { head: ['Position', 'Betrag'], rows: [['Wareneinsatz', eur(we)], ['Personalkosten', eur(a)], ['Mieten und Nebenkosten', eur(b)], ['Werbung', eur(d)], ['Sonstige Verwaltungskosten', eur(e)]] },
      parts: [kzPart('hkz')], steps: [['BP', u => we], ['HK', u => a + b + d + e]] }); });
  add(HK, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 1 }, c => { const hk = Math.round(c.bp * c.hk) / 100;
    return kzTask({ text: `Die ${FIRMA} hat für einen Artikel die Daten aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask('hkz')} für ${c.ware}.`,
      tabelle: { head: ['Art.-Nr.', 'Bezugs­preis je Stück', 'Handlungs­kosten je Stück', 'Menge eingekauft'], rows: [[dateTab(c), eur(c.bp), eur(hk), String(between(c.r, 20, 200, 10))]] },
      parts: [kzPart('hkz')], steps: [['BP', u => c.bp], ['HK', u => hk]] }); });
  add(HK, 'Aus Bezugspreis und Selbstkostenpreis', { kzF: 1 }, c => kzTask({ text: `Für ${c.ware} beträgt der Bezugspreis ${eur(c.bp)} je ${sg(c)} und der Selbstkostenpreis ${eur(c.skp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask('hkz')}.`,
    parts: [kzPart('hkz')], steps: [['BP', u => c.bp], ['SKP', u => c.skp], ['HK', u => r2(u('SKP') - u('BP'))]] }));
  const hkAus = (c) => { const e = einkaufVor(c); const bp = truth({ steps: e }).BP; c.skp = Math.round(bp * (1.15 + c.r() * 0.3) * 100) / 100;
    return vorTask(c, { from: 'LEP', to: 'BP', given: ['SKP'], pre: preOf(c),
      text: einkaufText(c, `Der Selbstkostenpreis beträgt ${eur(c.skp)} je ${sg(c)}.`) + `\n\na) ` + Q + 'den Bezugspreis je ' + sg(c) + `.\n\nb) ${QK}${ask('hkz')}.`,
      parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart('hkz', 'b)')], steps: [].concat(e, [['SKP', u => c.skp], ['HK', u => r2(u('SKP') - u('BP'))]]) }); };
  add(HK, 'Erst Bezugspreis, dann Handlungskostenzuschlag', {}, hkAus);
  add(HK, 'Erst Bezugspreis mit Pauschale, dann Zuschlag', { pausch: true }, hkAus);
  add(HK, 'Erst Bezugspreis aus dem Karton, dann Zuschlag', { pack: true }, hkAus);
  add(HK, 'Aus dem Gewinn- und Verlustkonto', {}, c => { const we = between(c.r, 1200000, 3600000, 50000), wv = Math.round(we * (1.35 + c.r() * 0.3) / 10000) * 10000;
    const p = (a, b) => rnd(we * (a + c.r() * (b - a)), 1000);
    const g = p(.10, .16), s = p(.02, .04), m = p(.02, .05), w = p(.01, .03), ab = p(.02, .05);
    const saldo = wv - we - g - s - m - w - ab;
    return kzTask({ text: `Die Buchhaltung der {{firma}} hat zum Jahresende das unten abgebildete Gewinn- und Verlustkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('hkz')}. Zu den Handlungskosten zählen alle Aufwendungen außer dem Wareneingang.`,
      konto: { title: 'Gewinn- und Verlustkonto (930) der {{firma}}', soll: [['301 Wareneingang', we], ['402 Gehälter', g], ['404 Sozialabgaben', s], ['420 Mieten', m], ['480 Werbung', w], ['491 Abschreibungen', ab], ['Saldo', saldo]], haben: [['801 Warenverkauf', wv]] },
      parts: [kzPart('hkz')], steps: [['BP', u => we], ['HK', u => g + s + m + w + ab]], bad: saldo < 20000 }); });
  add(HK, 'Aus den Quartalswerten', {}, c => { const mo = ['Januar', 'Februar', 'März']; const we = [0, 1, 2].map(() => between(c.r, 60000, 140000, 1000)); const hk = we.map(x => rnd(x * (0.2 + c.r() * 0.25), 10));
    return kzTask({ text: `Die Kostenrechnung der ${FIRMA} weist für das erste Quartal folgende Werte aus:{{tabelle}}Berechnen Sie ${ask('hkz')} für das gesamte Quartal.`,
      tabelle: { head: ['Monat', 'Wareneinsatz', 'Handlungskosten'], rows: mo.map((m, i) => [m, eur(we[i]), eur(hk[i])]) },
      parts: [kzPart('hkz')], steps: [['BP', u => we[0] + we[1] + we[2]], ['HK', u => hk[0] + hk[1] + hk[2]]] }); });

  /* ---------- D: Gewinnzuschlag ---------- */
  const GZ = 'kz_gwz';
  add(GZ, 'Aus Selbstkostenpreis und Gewinn', { kzF: 1 }, c => { const g = Math.round(c.skp * c.g) / 100;
    return kzTask({ text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}. Die ${FIRMA} rechnet mit einem Gewinn von ${eur(g)} je ${sg(c)}.\n\nBerechnen Sie ${ask('gwz')}.`,
      parts: [kzPart('gwz')], steps: [['SKP', u => c.skp], ['G', u => g]] }); });
  add(GZ, 'Aus Selbstkostenpreis und Barverkaufspreis', { kzF: 3 }, c => kzTask({ text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}, der Barverkaufspreis ${eur(c.bvp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask('gwz')}.`,
    parts: [kzPart('gwz')], steps: [['SKP', u => c.skp], ['BVP', u => c.bvp], ['G', u => r2(u('BVP') - u('SKP'))]] }));
  add(GZ, 'Aus dem Jahresergebnis', { kzF: 1 }, c => { const n = pick(c.r, [400, 600, 800, 1200, 1500, 2000]); const g = Math.round(c.skp * c.g) / 100; const X = Math.round(c.skp * n * 100) / 100, G = Math.round(g * n * 100) / 100;
    return kzTask({ text: `Die ${FIRMA} hat im Geschäftsjahr ${nf(n)} ${pl(c)} ${c.ware} verkauft. Die Selbstkosten betrugen insgesamt ${eur(X)}, der erzielte Gewinn insgesamt ${eur(G)}.\n\nBerechnen Sie ${ask('gwz')}.`,
      parts: [kzPart('gwz')], steps: [['SKP', u => X], ['G', u => G]] }); });
  add(GZ, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 1 }, c => { const g = Math.round(c.skp * c.g) / 100;
    return kzTask({ text: `Die ${FIRMA} hat für einen Artikel die Daten aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask('gwz')} für ${c.ware}.`,
      tabelle: { head: ['Art.-Nr.', 'Selbstkosten­preis je Stück', 'Gewinn je Stück', 'Menge verkauft'], rows: [[dateTab(c), eur(c.skp), eur(g), String(between(c.r, 20, 200, 10))]] },
      parts: [kzPart('gwz')], steps: [['SKP', u => c.skp], ['G', u => g]] }); });
  const gzAus = c => { const e = [].concat(einkaufVor(c), hkVor(Object.assign({}, c, { g: null }), 'BP')); const skp = truth({ steps: e }).SKP; const g = Math.round(skp * c.g) / 100;
    return vorTask(c, { from: 'LEP', to: 'SKP', given: ['G'], pre: preOf(c),
      text: einkaufText(c, tHk(c) + ` Die ${FIRMA} rechnet mit einem Gewinn von ${eur(g)} je ${sg(c)}.`) + `\n\na) ` + Q + 'den Selbstkostenpreis je ' + sg(c) + `.\n\nb) ${QK}${ask('gwz')}.`,
      parts: [{ label: 'a)', title: 'Selbstkostenpreis', table: true }, kzPart('gwz', 'b)')], steps: [].concat(e, [['G', u => g]]) }); };
  add(GZ, 'Erst Selbstkostenpreis, dann Gewinnzuschlag', {}, gzAus);
  add(GZ, 'Erst Selbstkostenpreis mit Pauschale', { pausch: true }, gzAus);
  add(GZ, 'Erst Selbstkostenpreis aus dem Karton', { pack: true }, gzAus);
  add(GZ, 'Gewinnzuschlag aus Einkauf und Listenverkaufspreis', {}, c => diffTask(c, 'gwz'));
  add(GZ, 'Gewinnzuschlag ohne Vertreterprovision', { noVp: true }, c => diffTask(c, 'gwz'));
  add(GZ, 'Gewinn je Stück aus dem Gesamtgewinn', { kzF: 1 }, c => { const n = pick(c.r, [20, 40, 50, 80, 100, 200]); const g = Math.round(c.skp * c.g) / 100; const G = Math.round(g * n * 100) / 100;
    return kzTask({ text: `Der Selbstkostenpreis für ${c.ware} beträgt ${eur(c.skp)} je ${sg(c)}. Beim Verkauf von ${nf(n)} ${dat(pl(c))} erzielt die ${FIRMA} einen Gesamtgewinn von ${eur(G)}.\n\nBerechnen Sie ${ask('gwz')}. Rechnen Sie zuerst den Gewinn je ${sg(c)} aus.`,
      vr: [{ label: 'Gewinn je ' + sg(c), hint: 'Gesamtgewinn ÷ Menge', value: g }],
      parts: [kzPart('gwz')], steps: [['SKP', u => c.skp], ['G', u => g]] }); });

  /* ---------- E: Durchschnittliche Handelsspanne ---------- */
  const GS = 'kz_gvs';
  const wePair = c => { const we = between(c.r, 1200000, 4200000, 50000), wv = Math.round(we * (1.25 + Math.floor(c.r() * 9) * 0.05) / 10000) * 10000; return [we, wv]; };
  const gvTask = (o) => kzTask(Object.assign({ parts: [kzPart('spannegv')] }, o));
  add(GS, 'Aus dem Gewinn- und Verlustkonto', { konto: true }, c => { const r = c.r;
    const we = between(r, 1200000, 4200000, 50000), wv = Math.round(we * (1.25 + Math.floor(r() * 9) * 0.05) / 10000) * 10000;
    const part = (a, b) => Math.round(wv * (a + r() * (b - a)) / 1000) * 1000;
    const soll = [['301 Wareneingang', we], ['402 Gehälter', part(.10, .16)], ['404 Sozialabgaben', part(.02, .04)], ['430 Energie und Betriebsstoffe', part(.005, .015)], ['481 Bürobedarf', part(.005, .02)], ['491 Abschreibungen', part(.02, .05)]];
    const saldo = wv - soll.reduce((a, x) => a + x[1], 0); soll.push(['Saldo', saldo]);
    return gvTask({ text: `Die Buchhaltung der {{firma}} hat zum Jahresende das unten abgebildete Gewinn- und Verlustkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('spannegv')}.`,
      konto: { title: 'Gewinn- und Verlustkonto (930) der {{firma}}', soll, haben: [['801 Warenverkauf', wv]] }, steps: [['WV', u => wv], ['WE', u => we]], bad: saldo < 20000 }); });
  add(GS, 'Aus Wareneinsatz und Warenverkauf', {}, c => { const [we, wv] = wePair(c);
    return gvTask({ text: `Die ${FIRMA} hat im Geschäftsjahr einen Wareneinsatz von ${eur(we)} und Umsatzerlöse aus dem Warenverkauf von ${eur(wv)}.\n\nBerechnen Sie ${ask('spannegv')}.`, steps: [['WV', u => wv], ['WE', u => we]] }); });
  add(GS, 'Aus dem Warenkonto', { konto: true }, c => { const [we, wv] = wePair(c); const ab = rnd(we * (0.08 + c.r() * 0.06), 10000), sb = rnd(we * (0.08 + c.r() * 0.06), 10000); const zug = we + sb - ab; const rohg = wv - we;
    return gvTask({ text: `Die {{firma}} hat zum Jahresende das Warenkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('spannegv')}. Den Wareneinsatz müssen Sie aus Anfangsbestand, Zugängen und Schlussbestand ermitteln.`,
      konto: { title: 'Warenkonto der {{firma}}', soll: [['Anfangsbestand', ab], ['Wareneingang', zug], ['Saldo (Rohgewinn)', rohg]], haben: [['Schlussbestand', sb], ['Warenverkauf', wv]] },
      steps: [['WV', u => wv], ['WE', u => we]], bad: rohg < 20000 || we < 100000 }); });
  add(GS, 'Aus Anfangsbestand, Zugängen und Schlussbestand', {}, c => { const [we, wv] = wePair(c); const ab = rnd(we * (0.08 + c.r() * 0.06), 10000), sb = rnd(we * (0.08 + c.r() * 0.06), 10000); const zug = we + sb - ab;
    return gvTask({ text: `Die ${FIRMA} hat zu Beginn des Jahres einen Warenbestand von ${eur(ab)}. Im Jahr wurden Waren für ${eur(zug)} eingekauft. Der Warenbestand am Jahresende beträgt ${eur(sb)}. Die Umsatzerlöse aus dem Warenverkauf betragen ${eur(wv)}.\n\nBerechnen Sie ${ask('spannegv')}.`,
      steps: [['WV', u => wv], ['WE', u => we]] }); });
  add(GS, 'Aus den Quartalswerten', {}, c => { const q = ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal']; const we = q.map(() => between(c.r, 200000, 800000, 10000)); const wv = we.map(x => Math.round(x * (1.25 + c.r() * 0.4) / 1000) * 1000);
    return gvTask({ text: `Die ${FIRMA} hat folgende Quartalswerte ermittelt:{{tabelle}}Berechnen Sie ${ask('spannegv')} für das gesamte Jahr.`,
      tabelle: { head: ['Quartal', 'Wareneinsatz', 'Warenverkauf'], rows: q.map((x, i) => [x, eur(we[i]), eur(wv[i])]) },
      steps: [['WV', u => wv[0] + wv[1] + wv[2] + wv[3]], ['WE', u => we[0] + we[1] + we[2] + we[3]]] }); });
  add(GS, 'Aus zwei Sortimentsbereichen', {}, c => { const a = wePair(c), b = wePair(c); const sp = pick(c.r, [['Sportbekleidung', 'Sportgeräte'], ['Haushaltswaren', 'Elektrogeräte'], ['Büromaterial', 'Bürotechnik'], ['Gartenbedarf', 'Gartengeräte']]);
    return gvTask({ text: `Die ${FIRMA} führt zwei Sortimentsbereiche:{{tabelle}}Berechnen Sie ${ask('spannegv')} für das gesamte Sortiment.`,
      tabelle: { head: ['Bereich', 'Wareneinsatz', 'Warenverkauf'], rows: [[sp[0], eur(a[0]), eur(a[1])], [sp[1], eur(b[0]), eur(b[1])]] },
      steps: [['WV', u => a[1] + b[1]], ['WE', u => a[0] + b[0]]] }); });
  add(GS, 'Aus Menge und Preisen', {}, c => { const n = between(c.r, 4000, 30000, 500), bp = between(c.r, 8, 60, 0.5), vp = Math.round(bp * (1.3 + c.r() * 0.5) * 2) / 2;
    return gvTask({ text: `Die ${FIRMA} hat im Geschäftsjahr ${n.toLocaleString('de-DE')} Stück eines Artikels verkauft. Der durchschnittliche Bezugspreis betrug ${eur(bp)} je Stück, der durchschnittliche Verkaufspreis ${eur(vp)} je Stück.\n\nBerechnen Sie ${ask('spannegv')}. Rechnen Sie zuerst Wareneinsatz und Warenverkauf aus.`,
      vr: [{ label: 'Wareneinsatz', hint: 'Menge × Bezugspreis', value: Math.round(n * bp * 100) / 100 }, { label: 'Warenverkauf', hint: 'Menge × Verkaufspreis', value: Math.round(n * vp * 100) / 100 }],
      steps: [['WV', u => Math.round(n * vp * 100) / 100], ['WE', u => Math.round(n * bp * 100) / 100]] }); });
  add(GS, 'Mit Rücksendungen und Preisnachlässen', {}, c => { const [we, wv] = wePair(c); const rs = rnd(wv * (0.01 + c.r() * 0.02), 1000), nl = rnd(wv * (0.005 + c.r() * 0.015), 1000); const br = wv + rs + nl;
    return gvTask({ text: `Die ${FIRMA} hat im Geschäftsjahr Warenverkäufe von ${eur(br)} gebucht. Davon wurden Waren im Wert von ${eur(rs)} zurückgesendet, und es wurden Preisnachlässe von ${eur(nl)} gewährt. Der Wareneinsatz beträgt ${eur(we)}.\n\nBerechnen Sie ${ask('spannegv')} auf der Grundlage der tatsächlich erzielten Verkaufserlöse.`,
      steps: [['WV', u => br - rs - nl], ['WE', u => we]] }); });
  add(GS, 'Aus dem Gewinn- und Verlustkonto mit Zinsen', { konto: true }, c => { const r = c.r;
    const we = between(r, 1200000, 4200000, 50000), wv = Math.round(we * (1.25 + Math.floor(r() * 9) * 0.05) / 10000) * 10000;
    const part = (a, b) => Math.round(wv * (a + r() * (b - a)) / 1000) * 1000;
    const soll = [['301 Wareneingang', we], ['402 Gehälter', part(.10, .16)], ['420 Mieten', part(.02, .05)], ['491 Abschreibungen', part(.02, .05)], ['751 Zinsaufwendungen', part(.005, .015)]];
    const zin = part(.002, .008); const saldo = wv + zin - soll.reduce((a, x) => a + x[1], 0); soll.push(['Saldo', saldo]);
    return gvTask({ text: `Die Buchhaltung der {{firma}} hat zum Jahresende das unten abgebildete Gewinn- und Verlustkonto abgeschlossen.{{konto}}Berechnen Sie daraus ${ask('spannegv')}. Zinserträge gehören nicht zum Warenverkauf.`,
      konto: { title: 'Gewinn- und Verlustkonto (930) der {{firma}}', soll, haben: [['801 Warenverkauf', wv], ['771 Zinserträge', zin]] }, steps: [['WV', u => wv], ['WE', u => we]], bad: saldo < 20000 }); });
  add(GS, 'Aus Vorjahr und Berichtsjahr', {}, c => { const a = wePair(c), b = wePair(c);
    return gvTask({ text: `Die ${FIRMA} vergleicht zwei Geschäftsjahre:{{tabelle}}Berechnen Sie ${ask('spannegv')} für das aktuelle Geschäftsjahr.`,
      tabelle: { head: ['Geschäftsjahr', 'Wareneinsatz', 'Warenverkauf'], rows: [['Vorjahr', eur(a[0]), eur(a[1])], ['Aktuelles Jahr', eur(b[0]), eur(b[1])]] },
      steps: [['WV', u => b[1]], ['WE', u => b[0]]] }); });
}
