// Пройти квалификацию Solo Series — насколько это вообще возможно.
//
// Epic давал четыре сессии и брал лучшую; карьера начинается 5 января и
// успевает на одну (11.01). Отсечка перенесена долей — топ-400 из 19 532 у
// Epic, то же самое от комнаты карьеры. Вопрос, который проба отвечает: с
// ОДНОЙ попытки в топ-2% — это дорога или стена. Меряется на трёх силах
// (78 — середина ладдера, 88 — дивизион 2, 96 — топ мира).
//
//   node tools/career-solo-qual-probe.js [прогонов]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = +(process.argv[2] || 60);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {errs:null, fail:null, runs:${RUNS}, by:{}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'QualProbe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-11', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    out.cut=soloSeriesQualCut();
    out.room=careerVictoryField(true);

    // Комната и подсчёт очков — те же, что у ранера; без анимации и экрана:
    // меряется отбор, а не отрисовка.
    for(const ovr of [78, 88, 96]){
      CAREER.player.ovr=ovr;
      const places=[];
      for(let i=0;i<${RUNS};i++){
        const me=careerCard();
        const you=careerYouTeam([me]); you.isYou=true;
        const field=[you, ...careerSoloField(cr, [me], out.room, true)];
        field.forEach(t=>{ t.stagePts=0; t.stageElims=0; t.wins=0; });
        // Десять игр по сетке Epic, лобби сотнями — то же, что simulateGamesLive
        // делает с lobbySize, только без кадров.
        for(let g=0; g<10; g++){
          const sh=field.slice();
          for(let k=sh.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); const t=sh[k]; sh[k]=sh[j]; sh[j]=t; }
          for(let s=0; s<sh.length; s+=100){
            const lobby=sh.slice(s, s+100);
            const order=simulateGame(lobby);
            order.forEach((t,idx)=>{
              const place=idx+1, elims=t._elims||0;
              t.stagePts+=victoryR1Points(place)+ccKillPts(elims, 3);
              t.stageElims+=elims;
              if(place===1) t.wins++;
            });
          }
        }
        const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
        places.push(ranked.indexOf(you)+1);
      }
      places.sort((a,b)=>a-b);
      out.by[ovr]={
        through: places.filter(p=>p<=out.cut).length,
        rate: +(places.filter(p=>p<=out.cut).length/places.length*100).toFixed(1),
        best: places[0], median: places[Math.floor(places.length/2)], worst: places[places.length-1]
      };
    }
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccqual-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
console.log(JSON.stringify(JSON.parse(decodeURIComponent(m[1])), null, 2));
