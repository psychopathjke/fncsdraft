// Палитры турниров Epic (imp_event.Colors со страниц событий Tracker, Европа, 2019–2026,
// снято 28.09.2026 в tools/measured/event-colors-eu.json) → компактная таблица для index.html:
//   CC_EV_PAL — уникальные палитры [левый фон, правый фон, выделение, заголовок]
//   CC_EV_COL — семейство события (id Epic без epicgames_ и без _EU) → номер палитры.
// Вклеивается между маркерами «EVENT COLORS begin/end».
//   node tools/build-event-colors.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'event-colors-eu.json'), 'utf8'));
const SKIP = /TwitchRivals|Token|Test|REPAIR|Private|Jaymee|Gauntlet|TwitchTesting|ScoringTest/i;
const hex = v => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) ? v.toUpperCase() : null;
const pals = [], palIx = {}, col = {};
for (const slug of Object.keys(src).sort()) {
  if (SKIP.test(slug)) continue;
  const c = (src[slug] || {}).c || {};
  const p = [hex(c.BackgroundLeftColor), hex(c.BackgroundRightColor), hex(c.HighlightColor), hex(c.TitleColor)];
  if (!p[0] || !p[1]) continue;
  const key = p.join(',');
  if (palIx[key] == null) { palIx[key] = pals.length; pals.push(p.map(x => x ? x.slice(1) : '')); }
  const fam = slug.replace(/^epicgames_/, '').replace(/_EU(?=_|$)/, '');
  if (col[fam] == null) col[fam] = palIx[key];
}
const body = '/* EVENT COLORS begin — tools/build-event-colors.js */\n' +
  'const CC_EV_PAL=' + JSON.stringify(pals) + ';\n' +
  'const CC_EV_COL=' + JSON.stringify(col) + ';\n' +
  '/* EVENT COLORS end */';
const file = path.join(ROOT, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const a = html.indexOf('/* EVENT COLORS begin'), b = html.indexOf('/* EVENT COLORS end */');
if (a < 0 || b < 0) throw new Error('markers not found');
html = html.slice(0, a) + body + html.slice(b + '/* EVENT COLORS end */'.length);
fs.writeFileSync(file, html);
console.log('palettes', pals.length, 'families', Object.keys(col).length, 'bytes', body.length);
