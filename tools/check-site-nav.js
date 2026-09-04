// Навбар сайта («Карьера · Драфт · История») стоит В ШАПКЕ, одной строкой с
// логотипом и языками — его правка 4 сентября: «хочу чтоб режим карьера был
// выше, на уровне прямоугольника верхнего».
//
// Меряется геометрией, а не глазами: верх пилюли «Карьера» и верх логотипа
// должны стоять на одной высоте (в пределах высоты самой пилюли), и ничего в
// шапке не должно быть ниже её нижней границы. На телефоне правило другое —
// там навбар специально уходит на свою строку.
//
//   node tools/check-site-nav.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const box = sel => { const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect() : null; };
  try {
    const w = window.innerWidth;
    const logo = box('.top .logo'), nav = box('.top .site-nav'),
          pill = box('.top .nav-pill[data-nav="career"]'), langs = box('#langEn');
    out.notes.w = w;
    out.notes.rows = {logo: logo && Math.round(logo.top), nav: nav && Math.round(nav.top),
                      langs: langs && Math.round(langs.top)};
    check('the navbar is in the page', !!nav && !!pill);
    if (w > 760) {
      // Одна строка: середина пилюли лежит внутри высоты строки логотипа.
      const mid = pill.top + pill.height / 2;
      check('career sits on the logo line at ' + w,
            mid > logo.top - pill.height && mid < logo.bottom + pill.height,
            JSON.stringify({logo: [Math.round(logo.top), Math.round(logo.bottom)],
                            pill: [Math.round(pill.top), Math.round(pill.bottom)]}));
      check('and it comes before the languages', pill.right <= langs.left,
            JSON.stringify({pill: Math.round(pill.right), langs: Math.round(langs.left)}));
    } else {
      check('on a phone it keeps its own row', pill.top >= logo.bottom,
            JSON.stringify({pill: Math.round(pill.top), logo: Math.round(logo.bottom)}));
    }
    // Шапка не разъезжается: ничего не торчит за её правый край.
    const top = box('.top');
    ['.top .site-nav', '#langPt', '.top .logo'].forEach(sel => {
      const b = box(sel);
      if (b) check(sel + ' stays inside the header', b.right <= top.right + 1,
                   Math.round(b.right) + ' vs ' + Math.round(top.right));
    });
  } catch (e) { out.fails.push('threw: ' + String(e && e.message || e)); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitenav-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);

let bad = 0;
[1440, 1280, 1100, 900, 700].forEach(w => {
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=20000',
    '--window-size=' + w + ',700', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/BEGIN([\s\S]*?)END/);
  if (!m) { console.error('probe did not run at ' + w); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  console.log('  ' + w + ': rows ' + JSON.stringify(out.notes.rows));
  out.fails.forEach(f => { bad++; console.error('FAILED @' + w + ': ' + f); });
});
fs.rmSync(dir, { recursive: true, force: true });
if (bad) process.exit(1);
console.log('the site navbar rides in the header');
