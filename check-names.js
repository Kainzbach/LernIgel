// Prüft, dass die Namen auf den Lernen-Seiten zu den Schreibweisen im Schema passen. Wird von build.js aufgerufen (Fehler = Abbruch).
const fs = require('fs'), vm = require('vm');
function checkNames() {
  const ctx = { fmtMax: x => x };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('js/schema.js', 'utf8') + ';this.SCHEMA=SCHEMA;', ctx);
  const src = fs.readFileSync('js/lernen.js', 'utf8');
  const m = src.match(/const LN_NAME = \{([\s\S]*?)\};/);
  const fehler = [];
  if (!m) return ['LN_NAME nicht gefunden'];
  const AUSNAHME = { HK: 'Handlungskosten', G: 'Gewinn' }; // Zeilenname im Schema der Seite, bewusst nicht der Zuschlag
  const names = {};
  m[1].replace(/(\w+): '([^']+)'/g, (_, k, v) => (names[k] = v));
  ctx.SCHEMA.forEach(s => {
    if (AUSNAHME[s.key]) return;
    // Der Name der Seite muss eine erlaubte Schreibweise sein ...
    if (!s.alias.includes(names[s.key])) fehler.push(`${s.key}: "${names[s.key]}" steht nicht im Schema (${s.alias.join(', ')})`);
    // ... und andere Schreibweisen derselben Zeile dürfen im Text nicht vorkommen (z. B. Kundenkonto neben Kundenskonto)
    s.alias.filter(x => x.length > 4 && x !== names[s.key]).forEach(x => {
      if (new RegExp('\\b' + x + '\\b').test(src)) fehler.push(`${s.key}: "${x}" kommt in js/lernen.js vor, die Seite nennt die Zeile "${names[s.key]}"`);
    });
  });
  return fehler;
}
module.exports = checkNames;
if (require.main === module) {
  const f = checkNames();
  console.log(f.length ? 'Namensprüfung FEHLER:\n' + f.join('\n') : 'Namensprüfung ok');
  process.exit(f.length ? 1 : 0);
}
