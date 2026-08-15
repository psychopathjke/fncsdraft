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
const problems = [];

// 1. A key in one language and not another.
const all = new Set(LANGS.flatMap(l => Object.keys(I18N[l])));
for (const key of all) {
  const missing = LANGS.filter(l => !(key in I18N[l]));
  if (missing.length) problems.push(`${key} — missing from ${missing.join(', ')}`);
}

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

// 4. A data-i18n attribute with nothing behind it.
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

console.log(LANGS.map(l => `${l}: ${Object.keys(I18N[l]).length} keys`).join(', '));
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
