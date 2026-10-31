// Места финала FNCS Solos 2026 по регионам — для этапа «solos» в ledger S41 (index.html, SOLOS26_RANK).
// Итог — сумма двух дней (tools/measured/solos-2026-results.json, fetch-solos-results.js с eucompetitive),
// ник — по id аккаунта из tools/measured/solos-2026-final.json (esportsNickname, как в карточках).
//   node tools/build-solos26-rank.js   → печатает литерал SOLOS26_RANK для вставки
const fs = require('fs'), path = require('path');
const RES = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'solos-2026-results.json'), 'utf8'));
const FIN = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'solos-2026-final.json'), 'utf8'));
const norm = s => String(s || '').replace(/-/g, '');
const out = [], miss = {};
for (const reg of ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE']) {
  const R = RES[reg], F = FIN.regions[reg];
  if (!R || R.day !== 2 || !R.cumulative) throw new Error(reg + ': нет итога двух дней');
  const nick = new Map(F.finalists.map(f => [norm(f.id), f.n]));
  const rows = R.rows.slice().sort((a, b) => a.rank - b.rank).map(r => [nick.get(norm(r.id)), r.rank]);
  miss[reg] = rows.filter(r => !r[0]).length;
  out.push('    ' + reg + ':{ ' + rows.filter(r => r[0]).map(([n, k]) => JSON.stringify(n) + ':' + k).join(', ') + ' }');
}
console.error('без ника: ' + JSON.stringify(miss));
console.log('  const SOLOS26_RANK={\n' + out.join(',\n') + '\n  };');
