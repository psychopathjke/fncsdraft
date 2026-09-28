// Сколько раундов у капа за вечер — по окнам Epic (imp_event.Windows со страниц Tracker, Европа,
// 2019–2026, снято 28.09.2026 в tools/measured/event-windows-eu.json).
// Семейство события (id Epic без epicgames_ и без всего от _EU) → 2, если у него есть окно Round 2
// (в тот же день или назавтра) или два окна в один день; иначе 1. Вклеивается между маркерами
// «CUP ROUNDS begin/end» в index.html.
//   node tools/build-cup-rounds.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'event-windows-eu.json'), 'utf8'));
const fam = {};
for (const slug of Object.keys(src)) {
  const body = slug.replace(/^epicgames_/, '');
  const key = body.replace(/_EU(_.*)?$/, '');
  const wins = src[slug] || [];
  const perDay = {};
  wins.forEach(w => { const d = String(w[0]).slice(0, 10); perDay[d] = (perDay[d] || 0) + 1; });
  const two = /Round2/i.test(body) || wins.some(w => /Round\s*2/i.test(String(w[1]))) ||
    Object.values(perDay).some(n => n > 1);
  fam[key] = Math.max(fam[key] || 1, two ? 2 : 1);
}
const body = '/* CUP ROUNDS begin — tools/build-cup-rounds.js */\n' +
  'const CC_CUP_ROUNDS=' + JSON.stringify(fam) + ';\n' +
  '/* CUP ROUNDS end */';
const file = path.join(ROOT, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const a = html.indexOf('/* CUP ROUNDS begin'), b = html.indexOf('/* CUP ROUNDS end */');
if (a < 0 || b < 0) throw new Error('markers not found');
html = html.slice(0, a) + body + html.slice(b + '/* CUP ROUNDS end */'.length);
fs.writeFileSync(file, html);
const n2 = Object.values(fam).filter(v => v === 2).length;
console.log('families', Object.keys(fam).length, 'two-round', n2, 'bytes', body.length);
