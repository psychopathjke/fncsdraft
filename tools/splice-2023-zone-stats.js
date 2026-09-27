// Вливает вывод build-2025-zone-loot.js (e1–e4) в ZONE_STATS: {r, loot, chests, ammo} на клетку.
//   node tools/build-2025-zone-loot.js e1 e2 e3 e4 > zl.out && node tools/splice-2023-zone-stats.js zl.out
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const raw = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/);
const lines = [];
['e1', 'e2', 'e3', 'e4'].forEach(k => {
  const rl = raw.find(l => l.trim().startsWith(k + ':['));
  const cl = raw.find(l => l.trim().startsWith('chests ' + k + ':'));
  if (!rl || !cl) throw new Error('no output for ' + k);
  const rs = eval(rl.trim().slice(k.length + 1).replace(/,$/, ''));
  const cs = JSON.parse(cl.trim().slice(('chests ' + k + ':').length));
  lines.push('  ' + k + ':[' + rs.map((z, i) => '{r:' + z.r + ',loot:' + z.loot + ',chests:' + (cs[i] ? cs[i].chests : 0) + ',ammo:' + (cs[i] ? cs[i].ammo : 0) + '}').join(',') + '],');
});
const A = '  // ==== FNCS 2023 zone stats (tools/splice-2023-zone-stats.js) ====', B = '  // ==== /FNCS 2023 zone stats ====';
const block = A + nl + '  // Острова 2023-го: лут и сундуки локаций вики патча финала, по клеткам (build-2025-zone-loot.js).' + nl + lines.join(nl) + nl + B;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length);
else {
  const at = s.indexOf(nl + '  f4:[{r:');
  if (at < 0) throw new Error('ZONE_STATS f4 not found');
  const end = s.indexOf(nl, at + nl.length);
  s = s.slice(0, end + nl.length) + block + nl + s.slice(end + nl.length);
}
fs.writeFileSync(file, s);
console.log('zone stats', lines.map(l => l.slice(0, 8)).join(' '));
