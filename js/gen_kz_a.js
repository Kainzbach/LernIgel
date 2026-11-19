/* =====================================================================
   Kennzahlen – A: Kalkulationszuschlag, Kalkulationsfaktor, Handelsspanne (je dieselben 10 Aufgabensituationen)
   Wird von defineKz() (gen_kz.js) aufgerufen; H enthält die gemeinsamen Hilfsfunktionen.
   ===================================================================== */
KZ_SEC.push(function (H) {
  const { kzTask, ask, kzPart, QK, preOf, einkaufText, nf, add } = H;
  const ZFS = (area, id) => {
    add(area, 'Aus Bezugs- und Listenverkaufspreis', { kzF: 2 }, c =>
      kzTask({
        kzBase: 'LVP',
        text: `Für ${c.ware} beträgt der Bezugspreis ${eur(c.bp)} je ${sg(c)} und der Listenverkaufspreis ${eur(c.lvp)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask(id)}.`,
        parts: [kzPart(id)],
        steps: [
          ['BP', u => c.bp],
          ['LVP', u => c.lvp]
        ]
      })
    );
    if (id === 'spanne') {
      add(area, 'Aus Bezugs- und Zielverkaufspreis', { kzF: 2 }, c =>
        kzTask({
          kzBase: 'ZVP',
          text: `Die ${FIRMA} bezieht ${c.ware} zu einem Bezugspreis von ${eur(c.bp)} je ${sg(c)} und verkauft sie zu einem Zielverkaufspreis von ${eur(c.lvp)} je ${sg(c)}.\n\nBerechnen Sie ${ask(id)}.`,
          parts: [kzPart(id)],
          steps: [
            ['BP', u => c.bp],
            ['ZVP', u => c.lvp]
          ]
        })
      );
      add(area, 'Aus Bezugs- und Barverkaufspreis', { kzF: 2 }, c => {
        const v = half(c.bp * (1.2 + c.r() * 0.5));
        return kzTask({
          kzBase: 'BVP',
          text: `Der Bezugspreis für ${c.ware} beträgt ${eur(c.bp)} je ${sg(c)}. Der Barverkaufspreis liegt bei ${eur(v)} je ${sg(c)} (${FIRMA}).\n\nBerechnen Sie ${ask(id)}.`,
          parts: [kzPart(id)],
          steps: [
            ['BP', u => c.bp],
            ['BVP', u => v]
          ]
        });
      });
    } else {
      add(area, 'Aus der Preisliste', { kzF: 2 }, c =>
        kzTask({
          kzBase: 'LVP',
          text: `Die ${FIRMA} hat für einen Artikel die Preisdaten aus ihrer Preisliste ausgelesen:{{tabelle}}Berechnen Sie ${ask(id)} für ${c.ware}.`,
          tabelle: {
            head: ['Art.-Nr.', 'Bezugs\u00ADpreis je ' + sg(c), 'Listenverkaufs\u00ADpreis je ' + sg(c)],
            rows: [[c.art, eur(c.bp), eur(c.lvp)]]
          },
          parts: [kzPart(id)],
          steps: [
            ['BP', u => c.bp],
            ['LVP', u => c.lvp]
          ]
        })
      );
      add(area, 'Nach einer Preiserhöhung des Lieferanten', { kzF: 2 }, c => {
        const nb = half(c.bp * (1.05 + c.r() * 0.15));
        if (nb === c.bp) c.bp -= 0.5;
        return kzTask({
          kzBase: 'LVP',
          text: `Der Lieferant erhöht den Bezugspreis für ${c.ware} von ${eur(c.bp)} auf ${eur(nb)} je ${sg(c)}. Der Listenverkaufspreis der ${FIRMA} bleibt unverändert bei ${eur(c.lvp)} je ${sg(c)}.\n\nBerechnen Sie ${ask(id)} nach der Preiserhöhung.`,
          parts: [kzPart(id)],
          steps: [
            ['BP', u => nb],
            ['LVP', u => c.lvp]
          ]
        });
      });
    }
    add(area, 'Artikeltabelle aus dem Warenwirtschaftssystem', { kzF: 2 }, c => {
      const v = half(c.bp * (1.2 + c.r() * 0.5));
      return kzTask({
        kzBase: 'BVP',
        text: `Die ${FIRMA} hat für das erste Quartal die Daten eines Artikels aus ihrem Warenwirtschaftssystem ausgelesen:{{tabelle}}Berechnen Sie ${ask(id)} für ${c.ware}.`,
        tabelle: {
          head: [
            'Art.-Nr.',
            'Bezugs­preis je Stück',
            'Barverkaufs­preis je Stück',
            'Menge eingekauft',
            'Menge verkauft'
          ],
          rows: [[c.art, eur(c.bp), eur(v), String(c.mEin), String(c.mVerk)]]
        },
        parts: [kzPart(id)],
        steps: [
          ['BP', u => c.bp],
          ['BVP', u => v]
        ]
      });
    });
    add(area, 'Aus Gesamtwerten einer Lieferung', { kzF: 2 }, c => {
      const n = pick(c.r, [40, 60, 80, 120, 150, 200]);
      const X = Math.round(c.bp * n * 100) / 100,
        Y = Math.round(c.lvp * n * 100) / 100;
      return kzTask({
        kzBase: 'LVP',
        text: `Die ${FIRMA} hat in diesem Monat ${nf(n)} ${pl(c)} ${c.ware} eingekauft. Der Bezugspreis betrug insgesamt ${eur(X)}. Verkauft wurden alle ${nf(n)} ${pl(c)} zu Listenverkaufspreisen von insgesamt ${eur(Y)}.\n\nBerechnen Sie ${ask(id)}.`,
        parts: [kzPart(id)],
        steps: [
          ['BP', u => X],
          ['LVP', u => Y]
        ]
      });
    });
    add(area, 'Bezugspreis je Stück aus dem Karton', { kzF: 2 }, c => {
      c.eh = EINH.stk;
      const n = pick(c.r, [10, 12, 20, 24, 25, 50]);
      const X = Math.round(c.bp * n * 100) / 100;
      return kzTask({
        kzBase: 'LVP',
        text: `Die ${FIRMA} bezieht ${c.ware} in Kartons zu ${n} Stück. Der Bezugspreis je Karton beträgt ${eur(X)}. Der Listenverkaufspreis beträgt ${eur(c.lvp)} je Stück.\n\nBerechnen Sie ${ask(id)}. Rechnen Sie zuerst den Bezugspreis je Stück aus.`,
        vr: [{ label: 'Bezugspreis je Stück', hint: 'Preis je Karton ÷ Stückzahl', value: c.bp }],
        parts: [kzPart(id)],
        steps: [
          ['BP', u => c.bp],
          ['LVP', u => c.lvp]
        ]
      });
    });
    add(area, 'Erst Bezugspreis, dann Kennzahl', {}, c => {
      const e = einkaufVor(c);
      const bp = truth({ steps: e }).BP;
      c.lvp = half(bp * (1.4 + c.r() * 0.8));
      return vorTask(c, {
        from: 'LEP',
        to: 'BP',
        given: ['LVP'],
        pre: preOf(c),
        text:
          einkaufText(c) +
          ` Der Listenverkaufspreis beträgt ${eur(c.lvp)} je ${sg(c)}.\n\na) ` +
          Q +
          'den Bezugspreis je ' +
          sg(c) +
          `.\n\nb) ${QK}${ask(id)}.`,
        parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart(id, 'b)')],
        steps: [].concat(e, [['LVP', u => c.lvp]])
      });
    });
    add(area, 'Erst Bezugspreis mit Pauschale, dann Kennzahl', { pausch: true }, c => {
      const e = einkaufVor(c);
      const bp = truth({ steps: e }).BP;
      c.lvp = half(bp * (1.4 + c.r() * 0.8));
      return vorTask(c, {
        from: 'LEP',
        to: 'BP',
        given: ['LVP'],
        pre: preOf(c),
        text:
          einkaufText(c) +
          ` Der Listenverkaufspreis beträgt ${eur(c.lvp)} je ${sg(c)}.\n\na) ` +
          Q +
          'den Bezugspreis je ' +
          sg(c) +
          `.\n\nb) ${QK}${ask(id)}.`,
        parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart(id, 'b)')],
        steps: [].concat(e, [['LVP', u => c.lvp]])
      });
    });
    add(area, 'Erst Listenverkaufspreis, dann Kennzahl', {}, c =>
      vorTask(c, {
        from: 'LEP',
        to: 'LVP',
        pre: preOf(c),
        text:
          einkaufText(c) +
          '\n\n' +
          tHkG(c) +
          ' ' +
          tVerk(c) +
          '\n\na) ' +
          Q +
          'den Listenverkaufspreis (netto) je ' +
          sg(c) +
          `.\n\nb) ${QK}${ask(id)}.`,
        parts: [{ label: 'a)', title: 'Listenverkaufspreis', table: true }, kzPart(id, 'b)')],
        steps: [].concat(einkaufVor(c), hkVor(c, 'BP'), verkaufVor(c))
      })
    );
    add(area, 'Rückwärts bis zum Bezugspreis, dann Kennzahl', { mkLvp: true }, c =>
      rueckTask(c, {
        from: 'BP',
        to: 'LVP',
        given: ['LVP'],
        text:
          `Die ${FIRMA} möchte ${c.ware} in ihr Sortiment aufnehmen. ` +
          lvpGiven(c) +
          '\n\n' +
          tVerkMarkt(c) +
          ` Der Handlungskostenzuschlag beträgt ${c.hk} %, der Gewinnzuschlag ${c.g} %.\n\na) ` +
          Q +
          'den höchstens zulässigen Bezugspreis je ' +
          sg(c) +
          `.\n\nb) ${QK}${ask(id)}.`,
        parts: [{ label: 'a)', title: 'Bezugspreis', table: true }, kzPart(id, 'b)')],
        steps: [].concat([['LVP', u => c.lvp]], verkaufRueck(c), gRueck(c), hkRueck(c))
      })
    );
  };
  ZFS('kz_zuschlag', 'zuschlag');
  ZFS('kz_faktor', 'faktor');
  ZFS('kz_spanne', 'spanne');
});
