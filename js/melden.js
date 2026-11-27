/* =====================================================================
   Melden: Fehler oder Wunsch melden (Mail, GitHub oder Text kopieren).
   Der Knopf „Melden“ steht unten rechts auf jeder Seite. Die Angaben zur Seite und zur Aufgabe werden automatisch
   eingetragen. Nichts wird von der Seite aus gesendet, erst der Klick auf Mail, GitHub oder Kopieren gibt es weiter.
   ===================================================================== */
const MEL_MAIL = ['support', 'lernigel.de'].join('@'); // zerlegt, damit Programme die Adresse nicht einfach auslesen
const MEL_LETTERS = 'ACEFHJKMNPRTUVWXY'; // ohne Buchstaben, die wie Zahlen aussehen
const MEL_MAXTEXT = 1000;
const MEL_MAXMAIL = 1900; // längere Mail-Links öffnen manche Programme nicht
const MEL_MAXGITHUB = 6000;
const MEL_LEVELS = [
  { id: 'keine', name: 'Keine', desc: 'Nur die Version' },
  {
    id: 'standard',
    name: 'Standard',
    desc: 'Seite, Aufgabe, Ihre Eingaben, Version, Fenstergröße, Hell/Dunkel, Browser, Betriebssystem'
  },
  {
    id: 'alles',
    name: 'Alles',
    desc:
      'Zusätzlich <span class="mel-red">Gerätemodell, Sprache, Zeitzone</span>, Bildschirm, Pixeldichte, Touch, Online-Status, Verbindungstyp, Arbeitsspeicher, Prozessorkerne'
  }
];
const mel = { art: 'fehler', level: 1, text: '', id: '', ctx: null, model: '–', confirmed: false, locked: false };

function melDatum() {
  const d = new Date(),
    p = n => String(n).padStart(2, '0');
  return p(d.getDate()) + p(d.getMonth() + 1) + p(d.getFullYear() % 100);
}
function melNeueId() {
  let s = '';
  for (let i = 0; i < 3; i++) s += MEL_LETTERS[Math.floor(Math.random() * MEL_LETTERS.length)];
  return s;
}
const melKennung = () => (mel.art === 'fehler' ? 'F' : 'W') + melDatum() + '-' + mel.id;
const melBetreff = () => (mel.art === 'fehler' ? 'Fehler' : 'Wunsch') + ': ' + melKennung() + '; v.' + VERSION;

// Eingaben der gerade offenen Aufgabe
function melHkEingaben(id) {
  const out = [];
  const zeile = r =>
    [r.sign, r.name, r.p1 ? r.p1 + ' %' : '', r.p2 ? r.p2 + ' %' : '', r.amt ? r.amt + ' €' : '']
      .filter(Boolean)
      .join(' ');
  Object.keys(rowsByTask)
    .filter(k => k === id || k.indexOf(id + '#') === 0)
    .forEach(k => {
      const z = (rowsByTask[k] || []).filter(r => r.name || r.amt || r.p1 || r.p2).map(zeile);
      if (z.length) out.push((k === id ? 'Schema' : 'Schema ' + k.slice(id.length + 1)) + ': ' + z.join(' | '));
    });
  const vr = (vrByTask[id] || []).filter(Boolean);
  if (vr.length) out.push('Vorrechnung: ' + vr.join(' | '));
  Object.entries(kzState[id] || {}).forEach(([k, v]) => {
    if (v.z || v.n || v.s)
      out.push(k + ': Zähler ' + (v.z || '–') + ', Nenner ' + (v.n || '–') + ', Ergebnis ' + (v.s || '–'));
  });
  return out.join('\n');
}
function melKaEingaben(id) {
  // nur beantwortete Beispiele; ein halb beantwortetes zeigt für die fehlende Hälfte einen Strich
  return kaGet(id)
    .map((a, i) => (a.vf || a.eg ? i + 1 + ': ' + (a.vf || '–') + '/' + (a.eg || '–') : ''))
    .filter(Boolean)
    .join(' · ');
}
// Wo bin ich gerade? Seite, Aufgabe, Status und Eingaben
function melKontext() {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const c = { wo: 'Start', aufgabe: '–', status: '–', eingaben: '', hash: location.hash || '#/' };
  try {
    if (p[0] === 'daten') c.wo = 'Meine Daten';
    else if (p[0] === 'ksk') {
      if (p.length === 1) c.wo = 'Kaufmännische Steuerung und Kontrolle';
      else if (p[1] === 'kostenarten') {
        c.wo = 'Kostenarten';
        if (p[2] === 'ueben') {
          c.wo += ' › Üben';
          if (p[3]) {
            const t = kaTask(p[3]);
            if (t) {
              c.wo += ' › ' + t.title;
              c.aufgabe = p[3];
              c.status = kaLast[p[3]] ? 'geprüft' : 'offen';
              c.eingaben = melKaEingaben(p[3]);
            }
          }
        }
      } else if (p[1] === 'handelskalkulation') {
        c.wo = 'Handelskalkulation';
        if (p[2] === 'ueben') {
          c.wo += ' › Üben';
          const ar = areaOf(p[3]);
          if (ar) c.wo += ' › ' + ar.name;
          if (p[4]) {
            const i = ensureTask(p[4]);
            if (i >= 0) {
              const t = TASKS[i];
              c.wo += ' › ' + t.title;
              c.aufgabe = t.id;
              c.status = lastScore[t.id] ? 'geprüft' : 'offen';
              c.eingaben = melHkEingaben(t.id);
            }
          }
        }
      }
    }
  } catch (e) {}
  return c;
}
function melBetriebssystem(ua) {
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Linux|X11/i.test(ua)) return 'Linux';
  return '–';
}
// Alle Zeilen der Meldung; rot = Angaben, die auf ein bestimmtes Gerät oder einen ungefähren Ort hindeuten
function melZeilen() {
  const n = navigator,
    ua = n.userAgent || '',
    c = mel.ctx,
    lv = MEL_LEVELS[mel.level].id;
  const browser = { t: 'Browser: ' + ua };
  const z = [{ t: 'Kennung: ' + melKennung() }, { t: 'Version: v.' + VERSION }];
  if (lv === 'keine') return z;
  const dark = document.documentElement.dataset.theme === 'dark';
  z.push({ t: 'Seite: ' + c.wo });
  z.push({ t: 'Aufgabe: ' + c.aufgabe + ' · Status: ' + c.status });
  z.push({ t: 'Fenster: ' + innerWidth + ' × ' + innerHeight + ' · ' + (dark ? 'Dunkel' : 'Hell') });
  z.push({ t: 'Betriebssystem: ' + melBetriebssystem(ua) });
  if (c.aufgabe !== '–') z.push({ t: 'Eingaben: ' + (c.eingaben ? (c.eingaben.indexOf('\n') >= 0 ? '\n' : '') + c.eingaben : 'keine') });
  z.push({ t: 'Adresse: ' + c.hash });
  if (lv === 'standard') return z.concat([browser]);
  const cn = n.connection || {};
  z.push({ t: 'Gerätemodell: ' + mel.model, red: true });
  z.push({ t: 'Sprache: ' + (n.language || '–'), red: true });
  let tz = '–';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '–';
  } catch (e) {}
  z.push({ t: 'Zeitzone: ' + tz, red: true });
  z.push({
    t:
      'Bildschirm: ' + screen.width + ' × ' + screen.height + ' · Pixeldichte ' + (window.devicePixelRatio || 1) + ' · Touch: ' + (n.maxTouchPoints > 0 ? 'ja' : 'nein')
  });
  z.push({
    t:
      'Online: ' + (n.onLine === false ? 'nein' : 'ja') + ' · Verbindung: ' + (cn.effectiveType || '–') + ' · Arbeitsspeicher: ' + (n.deviceMemory ? '≥ ' + n.deviceMemory + ' GB' : '–') + ' · Kerne: ' + (n.hardwareConcurrency || '–')
  });
  return z.concat([browser]);
}
function melKoerper() {
  return mel.text.trim() + '\n\n—\n' + melZeilen().map(x => x.t).join('\n');
}
const melKomplett = () => 'Betreff: ' + melBetreff() + '\n\n' + melKoerper();
const melMailUrl = () =>
  'mailto:' + MEL_MAIL + '?subject=' + encodeURIComponent(melBetreff()) + '&body=' + encodeURIComponent(melKoerper().replace(/\n/g, '\r\n'));
const melGitHubUrl = () => ISSUE_URL + '?' + new URLSearchParams({ title: melBetreff(), body: melKoerper() }).toString();

/* ---------- Fenster ---------- */
function melBau() {
  if (document.getElementById('mel')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'mel-btn';
  btn.className = 'mel-btn';
  btn.textContent = 'Melden';
  btn.setAttribute('aria-label', 'Fehler oder Wunsch melden');
  document.body.appendChild(btn);
  const o = document.createElement('div');
  o.className = 'overlay';
  o.id = 'mel';
  o.innerHTML =
    '<div class="dialog mel" role="dialog" aria-modal="true" aria-labelledby="mel-titel">' +
    '<h2 id="mel-titel">Melden<button type="button" class="mel-x" id="mel-x" aria-label="Schließen">✕</button></h2>' +
    '<div class="mel-q">Was möchten Sie melden?</div>' +
    '<div class="mel-opts mel-art" id="mel-art">' +
    '<label><input type="radio" name="mel-art" value="fehler"><span>Fehler</span></label>' +
    '<label><input type="radio" name="mel-art" value="wunsch"><span>Wunsch</span></label></div>' +
    '<div class="mel-q">Wie viele Angaben sollen mitgeschickt werden?</div>' +
    '<div class="mel-opts" id="mel-lv">' +
    MEL_LEVELS.map(
      (l, i) =>
        `<label><input type="radio" name="mel-lv" value="${i}"><span>${l.name}<small>${l.desc}</small></span></label>`
    ).join('') +
    '</div>' +
    '<p class="mel-note">Die Angaben werden erst weitergegeben, wenn Sie die Meldung senden oder kopieren.</p>' +
    '<div class="mel-q" id="mel-ql"></div>' +
    '<textarea id="mel-text" maxlength="' + MEL_MAXTEXT + '" rows="4" aria-labelledby="mel-ql"></textarea>' +
    '<div class="mel-cnt" id="mel-cnt"></div>' +
    '<div class="mel-q">Vorschau der Meldung</div><pre class="mel-pv" id="mel-pv"></pre>' +
    '<div class="mel-bt"><button type="button" class="btn primary" id="mel-copy">Text kopieren</button>' +
    '<button type="button" class="btn" id="mel-mail">Per Mail senden</button>' +
    '<button type="button" class="btn" id="mel-gh">Per GitHub senden</button></div>' +
    '<p class="mel-note" id="mel-lang" hidden>Zu lang für den Link, bitte „Text kopieren“ nutzen.</p>' +
    '<p class="mel-note mel-priv">Mit der Meldung erfahren wir Ihre Mail-Adresse und die gezeigten Angaben. Wir nutzen sie nur, um Ihr Anliegen zu bearbeiten.</p></div>';
  document.body.appendChild(o);
  const w = document.createElement('div');
  w.className = 'overlay mel-wo';
  w.id = 'mel-warn';
  w.innerHTML =
    '<div class="dialog mel-warn" role="alertdialog" aria-modal="true" aria-labelledby="mel-wt">' +
    '<h2 id="mel-wt">Ohne Angaben dauert es länger</h2>' +
    '<p>Wir können Ihr Anliegen schwerer finden, nachvollziehen und beheben, da uns Angaben fehlen. Das verzögert alles.</p>' +
    '<div class="row"><button type="button" class="btn" id="mel-w-std">Standard wählen</button>' +
    '<button type="button" class="btn primary" id="mel-w-ok">Trotzdem ohne Angaben</button></div></div>';
  document.body.appendChild(w);

  btn.addEventListener('click', () => melOeffnen());
  $('mel-x').addEventListener('click', melSchliessen);
  $('mel-art').addEventListener('change', e => {
    mel.art = e.target.value;
    melAnzeigen();
  });
  $('mel-lv').addEventListener('change', e => {
    const neu = +e.target.value;
    if (neu === 0 && mel.level !== 0 && !mel.confirmed) {
      melAnzeigen(); // Auswahl bleibt, bis das rote Fenster bestätigt ist
      melWarnung();
      return;
    }
    if (neu !== 0) mel.confirmed = false;
    mel.level = neu;
    melAnzeigen();
  });
  $('mel-text').addEventListener('input', e => {
    mel.text = e.target.value;
    melAnzeigen();
  });
  $('mel-copy').addEventListener('click', melKopieren);
  $('mel-mail').addEventListener('click', () => {
    if (melOk()) location.href = melMailUrl();
  });
  $('mel-gh').addEventListener('click', () => {
    if (melOk()) window.open(melGitHubUrl(), '_blank', 'noopener');
  });
  $('mel-w-std').addEventListener('click', () => melWarnungZu(false));
  $('mel-w-ok').addEventListener('click', () => melWarnungZu(true));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('mel-warn').classList.contains('show')) {
      if (!mel.locked) melWarnungZu(false);
      e.preventDefault();
    } else if ($('mel').classList.contains('show')) melSchliessen();
  });
  // Auf dem Handy den Knopf ausblenden, solange man tippt, damit er nichts verdeckt
  document.addEventListener('focusin', e => {
    if (navigator.maxTouchPoints > 0 && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.closest('#mel'))
      btn.classList.add('hide');
  });
  document.addEventListener('focusout', () => btn.classList.remove('hide'));
  // Ist der Taschenrechner offen, rutscht der Knopf darüber
  const calc = $('calc');
  if (calc && window.ResizeObserver)
    new ResizeObserver(() => document.documentElement.style.setProperty('--calc-h', calc.offsetHeight + 'px')).observe(calc);
  // Links „Melden“ (im Hinweis unter den Aufgaben)
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-melden]');
    if (!a) return;
    e.preventDefault();
    melOeffnen(a.getAttribute('data-melden'));
  });
}
function melOeffnen(art) {
  mel.ctx = melKontext();
  mel.id = melNeueId();
  mel.confirmed = false;
  if (art === 'fehler' || art === 'wunsch') mel.art = art;
  if (mel.level === 0) mel.level = 1;
  mel.model = '–';
  try {
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues)
      navigator.userAgentData.getHighEntropyValues(['model']).then(v => {
        if (v && v.model) {
          mel.model = v.model;
          melAnzeigen();
        }
      });
  } catch (e) {}
  $('mel').classList.add('show');
  melAnzeigen();
  $('mel-text').focus();
}
function melSchliessen() {
  $('mel').classList.remove('show');
}
function melOk() {
  return mel.text.trim().length > 0;
}
function melAnzeigen() {
  document.querySelectorAll('input[name="mel-art"]').forEach(r => (r.checked = r.value === mel.art));
  document.querySelectorAll('input[name="mel-lv"]').forEach(r => (r.checked = +r.value === mel.level));
  document.querySelectorAll('#mel-lv label').forEach((l, i) => l.classList.toggle('on', i === mel.level));
  document.querySelectorAll('#mel-art label').forEach(l => l.classList.toggle('on', l.querySelector('input').checked));
  $('mel-ql').textContent = mel.art === 'fehler' ? 'Was stimmt nicht?' : 'Was wünschen Sie sich?';
  if ($('mel-text').value !== mel.text) $('mel-text').value = mel.text;
  $('mel-cnt').textContent = mel.text.length + ' / ' + MEL_MAXTEXT;
  const pv = $('mel-pv');
  pv.innerHTML =
    esc('Betreff: ' + melBetreff()) +
    '\n\n' +
    esc(mel.text.trim() || '(Ihr Text)') +
    '\n\n—\n' +
    melZeilen()
      .map(x => (x.red ? '<span class="mel-red">' + esc(x.t) + '</span>' : esc(x.t)))
      .join('\n');
  const ok = melOk();
  $('mel-copy').disabled = !ok;
  const langMail = melMailUrl().length > MEL_MAXMAIL,
    langGh = melGitHubUrl().length > MEL_MAXGITHUB;
  $('mel-mail').disabled = !ok || langMail;
  $('mel-gh').disabled = !ok || langGh;
  $('mel-lang').hidden = !(ok && (langMail || langGh));
}
function melKopieren() {
  if (!melOk()) return;
  const t = melKomplett();
  const fertig = () => {
    const b = $('mel-copy');
    b.textContent = 'Kopiert ✓';
    clearTimeout(melKopieren.t);
    melKopieren.t = setTimeout(() => (b.textContent = 'Text kopieren'), 5000);
  };
  const notfall = () => {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      fertig();
    } catch (e) {}
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(fertig, notfall);
  else notfall();
}
/* ---------- Rotes Fenster bei „Keine“: 2 Sekunden gesperrt ---------- */
function melWarnung() {
  const w = $('mel-warn'),
    ok = $('mel-w-ok'),
    std = $('mel-w-std');
  let s = 2;
  mel.locked = true;
  const set = () => {
    ok.disabled = std.disabled = s > 0;
    ok.textContent = 'Trotzdem ohne Angaben' + (s > 0 ? ' (' + s + ')' : '');
    std.textContent = 'Standard wählen' + (s > 0 ? ' (' + s + ')' : '');
  };
  set();
  w.classList.add('show');
  clearInterval(melWarnung.t);
  melWarnung.t = setInterval(() => {
    s--;
    set();
    if (s <= 0) {
      clearInterval(melWarnung.t);
      mel.locked = false;
      ok.focus();
    }
  }, 1000);
}
function melWarnungZu(ohne) {
  if (mel.locked) return;
  $('mel-warn').classList.remove('show');
  if (ohne) {
    mel.level = 0;
    mel.confirmed = true;
  } else {
    mel.level = 1;
    mel.confirmed = false;
  }
  melAnzeigen();
}
melBau();
