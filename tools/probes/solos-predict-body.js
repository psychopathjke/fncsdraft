const DATA=__DATA__, REGS=__REGS__, N=__N__, DROPS=__DROPS__;
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Pred', age:20, source:'rookie', country:'de', countryPing:15,
  closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:2, year:2026, year0:2026, day:'2026-10-26', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[]}, partner:null}));
careerEntry();
skipAnimation=true; CC_SKIP_RUN=true;
CARD_MODE=true; squadSize=1; drafted=[];
useLandingSet('s42');
// Точка держится весь финал: первая раздача запоминается на команде, дальше та же коробка.
const BBLA=buildBotLandingAssignment;
buildBotLandingAssignment=function(l, o){
  // Настоящая карта дропов (fetch-solos-drops.js): каждый на своей коробке, лут коробки как у точки острова под ней.
  if(l.some(t=>t._realZone)){ clearLandingPow(l); const g=new Map();
    l.forEach(t=>{ const z=t._realZone; t.landingZone=z; t.landingResult=null; t.landingRival=null; applyLandingPow(t, z.points);
      if(!g.has(z)) g.set(z,[]); g.get(z).push(t); });
    return {zoneGroups:g}; }
  if(l.every(t=>t._fixedZone)){ l.forEach(t=>{ t.landingZone=t._fixedZone; }); return; }
  BBLA(l, o); l.forEach(t=>{ t._fixedZone=t.landingZone; }); };
const out={set:ACTIVE_LANDING_SET, zones:ALL_LANDING_ZONES.length, regions:{}, ms:{}};
const yearOf=p=>+String(p.date||'').slice(0,4)||0;
// Сила квалификации: лучшая доля места по этапам (fast из 100, хиты и ласт-ченс из ~100).
const qOf=f=>{ const v=f.res.map(r=>1-(r.r-1)/100); return v.reduce((a,b)=>a+b,0)/v.length + 0.15*Math.max(...v); };
for(const reg of REGS){
  const t0=performance.now();
  const fin=DATA.regions[reg].finalists;
  // Рейтинг за весь 2026 год, как у сцены карьеры (ccSceneRoster: свежая карточка, число — ccSeasonOvr по всем вечерам
  // года), а не лучшая карточка одного турнира (25.10, его «просто весь рейтинг за год учитывай»: Malibuca брался с хита Reload).
  const byK=new Map();
  [reg].concat({NAC:['NAW'], NAW:['NAC']}[reg]||[]).forEach(r=>ccSceneRoster(r).forEach(p=>{ if(!p || !p.handle) return; const k=hKey(p);
    const same=r===reg, prev=byK.get(k);
    if(!prev || (same && !prev.same)) byK.set(k, {p, o:attrsFor(p).ovr, same}); }));
  const rows=fin.map(f=>{ const m=byK.get(f.n.toLowerCase().trim()); return {f, card:m && (m.same || ({NAC:'NAW', NAW:'NAC'}[reg]===m.p.region)) ? m.p : null, ovr:m ? m.o : null, q:qOf(f)}; });
  // Ненайденным — рейтинг по квалификации: линия по найденным этого региона (мало найденных — общий наклон).
  const known=rows.filter(r=>r.card);
  let a=0, b=0;
  if(known.length>=8){ const mx=known.reduce((s,r)=>s+r.q,0)/known.length, my=known.reduce((s,r)=>s+r.ovr,0)/known.length;
    let sxy=0, sxx=0; known.forEach(r=>{ sxy+=(r.q-mx)*(r.ovr-my); sxx+=(r.q-mx)**2; }); b=sxx ? Math.max(4, Math.min(20, sxy/sxx)) : 10; a=my-b*mx; }
  else { b=10; const band={EU:84, NAC:83, NAW:78, BR:79, ASIA:76, ME:76, OCE:76}[reg]||78; a=band-b*0.6; }
  const taken=new Set(), rnd=careerRng(ccHashStr('pred|'+reg));
  rows.forEach(r=>{
    if(r.card){ r.c=r.card; return; }
    const o=Math.round(Math.max(60, Math.min(95, a+b*r.q)));
    const c=careerLadderPlayer(rnd, o, taken, null, null, null, false);
    c.handle=r.f.n; c.region=reg; c._fake=true; r.ovr=o; r.c=c;
  });
  // Регион с настоящей картой дропов: коробки карты становятся точками острова на этот финал.
  useLandingSet('s42');
  const real=DROPS.regions && DROPS.regions[reg];
  const seatOf=new Map();
  if(real && real.boxes && real.boxes.length){
    const base=ALL_LANDING_ZONES.slice();
    const over=(a,b)=>Math.max(0, Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0, Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
    const dist=(a,b)=>Math.hypot(a.x+a.w/2-b.x-b.w/2, a.y+a.h/2-b.y-b.h/2);
    const zs=real.boxes.map(b=>{ const src=base.slice().sort((p,q)=>over(q,b)-over(p,b) || dist(p,b)-dist(q,b))[0];
      const z={...src, x:b.x, y:b.y, w:b.w, h:b.h, _real:true}; b.ids.forEach(id=>seatOf.set(id, z)); return z; });
    // Кого на карте нет (точку не отметили) — один, на точку острова, меньше всего задетую чужими коробками.
    // Не в «самую пустую коробку»: там уже кто-то стоит, и выходил выдуманный контест (OCE: 7 без точки → 46 делят вместо 32).
    const freeBase=base.slice().sort((p,q)=>zs.reduce((s,z)=>s+over(p,z),0)-zs.reduce((s,z)=>s+over(q,z),0));
    rows.forEach(r=>{ if(seatOf.has(r.f.id)) return; const src=freeBase.shift(); if(!src) return;
      const z={...src, _real:true}; zs.push(z); seatOf.set(r.f.id, z); });
    ALL_LANDING_ZONES.length=0; zs.forEach(z=>ALL_LANDING_ZONES.push(z));
    out.realRects=out.realRects||{}; out.realRects[reg]={day:real.day, updated:real.updated, rects:zs.map(z=>({x:z.x,y:z.y,w:z.w,h:z.h,loot:z.loot,chests:z.chests}))};
  }
  const stat=new Map(rows.map(r=>[r.f.id, {mates:{}, n:r.f.n, c:r.f.c, via:r.f.via, ovr:r.ovr, real:!!r.card, wins:0, top3:0, top10:0, places:0, pts:0, vr:0, elims:0, zones:{}, contest:0, games:0}]));
  /* ФОРМА ДНЯ (27.10, проверка прогноза против итогов): сила игрока в каждом прогоне сдвигается на N(0, SIG) — в
     настоящем финале кто-то в ударе, кто-то нет. Без этого фаворит был сильным в каждом из 200 прогонов, и модель
     давала ему 63% на топ-10 при 25% по факту. SIG подобран по пяти доигранным регионам (см. run-solos-predict.js). */
  const SIG=__SIG__;
  const gauss=()=>{ let u=0, v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  for(let run=0; run<N; run++){
    const field=rows.map(r=>{ const t=careerTeam([r.c]); t.name=r.f.n; t._pid=r.f.id; if(SIG) t.pow=Math.round(t.pow+SIG*gauss()); if(seatOf.has(r.f.id)) t._realZone=seatOf.get(r.f.id); return t; });
    await simulateGamesLive(field, 12, victoryR1Points, 4, 'stage', 0, null, null,
      {lobbySize:100, stageName:'pred', mapReplay:false, stopOnYourDeath:false,
       dropEachGame:async (g, room)=>{ const l=room||field;
         buildBotLandingAssignment(l, {noBook:true});
         const per={}; l.forEach(t=>{ const z=t.landingZone; const k=z ? String(ALL_LANDING_ZONES.indexOf(z)) : ''; per[k]=(per[k]||0)+1; });
         l.forEach(t=>{ const s=stat.get(t._pid); const z=t.landingZone; const k=z ? String(ALL_LANDING_ZONES.indexOf(z)) : '';
           s.zones[k]=(s.zones[k]||0)+1; if(per[k]>1) s.contest++; s.games++;
           if(g===1) l.forEach(u=>{ if(u!==t && u.landingZone===t.landingZone) s.mates[u.name]=(s.mates[u.name]||0)+1; }); });
         return null; }});
    const ord=field.slice().sort((x,y)=>(y.stagePts||0)-(x.stagePts||0));
    ord.forEach((t,i)=>{ const s=stat.get(t._pid); const pl=i+1; s.places+=pl; s.pts+=t.stagePts||0; s.vr+=t.wins||0; s.elims+=t.stageElims||0;
      if(pl===1) s.wins++; if(pl<=3) s.top3++; if(pl<=10) s.top10++; });
  }
  out.regions[reg]=[...stat.values()].map(s=>{ const z=Object.entries(s.zones).sort((x,y)=>y[1]-x[1])[0];
    return {n:s.n, c:s.c, via:s.via, ovr:s.ovr, real:s.real, win:s.wins/N, top3:s.top3/N, top10:s.top10/N, avgPlace:+(s.places/N).toFixed(1), avgPts:+(s.pts/N).toFixed(1), vr:+(s.vr/N).toFixed(2), elims:+(s.elims/N).toFixed(1),
      drop:z ? z[0] : '', dropShare:z ? +(z[1]/s.games).toFixed(2) : 0, contest:s.games ? +(s.contest/s.games).toFixed(2) : 0, mates:Object.entries(s.mates).sort((x,y)=>y[1]-x[1]).slice(0,3).map(m=>[m[0], +(m[1]/N).toFixed(2)])}; })
    .sort((x,y)=>y.win-x.win || x.avgPlace-y.avgPlace);
  out.ms[reg]=Math.round(performance.now()-t0);
}
useLandingSet('s42');
out.zoneRects=ALL_LANDING_ZONES.map(z=>({x:z.x,y:z.y,w:z.w,h:z.h,loot:z.loot,chests:z.chests}));
return out;
