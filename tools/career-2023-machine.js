/* ---- Мейджор 2023-го ----------------------------------------------------------
   Формат Epic (окна Tracker, Liquipedia; спека career-year-2023-design.md):
   неделя — Day 1 (открытый: вся лестница региона; у Мейджора 1 — только дивизион 1,
   Elite) → топ-200 → Day 2 → топ-50 → финал недели, шесть игр, очки серии по месту.
   После трёх недель — топ-40 серии в Гранд-финал, ещё десять — из Surge Week (у
   Мейджора 3 её нет: все 50 по серии). Гранд-финал — 50 дуо, двенадцать игр.
   «Мейджор 4» — Last Chance Major: одна неделя (топ-250 → топ-50 → финал), финал
   раздаёт места в нижнюю сетку Копенгагена по квоте региона.

   Недели, в которые игрок не играл (или вылетел), досчитываются молча: финал
   недели нужен серии целиком, иначе топ-40 решали бы только сыгранные вечера. */
const CC_M23={
  d1:{games:10, cut:200, open:true},
  d2:{games:10, cut:50},
  wf:{games:6, cut:0},
  surge:{games:10, cut:10},
  final:{games:12, cut:0},
  field:50, seriesTop:40,
  lcm:{d1:{games:10, cut:250, open:true}, d2:{games:10, cut:50}, wf:{games:6, cut:0}}
};
// Очки серии за место в финале недели (Liquipedia, FNCS 2023 Week Finals): 625, 600,
// дальше минус пять до 45-го (385), 46-е — 355 … 50-е — 335.
const CC_M23_SERIES=(function(){
  const t=[625];
  for(let p=2; p<=45; p++) t.push(600-5*(p-2));
  for(let p=46; p<=50; p++) t.push(355-5*(p-46));
  return t;
})();
function ccM23SeriesPts(place){ return (place>=1 && place<=CC_M23_SERIES.length) ? CC_M23_SERIES[place-1] : 0; }
function ccM23Spec(ev){ return ((ev.n===4) ? CC_M23.lcm : CC_M23)[ev.stage] || CC_M23.final; }
function ccM23Weeks(n){ return n===4 ? 1 : 3; }
function ccM23HasSurge(n){ return n===1 || n===2; }
function ccM23Top(n){ return ccM23HasSurge(n) ? CC_M23.seriesTop : CC_M23.field; }
function ccM23Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major23;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM23State(n){
  const cr=CAREER.career;
  let m=ccM23Of(n);
  if(!m) m=cr.major23={n:n, season:cr.season, got:{}, wk:{}, series:{}, seriesRows:{}, surgeTop:null, youKey:null};
  return m;
}
// День события по его id в календаре года (первый день строки).
function ccM23Day(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2023_'+tail);
  return row ? row[0] : null;
}
function ccM23SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
// Карточки своего состава — чтобы мир не посадил тебя же в чужую комнату.
function ccM23Mine(){
  const me=(typeof careerCard==='function') ? careerCard() : null;
  return me ? [me].concat(careerMates().filter(Boolean)) : [];
}
// Мир для молчаливых комнат: сцена от лица дивизиона 1, острота финала.
function ccM23World(size, salt){
  const cr=CAREER.career;
  return careerCupField(Object.assign({}, cr, {division:1}), ccM23Mine(), size, salt, false, CC_FIELD_SHARP.final);
}
/* Финал недели, досчитанный молча. Комната — вчерашний топ-50 недели, если он записан
   (игрок был, но вылетел), иначе топ-50 первого дня, иначе сцена. */
function ccM23SettleWeek(m, w){
  const wk=m.wk[w]=m.wk[w]||{};
  if(wk.f) return;
  const day=ccM23Day(m.n, 'W'+w+'F');
  if(!day || careerToday()<day) return;          // неделя ещё не сыграна
  const src=(wk.d2 && wk.d2.length) ? wk.d2 : (wk.d1 && wk.d1.length) ? wk.d1.slice(0, CC_M23.field) : null;
  let room=src ? src.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M23.field){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(CC_M23.field+20, 'm23|'+m.n+'|'+w).forEach(t=>{
      if(room.length>=CC_M23.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, CC_M23.field);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m23wf|'+m.season+'|'+m.n+'|'+w, ()=>simulateGames(room, CC_M23.wf.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  if(m.n!==4) ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM23SeriesPts(i+1); m.seriesRows[k]=ccMajorSeatRow(t); });
  wk.f=ranked.map(ccMajorSeatRow);
}
function ccM23SettleWeeks(m){ for(let w=1; w<=ccM23Weeks(m.n); w++) ccM23SettleWeek(m, w); }
// Серия по порядку: ключи и записи от первого места.
function ccM23SeriesOrder(m){
  return Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).map(k=>({key:k, row:m.seriesRows[k]}));
}
// Комната Surge Week: места серии 41–90 (игрок — если он вне топ-40).
function ccM23SurgeRows(m){
  ccM23SettleWeeks(m);
  const top=ccM23Top(m.n);
  return ccM23SeriesOrder(m).slice(top, top+CC_M23.field).map(x=>x.row);
}
// Surge Week, досчитанная молча.
function ccM23SettleSurge(m){
  if(m.surgeTop || !ccM23HasSurge(m.n)) return;
  const day=ccM23Day(m.n, 'Surge');
  if(!day || careerToday()<day) return;
  const room=ccM23SurgeRows(m).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.surgeTop=[]; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m23surge|'+m.season+'|'+m.n, ()=>simulateGames(room, CC_M23.surge.games, ccM24Points, CC_M24_KILL));
  m.surgeTop=ccM24Rank(room).slice(0, CC_M23.surge.cut).map(ccMajorSeatRow);
}
/* Гранд-финал — пятьдесят: топ серии (40, у Мейджора 3 — 50) и топ-10 Surge Week;
   недобор — следующими по серии. */
function ccM23GfRows(m){
  if(!m) return null;
  ccM23SettleWeeks(m); ccM23SettleSurge(m);
  const out=[], seen=new Set();
  const key=r=>r==='you' ? 'you' : JSON.stringify(r);
  const add=r=>{ const k=key(r); if(!r || seen.has(k) || out.length>=CC_M23.field) return; seen.add(k); out.push(r); };
  const order=ccM23SeriesOrder(m);
  order.slice(0, ccM23Top(m.n)).forEach(x=>add(x.row));
  (m.surgeTop||[]).forEach(add);
  order.forEach(x=>add(x.row));
  return out;
}
// Билет в Гранд-финал. До дня финала — по текущему месту в серии (подсказка календарю).
function ccM23Ticket(m){
  if(!m || !m.youKey) return false;
  const fin=ccM23Day(m.n, 'Final');
  if(fin && careerToday()>=fin){ const rows=ccM23GfRows(m); return !!(rows && rows.indexOf('you')>=0); }
  const k=ccM23SeriesRank(m, m.youKey);
  return k>0 && k<=ccM23Top(m.n);
}
// Финал для мира (без игрока): из записи, без неё — верх сцены.
function ccM23WorldFinalRoom(m, drafted, lobbyCr){
  const rows=m ? ccM23GfRows(m) : null;
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M23.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M23.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M23.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M23.field);
}
// Квоты Копенгагена своего региона (участники Liquipedia по дорогам; NA West — в NAC).
function ccGc23Seats(route){
  let r=careerPrizeRegion(); if(r==='NAW') r='NAC';
  const t=GC2023_SEATS[route]||{};
  return t[r]!=null ? t[r] : 0;
}
function ccM23CanStage(ev, cr, gaveUp){
  const s=ccM23Of(ev.n);
  if(s && s.got[ev.id]) return false;
  const wk=s && s.wk[ev.w];
  if(ev.stage==='d1'){
    // Мейджор 1 — только Elite (дивизион 1), как токен EliteCupAccessS23 у Epic.
    if(ev.n===1 && !ccNoDivisions() && cr.division!==1) return false;
    // Last Chance Major — для тех, кто в Копенгаген ещё не едет.
    if(ev.n===4){ const seat=ccGlobalsSeat(); if(seat) return false; }
    return true;
  }
  if(ev.stage==='d2') return !!(wk && wk.d1 && wk.d1.indexOf('you')>=0);
  if(ev.stage==='wf') return !!(wk && wk.d2 && wk.d2.indexOf('you')>=0);
  if(ev.stage==='surge'){
    if(!s || !s.youKey) return false;
    ccM23SettleWeeks(s);
    const k=ccM23SeriesRank(s, s.youKey);
    return k===0 || k>ccM23Top(ev.n);
  }
  return !gaveUp && ccM23Ticket(s);
}
async function runCareerMajor2023(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y23 || !careerMajorCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const m=ccM23State(ev.n);
  const rowsOf=rows=>(rows||[]).map(r=>r==='you' ? you : ccMajorTeamFrom(r));
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  const spec=ccM23Spec(ev);
  const wk=(ev.w ? (m.wk[ev.w]=m.wk[ev.w]||{}) : null);
  const stageLabel=ev.label;
  const open=(ev.stage==='d1');
  let field;
  if(open){
    // Мейджор 1 — комната Elite (дивизион 1), остальные — вся лестница региона.
    const elite=(ev.n===1 && !ccNoDivisions());
    field=[you, ...careerCupField(elite ? Object.assign({}, cr, {division:1}) : cr, drafted,
      elite ? careerCupSize(1) : careerLadderEntrants(), 'm23|'+ev.n+'|'+ev.w, !elite, 0)];
  } else if(ev.stage==='d2') field=rowsOf(wk.d1);
  else if(ev.stage==='wf') field=rowsOf(wk.d2);
  else if(ev.stage==='surge'){ field=rowsOf(ccM23SurgeRows(m)); if(field.indexOf(you)<0) field.push(you); }
  else {
    field=rowsOf(ccM23GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M23.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
  }
  CC_M24_GAME=0;
  await simulateGamesLive(field, spec.games, ccM24Points, CC_M24_KILL, 'stage', 0, null, null,
    {lobbySize:ccTeams(50), stageName:stageLabel, mapReplay:true, choices:true, stopOnYourDeath:true,
     roomOnly:!open,
     dropEachGame:(g,room)=>{ CC_M24_GAME=g;
       return open ? null : careerLandingPick(room||field, you, stageLabel, ['major']); }});
  const ranked=ccM24Rank(field);
  const place=ranked.indexOf(you)+1;
  let through=false, note='';
  m.got[ev.id]=true;
  if(ev.stage==='d1' || ev.stage==='d2'){
    through=place<=spec.cut;
    wk[ev.stage]=ranked.slice(0, spec.cut).map(seedOf);
    note=through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut);
  } else if(ev.stage==='wf'){
    wk.f=ranked.map(seedOf);
    if(ev.n===4){
      const seats=ccGc23Seats('lcm');
      through=place<=seats;
      m.lcmPlace=place;
      note=L().ccYr23LcmSeat(seats);
    } else {
      ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM23SeriesPts(i+1); m.seriesRows[k]=seedOf(t); });
      m.youKey=ccSeatKey(you);
      // Недели до этой, которые игрок пропустил, — в серию тоже.
      for(let w=1; w<ev.w; w++) ccM23SettleWeek(m, w);
      const k=ccM23SeriesRank(m, m.youKey), top=ccM23Top(ev.n);
      through=k>0 && k<=top;
      note=L().ccYr24Series(m.series[m.youKey]||0, k);
    }
  } else if(ev.stage==='surge'){
    m.surgeTop=ranked.slice(0, spec.cut).map(seedOf);
    through=place<=spec.cut;
    note=through ? L().ccYr23SurgeWon : L().ccRelFail(spec.cut);
  }
  removeSkipButton();
  const fin=ev.stage==='final';
  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false,
    fin ? ccMajorSeatNote(ev) : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
  careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));
    m.gf=ranked.map(seedOf);
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut',
               [ev.label, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(!through && spec.cut && place===spec.cut+1) careerNews('bad', 'ccPostOneOff', [ev.label]);
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:false};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  /* Финал Last Chance Major пишется как 'lcm': место в нижнюю сетку Копенгагена
     читается отсюда (ccGlobalsSeat). */
  const stageRec=fin ? 'final' : (ev.n===4 && ev.stage==='wf') ? 'lcm' : ev.stage;
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division,
               place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : through,
               ovr:CAREER.player.ovr, games:spec.games, wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:stageRec,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined,
               top: fin ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  const lanSeat=(fin || (ev.n===4 && ev.stage==='wf')) && ccGlobalsSeat() ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length,
    through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note,
    seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}

/* ---- Копенгаген 2023 -----------------------------------------------------------
   Royal Arena, 13–15 октября (Liquipedia): день 1 — верхняя сетка, 50 дуо с Мейджоров,
   пять игр, топ-25 в финал, остальные вниз; день 2 — нижняя: 25 упавших и 24 с Last
   Chance Major, пять игр, топ-25 в финал; день 3 — финал на 50, шесть игр.
   Залы — настоящие дуо по дорогам (GC2023_DUOS) карточками 2023-го; своё место
   вытесняет одно. Без игрока мир играет только финал (careerWorldFinals). */
/* Строка зала — ники: люди приезжают из всех регионов, и собрать их обратно по сцене
   своего региона (ccMajorTeamFrom) значило бы вернуть чужих игроков без рейтинга.
   ccLanTeam находит настоящую карточку года в любом регионе. */
function ccGc23Row(t){ return (t.squad||[]).map(c=>c && c.handle).filter(Boolean); }
function ccGc23Team(row){ return ccLanTeam(row, null, 85, null); }
const CC_GC23={upper:{games:5, cut:25}, lower:{games:5, cut:25}, final:{games:6, cut:0}, field:50};
function ccGc23Build(routes, rating, seated, limit){
  const out=[];
  routes.forEach(route=>(GC2023_DUOS[route]||[]).forEach(d=>{
    if(out.length>=limit) return;
    const duo=d.length>=2 ? d : [d[0], d[0]];
    const t=ccLanTeam(duo.slice(0, 2), null, rating, seated);
    if(t){ t.gcRoute=route; out.push(t); }
  }));
  return out;
}
function ccGc23Fill(room, limit, seated){
  if(room.length>=limit) return room;
  const lanCr=Object.assign({}, CAREER.career, {division:1});
  careerCupField(lanCr, ccM23Mine(), 80, null, false, CC_FIELD_SHARP.lan).forEach(t=>{
    if(room.length>=limit) return;
    const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
    if(keys.some(k=>seated.has(k))) return;
    keys.forEach(k=>seated.add(k)); room.push(t);
  });
  return room;
}
// Мировой финал (без игрока) — пятьдесят дуо верхней сетки.
function buildGlobalChampionship2023Field(you){
  const seated=new Set();
  const own=you && !you._stub ? you : null;
  if(own) (own.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const room=ccGc23Fill(ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field-(own?1:0)), CC_GC23.field-(own?1:0), seated);
  if(own){ own.gcRoute='m3'; room.push(own); }
  return room;
}
function ccGc23State(){
  const cr=CAREER.career;
  if(!cr.gc23 || cr.gc23.season!==cr.season) cr.gc23={season:cr.season, finals:null, lower:null, lowerDone:false, you:null};
  return cr.gc23;
}
// Верхняя сетка без игрока (он пришёл через Last Chance Major): топ-25 — в финал, остальные вниз.
function ccGc23SettleUpper(st, you){
  if(st.lower) return;
  const seated=new Set(); ((you && you.squad)||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const room=ccGc23Fill(ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field), CC_GC23.field, seated);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('gc23up|'+st.season, ()=>simulateGames(room, CC_GC23.upper.games, majorPoints, CC_GLOB_KILL));
  const ranked=ccM24Rank(room);
  st.finals=ranked.slice(0, CC_GC23.upper.cut).map(ccGc23Row);
  st.lower=ranked.slice(CC_GC23.upper.cut).map(ccGc23Row);
}
// Нижняя сетка без игрока (он уже в финале): её топ-25 дописываются в финал.
function ccGc23SettleLower(st, you){
  if(st.lowerDone) return;
  const seated=new Set(); ((you && you.squad)||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  (st.finals||[]).forEach(r=>{ if(r!=='you') r.forEach(h=>seated.add(_gcNorm(h))); });
  let room=(st.lower||[]).filter(r=>r!=='you').map(ccGc23Team);
  room.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p && p.handle))));
  room=room.concat(ccGc23Build(['lcm'], 84, seated, CC_GC23.field-room.length));
  room=ccGc23Fill(room, CC_GC23.field, seated);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('gc23low|'+st.season, ()=>simulateGames(room, CC_GC23.lower.games, majorPoints, CC_GLOB_KILL));
  st.finals=(st.finals||[]).concat(ccM24Rank(room).slice(0, CC_GC23.lower.cut).map(ccGc23Row));
  st.lowerDone=true;
}
async function runCareerGlobals2023(){
  const cr=CAREER.career;
  const ev=careerGlobalsOn(careerToday());
  if(!ev || !careerGlobalsCan(ev)) return;
  const mpStart=ccMpLock() ? await ccMpGate('globals') : null;
  const seat=ccGlobalsSeat();
  careerCampBonus('globals', ev.id||ev.label||'');
  careerLanArrive('globals', ev);
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  useLandingSet(ACTIVE_LANDING_SET);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const st=ccGc23State();
  const day=ccGc23DayOf(careerToday());          // 1 верхняя, 2 нижняя, 3 финал
  const seated=new Set(); (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const rowsOf=rows=>(rows||[]).map(r=>r==='you' ? you : ccGc23Team(r));
  const seedOf=t=>ccSeedRow(t, you, ccGc23Row);
  let field, spec;
  if(day===1){
    spec=CC_GC23.upper;
    field=ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field-1);
    field=ccGc23Fill(field, CC_GC23.field-1, seated);
    field.push(you);
  } else if(day===2){
    spec=CC_GC23.lower;
    // Пришёл через Last Chance Major — верхняя сетка вчера сыграна без него.
    ccGc23SettleUpper(st, you);
    // Упавшие из верхней (записаны вчера) и 24 с Last Chance Major.
    field=rowsOf(st.lower||[]);
    field.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p && p.handle))));
    const lcm=ccGc23Build(['lcm'], 84, seated, CC_GC23.field-field.length-(field.indexOf(you)<0 ? 1 : 0));
    field=field.concat(lcm);
    if(field.indexOf(you)<0) field.push(you);
    field=ccGc23Fill(field, CC_GC23.field, seated);
  } else {
    spec=CC_GC23.final;
    // Прошёл из верхней — нижняя вчера сыграна без него.
    ccGc23SettleLower(st, you);
    field=rowsOf(st.finals||[]);
    if(field.indexOf(you)<0) field.push(you);
    field=ccGc23Fill(field, CC_GC23.field, seated);
  }
  // Имя дня — сеткой, а не «сессией N»: у Копенгагена у каждого дня своё название.
  const row0=ccYearRows().find(r=>r[2]==='GlobalChampionship2023');
  const label=(row0 ? ccYearLabel(row0[2], row0[0], row0[0]) : ev.label)+' · '+L().ccYr23GcDay(day);
  await simulateGamesLive(field, spec.games, majorPoints, CC_GLOB_KILL, 'stage', 0, null, null,
    {lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, label, ['summit','major','gclc'])});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  removeSkipButton();
  let through=false, note='';
  if(day===1){
    through=place<=spec.cut;
    st.finals=ranked.slice(0, spec.cut).map(seedOf);
    st.lower=ranked.slice(spec.cut).map(seedOf);
    note=through ? L().ccYr23GcUp : L().ccYr23GcDown;
  } else if(day===2){
    through=place<=spec.cut;
    st.finals=(st.finals||[]).concat(ranked.slice(0, spec.cut).map(seedOf));
    st.lowerDone=true;
    note=through ? L().ccRelPass(spec.cut) : L().ccYr23GcOut;
  }
  const fin=(day===3);
  const shell=createStageCardShell(label+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, fin ? place===1 : through, false,
    fin ? (place===1 ? L().gcChampion : L().gcPlaceNote(place)) : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? gcPrize : null, null, fin);
  careerPrAdd(ranked, {div:1, kind:'globals'});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, gcPrize);
    cash=gcPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'globals'));
    if(place===1) careerNews('good', 'ccNewsGlobChamp', []);
    careerNews(cash?'good':'flat', cash?'ccNewsGlobCash':'ccNewsGlobNoCash',
               cash?[place, ccNum(cash)]:[place, field.length], {tbl:ccStageShot(ranked, you, 1, label)});
    careerNews('flat', 'ccPostThanks', [ev.label]);
    careerCongrats(ranked, you, L().ccCongratsGlobals(ccLanCityIn('globals')));
    cr.globals={place:place, of:field.length, via:seat?seat.via:null, cash:cash};
  } else if(!through && day===2){
    // Вылет из нижней сетки — место за финалом (51+), со своими призовыми.
    const out=CC_GC23.field+(place-spec.cut);
    cash=gcPrize(out);
    if(cash) ccPayIn(ccShareOf(cash, you));
    cr.globals={place:out, of:73, via:seat?seat.via:null, cash:cash};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut', [label, place, field.length], {tbl:ccStageShot(ranked, you, 1, label)});
  }
  st.you=fin ? 'done' : through ? (day===1 ? 'final' : 'final') : (day===1 ? 'lower' : 'out');
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:fin ? place : (cr.globals ? cr.globals.place : place), of:fin ? field.length : 73,
               pts:you.stagePts, passed: fin ? cash>0 : through, ovr:CAREER.player.ovr,
               games:spec.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'globals',
               stage: fin ? 'final' : (day===1 ? 'upper' : 'lower'),
               won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined});
  careerMonthGoalCheck();
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:label, place:place, through: fin ? (place===1||cash>0) : through,
    wins:you.wins||0, cash:cash, cut:spec.cut||0});
}
// Какой это день Копенгагена (1–3) по календарю.
function ccGc23DayOf(iso){
  const row=ccYearRows().find(r=>r[2]==='GlobalChampionship2023');
  if(!row) return 3;
  return Math.min(3, Math.max(1, ccDaysBetween(row[0], iso)+1));
}
/* Можно ли играть сегодняшний день Копенгагена: день 1 — место с Мейджора; день 2 —
   упавший из верхней или место с Last Chance Major; день 3 — прошедший в финал. */
function ccGc23Can(){
  const cr=CAREER.career;
  const seat=ccGlobalsSeat(); if(!seat) return false;
  const st=(cr.gc23 && cr.gc23.season===cr.season) ? cr.gc23 : null;
  const day=ccGc23DayOf(careerToday());
  if(st && (st.you==='done' || st.you==='out')) return false;
  if(day===1) return seat.via==='major2' && !(st && st.you);
  if(day===2) return (seat.via==='lcm' && !(st && st.you)) || !!(st && st.you==='lower');
  return !!(st && st.you==='final');
}
