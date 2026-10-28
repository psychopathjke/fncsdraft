// Подписчики YouTube про по ссылкам с Liquipedia (fetch-liqui-socials.js): страница канала, строка «N subscribers»
// (английская локаль, согласие cookie). Один запрос в 1,2 с. Вход ник<TAB>twitch<TAB>youtube-путь, выход ник<TAB>подписчики.
//   node tools/fetch-pro-youtube-subs.js <socials.tsv> <out.tsv>
'use strict';
const fs = require('fs'), https = require('https');
const rows = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t')).filter(t => t[2]);
const get = path => new Promise((res, rej) => {
  https.get('https://www.youtube.com/' + path, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
    'Accept-Language': 'en-US,en', 'Cookie': 'CONSENT=YES+1; SOCS=CAI' } }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) { r.resume(); return res({ redirect: r.headers.location }); }
    let s = ''; r.on('data', c => s += c); r.on('end', () => res({ code: r.statusCode, body: s }));
  }).on('error', rej);
});
const num = t => { const m = /^([\d.,]+)\s*([KMB]?)$/.exec(String(t).trim()); if (!m) return null; return Math.round(parseFloat(m[1].replace(/,/g, '')) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2]] || 1)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const out = [];
  for (const t of rows) {
    let r; try { r = await get(encodeURI(t[2])); if (r.redirect) r = await get(r.redirect.replace(/^https?:\/\/www\.youtube\.com\//, '')); } catch (e) { console.log('  !! ' + t[0] + ' ' + e.message); await sleep(1200); continue; }
    const m = r.body && /"([\d.,]+[KMB]?) subscribers"/.exec(r.body);
    const n = m ? num(m[1]) : null;
    if (n != null) out.push(t[0] + '\t' + n);
    await sleep(1200);
  }
  fs.writeFileSync(process.argv[3], out.join('\n'));
  console.log('youtube subs', out.length, 'of', rows.length);
})();
