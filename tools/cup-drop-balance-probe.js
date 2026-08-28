// Что стало с дивизионным кубком, когда в нём появилась высадка.
//
// До 25 августа кубок игрался вообще без дропа: ни у кого не было landingZone,
// движок ставил всех в случайные клетки сетки, стычек на земле не случалось
// (creditLandingContests пропускает пустую коробку). Его правка вернула туда
// вопрос «куда падаем» — а вместе с вопросом вернулись и коробки, и драки за
// них, то есть половина комнаты теперь может умереть до первого круга.
//
// Лестница дивизионов откалибрована на том, как игрок в этом кубке стоит
// (career-cup-calibration.js), поэтому цифру надо назвать, а не предположить.
// Меряется одно и то же поле двумя способами:
//   было  — zoneGroups=null, как играл кубок до правки;
//   стало — раздача от careerLandingPick, ответ по умолчанию (своя/тихая
//           точка), обновляемый перед каждой игрой, как в живом вечере.
//
//   node tools/cup-drop-balance-probe.js [прогонов]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = parseInt(process.argv[2] || '24', 10);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={notes:{}, errs:null, fail:null};
  const RUNS=${RUNS};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'CupProbe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());

    const run=async(withDrop)=>{
      const places=[], pts=[]; let cut=0;
      for(let r=0;r<RUNS;r++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(cr, [me], ccTeams(50), null, false, 0)];
        const zones=withDrop ? await careerLandingPick(field, you, 'probe', ['cup']) : null;
        await simulateGamesLive(field, CAREER_CUP_GAMES, pointsForPlace, 4, 'stage', 0, null, zones,
          {lobbySize:ccTeams(50), stageName:'probe', mapReplay:false, stopOnYourDeath:false,
           dropEachGame: withDrop ? (()=>careerLandingPick(field, you, 'probe', ['cup'])) : undefined});
        const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0));
        const place=ranked.indexOf(you)+1;
        places.push(place); pts.push(you.stagePts);
        if(place<=careerCupCut(1)) cut++;
      }
      const avg=a=>Math.round(a.reduce((s,x)=>s+x,0)/a.length*10)/10;
      places.sort((a,b)=>a-b);
      return {avgPlace:avg(places), medPlace:places[Math.floor(places.length/2)],
              avgPts:avg(pts), cutRate:Math.round(cut/RUNS*100), of:RUNS,
              cutLine:careerCupCut(1)};
    };
    out.notes.было=await run(false);
    out.notes.стало=await run(true);
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cupdrop-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=5400000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) console.error('page errors: ' + out.errs.join(' | '));
console.log(JSON.stringify(out.notes, null, 1));
