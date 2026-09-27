// FNCS 2020 из Liquipedia (tools/measured/liqui-2020/): на Tracker этих сезонов нет (у C2S2 — только
// финалы). Три сезона, формат — по шаблону слота страницы: C2S2 — дуо, C2S3 — соло, C2S4 — трио.
//   Q (L) — финалы недель / квалификаторов (лучшее место), S (P) — хиты, GF (G) — Гранд-финал.
// Очков на Liquipedia нет — очки, игры и элимы оценкой по месту (рейтинг карточки читает место).
// Ещё: CC_MX_PAY_2020 (финалы, на игрока), календарь по датам страниц (CC_2020_DATES) и число
// команд финала/хитов по регионам (CC_2020_SHAPE) — для спеки сезона.
//   node tools/build-2020-rows.js
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'measured', 'liqui-2020');
const REG = { 'Europe': 'EU', 'North America East': 'NAC', 'North America West': 'NAW', 'Brazil': 'BR', 'Asia': 'ASIA', 'Middle East': 'ME', 'Oceania': 'OCE' };
const SEASONS = { i1: 2, i2: 3, i3: 4 };
const files = fs.readdirSync(DIR).filter(f => /^Fortnite Champion Series__Chapter 2__Season [234]__/.test(f));
function parse(file) {
  const t = fs.readFileSync(path.join(DIR, file), 'utf8'), rows = [];
  const re = /\{\{prize pool slot( duos?| trios?| squads?)?\s*\|([^}]*)\}\}/g; let m, size = 1;
  while ((m = re.exec(t))) {
    const kind = (m[1] || '').trim(); size = /duo/.test(kind) ? 2 : /trio/.test(kind) ? 3 : /squad/.test(kind) ? 4 : 1;
    const parts = m[2].split('|').map(x => x.trim());
    const place = +((parts.find(x => /^place=/.test(x)) || '').split('=')[1] || 0);
    const usd = +((parts.find(x => /^usdprize=/.test(x)) || '').split('=')[1] || '0').replace(/,/g, '');
    const names = parts.filter(x => x && !/=/.test(x)).slice(0, size);
    const flags = names.map((_, i) => ((parts.find(x => x.startsWith('flag1p' + (i + 1) + '=') || (size === 1 && x.startsWith('flag1='))) || '').split('=')[1] || '') || null);
    if (place && names.length === size) rows.push({ place, usd, names, flags });
  }
  const sdate = (/\|sdate=([0-9-]+)/.exec(t) || [])[1] || (/\|date=([0-9-]+)/.exec(t) || [])[1] || null;
  const edate = (/\|edate=([0-9-]+)/.exec(t) || [])[1] || sdate;
  return { rows: rows.sort((a, b) => a.place - b.place), size, sdate, edate };
}
const q = s => JSON.stringify(String(s));
// Оценка строки по месту в лобби из n: очки ~ линейно от места, 6 игр на вечер (финал — 12).
const est = (place, n, games) => { const top = games >= 12 ? 420 : 160; const pts = Math.max(5, Math.round(top * (1 - (place - 1) / Math.max(n, 2)))); return [place, pts, games, place === 1 ? 1 : 0, Math.round(games * (2.4 - 1.6 * (place - 1) / Math.max(n, 2))), +(3 + 30 * (place - 1) / Math.max(n, 2)).toFixed(2)]; };
const out = [], nat = {}, pay = {}, dates = {}, shape = {};
for (const [set, sn] of Object.entries(SEASONS)) {
  nat[set] = {}; pay[sn - 1] = {}; dates[set] = { weeks: {}, heats: [], gf: null }; shape[set] = {};
  let size = 1;
  for (const [rname, reg] of Object.entries(REG)) {
    const mine = files.filter(f => f.startsWith('Fortnite Champion Series__Chapter 2__Season ' + sn + '__') && f.endsWith('__' + rname + '.txt'));
    if (!mine.length) continue;
    const pages = mine.map(f => ({ f, stage: f.split('__')[3], ...parse(f) }));
    const wk = pages.filter(p => /^(Week|Qualifier|Wildcard)/.test(p.stage));
    const ht = pages.filter(p => /^Heat/.test(p.stage));
    const gf = pages.find(p => /^Grand Finals/.test(p.stage));
    if (gf && gf.rows.length) size = gf.size;
    const best = list => { const by = new Map(); list.forEach(p => p.rows.forEach(r => { const k = r.names.map(x => x.toLowerCase()).sort().join('|'); const cur = by.get(k); if (!cur || r.place < cur.r.place || (r.place === cur.r.place && p.rows.length > cur.n)) by.set(k, { r, n: p.rows.length }); })); return [...by.values()].sort((a, b) => a.r.place / a.n - b.r.place / b.n).slice(0, 120); };
    const stages = {
      Q: best(wk).map((x, i) => est(i + 1, 120, 6).concat([x.r.names, x.r.flags])),
      S: best(ht).map((x, i) => est(i + 1, Math.max(50, ht.length * 50), 6).concat([x.r.names, x.r.flags])),
      GF: gf ? gf.rows.map(r => est(r.place, gf.rows.length, 12).concat([r.names, r.flags])) : []
    };
    if (gf && gf.rows.length) pay[sn - 1][reg] = gf.rows.filter(r => r.usd > 0).map(r => [r.place, Math.round(r.usd / gf.size)]);
    shape[set][reg] = { gf: gf ? gf.rows.length : 0, heats: ht.length, heatTeams: ht.length ? Math.round(ht.reduce((a, p) => a + p.rows.length, 0) / ht.length) : 0, weeks: wk.length };
    if (reg === 'EU') {
      wk.forEach(p => { const n = /^Wildcard/.test(p.stage) ? 9 : +(/(\d+)/.exec(p.stage) || [0, 0])[1]; dates[set].weeks[n] = [p.sdate, p.edate]; });
      dates[set].heats = [...new Set(ht.map(p => p.sdate).filter(Boolean))].sort();
      dates[set].gf = gf ? [gf.sdate, gf.edate] : null;
    }
    if (!stages.GF.length && !stages.S.length) continue;
    for (const st of ['Q', 'S', 'GF']) {
      const rows = stages[st];
      rows.forEach(r => r[6].forEach((n, i) => { if (r[7] && r[7][i] && !nat[set][n]) nat[set][n] = String(r[7][i]).toLowerCase(); }));
      out.push('const CARD_' + set.toUpperCase() + reg + '_' + st + '_RAW=[');
      out.push(rows.map(r => '[' + [r[0], r[1], r[2], r[3], +(r[4] / r[2]).toFixed(2), r[5], r[4] * 2].join(',') + ',' + r[6].map(q).join(',') + ']').join(',\n'));
      out.push('];');
    }
    console.log(set, reg, 'size', size, 'Q', stages.Q.length, 'S', stages.S.length, 'GF', stages.GF.length, stages.GF[0] ? stages.GF[0][6].join('+') : '');
  }
  shape[set].size = size;
}
for (const set of Object.keys(nat)) out.push('const ' + set.toUpperCase() + '_NAT=' + JSON.stringify(nat[set]) + ';');
out.push('// Финалы сезонов 2020-го (Liquipedia, на игрока): 1 — C2S2, 2 — C2S3, 3 — C2S4.');
out.push('const CC_MX_PAY_2020=' + JSON.stringify(pay).replace(/"(\w+)":/g, '$1:') + ';');
fs.writeFileSync(path.join(__dirname, '2020-rows.generated.js'), '// Generated by tools/build-2020-rows.js — FNCS 2020 (Chapter 2 S2–S4) from Liquipedia, seven regions.\n' + out.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'measured', '2020-shape.json'), JSON.stringify({ dates, shape }, null, 1));
console.log('tables', out.filter(l => /^const CARD_/.test(l)).length, JSON.stringify(dates));
