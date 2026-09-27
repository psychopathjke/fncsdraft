// FNCS 2022 card rows (Chapter 3, duos) out of tools/measured/tracker-2022-fncs.json.
//
// Per season (S19 = C3S1, S20 = C3S2, S21 = C3S3) and region — EU, NA East (-> NAC), NA West,
// BR, ASIA, ME, OCE — three stages, as the 2023/2024 sets read them:
//   Q  (L) — the qualifiers' second-to-last round (S19 Round 2, S20/S21 Round 3; top 200),
//            each duo once, at its best qualifier;
//   S  (P) — the Semi-Final sessions (3 × 50), each duo once, at its best session;
//   GF (G) — the Grand Final, both sessions summed.
// Output: tools/2022-rows.generated.js — CARD_K<n><REG>_<Q|S|GF>_RAW in the rowEntry shape
// [rank, pts, matches, wins, avgElims, avgPlace, elimPts, name, name], plus K<n>_NAT.
//
//   node tools/build-2022-rows.js
'use strict';
const fs = require('fs'), path = require('path');
const H = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'tracker-2022-fncs.json'), 'utf8'));
const SETS = { k1: 'S19', k2: 'S20', k3: 'S21' };
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const SRC = { NAC: 'NAE' };
const KILL = { Q: 2, S: 4, GF: 4 };
const q = s => JSON.stringify(String(s));
const keyOf = names => names.map(n => String(n).toLowerCase()).sort().join('|');
const boards = (season, reg, re) => Object.keys(H).filter(k => k.startsWith(season + '_') && k.split('|')[1] === reg && re.test(k.split('|')[2]) && H[k].rows).map(k => H[k]);
const best = list => {
  const by = new Map();
  list.forEach(b => b.rows.forEach(r => { const k = keyOf(r[6]); const cur = by.get(k); if (!cur || r[1] > cur[1]) by.set(k, r); }));
  return [...by.values()].sort((a, b) => b[1] - a[1]).map((r, i) => [i + 1].concat(r.slice(1)));
};
const summed = list => {
  const by = new Map();
  list.forEach(b => b.rows.forEach(r => {
    const k = keyOf(r[6]); const cur = by.get(k);
    if (!cur) { by.set(k, { pts: r[1], m: r[2], w: r[3], e: r[4], pl: r[5] * r[2], names: r[6], cc: r[7] }); return; }
    cur.pts += r[1]; cur.m += r[2]; cur.w += r[3]; cur.e += r[4]; cur.pl += r[5] * r[2];
  }));
  return [...by.values()].sort((a, b) => b.pts - a.pts).map((t, i) => [i + 1, t.pts, t.m, t.w, t.e, t.m ? +(t.pl / t.m).toFixed(2) : 0, t.names, t.cc]);
};
const LIQ = { NAE: 'North America East', NAW: 'North America West' };
function liquiGf(season, src) {
  const n = { S19: 1, S20: 2, S21: 3 }[season];
  const f = path.join(__dirname, 'measured', 'liqui-2022', 'Fortnite Champion Series__Chapter 3__Season ' + n + '__Grand Finals__' + (LIQ[src] || src) + '.txt');
  if (!fs.existsSync(f)) return [];
  const t = fs.readFileSync(f, 'utf8');
  const rows = [];
  const re = /\{\{prize pool slot duos\s*\|([^}]*)\}\}/g; let m;
  while ((m = re.exec(t))) {
    const parts = m[1].split('|').map(x => x.trim());
    const place = +((parts.find(x => /^place=/.test(x)) || '').split('=')[1] || 0);
    const names = parts.filter(x => x && !/=/.test(x)).slice(0, 2);
    if (!place || names.length < 2) continue;
    // Оценка по месту: ~600 очков у первого, минус 9 за место; 12 игр, 2 элима за игру.
    rows.push([place, Math.max(40, 600 - 9 * (place - 1)), 12, place <= 3 ? 1 : 0, 24, +(5 + place * 0.4).toFixed(2), names, [null, null]]);
  }
  return rows.sort((a, b) => a[0] - b[0]).map((r, i) => [i + 1].concat(r.slice(1)));
}
const out = [], nat = {};
for (const [set, season] of Object.entries(SETS)) {
  nat[set] = {};
  for (const reg of REGS) {
    const src = SRC[reg] || reg;
    const qRe = season === 'S19' ? /Qualifier\d_Round2$/ : /Qualifier\d_Round3$/;
    // Q — топ-200, как Day 2 у 2023-го: весь раунд (до 580 дуо) выводил app.js за 9 МБ.
    const stages = { Q: best(boards(season, src, qRe)).slice(0, 200), S: best(boards(season, src, /SemiFinals_Round\d$/)), GF: [] };
    // Finals_Round1/2 — the regex above also matches SemiFinals_Round*: keep only the Finals event.
    stages.GF = summed(Object.keys(H).filter(k => k.startsWith(season + '_FNCS_Finals|' + src + '|')).map(k => H[k]).filter(b => b.rows));
    // У финалов NA East / West 2022-го на Tracker таблиц нет (окна пустые) — места берутся с
    // Liquipedia (таблица призовых); очки и игра — оценка по месту, рейтинг карточки читает место.
    if (!stages.GF.length) stages.GF = liquiGf(season, src);
    if (!stages.GF.length) { console.log('no Grand Final', set, reg); continue; }
    for (const st of ['Q', 'S', 'GF']) {
      const rows = stages[st];
      rows.forEach(r => r[6].forEach((n, i) => { if (r[7] && r[7][i] && !nat[set][n]) nat[set][n] = String(r[7][i]).toLowerCase(); }));
      out.push('const CARD_' + set.toUpperCase() + reg + '_' + st + '_RAW=[');
      out.push(rows.map(r => { const m = Math.max(r[2] || 0, 1), ae = +(r[4] / m).toFixed(2); return '[' + [r[0], r[1], m, r[3], ae, r[5] || 0, Math.round(r[4] * KILL[st])].join(',') + ',' + r[6].map(q).join(',') + ']'; }).join(',\n'));
      out.push('];');
      console.log(set, reg, st, rows.length, rows[0] ? rows[0][6].join('+') : '');
    }
  }
}
for (const set of Object.keys(nat)) out.push('const ' + set.toUpperCase() + '_NAT=' + JSON.stringify(nat[set]) + ';');
fs.writeFileSync(path.join(__dirname, '2022-rows.generated.js'), '// Generated by tools/build-2022-rows.js — FNCS 2022 (Chapter 3, duos), seven regions, from tools/measured/.\n' + out.join('\n') + '\n');
console.log('tables', out.filter(l => /^const CARD_/.test(l)).length);
