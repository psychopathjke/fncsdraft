// MVP парижского ЛАНа — $25 000, как на настоящем Кубке мира.
//
// На Reload Elite Series 2026 Championship кроме миллиона призовых есть отдельная
// награда MVP в $25 000 (её взял vic0 из чемпионской пары). В игре её не было.
//
// Кого назначать: сим считает киллы и очки на КОМАНДУ, а не на человека, поэтому
// судить по игре некого — MVP становится сильнейший по карточке игрок
// команды-чемпиона. Если это сам игрок, деньги идут ему целиком: награда личная,
// её не делят, в отличие от призовых (ccShareOf).
//
//   node tools/patch-ewc-mvp.js
const fs = require('fs'), path = require('path');
const FILE = path.join(path.resolve(__dirname, '..'), 'index.html');
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, 'utf8');
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes('CC_RC_MVP')) { console.log('уже впаяно'); process.exit(0); }

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ': якорь встречается ' + n + ' раз');
  src = src.replace(needle, repl);
};

// 1. Сумма — рядом с таблицей призовых, чтобы обе цифры лежали вместе.
swap('function rcPrize(place){',
  '/* Награда MVP — сверх таблицы призовых: на настоящем ЛАНе 2026 года это\n' +
  '   $25 000 (Liquipedia, Reload Elite Series/2026). */\n' +
  'const CC_RC_MVP=25000;\n' +
  'function rcPrize(place){', 'сумма MVP');

// 2. Выдача — сразу после призовых финала.
const anchor = "    // A proper noun, the same in every language, so no string carries it.\n" +
               "    careerCongrats(ranked, you, 'Reload Championship');";
swap(anchor,
  "    /* MVP турнира. Судить по игре некого: сим пишет киллы и очки команде, а\n" +
  "       не человеку, — поэтому награду берёт сильнейший по карточке игрок\n" +
  "       команды-чемпиона. Деньги личные и не делятся: ccShareOf здесь не место. */\n" +
  "    const champT=ranked[0];\n" +
  "    const mvpCard=((champT && (champT.squad||champT._cards||[])) || []).slice()\n" +
  "      .sort((a,b)=>((b&&(b.rating||b._ovr))||0)-((a&&(a.rating||a._ovr))||0))[0];\n" +
  "    if(mvpCard){\n" +
  "      const mvpMine = champT===you && !!mvpCard.isYou;\n" +
  "      if(mvpMine) ccPayIn(CC_RC_MVP);\n" +
  "      careerNews(mvpMine?'good':'flat', 'ccNewsRcMvp',\n" +
  "                 [mvpCard.handle||mvpCard.nick||'', ccNum(CC_RC_MVP)]);\n" +
  "    }\n" + anchor, 'выдача MVP');

// 3. Строка новости — В КАЖДЫЙ словарь, где есть строка чемпиона: английских
//    словарей в файле несколько, и ключ нужен всем, иначе у части языков новость
//    придёт пустой. Язык опознаётся по самой строке чемпиона.
const MVP_BY_LANG=[
  [/ЧЕМПИОН/,      "ccNewsRcMvp:(n,m)=>'MVP Reload Championship — '+n+', $'+m,"],
  [/CHAMPION DU/,  "ccNewsRcMvp:(n,m)=>'MVP DU RELOAD CHAMPIONSHIP — '+n+', '+m+' $',"],
  [/CAMPIONE/,     "ccNewsRcMvp:(n,m)=>'MVP DEL RELOAD CHAMPIONSHIP — '+n+', $'+m,"],
  [/CAMPE/,        "ccNewsRcMvp:(n,m)=>'MVP DO RELOAD CHAMPIONSHIP — '+n+', $'+m,"],
  [/CHAMPION/,     "ccNewsRcMvp:(n,m)=>'RELOAD CHAMPIONSHIP MVP — '+n+', $'+m,"]
];
let added=0;
src = src.split(LF).map(line => {
  if (line.indexOf('ccNewsRcChamp:') < 0) return line;
  const hit = MVP_BY_LANG.find(([re]) => re.test(line));
  if (!hit) return line;
  added++;
  const pad = (line.match(/^s*/) || [''])[0];
  return line + LF + pad + hit[1];
}).join(LF);
if (added < 5) throw new Error('строка MVP добавлена только в ' + added + ' словарей');
console.log('словарей со строкой MVP: ' + added);
// 4. Новость про себя — в тот же список, что и остальные строки Парижа.
swap("  ccNewsRcThrough:'you', ccNewsRcDrop:'you', ccNewsRcOut:'you', ccNewsRcCash:'you', ccNewsRcChamp:'you',",
     "  ccNewsRcThrough:'you', ccNewsRcDrop:'you', ccNewsRcOut:'you', ccNewsRcCash:'you', ccNewsRcChamp:'you',\n" +
     "  ccNewsRcMvp:'you',", 'автор новости');

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, 'utf8');
console.log('MVP впаян; index.html ' + (fs.statSync(FILE).size / 1048576).toFixed(2) + ' МБ');
