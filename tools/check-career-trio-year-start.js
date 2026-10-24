/* Трио-год после 2026-го у карьеры, начатой в 2026-м (25.10, его «мб потом распадаются триосы»): в первый день года
   у топ-30 пар сцены есть третий и никто из топ-40 не стоит без состава, а через 40 дней тройки те же.
   До правки третьи садились только на первом трио-капе: 3 полные тройки из 136 пар до 13.02, шестеро топов без состава.
   Запуск: node tools/check-career-trio-year-start.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
localStorage.setItem('fncsdraft_career', JSON.stringify({
  v:1, player:{nick:'Chap', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:6,
    region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, size:2, year:2026, year0:2026, day:'2026-11-01', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'chap'},
  partner:{card:card('M1',80), patience:60, since:'2025-11-01', dev:0},
  partners:[{card:card('M1',80), patience:60, since:'2025-11-01', dev:0},{card:card('M2',80), patience:60, since:'2025-11-01', dev:0}]}));
const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
careerLoad(); careerMigrateSize(); careerNewSeason(); CAREER.career.seasonOver=false;
if(careerSquadSize()!==3) ccFmtYearSet(3);
const look=()=>{
  const cr=CAREER.career; CC_POOLS=null;
  const P=careerPools(), trios=cr.trios||{};
  const keyOf=d=>{ const ks=d.cards.map(c=>hKey(c)).sort(); const t=trios[ks.join('+')]; return t ? ks.concat([t]).sort().join('|') : null; };
  const top=P.duos.slice().sort((a,b)=>(b.ovr||0)-(a.ovr||0)).slice(0,30);
  const inDuo=new Set(); P.duos.forEach(d=>d.cards.forEach(c=>inDuo.add(hKey(c))));
  const thirds=new Set(Object.values(trios));
  const top40=[...P.players].sort((a,b)=>b._ovr-a._ovr).filter((c,j,arr)=>arr.findIndex(x=>hKey(x)===hKey(c))===j).slice(0,40);
  const lonely=top40.filter(c=>!inDuo.has(hKey(c)) && !thirds.has(hKey(c)));
  return {day:cr.day, size:careerSquadSize(), shift:ccYearShift(), topFull:top.map(keyOf).filter(Boolean).length,
    lonely:lonely.map(c=>c.handle+' '+c._ovr), keys:P.duos.map(keyOf).filter(Boolean)};
};
const a=look();
for(let i=0;i<40;i++) careerAdvanceTo(ccAddDays(CAREER.career.day, 1));
const b=look();
const kb=new Set(b.keys); const kept=a.keys.filter(k=>kb.has(k)).length;
return {a:{day:a.day, size:a.size, shift:a.shift, topFull:a.topFull, lonely:a.lonely, full:a.keys.length},
        b:{day:b.day, topFull:b.topFull, lonely:b.lonely, full:b.keys.length}, kept};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tys-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const r=JSON.parse(out); if(r.err){ console.log('FAIL', r.err); process.exit(1); }
const fails=[];
if(r.a.size!==3 || !(r.a.shift>0)) fails.push('не трио-год после 2026-го: size '+r.a.size+' shift '+r.a.shift);
if(r.a.topFull<30) fails.push('первый день: полных троек в топ-30 пар '+r.a.topFull);
if(r.a.lonely.length) fails.push('первый день: без состава в топ-40 '+r.a.lonely.join(', '));
if(r.b.lonely.length) fails.push(r.b.day+': без состава в топ-40 '+r.b.lonely.join(', '));
if(r.kept<r.a.full*0.9) fails.push('через 40 дней осталось троек '+r.kept+' из '+r.a.full);
console.log('трио-год '+r.a.day+': полных троек '+r.a.full+', в топ-30 '+r.a.topFull+'; через 40 дней ('+r.b.day+') те же '+r.kept+' из '+r.a.full);
if(fails.length){ fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK тройки трио-года стоят с первого дня');
