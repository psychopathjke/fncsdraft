// Острова 2023-го (Chapter 4) в index.html: клетки e1–e4 в ZONE_SETS, картинки в MAP_ART,
// острова в MAP_CHOICES. Клетки — дроп-карты eucompetitive.com финалов трёх Мейджоров и
// Копенгагена (tools/measured/eucomp-2023-dropmaps.json): координаты редактора в кадре
// 800×800 поверх картинки 1600×1600, в проценты — делением на восемь, по возрастанию y.
// Повторный запуск заменяет прошлую вставку.
//   node tools/build-2023-zones.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'eucomp-2023-dropmaps.json'), 'utf8'));
const r2 = v => Math.round(v * 100) / 100;
const lines = ['  /* Острова 2023-го (Chapter 4): клетки — дроп-карты eucompetitive.com финалов трёх',
  '     Мейджоров (ch4s1/s2/s3-fncs-finals) и Копенгагена (ch4s4-fncs-finals), в проценты кадра',
  '     делением на восемь (tools/build-2023-zones.js). Рейтинг — лут с вики (ZONE_STATS). */'];
['e1', 'e2', 'e3', 'e4'].forEach(k => {
  const rects = (D.shapes[k] || []).filter(x => x.type === 'rectangle')
    .map(x => ({ x: r2(x.x / 8), y: r2(x.y / 8), w: r2(x.width / 8), h: r2(x.height / 8) }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  lines.push('  ' + k + ':[');
  lines.push(rects.map(z => '    {x:' + z.x + ',y:' + z.y + ',w:' + z.w + ',h:' + z.h + '}').join(',' + nl));
  lines.push('  ],');
});
const A = '  // ==== FNCS 2023 zones (tools/build-2023-zones.js) ====', B = '  // ==== /FNCS 2023 zones ====';
const block = A + nl + lines.join(nl) + nl + B + nl;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length + nl.length);
else {
  const zs = s.indexOf('const ZONE_SETS=');
  const t1 = s.indexOf(nl + '  t1:[', zs);
  if (zs < 0 || t1 < 0) throw new Error('ZONE_SETS / t1 not found');
  s = s.slice(0, t1 + nl.length) + block + s.slice(t1 + nl.length);
}
// Картинки и выбор карты — один раз.
if (s.indexOf('e1:"art/map-e1.jpg"') < 0) {
  const a = '  f4:"art/map-f4.jpg",';
  if (s.split(a).length !== 2) throw new Error('MAP_ART f4 not found');
  s = s.replace(a, a + nl + '  // Chapter 4, 2023: карты eucompetitive.com (ch4s1map … ch4s4map), сжаты в JPEG (tools/png-to-jpg.js).' + nl +
    '  e1:"art/map-e1.jpg",' + nl + '  e2:"art/map-e2.jpg",' + nl + '  e3:"art/map-e3.jpg",' + nl + '  e4:"art/map-e4.jpg",');
}
if (s.indexOf("{key:'e1', label:'Chapter 4 Season 1'}") < 0) {
  const a = "                   {key:'f3', label:'Chapter 5 Season 3'}, {key:'f4', label:'Chapter 5 Season 4'}];";
  if (s.split(a).length !== 2) throw new Error('MAP_CHOICES f4 not found');
  s = s.replace(a, "                   {key:'f3', label:'Chapter 5 Season 3'}, {key:'f4', label:'Chapter 5 Season 4'}," + nl +
    '                   // Chapter 4 (2023): острова финалов трёх Мейджоров и Копенгагена.' + nl +
    "                   {key:'e1', label:'Chapter 4 Season 1'}, {key:'e2', label:'Chapter 4 Season 2'}," + nl +
    "                   {key:'e3', label:'Chapter 4 Season 3'}, {key:'e4', label:'Chapter 4 Season 4'}];");
}
fs.writeFileSync(file, s);
console.log('zones', ['e1', 'e2', 'e3', 'e4'].map(k => k + ':' + (D.shapes[k] || []).length).join(' '));
