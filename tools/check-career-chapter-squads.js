/* Стыки глав (Notion «fncsdraft 15.10», 16.10): карьера 2020-го, восемь стыков подряд до трио-года
   после 2026-го. Топ-40 сцены в первый день года — все в составах (пара или третий), и рейтинг
   людей с карточкой года расходится с настоящим на 5+ не больше чем у 80 человек.
   Запуск: node tools/check-career-chapter-squads.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const Y0=2020;
localStorage.setItem('fncsdraft_career', JSON.stringify({
  v:1, player:{nick:'Chap', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:6,
    region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, size:3, year:Y0, year0:Y0, day:Y0+'-11-01', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'chap'},
  partner:{card:card('M1',80), patience:60, since:(Y0-1)+'-11-01', dev:0},
  partners:[{card:card('M1',80), patience:60, since:(Y0-1)+'-11-01', dev:0}]}));
const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
careerLoad(); careerMigrateSize();
const out=[];
for(let i=0;i<8;i++){
  careerNewSeason();
  const cr=CAREER.career; CC_POOLS=null;
  const P=careerPools();
  const inDuo=new Set(); P.duos.forEach(d=>d.cards.forEach(c=>inDuo.add(c._k||hKey(c))));
  const thirds=new Set(Object.values(cr.trios||{}));
  const size=careerSquadSize();
  const top=[...P.players].sort((a,b)=>b._ovr-a._ovr).filter((c,j,arr)=>arr.findIndex(x=>(x._k||hKey(x))===(c._k||hKey(c)))===j).slice(0,40);
  const lonely=top.filter(c=>{ const k=c._k||hKey(c); return !inDuo.has(k) && !thirds.has(k); });
  const T=ccRealTargets(ccCalYear());
  const gaps=[]; P.players.forEach(c=>{ const t=T.get(c._k||hKey(c)); if(t!=null) gaps.push(c._ovr-t); });
  const st=a=>a.length?{n:a.length, meanAbs:+(a.reduce((x,y)=>x+Math.abs(y),0)/a.length).toFixed(2), ge3:a.filter(x=>Math.abs(x)>=3).length, ge5:a.filter(x=>Math.abs(x)>=5).length}:null;
  out.push({season:cr.season, year:cr.year, cal:ccCalYear(), shift:ccYearShift(), size, cont:ccContinuity(), duos:P.duos.length, players:P.players.length,
    lonelyTop40:lonely.length, lonely:lonely.slice(0,12).map(c=>c.handle+' '+c._ovr), gap:st(gaps), frac:+ccRealPullFrac().toFixed(2)});
  cr.seasonOver=true;
}
return out;
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'chs-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
let bad=0;
for(const r of res){
  const ok=r.lonelyTop40===0 && (!r.gap || r.gap.ge5<=80);
  if(!ok) bad++;
  console.log((ok?'ok  ':'FAIL')+' сезон '+r.season+' ('+r.cal+(r.shift?'+'+r.shift:'')+', '+(r.size===3?'трио':'дуо')+'): без состава в топ-40 '+r.lonelyTop40+(r.lonely.length?' ['+r.lonely.slice(0,5).join(', ')+']':'')+', рейтинг ±5+ у '+(r.gap?r.gap.ge5:'—'));
}
console.log(bad ? 'FAIL '+bad : 'OK'); process.exit(bad?1:0);
