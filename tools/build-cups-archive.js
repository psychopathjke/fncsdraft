// Денежные капы прошлых лет из архива Tracker (events/archived, 2019–2025) → CC_CUPS_ARCH в
// index.html между маркерами «Cups archive». Вход — tools/measured/cups-archive.json, снятый в
// Chrome со страниц событий (imp_event): по семейству — имя, плейлист, дни окон, где Epic платил
// деньгами (RewardType ecomm), и таблица выплат каждого региона [[до места N, $ на игрока]].
// FNCS, кубки дивизионов и капы, уже стоящие в календарях, в выгрузку не входят.
//   node tools/build-cups-archive.js
'use strict';
const fs = require('fs'), path = require('path');
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'cups-archive.json'), 'utf8'));
const REG = { EU: 'EU', NAE: 'NAC', NAC: 'NAC', NAW: 'NAW', BR: 'BR', OCE: 'OCE', ASIA: 'ASIA', ME: 'ME' };
const modeOf = pl => /solo/i.test(pl) ? 'solo' : /trio/i.test(pl) ? 'trio' : /squad/i.test(pl) ? 'squad' : 'duo';
// Имя семейства без стадии: «DreamHack Online Open Finals» → «DreamHack Online Open».
const clean = n => String(n || '').replace(/\s+/g, ' ').trim()
  .replace(/\b(Grand Finals?|Semi[- ]?Finals?|Finals?|Heats?|Round \d+|Qualifiers?|Event \d+|Session \d+|Day \d+|Week \d+)\b/gi, '')
  .replace(/\s+/g, ' ').trim()
  .replace(/^([A-Z0-9 &'#!.-]+)$/, s => s.toLowerCase().replace(/(^|[\s&-])([a-z])/g, (m, a, b) => a + b.toUpperCase()));
const posterFile = path.join(__dirname, 'measured', 'cups-archive-posters.json');
const posters = fs.existsSync(posterFile) ? JSON.parse(fs.readFileSync(posterFile, 'utf8')) : {};
const art = {};
const pays = [], payKey = new Map();
const out = [];
for (const [key, r] of Object.entries(src)) {
  // Zero Build — другой режим (карьера играется со стройкой); Reload в 2024–2025 снят (отзыв).
  if (/ZB|ZeroBuild|NoBuild|Reload/i.test(key + ' ' + r.name + ' ' + r.mode)) continue;
  // Уже стоят своими вечерами: World Cup Online Open, Pro-Am и Global Championship (скрытые id
  // Epic), Showdown, Performance Evaluation, Squid Grounds; консольные капы и практика дивизионов
  // S37 не берутся — карьера играется с ПК, практика шла в другом формате.
  if (/^OnlineOpen|PerformanceEval|PerfEval|SquidGround|Showdown|DivisionalCup|Console/i.test(key.split('|')[1] + ' ' + r.name) ||
      /FNCS Pro-Am|Global Championship/i.test(r.name)) continue;
  const days = Object.keys(r.days || {}).filter(Boolean).sort();
  if (!days.length || !r.pay || !r.pay.EU) continue;
  const t = {};
  for (const [reg, rows] of Object.entries(r.pay)) if (REG[reg] && rows && rows.length) t[REG[reg]] = rows.map(x => [Math.round(x[0]), Math.round(x[1])]);
  const js = JSON.stringify(t);
  if (!payKey.has(js)) { payKey.set(js, pays.length); pays.push(t); }
  const id = key.split('|')[1];
  const name = clean(r.name) || id;
  if (posters[id]) art[id] = posters[id];
  days.forEach((d, i) => out.push({ day: d, id, mode: modeOf(r.mode), n: i + 1, name, p: payKey.get(js) }));
}
out.sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
const body = 'const CC_CUPS_ARCH_PAY=' + JSON.stringify(pays).replace(/"(\w+)":/g, '$1:') + ';\n' +
  '// Постеры этих капов — архив Tracker (tools/fetch-archive-posters.js).\n' +
  'Object.assign(CC_CUP_POSTER, ' + JSON.stringify(art) + ');\n' +
  'const CC_CUPS_ARCH=[\n' + out.map(v => "  {day:'" + v.day + "',id:'" + v.id + "',mode:'" + v.mode + "',n:" + v.n + ',name:' + JSON.stringify(v.name) + ',payT:CC_CUPS_ARCH_PAY[' + v.p + ']}').join(',\n') + '\n];\n';
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const A = '// ==== Cups archive (tools/build-cups-archive.js) ====', B = '// ==== /Cups archive ====';
const block = A + nl + body.replace(/\n/g, nl) + B + nl;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length + nl.length);
else {
  const at = s.indexOf('function ccVictoryBase(){');
  if (at < 0) throw new Error('ccVictoryBase not found');
  s = s.slice(0, at) + block + s.slice(at);
}
fs.writeFileSync(file, s);
console.log('cups', out.length, 'families', Object.keys(src).length, 'pay tables', pays.length);
