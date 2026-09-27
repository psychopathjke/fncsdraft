// Вливает вывод build-2025-zone-loot.js для островов 2019–2020 (h1 h3 h4 i1 i2 i3) в ZONE_STATS
// между маркерами «FNCS 2019–2020 zone stats»; ключи, которых нет в выводе, остаются как были.
//   node tools/build-2025-zone-loot.js h1 h3 h4 > zl.out && node tools/splice-mx-zone-stats.js zl.out
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const raw = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/);
const KEYS = ['h1', 'h3', 'h4', 'i1', 'i2', 'i3'];
const A = '  // ==== FNCS 2019–2020 zone stats (tools/splice-mx-zone-stats.js) ====', B = '  // ==== /FNCS 2019–2020 zone stats ====';
const old = {};
{ const i = s.indexOf(A), j = s.indexOf(B); if (i >= 0 && j > i) s.slice(i, j).split(/\r?\n/).forEach(l => { const m = /^  ([a-z]\d):\[/.exec(l); if (m) old[m[1]] = l; }); }
const lines = [];
KEYS.forEach(k => {
  const rl = raw.find(l => l.trim().startsWith(k + ':['));
  const cl = raw.find(l => l.trim().startsWith('chests ' + k + ':'));
  if (!rl || !cl) { if (old[k]) lines.push(old[k]); return; }
  const rs = eval(rl.trim().slice(k.length + 1).replace(/,$/, ''));
  const cs = JSON.parse(cl.trim().slice(('chests ' + k + ':').length));
  lines.push('  ' + k + ':[' + rs.map((z, i) => '{r:' + z.r + ',loot:' + z.loot + ',chests:' + (cs[i] ? cs[i].chests : 0) + ',ammo:' + (cs[i] ? cs[i].ammo : 0) + '}').join(',') + '],');
});
const block = A + nl + '  // Острова 2019–2020: лут и сундуки локаций вики, по клеткам (build-2025-zone-loot.js).' + nl + lines.join(nl) + nl + B;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length);
else {
  const at = s.indexOf(nl + '  // ==== /FNCS 2021 zone stats ====');
  if (at < 0) throw new Error('2021 zone stats not found');
  const end = s.indexOf(nl, at + nl.length);
  s = s.slice(0, end + nl.length) + block + nl + s.slice(end + nl.length);
}
fs.writeFileSync(file, s);
console.log('zone stats', lines.map(l => l.slice(0, 6)).join(' '));
