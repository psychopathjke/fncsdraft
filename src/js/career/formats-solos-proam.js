/*@@PART js/career/formats-solos-proam.js@@*/
/* КАП ИГРАЕТСЯ В СВОЁМ ФОРМАТЕ.

   Скрин: июль 2019-го (этап дуо), в календаре Trios Cash Cup — а вечер шёл парой, с
   плашкой «DUOS». Кап прошлых лет знает свой формат (mode), и играется им: трио-кап —
   трио-составом (CAREER.rosters[3]), дуо-кап — дуо-составом. Где в составе этого формата
   не хватает людей, на вечер берутся стэнд-ины — ближайшие по рейтингу свободные игроки
   сцены своего региона, как в жизни берут филла на кап. После вечера всё как было.
   2026-й живёт по своему правилу (Victory Cup — составом сезона), его не трогаем. */
function ccVictoryFormat(ev){
  // Свой турнир — всегда в выбранном режиме, в любой год.
  if(ev && ev.own) return ({solo:1, duo:2, trio:3, squad:4})[ev.mode]||0;
  if(!ev) return 0;
  // 2026: капы играются составом сезона, кроме тех, где формат задан самим турниром (Squads Victory Cup S43).
  if(ccCalYear()>=2026 && !ev.fmt) return 0;
  return ({solo:1, duo:2, trio:3, squad:4})[ev.mode]||0;
}
/* Формат капа, не снятый брошенным вечером (errlog 15.11, пара в команде 2022): раннер трио-капа завис на ожидании,
   finally с ccEventRosterEnd не наступил, и до перезагрузки вкладки все капы у одного шли тройкой с филлом, у другого парой.
   Живой формат помнится здесь; новый вечер (careerPlayRun0) и abandonRun снимают его сами, поздний finally уже ничего не трогает. */
let CC_FMT_SWAP_LIVE=null;
function ccFmtSwapLeak(){
  const sw=CC_FMT_SWAP_LIVE; if(!sw) return;
  try{ console.warn('event format left by an abandoned night, size', CC_EVENT_SIZE, '->', sw.was); }catch(e){}
  ccEventRosterEnd(sw);
}
function ccEventRosterBegin(fmt, picks){
  const sw=ccEventRosterBegin0(fmt, picks);
  if(sw) CC_FMT_SWAP_LIVE=sw;
  return sw;
}
function ccEventRosterBegin0(fmt, picks){
  CC_MP_FMT_WHY='';
  if(!fmt || fmt===1 || !CAREER) return null;
  if(CC_EVENT_SIZE){ CC_MP_FMT_WHY='held'+CC_EVENT_SIZE; return null; }
  if(typeof ccMpOn==='function' && ccMpOn()) return ccMpFmtBegin(fmt);
  if(typeof ccRacePairOn==='function' && ccRacePairOn()) return null;
  const base=careerSquadSize();
  const picked=(picks||[]).filter(Boolean);
  if(fmt===base && !picked.length) return null;
  const prev=(CAREER.partners||[]).slice();
  const taken=new Set([hKey(CAREER.player.handle||CAREER.player.nick||'')]);
  // Свой турнир: тиммейты, которых выбрал игрок, — со сцены своего региона, на этот вечер.
  let own;
  if(picked.length){
    const scene=ccSceneRoster(ccCareerRegion());
    own=picked.map(h=>scene.find(x=>x && hKey(x)===hKey(h))).filter(Boolean).slice(0, fmt-1)
      .map(c=>({card:{...c}, patience:60, since:careerToday(), dev:0, standin:true, picked:true}));
  } else own=ccFmtRoster(fmt);
  own.forEach(r=>{ const c=ccMateCardOf(r); if(c) taken.add(hKey(c)); });
  // Люди гонки и их напарники стэнд-инами не выходят: в общей комнате они стоят своими командами.
  if(typeof ccRaceOn==='function' && ccRaceOn()) ccRaceTakenKeys().forEach(k=>taken.add(k));
  const need=fmt-1-own.length, stand=[];
  if(need>0){
    const me=(CAREER.player && CAREER.player.ovr)||80;
    /* В гонке стэнд-инов берут все разом, и строки соседей ещё не пришли: двое взяли бы одного.
       Пул делится между людьми комнаты по хешу ника — у каждого своя доля, пересечься нечему. */
    let part=null;
    if(typeof ccRaceOn==='function' && ccRaceOn()){ try{
      const ids=[ccMpId()].concat(ccRaceRoom().map(p=>p.id)).filter(Boolean).sort();
      if(ids.length>1) part={n:ids.length, i:ids.indexOf(ccMpId())};
    }catch(e){ part=null; } }
    const pool=ccSceneRoster(ccCareerRegion()).filter(c=>!taken.has(hKey(c)) && (!part || ccHashStr(hKey(c))%part.n===part.i))
      .sort((a,b)=>Math.abs(ccCardOvr(a)-me)-Math.abs(ccCardOvr(b)-me));
    for(let i=0;i<need && i<pool.length;i++) stand.push({card:{...pool[i]}, patience:60, since:careerToday(), dev:0, standin:true});
  }
  CAREER.partners=own.concat(stand);
  const was=CC_EVENT_SIZE; CC_EVENT_SIZE=fmt;
  if(stand.length) careerNews('flat', 'lfNewsStandin', [stand.map(r=>r.card.handle).join(', ')]);
  return {prev, was};
}
/* КАП ДРУГОГО ФОРМАТА В КОМАНДЕ (Notion 21.10, двое играли командой: «когда начался трио турнир, нельзя добавить
   трио игрока при игре в онлайне», и Trios Cash Cup прошёл парами у всего лобби). Раньше команда играла такой кап
   в формате года. Теперь — в своём: двое живых плюс филлы на вечер, как в одиночной (стэнд-ины), но выбранные так,
   чтобы у обоих вышли одни и те же люди: тот же пул сцены, заняты оба живых и общие взятые, близость к среднему
   рейтингу двоих (огрублённому до двух, чтобы десятые не развели), равные — по нику. Общий состав не трогается. */
/* Выключено, пока поле не сходится у двоих: онлайн-прогон 2019 (22.10) — Trios Cash Cup 14.07 всё ещё 25 строк из 1593
   (свободные сводятся в пары по-разному). Разошедшийся вечер хуже, чем кап парами, как было. */
const CC_MP_FMT_ON=true;
let CC_MP_FMT_WHY='';   // почему добор другого формата не включился: едет в отпечатке поля
function ccMpFmtBegin(fmt){
  CC_MP_FMT_WHY='';
  if(!CC_MP_FMT_ON) return null;
  if(typeof ccRaceOn==='function' && ccRaceOn()) return null;
  /* Только кап КРУПНЕЕ состава года (трио/сквад в дуо-год) — о нём просили. Дуо-кап в трио-год онлайн по-прежнему
     играется составом года: своим форматом он разводил сгенерированные дуо лестницы (онлайн-прогон 2022, 22.10). */
  if(fmt<=careerSquadSize()) return null;
  /* Без карточки напарника - по запомненному нику (ccMpPeerHandle): добору нужен только ник, рейтинг берётся со сцены.
     Прод 18.11b: трио-кап у одного тройкой с филлом, у другого парой (у него карточка ещё не пришла). */
  const peerH=(typeof ccMpPeerHandle==='function') ? ccMpPeerHandle() : ((typeof MP!=='undefined' && MP.peer) ? MP.peer.handle : null);
  if(!peerH){ CC_MP_FMT_WHY='nopeer'; return null; }
  const PEER_C=(typeof MP!=='undefined' && MP.peer) || {handle:peerH};
  const cr=CAREER.career, need=fmt-CC_MP_HUMANS;
  if(need<0) return null;
  const shared=(Array.isArray(cr.mates) ? cr.mates : []).filter(Boolean).slice(0, need);
  const me=careerCard(), taken=new Set([hKey(me||CAREER.player.handle||CAREER.player.nick||''), hKey(PEER_C)]);
  shared.forEach(r=>{ const c=ccMateCardOf(r); if(c) taken.add(hKey(c)); });
  const ovr=c=>{ try{ return (attrsFor(c)||{}).ovr || c.rating || 80; }catch(e){ return 80; } };
  /* Средний рейтинг двоих — из сцены (она у обоих одна), а не из карточек: добор идёт до ворот вечера, своя
     карточка у каждого свежая, а напарника — с прошлой отправки. 99 и 98 против 99 и 99 давали цель 98 и 100,
     и третьим у одного выходил JOE (98), у другого Kami (99): онлайн-прогон 2022, 22.10, Trios Quick Cash Cup 26.08. */
  const scene=ccSceneRoster(ccCareerRegion());
  const sceneOvr=h=>{ const k=hKey(h), c=scene.find(x=>x && hKey(x)===k); return c ? ccCardOvr(c) : 80; };
  const target=Math.round((sceneOvr(me||CAREER.player.handle||CAREER.player.nick||'')+sceneOvr(PEER_C))/4)*2;
  const stand=[];
  /* ВЫБРАННЫЕ ОБОИМИ — ПЕРВЫМИ (его «а выбрать игрока я могу?», 22.10): cr.fmtPick[fmt] — ники, на которых оба сказали
     «да» (ccMpFmtPickAsk → 'fmtpick'/'fmtpick-ok'), ключ команды. Карточка — из сцены (у обоих одна), филл — на остаток. */
  ((cr.fmtPick||{})[fmt]||[]).forEach(h=>{ if(stand.length>=need-shared.length) return; const k=hKey(h); if(!h || taken.has(k)) return;
    const c=scene.find(x=>x && hKey(x)===k); if(!c) return; taken.add(k);
    stand.push({card:{...c}, patience:60, since:careerToday(), dev:0, standin:true, picked:true}); });
  let fpPool='';
  if(need>shared.length+stand.length){
    const pool=scene.filter(c=>c && c.handle && !taken.has(hKey(c)))
      .sort((a,b)=>Math.abs(ccCardOvr(a)-target)-Math.abs(ccCardOvr(b)-target) || (hKey(a)<hKey(b) ? -1 : hKey(a)>hKey(b) ? 1 : 0));
    for(let i=0;stand.length<need-shared.length && i<pool.length;i++) stand.push({card:{...pool[i]}, patience:60, since:careerToday(), dev:0, standin:true});
    try{ fpPool=' tg'+target+' me'+(me ? ovr(me) : '-')+' pe'+ovr(PEER_C)+' top '+pool.slice(0, 5).map(c=>c.handle+':'+ccCardOvr(c)+':'+careerDevOf(c)).join(',')+' dev '+ccHashStr(JSON.stringify(CAREER.dev||{}))+' tag '+CC_NOW_TAG; }catch(e){}
  }
  CC_MP_FMT_MATES=shared.concat(stand); CC_MP_FMT_PICKS=0;
  // Отпечаток памяти троек и пула на входе — в журнал вечера: расхождение видно у обоих рядом.
  try{ CC_MP_FMT_FP='f'+fmt+' trios '+ccHashStr(JSON.stringify(cr.trios||{}))+'/'+Object.keys(cr.trios||{}).length+' seeded '+String(cr.triosSeeded||'-').slice(0,16)+' pools '+(CC_POOLS ? CC_POOLS.tag : '-')+' fill '+stand.map(r=>r.card.handle).join('+')+fpPool; }catch(e){}
  const was=CC_EVENT_SIZE; CC_EVENT_SIZE=fmt;
  /* Пул под размер вечера собирается ЗДЕСЬ, у обоих в одной точке (онлайн-прогон 2019 года, 22.10). Собранный лениво
     посреди вечера, он засевал третьих у двоих в разное время: Trios Cash Cup 14.07 расходился на 19…1327 строк поля
     из 1593. С этой сборкой — 0. */
  /* И рейтинги всех карт пула считаются здесь же (ccCardOvr кэширует карту сцены лениво): прогон с этим прогревом
     зелёный, без него — 12 строк поля из 1593 (третьи mitr0+oslo — robabz у одного, kinstaar у другого). */
  try{
    const p=careerPools();
    const sig=(p.duos||[]).map(d=>(d.cards||[]).map(c=>hKey(c)+':'+ccCardOvr(c)).join('+')+(d.third ? '/'+d.third : '')).join(',');
    const pl=(p.players||[]).map(c=>hKey(c)+':'+ccCardOvr(c)).join(',');
    CC_MP_FMT_FP+=' · pool '+(p.duos||[]).length+'/'+ccHashStr(sig)+' pl '+(p.players||[]).length+'/'+ccHashStr(pl)+' trios '+Object.keys(cr.trios||{}).length+'/'+ccHashStr(JSON.stringify(cr.trios||{}));
  }catch(e){ CC_MP_FMT_FP+=' · pool ERR '+String(e).slice(0,60); }
  if(stand.length) careerNews('flat', 'lfNewsStandin', [stand.map(r=>r.card.handle).join(', ')]);
  return {mp:true, was};
}
function ccEventRosterEnd(sw){
  if(!sw || sw.done) return;
  sw.done=true;
  if(CC_FMT_SWAP_LIVE===sw) CC_FMT_SWAP_LIVE=null;
  if(sw.mp){ CC_MP_FMT_MATES=null; CC_MP_FMT_FP=''; CC_EVENT_SIZE=sw.was; careerSave(); return; }
  CC_EVENT_SIZE=sw.was;
  CAREER.partners=sw.prev;
  careerSave();
}
/* СОСТАВ НА БЛИЖАЙШИЙ КАП ДРУГОГО ФОРМАТА — ЗАРАНЕЕ (его слово 29.09: «когда ближайшие турниры в других
   режимах, пусть окошечко высвечивается, где будет состав, чтоб игрок не забыл»). Семь дней вперёд:
   кап, на который зовут, в формате не своего года, и в составе этого формата не хватает людей —
   плашка в Центре с составом и кнопкой «Собрать состав» (то же окно, что перед вечером). */
// EWC 2024, Dallas и отборы — 4 на 4: состав сквада, в каком бы формате ни был год.
function ccPickFormat(ev){ return ev && ev.ewc24 ? 4 : ccVictoryFormat(ev); }
function ccRosterSoon(){
  if(!CAREER || !CAREER.career || CC_EVENT_SIZE) return null;
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRacePairOn==='function' && ccRacePairOn())) return null;
  const base=careerSquadSize(), today=careerToday();
  for(let k=0; k<=7; k++){
    const day=ccAddDays(today, k);
    const ev=careerVictoryOn(day);
    if(!ev || ((ev.invite || ev.ewc24) && !ccVictoryInvited(ev))) continue;
    const fmt=ccPickFormat(ev);
    if(!fmt || fmt===1 || fmt===base) continue;
    const own=ccFmtRoster(fmt);
    if(own.length>=fmt-1) continue;
    return {ev, day, k, fmt, own};
  }
  return null;
}
function ccRosterSoonHTML(){
  const r=ccRosterSoon(); if(!r) return '';
  const T=L();
  const names=[CAREER.player.nick||CAREER.player.handle||T.ewc24You2].concat(r.own.map(x=>(ccMateCardOf(x)||{}).handle).filter(Boolean));
  return '<div class="ch-tile cc-soon"><div class="cc-soon-h">'+esc(T.rsSoonH(r.k, ccDayLabel(r.day)))+'</div>'+
    '<b>'+esc(r.ev.name)+' · '+esc(T.rsFmt(r.fmt))+'</b>'+
    '<div class="cc-soon-line">'+esc(T.rsHave(names.join(', '), names.length, r.fmt))+'</div>'+
    '<button class="btn-primary cc-soon-go" onclick="ccRosterSoonOpen()">'+esc(T.rsGo(r.fmt-names.length))+'</button></div>';
}
function ccRosterSoonOpen(){
  const r=ccRosterSoon(); if(!r) return;
  ccDuoFindOpen(null, r.fmt);
}
/* СОСТАВ НА КАП ДРУГОГО ФОРМАТА — ЧЕРЕЗ ЛИЧКУ (его слова 29.09: «рандомными игроками», «сразу выбирается,
   нет переговоров в лс», «чтоб турнир случайно не сыграл, потому что тиммейта нет»). Перед вечером с
   неполным составом — окно: «Написать игрокам» (вечер не начинается, открывается поиск с личкой для
   этого формата, см. ccDuoFindOpen(fmt)) или «Стэнд-ины на вечер» (добор ccEventRosterBegin, в состав
   не пишется). Ниже — прежнее описание.

   СОСТАВ НА КАП ДРУГОГО ФОРМАТА — ВЫБИРАЕТ ИГРОК.

   Его слово 29.09: «squad victory cash cup играется рандомными игроками, я их не выбирал».
   Добор шёл молча (ccEventRosterBegin: ближайшие по рейтингу со сцены). Теперь, если в составе
   этого формата не хватает людей, перед вечером — окно: свои уже стоят, из двенадцати свободных
   ближайших по рейтингу игрок отмечает недостающих. Выбранные записываются в CAREER.rosters[fmt] —
   следующий кап того же формата играется ими без вопроса. «Подобрать за меня» и тишина 30 с —
   прежний добор. Командная карьера, гонка и перемотка не спрашивают. */
// Тишина не собирает состав за игрока (его слово 29.09: «чтоб турнир случайно не сыграл, потому что тиммейта нет»);
// десять минут — только чтобы вечер без человека (пробы, забытая вкладка) не висел вечно.
const CC_EV_PICK_MS=600000;
/* Состав другого формата — свой: напарников года в нём нет и по умолчанию они туда не копируются
   (дуо на EWC и трио на FNCS — разные люди, один человек в двух составах не стоит). */
/* Трио-кап в дуо-год — «дуо +1»: напарники года встают в состав большего формата сами, добирать остаётся
   недостающих. Записанный состав формата идёт первым; полный — напарников не добавляет. В меньший формат
   (дуо-кап в трио-год) напарник года сам не встаёт, но выбрать его можно (ccEventRosterPick). */
function ccFmtRoster(f){
  if(!CAREER) return [];
  const year=(CAREER.partners||[]).filter(Boolean);
  if(!f || f===careerSquadSize()) return year;
  const seen=new Set(), out=[];
  const add=r=>{ const c=r && ccMateCardOf(r), k=c ? hKey(c.handle) : '';
    if(k && !seen.has(k) && out.length<f-1){ seen.add(k); out.push(r); } };
  (((CAREER.rosters||{})[f])||[]).forEach(add);
  if(f>careerSquadSize()) year.forEach(add);
  return out;
}
function ccEventRosterPick(ev, fmt){
  if(!fmt || fmt===1 || !CAREER || CC_EVENT_SIZE) return Promise.resolve('go');
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRacePairOn==='function' && ccRacePairOn())) return Promise.resolve('go');
  if((typeof CC_FF!=='undefined' && CC_FF) || CC_SKIP_ALL) return Promise.resolve('go');
  const base=careerSquadSize();
  if(fmt===base) return Promise.resolve('go');
  const own=ccFmtRoster(fmt);
  const need=fmt-1-own.length;
  /* Полный состав формата — всё равно спросить, раз на это событие (его слово 29.09: «Winter Royale
     после сквад-FNCS, и мне не дали выбрать, с кем идти»). Дуо-состав оставался с лета (ccRosterSwap
     откладывает его при смене размера года), и вечер молча садил туда того, с кем играл в июле.
     Спрашиваем один раз на событие (cr.evPicked по id), дальше — выбранный состав. */
  const cr=CAREER.career, evKey=String((ev && (ev.id || ev.name)) || '')+'|'+(cr.season||0);
  if(need<=0 && (cr.evPicked||{})[evKey]) return Promise.resolve('go');
  const T=L();
  const hOf=r=>(ccMateCardOf(r)||{}).handle||'';
  const names=[CAREER.player.nick||CAREER.player.handle||''].concat(own.map(hOf).filter(Boolean));
  // Кого можно взять кнопкой: уже стоящие в составе формата и свободные со сцены региона, ближайшие по рейтингу.
  // Напарники года — тоже в списке, сразу за составом формата («трио — это дуо +1»).
  const pool=[];
  own.concat((CAREER.partners||[]).filter(Boolean)).forEach(r=>{ const h=hOf(r); if(h && !pool.some(p=>hKey(p.h)===hKey(h))) pool.push({r, h, ovr:(ccMateCardOf(r)||{}).rating||0}); });
  { const busy=new Set([hKey(CAREER.player.handle||CAREER.player.nick||'')].concat((CAREER.partners||[]).map(hOf).filter(Boolean).map(hKey)));
    const me=CAREER.player.ovr||80;
    ccSceneRoster(ccCareerRegion()).filter(c=>c && c.handle && !busy.has(hKey(c)) && !pool.some(p=>hKey(p.h)===hKey(c.handle)))
      .sort((a,b)=>Math.abs(ccCardOvr(a)-me)-Math.abs(ccCardOvr(b)-me)).slice(0, 12)
      .forEach(c=>pool.push({r:{card:{...c}, patience:CAREER_PATIENCE_START, since:careerToday()}, h:c.handle, ovr:ccCardOvr(c)})); }
  const inOwn=h=>own.some(r=>hKey(hOf(r))===hKey(h));
  return new Promise(done=>{
    const box=document.createElement('div');
    box.className='cc-evpick-wrap';
    const picks=pool.length ? '<div class="cc-evpick-list">'+pool.map((p, i)=>
      '<button class="cc-evpick-p'+(inOwn(p.h) ? ' on' : '')+'" data-i="'+i+'"><b>'+esc(p.h)+'</b>'+(inOwn(p.h) ? '<span>'+esc(T.evPickHave)+'</span>' : '')+'<i>'+esc(String(p.ovr))+'</i></button>').join('')+'</div>' : '';
    box.innerHTML='<div class="cc-evpick"><h4>'+esc(need>0 ? T.evPickH(ev && ev.name || '', need) : T.evPickWho(ev && ev.name || ''))+'</h4>'+
      '<div class="cc-soon-line">'+esc(T.rsHave(names.join(', '), names.length, fmt))+'</div>'+
      '<p>'+esc(need>0 ? T.evPickSub : T.evPickSub2(fmt-1))+'</p>'+ picks +
      '<div class="cc-evpick-act">'+(need>0
        ? '<button class="cc-evpick-auto cc-choice-btn" data-k="go">'+esc(T.evPickAuto)+'</button>'
        : '<button class="cc-evpick-go cc-evpick-play cc-choice-btn" data-k="go">'+esc(T.evPickPlay(own.map(hOf).join(', ')))+'</button>')+
      '<button class="'+(need>0 ? 'cc-evpick-go' : 'cc-evpick-alt')+'" data-k="find">'+esc(T.evPickFind)+'</button></div></div>';
    let over=false;
    const end=k=>{ if(over) return; over=true; box.remove();
      if(k==='go'){ cr.evPicked=cr.evPicked||{}; cr.evPicked[evKey]=1; careerSave(); }
      done(k); };
    box.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>end(b.dataset.k));
    // Нажал на человека — он встаёт в состав формата первым, лишние сверху выпадают.
    box.querySelectorAll('.cc-evpick-p').forEach(b=>b.onclick=()=>{
      const p=pool[+b.dataset.i]; if(!p) return;
      if(!CAREER.rosters) CAREER.rosters={};
      const rest=own.filter(r=>hKey(hOf(r))!==hKey(p.h));
      CAREER.rosters[fmt]=[p.r].concat(rest).slice(0, fmt-1);
      careerSave();
      if(fmt-1-CAREER.rosters[fmt].length<=0) end('go');
      else { over=true; box.remove(); ccEventRosterPick(ev, fmt).then(done); }
    });
    document.body.appendChild(box);
    setTimeout(()=>end('go'), CC_EV_PICK_MS);
  });
}
const EWC24={"groups":{"A":["Team Falcons","XSET","ZETA DIVISION","DRAGONS eSports"],"B":["Exceed","Gaimin Gladiators","Al Ula","PWR"],"C":["Karmine Corp","FNATIC","R8 Esports","KS7"],"D":["HEROIC","BIG","Dignitas","w7m esports"]},"teams":[{"n":"XSET","r":"NAC","g":"A","p":["Muz","Edgey","Ritual","Cold"],"via":["qual","NAC",0]},{"n":"Team Falcons","r":"EU","g":"A","p":["TaySon","Chico","Japko","t3eny"],"via":["dallas",1]},{"n":"ZETA DIVISION","r":"ASIA (JP)","g":"A","p":["Minipiyo","Zagou","Koyota","Yuma"],"via":["qual","ASIA",0]},{"n":"DRAGONS eSports","r":"BR/LATAM","g":"A","p":["Randu","Itrol","Lewa","Romero"],"via":["qual","BR",0]},{"n":"Exceed","r":"NAC","g":"B","p":["Peterbot","Kwanti","Meelks","Okis"],"via":["dallas",2]},{"n":"Gaimin Gladiators","r":"EU","g":"B","p":["Howly","NeFrizi","S1neD","Vanyak3kk"],"via":["qual","EU",0]},{"n":"Al Ula","r":"ME","g":"B","p":["Adapter","FHD","Hero","Mansour"],"via":["qual","ME",0]},{"n":"PWR","r":"OCE","g":"B","p":["alex","looter","worthy","volx"],"via":["qual","OCE",0]},{"n":"Karmine Corp","r":"EU","g":"C","p":["Malibuca","Merstach","SwizzY","Anas"],"via":["dallas",3]},{"n":"FNATIC","r":"NAC","g":"C","p":["Ajerss","CizLucky","nounzy","Xccept"],"via":["dallas",5]},{"n":"R8 Esports","r":"EU","g":"C","p":["Voxe","Bloomy","xsweeze","Vortexers"],"via":["qual","EU",1]},{"n":"KS7","r":"ME","g":"C","p":["Kalgamer","k0ty","Kyry","Salvatore"],"via":["qual","ME",1]},{"n":"HEROIC","r":"EU","g":"D","p":["Th0masHD","Fredoxie","Hellfire","Kiro"],"via":["dallas",4]},{"n":"BIG","r":"EU","g":"D","p":["kiduoo","Trexer","Fray","cheetiin"],"via":["dallas",6]},{"n":"Dignitas","r":"NAC","g":"D","p":["Acorn","Pilky","Tkay","Khanada"],"via":["qual","NAC",1]},{"n":"w7m esports","r":"BR/LATAM","g":"D","p":["Frosty","Phzin","Seeyun","Kurtz"],"via":["qual","BR",1]}],"maps":{"Capture the Flag":["Chalet","Panther"],"Hardpoint":["Panther","Chalet"],"Keeper":["Taverna Zoni"]},"pay":[[1,400000],[2,160000],[4,80000],[8,40000],[12,20000],[16,10000]],"mvp":50000,"dallas":{"teams":[{"n":"Team Falcons","p":["TaySon","Chico","Japko","t3eny"],"s":1},{"n":"Agent Gaming","p":["Peterbot","Kwanti","Meelks","Okis"],"s":2},{"n":"Karmine Corp","p":["Malibuca","Merstach","veno","Anas"],"s":3},{"n":"HEROIC","p":["Th0masHD","Fredoxie","Hellfire","Kiro"],"s":4},{"n":"FNATIC","p":["Ajerss","CizLucky","nounzy","Xccept"],"s":5},{"n":"BIG","p":["kiduoo","Trexer","Fray","Cheatiin"],"s":6},{"n":"Manchester City Esports","p":["trippernn","Cold","Setty","Threats"],"s":7},{"n":"XSET","p":["Edgey","Muz","Ritual","Trashy"],"s":8},{"n":"Twisted Minds","p":["Dela","Pinq","Queasy","zAndy"],"s":9},{"n":"Ninjas In Pyjamas","p":["Refsgaard","Axeforce","Pixie","QB"],"s":10},{"n":"Stride Esports","p":["DeRoller","Crackly","miyu","npen"],"s":11},{"n":"Dignitas","p":["Khanada","Acorn","Reet","Tkay"],"s":12},{"n":"Gaimin Gladiators","p":["Bloomy","Moneymaker","Robban","Fnajen"],"s":13},{"n":"Degen","p":["Degen","Dukez","Pilky","Tavern"],"s":14},{"n":"Capybaras","p":["Lame","Cooper","Glubschi","Kylie"],"s":16},{"n":"unknown","p":["Floki","Leo the crack","Voxe","Werex"],"s":30},{"n":"Xen","p":["FoxMan","Bhronos","OliverOG","Trey"],"s":30},{"n":"Bush Bandits","p":["RottenTwinkies","Clasher","Jack","Sommerset"],"s":30},{"n":"T1","p":["Michael.","SAKI","SinOoh","Zerokun"],"s":30},{"n":"Guild Esports","p":["PabloWingu","Mappi","MariusCOW","Sangild"],"s":30},{"n":"Fractious Esports","p":["Blazer","Khaorz","Rabbit","Gordete"],"s":30},{"n":"Team Heretics","p":["Nakoo","Krizzii","Nebs","Vortexers"],"s":30},{"n":"PWR","p":["worthy","Looter","alex","volx"],"s":30},{"n":"Team Elite","p":["Pfluger","Moo","Tacts","Vexy"],"s":30},{"n":"LateArrival","p":["AdcSosa","Kronic11","Prizma","Wrxyth"],"s":30},{"n":"Underdogs","p":["Kadvn","Macyfishy","Pierson","Tez"],"s":30},{"n":"Mixed up one","p":["LocalT1nCan","Quantize","Sprays","Swinger"],"s":30},{"n":"FN enthusiast","p":["Kirbty","Bacon","nurface","Origin"],"s":30},{"n":"ZETA DIVISION","p":["Minipiyo","Zagou","Koyota","Yuma"],"s":30},{"n":"Outlaws","p":["Ceice","Blake","Laiys","pxmp"],"s":30},{"n":"Aura Maxers","p":["Drecept","Evagas","Jezejearim","slayt"],"s":30},{"n":"Team BECK","p":["Clement","BlastR","egrm","Kyzen"],"s":30},{"n":"SPRS","p":["Pandy","rafiki","Salt","SM1LY"],"s":30},{"n":"A-Tate","p":["Arid","Arrows","Kelz","Sweep"],"s":30},{"n":"Uprise Region","p":["Deeploy","JB3","Mills","sxzl"],"s":30},{"n":"Team Airbourn","p":["Co1azo","Repairs","Tristen","Tundra"],"s":30},{"n":"BBE","p":["Driven","Logan6x","Ponder","Skayter"],"s":30}],"alias":{"Agent Gaming":"Exceed"},"pay":[[1,100000],[2,44000],[3,28000],[4,18000],[6,10000],[8,6000],[16,3500]],"tickets":6},"quals":{"EU":{"teams":[{"n":"Gaimin Gladiators","p":["Howly","NeFrizi","S1neD","Vanyak3kk"]},{"n":"R8 Esports","p":["Voxe","Bloomy","xsweeze","Vortexers"]},{"n":"Twisted Minds","p":["Dela","Queasy","zAndy","Anas"]},{"n":"Ninjas In Pyjamas","p":["Refsgaard","Axeforce","Pixie","QB"]},{"n":"Team ammbrat","p":["ammbrat","Upl","Shura","Dandepuzo"]},{"n":"Guild Esports","p":["PabloWingu","Mappi","1lusha","Wheat"]},{"n":"Team DaanFN","p":["DaaN","Deckzee","Nakoo","Kantri"]},{"n":"Team Heretics","p":["IDrop","Krizzii","Nebs","Flickzy"]},{"n":"Team SlyFloki","p":["Floki","Andilex","BadSniper","Snayzy"]},{"n":"Team Art1st1kk","p":["Art1st","Karmy","paralizator","Toose"]},{"n":"Team G13ras","p":["G13ras","charyy","Kombek","Purchawa"]},{"n":"Team REZHEXX","p":["Rezhexx","boltye","Moneymaker","rudolph"]},{"n":"Team romix566","p":["romix56","rela1zz","keglya","warthy"]},{"n":"Team -gudn","p":["Gudn","Fnajen","Robban","Wox"]},{"n":"Team kxrv1nho","p":["kxrv","97default","Fury Legendary","Kiryache32"]},{"n":"Team Artembat9","p":["Artem","Eltensy","panzer","Rotory"]}],"slots":2},"NAC":{"teams":[{"n":"XSET","p":["Muz","Edgey","Ritual","Cold"]},{"n":"Dignitas","p":["Acorn","Pilky","Tkay","Khanada"]},{"n":"Stride Esports","p":["Crackly","DeRoller","miyu","Avivv"]},{"n":"Capybaras","p":["Cooper","Lame","Kylie","Reet"]},{"n":"Elite Esports","p":["Pfluger","Moo","Tacts","Vexy"]},{"n":"Team Cawsmiic","p":["Cawsmiic","ChaosGamingLive","Origin","Marrok"]},{"n":"Team munoz1x","p":["munoz","Laiys","Sycho","khor"]},{"n":"Team zenohasflag","p":["zeno","aaronxc","Frvsted","wydkaiii"]},{"n":"Team ShalloFN","p":["Shallo","djacoby","July","Omar"]},{"n":"Team flaco08","p":["Flaco","Clasher","Eulogy","Everfy"]},{"n":"Team Inkfv7","p":["Inkfv7","demaroonie","Elevattionn","Himothy"]},{"n":"Team Gh0st77","p":["Gh0st","Br1ghtinly","FL1X","iPanda"]},{"n":"Team metafn","p":["meta","Ducky","Hatch","shuexi"]},{"n":"PMG Esports","p":["HySky","bkzr","christian","Dragonisqt"]},{"n":"SATINgid","p":["Fifty","Chimp","Source","Twunti"]}],"slots":2},"BR":{"teams":[{"n":"DRAGONS eSports","p":["Randu","Itrol","Lewa","Romero"]},{"n":"w7m esports","p":["Frosty","Phzin","Seeyun","Kurtz"]},{"n":"LOS MOSQUITEROS","p":["Tecne","Fazer","K1nG","Thiagin"]},{"n":"LOUD","p":["Diguera","Gabzera","KING","Night"]},{"n":"Team Sanku40","p":["Sanku","Fishy","Talls","Trueno"]},{"n":"Team mojakfn","p":["Mojak","Kitoz","LORD","Puzera"]},{"n":"Faith","p":["Navars","Betto","Fffakkz","Riquelmee"]},{"n":"Team Liquid","p":["Pulga","Persa","EdRoadToGlory","Teuzz"]},{"n":"Vivo Keyd Stars","p":["GxT","Fuzettin","KaykyGames","wolfie"]},{"n":"Team Summit","p":["axadasz","Benado","Magni","Renato"]},{"n":"Team Emacasla","p":["Emacasla","enzo","TRCO-JUAN","Welzx"]},{"n":"Team yNotZeus-","p":["yNotZeus","Diazz","Porto","rtk"]},{"n":"Team mecvivv","p":["mecvivv","Nobreaks","Okabe","scottzito"]},{"n":"Team realmsxd","p":["realms","50PCB","ARTH0RF","mattzx7"]},{"n":"SmokeSolid Gaming","p":["Force","Hazzense","Gonzalobtw","Myst"]},{"n":"Team killuaprime","p":["killua","abestado","iagocts","Noisqueta"]}],"slots":2},"ME":{"teams":[{"n":"Al Ula","p":["Adapter","FHD","Hero","Mansour"]},{"n":"KS7","p":["Kalgamer","k0ty","Kyry","Salvatore"]},{"n":"siuuu","p":["Kaido","Calvo","Spyro","Sythic"]},{"n":"Team KaKaRoT 1","p":["KaKaRoT","Abodk","3BooD","LLJFT"]},{"n":"Team thatguyameen","p":["ameen","Spy","flucky","insanity"]},{"n":"Team g1ntlman","p":["GntL","Bd","5aald","Snowvaks"]},{"n":"Team Anasx1","p":["Anas","Kuro","noah","sohib"]}],"slots":2},"ASIA":{"teams":[{"n":"ZETA DIVISION","p":["Minipiyo","Zagou","Koyota","Yuma"]},{"n":"T1","p":["Michael.","SAKI","SinOoh","Vall"]},{"n":"AJS","p":["DayDus","Stain","Proboko","RqzriM3"]},{"n":"Team GTEdog","p":["Alice","Dog","Qjac","Raru"]},{"n":"ALBA E-sports","p":["3peace","MuuCONIQ","Tawashi","Mame"]},{"n":"Team macyfishyyy","p":["Macyfishy","Degen","Dukez","Job"]},{"n":"Team peterpan fn","p":["Peterpan","FaxFox","GODBAEKHO","Quickss"]},{"n":"ALBA Younth","p":["Hestin","Okan","ryudora","Salmon"]}],"slots":1},"OCE":{"teams":[{"n":"PWR","p":["alex","looter","worthy","volx"]},{"n":"Onyx Ravens","p":["anon","Aspect","Cazi","Fisher"]},{"n":"Team crypty1x","p":["Crypty","Deymo","Resignz","Vxmxn"]},{"n":"2x","p":["NJayyee","dummi","MooMoo","Tuckle Buckle"]},{"n":"Team GazerFn","p":["Gazer","Resignz","Skits","Protoon"]},{"n":"Team artorzx","p":["artor","Vepz","Xcon","Sznny"]},{"n":"Team Mazyok","p":["Mazyok","Arab","dyrusse","Kade"]},{"n":"Team STARUX7","p":["Starux","Speedyyyy","Splyse","SWEATYBOI7"]}],"slots":1}}};
/* Esports World Cup 2024 (ESL Featuring Fortnite, Эр-Рияд, 8–11.08.2024), источник Liquipedia. 4 на 4 на аренах UEFN:
   CTF, Hardpoint, Keeper (Keeper только в Эр-Рияде). 16 мест: топ-6 DreamHack Dallas 2024 и 10 из онлайн-отборов
   5–7 июля (EU, NA, LATAM, MENA по два, APJ и OCE по одному). Dallas: швейцарка Bo3, плей-ин нижних десяти, 8 групп GSL,
   двойное выбывание (GF Bo5). Отбор: GSL Bo5 и двойное выбывание. Эр-Рияд: 4 группы GSL Bo5, плей-офф 8 Bo7.
   Поле из путёвок этой карьеры, команда встаёт в группу той, чью путёвку взяла. Сила из карточек 2024, карта
   логистикой разницы сил. MVP турнира ($50 000) лучший игрок чемпиона. Призы: EWC $400k..$10k, Dallas $100k..$3.5k,
   отборы без денег. */
const EWC24_MODES={bo3:['Capture the Flag','Hardpoint','Capture the Flag'],
  q5:['Capture the Flag','Hardpoint','Capture the Flag','Hardpoint','Capture the Flag'],
  bo5:['Capture the Flag','Hardpoint','Keeper','Capture the Flag','Hardpoint'],
  bo7:['Capture the Flag','Hardpoint','Keeper','Capture the Flag','Hardpoint','Keeper','Capture the Flag']};
// Отбор своего региона: NAW играл североамериканский.
const EWC24_QREG={EU:'EU', NAC:'NAC', NAW:'NAC', BR:'BR', ME:'ME', ASIA:'ASIA', OCE:'OCE'};
function ewc24Card(h, reg){
  const k=String(h||'').toLowerCase();
  let best=null;
  PLAYERS.forEach(p=>{ if(!p || String(p.handle||'').toLowerCase()!==k) return;
    const in24=/^f\d$/.test(String(p.cardSet||''));
    const sc=(in24 ? 1000 : 0)+(p.rating||0);
    if(!best || sc>best.sc) best={p, sc}; });
  if(best) return best.p;
  return {handle:h, region:reg||'EU', rating:80, _ovr:80, nat:null, tier:'ewc', event:'EWC 2024'};
}
function ewc24Ovr(c){ return (c && (c._ovr!=null ? c._ovr : c.rating))||80; }
function ewc24Pow(squad){
  const r=squad.map(ewc24Ovr);
  return r.reduce((s,v)=>s+v, 0)/Math.max(1, r.length);
}
function ewc24PayOf(table, place){ for(const x of table) if(place<=x[0]) return x[1]; return 0; }
function ewc24Pay(place){ return ewc24PayOf(EWC24.pay, place); }
function ewc24MapScore(mode, rng){
  if(mode==='Hardpoint') return [250, 120+Math.floor(rng()*126)];
  if(mode==='Keeper') return [2, rng()<0.5 ? 0 : 1];
  const w=2+Math.floor(rng()*4); return [w, Math.floor(rng()*w)];
}
// Убийства/смерти четверых на карте: арена с мгновенным возрождением, 15–25 убийств на игрока.
const EWC24_KILLS={'Capture the Flag':18, 'Hardpoint':24, 'Keeper':15};
function ewc24MapStats(t, mode, won, rng){
  const avg=ewc24Pow(t.squad), base=EWC24_KILLS[mode]||18;
  t.stats=t.stats||{};
  const line=[];
  t.squad.forEach(c=>{
    const edge=Math.pow(ewc24Ovr(c)/avg, 3);
    const e=Math.max(2, Math.round(base*(0.7+0.6*rng())*edge*(won ? 1.12 : 0.9)));
    const d=Math.max(2, Math.round(base*(0.7+0.6*rng())/edge*(won ? 0.9 : 1.12)));
    const s=t.stats[c.handle]||(t.stats[c.handle]={e:0, d:0, maps:0});
    s.e+=e; s.d+=d; s.maps++;
    line.push({h:c.handle, e, d});
  });
  return line;
}
// Лучший по счёту убийств-смертей (своя команда); у чужих — по рейтингу с долей случая.
function ewc24Best(t, rng, stats){
  if(stats) return stats.slice().sort((a,b)=>(b.e-b.d)-(a.e-a.d))[0].h;
  const w=t.squad.map(c=>Math.pow(ewc24Ovr(c), 6)), sum=w.reduce((s,v)=>s+v, 0);
  let x=rng()*sum;
  for(let i=0;i<w.length;i++){ x-=w[i]; if(x<=0) return t.squad[i].handle; }
  return (t.squad[0]||{}).handle||'';
}
function ewc24Series(A, B, bo, rng, modes){
  modes=modes || EWC24_MODES[bo===7 ? 'bo7' : bo===3 ? 'bo3' : 'bo5'];
  const need=Math.ceil(bo/2), maps=[];
  let a=0, b=0;
  const you=A.isYou ? A : B.isYou ? B : null;
  const agg={};
  for(let i=0; a<need && b<need; i++){
    const mode=modes[i % modes.length];
    const pool=EWC24.maps[mode]||['Arena'];
    const map=pool[Math.floor(rng()*pool.length)];
    const pA=1/(1+Math.exp(-(A.pow-B.pow)/3.2));
    const aWins=rng()<pA;
    const sc=ewc24MapScore(mode, rng);
    const m={mode, map, s:aWins ? [sc[0], sc[1]] : [sc[1], sc[0]]};
    if(you){
      m.me=ewc24MapStats(you, mode, (you===A)===aWins, rng);
      m.me.forEach(x=>{ const g=agg[x.h]||(agg[x.h]={h:x.h, e:0, d:0}); g.e+=x.e; g.d+=x.d; });
    }
    if(aWins) a++; else b++;
    maps.push(m);
  }
  const win=a>b ? A : B, lose=a>b ? B : A;
  const mvp=ewc24Best(win, rng, win.isYou ? Object.values(agg) : null);
  return {A, B, win, lose, score:[a, b], maps, mvp};
}
/* ===== EWC 2024 вживую: карта, тактика, выбор по ходу =====
   Карты из Liquipedia (Esports World Cup 2024 Maps): Chalet и Panther (CTF, Hardpoint), Taverna Zoni (Keeper).
   art/ewc/map-*.jpg: медиана кадров миникарты трансляции EWC (Day 4, YouTube h5NF4K3OPRc). Точки Hardpoint 1 и 4
   по трансляции, остальные на крупных площадках.
   Правила: CTF до 5 флагов, 10 мин двумя таймами, ОТ 2:30; Hardpoint до 250, точка переезжает каждые 60 с (здесь 5
   точек по 100 за ротацию, как в счетах 250 : 75…246); Keeper до 150 очков или 5 мин, до двух раундов.
   Перед картой выбор из трёх тактик по кругу, стиль соперника от имени с долей случая; в Эр-Рияде при проигрыше к
   середине ещё выбор. Тактика ±0,35 в логите (~±8%). «Решай сам» выключает вопросы, «Пропустить» показ. */
// Координаты — в рамке миникарты 120×100.
const EWC24_LAYOUT={
  'Capture the Flag|Panther':{img:'art/ewc/map-ctf-panther.jpg', base:[[32, 43], [97, 75]]},
  'Capture the Flag|Chalet':{img:'art/ewc/map-ctf-chalet.jpg', base:[[10, 91], [108, 6]]},
  'Hardpoint|Panther':{img:'art/ewc/map-hp-panther.jpg', hills:[[61, 64], [67, 11], [91, 51], [35, 27], [41, 75]]},
  'Hardpoint|Chalet':{img:'art/ewc/map-hp-chalet.jpg', hills:[[61, 56], [74, 20], [102, 75], [26, 83], [29, 48]]},
  'Keeper|Taverna Zoni':{img:'art/ewc/map-keeper-taverna.jpg', keys:[[60, 52], [42, 40], [86, 32], [36, 78], [76, 74], [22, 60]]}
};
// Каждая тактика бьёт следующую: раш ловит сплит, сплит обходит защиту, защита встречает раш.
const EWC24_TACT={'Capture the Flag':['rush','split','def'], 'Hardpoint':['hold','hunt','rot'], 'Keeper':['press','hide','spread']};
const EWC24_ASK_MS=8000, EWC24_FRAME_MS=70;
let EWC24_AUTO=false, EWC24_LIVE_BIG=false;
function ewc24Edge(mine, theirs, mode){
  const l=EWC24_TACT[mode]||[], i=l.indexOf(mine), j=l.indexOf(theirs);
  if(i<0 || j<0 || i===j) return 0;
  return (i+1)%3===j ? 0.35 : -0.35;
}
function ewc24Style(t, mode, rng){
  const l=EWC24_TACT[mode];
  return rng()<0.3 ? l[Math.floor(rng()*3)] : l[Math.abs(ccHashStr(String(t.label)+'|'+mode))%3];
}
async function ewc24Play(A, B, bo, rng, modes, tag){
  if((A.isYou || B.isYou) && !skipAnimation) return ewc24SeriesLive(A, B, bo, rng, modes, tag);
  return ewc24Series(A, B, bo, rng, modes);
}
function ewc24Ask(head, sub, opts){
  if(skipAnimation || EWC24_AUTO) return Promise.resolve(null);
  return new Promise(done=>{
    const box=document.createElement('div');
    box.className='cc-round-ask ewc-ask';
    box.style.setProperty('--rc-ms', EWC24_ASK_MS+'ms');
    box.innerHTML='<div class="cc-choice-head"><b><span class="cc-choice-t">'+esc(head)+'</span></b><span>'+esc(sub)+'</span></div>'+
      '<div class="cc-choice-row">'+opts.map((o, i)=>'<button class="cc-choice-btn'+(i===0 ? ' def' : '')+'" data-k="'+o.k+'"><b>'+esc(o.name)+'</b><em>'+esc(o.desc)+'</em></button>').join('')+'</div>'+
      '<button class="ewc-ask-auto" data-k="auto">'+esc(L().ewc24Auto)+'</button>'+
      '<div class="cc-choice-bar"><i></i></div>';
    let over=false;
    const end=k=>{ if(over) return; over=true; box.remove(); if(k==='auto'){ EWC24_AUTO=true; k=null; } done(k||null); };
    box.querySelectorAll('button').forEach(b=>b.onclick=()=>end(b.dataset.k));
    document.body.appendChild(box);
    setTimeout(()=>end(null), EWC24_ASK_MS);
  });
}
async function ewc24SeriesLive(A, B, bo, rng, modes, tag){
  modes=modes || EWC24_MODES[bo===7 ? 'bo7' : bo===3 ? 'bo3' : 'bo5'];
  const need=Math.ceil(bo/2), maps=[], agg={};
  const you=A.isYou ? A : B;
  let a=0, b=0;
  const box=document.createElement('div');
  box.className='stage-card ewc-card ewc-live';
  document.getElementById('majorStages').appendChild(box);
  box.scrollIntoView({block:'center', behavior:'smooth'});
  for(let i=0; a<need && b<need; i++){
    const mode=modes[i % modes.length];
    const pool=EWC24.maps[mode]||['Arena'];
    const map=pool[Math.floor(rng()*pool.length)];
    const r=await ewc24LiveMap(box, {A, B, you, mode, map, rng, series:[a, b], bo, idx:i+1, tag});
    const m={mode, map, s:r.s};
    m.me=ewc24MapStats(you, mode, r.youWon, rng);
    m.me.forEach(x=>{ const g=agg[x.h]||(agg[x.h]={h:x.h, e:0, d:0}); g.e+=x.e; g.d+=x.d; });
    if(r.aWins) a++; else b++;
    maps.push(m);
    if(!skipAnimation) await sleep(700);
  }
  box.remove();
  const win=a>b ? A : B, lose=a>b ? B : A;
  const mvp=ewc24Best(win, rng, win.isYou ? Object.values(agg) : null);
  return {A, B, win, lose, score:[a, b], maps, mvp};
}
// Восемь фигурок: 0–3 свои, 4–7 соперник; старт — у своих баз (CTF) или по краям карты.
function ewc24Lay(st){ return EWC24_LAYOUT[st.mode+'|'+st.map]||{}; }
function ewc24Home(st, side){
  const lay=ewc24Lay(st);
  if(lay.base) return lay.base[side];
  return side===0 ? [18, 80] : [102, 20];
}
function ewc24Dots(st){
  return Array.from({length:8}, (_, i)=>{ const h=ewc24Home(st, i<4 ? 0 : 1); const x=h[0]+((i%4)-1.5)*4, y=h[1]+((i%2)-0.5)*5; return {x, y, tx:x, ty:y}; });
}
function ewc24Aim(st, rng){
  const pick=(cx, cy, r)=>[Math.max(4, Math.min(116, cx+(rng()-0.5)*r)), Math.max(4, Math.min(96, cy+(rng()-0.5)*r))];
  const lay=ewc24Lay(st);
  st.dots.forEach((d, i)=>{
    const side=i<4 ? 0 : 1;
    let c;
    if(st.mode==='Hardpoint'){ const h=(lay.hills||[[60, 50]])[st.obj||0]; c=pick(h[0], h[1], 26); }
    else if(st.mode==='Keeper'){ c=pick(st.key[0], st.key[1], 30); }
    else {
      // CTF: один-два идут на чужую базу, один держит свою, остальные — середина между базами.
      const role=i%4, home=ewc24Home(st, side), away=ewc24Home(st, 1-side);
      c=role===0 ? pick(away[0], away[1], 16) : role===3 ? pick(home[0], home[1], 14) : pick((home[0]+away[0])/2, (home[1]+away[1])/2, 44);
    }
    d.tx=c[0]; d.ty=c[1];
  });
}
function ewc24Move(st, rng){
  if(rng()<0.35) ewc24Aim(st, rng);
  st.dots.forEach(d=>{ d.x+=(d.tx-d.x)*0.3+(rng()-0.5)*1.6; d.y+=(d.ty-d.y)*0.3+(rng()-0.5)*1.6; });
}
function ewc24SceneHTML(o, st, mine, theirs, known){
  const T=L(), you=o.you, opp=o.A===you ? o.B : o.A;
  const ser=o.A===you ? o.series : [o.series[1], o.series[0]];
  const mm=Math.floor(st.clock/60), ss=String(Math.floor(st.clock%60)).padStart(2, '0');
  const lay=ewc24Lay(st);
  let svg='';
  if(st.mode==='Capture the Flag'){
    const b=lay.base||[[18, 80], [102, 20]];
    [0, 1].forEach(s=>{ const p=b[s], col=s===0 ? '#00d6a4' : '#ff6b5e';
      svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="7" fill="'+(s===0 ? 'rgba(0,214,164,.28)' : 'rgba(255,107,94,.28)')+'" stroke="'+col+'" stroke-width=".8"/>'+
        (st.flag!==(1-s) ? '<path d="M'+(p[0]-1.5)+' '+(p[1]-5)+'v8M'+(p[0]-1.5)+' '+(p[1]-5)+'l6 2.5-6 2.5" stroke="'+col+'" stroke-width="1.1" fill="'+col+'"/>' : ''); });
  } else if(st.mode==='Hardpoint'){
    (lay.hills||[]).forEach((h, i)=>{ const on=i===st.obj;
      svg+='<rect x="'+(h[0]-(on ? 6 : 3.5))+'" y="'+(h[1]-(on ? 6 : 3.5))+'" width="'+(on ? 12 : 7)+'" height="'+(on ? 12 : 7)+'" transform="rotate(45 '+h[0]+' '+h[1]+')" fill="'+(on ? (st.hold===0 ? 'rgba(0,214,164,.55)' : st.hold===1 ? 'rgba(255,107,94,.55)' : 'rgba(20,20,30,.7)') : 'rgba(20,20,30,.45)')+'" stroke="'+(on ? '#fff' : 'rgba(255,255,255,.45)')+'" stroke-width="'+(on ? .9 : .5)+'"/>'+
        '<text x="'+h[0]+'" y="'+(h[1]+(on ? 2 : 1.4))+'" font-size="'+(on ? 5.5 : 4)+'" font-weight="900" text-anchor="middle" fill="#fff">'+(i+1)+'</text>'; });
  } else {
    svg+='<path d="M'+st.key[0]+' '+(st.key[1]-4.5)+'l4 4.5-4 4.5-4-4.5z" fill="#ffe600" stroke="#fff" stroke-width=".5"/>';
  }
  st.dots.forEach((d, i)=>{ svg+='<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+'" r="2.3" fill="'+(i<4 ? '#00d6a4' : '#ff6b5e')+'" stroke="#fff" stroke-width=".6"'+(st.carrier===i ? ' style="filter:drop-shadow(0 0 2px #ffe600)"' : '')+'/>'; });
  const sub=st.mode==='Keeper' ? '<small>'+esc(T.ewc24Rnd(st.rnum))+' · '+st.pts[0]+' : '+st.pts[1]+'</small>' : '';
  return '<div class="ewc-live-top"><span>'+esc(T.ewc24AskH(o.idx, st.mode, st.map))+'</span><span>'+esc(T.ewc24SerLine(ser[0], ser[1], o.bo))+'</span></div>'+
    '<div class="ewc-live-score"><b class="y">'+esc(you.label)+'</b><i>'+st.sc[0]+' : '+st.sc[1]+sub+'</i><b class="o">'+esc(opp.label)+'</b></div>'+
    '<div class="ewc-live-map" style="background-image:url('+(lay.img||'')+')"><svg viewBox="0 0 120 100" preserveAspectRatio="none">'+svg+'</svg>'+
      '<span class="ewc-live-clock">'+esc(st.half)+' · '+mm+':'+ss+'</span></div>'+
    '<div class="ewc-live-tac"><span>'+esc(T.ewc24You2)+': <b>'+esc(mine ? T.ewc24T[mine][0] : '…')+'</b></span><span>'+esc(opp.label)+': <b>'+esc(known ? T.ewc24T[theirs][0] : '?')+'</b></span></div>'+
    '<div class="ewc-live-feed">'+st.feed.slice(0, 4).map(f=>'<div class="'+(f.w===0 ? 'y' : 'o')+'">'+esc(f.txt)+'</div>').join('')+'</div>';
}
async function ewc24LiveMap(box, o){
  const T=L(), {A, B, you, mode, map, rng}=o;
  const opp=A===you ? B : A, youA=A===you;
  const tl=EWC24_TACT[mode];
  let theirs=ewc24Style(opp, mode, rng), known=false;
  const opts=()=>tl.map(k=>({k, name:T.ewc24T[k][0], desc:T.ewc24T[k][1]}));
  const ser=youA ? o.series : [o.series[1], o.series[0]];
  const st={mode, map, sc:[0, 0], clock:0, feed:[], dots:[], obj:0, hold:-1, flag:-1, carrier:-1, key:[60, 50], half:'', rnum:1, pts:[0, 0]};
  const live=()=>!skipAnimation;
  st.dots=ewc24Dots(st);
  let mine=null;
  const draw=()=>{ if(live()) box.innerHTML=ewc24SceneHTML(o, st, mine, theirs, known); };
  // Карта с составами видна сразу, пока выбирается тактика.
  draw();
  mine=await ewc24Ask(T.ewc24AskH(o.idx, mode, map), T.ewc24AskSub(opp.label, ser[0], ser[1]), opts());
  if(!mine) mine=tl[Math.floor(rng()*3)];
  const diff=(you.pow-opp.pow)/3.2;
  const pYou=()=>1/(1+Math.exp(-(diff+ewc24Edge(mine, theirs, mode))));
  const tick=async n=>{ for(let f=0; f<n && live(); f++){ ewc24Move(st, rng); draw(); await sleep(EWC24_FRAME_MS); } };
  const nm=w=>{ const sq=(w===0 ? you : opp).squad; return (sq[Math.floor(rng()*sq.length)]||{}).handle||'?'; };
  const kill=()=>{ if(rng()<0.55){ const w=rng()<pYou() ? 0 : 1; st.feed.unshift({w, txt:T.ewc24Kill(nm(w), nm(1-w))}); } };
  // Соперник тоже подстраивается: проигрывая к середине, в половине случаев берёт то, что бьёт твоё.
  const beater=k=>tl[(tl.indexOf(k)+2)%3];
  const midway=async()=>{
    if(st.sc[1]>st.sc[0] && rng()<0.5) theirs=beater(mine);
    if(!EWC24_LIVE_BIG || st.sc[0]>=st.sc[1] || !live()) return;
    known=true; draw();
    const pick=await ewc24Ask(T.ewc24MidH, T.ewc24Read(opp.label, T.ewc24T[theirs][0]), opts());
    if(pick) mine=pick;
    draw();
  };
  ewc24Aim(st, rng); draw();
  if(mode==='Capture the Flag'){
    st.half=T.ewc24H1;
    for(let seg=0; seg<10 && st.sc[0]<5 && st.sc[1]<5; seg++){
      if(seg===5){ st.half=T.ewc24H2; await midway(); }
      st.clock=seg*60; await tick(4); kill();
      if(rng()<0.5){ const w=rng()<pYou() ? 0 : 1; st.flag=w; st.carrier=w===0 ? 0 : 4; await tick(3);
        st.sc[w]++; st.feed.unshift({w, txt:T.ewc24Cap(nm(w))}); st.flag=-1; st.carrier=-1; }
      st.clock=seg*60+59; draw();
    }
    if(st.sc[0]===st.sc[1]){
      st.half=T.ewc24OT;
      for(let k=0; k<3 && st.sc[0]===st.sc[1]; k++){ st.clock=600+k*50; await tick(4); if(rng()<0.55){ const w=rng()<pYou() ? 0 : 1; st.sc[w]++; st.feed.unshift({w, txt:T.ewc24Cap(nm(w))}); } }
      if(st.sc[0]===st.sc[1]){ const w=rng()<pYou() ? 0 : 1; st.sc[w]++; st.feed.unshift({w, txt:T.ewc24Cap(nm(w))}); }
    }
  } else if(mode==='Hardpoint'){
    for(let rot=0; rot<5 && st.sc[0]<250 && st.sc[1]<250; rot++){
      st.obj=rot; st.half=T.ewc24Rot(rot+1);
      if(rot===2) await midway();
      for(let q=0; q<4 && st.sc[0]<250 && st.sc[1]<250; q++){
        const sh=Math.max(0.05, Math.min(0.95, pYou()+(rng()-0.5)*0.5));
        st.sc[0]=Math.min(250, st.sc[0]+Math.round(25*sh)); st.sc[1]=Math.min(250, st.sc[1]+Math.round(25*(1-sh)));
        st.hold=sh>=0.5 ? 0 : 1; st.clock=rot*60+q*15; kill();
        await tick(2);
      }
      st.feed.unshift({w:st.hold, txt:T.ewc24HillTake((st.hold===0 ? you : opp).label, rot+1)});
    }
    // Время вышло без 250 — у кого больше; ровно — овертайм до первого перевеса.
    while(st.sc[0]===st.sc[1]){ const w=rng()<pYou() ? 0 : 1; st.sc[w]+=5; st.half=T.ewc24OT; await tick(2); }
  } else {
    // Keeper: раунды до 150 очков или пяти минут, карта — до двух выигранных раундов.
    while(st.sc[0]<2 && st.sc[1]<2){
      st.pts=[0, 0]; { const ks=ewc24Lay(st).keys||[[60, 50]]; st.key=ks[Math.floor(rng()*ks.length)]; } st.half=T.ewc24Rnd(st.rnum);
      for(let m=0; m<5 && st.pts[0]<150 && st.pts[1]<150; m++){
        const sh=Math.max(0.05, Math.min(0.95, pYou()+(rng()-0.5)*0.6));
        st.pts[0]=Math.min(150, st.pts[0]+Math.round(55*sh)); st.pts[1]=Math.min(150, st.pts[1]+Math.round(55*(1-sh)));
        st.carrier=sh>=0.5 ? 0 : 4; st.clock=m*60; kill();
        if(m===0) st.feed.unshift({w:sh>=0.5 ? 0 : 1, txt:T.ewc24KeyTake(nm(sh>=0.5 ? 0 : 1))});
        await tick(3);
      }
      const w=st.pts[0]===st.pts[1] ? (rng()<pYou() ? 0 : 1) : (st.pts[0]>st.pts[1] ? 0 : 1);
      st.sc[w]++; st.rnum++; st.carrier=-1;
      if(st.sc[0]<2 && st.sc[1]<2) await midway();
    }
  }
  draw();
  if(live()) await sleep(500);
  const youWon=st.sc[0]>st.sc[1];
  return {youWon, aWins:youWon===youA, s:youA ? [st.sc[0], st.sc[1]] : [st.sc[1], st.sc[0]]};
}
// GSL-группа из четырёх: 1–3 и 2–4 открывают, победители — за 1-е место, проигравшие — на вылет.
async function ewc24Group(t, rng, bo, modes){
  bo=bo||5;
  const m1=await ewc24Play(t[0], t[2], bo, rng, modes), m2=await ewc24Play(t[1], t[3], bo, rng, modes);
  const wm=await ewc24Play(m1.win, m2.win, bo, rng, modes), em=await ewc24Play(m1.lose, m2.lose, bo, rng, modes);
  const dm=await ewc24Play(wm.lose, em.win, bo, rng, modes);
  return {order:[wm.win, dm.win, dm.lose, em.lose], series:[m1, m2, wm, em, dm]};
}
/* Двойное выбывание на 2^k команд (посев сверху вниз). Верх: 1–N, 2–(N−1)…, дальше соседи. Низ:
   проигравшие первого раунда между собой, затем по кругу — выжившие низа против свежих проигравших
   верха и между собой, пока не останется один. Гранд-финал gfBo. places — группы мест снизу вверх. */
async function ewc24Double(seeded, bo, rng, modes, gfBo){
  const n=seeded.length, series=[], out=[];
  let ub=[];
  for(let i=0;i<n/2;i++) ub.push(seeded[i], seeded[n-1-i]);
  let lb=[], ubR=0;
  const play=async(pairs, tag)=>{ const r=[]; for(const [a,b] of pairs){ const s=await ewc24Play(a, b, bo, rng, modes, tag); s.tag=tag; series.push(s); r.push(s); } return r; };
  while(ub.length>1){
    ubR++;
    const us=await play(Array.from({length:ub.length/2}, (_, i)=>[ub[2*i], ub[2*i+1]]), 'ub'+ubR);
    ub=us.map(s=>s.win); const L=us.map(s=>s.lose);
    if(!lb.length){
      const ls=await play(Array.from({length:L.length/2}, (_, i)=>[L[2*i], L[2*i+1]]), 'lb');
      lb=ls.map(s=>s.win); out.push(ls.map(s=>s.lose));
    } else {
      const ls=await play(lb.map((t, i)=>[t, L[L.length-1-i]]), 'lb');
      lb=ls.map(s=>s.win); out.push(ls.map(s=>s.lose));
      if(lb.length>1 && ub.length>1){
        const ms=await play(Array.from({length:lb.length/2}, (_, i)=>[lb[2*i], lb[2*i+1]]), 'lb');
        lb=ms.map(s=>s.win); out.push(ms.map(s=>s.lose));
      }
    }
  }
  const gf=await ewc24Play(ub[0], lb[0], gfBo||bo, rng, modes, 'gf'); gf.tag='gf'; series.push(gf);
  out.push([gf.lose], [gf.win]);
  // Места: сверху вниз.
  const places=[]; let p=1;
  out.slice().reverse().forEach(g=>{ places.push({from:p, to:p+g.length-1, teams:g}); p+=g.length; });
  return {series, places, ubFinalist:ub[0], lbFinalist:lb[0]};
}
// Твоя четвёрка: ты, напарники и сильнейшие свободные карточки 2024-го своего региона (не выше тебя +2).
function ewc24MyTeam(busy){
  const T=L(), me=careerCard(); if(!me) return null;
  const reg=CAREER.player.region||'EU';
  const taken=new Set((busy||[]).map(h=>String(h).toLowerCase()));
  // Своя четвёрка — сквад-состав игрока (CAREER.rosters[4], собирается в окне состава), иначе напарники года.
  const r4=ccFmtRoster(4).map(r=>ccMateCardOf(r)).filter(Boolean);
  const mine=[me].concat(careerSquadSize()===4 ? (careerMates()||[]).filter(Boolean) : r4).slice(0, 4);
  mine.forEach(c=>taken.add(String(c.handle||'').toLowerCase()));
  const myOvr=(CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr)||80;
  /* Сперва люди своего клуба (идея игрока 30.09: «чтобы состав был одной организацией, особенно на EWC» —
     EWC играется клубами): одноклубники года идут первыми и без потолка «не выше тебя +2», потом остальные. */
  const myOrg=(CAREER.org && CAREER.org.name) || null;
  const inOrg=p=>!!myOrg && p.org===myOrg;
  const pool=PLAYERS.filter(p=>p && /^f\d$/.test(String(p.cardSet||'')) && p.region===reg && !taken.has(String(p.handle||'').toLowerCase()) && (inOrg(p) || (p.rating||0)<=myOvr+2))
                    .sort((a,b)=>(inOrg(b)?1:0)-(inOrg(a)?1:0) || (b.rating||0)-(a.rating||0));
  const seen=new Set();
  for(const p of pool){ if(mine.length>=4) break; const k=String(p.handle).toLowerCase(); if(seen.has(k)) continue; seen.add(k); mine.push(p); }
  return {name:mine.map(c=>c.handle).join(' & '), squad:mine, isYou:true, pow:ewc24Pow(mine), label:(CAREER.org && CAREER.org.name) || T.ewc24You};
}
// Настоящая команда: без людей из твоей четвёрки.
function ewc24Team(t, you, reg){
  const mineH=new Set(you.squad.map(c=>String(c.handle).toLowerCase()));
  const squad=t.p.filter(h=>!mineH.has(String(h).toLowerCase())).map(h=>ewc24Card(h, reg));
  return {name:squad.map(c=>c.handle).join(' & '), squad, pow:ewc24Pow(squad), label:t.n, real:true};
}
// Добивка отбора: n четвёрок из сильнейших свободных карточек 2024-го региона (не в составах отбора и не у тебя).
function ewc24FillTeams(n, reg, you, busy){
  const taken=new Set((busy||[]).concat(you.squad.map(c=>c.handle)).map(h=>String(h||'').toLowerCase()));
  const seen=new Set(), pool=[];
  PLAYERS.filter(p=>p && /^f\d$/.test(String(p.cardSet||'')) && (EWC24_QREG[p.region]||p.region)===reg)
    .sort((a,b)=>(b.rating||0)-(a.rating||0))
    .forEach(p=>{ const k=String(p.handle||'').toLowerCase(); if(!k || taken.has(k) || seen.has(k)) return; seen.add(k); pool.push(p); });
  const out=[];
  for(let i=0; i<n && pool.length>=4; i++){
    const squad=pool.splice(0, 4);
    out.push({name:squad.map(c=>c.handle).join(' & '), squad, pow:ewc24Pow(squad), label:'Team '+squad[0].handle});
  }
  return out;
}
function ewc24State(){ const cr=CAREER.career; return cr.ewc24 || (cr.ewc24={}); }
// Путёвка в Эр-Рияд есть — отбор не нужен; нет — на сам EWC не зовут.
function ewc24Invited(ev){
  const st=CAREER.career.ewc24||{};
  if(ev.ewc24==='qual') return !st.you && !!EWC24.quals[EWC24_QREG[CAREER.player.region]||''] && !(st.played||{}).qual;
  if(ev.ewc24==='dallas') return !st.you && !(st.played||{}).dallas && ['EU','NAC','NAW'].indexOf(CAREER.player.region)>=0;
  return !!st.you;
}
// ---- показ ----
function ewc24Nm(t){ return '<b>'+esc(t.label)+'</b>'; }
function ewc24SeriesHTML(s){
  const T=L();
  const mine=s.A.isYou || s.B.isYou;
  const meH=(careerCard()||{}).handle;
  return '<div class="ewc-ser'+(mine ? ' mine' : '')+'"><div class="ewc-ser-h">'+ewc24Nm(s.A)+' <i>'+s.score[0]+' : '+s.score[1]+'</i> '+ewc24Nm(s.B)+
    (s.mvp ? '<span class="ewc-mvp">MVP '+esc(s.mvp)+'</span>' : '')+'</div>'+
    '<div class="ewc-maps">'+s.maps.map(m=>{
      const me=m.me && m.me.find(x=>x.h===meH);
      return '<span class="'+(m.s[0]>m.s[1]?'a':'b')+'"><em>'+esc(m.mode)+' · '+esc(m.map)+'</em>'+m.s[0]+'–'+m.s[1]+
        (me ? '<small>'+esc(T.ewc24MeKd(me.e, me.d))+'</small>' : '')+'</span>'; }).join('')+'</div></div>';
}
function ewc24TableHTML(rows, you, cut){
  return '<div class="ewc-table">'+rows.map(r=>r.teams.map(t=>'<div class="'+(t===you?'you':'')+'"><i>'+(r.from===r.to ? r.from : r.from+'–'+r.to)+'</i>'+ewc24Nm(t)+
    (cut && r.to<=cut ? ' <em>'+esc(L().ewc24Ticket)+'</em>' : '')+'</div>').join('')).join('')+'</div>';
}
function ewc24StatsHTML(you){
  const T=L(), st=you.stats||{};
  const rows=you.squad.map(c=>({h:c.handle, s:st[c.handle]})).filter(r=>r.s);
  if(!rows.length) return '';
  return '<div class="ewc-stats"><div class="ewc-stats-h">'+esc(T.ewc24Stats)+'</div>'+rows.map(r=>'<div><b>'+esc(r.h)+'</b><span>'+r.s.e+' / '+r.s.d+'</span><span>K/D '+(r.s.e/Math.max(1, r.s.d)).toFixed(2)+'</span><span>'+esc(T.ewc24Maps(r.s.maps))+'</span></div>').join('')+'</div>';
}
function ewc24Begin(){
  CAREER_RUN=true;
  CC_SKIP_RUN=false; skipAnimation=false; EWC24_AUTO=false;
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  document.getElementById('finalBanner').style.display='none';
  show('screen-results');
  ensureSkipButton();
  const host=document.getElementById('majorStages');
  return (title, body)=>{ const d=document.createElement('div'); d.className='stage-card ewc-card'; d.innerHTML='<h4>'+esc(title)+'</h4>'+body; host.appendChild(d); d.scrollIntoView({block:'end', behavior:'smooth'}); return d; };
}
function ewc24RosterLine(you){ return '<div class="ewc-roster">'+ewc24Nm(you)+' — '+you.squad.map(c=>esc(c.handle)+' <small>'+Math.round(ewc24Ovr(c))+'</small>').join(', ')+'</div>'; }
function ewc24Finish(ev, title, myPlace, of, cash, passed){
  const cr=CAREER.career;
  removeSkipButton();
  cr.log=cr.log||[];
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:myPlace, of, pts:0, passed:!!passed,
    ovr:CAREER.player.ovr, games:0, wins:0, elims:0, avg:null, mate:(careerMates()[0]||{}).handle||null, mates:ccLogMates(careerMates()),
    prize:cash, kind:'victory', lan:ev.lan, ewc:true});
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title, place:myPlace, through:!!passed, wins:0, cash, cut:0, byPlace:true});
}
// ---- DreamHack Dallas 2024 ----
async function ewc24RunDallas(ev){
  const T=L(), D=EWC24.dallas, st=ewc24State();
  EWC24_LIVE_BIG=false;
  const rng=careerRng(ccHashStr('ewc24dh|'+CAREER.career.season+'|'+careerToday()));
  const busy=[].concat(...D.teams.map(t=>t.p));
  const you=ewc24MyTeam(busy); if(!you) return;
  const card=ewc24Begin();
  const real=D.teams.map(t=>Object.assign(ewc24Team(t, you, 'EU'), {seed:t.s}));
  const weakest=real.slice().sort((a,b)=>a.pow-b.pow)[0];
  const field=real.filter(t=>t!==weakest).concat([you]);
  card(T.ewc24DhTitle, '<div class="stage-detail">'+esc(T.ewc24DhIntro)+'</div>'+ewc24RosterLine(you));
  if(!skipAnimation) await sleep(700);
  // Швейцарка: три раунда Bo3 на посев, пары по счёту побед.
  field.forEach(t=>{ t.sw=0; });
  const swMine=[];
  for(let r=0;r<3;r++){
    const order=field.slice().sort((a,b)=>(b.sw-a.sw) || (b.pow-a.pow) || (rng()-0.5));
    for(let i=0;i+1<order.length;i+=2){ const s=await ewc24Play(order[i], order[i+1], 3, rng, EWC24_MODES.bo3, 'sw'); s.win.sw++; if(s.A===you||s.B===you) swMine.push(s); }
  }
  const seeded=field.slice().sort((a,b)=>(b.sw-a.sw) || (b.pow-a.pow));
  card(T.ewc24Swiss, swMine.map(ewc24SeriesHTML).join('')+'<div class="stage-detail">'+esc(T.ewc24SwissSeed(seeded.indexOf(you)+1, you.sw))+'</div>');
  if(!skipAnimation) await sleep(800);
  // Плей-ин: посев 28–37 парами (28–37, 29–36…), проигравшие — 33–37.
  const top=seeded.slice(0, 27), pin=seeded.slice(27), pinOut=[];
  const pinS=[];
  for(let i=0;i<5;i++){ const s=await ewc24Play(pin[i], pin[9-i], 3, rng, EWC24_MODES.bo3, 'pin'); pinS.push(s); top.push(s.win); pinOut.push(s.lose); }
  const myPin=pinS.find(s=>s.A===you||s.B===you);
  if(myPin){ card(T.ewc24PlayIn, ewc24SeriesHTML(myPin)); if(!skipAnimation) await sleep(700); }
  const places=[];
  // Группы: змейкой по посеву, GSL Bo3, двое сверху — в плей-офф.
  const groups=Array.from({length:8}, ()=>[]);
  top.slice().sort((a,b)=>(b.sw-a.sw) || (b.pow-a.pow)).forEach((t, i)=>{ const r=Math.floor(i/8), c=i%8; groups[r%2 ? 7-c : c].push(t); });
  const thirds=[], fourths=[], po=[];
  for(let gi=0; gi<groups.length; gi++){ const g=groups[gi];
    const r=await ewc24Group(g, rng, 3, EWC24_MODES.bo3);
    po.push(r.order[0], r.order[1]); thirds.push(r.order[2]); fourths.push(r.order[3]);
    if(r.order.indexOf(you)>=0){
      card(T.ewc24DhGroup(String.fromCharCode(65+gi)), r.series.map(ewc24SeriesHTML).join('')+ewc24TableHTML(r.order.map((t,i)=>({from:i+1, to:i+1, teams:[t]})), you, 2));
    }
  }
  if(!skipAnimation) await sleep(800);
  // Плей-офф: первые мест групп против вторых, двойное выбывание Bo3, гранд-финал Bo5.
  const firsts=po.filter((t, i)=>i%2===0), seconds=po.filter((t, i)=>i%2===1);
  const bracket=await ewc24Double(firsts.concat(seconds.reverse()), 3, rng, EWC24_MODES.bo3, 5);
  const mySer=bracket.series.filter(s=>s.A===you||s.B===you);
  if(mySer.length){ card(T.ewc24DhPlayoffs, mySer.map(s=>'<h5 class="ewc-h5">'+esc(T.ewc24Tag(s.tag))+'</h5>'+ewc24SeriesHTML(s)).join('')); if(!skipAnimation) await sleep(800); }
  bracket.places.forEach(p=>places.push(p));
  places.push({from:17, to:24, teams:thirds}, {from:25, to:32, teams:fourths}, {from:33, to:37, teams:pinOut});
  const placeOf=t=>{ const p=places.find(r=>r.teams.indexOf(t)>=0); return p ? p.from : 37; };
  const myPlace=placeOf(you);
  card(T.ewc24Standings, ewc24TableHTML(places.filter(p=>p.from<=16 || p.teams.indexOf(you)>=0), you, D.tickets)+ewc24StatsHTML(you));
  // Путёвки: топ-6 по порядку мест (внутри 5–6 — по силе).
  const ranked=[].concat(...places.map(p=>p.teams.slice().sort((a,b)=>b.pow-a.pow)));
  st.dallas=ranked.slice(0, D.tickets).map(t=>t===you ? 'YOU' : t.label);
  st.played=Object.assign({}, st.played, {dallas:true});
  if(myPlace<=D.tickets) st.you={via:'dallas', place:st.dallas.indexOf('YOU')+1};
  careerMoneyAdd(ranked, (p, t)=>ewc24PayOf(D.pay, placeOf(t)));
  const cash=ewc24PayOf(D.pay, myPlace);
  const mine=cash ? ccShareOf(cash, you) : 0;
  if(mine) ccPayIn(mine);
  careerNews(cash ? 'good' : 'flat', 'ccNewsEvCash', ['DreamHack Dallas 2024', myPlace, ccNum(cash)]);
  if(st.you) careerNews('good', 'ccNewsEwc24Ticket', ['DreamHack Dallas 2024']);
  ewc24Finish(ev, 'DreamHack Dallas 2024', myPlace, 37, mine, !!st.you);
}
// ---- онлайн-отбор своего региона ----
async function ewc24RunQual(ev){
  const T=L(), st=ewc24State();
  EWC24_LIVE_BIG=false;
  const reg=EWC24_QREG[CAREER.player.region]||'EU', Q=EWC24.quals[reg];
  const rng=careerRng(ccHashStr('ewc24q|'+reg+'|'+CAREER.career.season+'|'+careerToday()));
  // Путёвки Dallas уже розданы — их обладатели в отбор не идут.
  const held=new Set((st.dallas||[]).map(n=>String(n).toLowerCase()));
  const busy=[].concat(...Q.teams.map(t=>t.p));
  const you=ewc24MyTeam(busy); if(!you) return;
  const card=ewc24Begin();
  const size=Q.teams.length>=15 ? 16 : 8;
  let field=Q.teams.filter(t=>!held.has(String(t.n).toLowerCase())).map(t=>ewc24Team(t, you, reg));
  // Путёвщики Dallas выбывают из отбора — сетка на 8/16 пустеет (NAC 15−4 = 11 + ты), группа
  // выходит из трёх и ewc24Group падает на t[3]. Пустые места — свободные четвёрки региона.
  if(field.length<size-1) field=field.concat(ewc24FillTeams(size-1-field.length, reg, you, busy));
  field=field.slice().sort((a,b)=>b.pow-a.pow).slice(0, size-1).concat([you]);
  card(T.ewc24QTitle(reg), '<div class="stage-detail">'+esc(T.ewc24QIntro(Q.slots))+'</div>'+ewc24RosterLine(you));
  if(!skipAnimation) await sleep(700);
  const seeded=field.slice().sort((a,b)=>b.pow-a.pow);
  const G=size/4, groups=Array.from({length:G}, ()=>[]);
  seeded.forEach((t, i)=>{ const r=Math.floor(i/G), c=i%G; groups[r%2 ? G-1-c : c].push(t); });
  const firsts=[], seconds=[], thirds=[], fourths=[];
  for(let gi=0; gi<groups.length; gi++){ const g=groups[gi];
    const r=await ewc24Group(g, rng, 5, EWC24_MODES.q5);
    firsts.push(r.order[0]); seconds.push(r.order[1]); thirds.push(r.order[2]); fourths.push(r.order[3]);
    if(r.order.indexOf(you)>=0){
      card(T.ewc24Group(String.fromCharCode(65+gi)), r.series.map(ewc24SeriesHTML).join('')+ewc24TableHTML(r.order.map((t,i)=>({from:i+1, to:i+1, teams:[t]})), you, 2));
    }
  }
  if(!skipAnimation) await sleep(800);
  const bracket=await ewc24Double(firsts.concat(seconds.reverse()), 5, rng, EWC24_MODES.q5, 5);
  const mySer=bracket.series.filter(s=>s.A===you||s.B===you);
  if(mySer.length){ card(T.ewc24QPlayoffs, mySer.map(s=>'<h5 class="ewc-h5">'+esc(T.ewc24Tag(s.tag))+'</h5>'+ewc24SeriesHTML(s)).join('')); if(!skipAnimation) await sleep(800); }
  const places=bracket.places.concat([{from:size/2+1, to:size/2+G, teams:thirds}, {from:size/2+G+1, to:size, teams:fourths}]);
  const placeOf=t=>{ const p=places.find(r=>r.teams.indexOf(t)>=0); return p ? p.from : size; };
  const myPlace=placeOf(you);
  card(T.ewc24Standings, ewc24TableHTML(places, you, Q.slots)+ewc24StatsHTML(you));
  const ranked=[].concat(...places.map(p=>p.teams));
  st.quals=Object.assign({}, st.quals, {[reg]:ranked.slice(0, Q.slots).map(t=>t===you ? 'YOU' : t.label)});
  st.played=Object.assign({}, st.played, {qual:true});
  if(myPlace<=Q.slots) st.you={via:'qual', reg, k:st.quals[reg].indexOf('YOU')};
  if(st.you) careerNews('good', 'ccNewsEwc24Ticket', [T.ewc24QTitle(reg)]);
  else careerNews('flat', 'ccNewsEvCash', [T.ewc24QTitle(reg), myPlace, ccNum(0)]);
  ewc24Finish(ev, T.ewc24QTitle(reg), myPlace, size, 0, !!st.you);
}
// ---- Эр-Рияд ----
async function runCareerEwc2024(ev){
  if(ev.ewc24==='dallas') return ewc24RunDallas(ev);
  if(ev.ewc24==='qual') return ewc24RunQual(ev);
  const cr=CAREER.career, T=L(), st=ewc24State();
  EWC24_LIVE_BIG=true;
  const rng=careerRng(ccHashStr('ewc24|'+cr.season+'|'+careerToday()));
  const allP=[].concat(...EWC24.teams.map(t=>t.p), ...EWC24.dallas.teams.map(t=>t.p), ...Object.values(EWC24.quals).map(q=>[].concat(...q.teams.map(t=>t.p))));
  const you=ewc24MyTeam(allP); if(!you) return;
  const card=ewc24Begin();
  // Кто держит путёвку слота: своя карьера (Dallas, отбор) или настоящая команда.
  const byName=n=>{
    const k=String(n).toLowerCase(), alias=EWC24.dallas.alias[n];
    const e=EWC24.teams.find(t=>t.n.toLowerCase()===k || (alias && t.n===alias));
    if(e) return {n:e.n, p:e.p};
    const d=EWC24.dallas.teams.find(t=>t.n.toLowerCase()===k); if(d) return d;
    for(const q of Object.values(EWC24.quals)){ const x=q.teams.find(t=>t.n.toLowerCase()===k); if(x) return x; }
    return null;
  };
  const used=new Set(), teams=[];
  EWC24.teams.forEach(slot=>{
    const v=slot.via;
    let who=v[0]==='dallas' ? (st.dallas||[])[v[1]-1] : ((st.quals||{})[v[1]]||[])[v[2]];
    // Своя команда — только в слоте своей путёвки (st.you); чужой «YOU» в списке — настоящая команда слота.
    const mySlot=st.you.via==='dallas' ? (v[0]==='dallas' && v[1]===st.you.place) : (v[0]==='qual' && v[1]===st.you.reg && v[2]===st.you.k);
    if(!who || (who==='YOU' && !mySlot)) who=slot.n;
    if(mySlot) who='YOU';
    if(who==='YOU'){ you.g=slot.g; teams.push(you); used.add('you'); return; }
    let src=byName(who);
    if(!src || used.has(src.n.toLowerCase())) src={n:slot.n, p:slot.p};
    if(used.has(src.n.toLowerCase())){
      // Взятый дважды — следующий в отборе этого слота.
      const pool=v[0]==='qual' ? EWC24.quals[v[1]].teams : EWC24.dallas.teams;
      src=pool.find(t=>!used.has(t.n.toLowerCase())) || src;
    }
    used.add(src.n.toLowerCase());
    const t=ewc24Team(src, you, slot.r); t.g=slot.g; teams.push(t);
  });
  if(teams.indexOf(you)<0) return;
  const groupOf=g=>teams.filter(t=>t.g===g);
  card(T.ewc24Title, '<div class="stage-detail">'+esc(T.ewc24Intro)+'</div>'+ewc24RosterLine(you)+
    '<div class="stage-detail">'+esc(st.you.via==='dallas' ? T.ewc24ViaDallas(st.you.place) : T.ewc24ViaQual(st.you.reg))+'</div>');
  if(!skipAnimation) await sleep(700);
  const gRes={};
  for(const g of ['A','B','C','D']){
    const r=await ewc24Group(groupOf(g), rng); gRes[g]=r;
    if(r.order.indexOf(you)>=0){
      card(T.ewc24Group(g), r.series.map(ewc24SeriesHTML).join('')+'<div class="ewc-table">'+r.order.map((t,i)=>'<div class="'+(t===you?'you':'')+'"><i>'+(i+1)+'</i>'+ewc24Nm(t)+(i<2?' <em>'+esc(T.ewc24Through)+'</em>':'')+'</div>').join('')+'</div>');
      if(!skipAnimation) await sleep(900);
    }
  }
  const g1=g=>gRes[g].order[0], g2=g=>gRes[g].order[1];
  const qf=[];
  for(const [x, y] of [['A','B'], ['D','C'], ['B','A'], ['C','D']]) qf.push(await ewc24Play(g1(x), g2(y), 7, rng, null, 'qf'));
  const sf=[await ewc24Play(qf[0].win, qf[1].win, 7, rng, null, 'sf'), await ewc24Play(qf[2].win, qf[3].win, 7, rng, null, 'sf')];
  const fin=await ewc24Play(sf[0].win, sf[1].win, 7, rng, null, 'final');
  if(qf.some(s=>s.A===you||s.B===you)){
    card(T.ewc24Playoffs, [T.ewc24Qf, T.ewc24Sf, T.ewc24Final].map((h,i)=>'<h5 class="ewc-h5">'+esc(h)+'</h5>'+([qf, sf, [fin]][i]).map(ewc24SeriesHTML).join('')).join(''));
    if(!skipAnimation) await sleep(900);
  }
  const place=new Map();
  place.set(fin.win, 1); place.set(fin.lose, 2);
  sf.forEach(s=>place.set(s.lose, 3)); qf.forEach(s=>place.set(s.lose, 5));
  ['A','B','C','D'].forEach(g=>{ place.set(gRes[g].order[2], 9); place.set(gRes[g].order[3], 13); });
  const ranked=teams.slice().sort((a,b)=>(place.get(a)||16)-(place.get(b)||16));
  const myPlace=place.get(you)||16;
  // MVP турнира: лучший игрок чемпиона (своя четвёрка — по убийствам-смертям за весь турнир).
  const champ=fin.win;
  const mvp=champ===you ? ewc24Best(you, rng, Object.entries(you.stats||{}).map(([h, s])=>({h, e:s.e, d:s.d}))) : ewc24Best(champ, rng, null);
  const meH=(careerCard()||{}).handle;
  const rowsP=[{from:1,to:1,teams:[fin.win]},{from:2,to:2,teams:[fin.lose]},{from:3,to:4,teams:sf.map(s=>s.lose)},{from:5,to:8,teams:qf.map(s=>s.lose)},
    {from:9,to:12,teams:['A','B','C','D'].map(g=>gRes[g].order[2])},{from:13,to:16,teams:['A','B','C','D'].map(g=>gRes[g].order[3])}];
  card(T.ewc24Standings, ewc24TableHTML(rowsP, you, 0)+'<div class="stage-detail ewc-mvp-line">'+esc(T.ewc24MvpTour(mvp, champ.label))+'</div>'+ewc24StatsHTML(you));
  careerMoneyAdd(ranked, (p, t)=>ewc24Pay(place.get(t)||16));
  const cash=ewc24Pay(myPlace);
  let mine=cash ? ccShareOf(cash, you) : 0;
  if(mine) ccPayIn(mine);
  if(mvp===meH){ ccPayIn(EWC24.mvp||50000); mine+=EWC24.mvp||50000; careerNews('good', 'ccNewsEwc24Mvp', [ccNum(EWC24.mvp||50000)]); }
  careerNews(cash ? 'good' : 'flat', 'ccNewsEvCash', ['Esports World Cup 2024', myPlace, ccNum(cash)]);
  if(myPlace===1) careerNews('good', 'ccNewsEwc24Champ', [you.label]);
  else if(champ.real) careerNews('flat', 'ccNewsWorldWon', ['Esports World Cup 2024', champ.label]);
  ewc24Finish(ev, 'Esports World Cup 2024', myPlace, 16, mine, cash>0);
}
/* ARENAS FIGHT NIGHT — сетка на 16 из игроков своего региона около твоего рейтинга, файты до пяти раундов.
   Шанс раунда — тот же, что у дружеского 1v1 (careerFriend1v1): 0.5 + 3% за очко рейтинга, 8–92%. Без лобби и зоны. */
const CC_FN_SIZE=16, CC_FN_TO=5;
function ccFnOvr(c){ return c && c._you ? c._ovr : (c && (c._ovr || (attrsFor(c)||{}).ovr)) || 70; }
function ccFnBracket(ev){
  const cr=CAREER.career, pl=CAREER.player;
  const mine=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  const rnd=careerRng(ccHashStr('fn|'+(cr.season||1)+'|'+careerToday()+'|'+(ev.n||1)));
  const meKey=pl.handle ? hKey(pl.handle) : '';
  const pool=(ccSceneRoster(ccCareerRegion())||[]).filter(c=>c && c.handle && hKey(c)!==meKey)
    .slice().sort((a,b)=>Math.abs(ccFnOvr(a)-mine)-Math.abs(ccFnOvr(b)-mine)).slice(0, 40);
  const field=[];
  while(field.length<CC_FN_SIZE-1 && pool.length) field.push(pool.splice(Math.floor(rnd()*pool.length), 1)[0]);
  const you={_you:true, handle:pl.nick||'You', _ovr:mine};
  // Посев по рейтингу: 1–16, 2–15, … — ты на своём месте по силе.
  const seeded=field.concat([you]).sort((a,b)=>ccFnOvr(b)-ccFnOvr(a));
  const order=[0,15,7,8,3,12,4,11,1,14,6,9,2,13,5,10].filter(i=>i<seeded.length).map(i=>seeded[i]);
  const rounds=[]; let alive=order, out=new Map();
  while(alive.length>1){
    const next=[], res=[];
    for(let i=0;i<alive.length;i+=2){
      const a=alive[i], b=alive[i+1];
      if(!b){ next.push(a); continue; }
      const p=clamp(0.5+(ccFnOvr(a)-ccFnOvr(b))*0.03, 0.08, 0.92);
      let x=0, y=0; while(x<CC_FN_TO && y<CC_FN_TO){ if(rnd()<p) x++; else y++; }
      const w=x>y ? a : b, l=x>y ? b : a;
      res.push({a, b, x, y}); next.push(w); out.set(l, alive.length);
    }
    rounds.push(res); alive=next;
  }
  out.set(alive[0], 1);
  // Место: чемпион 1, финалист 2, полуфинал 3, четвертьфинал 5, первый круг 9 (как «топ-N» сетки).
  const place=t=>{ const n=out.get(t); return n===1 ? 1 : n===2 ? 2 : n===4 ? 3 : n===8 ? 5 : 9; };
  return {you, rounds, place:place(you), champ:alive[0], size:order.length, rnd};
}
const CC_FN_ROUND=n=>n===16 ? 'R16' : n===8 ? 'QF' : n===4 ? 'SF' : 'F';
/* КАСТЕРЫ НА ВЕЧЕРЕ (17.10, его «9»): строка комментатора поверх карты, как эфир FNCS. Источник — те же кадры, что
   рисуют карту и живую таблицу (onZoneFrame): старт игры, новая зона, твои киллы, мясо в центре, финальные N, твой вылет,
   победа. Не чаще строки в CC_CAST_GAP кадров, кроме главных моментов (вылет, победа) — их не пропускаем. */
const CC_CAST_GAP=14;
let CC_CAST=null;
function ccCastName(t){ return String((t && (t.name || (t.squad && t.squad.map(c=>c.handle).join(' & ')))) || '').replace(/<[^>]*>/g, '').trim(); }
function ccCastSay(key, args, must){
  const S=CC_CAST; if(!S) return;
  if(!must && S.frame-S.lastAt<CC_CAST_GAP) return;
  const bank=L()[key]; if(!bank) return;
  const lines=Array.isArray(bank) ? bank : [bank];
  const f=lines[(S.n++ + S.seed)%lines.length];
  const text=typeof f==='function' ? f.apply(null, args||[]) : f;
  S.lastAt=S.frame;
  const feeds=[...document.querySelectorAll('.zr-feed')].filter(x=>x.offsetParent!==null);
  const wrap=(feeds[feeds.length-1]||{}).parentElement; if(!wrap) return;
  let el=wrap.querySelector('.cc-cast');
  if(!el){ el=document.createElement('div'); el.className='cc-cast'; wrap.appendChild(el); }
  el.textContent='🎙️ '+text;
}
function ccCastFrame(lobby, frame){
  if(!frame || !frame.dots) return;
  let alive=0; frame.dots.forEach(d=>{ if(d.alive) alive++; });
  const yi=lobby.findIndex(t=>t && t.isYou), yd=yi>=0 ? frame.dots[yi] : null;
  let S=CC_CAST;
  // Новая игра: живых стало больше или зона откатилась назад.
  if(!S || alive>S.alive || (frame.zone!=null && frame.zone<S.zone)){
    S=CC_CAST={frame:0, lastAt:-99, n:0, seed:ccHashStr(careerToday()+'|'+alive)%7, alive:alive, zone:frame.zone||0,
               yE:yd ? (yd.e||0) : 0, yAlive:!!(yd && yd.alive), final:false, done:false};
    ccCastSay('ccCastStart', [alive], true);
    return;
  }
  S.frame++;
  if(S.done) return;
  const you=yi>=0 ? ccCastName(lobby[yi]) : '';
  // Порядок — по важности: победа, твой вылет, финальные N, твои киллы, мясо, зона.
  if(alive===1){
    const wi=frame.dots.findIndex(d=>d.alive), w=lobby[wi];
    ccCastSay(w && w.isYou ? 'ccCastYouWin' : 'ccCastWin', [ccCastName(w)], true);
    S.done=true;
  } else if(yd && S.yAlive && !yd.alive){
    S.yAlive=false;
    ccCastSay('ccCastYouOut', [you, yd.p || alive+1], true);
  } else if(alive<=5 && !S.final){
    S.final=true; ccCastSay('ccCastFinal', [alive], true);
  } else if(yd && yd.alive && (yd.e||0)>S.yE){
    const k=(yd.e||0)-S.yE;
    ccCastSay(k>=2 ? 'ccCastYouMulti' : 'ccCastYouKill', [you, k], k>=2);
  } else if(S.alive-alive>=3){
    ccCastSay('ccCastWipe', [S.alive-alive, alive]);
  } else if(frame.zone!=null && frame.zone>S.zone){
    ccCastSay('ccCastZone', [frame.zone, alive]);
  }
  if(yd) S.yE=yd.e||0;
  S.alive=alive; if(frame.zone!=null) S.zone=frame.zone;
}
async function runCareerFightNight(ev){
  const cr=CAREER.career, pl=CAREER.player;
  skipAnimation=false; CC_SKIP_RUN=false;
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  CAREER_RUN=true;
  show('screen-results');
  const B=ccFnBracket(ev), you=B.you;
  const card=document.createElement('div'); card.className='stage-card';
  const rows=[]; let wins=0, games=0, rw=0, lastOpp=null;
  B.rounds.forEach(res=>{
    const m=res.find(r=>r.a===you || r.b===you); if(!m) return;
    const mineX=m.a===you ? m.x : m.y, theirX=m.a===you ? m.y : m.x, opp=m.a===you ? m.b : m.a;
    games++; rw+=mineX; if(mineX>theirX) wins++; lastOpp=opp;
    rows.push('<div>'+CC_FN_ROUND(res.length*2)+' · @'+esc(ccHandle(opp.handle))+' ('+Math.round(ccFnOvr(opp))+') — <b>'+mineX+'–'+theirX+'</b></div>');
  });
  card.innerHTML='<h4>'+esc((ev.name||'Arenas Fight Night')+' '+(ev.n||''))+'</h4><div class="stage-detail">'+rows.join('')+
    (B.place!==1 ? '<div>'+L().ccFnChamp(ccHandle(B.champ.handle))+'</div>' : '')+'</div>';
  document.getElementById('majorStages').appendChild(card);
  const cash=ccVictoryPayOf(ev, B.place);
  if(cash){ ccPayIn(cash); careerReachAdd(careerReachResult(B.place, B.size, cr.division, 'victory')); }
  // Файты учат файтам — как дружеский 1v1, но за вечер.
  if(!pl.attrs) pl.attrs=ccOwnAttrs();
  if(pl.attrs) ['aim','clu'].forEach(k=>{ pl.attrs[k]=clamp((pl.attrs[k]||50)+0.1*games, 35, 99); });
  careerNews(B.place===1 ? 'good' : 'flat', B.place===1 ? 'ccNewsFnWin' : 'ccNewsFnOut',
             [ev.name||'Arenas Fight Night', B.place, lastOpp ? ccHandle(lastOpp.handle) : '', wins]);
  cr.log=cr.log||[];
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:B.place, of:B.size, pts:rw, passed:cash>0,
               ovr:pl.ovr, games:games, wins:wins, elims:rw, avg:null, mate:null, mates:[], prize:cash, kind:'victory', solo:true, fight:true});
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:(ev.name||'Arenas Fight Night')+' '+(ev.n||''), place:B.place, through:cash>0,
    wins:wins, cash:cash, cut:0, byPlace:true, placed:0});
}
async function runCareerVictoryNight(){
  const cr=CAREER.career;
  const ev=careerVictoryOn(careerToday());
  if(!ev) return;
  // EWC 2024 — не батл рояль: свой движок серий 4 на 4 (runCareerEwc2024).
  if(ev.ewc24 && typeof runCareerEwc2024==='function') return runCareerEwc2024(ev);
  if(ev.fight) return runCareerFightNight(ev);
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('victory') : null;
  const solo=ev.mode==='solo';
  const me=careerCard();
  if(!me) return;
  /* The tenth runner, and the only one with a solo night in it.

     A solo cup is one player whatever the season is. The other one is the
     season's own squad, so in a trios year it is a trio — and the calendar
     calls it a trios cup to match. See ccVictoryCupName. */
  let mates=[], mate=null;
  if(!solo){
    mates=careerMates();
    if(mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
    mate=mates[0]||null;
  }

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  const prevSet=ACTIVE_LANDING_SET;
  CARD_MODE=true;
  squadSize=solo?1:careerSquadSize();
  drafted=solo?[me]:[me].concat(mates);
  // Three of the year's Victory Cups are Reload ones — the mode, not the
  // squad size — and they are played on the Reload island like the circuit is.
  // The rest play the season's island, not a hardcoded one: a trios year lives
  // on the Chapter 6 islands and its solo cup was the one night landing on the
  // Chapter 7 map. A player's report, 23 August. careerBrSet already knows the
  // season, and in a duos year it answers m2 like the old hardcode did.
  useLandingSet(ccEvLandingSet(ev));

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
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

  /* СОЛО-КАП В КОМАНДЕ — та же схема, что у Solo Series (см. runCareerSoloSeries):
     оба человека в одной сотне, в порядке ников, каждый со своим адресом
     вопросов (mpTag), и из сотни вычтены оба — и тёзки обоих. Скриншот: «diff 2 of 4900: #1 sky:102 vs scroll:102» — каждый клиент ставил
     себя первым, а напарника не помечал вовсе. */
  // В общей комнате гонки второй человек — соперник, той же дорогой (свой дроп, свой адрес).
  // (Гонка соперников в соло сажает сама, из строк гонки — ccRaceFieldSync; здесь только команда.)
  const pc=(solo && ccMpOn() && typeof MP!=='undefined' && MP.peer && hKey(MP.peer)!==hKey(me)) ? MP.peer : null;
  const soloYou=function(card, form, label){
    const t=careerTeam([card], true);
    t.pow=Math.round(t.pow+form);
    t.summitRegion=ccCareerRegion();
    t.name=label; t.mpTag=':'+hKey(card);
    return t;
  };
  let you, soloMate=null;
  if(pc){
    { const self=ccSoloSelf(me); you=soloYou(self.card, self.form, L().yourTeamPrefix+teamLabel(drafted)); }
    soloMate=soloYou(pc, Number(pc.formPow)||0, teamLabel([pc]));
    if(typeof ccRaceLock==='function' && ccRaceLock()){ soloMate.isRival=true; soloMate.raceId=(ccRaceRival()||{}).id||null; }
    else soloMate.isMate=true;
  } else {
    you=careerYouTeam(drafted);
    you.name=L().yourTeamPrefix+teamLabel(drafted);
  }
  you.isYou=true;
  // Мобильный вечер — сила только от мобильного рейтинга (ccMobileSelfPow), ПК-рейтинг, девайсы и бонусы ПК не участвуют.
  // До штрафа выезда: пинг на чужом сервере и на мобиле тот же.
  // Напарнику - его консоль и его мобильная сила с провода: прибавка только своей строке давала h106+108 у обоих наоборот.
  if(ccConsoleNeed(ev)==='mobile'){ you.pow=ccMobileSelfPow();
    if(soloMate && isFinite(Number(pc.mobPow))) soloMate.pow=Number(pc.mobPow); }
  else if(ccConsoleNeed(ev)){ const need=ccConsoleNeed(ev); you.pow+=ccConsoleDevBonus(need);
    if(soloMate) soloMate.pow+=Number((pc.conDev||{})[need])||0; }
  if(CC_AWAY) you.pow=Math.max(1, Math.round(you.pow-CC_AWAY.pen));   // чужой сервер: пинг (ccAwayPen)
  const humans=soloMate ? (hKey(me)<hKey(pc) ? [you, soloMate] : [soloMate, you]) : [you];
  /* Офлайн-турнир по приглашению (ev.invite — сколько человек там играло): одна комната
     приглашённых, сильнейших, как на ЛАНах карьеры; одна серия игр, деньги за место по таблице
     турнира; второго раунда нет. */
  const lanN=ev.invite ? (solo ? ev.invite : Math.max(2, Math.round(ev.invite/careerSquadSize()))) : 0;
  // FNCS Trial — одна сессия: второго раунда нет, ступень по месту в ней (ccPlacementApply).
  // Кап в одно окно у Epic (ccCupRounds — Solo Cash Cup 2019–20, дейли, капы 2021) — один раунд,
  // деньги по месту сразу, как у ЛАНа.
  const oneRound=!lanN && !ev.single && (!!(ev.pay || ev.payT) && ccCupRounds(ev)===1 || !!ev.ownQual);
  // Victory Cash Cup из архива платит за победы (ccVicPerWin), не за место.
  const byWins=!lanN && ccVicPerWin(ev)>0;
  const vicPay=function(ranked){ return function(place){ return byWins ? ccVicWinsCash(ev, (ranked[place-1]||{}).wins, ccVictoryTeamSize(ev)) : ccVictoryPayOf(ev, place); }; };
  // Очки раундов — как у Epic в этом капе (ccCupScore); у ЛАНов и своих событий — прежняя таблица.
  // Этапы Mobile Series (хит, квал, группы, полуфинал) — комнаты по приглашению, но очки и число игр у них Epic'овы.
  const vSc1=(lanN && !ev.series) ? null : ccCupScore(ev, 1), vSc2=lanN ? null : ccCupScore(ev, 2);
  /* Число игр — тоже Epic'ово (MatchCap окна в CC_CUP_SCORE, третье/четвёртое поле): Solo Victory Cup S41 — 8 в раунде 1,
     Duos S39 — 7, Solo Cash Cup 2023/2025 — 10 и 10. Было 6 (раунд 1) и 3/6 (раунд 2) на все капы. Нет числа — как было. */
  const capOk=n=>n>0 && n<=15;
  const vG1=(ev.ownQual && capOk(ev.games)) ? ev.games : (vSc1 && capOk(vSc1.cap)) ? vSc1.cap : CC_VICTORY_R1_GAMES;
  // Игр в комнате: ЛАН — своё число (ev.games), этап Mobile Series — Epic'ово (vG1), чемпионат серии — 25.
  const vGames=ev.series==='champ' ? ev.games : (lanN && !ev.series) ? (ev.games||6) : vG1;
  const vSize=lanN || careerVictoryField(solo), vCut=(lanN || ev.single || oneRound || ccIsMobSeries(ev)) ? 0 : careerVictoryCut(solo);
  const field=[...humans, ...(lanN ? (solo ? (ccConsoleNeed(ev)==='mobile' ? (ev.series ? ccMobileStageField(ev, vSize-humans.length) : ccMobileField(vSize-humans.length, true)) : careerSoloField(cr, pc ? [me, pc] : drafted, vSize-(humans.length-1), false, 'final'))
                                           : careerCupField(cr, drafted, vSize, 'lan|'+ev.id, false, CC_FIELD_SHARP.lan))   // size — вместе со мной (было vSize-1: Katowice 49 пар из 50, 21.10)
                             : solo ? (ccConsoleNeed(ev)==='mobile' ? ccMobileField(vSize-humans.length)   // мобильная сцена (ровно столько, без места под себя)
                                         : careerSoloField(cr, pc ? [me, pc] : drafted, vSize-(humans.length-1), true))
                                    : careerCupField(cr, drafted, vSize, null, true))];
  // Финал своего турнира: прошедшие квалы, кого нет на сцене — добор обычным полем ЛАНа.
  if(ev.finalOf){
    const room=lanN-humans.length, own=ccOwnFinalField(ev, room)||[];
    if(own.length){
      const keyOf=t=>(t.squad||[]).map(c=>hKey(c)).sort().join('+'), seen=new Set(own.map(keyOf));
      const rest=field.slice(humans.length).filter(t=>!seen.has(keyOf(t))).slice(0, Math.max(0, room-own.length));
      field.splice(humans.length, field.length-humans.length, ...own, ...rest);
    }
  }

  /* Чемпионат Mobile Series (LAN): 25 игр за два дня, очки 25…1 + 2 за элим, матч-пойнт после первого дня — 150% очков
     лидера; первый, кто был на линии и выиграл игру, чемпион, дальше не играют (rcMatchPoint). */
  const mobCh=ev.series==='champ';
  let mobLine=0;
  /* Reshuffle (ev.reshuffle, Red Bull, Вена 2026): Reload Duos, но пара в КАЖДОЙ игре новая,
     по жребию; таблица у каждого своя — очки игры получают оба из пары, элимы делятся. */
  if(ev.reshuffle){
    field.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    const prevSq=squadSize, prevDr=drafted, games=ev.games||6;
    const rng=careerRng(ccHashStr('reshuffle|'+ev.id+'|'+careerToday()));
    squadSize=2;
    for(let g=0; g<games; g++){
      const pool=field.slice();
      for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
      const duos=[];
      for(let i=0;i+1<pool.length;i+=2){
        const a=pool[i], b=pool[i+1], mine=(a===you || b===you);
        /* ВДВОЁМ (команда за настоящих игроков, 20.10: Reshuffle 19.08, «rezon ay+swizzy:103 vs 111»):
           свою пару клиент считал своей командой, с личными прибавками, а пару напарника — ботом, и у
           напарника наоборот. Пара, где стоит кто-то из двоих живых, у обоих собирается одинаково:
           careerTeam, живой первым, двое живых — по нику. */
        const humanIn=soloMate && (mine || a===soloMate || b===soloMate);
        let cards=mine ? [(a===you?a:b).squad[0], (a===you?b:a).squad[0]] : [a.squad[0], b.squad[0]];
        if(humanIn){
          const isH=x=>x===you || x===soloMate;
          const both=isH(a) && isH(b);
          cards=(both ? [a, b].sort((x,y)=>hKey(x.squad[0])<hKey(y.squad[0]) ? -1 : 1) : (isH(a) ? [a, b] : [b, a])).map(x=>x.squad[0]);
        }
        const t=(mine && !humanIn) ? careerYouTeam(cards) : careerTeam(cards, false, true);
        if(mine){ t.isYou=true; t.name=L().yourTeamPrefix+teamLabel(cards); drafted=cards; }
        else if(!t.name) t.name=teamLabel(cards);   // пара по жребию без имени роняла simulateGame (Reshuffle, 29.09)
        t._of=[a, b]; duos.push(t);
      }
      await simulateGamesLive(duos, 1, victoryR1Points, CC_VICTORY_R1_KILL, 'stage', 0, null, null,
        {lobbySize:duos.length, stageName:ev.lan+' · '+(g+1)+'/'+games,
         mapReplay:true, choices:true, stopOnYourDeath:true});
      duos.forEach(t=>(t._of||[]).forEach(p=>{
        // Элимы пары — по долям, как в катке (Notion 13.10: «общие киллы просто на 2 делятся»).
        p.stagePts+=t.stagePts||0; p.stageElims+=Math.round(ccMemberKills(t, p.squad[0]));
        if(t.wins) p.wins=(p.wins||0)+t.wins;
        // Журнал игры — строкой этой игры у каждого из пары (карточка вечера читает stageLog).
        (t.stageLog||[]).forEach(e=>p.stageLog.push(Object.assign({}, e, {game:g+1})));
      }));
    }
    squadSize=prevSq; drafted=prevDr;
  } else
  // Round 1: placement and kills both pay — по правилам Epic этого капа, если они есть.
  await simulateGamesLive(field, vGames, mobCh ? (p=>CC_MOBSER_CHAMP_PTS[p-1]||0) : vSc1 ? vSc1.pts : victoryR1Points,
    mobCh ? CC_MOBSER_CHAMP_KILL : vSc1 ? vSc1.kill : CC_VICTORY_R1_KILL,
    'stage', 0, null, null,
    {lobbySize:ccVictoryLobby(ev, solo), stageName:lanN ? (ev.lan||ev.name) : L().ccVicR1Live,
     mapReplay:true, choices:true, stopOnYourDeath:true,
     days: mobCh ? ev.day1 : 0,
     stopWhen: mobCh ? (function(ts, g){
       if(g===ev.day1) mobLine=Math.round(CC_MOBSER_CHAMP_MP*Math.max.apply(null, ts.map(t=>t.stagePts||0)));
       return mobLine>0 && !!rcMatchPoint(ts, mobLine).champ; }) : null,
     together: soloMate ? humans : null,
     /* ЛАН и комнаты этапов по приглашению (lanN) — одна комната сильнейших, как финал: точку выбирают, и перед
        первой игрой видна карта высадок комнаты (его вопрос 19.11: «почему нет карты перед финалами»).
        Открытый первый раунд капа — по-прежнему раздача. */
     dropEachGame: lanN ? ((g,room)=>soloMate ? ccSoloDrops(room||field, humans, ev.lan||ev.name, ['victory'])
                                              : careerLandingPick(room||field, you, ev.lan||ev.name, ['victory'])) : undefined});
  let mobChamp=null, mobGames=0;
  if(mobCh && mobLine>0){
    const mp=rcMatchPoint(field, mobLine);
    if(mp.champ){
      mobChamp=mp.champ; mobGames=mp.games;
      field.forEach(t=>{ const log=(t.stageLog||[]).slice(0, mp.games); t.stageLog=log;
        t.stagePts=log.reduce((s,e)=>s+(e.pts||0), 0); t.stageElims=log.reduce((s,e)=>s+(e.elims||0), 0);
        t.wins=log.filter(e=>e.place===1).length; });
    }
  }
  const ranked1=field.slice().sort((a,b)=>(b===mobChamp)-(a===mobChamp) || b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place1=ranked1.indexOf(you)+1;
  careerPrAdd(ranked1, {div:CAREER.career.division, kind:'victory'});
  /* Итоговая таблица вечера: второй раунд, если он был. Доска лидеров идёт
     после него, иначе она объявляла бы лидеров посреди турнира. */
  let vicFinal=ranked1;
  const through=!lanN && place1<=vCut;
  // ЛАН платит за место единственной серии — сразу, до карточки.
  const lanCash=(lanN || oneRound) ? vicPay(ranked1)(place1) : 0;
  const ownCut=ev.ownQual ? ccOwnQualDone(ev, ranked1, you) : 0;
  if(lanN || oneRound) careerMoneyAdd(ranked1, vicPay(ranked1));

  const shell1=createStageCardShell(lanN ? (ev.lan||ev.name)+' — '+field.length : oneRound ? (ev.name||'Cash Cup')+' — '+field.length : L().ccVicR1Title(field.length));
  await revealStageLog(you, shell1, true);
  finalizeStageCard(shell1, place1, field.length, you.stagePts, (lanN || oneRound) ? lanCash>0 : through, false,
    ev.ownQual ? (place1<=ownCut ? L().ownQualIn(ownCut) : L().ownQualOut(ownCut))
         : ccIsMobSeries(ev) && ccMobSerCut(ev) ? ccMobSerNote(ev, place1)+(lanCash ? ' · '+L().ccVicPlaceCash(place1, lanCash) : '')
         : (lanN || oneRound) ? (lanCash ? L().ccVicPlaceCash(place1, lanCash) : L().ccWfNoCash)
         : ev.single ? L().lfNewsPlaced(ccTrialDiv(ev, place1, field.length))
         : through ? L().ccVicPass(vCut)
         : ev.placement ? L().lfNewsPlaced(ccPlacementDivOf(false, null, vCut, ev, place1, field.length))
         : L().ccVicFail(vCut));
  await revealStandings(shell1, ranked1, you, ownCut || vCut, null, null,
    (lanN || oneRound) ? vicPay(ranked1) : null, null, lanN || oneRound);

  // cash — на игрока: соло-кап платит одному, дуо/трио — составу.
  const rate=ev.skin ? 0 : ev.cash ? ev.cash*(solo ? 1 : careerSquadSize()) : (solo ? CC_VICTORY_CASH_SOLO : CC_VICTORY_CASH_DUO);
  // Кап с таблицей мест (Duos Cash Cup 2024): шесть игр, очки как в первом раунде, деньги по месту.
  // Placement Cup считает место (очки за место и элимы), как кап с таблицей, только без денег.
  const payCup=!!(ev.pay || (ev.payT && !byWins) || ev.placement);
  let wins=0, cash=lanCash, place2=null;
  /* ВТОРОЙ РАУНД В ОБЩЕЙ КОМНАТЕ — ТОЛЬКО ЕСЛИ ПРОШЛИ ВСЕ ЛЮДИ.
     Второй раунд идёт только у прошедшего (through). Вылетевший в первом заканчивал
     вечер, а его соперник вставал на барьере седьмой игры и, дождавшись «peer done»,
     доигрывал один — скриншоты, «разошлись на игре 7 · peer ahead» и
     «peer done · q drop», всегда на границе раундов. Проба с зрителем (вылетевший
     досчитывает комнату прошедших) разошлась на первом же вопросе высадки: зритель и
     игрок идут по разным веткам. Поэтому проще и честнее: кого-то из людей нет во
     втором раунде — прошедшие доигрывают его сами, без локстепа (соперника в этой
     комнате и так нет), а вылетевший закрывает вечер как обычно. Первый раунд у всех
     общий, как и был. */
  if(typeof ccRaceLock==='function' && ccRaceLock()){
    const top=ranked1.slice(0, vCut);
    const rivalOut=ccRaceNightRoom().some(p=>!top.some(t=>t.mpTag===':'+hKey(p.card)));
    if(!through || rivalOut) ccRaceNightApart();
  }
  /* И В КОМАНДЕ (соло-кап вдвоём, командный год 20.10: S39/S40 Solo Victory Cup — второй раунд
     прошедшего был только у него в досках). Общая часть уже посчитана обоими, хвост — его. */
  if(soloMate && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn())){
    const mateOut=!ranked1.slice(0, vCut).includes(soloMate);
    /* Врозь — оба, как в гонке: вылетевший тоже не ждёт общего закрытия вечера, которого у прошедшего уже нет
       (онлайн-прогон 2020 года, 21.10: DreamHack Online Open 23.08 — вылетевший стоял на экране итогов, перемотка встала). */
    if(through===mateOut) ccTeamNightApart();
  }
  if(through){
    const r2=ranked1.slice(0, vCut);
    // Комната прошедших — свои единицы (соло: CC_ZONE_OPEN_SOLO_R2; дуо — как в первом).
    ccZoneTuneRound('victory', 2, {mode:solo?'solo':undefined});
    /* Второй раунд — уже не Опен, а комната прошедших, и точка в ней
       выбирается. Первый так и остаётся раздачей: он открыт всему региону. */
    const zones2=null;
    // Соло вдвоём: у каждого своя высадка, адресно (ccSoloDrops), и оба в одной комнате.
    const humans2=humans.filter(h=>r2.indexOf(h)>=0);
    /* Раунд 2 по правилу Epic: у денежного капа — своё правило раунда (S19–S21: те же места,
       элим за два), иначе как в раунде 1; у Victory — «только победа», как было. */
    const r2Sc=(payCup || byWins) ? (vSc2 || vSc1) : null;
    await simulateGamesLive(r2, (vSc2 && capOk(vSc2.cap)) ? vSc2.cap : (payCup ? 6 : CC_VICTORY_R2_GAMES),
      r2Sc ? r2Sc.pts : payCup ? victoryR1Points : victoryR2Points, r2Sc ? r2Sc.kill : payCup ? CC_VICTORY_R1_KILL : 0, 'stage', 0, null, zones2,
      {lobbySize:ccVictoryLobby(ev, solo), stageName:L().ccVicR2Live,
       mapReplay:true, choices:true, stopOnYourDeath:true,
       roomOnly:true,   // комната прошедших: вылетевших людей в неё не досаживать (ccRaceFieldSync)
       together: (soloMate && humans2.length>1) ? humans2 : null,
       dropEachGame:(g,room)=>soloMate ? ccSoloDrops(room||r2, humans2, L().ccVicR2Live, ['victory'])
                                       : careerLandingPick(room||r2, you, L().ccVicR2Live, ['victory'])});
    /* Тем же ключом, каким считается любой другой вечер: очки, победы, элимы.
       Здесь стояло только «очки, победы» — а раунд платит ТОЛЬКО за победы, то
       есть у сорока с лишним команд из пятидесяти и очков ноль, и побед ноль.
       Сортировка стабильная, поэтому вся нижняя половина таблицы оставалась в
       том порядке, в каком её посадили в лобби: его снимок от 26 августа — два
       разных вечера, и в обоих одни и те же восемь дуо на местах 43-50 подряд,
       причём команда с шестью элимами стояла ниже команды с нулём. */
    const ranked2=careerRankField(r2);
    vicFinal=ranked2;
    // Тройка и MVP в итоге вечера — по второму раунду, как таблица этапа над ними; своя оценка остаётся за вечер.
    try{ const nr2=ccNightRate(ranked2); if(nr2 && CC_NIGHT_RATE){ ['podium','mvp','mvpYou','mvpCard'].forEach(k=>{ CC_NIGHT_RATE[k]=nr2[k]; }); } }catch(e){}
    place2=ranked2.indexOf(you)+1;
    wins=you.wins||0;
    cash=payCup ? ccVictoryPayOf(ev, place2) : byWins ? vicPay(ranked2)(place2) : wins*rate;
    // Not a placement table: every team in the lobby is paid for the games it
    // won, so the cheque is read off the team rather than off its row.
    if(payCup || byWins) careerMoneyAdd(ranked2, payCup ? function(place){ return ccVictoryPayOf(ev, place); } : vicPay(ranked2));
    else careerMoneyAdd(r2, function(_place, t){ return (t.wins||0)*rate; });
    const shell2=createStageCardShell(L().ccVicR2Title(r2.length));
    await revealStageLog(you, shell2, true);
    /* Placement Cup денег не платит — его итог ступень (аудит 29.09: карточка писала «без денег» и красным). */
    const pDiv2=ev.placement ? ccPlacementDivOf(true, place2, vCut, ev, place1, field.length) : 0;
    finalizeStageCard(shell2, place2, r2.length, you.stagePts, ev.placement ? pDiv2<ccDivCount() : cash>0, false,
      ev.placement ? L().lfNewsPlaced(pDiv2)
      : payCup ? (cash ? L().ccVicPlaceCash(place2, cash) : L().ccWfNoCash) : (wins ? L().ccVicCash(wins, cash) : L().ccVicNoWin));
    // Колонка «Приз» у кэш-капа — сколько взяло каждое место (его правка 28.09: «призы у
    // каждого не пишутся в таблице второго раунда»). Кап за победы платит не по месту — без колонки.
    await revealStandings(shell2, ranked2, you, 0, null, null,
      payCup ? function(place){ return ccVictoryPayOf(ev, place); } : byWins ? vicPay(ranked2) : null, null, true);
  }
  removeSkipButton();
  // Посев: итог вечера ставит ступень дивизиона.
  const placedDiv=ev.placement ? ccPlacementApply(through, place2, vCut, ev, place1, field.length) : 0;
  /* У записи капа нет label — имя вечера живёт в календаре (DreamCup, Squid
     Grounds, «Duos Victory Cup 2»). Без него пост аналитика выходил
     «undefined — stats leaders». */
  const vicName=((careerYearDays().get(ev.day)||[]).find(x=>x.kind==='victory')||{}).label || ev.lan || ev.name || 'Victory Cup';
  ccBoardAfter(vicFinal, you, vicName);

  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
    careerReachAdd(careerReachResult(1, field.length, cr.division, 'victory'));
    careerNews('good', 'ccNewsVicCash', [wins, cash]);
  } else if(through){
    careerNews('flat', 'ccNewsVicNoWin');
  } else if(!ev.placement){
    careerNews('flat', 'ccNewsVicOut', [place1, field.length]);
  }

  if(ev.skin) ccSkinCupAfter(ev, place1, field.length);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  // Мобильный вечер ПК-рейтинг не качает: у мобила свой (ccMobileGrow).
  if(ccConsoleNeed(ev)!=='mobile') careerGrowEvent(place2||place1, through?vCut:field.length, you, field);
  /* Строка журнала — на КАЖДОГО из людей, с обеих сторон, в одном порядке:
     журнал общий, и две разные строки от двух клиентов перетёрли бы друг
     друга при закрытии (как в Solo Series). В одиночной — одна, своя. */
  const ranked2v=through ? careerRankField(ranked1.slice(0, vCut)) : null;
  humans.forEach(function(t){
    const isMe=(t===you);
    const tThrough=ranked1.indexOf(t)<vCut;
    const tPlace2=(tThrough && ranked2v) ? ranked2v.indexOf(t)+1 : null;
    // Кап с таблицей мест платит за место второго раунда, а не за победы — и журнал пишет то же.
    // Кап в один раунд платит за место этого раунда, как ЛАН (аудит 29.09: журнал писал $0 и «не прошёл»).
    const tCash=(lanN || oneRound) ? vicPay(ranked1)(ranked1.indexOf(t)+1)
               : payCup ? (tPlace2 ? ccVictoryPayOf(ev, tPlace2) : 0)
               : byWins ? (tThrough ? ccVicWinsCash(ev, t.wins, ccVictoryTeamSize(ev)) : 0) : (t.wins||0)*rate*(tThrough ? 1 : 0);
    const placesT=(t.stageLog||[]).map(g=>g.place);
    cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:tPlace2||(ranked1.indexOf(t)+1),
               of:tThrough?vCut:field.length, pts:t.stagePts, passed:tThrough || ((lanN || oneRound) && tCash>0),
               ovr: isMe ? CAREER.player.ovr : Math.round((pc && (pc._targetOvr||pc.rating))||0),
               games:lanN ? (mobGames||vGames) : tThrough?vG1+((vSc2 && capOk(vSc2.cap)) ? vSc2.cap : (payCup ? 6 : CC_VICTORY_R2_GAMES)):vG1,
               wins:t.wins||0, elims:t.stageElims||0,
               avg: placesT.length ? Math.round(placesT.reduce((s,v)=>s+v,0)/placesT.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(tCash, t), kind:'victory', solo:solo, own: ev.own ? true : undefined,
               who: soloMate ? t.mpTag.slice(1) : undefined});
  });
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked1);
  if(ccConsoleNeed(ev)==='mobile'){ ccMobileGrow(place2||place1, field.length); ccMobileSceneGrow(evRanked1ForMobile(field));
    const nx=ccMobSeriesAfter(ev, place2||place1, field.length);
    if(nx) careerNews('good', 'ccNewsMobSer', [L().ccMobSerStage(nx)]); }   // мобильные рейтинги от мест
  // Выезд в чужой регион день не берёт: свой вечер того же дня остаётся (ccAwayPlay). Свой — ставит часы (ccAwayHomeDone).
  // Чемпионат Mobile Series — два дня ЛАНа.
  if(!CC_AWAY){ ccAwayHomeDone(careerToday(), 'victory'); careerAdvanceTo(ccAddDays(careerToday(), ev.series==='champ' ? 2 : 1)); }
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:(ev.name ? ev.name : ev.mode==='duo'?ccVictoryCupName():L().calVictorySolo)+' '+ev.n,
    place:place2||place1, through: placedDiv ? placedDiv<ccDivCount() : (through || ((lanN || oneRound) && cash>0)), wins:wins, cash:cash, cut:vCut,
    byPlace:!!(lanN || oneRound || payCup), placed:placedDiv||0});
}

/* Solo Series (S39, January, all seven regions), from Tracker pages (EU Heats S1 and Finals Day 2,
   plus the other regions' payouts).
     Qualifiers  4 weekly sessions of 10 matches, best week counts; top 400 (EU, NAC) or 200 advance, snake-seeded.
     Heats       rooms of 100, 6 matches; VR = 947 so a win sums to 1,000 (instant qualify), plus top 25 (50 small regions).
     Finals      100 players, 12 matches over two days, cash to top 100 (75 / 50 in smaller pots).
   Scoring is victoryR1Points, elims 3. A career plays the last qualifier session (the first three were
   in December), one heat and the final in one sitting, like the Globals. */
const CC_SOLO_QUAL_GAMES=10, CC_SOLO_HEAT_GAMES=6, CC_SOLO_FINAL_GAMES=12;
const CC_SOLO_KILL=3, CC_SOLO_FIELD=100;
// Epic splits the world in two: EU and NAC play big rooms and tighter cuts.
function ccSoloBigRegion(){ const r=ccCareerRegion(); return r==='EU'||r==='NAC'; }
function soloSeriesHeatCut(){ return ccSoloBigRegion() ? 25 : 50; }
// Epic's top 400/200 belonged to the real ladder; the share is what carries
// to the career's smaller room — the same arithmetic ccReloadOpenCut does.
function soloSeriesQualCut(){
  const room=careerVictoryField(true);
  return Math.max(25, Math.round(room*(ccSoloBigRegion()?400:200)/(CC_LADDER_TRUE*2)));
}
/* Соло-хиты той же сеткой, что всё соло: победа 60, второе 53, десятое 41, 25-е 26, 50-е 1, ниже ноль,
   килл CC_SOLO_KILL. Раньше победа стоила 1000 (двадцать вторых мест), и две победы при четырёх смертях
   на высадке выходили на первое место. */
/* 29.10 КАК У EPIC (его «сделай как у эпиков»): победа в хите снова 1000 очков — сетка Epic (Tracker, Solo Series
   Heats Session 1 EU) кладёт 947 в первую строку, чтобы победа давала ровно их порог в 1000. Сняли её 27.08, потому что
   победитель играл дальше и две победы с четырьмя смертями выигрывали таблицу; с тех пор хит играется stopOnWin —
   после победы игр больше нет, двух побед не бывает, и бонус снова делает то, что у Epic: ставит прошедшего наверх.
   Остальные места — общая соло-сетка (victoryR1Points). */
const SOLO_HEAT_WIN=1000;
function soloHeatsPoints(place){ return place===1 ? SOLO_HEAT_WIN : victoryR1Points(place); }
/* Два острова круга Reload, по очереди — отзыв: «1 игра
   слюрпи, другая стронхолд».

   На диске их два: капы 1-2 играются на одном (art/map-reload-a.jpg, наборы
   r1 и r2), капы 3-4 на другом (map-reload-b.jpg, r3 и r4). Вечер брал один и
   держал его все игры. Теперь нечётные игры идут на своём острове капа, чётные
   — на втором; какой набор представляет второй остров, решает картинка, а не
   номер, поэтому r2 честно уводит на r3, а r4 — на r1. */
function ccRelIsland(set, game){
  const own=ZONE_SETS[set] ? set : 'r1';
  const other=['r1','r3'].find(x=>MAP_ART[x]!==MAP_ART[own]) || own;
  return (game%2===1) ? own : other;
}
/* Every region's own cheque, read off Tracker on 23 August 2026 —
   [place-or-below, USD], first row that fits pays. NAW and Brazil share a
   table, as do Asia, the Middle East and Oceania; that is Epic's own
   grouping, not a shortcut. */
const CC_SOLO_PRIZES={
  EU:  [[1,15000],[2,10000],[3,9000],[4,8000],[5,7000],[6,6000],[7,5000],
        [8,4000],[9,3000],[10,2000],[25,1000],[50,750],[75,500],[100,250]],
  NAC: [[1,10000],[2,8000],[3,6000],[4,5000],[5,4000],[6,3000],[7,2500],
        [8,2000],[9,1500],[10,1000],[25,750],[50,500],[75,300],[100,200]],
  NAW: [[1,4000],[2,2000],[3,1000],[5,750],[10,500],[25,400],[50,300],[75,200]],
  ASIA:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]]
};
CC_SOLO_PRIZES.BR=CC_SOLO_PRIZES.NAW;
CC_SOLO_PRIZES.ME=CC_SOLO_PRIZES.ASIA;
CC_SOLO_PRIZES.OCE=CC_SOLO_PRIZES.ASIA;
function soloSeriesPrize(place){
  const t=CC_SOLO_PRIZES[ccCareerRegion()]||CC_SOLO_PRIZES.EU;
  const row=t.find(r=>place<=r[0]);
  return row ? row[1] : 0;
}
/* ---- FNCS Solos 2026 -----------------------------------------------------

   Второй соло-турнир года и совсем другой турнир, чем январская Solo Series:
   правила Epic от 1 сентября 2026, шесть стадий, октябрь, и деньги вчетверо
   больше. Он не переиспользует состояние январского (cr.solo) — у них разные
   стадии и разный проход, и одно поле на двоих означало бы, что январский
   финал закрывает октябрьские хиты. Своё состояние — cr.solos.

   Таблицы призовых — Attachment C тех же правил, все семь регионов, по одной
   строке на ступень: [место-или-выше, USD], платит первая подходящая строка.
   Азия, Ближний Восток и Океания делят таблицу — это группировка самого Epic,
   а не сокращение; Бразилия и NAW в этом турнире разошлись, поэтому у них
   таблицы разные (в январском они были общие). */
const CC_SOLOS_PRIZES={
  EU:  [[1,60000],[2,40000],[3,25000],[4,15000],[5,12500],[6,10000],[7,9000],
        [8,8000],[9,6000],[10,5000],[11,4000],[12,3000],[13,2500],[14,2000],
        [15,1500],[20,1250],[25,1000],[50,750],[75,500],[100,300]],
  NAC: [[1,50000],[2,30000],[3,20000],[4,10000],[5,8000],[6,6000],[7,5000],
        [8,4000],[9,3000],[10,2500],[11,2000],[12,1750],[13,1500],[14,1250],
        [15,1000],[20,750],[25,500],[50,400],[75,300],[100,200]],
  NAW: [[1,12500],[2,8000],[3,6000],[4,4000],[5,3000],[6,2000],[7,1500],
        [8,1250],[9,1000],[10,750],[20,500],[50,300],[75,200],[100,150]],
  BR:  [[1,15000],[2,10000],[3,7500],[4,5000],[5,4000],[6,3000],[7,2000],
        [8,1500],[9,1000],[10,750],[20,500],[50,300],[75,200],[100,150]],
  ASIA:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[6,1250],[7,1000],
        [8,750],[9,500],[10,400],[20,300],[50,200],[100,100]]
};
CC_SOLOS_PRIZES.ME=CC_SOLOS_PRIZES.ASIA;
CC_SOLOS_PRIZES.OCE=CC_SOLOS_PRIZES.ASIA;
function solosPrize(place){
  const t=CC_SOLOS_PRIZES[ccCareerRegion()]||CC_SOLOS_PRIZES.EU;
  const row=t.find(r=>place<=r[0]);
  return row ? row[1] : 0;
}
/* Кап дивизиона в соло-год (размер 1): очки как в финале FNCS Solos 2026 (сетка мест victoryR1Points, 4 за элим),
   призы по таблице того финала в регионе: Д1 целиком, каждый дивизион ниже вдвое меньше. Это решение, не данные Epic. */
function ccSoloDivCupOn(){ return typeof careerSquadSize==='function' && careerSquadSize()===1; }
const CC_SOLO_DIVCUP_DIV=20;
function ccSoloDivCupPrize(place, div){
  if(!ccSoloDivCupOn()) return 0;
  /* 22.11 (Notion: «чет много призов за див кап» - #1 Div 1 Cup платил $60 000, как финал FNCS Solos): кап дивизиона в
     соло-год - не финал, сетка финала делится на CC_SOLO_DIVCUP_DIV (решение, не замер: Epic такого формата не проводит;
     ориентир - денежный кап, где первое место около двух-трёх тысяч). Меньше $25 не платится. */
  const v=Math.round(solosPrize(place)/CC_SOLO_DIVCUP_DIV/Math.pow(2, Math.max(0, (div||1)-1)));
  return v>=25 ? Math.round(v/5)*5 : 0;
}
/* Стадии турнира, числа Epic'овы: Round 3 тысяча → топ-100 (в карьерной сотне топ-10), Fast Track сотня → топ-8, хит сотня, LCQ Final 70, финал сотня.
   Своё только топ-11 во втором круге: у Epic проходят 108 из тысячи (10,8%).
   games: матчей в вечере (финал 6+6 за два дня играется одной посадкой, как Глобалы). kill: цена элима по Attachment A (2 квал, 3 хиты и LCQ, 4 Fast Track и финал).
   Сетка мест общая, victoryR1Points (60 за 1-е, 53 за 2-е, 41 за 10-е, 1 за 50-е), совпадает с Attachment A.
   vr: победа в матче сразу в финал (Epic пишет за неё 1000 очков). seat: куда садится игрок по итогу вечера. */
/* Второй раунд квала считается по числам Epic, а не по глазомеру.

   Поле Round 2 — это ровно те, кого Epic провёл из Round 1: 8000 в Европе,
   4000 в NA Central, 2000 в остальных пяти регионах. Дальше идёт тысяча, и это
   тоже его число. Значит доля известна целиком — 1000 из 8000 в Европе, из
   4000 в NAC, из 2000 у остальных, — и в карьерной сотне она даёт 13, 25 и 50.
   Ничего не выдумано: обе цифры дроби напечатаны в правилах.

   (Round 1 так посчитать нельзя, и поэтому его тут нет: сколько человек в него
   заходит, Epic не публикует вовсе — только порог допуска «топ-200 000 Power
   Rankings», а это не поле.) */
const CC_SOLOS_R1_THROUGH={EU:8000, NAC:4000};
function solosR2Cut(){
  const adv=CC_SOLOS_R1_THROUGH[ccCareerRegion()]||2000;
  return Math.round(100*1000/adv);
}
/* ROUND 1 (29.10, его выбор «оценка, с пометкой»). Правила Epic (сверка tools/measured/solos-2026-audit.md): квал 1 —
   28–29.09, квал 2 — 5–6.10, две сессии по 11 матчей в общий зачёт, 2 очка за элим, допуск — топ-200 000 PR, дальше
   проходят 8000 EU / 4000 NAC / 2000 остальные; топ-2000 PR может пропустить Round 1 и сразу играть Round 2 (сыграл
   Round 1 — пропуск сгорел). Сколько человек играет Round 1, Epic не публикует, Tracker закрыт, — ОЦЕНКА:
   проходит каждый пятый (CC_SOLOS_R1_SHARE) открытого поля карьеры (careerVictoryField(true), ~4900).
   Вечер — один, два дня по 11 игр с общей таблицей (twoDay, как финалы). */
const CC_SOLOS_R1_SHARE=0.2, CC_SOLOS_PR_SKIP=2000;
function solosR1Cut(){ return Math.max(1, Math.round(careerVictoryField(true)*CC_SOLOS_R1_SHARE)); }
// Топ-2000 доски PR — пропуск Round 1 (доска карьеры, своя строка — you).
function ccSolosPrSkip(){
  try{ const rows=careerPrRows(), i=rows.findIndex(r=>r.you); return i>=0 && i<CC_SOLOS_PR_SKIP; }catch(e){ return false; }
}
const CC_SOLOS_ORDER=['q1r1','q1r2','q1r3','fast','q2r1','q2r2','q2r3','heats','lcq1','lcqf','final'];
const CC_SOLOS_STAGES={
  q1r1: {games:22, kill:2, open:true, cut:solosR1Cut, pass:'q1r2', twoDay:true},
  q2r1: {games:22, kill:2, open:true, cut:solosR1Cut, pass:'q2r2', twoDay:true},
  q1r2: {games:11, kill:2, field:100, cut:solosR2Cut, pass:'q1r3'},
  q1r3: {games:11, kill:2, field:100, cut:10, pass:'fast'},
  fast: {games:4,  kill:4, field:100, cut:8,  pass:'final', rest:'heats'},
  q2r2: {games:11, kill:2, field:100, cut:solosR2Cut, pass:'q2r3'},
  q2r3: {games:11, kill:2, field:100, cut:11, pass:'heats'},
  // Победа в хите и в LCQ Final — 1000 очков (правила Epic, приложение A; Liquipedia — та же сетка), сверка 29.10.
  heats:{games:6,  kill:3, field:100, cut:29, vr:true, pass:'final', tail:[36,50], tailSeat:'lcqf', pts:soloHeatsPoints},
  /* Последний шанс — открытая комната, как январский квал: сколько человек в
     него заходит, Epic не называет («все, кто играл Round 1 и не прошёл»), а
     вот сколько выходит — называет, и это семьдесят. Поэтому поле берётся
     карьерное, открытое, а отсечка — Epic'ова, живьём. */
  // Поле LCQ Round 1 — по региону, той же долей, что выход из Round 1 у Epic (EU 8000, NAC 4000, остальные 2000; сверка 29.10).
  lcq1: {games:11, kill:2, open:true, cut:70, pass:'lcqf', fieldScale:()=>(CC_SOLOS_R1_THROUGH[ccCareerRegion()]||2000)/8000},
  // LCQ Final — «players: 100» (Liquipedia): 70 из LCQ Round 1 и 36–50-е обоих хитов. Было 70 (сверка 7.10).
  lcqf: {games:5,  kill:3, field:100, cut:17, vr:true, pass:'final', pts:soloHeatsPoints},
  final:{games:12, kill:4, field:100, cut:0,  prize:solosPrize}
};
/* FNCS Solo Reload, ноябрь 2026 — схемы Epic из поста 19.10. Поля и выходы с них:
   Round 2 — прошедшие Round 1 (4000 EU, 2000 NAC, 1000 остальные) + топ-1000 PR, дальше 500;
   Round 3 — 500, дальше 80; два хита по 40, из каждого 8 побед + 7 по очкам, 16–25-е в LCQ Final;
   LCQ Round 1 — все, кто играл квал, дальше 20; LCQ Final — 40, пять игр, 5 побед + 5 по очкам;
   финал — 40, десять игр. Очки — как в последних соло-турнирах Reload у Epic (его слово 20.10, «сделай поинт систему
   как в последних турнирах соло релоада»): Solo Reload Victory Cup S41/S42, правило ScoringRules ccCupScoreOf —
   60 за победу … 1 за 30-е, 2 за элим, не больше 10 элимов за матч; квалы — 10 матчей, как Round 1 этих капов. Призовые — его таблица «FNCS Solos Reload Finals Prize Pool» (Notion «19.10», скрин 35):
   NAW и BR здесь снова делят таблицу, ASIA/ME/OCE — одну на троих. */
const CC_SOLO_RELOAD_R2_FIELD={EU:5000, NAC:3000};
// Очки Solo Reload Victory Cup (S42, иначе S41) — место и элим; без данных — таблица Victory Cup.
function soloReloadScore(){ return ccCupScoreOf('S42_ReloadReloadSoloVictoryCup', 1) || ccCupScoreOf('S41_ReloadReloadSoloVictoryCup', 1); }
function soloReloadPoints(place){ const sc=soloReloadScore(); return sc ? sc.pts(place) : victoryR1Points(place); }
const CC_SOLO_RELOAD_KILL_CAP=10;
/* Лобби Reload по 40 (CC_RELOAD_PLAYERS): отборы R2/R3 играются полем 120, три лобби, перемешанные каждую игру.
   Было поле 100 одной комнатой (игрок: «у меня 100 человек релоуд фнкс»). Доля прохода та же, что у Epic. */
const CC_SOLO_RELOAD_ROOM=120;
function soloReloadR2Cut(){ return Math.round(CC_SOLO_RELOAD_ROOM*500/(CC_SOLO_RELOAD_R2_FIELD[ccCareerRegion()]||2000)); }
const CC_SOLO_RELOAD_PRIZES={
  EU:  [[1,60000],[2,40000],[3,25000],[4,15000],[5,12500],[6,10000],[7,9000],
        [8,8000],[9,6000],[10,5000],[11,4000],[12,3000],[13,2500],[14,2000],
        [15,1500],[20,1250],[25,1000],[40,750]],
  NAC: [[1,50000],[2,30000],[3,20000],[4,10000],[5,8000],[6,6000],[7,5000],
        [8,4000],[9,3000],[10,2500],[11,2000],[12,1750],[13,1500],[14,1250],
        [15,1000],[20,750],[25,500],[40,400]],
  NAW: [[1,15000],[2,10000],[3,7500],[4,5000],[5,4000],[6,3000],[7,2000],
        [8,1500],[9,1000],[10,750],[20,500],[40,300]],
  ASIA:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[6,1250],[7,1000],
        [8,750],[9,500],[10,400],[20,300],[40,200]]
};
CC_SOLO_RELOAD_PRIZES.BR=CC_SOLO_RELOAD_PRIZES.NAW;
CC_SOLO_RELOAD_PRIZES.ME=CC_SOLO_RELOAD_PRIZES.ASIA;
CC_SOLO_RELOAD_PRIZES.OCE=CC_SOLO_RELOAD_PRIZES.ASIA;
function soloReloadPrize(place){
  const t=CC_SOLO_RELOAD_PRIZES[ccCareerRegion()]||CC_SOLO_RELOAD_PRIZES.EU;
  const row=t.find(r=>place<=r[0]);
  return row ? row[1] : 0;
}
Object.assign(CC_SOLOS_STAGES, {
  rlr2:  {games:10, kill:2, field:CC_SOLO_RELOAD_ROOM, cut:soloReloadR2Cut, pass:'rlr3', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rlr3:  {games:10, kill:2, field:CC_SOLO_RELOAD_ROOM, cut:Math.round(CC_SOLO_RELOAD_ROOM*80/500), pass:'rlheats', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rlheats:{games:8,  kill:2, field:40,  cut:7,  vr:true, pass:'rlfinal', tail:[16,25], tailSeat:'rllcqf', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rllcq1:{games:10, kill:2, open:true, cut:20, pass:'rllcqf', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rllcqf:{games:5,  kill:2, field:40,  cut:5,  vr:true, pass:'rlfinal', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rlfinal:{games:10, kill:2, field:40, cut:0,  prize:soloReloadPrize, reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP}
});
// Отсечка стадии — число или функция региона (см. solosR2Cut).
function ccSolosCut(spec){ return typeof spec.cut==='function' ? spec.cut() : spec.cut; }
/* Куда садится игрок после вечера — по правилам Epic, а не по одной отсечке.

   В хитах и в LCQ Final победа в матче уводит наверх немедленно, и Epic
   считает свои 29 (17) мест СРЕДИ ТЕХ, КТО ПОБЕДЫ НЕ ВЗЯЛ. Отсюда и его
   «36-50 в LCQ Final»: шесть победителей плюс двадцать девять — это первые
   тридцать пять строк таблицы. Считать 29 прямо по таблице значило бы отдать
   места 30-35 никуда, а это живые люди, прошедшие по правилам. */
function ccSolosSeat(spec, t, ranked){
  if(spec.prize) return null;
  const rank=ranked.indexOf(t)+1, cut=ccSolosCut(spec);
  if(spec.vr){
    if((t.wins||0)>0) return spec.pass;
    const clean=ranked.filter(x=>!((x.wins||0)>0));
    if(clean.indexOf(t)+1<=cut) return spec.pass;
  } else if(rank<=cut) return spec.pass;
  if(spec.rest) return spec.rest;
  /* Хвост в LCQ Final — «следующие 15, кто не взял победы» (правила Epic, сверка 29.10). Считался по сырой таблице, где
     победители (60 очков, игры кончились) стоят вперемешку, и окно 36-50 съезжало: места сразу за 29-м не садились никуда. */
  if(spec.tail && spec.vr){
    const n=spec.tail[1]-spec.tail[0]+1, cr0=ranked.filter(x=>!((x.wins||0)>0)).indexOf(t)+1;
    if(cr0>cut && cr0<=cut+n) return spec.tailSeat;
  } else if(spec.tail && rank>=spec.tail[0] && rank<=spec.tail[1]) return spec.tailSeat;
  return null;
}
/* FNCS Solo Reload — свой турнир и своё состояние (cr.solosRl): иначе октябрьский финал Solos
   (got:'final') закрывал бы ноябрьский квал. Ключ — по стадии. */
function ccSolosKey(stage){ return /^rl/.test(String(stage||'')) ? 'solosRl' : 'solos'; }
function ccSolosOf(card, stage){
  const cr=CAREER && CAREER.career, k=ccSolosKey(stage);
  if(!cr || !card) return null;
  if(!ccMpTeam()) return cr[k]||null;
  return (cr[k+'By']||{})[hKey(card)]||null;
}
function ccSolosSet(card, v, stage){
  const cr=CAREER && CAREER.career, k=ccSolosKey(stage);
  if(!cr || !card) return;
  if(!ccMpTeam()){ cr[k]=v; return; }
  cr[k+'By']=cr[k+'By']||{};
  cr[k+'By'][hKey(card)]=v;
}
/* Кто сегодня допущен. Первый круг открыт всем; второй — только тем, у кого
   места ещё нет, и это и есть «второй шанс» правил. Дальше вечер играется
   тем, кто на него сел, и ровно один раз. */
/* Хит — свой (s.heat: 1 — 17.10, 2 — 18.10). Старый сейв без номера играет любой из двух, второй закроет got. */
function ccSolosHeatOk(id, s){
  if(!s || !s.heat || !/^FNCSSolos_Heats2?$/.test(String(id||''))) return true;
  return s.heat===(id==='FNCSSolos_Heats2' ? 2 : 1);
}
function careerSolosCanFor(stage, s, id){
  const seat=s ? s.seat : null, got=s ? s.got : null;
  if(got===stage) return false;
  if(id && !ccSolosHeatOk(id, s)) return false;
  if(/^sc\d+r1$/.test(stage)) return true;   // Solo Cash Cup: каждый кап открыт заново (got уже проверен выше)
  /* Round 1 — первый вечер квала: квал 1 — тому, кто ещё не играл; квал 2 — всем без места (вылетевший из квала 1
     начинает квал 2 с Round 1, как у Epic). Round 2 — прошедшим Round 1 или топ-2000 PR, пропустившим его. */
  if(stage==='q1r1') return !got;
  if(stage==='q2r1') return !seat && got!=='q2r1';
  if(stage==='q1r2') return seat==='q1r2' || (!got && ccSolosPrSkip());
  if(stage==='q2r2') return seat==='q2r2' || (!seat && got!=='q2r1' && ccSolosPrSkip());
  if(stage==='rlr2') return !got;
  /* Последний шанс — для тех, кто уже играл квал и остался без места. Это и
     есть правило Epic: в LCQ Round 1 садится тот, кто отыграл Round 1 и не
     прошёл ни в LCQ Final, ни в финал. Сюда же попадает вылетевший из хита
     хуже пятидесятого — у него места нет, и дорога у него ровно эта. */
  if(stage==='lcq1' || stage==='rllcq1') return !!got && !seat;
  return seat===stage;
}
const CC_SOLO_ORDER=['qual','heats','final'];
/* Какая стадия FNCS Solos у этого id. Карта, а не регулярка: id теперь девять,
   и читать их по одному месту дешевле, чем чинить выражение при каждом новом. */
/* Solo Cash Cup 2025-го — шестнадцать независимых капов на той же машине,
   что FNCS Solos: sc<n>r1 — открытый раунд (десять игр, топ-600 дальше),
   sc<n>r2 — раунд на 600 (десять игр, деньги). Таблица — с Tracker. */
const CC_SOLO_CASH_PAY=[[1,8000],[2,4800],[3,3200],[4,2240],[5,1760],[10,1280],[15,640],[20,320],[25,160]];
// По регионам (Tracker 20.10, S33_SoloCashCup_Event<n>Round2_<рег>); Европа — прежняя таблица выше.
const CC_SOLO_CASH_PAYR={EU:CC_SOLO_CASH_PAY,
  NAC: [[1,5000],[2,3000],[3,2000],[4,1400],[5,1100],[10,800],[15,400],[20,200],[25,100]],
  NAW: [[1,3000],[2,1800],[3,1200],[4,1020],[5,780],[10,480],[15,240],[20,120]],
  ASIA:[[1,2400],[2,1200],[3,800],[4,680],[5,520],[10,320],[15,160]]};
CC_SOLO_CASH_PAYR.BR=CC_SOLO_CASH_PAYR.NAW; CC_SOLO_CASH_PAYR.ME=CC_SOLO_CASH_PAYR.ASIA; CC_SOLO_CASH_PAYR.OCE=CC_SOLO_CASH_PAYR.ASIA;
function soloCashPrize(place){ return ccPay24(CC_SOLO_CASH_PAYR, place); }
for(let n=1; n<=16; n++){
  CC_SOLOS_STAGES['sc'+n+'r1']={games:10, kill:2, open:true, cut:600, pass:'sc'+n+'r2'};
  CC_SOLOS_STAGES['sc'+n+'r2']={games:10, kill:3, field:600, cut:0, prize:soloCashPrize};
}
const CC_SOLOS_BY_ID={
  FNCSSolos_Q1Round1:'q1r1', FNCSSolos_Q2Round1:'q2r1',
  FNCSSolos_Q1Round2:'q1r2', FNCSSolos_Q1Round3:'q1r3', FNCSSolos_FastTrack:'fast',
  FNCSSolos_Q2Round2:'q2r2', FNCSSolos_Q2Round3:'q2r3', FNCSSolos_Heats:'heats', FNCSSolos_Heats2:'heats',
  FNCSSolos_LCQRound1:'lcq1', FNCSSolos_LCQFinal:'lcqf', FNCSSolos_Final:'final',
  FNCSSoloReload_Round2:'rlr2', FNCSSoloReload_Round3:'rlr3', FNCSSoloReload_Heats:'rlheats',
  FNCSSoloReload_LCQRound1:'rllcq1', FNCSSoloReload_LCQFinal:'rllcqf', FNCSSoloReload_Final:'rlfinal'
};
for(let n=1; n<=16; n++){ CC_SOLOS_BY_ID['SoloCash'+n+'_R1']='sc'+n+'r1'; CC_SOLOS_BY_ID['SoloCash'+n+'_R2']='sc'+n+'r2'; }
function careerSoloSeriesOn(iso){
  const all=(careerYearDays().get(iso)||[]).filter(x=>x.kind==='solo');
  if(!all.length) return null;
  /* 10 октября у Epic два соло-вечера сразу: Fast Track и второй раунд второго
     круга квала. Для одного игрока они взаимоисключающие — в Fast Track сидит
     тот, кто уже прошёл, а во второй круг пускают только без места, — поэтому
     день отдаёт ТОТ, на который этот игрок допущен, а не первый по списку.
     Иначе прошедший в Fast Track видел бы на своей плитке чужой квал. */
  const me=(typeof careerCard==='function') ? careerCard() : null;
  const mine=function(e){
    const st=CC_SOLOS_BY_ID[String(e.id||'')];
    if(!st) return true;
    return careerSolosCanFor(st, ccSolosOf(me, st), e.id);
  };
  const e=all.find(mine) || all[0];
  /* Два соло-турнира в году, и оба ходят через этот раннер. Различает их
     префикс id, а не дата: у января свои три стадии и своё состояние
     (cr.solo), у FNCS Solos — свои девять и cr.solos. */
  const solos=CC_SOLOS_BY_ID[String(e.id||'')];
  if(solos){
    return {series:'solos', stage:solos, spec:CC_SOLOS_STAGES[solos],
            id:e.id, label:e.label, day:iso};
  }
  const m=String(e.id||'').match(/^SoloSeries_(Qualifier|Heats|Final)$/);
  if(!m) return null;
  return {series:'solo', stage:{Qualifier:'qual', Heats:'heats', Final:'final'}[m[1]],
          id:e.id, label:e.label, day:iso};
}
// The qualifier is open to everybody — that is the event's whole point; the
// Heats are for who came through it, the Final for who came through them.
// A stage is played once, the rule every other runner already lives by.
/* Проход по Solo Series — ЛИЧНЫЙ.

   В одиночной карьере он лежит в cr.solo. В команде их два — по одному на
   игрока, под ником, в cr.soloBy (ключ команды: оба видят оба). Раннер пишет
   обе строки с обеих сторон, из одной и той же таблицы, поэтому состояние у
   двоих одно. Читается по КОМАНДЕ, а не по локстепу (ccMpTeam, не ccMpOn):
   вечер «один играет» тоже должен писать в свою строку. */
function ccSoloOf(card){
  const cr=CAREER && CAREER.career;
  if(!cr || !card) return null;
  if(!ccMpTeam()) return cr.solo||null;
  return (cr.soloBy||{})[hKey(card)]||null;
}
function ccSoloSet(card, v){
  const cr=CAREER && CAREER.career;
  if(!cr || !card) return;
  if(!ccMpTeam()){ cr.solo=v; return; }
  cr.soloBy=cr.soloBy||{};
  cr.soloBy[hKey(card)]=v;
}
function careerSoloSeriesCan(ev){
  return careerSoloSeriesCanFor(ev, ccSoloStateOf(ev, careerCard()));
}
/* Состояние — по турниру, а не по кнопке: январская Solo Series живёт в
   cr.solo, FNCS Solos — в cr.solos. Через эту пару ходят все, кто спрашивает
   «допущен ли», включая вопросы про напарника. */
function ccSoloStateOf(ev, card){
  if(!card) return null;
  return (ev && ev.series==='solos') ? ccSolosOf(card, ev.stage) : ccSoloOf(card);
}
function ccSoloStateSet(ev, card, v){
  if(ev && ev.series==='solos') ccSolosSet(card, v, ev.stage); else ccSoloSet(card, v);
}
/* ПРОШЕДШИЕ ИЗ ТВОЕЙ СОТНИ ЕДУТ ДАЛЬШЕ ВМЕСТЕ С ТОБОЙ (Notion 25.10: «FNCS Solo… only one player can make it
   to the finals/heat/fast track»). Каждый этап собирал комнату заново из сцены, и из сотни, где ты прошёл,
   дальше оказывался один ты: те, кто был выше тебя, в хитах и финале пропадали. Теперь вечер пишет, кто куда
   сел (cr.soloCarry: турнир, сезон, этап → строки), и следующий этап сажает их первыми, добирая сцену. Как у
   Мейджора majorSeed.through. */
function ccSoloCarryTour(ev){ return ev && ev.series==='solos' ? ccSolosKey(ev.stage) : 'solo'; }
function ccSoloCarryPut(ev, seats){
  const cr=CAREER.career, tour=ccSoloCarryTour(ev);
  if(!cr.soloCarry || cr.soloCarry.tour!==tour || cr.soloCarry.season!==cr.season) cr.soloCarry={tour:tour, season:cr.season, by:{}};
  seats.forEach(function(p){
    const at=p[0], row=ccStageSeatRow(p[1]);
    if(!at || !row.length) return;
    const list=cr.soloCarry.by[at]=cr.soloCarry.by[at]||[];
    if(!list.some(r=>hKey(r[0].h)===hKey(row[0].h))) list.push(row);
  });
}
function ccSoloCarryTake(ev, skip, size){
  const cr=CAREER.career, c=cr.soloCarry;
  if(!c || c.tour!==ccSoloCarryTour(ev) || c.season!==cr.season) return [];
  const no=new Set(skip.map(hKey)), out=[];
  (c.by[ev.stage]||[]).forEach(function(row){
    if(out.length>=size || no.has(hKey(row[0].h))) return;
    no.add(hKey(row[0].h));
    out.push(ccStageTeamFrom(row));
  });
  return out;
}
function careerSoloSeriesCanFor(ev, s){
  if(!ev) return false;
  if(ev.series==='solos') return careerSolosCanFor(ev.stage, s, ev.id);
  const done=s ? s.got : null;
  /* Квал — в несколько сессий, идёт лучшая (см. CAREER_YEAR): играется, пока
     не прошёл, и не дважды в один день. Сейв без дня (до 30 августа) — одна
     сыгранная сессия, остальные ему открыты. */
  if(ev.stage==='qual'){
    if(done && CC_SOLO_ORDER.indexOf(done)>CC_SOLO_ORDER.indexOf('qual')) return false;
    if(s && s.pass==='qual') return false;
    if(s && s.got==='qual' && s.day===ev.day) return false;
    return true;
  }
  if(done && CC_SOLO_ORDER.indexOf(done)>=CC_SOLO_ORDER.indexOf(ev.stage)) return false;
  if(ev.stage==='heats') return !!(s && s.pass==='qual');
  if(ev.stage==='final') return !!(s && s.pass==='heats');
  return false;
}

/* Pro-Am Creator Series, Даллас 12 июля 2026 (первая остановка, в июне её нет, см. CAREER_YEAR).
   От Epic: 7 игр, 20 дуо в одном лобби, Reload, очки CC_PROAM_PLACE и 3 за элиминацию, призовые CC_PROAM_PRIZE плюс
   бонус за игру CC_PROAM_GAME. Напарник креатор из опубликованного состава Далласа.
   Наше: рейтинг креатора CC_PROAM_CREATOR_OVR, один на всех и заметно ниже про. Креаторы отличаются аудиторией
   (ccProAmReachFrom), а не силой. Приглашение по известности (careerProAmCan), квалификацию Epic не публикует. */
const CC_PROAM_GAMES=7, CC_PROAM_TEAMS=20, CC_PROAM_KILL=3;
const CC_PROAM_PLACE=[60,50,45,40,35,30,27,24,21,18,15,12,9,6,3];
const CC_PROAM_PRIZE=[10000,7000,4500,3000,2200,1800,1400,1200,1000,900,
                      900,800,700,600,500,450,400,350,200,200];
const CC_PROAM_GAME=[1000,500,200];
/* ВТОРАЯ ОСТАНОВКА — САН-ПАУЛУ, 6 сентября 2026 (Pro-Am Creator Series, Team Liquid, Alienware
   Training Facility). Отзыв: «добавляй, ток в ЗБ» — играется в Zero Build (CC_ZB).
   Что опубликовано (Liquipedia): 20 пар, $50 000, шесть игр — в жизни 1–3 Zero Build и 4–6 Build,
   здесь все шесть без строек, решение; призовые только за 1–5: 12 000 / 8 000 / 5 800 /
   4 500 / 3 500. Таблица очков НЕ опубликована — взята далласская; места 6–20 не опубликованы —
   остаток $16 200 разложен по убыванию; бонусов за игру нет (фонд закрывается таблицей).
   Обе остановки — по одному приглашению каждая (careerProAmInv по ярлыку). */
const CC_PROAM_EVENTS={
  ProAm_Dallas:  {day:'2026-07-12', city:'Dal', games:CC_PROAM_GAMES, place:CC_PROAM_PLACE, prize:CC_PROAM_PRIZE, game:CC_PROAM_GAME, zb:false},
  ProAm_SaoPaulo:{day:'2026-09-06', city:'Sao', games:6, place:CC_PROAM_PLACE,
                  prize:[12000,8000,5800,4500,3500,2700,2000,1700,1500,1300,1100,1000,900,800,700,600,550,500,450,400],
                  game:[0,0,0], zb:true},
  // Третья и четвёртая остановки — наши (см. CAREER_YEAR): формат и кошелёк Сан-Паулу, стройки Далласа.
  ProAm_Paris:   {day:'2026-09-20', city:'Par', games:6, place:CC_PROAM_PLACE,
                  prize:[12000,8000,5800,4500,3500,2700,2000,1700,1500,1300,1100,1000,900,800,700,600,550,500,450,400],
                  game:[0,0,0], zb:false},
  ProAm_Seoul:   {day:'2026-10-25', city:'Seo', games:6, place:CC_PROAM_PLACE,
                  prize:[12000,8000,5800,4500,3500,2700,2000,1700,1500,1300,1100,1000,900,800,700,600,550,500,450,400],
                  game:[0,0,0], zb:false}
};
function ccProAmEvent(label){ return CC_PROAM_EVENTS[label] || CC_PROAM_EVENTS.ProAm_Dallas; }
function ccProAmKey(ev){ return (ev && (ev.id||ev.label)) || 'ProAm_Dallas'; }   // id — ярлык CAREER_YEAR, label — имя на языке
// Ярлык события у ветки инбокса: старые сейвы держат proam:true — это Даллас.
function ccProAmThreadLabel(t){ return !t || !t.proam ? null : (t.proam===true ? 'ProAm_Dallas' : String(t.proam)); }
// Съездил ли уже на ЭТОТ Про-Ам в этом сезоне (старый ключ cr.proam[season] — Даллас).
function ccProAmDone(label){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const p=cr.proam||{};
  return !!(p[cr.season+'|'+label] || (label==='ProAm_Dallas' && p[cr.season]));
}
/* ZERO BUILD — ночь без строек: ресы не тратятся и не спрашиваются (фарм, рефреш, стиль стройки,
   штраф концовки), высокой земли и рефреша нет в ходах конца, комната ими не ходит, край ближнего
   боя (closeEdge — постройки) не считается. Сила карточек остаётся как есть: отдельного рейтинга
   под ZB у Epic нет, это допущение. Ставит runCareerProAm по CC_PROAM_EVENTS.zb. */
let CC_ZB=false;
function ccLateMovesNow(){ return CC_ZB ? CC_LATE_MOVES.filter(m=>m.id!=='hg' && !m.mats) : CC_LATE_MOVES; }
// Кого зовут: сцена смотрит на охват, а не на дивизион — это шоу.
const CC_PROAM_REACH=25000;
/* Креаторы Далласа — опубликованный состав, все двадцать. Их ровно столько,
   сколько пар в лобби: **половина игроков турнира — контент-мейкеры**, отзыв со ссылкой на страницу события. Поэтому и у соперников в
   паре стоит креатор, а не второй про (см. ccProAmField). */
const CC_PROAM_CREATORS_NAC=['StableRonaldo','Faxuty','Lacy','Jynxzi','Rawdogmoon','Zemie',
  'Ash Alk','Braeden','Hamyp','Typical Gamer','Sommerset','Fraanticc','Arky','Crackly',
  'a2guapo','Yugi','Yusef','mooda','primatepaige','ilyynina'];
/* Бразилия — состав Сан-Паулу (6 сентября, Team Liquid), тоже опубликованный
   целиком. Числа того турнира Epic ещё не назвал, а имена назвал. */
const CC_PROAM_CREATORS_BR=['Flakes Power','Robleis','Patriota','Babi','Carrera','Daryki',
  'Dengoso','FRTTT','Isafaracco','Kamikaze','Letiltz','OLui','Mantovani','miw','Nanoide',
  'ThiagoIUTU','Vascurado','zEkO','Derponce','Melany',
  'Gorilon'];  // аргентинец (Liquipedia), играет BR-регион, ведёт испанские FNCS-эфиры
/* ЕВРОПА. Своей остановки Про-Ама у Европы нет — Epic объявил только Даллас и
   Сан-Паулу, — поэтому европейское поле СОБРАНО, а не скопировано. Собрано из
   настоящих полей, а не из головы:
   — FNCS Pro-Am 2025 (сторона креаторов): Ali-A, Reddysh, Jacob4TV;
   — Twitch Rivals Creator Series: EMEA Kick-off — единственное большое
     европейское поле креаторов Fortnite, что вообще существует: TheGrefg,
     Ibai, IlloJuan, knekro, Vicens, ZormanWorld, Carola, Jolavanille, Setty,
     Ewron, Kubx, Zrool, Piz, Dhalucard, ShivFPS, Tubbo;
   — категория Content Creators Liquipedia, живые и европейские: Mawkzy,
     Stizo, ZetFar, Amar.
   Ушедших со сцены (Liquipedia status=Retired: Rubius, POW3R, Gotaga,
   Kinstaar, LOLiTO, Trymacs, HandOfBlood, Vikkstar123, elokratz) не
   зову — турнир играется сегодня. И тем более никого из умерших.
   Nikof Retired только как игрок: он кастит FNCS, поэтому стоит в поле,
   как Evelone. Рядом те, кто ведёт FNCS-эфиры на своих каналах: Wazz,
   Amar, Katoo, qlnek (польские вотчпати). */
/* CoachBoop — правка, поимённо. Он не из полей выше, и это
   правильно: в описании канала «Ex-Analyst for the FNCS Broadcast. Coach who
   watches all of the top level Fortnite in Europe» — то есть человек сцены,
   который её комментирует и тренирует, с 252 тысячами фолловеров. Ровно тот
   вид гостя, ради которого Про-Ам и существует. AussieAntics, второй из его
   списка, в моде уже стоял — он в океанийской корзине ниже.

   Setty отсюда УБРАН — отзыв: «Setty тоже это про игрок». Он
   пришёл из поля Twitch Rivals, но играет он как ПРО (он и в ростере сцены
   стоит — Japko & panzer & Setty), а сторона креаторов в Про-Аме — это
   вторая половина пары, не про. */
const CC_PROAM_CREATORS_EU=['Ali-A','Reddysh','Jacob4TV','TheGrefg','Ibai','IlloJuan',
  'knekro','Vicens','ZormanWorld','Carola','Jolavanille','Ewron','Kubx','Zrool',
  'Piz','Dhalucard','ShivFPS','Tubbo','Mawkzy','CoachBoop',
  'Nikof','Wazz','Amar','Katoo','qlnek'];
/* СНГ: у Epic отдельного региона нет (русскоязычные играют EU, 172 россиянина в ростере), поэтому это не регион
   карьеры, а корзина креаторов в общем пуле сразу за европейской.
   twitch.tv/mirwana, twitch.tv/at0m (displayName MIRWANA, At0m) и Evelone с Liquipedia (Retired как игрок, но стримит).
   Kiryache32 и Siberiajkee убраны намеренно, список задан вручную.
   В Content Creators на Liquipedia из СНГ нет никого. «Битву блогеров» 2019 (WayCats, Kek the King, Morphia, Типси,
   Форит) не берём: неизвестно, играют ли они Fortnite сейчас. */
const CC_PROAM_CREATORS_CIS=['MIRWANA','At0m','Evelone'];
/* Азия, Океания и Ближний Восток — одной корзиной: у каждого из трёх регионов
   креаторов на полкоманды, а вместе выходит настоящая часть мира. Все имена с
   Liquipedia, из категории Content Creators, и у всех в статусе Active:
   — Япония: Neckokun, Hamuppi, Nephrite, Shinck;
   — Океания: AussieAntics, Chanzes, LazarBeam, Loserfruit, Overstrand, Winter,
     Worthy (ушедшие — Muselk, McCreamy, Jacque — не зову);
   — Ближний Восток: Boter, IMonkey D, Rudex, все трое из Саудовской Аравии.
   Турции здесь нет: единственный кандидат (Rohat) по инфобоксу немец, то есть
   он европеец, а не ближневосточный креатор. */
const CC_PROAM_CREATORS_ASIA=['Neckokun','Hamuppi','Nephrite','Shinck',
  'AussieAntics','Chanzes','LazarBeam','Loserfruit','Overstrand','Winter','Worthy',
  'Boter','IMonkey D','Rudex'];
const CC_PROAM_CREATORS_BY_REGION={EU:CC_PROAM_CREATORS_EU, NAC:CC_PROAM_CREATORS_NAC,
  NAW:CC_PROAM_CREATORS_NAC, BR:CC_PROAM_CREATORS_BR, CIS:CC_PROAM_CREATORS_CIS,
  ASIA:CC_PROAM_CREATORS_ASIA, OCE:CC_PROAM_CREATORS_ASIA, ME:CC_PROAM_CREATORS_ASIA};
/* Кого зовут в Про-Ам — СО ВСЕХ РЕГИОНОВ, правка: «я бы со всех
   регионов добавил и ещё СНГ». Так это и устроено у Epic: Про-Ам не турнир
   региона, а показательный вечер, и в Даллас летели не только американцы.

   Пул общий, но свои впереди: сначала креаторы региона карьеры — их зовут в
   первую очередь и они узнаваемы, — потом весь остальной мир в порядке
   регионов. Двадцать команд разбирают начало списка, поэтому «свои впереди»
   значит, что европейская карьера играет с европейцами и добирает мир, а не
   наоборот. Повторов нет: имя встречается в пуле один раз. */
const CC_PROAM_REGION_ORDER=['EU','CIS','NAC','BR','ASIA'];
function ccProAmCreators(){
  const r=(typeof ccCareerRegion==='function') ? ccCareerRegion() : 'EU';
  const mine=CC_PROAM_CREATORS_BY_REGION[r] || [];
  const out=[], seen=new Set();
  const add=list=>(list||[]).forEach(n=>{ const k=hKey(n); if(k && !seen.has(k)){ seen.add(k); out.push(n); } });
  add(mine);
  CC_PROAM_REGION_ORDER.forEach(reg=>add(CC_PROAM_CREATORS_BY_REGION[reg]));
  return out;
}
// Старое имя оставлено: на него смотрят сторожа и старые сейвы.
const CC_PROAM_CREATORS=CC_PROAM_CREATORS_NAC;
/* Рейтинг контент-мейкера — 67, его число (4 сентября). Epic рейтингов не
   публикует, так что это назначенная величина, а не измеренная: креатор играет
   заметно ниже про, но не как случайный человек с улицы. Одна на всех, без
   разброса — так его и просили. */
/* Twitch креаторов: ник и фолловеры из публичного GraphQL Twitch
   (user(login){displayName followers{totalCount}}), снято в сентябре 2026, переснимается так же.
   Логин угадывается по имени и у коротких попадает в тёзку, поэтому канал опознан поиском Twitch
   по описанию, языку и последнему эфиру; опознанный стоит с любым числом (Mantovani 1822),
   порог 5000 только там, где опознать нечем.
   Без Twitch: Mawkzy, Hamyp, Kamikaze, miw (нашлись только тёзки), Daryki, ThiagoIUTU, IMonkey D
   (каналы мёртвые с 2020/2020/2024, в «сейчас в эфире» им не место). */
const CC_PROAM_TWITCH={
  'Ali-A':['alia',291509], 'Reddysh':['reddysh',117551], 'Jacob4TV':['jacob4tv',541777],
  'TheGrefg':['thegrefg',12292135], 'Ibai':['ibai',20328384], 'IlloJuan':['illojuan',4651204],
  'knekro':['knekro',1292810], 'Vicens':['vicens',1984327], 'ZormanWorld':['zormanworld',631962],
  'Carola':['carola',1876129], 'Jolavanille':['jolavanille',808728], 'Kubx':['kubx',440558],
  'Zrool':['zrool',118874], 'Dhalucard':['dhalucard',573971], 'ShivFPS':['shivfps',1447970],
  'Tubbo':['tubbo',5238869], 'StableRonaldo':['stableronaldo',5248654], 'Faxuty':['faxuty',668155],
  'Lacy':['lacy',3388699], 'Jynxzi':['jynxzi',11251813], 'Rawdogmoon':['rawdogmoon',198440],
  'Zemie':['zemie',1230330], 'Ash Alk':['ashalk',171764], 'Braeden':['braeden',488266],
  'Typical Gamer':['typicalgamer',1126245], 'Sommerset':['sommerset',1968758], 'Fraanticc':['fraanticc',236880],
  'Arky':['arky',568617], 'Crackly':['crackly',82729], 'a2guapo':['a2guapo',264918],
  'Yugi':['yugi',453515], 'Yusef':['yusef',5467], 'mooda':['mooda',791619],
  'primatepaige':['primatepaige',113995], 'ilyynina':['ilyynina',30092], 'Flakes Power':['flakespower',72507],
  'Robleis':['robleis',5932515], 'Patriota':['patriota',1125171], 'Babi':['babi',1379011],
  'Dengoso':['dengoso',81009], 'FRTTT':['frttt',721823], 'Isafaracco':['isafaracco',26275],
  'Letiltz':['letiltz',67461], 'OLui':['olui',165695], 'Nanoide':['nanoide',80627],
  'Vascurado':['vascurado',75389], 'zEkO':['zeko',1160158], 'Derponce':['derponce',17651],
  'MIRWANA':['mirwana',330906], 'At0m':['at0m',107047],
  // СНГ. Evelone живёт на evelone192, а не на evelone: короткий канал — чужой,
  // с семью сотнями подписчиков. Тот же капкан, что с Daryki.
  // Снято 4 сентября 2026 тем же запросом, что и остальные.
  'CoachBoop':['coachboop',252203],
  'Nikof':['nikof',826377], 'Wazz':['wazz',395275], 'Amar':['amar',1876674],
  'Katoo':['katoo',690729], 'Gorilon':['gorilon',494897], 'qlnek':['qlnek',279051],
  'Evelone':['evelone192',2532787],
  // Азия, Океания, Ближний Восток. У японцев и саудовцев каналов на Twitch с
  // подтверждаемым размером не нашлось — они стоят в поле без числа.
  'Neckokun':['neckokun',22477], 'AussieAntics':['aussieantics',1642115],
  'Chanzes':['chanzes',638265], 'LazarBeam':['lazarbeam',405357],
  'Loserfruit':['loserfruit',3045429], 'Overstrand':['overstrand',117593],
  'Rudex':['rudex',155382],
  /* Добор 4 сентября, его «найди сам твичи». Угадывание логина по имени
     исчерпало себя (голое имя почти всегда занято сквоттером с нулём), поэтому
     каналы искались ПОИСКОМ Twitch — searchFor(userQuery, target:{index:CHANNEL}),
     тот же публичный GraphQL, — а найденное сверялось по описанию канала,
     языку и последнему эфиру: у Setty в описании FNCS, у Piz итальянский и
     «mi chiamo Riccardo», у Melany португальский, у Winter и Worthy орг PWR,
     у Nephrite и Shinck японский с фортнайтом в тексте. Числа снимались тем же
     днём. */
  'Ewron':['ewroon',1102932], 'Piz':['pizfn',832871],
  'Carrera':['carreraaa',4962088], 'Melany':['melanylolee',55765],
  'Mantovani':['mantovani',1822],
  'Winter':['winter1k',36826], 'Worthy':['worthyy',196739], 'Boter':['not_boter',95220],
  'Nephrite':['nephrite_2',14332], 'Shinck':['shincky',5615], 'Hamuppi':['dfm_hamuppi',4310]
};
/* Без подтверждённого канала креатора нет нигде (28.10, его «пусть и соперниками они не могут быть»): ни в выборе, ни
   напарником или соперником на Про-Аме. Списки чистятся на месте — на них же смотрят CC_PROAM_CREATORS и сторожа. */
[CC_PROAM_CREATORS_EU, CC_PROAM_CREATORS_NAC, CC_PROAM_CREATORS_BR, CC_PROAM_CREATORS_CIS, CC_PROAM_CREATORS_ASIA].forEach(list=>{
  for(let i=list.length-1;i>=0;i--) if(!(CC_PROAM_TWITCH[list[i]] && CC_PROAM_TWITCH[list[i]][1]>0)) list.splice(i, 1);
});
Object.keys(CC_CREATOR_HOME_APAC).forEach(r=>{ CC_CREATOR_HOME_APAC[r]=CC_CREATOR_HOME_APAC[r].filter(n=>CC_PROAM_TWITCH[n]); });
function ccProAmTwitch(name){ return CC_PROAM_TWITCH[name] || null; }
function ccProAmFollowers(name){ const t=ccProAmTwitch(name); return t ? t[1] : 0; }
/* Аватарки креаторов: на витрине каналов, на карточке карьеры за креатора и в лобби Про-Ама. Из Twitch GraphQL
   (profileImageURL), лежат файлами в photos/creators/ (150×150), а не ссылками на CDN: не зависеть от чужого
   домена и не ходить на Twitch при каждом открытии.
   Пересобрать: `node tools/fetch-creator-avatars.js` (он же печатает таблицу). Дефолтную картинку Twitch
   (user-default-pictures) не качаем; без Twitch или картинки рисуем инициалы. */
const CC_PROAM_AVA_DIR='photos/creators/';
const CC_PROAM_AVA={
  'Ali-A':'alia.png', 'Reddysh':'reddysh.jpeg', 'Jacob4TV':'jacob4tv.png',
  'TheGrefg':'thegrefg.png', 'Ibai':'ibai.png', 'IlloJuan':'illojuan.png',
  'knekro':'knekro.jpeg', 'Vicens':'vicens.png', 'ZormanWorld':'zormanworld.png',
  'Carola':'carola.png', 'Jolavanille':'jolavanille.png', 'Kubx':'kubx.png',
  'Zrool':'zrool.png', 'Dhalucard':'dhalucard.png', 'ShivFPS':'shivfps.png',
  'Tubbo':'tubbo.png', 'StableRonaldo':'stableronaldo.png', 'Faxuty':'faxuty.png',
  'Lacy':'lacy.png', 'Jynxzi':'jynxzi.png', 'Rawdogmoon':'rawdogmoon.png',
  'Zemie':'zemie.png', 'Ash Alk':'ashalk.png', 'Braeden':'braeden.png',
  'Typical Gamer':'typicalgamer.png', 'Sommerset':'sommerset.png', 'Fraanticc':'fraanticc.png',
  'Arky':'arky.png', 'Crackly':'crackly.png', 'a2guapo':'a2guapo.png',
  'Yugi':'yugi.png', 'Yusef':'yusef.png', 'mooda':'mooda.png',
  'primatepaige':'primatepaige.png', 'ilyynina':'ilyynina.png', 'Flakes Power':'flakespower.png',
  'Robleis':'robleis.png', 'Patriota':'patriota.png', 'Babi':'babi.png',
  'Dengoso':'dengoso.png', 'FRTTT':'frttt.png', 'Isafaracco':'isafaracco.png',
  'Letiltz':'letiltz.png', 'OLui':'olui.png', 'Nanoide':'nanoide.png',
  'Vascurado':'vascurado.png', 'zEkO':'zeko.png', 'Derponce':'derponce.png',
  'MIRWANA':'mirwana.png', 'At0m':'at0m.png', 'CoachBoop':'coachboop.png',
  'Nikof':'nikof.png', 'Wazz':'wazz.png', 'Amar':'amar.png', 'Katoo':'katoo.png', 'Gorilon':'gorilon.png', 'qlnek':'qlnek.png',
  'Evelone':'evelone192.png', 'Neckokun':'neckokun.png',
  'AussieAntics':'aussieantics.png', 'Chanzes':'chanzes.png', 'LazarBeam':'lazarbeam.png',
  'Loserfruit':'loserfruit.png', 'Overstrand':'overstrand.png', 'Rudex':'rudex.png',
  'Ewron':'ewroon.png', 'Piz':'pizfn.png',
  'Carrera':'carreraaa.png', 'Melany':'melanylolee.png', 'Mantovani':'mantovani.png',
  'Winter':'winter1k.png', 'Worthy':'worthyy.png', 'Boter':'not_boter.png',
  'Nephrite':'nephrite_2.png', 'Shinck':'shincky.png', 'Hamuppi':'dfm_hamuppi.png'
};
function ccProAmAvatar(name){
  const f=CC_PROAM_AVA[name];
  return f ? CC_PROAM_AVA_DIR+f : null;
}
/* Сколько подписчиков приносит вечер рядом с ним. Аудитория креатора — не
   твоя, но часть её тебя видит: одна тысячная, и не больше потолка, чтобы
   вечер с Jynxzi не перекрыл год работы (для сравнения: победа на Глобалах
   даёт около 22 тысяч, см. careerReachResult). */
const CC_PROAM_REACH_SHARE=0.001, CC_PROAM_REACH_CAP=8000;
function ccProAmReachFrom(name){
  return Math.min(CC_PROAM_REACH_CAP, Math.round(ccProAmFollowers(name)*CC_PROAM_REACH_SHARE));
}
const CC_PROAM_CREATOR_OVR=67;
const CC_PROAM_CREATOR_LO=CC_PROAM_CREATOR_OVR, CC_PROAM_CREATOR_HI=CC_PROAM_CREATOR_OVR;
function ccProAmCreatorCard(name){
  const ovr=CC_PROAM_CREATOR_OVR;
  const tw=ccProAmTwitch(name);
  return {handle:name, nick:name, nat:null, region:ccCareerRegion(), tier:'ladder',
          rating:ovr, _ovr:ovr, _targetOvr:ovr, org:null, creator:true,
          // Лицо — с его же канала (см. CC_PROAM_AVA): в лобби Про-Ама половина
          // строк это креаторы, и без портретов комната читалась инициалами.
          _photo:ccProAmAvatar(name),
          // Твич человека и его аудитория — то, чем креатор в этой комнате и
          // отличается от про: рейтингом он ниже, а смотрят его больше.
          tw:tw?tw[0]:null, followers:tw?tw[1]:0};
}
/* Поле турнира: девятнадцать пар «про + креатор».
   Про берутся из настоящего ростера сцены, как в любом вечере; креаторы — из
   списка выше, каждый один раз. Свой креатор (ccProAmMate) из списка изымается,
   чтобы один человек не сидел в двух парах. */
function ccProAmField(cr, mine, mineCreator){
  const rnd=careerRng(ccHashStr('proamfield|'+ccCareerSeed()+'|'+(cr.season||1)));
  const taken=new Set(mine.map(hKey));
  /* Про берутся С ВЕРХА сцены, а не случайной явкой: на Про-Ам зовут громкие
     имена (у Epic в Далласе Clix, Bugha, Peterbot, Ritual), и это одно из
     немногих мест, где «двадцать лучших» — не догадка, а описание турнира. */
  const pros=careerRealPlayers(taken, rnd, cr.division===1 ? 1 : 'all')
    .filter(p=>p && !taken.has(hKey(p)))
    .sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
  const left=ccProAmCreators().filter(n=>hKey(n)!==hKey(mineCreator&&mineCreator.handle));
  const teams=[];
  for(let i=0; i<CC_PROAM_TEAMS-1; i++){
    const pro=pros[i];
    const creator=left[i % left.length];
    if(!pro || !creator) break;
    taken.add(hKey(pro));
    const squad=[pro, ccProAmCreatorCard(creator, rnd)];
    const t=careerTeam(squad, false, true);
    t.name=teamLabel(squad);
    teams.push(t);
  }
  return teams;
}
function proAmPoints(place){ return CC_PROAM_PLACE[place-1] || 0; }
function careerProAmOn(iso){
  const list=careerYearDays().get(iso||careerToday())||[];
  return list.find(e=>e.kind==='proam') || null;
}
/* ---- ПРИГЛАШЕНИЕ НА ПРО-АМ --------------------------------------------------

   Правка: «если игрока пригласят, ему отправят в личные
   сообщения, хочет ли он принять участие, и потом, если соглашается, может
   себе выбрать контент-мейкера».

   Так это и устроено в жизни: отбора на Про-Ам нет, есть приглашение — зовут
   Epic и клуб-хозяин площадки (в Далласе Dignitas), критериев никто не
   публикует. Поэтому известность открывает не сам турнир, а ПИСЬМО: за две
   недели до даты приходит ветка в инбоксе, и дальше это разговор — согласиться
   или отказаться, а согласившись, выбрать себе пару из тех, кто едет.

   Отказ — тоже ответ и держится до конца сезона: в следующем году позовут
   снова. */
const CC_PROAM_INVITE_DAYS=14;   // за сколько дней пишут
const CC_PROAM_PICK=6;           // сколько креаторов предлагают на выбор
function careerProAmInv(label){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  // Без ярлыка — сегодняшний Про-Ам, иначе ближайший впереди.
  if(!label){ const ev=careerProAmOn(careerToday()) || (function(){ const d=careerProAmNextDay(); return d ? careerProAmOn(d) : null; })(); label=ccProAmKey(ev); }
  const invs=cr.proamInvs||{};
  let inv=invs[label];
  if(!inv && label==='ProAm_Dallas' && cr.proamInv) inv=cr.proamInv;   // старый сейв: одно приглашение на сезон
  return (inv && inv.season===cr.season) ? inv : null;
}
// Ближайший Про-Ам сезона, если он ещё впереди.
function careerProAmNextDay(){
  let day=careerToday();
  for(let i=0;i<=CC_PROAM_INVITE_DAYS;i++){
    if(careerProAmOn(day)) return day;
    day=ccAddDays(day, 1);
  }
  return null;
}
function careerProAmInviteTick(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  if(careerReach()<CC_PROAM_REACH) return null;        // зовут по известности
  const day=careerProAmNextDay(); if(!day) return null;
  const ev=careerProAmOn(day), label=ccProAmKey(ev);
  if(careerProAmInv(label)) return null;               // на этот Про-Ам уже писали
  if(ccProAmDone(label)) return null;                  // и уже съездил
  cr.proamInvs=cr.proamInvs||{};
  cr.proamInvs[label]={season:cr.season, state:'sent', mate:null, day:day, label:label};
  const who={handle:CC_PROAM_HOST, org:true, proam:label, epic:true};
  // Своя ветка на каждую остановку: два письма в одной ветке путали бы кнопки.
  const t=careerDms().find(x=>ccProAmThreadLabel(x)===label) || careerDmThread(who);
  t.proam=label; t.who=who;
  careerDmPush(t, 'them', 'dmProAmInvite', [L()[ev.label]||ev.label, ccDayLabel(day)]);
  return t;
}
/* ПИШЕТ САМ FORTNITE, а не клуб-хозяин площадки: отзыв — «pro am пусть сам
   фортнайт пишет, и игрок может выбрать любого контент-мейкера». Ветка в инбоксе лежит среди
   клубов (org), с меткой «организатор» и ключ-артом FNCS вместо герба. */
const CC_PROAM_HOST='Fortnite';
// Кого предлагают в пару: свой регион первым, шестеро, и набор не меняется от
// перерисовки — приглашение одно, а не новый список на каждый заход.
/* ЛЮБОЙ КОНТЕНТ-МЕЙКЕР, а не шестеро по жребию — правка. Порядок: свой регион
   первым (так склеивает ccProAmCreators), внутри региона — по аудитории, потому что по ней и
   выбирают. Жребий шестерых (careerProAmPickListOld) оставлен только как память о правиле. */
function careerProAmPickList(){
  const all=ccProAmCreators();
  const regOf=n=>{ const k=hKey(n); return CC_PROAM_REGION_ORDER.find(r=>(CC_PROAM_CREATORS_BY_REGION[r]||[]).some(x=>hKey(x)===k))||''; };
  const mine=(typeof ccCareerRegion==='function') ? ccCareerRegion() : 'EU';
  const rank=r=>r===mine ? -1 : CC_PROAM_REGION_ORDER.indexOf(r);
  return all.slice().sort((a,b)=>{ const ra=rank(regOf(a)), rb=rank(regOf(b)); if(ra!==rb) return ra-rb; return ccProAmFollowers(b)-ccProAmFollowers(a); });
}
function careerProAmPickListOld(){
  const cr=CAREER.career;
  const rnd=careerRng(ccHashStr('proampick|'+ccCareerSeed()+'|'+(cr.season||1)));
  const list=ccProAmCreators().slice(0, 30);
  for(let i=list.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=list[i]; list[i]=list[j]; list[j]=t; }
  /* Жребий СНАЧАЛА, сортировка потом. Если сортировать весь список и брать
     шесть верхних, жребий пропадает: каждый сезон предлагали бы одну и ту же
     шестёрку самых крупных каналов мира. Едут разные — а показываем их по
     аудитории, потому что по ней и выбирают. */
  const six=list.slice(0, CC_PROAM_PICK);
  six.sort((a,b)=>ccProAmFollowers(b)-ccProAmFollowers(a));
  return six;
}
function careerProAmYes(id){
  const inv=careerProAmInv(ccProAmThreadLabel(careerDms().find(x=>x.id===id))); if(!inv || inv.state!=='sent') return false;
  inv.state='yes';
  const t=careerDms().find(x=>x.id===id); if(t){
    careerDmPush(t, 'me', 'dmProAmYes', []);
    careerDmPush(t, 'them', 'dmProAmPick', []);
  }
  careerSave(); careerRenderHub('social'); return true;
}
function careerProAmNo(id){
  const inv=careerProAmInv(ccProAmThreadLabel(careerDms().find(x=>x.id===id))); if(!inv || inv.state!=='sent') return false;
  inv.state='no';
  const t=careerDms().find(x=>x.id===id); if(t){
    careerDmPush(t, 'me', 'dmProAmNo', []);
    careerDmPush(t, 'them', 'dmProAmNoOk', []);
  }
  careerSave(); careerRenderHub('social'); return true;
}
function careerProAmPick(id, name){
  const inv=careerProAmInv(ccProAmThreadLabel(careerDms().find(x=>x.id===id))); if(!inv || inv.state!=='yes') return false;
  if(careerProAmPickList().indexOf(name)<0) return false;
  inv.mate=name;
  const t=careerDms().find(x=>x.id===id);
  if(t) careerDmPush(t, 'them', 'dmProAmMateOk', [name]);
  careerSave(); careerRenderHub('social'); return true;
}
function careerProAmCan(){
  const ev=careerProAmOn(careerToday());
  if(!ev) return false;
  if(ccProAmDone(ccProAmKey(ev))) return false;        // на каждую остановку — один раз
  const inv=careerProAmInv(ccProAmKey(ev));
  // Поехать можно только по приглашению, которое принял: известность приводит
  // письмо, а не автобус до Далласа.
  return !!inv && inv.state==='yes';
}
/* Правила Про-Ама на карточке дня — раскрывающимся блоком, чтобы карточка не
   вырастала на пять строк у того, кто их уже знает. Отзыв: «pro am
   ещё распиши как работает». Ни одного числа руками: очки, деньги, порог
   приглашения, срок письма и потолок аудитории читаются из тех же констант, по
   которым вечер играется, — расписание не разойдётся с правилами. */
function ccProAmHowHTML(label){
  const T=L();
  if(typeof T.ccProAmHow!=='function') return '';
  const P=ccProAmEvent(label || ccProAmKey(careerProAmOn(careerToday()) || (function(){ const d=careerProAmNextDay(); return d ? careerProAmOn(d) : null; })()));
  const lines=T.ccProAmHow({teams:CC_PROAM_TEAMS, games:P.games, kill:CC_PROAM_KILL, zb:!!P.zb,
    p1:P.place[0], p2:P.place[1], p3:P.place[2],
    prize1:ccMoney(P.prize[0]), prizeN:ccMoney(P.prize[P.prize.length-1]),
    g1:ccMoney(P.game[0]), g2:ccMoney(P.game[1]), g3:ccMoney(P.game[2]),
    reach:ccNum(CC_PROAM_REACH), days:CC_PROAM_INVITE_DAYS, pick:careerProAmPickList().length,
    host:CC_PROAM_HOST, cap:ccNum(CC_PROAM_REACH_CAP)});
  return '<details class="ch-how"><summary>'+esc(T.ccProAmHowTitle||'')+'</summary><ul>'+
    lines.map(l=>'<li>'+esc(l)+'</li>').join('')+'</ul></details>';
}
function ccProAmWhyLocked(){
  const inv=careerProAmInv();
  const today=careerProAmOn(careerToday());
  if(today && ccProAmDone(ccProAmKey(today))) return L().ccProAmPlayed;
  if(inv && inv.state==='no') return L().ccProAmTurnedDown;
  if(inv && inv.state==='sent') return L().ccProAmUnanswered;
  return careerReach()>=CC_PROAM_REACH ? L().ccProAmPlayed
                                       : L().ccProAmNeedReach(ccNum(CC_PROAM_REACH));
}
/* Креатор в пару: имя настоящее, сила наша. Выбранный игроком стоит впереди
   броска — бросок остался для тех, кто согласился и не выбрал никого. */
function ccProAmMate(){
  const cr=CAREER.career;
  const inv=careerProAmInv();
  if(inv && inv.mate) return ccProAmCreatorCard(inv.mate);
  const label=ccProAmKey(careerProAmOn(careerToday()));
  const rnd=careerRng(ccHashStr('proam|'+ccCareerSeed()+'|'+(cr.season||1)+(label==='ProAm_Dallas' ? '' : '|'+label)));
  const list=ccProAmCreators();
  const name=list[Math.floor(rnd()*list.length)];
  return ccProAmCreatorCard(name, rnd);
}
async function runCareerProAm(){
  const cr=CAREER.career;
  const ev=careerProAmOn(careerToday());
  if(!ev || !careerProAmCan()) return;
  const me=careerCard(); if(!me) return;
  const mate=ccProAmMate();
  const P=ccProAmEvent(ccProAmKey(ev));
  CC_ZB=!!P.zb;   // Сан-Паулу — без строек, см. CC_ZB
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  const prevSet=ACTIVE_LANDING_SET;
  CARD_MODE=true; squadSize=2; drafted=[me, mate];
  // Reload — значит остров Reload, как у всего круга Reload в этом моде.
  useLandingSet(ZONE_SETS.r4 ? 'r4' : careerBrSet());
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
  // Поездка на ЛАН: перелёт и пост из города, как у Саммита и Парижа.
  careerLanArrive('proam', ev);
  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  /* Девятнадцать соперников — тоже «про + креатор»: половина игроков турнира
     контент-мейкеры, это его формат. Если ростер вдруг не дал столько имён,
     добираем обычным полем, чтобы лобби не оказалось пустым. */
  let rivals=ccProAmField(cr, drafted, mate);
  if(rivals.length<CC_PROAM_TEAMS-1)
    rivals=rivals.concat(careerCupField(cr, drafted, CC_PROAM_TEAMS-rivals.length));
  const field=[you, ...rivals.slice(0, CC_PROAM_TEAMS-1)];
  const zones=null;
  let ranked;
  try{
  await simulateGamesLive(field, P.games, place=>P.place[place-1]||0, CC_PROAM_KILL, 'stage', 0, null, zones,
    {lobbySize:CC_PROAM_TEAMS, stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, ev.label, ['proam'])});
  } finally{ CC_ZB=false; }
  ranked=careerRankField(field);
  const place=ranked.indexOf(you)+1;
  /* Деньги двумя частями, обе Epic'овы: таблица мест и бонус за КАЖДУЮ игру.
     Бонус считается по журналу игр, а не по итогу вечера — в этом и смысл
     турнира, где платят за каждую победу (в Сан-Паулу бонуса нет). */
  const table=P.prize[place-1] || 0;
  const perGame=(you.stageLog||[]).reduce((s,g)=>s+(P.game[(g.place||99)-1]||0), 0);
  const cash=table+perGame;
  careerMoneyAdd(ranked, (p)=>P.prize[p-1] || 0);
  const shell=createStageCardShell(ev.label);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, cash>0, false,
    cash ? L().ccProAmCash(ccMoney(ccShareOf(cash, you))) : L().ccProAmNoCash);
  await revealStandings(shell, ranked, you, 0, null, null, (p)=>P.prize[p-1] || 0, null, true);
  removeSkipButton();
  careerPrAdd(ranked, {div:cr.division, kind:'proam'});
  ccBoardAfter(ranked, you, ev.label);
  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
    careerNews('good', 'ccNewsProAmCash', [place, ccNum(mine)],
               {tbl:ccStageShot(ranked, you, cr.division, ev.label)});
  } else careerNews('flat', 'ccNewsProAmOut', [place, field.length]);
  careerReachAdd(careerReachResult(place, field.length, cr.division, 'proam'));
  /* И аудитория напарника: вечер шёл на его канале тоже. Считается от его
     настоящих фолловеров (ccProAmReachFrom), поэтому Jynxzi и Crackly — это
     два разных вечера, хотя турнир один. */
  const fromMate=ccProAmReachFrom(mate.handle);
  if(fromMate){
    careerReachAdd(fromMate, true);
    careerNews('good', 'ccNewsProAmReach',
               [ccHandle(mate.handle), ccNum(mate.followers||0), ccNum(fromMate)]);
  }
  cr.proam=cr.proam||{}; cr.proam[cr.season+'|'+ccProAmKey(ev)]=careerToday();
  if(ccProAmKey(ev)==='ProAm_Dallas') cr.proam[cr.season]=careerToday();   // старый ключ — для старых сторожей и сейвов
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place,
               of:field.length, pts:you.stagePts, passed:false, ovr:CAREER.player.ovr,
               games:P.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate.handle, prize:ccShareOf(cash, you), kind:'proam'});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:cash>0,
    wins:you.wins||0, cash:cash, cut:0});
}

/* Кубок наций: выдуманный турнир сборных, без денег (медаль, охват, ПР как за ЛАН, лента).
   Сборная: четыре лучших карточки страны из всех регионов; меньше четырёх, сборной нет. Зона по большинству
   людей страны, NA одна (NAC + NAW). Квоты на 25 мест (tools/nations-count-probe.js): EU 10, ME 5, NA 3, BR 3, ASIA 2, OCE 2.
   Квал зоны: ночь, 6 игр, лобби до 25 (больше, тогда два змейкой). Финал 25 × 4 = 100, 12 игр, элим ×4.
   Не в топ-4: за неделю до квалы соло-отбор (6 игр) за четвёртое место. Мир играет без тебя (careerWorldFinals).
   Конец года после последнего FNCS: отбор, квал, финал с шагом в неделю, назавтра церемония
   (2026: 31.10 / 7.11 / 14.11; 2025: 13 / 20 / 27.09; 2024: 14 / 21 / 28.09). Сторож tools/check-career-nations.js. */
const CC_NATIONS_SLOTS={EU:10, ME:5, NA:3, BR:3, ASIA:2, OCE:2};
const CC_NATIONS_FIELD=25, CC_NATIONS_SQUAD=4, CC_NATIONS_LOBBY=25;
const CC_NATIONS={trial:{games:6, kill:1}, qual:{games:6, kill:2}, final:{games:12, kill:4}};
/* ПРИЗОВОЙ ФОНД — ЕГО, НЕ EPIC'А: «давай призовой 3 миллиона» (21.09). $3 000 000 на 25 сборных
   по форме Форт-Уэрта (20 % первому, дальше по убыванию, с 11-го места пятёрками); на команду,
   на игрока — четверть. Квалификация и отбор не платят. */
const CC_NATIONS_PRIZES={1:600000, 2:450000, 3:300000, 4:240000, 5:180000, 6:135000, 7:100000, 8:80000, 9:65000, 10:50000,
  11:70000, 12:70000, 13:70000, 14:70000, 15:70000, 16:55000, 17:55000, 18:55000, 19:55000, 20:55000,
  21:35000, 22:35000, 23:35000, 24:35000, 25:35000};
function nationsPrize(place){ return CC_NATIONS_PRIZES[place]||0; }
/* ФИНАЛ — ЛАН В ЕВРОПЕ: «страны в Европе» (21.09). Город — жребий сезона среди европейских залов
   CC_LAN_HOSTS, минус страны, где в этом сезоне стоят Саммит/Глобалы/Париж, минус прошлогодний
   хозяин Кубка наций. Отбор и квалификация — онлайн. */
const CC_NAT_EU_HOSTS=['Dus','Ant','Lyo','Cph','Par','Bel','Kat','Sto','Mad','Ams','Mil','Lon'];
const CC_NAT_HOST_YEARS={};
function ccNatHostKey(season){
  const s=Math.max(1, season|0);
  if(CC_NAT_HOST_YEARS[s]) return CC_NAT_HOST_YEARS[s];
  const natOf=k=>{ const h=CC_LAN_HOSTS.find(x=>x.key===k); return h ? h.nat : null; };
  const busy=['summit','globals','rc'].map(k=>{ try{ return ccLanNat(k, s); }catch(e){ return null; } });
  if(s>1) busy.push(natOf(ccNatHostKey(s-1)));
  const rnd=careerRng(ccHashStr('nations-host|'+s));
  const pool=ccLanShuffle(CC_NAT_EU_HOSTS, rnd);
  const pick=pool.find(k=>busy.indexOf(natOf(k))<0) || pool[0];
  CC_NAT_HOST_YEARS[s]=pick;
  return pick;
}
function ccNatZone(reg){ return (reg==='NAC'||reg==='NAW') ? 'NA' : reg; }
/* Зона сборной — где страна географически: регион с наименьшим пингом до неё (таблицы пингов
   CC_COUNTRIES/CC_REGION_PINGS). Отчёт: «Китай играет на Америке» — китайцы сцены сидят
   в NA-ростерах, и зона «где большинство карточек» уводила сборную не туда. Страны вне всех
   таблиц — по большинству, как раньше. */
function ccNatGeoZone(nat){
  const code=(typeof FLAG_CODE!=='undefined' && FLAG_CODE[nat]) || null;
  if(!code) return null;
  let best=null, bestPing=Infinity;
  ['EU','NAC','NAW','BR','ASIA','ME','OCE'].forEach(reg=>{
    const p=ccPingOf(code, reg);
    if(p!=null && p<bestPing){ bestPing=p; best=reg; }
  });
  return best ? ccNatZone(best) : null;
}
let CC_NAT_BOOK=null;
/* Книга сборных — раз на сезон и мир: страна → её люди по силе, зона, четвёрка. */
function ccNationsBook(){
  const cr=CAREER && CAREER.career;
  const tag=(cr ? (cr.season||1) : 0)+'|'+ccNowYear()+'|'+ccCareerRegion();
  if(CC_NAT_BOOK && CC_NAT_BOOK.tag===tag) return CC_NAT_BOOK;
  const by={};
  CC_REGIONS.forEach(reg=>{
    let ro=[]; try{ ro=ccSceneRoster(reg); }catch(e){ ro=[]; }
    ro.forEach(p=>{
      if(!p || !p.nat) return;
      const k=hKey(p); if(!k) return;
      const b=by[p.nat]=by[p.nat]||{nat:p.nat, cards:new Map(), zones:{}};
      const cur=b.cards.get(k);
      if(!cur || ccCardOvr(p)>ccCardOvr(cur)) b.cards.set(k, p);
      const z=ccNatZone(reg); b.zones[z]=(b.zones[z]||0)+1;
    });
  });
  const list=[], byNat={};
  Object.keys(by).forEach(nat=>{
    const b=by[nat];
    const cards=[...b.cards.values()].sort((x,y)=>ccCardOvr(y)-ccCardOvr(x));
    if(cards.length<CC_NATIONS_SQUAD) return;
    const zone=ccNatGeoZone(nat) || Object.keys(b.zones).sort((x,y)=>b.zones[y]-b.zones[x])[0];
    const top=cards.slice(0, CC_NATIONS_SQUAD);
    const row={nat, zone, cards, top, pow:Math.round(top.reduce((s,c)=>s+ccCardOvr(c),0)/top.length*10)/10};
    list.push(row); byNat[nat]=row;
  });
  list.sort((a,b)=>b.pow-a.pow);
  CC_NAT_BOOK={tag, list, byNat};
  return CC_NAT_BOOK;
}
function ccNatState(){
  const cr=CAREER.career;
  if(!cr.nations || cr.nations.season!==cr.season) cr.nations={season:cr.season, trial:null, qualified:{}, qualDone:{}, finalDone:false, medal:null, picks:[]};
  if(!cr.nations.picks) cr.nations.picks=[];
  return cr.nations;
}
/* Моя страна: сборная, моё место в ней (auto — без отбора; trial — через отбор; none — сборной
   нет). Капитан — сильнейший игрок страны (отзыв). Капитан-человек сам берёт двоих
   (N.picks, см. ccNatPick), четвёртое место — сильнейшему из оставшихся: это место отбора.
   Капитан-бот берёт двоих следующих по силе: попал в тройку — ты в составе без отбора, нет —
   играешь отбор за четвёртое место. squad — как показывать (пустые места капитана — null),
   full — как играть (пустые добиты сильнейшими из оставшихся). */
function ccNationsMine(){
  const me=careerCard(); if(!me || !me.nat) return null;
  const c=ccNationsBook().byNat[me.nat]; if(!c) return null;
  const myK=hKey(me);
  const others=c.cards.filter(p=>hKey(p)!==myK);
  if(others.length<CC_NATIONS_SQUAD-1) return null;
  const myOvr=ccCardOvr(me);
  const N=ccNatState();
  const captain=myOvr>=ccCardOvr(others[0]);
  /* Сначала отбор, потом выбор (отзыв): до N.trialRank капитан никого не берёт; после —
     список стоит по местам отбора, четвёртое место у лучшего из невыбранных по отбору. */
  const trialDone=!!(N.trialRank && N.trialRank.length);
  /* СПИСОК СОБИРАЕТСЯ С РАСХОДОМ, А НЕ ПОИСКОМ ПО КЛЮЧУ.

     Ключ ника без региона в сцене занят дважды у 137 человек, и строка отбора, в которой такой
     ключ встретился дважды, через find() дважды возвращала ОДНУ И ТУ ЖЕ карточку: в списке и в
     составе стоял один человек два раза, а второй пропадал совсем. Отзыв: «и
     опять два повторяющихся игрока». Теперь каждый ключ выдаёт карточку один раз, и кто не
     попал в строку отбора, идёт следом — как и было задумано. */
  const byKey=new Map();
  others.forEach(p=>{ const k=hKey(p); if(!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(p); });
  const takeOne=k=>{ const q=byKey.get(k); return (q && q.length) ? q.shift() : null; };
  let ranked;
  if(trialDone){
    const seen=new Set(), out=[];
    N.trialRank.forEach(k=>{ const p=takeOne(k); if(p){ out.push(p); seen.add(p); } });
    others.forEach(p=>{ if(!seen.has(p)) out.push(p); });
    ranked=out;
  } else ranked=others;
  const picks=(captain && trialDone) ? (function(){
    const used=new Set(), out=[];
    (N.picks||[]).forEach(k=>{ const p=ranked.find(x=>hKey(x)===k && !used.has(x)); if(p){ used.add(p); out.push(p); } });
    return out.slice(0, CC_NATIONS_SQUAD-2);
  })() : [];
  const third=others[CC_NATIONS_SQUAD-2];
  const auto=captain || !third || myOvr>=ccCardOvr(third);
  const inSquad=auto || N.trial==='won';
  let squad, full, autoFill=[];
  if(captain){
    const pk=picks.map(hKey);
    const rest=ranked.filter(p=>pk.indexOf(hKey(p))<0);
    /* ЧЕТВЁРТОЕ МЕСТО — ВСЕГДА ЛУЧШИЙ ИЗ НЕВЫБРАННЫХ, И ВИДНО ЭТО СРАЗУ.

       Превью считало место отбора «третьим по списку, пока капитан не выбрал», а правило
       вечера другое: место достаётся лучшему из тех, кого не взяли. Значит верхний по
       отбору в сборной при любом раскладе — и он же стоял в списке на выбор. Слово
       22 сентября: «могу выбрать игрока, когда он прошёл уже квал и мне его не нужно
       выбирать, и когда выбираю его, мне дают первого, который в списке» — ровно это:
       место уходило на того, кто и так ехал, а четвёртым вставал следующий.
       Теперь он сразу стоит на своём месте, а выбирать капитан может только из остальных
       (см. пул в ccNatSquadHTML). */
    /* ПУСТЫЕ МЕСТА КАПИТАНА — СИЛЬНЕЙШИМИ СВОБОДНЫМИ (28.10, Notion 27.10 скрин 12: «не могу взять игроков, просто
       рандомных дали»): добивались следующими по месту ОТБОРА — на финал ехал 73-й, пока сильные сидели дома. */
    const seat=trialDone ? (rest[0]||null) : null;
    autoFill=rest.slice(seat ? 1 : 0).sort((a,b)=>ccCardOvr(b)-ccCardOvr(a)).slice(0, Math.max(0, CC_NATIONS_SQUAD-2-picks.length));
    squad=[me, picks[0]||null, picks[1]||null, seat];
    full=[me].concat(picks, autoFill, seat ? [seat] : [], rest);
  } else {
    squad=inSquad ? [me].concat(others.slice(0, CC_NATIONS_SQUAD-1)) : c.top;
    full=squad;
  }
  /* И последняя защита: в составе не бывает двух одинаковых. Если тёзка всё-таки протёк из
     чужого списка (записи отбора, старый сейв), место освобождается — лучше пустое, чем один
     человек дважды. */
  { const seen=new Set();
    squad=squad.map(p=>{ if(!p) return p; const k=hKey(p); if(seen.has(k)) return null; seen.add(k); return p; });
    const f=new Set(); full=full.filter(p=>{ if(!p) return false; const k=hKey(p); if(f.has(k)) return false; f.add(k); return true; }).slice(0, CC_NATIONS_SQUAD); }
  return {nat:me.nat, zone:c.zone, seat:auto ? 'auto' : 'trial', captain, picks, inSquad, squad, full, others, ranked, trialDone, country:c, autoFill};
}
/* ОКНО ВЫБОРА СОСТАВА. Карточка сборной стоит под карточкой дня, и на телефоне её не видно —
   Слово: «пусть окно выскакивает в день национальных квал, когда выбрать команду нужно,
   или за день до этого, внизу вообще не видно». Окно — та же карточка поверх хаба: за день до
   отбора и в день квалификации, пока капитан не взял двоих; раз в день (N.nudged). И дверь:
   «Играть» без состава открывает это окно, а не вечер (ccNatPickGate) — «я могу нажать на играть
   без выбора игроков». */
let CC_NAT_MODAL=false;
function ccNatModalOpen(){
  const m=document.getElementById('ccNatModal'); if(!m) return false;
  const card=ccNatSquadHTML(); if(!card) return false;
  const T=L();
  m.querySelector('.cc-nat-modal-in').innerHTML=card.replace('<ul>', '<p>'+esc(T.ccNatModalWhy)+'</p><ul>')
    .replace(/<\/div>$/, '<button class="cc-nat-later" onclick="ccNatModalClose()">'+esc(T.ccNatModalLater)+'</button></div>');
  m.style.display='flex'; CC_NAT_MODAL=true;
  return true;
}
function ccNatModalClose(){ const m=document.getElementById('ccNatModal'); if(m) m.style.display='none'; CC_NAT_MODAL=false; }
// Нужен ли ещё выбор: капитан-человек, двоих нет, состав не заперт.
function ccNatPickNeeded(){
  const mine=ccNationsMine(); if(!mine || !mine.captain || !mine.trialDone || mine.picks.length>=CC_NATIONS_SQUAD-2) return false;
  return !ccNatPickLocked(mine);
}
/* Когда состав заперт: после финала всегда, после квалификации — если капитан уже взял двоих. Не взял (окно не
   застал, перемотка) — выбирает до финала (28.10, скрин 12: на финале слоты «Выбери игрока» без кнопок). */
function ccNatPickLocked(mine){
  const N=ccNatState();
  if(N.finalDone) return true;
  return !!(N.qualDone[mine.zone] && (N.picks||[]).length>=CC_NATIONS_SQUAD-2);
}
function ccNatNudge(){
  try{
    if(typeof CC_FF!=='undefined' && CC_FF) return;
    if(CC_NAT_MODAL || CAREER_RUN) return;
    const hub=document.getElementById('screen-career-hub'); if(!hub || !hub.classList.contains('active')) return;
    if(!ccNatPickNeeded()) return;
    const days=ccNatDays(), today=careerToday();
    if(!days.qual) return;
    const when=[days.trial ? ccAddDays(days.trial, 1) : null, ccAddDays(days.qual, -1), days.qual].filter(Boolean);
    if(when.indexOf(today)<0) return;
    const N=ccNatState(); if(N.nudged===today) return;
    N.nudged=today; careerSave();
    ccNatModalOpen();
  }catch(e){}
}
function ccNatPickGate(next){
  if(!next || next.type!=='nations') return true;
  if(typeof CC_FF!=='undefined' && CC_FF) return true;
  const ev=careerNationsOn(careerToday()); if(!ev || ccNatStage(ev)==='trial') return true;
  if(!ccNatPickNeeded()) return true;
  return !ccNatModalOpen();
}
/* Капитан берёт или отпускает игрока страны; двое максимум; с квалификации состав заперт. */
function ccNatPick(k){
  const mine=ccNationsMine(); if(!mine || !mine.captain || !mine.trialDone) return;
  const N=ccNatState();
  if(ccNatPickLocked(mine)) return;
  const picks=(N.picks||[]).slice();
  const i=picks.indexOf(k);
  if(i>=0) picks.splice(i, 1);
  else {
    if(picks.length>=CC_NATIONS_SQUAD-2) return;
    if(!mine.others.some(p=>hKey(p)===k)) return;
    // Тот, кто и так занимает место отбора, местом капитана не берётся (см. ccNationsMine).
    { const pk=picks.slice(); const rest=mine.ranked.filter(p=>pk.indexOf(hKey(p))<0);
      if(rest[0] && hKey(rest[0])===k) return; }
    picks.push(k);
  }
  N.picks=picks;
  careerSave();
  careerRenderHub('centre');
  if(CC_NAT_MODAL) ccNatModalOpen();   // окно выбора перерисовывается вместе с хабом
}
/* Дни Кубка этого сезона: {trial, qual, final} — ISO или null. */
function ccNatDays(){
  const out={trial:null, qual:null, final:null};
  const map=careerYearDays();
  [...map.keys()].sort().forEach(d=>{ (map.get(d)||[]).forEach(e=>{ if(e.kind==='nations'){ const st=ccNatStage(e); if(!out[st]) out[st]=d; } }); });
  return out;
}
/* Отбор страны без игрока-капитана: вся страна соло, шесть игр, итог по местам — N.trialRank.
   Капитан-бот: за четвёртое место играют все, кроме тройки (как у человека в runCareerNations);
   человек, который мог играть и не пришёл, место не получает. */
function ccNatTrialQuiet(){
  const N=ccNatState(); if(N.trialRank && N.trialRank.length) return;
  const mine=ccNationsMine(); if(!mine) return;
  const pool=(mine.captain ? mine.others : mine.others.slice(CC_NATIONS_SQUAD-1)).slice(0, 99);
  if(pool.length<2) return;
  const field=pool.map(c=>{ const t=careerTeam([c]); t._k=hKey(c); t.stagePts=0; t.wins=0; t.stageElims=0; return t; });
  simulateGames(field, CC_NATIONS.trial.games, pointsForPlace, CC_NATIONS.trial.kill);
  N.trialRank=ccNatRank(field).map(t=>t._k);
  if(!mine.captain && !mine.inSquad && !N.trial) N.trial='lost';
}
function ccNatNextDay(){
  const today=careerToday();
  const days=[...careerYearDays().keys()].filter(d=>d>=today).sort();
  for(const d of days){ if((careerYearDays().get(d)||[]).some(e=>e.kind==='nations')) return d; }
  return null;
}
/* Карточка сборной в хабе: за три недели до отбора и до финала — страна, четверо, кто капитан,
   у капитана-человека кнопки выбора. Отзыв: «должна быть эта сборная где-то перед
   началом турнира». */
const CC_NAT_CARD_DAYS=21;
function ccNatCardOn(){
  if(!CAREER || !CAREER.career || !CAREER.career.day) return false;
  const mine=ccNationsMine(); if(!mine) return false;
  if(ccNatState().finalDone) return false;
  const d=ccNatNextDay();
  return !!(d && d<=ccAddDays(careerToday(), CC_NAT_CARD_DAYS));
}
function ccNatSquadHTML(){
  const T=L();
  if(!ccNatCardOn()) return '';
  const mine=ccNationsMine();
  const N=ccNatState();
  const me=careerCard(), myK=hKey(me);
  const locked=ccNatPickLocked(mine);
  const capK=mine.captain ? myK : hKey(mine.others[0]);
  const canPick=mine.captain && !locked && mine.trialDone;
  const placeOf=k=>{ const i=(N.trialRank||[]).indexOf(k); return i>=0 ? '<i>#'+(i+1)+'</i>' : ''; };
  let autoI=0;
  const row=(c, i)=>{
    // Выбор закрыт, а место пустое — показывается тот, кто на деле играет (сильнейший свободный).
    if(!c && !canPick && mine.captain && mine.trialDone && mine.autoFill[autoI]){ const a=mine.autoFill[autoI++];
      return '<li><b>'+esc(a.handle)+'</b> <span>'+ccCardOvr(a)+'</span>'+placeOf(hKey(a))+' <em>'+esc(T.ccNatAutoTag)+'</em></li>'; }
    if(!c) return '<li class="cc-nat-empty"><span>'+esc(mine.captain && !mine.trialDone ? T.ccNatAfterTrial : T.ccNatPickSlot)+'</span></li>';
    const k=hKey(c);
    const tags=[];
    if(k===capK) tags.push(T.ccNatCaptain);
    if(k===myK) tags.push(T.ccNatYou);
    if(i===CC_NATIONS_SQUAD-1 && (mine.captain || (!mine.inSquad && !N.trial))) tags.push(T.ccNatTrialSlot);
    const drop=(canPick && mine.picks.some(p=>hKey(p)===k)) ? ' <button class="cc-nat-chip cc-nat-chip-x" onclick="ccNatPick(\''+jsq(k)+'\')">'+esc(T.ccNatUnpickBtn)+'</button>' : '';
    return '<li><b>'+esc(c.handle)+'</b> <span>'+ccCardOvr(c)+'</span>'+(k!==myK ? placeOf(k) : '')+(tags.length ? ' <em>'+esc(tags.join(' · '))+'</em>' : '')+drop+'</li>';
  };
  let pick='';
  if(mine.captain && !mine.trialDone && !locked){
    const days=ccNatDays();
    pick='<div class="cc-nat-pick"><span>'+esc(T.ccNatTrialFirst)+'</span><p>'+esc(T.ccNatTrialFirstSub(days.trial ? ccDayLabel(days.trial) : ''))+'</p></div>';
  } else if(canPick && mine.picks.length<CC_NATIONS_SQUAD-2){
    const pk=mine.picks.map(hKey);
    /* КОГО ПРЕДЛАГАТЬ. Первый из невыбранных занимает четвёртое место сам — его в списке нет
       (см. ccNationsMine). Остальных список резал по МЕСТАМ ОТБОРА, и сильный игрок страны,
       провалившийся в тот вечер, за двенадцать строк не попадал вовсе: отзыв —
       «игроки в выбор попадают, не самых лучших предлагают». Теперь двенадцать — это двенадцать
       сильнейших страны из свободных, а порядок остаётся по отбору (место стоит на кнопке):
       отбор решает очередь, рейтинг решает, кого вообще показывать. */
    const free=mine.ranked.filter(p=>pk.indexOf(hKey(p))<0).slice(1);
    const show=new Set(free.slice().sort((a,b)=>ccCardOvr(b)-ccCardOvr(a)).slice(0, 12).map(hKey));
    const pool=free.filter(p=>show.has(hKey(p)));
    pick='<div class="cc-nat-pick"><span>'+esc(T.ccNatPickHint)+'</span>'+
      pool.map(p=>'<button class="cc-nat-chip" onclick="ccNatPick(\''+esc(hKey(p))+'\')">'+placeOf(hKey(p))+esc(p.handle)+' <b>'+ccCardOvr(p)+'</b></button>').join('')+'</div>';
  }
  // Метка сборной: где садимся на Кубке наций — картинка и кнопка сменить, или кнопка выбрать.
  const sp=careerSpotList('nations')[0];
  const go='onclick="ccNatModalClose();careerTab(\'me\');careerSpotOpenFor(\'nations\')"';
  const spot=sp
    ? '<div class="cc-nat-spot">'+(careerSpotShotHTML(sp.i, 'nations', 'ch-spot-shot', 16/9)||'')+'<div class="cc-nat-spot-in"><em>'+esc(T.ccNightSpotCap)+'</em><b>'+esc(T.landingZoneSuffix(sp.i+1))+'</b><button class="cc-nat-btn" '+go+'>'+esc(T.ccSpotChange)+'</button></div></div>'
    : '<div class="cc-nat-spot"><button class="cc-nat-btn" '+go+'>'+esc(T.ccNatSpotPick)+'</button></div>';
  return '<div class="ch-tile cc-nat-card"><em>'+esc(T.ccNatSquadTitle)+'</em>'+
    '<h4>'+flagImg(mine.nat, 16)+esc(natDisplay(mine.nat))+'</h4>'+
    '<ul>'+mine.squad.map(row).join('')+'</ul>'+pick+spot+'</div>';
}
function careerNationsOn(iso){
  const list=careerYearDays().get(iso||careerToday())||[];
  return list.find(e=>e.kind==='nations') || null;
}
function ccNatStage(ev){ const id=String((ev && ev.id)||''); return /Trial/.test(id) ? 'trial' : /Qual/.test(id) ? 'qual' : 'final'; }
function careerNationsCan(ev){
  if(!ev) return false;
  const mine=ccNationsMine(); if(!mine) return false;
  const N=ccNatState(), st=ccNatStage(ev);
  if(st==='trial') return mine.seat==='trial' && !N.trial;
  if(!mine.inSquad) return false;
  if(st==='qual') return !N.qualDone[mine.zone];
  return !N.finalDone && (N.qualified[mine.zone]||[]).indexOf(mine.nat)>=0;
}
function ccNatWhyLocked(){
  const ev=careerNationsOn(careerToday()); const mine=ccNationsMine();
  if(!mine) return L().ccNatLockedNoCountry;
  const N=ccNatState(), st=ccNatStage(ev);
  if(st==='trial') return mine.captain ? L().ccNatLockedCap : (N.trial ? (N.trial==='won' ? L().ccNatTrialWon : L().ccNatTrialLost) : L().ccNatLockedIn);
  if(!mine.inSquad) return N.trial==='lost' ? L().ccNatTrialLost : L().ccNatLockedNotIn(natDisplay(mine.nat), mine.country.top.map(c=>c.handle).join(', '));
  if(st==='qual') return L().ccNatLockedDone;
  return (N.qualified[mine.zone]||[]).indexOf(mine.nat)>=0 ? L().ccNatLockedDone : L().ccNatLockedOut(natDisplay(mine.nat));
}
/* Сборной не платят за флаг и язык: состав и так одной страны. Отзыв: «убери на этих
   турнирах синергию языка и страны». Снимается ровно то, что начислил computeSynergy: страна —
   раз на группу флага, язык — раз на кластер (одна ссылка type:'language' на кластер); сила
   пересчитывается той же формулой, что в careerTeam. Партнёрская химия настоящих пар остаётся. */
function ccNatStripSyn(t, cards){
  if(!t || !t.syn) return t;
  const links=t.syn.links||[];
  const natLinks=links.filter(l=>l.type==='nation'), langLinks=links.filter(l=>l.type==='language');
  if(!natLinks.length && !langLinks.length) return t;
  const groups={}; (cards||[]).forEach(c=>{ if(c && c.nat) groups[c.nat]=(groups[c.nat]||0)+1; });
  const natGroups=Object.keys(groups).filter(n=>groups[n]>=2).length;
  t.syn.bonus-=natGroups*SYN_NATION + langLinks.length*SYN_LANGUAGE;
  if(t.syn.bonus<0) t.syn.bonus=0;
  t.syn.links=links.filter(l=>l.type!=='nation' && l.type!=='language');
  const T=L();
  t.syn.details=(t.syn.details||[]).filter(d=>!(T.synergyNation && String(d).indexOf(T.synergyNation)>=0) && !(T.synergyLanguage && String(d).indexOf(T.synergyLanguage)>=0));
  const after=synCap(t.syn.bonus);
  const ageEdge=ageEdgeOf(cards);
  t.pow = CARD_MODE
    ? Math.round((t.ovrAvg+after+t.roleBonus)*t.regionMult + ageEdge)
    : Math.round((cards.reduce((s,p)=>s+p.rating,0)/cards.length+after)*t.regionMult + ageEdge);
  return t;
}
function ccNatTeam(row, squad){
  const cards=squad||row.top;
  const t=ccNatStripSyn(careerTeam(cards), cards);
  // Имя команды в таблице: флаг, страна и четыре ника в скобках (отзыв).
  t.name=flagImg(row.nat, 14)+natDisplay(row.nat)+' ('+cards.map(c=>c.handle).join(', ')+')'; t.nation=row.nat; t.zone=row.zone;
  return t;
}
function ccNatRank(teams){ return teams.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims); }
/* Лобби квалификации зоны: змейкой по силе, если сборных больше, чем влезает в одно. */
function ccNatQualLobbies(zone, mine){
  const rows=ccNationsBook().list.filter(r=>r.zone===zone);
  const mineIn=(mine && mine.zone===zone && mine.inSquad) ? 1 : 0;
  /* Комната одна: 25 сильнейших сборных зоны, слабейшие за бортом. Вопрос «почему 14
     команд вместо 25»: в Европе 28 стран, змейка делила их на две комнаты по 14. */
  const teams=rows.map(r=>(mine && mine.nat===r.nat && mine.inSquad) ? null : ccNatTeam(r)).filter(Boolean).sort((a,b)=>b.pow-a.pow).slice(0, CC_NATIONS_LOBBY-mineIn);
  const n=Math.max(1, Math.ceil((teams.length+mineIn)/CC_NATIONS_LOBBY));
  const lobbies=Array.from({length:n}, ()=>[]);
  teams.sort((a,b)=>b.pow-a.pow).forEach((t,i)=>{ const lap=Math.floor(i/n), pos=i%n; lobbies[lap%2 ? n-1-pos : pos].push(t); });
  return lobbies;
}
function ccNatSlotsOf(zone, lobbies, i){
  const total=CC_NATIONS_SLOTS[zone]||0, n=lobbies.length;
  return Math.floor(total/n)+(i<total%n ? 1 : 0);
}
/* Квалификация зоны без игрока — тихо, результат в книгу сезона. */
function ccNatQualQuiet(zone){
  const N=ccNatState();
  if(N.qualDone[zone]) return N.qualified[zone]||[];
  const lobbies=ccNatQualLobbies(zone, null);
  const out=[];
  lobbies.forEach((room, i)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    // Отбор зоны, в которой игрока нет, — мир: один бросок на всех (см. ccWorldRun).
    ccWorldRun('nat|'+((CAREER.career||{}).season||1)+'|'+zone+'|'+i,
               ()=>simulateGames(room, CC_NATIONS.qual.games, pointsForPlace, CC_NATIONS.qual.kill));
    ccNatRank(room).slice(0, ccNatSlotsOf(zone, lobbies, i)).forEach(t=>out.push(t.nation));
  });
  N.qualified[zone]=out; N.qualDone[zone]=true;
  return out;
}
function ccNatFinalField(mine){
  const N=ccNatState(), book=ccNationsBook();
  Object.keys(CC_NATIONS_SLOTS).forEach(z=>ccNatQualQuiet(z));
  const nats=[]; Object.keys(N.qualified).forEach(z=>(N.qualified[z]||[]).forEach(n=>{ if(nats.indexOf(n)<0) nats.push(n); }));
  return nats.map(n=>book.byNat[n]).filter(Boolean).filter(r=>!(mine && mine.inSquad && r.nat===mine.nat)).map(r=>ccNatTeam(r)).slice(0, CC_NATIONS_FIELD);
}
async function runCareerNations(){
  const cr=CAREER.career;
  const ev=careerNationsOn(careerToday());
  if(!ev || !careerNationsCan(ev)) return;
  const me=careerCard(); if(!me) return;
  const mine=ccNationsMine(); if(!mine) return;
  const N=ccNatState(), st=ccNatStage(ev), S=CC_NATIONS[st];
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted, prevSet=ACTIVE_LANDING_SET;
  const mySquad=st==='trial' ? [me] : mine.full;
  CARD_MODE=true; squadSize=mySquad.length; drafted=mySquad;
  useLandingSet(careerBrSet());
  ccNightSpotOn('nations');   // дом сборной, а не дуо-дом сезона; см. careerSpotSets
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
  // Финал — ЛАН: перелёт и пост из города, как у Саммита и Глобалов.
  if(st==='final') careerLanArrive('nations', ev);
  const you=ccNatStripSyn(careerYouTeam(drafted), drafted);
  you.name=(st==='trial' ? L().yourTeamPrefix+teamLabel(drafted) : L().yourTeamPrefix+flagImg(mine.nat, 14)+natDisplay(mine.nat)+' ('+mySquad.map(c=>c.handle).join(', ')+')'); you.isYou=true; you.nation=mine.nat;
  let field, cut=0, note='';
  if(st==='trial'){
    // Все люди страны, кроме троих сильнейших (они уже в составе), соло; до ста человек.
    const rivals=mine.others.slice(CC_NATIONS_SQUAD-1, CC_NATIONS_SQUAD-1+99).map(c=>{ const t=careerTeam([c]); t.name=teamLabel([c]); t._k=hKey(c); return t; });
    field=[you, ...rivals]; cut=1;
  } else if(st==='qual'){
    const lobbies=ccNatQualLobbies(mine.zone, mine);
    // Своё лобби — самое слабое по силе верха, туда и садимся; остальные играют тихо.
    let at=0; lobbies.forEach((l,i)=>{ if(l.length<lobbies[at].length) at=i; });
    lobbies[at].unshift(you);
    field=lobbies[at]; cut=ccNatSlotsOf(mine.zone, lobbies, at);
    lobbies.forEach((room, i)=>{ if(i===at) return; room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; }); simulateGames(room, S.games, pointsForPlace, S.kill); });
    field._lobbies=lobbies; field._at=at;
  } else {
    field=[you, ...ccNatFinalField(mine)].slice(0, CC_NATIONS_FIELD);
  }
  const label=ev.label;
  await simulateGamesLive(field, S.games, pointsForPlace, S.kill, 'stage', 0, null, null,
    {lobbySize:field.length, stageName:label, mapReplay:true, choices:st!=='trial', stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, label, ['nations'])});
  const ranked=ccNatRank(field);
  const place=ranked.indexOf(you)+1;
  let through=false;
  if(st==='trial'){
    through=place===1; N.trial=through ? 'won' : 'lost';
    N.trialRank=ranked.map(t=>t===you ? hKey(me) : t._k).filter(Boolean);
    note=through ? L().ccNatTrialWon : L().ccNatTrialLost;
  } else if(st==='qual'){
    through=place<=cut;
    const lobbies=field._lobbies, out=[];
    lobbies.forEach((room, i)=>{ ccNatRank(room).slice(0, ccNatSlotsOf(mine.zone, lobbies, i)).forEach(t=>out.push(t.nation)); });
    N.qualified[mine.zone]=out; N.qualDone[mine.zone]=true;
    note=through ? L().ccNatQualThrough(natDisplay(mine.nat)) : L().ccNatQualOut(natDisplay(mine.nat), cut);
  } else {
    N.finalDone=true; through=place<=3;
    if(place<=3){ N.medal=place; if(!Array.isArray(cr.medals)) cr.medals=[]; cr.medals.push({season:cr.season, nat:mine.nat, place}); }
    note=place<=3 ? L().ccNatMedal(place) : L().ccNatFinalPlace(place);
  }
  // Деньги финала — его фонд: на команду по таблице, тебе четверть.
  let cash=0;
  if(st==='final'){
    { const only=ccNatBoardsOwnOnly(); if(only) CC_BOARD_ONLY_YOU=true;
      try{ careerMoneyAdd(ranked, nationsPrize); } finally{ if(only) CC_BOARD_ONLY_YOU=false; } }
    cash=nationsPrize(place);
    if(cash){ ccPayIn(ccShareOf(cash, you)); note+=' · '+L().ccNatCash(ccMoney(ccShareOf(cash, you))); }
  }
  const shell=createStageCardShell(label+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, st==='final' ? (place<=3 ? true : null) : through, you.gotVR, note);
  await revealStandings(shell, ranked, you, cut, null, null, st==='final' ? nationsPrize : null, null, st==='final');
  removeSkipButton();
  { const only=ccNatBoardsOwnOnly(); if(only) CC_BOARD_ONLY_YOU=true;
    try{ careerPrAdd(ranked, {div:cr.division, kind:'nations', stage:st}); } finally{ if(only) CC_BOARD_ONLY_YOU=false; } }
  if(st!=='trial') careerReachAdd(careerReachResult(place, field.length, 1, st==='final' ? 'globals' : 'major'));
  const shot={tbl:ccStageShot(ranked, you, 1, label)};
  if(st==='trial') careerNews(through?'good':'flat', through?'ccNewsNatTrialWon':'ccNewsNatTrialLost', [natDisplay(mine.nat), place, field.length], shot);
  else if(st==='qual') careerNews(through?'good':'bad', through?'ccNewsNatQualThrough':'ccNewsNatQualOut', [natDisplay(mine.nat), place, field.length], shot);
  else careerNews(place<=3?'good':'flat', place<=3?'ccNewsNatMedal':'ccNewsNatFinal', [natDisplay(mine.nat), place, field.length], shot);
  if(st==='final') careerCongrats(ranked, you, L().ccNatCongrats);
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place, of:field.length, pts:you.stagePts,
               passed:through, ovr:CAREER.player.ovr, games:S.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mySquad[1] ? mySquad[1].handle : null, mates: st==='trial' ? [] : ccLogMates(mySquad.slice(1)), prize:ccShareOf(cash, you), kind:'nations', stage:st, nat:mine.nat,
               won: st==='final' ? ccStageSeatRow(ranked[0]) : undefined,
               top: st==='final' ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0; ccNightSpotOff();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:label, place:place, through:through, wins:you.wins||0, cash:cash, cut:cut});
}
/* Мир играет Кубок наций без игрока: квалификации всех зон в день квалификации, финал в день
   финала — победитель в ленту, книга сезона заполнена. Зовётся из careerWorldFinals. */
function ccNatWorldPlay(day, play, stubOf){
  const ev=careerNationsOn(day); if(!ev) return;
  const st=ccNatStage(ev); if(st==='trial'){ try{ ccNatTrialQuiet(); }catch(e){} return; }
  const N=ccNatState();
  if(st==='qual'){
    Object.keys(CC_NATIONS_SLOTS).forEach(z=>ccNatQualQuiet(z));
    const mine=ccNationsMine();
    const q=(mine && N.qualified[mine.zone])||[];
    if(mine && !mine.inSquad) careerNews(q.indexOf(mine.nat)>=0 ? 'flat' : 'bad', q.indexOf(mine.nat)>=0 ? 'ccNewsNatWorldQual' : 'ccNewsNatWorldOut', [natDisplay(mine.nat)]);
    return;
  }
  { const only=ccNatBoardsOwnOnly(); if(only) CC_BOARD_ONLY_YOU=true;
    try{ play(day, 'nations', 'nations', ev.label||'Nations Cup', ()=>[stubOf(), ...ccNatFinalField(null)],
       CC_NATIONS.final.games, pointsForPlace, CC_NATIONS.final.kill, nationsPrize, {div:1, kind:'nations', stage:'final'}); }
    finally{ if(only) CC_BOARD_ONLY_YOU=false; } }
  N.finalDone=true;
}

async function runCareerSoloSeries(){
  const cr=CAREER.career;
  const ev=careerSoloSeriesOn(careerToday());
  if(!ev || !careerSoloSeriesCan(ev)) return;
  const me=careerCard();
  if(!me) return;
  /* В команде одно лобби на двоих. Раньше каждый клиент собирал поле [я, боты] из одного сида,
     и поля расходились. Теперь поле у обоих одно: люди впереди в порядке ников (как MP.teamOf), боты
     из careerSoloField без обоих ников; opts.together держит двоих в одной сотне.
     Вопросы с адресатом (mpTag → 'drop:<ник>', см. ccMpMine), ответ напарника приходит очередью.
     Если в хиты прошёл один, второй в этот день не играет, вечер одиночный (CC_MP_ALONE). */
  /* ЛИЧНЫЙ ВЕЧЕР, ОБЩИЙ ТУРНИР. Отзыв: «зачем друг друга
     ждать, когда это соло» и «ну личный вечер, но турнир они один и тот же
     играют». Локстеп на двоих в соло стоил ожидания на гейте и красных строк
     (h102 vs h103 при одном поле): двое считали общую сотню, а расходились на
     силе друг друга. Теперь в команде соло всегда одиночный вечер
     (CC_MP_ALONE): гейта нет, каждый считает свою сотню сам, напарник стоит в
     ней участником по своей карточке, а в общий сейв уезжает только СВОЙ итог
     (soloBy, строка журнала, рост). День шагает, когда отыграли оба — см.
     ccSoloTeamSettle. */
  /* ОДИН ТУРНИР НА ДВОИХ — ОДНА ТАБЛИЦА. Его последнее слово, 29 августа,
     после личных вечеров: «опять разные турниры играют, не один» — два
     клиента считали одну сотню каждый сам, и таблицы (кто где финишировал)
     у них вышли разные. Одна таблица бывает только у одного расчёта, поэтому
     соло вдвоём — снова локстеп: общий старт, общая сотня, свои вопросы у
     каждого (адресные, см. ccMpMine), сверка каждой игры. Одиночный вечер
     (CC_MP_ALONE) остаётся на случай, когда напарнику играть нечего — не
     прошёл этап или уже отыграл; тогда день шагает через ccSoloTeamSettle. */
  const peerCard=(ccMpTeam() && typeof MP!=='undefined' && MP.peer) ? MP.peer : null;
  const peerIn=!!(peerCard && careerSoloSeriesCanFor(ev, ccSoloStateOf(ev, peerCard)));
  /* Напарник этот день в перемотке пропустил (ffskip) — его карточка может говорить «может играть», но
     к воротам он не придёт: вечер одиночный (годовой прогон вдвоём 2020, соло-серия 16 ноября). */
  const alone=ccMpTeam() && (!peerIn || CC_MP_PEER_SKIPS.has(careerToday()));
  if(alone) CC_MP_ALONE=true;
  const mpStart=ccMpLock() ? await ccMpGate('solo') : null;
  const two=ccMpOn() && peerIn;
  const pc=two ? (MP.peer||peerCard) : null;   // карточка после гейта — свежая
  const dayAtStart=careerToday();

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  const prevSet=ACTIVE_LANDING_SET;
  /* СОЛО-СОСТОЯНИЕ ВКЛАДКИ — ВОЗВРАЩАЕТСЯ ВСЕГДА (errlog 23.10: после соло-квалов Solo Series командный
     Victory Cup одного из двоих шёл одиночками на соло-острове — «n100h94+99 m1.60» против дуо «n2470 m1.39»). */
  try{
  CARD_MODE=true;
  squadSize=1;
  drafted=[me];
  /* Соло-ФНКС — на острове седьмой главы (s42), дроблёном под соло той же
     сеткой, что и январская серия: коробки точек с никами, красные — где
     сели по нескольку. Отзыв со скрином карты Solo Series:
     «как на соло выглядела, также и на solo fncs нужно сделать, а не 100
     квадратиков». Сотня клеток s42solo (1 сентября) больше не садится.
     Остров именно s42, а не careerBrSet(): в трио-год сезонный — шестая
     глава, а FNCS Solos играются на седьмой (репорт того же дня). */
  useLandingSet(ccSoloFncsSet(ev));
  /* Дом на этом вечере — соло-метка, а не сезонный дуо-дом. Правка: «в соло ещё метки, не для соло, а для других режимов».
     Указатель держится весь вечер и гасится вместе с остальным состоянием
     прогона; сетка у соло своя (сто клеток), метка ставится по координатам,
     поэтому выбранная в хабе точка попадает в свою клетку. См. ccNightSpot. */
  ccNightSpotOn('solo');

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

  /* Свой игрок в соло — своя форма, без химии и без средней с напарником:
     careerYouTeam считает команду, а тут двое по отдельности. */
  const soloYou=function(card, form, label){
    const t=careerTeam([card], true);
    t.pow=Math.round(t.pow+form);
    t.summitRegion=ccCareerRegion();
    t.name=label; t.mpTag=':'+hKey(card);
    return t;
  };
  let you, mate=null;
  if(two){
    { const self=ccSoloSelf(me); you=soloYou(self.card, self.form, L().yourTeamPrefix+teamLabel(drafted)); }
    mate=soloYou(pc, Number(pc.formPow)||0, teamLabel([pc]));
    mate.isMate=true;
  } else {
    you=careerYouTeam(drafted);
    you.name=L().yourTeamPrefix+teamLabel(drafted);
  }
  you.isYou=true;
  const humans=mate ? (hKey(me)<hKey(pc) ? [you, mate] : [mate, you]) : [you];
  /* Открытая комната бывает только у январского квала: у FNCS Solos карьера
     входит с Round 3, а там поле уже названо самим Epic — сотня, семьдесят в
     LCQ Final. См. CC_SOLOS_STAGES. */
  const spec=ev.spec||null;
  const open=spec ? !!spec.open : ev.stage==='qual';
  const lobbyCr=open ? cr : Object.assign({}, cr, {division:1});
  const size=open ? (spec && spec.fieldScale ? Math.max(200, Math.round(careerVictoryField(true)*spec.fieldScale())) : careerVictoryField(true))
                   : (spec ? spec.field : CC_SOLO_FIELD);
  /* Напарник — в той же сотне, участником: его карточка с провода, его форма,
     без адресных вопросов и без записи его итога — свой итог он считает сам. */
  /* …но только если он на этот этап ДОПУЩЕН. Скриншот (вкладка
     напарника, финал Solo Series): «как сюда попал Malibuca, когда я за него
     играю и он не квальнулся, даже хиты не играл» — Малибука стоял третьим в
     финале, который играл один panzer. Не прошёл в хиты — в хитах и финале
     его нет; отыграл сегодня сам — тоже нет, его сотня уже сыграна. */
  const peerBot=(alone && peerCard && hKey(peerCard)!==hKey(me) && ccSoloPeerSeat(ev, ccSoloStateOf(ev, peerCard)))
    ? soloYou(peerCard, Number(peerCard.formPow)||0, teamLabel([peerCard])) : null;
  /* ИЗ СОТНИ ВЫЧИТАЮТСЯ ОБА человека — и тёзки обоих. Ник человека может
     совпасть с ником настоящего про из ростера (его же Sky и Scroll, 29
     августа): если исключить только себя, у каждого клиента в поле останется
     тёзка напарника, и это одна разная строка из 4900 — «diff 1 of 4900:
     #278 scroll:96 vs sky:96». Сторож — live-two с CC_NICK_A=Sky CC_NICK_B=Scroll. */
  const fieldMine=mate ? [me, pc] : peerBot ? [me, peerCard] : drafted;
  // Прошедшие прошлого этапа из твоей сотни — первыми, сцена добирает остальное. См. ccSoloCarryPut.
  // Общий финал гонки: хиты у каждого свои, перенос из своего хита развёл бы поле. Только общий пул.
  const carried=(open || (typeof ccRaceLock==='function' && ccRaceLock())) ? [] : ccSoloCarryTake(ev,
    fieldMine.concat((typeof ccRaceOn==='function' && ccRaceOn()) ? ccRaceAllCards() : []),
    size-humans.length-(peerBot ? 1 : 0));
  const field=[...humans, ...(peerBot ? [peerBot] : []), ...carried,
               ...careerSoloField(lobbyCr, fieldMine.concat(...carried.map(t=>t.squad||[])),
                                  size-(humans.length-1)-(peerBot ? 1 : 0)-carried.length, open, ev.stage)];

  const kindsForDrop=['solo'];
  const zones=null;
  const games=spec ? spec.games
            : ev.stage==='qual' ? CC_SOLO_QUAL_GAMES
            : ev.stage==='heats' ? CC_SOLO_HEAT_GAMES : CC_SOLO_FINAL_GAMES;
  if(spec && spec.killCap) CC_KILL_CAP=spec.killCap;   // Solo Reload: не больше 10 элимов за матч (правило Epic)
  await simulateGamesLive(field, games,
    (spec && spec.pts) || (ev.stage==='heats' ? soloHeatsPoints : victoryR1Points), spec ? spec.kill : CC_SOLO_KILL,
    'stage', 0, null, zones,
    {twoDay:ev.stage==='final' || !!(spec && spec.twoDay), lobbySize:(spec && spec.reload) ? ccReloadLobby(1) : 100, stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     /* Виктори в хитах — билет, и вечер на нём для тебя кончается: правило Epic
        (см. шапку раздела) и то же stopOnWin, что у хитов Мейджора. Раньше
        победитель первой игры играл все шесть, карточка говорила «прошёл», а
        таблица ставила его 47-м под чертой без пометки. Игрок:
        «I should have qualified with the first game but that way I didn't». */
     stopOnWin: spec ? !!spec.vr : ev.stage==='heats',
     together: mate ? humans : null,
     dropEachGame:(g,room)=>open ? null : ccSoloDrops(room||field, humans, ev.label, kindsForDrop)});
  /* Равные очки — по правилам Epic (сверка 29.10): победы, средние элимы за матч, среднее место; секунд жизни движок не
     хранит, этот последний шаг опущен. Было: победы, затем элимы всего — у сыгравших меньше матчей (победа уводит из хита)
     это занижало их. */
  const avgOf=(t,k)=>{ const l=t.stageLog||[]; return l.length ? l.reduce((x,r)=>x+(r[k]||0),0)/l.length : 0; };
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || avgOf(b,'elims')-avgOf(a,'elims') || avgOf(a,'place')-avgOf(b,'place'));
  /* Прошедшие по победе — НАВЕРХУ (29.10, его «почему я не выше всех в таблице»): у Epic победа в хите давала 947
     сверху, и победитель стоял первым. Бонус снят (см. soloHeatsPoints), поэтому порядок держится отдельно: сначала
     взявшие Виктори этого этапа, потом остальные по очкам. Только показ и место в карточке — кто проходит по
     очкам (cut, ccSolosSeat), считает ranked, как было. */
  const vrStage=spec ? !!spec.vr : ev.stage==='heats';
  const shown=vrStage ? ranked.slice().sort((a,b)=>((b.wins||0)>0)-((a.wins||0)>0)) : ranked;
  const place=shown.indexOf(you)+1;
  careerPrAdd(ranked, {div:cr.division, kind:'solo', stage:ev.stage});
  // Соло играется в несколько вечеров: доска — только на финальном.
  if(ev.stage==='final' || ev.stage==='rlfinal') ccBoardAfter(ranked, you, ev.label);
  const cut=spec ? ccSolosCut(spec)
          : ev.stage==='qual' ? soloSeriesQualCut()
          : ev.stage==='heats' ? soloSeriesHeatCut() : 0;
  /* Куда сел игрок — у FNCS Solos это не «прошёл / не прошёл»: из Fast Track
     уходят все (топ-8 в финал, остальные в хиты), а из хита есть третий выход
     — места 36-50 в LCQ Final. См. ccSolosSeat. */
  const seatOf=spec ? function(t){ return ccSolosSeat(spec, t, ranked); } : null;
  const passOf=function(t){
    if(spec) return seatOf(t)===spec.pass;
    let th=cut ? (ranked.indexOf(t)+1)<=cut : false;
    if(ev.stage==='heats' && (t.wins||0)>0) th=true;
    return th;
  };
  const prizeFn=spec ? (spec.prize||null) : (ev.stage==='final' ? soloSeriesPrize : null);
  // Любое место дальше — проход (Fast Track: 9–100 в хиты, хиты 36–50 — в LCQ Final), не только финал (аудит 29.09).
  const through=spec ? !!seatOf(you) : passOf(you);
  removeSkipButton();

  const shell=createStageCardShell(ev.label+' — '+field.length);
  await revealStageLog(you, shell, true);
  let cash=0;
  const cashOf=function(t){ return prizeFn ? (prizeFn(ranked.indexOf(t)+1)||0) : 0; };
  if(prizeFn){
    careerMoneyAdd(ranked, prizeFn);
    cash=cashOf(you);
    if(cash){ const mine=ccShareOf(cash, you); ccPayIn(mine); }
    careerReachAdd(careerReachResult(place, field.length, 1, 'solo'));
    careerNews(cash?'good':'flat', cash?'ccNewsSoloCash':'ccNewsSoloOut',
               cash?[place, ccNum(cash)]:[ev.label, place, field.length],
               {tbl:ccStageShot(shown, you, CAREER.career.division, ev.label, cut)});
    ccSoloStateSet(ev, me, {got:'final', pass:'final', seat:null});
    if(mate) ccSoloStateSet(ev, pc, {got:'final', pass:'final', seat:null});
  } else {
    const next=function(card, t){
      const was=ccSoloStateOf(ev, card);
      const at=ranked.indexOf(t)+1;
      if(spec){
        const st0=seatOf(t);
        // В хиты Epic раскладывает через одного по месту в Fast Track / Q2 Round 3 (правила, сверка 29.10).
        return {got:ev.stage, seat:st0, day:careerToday(), heat: st0==='heats' ? ((ranked.indexOf(t)+1)%2===1 ? 1 : 2) : null};
      }
      return {got:ev.stage, pass: passOf(t) ? ev.stage : (was && was.pass)||null,
              day:careerToday(),
              best: ev.stage==='qual' ? Math.min(at, (was && was.best)||Infinity) : (was && was.best)||null};
    };
    ccSoloStateSet(ev, me, next(me, you));
    if(mate) ccSoloStateSet(ev, pc, next(pc, mate));
    const soloNext={qual:'heats', heats:'final'};
    ccSoloCarryPut(ev, ranked.filter(t=>humans.indexOf(t)<0 && t!==peerBot)
      .map(t=>[spec ? seatOf(t) : (passOf(t) ? soloNext[ev.stage] : null), t]));
    /* Из Fast Track «не прошёл» не бывает: топ-8 едет в финал, остальные в
       хиты, и это всё равно проход дальше. Строка ленты — по месту, а не по
       отсечке. */
    const moved=spec ? !!seatOf(you) : through;
    careerNews(moved?'good':'flat', moved?'ccNewsSoloThrough':'ccNewsSoloOut',
               [ev.label, place, field.length]);
    // Хиты соло — те же «квальнулся, сажусь туда-то», только в финал. См. ccGrandsCalls.
    if(ev.stage==='heats' && !spec) ccGrandsCalls('finals', you, moved, field.filter(passOf));
  }
  const byVR=(spec ? !!spec.vr : ev.stage==='heats') && (you.wins||0)>0;
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, {cut:cut}, place, prizeFn),
    byVR, byVR ? L().stage2NoteByVR : cut ? (through ? L().ccRelPass(cut) : L().ccRelFail(cut)) : '');
  // Прошедшие — по правилу этапа (виктори тоже), а не только по черте.
  await revealStandings(shell, ranked, you, cut, null, cut ? new Set(field.filter(passOf)) : null,
    prizeFn, null, !!prizeFn);

  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  /* Строка журнала — на КАЖДОГО из людей, с обеих сторон, в одном порядке:
     журнал общий, и две разные строки от двух клиентов перетёрли бы друг
     друга при закрытии. Чужой рейтинг берётся из его карточки. */
  humans.forEach(function(t){
    const places=(t.stageLog||[]).map(g=>g.place);
    const isMe=(t===you);
    const cashT=cashOf(t);
    cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:ranked.indexOf(t)+1,
                 of:field.length, pts:t.stagePts, passed:passOf(t)||cashT>0,
                 ovr: isMe ? CAREER.player.ovr : Math.round(pc._targetOvr||pc.rating||0),
                 games:games, wins:t.wins||0,
                 elims:t.stageElims||0,
                 avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
                 mate:null, mates:null, prize:ccShareOf(cashT, t),
                 kind:'solo', stage:ev.stage, solo:true,
                 who: mate ? t.mpTag.slice(1) : undefined});
  });
  careerMonthGoalCheck();
  await ccMpClose(ranked);
  if(alone){
    /* Свой итог — напарнику сейчас же (soloBy, журнал, рост), день — только
       когда отыграли оба. Пока не отыграл второй, день стоит, а панель дня
       говорит, что ждём его результат; его push доедет в ccMpApplyRemote и
       шагнёт день оттуда. См. ccSoloTeamSettle. */
    CC_MP_ALONE=false;
    // HOLD после close снимает шаг дня, а его тут может не быть долго (ждём
    // напарника) — и метка на дуо-вечер не уезжала («у тимейта не показывает
    // spot», 30 августа). День идёт только вперёд, держать незачем.
    CC_MP_HOLD=false;
    careerSave();
    if(careerToday()===dayAtStart) ccSoloTeamSettle();
  } else {
    careerAdvanceTo(ccAddDays(careerToday(), 1));
    CC_MP_ALONE=false;
    careerSave();
  }

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0; ccNightSpotOff();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:through||cash>0,
    wins:you.wins||0, cash:cash, cut:cut});
  }finally{
    // Ошибка посреди соло-вечера не должна оставлять вкладке состав из одного и соло-остров.
    try{ CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0; ccNightSpotOff(); }catch(e){}
  }
}
/* Дроп двоих в одном лобби — по очереди, в порядке ников, каждый на свой
   вопрос; комната после первого передаётся второму как есть. */
async function ccSoloDrops(room, humans, title, kinds){
  // Сплит гонки: в этом лобби может не быть никого из своих — тогда спрашиваются соперники в нём (careerLandingPick по адресам).
  const here=humans.filter(h=>(room||[]).indexOf(h)>=0);
  if(here.length<humans.length) humans=here.length ? here : [humans[0]];
  if(humans.length<2) return careerLandingPick(room, humans[0], title, kinds);
  let groups=null;
  for(const h of humans){
    groups=await careerLandingPick(room, h, title, kinds, {tag:h.mpTag, pre:groups});
  }
  return groups;
}

async function runCareerCup(){
  const cr=CAREER.career;
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('cup') : null;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
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
  if(CC_AWAY) you.pow=Math.max(1, Math.round(you.pow-CC_AWAY.pen));   // чужой сервер: пинг (ccAwayPen)
  const cut=careerCupCut(cr.division);
  const field=[you, ...careerCupField(cr, drafted, careerCupSize(cr.division), ccCupWeekSalt())];

  // Division 1's Tuesday carries Monday in with it. Keyed by team name, which
  // is stable because the field is: the same seed draws the same duos. Handed
  // to the live stage rather than added after it, so the table on screen is the
  // week's table all evening and the line across it is the real cut.
  const banked=(!CC_AWAY && cr.division===1 && careerCupSession()===2 && cr.d1 &&
                cr.d1.monday===careerMonday(careerToday())) ? cr.d1 : null;
  // Unpacked back into the four maps the field builder already reads, so nothing
  // downstream knows the difference. A Monday banked before the rows were packed
  // is keyed on the row's name and is read as it stands.
  const carry=!banked ? null
            : !banked.rows ? Object.assign({}, banked, {byName:true})
            : Object.assign(ccRelUnpack(banked.rows), {log:banked.log});

  /* Где падать спрашиваем и в дивизионном кубке, перед каждой игрой (dropEachGame),
     а не только в финалах. Без этого 11 игр кубка раскидывали всех случайно и на
     карте нечего было смотреть. Вопрос лежит маленьким окошком на карте, см.
     careerLandingPick. Кубок пишет строки без kind, поэтому в kindsForDrop стоит 'cup'. */
  const kindsForDrop=['cup'];
  const zones=null;
  // Очки — как у кубка дивизиона Epic этого сезона (ccDivCupScore), иначе прежняя таблица.
  const dSc=ccSoloDivCupOn() ? {pts:victoryR1Points, kill:4} : ccDivCupScore(careerToday(), cr.division);
  await simulateGamesLive(field, CAREER_CUP_GAMES, dSc ? dSc.pts : pointsForPlace, dSc ? dSc.kill : 4, 'stage', 0, null, zones,
    {lobbySize:ccTeams(50), stageName:L().ccCupLive, mapReplay:true, choices:true, stopOnYourDeath:true,
     carry:carry, cutAt: (careerBanking() && !CC_AWAY) ? 0 : cut,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, L().ccCupLive, kindsForDrop)});
  removeSkipButton();

  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  careerPrAdd(ranked, {div:CAREER.career.division});
  const passed=place<=cut;
  // The week's card carries the week's games: Monday's eleven in front of
  // tonight's, renumbered so the list reads 1 to 22 and the running total is
  // the one the table is sorted on.
  if(carry && carry.log && carry.log.length){
    you.stageLog=carry.log.concat((you.stageLog||[]).map(g=>({...g, game:g.game+carry.log.length})));
    // Yours are in the log now, so the carry must not be counted a second
    // time on top of it - every other row still counts theirs off the team.
    you._carryGames=0;
  }

  // On the second evening the card is the week's, not the night's: twenty-two
  // games and the table that decides the Weekly Final.
  const shell=createStageCardShell(carry
    ? L().ccCupTitleWeek(cr.division, field.length, CAREER_CUP_GAMES*2)
    : L().ccCupTitle(cr.division, field.length));
  await revealStageLog(you, shell, true);
  /* ВЫЕЗД (ccAwayPlay): кап дивизиона в чужом регионе — одна сессия, место и рост рейтинга. Перехода между дивизионами,
     путёвки в финал недели и копилки Д1 нет: дивизион у игрока в своём регионе. День не двигается. */
  if(CC_AWAY){
    const regA=CC_AWAY.reg, divA=cr.division, upA=passed && divA>1;
    if(upA){ cr.regDiv=cr.regDiv||{}; cr.regDiv[regA]=divA-1; }
    // Д1 того региона: прошёл отсечку — путёвка в его финал недели (cr.regWf, как cr.wf дома).
    const wfA=passed && divA===1;
    if(wfA){ cr.regWf=cr.regWf||{}; cr.regWf[regA]={monday:careerMonday(careerToday()), cut:ccWfCutKeys(ranked)}; }
    finalizeStageCard(shell, place, field.length, you.stagePts, (upA || wfA) ? true : null, false,
      upA ? L().awDivUp(regionName(regA), divA-1) : wfA ? L().awWfSeat(regionName(regA)) : L().awCupLine(regionName(regA), divA));
    await revealStandings(shell, ranked, you, 0);
    const growthA=careerApplyGrowth(place, field.length, you, field);
    const cashA=ccSoloDivCupPrize(place, divA); if(cashA) ccPayIn(cashA);
    // Прошёл отсечку там — выезд энергии не стоит.
    if(upA || wfA) careerRestore(CC_AWAY_ENERGY);
    const placesA=(you.stageLog||[]).map(g=>g.place);
    cr.log=cr.log||[];
    cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place, of:field.length, pts:you.stagePts, passed:false,
                 ovr:CAREER.player.ovr, games:CAREER_CUP_GAMES, wins:you.wins||0, elims:you.stageElims||0,
                 avg: placesA.length ? Math.round(placesA.reduce((s,v)=>s+v,0)/placesA.length*10)/10 : null,
                 mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:cashA});
    if(Math.round(growthA.after)!==Math.round(growthA.before))
      careerNews(growthA.delta>0?'good':'bad', 'ccNewsRating', [Math.round(growthA.before), Math.round(growthA.after)]);
    careerSave();
    CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
    careerRenderHub('centre');
    if(upA) careerNews('good', 'awNewsDivUp', [regionName(regA), divA-1]);
    careerTwoRoundResultCard({title:L().ccCupLive+' · '+regionName(regA)+' · '+L().awDivD(divA), place, through:upA, wins:you.wins||0, cash:cashA, cut:0});
    return;
  }
  const banking=careerBanking();
  // Над первым дивизионом нет дивизиона: его отсечка — место в Финале недели,
  // и карточка говорит про него, а не про несуществующий токен. Скрин его
  // игрока, 21 августа: «Кубок Дивизиона 1 … токен в дивизион выше».
  finalizeStageCard(shell, place, field.length, you.stagePts, passed, false,
    banking ? L().ccCupBanked
            : passed ? (cr.division===1 ? L().ccCupPassD1(cut) : L().ccCupPass(cut))
                     : (cr.division===1 ? L().ccCupFailD1(cut) : L().ccCupFail(cut)));
  await revealStandings(shell, ranked, you, cut);

  // Division 1's first evening settles nothing: the points are put away and the
  // table they belong to is drawn tomorrow, out of both. Growth, the log, the
  // feed and the ladder all wait for it — a cup is one result, and half of one
  // is not a small result, it is no result.
  if(banking){
    /* One packed row per duo keyed on handles (ccRelPack), like the Opens bank. Keying on t.name stored the
       display markup (flag images, styles), ~377 chars a duo: four maps ~315KB every Monday vs ~40KB for the rest
       of the save, and careerSave swallows the quota error, so saving silently stopped.
       simulateGamesLive reads both shapes (byName branch), so old banked Mondays still open. */
    cr.d1={monday:careerMonday(careerToday()), rows:ccRelPack(field)};
    // Monday's eleven games, kept as they were played: Tuesday's card is the
    // week's card, and a week is twenty-two rows you can read rather than a
    // total with eleven of them missing. Only the player's own log is stored —
    // the field's is a table of points, and nobody reads somebody else's games.
    cr.d1.log=(you.stageLog||[]).map(g=>({game:g.game, place:g.place, elims:g.elims,
                                          pts:g.pts, elimPts:g.elimPts, label:g.label}));
    // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
    await ccMpClose(ranked);
    ccAwayHomeDone(careerToday(), 'cup'); careerAdvanceTo(careerAfterSession());
    careerSave();
    CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
    CAREER_RUN=false;
    // Monday settles nothing, but it still has to end somewhere. This branch used
    // to return straight out and leave a Division 1 player standing on the
    // results screen with eleven games behind them and no button in front.
    careerRenderHub('centre');
    careerBankedCard(place, field.length, you.stagePts);
    return;
  }
  if(cr.d1) delete cr.d1;

  const growth=careerApplyGrowth(place, field.length, you, field);
  const morale=careerApplyMorale(place, field.length, passed);
  const from=cr.division;
  const cash=ccSoloDivCupPrize(place, from); if(cash) ccPayIn(cash);
  if(passed && cr.division>1){ cr.division--; careerReachPromote(cr.division); }
  /* In Division 1 the cut gives a seat at Saturday's Weekly Final instead of promotion, stamped with
     this week's Monday so it can't be spent next week.
     The qualified names are stored too: the Final used to draw its own 50 from the pool (first 49 of the
     shuffle, not who finished above the line), so qualifiers like Scroll and Sky were missing from it.
     The field is reproducible from the seed (cr.d1 relies on that), so Saturday rebuilds it and keeps the
     named rows. One string like ccRelPack's row key, ~1KB instead of 315KB of teams. */
  else if(passed) cr.wf={monday:careerMonday(careerToday()),
                         cut:ccWfCutKeys(ranked)};
  // The log is what the history screen reads, and the reference for that screen
  // is a Tracker profile: every event is a row with matches, wins, elims and an
  // average place on it. All of that exists on the team the moment the cup ends
  // and nowhere afterwards, so it is written down here rather than derived later
  // from a placement that cannot remember it.
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  cr.log.push({season:cr.season, day:careerToday(), div:from, place, of:field.length,
               pts:you.stagePts, passed, ovr:CAREER.player.ovr,
               // A Division 1 week is one tournament of twenty-two games; the
               // history row is the tournament, the way the standings are.
               games:CAREER_CUP_GAMES*(carry?2:1), wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:cash});

  // The feed, built out of the run that just happened. The list is written in
  // reading order and filed backwards, because careerNews puts each line on top
  // — otherwise a week reads bottom-up and the placement, which is the thing
  // that happened, ends up underneath the small talk.
  // A result is seen by people, and how many depends on how loud it was. This
  // runs before the feed is written so the posts below carry the audience the
  // result itself just brought.
  careerReachAdd(careerReachResult(place, field.length, from, 'cup'));

  // The picture everybody posts: the standings, with the poster in them. Five
  // rows and then your own if it fell below them.
  const bare=t=>String(t.name||'').replace(/<[^>]*>/g,'');
  // Окно вокруг того, кто постит, флаги, отсечка — как у всех остальных
  // вечеров (ccStageShot); раньше здесь была своя пятёрка без матчей и элимов.
  const shotOf=(t, cap)=>ccStageShot(ranked, t, from, cap||undefined, cut);

  const winner=ranked[0];
  // Say which it is. In Division 1 a played Monday rides into Tuesday's table,
  // so the number is the week's and the line says so with the games behind it;
  // everywhere else — and on a Tuesday whose Monday was never played — it is
  // one evening, and the plain line is the true one.
  /* Проход в финал недели — в той же строке, что и итог, а не вторым постом.
     Скриншот: «Div 1 Cup, week total: top 5 of 170…» и сразу под
     ним «Top 5 on the week — through to the Weekly Final» от того же
     человека тем же вечером — два почти одинаковых поста. */
  const wfIn=passed && from===1;
  const feed=[carry
    ? [passed?'good':'flat', wfIn ? 'ccNewsResultWeekWf' : 'ccNewsResultWeek',
       wfIn ? [place, field.length, you.stagePts, CAREER_CUP_GAMES*2]
            : [place, field.length, from, you.stagePts, CAREER_CUP_GAMES*2]]
    : [passed?'good':'flat', wfIn ? 'ccNewsResultWf' : 'ccNewsResult',
       wfIn ? [place, field.length, you.stagePts] : [place, field.length, from, you.stagePts]]];
  if(passed && from>1) feed.push(['good', 'ccNewsPromoted', [from-1]]);
  if(Math.round(growth.after)!==Math.round(growth.before))
    feed.push([growth.delta>0?'good':'bad', 'ccNewsRating', [Math.round(growth.before), Math.round(growth.after)]]);
  // The winner posts it themselves — when the winner is somebody. A press line
  // saying who won is a report; a player posting their own screenshot is what
  // actually happens after a cup. But below Division 1 the lobby is the
  // generated ladder, and a stranger the generator named celebrating TOP 1
  // every week is exactly what the user read off the feed: "who are all these
  // people and why are they top 1". A generated name does not get an account.
  const wpairAll=(winner && winner!==you) ? (winner.cards||winner.squad||[]) : [];
  if(wpairAll.length && wpairAll.every(c=>c && c.tier!=='ladder')){
    const wpair=wpairAll;
    const wc=wpair[0], wm=wpair[1];
    feed.push(['good', 'ccPostPlaced', [1, from, wm?ccHandle(wm.handle):null, careerWeek()],
      {by:{name: wc ? wc.handle : ccOneOf(bare(winner)),
           ovr: wc ? (wc._ovr!=null?wc._ovr:(attrsFor(wc)||{}).ovr) : null,
           card: wc ? {handle:wc.handle, region:wc.region||'EU'} : null},
       tbl:shotOf(winner)}]);
  }
  // And so does the player, which is what puts something on their own profile.
  feed.push([place<=ccTeams(CAREER_CUP_CUT)?'good':'flat', 'ccPostPlaced',
    [place, from, mate?ccHandle(mate.handle):null, careerWeek()+1],
    {tbl:shotOf(you)}]);
  // The other half of the duo posts the same night — their account, your tag,
  // the same screenshot. Every week, not only the good ones: your partner
  // posting the result is what a duo's timeline looks like, and below
  // Division 1 they are the one other real account the week has.
  const mateBy=mate ? {name:mate.handle,
    ovr:(mate._ovr!=null?mate._ovr:(attrsFor(mate)||{}).ovr),
    card: mate.region ? {handle:mate.handle, region:mate.region} : null} : null;
  if(mateBy)
    feed.push([passed?'good':'flat', 'ccPostPlaced',
      [place, from, ccHandle(CAREER.player.nick), careerWeek()+2],
      {by:mateBy, tbl:shotOf(you)}]);
  if(morale){
    // The partner speaks for themselves, first person from their own account —
    // the press reporting a Division 4 duo's mood was the feed at its least
    // believable. On the night they walk out, mate is still who walked.
    if(morale.left) feed.push(['bad', 'ccPostMateLeft', [ccHandle(CAREER.player.nick)],
      mateBy ? {by:mateBy} : undefined]);
    else if(morale.move<=-12) feed.push(['bad', 'ccPostMateCross', [],
      mateBy ? {by:mateBy} : undefined]);
    else if(morale.move>=14) feed.push(['good', 'ccPostMateHappy', [ccHandle(CAREER.player.nick)],
      mateBy ? {by:mateBy} : undefined]);
  }
  // The scene's account congratulates the room it covers — winners tagged,
  // the same standings screenshot attached.
  // Кап дивизиона аккаунт сцены больше не поздравляет (16.10, см. careerCongrats) — каждый вечер это шум, не новость.
  // The top of the scale, not a ceiling drawn for this career: the only thing
  // left to say near 99 is that there is nowhere above it.
  if(CAREER_SCALE_TOP-growth.after<=2) feed.push(['flat', 'ccNewsCeiling', [CAREER_SCALE_TOP]]);
  for(let i=feed.length-1;i>=0;i--) careerNews(feed[i][0], feed[i][1], feed[i][2], feed[i][3]);

  careerDmInbound(place, field.length, passed, from);
  careerAcademyStep(place, field.length);
  careerRaiseStep();
  /* Вторая сессия и финал кубка тоже закрываются сервером. Отчёт:
     «две сессии сыграл — после него опять дивижен»: этот путь двигал день без
     закрытия, а в команде такой шаг глух (CC_MP_DAY_DUE) — день стоял, и кубок
     предлагался снова. Сторож: check-mp-close, каждый шаг дня в раннере — после close. */
  await ccMpClose(ranked);
  ccAwayHomeDone(careerToday(), 'cup'); careerAdvanceTo(careerAfterSession());
  // Прошёл отсечку (переход или путёвка в финал недели) — вечер энергии не стоит.
  if(passed) careerRestore(CC_TOURNEY_ENERGY);
  // A free agent hears from clubs after a result, not out of nowhere: the offers
  // are rebuilt on the week you have just moved into.
  // Offers arrive whether or not there is already a club: a signed player is
  // exactly who other clubs want. Declining still quiets them for the season.
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    // A no is spent once it has been answered by a result.
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();

  if(passed && from>1) await celebrate(L().celKicker, L().ccCelebPass, L().ccCelebPassSub(from-1), 'gold', 80);

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerCupResultCard({place, total:field.length, pts:you.stagePts, passed, from, growth, morale, cash});
}

// What the week did, in the shape the rest of the app uses for a stage card:
// the placement, whether the token came, and which way the rating moved.
function careerCupResultCard(r){
  const cr=CAREER.career;
  const arrow = r.growth.delta>0.05 ? '▲' : r.growth.delta<-0.05 ? '▼' : '=';
  const word  = r.growth.delta>0.05 ? L().ccResGrowthUp
              : r.growth.delta<-0.05 ? L().ccResGrowthDown : L().ccResGrowthFlat;
  const box=document.createElement('div');
  box.className='stage-card '+(r.passed?'pass':'fail');
  box.innerHTML=`<h4>${L().ccResHead} <span class="stage-badge ${r.passed?'pass':'fail'}">${ccTopC(r.place)}</span></h4>
    <div class="stage-detail">
      <div>${r.passed ? (r.from>1 ? L().ccResPromoted(r.from-1) : L().ccResWfIn)
                       : L().ccResStay(r.from)}</div>
      <div>${L().ccResGrowth}: ${Math.round(r.growth.before)} ${arrow} ${CAREER.player.ovr} — ${word}</div>
      <div>${L().ccResEarned}: ${r.cash ? ccMoney(r.cash) : cr.division===1 ? L().ccResD1NoFinal : L().ccResNoMoney}</div>
      ${r.morale ? `<div>${L().ccResPartner}: ${r.morale.left ? ccSay('ccNewsPartnerLeft', r.morale.name)
          : L()[careerMoodKey(r.morale.after)]+' ('+r.morale.before+' '+(r.morale.move>=0?'▲':'▼')+' '+r.morale.after+')'}</div>` : ''}
      ${cr.seasonOver?`<div>${L().ccSeasonOver} — ${L().ccSeasonOverSub}</div>`:''}
      ${ccNightRateLine()}
    </div>
    <div style="margin-top:12px;"><button class="go-btn" style="margin:0;width:auto;padding:10px 20px;"
      onclick="careerBackToHub()">${L().ccBackToHub}</button></div>`;
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}

/* The last card of a two-round night, and the way back off the results screen.

   The divisional cup has had one since it was written. The Performance
   Evaluation never did — it finished its second round, redrew the hub behind
   the results screen and left the player looking at standings with no button
   on them. That is the same reason nobody ever reached the evaluation: it was
   written and never played. The Victory Cup takes the same shape, so both use
   this. */
/* Победа — это не вылет.

   Скрин игрока, 21 августа: топ-1 из 33 в финале Мейджора 2, двенадцать
   матчей, победа, $120 000 — и красная плашка «ВЫЛЕТ» над этой строкой.

   Плашку рисовал through, а through считается от отсечки: place<=st.cut. У
   финала отсечки нет и быть не может, он последний, — cut там ноль, значит
   выражение ложно всегда, значит любой финал был вылетом, включая выигранный.
   То же самое стояло и на финале Саммита.

   У этапа с отсечкой ничего не меняется: прошёл её или не прошёл. У финала
   вопрос другой — заплатил ли вечер, — и так его уже считает
   careerTwoRoundResultCard (through||cash>0). Просто карточка этапа, которая
   рисуется раньше, об этом не знала. */
function ccStagePassed(through, st, place, prize){
  if(st && st.cut) return through;
  return typeof prize==='function' ? prize(place)>0 : !!through;
}
function careerTwoRoundResultCard(r){
  const box=document.createElement('div');
  box.className='stage-card '+(r.through?'pass':'fail');
  /* Кап в один раунд (дейли, соло-капы 2019–20, капы 2021 — ccCupRounds) отсечки не
     имеет: cut 0. Строки «мимо топ-0 — раунд 2 без тебя» и «ниже Дивизиона 1 призовых
     нет» там врали — второго раунда нет, дивизионов в те годы тоже. */
  // Кап, который платит за место (таблица, ЛАН, один раунд), — «место — $», а не «N побед — $».
  const line = r.placed ? L().lfNewsPlaced(r.placed)
             : r.cash ? (r.byPlace ? L().ccVicPlaceCash(r.place, r.cash) : L().ccVicCash(r.wins, r.cash))
             : r.through ? L().ccVicNoWin
             : r.cut ? L().ccVicFail(r.cut) : '';
  box.innerHTML=`<h4>${esc(r.title)} <span class="stage-badge ${r.through?'pass':'fail'}">${ccTopC(r.place)}</span></h4>
    <div class="stage-detail">
      ${line ? `<div>${line}</div>` : ''}
      ${r.placed ? '' : `<div>${L().ccResEarned}: ${r.cash ? ccMoney(r.cash) : r.cut && !r.through && !ccNoDivisions() && CAREER.career.division>1 ? L().ccResNoMoney : ccMoney(0)}</div>`}
      <div>${L().chEarnings}: ${ccMoney(CAREER.career.earnings||0)}</div>
      ${ccNightRateLine()}
    </div>
    <div class="stage-actions"><button class="btn-primary"
      onclick="careerBackToHub()">${L().ccBackToHub}</button></div>`;
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
// What Monday looks like when Monday is half of a table.
// head/games — whose first session this was. The divisional cup's Monday says
// Tuesday decides the table; the Opens' first evening says the second session
// decides the cut, and carries its own game count.
function careerBankedCard(place, of, pts, head, games){
  const box=document.createElement('div');
  box.className='stage-card';
  box.innerHTML='<h4>'+esc(head||L().ccCupBanked)+' <span class="stage-badge">#'+place+'</span></h4>'+
    '<div class="stage-detail">'+
      '<div>'+L().ccBankedSoFar(place, of, pts)+'</div>'+
      '<div>'+L().ccBankedCarry(pts, games||CAREER_CUP_GAMES)+'</div>'+
      '<div>'+L().ccBankedNext+'</div>'+
    '</div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="careerBackToHub()">'+
      L().ccBackToHub+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
/* ВНЕ mgr.js (его вопрос 8.10 «почему с debug пропала карьера менеджера»): показ секции жил внутри ленивого mgr.js,
   а тот грузится только после входа в менеджер — кнопка не появлялась никогда.
   Только debug (его слово 2.10: «fortnite manager не надо деплоить»). Вход виден на debug.fncsdraft.pages.dev,
   localhost и с диска; на fncsdraft.com, fncsdraft.pages.dev и зеркале GitHub секции нет. */
// 8.10 вечер — его слово «я хочу уже задеплоить карьеру менеджера»: режим открыт на всех адресах, включая fncsdraft.com.
function mgrAllowed(host){ return true; }
setTimeout(()=>{ try{ if(!mgrAllowed()) return; document.querySelectorAll('.hero-mgr, .hero-mgr-btn, .nav-pill[data-nav="manager"]').forEach(el=>{ el.hidden=false; }); }catch(e){} }, 0);
