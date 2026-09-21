// Portraits off Twitch for players Liquipedia has no photo of (21 September 2026).
//
// His ask: «добавь в 25 году аватарки людям, у которых их нет». Liquipedia holds
// a portrait for one player in eighty; most pros do have a Twitch channel under
// the same nickname, and its avatar is public through the same GraphQL the
// creator avatars were taken with (tools/fetch-creator-avatars.js).
//
// A nickname is not a proof of identity, so a channel is taken only with
// evidence it is the player: the login exists, the picture is not Twitch's
// default, and EITHER the last broadcast was Fortnite, OR the channel's own
// description mentions Fortnite/FNCS, OR the channel is big (≥20k followers)
// and its display name is the nickname letter for letter. Everything else is
// left as a monogram — a wrong face is worse than none.
//
//   node tools/fetch-twitch-portraits.js <handles.txt>
//
// Writes photos/<handle>.png and tools/photos-twitch.json {handle: file}.
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'photos');
const CLIENT = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
// A line may be «handle<TAB>login» — a club prefix stripped by hand («PDR Kenty» → kenty); such a
// guess is taken on Fortnite evidence only, never on size or a matching display name.
const rows = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(l => { const t = l.split('\t'); return { h: t[0], forced: t[1] || null }; });
const list = rows.map(r => r.h);
const loginOf = h => { const l = h.toLowerCase(); return /^[a-z0-9_]{3,25}$/.test(l) ? l : null; };
const gql = body => new Promise((res, rej) => {
  const data = JSON.stringify(body);
  const req = https.request({ host: 'gql.twitch.tv', path: '/gql', method: 'POST',
    headers: { 'Client-Id': CLIENT, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, r => {
    let out = ''; r.on('data', c => out += c); r.on('end', () => { try { res(JSON.parse(out)); } catch (e) { rej(new Error(out.slice(0, 200))); } });
  });
  req.on('error', rej); req.write(data); req.end();
});
const download = (url, file) => new Promise((res, rej) => {
  https.get(url, r => { if (r.statusCode !== 200) { r.resume(); return rej(new Error(r.statusCode)); } const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => { const b = Buffer.concat(ch); fs.writeFileSync(file, b); res(b.length); }); }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const safeFile = h => h.replace(/[^A-Za-z0-9_.-]/g, '') + '.png';
(async () => {
  const cands = rows.map(r => ({ h: r.h, login: r.forced ? r.forced.toLowerCase() : loginOf(r.h), guess: !!r.forced })).filter(x => x.login && /^[a-z0-9_]{3,25}$/.test(x.login));
  console.log(list.length + ' handles, ' + cands.length + ' look like a twitch login');
  const map = {}; const why = { fortnite: 0, desc: 0, big: 0 };
  let seen = 0, exists = 0;
  for (let i = 0; i < cands.length; i += 20) {
    const chunk = cands.slice(i, i + 20);
    const q = '{users(logins:[' + [...new Set(chunk.map(p => p.login))].map(l => JSON.stringify(l)).join(',') + ']){login displayName description profileImageURL(width:150) followers{totalCount} lastBroadcast{game{name}}}}';
    let r; try { r = await gql({ query: q }); } catch (e) { console.log('  !! ' + e.message); await sleep(2000); continue; }
    const users = (r.data && r.data.users) || [];
    for (const p of chunk) {
      seen++;
      const u = users.find(x => x && x.login && x.login.toLowerCase() === p.login);
      if (!u || !u.profileImageURL || /user-default-pictures/.test(u.profileImageURL)) continue;
      exists++;
      const game = ((u.lastBroadcast || {}).game || {}).name || '';
      const desc = u.description || '';
      const fol = (u.followers || {}).totalCount || 0;
      let ok = null;
      if (/fortnite/i.test(game)) ok = 'fortnite';
      else if (/fortnite|fncs|epic games/i.test(desc)) ok = 'desc';
      else if (!p.guess && fol >= 20000 && u.displayName === p.h) ok = 'big';
      if (!ok) continue;
      why[ok]++;
      const file = safeFile(p.h);
      try { await download(u.profileImageURL, path.join(OUT, file)); map[p.h] = file; console.log('  ok ' + p.h + ' (' + ok + ', ' + fol + ' fol)'); }
      catch (e) { console.log('  !! ' + p.h + ' download ' + e.message); }
    }
    await sleep(350);
  }
  const outFile = path.join(__dirname, process.argv[3] || 'photos-twitch.json');
  fs.writeFileSync(outFile, JSON.stringify(map, null, 1));
  console.log('\nchecked ' + seen + ', channel exists ' + exists + ', taken ' + Object.keys(map).length + ' ' + JSON.stringify(why));
})();
