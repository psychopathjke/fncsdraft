// Правила проекта — до коммита (git pre-commit, .git/hooks/pre-commit).
//
// 1. Файлы сайта уходят в репозиторий в LF. CRLF перед add раздувал дифф index.html на весь файл
//    (память «Переносы строк в fncsdraftmajor», 2.10): коммит на 176 тысяч строк вместо десяти.
// 2. Дифф index.html больше CC_BIG_DIFF строк — почти всегда та же ловушка, а не правка. Если правка
//    правда такая — ALLOW_BIG=1 git commit …
// 3. Слово FIFA в строках (не в комментариях) — его правило: «FIFA нигде не упоминать».
//
//   node tools/check-commit-rules.js       (смотрит то, что лежит в индексе: git add уже сделан)
const { execFileSync } = require('child_process');
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 });
const CC_BIG_DIFF = Number(process.env.CC_BIG_DIFF || 4000);
const SHIPPED = f => /^[^/]+\.(html|js|css)$/.test(f) || /^server\/src\/[^/]+\.js$/.test(f);

const staged = git('diff', '--cached', '--name-only', '--diff-filter=ACM').split('\n').filter(Boolean);
const bad = [];
for (const f of staged.filter(SHIPPED)) {
  const blob = git('show', ':' + f);
  if (blob.indexOf('\r') >= 0) bad.push(f + ': в индексе CRLF — нужен LF (git add после перевода концов строк)');
}
if (staged.indexOf('index.html') >= 0 && process.env.ALLOW_BIG !== '1') {
  const ns = git('diff', '--cached', '--numstat', '--', 'index.html').trim().split(/\s+/);
  const n = (Number(ns[0]) || 0) + (Number(ns[1]) || 0);
  if (n > CC_BIG_DIFF) bad.push('index.html: дифф ' + n + ' строк — похоже на переносы строк, а не на правку (ALLOW_BIG=1, если так и надо)');
}
// Без путей git diff берёт весь индекс — тогда и инструменты в tools/ ловились бы на слове.
const shipped = staged.filter(SHIPPED);
const diff = shipped.length ? git('diff', '--cached', '-U0', '--', ...shipped) : '';
let file = '';
diff.split('\n').forEach(line => {
  if (line.startsWith('+++ ')) { file = line.slice(6); return; }
  if (!line.startsWith('+') || line.startsWith('+++')) return;
  const code = line.slice(1).replace(/\/\*.*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/, '$1');
  if (/(['"`])[^'"`]*\bfifa\b[^'"`]*\1/i.test(code)) bad.push(file + ': FIFA в строке: ' + line.slice(1).trim().slice(0, 120));
});
if (bad.length) {
  bad.forEach(b => console.error('правила проекта: ' + b));
  process.exit(1);
}
