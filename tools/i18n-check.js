// Both languages, or neither.
//
// The interface is Russian and English, and a string that exists in one
// dictionary and not the other does not fail loudly — it renders as `undefined`
// or as nothing at all, and only in the language the author was not using. That
// is exactly the bug that survives a manual pass, so it is checked here instead.
//
// Four things are wrong and this finds all four:
//
//   1. a key in one dictionary and not the other
//   2. an empty value in either
//   3. Cyrillic sitting in the English dictionary — a Russian string pasted
//      into the English half and never translated
//   4. a `data-i18n` attribute in the markup with no entry behind it
//
// What is deliberately NOT an error: the two languages holding the same text.
// Epic does not translate its own event names, so "FNCS Major 1", "Last Chance
// Qualifier" and "Reload Elite Series" read the same in both, and thirteen
// entries are identical on purpose. Those are listed, not failed.
//
//   node tools/i18n-check.js

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'index.html');
const raw = fs.readFileSync(FILE, 'utf8');
const lines = raw.split(/\r?\n/);

// The dictionary is found by name and closed by brace balance rather than by a
// line number, so the check keeps working after the file grows.
const start = lines.findIndex(l => l.startsWith('const I18N='));
if (start < 0) { console.error('I18N not found in index.html'); process.exit(1); }

let depth = 0, end = -1;
for (let i = start; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > start) { end = i; break; }
}
if (end < 0) { console.error('I18N is never closed'); process.exit(1); }

const body = lines.slice(start, end + 1).join('\n')
  .replace(/^const I18N=/, '').trim().replace(/;$/, '');
const I18N = eval('(' + body + ')');

const LANGS = Object.keys(I18N);
/* Языки, которые обязаны быть полными — и языки, которые ещё наполняются.

   Правило «ключ есть везде или его нет нигде» было верным, пока языков было
   три и все три доделаны. Новый язык так завести нельзя: он начинается с
   нуля ключей, и сторож краснел бы до последней строки перевода.

   А движок этого и не требует. L() кладёт английский под низ каждого языка
   (Object.assign({}, I18N.en, own)), и французский ровно так и начинался —
   переведённый экран читается по-французски, непереведённый по-английски,
   пустоты не бывает нигде. Поэтому здесь два режима: доделанный язык обязан
   держать все ключи, наполняемый — показывает охват. Доперевёл язык до конца —
   перенеси его в DONE, и сторож начнёт его стеречь. */
// it и pt доведены до конца 25 августа 2026 и переехали сюда: с этого дня
// пропущенный в них ключ — красное, а не «наполняется».
const DONE = ['ru', 'en', 'fr', 'it', 'pt'];
const FILLING = LANGS.filter(l => DONE.indexOf(l) < 0);
const problems = [];

// 1. A key in one language and not another — among the languages called done.
const all = new Set(DONE.filter(l => I18N[l]).flatMap(l => Object.keys(I18N[l])));
for (const key of all) {
  const missing = DONE.filter(l => I18N[l] && !(key in I18N[l]));
  if (missing.length) problems.push(`${key} — missing from ${missing.join(', ')}`);
}
// А наполняемые — считаются, а не валятся. Лишний ключ, которого нет в
// английском, — всё равно ошибка: он никогда не отрисуется.
const coverage = FILLING.map(l => {
  const own = Object.keys(I18N[l]);
  own.forEach(k => { if (!(k in I18N.en)) problems.push(`${l}.${k} — нет такого ключа в английском`); });
  return `${l}: ${own.length} из ${all.size} (${Math.round(own.length / all.size * 100)}%)`;
});

// 2. Empty values.
for (const lang of LANGS)
  for (const [key, v] of Object.entries(I18N[lang]))
    if (v === '') problems.push(`${lang}.${key} — empty`);

// 3. Cyrillic in the English half.
const CYRILLIC = /[А-яЁё]/;
if (I18N.en) {
  for (const [key, v] of Object.entries(I18N.en)) {
    const text = typeof v === 'function' ? String(v) : String(v);
    if (CYRILLIC.test(text)) problems.push(`en.${key} — Cyrillic in the English dictionary`);
  }
}

/* 5. Значение того же СОРТА, что в английском.

   26 августа 2026, его скрин: «Calendar not working in italian language»,
   Uncaught TypeError: L(...).calDows.map is not a function. Итальянский и
   португальский держали двенадцать месяцев и семь дней недели одной строкой
   через запятую — ключ на месте, перевод верный, правило «есть везде» зелёное,
   а календарь на этих языках падал насмерть. Пустых ключей ловить мало: код
   зовёт .map у массива и (n) у функции, и подмена сорта — это исключение, а не
   кривая надпись. Массивам сверяется ещё и длина: одиннадцать месяцев ломают
   декабрь так же тихо. */
const sort = v => Array.isArray(v) ? 'массив' : typeof v === 'function' ? 'функция' : typeof v;
if (I18N.en) {
  for (const [key, ref] of Object.entries(I18N.en)) {
    for (const lang of DONE) {
      if (lang === 'en' || !I18N[lang] || !(key in I18N[lang])) continue;
      const v = I18N[lang][key];
      if (sort(v) !== sort(ref))
        problems.push(`${lang}.${key} — ${sort(v)}, а в английском ${sort(ref)}`);
      else if (Array.isArray(ref) && v.length !== ref.length)
        problems.push(`${lang}.${key} — ${v.length} штук, а в английском ${ref.length}`);
    }
  }
}

/* 4. A data-i18n attribute with nothing behind it.

   Это спрашивается со ВСЕХ языков, включая наполняемые, и намеренно: разметка —
   первый экран, который видит гость, и язык, у которого нет даже его, не стоит
   кнопки в шапке. Наполнение любого нового языка начинается отсюда. */
const used = new Set([...raw.matchAll(/data-i18n="([A-Za-z0-9_]+)"/g)].map(m => m[1]));
for (const key of used) {
  const missing = LANGS.filter(l => !(key in I18N[l]));
  if (missing.length) problems.push(`data-i18n="${key}" — no entry in ${missing.join(', ')}`);
}

// Reported, never failed: the entries that read the same in both languages.
const shared = [];
if (I18N.ru && I18N.en)
  for (const key of Object.keys(I18N.ru))
    if (typeof I18N.ru[key] === 'string' && I18N.ru[key] === I18N.en[key] &&
        I18N.ru[key].trim() && !CYRILLIC.test(I18N.ru[key]))
      shared.push(`${key} = ${I18N.ru[key]}`);

console.log(LANGS.map(l => `${l}: ${Object.keys(I18N[l]).length} keys`).join(", "));
if (coverage.length) console.log("наполняются — " + coverage.join(" · "));
console.log(`${used.size} data-i18n attributes in the markup`);

if (shared.length) {
  console.log(`\nSame text in both languages — proper nouns, not errors (${shared.length}):`);
  shared.forEach(s => console.log('  ' + s));
}

if (problems.length) {
  console.log(`\nFAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  problems.forEach(p => console.log('  ' + p));
  process.exit(1);
}

console.log('\nPASS — every string exists in every language.');
