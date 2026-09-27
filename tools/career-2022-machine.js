/* ---- Сезон FNCS 2022-го (Chapter 3) ---------------------------------------------
   Формат Epic (окна Tracker, Liquipedia; спека career-year-2022-design.md), дуо:
   квалификаторы — C3S1 два по три раунда (10 игр → топ-400, 7 игр → топ-50, 6 игр → топ-8
   прямо в финал), C3S2/C3S3 три по четыре раунда (10 → топ-2000, 10 → топ-500/250, 10 →
   топ-50, 6 → топ-5 в финал); очки серии — за два последних раунда. Полуфинал — три сессии
   по пять игр: пятьдесят лучших по серии (без прямых), в финал — победители матчей (до
   пяти) и лучшие по очкам до 11–12 (квоты сессий — окна Epic); оставшиеся садятся в следующую сессию,
   недобор — следующими по серии. Финал — 50 дуо, двенадцать игр. «Мейджор n» = сезон n.
   Два раунда в один вечер у Epic бывали часто — день календаря несёт свой список раундов. */
const CC_M22={
  q:{1:{games:10, cut:400, open:true}, 2:{games:7, cut:50}, 3:{games:6, cut:8}},
  qDeep:{1:{games:10, cut:2000, open:true}, 2:{games:10, cut:500}, 3:{games:10, cut:50}, 4:{games:6, cut:5}},
  qDeep3:{2:{games:10, cut:250}},
  semi:{games:5, vr:5, cut:[11, 12, 12], cut1:[11, 11, 12], field:50},
  final:{games:12, cut:0}, field:50
};
function ccM22Rounds(n){ return n===1 ? 3 : 4; }
function ccM22Spec(n, r){
  if(n===1) return CC_M22.q[r];
  if(n===3 && CC_M22.qDeep3[r]) return CC_M22.qDeep3[r];
  return CC_M22.qDeep[r];
}
function ccM22SemiCut(n, s){ return (n===1 ? CC_M22.semi.cut1 : CC_M22.semi.cut)[s-1]||11; }
function ccM22Quals(n){ return n===1 ? 2 : 3; }
function ccM22Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major22;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM22State(n){
  const cr=CAREER.career;
  let m=ccM22Of(n);
  if(!m) m=cr.major22={n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, direct:[], semi:{}, youKey:null, ticket:false};
  return m;
}
function ccM22Day(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2022_'+tail || (tail.charAt(0)==='Q' && r[2].indexOf('Major'+n+'_2022_'+tail)===0));
  return row ? row[0] : null;
}
// Последний день квалификатора q (его последний раунд).
function ccM22QualEnd(n, q){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf('Major'+n+'_2022_Q'+q+'R')===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
function ccM22SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
// Очки серии за место в раунде: последний раунд вдвое дороже предпоследнего.
function ccM22SeriesAdd(m, ranked, weight, rowOf){
  const n=ranked.length;
  ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+weight*(n-i); if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t); });
}
const ccM22Key=r=>r==='you' ? 'you' : JSON.stringify(r);
/* Квалификатор, досчитанный молча: его последние два раунда — пятьдесят сильных сцены.
   Прямые места (топ-8 / топ-5) уходят в финал, остальные — в серию. */
function ccM22SettleQual(m, q){
  const Q=m.q[q]=m.q[q]||{};
  if(Q.done) return;
  const end=ccM22QualEnd(m.n, q);
  if(!end || careerToday()<=end) return;
  const R=ccM22Rounds(m.n), last=ccM22Spec(m.n, R);
  let room=(Q['r'+(R-1)]||[]).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<CC_M22.field){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(CC_M22.field+20, 'm22|'+m.n+'|'+q).forEach(t=>{
      if(room.length>=CC_M22.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, CC_M22.field);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m22q|'+m.season+'|'+m.n+'|'+q, ()=>simulateGames(room, last.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  ranked.slice(0, last.cut).forEach(t=>m.direct.push(ccMajorSeatRow(t)));
  ccM22SeriesAdd(m, ranked.slice(last.cut), 2, ccMajorSeatRow);
  Q.done=true;
}
function ccM22SettleQuals(m){ for(let q=1; q<=ccM22Quals(m.n); q++) ccM22SettleQual(m, q); }
// Комната сессии s полуфинала: перенесённые из прошлой сессии + добор по серии до 50.
function ccM22SemiRoom(m, s){
  ccM22SettleQuals(m);
  for(let i=1; i<s; i++) ccM22SettleSemi(m, i);
  const direct=new Set(m.direct.map(ccM22Key));
  const done=new Set();
  for(let i=1; i<s; i++) ((m.semi[i]||{}).up||[]).forEach(r=>done.add(ccM22Key(r)));
  const prev=(s>1 && m.semi[s-1]) ? (m.semi[s-1].rest||[]) : [];
  const room=prev.filter(r=>!done.has(ccM22Key(r)));
  const seen=new Set(room.map(ccM22Key));
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>{
    if(room.length>=CC_M22.semi.field) return;
    const r=m.seriesRows[k], key=ccM22Key(r);
    if(direct.has(key) || done.has(key) || seen.has(key)) return;
    // Уже сыгравшие прошлую сессию и не прошедшие — в её остатке; остальные ещё не садились.
    let played=false; for(let i=1; i<s; i++) if(((m.semi[i]||{}).all||[]).some(x=>ccM22Key(x)===key)) played=true;
    if(played) return;
    seen.add(key); room.push(r);
  });
  // Серия короче полусотни (одни и те же дуо в двух квалификаторах) — добор сценой.
  if(room.length<CC_M22.semi.field){
    const sat=new Set(); for(let i=1; i<s; i++) ((m.semi[i]||{}).all||[]).forEach(x=>sat.add(ccM22Key(x)));
    ccM23World(CC_M22.semi.field*2, 'm22s|'+m.n+'|'+s).forEach(t=>{
      if(room.length>=CC_M22.semi.field) return;
      const r=ccMajorSeatRow(t), key=ccM22Key(r);
      if(direct.has(key) || done.has(key) || seen.has(key) || sat.has(key)) return;
      seen.add(key); room.push(r);
    });
  }
  return room;
}
// Записать сессию: победители матчей (до пяти) и лучшие по очкам — до квоты сессии.
function ccM22WriteSemi(m, s, ranked, rowOf){
  const quota=ccM22SemiCut(m.n, s);
  const up=[], seen=new Set();
  ranked.forEach(t=>{ if((t.wins||0)>0 && up.length<CC_M22.semi.vr && !seen.has(t)){ seen.add(t); up.push(t); } });
  ranked.forEach(t=>{ if(up.length<quota && !seen.has(t)){ seen.add(t); up.push(t); } });
  m.semi[s]={up:up.map(rowOf), rest:ranked.filter(t=>!seen.has(t)).map(rowOf), all:ranked.map(rowOf)};
  return up;
}
function ccM22SettleSemi(m, s){
  if(m.semi[s]) return;
  const day=ccM22Day(m.n, 'Semi'+s);
  if(!day || careerToday()<=day) return;
  if(s>1) ccM22SettleSemi(m, s-1);
  const room=ccM22SemiRoom(m, s).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.semi[s]={up:[], rest:[], all:[]}; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m22semi|'+m.season+'|'+m.n+'|'+s, ()=>simulateGames(room, CC_M22.semi.games, ccM24Points, CC_M24_KILL));
  ccM22WriteSemi(m, s, ccM24Rank(room), ccMajorSeatRow);
}
// Финал: прямые из квалификаторов и прошедшие полуфинал; недобор — следующими по серии.
function ccM22GfRows(m){
  if(!m) return null;
  ccM22SettleQuals(m); for(let s=1; s<=3; s++) ccM22SettleSemi(m, s);
  const out=[], seen=new Set();
  const add=r=>{ const k=ccM22Key(r); if(!r || seen.has(k) || out.length>=CC_M22.field) return; seen.add(k); out.push(r); };
  m.direct.forEach(add);
  for(let s=1; s<=3; s++) ((m.semi[s]||{}).up||[]).forEach(add);
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccM22WorldFinalRoom(m, drafted, lobbyCr){
  const rows=m ? ccM22GfRows(m) : null;
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M22.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M22.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M22.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M22.field);
}
function ccM22CanStage(ev, cr, gaveUp){
  const s=ccM22Of(ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    if(s && s.ticket) return false;                    // уже в финале — квалификаторы не нужны
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.q] && s.q[ev.q]['r'+(first-1)];
    return !!(prev && prev.indexOf('you')>=0);
  }
  if(ev.stage==='semi'){
    if(!s || s.ticket || !s.youKey) return false;
    const room=ccM22SemiRoom(s, ev.r);
    return room.indexOf('you')>=0;
  }
  return !gaveUp && !!(s && s.ticket);
}
async function runCareerMajor2022(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y22 || !careerMajorCan(ev)) return;
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
  const m=ccM22State(ev.n);
  const rowsOf=rows=>(rows||[]).map(r=>r==='you' ? you : ccMajorTeamFrom(r));
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0;
  const play=async (room, sp, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    await simulateGamesLive(room, sp.games, ccM24Points, CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp.games;
    return ccM24Rank(room);
  };
  if(ev.stage==='q'){
    /* Раунды этого вечера подряд: прошёл — играешь следующий тем же вечером. Промежуточный
       раунд показывается своей карточкой, итог вечера — последним сыгранным. */
    const Q=m.q[ev.q]=m.q[ev.q]||{};
    const R=ccM22Rounds(ev.n);
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i];
      spec=ccM22Spec(ev.n, r);
      const open=(r===1);
      field=open ? [you, ...careerCupField(cr, drafted, careerLadderEntrants(), 'm22|'+ev.n+'|'+ev.q, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      // Записанный зал короче лобби (старый сейв, пустая запись) — добор сценой.
      if(!open){
        const want=Math.min(ccM22Spec(ev.n, r-1).cut, 100), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'm22q|'+ev.n+'|'+ev.q+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=ccYearLabel('Major'+ev.n+'_2022_Q'+ev.q+'R'+r, careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      if(r===R){
        // Последний раунд: топ прямо в финал, остальные — в серию (вдвое).
        through=place<=spec.cut;
        ranked.slice(0, spec.cut).forEach(t=>m.direct.push(seedOf(t)));
        ccM22SeriesAdd(m, ranked.slice(spec.cut), 2, seedOf);
        if(through) m.ticket=true;
        Q.done=true;
      } else {
        through=place<=spec.cut;
        Q['r'+r]=ranked.slice(0, spec.cut).map(seedOf);
        if(r===R-1) ccM22SeriesAdd(m, ranked.slice(spec.cut), 1, seedOf);
      }
      m.youKey=ccSeatKey(you);
      note = (r===R) ? (through ? L().ccYr22Direct(spec.cut) : L().ccYr24Series(m.series[m.youKey]||0, ccM22SeriesRank(m, m.youKey)))
                     : (through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
      if(i<ev.rounds.length-1){
        const sh=createStageCardShell(stageLabel+' — '+field.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, place, field.length, you.stagePts, through, false, note);
        await revealStandings(sh, ranked, you, spec.cut||0);
        careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
        if(!through) break;
      }
    }
  } else if(ev.stage==='semi'){
    spec={games:CC_M22.semi.games, cut:ccM22SemiCut(ev.n, ev.r)};
    field=rowsOf(ccM22SemiRoom(m, ev.r));
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=ev.label;
    ranked=await play(field, CC_M22.semi, stageLabel, false);
    place=ranked.indexOf(you)+1;
    const up=ccM22WriteSemi(m, ev.r, ranked, seedOf);
    through=up.indexOf(you)>=0;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : (ev.r<3 ? L().ccYr22SemiNext : L().ccRelFail(spec.cut));
  } else {
    spec=CC_M22.final;
    field=rowsOf(ccM22GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M22.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
  }
  m.got[ev.id]=true;
  removeSkipButton();
  const fin=ev.stage==='final';
  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false, fin ? ccMajorSeatNote(ev) : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
  careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',
               cash?[ccSeasonEvName(2022, ev.n), place, ccNum(cash)]:[ccSeasonEvName(2022, ev.n), place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsEv(ccSeasonEvName(2022, ev.n)));
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut',
               [stageLabel, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : through, ovr:CAREER.player.ovr, games:games||spec.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:fin ? 'final' : ev.stage,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined});
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
  const lanSeat = fin && ccGlobalsSeat() ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note, seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}
/* ---- FNCS Invitational 2022 (Роли) -----------------------------------------------
   50 приглашённых дуо со всего мира, двенадцать игр за два дня, $1 000 000 (Liquipedia).
   Зал — настоящие дуо (INV2022_DUOS) карточками 2022-го; своё место вытесняет одно.
   Приглашение карьеры — место в Гранд-финале сезона не ниже половины квоты региона
   (квоты — по настоящим участникам, INV2022_SEATS; у Epic — очки трёх сезонов). */
function ccInv22Quota(){
  let r=careerPrizeRegion();
  const n=(INV2022_SEATS[r]!=null ? INV2022_SEATS[r] : 1);
  return Math.max(1, Math.ceil(n/2));
}
function buildInvitational2022Field(you){
  const seated=new Set();
  const own=you && !you._stub ? you : null;
  if(own) (own.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const limit=CC_GLOB_FIELD-(own?1:0);
  const room=[];
  INV2022_DUOS.forEach(d=>{ if(room.length>=limit) return; const t=ccLanTeam(d, null, 88, seated); if(t){ t.gcRoute='inv'; room.push(t); } });
  ccGc23Fill(room, limit, seated);
  if(own){ own.gcRoute='inv'; room.push(own); }
  return room;
}
/* Дивизионы C3S4: Placement Cup не играется — ступень по рейтингу против сцены региона.
   Своя оценка режима (у Epic: топ-200 кубка — Elite, до 1200 — Challenger, остальные —
   Contender): не ниже 30-го перцентиля сцены — Elite, не ниже 5-го — Challenger. */
function ccDiv22Place(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const d=careerToday();
  if(d<CC_DIV_FROM_2022 || d>CC_DIV_END_2022 || cr.div22===cr.season) return;
  cr.div22=cr.season;
  const ovr=(CAREER.player && CAREER.player.ovr)||0;
  const pool=ccSceneRoster(ccCareerRegion()).map(c=>c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr||0)).sort((a,b)=>a-b);
  const at=q=>pool.length ? pool[Math.floor(q*(pool.length-1))] : 0;
  cr.division = ovr>=at(0.3) ? 1 : ovr>=at(0.05) ? 2 : 3;
}
