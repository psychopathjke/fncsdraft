// Главный экран как его видит игрок: видно ли кнопки карьеры без прокрутки.
//
//   node tools/snap-modes.js [out-prefix]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const PRE = process.argv[2] || path.join(os.tmpdir(), 'modes');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// Двери «вдвоём» открыты — иначе кнопок на карточке нет вовсе (CC_MP_OPEN).
const BOOT = `<script>window.addEventListener('load', function(){
  try{ CC_MP_OPEN=true; const r=document.getElementById('modeMpRow'); if(r) r.hidden=false; }catch(e){}
});<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
[[1440, 900], [1280, 800]].forEach(([w, h]) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapmodes-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, BASE + src + BOOT);
  const out = PRE + '-' + w + 'x' + h + '.png';
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--allow-file-access-from-files', '--virtual-time-budget=20000',
    '--window-size=' + w + ',' + h, '--screenshot=' + out,
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
  console.log('wrote ' + out);
  fs.rmSync(dir, { recursive: true, force: true });
});
