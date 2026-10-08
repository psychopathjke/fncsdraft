// Словари немецкого и испанского — отдельными файлами (его слово 8.10: «добавляй немецкий и испанский только»).
// Вход — папка с кусками перевода <lang>-NN.js (каждый — выражение «({ ключ: значение, … })», переведённое с en-NN.js,
// выгрузки английского словаря I18N.en). Выход — i18n-<lang>.js в корне сайта: Object.assign(I18N.<lang>, кусок1, кусок2…);
// index.html грузит его при выборе языка (ccLangLoad), версия файла — CC_I18N_V.
//   node tools/build-i18n.js <папка-кусков> [de es]
// Проверки: каждый кусок разбирается, ключи и их виды (строка / функция с тем же числом аргументов / массив той же
// длины) совпадают с английским куском того же номера. Ключ с расхождением выкидывается из файла — под ним
// останется английский (L() кладёт английский под каждый язык), и это печатается.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const dir = process.argv[2];
const langs = process.argv.slice(3).length ? process.argv.slice(3) : ['de', 'es'];
if (!dir) { console.log('node tools/build-i18n.js <папка-кусков> [de es]'); process.exit(1); }
const kind = v => typeof v === 'function' ? 'fn' + v.length : Array.isArray(v) ? 'arr' + v.length : typeof v;
const nums = fs.readdirSync(dir).map(f => (f.match(/^en-(\d+)\.js$/) || [])[1]).filter(Boolean).sort();
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const lang of langs) {
  const parts = [], dropped = [];
  let keys = 0;
  for (const n of nums) {
    const enSrc = fs.readFileSync(path.join(dir, 'en-' + n + '.js'), 'utf8');
    const f = path.join(dir, lang + '-' + n + '.js');
    if (!fs.existsSync(f)) { console.log(lang + '-' + n + ': нет файла — кусок остаётся английским'); continue; }
    let src = fs.readFileSync(f, 'utf8').trim().replace(/;\s*$/, '');
    const en = vm.runInNewContext(enSrc), tr = vm.runInNewContext(src);
    // ключ с другим видом — выкинуть из исходника куска (переразбор по ключу)
    const bad = Object.keys(tr).filter(k => !(k in en) || kind(en[k]) !== kind(tr[k]));
    Object.keys(en).forEach(k => { if (!(k in tr)) dropped.push(k + ' (нет)'); });
    if (bad.length) {
      const keep = {}; Object.keys(tr).forEach(k => { if (bad.indexOf(k) < 0) keep[k] = 1; });
      // пересобрать кусок из строк «"ключ": значение,» — так выгружены куски (по ключу на строку-начало)
      const lines = src.split('\n'); const out = []; let cur = null, buf = [];
      const flush = () => { if (cur !== null && keep[cur]) out.push(buf.join('\n')); buf = []; };
      for (const ln of lines) {
        const m = ln.match(/^\s{2}"((?:[^"\\]|\\.)*)":/);
        if (m) { flush(); cur = JSON.parse('"' + m[1] + '"'); buf.push(ln); }
        else if (/^\(\{\s*$|^\}\)\s*$/.test(ln.trim() ? ln.trim() : 'x')) { flush(); cur = null; }
        else if (cur !== null) buf.push(ln);
      }
      flush();
      src = '({\n' + out.join('\n') + '\n})';
      vm.runInNewContext(src);
      bad.forEach(k => dropped.push(k + ' (' + (k in en ? kind(en[k]) + '≠' + kind(tr[k]) : 'лишний') + ')'));
    }
    keys += Object.keys(vm.runInNewContext(src)).length;
    parts.push(src);
  }
  const body = '/* fncsdraft — словарь «' + lang + '» (tools/build-i18n.js). Под ним — английский (L()). */\n' +
    'Object.assign(I18N.' + lang + '=I18N.' + lang + '||{},\n' + parts.join(',\n') + ');\n';
  fs.writeFileSync(path.join(ROOT, 'i18n-' + lang + '.js'), body);
  const v = crypto.createHash('sha1').update(body).digest('hex').slice(0, 8);
  html = html.replace(new RegExp('(let CC_I18N_V=\\{[^}]*\\b' + lang + ":')[0-9a-f]+'"), '$1' + v + "'");
  console.log('i18n-' + lang + '.js: ' + keys + ' ключей, ' + body.length + ' байт, v=' + v + (dropped.length ? ' · под английским: ' + dropped.length + ' — ' + dropped.slice(0, 12).join(', ') : ''));
}
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
