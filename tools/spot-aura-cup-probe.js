// Аура за ВЕЧЕР, а не за одну игру.
//
// Его слово, 25 августа: «с аурой 10 каждый кап кон у меня был». Проверка
// check-spot-aura меряет одну раздачу, а кубок — одиннадцать игр, и с 25
// августа раздача считается заново перед каждой. Даже 90% тишины на игру дают
// 1 − 0.9¹¹ = 69% вечеров, где хоть раз кто-то прилетел.
//
// Здесь считается то, что видит он: сколько игр из одиннадцати ты сидишь один и
// в какой доле вечеров кон случается хоть раз.
//
//   node tools/spot-aura-cup-probe.js [вечеров]
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname, '..');
const RUNS=+(process.argv[2]||30);
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
if(!CHROME) throw new Error('Chrome not found');

const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={rows:[], fail:null};
  const RUNS=${RUNS};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'AuraCup', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const set=ACTIVE_LANDING_SET;
    const byPts=ALL_LANDING_ZONES.map((z,i)=>({i:i, p:z.points||0})).sort((a,b)=>a.p-b.p);
    careerSpotSet(byPts[Math.floor(byPts.length/2)].i, set);

    const cup=(aura)=>{
      const list=careerSpotList(set);
      if(list && list.length) list[0].aura=aura;
      let games=0, alone=0, cupsWithContest=0, worst=0;
      for(let r=0;r<RUNS;r++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(cr, [me], ccTeams(50), 'cup'+r, false, 0)];
        let hit=0;
        for(let g=0; g<CAREER_CUP_GAMES; g++){
          careerSpotFearOn(you);
          const gr=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
          careerSpotFearOff();
          const on=(gr.get(careerSpotZone(set))||[]).length;
          games++; if(!on) alone++; else hit++;
        }
        if(hit) cupsWithContest++;
        if(hit>worst) worst=hit;
      }
      return {аура:aura, игрОдному:Math.round(alone/games*100)+'%',
              вечеровСКоном:Math.round(cupsWithContest/RUNS*100)+'%',
              худшийВечер:worst+' из '+CAREER_CUP_GAMES};
    };
    [0, 3, 5, 7, CC_SPOT_AURA_MAX].forEach(a=>out.rows.push(cup(a)));
  }catch(e){ out.fail=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'auracup-'));
const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT.split(path.sep).join('/')+'/">'+
  fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
 '--virtual-time-budget=1800000','--dump-dom','file:///'+tmp.split(path.sep).join('/')],
 {maxBuffer:512*1024*1024,encoding:'utf8',stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\s\S]*?)END/);
if(!m){ console.error('проба ничего не вернула'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.fail){ console.error(out.fail); process.exit(1); }
console.log('аура  игр один  вечеров с коном  худший вечер');
out.rows.forEach(r=>console.log(String(r.аура).padEnd(6)+String(r.игрОдному).padEnd(11)+
  String(r.вечеровСКоном).padEnd(17)+r.худшийВечер));
