// Пройти квалификацию Solo Series — насколько это вообще возможно.
//
// Комната карьеры: 4900, десять игр лобби по сто, топ-100 (доля Epic'ских 400
// из 19 532). Меряется на трёх силах (78 — середина ладдера, 88 — дивизион 2,
// 96 — топ мира) и в двух посадках своего лобби:
//   queue — игрок в очереди раздачи, как бот (сильный выбирает первым);
//   home  — боты садятся первыми, игрок последним на СВОЮ метку (одна и та же
//           коробка каждую игру, средняя по луту) — как в живом вечере с меткой;
//   pick  — боты первыми, игрок последним на самую пустую коробку (лучший выбор);
//   homeFirst — игрок на метке ДО раздачи, боты садятся, зная, кто там.
// Чужие лобби — buildBotLandingAssignment каждую игру, как в simulateGamesLive.
//
// Версия до 30 августа считала без раздачи высадки вовсе (stale landingZone):
// половина лобби умирала на дропе, сила не решала — и 96 проходил 43%. Это был
// артефакт пробы, не игры.
//
//   node tools/career-solo-qual-probe.js [прогонов]   (CC_OVRS=78,96 CC_MODES=home,pick — уже)
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = +(process.argv[2] || 20);
const OVRS = (process.env.CC_OVRS || '78,88,96').split(',').map(Number);
const MODES = (process.env.CC_MODES || 'queue,home,pick').split(',');
const HANDLE = process.env.CC_HANDLE || '';   // настоящая карточка ростера вместо новичка
const DIV = +(process.env.CC_DIV || 3);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {err:null, runs:${RUNS}, by:{}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'QualProbe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:${JSON.stringify(HANDLE||null)}, cardRegion:${HANDLE?"'EU'":'null'}, nat:null},
      career:{season:1, day:'2026-01-11', division:${DIV}, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    CARD_MODE=true; squadSize=1; useLandingSet(careerBrSet()); CC_KILL_CAP=0;
    out.cut=soloSeriesQualCut();
    out.room=careerVictoryField(true);
    out.zones=ALL_LANDING_ZONES.length;
    // Метка: коробка со средним лутом.
    const byPts=ALL_LANDING_ZONES.slice().sort((a,b)=>(a.points||0)-(b.points||0));
    const home=byPts[Math.floor(byPts.length/2)];
    out.home={zone:home.zone, points:home.points};
    for(const ovr of ${JSON.stringify(OVRS)}){
      CAREER.player.ovr=ovr;
      out.card=out.card||{handle:(careerCard()||{}).handle, pow:Math.round(careerYouTeam([careerCard()]).pow)};
      for(const mode of ${JSON.stringify(MODES)}){
        const places=[], dropDead=[], avgPlaces=[];
        for(let i=0;i<${RUNS};i++){
          const me=careerCard();
          const you=careerYouTeam([me]); you.isYou=true;
          const field=[you, ...careerSoloField(cr, [me], out.room, true)];
          field.forEach(t=>{ t.stagePts=0; t.stageElims=0; t.wins=0; });
          let dd=0, sumPlace=0;
          for(let g=0; g<10; g++){
            const sh=field.slice();
            for(let k=sh.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); const t=sh[k]; sh[k]=sh[j]; sh[j]=t; }
            for(let s=0; s<sh.length; s+=100){
              const lobby=sh.slice(s, s+100);
              lobby.forEach(t=>{ t._elims=0; t._droppedOut=false; t._deathCause=null; });
              let groups;
              if(mode==='homeFirst' && lobby.indexOf(you)>=0){
                // Игрок сидит на метке ДО раздачи: боты выбирают, зная, кто там.
                you.landingZone=home; you.landingResult=null; you.landingRival=null;
                groups=new Map([[home,[you]]]);
                buildBotLandingAssignment(lobby.filter(t=>t!==you), {into:groups});
              } else if(mode!=='queue' && lobby.indexOf(you)>=0){
                // Как в careerLandingPick: боты садятся первыми, игрок — последним.
                groups=buildBotLandingAssignment(lobby.filter(t=>t!==you)).zoneGroups;
                let z=home;
                if(mode==='pick'){ let bestN=1e9; ALL_LANDING_ZONES.forEach(zz=>{ const n=(groups.get(zz)||[]).length; if(n<bestN){ bestN=n; z=zz; } }); }
                you.landingZone=z; you.landingResult=null; you.landingRival=null;
                if(!groups.has(z)) groups.set(z, []); groups.get(z).push(you);
              } else {
                groups=buildBotLandingAssignment(lobby).zoneGroups;
              }
              const order=simulateGame(lobby, {zoneGroups:groups});
              order.forEach((t,idx)=>{
                const place=idx+1, elims=t._elims||0;
                t.stagePts+=victoryR1Points(place)+ccKillPts(elims, 3);
                t.stageElims+=elims;
                if(place===1) t.wins++;
              });
              if(lobby.indexOf(you)>=0){ if(you._droppedOut) dd++; sumPlace+=order.indexOf(you)+1; }
            }
          }
          const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
          places.push(ranked.indexOf(you)+1); dropDead.push(dd); avgPlaces.push(sumPlace/10);
        }
        places.sort((a,b)=>a-b);
        const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
        out.by[ovr+'/'+mode]={
          through: places.filter(p=>p<=out.cut).length,
          rate: +(places.filter(p=>p<=out.cut).length/places.length*100).toFixed(1),
          best: places[0], median: places[Math.floor(places.length/2)], worst: places[places.length-1],
          dropDeadOf10: +avg(dropDead).toFixed(1), avgGamePlace: +avg(avgPlaces).toFixed(1)
        };
      }
    }
  } catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccqual-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
console.log(JSON.stringify(out, null, 2));
