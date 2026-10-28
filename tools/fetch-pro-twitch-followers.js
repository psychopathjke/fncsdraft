// Фолловеры Twitch про по логинам из fetch-liqui-socials.js — тем же публичным GraphQL Twitch, что и
// fetch-twitch-portraits.js (20 логинов за запрос). Вход ник<TAB>логин<TAB>youtube, выход ник<TAB>логин<TAB>фолловеры.
//   node tools/fetch-pro-twitch-followers.js <socials.tsv> <out.tsv>
'use strict';
const fs = require('fs'), https = require('https');
const CLIENT = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const rows = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t')).filter(t => t[1]);
const gql = body => new Promise((res, rej) => {
  const data = JSON.stringify(body);
  const req = https.request({ host: 'gql.twitch.tv', path: '/gql', method: 'POST',
    headers: { 'Client-Id': CLIENT, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, r => {
    let out = ''; r.on('data', c => out += c); r.on('end', () => { try { res(JSON.parse(out)); } catch (e) { rej(new Error(out.slice(0, 200))); } });
  });
  req.on('error', rej); req.write(data); req.end();
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const out = [];
  for (let i = 0; i < rows.length; i += 20) {
    const chunk = rows.slice(i, i + 20);
    const q = '{users(logins:[' + [...new Set(chunk.map(t => t[1]))].map(l => JSON.stringify(l)).join(',') + ']){login followers{totalCount}}}';
    let r; try { r = await gql({ query: q }); } catch (e) { console.log('  !! ' + e.message); await sleep(2000); continue; }
    const users = (r.data && r.data.users) || [];
    chunk.forEach(t => { const u = users.find(x => x && x.login && x.login.toLowerCase() === t[1]); if (u) out.push(t[0] + '\t' + t[1] + '\t' + ((u.followers || {}).totalCount || 0)); });
    await sleep(600);
  }
  fs.writeFileSync(process.argv[3], out.join('\n'));
  console.log('twitch followers', out.length);
})();
