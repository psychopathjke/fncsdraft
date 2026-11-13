// Концовка двумя остановками: двигающиеся круги (ccAskMoving) и последние отряды (ccAskLast).
// Номера кругов по шторму, ход по умолчанию первым и равен ответу четвёртой зоны, ротация пишется в team._rot,
// третья сторона и файт концовки идут через движок, таблица стычки концовки 50/20.
//   node tools/check-career-endgame.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SRC = process.env.INDEX || path.join(ROOT, 'index.html');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `<pre id="__out" style="display:none"></pre><script>
window.addEventListener("load", function(){ setTimeout(async function(){
  const out={fails:[], errs:[], notes:{}}; window.addEventListener('error', e=>out.errs.push(String(e.message)));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const tick=()=>new Promise(r=>setTimeout(r, 30));
  try{
    CC_GAME_PHASES=ZoneSim.phasesFor('2026-08-01', 2);
    check('11 кругов: остановки 10 и 11', ccEndZones().move===10 && ccEndZones().last===11, JSON.stringify(ccEndZones()));
    CC_GAME_PHASES=ZoneSim.phasesFor('2019-10-01', 2);
    check('9 кругов: только 9', ccEndZones().move===9 && !ccEndZones().last, JSON.stringify(ccEndZones()));
    CC_GAME_PHASES=ZoneSim.phasesFor('2026-08-01', 2);
    const zs=CC_GAME_STOPS.map(s=>s.zone);
    check('остановки по возрастанию', zs.every((z,i)=>!i || !z || z>zs[i-1]), zs.join(','));
    // Игра-заглушка: сосед, выбывания.
    const foe={name:'Foe', pow:80, _pf:80, _loot:{weapons:[]}}; const gone=[];
    const mk=()=>{ const you={name:'You', pow:90, _pf:90, _rot:'with', _mats:900, _sq:{shield:100, hp:100, dealt:0, taken:0},
      _loot:{weapons:[], heals:[], move:null}};
      you._game={aliveCount:()=>12, nearest:()=>foe, eliminate:(a,b)=>gone.push(a===you?'you':'foe')}; return you; };
    const host=document.createElement('div'); document.body.appendChild(host);
    const by=t=>[...host.querySelectorAll('[data-at]')].find(b=>b.textContent.indexOf(t)>=0);
    // Двигающиеся: первая кнопка — ответ четвёртой зоны («со штормом»).
    let you=mk(); let p=ccAskMoving(you, {map:host}); await tick();
    let bs=[...host.querySelectorAll('[data-at]')];
    out.notes.moving=bs.map(b=>b.textContent.trim().slice(0,30));
    check('двигающиеся: 4 хода', bs.length===4, String(bs.length));
    check('двигающиеся: первым ответ четвёртой зоны', bs[0] && bs[0].textContent.indexOf(L().mvEdge)>=0, bs[0] && bs[0].textContent);
    check('в заголовке живые', /12/.test(host.textContent));
    by(L().mvEarly).click(); await tick();
    for(let i=0;i<20 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
    await p;
    check('ротация записана движку', you._rot==='early', you._rot);
    // Третья сторона через движок.
    you=mk(); const r0=Math.random; Math.random=()=>0.01;
    p=ccAskMoving(you, {map:host}); await tick();
    by(L().mvThird).click(); await tick();
    for(let i=0;i<20 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
    await p; Math.random=r0;
    check('третья сторона выбила соседа', gone[gone.length-1]==='foe' && you._rot==='with', gone.join(','));
    // Последние: держать — по умолчанию первым.
    you=mk(); p=ccAskLast(you, {map:host}); await tick();
    bs=[...host.querySelectorAll('[data-at]')]; out.notes.last=bs.map(b=>b.textContent.trim().slice(0,30));
    check('последние: держать первым', bs[0] && bs[0].textContent.indexOf(L().lsHold)>=0 && bs.length===3);
    by(L().lsPush).click(); await tick();
    for(let i=0;i<20 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
    await p;
    // Таблица стычки концовки: решающих 50%, размен 20%.
    const y2=mk(); const n0=gone.length; const o1=ccFightApply(y2, 0.45, foe, CC_FIGHT_LATE);
    check('концовка: 0.45 решается (а в середине нет)', (o1==='win' || o1==='die') && ccFightApply(mk(), 0.45, foe)!=='win' , o1);
    check('концовка: 0.65 размен', ccFightApply(mk(), 0.65, foe, CC_FIGHT_LATE)==='trade');
    check('концовка: 0.75 разошлись', ccFightApply(mk(), 0.75, foe, CC_FIGHT_LATE)==='poke');
    ['ru','en','fr','it','pt'].forEach(lg=>['mvTitle','mvEarly','mvEarlyNote','mvEdge','mvEdgeNote','mvTarp','mvTarpNote','mvThird','lsTitle','lsHold','lsHoldNote','lsHoldGot','lsPush'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
    check('тексты без длинного тире', !/\u2014/.test(L().mvEarlyNote(63)+L().lsHoldNote));
    // Как у про: тэг на сюрдж в концовке, когда сюрдж включён и запас мал; без сюрджа хода нет. Тоннель — название низа с 2023.
    { const sgYou=()=>{ const y=mk(); y._sq.dealt=0; y._sq.taken=200; y._game.frames=()=>[{surgeAt:60, players:80, surgeLine:-50}]; return y; };
      let y=sgYou(); let pp=ccAskLast(y, {map:host}); await tick();
      const tagB=[...host.querySelectorAll('[data-at]')].find(b=>b.textContent.indexOf(L().ccLateTag)>=0);
      check('последние отряды: есть «тэгать на сюрдж» при сюрдже', !!tagB);
      if(tagB) tagB.click(); await tick();
      for(let i=0;i<20 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
      await pp;
      check('тэг добавил урон в сюрдж', y._sq.dealt===CC_SURGE_FARM, String(y._sq.dealt));
      y=mk(); pp=ccAskMoving(y, {map:host}); await tick();
      check('без сюрджа тэга нет', ![...host.querySelectorAll('[data-at]')].some(b=>b.textContent.indexOf(L().ccLateTag)>=0));
      for(let i=0;i<20 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); }
      await pp;
      ['ru','en','fr','it','pt'].forEach(lg=>['ccLateTunnel','ccLateTag','ccLatePro'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
    }
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'endg-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + fs.readFileSync(SRC, 'utf8').replace('</body>', BOOT + '</body>'));
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
console.log('OK концовка: двигающиеся круги и последние отряды');
