// Окно концовки (ccAskEndWindow): позиция и стойка одним окном на 8-й зоне, дальше концовка сама по стойке; комната по ситуации.
//   node tools/check-career-endgame.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `<pre id="__out" style="display:none"></pre><script>
window.addEventListener("load", function(){ setTimeout(async function(){
  const out={fails:[], errs:[], notes:{}}; window.addEventListener('error', e=>out.errs.push(String(e.message)));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const tick=()=>new Promise(r=>setTimeout(r, 30));
  try{
    ACTIVE_LANDING_SET='s42'; CAREER_RUN=CAREER_RUN||{}; skipAnimation=false;
    let fights=0, gone=[];
    const mk=()=>{
      const you={name:'You', pow:90, _pf:90, _mats:1500, _loot:{weapons:[{name:'AR', icon:'rifle', rarity:'epic'}], heals:[], move:null}};
      const me={team:you, alive:true, x:20, y:20, shield:100, hp:100, dealt:0, taken:0, skill:0.5};
      const foe={team:{name:'Foe', pow:90, _pf:90, _mats:900, _loot:{weapons:[]}}, alive:true, x:24, y:20, skill:0.5};
      you._sq=me;
      you._game={squads:[me, foe], frames:()=>[{circle:{cx:30, cy:30, radius:20}}], upcoming:()=>({cx:28, cy:28, radius:12}),
        aliveCount:()=>2, nearest:()=>foe.team, eliminate:(a,b)=>{ gone.push(a===you?'you':'foe'); return true; }};
      return you; };
    const host=document.createElement('div'); document.body.appendChild(host);
    const answer=async p=>{ for(let i=0;i<20;i++){ const b=host.querySelector('.cc-choice-btn'); if(!b) break; b.click(); await tick(); } return p; };
    const fa=ccFightApply; ccFightApply=function(){ fights++; return fa.apply(this, arguments); };
    // Одно окно: позиции и два чипа стойки.
    let you=mk(); const sit=ccSitOf(you);
    let p=ccAskEndWindow(you, {map:host}); await tick();
    check('одно окно', host.querySelectorAll('.cc-choice').length===1);
    const ids=CC_SIT_END_IDS.filter(id=>ccSitAvail('end', id, sit));
    const btns=[...host.querySelectorAll('.cc-choice-btn')];
    check('кнопки = доступные позиции', btns.length===ids.length, btns.length+' '+ids.join());
    check('два чипа стойки', host.querySelectorAll('[data-chip="hold"],[data-chip="push"]').length===2);
    host.querySelector('[data-chip="push"]').click(); await tick();
    const pf=you._pf; btns.find(b=>b.textContent.indexOf(ccEndName(L(),'hg'))>=0).click(); await tick(); await answer(p);
    const def=ccMatsLow(you) ? 'refresh' : 'lg';
    check('высота: сила по ценности против хода по умолчанию', Math.abs((you._pf-pf)-Math.round(ccSitValue('end','hg',sit)-ccSitValue('end',def,sit)))<1e-6, String(you._pf-pf));
    check('стойка записана', you._stance==='push', String(you._stance));
    // Двигающиеся и последние: окон нет, давить = один файт на остановку, держать = ноль.
    const n0=host.querySelectorAll('.cc-choice').length; fights=0;
    await ccAutoMoving(you, {map:host}); await ccAutoLast(you, {map:host});
    check('на двигающихся и последних окон нет', host.querySelectorAll('.cc-choice').length===n0);
    check('давить: по файту на остановку', fights===2, String(fights));
    you=mk(); you._stance='hold'; fights=0;
    await ccAutoMoving(you, {map:host}); await ccAutoLast(you, {map:host});
    check('держать: без файтов', fights===0, String(fights));
    // По умолчанию: низ, держать, сила на месте.
    you=mk(); const pf2=you._pf; p=ccAskEndWindow(you, {map:host}); await tick(); await answer(p);
    check('по умолчанию держать и силы не меняет', you._stance==='hold' && you._pf===pf2, you._stance+' '+(you._pf-pf2));
    // Под пропуском окна нет.
    you=mk(); skipAnimation=true; const n1=host.children.length; await ccAskEndWindow(you, {map:host}); skipAnimation=false;
    check('под пропуском окна нет', host.children.length===n1 && you._stance==='hold');
    // Комната: skill 1 — лучший ход, skill 0 — не обязательно.
    const room=[]; for(let i=0;i<200;i++){ const t={name:'B'+i, pow:90, _pf:90, _mats:1500, _loot:{weapons:[{name:'AR', icon:'rifle', rarity:'legendary'}], heals:[]}};
      room.push(t); }
    const g={squads:room.map((t,i)=>({team:t, alive:true, x:i%20, y:Math.floor(i/20), skill:1})), upcoming:()=>({cx:10, cy:5, radius:8}), frames:()=>[]};
    room.forEach(t=>{ t._game=g; t._sq=g.squads.find(q=>q.team===t); });
    const pick=[]; const ro=ccRoomLateOne; ccRoomLateOne=function(t, game){ const r=ro(t, game); pick.push(r); return r; };
    ccRoomLate(room, null);
    const bestOf=t=>{ const s=ccSitOf(t); return CC_SIT_END_IDS.filter(id=>id!=='third' && ccSitAvail('end', id, s)).sort((x,y)=>ccSitValue('end',y,s)-ccSitValue('end',x,s))[0]; };
    check('комната skill 1: лучший ход', pick.length===200 && pick.every((id,i)=>id===bestOf(room[i])), JSON.stringify(pick.slice(0,5)));
    ccRoomLateOne=ro;
    ccFightApply=fa;
    ['ru','en','fr','it','pt'].forEach(lg=>['lsHold','lsPush','esChips'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cend-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + fs.readFileSync(process.env.INDEX || path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--user-data-dir=' + path.join(dir, 'prof'),
    '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs.length) out.fails.push('ошибки страницы: ' + out.errs.join(' | '));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK концовка: одно окно, стойка, комната по ситуации');
