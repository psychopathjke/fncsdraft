// Впаять сессию 1 Ласт-Ченса 2026 в index.html (14 наборов: 2 мейджора × 7 регионов).
//
// Повод и источник — в tools/build-2026-lcq.js. Здесь только правка файла, и
// правится СЕМЬ мест на набор, каждое по единственному в файле якорю: если якорь
// не найден или найден дважды, скрипт падает и не пишет ничего.
//
// Полоса Ласт-Ченса теперь считается по ОБЩЕМУ полю (лобби + сессия 1) — его
// решение 26 сентября: прошедшие в лобби подрастают до +7, потому что они верх
// большого поля, а не всё поле.
//
//   node tools/build-2026-lcq.js && node tools/patch-2026-lcq.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'index.html');
const GEN = path.join(__dirname, '2026-lcq.generated.js');

let src = fs.readFileSync(FILE, 'utf8');
// В рабочей копии переносы могут быть CRLF (core.autocrlf), а в коммите LF:
// правим по LF, пишем теми же переносами (память fncsdraft-crlf-commit-trap).
const CRLF = String.fromCharCode(13) + String.fromCharCode(10);
const LF = String.fromCharCode(10);
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes('CARD_M1_LCQ1_RAW')) { console.log('уже впаяно — ничего не делаю'); process.exit(0); }

const gen = fs.readFileSync(GEN, 'utf8');
const blocks = {};
for (const chunk of gen.split(LF + LF)) {
  const m = /const CARD_([A-Z][0-9])_LCQ1_RAW=/.exec(chunk);
  if (m) blocks[m[1]] = (blocks[m[1]] ? blocks[m[1]] + LF + LF : '') + chunk;
}
// Блок набора — это комментарий, таблица, флаги, событие и дата; они идут подряд.
for (const P of Object.keys(blocks)) {
  const i = gen.indexOf('const CARD_' + P + '_LCQ1_RAW=');
  const start = gen.lastIndexOf('/* ', i);
  const end = gen.indexOf('const CARD_' + P + '_LCQ1_DATE=', i);
  const eol = gen.indexOf(LF, end);
  blocks[P] = gen.slice(start, eol < 0 ? gen.length : eol + 1).trim();
}
const PFXS = Object.keys(blocks).sort();
if (PFXS.length !== 14) throw new Error('в генерате не 14 наборов, а ' + PFXS.length);

const cut = (needle, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ': якорь встречается ' + n + ' раз — ' + needle.slice(0, 80));
};
const swap = (needle, repl, what) => { cut(needle, what); src = src.replace(needle, repl); };

for (const P of PFXS) {
  const p = P.toLowerCase();

  // 1. Данные набора + разбор строк сессии 1 — рядом с разбором лобби.
  const a1 = 'const _' + P + 'L=CARD_' + P + '_LCQ_RAW.map(m1Entry);';
  swap(a1, blocks[P] + LF + a1 + LF + 'const _' + P + 'L1=CARD_' + P + '_LCQ1_RAW.map(m1Entry);',
       P + ' разбор строк');

  // 2. Свои распределения: доля внутри стадии считается по её собственному полю.
  if (P === 'M1') {
    const s = 'const _S={m1p:mkSorts(_M1P), m1l:mkSorts(_M1L), m1g:mkSorts(_M1G)};';
    swap(s, s + LF + '_S.m1l1=mkSorts(_M1L1);', 'M1 распределения');
  } else {
    const s = '_S.' + p + 'l=mkSorts(_' + P + 'L);';
    swap(s, s + LF + '_S.' + p + 'l1=mkSorts(_' + P + 'L1);', P + ' распределения');
  }

  // 3. Полоса по общему полю; сессия 1 продолжает ранги лобби.
  const base = 'const ' + p + 'LcqBase    = r => 62 - ((r-1)/Math.max(_' + P + 'L.length-1,1))*14;';
  swap(base,
       'const ' + p + 'LcqLen  = () => _' + P + 'L.length + _' + P + 'L1.length;' + LF +
       'const ' + p + 'LcqBase    = r => 62 - ((r-1)/Math.max(' + p + 'LcqLen()-1,1))*14;' + LF +
       'const ' + p + 'Lcq1Base   = r => 62 - ((_' + P + 'L.length+r-1)/Math.max(' + p + 'LcqLen()-1,1))*14;',
       P + ' полоса');

  // 4. Карточки сессии 1 — тем же add(): кто уже взят Плей-Ином или лобби,
  //    второй карточки не получает (в add() есть known).
  const callStart = '  _' + P + 'L.forEach(e=>add(e, CARD_' + P + '_LCQ_EVENT,';
  cut(callStart, P + ' вызов add');
  const ci = src.indexOf(callStart);
  const ce = src.indexOf(LF, ci);
  src = src.slice(0, ce) + LF + '  _' + P + 'L1.forEach(e=>add(e, CARD_' + P + '_LCQ1_EVENT, CARD_' + P +
        '_LCQ1_DATE, ' + p + 'Lcq1Base, ' + "'Lcq1'" + '));' + src.slice(ce);

  // 5. Флаг новых людей — из выгрузки той же сессии.
  const nat = 'const code = ' + P + '_NAT_LIQUI[nm] || ' + P + '_NAT_TRN[nm] || ' + "''" + ';';
  swap(nat, 'const code = ' + P + '_NAT_LIQUI[nm] || ' + P + '_NAT_TRN[nm] || ' + P + '_LCQ1_NAT[nm] || ' + "''" + ';',
       P + ' флаги');

  // 6. Атрибуты: своя ветка, иначе карточка сессии 1 осталась бы без полос.
  const at = '  if(p._' + p + 'Lcq){ p._attrs=buildM1Attrs(p._' + p + 'Lcq, p.handle, _S.' + p + 'l,' + LF +
             '    p.missedGf ? missedGfLcqBase(p._' + p + 'Lcq.rank, _' + P + 'L.length) : ' +
             p + 'LcqBase(p._' + p + 'Lcq.rank), 0); return p._attrs; }';
  swap(at, at + LF +
       '  if(p._' + p + 'Lcq1){ p._attrs=buildM1Attrs(p._' + p + 'Lcq1, p.handle, _S.' + p + 'l1,' + LF +
       '    p.missedGf ? missedGfLcqBase(_' + P + 'L.length+p._' + p + 'Lcq1.rank, ' + p + 'LcqLen()) : ' +
       p + 'Lcq1Base(p._' + p + 'Lcq1.rank), 0); return p._attrs; }',
       P + ' атрибуты');
}

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, 'utf8');
console.log('наборов впаяно: ' + PFXS.length + ' (' + PFXS.join(', ') + ')');
console.log('index.html: ' + (fs.statSync(FILE).size / 1048576).toFixed(2) + ' МБ');
