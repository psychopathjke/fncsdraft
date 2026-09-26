// Обновить УЖЕ впаянные таблицы сессии 1 Ласт-Ченса 2026 на свежий генерат.
//
// Впайка (семь мест на набор) делается один раз — tools/patch-2026-lcq.js.
// Когда выгрузка стала глубже, менять надо только сами таблицы, флаги, событие и
// дату: этим занят этот скрипт. Каждый блок ищется по единственному якорю, и если
// его нет или он не один — падаем, ничего не записав.
//
//   node tools/build-2026-lcq.js && node tools/patch-2026-lcq-rows.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'index.html');
const GEN = path.join(__dirname, '2026-lcq.generated.js');

const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, 'utf8');
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (!src.includes('CARD_M1_LCQ1_RAW')) throw new Error('таблицы ещё не впаяны — сначала tools/patch-2026-lcq.js');

const gen = fs.readFileSync(GEN, 'utf8');
const PFXS = [...new Set([...gen.matchAll(/const CARD_([A-Z][0-9])_LCQ1_RAW=/g)].map(m => m[1]))];
if (PFXS.length !== 14) throw new Error('в генерате не 14 наборов, а ' + PFXS.length);

// Вырезать из текста объявление const <name>=<...>; — по балансу скобок, не регуляркой:
// в никах бывает всё, включая скобки и кавычки.
function decl(text, name) {
  const at = text.indexOf('const ' + name + '=');
  if (at < 0) return null;
  const open = text.indexOf('=', at) + 1;
  const first = text[open];
  if (first === '[' || first === '{') {
    const close = first === '[' ? ']' : '}';
    let d = 0, inStr = false, esc = false;
    for (let i = open; i < text.length; i++) {
      const c = text[i];
      if (inStr) { if (esc) esc = false; else if (c === String.fromCharCode(92)) esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') { inStr = true; continue; }
      if (c === first) d++;
      else if (c === close) { d--; if (d === 0) return {start: at, end: text.indexOf(';', i) + 1}; }
    }
    return null;
  }
  return {start: at, end: text.indexOf(';', open) + 1};
}

let changed = 0;
for (const P of PFXS) {
  for (const name of ['CARD_' + P + '_LCQ1_RAW', P + '_LCQ1_NAT', 'CARD_' + P + '_LCQ1_EVENT', 'CARD_' + P + '_LCQ1_DATE']) {
    const inGen = decl(gen, name);
    if (!inGen) throw new Error('в генерате нет ' + name);
    const fresh = gen.slice(inGen.start, inGen.end);
    const cnt = src.split('const ' + name + '=').length - 1;
    if (cnt !== 1) throw new Error(name + ': в index.html объявлений ' + cnt);
    const inSrc = decl(src, name);
    if (!inSrc) throw new Error('в index.html не разобрать ' + name);
    if (src.slice(inSrc.start, inSrc.end) === fresh) continue;
    src = src.slice(0, inSrc.start) + fresh + src.slice(inSrc.end);
    changed++;
  }
}
fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, 'utf8');
console.log('объявлений обновлено: ' + changed + ' в ' + PFXS.length + ' наборах');
console.log('index.html: ' + (fs.statSync(FILE).size / 1048576).toFixed(2) + ' МБ');
