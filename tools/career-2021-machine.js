/* ---- Сезон FNCS 2021-го (Chapter 2, трио) -------------------------------------------
   Формат Epic (окна Tracker; спека career-year-2021-design.md): квалификатор — четыре раунда
   (пятница — раунд 1, топ-1500; суббота — раунды 2 и 3, топ-250 / топ-300 у C2S8 и топ-33;
   воскресенье — раунд 4: у C2S6–C2S8 топ-3 / топ-5 прямо в финал). Очки серии — раунд 4.
   Полуфинал — хиты по 33 трио из серии змейкой: C2S5 — четыре хита в два дня, топ-8; C2S6 и
   C2S7 — три хита, топ-6; C2S8 — два хита, топ-4, и второй день из не прошедших первый.
   Reboot Round — не прошедшие хиты: у C2S5 финал берёт одно трио, у C2S6/C2S7 — шесть (своё
   число режима: в окнах квоты нет, шесть добивают финал до 33). Финал — 33 трио, 12 игр.
   «Мейджор 5» — FNCS Grand Royale: финал с настоящими трио региона, пускает любой финал года. */
const CC_M21={
  q:{1:{games:10, cut:1500, open:true}, 2:{games:6, cut:250}, 3:{games:6, cut:33}, 4:{games:6, cut:3}},
  semi:{games:6}, reboot:{games:6}, final:{games:12, cut:0}
};
function ccM21Rounds(){ return 4; }
function ccM21Spec(n, r){
  const s=Object.assign({}, CC_M21.q[r]);
  if(r===2 && n===4) s.cut=300;
  if(r===4) s.cut = n===1 ? 0 : n===4 ? 5 : 3;
  return s;
}
function ccM21Quals(n){ return n===4 ? 2 : 3; }
function ccM21Field(){ return ccTeams(50); }
// Хиты полуфинала: день и квота. prev — хит второго дня из не прошедших первый (C2S8).
function ccM21HeatPlan(n){
  if(n===1) return [{day:1, cut:8}, {day:1, cut:8}, {day:2, cut:8}, {day:2, cut:8}];
  if(n===4) return [{day:1, cut:4}, {day:1, cut:4}, {day:2, cut:7, prev:true}, {day:2, cut:7, prev:true}];
  return [{day:1, cut:6}, {day:1, cut:6}, {day:1, cut:6}];
}
function ccM21RebootCut(n){ return n===1 ? 1 : (n===2 || n===3) ? 6 : 0; }
function ccM21Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major21;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM21State(n){
  const cr=CAREER.career;
  let m=ccM21Of(n);
  if(!m) m=cr.major21={n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, direct:[], heats:null, heatRes:{}, reboot:null, youKey:null, ticket:false};
  return m;
}
function ccM21DayOf(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2021_'+tail);
  return row ? row[0] : null;
}
function ccM21QualEnd(n, q){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf('Major'+n+'_2021_Q'+q+'R')===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
const ccM21Key=r=>r==='you' ? 'you' : JSON.stringify(r);
function ccM21SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
function ccM21SeriesAdd(m, ranked, rowOf){
  const n=ranked.length;
  ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+(n-i); if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t); });
}
// Квалификатор, досчитанный молча: раунд 4 — 33 сильных трио сцены.
function ccM21SettleQual(m, q){
  const Q=m.q[q]=m.q[q]||{};
  if(Q.done) return;
  const end=ccM21QualEnd(m.n, q);
  if(!end || careerToday()<=end) return;
  const last=ccM21Spec(m.n, 4), F=ccM21Field();
  let room=(Q.r3||[]).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<F){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(F+20, 'm21|'+m.n+'|'+q).forEach(t=>{
      if(room.length>=F || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, F);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m21q|'+m.season+'|'+m.n+'|'+q, ()=>simulateGames(room, last.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  ranked.slice(0, last.cut).forEach(t=>m.direct.push(ccMajorSeatRow(t)));
  ccM21SeriesAdd(m, ranked.slice(last.cut), ccMajorSeatRow);
  Q.done=true;
}
function ccM21SettleQuals(m){ for(let q=1; q<=ccM21Quals(m.n); q++) ccM21SettleQual(m, q); }
// Хиты первого дня — из серии змейкой (без прямых), недобор — сценой. Строятся один раз.
function ccM21Heats(m){
  if(m.heats) return m.heats;
  ccM21SettleQuals(m);
  const plan=ccM21HeatPlan(m.n), F=ccM21Field();
  const first=plan.filter(h=>!h.prev), H=first.length, need=H*F;
  const direct=new Set(m.direct.map(ccM21Key));
  const list=[], seen=new Set();
  const push=r=>{ const key=ccM21Key(r); if(list.length>=need || direct.has(key) || seen.has(key)) return; seen.add(key); list.push(r); };
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>push(m.seriesRows[k]));
  if(list.length<need) ccM23World(need*2, 'm21h|'+m.n).forEach(t=>push(ccMajorSeatRow(t)));
  const heats=plan.map(h=>({day:h.day, cut:h.cut, prev:!!h.prev, rows:[]}));
  list.forEach((r,i)=>{ const round=Math.floor(i/H), pos=i%H; heats[round%2 ? H-1-pos : pos].rows.push(r); });
  m.heats=heats; m.heatRes={};
  return heats;
}
// Хиты второго дня C2S8 — не прошедшие первый день, по месту, змейкой.
function ccM21PrevHeats(m){
  const heats=ccM21Heats(m);
  const pv=heats.filter(h=>h.prev);
  if(!pv.length || pv[0].rows.length) return;
  const idx1=heats.map((h,i)=>h.prev ? -1 : i).filter(i=>i>=0);
  if(idx1.some(i=>!m.heatRes[i])) return;
  const rests=idx1.map(i=>m.heatRes[i].rest);
  const merged=[];
  for(let p=0; ; p++){ let any=false; rests.forEach(l=>{ if(l[p]!==undefined){ merged.push(l[p]); any=true; } }); if(!any) break; }
  const H=pv.length;
  merged.forEach((r,i)=>{ const round=Math.floor(i/H), pos=i%H; pv[round%2 ? H-1-pos : pos].rows.push(r); });
}
function ccM21SettleHeats(m){
  const heats=ccM21Heats(m);
  heats.forEach((h,i)=>{
    if(h.prev) ccM21PrevHeats(m);
    if(m.heatRes[i] || !h.rows.length) return;
    const day=ccM21DayOf(m.n, 'Semi'+h.day);
    if(!day || careerToday()<=day) return;
    const room=h.rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWorldRun('m21h|'+m.season+'|'+m.n+'|'+i, ()=>simulateGames(room, CC_M21.semi.games, ccM24Points, CC_M24_KILL));
    const ranked=ccM24Rank(room);
    m.heatRes[i]={up:ranked.slice(0, h.cut).map(ccMajorSeatRow), rest:ranked.slice(h.cut).map(ccMajorSeatRow)};
  });
}
// Хит игрока на день d (или -1).
function ccM21YourHeat(m, d){
  const heats=ccM21Heats(m);
  ccM21PrevHeats(m);
  return heats.findIndex(h=>h.day===d && h.rows.indexOf('you')>=0);
}
// Reboot Round: не прошедшие хиты первого дня по кругу, до лобби.
function ccM21RebootRoom(m){
  ccM21SettleHeats(m);
  const heats=ccM21Heats(m), F=ccM21Field();
  const lists=heats.map((h,i)=>h.prev ? null : ((m.heatRes[i]||{}).rest||null)).filter(Boolean);
  const room=[];
  for(let p=0; room.length<F; p++){ let any=false; lists.forEach(l=>{ if(l[p]!==undefined && room.length<F){ room.push(l[p]); any=true; } }); if(!any) break; }
  return room;
}
function ccM21SettleReboot(m){
  const cut=ccM21RebootCut(m.n);
  if(m.reboot || !cut) return;
  const day=ccM21DayOf(m.n, 'Reboot');
  if(!day || careerToday()<=day) return;
  const room=ccM21RebootRoom(m).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.reboot={up:[]}; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m21r|'+m.season+'|'+m.n, ()=>simulateGames(room, CC_M21.reboot.games, ccM24Points, CC_M24_KILL));
  m.reboot={up:ccM24Rank(room).slice(0, cut).map(ccMajorSeatRow)};
}
// Финал: прямые, прошедшие хиты и Reboot Round; недобор — по серии. Grand Royale — трио региона.
function ccM21GfRows(m){
  if(!m) return null;
  const F=ccM21Field(), out=[], seen=new Set();
  const add=r=>{ const k=ccM21Key(r); if(!r || seen.has(k) || out.length>=F) return; seen.add(k); out.push(r); };
  if(m.n===5){ ((typeof GR2021_TRIOS!=='undefined' && GR2021_TRIOS[careerPrizeRegion()])||[]).forEach(add); return out; }
  ccM21SettleQuals(m); ccM21SettleHeats(m); ccM21SettleReboot(m);
  m.direct.forEach(add);
  ccM21Heats(m).forEach((h,i)=>((m.heatRes[i]||{}).up||[]).forEach(add));
  ((m.reboot||{}).up||[]).forEach(add);
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccM21WorldFinalRoom(m, drafted, lobbyCr, n){
  const rows=m ? ccM21GfRows(m) : (n===5 ? ccM21GfRows({n:5}) : null);
  const F=ccM21Field();
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<F){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, F+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=F || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, F);
}
// Grand Royale пускает любой Гранд-финал сезона этого года.
function ccM21GrTicket(){
  const cr=CAREER.career;
  return (cr.log||[]).some(r=>r.season===cr.season && r.kind==='major' && r.stage==='final' && r.place && String(r.day)<CC_YEAR_2021_TO && String(r.day)<'2021-11-20');
}
function ccM21CanStage(ev, cr, gaveUp){
  if(ev.n===5) return !gaveUp && ccM21GrTicket() && !((ccM21Of(5)||{}).got||{})[ev.id];
  const s=ccM21Of(ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    if(s && s.ticket) return false;
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.q] && s.q[ev.q]['r'+(first-1)];
    return !!(prev && prev.indexOf('you')>=0);
  }
  if(ev.stage==='semi'){
    if(!s || s.ticket || !s.youKey) return false;
    ccM21SettleHeats(s);
    return ccM21YourHeat(s, ev.r)>=0;
  }
  if(ev.stage==='reboot'){
    if(!s || s.ticket || !s.youKey || !ccM21RebootCut(ev.n)) return false;
    return ccM21RebootRoom(s).indexOf('you')>=0;
  }
  return !gaveUp && !!(s && s.ticket);
}
async function runCareerMajor2021(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y21 || !careerMajorCan(ev)) return;
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
  const m=ccM21State(ev.n);
  const F=ccM21Field();
  const rowsOf=rows=>(rows||[]).map(r=>r==='you' ? you : ccMajorTeamFrom(r));
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0;
  const play=async (room, sp, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    await simulateGamesLive(room, sp.games, ccM24Points, CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:F, stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp.games;
    return ccM24Rank(room);
  };
  if(ev.stage==='q'){
    const Q=m.q[ev.q]=m.q[ev.q]||{};
    const R=ccM21Rounds(ev.n);
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i];
      spec=ccM21Spec(ev.n, r);
      const open=(r===1);
      field=open ? [you, ...careerCupField(cr, drafted, careerLadderEntrants(), 'm21|'+ev.n+'|'+ev.q, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      // Записанный зал короче лобби (старый сейв, пустая запись) — добор сценой.
      if(!open){
        const want=Math.min(ccM21Spec(ev.n, r-1).cut, 100), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'm21q|'+ev.n+'|'+ev.q+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=L().ccYr24Qual(ev.n, ev.q, r);
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      if(r===R){
        // Раунд 4: топ прямо в финал (кроме C2S5), остальные — в серию.
        through=spec.cut>0 && place<=spec.cut;
        ranked.slice(0, spec.cut).forEach(t=>m.direct.push(seedOf(t)));
        ccM21SeriesAdd(m, ranked.slice(spec.cut), seedOf);
        if(through) m.ticket=true;
        Q.done=true;
      } else {
        through=place<=spec.cut;
        Q['r'+r]=ranked.slice(0, spec.cut).map(seedOf);
      }
      m.youKey=ccSeatKey(you);
      note = (r===R) ? (through ? L().ccYr22Direct(spec.cut) : L().ccYr24Series(m.series[m.youKey]||0, ccM21SeriesRank(m, m.youKey)))
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
    ccM21SettleHeats(m);
    const hi=ccM21YourHeat(m, ev.r), heat=ccM21Heats(m)[hi];
    spec={games:CC_M21.semi.games, cut:heat.cut};
    field=rowsOf(heat.rows);
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=L().ccYr21Heat(ev.n, hi+1);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.heatRes[hi]={up:ranked.slice(0, heat.cut).map(seedOf), rest:ranked.slice(heat.cut).map(seedOf)};
    through=place<=heat.cut;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : (ccM21RebootCut(ev.n) ? L().ccYr21ToReboot : L().ccRelFail(heat.cut));
  } else if(ev.stage==='reboot'){
    const cut=ccM21RebootCut(ev.n);
    spec={games:CC_M21.reboot.games, cut:cut};
    field=rowsOf(ccM21RebootRoom(m));
    if(field.indexOf(you)<0) field.push(you);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.reboot={up:ranked.slice(0, cut).map(seedOf)};
    through=place<=cut;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : L().ccRelFail(cut);
  } else {
    spec=CC_M21.final;
    field=rowsOf(ccM21GfRows(m));
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
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false, fin ? ccMajorSeatNote(ev) : note);
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
    careerCongrats(ranked, you, ev.n===5 ? L().ccYr21Gr : L().ccCongratsMajor(ev.n));
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
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note, seat:false, seatText:null, money: fin ? cash : null});
}
