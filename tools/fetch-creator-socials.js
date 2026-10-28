// YouTube и X контент-мейкеров карьеры — из ссылок «Социальные сети» на их собственном канале Twitch (публичный GraphQL
// Twitch, поле channel.socialMedias): ссылка с канала самого креатора и есть доказательство, что аккаунт его.
// Вход ник<TAB>twitch-логин (из CC_PROAM_TWITCH), выход в формате fetch-liqui-socials.js:
// ник<TAB>twitch<TAB>youtube-путь<TAB>x-ник — дальше те же fetch-pro-youtube-subs.js и fetch-pro-x-followers.js.
//   node tools/fetch-creator-socials.js <logins.tsv> <out.tsv>
'use strict';
const fs = require('fs'), https = require('https');
const CLIENT = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const rows = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
const gql = body => new Promise((res, rej) => {
  const data = JSON.stringify(body);
  const req = https.request({ host: 'gql.twitch.tv', path: '/gql', method: 'POST',
    headers: { 'Client-Id': CLIENT, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, r => {
    let out = ''; r.on('data', c => out += c); r.on('end', () => { try { res(JSON.parse(out)); } catch (e) { rej(new Error(out.slice(0, 200))); } });
  });
  req.on('error', rej); req.write(data); req.end();
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ytPath = url => {
  const p = String(url).replace(/^https?:\/\/(www\.|m\.)?youtube\.com\//i, '').replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').slice(0, 2).join('/');
  if (!p || /^https?:/i.test(p)) return '';
  if (/^(@|channel\/|c\/|user\/)/.test(p)) return p;
  return /^UC[\w-]{20,}$/.test(p) ? 'channel/' + p : '@' + p.split('/')[0];
};
const xHandle = url => {
  const h = String(url).replace(/^https?:\/\/(www\.|mobile\.)?(twitter|x)\.com\//i, '').replace(/[\/?#].*$/, '').replace(/^@/, '');
  return /^[A-Za-z0-9_]{1,15}$/.test(h) && !/^https?/i.test(h) ? h : '';
};
(async () => {
  const out = [];
  for (let i = 0; i < rows.length; i += 20) {
    const chunk = rows.slice(i, i + 20);
    const q = '{users(logins:[' + chunk.map(t => JSON.stringify(t[1])).join(',') + ']){login channel{socialMedias{name url}}}}';
    let r; try { r = await gql({ query: q }); } catch (e) { console.log('  !! ' + e.message); await sleep(2000); continue; }
    const users = (r.data && r.data.users) || [];
    chunk.forEach(t => {
      const u = users.find(x => x && x.login && x.login.toLowerCase() === t[1].toLowerCase());
      const sm = (u && u.channel && u.channel.socialMedias) || [];
      // Первая ссылка своего вида: у многих стоит ещё второй канал (клипы, VOD), основной обычно первым.
      const yt = sm.map(m => /youtube\.com\//i.test(m.url) ? ytPath(m.url) : '').find(Boolean) || '';
      const x = sm.map(m => /(twitter|x)\.com\//i.test(m.url) ? xHandle(m.url) : '').find(Boolean) || '';
      out.push(t[0] + '\t' + t[1] + '\t' + yt + '\t' + x);
    });
    await sleep(600);
  }
  fs.writeFileSync(process.argv[3], out.join('\n'));
  console.log('creator socials', out.length, 'yt', out.filter(l => l.split('\t')[2]).length, 'x', out.filter(l => l.split('\t')[3]).length);
})();
