// Проба «боты играют по таблице»: сессии по 10 игр, черта top-10, с правилом и без. Что меряется:
// элимы и смерти в последней игре против средней игры, и кто прошёл — сила по-прежнему решает.
//   node tools/probe-run.js tools/probes/stakes.js 600000
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:4, photo:null, handle:null},
  career:{season:1, size:2, year:2026, year0:2026, day:'2026-05-06', seasonOver:false, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'stk'},
  partner:{card:card('M1',86), patience:60, since:'2020-01-01', dev:0}, partners:[{card:card('M1',86), patience:60, since:'2020-01-01', dev:0}]}));
careerLoad(); careerMigrateSize(); careerMigrateClock();
const me=careerCard(), mates=careerMates();
CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates); useLandingSet(careerBrSet());
const N=10, CUT=10, RUNS=40, kill=4;
function session(on, seed){
  const field=careerCupField(CAREER.career, drafted, ccTeams(50), 'stk-'+seed, false, CC_FIELD_SHARP.lan).slice(0, 50);
  field.forEach((t,i)=>{ t._uid=i; t.pts=0; t._hist=[]; t._seekMul=undefined; t._seekLast=undefined; t._seekBase=undefined; });
  buildBotLandingAssignment(field, {noBook:true});
  const perGame=[];
  for(let g=0; g<N; g++){
    ccStakesSet(field, 'pts', g, N, CUT);
    if(!on) field.forEach(t=>{ if(t._seekBase!==undefined) t._seekMul=t._seekBase; });   // разметка без силы
    CC_BUS_G=g;
    const order=simulateGameOnMap(field);
    let el=0, early=0;
    order.forEach((t,i)=>{ const e=t._gElims||0; el+=e; t.pts+=pointsForPlace(i+1)+kill*e; (t._hist=t._hist||[]).push({e, p:i+1, k:t._stake||null}); });
    // Сколько выбыло до половины лобби: чем больше, тем раньше и злее дерутся.
    perGame.push({el, stakes: field.filter(t=>t._stake).reduce((a,t)=>(a[t._stake]=(a[t._stake]||0)+1,a),{})});
  }
  const byPts=field.slice().sort((a,b)=>b.pts-a.pts), byPow=field.slice().sort((a,b)=>(b.pow||0)-(a.pow||0));
  const strong=new Set(byPow.slice(0, CUT)), q=byPts.slice(0, CUT);
  const grp={}; field.forEach(t=>{ const h=t._hist, L=h[N-1], k=on ? L.k : (h.__k||null); if(!L) return; const key=L.k||'none'; const g=grp[key]=grp[key]||{n:0,eLast:0,eMid:0,pLast:0,pMid:0}; g.n++; g.eLast+=L.e; g.pLast+=L.p; const m=h.slice(0,N-2); g.eMid+=m.reduce((a,x)=>a+x.e,0)/m.length; g.pMid+=m.reduce((a,x)=>a+x.p,0)/m.length; });
  return {perGame, grp, strongIn: q.filter(t=>strong.has(t)).length, linePts: byPts[CUT-1].pts};
}
const res={};
for(const on of [false, true]){
  let last=0, mid=0, strongIn=0, kinds={}, G={};
  for(let r=0;r<RUNS;r++){
    const s=session(on, r);
    last+=s.perGame[N-1].el; mid+=s.perGame.slice(0, N-2).reduce((a,x)=>a+x.el,0)/(N-2); strongIn+=s.strongIn;
    Object.entries(s.perGame[N-1].stakes||{}).forEach(([k,v])=>kinds[k]=(kinds[k]||0)+v);
    Object.entries(s.grp).forEach(([k,g])=>{ const a=G[k]=G[k]||{n:0,eLast:0,eMid:0,pLast:0,pMid:0}; Object.keys(g).forEach(x=>a[x]+=g[x]); });
  }
  res[on?'on':'off']={lastGameElims:+(last/RUNS).toFixed(1), midGameElims:+(mid/RUNS).toFixed(1), ratio:+((last/mid)).toFixed(3),
    strongOf10:+(strongIn/RUNS).toFixed(2), groups:Object.fromEntries(Object.entries(G).map(([k,a])=>[k,{n:a.n, elimsLast:+(a.eLast/a.n).toFixed(2), elimsMid:+(a.eMid/a.n).toFixed(2), placeLast:+(a.pLast/a.n).toFixed(1), placeMid:+(a.pMid/a.n).toFixed(1)}])), lastGameKinds:Object.fromEntries(Object.entries(kinds).map(([k,v])=>[k,+(v/RUNS).toFixed(1)]))};
}
return res;
