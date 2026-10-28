// Подписчики X про по никам из анкет Liquipedia (fetch-liqui-socials.js, 4-я колонка) — через api.fxtwitter.com/2/profile
// (старый адрес /<ник> отвечает 404 через раз). Один запрос в 1 с. Выход ник<TAB>x-ник<TAB>подписчики.
//   node tools/fetch-pro-x-followers.js <socials.tsv> <out.tsv> [прошлый-out.tsv]
'use strict';
const fs = require('fs'), https = require('https');
// Третий аргумент — прошлый выход: уже снятые не трогаются, дописываются пропущенные.
const have = process.argv[4] && fs.existsSync(process.argv[4]) ? fs.readFileSync(process.argv[4], 'utf8').split(/\r?\n/).filter(Boolean) : [];
const done = new Set(have.map(l => l.split('\t')[0]));
const rows = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t')).filter(t => t[3] && !done.has(t[0]));
const get = (x, alt) => new Promise((res, rej) => {
  https.get('https://api.fxtwitter.com/' + (alt ? '' : '2/profile/') + encodeURIComponent(x), { headers: { 'User-Agent': 'fncsdraft.com stats (contact: keegorka@gmail.com)' } }, r => {
    let s = ''; r.on('data', c => s += c); r.on('end', () => { try { res(JSON.parse(s)); } catch (e) { res(null); } });
  }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const out = have.slice();
  for (const t of rows) {
    // Сервис отвечает 404 через раз: до трёх попыток, через раз — старым адресом.
    let n = null;
    for (let k = 0; k < 4 && n == null; k++) { let j = null; try { j = await get(t[3], k % 2 === 1); } catch (e) {} n = j && j.user && j.user.followers; if (n == null) await sleep(1500); }
    if (n != null) out.push(t[0] + '\t' + t[3] + '\t' + n);
    await sleep(1000);
  }
  fs.writeFileSync(process.argv[3], out.join('\n'));
  console.log('x followers', out.length, 'of', rows.length);
})();
