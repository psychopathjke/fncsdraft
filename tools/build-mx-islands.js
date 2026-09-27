// Острова 2019–2020: у eucompetitive дроп-карт этих финалов нет, поэтому остров берётся с
// интерактивной карты вики (картинка + маркеры), а клетки высадки — прямоугольники вокруг
// именованных локаций (Named Location, при недоборе — и Landmark). Картинка вики и есть
// карта режима (art/map-<key>.jpg), поэтому маркеры ложатся на неё без выравнивания.
// Вставка в index.html: клетки — ZONE_SETS между маркерами «FNCS 2019–2020 zones».
//   node tools/build-mx-islands.js [h1 h3 h4 i1 i2 i3]
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';
const BUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const SETS = {
  h1: 'Map:Season 9 (9.40)',                    // World Cup, финалы 27–28 июля 2019
  h3: 'Map:Season X (10.40)',                   // FNCS Season X, финал 22 сентября 2019
  h4: 'Map:Chapter 2: Season 1 (11.11)',        // FNCS C2S1, финал 8 декабря 2019
  i1: 'Map:Chapter 2: Season 2 (12.20)',        // FNCS C2S2, финал апрель 2020
  i2: 'Map:Chapter 2: Season 3 (13.30)',        // FNCS C2S3 (соло), финал август 2020
  i3: 'Map:Chapter 2: Season 4 (14.30)'         // FNCS C2S4, финал октябрь 2020
};
const want = process.argv.slice(2).filter(k => SETS[k]);
const TARGETS = want.length ? want : Object.keys(SETS);
const api = q => JSON.parse(execFileSync('curl', ['-s', '-A', UA, 'https://fortnite.fandom.com/api.php?format=json&' + q], { maxBuffer: 1 << 26 }).toString());
const cache = path.join(os.tmpdir(), 'fncs-zone-loot'); fs.mkdirSync(cache, { recursive: true });
const r2 = v => Math.round(v * 100) / 100;
const blocks = [];
for (const key of TARGETS) {
  const page = api('action=parse&prop=wikitext&page=' + encodeURIComponent(SETS[key]));
  if (!page.parse) throw new Error('no map page ' + SETS[key]);
  const j = JSON.parse(page.parse.wikitext['*']);
  const cats = {}; (j.categories || []).forEach(c => cats[c.id] = c.name);
  const all = (j.markers || []).map(m => ({ n: (m.popup && m.popup.title) || m.title || '', x: m.position[0], y: m.position[1], c: cats[m.categoryId] || '' })).filter(m => m.n);
  const pois = all.filter(m => /^Named Location/i.test(m.c));
  const marks = all.filter(m => /Landmark/i.test(m.c)).concat(all.filter(m => /^Unnamed Location/i.test(m.c)));
  const bounds = j.mapBounds[1][0];
  // Картинка: webp/png с вики → JPEG в art/.
  const img = path.join(cache, key + '-wiki.png');
  if (!fs.existsSync(img) || fs.statSync(img).size < 20000) {
    const info = api('action=query&prop=imageinfo&iiprop=url&titles=' + encodeURIComponent('File:' + j.mapImage));
    const url = info.query.pages[Object.keys(info.query.pages)[0]].imageinfo[0].url;
    execFileSync('curl', ['-s', '-L', '-A', BUA, '-e', 'https://fortnite.fandom.com/', '-o', img, url]);
    if (fs.statSync(img).size < 20000) throw new Error('image blocked ' + url);
  }
  execFileSync('node', [path.join(__dirname, 'png-to-jpg.js'), img, path.join(ROOT, 'art', 'map-' + key + '.jpg'), '0.8']);
  // Клетка — 7 % кадра вокруг именованной локации, 5 % вокруг ориентира (Landmark): одни
  // именованные дают 17–26 клеток, а на сотню соло и у остальных островов их около сорока.
  // Ориентир, чья клетка налезает на уже взятую, пропускается; по возрастанию y.
  const WANT = 40;
  const box = (m, S) => {
    const X = 100 * m.x / bounds, Y = 100 * (bounds - m.y) / bounds;
    return { x: r2(Math.max(0, Math.min(100 - S, X - S / 2))), y: r2(Math.max(0, Math.min(100 - S, Y - S / 2))), w: S, h: S, n: m.n };
  };
  const over = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const rects = pois.map(m => box(m, 7));
  for (const m of marks) {
    if (rects.length >= WANT) break;
    const z = box(m, 5);
    if (!rects.some(r => over(r, z))) rects.push(z);
  }
  rects.sort((a, b) => a.y - b.y || a.x - b.x);
  blocks.push({ key, rects });
  console.log(key, SETS[key], 'pois', pois.length, rects.slice(0, 4).map(z => z.n).join(', '));
}
const file = path.join(ROOT, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const A = '  // ==== FNCS 2019–2020 zones (tools/build-mx-islands.js) ====', B = '  // ==== /FNCS 2019–2020 zones ====';
const prev = {};
{ const i = s.indexOf(A), j = s.indexOf(B); if (i >= 0 && j > i) { const body = s.slice(i, j); for (const m of body.matchAll(/^  ([a-z]\d):\[/gm)) prev[m[1]] = true; } }
const lines = ['  /* Острова 2019–2020: интерактивные карты вики (картинка — сама карта режима), клетки —',
  '     7 % кадра вокруг именованных локаций (tools/build-mx-islands.js). Рейтинг — лут вики (ZONE_STATS). */'];
// Перезапуск по части ключей сохраняет остальные: старый блок читается целиком.
const old = {};
{ const i = s.indexOf(A), j = s.indexOf(B); if (i >= 0 && j > i) { s.slice(i, j).split(/\r?\n/).forEach(l => { const m = /^  ([a-z]\d):\[(.*)$/.exec(l); if (m) old[m[1]] = l; }); } }
const byKey = {}; blocks.forEach(b => byKey[b.key] = b);
Object.keys(SETS).forEach(k => {
  if (byKey[k]) lines.push('  ' + k + ':[' + byKey[k].rects.map(z => '{x:' + z.x + ',y:' + z.y + ',w:' + z.w + ',h:' + z.h + '}').join(',') + '],');
  else if (old[k]) lines.push(old[k]);
});
const block = A + nl + lines.join(nl) + nl + B + nl;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length + nl.length);
else {
  const zs = s.indexOf('const ZONE_SETS=');
  const t1 = s.indexOf(nl + '  t1:[', zs);
  if (zs < 0 || t1 < 0) throw new Error('ZONE_SETS / t1 not found');
  s = s.slice(0, t1 + nl.length) + block + s.slice(t1 + nl.length);
}
fs.writeFileSync(file, s);
console.log('spliced', Object.keys(byKey).join(' '));
