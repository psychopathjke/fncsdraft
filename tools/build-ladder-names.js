// Настоящие ники лестницы: люди, которые реально играли кубки дивизионов 2–5 (Epic S41,
// Tracker imp_leaderboard, 7 регионов, снято 29.09.2026 в tools/measured/ladder-real-names.json).
// Ник — как в Epic (nickname), флаг — GeoIdentity, который человек сам выбрал (playerFlagTokens),
// переведённый в ISO-код; «global»/«fortnite»/пусто — без флага. По региону не больше CAP,
// с равной долей каждого дивизиона. Вклеивается между маркерами «LADDER NAMES begin/end».
//   CC_LADDER_REAL = {EU:[[ник, iso|'', дивизион], …], …}
//   node tools/build-ladder-names.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
let src = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'ladder-real-names.json'), 'utf8'));
if (typeof src === 'string') src = JSON.parse(src);
const CAP = 5000;   // весь снятый запас: на большое лобби его едва хватает, слоги — только когда кончился

// GeoIdentity → ISO: английское имя страны без пробелов и знаков, плюс то, что Epic пишет иначе.
const geo = {};
const dn = new Intl.DisplayNames(['en'], { type: 'region' });
for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
  const c = String.fromCharCode(a, b);
  let n; try { n = dn.of(c); } catch (e) { continue; }
  if (n && n !== c) geo[n.toLowerCase().replace(/[^a-z]/g, '')] = c.toLowerCase();
}
Object.assign(geo, { unitedkingdom: 'gb', england: 'gb', scotland: 'gb', wales: 'gb', northernireland: 'gb',
  unitedstates: 'us', czechrepublic: 'cz', turkey: 'tr', southkorea: 'kr', russia: 'ru', vietnam: 'vn',
  bosniaandherzegovina: 'ba', ivorycoast: 'ci', macedonia: 'mk', northmacedonia: 'mk', uae: 'ae',
  unitedarabemirates: 'ae', hongkong: 'hk', taiwan: 'tw', palestine: 'ps', kosovo: 'xk' });
const noFlag = new Set(['', 'global', 'fortnite', 'rainbow', 'pride']);

// Грубое и 18+ — мимо: ники настоящие, но сайт не для этого (корни, без учёта регистра и
// разделителей: «ladyboy enjoyer», «n1gg…», «p0rn» и т. п.).
const BAD = /n[i1!]gg|nigg|nazi|hitler|h[i1]tl|fag|f4g|retard|rape|porn|p0rn|sex|s3x|cum|dick|d1ck|cock|pussy|puss[i1]|penis|vagina|boob|tits|t1ts|anal|horny|hentai|nude|naked|ladyboy|whore|slut|bitch|b[i1]tch|fuck|fuk|f[u*]ck|shit|cunt|kkk|isis|jihad|terror|suicide|kys|pedo|p3do|onlyfans|milf|gay|lesb|trans|femboy|furry|hoe\b|thot|incel|negro|chink|spic|kike|tranny|cancer|autis|weed|cocaine|drug|blyat|suka|pidor|pid[o0]r|hui|huy|xyi|zalupa|mudak|ebal|eban|blya|scheisse|scheiße|hurensohn|puta|puto|mierda|cabron|cabrón|pendejo|verga|caralho|porra|buceta|merda|foda|putain|merde|salope|connard|cazzo|stronzo|vaffanculo|kurwa|chuj|jebac|pizda|orospu|amk|siktir|sik|göt|kanker|kut|lul\b|hoer|fitta|kuk|knull|jävla|perkele|vittu/i;
const byReg = {};
let unknown = {}, bad = 0;
/* Ник — как его читают в таблице (его правка 29.09, скрин 25 «странно выглядит»: «twitch
   neytoxfn», «nl brunixGOTy!», «daan! 7» рядом с обычными). Убирается обвес, который люди вешают
   на имя в Epic: приставки стрима (twitch/ttv/yt/tiktok/kick), двух-трёхбуквенный тег впереди,
   одиночное число в конце, «!»/«ǃ». Остаётся ник — буквы и цифры (._- внутри), не больше одного
   пробела; что после чистки на ник не похоже — мимо. */
const seenName = new Set();
function cleanNick(raw) {
  let n = String(raw || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/[ǃ!]+/g, ' ').replace(/\s+/g, ' ').trim();
  n = n.replace(/^(twitch|ttv|yt|youtube|tiktok|tt|kick|twt)[\s_.\-]+/i, '').replace(/[\s_.\-]+(ttv|yt|twitch|tiktok|on twitch)$/i, '');
  n = n.replace(/^(twitter|twitr|twtr|tw|x|ig|index|clip|clips)[\s_.\-]+/i, '');
  n = n.replace(/\s+\d{1,3}$/, '').trim();
  // Два слова: короткое (до 4 букв) — тег клуба или «тренд» (fv, yhyh, fn) — отбрасывается.
  const w = n.split(' ');
  if (w.length === 2) { if (w[1].length <= 4) n = w[0]; else if (w[0].length <= 4) n = w[1]; }
  if (w.length > 2) return null;
  if (!/^[\p{L}\p{N}._\-]+( [\p{L}\p{N}._\-]+)?$/u.test(n)) return null;
  // Один алфавит на ник (латиница, кириллица, японский — но не вперемешку) и без «ÿÿÿ».
  const latin = /[A-Za-zÀ-ɏ]/.test(n), other = /[^\u0000-ɏ\d._\- ]/.test(n);
  if (latin && other) return null;
  if (/(.)\1\1/u.test(n)) return null;
  if (/^user[\s_.\-]?[0-9a-f]{6,}$/i.test(n)) return null;              // «User-0d4def18e4»
  if (!/\p{L}/u.test(n)) return null;                                   // «168»
  if (n.split(' ').some(t => /^[\d.\-_]{4,}$/.test(t))) return null;      // «Emond 12.21.2009»
  if (!latin && [...n].length > 8) return null;                         // длинная фраза вместо ника
  if (latin && n.length >= 8 && (n.match(/[aeiouyAEIOUY]/g) || []).length / n.length < 0.15) return null;  // «8b3v9bpkw7cgm»
  return n;
}
for (const [reg, nick, g, div] of src.names) {
  const name = cleanNick(nick);
  if (!name || name.length < 3 || name.length > 16) continue;
  const key = reg + '|' + name.toLowerCase(); if (seenName.has(key)) continue; seenName.add(key);
  if (BAD.test(name.replace(/[\s._\-ǃ!]/g, ''))) { bad++; continue; }
  let iso = '';
  if (!noFlag.has(g)) { iso = geo[g] || ''; if (!iso) unknown[g] = (unknown[g] || 0) + 1; }
  (byReg[reg] = byReg[reg] || {});
  (byReg[reg][div] = byReg[reg][div] || []).push([name, iso, div]);
}
// Равная доля дивизионов, внутри дивизиона — детерминированный отбор через шаг.
const out = {};
for (const reg of Object.keys(byReg)) {
  const divs = Object.keys(byReg[reg]).sort();
  const per = Math.floor(CAP / divs.length);
  out[reg] = [];
  for (const d of divs) {
    const arr = byReg[reg][d];
    const step = Math.max(1, arr.length / per);
    for (let i = 0; i < arr.length && out[reg].length < CAP; i += step) out[reg].push(arr[Math.floor(i)]);
  }
}
const body = '/* LADDER NAMES begin — tools/build-ladder-names.js */\n' +
  'const CC_LADDER_REAL=' + JSON.stringify(out) + ';\n' +
  '/* LADDER NAMES end */';
const file = path.join(ROOT, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const A = html.indexOf('/* LADDER NAMES begin'), B = html.indexOf('/* LADDER NAMES end */');
if (A < 0 || B < 0) throw new Error('markers not found');
const eol = html.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
html = html.slice(0, A) + body.replace(/\n/g, eol) + html.slice(B + '/* LADDER NAMES end */'.length);
fs.writeFileSync(file, html);
console.log(Object.entries(out).map(([r, a]) => r + ' ' + a.length).join(', '), '| bytes', body.length, '| unknown flags', JSON.stringify(unknown), '| rude dropped', bad);
