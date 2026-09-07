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
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--hide-scrollbars','--window-size=' + W + ',' + H,
  '--run-all-compositor-stages-before-draw','--virtual-time-budget=15000',
  '--screenshot=' + OUT, 'file:///' + tmp.replace(/\\/g,'/')], {stdio:'ignore'});
fs.rmSync(dir, {recursive:true, force:true});
console.log('wrote ' + OUT);
