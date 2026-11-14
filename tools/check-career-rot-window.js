// Окно ротации (ccAskRotWindow): когда выходим, точка тапом, тактика чипами, одно окно на 4-й зоне.
// (ccFightApply), обход стоит ресов, вопроса нет под пропуском и в онлайне (ccLootRoomOn).
//   node tools/check-career-rot-window.js
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
    const gone=[];
    const mk=(mv)=>{
      const you={name:'You', pow:90, _pf:90, _mats:900, _loot:{weapons:[], heals:[], move:mv ? {name:'Shockwave Grenade', rarity:'epic'} : null}};
      const me={team:you, alive:true, x:20, y:20, shield:100, hp:100, dealt:0, taken:0};
      const onLine={team:{name:'OnLine', pow:80, _pf:80, _loot:{weapons:[]}}, alive:true, x:40, y:40};
      you._sq=me;
      you._game={squads:[me, onLine], frames:()=>[{circle:{cx:55, cy:55, radius:30}, next:{cx:40, cy:40, radius:20}}], upcoming:()=>({cx:62, cy:62, radius:12}),
        aliveCount:()=>2, nearest:()=>onLine.team, eliminate:(a,b)=>{ gone.push(a===you?'you':'foe'); return true; }};
      return you; };
    const host=document.createElement('div'); host.style.cssText='width:600px'; document.body.appendChild(host);
    const answer=async p=>{ for(let i=0;i<20;i++){ const b=host.querySelector('.cc-choice-btn'); if(!b) break; b.click(); await tick(); } return p; };
    // Одно окно: ходы, карта, три чипа тактики.
    let you=mk(false); const sit=ccSitOf(you);
    let p=ccAskRotWindow(you, {map:host}); await tick();
    const boxes=host.querySelectorAll('.cc-choice');
    check('одно окно', boxes.length===1, String(boxes.length));
    const btns=[...host.querySelectorAll('.cc-choice-btn')];
    check('кнопки = доступные ходы ротации', btns.length===CC_SIT_ROT_IDS.filter(id=>ccSitAvail('rot', id, sit)).length, String(btns.length));
    check('карта пути', !!host.querySelector('.rp-svg[data-hold]'));
    check('три чипа тактики', host.querySelectorAll('[data-chip]').length===3);
    check('лучший не подсвечен и не назван', !host.innerHTML.match(/выгодно|best-move/));
    const ids=CC_SIT_ROT_IDS.filter(id=>ccSitAvail('rot', id, sit));
    const useless=ids.filter(id=>ccSitUseless('rot', id, sit));
    useless.forEach(id=>check('бесполезный помечен: '+id, btns[ids.indexOf(id)] && btns[ids.indexOf(id)].textContent.indexOf(L().sitUseless)>=0));
    // Выбор: бокс и «последними».
    host.querySelector('[data-chip="box"]').click(); await tick();
    const pow0=you._pf; const r0=Math.random; Math.random=()=>0.99;
    btns[ids.indexOf('late')].click(); await tick();
    await answer(p); Math.random=r0;
    check('ротация записана', you._rot==='late', you._rot);
    check('тактика записана', you._tac==='box', String(you._tac));
    const want=Math.round(ccSitValue('rot','late',sit)-ccSitValue('rot','early',sit));
    out.notes.pow=[pow0, you._pf, want];
    check('сила изменилась на ценность хода', Math.abs((you._pf-pow0)-want)<1e-6, (you._pf-pow0)+' vs '+want);
    check('точка ушла в движок', you._pos && Math.abs(you._pos.cx-62)<1e-6);
    // По умолчанию: сразу, пушить, сила на месте (ход по умолчанию ничего не прибавляет).
    you=mk(false); const pf=you._pf; Math.random=()=>0.99;
    p=ccAskRotWindow(you, {map:host}); await tick(); await answer(p); Math.random=r0;
    check('по умолчанию сразу и пушить', you._rot==='early' && you._tac==='push', you._rot+' '+you._tac);
    check('ход по умолчанию силы не меняет', you._pf===pf, String(you._pf-pf));
    // Встреча на пути играется выбранной тактикой (бросок 0.01: решилась).
    you=mk(false); Math.random=()=>0.01; gone.length=0;
    p=ccAskRotWindow(you, {map:host}); await tick(); await answer(p); Math.random=r0;
    check('встреча стала файтом', gone.length===1, JSON.stringify(gone));
    // Под пропуском: окна нет, значения по умолчанию.
    you=mk(false); skipAnimation=true; const n0=host.children.length; await ccAskRotWindow(you, {map:host}); skipAnimation=false;
    check('под пропуском окна нет', host.children.length===n0 && you._rot==='early' && you._tac==='push');
    // Онлайн: только ряд ходов.
    you=mk(false); const lk=ccMpLock, mc=ccMpChoose; ccMpLock=()=>true;
    // Лобби нет: голос свой, без барьера.
    ccMpChoose=function(kind, mineFn){ return Promise.resolve(mineFn()).then(v=>({v, mine:true})); };
    p=ccAskRotWindow(you, {map:host}); await tick();
    check('онлайн: без карты и чипов', !host.querySelector('.rp-svg') && !host.querySelector('[data-chip]'));
    await answer(p); ccMpLock=lk; ccMpChoose=mc;
    // Мувмент есть — ход есть.
    you=mk(true); check('с мувментом ход есть', ccSitAvail('rot','move', ccSitOf(you)));
    ['ru','en','fr','it','pt'].forEach(lg=>['rpTitle','rpHint','rpGo','rpNote','rpClear','rpMet','tcChips'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crot-')), tmp = path.join(dir, 'index.html');
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
console.log('OK окно ротации');
