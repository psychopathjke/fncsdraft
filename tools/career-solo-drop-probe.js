// Дроп в соло-сотне: сколько умирает на высадке, от чего и решает ли сила.
//
// Его слово, 30 августа: «померь соло ещё». career-solo-lobby-probe показал,
// что сильнейший в комнате (сила 100 против медианы 61) в 41% игр не
// переживает высадку — столько же, сколько 78-й. Здесь дроп разбирается по
// частям: раздача как у чужих лобби (buildBotLandingAssignment на всё лобби,
// игрок в очереди как все) и «умный» выбор (игрок пересаживается на пустую
// коробку). Для каждого — сколько на его коробке народу и как часто он там
// гибнет; и доля всего лобби, погибшая на дропе.
//
//   node tools/career-solo-drop-probe.js [игр на силу]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const G = +(process.argv[2] || 150);
const CHROME = [process.env.CHROME,
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
  const out={err:null, games:${G}, zones:0, by:{}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'DropProbe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-11', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    CARD_MODE=true; squadSize=1; useLandingSet(careerBrSet()); CC_KILL_CAP=0;
    if(typeof splitLandingZonesForSolo==='function' && ALL_LANDING_ZONES.length<50) splitLandingZonesForSolo();
    out.zones=ALL_LANDING_ZONES.length;
    const room=careerVictoryField(true);
    const avg=a=>a.length ? a.reduce((s,v)=>s+v,0)/a.length : 0;
    for(const ovr of [78, 96]){
      CAREER.player.ovr=ovr;
      const me=careerCard();
      const you=careerYouTeam([me]); you.isYou=true;
      const bots=careerSoloField(cr, [me], room, true);
      for(const mode of ['queue','empty']){
        const rec={stack:{}, dead:{}, place:[], lobbyDropDead:[], stackYou:[]};
        for(let g=0; g<${G}; g++){
          const sh=bots.slice();
          for(let k=sh.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); const t=sh[k]; sh[k]=sh[j]; sh[j]=t; }
          const lobby=[you, ...sh.slice(0, 99)];
          lobby.forEach(t=>{ t._elims=0; t._droppedOut=false; t._deathCause=null; });
          const groups=buildBotLandingAssignment(lobby).zoneGroups;
          if(mode==='empty'){
            // Умный выбор: пустая коробка, если есть; иначе самая малолюдная.
            let best=null, bestN=1e9;
            ALL_LANDING_ZONES.forEach(z=>{ const n=(groups.get(z)||[]).filter(t=>t!==you).length; if(n<bestN){ bestN=n; best=z; } });
            if(best && best!==you.landingZone){
              const old=groups.get(you.landingZone); if(old){ const i=old.indexOf(you); if(i>=0) old.splice(i,1); }
              you.landingZone=best; if(!groups.has(best)) groups.set(best,[]); groups.get(best).push(you);
            }
          }
          const stack=(groups.get(you.landingZone)||[]).length;
          const order=simulateGame(lobby, {zoneGroups:groups});
          const place=order.indexOf(you)+1;
          const k=stack>=3 ? '3+' : String(stack);
          rec.stack[k]=(rec.stack[k]||0)+1;
          if(you._droppedOut) rec.dead[k]=(rec.dead[k]||0)+1;
          rec.place.push(place); rec.stackYou.push(stack);
          rec.lobbyDropDead.push(lobby.filter(t=>t._droppedOut).length);
        }
        const deadBy={}; Object.keys(rec.stack).forEach(k=>{ deadBy[k]=+((rec.dead[k]||0)/rec.stack[k]*100).toFixed(0)+'% of '+rec.stack[k]; });
        out.by[ovr+'/'+mode]={pow:Math.round(you.pow), avgStack:+avg(rec.stackYou).toFixed(2), deadByStack:deadBy,
          youDropDead:+(Object.values(rec.dead).reduce((s,v)=>s+v,0)/rec.place.length*100).toFixed(1),
          lobbyDropDead:+(avg(rec.lobbyDropDead)).toFixed(1),
          avgPlace:+avg(rec.place).toFixed(1), top10:+(rec.place.filter(p=>p<=10).length/rec.place.length*100).toFixed(1),
          winRate:+(rec.place.filter(p=>p===1).length/rec.place.length*100).toFixed(1)};
      }
    }
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccsolodrop-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
console.log(JSON.stringify(out, null, 1));
