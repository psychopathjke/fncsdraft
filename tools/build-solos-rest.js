// Литерал S42_SOLOS_REST: кто прошёл отбор FNCS Solos 2026 до хитов, Fast Track или Last Chance Lobby, но не в финал,
// и уже есть в игре. Новому человеку карточка не заводится: ники в таблицах Epic меняются, а чужое имя хуже пропуска.
//   node tools/build-solos-rest.js   → вписывает литерал между метками @@S42-REST
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, 'measured');
const R = JSON.parse(fs.readFileSync(path.join(M, 'solos-2026-rest.json'), 'utf8'));
const F = JSON.parse(fs.readFileSync(path.join(M, 'solos-2026-final.json'), 'utf8'));
const H = Object.values(JSON.parse(fs.readFileSync(path.join(M, 'player-handles.json'), 'utf8')));
// Ник Epic не похож на ник карточки, связь проверена по местам и флагу.
const ALIAS = { f429cf5fef7e4c86a1ffea6110c760c3: 'Jerok' };
const low = s => String(s || '').toLowerCase().trim();
const keys = s => { const t = low(s).split(/\s+/).filter(Boolean); return [low(s), t.slice(1).join(' '), t.slice(0, -1).join(' ')].filter(x => x.length >= 3); };
const out = {}, stat = {};
for (const reg of Object.keys(R.regions)) {
  const finId = new Set(F.regions[reg].finalists.map(p => p.id.replace(/-/g, '')));
  const finNick = new Set(F.regions[reg].finalists.map(p => low(p.n)));
  const byKey = new Map(H.filter(h => h.reg === reg).map(h => [h.k, h.h]));
  const rows = [], used = new Set(); let unknown = 0;
  for (const [id, r] of Object.entries(R.regions[reg])) {
    if (finId.has(id)) continue;
    let nm = ALIAS[id] || null;
    if (!nm) for (const k of [...keys(r.c), ...keys(r.d)]) if (byKey.has(k)) { nm = byKey.get(k); break; }
    if (!nm || finNick.has(low(nm)) || used.has(low(nm))) { unknown++; continue; }
    used.add(low(nm));
    rows.push([nm, r.res]);
  }
  rows.sort((a, b) => Math.min(...a[1].map(x => x[1])) - Math.min(...b[1].map(x => x[1])));
  out[reg] = rows; stat[reg] = rows.length + ' есть, ' + unknown + ' нет';
}
console.log(JSON.stringify(stat));
const lit = '/* @@S42-REST@@ */\nconst S42_SOLOS_REST={\n' + Object.keys(out).map(reg => '  ' + reg + ':' + JSON.stringify(out[reg].map(([n, res], i) => [n, '', 101 + i, res.reduce((a, x) => Math.max(a, x[2]), 0), res]))).join(',\n') + '\n};\n/* @@S42-REST-TILL@@ */\n';
const file = path.join(__dirname, '..', 'index.html');
let t = fs.readFileSync(file, 'utf8');
const END = '/* @@S42-REST-TILL@@ */\n', a = t.indexOf('/* @@S42-REST@@ */');
if (a >= 0) t = t.slice(0, a) + lit + t.slice(t.indexOf(END) + END.length);
else { const TAG = '/* @@S42-TILL@@ */\n', at = t.indexOf(TAG); if (at < 0) throw new Error('метка'); const p = at + TAG.length; t = t.slice(0, p) + lit + t.slice(p); }
fs.writeFileSync(file, t);
