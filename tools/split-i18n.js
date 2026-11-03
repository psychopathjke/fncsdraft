// Словари ru/fr/it/pt уходят из app.js в i18n-<lang>.js, как de/es: каждому нужен один язык,
// а app.js тащил все семь (около 1.4 МБ текста), и телефон разбирал их до первой отрисовки.
// Исходник не меняется: режется собранный app.js по разбору acorn.
//   берутся: свойство ru/fr/it/pt литерала `const I18N={...}` и верхнеуровневые
//   `Object.assign(I18N.<lang>[=I18N.<lang>||{}], ...)`, в том порядке, как стоят в коде.
// Внутри функций такие вызовы не трогаются: они остаются в app.js и дописывают словарь, когда дойдут.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const acorn = require('./vendor/acorn.js');

const LANGS = ['ru', 'fr', 'it', 'pt'];

function langOfTarget(n) {
  // I18N.ru  |  I18N.ru=I18N.ru||{}
  if (n && n.type === 'AssignmentExpression') n = n.left;
  if (n && n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier' && n.object.name === 'I18N'
    && n.property.type === 'Identifier' && LANGS.includes(n.property.name)) return n.property.name;
  return null;
}

function splitI18n(src, outDir) {
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
  const parts = Object.fromEntries(LANGS.map(l => [l, []]));
  const cuts = [];   // [start, end) в src
  for (const st of ast.body) {
    if (st.type === 'VariableDeclaration') {
      for (const d of st.declarations) {
        if (d.id.type !== 'Identifier' || d.id.name !== 'I18N' || !d.init || d.init.type !== 'ObjectExpression') continue;
        const props = d.init.properties, keep = [];
        const keyOf = p => p.type === 'Property' && !p.computed && (p.key.name || p.key.value);
        props.forEach(p => {
          const k = keyOf(p);
          if (!LANGS.includes(k)) { keep.push(src.slice(p.start, p.end)); return; }
          parts[k].push('Object.assign(I18N.' + k + '=I18N.' + k + '||{},' + src.slice(p.value.start, p.value.end) + ');');
        });
        // Литерал собирается заново из оставшихся ключей: вырезать соседние ключи по отдельности — запятые пересекаются.
        if (keep.length !== props.length) cuts.push([d.init.start, d.init.end, '{' + keep.join(',\n') + '}']);
      }
      continue;
    }
    if (st.type !== 'ExpressionStatement') continue;
    const e = st.expression;
    if (e.type !== 'CallExpression' || e.callee.type !== 'MemberExpression' || e.callee.object.name !== 'Object'
      || e.callee.property.name !== 'assign' || !e.arguments.length) continue;
    const l = langOfTarget(e.arguments[0]);
    if (!l) continue;
    parts[l].push(src.slice(st.start, st.end).replace(/;?\s*$/, ';'));
    cuts.push([st.start, st.end]);
  }
  // В app.js на месте вырезанного ничего не остаётся; режем с конца, чтобы смещения не поехали.
  cuts.sort((a, b) => b[0] - a[0]);
  let out = src;
  for (const [a, b, put] of cuts) out = out.slice(0, a) + (put || '') + out.slice(b);
  const ver = {};
  for (const l of LANGS) {
    if (!parts[l].length) continue;
    // Хвост: то, что app.js делает со всеми словарями на загрузке (подпись «Профиль» в меню), и метка «словарь пришёл».
    const body = '/* fncsdraft: словарь «' + l + '» (tools/split-i18n.js). Под ним английский (L()). */\n' + parts[l].join('\n') +
      '\ntry{I18N.' + l + '.navGrpProfile=(CC_ME_TX.' + l + '||CC_ME_TX.en).nav;}catch(e){}' +
      '\nCC_LANG_DONE.' + l + '=1;CC_L_CACHE={};\n';
    fs.writeFileSync(path.join(outDir, 'i18n-' + l + '.js'), body, 'utf8');
    ver[l] = crypto.createHash('sha1').update(body).digest('hex').slice(0, 8);
  }
  // Ленивые языки и их версии в самом app.js.
  const keys = Object.keys(ver);
  const lf = /const CC_LANG_FILES=\{([^}]*)\};/;
  if (!lf.test(out)) throw new Error('split-i18n: не нашёл CC_LANG_FILES');
  out = out.replace(lf, (all, inner) => 'const CC_LANG_FILES={' + inner + keys.map(k => ', ' + k + ':1').join('') + '};');
  const iv = /let CC_I18N_V=\{([^}]*)\};/;
  if (!iv.test(out)) throw new Error('split-i18n: не нашёл CC_I18N_V');
  out = out.replace(iv, (all, inner) => 'let CC_I18N_V={' + inner + keys.map(k => ", " + k + ":'" + ver[k] + "'").join('') + '};');
  // Проверка: ни одного верхнеуровневого Object.assign(I18N.<lang> в app.js не осталось, и он разбирается.
  acorn.parse(out, { ecmaVersion: 'latest', sourceType: 'script' });
  const left = LANGS.filter(l => new RegExp('Object\\.assign\\(I18N\\.' + l + '\\b').test(out));
  return { src: out, ver, cut: cuts.length, before: src.length, after: out.length, left };
}

module.exports = { splitI18n, LANGS };
