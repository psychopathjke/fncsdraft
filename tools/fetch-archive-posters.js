// Постеры капов из архива Tracker (tools/measured/archive-posters.json: id события → адрес
// картинки Epic) для семейств tools/measured/cups-archive.json. Качает по одному постеру на
// семейство (финал, если есть), кладёт в art/cups/a-<хэш>.jpg и пишет
// tools/measured/cups-archive-posters.json {семейство: 'cups/a-…'} для build-cups-archive.js.
//   node tools/fetch-archive-posters.js
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const cups = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'cups-archive.json'), 'utf8'));
const posters = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'archive-posters.json'), 'utf8'));
const ids = Object.keys(posters);
const out = {}, tmp = path.join(require('os').tmpdir(), 'arch-posters'); fs.mkdirSync(tmp, { recursive: true });
for (const key of Object.keys(cups)) {
  const fam = key.split('|')[1];
  const mine = ids.filter(i => i === fam || i.startsWith(fam + '_'));
  const pick = mine.find(i => /Final/i.test(i)) || mine[0];
  if (!pick) continue;
  const url = posters[pick];
  const h = crypto.createHash('md5').update(url).digest('hex').slice(0, 10);
  const rel = 'cups/a-' + h, dst = path.join(ROOT, 'art', rel + '.jpg');
  if (!fs.existsSync(dst)) {
    const raw = path.join(tmp, h + path.extname(url.split('?')[0]).toLowerCase());
    try {
      execFileSync('curl', ['-s', '-f', '-L', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0 Safari/537.36', '-e', 'https://fortnitetracker.com/', '-o', raw, url]);
      execFileSync('node', [path.join(__dirname, 'png-to-jpg.js'), raw, dst, '0.78']);
    } catch (e) { console.log('!! ' + fam + ' ' + url); continue; }
  }
  out[fam] = rel;
}
fs.writeFileSync(path.join(__dirname, 'measured', 'cups-archive-posters.json'), JSON.stringify(out, null, 1));
console.log('posters', Object.keys(out).length, 'unique', new Set(Object.values(out)).size);
