// Снимок главной страницы — чтобы на дизайн можно было посмотреть, а не рассуждать.
//
//   node tools/shot-home.js [out.png] [ширина] [высота]     по умолчанию shot-home.png, 1280×1400
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(process.env.SHOT_DIR || ROOT, 'shot-home.png');
const W = Number(process.argv[3] || 1280), H = Number(process.argv[4] || 1400);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cchome-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
/* Chrome не даёт окну быть уже ~480 px: при --window-size=420 страница
   раскладывается на 484 и снимок режет её справа — так «на 420 px шапка и
   герой не влезают» (7.09) оказалось артефактом снимка, а не сайта (проба
   getBoundingClientRect в iframe 420: за край ничего не выходит). Узкий экран
   поэтому снимается через iframe нужной ширины в широком окне; справа от
   кадра остаётся белая полоса, страница в кадре — настоящая узкая. */
const NARROW = W < 500;
const page = path.join(dir, 'wrap.html');
if (NARROW) fs.writeFileSync(page, '<body style="margin:0;background:#fff"><iframe src="index.html" style="width:' + W + 'px;height:' + H + 'px;border:0;display:block"></iframe></body>');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--hide-scrollbars','--window-size=' + (NARROW ? 520 : W) + ',' + H,
  '--run-all-compositor-stages-before-draw','--virtual-time-budget=15000',
  '--screenshot=' + OUT, 'file:///' + (NARROW ? page : tmp).replace(/\\/g,'/')], {stdio:'ignore'});
fs.rmSync(dir, {recursive:true, force:true});
console.log('wrote ' + OUT);
