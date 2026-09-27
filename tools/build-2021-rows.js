// FNCS 2021 card rows (Chapter 2 Seasons 5–8, trios) out of tools/measured/tracker-2021.json.
//
// Per season (S15 = C2S5 … S18 = C2S8) and region — EU, NA East (-> NAC), NA West, BR, ASIA,
// ME, OCE — three stages, as the 2022–2024 sets read them:
//   Q  (L) — the qualifiers' last round (Round 4, 33 trios each), each trio once, at its best;
//   S  (P) — the Semi-Final heats (and Day 2 heats in S18), each trio once, at its best;
//   GF (G) — the Finals, both rounds summed.
// No caps: build-deploy strips comments from app.js, which freed the room.
// NA East / West finals have empty leaderboards on Tracker — places come from Liquipedia
// (prize pool slots), points estimated from the place.
// Output: tools/2021-rows.generated.js — CARD_J<n><REG>_<Q|S|GF>_RAW in the rowEntry shape
// [rank, pts, matches, wins, avgElims, avgPlace, elimPts, name, name, name], plus J<n>_NAT.
//
//   node tools/build-2021-rows.js
'use strict';
const fs = require('fs'), path = require('path');
const H = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'tracker-2021.json'), 'utf8'));
const SETS = { j1: 'S15', j2: 'S16', j3: 'S17', j4: 'S18' };
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const SRC = { NAC: 'NAE' };
const CAP = { Q: Infinity, S: Infinity, GF: Infinity };
const KILL = { Q: 2, S: 3, GF: 3 };
const q = s => JSON.stringify(String(s));
const keyOf = names => names.map(n => String(n).toLowerCase()).sort().join('|');
const boards = (season, reg, re) => Object.keys(H).filter(k => k.startsWith(season + '_') && k.split('|')[1] === reg && re.test(k.split('|')[2] || '') && H[k].rows).map(k => H[k]);
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
  const n = { S15: 5, S16: 6, S17: 7, S18: 8 }[season];
  const f = path.join(__dirname, 'measured', 'liqui-2021', 'Fortnite Champion Series__Chapter 2__Season ' + n + '__Grand Finals__' + (LIQ[src] || src) + '.txt');
  if (!fs.existsSync(f)) return [];
  const t = fs.readFileSync(f, 'utf8');
  const rows = [];
  const re = /\{\{prize pool slot( trios?| duos?| squads?)?\s*\|([^}]*)\}\}/g; let m;
  while ((m = re.exec(t))) {
    const parts = m[2].split('|').map(x => x.trim());
    const place = +((parts.find(x => /^place=/.test(x)) || '').split('=')[1] || 0);
    const names = parts.filter(x => x && !/=/.test(x)).slice(0, 3);
    if (!place || names.length < 3) continue;
    const flags = [1, 2, 3].map(i => ((parts.find(x => x.startsWith('flag1p' + i + '=')) || '').split('=')[1] || '') || null);
    // Оценка по месту: ~400 очков у первого, минус 9 за место; 12 игр, 2 элима за игру.
    rows.push([place, Math.max(30, 400 - 9 * (place - 1)), 12, place <= 3 ? 1 : 0, 24, +(4 + place * 0.4).toFixed(2), names, flags]);
  }
  return rows.sort((a, b) => a[0] - b[0]).map((r, i) => [i + 1].concat(r.slice(1)));
}
const out = [], nat = {};
for (const [set, season] of Object.entries(SETS)) {
  nat[set] = {};
  for (const reg of REGS) {
    const src = SRC[reg] || reg;
    const stages = {
      Q: best(boards(season, src, /^Qualifier\d_Event4$/)).slice(0, CAP.Q),
      S: best(boards(season, src, /^SemiFinals_(Day\d_)?Heat\w+$/)).slice(0, CAP.S),
      GF: summed(Object.keys(H).filter(k => (k.startsWith(season + '_FNCS_Finals|' + src + '|') || k.startsWith(season + '_FNCS_GrandFinals|' + src + '|'))).map(k => H[k]).filter(b => b.rows && b.rows.length)).slice(0, CAP.GF)
    };
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
fs.writeFileSync(path.join(__dirname, '2021-rows.generated.js'), '// Generated by tools/build-2021-rows.js — FNCS 2021 (Chapter 2, trios), seven regions, from tools/measured/.\n' + out.join('\n') + '\n');
console.log('tables', out.filter(l => /^const CARD_/.test(l)).length);
