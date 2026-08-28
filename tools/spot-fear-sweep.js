// Сколько должна весить аура, чтобы в ПОЛНОЙ комнате дом оставляли в покое.
//
// Развёртка сделана заново, 25 августа. Прошлая (та, что дала 0.55) считала по
// сорок команд на остров: тридцать шесть коробок, четыре двойки — коробку с
// репутацией легко обойти. Вечер, который он играет, — это пятьдесят команд на
// те же тридцать шесть, четырнадцать двоек, и там всё иначе: сесть вторым к
// кому-то стоит CONTEST_COST=2.4, а полная аура при 0.55 стоит всего
// 2.4·0.55·0.5 = 0.66 — вчетверо дешевле. Поэтому дом заселяли всегда.
//
// Его слово, 25 августа: «чем больше аура, тем не падать должны люди».
//
// Меряется на настоящей комнате кубка: среднее число соседей на доме при ауре
// 0, половине и полной, плюс доля делящих коробку по всему острову — она
// откалибрована (53%) и сдвигаться не должна.
//
//   node tools/spot-fear-sweep.js [вечеров]
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname, '..');
const RUNS=+(process.argv[2]||40);
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
      v:1, player:{nick:'Fear', age:20, source:'rookie', country:'de', countryPing:15,
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
    const homeIdx=byPts[Math.floor(byPts.length/2)].i;
    careerSpotSet(homeIdx, set);

    const measure=(pair, aura)=>{
      CC_SPOT_FEAR=pair[0]; CC_SPOT_FEAR_BASE=pair[1];
      const list=careerSpotList(set);
      if(list && list.length) list[0].aura=aura;
      let sum=0, alone=0, shared=0, total=0;
      for(let r=0;r<RUNS;r++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(cr, [me], ccTeams(50), 'fear'+r, false, 0)];
        careerSpotFearOn(you);
        const g=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
        careerSpotFearOff();
        const home=careerSpotZone(set);
        const on=(g.get(home)||[]).length;
        sum+=on; if(!on) alone++;
        g.forEach(list2=>{ total+=list2.length; if(list2.length>1) shared+=list2.length; });
      }
      return {соседей:Math.round(sum/RUNS*100)/100,
              вечеровОдному:Math.round(alone/RUNS*100)+'%',
              делятКоробку:Math.round(shared/total*100)+'%'};
    };

    [[0.9,1.0],[1.0,1.0],[1.1,1.0],[1.2,1.0]].forEach(f=>{
      out.rows.push({вес:f[0]+'/'+f[1], 'аура 0':measure(f,0), 'аура 3':measure(f,3), 'аура 5':measure(f,5), 'аура 7':measure(f,7),
                     'аура 10':measure(f,10)});
    });
  }catch(e){ out.fail=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fear-'));
const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT.split(path.sep).join('/')+'/">'+
  fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
 '--virtual-time-budget=1200000','--dump-dom','file:///'+tmp.split(path.sep).join('/')],
 {maxBuffer:512*1024*1024,encoding:'utf8',stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\s\S]*?)END/);
if(!m){ console.error('проба ничего не вернула'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.fail){ console.error(out.fail); process.exit(1); }
console.log('вес/база  аура 0        аура 3        аура 5        аура 7        аура 10');
out.rows.forEach(r=>{
  const c=k=>(r[k].соседей+'/'+r[k].вечеровОдному).padEnd(14);
  console.log(String(r.вес).padEnd(10)+c('аура 0')+c('аура 3')+c('аура 5')+c('аура 7')+c('аура 10')+' делят '+r['аура 10'].делятКоробку);
});
