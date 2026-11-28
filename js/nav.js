/* =====================================================================
   Navigation: Start → Fach → Üben → Bereich → Aufgabe (Adresse mit #/…)
   ===================================================================== */
const AREAS = [
  { id: 'vorwaerts', name: 'Vorwärts', icon: 'arrowR', tasks: FIXED.vorwaerts },
  { id: 'rueckwaerts', name: 'Rückwärts', icon: 'arrowL', tasks: FIXED.rueckwaerts },
  {
    id: 'kennzahlen',
    name: 'Kennzahlen',
    icon: 'pct',
    tasks: [].concat(...KZ_AREAS.map(a => FIXED[a.id])),
    children: KZ_AREAS.map(a => ({
      id: a.id,
      name: a.name,
      icon: 'pct',
      tasks: FIXED[a.id],
      parent: 'kennzahlen'
    }))
  },
  { id: 'komplett', name: 'Komplettaufgaben', icon: 'layers', tasks: FIXED.komplett }
];
// Adressen: Fach (ksk) → Thema (handelskalkulation, kostenarten) → Üben → Bereich → Aufgabe
const HKB = '#/ksk/handelskalkulation',
  HKU = HKB + '/ueben',
  KAB = '#/ksk/kostenarten',
  KAU = KAB + '/ueben';
const ICONS = {
  tag: '<path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
  book: '<path d="M4 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrowR: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowL: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  pct: '<path d="M18 5L6 19"/><circle cx="7.5" cy="7.5" r="2.3"/><circle cx="16.5" cy="16.5" r="2.3"/>',
  layers: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/>',
  dots: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M9 10.5c0-1.2 1.3-2 3-2s3 .8 3 2-1.3 1.8-3 2-3 .8-3 2 1.3 2 3 2 3-.8 3-2"/>'
};
const tileHtml = o => {
  const tag = o.href ? 'a' : 'div';
  return (
    `<${tag} class="tile${o.soon ? ' soon' : ''}"${o.href ? ` href="${o.href}"` : ' aria-disabled="true"'}>` +
    `<span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[o.icon]}</svg></span>` +
    `<span class="label${o.small ? ' sm' : ''}">${o.label}</span>${o.tag ? `<span class="tag">${o.tag}</span>` : ''}</${tag}>`
  );
};
// Jede Kopie des Igels bekommt eigene IDs, sonst verweisen Stacheln/Zuschnitt auf eine ausgeblendete Kopie
let igelUid = 0;
const uniqIds = svg => {
  const k = ++igelUid;
  return svg
    .replace(/id="(spine|back|bellyclip)"/g, 'id="$1-' + k + '"')
    .replace(/url\(#(spine|back|bellyclip)\)/g, 'url(#$1-' + k + ')');
};
const wordmark = () => uniqIds(document.getElementById('tpl-wm').innerHTML);
const areaOf = id =>
  AREAS.find(a => a.id === id) || [].concat(...AREAS.map(a => a.children || [])).find(a => a.id === id);
const taskIndex = id => ensureTask(id);

function showMenu(html, small) {
  document.body.className = 'is-menu';
  calcLeave();
  $('v-task').hidden = true;
  $('v-ka').hidden = true;
  $('v-menu').hidden = false;
  $('menu').className = 'menu' + (small ? ' small' : '');
  const ig = igelMenuHtml();
  $('menu').innerHTML = html.includes('</h2>')
    ? html.replace('</h2>', '</h2>' + ig)
    : html.includes('<div class="tiles">')
      ? html.replace('<div class="tiles">', ig + '<div class="tiles">')
      : html + ig;
  const md = $('md-btn');
  if (md) md.hidden = /^#\/daten/.test(location.hash);
  window.scrollTo(0, 0);
}
// Igel auf den Menüseiten mit passendem Spruch
const SP_MENU = {
  start: ['Willkommen! Wollen wir üben?', 'Schön, dass Sie da sind.'],
  fach: ["Auf geht's zum Üben!", 'Gleich geht es los.'],
  bereich: ['Was üben wir heute?', 'Suchen Sie sich einen Bereich aus.'],
  liste: ['Welche Aufgabe nehmen wir?', 'Suchen Sie sich eine Aufgabe aus.'],
  daten: ['Hier liegt Ihr Stand sicher.']
};
function igelMenuHtml() {
  const p0 = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const p = p0.filter((x, i) => !(i === 1 && (x === 'handelskalkulation' || x === 'kostenarten')));
  const k =
    p0[1] === 'kostenarten' && p0[2] === 'ueben'
      ? 'liste'
      : p[0] === 'daten'
      ? 'daten'
      : !p.length
        ? 'start'
        : p.length === 1
          ? 'fach'
          : p.length === 2
            ? 'bereich'
            : 'liste';
  const pool = SP_MENU[k];
  const say = pool[Math.floor(Math.random() * pool.length)];
  return `<div class="igel-menu" aria-hidden="true"><span class="mini">${uniqIds(document.getElementById('tpl-wm').content.querySelector('svg').outerHTML)}</span><span class="bubble">${esc(say)}</span></div>`;
}
(function () {
  const a = document.createElement('a');
  a.id = 'md-btn';
  a.href = '#/daten';
  a.className = 'md-btn';
  a.hidden = true;
  a.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/></svg><span class="md-t">Meine Daten</span>';
  a.setAttribute('aria-label', 'Meine Daten');
  $('v-menu').appendChild(a);
})();
function showTask() {
  document.body.className = 'is-task';
  $('v-menu').hidden = true;
  $('v-ka').hidden = true;
  $('v-task').hidden = false;
  calcEnter();
  window.scrollTo(0, 0);
}
// Zufallsaufgaben: letzte 10 als Zahl, Balken und Punkte (grün = 100 %, gelb = teilweise, rot = 0 %),
// darunter bei mehr als 10 Abgaben die Gesamtzeile
function randPanel(rs) {
  if (!rs.n) return '';
  const last = rs.recent;
  const ok10 = last.filter(x => x === 100).length;
  const pc = Math.round((ok10 / last.length) * 100);
  const dots = last
    .map(x => `<span class="zd ${x === 100 ? 'g' : x > 0 ? 'y' : 'r'}" title="${x} %"></span>`)
    .join('');
  const gesamt = rs.n > last.length ? `<div class="zall">Insgesamt ${rs.ok} von ${rs.n} richtig</div>` : '';
  return `<div class="zv" aria-label="Zufallsaufgaben"><div class="ztxt">${ok10} von ${last.length} richtig</div><div class="zbar"><i style="width:${pc}%"></i></div><div class="zdots">${dots}</div><div class="zlab">Letzte ${last.length} Zufallsaufgaben</div>${gesamt}</div>`;
}
const hasProgress = () => Object.keys(best).length > 0 || Object.keys(rowsByTask).length > 0;
const saveHint = () =>
  prog.dirty && hasProgress()
    ? '<p class="savehint">Ihr Stand ist noch nicht gesichert. <a href="#/daten">Jetzt sichern</a></p>'
    : '';
// Sicherungsdatei: ein Abschnitt je Fach. Alle bisherigen Themen gehören zum Fach "ksk".
// Abschnitte weiterer Fächer, die diese Seite noch nicht kennt, bleiben unverändert erhalten.
const FREMD_KEY = 'ksk-lernigel-fremd';
function buildExport() {
  let fremd = {};
  try {
    fremd = JSON.parse(localStorage.getItem(FREMD_KEY) || '{}') || {};
  } catch (e) {}
  const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  return {
    app: 'lernigel',
    v: 3,
    faecher: Object.assign({}, fremd, { ksk: { best, prog: { help: prog.help }, draft } })
  };
}
// Ältere Dateien (Version 1 und 2) haben best/prog/draft auf oberster Ebene und gelten als Fach "ksk"
function applyImport(d) {
  if (!d || d.app !== 'lernigel') return false;
  let ksk = null;
  const fremd = {};
  if (d.faecher && typeof d.faecher === 'object') {
    Object.keys(d.faecher).forEach(k => {
      if (k === 'ksk') ksk = d.faecher.ksk;
      else fremd[k] = d.faecher[k];
    });
  } else {
    ksk = { best: d.best, prog: d.prog, draft: d.draft };
  }
  if (!ksk || typeof ksk.best !== 'object' || ksk.best === null) return false;
  localStorage.setItem(STORE_KEY, JSON.stringify(ksk.best));
  localStorage.setItem(PROG_KEY, JSON.stringify({ help: (ksk.prog && ksk.prog.help) || {}, dirty: false }));
  if (ksk.draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(ksk.draft));
  localStorage.setItem(FREMD_KEY, JSON.stringify(fremd));
  return true;
}
function showData() {
  showMenu(
    `${backHash ? backLink(backHash, 'Zurück') : backLink('#/', 'Start')}<h2>Meine Daten</h2><p class="sub" style="margin:0;max-width:520px">Ihr Stand liegt nur in diesem Browser auf Ihrem Gerät. Sichern Sie ihn als Datei, um ihn auf einem anderen Gerät zu laden oder nach dem Löschen der Browserdaten wiederherzustellen.</p>
    <div class="databox"><button class="rand" id="btn-export">Stand sichern</button><label class="linkbtn" for="file-import">Stand laden …</label><input type="file" id="file-import" accept="application/json,.json" hidden></div>
    <div class="setbox"><div class="setrow"><label for="sel-theme">Darstellung</label> <select id="sel-theme"><option value="auto">Automatisch (wie Ihr Gerät)</option><option value="light">Hell</option><option value="dark">Dunkel</option></select></div>
    <div class="setrow setgap"><label><input type="checkbox" id="chk-help" ${settings.help ? 'checked' : ''} ${helpAvailable() ? '' : 'disabled'}> Schema-Hilfe in den Aufgaben anbieten</label></div>
    <p class="sub" style="margin:4px 0 0;font-size:.85rem">${helpAvailable() ? 'Dann erscheint in jeder Tabelle der Knopf „Schema ausfüllen“. Er trägt die Bezeichnungen ein, Vorzeichen und Beträge rechnen Sie selbst.' : 'Wird nach ' + HELP_MIN + ' bearbeiteten Aufgaben freigeschaltet. Bisher: ' + doneCount() + '.'}</p></div>
    <p class="datamsg" id="data-msg">${saveHint() ? 'Ihr Stand ist noch nicht gesichert.' : ''}</p>
    <p class="sub" style="margin:0;font-size:.85rem">Laden ersetzt den Stand auf diesem Gerät.</p><p class="sub" style="margin:0;font-size:.8rem">LernIgel Version ${VERSION}</p>`,
    true
  );
  $('sel-theme').value = settings.theme || 'auto';
  $('sel-theme').addEventListener('change', e => {
    settings.theme = e.target.value;
    saveSettings();
    applyTheme();
  });
  $('chk-help').addEventListener('change', async e => {
    const cb = e.target;
    if (
      cb.checked &&
      !(await ask(
        'Schema-Hilfe einschalten? Die Hilfe trägt die Bezeichnungen des Schemas für Sie ein. Schalten Sie sie nur ein, wenn Sie das Schema schon können. Sonst lernen Sie es damit nicht.',
        'Trotzdem einschalten'
      ))
    ) {
      cb.checked = false;
      return;
    }
    settings.help = cb.checked;
    saveSettings();
  });
  $('btn-export').addEventListener('click', () => {
    saveDraft();
    const data = buildExport();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    a.download = 'lernigel-stand-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    prog.dirty = false;
    saveProg();
    $('data-msg').textContent = 'Gesichert. Die Datei liegt in Ihren Downloads.';
  });
  $('file-import').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        if (!applyImport(JSON.parse(rd.result))) throw 0;
        $('data-msg').textContent = 'Stand geladen. Die Seite lädt neu …';
        setTimeout(() => {
          location.hash = '#/';
          location.reload();
        }, 700);
      } catch (x) {
        $('data-msg').textContent =
          'Diese Datei passt nicht. Bitte wählen Sie eine mit „Stand sichern“ erstellte Datei.';
      }
    };
    rd.readAsText(f);
  });
}
// Igel mit Spruch (klein in der Ecke, nur auf Aufgabenseiten)
const SP_START = [
  'Viel Erfolg!',
  'Ruhig bleiben, Zeile für Zeile.',
  'Die Nebenrechnung nicht vergessen!',
  'Zuerst lesen, dann rechnen.'
];
const SP_TOP = ['Sauber gerechnet!', 'Alles richtig, stark!', 'Das sitzt!'];
const SP_MID = ['Gut gemacht, fast alles richtig.', 'Schauen Sie sich die gelben und roten Stellen an.'];
const SP_LOW = [
  'Nicht schlimm. Der Musterweg hilft, dann versuchen Sie es noch einmal.',
  'Üben macht den Meister. Gleich noch einmal?'
];
let igelTimer = null;
function igelSay(p) {
  const pool = p == null ? SP_START : p === 100 ? SP_TOP : p >= 67 ? SP_MID : SP_LOW;
  const el = $('igel-talk');
  if (!el) return;
  el.querySelector('.bubble').textContent = pool[Math.floor(Math.random() * pool.length)];
  el.classList.add('show');
  clearTimeout(igelTimer);
  igelTimer = setTimeout(() => el.classList.remove('show'), 7000);
}
(function () {
  const d = document.createElement('div');
  d.id = 'igel-talk';
  d.innerHTML =
    '<span class="mini">' +
    uniqIds(document.getElementById('tpl-wm').content.querySelector('svg').outerHTML) +
    '</span><span class="bubble"></span>';
  $('v-task').insertBefore(d, $('v-task').querySelector('main'));
})();
const backLink = (href, text) => `<div class="nav-top"><a class="linkbtn" href="${href}">‹ ${text}</a></div>`;

let backHash = '';
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] !== 'daten') backHash = location.hash;
  document.title = 'LernIgel – Üben für Kaufmännische Steuerung und Kontrolle';
  if (parts[0] === 'daten') {
    showData();
    return;
  }
  if (parts[0] !== 'ksk') {
    showMenu(
      `<div class="wm-box">${wordmark()}</div><p class="sub">Kostenlos üben, ohne Konto</p><div class="tiles">${tileHtml({ href: '#/ksk', icon: 'coin', label: 'Kaufmännische Steuerung und Kontrolle', small: true })}</div>${saveHint()}<a class="linkbtn" href="#/daten">Meine Daten</a><p class="hinweis">Hinweis: LernIgel ist ein Übungsprogramm und kann Fehler enthalten. Verlassen Sie sich nicht allein darauf, und prüfen Sie bei Zweifeln Ihre Unterlagen oder fragen Sie Ihre Lehrkraft.</p>`
    );
    return;
  }
  if (parts.length === 1) {
    showMenu(
      `${backLink('#/', 'Start')}<div class="wm-box">${wordmark()}</div><h2>Kaufmännische Steuerung und Kontrolle</h2><div class="tiles">${tileHtml({ href: HKB, icon: 'pct', label: 'Handelskalkulation', small: true })}${tileHtml({ href: KAB, icon: 'tag', label: 'Kostenarten' })}</div>${saveHint()}`,
      true
    );
    return;
  }
  if (parts[1] === 'kostenarten') {
    showKostenarten(parts);
    return;
  }
  if (parts[1] !== 'handelskalkulation') {
    location.replace('#/ksk');
    return;
  }
  if (parts.length === 2) {
    showMenu(
      `${backLink('#/ksk', 'Thema')}<div class="wm-box">${wordmark()}</div><h2>Handelskalkulation</h2><div class="tiles">${tileHtml({ href: HKB + '/lernen', icon: 'bulb', label: 'Lernen' })}${tileHtml({ href: HKU, icon: 'book', label: 'Üben' })}${tileHtml({ soon: true, icon: 'check', label: 'Teste dich', tag: 'Bald' })}</div>`,
      true
    );
    return;
  }
  if (parts[2] === 'lernen') {
    showLernen(parts);
    return;
  }
  // ab hier gilt die bisherige Aufteilung (ksk / ueben / Bereich / Aufgabe) ohne die Themenebene
  parts.splice(1, 1);
  if (parts[1] === 'ueben' && parts.length === 2) {
    const tiles =
      AREAS.map(a => {
        const d = a.tasks.filter(id => best[id] != null).length;
        return tileHtml({
          href: HKU + '/' + a.id,
          icon: a.icon,
          label: a.name,
          small: a.name.length > 12,
          tag: a.tasks.length ? d + ' von ' + a.tasks.length + ' bearbeitet' : 'folgt'
        });
      }).join('');
    showMenu(
      `${backLink(HKB, 'Handelskalkulation')}<h2>Was möchten Sie üben?</h2><div class="tiles">${tiles}</div><div class="randbox"><button class="rand" id="btn-rand">Zufällige Aufgabe aus Vorwärts, Rückwärts und Kennzahlen</button></div>${saveHint()}`,
      true
    );
    $('btn-rand').addEventListener('click', () => {
      const ids = ['vorwaerts', 'rueckwaerts', 'kennzahlen'];
      const ar = ids[Math.floor(Math.random() * ids.length)];
      location.hash = HKU + '/' + ar + '/' + randomTaskId(ar);
    });
    return;
  }
  const area = areaOf(parts[2]);
  if (parts[1] !== 'ueben' || !area) {
    location.replace(HKU);
    return;
  }
  if (parts.length === 3 && area.children) {
    const tiles = area.children
      .map(a => {
        const d = a.tasks.filter(id => best[id] != null).length;
        return tileHtml({
          href: HKU + '/' + a.id,
          icon: a.icon,
          label: a.name.replace(/(zuschlag|faktor|spanne)$/, '&shy;$1'),
          small: a.name.length > 12,
          tag: d + ' von ' + a.tasks.length + ' bearbeitet'
        });
      })
      .join('');
    const rs = randStats(area.id);
    showMenu(
      `${backLink(HKU, 'Bereiche')}<h2>${esc(area.name)}</h2><div class="tiles">${tiles}</div><div class="randbox"><button class="rand" id="btn-rand">Zufällige Aufgabe aus allen Kennzahlen</button>${randPanel(rs)}</div>${saveHint()}`,
      true
    );
    $('btn-rand').addEventListener('click', () => {
      location.hash = HKU + '/' + area.id + '/' + randomTaskId(area.id);
    });
    return;
  }
  if (parts.length === 3) {
    const list = area.tasks
      .map((id, i) => {
        const t = TASKS[taskIndex(id)];
        const st = statusOf(id);
        return `<li><button data-id="${id}"><span class="nr">${i + 1}</span><span class="tt">${esc(t.title)}</span><span class="st ${st.cls}">${st.text}</span></button></li>`;
      })
      .join('');
    const rs = randStats(area.id);
    showMenu(
      (area.parent
        ? backLink(HKU + '/' + area.parent, 'Kennzahlen')
        : backLink(HKU, 'Bereiche')) +
        `<h2>${esc(area.name)}</h2>` +
        (area.tasks.length
          ? `<ul class="tasklist">${list}</ul>${area.tasks.some(id => prog.help[id]) ? '<p class="legend-h"><span class="st h">↻ gelb</span> mit aufgedeckter Lösung erreicht</p>' : ''}<div class="randbox"><button class="rand" id="btn-rand">Zufällige Aufgabe</button>${randPanel(rs)}</div>`
          : '<p class="sub" style="margin:0">Die Aufgaben dieses Bereichs folgen.</p>'),
      true
    );
    $('menu')
      .querySelectorAll('.tasklist button')
      .forEach(b =>
        b.addEventListener('click', () => {
          location.hash = HKU + '/' + area.id + '/' + b.dataset.id;
        })
      );
    const r = $('btn-rand');
    if (r)
      r.addEventListener('click', () => {
        location.hash = HKU + '/' + area.id + '/' + randomTaskId(area.id);
      });
    return;
  }
  const i = taskIndex(parts[3]);
  if (
    i < 0 ||
    !(
      area.tasks.includes(parts[3]) ||
      parts[3].startsWith('z-' + area.id + '-') ||
      (area.children && parts[3].startsWith('z-kz_'))
    )
  ) {
    location.replace(HKU + '/' + area.id);
    return;
  }
  cur = i;
  curPart = 0;
  showTask();
  igelSay(null);
  const sub = areaOf(TASKS[i].area) || area;
  $('hd-title').textContent = sub.name;
  document.title = 'LernIgel – ' + sub.name + ': ' + TASKS[i].title;
  renderAll();
}
$('btn-back').addEventListener('click', () => {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  location.hash = '#/' + p.slice(0, -1).join('/');
});
window.addEventListener('hashchange', route);
route();
