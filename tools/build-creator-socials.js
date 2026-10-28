// Справочник CC_CREATOR_SOCIAL в index.html: имя креатора (как в CC_PROAM_TWITCH) → [подписчики YouTube, подписчики X].
// Источники — fetch-creator-socials.js (ссылки с канала Twitch), затем fetch-pro-youtube-subs.js и fetch-pro-x-followers.js.
//   node tools/build-creator-socials.js <youtube.tsv> <x.tsv>
'use strict';
const fs = require('fs'), path = require('path');
const read = f => fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
const map = {};
read(process.argv[2]).forEach(t => { (map[t[0]] = map[t[0]] || [0, 0])[0] = +t[1] || 0; });
read(process.argv[3]).forEach(t => { (map[t[0]] = map[t[0]] || [0, 0])[1] = +t[2] || 0; });
const keys = Object.keys(map).filter(k => map[k][0] || map[k][1]).sort();
const obj = '{' + keys.map(k => JSON.stringify(k) + ':[' + map[k].join(',') + ']').join(',') + '}';
fs.writeFileSync(path.join(__dirname, 'measured', 'creator-socials-2026.json'), JSON.stringify({at: '2026-10-28', creators: map}));
const f = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(f, 'utf8');
const a = '// ==== CC_CREATOR_SOCIAL (tools/build-creator-socials.js) ====\n', b = '// ==== /CC_CREATOR_SOCIAL ====';
const i = html.indexOf(a), j = html.indexOf(b);
if (i < 0 || j < i) throw new Error('markers');
html = html.slice(0, i + a.length) + 'const CC_CREATOR_SOCIAL=' + obj + ';\n' + html.slice(j);
fs.writeFileSync(f, html);
console.log('creator socials', keys.length);
