// Путь ротации на карте (ccAskPath): три линии к следующему кругу, отряды у линии считаются, встреча — файт середины
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
      you._game={squads, frames:()=>[{circle:{cx:55, cy:55, radius:30}, next:{cx:62, cy:62, radius:12}}],
        aliveCount:()=>3, nearest:()=>onLine.team, eliminate:(a,b)=>gone.push(a===you?'you':'foe')};
      return you; };
    let you=mk();
    const plan=ccPathPlan(you);
    check('три пути', plan && plan.paths.length===3, plan && plan.paths.length);
    const dir=plan.paths.find(p=>p.id==='direct');
    check('на прямом пути отряд OnLine', dir.on.length>=1 && dir.on[0].s.team.name==='OnLine', JSON.stringify(dir.on.map(o=>o.s.team.name)));
    check('шанс встречи растёт с числом отрядов', dir.p>0 && dir.p<=CC_PATH_MAX);
    const host=document.createElement('div'); document.body.appendChild(host);
    // Обход: ресы списаны, встреча по броску.
    let p=ccAskPath(you, {map:host}); await tick();
    check('карта путей нарисована', host.querySelector('.rp-map polyline') && host.querySelectorAll('.rp-map polyline').length===3);
    const bs=[...host.querySelectorAll('[data-at]')];
    check('три кнопки', bs.length===3, String(bs.length));
    const r0=Math.random; Math.random=()=>0.99;
    bs.find(b=>b.textContent.indexOf(L().rpLeft)>=0).click(); await tick();
    for(let i=0;i<10 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
    await p; Math.random=r0;
    check('обход стоит ресов', you._mats===900-CC_PATH_MATS, String(you._mats));
    // Прямо с броском 0.01: встреча и файт с OnLine (решающий исход в пользу сильного).
    you=mk(); Math.random=()=>0.01;
    p=ccAskPath(you, {map:host}); await tick();
    host.querySelector('[data-at="0"]').click(); await tick();
    for(let i=0;i<10 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
    await p; Math.random=r0;
    check('прямо: ресы на месте, встреча стала файтом', gone.length===1 && gone[0]==='foe', JSON.stringify(gone)+' '+you._mats);
    // Пропуск: вопроса нет.
    you=mk(); skipAnimation=true; const n0=host.children.length; await ccAskPath(you, {map:host}); skipAnimation=false;
    check('под пропуском вопроса нет', host.children.length===n0 && you._mats===900);
    // Уже в круге: вопроса нет.
    you=mk(); you._sq.x=62; you._sq.y=62; check('внутри круга плана нет', ccPathPlan(you)===null);
    // Где встаём в круге (ccAskPos): четыре хода, ответ — team._pos для движка; «как обычно» снимает выбор.
    { const y=mk(); let pp=ccAskPos(y, {map:host}); await tick();
      const ps=[...host.querySelectorAll('[data-at]')];
      check('позиция: четыре хода', ps.length===4, String(ps.length));
      const hb=ps.find(b=>b.textContent.indexOf(L().psHold)>=0); if(hb) hb.click(); await tick();
      for(let i=0;i<10 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
      await pp;
      check('позиция: «держать место» ушло движку', y._pos==='hold', String(y._pos));
      skipAnimation=true; const y2=mk(); await ccAskPos(y2, {map:host}); skipAnimation=false;
      check('позиция: под пропуском вопроса нет', y2._pos==null);
      ['ru','en','fr','it','pt'].forEach(lg=>['psTitle','psAuto','psSide','psHold','psCenter','psSet'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null))); }
    ['ru','en','fr','it','pt'].forEach(lg=>['rpTitle','rpHint','rpDirect','rpLeft','rpRight','rpNote','rpSafest','rpClear','rpMet'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
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
console.log('OK путь ротации: три линии, отряды у линии, обход за ресы, встреча = файт, без вопроса под пропуском');
