/* =====================================================================
   Kostenarten: 10 feste Aufgaben mit je 10 Beispielen.
   Jedes Beispiel: [Text, 'V' variabel | 'F' fix, 'EK' Einzelkosten | 'GK' Gemeinkosten]
   Einzelkosten sind immer variabel. Texte sind so formuliert, dass sie sich ohne Branchenwissen einordnen lassen.
   ===================================================================== */
const KA_TASKS = [
  {
    id: 'ka-1',
    title: 'Aufgabe 1',
    items: [
      ['Verbrauch von Treibstoff für den Lkw, der an viele Kunden liefert', 'V', 'GK'],
      ['Transportbox für eine einzelne Lieferung', 'V', 'EK'],
      ['Verbrauch von Verpackungsklebeband im gesamten Versand', 'V', 'GK'],
      ['Gebäudeversicherung für das Betriebsgebäude', 'F', 'GK'],
      ['Löhne für die Fertigung eines bestimmten Kundenauftrags (nach Stückzahl bezahlt)', 'V', 'EK'],
      ['Kosten für Kühlräume, die durchgehend laufen, in denen verschiedene Waren gelagert werden', 'F', 'GK'],
      ['Einkaufspreis des Kaffees, der in der Cafeteria weiterverkauft wird', 'V', 'EK'],
      ['Miete für die Büroräume der Verwaltung', 'F', 'GK'],
      ['Abschreibung des Betriebsgebäudes', 'F', 'GK'],
      ['Verpackungsmaterial für einen einzelnen Artikel', 'V', 'EK'],
    ]
  },
  {
    id: 'ka-2',
    title: 'Aufgabe 2',
    items: [
      ['Pacht für ein Lagergrundstück', 'F', 'GK'],
      ['Abschreibung auf die Regale im Lager', 'F', 'GK'],
      ['Verbrauch von Verbrauchswerkzeugen (z. B. Bohrer)', 'V', 'GK'],
      ['Verbrauch von Treibstoff für die Firmenwagen im Außendienst', 'V', 'GK'],
      ['Abschreibung auf die Ladeneinrichtung', 'F', 'GK'],
      ['Einkaufskosten der Waren, die im Laden weiterverkauft werden', 'V', 'EK'],
      ['Stoff für ein bestimmtes Kleid in einer Schneiderei', 'V', 'EK'],
      ['Zölle für eine importierte Warenlieferung', 'V', 'EK'],
      ['Provision für einen Handelsvertreter pro vermitteltem Auftrag', 'V', 'EK'],
      ['Grundgebühr für ein Telefon, das in der Verwaltung eines Mehrproduktunternehmens genutzt wird', 'F', 'GK'],
    ]
  },
  {
    id: 'ka-3',
    title: 'Aufgabe 3',
    items: [
      ['Verbrauch von Glühbirnen und Batterien im Betrieb', 'V', 'GK'],
      ['Leasinggebühren für den Dienstwagen der Vertriebsleiterin', 'F', 'GK'],
      ['Materialkosten für eine Sonderanfertigung', 'V', 'EK'],
      ['Darlehenszinsen für den Kredit zur Geschäftsausstattung', 'F', 'GK'],
      ['Überstundenlöhne, die anfallen, weil kurzfristig ein Großauftrag für ein Produkt eingeschoben wurde', 'V', 'EK'],
      ['Transportkosten für eine einzelne Warenlieferung', 'V', 'EK'],
      ['Rohstoffkosten für eine Portion Eis', 'V', 'EK'],
      ['Hypothekenzinsen', 'F', 'GK'],
      ['Verbrauch von Büromaterial (Stifte, Ordner, Hefter)', 'V', 'GK'],
      ['Beitrag zur Industrie- und Handelskammer', 'F', 'GK'],
    ]
  },
  {
    id: 'ka-4',
    title: 'Aufgabe 4',
    items: [
      ['Aufwendungen für eine Spezialverpackung, die ein Kunde ausdrücklich wünscht', 'V', 'EK'],
      ['Soziale Abgaben des Arbeitgebers für die Verwaltungsangestellten', 'F', 'GK'],
      ['Zollgebühren für eine Lieferung importierter Schuhe', 'V', 'EK'],
      ['Verbrauch von Plastiktüten im Verkaufsraum', 'V', 'GK'],
      ['Verbrauch von Arbeitshandschuhen im Lager', 'V', 'GK'],
      ['Holz für die Herstellung eines bestimmten Schranks', 'V', 'EK'],
      ['Kfz-Steuer für den Firmenwagen der Geschäftsleitung', 'F', 'GK'],
      ['Gehalt der Buchhalterin', 'F', 'GK'],
      ['Hundesteuer für den Wachhund auf dem Firmengelände', 'F', 'GK'],
      ['Frachtkosten für die Auslieferung einer bestimmten Bestellung an einen Kunden', 'V', 'EK'],
    ]
  },
  {
    id: 'ka-5',
    title: 'Aufgabe 5',
    items: [
      ['Miete für die Verkaufsfläche des Ladens', 'F', 'GK'],
      ['Verpackungskarton für ein einzelnes Paket', 'V', 'EK'],
      ['Gehälter der Angestellten', 'F', 'GK'],
      ['Farbe für die Lackierung eines bestimmten Kundenauftrags', 'V', 'EK'],
      ['Steuern des Betriebs (z. B. Grundsteuer)', 'F', 'GK'],
      ['Abschreibung für Büromöbel', 'F', 'GK'],
      ['Füllmaterial für den Versand aller Waren (nicht einzelnen Waren zuordenbar)', 'V', 'GK'],
      ['Verbrauch von Papierhandtüchern und Toilettenpapier im Betrieb', 'V', 'GK'],
      ['Belag (Käse, Salami) für eine bestimmte Pizza', 'V', 'EK'],
      ['Stoff für eine Sonderanfertigung für einen bestimmten Kunden', 'V', 'EK'],
    ]
  },
  {
    id: 'ka-6',
    title: 'Aufgabe 6',
    items: [
      ['Pacht für die Räume der Bäckerei', 'F', 'GK'],
      ['Gehalt des Lohnbuchhalters', 'F', 'GK'],
      ['Monatliche Miete der Lagerhalle', 'F', 'GK'],
      ['Versandkartons für einzelne bestellte Waren', 'V', 'EK'],
      ['Kraftstoff für den Gabelstapler im Lager', 'V', 'GK'],
      ['Bücher, die eine Buchhandlung für den Weiterverkauf einkauft', 'V', 'EK'],
      ['Wolle für die Herstellung eines bestimmten Pullovers', 'V', 'EK'],
      ['Transportversicherung für eine einzelne Warensendung', 'V', 'EK'],
      ['Verbrauch von Motoröl für die Lieferwagen', 'V', 'GK'],
      ['Gehalt der Geschäftsleitung', 'F', 'GK'],
    ]
  },
  {
    id: 'ka-7',
    title: 'Aufgabe 7',
    items: [
      ['Bewachung des Firmengeländes durch einen Wachdienst', 'F', 'GK'],
      ['Verbrauch von Reinigungsmitteln in der Filiale', 'V', 'GK'],
      ['Vertreterprovision für einen vermittelten Verkaufsabschluss', 'V', 'EK'],
      ['Lineare Abschreibung für einen Lieferwagen', 'F', 'GK'],
      ['Grundsteuer für das Betriebsgrundstück', 'F', 'GK'],
      ['Pauschale Prämie für die Gebäudebrandversicherung', 'F', 'GK'],
      ['Kosten für die Speziallasur zur Endbehandlung einer Holzware', 'V', 'EK'],
      ['Blumen, die für die Dekoration einer bestimmten Hochzeit gekauft werden', 'V', 'EK'],
      ['Verbrauch von Druckerpatronen und Papier im Büro', 'V', 'GK'],
      ['Verpackungskosten für ein einzelnes Möbelstück, das als Einzelanfertigung gebaut wurde', 'V', 'EK'],
    ]
  },
  {
    id: 'ka-8',
    title: 'Aufgabe 8',
    items: [
      ['Verbrauch von Schmierstoffen (Betriebsstoffen) für die Maschinen', 'V', 'GK'],
      ['Geschenkverpackung für ein einzelnes Produkt auf Kundenwunsch', 'V', 'EK'],
      ['Wartungsvertrag für die Lohnabrechnungssoftware', 'F', 'GK'],
      ['Verbrauch von Kopierpapier in der Verwaltung', 'V', 'GK'],
      ['Zutaten für ein bestimmtes Menü in einem Restaurant', 'V', 'EK'],
      ['Geschenkbox für ein einzelnes verkauftes Schmuckstück', 'V', 'EK'],
      ['Leasingrate für den Kopierer im Büro', 'F', 'GK'],
      ['Beiträge zum Arbeitgeberverband', 'F', 'GK'],
      ['Porto für das Versenden eines einzelnen Pakets an einen Kunden', 'V', 'EK'],
      ['Stromkosten der Kühlanlage, die Tag und Nacht durchläuft', 'F', 'GK'],
    ]
  },
  {
    id: 'ka-9',
    title: 'Aufgabe 9',
    items: [
      ['Verbrauch von Spül- und Putzmitteln in der Betriebsküche', 'V', 'GK'],
      ['Gehälter für die Überwachung des Betriebes (Pförtner)', 'F', 'GK'],
      ['Wareneinsatz (Einkauf der verkauften Handelswaren)', 'V', 'EK'],
      ['Gehalt des Filialleiters', 'F', 'GK'],
      ['Einkaufspreis der Fernseher in einem Elektrofachgeschäft', 'V', 'EK'],
      ['Mietgebühr für das Firmenfahrzeug der Geschäftsleitung', 'F', 'GK'],
      ['Benzinverbrauch des Lieferwagens, der viele Kunden beliefert', 'V', 'GK'],
      ['Vertriebsprovision für den Verkauf einer Ware', 'V', 'EK'],
      ['Lizenzgebühr, die pro verkauftem Exemplar anfällt', 'V', 'EK'],
      ['Monatsmiete für das Ersatzteillager', 'F', 'GK'],
    ]
  },
  {
    id: 'ka-10',
    title: 'Aufgabe 10',
    items: [
      ['Gehalt, das sich die Inhaberin auszahlt', 'F', 'GK'],
      ['Mehl für die Brötchen einer Bäckerei', 'V', 'EK'],
      ['Kaffeebohnen für eine Tasse Kaffee', 'V', 'EK'],
      ['Verbrauch von Treibstoffen durch die Fahrzeuge des Betriebs', 'V', 'GK'],
      ['Rundfunkbeitrag des Betriebs', 'F', 'GK'],
      ['Papierkosten für den Druck eines bestimmten Buches', 'V', 'EK'],
      ['Haftpflichtversicherung des Betriebs (Pauschalbeitrag)', 'F', 'GK'],
      ['Miete für das Verwaltungsgebäude', 'F', 'GK'],
      ['Eingangsfracht für eine bestimmte Lieferung Textilien', 'V', 'EK'],
      ['Verbrauch von Kassenrollen an der Ladenkasse', 'V', 'GK'],
    ]
  },
];
