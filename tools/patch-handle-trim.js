// Один человек — одно написание: ник с пробелом по краям это тот же человек.
//
// Отзыв: «только двое japko в 25 году». В данных Tracker'а 2024-2025 годов ник
// приезжает с ХВОСТОВЫМ ПРОБЕЛОМ («Japko »), а в наборах 2026-го — без него, и
// hKey (просто toLowerCase) считал это двумя разными людьми. Замер: 90 ников с
// пробелом по краям на 267 карточек, у 71 из них есть близнец без пробела —
// столько живых людей было разорвано пополам.
//
// Правится два места: hKey (личность везде — пары, ростер, пул карьеры) и
// pushCard (само написание на карточке и ключ склейки).
//
//   node tools/patch-handle-trim.js
const fs = require('fs'), path = require('path');
const FILE = path.join(path.resolve(__dirname, '..'), 'index.html');
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, 'utf8');
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ': якорь встречается ' + n + ' раз');
  src = src.replace(needle, repl);
};

if (src.includes('.toLowerCase().trim(); }')) { console.log('уже поправлено'); process.exit(0); }

swap("function hKey(p){ return String(p && p.handle || p || '').toLowerCase(); }",
     "/* Пробел по краям ника — мусор выгрузки, а не имя: в таблицах 2024-2025 тот же\n" +
     "   человек приезжает как «Japko », а в 2026-м как «Japko», и без trim это два\n" +
     "   разных человека во всём файле сразу — в парах, в ростере, в пуле карьеры.\n" +
     "   Отзыв: «только двое japko в 25 году». Замер до правки: 90 ников с пробелом\n" +
     "   по краям, у 71 есть близнец без пробела. */\n" +
     "function hKey(p){ return String(p && p.handle || p || '').toLowerCase().trim(); }",
     'hKey');

swap("function pushCard(card){\n  const key=card.handle+'|'+card.event+'|'+card.placement;",
     "function pushCard(card){\n  // Написание чистится ЗДЕСЬ, до ключа склейки: иначе «Japko » и «Japko» с\n" +
     "  // одного турнира лягут двумя карточками. См. hKey.\n" +
     "  card.handle=String(card.handle||'').trim();\n" +
     "  const key=card.handle+'|'+card.event+'|'+card.placement;",
     'pushCard');

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, 'utf8');
console.log('правка внесена, index.html ' + (fs.statSync(FILE).size / 1048576).toFixed(2) + ' МБ');
