// FNCS / World Cup 2019 card rows out of tools/measured/tracker-2019.json and the World Cup
// Finals pages of Liquipedia (tools/measured/liqui-2020/Fortnite World Cup__2019__Finals__*.txt).
//
// Four sets, each in its own format:
//   h1 — World Cup Solo: P = best Online Open week final (top 60), L = next 60, G = the NYC Solo final;
//   h2 — World Cup Duos: the same with duos;
//   h3 — FNCS Season X (trios): L = best week final (Event3, top 60), P = Finals heats, G = Finals (Event5);
//   h4 — FNCS Chapter 2 Season 1 (squads): L = best week final (top 40), P = heats, G = Finals.
// NA East -> NAC. The NYC finals are one global event; each player lands in the region he
// played the Online Open weeks in (else by his flag, else EU).
// Output: tools/2019-rows.generated.js — CARD_H<n><REG>_<Q|S|GF>_RAW + H<n>_NAT.
//
//   node tools/build-2019-rows.js
'use strict';
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, 'measured');
let H = JSON.parse(fs.readFileSync(path.join(M, 'tracker-2019.json'), 'utf8'));
if (typeof H === 'string') H = JSON.parse(H);
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const SRC = { NAC: 'NAE' };
const q = s => JSON.stringify(String(s));
const keyOf = names => names.map(n => String(n).toLowerCase()).sort().join('|');
const best = list => {
  const by = new Map();
  list.forEach(b => (b.rows || []).forEach(r => { const k = keyOf(r[6]); const cur = by.get(k); if (!cur || r[1] > cur[1]) by.set(k, r); }));
  return [...by.values()].sort((a, b) => b[1] - a[1]).map((r, i) => [i + 1].concat(r.slice(1)));
};
const boards = (re, reg) => Object.keys(H).filter(k => re.test(k) && k.split('|')[1] === reg && H[k].rows).map(k => H[k]);
// Регион игрока по неделям Online Open (первый увиденный).
const regOf = {};
Object.keys(H).forEach(k => { const reg = k.split('|')[1]; (H[k].rows || []).forEach(r => r[6].forEach(n => { const h = String(n).toLowerCase(); if (!regOf[h]) regOf[h] = reg === 'NAE' ? 'NAC' : reg; })); });
const FLAG_REG = { us: 'NAC', ca: 'NAC', gb: 'EU', uk: 'EU', de: 'EU', fr: 'EU', pl: 'EU', se: 'EU', no: 'EU', dk: 'EU', nl: 'EU', br: 'BR', au: 'OCE', nz: 'OCE', kr: 'ASIA', jp: 'ASIA', ar: 'BR', sa: 'ME', ae: 'ME', kw: 'ME' };
function wcFinal(which, size) {
  const f = path.join(M, 'liqui-2020', 'Fortnite World Cup__2019__Finals__' + which + '.txt');
  if (!fs.existsSync(f)) return [];
  const t = fs.readFileSync(f, 'utf8'), rows = [];
  const re = /\{\{prize pool slot( duos?| trios?)?\s*\|([^}]*)\}\}/g; let m;
  while ((m = re.exec(t))) {
    const parts = m[2].split('|').map(x => x.trim());
    const place = +((parts.find(x => /^place=/.test(x)) || '').split('=')[1] || 0);
    const usd = +((parts.find(x => /^usdprize=/.test(x)) || '').split('=')[1] || '0').replace(/,/g, '');
    const names = parts.filter(x => x && !/=/.test(x)).slice(0, size);
    if (!place || names.length < size) continue;
    const flags = names.map((_, i) => ((parts.find(x => x.startsWith('flag' + (i + 1) + '=') || x.startsWith('flag1p' + (i + 1) + '=')) || '').split('=')[1] || '') || null);
    const reg = names.map(n => regOf[String(n).toLowerCase()]).find(Boolean) || FLAG_REG[flags[0]] || 'EU';
    rows.push({ place, usd, names, flags, reg });
  }
  return rows.sort((a, b) => a.place - b.place);
}
// Очки по месту для финала World Cup (очков в вики нет): ~120 у первого соло, ~150 у дуо.
const wcRow = (x, i, size) => [x.place, Math.max(5, (size === 1 ? 120 : 150) - (size === 1 ? 1.1 : 2.8) * (x.place - 1)), 6, x.place <= 2 ? 1 : 0, size === 1 ? 6 : 10, +(4 + x.place * (size === 1 ? 0.45 : 0.6)).toFixed(2), x.names, x.flags];
const SETS = {
  h1: { size: 1, weeks: /^OnlineOpen_Week(1|3|5|7|9)\|/, wc: 'Solo' },
  h2: { size: 2, weeks: /^OnlineOpen_Week(2|4|6|8|10)\|/, wc: 'Duos' },
  h3: { size: 3, weeks: /^S10_FNCS_Week\d\|/, weekWin: /Event3$/, heats: /^S10_FNCS_Finals\|/, heatWin: /Finals_Event[1-4]$/, gfWin: /Finals_Event5$/, capL: 60 },
  h4: { size: 4, weeks: /^S11_FNCS_(Week\d|Warmup)\|/, weekWin: /Event3$/, heats: /^S11_FNCS_Finals\|/, heatWin: /Finals_Event[1-4]$/, gfWin: /Finals_Event5$/, capL: 40 }
};
const KILL = { Q: 2, S: 3, GF: 3 };
const out = [], nat = {}, pay = {};
for (const [set, cfg] of Object.entries(SETS)) {
  nat[set] = {};
  const wc = cfg.wc ? wcFinal(cfg.wc, cfg.size) : null;
  if (wc) pay[set] = wc.map(x => [x.place, Math.round(x.usd / cfg.size)]);
  for (const reg of REGS) {
    const src = SRC[reg] || reg;
    let stages;
    if (cfg.wc) {
      const wk = best(boards(cfg.weeks, src));
      stages = { S: wk.slice(0, 60), Q: wk.slice(60, 120).map((r, i) => [i + 1].concat(r.slice(1))),
        GF: wc.filter(x => x.reg === reg).map((x, i) => wcRow(x, i, cfg.size)).map((r, i) => [i + 1].concat(r.slice(1))) };
    } else {
      const wk = best(Object.keys(H).filter(k => cfg.weeks.test(k) && k.split('|')[1] === src && cfg.weekWin.test(k.split('|')[2]) && H[k].rows).map(k => H[k]));
      stages = { Q: wk.slice(0, cfg.capL), S: best(Object.keys(H).filter(k => cfg.heats.test(k) && k.split('|')[1] === src && cfg.heatWin.test(k.split('|')[2])).map(k => H[k])),
        GF: best(Object.keys(H).filter(k => cfg.heats.test(k) && k.split('|')[1] === src && cfg.gfWin.test(k.split('|')[2])).map(k => H[k])) };
    }
    if (!stages.GF.length && !stages.S.length) { console.log('empty', set, reg); continue; }
    for (const st of ['Q', 'S', 'GF']) {
      const rows = stages[st];
      rows.forEach(r => r[6].forEach((n, i) => { if (r[7] && r[7][i] && !nat[set][n]) nat[set][n] = String(r[7][i]).toLowerCase(); }));
      out.push('const CARD_' + set.toUpperCase() + reg + '_' + st + '_RAW=[');
      out.push(rows.map(r => { const m = Math.max(r[2] || 0, 1), ae = +(r[4] / m).toFixed(2); return '[' + [r[0], Math.round(r[1]), m, r[3], ae, r[5] || 0, Math.round(r[4] * KILL[st])].join(',') + ',' + r[6].map(q).join(',') + ']'; }).join(',\n'));
      out.push('];');
      console.log(set, reg, st, rows.length, rows[0] ? rows[0][6].join('+') : '');
    }
  }
}
for (const set of Object.keys(nat)) out.push('const ' + set.toUpperCase() + '_NAT=' + JSON.stringify(nat[set]) + ';');
out.push('// Призовые финалов World Cup в Нью-Йорке (Liquipedia, на игрока): h1 — соло, h2 — дуо.');
out.push('const WC2019_PAY=' + JSON.stringify(pay) + ';');
// Поле финалов и квоты недель: сколько финалистов регион дал за пять недель, на неделю — с округлением вверх.
const field = {}, quota = {};
for (const [set, cfg] of Object.entries(SETS)) {
  if (!cfg.wc) continue;
  const wc = wcFinal(cfg.wc, cfg.size);
  field[set] = wc.map(x => x.names);
  quota[set] = {};
  REGS.forEach(r => { const c = wc.filter(x => x.reg === r).length; if (c) quota[set][r] = Math.ceil(c / 5); });
}
out.push('// Финалисты Нью-Йорка (Liquipedia): h1 — 100 соло, h2 — 50 дуо; квота недели Online Open по региону.');
out.push('const WC2019_FIELD=' + JSON.stringify(field) + ';');
out.push('const WC2019_QUOTA=' + JSON.stringify(quota) + ';');
console.log('WC quota', JSON.stringify(quota), 'field', Object.keys(field).map(k => k + ':' + field[k].length).join(' '));
fs.writeFileSync(path.join(__dirname, '2019-rows.generated.js'), '// Generated by tools/build-2019-rows.js — World Cup and FNCS 2019, seven regions, from tools/measured/.\n' + out.join('\n') + '\n');
console.log('tables', out.filter(l => /^const CARD_/.test(l)).length);
