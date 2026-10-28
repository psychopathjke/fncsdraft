// Twitch и YouTube игрока из его инфобокса на Liquipedia (|twitch=, |youtube=) — для настоящих цифр подписчиков в карьере
// за про 2026 года (28.10, его «можешь игрокам 2026 года подтянуть цифры твич и ютуб»). Ссылка с собственной страницы
// игрока и есть доказательство, что канал его, а не тёзки. Правила Liquipedia те же, что у fetch-liqui-twitch.js:
// UA, gzip, один запрос в 2,1 с.
//   node tools/fetch-liqui-socials.js <handles.txt> <out.tsv>   → ник<TAB>twitch-логин<TAB>youtube-путь<TAB>x-ник
'use strict';
const fs = require('fs'), https = require('https'), zlib = require('zlib');
const UA = 'fncsdraft.com photo fetcher (contact: keegorka@gmail.com)';
const API = 'https://liquipedia.net/fortnite/api.php';
const GAP_MS = 2100, BATCH = 50;
const get = url => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip' } }, res => {
    if (res.statusCode === 429) { res.resume(); const e = new Error('HTTP 429'); e.blocked = true; return reject(e); }
    if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
    const ch = []; res.on('data', c => ch.push(c));
    res.on('end', () => { let b = Buffer.concat(ch); if ((res.headers['content-encoding'] || '').includes('gzip')) b = zlib.gunzipSync(b); resolve(b.toString('utf8')); });
  }).on('error', reject);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const handles = [...new Set(fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).map(s => s.split('\t')[0].trim()).filter(Boolean))];
  const out = [];
  for (let i = 0; i < handles.length; i += BATCH) {
    const batch = handles.slice(i, i + BATCH);
    if (i) await sleep(GAP_MS);
    let data;
    try { data = JSON.parse(await get(API + '?action=query&format=json&redirects=1&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(batch.join('|')))); }
    catch (e) { console.log('  !! ' + e.message); if (e.blocked) break; continue; }
    const norm = new Map(); ((data.query || {}).normalized || []).forEach(n => norm.set(n.to, n.from));
    const redir = new Map(); ((data.query || {}).redirects || []).forEach(r => redir.set(r.to, r.from));
    let hit = 0;
    Object.values((data.query || {}).pages || {}).forEach(p => {
      if (!p.revisions) return;
      const text = p.revisions[0].slots.main['*'] || '';
      if (!/\{\{Infobox player/i.test(text)) return;
      const tw = /\|\s*twitch\s*=\s*([^\n|}]+)/.exec(text), yt = /\|\s*youtube\s*=\s*([^\n|}]+)/.exec(text), tx = /\|\s*twitter\s*=\s*([^\n|}]+)/.exec(text);
      let login = tw ? tw[1].trim().replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').replace(/\/.*$/, '').toLowerCase() : '';
      if (!/^[a-z0-9_]{3,25}$/.test(login)) login = '';
      let ytp = yt ? yt[1].trim().replace(/^https?:\/\/(www\.|m\.)?youtube\.com\//i, '').replace(/[?#].*$/, '').replace(/\/+$/, '') : '';
      if (ytp && !/^(@|channel\/|c\/|user\/)/.test(ytp)) ytp = (/^UC[\w-]{20,}$/.test(ytp) ? 'channel/' : '@') + ytp;
      let xh = tx ? tx[1].trim().replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, '').replace(/[\/?#].*$/, '').replace(/^@/, '') : '';
      if (!/^[A-Za-z0-9_]{1,15}$/.test(xh)) xh = '';
      if (!login && !ytp && !xh) return;
      let title = p.title; if (redir.has(title)) title = redir.get(title); if (norm.has(title)) title = norm.get(title);
      batch.filter(h => h === title || h.toLowerCase() === String(title).toLowerCase()).forEach(h => { out.push(h + '\t' + login + '\t' + ytp + '\t' + xh); hit++; });
    });
    console.log('  batch ' + (i / BATCH + 1) + '/' + Math.ceil(handles.length / BATCH) + ': ' + hit);
  }
  fs.writeFileSync(process.argv[3], out.join('\n'));
  console.log('social links', out.length);
})();
