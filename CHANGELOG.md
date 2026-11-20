# Änderungen

## 1.1.1 (2026-11-20)

- Heller Modus: Die funkelnden Sterne im Hintergrund haben jetzt einen blauen Rand und Schein und sind auf Hellblau besser zu sehen. Dunkelmodus unverändert

## 1.1.0 (2026-11-20)

- Taschenrechner gibt es nur noch in einer Aufgabe, nicht mehr in Menüs, Übersicht und „Meine Daten“
- Start des Taschenrechners: auf dem Handy und im Hochformat auf dem Tablet (unter 1000 px Breite) immer zu; auf Computer und breiten Tablets offen, sobald die erste Aufgabe einer neuen Sitzung (Browser-Tab) geöffnet wird. Danach bleibt der zuletzt gewählte Zustand in dieser Sitzung, auch beim Neuladen
- Aufgabenseite am Computer: Die rechte Spalte ist nur noch so breit wie ihr Inhalt. Bei breiten Fenstern (ab 1500 px) hat der offene Taschenrechner seinen eigenen Platz rechts daneben und verdeckt keine Felder und Knöpfe mehr

## 1.0.2 (2026-11-19)

Nur Aussehen, keine Änderung an Aufgaben oder Wertung.

- „Meine Daten“: „Darstellung“ und „Schema-Hilfe“ stehen in getrennten Zeilen mit Abstand
- Dunkelmodus: Karte „Meine Daten“, Menüknöpfe, Knopf „Meine Daten“ und Kennzahl-Chips sind jetzt so deckend wie im hellen Modus (vorher fast durchsichtig, der Hintergrund schien durch den Text)

## 1.0.1 (2026-11-19)

Nur Aufräumen, keine Änderung am Verhalten der Seite.

- Die großen Dateien `gen.js` und `gen_kz.js` sind in kleinere Dateien nach Themen aufgeteilt (Vorwärts, Rückwärts, Komplettaufgaben, Kennzahlen A–E, Aufgabe bauen, Musterweg)
- Einheitlich formatiert, Kopfkommentare je Datei
- Geprüft: alle 2.647 Stichproben-Aufgaben und 44 Bildschirmfotos vorher und nachher identisch

## 1.0.0 (2026-11-09)

Erste vollständige Fassung. Vorgänger: 0.1.0 (Prototyp mit 5 Aufgaben).

- Start, Fach, Üben und Bereiche: Vorwärts, Rückwärts, Kennzahlen, Komplettaufgaben (10, 10, 70 und 20 feste Aufgaben)
- Zufällige Aufgaben je Bereich: sofort alles sichtbar, es zählt der erste Versuch; Zähler „✓ richtig“ und „N abgegeben“
- Bereiche sind getrennt: Vorwärts und Rückwärts enthalten nur Schema-Aufgaben, Kennzahlen nur Kennzahl-Aufgaben (feste und zufällige). Die Mischung gibt es nur in den Komplettaufgaben
- Kennzahlen mit Untermenü: Kalkulationszuschlag, Kalkulationsfaktor, Handelsspanne, Gewinn in Prozent, Handlungskostenzuschlag, Gewinnzuschlag und durchschnittliche Handelsspanne, je 10 feste Aufgaben und eigener Zufallsknopf (zusätzlich ein Zufallsknopf über alle Kennzahlen)
- Vorrechnung (Bezugskosten-Pauschale, Stückpreis aus der Packung) mit eigenem Rechenfeld
- Komplettaufgaben (20, gemischt, 14 mit einer Tabelle, 6 mit zwei): alle Teile untereinander auf einer Seite, Vorrechnung in der Karte von a), Ersatzwert-Hinweis in grau unter dem Teil, der ihn braucht. Typen: Vorwärts, dann Kennzahlen; Rückwärts, dann Kennzahlen; Selbstkosten, Barverkaufspreis und Gewinn als Differenz; Satz aus Kostenzahlen ermitteln, dann Schema; Packung oder Pauschale mit Teilung am Selbstkostenpreis; zusätzlich Aufgaben mit Preis eines Mitbewerbers (zweite Tabelle mit eigener Rechenkette, rückwärts bis zum Bezugspreis). Ersatzwert als kleiner grauer Hinweis unter dem Abschnitt, Bezug im Folgeteil auf alle vorigen Ergebnisse, Nachkommastellen im Text, angegebene, aber nicht benötigte Werte (Ablenker), wechselnde Begriffe (Kundenskonto/Kundenkonto, Bezugspreis/Einstandspreis)
- Feste Aufgaben: Lösung falscher Zeilen erst nach „aufdecken“; Verbesserung danach gelb mit ↻
- Folgefehler werden nur einmal bestraft; veraltete Folgewerte nach einer Korrektur heißen „veraltet, bitte neu rechnen“
- Musterweg mit Rechenweg, Übersicht mit Entwurf, Bestwert und Farben
- Meine Daten: Stand sichern und laden; Schema-Hilfe nach 5 bearbeiteten Aufgaben (mit Warnhinweis beim Einschalten); „Schema ausfüllen“ von oben nach unten und von unten nach oben; Abkürzung „Meine Daten“ oben rechts im Menü
- Igel auch im Menü und größer in den Aufgaben, breitere Textspalte am Computer, hängender Einzug der Teilaufgaben
- Mitbewerber-Aufgaben: Weg über Tabelle oder Kalkulationsfaktor (Toleranz dort 5 Cent)
- Igel mit Sprüchen, neuer Hintergrund, Favicon
- Toleranz: 1 Cent
- Dunkelmodus (Hell, Dunkel oder Automatisch nach Geräteeinstellung, Auswahl unter „Meine Daten“): Menüs mit dunklem Hintergrund, Aufgabenseiten mit flacher dunkler Fläche
- „Meine Daten“ hat einen Zurück-Knopf zur vorherigen Seite
- Vertreterprovision ist optional, wenn sie in der Aufgabe nicht vorkommt (Zeile weglassen oder mit 0 bzw. „/“ eintragen, beides ist richtig)
- Vorrechnungsfeld auch bei Kennzahl-Aufgaben ohne Tabelle
- Kennzahl-Ergebnis: mehr Nachkommastellen als verlangt zählen als falsch, mit Hinweis
- Kostenrechnung (Handlungskosten): Werte als Tabelle, ohne Zusatzhinweis
- „Gewinn“ und „Handlungskosten“ zählen als Bezeichnung voll
- Differenz-Aufgabe: Gewinn darf auch im normalen Schema zwischen Selbstkostenpreis und Barverkaufspreis stehen

## 0.1.0

Prototyp mit 5 Aufgaben.
