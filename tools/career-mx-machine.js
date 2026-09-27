/* ---- Сезоны 2019-го и 2020-го — формат меняется внутри года ------------------------
   2019: World Cup Solo и Duos (недели Online Open, финалы в Нью-Йорке), FNCS Season X (трио),
   FNCS Chapter 2 Season 1 (сквады). 2020: FNCS C2S2 (трио), C2S3 (соло), C2S4 (трио).
   Состав года — самый большой формат года; вечер идёт в своём формате (ccWithEventSize):
   соло — один, дуо — с первым тиммейтом. Спеки — CC_MX_SPEC (вклеивается с календарём).

   Неделя (или квалификатор) — раунды по вечерам: открытые раунды не хранят зал (только
   «прошёл»), закрытый — из записанного верха прошлого раунда. Последний раунд недели даёт
   очки серии (место в финале недели). У World Cup очков серии нет: верх недели по квоте
   региона (WC2019_QUOTA) — сразу в финал Нью-Йорка, и дальше недели уже не нужны.
   После недель — хиты из серии змейкой (план хитов в спеке), потом финал. */
function ccMXSpec(y, n){ return (CC_MX_SPEC[y]||{})[n] || null; }
function ccMXLobby(size){ return size===1 ? 100 : size===2 ? 50 : size===3 ? 33 : 25; }
function ccMXOf(y, n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.majorx;
  return (m && m.y===y && m.n===n && m.season===cr.season) ? m : null;
}
function ccMXState(y, n){
  const cr=CAREER.career;
  let m=ccMXOf(y, n);
  if(!m) m=cr.majorx={y:y, n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, heats:null, heatRes:{}, youKey:null, ticket:false};
  return m;
}
function ccMXRowId(y, n, tail){ return 'Major'+n+'_'+y+'_'+tail; }
function ccMXDayOf(y, n, tail){
  const row=ccYearRows().find(r=>r[2]===ccMXRowId(y, n, tail));
  return row ? row[0] : null;
}
function ccMXWeekEnd(y, n, w){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf(ccMXRowId(y, n, 'W'+w+'R'))===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
const ccMXKey=r=>r==='you' ? 'you' : JSON.stringify(r);
function ccMXSeriesAdd(m, ranked, rowOf){
  const n=ranked.length;
  ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+(n-i); if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t); });
}
function ccMXSeriesRank(m, key){
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
// Квота World Cup: мест в Нью-Йорк с одной недели у региона карьеры.
function ccMXWcQuota(sp){
  const t=(typeof WC2019_QUOTA!=='undefined' && WC2019_QUOTA[sp.set]) || {};
  let r=careerPrizeRegion(); if(t[r]==null && r==='NAW') r='NAC';
  return Math.max(1, t[r]||1);
}
function ccMXWorld(y, n, size, salt){
  return ccWithEventSize(size, ()=>ccM23World(size+20, salt));
}
// Неделя, досчитанная молча: финал недели — сильные сцены; в серию (World Cup — без серии).
function ccMXSettleWeek(m, w){
  const sp=ccMXSpec(m.y, m.n), Q=m.q[w]=m.q[w]||{};
  if(Q.done || sp.kind==='wc') return;
  const end=ccMXWeekEnd(m.y, m.n, w);
  if(!end || careerToday()<=end) return;
  const R=sp.rounds.length, last=sp.rounds[R-1], F=ccMXLobby(sp.size);
  ccWithEventSize(sp.size, ()=>{
    let room=(Q['r'+(R-1)]||[]).filter(r=>r!=='you').map(ccMajorTeamFrom);
    if(room.length<F){
      const seen=new Set(room.map(ccSeatKey));
      ccM23World(F+20, 'mx|'+m.y+'|'+m.n+'|'+w).forEach(t=>{ if(room.length>=F || seen.has(ccSeatKey(t))) return; seen.add(ccSeatKey(t)); room.push(t); });
    }
    room=room.slice(0, F);
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWorldRun('mxq|'+m.season+'|'+m.y+'|'+m.n+'|'+w, ()=>simulateGames(room, last.games, ccM24Points, CC_M24_KILL));
    ccMXSeriesAdd(m, ccM24Rank(room), ccMajorSeatRow);
  });
  Q.done=true;
}
function ccMXSettleWeeks(m){ (ccMXSpec(m.y, m.n).weeks||[]).forEach(w=>ccMXSettleWeek(m, w)); }
function ccMXHeats(m){
  if(m.heats) return m.heats;
  ccMXSettleWeeks(m);
  const sp=ccMXSpec(m.y, m.n), plan=sp.heats||[], F=ccMXLobby(sp.size);
  const H=plan.length, need=H*F;
  const list=[], seen=new Set();
  const push=r=>{ const key=ccMXKey(r); if(list.length>=need || seen.has(key)) return; seen.add(key); list.push(r); };
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>push(m.seriesRows[k]));
  if(list.length<need) ccWithEventSize(sp.size, ()=>ccM23World(need*2, 'mxh|'+m.y+'|'+m.n).forEach(t=>push(ccMajorSeatRow(t))));
  const heats=plan.map(h=>({day:h.day, cut:h.cut, rows:[]}));
  list.forEach((r,i)=>{ const round=Math.floor(i/H), pos=i%H; heats[round%2 ? H-1-pos : pos].rows.push(r); });
  m.heats=heats; m.heatRes={};
  return heats;
}
function ccMXSettleHeats(m){
  const sp=ccMXSpec(m.y, m.n);
  if(!(sp.heats||[]).length) return;
  ccMXHeats(m).forEach((h,i)=>{
    if(m.heatRes[i] || !h.rows.length) return;
    const day=ccMXDayOf(m.y, m.n, 'Heat'+h.day);
    if(!day || careerToday()<=day) return;
    ccWithEventSize(sp.size, ()=>{
      const room=h.rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWorldRun('mxh|'+m.season+'|'+m.y+'|'+m.n+'|'+i, ()=>simulateGames(room, sp.heatGames||6, ccM24Points, CC_M24_KILL));
      const ranked=ccM24Rank(room);
      m.heatRes[i]={up:ranked.slice(0, h.cut).map(ccMajorSeatRow), rest:ranked.slice(h.cut).map(ccMajorSeatRow)};
    });
  });
}
function ccMXYourHeat(m, d){ return ccMXHeats(m).findIndex(h=>h.day===d && h.rows.indexOf('you')>=0); }
// Финал: World Cup — настоящие финалисты Нью-Йорка; FNCS — прошедшие хиты, недобор по серии.
function ccMXGfRows(y, n, m){
  const sp=ccMXSpec(y, n), F=ccMXLobby(sp.size), out=[], seen=new Set();
  const add=r=>{ const k=ccMXKey(r); if(!r || seen.has(k) || out.length>=F) return; seen.add(k); out.push(r); };
  if(sp.kind==='wc'){ ((typeof WC2019_FIELD!=='undefined' && WC2019_FIELD[sp.set])||[]).forEach(add); return out; }
  if(!m) return out;
  ccMXSettleWeeks(m); ccMXSettleHeats(m);
  ccMXHeats(m).forEach((h,i)=>((m.heatRes[i]||{}).up||[]).forEach(add));
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccMXWorldFinalRoom(y, n, drafted, lobbyCr){
  const sp=ccMXSpec(y, n), F=ccMXLobby(sp.size);
  const rows=ccMXGfRows(y, n, ccMXOf(y, n));
  const room=rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<F){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, F+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=F || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, F);
}
function ccMXCanStage(ev, cr, gaveUp){
  const sp=ccMXSpec(ev.yx, ev.n); if(!sp) return false;
  const s=ccMXOf(ev.yx, ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    if(s && s.ticket) return false;
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.w] && s.q[ev.w]['r'+(first-1)];
    return !!(prev && prev.indexOf('you')>=0);
  }
  if(ev.stage==='heat'){
    if(!s || s.ticket || !s.youKey) return false;
    ccMXSettleHeats(s);
    return ccMXYourHeat(s, ev.r)>=0;
  }
  return !gaveUp && !!(s && s.ticket);
}
async function runCareerMajorMX(){
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.yx || !careerMajorCan(ev)) return;
  const sp=ccMXSpec(ev.yx, ev.n);
  const prevEv=CC_EVENT_SIZE;
  CC_EVENT_SIZE=sp.size;
  try{ await ccMXRun(ev, sp); }
  finally{ CC_EVENT_SIZE=prevEv; }
}
async function ccMXRun(ev, sp){
  const cr=CAREER.career;
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=sp.size; drafted=[me].concat(mates);
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
  const m=ccMXState(ev.yx, ev.n);
  const F=ccMXLobby(sp.size);
  const rowsOf=rows=>(rows||[]).map(r=>r==='you' ? you : ccMajorTeamFrom(r));
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0;
  const play=async (room, sp2, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    await simulateGamesLive(room, sp2.games, ccM24Points, CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:F, stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp2.games;
    return ccM24Rank(room);
  };
  if(ev.stage==='q'){
    const Q=m.q[ev.w]=m.q[ev.w]||{};
    const R=sp.rounds.length;
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i];
      spec=Object.assign({}, sp.rounds[r-1]);
      const wc=sp.kind==='wc' && r===R;
      if(wc) spec.cut=ccMXWcQuota(sp);
      const open=!!spec.open;
      field=open ? [you, ...careerCupField(cr, drafted, careerLadderEntrants(), 'mx|'+ev.yx+'|'+ev.n+'|'+ev.w+'|'+r, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      if(!open){
        const want=Math.min(sp.rounds[r-2].cut, F*2), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'mxq|'+ev.yx+'|'+ev.n+'|'+ev.w+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=ccYearLabel(ccMXRowId(ev.yx, ev.n, 'W'+ev.w+'R'+r), careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      if(r===R){
        through=wc && place<=spec.cut;
        if(wc){ if(through) m.ticket=true; }
        else ccMXSeriesAdd(m, ranked, seedOf);
        Q.done=true;
      } else {
        through=place<=spec.cut;
        // Следующий раунд открытый — зал не нужен, только отметка «прошёл».
        const nextOpen=!!(sp.rounds[r] && sp.rounds[r].open);
        Q['r'+r]=nextOpen ? (through ? ['you'] : []) : ranked.slice(0, spec.cut).map(seedOf);
      }
      m.youKey=ccSeatKey(you);
      note = (r===R) ? (wc ? (through ? L().ccYrXWcIn(spec.cut) : L().ccRelFail(spec.cut)) : L().ccYr24Series(m.series[m.youKey]||0, ccMXSeriesRank(m, m.youKey)))
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
  } else if(ev.stage==='heat'){
    ccMXSettleHeats(m);
    const hi=ccMXYourHeat(m, ev.r), heat=ccMXHeats(m)[hi];
    spec={games:sp.heatGames||6, cut:heat.cut};
    field=rowsOf(heat.rows);
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=L().ccYrXHeatN(ev.label, hi+1);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.heatRes[hi]={up:ranked.slice(0, heat.cut).map(seedOf), rest:ranked.slice(heat.cut).map(seedOf)};
    through=place<=heat.cut;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : L().ccRelFail(heat.cut);
  } else {
    spec={games:sp.finalGames||12, cut:0};
    field=rowsOf(ccMXGfRows(ev.yx, ev.n, m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, F);
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
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false, fin ? '' : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
  careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, sp.name);
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
               mate: (sp.size>1 && mate) ? mate.handle : null, mates: ccLogMates(mates.slice(0, sp.size-1)), prize:ccShareOf(cash, you), kind:'major', stage:fin ? 'final' : ev.stage,
               size: sp.size, won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined});
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
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note, seat:false, seatText:null, money: fin ? cash : null});
}
// Призовые финала сезона на команду: World Cup — таблица Нью-Йорка (одна на мир), FNCS — финал региона.
function ccMXPrize(y, n, place){
  const sp=ccMXSpec(y, n); if(!sp) return 0;
  const t=sp.kind==='wc' ? {EU:((typeof WC2019_PAY!=='undefined' && WC2019_PAY[sp.set])||[])}
        : y===2019 ? Object.assign({}, ((typeof CC_MX_PAY_2019_LQ!=='undefined' && CC_MX_PAY_2019_LQ[n])||{}), ((typeof CC_MX_PAY_2019!=='undefined' && CC_MX_PAY_2019[n])||{}))
        : (((typeof CC_MX_PAY_2020!=='undefined' && CC_MX_PAY_2020)||{})[n]||{});
  return ccPay24(t, place)*sp.size;
}
