# LernIgel

Kostenlose Lernplattform zum Üben und Testen. Aktuell: **Kaufmännische Steuerung und Kontrolle (KSK)** mit dem Kalkulationstrainer. Version 1.5.2, siehe `CHANGELOG.md`.

Läuft im Browser, ohne Konto und ohne Server. Alles bleibt auf Ihrem Gerät.

**Live:** https://lernigel.de

## Hinweis zur Entstehung (KI)

LernIgel wurde mit Hilfe von künstlicher Intelligenz entwickelt. Programmcode, Aufgabentexte, Musterwege und Gestaltung wurden mit **Claude** (Anthropic) erstellt. Die fachlichen Vorgaben, die Kontrolle der Aufgaben und das Testen kamen vom Betreiber der Seite. Wenn Sie KI-entwickelte Software nicht nutzen möchten, finden Sie den Hinweis hier vorab.

Eine KI kann Fehler machen. Falsche Aufgaben oder Lösungen können Sie gern über die Issues auf GitHub melden.

## Was kann es?

- Thema **Handelskalkulation** mit vier Bereichen: **Vorwärts**, **Rückwärts**, **Kennzahlen** und **Komplettaufgaben** mit zusammen 110 festen Aufgaben, dazu zufällige Aufgaben je Bereich und Kennzahl
- Thema **Kostenarten** mit 10 Aufgaben: variable und fixe Kosten, Einzel- und Gemeinkosten zuordnen
- Das Kalkulationsschema (Handelskalkulation) komplett selbst aufschreiben, statt Werte in eine Vorlage einzutragen
- Auswertung Zeile für Zeile: Bezeichnung, Vorzeichen, Betrag, Reihenfolge; Folgefehler werden nur einmal bestraft
- Kennzahlen mit eigenem Untermenü je Kennzahl (Kalkulationszuschlag, Kalkulationsfaktor, Handelsspanne, Gewinn in Prozent, Handlungskostenzuschlag, Gewinnzuschlag, durchschnittliche Handelsspanne), je 10 feste Aufgaben und eigener Zufallsknopf; Zähler, Nenner und Ergebnis
- Musterweg zu jeder Aufgabe; bei festen Aufgaben werden falsche Zeilen erst nach „aufdecken“ gezeigt
- Übersicht mit Entwurf und Bestwert, Stand sichern und laden, optionale Schema-Hilfe (ab 5 bearbeiteten Aufgaben)
- Eingebauter Taschenrechner, speichert den Stand automatisch, funktioniert auf Handy und PC

## Inhalte im Überblick

| Bereich | Feste Aufgaben | Inhalt |
|---|---|---|
| Vorwärts | 10 | Kalkulationsschema vom Listeneinkaufspreis bis zum Listenverkaufspreis, jeweils bis zu einem Zwischenschritt |
| Rückwärts | 10 | Rückrechnung vom Verkaufspreis zum Einkaufspreis |
| Komplettaufgaben | 20 | gemischt, mit einer oder zwei Tabellen, mit Vorrechnung, Kennzahlen und Mitbewerber-Aufgaben |
| Kennzahlen | 70 | je 10 für Kalkulationszuschlag, Kalkulationsfaktor, Handelsspanne, Gewinn in Prozent, Handlungskostenzuschlag, Gewinnzuschlag und durchschnittliche Handelsspanne |

Insgesamt **110 feste Aufgaben**. Zu jedem Aufgabentyp gibt es außerdem zufällig erzeugte Varianten. Bei Zufallsaufgaben zählt nur die erste Abgabe.

**Aufgabenformen:** das Schema selbst aufschreiben (Bezeichnung, Vorzeichen, Betrag, Reihenfolge, von oben nach unten oder umgekehrt), Kennzahlen mit Zähler, Nenner und Ergebnis, Vorrechnung für Zwischenwerte, Antwortfeld, bei Mitbewerber-Aufgaben die Wahl zwischen Tabelle und Rechnung über den Kalkulationsfaktor.

**Bewertung:** vier Punkte je Tabellenzeile, drei Punkte je Kennzahl, Vorrechnung je ein Punkt. Folgefehler werden nur einmal bestraft, Toleranz 1 Cent. Die Vertreterprovision ist optional, wenn sie in der Aufgabe nicht vorkommt. Jede Aufgabe hat einen Musterweg; bei festen Aufgaben werden falsche Zeilen erst nach „aufdecken" gezeigt.

**Bedienung:** Taschenrechner, automatischer Entwurf, Bestwerte, Stand sichern und laden, optionale Schema-Hilfe ab fünf bearbeiteten Aufgaben, Darstellung Hell, Dunkel oder Automatisch (unter „Meine Daten"), für Handy und PC.

## Wichtig

Dies ist ein **Übungswerkzeug**, keine Prüfungsumgebung. Die Lösungen liegen im Programmcode und sind für jeden lesbar.

## Datenschutz

Es werden keine Daten an einen Server gesendet. Bestwerte und Entwürfe liegen nur im Browser (localStorage) auf Ihrem Gerät. Löschen Sie die Browserdaten, sind sie weg.

## Aufbau

- `index.html`: Seitengerüst
- `css/style.css`: Gestaltung (hell)
- `css/nav.css`: Menüs und Hintergrund
- `css/dark.css`: Dunkelmodus
- `js/schema.js`: Kalkulationsschema und Kennzahlen
- `js/helpers.js`: Rechenregeln und Hilfsfunktionen
- `js/tasks.js`: die fünf Ursprungsaufgaben (nicht mehr im Menü, dienen als Testfälle)
- `js/pool.js`: erfundene Firmen und Waren
- **Aufgaben-Generatoren** (hier neue Aufgabentypen ergänzen), nach Themen getrennt:
  - `js/gen_basis.js`: Zufall, Textbausteine, Typlisten
  - `js/gen_vorwaerts.js`, `js/gen_rueckwaerts.js`: Vorwärts- und Rückwärtsaufgaben
  - `js/gen_kz.js` (Rahmen) mit `gen_kz_a.js`, `gen_kz_diff.js`, `gen_kz_b.js`, `gen_kz_c.js`, `gen_kz_d.js`, `gen_kz_e.js`: die sieben Kennzahlen-Bereiche
  - `js/gen_komplett_basis.js`, `gen_komplett_ab.js`, `gen_komplett_cd.js`, `gen_komplett_f.js`: Komplettaufgaben
  - `js/gen_musterweg.js`: Rechenweg unter der Lösung
  - `js/gen_bau.js`: Aufgabe bauen, prüfen, feste und zufällige Aufgaben
- `js/nav.js`: Menüs, Übersicht, Meine Daten (Sicherungsdatei mit einem Abschnitt je Fach), Igel-Sprüche
- `js/gen_kostenarten.js` und `js/kostenarten.js`: das Thema Kostenarten (Daten der 10 Aufgaben, Ansicht und Auswertung)
- `js/lernen.js` und `css/lernen.css`: Handelskalkulation › Lernen (Schema, Beispiele, Kennzahlen); die Formelblätter liegen als PDF in `assets/`
- `check-names.js`: wird von `build.js` aufgerufen und prüft die Zeilennamen der Lernen-Seiten gegen das Schema
- `js/neuigkeiten.js`: Fenster „Neu in Version …“ beim ersten Öffnen einer neuen Version (pro Version einen Eintrag ergänzen)
- `js/melden.js`: Knopf und Fenster „Melden“ (Fehler oder Wunsch per Mail, GitHub oder Kopieren, mit Kennung und Angaben nach Wahl)
- `assets/`: Favicon
- `js/state.js`, `js/render.js`: Zustand und Darstellung
- `js/evaluate.js`: Auswertung und Punkte
- `js/events.js`, `js/calc.js`, `js/draft.js`: Bedienung, Taschenrechner, Entwurf speichern
- `js/hintergrund.js`: feste Hintergrundhöhe auf Touch-Geräten
- `build.js`: baut daraus eine einzelne HTML-Datei (`node build.js`, Ergebnis in `dist/`)

Die Skripte werden in dieser Reihenfolge geladen (siehe `index.html`). Bei jeder neuen Version muss die Nummer hinter `?v=` in `index.html` mitgeändert werden, damit Browser keine alten Dateien behalten. Es sind klassische Skripte, keine Module, damit die Seite auch lokal ohne Server läuft.

## Aufgaben ergänzen

Neue Aufgabentypen stehen als Generatoren in den `js/gen_*.js`-Dateien (`V(...)`, `R(...)`, `K(...)`, `KO(...)`). Jede Aufgabe entsteht aus einem Startwert, wird beim Erzeugen auf saubere Rundung geprüft und aus Rechenschritten gelöst. Eine genauere Anleitung folgt.

## Mitmachen

Rückmeldungen und Verbesserungsvorschläge sind willkommen, am besten als „Issue“ hier auf GitHub. Die Aufgaben sind eigene, ausgedachte Beispiele. Bitte reichen Sie keine abgeschriebenen Original-Prüfungsaufgaben ein.

## Lizenz

MIT-Lizenz, siehe `LICENSE`.
