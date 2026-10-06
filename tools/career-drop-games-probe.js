// Проба: где садятся боты игра за игрой в настоящем вечере карьеры (хук раннера careerLandingPick).
//
// Тестер, 6.10: «в 5 главе в финале фнкс почти все локи свободны и боты устраивают трипл конв
// и каждую игру локу меняют… теперь вообще везде сломано, в каждой главе»; «лейт сломан: игра
// только начинается и уже челов не остаётся».
//
// Меряется по каждой игре: сколько команд сменили коробку с прошлой игры, сколько коробок свободно,
// сколько команд стоит в самой людной, сколько живых к первой зоне.
//   node tools/career-drop-games-probe.js [день карьеры, напр. 2024-06-01]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
const DAY = process.argv[2] || '2026-02-02', N = +(process.argv[3] || 50);
const HEAD = `<script>window.__errs=[];window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));<\/script>`;
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={games:[], notes:{}, errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Dropper', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'${DAY}', division:1, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    // Авто-ответы, как в карьерных проверках: кнопка выбора, окно про метку — тем же выходом, что вечер шёл до гейта.
    setInterval(()=>{ const b=document.querySelector('.cc-choice .cc-choice-btn'); if(b) b.click();
      const am=document.getElementById('ccAskModal'); if(am && am.style.display==='flex'){ const no=document.getElementById('ccAskNo'); if(no) no.click(); } }, 300);
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=careerSquadSize(); useLandingSet(careerBrSet());
    out.notes.set=ACTIVE_LANDING_SET; out.notes.zones=ALL_LANDING_ZONES.length; out.notes.squad=squadSize;
    const you=careerYouTeam([me]); you.isYou=true; you.name='you';
    const field=[you, ...careerCupField(cr, [me], ccTeams(${N}), null, false, 0)];
    out.notes.field=field.length;
    const key=z=>z ? (z.name||z.label||(z.x+','+z.y)) : '-';
    const prevAt=new Map();
    const origSim=simulateGame;
    await simulateGamesLive(field, 6, majorPoints, 1, 'stage', 0, null, null,
      {lobbySize:ccTeams(50), stageName:'probe', mapReplay:false, stopOnYourDeath:false, choices:true,
       dropEachGame:async (g,room)=>{
         const groups=await careerLandingPick(room||field, you, 'probe', ['cup']);
         const bots=(room||field).filter(t=>!t.isYou);
         const now=bots.map(t=>key(t.landingZone));
         const per={}; now.forEach(k=>{ per[k]=(per[k]||0)+1; });
         const used=Object.keys(per).length, free=ALL_LANDING_ZONES.length-used;
         const seen=bots.filter(t=>prevAt.has(t)); const moved=g>1 ? seen.filter(t=>prevAt.get(t)!==key(t.landingZone)).length+'/'+seen.length : null; bots.forEach(t=>prevAt.set(t, key(t.landingZone)));
         const shared=Object.values(per).filter(v=>v>=2).reduce((a,b)=>a+b,0);
         const triple=Object.values(per).filter(v=>v>=3).length;
         out.games.push({g, moved, used, free, maxOnBox:Math.max(...Object.values(per)), shared, triple});
         
         return groups;
       }});
    // Живые к первой зоне: по журналу последней игры, если он есть.
    out.notes.youLog=(you.stageLog||[]).length;
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BE'+'GIN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dropgames-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=1800000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(DAY, JSON.stringify(out.notes));
out.games.forEach(g => console.log('  игра', g.g, '· сменили коробку', g.moved, '· занято', g.used, 'свободно', g.free, '· больше всего на одной', g.maxOnBox, '· в контестах', g.shared, '· коробок с 3+', g.triple));
if (out.fail) console.error('FAILED: ' + out.fail);
if ((out.errs || []).length) console.error('page errors: ' + out.errs.slice(0, 5).join(' | '));
// Сторожем: CHECK=1 node tools/career-drop-games-probe.js 2026-02-02 100 — перемешанные лобби (поле 100, лобби по 50)
// не складывают хозяев точки втроём и не оставляют пустых точек, пока где-то стоят вдвоём (до правки 6.10: свободно 7–11, троек до 6).
if (process.env.CHECK) {
  const bad = out.games.filter(g => g.triple > 0 || (g.free > 0 && g.shared > 0));   // 6.10: «пустых точек не должно быть»
  if (out.fail || bad.length) { console.error('FAIL', JSON.stringify(bad)); process.exit(1); }
  console.log('OK: перемешанные лобби — без тройных контестов и без пустых точек');
}
