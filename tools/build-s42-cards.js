// Карточки сезона S42 (FNCS Solos 2026): финалисты семи регионов, их место в финале (сумма двух дней)
// и их строки отборов (Fast Tracks, хиты, Last Chance) из tools/measured/solos-2026-final.json.
// Печатает литерал S42_SOLOS для index.html (между @@S42-FROM@@ и @@S42-TILL@@) и сам его вставляет.
//   node tools/build-s42-cards.js
// Строка: [ник, код страны, место в финале, очки финала, [[стадия, место, очки, игры, победы, киллы/игру, ср. место], ...]]
const fs = require('fs'), path = require('path');
const RES = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'solos-2026-results.json'), 'utf8'));
const FIN = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'solos-2026-final.json'), 'utf8'));
const norm = s => String(s || '').replace(/-/g, '');
const stOf = x => x.st === 'heats' ? (/Heat2/.test(x.win) ? 'heat2' : 'heat1') : x.st;
const out = [], miss = {};
for (const reg of ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE']) {
  const R = RES[reg], F = FIN.regions[reg];
  if (!R || R.day !== 2 || !R.cumulative) throw new Error(reg + ': нет итога двух дней');
  const byId = new Map(F.finalists.map(f => [norm(f.id), f]));
  const rows = [];
  R.rows.slice().sort((a, b) => a.rank - b.rank).forEach(r => {
    const f = byId.get(norm(r.id));
    if (!f || !f.n) { miss[reg] = (miss[reg] || 0) + 1; return; }
    const res = (f.res || []).map(x => [stOf(x), x.r, x.p, x.m, x.w, +(+x.e).toFixed(2), +(+x.ap).toFixed(2)]);
    rows.push([f.n, String(f.c || '').toLowerCase(), r.rank, r.pts, res]);
  });
  out.push('  ' + reg + ':' + JSON.stringify(rows));
}
const lit = '/* @@S42-FROM@@ tools/build-s42-cards.js */\nconst S42_SOLOS={\n' + out.join(',\n') + '\n};\n/* @@S42-TILL@@ */';
const IDX = path.join(__dirname, '..', 'index.html');
let src = fs.readFileSync(IDX, 'utf8');
const a = src.indexOf('/* @@S42-FROM@@'), b = src.indexOf('/* @@S42-TILL@@ */');
if (a < 0 || b < 0) { console.log(lit.slice(0, 400)); throw new Error('нет меток @@S42-FROM@@/@@S42-TILL@@ в index.html'); }
src = src.slice(0, a) + lit + src.slice(b + '/* @@S42-TILL@@ */'.length);
fs.writeFileSync(IDX, src);
console.error('S42_SOLOS вставлен; без ника: ' + JSON.stringify(miss));
