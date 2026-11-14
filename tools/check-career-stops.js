// Остановки игры: окна только ротации (4-я) и концовки (8-я), фарм, середина, сёрдж и хилки сами.
//   node tools/check-career-stops.js
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
    const kinds=[]; const cb=ccChoiceBox;
    ccChoiceBox=async function(title, hint, opts, map, side, kind){ kinds.push(String(kind||'').replace(/:.*$/,'')); return (opts.find(o=>o && o.def)||opts[0]); };
    const mk=(surge)=>{
      const you={name:'You', pow:90, _pf:90, _mats:300, _loot:{weapons:[{name:'AR', icon:'rifle', rarity:'epic'}], heals:[{name:'Shield Potion', rarity:'rare', n:3}], move:null}};
      const me={team:you, alive:true, x:20, y:20, shield:40, hp:100, dealt:0, taken:200, skill:0.5};
      const foe={team:{name:'Foe', pow:90, _pf:90, _mats:900, _loot:{weapons:[]}}, alive:true, x:24, y:20, skill:0.5};
      you._sq=me;
      you._game={squads:[me, foe], frames:()=>[{circle:{cx:30, cy:30, radius:20}, surgeAt:surge?20:0, players:40, surgeLine:0}], upcoming:()=>({cx:60, cy:60, radius:12}),
        aliveCount:()=>2, nearest:()=>foe.team, eliminate:()=>true};
      return you; };
    const ui={note:()=>{}, map:document.body};
    const run=async you=>{ for(const st of CC_GAME_STOPS){ if(st.zone===1) continue; if(st.quiet && st.quiet(you)) continue; await st.ask(you, ui); } };
    let you=mk(true); await run(you);
    out.notes.kinds=kinds.slice();
    check('окна только ротации и концовки', kinds.length===2 && kinds[0]==='rot' && kinds[1]==='late', JSON.stringify(kinds));
    check('фарм прошёл сам', ccMats(you)>300, String(ccMats(you)));
    check('сёрдж набит сам', you._sq.dealt>=CC_SURGE_FARM, String(you._sq.dealt));
    check('хилки выпиты сами', you._sq.shield>40, String(you._sq.shield));
    // Reload: сёрджа нет.
    kinds.length=0; ACTIVE_LANDING_SET='r1'; you=mk(true); await run(you); ACTIVE_LANDING_SET='s42';
    check('Reload: сёрдж молчит', you._sq.dealt===0 || you._sq.dealt<CC_SURGE_FARM, String(you._sq.dealt));
    // Zero Build: фарма нет.
    kinds.length=0; const zb=CC_ZB; CC_ZB=true; you=mk(false); await run(you); CC_ZB=zb;
    check('ZB: окна те же', kinds.join()==='rot,late', kinds.join());
    ccChoiceBox=cb;
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cstops-')), tmp = path.join(dir, 'index.html');
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
console.log('OK три остановки: точка, ротация, концовка');
