// Дозаливка переводов недостающих ключей (17.10, его «переведи всё теперь на другие языки»).
// Вход — папка <dir>/<lang>/ с кусками en-NN.js и <lang>-NN.js (выражения «({ ключ: значение })»).
//   fr / it / pt — блоком Object.assign(I18N.<lang>, …) в index.html перед «let CC_I18N_V=» (словари этих языков живут в нём);
//   de / es — дописываются в конец i18n-<lang>.js, версия файла в CC_I18N_V пересчитывается (sha1, 8 знаков — как build-i18n).
// Ключ берётся, только если вид совпадает с английским (строка / функция той же арности / массив той же длины);
// остальное остаётся под английским и печатается.
//   node tools/merge-i18n-patch.js <dir> [fr it pt de es]
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const dir = process.argv[2];
const langs = process.argv.slice(3).length ? process.argv.slice(3) : ['fr', 'it', 'pt', 'de', 'es'];
const kind = v => typeof v === 'function' ? 'fn' + v.length : Array.isArray(v) ? 'arr' + v.length + ':' + v.map(x => typeof x).join(',') : typeof v;
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CR = html.indexOf('\r\n') >= 0; html = html.replace(/\r\n/g, '\n');
for (const lang of langs) {
  const d = path.join(dir, lang), parts = [], dropped = [];
  let keys = 0;
  for (const f of fs.readdirSync(d).filter(f => /^en-\d+\.js$/.test(f)).sort()) {
    const n = f.match(/\d+/)[0], tf = path.join(d, lang + '-' + n + '.js');
    if (!fs.existsSync(tf)) { console.log(lang + '-' + n + ': нет'); continue; }
    const en = vm.runInNewContext(fs.readFileSync(path.join(d, f), 'utf8'));
    const src = fs.readFileSync(tf, 'utf8').trim().replace(/;\s*$/, '');
    const tr = vm.runInNewContext(src);
    const bad = Object.keys(tr).filter(k => !(k in en) || kind(en[k]) !== kind(tr[k]));
    Object.keys(en).forEach(k => { if (!(k in tr)) dropped.push(k + ' (нет)'); });
    bad.forEach(k => dropped.push(k + ' (вид)'));
    // плохие ключи выкидываются присваиванием обратно английского нельзя (нет исходника) — удаляем их после Object.assign
    parts.push(src + (bad.length ? '' : ''));
    keys += Object.keys(tr).length - bad.length;
    if (bad.length) parts.push('({})'), parts.bad = (parts.bad || []).concat(bad);
  }
  const del = (parts.bad || []).length ? '\n[' + parts.bad.map(k => JSON.stringify(k)).join(',') + '].forEach(k=>{ delete I18N.' + lang + '[k]; });' : '';
  const block = '/* Дозаливка «' + lang + '» 17.10 (tools/merge-i18n-patch.js): ключи, которых в словаре не было. */\n' +
    'Object.assign(I18N.' + lang + '=I18N.' + lang + '||{},\n' + parts.filter(p => p !== '({})').join(',\n') + ');' + del + '\n';
  if (lang === 'de' || lang === 'es') {
    const file = path.join(ROOT, 'i18n-' + lang + '.js');
    const body = fs.readFileSync(file, 'utf8') + block;
    fs.writeFileSync(file, body);
    const v = crypto.createHash('sha1').update(body).digest('hex').slice(0, 8);
    html = html.replace(new RegExp('(let CC_I18N_V=\\{[^}]*\\b' + lang + ":')[0-9a-f]+'"), '$1' + v + "'");
    console.log('i18n-' + lang + '.js +' + keys + ' ключей, v=' + v + (dropped.length ? ' · под английским: ' + dropped.join(', ') : ''));
  } else {
    const at = html.indexOf('let CC_I18N_V=');
    if (at < 0) throw new Error('нет CC_I18N_V');
    html = html.slice(0, at) + block + html.slice(at);
    console.log(lang + ': +' + keys + ' ключей в index.html' + (dropped.length ? ' · под английским: ' + dropped.join(', ') : ''));
  }
}
fs.writeFileSync(path.join(ROOT, 'index.html'), CR ? html.replace(/\n/g, '\r\n') : html);
