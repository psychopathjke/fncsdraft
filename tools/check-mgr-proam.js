// Про-Ам в менеджере (его слово 9.10: «делай, только травмы не надо»).
//   node tools/check-mgr-proam.js
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
  MGR_NEW_YEAR=2026; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2026);
  mgrTake(0); MGR.view='result'; out.notes.club=MGR.club.name;
  mgrVisaOk=()=>true;                                    // визы — своя проверка (check-mgr-visa)
  const dal=CC_PROAM_EVENTS.ProAm_Dallas.day;
  CAREER.career.day=ccAddDays(dal, -14); MGR.inbox=[];
  mgrProAmTick();
  const inv=MGR.inbox.filter(m=>m.ev==='proam'); out.notes.inv=inv.map(m=>m.text);
  check('приглашение на Про-Ам Даллас пришло сильнейшим клуба', inv.length>0, JSON.stringify(MGR.teams.map(t=>t.cards)));
  mgrProAmTick(); check('второй раз не пишут', MGR.inbox.filter(m=>m.ev==='proam').length===inv.length);
  check('креаторы у двоих разные', new Set(inv.map(m=>m.mate)).size===inv.length);
  const m0=inv[0]; mgrInboxDo(m0.id, true);
  const ev=mgrCarEvents(CAREER.career.day, ccAddDays(dal, 1)).filter(e=>e.ck==='proam');
  out.notes.ev=ev.map(e=>e.day+' '+e.name+' '+e.teams.join(','));
  check('Про-Ам в календаре у принявшего', ev.length===1 && ev[0].day===dal && ev[0].teams[0]==='s:'+hKey(m0.h), JSON.stringify(ev));
  check('ЛАН Про-Ама — США', (mgrLanHost(ev[0])||{}).nat==='us');
  if(inv[1]){ mgrInboxDo(inv[1].id, false); check('отказ — без вечера', mgrCarEvents(CAREER.career.day, ccAddDays(dal, 1)).filter(e=>e.ck==='proam').length===1); }
  const cash0=MGR.club.cash;
  await mgrCarAuto(ev[0]);
  const row=(MGR.log||[]).find(r=>r.car==='proam'); out.notes.row=row && JSON.stringify(row.teams);
  check('Про-Ам сыгран раннером карьеры', !!row && row.teams[0].of===CC_PROAM_TEAMS, row && JSON.stringify(row.teams));
  const st=MGR.tcar['s:'+hKey(m0.h)]; const last=(st.log||[]).slice(-1)[0]; out.notes.last=last;
  check('напарник — выбранный креатор', last && last.kind==='proam' && last.mate===m0.mate, JSON.stringify(last));
  check('второй раз не играется', !mgrCarEvents(CAREER.career.day, ccAddDays(dal, 1)).some(e=>e.ck==='proam'));
  check('теневая карьера чистая', !MGR.tswap);
  check('без ошибок', !out.errs.length, out.errs.slice(0,3).join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mproam-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 900000 });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!m) { console.log('FAIL нет ответа (зависло?)'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK Про-Ам в менеджере ' + JSON.stringify(out.notes));
