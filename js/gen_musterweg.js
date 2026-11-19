/* =====================================================================
   Musterweg: erklärende Rechenzeilen unter der Lösung
   ===================================================================== */

/* ---------- Musterweg ---------- */
function wayLine(k, d, t, tr, c) {
  const f = eur,
    U = tr;
  const sk = (c.ks || 0) + (c.vp || 0);
  const pr = (a, p) => `${f(a)} × ${fmtPct(p)} % = ${f(pc(a, p))}`;
  const v = {
    LR: () => pr(U.LEP, c.lr),
    ZEP: () => `${f(U.LEP)} − ${f(U.LR)} = ${f(U.ZEP)}`,
    LS: () => pr(U.ZEP, c.ls),
    BEP: () => `${f(U.ZEP)} − ${f(U.LS)} = ${f(U.BEP)}`,
    BZK: () => `fester Betrag: ${f(U.BZK)}`,
    BP: () => `${f(U.BEP)} + ${f(U.BZK)} = ${f(U.BP)}`,
    HK: () => pr(U.BP, c.hk),
    SKP: () => `${f(U.BP)} + ${f(U.HK)} = ${f(U.SKP)}`,
    G: () => pr(U.SKP, c.g),
    BVP: () => `${f(U.SKP)} + ${f(U.G)} = ${f(U.BVP)}`,
    ZVP: () => `${f(U.BVP)} ÷ ${fmtPct(100 - sk)} × 100 = ${f(U.ZVP)}`,
    KS: () => pr(U.ZVP, c.ks),
    VP: () => pr(U.ZVP, c.vp),
    LVP: () => `${f(U.ZVP)} ÷ ${fmtPct(100 - c.kr)} × 100 = ${f(U.LVP)}`,
    KR: () => pr(U.LVP, c.kr)
  };
  const r = {
    KR: () => pr(U.LVP, c.kr),
    ZVP: () => `${f(U.LVP)} − ${f(U.KR)} = ${f(U.ZVP)}`,
    KS: () => pr(U.ZVP, c.ks),
    VP: () => pr(U.ZVP, c.vp),
    BVP: () => `${f(U.ZVP)}${U.KS ? ' − ' + f(U.KS) : ''}${U.VP ? ' − ' + f(U.VP) : ''} = ${f(U.BVP)}`,
    SKP: () => `${f(U.BVP)} ÷ ${100 + c.g} × 100 = ${f(U.SKP)}`,
    G: () => `${f(U.BVP)} − ${f(U.SKP)} = ${f(U.G)}`,
    BP: () => `${f(U.SKP)} ÷ ${100 + c.hk} × 100 = ${f(U.BP)}`,
    HK: () => `${f(U.SKP)} − ${f(U.BP)} = ${f(U.HK)}`,
    BZK: () => `fester Betrag: ${f(U.BZK)}`,
    BEP: () => `${f(U.BP)} − ${f(U.BZK)} = ${f(U.BEP)}`,
    ZEP: () => `${f(U.BEP)} ÷ ${100 - c.ls} × 100 = ${f(U.ZEP)}`,
    LS: () => `${f(U.ZEP)} − ${f(U.BEP)} = ${f(U.LS)}`,
    LEP: () => `${f(U.ZEP)} ÷ ${100 - c.lr} × 100 = ${f(U.LEP)}`,
    LR: () => `${f(U.LEP)} − ${f(U.ZEP)} = ${f(U.LR)}`
  };
  const dd = { G: () => `${f(U.BVP)} − ${f(U.SKP)} = ${f(U.G)}` };
  const fn = d === 'd' ? dd[k] : d === 'r' ? r[k] : v[k];
  try {
    return fn ? fn() : '';
  } catch (e) {
    return '';
  }
}
function buildWayHtml(task) {
  const tr = truth(task);
  const c = task.ctx || task.c || {};
  const li = [];
  (task.pre || []).forEach(x => li.push(`<tr><td colspan="2">${esc(nb(x))}</td></tr>`));
  const tableWay = () => {
    if (!task.noTable) {
      const keys = rangeKeys(task);
      const given = task.given || [];
      task.steps
        .map(s => s[0])
        .filter(k => (keys.includes(k) && tr[k] !== 0) || given.includes(k))
        .forEach(k => {
          if (!SCH[k]) return;
          const txt =
            (given.includes(k) ? '' : wayLine(k, task.dirOf ? task.dirOf(k) : 'v', task, tr, task.c)) ||
            'gegeben';
          li.push(`<tr><td><strong>${esc(SCH[k].alias[0])}</strong></td><td>${esc(nb(txt))}</td></tr>`);
        });
    }
  };
  const sfxHtml = () => {
    (task.parts || [])
      .filter(pp => pp.table && pp.sfx)
      .forEach(pp => {
        const x = pp.sfx;
        const tr2 = {};
        Object.keys(tr).forEach(k => {
          if (sfxOf(k) === x) tr2[baseKey(k)] = tr[k];
        });
        li.push(`<tr><td colspan="2"><strong>${esc(partTitle(pp))}</strong></td></tr>`);
        rangeKeysFor(task, pp)
          .filter(k => tr2[k] !== 0 || (pp.given || []).includes(k))
          .forEach(k => {
            const txt = ((pp.given || []).includes(k) ? '' : wayLine(k, 'r', task, tr2, task.c)) || 'gegeben';
            li.push(`<tr><td><strong>${esc(SCH[k].alias[0])}</strong></td><td>${esc(nb(txt))}</td></tr>`);
          });
      });
    (task.parts || [])
      .filter(pp => pp.alt)
      .forEach(pp => {
        const x = pp.sfx || '';
        const fT = tr.LVP / tr.BP;
        li.push(`<tr><td colspan="2"><strong>Kurzweg über den Kalkulationsfaktor</strong></td></tr>`);
        li.push(
          `<tr><td><strong>Kalkulationsfaktor</strong></td><td>${esc(nb(eur(tr.LVP) + ' ÷ ' + eur(tr.BP) + ' = ' + fmtDec(Math.round(fT * 1e4) / 1e4, 4)))}</td></tr>`
        );
        li.push(
          `<tr><td><strong>Bezugspreis</strong></td><td>${esc(nb(eur(pp.kwPrice) + ' ÷ ' + fmtDec(Math.round(fT * 1e4) / 1e4, 4) + ' ≈ ' + eur(tr['BP' + x]) + ' (Abweichung bis 5 Cent möglich)'))}</td></tr>`
        );
      });
  };
  const kzHtmlWay = ids => {
    ids.forEach(id => {
      const d = KZ[id];
      const base = task.kzBase || 'LVP';
      const z = d.num(k => tr[k], base),
        n = d.den(k => tr[k], base);
      const rd = Math.pow(10, d.dec);
      const zw = d.wnum ? d.wnum(k => tr[k], base) : fmtMax(z, 4);
      li.push(
        `<tr><td><strong>${esc(d.title)}</strong></td><td>${esc(nb(zw + ' ÷ ' + fmtMax(n, 4) + ' = ' + fmtDec(Math.round((z / n) * rd) / rd, d.dec) + (d.unit ? ' ' + d.unit : '')))}</td></tr>`
      );
    });
  };
  const firstSfx = (task.parts || []).findIndex(pp => pp.table && pp.sfx);
  const kzBefore = (task.parts || [])
    .filter((pp, pi) => pp.kz && pp.kz.length && (firstSfx < 0 || pi < firstSfx))
    .reduce((x, pp) => x.concat(pp.kz), []);
  const kzAfter = (task.parts || [])
    .filter((pp, pi) => pp.kz && pp.kz.length && firstSfx >= 0 && pi > firstSfx)
    .reduce((x, pp) => x.concat(pp.kz), []);
  if (task.kzFirst) kzHtmlWay(kzBefore);
  tableWay();
  if (!task.kzFirst) kzHtmlWay(kzBefore);
  sfxHtml();
  kzHtmlWay(kzAfter);
  return `<h4>Musterweg</h4><table class="res way"><tbody>${li.join('')}</tbody></table>`;
}
