# LernIgel

Kostenlose Lernplattform zum Üben und Testen. Aktuell: **Kaufmännische Steuerung und Kontrolle (KSK)** mit dem Kalkulationstrainer.

Läuft im Browser, ohne Konto und ohne Server. Alles bleibt auf Ihrem Gerät.

**Live:** https://lernen.kainzbach.com

## Was kann es?

- Das Kalkulationsschema (Handelskalkulation) komplett selbst aufschreiben, statt Werte in eine Vorlage einzutragen
- Auswertung Zeile für Zeile: Bezeichnung, Vorzeichen, Betrag, Reihenfolge
- Kennzahlen (Kalkulationszuschlag, Faktor, Handelsspanne, Gewinn in Prozent) mit Zähler, Nenner und Ergebnis
- Eingebauter Taschenrechner, speichert den Stand automatisch, funktioniert auf Handy und PC

## Wichtig

Dies ist ein **Übungswerkzeug**, keine Prüfungsumgebung. Die Lösungen liegen im Programmcode und sind für jeden lesbar.

## Datenschutz

Es werden keine Daten an einen Server gesendet. Bestwerte und Entwürfe liegen nur im Browser (localStorage) auf Ihrem Gerät. Löschen Sie die Browserdaten, sind sie weg.

## Aufbau

- `index.html`: Seitengerüst
- `css/style.css`: Gestaltung
- `js/schema.js`: Kalkulationsschema und Kennzahlen
- `js/helpers.js`: Rechenregeln und Hilfsfunktionen
- `js/tasks.js`: **die Aufgaben** (hier ergänzen)
- `js/state.js`, `js/render.js`: Zustand und Darstellung
- `js/evaluate.js`: Auswertung und Punkte
- `js/events.js`, `js/calc.js`, `js/draft.js`: Bedienung, Taschenrechner, Entwurf speichern
- `build.js`: baut daraus eine einzelne HTML-Datei (`node build.js`, Ergebnis in `dist/`)

Die Skripte werden in dieser Reihenfolge geladen (siehe `index.html`). Es sind klassische Skripte, keine Module, damit die Seite auch lokal ohne Server läuft.

## Aufgaben ergänzen

Die Aufgaben stehen als Daten in `js/tasks.js`. Die Lösung wird aus den dort hinterlegten Rechenschritten berechnet. Eine genauere Anleitung folgt.

## Mitmachen

Rückmeldungen und Verbesserungsvorschläge sind willkommen, am besten als „Issue“ hier auf GitHub. Die Aufgaben sind eigene, ausgedachte Beispiele. Bitte reichen Sie keine abgeschriebenen Original-Prüfungsaufgaben ein.

## Lizenz

MIT-Lizenz, siehe `LICENSE`.
