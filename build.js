// Baut aus index.html + css/ + js/ eine einzelne Datei (dist/lernigel-einzeldatei.html),
// z. B. zum Verschicken per E-Mail. Aufruf: node build.js
const fs = require('fs'), path = require('path');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) => '<style>\n' + fs.readFileSync(f, 'utf8') + '</style>');
let scripts = [];
html = html.replace(/<script src="([^"]+)"><\/script>\n?/g, (_, f) => { scripts.push(fs.readFileSync(f, 'utf8')); return ''; });
html = html.replace('</body>', '<script>\n' + scripts.join('\n') + '</script>\n</body>');
html = html.replace(/<meta name="robots"[^>]*>\n?/, '');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'lernigel-einzeldatei.html'), html);
console.log('dist/lernigel-einzeldatei.html', html.length, 'Bytes');
