/*@@PART js/career/customs-discord.js@@*/
/* СВОЯ КАСТОМКА — организатор ты.

   Игрок: «было бы интересно сделать организацию собственных
   турниров/кастомок». Кастомки в этой сцене держат те, у кого есть аудитория
   (Poyo, Rax): фонд из своего кармана, лобби из знакомых имён, вечер идёт в
   эфир и растит канал. Так и здесь: кнопка дня рядом со стримом, фонд с
   баланса, лобби — люди своего региона ближайшие по рейтингу, победители игр
   получают деньги на общую доску (careerMoneyAdd), а ты — охват и пост в ленте.

   Кто может: аудитория от CC_HOST_REACH, либо свой клуб, либо тот PR, с
   которого зовут на чужие кастомки. Ставка за победу растёт с каналом, а не
   выбирается — так вечер стоит ровно столько, сколько ты уже собрал зрителей.
   Своя игра считается тем же броском, что и на чужой кастомке (ccCustomPlay):
   это не турнир карьеры — журнал, квалификации и PR не трогаются. */
const CC_HOST_REACH=3000;
function ccHostPerWin(){
  const r=careerReach();
  return r>=100000 ? 500 : r>=20000 ? 250 : 100;
}
function ccHostPot(){ return ccHostPerWin()*CC_CUSTOM_GAMES; }
// Почему нельзя — словом для кнопки; null — можно.
function ccHostWhy(){
  const cr=CAREER && CAREER.career; if(!cr) return 'reach';
  const own=typeof careerClub==='function' && careerClub();
  if(!(careerReach()>=CC_HOST_REACH || own || ccCustomPr()>=CC_CUSTOM_PR)) return 'reach';
  if((cr.balance||0)<ccHostPot()) return 'cash';
  return null;
}
// Лобби: 49 человек своего региона, ближайшие по рейтингу; свои люди не зовутся.
function ccHostField(){
  const pl=CAREER.player, mine=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  const taken=ccMyPeople();
  const ovrOf=c=>(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr||0);
  return careerRosterNowEU().filter(p=>!taken.has(hKey(p)))
    .map(p=>({handle:p.handle, ovr:ovrOf(p)}))
    .sort((a,b)=>Math.abs(a.ovr-mine)-Math.abs(b.ovr-mine))
    .slice(0, 49);
}
function ccHostRun(){
  const cr=CAREER.career, pl=CAREER.player;
  if(ccHostWhy()) return null;
  const per=ccHostPerWin(), pot=per*CC_CUSTOM_GAMES;
  cr.balance=(cr.balance||0)-pot;
  cr.hosted=(cr.hosted||0)+pot;
  const rnd=careerRng(ccHashStr('host|'+(cr.season||1)+'|'+careerToday()));
  const mine=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  const pMe=clamp(0.05+(mine-ccBand(1))*0.012, 0.02, 0.45);
  const field=ccHostField();
  const weight=c=>Math.exp((c.ovr-90)/4);
  const total=field.reduce((s,c)=>s+weight(c), 0);
  const wins=new Map(); let myWins=0;
  for(let g=0; g<CC_CUSTOM_GAMES; g++){
    if(rnd()<pMe){ myWins++; continue; }
    let r=rnd()*total, w=field[field.length-1];
    for(let i=0;i<field.length;i++){ r-=weight(field[i]); if(r<=0){ w=field[i]; break; } }
    wins.set(w.handle, (wins.get(w.handle)||0)+1);
  }
  const cash=myWins*per;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  // Победители игр — на общую доску денег, своими именами.
  const winners=[...wins.keys()];
  if(winners.length) careerMoneyAdd(winners.map(h=>({name:h})), (i,t)=>wins.get(t.name)*per);
  // Организатор в эфире: вечер растит охват сильнее обычного стрима и даёт репутацию.
  careerReachAdd(3*CC_REACH_DIV(cr.division));
  careerRepAdd(1);
  const who=winners.length
    ? winners.map(h=>'@'+ccHandle(h)+(wins.get(h)>1 ? ' ×'+wins.get(h) : '')).join(', ')
    : '-';
  careerNews('flat', 'ccPostHosted', [per, who, myWins]);
  cr.hostLast={day:careerToday(), a:[myWins, cash ? ccNum(cash) : 0, who]};
  return {wins:myWins, cash:cash, pot:pot, per:per, winners:winners};
}
/* DISCORD В СОЦСЕТИ (его слово 19.11: «добавить дискорд в social, чтоб сделать кастомки на пк и на мобил и прочее»).
   Кастомки этой сцены живут в Discord: сервер организатора, канал объявлений, вход по порогу. Здесь три сервера:
   PC Customs — та же кастомка, что приходила событием дня (ccCustomPlay, порог PR CC_CUSTOM_PR), теперь по желанию;
   Mobile Customs — пять игр по 16, только тач (как Mobile Series), зовут с мобильного рейтинга CC_DC_MOB_RATE, качает
   мобильный рейтинг как скрим (игрок мобильной сцены: «every cup I just get destroyed, no way to practice»);
   Мой сервер — провести свою кастомку на ПК (ccHostRun) или на мобиле, фонд с баланса. И канал скримов со ссылками на
   занятия дня. Каждое — раз в день, 40 энергии, в свободный день. Пороги и ставки мобилы — решение, не замер. */
const CC_DC_ENERGY=40, CC_DC_MOB_RATE=75, CC_DC_MOB_PER_WIN=50;
let CH_DC='crew';   // первым - тусовка региона (ccCrewHTML)
function ccDcDid(kind){ const d=CAREER.career.dcDid; return !!(d && d.day===careerToday() && d.kinds.indexOf(kind)>=0); }
function ccMobHostPer(){ return Math.max(50, ccHostPerWin()/2); }
function ccMobHostWhy(){
  const cr=CAREER && CAREER.career; if(!cr) return 'reach';
  if(!ccMobileOwn()) return 'phone';
  const own=typeof careerClub==='function' && careerClub();
  if(!(careerReach()>=CC_HOST_REACH || own || ccCustomPr()>=CC_CUSTOM_PR)) return 'reach';
  if((cr.balance||0)<ccMobHostPer()*CC_CUSTOM_GAMES) return 'cash';
  return null;
}
// Почему нельзя (строкой) или null.
function ccDcWhy(kind){
  const cr=CAREER.career, T=L();
  if(!ccCentreDayOpen()) return T.dcDayClosed;
  if(ccDcDid(kind)) return T.dcDone;
  if(typeof ccMpOn==='function' && ccMpOn()) return T.dcMpOff;
  if(kind==='mobJoin' && !ccMobileOwn()) return T.ccMobTrainNeed;
  if(kind==='pcHost' || kind==='mobHost'){
    const w=kind==='pcHost' ? ccHostWhy() : ccMobHostWhy();
    if(w==='phone') return T.ccMobTrainNeed;
    if(w==='reach') return T.dcNeedReach(ccNum(CC_HOST_REACH));
    if(w==='cash') return T.dcNeedCash(ccNum((kind==='pcHost' ? ccHostPot() : ccMobHostPer()*CC_CUSTOM_GAMES)-(cr.balance||0)));
  }
  if(careerEnergy()<CC_DC_ENERGY) return T.ccNeedEnergy(CC_DC_ENERGY-careerEnergy());
  return null;
}
// Мобильная кастомка: пять игр по 16, шанс победы от мобильного рейтинга против верха сцены (~85), одна шестнадцатая на равных.
function ccMobCustomPlay(){
  const cr=CAREER.career;
  const rnd=careerRng(ccHashStr('mcustom|'+(cr.season||1)+'|'+careerToday()));
  const p=clamp(1/16+(ccMobileOvr()-85)*0.015, 0.02, 0.5);
  let wins=0; for(let g=0; g<CC_CUSTOM_GAMES; g++) if(rnd()<p) wins++;
  const cash=wins*CC_DC_MOB_PER_WIN;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  const grow=ccMobileTrain(true);
  careerReachAdd(wins ? 2 : 1);
  return {wins:wins, cash:cash, grow:grow};
}
// Своя мобильная кастомка: 15 мобильных игроков своего региона ближе всех по рейтингу, победители — их ники в посте.
function ccMobHostRun(){
  const cr=CAREER.career;
  if(ccMobHostWhy()) return null;
  const per=ccMobHostPer(), pot=per*CC_CUSTOM_GAMES, mine=ccMobileOvr();
  cr.balance=(cr.balance||0)-pot; cr.hosted=(cr.hosted||0)+pot;
  const R=(typeof CC_MOBILE_ROSTER!=='undefined') ? (CC_MOBILE_ROSTER[ccCareerRegion()] || CC_MOBILE_ROSTER.EU || []) : [];
  const field=R.map(x=>({handle:x[0], ovr:ccMobileRate(x[0], x[2])})).sort((a,b)=>Math.abs(a.ovr-mine)-Math.abs(b.ovr-mine)).slice(0, 15);
  const rnd=careerRng(ccHashStr('mhost|'+(cr.season||1)+'|'+careerToday()));
  const pMe=clamp(1/16+(mine-85)*0.015, 0.02, 0.5);
  const weight=c=>Math.exp((c.ovr-85)/4), total=field.reduce((s,c)=>s+weight(c), 0);
  const wins=new Map(); let myWins=0;
  for(let g=0; g<CC_CUSTOM_GAMES; g++){
    if(rnd()<pMe || !field.length){ myWins++; continue; }
    let r=rnd()*total, w=field[field.length-1];
    for(let i=0;i<field.length;i++){ r-=weight(field[i]); if(r<=0){ w=field[i]; break; } }
    wins.set(w.handle, (wins.get(w.handle)||0)+1);
  }
  const cash=myWins*per;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  careerReachAdd(2*CC_REACH_DIV(cr.division));
  const winners=[...wins.keys()];
  const who=winners.length ? winners.map(h=>'@'+ccHandle(h)+(wins.get(h)>1 ? ' ×'+wins.get(h) : '')).join(', ') : '-';
  careerNews('flat', 'ccPostHosted', [per, who, myWins]);
  return {wins:myWins, cash:cash, pot:pot, per:per, winners:winners};
}
function ccDcGo(kind){
  if(ccDcWhy(kind)) return;
  const cr=CAREER.career;
  careerSpend(CC_DC_ENERGY);
  let r=null;
  if(kind==='pcJoin'){ r=ccCustomPlay(); careerNews(r.wins ? 'good' : 'flat', 'ccDayEvcustomTake', [r.wins, ccNum(r.cash)]); }
  else if(kind==='mobJoin'){ r=ccMobCustomPlay(); careerNews(r.wins ? 'good' : 'flat', 'ccDayEvcustomTake', [r.wins, ccNum(r.cash)]); }
  else if(kind==='pcHost') r=ccHostRun();
  else if(kind==='mobHost') r=ccMobHostRun();
  const d=(cr.dcDid && cr.dcDid.day===careerToday()) ? cr.dcDid : {day:careerToday(), kinds:[]};
  d.kinds.push(kind); cr.dcDid=d;
  cr.dcLast={day:careerToday(), kind:kind, wins:r ? r.wins : 0, cash:r ? r.cash : 0, grow:r && r.grow ? r.grow : 0,
             who:r && r.winners ? r.winners.slice(0, 5) : null};
  careerSave();
  careerRenderHub('discord');
}
/* СЕССИЯ КАСТОМОК КАК НА НАСТОЯЩИХ (его слово 19.11: «сделать симуляции игр, регистрацию кастомок, как на настоящих
   кастомках»). Как у Noble (nobleprac.com, сессии и таблицы 18.11.2026): в день несколько сессий (Session 1, 2, Late Night),
   запись, чек-ин, код лобби, игры, таблица «убийства / игры / победы / очки». Noble Solos — 2 игры за сессию, топ-5 зовут
   в Solos Closed; Practice Scrims — Solo/Duo/Trio Customs, топ-5 зовут в Division 3 (правила там же: файт до 60 живых, после
   4-й зоны снова можно, играть на эндгейм). Здесь: регистрация бесплатная, чек-ин даёт код, «Играть» — живые игры на карте
   с игроками своего региона уровня твоего сервера; 40 энергии, вечер дня. Командные кастомки — 3 игры, мобильные — 5 по 16
   (решение, не замер). Очки — как в первом раунде капа, 2 за элим. */
const CC_DC_SESS=[{id:'s1', n:'Session 1', t:'18:00'}, {id:'s2', n:'Session 2', t:'20:00'}, {id:'ln', n:'Late Night', t:'23:00'}];
// Куда зовёт топ-5 сессии (nobleprac.com): Practice Scrims → Division 3, Solos Closed и Division 3 → Division 2, Division 2 → Division 1.
// Выше Division 1 приглашением не попасть: Pro Scrims — по PR, Noble X — только tier 1.
const CC_NOBLE_PROMO={6:4, 5:3, 4:3, 3:2};
function ccDcReg(){ const r=CAREER.career.dcReg; return (r && r.day===careerToday()) ? r : null; }
function ccDcSessFmt(kind){
  if(kind==='mob') return {solo:true, games:5, lobby:16};
  const solo=careerSquadSize()<=1 || /Solos/.test(ccNobleServer().name) || !(careerMates()||[]).length || careerMates().some(m=>!m);
  return {solo:solo, games:solo ? 2 : 3, lobby:solo ? 100 : ccTeams(50)};
}
function ccDcSessTitle(kind, s){
  const d=careerToday(), dd=d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4);
  const f=ccDcSessFmt(kind), fmt=f.solo ? 'Solos' : (['','Solos','Duo','Trio','Squad'][careerSquadSize()]||'Duo')+' Customs';
  return (kind==='mob' ? L().dcSrvMob : ccNobleServer().name)+' · '+(kind==='mob' ? 'Touch' : fmt)+' '+s.n+' ['+dd+']';
}
function ccDcRegister(kind, sid){
  const cr=CAREER.career;
  if(ccDcReg()) return;
  const rnd=careerRng(ccHashStr('dccode|'+careerToday()+'|'+kind+'|'+sid));
  const code=(kind==='mob' ? 'TOUCH' : ccCareerRegion()==='EU' ? 'NOBLE' : String(ccPracSrv()).split(' ')[0].toUpperCase())+(1000+Math.floor(rnd()*9000));
  cr.dcReg={day:careerToday(), kind:kind, sess:sid, code:code, checked:false};
  careerSave(); careerRenderHub('discord');
}
// После чек-ина открывается канал, где теперь код лобби и метка (раскладка как в Discord показывает один канал).
function ccDcCheckIn(){ const r=ccDcReg(); if(!r) return; r.checked=true; CH_DCC[CH_DC||'crew']=L().dcCheckChan; CH_DCV='chan'; careerSave(); careerRenderHub('discord'); }
function ccDcUnreg(){ const r=ccDcReg(); if(!r || r.done) return; delete CAREER.career.dcReg; careerSave(); careerRenderHub('discord'); }
function ccDcBack(){ careerBackToHub(); careerTab('discord'); }
async function ccScrimRun(){
  const r=ccDcReg(); if(!r || !r.checked || r.done || r.spot==null) return;
  const kind=r.kind, why=ccDcWhy(kind==='mob' ? 'mobJoin' : 'pcJoin'); if(why) return;
  const cr=CAREER.career, me=careerCard(); if(!me) return;
  const f=ccDcSessFmt(kind), s=CC_DC_SESS.find(x=>x.id===r.sess)||CC_DC_SESS[0], title=ccDcSessTitle(kind, s);
  careerSpend(CC_DC_ENERGY);
  r.done=true;
  const d=(cr.dcDid && cr.dcDid.day===careerToday()) ? cr.dcDid : {day:careerToday(), kinds:[]};
  d.kinds.push(kind==='mob' ? 'mobJoin' : 'pcJoin'); cr.dcDid=d;
  careerSave();
  const S=ccDcScrSetup(r, true); if(!S) return;
  ccDcScrMarks(r, S);
  const field=S.field, you=S.you, tier=ccNobleTier();
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
  const sc=kind==='mob' ? ccCupScore({id:'S41_MobileSeriesHeat1'}, 1) : null;
  await simulateGamesLive(field, f.games, sc ? sc.pts : victoryR1Points, sc ? sc.kill : CC_VICTORY_R1_KILL, 'stage', 0, null, null,
    {lobbySize:Math.min(field.length, kind==='mob' ? 16 : (f.solo ? 100 : ccTeams(50))), stageName:title, mapReplay:true, choices:true, stopOnYourDeath:true,
     // Как на сессиях Noble: точки отмечены заранее в канале карты дропов, первая игра — по этим меткам.
     dropEachGame:(g,room)=>(g===1 && r.spot!=null) ? ccDcDropGroups(room||field, you, r) : careerLandingPick(room||field, you, title, ['victory'])});
  removeSkipButton();
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1, wins=you.wins||0, kills=you.stageElims||0;
  // Итог: форма (как у сессии Noble), мобилка — рейтинг и деньги за победы, EU — инвайт выше по лестнице за топ-5.
  let note='', promo=null;
  cr.form=clamp((cr.form||0)+ccNobleForm(place, field.length), -CC_FORM_MAX, CC_FORM_MAX);
  if(kind==='mob'){
    const cash=wins*CC_DC_MOB_PER_WIN; if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
    const g=ccMobileTrain(true); note=L().ccMobTitle+' +'+g.toFixed(2)+(cash ? ' · '+ccMoney(cash) : '');
  } else if(ccCareerRegion()==='EU' && place<=5 && CC_NOBLE_PROMO[tier]!=null){
    promo=CC_NOBLE_LADDER[CC_NOBLE_PROMO[tier]].name; cr.nobleInv=Math.min(cr.nobleInv!=null ? cr.nobleInv : 9, CC_NOBLE_PROMO[tier]);
    note=L().dcPromoGot(promo);
  } else if(ccCareerRegion()==='EU' && CC_NOBLE_PROMO[tier]!=null) note=L().dcPromo(CC_NOBLE_LADDER[CC_NOBLE_PROMO[tier]].name);
  // Неделя сервера: очки сессии в таблицу недели (та же, что у занятия в «Тренировке»).
  if(kind!=='mob'){ const lf=ccLife(), wk=ccMonthKey(careerToday())+'|'+Math.floor(((+careerToday().slice(8,10))-1)/7), sv=ccNobleServer();
    if(!lf.noble || lf.noble.wk!==wk) lf.noble={wk, server:sv.name, me:0, n:0, rows:ccNobleRivals(sv, wk)};
    lf.noble.me+=you.stagePts||0; lf.noble.n++; lf.noble.server=sv.name; }
  careerReachAdd(1);
  careerNews(place<=10 ? 'good' : 'flat', 'lfNewsNoble', [title, place, field.length, kills, you.stagePts||0, ccNobleForm(place, field.length)]);
  r.res={place:place, of:field.length, pts:you.stagePts||0, kills:kills, wins:wins, note:note};
  cr.dcLast={day:careerToday(), kind:kind==='mob' ? 'mobJoin' : 'pcJoin', wins:wins, cash:kind==='mob' ? wins*CC_DC_MOB_PER_WIN : 0, grow:0, who:null};
  careerSave();
  const shell=createStageCardShell(title+' · '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, place<=5, false, L().dcSessRes(place, field.length, you.stagePts||0, kills, wins)+(note ? ' · '+note : ''));
  await revealStandings(shell, ranked, you, 5, null, null, null, null, false);
  S.restore();
  const box=document.createElement('div'); box.className='stage-card '+(place<=5 ? 'pass' : 'fail');
  box.innerHTML='<h4>'+esc(title)+' <span class="stage-badge '+(place<=5 ? 'pass' : 'fail')+'">#'+place+'</span></h4>'+
    '<div class="stage-detail"><div>'+esc(L().dcSessRes(place, field.length, you.stagePts||0, kills, wins))+'</div>'+(note ? '<div>'+esc(note)+'</div>' : '')+'</div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="ccDcBack()">'+esc(L().dcBackDc)+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
/* СКРИМЫ ХОСТЯТ АДМИНЫ СЕРВЕРА, игрок их не создаёт (его слово 19.11: «scrims не создавать, а что хостили админы и ты
   регаешься, так же работает; и метку на карту ставишь с другими игроками»). Блоки дня от админа сервера практики
   региона, запись на блок, чек-ин с кодом, потом канал карты дропов: метки других команд уже стоят (раздача комнаты
   тем же buildBotLandingAssignment), свою ставишь нажатием на квадрат. Первая игра блока идёт ровно по этим меткам,
   дальше точка спрашивается как обычно. Цена и прибавка — занятие дня «скрим» / «мобильные скримы» (careerDoAct). */
const CC_DC_SCR_SESS=[{id:'b1', n:'Scrims Block 1', t:'19:00'}, {id:'b2', n:'Scrims Block 2', t:'21:30'}];
function ccDcScrReg(){ const r=CAREER.career.dcScr; return (r && r.day===careerToday()) ? r : null; }
function ccDcScrAct(kind){ return kind==='mob' ? 'mobScrim' : 'scrim'; }
function ccDcScrOrg(kind){ return kind==='mob' ? L().dcSrvMob : ccPracSrv(); }
function ccDcScrWhy(kind){
  const T=L(), a=ccActById(ccDcScrAct(kind));
  if(!a) return '-';
  if(typeof ccMpOn==='function' && ccMpOn()) return T.dcScrBusy;
  if(!ccCentreDayOpen() || careerDayClosed()) return T.dcScrBusy;
  if(a.mobile && !ccMobileOwn()) return T.ccMobTrainNeed;
  if(careerEnergy()<a.energy) return T.ccNeedEnergy(a.energy-careerEnergy());
  return null;
}
function ccDcScrTitle(kind, s){
  const d=careerToday(), dd=d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4);
  const fmt=kind==='mob' ? 'Touch' : (['','Solo','Duo','Trio','Squad'][careerSquadSize()]||'Duo');
  return ccDcScrOrg(kind)+' · '+fmt+' Scrims '+s.n.replace('Scrims ','')+' ['+dd+']';
}
function ccDcScrRegister(kind, sid){
  const cr=CAREER.career;
  if(ccDcScrReg() || ccDcScrWhy(kind)) return;
  const rnd=careerRng(ccHashStr('dcscr|'+careerToday()+'|'+kind+'|'+sid));
  cr.dcScr={day:careerToday(), kind:kind, sess:sid, code:'SCRIM'+(1000+Math.floor(rnd()*9000)), checked:false, spot:null, marks:null};
  careerSave(); careerRenderHub('discord');
}
function ccDcScrCheckIn(){ const r=ccDcScrReg(); if(!r) return; r.checked=true; CH_DCC[CH_DC||'crew']=L().dcDropChan; CH_DCV='chan'; careerSave(); careerRenderHub('discord'); }
function ccDcScrUnreg(){ const r=ccDcScrReg(); if(!r || r.done) return; delete CAREER.career.dcScr; careerSave(); careerRenderHub('discord'); }
// Ключ команды для меток: ники состава, как их видит раскладка (одинаков при сборке комнаты заново).
function ccDcTk(t){ return (t && t.squad || []).map(c=>c ? hKey(c) : '').filter(Boolean).sort().join('+') || String(t && t.name || ''); }
// Комната блока: тот же состав, остров и поле, что и в игре; restore() возвращает драфт как было.
function ccDcScrSetup(r, cust){
  const me=careerCard(); if(!me) return null;
  const kind=r.kind, mates=(careerMates()||[]).filter(Boolean), sf=cust ? ccDcSessFmt(kind) : null;
  const solo=sf ? sf.solo : (kind==='mob' || careerSquadSize()<=1 || !mates.length);
  const games=sf ? sf.games : (kind==='mob' ? 5 : 3), lobby=sf ? sf.lobby : (kind==='mob' ? 16 : (solo ? 100 : ccTeams(50)));
  const prev={mode:CARD_MODE, size:squadSize, drafted:drafted, set:ACTIVE_LANDING_SET};
  CARD_MODE=true; squadSize=solo ? 1 : careerSquadSize(); drafted=solo ? [me] : [me].concat(mates);
  useLandingSet(kind==='mob' && ZONE_SETS.r6 ? 'r6' : careerBrSet());
  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  if(kind==='mob') you.pow=ccMobileSelfPow();
  const tier=ccNobleTier(), crT=Object.assign({}, CAREER.career, {division:[1,1,1,2,3,4,5][tier]||5});
  const field=[you].concat(kind==='mob' ? ccMobileField(lobby-1, 'reg')
    : solo ? careerSoloField(crT, [me], lobby, true)
    : careerCupField(crT, drafted, lobby, (cust ? 'dc|' : 'dcs|')+r.day+'|'+r.sess, true, tier<=1 ? CC_FIELD_SHARP.lan : 0));
  return {field:field, you:you, games:games, lobby:lobby, solo:solo, prev:prev,
          restore:function(){ CARD_MODE=prev.mode; squadSize=prev.size; drafted=prev.drafted; useLandingSet(prev.set); }};
}
// Метки остальных команд — один раз на блок, дальше лежат в записи (r.marks: [ключ, квадрат, ники]).
function ccDcScrMarks(r, S){
  if(r.marks) return r.marks;
  const zones=ALL_LANDING_ZONES||[], m=[];
  const nameOf=t=>(t.squad||[]).map(c=>c && c.handle).filter(Boolean).join(' + ') || String(t.name||'').replace(/<[^>]*>/g,'');
  const pre=buildBotLandingAssignment(S.field.filter(t=>t!==S.you)).zoneGroups;
  pre.forEach((list, z)=>{ const i=zones.indexOf(z); if(i<0) return;
    (list||[]).forEach(t=>{ if(t && !t.isYou) m.push([ccDcTk(t), i, nameOf(t)]); }); });
  r.marks=m; r.grid=ACTIVE_LANDING_SET;
  careerSave();
  return m;
}
function ccDcDropReg(which){ return which==='cust' ? ccDcReg() : ccDcScrReg(); }
// Метка сама (для «Noble вместе» из тусовки): точка, где меньше всего чужих меток, при равенстве - богаче лутом.
function ccDcAutoSpot(r){
  const S=ccDcScrSetup(r, true); if(!S) return;
  try{
    const zones=ALL_LANDING_ZONES||[], marks=ccDcScrMarks(r, S), cnt=new Map();
    marks.forEach(m=>cnt.set(m[1], (cnt.get(m[1])||0)+1));
    let best=0, bs=-1e9;
    zones.forEach((z, i)=>{ const s=-(cnt.get(i)||0)*100+(z.points||0); if(s>bs){ bs=s; best=i; } });
    r.spot=best;
  } finally{ S.restore(); }
}
function ccDcDropOpen(which){
  which=which==='cust' ? 'cust' : 'scr';
  const r=ccDcDropReg(which); if(!r || !r.checked || r.done) return;
  const S=ccDcScrSetup(r, which==='cust'); if(!S) return;
  let html='';
  try{
    const T=L(), zones=ALL_LANDING_ZONES||[], marks=ccDcScrMarks(r, S), grid=ACTIVE_LANDING_SET;
    const art=MAP_ART[grid]||MAP_ART.m2, asp=MAP_ASPECT[grid]||'1100/970';
    const by=new Map(); marks.forEach(m=>{ if(!by.has(m[1])) by.set(m[1], []); by.get(m[1]).push(m[2]); });
    const meName=(S.you.squad||[]).map(c=>c && c.handle).filter(Boolean).join(' + ') || ccHandle(CAREER.player.nick||'');
    const boxes=zones.map((z,i)=>{
      const who=(by.get(i)||[]).slice(), me=r.spot===i; if(me) who.unshift(meName);
      const cls='cc-dm-box pick'+(who.length>=2 ? ' hot' : '')+(me ? ' me' : '')+(who.length ? '' : ' free');
      return '<button type="button" class="'+cls+'" style="left:'+z.x+'%;top:'+z.y+'%;width:'+z.w+'%;height:'+z.h+'%" onclick="ccDcDropPick('+i+',\''+which+'\')" aria-label="'+
        esc(T.landingZoneSuffix(i+1))+'"><span>'+who.slice(0, 3).map(n=>esc(n)).join('<br>')+(who.length>3 ? '<br>+'+(who.length-3) : '')+'</span></button>';
    }).join('');
    const mineN=r.spot!=null ? (by.get(r.spot)||[]).length : 0;
    html='<div class="cc-dm" role="dialog" aria-modal="true"><div class="cc-dm-head"><b>#'+esc(T.dcDropChan)+'</b><em>'+
      esc(which==='cust' ? ccDcSessTitle(r.kind, CC_DC_SESS.find(s=>s.id===r.sess)||CC_DC_SESS[0]) : ccDcScrTitle(r.kind, CC_DC_SCR_SESS.find(s=>s.id===r.sess)||CC_DC_SCR_SESS[0]))+'</em>'+
      '<button class="cc-dm-x" onclick="ccDropMapClose()" aria-label="'+esc(T.ccDropMapClose)+'">×</button></div>'+
      '<div class="cc-dm-map" style="aspect-ratio:'+asp+';background-image:url(\''+art+'\')">'+boxes+'</div>'+
      '<p class="cc-dm-note">'+esc(r.spot!=null ? T.dcDropMine(T.landingZoneSuffix(r.spot+1), mineN) : T.dcDropHint)+'</p>'+
      (r.spot!=null ? '<div class="dc-act"><button class="dc-btn" onclick="ccDropMapClose();careerRenderHub(\'discord\')">'+esc(T.dcDropDone)+'</button></div>' : '')+'</div>';
  } finally{ S.restore(); }
  ccDropMapClose();
  const el=document.createElement('div');
  el.id='ccDropMapModal'; el.className='cc-dm-wrap cc-dc-drop';
  el.onclick=e=>{ if(e.target===el){ ccDropMapClose(); careerRenderHub('discord'); } };
  el.innerHTML=html;
  document.body.appendChild(el);
}
function ccDcDropPick(i, which){
  const r=ccDcDropReg(which); if(!r || !r.checked || r.done) return;
  r.spot=i; careerSave(); ccDcDropOpen(which);
}
// Первая игра блока — по меткам канала: своя команда на свой квадрат, остальные на свои; кого не нашли — раздачей.
function ccDcDropGroups(field, you, r){
  const zones=ALL_LANDING_ZONES||[], groups=new Map(), byKey=new Map((r.marks||[]).map(m=>[m[0], m[1]]));
  CC_STYLE_TEAM=you; ccApplyPlayStyle(you);
  const put=(t, z)=>{ t.landingZone=z; t.landingResult=null; t.landingRival=null; applyLandingPow(t, z.points);
    if(!groups.has(z)) groups.set(z, []); groups.get(z).push(t); };
  const rest=[];
  (field||[]).forEach(t=>{
    const i=t===you ? r.spot : byKey.get(ccDcTk(t)), z=i!=null ? zones[i] : null;
    if(z) put(t, z); else rest.push(t);
  });
  if(rest.length) buildBotLandingAssignment(rest, {into:groups});
  r.matched=(field||[]).length-rest.length;
  return groups;
}
async function ccDcScrRun(){
  const r=ccDcScrReg(); if(!r || !r.checked || r.done || r.spot==null) return;
  const kind=r.kind; if(ccDcScrWhy(kind)) return;
  if(!careerDoAct(ccDcScrAct(kind))) return;
  const cr=CAREER.career;
  r.done=true; careerSave();
  const s=CC_DC_SCR_SESS.find(x=>x.id===r.sess)||CC_DC_SCR_SESS[0], title=ccDcScrTitle(kind, s);
  const S=ccDcScrSetup(r); if(!S){ return; }
  ccDcScrMarks(r, S);
  const field=S.field, you=S.you;
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
  const sc=kind==='mob' ? ccCupScore({id:'S41_MobileSeriesHeat1'}, 1) : null;
  await simulateGamesLive(field, S.games, sc ? sc.pts : victoryR1Points, sc ? sc.kill : CC_VICTORY_R1_KILL, 'stage', 0, null, null,
    {lobbySize:Math.min(field.length, S.lobby), stageName:title, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g, room)=>(g===1 && r.spot!=null) ? ccDcDropGroups(room||field, you, r) : careerLandingPick(room||field, you, title, ['victory'])});
  removeSkipButton();
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1, wins=you.wins||0, kills=you.stageElims||0;
  cr.form=clamp((cr.form||0)+ccNobleForm(place, field.length), -CC_FORM_MAX, CC_FORM_MAX);
  careerReachAdd(1);
  careerNews(place<=10 ? 'good' : 'flat', 'lfNewsNoble', [title, place, field.length, kills, you.stagePts||0, ccNobleForm(place, field.length)]);
  r.res={place:place, of:field.length, pts:you.stagePts||0, kills:kills, wins:wins};
  careerSave();
  const shell=createStageCardShell(title+' · '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, place<=5, false, L().dcSessRes(place, field.length, you.stagePts||0, kills, wins));
  await revealStandings(shell, ranked, you, 5, null, null, null, null, false);
  S.restore();
  const box=document.createElement('div'); box.className='stage-card '+(place<=5 ? 'pass' : 'fail');
  box.innerHTML='<h4>'+esc(title)+' <span class="stage-badge '+(place<=5 ? 'pass' : 'fail')+'">#'+place+'</span></h4>'+
    '<div class="stage-detail"><div>'+esc(L().dcSessRes(place, field.length, you.stagePts||0, kills, wins))+'</div></div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="ccDcBack()">'+esc(L().dcBackDc)+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
// Каналы скримов: объявление админа, запись на блок, чек-ин с кодом, карта дропов, игра.
function ccDcScrHTML(kind, chan, msg){
  const T=L(), r=ccDcScrReg(), mine=r && r.kind===kind ? r : null, other=r && r.kind!==kind;
  const why=ccDcScrWhy(kind), org=ccDcScrOrg(kind), a=ccActById(ccDcScrAct(kind));
  const ann=chan(T.dcScrims, msg(org+' Admin', true, '<p>'+esc(T.dcScrAnn(CC_DC_SCR_SESS.map(s=>s.n+' '+s.t).join(', ')))+'</p>'));
  const list=CC_DC_SCR_SESS.map(s=>{ const on=mine && mine.sess===s.id;
    const b=on ? '<span class="dc-ok">✓ '+esc(T.dcRegDone)+'</span>'+(mine.done ? '' : ' <button class="dc-btn ghost sm" onclick="ccDcScrUnreg()">'+esc(T.dcUnreg)+'</button>')
      : (r || why) ? '' : '<button class="dc-btn sm" onclick="ccDcScrRegister(\''+kind+'\',\''+s.id+'\')">'+esc(T.dcReg)+'</button>';
    return '<div class="dc-sess'+(on ? ' on' : '')+'"><span><b>'+esc(s.n)+'</b> <i>'+s.t+'</i></span>'+b+'</div>'; }).join('');
  let step='';
  if(mine && mine.done && mine.res){
    const x=mine.res; step='<div class="dc-res">'+esc(T.dcSessRes(x.place, x.of, x.pts, x.kills, x.wins))+'</div>';
  } else if(mine && !mine.checked){
    step='<div class="dc-act"><button class="dc-btn" onclick="ccDcScrCheckIn()">'+esc(T.dcCheckIn)+'</button></div>';
  } else if(mine){
    const has=mine.spot!=null;
    step='<p class="dc-code">'+esc(T.dcCode(mine.code))+'</p>'+
      '<div class="dc-act"><button class="dc-btn'+(has ? ' ghost' : '')+'" onclick="ccDcDropOpen(\'scr\')">📍 '+esc(has ? T.dcDropEdit : T.dcDropBtn)+'</button>'+
      (has ? '<span class="dc-sub">'+esc(T.landingZoneSuffix(mine.spot+1))+'</span>' : '')+'</div>'+
      '<div class="dc-act"><button class="dc-btn"'+(why || !has ? ' disabled' : '')+' onclick="ccDcScrRun()">'+esc(T.dcPlay)+' <em>'+(a ? a.energy : 40)+T.ccEnergyMark+'</em></button>'+
      (why ? '<span class="dc-why">'+esc(why)+'</span>' : !has ? '<span class="dc-why">'+esc(T.dcDropNeed)+'</span>' : '')+'</div>';
  } else step='<p class="dc-sub">'+esc(other ? T.dcRegOther : why || T.dcSteps)+'</p>';
  return ann+
    '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcScrims)+'-'+esc(T.dcRegChan)+'</div>'+list+'</div>'+
    '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcDropChan)+'</div>'+step+'</div>';
}
// Каналы регистрации и чек-ина сервера (kind: 'pc' | 'mob').
function ccDcSessHTML(kind){
  const T=L(), r=ccDcReg(), mine=r && r.kind===kind ? r : null, other=r && r.kind!==kind;
  const why=ccDcWhy(kind==='mob' ? 'mobJoin' : 'pcJoin');
  const list=CC_DC_SESS.map(s=>{ const on=mine && mine.sess===s.id;
    const b=on ? '<span class="dc-ok">✓ '+esc(T.dcRegDone)+'</span>'+(mine.done ? '' : ' <button class="dc-btn ghost sm" onclick="ccDcUnreg()">'+esc(T.dcUnreg)+'</button>')
      : (r || why) ? '' : '<button class="dc-btn sm" onclick="ccDcRegister(\''+kind+'\',\''+s.id+'\')">'+esc(T.dcReg)+'</button>';
    return '<div class="dc-sess'+(on ? ' on' : '')+'"><span><b>'+esc(s.n)+'</b> <i>'+s.t+'</i></span>'+b+'</div>'; }).join('');
  let check='';
  if(mine && mine.done && mine.res){
    const x=mine.res; check='<div class="dc-res">'+esc(T.dcSessRes(x.place, x.of, x.pts, x.kills, x.wins))+(x.note ? ' · '+esc(x.note) : '')+'</div>';
  } else if(mine && !mine.checked){
    check='<div class="dc-act"><button class="dc-btn" onclick="ccDcCheckIn()">'+esc(T.dcCheckIn)+'</button></div>';
  } else if(mine){
    const has=mine.spot!=null;
    check='<p class="dc-code">'+esc(T.dcCode(mine.code))+'</p>'+
      '<div class="dc-act"><button class="dc-btn'+(has ? ' ghost' : '')+'" onclick="ccDcDropOpen(\'cust\')">📍 '+esc(has ? T.dcDropEdit : T.dcDropBtn)+'</button>'+
      (has ? '<span class="dc-sub">'+esc(T.landingZoneSuffix(mine.spot+1))+'</span>' : '')+'</div>'+
      '<div class="dc-act"><button class="dc-btn"'+(why || !has ? ' disabled' : '')+' onclick="ccScrimRun()">'+
      esc(T.dcPlay)+' <em>'+CC_DC_ENERGY+T.ccEnergyMark+'</em></button>'+(why ? '<span class="dc-why">'+esc(why)+'</span>' : !has ? '<span class="dc-why">'+esc(T.dcDropNeed)+'</span>' : '')+'</div>';
  } else check='<p class="dc-sub">'+esc(other ? T.dcRegOther : why || T.dcSteps)+'</p>';
  const f=ccDcSessFmt(kind);
  return '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcRegChan)+'</div>'+
      '<p class="dc-sub">'+esc(T.dcFmt(f.games, kind==='mob' ? 16 : 100))+(kind!=='mob' && ccCareerRegion()==='EU' ? ' '+esc(T.dcRules) : '')+'</p>'+list+'</div>'+
    '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcCheckChan)+'</div>'+check+'</div>';
}
/* Ещё два сервера (22.11, его «12» на список): сервер клуба (только в орге) и официальный Fortnite Competitive.
   Оба читают то, что в карьере уже есть: календарь (careerEvents), журнал (cr.log), состав (careerMates), тренера (ccCoach),
   менеджера (CAREER.agent). Своих механик у них нет, это лента и состав. */
const CC_DC_FN_IMG='art/comp/fnce-39-00-comp-fncs2026update-in-game-tab-800x800-800x800-0061b675ce4a.jpg';
const CC_DC_EU_SVG='<svg class="dc-eu" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" fill="#003399"/><g fill="#ffcc00"><circle cx="12.00" cy="6.00" r="1"/><circle cx="15.00" cy="6.80" r="1"/><circle cx="17.20" cy="9.00" r="1"/><circle cx="18.00" cy="12.00" r="1"/><circle cx="17.20" cy="15.00" r="1"/><circle cx="15.00" cy="17.20" r="1"/><circle cx="12.00" cy="18.00" r="1"/><circle cx="9.00" cy="17.20" r="1"/><circle cx="6.80" cy="15.00" r="1"/><circle cx="6.00" cy="12.00" r="1"/><circle cx="6.80" cy="9.00" r="1"/><circle cx="9.00" cy="6.80" r="1"/></g></svg>';
// Ближайшие n событий календаря с сегодняшнего дня: [{day, label}].
function ccDcUpcoming(n, keep){
  const out=[], today=careerToday();
  let days=[]; try{ days=[...careerEvents().entries()].filter(([d])=>d>=today).sort((a,b)=>a[0]<b[0] ? -1 : 1); }catch(e){}
  for(const [d, list] of days){ for(const e of list){ if(out.length>=n) return out; if(keep && !keep(e)) continue; out.push({day:d, kind:e.kind||'', label:e.label||e.title||''}); } }
  return out;
}
// Имя турнира из журнала текстом (ccLogName отдаёт HTML): подпись календаря, у капа - дивизион сезона, если в строке его нет.
function ccDcEvName(e){
  const x=ccLogName(e.div!=null || (e.kind && e.kind!=='cup') ? e : Object.assign({}, e, {div:CAREER.career.division}));
  const t=document.createElement('textarea'); t.innerHTML=String(x).replace(/<[^>]+>/g, ''); return t.value;
}
// Последний сыгранный турнир за 10 дней, или null.
function ccDcLastResult(){
  const cr=CAREER.career, from=ccAddDays(careerToday(), -10);
  const e=(cr.log||[]).filter(x=>x && x.place && x.day && x.day>=from && x.day<=careerToday()).slice(-1)[0];
  return e || null;
}
function ccDcClubHTML(chan, msg){
  const T=L(), org=CAREER.org, club=org.name, me=CAREER.player.nick;
  // Мобильная серия - личная, у команды её в планах нет.
  const up=ccDcUpcoming(3, e=>!/mob/i.test(e.kind||'') && !/mobile/i.test(e.label||'')), last=ccDcLastResult();
  let ann=up.length ? up.map(x=>msg(club, true, '<p>'+esc(T.clNext(x.label, ccDayLabel(x.day)))+'</p>')).join('') : msg(club, true, '<p>'+esc(T.fnNone)+'</p>');
  if(last){ const ev=ccDcEvName(last), pl=last.place;
    ann=msg(club, true, '<p>'+esc(pl===1 ? T.clGGWin(ev) : pl<=3 ? T.clGGPod(ev, pl) : pl<=Math.max(10, Math.round((last.of||100)*0.25)) ? T.clGGOk(ev, pl) : T.clGGBad(ev, pl))+'</p>')+ann; }
  const mates=(typeof careerMates==='function' ? careerMates() : []).filter(Boolean);
  const coach=ccCoach();
  const rnd=careerRng(ccHashStr('club|'+careerToday()+'|'+club));
  let team='';
  if(coach){ const k=ccWeakestAttr(), K=k.charAt(0).toUpperCase()+k.slice(1);
    team+=msg(coach.name, false, '<p>'+esc(T.clCoach(T['attr'+K+'Full'] || T['attr'+K] || k))+'</p>', coach.photo ? ccDcImg(PHOTO_DIR+coach.photo, ccDcInitials(coach.name)) : esc(ccDcInitials(coach.name))); }
  mates.forEach(m=>{ const face=(()=>{ try{ return photoURL(m)||''; }catch(e){ return ''; } })();
    team+=msg(ccHandle(m.handle), false, '<p>'+esc(T['clMate'+(1+Math.floor(rnd()*4))])+'</p>', face ? ccDcImg(face, String(m.handle).slice(0, 2).toUpperCase()) : null); });
  const row=(name, role, av)=>'<div class="cr-mem st-on"><span class="dc-av">'+av+'<i class="cr-dot" aria-hidden="true"></i></span><div class="cr-who"><b>'+esc(name)+'</b><span>'+esc(role)+'</span></div></div>';
  let mem=row(me, T.clRoleYou, ccDcFace() ? ccDcImg(ccDcFace(), String(me).slice(0, 2).toUpperCase()) : esc(String(me).slice(0, 2).toUpperCase()));
  mates.forEach(m=>{ let f=''; try{ f=photoURL(m)||''; }catch(e){} mem+=row(ccHandle(m.handle), T.clRoleMate, f ? ccDcImg(f, String(m.handle).slice(0, 2).toUpperCase()) : esc(String(m.handle).slice(0, 2).toUpperCase())); });
  if(coach) mem+=row(coach.name, T.clRoleCoach, coach.photo ? ccDcImg(PHOTO_DIR+coach.photo, ccDcInitials(coach.name)) : esc(ccDcInitials(coach.name)));
  if(CAREER.agent && CAREER.agent.name) mem+=row(CAREER.agent.name, T.clRoleMgr, esc(ccDcInitials(CAREER.agent.name)));
  return chan(T.dcAnnounce, ann)+(team ? chan('team-chat', team) : '')+chan(T.crMembers, '<div class="cr-mems">'+mem+'</div>', 'members');
}
function ccDcFnHTML(chan, msg){
  const T=L(), bot='Fortnite Competitive', up=ccDcUpcoming(5);
  const ann=up.length ? up.map(x=>msg(bot, true, '<p>'+esc(T.fnUp(x.label, ccDayLabel(x.day)))+'</p>')).join('') : msg(bot, true, '<p>'+esc(T.fnNone)+'</p>');
  const from=ccAddDays(careerToday(), -21);
  const res=(CAREER.career.log||[]).filter(x=>x && x.place && x.day && x.day>=from && x.day<=careerToday()).slice(-4).reverse()
    .map(e=>msg(bot, true, '<p>'+esc(T.fnRes(ccDcEvName(e), e.place, e.of||'?'))+'</p>')).join('');
  return chan(T.dcAnnounce, ann)+(res ? chan('results', res) : '');
}
function ccDcServer(id){ CH_DC=id; CH_DCV='list'; careerRenderHub('discord'); }
/* Аватарки Discord (его «добавь дискордам аватарки», 21.11): у игрока - фото его карточки, как в шапке хаба; у бота -
   значок его сервера; у серверов - корона Noble (EU), инициалы сервера практики региона, телефон у мобильного,
   своё фото у своего сервера. Без фото - буквы, как было. */
const CC_DC_PHONE_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg>';
function ccDcFace(){ try{ const c=careerCard(); return c ? (photoURL(c)||'') : ''; }catch(e){ return ''; } }
function ccDcInitials(name){
  const w=String(name||'').split(/[^A-Za-z0-9]+/).filter(Boolean);
  return ((w[0]||'?').charAt(0)+(w[1]||'').charAt(0)).toUpperCase();
}
// Картинка аватарки; не загрузилась - вместо неё буквы.
function ccDcImg(src, fb){ return '<img src="'+esc(src)+'" alt="" loading="lazy" data-fb="'+esc(fb)+'" onerror="this.replaceWith(this.dataset.fb)">'; }
function ccDcSrvIcon(id){
  // Тусовка региона: у EU - флаг Евросоюза, у остальных - код региона. Fortnite Competitive - плитка FNCS 2026 из файлов Epic (герб в центре).
  if(id==='crew'){ const r=ccCareerRegion(); return r==='EU' ? CC_DC_EU_SVG : '<b class="dc-reg">'+esc(r)+'</b>'; }
  if(id==='fn') return ccDcImg(CC_DC_FN_IMG, 'FN').replace('<img ', '<img class="dc-fn-av" ');
  if(id==='club') return (CAREER.org && typeof careerCrestImg==='function') ? careerCrestImg(CAREER.org.name, 30) : esc(ccDcInitials(CAREER.org && CAREER.org.name));
  if(id==='pc') return ccCareerRegion()==='EU' ? ccDcImg('items/creative/noble-crown.png', 'NP') : esc(ccDcInitials(ccPracSrv()));
  if(id==='mob') return CC_DC_PHONE_SVG;
  if(ccFans()) return ccFanIcon();   // своя аватарка сервера из настроек
  const f=ccDcFace(); return f ? ccDcImg(f, '★') : '★';
}
function ccDiscordHTML(){
  // Ушёл из клуба, а открыт был его сервер - показываем сервер практики.
  const T=L(), cr=CAREER.career, srv=(CH_DC==='club' && !CAREER.org) ? 'pc' : (CH_DC||'pc');
  // Первым - тусовка региона (ccCrewHTML): про и стримеры, с которыми ты пересекался.
  const servers=[['crew', ccDcSrvIcon('crew'), T.dcSrvCrew(ccCareerRegion())]].concat(CAREER.org ? [['club', ccDcSrvIcon('club'), CAREER.org.name]] : [],
    [['fn', ccDcSrvIcon('fn'), 'Fortnite Competitive'], ['pc', ccDcSrvIcon('pc'), ccPracSrv()], ['mob', ccDcSrvIcon('mob'), T.dcSrvMob], ['own', ccDcSrvIcon('own'), (CAREER.career.fans && CAREER.career.fans.name) || T.dcSrvOwn]]);
  const last=cr.dcLast && cr.dcLast.day===careerToday() ? cr.dcLast : null;
  const btn=(kind, label)=>{ const why=ccDcWhy(kind);
    return '<div class="dc-act"><button class="dc-btn"'+(why ? ' disabled' : '')+' onclick="ccDcGo(\''+kind+'\')">'+esc(label)+
      ' <em>'+CC_DC_ENERGY+T.ccEnergyMark+'</em></button>'+(why ? '<span class="dc-why">'+esc(why)+'</span>' : '')+'</div>'; };
  const res=kinds=>(last && kinds.indexOf(last.kind)>=0)
    ? '<div class="dc-res">'+esc(T.dcResult(last.wins, ccNum(last.cash)))+(last.grow ? ' · '+esc(T.ccMobTitle)+' +'+last.grow.toFixed(2) : '')+'</div>' : '';
  // Аватарка автора: бот - значок сервера, игрок - фото своей карточки, остальные - буквы.
  const avOf=(author, bot)=>{
    const fb=String(author).slice(0, 2).toUpperCase();
    if(bot) return srv==='own' ? esc(fb) : ccDcSrvIcon(srv);
    const f=author===CAREER.player.nick ? ccDcFace() : '';
    return f ? ccDcImg(f, fb) : esc(fb);
  };
  const msg=(author, bot, body, av)=>'<div class="dc-msg"><span class="dc-av'+(bot ? ' bot' : '')+'">'+(av!=null ? av : avOf(author, bot))+'</span>'+
    '<div class="dc-msg-in"><b>'+esc(author)+(bot ? '<i class="dc-bot">BOT</i>' : '')+'</b>'+body+'</div></div>';
  // kind: 'voice' / 'members' - вид канала для раскладки как в Discord (ccDcLayout), без него текстовый.
  const chan=(name, body, kind)=>'<div class="dc-chan"'+(kind ? ' data-kind="'+kind+'"' : '')+'><div class="dc-chan-h"># '+esc(name)+'</div>'+body+'</div>';
  let body='';
  if(srv==='crew'){
    body=ccCrewHTML(chan, msg);
  } else if(srv==='club' && CAREER.org){
    body=ccDcClubHTML(chan, msg);
  } else if(srv==='fn'){
    body=ccDcFnHTML(chan, msg);
  } else if(srv==='pc'){
    // Кастомки ПК — сессии сервера практики региона (занятие noble: одна игра на сотню, таблица недели, форма от места).
    const sv=ccNobleServer(), tier=ccNobleTier();
    const ladder=ccCareerRegion()==='EU' ? chan(T.dcLadder, '<div class="dc-ladder">'+CC_NOBLE_LADDER.map((t,i)=>
        '<span class="dc-tier'+(i===tier ? ' on' : i<tier ? ' lock' : '')+'">'+(i<tier ? '🔒 ' : i===tier ? '✓ ' : '')+esc(t.name)+(i===tier ? ' · '+esc(T.dcYouHere) : '')+'</span>').join('')+'</div>') : '';
    body=chan(T.dcSession, msg(ccPracSrv(), true, '<p>'+esc(T.dcSessionTxt(sv.name))+'</p>'))+ccDcSessHTML('pc')+ladder+
         ccDcScrHTML('pc', chan, msg);
  } else if(srv==='mob'){
    // Анонсы и итоги мобильных турниров (его «пусть результаты будут в мобил дискорде, турниров, новости»): ближайшие
    // этапы Mobile Series из календаря и твои места на мобильных турнирах за три недели.
    const isMob=(k, lbl)=>/mob/i.test(k||'') || /mobile/i.test(lbl||'');
    const mUp=ccDcUpcoming(4, e=>isMob(e.kind, e.label||e.title));
    const mFrom=ccAddDays(careerToday(), -21);
    const mRes=(cr.log||[]).filter(e=>e && e.place && e.day>=mFrom && e.day<=careerToday() && isMob(e.kind, ccDcEvName(e))).slice(-4).reverse();
    body=chan(T.dcAnnounce, msg(T.dcSrvMob, true, '<p>'+esc(T.dcLobbyMob(CC_DC_MOB_RATE, CC_DC_MOB_PER_WIN))+'</p>'+
           '<p class="dc-sub">'+esc(T.ccMobTitle+' '+ccMobileOvr().toFixed(1))+'</p>')+
           mUp.map(x=>msg(T.dcSrvMob, true, '<p>'+esc(T.fnUp(x.label, ccDayLabel(x.day)))+'</p>')).join(''))+
         (mRes.length || (last && last.kind==='mobJoin') ? chan('results', mRes.map(e=>msg(T.dcSrvMob, true, '<p>'+esc(T.fnRes(ccDcEvName(e), e.place, e.of||'?'))+'</p>')).join('')+res(['mobJoin'])) : '')+
         ccDcSessHTML('mob')+
         ccDcScrHTML('mob', chan, msg);
  } else {
    // Фан-сервер (ccFanHTML) - над кастомками: создать, потом фанаты после турниров, вопросы, покупки по коду.
    body=ccFanHTML(chan, msg)+chan(T.dcHostChan, msg(CAREER.player.nick, false, '<p>'+esc(T.dcHostPc(ccNum(ccHostPerWin())))+'</p>'+btn('pcHost', T.dcHostBtn))+
           msg(CAREER.player.nick, false, '<p>'+esc(T.dcHostMob(ccNum(ccMobHostPer())))+'</p>'+btn('mobHost', T.dcHostBtn))+
           res(['pcHost','mobHost'])+(last && last.who && last.who.length && /Host/.test(last.kind) ? '<div class="dc-res">'+esc(T.dcWinners(last.who.map(h=>'@'+ccHandle(h)).join(', ')))+'</div>' : ''));
  }
  return '<div class="ch-tile dc-wrap"><div class="dc-srvs">'+servers.map(([id, ic, name])=>
      '<button class="dc-srv'+(srv===id ? ' on' : '')+'" title="'+esc(name)+'" aria-label="'+esc(name)+'" onclick="ccDcServer(\''+id+'\')">'+ic+'</button>').join('')+'</div>'+
    '<div class="dc-body"><h4 class="dc-name">'+esc((servers.find(s=>s[0]===srv)||servers[0])[2])+
      (srv==='own' && cr.fans ? '<small>'+esc(T.fnMembers(ccNum(ccFanMembers()+ccFanGuests().length)))+'</small>' : '')+'</h4>'+body+'</div></div>';
}
/* Бросок дня. Один на день, кидается когда день впервые спросили, и сразу
   в сейв: перезагрузка страницы читает уже брошенное, а не кидает заново —
   релоадом лучший день не выторговать. Прошлые дни никто не спрашивает
   (careerDayClosed и панель смотрят только на сегодня), поэтому хранится
   ровно один день, и сейв не растёт. */
function ccDayRoll(iso){
  const cr=CAREER && CAREER.career;
  if(!cr) return null;
  if(!cr.luck || cr.luck.day!==iso){
    cr.luck={day:iso,
      woe: Math.random()<CC_MISFORTUNE_CHANCE
             ? (Math.random()<0.7 ? 'power' : 'sick') : null,
      ev:  Math.random()<CC_DAY_EVENT_CHANCE
             // Жребий — среди того, что сегодня возможно: развилка с условием
             // (when) не занимает место в броске, пока условия нет, иначе
             // доля дней с событием проседала бы вдвое. Принудительные не в жребии.
             ? (function(){ const pool=CC_DAY_EVENTS.filter(e=>!e.forced && (typeof e.when!=='function' || e.when()));
                            return pool.length ? pool[Math.floor(Math.random()*pool.length)].id : null; })() : null};
    careerSave();
  }
  return cr.luck;
}
function ccDayEventOn(iso){
  const cr=CAREER && CAREER.career;
  if(!cr) return null;
  if((careerYearDays().get(iso)||[]).length) return null;
  if((cr.did||{})[iso]) return null;
  // Школа и уход клуба приходят по делу, раньше жребия. См. careerForcedEvent.
  const forced=careerForcedEvent(iso);
  if(forced) return forced;
  const luck=ccDayRoll(iso);
  const ev=luck && luck.ev && CC_DAY_EVENTS.find(e=>e.id===luck.ev);
  if(!ev) return null;
  if(typeof ev.when==='function' && !ev.when()) return null;
  // A stand-in offer needs somebody to stand in beside, and a sponsor cannot
  // ask for a video when there is no sponsor.
  if(ev.id==='scrimup' && !careerMateRec()) return null;
  if(ev.id==='promo' && !ccSponsor()) return null;
  // На кастомку зовут по числу, а не по знакомству: не дорос PR — приглашения
  // нет вовсе, и день проходит как обычный. См. CC_CUSTOM_PR.
  if(ev.id==='custom' && !ccCustomInvited()) return null;
  return ev;
}
function careerDayEvent(id, take){
  const ev=CC_DAY_EVENTS.find(e=>e.id===id); if(!ev) return false;
  if(careerDayDone()) return false;
  // Развилка: take — это id ответа; у старых событий — да/нет.
  let eff, optId=null;
  if(ev.opts){
    const o=ev.opts.find(x=>x.id===take) || ev.opts[0];
    eff=o.eff||{}; optId=o.id;
  } else eff=take ? ev.take : ev.pass;
  const cr=CAREER.career;
  if((eff.energy||0)>careerEnergy()) return false;
  if(eff.rep) careerRepAdd(eff.rep);
  if(eff.spotClear) careerSpotClear();
  if(eff.stat) careerStatBump(ccWeakestAttr(), eff.stat);
  if(eff.orgLeave && CAREER.org && !CAREER.org.own){
    const org=CAREER.org;
    careerNews('flat', 'ccNewsLeftOrg', [org.name], {by:ccOrgBy(org.name)});
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null;
  }
  if(eff.orgGone && CAREER.org && !CAREER.org.own){
    // Клуб закрывает состав: месяц зарплаты на прощание, и ты свободен.
    const org=CAREER.org, sev=org.salary||0;
    if(sev){ cr.balance=(cr.balance||0)+sev; cr.wages=(cr.wages||0)+sev; }
    careerNews('bad', 'ccNewsOrgGone', [org.name, ccMoney(sev)], {by:ccOrgBy(org.name)});
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null; CAREER.offers=null; cr.orgQuit=null;
  }
  if(eff.lft){ careerNews('flat', 'ccPostLft', []); careerReachAdd(2*CC_REACH_DIV(cr.division)); }
  if(eff.energy) careerSpend(eff.energy);
  if(eff.restore) careerRestore(eff.restore);
  if(eff.form) cr.form=clamp((cr.form||0)+eff.form, -CC_FORM_MAX, CC_FORM_MAX);
  if(eff.cash){ cr.balance=(cr.balance||0)+eff.cash; cr.side=(cr.side||0)+eff.cash; }
  if(eff.reach) careerReachAdd(eff.reach*CC_REACH_DIV(cr.division));
  // Every seat feels the week, not only the first one.
  if(eff.morale) careerMateRecords().forEach(pr=>{
    pr.patience=clamp((pr.patience||0)+eff.morale, 0, 100); });
  cr.did=cr.did||{};
  cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat('ev:'+id);
  /* У кастомки выплата не в таблице событий, а в самом вечере: сыграл — и
     столько, сколько выиграл. Отказ пишется общей строкой, как у всех. */
  if(id==='custom' && take){
    const r=ccCustomPlay();
    careerNews(r.wins?'good':'flat', 'ccDayEvcustomTake', [r.wins, ccNum(r.cash)]);
    careerSave();
    careerRenderHub('centre');
    return true;
  }
  if(optId!=null) careerNews(eff.rep<0 || eff.form<0 || eff.orgGone ? 'flat' : 'good', 'ccDayEv'+id+'R'+optId, []);
  else careerNews(take?'good':'flat', 'ccDayEv'+id+(take?'Take':'Pass'), []);
  careerSave();
  careerRenderHub('centre');
  return true;
}

/* Energy, one bar. There used to be energy plus a hidden fatigue that cut a day's value by up to half; now energy
   is a store. Training spends it, a night gives a little back, a rest day a lot. A day is always worth half a point,
   what runs out is the ability to do another one: roughly three work days per day off.
   Nothing is dated, so a save that skips a month comes back rested by the nights slept, not by a reset. */
/* How big the store is. A hundred by default, and the desk can make it bigger:
   the chair and the treadmill are the two things in the shop that buy days
   rather than percentages — every ten points of store is another third of a
   training day a week, which is the one upgrade a player feels in the calendar
   rather than in a number. */
function careerEnergyMax(){
  // Best of each slot, plus everything that stands alone: two chairs are one
  // chair, and the better one is the one you are sitting in.
  const slots={};
  // The rooms you are not working in are part of what a day is worth too.
  let extra=(typeof ccFlatCap==='function') ? ccFlatCap() : 0;
  CC_SHOP.forEach(it=>{
    if(!it.cap || !careerOwns(it.id)) return;
    if(!it.slot){ extra+=it.cap; return; }
    slots[it.slot]=Math.max(slots[it.slot]||0, it.cap);
  });
  Object.keys(slots).forEach(k=>{ extra+=slots[k]; });
  /* Больная неделя (см. ev:sick) режет запас на треть, пока не пройдёт. */
  let cap=CC_ENERGY_DAY+extra;
  const cr=CAREER && CAREER.career;
  if(cr && cr.sickUntil && careerToday()<cr.sickUntil) cap=Math.round(cap*2/3);
  return Math.max(30, cap);
}
function careerEnergy(){
  const cr=CAREER.career;
  return clamp(cr.energy!=null ? cr.energy : careerEnergyMax(), 0, careerEnergyMax());
}
function careerSpend(n){
  const cr=CAREER.career;
  cr.energy=clamp(careerEnergy()-n, 0, careerEnergyMax());
}
function careerRestore(n){
  const cr=CAREER.career;
  cr.energy=clamp(careerEnergy()+n, 0, careerEnergyMax());
}
// One thing a day, whatever it costs: the day is the unit, energy is the week.
function careerDayDone(){
  const cr=CAREER.career;
  return ((cr.did||{})[careerToday()]||[]).length>0;
}
/* Energy is the limit for a day, not the calendar. The six sessions are an hour each and you take as many as
   you can pay for. Career pacing comes from income (12 a night, 45 for a rest day), so it does not change.
   Scrim, stream and rest still take the whole day; rest has to, or resting three times a day would print energy.
   A day that already has something on it is the same. */
/* Стрим и спонсорские вечера больше не съедают день — его пункт 16 со
   страницы «ы», 22 августа: «стримы и спонсор тратят весь день иногда, пусть
   30 энергии тратят». День закрывают отдых и события, которые и есть весь
   вечер (чужой скрим, оффлайн); эфир — это тридцать энергии из магазина дня,
   как любое занятие. */
const CC_DAY_WHOLE={rest:1, host:1};
const CC_DAY_OPEN_EV={'ev:show':1, 'ev:promo':1};
function ccDayShuts(id){
  return CC_DAY_WHOLE[id] ||
         (String(id).indexOf('ev:')===0 && !CC_DAY_OPEN_EV[id]);
}
function careerDayClosed(){
  const list=((CAREER.career.did||{})[careerToday()]||[]);
  // Вечер без света — вечер без кнопок. См. ccMisfortune.
  if(typeof ccMisfortune==='function' && ccMisfortune(careerToday())==='power') return true;
  return list.some(ccDayShuts);
}

/* Doing one.

   The numbers move the player's own six rather than the rating, so where a
   career spent its year shows in the shape of the card and not only in its
   headline. The rating follows from the six through ATTR_W, the way it does for
   every other card on the roster, and it still cannot pass the ceiling the
   career drew.

   A coach and a desk multiply this, and they read as one number from one place
   so a new thing in the shop never has to be wired into seven activities. */
function careerDayGear(){ return 1 + ((CAREER.gear && CAREER.gear.train) || 0) + ccStayTrain(); }
// What the stream rig adds to a night's followers. Nothing owned, nothing added.
function ccGearReach(){ return (CAREER.gear && CAREER.gear.reach) || 0; }
/* Тренировка в день турнира (его выбор 21.11, пункты 1-3 из «как переработать тренировки»).
   1. До вечера день турнира открыт для занятий во вкладке «Тренировка»: только занятия с приростом и разминка, без
      отдыха, скримов и стрима (они закрывают день целиком). Кап дивизиона берёт CC_TOURNEY_ENERGY после сессии, поэтому
      занятие, после которого на кап не останется 35, не нажимается. Онлайн (команда, гонка) не трогаем: там вечер
      идёт локстепом, и лишний шаг дня у одного разведёт сейвы.
   2. Разминка (warm в CC_DAY_ACTS): раз в день турнира, 15 энергии, +CC_WARM_FORM к форме, а форма за ночь тает на
      CC_FORM_DECAY, то есть это прибавка на сегодняшний вечер. Статы не качает. Число - решение, не замер: меньше
      сессии Noble (0.1-0.4 за 40 энергии), потому что без игры против сотни.
   3. Убывающая отдача: n-е занятие одного стата за последние семь дней даёт CC_TRAIN_REPEAT[n] от шага. Энергии в году
      хватает примерно на 145-200 занятий, и без этого её всю можно лить в один стат. Тоже решение, не замер. */
const CC_WARM_FORM=0.3;
const CC_TRAIN_REPEAT=[1, 0.7, 0.5, 0.35];
function ccRepeatCount(k){
  const did=(CAREER && CAREER.career && CAREER.career.did) || {};
  let n=0;
  for(let i=0;i<7;i++){
    (did[ccAddDays(careerToday(), -i)]||[]).forEach(id=>{
      const a=ccActById(id);
      if(a && String(a.id).indexOf('tr')===0 && a.gain && a.gain[k]) n++;
    });
  }
  return n;
}
function ccRepeatMult(k){ return CC_TRAIN_REPEAT[Math.min(ccRepeatCount(k), CC_TRAIN_REPEAT.length-1)]; }
function ccTrainAct(a){ return !!a && String(a.id).indexOf('tr')===0 && Object.keys(a.gain||{}).length>0 && !a.mobile; }
// {next, reserve} в день турнира до вечера, иначе null.
function ccPreEvent(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.seasonOver) return null;
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRaceOn==='function' && ccRaceOn())) return null;
  let next=null;
  try{ next=careerNext(); }catch(e){ return null; }
  if(!next || next.day!==careerToday() || next.type==='free' || next.type==='gala') return null;
  if(typeof ccCentreDayOpen==='function' && ccCentreDayOpen()) return null;
  if(!careerCanPlay(next)) return null;
  return {next:next, reserve: next.type==='cup' ? CC_TOURNEY_ENERGY : 0};
}
function ccWarmDone(){ return (((CAREER.career.did||{})[careerToday()])||[]).indexOf('warm')>=0; }
/* Смотреть про (идея из Notion 20.11: «функцию тренировки, как смотреть за про игроками на ютубе или твиче, тренируясь
   у них»). Сегодня в эфире шесть игроков сильнее тебя из твоего региона; выбираешь, кого смотреть. Качается тот стат,
   где разрыв с ним самый большой: половина шага занятия за половину энергии (15), полностью от CC_WATCH_GAP очков
   разрыва, меньше при маленьком, и не выше уровня самого про. Это занятие стата, поэтому убывающая отдача недели
   (CC_TRAIN_REPEAT) общая с обычными. Оценки D…A+ нет: смотришь, а не играешь. Числа - решение, не замер. */
const CC_WATCH_KEYS=['aim', 'sur', 'con', 'clu', 'end'], CC_WATCH_GAP=8, CC_WATCH_N=6;
let CC_WATCH_NOW=null;
function ccWatchPlat(h){ let s=0; String(h).split('').forEach(c=>{ s=(s*31+c.charCodeAt(0))%9973; }); return s%3===0 ? 'youtube' : 'streams'; }
function ccWatchPros(){
  const me=CAREER.player.attrs || ccOwnAttrs(), my=ccFanMyOvr();
  let pool=[]; try{ pool=careerDuoSearchPool(true)||[]; }catch(e){}
  pool=pool.filter(w=>w && w.handle && w.card && Math.round(w.ovr)>my).sort((a, b)=>b.ovr-a.ovr).slice(0, 24);
  // Кто в эфире, решает день: список меняется каждый день, но не от перерисовки.
  const rng=ccLifeRng('watch');
  pool=pool.map(w=>({w, r:rng()})).sort((a, b)=>a.r-b.r).map(x=>x.w).slice(0, CC_WATCH_N);
  return pool.map(w=>{
    let at=null; try{ at=attrsFor(w.card); }catch(e){}
    if(!at) return null;
    let k=null, gap=0;
    CC_WATCH_KEYS.forEach(x=>{ const d=(at[x]||0)-(me[x]!=null ? me[x] : 50); if(d>gap){ gap=d; k=x; } });
    return {handle:w.handle, ovr:w.ovr, card:w.card, k, gap, cap:k ? at[k] : 0, mult:clamp(gap/CC_WATCH_GAP, 0.25, 1), plat:ccWatchPlat(w.handle)};
  }).filter(Boolean).sort((a, b)=>b.ovr-a.ovr);
}
// Сколько даст просмотр сегодня: та же арифметика, что в careerDoAct, без случайной оценки.
function ccWatchBy(p){
  if(!p.k) return 0;
  const pl=CAREER.player, me=pl.attrs || ccOwnAttrs(), a=ccActById('trW'+p.k); if(!a) return 0;
  const now=pl.ovrExact!=null ? pl.ovrExact : pl.ovr, coach=ccCoach();
  const by=a.gain[p.k]*ccTrainDayMult()*clamp((careerTrainCap()-now)/CAREER_TAPER, 0, 1)*(coach && coach.keys.indexOf(p.k)>=0 ? 1+coach.train : 1)
    *ccRepeatMult(p.k)*careerDiff().age*ccFocusMult(p.k)*p.mult;
  return Math.max(0, Math.min(by, p.cap-(me[p.k]!=null ? me[p.k] : 50)));
}
// Почему сейчас смотреть нельзя (пустая строка - можно).
function ccWatchWhy(){
  const T=L(), pre=ccPreEvent();
  if(!(ccCentreDayOpen() || pre) || careerDayClosed()) return T.wpDayShut;
  if(typeof ccLifeHurt==='function' && ccLifeHurt()) return T.wpHurt;
  if(careerEnergy()<15) return T.ccNeedEnergy(15-careerEnergy());
  if(pre && careerEnergy()-15<pre.reserve) return T.ccKeepEnergy(pre.reserve);
  return '';
}
function ccWatchPro(handle){
  if(ccWatchWhy()) return;
  const p=ccWatchPros().find(x=>hKey(x.handle)===hKey(handle));
  if(!p || !p.k || ccWatchBy(p)<0.05) return;
  CC_WATCH_NOW={mult:p.mult, cap:p.cap};
  let r=null;
  try{ r=careerDoAct('trW'+p.k); } finally{ CC_WATCH_NOW=null; }
  if(!r) return;
  CAREER.career.watchLast={day:careerToday(), h:p.handle, k:p.k, by:(r.moved||{})[p.k]||0, plat:p.plat};
  careerSave();
  careerRenderHub('train');
}
function ccWatchTileHTML(){
  if(!CAREER || !CAREER.career || CAREER.career.seasonOver) return '';
  const T=L(), why=ccWatchWhy(), me=CAREER.player.attrs || ccOwnAttrs(), mark=T.ccEnergyMark, lst=CAREER.career.watchLast;
  const pros=ccWatchPros();
  const name=k=>T['ccAttr'+k.toUpperCase()]||k.toUpperCase();
  const rows=pros.map(p=>{
    let f=''; try{ f=photoURL(p.card)||''; }catch(e){}
    const fb=String(p.handle).slice(0, 2).toUpperCase(), by=ccWatchBy(p), can=!why && by>=0.05;
    const plat=p.plat==='youtube' ? 'YouTube' : 'Twitch';
    const what=!p.k ? T.wpNothing : by<0.05 ? T.ccNoGain : '+'+(Math.round(by*10)/10).toFixed(1)+' '+name(p.k);
    return '<div class="wp-row"><span class="dc-av">'+(f ? ccDcImg(f, fb) : esc(fb))+'</span>'+
      '<div class="wp-who"><b>'+esc(ccHandle(p.handle))+' <em>'+Math.round(p.ovr)+'</em></b>'+
        '<span><i class="wp-pl wp-'+p.plat+'">'+CC_MQ_ICONS[p.plat]+esc(plat)+'</i>'+(p.k ? esc(T.wpBest(name(p.k), Math.round(p.cap), Math.round(me[p.k]!=null ? me[p.k] : 50))) : '')+'</span></div>'+
      '<button class="wp-go"'+(can ? ' onclick="ccWatchPro(\''+jsq(p.handle)+'\')"' : ' disabled')+' title="'+esc(why || T.wpBtnTip)+'">'+
        '<b>'+esc(T.wpBtn)+'</b><em>'+esc(what)+' · 15'+mark+'</em></button></div>';
  }).join('');
  const last=(lst && lst.day===careerToday()) ? '<p class="wp-last">'+esc(T.wpDid(ccHandle(lst.h), lst.plat==='youtube' ? 'YouTube' : 'Twitch', name(lst.k), (Math.round(lst.by*10)/10).toFixed(1)))+'</p>' : '';
  return '<div class="ch-tile tw-tile wp-tile"><h4><span class="wp-ics">'+CC_MQ_ICONS.streams+CC_MQ_ICONS.youtube+'</span>'+esc(T.wpTitle)+'</h4>'+
    '<p class="wp-sub">'+esc(T.wpSub)+'</p>'+last+(why ? '<p class="wp-why">'+esc(why)+'</p>' : '')+
    (rows ? '<div class="wp-list">'+rows+'</div>' : '<p class="wp-sub">'+esc(T.wpNone)+'</p>')+'</div>';
}
function careerDoAct(id){
  const act=ccActById(id); if(!act) return null;
  const cr=CAREER.career, pl=CAREER.player;
  // День турнира: только занятия и разминка, и энергия на кап остаётся (см. ccPreEvent).
  const pre=ccPreEvent();
  // Эфир с турнира (careerPlayLive) - это сам вечер, а не занятие до него: пропускается и без резерва.
  const cupAir=act.id==='stream' && typeof CC_STREAM_CUP!=='undefined' && CC_STREAM_KIND===CC_STREAM_CUP.id;
  if(pre && !cupAir && !(ccTrainAct(act) || act.warm || act.voice)) return null;
  if(act.warm && (!pre || ccWarmDone())) return null;
  if(pre && !cupAir && careerEnergy()-act.energy<pre.reserve) return null;
  // The store is what says how much of a day there is, and the three things
  // that take all of it say when there is none left. See careerDayClosed.
  if(careerDayClosed()) return null;
  // С травмой — только отдых, разговор и эфир.
  if(typeof ccLifeHurt==='function' && ccLifeHurt() && !(act.rest || act.id==='talk' || act.id==='stream')) return null;
  /* Цена вечера — у ВИДА эфира, а не у кнопки дня. Виды стоят по-разному
     (марафон 55, эфир с турнира 20), и раньше careerDoAct брал плоские
     тридцать, а разницу доплачивал вызывающий. Пока виды были только дороже,
     это работало; турнирный эфир дешевле — и порог «хватит ли энергии» стоял
     на тридцати, то есть с двадцатью пятью кнопка молча ничего не делала.
     Считает цену тот, кто её списывает. См. CC_STREAM_KINDS. */
  const cost = (act.id==='stream' && typeof ccStreamKind==='function')
    ? (ccStreamKind(CC_STREAM_KIND).energy || act.energy) : act.energy;
  if(careerEnergy()<cost) return null;
  // A rest on a full store restores nothing and takes the whole day with it.
  // The button already says so; this is the same rule where the day is spent,
  // so no other caller can hand a player an evening for nothing.
  if(act.rest && careerEnergy()>=careerEnergyMax()) return null;
  // Своя кастомка без аудитории или без фонда не проводится — и день не тратит.
  if(act.host && ccHostWhy()) return null;
  if(act.mobile && !ccMobileOwn()) return null;   // без телефона или планшета не тренируется
  careerSpend(cost);
  if(act.warm){
    cr.form=clamp((cr.form||0)+CC_WARM_FORM, -CC_FORM_MAX, CC_FORM_MAX);
    cr.did=cr.did||{}; cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat(id);
    careerSave();
    return {id, moved:{}, energy:careerEnergy(), warm:CC_WARM_FORM};
  }
  if(act.mobile){
    const g=ccMobileTrain(!!act.mobScrim);
    cr.did=cr.did||{}; cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat(id);
    careerSave();
    return {id, moved:{}, energy:careerEnergy(), mobile:g};
  }
  if(act.host) ccHostRun();
  if(act.rest) careerRestore(act.rest);
  // Тильт снимают отдых, разговор, войс и игра с друзьями (ccTiltAfterNight).
  if(act.rest || act.talk || act.voice || act.crew) ccTiltClear();
  if(act.lesson) ccLessonRun();
  if(act.mentor) ccMentorRun();
  // The same taper the cup's own growth uses. Without it training ran at full
  // speed right up to the ceiling and every career hit its own in the first
  // season, then stood still for seven more — a mode that is over after a year.
  // The last ten points before the ceiling are where a career slows down, and
  // that has to be true whether the points come from a tournament or a day at
  // the aim trainer.
  const now = pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  // Training lifts you to the level of the room you are in, and no further:
  // past your division's own band you are no longer learning from the people
  // around you, and the only thing left that makes you better is beating them.
  // Everything above the cap comes from results — careerApplyGrowth, which
  // still reads the top of the scale.
  const taper = clamp((careerTrainCap()-now)/CAREER_TAPER, 0, 1);
  // What a day is worth never changes: the store is what runs out, not the
  // value of the work. That is the whole point of folding fatigue into it.
  // Тильт режет занятие (ccTiltMult); магазин показывает только снаряжение, поэтому не в careerDayGear.
  const mult=ccTrainDayMult()*taper;
  // Who a scrim is against and how the set went, both decided before the day is
  // spent — see ccScrimFoe and ccScrimSet. A day that is not a scrim gets null
  // for both and reads exactly as it did.
  /* Who a scrim is against, decided before the day is worth anything, because
     who it is against is most of what it is worth.

     The strongest person in this week's own inbox list - that is who you could
     actually get hold of, and the list is already the week's rather than a new
     draw. Playing somebody better teaches more: half again against somebody five
     points over you, two thirds against somebody five under. */
  // «Поиграть вместе» из Discord-тусовки - против того, кого позвал (CC_CREW_WITH), а не против сильнейшего из лички.
  const foe=act.crew ? CC_CREW_WITH : act.versus ? ccScrimFoe() : null;
  const scrim=foe ? ccScrimSet(foe, now) : null;
  // The coach pays into his own half of the game, so which one is hired shows
  // in the shape of the card and not only in how fast it grows.
  const coach=ccCoach();
  const moved={};
  // A career with no six numbers of its own spent every training day on nothing:
  // the block below was skipped, the energy was gone and neither an attribute nor
  // the rating moved, silently, for as long as the save lasted. That is an old
  // save, and it is every career played as a real card — their shape lives on the
  // roster. Both get their own copy the first time they train, taken from the
  // card they are actually playing, so the day is always worth something.
  if(!pl.attrs) pl.attrs=ccOwnAttrs();
  {
    /* And the difficulty sits on the training too.

       It sat only on careerDevelopNow — the age curve — which the composition
       measurement of 19 August showed is a sliver of actual growth: a career is
       built in the training room, so a Legend career was 7% longer, not five
       times. A player then finished the whole game in three or four hours and
       said the improving is too fast; his answer was to make the harder modes
       cut what a session pays. Same factor the develop term already uses, so
       one setting means one thing everywhere: Easy 1.00, Pro 0.50, Elite 0.25,
       Legend 0.10. Easy is untouched. */
    // Оценка занятия D…A+ (ccDrillGrade) — только у тренировок с приростом.
    const grade=(String(act.id).indexOf('tr')===0 && !act.watch && Object.keys(act.gain||{}).length) ? ccDrillGrade(act.id) : null;
    const watch=act.watch ? CC_WATCH_NOW : null;
    // Эфир с тренировкой берёт прирост тренировки trPit в доле вида (CC_STREAM_KINDS train).
    const sk=(act.id==='stream' && typeof ccStreamKind==='function') ? ccStreamKind(CC_STREAM_KIND) : null;
    const gain=(sk && sk.train) ? (g=>{ const o={}; Object.keys(g).forEach(k=>{ o[k]=g[k]*sk.train; }); return o; })((ccActById('trPit')||{}).gain||{}) : (act.gain||{});
    Object.keys(gain).forEach(k=>{
      let by=gain[k]*mult*(coach && coach.keys.indexOf(k)>=0 ? 1+coach.train : 1)*(ccTrainAct(act) ? ccRepeatMult(k) : 1)
               *careerDiff().age*(scrim ? scrim.mult : 1)*ccFocusMult(k)*(grade ? grade.mult : 1)
               *(watch ? watch.mult : 1);
      // Смотря про, выше его самого не поднимешься.
      if(watch) by=Math.min(by, Math.max(0, watch.cap-(pl.attrs[k]||50)));
      pl.attrs[k]=clamp((pl.attrs[k]||50)+by, ccAttrFloor(k), 99);
      moved[k]=by;
    });
    if(Object.keys(moved).length){
      const raw=ATTR_KEYS.reduce((sum,k)=>sum+(pl.attrs[k]||50)*ATTR_W[k],0);
      // Never past the cap by training, and never downwards: a career already
      // above its room's band keeps what it won, it just stops learning there.
      pl.ovrExact=clamp(Math.max(now, Math.min(raw, careerTrainCap())), 40, 99);
      pl.ovr=Math.round(pl.ovrExact);
      // And the six carry their own rating, because the card reads it: attrsFor
      // lifts a card onto _targetOvr starting from the ovr stored beside the
      // attributes, and a stale one there is a first shift of thirty points that
      // clamps every high attribute at 99 and flattens the shape for good.
      pl.attrs.ovr=Math.round(raw);
      ccGoalCheck();
    }
  }
  // Everything tires except the thing that is for not tiring.
  // Reach grows faster the higher you are: the same stream in Division 1 is seen
  // by more people than in Division 5, which is what a division is from outside.
  // A stream that nobody is told about is not a stream. The day both grows the
  // audience and posts, which is the only reason the growth is visible at all.
  // Разбор меты: день в новом сезоне, который снимает штраф. См. careerMetaDay.
  if(act.meta) careerMetaDay();
  if(act.noble) ccNobleRun();
  if(act.id==='trSur') ccRkSession();
  if(act.versus) ccChemBump(2);   // скрим вместе — сыгранность
  // Прирост недели — для панели Тренировочного центра (ccTrainPanelHTML).
  try{ const lf=ccLife(), wk=ccWeekTag(); if(!lf.tw || lf.tw.wk!==wk) lf.tw={wk, g:{}};
       Object.keys(moved).forEach(k=>{ lf.tw.g[k]=(lf.tw.g[k]||0)+moved[k]; }); }catch(e){}
  if(act.map) ccMapWork();
  if(act.reach){
    // A night on stream, priced per rung. See CC_STREAM_REACH.
    /* Вид эфира. Кнопка дня — это 'grind' с множителями в единицу, поэтому
       день, нажатый как раньше, и считается как раньше; остальные виды
       приходят из вкладки стримов (careerStreamGo). Коллаб добавляет часть
       аудитории напарника — та же арифметика, что у Про-Ама. */
    const sk = act.id==='stream' ? ccStreamKind(CC_STREAM_KIND) : {reach:1, cash:1, subs:1};
    const per = act.id==='stream'
      ? CC_STREAM_REACH(cr.division) * (1 + ccGearReach())
      : CC_REACH_DIV(cr.division);
    careerReachAdd(act.reach*per*(sk.reach||1));
    if(sk.mate){
      const cm=ccStreamMate();
      // Повторы с тем же креатором дают меньше; ему уходит своя доля (см. CC_COLAB_*).
      const from=(cm && typeof ccColabFrom==='function') ? ccColabFrom(cm.name) : 0;
      if(from){
        const give=ccColabGive();
        careerReachAdd(from, true);
        cr.colabN=cr.colabN||{}; cr.colabN[hKey(cm.name)]=(cr.colabN[hKey(cm.name)]||0)+1;
        cr.colabGave=cr.colabGave||{}; cr.colabGave[hKey(cm.name)]=(cr.colabGave[hKey(cm.name)]||0)+give;
        if(cm.deal) cr.colabWith=null;   // договор — на один эфир
        careerNews('good', 'ccNewsStreamColab',
                   [ccHandle(cm.name), ccNum((cm.tw && cm.tw[1])||0), ccNum(from), give ? ccNum(give) : '']);
      }
    }
    /* And a stream pays, which is the other half of what an audience is for.

       Followers already priced a sponsor and a club offer, so the number was
       worth something twice over and never in the player's hand. A stream day
       is somebody sitting there for an evening being watched, and that is paid
       work in this scene - subs, bits, ads - so the day that grows the audience
       also earns off the one already there.

       Deliberately small against a Weekly Final: at fifty thousand readers it is
       twenty-five dollars, and a month of streaming every day is under a
       thousand. It is not a career, it is what makes the desk reachable in
       Division 4 where the ladder pays nothing at all. Read off the audience
       standing before the stream, so the first payday is not the same day the
       first follower arrives. */
    // Деньги эфира — с множителем вида: общение платит лучше, марафон длиннее.
    const own=Math.round(careerReach()/CC_STREAM_PER*(sk.cash||1));
    // And the brand's slot, on the nights there is a stream to put it in.
    const sps=ccSponsorsAll();
    const ad=sps.reduce((sum,x)=>sum+(x.pay||0), 0);
    const paid=own+ad;
    if(ad){
      sps.forEach(x=>{ x.paid=(x.paid||0)+(x.pay||0); });
      cr.sponsored=(cr.sponsored||0)+ad;
    }
    /* Твич — своя аудитория, а не твиттер. Его пункт 8 со страницы «ы»,
       22 августа: подписчики врозь, трансляция максимум два часа, и после неё
       приходит статистика. Зрители читаются с обеих аудиторий, твич растёт от
       самого эфира; пик посеян от даты, чтобы отчёт вечера не менялся от
       перерисовки.

       И пункт 9 там же: без спонсора, но с менеджером, вечер несёт разовый
       рекламный баннер — бренд из своего списка, деньги сразу на баланс. */
    const tw=cr.twitch||0;
    const rndS=careerRng(ccHashStr('stream|'+(cr.season||1)+'|'+careerToday()));
    // Доли с насыщением по размеру канала — см. CC_TW_SAT (его «слишком много стримы онлайн», 13.09).
    const viewers=ccTwViewersOf(tw, careerReach());
    const peak=Math.round(viewers*(1.6+rndS()*0.9));
    const newTw=Math.max(1, Math.round(viewers*0.18*CC_TW_UNIQ*ccTwFolRate(tw)*(0.7+rndS()*0.6)*(sk.subs||1)));
    cr.twitch=tw+newTw;
    // Сабы, биты и донаты за вечер - около $0.1 со зрителя (22.11: зрителей стало в разы меньше, решение, не замер).
    const dono=Math.round(viewers*0.1*(sk.cash||1));
    let banner=0, brand=null;
    if(!sps.length && CAREER.agent){
      brand=CC_STREAM_BRANDS[Math.floor(rndS()*CC_STREAM_BRANDS.length)];
      banner=20+Math.round(viewers*0.1);
    }
    const takeAll=paid+dono+banner;
    if(takeAll>0){
      cr.balance=(cr.balance||0)+dono+banner+(paid>0?paid:0);
      cr.streamed=(cr.streamed||0)+own+dono+banner;
    }
    /* Весь стрим — лично, не в ленту. Первый скриншот, снял
       твит со статистикой; второй («не нужно это в сошиал», лента Sky из трёх
       «Отстримил вечер. $71» подряд) — снял и денежные твиты: ccNewsStreamAd/
       Banner/Paid больше не постятся, ключи живы ради старых сейвов. Деньги
       на балансе, отчёт вечера — строкой в панели дня, теперь с заработком. */
    // Шестым — длина эфира: до партнёрки часы считались, а отчёт всё равно
    // писал «2 ч» текстом. Старые сейвы шестого не имеют, у них и остаётся 2.
    /* m — тот же заработок вечера числом. Строка a[3] уже отформатирована, а
       эфиру с турнира её потом досчитывать (ccStreamCupAfter): разбирать число
       обратно из «1 200» нельзя, поэтому оно едет рядом. */
    cr.streamLast={day:careerToday(), m:dono+banner+(paid>0?paid:0),
                   a:[viewers, peak, newTw,
                   ccNum(dono+banner+(paid>0?paid:0)), ccNum(cr.twitch), sk.hours||4]};
    /* Журнал эфиров за месяц — на нём стоит партнёрская программа (ccTwStatus):
       Twitch считает разные дни, часы и средний онлайн за последние 30 дней,
       поэтому вечер должен оставить после себя день, длину и зрителей. */
    cr.streamLog=(cr.streamLog||[]).concat([{d:careerToday(), v:viewers, h:sk.hours||4}]);
    ccStreamLogTrim(cr);
    careerTwTick();
  }
  /* The week that does not let go.

     Everything in the day loop costs energy and a night gives it back, so a
     career could train three hundred and sixty days a year and the only thing
     that ever said otherwise was the bar. Nobody plays a year like that: the
     scene's own word for what happens is burnout, and it is the reason the
     shop sells a chair, a standing desk and a gym in the first place.

     Counted in days rather than energy, because that is what it is - a run of
     days with no day off in them. Rest is the only thing that clears it, and it
     clears it whole: a day off is a day off. What it costs is form, which is
     the number every result already reads, so a burnt-out career finishes worse
     without anything new having to be invented to punish it. */
  if(act.rest) cr.grind=0;
  else cr.grind=(cr.grind||0)+1;
  /* A scrim is against a named duo and shows the score. Opponent is the strongest
     in this week's inbox list. Gain scales with the gap: up to x1.5 against someone
     5 points above, x2/3 against 5 below. A win gives +0.25 form. The score is twelve
     rounds, each decided by the rating gap the same way a lobby is. */
  /* And the score, which is the part a player can argue with.

     A scrim used to be the most expensive day in the store and the only one with
     no evidence attached: thirty-eight energy, four attributes up a fraction,
     and nothing on the screen afterwards. A scrim in this scene is a set against
     a named duo and everybody remembers the score. Twelve rounds, each decided
     by the gap the same way a lobby is, and taking the set is worth a quarter
     point of form - a result you can point at. */
  if(act.focus) cr.focus=act.focus;
  /* Разговор считается на месте, у каждого свой: настрой у соседей разный, и
     одному вечер нужен, а другому нечего сказать. Скрим по-прежнему плоские
     шесть — он общий на всех и не про слова. */
  if(act.talk){
    const said=[];
    careerMateRecords().forEach((pr,i)=>{
      const was=pr.patience==null?CAREER_PATIENCE_START:pr.patience;
      const move=careerTalkMove(pr);
      pr.patience=clamp(was+move, 0, 100);
      pr.talked=careerToday();
      const card=careerMates()[i];
      if(card) said.push({who:card.handle, was:was, move:move});
    });
    /* И разговор говорит, о чём он был. Строка выбирается по тому же порогу,
       по которому careerMoodKey рисует настрой: с недовольным разбирают, что
       не идёт, с ровным договариваются держать. Без этого «поговорить» была бы
       кнопкой «+3», а он просил диалог. */
    said.forEach(s=>{
      const key = s.move<=0 ? 'ccNewsTalkAgain'
                : s.was<45  ? 'ccNewsTalkFix'
                : s.was<70  ? 'ccNewsTalkKeep'
                :             'ccNewsTalkFine';
      /* «С @X всё и так нормально, просто поболтали» твитом в ленту — шум:
         Скриншот («не нужно это в сошиал»). Разговор, в котором
         ничего не случилось, ленты не заслуживает; остальные три исхода —
         починили, договорились, не вышло — остаются. */
      if(key==='ccNewsTalkFine') return;
      careerNews(s.move>=3 ? 'good' : 'flat', key, [s.who]);
    });
  }else if(act.morale) careerMateRecords().forEach(pr=>{
    pr.patience=clamp((pr.patience==null?CAREER_PATIENCE_START:pr.patience)+act.morale, 0, 100); });
  // And the set, said out loud with the score in it: taking one is a quarter
  // point of form, which is a result a player can point at.
  if(scrim){
    if(scrim.won) cr.form=clamp((cr.form||0)+CC_SCRIM_FORM, -CC_FORM_MAX, CC_FORM_MAX);
    careerNews(scrim.won ? 'good' : 'flat', 'ccNewsScrim',
               [ccHandle(scrim.who), scrim.mine, scrim.theirs]);
  }
  cr.did=cr.did||{};
  cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat(id);
  careerSave();
  return {id, moved, energy:careerEnergy(), scrim:scrim};
}
const CC_PLAYABLE=['cup','victory','eval','reload','final','major','gc','summit','globals','solo','proam','nations'];
// The Major's Play-In and Heats belong to Division 1, but its Last Chance is
// open to all five divisions in Epic's own words, so 'major' cannot be listed
// here wholesale — careerMajorCan decides it stage by stage, and careerEvents
// hides the days that are not this player's.
const CC_D1_ONLY=['final','eval'];
// Where a new career starts: the first week of the measured year holding
// something this player can enter.
//
// Derived rather than written down, because the answer moves. The year opens on
// 1 December and the divisional cups do not start until 2 February, so a career
// pinned to the first of December sits through nine weeks with nothing to press.
// Pinning it to February instead would be wrong the day Reload's Opens become
// enterable — they run on 8 January — so the rule is stated once and the date
// follows from it.
function careerStartDay(){
  const days=careerYearDays();
  /* Карьера, начатая с сезона внутри года (cr.startFrom, экран создания): первый год — с этой даты, не раньше,
     иначе первые дни стояли бы в прошлом сезоне со старыми составами. Следующие годы — с начала. */
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  const at=(cr && cr.startFrom && (cr.season||1)===1) ? cr.startFrom : null;
  for(let w=1; w<=ccYearWeeks(); w++){
    const from=careerWeekStart(w);
    for(let d=0; d<7; d++){
      if(at && ccAddDays(from,d)<at) continue;
      // A Reload day counts only when it is the Opens: everything after them
      // needs a qualification a new career does not have.
      if((days.get(ccAddDays(from,d))||[]).some(e=>
           CC_PLAYABLE.indexOf(e.kind)>=0 && CC_D1_ONLY.indexOf(e.kind)<0 &&
           (e.kind!=='reload' || /Opens$/.test(String(e.id||'')))))
        return (at && from<at) ? at : from;
    }
  }
  return at || ccYearFrom();
}
// Moving the clock. Past the last day of the measured year the career year is
// over — there is no thirty-ninth week to walk into.
/* Where the clock goes after a cup session.
   Below Division 1, Monday and Tuesday are separate sessions (11 games, own table, own token). Promoting on Monday makes Tuesday the next division's session, so you can climb twice a week.
   So the clock goes to the next cup day of the week, else next Monday. Division 1 adds both sessions into one table (careerBanking, cr.d1), but the clock walks the same way. */
/* Which of the week's cup sessions today is.
   Division 1 adds both into one table, below that it's just a label.
   The field is the same both evenings because careerSeed keys on the week, not the day. Exception: Div 2-5 play 13-14 and 18-19 July in one calendar week, split by ccCupWeekSalt.
   Session comes from the cup week, not from counting cup days since Monday, otherwise 18 July would be session three. */
function careerCupSession(){
  const today=careerToday();
  const w=ccCupWeeks().find(r=>r[1]===today || r[2]===today);
  // Неделя из одной сессии (Division 1 Practice, S42): этот вечер и решает —
  // банковать нечего, второго не приедет.
  if(w && !w[2]) return 2;
  return w && w[2]===today ? 2 : 1;
}
// True while Division 1's first evening is being played: the points are banked
// and nothing is settled, because the table this belongs to does not exist yet.
function careerBanking(){
  return CAREER.career.division===1 && careerCupSession()===1;
}
function careerAfterSession(){
  // An evening of eleven games comes out of the same store a training day
  // does, which is what makes a heavy tournament week cost something: play
  // Monday and Tuesday and the days around them are shorter.
  careerSpend(CC_TOURNEY_ENERGY);
  // The next day, like every other move. Tuesday's session arrives because
  // Tuesday arrives, not because the cup hunted for it — and the days between
  // tournaments are days the player still gets to spend.
  return ccAddDays(careerToday(), 1);
}
function careerAdvanceTo(iso){
  /* В командной карьере день двигает close от сервера, а не нажатие.

     Иначе один клиент ушёл бы в завтра, а второй остался бы во вчера — и это
     расхождение уже никакой хеш не поймает, потому что вечера у них будут
     разные. Дверь открывает ccApplyTeamState на время своей работы: день,
     пришедший от сервера, — единственный, который здесь принимается. */
  if(ccMpOn() && !CC_MP_ADVANCE){
    if(!CC_MP_DAY_DUE) return;
    CC_MP_DAY_DUE=false;
  }
  /* А в ГОНКЕ день общий, но карьеры разные: шаг здесь превращается в голос,
     и шагают оба, когда день закрыли оба. Отстающий проходит насквозь — см.
     ccRaceHold. Стоит после командного гейта: одно и то же место, где день
     перестаёт быть личным делом. */
  if(typeof ccRaceHold==='function' && ccRaceHold(iso)){
    ccRaceVote();
    if(typeof careerRenderHub==='function' && document.getElementById('chBody'))
      careerRenderHub('centre');
    return;
  }
  CC_MP_HOLD=true;
  try{ careerAdvanceBody(iso); }
  finally{ CC_MP_HOLD=false; }
  try{ ccRealTeamCall(); }catch(e){}
  // 2023-й: после Мейджора 1 дивизионов нет — ступень сходит в «вся сцена» (ccNoDivisions).
  if(typeof ccIs2023==='function' && ccIs2023()){ ccDiv23Place(); careerMigrateNoDiv(); }
  // 2022-й: дивизионы только осенью — ступень по рейтингу в день Placement Cup, после — «вся сцена».
  if(typeof ccIs2022==='function' && ccIs2022()){ ccDiv22Place(); careerMigrateNoDiv(); }
  // 2019–2020: состав по этапу года (дуо → трио → сквад). См. ccPhaseRoster.
  if(typeof ccSyncPhaseRoster==='function') ccSyncPhaseRoster();
  careerSave();
}

/* ---- Discord-тусовка региона (идея игрока из Notion 20.11, его «да» на план 21.11) -------------------------------
   Сервер, где сидят про и стримеры, с которыми ты пересекался: состав, друзья (cr.friends) и те, кто сейчас в личке
   (careerDmPool). У каждого статус на сегодня (войс / в игре / онлайн / офлайн, от дня и ника) и отношение к тебе
   (cr.crew.rel, 0-100). Можно:
   - позвать поиграть: согласие той же арифметикой, что в личке (рейтинг, репутация), плюс отношение и статус; да -
     вечер-скрим против него (занятие crew в CC_DAY_ACTS, ccScrimSet), отношение растёт; раз в день на человека;
   - позвать в дуо: обычное письмо в личку (careerDmWrite, лимит три в день);
   - зайти в войс: занятие voice, отношение с теми, кто там, и шанс, что кто-то сам позовёт поиграть;
   - ответить в чате на сообщение тебе: один ответ в день, двигает отношение.
   Все числа здесь - решение, не замер: данных о том, как про зовут друг друга играть, нет. */
let CC_CREW_WITH=null;
const CC_CREW_SIZE=10, CC_CREW_INV_CHANCE=0.35;
const CC_CREW_REL0={mate:50, friend:35, guest:20, other:10};
/* Пригласить на тусовку (его слово 21.11: «и инвайтить на сервер EU scene»): тот же поиск и то же правило, что на
   своём сервере (ccFanFindPool: регион, рейтинг ниже твоего), до CC_FAN_GUESTS_MAX человек; приглашённый - участник
   тусовки с отношением «знает тебя» (20): его можно звать поиграть и в дуо, он бывает в войсе и пишет в чат. */
function ccCrewGuests(){ const c=ccCrew(); c.guests=c.guests||[]; return c.guests; }
let CC_CREW_FIND_Q='';
function ccCrewFindPool(){
  const have=new Set(ccCrewMembers().map(m=>m.k));
  return ccFanFindPool(true).filter(w=>!have.has(hKey(w.handle)));
}
function ccCrewFindRows(q){ return ccInvRowsHTML(ccCrewFindPool(), q, 'ccCrewInvite', ccCrewGuests().length>=CC_FAN_GUESTS_MAX); }
// Имя не ccCrewFind: так зовётся поиск участника по ключу ниже, и второе объявление глушило первое (поиск не фильтровал).
function ccCrewFindQ(q){ CC_CREW_FIND_Q=String(q||''); const el=document.getElementById('ccCrewFindList'); if(el) el.innerHTML=ccCrewFindRows(q); }
function ccCrewInvite(handle){
  const g=ccCrewGuests(); if(g.length>=CC_FAN_GUESTS_MAX) return;
  const w=ccCrewFindPool().find(x=>hKey(x.handle)===hKey(handle)); if(!w) return;
  g.push({handle:w.handle, ovr:Math.round(w.ovr), since:careerToday()});
  const c=ccCrew(); c.kicked=(c.kicked||[]).filter(k=>k!==hKey(w.handle));
  c.last={day:careerToday(), text:L().fnJoined(ccHandle(w.handle))};
  careerSave(); careerRenderHub('discord');
}
// Кикнуть с тусовки (его слово 21.11: «и дать возможность кикать»): любого, кроме своего состава.
function ccCrewKick(k){
  const m=ccCrewFind(k); if(!m || m.kind==='mate') return;
  const c=ccCrew();
  c.guests=ccCrewGuests().filter(g=>hKey(g.handle)!==m.k);
  if(m.kind!=='guest'){ c.kicked=c.kicked||[]; if(c.kicked.indexOf(m.k)<0) c.kicked.push(m.k); }
  if(c.voice && c.voice.inviter===m.k) c.voice.inviter=null;
  c.last={day:careerToday(), text:L().dcKicked(ccHandle(m.handle))};
  careerSave(); careerRenderHub('discord');
}
function ccCrewInviteHTML(chan){
  const T=L(), full=ccCrewGuests().length>=CC_FAN_GUESTS_MAX;
  return chan(T.fnInviteChan, '<p class="dc-sub">'+esc(T.fnInviteTxt(ccFanMyOvr(), CC_FAN_GUESTS_MAX))+'</p>'+
    '<div class="dc-compose dc-find"><input id="ccCrewFindIn" type="search" autocomplete="off" value="'+esc(CC_CREW_FIND_Q)+'" '+
      'placeholder="'+esc(T.fnFindPh)+'" aria-label="'+esc(T.fnFindPh)+'" oninput="ccCrewFindQ(this.value)"></div>'+
    ccInvCtrlHTML()+
    (full ? '<div class="dc-why">'+esc(T.fnFull(CC_FAN_GUESTS_MAX))+'</div>' : '')+
    '<div id="ccCrewFindList" class="fn-find">'+ccCrewFindRows(CC_CREW_FIND_Q)+'</div>', 'tool');
}
const CC_CREW_STATUS_W=[['voice',0.25],['game',0.25],['on',0.3],['off',0.2]];
const CC_CREW_REPLY={r1:6, r2:3, r3:0};
const CC_CREW_GROUP_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.2 14.4c2.6.1 4.3 1.8 4.8 4.6"/></svg>';
function ccCrew(){ const cr=CAREER.career; cr.crew=cr.crew||{rel:{}}; cr.crew.rel=cr.crew.rel||{}; return cr.crew; }
function ccCrewOvr(c){ try{ return Math.round(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr||70); }catch(e){ return 70; } }
// Кто на сервере: состав, друзья, личка. Без дублей и без себя.
function ccCrewMembers(){
  const out=[], seen=new Set(), me=careerCard();
  if(me) seen.add(hKey(me));
  const add=(card, handle, ovr, kind)=>{
    const h=handle || (card && card.handle); if(!h) return;
    const k=hKey(h); if(seen.has(k) || kicked.has(k) || out.length>=CC_CREW_SIZE+gs.length) return;
    seen.add(k);
    out.push({handle:h, k:k, card:card||null, ovr:ovr!=null ? ovr : (card ? ccCrewOvr(card) : 70), kind:kind});
  };
  // Приглашённые на сервер (канал «пригласить», ccCrewInvite) - сверх обычных десяти.
  const gs=ccCrewGuests();
  // Кикнутые (ccCrewKick) на сервер не возвращаются, пока их не позовут снова через поиск. Состав кикнуть нельзя.
  const kicked=new Set(ccCrew().kicked||[]);
  try{ careerMates().forEach(m=>{ if(m){ kicked.delete(hKey(m)); add(m, m.handle, null, 'mate'); } }); }catch(e){}
  try{ (CAREER.career.friends||[]).forEach(h=>add(ccFriendCard(h), h, null, 'friend')); }catch(e){}
  gs.forEach(g=>{ let c=null; try{ c=ccFriendCard(g.handle); }catch(e){} add(c, g.handle, g.ovr, 'guest'); });
  try{ careerDmPool().forEach(w=>add(w.card || ccFriendCard(w.handle), w.handle, w.ovr, 'other')); }catch(e){}
  return out;
}
function ccCrewRel(m){
  const rel=ccCrew().rel;
  if(rel[m.k]==null) return CC_CREW_REL0[m.kind]!=null ? CC_CREW_REL0[m.kind] : CC_CREW_REL0.other;
  return rel[m.k];
}
function ccCrewRelAdd(m, n){ const c=ccCrew(); c.rel[m.k]=clamp(ccCrewRel(m)+n, 0, 100); }
// Статус на сегодня: от дня и ника, одинаковый при каждой перерисовке.
function ccCrewStatus(m){
  const rnd=careerRng(ccHashStr('crew|'+careerToday()+'|'+m.k));
  const x=rnd(); let acc=0;
  for(const [s, w] of CC_CREW_STATUS_W){ acc+=w; if(x<acc) return s; }
  return 'off';
}
function ccCrewFace(m){ try{ return m.card ? (photoURL(m.card)||'') : ''; }catch(e){ return ''; } }
function ccCrewAv(m){ const fb=String(m.handle).slice(0, 2).toUpperCase(), f=ccCrewFace(m); return f ? ccDcImg(f, fb) : esc(fb); }
function ccCrewRelKey(r){ return r>=70 ? 'crRelClose' : r>=40 ? 'crRelFriend' : r>=20 ? 'crRelKnown' : 'crRelNew'; }
function ccCrewAskedToday(m){ const a=ccCrew().inv; return !!(a && a.day===careerToday() && a.who.indexOf(m.k)>=0); }
function ccCrewInvited(m){ const c=ccCrew(), v=c.voice, o=c.offerYes, d=careerToday();
  // Позвал голосом - или сам предложил в чате, и ты согласился (ccCrewOffer): отказа уже не будет.
  return !!((v && v.day===d && v.inviter===m.k) || (o && o.day===d && o.k===m.k)); }
// Почему нельзя позвать поиграть; '' - можно.
// Режимы «поиграть вместе»: занятие и подпись. Ранкед вдвоём - обычная сессия ранкеда (trSur, ccRk).
// Скримов здесь нет (22.11, его «это то же самое, что нобл»): скримы с другом - это запись на Noble ('nb' в строке игрока).
const CC_CREW_MODES=[['rk','trSur'], ['box','crewBox'], ['zw','crewZw']];
function ccCrewModeAct(mode){ const x=CC_CREW_MODES.find(e=>e[0]===mode); return x ? x[1] : 'crew'; }
function ccCrewModeName(mode){ return mode==='nb' ? ccPracSrv() : mode==='rk' ? ccActName('trSur') : mode==='box' ? ccActName('trBox') : mode==='zw' ? ccActName('trZw') : L().crModeScr; }
// Почему нельзя позвать поиграть; '' - можно. С mode - ещё и почему нельзя именно этот режим.
function ccCrewWhy(m, mode){
  const T=L(), st=ccCrewStatus(m), cr=CAREER.career;
  if(cr.seasonOver) return T.ccSeasonOver;
  if(careerDayClosed()) return T.crDayGone;
  if(!ccCrewInvited(m)){
    if(st==='off') return T.crStOff;
    if(st==='game') return T.crStGame;
    if(ccCrewAskedToday(m)) return T.crAskedToday;
  }
  if(!mode) return '';
  // Noble (его «нобл позвать и сразу рега, если игрок соглашается, и симуляция»): правила обычной кастомки сервера
  // практики - свободный день, 40 энергии, раз в день (ccDcWhy); уже сыгранная сегодня запись - нельзя.
  if(mode==='nb'){ const r=ccDcReg(); if(r && (r.done || r.kind!=='pc')) return T.dcDone; return ccDcWhy('pcJoin')||''; }
  // Ранкед - тренировка, его можно и в день турнира (с резервом на кап, ccArenaPlayWhy); остальное - нет.
  if(mode==='rk') return (typeof ccArenaPlayWhy==='function' ? ccArenaPlayWhy() : '') || '';
  if(ccPreEvent()) return T.crNotTourDay;
  const act=ccActById(ccCrewModeAct(mode));
  if(careerEnergy()<act.energy) return T.ccNeedEnergy(act.energy-careerEnergy());
  return '';
}
// Согласится ли: та же тяга, что в личке (рейтинг, репутация), плюс отношение и статус; место в составе не важно.
function ccCrewYes(m){
  const st=ccCrewStatus(m);
  const pull=CAREER.player.ovr+careerRep()/CC_REP_PER_OVR+ccCrewRel(m)/5+(st==='voice' ? 4 : 0);
  return pull-(m.ovr-CAREER_DM_REACH)>=0;
}
function ccCrewFind(k){ return ccCrewMembers().find(m=>m.k===k) || null; }
function ccCrewPlay(k, mode){
  mode=mode||'box';
  const m=ccCrewFind(k); if(!m || ccCrewWhy(m, mode)) return;
  const c=ccCrew(), T=L(), today=careerToday();
  const invited=ccCrewInvited(m);
  if(!c.inv || c.inv.day!==today) c.inv={day:today, who:[]};
  c.inv.who.push(m.k);
  if(!invited && !ccCrewYes(m)){
    ccCrewRelAdd(m, -1);
    c.last={day:today, text:T.crNo(ccHandle(m.handle))};
    careerSave(); careerRenderHub('discord'); return;
  }
  if(mode==='nb'){
    // Согласился - запись на ближайшую сессию, чек-ин, метка на самую свободную точку и сразу игра (ccScrimRun).
    ccCrewRelAdd(m, 5); if(invited){ if(c.voice) c.voice.inviter=null; c.offerYes=null; }
    c.last={day:today, text:T.crPlayedRk(ccHandle(m.handle), ccPracSrv())};
    let r=ccDcReg();
    if(!r){ ccDcRegister('pc', CC_DC_SESS[0].id); r=ccDcReg(); }
    if(!r) return;
    r.checked=true; r.with=m.handle;
    if(r.spot==null) ccDcAutoSpot(r);
    careerSave();
    ccScrimRun();
    return;
  }
  if(mode==='rk'){
    // Ранкед вдвоём: та же сессия, что из вкладки тренировок (ccRkPlay), но без ухода с Discord.
    const n0=ccRk().n||0, r=careerDoAct('trSur'), rk=ccRk();
    if(r){ ccCrewRelAdd(m, 5); if(invited){ if(c.voice) c.voice.inviter=null; c.offerYes=null; } c.last={day:today, text:T.crPlayedRk(ccHandle(m.handle), ccCrewModeName('rk'))}; }
    careerSave(); careerRenderHub('discord');
    if((rk.n||0)!==n0 && rk.last && rk.last.games && rk.last.games.length) ccRkSimOpen(rk.last);
    return;
  }
  CC_CREW_WITH={handle:m.handle, ovr:m.ovr};
  let r=null;
  try{ r=careerDoAct(ccCrewModeAct(mode)); } finally{ CC_CREW_WITH=null; }
  if(r){
    ccCrewRelAdd(m, 5);
    if(invited){ if(c.voice) c.voice.inviter=null; c.offerYes=null; }
    const s=r.scrim;
    c.last={day:today, text:T.crPlayedMode(ccHandle(m.handle), ccCrewModeName(mode), s ? s.mine : 0, s ? s.theirs : 0)};
  }
  careerSave(); careerRenderHub('discord');
}
function ccCrewDuo(k){
  const m=ccCrewFind(k); if(!m) return;
  careerDmWrite(m.handle);
}
function ccCrewVoiceWhy(){
  const T=L(), v=ccCrew().voice;
  if(v && v.day===careerToday()) return T.crVoiceIn;
  if(CAREER.career.seasonOver) return T.ccSeasonOver;
  if(careerDayClosed()) return T.crDayGone;
  const act=ccActById('voice'), pre=ccPreEvent();
  if(careerEnergy()<act.energy) return T.ccNeedEnergy(act.energy-careerEnergy());
  if(pre && careerEnergy()-act.energy<pre.reserve) return T.ccKeepEnergy(pre.reserve);
  return '';
}
/* Голосовых каналов три (его «больше голосовых каналов»): общий, скримы, чилл. Кто в войсе - сидит в одном из них
   (от дня и ника); ты заходишь в выбранный, и звать поиграть может только тот, кто в этом же канале. */
const CC_CREW_VC=3;
function ccCrewVc(m){ return Math.floor(careerRng(ccHashStr('crewvc|'+careerToday()+'|'+m.k))()*CC_CREW_VC); }
function ccCrewVoice(ch){
  ch=Math.max(0, Math.min(CC_CREW_VC-1, ch|0));
  if(ccCrewVoiceWhy()) return;
  if(!careerDoAct('voice')) return;
  const c=ccCrew(), today=careerToday(), inVoice=ccCrewMembers().filter(m=>ccCrewStatus(m)==='voice' && ccCrewVc(m)===ch);
  inVoice.forEach(m=>ccCrewRelAdd(m, 2));
  // Шанс, что кто-то из войса сам позовёт поиграть: тот, с кем отношение лучше.
  const rnd=careerRng(ccHashStr('crewvoice|'+today));
  let inviter=null;
  if(inVoice.length && rnd()<CC_CREW_INV_CHANCE) inviter=inVoice.slice().sort((a,b)=>ccCrewRel(b)-ccCrewRel(a))[0].k;
  c.voice={day:today, ch:ch, inviter:inviter};
  careerSave(); careerRenderHub('discord');
}
// Чат дня: несколько сообщений участников и одно тебе, с ответом.
function ccCrewChat(members){
  const T=L(), today=careerToday(), rnd=careerRng(ccHashStr('crewchat|'+today)), cr=CAREER.career;
  const on=members.filter(m=>ccCrewStatus(m)!=='off');
  if(!on.length) return {lines:[], toYou:null};
  const pick=()=>on[Math.floor(rnd()*on.length)];
  let next=null; try{ next=careerNext(); }catch(e){}
  const evName=next && next.type!=='free' && next.day===today ? (next.title||next.label||'') : '';
  const pool=[
    ()=>evName ? T.crM1(evName) : T.crM2(),
    ()=>T.crM2(),
    ()=>{ const o=pick(); return T.crM3(ccHandle(o.handle)); },
    ()=>T.crM4(),
    ()=>T.crM5()
  ];
  // Фразы без повторов: одна и та же строка дважды подряд читалась как сбой.
  const lines=[], left=pool.slice();
  const n=Math.min(3, on.length);
  for(let i=0;i<n;i++) lines.push({m:pick(), text:left.splice(Math.floor(rnd()*left.length), 1)[0]()});
  // Тебе: на свой последний результат за три дня, иначе просто привет.
  const last=(cr.log||[]).slice(-1)[0];
  const recent=last && last.day && ccDaysBetween(last.day, today)<=3 && last.place;
  const who=pick(), nick=CAREER.player.nick||'';
  // Тон - от того, кто пишет (его «пусть диалоги не нпс, троллинг над результатами или похвала»): малознакомый
  // подкалывает за плохое место и даже хорошее зовёт везением, друг хвалит и поддерживает.
  const good=recent && last.place<=Math.max(3, Math.ceil((last.of||100)*0.1)), rel=ccCrewRel(who);
  const text=!recent ? T.crMeHi(nick)
    : good ? (rel<20 ? T.crMeTease(nick, last.place) : T.crMeGood(nick, last.place))
    : (rel<25 ? T.crMeTroll(nick, last.place) : T.crMeBad(nick, last.place));
  return {lines:lines, toYou:{m:who, text:text}};
}
function ccCrewReply(opt){
  const c=ccCrew(), today=careerToday();
  if(c.reply && c.reply.day===today) return;
  if(!(opt in CC_CREW_REPLY)) return;
  const chat=ccCrewChat(ccCrewMembers());
  if(!chat.toYou) return;
  ccCrewRelAdd(chat.toYou.m, CC_CREW_REPLY[opt]);
  c.reply={day:today, opt:opt};
  careerSave(); careerRenderHub('discord');
}
function ccCrewHTML(chan, msg){
  const T=L(), c=ccCrew(), today=careerToday();
  const members=ccCrewMembers();
  const stName={voice:T.crStVoice, game:T.crStGame, on:T.crStOn, off:T.crStOff};
  const row=m=>{
    const st=ccCrewStatus(m), why=ccCrewWhy(m), rel=ccCrewRel(m), invited=ccCrewInvited(m);
    // В соло-сезоне звать некуда (его «ask to duo пишется в соло сезоне»); в трио и скваде - подпись того формата.
    const duoOk=m.kind!=='mate' && careerMateSeats()>0 && !(typeof ccMpOn==='function' && ccMpOn());
    // Строка как в Discord: аватарка, ник, статус; действия раскрываются по нажатию (ccMemToggle), иначе при
    // сотне участников список уходил на несколько экранов (его «слишком много скролить»). Позвавший - раскрыт сразу.
    return '<div class="cr-mem cr-fold st-'+st+(invited ? ' inv open' : '')+'">'+
      '<span class="dc-av">'+ccCrewAv(m)+'<i class="cr-dot" aria-hidden="true"></i></span>'+
      '<button type="button" class="cr-who" onclick="ccMemToggle(this)" aria-expanded="'+(invited ? 'true' : 'false')+'"><b>'+esc(ccHandle(m.handle))+' <em>'+m.ovr+'</em></b>'+
        '<span>'+esc(stName[st])+(ccCrewRelKey(rel)==='crRelNew' ? '' : ' · '+esc(T[ccCrewRelKey(rel)]))+'</span>'+
        (invited ? '<span class="cr-inv">'+esc(T.crInvitedYou)+'</span>' : '')+
        (why && why!==stName[st] ? '<span class="dc-why">'+esc(why)+'</span>' : '')+'</button>'+
      '<div class="cr-btns">'+
        // Во что играть - на выбор: ранкед, бокс-файты, зон-варс, скримы, Noble (сразу запись и игра).
        '<span class="cr-modes-l">'+esc(invited ? T.crAccept : T.crPlay)+':</span>'+
        [['rk', 'trSur'], ['box', 'crewBox'], ['zw', 'crewZw'], ['nb', null]].map(([md, act])=>{
          const w=why || ccCrewWhy(m, md), en=act ? ccActById(act).energy : CC_DC_ENERGY;
          return '<button class="dc-btn sm"'+(w ? ' disabled title="'+esc(w)+'"' : '')+' onclick="ccCrewPlay(\''+jsq(m.k)+'\',\''+md+'\')">'+
            esc(md==='nb' ? ccPracSrv() : ccCrewModeName(md))+' <em>'+en+T.ccEnergyMark+'</em></button>';
        }).join('')+
        ccCrewEventBtns(m, why)+
        (duoOk ? '<button class="dc-btn ghost sm" onclick="ccCrewDuo(\''+jsq(m.k)+'\')">'+esc(T[ccSquadKey('dmAskBtn')]||T.crDuo)+'</button>' : '')+
        (m.kind!=='mate' ? '<button class="dc-btn ghost sm dc-kick" onclick="ccCrewKick(\''+jsq(m.k)+'\')" aria-label="'+esc(T.dcKick+' '+ccHandle(m.handle))+'">'+esc(T.dcKick)+'</button>' : '')+
      '</div></div>';
  };
  const chat=ccCrewChat(members);
  let chatHTML=chat.lines.map(l=>msg(ccHandle(l.m.handle), false, '<p>'+esc(l.text)+'</p>', ccCrewAv(l.m))).join('');
  if(chat.toYou){
    const done=c.reply && c.reply.day===today ? c.reply.opt : null;
    chatHTML+=msg(ccHandle(chat.toYou.m.handle), false, '<p>'+esc(chat.toYou.text)+'</p>'+
      (done ? '' : '<div class="cr-replies">'+['r1','r2','r3'].map(o=>
        '<button class="dc-btn ghost sm" onclick="ccCrewReply(\''+o+'\')">'+esc(T['crR'+o.slice(1)])+'</button>').join('')+'</div>'),
      ccCrewAv(chat.toYou.m));
    if(done && done!=='r3') chatHTML+=msg(CAREER.player.nick, false, '<p>'+esc(T['crR'+done.slice(1)])+'</p>');
  }
  const vWhy=ccCrewVoiceWhy(), vIn=!!(c.voice && c.voice.day===today), vCh=vIn ? (c.voice.ch|0) : -1;
  // Зашёл в войс - ты тоже в списке своего канала, своей карточкой (как в Discord: себя видно в канале).
  const meV='<span class="cr-vm cr-vm-me" title="'+esc(CAREER.player.nick||'')+'"><span class="dc-av">'+(ccDcFace() ? ccDcImg(ccDcFace(), 'ME') : 'ME')+'</span><i>'+esc(CAREER.player.nick||'')+'</i></span>';
  const voiceOf=ch=>{
    const inV=members.filter(m=>ccCrewStatus(m)==='voice' && ccCrewVc(m)===ch), here=vCh===ch;
    return '<div class="cr-voice">'+((inV.length || here)
        ? (here ? meV : '')+inV.map(m=>'<span class="cr-vm" title="'+esc(ccHandle(m.handle))+'"><span class="dc-av">'+ccCrewAv(m)+'</span><i>'+esc(ccHandle(m.handle))+'</i></span>').join('')
        : '<p class="dc-sub">'+esc(T.crVoiceEmpty)+'</p>')+'</div>'+
      '<div class="dc-act"><button class="dc-btn'+(here ? ' ghost' : '')+'"'+(vWhy ? ' disabled' : '')+' onclick="ccCrewVoice('+ch+')">'+
        esc(here ? T.crVoiceIn : T.crVoiceJoin)+(vIn ? '' : ' <em>'+ccActById('voice').energy+T.ccEnergyMark+'</em>')+'</button>'+
        (vWhy && !vIn ? '<span class="dc-why">'+esc(vWhy)+'</span>' : vIn && !here ? '<span class="dc-why">'+esc(T.crVoiceElsewhere(T['crVc'+(vCh+1)]))+'</span>' : '')+'</div>';
  };
  const last=c.last && c.last.day===today ? '<div class="dc-res">'+esc(c.last.text)+'</div>' : '';
  let voices=''; for(let i=0;i<CC_CREW_VC;i++) voices+=chan(T['crVc'+(i+1)], voiceOf(i), 'voice');
  return chan(T.crGeneral, '<p class="dc-sub">'+esc(T.crIntro)+'</p>'+chatHTML+ccCrewChatBoxHTML(msg, members))+
    ccCrewResultsHTML(chan, msg, members)+ccCrewLfgHTML(chan, msg, members)+
    voices+
    chan(T.crMembers+' · '+members.length, last+(members.length ? ccMemGroups(members, row, m=>ccCrewStatus(m)!=='off') : '<p class="dc-sub">'+esc(T.crNobody)+'</p>'), 'members')+
    ccCrewInviteHTML(chan);
}

/* ---- Свой фан-сервер (его слово 21.11: «пусть свой сервер можно будет создать, где будут фанаты писать после
   турниров, спрашивать, кидать в отдельный канал, что они купили по коду автора») -------------------------------
   Создаётся на «Моём сервере» с CC_FAN_MIN подписчиков (решение, не замер). Каналы:
   - после турнира: фанаты пишут про последний свой результат за два дня; сколько пишет - от подписчиков (лог);
   - вопросы: один вопрос в день, ответ (один из двух) даёт немного подписчиков, раз в день;
   - покупки по коду: только со своим кодом автора (CAREER.sacOwn, магазин); предметы - настоящий магазин дня
     (ccFnShopDay), сколько покупок - от подписчиков той же долей покупающих, что и выплата кода (CC_SAC_RATE).
   Фанаты - выдуманные ники, аватарки - скины Fortnite (CC_FN_SKIN). Никаких денег сервер сам не платит: деньги
   по коду и так приходят раз в месяц (ccSacTick), канал только показывает, откуда они. */
// Ответ фанату: +корень из подписчиков/10 (200 → 1, 1000 → 3, 60 000 → 24). Доля от подписчиков (0.4% в день)
// за год умножала аудиторию в разы, корень даёт ~15% в год даже при ответе каждый день.
const CC_FAN_MIN=200, CC_FAN_ANSWER_DIV=10, CC_FAN_BUYERS_DAY=0.004/30;
const CC_FAN_A=['tilted','zone','box','cracked','storm','loot','sweaty','chill','turbo','piece','edit','bus','moist','crank','fresh'];
const CC_FAN_B=['fan','king','enjoyer','main','goat','lad','queen','gamer','bot','andy','ace','kid','fox','wolf','vibes'];
function ccFans(){ return CAREER.career.fans || null; }
/* Сколько людей на сервере (его «слишком много участников», 21.11): было число всех подписчиков. В Discord стримера
   сидит малая часть аудитории - CC_FAN_SHARE подписчиков, и набирается она за первый месяц после создания.
   Доля - оценка, не замер. */
const CC_FAN_SHARE=0.03, CC_FAN_RAMP=30;
function ccFanMembers(){
  const f=ccFans(); if(!f) return 0;
  const days=f.since ? Math.max(0, ccDaysBetween(f.since, careerToday())) : CC_FAN_RAMP;
  return Math.max(1, Math.round(careerReach()*CC_FAN_SHARE*Math.min(1, (days+1)/CC_FAN_RAMP)));
}
function ccFanWhy(){
  const T=L();
  if(ccFans()) return '';
  if(careerReach()<CC_FAN_MIN) return T.fnNeedFol(ccNum(CC_FAN_MIN));
  return '';
}
function ccFanCreate(){
  if(ccFans() || ccFanWhy()) return;
  const inp=document.getElementById('ccFanName');
  let name=String((inp && inp.value) || '').replace(/[<>]/g, '').trim().slice(0, 32);
  if(!name) name=L().fnDefName(CAREER.player.nick||'');
  CAREER.career.fans={name:name, since:careerToday()};
  careerSave(); careerRenderHub('discord');
}
// Ник фаната: из двух слов и числа, от дня и номера, одинаковый при перерисовке.
function ccFanNick(seed){
  const r=careerRng(ccHashStr('fan|'+seed));
  const a=CC_FAN_A[Math.floor(r()*CC_FAN_A.length)], b=CC_FAN_B[Math.floor(r()*CC_FAN_B.length)];
  return a+'_'+b+(r()<0.6 ? Math.floor(r()*99) : '');
}
function ccFanAv(nick){
  let src=null; try{ src=window.CC_FN_SKIN ? window.CC_FN_SKIN(nick) : null; }catch(e){}
  return src ? ccDcImg(src, nick.slice(0, 2).toUpperCase()) : esc(nick.slice(0, 2).toUpperCase());
}
// Сколько фанатов пишет: 1 при двухстах подписчиках, 6 к миллиону.
function ccFanVoices(){ return clamp(Math.round(Math.log10(Math.max(10, careerReach()))*1.5-2.4), 1, 6); }
function ccFanAfter(){
  const T=L(), cr=CAREER.career, today=careerToday();
  const last=(cr.log||[]).filter(r=>r && r.place && r.day && ccDaysBetween(r.day, today)<=2 && !r.away).slice(-1)[0];
  if(!last) return [];
  const of=last.of||100, p=last.place;
  const tier=p===1 ? 'W' : p<=Math.max(3, Math.ceil(of*0.1)) ? 'G' : p<=Math.ceil(of*0.5) ? 'M' : 'B';
  const ev=ccFanEvName(last);
  const n=ccFanVoices(), r=careerRng(ccHashStr('fanafter|'+last.day+'|'+p));
  const pool=[1,2,3,4];
  const out=[];
  for(let i=0;i<n && pool.length;i++){
    const k=pool.splice(Math.floor(r()*pool.length), 1)[0];
    out.push({nick:ccFanNick('a|'+last.day+'|'+i), text:T['fnAfter'+tier+k](p, ev)});
  }
  return out;
}
function ccFanEvName(r){
  // Кап дивизиона в календаре подписан сессией («Session 2»), фанаты зовут его капом.
  if(r.kind==='cup') return L().ccCupLive;
  try{ const e=(careerYearDays().get(r.day)||[]).find(x=>x.kind===r.kind); if(e) return e.title||e.lan||e.name||e.label||L().fnTheCup; }catch(e){}
  return L().fnTheCup;
}
// Вопрос дня и ответ на него.
const CC_FAN_QS=8;
function ccFanQ(){ const r=careerRng(ccHashStr('fanq|'+careerToday())); return 1+Math.floor(r()*CC_FAN_QS); }
function ccFanAnswer(opt){
  const f=ccFans(), today=careerToday(); if(!f) return;
  if(f.ans && f.ans.day===today) return;
  if(opt!=='a1' && opt!=='a2') return;
  const got=careerReachAdd(Math.max(1, Math.round(Math.sqrt(careerReach())/CC_FAN_ANSWER_DIV)));
  f.ans={day:today, opt:opt, got:got};
  careerSave(); careerRenderHub('discord');
}
// Покупки по коду сегодня: настоящий магазин дня, число - доля покупающих от подписчиков.
function ccFanBuys(){
  const code=typeof ccSacOwnCode==='function' ? ccSacOwnCode() : null;
  if(!code || !ccSacOwnOn()) return null;
  const shop=typeof ccFnShopDay==='function' ? ccFnShopDay(careerToday()) : null;
  if(!shop){ try{ ccFnShopLoad(()=>{ if(CH_TAB==='discord' && CH_DC==='own') careerRenderHub('discord'); }); }catch(e){} return []; }
  if(!shop.length) return [];
  const r=careerRng(ccHashStr('fanbuy|'+careerToday()));
  const want=careerReach()*CC_FAN_BUYERS_DAY;
  let n=Math.floor(want); if(r()<want-n) n++;
  n=Math.min(6, n);
  const out=[];
  for(let i=0;i<n;i++){ const it=shop[Math.floor(r()*shop.length)]; out.push({nick:ccFanNick('b|'+careerToday()+'|'+i), it:it, price:ccFnPrice(it)}); }
  return out;
}
function ccFanHTML(chan, msg){
  const T=L(), f=ccFans(), today=careerToday();
  if(!f){
    const why=ccFanWhy();
    return chan(T.fnCreateChan, '<p class="dc-sub">'+esc(T.fnCreateTxt)+'</p>'+
      '<div class="dc-act fn-create"><input id="ccFanName" class="fn-name" maxlength="32" placeholder="'+esc(T.fnDefName(CAREER.player.nick||''))+'" aria-label="'+esc(T.fnNameLabel)+'"'+(why ? ' disabled' : '')+'>'+
      '<button class="dc-btn"'+(why ? ' disabled' : '')+' onclick="ccFanCreate()">'+esc(T.fnCreateBtn)+'</button>'+
      (why ? '<span class="dc-why">'+esc(why)+'</span>' : '')+'</div>');
  }
  const after=ccFanAfter();
  const afterHTML=after.length ? after.map(x=>msg(x.nick, false, '<p>'+esc(x.text)+'</p>', ccFanAv(x.nick))).join('')
    : '<p class="dc-sub">'+esc(T.fnAfterNone)+'</p>';
  const q=ccFanQ(), qNick=ccFanNick('q|'+today), done=f.ans && f.ans.day===today ? f.ans : null;
  const qHTML=msg(qNick, false, '<p>'+esc(T['fnQ'+q])+'</p>'+
      (done ? '' : '<div class="cr-replies">'+['a1','a2'].map(o=>'<button class="dc-btn ghost sm" onclick="ccFanAnswer(\''+o+'\')">'+esc(T['fnA'+q+o.slice(1)])+'</button>').join('')+'</div>'),
      ccFanAv(qNick))+
    (done ? msg(CAREER.player.nick, false, '<p>'+esc(T['fnA'+q+done.opt.slice(1)])+'</p>')+
      (done.got>0 ? '<div class="dc-res">'+esc(T.fnAnswered(ccNum(done.got)))+'</div>' : '') : '');
  const buys=ccFanBuys();
  const code=typeof ccSacOwnCode==='function' ? ccSacOwnCode() : null;
  const buyHTML=buys===null
    ? msg(f.name, true, '<p>'+esc(code ? T.fnCodeNeedFol(ccNum(CC_SAC_MIN)) : T.fnCodeNone(ccNum(CC_SAC_MIN)))+'</p>', CC_CREW_GROUP_SVG)
    : buys.length ? buys.map(x=>msg(x.nick, false, '<p>'+esc(T.fnBought(x.it.name, code))+'</p>'+
        '<div class="fn-buy"><img src="'+esc(ccFnImg(x.it.id, true))+'" alt="" loading="lazy" onerror="this.remove()"><span>'+esc(x.it.name)+' · '+ccNum(x.price)+' V</span></div>', ccFanAv(x.nick))).join('')
    : '<p class="dc-sub">'+esc(T.fnBuyNone(code))+'</p>';
  return ccFanChatHTML(chan, msg)+chan(T.fnAfterChan, afterHTML)+chan(T.fnQChan, qHTML)+chan(T.fnCodeChan, buyHTML)+
    ccFanVoiceHTML(chan)+ccFanMembersHTML(chan)+ccFanInviteHTML(chan)+ccFanSettingsHTML(chan);
}

/* ---- Вид как в Discord (его слово 21.11: «сделай как в дискорде оформление каналов голосовых текстовых») ----------
   Слева серверы, рядом список каналов по категориям (текстовые с #, голосовые с динамиком и аватарками тех, кто внутри),
   справа открытый канал; участники тусовки на широком экране отдельной колонкой справа. На телефоне - как в мобильном
   Discord: список каналов, нажал - открылся канал со стрелкой назад (CH_DCV).
   Каналы рисуют разные функции (.dc-chan с заголовком .dc-chan-h), поэтому раскладка собирается после отрисовки
   из готовых блоков, а не переписывает каждую из них. Вид канала - data-kind: voice / members, иначе текстовый. */
let CH_DCC={}, CH_DCV='list';
const CC_DC_HASH_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.9 3.3a1 1 0 0 0-1.97-.33L8.4 6H5a1 1 0 0 0 0 2h3.07l-.67 4H4a1 1 0 0 0 0 2h3.07l-.56 3.34a1 1 0 0 0 1.97.33L9.1 14h4l-.56 3.34a1 1 0 0 0 1.97.33L15.1 14H19a1 1 0 0 0 0-2h-3.57l.67-4H20a1 1 0 0 0 0-2h-3.57l.48-2.7a1 1 0 0 0-1.97-.33L14.4 6h-4zM10.1 8h4l-.67 4h-4z"/></svg>';
const CC_DC_SPK_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.4 3.2A1 1 0 0 1 13 4v16a1 1 0 0 1-1.6.8L6.7 17H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.7zM15.6 8.2a1 1 0 0 1 1.4.1 5.6 5.6 0 0 1 0 7.4 1 1 0 1 1-1.5-1.3 3.6 3.6 0 0 0 0-4.8 1 1 0 0 1 .1-1.4z"/></svg>';
const CC_DC_MEMB_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.2 14.4c2.6.1 4.3 1.8 4.8 4.6"/></svg>';
function ccDcPick(i){ const srv=CH_DC||'crew'; const it=(CC_DC_ITEMS||[])[i]; if(!it) return; CH_DCC[srv]=it.raw; CH_DCV='chan'; careerRenderHub('discord'); }
function ccDcChBack(){ CH_DCV='list'; careerRenderHub('discord'); }
let CC_DC_ITEMS=null;
const CC_DC_INV_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 20c.7-3.6 3.3-5.6 6.5-5.6 1.4 0 2.7.4 3.8 1.1M18 13v7M14.5 16.5h7"/></svg>';
const CC_DC_GEAR_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
function ccDcLayout(root){
  const wrap=root && root.querySelector('.dc-wrap'); if(!wrap) return;
  const body=wrap.querySelector('.dc-body'); if(!body) return;
  const chans=[...body.querySelectorAll(':scope > .dc-chan')]; if(!chans.length) return;
  const T=L(), srv=CH_DC||'crew';
  const items=chans.map((c, i)=>{
    const h=c.querySelector(':scope > .dc-chan-h');
    const raw=(h ? h.textContent : '').replace(/^#\s*/, '').trim();
    return {c:c, raw:raw, kind:c.dataset.kind||'text', i:i};
  });
  CC_DC_ITEMS=items;
  const cur=items.find(x=>x.raw===CH_DCC[srv]) || items.find(x=>x.kind==='text') || items[0];
  // Раздел «Сервер» (data-kind="tool"): пригласить - человечек с плюсом, настройки - шестерёнка.
  const iconOf=x=>x.kind==='voice' ? CC_DC_SPK_SVG : x.kind==='members' ? CC_DC_MEMB_SVG
    : x.kind==='tool' ? (x.raw===T.fnInviteChan ? CC_DC_INV_SVG : CC_DC_GEAR_SVG) : CC_DC_HASH_SVG;
  const icon=k=>iconOf(typeof k==='string' ? {kind:k, raw:''} : k);
  const label=x=>esc(x.raw.replace(/\s*·\s*[\d,.\s]+$/, ''));
  const btn=x=>'<button type="button" class="dc-ch k-'+x.kind+(x===cur ? ' on' : '')+'" onclick="ccDcPick('+x.i+')"'+(x===cur ? ' aria-current="true"' : '')+'>'+
    '<i>'+iconOf(x)+'</i><span>'+label(x)+'</span></button>'+
    // Под голосовым - кто внутри, аватарками и ником, как в Discord.
    (x.kind==='voice' ? '<div class="dc-vlist">'+[...x.c.querySelectorAll('.cr-vm')].map(v=>
      '<span>'+(v.querySelector('.dc-av') ? v.querySelector('.dc-av').outerHTML : '')+'<i>'+esc((v.querySelector('i')||{}).textContent||'')+'</i></span>').join('')+'</div>' : '');
  const text=items.filter(x=>x.kind==='text'), voice=items.filter(x=>x.kind==='voice'), memb=items.filter(x=>x.kind==='members'), tools=items.filter(x=>x.kind==='tool');
  const nameEl=wrap.querySelector('.dc-name');
  const side='<nav class="dc-side" aria-label="'+esc(T.dcCatText)+'">'+
    '<div class="dc-side-h">'+(nameEl ? nameEl.innerHTML : '')+'</div>'+
    (text.length ? '<div class="dc-cat">'+esc(T.dcCatText)+'</div>'+text.map(btn).join('') : '')+
    (voice.length ? '<div class="dc-cat">'+esc(T.dcCatVoice)+'</div>'+voice.map(btn).join('') : '')+
    // Участники: на широком экране своей колонкой, на узком - пунктом списка.
    (memb.length ? '<div class="dc-cat dc-cat-m">'+esc(T.crMembers)+'</div>'+memb.map(btn).join('') : '')+
    (tools.length ? '<div class="dc-cat">'+esc(T.dcCatServer)+'</div>'+tools.map(btn).join('') : '')+
    '</nav>';
  items.forEach(x=>{ x.c.hidden = x!==cur && !(x.kind==='members'); });
  const head='<div class="dc-main-h"><button type="button" class="dc-back" onclick="ccDcChBack()" aria-label="'+esc(T.ccBack)+'">'+
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>'+
    '<i>'+iconOf(cur)+'</i><b>'+label(cur)+'</b></div>';
  const main=document.createElement('div'); main.className='dc-main'; main.innerHTML=head;
  const aside=document.createElement('aside'); aside.className='dc-memb';
  // На узком экране участники открываются как канал - со своей шапкой и стрелкой назад.
  if(memb.length) aside.innerHTML=head.replace('class="dc-main-h"', 'class="dc-main-h dc-memb-h"').replace(/<i>[\s\S]*?<\/i><b>[\s\S]*?<\/b>/, '<i>'+CC_DC_MEMB_SVG+'</i><b>'+esc(T.crMembers)+'</b>');
  items.forEach(x=>{ if(x.kind==='members') aside.appendChild(x.c); else main.appendChild(x.c); });
  body.replaceWith(main);
  if(nameEl) nameEl.remove();
  main.insertAdjacentHTML('beforebegin', side);
  if(memb.length) main.insertAdjacentElement('afterend', aside);
  wrap.classList.add('dc-x');
  wrap.dataset.view=CH_DCV;
  wrap.dataset.cur=cur.kind;
  // Чат открывается на последних сообщениях, как в Discord.
  /* Канал с чатом - на последних сообщениях (его «жму кнопки, сообщение не отправляется»: отправлялось, но канал
     перерисовывался с верха, и новое сообщение уходило под край). Листается сам канал, а не лента внутри. */
  wrap.querySelectorAll('.dc-chatlog').forEach(el=>{ el.scrollTop=el.scrollHeight; });
  if(cur.c.querySelector('.dc-chatlog')) cur.c.scrollTop=cur.c.scrollHeight;
}

/* ---- Чат на своём сервере (его слово 21.11: «просто чат на сервере личном») -------------------------------------
   Канал #chat первым на фан-сервере: пишешь своё сообщение, фанаты сразу отвечают. Что отвечают - по словам в
   сообщении: вопрос, свой код автора, стрим, победа, иначе обычные реакции. Сколько отвечает - как в канале после
   турнира (ccFanVoices), но не больше трёх. На игру не влияет, хранится последних CC_FAN_CHAT_KEEP сообщений.
   Текст игрока выводится только через esc(). */
const CC_FAN_CHAT_KEEP=40, CC_FAN_CHAT_MAX=300;
function ccFanChat(){ const f=ccFans(); if(!f) return []; f.chat=f.chat||[]; return f.chat; }
function ccFanReplyKind(text){
  const t=String(text||'').toLowerCase(), code=(typeof ccSacOwnCode==='function' && ccSacOwnCode()) || '';
  if(code && t.toUpperCase().indexOf(code)>=0) return 'Code';
  if(/stream|twitch|live|стрим|эфир|трансл|direct|diretta|transmis/.test(t)) return 'Stream';
  if(/\?/.test(t)) return 'Q';
  if(/\bgg\b|win|won|выигр|побед|топ|top|#1|gagn|vinto|ganh|gewonn|gan[eé]/.test(t)) return 'Hype';
  return 'Gen';
}
function ccFanChatSend(){
  const inp=document.getElementById('ccFanChatIn'); if(!inp || !ccFans()) return;
  const text=String(inp.value||'').replace(/\s+/g, ' ').trim().slice(0, CC_FAN_CHAT_MAX);
  if(!text) return;
  const chat=ccFanChat(), T=L(), day=careerToday(), n=chat.length;
  chat.push({me:1, t:text, d:day});
  const kind=ccFanReplyKind(text), r=careerRng(ccHashStr('fanchat|'+day+'|'+n+'|'+text));
  const per={Code:1, Stream:2, Q:4, Hype:3, Gen:5}[kind];
  const k=Math.min(3, ccFanVoices(), per);   // не больше, чем разных фраз: одна и та же дважды читалась как сбой
  const used=[];
  for(let i=0;i<k;i++){
    let j=1+Math.floor(r()*per); if(used.indexOf(j)>=0 && used.length<per){ j=1; while(used.indexOf(j)>=0) j++; }
    used.push(j);
    const key='fnR'+kind+j, s=T[key];
    chat.push({nick:ccFanNick('c|'+day+'|'+n+'|'+i), t:typeof s==='function' ? s((typeof ccSacOwnCode==='function' && ccSacOwnCode())||'') : (s||''), d:day});
  }
  // Позванный на сервер (не фанат) тоже иногда отвечает - своим ником и фото карточки.
  const gs=ccFanGuests();
  if(gs.length && r()<CC_FAN_GUEST_REPLY){
    const g=gs[Math.floor(r()*gs.length)], s=T['fnR'+kind+(1+Math.floor(r()*per))];
    chat.push({nick:g.handle, g:1, t:typeof s==='function' ? s((typeof ccSacOwnCode==='function' && ccSacOwnCode())||'') : (s||''), d:day});
  }
  while(chat.length>CC_FAN_CHAT_KEEP) chat.shift();
  CH_DCC.own=T.fnChatChan; CH_DCV='chan';
  careerSave(); careerRenderHub('discord');
  const again=document.getElementById('ccFanChatIn'); if(again){ try{ again.focus({preventScroll:true}); }catch(e){} }
}
function ccFanChatKey(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); ccFanChatSend(); } }
/* Люди пишут в #chat сами (его слово 21.11: «чат, чтоб люди туда чего-то писали»): раз в день, когда сервер открыт,
   в чат приходит пачка сообщений фанатов и приглашённых - про сегодняшний турнир, твой последний результат, предмет
   из магазина дня, стрим, просто разговоры. Сколько - от фанатов (ccFanVoices) и гостей, 2-7. Пропущенные дни не
   догоняются: пачка одна, за день, когда открыл. Шаблоны fnAmb* (фанаты) и fnAmbG* (гости). */
const CC_FAN_AMB_N=12, CC_FAN_AMB_G=4;
function ccFanChatTick(){
  const f=ccFans(); if(!f) return;
  const day=careerToday(); if(f.chatDay===day) return;
  f.chatDay=day;
  const T=L(), chat=ccFanChat(), r=careerRng(ccHashStr('fanamb|'+day));
  let next=null; try{ next=careerNext(); }catch(e){}
  const ev=next && next.type!=='free' && next.day===day ? (next.type==='cup' ? T.ccCupLive : (next.title||next.label||'')) : '';
  let shop=null; try{ shop=ccFnShopDay(day); }catch(e){}
  const it=shop && shop.length ? shop[Math.floor(r()*shop.length)].name : '';
  const last=(CAREER.career.log||[]).filter(x=>x && x.place).slice(-1)[0];
  const p=last && last.day && ccDaysBetween(last.day, day)<=7 ? last.place : 0;
  // Шаблоны, которым нужны турнир/предмет/место, берутся только когда есть что подставить.
  const need={2:!!ev, 3:!!it, 11:!!p};
  const pool=[]; for(let i=1;i<=CC_FAN_AMB_N;i++) if(need[i]!==false) pool.push(i);
  const gs=ccFanGuests();
  const n=clamp(ccFanVoices()+1+Math.min(2, gs.length), 2, 7);
  for(let i=0;i<n && pool.length;i++){
    const guest=gs.length && r()<0.3;
    if(guest){
      const g=gs[Math.floor(r()*gs.length)], s=T['fnAmbG'+(1+Math.floor(r()*CC_FAN_AMB_G))];
      chat.push({nick:g.handle, g:1, t:s(ev, it, CAREER.player.nick||'', p), d:day});
    } else {
      const k=pool.splice(Math.floor(r()*pool.length), 1)[0];
      chat.push({nick:ccFanNick('amb|'+day+'|'+i), t:T['fnAmb'+k](ev, it, CAREER.player.nick||'', p), d:day});
    }
  }
  while(chat.length>CC_FAN_CHAT_KEEP) chat.shift();
  careerSave();
}
function ccFanChatHTML(chan, msg){
  try{ ccFanChatTick(); }catch(e){}
  const T=L(), chat=ccFanChat();
  const list=chat.length ? chat.map(m=>m.me
      ? msg(CAREER.player.nick, false, '<p>'+esc(m.t)+'</p>')
      : m.g ? msg(ccHandle(m.nick), false, '<p>'+esc(m.t)+'</p>', ccFanGuestAv({handle:m.nick}))
      : msg(m.nick, false, '<p>'+esc(m.t)+'</p>', ccFanAv(m.nick))).join('')
    : '<p class="dc-sub">'+esc(T.fnChatEmpty)+'</p>';
  const box='<div class="dc-compose"><input id="ccFanChatIn" type="text" maxlength="'+CC_FAN_CHAT_MAX+'" autocomplete="off" '+
    'placeholder="'+esc(T.fnChatPh(T.fnChatChan))+'" aria-label="'+esc(T.fnChatPh(T.fnChatChan))+'" onkeydown="ccFanChatKey(event)">'+
    '<button type="button" class="dc-btn sm" onclick="ccFanChatSend()">'+esc(T.fnSend)+'</button></div>';
  return chan(T.fnChatChan, '<div class="dc-chatlog">'+list+'</div><div class="dc-compose-dock">'+box+'</div>');
}

/* ---- Свой сервер: инвайты, поиск, настройки (его слово 21.11: «инвайтнуть можно будет, в самом дискорде поиск, и
   инвайтнуть можно людей ниже тебя рейтингом, сервер можно переименовать и аватарку другую поставить») ------------
   Каналы раздела «Сервер» на своём сервере (data-kind="tool"): «пригласить» - поиск по нику среди игроков региона
   (careerDuoSearchPool, тот же список, что поиск дуо), звать можно только тех, у кого рейтинг ниже твоего, и они
   заходят сразу; «настройки» - имя сервера и аватарка (скин Fortnite, фото карточки или своя картинка, ужатая как
   фото карьеры ccPhotoShrink). Позванные - в колонке участников и иногда отвечают в #chat своим ником и фото. */
// Лимиты подняты по его «инвайтить слишком мало людей я могу»: до 100 на сервер, поиск показывает 60.
// 21.11 позже, его «больше список для инвайта, как для поиска тиммейтов»: до 200 строк, регион и сортировка (ccInvCtrlHTML).
const CC_FAN_GUESTS_MAX=100, CC_FAN_FIND_MAX=200, CC_FAN_GUEST_REPLY=0.5;
/* Список приглашений как поиск тиммейтов: регион (все регионы года, как ccDuoFindReg), сортировка «ближе к моему
   рейтингу» / «по рейтингу», флаг страны и клуб в строке. Правило то же: только рейтинг ниже твоего. */
let CC_INV_REG='', CC_INV_SORT='near';
function ccInvPool(){
  const keep=CC_DUO_REG; let pool=[];
  CC_DUO_REG=CC_INV_REG||'';
  try{ pool=careerDuoSearchPool(true)||[]; }catch(e){} finally{ CC_DUO_REG=keep; }
  return pool;
}
function ccInvSet(reg, sort){ if(reg!=null) CC_INV_REG=String(reg); if(sort) CC_INV_SORT=sort; careerRenderHub('discord'); }
function ccInvCtrlHTML(){
  const T=L(), own=ccCareerRegion(), cur=CC_INV_REG||own;
  const regs=(typeof ccYearRegions==='function' ? ccYearRegions() : CC_REGIONS)||CC_REGIONS;
  return '<div class="inv-ctrl"><div class="inv-regs">'+regs.map(r=>'<button type="button" class="dc-btn ghost sm'+(r===cur ? ' on' : '')+'" onclick="ccInvSet(\''+r+'\')">'+esc(regionName(r))+'</button>').join('')+'</div>'+
    '<div class="inv-sort">'+[['near', T.ccDuoSortNear], ['ovr', T.ccDuoSortOvr]].map(([k, t])=>'<button type="button" class="dc-btn ghost sm'+(CC_INV_SORT===k ? ' on' : '')+'" onclick="ccInvSet(null,\''+k+'\')">'+esc(t||k)+'</button>').join('')+'</div></div>';
}
function ccInvRowsHTML(pool, q, fn, full){
  const T=L(); q=String(q||'').trim().toLowerCase();
  const me=ccFanMyOvr();
  let list=pool.filter(w=>!q || String(w.handle).toLowerCase().indexOf(q)>=0);
  list.sort(CC_INV_SORT==='ovr' ? (a,b)=>b.ovr-a.ovr : (a,b)=>Math.abs(a.ovr-me)-Math.abs(b.ovr-me) || b.ovr-a.ovr);
  const total=list.length; list=list.slice(0, CC_FAN_FIND_MAX);
  if(!list.length) return '<p class="dc-sub">'+esc(T.fnFindNone)+'</p>';
  return '<p class="dc-sub">'+esc(T.invShown(list.length, total))+'</p>'+list.map(w=>{
    let f=''; try{ f=w.card ? (photoURL(w.card)||'') : ''; }catch(e){}
    const fb=String(w.handle).slice(0, 2).toUpperCase();
    let nat=''; try{ nat=ccDuoNatCode(w)||''; }catch(e){}
    const sub=[w.role ? (T[w.role]||'') : '', w.club ? esc(w.club) : ''].filter(Boolean).join(' · ');
    return '<div class="cr-mem st-on"><span class="dc-av">'+(f ? ccDcImg(f, fb) : esc(fb))+'</span>'+
      '<div class="cr-who"><b>'+(nat ? '<img class="inv-flag" src="flags/w20/'+esc(nat)+'.png" alt="" onerror="this.remove()">' : '')+esc(ccHandle(w.handle))+' <em>'+Math.round(w.ovr)+'</em></b>'+
        (sub ? '<span>'+sub+'</span>' : '')+'</div>'+
      '<div class="cr-btns"><button class="dc-btn sm"'+(full ? ' disabled' : '')+' onclick="'+fn+'(\''+jsq(w.handle)+'\')">'+esc(T.fnInviteBtn)+'</button></div></div>';
  }).join('');
}
function ccFanGuests(){ const f=ccFans(); if(!f) return []; f.guests=f.guests||[]; return f.guests; }
function ccFanMyOvr(){ const pl=CAREER.player; return Math.round(pl.ovrExact!=null ? pl.ovrExact : pl.ovr); }
// anyServer - для тусовки: гости своего фан-сервера там не вычитаются.
function ccFanFindPool(anyServer){
  const pool=ccInvPool();
  const me=ccFanMyOvr(), inSrv=new Set(anyServer ? [] : ccFanGuests().map(g=>hKey(g.handle)));
  return pool.filter(w=>w && w.handle && Math.round(w.ovr)<me && !inSrv.has(hKey(w.handle)));
}
function ccFanFindRows(q){ return ccInvRowsHTML(ccFanFindPool(), q, 'ccFanInvite', ccFanGuests().length>=CC_FAN_GUESTS_MAX); }
// Поиск перерисовывает только список: поле ввода остаётся в фокусе.
function ccFanFind(q){ CC_FAN_FIND_Q=String(q||''); const el=document.getElementById('ccFanFindList'); if(el) el.innerHTML=ccFanFindRows(q); }
let CC_FAN_FIND_Q='';
function ccFanInvite(handle){
  const f=ccFans(); if(!f) return;
  const g=ccFanGuests(); if(g.length>=CC_FAN_GUESTS_MAX) return;
  const w=ccFanFindPool().find(x=>hKey(x.handle)===hKey(handle)); if(!w) return;
  g.push({handle:w.handle, ovr:Math.round(w.ovr), since:careerToday()});
  f.last={day:careerToday(), text:L().fnJoined(ccHandle(w.handle))};
  careerSave(); careerRenderHub('discord');
  const inp=document.getElementById('ccFanFindIn'); if(inp){ inp.value=CC_FAN_FIND_Q; ccFanFind(CC_FAN_FIND_Q); }
}
function ccFanKick(handle){
  const f=ccFans(); if(!f) return;
  f.guests=ccFanGuests().filter(g=>hKey(g.handle)!==hKey(handle));
  f.last={day:careerToday(), text:L().dcKicked(ccHandle(handle))};
  careerSave(); careerRenderHub('discord');
}
function ccFanGuestFace(g){ try{ const c=ccFriendCard(g.handle); return c ? (photoURL(c)||'') : ''; }catch(e){ return ''; } }
function ccFanGuestAv(g){ const f=ccFanGuestFace(g), fb=String(g.handle).slice(0, 2).toUpperCase(); return f ? ccDcImg(f, fb) : esc(fb); }
function ccFanInviteHTML(chan){
  const T=L(), full=ccFanGuests().length>=CC_FAN_GUESTS_MAX;
  return chan(T.fnInviteChan, '<p class="dc-sub">'+esc(T.fnInviteTxt(ccFanMyOvr(), CC_FAN_GUESTS_MAX))+'</p>'+
    '<div class="dc-compose dc-find"><input id="ccFanFindIn" type="search" autocomplete="off" value="'+esc(CC_FAN_FIND_Q)+'" '+
      'placeholder="'+esc(T.fnFindPh)+'" aria-label="'+esc(T.fnFindPh)+'" oninput="ccFanFind(this.value)"></div>'+
    ccInvCtrlHTML()+
    (full ? '<div class="dc-why">'+esc(T.fnFull(CC_FAN_GUESTS_MAX))+'</div>' : '')+
    '<div id="ccFanFindList" class="fn-find">'+ccFanFindRows(CC_FAN_FIND_Q)+'</div>', 'tool');
}
function ccFanMembersHTML(chan){
  const T=L(), g=ccFanGuests(), f=ccFans();
  const last=f.last && f.last.day===careerToday() ? '<div class="dc-res">'+esc(f.last.text)+'</div>' : '';
  // Гости «в сети» - от дня и ника (как в тусовке), строка раскрывает «Kick» по нажатию (ccMemToggle).
  const isOn=x=>careerRng(ccHashStr('fanon|'+careerToday()+'|'+hKey(x.handle)))()<0.6;
  const row=x=>'<div class="cr-mem cr-fold '+(isOn(x) ? 'st-on' : 'st-off')+'"><span class="dc-av">'+ccFanGuestAv(x)+'<i class="cr-dot" aria-hidden="true"></i></span>'+
    '<button type="button" class="cr-who" onclick="ccMemToggle(this)" aria-expanded="false"><b>'+esc(ccHandle(x.handle))+' <em>'+x.ovr+'</em></b><span>'+esc(T.fnGuest)+'</span></button>'+
    '<div class="cr-btns"><button class="dc-btn ghost sm dc-kick" onclick="ccFanKick(\''+jsq(x.handle)+'\')">'+esc(T.dcKick)+'</button></div></div>';
  const rows=g.length ? ccMemGroups(g, row, isOn) : '';
  return chan(T.crMembers+' · '+(g.length+ccFanMembers()), last+rows+
    '<p class="dc-sub fn-fans">'+esc(T.fnFansN(ccNum(ccFanMembers())))+'</p>', 'members');
}
// ---- Настройки: имя и аватарка.
function ccFanIcon(){
  const f=ccFans(), i=f && f.icon;
  if(i && i.t==='img' && i.d) return ccDcImg(i.d, '★');
  if(i && i.t==='skin' && i.id) return ccDcImg(ccFnImg(i.id, true), '★');
  const face=ccDcFace(); return face ? ccDcImg(face, '★') : '★';
}
function ccFanRename(){
  const f=ccFans(); const inp=document.getElementById('ccFanRenameIn'); if(!f || !inp) return;
  const name=String(inp.value||'').replace(/[<>]/g, '').trim().slice(0, 32); if(!name) return;
  f.name=name; careerSave(); careerRenderHub('discord');
}
function ccFanIconSet(kind, id){
  const f=ccFans(); if(!f) return;
  f.icon=kind==='skin' ? {t:'skin', id:String(id)} : null;
  careerSave(); careerRenderHub('discord');
}
function ccFanIconUpload(input){
  const file=input && input.files && input.files[0]; if(!file || !ccFans()) return;
  const r=new FileReader();
  r.onload=()=>{ ccPhotoShrink(String(r.result||''), function(url){ const f=ccFans(); if(!f) return; f.icon={t:'img', d:url}; careerSave(); careerRenderHub('discord'); }); };
  r.readAsDataURL(file);
  input.value='';
}
function ccFanSettingsHTML(chan){
  const T=L(), f=ccFans();
  let skins=null; try{ skins=ccFnSkinPool(); }catch(e){}
  if(!skins){ try{ ccFnShopLoad(()=>{ if(CH_TAB==='discord' && CH_DC==='own') careerRenderHub('discord'); }); }catch(e){} }
  const pick=(skins||[]).slice(-24).reverse();
  const cur=f.icon && f.icon.t==='skin' ? f.icon.id : null;
  return chan(T.fnSettingsChan,
    '<div class="fn-set"><span class="fn-set-ic dc-srv">'+ccFanIcon()+'</span>'+
      '<div class="dc-compose"><input id="ccFanRenameIn" maxlength="32" value="'+esc(f.name)+'" aria-label="'+esc(T.fnNameLabel)+'">'+
      '<button type="button" class="dc-btn sm" onclick="ccFanRename()">'+esc(T.fnSave)+'</button></div></div>'+
    '<div class="dc-cat">'+esc(T.fnIconT)+'</div>'+
    '<div class="fn-icons">'+
      '<button type="button" class="fn-ic'+(!f.icon ? ' on' : '')+'" onclick="ccFanIconSet(\'face\')" title="'+esc(T.fnIconFace)+'">'+(ccDcFace() ? ccDcImg(ccDcFace(), '★') : '★')+'</button>'+
      '<label class="fn-ic fn-ic-up'+(f.icon && f.icon.t==='img' ? ' on' : '')+'" title="'+esc(T.fnIconUp)+'">'+(f.icon && f.icon.t==='img' ? ccDcImg(f.icon.d, '+') : '+')+
        '<input type="file" accept="image/*" hidden onchange="ccFanIconUpload(this)"></label>'+
      pick.map(id=>'<button type="button" class="fn-ic'+(cur===id ? ' on' : '')+'" onclick="ccFanIconSet(\'skin\',\''+jsq(id)+'\')">'+ccDcImg(ccFnImg(id, true), '·')+'</button>').join('')+
    '</div>', 'tool');
}

/* ---- Тусовка: #результаты и #ищу-напарника (его «больше чатов, и пусть диалоги не нпс будут: троллинг над
   результатами или наоборот похвала») ---------------------------------------------------------------------------
   #результаты: про твой последний турнир за три дня пишут двое-трое, тон от отношения и места (друг хвалит или
   поддерживает, малознакомый подкалывает); про победителей турниров мира за три дня (лента ccNewsWorldWon) -
   поздравляют или ворчат «опять он». На самую злую подколку можно ответить один раз в день: огрызнуться (с тем,
   кто подколол, отношение падает), посмеяться вместе (растёт) или промолчать.
   #ищу-напарника: двое-трое из тусовки ищут состав на ближайший турнир с порогом рейтинга; кнопка «написать» -
   то же предложение в личку (careerDmWrite), только если в сезоне есть места. */
const CC_CREW_BACK={b1:-2, b2:3, b3:0};
function ccCrewResults(members){
  const T=L(), today=careerToday(), cr=CAREER.career, rnd=careerRng(ccHashStr('crewres|'+today));
  const on=members.filter(m=>ccCrewStatus(m)!=='off'); if(!on.length) return {lines:[], troll:null};
  const pick=()=>on[Math.floor(rnd()*on.length)];
  const lines=[]; let troll=null;
  const nick=CAREER.player.nick||'';
  const last=(cr.log||[]).filter(x=>x && x.place && x.day).slice(-1)[0];
  if(last && ccDaysBetween(last.day, today)<=3){
    const of=last.of||100, p=last.place, good=p<=Math.max(3, Math.ceil(of*0.1)), bad=p>Math.ceil(of*0.5);
    const ev=last.kind==='cup' ? T.ccCupLive : ((careerYearDays().get(last.day)||[]).find(x=>x.kind===last.kind)||{}).label || T.fnTheCup;
    const who=[]; while(who.length<Math.min(3, on.length)){ const m=pick(); if(who.indexOf(m)<0) who.push(m); }
    who.forEach((m, i)=>{
      const rel=ccCrewRel(m), mean=rel<25;
      const set=good ? (mean ? 'crResGt' : 'crResG') : bad ? (mean ? 'crResB' : 'crResBk') : (mean ? 'crResMt' : 'crResM');
      const n={crResG:4, crResGt:2, crResB:4, crResBk:2, crResM:2, crResMt:2}[set];
      const line={m:m, text:T[set+(1+Math.floor(rnd()*n))](nick, p, ev)};
      lines.push(line);
      if(mean && !troll && (set==='crResB' || set==='crResMt' || set==='crResGt')) troll=line;
    });
  }
  // Победители мира за три дня.
  (cr.news||[]).filter(x=>x && x.k==='ccNewsWorldWon' && x.day && ccDaysBetween(x.day, today)<=3).slice(0, 2).forEach(x=>{
    const ev=String((x.a||[])[0]||''), w=String((x.a||[])[1]||'').replace(/<[^>]+>/g, '');
    if(!w) return;
    lines.push({m:pick(), text:rnd()<0.6 ? T.crResW1(w, ev) : T.crResW2(w, ev)});
  });
  return {lines:lines, troll:troll};
}
function ccCrewBack(opt){
  const c=ccCrew(), today=careerToday();
  if(c.back && c.back.day===today) return;
  if(!(opt in CC_CREW_BACK)) return;
  const r=ccCrewResults(ccCrewMembers()); if(!r.troll) return;
  ccCrewRelAdd(r.troll.m, CC_CREW_BACK[opt]);
  c.back={day:today, opt:opt};
  careerSave(); careerRenderHub('discord');
}
function ccCrewResultsHTML(chan, msg, members){
  const T=L(), c=ccCrew(), today=careerToday(), r=ccCrewResults(members);
  let html=r.lines.map(l=>msg(ccHandle(l.m.handle), false, '<p>'+esc(l.text)+'</p>', ccCrewAv(l.m))).join('');
  if(r.troll){
    const done=c.back && c.back.day===today ? c.back.opt : null;
    html+=done ? (done!=='b3' ? msg(CAREER.player.nick, false, '<p>'+esc('@'+ccHandle(r.troll.m.handle)+' '+T['crRb'+done.slice(1)])+'</p>') : '')
      : '<div class="cr-replies">'+['b1','b2','b3'].map(o=>'<button class="dc-btn ghost sm" onclick="ccCrewBack(\''+o+'\')">'+esc(T['crRb'+o.slice(1)])+'</button>').join('')+'</div>';
  }
  if(!html) html='<p class="dc-sub">'+esc(T.crResNone)+'</p>';
  return chan(T.crResChan, html);
}
function ccCrewLfgHTML(chan, msg, members){
  const T=L(), today=careerToday(), rnd=careerRng(ccHashStr('crewlfg|'+today));
  let next=null; try{ next=careerNext(); }catch(e){}
  const ev=next && next.type!=='free' ? (next.type==='cup' ? T.ccCupLive : (next.title||next.label||'')) : '';
  const on=members.filter(m=>m.kind!=='mate' && ccCrewStatus(m)!=='off');
  const seats=careerMateSeats();
  if(seats<=0) return '';   // соло-сезон: искать некого
  const fmt=seats>=3 ? T.crFmtQ : seats===2 ? T.crFmtT : T.crFmtD;
  const n=Math.min(3, on.length), used=new Set(), lines=[];
  for(let i=0;i<n;i++){ const m=on[Math.floor(rnd()*on.length)]; if(used.has(m.k)) continue; used.add(m.k);
    const min=Math.max(40, Math.round(m.ovr-4-rnd()*6));
    lines.push(msg(ccHandle(m.handle), false, '<p>'+esc(ev ? T.crLfg1(fmt, ev, min) : T.crLfg2(fmt, min))+'</p>'+
      (seats>0 && !(typeof ccMpOn==='function' && ccMpOn()) ? '<div class="dc-act"><button class="dc-btn ghost sm" onclick="ccCrewDuo(\''+jsq(m.k)+'\')">'+esc(T[ccSquadKey('dmAskBtn')]||T.crDuo)+'</button></div>' : ''),
      ccCrewAv(m)));
  }
  return chan(T.crLfgChan, lines.join('') || '<p class="dc-sub">'+esc(T.crResNone)+'</p>');
}

/* Голосовой канал своего сервера (его «больше голосовых каналов»): hangout, где сидят часть приглашённых и несколько
   фанатов (от дня); зайти можно бесплатно, раз в день - ты в списке. На игру не влияет. */
function ccFanVcJoin(){ const f=ccFans(); if(!f) return; f.vc=careerToday(); careerSave(); careerRenderHub('discord'); }
function ccFanVoiceHTML(chan){
  const T=L(), f=ccFans(), today=careerToday(), rnd=careerRng(ccHashStr('fanvc|'+today));
  const gs=ccFanGuests().filter(g=>careerRng(ccHashStr('fanvcg|'+today+'|'+hKey(g.handle)))()<0.4);
  const fans=[]; const nf=1+Math.floor(rnd()*Math.min(4, ccFanVoices()+1)); for(let i=0;i<nf;i++) fans.push(ccFanNick('vc|'+today+'|'+i));
  const here=f.vc===today;
  const vm=(av, name)=>'<span class="cr-vm" title="'+esc(name)+'"><span class="dc-av">'+av+'</span><i>'+esc(name)+'</i></span>';
  const list=(here ? vm(ccDcFace() ? ccDcImg(ccDcFace(), 'ME') : 'ME', CAREER.player.nick||'') : '')+
    gs.map(g=>vm(ccFanGuestAv(g), ccHandle(g.handle))).join('')+fans.map(n=>vm(ccFanAv(n), n)).join('');
  return chan(T.fnVcChan, '<div class="cr-voice">'+list+'</div>'+
    '<div class="dc-act"><button class="dc-btn'+(here ? ' ghost' : '')+'"'+(here ? ' disabled' : '')+' onclick="ccFanVcJoin()">'+esc(here ? T.crVoiceIn : T.crVoiceJoin)+'</button></div>', 'voice');
}

/* Список участников как в Discord: «в сети» и «не в сети» группами, вторая свёрнута (details); строка раскрывает
   свои кнопки по нажатию, открыта одна строка за раз. */
function ccMemToggle(btn){
  const row=btn && btn.closest('.cr-mem'); if(!row) return;
  const open=!row.classList.contains('open');
  const box=row.closest('.dc-chan');
  if(box) box.querySelectorAll('.cr-mem.open').forEach(r=>{ if(r!==row){ r.classList.remove('open'); const b=r.querySelector('.cr-who'); if(b) b.setAttribute('aria-expanded', 'false'); } });
  row.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function ccMemGroups(list, row, isOn){
  const T=L(), on=list.filter(isOn), off=list.filter(m=>!isOn(m));
  return (on.length ? '<div class="cr-grp">'+esc(T.crGrpOn(on.length))+'</div>'+on.map(row).join('') : '')+
    (off.length ? '<details class="cr-off"><summary class="cr-grp">'+esc(T.crGrpOff(off.length))+'</summary>'+off.map(row).join('')+'</details>' : '');
}

/* Позвать на турнир (его слово 21.11: «когда скин кап, позвать кого-то, или на другой регион див кап сыграть»).
   Скин-кап - кап другого формата, чем сезон, в ближайшую неделю (как ccRosterSoon): согласился - встаёт в состав
   этого формата (CAREER.rosters[fmt], как выбор в ccEventRosterPick), и окно «с кем идёшь» его уже не спрашивает.
   Выезд - кап дивизиона сегодня в другом регионе: согласился - сидит в первом кресле на этот вечер (cr.awayMate,
   ccAwayPlay), свой состав возвращается после вечера; если выезд уже открыт - сразу играется. Согласие - то же, что
   «поиграть вместе» (ccCrewYes); позвать человека можно раз в день. Нужна карточка человека (у выдуманных без неё нет). */
function ccCrewCups(){
  if(!CAREER || (typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRacePairOn==='function' && ccRacePairOn())) return [];
  const base=careerSquadSize(), today=careerToday(), out=[];
  for(let k=0; k<=7 && out.length<2; k++){
    const day=ccAddDays(today, k); let ev=null;
    try{ ev=careerVictoryOn(day); }catch(e){}
    if(!ev || ((ev.invite || ev.ewc24) && !ccVictoryInvited(ev))) continue;
    const fmt=ccPickFormat(ev);
    if(!fmt || fmt===1 || fmt===base) continue;
    out.push({ev:ev, day:day, fmt:fmt});
  }
  return out;
}
function ccCrewAwayRegs(){
  if(!CAREER || careerMateSeats()<=0 || (typeof ccMpOn==='function' && ccMpOn())) return [];
  const home=ccCareerRegion(), day=careerToday();
  return CC_REGIONS.filter(r=>r!==home && ccAwayKind(r, day)==='cup' && ['', 'mate', 'later'].indexOf(ccAwayWhy(r, day))>=0);
}
function ccCrewRec(m){ return m.card ? {card:{...m.card}, patience:CAREER_PATIENCE_START, since:careerToday()} : null; }
// Общий шаг приглашения на турнир: согласие и отметка «звал сегодня». true - согласился.
function ccCrewAsk(m){
  const c=ccCrew(), T=L(), today=careerToday(), invited=ccCrewInvited(m);
  if(!c.inv || c.inv.day!==today) c.inv={day:today, who:[]};
  c.inv.who.push(m.k);
  if(!invited && !ccCrewYes(m)){ ccCrewRelAdd(m, -1); c.last={day:today, text:T.crNo(ccHandle(m.handle))}; return false; }
  ccCrewRelAdd(m, 4);
  return true;
}
function ccCrewCup(k, i){
  const m=ccCrewFind(k), cup=ccCrewCups()[i|0]; if(!m || !cup || !m.card) return;
  const st=ccCrewStatus(m); if(!ccCrewInvited(m) && (st==='off' || ccCrewAskedToday(m))) return;
  const T=L(), c=ccCrew(), cr=CAREER.career;
  if(ccCrewAsk(m)){
    const hOf=r=>(ccMateCardOf(r)||{}).handle||'';
    const own=ccFmtRoster(cup.fmt).filter(r=>hKey(hOf(r))!==m.k);
    CAREER.rosters=CAREER.rosters||{};
    CAREER.rosters[cup.fmt]=[ccCrewRec(m)].concat(own).slice(0, cup.fmt-1);
    if(CAREER.rosters[cup.fmt].length>=cup.fmt-1){ cr.evPicked=cr.evPicked||{}; cr.evPicked[String(cup.ev.id||cup.ev.name||'')+'|'+(cr.season||0)]=1; }
    c.last={day:careerToday(), text:T.crCupYes(ccHandle(m.handle), cup.ev.name||'', ccDayLabel(cup.day))};
  }
  careerSave(); careerRenderHub('discord');
}
function ccCrewAway(k, reg){
  const m=ccCrewFind(k); if(!m || !m.card || ccCrewAwayRegs().indexOf(reg)<0) return;
  const st=ccCrewStatus(m); if(!ccCrewInvited(m) && (st==='off' || ccCrewAskedToday(m))) return;
  const T=L(), c=ccCrew(), cr=CAREER.career;
  if(!ccCrewAsk(m)){ careerSave(); careerRenderHub('discord'); return; }
  cr.awayMate={reg:reg, day:careerToday(), rec:ccCrewRec(m)};
  const why=ccAwayWhy(reg);
  c.last={day:careerToday(), text:why ? T.crAwayLater(ccHandle(m.handle), regionName(reg)) : T.crAwayGo(ccHandle(m.handle), regionName(reg))};
  careerSave(); careerRenderHub('discord');
  if(!why) ccAwayPlay(reg);
}
// Кнопки «позвать на турнир» в раскрытой строке участника.
function ccCrewEventBtns(m, why){
  if(!m.card || m.kind==='mate') return '';
  const T=L(), cups=ccCrewCups(), regs=ccCrewAwayRegs();
  if(!cups.length && !regs.length) return '';
  const off=why || ccCrewStatus(m)==='game';
  return '<span class="cr-modes-l">'+esc(T.crCallTo)+':</span>'+
    cups.map((cu, i)=>'<button class="dc-btn ghost sm"'+(off ? ' disabled' : '')+' onclick="ccCrewCup(\''+jsq(m.k)+'\','+i+')">'+esc((cu.ev.name||'')+' · '+ccDayLabel(cu.day))+'</button>').join('')+
    regs.map(r=>'<button class="dc-btn ghost sm"'+(off ? ' disabled' : '')+' onclick="ccCrewAway(\''+jsq(m.k)+'\',\''+r+'\')">'+esc(T.ccCupLive+' · '+regionName(r))+'</button>').join('');
}

/* ---- Чат тусовки: диалоги и свои сообщения (его слово 21.11: «диалоги в чат добавить бы и выбор для отправки
   сообщения») ------------------------------------------------------------------------------------------------
   Лента #general хранится (cr.crew.chat, последние CC_CREW_CHAT_KEEP). Раз в день, когда открыт сервер, в неё
   приходят 1-2 коротких разговора участников по три реплики (ccCrewChatTick): договориться о скримах, спор о мете,
   ищу дуо, кто выиграл турнир (лента ccNewsWorldWon). Свои сообщения - полем ввода или быстрыми фразами (выбор);
   отвечают 1-2 человека по смыслу: скримы и ранкед, вопрос, хайп, остальное; упомянул @ника - отвечает он.
   На игру не влияет, кроме +1 к отношению у ответивших (раз в день). Текст игрока выводится только через esc(). */
const CC_CREW_CHAT_KEEP=40, CC_CREW_DLG=6;
function ccCrewChatLog(){ const c=ccCrew(); c.chat=c.chat||[]; return c.chat; }
const CC_CREW_NP=[
  {lines:[['1a',0], ['1b',1], ['1c',0]]},
  {three:true, lines:[['2a',0], ['2b',1], ['2c',2]]},
  {ev:true, lines:[['3a',0], ['3b',1]]},
  {lines:[['4a',0], ['4b',1], ['4c',1]]},
  {lines:[['5a',0], ['5b',1]]},
  {lines:[['6a',0], ['6b',1]]},
  {three:true, lines:[['7a',0], ['7b',1], ['7c',0], ['7d',2]]}
];
// @ник в тексте - подсвеченное упоминание, как в Discord. Текст уже экранирован.
function ccDcAt(html){ return String(html).replace(/@([A-Za-z0-9_.]+)/g, '<span class="dc-at">@$1</span>'); }
function ccCrewChatTick(members){
  const c=ccCrew(), day=careerToday(); if(c.chatDay===day) return;
  c.chatDay=day;
  const T=L(), on=members.filter(m=>ccCrewStatus(m)!=='off'); if(on.length<2) return;
  const r=careerRng(ccHashStr('crewdlg|'+day)), log=ccCrewChatLog();
  let next=null; try{ next=careerNext(); }catch(e){}
  const ev=next && next.type!=='free' ? (next.type==='cup' ? T.ccCupLive : (next.title||next.label||'')) : '';
  const won=(CAREER.career.news||[]).find(x=>x && x.k==='ccNewsWorldWon' && x.day && ccDaysBetween(x.day, day)<=3);
  const w=won ? String((won.a||[])[1]||'').replace(/<[^>]+>/g, '') : '', wev=won ? String((won.a||[])[0]||'') : '';
  const pool=[]; for(let i=1;i<=CC_CREW_DLG;i++){ if(i===2 && !w) continue; if(i===4 && !ev) continue; pool.push(i); }
  const n=Math.min(pool.length, 1+(r()<0.6 ? 1 : 0));
  for(let d=0; d<n; d++){
    const id=pool.splice(Math.floor(r()*pool.length), 1)[0];
    const a=on[Math.floor(r()*on.length)]; let b=on[Math.floor(r()*on.length)]; if(b===a) b=on[(on.indexOf(a)+1)%on.length];
    const lines=T['crDlg'+id](ev, w, wev, Math.max(40, Math.round(a.ovr-5)));
    lines.forEach((t, i)=>log.push({h:(i%2 ? b : a).handle, t:t, d:day}));
  }
  /* Тебя тегают (его «больше выбора общения, чтоб тегали и игроки сами чет предлагали»): предложение поиграть - кто-то
     из свободных зовёт в режим, где сегодня можно играть (ccCrewWhy), согласие сразу ведёт в игру с ним; и вопрос с двумя
     ответами или молчанием. Броски - от дня, как и весь чат. */
  /* Новости сцены в тусовке (его «про подписания в оргу писать в дс, поздравлять, или про новые дуо трио»): за три
     дня - твоё подписание (поздравляют с тегом), твой распад пары и новые составы сцены. Каждая новость - один раз
     (c.nwSeen: день|ключ|первый аргумент). */
  try{
    const seen=c.nwSeen=(c.nwSeen||[]).slice(-60), nick0=CAREER.player.nick||'';
    const fresh=(CAREER.career.news||[]).filter(x=>x && x.k && x.day && ccDaysBetween(x.day, day)<=3 && x.day<=day).slice(0, 12);
    let said=0;
    fresh.forEach(x=>{
      if(said>=2) return;
      const id=x.day+'|'+x.k+'|'+String((x.a||[])[0]||''); if(seen.indexOf(id)>=0) return;
      const a=on[Math.floor(r()*on.length)]; let b=on[Math.floor(r()*on.length)]; if(b===a) b=on[(on.indexOf(a)+1)%on.length];
      const clean=v=>String(v||'').replace(/<[^>]+>/g, '');
      if(/^ccNewsSigned/.test(x.k)){
        const org=clean((x.a||[])[0]);
        log.push({h:a.handle, t:T.crNwSign1(nick0, org), d:day});
        log.push({h:b.handle, t:(r()<0.5 ? T.crNwSign2 : T.crNwSign3)(nick0, org), d:day});
      } else if(/^ccNewsSceneDuo/.test(x.k)){
        log.push({h:a.handle, t:T.crNwDuo1('@'+ccHandle(clean((x.a||[])[0])), clean((x.a||[])[1])), d:day});
        log.push({h:b.handle, t:T.crNwDuo2('', ''), d:day});
      } else if(/^ccNewsDuoSplit/.test(x.k)){
        log.push({h:a.handle, t:T.crNwSplit(nick0, clean((x.a||[])[0])), d:day});
      } else return;
      seen.push(id); said++;
    });
  }catch(e){}
  /* Игроки друг с другом (его «пусть игроки друг друга тегают и играют, чтоб дискорд живым выглядел»): 2-3 разговора
     в день из CC_CREW_NP - зовут на бокс-файты и пишут счёт, собирают зон-варс, ищут дуо на турнир, подкалывают,
     просят глянуть вод. Строки crNp<номер><буква>, говорящий - 0/1/2 (A/B/C). */
  if(on.length>=2){
    const np=CC_CREW_NP.filter(d=>(!d.ev || ev) && (!d.three || on.length>=3)).slice();
    const k=Math.min(np.length, 2+(r()<0.5 ? 1 : 0));
    for(let d=0; d<k; d++){
      const dl=np.splice(Math.floor(r()*np.length), 1)[0];
      const ppl=on.slice(); const A=ppl.splice(Math.floor(r()*ppl.length), 1)[0], B=ppl.splice(Math.floor(r()*ppl.length), 1)[0];
      const C=ppl.length ? ppl[Math.floor(r()*ppl.length)] : B;
      const who=[A, B, C], hs=who.map(m=>ccHandle(m.handle));
      const win=r()<0.5, lose=Math.floor(r()*5), x=dl.ev ? ev : (win ? 5 : lose), y=win ? lose : 5;
      dl.lines.forEach(([id, sp])=>log.push({h:who[sp].handle, t:T['crNp'+id](hs[0], hs[1], hs[2], x, y), d:day}));
    }
  }
  const nick=CAREER.player.nick||'', free=on.filter(m=>ccCrewStatus(m)!=='game' && m.kind!=='mate');
  if(free.length && r()<0.65){
    const m=free[Math.floor(r()*free.length)];
    const modes=['box', 'zw', 'rk', 'nb'].filter(md=>!ccCrewWhy(m, md));
    if(modes.length){ const md=modes[Math.floor(r()*modes.length)];
      const t=md==='box' ? T.crOfBox(nick) : md==='zw' ? T.crOfZw(nick) : md==='rk' ? T.crOfRk(nick) : T.crOfNb(nick, ccPracSrv());
      log.push({h:m.handle, t:t, d:day, offer:md}); }
  }
  if(r()<0.5){
    const m=on[Math.floor(r()*on.length)], qn=1+Math.floor(r()*3);
    log.push({h:m.handle, t:T['crQ'+qn](nick), d:day, q:qn});
  }
  while(log.length>CC_CREW_CHAT_KEEP) log.shift();
  careerSave();
}
// Ответ на предложение из чата: да - он уже договорился, играете сразу (ccCrewPlay); нет - он отвечает «ок».
function ccCrewOffer(i, yes){
  const log=ccCrewChatLog(), x=log[i], day=careerToday(); if(!x || !x.offer || x.d!==day || x.done) return;
  const m=ccCrewMembers().find(mm=>hKey(mm.handle)===hKey(x.h)); if(!m) return;
  const c=ccCrew();
  if(yes){
    if(ccCrewWhy(m, x.offer)) return;
    x.done='yes'; c.offerYes={day:day, k:m.k};
    log.push({me:1, t:L().crOfYes, d:day});
    ccCrewPlay(m.k, x.offer);
    return;
  }
  x.done='no';
  log.push({me:1, t:L().crOfNo, d:day}); log.push({h:x.h, t:L().crOfNp, d:day});
  while(log.length>CC_CREW_CHAT_KEEP) log.shift();
  careerSave(); careerRenderHub('discord');
}
// Ответ на вопрос: развёрнутый ответ - знакомство +2, короткий +1, молчание -1.
function ccCrewAnswer(i, opt){
  if(typeof opt==='number') opt=String.fromCharCode(opt);
  const log=ccCrewChatLog(), x=log[i], day=careerToday(); if(!x || !x.q || x.d!==day || x.done) return;
  const m=ccCrewMembers().find(mm=>hKey(mm.handle)===hKey(x.h));
  x.done=opt;
  if(opt!=='n') log.push({me:1, t:L()['crQ'+x.q+opt], d:day});
  if(m) ccCrewRelAdd(m, opt==='a' ? 2 : opt==='b' ? 1 : -1);
  while(log.length>CC_CREW_CHAT_KEEP) log.shift();
  careerSave(); careerRenderHub('discord');
}
function ccCrewSayKind(text){
  const t=String(text||'').toLowerCase();
  if(/scrim|скрим|ranked|ранкед|ranq|box|zone ?wars|зон|1v1|duo|дуо|play|поигр|jouer|giocare|jogar|spielen|jugar/.test(t)) return 'S';
  if(/\?/.test(t)) return 'Q';
  if(/\bgg\b|win|won|выигр|побед|#1|go+|погнали|lets/.test(t)) return 'H';
  return 'G';
}
function ccCrewSay(text){
  text=String(text||'').replace(/\s+/g, ' ').trim().slice(0, 300); if(!text) return;
  const T=L(), c=ccCrew(), day=careerToday(), log=ccCrewChatLog(), members=ccCrewMembers();
  const on=members.filter(m=>ccCrewStatus(m)!=='off');
  // Одно и то же сообщение за день второй раз - спам: в ленте оно есть, но отвечать на него никто не будет, и знакомство не растёт.
  const again=log.some(x=>x.me && x.d===day && String(x.t).toLowerCase()===text.toLowerCase());
  log.push({me:1, t:text, d:day});
  const r=careerRng(ccHashStr('crewsay|'+day+'|'+log.length+'|'+text));
  // Упомянул @ника - отвечает он; иначе 1-2 человека в сети.
  const low=text.toLowerCase();
  const tagged=members.find(m=>low.indexOf('@'+String(ccHandle(m.handle)).toLowerCase())>=0);
  const who=[]; if(!again && tagged && ccCrewStatus(tagged)!=='off') who.push(tagged);
  while(!again && who.length<(tagged ? 1 : Math.min(2, on.length)) && on.length){ const m=on[Math.floor(r()*on.length)]; if(who.indexOf(m)<0) who.push(m); else break; }
  // «Отметили меня» - только если отвечает сам отмеченный; он не в сети - другие отвечают на смысл сообщения.
  const kind=(tagged && who[0]===tagged) ? 'M' : ccCrewSayKind(text), per={S:3, Q:4, H:3, G:5, M:3}[kind], used=[];
  who.forEach(m=>{
    let j=1+Math.floor(r()*per); while(used.indexOf(j)>=0 && used.length<per) j=j%per+1; used.push(j);
    log.push({h:m.handle, t:T['crR'+kind+j], d:day});
    if(!c.sayRel || c.sayRel.day!==day){ c.sayRel={day:day, who:[]}; }
    if(c.sayRel.who.indexOf(m.k)<0){ c.sayRel.who.push(m.k); ccCrewRelAdd(m, 1); }
  });
  while(log.length>CC_CREW_CHAT_KEEP) log.shift();
  CH_DCC.crew=T.crGeneral; CH_DCV='chan';
  careerSave(); careerRenderHub('discord');
  const inp=document.getElementById('ccCrewChatIn'); if(inp){ try{ inp.focus({preventScroll:true}); }catch(e){} }
}
function ccCrewSayInput(){ const inp=document.getElementById('ccCrewChatIn'); if(!inp) return; const v=inp.value; inp.value=''; ccCrewSay(v); }
function ccCrewSayKey(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); ccCrewSayInput(); } }
function ccCrewSayPick(i){
  const T=L(); let next=null; try{ next=careerNext(); }catch(e){}
  const ev=next && next.type!=='free' ? (next.type==='cup' ? T.ccCupLive : (next.title||next.label||'')) : '';
  const s=T['crS'+i]; if(!s || ccCrewChipUsed(i)) return;
  const c=ccCrew(), day=careerToday();
  if(!c.chips || c.chips.day!==day) c.chips={day:day, ids:[]};
  c.chips.ids.push(i);
  ccCrewSay(typeof s==='function' ? s(ev) : s);
}
// Заготовка - раз в день (его «могу несколько раз спамить каждую фразу»): отправленная пропадает до завтра.
function ccCrewChipUsed(i){ const c=ccCrew(), k=c && c.chips; return !!(k && k.day===careerToday() && k.ids.indexOf(i)>=0); }
// Лента и поле ввода для #general.
function ccCrewChatBoxHTML(msg, members){
  try{ ccCrewChatTick(members); }catch(e){}
  const T=L(), log=ccCrewChatLog();
  let next=null; try{ next=careerNext(); }catch(e){}
  const ev=next && next.type!=='free' ? 1 : 0;
  const byH=new Map(members.map(m=>[hKey(m.handle), m]));
  const today=careerToday();
  // Под сегодняшним предложением или вопросом с тегом - кнопки ответа, пока не ответил.
  const acts=(x, i)=>{
    if(x.d!==today || x.done) return '';
    if(x.offer){ const m=byH.get(hKey(x.h)), why=m ? ccCrewWhy(m, x.offer) : '';
      return '<div class="cr-replies"><button type="button" class="dc-btn sm"'+(why ? ' disabled title="'+esc(why)+'"' : '')+' onclick="ccCrewOffer('+i+',true)">'+esc(T.crOfYes)+' · '+esc(ccCrewModeName(x.offer))+'</button>'+
        '<button type="button" class="dc-btn ghost sm" onclick="ccCrewOffer('+i+',false)">'+esc(T.crOfNo)+'</button></div>'; }
    if(x.q) return '<div class="cr-replies">'+['a', 'b', 'n'].map(o=>'<button type="button" class="dc-btn ghost sm" onclick="ccCrewAnswer('+i+','+o.charCodeAt(0)+')">'+esc(o==='n' ? T.crQIgnore : T['crQ'+x.q+o])+'</button>').join('')+'</div>';
    return '';
  };
  const list=log.map((x, i)=>x.me ? msg(CAREER.player.nick, false, '<p>'+ccDcAt(esc(x.t))+'</p>')
    : (()=>{ const m=byH.get(hKey(x.h)); return msg(ccHandle(x.h), false, '<p'+(x.offer || x.q ? ' class="dc-ment"' : '')+'>'+ccDcAt(esc(x.t))+'</p>'+acts(x, i), m ? ccCrewAv(m) : esc(String(x.h).slice(0, 2).toUpperCase())); })()).join('');
  const chips=[1, 2, 3, ev ? 4 : 0, 5].filter(i=>i && !ccCrewChipUsed(i)).map(i=>{
    const s=T['crS'+i]; const txt=typeof s==='function' ? s(next ? (next.type==='cup' ? T.ccCupLive : (next.title||next.label||'')) : '') : s;
    return '<button type="button" class="dc-btn ghost sm" onclick="ccCrewSayPick('+i+')">'+esc(txt)+'</button>'; }).join('');
  return '<div class="dc-chatlog">'+list+'</div>'+
    '<div class="dc-compose-dock"><div class="cr-replies cr-chips">'+chips+'</div>'+
    '<div class="dc-compose"><input id="ccCrewChatIn" type="text" maxlength="300" autocomplete="off" placeholder="'+esc(T.fnChatPh(T.crGeneral))+'" '+
      'aria-label="'+esc(T.fnChatPh(T.crGeneral))+'" onkeydown="ccCrewSayKey(event)">'+
    '<button type="button" class="dc-btn sm" onclick="ccCrewSayInput()">'+esc(T.fnSend)+'</button></div></div>';
}
