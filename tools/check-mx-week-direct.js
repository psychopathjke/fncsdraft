// Прямые места финала недели в хиты 2019–2020 (его вопрос 7.10: «2019 по очкам за несколько недель?»).
// Liquipedia: Season X «Top 8 trios will advance… If a trio has already qualified, their spot will be transferred to the
// closest placing trio… Top performers that didn't qualify will be invited». Правило: 8-й финала недели в хитах даже с
// крошечной суммой очков; уже прошедший отдаёт место 9-му; остаток — по сумме очков.
//   node tools/check-mx-week-direct.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
try{
  const row=i=>[{h:'T'+i+'a'},{h:'T'+i+'b'},{h:'T'+i+'c'}];
  const m={y:2019, n:3, series:{}, seriesRows:{}, wf:{}};
  // Сумма очков: 300 команд, T0 сильнее всех; 'you' — с одной единицей.
  for(let i=0;i<300;i++){ const k='k'+i; m.series[k]=1000-i; m.seriesRows[k]=row(i); }
  m.series.you=1; m.seriesRows.you='you';
  // Неделя 1: топ-8 — T290..T297 (слабые по сумме). Неделя 2: T290 снова первый, ты 8-й.
  m.wf[1]=[290,291,292,293,294,295,296,297,0,1].map(row);
  m.wf[2]=[290,280,281,282,283,284,285,'you',286,2].map(x=>x==='you' ? 'you' : row(x));
  const hl=ccMXHeatList(m), keys=hl.list.map(ccMXKey);
  out.notes={need:hl.need, head:hl.list.slice(0,18).map(r=>r==='you' ? 'you' : r[0].h)};
  const has=i=>keys.indexOf(ccMXKey(i==='you' ? 'you' : row(i)))>=0;
  if(hl.need!==132) out.fails.push('поле хитов Season X '+hl.need+', ждали 4×33');
  [290,291,292,293,294,295,296,297].forEach(i=>{ if(!has(i)) out.fails.push('T'+i+' (топ-8 недели 1) не в хитах'); });
  if(!has('you')) out.fails.push('8-й недели 2 не в хитах при сумме 1 очко');
  if(!has(286)) out.fails.push('9-й недели 2 не получил место T290 (уже прошёл в неделе 1)');
  if(hl.list.length!==132) out.fails.push('поле не добрано суммой: '+hl.list.length);
  const pos=hl.list.indexOf('you'); if(pos>16) out.fails.push('ты в списке '+(pos+1)+'-м — прямое место должно стоять раньше суммы');
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mxwd-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK прямые места недели в хитах ' + JSON.stringify(out.notes));
