// Путь ротации на карте (ccAskPath): точка в следующем круге тапом, прямая линия, отряды у линии считаются, встреча — файт середины
// (ccFightApply), обход стоит ресов, вопроса нет под пропуском и в онлайне (ccLootRoomOn).
//   node tools/check-career-path.js
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
    const mk=()=>{
      const you={name:'You', pow:90, _pf:90, _mats:900, _loot:{weapons:[], heals:[], move:null}};
      const me={team:you, alive:true, x:20, y:20, shield:100, hp:100, dealt:0, taken:0};
      // Отряд прямо на прямой линии к кругу и один в стороне.
      const onLine={team:{name:'OnLine', pow:80, _pf:80, _loot:{weapons:[]}}, alive:true, x:40, y:40};
      const aside={team:{name:'Aside', pow:80, _pf:80, _loot:{weapons:[]}}, alive:true, x:20, y:70};
      const squads=[me, onLine, aside];
      you._sq=me;
      you._game={squads, frames:()=>[{circle:{cx:55, cy:55, radius:30}, next:{cx:40, cy:40, radius:20}}], upcoming:()=>({cx:62, cy:62, radius:12}),
        aliveCount:()=>3, nearest:()=>onLine.team, eliminate:(a,b)=>gone.push(a===you?'you':'foe')};
      return you; };
    let you=mk();
    const plan=ccPathPlan(you);
    check('план есть', plan && plan.def && typeof plan.at==='function');
    const dir=plan.def;
    check('на прямом пути отряд OnLine', dir.on.length>=1 && dir.on[0].s.team.name==='OnLine', JSON.stringify(dir.on.map(o=>o.s.team.name)));
    check('шанс встречи растёт с числом отрядов', dir.p>0 && dir.p<=CC_PATH_MAX);
    check('прямой путь без ресов', dir.mats===0);
    // Точка за кругом зажимается в CC_PATH_IN радиуса.
    const far=plan.at({x:200, y:62});
    check('точка зажата в круг', Math.hypot(far.pt.x-62, far.pt.y-62)<=12*CC_PATH_IN+1e-6, JSON.stringify(far.pt));
    // Дальняя сторона круга: путь длиннее, ресы списываются.
    const back=plan.at({x:72, y:72});
    check('дальняя сторона стоит ресов', back.mats===CC_PATH_MATS, back.len+' '+dir.len);
    const host=document.createElement('div'); host.style.cssText='width:600px'; document.body.appendChild(host);
    // Тап по карте: точка и линия едут, подпись меняется, таймер вопроса стоит.
    let p=ccAskPath(you, {map:host}); await tick();
    const svg=host.querySelector('.rp-svg[data-hold]');
    check('карта пути с одной линией', svg && host.querySelectorAll('.rp-map polyline').length===1);
    const bs=[...host.querySelectorAll('[data-at]')];
    check('одна кнопка', bs.length===1, String(bs.length));
    const r0=Math.random;
    if(svg){
      const rc=svg.getBoundingClientRect(), H=Number(svg.dataset.h);
      const ev=(x,y)=>new PointerEvent('pointerdown', {bubbles:true, clientX:rc.left+x/100*rc.width, clientY:rc.top+y/H*rc.height});
      svg.dispatchEvent(ev(68, 68)); await tick();
      const to=svg.querySelector('.rp-to');
      check('точка встала по тапу', to && Math.abs(Number(to.getAttribute("cx"))-68)<1.5, to && to.getAttribute('cx'));
      check('подпись про ресы', host.querySelector('.cc-choice-btn em').textContent.indexOf(String(CC_PATH_MATS))>=0, host.querySelector('.cc-choice-btn em').textContent);
      out.notes.rect=[rc.width|0, rc.height|0];
    }
    Math.random=()=>0.99;
    host.querySelector('[data-at="0"]').click(); await tick();
    for(let i=0;i<10 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
    await p; Math.random=r0;
    check('длинный путь стоит ресов', you._mats===900-CC_PATH_MATS, String(you._mats));
    check('точка ушла в движок', you._pos && typeof you._pos==='object' && Math.abs(you._pos.cx-62)<1e-6, JSON.stringify(you._pos));
    // По умолчанию с броском 0.01: встреча и файт с OnLine (тактика по умолчанию «пушить»).
    you=mk(); Math.random=()=>0.01;
    p=ccAskPath(you, {map:host}); await tick();
    host.querySelector('[data-at="0"]').click(); await tick();
    for(let i=0;i<10 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
    await p; Math.random=r0;
    check('прямо: ресы на месте, встреча стала файтом', gone.length===1 && gone[0]==='foe', JSON.stringify(gone)+' '+you._mats);
    // Пропуск: вопроса нет.
    you=mk(); skipAnimation=true; const n0=host.children.length; await ccAskPath(you, {map:host}); skipAnimation=false;
    check('под пропуском вопроса нет', host.children.length===n0 && you._mats===900 && !you._pos);
    // Уже в круге: вопроса нет.
    you=mk(); you._sq.x=62; you._sq.y=62; check('внутри круга плана нет', ccPathPlan(you)===null);
    ['ru','en','fr','it','pt'].forEach(lg=>['rpTitle','rpHint','rpGo','rpNote','rpClear','rpMet'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpath-')), tmp = path.join(dir, 'index.html');
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
console.log('OK путь ротации: точка тапом в круге, отряды у линии, длинный путь за ресы, встреча = файт, точка в движок, без вопроса под пропуском');
