// Толпа на точке высадки вне карьеры (драфт, Мейджор): поле 49–60 команд без книги высадок и мест прошлого этапа.
// Тестер, Notion «fncsdraft» 7.10: «баг не до конца пофиксился» — «Внимание: там уже 6 команд — придётся победить всех».
// Правило: пока команд не больше, чем две на коробку, на точке не больше двух; пустых коробок нет, пока где-то двое.
//   node tools/check-drop-crowd.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}, errs:[]};
try{
  const sets=['m1','f1','t1','k1'].filter(s=>{ try{ useLandingSet(s); return ALL_LANDING_ZONES.length>0; }catch(e){ return false; } });
  sets.forEach(set=>{ [49, 60].forEach(n=>{ for(let seed=0; seed<4; seed++){
    useLandingSet(set);
    const rnd=careerRng(ccHashStr('crowd|'+set+'|'+n+'|'+seed));
    const pool=PLAYERS.filter(p=>p && p.handle).slice(0, 2000);
    const bots=[]; for(let i=0;i<n;i++){ const a=pool[Math.floor(rnd()*pool.length)], b=pool[Math.floor(rnd()*pool.length)];
      const t={name:a.handle+' & '+b.handle, squad:[a,b].map(p=>Object.assign({}, p, {rating:p.rating||80})), pow:70+rnd()*30, closeEdge:0}; bots.push(t); }
    const cut=1+Math.floor(rnd()*(n-1)), g=buildBotLandingAssignment(bots.slice(0, cut)).zoneGroups; buildBotLandingAssignment(bots.slice(cut), {into:g});   // как пикер: впереди тебя, потом остальные в те же группы
    const counts=ALL_LANDING_ZONES.map(z=>(g.get(z)||[]).length);
    const max=Math.max(...counts), empty=counts.filter(c=>!c).length, zones=ALL_LANDING_ZONES.length;
    out.notes[set+'/'+n+'/'+seed]={zones, max, empty};
    const dens=Math.max(2, Math.ceil(n/zones));
    if(max>dens) out.fails.push(set+' n'+n+' s'+seed+': на точке '+max+' команд при плотности '+dens+' (коробок '+zones+')');
    if(empty && max>=2) out.fails.push(set+' n'+n+' s'+seed+': пустых '+empty+' при двоих на точке');
  } }); });
  // Книга высадок карьеры в обычном (не перемешанном) лобби: у многих один дом — на точке не больше плотности.
  { useLandingSet('m1'); const z0=ALL_LANDING_ZONES[0];
    const keep={b:ccDropBook, m:ccDropBookMoves, s:ccStageSeats, r:CC_SEATS_REMIX};
    const rnd=careerRng(ccHashStr('crowd|book')), pool=PLAYERS.filter(p=>p && p.handle).slice(0, 2000), bots=[];
    for(let i=0;i<40;i++){ const a=pool[Math.floor(rnd()*pool.length)], b=pool[Math.floor(rnd()*pool.length)]; bots.push({name:a.handle+' & '+b.handle, squad:[a,b].map(p=>Object.assign({}, p, {rating:p.rating||80})), pow:70+rnd()*30, closeEdge:0}); }
    const at={}; bots.slice(0, 8).forEach(t=>{ at[ccHashStr(ccSeatMapKey(t)).toString(36)]=ccSeatKeyOf(z0); });
    ccDropBook=()=>({at}); ccDropBookMoves=()=>false; ccStageSeats=()=>null; CC_SEATS_REMIX=false;
    let g=null; try{ g=buildBotLandingAssignment(bots).zoneGroups; } finally { ccDropBook=keep.b; ccDropBookMoves=keep.m; ccStageSeats=keep.s; CC_SEATS_REMIX=keep.r; }
    const n=(g.get(z0)||[]).length; out.notes.book8=n;
    if(n>2) out.fails.push('книга: 8 хозяев одной точки в обычном лобби — на ней '+n+' команд'); }
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crowd-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL'].concat(out.fails.slice(0, 12)).join(String.fromCharCode(10))); console.log(JSON.stringify(out.notes)); process.exit(1); }
console.log('OK толпа на точке', JSON.stringify(out.notes));
