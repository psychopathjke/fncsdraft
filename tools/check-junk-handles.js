// Ники без единой буквы («04 06 03», «1970.1980.1990», «14.04.2027») — настоящие аккаунты Tracker,
// но в лобби это «вместо ника куча цифр» (тестер, Notion «fncsdraft» 7.10, напарник S1neD).
// Правило: в PLAYERS нет карточки, в нике которой нет ни одной буквы.
//   node tools/check-junk-handles.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], n:0};
try{
  const bad=PLAYERS.filter(p=>p && !/\\p{L}/u.test(String(p.handle||'')));
  out.n=PLAYERS.length;
  if(bad.length) out.fails.push(bad.length+' карточек без букв в нике: '+[...new Set(bad.map(p=>p.handle))].slice(0,8).join(', '));
  if(PLAYERS.length<80000) out.fails.push('карточек всего '+PLAYERS.length+' — фильтр съел лишнее');
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'junk-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL'].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK ники с буквами, карточек ' + out.n);
