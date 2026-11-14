// Консольные капы 2026 года (PlayStation Cup, Console Victory/Cash Cups) из окон Epic: tools/measured/comp-events-2026.json.
// Один кап — вечер EU с выплатой (окно с payoutTable). Таблица выплат — по регионам (то же окно у каждого региона),
// 'value' (100, 200, 300 очков = победы) карьера читает как плату за победу (ccVicPerWin), 'rank' — как места.
// Печатает const CC_CONSOLE_2026=[...]; вставляется в index.html вместо прежней строки.
//   node tools/build-console-2026.js > console.txt
const path = require('path');
const ev = require(path.join(__dirname, 'measured', 'comp-events-2026.json'));
const RX = /_(EU|NAC|NAW|BR|ASIA|ME|OCE)$/;
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const MODE = {Solo: 'solo', Duos: 'duo', Trios: 'trio', Squads: 'squad'};
// Таблица выплат окна по регионам: id окна без региона → {REG: ranks}.
const payOf = {};
for (const [k, e] of Object.entries(ev)) {
  const r = (k.match(RX) || [])[1]; if (!r) continue;
  for (const w of e.w || []) {
    const p = (w.pay || [])[0]; if (!p || !p.ranks || !p.ranks.length) continue;
    (payOf[w.w.replace(RX, '')] = payOf[w.w.replace(RX, '')] || {})[r] = p.ranks;
  }
}
const out = [], n = {};
for (const [k, e] of Object.entries(ev)) {
  if (!/_EU$/.test(k) || !/Console|PlayStation|Playstation|Xbox/i.test(k)) continue;
  const id = k.replace(/^epicgames_/, '').replace(/_EU$/, '');
  const name = String(e.t1 || id).trim();
  const days = {};
  for (const w of e.w || []) {
    const stem = w.w.replace(RX, ''), pay = payOf[stem];
    if (!pay || !pay.EU) continue;   // вечер без денег (квалы, ZB без призов) не берём
    const d = w.b.slice(0, 10);
    if (!days[d]) days[d] = {pay, team: w.team};
  }
  Object.keys(days).sort().forEach(d => {
    n[id] = (n[id] || 0) + 1;
    const payT = {}; REGS.forEach(r => { if (days[d].pay[r]) payT[r] = days[d].pay[r]; });
    const row = {day: d, id, mode: MODE[days[d].team] || 'solo', n: n[id], name, payT};
    if (/ZB|ZeroBuild|Zero Build/i.test(id + ' ' + name)) row.zb = true;
    out.push(row);
  });
}
out.sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
process.stdout.write('const CC_CONSOLE_2026=' + JSON.stringify(out) + ';\n');
console.error(out.length + ' console cups, ' + JSON.stringify(out).length + ' bytes; ' + [...new Set(out.map(x => x.id))].join(', '));
