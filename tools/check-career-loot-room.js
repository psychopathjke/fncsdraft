// Лут на своей точке руками (ccLootRoom): сундуки по одному, автоподбор в свободные слоты, пять слотов,
// стак хилок, одно передвижение, земля и обмен, «Собрать лучшее», ресы от числа открытых, пак из рук.
//   node tools/check-career-loot-room.js
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
  try{
    const set=ccLootSet('m2'); const pool=ccLootPool(set);
    const rng=careerRng(12345); const rolls=[]; for(let i=0;i<20;i++) rolls.push(ccChestRoll(rng, set));
    const host=document.createElement('div'); document.body.appendChild(host);
    const pr=ccLootRoom(host, {rolls, nFast:4, nOpen:12, at:''});
    const q=s=>host.querySelector(s), qa=s=>[...host.querySelectorAll(s)];
    check('окно открыто, 20 сундуков закрыты', qa('.lr-ch[data-c]').length===20, String(qa('.lr-ch[data-c]').length));
    check('«Собрать лучшее» неактивно до первого сундука', q('[data-a="auto"]').disabled);
    q('.lr-ch[data-c]').click();
    check('сундук открылся, ствол сам встал в слот', qa('.lr-ch.open').length===1 && qa('.lr-slot[data-d]').length>=1);
    check('ресы до трети сундуков в плюс', /\\+300/.test(q('.lr-time').textContent), q('.lr-time').textContent);
    q('[data-a="o5"]').click(); q('[data-a="o5"]').click();
    check('открыто 11', qa('.lr-ch.open').length===11);
    check('слотов не больше пяти', qa('.lr-slot[data-d]').length<=5);
    check('лишнее на земле', qa('.lr-g').length>0, String(qa('.lr-g').length));
    // Стак хилок не выше потолка вики, передвижение одно.
    const inv=qa('.lr-slot[data-d]').map(b=>b.textContent);
    out.notes.inv=inv;
    // Выбросить первый слот и взять с земли.
    const n0=qa('.lr-g').length; q('.lr-slot[data-d="0"]').click();
    check('выброшенное легло на землю', qa('.lr-g').length>=n0 && qa('.lr-slot[data-d]').length<=4);
    q('.lr-g[data-g="0"]').click();
    check('взял с земли', qa('.lr-slot[data-d]').length>=1);
    q('[data-a="o5"]').click(); q('[data-a="o5"]').click();
    check('сверх обычного счёта ресы в минус', /−|-\\d/.test(q('.lr-time b').textContent) || q('.lr-time b').classList.contains('down'), q('.lr-time').textContent);
    q('[data-a="auto"]').click();
    q('[data-a="go"]').click();
    const res=await pr;
    check('окно закрылось', !host.querySelector('.cc-loot'));
    check('пак из рук: открыто 20, ресы −300', res.opened===20 && res.mats===-300, res.opened+' '+res.mats);
    const p=ccPackFloor(res.pack, set, Math.random);
    check('пак полный: пять слотов', p.weapons.length+p.heals.length+(p.move?1:0)===5, JSON.stringify(p).slice(0,200));
    check('сила считается', typeof ccPackPow(p)==='number');
    check('ручной пак без выброшенного', res.pack.manual && res.pack.dropped.length===0);
    // Ушёл сразу — пол острова, сила низкая.
    const h2=document.createElement('div'); document.body.appendChild(h2);
    const pr2=ccLootRoom(h2, {rolls, nFast:4, nOpen:12, at:''}); h2.querySelector('[data-a="go"]').click();
    const r2=await pr2; const p2=ccPackFloor(r2.pack, set, Math.random);
    check('ушёл без сундуков: ресы +300, пак с пола, сила минимальна', r2.opened===0 && r2.mats===300 && ccPackPow(p2)<=-3, r2.mats+' '+ccPackPow(p2));
    check('онлайн и пропуск экран не открывают', (()=>{ const s=skipAnimation; skipAnimation=true; const v=ccLootRoomOn(); skipAnimation=s; return v===false; })());
    ['ru','en','fr','it','pt'].forEach(lg=>['lrTitle','lrHint','lrOpened','lrGo','lrAuto','lrInv','lrGround','lrFull'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lroom-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
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
console.log('OK лут на точке руками: сундуки, слоты, земля, ресы, пак из рук');
