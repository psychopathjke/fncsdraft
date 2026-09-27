// Twitch-канал игрока из его инфобокса на Liquipedia (|twitch=) — для тех, у кого на Liquipedia
// нет фото. Выход — строки «ник<TAB>логин<TAB>liqui» для fetch-twitch-portraits.js: ссылка с
// собственной страницы игрока и есть доказательство, что канал его, а не тёзки.
// Правила Liquipedia те же, что у fetch-player-photos-v2.js: UA, gzip, один запрос в 2,1 с.
//   node tools/fetch-liqui-twitch.js <handles.txt> <out.tsv>
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
      const m = /\|\s*twitch\s*=\s*([^\n|}]+)/.exec(text); if (!m) return;
      const login = m[1].trim().replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').replace(/\/.*$/, '').toLowerCase();
      if (!/^[a-z0-9_]{3,25}$/.test(login)) return;
      let title = p.title; if (redir.has(title)) title = redir.get(title); if (norm.has(title)) title = norm.get(title);
      // Все ники, которые Liquipedia свела к этой странице (регистр первой буквы).
      batch.filter(h => h === title || h.toLowerCase() === String(title).toLowerCase()).forEach(h => { out.push(h + '\t' + login + '\tliqui'); hit++; });
    });
    console.log('  batch ' + (i / BATCH + 1) + '/' + Math.ceil(handles.length / BATCH) + ': ' + hit);
  }
  fs.writeFileSync(process.argv[3], out.join('\n'));
  console.log('twitch links', out.length);
})();
