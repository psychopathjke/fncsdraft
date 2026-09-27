// Капы и выплаты 2023-го из tools/measured/tracker-2023-{cups,pay}.json.
// Выход — tools/2023-cal.generated.js: CC_VICTORY_2023, CC_DCC_PAY_2023, CC_MAJOR_PAY_2023.
//   node tools/build-2023-cal.js
'use strict';
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, 'measured');
const cups = JSON.parse(fs.readFileSync(path.join(M, 'tracker-2023-cups.json'), 'utf8'));
const pay = JSON.parse(fs.readFileSync(path.join(M, 'tracker-2023-pay.json'), 'utf8'));
const REGS = ['EU', 'NAC', 'BR', 'ASIA', 'ME', 'OCE'];
// Мейджор 1 знал NA East и West; NA Central читает East.
const regKey = (reg, season) => reg === 'NAC' && season === 'S23' ? 'NAE' : reg;
const day = w => String(w.begin).slice(0, 10);
// Порог → сумма, по возрастанию места.
const table = usd => usd.slice().sort((a, b) => a[0] - b[0]);
const out = [];

// ---- капы (дни — Европа) ----
const V = [];
const add = (slug, mode, name, extra) => {
  const ws = cups[slug + '|EU'] || [];
  // Окно раунда 1 каждого события (Event<n>_Round1 / Event<n>Round1, у переигранных — v2/remake):
  // одно событие — один кап, днём самого раннего окна раунда 1.
  const byEvent = new Map();
  ws.forEach(w => {
    const m = /Event(\d+)_?Round1/.exec(w.id); if (!m) return;
    const cur = byEvent.get(m[1]); if (!cur || day(w) < day(cur)) byEvent.set(m[1], w);
  });
  [...byEvent.values()].forEach((w, i) => V.push(Object.assign({ day: day(w), id: slug, mode, n: i + 1, name }, extra)));
};
add('S23_SoloCashCup', 'solo', 'Solo Cash Cup', { cash: 100 });   // $100 за победу во втором раунде (value-таблица 1..10 побед)
add('S24_DuosCashCup', 'duo', 'Duos Cash Cup', { pay: 'S24' });
add('S24_SoloVictoryCup', 'solo', 'Solo Victory Cup', { cash: 100 });
add('S25_DuosCashCup', 'duo', 'Duos Cash Cup', { pay: 'S25' });
add('S25_SoloVictoryCashCup', 'solo', 'Solo Victory Cup', { cash: 100 });
add('S26_DuosCashCup', 'duo', 'Duos Cash Cup', { pay: 'S26' });
add('S26_SoloVictoryCashCup', 'solo', 'Solo Victory Cup', { cash: 100 });
V.sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
// Номер капа — по порядку внутри своего id.
const seq = {}; V.forEach(v => { seq[v.id] = (seq[v.id] || 0) + 1; v.n = seq[v.id]; });
out.push('const CC_VICTORY_2023=[');
out.push(V.map(v => '  ' + JSON.stringify(v).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")).join(',\n'));
out.push('];');

// ---- выплаты кэш-капов по сезону и региону (раунд 2, на игрока) ----
const dcc = {};
const payOf = (slug, reg) => {
  const ws = cups[slug + '|' + reg] || [];
  const w = ws.find(x => x.usd && x.usd.length);
  return w ? table(w.usd) : null;
};
[['S24', 'S24_DuosCashCup'], ['S25', 'S25_DuosCashCup'], ['S26', 'S26_DuosCashCup']].forEach(([k, slug]) => {
  dcc[k] = {};
  REGS.forEach(reg => { const t = payOf(slug, regKey(reg, slug.slice(0, 3))) || payOf(slug, reg); if (t) dcc[k][reg] = t; });
});
out.push('const CC_DCC_PAY_2023=' + JSON.stringify(dcc).replace(/"(\w+)":/g, '$1:') + ';');

// ---- Гранд-финалы Мейджоров (на игрока) ----
const maj = {};
[[1, 'S23_FNCS_Major1'], [2, 'S24_FNCS_Major2'], [3, 'S25_FNCS_Major3']].forEach(([n, pre]) => {
  maj[n] = {};
  REGS.forEach(reg => {
    const k = pre + '_GrandFinals_' + regKey(reg, pre.slice(0, 3)) + '_Day2';
    if (pay[k]) maj[n][reg] = table(pay[k]);
  });
});
out.push('const CC_MAJOR_PAY_2023=' + JSON.stringify(maj).replace(/"(\w+)":/g, '$1:') + ';');
// ---- Копенгаген: участники по дорогам (Liquipedia), регион — по таблицам Tracker ----
const liq = fs.readFileSync(path.join(M, 'liqui-2023', 'Fortnite_Champion_Series__2023.txt'), 'utf8');
const regOf = {};
['tracker-2023-S23.json', 'tracker-2023-S24S25.json', 'tracker-2023-NAC.json'].forEach(f => {
  const H = JSON.parse(fs.readFileSync(path.join(M, f), 'utf8'));
  Object.keys(H).forEach(k => {
    let reg = k.split('|')[1]; if (reg === 'NAE' || reg === 'NAW') reg = 'NAC';
    (H[k].rows || []).forEach(r => r[6].forEach(n => { const h = String(n).toLowerCase(); if (!regOf[h]) regOf[h] = reg; }));
  });
});
const routes = {}, parts = liq.split('|content').slice(1);
['m1', 'm2', 'm3', 'lcm'].forEach((route, i) => {
  const body = parts[i] || '';
  const duos = [];
  const re = /\{\{(2|1)Opponent\|([^}]*)\}\}/g; let m;
  while ((m = re.exec(body))) {
    const bits = m[2].split('|').filter(x => !/=/.test(x)).map(x => x.trim()).filter(Boolean);
    duos.push(bits.slice(0, +m[1]));
  }
  routes[route] = duos;
});
const seats = {};
Object.keys(routes).forEach(route => {
  seats[route] = {};
  routes[route].forEach(d => { const reg = d.map(n => regOf[String(n).toLowerCase()]).find(Boolean) || '?'; seats[route][reg] = (seats[route][reg] || 0) + 1; });
});
out.push('const GC2023_DUOS=' + JSON.stringify(routes).replace(/"(\w+)":/g, '$1:') + ';');
out.push('const GC2023_SEATS=' + JSON.stringify(seats).replace(/"(\w+)":/g, '$1:').replace(/"\?":/g, "'?':") + ';');
const prizes = [];
const pz = liq.slice(liq.indexOf('===Prize Pool==='), liq.indexOf('==Participants=='));
const pre = /usdprize=([\d,]+)/g; let pm;
while ((pm = pre.exec(pz))) prizes.push(+pm[1].replace(/,/g, ''));
const pt = {}; prizes.forEach((v, i) => { pt[i + 1] = v; });
out.push('const GC2023_PRIZES=' + JSON.stringify(pt) + ';');
console.log('GC routes', Object.keys(routes).map(r => r + ':' + routes[r].length).join(' '), 'seats', JSON.stringify(seats), 'prizes', prizes.length, prizes.slice(0, 5).join(','));
fs.writeFileSync(path.join(__dirname, '2023-cal.generated.js'), '// Generated by tools/build-2023-cal.js — капы и выплаты FNCS 2023 с Tracker.\n' + out.join('\n') + '\n');
console.log('cups', V.length, 'dcc', Object.keys(dcc).map(k => k + ':' + Object.keys(dcc[k]).length).join(' '), 'majors', Object.keys(maj).map(n => n + ':' + Object.keys(maj[n]).length).join(' '));
