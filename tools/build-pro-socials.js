// Справочник CC_PRO_SOCIAL в index.html: ник в нижнем регистре → [фолловеры Twitch, подписчики YouTube].
// Источники — выход fetch-pro-twitch-followers.js и fetch-pro-youtube-subs.js; снимок пишется и в
// tools/measured/pro-socials-2026.json.
//   node tools/build-pro-socials.js <twitch.tsv> <youtube.tsv>
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
const map = {};
read(process.argv[2]).forEach(t => { const k = t[0].toLowerCase(); (map[k] = map[k] || [0, 0])[0] = +t[2] || 0; });
read(process.argv[3]).forEach(t => { const k = t[0].toLowerCase(); (map[k] = map[k] || [0, 0])[1] = +t[1] || 0; });
Object.keys(map).forEach(k => { if (!map[k][0] && !map[k][1]) delete map[k]; });
const keys = Object.keys(map).sort();
const obj = '{' + keys.map(k => JSON.stringify(k) + ':[' + map[k].join(',') + ']').join(',') + '}';
fs.writeFileSync(path.join(__dirname, 'measured', 'pro-socials-2026.json'), JSON.stringify({at: '2026-10-28', players: map}));
const f = path.join(ROOT, 'index.html');
let html = fs.readFileSync(f, 'utf8');
const a = '// ==== CC_PRO_SOCIAL (tools/build-pro-socials.js) ====\n', b = '// ==== /CC_PRO_SOCIAL ====';
const i = html.indexOf(a), j = html.indexOf(b);
if (i < 0 || j < i) throw new Error('markers');
html = html.slice(0, i + a.length) + 'const CC_PRO_SOCIAL=' + obj + ';\n' + html.slice(j);
fs.writeFileSync(f, html);
console.log('pro socials', keys.length);
