// Картинки предметов пулов 2021-го (j1–j4), которых у режима ещё нет: список — measured/art-2021-missing.json
// (имена, у которых weaponIconHTML в странице отдаёт силуэт).
// Имя файла — из ячейки страницы «Chapter 2: Season N/Loot Pool» (первый [[File:…]] строки
// предмета), миниатюра 256 px через API вики, curl с браузерным UA (Cloudflare).
// Пишет items/itm-<slug>.<ext> и строки в EXTRA_ITEM_ART между маркерами «FNCS 2021 art».
//   node tools/fetch-2021-item-art.js
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';
const BUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const slug = n => 'itm-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const SAME = { 'Medkit': 'Med Kit', 'Bandages': 'Bandage' };
const clean = n => { const x = n.replace(/#.*$/, '').replace(/\s*\(Battle Royale\)/, '').trim(); return SAME[x] || x; };
const api = q => JSON.parse(execFileSync('curl', ['-s', '-A', UA, 'https://fortnite.fandom.com/api.php?format=json&' + q], { maxBuffer: 1 << 26 }).toString());
const sniff = b => b.subarray(0, 4).toString('hex') === '89504e47' ? 'png' : (b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') ? 'webp' : b.subarray(0, 2).toString('hex') === 'ffd8' ? 'jpg' : null;

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const nl = html.includes('\r\n') ? '\r\n' : '\n';
// Какие имена рисуются уже: ключи EXTRA_ITEM_ART и файлы items/ с тем же slug.
const have = new Set();
const ex = html.slice(html.indexOf('const EXTRA_ITEM_ART={'), html.indexOf('};', html.indexOf('const EXTRA_ITEM_ART={')));
[...ex.matchAll(/"([^"]+)":\s*"items\//g)].forEach(m => have.add(m[1]));
const files = new Set(fs.readdirSync(path.join(ROOT, 'items')).map(f => f.replace(/\.[a-z]+$/, '')));
// Имена предметов пулов 2021-го — из вставки build-2023-loot.js.
const loot = html.slice(html.indexOf('// ==== FNCS 2021 loot'), html.indexOf('// ==== /FNCS 2021 loot'));
const names = [...new Set([...loot.matchAll(/\["([^"]+)",'/g)].map(m => m[1]).concat([...loot.matchAll(/\{name:"([^"]+)"/g)].map(m => m[1])))];
const MISS = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'art-2021-missing.json'), 'utf8')));
const want = names.filter(n => MISS.has(n) && !have.has(n) && !files.has(slug(n)));
// Файлы — из ячеек страниц.
const fileOf = {};
for (const n of [5, 6, 7, 8]) {
  const t = api('action=parse&prop=wikitext&page=' + encodeURIComponent('Chapter 2: Season ' + n + '/Loot Pool')).parse.wikitext['*'];
  t.split(/\n\|-\n|\n\|(?![-}])/).forEach(cell => {
    const f = /\[\[File:([^|\]]+)/.exec(cell); if (!f) return;
    const ls = [...cell.matchAll(/\[\[(?!File:)([^\]|]+)(?:\|([^\]]+))?\]\]/g)]; if (!ls.length) return;
    const l = ls[ls.length - 1]; const nm = clean(l[2] || l[1]);
    if (!fileOf[nm]) fileOf[nm] = f[1].trim();
  });
}
const got = [];
for (const n of want) {
  const f = fileOf[n]; if (!f) { console.log('no file on the page:', n); continue; }
  const info = api('action=query&prop=imageinfo&iiprop=url&iiurlwidth=256&titles=' + encodeURIComponent('File:' + f));
  const p = info.query.pages[Object.keys(info.query.pages)[0]];
  if (!p || !p.imageinfo) { console.log('no imageinfo:', n, f); continue; }
  const buf = execFileSync('curl', ['-s', '-L', '-A', BUA, '-e', 'https://fortnite.fandom.com/', p.imageinfo[0].thumburl || p.imageinfo[0].url], { maxBuffer: 1 << 26 });
  const ext = sniff(buf); if (!ext) { console.log('not an image:', n); continue; }
  const rel = 'items/' + slug(n) + '.' + ext;
  fs.writeFileSync(path.join(ROOT, rel), buf);
  got.push([n, rel]); console.log('ok', n, '->', rel, buf.length);
}
if (got.length) {
  html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const A = ' // ==== FNCS 2021 art (tools/fetch-2021-item-art.js) ====', B = ' // ==== /FNCS 2021 art ====';
  let prev = [];
  const i = html.indexOf(A), j = html.indexOf(B);
  if (i >= 0 && j > i) { prev = [...html.slice(i, j).matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map(m => [m[1], m[2]]); html = html.slice(0, i) + html.slice(j + B.length + nl.length); }
  const all = new Map(prev.concat(got));
  const block = A + nl + [...all].map(([n, r]) => ' ' + JSON.stringify(n) + ': ' + JSON.stringify(r) + ',').join(nl) + nl + B + nl;
  const at = html.indexOf('const EXTRA_ITEM_ART={') + 'const EXTRA_ITEM_ART={'.length + nl.length;
  html = html.slice(0, at) + block + html.slice(at);
  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
}
console.log('fetched', got.length, 'of', want.length);
