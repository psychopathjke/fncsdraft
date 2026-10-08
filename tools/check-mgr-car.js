// Турниры карьеры игрока в менеджере (его слово 8.10: «хочу сделать как в карьере игрока все турниры»).
//   node tools/check-mgr-car.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(async ()=>{ const out={fails:[], notes:{}, errs:[]};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
const ce=console.error; console.error=(...a)=>{ out.errs.push(a.map(x=>String(x && x.stack || x)).join(' ').slice(0,300)); ce.apply(console, a); };
try{
  ['fncsdraft_manager','fncsdraft_manager_active'].forEach(k=>localStorage.removeItem(k));
  LANG='ru';
  MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2024);
  const fi=MGR_NEW_LIST.findIndex(c=>c.name==='Team Falcons'); mgrTake(fi>=0 ? fi : 0); MGR.view='result';
  const car=mgrEvents().filter(e=>e.kind==='car');
  out.notes.kinds=[...new Set(car.map(e=>e.ck))]; out.notes.first=car[0] && (car[0].day+' '+car[0].name+' ×'+car[0].teams.length);
  check('в календаре клуба — турниры карьеры', car.length>0 && car.some(e=>e.ck==='major'), car.length);
  check('своего FNCS больше нет', !mgrEvents().some(e=>e.kind==='fncs'));
  check('после подсчёта команда встала', !MGR.tswap && !CAREER.player.handle);
  // перемотка до первого Мейджора и через него — раннером карьеры
  const ev=car.find(e=>e.ck==='major');
  await mgrFastForwardLive(ev.day, true);
  out.notes.day=CAREER.career.day;
  const row=(MGR.log||[]).find(r=>r.car==='major');
  out.notes.row=row && JSON.stringify(row.teams.map(t=>[t.name,t.place,t.of,t.passed])); out.notes.tcar=Object.keys(MGR.tcar||{}).map(k=>k+':'+((MGR.tcar[k].log||[]).slice(-1)[0]||{}).place);
  check('Мейджор сыгран раннером карьеры', !!row && row.teams[0].of>100, JSON.stringify((MGR.log||[]).slice(0,2)).slice(0,300));
  check('все составы клуба — в одном лобби', !row || row.teams.length<2 || (row.teams.every(t=>t.of===row.teams[0].of) && new Set(row.teams.map(t=>t.place)).size===row.teams.length), row && JSON.stringify(row.teams.map(t=>[t.name,t.place,t.of])));
  check('прогресс команды сохранён', Object.keys(MGR.tcar||{}).length>0 && Object.values(MGR.tcar).some(t=>(t.log||[]).some(x=>x.kind==='major')));
  check('теневая карьера чистая', !MGR.tswap && !CAREER.player.handle && !(CAREER.career.log||[]).some(x=>x.kind==='major'));
  check('рейтинг команды — её карточки, не новичка', !row || (MGR.tcar[row.teams[0].id].log||[]).slice(-1)[0].ovr>70, row && (MGR.tcar[row.teams[0].id].log||[]).slice(-1)[0].ovr);
  const nxt=mgrEvents().filter(e=>e.kind==='car' && e.day>ev.day);
  out.notes.after=nxt.slice(0,3).map(e=>e.day+' '+e.name+' ×'+e.teams.length);
  check('после раунда — следующий раунд у прошедших', !row || !row.teams.some(t=>t.passed) || nxt.some(e=>e.ck==='major'));
  check('без ошибок', !out.errs.length, out.errs.slice(0,3).join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcar-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=1200000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!m) { console.log('FAIL нет ответа (зависло?)'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK турниры карьеры в менеджере ' + JSON.stringify(out.notes));
