/*@@PART js/career/life-training-formats.js@@*/
/* ЖИЗНЬ МЕЖДУ ТУРНИРАМИ — ранкед, травмы, поездки на ЛАН, скандалы, икон-скин, Noble.

   Всё хранится в cr.life; тик — раз в день (ccLifeTick из careerAdvanceBody), запреты —
   в careerCanPlayKindOn через ccLifeWhy. Числа — оценка режима, кроме того, что названо
   источником: серверы и формат Noble — nobleprac.com (сессия = одна игра на 90–100 человек,
   уровни Practice / Division 3–1 / Pro Scrims), ранги — лестница Ranked Epic. */
function ccLife(){ const cr=CAREER.career; if(!cr.life) cr.life={}; return cr.life; }
function ccLifeRng(tag){ return careerRng(ccHashStr('life|'+tag+'|'+(CAREER.player.nick||'')+'|'+careerToday())); }

// ---- Травм нет: запястье от выгорания закрывало FNCS-вечера подряд, механику сняли.
// Функция осталась, чтобы вызовы не ломались.
function ccLifeHurt(day){ return null; }

// ---- Скандалы: жалоба → разбор → оправдан / штраф / бан открытых турниров.
const CC_BAN_KINDS=['cup','final','victory','solo','eval','reload'];
// Своего бана нет с 5.10 (см. ccLifeTick): старый из сейва вечер не закрывает.
function ccLifeBan(day){ return null; }

function ccLifeWhy(day, kind){
  if(ccLifeHurt(day)) return 'lfWhyHurt';
  if(ccLifeBan(day) && CC_BAN_KINDS.indexOf(kind)>=0) return 'lfWhyBan';
  return null;
}

// ---- Noble Pro Scrims: сессия — одна игра, таблица по игрокам, сервер по уровню.
/* Сервер практики региона (19.11, его слово: «pc customs это нобл на еу, у других регионов свои кастомки»).
   Проверено 19.11.2026: EU — Noble Practice (nobleprac.com, «EU's Tier 1 Fortnite Practice Server»); NAC, NAW, OCE —
   Vital Scrims (профиль @VitalScrims: «NAC | NAW | ME | OCE», 700K+); ME — Vital Scrims Middle East (@vitalscrimsme);
   BR — Major Scrims (@MajorScrims_, «Fortnite Server Practice Brasil»); ASIA — LYNX Pro Scrim (@LYNX_e_sports, Япония,
   раз в две недели по четвергам; одного большого сервера на регион в X не нашлось). */
const CC_PRAC_SRV={EU:'Noble Practice', NAC:'Vital Scrims', NAW:'Vital Scrims', OCE:'Vital Scrims', ME:'Vital Scrims Middle East',
                   BR:'Major Scrims', ASIA:'LYNX Pro Scrim'};
function ccPracSrv(){ return CC_PRAC_SRV[ccCareerRegion()]||'Vital Scrims'; }
/* Лестница Noble (nobleprac.com, 2026): Noble X — только tier 1 по приглашению; Pro Scrims — топ-1000 Tracker Build PR;
   Division 1 — топ-500…2500 PR; Division 2 — FNCS Division 3 или 1000 PR; Division 3 и Solos Closed — по местам на
   открытых; Practice Scrims и Division 0 — всем. У нас PR — таблица региона карьеры, поэтому пороги те же, что были
   откалиброваны раньше (Pro — Д1 и топ-100 или сила от 88), а Д1/Д2 FNCS ведут в Division 1, Д3 — в Division 2. */
const CC_NOBLE_LADDER=[
  {name:'Noble X',              avg:90, ok:(pr,cr,o)=>o>=93 || (cr.division===1 && pr && pr<=10)},
  {name:'Noble Pro Scrims',     avg:88, ok:(pr,cr,o)=>(cr.division===1 && (pr && pr<=100 || o>=88)) || o>=92},
  {name:'Noble Division 1',     avg:84, ok:(pr,cr,o)=>!ccNoDivisions() && cr.division<=2},
  {name:'Noble Division 2',     avg:80, ok:(pr,cr,o)=>!ccNoDivisions() && cr.division<=3},
  {name:'Noble Division 3',     avg:77, ok:(pr,cr,o)=>o>=80},
  {name:'Noble Solos Closed',   avg:75, ok:(pr,cr,o)=>o>=76},
  {name:'Noble Practice Scrims',avg:72, ok:()=>true}];
function ccNobleTier(){
  const cr=CAREER.career, pr=(typeof careerPrPlace==='function') ? careerPrPlace() : null, o=(CAREER.player && CAREER.player.ovr)||70;
  const i=CC_NOBLE_LADDER.findIndex(t=>t.ok(pr, cr, o));
  // Инвайт за топ-5 сессии (CC_NOBLE_PROMO) держится: на ступень ниже уже не опускает.
  return (cr.nobleInv!=null && cr.nobleInv<i) ? cr.nobleInv : i;
}
function ccNobleServer(){
  const t=CC_NOBLE_LADDER[ccNobleTier()];
  // Вне EU — свой сервер региона; уровень комнаты тот же, по силе и дивизиону.
  return ccCareerRegion()==='EU' ? {name:t.name, avg:t.avg} : {name:ccPracSrv(), avg:t.avg};
}
// Сессия Noble поднимает форму: игра на сотню про — та же практика вечера, что и кап. Чем выше место, тем больше.
function ccNobleForm(place, of){ return place<=Math.ceil(of*0.1) ? 0.4 : place<=Math.ceil(of*0.35) ? 0.2 : 0.1; }
function ccNobleRun(){
  const lf=ccLife(), sv=ccNobleServer(), rng=ccLifeRng('noble');
  const o=(CAREER.player && CAREER.player.ovr)||70, of=90+Math.floor(rng()*9);
  const g=()=>{ let s=0; for(let i=0;i<6;i++) s+=rng(); return (s-3)/Math.sqrt(0.5); };
  const z=(o+careerForm()+g()*4-sv.avg)/5.5;
  const pct=1/(1+Math.exp(-1.7*z));
  const place=Math.max(1, Math.min(of, Math.round((1-pct)*(of-1))+1));
  const kills=Math.max(0, Math.round(pct*6+g()*1.5));
  const pts=victoryR1Points(place)+kills*2;
  const wk=ccMonthKey(careerToday())+'|'+Math.floor(((+careerToday().slice(8,10))-1)/7);
  if(!lf.noble || lf.noble.wk!==wk) lf.noble={wk, server:sv.name, me:0, n:0, rows:ccNobleRivals(sv, wk)};
  lf.noble.me+=pts; lf.noble.n++; lf.noble.server=sv.name;
  // Соперники сервера играют ту же сессию.
  Object.keys(lf.noble.rows).forEach(h=>{ const r=lf.noble.rows[h]; r.p+=Math.max(0, Math.round(victoryR1Points(1+Math.floor(rng()*of))+rng()*8)); });
  const fg=ccNobleForm(place, of), cr=CAREER.career;
  cr.form=clamp((cr.form||0)+fg, -CC_FORM_MAX, CC_FORM_MAX);
  careerNews(place<=10?'good':'flat', 'lfNewsNoble', [sv.name, place, of, kills, pts, fg]);
  return {server:sv.name, place, of, kills, pts, form:fg};
}
function ccNobleRivals(sv, wk){
  const reg=ccCareerRegion(), rows={};
  const pool=PLAYERS.filter(p=>p.region===reg && (p._ovr||p.rating||0)>=sv.avg-4).slice(0, 400);
  const rng=careerRng(ccHashStr('noblewk|'+wk+'|'+reg));
  for(let i=0;i<12 && pool.length;i++){ const p=pool.splice(Math.floor(rng()*pool.length),1)[0]; if(p && p.handle && !rows[p.handle]) rows[p.handle]={p:0}; }
  return rows;
}

/* ---- РАНКЕД И АРЕНА. Занятие trSur — это сессия настоящих матчей: место, киллы, кто выбил, кто был в лобби.
   До 17.05.2023 (v24.40) — Арена с Hype, дальше — Ranked. Пороги, очки и автобус Арены — вики Fortnite по эпохам
   (tools/measured/arena-ranked-history.json). Ranked: Bronze–Diamond по три ступени, Elite, Champion, Unreal;
   Unreal не падает, у него место в таблице; с v26.00 (25.08.2023) ранг каждый сезон сбрасывается и первый матч
   сезона — квалификационный. Сколько процентов даёт матч, Epic не публикует — таблица мест, цена входа по рангу и
   сила лобби — ОЦЕНКА режима. Кэш-капы ранг не спрашивает (замков нет по его слову 30.09). */
const CC_ARENA_OLD=[0,250,500,1000,1500,2500,4000,6000,12000,16000];
const CC_ARENA_NEW=[0,400,800,1200,2000,3000,5000,7500,10000,15000];
const CC_ARENA_CHAMP=7;   // индекс дивизиона 8
const CC_ARENA_ERAS=[
  {id:'s8', from:'2019-03-27', upd:'v8.20', guess:true, thr:CC_ARENA_OLD, fare:[0,0,0,10,20,30,30,60,60,60], pts:{
    1:{teams:100, rows:[[1,60],[5,30],[15,30],[25,60]], elim:20},
    2:{teams:50,  rows:[[1,60],[3,30],[7,30],[12,60]], elim:10},
    3:{teams:33,  rows:[[1,60],[2,30],[4,30],[8,60]],  elim:7}}},
  {id:'x', from:'2019-08-01', upd:'v10.00', reset:true, thr:CC_ARENA_OLD, fare:[0,0,0,10,20,30,30,60,60,60], pts:null},
  {id:'v18', from:'2021-09-28', upd:'v18.10', reset:true, thr:CC_ARENA_NEW, fare:[0,0,0,10,20,30,50,60,70,80], pts:{
    1:{teams:100, rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[20,15],[25,15],[30,10],[40,10],[50,10]], elim:[20,20,20,15,15,15,15,10,10,10], lastOff:true},
    2:{teams:50,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[12,15],[15,15],[17,10],[20,10],[25,10]], elim:[20,20,20,10,10,10,10,10,10,10], lastOff:true},
    3:{teams:33,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[6,10],[7,15],[8,15],[9,10],[10,10],[15,10]], elim:[15,15,15,15,10,10,10,10,10,10], lastOff:true}}},
  {id:'v21', from:'2022-06-21', upd:'v21.10', thr:CC_ARENA_NEW, fare:[0,0,0,0,30,40,50,60,70,70], pts:{
    1:{teams:100, rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[20,15],[25,15],[30,10],[40,10],[50,10]], elim:[15,15,15,10,10,10,10,5,5,5], lastOff:true},
    2:{teams:50,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[12,15],[15,15],[17,10],[20,10],[25,10]], elim:[15,15,15,5,5,5,5,5,5,5], lastOff:true},
    3:{teams:33,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[6,10],[7,15],[8,15],[9,10],[10,10],[15,10]], elim:[10,10,10,10,5,5,5,5,5,5], lastOff:true}}}
];
CC_ARENA_ERAS[1].pts=CC_ARENA_ERAS[0].pts;   // Season X — те же числа (у s8 они взяты с неё)
const CC_RANKS=['Bronze I','Bronze II','Bronze III','Silver I','Silver II','Silver III','Gold I','Gold II','Gold III',
  'Platinum I','Platinum II','Platinum III','Diamond I','Diamond II','Diamond III','Elite','Champion','Unreal'];
const CC_RANK_UNREAL=17, CC_RANK_RESET_FROM='2023-08-25', CC_RANK_SPLIT_FROM='2026-04-17';
const CC_RK_GAMES=3;   // матчей за сессию — оценка режима
// Сила лобби по рангу и по дивизиону Арены (рейтинг карточки) — оценка: про 90+ живут в Unreal/Champion League.
const CC_RK_LOBBY=[52,54,56,58,60,62,64,66,68,70,72,74,77,79,81,86,90,93];
const CC_AR_LOBBY=[54,57,60,63,66,69,72,76,80,84];
// Цена входа (вычет за матч) по тиру ранга и множитель прироста: чем выше, тем дороже ошибка — оценка.
const CC_RK_COST=[0,0,0,0,0,0,4,4,4,8,8,8,12,12,12,18,24,0];
const CC_RK_UNREAL_N=6000, CC_RK_UNREAL_K=420;
function ccRkTier(i){ return ['bronze','bronze','bronze','silver','silver','silver','gold','gold','gold','plat','plat','plat','dia','dia','dia','elite','champ','unreal'][i]||'bronze'; }
function ccArenaEra(day){ day=day||careerToday(); let e=CC_ARENA_ERAS[0]; CC_ARENA_ERAS.forEach(x=>{ if(day>=x.from) e=x; }); return e; }
function ccArenaOn(day){ return (day||careerToday())<CC_RANKED_FROM; }
function ccArenaLeague(i){ const t=L().rkLeagues||['Open','Contender','Champion']; return i>=CC_ARENA_CHAMP ? t[2] : i>=4 ? t[1] : t[0]; }
function ccArenaDivOf(h, day){ const t=ccArenaEra(day).thr; let i=0; t.forEach((v,j)=>{ if(h>=v) i=j; }); return i; }
function ccArenaName(i){ return ccArenaLeague(i)+' · '+(L().rkDiv||'div.')+' '+(i+1); }
function ccRkSize(){ return Math.min(3, Math.max(1, careerSquadSize()||2)); }
function ccRkTeams(){ return {1:100, 2:50, 3:33}[ccRkSize()]; }
// Ключ сезона: после 2026-го даты повторяются, поэтому с годом карьеры.
function ccRkSeasonKey(day){ const s=careerFncsSeason(day||careerToday()); return s ? (s.id||s.from)+'|'+(CAREER.career.year||'') : null; }
function ccRk(){
  const lf=ccLife();
  if(!lf.rk || lf.rk.v!==1) lf.rk={v:1, p:null, unr:0, hype:null, era:null, sid:null, peak:{}, last:null, prev:null};
  const rk=lf.rk, day=careerToday();
  if(ccArenaOn(day)){
    const era=ccArenaEra(day);
    if(rk.hype==null) rk.hype=0;
    if(rk.era!==era.id){ if(rk.era!=null && era.reset){ rk.hype=0; careerNews('flat', 'rkNewsArenaReset', [era.upd]); } rk.era=era.id; }
  } else {
    // Сброс сезона с v26.00: ранг уходит, первый матч сезона ставит заново от прошлого ранга.
    const sid=ccRkSeasonKey(day);
    if(sid && rk.sid!==sid){
      if(rk.sid!=null && day>=CC_RANK_RESET_FROM && rk.p!=null){ rk.prev=ccRkIdx(rk.p); rk.p=null; rk.unr=0; careerNews('flat', 'rkNewsReset', []); }
      rk.sid=sid;
    }
  }
  return rk;
}
function ccRkIdx(p){ return Math.min(CC_RANK_UNREAL, Math.floor((p||0)/100)); }
function ccRkName(i, p){
  if(i==null) return L().rkUnranked;
  if((i===15 || i===16) && careerToday()>=CC_RANK_SPLIT_FROM) return ccRkTierName(i)+' '+['I','II','III'][Math.min(2, Math.floor(((p||0)%100)/34))];
  return ccRkLabel(i);
}
// Название ранга на языке игрока (как в русском/французском/... клиенте Fortnite); CC_RANKS остаётся ключом иконок.
function ccRkTierIdx(i){ return i<15 ? Math.floor(i/3) : i-10; }
function ccRkTierName(i){ const t=L().rkTiers; return t ? t[ccRkTierIdx(i)] : CC_RANKS[i].replace(/ I+$/, ''); }
function ccRkLabel(i){ return ccRkTierName(i)+(i<15 ? ' '+['I','II','III'][i%3] : ''); }
function ccRkUnrealPos(unr){ return Math.max(1, Math.round(CC_RK_UNREAL_N*Math.exp(-(unr||0)/CC_RK_UNREAL_K))); }
// Про своего региона на верху таблицы Unreal / Champion League: сильнейшие по рейтингу, по полтора места на человека.
function ccRkLadder(){
  const reg=ccCareerRegion(), key=reg+'|'+(CAREER.career.year||'');
  if(ccRkLadder.c && ccRkLadder.k===key) return ccRkLadder.c;
  const seen=new Set(), me=hKey({handle:CAREER.player.handle||CAREER.player.nick||''});
  const pool=PLAYERS.filter(p=>p && p.handle && p.region===reg).sort((a,b)=>(b._ovr||b.rating||0)-(a._ovr||a.rating||0))
    .filter(p=>{ const k=hKey(p); if(k===me || seen.has(k)) return false; seen.add(k); return true; }).slice(0, 100);
  ccRkLadder.k=key;
  return ccRkLadder.c=pool.map((p,i)=>({h:p.handle, nat:p.nat, pos:Math.round(1+i*1.5)}));
}
function ccRkNear(pos){
  if(!(pos<=160)) return null;
  const lad=ccRkLadder(); let up=null, down=null;
  lad.forEach(r=>{ if(r.pos<=pos && (!up || r.pos>up.pos)) up=r; if(r.pos>pos && (!down || r.pos<down.pos)) down=r; });
  return {up, down};
}
// Игроки сцены под силу лобби — из них «кто выбил» и «кто был в лобби».
function ccRkLobbyPool(lvl){
  const reg=ccCareerRegion(), k=reg+'|'+lvl, c=ccRkLobbyPool.c||(ccRkLobbyPool.c=new Map());
  if(!c.has(k)) c.set(k, PLAYERS.filter(p=>p && p.handle && p.region===reg && Math.abs((p._ovr||p.rating||0)-lvl)<=4));
  return c.get(k);
}
function ccRkMatch(rnd, lvl, teams){
  const g=()=>{ let s=0; for(let i=0;i<6;i++) s+=rnd(); return (s-3)/Math.sqrt(0.5); };
  const six=CAREER.player.attrs||{}, o=ccMyShownOvr();
  const z=(o+careerForm()+g()*4-lvl)/5.5, pct=1/(1+Math.exp(-1.7*z));
  const place=clamp(Math.round((1-pct)*(teams-1)+g()*teams*0.04)+1, 1, teams);
  const kills=Math.max(0, Math.round(pct*4.5+g()*1.3+((six.aim||70)-70)/15));
  const pool=ccRkLobbyPool(lvl), pick=()=>pool.length ? pool[Math.floor(rnd()*pool.length)] : null;
  const by=place>1 ? pick() : null;
  const stars=[]; for(let i=0;i<8 && stars.length<2;i++){ const p=pick(); if(p && (!by || p.handle!==by.handle) && !stars.some(s=>s.h===p.handle)) stars.push({h:p.handle, nat:p.nat}); }
  return {place, of:teams, kills, lvl, by:by ? {h:by.handle, nat:by.nat} : null, stars};
}
// Ranked: проценты за место (доля лобби) и за киллы, множитель по рангу, вычет входа — ОЦЕНКА.
function ccRkGain(i, place, of, kills){
  const f=place/of;
  const pg=place===1 ? 50 : f<=0.03 ? 32 : f<=0.05 ? 26 : f<=0.10 ? 20 : f<=0.15 ? 15 : f<=0.25 ? 10 : f<=0.5 ? 4 : 0;
  const kg=6*(1+(1-f));
  const m=1.25-0.95*Math.min(16, i)/16;
  return Math.round((pg+kills*kg)*m)-(CC_RK_COST[i]||0);
}
function ccArenaPts(div, place, kills, day){
  const era=ccArenaEra(day), t=era.pts[ccRkSize()];
  const pl=t.rows.reduce((s,r,j)=>s+((place<=r[0] && (!t.lastOff || j<t.rows.length-1 || div<CC_ARENA_CHAMP)) ? r[1] : 0), 0);
  const el=Array.isArray(t.elim) ? t.elim[div] : t.elim;
  return pl+kills*el-(era.fare[div]||0);
}
function ccRkSession(){
  const rk=ccRk(), rnd=ccLifeRng('ranked|'+(ccRk().n||0)), day=careerToday(), arena=ccArenaOn(day);
  const games=[], sess={day, arena, games};
  if(arena){
    const teams=ccArenaEra(day).pts[ccRkSize()].teams, h0=rk.hype, d0=ccArenaDivOf(h0, day);
    for(let n=0;n<CC_RK_GAMES;n++){
      const div=ccArenaDivOf(rk.hype, day), m=ccRkMatch(rnd, CC_AR_LOBBY[div], teams);
      m.div=div; m.fare=ccArenaEra(day).fare[div]||0; m.d=ccArenaPts(div, m.place, m.kills, day);
      m.h0=rk.hype; rk.hype=Math.max(0, rk.hype+m.d); m.h1=rk.hype; games.push(m);
    }
    sess.from=h0; sess.to=rk.hype;
    const d1=ccArenaDivOf(rk.hype, day);
    if(d1>d0) careerNews('good', d1>=CC_ARENA_CHAMP && d0<CC_ARENA_CHAMP ? 'rkNewsChamp' : 'rkNewsArenaUp', [ccArenaName(d1)]);
    const k='a|'+ccArenaEra(day).id+'|'+(CAREER.career.year||'');
    rk.peak[k]=Math.max(rk.peak[k]||0, rk.hype);
  } else {
    const teams=ccRkTeams(), i0=rk.p==null ? null : ccRkIdx(rk.p), u0=rk.unr||0;
    for(let n=0;n<CC_RK_GAMES;n++){
      if(rk.p==null){
        // Квалификационный матч: от прошлого ранга (минус две ступени) или от рейтинга, не выше Diamond III.
        const o=ccMyShownOvr(), byOvr=clamp(Math.round((o-58)/2.2), 0, 14);
        const lvl=CC_RK_LOBBY[byOvr], m=ccRkMatch(rnd, lvl, teams);
        const perf=m.place/m.of<=0.1 ? 1 : m.place/m.of>0.5 ? -1 : 0;
        const base=rk.prev!=null ? Math.min(rk.prev-2, byOvr+1) : byOvr;
        const idx=clamp(base+perf, 0, 14);
        rk.p=idx*100+20; m.place0=true; m.d=null; m.rank=idx; m.p0=null; m.p1=rk.p; games.push(m); continue;
      }
      const i=ccRkIdx(rk.p), m=ccRkMatch(rnd, CC_RK_LOBBY[i], teams);
      m.p0=rk.p; m.u0=rk.unr||0;
      if(i>=CC_RANK_UNREAL){
        const pg=ccRkGain(16, m.place, m.of, m.kills)+(CC_RK_COST[16]||0)-10;
        m.d=null; m.u=pg; rk.unr=Math.max(0, (rk.unr||0)+pg);
      } else {
        m.d=ccRkGain(i, m.place, m.of, m.kills);
        rk.p=clamp(rk.p+m.d, 0, CC_RANK_UNREAL*100);
      }
      m.rank=ccRkIdx(rk.p); m.p1=rk.p; m.u1=rk.unr||0; games.push(m);
    }
    const i1=ccRkIdx(rk.p);
    sess.from=i0; sess.to=i1; sess.u0=u0; sess.u1=rk.unr||0;
    if(i0!=null && i1>i0){
      careerNews('good', i1>=CC_RANK_UNREAL ? 'rkNewsUnreal' : 'rkNewsUp', [ccRkName(i1, rk.p)]);
      if(i1>=15) careerReachAdd(Math.round(4000*(i1-14)));
    } else if(i0!=null && i1<i0) careerNews('bad', 'rkNewsDown', [ccRkName(i1, rk.p)]);
    else if(i0==null) careerNews('flat', 'rkNewsPlaced', [ccRkName(i1, rk.p)]);
    if(i1>=CC_RANK_UNREAL){
      const p0=ccRkUnrealPos(u0), p1=ccRkUnrealPos(rk.unr);
      if(p1<=100 && p0>100){ careerNews('good', 'rkNewsTop100', [p1]); careerReachAdd(15000); }
      if(p1===1 && p0>1){ careerNews('good', 'rkNewsTop1', []); careerReachAdd(40000); }
    }
    const k='r|'+(rk.sid||'');
    rk.peak[k]=Math.max(rk.peak[k]||0, (rk.p||0)+(i1>=CC_RANK_UNREAL ? Math.min(99, Math.round((rk.unr||0)/40)) : 0));
  }
  // Сессия даёт и форму: хорошая — плюс, провал — минус, по-малому.
  const good=games.filter(m=>m.place/m.of<=0.1).length, bad=games.filter(m=>m.place/m.of>0.6).length;
  const fg=good>=2 ? 0.3 : bad>=2 ? -0.2 : 0;
  if(fg){ const cr=CAREER.career; cr.form=clamp((cr.form||0)+fg, -CC_FORM_MAX, CC_FORM_MAX); }
  sess.form=fg;
  rk.last=sess;
  rk.n=(rk.n||0)+games.length;
  return sess;
}
// ---- Плитка во вкладке «Тренировка».
function ccRkIconSrc(i){ return 'items/ranks/'+(i==null ? 'unranked' : CC_RANKS[i].toLowerCase().replace(/ /g, '-'))+'.webp'; }
function ccRkIcon(i, cls){ return '<img class="rk-ic'+(cls ? ' '+cls : '')+'" src="'+ccRkIconSrc(i)+'" alt="" aria-hidden="true" width="160" height="160" decoding="async">'; }
function ccRkBadge(i){ return ccRkIcon(i); }
// Лесенка по тирам (8 значков, на телефоне 18 слишком мелкие): свой тир со своей ступенью и обведён.
const CC_RK_TIERS=[[0,2],[3,5],[6,8],[9,11],[12,14],[15,15],[16,16],[17,17]];
function ccRkLadderHTML(cur){
  return '<div class="rk-steps" role="img" aria-label="'+esc(ccRkName(cur))+'">'+CC_RK_TIERS.map(([a,b])=>{
    const on=cur>=a && cur<=b, i=on ? cur : a, n=ccRkTierName(a);
    return '<span class="rk-step'+(on ? ' on' : cur>b ? ' past' : '')+'" title="'+esc(n)+'">'+ccRkIcon(i)+'<small>'+esc(n)+'</small></span>';
  }).join('')+'</div>';
}
function ccRkTileHTML(){
  if(!CAREER || !CAREER.career) return '';
  const T=L(), rk=ccRk(), day=careerToday(), arena=ccArenaOn(day), last=rk.last;
  let head='', bar='', side='';
  if(arena){
    const div=ccArenaDivOf(rk.hype, day), thr=ccArenaEra(day).thr, next=thr[div+1];
    head='<span class="rk-badge rk-a'+(div>=CC_ARENA_CHAMP ? ' rk-champ' : div>=4 ? ' rk-gold' : ' rk-silver')+'" aria-hidden="true"><i>'+(div+1)+'</i></span>'+
      '<div class="rk-nm"><b>'+esc(ccArenaName(div))+'</b><small>'+ccNum(rk.hype)+' Hype · '+esc(T.rkRules(ccArenaEra(day).upd))+'</small></div>';
    if(next!=null){ const pc=Math.max(0, Math.min(100, (rk.hype-thr[div])/(next-thr[div])*100));
      bar='<u class="rk-bar"><s style="width:'+pc.toFixed(1)+'%"></s></u><div class="rk-hint">'+esc(T.rkToNext(ccNum(next-rk.hype)+' Hype', ccArenaName(div+1)))+'</div>'; }
    else { const pos=Math.max(1, Math.round(4000*Math.exp(-(rk.hype-thr[9])/2500)));
      side='<div class="rk-pos"><b>#'+ccNum(pos)+'</b><span>'+esc(T.rkHypeBoard)+'</span></div>'+ccRkNearHTML(pos); }
  } else if(rk.p==null){
    head=ccRkIcon(null)+'<div class="rk-nm"><b>'+esc(T.rkUnranked)+'</b><small>'+esc(rk.prev!=null ? T.rkPlaceFrom(ccRkName(rk.prev)) : T.rkPlaceFirst)+'</small></div>';
  } else {
    const i=ccRkIdx(rk.p);
    head=ccRkBadge(i)+'<div class="rk-nm"><b>'+esc(ccRkName(i, rk.p))+'</b><small>'+esc(T.rkSeasonLine(rk.n||0))+'</small></div>';
    if(i<CC_RANK_UNREAL){ const pc=rk.p%100;
      bar='<u class="rk-bar rk-'+ccRkTier(i)+'"><s style="width:'+pc+'%"></s></u><div class="rk-hint">'+esc(T.rkToNext(pc+'%', ccRkName(i+1)))+(CC_RK_COST[i] ? ' · '+esc(T.rkCost(CC_RK_COST[i])) : '')+'</div>'; }
    else { const pos=ccRkUnrealPos(rk.unr); side='<div class="rk-pos"><b>#'+ccNum(pos)+'</b><span>'+esc(T.rkUnrealBoard)+'</span></div>'+ccRkNearHTML(pos); }
    bar+=ccRkLadderHTML(i);
  }
  const flag=n=>(n && typeof flagImg==='function') ? flagImg(n, 14) : '';
  let games='';
  if(last && last.games && last.games.length){
    games='<div class="rk-last"><em>'+esc(T.rkLast(ccFmtDay(last.day)))+(last.form ? ' · '+esc(T.rkForm(last.form)) : '')+'</em>'+last.games.map((m,n)=>{
      const d=m.place0 ? '<i class="rk-pl">'+esc(T.rkPlaced(ccRkName(m.rank)))+'</i>'
        : m.u!=null ? '<i class="'+(m.u>=0?'up':'down')+'">'+(m.u>=0?'+':'')+m.u+' '+esc(T.rkUnrealPts)+'</i>'
        : '<i class="'+(m.d>=0?'up':'down')+'">'+(m.d>=0?'+':'')+m.d+(last.arena ? ' Hype' : '%')+'</i>';
      const who=m.place===1 ? '<span class="rk-vr">'+esc(T.rkVictory)+'</span>' : m.by ? '<span>'+esc(T.rkBy)+' '+flag(m.by.nat)+esc(m.by.h)+'</span>' : '';
      const lob=m.stars && m.stars.length ? '<small>'+esc(T.rkLobby)+' '+m.stars.map(s=>flag(s.nat)+esc(s.h)).join(', ')+'</small>' : '';
      return '<div class="rk-m"><b>#'+m.place+'<small>/'+m.of+'</small></b><div class="rk-mw">'+who+lob+'</div><span class="rk-k">'+m.kills+' '+esc(T.rkKills)+'</span>'+d+(!last.arena && m.rank!=null ? ccRkIcon(m.rank, 'sm') : '')+'</div>';
    }).join('')+'</div>';
  }
  // Пики прошлых сезонов.
  const peaks=Object.keys(rk.peak||{}).filter(k=>k[0]==='r' && k!=='r|'+(rk.sid||'')).slice(-4).map(k=>{
    const v=rk.peak[k], i=ccRkIdx(v); return '<span class="rk-peak">'+ccRkIcon(i, 'sm')+esc(String(k.split('|')[1]||''))+' · '+esc(ccRkLabel(i))+'</span>'; }).join('');
  const why=(typeof ccArenaPlayWhy==='function') ? ccArenaPlayWhy() : '';
  const act=ccActById('trSur');
  return '<div class="ch-tile rk-tile"><h4>'+esc(arena ? T.rkArenaTitle : T.rkTitle)+'</h4>'+
    '<div class="rk-head">'+head+'</div>'+bar+side+
    '<button class="hero-btn hero-btn-go rk-play" '+(why ? 'disabled' : 'onclick="ccRkPlay()"')+'>'+esc(T.rkPlay(CC_RK_GAMES))+' · '+(act ? act.energy : 30)+(T.ccEnergyMark||'')+'</button>'+
    (why ? '<div class="rk-hint">'+esc(why)+'</div>' : '')+games+
    (peaks ? '<div class="rk-peaks"><em>'+esc(T.rkPeaks)+'</em>'+peaks+'</div>' : '')+'</div>';
}
/* Быстрый прогон сессии: матчи уже сыграны и сохранены (ccRkSession), окно только показывает их по шагам:
   автобус, высадка, круги, лента киллов, место, полоска ранга. «Пропустить» сразу ставит итог. */
function ccRkPlay(){
  const n0=ccRk().n||0;
  careerPickDay('trSur');
  const rk=ccRk();
  if((rk.n||0)!==n0 && rk.last && rk.last.games && rk.last.games.length) ccRkSimOpen(rk.last);
}
function ccRkSimOpen(sess){
  ccRkSimClose();
  const T=L(), arena=sess.arena, games=sess.games, rnd=ccLifeRng('rksim|'+(ccRk().n||0));
  const el=document.createElement('div'); el.id='rkSim'; el.className='rk-sim'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.setAttribute('aria-label', arena ? T.rkArenaTitle : T.rkTitle);
  el.innerHTML='<div class="rk-sim-box"><div class="rk-sim-top"><b id="rkSimN"></b><button type="button" class="rk-sim-skip" id="rkSimSkip">'+esc(T.rkSimSkip)+'</button></div>'+
    '<div class="rk-sim-main"><div class="rk-sim-ic" id="rkSimIc"></div><div class="rk-sim-st"><b id="rkSimPh"></b><span id="rkSimAl"></span></div><div class="rk-sim-k"><b id="rkSimK">0</b><small>'+esc(T.rkKills)+'</small></div></div>'+
    '<u class="rk-bar rk-sim-bar"><s id="rkSimBar"></s></u><div class="rk-sim-rk" id="rkSimRk"></div>'+
    '<div class="rk-sim-feed" id="rkSimFeed" aria-live="polite"></div><div class="rk-sim-sum" id="rkSimSum"></div>'+
    '<button type="button" class="hero-btn hero-btn-go rk-sim-done" id="rkSimDone" hidden>'+esc(T.rkSimDone)+'</button></div>';
  document.body.appendChild(el);
  const $=id=>document.getElementById(id);
  const flag=n=>(n && typeof flagImg==='function') ? flagImg(n, 14) : '';
  // ранг/Hype до матча и после: полоска и иконка
  const show=(m, after)=>{
    if(arena){
      const h=after ? m.h1 : m.h0, div=ccArenaDivOf(h, sess.day), thr=ccArenaEra(sess.day).thr, nx=thr[div+1];
      $('rkSimIc').innerHTML='<span class="rk-badge rk-a'+(div>=CC_ARENA_CHAMP ? ' rk-champ' : div>=4 ? ' rk-gold' : ' rk-silver')+'"><i>'+(div+1)+'</i></span>';
      $('rkSimBar').style.width=(nx!=null ? Math.max(0, Math.min(100, (h-thr[div])/(nx-thr[div])*100)) : 100).toFixed(1)+'%';
      $('rkSimRk').textContent=ccArenaName(div)+' · '+ccNum(h)+' Hype';
      return;
    }
    const p=after ? m.p1 : m.p0;
    if(p==null){ $('rkSimIc').innerHTML=ccRkIcon(null); $('rkSimBar').style.width='0%'; $('rkSimRk').textContent=T.rkUnranked; return; }
    const i=ccRkIdx(p);
    $('rkSimIc').innerHTML=ccRkIcon(i);
    $('rkSimBar').style.width=(i>=CC_RANK_UNREAL ? 100 : p%100)+'%';
    $('rkSimRk').textContent=ccRkName(i, p)+(i>=CC_RANK_UNREAL ? ' · #'+ccNum(ccRkUnrealPos(after ? m.u1 : m.u0)) : ' · '+(p%100)+'%');
  };
  // Сценарий матча: шаги по 170 мс, живые падают к месту, киллы на случайных шагах.
  const steps=[];
  games.forEach((m, gi)=>{
    const N=11, alive=[];
    for(let t=0;t<=N;t++){ const f=t<2 ? 0 : (t-1)/(N-1); alive.push(Math.max(m.place, Math.round(m.of*Math.pow(m.place/m.of, Math.pow(f, 0.8))))); }
    const kt=new Map(); for(let k=0;k<m.kills;k++){ const t=2+Math.floor(rnd()*(N-2)); kt.set(t, (kt.get(t)||0)+1); }
    const pool=ccRkLobbyPool(m.lvl||60); let kills=0;
    steps.push({ms:450, run:()=>{ $('rkSimN').textContent=T.rkSimMatch(gi+1, games.length); $('rkSimFeed').innerHTML=''; $('rkSimFeed').hidden=false; $('rkSimK').textContent='0';
      $('rkSimPh').textContent=T.rkSimBus; $('rkSimAl').textContent=m.of+' '+T.rkSimAlive; show(m, false); }});
    steps.push({ms:300, run:()=>{ $('rkSimPh').textContent=T.rkSimLand; }});
    for(let t=2;t<=N;t++){
      steps.push({ms:170, run:()=>{
        $('rkSimPh').textContent=T.rkSimStorm(Math.min(9, 1+Math.floor((t-2)*9/(N-1))));
        $('rkSimAl').textContent=alive[t]+' '+T.rkSimAlive;
        const k=kt.get(t)||0;
        for(let j=0;j<k;j++){ kills++; const v=pool.length ? pool[Math.floor(rnd()*pool.length)] : null;
          $('rkSimFeed').insertAdjacentHTML('afterbegin', '<div>'+esc(T.rkSimKill)+' '+(v ? flag(v.nat)+esc(v.handle) : '')+'</div>'); }
        $('rkSimK').textContent=String(kills);
      }});
    }
    steps.push({ms:1100, run:()=>{
      $('rkSimK').textContent=String(m.kills);
      $('rkSimPh').innerHTML=m.place===1 ? '<span class="rk-vr">'+esc(T.rkVictory)+'</span>' : '#'+m.place+'<small>/'+m.of+'</small>';
      const d=m.place0 ? T.rkPlaced(ccRkName(m.rank)) : m.u!=null ? (m.u>=0?'+':'')+m.u+' '+T.rkUnrealPts : (m.d>=0?'+':'')+m.d+(arena ? ' Hype' : '%');
      const up=m.place0 || (m.u!=null ? m.u>=0 : m.d>=0);
      $('rkSimAl').innerHTML='<i class="'+(m.place0 ? 'rk-pl' : up ? 'up' : 'down')+'">'+esc(d)+'</i>'+(m.by ? ' · '+esc(T.rkBy)+' '+flag(m.by.nat)+esc(m.by.h) : '');
      show(m, true);
      const r0=!arena && m.p0!=null ? ccRkIdx(m.p0) : null, r1=!arena ? ccRkIdx(m.p1) : null;
      if(r0!=null && r1!==r0) $('rkSimRk').insertAdjacentHTML('afterbegin', '<b class="'+(r1>r0 ? 'up' : 'down')+'">'+esc(r1>r0 ? T.rkSimUp : T.rkSimDown)+'</b> ');
    }});
  });
  const finish=()=>{
    clearTimeout(ccRkSimOpen.t);
    const last=games[games.length-1]; show(last, true);
    $('rkSimN').textContent=T.rkSimTotal; $('rkSimSkip').hidden=true;
    $('rkSimPh').textContent=arena ? ccArenaName(ccArenaDivOf(sess.to, sess.day)) : ccRkName(sess.to, last.p1);
    $('rkSimAl').innerHTML=games.map(m=>'#'+m.place).join(' · ');
    $('rkSimK').textContent=String(games.reduce((a,m)=>a+m.kills, 0));
    $('rkSimFeed').innerHTML=''; $('rkSimFeed').hidden=true;
    $('rkSimSum').innerHTML=(sess.form ? esc(T.rkForm(sess.form)) : '');
    const d=$('rkSimDone'); d.hidden=false; try{ d.focus(); }catch(e){}
  };
  let n=0;
  const tick=()=>{ if(!document.getElementById('rkSim')) return; if(n>=steps.length) return finish(); const st=steps[n++]; st.run(); ccRkSimOpen.t=setTimeout(tick, st.ms); };
  $('rkSimSkip').onclick=finish;
  $('rkSimDone').onclick=ccRkSimClose;
  el.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if($('rkSimDone').hidden) finish(); else ccRkSimClose(); } });
  try{ $('rkSimSkip').focus(); }catch(e){}
  tick();
}
function ccRkSimClose(){ clearTimeout(ccRkSimOpen.t); const el=document.getElementById('rkSim'); if(el) el.remove(); }
function ccRkNearHTML(pos){
  const n=ccRkNear(pos); if(!n || (!n.up && !n.down)) return '';
  const row=(r, cls)=>r ? '<div class="rk-nb '+cls+'"><b>#'+r.pos+'</b><span>'+esc(r.h)+'</span></div>' : '';
  return '<div class="rk-near">'+row(n.up, 'up')+'<div class="rk-nb me"><b>#'+pos+'</b><span>'+esc(CAREER.player.nick||'')+'</span></div>'+row(n.down, 'down')+'</div>';
}
function ccArenaPlayWhy(){
  const act=ccActById('trSur');
  if(CAREER.career.seasonOver) return L().ccSeasonOver;
  if(typeof ccLifeHurt==='function' && ccLifeHurt()) return L().lfWhyHurt;
  /* Ранкед — и в турнирный день (его «ранкед не играется», 15.11: капов в календаре стало почти каждый день): днём сессия,
     вечером турнир, как в игре. Закрывает только закрытый день (ccDayShuts), не сам вечер. */
  if(careerDayClosed()) return L().rkDayBusy;
  if(act && careerEnergy()<act.energy) return L().ccNeedEnergy(act.energy-careerEnergy());
  // В день капа энергия на сам кап остаётся (ccPreEvent): ранкед идёт через careerDoAct('trSur') и упёрся бы молча.
  { const pre=ccPreEvent(); if(act && pre && careerEnergy()-act.energy<pre.reserve) return L().ccKeepEnergy(pre.reserve); }
  return '';
}

// ---- Икон-скин: титул Глобалов, два титула Мейджора или миллион призовых.
function ccIconDue(){
  const cr=CAREER.career, lf=ccLife(); if(lf.icon) return false;
  const log=cr.log||[];
  const gc=log.some(e=>e.kind==='globals' && e.place===1);
  const mj=log.filter(e=>!e.who && ccFncsTitle(e)).length;
  return gc || mj>=2 || (cr.earnings||0)>=1000000;
}

// ---- Дневной тик.
function ccLifeTick(){
  const cr=CAREER.career, lf=ccLife(), today=careerToday();
  const from=lf.tick||today; lf.tick=today;
  const days=Math.min(60, Math.max(0, ccDaysBetween(from, today)));
  for(let i=1;i<=days;i++){
    const d=ccAddDays(from, i), rng=careerRng(ccHashStr('lifeday|'+d+'|'+(CAREER.player.nick||'')));
    // Травм больше нет — старая из сейва просто снимается.
    if(lf.hurt) lf.hurt=null;
    /* Бана своего больше нет — так же, как травм (03.10). Игрок 5.10 (Notion
       «05»): «why i always got banned from open events in fncs draft». Жалоба
       падала сама, игрок ничего не делал, а 15% разборов закрывали ВСЕ открытые
       вечера на две недели; день сеется датой и ником — новая карьера с тем же
       ником ловила бан в те же дни, отсюда «always». Жалоба теперь кончается
       снятием или штрафом; бан из старого сейва снимается. */
    if(lf.ban) lf.ban=null;
    // Разбор жалобы.
    if(lf.case && d>=lf.case.until){
      const r=rng(), k=lf.case.k; lf.case=null;
      if(r<0.6) careerNews('good', 'lfNewsCleared', [L()['lfCase'+k]]);
      else { const fine=Math.max(100, Math.round((cr.balance||0)*0.05/50)*50); cr.balance=Math.max(0,(cr.balance||0)-fine);
        careerNews('bad', 'lfNewsFined', [L()['lfCase'+k], ccMoney(fine)]); }
    }
    // Новая жалоба: редко, чаще с большим охватом.
    if(!lf.case && rng()<(1+Math.min(3, careerReach()/200000))/240){
      const k=['team','snipe','toxic'][Math.floor(rng()*3)];
      lf.case={k, until:ccAddDays(d, 3+Math.floor(rng()*5))};
      careerNews('bad', 'lfNewsCase', [L()['lfCase'+k]]);
    }
    ccLiveEventTick(d);
    // Бан на сцене — у чужих тоже (новость).
    if(rng()<1/75){
      const reg=ccCareerRegion(), pool=PLAYERS.filter(p=>p.region===reg && (p._ovr||0)>=80);
      const p=pool[Math.floor(rng()*pool.length)];
      if(p) careerNews('flat', 'lfNewsSceneBan', [p.handle, L()['lfCase'+(rng()<0.6?'team':'snipe')]]);
    }
  }
  // Икон-скин.
  if(ccIconDue()){
    const pay=150000+Math.round(Math.min(350000, careerReach()*0.5)/1000)*1000;
    lf.icon={day:today, pay};
    cr.balance=(cr.balance||0)+pay; cr.side=(cr.side||0)+pay;
    careerReachAdd(Math.round(Math.max(20000, careerReach()*0.3)), true);
    careerNews('good', 'lfNewsIcon', [(CAREER.player.nick||''), ccMoney(pay)]);
    if(typeof careerEvent==='function') careerEvent('lfTlIcon', []);
  }
}

// ---- Плитка хаба.
/* Срочные дела жизни — строками в плитке «Цели»: почему вечер закрыт, травма, жалоба,
   бан, перелёты на ЛАН (без брони ЛАН не пускает). Отдельной плитки «Между турнирами»
   больше нет (его правка 28.09); Noble — во вкладке «Тренировка», оценка — в профиле. */
function ccLifeAlertRows(){
  if(!CAREER || !CAREER.career) return [];
  const lf=ccLife(), cr=CAREER.career, rows=[];
  // Почему сегодняшний вечер закрыт — кнопка «Играть» сама причину не пишет.
  const todayEv=(careerYearDays().get(careerToday())||[]);
  const whyK=todayEv.map(e=>ccLifeWhy(careerToday(), e.kind)).find(Boolean);
  if(whyK) rows.push(`<div class="ch-row"><em>${L().lfToday}</em><b style="color:var(--bad,#f66);">${esc(L()[whyK])}</b></div>`);
  // Ранг живёт в плитке «Развитие» (ccDevTileHTML).
  const h=ccLifeHurt(); if(h) rows.push(`<div class="ch-row"><em>${L().lfHurt}</em><b>${L()[h.k==='wrist'?'lfWrist':'lfIll']} · ${L().lfUntil} ${ccFmtDay(h.until)}</b></div>`);
  if(lf.case) rows.push(`<div class="ch-row"><em>${L().lfCaseOpen}</em><b>${L()['lfCase'+lf.case.k]}</b></div>`);
  const bn=ccLifeBan(); if(bn) rows.push(`<div class="ch-row"><em>${L().lfBan}</em><b>${L().lfUntil} ${ccFmtDay(bn)}</b></div>`);
  return rows;
}
// Таблица недели Noble Pro Scrims — во вкладке «Тренировка».
function ccNobleBoardHTML(){
  const lf=ccLife(), rows=[];
  // Noble — неделя.
  if(lf.noble && lf.noble.n){
    const me=(CAREER.player.nick||'you');
    const board=Object.keys(lf.noble.rows).map(k=>({n:k, p:lf.noble.rows[k].p})).concat([{n:me, p:lf.noble.me, you:true}])
      .sort((a,b)=>b.p-a.p).slice(0,8);
    rows.push(`<div class="ch-row"><em>${esc(lf.noble.server)} · ${L().lfWeek}</em><b>${lf.noble.n} ${L().lfSessions}</b></div>`);
    board.forEach((r,i)=>rows.push(`<div class="ch-row"><em>${i+1}. ${esc(r.n)}</em><b class="${r.you?'ch-goal-met':''}">${r.p}</b></div>`));
  }
  return rows.length ? '<div class="tw-noble">'+rows.join('')+'</div>' : '';
}
function ccFmtDay(iso){ return String(iso||'').slice(8,10)+'.'+String(iso||'').slice(5,7); }

/* ГЛАВНАЯ ПО ОБРАЗЦУ КАРЬЕРЫ EA FC: слева следующее событие и одна главная кнопка,
   справа — цели (клуб, месяц, своя), развитие игрока и новости. Цели были и раньше,
   но жили по разным вкладкам (контракт — в «Клубе», месяц — там же, своя — в
   «Тренировке»); здесь они собраны в одну плитку, как «цели сезона» у тренера в FC. */
function ccGoalsTileHTML(inTrain){
  if(!CAREER || !CAREER.career) return '';
  const cr=CAREER.career, org=CAREER.org, lf=ccLife(), rows=[];
  const row=(who, what, state, ok, bar)=>`<div class="hg-row${ok?' ok':''}"><div class="hg-top"><em>${esc(who)}</em>`+
    `<b>${esc(what)}</b><i>${state}</i></div>${bar!=null ? `<u class="hg-bar"><s style="width:${Math.round(bar)}%"></s></u>` : ''}</div>`;
  if(org && !org.own && org.goal){
    const met=careerOrgGoalMet();
    let now;
    if(org.goal.type==='promote') now=L().ccDivision+' '+cr.division;
    else { const best=(cr.log||[]).filter(e=>e.season===cr.season).reduce((b,e)=>Math.min(b, e.place||999), 999);
      now=best<999 ? '#'+best : '-'; }
    rows.push(row(L().hgClub+' · '+org.name, careerOrgGoalText(org.goal), met ? '✓ '+esc(L().hgDone) : esc(L().hgNow)+' '+esc(now), met));
  }
  const mg=careerMonthGoal();
  if(mg){ const met=careerMonthGoalMet();
    rows.push(row(L().hgMonth, careerMonthGoalText(mg)+(mg.bonus ? ' · '+ccMoney(mg.bonus) : ''), met ? '✓ '+esc(L().hgDone) : esc(L().hgOpen), met));
    const pick=ccMgPickHTML(); if(pick) rows.push(pick); }
  const g=lf.goal, six=CAREER.player.attrs||ccOwnAttrs();
  const wk=ccWeekTag(), f=(lf.focus && lf.focus.wk===wk) ? lf.focus.k : null;
  // На вкладке «Тренировка» своя цель и фокус — в плане недели под плиткой (ccTrainPlanHTML), здесь не повторяются.
  if(!inTrain){
    if(g && !g.done){
      const v=six[g.k]||0, pct=Math.max(0, Math.min(100, (v-g.from)/Math.max(0.1, g.to-g.from)*100));
      rows.push(row(L().hgOwn, ccAttrFull(g.k)+' → '+g.to, (Math.round(v*10)/10).toFixed(1)+' / '+g.to, false, pct));
    }
    if(f) rows.push(row(L().lfFocusH, ccAttrFull(f), '+'+Math.round(CC_FOCUS_BONUS*100)+'%', false));
  }
  // Срочное сверху: закрытый вечер, травма, бан (ccLifeAlertRows).
  const alerts=ccLifeAlertRows();
  if(inTrain && !rows.length && !alerts.length) return '';
  const empty=!rows.length ? `<div class="ch-empty">${esc(org ? L().hgNone : L().hgNoClub)}</div>` : '';
  const ask=(!inTrain && (!g || g.done || !f)) ? `<button class="hg-go" onclick="careerTab('train')">${esc(L().hgSet)}</button>` : '';
  return `<div class="ch-tile hg-tile"><h4>${L().hgTitle}</h4>${alerts.length ? '<div class="hg-alerts">'+alerts.join('')+'</div>' : ''}${rows.join('')}${empty}${ask}</div>`;
}
// Развитие: рейтинг и его ход за сезон, ранг, шесть атрибутов с приростом недели и усталость.
// С 27.10 на вкладке «Тренировка» не рисуется (всё это там уже есть: шапка и панель дня); оставлена, чтобы вернуть одной строкой.
function ccDevTileHTML(){
  if(!CAREER || !CAREER.career) return '';
  const six=CAREER.player.attrs || ccOwnAttrs();
  const d=ccHdrSeasonDelta();
  return `<div class="ch-tile hd-tile"><h4>${L().hdTitle}</h4>`+
    `<div class="hd-head"><b class="hd-ovr">${ccMyShownOvr()}</b><span><em>${esc(L().ccRoOvr)}</em>`+
    (d ? `<i class="${d>0?'up':'down'}">${d>0?'▲ +'+d:'▼ '+d} · ${esc(L().lfHdrSeason)}</i>` : `<i>${esc(L().lfHdrSeason)}: 0</i>`)+`</span></div>`+
    ccTrainPanelHTML(six, false)+
    `<button class="hg-go" onclick="careerTab('train')">${esc(L().hdToTrain)}</button></div>`;
}
/* ОЦЕНКА ЗАНЯТИЯ, как у дриллов в EA FC: D, C, B, A, A+. Множитель прироста — оценка
   режима, не замер; средний по свежему игроку ≈1.0, так что темп роста карьеры не
   меняется, меняется разброс. Усталость и выгорание тянут оценку вниз. */
const CC_GRADES=[['D',0.7],['C',0.85],['B',1],['A',1.15],['A+',1.3]];
function ccDrillGrade(id){
  const cr=CAREER.career, lf=ccLife(), today=careerToday();
  const n=((cr.did||{})[today]||[]).length;
  const burn=careerBurnout(), tired=(cr.grind||0)>CC_GRIND_FREE;
  const s=0.52+(ccLifeRng('drill|'+id+'|'+n)()-0.5)*0.8-(burn>=1 ? 0.25 : tired ? 0.1 : 0);
  const i=s<0.2 ? 0 : s<0.4 ? 1 : s<0.62 ? 2 : s<0.82 ? 3 : 4;
  lf.gr=lf.gr||{};
  (lf.gr[today]=lf.gr[today]||[]).push({id:id, g:CC_GRADES[i][0]});
  // Хранится три недели — столько видит полоса недели и её соседи.
  Object.keys(lf.gr).forEach(d=>{ if(ccDaysBetween(d, today)>21) delete lf.gr[d]; });
  return {g:CC_GRADES[i][0], mult:CC_GRADES[i][1]};
}
function ccDrillLast(id){
  const gr=ccLife().gr||{}; const days=Object.keys(gr).sort().reverse();
  for(const d of days){ const r=gr[d].filter(x=>x.id===id).pop(); if(r) return r.g; }
  return '';
}

/* СВОЯ КАРТА В CREATIVE. Пять вечеров стройки (trMap), потом карта выходит и платит
   раз в месяц — как выплаты авторам островов у Epic. Число игр — от охвата и качества
   (оценки вечеров стройки), без обновлений тает на десятую в месяц; цена тысячи игр
   CC_MAP_RATE — оценка режима, настоящих выплат по картам про-игроков нет в открытом виде. */
const CC_MAP_BUILD=5, CC_MAP_RATE=3;
function ccMap(){ const lf=ccLife(); return lf.map||null; }
function ccMapWork(){
  const lf=ccLife(), nick=CAREER.player.nick||'Player';
  const g=ccLifeRng('map|'+(lf.map ? lf.map.prog : 0))();
  if(!lf.map) lf.map={prog:0, q:1, plays:0, earned:0};
  const m=lf.map;
  if(!m.pub){
    m.prog++; m.q=clamp(m.q+(g-0.45)*0.2, 0.6, 1.5);
    if(m.prog>=CC_MAP_BUILD){
      const r=careerRng(ccHashStr('mapcode|'+nick));
      const code=[0,1,2].map(()=>String(1000+Math.floor(r()*9000))).join('-');
      m.pub=careerToday(); m.upd=m.pub; m.code=code;
      m.name=nick+' '+(['Box Fights','Zone Wars','1v1 Build Fights','Edit Course'][Math.floor(r()*4)]);
      careerNews('good', 'lfNewsMapOut', [m.name, code]);
    }
  } else {
    m.upd=careerToday(); m.q=clamp(m.q+0.05, 0.6, 1.5);
    careerNews('flat', 'lfNewsMapUpd', [m.name]);
  }
}
function ccMapPay(months){
  const m=ccMap(); if(!m || !m.pub || !months) return 0;
  const cr=CAREER.career;
  let paid=0;
  for(let i=0; i<months; i++){
    const stale=Math.max(0, Math.floor(ccDaysBetween(m.upd, careerToday())/30));
    const plays=Math.round((500+careerReach()*1.2)*m.q*Math.pow(0.9, stale));
    const pay=Math.round(plays*CC_MAP_RATE/1000);
    m.plays=(m.plays||0)+plays; m.last=plays; paid+=pay;
  }
  if(paid){ cr.balance=(cr.balance||0)+paid; m.earned=(m.earned||0)+paid;
    careerNews('good', 'lfNewsMapPay', [m.name, ccNum(m.last), ccMoney(paid)]); }
  return paid;
}

// Ранг в одну строку с полосой — ранкед с 2023-го (ccRank), до него — Арена с Hype.

/* НАСТОЯЩИЙ СОСТАВ ПИШЕТ САМ (идея игрока 30.09: «чтобы и персонаж игрока, если он настоящий, в реальную
   команду попадал» — ответ ему: «в начале каждого сезона будут писать игроки, с которыми играл в реальной
   жизни, и будет собираться настоящий состав»). Карьера за настоящую карточку: на смене снимка составов
   (сезон FNCS, ccSnapshotNow) его настоящие напарники этого сезона — из тех же таблиц FNCS, что и снимок, —
   пишут в личку готовым предложением (t.state='offer', одна кнопка — и он в составе). Раз на снимок
   (cr.realCall). Своих, уже сидящих в составе, не зовут; кого нет в сцене года — тоже. */
function ccRealTeamCall(){
  const cr=CAREER && CAREER.career, pl=CAREER && CAREER.player;
  if(!cr || !pl || !pl.handle || ccNowYear()>=2026) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const snap=ccSnapshotNow(); if(!snap || !snap.tag) return;
  if(cr.realCall===snap.tag) return;
  cr.realCall=snap.tag;
  const me=hKey(pl.handle), res=[snap.playIn, snap.lcq].filter(Boolean);
  let best=null, bestRank=-1;
  const rankOf=st=>({Gf:3, Lcq:2, Playin:1}[st]||0);
  PLAYERS.forEach(p=>{
    if(hKey(p)!==me || !res.some(r=>r.test(String(p.event||'')))) return;
    rosterEntriesOf(p).forEach(({stage, entry})=>{
      const hs=(entry.duo||[]);
      if(hs.length<2 || !hs.some(h=>hKey(h)===me)) return;
      if(rankOf(stage)>bestRank){ bestRank=rankOf(stage); best={hs, ev:String(p.event||'').split(' — ')[0].replace(/\s*\(.*\)\s*$/, '')}; }
    });
  });
  // Предложения прошлого сезона — уже не в силе.
  careerDms().forEach(t=>{ if(t.realCall && t.realCall!==snap.tag && t.state==='offer') t.state='open'; });
  if(!best) return;
  const mine=new Set(careerMateRecords().map(r=>{ const c=ccMateCardOf(r); return c ? hKey(c) : null; }).filter(Boolean));
  const scene=careerRosterNowEU();
  best.hs.filter(h=>hKey(h)!==me && !mine.has(hKey(h))).slice(0, Math.max(1, careerMateSeats())).forEach(h=>{
    const c=scene.find(x=>hKey(x)===hKey(h));
    if(!c) return;
    const who={handle:c.handle, ovr:c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr, nat:c.nat, role:(attrsFor(c)||{}).roleKey,
               roster:true, card:c, cardRegion:c.region, club:c.org||null, pay:0};
    const t=careerDmFind(c.handle) || careerDmThread(who);
    t.who=t.who||who;
    careerDmPush(t, 'them', 'dmRealTeam', [best.ev]);
    t.state='offer'; t.realCall=snap.tag;
  });
}
function careerAdvanceBody(iso){
  const cr=CAREER.career;
  // The month's objective is judged before the clock leaves the day that may
  // have met it: every runner writes its history row and then moves the day,
  // so one hook here covers the cup, the final, the Major and the rest.
  careerMonthGoalCheck();
  const to=iso>ccYearTo() ? ccYearTo() : iso;
  // A night takes some of the week off by itself, so a career that simply
  // stops for a few days comes back fresh without spending them on rest.
  const nights=Math.max(0, Math.round((new Date(to+'T00:00:00Z')-new Date(cr.day+'T00:00:00Z'))/86400000));
  if(nights){ careerRestore(nights*CC_ENERGY_NIGHT); careerFormFade(nights); }
  // And the person paid to post, posts — on the days nothing was won too.
  if(nights) ccSmmWork(nights);
  try{ ccStaffAutoRenew(to); }catch(e){}   // штаб продлевается сам (ccStaffAutoRenew)
  const paid=careerPayWages(cr.day, to);
  // Бонус клуба за финал Мейджора и выплата за свою карту — тем же днём.
  careerOrgBonusTick();
  ccMapPay(careerWagePaydays().filter(d=>d>cr.day && d<=to).length);
  // The rest of the scene keeps playing while the player's own week passes.
  careerWorldTurns(cr.day, to);
  // And has birthdays while it does.
  careerBirthdays(cr.day, to);
  // And the clubs work through their week too: an answer that was owed lands,
  // and an offer nobody signed runs out. The people you wrote to answer on the
  // same clock.
  careerOrgDays(cr.day, to);
  // И то, что пришло в уведомления: лайки на своих постах и новые подписчики.
  // См. careerNotesTick — ничего нового не считается, всё из охвата и постов.
  careerNotesTick();
  // Анонс ближайшего крупного вечера и реакция на него — см. careerAnnounceTick.
  careerAnnounceTick();
  // Слухи и опросы сцены (16.10). Ошибка в них не должна останавливать день.
  try{ careerRumorTick(); }catch(e){ console.error('rumor', e); }
  try{ careerPollTick(); }catch(e){ console.error('poll', e); }
  try{ careerDebateTick(); }catch(e){ console.error('debate', e); }
  // Хотфиксы и выплаты призовых (16.10).
  try{ careerHotfixTick(); }catch(e){ console.error('hotfix', e); }
  try{ careerPayTick(); }catch(e){ console.error('pay', e); }
  careerCustomsPostTick();
  careerAdPostTick();
  // Трансферный рынок сцены и месячный «кто выстрелил». См. careerSceneMovesTick.
  careerSceneMovesTick();
  careerSceneRiseTick();
  // Приглашение на Про-Ам — за две недели до даты. См. careerProAmInviteTick.
  careerProAmInviteTick();
  careerDmDays(cr.day, to);
  try{ ccStaffDmTick(to); }catch(e){}   // штаб пишет в личку по делу (ccStaffDmTick)
  try{ ccClubAskTick(to); }catch(e){ console.error('clubAsk', e); }
  try{ ccSacTick(cr.day, to); }catch(e){ console.error('sac', e); }   // свой код автора платит раз в месяц (ccSacTick)   // итог «позвать в клуб» через менеджера (ccOrgBringMate)
  // And the seat, if it is empty, hears from somebody who is free.
  careerSeatDms(cr.day, to);
  careerFmtSeatDms(cr.day, to);
  // And a brand that has decided the audience is now worth a slot.
  careerSponsorDm();
  // And somebody who would like to do the talking with the clubs.
  careerAgentDm();
  if(iso>ccYearTo()){ cr.seasonOver=true; cr.day=ccYearTo(); }
  else cr.day=iso;
  /* Гонка карьер: сводка уезжает соперникам каждый прожитый день — ПОСЛЕ смены
     даты. До 8.09 вечера она уходила строкой выше, со вчерашним днём: в перемотке
     на турнирный день все видели друг друга «на вчера» (ccRaceApartWhy='day'),
     ждали минуту и играли каждый в своей комнате — годовая проба на шестерых
     (check-race-live-six) показала ноль общих бросков и по минуте на вечер. */
  if(typeof ccRaceNextCatch==='function') ccRaceNextCatch();   // голоса за этот день, приехавшие раньше меня
  if(typeof careerRaceSend==='function') careerRaceSend();
  // A month that has ended gets its award, and a year that has ended gets its
  // own. Both are judged after the clock has moved, because the month is only
  // over once the day is in the next one.
  careerAwardCheck();
  try{ ccLifeTick(); }catch(e){ if(typeof console!=='undefined') console.warn('life tick', e); }
  if(typeof careerSacTick==='function') careerSacTick();       // код поддержки — за месяц
  if(typeof careerTwSubsTick==='function') careerTwSubsTick(); // подписки на каналы — продление
  try{ ccLife22Tick(); }catch(e){ if(typeof console!=='undefined') console.warn('life22 tick', e); }
  try{ ccTtTick(); }catch(e){ if(typeof console!=='undefined') console.warn('tt tick', e); }
  try{ ccYtTick(); }catch(e){ if(typeof console!=='undefined') console.warn('yt tick', e); }   // YouTube: просмотры роликов за день
  if(cr.seasonOver) careerAwardSeason();
}
// An old save carries a week and no day, and it is brought forward rather than
// thrown away — a career in progress is somebody's season.
//
// Counted from the career's own start, not from the year's. Its week 1 was a cup
// week; the year's week 1 is the first of December, where nothing runs at all,
// so mapping the number straight across would drop every save in progress into
// a dead stretch. What the old number meant was "this far in", and that is what
// carries over.
/* A save from before wages and prize money were told apart.

   The old careerPayWeek added the same slice to cr.earnings and to org.paid, so
   a career that has been paid anything carries its wages inside its winnings —
   which is why a Division 3 player with no prize money at all was shown $619 of
   it, the exact number the club had paid.

   Undone rather than estimated: org.paid is the amount, to the dollar, and it is
   moved across instead of guessed at. Runs once, when cr.wages is still absent. */
function careerMigrateMoney(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.wages!=null) return;
  const paid=(CAREER.org && CAREER.org.paid) || 0;
  cr.wages=paid;
  if(paid) cr.earnings=Math.max(0, (cr.earnings||0)-paid);
  // Everything earned so far is money that was never spent, since there was
  // nothing to spend it on until the shop existed.
  if(cr.balance==null) cr.balance=(cr.earnings||0)+paid;
  careerSave();
}
/* A contract signed before clubs remembered their own standard.

   Without the tier there is no bar to clear, so an academy player from an older
   save could never come up. The club is in the pool under its name; read the
   standard back from there. */
/* «Не искать клуб», нажатое в клубе, живёт, пока ты в нём. Контракт кончается многими дорогами (расторжение, выкуп,
   событие, переезд), и после любой выключенный поиск молчал навсегда: свободный агент с 99 без единого письма.
   Свободным агентом выключил сам (scoutOffFree) — держится. */
function ccScoutOff(){ return !!(CAREER && CAREER.scoutOff && (CAREER.org || CAREER.scoutOffFree)); }
function careerMigrateOrg(){
  const org=CAREER && CAREER.org;
  if(!org || org.tier!=null) return;
  const club=careerOrgPool().find(o=>o.name===org.name);
  if(club) org.tier=club.tier;
  careerSave();
}
/* Свой клуб, у которого сейв потерял CAREER.org.

   До 13 сентября careerOrgSeasonEnd на стыке года «расторгал контракт» и со своим
   клубом (цели у него нет — читалось как провал): cr.club оставался, CAREER.org
   пропадал, плитка говорила «нет клуба», а careerOrgOffers из-за cr.club молчал.
   Клуб — тот же, что и был; ставится обратно тем же объектом, каким его ставит
   careerClubFound. Сторож — tools/check-career-own-club.js. */
function careerMigrateOwnClub(){
  const cr=CAREER && CAREER.career, club=cr && cr.club;
  if(!club || !club.name || CAREER.org) return;
  CAREER.org={name:club.name, salary:0, cut:0, tier:70, own:true, since:cr.season, paid:0};
  careerSave();
}
function ccS43TrioSync(){
  try{ if(CAREER && CAREER.career && CAREER.career.day && ccS43Trios(careerToday()) && careerSquadSize()!==3) ccSyncPhaseRoster(); }catch(e){}
}
function careerMigrateClock(){
  const cr=CAREER && CAREER.career;
  if(cr && cr.day) ccS43TrioSync();
  if(!cr || cr.day) return;
  const wasIn=Math.max(1, Math.min(CAREER_WEEKS, cr.week||1))-1;
  cr.day=ccAddDays(careerStartDay(), wasIn*7);
  if(cr.day>ccYearTo()) cr.day=ccYearTo();
  // The old field goes with it. Left in place it is a second clock that never
  // ticks, and the first thing to read it believes the career never moved.
  delete cr.week;
  careerSave();
  // Старт с сезона S43: сразу трио, без пустого кресла до первого вечера.
  ccS43TrioSync();
}
/* How many people a season is played by.

   His ask, 19 August: alternate the years, duos and then trios, on the same
   measured calendar and the same cards. So the size of a squad stops being a
   constant and becomes something a season owns.

   Stored on the career rather than worked out from the season number every time
   it is asked. A derived rule would re-shape a season somebody is halfway
   through the moment the rule is edited — the same reason an agreed agent fee
   lives on the contract instead of being looked up. */
/* Размер команды на одно событие. В 2019-м и 2020-м формат менялся внутри года (World Cup
   соло и дуо, FNCS трио, C2S3 соло): состав года — трио, а вечер идёт в своём формате —
   соло один, дуо с первым тиммейтом. Ставится только на время вечера или молчаливого
   досчёта (ccWithEventSize) — не днём календаря: иначе найм тиммейта в соло-день
   (careerMateSeat) обрезал бы трио. */
var CC_EVENT_SIZE=0;   // var, не let: careerSquadSize зовут и до этой строки при загрузке
function ccWithEventSize(n, fn){
  const prev=CC_EVENT_SIZE; CC_EVENT_SIZE=n||0;
  try{ return fn(); } finally{ CC_EVENT_SIZE=prev; }
}
// Тег «Мейджор» в календаре: до 2023-го Мейджоров не было — шли сезоны FNCS (и World Cup).
// И капы: Victory Cups у Epic — с апреля 2023-го; раньше — просто кубки (Solo Cash Cup, Daily Trios Cup…).
function ccWkVictoryWord(){ const y=ccCalYear(); return (ccPastYear(y) && y<=2022) ? L().chWkCup : L().chWkVictory; }
function ccWkMajorWord(){ const y=ccCalYear(); return (ccPastYear(y) && y<=2022) ? 'FNCS' : L().chWkMajor; }
function careerSquadSize(){
  if(CC_EVENT_SIZE) return CC_EVENT_SIZE;
  const n=CAREER && CAREER.career && CAREER.career.size;
  return n===1 ? 1 : n===3 ? 3 : n===4 ? 4 : 2;   // 1: соло-год после 2026 (ccFmtYearSet)
}
// Состав года карьеры при создании: 2019 — сквад (C2S1 FNCS), трио-годы — трио, остальные — дуо.
function ccYearRosterSize(y){ return y===2019 ? 2 : y===2020 ? 2 : (y===2025 || y===2021) ? 3 : 2; }
/* Состав 2019-го и 2020-го идёт по этапам года, как было у игроков: 2019 — дуо на World Cup
   (соло-недели — одному), с августа трио (FNCS Season X), с 13 октября сквад (C2S1); 2020 — дуо
   (C2S2; C2S3 — соло одному), с 27 августа трио (C2S4). Вне этих лет — 0 (размер не трогается). */
function ccPhaseRoster(){
  if(typeof ccIs2019==='function' && ccIs2019()){ const d=careerToday(); return d<'2019-08-01' ? 2 : d<'2019-10-13' ? 3 : 4; }
  if(typeof ccIs2020==='function' && ccIs2020()) return careerToday()<'2020-08-27' ? 2 : 3;
  if(ccS43Trios(careerToday())) return 3;
  return 0;
}
// Мини-сезон S43: командный формат Epic трио (Performance Cup Trios, Trios Cash Cup). Только настоящий ноябрь 2026-го.
function ccS43Trios(d){
  return ccCalYear()===2026 && ccYearShift()===0 && String(d)>=CC_SEASONS[4].from && String(d)<=CC_YEAR_TO;
}
function ccSyncPhaseRoster(){
  const cr=CAREER && CAREER.career; if(!cr || CC_EVENT_SIZE) return;
  const ps=ccPhaseRoster(); if(ps && cr.size!==ps) cr.size=ps;
  ccRosterSwap();
  if(ps) ccPhaseFillSeats(ps);
}
/* ПУСТОЕ КРЕСЛО НА СТЫКЕ ЭТАПА (Notion «0910», тестер: «квалификации дуо, хиты и финал уже трио»;
   его слово: «у меня не сыгралось половина капов когда началось трио»). Состав растёт сам — 1 августа
   2019-го дуо становится трио, 13 октября сквадом, 27 августа 2020-го снова трио, — а новый состав
   начинался с теми же людьми, то есть с пустым креслом. Пустое кресло закрывает каждый командный
   вечер (careerNoMate), и «До турнира» с перемоткой проходили их молча: мир доигрывал Season X без
   игрока. Игрок формат не выбирал — режим сменил его сам, значит и кресло садит режим: сначала
   настоящих тиммейтов своих людей по записям этого сезона (ccRealMatesOf), потом ближайших по силе
   со сцены; одно правило ИГЛа. Один раз на этап (cr.phaseFilled) — убрать кого-то потом его право. */
function ccPhaseFillSeats(size){
  const cr=CAREER && CAREER.career;
  if(!cr || CAREER._mgr || CC_EVENT_SIZE || ccMpOn() || (typeof ccRacePairOn==='function' && ccRacePairOn())) return;   // менеджер добирает сам (mgrPhaseSync)
  const done=cr.phaseFilled=cr.phaseFilled||{};
  const tag=cr.season+'|'+size;
  if(done[tag]) return;
  done[tag]=1;
  const need=careerMatesShort();
  if(need<=0){ careerSave(); return; }
  const me=careerCard(), mates=careerMates().filter(Boolean);
  const team=new Set([me].concat(mates).filter(Boolean).map(hKey));
  const taken=(typeof ccRaceOn==='function' && ccRaceOn()) ? ccRaceTakenKeys() : new Set();
  const roles=ccSquadRoles(), picks=[];
  const take=c=>{
    if(!c || picks.length>=need) return;
    const k=hKey(c);
    if(team.has(k) || taken.has(k)) return;
    const r=attrsFor(c).roleKey;
    if(!ccSquadRoleFits(roles.concat(r ? [r] : []), size)) return;
    team.add(k); picks.push(c); if(r) roles.push(r);
  };
  [me].concat(mates).forEach(c=>{ if(c) ccRealMatesOf(c, size-1).forEach(take); });
  if(picks.length<need){
    const own=[me].concat(mates).filter(Boolean);
    const avg=own.reduce((s,c)=>s+ccCardOvr(c), 0)/Math.max(1, own.length);
    // Рейтинг — один раз на карточку: сравнение внутри sort звало ccCardOvr n·log n раз и вешало стык этапа.
    const near=careerRosterNowEU().map(c=>({c, d:Math.abs(ccCardOvr(c)-avg)})).sort((x,y)=>x.d-y.d);
    near.forEach(x=>take(x.c));
    /* Состав, который уже не проходит по ролям (два ИГЛа: ты и напарник), правило ролей отсекает каждого — и кресло
       оставалось пустым, а пустое кресло закрывает все вечера (24.10, сквад-год на выбор, ccFmtYearSet). Тогда — ближайшие
       по силе без правила ролей: пустое кресло хуже лишнего ИГЛа. */
    if(picks.length<need) near.forEach(x=>{ const c=x.c; if(picks.length>=need) return; const k=hKey(c);
      if(team.has(k) || taken.has(k)) return; team.add(k); picks.push(c); });
  }
  picks.forEach(c=>careerMateSeat({handle:c.handle, cardRegion:c.region||ccCareerRegion(), patience:CAREER_PATIENCE_START, since:careerToday()}));
  if(picks.length){
    const tags=careerMates().filter(Boolean).map(m=>'@'+ccHandle(m.handle)).join(' ');
    careerNews('good', 'ccNewsSquadNew', [size===4 ? 'SQUAD' : size===3 ? 'TRIO' : 'DUO', tags]);
  }
  careerSave();
}
/* ДУО, ТРИО И СКВАД — ОТДЕЛЬНЫЕ СОСТАВЫ.

   Просьба: «пусть дуо трио это отдельные составы чтоб ниче не путалось, но игроки могут
   одинаковые быть». Раньше состав был один: пара, переходя в трио-этап года, добирала
   третьего в ту же запись — и место на ЛАН пары, взятое в дуо, «ломалось» от приёма в трио.
   Теперь на каждый размер свой список (CAREER.rosters[2|3|4]): когда размер состава года
   меняется, текущий откладывается, а поднимается сохранённый для нового размера. Нового ещё
   не было — он начинается с тех же людей (сколько влезает), дальше живёт сам. В командной
   карьере состав общий на двоих и едет с сервера — там не трогаем. */
function ccRosterSwap(){
  if(!CAREER || !CAREER.career || CC_EVENT_SIZE) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const size=careerSquadSize();
  if(!CAREER.rosters) CAREER.rosters={};
  const was=CAREER.rosterSize;
  if(was===size) return;
  CAREER.rosterSize=size;
  if(!was) return;
  CAREER.rosters[was]=(CAREER.partners||[]).slice();
  const saved=CAREER.rosters[size];
  CAREER.partners = saved ? saved.slice() : (CAREER.partners||[]).slice(0, size-1);
  careerSave();
}
/* What a season was played in, which is not what its number implies.

   The archive read the format off the parity of the season number — season two
   is even, so season two was trios. That is the rule the mode follows from now
   on, but it is a day old and the careers are older: a season played before it
   was a duo season whatever number it carries. The tile told a player who had
   just won Major 3 in a duo that he had been in a trio, with his own two names
   printed under the line saying so. His report, 20 August.

   So the size is recorded at the boundary now — see careerNewSeason — and a
   season with no record reads as duos, which is the reading careerSquadSize
   already gives a save from before the rule. */
function careerSeasonSize(sn){
  const cr=CAREER && CAREER.career;
  if(!cr) return 2;
  if(sn===cr.season) return careerSquadSize();
  const rec=cr.sizes && cr.sizes[sn];
  return rec===1 ? 1 : rec===3 ? 3 : rec===4 ? 4 : 2;
}
/* ФОРМАТ ГОДА НА ВЫБОР ПОСЛЕ 2026 (24.10, Notion «24.10.26», его ответ игроку: «следующие года сделаю, чтоб игрок
   выбирал мод, в котором играть»). До этого год после 2026 брал формат по чётности: дуо, трио, дуо… Теперь на
   стыке года открывается окно: дуо, трио или сквад; по умолчанию стоит прежний (чётность). Выбрать можно, пока в
   новом году не сыграно ни одного вечера; дальше состав живёт как у 2019-го на стыке этапа (ccRosterSwap +
   ccPhaseFillSeats садит пустые кресла). Соло-год (размер 1): все вечера на одного, напарников нет.
   Онлайн (команда, гонка) и менеджер формат не выбирают: он общий и решается правилом. */
function ccFmtYearCan(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.fmtOpen!==cr.season || CAREER._mgr) return false;
  if((typeof ccMpTeam==='function' && ccMpTeam()) || (typeof ccRaceOn==='function' && ccRaceOn())) return false;
  return !(cr.log||[]).some(e=>e && e.season===cr.season);
}
/* Карта года выбирается в том же окне, что и формат (его слово 13.11: «пусть карта года выбирается так же, как и мод»,
   «по кругу не надо»). По умолчанию отмечена глава, на которую год встал бы сам. */
let CC_FMT_SEL=null;
function ccFmtMapOn(){ return ccYearShift()>0 && !ccPastYearIsland(); }
function ccFmtYearSel(k, v){
  if(!CC_FMT_SEL) return;
  CC_FMT_SEL[k]=v;
  const m=document.getElementById('ccFmtModal'); if(!m) return;
  m.querySelectorAll('[data-fk="'+k+'"]').forEach(b=>{ const on=+b.dataset.fv===v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
}
function ccFmtYearGo(){ const s=CC_FMT_SEL; if(s) ccFmtYearSet(s.n, s.m); }
function ccFmtYearSet(n, map){
  const cr=CAREER && CAREER.career; if(!cr || !ccFmtYearCan() || [1,2,3,4].indexOf(n)<0) return;
  delete cr.fmtOpen;
  ccFmtYearClose();
  if(Number.isInteger(map) && map>=0 && map<CC_CYCLE.length && ccFmtMapOn()){ cr.mapCh=map; CC_YEAR_DAYS=null; }
  if(cr.size!==n){
    cr.size=n; (cr.sizes=cr.sizes||{})[cr.season]=n;
    CC_POOLS=null; CC_NOW_CARDS={}; CC_YEAR_DAYS=null;
    try{ ccTrioMarket(cr, true); }catch(e){}
    ccRosterSwap();
    try{ ccPhaseFillSeats(n); }catch(e){}
  }
  careerSave();
  careerRenderHub('centre');
}
function ccFmtYearClose(){ const m=document.getElementById('ccFmtModal'); if(m) m.remove(); }
function ccFmtYearOpen(){
  if(!ccFmtYearCan() || document.getElementById('ccFmtModal')) return;
  const T=L(), cr=CAREER.career, now=careerSquadSize();
  let ch=null; try{ ch=ccChapterOf(ccSeasonNumOn(careerToday())); }catch(e){}
  const m=document.createElement('div');
  m.id='ccFmtModal';
  const mapOn=ccFmtMapOn(), mapNow=ccCycleChapter(ccYearShift());
  CC_FMT_SEL={n:now, m:mapOn ? mapNow : null};
  const btn=(k, v, w, on)=>'<button type="button" data-fk="'+k+'" data-fv="'+v+'" class="'+(on ? 'on' : '')+'" aria-pressed="'+(on ? 'true' : 'false')+'" onclick="ccFmtYearSel(\''+k+'\','+v+')">'+esc(w)+'</button>';
  m.innerHTML='<div class="cc-ask-box"><p>'+esc(T.ccFmtYearQ(ccSeasonYear(), ch && ch.c ? ch.c : ''))+'</p><div class="cc-fmt-btns">'+
    [[1, T.ccFmtSolo||'Solos'], [2, T.ccFmtDuo], [3, T.ccFmtTrio], [4, T.ccFmtSquad]].map(([n, w])=>btn('n', n, w, n===now)).join('')+'</div>'+
    (mapOn ? '<p class="cc-fmt-h">'+esc(T.mapPickH||'Map this year')+'</p><div class="cc-fmt-btns cc-fmt-maps">'+
      CC_CYCLE_NAMES.map((w, i)=>btn('m', i, w, i===mapNow)).join('')+'</div>' : '')+
    '<div class="cc-fmt-go"><button type="button" onclick="ccFmtYearGo()">'+esc(T.ccFmtGo||'Play')+'</button></div></div>';
  document.body.appendChild(m);
}
function ccFmtYearNudge(){
  try{
    if((typeof CC_FF!=='undefined' && CC_FF) || CAREER_RUN) return;
    const hub=document.getElementById('screen-career-hub'); if(!hub || !hub.classList.contains('active')) return;
    if(ccFmtYearCan()) ccFmtYearOpen();
  }catch(e){}
}
/* Everybody who sat beside the player that night, and not the first seat alone.

   A log entry carried `mate`, one handle, from the years when one was all there
   was — so the archive built the player's own winning team out of two names in
   a season of threes. `mate` stays where it is, for the saves already written
   and for every reader that means "his partner"; this is the team. */
function ccLogMates(mates){
  return (mates||[]).map(m=>m && m.handle).filter(Boolean);
}
/* A save from before home was written down.

   There is no way to tell, after the fact, whether a career standing in NA
   Central started there or flew there — nothing recorded the difference. So it is
   read as home, which is the reading that cannot hurt anybody: a career that did
   fly there stops paying that rent, and one that started there stops being
   evicted for a lease it never signed. The second is the bug; the first is a
   month's rent forgiven once, to a handful of saves, and worth it. */
/* Сейв, заведённый до этой правки, стоит в том дивизионе, который выбрали на
   экране создания, и выйти из него ему нечем. Один раз — в первый. */
/* Сейв из региона, где ступеней три, мог сидеть в четвёртом или пятом:
   до сегодняшней правки их предлагали везде. Опускаем на нижнюю ступень
   региона — это то же место в лестнице, просто названное верно. */
function careerMigrateDivDepth(){
  const cr=CAREER && CAREER.career;
  if(!cr) return;
  const n=ccDivCount(typeof ccCareerRegion==='function' ? ccCareerRegion() : null);
  if((cr.division||1)>n){ cr.division=n; if(typeof careerSave==='function') careerSave(); }
}
function careerMigrateNoDiv(){
  const cr=CAREER && CAREER.career;
  if(!cr || !ccNoDivisions()) return;
  if((cr.division||1)!==1) cr.division=1;
}
function careerMigrateHome(){
  const pl=CAREER && CAREER.player;
  if(!pl || pl.homeRegion!=null) return;
  pl.homeRegion=pl.region||'EU';
  careerSave();
}
/* Дома Релоада переезжают с круга на остров.

   До 24 августа дом хранился по ключу круга (r1…r4), и таких сейвов уже
   написано. Молча оставить их значит потерять дом вместе с накопленной аурой:
   careerSpotList теперь спрашивает 'r12' и 'r34', а там пусто. Поэтому записи
   сводятся к островам — первая по счёту остаётся, вторая (если игрок успел
   поставить дома и на первом круге, и на втором) отдаёт свою ауру той, что
   старше: это одно и то же место на одной карте, и складывать его репутацию
   честнее, чем выбрасывать половину. */
function careerMigrateSpotIslands(){
  const cr=CAREER && CAREER.career;
  if(!cr || !cr.spots) return;
  let moved=false;
  [['r12','r1','r2'], ['r34','r3','r4']].forEach(function(g){
    const to=g[0], from=g.slice(1);
    from.forEach(function(k){
      const v=cr.spots[k];
      if(!v) return;
      const list=Array.isArray(v) ? v : [v];
      delete cr.spots[k];
      moved=true;
      if(!list.length) return;
      if(!cr.spots[to]){ cr.spots[to]=list.slice(0,1); return; }
      const keep=cr.spots[to][0], drop=list[0];
      if(keep && drop) keep.aura=Math.max(keep.aura||0, drop.aura||0);
    });
  });
  if(moved) careerSave();
}
// A save from before the trio years is a duo season, which is what it played.
function careerMigrateSize(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.size!=null) return;
  cr.size=2;
  careerSave();
}
/* Which island a career night is played on.

   His ask, 19 August: in a trio year the map should change too. It can, because
   the trio year's islands are already here — t1, t2 and t3 are Chapter 6's three
   seasons, each with the drop grid and the counted loot read off that Major's
   own map, and the 2025 card sets have been playing them since they were built.

   Split on the year's own arc rather than on a date pulled out of the air: the
   island turns over when the Major does, so a season opens on the first, moves
   to the second once Major 1 is behind it and to the third for the run to
   Antwerp. Which is what a real year does — a new season, a new map.

   Reload is not in this. It has its own islands in every year, and the three
   runners that play it name them a line after the default. */
const CC_TRIO_ISLANDS=[{from:'2026-05-01', set:'t2'}, {from:'2026-07-01', set:'t3'}];
/* 2025-й: остров меняется в день нового сезона Fortnite (CC_SEASONS: S34 с 21.02, S36 с 7.06). Стояло «с Плей-Ином
   следующего Мейджора» (9.04 и 16.07): сезон, магазин и новости уже новые, а карта полтора месяца старая — «сезон
   поменялся карта не обновилась» (Notion 24.10.26, скрин острова C6S1). Острова C6S4 (S37, с 7.08) в сборке нет — стоит C6S3. */
const CC_TRIO_ISLANDS_2025=[{from:'2025-02-21', set:'t2'}, {from:'2025-06-07', set:'t3'}, {from:'2025-08-07', set:'t4'}];   // C6S4 с 7.08 — Лион (Notion 26.10.26)
/* Остров прошлого года (2019–2024) — по дате, при любом размере команды: трио-годы (2020,
   2021) и вечера в своём формате (2019) иначе проваливались в острова 2025–2026. */
function ccPastYearIsland(){
  if(!ccPastYear(ccCalYear()) || ccIs2025()) return null;
  if(ccIs2024()){ const d0=careerToday(); if(d0>='2024-11-02' && ZONE_SETS.i1) return 'i1';   // Chapter 2 Remix — остров C2S2
    return d0>='2024-08-16' ? 'f4' : d0>='2024-06-14' ? 'f3' : d0>='2024-04-12' ? 'f2' : 'f1'; }
  // 2022-й — Chapter 3: остров по сезону (C3S2 с 20.03, C3S3 с 5.06, C3S4 с 18.09 — Роли).
  // 2021-й — Chapter 2: остров по сезону (C2S6 с 16.03, C2S7 с 8.06, C2S8 с 13.09).
  // 2019-й: World Cup — Season 9, осень — Season X, с 13.10 — Chapter 2 Season 1.
  // 2020-й: остров сезона (C2S3 с 17.06, C2S4 с 27.08).
  if(ccIs2020()){ const d0=careerToday(); const k=d0>='2020-08-27' ? 'i3' : d0>='2020-06-17' ? 'i2' : 'i1';
    return ZONE_SETS[k] ? k : 'h4'; }
  if(ccIs2019()){ const d0=careerToday(); const k=d0>='2019-10-13' ? 'h4' : d0>='2019-08-01' ? 'h3' : 'h1';
    return ZONE_SETS[k] ? k : 'j1'; }
  if(ccIs2021()){ const d0=careerToday(); const k=d0>='2021-09-13' ? 4 : d0>='2021-06-08' ? 3 : d0>='2021-03-16' ? 2 : 1;
    return ZONE_SETS['j'+k] ? 'j'+k : ZONE_SETS['k'+k] ? 'k'+k : 'f'+k; }
  if(ccIs2022()){ const d0=careerToday(); const k=d0>='2022-09-18' ? 4 : d0>='2022-06-05' ? 3 : d0>='2022-03-20' ? 2 : 1;
    return ZONE_SETS['k'+k] ? 'k'+k : ZONE_SETS['e'+k] ? 'e'+k : 'f'+k; }
  /* Season OG (3.11–2.12.2023) — остров Главы 1, как в игре по неделям (пункт 7 списка 20.10): 3–9.11 Сезон 5 (g5),
     9–16.11 Сезон 6 (g6), 16–23.11 Сезоны 7–8 (g7), с 23.11 Сезоны 9/X (h1). Карты — вики (tools/build-mx-islands.js). */
  if(ccIs2023() && careerToday()>='2023-11-03'){ const d0=careerToday();
    const k=d0<'2023-11-09' ? 'g5' : d0<'2023-11-16' ? 'g6' : d0<'2023-11-23' ? 'g7' : 'h1';
    if(ZONE_SETS[k]) return k; if(ZONE_SETS.h1) return 'h1'; }
  if(ccIs2023()){ const d0=careerToday(); const k=d0>='2023-08-25' ? 4 : d0>='2023-06-09' ? 3 : d0>='2023-03-10' ? 2 : 1;
    return ZONE_SETS['e'+k] ? 'e'+k : 'f'+k; }
  return null;
}
/* ГЛАВЫ ПО КРУГУ ПОСЛЕ 2026 (24.10, Notion «24.10.26», игрок: «после 7 главы главы (карты) идут по кругу 6-7-6-7»,
   просил по кругу с первой главы; его ответ игроку: «после 7 главы были другие карты, а не чередовались две»). Год после
   2026 — тот же календарь 2026-го, и остров выбирался по размеру команды: дуо-год на седьмой главе, трио-год на шестой.
   Теперь год берёт главу по кругу: 2027 — Глава 1, 2028 — Глава 2 (S1–S4), 2029 — Глава 2 (S5–S8), 2030 — Глава 3,
   2031 — Глава 4, 2032 — Глава 5, 2033 — Глава 6, 2034 — Глава 7, 2035 — снова Глава 1. Внутри года четыре окна по
   стыкам сезонов 2026-го (19.03, 6.06, 21.08), остров при любом размере команды, как у прошлых лет (ccPastYearIsland).
   Второе число — номер сезона Fortnite этого острова: по нему подпись лобби, фон и всё, что читает ccSeasonNumOn.
   Острова C6S4 и мини-сезонов (Galactic Battle, Simpsons) в сборке нет — их окна стоят на соседнем острове главы. */
const CC_CYCLE_CUTS=['2026-03-19', '2026-06-06', '2026-08-21'];
const CC_CYCLE=[
  [['g5',5], ['g6',6], ['g7',7], ['h1',9]],
  [['h4',11], ['i1',12], ['i2',13], ['i3',14]],
  [['j1',15], ['j2',16], ['j3',17], ['j4',18]],
  [['k1',19], ['k2',20], ['k3',21], ['k4',22]],
  [['e1',23], ['e2',24], ['e3',25], ['e4',26]],
  [['f1',28], ['f2',29], ['f3',30], ['f4',31]],
  [['t1',33], ['t2',34], ['t3',36], ['t4',37]],
  [['m1',39], ['m1',40], ['m2',41], ['s42',42]]
];
function ccCycleSlot(day){
  const k=(typeof ccYearShift==='function') ? ccYearShift() : 0;
  if(!(k>0) || ccPastYearIsland()) return null;
  const d=String(day||careerToday());
  // Только дни календаря года (2026-го, по которому идут все годы после него): даты прошлых лет (кирки FNCS, журналы)
  // остаются своими сезонами.
  if(d<'2025-11-29' || d>='2027-01-01') return null;
  let w=0; CC_CYCLE_CUTS.forEach(c=>{ if(d>=c) w++; });
  const slot=CC_CYCLE[ccCycleChapter(k)][w];
  return (slot && ZONE_SETS[slot[0]]) ? slot : null;
}
function ccCycleIsland(day){ const s=ccCycleSlot(day); return s ? s[0] : null; }
/* СВОЯ КАРТА ПОСЛЕ 2026 (отзыв игрока 11.11: «не возвращай OG-карту после 2026, дай выбрать карту»). cr.mapCh — номер строки
   CC_CYCLE (глава), null — по кругу, как было. Выбор держится, пока его не сменят; в команде и гонке не показывается,
   там год общий. */
function ccCycleChapter(k){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  const m=cr && cr.mapCh;
  return (Number.isInteger(m) && m>=0 && m<CC_CYCLE.length) ? m : (k-1)%CC_CYCLE.length;
}
const CC_CYCLE_NAMES=['C1', 'C2 S1-4', 'C2 S5-8', 'C3', 'C4', 'C5', 'C6', 'C7'];
function ccMapPickHTML(){
  // Плитки в лобби больше нет: карта выбирается в окне нового года вместе с форматом (ccFmtYearOpen).
  return '';
  if(!(ccYearShift()>0) || ccPastYearIsland()) return '';
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRaceOn==='function' && ccRaceOn())) return '';
  const cr=CAREER.career, cur=Number.isInteger(cr.mapCh) ? cr.mapCh : -1, T=L();
  const b=(i, label)=>'<button class="cc-back'+(i===cur ? ' on' : '')+'" onclick="ccMapPick('+i+')"'+(i===cur ? ' aria-pressed="true"' : '')+'>'+esc(label)+'</button>';
  return '<div class="ch-tile cc-soon cc-mappick"><div class="cc-soon-h">'+esc(T.mapPickH||'Map this year')+'</div>'+
    '<div class="dm-ask">'+b(-1, T.mapPickCycle||'Rotation')+CC_CYCLE_NAMES.map((n, i)=>b(i, n)).join('')+'</div></div>';
}
function ccMapPick(i){
  if(!CAREER || !CAREER.career) return;
  CAREER.career.mapCh=(Number.isInteger(i) && i>=0 && i<CC_CYCLE.length) ? i : null;
  careerSave(); careerRenderHub('centre');
}
function careerBrSet(){
  const py=ccPastYearIsland(); if(py) return py;
  const cy=ccCycleIsland(careerToday()); if(cy) return cy;
  /* Notion «26.10.26», тестер: «we don't have the 2 same map for duo and trio» — в игре один остров на сезон, какой
     ни будь формат. Трио-год на календаре 2026-го сидел на шестой главе (t1–t3), а дуо в те же дни — на седьмой.
     Теперь остров по сезону для обоих; шестая глава — только у 2025-го, где она и была сезоном. */
  if(careerSquadSize()!==3 || !ccIs2025()){
    /* Остров дуо-года — по сезону Fortnite, как у трио-года. Тестер, 16.09:
       «начинается сезон S40, и карта меняется только в соло, а в дуо меняется
       только в сезоне S42». Так и было: до 21 августа дуо-год весь жил на m2.
       Теперь S39–S40 (до 5 июня) — m1, остров Chapter 7 Season 2 (Major 1),
       S41 — m2 (Major 2), с 21 августа — s42. Границы — CC_SEASONS. */
    const d=careerToday();
    /* 2024-й — остров Chapter 5, которого у нас нет (ни карты, ни клеток, ни лута):
       стоим на первом острове Chapter 6 (t1, декабрь 2024) — ближайшем по времени.
       Снять Chapter 5 с fortnite.gg — отдельная работа. */
    /* 2023-й — Chapter 4: остров по Мейджору (C4S1 до 10.03, C4S2 до 9.06, C4S3 до 25.08, дальше
       C4S4 — Копенгаген). Пока островов Chapter 4 в сборке нет, стоят острова 2024-го. */
    if(d>=CC_SEASONS[4].from && ZONE_SETS.s43) return 's43';
    if(d>='2026-08-21') return 's42';
    return d>=CC_SEASONS[2].from ? 'm2' : 'm1';
  }
  const day=careerToday();
  let set='t1';
  CC_TRIO_ISLANDS_2025.forEach(r=>{ if(day>=r.from) set=r.set; });
  return set;
}
/* Остров соло-вечера, не всегда сезонный. Метка и вечер обязаны быть на одном острове.
   Дуо-год: все соло-вечера идут на острове сезона (Solo Series в январе m1, соло-Victory Cup m1/m2, FNCS Solos
   в октябре и сезон с 21 августа s42), поэтому ответ = сезон.
   Трио-год: остров ближайшего соло-вечера. Сезон на шестой главе (t1/t2/t3), а FNCS Solos (ev.spec) на s42solo,
   как их сыграют careerNightSet и runCareerSoloSeries.
   Метка хранится на каждом острове своя (careerSpotStore). Один ответ на вкладку метки, карточку вечера и дом в
   раздаче (ccSoloHomeZone). */
function careerSoloSet(){
  if(careerSquadSize()!==3 || !ccIs2025() || ccPastYearIsland() || ccCycleIsland(careerToday())) return careerBrSet();
  const days=(typeof careerYearDays==='function') ? careerYearDays() : null;
  if(days && typeof careerNightSet==='function' && typeof careerNightSolo==='function'){
    const today=careerToday();
    const ahead=[...days.keys()].filter(d=>d>=today).sort();
    for(const d of ahead){
      const e=(days.get(d)||[]).find(x=>careerNightSolo({type:x.kind, day:d}));
      if(e) return careerNightSet({type:e.kind, day:d});
    }
  }
  return careerBrSet();
}
/* Своя точка на карте и аура на ней. Игрок выбирает локацию на сезон, может сменить; на точке копится аура,
   чтобы туда боялись падать.
   Точка своя на каждый остров (сетки разные): cr.spots = {m2:{i, aura, won, day}, …}.
   Аура растёт от выигранных стычек на своей точке (careerGrowEvent), упирается в CC_SPOT_AURA_MAX и сгорает при
   смене точки. Даёт только меньше ботов на точке: landingScore считает страх как с CONTEST_FEAR, соседом тут
   выступает репутация. К pow ничего не добавляет, сила идёт от рейтинга. */
const CC_SPOT_AURA_MAX=10;
/* Аура в глазах бота, вес 1.05 / 1.0. Сосед в коробке стоит CONTEST_COST = 2.4, полная аура
   CONTEST_COST · CC_SPOT_FEAR · gap, gap = BASE + (твоя сила - его)/CONTEST_FEAR. Чтобы дом обходили, нужно > 2.4.
   Мерить вечером (11 игр, высадка заново перед каждой), не раздачей: 90% тишины на игру = 69% вечеров с коном.
   tools/spot-aura-cup-probe.js, 30 кубков, аура 10: вес 1.00 91% игр один, кон в 37% вечеров; 1.05 98% и 7%;
   1.10 100% и 0%, но точка заперта наглухо. На ауре 7 почти ноль везде: это порог, а не склон.
   Разброс на команду и CC_SPOT_FEAR_SWING (выключен) пробовали, оба хуже. Полная аура теперь замок
   (CC_SPOT_LOCK_ZONES): аура 10 = 100% игр один, 0 конов. Проверка tools/check-spot-aura.js. */
let CC_SPOT_FEAR=1.05, CC_SPOT_FEAR_BASE=1.0;
function careerSpots(){
  const cr=CAREER && CAREER.career;
  if(!cr) return {};
  if(!cr.spots) cr.spots={};
  return cr.spots;
}
/* Спотов ВСЕГО три, и каждый — на своей карте. Его уточнение, 23 августа:
   «всего 3 спота, каждый спот на 1 карту типо… аура фармится на локах одной
   карты, [а другой спот] на карте другой».

   То есть три — это не три коробки на одном острове, а три дома на весь год:
   карт в году пять (карта сезона и четыре круга Релоада), и выбрать под дом
   можно только три из них. На одной карте дом один — там и копится его аура.

   Хранится по-прежнему в cr.spots[остров], по одной записи на карту; предел
   считается по числу карт, где дом уже стоит. Старый сейв мог хранить и один
   объект, и список — careerSpotList поднимает оба вида молча. */
const CC_SPOT_SLOTS=3;
/* Дом привязан к острову, а не к кругу. Кругов Reload четыре (r1..r4), островов два: r1-r2 на Слюрпи
   (art/map-reload-a.jpg), r3-r4 на Стронгхолде. Ключ хранения 'r12' и 'r34'.
   Сеток всё равно четыре (у каждого круга своя дроп-карта, 15 и 13 коробок), один индекс в них значит разное.
   Поэтому храним и точку, центр коробки в процентах острова, по ней находим коробку на любой сетке. Индекс остался
   для старых сейвов и как запасной путь. */
function careerSpotKey(set){
  const k=set||ACTIVE_LANDING_SET;
  if(k==='r1' || k==='r2') return 'r12';
  if(k==='r3' || k==='r4') return 'r34';
  return k;
}
/* Сколько карт уже заняты домом — из ТЕХ, НА КОТОРЫХ ИГРАЮТ В ЭТОМ ГОДУ.

   Баг игрока, 24 августа: «when you play your own career then after a season
   you cant pick the spots anymore». Считалось по всем ключам cr.spots, а год
   меняет сезонный остров: дом на прошлогоднем острове держал слот вечно, и уже
   на второй сезон три слота были заняты — сезонный прошлый, r12 и r34, — а
   новый сезонный остров не влезал. Окно честно писало «все три уже стоят на
   других картах», и поставить дом было нельзя вовсе: карт, на которых играют,
   всего три (см. CC_SPOT_SLOTS и careerSpotSets), и одна из них каждый год
   новая.

   Старые дома при этом НЕ стираются: карта может вернуться (циклы островов у
   Epic), и аура, накопленная на ней, — заработанная. Они просто перестают
   считаться, пока на их острове не играют. */
function careerSpotUsed(){
  return careerSpotSets()
    .map(t=>careerSpotKey(t.key))
    .filter(k=>k!=='solo' && k!=='nations' && !ccIsFmtSpotKey(k) && careerSpotList(k).length).length;
}
function careerSpotRoom(set){
  if(careerSpotKey(set)==='solo' || careerSpotKey(set)==='nations' || ccIsFmtSpotKey(careerSpotKey(set))) return true;      // слоты команды не занимает
  // На этой карте дом уже есть — менять его можно всегда, это не новый спот.
  if(careerSpotList(set).length) return true;
  return careerSpotUsed()<CC_SPOT_SLOTS;
}
/* Возвращает САМ массив, а не копию: по нему и ходят, и правят — снять точку
   значит вырезать её отсюда. Первая версия отдавала `v.filter(...)`, то есть
   новый массив, и careerSpotClear резал копию: точка «снималась» и оставалась
   на месте. Поэтому мусор (пустые дырки от старых сейвов) вычищается здесь же,
   на месте, а наружу уходит живой список. */
function careerSpotList(set){
  const key=careerSpotKey(set);
  const spots=careerSpotStore(key);
  let v=spots[key];
  if(!v) return [];
  // Миграция формата: было {i,aura,won,day} — стало [{...}].
  if(!Array.isArray(v)){ v=[v]; spots[key]=v; }
  for(let k=v.length-1;k>=0;k--) if(!v[k] || v[k].i==null) v.splice(k,1);
  return v;
}
// Первая точка списка — та, что подставляется, когда спрашивают «где дом»
// одним ответом (перемотка, старые вызовы). Остальные равноправны.
function careerSpotOn(set){ return careerSpotList(set)[0] || null; }
// Зона по слоту. Индекс живёт в наборе, а не в ALL_LANDING_ZONES: соло-режим
// дробит сетку (splitLandingZonesForSolo), и один и тот же индекс значил бы
// там другое место. Ищем по геометрии — прямоугольник, накрывающий центр.
/* slot — запись дома: либо сам объект {i, cx, cy}, либо голый индекс (так его
   зовут плитка и старые вызовы). Точка вернее индекса: у каждого круга Релоада
   своя сетка на общем острове, и один индекс значит там разные места. */
function careerSpotZoneOf(slot, set){
  /* Сетка — по КЛЮЧУ ХРАНЕНИЯ, а не по имени острова: у соло свой склад
     (cr.soloSpots), а геометрия у него сезонного острова, и ZONE_SETS['solo']
     не существует. careerSpotGrid переводит ключ в остров — см. careerSpotSets. */
  const grid=ZONE_SETS[careerSpotGrid(set||ACTIVE_LANDING_SET)]||ZONE_SETS[set||ACTIVE_LANDING_SET]||[];
  const obj = (slot && typeof slot==='object') ? slot : null;
  let cx = obj && obj.cx, cy = obj && obj.cy;
  const home = grid[obj ? obj.i : slot];
  if(cx==null || cy==null){
    if(!home) return null;
    cx=home.x+home.w/2; cy=home.y+home.h/2;
  }
  const hit=ALL_LANDING_ZONES.find(z=>cx>=z.x && cx<=z.x+z.w && cy>=z.y && cy<=z.y+z.h)
      || (home ? ALL_LANDING_ZONES.find(z=>Math.abs(z.x-home.x)<0.01 && Math.abs(z.y-home.y)<0.01) : null);
  if(hit) return hit;
  /* Коробки — это POI, а не плитка: между ними есть зазоры, и у одного острова
     сетки бывают разные (соло-FNCS играет ту же s42 на сто клеток вместо
     тридцати). Точка, выбранная на одной сетке, на другой попадает в дырку —
     и дом пропадал совсем. Берём ближайшую коробку, если она рядом: это то же
     место острова, просто нарезанное иначе. Далеко — значит другой остров, и
     дома здесь честно нет. */
  let best=null, bestD=CC_SPOT_NEAR*CC_SPOT_NEAR;
  ALL_LANDING_ZONES.forEach(z=>{
    const dx=(z.x+z.w/2)-cx, dy=(z.y+z.h/2)-cy, d=dx*dx+dy*dy;
    if(d<bestD){ bestD=d; best=z; }
  });
  return best;
}
// Насколько близко «рядом» — в процентах карты. Половина типичной коробки:
// дальше начинается уже соседний POI, а не другая нарезка того же места.
const CC_SPOT_NEAR=6;
function careerSpotZone(set){
  const s=careerSpotOn(set);
  return s ? careerSpotZoneOf(s, set) : null;
}
/* ЧЕЙ ДОМ ЧИТАЕТ ЭТОТ ВЕЧЕР.

   Правка: «в соло ещё метки, не для соло, а для других
   режимов». Метка соло хранится отдельно (cr.soloSpots, ключ 'solo') — плитка
   в хабе и карточка вечера это знали (careerNightSpotKey), а сам вечер нет:
   пикер, страх комнаты, начисление ауры и «сел — значит дом» спрашивали
   ACTIVE_LANDING_SET, то есть сезонный дуо-остров. В соло-вечере на карте
   горела чужая метка, аура капала не туда, а выбранная в соло точка не
   показывалась вовсе.

   Один указатель на весь вечер: раннер соло поднимает его перед посадкой и
   гасит после. Всё остальное спрашивает ccNightSpot(ACTIVE_LANDING_SET). */
let CC_SPOT_NIGHT=null;
function ccNightSpot(set){
  return CC_SPOT_NIGHT || careerSpotKey(set||ACTIVE_LANDING_SET);
}
function ccNightSpotOn(key){ CC_SPOT_NIGHT=key||null; }
function ccNightSpotOff(){ CC_SPOT_NIGHT=null; }
// Все свои зоны острова разом: их подсвечивает пикер и их боятся боты.
function careerSpotZones(set){
  const key=set||ACTIVE_LANDING_SET;
  return careerSpotList(key).map(s=>({slot:s, zone:careerSpotZoneOf(s, key)}))
    .filter(x=>x.zone);
}
// Аура конкретного слота, а без номера — лучшая на острове: чипу и строке
// «сколько накоплено» нужен один ответ.
function careerSpotAura(set, slot){
  const list=careerSpotList(set);
  if(slot!=null) return list[slot] ? (list[slot].aura||0) : 0;
  return list.reduce((m,s)=>Math.max(m, s.aura||0), 0);
}
/* Обратный перевод: клик по прямоугольнику — в индекс набора. В соло сетка
   дроблёная, и кликнутый кусок надо привести к его родителю, иначе метка на
   следующий вечер (дуо) не нашлась бы. Родитель — тот, внутри которого лежит
   центр куска. */
function careerSpotIndexOf(zone, set){
  const grid=ZONE_SETS[set||ACTIVE_LANDING_SET]||[];
  if(!zone) return -1;
  const cx=zone.x+zone.w/2, cy=zone.y+zone.h/2;
  let at=grid.findIndex(z=>cx>=z.x && cx<=z.x+z.w && cy>=z.y && cy<=z.y+z.h);
  if(at<0) at=grid.findIndex(z=>Math.abs(z.x-zone.x)<0.01 && Math.abs(z.y-zone.y)<0.01);
  return at;
}
/* Поставить дом на карте. Пока свободные споты есть, новая карта берётся
   молча; переезд внутри карты жжёт её ауру — репутация остаётся месту, и дома
   на других картах этого не замечают. Клик по своей же коробке не делает
   ничего, иначе промах по карте сжигал бы полсезона. */
function careerSpotSet(i, set, geom){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  // Сетка, по которой кликнули (у ключа-острова своей сетки нет), и остров,
  // на котором ставится дом.
  const from=careerSpotGrid(set||careerBrSet());
  const key=careerSpotKey(set||careerBrSet());
  const spots=careerSpotStore(key);
  const list=careerSpotList(key);
  if(list.some(s=>s.i===i)) return true;         // уже стоит на этой коробке
  if(!careerSpotRoom(key)) return false;         // три карты уже заняты
  // Центр выбранной коробки — то, чем дом найдётся на любой сетке этого
  // острова: у второго круга Релоада своя дроп-карта, и индекса ей мало.
  const box=(ZONE_SETS[from]||[])[i];
  // geom — центр, заданный снаружи: коробка дроблёной соло-сетки, см. ccSoloHomeSet.
  /* Отзыв 2.10 (Notion «02»): «aura should be tied to your character, and if you leave your aura
     gets cut in half». Раньше переезд и каждая новая карта (новый год, новая глава) начинали с нуля,
     и до полного дома нужно было заново пять разгромных вечеров — на каждом острове. Теперь аура
     идёт за игроком: новый дом стартует с половины лучшего, что у него было (старый дом этой карты,
     любой другой дом или рекорд cr.auraBest), округление вниз. Порог страха (CC_SPOT_FEAR) не тронут:
     замок по-прежнему только на полных 10, их надо добрать вечерами уже на новом месте. */
  const carry=Math.floor(careerSpotCarry()/2);
  spots[key]=[{i:i, aura:carry, won:0, day:careerToday(),
               cx: geom && geom.cx!=null ? geom.cx : (box ? box.x+box.w/2 : undefined),
               cy: geom && geom.cy!=null ? geom.cy : (box ? box.y+box.h/2 : undefined)}];
  careerSave();
  return true;
}
// Лучшая аура игрока: все дома (включая острова прошлых лет в cr.spots) и рекорд cr.auraBest.
function careerSpotCarry(){
  const cr=CAREER && CAREER.career; if(!cr) return 0;
  let best=cr.auraBest||0;
  const sp=cr.spots||{};
  Object.keys(sp).forEach(k=>{ const v=sp[k]; (Array.isArray(v) ? v : [v]).forEach(x=>{ if(x && (x.aura||0)>best) best=x.aura; }); });
  return Math.min(CC_SPOT_AURA_MAX, best);
}
// Снять дом с карты — спот освобождается вместе со своей аурой и уходит в
// общий запас: его можно поставить на другую карту.
function careerSpotClear(set){
  const key=careerSpotKey(set||careerBrSet());
  const spots=careerSpotStore(key);
  if(!careerSpotList(key).length) return;
  delete spots[key];
  careerSave();
}
/* Вечер, а не стычка.

   Сначала аура росла на каждую выигранную высадку — и замер
   (career-spot-farm-probe.js) показал, во что это превращается: в комнате на
   пятьдесят своя коробка делится почти каждую игру, за вечер выходит десяток
   стычек, и потолок в десять брался за ДВА вечера. Репутация, которую можно
   выкупить за два вторника, ничего не значит, а он просил фарм на сезон.

   Поэтому единица ауры — вечер: удержал дом (выиграл больше, чем проиграл) —
   плюс один, вынесли дома (проиграл больше) — минус один, поровну — ничего.
   Полный дом стоит десяти удержанных вечеров, то есть половины сезона, и его
   можно потерять, не переезжая: перестал держать — перестали бояться. */
// slot — какая из трёх точек отыграла вечер; ауру получает только она.
/* beef — вечер, в котором дома сошлись те, между кем уже есть ссора. Такой
   вечер сцена запоминает вдвое лучше — в обе стороны.

   Сначала удваивался только плюс, и это было неправдой про то, что я ему сам
   же и обещал: «ускоритель фарма с риском». Односторонний множитель — это не
   риск, а подарок: биф не гаснет сам, пока соперник приходит, а приходит он
   как раз потому, что биф жив (см. CC_BEEF_PULL). Получалась вечная двойная
   ставка без обратной стороны. Теперь разнесённый дома вечер против того же
   человека тоже стоит вдвое. */
function careerSpotNight(won, lost, set, slot, beef){
  const key=set||ACTIVE_LANDING_SET;
  const s=careerSpotList(key)[slot||0];
  if(!s) return 0;
  /* Шкала вечера по замеру. Симметричные +1/-1 давали блуждание: карьера на 92 за 20 вечеров дорастала до 3 и сползала обратно.
         разгром (побед вдвое больше и хотя бы 4)       +2
         удержал (побед больше)                         +1
         поровну                                         0
         разнесли (поражений вдвое больше и хотя бы 4)  -1
     Мелкий минус ничего не отнимает. На этой шкале (career-spot-farm-probe.js, карьера 92, 20 вечеров дома): аура 0 → 5, полный дом примерно за сезон. */
  const w=won||0, l=lost||0;
  let d = (w>=2*l && w>=4) ? 2 : (w>l ? 1 : (l>=2*w && l>=4 ? -1 : 0));
  if(beef) d*=CC_BEEF_AURA;
  if(!d) return 0;
  const before=s.aura||0;
  s.aura=Math.max(0, Math.min(CC_SPOT_AURA_MAX, before+d));
  if(d>0) s.won=(s.won||0)+1;
  { const cr=CAREER && CAREER.career; if(cr && s.aura>(cr.auraBest||0)) cr.auraBest=s.aura; }
  return s.aura-before;
}
/* Имя, за которым следят: гранд-финал (+2) и слот на LAN (+7) добавляются к ауре дома, комната реже
   конит дроп. Та же шкала и потолок, что у ауры (CC_SPOT_FEAR), чтобы не калибровать отдельно;
   копится только при метке дома, как и аура.
   Замер tools/renown-drop-probe.js (30 кубков по 11 игр, комната 50, средняя коробка, карьера 92),
   дом/имя: игр один / вечеров с коном: 0 любое 0%/100%; 1 гранд+LAN 7%/100%; 2 гранд+LAN 70%/77%;
   3 гранд+LAN 99%/7%; 5 нет или гранд 0%/100%; 5 гранд+LAN 99%/3%; 8 нет 6%/100%;
   10 нет 100%/0% (замок, CC_SPOT_LOCK_ZONES). Имя само не защищает, а сдвигает старт по шкале ауры. */
const CC_RENOWN_GRAND=2;   // сыгран гранд-финал мейджора — когда-либо
const CC_RENOWN_LAN=5;     // слот на Global Championship — в этом сезоне
function careerRenown(){
  const cr=CAREER && CAREER.career;
  if(!cr) return 0;
  let r=0;
  if((cr.log||[]).some(x=>x && x.kind==='major' && x.stage==='final')) r+=CC_RENOWN_GRAND;
  /* Слот, а не сыгранный турнир: «you qualify for end of year globals and you
     have another major to play» — весь смысл в мейджорах МЕЖДУ квалификацией и
     ЛАНом. ccGlobalsSeat смотрит этот сезон, поэтому в следующем имя
     начинается заново с гранд-финалов. */
  try{ if(ccGlobalsSeat()) r+=CC_RENOWN_LAN; }catch(e){}
  return r;
}

/* ===== Бифы ==================================================================

   Правка: «можно сделать какие-то бифы в твиттере и за
   локации допустим, ауру фармить, как-то типо».

   Ссора заводится не словами, а картой: если один и тот же человек сходится с
   тобой на ТВОЕЙ точке дважды за полтора месяца, между вами уже что-то есть, и
   лента это замечает. Дальше биф работает в обе стороны — он чаще садится
   тебе на голову (значит стычек больше), а вечер, в котором ты его вынес,
   стоит вдвое дороже по ауре. То есть биф — это ускоритель фарма с риском, а
   не украшение: те же вечера, но крупнее ставка.

   Гаснет сам: месяц без встреч — и запись уходит. Промолчать на его пост тоже
   значит погасить, только сразу. */
const CC_BEEF_WINDOW=45;   // дней, за которые две стычки читаются как одна ссора
const CC_BEEF_NEED=2;      // сколько раз надо сойтись, чтобы это стало бифом
const CC_BEEF_COOL=30;     // дней тишины — и биф гаснет
const CC_BEEF_AURA=2;      // во столько раз дороже вечер, где вынес соперника
const CC_BEEF_PULL=6;      // насколько сильнее его тянет на твою коробку
const CC_BEEF_REACH=1200;  // подписчиков за ответ на его пост
/* Бифы выключены целиком. Отзыв страница «playin»: «убери
   бифы с игры» — лента за один вечер собрала семь одинаковых постов «@… опять
   сел нам на голову»: каждый, с кем сошёлся дважды дома за шесть игр, писал
   свой. Код ссор оставлен на месте, но с этим ключом ни одна встреча не
   записывается, тяги на дом нет, ярлыка на точке нет, а старые посты ссор и
   сами ссоры вычищаются из сейва при загрузке (careerMigrateBeefsOff). */
const CC_BEEFS_ON=false;
function careerBeefs(){
  const cr=CAREER && CAREER.career;
  if(!cr) return [];
  if(!Array.isArray(cr.beefs)) cr.beefs=[];
  return cr.beefs;
}
/* Старые посты ссор уходят из сейва вместе с самими ссорами — иначе лента
   держала бы «Ответить/Промолчать» к тому, чего в игре больше нет. */
function careerMigrateBeefsOff(){
  const cr=CAREER && CAREER.career;
  if(CC_BEEFS_ON || !cr) return;
  if(Array.isArray(cr.news) && cr.news.some(n=>n && n.beef))
    cr.news=cr.news.filter(n=>!(n && n.beef));
  if(Array.isArray(cr.beefs) && cr.beefs.length) cr.beefs=[];
}
function careerBeefOf(handle){
  const k=hKey(handle);
  return careerBeefs().find(b=>hKey(b.h)===k) || null;
}
// Живые ссоры: те, что уже переросли в биф и по которым недавно виделись.
function careerBeefHot(){
  if(!CC_BEEFS_ON) return [];
  const today=careerToday();
  return careerBeefs().filter(b=>b.hot &&
    ccDaysBetween(b.last, today)<=CC_BEEF_COOL);
}
// Лицо чужой команды — тот, кто в ней сильнее: биф с человеком, а не с парой.
function careerBeefFace(team){
  const squad=(team && team.squad) || [];
  let best=null;
  squad.forEach(p=>{ if(!best || ccCardOvr(p)>ccCardOvr(best)) best=p; });
  return best;
}
/* Одна встреча на точке. won — ты его вынес или он тебя.
   Возвращает true, если этой встречей ссора стала бифом. */
function careerBeefBump(card, won){
  if(!CC_BEEFS_ON || !card || !card.handle) return false;
  const today=careerToday();
  const list=careerBeefs();
  let b=careerBeefOf(card.handle);
  if(!b){ b={h:card.handle, w:0, l:0, met:0, since:today, last:today, hot:false}; list.push(b); }
  // Встречи считаются в окне: две стычки в разные концы года — это не ссора.
  if(ccDaysBetween(b.last, today)>CC_BEEF_WINDOW){ b.met=0; b.hot=false; }
  b.met=(b.met||0)+1;
  b.last=today;
  if(won) b.w=(b.w||0)+1; else b.l=(b.l||0)+1;
  if(b.hot || b.met<CC_BEEF_NEED) return false;
  b.hot=true; b.since=today;
  // Первый пост пишет он: это его претензия, не твоя.
  careerNews('bad', 'ccBeefStart', [ccHandle(CAREER.player.nick)], {
    by:{name:card.handle, handle:ccHandle(card.handle), verified:false,
        card:card, ovr:ccCardOvr(card)},
    beef:card.handle});
  return true;
}
/* Что вечер сделал с ссорами: кого ты вынес у себя дома, а кто вынес тебя.
   Зовётся из creditLandingFights — там, где стычки уже прочитаны с карты. */
function careerBeefNight(list){
  const cr=CAREER && CAREER.career;
  if(!CC_BEEFS_ON || !cr || !Array.isArray(list)) return;
  const you=list.find(t=>t.isYou);
  if(!you || !you.landingZone) return;
  // Только дома: биф — это ссора ЗА ЛОКАЦИЮ, а не за случайную коробку.
  const home=careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET)).some(x=>x.zone===you.landingZone);
  if(!home) return;
  const seen=new Set();
  const meet=(team, won)=>{
    if(!team || team===you) return;
    const face=careerBeefFace(team);
    if(!face || seen.has(hKey(face))) return;
    seen.add(hKey(face));
    const was=careerBeefOf(face.handle);
    const hotBefore=!!(was && was.hot);
    careerBeefBump(face, won);
    // Сошёлся дома с тем, с кем уже был биф, — вечер идёт по двойному счёту.
    // Именно СОШЁЛСЯ, а не «вынес»: удваивается и выигранный вечер, и
    // разнесённый, иначе ссора была бы бесплатной ставкой. См. careerSpotNight.
    if(hotBefore) you._beefMet=true;
  };
  list.forEach(t=>{
    if(t===you || !t._droppedOut) return;
    if(t._deathCause===you.name) meet(t, true);
  });
  if(you._droppedOut){
    const killer=list.find(t=>t.name===you._deathCause);
    if(killer) meet(killer, false);
  }
  careerSave();
}
/* Ответить ему или промолчать. Ответ — это громко: подписчики приходят, ссора
   остаётся живой. Молчание её гасит в тот же день, и это честная цена: биф
   кормит ауру, отказ от него кормит спокойствие. */
function careerBeefAnswer(id, how){
  const cr=CAREER && CAREER.career;
  if(!cr) return;
  const post=(cr.news||[]).find(n=>n.id===id);
  if(!CC_BEEFS_ON || !post || !post.beef || post.beefDone) return;
  post.beefDone=how;
  const b=careerBeefOf(post.beef);
  if(how==='hit'){
    careerNews('good', 'ccBeefHit', [ccHandle(post.beef)]);
    careerReachAdd(CC_BEEF_REACH);
    if(b){ b.hot=true; b.last=careerToday(); }
  } else {
    if(b) b.hot=false;
    careerNews('flat', 'ccBeefQuiet', [ccHandle(post.beef)]);
  }
  careerSave();
  careerRenderHub();
}
/* Чего боится комната. Ставится на время расстановки ботов и снимается сразу
   после: landingScore — общая функция, её зовёт и драфт, где никакой карьеры
   нет, и оставленный флаг красил бы чужую игру. */
// Зон три, и у каждой своя аура — поэтому не одна зона с числом, а карта
// зона→аура: комната боится каждой ровно настолько, насколько та заработала.
let CC_SPOT_FEAR_MAP=null, CC_SPOT_FEAR_POW=0;
/* Коробки, куда на время расстановки нельзя вообще: аура на потолке закрывает точку. Без замка полная аура держала 97 вечеров из 100, а сотым прилетал кто-то сильнее (страх гаснет по gap в landingScore).
   Замок вешает только нафармленная аура (десять удержанных вечеров), careerRenown лишь ускоряет рост, иначе слот на LAN и три вечера дома давали бы неприкосновенность.
   Следствие: с закрытой коробки тебя никто не выбьет, аура больше не падает, и соперник по бифу тоже перестаёт долетать. */
let CC_SPOT_LOCK_ZONES=null;
// Дома игрока и ники, с которыми у него открытый биф, — на время расстановки.
let CC_BEEF_ZONES=null, CC_BEEF_SET=null;
// pow — хозяина, иначе «боится тот, кто слабее» не с чем сравнивать. Свою
// команду вечера передаёт тот, кто её уже собрал; без неё берётся рейтинг
// карточки, что верно для хаба и для проб.
/* Насколько репутация весома СЕГОДНЯ. Бросок один на игру и на всю комнату
   сразу — и это принципиально.

   Разброс на каждой команде я пробовал 25 августа: стало хуже, чем без него
   (доля вечеров «ты один» упала с 90% до 5-10%). Причина в том, что решение
   принимает не средний, а самый смелый: чтобы точка осталась пустой, обойти её
   должны ВСЕ сорок девять, и хватает одного, кому бросок выдал маленький страх.

   Один бросок на комнату этим не страдает: в этой игре репутация либо весит
   больше обычного, либо меньше, но одинаково для всех. Отсюда и склон, которого
   он просил, — «чем больше аура, тем реже к тебе падают»: у половины ауры
   тихими выходят те игры, где бросок лёг высоко, у полной — почти все. */
const CC_SPOT_FEAR_SWING=0;      // 0 — без броска; замер ниже, почему
function careerSpotFearOn(you){
  /* ОБЩАЯ КОМНАТА ГОНКИ: страха нет. Аура точек и известность читаются из СВОЕГО сейва, и у
     шести клиентов боты обходили шесть разных домов — раздача комнаты расходилась, как только
     у кого-то выросла аура (годовая проба 8.09: Evaluation 18.12, игра 3, у одного −76 бросков
     на высадке и дальше другой набор вопросов). Своя точка в гонке садится голосом «домой». */
  if(typeof ccRaceLock==='function' && ccRaceLock()){ CC_SPOT_FEAR_MAP=null; CC_SPOT_LOCK_ZONES=null; return; }
  /* И СОЛО ВДВОЁМ В КОМАНДЕ: соло-метка у каждого своя (четвёртая карта, careerSpotSets 'solo'), и боты общей сотни
     обходили у двоих разные точки — вечер расходился на первой же высадке (командный год 20.10: хиты Solo Series 17.01,
     «drop=101/728691 vs drop=101/109494»). Дуо-метка у команды одна, там страх остаётся. */
  if(typeof ccMpOn==='function' && ccMpOn() && squadSize===1){ CC_SPOT_FEAR_MAP=null; CC_SPOT_LOCK_ZONES=null; CC_BEEF_ZONES=null; CC_BEEF_SET=null; return; }
  /* Дом боятся за две вещи разом: за то, сколько ты его держал (аура), и за то,
     кто ты теперь (careerRenown — гранд-финал и слот на LAN). Оба слагаемых
     живут на одной шкале и вместе упираются в тот же потолок. */
  const renown=careerRenown();
  const mine=careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET));
  const zones=mine
    .map(x=>({zone:x.zone, fear:Math.min(CC_SPOT_AURA_MAX, (x.slot.aura||0)+renown)}))
    .filter(x=>x.fear>0);
  const swing=1 - CC_SPOT_FEAR_SWING + Math.random()*CC_SPOT_FEAR_SWING*2;
  CC_SPOT_FEAR_MAP = zones.length
    ? new Map(zones.map(x=>[x.zone, x.fear*swing])) : null;
  // Потолок — не цена, а замок: см. CC_SPOT_LOCK_ZONES. Считается по своей
  // ауре, без имени.
  const locked=mine.filter(x=>(x.slot.aura||0)>=CC_SPOT_AURA_MAX);
  CC_SPOT_LOCK_ZONES = locked.length ? new Set(locked.map(x=>x.zone)) : null;
  const pl=CAREER && CAREER.player;
  CC_SPOT_FEAR_POW = (you && you.pow) ||
    (pl ? (pl.ovrExact!=null ? pl.ovrExact : pl.ovr) : 0) || 0;
  /* И кого твоя точка, наоборот, ПРИТЯГИВАЕТ. Ставится отдельным набором, а не
     вместе со страхом: бояться начинают с первой ауры, а ссориться можно и на
     пустом доме — биф не про репутацию места, а про конкретного человека.
     Дома здесь все три, включая те, где ауры ещё нет. */
  /* Соперник по ссоре падает в один твой дом за игру, а не во все сразу. Тяга 6 при разбросе раздачи 1.15
     перебивает всё; на всех трёх домах он был на игроке в 100% игр против 13% без ссоры (career-beef-pull-probe.js).
     Команда высаживается в одной коробке, значит и охотится в одной, какую выбрать, решает игра. С тремя домами
     встреча примерно раз в три игры, с одним всегда.
     Сама тяга не ослаблена, страх её не перебивает. */
  const homes=careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET));
  CC_BEEF_ZONES = homes.length
    ? new Set([homes[Math.floor(Math.random()*homes.length)].zone]) : null;
  const hot=careerBeefHot();
  CC_BEEF_SET = hot.length ? new Set(hot.map(b=>hKey(b.h))) : null;
}
function careerSpotFearOff(){
  CC_SPOT_FEAR_MAP=null; CC_SPOT_FEAR_POW=0; CC_SPOT_LOCK_ZONES=null;
  CC_BEEF_ZONES=null; CC_BEEF_SET=null;
}
function dateKey(t){
  return t.getUTCFullYear()+'-'+String(t.getUTCMonth()+1).padStart(2,'0')+'-'+
         String(t.getUTCDate()).padStart(2,'0');
}

// Every tournament in the season, pinned to a day. Division 1 plays a different
// week from everybody else — two sessions and a final instead of one window — and
// it is the only division with a Performance Evaluation, so the same week fills
// with different squares depending on where you are standing.
// The cover a day wears in the calendar.
//
// The divisional cups were guessed at first and the guess was wrong. Epic's own
// event list settles it: Division 1 through 5 all carry the same picture, and it
// is the season's FNCS key art — the crest on ice — which is the same image the
// Majors carry. One season, one cover, and the division is a label on it rather
// than a different picture.
//
// So the cups take that art too, and cup, Major and Global Championship are told
// apart by the tone of the scrim over them instead of by different pictures.
// That is the honest split: the artwork is Epic's, the tint is this interface
// saying which kind of week it is.
//
// The Global Championship is the exception it should be. It has no 2026 cover in
// the project at all, and borrows the 2025 season-finale art rather than wearing
// the same picture as a Tuesday.
// The season's own key art, added for this: `fncs-2026.jpg` is the 2026 FNCS
// cover — crest, broken white plate, holographic chrome — which is the picture
// the divisional cups carry, and `fncs-2026-major1.jpg` is the same set with the
// MAJOR 1 SUMMIT lockup on it. The mode screen's older crops are left where they
// are; these two belong to the career.
const CAREER_EV_ART={
  cup:  'art/fncs-2026.jpg',
  final:'art/fncs-2026.jpg',
  eval: 'art/fncs-2026.jpg',
  major:'art/fncs-2026-major1.jpg',
  gc:   'art/mode-major3-2025.jpg',
  // The Reload Elite Series is not FNCS and does not wear its crest: it carries
  // the circuit's own tile art, the one the mode screen uses.
  reload: 'art/mode-ewc.jpg',
  // Open to everybody and not part of the divisional ladder, so it does not wear
  // the FNCS crest either.
  // The Victory Cup wore the Reload circuit's tile art, so a Duos Victory Cup
  // in January read as a Reload night. It is an open duos event and there is a
  // duos crop in the folder; the circuit keeps its own.
  victory: 'art/mode-duo.jpg',
  // The Solo Series is an open solo circuit, not FNCS — same call as the
  // Victory Cup, and the same crop until a solo one exists in the folder.
  solo: 'art/mode-duo.jpg',
  /* Церемония закрытия носит герб сезона — тот же ключевой арт, что стоит на
     полосе карьеры на главной и в шапке хаба. Год кончается тем же знаком,
     под которым он шёл. См. careerEvents и ccGalaDraw. */
  gala: 'art/fncs-2026.jpg'
};
/* Обложка по САМОМУ СОБЫТИЮ, а не по его виду, — там где вид врёт.

   Вид 'solo' носят два разных турнира: январская Solo Series, открытый соло-круг
   вне FNCS, и FNCS Solos 2026, который FNCS и есть. Одна обложка на оба была бы
   неправдой в любую сторону, поэтому у FNCS Solos своя, а январский круг
   остаётся на нейтральном кропе (см. комментарий у solo выше).

   art/fncs-solo.jpg собрана 2 сентября 2026 из официального арта Epic: у соло-
   этапов и постер, и фон — тот же FNCS 2026, отдельной обложки Epic не выпускает,
   поэтому на их фон положен заголовок в том же языке, что на их же обложке
   Reload Solo — герб сверху, мелкое FORTNITE, крупное FNCS SOLO, полоска в цветах
   события из imp_event.Colors. */
const CAREER_EV_ART_ID={
  // Мейджоры 2025-го — со своими постерами Epic (те же, что на плитках драфта); Лион — Major 3's.
  Major1_2025_PlayIn:'art/mode-major1-2025.jpg', Major1_2025_Group1:'art/mode-major1-2025.jpg', Major1_2025_Group2:'art/mode-major1-2025.jpg', Major1_2025_Group3:'art/mode-major1-2025.jpg', Major1_2025_LCQ:'art/mode-major1-2025.jpg', Major1_2025_LCLobby:'art/mode-major1-2025.jpg', Major1_2025_Final:'art/mode-major1-2025.jpg',
  Major2_2025_PlayIn:'art/mode-major2-2025.jpg', Major2_2025_Group1:'art/mode-major2-2025.jpg', Major2_2025_Group2:'art/mode-major2-2025.jpg', Major2_2025_Group3:'art/mode-major2-2025.jpg', Major2_2025_LCQ:'art/mode-major2-2025.jpg', Major2_2025_LCLobby:'art/mode-major2-2025.jpg', Major2_2025_Final:'art/mode-major2-2025.jpg',
  Major3_2025_PlayIn:'art/mode-major3-2025.jpg', Major3_2025_Group1:'art/mode-major3-2025.jpg', Major3_2025_Group2:'art/mode-major3-2025.jpg', Major3_2025_Group3:'art/mode-major3-2025.jpg', Major3_2025_LCQ:'art/mode-major3-2025.jpg', Major3_2025_LCLobby:'art/mode-major3-2025.jpg', Major3_2025_Final:'art/mode-major3-2025.jpg',
  GlobalChampionship2025:'art/mode-major3-2025.jpg',
  // 2024-й — своих постеров нет; дуо-обложка драфта и она же на Форт-Уэрт.
  GlobalChampionship2024:'art/map-f4.jpg',
  // 2023-й — острова своих финалов (Chapter 4): Мейджор n — остров e<n>, LCM и Копенгаген — e4.
  GlobalChampionship2023:'art/map-e4.jpg',
  Major1_2024_Q1R1:'art/map-f1.jpg', Major1_2024_Q1R2:'art/map-f1.jpg', Major1_2024_Q1R3:'art/map-f1.jpg', Major1_2024_Q2R1:'art/map-f1.jpg', Major1_2024_Q2R2:'art/map-f1.jpg', Major1_2024_Q2R3:'art/map-f1.jpg', Major1_2024_Semi1:'art/map-f1.jpg', Major1_2024_Semi2:'art/map-f1.jpg', Major1_2024_Semi3:'art/map-f1.jpg', Major1_2024_Final:'art/map-f1.jpg', Major2_2024_Q1R1:'art/map-f2.jpg', Major2_2024_Q1R2:'art/map-f2.jpg', Major2_2024_Q1R3:'art/map-f2.jpg', Major2_2024_Q2R1:'art/map-f2.jpg', Major2_2024_Q2R2:'art/map-f2.jpg', Major2_2024_Q2R3:'art/map-f2.jpg', Major2_2024_Semi1:'art/map-f2.jpg', Major2_2024_Semi2:'art/map-f2.jpg', Major2_2024_Semi3:'art/map-f2.jpg', Major2_2024_Final:'art/map-f2.jpg', Major3_2024_Q1R1:'art/map-f3.jpg', Major3_2024_Q1R2:'art/map-f3.jpg', Major3_2024_Q1R3:'art/map-f3.jpg', Major3_2024_Q2R1:'art/map-f3.jpg', Major3_2024_Q2R2:'art/map-f3.jpg', Major3_2024_Q2R3:'art/map-f3.jpg', Major3_2024_Semi1:'art/map-f3.jpg', Major3_2024_Semi2:'art/map-f3.jpg', Major3_2024_Semi3:'art/map-f3.jpg', Major3_2024_Final:'art/map-f3.jpg',
  Showdown4_2025_LCQ:'art/mode-trio.jpg', Showdown4_2025_Final:'art/mode-trio.jpg', Showdown5_2025_LCQ:'art/mode-trio.jpg', Showdown5_2025_Final:'art/mode-trio.jpg', Showdown6_2025_LCQ:'art/mode-trio.jpg', Showdown6_2025_Final:'art/mode-trio.jpg',
  FNCSSolos_Q1Round1:'art/fncs-solo.jpg', FNCSSolos_Q2Round1:'art/fncs-solo.jpg', FNCSSolos_Q1Round2:'art/fncs-solo.jpg', FNCSSolos_Q1Round3:'art/fncs-solo.jpg',
  FNCSSolos_FastTrack:'art/fncs-solo.jpg', FNCSSolos_Q2Round2:'art/fncs-solo.jpg',
  FNCSSolos_Q2Round3:'art/fncs-solo.jpg', FNCSSolos_Heats:'art/fncs-solo.jpg', FNCSSolos_Heats2:'art/fncs-solo.jpg',
  FNCSSolos_LCQRound1:'art/fncs-solo.jpg', FNCSSolos_LCQFinal:'art/fncs-solo.jpg',
  FNCSSolos_Final:'art/fncs-solo.jpg',
  FNCSSoloReload_Round2:'art/fncs-solo.jpg',
  FNCSSoloReload_Round3:'art/fncs-solo.jpg',
  FNCSSoloReload_Heats:'art/fncs-solo.jpg',
  FNCSSoloReload_LCQRound1:'art/fncs-solo.jpg',
  FNCSSoloReload_LCQFinal:'art/fncs-solo.jpg',
  FNCSSoloReload_Final:'art/fncs-solo.jpg',
  // Pro-Am играется на острове Reload — арт берём Reload'а, своего у нас нет.
  ProAm_Dallas:'art/mode-ewc.jpg',
  ProAm_SaoPaulo:'art/mode-ewc.jpg',
  ProAm_Paris:'art/mode-ewc.jpg',
  ProAm_Seoul:'art/mode-ewc.jpg',
  proam:'art/mode-ewc.jpg',
  nations:'art/mode-squad.jpg'
};
/* Капы — в своих постерах из игры: вкладка «Соревнования» показывала у каждого капа постер
   Epic (poster_front_image), архив Tracker (events/archived, EU, 2019–2026) хранит его у
   каждого события; файлы — cdn2.unrealengine.com, в art/cups. Ключ — id события Epic;
   Epic и сам переиспользовал постеры (у S19 Duos — трио-постер S18), это их выбор, не наш.
   Трио-кэшкапа 2019 (S10) в архиве нет, но на его странице Tracker висит плитка режима Epic (10BR CashCup ModeTile Trios) — она. */
const CC_CUP_POSTER={
  S10_CC_Trios:'cups/c10t',
  S15_CashCup:'cups/c15', S15_SoloCashCup:'cups/c15', S16_CashCup:'cups/c16t', S16_SoloCashCup:'cups/c16s',
  S17_CashCup:'cups/c17t', S17_SoloCashCup:'cups/c17s', S18_CashCup:'cups/c18t', S18_SoloCashCup:'cups/c18s',
  S19_DuosCashCup:'cups/c18t', S19_SoloCashCup:'cups/c17s', S20_DuosCashCup:'cups/c20d', S20_SoloCashCup:'cups/c20s',
  S21_DuosCashCup:'cups/c21d', S21_SoloCashCup:'cups/c21s', S23_SoloCashCup:'cups/c23s',
  S24_DuosCashCup:'cups/c24d', S24_SoloVictoryCup:'cups/c23s', S25_DuosCashCup:'cups/c25d', S25_SoloVictoryCashCup:'cups/c25s',
  S26_DuosCashCup:'cups/c25d', S26_SoloVictoryCashCup:'cups/c25s', S28_DuosCashCup:'cups/c25d', S28_SoloVictoryCup:'cups/c25s',
  S29_DuosCashCup:'cups/c25d', S29_SoloVictoryCup:'cups/c29s', S30_DuosCashCup:'cups/c25d', S30_SoloVictoryCup:'cups/c29s',
  S31_DuosCashCup:'cups/c25d', S31_SoloVictoryCup:'cups/c31s', S36_SquidGroundsCashCup:'cups/c36',
  S39_DuosVictoryCup:'cups/c38d', S39_SoloVictoryCup:'cups/c38s', S40_SoloVictoryCup:'cups/c38s', S41_SoloVictoryCup:'cups/c38s',
  S41_ReloadSoloVictoryCup:'cups/c41r', S43_SquadsVictoryCup:'cups/c43q', S43_TriosCashCup:'comp/fnce-33-30-tileview-cash-cups-03-800x800-800x800-7e4d95d3afe5',
  S22_DivisionalCups:'cups/d22', S23_DivisionalCups:'cups/d23', S33_FNCSDivisionalCup:'cups/d33', S34_FNCSDivisionalCup:'cups/d34',
  S36_FNCSDivisionalCup:'cups/d34', S39_FNCSDivisionalCup:'cups/d39', S40_FNCSDivisionalCup:'cups/d39', S41_FNCSDivisionalCup:'cups/d41',
  S42_FNCSDivisionalCup_Division1:'cups/d39'
};
