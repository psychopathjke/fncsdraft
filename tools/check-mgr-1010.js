// Менеджер, Notion «10.10»: размер состава года в тени (трио 2021/2025), состав из игроков другого региона играет
// в своём регионе (поле — его сцена), таблица этапа закрепляет всех своих наверху.
//   node tools/check-mgr-1010.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(async ()=>{ const out={notes:{}, errs:[], fields:[], pins:[], fails:[]};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
const ce=console.error; console.error=(...a)=>{ out.errs.push(a.map(x=>String(x && x.stack || x)).join(' ').slice(0,300)); ce.apply(console, a); };
try{
  ['fncsdraft_manager','fncsdraft_manager_active'].forEach(k=>localStorage.removeItem(k));
  LANG='en';
  [[2021,3],[2024,2],[2025,3],[2026,2]].forEach(([y,n])=>{ const s=mgrShadow(y,'EU').career.size; check('размер состава в тени '+y, s===n, s); });
  const rs=revealStandings; revealStandings=async function(shell, ranked, you){ const r=await rs.apply(this, arguments);
    try{ const w=[...shell.card.querySelectorAll('.lobby-wrap')].pop(); out.pins.push([w.querySelectorAll('tr.st-pin').length, ranked.filter(t=>t && (t===you || t.isClub)).length]); }catch(e){}
    return r; };
  MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2024);
  const fi=MGR_NEW_LIST.findIndex(c=>c.name==='Team Falcons'); mgrTake(fi>=0 ? fi : 0); MGR.view='result';
  // Два свободных игрока NAC — отдельным составом европейского клуба.
  const nac=(ccSceneRoster('NAC')||[]).filter(c=>c.handle && !mgrOrgOf(c)).sort((a,b)=>(ccCardOvr(b)||0)-(ccCardOvr(a)||0)).slice(0,2);
  MGR.ext=MGR.ext||{}; nac.forEach(c=>{ MGR.ext[hKey(c)]=mgrSnap(c); });
  MGR.teams.push({id:'t9', cards:nac.map(c=>c.handle)}); MGR_CAR_CACHE=null;
  out.notes.regs=MGR.teams.map(t=>t.id+':'+mgrTeamRegion(t));
  check('состав из игроков NAC — регион NAC', mgrTeamRegion(MGR.teams.find(t=>t.id==='t9'))==='NAC', out.notes.regs.join(' '));
  const cf=careerCupField; careerCupField=function(){ const f=cf.apply(this, arguments);
    try{ const h={}; (f||[]).forEach(t=>(t.squad||[]).forEach(c=>{ const r=c.region||'?'; h[r]=(h[r]||0)+1; })); out.fields.push({who:CAREER.player.handle, reg:ccCareerRegion(), hist:h}); }catch(e){}
    return f; };
  const ev=mgrEvents().find(e=>e.kind==='car' && e.ck!=='solo' && e.teams.indexOf('t9')>=0 && e.teams.length>1);
  out.notes.ev=ev && (ev.day+' '+ev.name);
  await mgrFastForwardLive(ccAddDays(ev.day,-1), true);
  const ev2=mgrEvents().find(e=>e.kind==='car' && e.day===ev.day && e.ck===ev.ck);
  skipAnimation=true; const hh=setInterval(()=>{ skipAnimation=true; const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
  mgrPickTeam=async ts=>ts[0]; await mgrPlayCar(ev2); clearInterval(hh);
  const row=(MGR.log||[]).find(r=>r.day===ev.day && r.car===ev.ck);
  out.notes.row=row && row.teams.map(t=>[t.id, t.place, t.of]);
  const fe=out.fields.find(f=>f.who===nac[0].handle), fl=out.fields.find(f=>f.who!==nac[0].handle);
  check('его вечер — в NAC, поле из NAC', fe && fe.reg==='NAC' && Object.keys(fe.hist).every(r=>r==='NAC'), JSON.stringify(fe));
  check('европейские составы — в европейском лобби', fl && fl.reg==='EU', JSON.stringify(fl));
  check('после вечера клуб снова в своём регионе', CAREER.player.region==='EU' && !MGR.tswap, CAREER.player.region);
  check('все составы клуба в журнале', row && row.teams.length===MGR.teams.length, JSON.stringify(out.notes.row));
  check('таблица этапа закрепляет всех своих', out.pins.length>0 && out.pins.every(p=>p[0]===p[1] && p[0]>0), JSON.stringify(out.pins));
  check('без ошибок', !out.errs.length, out.errs.slice(0,3).join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'm1010-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--user-data-dir=' + path.join(dir, 'u'), '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=1200000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!m) { console.log('FAIL нет ответа (зависло?)'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK менеджер 10.10: трио-годы, свой регион состава, закреп своих ' + JSON.stringify({ row: out.notes.row, pins: out.pins }));
