// Превью ссылки og-image.png (1200×630) из tools/og-image.html — снимок headless Chrome.
// Новый headless отнимает у окна ~95 px высоты под «рамку», поэтому окно берётся с запасом,
// а лишний низ срезается вторым проходом: снимок рисуется на canvas 1200×630 и выгружается в base64.
//   node tools/build-og-image.js [выход.png]
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
const out = path.resolve(process.argv[2] || path.join(ROOT, 'og-image.png'));
const fwd = s => s.split(String.fromCharCode(92)).join('/');
const flags = ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1'];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
const raw = path.join(dir, 'raw.png');
execFileSync(CHROME, flags.concat(['--window-size=1200,900', '--virtual-time-budget=4000', '--screenshot=' + raw,
  'file:///' + fwd(path.join(ROOT, 'tools', 'og-image.html'))]), { stdio: 'ignore' });
const crop = path.join(dir, 'crop.html');
fs.writeFileSync(crop, '<canvas id=c width=1200 height=630></canvas><script>const i=new Image();i.onload=()=>{const c=document.getElementById("c");' +
  'c.getContext("2d").drawImage(i,0,0);document.title="OG"+c.toDataURL("image/png");};i.src="raw.png";</script>');
const dom = execFileSync(CHROME, flags.concat(['--virtual-time-budget=4000', '--dump-dom', 'file:///' + fwd(crop)]), { encoding: 'utf8', maxBuffer: 1 << 26 });
const m = dom.match(/<title>OGdata:image\/png;base64,([^<]+)<\/title>/);
if (!m) throw new Error('crop failed');
fs.writeFileSync(out, Buffer.from(m[1], 'base64'));
fs.rmSync(dir, { recursive: true, force: true });
console.log('og-image: ' + out);
