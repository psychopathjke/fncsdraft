/*@@PART js/career/calendar-mobile.js@@*/
/* СКОЛЬКО ЖДАТЬ — СКАЗАНО ДО НАЖАТИЯ И ВО ВРЕМЯ.

   Твит тестера 2.10: «162 дня перематываются больше пяти минут». Мгновенной перемотки не
   бывает — каждый вечер по дороге честно играется движком, — но ожидание без числа читается
   как зависание. Поэтому вопрос перед перемоткой называет время, а счётчик — остаток.

   Время вечера меряется на ЭТОМ устройстве (телефон и ПК различаются в разы) и хранится
   средним в localStorage; до первого замера — 1,5 с. Командная перемотка не меряется: там
   в вечер входит ожидание напарника. */
const CC_FF_MS_KEY='fncsdraft_ff_ms';
function ccFfEveningMs(){
  try{ const v=Number(localStorage.getItem(CC_FF_MS_KEY)); if(v>50 && v<120000) return v; }catch(e){}
  return 1500;
}
function ccFfEveningSaw(ms){
  if(!(ms>0)) return;
  try{ const old=ccFfEveningMs(); localStorage.setItem(CC_FF_MS_KEY, String(Math.round(old*0.7+ms*0.3))); }catch(e){}
}
// Секунды на перемотку от from (не включая) до iso: вечера по дороге и мелочь на пустые дни.
/* Вечером считается турнирный день календаря, сыграется он или нет (квалы, дивизион) —
   замер делится на тот же счёт, поэтому средняя сама учитывает и пропущенные. */
function ccFfSpan(iso, from){
  const days=careerEvents(); let ev=0, n=0;
  for(let d=ccAddDays(from||careerToday(),1); d<=iso; d=ccAddDays(d,1)){
    n++;
    if((days.get(d)||[]).some(e=>CC_PLAYABLE.indexOf(e.kind)>=0)) ev++;
  }
  return {ev:ev, n:n};
}
const CC_FF_DAY_MS=30;
function ccFfEtaSec(iso, from){
  const s=ccFfSpan(iso, from);
  return Math.max(1, Math.round((s.ev*ccFfEveningMs()+s.n*CC_FF_DAY_MS)/1000));
}
function ccFfEtaText(iso){ return L().ccFfEta(L().ccFfTime(ccFfEtaSec(iso))); }
function careerFfConfirm(days){
  if(!(days>0)) return;
  const ask=L().ccFfConfirm(days)+' '+ccFfEtaText(ccAddDays(careerToday(), days));
  if(ccMpOn() || ccRaceFfOn()){ ccAsk(ask, ()=>careerFfToDay(ccAddDays(careerToday(), days))); return; }
  ccAsk(ask, ()=>careerFastForward(days));
}
/* На каком острове играется этот вечер.

   Домов три и на разных картах, а карточка матча показывает один — тот, куда
   сядут сегодня. Релоад играется на острове своего круга (careerReloadOn), его
   Чемпионат — на четвёртом, всё остальное — на сезонном. Те же три правила,
   что и у раннеров, только спрошенные заранее. */
/* ОСТРОВ СОЛО-ФНКС — один ответ на карточку вечера, на метку и на раннер.

   s42 — остров седьмой главы, и он есть только у календаря 2026-го. Тестер,
   22 сентября: «в симуляции 5-го чаптера карта этого сезона». Так и было:
   careerNightSet снимал s42 лишь с 2025-го, а runCareerSoloSeries вообще ни с
   какого года — и соло-вечер 2024-го садился на остров нынешнего сезона
   вместо f1–f4, а метка при этом ставилась на сезонном (careerSoloSet в
   дуо-год отвечает careerBrSet). Точка на одном острове, вечер на другом.

   Теперь правило одно и живёт здесь: своя глава у своего года
   (careerBrSet), седьмая — только там, где она и есть. */
function ccSoloFncsSet(ev){
  // FNCS Solo Reload — на острове Reload своего года, как релоадные Victory Cup.
  // В ноябре 2026-го это Nitemare Island (набор r5).
  if(ev && ev.spec && ev.spec.reload) return (ccS43Trios(careerToday()) && ZONE_SETS.r5) ? 'r5' : ccReloadSetOfYear();
  // Год главы по кругу (ccCycleIsland): FNCS Solos — на острове этого года, как в прошлых годах.
  return (ev && ev.spec && ZONE_SETS.s42 && !ccCycleIsland(careerToday()) && !ccIs2025() && !ccIs2024() && !ccIs2023() && !ccIs2022() && !ccIs2021() && !ccIs2020() && !ccIs2019()) ? 's42' : careerBrSet();
}
function careerNightSet(next){
  const day=next && next.day;
  if(next && next.type==='reload'){
    const ev=careerReloadOn(day);
    if(ev && ZONE_SETS[ev.set]) return ev.set;
  }
  if(next && next.type==='gc' && !careerGclcOn(day) && ZONE_SETS.r4) return 'r4';
  // Три Victory Cup в году — релоадные, и раннер играет их на r4. См. runCareerVictory.
  if(next && next.type==='victory'){
    const ev=careerVictoryOn(day);
    if(ev && ccIsReloadEv(ev)) return ccReloadSetOf(ev);
  }
  // 2025: Reload Performance Evaluation — на острове Reload того года.
  if(next && next.type==='eval' && ccEvalIsReload(day)) return ccReloadSetOfYear();
  // FNCS Solos — остров седьмой главы (s42), и в трио-год тоже. См. careerSoloSet.
  if(next && next.type==='solo'){
    const ev=careerSoloSeriesOn(day);
    if(ev) return ccSoloFncsSet(ev);
  }
  return careerBrSet();
}
/* Вечер, который играется ОДНИМ игроком: Solo Series и соло-Victory Cup.

   Скриншот соло-Victory Cup в команде: карточка матча звала
   ДУО-метку и писала «дуо · дивизион 1», хотя вечер соло. Соло-метка в
   команде — личная, четвёртая карта (см. careerSpotSets, ключ 'solo'), и
   искать её надо по виду вечера, а не по типу события. */
function careerNightSolo(next){
  if(!next) return false;
  if(next.type==='solo') return true;
  if(next.type==='victory'){ const ev=careerVictoryOn(next.day); return !!(ev && ev.mode==='solo'); }
  return false;
}
/* Ключ метки сегодняшнего вечера: у соло-турнира она своя, и в одиночной
   карьере тоже — см. careerSpotSets. */
function careerNightSpotKey(next){
  const set=careerNightSet(next);
  if(next && next.type==='nations') return 'nations';   // вечер сборной — её метка
  if(careerNightSolo(next)) return 'solo';
  // Кап другого формата на сезонном острове — спот этого формата (ccFmtSpotKey).
  if(next && next.type==='victory' && set===careerBrSet()){
    const v=careerVictoryOn(next.day||careerToday());
    const f=v ? ({duo:2, trio:3, squad:4})[v.mode] : 0;
    if(f && f!==careerSquadSize()) return ccFmtSpotKey(f, set);
  }
  return careerSpotKey(set);
}
/* Куда садимся сегодня — картинкой, на карточке матча.

   Правка: «одна локация ещё должна быть на превью, ту которую
   выбрал». Дом виден в своей плитке, но перед нажатием «играть» на экране его
   не было, а это ровно то, что игрок держит в голове, когда решает, играть
   самому или отдать вечер симуляции: где он сядет и сколько там ауры.

   Показывается ровно один — дом того острова, на котором играется ЭТОТ вечер;
   если дома на нём нет, блока нет вовсе, и это тоже сообщение. */
function careerNightSpotHTML(next){
  const set=careerNightSet(next);
  // Соло-вечер в команде — личная соло-метка, а не дуо-дом сезона. См. careerNightSpotKey.
  const sp=careerSpotList(careerNightSpotKey(next))[0];
  // Без своей метки на этом острове (финал на другом острове, новый сезон) карта высадок всё равно открывается.
  const mapBtn='<button class="ch-spot-map" onclick="event.stopPropagation(); ccDropMapOpen()">'+esc(L().ccDropMap)+'</button>';
  if(!sp) return '<div class="ch-spot ch-spot-nomark"><div class="ch-spot-in">'+mapBtn+'</div></div>';
  const shot=careerSpotShotHTML(sp.i, set, 'ch-spot-shot', 16/9);
  if(!shot) return '<div class="ch-spot ch-spot-nomark"><div class="ch-spot-in">'+mapBtn+'</div></div>';
  // И с кем ты сейчас в ссоре: тот, кто придёт именно сюда. Это часть ответа
  // на вопрос «чего ждать от вечера», а значит место ей здесь.
  const beef=careerBeefHot()[0];
  return '<div class="ch-spot">'+shot+
    '<div class="ch-spot-in"><em>'+L().ccNightSpotCap+'</em>'+
    '<b>'+L().landingZoneSuffix(sp.i+1)+'</b>'+
    careerSpotAuraBarHTML(sp.aura||0)+
    (beef ? '<i class="ch-spot-beef">'+esc(L().ccBeefTag(ccHandle(beef.h)))+'</i>' : '')+
    '<button class="ch-spot-map" onclick="event.stopPropagation(); ccDropMapOpen()">'+esc(L().ccDropMap)+'</button>'+
    '</div></div>';
}
/* КАРТА ВЫСАДОК перед капом: кто где садится на острове ближайшего вечера и где стычки. Из книги высадок сезона
   (ccDropBook): команды твоих лобби помнят свою точку весь сезон, так что карта та же, по которой сядет комната.
   Новая книга (новый сезон, новый остров) пустая: заполняется после первого вечера на этом острове. */
function ccDropMapData(next){
  const cr=CAREER && CAREER.career; if(!cr || !next) return null;
  const set=careerNightSet(next), grid=careerSpotGrid(set), zones=ZONE_SETS[grid]||[];
  const book=cr.dropBook, nm=(book && book.nm)||{}, at=(book && book.at)||{};
  const zoneOf=xy=>{
    if(!xy) return -1;
    const exact=zones.findIndex(z=>z.x+','+z.y===xy); if(exact>=0) return exact;
    const [x, y]=String(xy).split(',').map(Number);
    return zones.findIndex(z=>x>=z.x && x<z.x+z.w && y>=z.y && y<z.y+z.h);
  };
  const by=new Map();
  Object.keys(nm).forEach(k=>{
    const e=nm[k]; if(!e || (e.s!==set && e.s!==grid)) return;
    const i=zoneOf(at[k]); if(i<0) return;
    if(!by.has(i)) by.set(i, []);
    if(by.get(i).indexOf(e.n)<0) by.get(i).push(e.n);
  });
  const sp=careerSpotList(careerNightSpotKey(next))[0];
  return {set, grid, zones, by, mine:sp ? sp.i : null};
}
function ccDropMapOpen(){
  ccDropMapClose();
  let next=null; try{ next=careerNext(); }catch(e){}
  const d=ccDropMapData(next); if(!d) return;
  ccDropMapModal(d, (next && (next.label||next.title))||'');
}
/* КАРТА ВЫСАДОК КОМНАТЫ перед игрой (его вопрос 19.11: «почему нет карты перед финалами, кто куда падает?»). Как превью
   карты финала у Vital Scrims («Grand Finals Map Preview») и отметки точек на сессиях Noble: перед первой игрой этапа —
   кто куда садится в ЭТОЙ комнате. Расклад — тот же pre, по которому пойдёт игра (careerLandingPick), не догадка. */
let CC_DROP_ROOM=null;
function onMapNow(){ return !!(typeof CC_RUN_MAP!=='undefined' && CC_RUN_MAP && CC_RUN_MAP.isConnected); }
function ccDropRoomData(pre, you, home){
  const zones=ALL_LANDING_ZONES||[], by=new Map();
  const nameOf=t=>(t.squad||[]).map(c=>c && c.handle).filter(Boolean).join(' + ') || String(t.name||'').replace(/<[^>]*>/g,'');
  if(pre && pre.forEach) pre.forEach((list, zone)=>{ const i=zones.indexOf(zone); if(i<0) return;
    (list||[]).forEach(t=>{ if(!t || t===you || t.isYou) return; if(!by.has(i)) by.set(i, []); by.get(i).push(nameOf(t)); }); });
  return {set:ACTIVE_LANDING_SET, grid:ACTIVE_LANDING_SET, zones:zones, by:by, mine:home ? zones.indexOf(home) : null,
          meName:(you && you.squad ? you.squad.map(c=>c && c.handle).filter(Boolean).join(' + ') : '')};
}
function ccDropOverlay(d, label){
  ccDropMapClose();
  const T=L(), el=document.createElement('div');
  el.id='ccDropMapModal'; el.className='cc-dm-wrap cc-dm-pick';
  el.innerHTML='<div class="cc-dm" role="dialog" aria-modal="true"><div class="cc-dm-head"><b>'+esc(T.ccDropMap)+'</b><em>'+esc(String(label||'').replace(/<[^>]*>/g,''))+'</em></div>'+
    ccDropMapBody(d)+'<div class="cc-dm-ask"></div></div>';
  document.body.appendChild(el);
  // Широкий экран: карта во всю высоту окна по пропорциям острова (CSS тут без размеров — иначе пропорции схлопывают её).
  try{ const mp=el.querySelector('.cc-dm-map');
    if(mp && innerWidth>=900){ const a=String(MAP_ASPECT[d.grid]||'1100/970').split('/'), r=(+a[0])/(+a[1]);
      const maxH=innerHeight*0.96-90, maxW=Math.min(1280, innerWidth*0.96)-400-16-40;
      let h=maxH, w=h*r; if(w>maxW){ w=maxW; h=w/r; }
      mp.style.width=Math.round(w)+'px'; mp.style.height=Math.round(h)+'px'; } }catch(e){}
  return {el:el, host:el.querySelector('.cc-dm-ask')};
}
function ccDropRoomOpen(){ if(CC_DROP_ROOM) ccDropMapModal(CC_DROP_ROOM.d, CC_DROP_ROOM.title); }
function ccDropMapModal(d, label){
  ccDropMapClose();
  const T=L();
  const el=document.createElement('div');
  el.id='ccDropMapModal'; el.className='cc-dm-wrap';
  el.onclick=e=>{ if(e.target===el) ccDropMapClose(); };
  el.innerHTML='<div class="cc-dm" role="dialog" aria-modal="true"><div class="cc-dm-head"><b>'+esc(T.ccDropMap)+'</b><em>'+esc(label||'')+'</em>'+
    '<button class="cc-dm-x" onclick="ccDropMapClose()" aria-label="'+esc(T.ccDropMapClose)+'">×</button></div>'+ccDropMapBody(d)+'</div>';
  document.body.appendChild(el);
}
function ccDropMapBody(d){
  const T=L(), art=MAP_ART[d.grid]||MAP_ART.m2, asp=MAP_ASPECT[d.grid]||'1100/970';
  const contest=i=>((d.by.get(i)||[]).length+(d.mine===i ? 1 : 0))>=2;
  const me=d.meName || ccHandle(CAREER.player.nick||CAREER.player.handle||'');
  const boxes=d.zones.map((z,i)=>{
    const who=(d.by.get(i)||[]).slice(); if(d.mine===i) who.unshift(me);
    if(!who.length) return '';
    const cls='cc-dm-box'+(contest(i) ? ' hot' : '')+(d.mine===i ? ' me' : '');
    return '<div class="'+cls+'" style="left:'+z.x+'%;top:'+z.y+'%;width:'+z.w+'%;height:'+z.h+'%"><span>'+
      who.slice(0, 3).map(n=>esc(n)).join('<br>')+(who.length>3 ? '<br>+'+(who.length-3) : '')+'</span></div>';
  }).join('');
  const hot=[...d.zones.keys()].filter(contest);
  const rows=hot.map(i=>{ const who=(d.by.get(i)||[]).slice(); if(d.mine===i) who.unshift(me);
    return '<li'+(d.mine===i ? ' class="me"' : '')+'><b>'+esc(T.landingZoneSuffix(i+1))+'</b><span>'+who.map(n=>esc(n)).join(' · ')+'</span></li>'; }).join('');
  const teams=[...d.by.values()].reduce((s,l)=>s+l.length, 0);
  return '<div class="cc-dm-map" style="aspect-ratio:'+asp+';background-image:url(\''+art+'\')">'+boxes+'</div>'+
    (teams ? '<p class="cc-dm-note">'+esc(T.ccDropMapNote(teams, hot.length))+'</p>'+(rows ? '<h5>'+esc(T.ccDropMapHot)+'</h5><ul class="cc-dm-list">'+rows+'</ul>' : '')
           : '<p class="cc-dm-note">'+esc(T.ccDropMapNone)+'</p>');
}
function ccDropMapClose(){ const el=document.getElementById('ccDropMapModal'); if(el) el.remove(); }
/* Кто отыгрывает вечер — игрок или симуляция.

   Правка: «надо дать выбор игроку: сыграть самому игру или
   простимулировать, можно это на иконке добавить, когда матч, за него просто
   варианты выберут». Вечер это одиннадцать игр по два вопроса — двадцать две
   панели, и когда хочется просто дойти до результата, они стоят поперёк.

   Симуляция здесь значит ровно две вещи: не спрашивать и не показывать. Первое
   делает playGameWithChoices (см. там), второе — beginAnimatedStage, тем же
   флагом, которым работает кнопка «пропустить»: она уже умеет пройти турнир
   одним нажатием, и второй такой механики заводить не надо.

   Настройка живёт в карьере, а не в странице: это свойство прохождения, и
   переживает перезагрузку вместе со слотом. */
function careerSimOn(){
  const cr=CAREER && CAREER.career;
  return !!(cr && cr.sim);
}
function careerSimSet(on){
  const cr=CAREER && CAREER.career; if(!cr) return;
  cr.sim=!!on;
  careerSave();
  // Режим командный по последствиям, хоть и личный по хранению: напарник
  // должен увидеть его сразу, а не перед вечером. См. ccMpModeWhy.
  if((ccMpOn() || (typeof ccRaceLive==='function' && ccRaceLive())) && typeof MP!=='undefined' && MP.sendCard) MP.sendCard();
  // И соперникам по гонке — своей строкой: по ней комната решает «вместе или врозь».
  if(typeof ccRaceLive==='function' && ccRaceLive()){ try{ careerRaceSend(); }catch(e){} }
  careerRenderHub('centre');
}
function careerSimRowHTML(){
  const on=careerSimOn();
  const b=(mine, icon, label, hint)=>
    '<button class="ch-simbtn'+(mine===on?' on':'')+'" onclick="careerSimSet('+mine+')" '+
    'title="'+esc(hint)+'"><i>'+icon+'</i>'+esc(label)+'</button>';
  /* В команде режим обязан совпадать, поэтому здесь же сказано, что выбрал
     напарник, а при расхождении — что вечер не начнётся. Ставится под самими
     кнопками: чинить это игрок будет ими. */
  const peer=(ccMpOn() && typeof MP!=='undefined') ? MP.peer : null;
  const mate=(peer && peer.sim!==undefined && peer.sim!==null)
    ? '<div class="ch-hint" style="margin:0;">'+
        L().ccMpModeMate(peer.sim ? L().ccSimAuto : L().ccSimSelf)+'</div>'
    : '';
  // В гонке расхождение режимов не запирает вечер, а разводит комнаты — и об этом
  // сказано здесь же, под кнопками, которыми это чинят.
  const raceWhy=ccRaceModeWhy();
  // В гонке — режим каждого соперника строкой, чтобы было видно, кто выбрал не то.
  const raceMates=(!ccMpOn() && typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceRivals==='function')
    ? ccRaceRivals().filter(p=>p.card && p.card.sim!=null).map(p=>
        '<div class="ch-hint" style="margin:0;">'+esc(String(p.nick||p.card.handle||'')+': '+
          (p.card.sim ? L().ccSimAuto : L().ccSimSelf))+'</div>').join('')
    : '';
  const why=ccMpModeWhy() || raceWhy;
  const bad=(why ? '<div class="ch-hint" style="margin:0;color:#ff9b9b;">'+why+'</div>' : '')+raceMates;
  return '<div class="ch-simwrap"><span class="ch-ffcap">'+L().ccSimCap+'</span>'+
    '<div class="ch-sim">'+
      b(false, '&#127918;', L().ccSimSelf, L().ccSimSelfHint)+
      // Глаз, а не перемотка: правая кнопка больше не «сразу результат», а
      // «смотрю, но меня не спрашивают».
      b(true,  '&#128065;', L().ccSimAuto, L().ccSimAutoHint)+
    '</div>'+mate+bad+'</div>';
}
/* ПЕРЕИГРАТЬ ДЕНЬ (Notion 21.10, игроки: «добавь возможность на игровой день назад откатиться» — на финале
   World Cup зависла игра, и весь финал проскипался). Перед каждым вечером одиночной карьеры — сжатый снимок
   сейва (один на слот, первый за день, lz как у большого сейва); кнопка возвращает карьеру к нему и
   перезагружает страницу, чтобы кэши мира собрались заново.
   ОНЛАЙН (его слово 22.10: «можно онлайн сделать тоже»): день там общий, поэтому откат — голос, как
   перемотка (ccMpFfSaw): предложение уходит всем в комнате, и когда согласились все, каждый возвращается к
   СВОЕМУ снимку того же дня. Снимок у каждого свой, но снят в начале одного и того же общего дня. После
   перезагрузки сервер прислал бы командное состояние новее отката — метка _undogo велит его не брать, а
   хозяину (роль a) отправить своё (ccUndoGoSkip). */
function ccUndoKey(){ return LS_SLOT(ccSlotMine())+'_undo'; }
function ccUndoOk(){ return !(CAREER && CAREER._mgr); }
function ccUndoShared(){ return ccMpTeam() || (typeof ccRaceOn==='function' && ccRaceOn()); }
function ccUndoSnap(){
  if(!CAREER || !CAREER.career || !ccUndoOk() || typeof LZString==='undefined') return;
  if((typeof CC_FF!=='undefined' && CC_FF) || CC_SKIP_ALL) return;
  const day=careerToday(), key=ccUndoKey();
  if(CC_LZ_Q[key] && CC_LZ_Q[key].day===day) return;
  try{ const old=JSON.parse(localStorage.getItem(key)||'null'); if(old && old.day===day) return; }catch(e){}
  // Сжатие в воркере, как у сейва (ccLzPut): снимок снят сейчас, на диск ляжет, когда досчитается.
  try{ localStorage.removeItem(key);
       ccLzPut(key, JSON.stringify(CAREER), z=>{ try{ localStorage.setItem(key, JSON.stringify({day:day, data:CC_SAVE_LZ+z})); }catch(e){ try{ localStorage.removeItem(key); }catch(e2){} } });
       if(CC_LZ_Q[key]) CC_LZ_Q[key].day=day; }
  catch(e){ try{ localStorage.removeItem(key); }catch(e2){} }
}
function ccUndoInfo(){
  if(!CAREER || !CAREER.career || !ccUndoOk()) return null;
  // Снимок ещё сжимается в воркере: день уже известен, данные дочитает ccUndoRestore.
  const q=CC_LZ_Q[ccUndoKey()];
  try{ const u=q && q.day ? {day:q.day, data:'pend'} : JSON.parse(localStorage.getItem(ccUndoKey())||'null');
       return (u && u.day && u.data && u.day<=careerToday() && (u.day<careerToday() || ccUndoPlayed(u.day))) ? u : null; }catch(e){ return null; }
}
// Вечер этого дня уже в журнале — откатывать есть что, даже если день ещё не сменился.
function ccUndoPlayed(day){ try{ return (CAREER.career.log||[]).some(x=>x && x.day===day); }catch(e){ return false; } }
function ccUndoRestore(u){
  try{ if(u.data==='pend'){ ccLzFlush(ccUndoKey()); u=JSON.parse(localStorage.getItem(ccUndoKey())||'null'); if(!u || !u.data) return; } }catch(e){ return; }
  try{ CC_LZ_Q={}; localStorage.setItem(LS_SLOT(ccSlotMine()), u.data); }catch(e){ return; }
  if(ccUndoShared()) try{ localStorage.setItem(ccUndoKey()+'go', u.day); }catch(e){}
  location.reload();
}
function ccUndoAskRestore(){
  const u=ccUndoInfo(); if(!u) return;
  if(ccUndoShared() && typeof MP!=='undefined' && MP.act){
    ccAsk(L().ccUndoAsk(ccDayLabel(u.day)), ()=>{ CC_MP_UNDO.err=false; MP.act('undo', {by:ccMpId(), day:u.day, at:careerToday()}); });
    return;
  }
  ccAsk(L().ccUndoAsk(ccDayLabel(u.day)), ()=>ccUndoRestore(u));
}
// Голоса за откат: day — день снимка, mine — свой голос, who — чужие.
let CC_MP_UNDO={day:null, mine:false, who:{}, err:false};
function ccUndoVotes(){ return (CC_MP_UNDO.mine?1:0)+Object.keys(CC_MP_UNDO.who||{}).length; }
function ccUndoSaw(kind, p){
  if(!p || !p.day) return;
  if(kind==='undono'){
    if(CC_MP_UNDO.day===p.day) CC_MP_UNDO={day:null, mine:false, who:{}, err:!!p.nosnap};
    try{ careerRenderHub(); }catch(e){}
    return;
  }
  const u=ccUndoInfo();
  // Своего снимка этого дня нет (не играл его или уже перемотал дальше) — откатываться не к чему.
  if(!u || u.day!==p.day){
    if(p.by!==ccMpId()) MP.act('undono', {by:ccMpId(), day:p.day, nosnap:true});
    return;
  }
  if(CC_MP_UNDO.day!==p.day) CC_MP_UNDO={day:p.day, mine:false, who:{}, err:false};
  if(p.by===ccMpId()) CC_MP_UNDO.mine=true; else CC_MP_UNDO.who[p.by]=true;
  if(CC_MP_UNDO.mine && ccUndoVotes()>=ccMpFfHumans()){ ccUndoRestore(u); return; }
  try{ careerRenderHub(); }catch(e){}
}
function ccUndoDecline(){
  if(CC_MP_UNDO.day && typeof MP!=='undefined' && MP.act) MP.act('undono', {by:ccMpId(), day:CC_MP_UNDO.day});
}
function ccUndoOfferHTML(){
  if(CC_MP_UNDO.err && !CC_MP_UNDO.day) return '<div class="cal-ask cc-mp-ff"><span>'+esc(L().ccUndoNoSnap)+'</span></div>';
  const u=ccUndoInfo();
  if(!CC_MP_UNDO.day || !u || u.day!==CC_MP_UNDO.day) return '';
  const d=ccDayLabel(CC_MP_UNDO.day);
  if(!CC_MP_UNDO.mine)
    return '<div class="cal-ask cc-mp-ff"><span>'+esc(L().ccUndoPeer(d))+'</span>'+
           '<button class="ch-sign" onclick="ccUndoAskRestore()">'+esc(L().ccUndoYes)+'</button>'+
           '<button class="cc-back" onclick="ccUndoDecline()">'+esc(L().ccMpFfNo)+'</button></div>';
  const txt=String(L().ccUndoWait(d)).replace('1/2', ccUndoVotes()+'/'+ccMpFfHumans());
  return '<div class="cal-ask cc-mp-ff"><span>'+esc(txt)+'</span>'+
         '<button class="cc-back" onclick="ccUndoDecline()">'+esc(L().ccDecline)+'</button></div>';
}
/* Первое состояние от сервера после онлайн-отката: оно новее снимка — не брать. Хозяин отдаёт своё
   (снимок того же дня), второй дождётся его обычным 'team'. Метка живёт одну загрузку. */
function ccUndoGoSkip(team){
  let go=null; try{ go=localStorage.getItem(ccUndoKey()+'go'); localStorage.removeItem(ccUndoKey()+'go'); }catch(e){}
  const cr=CAREER && CAREER.career;
  if(!go || !cr || cr.day!==go || !team || !team.day || !(team.day>cr.day)) return false;
  if(ccMpRole()==='a') setTimeout(function(){ try{ if(typeof MP!=='undefined' && MP.push) MP.push(ccTeamState()); }catch(e){} }, 0);
  return true;
}
function ccUndoBtnHTML(){
  const u=ccUndoInfo(); if(!u) return '';
  return '<button class="ch-ffbtn" onclick="ccUndoAskRestore()" title="'+esc(L().ccUndoHint)+'"><i>&#8634;</i>'+esc(L().ccUndoBtn(ccDayLabel(u.day)))+'</button>';
}
function careerFfButtonsHTML(){
  if(CAREER.career.seasonOver) return '';
  // В команде день идёт вдвоём — перематывать его в одиночку нечем.
  const shared=ccMpOn() || ccRaceFfOn();
  const btn=(days, label)=>'<button class="ch-ffbtn" onclick="careerFfConfirm('+days+')" title="'+
    esc(shared ? L().ccMpFfHint : L().ccFfHint)+'"><i>'+CC_BTN_ICON.ff+'</i>'+label+'</button>';
  return '<div class="ch-ffwrap"><span class="ch-ffcap">'+L().ccFfCap+'</span>'+
    (shared ? ccMpFfOfferHTML() : '')+(ccUndoShared() ? ccUndoOfferHTML() : '')+
    '<div class="ch-ff">'+btn('CC_FF_WEEK', L().ccFfWeek)+btn('CC_FF_MONTH', L().ccFfMonth)+(ccUndoShared() && CC_MP_UNDO.mine ? '' : ccUndoBtnHTML())+
    '</div>'+(shared ? '<div class="ch-ffnote"><i>&#128101;</i><span>'+esc(L().ccMpFfHint)+'</span></div>' : '')+'</div>';
}
// The best rating a day's energy can buy, by the same weighting the card is
// built from. One thing a day, deliberately: a player may now spend the whole
// store in an evening, and an auto-pilot that did the same would be a career
// played by nobody. It takes the best value it can afford and rests when it
// cannot afford anything, which is what the store allows over a season anyway.
function careerFfSpendDay(){
  if(careerDayDone()) return null;
  const afford=CC_DAY_ACTS
    .filter(a=>a.energy<=careerEnergy() && Object.keys(a.gain||{}).length && !a.crew && !a.watch)
    .map(a=>({a:a, per:ATTR_KEYS.reduce((t,k)=>t+(a.gain[k]||0)*ATTR_W[k],0)/a.energy}))
    .sort((x,y)=>y.per-x.per);
  // Nothing affordable is a day the store cannot pay for, and resting is what a
  // player does with one. It is in CC_DAY_ACTS with no gain, so it is not in the
  // list above and has to be asked for by name.
  if(!afford.length) return careerDoAct('rest');
  return careerDoAct(afford[0].a.id);
}
/* Pressing a day on the calendar.

   The same fast-forward the two buttons run, with the arithmetic done off the
   date instead of typed as a span - so "the Major is on the twenty-fifth" and
   "take me to the Major" are the same gesture. Everything on the way is played,
   which is the whole point: this is not a jump, it is the year happening
   quickly. */
/* And it asks first.

   A day on the calendar is one press and a month of a career: tournaments
   played, days spent, offers expired, a partner possibly gone. A press that
   large cannot be the same gesture as looking at which Saturday the Major is
   on, and the calendar is a screen people scroll around. So the day is picked,
   the bar says what it is about to do and how long it is, and the second press
   is the one that runs it. */
let CH_FF_ASK=null;
function careerFfAsk(iso){
  if(CC_FF || !iso) return;
  const from=careerToday();
  if(!(iso>from) || CAREER.career.seasonOver) return;
  CH_FF_ASK=iso;
  careerRenderHub('calendar');
}
function careerFfCancel(){ CH_FF_ASK=null; careerRenderHub('calendar'); }
function ccFfDays(iso){
  return Math.round((new Date(iso+'T00:00:00Z')-new Date(careerToday()+'T00:00:00Z'))/86400000);
}
// What is in the way, so the bar can say what it is asking about rather than
// only how many days it is.
function ccFfEvents(iso){
  const days=careerEvents();
  let n=0;
  for(let d=ccAddDays(careerToday(),1); d<=iso; d=ccAddDays(d,1))
    n+=(days.get(d)||[]).length;
  return n;
}
/* Вопрос «некем играть» — отдельной строкой, чтобы его можно было задать сторожу
   без перемотки целиком: сама перемотка живёт в асинхронном цикле с экранами. */
function ccFfNoMateWhy(next){
  if(!next || !next.type || CC_PLAYABLE.indexOf(next.type)<0) return null;
  if(!careerNoMate(next.type)) return null;
  /* Напарник есть, не хватает третьего (трио/сквад этапа) — так и сказать: «нужен напарник» при живом
     напарнике читалось как поломка (годовой прогон вдвоём 2019, FNCS Season X в трио). */
  const have=(careerMates()||[]).filter(Boolean).length;
  return have ? L().ccFfNoThird(careerSquadSize()) : L().ccFfNoMate;
}
function careerFfToDay(iso){
  if(CC_FF || !iso) return;
  const from=careerToday();
  if(!(iso>from) || CAREER.career.seasonOver) return;
  // В команде и в гонке — голос за дату; перемотка пойдёт, когда подтвердят все (ccMpFfSaw).
  if(ccMpOn() || ccRaceFfOn()){ ccMpFfPropose(iso); careerRenderHub(); return; }
  CH_FF_ASK=null;
  const days=ccFfDays(iso);
  if(days>0) careerFastForward(days);
}
async function careerFastForward(days, agreed){
  if(CC_FF) return;
  /* Командную карьеру перематывать нельзя, и это не запрет ради запрета.

     День в ней двигает только close от сервера (см. careerAdvanceTo), а вечер
     начинается, когда готовы оба (ccMpGate). Перемотка не знает ни того, ни
     другого: на турнирном дне она уходит в гейт и встаёт там навсегда, ожидая
     напарника, который в это время живёт свой день; на обычном — крутит
     четыреста оборотов вокруг дня, который не двигается, и рисует «0 дней
     пропущено». Ни один из двух исходов игроку не объяснить.

     Кнопки при этом не прячутся, а называют причину: пропавшая кнопка
     читается как поломка. См. careerFfButtonsHTML. */
  if((ccMpOn() || ccRaceFfOn()) && !agreed) return;
  const cr=CAREER.career, pl=CAREER.player;
  if(cr.seasonOver) return;
  const until=ccAddDays(careerToday(), days);
  // Шаг пустого дня в команде: оба идут по одному календарю к одной дате.
  const step=function(day){ if(ccMpOn()) CC_MP_DAY_DUE=true; careerAdvanceTo(ccAddDays(day, 1)); };
  CC_FF={until:until, played:[], trained:0,
         from:{day:careerToday(), div:cr.division, balance:cr.balance||0,
               earnings:cr.earnings||0, reach:careerReach(),
               ovr:(pl.ovrExact!=null?pl.ovrExact:pl.ovr)}};
  // Замер вечера на этом устройстве — см. ccFfEveningMs. Счёт вечеров тот же, что у оценки.
  const ffSpan=ccFfSpan(until), ffT0=(typeof performance!=='undefined' ? performance.now() : Date.now());
  careerFfProgress(0, days);
  // The skip button, held down. Every runner turns skipAnimation off when it
  // starts, so this turns it back on rather than editing eight of them — and it
  // is honest about what a fast-forward is: the player pressing skip.
  const holdSkip=setInterval(()=>{ skipAnimation=true; }, 10);
  let guard=0;
  /* Карьера перемотки — та, с которой она начата (его ошибка 1.10: «Cannot read properties of null
     (reading 'career') at careerFfDigest»). Вышел из карьеры, открыл другой слот или новую посреди
     перемотки — она останавливается и итог не рисует: иначе доигрывала бы вечера уже в чужом сейве. */
  const ffCareer=CAREER;
  try{
    while(CAREER===ffCareer && careerToday()<until && !cr.seasonOver && guard++<400){
      const day=careerToday();
      const next=careerNext();
      if(CC_FF.stop){ CC_FF.err={day:day, kind:'', text:CC_FF.stop.text}; break; }
      /* В команде день с турниром нельзя перешагнуть из-за связи: пока
         лобби переподключается, careerCanPlay говорит «нельзя», и перемотка
         уходила дальше без вечера — напарник ждал её на гейте до потолка.
         Ждём связь до минуты; не дождались — перемотка встаёт с причиной. */
      if(next && ccMpOn() && !careerCanPlay(next) && ccMpWhy()){
        var lw=0; const box=ccMpWaitBox(L().ccMpFfLink, true);
        while(lw++<120 && !careerCanPlay(next) && ccMpWhy()) await new Promise(r=>setTimeout(r, 500));
        box();
        if(!careerCanPlay(next) && ccMpWhy()){
          CC_FF.err={day:day, kind:next.type||'', text:String(ccMpWhy()||'')};
          if(typeof MP!=='undefined' && MP.act) try{ MP.act('fferr', {by:ccMpId(), day:day, text:CC_FF.err.text}); }catch(e){}
          break;
        }
      }
      /* День, который не отыгрался, ОСТАНАВЛИВАЕТ перемотку и НАЗЫВАЕТ себя.

         Правка со скрином: «0 дней пропущено», а под ним —
         «турниров в эти дни нет». Так выглядела упавшая перемотка: исключение
         улетало из цикла, finally рисовал дайджест по нетронутым числам, и
         игрок видел вежливое «ничего не произошло» вместо ошибки. Ни один тип
         вечера воспроизвести не дал (probe-ff-throw.js: cup, final, eval,
         reload, solo, victory — все проходят), то есть дело в чьём-то
         конкретном сейве, и молчать об этом нельзя: без текста ошибки чинить
         нечего.

         Поэтому день ловится здесь, запоминается в CC_FF.err вместе со своей
         датой и уходит в дайджест; в консоль он тоже попадает целиком. */
      /* Гонка: на турнирный день комната ждёт остальных. Пустые дни каждый шагает
         сам, и к вечеру один приходит раньше другого; без этой паузы ccRaceApartWhy
         читал бы «другой день» и разводил комнаты внутри перемотки. Ждём до минуты,
         пока строки соперников не скажут тот же день. */
      if(ccRaceFfOn()){
        let rw=0;
        careerRaceSend();   // своя строка с сегодняшним днём — до того, как ждать чужие
        /* Свой турнирный день — как было (причина 'day' у ccRaceApartWhy). Любой другой —
           по календарю комнаты: пока кто-то живой стоит на дне раньше моего, я не шагаю.
           Потолок тот же, пять минут: ушедший совсем не держит перемотку вечно. */
        const late=()=>(next && careerCanPlay(next)) ? (ccRaceApartWhy(next)==='day' || ccRaceFfBehind()>0)
                                                     : ccRaceFfBehind()>0;
        while(rw++<600 && late()){
          await new Promise(r=>setTimeout(r, 500));
          if(rw%20===0) careerRaceSend();   // и свою строку повторяем: соседу нужен мой день
        }
      }
      /* Нет напарника: перемотка встаёт и говорит причину, как при ожидании связи.
         Иначе она молча шагала мимо всех парных вечеров (в прогоне 60 турниров вместо
         128). В гонке остановка уходит соседу тем же 'fferr'. Проверка после
         careerCanPlay: если вечер идёт, останавливать нечего. */
      const playable=next && careerCanPlay(next);
      if(!playable && ccFfNoMateWhy(next)){
        CC_FF.err={day:day, kind:next.type||'', text:ccFfNoMateWhy(next)};
        if(ccRaceFfOn() && typeof MP!=='undefined' && MP.act)
          try{ MP.act('fferr', {by:ccMpId(), day:day, text:CC_FF.err.text}); }catch(e){}
        break;
      }
      try{
      /* Соло-Мейджор в команде — личные вечера, и день двигает ведущий (ccMXTeamSettle). Перемотка
         шагала сама после вечера — у двоих двумя независимыми шагами, и следующий общий вечер
         расходился с первой игры (живой прогон 2019). Здесь она ждёт день от ведущего. */
      const mxSolo=ccMXSoloTeamDay();
      /* ДЕНЬ ИГРАЕТСЯ ОБОИМИ ИЛИ НИКЕМ (годовой прогон вдвоём 1.10, 2024: перемотка встала навсегда
         на 17 декабря). «Можно ли играть» каждый решает по своим личным условиям — травма или бан
         (ccLifeWhy), приглашение по PR, флаг страны, — и 8 декабря один сыграл соло-кап, а второй
         молча шагнул дальше: первый стоял у ворот, ожидая «готов», которого не будет (в перемотке
         нет пульса, и ccMpGateDayWhy этого не видит). Теперь пропуск турнирного дня уходит
         напарнику ('ffskip'), и он этот день тоже пропускает — пришёл ли пропуск до ворот или
         когда он уже у них стоит (ворота отменяются, см. CC_MP_FF_SKIPDAY). */
      let playNow=playable;
      if(ccMpOn() && !ccRaceFfOn() && !mxSolo && next && (next.day||day)===day){
        if(playNow && CC_MP_PEER_SKIPS.has(day) && CC_FF_PERSONAL.indexOf(next.type)<0) playNow=false;
        else if(!playNow && CC_PLAYABLE.indexOf(next.type)>=0 && typeof MP!=='undefined' && MP.act){
          try{ MP.act('ffskip', {by:ccMpId(), day:day}); }catch(e){}
        }
      }
      if(playNow){
        const had=(cr.log||[]).length;
        await careerPlay();
        const row=(cr.log||[]).slice(-1)[0];
        if((cr.log||[]).length>had && row) CC_FF.played.push(row);
        // Division 1's Monday banks and settles nothing, and a runner that
        // returns early leaves the clock where it was. Move it, or the loop
        // plays the same evening until the guard stops it.
        if(careerToday()===day){ if(mxSolo) await ccMXFfWait(day); else step(day); }
        document.getElementById('majorStages').innerHTML='';
      } else if(mxSolo){
        ccMXTeamSettle();
        await ccMXFfWait(day);
      } else {
        // День тратится один раз: если шаг не сдвинул календарь, повтор съедал бы его до отдыха.
        if(CC_FF.spentOn!==day){ CC_FF.spentOn=day; if(careerFfSpendDay()) CC_FF.trained++; }
        step(day);
        if(careerToday()===day){
          CC_FF.stuck=(CC_FF.stuck||0)+1;
          if(CC_FF.stuck>=3){ CC_FF.err={day:day, kind:'', text:L().ccFfStuck||'day did not move'}; break; }
          await new Promise(r=>setTimeout(r, 500));
        } else CC_FF.stuck=0;
      }
      }catch(e){
        // Напарник пропустил этот день, пока мы стояли у ворот: пропускаем и мы (см. ffskip выше).
        if(CC_MP_FF_SKIPDAY===day){
          CC_MP_FF_SKIPDAY=null;
          try{ document.getElementById('majorStages').innerHTML=''; }catch(e2){}
          // Личный вечер (соло-серия) — переиграть день одному; общий — пропустить вместе с напарником.
          if(careerToday()===day && !(next && CC_FF_PERSONAL.indexOf(next.type)>=0)) step(day);
          careerFfProgress(ccDaysBetween(CC_FF.from.day, careerToday()), days);
          await sleep(0);
          continue;
        }
        /* И СТЕК — в пробы. Без него «Cannot read properties of undefined» называет день и вид
           вечера, но не место в коде, и ошибка ищется перебором (прогон 2024, 22 сентября). */
        CC_FF.err={day:day, kind:(next && next.type)||'',
                   text:String((e && (e.message||e))||''),
                   at:String((e && e.stack) || '').split('\n').slice(1, 5).map(l=>l.trim()).join(' < ')};
        // В команде о встававшей перемотке узнаёт и напарник — иначе он ждёт нас вечно.
        if(!CC_FF.stop && (ccMpOn() || ccRaceFfOn()) && typeof MP!=='undefined' && MP.act)
          try{ MP.act('fferr', {by:ccMpId(), day:day, text:CC_FF.err.text}); }catch(e2){}
        if(typeof console!=='undefined' && console.error)
          console.error('перемотка встала на', day, (next&&next.type)||'', e);
        break;
      }
      careerFfProgress(ccDaysBetween(CC_FF.from.day, careerToday()), days);
      // One frame between days, so the count on the screen is a count and not a
      // number that appears once at the end.
      await sleep(0);
    }
  } finally {
    clearInterval(holdSkip);
    skipAnimation=false;
    /* Giving the hub back belongs here rather than after the block.

       It used to sit below, so a day that threw took the whole screen with it:
       the loop unwound past show() and careerRenderHub(), leaving the player on
       whatever screen the last tournament had used — no identity bar, no tabs —
       with the progress box still stuck to the body. Worse, CC_FF stayed set,
       and the first line of this function returns on that, so no later
       fast-forward could start either. One bad evening killed the feature until
       a reload.

       Nothing here has reproduced a throw; this is the failure being made
       survivable rather than a fix for a measured bug. On the ordinary path it
       runs exactly as it did. */
    const done=CC_FF;
    CC_FF=null;
    /* Только целая одиночная перемотка: встала посреди или шла вдвоём — в её времени не вечера. */
    if(done && !done.err && !ccMpOn() && !ccRaceFfOn() && ffSpan.ev>0 && CAREER===ffCareer && careerToday()>=until){
      const spent=(typeof performance!=='undefined' ? performance.now() : Date.now())-ffT0;
      ccFfEveningSaw(Math.max(100, (spent-ffSpan.n*CC_FF_DAY_MS)/ffSpan.ev));
    }
    if(CAREER!==ffCareer || !CAREER){ try{ const b=document.getElementById('ccFfBox'); if(b) b.remove(); ccFfClose(); }catch(e){} return; }
    careerSave();
    show('screen-career-hub');
    careerRenderHub('centre');
    if(done) careerFfDigest(done);
  }
}
function ccDaysBetween(a, b){
  return Math.max(0, Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000));
}
function careerFfProgress(done, total){
  let box=document.getElementById('ccFfBox');
  if(!box){
    box=document.createElement('div');
    box.id='ccFfBox'; box.className='cc-ff-box';
    document.body.appendChild(box);
  }
  // Остаток — от сегодняшнего дня до конца перемотки, той же оценкой, что в вопросе.
  let left='';
  try{ if(CC_FF && CC_FF.until && CC_FF.until>careerToday()) left=L().ccFfLeft(L().ccFfTime(ccFfEtaSec(CC_FF.until))); }catch(e){}
  box.innerHTML='<b>'+L().ccFfRunning+'</b><span>'+L().ccFfDays(done, total)+'</span>'+(left ? '<span>'+left+'</span>' : '');
}
/* Арт под плитку вечера. По типу события, потому что тип — единственное, что
   у записи в журнале есть, и его достаточно: кубок это кубок, Reload это
   Reload. Чего нет в папке, то остаётся без картинки — плитка тогда просто
   тёмная, и это нормально. */
const CC_FF_ART={
  cup:'art/mode-duo.jpg', final:'art/fncs-2026.jpg', eval:'art/mode-duo.jpg',
  major:'art/mode-major1.jpg', gc:'art/mode-ewc.jpg',
  reload:'art/map-reload-a.jpg', victory:'art/mode-all-fncs.jpg'
};
/* Как этот вечер называется. Те же слова, что на полоске недели: там такая же
   таблица лежит внутри careerWeekHTML, но она локальная, а плитке нужна та же
   подпись — иначе один турнир назывался бы в календаре и в итоге по-разному. */
function ccFfKindWord(kind){
  const w={cup:L().chWkCup, final:L().calWeeklyFinal, eval:L().calPerfEval,
           victory:ccWkVictoryWord(), major:ccWkMajorWord(), gc:L().chWkGC,
           reload:L().chWkReload};
  return w[kind]||'';
}
function ccFfClose(){
  const o=document.getElementById('ccFfOver');
  if(o) o.remove();
}
// Плитка раскрывается по нажатию, а не по наведению: пальцем наведения нет.
function ccFfTile(i){
  const el=document.getElementById('ccFfT'+i);
  if(el) el.classList.toggle('open');
}
function careerFfDigest(ff){
  const el=document.getElementById('ccFfBox'); if(el) el.remove();
  ccFfClose();
  if(!CAREER || !CAREER.career || !ff) return;
  const cr=CAREER.career, pl=CAREER.player;
  const now=(pl.ovrExact!=null?pl.ovrExact:pl.ovr);
  /* «Призовые» — то, что лежит на плитках, а не разница cr.earnings.
     Скриншот: в шапке «+$700», а по плиткам 100+400+250 = 750.
     Разница earnings ловит и то, что к плиткам не относится (в частности,
     careerMigrateMoney на сейве без wages вычитает из earnings клубные
     выплаты); плитки же — ровно те вечера, что отыграны перемоткой, и их
     сумма обязана сходиться с шапкой. Без плиток с призом — по-старому. */
  const tilesCash=ff.played.reduce((a,r)=>a+(r && r.prize>0 ? r.prize : 0), 0);
  const money=tilesCash || ((cr.earnings||0)-ff.from.earnings);
  const days=ccDaysBetween(ff.from.day, careerToday());

  const tiles=ff.played.map((r,i)=>{
    // Обложка своего турнира того дня (как в журнале профиля, ccLogArt), а не общая по виду вечера —
    // недели World Cup 2019 выходили картинкой FNCS (Notion «29»: «при перемотке не те превью»).
    const art=(typeof ccLogArt==='function' && ccLogArt({kind:r.kind, day:r.day})) || CC_FF_ART[r.kind] || '';
    const win=r.place===1, pod=!win && r.place<=3;
    const kind=(typeof ccFfKindWord==='function') ? ccFfKindWord(r.kind) : '';
    const more=[
      r.pts!=null ? L().ptsHeader+' '+r.pts : '',
      r.wins ? L().winsWord+' '+r.wins : '',
      r.elims!=null ? L().killsHeader+' '+r.elims : '',
      r.mate ? '+ '+esc(r.mate) : ''
    ].filter(Boolean).join(' · ');
    return '<button type="button" class="cc-ffo-t'+(win?' win':pod?' pod':'')+
      '" id="ccFfT'+i+'" onclick="ccFfTile('+i+')">'+
      (art?'<span class="bg" style="background-image:url('+art+')"></span>':'')+
      '<span class="sh"></span><span class="in">'+
        '<span class="d">'+esc(ccDayLabel(r.day))+(kind?' · '+esc(kind):'')+'</span>'+
        '<span class="p">#'+r.place+'<small> / '+r.of+'</small></span>'+
        (r.prize?'<span class="m cash">+$'+ccNum(r.prize)+'</span>':'')+
        (more?'<span class="more">'+more+'</span>':'')+
      '</span></button>';
  }).join('');

  const stat=(k,v,up)=>'<div><em>'+k+'</em><b'+(up?' class="up"':'')+'>'+v+'</b></div>';
  const stats=[
    stat(L().ccRoOvr, Math.round(ff.from.ovr*10)/10+' → '+Math.round(now*10)/10,
         now>ff.from.ovr),
    ff.trained ? stat(L().ccFfTrained, ff.trained) : '',
    money ? stat(L().chEarnings, '+$'+ccNum(money), true) : '',
    cr.division!==ff.from.div
      ? stat(L().ccDivision, ff.from.div+' → '+cr.division, cr.division<ff.from.div) : '',
    careerReach()!==ff.from.reach
      ? stat(L().xFollowers, ccFollowers(ff.from.reach)+' → '+ccFollowers(careerReach()), true) : ''
  ].filter(Boolean).join('');

  const over=document.createElement('div');
  over.id='ccFfOver'; over.className='cc-ffo';
  over.innerHTML='<div class="cc-ffo-panel" role="dialog" aria-modal="true">'+
    '<div class="cc-ffo-head">'+
      '<button type="button" class="cc-ffo-x" onclick="ccFfClose()" '+
        'aria-label="'+esc(L().ccFfGo)+'">✕</button>'+
      '<h4>'+esc(L().ccFfDone(days))+'</h4>'+
      '<div class="cc-ffo-sub">'+esc(ff.played.length ? L().ccFfPlayed(ff.played.length)
                                                      : L().ccFfNothing)+'</div>'+
    '</div>'+
    // Упавший день говорит, какой это был день и что именно сломалось: без
    // текста ошибки «ноль дней» — это загадка, а не сообщение. См. CC_FF.err.
    (ff.err ? '<div class="cc-ffo-err"><b>'+esc(L().ccFfBroke(ccDayLabel(ff.err.day)))+'</b>'+
              '<span>'+esc(ff.err.text||'-')+'</span></div>' : '')+
    (stats?'<div class="cc-ffo-stats">'+stats+'</div>':'')+
    (tiles?'<div class="cc-ffo-grid">'+tiles+'</div>'
          :'<div class="cc-ffo-empty">'+esc(L().ccFfNothing)+'</div>')+
    '<div class="cc-ffo-foot">'+
      '<button type="button" class="cc-ffo-go" onclick="ccFfClose()">'+
        esc(L().ccFfGo)+'</button>'+
    '</div>'+
  '</div>';
  // Клик по тёмному фону — тоже «продолжить»: слой перекрывает хаб целиком, и
  // мимо панели нажимают именно чтобы его убрать.
  over.addEventListener('click', e=>{ if(e.target===over) ccFfClose(); });
  // Escape закрывает — слой модальный, и уйти с него нужно уметь с клавиатуры.
  over.addEventListener('keydown', e=>{ if(e.key==='Escape'){ e.stopPropagation(); ccFfClose(); } });
  over.tabIndex=-1;
  document.body.appendChild(over);
  const go=over.querySelector('.cc-ffo-go'); if(go) go.focus();
}

/* ---- Playing one ---------------------------------------------------------- */

/* A career with no partner does not play. careerEnsurePartner used to auto-fill the seat in every runner, which made the inbox pointless.
   Now the player fills the seat. Free players write first and their message is the offer (see careerSeatDm).
   Solo Victory Cup needs no partner. */
function careerNeedsMate(kind){
  if(kind==='victory'){ const ev=careerVictoryOn(careerToday()); return !!ev && ev.mode!=='solo'; }
  // The Solo Series is one player whatever the season is, like the solo cup.
  if(kind==='solo') return false;
  // Кубок наций — сборная страны, а не напарник карьеры (отбор вообще соло).
  if(kind==='nations') return false;
  return true;
}
/* A short squad cannot enter anything.

   This asked whether there was anybody at all beside the player, which was the
   whole question while every season was a duo. In a trio year it let a career
   with one seat filled and one empty walk into a tournament as two people —
   his report, 19 August, and he is right that it should be impossible.

   So it asks for the squad the season is played by, and how many are missing
   is what the screen says. */
function careerMatesShort(){
  return Math.max(0, careerMateSeats()-careerMates().length);
}
/* The other direction: more people than the season has chairs.

   A trios year ends and the duos year begins with both partners still held.
   careerMateRecords slices to the seats, so the mode used to pick for you —
   whoever happened to sit first stayed, the other quietly stopped existing on
   screen without a word said. His ask, 20 August: after 2027 you have to drop a
   teammate, and it needs to be a choice of whom.

   So the overflow is a state the career stands in: every held partner is shown,
   each with a button, entry to anything that needs a squad is closed — the same
   gate an empty chair uses — and nothing is dropped until the player says who
   stays. */
// The switch itself. Off stops new offers arriving; nothing already on the
// table is touched. See careerOrgOffers, where it gates.
function careerScoutToggle(){
  CAREER.scoutOff=!ccScoutOff();
  CAREER.scoutOffFree=!!(CAREER.scoutOff && !CAREER.org);   // выключил свободным агентом: это его выбор, миграция не трогает
  careerSave();
  careerRenderHub(CH_TAB||'me');
}
function careerMatesOver(){
  const held=((CAREER && CAREER.partners) || []).filter(Boolean).length;
  return Math.max(0, held-careerMateSeats());
}
// Keep this one seat. Everyone else held beyond the season's chairs leaves, and
// the leaving is said out loud — a person is not a row to be trimmed.
// Not careerMateKeep: that name is taken by talking a leaving partner into
// staying, and this file is one scope — the collision silently replaced it
// and check-career-talk caught the persuasion failing.
function careerMateChoose(at){
  const list=((CAREER && CAREER.partners) || []).filter(Boolean);
  if(at<0 || at>=list.length) return false;
  const keep=[list[at]];
  const season=careerFncsSeason(careerToday());
  list.forEach(function(pr, i){
    if(i===at) return;
    const c=ccMateCardOf(pr);
    if(c) careerNews('bad', 'ccNewsDuoSplit', [ccHandle(c.handle), season?season.id:'']);
  });
  CAREER.partners=keep;
  careerSave();
  careerRenderHub(CH_TAB||'me');
  return true;
}
function careerNoMate(kind){
  /* Кап другого формата, чем сезон (Daily Duos Cup в трио- или сквад-год), считает
     не стулья сезона: его состав спрашивает ccEventRosterPick уже в careerPlay —
     «позвать людей» или добрать на вечер. Здесь он гасил кнопку раньше, чем окно
     успевало открыться (скрин: «cant play any cashcups in chapter 1/2»). */
  if(kind==='victory' && !ccMpOn() && !(typeof ccRacePairOn==='function' && ccRacePairOn())){
    const fmt=ccPickFormat(careerVictoryOn(careerToday()));
    if(fmt && fmt!==1 && fmt!==careerSquadSize()) return false;
  }
  return careerNeedsMate(kind) && (careerMatesShort()>0 || careerMatesOver()>0);
}
// Asked of a kind rather than of careerNext, because careerNext asks this back.
function careerCanPlayKind(kind){ return careerCanPlayKindOn(careerToday(), kind); }
/* Тот же вопрос про ДРУГОЙ день — кнопке «пропустить до турнира» надо знать,
   какой из будущих вечеров игрок сможет открыть (careerSkipTarget). Ответ по
   сегодняшнему состоянию: пропуск ничего не играет, значит по дороге ничего
   и не изменится. */
function careerCanPlayKindOn(day, kind, seatsAside){
  if(CC_PLAYABLE.indexOf(kind)<0) return false;
  // Травма, бан, неоформленная поездка или ранг ниже порога капа (см. ccLifeWhy).
  if(typeof ccLifeWhy==='function' && ccLifeWhy(day, kind)) return false;
  /* Без связи с лобби командный вечер не начинается — и кнопка это знает.
     Иначе нажатие уходило бы в ccMpGate и висело там молча: вечер ждёт
     «оба готовы», а сказать это некому. Причину печатает ccMpWhy. */
  if(!ccMpLive()) return false;
  // Один дивизион и один режим на двоих. См. ccMpStateOk и ccMpModeWhy.
  if(ccMpDivWhy()) return false;
  if(ccMpSameWhy()) return false;
  if(ccMpRolesWhy()) return false;
  if(ccMpModeWhy()) return false;
  // И в гонке режим один на комнату. См. ccRaceModeWhy.
  if(typeof ccRaceModeWhy==='function' && ccRaceModeWhy()) return false;
  if(!seatsAside && careerNoMate(kind)) return false;
  if(kind==='reload') return careerReloadCan(careerReloadOn(day));
  if(kind==='final')  return careerWeeklyFinalOn(day);
  if(kind==='major')  return careerMajorCan(careerMajorOn(day));
  if(kind==='summit') return careerSummitCan(careerSummitOn(day));
  if(kind==='globals')return careerGlobalsCan(careerGlobalsOn(day));
  // Epic's own page: "You must be Duos Division 1 to participate in this event."
  // Which includes everybody who has just come up out of Division 2 — clearing
  // that cut is how you become Division 1, and the promotion lands the same
  // night. The calendar already hid the Evaluation from the divisions below and
  // the runner already refused them, but this said yes to a Division 4 player,
  // so anything that asked the question directly got the wrong answer.
  if(kind==='eval')   return CAREER.career.division===1 && !ccAwayHomeBusy(day);
  if(kind==='gc')     return careerGclcOn(day)
                               ? careerGclcCan(careerGclcOn(day))
                               : careerRcCan(careerRcOn(day));
  if(kind==='solo')   return careerSoloSeriesCan(careerSoloSeriesOn(day));
  if(kind==='proam')  return careerProAmCan();
  if(kind==='nations') return careerNationsCan(careerNationsOn(day));
  if(kind==='victory'){ const v=careerVictoryOn(day); return ccVictoryInvited(v) && ccConsoleOk(v) && !ccAwayHomeBusy(day); }
  if(kind==='cup')    return !ccAwayHomeBusy(day);   // в это время идёт выезд (ccAwayPlay)
  return true;
}
/* КОНСОЛЬНЫЕ КАПЫ (идея игрока 14.11: «чтобы играть PlayStation cup, купи PlayStation/Xbox»). PlayStation Cup — только с
   PlayStation, Xbox Cup — с Xbox, Console-капы (Console Cash Cups, Console Champions, Platform Cup Console) — с любой
   консолью. Консоль покупается в магазине (CC_SHOP, unlock), силы не даёт. */
function ccConsoleNeed(ev){
  if(ev && ev.plat) return ev.plat;
  const id=String((ev && ev.id)||'');
  return /Mobile|Touch/i.test(id) ? 'mobile' : /Xbox/i.test(id) ? 'xbox' : /PlayStation/i.test(id) ? 'ps' : /Console/i.test(id) ? 'any' : null;
}
/* MOBILE SERIES по правилам Epic (Mobile Series Chapter 7, страница серии): Reload Solos только с тачем, 16 в лобби.
   Open: раунды открыты всем → топ-64 в четыре хита по 16 (змейкой) → топ-4 хита в квалификацию (16) → топ-1 до 1 июня,
   потом топ-3 — в групповой этап. Где хитов впереди нет (S39, S40), раунд ведёт прямо в квалификацию: топ-16, по её комнате.
   LCQ 5–6.09: первый день открыт, топ-160 во второй, топ-12 в группы. Группы 12.09 (две по 16) → топ-8 в полуфинал 13.09
   → EU и NAC по 3, OCE/ASIA/ME/NAW по 2, BR 1 на чемпионат (LAN 24–25.10, 16 игроков, матч-пойнт).
   Наше упрощение: раунд считается по одному вечеру, у Epic — сумма раундов Open.
   cr.mobSer={next:'heats'|'cup', until, heat} — проход внутри Open; cr.mobLcq — день второго дня LCQ;
   cr.mobGS={stage:'group'|'semi'|'champ'|'out'|'done', grp} — сезонная часть серии. */
const CC_MOBSER_LOBBY=16, CC_MOBSER_ROUND_TOP=64, CC_MOBSER_DIRECT_TOP=16, CC_MOBSER_HEAT_TOP=4, CC_MOBSER_DAYS=21,
      CC_MOBSER_LCQ1_TOP=160, CC_MOBSER_LCQ2_TOP=12, CC_MOBSER_GROUP_TOP=8,
      CC_MOBSER_CHAMP_SLOTS={EU:3, NAC:3, OCE:2, ASIA:2, ME:2, NAW:2, BR:1},
      // Очки LAN (Liquipedia Mobile_Series/2026): 25…1 за место, 2 за элим; матч-пойнт 150% лидера после первого дня.
      CC_MOBSER_CHAMP_PTS=[25,22,20,18,16,14,12,10,8,7,6,5,4,3,2,1], CC_MOBSER_CHAMP_KILL=2, CC_MOBSER_CHAMP_MP=1.5;
function ccIsMobSeries(ev){ return !!(ev && ev.series && /MobileSeries/.test(String(ev.id||''))); }
// Хит по месту в раундах, змейкой: 1-4 → хиты 1-4, 5-8 → 4-1 и так далее.
function ccMobHeatOf(place){ const i=(place-1)%8; return i<4 ? i+1 : 8-i; }
// Группа квалифицированного по правилам Epic: 1-е места квалов 1–11 — через одну; у 12–14 три места своим порядком.
function ccMobGroupOf(q, place){
  if(q===12 || q===14) return [2,1,2][place-1]||1;
  if(q===13) return [1,2,1][place-1]||1;
  return (q||1)%2 ? 1 : 2;
}
// Группа из LCQ, змейкой 1,2,2,1.
function ccMobLcqGroupOf(place){ return [1,2,2,1][(place-1)%4]; }
// Сколько проходит дальше с этого этапа.
function ccMobSerCut(ev){
  const s=ev && ev.series, day=String(ev && ev.day || '');
  if(s==='round'){ const heats=(typeof CC_CONSOLE_2026!=='undefined' ? CC_CONSOLE_2026 : []).some(v=>v.series==='heats' && v.day>day && v.day<=ccAddDays(day, CC_MOBSER_DAYS));
    return heats ? CC_MOBSER_ROUND_TOP : CC_MOBSER_DIRECT_TOP; }
  if(s==='heats') return CC_MOBSER_HEAT_TOP;
  if(s==='cup') return day<'2026-06-01' ? 1 : 3;
  if(s==='lcq1') return CC_MOBSER_LCQ1_TOP;
  if(s==='lcq2') return CC_MOBSER_LCQ2_TOP;
  if(s==='group') return CC_MOBSER_GROUP_TOP;
  if(s==='semi') return CC_MOBSER_CHAMP_SLOTS[ccCareerRegion()]||2;
  return 0;
}
function ccMobSeriesOk(ev){
  if(!ev || !ev.series || ev.series==='round') return true;
  const cr=CAREER && CAREER.career; if(!cr) return ev.series==='lcq1';
  const m=cr.mobSer, g=cr.mobGS, s=ev.series;
  if(s==='heats') return !!(m && m.next==='heats' && ev.day<=m.until && (!m.heat || !ev.heat || m.heat===ev.heat));
  if(s==='cup') return !!(m && m.next==='cup' && ev.day<=m.until);
  if(s==='lcq1') return !g;   // уже в группах — LCQ не нужен
  if(s==='lcq2') return !g && !!cr.mobLcq && ev.day<=cr.mobLcq;
  if(s==='group') return !!(g && g.stage==='group' && (!g.grp || !ev.grp || g.grp===ev.grp));
  if(s==='semi') return !!(g && g.stage==='semi');
  if(s==='champ') return !!(g && g.stage==='champ');
  return true;
}
function ccMobSeriesAfter(ev, place, of){
  if(!ev || !ev.series) return null;
  const cr=CAREER.career, day=careerToday(), s=ev.series, cut=ccMobSerCut(ev), ok=place>0 && place<=cut;
  let next=null;
  if(s==='round' && ok){
    next=cut===CC_MOBSER_ROUND_TOP ? 'heats' : 'cup';
    cr.mobSer={next:next, until:ccAddDays(day, CC_MOBSER_DAYS)};
    if(next==='heats') cr.mobSer.heat=ccMobHeatOf(place);
  } else if(s==='heats'){
    if(ok){ next='cup'; cr.mobSer={next:'cup', until:ccAddDays(day, 14)}; } else delete cr.mobSer;
  } else if(s==='cup'){
    delete cr.mobSer;
    if(ok && !cr.mobGS){ next='group'; cr.mobGS={stage:'group', grp:ccMobGroupOf(ev.q, place)}; }
  } else if(s==='lcq1'){
    if(ok){ next='lcq2'; cr.mobLcq=ccAddDays(day, 1); }
  } else if(s==='lcq2'){
    delete cr.mobLcq;
    if(ok && !cr.mobGS){ next='group'; cr.mobGS={stage:'group', grp:ccMobLcqGroupOf(place)}; }
  } else if(s==='group'){
    if(ok){ next='semi'; cr.mobGS={stage:'semi'}; } else cr.mobGS={stage:'out'};
  } else if(s==='semi'){
    if(ok){ next='champ'; cr.mobGS={stage:'champ'}; } else cr.mobGS={stage:'out'};
  } else if(s==='champ') cr.mobGS={stage:'done', place:place};
  CC_VICTORY_LIST=null; CC_YEAR_DAYS=null;   // календарь видит новый этап
  return next;
}
// Строка итога этапа серии на карточке вечера.
function ccMobSerNote(ev, place){
  const cut=ccMobSerCut(ev); if(!cut) return '';
  return place<=cut ? L().ccMobSerPass(cut) : L().ccMobSerOut(cut);
}
// Поле этапа серии: хит — свой хит из регионального топ-64 (змейкой), квалификация/полуфинал — топ своего региона,
// группа — свой из топ-32 региона (через одного), второй день LCQ — топ-160 региона, чемпионат — сильнейшие мира.
function ccMobileStageField(ev, n){
  const s=ev && ev.series;
  if(s==='champ'){
    /* Состав LAN по регионам, как на Liquipedia: EU 3, NAC 3, NAW 2, BR 2 (полуфинал + отбор Fluxo), ME 2, ASIA 2, OCE 2.
       Своё место игрок занимает из квоты своего региона; в каждом регионе — сильнейшие по живому рейтингу. */
    const Q={EU:3, NAC:3, NAW:2, BR:2, ME:2, ASIA:2, OCE:2}, R=(typeof CC_MOBILE_ROSTER!=='undefined') ? CC_MOBILE_ROSTER : {};
    const me=ccCareerRegion(), seen=new Set(), out=[];
    Object.keys(Q).forEach(r=>{
      const rows=(R[r]||[]).slice().sort((a,b)=>ccMobileRate(b[0], b[2])-ccMobileRate(a[0], a[2]));
      let k=Q[r]-(r===me ? 1 : 0);
      rows.forEach(x=>{ const h=String(x[0]).toLowerCase(); if(k<=0 || seen.has(h)) return; seen.add(h); k--;
        const c=ccMobileCard(x, r), t=careerTeam([c]); t.name=teamLabel([c]); out.push(t); });
    });
    if(out.length<n) ccMobileField(n+out.length, true).forEach(t=>{ const h=String(((t.squad||[])[0]||{}).handle||'').toLowerCase();
      if(out.length<n && !seen.has(h)){ seen.add(h); out.push(t); } });
    return out.slice(0, n);
  }
  const all=ccMobileField(Math.max(n, s==='heats' ? CC_MOBSER_ROUND_TOP : s==='group' ? 32 : n), 'reg');
  if(s==='heats'){ const h=(CAREER.career.mobSer && CAREER.career.mobSer.heat) || ev.heat || 1;
    const mine=all.filter((t,i)=>ccMobHeatOf(i+1)===h); return mine.concat(all.filter(t=>mine.indexOf(t)<0)).slice(0, n); }
  if(s==='group'){ const g=(CAREER.career.mobGS && CAREER.career.mobGS.grp) || ev.grp || 1;
    const mine=all.filter((t,i)=>(i%2)+1===g); return mine.concat(all.filter(t=>mine.indexOf(t)<0)).slice(0, n); }
  return all.slice(0, n);
}
function ccConsoleOk(ev){
  if(!ccMobSeriesOk(ev)) return false;   // этап Mobile Series без прохода
  const n=ccConsoleNeed(ev); if(!n) return true;
  try{
    if(n==='mobile') return ccMobileOwn();
    const ps=ccShopSlotRank('ps')>0, xb=ccShopSlotRank('xbox')>0;
    return n==='ps' ? ps : n==='xbox' ? xb : (ps || xb);
  }catch(e){ return true; }
}
// Сила купленной консоли на консольном вечере: лучшая из подходящих платформ (на «any» — любая из двух).
function ccConsoleDevBonus(n){
  const best=s=>CC_SHOP.reduce((v,x)=>(x.slot===s && careerOwns(x.id)) ? Math.max(v, x.con||0) : v, 0);
  return n==='ps' ? best('ps') : n==='xbox' ? best('xbox') : n==='any' ? Math.max(best('ps'), best('xbox')) : 0;
}
function ccConsoleWhy(ev){ const n=ccConsoleNeed(ev), T=L(); if(!ccMobSeriesOk(ev)) return ev.series==='heats' ? T.ccMobSerNeedRound : T.ccMobSerNeedStage(ev.series); return n==='mobile' ? T.ccNeedPhone : n==='ps' ? T.ccNeedPs : n==='xbox' ? T.ccNeedXbox : T.ccNeedConsole; }
/* МОБИЛЬНЫЙ РЕЙТИНГ (его слово 14.11: «у мобил свои игроки, сделать рейтинг нужно»): свой у игрока, отдельно от ПК. Старт —
   60 у всех (отдельно от ПК), дальше от места на мобильном капе: топ-1% +3, топ-5% +2, топ-20% +1, верхняя половина
   +0.5, ниже -0.5; потолок 99. Сила на мобильном вечере — только от него (ccMobileSelfPow). Решение, не замер.
   cr.mobOvr — рейтинг, cr.mobN — сколько мобильных капов сыграно. */
// Старт мобильного рейтинга — один для всех, от ПК не зависит (его «отдельный от ПК был рейтинг»): новичок на мобиле.
const CC_MOB_START=60;
function ccMobileOvr(){
  const cr=CAREER && CAREER.career;
  return (cr && cr.mobOvr!=null) ? cr.mobOvr : CC_MOB_START;
}
function ccMobilePen(){ const pc=(CAREER && CAREER.player && CAREER.player.ovr)||70; return Math.max(0, Math.round(pc-ccMobileOvr())); }
// Сила игрока на мобиле — как у карточки с его мобильным рейтингом (тот же careerTeam, что у мобильной сцены).
/* ТУРНИРЫ ПЛАТФОРМЫ В КАЛЕНДАРЕ (его слово 15.11: «при покупке телефона или консоли галочку, нужны ли турниры этих платформ
   в календаре»): cr.platCal={console:bool, mobile:bool}, по умолчанию вкл. Выключено — капы этой платформы не идут в календарь
   (ccVictoryList), устройство остаётся. Переключатель — на купленном устройстве в магазине. */
function ccPlatGroup(n){ return n==='mobile' ? 'mobile' : n ? 'console' : null; }
function ccPlatCalOn(g){ const p=CAREER && CAREER.career && CAREER.career.platCal; return !(p && p[g]===false); }
function ccPlatCalToggle(g){
  const cr=CAREER.career; cr.platCal=cr.platCal||{}; cr.platCal[g]=!ccPlatCalOn(g);
  CC_VICTORY_LIST=null; CC_YEAR_DAYS=null; careerSave(); careerRenderHub('shop');
}
// Выбрал при создании «мобайл» - телефон уже есть, мобильные капы открыты без покупки в магазине.
function ccMobileOwn(){ try{ if(CAREER && CAREER.player && CAREER.player.input==='mob') return true; return CC_SHOP.some(x=>x.unlock==='mobile' && careerOwns(x.id)); }catch(e){ return false; } }
function ccMobileDevBonus(){ try{ return CC_SHOP.reduce((v,x)=>(x.unlock==='mobile' && careerOwns(x.id)) ? Math.max(v, x.mob||0) : v, 0); }catch(e){ return 0; } }
function ccMobileSelfPow(){
  const reg=ccCareerRegion(), me=[CAREER.player.handle||CAREER.player.nick||'-', CAREER.player.country||null, ccMobileOvr()];
  return Math.max(1, Math.round(careerTeam([ccMobileCard(me, reg)]).pow+ccMobileDevBonus()));
}
/* Живой рейтинг мобильной сцены: база из таблиц Epic (CC_MOBILE_ROSTER) плюс то, что игрок наиграл в мобильных капах этой
   карьеры (cr.mobDev[ник]). Сдвиг как в Эло: место против ожидаемого по рейтингам, а не по ступеням места. Ступени давали
   плюс сильным каждый кап, и к концу 2026 у трети сцены было 99. Ожидание: шанс обойти соперника по разнице рейтингов
   при разбросе дня (sd 5.66 у разницы двух бросков мира), CC_MOB_K за весь разброс, CC_MOB_DECAY тянет наигранное к базе. */
const CC_MOB_K=3, CC_MOB_DECAY=0.97, CC_MOB_SD=5.66;
function ccMobileRate(name, base){ const d=CAREER && CAREER.career && CAREER.career.mobDev; return clamp(Math.round((base+((d && d[name])||0))*10)/10, 40, 99); }
function ccMobileSceneGrow(ranked){
  const cr=CAREER.career, dev=cr.mobDev=cr.mobDev||{}, n=ranked.length;
  if(n<2) return;
  const rOf=t=>{ const c=(t.squad||[])[0]; return t.r!=null ? t.r : c && c.rating!=null ? c.rating : (t.pow||70); };
  const rs=ranked.map(rOf), win=z=>1/(1+Math.exp(-1.702*z));
  ranked.forEach((t,i)=>{ const c=(t.squad||[])[0]; if(!c || !c.mobile || t.isYou) return;
    let e=0; for(let j=0;j<n;j++) if(j!==i) e+=win((rs[i]-rs[j])/CC_MOB_SD);
    const d=clamp(((n-1-i)-e)/(n-1)*CC_MOB_K, -1.5, 1.5);
    dev[c.handle]=Math.round(((dev[c.handle]||0)*CC_MOB_DECAY+d)*100)/100; });
}
// Таблица первого раунда мобильного вечера: поле, отсортированное по очкам (как ranked1).
function evRanked1ForMobile(field){ return field.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0)); }
/* МОБИЛЬНЫЙ МИР (его пункт 6, 15.11): в дни мобильных капов, которые игрок не играл, мобильная сцена его региона играет их
   сама: место — рейтинг плюс случайность дня (сумма трёх бросков, ±12), рейтинги сдвигаются ccMobileSceneGrow. Бросок — от дня
   и региона (careerRng), у всех одинаковый. cr.mobWorld — последний прокрученный день, cr.mobDays — дни, сыгранные самим. */
function ccMobileCupsOn(d){
  const list=(ccCalYear()===2026 && typeof CC_CONSOLE_2026!=='undefined') ? CC_CONSOLE_2026 : ((typeof CC_CUPS_ARCH!=='undefined') ? CC_CUPS_ARCH : []);
  return list.filter(v=>v.day===d && ccConsoleNeed(v)==='mobile');
}
function ccMobileWorld(fromISO, toISO){
  const cr=CAREER && CAREER.career; if(!cr || typeof CC_MOBILE_ROSTER==='undefined') return 0;
  const reg=ccCareerRegion(), R=CC_MOBILE_ROSTER[reg] || CC_MOBILE_ROSTER.EU || [];
  let n=0;
  for(let d=fromISO; d<toISO; d=ccAddDays(d,1)){
    if(cr.mobWorld && d<=cr.mobWorld) continue;
    cr.mobWorld=d;
    if(cr.mobDays && cr.mobDays[d]) continue;
    ccMobileCupsOn(d).forEach(ev=>{
      const rnd=careerRng(ccHashStr('mobw|'+d+'|'+ev.id+'|'+reg));
      const ranked=R.map(x=>{ const r=ccMobileRate(x[0], x[2]); return {squad:[{mobile:true, handle:x[0]}], r, s:r+(rnd()+rnd()+rnd()-1.5)*8}; })
        .sort((a,b)=>b.s-a.s);
      ccMobileSceneGrow(ranked); n++;
    });
  }
  return n;
}
/* Тренировка на телефоне: +0.6 на старте, чем выше мобильный рейтинг — тем меньше (до нуля к 85). Выше 85 — только
   результатами мобильных капов (ccMobileGrow), как ПК-тренировка упирается в потолок дивизиона. Решение, не замер. */
const CC_MOB_TRAIN=0.6, CC_MOB_TRAIN_CAP=85, CC_MOB_SCRIM=0.4, CC_MOB_SCRIM_CAP=90;
// Сколько даст одна тренировка (скрим — scrim) сейчас, без записи — её же показывает кнопка дня.
function ccMobileTrainGain(scrim){ const now=ccMobileOvr(), step=scrim ? CC_MOB_SCRIM : CC_MOB_TRAIN, cap=scrim ? CC_MOB_SCRIM_CAP : CC_MOB_TRAIN_CAP;
  return Math.max(0, Math.round(step*clamp((cap-now)/(cap-CC_MOB_START), 0, 1)*100)/100); }
function ccMobileTrain(scrim){
  const cr=CAREER.career, now=ccMobileOvr(), g=ccMobileTrainGain(scrim);
  cr.mobOvr=Math.round((now+g)*100)/100;
  return g;
}
function ccMobileGrow(place, of){
  const cr=CAREER.career, f=place/Math.max(1, of);
  { const md=cr.mobDays=cr.mobDays||{}; md[careerToday()]=1; const ks=Object.keys(md).sort(); while(ks.length>60) delete md[ks.shift()]; }
  const d=f<=0.01 ? 3 : f<=0.05 ? 2 : f<=0.2 ? 1 : f<=0.5 ? 0.5 : -0.5;
  cr.mobOvr=clamp(Math.round((ccMobileOvr()+d)*10)/10, 40, 99);
  cr.mobN=(cr.mobN||0)+1;
  return d;
}
function ccMobileCard(row, reg){
  const r=ccMobileRate(row[0], row[2]||75);
  return {handle:row[0], nat:row[1]||null, region:reg, org:null, tier:'ladder', event:'Mobile', date:'-', placement:null,
          rating:r, _targetOvr:r, _attrs:ccRookieAttrs(r, 'roleFRG'), mobile:true};
}
// Поле мобильного капа (соло): вся мобильная сцена региона, остальные места — простые ники ладдера послабее.
function ccMobileField(n, strong){
  // Свой регион первым, потом мобильные игроки остальных регионов (мобила ездит по регионам), потом сгенерированные.
  const reg=ccCareerRegion(), R=(typeof CC_MOBILE_ROSTER!=='undefined') ? CC_MOBILE_ROSTER : {};
  const rnd=careerRng(ccHashStr('mob|'+careerToday()+'|'+reg));
  const mix=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; };
  const seen=new Set(), list=[];
  const add=rows=>rows.forEach(x=>{ const k=String(x[0]).toLowerCase(); if(seen.has(k)) return; seen.add(k); list.push(x); });
  add(mix((R[reg] || R.EU || []).slice()));
  const regLen=list.length;
  add(mix([].concat(...Object.keys(R).filter(r=>r!==reg).map(r=>R[r]))));
  // Чемпионат серии — сильнейшие из всех регионов по живому рейтингу; 'reg' — сильнейшие своего региона, остальные за ними.
  const byRate=(a,b)=>ccMobileRate(b[0], b[2])-ccMobileRate(a[0], a[2]);
  if(strong==='reg'){ const own=list.slice(0, regLen).sort(byRate); list.splice(0, regLen, ...own); }
  else if(strong) list.sort(byRate);
  const taken=new Set(list.map(x=>String(x[0]).toLowerCase()));
  const cards=list.slice(0, n).map(x=>ccMobileCard(x, reg));
  while(cards.length<n) cards.push(careerLadderPlayer(rnd, 55+Math.floor(rnd()*14), taken, null, null, 75, true));
  return cards.map(c=>{ const t=careerTeam([c]); t.name=teamLabel([c]); return t; });
}
/* Офлайн-турнир прошлых лет (ev.invite — сколько человек там реально играло) зовёт тех, кто
   в Power Ranking карьеры стоит не ниже этого числа: как на настоящие ЛАНы, куда звали по
   результатам сезона. Открытые капы (без invite) играет любой. */
/* Место по результату другого ЛАНа: Gamers8 2023 брал топ-10 каждого из трёх DreamHack 2023
   (Liquipedia: 30 дуо с DreamHack, 5 с отбора Ближнего Востока, 9 приглашённых). ev.qualFrom — id этих
   ЛАНов, ev.qualTop — сколько мест проходит; остальные — по PR до ev.prInvite. */
function ccLanQualified(ev){
  if(!ev || !ev.qualFrom || !ev.qualFrom.length || typeof CC_CUPS_ARCH==='undefined') return false;
  const days=new Set(CC_CUPS_ARCH.concat(typeof CC_NEXT_YEAR_EVENTS!=='undefined' ? CC_NEXT_YEAR_EVENTS : []).filter(x=>ev.qualFrom.indexOf(x.id)>=0).map(x=>x.day));
  const cr=CAREER && CAREER.career; if(!cr) return false;
  return (cr.log||[]).some(r=>r && r.kind==='victory' && days.has(r.day) && r.place<=(ev.qualTop||10));
}
function ccVictoryInvited(ev){
  // EWC 2024 и его отборы: по путёвке, а не по PR (ewc24Invited).
  if(ev && ev.ewc24 && typeof ewc24Invited==='function') return ewc24Invited(ev);
  // Финал своего турнира — для прошедших квалы, хозяин тоже проходит их на общих правах.
  if(ev && ev.finalOf){ const q=ccOwnQualOf(ev); return !!(q && q.res && q.res.youIn); }
  if(ev && ev.series) return ccMobSeriesOk(ev);   // Mobile Series: по проходу этапа
  if(!ev || !ev.invite || ev.own) return true;
  /* КОМАНДУ ЗОВУТ, ЕСЛИ ЗОВУТ ХОТЬ ОДНОГО ИЗ ДВОИХ — и решают это одинаково у обоих (командный год за
     Pixie и SwizzY 20.10: Amar Rohat Pro Invitational, по своему месту в PR одного звали, другого нет, и каждый
     клиент сыграл вечер по-своему). Место напарника — по той же доске PR (у двоих она одна), флаг — с его карточки. */
  if(typeof ccMpTeam==='function' && ccMpTeam() && typeof MP!=='undefined' && MP.peer){
    // Своя сторона — по той же карточке, что видит напарник (MP.card), а не по экранному рейтингу: иначе в начале
    // года (места в PR ещё нет) двое решали бы по разным числам.
    let myCard=null; try{ myCard=(typeof CC_MP_MYCARD!=='undefined' && CC_MP_MYCARD) || (MP.card ? MP.card() : null); }catch(e){ myCard=null; }
    const me=ccVictoryInvitedOne(ev, {nat:(myCard && (myCard.nat || myCard.country)) || (CAREER.player && (CAREER.player.nat || CAREER.player.country)) || '', place:careerPrPlace(), ovr:myCard && myCard.ovr!=null ? Number(myCard.ovr) : null});
    let peer=false;
    try{ const pk=hKey(MP.peer); const rows=careerPrRows(); const at=rows.findIndex(r=>hKey(r.name)===pk);
      peer=ccVictoryInvitedOne(ev, {nat:MP.peer.nat || MP.peer.country, place:at>=0 ? at+1 : null, ovr:Number(MP.peer.ovr)||null}); }catch(e){ peer=false; }
    return me || peer;
  }
  return ccVictoryInvitedOne(ev, null);
}
function ccVictoryInvitedOne(ev, who){
  // Региональный ЛАН (Australian Open — только OCE).
  if(ev.region && CAREER.player && CAREER.player.region!==ev.region) return false;
  // Национальный (ESL Katowice Royale Polish Edition — поляки, Ascension — французы): по флагу игрока.
  if(ev.nat && ev.nat.length){
    const nat=String(who ? (who.nat||'') : ((CAREER.player && (CAREER.player.nat || CAREER.player.country)) || '')).toLowerCase();
    if(ev.nat.indexOf(nat)<0) return false;
  }
  if(ev.qualFrom && ev.qualFrom.length){
    if(ccLanQualified(ev)) return true;
    if(ev.prInvite==null) return false;
  }
  const lim=(ev.qualFrom && ev.qualFrom.length) ? ev.prInvite : ev.invite;
  const p=who ? who.place : ((typeof careerPrPlace==='function') ? careerPrPlace() : null);
  if(p) return p<=lim;
  /* Места в PR ещё нет (начало года, турниров не было) — зовут по силе, как звали по
     результатам прошлого сезона: место по рейтингу среди карточек своего региона этого года. */
  const set={2019:'h1', 2020:'i1', 2021:'j1', 2022:'k1', 2023:'e1', 2024:'f1', 2025:'t1', 2026:'m1'}[ccCalYear()];
  if(!set) return false;
  const reg=CAREER.player.region, mine=(who && who.ovr!=null) ? who.ovr : ccMyShownOvr();
  const ahead=(CARDS_BY_SETREG.get(set+'|'+reg)||[]).filter(q=>q.rating>mine).length;
  return ahead+1<=lim;
}
function careerCanPlay(next){ return !!next && careerCanPlayKind(next.type); }
async function careerPlay(){
  const next=careerNext();
  if(!next) return;
  ccUndoSnap();   // снимок до вечера — для «Переиграть день»
  /* Кап крупнее формата года в команде собирает третьего из карточки напарника (ccMpFmtBegin). Пока после загрузки
     не пришло состояние лобби, карточки нет, и этот клиент играл кап парой в дуо-лобби, а напарник тройкой (errlog 9.11:
     CashCup_Trios n2410 против n1587, Major1_LCQ 39 против 27). Ждём карточку; нет её — вечер не начинается. */
  if(next.type==='victory' && typeof ccMpOn==='function' && ccMpOn() && !(typeof ccRaceOn==='function' && ccRaceOn())){
    const fm=ccVictoryFormat(careerVictoryOn(careerToday()));
    const peerIn=()=>typeof MP!=='undefined' && !!MP.peer;
    if(fm>careerSquadSize() && !peerIn()){
      for(let i=0;i<40 && !peerIn();i++) await new Promise(r=>setTimeout(r, 250));
      if(!peerIn()){ ccTell(L().ccMpLost); return; }
    }
  }
  // Кап другого формата с неполным составом — сначала вопрос: позвать людей в личке или стэнд-ины на вечер.
  if(next.type==='victory'){
    const ev0=careerVictoryOn(careerToday()), f0=ccPickFormat(ev0);
    if(await ccEventRosterPick(ev0, f0)==='find'){ ccDuoFindOpen(null, f0); return; }
  }
  /* Every career night starts on the Battle Royale island. Seven runners passed ACTIVE_LANDING_SET, which
     rebuilds the grid but does not choose an island, so after a Reload night they played on the Reload map.
     The Reload circuit, Championship and Victory Cup switch islands a bit later and restore it at the end.
     Which BR island depends on the year (trio seasons use the trio year's islands), see careerBrSet. */
  useLandingSet((function(){ try{ const s=careerNightSet(next); return (s && ZONE_SETS[s]) ? s : careerBrSet(); }catch(e){ return careerBrSet(); } })());
  CC_MP_NIGHT=String(next.type||'')+(next.id ? ':'+String(next.id) : '');   // подпись поля называет вечер (ccFieldSig)
  ccEvDeltaStart(ccEvKey(next, careerToday()));   // что этот вечер запишет в доски — соседям (ccEvDeltaSend)
  // Метка на карте сегодняшнего вечера — спрашивается ДО раннера, потому что
  // после его старта поставить её уже негде. См. careerSpotGate.
  if(typeof ccNatPickGate==='function' && !ccNatPickGate(next)) return;   // состав сборной — до вечера
  if(!careerSpotGate(next)) return;
  return careerPlayRun(next);
}
/* Вечер без метки дома: окно с выбором, поставить метку сейчас (карта этого острова) или сыграть
   без неё. Без окна сезон можно было пройти, ни разу не поставив дом, и аура не росла.
   Запрещать играть нельзя: три спота на пять карт, на занятой карте игрок застрял бы.
   Под перемоткой окна нет. */
function careerSpotGate(next){
  const cr=CAREER && CAREER.career;
  if(!cr || !next) return true;
  if(typeof CC_FF!=='undefined' && CC_FF) return true;
  // EWC 2024, Dallas и отборы — арены 4 на 4, высадки нет: метка не нужна.
  if((next.type||next.kind)==='victory'){ const v=careerVictoryOn(careerToday()); if(v && v.ewc24) return true; }
  const set=careerNightSet(next);
  const key=careerNightSpotKey(next);
  if(careerSpotList(key).length) return true;
  /* Кап другого формата (сквад-LAN в дуо-год, Notion 27.10 скрин 17: «лока выбрана, а пишет это»): игрок ставил дом
     на сезонной карте того же острова — им и садимся, копией в склад формата (дальше они живут отдельно). */
  if(ccIsFmtSpotKey(key)){
    const home=careerSpotList(key.split('@')[1]);
    if(home.length){ careerSpotStore(key)[key]=home.map(s=>Object.assign({}, s)); try{ careerSave(); }catch(e){} return true; }
  }
  const tab=careerSpotSets().find(t=>t.key===key);
  // Карты под этот вечер в списке нет — поставить метку негде, и окно было бы ловушкой: вечер идёт без неё.
  if(!tab) return true;
  const label=tab.label||'';
  const room=careerSpotRoom(key);
  /* БЕЗ МЕТКИ ВЕЧЕР НЕ НАЧИНАЕТСЯ. Отзыв: «сделай, чтоб без
     метки нельзя было начать игру». Кнопки «сыграть без метки» больше нет:
     окно ведёт на карту этого острова (или, когда все три заняты, туда же —
     освободить одну), а «отмена» оставляет на хабе. */
  ccAsk(room ? L().ccSpotGateAsk(label) : L().ccSpotGateFull(label),
    ()=>{ careerTab('me'); careerSpotOpenFor(key); },
    {yes:L().ccSpotGateSet});
  return false;
}
/* Метка на сегодняшнюю карту — если её нет и есть куда. Возвращает true, когда
   метка стоит (стояла или поставлена на первую коробку сетки). Продукт этим
   не пользуется — окно выше ведёт на карту руками; это дверь для харнессов,
   которым раньше хватало кнопки «сыграть без метки». */
function careerSpotEnsure(next){
  const n=next||careerNext();
  const cr=CAREER && CAREER.career;
  if(!cr || !n) return false;
  const set=careerNightSet(n);
  const key=careerNightSpotKey(n);
  if(careerSpotList(key).length) return true;
  if(!careerSpotRoom(key)) return false;
  // Кап другого формата — своя метка (ccFmtSpotKey): ставится по ключу, как это делает карта по CC_SPOT_SET.
  return careerSpotSet(0, (key==='solo' || key==='nations' || ccIsFmtSpotKey(key)) ? key : set);
}
/* КАК ДЕРЁТСЯ КОМНАТА ЭТОГО ДИВИЗИОНА — по восьми реплеям на дивизион
   (FNCS Divisional Cup S41 EU, tools/real-division-curves.json), отрядов на
   старте зон 2/3/5/7 из 50: D1 41 39 37 30, D2 38 33 27 23, D3 35 32 26 21,
   D4 35 31 24 20, D5 39 35 29 25. Сила комнаты этого не объясняет (D2 по
   силе почти D1), поэтому движку передаются единицы слабости прямо по
   дивизиону: первое число поднимает уловимость в ранних зонах, второе —
   контест высадки (см. LOBBY_WEAK_UNITS / DROP_WEAK_UNITS в zone-sim.js).
   Подобрано пробой tools/career-alive-curve-probe.js (DIV=n, 100 игр):
     D2 (1.5, 4):  41 37 33 30 26 24 22 18 16 13 8
     D3 (2, 5):    41 37 33 29 24 22 20 17 15 13 8
     D4 (2, 5):    42 37 33 29 25 23 22 17 14 12 8
   Пятый — комната пассивная: рано теряет как второй, а концовка у неё как у
   первого (24 отряда на восьмой); единицы ему меньше, и концовка всё равно
   выходит злее реплея на 3–5 отрядов — предел этой модели. */
const CC_DIV_WEAK={1:[0,0], 2:[1.5,4], 3:[2,5], 4:[2,5], 5:[1.5,2.5]};
/* Кривые живых для не дивизионных вечеров по реплеям Tracker EU (tools/real-stage-curves.json, ~10 на кап;
   отрядов, в соло игроков, на старте зон 1..11). Профиль движка на вечер задаёт карьера (CC_ZONE_PROFILE),
   applyStageBias читает его первым: по таблице очков почти всё шло под open и резалось в концовке.
   Единицы [уловимость, контест] и профиль: cup CC_DIV_WEAK[див] finals; eval [1,2]; solo квал [0.5,5]; solo хиты/финал
     [0,0]; victory соло open, r1 [0.85,4] r2 [0.7,3.5]; victory дуо и Плей-Ин [1,3]; Reload соло [0,0] без возрождений
     (respawnUntilZone); major хиты/LCQ/финал, final, gc, summit, globals, reload [0,0]; всё кроме victory соло finals.
   Соло нельзя по силе карточек: team.pow одиночки ~69 при эталоне 86, финал соло вырезался к третьей зоне.
   Не измерено, на запасной формуле: Про-Ам, Reload дуо Victory Cup, ранкед-капы. */
/* 7.09: поле финала соло — сильнейшая сотня (careerSoloField, stage), SIZE_SCALE_MIN
   0.7 и CHIP_SOLO_MUL в движке; квал перебран под это: [0.8, 6] — движок 92 82 77
   72 64 56 50 43 36 21 12 при реплее 88 76 72 68 66 61 54 44 36 27 17 (разрыв
   3.6); Solo VC при [0.7, 3.5] — 90 79 66 57 49 44 40 35 31 20 11 (разрыв 3.1). */
const CC_ZONE_D1=[0,0], CC_ZONE_OPEN_DUO=[1,3], CC_ZONE_OPEN_SOLO=[0.85,4], CC_ZONE_SOLO_QUAL=[0.8,6], CC_ZONE_EVAL=[1,2];
/* Второй раунд со своими единицами: раннеры зовут ccZoneTuneRound(..., 2). Пробы: career-alive-curve-probe
   (REAL=perf_eval_r2 KIND=eval ROUND=2), career-solo-alive-probe (OPEN=1 REAL=solo_victory_cup_r1|r2 ROUND=2).
   Solo VC: реплеи r1 (5) 85 64 56 51 46 40 36 30 24 18 11, r2 (6) 88 73 64 58 52 48 41 34 28 20 11.
     [0.7,3.5] подходит r2 (разрыв 2.6), на r1 5.9; r1 теперь [0.85,4], разрыв 3.6 ([1,3.5] 4.0, [0.55,3] 7.9).
     Проба r2 играет открытым полем, в игре там сотня прошедших (не измерено).
   Perf Eval r2 (4): 47 40 37 34 32 30 26 23 19 15 10; единицы первого раунда [1,2] дают разрыв 1.7
     ([0.5,1] 2.0, [0,0] 3.1), поэтому остаются. */
const CC_ZONE_EVAL_R2=CC_ZONE_EVAL, CC_ZONE_OPEN_SOLO_R2=[0.7,3.5];
// Принудительный профиль движка на вечер; applyStageBias читает его перед
// таблицей очков. null — как решит таблица.
let CC_ZONE_PROFILE=null;
/* Что ставить движку на этот вечер: {units:[уловимость, контест]|null,
   profile:'finals'|'open'|null}. next.stage / next.mode / next.reload —
   подсказки проб; в игре стадия читается из календаря дня. */
function ccZoneTuneSpec(next){
  const none={units:null, profile:null};
  if(!next) return none;
  const cr=CAREER && CAREER.career, t=next.type;
  if(t==='cup')  return {units:(cr && CC_DIV_WEAK[cr.division]) || null, profile:'finals'};
  // Второй раунд — своя комната (прошедшие) и свои реплеи (perf_eval_r2); раннер
  // зовёт ccZoneTuneFor ещё раз с round:2 перед ним (см. ccZoneTuneRound).
  if(t==='eval') return {units:next.round===2 ? CC_ZONE_EVAL_R2 : CC_ZONE_EVAL, profile:'finals'};
  if(t==='solo'){
    const so=(typeof careerSoloSeriesOn==='function') ? careerSoloSeriesOn(next.day) : null;
    const stage=next.stage || (so && so.stage);
    // Открытая стадия соло: квал январской серии, у FNCS Solos — по spec.open.
    const open = so && so.series==='solos' ? !!(so.spec && so.spec.open) : stage==='qual';
    return open ? {units:CC_ZONE_SOLO_QUAL, profile:'finals'} : {units:CC_ZONE_D1, profile:'finals'};
  }
  if(t==='victory'){
    const ev=(typeof careerVictoryOn==='function') ? careerVictoryOn(next.day) : null;
    const reload=!!next.reload || ccIsReloadEv(ev);
    const solo=next.mode==='solo' || !!(ev && ev.mode==='solo');
    if(reload) return solo ? {units:CC_ZONE_D1, profile:'finals'} : none;
    // Соло: второй раунд — сотня прошедших, реплеи solo_victory_cup_r2 (см. таблицу выше).
    // Дуо второго раунда в реплеях нет — единицы первого.
    if(solo) return {units:next.round===2 ? CC_ZONE_OPEN_SOLO_R2 : CC_ZONE_OPEN_SOLO, profile:'open'};
    return {units:CC_ZONE_OPEN_DUO, profile:'finals'};
  }
  if(t==='major'){
    const mj=(typeof careerMajorOn==='function') ? careerMajorOn(next.day) : null;
    const stage=next.stage || (mj && mj.stage);
    return stage==='playin' ? {units:CC_ZONE_OPEN_DUO, profile:'finals'} : {units:CC_ZONE_D1, profile:'finals'};
  }
  /* Pro-Am — тоже Reload, 20 дуо в одном лобби (Notion 26.10.26: «очень много киллов, хотя умер в топ-20»). Без своей
     настройки он играл движком по умолчанию, не по реплеям Reload: проба вечера — 84–102 элима на лобби за игру
     (Reload Elite Series 51–68) и команды с 10–16 киллами на 18–20-х местах. */
  if(t==='final' || t==='gc' || t==='summit' || t==='globals' || t==='reload' || t==='proam') return {units:CC_ZONE_D1, profile:'finals'};
  return none;
}
function ccZoneWeakFor(next){ return ccZoneTuneSpec(next).units; }
function ccZoneTuneFor(next){
  if(typeof ZoneSim==='undefined' || !ZoneSim.tune) return;
  const spec=ccZoneTuneSpec(next), w=spec.units;
  ZoneSim.tune(w ? {LOBBY_WEAK_UNITS:w[0], DROP_WEAK_UNITS:w[1]} : {LOBBY_WEAK_UNITS:null, DROP_WEAK_UNITS:null});
  CC_ZONE_PROFILE=spec.profile;
}
// Перед вторым раундом вечера: та же настройка, но с номером раунда — комната
// прошедших дерётся по своим реплеям (CC_ZONE_EVAL_R2, CC_ZONE_OPEN_SOLO_R2).
function ccZoneTuneRound(type, round, extra){
  ccZoneTuneFor(Object.assign({type, round, day:careerToday()}, extra||{}));
}
/* ЛИЧНЫЙ ВЕЧЕР НЕ ДВИГАЕТ ОБЩУЮ СЦЕНУ (годовой прогон вдвоём 1.10, 2019: последний вечер года разошёлся
   на первой игре — у бота rakso 86 у одного и 87 у другого). Книги роста сцены (CAREER.dev, CAREER.devL)
   командные и сводятся закрытием общего вечера, но между общими вечерами идут личные (соло-Мейджоры Кубка
   мира, соло-серия в одиночку, Кубок наций) — и каждый клиент растил сцену по своей таблице. Теперь книги
   запоминаются перед вечером и возвращаются после, если вечер прошёл без общего старта. Свой рост игрока
   (CAREER.player) и строка журнала остаются. */
let CC_MP_SHARED_NIGHT=false;
function ccTeamWorldKeep(){
  if(!(typeof ccMpTeam==='function' && ccMpTeam())) return null;
  CC_MP_SHARED_NIGHT=false;
  const snap={};
  ['dev', 'devL'].forEach(k=>{ snap[k]=CAREER[k]===undefined ? undefined : JSON.parse(JSON.stringify(CAREER[k])); });
  return function(){
    if(CC_MP_SHARED_NIGHT) return;
    Object.keys(snap).forEach(k=>{ if(snap[k]===undefined) delete CAREER[k]; else CAREER[k]=snap[k]; });
    try{ careerSave(); }catch(e){}
  };
}
function careerPlayRun(next){
  if(!next) return;
  const worldBack=ccTeamWorldKeep();
  const out=careerPlayRun0(next);
  return worldBack ? Promise.resolve(out).finally(worldBack) : out;
}
function careerPlayRun0(next){
  try{ ccFmtSwapLeak(); }catch(e){}
  CC_TEAM_NIGHT_APART=false;
  if(!next) return;
  // Магазин Fortnite — до первой строки ленты убийств: в ней образы команд (window.CC_FN_SKIN).
  try{ ccFnShopLoad(null); }catch(e){}
  CC_NIGHT_RATE=null; CC_NIGHT_SHOWN=null;   // оценка — своя у каждого вечера (ccNightRate)
  ccEvPaletteApply(next);   // таблицы вечера — в цветах турнира (ccEvPalette)
  CC_DRAFT_RUN=false;   // карьерный вечер — не драфт (см. ccMpOn)
  ccZoneTuneFor(next);  // комната этого дивизиона дерётся по своим реплеям
  // Этапы вечера нумеруются с нуля у каждого раннера — жетон высадки
  // (CC_DROP_STAGE) считается от дня и номера этапа, а не от жизни вкладки.
  if(typeof CC_DROP_STAGE_N!=='undefined') CC_DROP_STAGE_N=0;
  CC_SKIP_ALL=false;   // «симулировать всё» — только на этот вечер (ccRoundChoice)
  /* В команде остров вечера — от СОБЫТИЯ, не от вкладки. Раннеры Перфоманса,
     Мейджора, финала недели и другие берут useLandingSet(ACTIVE_LANDING_SET),
     а это то, что вкладка показывала последним: у одного драфт на другой
     карте — и у двоих разные острова с первой игры. Одиночная как была. */
  if(ccMpOn() && typeof careerNightSet==='function'){
    try{ const set=careerNightSet(next); if(set && ZONE_SETS[set]) useLandingSet(set); }catch(e){}
  }
  /* Гонка: общая комната на этот вечер, если сошлись (ccRaceShared) — свежая
     строка соперника и карточка уходят ДО гейта, чтобы его 'start' застал их. */
  if(typeof ccRaceOn==='function' && ccRaceOn()){
    CC_RACE_LOCK=ccRaceShared(next);
    CC_RACE_ROOM0=null; CC_RACE_NIGHT_APART=false;
    CC_RACE_LOCK_KEY=CC_RACE_LOCK ? careerToday()+'|'+next.type : null;
    /* Стэнд-ины капа другого формата садятся ДО строки: соседи вычитают их из поля по ней.
       Раннер капа (runCareerVictory) видит поднятый CC_EVENT_SIZE и второй раз не добирает. */
    let preSwap=null;
    if(CC_RACE_LOCK && next.type==='victory'){ try{ preSwap=ccEventRosterBegin(ccVictoryFormat(careerVictoryOn(careerToday()))); }catch(e){ preSwap=null; } }
    /* И размер вечера Мейджора 2019-2020 (ccMXSpec: соло-неделя World Cup, соло-FNCS) — тоже до строки.
       Раннер (runCareerMajorMX) ставил его позже, и строка с меткой вечера уходила ещё с напарником:
       прогон 2019 (20.10) — у одного соседа Nyhrox в поле вычтен, у другого нет, неделя 1 разошлась с игры 1. */
    let preSize=null;
    if(CC_RACE_LOCK && next.type==='major'){ try{ const ev=careerMajorOn(careerToday()); const sp=(ev && ev.yx) ? ccMXSpec(ev.yx, ev.n) : null;
      if(sp && sp.size){ preSize=CC_EVENT_SIZE; CC_EVENT_SIZE=sp.size; } }catch(e){ preSize=null; } }
    const sizeBack=function(){ if(preSize!==null){ CC_EVENT_SIZE=preSize; preSize=null; } };
    if(CC_RACE_LOCK){ try{ CC_RACE_ROOM0={}; ccRaceRoom().forEach(p=>{ CC_RACE_ROOM0[p.id]=true; }); careerRaceSend(); if(typeof MP!=='undefined' && MP.sendCard) MP.sendCard(); }catch(e){} }
    let p=null;
    // Сначала строки соседей с их составом на этот вечер, потом поле (ccRaceWaitLock).
    try{ p=CC_RACE_LOCK ? ccRaceWaitLock(CC_RACE_LOCK_KEY).then(()=>careerNightRun(next)) : careerNightRun(next); }catch(e){ sizeBack(); ccEventRosterEnd(preSwap); CC_RACE_LOCK=false; CC_RACE_LOCK_KEY=null; CC_RACE_ROOM0=null; CC_RACE_POW_NOW=null; CC_RACE_EDGE_NOW=null; ccEvDeltaSend(); throw e; }
    return Promise.resolve(p).finally(function(){ sizeBack(); ccEventRosterEnd(preSwap); CC_RACE_LOCK=false; CC_RACE_LOCK_KEY=null; CC_RACE_ROOM0=null; CC_RACE_POW_NOW=null; CC_RACE_EDGE_NOW=null; ccEvDeltaSend(); });
  }
  return Promise.resolve(careerNightRun(next)).finally(function(){ ccEvDeltaSend(); CC_TEAM_NIGHT_APART=false;
    if(CC_TEAM_APART_ALONE){ CC_TEAM_APART_ALONE=false; CC_MP_ALONE=false; } });
}
// Раннер вечера по виду — общий для одиночной карьеры, команды и гонки.
function careerNightRun(next){
  if(next.type==='cup')     return runCareerCup();
  if(next.type==='summit')  return runCareerSummit();
  if(next.type==='globals') return ccIs2023() ? runCareerGlobals2023() : runCareerGlobals();
  if(next.type==='victory') return runCareerVictory();
  // Written months ago and never reachable: careerPlay only ever opened a cup,
  // so the Performance Evaluation sat on the Division 1 calendar with no way in.
  if(next.type==='eval')    return runCareerEval();
  if(next.type==='reload')  return runCareerReload();
  if(next.type==='final')   return runCareerWeeklyFinal();
  if(next.type==='major'){ const mj=careerMajorOn(careerToday()); return (mj && mj.yx) ? runCareerMajorMX() : (mj && mj.y21) ? runCareerMajor2021() : (mj && mj.y22) ? runCareerMajor2022() : (mj && mj.y23) ? runCareerMajor2023() : (mj && mj.y24) ? runCareerMajor2024() : runCareerMajor(); }
  if(next.type==='gc')      return careerGclcOn(careerToday())
                                     ? runCareerGclc() : runCareerReloadChampionship();
  if(next.type==='solo')    return runCareerSoloSeries();
  if(next.type==='proam')   return ccProAmRunTeamSafe();
  if(next.type==='nations') return ccNatRunTeamSafe();
}
/* КУБОК НАЦИЙ В КОМАНДЕ — ЛИЧНЫЙ ВЕЧЕР (годовой прогон вдвоём 1.10, 2021: «разошлись на игре 1 · field
   nations:…n7h85 vs nations:…n22h108»). У каждого своя сборная (страна игрока) и своё поле, а барьеры
   между играми и закрытие были общими — сверка сравнивала две разные таблицы. Теперь вечер одиночный
   (CC_MP_ALONE): без барьеров, без общего закрытия, день каждый двигает сам; следующие ворота снова
   сводят пару. Строка журнала личная и при слиянии не стирается (см. журнал в ccApplyTeamState). */
/* PRO-AM В КОМАНДЕ — ТОЖЕ ЛИЧНЫЙ ВЕЧЕР. Креатор у каждого свой (ccProAmMate), и каждый клиент считал
   весь турнир сам — призы креаторов и пар сцены у двоих разные, а в доски напарника они не уезжали
   (командный год 20.10: Сан-Паулу, Париж, Сеул — доски разошлись на сотни строк). Одиночный вечер
   (CC_MP_ALONE): итог уезжает напарнику копилкой с ником (ccEvDeltaSend), мир от него не растёт. */
async function ccProAmRunTeamSafe(){
  const alone=ccMpTeam();
  if(alone) CC_MP_ALONE=true;
  const own=ccTeamOwnRowsOn();
  try{ return await runCareerProAm(); }
  finally{ if(alone) CC_MP_ALONE=false; ccTeamOwnRowsOff(own); }
}
/* ОДИН ТУРНИР, ДВА РАСЧЁТА — ОДНА ТАБЛИЦА В ДОСКАХ. Pro-Am и Reshuffle в команде каждый играет сам (личный вечер),
   и каждый слал напарнику копилку со ВСЕЙ своей таблицей: боты и креаторы этого турнира получали призовые и рейтинг
   дважды — по разу из каждого расчёта (командный год 20.10: Сан-Паулу, Париж, Сеул, Reshuffle 15.08). Таблицу мира
   пишет хозяин лобби (роль a), второй — только свою строку; копилки обоих доезжают, и доски у двоих одинаковые. */
function ccTeamOwnRowsOn(){
  const on=ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn()) && ccMpRole()==='b' && !CC_BOARD_ONLY_YOU;
  if(on) CC_BOARD_ONLY_YOU=true;
  return on;
}
function ccTeamOwnRowsOff(on){ if(on) CC_BOARD_ONLY_YOU=false; }
async function ccNatRunTeamSafe(){
  const alone=ccMpTeam();
  if(alone) CC_MP_ALONE=true;
  try{ return await runCareerNations(); }
  finally{ if(alone) CC_MP_ALONE=false; }
}

// Weeks the career cannot play yet still have to pass, or a season stops dead at
// week five. The button says what it is: the Major is not wired in, so the week
// is skipped rather than faked.
/* The clock moves a day at a time now.

   It used to jump a week, which was fine while a week was one press of Play and
   nothing else. With the day asking what it is spent on, a week-long jump skips
   six decisions — and those six are the mode. So this moves one day, and the
   next tournament arrives when the calendar says it does rather than when the
   button says so.

   Kept under its old name because the button that calls it is the same button:
   on a day with nothing on it, it is how the player leaves. */
function careerSkipWeek(){
  /* Тот же предохранитель, что у кнопки «следующий день» (careerNextDay):
     упавший день оставляет карьеру на месте, пишет красную строку и не мешает
     хабу нарисоваться. Раньше здесь ошибка улетала наверх — а это вторая
     дверь в тот же шаг, и через неё страница вставала намертво. */
  const was=careerToday();
  try{
    careerAdvanceTo(ccAddDays(careerToday(), 1));
    CC_DAY_ERR=null;
  }catch(e){
    CC_DAY_ERR={day:was, text:String((e && e.message) || e)};
    console.error('careerSkipWeek сломался на '+was+':', e);
  }
  careerRenderHub('centre');
}
/* And the question that the button asks before it.

   A day that is skipped is gone — his call, 21 August, off a player who kept
   hitting this by accident and had no way back. Native confirm, the same as the
   one careerNew already asks, so the mode has one way of asking.

   Asked here rather than inside careerSkipWeek, and that is the whole point:
   the function is the move, this is the press. Everything else that advances a
   day — the fast-forward, the runners, the harness that plays a year to see
   where the wages land — calls the move, and none of them has a player in front
   of it to answer a modal. Put the question in the move and a headless year
   stops on the first day of it, waiting for somebody who is not there. */
function careerSkipAsk(){
  ccAsk(L().chSkipAsk, ()=>careerSkipWeek());
}
// Не играть сегодняшний турнир: тот же шаг на сутки, что «Пропустить день». См. кнопку ch-skipev в хабе.
function careerSkipEventAsk(){
  if(ccMpOn()) return;
  const ev=((careerEvents().get(careerToday())||[]).find(e=>careerCanPlayKindOn(careerToday(), e.kind, true)))||null;
  ccAsk(L().chSkipEvAsk(ev && ev.label ? ev.label : L().chPlay), ()=>careerSkipWeek());
}
/* Пропуск до ближайшего дня с вечером, который игрок может открыть (careerCanPlayKindOn по текущему
   состоянию, по дороге оно не меняется); если такого нет, до последнего дня года. Один careerAdvanceTo
   на всю дистанцию: зарплаты, мир, письма и энергия по числу ночей, турниры не играются и в журнал не пишутся.
   В команде день двигает сервер, кнопка гаснет с причиной. */
function careerSkipTarget(){
  const days=careerEvents();
  const today=careerToday();
  const list=[...days.keys()].filter(d=>d>today).sort();
  for(const d of list){
    if(d>=ccYearTo()) break;
    /* Вечер, закрытый только пустым креслом, — тоже остановка (Notion «0910»: «не сыгралось половина
       капов, когда началось трио»): прыжок мимо него молча отдавал турнир миру, а на дне вечера
       панель дня даёт кнопку найти человека. */
    const ev=(days.get(d)||[]).find(e=>careerCanPlayKindOn(d, e.kind, true));
    if(ev) return {day:d, ev:ev};
  }
  return {day:ccYearTo(), ev:null};
}
/* Сама кнопка — одна на оба места: под закрытым вечером (рядом с «Пропустить
   день») и в панели дня (рядом со «Следующий день» или подсказкой «выбери, на
   что уходит день»: пропуск — это и есть ответ «ни на что, до турнира»). */
/* День церемонии - последний день года: сезон кончается, когда день уходит за него (life-training-formats, seasonOver).
   Кнопка закрывает этот день сразу, без «Next day» (Notion 22.11). В командной карьере день двигает сервер - кнопки нет. */
function ccSeasonEndBtnHTML(){
  const cr=CAREER && CAREER.career; if(!cr || cr.seasonOver || ccMpOn()) return '';
  return '<button class="ch-play ch-skipto" onclick="ccSeasonEndNow()"><i>'+CC_BTN_ICON.skip+'</i> '+esc(L().ccSeasonEndGo)+'</button>';
}
function ccSeasonEndNow(){
  const cr=CAREER && CAREER.career; if(!cr || cr.seasonOver || ccMpOn()) return;
  careerAdvanceTo(ccAddDays(careerToday(), 1)); careerSave(); careerRenderHub('centre');
}
// label - своя подпись (Notion 22.11: «кнопку закончить сезон ниже» под церемонией: пустые дни до неё одним нажатием).
function careerSkipToBtnHTML(label){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.seasonOver) return '';
  if(ccMpOn())
    return '<button class="ch-play ch-skipto" disabled title="'+esc(L().ccMpNoFf)+'"><i>'+CC_BTN_ICON.skip+'</i> '+(label||L().chSkipTo)+'</button>';
  const t=careerSkipTarget(), n=ccFfDays(t.day);
  if(!(n>0)) return '';
  return '<button class="ch-play ch-skipto" onclick="careerSkipToAsk()" title="'+
    esc(L().chSkipToHint(ccDayLabel(t.day), n))+'"><i>'+CC_BTN_ICON.skip+'</i> '+(label||L().chSkipTo)+'</button>';
}
function careerSkipToAsk(){
  if(ccMpOn()){ ccTell(L().ccMpNoFf); return; }
  const cr=CAREER && CAREER.career;
  if(!cr || cr.seasonOver) return;
  const t=careerSkipTarget();
  const n=ccFfDays(t.day);
  if(!(n>0)) return;
  // В гонке «до турнира» — тот же голос за дату, что и у календаря.
  if(ccRaceFfOn()){ careerFfToDay(t.day); return; }
  const what=t.ev ? t.ev.label : L().ccGalaDay;
  ccAsk(L().chSkipToAsk(ccDayLabel(t.day), n, what), ()=>careerSkipTo(t.day));
}
function careerSkipTo(iso){
  if(ccMpOn() || !iso) return;
  const was=careerToday();
  if(!(iso>was)) return;
  try{
    careerAdvanceTo(iso);
    CC_DAY_ERR=null;
  }catch(e){
    CC_DAY_ERR={day:was, text:String((e && e.message) || e)};
    console.error('careerSkipTo сломался на '+was+':', e);
  }
  CH_FF_ASK=null;
  careerRenderHub('centre');
}

/* A season boundary is a birthday, and for Division 1 it is also a reckoning.

   The rule this design read off Epic is that Division 1 is kept only by last
   season's standing. There was no standing to read, so the division you earned
   simply stayed yours and the ladder was a ratchet. There is one now.

   Divisions 2-5 keep their token: Epic publishes no relegation and the season
   table is a Division 1 thing, so nothing below it moves. */
/* Сколько троек доживает до следующего сезона.

   Треть — на глаз это «часть», а по смыслу это межсезонье: у Epic между
   сезонами меняется состав примерно у трети известных команд, и ровно столько
   же нужно, чтобы свободные третьи вообще появлялись. Числа держатся здесь,
   чтобы их было где двигать, если сцена окажется слишком стоячей. */
const CC_TRIO_CHURN=0.3;
/* Дуо тоже распадаются между сезонами. CAREER.splits стирается на границе сезона, и пул снова собирал
   исходные пары. Здесь у каждой пары один бросок от неё самой и сида мира, порог падает каждый сезон:
   пара доживает до сезона N с вероятностью (1−churn)^(N−1). Развод необратим и в сейве не хранится.
   Разводы по ходу игры копятся в cr.duoSplits и тоже переживают год. Первый сезон не трогаем. */
/* И расходятся не все одинаково — по результатам.

   Правка: «после плохих результатов же дуо может распадаться?
   мб если не квал в гранды то, больше шансов».

   Плоский бросок этого не знал: Scroll & Sky и пара из хвоста расходились с
   одной вероятностью. Теперь порог зависит от того, доходит ли пара до
   гранд-финалов. Считается по силе, а не по сыгранному: чужие пары своих
   вечеров нигде не играют, но сила — это ровно то, чем они квалифицируются,
   и граница проходит по бэнду Дивизиона 1.

   Свой собственный развод по четырём провальным вечерам (CAREER.splits) стоит
   где стоял и работает поверх: то, что игрок видел своими глазами, весит
   больше любой оценки. */
const CC_DUO_CHURN=0.22, CC_DUO_CHURN_TOP=0.10, CC_DUO_CHURN_LOW=0.34;
function ccDuoChurnOf(d){
  if(!d || !d.cards) return CC_DUO_CHURN;
  const ovr=ccDuoOvr(d);
  const band=(typeof CC_DIV_RATING!=='undefined' ? CC_DIV_RATING[1] : 82);
  // Гранды — это верх Дивизиона 1: кто дотягивает, тот и держится вместе.
  if(ovr>=band+8) return CC_DUO_CHURN_TOP;
  if(ovr>=band)   return CC_DUO_CHURN;
  return CC_DUO_CHURN_LOW;
}
function ccDuoBroken(d, cr){
  const c=cr || (CAREER && CAREER.career);
  const key=(typeof d==='string') ? d
          : (d && d.cards) ? d.cards.map(x=>hKey(x)).sort().join('+') : null;
  if(!c || !key) return false;
  if((c.duoSplits||{})[key]) return true;
  /* В году с настоящей сценой (до 2026 включительно) пары как в жизни: случайного развода нет. Игрок: «почему-то
     focus и thomas расходятся». С 01.11b в 2026 три сезона (S40–S42), и бросок шёл в каждом: на третьем сезоне
     пара настоящего года рвалась с шансом 19%, хотя в жизни Focus & Th0masHD вместе весь год. Свой развод (duoSplits) остаётся. */
  // ccCalYear() после 2026 тоже отвечает 2026, поэтому «настоящий год» узнаётся по сдвигу: 0 = календарь жизни.
  if(!(ccYearShift()>0)) return false;
  const s=Math.max(1, c.season||1);
  if(s<=1) return false;
  const churn=(typeof d==='string') ? CC_DUO_CHURN : ccDuoChurnOf(d);
  // В замке гонки — сид книги мира (старшего), иначе пары «жили» бы у каждого по-своему.
  const seedOf=ccWorldSeed();
  return careerRng(ccHashStr('duoLife|'+seedOf+'|'+key))()
         > Math.pow(1-churn, s-1);
}
/* Верхняя пара может забрать человека из другой пары, та распадается. Это трансфер, а не кража (раньше
   careerCupField разбирал случайную пару из хвоста, а в пуле они числились парой), с тремя ограничениями:
   только на стыке года; только когда свободных в полосе пары нет (в EU все сильные разобраны, поэтому у 96/96
   третьим стоял 82); жертва теряет одного: пара в книгу разводов, второй на рынок и собирается заново
   (ccRemadeDuos).
   Бросок солится сезоном и сидом мира, перезагрузка год не пересоберёт. */
/* Пересборка сцены в трио-год. Европе не хватало третьих: у НАК 32 карточки 90+ из 335, у Европы 22 из 902,
   и все сильные в записанных парах (лучший свободный 87), поэтому третий у EU был на 7 ниже, у NA на 0.5
   (tools/trio-region-probe.js; синергия ровная, career-lan-syn-probe.js). Трио-комнате нужно 112 команд из 150 пар.
   Каскад по каждому региону сверху вниз: пара берёт сильнейшего свободного в полосе CC_TRIO_BAND, иначе зовёт
   из пары ниже ближайшего к своей средней (не сильнейшего), брошенный выходит на рынок. Предохранитель
   CC_RAID_SHARE: не больше трети пар. Раз в сезон (ccTrioMarket), пара пишется в разводы, брошенные
   собираются в ccRemadeDuos, чужого не зовут, пока рынок закрывает нужду. */
const CC_RAID_TOP=8, CC_RAID_CHANCE=0.5;   // старые пороги, оставлены для сейвов
/* Полоса РЫНКА уже полосы подбора. CC_TRIO_BAND=6 — это «третий не выглядит
   чужим в этой команде», и для комнаты дивизиона этого хватает. Но пара, у
   которой на рынке лежит человек ровно на шесть ниже, по этому правилу
   никого не зовёт — и весь верх сцены остаётся с разрывом в пять-шесть, что
   и намерил ЛАН (Европа −5.1 при американских −1.2). Трио собирают ближе:
   зовут, пока рынок не даёт кого-то в трёх пунктах. */
const CC_RAID_BAND=3, CC_RAID_SHARE=1/3;
function careerTrioRaids(cr){
  if(!cr || careerSquadSize()!==3) return 0;
  CC_POOLS=null;
  /* Пул МИРА: трио-комнату собирает не только свой регион — ЛАН берёт третьих
     с досок всех семи, и рынок им нужен такой же. */
  const pool=ccAsWorld(()=>careerPools());
  const all=(pool.duos||[]).slice();
  if(all.length<4) return 0;
  const regOf=c=>String((c && (c.region||c.cardRegion)) || 'EU');
  const paired=new Set();
  all.forEach(d=>d.cards.forEach(c=>paired.add(hKey(c))));
  cr.trios=cr.trios||{}; cr.duoSplits=cr.duoSplits||{};
  // Пары и свободные — по регионам: тройка собирается внутри своей сцены.
  const byReg={}, freeReg={};
  all.forEach(d=>{ const r=regOf(d.cards[0]); (byReg[r]=byReg[r]||[]).push(d); });
  (pool.players||[]).forEach(c=>{
    if(paired.has(hKey(c))) return;
    const r=regOf(c);
    (freeReg[r]=freeReg[r]||[]).push(ccCardOvr(c));
  });
  const put=(list, v)=>{                       // вставка в убывающий список
    let i=0; while(i<list.length && list[i]>v) i++;
    list.splice(i, 0, v);
  };
  let made=0;
  Object.keys(byReg).forEach(reg=>{
    const duos=byReg[reg].sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a));
    const free=(freeReg[reg]||[]).slice().sort((a,b)=>b-a);
    const busy=new Set();
    const cap=Math.max(1, Math.floor(duos.length*CC_RAID_SHARE));
    let done=0;
    for(let i=0;i<duos.length;i++){
      const d=duos[i];
      if(d.cards.some(c=>busy.has(hKey(c)))) continue;
      const avg=ccDuoOvr(d);
      // Рынок закрывает нужду — берём с рынка, и этого человека там больше нет.
      if(free.length && avg-free[0]<=CC_RAID_BAND){ free.shift(); continue; }
      if(done>=cap) break;
      const bar=free.length ? free[0] : 0;
      let best=null;
      for(let j=i+1;j<duos.length;j++){
        const v=duos[j];
        if(v.cards.some(c=>busy.has(hKey(c)))) continue;
        v.cards.forEach(c=>{
          const o=ccCardOvr(c);
          if(o<=bar) return;                   // рынок и так это даёт
          const dist=Math.abs(avg-o);
          if(!best || dist<best.dist) best={card:c, duo:v, dist:dist};
        });
      }
      if(!best) break;                         // звать больше некого
      cr.duoSplits[best.duo.cards.map(c=>hKey(c)).sort().join('+')]=careerToday();
      cr.trios[d.cards.map(c=>hKey(c)).sort().join('+')]=hKey(best.card);
      d.cards.forEach(c=>busy.add(hKey(c)));
      best.duo.cards.forEach(c=>busy.add(hKey(c)));
      // Брошенный выходит на рынок — он и станет третьим для пары ниже.
      const orphan=best.duo.cards.find(c=>hKey(c)!==hKey(best.card));
      if(orphan) put(free, ccCardOvr(orphan));
      made++; done++;
    }
  });
  if(made){ CC_POOLS=null; CC_NOW_CARDS={}; }
  return made;
}
/* Ты забрал игрока из тройки — она добирает замену ПО СИЛЕ, один раз, и дальше играет с ней.

   Отзыв 25.10: «команда, у которой я забрал игрока, начинает либо с каким-то слабым игроком
   играть, либо на каждый турнир из других триосов воровать по игроку… чтобы она со своим
   рейтингом примерно тиммейта нового находила». Свободные в верху сцены на 15–20 слабее
   (проба: Pixie 96 & SwizzY 95 без Shxrk получали Eclipse 76), поэтому здесь то же, что
   делает рынок трио на старте сезона (careerTrioRaids): если рынок не даёт никого в
   CC_RAID_BAND, тройка зовёт ближайшего по силе из пары ниже, та пара распадается
   (cr.duoSplits), брошенный выходит на рынок. Запись в cr.trios делает это однократным.

   Два случая: забрал третьего — ядро то же; забрал одного из ядра — ядром становятся
   оставшийся и бывший третий (они и сядут вместе, см. ccOrphanPairs). */
function ccTrioRefill(mine){
  const cr=CAREER && CAREER.career;
  if(!cr || careerSquadSize()!==3 || !cr.trios) return 0;
  if(ccIs2025() && ccNowYear()===2025) return 0;
  if(ccChapterMoved()) return 0;
  /* Нанятые на сегодня (ccHireKeys) — не ушедшие: их трио в cr.trios остаётся как было, без нового третьего
     и без cr.orphanMate (его «пусть не будет распада трио у них из-за этого только на один кап»). */
  const hk=(typeof ccHireKeys==='function') ? ccHireKeys() : new Set();
  // Отсев по самой карточке: ключ строки — c._k (может быть с регионом), а нанятые хранятся по нику (hKey).
  const mk=new Set((mine||[]).filter(c=>c && !hk.has(hKey(c))).map(c=>c._k||hKey(c)).filter(Boolean));
  if(!mk.size) return 0;
  const memo=cr.trios, keyOf=cards=>cards.map(c=>hKey(c)).sort().join('+');
  const need=[];
  Object.keys(memo).forEach(key=>{
    const p=key.split('+'), t=memo[key];
    if(p.length!==2 || p.some(k=>mk.has(k))) return;
    if(mk.has(t)) need.push({key, keys:p});
  });
  (careerPools().duos||[]).forEach(d=>{
    const ks=d.cards.map(c=>hKey(c)), out=ks.filter(k=>mk.has(k));
    if(out.length!==1) return;
    const left=ks.find(k=>!mk.has(k)), t=memo[ks.slice().sort().join('+')];
    if(!t || mk.has(t)) return;
    const key=[left, t].sort().join('+');
    if(memo[key]) return;
    cr.orphanMate=cr.orphanMate||{};
    if(!cr.orphanMate[left]) cr.orphanMate[left]=t;
    if(cr.orphanMate[left]===t) need.push({key, keys:[left, t]});
  });
  if(!need.length) return 0;
  CC_POOLS=null;
  const pool=ccAsWorld(()=>careerPools());
  const cardOf=new Map();
  (pool.players||[]).forEach(c=>cardOf.set(hKey(c), c));
  (pool.duos||[]).forEach(d=>d.cards.forEach(c=>cardOf.set(hKey(c), c)));
  const paired=new Set(), held=new Set(Object.values(memo));
  (pool.duos||[]).forEach(d=>d.cards.forEach(c=>paired.add(hKey(c))));
  const regOf=c=>String((c && (c.region||c.cardRegion)) || 'EU');
  cr.duoSplits=cr.duoSplits||{};
  let made=0;
  need.forEach(n=>{
    const core=n.keys.map(k=>cardOf.get(k)).filter(Boolean);
    delete memo[n.key];
    if(core.length!==2) return;
    const reg=regOf(core[0]), avg=ccDuoOvr({cards:core});
    const busy=k=>mk.has(k) || n.keys.indexOf(k)>=0;
    const free=(pool.players||[]).filter(c=>{ const k=hKey(c); return regOf(c)===reg && !paired.has(k) && !held.has(k) && !busy(k); })
      .sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
    if(free.length && avg-ccCardOvr(free[0])<=CC_RAID_BAND){ memo[n.key]=hKey(free[0]); held.add(memo[n.key]); return; }
    const bar=free.length ? ccCardOvr(free[0]) : 0;
    let best=null;
    (pool.duos||[]).forEach(v=>{
      if(regOf(v.cards[0])!==reg || ccDuoOvr(v)>=avg) return;
      if(v.cards.some(c=>busy(hKey(c)))) return;
      // Ядро полной тройки не разбираем: иначе одна тройка чинится ценой другой, а оставшийся из пары
      // и её третий висят без состава до конца сезона (Th0masHD 91 и panzer, 2027 трио-год, 7.02).
      const vt=memo[keyOf(v.cards)]; if(vt && !mk.has(vt)) return;
      v.cards.forEach(c=>{
        const o=ccCardOvr(c); if(o<=bar) return;
        const dist=Math.abs(avg-o);
        if(!best || dist<best.dist) best={card:c, duo:v, dist};
      });
    });
    /* Переманить некого (в EU после 2026 все сильные пары — ядра троек, их не разбираем): берём лучшего свободного,
       пусть и вне полосы. Иначе запись пустая и третьего даёт случайный добор комнаты (Layn 82 при 95.5 вместо 90). */
    if(!best){ if(free.length){ memo[n.key]=hKey(free[0]); held.add(memo[n.key]); } return; }
    cr.duoSplits[keyOf(best.duo.cards)]=careerToday();
    memo[n.key]=hKey(best.card); held.add(memo[n.key]);
    best.duo.cards.forEach(c=>paired.delete(hKey(c)));
    paired.add(hKey(best.card));
    made++;
  });
  CC_POOLS=null; CC_NOW_CARDS={};
  return made;
}
/* Рынок открывается РАЗ ЗА СЕЗОН — и сам, если сезон уже идёт.

   careerNewSeason зовёт его на стыке, но сейв, который стоит посреди
   трио-года (а таких у него ровно один — тот, в котором играет тестер),
   стыка больше не увидит. Поэтому вход ещё и здесь, с меткой сезона: первая
   комната года, которая спросит поле, откроет рынок и запишет метку. */
function ccTrioMarket(cr, force){
  const c=cr || (CAREER && CAREER.career);
  if(!c || careerSquadSize()!==3) return 0;
  if(ccIs2025() && ccNowYear()===2025) return 0;   // трио 2025-го настоящие, с карточек — рынку тут нечего делать
  if(ccChapterMoved()) return 0;                   // и у карьеры, перешедшей в следующий год: составы года календаря (ccRealTeamDuos)
  // На стыке года рынок открывается ВСЕГДА (force): метка там ещё от прошлого
  // сезона, а сезон уже новый.
  if(!force && c.raided===c.season) return 0;
  c.raided=c.season;
  return careerTrioRaids(c);
}
function careerTriosCarry(memo, splits, cr){
  const out={};
  if(!memo || typeof memo!=='object') return out;
  // Кого сезон развёл сам: ядро распалось — третьему не за кем идти.
  const broke=new Set();
  Object.keys(splits||{}).forEach(k=>String(k).split('+').forEach(h=>broke.add(h)));
  // Бросок один на межсезонье и посеян сезоном: перезагрузка не пересоберёт.
  const rnd=careerRng(ccHashStr('carry|'+ccWorldSeed()+'|'+((cr&&cr.season)||1)));
  Object.keys(memo).forEach(key=>{
    if(String(key).split('+').some(h=>broke.has(h))) return;
    if(rnd()<CC_TRIO_CHURN) return;
    out[key]=memo[key];
  });
  return out;
}
function careerNewSeason(){
  const cr=CAREER.career, pl=CAREER.player;
  // Under the floor there is no division left to enter, so the year does not
  // start: the career ends here whether or not the player was ready.
  if(careerMustRetire()){ careerRetire(true); return; }
  /* Из первого дивизиона не вылетают.

     Решение: «сделай, чтоб игрок не мог вылетить из 1
     дивизиона». Отсечка ниже осталась и считается по-прежнему — плохой сезон
     по-прежнему называется плохим сезоном в ленте, — но токен дивизиона больше
     не отбирается.

     Причина простая и она про режим, а не про Epic: дивизион 1 — это весь
     смысл карьеры, туда идут весь год, и вылет за один неудачный сезон
     выкидывает игрока из всего, ради чего он играл, включая Мейджоры и ЛАН.
     Дивизионы 2-5 и раньше ничего не теряли; теперь первый ведёт себя так же. */
  /* Правила «топ-N остаётся в Д1» больше нет совсем — отзыв:
     «не надо это правило». Вылет сняли 22-го, сегодня ушла и строка в ленте,
     которая продолжала мерить сезон отменённой отсечкой. */
  careerOrgSeasonEnd();
  try{ ccPrPrune(); ccPrDropDead(); }catch(e){}   // хвост Power Ranking — здесь, у всех одинаково (см. ccPrPrune)
  /* The year that just ended is written down before it stops being the year.

     Nothing recorded what a past season was played in — the archive worked it
     out from the season number, and the number is not what happened: the
     alternating rule is younger than most saves, so a career that played its
     second year in a duo was told by the tile that it had been a trio season,
     under its own Major won by two people. See careerSeasonSize. */
  const sizes=cr.sizes || (cr.sizes={});
  sizes[cr.season]=careerSquadSize();
  // A second career year is the same measured year again: only 2026 was
  // measured, and a 2027 does not exist to copy.
  /* Год 2025 играется один раз: со стыка карьера идёт в 2026-й (дуо, как
     было в жизни), и первый день нового сезона — уже по календарю 2026-го. */
  if(cr.year===2025) cr.year=2026;
  else if(cr.year===2024) cr.year=2025;   // после Форт-Уэрта — календарь 2025-го (трио), люди 2024-го
  else if(cr.year===2023) cr.year=2024;
  else if(cr.year===2022) cr.year=2023;
  else if(cr.year===2021) cr.year=2022;
  else if(cr.year===2019) cr.year=2020;
  else if(cr.year===2020) cr.year=2021;   // после C2S4 — календарь 2021-го (трио), люди прошлых лет   // после FNCS C2S1 — календарь 2020-го (трио), люди 2019-го   // после Grand Royale — календарь 2022-го (дуо), люди 2021-го   // после Роли — календарь 2023-го (дуо), люди 2022-го   // после Копенгагена — календарь 2024-го (дуо), люди 2023-го
  const payDay0=cr.day;
  cr.season++; cr.day=careerStartDay(); cr.seasonOver=false;
  cr.rust={from:cr.day, tr:0};   // ржавчина межсезонья (ccRustPen)
  /* Ожидаемые призовые (cr.payQ) — по часам нового сезона (Notion 27.10, игрок: «деньги за Кубок наций иногда не
     приходят — выплата через месяц, а новый год начинается раньше»). Срок стоял датой, а часы со стыка откатываются
     на начало календаря (2027+ идёт по кругу с 2025-12-15): финал 28.11 ждал выплату до 28.12 следующего круга, почти
     год. Сколько дней оставалось ждать, столько и остаётся, от первого дня нового сезона. */
  if(Array.isArray(cr.payQ) && cr.payQ.length && payDay0)
    cr.payQ=cr.payQ.map(x=>Object.assign({}, x, {due:ccAddDays(cr.day, ccDaysBetween(payDay0, x.due))}));
  /* Календарь — на месяц нового сезона (его слово 9.10: «календарь не обновился в новом сезоне»):
     открытый месяц помнился с конца прошлого года, и вкладка стояла на ноябре старого сезона. */
  CH_MONTH=null; CH_FF_ASK=null;
  cr.plog={}; delete cr.plogYou;   // журнал вечеров игроков — по сезону (careerPlayerStatsHTML, фраггер года)
  /* Часть троек переживает межсезонье. Чистить всё нельзя (сцена теряет лица), не чистить тоже:
     не останется свободных третьих для карьеры без напарника. Первыми расходятся те, кого сезон уже
     развёл (CAREER.splits, пишет careerGrowField после четырёх провальных вечеров подряд),
     потом ещё доля по броску. */
  /* И трио-сезон тоже разводит пары — на стыке года, а не посреди него.

     Отзыв: «пусть могут дуо распасться и собраться в хороший
     триос», и рядом — «они могут поменять тимейта, когда сезон закончится,
     если плохие результаты там, не квал в гранды».

     В трио-сезоне четыре провальных вечера подряд писали пару в CAREER.lft —
     «ищем третьего» (правило: в трио пара никого не бросает
     посреди сезона), — и на этом всё кончалось: ключ нигде не читался и умирал
     вместе с годом. Теперь он идёт туда же, куда идут дуо-разводы: пара
     распадается на стыке, половинки уходят в свободные агенты, и ccRemadeDuos
     сводит их заново по силе — сосед по таблице с соседом. Из этого и
     получается новая тройка: новая пара плюс третий по её же полосе силы. */
  const lftBook=(CAREER.lft && typeof CAREER.lft==='object') ? CAREER.lft : {};
  const parted=Object.assign({}, CAREER.splits||{}, lftBook);
  cr.trios=careerTriosCarry(cr.trios, parted, cr);
  /* Разводы, заработанные за сезон, ПЕРЕЖИВАЮТ год — иначе распавшаяся
     пара к январю снова вместе. См. ccDuoBroken. */
  cr.duoSplits=Object.assign({}, cr.duoSplits||{}, parted);
  delete CAREER.splits;
  delete CAREER.lft;
  delete CAREER.duoStreak;
  /* Новый год — новая сцена, и кэш об этом сам не узнает: пул держится по
     календарному снимку и региону, а они на стыке те же самые. Без сброса
     первая комната января собиралась бы прошлогодними парами — теми, которых
     этот же стык только что развёл. */
  CC_POOLS=null; CC_NOW_CARDS={};
  ccChapterCarry();
  // Odd years are duos and even years are trios. Written down rather than
  // derived — see careerSquadSize.
  /* Год 2025 играется один раз: со стыка карьера идёт в 2026-й (дуо, как
     было в жизни). Дальше чередование по чётности — с поправкой на то, что
     первый год был трио: у карьеры, начатой в 2025-м, сезон 2 — дуо, 3 — трио. */
  // Карьера 2023-го: 2024-й — снова дуо, 2025-й — трио, дальше чередование (та же поправка, что у 2025-го).
  cr.size = ((cr.season + ((cr.year0===2025 || cr.year0===2023) ? 1 : 0)) % 2) ? 2 : 3;
  // Карьера 2022-го: 2023-й и 2024-й — дуо, 2025-й — трио, дальше чередование.
  if(cr.year0===2022) cr.size = cr.season<=3 ? 2 : (cr.season%2 ? 2 : 3);
  // Карьера 2021-го: 2022–2024 — дуо, 2025-й — трио, 2026-й — дуо, дальше чередование.
  if(cr.year0===2021) cr.size = cr.season===5 ? 3 : cr.season<=4 ? 2 : (cr.season%2 ? 3 : 2);
  // Карьера 2019-го: 2020–2021 — трио, 2022–2024 — дуо, 2025 — трио, 2026 — дуо, дальше чередование.
  // Карьера 2020-го: 2021 — трио, 2022–2024 — дуо, 2025 — трио, 2026 — дуо, дальше чередование.
  if(cr.year0===2020) cr.size = cr.season<=2 ? 3 : cr.season<=5 ? 2 : cr.season===6 ? 3 : (cr.season%2 ? 2 : 3);
  if(cr.year0===2019) cr.size = cr.season<=3 ? 3 : cr.season<=6 ? 2 : cr.season===7 ? 3 : (cr.season%2 ? 3 : 2);
  sizes[cr.season]=cr.size;
  // После 2026 формат года выбирает игрок (ccFmtYearOpen); чётность выше — то, что стоит по умолчанию.
  if(ccYearShift()>0) cr.fmtOpen=cr.season; else delete cr.fmtOpen;
  /* И рынок трио — после того, как размер года известен: пересобирается сцена
     только в трио-год. См. careerTrioRaids и ccTrioMarket. */
  ccTrioMarket(cr, true);
  /* Clear the year's tournament state on a new season. careerGlobalsCan refuses once cr.globals
     exists and careerSummitCan/careerRcCan compare to the furthest stage, so LANs vanished from year three.
     Also clears week-bound banks (Monday points, first Opens evening, Weekly Final seat); the division
     token and ladder stay.
     did: the season restarts at careerStartDay() (5 Jan) and the day record is keyed by date only,
     so careerDayClosed saw last year's days as done and every button was dead on day one.
     mg: the month goal key (2026-01) has no season in it, so January's bonus came back already paid. */
  /* Ещё два сброса на новый сезон. cr.major ключуется номером Мейджора (каждый год 1 и 2), и got='final'
     прошлого года закрывал все этапы нового. cr.gclc «уже прошёл Ласт Чанс» закрывал квалы нового сезона,
     а careerSlotHeld считал, что карьера держит место на прошлых Глобалах. */
  // majorSeed — таблица Плей-Ина этого года, по которой сеются его Хиты:
  // ключуется номером Мейджора ровно как cr.major и уходит вместе с ним.
  ['summit','globals','rc','ewc','reload','gaveUp','rel','d1','wf','did','mg',
   'major','majorSeed','gclc','sickUntil','solo','solos','solosBy','solosRl','solosRlBy']
    .forEach(k=>{ delete cr[k]; });
  /* And the year's labels, which name this season's cities.

     careerYearDays builds the whole year once and keeps it, because the hub asks
     for it on every render — and two of its rows carry {CITY}, filled in from
     ccLanCity at build time. A language change already drops the cache for the
     same reason. A season change did not, so the LAN moved every year in
     ccLanFixed and the calendar went on printing the city it was first built
     with: season two reads Amsterdam out of ccLanCity and "Reload Championship ·
     Paris" off the calendar, in the same breath. His report, 17 August: why is
     the LAN still the same in 2027. */
  CC_YEAR_DAYS=null;
  pl.age=(pl.age||0)+1;
  pl.ageEdge=ccEdgeOff(pl) ? 0 : ccAgeEdge(pl.age);
  CAREER.offersDeclined=null;
  if(!CAREER.org) CAREER.offers=careerOrgOffers();
  careerSave();
  careerRenderHub('centre');
}

// ---- The Performance Evaluation --------------------------------------------
// Division 1's other night, and it is not a cup. Its own event page states the
// shape: "You must be Duos Division 1 to participate in this event" and "This
// event will occur over two rounds, with the top 40 teams advancing to Round 2"
// — fifty by the S41 window, which is the season this career is played in.
//
// The two rounds score differently, which is the whole reason it is worth
// playing. Round 1 is eight games on the ordinary duo table, paying one a kill
// rather than four. Round 2 is four games where a Victory Royale is 100 points
// and an elimination is nothing — and the money follows the same rule: $400 a
// win, so all four games is $1,600 and a night without a win is nothing at all.
// Measured in tools/fortnite-2026-year.generated.js off the event's own windows.
/* ===== The turn of a Fortnite season =====
   Patch dates from the wiki season infoboxes (not the first cup: S40 opens 19 Mar, first cup on the 23rd):
     S39 C7S1 29 Nov 2025 → 19 Mar 2026;  S40 C7S2 19 Mar → 5 Jun 2026;  S41 C7S3 6 Jun → 20 Aug 2026.
   Duos change here, not mid-run. A partner unhappy all season leaves (same line as careerMoodKey, 45), and so does
   one who outgrew the player by more than CAREER_DM_REACH. */
/* Сезоны 2025-го — Chapter 6: коды Epic скачут (S35 — «Galactic Battle» без
   дивизионных кубков, S37 — Chapter 6 Season 4 до самого S39). Даты — патчи. */
// Сезоны 2024-го — Chapter 5 (S28–S31), границы по патчам.
const CC_SEASONS_2024=[
  {id:'S28', from:'2023-12-03', to:'2024-03-07'},
  {id:'S29', from:'2024-03-08', to:'2024-05-23'},
  {id:'S30', from:'2024-05-24', to:'2024-08-15'},
  {id:'S31', from:'2024-08-16', to:'2024-11-01'},
  {id:'S32', from:'2024-11-02', to:'2024-11-30'}   // Chapter 2 Remix
];
const CC_SEASONS_2025=[
  {id:'S33', from:'2024-12-01', to:'2025-02-20'},
  {id:'S34', from:'2025-02-21', to:'2025-05-01'},
  {id:'S35', from:'2025-05-02', to:'2025-06-06'},
  {id:'S36', from:'2025-06-07', to:'2025-08-06'},
  {id:'S37', from:'2025-08-07', to:'2025-10-31'},
  {id:'S38', from:'2025-11-01', to:'2025-11-28'}   // Симпсоны
];
const CC_SEASONS=[
  {id:'S39', from:'2025-11-29', to:'2026-03-18'},
  {id:'S40', from:'2026-03-19', to:'2026-06-05'},
  {id:'S41', from:'2026-06-06', to:'2026-08-20'},
  // S42 до 31.10, S43 — мини-сезон Treasure Hunters с 1.11 до финального ивента 5.12 (календарь Epic S43 и анонс).
  {id:'S42', from:'2026-08-21', to:'2026-10-31'},
  {id:'S43', from:'2026-11-01', to:'2026-12-05'}
];
/* После 41-го счёт не кончается — правка: «после 41 идёт 42,
   43 и тд». Таблица выше — три измеренных сезона; дальше Epic ничего не
   объявлял, поэтому хвост достраивается тем же шагом, каким шли S40 и S41 —
   двенадцать недель, — и каждый следующий сезон продолжает номер. Без этого
   всё, что живёт от сезона, после 20 августа 2026 оставалось без него:
   денежная книга писала «—», полоса недель теряла подписи, а дуо переставали
   пересобираться на стыках. */
function ccSeasonAfter(d){
  const last=CC_SEASONS[CC_SEASONS.length-1];
  if(d<=last.to) return null;
  const STEP=84;
  let n=Number(last.id.slice(1)), from=ccAddDays(last.to, 1);
  for(;;){
    n++;
    const to=ccAddDays(from, STEP-1);
    if(d<=to) return {id:'S'+n, from, to};
    from=ccAddDays(to, 1);
  }
}
function careerFncsSeason(iso){
  const d=iso||careerToday();
  if(ccIs2025()) return CC_SEASONS_2025.find(x=>d>=x.from && d<=x.to) || null;
  if(ccIs2024()) return CC_SEASONS_2024.find(x=>d>=x.from && d<=x.to) || null;
  if(ccIs2023()) return CC_SEASONS_2023.find(x=>d>=x.from && d<=x.to) || null;
  if(ccIs2022()) return CC_SEASONS_2022.find(x=>d>=x.from && d<=x.to) || null;
  if(ccIs2021()) return CC_SEASONS_2021.find(x=>d>=x.from && d<=x.to) || null;
  if(ccIs2019()) return CC_SEASONS_2019.find(x=>d>=x.from && d<=x.to) || null;
  if(ccIs2020()) return CC_SEASONS_2020.find(x=>d>=x.from && d<=x.to) || null;
  const base=CC_SEASONS.find(x=>d>=x.from && d<=x.to) || ccSeasonAfter(d);
  if(!base) return null;
  /* Второй год карьеры ходит по тем же датам, но сезоны не начинаются заново
     с 39-го — правка: «27 год начинается опять с 39, а не с
     43 44 и тд». Один календарный год держит четыре сезона (S39–S41 измерены,
     S42 достроен и подтверждён его же Tracker-сейвами), и каждый следующий
     год карьеры двигает номер на четыре. */
  const yr=ccYearShift();
  if(yr<=0) return base;
  return {id:'S'+(Number(String(base.id).slice(1))+yr*4), from:base.from, to:base.to};
}
function careerSeasonStartsOn(iso){
  const s=careerFncsSeason(iso);
  return (s && s.from===iso) ? s : null;
}

/* Does the duo hold?

   Answered off what the save already records rather than a roll: how the
   partner feels, and whether they are still somebody who would say yes to this
   player at all. */
// One rung of the ladder, which is what CC_DIV_RATING steps by: past that gap
// the two of you are not in the same division any more.
const CC_DUO_BEHIND=7;
// Сколько дней пара должна быть вместе, чтобы стык сезона мог её развести (см. careerDuoHolds).
const CC_DUO_MIN_DAYS=56;
function careerDuoHolds(){
  const pr=careerMateRec();
  if(!pr) return {hold:false, why:'none'};
  const mate=careerPartnerCard();
  if(!mate) return {hold:false, why:'none'};
  const mine=CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr;
  const theirs=mate._ovr!=null?mate._ovr:(attrsFor(mate)||{}).ovr||0;
  /* Квалифицированное дуо не рвётся само. Правило: «сделай
     так, чтобы тимейт не мог тебя дропнуть если у вас есть квал куда-то,
     только ты можешь» — и скриншот того же дня: стык сезонов уводил в
     'behind' («Спасибо @X за сезон») при живом месте на Глобалах, после чего
     Глобалы играть было не с кем.

     Место принадлежит паре, и пара его доигрывает — та же строка уже стоит в
     careerMatePoach и в careerMateDm ('leaving' молчит при held). Здесь она
     закрывает стык сезонов целиком: и его сторону ('unhappy', 'outgrown',
     бросок), и автоматическую твою ('behind'). Рука игрока не тронута —
     смена напарника кнопкой по-прежнему отдаёт место (careerSlotGiveUp),
     это правило. Место разыграно или отдано — со
     следующего стыка всё рвётся как обычно. */
  if(careerSlotHeld()) return {hold:true};
  /* Кто заметно слабее тебя, уйти не может, даже при плохом настрое и результатах. Зеркало CAREER_DM_REACH:
     насколько выше себя человек ещё скажет «да», настолько ниже тебя никому выше не нужен.
     Остаются в силе 'behind' (разрыв больше ступени, уходишь уже ты) и 'outgrown' (слабее и перерос сразу не бывает).
     Дуо держится, пока ты не оторвёшься на ступень, и рвётся уже по твоему решению. */
  // Или он уехал за тобой на другой континент — тогда уходить ему тоже не к
  // кому, каким бы ни был счёт. См. ccMateStays.
  const loyal = (mine-theirs) > CAREER_DM_REACH || ccMateStays(pr);
  if(!loyal && careerPatience()<45) return {hold:false, why:'unhappy'};
  if(!ccMateStays(pr) && theirs-mine>CAREER_DM_REACH) return {hold:false, why:'outgrown'};
  /* And the same question the other way round, which nobody had asked.

     His career, 17 August: Division 5, fast-forwarded a year, he finished on 75
     and his partner was 58, and the duo never changed. The rule above only ever
     checked whether the partner had outgrown the player. Growing past your own
     partner was not a thing this mode could notice, so a career could improve by
     twenty points and keep dragging the same duo through every cup of it.

     A rung is seven points - it is what CC_DIV_RATING steps by - so being more
     than a rung above the person beside you means you are playing a different
     division from them. That is the point at which this scene moves on, and at
     that gap somebody better is already saying yes to you. */
  // И «перерос» — тоже не раньше, чем пара побыла вместе (свои статы 99 на старте давали разрыв на первом же стыке).
  /* И не раньше, чем вы сыграли вместе (его слово 8.10: «скипаю месяц в 2019 за Монграла, и тиммейт сразу бросает после
     перемотки»). За реальную карточку пара приходит из снимка с датой их настоящего дуэта (Mongraal + Mitr0 — с ноября 2018),
     и «вместе» уже набиралось; разрыв в ступень решал стык S8 28 февраля, хотя вы не сыграли ни одного вечера. Теперь дни
     вместе — не раньше старта карьеры, и нужен хотя бы один турнир вдвоём, как у броска стыка ниже. */
  const crB=CAREER.career, startB=(typeof careerStartDay==='function') ? careerStartDay() : null;
  const sinceB=(pr.since && startB && pr.since<startB) ? startB : pr.since;
  const togetherDays=sinceB ? ccDaysBetween(sinceB, careerToday()) : 999;
  const playedB=(crB.log||[]).some(r=>r && (!sinceB || r.day>=sinceB) && (r.mate===mate.handle || (Array.isArray(r.mates) && r.mates.indexOf(mate.handle)>=0)));
  if(mine-theirs>CC_DUO_BEHIND && togetherDays>=CC_DUO_MIN_DAYS && playedB) return {hold:false, why:'behind'};
  /* Season turn rolls for the duo. Patience only moves on results, (percentile - 0.5) * 12, so a mid-table
     career kept the same partner forever. Now it is a roll weighted by the season: unhappy duos are already gone
     above, a good season mostly runs it back, an ordinary one is near a coin flip.
     Seeded on the season, so redrawing the screen gives the same answer. */
  const p=careerPatience();
  // A duo that is actually happy runs it back, every time. That is the one thing
  // a good season buys, and the roll below has no business overriding it.
  if(p>=CC_MATE_HAPPY) return {hold:true};
  // И тот, кому уходить некуда, не уходит и по броску: бросок разыгрывает
  // «кому-то предложили, кто-то захотел попробовать иначе», а у него этого
  // варианта нет. См. loyal выше.
  if(loyal) return {hold:true};
  const cr=CAREER.career;
  /* Бросок стыка — только для пары, у которой был сезон вместе. Карьера 2019-го стартует
     21 января, стык S8 — 28 февраля, а турниров до апреля нет: напарник уходил через
     5 недель, не сыграв с тобой ни вечера (его жалоба 29.09: «тимейт бросил меня в 2019
     очень быстро»). Меньше CC_DUO_MIN_DAYS вместе или ни одного турнира вдвоём — держится. */
  const since=pr.since || null;
  const together=since ? ccDaysBetween(since, careerToday()) : 999;
  const playedTogether=(cr.log||[]).some(r=>r && (!since || r.day>=since) &&
    (r.mate===mate.handle || (Array.isArray(r.mates) && r.mates.indexOf(mate.handle)>=0)));
  if(together<CC_DUO_MIN_DAYS || !playedTogether) return {hold:true};
  const rnd=careerRng(ccHashStr('duo|'+cr.season+'|'+(cr.seasonTurn||'')+'|'+mate.handle));
  const podiums=(cr.log||[]).filter(r=>r.season===cr.season && r.place<=3).length;
  // In between: 35% at the edge of unhappy, 85% at the edge of happy, and a
  // podium together is worth a few points of it.
  const hold=clamp(0.35+((p-45)/(CC_MATE_HAPPY-45))*0.5+Math.min(0.15, podiums*0.05),
                   0.35, 0.95);
  return rnd()<hold ? {hold:true} : {hold:false, why:'moved'};
}

/* The break itself.

   A duo that holds says so — running it back is a thing players post about, and
   it is the only line in this feed that is about nothing happening. A duo that
   splits leaves an empty seat, and it stays empty: who plays beside you is the
   one thing this mode does not hand out any more. The offers start arriving the
   next morning instead (careerSeatDm), and the announcement is made when one of
   them is taken. */
function careerSeasonTurn(season){
  const cr=CAREER.career;
  if(cr.seasonTurn===season.id) return null;
  cr.seasonTurn=season.id;
  careerMetaStart(season.id);   // новый остров и пул: три дня разбора меты
  /* В командной карьере первое кресло — живой друг из лобби (careerPartnerCard
     отдаёт MP.peer), а бросок стыка читает запись бота из сейва — её там нет,
     и выходило 'none': каждый стык сезона писал «Расходимся с @друг» и звал
     искать напарника на занятое место (тестер, Notion «fncsdraft» 7.10:
     «команды сплитятся в начале сезона в 6 главе» — в 2025-м стыков четыре).
     Друг уходит только сам, из лобби; бросок ему не судья. */
  if(typeof ccMpTeam==='function' && ccMpTeam()){
    const peer=(typeof MP!=='undefined' && MP.peer) ? MP.peer : null;
    if(peer) careerNews('good', 'ccNewsDuoAgain', [ccSeasonTagOf(season), ccHandle(peer.handle)]);
    careerWorldDuos(season);
    careerSave();
    return {season:season.id, split:false, from:peer?peer.handle:null};
  }
  const mate=careerPartnerCard();
  const verdict=careerDuoHolds();
  let out={season:season.id, split:false, from:mate?mate.handle:null};
  if(mate && verdict.hold){
    careerNews('good', 'ccNewsDuoAgain', [ccSeasonTagOf(season), ccHandle(mate.handle)]);
  } else if(mate){
    careerMateDrop(mate.handle);
    careerMateLeftMark(mate.handle);
    careerNews('flat', verdict.why==='outgrown' ? 'ccNewsDuoOutgrown'
                    : verdict.why==='behind' ? 'ccNewsDuoBehind' : 'ccNewsDuoSplit',
               [ccHandle(mate.handle), season.id]);
    out.split=true; out.to=null;
    careerSeatDm('turn|'+season.id);
  } else {
    out.to=null;
    careerSeatDm('turn|'+season.id);
  }
  // And the rest of the scene does the same thing on the same day. Two real
  // pairs off the roster, announced the way the player announces theirs.
  careerWorldDuos(season);
  careerSave();
  return out;
}
// Who else announced a duo this week. Real cards, so the handles are real, and
// the pairs are the roster's own — careerRealDuos is the same list Division 1's
// weekly final is drawn from.
function careerWorldDuos(season){
  const rnd=careerRng(ccHashStr('duo|'+season.id));
  /* Not you, and not the person sitting next to you.

     The lobbies have always known this — careerCupField hands careerRealDuos a
     taken set with the career's own pair in it — and this one handed it nothing,
     so the feed could announce a duo built out of somebody who was already the
     player's partner. A tester's report, 18 August: his partner left, the roster
     pairing showed that partner with somebody else, and that somebody was in his
     own party at the time. One person, two duos, both said out loud.

     Only those two are held back. Whoever walked out is free to turn up with
     somebody new — that is the point of them leaving. */
  // The whole squad, not the first seat — otherwise a trio's second partner
  // announced a duo with somebody else while still sitting beside you.
  const mine=ccMyPeople();
  const pool=careerRealDuos(mine, rnd, 1).slice(0, 40);
  if(pool.length<2) return;
  /* And the scene announces the squad the season is played in.

     Two pairs said "playing with @X" all through a trio year, which is the whole
     scene contradicting the mode it is standing in. His report, 20 August. The
     third name comes off the back of the same queue the lobbies take theirs
     from — see careerCupField — and is spent, so the pair it came out of is not
     announced as a duo on the same day. */
  const per=careerSquadSize();
  const used=new Set();
  const third=()=>{
    for(let j=2; j<pool.length; j++){
      if(used.has(j)) continue;
      const c=pool[j] && pool[j].cards && pool[j].cards[0];
      if(!c) continue;
      used.add(j);
      return c;
    }
    return null;
  };
  for(let i=1; i>=0; i--){
    const d=pool[i];
    if(!d || d.cards.length<2) continue;
    used.add(i);
    const a=d.cards[0], b=d.cards[1];
    const names=[ccHandle(b.handle)];
    if(per>2){ const c=third(); if(c) names.push(ccHandle(c.handle)); }
    careerNews('flat', 'ccNewsDuoAnnounce', [ccSeasonTagOf(season), names.join(L().ccListAnd+'@')], {
      by:{name:a.handle, ovr:a._ovr,
          card:a.region?{handle:a.handle, region:a.region}:null}
    });
    // Слух сбылся — аккаунт слухов напоминает, что он это говорил (careerRumorTick).
    try{ ccRumorConfirm(a.handle, b.handle); }catch(e){}
  }
}

/* End of a career, two exits.
   May retire once growth turns negative on careerDevelopBase (age is read off the curve, so moving the curve moves retirement).
   Must retire when rating falls under CC_DIV_RATING[5], the creation rating and Division 5's band: there's no division below.
   Decided only at season boundaries. */
/* The last screen.

   Read out of the save rather than tallied along the way, so it cannot drift
   from the history tab sitting next to it. Nothing here is a rank or a grade:
   it is what happened, in the order a person would say it. */
function careerRetiredHTML(){
  const r=CAREER.retired, sm=careerSummary(), pl=CAREER.player;
  const row=(k,v)=>v==null||v==='' ? '' :
    `<div class="ch-row"><em>${k}</em><b>${v}</b></div>`;
  const money=n=>ccMoney(n||0);
  const honours=[
    sm.bestMajor!=null ? L().ccSumMajor(sm.bestMajor, sm.majorsPlayed) : null,
    // Düsseldorf and Antwerp, which a career flies to at most once a year and
    // which this screen did not mention at all until his report of 20 August.
    sm.bestGlobals!=null ? L().ccSumGlobals(sm.bestGlobals, sm.globalsPlayed) : null,
    sm.bestSummit!=null ? L().ccSumSummit(sm.bestSummit, sm.summitsPlayed) : null,
    sm.bestGclc!=null ? L().ccSumGclc(sm.bestGclc) : null,
    sm.bestWf!=null ? L().ccSumWf(sm.bestWf, sm.wfPlayed) : null,
    sm.paris!=null ? L().ccSumParis(sm.paris) : null,
    sm.seats ? L().ccSumSeats(sm.seats) : null,
    sm.orgs.length ? L().ccSumOrgs(sm.orgs.join(', ')) : null
  ].filter(Boolean);
  return `<div class="ch-grid ch-over"><div class="ch-tile cc-over">
    <div class="cc-over-h"><span class="cc-over-k">${L().ccRetiredKicker}</span>
      <b>${esc(pl.nick||'')}</b>
      <span>${L().ccRetiredSub(r.age, sm.seasons)}</span></div>
    <div class="cc-over-big"><b>${sm.peak}</b><em>${L().ccSumPeak}</em></div>
    ${row(L().ccSumTopDiv, L().ccDivision+' '+sm.topDiv)}
    ${row(L().evEvents, sm.events)}
    ${row(L().ccSumWins, sm.wins)}
    ${sm.pr ? row(L().ccPrTitle, L().ccSumPrRank(sm.pr.rank, sm.pr.of, ccNum(sm.pr.pr))) : ''}
    ${row(L().chEarnings, money(sm.earnings)+(sm.money ? ' · '+L().ccSumMoneyRank(sm.money.rank, sm.money.of) : ''))}
    ${row(L().chWages, money(sm.wages))}
    ${sm.streamed ? row(L().ccSumStreamed, money(sm.streamed)) : ''}
    ${sm.rent ? row(L().ccMoveRent, money(sm.rent)) : ''}
    ${sm.rep ? row(L().ccRep, L()[sm.repKey]+' '+(sm.rep>0?'+':'')+sm.rep) : ''}
    ${row(L().xFollowers, ccFollowers(sm.reach))}
    ${careerAwardsWon('month') ? row(L().ccAwardMonth, careerAwardsWon('month')) : ''}
    ${careerAwardsWon('season') ? row(L().ccAwardSeason, careerAwardsWon('season')) : ''}
    ${careerAwardsWon('cat') ? row(L().ccAwCatsH, careerAwardsWon('cat')) : ''}
    ${r.forced ? `<div class="cc-over-why">${r.why==='ban'
      ? esc(L().ccNewsBanned)
      : L().ccRetiredForcedWhy(careerRetireFloor())}</div>` : ''}
  </div>
  <div class="ch-tile"><h4>${L().ccSumHonours}</h4>
    ${honours.length ? honours.map(h=>`<div class="cc-hon">${h}</div>`).join('')
                    : `<div class="ch-empty">${L().ccSumNone}</div>`}
    <!-- And the nights themselves, season by season: a best-of line says how
         high a career reached and not what it did. See careerBigRuns. -->
    <h4 class="cc-board-h">${L().ccBoardTitle}</h4>
    ${(()=>{ const rows=careerBigRuns(null);
      return rows.length
        ? rows.map(r=>`<div class="ch-row"><em>${L().ccBoardSeason(r.season)} · ${
            esc(careerRunLabel(r))}</em><b>${L().ccBoardPlace(r.place, r.of)}</b></div>`).join('')
        : `<div class="ch-empty">${L().ccBoardNone}</div>`; })()}
    ${/* После карьеры — в тренеры (Notion 15.10: «when you end career I was ready to get a proposition to become a coach»).
         Дорога туда — режим менеджера клуба: свой состав, расписание, решения между играми. Дисквалифицированному не зовут. */
      careerBanned() ? '' : `<div class="cc-coach-offer"><b>${esc(L().ccRetCoachTitle)}</b><span>${esc(L().ccRetCoachSub)}</span>
      <button class="ch-play" onclick="careerToCoach()">${esc(L().ccRetCoachBtn)}</button></div>`}
    <div class="cc-over-act"><button class="ch-play" onclick="careerWipe()">${L().ccNewCareer}</button></div>
  </div></div>`;
}
function careerToCoach(){ try{ careerSave(); }catch(e){} show('screen-mode'); mgrStart(); }
/* Thirty, on the user's call, and it is the scene's own number rather than a
   curve's: FNCS is played by teenagers and won by them, and a competitor who
   is still in it at thirty has had a long career by this game's standards. It
   used to be read off careerDevelopBase — the age at which development turns
   negative, which is 37 — and that is a footballer's arc, not a Fortnite
   player's. May retire from thirty; must retire when the rating falls under
   the ladder's own floor, as before. */
const CC_RETIRE_AGE=30;
function careerRetireAge(){ return CC_RETIRE_AGE; }
function careerRetireFloor(){ return ccBand(5); }
function careerMayRetire(){
  const pl=CAREER && CAREER.player;
  return !!pl && ccPlayerAge()>=careerRetireAge();
}
function careerMustRetire(){
  const pl=CAREER && CAREER.player;
  if(!pl) return false;
  const ovr=pl.ovrExact!=null?pl.ovrExact:pl.ovr;
  return ovr<careerRetireFloor();
}
function careerRetired(){ return !!(CAREER && CAREER.retired); }
function careerBanned(){ return !!(CAREER && CAREER.retired && CAREER.retired.why==='ban'); }
// Starting over. The save is one career, so a new one replaces it — asked for
// out loud rather than done quietly, because it throws away everything the
// screen behind the question is showing.
function careerWipe(){
  ccAsk(L().ccNewCareerAsk, ()=>{
    // Свой слот, а не всегда первый: «Новая карьера» на итоге карьеры из слота 3 стирала карьеру слота 1.
    ccSlotWipe(ccSlotMine());
    CAREER=null;
    show('screen-career-create');
  });
}
/* why — за что карьера кончилась не по своей воле: 'ban' у читов, пусто у
   пола рейтинга. Скриншот: забаненный Sky на 96 рейтинга читал на
   своём экране «Рейтинг упал ниже 54» — единственный forced-текст был про пол,
   и бан донашивал его. */
function careerRetire(forced, why){
  if(!CAREER || CAREER.retired) return;
  const cr=CAREER.career, pl=CAREER.player;
  CAREER.retired={day:careerToday(), season:cr.season, age:ccPlayerAge(),
                  ovr:pl.ovr, forced:!!forced, why:why||null};
  // У бана своя новость (ccNewsBanned, её пишет сам читовый шаг) — строка про
  // упавший рейтинг рядом с ней была бы второй неправдой подряд.
  if(why!=='ban') careerNews('flat', forced?'ccNewsRetiredForced':'ccNewsRetired', [ccPlayerAge(), cr.season]);
  careerEvent('tlRetired', [ccPlayerAge(), cr.season]);
  careerSave();
  careerRenderHub('centre');
}

/* ---- The big nights, said out loud -----------------------------------------

   His report, 20 August: at the end of a season and at the end of a career the
   places at the Grand Finals and the LANs are not shown anywhere. They were in
   the log the whole time — every runner writes its row — and nothing read them
   back: the season ended on a card that said "season over" and a button, and the
   retirement screen named a best Major and a best Weekly Final and stopped.

   These are the five rooms a career is remembered for. A divisional cup is not
   here and neither is a Victory Cup: they happen every week, they are in the
   history tab, and a list that holds everything says nothing. */
const CC_BIG_RUNS=[
  {kind:'major',   stage:'final', key:'ccRunMajor'},
  {kind:'summit',  stage:'final', key:'ccRunSummit',  lan:'summit'},
  {kind:'gclc',    stage:'final', key:'ccRunGclc'},
  {kind:'rc',      stage:'final', key:'ccRunRc',      lan:'rc'},
  {kind:'globals', stage:null,    key:'ccRunGlobals', lan:'globals'}
];
function ccBigRunOf(row){
  return CC_BIG_RUNS.find(x=>x.kind===row.kind &&
    (!x.stage || x.stage===(row.stage||'final'))) || null;
}
// Every one of them a season held, in the order they were played.
function careerBigRuns(season){
  return (CAREER.career.log||[])
    .filter(r=>r.place && (season==null || r.season===season) && ccBigRunOf(r));
}
// What to call one. The LANs name the city they were in that season, which is
// not the city they are in this one — see ccLanFixed.
function careerRunLabel(row){
  const m=ccBigRunOf(row);
  if(!m) return '';
  const line=L()[m.key];
  return m.lan ? line(ccLanCity(m.lan, row.season)) : line;
}
/* The season's own, on the card that says the season is over.

   It sits where the shop tile sits during the year, because the shop is shut at
   the boundary and this is the one screen a player looks at before pressing on
   to the next season. */
/* ЦЕРЕМОНИЯ ИГРОКА ГОДА — плитка на экране конца сезона.

   Идея игрока: «чтоб в конце главы выбирали лучшего игрока за
   год, типо как в футболе золотой мяч». Награда в моде была (careerAwardSeason,
   считается по очкам PR за год), но жила одной строкой в ленте и счётчиком в
   трофеях — то есть церемонии не было вовсе.

   Здесь она и есть: победитель крупно, под ним четверо, кто был рядом, с
   очками года и числом сыгранных вечеров. Своя строка подсвечена — ради неё
   всё и читают. Пятёрка берётся из самой награды; у наград, записанных до
   этой правки, её нет — тогда таблица считается заново по тому же году. */
