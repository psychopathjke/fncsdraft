// Острова 2022-го (Chapter 3) в index.html: клетки k1–k4 в ZONE_SETS, картинки в MAP_ART,
// острова в MAP_CHOICES. Клетки — дроп-карты eucompetitive.com финалов трёх Мейджоров и
// Копенгагена (tools/measured/eucomp-2022-dropmaps.json): координаты редактора в кадре
// 800×800 поверх картинки 1600×1600, в проценты — делением на восемь, по возрастанию y.
// Повторный запуск заменяет прошлую вставку.
//   node tools/build-2022-zones.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'eucomp-2022-dropmaps.json'), 'utf8'));
const r2 = v => Math.round(v * 100) / 100;
const lines = ['  /* Острова 2022-го (Chapter 3): клетки — дроп-карты eucompetitive.com Гранд-финалов',
  '     C3S1–C3S3 (ch3s1/s2/s3-fncs-finals; у C3S4 финала не было — клетки C3S3), в проценты кадра',
  '     делением на восемь (tools/build-2022-zones.js). Рейтинг — лут с вики (ZONE_STATS). */'];
['k1', 'k2', 'k3', 'k4'].forEach(k => {
  const rects = (D.shapes[k] || []).filter(x => x.type === 'rectangle')
    .map(x => ({ x: r2(x.x / 8), y: r2(x.y / 8), w: r2(x.width / 8), h: r2(x.height / 8) }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  lines.push('  ' + k + ':[');
  lines.push(rects.map(z => '    {x:' + z.x + ',y:' + z.y + ',w:' + z.w + ',h:' + z.h + '}').join(',' + nl));
  lines.push('  ],');
});
const A = '  // ==== FNCS 2022 zones (tools/build-2022-zones.js) ====', B = '  // ==== /FNCS 2022 zones ====';
const block = A + nl + lines.join(nl) + nl + B + nl;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length + nl.length);
else {
  const zs = s.indexOf('const ZONE_SETS=');
  const t1 = s.indexOf(nl + '  t1:[', zs);
  if (zs < 0 || t1 < 0) throw new Error('ZONE_SETS / t1 not found');
  s = s.slice(0, t1 + nl.length) + block + s.slice(t1 + nl.length);
}
// Картинки (MAP_ART) и выбор карты (MAP_CHOICES) ставит tools/patch-year-2022.js.
fs.writeFileSync(file, s);
console.log('zones', ['k1', 'k2', 'k3', 'k4'].map(k => k + ':' + (D.shapes[k] || []).length).join(' '));
