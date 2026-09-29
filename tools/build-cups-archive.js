// Денежные капы прошлых лет из архива Tracker (events/archived, 2019–2025) → CC_CUPS_ARCH в
// index.html между маркерами «Cups archive». Вход — tools/measured/cups-archive.json, снятый в
// Chrome со страниц событий (imp_event): по семейству — имя, плейлист, дни окон, где Epic платил
// деньгами (RewardType ecomm), и таблица выплат каждого региона [[до места N, $ на игрока]].
// FNCS, кубки дивизионов и капы, уже стоящие в календарях, в выгрузку не входят.
//   node tools/build-cups-archive.js
'use strict';
const fs = require('fs'), path = require('path');
// Два снимка: основной и консольно-мобильный (PlayStation Cup, Console Champions Cup, Platform Cash Cup…).
const src = Object.assign({}, ...['cups-archive.json', 'cups-archive-console.json']
  .map(n => path.join(__dirname, 'measured', n)).filter(p => fs.existsSync(p)).map(p => JSON.parse(fs.readFileSync(p, 'utf8'))));
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
  // Zero Build, Reload, консольные и мобильные капы и практика дивизионов S37 — берутся: вечер
  // тот же, имя капа говорит, что это за кап; Reload играется на острове Reload.
  // Уже стоят своими вечерами: World Cup Online Open, Pro-Am и Global Championship (скрытые id
  // Epic), Showdown, Performance Evaluation, Squid Grounds.
  if (/^OnlineOpen|PerformanceEval|PerfEval|SquidGround|Showdown/i.test(key.split('|')[1] + ' ' + r.name) ||
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
  const zb = /ZB|ZeroBuild|NoBuild|Zero Build/i.test(key + ' ' + r.name + ' ' + r.mode);
  days.forEach((d, i) => out.push({ day: d, id, mode: modeOf(r.mode), n: i + 1, name, p: payKey.get(js), zb }));
}
/* Офлайн-турниры (tools/measured/lans.json, страницы Liquipedia): приглашение по месту в Power
   Ranking карьеры (invite — сколько человек там играло; где число не записано — по призовым
   местам), таблица призов турнира на игрока, одна комната (см. runCareerVictoryNight). */
const lanFile = path.join(__dirname, 'measured', 'lans.json');
const lans = fs.existsSync(lanFile) ? JSON.parse(fs.readFileSync(lanFile, 'utf8')) : [];
lans.forEach(l => {
  // payT — онлайн-кап с выплатами по регионам (World Cup Warmup 2019); иначе одна таблица турнира.
  const t = l.payT || { EU: l.pay };
  const js = JSON.stringify(t);
  if (!payKey.has(js)) { payKey.set(js, pays.length); pays.push(t); }
  // Reload в id — по нему вечер садится на остров Reload (runCareerVictoryNight).
  const id = 'LAN_' + l.page.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') + (l.reload ? '_Reload' : '');
  // qualFrom/qualTop — места по результату других ЛАНов (Gamers8 2023: топ-10 трёх DreamHack 2023); prInvite — сколько зовут по PR помимо них.
  const idOf = pg => 'LAN_' + String(pg).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  // online — обычный кап без приглашения (в свободный день, как капы архива Tracker).
  if (l.online) { out.push({ day: l.day, id: id.replace(/^LAN_/, 'ONL_'), mode: l.format === 1 ? 'solo' : l.format === 3 ? 'trio' : l.format === 4 ? 'squad' : 'duo', n: 1, name: l.name, p: payKey.get(js), zb: false }); return; }
  // nat — турнир для граждан своих стран (ESL Katowice Royale Polish Edition, Ascension во Франции).
  out.push({ day: l.day, id, mode: l.format === 1 ? 'solo' : l.format === 3 ? 'trio' : l.format === 4 ? 'squad' : 'duo', n: 1, name: l.name, p: payKey.get(js), zb: !!l.zb, lan: l.name + ' · ' + l.city, nat: l.nat || null, invite: l.invite, reshuffle: !!l.reshuffle, region: l.region || '',
            qualFrom: (l.qualFrom || []).map(idOf), qualTop: l.qualTop || 0, prInvite: l.prInvite == null ? null : l.prInvite, ewc24: l.ewc24 || false });
});
out.sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
const body = 'const CC_CUPS_ARCH_PAY=' + JSON.stringify(pays).replace(/"(\w+)":/g, '$1:') + ';\n' +
  '// Постеры этих капов — архив Tracker (tools/fetch-archive-posters.js).\n' +
  'Object.assign(CC_CUP_POSTER, ' + JSON.stringify(art) + ');\n' +
  'const CC_CUPS_ARCH=[\n' + out.map(v => "  {day:'" + v.day + "',id:'" + v.id + "',mode:'" + v.mode + "',n:" + v.n + ',name:' + JSON.stringify(v.name) + ',payT:CC_CUPS_ARCH_PAY[' + v.p + ']' + (v.zb ? ',zb:true' : '') + (v.lan ? ',lan:' + JSON.stringify(v.lan) + ',invite:' + v.invite : '') + (v.reshuffle ? ',reshuffle:true' : '') + (v.region ? ",region:'" + v.region + "'" : '') + (v.qualFrom && v.qualFrom.length ? ',qualFrom:' + JSON.stringify(v.qualFrom) + ',qualTop:' + v.qualTop : '') + (v.prInvite != null ? ',prInvite:' + v.prInvite : '') + (v.ewc24 ? ',ewc24:' + JSON.stringify(v.ewc24) : '') + (v.nat ? ',nat:' + JSON.stringify(v.nat) : '') + '}').join(',\n') + '\n];\n';
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
