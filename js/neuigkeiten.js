/* =====================================================================
   Neuigkeiten: Beim ersten Öffnen einer neuen Version erscheint einmal ein Fenster mit den Änderungen.
   Wer die Seite zum allerersten Mal öffnet, sieht es nicht. Pro Version einen Eintrag ergänzen (neueste zuerst).
   ===================================================================== */
const NEU_KEY = 'ksk-lernigel-version';
const NEUES = [
  { v: '1.3.2', punkte: ['Die Seite hat eine neue Adresse: lernigel.kainzbach.com'] },
  {
    v: '1.3.1',
    punkte: ['Handelskalkulation: Unter „Was möchten Sie üben?“ gibt es jetzt einen Zufallsknopf. Er wählt eine Aufgabe aus Vorwärts, Rückwärts und Kennzahlen.']
  },
  {
    v: '1.3.0',
    punkte: [
      'Neu: Kostenarten. Üben Sie, Kosten in variable und fixe Kosten sowie in Einzel- und Gemeinkosten einzuordnen (10 Aufgaben).',
      'Die bisherigen Aufgaben finden Sie jetzt unter „Handelskalkulation“.',
      'Unter „Meine Daten“ sichern und laden Sie alle Themen in einer Datei. Ältere Dateien lassen sich weiter laden.',
      'Dieses Fenster zeigt künftig bei jeder neuen Version, was sich geändert hat.'
    ]
  },
  { v: '1.2.2', punkte: ['Die Seite wurde im Hintergrund aufgeräumt. Sichtbar ändert sich nichts.'] },
  {
    v: '1.2.1',
    punkte: [
      'Kennzahlen: Im Zähler zählt die Rechnung, nicht nur eine Zahl. Fehlt sie, gibt es einen gelben Hinweis „Rechenweg fehlt“.',
      'Auswertung: Die Vorrechnung steht jetzt vor der Tabelle, die Zeile zum Bezugspreis im Antwortfeld ist farbig.'
    ]
  },
  {
    v: '1.2.0',
    punkte: ['Zufallsaufgaben: Unter dem Zufallsknopf sehen Sie Ihre letzten 10 Abgaben als Balken und Punkte.']
  }
];
const verNum = v => v.split('.').reduce((a, x) => a * 1000 + (+x || 0), 0);
function zeigeNeuigkeiten() {
  let last = null;
  try {
    last = localStorage.getItem(NEU_KEY);
    if (last === null) {
      // Wer schon Daten hat, kommt von einer älteren Version (vor diesem Fenster: 1.2.2)
      const alt = Object.keys(best).length > 0 || localStorage.getItem(DRAFT_KEY) || localStorage.getItem(SET_KEY);
      if (!alt) {
        localStorage.setItem(NEU_KEY, VERSION);
        return;
      }
      last = '1.2.2';
    }
  } catch (e) {
    return; // Speicher gesperrt: lieber kein Fenster als bei jedem Besuch
  }
  if (last === VERSION) return;
  const neu = NEUES.filter(n => verNum(n.v) > verNum(last) && verNum(n.v) <= verNum(VERSION));
  const fertig = () => {
    try {
      localStorage.setItem(NEU_KEY, VERSION);
    } catch (e) {}
  };
  if (!neu.length) {
    fertig();
    return;
  }
  $('neu-titel').textContent = neu.length > 1 ? 'Neu seit Ihrem letzten Besuch' : 'Neu in Version ' + neu[0].v;
  $('neu-liste').innerHTML = neu
    .map(
      n =>
        (neu.length > 1 ? `<h3>Version ${esc(n.v)}</h3>` : '') +
        '<ul>' +
        n.punkte.map(p => `<li>${esc(p)}</li>`).join('') +
        '</ul>'
    )
    .join('');
  $('neu').classList.add('show');
  $('neu-ok').focus();
  $('neu-ok').onclick = () => {
    $('neu').classList.remove('show');
    fertig();
  };
}
zeigeNeuigkeiten();
