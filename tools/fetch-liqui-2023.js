// Страницы Liquipedia про FNCS 2023 — wikitext в tools/measured/liqui-2023/.
// API держит один action=parse в 30 с, поэтому пауза 31 с между запросами.
//   node tools/fetch-liqui-2023.js [страница ...]
const fs = require('fs'), path = require('path'), https = require('https'), zlib = require('zlib');
const OUT = path.join(__dirname, 'measured', process.env.LIQUI_DIR || 'liqui-2023');
fs.mkdirSync(OUT, { recursive: true });
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : [
  'Fortnite_Champion_Series/2023',
  'Fortnite_Champion_Series/2023/Major_1/Europe/Week_1',
  'Fortnite_Champion_Series/2023/Major_1/Europe/Surge_Weeks',
  'Fortnite_Champion_Series/2023/Major_2/Europe',
  'Fortnite_Champion_Series/2023/Major_2/Europe/Week_1',
  'Fortnite_Champion_Series/2023/Major_3/Europe',
  'Fortnite_Champion_Series/2023/Major_3/Europe/Week_1',
  'Fortnite_Champion_Series/2023/Last_Chance_Major/Europe',
  'Template:FNCS_2023_points_format_1',
];
const get = (page) => new Promise((res, rej) => {
  const url = 'https://liquipedia.net/fortnite/api.php?action=parse&format=json&prop=wikitext&page=' + encodeURIComponent(page);
  https.get(url, { headers: { 'Accept-Encoding': 'gzip', 'User-Agent': 'fncsdraft-research/1.0 (keegorka@gmail.com)' } }, r => {
    const chunks = []; r.on('data', c => chunks.push(c));
    r.on('end', () => { try { res(zlib.gunzipSync(Buffer.concat(chunks)).toString('utf8')); } catch (e) { res(Buffer.concat(chunks).toString('utf8')); } });
  }).on('error', rej);
});
(async () => {
  for (let i = 0; i < PAGES.length; i++) {
    const p = PAGES[i], file = path.join(OUT, p.replace(/[\/:]/g, '__') + '.txt');
    if (fs.existsSync(file)) { console.log('есть ', p); continue; }
    if (i) await new Promise(r => setTimeout(r, 31000));
    const body = await get(p);
    let t = null; try { const j = JSON.parse(body); t = j.parse && j.parse.wikitext && j.parse.wikitext['*']; if (!t) console.log('нет  ', p, JSON.stringify(j.error || j).slice(0, 120)); } catch (e) { console.log('плохо', p, body.slice(0, 120)); }
    if (t) { fs.writeFileSync(file, t); console.log('ок   ', p, t.length); }
  }
})();
