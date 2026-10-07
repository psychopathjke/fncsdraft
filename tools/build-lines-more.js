// Дополнительные реплики (личка и реплаи под постами) — в index.html между метками CC_LINES_MORE.
// Вход: tools/measured/lines-more/<язык>.json вида {dm:{ключ:[…]}, co:{ccCoX:[…]}}.
// Проверяет: ключ существует в I18N.ru, метки только {aN} {topN} {TopN} {dateN} и N меньше числа аргументов
// исходной реплики, других фигурных скобок нет. Плохая строка выбрасывается с предупреждением.
//   node tools/build-lines-more.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), DIR = path.join(__dirname, 'measured', 'lines-more');
const F = path.join(ROOT, 'index.html');
let src = fs.readFileSync(F, 'utf8');
const A = '// ==== CC_LINES_MORE (tools/build-lines-more.js) ====', B = '// ==== /CC_LINES_MORE ====';
const i = src.indexOf(A), j = src.indexOf(B);
if (i < 0 || j < 0) throw new Error('метки CC_LINES_MORE не найдены');
// Число аргументов исходной реплики — по русскому словарю: «ключ:(a,b)=>» или «ключ:a=>».
const argc = key => {
  const m = src.match(new RegExp('[{,\\s]' + key + ':\\s*(\\(([^)]*)\\)|([A-Za-z_$][\\w$]*))\\s*=>'));
  if (!m) return src.indexOf(key + ':') >= 0 ? 0 : -1;
  return m[2] != null ? m[2].split(',').filter(x => x.trim()).length : 1;
};
const out = {}, warn = [];
for (const lang of ['ru', 'en', 'fr', 'it', 'pt']) {
  const f = path.join(DIR, lang + '.json');
  if (!fs.existsSync(f)) { warn.push(lang + ': файла нет'); continue; }
  const j0 = JSON.parse(fs.readFileSync(f, 'utf8'));
  const res = { dm: {}, co: {} };
  let n = 0;
  for (const [k, arr] of Object.entries(j0.dm || {})) {
    const ac = argc(k);
    if (ac < 0) { warn.push(lang + ' ' + k + ': ключа нет'); continue; }
    const ok = (arr || []).filter(s => {
      if (typeof s !== 'string' || !s.trim()) return false;
      const bad = s.replace(/\{(a|top|Top|date)(\d)\}/g, (m, t, d) => (+d < ac ? '' : '\u0000'));
      if (/[{}\u0000]/.test(bad)) { warn.push(lang + ' ' + k + ': метка мимо — ' + s); return false; }
      return true;
    });
    if (ok.length) { res.dm[k] = ok; n += ok.length; }
  }
  for (const [k, arr] of Object.entries(j0.co || {})) {
    if (!/^ccCo[A-Z]/.test(k)) continue;
    const ok = (arr || []).filter(s => typeof s === 'string' && s.trim() && !/[{}]/.test(s));
    if (ok.length) { res.co[k] = ok; n += ok.length; }
  }
  out[lang] = res;
  console.log(lang + ': ' + Object.keys(res.dm).length + ' реплик лички, ' + Object.keys(res.co).length + ' пулов, строк ' + n);
}
const data = JSON.stringify(out).replace(/<\//g, '<\\/');
src = src.slice(0, i) + A + '\nvar CC_LINES_MORE=' + data + ';\n' + src.slice(j);
fs.writeFileSync(F, src);
if (warn.length) console.log('предупреждения (' + warn.length + '):\n  ' + warn.slice(0, 30).join('\n  '));
