/*@@PART js/home.js@@*/
/* ГЛАВНАЯ 15.10: «Продолжить» по сохранениям, «Сцена сейчас» по настоящему календарю 2026 и «Игроки сайта».
   Рисуется из ccHeroCareerText — то есть на загрузке, на смене языка и при каждом возврате на главную. */
let HOME_BOARD=null, HOME_BOARD_ALL=false, HOME_BOARD_SORT=null, HOME_BOARD_LIST=null;
function homeRender(){
  try{ homeDailyDraw(); }catch(e){}
  try{ homeSceneDraw(); }catch(e){}
  try{ homeTimerDraw(); }catch(e){}
  try{ homeBoardDraw(); }catch(e){}
  try{ homeRealDraw(); }catch(e){}
  try{ homeLiveTabs(); }catch(e){}
}
function homeDate(k, noYear){
  if(!k) return '';
  const o={day:'numeric', month:'short', timeZone:'UTC'}; if(!noYear) o.year='numeric';
  try{ return new Date(k+'T12:00:00Z').toLocaleDateString(LANG==='ru' ? 'ru-RU' : LANG, o); }catch(e){ return k; }
}
function homeToday(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
/* Только настоящие события Epic: Кубок наций — выдумка режима, Про-Амы в Париже и Сеуле — наши города (см. CAREER_YEAR). */
const HOME_SCENE_SKIP={ProAm_Paris:1, ProAm_Seoul:1};
/* Ближайшие призовые турниры не из календаря карьеры (16.10: «в расписании чёт мало турниров»). Источник — Liquipedia,
   Portal:Tournaments, все таблицы «Upcoming» (S/A/B, C, D, отборы, шоу-матчи), снято 16.10.2026; оставлены только с призовыми.
   Капы одной недели в разных регионах — одна строка (p: [[регион, $]…]). Финалы FNCS Solos отсюда дают фонды регионов,
   которых нет в CC_SOLOS_PRIZES-подписи (BR, ASIA, ME, OCE). Обновлять тем же запросом (api.php?action=parse&page=Portal:Tournaments). */
const HOME_SCHED_LQ=[{"n":"Exposing UNREAL Players Stats with Clix!","f":"2026-07-24","t":"2026-07-24","tier":"Show Matches","loc":"North America","p":[["",780,"Clix"]]},{"n":"Red Bull Reshuffle","f":"2026-08-15","t":"2026-08-15","tier":"Show Matches","loc":"Vienna","p":[["",57837,"Juu"]]},{"n":"Inoxtag BACK TO OG Invitational","f":"2026-10-24","t":"2026-10-24","tier":"Show Matches","loc":"Paris","p":[["",112023,"Toinelag & Unchained"]]},{"n":"TCS eSports League: 2026 #3","f":"2026-11-11","t":"2026-11-30","tier":"C-Tier","loc":"Europe","p":[["",10433,"Maxiking"]]},{"n":"FNCS 2026 Reload: EU - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"Europe","p":[["",223500]]},{"n":"FNCS 2026 Reload: NAC - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"North America","p":[["",158250]]},{"n":"FNCS 2026 Reload: NAW - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"North America","p":[["",60750]]},{"n":"FNCS 2026 Reload: Brazil - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"Brazil","p":[["",60750]]},{"n":"FNCS 2026 Reload: Oceania - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"Oceania","p":[["",28400]]},{"n":"C7MS1: Trios Cash Cup - Week 3","f":"2026-11-22","t":"2026-11-22","tier":"C-Tier","loc":"","p":[["OCE",3000],["ME",3000]]},{"n":"C7MS1: Arena Cash Cup - Week 2","f":"2026-11-24","t":"2026-11-24","tier":"D-Tier","loc":"","p":[["OCE",600],["ME",600]]},{"n":"Complete League - Fall Duo #2","f":"2026-11-25","t":"2026-12-09","tier":"D-Tier","loc":"Norway","p":[["",847]]},{"n":"C7MS1: Evaluation Cup - Week 4: NA Central","f":"2026-11-26","t":"2026-11-26","tier":"C-Tier","loc":"North America","p":[["",4800]]},{"n":"C7MS1: Evaluation Cup - Week 4","f":"2026-11-26","t":"2026-11-26","tier":"C-Tier","loc":"","p":[["EU",4800]]},{"n":"C7MS1: Arena Fight Night - Week 4","f":"2026-11-27","t":"2026-11-27","tier":"D-Tier","loc":"","p":[["BR",1000]]}];
/* Недавние турниры с победителями (Portal:Tournaments, «Most recent»): p = [[регион, $, победитель]…]. Пишет tools/refresh-home-data.js. */
const HOME_RECENT_LQ=[{"n":"Inoxtag BACK TO OG Invitational","f":"2026-10-24","t":"2026-10-24","tier":"Show Matches","loc":"Paris","p":[["",112023,"Toinelag & Unchained"]]},{"n":"Complete League - Fall Duo #1","f":"2026-11-04","t":"2026-11-18","tier":"D-Tier","loc":"Norway","p":[["",869]]},{"n":"C7MS1: Trios Cash Cup - Week 2","f":"2026-11-14","t":"2026-11-14","tier":"C-Tier","loc":"","p":[["OCE",3000,"Vazen & Tinka & Mace"],["ME",3000,"Kalgamer710 & Henchman & Bd"],["ASIA",3000,"Bot & tomat & Jaemon"]]},{"n":"Blitz Duo CoEd Cup","f":"2026-11-16","t":"2026-11-16","tier":"D-Tier","loc":"Europe","p":[["",200,"Syaaz & Jasmina"]]},{"n":"Staff x Player Invitational Cup","f":"2026-11-18","t":"2026-11-18","tier":"D-Tier","loc":"Europe","p":[["",220,"Rafa & Prxzen"]]}];
/* ТАЙМЕР ДО БЛИЖАЙШЕГО ТУРНИРА EPIC (16.10, его «4»). Окна — выгрузка Epic по Европе (страницы событий Tracker, imp_event.Windows,
   снято 16.10.2026 через его Chrome; время UTC, как отдаёт Epic), с 15.10. Показывается по часам браузера. Окно считается идущим три часа
   с начала — у Epic столько длится раунд капа; у FNCS «Смотреть» ведёт на официальный канал Fortnite. */
const HOME_WINDOWS=[["2026-10-15T16:00","S42_PerformanceEvaluation_Event8Round1_EU"],["2026-10-15T19:00","S42_PerformanceEvaluation_Event8Round2_EU"],["2026-10-16T17:00","S42_ReloadCashCup_DuosZB_Event5Round2_EU"],["2026-10-16T17:00","S42_ReloadSoloVictoryCup_Event4_Round1_EU"],["2026-10-16T20:00","S42_ReloadSoloVictoryCup_Event4_Round2_EU"],["2026-10-17T13:00","S42_FNCSSolo_HeatsStage_Heat1_EU"],["2026-10-17T16:00","S42_MobileVictoryCup_Event5_Round1_EU"],["2026-10-17T17:00","S42_ConsoleVCC_SolosZB_Event7Round1_EU"],["2026-10-17T17:00","S42_RankedCupDuos_Event7_EU"],["2026-10-17T17:00","S42_RankedCupDuos_ZB_Event7_EU"],["2026-10-17T18:00","S42_MobileVictoryCup_Event5_Round2_EU"],["2026-10-17T20:00","S42_ConsoleVCC_SolosZB_Event7Round2_EU"],["2026-10-18T13:00","S42_ReloadCashCup_DuosZB_Event6Round1_EU"],["2026-10-18T13:00","S42_FNCSSolo_HeatsStage_Heat2_EU"],["2026-10-18T13:00","S42_ArenaTestCup_Event8_EU"],["2026-10-18T16:00","S42_ChampionTealKnightFNCSCup_Mobile_EU"],["2026-10-18T17:00","S42_ChampionTealKnightFNCSCup_EU"],["2026-10-18T17:00","S42_ChampionTealKnightFNCSCup_ZB_EU"],["2026-10-18T17:00","S42_RankedCupReloadDuos_Event7_EU"],["2026-10-18T17:00","S42_RankedCupReloadDuos_ZB_Event7_EU"],["2026-10-19T17:00","S42_FNCSSolo_LastChanceQualifier_EU"],["2026-10-19T17:00","S42_RankedCupSolo_Event8_EU"],["2026-10-19T17:00","S42_RankedCupSolo_ZB_Event8_EU"],["2026-10-20T17:00","S42_FNCSSolo_LastChanceLobby_EU"],["2026-10-20T17:00","S42_RankedCupSoloReload_Event8_EU"],["2026-10-20T17:00","S42_RankedCupSoloReload_ZB_Event8_EU"],["2026-10-22T16:00","S42_PerformanceEvaluation_Event9Round1_EU"],["2026-10-22T19:00","S42_PerformanceEvaluation_Event9Round2_EU"],["2026-10-23T17:00","S42_ReloadCashCup_DuosZB_Event6Round2_EU"],["2026-10-23T17:00","S42_ReloadSoloVictoryCup_Event5_Round1_EU"],["2026-10-23T20:00","S42_ReloadSoloVictoryCup_Event5_Round2_EU"],["2026-10-23T22:00","S42_BOG_DAY1_EU"],["2026-10-24T17:00","S42_ConsoleVCC_SolosZB_Event8Round1_EU"],["2026-10-24T17:00","S42_RankedCupDuos_Event8_EU"],["2026-10-24T17:00","S42_RankedCupDuos_ZB_Event8_EU"],["2026-10-24T20:00","S42_ConsoleVCC_SolosZB_Event8Round2_EU"],["2026-10-24T22:00","S42_BOG_DAY2_EU"],["2026-10-25T18:00","S42_RankedCupReloadDuos_Event8_EU"],["2026-10-25T18:00","S42_RankedCupReloadDuos_ZB_Event8_EU"],["2026-10-26T18:00","S42_FNCSSolo_Final_Day1_EU"],["2026-10-27T18:00","S42_FNCSSolo_Final_Day2_EU"]];
const HOME_LIVE_MS=3*3600e3;
// Постер окна — те же постеры, что у таких турниров в карьере: FNCS Solos, Reload-кап (c41r), Victory Cup соло/дуо (c38s/c38d), Cash Cup (c25d).
function homeWinArt(k){
  if(/FNCSSolo/.test(k)) return 'art/fncs-solo.jpg';
  if(/Reload/.test(k)) return 'art/cups/c41r.jpg';
  if(/Victory|VCC/.test(k)) return /Duo/.test(k) ? 'art/cups/c38d.jpg' : 'art/cups/c38s.jpg';
  if(/CashCup/.test(k)) return 'art/cups/c25d.jpg';
  return 'art/fncs-2026.jpg';
}
function homeWinName(k){
  const r=(k.match(/Round(\d)/)||[])[1], ev=(k.match(/Event(\d+)/)||[])[1];
  const rnd=r ? ' · Round '+r : '';
  if(/FNCSSolo_HeatsStage_Heat(\d)/.test(k)) return 'FNCS Solos · Heat '+k.match(/Heat(\d)/)[1];
  if(/FNCSSolo_Final_Day(\d)/.test(k)) return 'FNCS Solos · Final · Day '+k.match(/Day(\d)/)[1];
  if(/FNCSSolo_LastChance/.test(k)) return 'FNCS Solos · Last Chance';
  if(/ReloadSoloVictoryCup/.test(k)) return 'Reload Solo Victory Cup'+rnd;
  if(/ReloadCashCup_DuosZB/.test(k)) return 'Reload Duo Cash Cup (ZB)'+rnd;
  if(/ConsoleVCC_SolosZB/.test(k)) return 'Console Victory Cash Cup (ZB)'+rnd;
  if(/MobileVictoryCup/.test(k)) return 'Mobile Victory Cup'+rnd;
  if(/RankedCupReloadDuos/.test(k)) return 'Ranked Reload Cup · Duos'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/RankedCupSoloReload/.test(k)) return 'Ranked Reload Cup · Solo'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/RankedCupDuos/.test(k)) return 'Ranked Cup · Duos'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/RankedCupSolo/.test(k)) return 'Ranked Cup · Solo'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/PerformanceEvaluation/.test(k)) return 'Performance Evaluation'+rnd;
  if(/ChampionTealKnightFNCSCup/.test(k)) return 'Teal Knight FNCS Cup'+(/_Mobile/.test(k) ? ' · Mobile' : /_ZB/.test(k) ? ' (ZB)' : '');
  if(/ArenaTestCup/.test(k)) return 'Arena Test Cup';
  if(/BOG_DAY(\d)/.test(k)) return 'BOG · Day '+k.match(/BOG_DAY(\d)/)[1];
  return k.replace(/^S\d+_/, '').replace(/_EU$/, '').replace(/_/g, ' ');
}
function homeTimerPick(now){
  const at=w=>Date.parse(w[0]+':00Z');
  // ZB-двойник того же кубка в ту же минуту — одна строка.
  const live=HOME_WINDOWS.filter(w=>at(w)<=now && now<at(w)+HOME_LIVE_MS);
  const next=HOME_WINDOWS.find(w=>at(w)>now);
  return {live:live.filter((w,i)=>!/_ZB/.test(w[1]) || !live.some((v,j)=>j!==i && v[0]===w[0] && v[1]===w[1].replace('_ZB',''))), next, at};
}
let HOME_TIMER_T=null;
function homeTimerDraw(){
  const box=document.getElementById('homeTimer'); if(!box) return;
  const T=L(), now=Date.now(), p=homeTimerPick(now);
  if(!p.next && !p.live.length){
    /* Окна Epic с точным временем кончились (их снимают со страниц Tracker руками) — тогда ближайший турнир Epic из
       расписания Liquipedia, с точностью до дня: «через N дней», без секунд, которых мы не знаем. */
    const today=homeToday(), EPIC=/Cash Cup|Victory Cup|Reload Elite|FNCS|Eval|Performance Evaluation|Ranked Cup/i;
    const x=(typeof HOME_SCHED_LQ!=='undefined' ? HOME_SCHED_LQ : []).find(e=>e.f>today && EPIC.test(e.n));
    if(!x){ box.hidden=true; return; }
    const days=Math.round((Date.parse(x.f+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5);
    box.innerHTML='<span class="ht-lbl">'+esc(T.hmTimerNext)+'</span><img class="ht-img" src="'+homeWinArt(x.n.replace(/\s/g, ''))+'" alt="" onerror="this.remove()">'+
      '<b>'+esc(x.n)+'</b><span class="ht-when">'+esc(homeDate(x.f, true))+'</span><span class="ht-cd">'+esc(days===1 ? T.hmTimerTomorrow : T.hmSceneIn(days))+'</span>';
    box.hidden=false; return;
  }
  const loc=LANG==='ru' ? 'ru-RU' : LANG;
  const clock=ms=>{ try{ return new Date(ms).toLocaleTimeString(loc, {hour:'2-digit', minute:'2-digit'}); }catch(e){ return ''; } };
  const dayWord=ms=>{ const d=new Date(ms), t=new Date(); const k=x=>x.getFullYear()+'-'+x.getMonth()+'-'+x.getDate();
    if(k(d)===k(t)) return T.hmTimerToday; t.setDate(t.getDate()+1); if(k(d)===k(t)) return T.hmTimerTomorrow;
    try{ return d.toLocaleDateString(loc, {weekday:'short', day:'numeric', month:'short'}); }catch(e){ return ''; } };
  let html='';
  if(p.live.length){
    const w=p.live.find(x=>/FNCS/.test(x[1])) || p.live[0], fncs=/FNCS/.test(w[1]);
    html+='<img class="ht-img" src="'+homeWinArt(w[1])+'" alt="" onerror="this.remove()"><span class="ht-live">'+esc(T.hmTimerLive)+'</span><b>'+esc(homeWinName(w[1]))+'</b>'+
      (fncs ? '<a class="ht-watch" href="https://www.twitch.tv/fortnite" target="_blank" rel="noopener">'+esc(T.hmTimerWatch)+'</a>' : '');
  }
  if(p.next){
    const ms=p.at(p.next), left=Math.max(0, ms-now);
    const d=Math.floor(left/864e5), h=Math.floor(left/36e5)%24, m=Math.floor(left/6e4)%60, sec=Math.floor(left/1e3)%60;
    const two=x=>String(x).padStart(2,'0');
    html+=(p.live.length ? '<span class="ht-sep"></span>' : '<span class="ht-lbl">'+esc(T.hmTimerNext)+'</span>')+
      '<img class="ht-img" src="'+homeWinArt(p.next[1])+'" alt="" onerror="this.remove()"><b>'+esc(homeWinName(p.next[1]))+'</b><span class="ht-when">'+esc(dayWord(ms))+' · '+esc(clock(ms))+'</span>'+
      '<span class="ht-cd">'+(d ? d+T.hmDayShort+' ' : '')+two(h)+':'+two(m)+':'+two(sec)+'</span>';
  }
  box.innerHTML=html; box.hidden=false;
  // Секундная стрелка — только пока главная на экране.
  clearTimeout(HOME_TIMER_T);
  HOME_TIMER_T=setTimeout(()=>{ const sc=document.getElementById('screen-mode'); if(sc && sc.classList.contains('active')) homeTimerDraw(); else HOME_TIMER_T=null; }, 1000);
}
/* Победители турниров Epic, кончившихся за последние три дня (16.10, «победители после турнира»). */
function homeRecentHTML(T, today, EPIC){
  const from=new Date(Date.parse(today+'T00:00:00Z')-3*864e5).toISOString().slice(0,10);
  const list=(typeof HOME_RECENT_LQ!=='undefined' ? HOME_RECENT_LQ : []).filter(x=>x.t<today && x.t>=from && EPIC.test(x.n) && x.p.some(p=>p[2]));
  if(!list.length) return '';
  const rows=list.slice().reverse().map(x=>{
    const art=/FNCS/i.test(x.n) ? 'art/fncs-solo.jpg' : homeWinArt(x.n.replace(/\s/g, ''));
    const won=x.p.filter(p=>p[2]).map(p=>(p[0] ? p[0]+': ' : '')+p[2]).join(' · ');
    const dates=homeDate(x.f, true)+(x.t!==x.f ? ' – '+homeDate(x.t, true) : '');
    return '<li class="hs-li"><img src="'+art+'" alt="" onerror="this.remove()"><div><b>'+esc(x.n)+'</b><span>'+esc(dates)+'</span><span class="hs-pm">🏆 '+esc(won)+'</span></div></li>';
  }).join('');
  return '<b class="hs-other">'+esc(T.hmSceneRecent)+'</b><ul class="hs-st hs-list">'+rows+'</ul>';
}
function homeSceneDraw(){
  const box=document.getElementById('homeScene'); if(!box) return;
  const T=L(), today=homeToday(), names=T.ccYearNames||{};
  const seen={}, list=[];
  CAREER_YEAR.slice().sort((a,b)=>a[0]<b[0] ? -1 : a[0]>b[0] ? 1 : 0).forEach(r=>{
    const from=r[0], to=r[1], id=r[2], kind=r[3];
    if(kind==='nations' || HOME_SCENE_SKIP[id] || to<today || seen[id]) return;
    seen[id]=1; list.push({from, to, id});
  });
  /* Стадии одного турнира — одной карточкой (15.10: три одинаковые обложки FNCS Solos подряд). Турнир — id без стадии:
     FNCSSolos_Heats → FNCSSolos, ReloadEliteSeries3PlayIn → ReloadEliteSeries3. */
  const fam=id=>id.replace(/_.*$/, '').replace(/(Opens|PlayIn|Heats|Final)$/, '');
  const groups=[];
  list.forEach(e=>{ const f=fam(e.id), g=groups.find(x=>x.f===f); if(g) g.items.push(e); else groups.push({f, items:[e]}); });
  /* Все ближайшие призовые турниры года, со всеми стадиями (15.10: «больше расписания», «все призовые турниры ближайшие»).
     Призовые — таблицы Epic, что уже лежат в карьере: FNCS Solos — CC_SOLOS_PRIZES; про остальное Epic пока молчит. */
  const pool=t=>{ let sum=0, prev=0; (t||[]).forEach(r=>{ sum+=(r[0]-prev)*r[1]; prev=r[0]; }); return sum; };
  const prizeOf=f=>{
    if(f==='FNCSSolos' && typeof CC_SOLOS_PRIZES!=='undefined')
      return ['EU','NAC'].map(r=>T.hmScenePrize(r, ccNum(CC_SOLOS_PRIZES[r][0][1]), ccNum(pool(CC_SOLOS_PRIZES[r]))))
        .concat((HOME_SCHED_LQ.find(x=>/^FNCS Solos/.test(x.n))||{p:[]}).p.length ? [(HOME_SCHED_LQ.find(x=>/^FNCS Solos/.test(x.n))).p.map(p=>p[0]+' $'+ccNum(p[1])).join(' · ')] : []);
    return [];
  };
  const rows=groups.map(g=>{
    const first=g.items[0];
    const full=id=>String(names[id]||id).replace(/\s*·?\s*\{CITY\}/, '');
    const title=full(first.id).split(' · ')[0];
    const art=(typeof CAREER_EV_ART_ID!=='undefined' && CAREER_EV_ART_ID[first.id]) || 'art/fncs-2026.jpg';
    const money=prizeOf(g.f);
    const stages=g.items.map(e=>{
      const live=e.from<=today;
      const days=Math.round((Date.parse(e.from+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5);
      const when=live ? T.hmSceneLive : days===1 ? T.hmSceneTomorrow : T.hmSceneIn(days);
      const stage=full(e.id).split(' · ').slice(1).join(' · ') || full(e.id);
      const dates=homeDate(e.from, true)+(e.to!==e.from ? ' – '+homeDate(e.to, true) : '');
      return '<li'+(live ? ' class="live"' : '')+'><b>'+esc(stage)+'</b><span><i>'+esc(when)+'</i> · '+esc(dates)+'</span></li>';
    }).join('');
    return '<div class="hs-ev"><img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()"><div>'+
      '<b class="hs-t">'+esc(title)+'</b>'+money.map(m=>'<span class="hs-money">'+(ccUiClassic() ? '💰 ' : '')+esc(m)+'</span>').join('')+'<ul class="hs-st">'+stages+'</ul></div></div>';
  }).join('');
  // Другие турниры с призовыми — Liquipedia; только те, что ещё не кончились.
  // Только турниры Epic (16.10: «пусть будут турниры от Epic только»): капы Epic и FNCS; сторонние лиги, лестницы и кубки — нет.
  const EPIC=/Cash Cup|Victory Cup|Reload Elite|FNCS|Fortnite Champion Series|Eval Cup|Performance Evaluation/i;
  const other=HOME_SCHED_LQ.filter(x=>x.t>=today && !/^FNCS Solos/.test(x.n) && EPIC.test(x.n)).map(x=>{
    const live=x.f<=today, days=Math.round((Date.parse(x.f+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5);
    const when=live ? T.hmSceneLive : days===1 ? T.hmSceneTomorrow : T.hmSceneIn(days);
    const dates=homeDate(x.f, true)+(x.t!==x.f ? ' – '+homeDate(x.t, true) : '');
    const money=x.p.map(p=>(p[0] ? p[0]+' ' : '')+'$'+ccNum(p[1])).join(' · ');
    // Постер капа — тот же, что у капов этого вида в карьере (CAREER_EV_ART_ID: c41r — Reload, c38d — Victory Cup, c25d — Cash Cup).
    const art=/Reload/i.test(x.n) ? 'art/cups/c41r.jpg' : /Victory/i.test(x.n) ? 'art/cups/c38d.jpg' : 'art/cups/c25d.jpg';
    return '<li class="hs-li'+(live ? ' live' : '')+'"><img src="'+art+'" alt="" onerror="this.remove()"><div><b>'+esc(x.n)+(x.tier ? ' <em>'+esc(x.tier)+'</em>' : '')+'</b>'+
      '<span><i>'+esc(when)+'</i> · '+esc(dates)+(x.loc ? ' · '+esc(x.loc) : '')+'</span><span class="hs-pm">'+(ccUiClassic() ? '💰 ' : '')+esc(money)+'</span></div></li>';
  }).join('');
  // Таймер до ближайшего турнира — здесь же, в колонке сцены (16.10: «пусть таймер будет где scene»); заполняет homeTimerDraw.
  box.innerHTML='<h2 class="home-h">'+esc(T.hmSceneTitle)+'</h2><p class="home-sub">'+esc(T.hmSceneSub2)+'</p><div class="home-timer" id="homeTimer" hidden></div>'+
    (rows ? '<div>'+rows+'</div>' : '<p class="home-sub">'+esc(T.hmSceneDone)+'</p>')+
    (other ? '<b class="hs-other">'+esc(T.hmSceneOther)+'</b><ul class="hs-st hs-list">'+other+'</ul>' : '')+homeRecentHTML(T, today, EPIC);
  box.hidden=false;
}
/* РЕЗУЛЬТАТЫ 2026 на главной (15.10, «а таблицу лидеров и реальные турниры»): настоящие итоги прошедших турниров года.
   Ничего нового не выдумано — это те же таблицы, по которым считаются карточки: финалы Мейджоров (Tracker, по регионам,
   с очками), Саммит и Антверпен (места по никам из рейтинга карточек, FD_SUMMIT_RANK / FD_GC26_RANK), Reload Championship
   (Liquipedia, с призовыми). Призовые Антверпена — таблица Epic GC2026_PRIZES. */
let HOME_REAL_OPEN=null, HOME_REAL_REG='EU';
const HOME_REAL_REGS=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
function homeRealRaw(stage, reg){
  try{
    if(stage===1) return ({EU:CARD_M1_GF_RAW, NAC:CARD_N1_GF_RAW, NAW:CARD_W1_GF_RAW, BR:CARD_B1_GF_RAW, ASIA:CARD_A1_GF_RAW, ME:CARD_E1_GF_RAW, OCE:CARD_O1_GF_RAW})[reg]||null;
    return ({EU:CARD_M2_GF_RAW, NAC:CARD_N2_GF_RAW, NAW:CARD_W2_GF_RAW, BR:CARD_B2_GF_RAW, ASIA:CARD_A2_GF_RAW, ME:CARD_E2_GF_RAW, OCE:CARD_O2_GF_RAW})[reg]||null;
  }catch(e){ return null; }
}
// Места по нику → команды: одно место — одна пара; второе написание того же ника (NOCIF/Nociff, ふーくん) не считается.
function homeRankTeams(rank){
  const flat=[], add=(o, reg)=>Object.keys(o||{}).forEach(h=>flat.push({h, p:o[h], reg}));
  const nested=rank && Object.keys(rank).length && Object.values(rank).every(v=>v && typeof v==='object');
  if(nested) Object.keys(rank).forEach(r=>add(rank[r], r)); else add(rank, null);
  const by={};
  flat.forEach(x=>{
    if(!/^[\x20-\x7e]+$/.test(x.h)) return;
    const t=by[x.p]=by[x.p]||{p:x.p, reg:x.reg, names:[]};
    const lo=x.h.toLowerCase();
    if(t.names.length<2 && !t.names.some(n=>{ const m=n.toLowerCase(); return m===lo || m.indexOf(lo)===0 || lo.indexOf(m)===0; })) t.names.push(x.h);
  });
  return Object.values(by).sort((a,b)=>a.p-b.p);
}
function homeRealEvents(){
  const N=L().ccYearNames||{};
  const nm=(id, city)=>String(N[id]||id).replace(/\{CITY\}/, city||'').replace(/\s*·\s*$/, '');
  const when=id=>{ const r=CAREER_YEAR.find(x=>x[2]===id); return r ? {from:r[0], to:r[1]} : null; };
  const art=id=>(typeof CAREER_EV_ART_ID!=='undefined' && CAREER_EV_ART_ID[id]) || 'art/fncs-2026.jpg';
  const ev=[];
  if(typeof window!=='undefined' && window.FD_GC26_RANK)
    ev.push({id:'gc26', key:'GlobalChampionship', name:nm('GlobalChampionship', 'Antwerp'),
      rows:()=>homeRankTeams(window.FD_GC26_RANK).map(t=>({p:t.p, names:t.names, reg:t.reg, prize:(typeof GC2026_PRIZES!=='undefined' && GC2026_PRIZES[String(t.p)])||0}))});
  if(typeof RC_TEAMS_2026!=='undefined')
    ev.push({id:'rc', key:'ReloadChampionshipParis', name:nm('ReloadChampionshipParis', 'Paris'),
      rows:()=>RC_TEAMS_2026.map(t=>({p:+t.p, names:t.d, reg:t.r, prize:t.c}))});
  // Призовые финалов — таблицы Tracker (PRIZE_TABLES — Мейджор 1 и Саммит, PRIZE_TABLES_M2 — Мейджор 2), на дуо.
  const pay=(t, p)=>(t && t[String(p)]) || 0;
  ev.push({id:'m2', key:'Major2_Final', name:nm('Major2_Final'), regs:true,
    rows:reg=>(homeRealRaw(2, reg)||[]).map(r=>({p:r[0], pts:r[1], names:r.slice(6).filter(x=>typeof x==='string'),
      prize:pay(typeof PRIZE_TABLES_M2!=='undefined' && PRIZE_TABLES_M2[reg], r[0])}))});
  if(typeof window!=='undefined' && window.FD_SUMMIT_RANK)
    ev.push({id:'summit', key:'Summit_Final', name:nm('Summit_Final'), rows:()=>homeRankTeams(window.FD_SUMMIT_RANK).map(t=>({p:t.p, names:t.names,
      prize:pay(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES.SUMMIT, t.p)}))});
  ev.push({id:'m1', key:'Major1_Final', name:nm('Major1_Final'), regs:true,
    rows:reg=>(homeRealRaw(1, reg)||[]).map(r=>({p:r[0], pts:r[1], names:r.slice(6).filter(x=>typeof x==='string'),
      prize:pay(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES[reg], r[0])}))});
  // Свои обложки: у этих стадий в календаре карьеры общая заглушка.
  const own={gc26:'art/mode-all-fncs.jpg', rc:'art/mode-ewc.jpg', m2:'art/fncs-2026.jpg', summit:'art/fncs-2026-major1.jpg', m1:'art/mode-major1.jpg'};
  ev.forEach(e=>{ e.when=when(e.key); e.art=own[e.id]||art(e.key); });
  // Только прошедшие: «результаты» турнира, который ещё не сыгран, — это пустая таблица.
  const today=homeToday();
  return ev.filter(e=>e.when && e.when.to<today);
}
function homeRealDraw(){
  if(HOME_EARN_MODE){ homeEarnDraw(); return; }
  const box=document.getElementById('homeReal'); if(!box) return;
  const T=L(), list=homeRealEvents();
  if(!list.length){ box.hidden=true; return; }
  /* Топ-10 выбранного турнира прямо на главной (15.10: «топ 10 игроков, призы и поинты у каждого капа»): турнир — кнопками,
     у Мейджоров ещё и регион; полная таблица — по «Вся таблица». */
  const e=list.find(x=>x.id===HOME_REAL_SEL) || list[0];
  HOME_REAL_SEL=e.id;
  const reg=HOME_REAL_REGS.indexOf(HOME_REAL_REG)>=0 ? HOME_REAL_REG : 'EU';
  const all=e.regs ? e.rows(reg) : e.rows(), top=all.slice(0, 10);
  const hasPts=top.some(r=>r.pts!=null), hasPrize=top.some(r=>r.prize), multi=!e.regs && top.some(r=>r.reg);
  const chips='<div class="hr-chips">'+list.map(x=>'<button type="button" class="'+(x.id===e.id ? 'on' : '')+'" onclick="homeRealSel(\''+x.id+'\')">'+
    esc(x.name.split(' · ')[0])+'</button>').join('')+'</div>';
  const regs=e.regs ? '<div class="hr-chips hr-chips-reg">'+HOME_REAL_REGS.filter(r=>homeRealRaw(e.id==='m1' ? 1 : 2, r)).map(r=>
    '<button type="button" class="'+(r===reg ? 'on' : '')+'" onclick="homeRealReg(\''+r+'\')">'+r+'</button>').join('')+'</div>' : '';
  const dates=homeDate(e.when.from, true)+(e.when.to!==e.when.from ? ' – '+homeDate(e.when.to, true) : '');
  const th='<tr><th>#</th><th>'+esc(T.hmRealTeam)+'</th>'+(hasPts ? '<th>'+esc(T.hmRealPts)+'</th>' : '')+(hasPrize ? '<th>'+esc(T.hmRealPrize)+'</th>' : '')+'</tr>';
  const body=top.map(r=>'<tr><td>'+r.p+'</td><td>'+(r.names||[]).map(esc).join(' &amp; ')+(multi && r.reg ? ' <em>'+esc(r.reg)+'</em>' : '')+'</td>'+
    (hasPts ? '<td>'+(r.pts!=null ? r.pts : '')+'</td>' : '')+(hasPrize ? '<td>'+(r.prize ? '$'+ccNum(r.prize) : '-')+'</td>' : '')+'</tr>').join('');
  box.innerHTML='<h2 class="home-h">'+esc(T.hmRealTitle)+'</h2>'+chips+
    '<div class="hr-head"><img src="'+esc(e.art)+'" alt="" onerror="this.remove()"><span><b>'+esc(e.name)+'</b><small>'+esc(dates)+'</small></span></div>'+regs+
    '<table class="hr-table hr-top10"><thead>'+th+'</thead><tbody>'+body+'</tbody></table>'+
    (all.length>10 ? '<button class="home-more" type="button" onclick="homeRealOpen(\''+e.id+'\', \''+reg+'\')">'+esc(T.hmRealAll(all.length))+'</button>' : '');
  box.hidden=false;
}
/* ПРИЗОВЫЕ 2026 У ИГРОКОВ (15.10: «мб вместо результатов призовые за год у игроков»). Считается из тех же таблиц, что
   «Результаты 2026»: финалы Мейджоров 1 и 2 во всех регионах, Саммит, Reload Championship, Мировой чемпионат — у каждой
   строки там место и призовые дуо. Игроку — половина. Квалификации, Reload Elite Series и капы в данных без призовых по
   игрокам и сюда не входят — подпись это говорит. Один ник в разных регистрах (shxrk/Shxrk) — один игрок. */
const HOME_EARN_MODE=true;
let HOME_EARN_ALL=false, HOME_EARN_CACHE=null;
function homeEarnings(){
  if(HOME_EARN_CACHE && HOME_EARN_CACHE.lang===LANG) return HOME_EARN_CACHE.list;
  const by={};
  homeRealEvents().forEach(e=>{
    (e.regs ? HOME_REAL_REGS : [null]).forEach(reg=>{
      (e.regs ? e.rows(reg) : e.rows()).forEach(r=>{
        if(!r.prize) return;
        const share=r.prize/2;
        (r.names||[]).forEach(h=>{
          const k=String(h).toLowerCase();
          const x=by[k]=by[k]||{k, h, reg:r.reg||reg||'', sum:0, ev:[]};
          x.sum+=share;
          x.ev.push({name:e.name.split(' · ')[0]+(reg ? ' · '+reg : ''), p:r.p, prize:share});
        });
      });
    });
  });
  const list=Object.values(by).sort((a,b)=>b.sum-a.sum || a.h.localeCompare(b.h));
  HOME_EARN_CACHE={lang:LANG, list};
  return list;
}
/* Призовые 2026 со ВСЕХ турниров (16.10: «и призовые вообще за весь год со всех, не ток с фнкс», «и флаги по игрокам»).
   Источник — Liquipedia, Portal:Statistics/2026, таблица «Money Ranking · By player» (топ-50, снято 16.10.2026):
   ник, страна, медали 1/2/3 и сумма. Обновлять тем же запросом (api.php?action=parse&page=Portal:Statistics/2026).
   Поля: n — ник, c — флаг (как в flags/w20), e — $, m — [1-х, 2-х, 3-х мест]. */
const HOME_EARN_LQ=[{"n":"vic0","c":"at","e":458353,"m":[10,7,6]},{"n":"Malibuca","c":"ru","e":440353,"m":[8,9,9]},{"n":"shxrk","c":"ro","e":400360,"m":[9,14,12]},{"n":"t3eny","c":"si","e":351582,"m":[7,7,8]},{"n":"Pixie","c":"se","e":334192,"m":[9,8,4]},{"n":"SwizzY","c":"ru","e":317962,"m":[7,4,5]},{"n":"Scroll","c":"dk","e":298591,"m":[19,13,10]},{"n":"Sky","c":"dk","e":278386,"m":[14,10,10]},{"n":"Pollo","c":"mx","e":214724,"m":[13,8,5]},{"n":"Tjino","c":"dk","e":201335,"m":[8,8,5]},{"n":"Peterbot","c":"us","e":199341,"m":[14,9,5]},{"n":"Boltz","c":"us","e":163225,"m":[5,4,7]},{"n":"PabloWingu","c":"dk","e":154629,"m":[5,9,5]},{"n":"Acorn","c":"ca","e":149458,"m":[4,3,7]},{"n":"Ajerss","c":"us","e":135963,"m":[7,4,5]},{"n":"Clix","c":"us","e":127188,"m":[6,5,6]},{"n":"Darm","c":"pl","e":121397,"m":[8,9,6]},{"n":"Momsy","c":"fr","e":116395,"m":[6,1,5]},{"n":"Cold","c":"us","e":113692,"m":[8,5,3]},{"n":"FoCuS","c":"il","e":107116,"m":[16,14,7]},{"n":"Cr1nge","c":"","e":101101,"m":[3,6,8]},{"n":"charyy","c":"pl","e":99395,"m":[8,9,7]},{"n":"Th0masHD","c":"dk","e":98300,"m":[7,9,3]},{"n":"SkyJump","c":"fr","e":98026,"m":[4,4,6]},{"n":"Veno","c":"gb","e":96650,"m":[7,3,5]},{"n":"Curve","c":"us","e":96060,"m":[6,5,5]},{"n":"Twi","c":"gb","e":92288,"m":[2,4,7]},{"n":"Kami","c":"pl","e":91885,"m":[6,4,6]},{"n":"Romero","c":"ar","e":79850,"m":[3,4,5]},{"n":"Chap","c":"ch","e":79485,"m":[18,7,4]},{"n":"Rapid","c":"ca","e":78675,"m":[10,8,4]},{"n":"Flickzy","c":"de","e":78375,"m":[11,6,2]},{"n":"Ritual","c":"us","e":77550,"m":[7,8,8]},{"n":"Lewa","c":"ar","e":74548,"m":[3,2,3]},{"n":"Higgs","c":"us","e":72800,"m":[9,6,5]},{"n":"Amp2Fly","c":"us","e":67950,"m":[5,4,4]},{"n":"Muz","c":"au","e":66241,"m":[2,6,2]},{"n":"Demus","c":"pl","e":63871,"m":[6,9,6]},{"n":"IAmNoob","c":"ie","e":59450,"m":[14,7,7]},{"n":"VicterV","c":"us","e":57691,"m":[3,4,3]},{"n":"Khanada","c":"us","e":57638,"m":[7,3,4]},{"n":"SaLva","c":"sa","e":52138,"m":[4,4,3]},{"n":"Kingaling","c":"us","e":50050,"m":[5,4,3]},{"n":"Vergo","c":"us","e":49185,"m":[6,4,4]},{"n":"Syaaz","c":"es","e":48519,"m":[28,13,8]},{"n":"Shadow","c":"us","e":48250,"m":[7,1,4]},{"n":"Kraez","c":"us","e":48175,"m":[4,3,1]},{"n":"Rax","c":"it","e":47501,"m":[12,3,4]},{"n":"Japko","c":"pl","e":46665,"m":[1,0,0]},{"n":"Rises","c":"us","e":44975,"m":[12,7,9]}];
const HOME_EARN_AT='2026-11-19';
function homeEarnDraw(){
  const box=document.getElementById('homeReal'); if(!box) return;
  const T=L(), list=HOME_EARN_LQ;
  if(!list.length){ box.hidden=true; return; }
  box.innerHTML='<h2 class="home-h">'+esc(T.hmEarnTitle)+'</h2><p class="home-sub">'+esc(T.hmEarnSub(homeDate(HOME_EARN_AT)))+'</p>'+
    '<div class="he-list">'+homeEarnRowsHTML(list.slice(0, 10))+'</div>'+
    (list.length>10 ? '<button class="home-more" type="button" onclick="homeListOpen(\'earn\')">'+esc(T.hmBoardMore(Math.min(50, list.length)))+'</button>' : '');
  box.hidden=false;
}
function homeEarnRowsHTML(list){
  const flag=c=>c ? '<img src="flags/w20/'+esc(c)+'.png" alt="" onerror="this.remove()">' : '';
  return list.map((x,i)=>'<button class="he-row" type="button" onclick="homeEarnOpen('+i+')">'+
    '<i>'+(i+1)+'</i><b>'+flag(x.c)+esc(x.n)+'<small>🥇'+x.m[0]+' 🥈'+x.m[1]+' 🥉'+x.m[2]+'</small></b>'+
    '<span>$'+ccNum(x.e)+'</span></button>').join('');
}
// Игрок: флаг, сумма за год, медали и — что из этого известно по финалам FNCS (места и доля, homeEarnings).
function homeEarnOpen(i){
  const x=HOME_EARN_LQ[i]; if(!x) return;
  const T=L(), fn=homeEarnings().find(p=>p.k===String(x.n).toLowerCase());
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  const fl=x.c ? '<img src="flags/w20/'+esc(x.c)+'.png" alt="" style="width:22px;vertical-align:-2px;margin-right:8px" onerror="this.remove()">' : '';
  const body=fn ? fn.ev.map(e=>'<tr><td>'+e.p+'</td><td>'+esc(e.name)+'</td><td>$'+ccNum(Math.round(e.prize))+'</td></tr>').join('') : '';
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(x.n)+'">'+
    '<div class="hr-top"><b>'+fl+esc(x.n)+' · $'+ccNum(x.e)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    '<p class="home-sub" style="margin:0">'+esc(T.hmEarnMedals(x.m[0], x.m[1], x.m[2]))+'</p>'+
    (body ? '<b style="font-size:13px;color:#fff">'+esc(T.hmEarnFncs)+'</b><div class="hr-wrap"><table class="hr-table"><thead><tr><th>#</th><th>'+esc(T.hmEarnEvent)+'</th><th>'+esc(T.hmRealPrize)+'</th></tr></thead><tbody>'+body+'</tbody></table></div>' : '')+
    '<p class="home-sub" style="margin:0">'+esc(T.hmEarnSrc)+'</p></div>';
  document.body.classList.add('hr-lock');
}
let HOME_REAL_SEL=null;
function homeRealSel(id){ HOME_REAL_SEL=id; homeRealDraw(); try{ homeLiveTabs(); }catch(e){} }
function homeRealReg(r){ HOME_REAL_REG=r; homeRealDraw(); try{ homeLiveTabs(); }catch(e){} }
function homeRealOpen(id, reg){
  HOME_REAL_OPEN=id; if(reg) HOME_REAL_REG=reg;
  const e=homeRealEvents().find(x=>x.id===id); if(!e) return;
  const T=L();
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  const rows=e.regs ? e.rows(HOME_REAL_REG) : e.rows();
  const multi=!e.regs && rows.some(r=>r.reg);
  const hasPts=rows.some(r=>r.pts!=null), hasPrize=rows.some(r=>r.prize);
  const chips=e.regs ? '<div class="hr-regs">'+HOME_REAL_REGS.filter(r=>homeRealRaw(id==='m1' ? 1 : 2, r)).map(r=>
      '<button type="button" class="'+(r===HOME_REAL_REG ? 'on' : '')+'" onclick="homeRealOpen(\''+id+'\', \''+r+'\')">'+r+'</button>').join('')+'</div>' : '';
  const th='<tr><th>#</th><th>'+esc(T.hmRealTeam)+'</th>'+(multi ? '<th>'+esc(T.hmRealReg)+'</th>' : '')+
    (hasPts ? '<th>'+esc(T.hmRealPts)+'</th>' : '')+(hasPrize ? '<th>'+esc(T.hmRealPrize)+'</th>' : '')+'</tr>';
  const body=rows.map(r=>'<tr><td>'+r.p+'</td><td>'+(r.names||[]).map(esc).join(' &amp; ')+'</td>'+(multi ? '<td>'+esc(r.reg||'')+'</td>' : '')+
    (hasPts ? '<td>'+(r.pts!=null ? r.pts : '')+'</td>' : '')+(hasPrize ? '<td>'+(r.prize ? '$'+ccNum(r.prize) : '-')+'</td>' : '')+'</tr>').join('');
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(e.name)+'">'+
    '<div class="hr-top"><b>'+esc(e.name)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    chips+'<div class="hr-wrap"><table class="hr-table"><thead>'+th+'</thead><tbody>'+body+'</tbody></table></div></div>';
  document.body.classList.add('hr-lock');
}
function homeRealClose(){
  const m=document.getElementById('homeRealModal'); if(m) m.remove();
  document.body.classList.remove('hr-lock'); HOME_REAL_OPEN=null;
}
/* Вкладки живого блока: показаны только те, у которых есть что показать; выбранная помнится в браузере. */
function homeLiveTabs(k){
  const box=document.getElementById('homeLive'), bar=document.getElementById('homeLiveTabs'); if(!box || !bar) return;
  const T=L(), panes=[['real', 'homeReal', HOME_EARN_MODE ? T.hmEarnTitle : T.hmRealTitle], ['scene', 'homeScene', T.hmSceneTitle], ['board', 'homeBoard', T.lbTab]]
    .filter(p=>{ const e=document.getElementById(p[1]); return e && !e.hidden; });
  box.hidden=!panes.length; if(!panes.length) return;
  if(k){ try{ localStorage.setItem('fd_home_tab', k); }catch(e){} }
  let cur=k; if(!cur){ try{ cur=localStorage.getItem('fd_home_tab'); }catch(e){} }
  if(!panes.some(p=>p[0]===cur)) cur=panes[0][0];
  box.dataset.tab=cur;
  bar.innerHTML=panes.map(p=>'<button type="button" role="tab" aria-selected="'+(p[0]===cur)+'" class="'+(p[0]===cur ? 'on' : '')+'" onclick="homeLiveTabs(\''+p[0]+'\')">'+esc(p[2])+'</button>').join('');
  /* Снимок блока — в браузер: при следующем заходе оболочка ставит его сразу (скрипт под разметкой #homeLive),
     не дожидаясь app.js (15.10: «с делеем результаты появляются»). Пишется, только когда таблица сайта уже пришла. */
  if(HOME_BOARD && HOME_BOARD._at){ try{ localStorage.setItem('fd_home_live', JSON.stringify({lang:LANG, tab:cur, html:box.innerHTML.replace(/<div class="home-timer" id="homeTimer"[^>]*>[\s\S]*?<\/div>/, '<div class="home-timer" id="homeTimer" hidden></div>')})); }catch(e){} }
}
function homeBoardMe(){
  try{
    const order=[ccSlot()]; for(let n=1; n<=CC_SLOTS; n++) if(order.indexOf(n)<0) order.push(n);
    for(const n of order){ const sv=ccSlotRead(n); const id=sv && sv.career && sv.career.board && !sv.career.board.off && sv.career.board.id; if(id) return id; }
  }catch(e){}
  return '';
}
function homeBoardDraw(){
  const box=document.getElementById('homeBoard'); if(!box) return;
  const T=L(), base=ccBoardBase();
  if(!base){ box.hidden=true; return; }
  box.hidden=false;
  const d=HOME_BOARD;
  if(!d || (!d._busy && Date.now()-(d._at||0) > 60000)){
    if(d) d._busy=true; else HOME_BOARD={_busy:true, _at:0};
    // Своя строка — по id карьеры из сейва (активный слот первым): сервер отвечает местом (you), как во вкладке карьеры.
    const me=homeBoardMe();
    fetch(base+'?'+(HOME_BOARD_SORT ? 'sort='+HOME_BOARD_SORT+'&' : '')+(me ? 'me='+encodeURIComponent(me) : '')).then(r=>r.ok ? r.json() : {err:true}).catch(()=>({err:true})).then(x=>{
      HOME_BOARD=Object.assign(x||{err:true}, {_at:Date.now()});
      homeBoardDraw();
      try{ homeLiveTabs(); }catch(e){}
    });
  }
  /* Вкладки турниры / все призы (игрок 2.11: «призы только с турниров и вторая вкладка все призы»). */
  const head='<h2 class="home-h">'+esc(T.lbTab)+'</h2><p class="home-sub">'+esc(HOME_BOARD_SORT==='all' ? T.lbAllNote : HOME_BOARD_SORT==='inc' ? T.lbIncNote : T.lbCupNote)+'</p>'+
    '<div class="hb-tabs">'+[[null, T.lbByEarn], ['all', T.lbByAll], ['inc', T.lbByInc]].map(([k,t])=>'<button type="button" class="'+(HOME_BOARD_SORT===k ? 'on' : '')+'" onclick="homeBoardSort('+(k ? '\''+k+'\'' : 'null')+')">'+esc(t)+'</button>').join('')+'</div>';
  if(!d || !d._at){ box.innerHTML=head+'<p class="home-sub">'+esc(T.lbLoad)+'</p>'; return; }
  if(d.err){ box.innerHTML=head+'<p class="home-sub">'+esc(T.lbErr)+'</p>'; return; }
  const seen=new Set(), rows=(d.rows||[]).filter(r=>{ const k=[r.nick, r.region, r.country, r.seasons, r.earn, r.titles].join('|');
    if(seen.has(k)) return false; seen.add(k); return true; });
  if(!rows.length){ box.innerHTML=head+'<p class="home-sub">'+esc(T.lbEmpty)+'</p>'; return; }
  HOME_BOARD_ROWS=rows;
  // Своё место — ссылкой на свою страницу списка.
  const you=d.you && d.you.rank ? '<button type="button" class="hb-me" onclick="homeBoardList('+Math.floor((d.you.rank-1)/(d.per||100))+')">'+esc(T.lbYou(d.you.rank, d.total||rows.length))+'</button>' : '';
  box.innerHTML=head+'<div>'+homeBoardRowsHTML(rows.slice(0, 10))+'</div>'+you+
    (rows.length>10 ? '<button class="home-more" type="button" onclick="homeBoardList(0)">'+esc(T.hmBoardList)+'</button>' : '');
}
let HOME_BOARD_ROWS=[];
function homeBoardRowsHTML(rows, from, sort){
  const T=L(), flag=c=>c ? '<img src="flags/w20/'+esc(ccCountryOf(c))+'.png" alt="" onerror="this.remove()">' : '';
  const srt=(sort===undefined ? HOME_BOARD_SORT : sort), all=srt==='all', inc=srt==='inc';
  return rows.map((r,i)=>'<div class="hb-row'+(r.you ? ' me' : '')+'"><i>'+((from||0)+i+1)+'</i><b>'+flag(r.country)+esc(r.nick)+
    '<small>'+esc(r.region||'')+' · '+esc(T.lbSeasons(r.seasons))+'</small></b><span>$'+ccNum(inc ? (r.income||0) : all && r.earnAll!=null ? r.earnAll : r.earn)+'</span></div>').join('');
}
function homeBoardSort(k){ HOME_BOARD_SORT=k||null; HOME_BOARD=null; homeBoardDraw(); }
/* Весь список поверх экрана, по 100 мест со стрелками (игрок 2.11: «ничего не листается» — было только «Показать 50»).
   Страница читается с сервера (?page=), своя строка подсвечена. */
function homeBoardList(page){
  const T=L(), base=ccBoardBase(); if(!base) return;
  page=Math.max(0, page|0);
  const sort=HOME_BOARD_SORT, me=homeBoardMe();
  const draw=(inner)=>{
    let m=document.getElementById('homeRealModal');
    if(!m){
      m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
      m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
      document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
      document.body.appendChild(m);
    }
    m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(T.lbTab)+'">'+
      '<div class="hr-top"><b>'+esc(T.lbTab)+' · '+esc(sort==='all' ? T.lbByAll : T.lbByEarn)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
      '<div class="hr-wrap">'+inner+'</div></div>';
    document.body.classList.add('hr-lock');
  };
  const key=(sort||'')+'|'+page;
  HOME_BOARD_LIST=key;
  draw('<p class="home-sub">'+esc(T.lbLoad)+'</p>');
  fetch(base+'?'+(sort ? 'sort='+sort+'&' : '')+'page='+page+(me ? '&me='+encodeURIComponent(me) : '')).then(r=>r.ok ? r.json() : {err:true}).catch(()=>({err:true})).then(x=>{
    if(HOME_BOARD_LIST!==key || !document.getElementById('homeRealModal')) return;
    if(!x || x.err){ draw('<p class="home-sub">'+esc(T.lbErr)+'</p>'); return; }
    const per=x.per||100, total=x.total||0, pages=Math.max(1, Math.ceil(total/per)), pg=x.page||0;
    const nav='<div class="hb-pages"><button type="button"'+(pg>0 ? '' : ' disabled')+' onclick="homeBoardList('+(pg-1)+')" aria-label="‹">‹</button>'+
      '<span>'+esc(T.lbPage(pg*per+1, Math.min(total, (pg+1)*per), total))+'</span>'+
      '<button type="button"'+(pg<pages-1 ? '' : ' disabled')+' onclick="homeBoardList('+(pg+1)+')" aria-label="›">›</button></div>';
    draw(nav+'<div>'+homeBoardRowsHTML(x.rows||[], pg*per, sort)+'</div>'+nav);
    const box=document.querySelector('#homeRealModal .hr-wrap'); if(box) box.scrollTop=0;
  });
}
/* «Показать 50» — списком поверх экрана, а не раскрытием колонки (16.10: «когда жмёшь топ 50, пусть поверх экрана будет список»). */
function homeListOpen(kind){
  const T=L(), earn=kind==='earn';
  const title=earn ? T.hmEarnTitle : T.lbTab;
  const body=earn ? '<div class="he-list">'+homeEarnRowsHTML(HOME_EARN_LQ.slice(0, 50))+'</div>'
                  : '<div>'+homeBoardRowsHTML(HOME_BOARD_ROWS.slice(0, 50))+'</div>';
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">'+
    '<div class="hr-top"><b>'+esc(title)+' · '+esc(T.hmTop50)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    '<div class="hr-wrap">'+body+'</div></div>';
  document.body.classList.add('hr-lock');
}
/* Кнопка карьеры на главной: есть сохранённая карьера — «Продолжить», а не «Начать» (игрок 9.10: «closed my browser on my
   phone and opened it back up and there wasnt an option to continue my career» — кнопка вела к списку карьер, но звалась
   «Start a career»). */
function ccHeroCareerText(){
  try{ let has=false; for(let n=1; n<=CC_SLOTS && !has; n++) has=!!ccSlotCard(n);
    const el=document.querySelector('.hero-cta .hero-btn-go span[data-i18n]');
    if(el) el.textContent=(has && L().heroCareerCont) ? L().heroCareerCont : L().heroCareer; }catch(e){}
  try{ homeRender(); }catch(e){}
}
// Главная рисуется сразу после загрузки app.js (раньше это делал mgrHeroText из mgr.js — то есть никогда до входа в менеджер).
setTimeout(function(){ try{ ccHeroCareerText(); }catch(e){} }, 0);
/* Больше или меньше: два настоящих игрока, кто выше. Вопросы только из данных сайта: место в одном и том же
   финале (карточки PLAYERS_BASE с местом) и призовые 2026 по Liquipedia (HOME_EARN_LQ). Серия до первой ошибки,
   рекорд на устройстве. Адрес #hl открывает экран сразу. */
let HL=null;
const HL_BEST_KEY='fncsdraft_hl_best', HL_EARN_SHARE=0.25;
/* Призовые за всё время, Liquipedia Portal:Statistics/Player_earnings и /Team_earnings, от $20k. Обновлять:
   tools/build-hl-alltime.js (переписывает три строки ниже). n ник/клуб, c флаг, e $. */
const HL_ALL_P=[{"n":"Bugha","e":3858272,"c":"us"},{"n":"aqua","e":2201771,"c":"at"},{"n":"EpikWhale","e":2002846,"c":"us"},{"n":"psalm","e":1880342,"c":"us"},{"n":"Kami","e":1866656,"c":"pl"},{"n":"Malibuca","e":1659683,"c":"ru"},{"n":"Anas","e":1659666,"c":"dk"},{"n":"Queasy","e":1563823,"c":"rs"},{"n":"nyhrox","e":1545653,"c":"no"},{"n":"Th0masHD","e":1543549,"c":"dk"},{"n":"Setty","e":1381717,"c":"pl"},{"n":"Wolfiez","e":1369221,"c":"gb"},{"n":"TaySon","e":1338352,"c":"si"},{"n":"K1nG","e":1333814,"c":"ar"},{"n":"Peterbot","e":1286970,"c":"us"},{"n":"Kreo","e":1277756,"c":"us"},{"n":"Saf","e":1242695,"c":"us"},{"n":"Ceice","e":1242324,"c":"us"},{"n":"Rojo","e":1226113,"c":"nl"},{"n":"Zayt","e":1214505,"c":"ca"},{"n":"Veno","e":1176811,"c":"gb"},{"n":"Acorn","e":1139980,"c":"ca"},{"n":"Mero","e":1112128,"c":"ca"},{"n":"vic0","e":1067690,"c":"at"},{"n":"Elevate","e":995938,"c":"ca"},{"n":"Cold","e":971147,"c":"us"},{"n":"SwizzY","e":967469,"c":"ru"},{"n":"Khanada","e":953923,"c":"us"},{"n":"JannisZ","e":934329,"c":"de"},{"n":"Merstach","e":930200,"c":"lv"},{"n":"Pollo","e":905885,"c":"mx"},{"n":"Pixie","e":903021,"c":"se"},{"n":"Skite","e":899796,"c":"fr"},{"n":"Clix","e":886854,"c":"us"},{"n":"Arkhram","e":853753,"c":"us"},{"n":"Mitr0","e":824585,"c":"nl"},{"n":"Cooper","e":805640,"c":"us"},{"n":"Hen","e":802739,"c":"lt"},{"n":"chapix","e":789457,"c":"se"},{"n":"Mongraal","e":761071,"c":"gb"},{"n":"t3eny","e":758725,"c":"si"},{"n":"Ajerss","e":753890,"c":"us"},{"n":"TruleX","e":750783,"c":"rs"},{"n":"Vadeal","e":723237,"c":"de"},{"n":"Bizzle","e":713928,"c":"us"},{"n":"crue","e":712180,"c":"se"},{"n":"MrSavage","e":702299,"c":"no"},{"n":"Edgey","e":690272,"c":"us"},{"n":"Tfue","e":689377,"c":"us"},{"n":"rezon ay","e":661402,"c":"de"},{"n":"Ritual","e":652975,"c":"us"},{"n":"Stompy","e":649716,"c":"at"},{"n":"Chico","e":638527,"c":"ba"},{"n":"benjyfishy","e":634024,"c":"gb"},{"n":"Flickzy","e":610395,"c":"de"},{"n":"Dubs","e":592374,"c":"us"},{"n":"nayte","e":583613,"c":"fr"},{"n":"Andilex","e":582851,"c":"fr"},{"n":"Vanyak3kk","e":560740,"c":"ua"},{"n":"Japko","e":554648,"c":"pl"},{"n":"Commandment","e":542412,"c":"us"},{"n":"Reet","e":541680,"c":"us"},{"n":"Muz","e":528008,"c":"au"},{"n":"Cented","e":525851,"c":"ca"},{"n":"ZexRow","e":525511,"c":"us"},{"n":"teeq","e":525315,"c":"pl"},{"n":"Falconer","e":524740,"c":"us"},{"n":"shxrk","e":517351,"c":"ro"},{"n":"Pinq","e":514154,"c":"gb"},{"n":"Trippernn","e":508883,"c":"dk"},{"n":"Boltz","e":497583,"c":"us"},{"n":"Nate Hill","e":497479,"c":"us"},{"n":"Eomzo","e":482509,"c":"ca"},{"n":"PabloWingu","e":465109,"c":"dk"},{"n":"cloakzy","e":441825,"c":"us"},{"n":"MackWood","e":436183,"c":"us"},{"n":"Megga","e":430266,"c":"us"},{"n":"Riversan","e":429213,"c":"us"},{"n":"Vivid","e":426292,"c":"us"},{"n":"Dukez","e":425002,"c":"mx"},{"n":"Rapid","e":424400,"c":"ca"},{"n":"Kiryache32","e":414652,"c":"ru"},{"n":"Scroll","e":414280,"c":"dk"},{"n":"Refsgaard","e":405865,"c":"dk"},{"n":"Kinstaar","e":405184,"c":"ch"},{"n":"Higgs","e":400355,"c":"us"},{"n":"Noahreyli","e":390225,"c":"ch"},{"n":"Sky","e":388977,"c":"dk"},{"n":"Reverse2k","e":388902,"c":"us"},{"n":"Tjino","e":385264,"c":"dk"},{"n":"MariusCOW","e":385059,"c":"dk"},{"n":"Chap","e":382697,"c":"us"},{"n":"Phzin","e":379417,"c":"br"},{"n":"Threats","e":377955,"c":"cu"},{"n":"Rise","e":376040,"c":"ca"},{"n":"k1nzell","e":376010,"c":"si"},{"n":"charyy","e":367170,"c":"pl"},{"n":"Deyy","e":354932,"c":"us"},{"n":"72hrs","e":352583,"c":"us"},{"n":"Fatch","e":351710,"c":"ca"},{"n":"Cizzorz","e":345750,"c":"us"},{"n":"Stormyrite","e":342734,"c":"ua"},{"n":"hiimtylerh","e":341250,"c":"ca"},{"n":"Zand","e":341250,"c":"dk"},{"n":"Suezhoo","e":341250,"c":"be"},{"n":"IDrop","e":340712,"c":"no"},{"n":"Tschinken","e":340399,"c":"at"},{"n":"POACH","e":332400,"c":"us"},{"n":"Vinny1x","e":328867,"c":"us"},{"n":"Endretta","e":325576,"c":"no"},{"n":"zAndy","e":324843,"c":"ro"},{"n":"Skram","e":324065,"c":"dk"},{"n":"Bucke","e":324048,"c":"us"},{"n":"Funk","e":322360,"c":"us"},{"n":"Slackes","e":321236,"c":"us"},{"n":"Snayzy","e":321116,"c":"fr"},{"n":"Hero","e":319331,"c":"sa"},{"n":"Avery","e":316894,"c":"ca"},{"n":"Nebs","e":314913,"c":"gb"},{"n":"P1ng","e":301532,"c":"ua"},{"n":"Toose","e":298588,"c":"ru"},{"n":"Seeyun","e":297244,"c":"br"},{"n":"Wox","e":295582,"c":"se"},{"n":"Hellfire","e":291800,"c":"dk"},{"n":"xsweeze","e":289237,"c":"fr"},{"n":"Jamper","e":286925,"c":"us"},{"n":"Stretch","e":285595,"c":"us"},{"n":"Aspect","e":285047,"c":"us"},{"n":"Sphinx","e":280400,"c":"us"},{"n":"Domentos","e":275475,"c":"lv"},{"n":"KING","e":274238,"c":"br"},{"n":"Morgausse","e":272449,"c":"us"},{"n":"BadSniper","e":272363,"c":"fr"},{"n":"Vato","e":272313,"c":"ch"},{"n":"Kurtz","e":271722,"c":"br"},{"n":"jahq","e":270754,"c":"us"},{"n":"volx","e":269942,"c":"au"},{"n":"skqttles","e":267266,"c":"us"},{"n":"rehx","e":266268,"c":"us"},{"n":"Decyptos","e":265054,"c":"fr"},{"n":"Darm","e":263511,"c":"pl"},{"n":"wakie","e":259776,"c":"se"},{"n":"Flikk","e":258921,"c":"dk"},{"n":"4zr","e":257733,"c":"ch"},{"n":"Avivv","e":257001,"c":"ca"},{"n":"yung calculator","e":256026,"c":"us"},{"n":"Alex","e":250163,"c":"au"},{"n":"Dmo","e":250025,"c":"us"},{"n":"Cadu","e":247323,"c":"br"},{"n":"Parz","e":245717,"c":"us"},{"n":"Kitoz","e":244123,"c":"br"},{"n":"Hunter","e":243323,"c":"fr"},{"n":"Bacca","e":243208,"c":"us"},{"n":"Clement","e":243084,"c":"fr"},{"n":"Putrick","e":240931,"c":"ru"},{"n":"FHD","e":238135,"c":"sa"},{"n":"Frosty","e":234711,"c":"br"},{"n":"PXMP","e":234665,"c":"us"},{"n":"Fredoxie","e":234454,"c":"dk"},{"n":"Cheatiin","e":233037,"c":"de"},{"n":"Nicks","e":227452,"c":"br"},{"n":"Svennoss","e":226033,"c":"nl"},{"n":"panzer","e":223382,"c":"ru"},{"n":"Fastroki","e":220349,"c":"de"},{"n":"Brycx","e":219563,"c":"us"},{"n":"EdRoadToGlory","e":217972,"c":"br"},{"n":"Aydan","e":216033,"c":"us"},{"n":"Pate1k","e":213724,"c":"no"},{"n":"Nikof","e":212752,"c":"fr"},{"n":"Fazer","e":212587,"c":"ar"},{"n":"Airwaks","e":211743,"c":"ch"},{"n":"Rhux","e":211250,"c":"us"},{"n":"itemm","e":210885,"c":"gb"},{"n":"Demus","e":209719,"c":"pl"},{"n":"Peterpan","e":208814,"c":"kr"},{"n":"Kwanti","e":208235,"c":"us"},{"n":"Floki","e":207208,"c":"fr"},{"n":"Degen","e":206583,"c":"us"},{"n":"Persa","e":206277,"c":"br"},{"n":"Boyer","e":206057,"c":"dk"},{"n":"Jamside","e":205793,"c":"ru"},{"n":"Tragix","e":205405,"c":"us"},{"n":"LeTsHe","e":205157,"c":"de"},{"n":"Unknown","e":204158,"c":"us"},{"n":"Nut","e":201627,"c":"mx"},{"n":"letw1k3","e":200827,"c":"ru"},{"n":"Furious","e":198269,"c":"us"},{"n":"KBR","e":197201,"c":"br"},{"n":"Fishy","e":195865,"c":"ar"},{"n":"Derox","e":195434,"c":"de"},{"n":"worthy","e":195273,"c":"au"},{"n":"fwexY","e":194814,"c":"de"},{"n":"7ssk7","e":193885,"c":"by"},{"n":"clarityG","e":192775,"c":"us"},{"n":"Diguera","e":192433,"c":"br"},{"n":"Mikson","e":190860,"c":"pl"},{"n":"verT","e":190414,"c":"us"},{"n":"WeY","e":189580,"c":"br"},{"n":"znappy","e":189287,"c":"se"},{"n":"Trashy","e":189013,"c":"us"},{"n":"PaMstou","e":187412,"c":"ca"},{"n":"Xeat","e":187074,"c":"br"},{"n":"Pika","e":186550,"c":"us"},{"n":"Koyota","e":184924,"c":"jp"},{"n":"Chubs","e":184503,"c":"us"},{"n":"blakeps","e":183493,"c":"us"},{"n":"Kiro","e":182864,"c":"nl"},{"n":"Kamo","e":182827,"c":"de"},{"n":"Jordan","e":181777,"c":"au"},{"n":"Noward","e":180796,"c":"be"},{"n":"Teeqzy","e":180367,"c":"be"},{"n":"leleo","e":179875,"c":"br"},{"n":"Okis","e":178320,"c":"us"},{"n":"Bylah","e":178052,"c":"us"},{"n":"Maufin","e":177341,"c":"jp"},{"n":"Redlee","e":177019,"c":"br"},{"n":"Tendons","e":176925,"c":"us"},{"n":"Verox","e":175585,"c":"gb"},{"n":"CizLucky","e":174934,"c":"us"},{"n":"favs","e":174866,"c":"ca"},{"n":"Jur3ky","e":174171,"c":"hr"},{"n":"Tchub","e":173865,"c":"se"},{"n":"4DRStorm","e":173453,"c":"us"},{"n":"PodaSai","e":171284,"c":"fr"},{"n":"Laizen","e":170976,"c":"fr"},{"n":"BELAEU","e":170421,"c":"fi"},{"n":"Jesse","e":168322,"c":"au"},{"n":"Bevvys","e":167773,"c":"se"},{"n":"Shadow","e":167403,"c":"us"},{"n":"CouRage","e":166888,"c":"us"},{"n":"7man","e":166858,"c":"bh"},{"n":"Snacky","e":166659,"c":"mx"},{"n":"FoCuS","e":166556,"c":"il"},{"n":"Yuma","e":165242,"c":"jp"},{"n":"FlowiS","e":164602,"c":"dk"},{"n":"Sean","e":164133,"c":"ca"},{"n":"RedRush","e":163734,"c":"lt"},{"n":"IAmNoob","e":163085,"c":"ie"},{"n":"RogueShark","e":162997,"c":"us"},{"n":"Ruri","e":162692,"c":"jp"},{"n":"OPai","e":161649,"c":"br"},{"n":"Blax","e":161399,"c":"fr"},{"n":"Jynx","e":160908,"c":"au"},{"n":"Vortex","e":160749,"c":"de"},{"n":"Scoped","e":160264,"c":"us"},{"n":"Kalgamer710","e":160043,"c":"sa"},{"n":"GntL","e":158648,"c":"sa"},{"n":"LeNain","e":157975,"c":"ca"},{"n":"Momsy","e":157338,"c":"fr"},{"n":"Curve","e":157200,"c":"us"},{"n":"Typical Gamer","e":157128,"c":"ca"},{"n":"Chimp","e":156378,"c":"us"},{"n":"Shelom","e":156313,"c":"jp"},{"n":"Ninja","e":155564,"c":"us"},{"n":"wavyjacob","e":154795,"c":"us"},{"n":"Qjac","e":154295,"c":"jp"},{"n":"Cr1nge","e":154229,"c":""},{"n":"Jay","e":154197,"c":"us"},{"n":"Casqer","e":153991,"c":"us"},{"n":"Lanjok","e":153367,"c":"us"},{"n":"Scarpa","e":152139,"c":"br"},{"n":"NICKMERCS","e":150500,"c":"us"},{"n":"Gotaga","e":150213,"c":"fr"},{"n":"Tkay","e":149962,"c":"do"},{"n":"Klusia","e":149060,"c":"dk"},{"n":"Issa","e":148815,"c":"ch"},{"n":"Paper","e":148586,"c":"in"},{"n":"Nov1ce","e":147419,"c":"br"},{"n":"histtory","e":147207,"c":"br"},{"n":"Umplify","e":146998,"c":"nl"},{"n":"TheVic","e":146656,"c":"fr"},{"n":"Mappi","e":146560,"c":"se"},{"n":"Sommerset","e":145307,"c":"us"},{"n":"NM7","e":145167,"c":"sa"},{"n":"Blacha","e":144816,"c":"pl"},{"n":"Adapter","e":144358,"c":"sa"},{"n":"FKS","e":144050,"c":"sa"},{"n":"Loserfruit","e":143898,"c":"au"},{"n":"artor","e":143495,"c":"pl"},{"n":"1lusha","e":143242,"c":"ru"},{"n":"GSX","e":143225,"c":"br"},{"n":"Blind","e":143100,"c":"us"},{"n":"Punisher","e":141814,"c":"fr"},{"n":"pixx","e":141755,"c":"pl"},{"n":"SkyJump","e":141576,"c":"fr"},{"n":"Escdark","e":141436,"c":"bh"},{"n":"Symfuhny","e":141242,"c":"us"},{"n":"crr","e":140680,"c":"gb"},{"n":"Looter","e":139616,"c":"au"},{"n":"Mkmkpapa","e":137725,"c":"jp"},{"n":"JoeFN","e":137390,"c":""},{"n":"Romero","e":136745,"c":"ar"},{"n":"Robban","e":136312,"c":"se"},{"n":"Assault","e":135860,"c":"us"},{"n":"Pepoclip","e":135608,"c":"jp"},{"n":"G13ras","e":134629,"c":"pl"},{"n":"Axeforce","e":134569,"c":"se"},{"n":"Merijn","e":133794,"c":"nl"},{"n":"RazZzero0o","e":132773,"c":"de"},{"n":"Visxals","e":132266,"c":"us"},{"n":"wisheydp","e":131704,"c":"br"},{"n":"Mexe","e":131295,"c":"gb"},{"n":"Ronaldo","e":130308,"c":"us"},{"n":"Juu","e":130232,"c":"de"},{"n":"thwifo","e":129610,"c":"us"},{"n":"Karmy","e":129351,"c":"ee"},{"n":"Destru","e":129332,"c":"fr"},{"n":"Zagou","e":128906,"c":"jp"},{"n":"Barroso","e":126728,"c":"br"},{"n":"Anon","e":126524,"c":"au"},{"n":"SypherPK","e":124503,"c":"us"},{"n":"Twi","e":124092,"c":"gb"},{"n":"916Gon","e":123298,"c":"br"},{"n":"AirkNn","e":123072,"c":"fr"},{"n":"Nittle","e":122828,"c":"us"},{"n":"Talls","e":122786,"c":"ar"},{"n":"VicterV","e":122481,"c":"us"},{"n":"Thiefs","e":122359,"c":"us"},{"n":"DeRoller","e":122135,"c":"us"},{"n":"Nxthan","e":121663,"c":"gb"},{"n":"Animal","e":121472,"c":"us"},{"n":"Eclipsae","e":121430,"c":"us"},{"n":"Sanku","e":121276,"c":"ar"},{"n":"Spy","e":121031,"c":"sa"},{"n":"Lachlan","e":121017,"c":"au"},{"n":"SaLva","e":120770,"c":"sa"},{"n":"RustyK","e":120442,"c":"ar"},{"n":"elokratz","e":118914,"c":"dk"},{"n":"Breso","e":118132,"c":"au"},{"n":"Cyrzr","e":118070,"c":"mx"},{"n":"Kurama","e":118038,"c":"fr"},{"n":"Lewa","e":117065,"c":"ar"},{"n":"Link","e":116507,"c":"nz"},{"n":"Yasir","e":115740,"c":"mx"},{"n":"BlastR","e":115605,"c":"fr"},{"n":"VortexM","e":115313,"c":"au"},{"n":"beehive","e":115278,"c":"se"},{"n":"Tuckz","e":114370,"c":"gb"},{"n":"Crimz","e":114277,"c":"us"},{"n":"Cam","e":113973,"c":"pa"},{"n":"Astonish","e":113900,"c":"us"},{"n":"BlooTea","e":113785,"c":"us"},{"n":"Yonx","e":113339,"c":"sa"},{"n":"Rocaine","e":113293,"c":"ca"},{"n":"Illest","e":112836,"c":"us"},{"n":"iDroPz_BoDiEs","e":112500,"c":"us"},{"n":"Michael","e":111835,"c":"gb"},{"n":"Zemie","e":111626,"c":"us"},{"n":"Alice","e":110819,"c":"jp"},{"n":"Nick Eh 30","e":110636,"c":"ca"},{"n":"Pixovsky","e":110635,"c":"pl"},{"n":"Kiduoo","e":110302,"c":"de"},{"n":"parpy","e":109758,"c":"nz"},{"n":"npen","e":109168,"c":"us"},{"n":"Tyler15","e":109135,"c":"us"},{"n":"Minipiyo","e":109127,"c":"jp"},{"n":"DrakoNz","e":108717,"c":"br"},{"n":"zoreh","e":108666,"c":"nz"},{"n":"Ritz","e":108470,"c":"se"},{"n":"BlackoutZ","e":107982,"c":"br"},{"n":"Tisco","e":107706,"c":"ar"},{"n":"Edson","e":107347,"c":"br"},{"n":"Filipe","e":107139,"c":"br"},{"n":"Phantom","e":106864,"c":"sa"},{"n":"Matsoe","e":106672,"c":"nl"},{"n":"Klass","e":106515,"c":"us"},{"n":"Klown","e":106403,"c":"se"},{"n":"Snood","e":106275,"c":"us"},{"n":"Rainy","e":105227,"c":"jp"},{"n":"Jelty","e":105190,"c":"mx"},{"n":"xMipoli","e":105059,"c":"jp"},{"n":"Zangi","e":105020,"c":"it"},{"n":"Vortexers","e":104955,"c":"gb"},{"n":"Gabzera","e":104643,"c":"br"},{"n":"Flame","e":104510,"c":"pl"},{"n":"Pulga","e":104371,"c":"br"},{"n":"Av","e":103675,"c":"us"},{"n":"Stryker","e":103134,"c":"br"},{"n":"Legedien","e":102525,"c":"us"},{"n":"Riquee","e":102109,"c":"ar"},{"n":"KingRichard","e":102008,"c":"us"},{"n":"Resignz","e":101875,"c":"au"},{"n":"MagMa","e":101802,"c":"au"},{"n":"Runa","e":101739,"c":"jp"},{"n":"FaxFox","e":101500,"c":"kr"},{"n":"Moxie","e":101200,"c":"mx"},{"n":"Nutifps","e":99949,"c":"br"},{"n":"Swag","e":99203,"c":"dk"},{"n":"Aminished","e":99123,"c":"us"},{"n":"DRG","e":98693,"c":"be"},{"n":"Frapai","e":98650,"c":"us"},{"n":"Blacky","e":98473,"c":"fr"},{"n":"Buyuriru","e":98252,"c":"jp"},{"n":"Kraez","e":98175,"c":"us"},{"n":"Drobbаn","e":98113,"c":"se"},{"n":"Danath","e":98017,"c":"au"},{"n":"H4wwk","e":97825,"c":"br"},{"n":"Skits","e":97762,"c":"au"},{"n":"Naetor","e":97725,"c":"jp"},{"n":"Retake","e":97607,"c":"br"},{"n":"Deadra","e":97594,"c":"fr"},{"n":"RoAtDW","e":97235,"c":"us"},{"n":"Suns","e":97220,"c":"au"},{"n":"Cazi","e":97122,"c":"nz"},{"n":"Kylie","e":96914,"c":"tr"},{"n":"Spades","e":96903,"c":"us"},{"n":"Vergo","e":96793,"c":"us"},{"n":"Knight","e":96726,"c":"us"},{"n":"Braydz","e":96580,"c":"us"},{"n":"Dog","e":96416,"c":"us"},{"n":"Xccept","e":96254,"c":"ca"},{"n":"Snowvaks","e":95934,"c":"lb"},{"n":"Clipnode","e":95715,"c":"ar"},{"n":"Leno","e":95642,"c":"us"},{"n":"Moneymaker","e":95532,"c":"se"},{"n":"slaya","e":95506,"c":"nz"},{"n":"MOTOR","e":95343,"c":"tr"},{"n":"xOwN","e":95267,"c":"ar"},{"n":"nosh","e":95128,"c":"ca"},{"n":"Hottie","e":94660,"c":"dk"},{"n":"little","e":94520,"c":"us"},{"n":"Rew","e":94366,"c":"sa"},{"n":"Huizhi","e":94250,"c":"tr"},{"n":"Symetrical","e":94104,"c":"us"},{"n":"Mshary","e":94062,"c":"kw"},{"n":"Magl","e":93685,"c":"fr"},{"n":"Ark","e":93648,"c":"us"},{"n":"Lasers","e":93633,"c":"br"},{"n":"Cringe","e":93628,"c":"ch"},{"n":"Hood.J","e":93600,"c":"kr"},{"n":"Coop","e":93454,"c":"us"},{"n":"Akiira","e":93445,"c":"fr"},{"n":"Kejser","e":92895,"c":"dk"},{"n":"Kouto","e":92850,"c":"fr"},{"n":"Hijoe","e":92550,"c":"de"},{"n":"Kayuun","e":92225,"c":"us"},{"n":"Tennp0","e":91950,"c":"us"},{"n":"Hellonsteam","e":91914,"c":"pk"},{"n":"Hysteria","e":91700,"c":"us"},{"n":"Night","e":91638,"c":"br"},{"n":"Robabz","e":91398,"c":"fr"},{"n":"Ranger","e":91397,"c":"ca"},{"n":"Draceus","e":91250,"c":"se"},{"n":"Dela","e":91163,"c":"se"},{"n":"M11Z","e":91008,"c":"fr"},{"n":"Muselk","e":90998,"c":"au"},{"n":"Ghoul","e":90825,"c":"ca"},{"n":"Lnuef","e":90720,"c":"nl"},{"n":"Sorif","e":90602,"c":"au"},{"n":"Kayky","e":90418,"c":"br"},{"n":"Fury Legendary","e":90355,"c":"ru"},{"n":"Rapit","e":90271,"c":"kw"},{"n":"Tecne","e":90154,"c":"ar"},{"n":"Nolan","e":90135,"c":"us"},{"n":"Skailer","e":90045,"c":"cz"},{"n":"Herrions","e":89783,"c":"us"},{"n":"Rakso","e":89768,"c":"pl"},{"n":"Hornet","e":89385,"c":"us"},{"n":"Resypical","e":89293,"c":"us"},{"n":"Oatley","e":89064,"c":"au"},{"n":"Salko","e":89000,"c":"us"},{"n":"Vorwenn","e":88995,"c":"es"},{"n":"Hogman","e":88942,"c":"us"},{"n":"Hris","e":88919,"c":"mk"},{"n":"Raifla","e":88840,"c":"fi"},{"n":"Regsita","e":88792,"c":"mx"},{"n":"Noxy","e":88642,"c":"us"},{"n":"Fnajen","e":88635,"c":"se"},{"n":"Mansour","e":88521,"c":"sa"},{"n":"Sangild","e":88353,"c":"dk"},{"n":"Fraanticc","e":88350,"c":"us"},{"n":"Amar","e":88226,"c":"de"},{"n":"Keroro","e":88081,"c":"es"},{"n":"Jacob4TV","e":88029,"c":"pl"},{"n":"L3ST3RMZRGS","e":87500,"c":"gt"},{"n":"Jordan Fisher","e":87500,"c":"us"},{"n":"Myth","e":87433,"c":"us"},{"n":"Czb","e":87309,"c":"gb"},{"n":"FuuKun","e":87164,"c":"jp"},{"n":"Keys","e":87121,"c":"us"},{"n":"ilyynina","e":86960,"c":"us"},{"n":"Jace","e":86594,"c":"au"},{"n":"Tomoya","e":86250,"c":"jp"},{"n":"Fledermoys","e":86086,"c":"de"},{"n":"Volko","e":86054,"c":"de"},{"n":"Revised","e":85875,"c":"us"},{"n":"RichHomieQuinn","e":85841,"c":"us"},{"n":"Mojak","e":85526,"c":"br"},{"n":"Fray","e":85429,"c":"de"},{"n":"art1er","e":85250,"c":"de"},{"n":"Packo","e":85028,"c":"pl"},{"n":"vanessuh","e":85000,"c":"us"},{"n":"Sxhool","e":84980,"c":"us"},{"n":"Fresh","e":84921,"c":"au"},{"n":"Shamokiy","e":84648,"c":"ru"},{"n":"RizArt","e":84638,"c":"jp"},{"n":"QnDx","e":84603,"c":"om"}];
const HL_ALL_T=[{"n":"FaZe Clan","e":4635700},{"n":"NRG","e":4592147},{"n":"Sentinels","e":4114758},{"n":"Team Falcons","e":3888494},{"n":"COOLER Esport","e":3742426},{"n":"Lazarus","e":3714968},{"n":"100 Thieves","e":3713116},{"n":"Guild Esports","e":3206091},{"n":"Ghost Gaming","e":3068598},{"n":"Team Liquid","e":2644750},{"n":"XSET","e":2544811},{"n":"TSM","e":2201940},{"n":"Counter Logic Gaming","e":2180194},{"n":"Dignitas","e":2060577},{"n":"Wave Esports","e":1866728},{"n":"Eleven Gaming","e":1861193},{"n":"Galaxy Racer","e":1827174},{"n":"Twisted Minds","e":1805307},{"n":"HavoK by Vitality","e":1762863},{"n":"Become Legends","e":1727207},{"n":"Solary","e":1712591},{"n":"LeStream Esport","e":1638452},{"n":"AIGHT","e":1613412},{"n":"Gentle Mates","e":1453326},{"n":"9z Team","e":1450761},{"n":"Kungarna","e":1389694},{"n":"BIG","e":1373991},{"n":"Team Atlantis","e":1245991},{"n":"Tundra Esports","e":1144010},{"n":"Elite Esports","e":1130988},{"n":"Luminosity Gaming","e":1110438},{"n":"Team 33","e":1033527},{"n":"Exceed","e":992353},{"n":"Crazy Raccoon","e":951640},{"n":"Cloud9","e":897118},{"n":"Manchester City Esports","e":834043},{"n":"Gambit Esports","e":798035},{"n":"FUSION","e":788611},{"n":"Team MCES","e":774955},{"n":"Gaimin Gladiators","e":773239},{"n":"Valhalla Vikings","e":751840},{"n":"PWR","e":716198},{"n":"Ovation eSports","e":679576},{"n":"Virtus.pro","e":674085},{"n":"Witness The Journey","e":673997},{"n":"T1","e":669284},{"n":"Aurora Gaming","e":666705},{"n":"G2 Esports","e":655237},{"n":"Karmine Corp","e":641191},{"n":"Team Atlantic","e":639286},{"n":"Team Vitality","e":618678},{"n":"Misfits Gaming","e":610094},{"n":"Team Singularity","e":604924},{"n":"Fnatic","e":568757},{"n":"Reality Zone","e":524752},{"n":"Team GO","e":524570},{"n":"TrainHard eSport","e":523567},{"n":"XTRA Gaming","e":508467},{"n":"Team New Age","e":503371},{"n":"ALBA E-sports Etajima","e":502827},{"n":"Agent Gaming","e":501480},{"n":"TheCartel Esports","e":482125},{"n":"Xen","e":478380},{"n":"Team Secret","e":473338},{"n":"Valiant","e":471489},{"n":"Riddle","e":454483},{"n":"Built By Gamers","e":452948},{"n":"Grizi Esport","e":444992},{"n":"DetonatioN FocusMe","e":441801},{"n":"HEROIC","e":413612},{"n":"Astralis","e":412432},{"n":"ZETA DIVISION","e":393983},{"n":"AJS","e":393095},{"n":"Complexity Gaming","e":392425},{"n":"All Gamers Global","e":377803},{"n":"World Best Gaming","e":375400},{"n":"Renegades","e":374360},{"n":"Gen.G Esports","e":372680},{"n":"FOKUS CLAN","e":351739},{"n":"Gamma Gaming","e":346877},{"n":"JFT Esports","e":345259},{"n":"XP42 Esports","e":342744},{"n":"Team Envy","e":336450},{"n":"SCYTES","e":333510},{"n":"Team Heretics","e":332916},{"n":"Raised by Kings","e":316041},{"n":"Outcast Region","e":314360},{"n":"Hero Base","e":314028},{"n":"Glorious Esport","e":312010},{"n":"EvozA eSport","e":306928},{"n":"Wave Esports Academy","e":306821},{"n":"Team Vanish","e":301892},{"n":"ENDLESS","e":299613},{"n":"Team SAQR","e":288062},{"n":"Rogue","e":284643},{"n":"TT9 Esports","e":270851},{"n":"Al Qadsiah","e":270430},{"n":"Centric Gaming","e":266764},{"n":"Swamp Gaming","e":262654},{"n":"Cyber Legacy","e":261245},{"n":"Copenhagen Flames","e":259039},{"n":"Tru North Gaming","e":259009},{"n":"Pipeline Esports","e":257192},{"n":"LOUD","e":251586},{"n":"Monaco Esports","e":246976},{"n":"Northern Star Gaming","e":238943},{"n":"Al Ula","e":237030},{"n":"The Ultimates","e":236502},{"n":"POWER eSports","e":235893},{"n":"Chiefs eSports Club","e":233700},{"n":"Tempo Storm","e":228825},{"n":"Team Parallel","e":221153},{"n":"LND Esports","e":217712},{"n":"Team Vikings","e":215665},{"n":"Excel Esports","e":214128},{"n":"Lyost Esport","e":205064},{"n":"Fear Esports","e":201625},{"n":"Team Honor","e":199271},{"n":"Chronic","e":199101},{"n":"Executors One","e":194125},{"n":"Ninjas in Pyjamas","e":193989},{"n":"F4TALITY","e":190667},{"n":"Millenium Salty","e":190200},{"n":"Team Kinguin","e":188343},{"n":"Supremacy","e":183559},{"n":"00 Nation","e":182888},{"n":"Helsinki REDS","e":182660},{"n":"Limit Esports","e":182161},{"n":"Orkadia Esports","e":180238},{"n":"M10 eSports","e":179316},{"n":"RVL ESPORT","e":177662},{"n":"Matrix Gaming","e":172138},{"n":"Vision Esports","e":171493},{"n":"Triple Esports","e":169017},{"n":"KINGS Esports","e":167001},{"n":"Natus Vincere","e":166565},{"n":"Cloud9 White","e":164375},{"n":"T6 eSports","e":163863},{"n":"MOUZ","e":163057},{"n":"Legacy Esports","e":157731},{"n":"Team Pulsar","e":152367},{"n":"Enterprise Gaming","e":152154},{"n":"Cynapse Esports","e":150065},{"n":"w7m esports","e":147819},{"n":"FURIA","e":146223},{"n":"Prodigy","e":145274},{"n":"ASMR eSports","e":144048},{"n":"devils.one","e":143086},{"n":"Alliance","e":142371},{"n":"eRa Eternity","e":140260},{"n":"Team Sarrow","e":140239},{"n":"Newbee","e":140172},{"n":"Future Talent","e":139429},{"n":"Apeks","e":138234},{"n":"FLu Esports","e":136738},{"n":"Warriors ESport","e":136353},{"n":"Team Nature","e":135753},{"n":"RED Canids","e":134742},{"n":"Focus e-Sports","e":134501},{"n":"Leviatán","e":134348},{"n":"SmokeSolid Gaming","e":134295},{"n":"Warriors Esports","e":133934},{"n":"Overt","e":132909},{"n":"Gankstars","e":129730},{"n":"Siko Esports","e":129587},{"n":"Exeed","e":129374},{"n":"AceOfSpades Esports","e":127157},{"n":"Team WS","e":125912},{"n":"FLC Clan","e":125493},{"n":"Ignite Beyond","e":122525},{"n":"Nordavind","e":121204},{"n":"Glory Esports","e":120991},{"n":"KPI Gaming","e":120372},{"n":"GodLike Esports","e":119610},{"n":"Crow Esports","e":119482},{"n":"SORIN","e":119175},{"n":"Team Summit","e":117736},{"n":"Playwell Esports","e":116905},{"n":"SoaR Gaming","e":114492},{"n":"Mind Games","e":112238},{"n":"GLORE","e":111547},{"n":"Epsilon eSports","e":111179},{"n":"Absolute First","e":109597},{"n":"Bolt Esports","e":109250},{"n":"Nester","e":108865},{"n":"HYLND","e":108238},{"n":"ShindeN","e":107772},{"n":"PSG TNA","e":107018},{"n":"A2","e":104495},{"n":"Red Bull eSports","e":103860},{"n":"Titans Esports","e":103420},{"n":"CGN Esports","e":102736},{"n":"JOGO","e":101578},{"n":"One True Army","e":100172},{"n":"LYNX e-sports","e":99544},{"n":"KoS Esports","e":98880},{"n":"Team BDS","e":98300},{"n":"Armour Esports","e":97771},{"n":"R8 Esports","e":94587},{"n":"Frantik Esports","e":93762},{"n":"Bifrost","e":92559},{"n":"QT DIG","e":92292},{"n":"Team Fourty7","e":92080},{"n":"Ultimate Warriors","e":91144},{"n":"Method","e":91011},{"n":"Team TRIBE","e":90316},{"n":"KIT Gaming Elite","e":89922},{"n":"Team Queso","e":88598},{"n":"Royalsten Esports","e":87453},{"n":"Wick eSports","e":86981},{"n":"Detect Esports","e":86448},{"n":"Saints Esports","e":86425},{"n":"FnX Esports","e":85400},{"n":"Oserv Esport","e":84667},{"n":"Continuum Esports","e":84425},{"n":"DRAGONS eSports","e":84158},{"n":"ROC Esports","e":82829},{"n":"Repulse Gaming","e":82117},{"n":"J.Storm","e":82083},{"n":"Loyal Esports","e":81648},{"n":"Lunary","e":80231},{"n":"Tricked Esport","e":80226},{"n":"Luminox Planet","e":79545},{"n":"ENTER FORCE.36","e":78170},{"n":"OpTic Gaming","e":78125},{"n":"Winstrike Team","e":76936},{"n":"Ravens Esports","e":76700},{"n":"ECV Esports","e":75077},{"n":"Team GamerLegion","e":74700},{"n":"VCTRY Esports","e":73308},{"n":"BK ROG Esports","e":72767},{"n":"Force Esports","e":72700},{"n":"Giants Gaming","e":71901},{"n":"01 Esports","e":71788},{"n":"WIZARD ESPORTS","e":70648},{"n":"THE ONE","e":69758},{"n":"Gremio Esports","e":69325},{"n":"GODSENT","e":69262},{"n":"eUnited","e":69100},{"n":"Bravado Gaming","e":68504},{"n":"Void Esports","e":68498},{"n":"Geekay Esports","e":68117},{"n":"Evils Esport","e":65415},{"n":"Delta Esports","e":65305},{"n":"Medal Esports","e":64948},{"n":"Lionscreed","e":64784},{"n":"EDGE","e":64561},{"n":"Vortex CGO","e":63371},{"n":"Team Sonic","e":62743},{"n":"ODD PLAN","e":62133},{"n":"GameWard","e":60106},{"n":"NEXUS","e":59008},{"n":"Wooka Esport","e":58220},{"n":"Esports Psycho","e":57739},{"n":"Zenn eSports","e":56939},{"n":"STRAW","e":56739},{"n":"2R-Esport","e":56523},{"n":"Onyx Ravens","e":54509},{"n":"Aspect Esport","e":54128},{"n":"Cherry Esport","e":53969},{"n":"RAK United","e":52877},{"n":"Premium Gaming","e":52779},{"n":"Marine Region","e":52213},{"n":"Sly Enterprises","e":51250},{"n":"Morning Stars","e":50925},{"n":"CoveX","e":49750},{"n":"Kosma Gaming","e":49588},{"n":"Regal Esports","e":48017},{"n":"mYinsanity","e":48017},{"n":"Uprise Esports","e":47600},{"n":"Team South","e":47532},{"n":"Baron Clan","e":46643},{"n":"PRIDE","e":45803},{"n":"Koji Gaming","e":45443},{"n":"Quadrant","e":45060},{"n":"Paradis Esport","e":43838},{"n":"EGY Esports","e":43630},{"n":"Team 33 Gaming Academy","e":43262},{"n":"GigaHub","e":43148},{"n":"Kiwi Customs","e":43058},{"n":"Stride Esports","e":43038},{"n":"MGA Esport","e":42976},{"n":"Flawless Region","e":42826},{"n":"Mizu Esports","e":42775},{"n":"RXB Esports","e":42601},{"n":"TYT Esports","e":42068},{"n":"Spacestation Gaming","e":41875},{"n":"Hawk Esports","e":41775},{"n":"Blaze E-Sports","e":41745},{"n":"Team ACTIVE","e":41409},{"n":"TRKF E-Sport","e":40730},{"n":"Team Assault","e":40623},{"n":"Cloud9 Blue","e":40000},{"n":"Chrome Realm","e":39600},{"n":"Soul Runner","e":39578},{"n":"MNRS Sports","e":39505},{"n":"Armada Esports","e":38200},{"n":"Onyx Esports","e":38068},{"n":"Devious Esports","e":37818},{"n":"RIZON","e":37734},{"n":"FISTERIA","e":37581},{"n":"Veloce Esports","e":35520},{"n":"Team Orchid","e":35513},{"n":"Rix.GG","e":35114},{"n":"Fruity Esports","e":34854},{"n":"Rival Esports","e":34151},{"n":"K13 Esport","e":34050},{"n":"VISU Gaming","e":33999},{"n":"DynastyX Esport","e":33975},{"n":"Blessed Esports","e":33725},{"n":"FNO","e":33468},{"n":"Xplosion","e":33462},{"n":"Leaf Esports","e":33225},{"n":"Clan Housen","e":33041},{"n":"Team Fury","e":32970},{"n":"OtterWorld Esport","e":32709},{"n":"Lynox Esport","e":32700},{"n":"Ry2 Esports","e":32478},{"n":"orz e-Sports","e":31996},{"n":"Exalty","e":31548},{"n":"NTO Corp","e":31183},{"n":"Isurus Gaming","e":30810},{"n":"R4 Corp","e":30632},{"n":"1P Esport","e":29136},{"n":"OBI E-sports","e":28768},{"n":"25 E-Sports","e":28756},{"n":"Trojan Esports","e":28675},{"n":"Ooredoo Thunders","e":28650},{"n":"Fluxo W7M","e":28607},{"n":"Built For Greatness","e":27134},{"n":"Saint Esports","e":27055},{"n":"B4stardos e-Sports","e":25750},{"n":"Millenium","e":25690},{"n":"Lethal Region","e":25150},{"n":"Guild Academy","e":24482},{"n":"HWP Esports","e":24445},{"n":"Natrix Esports","e":24415},{"n":"LvlUp Esports","e":24325},{"n":"BornToPlay","e":24100},{"n":"Strike Esports","e":23840},{"n":"Team LDLC","e":23432},{"n":"NOM eSports","e":23300},{"n":"Avesta Gaming","e":23129},{"n":"Gz","e":22963},{"n":"Team Nemesis","e":22547},{"n":"Myztro Gaming","e":22430},{"n":"Sudor Esports","e":22320},{"n":"DAMWON Gaming","e":22290},{"n":"GT Esports","e":22286},{"n":"Faid Club","e":21879},{"n":"Team Stallions","e":21166},{"n":"Solary Academy","e":20854},{"n":"STELF","e":20707},{"n":"Lucky e-Sports","e":20634},{"n":"Shark Esports","e":20520},{"n":"Past Bliss","e":20350},{"n":"Precision Esports","e":20150},{"n":"KS7","e":20000},{"n":"Overt Academy","e":20000}];
const HL_ALL_AT='2026-11-12';
/* Режимы: mix как было (два игрока, кто выше); pl и org как на сайтах «у кого больше состояние»: сумма первого
   видна, про второго две кнопки «Больше / Меньше», угаданный встаёт на место первого. */
const HL_MODES=['pl', 'org', 'mix'], HL_MODE_KEY='fncsdraft_hl_mode';
function hlMode(){ try{ const m=localStorage.getItem(HL_MODE_KEY); if(HL_MODES.includes(m)) return m; }catch(e){} return 'pl'; }
function hlChain(){ return !!HL && (HL.mode==='pl' || HL.mode==='org'); }
function hlBestKey(m){ return m==='mix' ? HL_BEST_KEY : HL_BEST_KEY+'_'+m; }
function hlAllPool(m){
  if(hlAllPool[m]) return hlAllPool[m];
  let out;
  if(m==='pl'){
    const by=new Map(); PLAYERS_BASE.forEach(p=>{ if(p && p.handle){ const k=hKey(p); if(!by.has(k) || (!by.get(k).photo && p.photo)) by.set(k, p); } });
    out=HL_ALL_P.map(x=>{ const c=by.get(hKey({handle:x.n}));
      return {name:x.n, flag:x.c ? '<img src="flags/w20/'+esc(x.c)+'.png" alt="" width="18" height="13" style="vertical-align:-1px;margin-right:4px" onerror="this.remove()">' : '',
              photo:c ? hlPhoto(c) : null, org:(c && c.org)||'', val:x.e, rank:0}; });
  } else {
    out=HL_ALL_T.map(x=>{ const fl=clubLogoFile(x.n);
      return {name:x.n, flag:'', photo:ccHasCrest(fl) ? LOGO_DIR+fl : null, logo:true, org:'', val:x.e, rank:0}; });
  }
  out.forEach((r,i)=>{ r.rank=i+1; });
  return hlAllPool[m]=out;
}
// Следующий соперник: чаще узнаваемый (с фото/гербом), не тот же и не с той же суммой.
function hlAllNext(m, a){
  const all=hlAllPool(m); if(all.length<2) return null;
  const known=all.filter(r=>r.photo);
  for(let t=0; t<40; t++){
    const pool=known.length>=2 && Math.random()<0.8 ? known : all;
    const b=pool[Math.floor(Math.random()*pool.length)];
    if(b && (!a || (b.name!==a.name && b.val!==a.val))) return b;
  }
  return null;
}
function hlBest(m){ try{ return +(localStorage.getItem(hlBestKey(m||'mix'))||0)||0; }catch(e){ return 0; } }
function hlBestSet(n){ try{ localStorage.setItem(hlBestKey((HL && HL.mode)||'mix'), String(n)); }catch(e){} }
function hlPhoto(p){ try{ return (typeof photoURLReal==='function' && photoURLReal(p)) || null; }catch(e){ return null; } }
// Финалы, где у карточек есть места: ник один раз (лучшее место), только топ-50, хотя бы четыре разных места.
function hlGroups(){
  if(hlGroups.c) return hlGroups.c;
  const by=new Map();
  PLAYERS_BASE.forEach(p=>{
    if(!p || !p.handle || p.tier==='qualifier' || !(p.placement>0) || !p.event) return;
    const k=p.event+'|'+p.region;
    let g=by.get(k); if(!g){ g={ev:p.event, date:p.date, rows:new Map()}; by.set(k, g); }
    const hk=hKey(p), old=g.rows.get(hk);
    if(!old || p.placement<old.placement) g.rows.set(hk, p);
  });
  const out=[];
  by.forEach(g=>{
    const rows=[...g.rows.values()].filter(p=>p.placement<=50);
    if(new Set(rows.map(p=>p.placement)).size>=4) out.push({ev:g.ev, date:g.date, rows});
  });
  return hlGroups.c=out;
}
// Сначала те, у кого есть фото: их узнают, и вопрос интереснее.
function hlPickTwo(rows, val){
  const known=rows.filter(r=>r.photo);
  const pool=known.length>=2 && Math.random()<0.8 ? known : rows;
  for(let t=0; t<30; t++){
    const a=pool[Math.floor(Math.random()*pool.length)], b=pool[Math.floor(Math.random()*pool.length)];
    if(a!==b && val(a)!==val(b) && hKey({handle:a.name})!==hKey({handle:b.name})) return [a, b];
  }
  return null;
}
function hlRoundPlace(){
  const gs=hlGroups(); if(!gs.length) return null;
  for(let t=0; t<20; t++){
    const g=gs[Math.floor(Math.random()*gs.length)];
    const rows=g.rows.map(p=>({name:p.handle, flag:flagImg(p.nat, 14), photo:hlPhoto(p), org:p.org||'', val:p.placement}));
    const two=hlPickTwo(rows, r=>r.val);
    if(two) return {kind:'place', ev:ccNoDash(String(g.ev)).replace(/\s+-\s+/g, ' · '), date:String(g.date||''), a:two[0], b:two[1]};
  }
  return null;
}
function hlRoundEarn(){
  const list=(typeof HOME_EARN_LQ!=='undefined') ? HOME_EARN_LQ : [];
  if(list.length<2) return null;
  const card=n=>PLAYERS_BASE.find(p=>p && hKey(p)===hKey({handle:n}));
  const rows=list.map(x=>{ const c=card(x.n);
    return {name:x.n, flag:x.c ? '<img src="flags/w20/'+esc(x.c)+'.png" alt="" width="18" height="13" style="vertical-align:-1px;margin-right:4px" onerror="this.remove()">' : '',
            photo:c ? hlPhoto(c) : null, org:(c && c.org)||'', val:x.e}; });
  const two=hlPickTwo(rows, r=>r.val);
  return two ? {kind:'earn', a:two[0], b:two[1]} : null;
}
function hlNext(){
  let r;
  if(hlChain()){
    const a=(HL.round && HL.round.b) || hlAllNext(HL.mode, null), b=a && hlAllNext(HL.mode, a);
    r=b ? {kind:HL.mode==='pl' ? 'allp' : 'allt', a, b} : null;
  } else r=(Math.random()<HL_EARN_SHARE && hlRoundEarn()) || hlRoundPlace() || hlRoundEarn();
  HL.round=r; HL.picked=null;
  hlDraw();
}
function hlOpen(mode){
  if(HL_MODES.includes(mode)){ try{ localStorage.setItem(HL_MODE_KEY, mode); }catch(e){} }
  const m=HL_MODES.includes(mode) ? mode : hlMode();
  HL={mode:m, streak:0, best:hlBest(m), round:null, picked:null, over:false};
  let s=document.getElementById('screen-hl');
  if(!s){ s=document.createElement('div'); s.className='screen'; s.id='screen-hl'; s.innerHTML='<div class="hl-wrap" id="hlBody"></div>';
    const ref=document.getElementById('screen-profile'); (ref ? ref.parentNode : document.body).insertBefore(s, ref ? ref.nextSibling : null); }
  show('screen-hl');
  try{ if(location.hash!=='#hl') history.replaceState(null, '', '#hl'); }catch(e){}
  hlNext();
}
function hlHome(){
  try{ if(location.hash==='#hl') history.replaceState(null, '', location.pathname+location.search); }catch(e){}
  show('screen-mode');
}
function hlValText(r, v){ return r.kind==='place' ? L().hlPlaceV(v) : '$'+ccNum(v); }
// Выше: в финале меньшее место, в призовых большая сумма.
function hlWinner(r){ return r.kind==='earn' ? (r.a.val>r.b.val ? 0 : 1) : (r.a.val<r.b.val ? 0 : 1); }
function hlCardHTML(r, side){
  if(r.kind==='allp' || r.kind==='allt') return hlChainCardHTML(r, side);
  const p=side ? r.b : r.a, done=HL.picked!=null, win=hlWinner(r)===side;
  const cls='hl-card'+(done ? (win ? ' hl-win' : ' hl-lose') : '')+(done && HL.picked===side ? ' hl-mine' : '');
  // Буква ника под фото: не загрузилось фото, остаётся буква.
  const ph='<span class="hl-ph" aria-hidden="true">'+esc(String(p.name).slice(0,1).toUpperCase())+
    (p.photo ? '<img src="'+esc(p.photo)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'</span>';
  return '<button type="button" class="'+cls+'" onclick="hlPick('+side+')"'+(done ? ' disabled' : '')+'>'+ph+
    '<b class="hl-nm">'+p.flag+esc(p.name)+'</b>'+(p.org ? '<small class="hl-org">'+esc(p.org)+'</small>' : '<small class="hl-org">&nbsp;</small>')+
    '<span class="hl-val">'+(done ? esc(hlValText(r, p.val)) : '?')+'</span></button>';
}
function hlPhHTML(p){
  return '<span class="hl-ph'+(p.logo ? ' hl-ph-logo' : '')+'" aria-hidden="true">'+esc(String(p.name).slice(0,1).toUpperCase())+
    (p.photo ? '<img src="'+esc(p.photo)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'</span>';
}
function hlChainCardHTML(r, side){
  const p=side ? r.b : r.a, T=L(), done=HL.picked!=null, ok=done && hlChainOk(r, HL.picked);
  const sub='<small class="hl-org">'+(p.org ? esc(p.org) : '&nbsp;')+'</small>';
  const rank=n=>'<small class="hl-rank">'+(n ? esc(T.hlRank(n)) : '&nbsp;')+'</small>';
  const head=hlPhHTML(p)+'<b class="hl-nm">'+p.flag+esc(p.name)+'</b>'+sub+(T.hlHas ? '<span class="hl-said">'+esc(T.hlHas)+'</span>' : '');
  if(!side) return '<div class="hl-card hl-known">'+head+'<span class="hl-val hl-val-on">'+esc(hlValText(r, p.val))+'</span>'+
    '<span class="hl-said">'+esc(T.hlPrize)+'</span>'+rank(p.rank)+'</div>';
  const cls='hl-card hl-known'+(done ? (ok ? ' hl-win hl-mine' : ' hl-lose hl-mine') : '');
  const mid=done ? '<span class="hl-val">'+esc(hlValText(r, p.val))+'</span>'
    : '<span class="hl-hilo"><button type="button" class="hl-hi" onclick="hlPickDir(1)">▲ '+esc(T.hlHigher)+'</button>'+
      '<button type="button" class="hl-lo" onclick="hlPickDir(-1)">▼ '+esc(T.hlLower)+'</button></span>';
  return '<div class="'+cls+'">'+head+mid+'<span class="hl-said">'+esc(done ? T.hlPrize : T.hlThan(r.a.name))+'</span>'+rank(done ? p.rank : 0)+'</div>';
}
function hlChainOk(r, dir){ return dir>0 ? r.b.val>r.a.val : r.b.val<r.a.val; }
function hlPickDir(dir){
  if(!HL || !HL.round || HL.picked!=null || HL.over || !hlChain()) return;
  HL.picked=dir;
  const ok=hlChainOk(HL.round, dir);
  if(ok){ HL.streak++; if(HL.streak>HL.best){ HL.best=HL.streak; hlBestSet(HL.best); } }
  else HL.over=true;
  hlDraw();
  if(ok) setTimeout(()=>{ if(HL && !HL.over && HL.picked!=null) hlNext(); }, 1400);
}
function hlTabsHTML(){
  const T=L();
  return '<div class="hl-tabs" role="tablist">'+HL_MODES.map(m=>'<button type="button" role="tab" aria-selected="'+(HL.mode===m)+'" class="hl-tab'+(HL.mode===m ? ' on' : '')+
    '" onclick="hlOpen(\''+m+'\')">'+esc(T['hlMode_'+m])+'</button>').join('')+'</div>';
}
function hlDraw(){
  const box=document.getElementById('hlBody'); if(!box || !HL) return;
  const T=L(), r=HL.round;
  const top='<div class="hl-top"><button type="button" class="hl-back" onclick="hlHome()">‹ '+esc(T.hlBack)+'</button>'+
    '<span class="hl-score"><b>'+esc(T.hlStreak(HL.streak))+'</b><small>'+esc(T.hlBest(HL.best))+'</small></span></div>';
  if(!r){ box.innerHTML=top+hlTabsHTML()+'<p class="hl-q">'+esc(T.hlEmpty)+'</p>'; return; }
  const q=(r.kind==='allp' || r.kind==='allt') ? '<p class="hl-q">'+esc(T.hlQAll(r.b.name, r.a.name))+
      '<small>'+esc(T.hlSrcAll)+'</small></p>'
    : r.kind==='earn' ? '<p class="hl-q">'+esc(T.hlQEarn)+'<small>'+esc(T.hlSrcEarn)+'</small></p>'
                          : '<p class="hl-q">'+esc(T.hlQPlace)+'<small>'+esc(r.ev)+(r.date ? ' · '+esc(r.date) : '')+'</small></p>';
  let end='';
  if(HL.over){
    end='<div class="hl-end"><b>'+esc(T.hlOver(HL.streak))+'</b>'+(HL.streak>0 && HL.streak>=HL.best ? '<small>'+esc(T.hlNewBest)+'</small>' : '')+
      '<div class="hl-btns"><button type="button" class="hero-btn hero-btn-go" onclick="hlOpen(HL.mode)">'+esc(T.hlAgain)+'</button>'+
      '<button type="button" class="hero-btn hero-btn-alt" id="hlCopyBtn" onclick="hlCopy()">'+esc(T.hlCopy)+'</button></div></div>';
  }
  const big=hlChain();
  box.classList.toggle('hl-big', big);
  const vs=big ? '<span class="hl-vsdot'+(HL.picked!=null ? (hlChainOk(r, HL.picked) ? ' ok">✓' : ' bad">✕') : '">VS')+'</span>'
               : '<span class="hl-vs">VS</span>';
  box.innerHTML=top+'<h1 class="hl-title">'+esc(T.hlTitle)+'</h1>'+hlTabsHTML()+(big ? '' : q)+
    '<div class="hl-pair">'+hlCardHTML(r, 0)+vs+hlCardHTML(r, 1)+'</div>'+
    (big ? '<p class="hl-hint">'+esc(T.hlSrcAll)+'</p>' : '')+
    (HL.picked==null && !hlChain() ? '<p class="hl-hint">'+esc(T.hlHint)+'</p>' : '')+end;
}
function hlPick(side){
  if(!HL || !HL.round || HL.picked!=null || HL.over || hlChain()) return;
  HL.picked=side;
  const ok=hlWinner(HL.round)===side;
  if(ok){ HL.streak++; if(HL.streak>HL.best){ HL.best=HL.streak; hlBestSet(HL.best); } }
  else HL.over=true;
  hlDraw();
  if(ok) setTimeout(()=>{ if(HL && !HL.over && HL.picked!=null) hlNext(); }, 1200);
}
function hlCopy(){
  const t='fncsdraft higher or lower'+(HL && HL.mode!=='mix' ? ' ('+(HL.mode==='pl' ? 'players' : 'teams')+', all-time earnings)' : '')+': '+(HL ? HL.streak : 0)+'\nfncsdraft.com/#hl';
  const done=()=>{ const b=document.getElementById('hlCopyBtn'); if(b) b.textContent=L().hlCopied; };
  try{ navigator.clipboard.writeText(t).then(done, done); }catch(e){ done(); }
}
window.addEventListener('load', ()=>{ if(location.hash==='#hl') setTimeout(()=>{ try{ hlOpen(); }catch(e){} }, 300); });
// Плашка на главной: числа таблиц, рекорд и настоящая пара (обе с фото), у второго вопрос.
function homeHlDraw(){
  const T=L(), set=(id, v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set('hhCntP', T.hhCntP(HL_ALL_P.length)); set('hhCntT', T.hhCntT(HL_ALL_T.length));
  const best=Math.max(hlBest('pl'), hlBest('org')); set('hhBest', best ? T.hlBest(best) : '');
  const box=document.getElementById('hhPair'); if(!box) return;
  if(!homeHlDraw.pair){ const a=hlAllNext('pl', null), b=a && hlAllNext('pl', a); homeHlDraw.pair=b ? [a, b] : null; }
  const pr=homeHlDraw.pair; if(!pr){ box.innerHTML=''; return; }
  const card=(p, v)=>'<span class="hh-card">'+hlPhHTML(p)+'<b>'+p.flag+esc(p.name)+'</b><strong'+(v ? '' : ' class="q"')+'>'+(v ? '$'+ccNum(p.val) : '?')+'</strong></span>';
  box.innerHTML=card(pr[0], true)+'<span class="hh-vs">VS</span>'+card(pr[1], false);
  box.setAttribute('aria-label', T.hlTitle);
}
window.addEventListener('load', ()=>setTimeout(()=>{ try{ homeHlDraw(); }catch(e){} }, 0));
Object.assign(I18N.ru, {hhTag:'Новое', hhSub:'Чьи призовые за всё время больше: два игрока или два клуба, сумма первого видна. Серия до первой ошибки.', hhCntP:n=>n+' игроков', hhCntT:n=>n+' клубов', hhPlayP:'Играть', hhPlayT:'Клубы', hlHas:'', hlPrize:'призовых за всё время', hlThan:a=>'призовых, чем у '+a, hlRank:n=>n+'-й в мире', hlMode_pl:'Игроки', hlMode_org:'Клубы', hlMode_mix:'Финалы и 2026', hlHigher:'Больше', hlLower:'Меньше', hlSrcAll:'Liquipedia, призовые за всё время', hlQAll:(b,a)=>'У '+b+' призовых за всё время больше или меньше, чем у '+a+'?', hlLink:'Больше или меньше', hlTitle:'Больше или меньше', hlBack:'Главная', hlStreak:n=>'Серия: '+n, hlBest:n=>'Рекорд: '+n,
  hlQPlace:'Кто занял место выше в этом финале?', hlQEarn:'Кто заработал больше призовых в 2026?', hlSrcEarn:'Liquipedia, все турниры года',
  hlHint:'Нажми на того, кто выше', hlPlaceV:p=>p+' место', hlOver:n=>'Серия окончена: '+n, hlNewBest:'Новый рекорд',
  hlAgain:'Ещё раз', hlCopy:'Скопировать результат', hlCopied:'Скопировано', hlEmpty:'Нет данных для вопроса'});
Object.assign(I18N.en, {hhTag:'New', hhSub:'Who has more all-time prize money: two players or two teams, the first one’s total is shown. Go until your first miss.', hhCntP:n=>n+' players', hhCntT:n=>n+' teams', hhPlayP:'Play', hhPlayT:'Teams', hlHas:'has', hlPrize:'all-time prize money', hlThan:a=>'prize money than '+a, hlRank:n=>'#'+n+' all-time', hlMode_pl:'Players', hlMode_org:'Teams', hlMode_mix:'Finals and 2026', hlHigher:'Higher', hlLower:'Lower', hlSrcAll:'Liquipedia, all-time prize money', hlQAll:(b,a)=>'Has '+b+' won more or less than '+a+' all-time?', hlLink:'Higher or lower', hlTitle:'Higher or lower', hlBack:'Home', hlStreak:n=>'Streak: '+n, hlBest:n=>'Best: '+n,
  hlQPlace:'Who placed higher in this final?', hlQEarn:'Who earned more prize money in 2026?', hlSrcEarn:'Liquipedia, every event of the year',
  hlHint:'Tap the one who is higher', hlPlaceV:p=>'#'+p, hlOver:n=>'Streak over: '+n, hlNewBest:'New best',
  hlAgain:'Play again', hlCopy:'Copy result', hlCopied:'Copied', hlEmpty:'No data for a question'});
Object.assign(I18N.fr, {hhTag:'Nouveau', hhSub:'Qui a le plus de gains au total : deux joueurs ou deux équipes, le total du premier est affiché. Jusqu’à la première erreur.', hhCntP:n=>n+' joueurs', hhCntT:n=>n+' équipes', hhPlayP:'Jouer', hhPlayT:'Équipes', hlHas:'a gagné', hlPrize:'de gains au total', hlThan:a=>'que '+a, hlRank:n=>n+(n===1?'er':'e')+' de tous les temps', hlMode_pl:'Joueurs', hlMode_org:'Équipes', hlMode_mix:'Finales et 2026', hlHigher:'Plus', hlLower:'Moins', hlSrcAll:'Liquipedia, gains de tous les temps', hlQAll:(b,a)=>b+' a gagné plus ou moins que '+a+' au total ?', hlLink:'Plus ou moins', hlTitle:'Plus ou moins', hlBack:'Accueil', hlStreak:n=>'Série : '+n, hlBest:n=>'Record : '+n,
  hlQPlace:'Qui a fini plus haut dans cette finale ?', hlQEarn:'Qui a gagné le plus en 2026 ?', hlSrcEarn:'Liquipedia, tous les tournois de l’année',
  hlHint:'Touche celui qui est au-dessus', hlPlaceV:p=>p+(p===1 ? 're' : 'e')+' place', hlOver:n=>'Série terminée : '+n, hlNewBest:'Nouveau record',
  hlAgain:'Rejouer', hlCopy:'Copier le résultat', hlCopied:'Copié', hlEmpty:'Pas de données pour une question'});
Object.assign(I18N.it, {hhTag:'Nuovo', hhSub:'Chi ha più montepremi in totale: due giocatori o due team, il totale del primo è visibile. Fino al primo errore.', hhCntP:n=>n+' giocatori', hhCntT:n=>n+' team', hhPlayP:'Gioca', hhPlayT:'Team', hlHas:'ha vinto', hlPrize:'di montepremi in totale', hlThan:a=>'di '+a, hlRank:n=>n+'° di sempre', hlMode_pl:'Giocatori', hlMode_org:'Team', hlMode_mix:'Finali e 2026', hlHigher:'Di più', hlLower:'Di meno', hlSrcAll:'Liquipedia, montepremi di sempre', hlQAll:(b,a)=>b+' ha guadagnato più o meno di '+a+' in totale?', hlLink:'Più o meno', hlTitle:'Più o meno', hlBack:'Home', hlStreak:n=>'Serie: '+n, hlBest:n=>'Record: '+n,
  hlQPlace:'Chi è arrivato più in alto in questa finale?', hlQEarn:'Chi ha guadagnato di più nel 2026?', hlSrcEarn:'Liquipedia, tutti i tornei dell’anno',
  hlHint:'Tocca chi sta più in alto', hlPlaceV:p=>p+'° posto', hlOver:n=>'Serie finita: '+n, hlNewBest:'Nuovo record',
  hlAgain:'Gioca ancora', hlCopy:'Copia il risultato', hlCopied:'Copiato', hlEmpty:'Nessun dato per una domanda'});
Object.assign(I18N.ru, {mvTitle:n=>'Двигающиеся круги · живы '+n, mvEarly:'Заходить первыми', mvEarlyNote:v=>'Сразу в новый круг, пока его не заняли: в концовках финала так дожили '+v+'%', mvEdge:'Краем со штормом', mvEdgeNote:v=>'Едем по стене шторма и забираем тех, кто опоздал: так дожили '+v+'%', mvTarp:'Тарп через шторм', mvTarpNote:'Ждём до последнего и тарпим сквозь шторм: тише на входе, но здоровье и ресы уходят', mvThird:'Третьить ротирующих', lsTitle:n=>'Последние отряды · живы '+n, lsHold:'Держать место', lsHoldNote:'Сидим в своей коробке и ждём, пока другие разменяются: место решат круги', lsHoldGot:'Держим место, ждём размена', lsPush:'Давить ради элимов', lrTitle:'Лут на точке', lrHint:n=>'Открывай сундуки сам. До зоны успеешь около '+n+', дальше теряешь ресы', lrOpened:(o,n)=>'Открыто '+o+' из '+n, lrOpen1:'Открыть сундук', lrOpen5:'Открыть 5', lrAuto:'Собрать лучшее', lrGo:'Ротироваться', lrInv:'Инвентарь', lrGround:'На земле: тап, чтобы взять', lrDrop:'Выбросить', ccMobTrainNeed:'нужен телефон или планшет: Магазин → Консоли и мобильные', ccMobTile:'МОБ', ccMobTrainCap:'выше 85 мобильный рейтинг растёт только от мобильных капов', lrMoveTip:'Тапни, чтобы переложить', lrOneMove:'Мувмент можно носить только один', lrSelHint:n=>n+': тапни слот, куда положить (свой или тиммейта), или ещё раз, чтобы выбросить', lrFull:'Инвентарь полон: выброси что-нибудь из слота', lrAmmo:(a,n)=>'Патроны '+a+'/'+n, lrAmmoBox:'Ящик с патронами', lrRare:'Редкий сундук', lrAmmoLow:'мало патронов, −1 к силе', lrSplitPen:n=>'не у всех по два ствола, −'+n+' к силе', lrTakeFor:'Брать:', lrMe:'себе', lrInvOf:n=>'Инвентарь '+n, lrSplit:'Поделить', lrBusLate:p=>'автобус далеко, сели позже: сундуков до зоны −'+p+'%', lrBusNear:'Автобус прошёл рядом, сели сразу', lrVault:'Хранилище', lrVaultBig:'Большое хранилище', lrFloor:'Лут на полу', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","дроб","ПП","пист","снайп"]; return 'Шансы '+(s ? s+' · ' : '')+'Сундук: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · хилка '+h+' · Пол (догадка): '+rr(f, CL)+', патроны '+a; }, lrBoss:n=>'Босс '+n+': убить и забрать мифик и медальон', lrBossLeft:(n,p)=>'ушли без босса '+n+', мифика нет: −'+p+' к силе', rpTitle:'Каким путём к кругу', rpHint:'Красные точки: отряды на карте. Кто стоит у линии, с тем можно встретиться', rpDirect:'Прямо', rpLeft:'Обход слева', rpRight:'Обход справа', rpNote:(k,p,m)=>(k ? 'на пути отрядов: '+k+' · встреча '+p+'%' : 'на пути никого')+(m ? ' · −'+m+' ресов на стройку' : ''), rpSafest:'тише всего', rpClear:n=>n+': дошли без встреч', rpMet:n=>'По дороге встретили '+n, rkTitle:'Ранкед', rkArenaTitle:'Арена', rkDiv:'див.', rkUnranked:'Без ранга',
  rkPlaceFirst:'Первый матч сезона поставит ранг', rkPlaceFrom:n=>'Квалификация сезона, прошлый ранг: '+n,
  rkSeasonLine:n=>'Матчей за карьеру: '+n, rkToNext:(a,b)=>a+' до '+b, rkCost:n=>'вход −'+n+'% за матч',
  rkUnrealBoard:'место в таблице Unreal', rkHypeBoard:'место в Champion League', rkRules:u=>'правила '+u,
  rkLast:d=>'Сессия '+d, rkForm:f=>'форма '+(f>0?'+':'')+f, rkPlaced:n=>'квалификация: '+n, rkUnrealPts:'очк. Unreal',
  rkSimMatch:(n,of)=>'Матч '+n+' из '+of, rkSimBus:'Автобус', rkSimLand:'Высадка', rkSimStorm:n=>'Круг '+n, rkSimAlive:'в лобби', rkSimKill:'Выбил', rkSimSkip:'Пропустить', rkSimDone:'Готово', rkSimUp:'Повышение', rkSimDown:'Понижение', rkSimTotal:'Итог сессии', rkTiers:['Бронза','Серебро','Золото','Платина','Алмаз','Элита','Чемпион','Нереальный'], rkLeagues:['Открытая лига','Лига претендентов','Лига чемпионов'], rkVictory:'Королевская победа', rkBy:'Выбил', rkLobby:'В лобби:', rkKills:'килл.', rkPeaks:'Пик прошлых сезонов',
  rkPlay:n=>'Играть '+n+' матча', rkDayBusy:'Сегодня турнирный день, сессия в свободный день',
  rkNewsUp:n=>'Ранкед: повышение до '+n, rkNewsDown:n=>'Ранкед: понижение до '+n, rkNewsPlaced:n=>'Ранкед: квалификация, ранг '+n,
  rkNewsUnreal:n=>'Ранкед: '+n+'! Теперь место в мировой таблице', rkNewsTop100:p=>'Ранкед: топ-100 Unreal, место #'+p,
  rkNewsTop1:()=>'Ранкед: первое место в таблице Unreal', rkNewsReset:()=>'Новый сезон: ранг сброшен, первый матч квалификационный',
  rkNewsArenaUp:n=>'Арена: '+n, rkNewsChamp:n=>'Арена: Champion League! '+n, rkNewsArenaReset:u=>'Обновление '+u+': Hype на Арене сброшен'});
Object.assign(I18N.en, {mvTitle:n=>'Moving zones · '+n+' alive', mvEarly:'Rotate first', mvEarlyNote:v=>'Straight into the new circle before it fills up: '+v+'% survived this in the final endgames', mvEdge:'Ride the storm edge', mvEdgeNote:v=>'Move along the storm wall and pick off the late ones: '+v+'% survived this', mvTarp:'Tarp through the storm', mvTarpNote:'Wait till the end and tarp through: quieter on the way in, but it costs health and mats', mvThird:'Third-party the rotators', lsTitle:n=>'Last squads · '+n+' alive', lsHold:'Hold placement', lsHoldNote:'Stay in our box and let the others trade: the circles decide the placement', lsHoldGot:'Holding placement, waiting for a trade', lsPush:'Push for elims', lrTitle:'Loot at your spot', lrHint:n=>'Open chests yourself. About '+n+' before the zone, after that you lose mats', lrOpened:(o,n)=>'Opened '+o+' of '+n, lrOpen1:'Open chest', lrOpen5:'Open 5', lrAuto:'Take the best', lrGo:'Rotate', lrInv:'Inventory', lrGround:'On the ground: tap to pick up', lrDrop:'Drop', ccMobTrainNeed:'needs a phone or tablet: Shop → Consoles and mobile', ccMobTile:'MOB', ccMobTrainCap:'above 85 the mobile rating grows only from mobile cups', lrMoveTip:'Tap to move', lrOneMove:'Only one movement item per player', lrSelHint:n=>n+': tap a slot to put it in (yours or a teammate’s), or tap it again to drop it', lrFull:'Inventory full: drop something from a slot', lrAmmo:(a,n)=>'Ammo '+a+'/'+n, lrAmmoBox:'Ammo box', lrRare:'Rare chest', lrAmmoLow:'low ammo, −1 power', lrSplitPen:n=>'not everyone has two guns, −'+n+' power', lrTakeFor:'Take for:', lrMe:'me', lrInvOf:n=>n+' inventory', lrSplit:'Split loot', lrBusLate:p=>'bus far away, landed late: '+p+'% fewer chests before the zone', lrBusNear:'Bus flew close, landed right away', lrVault:'Vault', lrVaultBig:'Big vault', lrFloor:'Floor loot', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","shotgun","SMG","pistol","sniper"]; return 'Odds '+(s ? s+' · ' : '')+'Chest: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · heal '+h+' · Floor (estimate): '+rr(f, CL)+', ammo '+a; }, lrBoss:n=>'Boss '+n+': kill for the mythic and the medallion', lrBossLeft:(n,p)=>'left boss '+n+' alive, no mythic: −'+p+' power', rpTitle:'Which way to the zone', rpHint:'Red dots are squads on the map. Whoever stands by the line, you may run into', rpDirect:'Straight', rpLeft:'Around the left', rpRight:'Around the right', rpNote:(k,p,m)=>(k ? 'squads on the way: '+k+' · '+p+'% to meet' : 'nobody on the way')+(m ? ' · −'+m+' mats on builds' : ''), rpSafest:'quietest', rpClear:n=>n+': got there without a fight', rpMet:n=>'Ran into '+n+' on the way', rkTitle:'Ranked', rkArenaTitle:'Arena', rkDiv:'div.', rkUnranked:'Unranked',
  rkPlaceFirst:'The first match of the season sets your rank', rkPlaceFrom:n=>'Season placement, last rank: '+n,
  rkSeasonLine:n=>'Career matches: '+n, rkToNext:(a,b)=>a+' to '+b, rkCost:n=>'entry −'+n+'% per match',
  rkUnrealBoard:'Unreal leaderboard', rkHypeBoard:'Champion League standing', rkRules:u=>'rules '+u,
  rkLast:d=>'Session '+d, rkForm:f=>'form '+(f>0?'+':'')+f, rkPlaced:n=>'placed: '+n, rkUnrealPts:'Unreal pts',
  rkSimMatch:(n,of)=>'Match '+n+' of '+of, rkSimBus:'Battle Bus', rkSimLand:'Landing', rkSimStorm:n=>'Zone '+n, rkSimAlive:'left', rkSimKill:'Eliminated', rkSimSkip:'Skip', rkSimDone:'Done', rkSimUp:'Rank up', rkSimDown:'Rank down', rkSimTotal:'Session result', rkTiers:['Bronze','Silver','Gold','Platinum','Diamond','Elite','Champion','Unreal'], rkLeagues:['Open League','Contender League','Champion League'], rkVictory:'Victory Royale', rkBy:'Eliminated by', rkLobby:'In the lobby:', rkKills:'kills', rkPeaks:'Peak in past seasons',
  rkPlay:n=>'Play '+n+' matches', rkDayBusy:'Tournament day today, play a session on a free day',
  rkNewsUp:n=>'Ranked: promoted to '+n, rkNewsDown:n=>'Ranked: dropped to '+n, rkNewsPlaced:n=>'Ranked: placed at '+n,
  rkNewsUnreal:n=>'Ranked: '+n+'! On the world leaderboard now', rkNewsTop100:p=>'Ranked: top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Ranked: number one on the Unreal leaderboard', rkNewsReset:()=>'New season: rank reset, the first match is a placement',
  rkNewsArenaUp:n=>'Arena: '+n, rkNewsChamp:n=>'Arena: Champion League! '+n, rkNewsArenaReset:u=>'Update '+u+': Arena Hype reset'});
Object.assign(I18N.fr, {mvTitle:n=>'Zones mobiles · '+n+' en vie', mvEarly:'Entrer les premiers', mvEarlyNote:v=>'Direct dans la nouvelle zone avant qu’elle se remplisse : '+v+'% ont survécu ainsi en fin de finale', mvEdge:'Longer la tempête', mvEdgeNote:v=>'On suit le mur de la tempête et on prend les retardataires : '+v+'% ont survécu', mvTarp:'Tarp dans la tempête', mvTarpNote:'On attend la fin et on tarp à travers : plus calme à l’entrée, mais ça coûte de la vie et des matériaux', mvThird:'Third-party les rotations', lsTitle:n=>'Dernières équipes · '+n+' en vie', lsHold:'Tenir la place', lsHoldNote:'On reste dans notre box et on laisse les autres s’échanger : les zones décident la place', lsHoldGot:'On tient la place, on attend un échange', lsPush:'Pousser pour les kills', lrTitle:'Loot sur ton spot', lrHint:n=>'Ouvre les coffres toi-même. Environ '+n+' avant la zone, ensuite tu perds des matériaux', lrOpened:(o,n)=>'Ouverts '+o+' sur '+n, lrOpen1:'Ouvrir un coffre', lrOpen5:'Ouvrir 5', lrAuto:'Prendre le meilleur', lrGo:'Rotation', lrInv:'Inventaire', lrGround:'Au sol : touche pour ramasser', lrDrop:'Jeter', ccMobTrainNeed:'il faut un téléphone ou une tablette : Boutique → Consoles et mobile', ccMobTrainCap:'au-dessus de 85, la note mobile ne monte qu’avec les cups mobiles', lrMoveTip:'Touche pour déplacer', lrOneMove:'Un seul objet de mobilité par joueur', lrSelHint:n=>n+' : touche un emplacement (le tien ou celui d’un coéquipier), ou touche-le encore pour le jeter', lrFull:'Inventaire plein : jette quelque chose', lrAmmo:(a,n)=>'Munitions '+a+'/'+n, lrAmmoBox:'Caisse de munitions', lrRare:'Coffre rare', lrAmmoLow:'peu de munitions, −1 puissance', lrSplitPen:n=>'pas deux armes pour tout le monde, −'+n+' puissance', lrTakeFor:'Pour :', lrMe:'moi', lrInvOf:n=>'Inventaire de '+n, lrSplit:'Partager', lrBusLate:p=>'bus loin, atterri tard : '+p+'% de coffres en moins avant la zone', lrBusNear:'Le bus est passé près, atterri tout de suite', lrVault:'Coffre-fort', lrVaultBig:'Grand coffre-fort', lrFloor:'Loot au sol', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["FA","pompe","SMG","pistolet","sniper"]; return 'Chances '+(s ? s+' · ' : '')+'Coffre : '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · soin '+h+' · Sol (estimation) : '+rr(f, CL)+', munitions '+a; }, lrBoss:n=>'Boss '+n+' : le tuer pour la mythique et le médaillon', lrBossLeft:(n,p)=>'boss '+n+' laissé, pas de mythique : −'+p+' puissance', rpTitle:'Par où vers la zone', rpHint:'Points rouges : les escouades. Celles près de la ligne, tu peux les croiser', rpDirect:'Tout droit', rpLeft:'Par la gauche', rpRight:'Par la droite', rpNote:(k,p,m)=>(k ? 'escouades sur le chemin : '+k+' · rencontre '+p+'%' : 'personne sur le chemin')+(m ? ' · −'+m+' matériaux' : ''), rpSafest:'le plus calme', rpClear:n=>n+' : arrivés sans combat', rpMet:n=>'Croisé '+n+' en route', rkTitle:'Classé', rkArenaTitle:'Arène', rkDiv:'div.', rkUnranked:'Non classé',
  rkPlaceFirst:'Le premier match de la saison fixe ton rang', rkPlaceFrom:n=>'Placement de saison, dernier rang : '+n,
  rkSeasonLine:n=>'Matchs en carrière : '+n, rkToNext:(a,b)=>a+' avant '+b, rkCost:n=>'entrée −'+n+' % par match',
  rkUnrealBoard:'classement Unreal', rkHypeBoard:'place en Champion League', rkRules:u=>'règles '+u,
  rkLast:d=>'Session '+d, rkForm:f=>'forme '+(f>0?'+':'')+f, rkPlaced:n=>'placé : '+n, rkUnrealPts:'pts Unreal',
  rkSimMatch:(n,of)=>'Match '+n+' sur '+of, rkSimBus:'Bus de combat', rkSimLand:'Atterrissage', rkSimStorm:n=>'Zone '+n, rkSimAlive:'restants', rkSimKill:'Éliminé', rkSimSkip:'Passer', rkSimDone:'OK', rkSimUp:'Rang supérieur', rkSimDown:'Rang inférieur', rkSimTotal:'Bilan de la session', rkTiers:['Bronze','Argent','Or','Platine','Diamant','Élite','Champion','Irréel'], rkLeagues:['Ligue ouverte','Ligue des challengers','Ligue des champions'], rkVictory:'Top 1', rkBy:'Éliminé par', rkLobby:'Dans le lobby :', rkKills:'kills', rkPeaks:'Pic des saisons passées',
  rkPlay:n=>'Jouer '+n+' matchs', rkDayBusy:'Jour de tournoi, joue une session un jour libre',
  rkNewsUp:n=>'Classé : promu '+n, rkNewsDown:n=>'Classé : redescendu '+n, rkNewsPlaced:n=>'Classé : placé '+n,
  rkNewsUnreal:n=>'Classé : '+n+' ! Dans le classement mondial', rkNewsTop100:p=>'Classé : top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Classé : numéro un du classement Unreal', rkNewsReset:()=>'Nouvelle saison : rang remis à zéro, premier match de placement',
  rkNewsArenaUp:n=>'Arène : '+n, rkNewsChamp:n=>'Arène : Champion League ! '+n, rkNewsArenaReset:u=>'Mise à jour '+u+' : Hype d’Arène remis à zéro'});
Object.assign(I18N.it, {mvTitle:n=>'Zone mobili · vivi '+n, mvEarly:'Entrare per primi', mvEarlyNote:v=>'Subito nel nuovo cerchio prima che si riempia: così è sopravvissuto il '+v+'% nei finali', mvEdge:'Lungo la tempesta', mvEdgeNote:v=>'Seguiamo il muro della tempesta e prendiamo i ritardatari: sopravvissuto il '+v+'%', mvTarp:'Tarp nella tempesta', mvTarpNote:'Aspettiamo fino alla fine e tarpiamo attraverso: ingresso più tranquillo, ma costa vita e materiali', mvThird:'Third-party chi ruota', lsTitle:n=>'Ultime squadre · vivi '+n, lsHold:'Tenere la posizione', lsHoldNote:'Restiamo nel nostro box e lasciamo che gli altri si scambino: la posizione la decidono i cerchi', lsHoldGot:'Teniamo la posizione, aspettiamo uno scambio', lsPush:'Spingere per le kill', lrTitle:'Loot sul tuo spot', lrHint:n=>'Apri i forzieri da solo. Circa '+n+' prima della zona, poi perdi materiali', lrOpened:(o,n)=>'Aperti '+o+' su '+n, lrOpen1:'Apri forziere', lrOpen5:'Apri 5', lrAuto:'Prendi il meglio', lrGo:'Ruota', lrInv:'Inventario', lrGround:'A terra: tocca per raccogliere', lrDrop:'Butta', ccMobTrainNeed:'serve un telefono o tablet: Negozio → Console e mobile', ccMobTrainCap:'sopra 85 il rating mobile sale solo con le cup mobile', lrMoveTip:'Tocca per spostare', lrOneMove:'Un solo oggetto di movimento a testa', lrSelHint:n=>n+': tocca uno slot (tuo o di un compagno), o toccalo di nuovo per buttarlo', lrFull:'Inventario pieno: butta qualcosa', lrAmmo:(a,n)=>'Munizioni '+a+'/'+n, lrAmmoBox:'Cassa di munizioni', lrRare:'Forziere raro', lrAmmoLow:'poche munizioni, −1 potenza', lrSplitPen:n=>'non tutti hanno due armi, −'+n+' potenza', lrTakeFor:'Per:', lrMe:'me', lrInvOf:n=>'Inventario di '+n, lrSplit:'Dividi', lrBusLate:p=>'bus lontano, atterrati tardi: '+p+'% di forzieri in meno prima della zona', lrBusNear:'Il bus è passato vicino, atterrati subito', lrVault:'Caveau', lrVaultBig:'Grande caveau', lrFloor:'Loot a terra', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","pompa","SMG","pistola","cecchino"]; return 'Probabilità '+(s ? s+' · ' : '')+'Forziere: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · cura '+h+' · Terra (stima): '+rr(f, CL)+', munizioni '+a; }, lrBoss:n=>'Boss '+n+': uccidilo per la mitica e il medaglione', lrBossLeft:(n,p)=>'boss '+n+' lasciato, niente mitica: −'+p+' potenza', rpTitle:'Da che parte verso la zona', rpHint:'Punti rossi: le squadre. Chi sta vicino alla linea, puoi incontrarlo', rpDirect:'Dritto', rpLeft:'Giro a sinistra', rpRight:'Giro a destra', rpNote:(k,p,m)=>(k ? 'squadre sul percorso: '+k+' · incontro '+p+'%' : 'nessuno sul percorso')+(m ? ' · −'+m+' materiali' : ''), rpSafest:'più tranquillo', rpClear:n=>n+': arrivati senza scontri', rpMet:n=>'Incontrati '+n+' per strada', rkTitle:'Classificate', rkArenaTitle:'Arena', rkDiv:'div.', rkUnranked:'Senza grado',
  rkPlaceFirst:'La prima partita della stagione fissa il grado', rkPlaceFrom:n=>'Piazzamento di stagione, grado precedente: '+n,
  rkSeasonLine:n=>'Partite in carriera: '+n, rkToNext:(a,b)=>a+' a '+b, rkCost:n=>'ingresso −'+n+'% a partita',
  rkUnrealBoard:'classifica Unreal', rkHypeBoard:'posto in Champion League', rkRules:u=>'regole '+u,
  rkLast:d=>'Sessione '+d, rkForm:f=>'forma '+(f>0?'+':'')+f, rkPlaced:n=>'piazzato: '+n, rkUnrealPts:'pt Unreal',
  rkSimMatch:(n,of)=>'Partita '+n+' di '+of, rkSimBus:'Bus della battaglia', rkSimLand:'Atterraggio', rkSimStorm:n=>'Zona '+n, rkSimAlive:'rimasti', rkSimKill:'Eliminato', rkSimSkip:'Salta', rkSimDone:'Fatto', rkSimUp:'Promozione', rkSimDown:'Retrocessione', rkSimTotal:'Esito della sessione', rkTiers:['Bronzo','Argento','Oro','Platino','Diamante','Élite','Campione','Irreale'], rkLeagues:['Lega aperta','Lega sfidanti','Lega campioni'], rkVictory:'Vittoria Reale', rkBy:'Eliminato da', rkLobby:'Nella lobby:', rkKills:'kill', rkPeaks:'Picco delle stagioni passate',
  rkPlay:n=>'Gioca '+n+' partite', rkDayBusy:'Oggi c’è un torneo, gioca una sessione in un giorno libero',
  rkNewsUp:n=>'Classificate: promosso a '+n, rkNewsDown:n=>'Classificate: sceso a '+n, rkNewsPlaced:n=>'Classificate: piazzato a '+n,
  rkNewsUnreal:n=>'Classificate: '+n+'! Ora in classifica mondiale', rkNewsTop100:p=>'Classificate: top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Classificate: primo nella classifica Unreal', rkNewsReset:()=>'Nuova stagione: grado azzerato, prima partita di piazzamento',
  rkNewsArenaUp:n=>'Arena: '+n, rkNewsChamp:n=>'Arena: Champion League! '+n, rkNewsArenaReset:u=>'Aggiornamento '+u+': Hype dell’Arena azzerato'});
Object.assign(I18N.pt, {mvTitle:n=>'Zonas móveis · '+n+' vivos', mvEarly:'Entrar primeiro', mvEarlyNote:v=>'Direto para o novo círculo antes que lote: '+v+'% sobreviveram assim nos finais', mvEdge:'Pela borda da tempestade', mvEdgeNote:v=>'Seguimos a parede da tempestade e pegamos quem atrasou: '+v+'% sobreviveram', mvTarp:'Tarp pela tempestade', mvTarpNote:'Esperamos até o fim e passamos de tarp: entrada mais calma, mas custa vida e materiais', mvThird:'Third-party em quem rotaciona', lsTitle:n=>'Últimos times · '+n+' vivos', lsHold:'Segurar a posição', lsHoldNote:'Ficamos na nossa box e deixamos os outros trocarem: os círculos decidem a posição', lsHoldGot:'Segurando a posição, esperando uma troca', lsPush:'Pressionar por kills', lrTitle:'Loot no seu ponto', lrHint:n=>'Abra os baús você mesmo. Cerca de '+n+' antes da zona, depois perde materiais', lrOpened:(o,n)=>'Abertos '+o+' de '+n, lrOpen1:'Abrir baú', lrOpen5:'Abrir 5', lrAuto:'Pegar o melhor', lrGo:'Rotacionar', lrInv:'Inventário', lrGround:'No chão: toque para pegar', lrDrop:'Largar', ccMobTrainNeed:'precisa de celular ou tablet: Loja → Consoles e mobile', ccMobTrainCap:'acima de 85 o rating mobile só sobe com cups mobile', lrMoveTip:'Toque para mover', lrOneMove:'Só um item de mobilidade por jogador', lrSelHint:n=>n+': toque num slot (seu ou de um colega), ou toque de novo para largar', lrFull:'Inventário cheio: largue algo', lrAmmo:(a,n)=>'Munição '+a+'/'+n, lrAmmoBox:'Caixa de munição', lrRare:'Baú raro', lrAmmoLow:'pouca munição, −1 de força', lrSplitPen:n=>'nem todos têm duas armas, −'+n+' de força', lrTakeFor:'Para:', lrMe:'mim', lrInvOf:n=>'Inventário de '+n, lrSplit:'Dividir', lrBusLate:p=>'ônibus longe, pousou tarde: '+p+'% menos baús antes da zona', lrBusNear:'O ônibus passou perto, pousou na hora', lrVault:'Cofre', lrVaultBig:'Cofre grande', lrFloor:'Loot no chão', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","escopeta","SMG","pistola","sniper"]; return 'Chances '+(s ? s+' · ' : '')+'Baú: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · cura '+h+' · Chão (estimativa): '+rr(f, CL)+', munição '+a; }, lrBoss:n=>'Chefe '+n+': derrote para pegar a mítica e o medalhão', lrBossLeft:(n,p)=>'chefe '+n+' deixado, sem mítica: −'+p+' de força', rpTitle:'Por onde até a zona', rpHint:'Pontos vermelhos são squads no mapa. Quem está perto da linha, você pode encontrar', rpDirect:'Reto', rpLeft:'Pela esquerda', rpRight:'Pela direita', rpNote:(k,p,m)=>(k ? 'squads no caminho: '+k+' · encontro '+p+'%' : 'ninguém no caminho')+(m ? ' · −'+m+' de materiais' : ''), rpSafest:'mais tranquilo', rpClear:n=>n+': chegamos sem luta', rpMet:n=>'Encontramos '+n+' no caminho', rkTitle:'Ranqueada', rkArenaTitle:'Arena', rkDiv:'div.', rkUnranked:'Sem rank',
  rkPlaceFirst:'A primeira partida da temporada define o rank', rkPlaceFrom:n=>'Posicionamento da temporada, rank anterior: '+n,
  rkSeasonLine:n=>'Partidas na carreira: '+n, rkToNext:(a,b)=>a+' até '+b, rkCost:n=>'entrada −'+n+'% por partida',
  rkUnrealBoard:'placar Unreal', rkHypeBoard:'posição na Champion League', rkRules:u=>'regras '+u,
  rkLast:d=>'Sessão '+d, rkForm:f=>'forma '+(f>0?'+':'')+f, rkPlaced:n=>'posicionado: '+n, rkUnrealPts:'pts Unreal',
  rkSimMatch:(n,of)=>'Partida '+n+' de '+of, rkSimBus:'Ônibus de batalha', rkSimLand:'Pouso', rkSimStorm:n=>'Zona '+n, rkSimAlive:'restantes', rkSimKill:'Eliminou', rkSimSkip:'Pular', rkSimDone:'Pronto', rkSimUp:'Subiu de rank', rkSimDown:'Caiu de rank', rkSimTotal:'Resultado da sessão', rkTiers:['Bronze','Prata','Ouro','Platina','Diamante','Elite','Campeão','Irreal'], rkLeagues:['Liga Aberta','Liga Desafiante','Liga dos Campeões'], rkVictory:'Vitória Royale', rkBy:'Eliminado por', rkLobby:'No lobby:', rkKills:'abates', rkPeaks:'Pico das temporadas passadas',
  rkPlay:n=>'Jogar '+n+' partidas', rkDayBusy:'Hoje é dia de torneio, jogue uma sessão num dia livre',
  rkNewsUp:n=>'Ranqueada: subiu para '+n, rkNewsDown:n=>'Ranqueada: caiu para '+n, rkNewsPlaced:n=>'Ranqueada: posicionado em '+n,
  rkNewsUnreal:n=>'Ranqueada: '+n+'! Agora no placar mundial', rkNewsTop100:p=>'Ranqueada: top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Ranqueada: primeiro no placar Unreal', rkNewsReset:()=>'Nova temporada: rank zerado, primeira partida de posicionamento',
  rkNewsArenaUp:n=>'Arena: '+n, rkNewsChamp:n=>'Arena: Champion League! '+n, rkNewsArenaReset:u=>'Atualização '+u+': Hype da Arena zerado'});
Object.assign(I18N.pt, {hhTag:'Novo', hhSub:'Quem tem mais prêmios no total: dois jogadores ou dois times, o total do primeiro aparece. Até o primeiro erro.', hhCntP:n=>n+' jogadores', hhCntT:n=>n+' times', hhPlayP:'Jogar', hhPlayT:'Times', hlHas:'ganhou', hlPrize:'em prêmios no total', hlThan:a=>'que '+a, hlRank:n=>n+'º de todos os tempos', hlMode_pl:'Jogadores', hlMode_org:'Times', hlMode_mix:'Finais e 2026', hlHigher:'Mais', hlLower:'Menos', hlSrcAll:'Liquipedia, prêmios de todos os tempos', hlQAll:(b,a)=>b+' ganhou mais ou menos que '+a+' no total?', hlLink:'Maior ou menor', hlTitle:'Maior ou menor', hlBack:'Início', hlStreak:n=>'Sequência: '+n, hlBest:n=>'Recorde: '+n,
  hlQPlace:'Quem ficou mais alto nesta final?', hlQEarn:'Quem ganhou mais prêmios em 2026?', hlSrcEarn:'Liquipedia, todos os torneios do ano',
  hlHint:'Toque em quem ficou acima', hlPlaceV:p=>p+'º lugar', hlOver:n=>'Sequência encerrada: '+n, hlNewBest:'Novo recorde',
  hlAgain:'Jogar de novo', hlCopy:'Copiar resultado', hlCopied:'Copiado', hlEmpty:'Sem dados para uma pergunta'});
/* План 125 (14.11): тактика файта (tc*), третья сторона в середине (tp*), точка пути кликом (rpGo, rpHint). */
Object.assign(I18N.ru, {esChips:'До конца игры:', tcChips:'Встречу играем:', sitUseless:'бесполезно сейчас', sitFInside:'ты уже в круге', sitFFar:'круг далеко', sitFNear:'круг рядом', sitFAway:'круг уходит от тебя', sitFToward:'круг идёт к тебе', sitFMats:m=>'ресов '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'рядом отрядов: '+n, sitFPing:ms=>'пинг '+ms+' мс', sitFHeals:h=>'хилок '+h, sitFPlace:p=>'идёте примерно '+p+'-ми', sitFPair:'рядом дерутся двое', sitFEdge:'ты у края круга', sitFMid:'ты в середине круга', sitFMove:'есть мувмент', tcFoe:(n,t)=>(n||'Соперник')+' скорее всего: '+t.toLowerCase(), tcFoeDid:t=>'они: '+t.toLowerCase(), tcTitle:n=>'Как играем файт'+(n ? ' · '+n : ''), tcPush:'Пушить', tcBox:'Бокс-файт, тянуть', tcBack:'Отойти',
  tcNone:'нет', tcOdds:(w,d,t)=>w+'% выбить · '+d+'% выбиты · '+t+'% размен',
  tcPushNote:(a,b)=>'решает дробовик: у нас '+a+', у них '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'решают ресы и хилки: ресы '+m1+' против '+m2+', хилок '+h1+' против '+h2+' · −'+c+' ресов',
  tcBackNote:'постреляли и ушли: решается редко, размен реже',
  tpTitle:(a,b)=>'Третьить: '+a+' и '+b,
  tpNote:(s,k,d,p,b)=>'дерутся рядом · '+s+'%: их файт кончится до нас · '+k+'% выбить, +'+p+' к силе · '+d+'% выбиты · '+b+'%: добить и второго',
  tpGot:r=>(r.self ? r.w+' выбили '+r.l+' до нас · ' : '')+(r.out==='win' ? 'выбили '+r.t+(r.both ? ' и '+r.o : '')+', +'+r.pow+' к силе' : r.out==='die' ? r.t+' развернулись на нас, выбиты' : 'зашли третьими, постреляли и ушли: +'+r.dmg+' урона'),
  rpGo:'Идём к точке', rpHint:'Тапни по кругу, куда встать. Красные точки: отряды, кто у линии, с тем можно встретиться'});
Object.assign(I18N.en, {esChips:'For the rest of the game:', tcChips:'If we meet someone:', sitUseless:'useless right now', sitFInside:'you are already in the zone', sitFFar:'the zone is far', sitFNear:'the zone is close', sitFAway:'the zone moves away from you', sitFToward:'the zone moves toward you', sitFMats:m=>'mats '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'squads nearby: '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'heals '+h, sitFPlace:p=>'you are about #'+p, sitFPair:'two squads fighting nearby', sitFEdge:'you are on the zone edge', sitFMid:'you are mid zone', sitFMove:'you have mobility', tcFoe:(n,t)=>(n||'The other squad')+' will likely: '+t.toLowerCase(), tcFoeDid:t=>'they: '+t.toLowerCase(), tcTitle:n=>'How do we play the fight'+(n ? ' · '+n : ''), tcPush:'Push', tcBox:'Box fight, drag it out', tcBack:'Back off',
  tcNone:'none', tcOdds:(w,d,t)=>w+'% we take them · '+d+'% we go down · '+t+'% trade',
  tcPushNote:(a,b)=>'the shotgun decides: ours '+a+', theirs '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'mats and heals decide: mats '+m1+' vs '+m2+', heals '+h1+' vs '+h2+' · −'+c+' mats',
  tcBackNote:'shoot and leave: rarely decided, fewer trades',
  tpTitle:(a,b)=>'Third-party: '+a+' and '+b,
  tpNote:(s,k,d,p,b)=>'fighting nearby · '+s+'%: their fight ends before we arrive · '+k+'% we take one, +'+p+' power · '+d+'% we go down · '+b+'%: finish the second too',
  tpGot:r=>(r.self ? r.w+' took out '+r.l+' before we got there · ' : '')+(r.out==='win' ? 'took out '+r.t+(r.both ? ' and '+r.o : '')+', +'+r.pow+' power' : r.out==='die' ? r.t+' turned on us, we went down' : 'came in third, shots exchanged, we left: +'+r.dmg+' damage'),
  rpGo:'Go to the point', rpHint:'Tap the circle where to stand. Red dots are squads: whoever is by the line, you may run into'});
Object.assign(I18N.fr, {esChips:'Jusqu’à la fin :', tcChips:'Si on croise quelqu’un :', sitUseless:'inutile maintenant', sitFInside:'tu es déjà dans la zone', sitFFar:'la zone est loin', sitFNear:'la zone est proche', sitFAway:'la zone s’éloigne de toi', sitFToward:'la zone vient vers toi', sitFMats:m=>'matériaux '+m, sitFAr:r=>'FA '+r, sitFNearBy:n=>'escouades proches : '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'soins '+h, sitFPlace:p=>'vous êtes environ #'+p, sitFPair:'deux escouades se battent à côté', sitFEdge:'tu es au bord de la zone', sitFMid:'tu es au milieu de la zone', sitFMove:'tu as une mobilité', tcFoe:(n,t)=>(n||'L’adversaire')+' va sûrement : '+t.toLowerCase(), tcFoeDid:t=>'eux : '+t.toLowerCase(), tcTitle:n=>'Comment on joue le combat'+(n ? ' · '+n : ''), tcPush:'Push', tcBox:'Box fight, faire durer', tcBack:'Reculer',
  tcNone:'aucun', tcOdds:(w,d,t)=>w+'% on les élimine · '+d+'% éliminés · '+t+'% échange',
  tcPushNote:(a,b)=>'le pompe décide : le nôtre '+a+', le leur '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'matériaux et soins décident : matériaux '+m1+' contre '+m2+', soins '+h1+' contre '+h2+' · −'+c+' matériaux',
  tcBackNote:'on tire et on part : rarement décisif, moins d’échanges',
  tpTitle:(a,b)=>'Third-party : '+a+' et '+b,
  tpNote:(s,k,d,p,b)=>'ils se battent à côté · '+s+'% : leur combat finit avant nous · '+k+'% on en élimine un, +'+p+' puissance · '+d+'% éliminés · '+b+'% : finir le second aussi',
  tpGot:r=>(r.self ? r.w+' a éliminé '+r.l+' avant nous · ' : '')+(r.out==='win' ? r.t+(r.both ? ' et '+r.o : '')+' éliminés, +'+r.pow+' puissance' : r.out==='die' ? r.t+' se sont retournés, éliminés' : 'arrivés en troisième, on a tiré et on est partis : +'+r.dmg+' dégâts'),
  rpGo:'Aller au point', rpHint:'Touche la zone où te placer. Points rouges : les escouades, celles près de la ligne, tu peux les croiser'});
Object.assign(I18N.it, {esChips:'Fino alla fine:', tcChips:'Se incontriamo qualcuno:', sitUseless:'inutile adesso', sitFInside:'sei già nella zona', sitFFar:'la zona è lontana', sitFNear:'la zona è vicina', sitFAway:'la zona si allontana da te', sitFToward:'la zona viene verso di te', sitFMats:m=>'materiali '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'squadre vicine: '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'cure '+h, sitFPlace:p=>'siete circa #'+p, sitFPair:'due squadre combattono vicino', sitFEdge:'sei al bordo della zona', sitFMid:'sei al centro della zona', sitFMove:'hai mobilità', tcFoe:(n,t)=>(n||'L’avversario')+' probabilmente: '+t.toLowerCase(), tcFoeDid:t=>'loro: '+t.toLowerCase(), tcTitle:n=>'Come giochiamo lo scontro'+(n ? ' · '+n : ''), tcPush:'Spingere', tcBox:'Box fight, tirarla lunga', tcBack:'Ritirarsi',
  tcNone:'nessuno', tcOdds:(w,d,t)=>w+'% li eliminiamo · '+d+'% eliminati · '+t+'% scambio',
  tcPushNote:(a,b)=>'decide il fucile a pompa: il nostro '+a+', il loro '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'decidono materiali e cure: materiali '+m1+' contro '+m2+', cure '+h1+' contro '+h2+' · −'+c+' materiali',
  tcBackNote:'spariamo e andiamo: si decide di rado, meno scambi',
  tpTitle:(a,b)=>'Third-party: '+a+' e '+b,
  tpNote:(s,k,d,p,b)=>'combattono vicino · '+s+'%: il loro scontro finisce prima di noi · '+k+'% ne eliminiamo uno, +'+p+' potenza · '+d+'% eliminati · '+b+'%: finire anche il secondo',
  tpGot:r=>(r.self ? r.w+' ha eliminato '+r.l+' prima di noi · ' : '')+(r.out==='win' ? 'eliminati '+r.t+(r.both ? ' e '+r.o : '')+', +'+r.pow+' potenza' : r.out==='die' ? r.t+' si sono girati su di noi, eliminati' : 'entrati per terzi, sparato e via: +'+r.dmg+' danni'),
  rpGo:'Vai al punto', rpHint:'Tocca il cerchio dove metterti. Punti rossi: le squadre, chi sta vicino alla linea, puoi incontrarlo'});
Object.assign(I18N.pt, {esChips:'Até o fim:', tcChips:'Se encontrarmos alguém:', sitUseless:'inútil agora', sitFInside:'você já está na zona', sitFFar:'a zona está longe', sitFNear:'a zona está perto', sitFAway:'a zona se afasta de você', sitFToward:'a zona vem até você', sitFMats:m=>'materiais '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'squads perto: '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'curas '+h, sitFPlace:p=>'vocês estão por volta de #'+p, sitFPair:'dois squads lutando perto', sitFEdge:'você está na borda da zona', sitFMid:'você está no meio da zona', sitFMove:'você tem mobilidade', tcFoe:(n,t)=>(n||'O adversário')+' provavelmente: '+t.toLowerCase(), tcFoeDid:t=>'eles: '+t.toLowerCase(), tcTitle:n=>'Como jogamos a luta'+(n ? ' · '+n : ''), tcPush:'Pressionar', tcBox:'Box fight, segurar', tcBack:'Recuar',
  tcNone:'nenhuma', tcOdds:(w,d,t)=>w+'% eliminamos · '+d+'% eliminados · '+t+'% troca',
  tcPushNote:(a,b)=>'a escopeta decide: a nossa '+a+', a deles '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'materiais e curas decidem: materiais '+m1+' contra '+m2+', curas '+h1+' contra '+h2+' · −'+c+' de materiais',
  tcBackNote:'atiramos e saímos: decide pouco, menos trocas',
  tpTitle:(a,b)=>'Third-party: '+a+' e '+b,
  tpNote:(s,k,d,p,b)=>'lutando perto · '+s+'%: a luta deles acaba antes de chegarmos · '+k+'% eliminamos um, +'+p+' de força · '+d+'% eliminados · '+b+'%: acabar com o segundo também',
  tpGot:r=>(r.self ? r.w+' eliminou '+r.l+' antes de nós · ' : '')+(r.out==='win' ? 'eliminamos '+r.t+(r.both ? ' e '+r.o : '')+', +'+r.pow+' de força' : r.out==='die' ? r.t+' viraram em nós, eliminados' : 'entramos como terceiro, trocamos tiros e saímos: +'+r.dmg+' de dano'),
  rpGo:'Ir ao ponto', rpHint:'Toque no círculo onde ficar. Pontos vermelhos são squads: quem está perto da linha, você pode encontrar'});
/* Автобус и сифон (19.11): строка у своей стрелки в пролёте и приписка к третьей стороне. */
Object.assign(I18N.ru, {busEarly:n=>'сели раньше соседей на '+n+' с', busLate:n=>'сели позже соседей на '+n+' с', tpSiphon:'сифон: они уже отхилились'});
Object.assign(I18N.en, {busEarly:n=>'landed '+n+'s before the neighbours', busLate:n=>'landed '+n+'s after the neighbours', tpSiphon:'siphon: they already healed up'});
Object.assign(I18N.fr, {busEarly:n=>'posés '+n+' s avant les voisins', busLate:n=>'posés '+n+' s après les voisins', tpSiphon:'siphon : ils se sont déjà soignés'});
Object.assign(I18N.it, {busEarly:n=>'atterrati '+n+' s prima dei vicini', busLate:n=>'atterrati '+n+' s dopo i vicini', tpSiphon:'siphon: si sono già curati'});
Object.assign(I18N.pt, {busEarly:n=>'pousamos '+n+' s antes dos vizinhos', busLate:n=>'pousamos '+n+' s depois dos vizinhos', tpSiphon:'sifão: eles já se curaram'});
/* Live-ивенты Fortnite в карьере: новость в ленте в сам день. Даты и типы с вики Fortnite
   (tools/measured/wiki-live-events.txt). Только в настоящем году: карьера после 2026-го живёт по календарю 2026-го,
   и «Shattered» второй раз там не случается. Турниров не двигает. */
const CC_LIVE_EVENTS={'2019-02-02':['Showtime','concert'],'2019-05-04':['The Unvaulting','major'],'2019-07-20':['The Final Showdown','major'],
  '2019-10-13':['The End','finale'],'2019-12-14':['Live At Risky','major'],'2020-04-23':["Travis Scott's Astronomical",'concert'],
  '2020-06-15':['The Device','major'],'2020-12-01':['The Devourer of Worlds','major'],'2021-08-06':['Rift Tour','concert'],
  '2021-09-12':['Operation: Sky Fire','major'],'2021-12-04':['The End','finale'],'2022-06-04':['Collision','major'],
  '2022-12-03':['Fracture','finale'],'2023-12-02':['The Big Bang','finale'],'2024-11-01':['Remix: The Prelude','concert'],
  '2024-11-30':['Remix: The Finale','finale'],'2024-12-20':['Defrosting','concert'],'2025-06-07':['Death Star Sabotage','major'],
  '2025-08-02':['Super Showdown','major'],'2025-09-27':['Daft Punk Experience','concert'],'2025-11-29':['Zero Hour','finale'],
  '2026-06-05':['Shattered','major']};
function ccLiveEventOn(d){
  const cr=CAREER && CAREER.career, e=CC_LIVE_EVENTS[d];
  return e && cr && +String(d).slice(0,4)===+cr.year ? {name:e[0], type:e[1]} : null;
}
function ccLiveEventTick(d){
  const e=ccLiveEventOn(d); if(!e) return;
  const lf=ccLife(); lf.live=lf.live||[];
  if(lf.live.indexOf(d)>=0) return;
  lf.live.push(d);
  careerNews('flat', 'lfNewsLive'+e.type, [e.name], {day:d});
}
// Под постом ивента своя реакция зрителей, не «бывает» плохого вечера.
CC_CO_BY_KIND.unshift([/^lfNewsLive/, 'Live']);
Object.assign(I18N.ru, {ccCoLive:['кто смотрел','лучший ивент главы','сервера опять легли','я на скримах был лол','мурашки','где награды','ну это было мощно']});
Object.assign(I18N.en, {ccCoLive:['who watched','best event of the chapter','servers died again','i was in scrims lol','goosebumps','where are the rewards','that was insane']});
Object.assign(I18N.fr, {ccCoLive:['qui a regardé','meilleur event du chapitre','serveurs encore morts','j’étais en scrim mdr','frissons','où sont les récompenses','c’était fou']});
Object.assign(I18N.it, {ccCoLive:['chi l’ha visto','miglior evento del capitolo','server di nuovo giù','ero in scrim lol','pelle d’oca','dove sono le ricompense','pazzesco']});
Object.assign(I18N.pt, {ccCoLive:['quem assistiu','melhor evento do capítulo','servidor caiu de novo','eu tava no scrim kkk','arrepiei','cadê as recompensas','foi insano']});
CC_POST_BY.lfNewsLivemajor='press'; CC_POST_BY.lfNewsLivefinale='press'; CC_POST_BY.lfNewsLiveconcert='press';
Object.assign(I18N.ru, {lfNewsLivemajor:n=>'Live-ивент в Fortnite: '+n+'. Вся сцена смотрела его вместо скримов',
  lfNewsLivefinale:n=>'Финал главы: '+n+'. После ивента серверы ушли в даунтайм, дальше новая глава',
  lfNewsLiveconcert:n=>'В Fortnite прошёл '+n+'. Про шутят, что лобби вечера было тише обычного'});
Object.assign(I18N.en, {lfNewsLivemajor:n=>'Fortnite live event: '+n+'. The whole scene watched it instead of scrims',
  lfNewsLivefinale:n=>'Chapter finale: '+n+'. Servers went into downtime after the event, a new chapter is next',
  lfNewsLiveconcert:n=>n+' played in Fortnite. Pros joke the evening lobbies were quieter than usual'});
Object.assign(I18N.fr, {lfNewsLivemajor:n=>'Événement live Fortnite : '+n+'. Toute la scène l’a regardé au lieu des scrims',
  lfNewsLivefinale:n=>'Fin de chapitre : '+n+'. Les serveurs sont en maintenance après l’événement, un nouveau chapitre arrive',
  lfNewsLiveconcert:n=>n+' a eu lieu dans Fortnite. Les pros disent que les lobbys du soir étaient plus calmes'});
Object.assign(I18N.it, {lfNewsLivemajor:n=>'Evento live di Fortnite: '+n+'. Tutta la scena l’ha guardato invece degli scrim',
  lfNewsLivefinale:n=>'Finale di capitolo: '+n+'. Dopo l’evento i server sono andati in manutenzione, arriva un nuovo capitolo',
  lfNewsLiveconcert:n=>n+' si è tenuto in Fortnite. I pro scherzano che le lobby serali erano più tranquille'});
Object.assign(I18N.pt, {lfNewsLivemajor:n=>'Evento ao vivo no Fortnite: '+n+'. A cena toda assistiu em vez dos scrims',
  lfNewsLivefinale:n=>'Final de capítulo: '+n+'. Depois do evento os servidores entraram em manutenção, vem um novo capítulo',
  lfNewsLiveconcert:n=>n+' rolou no Fortnite. Os pros brincam que os lobbies da noite estavam mais calmos'});
