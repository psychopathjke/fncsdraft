// Вливает найденные портреты в PLAYER_PHOTO между маркерами «Portraits by strongest card».
// Вход: JSON {ник: файл} от fetch-player-photos-v2.js (Liquipedia) и fetch-twitch-portraits.js
// (Twitch) плюс список «ник<TAB>регион» — регион сильнейшей карточки ника: у тёзок лицо
// достаётся тому, кого знает Liquipedia/Twitch, то есть самому сильному из них.
//   node tools/splice-player-photos.js <regions.tsv> <liqui.json> [twitch.json]
'use strict';
const fs = require('fs'), path = require('path');
const [regFile, liquiFile, twitchFile] = process.argv.slice(2);
const reg = {};
fs.readFileSync(regFile, 'utf8').split(/\r?\n/).forEach(l => { const t = l.split('\t'); if (t[0] && t[1]) reg[t[0]] = t[1]; });
const liqui = JSON.parse(fs.readFileSync(liquiFile, 'utf8'));
const tw = twitchFile ? JSON.parse(fs.readFileSync(twitchFile, 'utf8')) : {};
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const A = '  // ==== Portraits by strongest card (tools/splice-player-photos.js) ====', B = '  // ==== /Portraits by strongest card ====';
const rows = [];
const add = (h, f, src) => {
  if (!reg[h] || !fs.existsSync(path.join(__dirname, '..', 'photos', f))) return;
  const k = h + '@' + reg[h];
  if (s.includes(JSON.stringify(k) + ':') && !(s.indexOf(A) >= 0 && s.indexOf(JSON.stringify(k) + ':') > s.indexOf(A))) return;
  rows.push('  ' + JSON.stringify(k) + ': ' + JSON.stringify(f) + ',   // ' + src);
};
Object.keys(liqui).forEach(h => add(h, liqui[h], 'Liquipedia'));
Object.keys(tw).forEach(h => { if (!liqui[h]) add(h, tw[h], 'Twitch'); });
const block = A + nl + '  /* Игроки с рейтингом от 80 без портрета: Liquipedia (инфобокс, CC-BY-SA 3.0), где там' + nl +
  '     заглушка — аватар Twitch с приметой Fortnite. Ключ — регион сильнейшей карточки ника. */' + nl +
  rows.join(nl) + nl + B + nl;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length + nl.length);
else {
  const at = s.indexOf('const PLAYER_PHOTO={');
  const end = s.indexOf(nl + '};', at);
  if (at < 0 || end < 0) throw new Error('PLAYER_PHOTO not found');
  s = s.slice(0, end + nl.length) + block + s.slice(end + nl.length);
}
fs.writeFileSync(file, s);
console.log('portraits', rows.length);
