// Расписание капов по регионам для выезда (ccAwayPlay): для каждого вечера EU — в каких регионах тот же кап шёл и
// когда начинался его первый раунд. Источники: tools/measured/comp-events-2026.json (окна Epic 12.2025–11.2026) и
// tools/measured/comp-calendar.json (календарь до 2.12.2026, в нём S43). Все семь регионов.
// Сопоставление по id окна без региона (тот же «Event1 Round1»), а не по дате: у NAW кап часто после полуночи UTC.
// Остаются только окна, чей id начинается с id капа карьеры (id:'S..' в index.html), и регионы в пределах того же
// вечера (от -14 до +12 часов от EU): ME, сыгравший тот же «Day 1» сутками раньше, в этот день капа не имел.
// Печатает const CC_AWAY_SCHED={"день|окно":"HH:MM(EU, UTC);REGсдвиг_мин,..."}; вставляется в index.html.
//   node tools/build-away-schedule.js > sched.txt
const path = require('path'), fs = require('fs');
const M = p => path.join(__dirname, 'measured', p);
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const RX = /_(EU|NAC|NAW|BR|ASIA|ME|OCE)$/;
const wins = [];   // {stem, reg, b}
for (const [k, e] of Object.entries(require(M('comp-events-2026.json')))) {
  const r = (k.match(RX) || [])[1]; if (!r) continue;
  for (const w of e.w || []) wins.push({stem: w.w.replace(RX, ''), reg: r, b: w.b.slice(0, 16)});
}
for (const w of require(M('comp-calendar.json')).events || [])
  if (REGS.includes(w.region)) wins.push({stem: w.w.replace(RX, ''), reg: w.region, b: w.begin.slice(0, 16)});
const byStem = {};
wins.forEach(w => { const s = (byStem[w.stem] = byStem[w.stem] || {}); if (!s[w.reg] || w.b < s[w.reg]) s[w.reg] = w.b; });

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const ids = [...new Set((html.match(/id:'S\d+_[A-Za-z0-9_]+'/g) || []).map(x => x.slice(4, -1)))];
// Первое окно вечера: без Round2/Round3 и т.п. (Round1 или окно без раундов).
const first = s => !/Round[2-9]|_R[2-9]\b|Round_?[2-9]/.test(s);
const flat = {};
Object.keys(byStem).sort().forEach(stem => {
  const row = byStem[stem]; if (!row.EU || !first(stem)) return;
  if (!ids.some(id => stem === id || stem.startsWith(id + '_'))) return;
  const eu = Date.parse(row.EU + 'Z');
  const others = Object.entries(row).filter(([r]) => r !== 'EU')
    .map(([r, b]) => [r, Math.round((Date.parse(b + 'Z') - eu) / 60000)])
    .filter(([, d]) => d >= -14 * 60 && d <= 12 * 60);
  if (!others.length) return;
  flat[row.EU.slice(0, 10) + '|' + stem] = row.EU.slice(11) + ';' + others.map(([r, d]) => r + d).join(',');
});
process.stdout.write('const CC_AWAY_SCHED=' + JSON.stringify(flat) + ';\n');
console.error(Object.keys(flat).length + ' EU evenings, ' + JSON.stringify(flat).length + ' bytes');
