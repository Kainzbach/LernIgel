/* =====================================================================
   Darstellung
   ===================================================================== */
// Rundungshinweis automatisch aus den verlangten Kennzahlen
// Zahl und Einheit (%, €) dürfen nicht durch einen Zeilenumbruch getrennt werden
const nb = str => String(str).replace(/(\d) (%|€)/g, '$1\u00A0$2');
function roundingHint(t) {
  if (!t.noTable) return '';
  const by = {};
  (t.kz || []).forEach(id => {
    const d = KZ[id];
    (by[d.dec] = by[d.dec] || []).push(d.title);
  });
  const part = Object.keys(by)
    .sort((a, b) => a - b)
    .map(dec => {
      const names = by[dec];
      const list =
        names.length > 1 ? names.slice(0, -1).join(', ') + ' und ' + names[names.length - 1] : names[0];
      return list + ' auf ' + dec + ' Nachkommastellen';
    });
  return part.length ? 'Rundung: ' + part.join(', ') + '.' : '';
}
// Allgemeine Datentabelle in der Aufgabe: { head: [...], rows: [[...], ...] }; erste Spalte links, weitere rechtsbündig
function dataTableHtml(d) {
  const th = d.head.map((h, i) => `<th${i ? ' class="n"' : ''}>${esc(nb(h))}</th>`).join('');
  const tr = d.rows
    .map(r => '<tr>' + r.map((c, i) => `<td${i ? ' class="n"' : ''}>${esc(nb(c))}</td>`).join('') + '</tr>')
    .join('');
  return `<table class="datatab"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}
function kontoHtml(k) {
  const f = v => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const n = Math.max(k.soll.length, k.haben.length);
  const sum = k.haben.reduce((x, y) => x + y[1], 0);
  const side = (name, list, cls) => {
    let rows = '';
    list.forEach(a => {
      rows += `<tr><td>${esc(a[0])}</td><td class="n">${f(a[1])}</td></tr>`;
    });
    rows += `<tr class="sum"><td></td><td class="n">${f(sum)}</td></tr>`;
    return `<table class="konto-side ${cls}"><thead><tr><th colspan="2">${name}</th></tr></thead><tbody>${rows}</tbody></table>`;
  };
  // Breite Ansicht: eine Tabelle mit 4 Spalten, Zeilen von Soll und Haben liegen immer auf gleicher Höhe
  let wr = '';
  for (let i = 0; i < n; i++) {
    const a = k.soll[i],
      b = k.haben[i];
    wr += `<tr><td class="lb">${a ? esc(a[0]) : ''}</td><td class="n">${a ? f(a[1]) : ''}</td><td class="lb hv">${b ? esc(b[0]) : ''}</td><td class="n">${b ? f(b[1]) : ''}</td></tr>`;
  }
  wr += `<tr class="sum"><td></td><td class="n">${f(sum)}</td><td class="hv"></td><td class="n">${f(sum)}</td></tr>`;
  const wide = `<table class="konto-wide"><colgroup><col style="width:37%"><col style="width:20%"><col style="width:23%"><col style="width:20%"></colgroup><thead><tr><th colspan="2">Soll</th><th colspan="2" class="hv">Haben</th></tr></thead><tbody>${wr}</tbody></table>`;
  return `<div class="konto"><div class="konto-title">${esc(k.title)} <span style="font-weight:400">(Beträge in €)</span></div>${wide}<div class="konto-grid">${side('Soll', k.soll, 'so')}${side('Haben', k.haben, 'ha')}</div></div>`;
}
function renderTabs() {
  $('tabs').innerHTML = TASKS.map((t, i) => {
    const b = best[t.id];
    return `<button class="tab ${i === cur ? 'active' : ''}" data-i="${i}">${i + 1}. ${esc(t.title)}<small>${b != null ? 'Bestes Ergebnis: ' + b + ' %' : 'noch nicht bearbeitet'}</small></button>`;
  }).join('');
  document.querySelectorAll('.tab').forEach(el =>
    el.addEventListener('click', () => {
      cur = +el.dataset.i;
      renderAll();
    })
  );
}
function rowHtml(r) {
  const st = r.st || {};
  const opts = [
    ['', 'leer'],
    ['+', '+'],
    ['-', '−'],
    ['=', '=']
  ]
    .map(([v, l]) => `<option value="${v}"${r.sign === v ? ' selected' : ''}>${l}</option>`)
    .join('');
  return `<tr data-id="${r.id}">
    <td class="c-vz"><select class="vz ${st.sign || ''}${r.sign === '' ? ' vz-empty' : ''}" aria-label="Vorzeichen">${opts}</select></td>
    <td class="c-nm"><input class="nm ${st.name || ''}" placeholder="Bezeichnung" value="${esc(r.name)}" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Bezeichnung"></td>
    <td class="c-p c-p1"><input class="p1" placeholder="%" inputmode="decimal" value="${esc(r.p1)}" autocomplete="off" aria-label="Prozent links"></td>
    <td class="c-p c-p2"><input class="p2" placeholder="%" inputmode="decimal" value="${esc(r.p2)}" autocomplete="off" aria-label="Prozent rechts"></td>
    <td class="c-amt"><input class="amt ${st.amt || ''}" placeholder="Betrag" inputmode="decimal" value="${esc(r.amt)}" autocomplete="off" aria-label="Betrag"></td>
    <td class="c-act"><button class="ico up" title="Zeile darüber einfügen">+↑</button> <button class="ico del" title="Zeile löschen">✕</button></td>
  </tr>`;
}
const PCT_KEY = 'ksk-lernapp-pct';
let pctOn = true;
try {
  if (localStorage.getItem(PCT_KEY) === '0') pctOn = false;
} catch (e) {}
function setPct(on) {
  pctOn = on;
  document.querySelectorAll('#parts table.sheet').forEach(sh => sh.classList.toggle('nopct', !on));
  document.querySelectorAll('#parts .pct-cb').forEach(cb => {
    cb.checked = on;
  });
  try {
    localStorage.setItem(PCT_KEY, on ? '1' : '0');
  } catch (e) {}
  try {
    fitAll();
  } catch (e) {}
}
// Bezeichnungsspalte so breit wie der längste eingegebene Name (min. 7 Zeichen, max. so breit wie "Handlungskostenzuschlag")
let measureCtx = null;
function fitNameCol(card) {
  const sh = card.querySelector('table.sheet');
  if (!sh) return;
  const i = +card.dataset.part;
  const inp = sh.querySelector('.nm');
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  let font = '16px system-ui, sans-serif';
  if (inp) {
    const cs = getComputedStyle(inp);
    font = `${cs.fontSize} ${cs.fontFamily}`;
  }
  measureCtx.font = font;
  const w = s => measureCtx.measureText(s).width;
  let longest = 0;
  getRows(i).forEach(r => {
    longest = Math.max(longest, w(r.name));
  });
  const px = Math.ceil(Math.min(Math.max(longest, w('MMMMMMM')), w('Handlungskostenzuschlag'))) + 28;
  sh.querySelector('.col-nm').style.width = px + 'px';
  const wrap = sh.parentElement;
  const avail = wrap ? wrap.clientWidth : 9999;
  const np = sh.classList.contains('nopct');
  const c =
    avail && avail < 700 ? { vz: 66, p: 62, amt: 112, act: 68 } : { vz: 78, p: 84, amt: 140, act: 84 };
  sh.style.setProperty('--w-vz', c.vz + 'px');
  sh.style.setProperty('--w-p', c.p + 'px');
  sh.style.setProperty('--w-amt', c.amt + 'px');
  sh.style.setProperty('--w-act', c.act + 'px');
  sh.style.setProperty('--tw', c.vz + px + (np ? 0 : 2 * c.p) + c.amt + c.act + 'px');
}
function fitAll() {
  document.querySelectorAll('#parts .tcard').forEach(fitNameCol);
}
let resizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    try {
      fitAll();
    } catch (e) {}
  }, 120);
});
// Zeilen eines Teils neu zeichnen
function renderTable(i, focusId) {
  const card = document.querySelector(`#parts .tcard[data-part="${i}"]`);
  if (!card) return;
  card.querySelector('tbody.rows').innerHTML = getRows(i).map(rowHtml).join('');
  fitNameCol(card);
  if (focusId) {
    const el = card.querySelector(`tr[data-id="${focusId}"] .nm`);
    if (el) el.focus();
  }
}
const vrLive = s => {
  const v = evalExpr(s);
  return v == null ? '–' : fmtMax(v, 5);
};
function vrHtml(t) {
  const vr = t.vr || [];
  if (!vr.length) return '';
  const first = t.parts.find(p => p.table);
  const cur_ = vrByTask[t.id] || [];
  const items = vr
    .map(
      (v, i) =>
        `<div class="vr" data-i="${i}"><div class="vr-in"><input data-vr="${i}" value="${esc(cur_[i] || '')}" placeholder="z. B. 60/20" autocomplete="off" spellcheck="false" aria-label="Vorrechnung ${i + 1}"><span class="live">= ${vrLive(cur_[i])}</span></div></div>`
    )
    .join('');
  const lab = first && first.label ? ' zu ' + esc(first.label) : '';
  return `<div class="vr-box"><h4 class="vr-h">Vorrechnung${lab}</h4>${items}</div>`;
}
const altChoice = {};
function altMode(t, p, i) {
  const k = t.id + '#' + i;
  if (altChoice[k]) return altChoice[k];
  const ks = getKz(t.id, 'kw' + (p.sfx || ''));
  const kwF = ks.z.trim() || ks.n.trim() || ks.s.trim();
  const tf = getRows(i).some(r => r.name.trim() || r.amt.trim());
  return kwF && !tf ? 'kw' : 'table';
}
function kwBoxHtml(t, p) {
  const id = 'kw' + (p.sfx || '');
  const s = getKz(t.id, id);
  const st = s.st || {};
  return `<div class="kz kwbox" data-kz="${id}">
      <div class="frac"><div class="parts">
        <input data-f="z" class="${st.z || ''}" value="${esc(s.z)}" placeholder="Zähler" autocomplete="off" spellcheck="false" aria-label="Zähler">
        <div class="bar"></div>
        <input data-f="n" class="${st.n || ''}" value="${esc(s.n)}" placeholder="Nenner" autocomplete="off" spellcheck="false" aria-label="Nenner">
      </div><div class="eq">= <span class="live">${liveText(s)}</span></div></div>
    </div>`;
}
function ansBoxHtml(t, p) {
  const id = 'ans' + (p.sfx || '');
  const s = getKz(t.id, id);
  const st = s.st || {};
  return `<div class="kz ansbox" data-kz="${id}"><div class="sent"><span class="lbl">Der Bezugspreis beträgt:</span> <input data-f="s" class="${st.s || ''}" value="${esc(s.s)}" inputmode="decimal" autocomplete="off" aria-label="Ergebnis Bezugspreis"> <span class="unit">€</span></div></div>`;
}
function tableCardHtml(t, p, i, firstTable) {
  const title = partTitle(p);
  const mode = p.alt ? altMode(t, p, i) : 'table';
  return `<div class="card tcard" data-part="${i}">
    ${title ? `<h3 class="part-title">${esc(title)}</h3>` : ''}
    ${firstTable ? vrHtml(t) : ''}
    ${firstTable ? `<div class="pct-opt"><label><input type="checkbox" class="pct-cb"${pctOn ? ' checked' : ''}> Prozent-Hilfe anzeigen</label><span class="muted">Die Prozentspalten sind nur eine Hilfe und werden nicht bewertet.</span></div>` : ''}
    ${p.alt ? `<div class="altsw" role="group" aria-label="Weg wählen"><button type="button" class="alt-b${mode === 'table' ? ' on' : ''}" data-alt="table">Mit Tabelle</button><button type="button" class="alt-b${mode === 'kw' ? ' on' : ''}" data-alt="kw">Mit Kalkulationsfaktor</button></div>` : ''}
    ${p.alt ? `<div class="alt-kw"${mode === 'kw' ? '' : ' hidden'}>${kwBoxHtml(t, p)}</div>` : ''}
    <div class="alt-tab"${mode === 'kw' ? ' hidden' : ''}>
    <div class="bar-actions top"><button class="btn small btn-top" type="button">+ Zeile ganz oben</button><button class="btn small btn-fill" type="button" data-dir="down" title="Trägt die Bezeichnungen von oben nach unten ein" hidden>Schema ausfüllen ↓</button><button class="btn small btn-fill" type="button" data-dir="up" title="Trägt die Bezeichnungen von unten nach oben ein" hidden>Schema ausfüllen ↑</button></div>
    <div class="wrap">
      <table class="sheet${pctOn ? '' : ' nopct'}">
        <colgroup><col style="width:var(--w-vz,78px)"><col class="col-nm" style="width:110px"><col class="col-p" style="width:var(--w-p,84px)"><col class="col-p" style="width:var(--w-p,84px)"><col style="width:var(--w-amt,140px)"><col style="width:var(--w-act,84px)"></colgroup>
        <thead><tr><th>Vz</th><th>Bezeichnung</th><th class="hp">% (Hilfe)</th><th class="hp">% (Hilfe)</th><th>Betrag</th><th></th></tr></thead>
        <tbody class="rows">${getRows(i).map(rowHtml).join('')}</tbody>
      </table>
    </div>
    <div class="bar-actions"><button class="btn small btn-bottom" type="button">+ Zeile ganz unten</button></div>
    </div>
    ${p.ans ? ansBoxHtml(t, p) : ''}
  </div>`;
}
function kzCardHtml(t, p, withVr) {
  const multi = p.kz.length > 1;
  const title = partTitle(p);
  const head = title ? `<h3 class="part-title">${esc(title)}</h3>` : '';
  const blocks = p.kz
    .map(id => {
      const d = KZ[id];
      const s = getKz(t.id, id);
      const st = s.st || {};
      const sub = multi ? `<h4 class="kz-sub">${esc(d.title)}</h4>` : head ? '' : `<h3>${esc(d.title)}</h3>`;
      return `<div class="kz" data-kz="${id}">
      ${sub}
      <div class="frac">
        <div class="parts">
          <input data-f="z" class="${st.z || ''}" value="${esc(s.z)}" placeholder="Zähler" autocomplete="off" spellcheck="false" aria-label="Zähler ${esc(d.title)}">
          <div class="bar"></div>
          <input data-f="n" class="${st.n || ''}" value="${esc(s.n)}" placeholder="Nenner" autocomplete="off" spellcheck="false" aria-label="Nenner ${esc(d.title)}">
        </div>
        <div class="eq">= <span class="live">${liveText(s)}</span></div>
      </div>
      <div class="sent"><span class="lbl">${esc(d.sentence)}</span> <input data-f="s" class="${st.s || ''}" value="${esc(s.s)}" inputmode="decimal" autocomplete="off" aria-label="Ergebnis ${esc(d.title)}"> <span class="unit">${esc(d.unit)}</span></div>
    </div>`;
    })
    .join('');
  return `<div class="card kcard">${head}${withVr ? vrHtml(t) : ''}${blocks}</div>`;
}
// Alle Teile einer Aufgabe untereinander
function renderParts(t) {
  const items = [];
  let firstTable = true;
  let vrDone = t.parts.some(p => p.table && !t.noTable);
  t.parts.forEach((p, i) => {
    if (p.table && !t.noTable) {
      items.push(tableCardHtml(t, p, i, firstTable));
      firstTable = false;
    } else if (p.kz && p.kz.length) {
      items.push(kzCardHtml(t, p, !vrDone));
      vrDone = true;
    }
  });
  $('parts').innerHTML = items.join('');
  fitAll();
  document.querySelectorAll('#parts .btn-fill').forEach(b => {
    b.hidden = !helpOn();
  });
}
// Zufällige Aufgaben sind nach der Abgabe geschlossen; das Ergebnis wird aus den gespeicherten Eingaben wieder aufgebaut
function applyLock(t) {
  const locked = isRandom(t) && best[t.id] != null;
  $('v-task').classList.toggle('locked', locked);
  $('parts').inert = locked;
  $('btn-check').hidden = locked;
  $('btn-reset').hidden = locked;
  document.querySelectorAll('#parts .btn-fill').forEach(b => {
    b.hidden = locked || !helpOn();
  });
  const note = $('lock-note');
  note.hidden = !locked;
  if (locked) {
    if (!lastScore[t.id]) lastScore[t.id] = makeResult(t);
    const ra = location.hash.replace(/^#\/?/, '').split('/')[3] || t.area;
    note.innerHTML = `Diese Zufallsaufgabe ist abgegeben (${best[t.id]} %). <a href="${HKU}/${ra}">Zu den Aufgaben</a> · <button class="btn small" id="btn-next-rand" type="button">Nächste Zufallsaufgabe</button>`;
    $('btn-next-rand').addEventListener('click', () => {
      location.hash = HKU + '/' + ra + '/' + randomTaskId(ra);
    });
  }
}
function renderResult() {
  const t = normTask(TASKS[cur]);
  const res = lastScore[t.id];
  $('result').classList.toggle('show', !!res);
  $('res-table-wrap').style.display = t.noTable || tableParts(t) > 1 || t.kzFirst ? 'none' : '';
  $('res-multi').innerHTML = (res && res.multiHtml) || '';
  $('legend').textContent = t.noTable
    ? 'Bei Kennzahlen zählen Zähler, Nenner und Ergebnis je 1 Punkt. Ein Wert, der aus Ihren eigenen Vorwerten folgerichtig berechnet ist, zählt als richtig (gelb). Steht im Zähler nur eine Zahl statt der Rechnung, gibt es dafür keinen Punkt.'
    : 'Pro Tabellenzeile gibt es 4 Punkte: Bezeichnung, Vorzeichen, Betrag, Reihenfolge. Bei Kennzahlen zählen Zähler, Nenner und Ergebnis je 1 Punkt. Ein Wert, der aus Ihren eigenen Vorwerten folgerichtig berechnet ist, zählt als richtig (gelb). Steht im Zähler nur eine Zahl statt der Rechnung, gibt es dafür keinen Punkt. Prozente in der Tabelle sind nur eine Hilfe und fließen nicht in die Punkte ein.';
  const tp = t.parts.find(p => p.table);
  const tt = tp && tableParts(t) <= 1 && !t.kzFirst ? partTitle(tp) : '';
  $('res-table-title').textContent = tt;
  $('res-table-title').style.display = tt ? '' : 'none';
  if (res) {
    $('score-big').textContent = res.pts + ' von ' + res.max + ' Punkten (' + res.pct + ' %)';
    $('score-note').textContent = grade(res.pct);
    $('score-bar').style.width = res.pct + '%';
    $('score-parts').innerHTML = (res.parts || [])
      .filter(x => x.title)
      .map(
        x => `<span class="${x.pts === x.max ? 't-ok' : ''}">${esc(x.title)}: ${x.pts} von ${x.max}</span>`
      )
      .join('');
    $('res-vr').innerHTML = res.vrHtml || '';
    $('res-rows').innerHTML = res.rowsHtml;
    $('res-kz').innerHTML = res.kzHtml || '';
    $('res-way').innerHTML = res.wayHtml || '';
    const hn = $('res-help');
    hn.hidden = !res.hideNote || !!prog.help[t.id];
    hn.textContent =
      'Falsche Zeilen zeigen die Lösung erst nach einem Klick auf „aufdecken“. Wenn Sie eine Lösung aufdecken, zählen spätere Verbesserungen weiter, werden aber gelb mit ↻ markiert.';
    $('res-notes').innerHTML = res.notesHtml;
    $('res-fehler').innerHTML = fehlerHinweisHtml();
  }
}
// Text mit Teilaufgaben: "a) ..." als Block mit hängendem Einzug, graue Hinweise (▸) gehören zum Teil
function textHtml(seg) {
  const note = s => esc(nb(s)).replace(/(^|\n)▸ ([^\n]*)/g, '<span class="tnote">$2</span>');
  return seg
    .split('\n\n')
    .map(par => {
      const m = /^([a-z])\) ([\s\S]*)$/.exec(par);
      if (!m) return note(par);
      return `<div class="tpart"><span class="tl">${m[1]})</span><div class="tb">${note(m[2])}</div></div>`;
    })
    .join('\n\n')
    .replace(/<\/div>\n\n(?=<div class="tpart">)/g, '</div>');
}
function renderAll() {
  const t = normTask(TASKS[cur]);
  renderTabs();
  $('task-text').innerHTML = t.text
    .split(/(\{\{konto\}\}|\{\{tabelle\}\})/)
    .map(seg =>
      seg === '{{konto}}'
        ? t.konto
          ? kontoHtml(t.konto)
          : ''
        : seg === '{{tabelle}}'
          ? t.tabelle
            ? dataTableHtml(t.tabelle)
            : ''
          : textHtml(seg)
    )
    .join('');
  $('task-hint').textContent = roundingHint(t);
  renderParts(t);
  applyLock(t);
  renderResult();
}
