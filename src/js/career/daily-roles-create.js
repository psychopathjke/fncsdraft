/*@@PART js/career/daily-roles-create.js@@*/
/* ПАКИ ДНЯ — СЛУЧАЙНЫЕ, СЕЗОН ДНЯ — ОДИН НА ВСЕХ (16.10, его слово: «нет, пусть будут рандомные игроки, пусть будут
   рандомные сезоны, из этих сезонов пусть будут игроки того периода»). Было: одни паки на всех, как в Wordle.
   Теперь день задаёт остров (dailyMap), остров — сезон, а паки у каждого свои, только из игроков года этого
   сезона (preSelectedYears в dailyStart; поле турнира берётся из того же года). Таблица — по силе состава.
   Год острова — по букве ключа MAP_CHOICES: m Ch7 2026, t Ch6 2025, f Ch5 2024, e Ch4 2023, k Ch3 2022,
   j Ch2 S5–8 2021, i Ch2 S2–4 2020, h Ch1 S9/SX и Ch2 S1 2019. */
const DAILY_MAP_YEAR={m:2026, t:2025, f:2024, e:2023, k:2022, j:2021, i:2020, h:2019};
function dailyYear(map){ return DAILY_MAP_YEAR[String((map && map.key) || '')[0]] || 2026; }
function dailyRoll(tag, fn){ return fn(); }
function dailySimOn(){
  if(!DAILY || DAILY_RAND) return;
  DAILY_RAND=Math.random;
  Math.random=careerRng(ccHashStr('daily|'+DAILY.day+'|sim|'+drafted.map(hKey).sort().join(',')));
}
function dailySimOff(){ if(DAILY_RAND){ Math.random=DAILY_RAND; DAILY_RAND=null; } }

function dailyStart(){
  const today=dailyToday();
  if(today){ dailyOpen(); return; }
  const day=dailyDay(), map=dailyMap(day);
  chooseMode(4);
  DAILY={day, n:dailyNum(day), map:map.key, year:dailyYear(map)};
  preSelectedRegions=[]; preSelectedYears=[DAILY.year]; preHomeRegion=null; pendingMapSet=map.key;
  setSimMode(false); setPlayMode(false);
  startDraft(4);
}
/* Полоса над драфтом: какой это день и что попытка одна. */
function dailyBanner(){
  const scr=document.getElementById('screen-draft'); if(!scr) return;
  let b=document.getElementById('dailyBar');
  if(!DAILY){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement('div'); b.id='dailyBar'; b.className='dy-bar'; scr.insertBefore(b, scr.firstChild); }
  const T=L(), m=MAP_CHOICES.find(x=>x.key===DAILY.map);
  b.innerHTML='<b>'+esc(T.dyTitle(DAILY.n))+'</b><span>'+esc((m ? m.label+' · ' : '')+T.dyPlayers(DAILY.year)+' · '+T.dyRules)+'</span><span>'+esc(T.dyOnce)+'</span>';
}
/* «В турнир» нажато — попытка сгорела, даже если вкладку закроют посреди турнира. */
function dailyBurn(){
  if(!DAILY) return;
  const s=dailyStore(); s.days=s.days||{};
  if(!s.days[DAILY.day]) s.days[DAILY.day]={n:DAILY.n, map:DAILY.map, at:Date.now()};
  Object.keys(s.days).sort().slice(0, -30).forEach(k=>{ delete s.days[k]; });
  dailySave(s);
}
function dailyFinish(you, place, teams){
  if(!DAILY) return;
  const s=dailyStore(); s.days=s.days||{};
  const r=s.days[DAILY.day]=Object.assign(s.days[DAILY.day]||{}, {n:DAILY.n, map:DAILY.map, place, field:teams.length,
    score:Math.round(you.totalPts||0), elims:you.totalElims||0, wins:you.wins||0, team:drafted.map(p=>p.handle),
    ...dailyPowerOf(drafted)});
  dailySave(s);
  DAILY=null;
  dailyBanner();
  const box=document.getElementById('dailyResult')||(()=>{ const d=document.createElement('div'); d.id='dailyResult'; d.className='dy-res';
    const fb=document.getElementById('finalBanner'); fb.parentNode.insertBefore(d, fb.nextSibling); return d; })();
  box.hidden=false;
  dailyResultDraw(box, r);
  try{ homeRender(); }catch(e){}
}
function dailyShareText(r){
  const T=L(), m=MAP_CHOICES.find(x=>x.key===r.map);
  return 'FNCS Draft · '+T.dyTitle(r.n)+(r.power ? '\n💪 '+dailyPowerWord()+' '+dailyPowFmt(r)+(r.syn ? ' ('+dailyAvgFmt(r)+' +'+r.syn+')' : '') : '')+'\n'+(r.place===1 ? '👑' : r.place<=3 ? '🥇' : r.place<=10 ? '🔥' : '🎯')+' #'+r.place+'/'+r.field+' · '+r.score+' '+T.dyPts+
    (m ? '\n🗺️ '+m.label : '')+'\n👥 '+(r.team||[]).join(' + ')+'\nhttps://fncsdraft.com';
}
function dailyShare(){
  const r=dailyToday(); if(!r || r.score==null) return;
  const text=dailyShareText(r), T=L();
  const done=()=>{ document.querySelectorAll('.dy-share').forEach(b=>{ b.textContent=T.dyCopied; setTimeout(()=>{ b.textContent=T.dyShare; }, 1800); }); };
  if(navigator.share){ navigator.share({text}).catch(()=>{}); return; }
  try{ navigator.clipboard.writeText(text).then(done, ()=>{}); }catch(e){}
}
let DAILY_NICK_BAD='';
function dailySend(){
  const r=dailyToday(), base=dailyBase(), inp=document.getElementById('dyNick');
  if(!r || r.score==null || !base) return;
  const nick=String(inp && inp.value || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 24);
  if(!nick){ if(inp) inp.focus(); return; }
  const s=dailyStore(); s.nick=nick; dailySave(s);
  let country=''; try{ country=String((CAREER && CAREER.player && CAREER.player.country)||'').toLowerCase().slice(0, 2); }catch(e){}
  const day=dailyDay();
  fetch(base+(dailyDbg() ? '?t=dbg' : ''), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:dailyId(), day, nick, country,
    score:r.score, place:r.place, field:r.field, team:r.team, power:r.power||0, syn:r.syn||0})})
    .then(x=>x.ok ? x.json().then(j=>({ok:true, nick:j && j.nick}), ()=>({ok:true})) : x.json().then(j=>({err:j && j.err}), ()=>({}))).catch(()=>({})).then(res=>{
      /* Сервер мог записать ник иначе: n-word и оскорбления встают в таблицу как «user» и цифры
         (server/src/nick-filter.js, как у Fortnite после бана). Своя строка показывает то, что записано. */
      const shown=(res.ok && res.nick) || nick;
      if(res.ok){ const s2=dailyStore(); if(s2.days && s2.days[day]){ s2.days[day].sent=shown; dailySave(s2); } if(shown!==nick && s2.nick===nick){ s2.nick=shown; dailySave(s2); } }
      if(res.err==='nickbad'){ const s3=dailyStore(); if(s3.nick===nick){ s3.nick=''; dailySave(s3); } DAILY_NICK_BAD=nick; }
      DAILY_BOARD=null;
      document.querySelectorAll('#dailyResult, #dailyModalBody').forEach(el=>dailyResultDraw(el, dailyToday()));
      try{ homeDailyDraw(); }catch(e){}
    });
}
function dailyResultDraw(box, r){
  if(!box || !r) return;
  const T=L();
  const head='<div class="dy-head"><b>'+esc(T.dyTitle(r.n))+'</b>'+(r.score!=null ? '<span>'+(r.power ? '💪 '+esc(dailyPowerWord())+' '+dailyPowFmt(r)+(r.syn ? ' ('+dailyAvgFmt(r)+' + '+esc(dailySynWord())+' '+r.syn+')' : '')+' · ' : '')+'#'+r.place+' / '+r.field+' · '+r.score+' '+esc(T.dyPts)+'</span>' : '<span>'+esc(T.dyLeft)+'</span>')+'</div>';
  const send=r.score==null || !dailyBase() ? '' : r.sent ? '<p class="dy-ok">'+esc(T.dySent(r.sent))+'</p>'
    : '<div class="dy-send"><input id="dyNick" maxlength="24" autocomplete="nickname" placeholder="'+esc(T.dyNick)+'" value="'+esc(dailyNick())+'">'+
      '<button class="ch-play" type="button" onclick="dailySend()">'+esc(T.dySend)+'</button></div>'+
      (DAILY_NICK_BAD ? '<p class="dy-bad" style="color:#ff9b9b;margin:4px 0 0;font-size:13px;">'+esc(T.dyNickBad||'')+'</p>' : '');
  const share=r.score!=null ? '<button class="hero-btn hero-btn-alt dy-share" type="button" onclick="dailyShare()">'+esc(T.dyShare)+'</button>' : '';
  box.innerHTML=head+send+'<div class="dy-acts">'+share+'<button class="home-more" type="button" onclick="dailyOpen()">'+esc(T.dyBoard)+'</button></div>'+
    '<p class="home-sub dy-next">'+esc(T.dyNext(dailyLeft()))+'</p>';
}
function dailyLeft(){
  const ms=Date.parse(dailyDay(Date.now()+864e5)+'T00:00:00Z')-Date.now();
  const h=Math.floor(ms/36e5), m=Math.floor(ms%36e5/6e4);
  return h+' '+L().dyH+' '+m+' '+L().dyM;
}
/* Без задержки (16.10, его «с делеем таблица появляется»): прошлый ответ за сегодня лежит в fd_daily_board и
   отдаётся сразу, свежий — вторым вызовом cb, когда придёт (все, кто зовёт, просто перерисовывают). */
function dailyLoad(cb){
  const base=dailyBase(); if(!base){ cb(null); return; }
  const day=dailyDay();
  let d=DAILY_BOARD;
  if(d && d.day===day && Date.now()-d._at<60000){ cb(d); return; }
  if(!(d && d.day===day)){ try{ const c=JSON.parse(localStorage.getItem('fd_daily_board')||'null'); if(c && c.day===day) d=c; }catch(e){} }
  if(d && d.day===day) cb(d);
  fetch(base+'?'+dailyQ()+'day='+day+'&me='+encodeURIComponent(dailyId())).then(r=>r.ok ? r.json() : null).catch(()=>null).then(x=>{
    if(!x){ if(!(d && d.day===day)) cb(null); return; }
    DAILY_BOARD=Object.assign(x, {_at:Date.now()});
    try{ localStorage.setItem('fd_daily_board', JSON.stringify(DAILY_BOARD)); }catch(e){}
    cb(DAILY_BOARD); });
}
/* ТАБЛИЦА ДНЯ — ПО СИЛЕ СОСТАВА (16.10, его слово: «в таблице дня — состав, у которого больше всего силы»,
   потом «нет, только сила»). Сила — средний рейтинг четырёх карточек, как «88/100» в драфте; сервер ставит по ней,
   очки турнира — только при равенстве. У строк, отправленных до правки, силы нет (0) — они внизу. */
function dailyPowerWord(){ return ({ru:'сила', fr:'force', it:'forza', pt:'força', de:'Stärke', es:'fuerza'}[LANG]) || 'power'; }
function dailySynWord(){ return ({ru:'синергия', fr:'synergie', it:'sinergia', pt:'sinergia', de:'Synergie', es:'sinergia'}[LANG]) || 'synergy'; }
/* ТОЧНАЯ СИЛА (16.10, его слово «пусть будет точная сила» — и вопрос «а синергия за язык, страну есть?»):
   средний рейтинг карточек до сотых + синергия так, как её считает игра (computeSynergy: сыгранная пара +5, одна
   страна +2, общий язык +1; с 10.11 без потолка, в остальных режимах SYN_POW_CAP = 12). Без ничьих в таблице, и
   выигрывает не только тот, кто брал самые большие цифры, но и тот, кто собрал сыгранный состав. */
/* Синергия драфта дня: та же computeSynergy плюс две связи только для этого режима.
   Роли: ровно один ИГЛ +ROLE_BONUS_STEP, правило карточного режима из гранд-финалов.
   Цепочка: двое не играли вместе, но у них общий напарник, +DAILY_SYN_CHAIN раз на состав.
   Клуб (+DAILY_SYN_CLUB, раз на состав) добавлен 8.11; общий финал пробовали замером (0-3% паков) и не взяли.
   Цепочка открывается в 6-35% паков по годам, роль последним паком в 3-65%. */
const DAILY_SYN_CHAIN=2;
const DAILY_SYN_CLUB=3;   // один клуб в год карточек, раз на состав; редкий, поэтому выше цепочки
let _dyMates=null, _dyMatesLen=-1;
function dailyMatesOf(h){
  if(_dyMatesLen!==TEAMMATE_GROUPS.length){
    _dyMates=new Map();
    TEAMMATE_GROUPS.forEach(g=>g.forEach(a=>{ let s=_dyMates.get(a); if(!s){ s=new Set(); _dyMates.set(a, s); } g.forEach(b=>{ if(b!==a) s.add(b); }); }));
    _dyMatesLen=TEAMMATE_GROUPS.length;
  }
  return _dyMates.get(h) || null;
}
// Общий напарник двоих, которые сами вместе не играли; иначе null.
function dailyChainVia(a, b){
  const A=dailyMatesOf(a), B=dailyMatesOf(b);
  if(!A || !B || A.has(b)) return null;
  const small=A.size<B.size ? A : B, big=small===A ? B : A;
  let best=null; for(const x of small) if(big.has(x) && (best===null || x<best)) best=x;
  return best;
}
function dailyRoleOf(p){ try{ return (attrsFor(p)||{}).roleKey||null; }catch(e){ return null; } }
function dailySynWords(){
  return ({ru:{role:'один ИГЛ в составе', chain:'общий напарник', igl2:'второй ИГЛ', club:'один клуб'}, fr:{role:'un seul IGL', chain:'coéquipier commun', igl2:'deuxième IGL', club:'même club'},
    it:{role:'un solo IGL', chain:'compagno in comune', igl2:'secondo IGL', club:'stesso club'}, pt:{role:'só um IGL', chain:'parceiro em comum', igl2:'segundo IGL', club:'mesmo clube'},
    de:{role:'genau ein IGL', chain:'gemeinsamer Partner', igl2:'zweiter IGL', club:'gleicher Klub'}, es:{role:'un solo IGL', chain:'compañero en común', igl2:'segundo IGL', club:'mismo club'}}[LANG])
    || {role:'exactly one IGL', chain:'shared teammate', igl2:'second IGL', club:'same club'};
}
function dailySynergy(sq){
  const s=computeSynergy(sq), W=dailySynWords();
  const out={bonus:s.bonus, details:s.details.slice(), links:s.links.slice(), role:0, chain:null, club:null};
  if(!sq || sq.length<2) return out;
  if(sq.filter(p=>dailyRoleOf(p)==='roleIGL').length===1){
    out.role=ROLE_BONUS_STEP; out.bonus+=ROLE_BONUS_STEP;
    out.details.push(W.role+' (+'+ROLE_BONUS_STEP+')');
  }
  // Один клуб: двое с одним org, но не сыгранная пара (та уже взяла своё, дуо почти всегда в одном клубе).
  for(let i=0;i<sq.length && !out.club;i++) for(let j=i+1;j<sq.length;j++){
    const a=sq[i], b=sq[j];
    if(!a.org || a.org!==b.org || ccWereTeammates(a.handle, b.handle)) continue;
    out.club={a:a.handle, b:b.handle, org:a.org}; break;
  }
  if(out.club){
    out.bonus+=DAILY_SYN_CLUB;
    out.details.push(out.club.a+' + '+out.club.b+': '+W.club+' '+out.club.org+' (+'+DAILY_SYN_CLUB+')');
    out.links.push({a:out.club.a, b:out.club.b, type:'club', val:DAILY_SYN_CLUB});
  }
  for(let i=0;i<sq.length && !out.chain;i++) for(let j=i+1;j<sq.length;j++){
    const via=dailyChainVia(sq[i].handle, sq[j].handle);
    if(via){ out.chain={a:sq[i].handle, b:sq[j].handle, via}; break; }
  }
  if(out.chain){
    out.bonus+=DAILY_SYN_CHAIN;
    out.details.push(out.chain.a+' + '+out.chain.b+': '+W.chain+' '+out.chain.via+' (+'+DAILY_SYN_CHAIN+')');
    out.links.push({a:out.chain.a, b:out.chain.b, type:'chain', val:DAILY_SYN_CHAIN});
  }
  return out;
}
// Синергия, которую показывает драфт: в драфте дня своя, в остальных обычная.
function draftSynergy(sq){ return (typeof DAILY!=='undefined' && DAILY) ? dailySynergy(sq) : computeSynergy(sq); }
function dailyPowerOf(sq){
  if(!sq || !sq.length) return {power:0, syn:0, avg:0};
  const avg=sq.reduce((s,p)=>s+p.rating,0)/sq.length, syn=dailySynergy(sq).bonus;   // без потолка: драфт дня
  return {power:Math.round((avg+syn)*100)/100, syn, avg:Math.round(avg*100)/100};
}
// Строка с сервера несёт p100 (сотые); своя запись — power с сотыми и avg.
function dailyPowNum(r){ return r.p100 ? r.p100/100 : (r.power||0); }
function dailyPowFmt(r){ return dailyPowNum(r).toFixed(2); }
function dailyAvgFmt(r){ return (r.avg!=null ? r.avg : dailyPowNum(r)-(r.syn||0)).toFixed(2); }
/* Строка таблицы дня (17.10, его «daily leaderboard додизайнить таблицу»): всё в одну строку не влезало — состав,
   синергия и место резались, сила справа уезжала за край телефона. Теперь: место (топ-3 — золото/серебро/бронза),
   ник с флагом, состав чипами в перенос, под ним место в турнире и очки; справа крупно сила и её разбор. */
// Медали прошлых дней у ника (сервер считает по браузеру: medals=[1-х, 2-х, 3-х мест]); кружки .cc-medals.
function dailyMedalsHTML(m){
  if(!Array.isArray(m) || !(m[0]+m[1]+m[2])) return '';
  const T=L(), cls=['g','s','b'], tip=[T.ccMedalGold, T.ccMedalSilver, T.ccMedalBronze];
  return '<span class="cc-medals">'+m.slice(0,3).map((v,i)=>v>0 ? '<i class="'+cls[i]+'" title="'+esc((tip[i]||'')+': '+v)+'">'+(v|0)+'</i>' : '').join('')+'</span>';
}
function dailyRowsHTML(rows, from){
  const T=L(), flag=c=>c ? '<img src="flags/w20/'+esc(ccCountryOf(c))+'.png" alt="" onerror="this.remove()">' : '';
  const head='<div class="dy-thead"><span>#</span><span>'+esc(T.dyColPlayer)+'</span><span>'+esc(dailyPowerWord())+'</span></div>';
  return head+rows.map((r,i)=>{
    const n=(from||0)+i+1, med=n<=3 ? ' dy-m'+n : '';
    const team=r.team ? String(r.team).split(',').filter(Boolean).map(h=>'<em>'+esc(h)+'</em>').join('') : '';
    const pow=dailyPowNum(r)>0;
    return '<div class="dy-row'+(r.you ? ' me' : '')+med+'"><i class="dy-rk">'+n+'</i>'+
      '<div class="dy-who"><b>'+flag(r.country)+esc(r.nick)+dailyMedalsHTML(r.medals)+(r.you ? ' <u>'+esc(T.dyYou)+'</u>' : '')+'</b>'+
        (team ? '<div class="dy-team">'+team+'</div>' : '')+
        '<small>#'+r.place+'/'+r.field+' · '+r.score+' '+esc(T.dyPts)+'</small></div>'+
      '<div class="dy-pow"><b>'+(pow ? dailyPowFmt(r) : '-')+'</b>'+
        (pow ? '<small title="'+esc(T.dyPowSplit)+'">'+dailyAvgFmt(r)+(r.syn ? ' <span>+'+r.syn+'</span>' : '')+'</small>' : '')+'</div></div>';
  }).join('');
}
/* Окно дня: свой итог и таблица (поверх экрана, как «топ 50» на главной). */
function dailyOpen(){
  const T=L();
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  const r=dailyToday();
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(T.dyBoard)+'">'+
    '<div class="hr-top"><b>'+esc(T.dyTitle(dailyNum(dailyDay())))+' · '+esc(T.dyBoard)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    '<div class="hr-wrap">'+(r ? '<div class="dy-res" id="dailyModalBody"></div>' : '')+'<div id="dailyModalRows"><p class="home-sub">'+esc(T.lbLoad)+'</p></div></div></div>';
  document.body.classList.add('hr-lock');
  if(r) dailyResultDraw(document.getElementById('dailyModalBody'), r);
  dailyLoad(d=>{
    const el=document.getElementById('dailyModalRows'); if(!el) return;
    if(!d){ el.innerHTML='<p class="home-sub">'+esc(T.lbErr)+'</p>'; return; }
    el.innerHTML=(d.rows||[]).length ? '<div>'+dailyRowsHTML(d.rows)+'</div>'+(d.you ? '<div class="hb-me">'+esc(T.dyRank(d.you.rank, d.total))+'</div>' : '')+
      '<p class="home-sub dy-note">'+esc(T.dyHonest)+'</p>'
      : '<p class="home-sub">'+esc(T.dyEmpty)+'</p>';
  });
}
/* Блок на главной. Каркас с текстом стоит в разметке (вшивается сборкой, виден до app.js — его «с делеем появляется»
   16.10), номер дня и остров ставит маленький скрипт сразу за ним (DAILY_MAPS_INLINE — тот же порядок, что MAP_CHOICES,
   сверяет check-daily-draft). Здесь — только то, что зависит от игры: свой итог, кнопки, таймер, верх таблицы дня. */
function homeDailyDraw(){
  const box=document.getElementById('homeDaily'); if(!box) return;
  const T=L(), day=dailyDay(), map=dailyMap(day), r=dailyToday();
  const set=(id, h)=>{ const el=document.getElementById(id); if(el) el.innerHTML=h; };
  set('dyNum', '#'+dailyNum(day));
  set('dyMap', esc(map.label+' · '+T.dyPlayers(dailyYear(map))));
  set('dyMine', r ? (r.score!=null ? '<div class="dy-mine"><b>'+(r.power ? '💪 '+dailyPowFmt(r) : '#'+r.place+' / '+r.field)+'</b><span>'+(r.power ? '#'+r.place+'/'+r.field+' · ' : '')+r.score+' '+esc(T.dyPts)+'</span></div>'
                                   : '<div class="dy-mine"><span>'+esc(T.dyLeft)+'</span></div>') : '');
  if(r) set('dyActs', '<button class="hero-btn hero-btn-alt" type="button" onclick="dailyOpen()">'+esc(T.dyBoard)+'</button>'+
    (r.score!=null ? '<button class="hero-btn hero-btn-alt dy-share" type="button" onclick="dailyShare()">'+esc(T.dyShare)+'</button>' : ''));
  set('dyNext', esc(T.dyNext(dailyLeft())));
  box.hidden=false;
  dailyLoad(d=>{
    const el=document.getElementById('homeDailyRows'); if(!el) return;
    set('dyTotal', d && d.total ? ' · '+d.total : '');
    if(!d){ el.innerHTML=''; return; }
    el.innerHTML=(d.rows||[]).length ? '<div>'+dailyRowsHTML(d.rows.slice(0, 5))+'</div>'+(d.you ? '<div class="hb-me">'+esc(T.dyRank(d.you.rank, d.total))+'</div>' : '')
                                     : '<p class="home-sub">'+esc(T.dyEmpty)+'</p>';
    // Для оболочки: при следующем заходе эти строки встанут до app.js (скрипт сразу за #homeDaily).
    try{ localStorage.setItem('fd_daily_home', JSON.stringify({day:d.day, lang:LANG, total:d.total||0, html:el.innerHTML})); }catch(e){}
  });
}


// ---------- Event results panel ----------
// Rebuilds the results screen in the shape the game itself uses: standings on
// the left, squad stats and a points donut on the right, themed per mode.

// Table palettes matched to the results panel, one per mode.
// Every mode now uses the Majors' table palette, so this only has to clear any
// overrides a previous run left on <html> and let the stylesheet defaults show.
// The cover art you click sets the tone for the whole run. Each palette below
// is built around the dominant hue actually sampled from art/mode-*.jpg, so the
// interface a player lands in reads as the same object as the card they picked.
// --lb-you is deliberately absent: :root already defines it as var(--accent),
// so it follows the accent for free.
// glow is [r,g,b,alpha] per ambient light; the transparent twin is derived, so
// a hue can never be edited in one place and forgotten in the other.
const MODE_THEME={
  // The Majors keep the emerald interface, but the page behind it becomes the
  // FNCS in-game backdrop: colours sampled straight off a Global Championship
  // leaderboard screenshot — teal top-left, deep blue bottom, a pale steel
  // wash top-right where the crest glows. The panels go translucent so the
  // sweep reads through the draft, the weapon pack and the heal pack, the way
  // the leaderboard rows sit on it in game.
  // inkDim/inkDimmer/lineCol are lifted because the stock greys were tuned
  // against a near-black page — on a coloured sweep they sink to unreadable.
  // The in-game screen keeps its secondary labels bright for the same reason.

  // Major 1 is the Summit LAN in Düsseldorf, and "summit" is exactly what the
  // cover art draws: ice, chrome, white plates. Cold steel over teal.
  m1:     {glow:[[16,120,130,.55],[150,192,212,.42],[10,41,85,.75]],
           pageBase:'linear-gradient(160deg,#0c5566 0%,#08454f 44%,#0a3550 100%)',
           panel:'rgba(7,38,46,.62)', panel2:'rgba(9,48,58,.58)',
           inkDim:'#a9c8cc', inkDimmer:'#7ea6ac', lineCol:'rgba(150,210,215,.22)'},

  // Major 2 is the road to the Global Championship in Antwerp — the world's
  // diamond capital. Same FNCS family, but lit warm: amber low light and a
  // white diamond flare, over a deeper blue than the Summit's.
  m2:     {glow:[[222,154,44,.60],[226,236,244,.42],[9,34,76,.80]],
           pageBase:'linear-gradient(160deg,#14484c 0%,#0d3a4e 46%,#122f49 100%)',
           panel:'rgba(9,35,49,.62)', panel2:'rgba(12,44,60,.58)',
           inkDim:'#c4c8c4', inkDimmer:'#93a2a4', lineCol:'rgba(212,190,140,.24)'},

  // FNCS 2025 is white, chrome and red where the 2026 Majors are teal and ice.
  // These are not sampled off a screenshot: Epic publishes the season's own
  // palette in the event metadata, which Tracker carries as imp_event.Colors,
  // so this is the identity rather than my reading of a JPEG.
  //   HighlightColor       #FF0040   the red slashes on the cover
  //   PrimaryColor         #977EA5   mauve
  //   BackgroundLeftColor  #829FA9   steel
  //   BackgroundRightColor #FFFFFF   the white the whole set is built on
  //   SecondaryColor       #161616   near black
  // Two references agreeing is what settled it: #977EA5 is also, to within a
  // shade, the lavender of the alternating rows sampled off the Chapter 6
  // in-game leaderboard. Held in a dark register because the app is dark and
  // the season is not — the hues are Epic's, only the lightness is moved, and
  // the red stays at full strength on the hairlines where it reads as a
  // signature rather than a wash.
  t1:     {glow:[[255,0,64,.42],[255,255,255,.32],[22,22,22,.80]],
           pageBase:'linear-gradient(160deg,#33303c 0%,#2a2731 46%,#1b1a1f 100%)',
           panel:'rgba(28,26,33,.62)', panel2:'rgba(38,35,45,.58)',
           inkDim:'#cfc9d6', inkDimmer:'#9b93a6', lineCol:'rgba(255,0,64,.26)'},

  allfncs:{accent:'#3f62ca', accentInk:'#0a1229', bg:['#0f1a38','#0d142b','#0a0f1f'],
           line:'rgba(130,160,240,.28)', soft:'rgba(130,160,240,.10)',
           ink:'#eaeefb', dim:'rgba(205,215,245,.72)', row:'#121a30',
           glow:[[63,98,202,.34],[80,120,255,.24],[63,98,202,.16]]},
  duo:    {accent:'#d6ad33', accentInk:'#261e05', bg:['#392e0e','#2b240d','#1f1a0a'],
           line:'rgba(225,195,110,.28)', soft:'rgba(225,195,110,.10)',
           ink:'#fbf5e6', dim:'rgba(240,228,196,.72)', row:'#302912',
           glow:[[214,173,51,.30],[236,196,84,.20],[214,173,51,.14]]},
  trio:   {accent:'#41c84d', accentInk:'#05240a', bg:['#133416','#0f2911','#0b1e0d'],
           line:'rgba(120,225,140,.28)', soft:'rgba(120,225,140,.10)',
           ink:'#ebfbec', dim:'rgba(203,240,208,.72)', row:'#123015',
           glow:[[65,200,77,.30],[120,220,110,.20],[65,200,77,.14]]},
  squad:  {accent:'#ed961d', accentInk:'#2a1a03', bg:['#39270e','#2b1f0d','#1f160a'],
           line:'rgba(240,180,90,.28)', soft:'rgba(240,180,90,.10)',
           ink:'#fdf2e4', dim:'rgba(245,222,194,.72)', row:'#302412',
           glow:[[237,150,29,.30],[245,185,70,.20],[237,150,29,.14]]}
};
// m1 and m2 still share one cover image in art/, so the cards look alike on the
// menu; the backdrops are what tells the two Majors apart once you are inside.

// pending===true reads the choice made on the mode screen, before startDraft
// commits it — that is what lets the region screen already wear the mode's
// colours instead of switching a screen later than the player expects.
function modeThemeKey(pending){
  const cards = pending ? pendingCards   : CARD_MODE;
  const set   = pending ? pendingCardSet : CARD_SET;
  const major = pending ? pendingMajor   : isMajorMode;
  const size  = pending ? pendingSize    : squadSize;
  // All three 2025 Majors share the t1 entry. Epic publishes the season's
  // palette in imp_event.Colors, and the Grand Finals of Major 2 and Major 3
  // carry the same block as Major 1's, byte for byte -- #FF0040, #977EA5,
  // #829FA9, #FFFFFF, #161616. What varies in that metadata is the stage, not
  // the Major. Giving each one an accent of my own would be inventing a colour
  // Epic did not use; the tiles tell the modes apart instead.
  if(cards) return set==='m1' ? 'm1' : T_EVENT_NAME[set] ? 't1' : 'm2';
  if(major) return 'allfncs';
  return size===3 ? 'trio' : (size===4 ? 'squad' : 'duo');
}

const THEME_VARS=['--accent','--accent-ink','--lb-bg','--lb-line','--lb-line-soft',
                  '--lb-ink','--lb-dim','--lb-you','--lobby-row',
                  '--glow-a','--glow-a0','--glow-b','--glow-b0','--glow-c','--glow-c0',
                  '--page-base','--panel','--panel2','--ink-dim','--ink-dimmer','--line',
                  '--mode-art','--mode-veil'];

// Back to the stylesheet's own emerald — the menu is not "in" any mode.
function clearLobbyTheme(){
  const s=document.documentElement.style;
  THEME_VARS.forEach(k=>s.removeProperty(k));
}

function applyLobbyTheme(pending){
  // Always start from the stylesheet's own values, so an entry that only sets
  // the glow (the Majors) cannot inherit an accent left over from a past run.
  clearLobbyTheme();
  const t=MODE_THEME[modeThemeKey(pending)];
  if(!t) return;
  const s=document.documentElement.style;
  if(t.accent){
    s.setProperty('--accent', t.accent);
    s.setProperty('--accent-ink', t.accentInk);
    s.setProperty('--lb-bg', 'linear-gradient(135deg,'+t.bg[0]+' 0%,'+t.bg[1]+' 55%,'+t.bg[2]+' 100%)');
    s.setProperty('--lb-line', t.line);
    s.setProperty('--lb-line-soft', t.soft);
    s.setProperty('--lb-ink', t.ink);
    s.setProperty('--lb-dim', t.dim);
    s.setProperty('--lobby-row', t.row);
  }
  if(t.glow){
    ['a','b','c'].forEach((slot,i)=>{
      const [r,g,b,a]=t.glow[i];
      s.setProperty('--glow-'+slot, 'rgba('+r+','+g+','+b+','+a+')');
      s.setProperty('--glow-'+slot+'0', 'rgba('+r+','+g+','+b+',0)');
    });
  }
  if(t.pageBase) s.setProperty('--page-base', t.pageBase);
  // Арт режима под вуалью — задник лобби, как в игре. Снимается clearLobbyTheme.
  if(MODE_ART_NOW){
    s.setProperty('--mode-art', 'url('+MODE_ART_NOW+')');
    s.setProperty('--mode-veil', 'linear-gradient(180deg,rgba(6,12,18,.84) 0%,rgba(6,12,18,.92) 45%,rgba(6,12,18,.97) 100%)');
  }
  // Translucent panels are what let the backdrop show through the packs; only
  // set them when a mode asks, so every other mode keeps its solid cards.
  if(t.panel){ s.setProperty('--panel', t.panel); s.setProperty('--panel2', t.panel2); }
  if(t.inkDim) s.setProperty('--ink-dim', t.inkDim);
  if(t.inkDimmer) s.setProperty('--ink-dimmer', t.inkDimmer);
  if(t.lineCol) s.setProperty('--line', t.lineCol);
}

// The results screen keeps its markup between runs, so the summary panel from
// the previous tournament stays on screen while the next one is still picking
// a landing spot. Wipe it whenever a run starts (or we go back to the menu).
function clearEventPanel(){
  const host=document.getElementById('eventPanel');
  if(host) host.innerHTML='';
}

function renderLobby(teams, you){
  window.lastLobbyTeams=teams;
  window._youTeam=you||teams.find(t=>t.isYou);
  applyLobbyTheme();
  const body=document.getElementById('lobbyBody');
  const showDrop=teams.some(t=>t && landingRecord(t));
  const headRow=body.parentElement.querySelector('thead tr');
  if(headRow){
    const dropTh=headRow.querySelector('th.drop-col');
    if(showDrop && !dropTh){
      const th=document.createElement('th');
      th.className='num drop-col'; th.textContent=L().dropHeader;
      headRow.appendChild(th);
    } else if(!showDrop && dropTh){ dropTh.remove(); }
    const existing=headRow.querySelector('th.prize-col');
    if(false && lobbyPrizeTable && !existing){
      const th=document.createElement('th');
      th.className='num prize-col'; th.textContent=L().prizeHeader;
      headRow.appendChild(th);
    } else if(existing){ existing.remove(); }
  }
  body.innerHTML='';
  teams.forEach((t,i)=>{
    const tr=document.createElement('tr');
    const rowClasses=['lobby-row'];
    if(i===0) rowClasses.push('lobby-first');
    if(t.isYou) rowClasses.push('lobby-you');
    tr.className=rowClasses.join(' ');
    const nameStyled = (t.isYou||t.isClub) ? '<b style="color:var(--lb-you);">'+t.name+'</b>' : t.name;
    const powerCell = t.pow!=null ? Math.round(t.pow) : (t.displayPower!=null ? t.displayPower : (t.avgRating!=null ? t.avgRating : Math.round(t.squad.reduce((s,p)=>s+p.rating,0)/t.squad.length)));
    const matches = (t.gameLog ? t.gameLog.filter(g=>!g.isLandingBonus).length : (t.stageLog ? t.stageLog.filter(g=>!g.isLandingBonus).length : NUM_GAMES))
                    + (t._carryGames||0);
    const prize = lobbyPrizeTable ? prizeFor(lobbyPrizeTable, i+1) : 0;
    // Приз — у ника, как во всех таблицах с деньгами (правка 28.09); колонки нет.
    const prizeCell = '';
    const dropCell = showDrop ? `<td class="num lobby-num" style="color:var(--ink-dim);white-space:nowrap;">${landingCellHTML(t)}</td>` : '';
    tr.innerHTML=`<td class="lobby-rank">#${i+1}</td><td>${nameStyled}${stPrizeHTML(prize, (t.squad||[]).length||squadSize)}</td><td class="num lobby-pts">${t.totalPts}</td><td class="num lobby-num">${matches}</td><td class="num lobby-num">${t.wins||0}</td><td class="num lobby-num">${t.totalElims}</td><td class="num lobby-num">${powerCell}</td>${dropCell}${prizeCell}`;
    tr.style.cursor='pointer';
    tr.onclick=()=>showMatchHistory(t);
    body.appendChild(tr);
  });
  renderLandingResultsMap(teams);
  animateRows(document.querySelector('.lobby-wrap'));
}

function showMatchHistory(team, preferStage){
  window._mhTeam=team;
  window._mhPreferStage=!!preferStage;
  const modal=document.getElementById('matchHistoryModal');
  const nameEl=document.getElementById('matchHistoryTeamName');
  const rowsEl=document.getElementById('matchHistoryRows');
  nameEl.innerHTML=team.name.replace(/color:var\(--accent\)/,'color:#fff');
  const src = window._mhPreferStage && team.stageLog && team.stageLog.length
    ? team.stageLog : (team.gameLog||team.stageLog||[]);
  const log=src.filter(g=>!g.isLandingBonus && g.game!=null);
  rowsEl.innerHTML='';
  log.forEach((g,i)=>{
    const row=document.createElement('div');
    row.style.cssText='display:grid;grid-template-columns:40px 1fr 1fr;align-items:center;padding:12px 14px;border-radius:8px;font-weight:800;font-size:18px;color:'+(g.place===1?'#0a0a0a':'#eaf5f3')+';background:'+(g.place===1?'rgba(220,225,220,.92)':(i%2===0?'rgba(255,255,255,.05)':'transparent'))+';';
    row.innerHTML=`<div style="font-size:14px;opacity:.7;">${g.game}</div><div style="text-align:center;">${g.place}</div><div style="text-align:center;">${g.elims}</div>`;
    rowsEl.appendChild(row);
  });
  modal.style.display='flex';
}

function closeMatchHistory(){
  document.getElementById('matchHistoryModal').style.display='none';
}

// ---------- Detailed match stats (tracker-style stat sheet) ----------
// Every simulated game produces a full stat line for each team, derived from
// what actually happened in that game (final placement, eliminations, squad
// size) plus the squad's own skill level. Volume stats accumulate across the
// whole run so the final sheet reads like a real tournament stat page.
function srnd(a,b){ return a+Math.random()*(b-a); }

function blankMatchStats(){
  return {games:0, placementPts:0, elimPts:0,
    elims:0, assists:0, dmgTo:0, dmgFrom:0, healthHealed:0, shieldHealed:0, overshield:0,
    hits:0, shots:0, ovHits:0, headshots:0, wpNum:0, wpDen:0,
    revived:0, gotRevived:0, rebooted:0, gotRebooted:0,
    editOk:0, editTotal:0, editTimeSum:0,
    wood:0, stone:0, metal:0, woodC:0, stoneC:0, metalC:0,
    timeAlive:0, inStorm:0, stormDmg:0, surge:0, dist:0};
}

function accumulateMatchStats(t, place, total, placePts, elimPts){
  if(t && t.isYou && typeof ccDropRec==='function') try{ ccDropRec(t, place, total); }catch(e){}
  if(!t.mstats) t.mstats=blankMatchStats();
  const s=t.mstats;
  const size=(t.squad && t.squad.length) || 1;
  const avgR = t.squad ? t.squad.reduce((a,p)=>a+(p.rating||40),0)/size : 45;
  const sk = clamp((avgR-32)/52, 0.12, 1.25);                       // skill 0…1.25
  const surv = total>1 ? clamp((total-place)/(total-1), 0, 1) : 1;    // how deep they went
  const elims = t._elims||0;

  s.games++;
  // Удача зон: до скольких эндгеймов команда дожила и в скольких зона пришла к ней (_zonePull, zone-sim).
  // Метка снимается: следующая игра, посчитанная без движка, не должна прочитать старую.
  if(t._zonePull!=null){ s.zpG=(s.zpG||0)+1; if(t._zonePull) s.zpN=(s.zpN||0)+1; t._zonePull=null; }
  s.placementPts += placePts;
  s.elimPts += elimPts;
  s.elims += elims;
  // Ассисты щедрые: любой вклад в выбитого считается. Лидер дня у Кинча — 26
  // на игрока за шесть игр, у нас до правки выходило 13.5.
  s.assists += Math.round(elims*srnd(1.6,2.5));

  /* ЧИСЛА ПРИВЯЗАНЫ К НАСТОЯЩИМ, а не подобраны на глаз. Опорная точка — пост
     Kinch Analytics за день 1 Глобалов 2026 (26 сентября): лидеры дня на ИГРОКА
     за шесть игр — урон 4128, урон в минуту 41.28, чистый урон 2063,
     соотношение урона 2.67, ассисты 26, нафармлено 20327, пройдено 34.02 км,
     время в шторме 47:03. Замер нашей модели до правки (проба на 50 дуо и шесть
     игр) давал урон 9108 (×2.2), урон в минуту 157 (×3.8), ассисты 13.5 (×0.52),
     нафармлено 3932 (×0.19), шторм 927 с (×0.33). Время в живых сходилось точно:
     101 минута против ста у Кинча — его и не трогаем.

     Урон теперь сильнее привязан ко времени и слабее к постоянной части: раньше
     команда, вылетевшая рано, всё равно набирала базовый урон, и её урон в
     минуту улетал выше лидера. В жизни лидер по урону и лидер по урону в минуту
     — один и тот же человек, что и видно в посте. */
  /* Разброс сужен нарочно. Урон в минуту — это отношение, и у отношения
     максимум по лобби растёт от ШУМА, а не от силы: широкий разброс давал
     лидера по урону в минуту в полтора раза выше настоящего, хотя лидер по
     урону сходился в ноль. У Кинча лидер по урону и лидер по урону в минуту —
     один и тот же человек; узкий разброс это и воспроизводит. */
  const alive = Math.round(55 + surv*srnd(960,1180));
  /* Время в шторме: у Кинча лидер дня провёл в нём 47:03 при сотне минут
     в живых — то есть почти половину. У нас стояло от пяти до двадцати
     процентов, и за день выходило 927 секунд против его 2 823. */
  const storm = Math.round(alive*srnd(0.22,0.62));
  const mins = alive/60;
  /* Попадания идут от МИНУТ, а не от отдельного броска: файты случаются во
     времени. Иначе урон и время — два независимых случая, и максимум их
     отношения по лобби улетает выше настоящего лидера (см. patch-dpm.js). */
  const hits = Math.round(elims*srnd(4.0,4.5) + mins*size*srnd(0.50,0.60) + srnd(1,2));
  const acc  = clamp(0.072 + sk*0.055 + srnd(-0.012,0.012), 0.045, 0.19);
  const shots = Math.round(hits/acc);
  const dmgTo = Math.round(hits*srnd(33,43));
  // Соотношение урона у лучших доходит до 2.67 (лидер дня у Кинча), поэтому
  // верхняя граница поднята: раньше потолок держал лидера на 1.95.
  const dmgFrom = Math.round(dmgTo/clamp(0.8 + sk*1.3 + srnd(-0.28,0.28), 0.42, 3.2));

  s.hits += hits; s.shots += shots; s.dmgTo += dmgTo; s.dmgFrom += dmgFrom;
  s.ovHits += hits + Math.round(shots*srnd(0.008,0.03));
  const hs = Math.round(hits*clamp(0.13+sk*0.07+srnd(-0.03,0.03), 0.07, 0.28));
  s.headshots += hs;
  const wpAcc = clamp(0.47+sk*0.15+srnd(-0.05,0.05), 0.34, 0.74);
  const wpDen = Math.max(1, Math.round(hs/wpAcc));
  s.wpNum += hs; s.wpDen += wpDen;

  s.healthHealed += Math.round(dmgFrom*srnd(0.35,0.62));
  s.shieldHealed += Math.round(dmgFrom*srnd(0.55,0.92));
  if(Math.random()<0.22) s.overshield += Math.round(srnd(50,300));

  if(size>1){
    s.revived += Math.random() < 0.45+0.2*(1-surv) ? 1 : 0;
    s.gotRevived += Math.random() < 0.45+0.2*(1-surv) ? 1 : 0;
    if(Math.random()<0.16) s.rebooted += 1;
    if(Math.random()<0.16) s.gotRebooted += 1;
  }

  const edits = Math.round(surv*srnd(55,130) + srnd(12,45));
  const editAcc = clamp(0.67+sk*0.17+srnd(-0.03,0.03), 0.52, 0.94);
  const editMs = clamp(720 - sk*340 + srnd(-45,45), 240, 780);
  s.editTotal += edits; s.editOk += Math.round(edits*editAcc); s.editTimeSum += editMs*edits;

  /* Метсы: у Кинча лидер дня нафармил 20 327 за шесть игр, то есть больше трёх
     тысяч за игру на человека — ферма в комп-Фортнайте идёт весь матч. У нас
     до правки выходило 3 932 за день, впятеро меньше. */
  const wood = Math.round(surv*srnd(1980,4580) + srnd(730,2080));
  const stone = Math.round(surv*srnd(285,910) + srnd(105,365));
  const metal = Math.round(surv*srnd(440,1170) + srnd(155,495));
  s.wood += wood; s.stone += stone; s.metal += metal;
  s.woodC += Math.round(wood*srnd(1.7,2.6) + srnd(180,600));
  s.stoneC += Math.round(stone*srnd(6,15) + srnd(200,700));
  s.metalC += Math.round(metal*srnd(6,14) + srnd(200,700));

  s.timeAlive += alive; s.inStorm += storm;
  s.stormDmg += Math.round(storm*srnd(1.4,4.6));
  if(Math.random()<0.22) s.surge += Math.round(srnd(1,4));
  /* Пройдено: у Кинча лидер дня 34.02 км за шесть игр. До правки у нас
     выходило 39.97, теперь совпадает в пределах десятой. */
  s.dist += Math.round(950 + surv*srnd(3600,6700));
}

// Split team totals into per-player lines. Volume stats are divided by a
// rating-weighted share; things every teammate experiences together (time
// alive, distance, rates) stay roughly the same for each player.
function playerShares(team){
  const sq=team.squad||[];
  if(team._shares && team._shares.length===sq.length) return team._shares;
  const raw=sq.map(p=>Math.pow(Math.max((p.rating||40)-20,5), 1.35)*srnd(0.88,1.12));
  const sum=raw.reduce((a,b)=>a+b,0)||1;
  team._shares=raw.map(v=>v/sum);
  return team._shares;
}

/* ДОЛИ ПО РОЛИ (идея игроков 30.09: «у фраггера фрагов больше, а у игл другие статы больше»).
   Одна доля на всё давала сильнейшему по рейтингу больше во всём сразу — и элимов, и фарма, и
   поднятых. Теперь боевое (элимы, урон, попадания, хедшоты) тянет фраггер, командное (ассисты,
   поднятые и ребутнутые, фарм и сбор метсов, лечение) — ИГЛ, общее (полученный урон, шторм) —
   без роли. Множители — те же, что у раскладки элимов (CC_KILL_ROLE_W), зеркально для ИГЛа;
   оценка режима, не замер. */
const CC_SUP_ROLE_W={roleIGL:1.5, roleFRG:0.75};
const CC_STAT_SUP=new Set(['assists','healthHealed','shieldHealed','revived','rebooted','matsFarmed','woodFarmed',
  'stoneFarmed','metalFarmed','matsCollected','woodCollected','stoneCollected','metalCollected']);
const CC_STAT_NEU=new Set(['dmgFrom','gotRevived','gotRebooted','stormDmg','surge','overshield']);
function playerRoleShares(team, table){
  const base=playerShares(team), sq=team.squad||[], roles=[];
  let raw=base.map((b,i)=>{ let r=null; try{ r=(attrsFor(sq[i])||{}).roleKey; }catch(e){}
    roles.push(r); return b*((table && table[r])||1); });
  // Боевые статы — тот же главный по дракам, что у элимов (ccKillRankBoost).
  if(table===CC_KILL_ROLE_W && raw.length>1) raw=ccKillRankBoost(raw, roles);
  const sum=raw.reduce((a,b)=>a+b,0)||1;
  return raw.map(v=>v/sum);
}
function statsForView(team, playerIdx){
  const s=team.mstats;
  if(!s) return null;
  if(playerIdx==null) return {s, w:1, wSup:1, wNeu:1, n:(team.squad||[]).length||1, solo:false};
  const neu=playerShares(team);
  const fight=(typeof CC_KILL_ROLE_W!=='undefined') ? playerRoleShares(team, CC_KILL_ROLE_W) : neu;
  const sup=playerRoleShares(team, CC_SUP_ROLE_W);
  return {s, w:fight[playerIdx]||1, wSup:sup[playerIdx]||1, wNeu:neu[playerIdx]||1, n:(team.squad||[]).length||1, solo:true};
}
function statShareFor(key, v){ return CC_STAT_SUP.has(key) ? v.wSup : CC_STAT_NEU.has(key) ? v.wNeu : v.w; }

function fmtNum(n){ return Math.round(n).toLocaleString(LANG==='ru'?'ru-RU':'en-US'); }
function fmtPct(v){ return (v*100).toFixed(2)+'%'; }
function fmtDur(sec){
  sec=Math.round(sec);
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), ss=sec%60;
  const H=LANG==='ru'?'ч':'h', M=LANG==='ru'?'м':'m', S=LANG==='ru'?'с':'s';
  if(h>0) return h+H+' '+m+M;
  return m+M+' '+ss+S;
}
function fmtKm(m){ return (m/1000).toFixed(1)+'km'; }

// key, label i18n key, value getter, higher-is-better
const STAT_ROWS=[
  ['elims','s_elims',(s,w)=>s.elims*w,'num',true],
  ['assists','s_assists',(s,w)=>s.assists*w,'num',true],
  ['dmgTo','s_dmgTo',(s,w)=>s.dmgTo*w,'num',true],
  ['dmgFrom','s_dmgFrom',(s,w)=>s.dmgFrom*w,'num',false],
  ['dmgRatio','s_dmgRatio',s=>s.dmgFrom?s.dmgTo/s.dmgFrom:0,'ratio',true],
  ['healthHealed','s_healthHealed',(s,w)=>s.healthHealed*w,'num',true],
  ['shieldHealed','s_shieldHealed',(s,w)=>s.shieldHealed*w,'num',true],
  ['overshield','s_overshield',(s,w)=>s.overshield*w,'num',true],
  ['hits','s_hits',(s,w)=>s.hits*w,'num',true],
  ['shots','s_shots',(s,w)=>s.shots*w,'num',true],
  ['headshots','s_headshots',(s,w)=>s.headshots*w,'num',true],
  ['playerAcc','s_playerAcc',s=>s.shots?s.hits/s.shots:0,'pct',true],
  ['overallAcc','s_overallAcc',s=>s.shots?s.ovHits/s.shots:0,'pct',true],
  ['wpAcc','s_wpAcc',s=>s.wpDen?s.wpNum/s.wpDen:0,'pct',true],
  ['revived','s_revived',(s,w)=>s.revived*w,'num',true],
  ['gotRevived','s_gotRevived',(s,w)=>s.gotRevived*w,'num',false],
  ['rebooted','s_rebooted',(s,w)=>s.rebooted*w,'num',true],
  ['gotRebooted','s_gotRebooted',(s,w)=>s.gotRebooted*w,'num',false],
  ['editAcc','s_editAcc',s=>s.editTotal?s.editOk/s.editTotal:0,'pct',true],
  ['editTime','s_editTime',s=>s.editTotal?s.editTimeSum/s.editTotal:0,'ms',false],
  ['matsFarmed','s_matsFarmed',(s,w)=>(s.wood+s.stone+s.metal)*w,'num',true],
  ['woodFarmed','s_woodFarmed',(s,w)=>s.wood*w,'num',true],
  ['stoneFarmed','s_stoneFarmed',(s,w)=>s.stone*w,'num',true],
  ['metalFarmed','s_metalFarmed',(s,w)=>s.metal*w,'num',true],
  ['matsCollected','s_matsCollected',(s,w)=>(s.woodC+s.stoneC+s.metalC)*w,'num',true],
  ['woodCollected','s_woodCollected',(s,w)=>s.woodC*w,'num',true],
  ['stoneCollected','s_stoneCollected',(s,w)=>s.stoneC*w,'num',true],
  ['metalCollected','s_metalCollected',(s,w)=>s.metalC*w,'num',true],
  ['timeAlive','s_timeAlive',s=>s.timeAlive,'dur',true],
  ['timeStorm','s_timeStorm',s=>s.inStorm,'dur',false],
  ['stormDmg','s_stormDmg',(s,w)=>s.stormDmg*w,'num',false],
  ['surge','s_surge',(s,w)=>s.surge*w,'num',false],
  ['distance','s_distance',s=>s.dist,'km',true]
];

function fmtStat(kind, v){
  if(kind==='pct') return fmtPct(v);
  if(kind==='ratio') return v.toFixed(2);
  if(kind==='ms') return Math.round(v)+'ms';
  if(kind==='dur') return fmtDur(v);
  if(kind==='km') return fmtKm(v);
  return fmtNum(v);
}


function clearLandingResultsMap(){
  const section=document.getElementById('landingResultsSection');
  const mapImg=document.getElementById('landingResultsMapImg');
  const layer=document.getElementById('landingResultsMarkersLayer');
  const list=document.getElementById('landingResultsList');
  if(section) section.style.display='none';
  if(mapImg) mapImg.removeAttribute('src');
  if(layer) layer.innerHTML='';
  if(list) list.innerHTML='';
}

function renderLandingResultsMap(teams){
  const section=document.getElementById('landingResultsSection');
  const mapImg=document.getElementById('landingResultsMapImg');
  const pickerImg=document.querySelector('#landingMapWrap img');
  if(mapImg && !mapImg.src) mapImg.src = MAP_ART[ACTIVE_LANDING_SET] || (pickerImg && pickerImg.src) || '';
  const layer=document.getElementById('landingResultsMarkersLayer');
  const list=document.getElementById('landingResultsList');
  if(!layer || !list) return;
  layer.innerHTML='';
  list.innerHTML='';

  const RESULT_TAG={
    won:   {text:L().landingFightWon,   color:'var(--accent)'},
    lost:  {text:L().landingFightLost,  color:'var(--danger)'},
    shared:{text:L().landingShared,     color:'var(--ink-dim)'},
  };

  // One rectangle per zone. If two squads share it, the whole box just turns
  // red and both nicknames are stacked inside it — no splitting into halves.
  const zoneMap=new Map();
  teams.forEach((t,i)=>{
    if(!t.landingZone) return;
    if(!zoneMap.has(t.landingZone)) zoneMap.set(t.landingZone,[]);
    zoneMap.get(t.landingZone).push({t,i});
  });

  zoneMap.forEach((entries,z)=>{
    const contested = entries.length>=2;
    const plot=document.createElement('div');
    plot.className='land-plot'+(contested?' contested':(z.mythic?' zp-myth-box':''));
    if(!contested){
      plot.style.borderColor='#0a0a0a'; plot.style.background='rgba(0,0,0,.4)';
    }
    plot.style.left=z.x+'%'; plot.style.top=z.y+'%';
    plot.style.width=z.w+'%'; plot.style.height=z.h+'%';
    plot.title=entries.map(({t,i})=>t.name.replace(/<[^>]+>/g,'')+' (#'+(i+1)+')').join(contested?' vs ':'');
    // Same column as the picker map: one nickname per line, sized to the box in
    // cqh. Squad mode used to need its own shrink factor here because four
    // handles were written on a single line; per-line names make the squad size
    // just another row count.
    fillZoneNames(plot, entries.map(e=>e.t), z);
    if(z.points!=null) plot.appendChild(zonePowLabel(z));
    layer.appendChild(plot);
  });

  teams.forEach((t,i)=>{
    const row=document.createElement('div');
    row.style.padding='2px 0';
    const nameStyled = (t.isYou||t.isClub) ? '<b style="color:var(--lb-you);">'+t.name+'</b>' : t.name;
    const tagInfo=RESULT_TAG[t.landingResult];
    const resultTag=tagInfo?` <span style="color:${tagInfo.color};font-size:11px;">${tagInfo.text}</span>`:'';
    // Same record the standings show, so the two never disagree.
    const rec=landingRecord(t);
    const scoreTag = rec
      ? ` <span style="color:var(--ink-dimmer);font-size:11px;">⚔ ${rec}</span>`
      : '';
    row.innerHTML=`<b style="color:var(--ink-dim);">${i+1}.</b> ${nameStyled} <span style="color:var(--ink-dimmer);">(${t.pow!=null?Math.round(t.pow):t.displayPower})</span>${resultTag}${scoreTag}`;
    list.appendChild(row);
  });

  if(section) section.style.display='block';
}

// ---------- Card mode: squad card gallery with a stat-sheet back side ----------
let cardFlipped={};

function renderCardGallery(){
  const wrap=document.getElementById('cardGallery');
  const title=document.getElementById('cardGalleryTitle');
  if(!wrap || !title) return;
  if(!drafted.length){ wrap.style.display='none'; title.style.display='none'; return; }
  wrap.style.display='grid'; title.style.display='block';
  const you=window._youTeam;
  wrap.innerHTML='';
  drafted.forEach((p,i)=>{
    const box=document.createElement('div');
    const flipped=!!cardFlipped[i];
    let inner;
    if(flipped){
      inner=playerStatSheetHTML(you, i, p);
    } else {
      inner=futCardHTML(p, {wide:true});
    }
    box.dataset.cardIdx=i;
    box.innerHTML=inner+`<button onclick="toggleCardFlip(${i})" style="width:100%;margin-top:8px;
      background:transparent;border:1px solid var(--line);color:var(--ink-dim);border-radius:8px;
      padding:7px;font-size:11px;font-weight:800;letter-spacing:.03em;cursor:pointer;">
      ${flipped?L().cardFrontBtn:L().cardBackBtn}</button>`;
    if(!flipped) wireCardPeek(box, p);
    wrap.appendChild(box);
  });
}
function toggleCardFlip(i){ cardFlipped[i]=!cardFlipped[i]; renderCardGallery(); }

// A card can be inspected wherever it appears. During the draft there is no
// team and no match stats yet, so the sheet shows what matters for the pick —
// the real Grand Finals and Play-In lines and how the rating was arrived at —
// and says the simulation stats arrive after the tournament. Once a run has
// been played, the same click on a drafted player adds their match stats.
function openCardPeek(pl){
  if(!pl) return;
  // Only attach the played team when this really is one of its players: the
  // reference survives into the next draft, and a stale one would show somebody
  // else's numbers under this name.
  const yt=window._youTeam;
  const team=(yt && (yt.squad||[]).includes(pl)) ? yt : null;
  const idx=team ? team.squad.indexOf(pl) : 0;
  const body=document.getElementById('cardPeekBody');
  if(!body) return;
  // В карьере под листом карточки — её сезон в этой карьере (careerPlayerStatsHTML).
  const inCareer=(typeof CAREER!=='undefined' && CAREER && CAREER.career) && ((typeof CAREER_RUN!=='undefined' && CAREER_RUN) || /career/.test(String(typeof SHOWN_SCREEN!=='undefined' ? SHOWN_SCREEN : '')));
  // Ушёл со сцены — пометка в профиле (ccRetiredOf, «Завершили карьеру» в Истории).
  const gone=(inCareer && pl && typeof ccRetiredOf==='function') ? ccRetiredOf(pl.handle) : null;
  body.innerHTML=(gone ? '<div class="cc-regen-tag cc-retired-tag">'+esc(L().ccRetiredTag ? L().ccRetiredTag(2026+gone.y, gone.age, gone.by||'') : 'Retired '+(2026+gone.y))+'</div>' : '')+
    (pl && pl._regen ? '<div class="cc-regen-tag">'+esc((pl.regenOf ? L().ccRegenOf(pl.regenOf) : L().ccRegenNew)+(ccAgeNow(pl.handle)!=null ? ' · '+ccAgeNow(pl.handle) : ''))+'</div>' : '')+
    playerStatSheetHTML(team, idx, pl && pl._regen ? ccRegenShown(pl) : pl)+cardShareBtnHTML(pl)+(inCareer && typeof careerPlayerStatsHTML==='function' ? careerPlayerStatsHTML(pl.handle, pl.region) : '');
  document.getElementById('cardPeekModal').style.display='flex';
}
function closeCardPeek(){
  const m=document.getElementById('cardPeekModal');
  if(m) m.style.display='none';
}
// Makes the card art inside a container open that player, without swallowing
// the Pick button underneath it.
function wireCardPeek(container, pl){
  const art=container.querySelector('.fut-card');
  if(!art) return;
  art.style.cursor='zoom-in';
  art.title=L().cardPeekHint;
  art.onclick=()=>openCardPeek(pl);
}

// Osirion reports total eliminations for a duo; Fortnite Tracker reports averages
// per match instead. Show whichever the source for this card actually carries.
function isLcqReal(r){ return !!(r && (r.lcq || r.stage==='Lcq')); }
// What the real-data block on a card should call itself. It used to know two
// stages — the Play-In and the Last Chance Qualifier — and printed "Play-In"
// for anything else, which is how the winner of a Reload final ended up labelled
// a Play-In result. A card carries the stage it was rated on, so it is asked.
function realStageLabel(r){
  const st = r && r.stage;
  if(isLcqReal(r)) return {title:L().realTitleLcq, rank:L().realRankLcq};
  if(st === 'G' || st === 'final') return {title:L().realTitleFinal, rank:L().realRankFinal};
  if(st === 'open') return {title:L().realTitleOpens, rank:L().realRankOpens};
  if(typeof st === 'string' && st.indexOf('heat') === 0)
    return {title:L().realTitleHeat.replace('{N}', st.slice(4)),
            rank:L().realRankHeat.replace('{N}', st.slice(4))};
  return {title:L().realTitle, rank:L().realRank};
}
function realExtraRows(r){
  if(r.kills!=null) return `<div class="srow"><span>${L().realKills}</span><b>${fmtNum(r.kills)}</b></div>`;
  let out='';
  if(r.avgElims!=null) out+=`<div class="srow"><span>${L().realAvgElims}</span><b>${r.avgElims.toFixed(2)}</b></div>`;
  if(r.avgPlace!=null) out+=`<div class="srow"><span>${L().realAvgPlace}</span><b>${r.avgPlace.toFixed(2)}</b></div>`;
  return out;
}

// The working behind the rating. Every other number on the card is a result the
// player can look up; this is the one the site computes, and until now it was
// the only one you had to take on faith.
function ratingBreakdownHTML(p, glow){
  const rp=p && p._ratingParts;
  const yrBrk=yearBreakdownHTML(p, glow);
  if(!rp || !rp.parts.length) return yrBrk;
  const L_=L();
  const rows=rp.parts.map(x=>{
    const word=L_['brk_'+x.label+'_nth'];
    const name=(L_['brk_'+x.label] || x.label) + (x.nth ? (word ? ' · '+word+' '+x.nth : ' '+x.nth) : '');
    const of=x.field && x.field>50 ? '<span style="opacity:.55;"> / '+x.field+'</span>' : '';
    return `<div class="srow" style="padding:3px 0;">
      <span style="text-transform:none;letter-spacing:0;">${name} <b style="color:var(--ink);font-weight:700;">${ccTop(x.rank)}</b>${of}</span>
      <b style="font-variant-numeric:tabular-nums;">${x.score} × ${x.weight} = ${(x.score*x.weight).toFixed(1)}</b>
    </div>`;
  }).join('');
  const shown=attrsFor(p).ovr;
  const norm = Math.round(rp.blended)!==shown
    ? `<div class="srow" style="padding:3px 0;border:0;">
         <span style="text-transform:none;letter-spacing:0;opacity:.75;">${L_.brkNormalised}</span>
         <b style="font-variant-numeric:tabular-nums;">${shown}</b></div>` : '';
  return `<div class="fut-foot" style="font-size:9px;margin:12px 0 6px;color:${glow};">${L_.brkTitle}</div>
    ${rows}
    <div class="srow" style="padding:5px 0 3px;border-top:1px solid var(--line);margin-top:3px;">
      <span style="text-transform:none;letter-spacing:0;">${L_.brkBlend}</span>
      <b style="font-variant-numeric:tabular-nums;">${rp.sum.toFixed(1)} / ${rp.w.toFixed(2)} = ${rp.blended.toFixed(1)}</b>
    </div>${norm}
    <div class="region-note" style="margin-top:6px;font-size:9px;">${L_.brkNote}</div>`+yrBrk;
}
/* Рейтинг года как в ФИФЕ — строками, из чего он сложен (yearRatingPass кладёт _fifa на карточку). */
function yearBreakdownHTML(p, glow){
  const f=p && p._yr;
  if(!f) return '';
  const L_=L(), C=(typeof YEAR_RATING!=='undefined' && YEAR_RATING && YEAR_RATING.cfg) || {};
  const row=(name, val)=>`<div class="srow" style="padding:3px 0;"><span style="text-transform:none;letter-spacing:0;">${name}</span><b style="font-variant-numeric:tabular-nums;">${val}</b></div>`;
  const rows=[row(L_.brkYearSeason, f.season.toFixed(1)), row(L_.brkYearPrev, f.prev!=null ? f.prev.toFixed(1) : '-'),
              row(L_.brkYearExp, f.exp ? '+'+(f.exp*(C.expPts||1.5)).toFixed(1) : '0')];
  if(f.stat!=null) rows.push(row(L_.brkYearStat, f.stat.toFixed(1)));
  if(f.floor!=null) rows.push(row(L_.brkYearFloor, f.floor.toFixed(1)));
  rows.push(row(L_.brkYearScale, f.blended.toFixed(1)+' → '+(p.form ? p.form.base : p.rating)));
  if(p.form){ const w=String(p.form.why||''); const why=L_['formWhy'+w.charAt(0).toUpperCase()+w.slice(1)] || '';
    rows.push(row(L_.brkFormBoost+(why ? ' · '+why : ''), '+'+p.form.boost+' = '+p.rating)); }
  return `<div class="fut-foot" style="font-size:9px;margin:12px 0 6px;color:${glow};">${L_.brkYearTitle}</div>${rows.join('')}
    <div class="region-note" style="margin-top:6px;font-size:9px;">${L_.brkYearNote}</div>`;
}

function playerStatSheetHTML(team, idx, p){
  const skinR=CARD_SKIN[shownRarity(p)]||CARD_SKIN.common;
  const aR=attrsFor(p);
  const head=`<div style="display:flex;align-items:center;gap:9px;margin-bottom:3px;">
      <div class="fut-ovr" style="font-size:26px;color:${skinR.glow};">${aR.ovr}</div>
      <div class="fut-name" style="font-size:15px;">${cardFlag(p,15)}${p.handle}</div>
    </div>`;
  const gfRows = p.realGf ? `
    <div class="fut-foot" style="font-size:9px;margin:10px 0 6px;color:${skinR.glow};">${L().realTitleGf}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:0 16px;">
      <div class="srow"><span>${L().realRankGf}</span><b>#${p.realGf.rank}</b></div>
      <div class="srow"><span>${L().realPts}</span><b>${fmtNum(p.realGf.pts)}</b></div>
      <div class="srow"><span>${L().realMatches}</span><b>${p.realGf.matches}</b></div>
      <div class="srow"><span>${L().realWins}</span><b>${p.realGf.wins}</b></div>
      ${realExtraRows(p.realGf)}
    </div>` : (p.missedGf ? `
    <div class="fut-foot" style="font-size:9px;margin:10px 0 2px;color:var(--danger);">${L().missedGfNote}</div>` : '');
  const realLbl = p.real ? realStageLabel(p.real) : null;
  const realRows = p.real ? `
    <div class="fut-foot" style="font-size:9px;margin:10px 0 6px;color:${skinR.glow};">${realLbl.title}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:0 16px;">
      <div class="srow"><span>${realLbl.rank}</span><b>#${p.real.rank}</b></div>
      <div class="srow"><span>${L().realPts}</span><b>${fmtNum(p.real.pts)}</b></div>
      <div class="srow"><span>${L().realMatches}</span><b>${p.real.matches}</b></div>
      <div class="srow"><span>${L().realWins}</span><b>${p.real.wins}</b></div>
      ${realExtraRows(p.real)}
    </div>` : '';
  if(!team || !team.mstats){
    return `<div class="fut-back" style="padding:15px 16px;">${head}${gfRows}${realRows}
      ${ratingBreakdownHTML(p, skinR.glow)}
      <div class="fut-foot" style="font-size:9px;margin-top:12px;">${L().cardNoStats}</div></div>`;
  }
  const v=statsForView(team, idx);
  const rows=STAT_ROWS.map(([key,lab,get,kind])=>`
    <div class="srow"><span>${L()[lab]}</span><b>${fmtStat(kind,get(v.s,statShareFor(key, v)))}</b></div>`).join('');
  return `<div class="fut-back" style="padding:15px 16px;">
    ${head}
    ${gfRows}
    ${realRows}
    ${ratingBreakdownHTML(p, skinR.glow)}
    <div class="fut-foot" style="font-size:9px;margin:12px 0 6px;">${L().simTitle} · ${L().statLastUpdate}: ${v.s.games}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:0 16px;">${rows}</div>
  </div>`;
}

function renderStats(){
  const body=document.getElementById('statBody');
  if(!body) return;   // the source table was removed; the cards carry it all
  body.innerHTML='';
  drafted.forEach(p=>{
    const flag = cardFlag(p, 15);
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${flag}${p.handle}</td><td>${regionName(p.region)}</td><td>${translateEventText(p.event)} (${translateDate(p.date)})</td><td class="num">${p.placement!=null?'#'+p.placement:'-'}</td><td class="rate">${p.rating}</td>`;
    body.appendChild(tr);
  });
  animateRows(document.getElementById('statBody').closest('.lobby-wrap') || document.getElementById('statBody').parentElement.parentElement);
  cardFlipped={};
  renderCardGallery();
}

// ---------- Progress: draft grade, run history, achievements ----------
const LS_HISTORY='fncsdraft_history', LS_ACHV='fncsdraft_achievements';

function loadHistory(){
  try{ return JSON.parse(localStorage.getItem(LS_HISTORY)||'[]'); }catch(e){ return []; }
}
function saveHistoryEntry(entry){
  const h=loadHistory();
  h.unshift(entry);
  if(h.length>100) h.length=100;
  try{ localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }catch(e){}
}
function loadAchievements(){
  try{ return new Set(JSON.parse(localStorage.getItem(LS_ACHV)||'[]')); }catch(e){ return new Set(); }
}
function saveAchievements(set){
  try{ localStorage.setItem(LS_ACHV, JSON.stringify([...set])); }catch(e){}
}

function computeDraftGrade(avgRating, synergyBonus){
  const score = avgRating + Math.min(synergyBonus,40)*0.5;
  if(score>=95) return 'S';
  if(score>=82) return 'A';
  if(score>=68) return 'B';
  if(score>=50) return 'C';
  return 'D';
}

// The ceiling of the region actually being played. Squad-strength goals are
// written as offsets from this so they mean the same thing everywhere: Europe
// tops out at 96 and Oceania at 85, and neither player should be locked out.
function regionCeiling(ctx){
  const reg=(ctx && ctx.region) || ((ctx && ctx.squad && ctx.squad[0]) || {}).region;
  return (reg && REGION_TOP[reg]!==undefined) ? REGION_TOP[reg] : 85;
}
// Did this person play the Summit LAN? Their Summit card is its own row in the
// pool, so the roster answers it without reaching into the rating ledger.
function playedSummit(handle){
  const h=String(handle||'').toLowerCase();
  return PLAYERS_BASE.some(x=>x.handle.toLowerCase()===h && /Summit/.test(x.event||''));
}
// Won the run, whichever mode it was.
function wonRun(ctx){ return ctx.isMajor ? !!ctx.championMajor : ctx.place===1; }

const ACHIEVEMENTS=[
  {id:'first_run', icon:'🎮', check:ctx=>true},

  // ----- FNCS Major 1 card mode -----
  {id:'lan_ticket', icon:'🎟️', check:ctx=>!!(ctx.summit && ctx.summit.reachedLan)},
  {id:'summit_champion', icon:'🥇', check:ctx=>!!(ctx.summit && ctx.summit.champion)},
  {id:'gc_slot', icon:'🌐', check:ctx=>!!(ctx.summit && ctx.summit.gcSlot)},
  {id:'second_chance', icon:'🔂', check:ctx=>!!(ctx.summit && ctx.summit.viaScq && ctx.summit.reachedLan)},
  {id:'upper_bracket', icon:'🪜', check:ctx=>!!(ctx.summit && ctx.summit.day1Direct)},
  // NAW, Brazil, Asia, Middle East and Oceania get 5 or fewer LAN slots
  {id:'small_region', icon:'🗺️', check:ctx=>{
    if(!(ctx.summit && ctx.summit.reachedLan) || !ctx.region) return false;
    return (SUMMIT_SLOTS[ctx.region]||0)<=5;
  }},
  // Every "draft a strong squad" goal used to test an absolute number, which
  // only Europe and NA Central can reach: the other five regions cap at 85, so a
  // player who picked Oceania could not earn these however well they drafted,
  // and nothing on screen said why. They are measured against the ceiling of the
  // region being played instead, so each one means "the elite of your region".
  {id:'legendary_duo', icon:'🃏', check:ctx=>ctx.cardMode && ctx.squad.length>=2 &&
    ctx.squad.every(p=>attrsFor(p).ovr >= regionCeiling(ctx)-8)},
  // Distinct from elite_avg below: that one is about the squad as a whole, this
  // one is about landing the single best card the region has.
  {id:'ovr_ninety', icon:'💯', check:ctx=>{
    if(!ctx.cardMode || !ctx.squad.length) return false;
    return ctx.squad.some(p=>attrsFor(p).ovr >= regionCeiling(ctx));
  }},

  {id:'victory_royale', icon:'👑', check:ctx=>!ctx.isMajor && ctx.place===1},
  {id:'chemistry', icon:'🧪', check:ctx=>ctx.synergyBonus>=5},
  {id:'perfect_squad', icon:'🤝', check:ctx=>{
    if(ctx.squad.length<2) return false;
    for(let i=0;i<ctx.squad.length;i++) for(let j=i+1;j<ctx.squad.length;j++){
      const a=ctx.squad[i].handle, b=ctx.squad[j].handle;
      if(!ccWereTeammates(a, b)) return false;
    }
    return true;
  }},
  {id:'squad_slayer', icon:'🌍', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    if(!won) return false;
    const nats=ctx.squad.map(p=>p.nat).filter(Boolean);
    return nats.length===ctx.squad.length && new Set(nats).size===1;
  }},
  {id:'major_champion', icon:'🏆', check:ctx=>ctx.isMajor && ctx.championMajor},
  {id:'comeback', icon:'🔁', check:ctx=>ctx.isMajor && ctx.cameFromLcq && ctx.reachedFinals},
  {id:'cosmopolitan', icon:'🧳', check:ctx=>new Set(ctx.squad.map(p=>p.nat).filter(Boolean)).size>=3},
  {id:'no_reroll', icon:'🎯', check:ctx=>ctx.rerollsUsed===0},
  {id:'s_tier', icon:'⭐', check:ctx=>ctx.grade==='S'},
  {id:'s1ned_win', icon:'🇺🇦', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    return won && ctx.squad.some(p=>p.handle.toLowerCase()==='s1ned');
  }},
  {id:'ten_runs', icon:'🎖️', check:ctx=>loadHistory().length>=10},
  {id:'podium', icon:'🥉', check:ctx=>!ctx.isMajor && ctx.place<=3},
  {id:'runner_up', icon:'🥈', check:ctx=>!ctx.isMajor && ctx.place===2},
  {id:'top10', icon:'🔟', check:ctx=>!ctx.isMajor && ctx.place<=10},
  {id:'dead_last', icon:'💀', check:ctx=>!ctx.isMajor && ctx.totalTeams>1 && ctx.place===ctx.totalTeams},
  // Tracks the mythic band rather than a hard-coded 100, so it moves with
  // rarityForRating instead of quietly becoming impossible when the tier does.
  {id:'full_mythic', icon:'💛', check:ctx=>ctx.squad.length>0 && ctx.squad.every(p=>shownRarity(p)==='mythic')},
  {id:'elite_avg', icon:'🌟', check:ctx=>ctx.squad.length>0 && ctx.avgRating >= regionCeiling(ctx)-4},
  {id:'all_rerolls', icon:'🔄', check:ctx=>ctx.rerollsUsed>=2},
  {id:'nail_biter', icon:'🔥', check:ctx=>{
    if(ctx.place!==1 || !ctx.allTeams || ctx.allTeams.length<2) return false;
    const sorted=ctx.allTeams.slice().sort((a,b)=>(b.totalPts||b.stagePts||0)-(a.totalPts||a.stagePts||0) || (b.totalElims||b.stageElims||0)-(a.totalElims||a.stageElims||0));
    const topPts=sorted[0].totalPts!=null?sorted[0].totalPts:(sorted[0].stagePts||0);
    const secondPts=sorted[1].totalPts!=null?sorted[1].totalPts:(sorted[1].stagePts||0);
    return (topPts-secondPts)<15;
  }},
  {id:'one_flag', icon:'🏳️', check:ctx=>{
    const nats=ctx.squad.map(p=>p.nat).filter(Boolean);
    return nats.length===ctx.squad.length && new Set(nats).size===1;
  }},
  {id:'duo_champion', icon:'2️⃣', check:ctx=>!ctx.isMajor && ctx.mode===2 && ctx.place===1},
  {id:'trio_champion', icon:'3️⃣', check:ctx=>!ctx.isMajor && ctx.mode===3 && ctx.place===1},
  {id:'squad_champion', icon:'4️⃣', check:ctx=>!ctx.isMajor && ctx.mode===4 && ctx.place===1},
  {id:'twenty_runs', icon:'📿', check:ctx=>loadHistory().length>=20},
  {id:'fifty_runs', icon:'🎗️', check:ctx=>loadHistory().length>=50},
  {id:'major_finalist', icon:'🏟️', check:ctx=>ctx.isMajor && ctx.reachedFinals},
  {id:'lcq_champion', icon:'⚔️', check:ctx=>ctx.isMajor && ctx.cameFromLcq && ctx.championMajor},
  // The duo ceiling: real teammates who also share a passport. Trio and squad
  // clear it easily; in the Majors it is the most a pair can possibly have.
  {id:'high_synergy', icon:'⚡', check:ctx=>ctx.synergyBonus>=7},
  {id:'perfectionist', icon:'✨', check:ctx=>ctx.place===1 && ctx.grade==='S'},

  {id:'iron_man', icon:'🦾', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log.every(g=>g.elims>=1);
  }},
  {id:'highlight_reel', icon:'🎬', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.some(g=>g.elims>=15);
  }},
  {id:'sharpshooter', icon:'💥', check:ctx=>{
    if(!ctx.you) return false;
    const elims=ctx.you.totalElims!=null?ctx.you.totalElims:(ctx.you.stageElims||0);
    return elims>=100;
  }},
  {id:'flawless', icon:'🛡️', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log.every(g=>g.place<=10);
  }},
  {id:'comeback_kid', icon:'📈', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you || !ctx.totalTeams) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log[0].place > ctx.totalTeams/2;
  }},
  {id:'hundred_runs', icon:'🏅', check:ctx=>loadHistory().length>=100},
  {id:'grand_slam', icon:'🎰', check:ctx=>{
    const wins=loadHistory().filter(h=>!h.isMajor && h.place===1);
    const modes=new Set(wins.map(h=>h.mode));
    return modes.has(2) && modes.has(3) && modes.has(4);
  }},
  {id:'double_major', icon:'🏵️', check:ctx=>loadHistory().filter(h=>h.isMajor && h.championMajor).length>=2},
  {id:'ten_wins', icon:'🏵', check:ctx=>loadHistory().filter(h=>!h.isMajor && h.place===1).length>=10},
  // The genuinely hard one: three Victory Royales in a row within the same
  // tournament. Sweeping all 12 games (the old version of this) never
  // happens in a real bracket — a 3-peat hot streak does, and pros
  // occasionally pull it off, so it stays a real target instead of a
  // mathematical impossibility.
  {id:'three_peat', icon:'🌪️', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    let streak=0;
    for(const g of log){
      streak = g.place===1 ? streak+1 : 0;
      if(streak>=3) return true;
    }
    return false;
  }},

  {id:'hot_drop_king', icon:'🪂', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    return (ctx.you.landingWins||0)>0 && (ctx.you.landingLosses||0)===0;
  }},
  {id:'ghost_town', icon:'🏝️', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    return (ctx.you.landingWins||0)===0 && (ctx.you.landingLosses||0)===0;
  }},
  // Hard-but-achievable #1: your landing zone is fixed for the whole
  // tournament, so racking up 10+ scrap wins means you picked (or got
  // stuck in) a hot zone and kept winning it almost every single game.
  // Rare, but nothing here is left to pure chance beyond the power-weighted
  // coin flip each game — a strong enough squad can do this for real.
  {id:'landing_legend', icon:'🗡️', check:ctx=>ctx.you && (ctx.you.landingWins||0)>=10},
  {id:'housefire_hero', icon:'🧨', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log[0].landingOutcome==='lost';
  }},
  // Hard-but-achievable #2: losing a landing scrap means 0 points for that
  // whole game (dead before the battle even starts). Eating 5+ of those and
  // still finishing 1st overall means the games you did play, you played
  // extremely well — a real comeback story, not a guaranteed outcome.
  {id:'iron_will', icon:'🩹', check:ctx=>!ctx.isMajor && ctx.place===1 && ctx.you && (ctx.you.landingLosses||0)>=5},
  {id:'hot_streak_drop', icon:'🌋', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    let streak=0;
    for(const g of log){
      streak = g.landingOutcome==='won' ? streak+1 : (g.landingOutcome==='lost' ? 0 : streak);
      if(streak>=5) return true;
    }
    return false;
  }},
  {id:'multi_kill_drop', icon:'🎲', check:ctx=>ctx.you && (ctx.you.multiKillLandingWins||0)>=3},
  {id:'kill_grinder', icon:'💪', check:ctx=>loadHistory().reduce((s,h)=>s+(h.elims||0),0)>=500},
  {id:'raw_talent', icon:'🧠', check:ctx=>ctx.place===1 && ctx.synergyBonus===0},
  {id:'region_specialist', icon:'🧿', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    if(!won) return false;
    const regions=ctx.squad.map(p=>p.region).filter(Boolean);
    return regions.length===ctx.squad.length && new Set(regions).size===1;
  }},
  // Meme achievement: Th0masHD is famous in-universe for the curse of
  // always finishing 2nd at FNCS and never actually winning one. Drafting
  // him and then finishing exactly 2nd yourself is the joke playing out.
  {id:'thomas_curse', icon:'🫠', check:ctx=>ctx.place===2 && ctx.squad.some(p=>p.handle==='Th0masHD')},
  // One from me: play on 7 different real calendar days — pure dedication,
  // nothing to do with squad strength or luck.
  {id:'no_days_off', icon:'📅', check:ctx=>{
    const days=new Set(loadHistory().map(h=>h.date && h.date.slice(0,10)).filter(Boolean));
    return days.size>=7;
  }},

  {id:'photo_finish', icon:'📸', check:ctx=>{
    if(ctx.place!==1 || !ctx.allTeams || ctx.allTeams.length<2) return false;
    const sorted=ctx.allTeams.slice().sort((a,b)=>(b.totalPts||b.stagePts||0)-(a.totalPts||a.stagePts||0));
    const top=sorted[0].totalPts!=null?sorted[0].totalPts:(sorted[0].stagePts||0);
    const second=sorted[1].totalPts!=null?sorted[1].totalPts:(sorted[1].stagePts||0);
    return (top-second)===1;
  }},
  {id:'high_roller', icon:'💰', check:ctx=>ctx.place===1 && ctx.you && (ctx.you.multiKillLandingWins||0)>=1},
  {id:'global_squad', icon:'🌏', check:ctx=>{
    if(ctx.place!==1 || ctx.squad.length<3) return false;
    const nats=ctx.squad.map(p=>p.nat).filter(Boolean);
    return nats.length===ctx.squad.length && new Set(nats).size===nats.length;
  }},
  {id:'tactician', icon:'♟️', check:ctx=>{
    if(ctx.place!==1 || !ctx.you) return false;
    const pts=ctx.you.totalPts!=null?ctx.you.totalPts:(ctx.you.stagePts||0);
    const elims=ctx.you.totalElims!=null?ctx.you.totalElims:(ctx.you.stageElims||0);
    if(pts<=0) return false;
    return (elims*4)/pts < 0.3;
  }},
  {id:'prime_real_estate', icon:'🏔️', check:ctx=>{
    if(ctx.place!==1 || !ctx.you || !ctx.you.landingZone) return false;
    const maxPts=Math.max(...ALL_LANDING_ZONES.map(z=>z.points));
    return ctx.you.landingZone.points===maxPts;
  }},
  {id:'nothing_to_lose', icon:'🏚️', check:ctx=>{
    if(ctx.place!==1 || !ctx.you || !ctx.you.landingZone) return false;
    const minPts=Math.min(...ALL_LANDING_ZONES.map(z=>z.points));
    return ctx.you.landingZone.points===minPts;
  }},
  {id:'marathon_man', icon:'🏃', check:ctx=>{
    const h=loadHistory();
    if(h.length<3) return false;
    return h.slice(0,3).every(e=>e.totalTeams && e.place<=20);
  }},
  {id:'babel_squad', icon:'🗣️', check:ctx=>{
    if(ctx.place!==1) return false;
    const langs=ctx.squad.map(p=>languageClusterOf(p.nat)).filter(Boolean);
    return langs.length===ctx.squad.length && new Set(langs).size>=3;
  }},
  {id:'double_agent', icon:'🎭', check:ctx=>{
    if(ctx.place!==1 || ctx.mode!==4) return false;
    const counts={};
    ctx.squad.forEach(p=>{ if(p.nat) counts[p.nat]=(counts[p.nat]||0)+1; });
    const groups=Object.values(counts);
    return groups.length===2 && groups.every(c=>c===2);
  }},
  {id:'signature_squad', icon:'✍️', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1) return false;
    const key=ctx.squad.map(p=>p.handle).join(' & ');
    return loadHistory().filter(h=>!h.isMajor && h.place===1 && h.squad===key).length>=3;
  }},
  // GOAT nod: Bugha is FNCS lore's original World Cup champion — draft him,
  // win, and it's a nice little homage instead of a curse this time.
  {id:'goat_draft', icon:'🐐', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    return won && ctx.squad.some(p=>p.handle==='Bugha');
  }},
  {id:'day_grinder', icon:'📆', check:ctx=>{
    const wins=loadHistory().filter(h=>!h.isMajor && h.place===1 && h.date);
    const counts={};
    wins.forEach(h=>{ const day=h.date.slice(0,10); counts[day]=(counts[day]||0)+1; });
    return Object.values(counts).some(c=>c>=3);
  }},

  // ----- Built on what the cards now measure -----
  // The attributes stopped being invented, so these read them: a squad that wins
  // by out-surviving the lobby and one that wins by out-shooting it are two
  // different squads, and now the card can prove which is which.
  {id:'lan_veterans', icon:'🎪', check:ctx=>wonRun(ctx) && ctx.squad.length>0 &&
    ctx.squad.every(p=>playedSummit(p.handle))},
  // A squad of one clear fragger and one clear caller. "Endgame above Aim" on
  // its own was true of 44% of the pool and "Aim above Endgame" of 27%, so
  // either half was closer to a coin flip than an achievement; requiring both
  // shapes at once, each a clear ten points apart, is a deliberate draft.
  {id:'sharp_contrast', icon:'⚖️', check:ctx=>{
    if(!wonRun(ctx) || ctx.squad.length<2) return false;
    const d=ctx.squad.map(p=>{ const a=attrsFor(p); return a.aim-a.end; });
    return d.some(x=>x>=10) && d.some(x=>x<=-10);
  }},
  // Six attributes at 85 with no weak one is 1.2% of the pool — a player who was
  // good at every part of the season rather than carried by a single column.
  {id:'complete_player', icon:'🧩', check:ctx=>ctx.cardMode && ctx.squad.some(p=>{
    const a=attrsFor(p); return ATTR_KEYS.every(k=>a[k]>=85);
  })},
  // Reaching a Grand Final was true of 100 cards in Europe alone, which is most
  // of the mode's pool. Standing on its podium is 1.7%.
  {id:'podium_squad', icon:'🛐', check:ctx=>{
    if(!ctx.cardMode || ctx.squad.length<2) return false;
    const KEYS=['_m1Gf','_n1Gf','_w1Gf','_b1Gf','_a1Gf','_e1Gf','_o1Gf',
                '_m2Gf','_n2Gf','_w2Gf','_b2Gf','_a2Gf','_e2Gf','_o2Gf'];
    return ctx.squad.every(p=>KEYS.some(k=>p[k] && p[k].rank<=3));
  }},
];

function checkAndUnlockAchievements(ctx){
  const unlocked=loadAchievements();
  const newlyUnlocked=[];
  ACHIEVEMENTS.forEach(a=>{
    if(!unlocked.has(a.id) && a.check(ctx)){
      unlocked.add(a.id);
      newlyUnlocked.push(a);
    }
  });
  if(newlyUnlocked.length>0){ saveAchievements(unlocked); renderAchievementBadge(); }
  return newlyUnlocked;
}

function showUnlockToasts(newly){
  const box=document.getElementById('unlockToasts');
  if(!box) return;
  box.innerHTML='';
  newly.forEach(a=>{
    const div=document.createElement('div');
    div.className='toast-unlock';
    div.textContent=L().unlockedToast(a.icon+' '+String(L()['achv_'+a.id+'_title']||'').replace(/<[^>]*>/g, '').trim());
    box.appendChild(div);
  });
}

function renderAchievementBadge(){
  const el=document.getElementById('achievementBadge');
  if(!el) return;
  const n=loadAchievements().size;
  el.textContent = n>0 ? (n+'/'+ACHIEVEMENTS.length) : '';
}

let __shareCtx=null;
// Set the moment a run is written to the history, which is the only thing the
// leave-confirmation actually claims. __shareCtx is not a stand-in for it: a
// player knocked out of a Major reaches finalizeRunStats (so the run IS saved)
// without ever getting a share button.
let __runRecorded=false;
function showShareButton(you, place, totalTeams, isMajor, allTeams){
  const earned = lobbyPrizeTable ? prizeFor(lobbyPrizeTable, place) : 0;
  __shareCtx={you, place, totalTeams, isMajor, allTeams, earned};
  const btn=document.getElementById('shareResultBtn');
  if(btn) btn.style.display='inline-block';
}

// Portraits for the share card. Canvas cannot draw an <img> that has not
// loaded yet, so they are fetched up front; a missing file resolves to null and
// the card falls back to the same monogram the in-page portrait uses.
function loadShareImage(url){
  return new Promise(res=>{
    if(!url) return res(null);
    const img=new Image();
    img.onload=()=>res(img);
    img.onerror=()=>res(null);
    img.src=url;
  });
}
function drawSharePortrait(ctx, pl, img, x, y, w, h){
  const fam="-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
  ctx.save();
  roundRect(ctx, x, y, w, h, 12); ctx.clip();
  const rnd=seededRng(hashStr(pl.handle+'|portrait'));
  const hue=Math.floor(rnd()*360);
  const g=ctx.createLinearGradient(x, y, x, y+h);
  g.addColorStop(0, 'hsl('+hue+' 45% 34%)'); g.addColorStop(1, 'rgba(0,0,0,.75)');
  ctx.fillStyle=g; ctx.fillRect(x, y, w, h);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 '+Math.round(h*0.4)+'px '+fam;
  ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.fillText(initialsFor(pl.handle), x+w/2, y+h/2);
  ctx.textBaseline='alphabetic';
  if(img && img.width && img.height){
    // cover-fit anchored to the top, matching the CSS object-position
    const scale=Math.max(w/img.width, h/img.height);
    const dw=img.width*scale, dh=img.height*scale;
    ctx.drawImage(img, x+(w-dw)/2, y, dw, dh);
  }
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=2;
  roundRect(ctx, x, y, w, h, 12); ctx.stroke();
}

// The share card is built to read like the winners plate the run itself puts up:
// a white headline band carrying the squad's faces, the team name, and a teal
// stat strip, with the leaderboard underneath. The previous version was a
// centred column of text with nobody's face on it, and its height was a fixed
// guess that left roughly a third of the image empty.
// The share card is drawn the way the FNCS broadcast draws its standings:
// a light, faceted background, a heavy italic headline over a teal stage chip,
// and a table of light rows led by a solid black rank square. The dark, rounded,
// gradient-panel version it replaces looked like a UI screenshot; this looks
// like the graphic the results actually go out on.
async function shareResultImage(){
  if(!__shareCtx) return;
  const {you, place, totalTeams, isMajor, allTeams, earned}=__shareCtx;

  // Mini-leaderboard: up to 5 places above and 5 below your own rank.
  let lbRows=[];
  if(allTeams && allTeams.length){
    const youIdx=allTeams.indexOf(you);
    if(youIdx>=0){
      const startIdx=Math.max(0, youIdx-5);
      const endIdx=Math.min(allTeams.length-1, youIdx+5);
      for(let i=startIdx;i<=endIdx;i++) lbRows.push({team:allTeams[i], rank:i+1});
    }
  }

  const squad=(you.squad||[]).slice(0,4);
  const imgs=await Promise.all(squad.map(pl=>loadShareImage(photoURL(pl))));

  const fam="-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
  const INK='#10161c', TEAL='#00b090', MUTED='#5b6772';
  const W=1080;
  const HERO=284, LABELS=46, VALUES=96;
  const prizeH = earned>0 ? 126 : 0;
  const squadH = 44+squad.length*58+16;
  const rowH=54, tblHead=40;
  const tblH = lbRows.length ? (46+tblHead+lbRows.length*rowH+26) : 0;
  const FOOT=70;
  const H = HERO+LABELS+VALUES+prizeH+30+squadH+tblH+FOOT;

  const canvas=document.createElement('canvas');
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');

  // ---- faceted light background ---------------------------------------
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#ffffff'); bg.addColorStop(0.45,'#f1f4f6'); bg.addColorStop(1,'#e2e7ea');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // Broad diagonal panels, the same shallow angle the broadcast wall uses.
  const facet=(pts, fill)=>{
    ctx.beginPath();
    pts.forEach((pt,i)=>{ i?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]); });
    ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
  };
  facet([[0,H*0.30],[W*0.42,H*0.16],[W*0.42,H*0.24],[0,H*0.38]], 'rgba(16,22,28,.035)');
  facet([[W*0.58,H*0.05],[W,H*0.00],[W,H*0.09],[W*0.58,H*0.14]], 'rgba(16,22,28,.03)');
  facet([[0,H*0.72],[W*0.30,H*0.62],[W*0.30,H*0.70],[0,H*0.80]], 'rgba(16,22,28,.03)');
  // Teal facets in the lower-left corner.
  facet([[0,H],[0,H*0.80],[W*0.20,H*0.86],[W*0.16,H]], 'rgba(0,176,144,.20)');
  facet([[W*0.16,H],[W*0.20,H*0.86],[W*0.34,H*0.91],[W*0.30,H]], 'rgba(0,176,144,.13)');
  facet([[0,H],[W*0.10,H],[0,H*0.93]], 'rgba(0,140,116,.28)');

  // ---- hero ------------------------------------------------------------
  ctx.fillStyle=TEAL;
  ctx.beginPath();
  ctx.moveTo(W*0.60, HERO-8); ctx.lineTo(W*0.685, 0); ctx.lineTo(W, 0); ctx.lineTo(W, HERO-8);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(10,16,20,.62)';
  ctx.fillRect(W*0.70, 0, W*0.30, HERO-8);

  const headline = place===1 ? L().winnersWord : ('#'+place);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  let hf=118;
  ctx.font='italic 900 '+hf+'px '+fam;
  while(ctx.measureText(headline).width > W*0.56-56 && hf>36){ hf-=4; ctx.font='italic 900 '+hf+'px '+fam; }
  ctx.fillStyle=INK;
  ctx.fillText(headline, 52, 128);

  // stage chip, the teal slab under the headline
  const f=winnersFigures(you);
  const modeLabel = isMajor
    ? (CARD_MODE ? (CARD_SET==='m1'?'FNCS MAJOR 1':'FNCS MAJOR 2') : 'FNCS MAJOR')
    : (squad.length===2?'DUO':squad.length===3?'TRIO':'SQUAD');
  const chipText=modeLabel+'  ·  '+totalTeams+(f.games?('  ·  '+L().wGames(f.games)):'');
  ctx.font='italic 900 24px '+fam;
  const chipW=ctx.measureText(chipText).width+40;
  ctx.fillStyle=TEAL; ctx.fillRect(52, 150, chipW, 46);
  ctx.fillStyle='#fff'; ctx.fillText(chipText, 72, 181);

  // team name, black bar in broadcast style
  ctx.font='900 30px '+fam;
  let teamLine=squad.map(pl=>pl.handle).join(' + ').toUpperCase(), tf=30;
  while(ctx.measureText(teamLine).width > W*0.60-40 && tf>16){ tf-=2; ctx.font='900 '+tf+'px '+fam; }
  const nameW=ctx.measureText(teamLine).width+40;
  ctx.fillStyle=INK; ctx.fillRect(52, 208, nameW, 52);
  ctx.fillStyle='#fff'; ctx.fillText(teamLine, 72, 242);

  // portraits
  const pw = squad.length>2 ? 104 : 132, ph = squad.length>2 ? 134 : 172, gap=14;
  const totalPW=squad.length*pw+(squad.length-1)*gap;
  let px=W-40-totalPW;
  const pyTop = squad.length>2 ? 36 : 24;
  squad.forEach((pl,i)=>{
    drawSharePortrait(ctx, pl, imgs[i], px, pyTop, pw, ph);
    ctx.textAlign='center'; ctx.font='900 16px '+fam; ctx.fillStyle='#eef2f6';
    let nm=pl.handle;
    while(ctx.measureText(nm).width>pw-6 && nm.length>3) nm=nm.slice(0,-2);
    ctx.fillText(nm.toUpperCase(), px+pw/2, pyTop+ph+26);
    px+=pw+gap;
  });

  // ---- teal stat strip -------------------------------------------------
  const cells=winnersStatCells(f);
  const colW=W/cells.length;
  ctx.fillStyle=TEAL; ctx.fillRect(0, HERO, W, LABELS);
  ctx.fillStyle='#ffffff'; ctx.fillRect(0, HERO+LABELS, W, VALUES);
  cells.forEach((c,i)=>{
    const mid=colW*i+colW/2;
    ctx.textAlign='center';
    let lf=14; ctx.font='800 '+lf+'px '+fam;
    while(ctx.measureText(c.lab).width>colW-16 && lf>9){ lf--; ctx.font='800 '+lf+'px '+fam; }
    ctx.fillStyle='rgba(255,255,255,.96)';
    ctx.fillText(c.lab, mid, HERO+30);
    ctx.font='italic 900 54px '+fam; ctx.fillStyle=INK;
    ctx.fillText(String(c.val), mid, HERO+LABELS+68);
  });

  let y = HERO+LABELS+VALUES;

  // ---- prize -----------------------------------------------------------
  if(earned>0){
    const money=ccMoney(earned);
    ctx.textAlign='center'; ctx.font='italic 900 46px '+fam;
    const cw=ctx.measureText(money).width+52, ch=62;
    ctx.fillStyle=INK; ctx.fillRect(W/2-cw/2, y+22, cw, ch);
    ctx.fillStyle='#ffd166'; ctx.fillText(money, W/2, y+22+46);
    ctx.font='800 15px '+fam; ctx.fillStyle=MUTED;
    ctx.fillText(ccMoney(Math.round(earned/Math.max(1,squad.length)))+' PER PLAYER',
      W/2, y+22+ch+24);
    y+=prizeH;
  }
  y+=30;

  // ---- squad strip -----------------------------------------------------
  const panelX=52, panelW=W-104;
  ctx.fillStyle='rgba(255,255,255,.86)'; ctx.fillRect(panelX, y, panelW, squadH);
  ctx.fillStyle=TEAL; ctx.fillRect(panelX, y, 6, squadH);
  ctx.textAlign='left'; ctx.font='800 14px '+fam; ctx.fillStyle=MUTED;
  ctx.fillText(String(L().yourSquadTitle||'SQUAD').toUpperCase(), panelX+24, y+28);
  ctx.textAlign='right'; ctx.font='italic 900 18px '+fam; ctx.fillStyle=TEAL;
  ctx.fillText('PWR '+Math.round(you.pow||0), panelX+panelW-24, y+28);
  ctx.textAlign='left';
  squad.forEach((pl,i)=>{
    const ry=y+48+i*58;
    ctx.font='900 24px '+fam; ctx.fillStyle=INK;
    ctx.fillText(pl.handle.toUpperCase(), panelX+24, ry+22);
    ctx.font='700 14px '+fam; ctx.fillStyle=MUTED;
    ctx.fillText((pl.nat?natDisplay(pl.nat):'-')+'  ·  '+pl.rating, panelX+24, ry+42);
    // exotic — креатор Про-Ама, тот же #70C7F8, что на карточке и в --exotic.
    const rColor={common:'#9aa0a6',uncommon:'#3aa76a',rare:'#2b8fd0',epic:'#8b4ecc',legendary:'#d9a520',mythic:'#d9a520',exotic:'#70c7f8'}[shownRarity(pl)]||'#9aa0a6';
    ctx.fillStyle=rColor; ctx.fillRect(panelX+panelW-38, ry+8, 14, 14);
  });
  y+=squadH;

  // ---- standings, broadcast style --------------------------------------
  if(lbRows.length){
    const tY=y+30;
    ctx.textAlign='left'; ctx.font='italic 900 30px '+fam; ctx.fillStyle=INK;
    ctx.fillText('STANDINGS', panelX, tY);

    // column geometry: a solid rank square, the team, then four right-aligned
    // numeric columns exactly as the broadcast orders them.
    const rankW=58;
    const teamX=panelX+rankW+20;
    const right=panelX+panelW-22;
    const numW=104;
    const ptsR=right, plcR=right-numW, elimR=plcR-numW, vrR=elimR-numW;
    const teamMax=vrR-30-teamX;

    const headY=tY+30;
    ctx.font='800 13px '+fam; ctx.fillStyle=MUTED; ctx.textAlign='right';
    ctx.fillText('VRS', vrR, headY+18);
    ctx.fillText('ELIMS', elimR, headY+18);
    ctx.fillText('PLCMNT PTS', plcR, headY+18);
    ctx.fillText('PTS', ptsR, headY+18);
    ctx.textAlign='left';

    const bodyTop=headY+tblHead-12;
    lbRows.forEach((row,i)=>{
      const ry=bodyTop+i*rowH;
      const t=row.team;
      const isYou=t===you;
      // row bar
      ctx.fillStyle = isYou ? 'rgba(0,176,144,.16)' : (i%2 ? '#eaeef1' : '#f7f9fa');
      ctx.fillRect(panelX+rankW, ry, panelW-rankW, rowH-4);
      if(isYou){ ctx.fillStyle=TEAL; ctx.fillRect(panelX+rankW, ry, 5, rowH-4); }
      // rank square
      ctx.fillStyle = row.rank===1 ? '#d9a520' : INK;
      ctx.fillRect(panelX, ry, rankW, rowH-4);
      ctx.textAlign='center'; ctx.font='italic 900 26px '+fam; ctx.fillStyle='#fff';
      ctx.fillText(String(row.rank), panelX+rankW/2, ry+35);

      // team
      ctx.textAlign='left';
      // the live table prefixes your own row with "Your squad:"; a broadcast
      // standings row is just the team, so it comes off here.
      let nm=t.name.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&')
        .replace(/^\s*(Твой состав|Your squad)\s*:\s*/i,'')
        .replace(/&/g,'+').toUpperCase();
      let nf=21; ctx.font='900 '+nf+'px '+fam;
      while(ctx.measureText(nm).width>teamMax && nf>12){ nf--; ctx.font='900 '+nf+'px '+fam; }
      while(ctx.measureText(nm).width>teamMax && nm.length>4){ nm=nm.slice(0,-3)+'…'; }
      ctx.fillStyle=INK;
      ctx.fillText(nm, teamX, ry+33);

      // numbers
      const log=((t.stageLog&&t.stageLog.length)?t.stageLog:(t.gameLog||[])).filter(g=>!g.isLandingBonus);
      const pts = t.totalPts!=null?t.totalPts:(t.stagePts||0);
      const elimPts = log.reduce((a,g)=>a+(g.elimPts||0),0);
      const plc = Math.max(0, pts-elimPts);
      const vrs = log.filter(g=>g.place===1).length || (t.wins||0);
      const elims = t.totalElims!=null?t.totalElims:(t.stageElims||0);
      ctx.textAlign='right'; ctx.fillStyle=INK;
      ctx.font='italic 900 25px '+fam;
      ctx.fillText(String(vrs).padStart(2,'0'), vrR, ry+34);
      ctx.fillText(String(elims), elimR, ry+34);
      ctx.fillText(String(plc), plcR, ry+34);
      ctx.fillText(String(pts), ptsR, ry+34);
      ctx.textAlign='left';
    });
  }

  // ---- footer ----------------------------------------------------------
  ctx.font='800 15px '+fam; ctx.fillStyle=MUTED; ctx.textAlign='center';
  ctx.fillText('made by psychopath  ·  fncs draft simulator', W/2, H-26);

  const link=document.createElement('a');
  link.download='fncs-draft-result.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function finalizeRunStats(mode, isMajor, place, totalTeams, championMajor, cameFromLcq, reachedFinals, you, allTeams){
  const avgRating = drafted.length ? Math.round(drafted.reduce((s,p)=>s+p.rating,0)/drafted.length) : 0;
  const syn = draftSynergy(drafted);
  const grade = computeDraftGrade(avgRating, syn.bonus);
  const rerollsUsed = 2-rerollsLeft;

  const gradeBadge=document.getElementById('gradeBadge');
  const gradeScoreLine=document.getElementById('gradeScoreLine');
  if(gradeBadge){
    gradeBadge.textContent=grade;
    gradeBadge.className='grade-badge grade-'+grade;
  }
  if(gradeScoreLine){
    gradeScoreLine.textContent=avgRating+' '+L().ratingHeader.toLowerCase()+' · +'+syn.bonus+' '+L().synergyLabel.replace(':','').toLowerCase();
  }

  const points = you ? (you.totalPts!=null?you.totalPts:you.stagePts||0) : 0;
  const elims = you ? (you.totalElims!=null?you.totalElims:you.stageElims||0) : 0;
  const wins = you ? (you.wins||0) : 0;
  const matches = you ? ((you.gameLog||you.stageLog||[]).filter(g=>!g.isLandingBonus).length) : 0;

  saveHistoryEntry({
    date:new Date().toISOString(),
    mode, isMajor,
    squad:drafted.map(p=>p.handle).join(' & '),
    place, totalTeams,
    grade, championMajor:!!championMajor,
    points, matches, wins, elims
  });
  __runRecorded=true;

  const ctx={mode, isMajor, place, totalTeams, avgRating, synergyBonus:syn.bonus, grade, squad:drafted, rerollsUsed,
    championMajor:!!championMajor, cameFromLcq:!!cameFromLcq, reachedFinals:!!reachedFinals, you, allTeams,
    cardMode:CARD_MODE, cardSet:CARD_SET, region:(drafted[0]||{}).region||null, summit:lastSummit};
  const newly=checkAndUnlockAchievements(ctx);
  showUnlockToasts(newly);
  renderAchievementBadge();
}

function openHistoryScreen(){
  renderHistoryScreen();
  show('screen-history');
}

function computeTop20Cards(){
  const bestByHandle=new Map();
  PLAYERS.forEach(p=>{
    const key=p.handle.toLowerCase();
    const cur=bestByHandle.get(key);
    if(!cur || p.rating>cur.rating) bestByHandle.set(key, p);
  });
  return [...bestByHandle.values()].sort((a,b)=>b.rating-a.rating).slice(0,20);
}

function getCollectedHandles(){
  const set=new Set();
  loadHistory().forEach(h=>{
    (h.squad||'').split(' & ').forEach(name=>{ if(name) set.add(name.trim().toLowerCase()); });
  });
  return set;
}

function renderCardCollection(){
  const grid=document.getElementById('collectionGrid');
  if(!grid) return;
  grid.innerHTML='';
  const top20=computeTop20Cards();
  const collected=getCollectedHandles();
  let haveCount=0;
  top20.forEach(p=>{
    const has=collected.has(p.handle.toLowerCase());
    if(has) haveCount++;
    const card=document.createElement('div');
    card.className='achv-card '+(has?'unlocked':'locked');
    const flag=cardFlag(p,16);
    card.innerHTML=`<div class="achv-icon">${has?'🃏':'🔒'}</div><div><div class="achv-title">${flag}${p.handle}</div><div class="achv-desc">${L().ratingHeader} ${p.rating} · ${p.nat?natDisplay(p.nat):'-'}</div></div>`;
    grid.appendChild(card);
  });
  const progressEl=document.getElementById('collectionProgress');
  if(progressEl) progressEl.textContent=L().collectionProgress(haveCount, top20.length);
}

function renderHistoryScreen(){
  const grid=document.getElementById('achvGrid');
  grid.innerHTML='';
  const unlocked=loadAchievements();
  ACHIEVEMENTS.forEach(a=>{
    const is=unlocked.has(a.id);
    const card=document.createElement('div');
    card.className='achv-card '+(is?'unlocked':'locked');
    card.innerHTML=`<div class="achv-icon">${a.icon}</div><div><div class="achv-title">${L()['achv_'+a.id+'_title']}</div><div class="achv-desc">${L()['achv_'+a.id+'_desc']}</div></div>`;
    grid.appendChild(card);
  });

  renderCardCollection();

  const body=document.getElementById('historyTableBody');
  body.innerHTML='';
  const hist=loadHistory();
  if(hist.length===0){
    body.innerHTML=`<tr><td colspan="10" style="color:var(--ink-dimmer);">${L().noHistoryYet}</td></tr>`;
    return;
  }
  hist.forEach(h=>{
    const tr=document.createElement('tr');
    const d=new Date(h.date);
    const dateStr=d.toLocaleDateString(LANG==='en'?'en-US':'ru-RU',{day:'2-digit',month:'short'});
    const modeLabel = h.isMajor ? 'ALL FNCS' : (h.mode===2?L().modeDuoTitle:(h.mode===3?L().modeTrioTitle:L().modeSquadTitle));
    const resultStr = h.championMajor ? L().championMajor : (h.place==null ? L().eliminatedBanner : (h.place+' / '+h.totalTeams));
    tr.innerHTML=`<td>${dateStr}</td><td>${modeLabel}</td><td>${h.squad}</td><td class="num lobby-pts">${h.points||0}</td><td class="num lobby-num">${h.matches||0}</td><td class="num lobby-num">${h.wins||0}</td><td class="num lobby-num">${h.elims||0}</td><td>${resultStr}</td><td class="rate grade-${h.grade}">${h.grade}</td>`;
    body.appendChild(tr);
  });
}

// A run only exists on the draft and results screens, and a draft nobody has
// picked into yet has nothing worth protecting — so only interrupt when there
// is actually something to lose.
function runInProgress(){
  const results=document.getElementById('screen-results');
  if(results && results.classList.contains('active')) return true;
  const draft=document.getElementById('screen-draft');
  return !!(draft && draft.classList.contains('active') && drafted.length>0);
}
function onResetConfirmKey(e){
  if(e.key==='Escape') closeResetConfirm();
}
function closeResetConfirm(){
  document.getElementById('resetConfirmModal').style.display='none';
  document.removeEventListener('keydown', onResetConfirmKey);
}
function requestReset(){
  if(!runInProgress()){ resetAll(); return; }
  const body=document.getElementById('resetConfirmBodyEl');
  if(body) body.textContent = __runRecorded ? L().resetConfirmBodyDone : L().resetConfirmBody;
  document.getElementById('resetConfirmModal').style.display='flex';
  document.addEventListener('keydown', onResetConfirmKey);
  // Focus the safe option, so a stray Enter cancels rather than discards.
  const cancel=document.getElementById('resetConfirmNo');
  if(cancel) cancel.focus();
}

function resetAll(){
  resetRunRecord();
  const rsPrev3=document.getElementById('runSummary'); if(rsPrev3) rsPrev3.innerHTML='';
  lobbyPrizeTable=null;
  MODE_ART_NOW=null;   // меню — не «в» режиме, задник арта снимается вместе с темой
  clearLobbyTheme();
  clearEventPanel();
  removeSkipButton();
  removeLandingPrompt();
  skipAnimation=false;
  document.getElementById('topBadge').textContent=L().badgeMode;
  preSelectedRegions=[];
  preSelectedYears=[];
  CARD_MODE=false; pendingCards=false; CARD_SET='m2'; pendingCardSet='m2';
  cardFlipped={};
  const g=document.getElementById('cardGallery'); if(g) g.style.display='none';
  const gt=document.getElementById('cardGalleryTitle'); if(gt) gt.style.display='none';
  show('screen-mode');
}

window.addEventListener('DOMContentLoaded', ()=>{
  // Covers applyStaticI18n + the achievement badge, and additionally syncs
  // <html lang>, the document title and the EN/RU chip highlight to the
  // language restored from storage.
  setLang(LANG, false);
  // Ссылка для входа в лобби (?join=КОД) — сразу на экран создания карьеры.
  try{ if(typeof ccJoinFromUrl==='function') ccJoinFromUrl(); }catch(e){}
  // The career tile carries the Majors' artwork by name now, painted by the
  // same lazy loader as its neighbours. It used to copy the computed background
  // off #major2Art here, which quietly returned nothing once the tiles went
  // lazy — see data-art below.
});

/* ===== CAREER — screen 1: creating the player ==============================
   Ping to the Frankfurt server, per country, read off the reference map. The
   map's own footnote calls these approximate and so do we — they are here to
   make country a real decision, not to be a measurement.

   Country is not decoration. It sets your ping, and ping is what bends
   close-range fights later: a Georgian player is not worse at the game, they
   just lose the trades they should have won. */
/* Where a European career can be from, and what the connection costs.

   The first 45 are measured to Frankfurt. The rest joined on 19 August, when
   the map grew east past Almaty and south past Cairo — "взять северную Африку и
   еще центральную Азию, до 120 пинга, пусть казахстан будет еу регион" — and
   their milliseconds are the fit in tools/build-ping-fit.js rather than a
   measurement, because nobody has measured them. 120 ms is the reach; Kazakhstan
   is over it at 127 and is here anyway, because Kazakh players queue in Europe
   and that is a fact about the ladder rather than about the distance. */
/* European career countries and their ping to the server.
   Ruler rule: 60 km per ms, capital straight to the server, nothing else. Physics gives ~100 km/ms, the measured
   European matrix ~55, so 60 is close. It can't see routing (Pakistan reaches Tokyo via Europe: 100 vs measured 350).
   The old table was inconsistent hand values plus a fitted curve written back into itself.
   Measurements are in tools/ping/*.json; tools/build-ping-measured.js rebuilds this table by capital, population or ruler.
   150 ms is the reach where a duo stops being playable. A country in reach of two regions is offered by both
   (Kazakhstan: EU 127, ME 74). */
const CC_COUNTRIES=[
  {c:'lu',ping:3},  {c:'be',ping:5},  {c:'ch',ping:6},  {c:'nl',ping:6},
  {c:'li',ping:6},  {c:'cz',ping:7},  {c:'de',ping:7},  {c:'fr',ping:8},
  {c:'at',ping:10}, {c:'si',ping:10}, {c:'sk',ping:11}, {c:'gb',ping:11},
  {c:'dk',ping:11}, {c:'hr',ping:12}, {c:'hu',ping:14}, {c:'pl',ping:15},
  {c:'it',ping:16}, {c:'im',ping:17}, {c:'ba',ping:17}, {c:'ad',ping:17},
  {c:'ie',ping:18}, {c:'no',ping:18}, {c:'rs',ping:18}, {c:'se',ping:20},
  {c:'me',ping:20}, {c:'lv',ping:21}, {c:'lt',ping:21}, {c:'al',ping:22},
  {c:'mk',ping:22}, {c:'bg',ping:23}, {c:'by',ping:23}, {c:'es',ping:24},
  {c:'ro',ping:24}, {c:'ee',ping:24}, {c:'fi',ping:25}, {c:'tn',ping:25},
  {c:'md',ping:25}, {c:'ua',ping:26}, {c:'dz',ping:26}, {c:'mt',ping:27},
  {c:'gr',ping:30}, {c:'pt',ping:32}, {c:'ly',ping:32}, {c:'ru',ping:34},
  {c:'ma',ping:37}, {c:'tr',ping:37}, {c:'is',ping:40}, {c:'cy',ping:43},
  {c:'lb',ping:47}, {c:'eg',ping:49}, {c:'ge',ping:49}, {c:'sy',ping:49},
  {c:'ps',ping:49}, {c:'am',ping:50}, {c:'il',ping:50}, {c:'jo',ping:50},
  {c:'eh',ping:52}, {c:'az',ping:56}, {c:'iq',ping:58}, {c:'ir',ping:63},
  {c:'kw',ping:67}, {c:'tm',ping:69}, {c:'kz',ping:71}, {c:'sa',ping:72},
  {c:'bh',ping:74}, {c:'qa',ping:76}, {c:'uz',ping:78}, {c:'tj',ping:80},
  {c:'ae',ping:81}, {c:'kg',ping:82}, {c:'af',ping:85}, {c:'om',ping:86},
  {c:'pk',ping:91}
];
/* Monthly rent for living in a country, sold as a way to fix ping.
   Ping used to be fixed at creation for the whole career; real players fix it by moving.
   Rough country-wide average one-bedroom rent in USD per month, and the UI says it's approximate.
   Home is free: a career starts at 16 at the parents'. */
const CC_RENT={
  de:1000, at:900,  nl:1400, be:850,  lu:1600, ch:1700, cz:700,  pl:600,
  si:700,  sk:550,  se:900,  hu:500,  dk:1200, it:750,  no:1200, rs:450,
  hr:550,  ba:300,  fr:900,  bg:450,  me:500,  fi:900,  gb:1300, gr:500,
  ad:900,  ee:600,  al:350,  mk:300,  lv:450,  ro:450,  lt:550,  mt:900,
  by:300,  is:1300, es:850,  md:350,  ie:1800, ua:350,  pt:900,  tr:500,
  cy:800,  ru:500,  ge:450,  am:400,  az:350,
  /* Joined on 19 August with the map, and priced rather than invented: rent
     tracks how rich a country is, so tools/build-rent-fit.js fits the 45
     above against GDP per head and reads these off the line. R2 0.88 in logs,
     mean error $103 against the hand-written ones. */
  tj:150, eh:200, uz:200, tn:250, ma:250, eg:250, dz:300, ps:300,
  jo:300, sy:350, iq:350, ir:350, ly:400, lb:400, tm:400, kz:450,
  sa:700, bh:700, kw:850, il:950, qa:1150, im:1400, li:1950,
  /* And the rest of the world, when the other six maps arrived. Same fit:
     rent against GDP per head, tools/build-rent-fit.js. */
  kg:150, af:150, pk:150, ht:150, np:150, ye:150, er:150, sd:150,
  ni:200, kp:200, kh:200, mm:200, bd:200, in:200, tl:200, hn:250,
  vn:250, la:250, bt:250, pg:250, vu:250, sb:250, gt:300, sv:300,
  bo:300, ph:300, mn:300, id:300, jm:350, bz:350, py:350, ec:350,
  fj:350, dm:400, vc:400, sr:400, pe:400, gy:400, co:400, th:400,
  cu:450, do:450, mx:450, br:450, ar:450, cn:450, lc:500, gd:500,
  my:500, cl:550, pw:550, om:600, ag:600, uy:600, tt:600, ve:600,
  pa:600, kn:650, cw:650, bb:650, tc:800, aw:800, bn:800, bs:850,
  pr:850, kr:850, gu:850, nc:900, ae:950, jp:950, nz:950, ca:1000,
  tw:1000, hk:1000, au:1100, us:1200, sg:1200, ky:1350, bm:1600
};
/* A subdivision pays what its country pays.

   The North America maps are drawn by state since 20 August, so a code can be
   `us-ca` — and the rent table is written per country, because rent per state
   is a second dataset nobody has measured. Falling through to the country keeps
   a move between states free and a move between countries priced, which is the
   truth as far as this file knows it. */
/* The country a code belongs to, which for a state is the country it is in.
   `us-ca` is a place on the map and a number in the ping table; it is not a
   nationality, a flag or a passport, and everything that means one of those
   reads through this. */
function ccCountryOf(code){
  const s=String(code||'');
  const at=s.indexOf('-');
  return at>0 ? s.slice(0, at) : s;
}
function ccRentOf(code){
  let v=CC_RENT[code];
  if(v==null && typeof code==='string' && code.indexOf('-')>0) v=CC_RENT[code.split('-')[0]];
  return v==null ? null : v;
}
const CC_REGION_NAMES=JSON.parse("{\"ru\":{\"us\":\"США\",\"mx\":\"Мексика\",\"ca\":\"Канада\",\"do\":\"Доминикана\",\"cu\":\"Куба\",\"pr\":\"Пуэрто-Рико\",\"ht\":\"Гаити\",\"gt\":\"Гватемала\",\"sv\":\"Сальвадор\",\"hn\":\"Гондурас\",\"jm\":\"Ямайка\",\"ni\":\"Никарагуа\",\"bs\":\"Багамы\",\"bb\":\"Барбадос\",\"cw\":\"Кюрасао\",\"aw\":\"Аруба\",\"bm\":\"Бермуды\",\"vc\":\"Сент-Винсент\",\"lc\":\"Сент-Люсия\",\"ag\":\"Антигуа\",\"gd\":\"Гренада\",\"dm\":\"Доминика\",\"kn\":\"Сент-Китс\",\"bz\":\"Белиз\",\"tc\":\"Тёркс и Кайкос\",\"ky\":\"острова Кайман\",\"br\":\"Бразилия\",\"ar\":\"Аргентина\",\"co\":\"Колумбия\",\"pe\":\"Перу\",\"cl\":\"Чили\",\"ve\":\"Венесуэла\",\"ec\":\"Эквадор\",\"bo\":\"Боливия\",\"py\":\"Парагвай\",\"uy\":\"Уругвай\",\"pa\":\"Панама\",\"tt\":\"Тринидад\",\"sr\":\"Суринам\",\"gy\":\"Гайана\",\"cn\":\"Китай\",\"in\":\"Индия\",\"jp\":\"Япония\",\"id\":\"Индонезия\",\"pk\":\"Пакистан\",\"bd\":\"Бангладеш\",\"kr\":\"Корея\",\"ph\":\"Филиппины\",\"vn\":\"Вьетнам\",\"tw\":\"Тайвань\",\"th\":\"Таиланд\",\"hk\":\"Гонконг\",\"mm\":\"Мьянма\",\"sg\":\"Сингапур\",\"kz\":\"Казахстан\",\"my\":\"Малайзия\",\"uz\":\"Узбекистан\",\"kp\":\"КНДР\",\"kh\":\"Камбоджа\",\"mn\":\"Монголия\",\"np\":\"Непал\",\"kg\":\"Киргизия\",\"la\":\"Лаос\",\"pg\":\"Папуа\",\"bn\":\"Бруней\",\"tl\":\"Восточный Тимор\",\"gu\":\"Гуам\",\"bt\":\"Бутан\",\"pw\":\"Палау\",\"tr\":\"Турция\",\"eg\":\"Египет\",\"ir\":\"Иран\",\"sa\":\"Саудовская Аравия\",\"sd\":\"Судан\",\"iq\":\"Ирак\",\"sy\":\"Сирия\",\"af\":\"Афганистан\",\"il\":\"Израиль\",\"ye\":\"Йемен\",\"az\":\"Азербайджан\",\"kw\":\"Кувейт\",\"ae\":\"ОАЭ\",\"lb\":\"Ливан\",\"qa\":\"Катар\",\"ge\":\"Грузия\",\"tm\":\"Туркмения\",\"am\":\"Армения\",\"tj\":\"Таджикистан\",\"jo\":\"Иордания\",\"om\":\"Оман\",\"er\":\"Эритрея\",\"bh\":\"Бахрейн\",\"ps\":\"Палестина\",\"cy\":\"Кипр\",\"au\":\"Австралия\",\"nz\":\"Новая Зеландия\",\"fj\":\"Фиджи\",\"nc\":\"Новая Каледония\",\"sb\":\"Соломоновы о-ва\",\"vu\":\"Вануату\",\"im\":\"Остров Мэн\",\"gb\":\"Великобритания\",\"ua\":\"Украина\",\"tn\":\"Тунис\",\"ch\":\"Швейцария\",\"se\":\"Швеция\",\"es\":\"Испания\",\"sk\":\"Словакия\",\"si\":\"Словения\",\"rs\":\"Сербия\",\"ru\":\"Россия\",\"ro\":\"Румыния\",\"pt\":\"Португалия\",\"pl\":\"Польша\",\"no\":\"Норвегия\",\"nl\":\"Нидерланды\",\"ma\":\"Марокко\",\"eh\":\"Западная Сахара\",\"me\":\"Черногория\",\"md\":\"Молдавия\",\"mt\":\"Мальта\",\"mk\":\"Северная Македония\",\"lu\":\"Люксембург\",\"lt\":\"Литва\",\"li\":\"Лихтенштейн\",\"ly\":\"Ливия\",\"lv\":\"Латвия\",\"it\":\"Италия\",\"ie\":\"Ирландия\",\"is\":\"Исландия\",\"hu\":\"Венгрия\",\"gr\":\"Греция\",\"de\":\"Германия\",\"fr\":\"Франция\",\"fi\":\"Финляндия\",\"ee\":\"Эстония\",\"dk\":\"Дания\",\"cz\":\"Чехия\",\"hr\":\"Хорватия\",\"bg\":\"Болгария\",\"ba\":\"Босния и Герцеговина\",\"be\":\"Бельгия\",\"by\":\"Белоруссия\",\"at\":\"Австрия\",\"ad\":\"Андорра\",\"dz\":\"Алжир\",\"al\":\"Албания\",\"us-ca\":\"Калифорния\",\"us-ny\":\"Нью-Йорк\",\"us-tx\":\"Техас\",\"us-fl\":\"Флорида\",\"us-il\":\"Иллинойс\",\"us-pa\":\"Пенсильвания\",\"us-ga\":\"Джорджия\",\"us-ma\":\"Массачусетс\",\"us-az\":\"Аризона\",\"us-dc\":\"Вашингтон\",\"us-mi\":\"Мичиган\",\"us-wa\":\"Вашингтон\",\"us-mo\":\"Миссури\",\"us-oh\":\"Огайо\",\"us-mn\":\"Миннесота\",\"us-co\":\"Колорадо\",\"us-tn\":\"Теннесси\",\"us-md\":\"Мэриленд\",\"us-nv\":\"Невада\",\"us-or\":\"Орегон\",\"us-va\":\"Виргиния\",\"us-ok\":\"Оклахома\",\"us-la\":\"Луизиана\",\"us-in\":\"Индиана\",\"us-wi\":\"Висконсин\",\"us-nc\":\"Северная Каролина\",\"us-ct\":\"Коннектикут\",\"us-nm\":\"Нью-Мексико\",\"us-ut\":\"Юта\",\"us-ne\":\"Небраска\",\"us-sc\":\"Южная Каролина\",\"us-ia\":\"Айова\",\"us-id\":\"Айдахо\",\"us-mt\":\"Монтана\",\"us-nd\":\"Северная Дакота\",\"us-ms\":\"Миссисипи\",\"us-al\":\"Алабама\",\"us-sd\":\"Южная Дакота\",\"us-wy\":\"Вайоминг\",\"us-ks\":\"Канзас\",\"us-wv\":\"Западная Виргиния\",\"us-vt\":\"Вермонт\",\"us-me\":\"Мэн\"},\"en\":{\"us\":\"United States of America\",\"mx\":\"Mexico\",\"ca\":\"Canada\",\"do\":\"Dominican Republic\",\"cu\":\"Cuba\",\"pr\":\"Puerto Rico\",\"ht\":\"Haiti\",\"gt\":\"Guatemala\",\"sv\":\"El Salvador\",\"hn\":\"Honduras\",\"jm\":\"Jamaica\",\"ni\":\"Nicaragua\",\"bs\":\"Bahamas\",\"bb\":\"Barbados\",\"cw\":\"Curaçao\",\"aw\":\"Aruba\",\"bm\":\"Bermuda\",\"vc\":\"St Vincent\",\"lc\":\"Saint Lucia\",\"ag\":\"Antigua\",\"gd\":\"Grenada\",\"dm\":\"Dominica\",\"kn\":\"St Kitts\",\"bz\":\"Belize\",\"tc\":\"Turks and Caicos Islands\",\"ky\":\"Cayman Islands\",\"br\":\"Brazil\",\"ar\":\"Argentina\",\"co\":\"Colombia\",\"pe\":\"Peru\",\"cl\":\"Chile\",\"ve\":\"Venezuela\",\"ec\":\"Ecuador\",\"bo\":\"Bolivia\",\"py\":\"Paraguay\",\"uy\":\"Uruguay\",\"pa\":\"Panama\",\"tt\":\"Trinidad\",\"sr\":\"Suriname\",\"gy\":\"Guyana\",\"cn\":\"China\",\"in\":\"India\",\"jp\":\"Japan\",\"id\":\"Indonesia\",\"pk\":\"Pakistan\",\"bd\":\"Bangladesh\",\"kr\":\"South Korea\",\"ph\":\"Philippines\",\"vn\":\"Vietnam\",\"tw\":\"Taiwan\",\"th\":\"Thailand\",\"hk\":\"Hong Kong\",\"mm\":\"Myanmar\",\"sg\":\"Singapore\",\"kz\":\"Kazakhstan\",\"my\":\"Malaysia\",\"uz\":\"Uzbekistan\",\"kp\":\"North Korea\",\"kh\":\"Cambodia\",\"mn\":\"Mongolia\",\"np\":\"Nepal\",\"kg\":\"Kyrgyzstan\",\"la\":\"Laos\",\"pg\":\"Papua New Guinea\",\"bn\":\"Brunei\",\"tl\":\"East Timor\",\"gu\":\"Guam\",\"bt\":\"Bhutan\",\"pw\":\"Palau\",\"tr\":\"Turkey\",\"eg\":\"Egypt\",\"ir\":\"Iran\",\"sa\":\"Saudi Arabia\",\"sd\":\"Sudan\",\"iq\":\"Iraq\",\"sy\":\"Syria\",\"af\":\"Afghanistan\",\"il\":\"Israel\",\"ye\":\"Yemen\",\"az\":\"Azerbaijan\",\"kw\":\"Kuwait\",\"ae\":\"United Arab Emirates\",\"lb\":\"Lebanon\",\"qa\":\"Qatar\",\"ge\":\"Georgia\",\"tm\":\"Turkmenistan\",\"am\":\"Armenia\",\"tj\":\"Tajikistan\",\"jo\":\"Jordan\",\"om\":\"Oman\",\"er\":\"Eritrea\",\"bh\":\"Bahrain\",\"ps\":\"Palestine\",\"cy\":\"Cyprus\",\"au\":\"Australia\",\"nz\":\"New Zealand\",\"fj\":\"Fiji\",\"nc\":\"New Caledonia\",\"sb\":\"Solomon Islands\",\"vu\":\"Vanuatu\",\"im\":\"Isle of Man\",\"gb\":\"United Kingdom\",\"ua\":\"Ukraine\",\"tn\":\"Tunisia\",\"ch\":\"Switzerland\",\"se\":\"Sweden\",\"es\":\"Spain\",\"sk\":\"Slovakia\",\"si\":\"Slovenia\",\"rs\":\"Serbia\",\"ru\":\"Russia\",\"ro\":\"Romania\",\"pt\":\"Portugal\",\"pl\":\"Poland\",\"no\":\"Norway\",\"nl\":\"Netherlands\",\"ma\":\"Morocco\",\"eh\":\"Western Sahara\",\"me\":\"Montenegro\",\"md\":\"Moldova\",\"mt\":\"Malta\",\"mk\":\"North Macedonia\",\"lu\":\"Luxembourg\",\"lt\":\"Lithuania\",\"li\":\"Liechtenstein\",\"ly\":\"Libya\",\"lv\":\"Latvia\",\"it\":\"Italy\",\"ie\":\"Ireland\",\"is\":\"Iceland\",\"hu\":\"Hungary\",\"gr\":\"Greece\",\"de\":\"Germany\",\"fr\":\"France\",\"fi\":\"Finland\",\"ee\":\"Estonia\",\"dk\":\"Denmark\",\"cz\":\"Czech Republic\",\"hr\":\"Croatia\",\"bg\":\"Bulgaria\",\"ba\":\"Bosnia and Herzegovina\",\"be\":\"Belgium\",\"by\":\"Belarus\",\"at\":\"Austria\",\"ad\":\"Andorra\",\"dz\":\"Algeria\",\"al\":\"Albania\",\"us-ca\":\"California\",\"us-ny\":\"New York\",\"us-tx\":\"Texas\",\"us-fl\":\"Florida\",\"us-il\":\"Illinois\",\"us-pa\":\"Pennsylvania\",\"us-ga\":\"Georgia\",\"us-ma\":\"Massachusetts\",\"us-az\":\"Arizona\",\"us-dc\":\"Washington\",\"us-mi\":\"Michigan\",\"us-wa\":\"Washington\",\"us-mo\":\"Missouri\",\"us-oh\":\"Ohio\",\"us-mn\":\"Minnesota\",\"us-co\":\"Colorado\",\"us-tn\":\"Tennessee\",\"us-md\":\"Maryland\",\"us-nv\":\"Nevada\",\"us-or\":\"Oregon\",\"us-va\":\"Virginia\",\"us-ok\":\"Oklahoma\",\"us-la\":\"Louisiana\",\"us-in\":\"Indiana\",\"us-wi\":\"Wisconsin\",\"us-nc\":\"North Carolina\",\"us-ct\":\"Connecticut\",\"us-nm\":\"New Mexico\",\"us-ut\":\"Utah\",\"us-ne\":\"Nebraska\",\"us-sc\":\"South Carolina\",\"us-ia\":\"Iowa\",\"us-id\":\"Idaho\",\"us-mt\":\"Montana\",\"us-nd\":\"North Dakota\",\"us-ms\":\"Mississippi\",\"us-al\":\"Alabama\",\"us-sd\":\"South Dakota\",\"us-wy\":\"Wyoming\",\"us-ks\":\"Kansas\",\"us-wv\":\"West Virginia\",\"us-vt\":\"Vermont\",\"us-me\":\"Maine\"}}");
const CC_NAMES={
  ru:{de:'Германия',at:'Австрия',nl:'Нидерланды',be:'Бельгия',lu:'Люксембург',ch:'Швейцария',
      cz:'Чехия',pl:'Польша',si:'Словения',sk:'Словакия',se:'Швеция',hu:'Венгрия',dk:'Дания',
      it:'Италия',no:'Норвегия',rs:'Сербия',hr:'Хорватия',ba:'Босния',fr:'Франция',bg:'Болгария',
      me:'Черногория',fi:'Финляндия',gb:'Британия',gr:'Греция',ad:'Андорра',ee:'Эстония',
      al:'Албания',mk:'Македония',lv:'Латвия',ro:'Румыния',lt:'Литва',mt:'Мальта',by:'Беларусь',
      is:'Исландия',es:'Испания',md:'Молдова',ie:'Ирландия',ua:'Украина',pt:'Португалия',
      tr:'Турция',cy:'Кипр',ru:'Россия',ge:'Грузия',am:'Армения',az:'Азербайджан'},
  en:{de:'Germany',at:'Austria',nl:'Netherlands',be:'Belgium',lu:'Luxembourg',ch:'Switzerland',
      cz:'Czechia',pl:'Poland',si:'Slovenia',sk:'Slovakia',se:'Sweden',hu:'Hungary',dk:'Denmark',
      it:'Italy',no:'Norway',rs:'Serbia',hr:'Croatia',ba:'Bosnia',fr:'France',bg:'Bulgaria',
      me:'Montenegro',fi:'Finland',gb:'United Kingdom',gr:'Greece',ad:'Andorra',ee:'Estonia',
      al:'Albania',mk:'N. Macedonia',lv:'Latvia',ro:'Romania',lt:'Lithuania',mt:'Malta',
      by:'Belarus',is:'Iceland',es:'Spain',md:'Moldova',ie:'Ireland',ua:'Ukraine',pt:'Portugal',
      tr:'Turkey',cy:'Cyprus',ru:'Russia',ge:'Georgia',am:'Armenia',az:'Azerbaijan'}
};
const LS_CAREER='fncsdraft_career';


// The map itself: Eurostat GISCO country geometry — the European Commission's
// own, so the borders are the ones the EU recognises and Crimea is Ukrainian.
// Clipped to Europe, projected Mercator and simplified to about half a pixel.
// Kept as JSON text because 90 KB of path data has no business being parsed as
// source every time this file is read.
/* The other six maps, built by tools/build-region-maps.js off Natural Earth.
   Europe's is below and comes from Eurostat GISCO, which is the better source
   where it reaches; this is everywhere it does not.

   NA Central and NA West draw the same continent, so the shapes are held once
   under 'NA' and only the ping tables differ — the servers are Ashburn and
   Santa Clara and a career in Toronto is 17 ms from one and 36 from the other. */
/* The maps live in maps.js and arrive when something actually wants to draw
   one. Declared here so both files share the binding; null until then, so every
   reader has to go through ccMapsReady and none of them can quietly draw a blank
   map instead. */
let CC_REGION_MAPS=null, CC_MAP=null;
let CC_MAPS_STATE=null, CC_MAPS_WAIT=[];
function ccMapsHave(){ return CC_MAPS_STATE==='ready'; }
/* Ask for the maps. Returns true if they are already here, false if the caller
   should render something else for now and expect to be called again. */
function ccMapsReady(then){
  /* Already here: say so and stop. The callback is for the waiting case only —
     calling it now would re-enter the very function that is asking, and the
     first caller was ccRenderList, which promptly called itself until the stack
     ran out. */
  if(CC_MAPS_STATE==='ready') return true;
  if(then) CC_MAPS_WAIT.push(then);
  if(CC_MAPS_STATE==='loading') return false;
  CC_MAPS_STATE='loading';
  const el=document.createElement('script');
  el.src='maps.js';
  el.onload=function(){
    CC_MAPS_STATE='ready';
    const q=CC_MAPS_WAIT; CC_MAPS_WAIT=[];
    q.forEach(function(f){ try{ f(); }catch(e){} });
  };
  // A failed load must not wedge the screen on "loading" for ever — let the next
  // attempt try again.
  el.onerror=function(){ CC_MAPS_STATE=null; CC_MAPS_WAIT=[]; };
  document.head.appendChild(el);
  return false;
}
const CC_MAP_FOR={EU:null, NAC:'NA', NAW:'NA', BR:'BR', ASIA:'ASIA', ME:'ME', OCE:'OCE'};
/* Europe's milliseconds are measured. The rest are the measured European table
   turned into a curve — ping = 4.30 + 0.02416 km to the region's server, fitted
   on those 45 countries at R2 0.83 — and applied to each region's own server
   city. See tools/build-ping-fit.js. Nobody has measured a table for Oceania,
   and one honest curve beats two hundred invented numbers. */
const CC_REGION_PINGS=JSON.parse("{\"NAC\":[{\"c\":\"us-tx\",\"ping\":1},{\"c\":\"us-ok\",\"ping\":6},{\"c\":\"us-ms\",\"ping\":10},{\"c\":\"us-tn\",\"ping\":11},{\"c\":\"us-la\",\"ping\":12},{\"c\":\"us-ks\",\"ping\":12},{\"c\":\"us-mo\",\"ping\":15},{\"c\":\"us-al\",\"ping\":16},{\"c\":\"us-ne\",\"ping\":16},{\"c\":\"us-nm\",\"ping\":16},{\"c\":\"us-ia\",\"ping\":17},{\"c\":\"us-co\",\"ping\":18},{\"c\":\"us-ga\",\"ping\":19},{\"c\":\"us-in\",\"ping\":20},{\"c\":\"us-sd\",\"ping\":20},{\"c\":\"us-wy\",\"ping\":20},{\"c\":\"us-il\",\"ping\":22},{\"c\":\"us-wi\",\"ping\":23},{\"c\":\"us-mn\",\"ping\":23},{\"c\":\"us-sc\",\"ping\":24},{\"c\":\"us-az\",\"ping\":24},{\"c\":\"us-wv\",\"ping\":25},{\"c\":\"mx\",\"ping\":25},{\"c\":\"us-nd\",\"ping\":26},{\"c\":\"us-oh\",\"ping\":27},{\"c\":\"us-mi\",\"ping\":27},{\"c\":\"us-ut\",\"ping\":27},{\"c\":\"us-nc\",\"ping\":28},{\"c\":\"us-mt\",\"ping\":29},{\"c\":\"us-nv\",\"ping\":29},{\"c\":\"us-fl\",\"ping\":30},{\"c\":\"cu\",\"ping\":30},{\"c\":\"us-dc\",\"ping\":32},{\"c\":\"us-md\",\"ping\":32},{\"c\":\"us-va\",\"ping\":32},{\"c\":\"bz\",\"ping\":32},{\"c\":\"us-ca\",\"ping\":33},{\"c\":\"us-pa\",\"ping\":35},{\"c\":\"bs\",\"ping\":35},{\"c\":\"gt\",\"ping\":35},{\"c\":\"us-id\",\"ping\":35},{\"c\":\"ky\",\"ping\":36},{\"c\":\"us-ny\",\"ping\":37},{\"c\":\"us-ct\",\"ping\":38},{\"c\":\"ca\",\"ping\":38},{\"c\":\"hn\",\"ping\":38},{\"c\":\"sv\",\"ping\":38},{\"c\":\"us-vt\",\"ping\":40},{\"c\":\"us-ma\",\"ping\":42},{\"c\":\"ni\",\"ping\":42},{\"c\":\"jm\",\"ping\":43},{\"c\":\"us-me\",\"ping\":44},{\"c\":\"us-or\",\"ping\":44},{\"c\":\"us-wa\",\"ping\":45},{\"c\":\"tc\",\"ping\":47},{\"c\":\"ht\",\"ping\":48},{\"c\":\"bm\",\"ping\":50},{\"c\":\"do\",\"ping\":52},{\"c\":\"pr\",\"ping\":57},{\"c\":\"aw\",\"ping\":59},{\"c\":\"cw\",\"ping\":61},{\"c\":\"kn\",\"ping\":64},{\"c\":\"ag\",\"ping\":65},{\"c\":\"dm\",\"ping\":68},{\"c\":\"lc\",\"ping\":70},{\"c\":\"vc\",\"ping\":70},{\"c\":\"gd\",\"ping\":71},{\"c\":\"bb\",\"ping\":73}],\"NAW\":[{\"c\":\"us-or\",\"ping\":1},{\"c\":\"us-wa\",\"ping\":4},{\"c\":\"us-id\",\"ping\":9},{\"c\":\"us-ut\",\"ping\":17},{\"c\":\"us-mt\",\"ping\":18},{\"c\":\"us-nv\",\"ping\":20},{\"c\":\"us-ca\",\"ping\":22},{\"c\":\"us-wy\",\"ping\":25},{\"c\":\"us-co\",\"ping\":26},{\"c\":\"us-az\",\"ping\":27},{\"c\":\"us-nm\",\"ping\":30},{\"c\":\"us-nd\",\"ping\":33},{\"c\":\"us-sd\",\"ping\":34},{\"c\":\"us-ne\",\"ping\":37},{\"c\":\"us-mn\",\"ping\":38},{\"c\":\"us-ks\",\"ping\":39},{\"c\":\"us-ia\",\"ping\":39},{\"c\":\"us-ok\",\"ping\":41},{\"c\":\"us-tx\",\"ping\":44},{\"c\":\"us-mo\",\"ping\":46},{\"c\":\"us-wi\",\"ping\":46},{\"c\":\"us-il\",\"ping\":47},{\"c\":\"us-tn\",\"ping\":50},{\"c\":\"us-in\",\"ping\":50},{\"c\":\"us-ms\",\"ping\":52},{\"c\":\"us-mi\",\"ping\":53},{\"c\":\"us-la\",\"ping\":55},{\"c\":\"us-oh\",\"ping\":55},{\"c\":\"us-al\",\"ping\":57},{\"c\":\"us-wv\",\"ping\":57},{\"c\":\"us-ga\",\"ping\":58},{\"c\":\"mx\",\"ping\":60},{\"c\":\"ca\",\"ping\":60},{\"c\":\"us-sc\",\"ping\":62},{\"c\":\"us-dc\",\"ping\":63},{\"c\":\"us-md\",\"ping\":63},{\"c\":\"us-nc\",\"ping\":64},{\"c\":\"us-vt\",\"ping\":64},{\"c\":\"us-pa\",\"ping\":65},{\"c\":\"us-ny\",\"ping\":65},{\"c\":\"us-va\",\"ping\":66},{\"c\":\"us-ct\",\"ping\":66},{\"c\":\"us-ma\",\"ping\":68},{\"c\":\"us-me\",\"ping\":68},{\"c\":\"us-fl\",\"ping\":72},{\"c\":\"cu\",\"ping\":73},{\"c\":\"bz\",\"ping\":74},{\"c\":\"gt\",\"ping\":76},{\"c\":\"bs\",\"ping\":77},{\"c\":\"sv\",\"ping\":79},{\"c\":\"hn\",\"ping\":80},{\"c\":\"ky\",\"ping\":80},{\"c\":\"ni\",\"ping\":84},{\"c\":\"bm\",\"ping\":85},{\"c\":\"jm\",\"ping\":87},{\"c\":\"tc\",\"ping\":89},{\"c\":\"ht\",\"ping\":92},{\"c\":\"do\",\"ping\":95},{\"c\":\"pr\",\"ping\":100},{\"c\":\"aw\",\"ping\":102},{\"c\":\"cw\",\"ping\":104}],\"BR\":[{\"c\":\"br\",\"ping\":15},{\"c\":\"py\",\"ping\":19},{\"c\":\"uy\",\"ping\":26},{\"c\":\"ar\",\"ping\":28},{\"c\":\"bo\",\"ping\":33},{\"c\":\"cl\",\"ping\":43},{\"c\":\"sr\",\"ping\":57},{\"c\":\"pe\",\"ping\":58},{\"c\":\"gy\",\"ping\":60},{\"c\":\"tt\",\"ping\":69},{\"c\":\"gd\",\"ping\":71},{\"c\":\"ec\",\"ping\":72},{\"c\":\"bb\",\"ping\":72},{\"c\":\"co\",\"ping\":72},{\"c\":\"ve\",\"ping\":73},{\"c\":\"vc\",\"ping\":73},{\"c\":\"cw\",\"ping\":77},{\"c\":\"aw\",\"ping\":79},{\"c\":\"pa\",\"ping\":85}],\"ASIA\":[{\"c\":\"jp\",\"ping\":1},{\"c\":\"kr\",\"ping\":19},{\"c\":\"kp\",\"ping\":21},{\"c\":\"cn\",\"ping\":35},{\"c\":\"tw\",\"ping\":35},{\"c\":\"gu\",\"ping\":42},{\"c\":\"hk\",\"ping\":48},{\"c\":\"ph\",\"ping\":50},{\"c\":\"mn\",\"ping\":50},{\"c\":\"pw\",\"ping\":53},{\"c\":\"vn\",\"ping\":61},{\"c\":\"la\",\"ping\":69},{\"c\":\"bn\",\"ping\":71},{\"c\":\"kh\",\"ping\":73},{\"c\":\"mm\",\"ping\":77},{\"c\":\"th\",\"ping\":77},{\"c\":\"bt\",\"ping\":80},{\"c\":\"bd\",\"ping\":81},{\"c\":\"pg\",\"ping\":85},{\"c\":\"tl\",\"ping\":86},{\"c\":\"np\",\"ping\":86},{\"c\":\"my\",\"ping\":89},{\"c\":\"sg\",\"ping\":89},{\"c\":\"kg\",\"ping\":92},{\"c\":\"kz\",\"ping\":93},{\"c\":\"id\",\"ping\":96},{\"c\":\"in\",\"ping\":97},{\"c\":\"pk\",\"ping\":100},{\"c\":\"uz\",\"ping\":100}],\"ME\":[{\"c\":\"qa\",\"ping\":1},{\"c\":\"bh\",\"ping\":2},{\"c\":\"ae\",\"ping\":5},{\"c\":\"sa\",\"ping\":8},{\"c\":\"kw\",\"ping\":10},{\"c\":\"om\",\"ping\":12},{\"c\":\"ir\",\"ping\":19},{\"c\":\"iq\",\"ping\":19},{\"c\":\"ye\",\"ping\":22},{\"c\":\"tm\",\"ping\":26},{\"c\":\"jo\",\"ping\":28},{\"c\":\"az\",\"ping\":28},{\"c\":\"sy\",\"ping\":29},{\"c\":\"il\",\"ping\":29},{\"c\":\"er\",\"ping\":29},{\"c\":\"lb\",\"ping\":30},{\"c\":\"am\",\"ping\":30},{\"c\":\"ps\",\"ping\":30},{\"c\":\"ge\",\"ping\":32},{\"c\":\"af\",\"ping\":33},{\"c\":\"eg\",\"ping\":34},{\"c\":\"cy\",\"ping\":34},{\"c\":\"tj\",\"ping\":36},{\"c\":\"pk\",\"ping\":38},{\"c\":\"sd\",\"ping\":38},{\"c\":\"tr\",\"ping\":40},{\"c\":\"uz\",\"ping\":40}],\"OCE\":[{\"c\":\"au\",\"ping\":4},{\"c\":\"nc\",\"ping\":33},{\"c\":\"nz\",\"ping\":37},{\"c\":\"vu\",\"ping\":41},{\"c\":\"pg\",\"ping\":46},{\"c\":\"sb\",\"ping\":48},{\"c\":\"fj\",\"ping\":54},{\"c\":\"tl\",\"ping\":64}]}");

// Every number sits at its country's pole of inaccessibility — the centre of the
// largest circle that fits inside the visible shape — so nothing lands in the sea
// or in a neighbour, and Russia's 60 sits in the middle of Russia. Four countries
// have no room for a number at all and get a badge out at sea with a line
// pointing home, the way the reference map does it.
/* Badges for the four too small to carry a number: the leader line runs from
   the country to a circle in open sea. The coordinates are pixels in the map's
   own projection, so when the frame grew east to Almaty on 19 August they all
   scaled by the ratio of the two longitude spans, 77/108. */
const CC_SERVER_CITY={
  ru:{EU:'Франкфурт', NAC:'Ашберн', NAW:'Санта-Клара', BR:'Сан-Паулу',
      ASIA:'Токио', ME:'Бахрейн', OCE:'Сидней'},
  en:{EU:'Frankfurt', NAC:'Ashburn', NAW:'Santa Clara', BR:'S\u00e3o Paulo',
      ASIA:'Tokyo', ME:'Bahrain', OCE:'Sydney'}
};
function ccServerCity(reg){
  const t=CC_SERVER_CITY[LANG]||CC_SERVER_CITY.en;
  return t[reg||ccCareerRegion()]||t.EU;
}
const CC_CALLOUT={lu:[251,443], ad:[279,543], mt:[374,630], cy:[523,626]};

/* The United States wears one flag, not fifty. The North America maps are drawn
   by state so a Californian and a New Yorker can pick their own milliseconds,
   but a state is a zone on the map, not a country — his rule, 20 August. So
   every us-* shape is filled from a single pattern stretched across the whole
   country: the stars and stripes run unbroken from coast to coast, and the
   state borders only cut it into the zones you click, each with its own number
   written on it and its own name in the tooltip. */
function ccUsFlagBox(M){
  if(M.__usBox!==undefined) return M.__usBox;
  let x0=Infinity, y0=Infinity, x1=-Infinity, y1=-Infinity;
  Object.keys(M.c).forEach(c=>{
    if(c.indexOf('us-')!==0) return;
    const o=M.c[c];
    x0=Math.min(x0,o.px); y0=Math.min(y0,o.py);
    x1=Math.max(x1,o.px+o.pw); y1=Math.max(y1,o.py+o.ph);
  });
  M.__usBox = x0===Infinity ? null : {px:x0, py:y0, pw:x1-x0, ph:y1-y0};
  return M.__usBox;
}

/* click — whose map this is. The creation screen picks a country to be from;
   the career's move screen picks a country to sit in. Same shapes, same flags,
   same numbers, so the two screens cannot disagree about what 26ms looks like —
   only the handler on top of it changes. */
function ccBuildMap(click, reg){
  const M=ccMapHere(reg);
  if(!M) return '<div class="cc-note">'+L().ccMapLoading+'</div>';
  let defs='', land='', shapes='', leads='', labels='';
  const usBox=ccUsFlagBox(M); let usDone=false;
  ccCountriesHere(reg).forEach(e=>{
    const o=M.c[e.c]; if(!o) return;
    const nm=ccCountryName(e.c);
    const state=!!usBox && e.c.indexOf('us-')===0;
    const fid=state ? 'ccf_us' : 'ccf_'+e.c;
    // The flag is stretched to the country's mainland box, not cropped to it —
    // a crop loses stripes, and on Russia it lost the white one off the top of
    // the frame. Stretching is what the reference map does anyway. For the
    // states the box is the country's, drawn once and shared by all of them.
    if(!state || !usDone){
      const b=state?usBox:o;
      defs+=`<pattern id="${fid}" patternUnits="userSpaceOnUse" `+
        `x="${b.px}" y="${b.py}" width="${b.pw}" height="${b.ph}">`+
        `<image href="flags/w320/${state?'us':e.c}.png" preserveAspectRatio="none" `+
        `x="0" y="0" width="${b.pw}" height="${b.ph}"/></pattern>`;
      if(state) usDone=true;
    }
    shapes+=`<path class="cc-mp" data-code="${e.c}" d="${o.d}" fill="url(#${fid})">`+
      `<title>${nm}: ${e.ping} ms</title></path>`;
    const call=(ccMapHere(reg)===CC_MAP) ? CC_CALLOUT[e.c] : null;
    const at=call||[o.cx,o.cy];
    // Size follows how much room the country actually has, not its bounding box.
    const fs2=call?13:Math.max(9,Math.min(26,7+o.r*0.38));
    if(call){
      leads+=`<line class="cc-lead" x1="${o.cx}" y1="${o.cy}" x2="${at[0]}" y2="${at[1]}"/>`+
        `<circle class="cc-badge" data-code="${e.c}" cx="${at[0]}" cy="${at[1]}" r="15"/>`;
    }
    labels+=`<text class="cc-num" data-code="${e.c}" x="${at[0]}" y="${at[1]}" `+
      `font-size="${fs2.toFixed(0)}">${e.ping}</text>`;
  });
  land=`<path class="cc-land" d="${M.land}"/>`;
  ccMapZoomWire();
  const t=L();
  return `<div class="cc-mapzoom">`+
    `<svg class="cc-map" viewBox="0 0 1000 ${M.H}" onclick="${click||'ccMapClick(event)'}">`+
    `<defs>${defs}</defs><rect class="cc-sea" x="0" y="0" width="1000" height="${M.H}"/>`+
    land+shapes+leads+labels+`</svg>`+
    `<div class="cc-zoomc">`+
      `<button type="button" title="${t.ccZoomIn}" aria-label="${t.ccZoomIn}" `+
        `onclick="ccMapZoomBtn(event,1.7)">+</button>`+
      `<button type="button" title="${t.ccZoomOut}" aria-label="${t.ccZoomOut}" `+
        `onclick="ccMapZoomBtn(event,1/1.7)">−</button>`+
      `<button type="button" title="${t.ccZoomReset}" aria-label="${t.ccZoomReset}" `+
        `onclick="ccMapZoomBtn(event,0)">⤢</button>`+
    `</div></div>`;
}

/* ---- Приблизить карту ------------------------------------------------------
 *
 * Просьба: Род-Айленд занимает четыре пикселя, а Делавэр и
 * того меньше — в исходном масштабе по ним не попасть и их число не прочесть.
 * Карта одна, поэтому приближает её сама карта: viewBox сужается вокруг точки,
 * на которую смотрят, а всё остальное — те же формы, те же флаги, тот же клик.
 * Ничего не перерисовывается, так что флаги с flagcdn не загружаются заново.
 */
const CC_ZOOM_MAX=12;
function ccMapVB(svg){
  if(!svg.__vb){
    const p=String(svg.getAttribute('viewBox')||'0 0 1000 700').trim().split(/\s+/).map(Number);
    svg.__vb={x:p[0], y:p[1], w:p[2], h:p[3], W:p[2], H:p[3]};
  }
  return svg.__vb;
}
// Одна дверь для всех изменений рамки: масштаб зажат между целой картой и
// CC_ZOOM_MAX, а сама рамка не выпускается за края — угол моря вместо страны
// никому не нужен.
function ccMapSet(svg, w, x, y){
  const vb=ccMapVB(svg);
  w=Math.min(vb.W, Math.max(vb.W/CC_ZOOM_MAX, w));
  const h=w*vb.H/vb.W;
  x=Math.min(vb.W-w, Math.max(0, x));
  y=Math.min(vb.H-h, Math.max(0, y));
  vb.w=w; vb.h=h; vb.x=x; vb.y=y;
  svg.setAttribute('viewBox', x.toFixed(2)+' '+y.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2));
  /* Число на стране нарисовано в координатах карты, поэтому приближение
     раздувало его вместе с ней: на четырёхкратном зуме 35 закрывало половину
     Пенсильвании. Пиксель на экране у цифры один и тот же на любом масштабе —
     размер шрифта и его обводка ужимаются ровно во столько, во сколько
     раздвинулась карта. Кегль каждой цифры свой, он посчитан по месту в
     стране, поэтому базовый читается с самого элемента и запоминается. */
  /* Компенсация не полная: при сильном приближении подписи, ужатые ровно во
     столько же, читались бы мельче самой карты. 0.7 в степени — цифра растёт
     примерно вполовину медленнее карты. */
  const k=Math.pow(w/vb.W, 0.7);
  svg.querySelectorAll('.cc-num').forEach(t=>{
    if(!t.__fs) t.__fs=+t.getAttribute('font-size')||12;
    t.style.fontSize=(t.__fs*k).toFixed(2)+'px';
    t.style.strokeWidth=(3.2*k).toFixed(2);
  });
  const box=svg.parentNode;
  if(box && box.classList) box.classList.toggle('cc-zoomed', w < vb.W-0.5);
}
// fx, fy — доля внутри рамки, которая должна остаться на месте: под курсором,
// между пальцами или в центре, если жали кнопку.
function ccMapZoomAt(svg, k, fx, fy){
  const vb=ccMapVB(svg);
  const px=vb.x+vb.w*fx, py=vb.y+vb.h*fy;
  const w=Math.min(vb.W, Math.max(vb.W/CC_ZOOM_MAX, vb.w/k));
  const h=w*vb.H/vb.W;
  ccMapSet(svg, w, px-w*fx, py-h*fy);
}
function ccMapZoomBtn(ev, k){
  ev.preventDefault(); ev.stopPropagation();
  const box=ev.target.closest('.cc-mapzoom');
  const svg=box && box.querySelector('.cc-map');
  if(!svg) return;
  if(!k){ const vb=ccMapVB(svg); ccMapSet(svg, vb.W, 0, 0); return; }
  ccMapZoomAt(svg, k, .5, .5);
}
/* Колесо, пальцы и перетаскивание — на документе, один раз: карта строится
   заново каждый раз, когда меняется регион или язык, и слушатели на самом svg
   пришлось бы вешать после каждой отрисовки. */
function ccMapZoomWire(){
  if(ccMapZoomWire.done) return; ccMapZoomWire.done=true;
  const mapOf=ev=>(ev.target && ev.target.closest) ? ev.target.closest('.cc-mapzoom .cc-map') : null;
  const frac=(svg,x,y)=>{ const r=svg.getBoundingClientRect();
    return [(x-r.left)/(r.width||1), (y-r.top)/(r.height||1)]; };
  document.addEventListener('wheel', ev=>{
    const svg=mapOf(ev); if(!svg) return;
    ev.preventDefault();
    const f=frac(svg, ev.clientX, ev.clientY);
    ccMapZoomAt(svg, ev.deltaY<0 ? 1.22 : 1/1.22, f[0], f[1]);
  }, {passive:false});

  let SVG=null, from=null;
  const PTS=new Map();
  const two=()=>{ const v=[...PTS.values()]; return [v[0], v[1]]; };
  document.addEventListener('pointerdown', ev=>{
    const svg=mapOf(ev); if(!svg) return;
    if(SVG!==svg){ PTS.clear(); SVG=svg; }
    PTS.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    const vb=ccMapVB(svg);
    if(PTS.size===1){
      svg.__moved=false;
      from={x:vb.x, y:vb.y, cx:ev.clientX, cy:ev.clientY};
    }else if(PTS.size===2){
      const [a,b]=two();
      // Щипок начался — клика больше не будет, чем бы он ни кончился.
      svg.__moved=true;
      from={pinch:Math.max(1, Math.hypot(a.x-b.x, a.y-b.y)), w:vb.w, x:vb.x, y:vb.y};
    }
  });
  document.addEventListener('pointermove', ev=>{
    if(!SVG || !PTS.has(ev.pointerId)) return;
    PTS.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    const svg=SVG, vb=ccMapVB(svg);
    if(PTS.size>=2 && from && from.pinch){
      const [a,b]=two();
      const d=Math.max(1, Math.hypot(a.x-b.x, a.y-b.y));
      const f=frac(svg, (a.x+b.x)/2, (a.y+b.y)/2);
      const w=Math.min(vb.W, Math.max(vb.W/CC_ZOOM_MAX, from.w*from.pinch/d));
      const px=from.x+from.w*f[0], py=from.y+from.w*vb.H/vb.W*f[1];
      ccMapSet(svg, w, px-w*f[0], py-w*vb.H/vb.W*f[1]);
      return;
    }
    if(!from || from.pinch) return;
    const dx=ev.clientX-from.cx, dy=ev.clientY-from.cy;
    if(Math.abs(dx)+Math.abs(dy) > 4){
      svg.__moved=true;
      if(svg.parentNode && svg.parentNode.classList) svg.parentNode.classList.add('cc-drag');
    }
    if(vb.w >= vb.W-0.5) return;      // целая карта никуда не едет
    const r=svg.getBoundingClientRect();
    ccMapSet(svg, vb.w, from.x-dx/(r.width||1)*vb.w, from.y-dy/(r.height||1)*vb.h);
  });
  const up=ev=>{
    if(!SVG) return;
    PTS.delete(ev.pointerId);
    if(SVG.parentNode && SVG.parentNode.classList) SVG.parentNode.classList.remove('cc-drag');
    if(!PTS.size) from=null;
  };
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
}
// Тащили карту — значит не выбирали страну: клик после перетаскивания менял бы
// страну каждый раз, когда её просто подвинули под курсор.
function ccMapDragged(ev){
  const svg=(ev.target && ev.target.closest) ? ev.target.closest('.cc-map') : null;
  if(svg && svg.__moved){ svg.__moved=false; return true; }
  return false;
}

function ccMapClick(ev){
  if(ccMapDragged(ev)) return;
  const el=ev.target.closest('[data-code]');
  if(el) ccPickCountry(el.getAttribute('data-code'));
}

// Selection and search are painted onto the existing SVG rather than rebuilding
// it — redrawing would make the browser re-fetch all 45 flags.
function ccPaintMap(){
  const svg=document.querySelector('#ccGrid .cc-map'); if(!svg) return;
  const q=(document.getElementById('ccSearch').value||'').trim().toLowerCase();
  svg.querySelectorAll('[data-code]').forEach(el=>{
    const c=el.getAttribute('data-code');
    const hit=!q || ccCountryName(c).toLowerCase().includes(q) || c.includes(q);
    el.classList.toggle('on', c===CC.country);
    el.classList.toggle('off', !hit);
  });
}

/* A save with no country used to take the whole hub down with it: this read
   code.toUpperCase() with no guard, careerRenderHub died on its first line, and
   the career became unopenable. The creation screen gates the start button on a
   country so it cannot be made that way now, but an older or migrated save can
   still carry none, and losing a career to a missing string is not a trade
   anybody would take. */
function ccCountryName(code){
  if(!code) return '';
  return (CC_NAMES[LANG]||CC_NAMES.en)[code]
      || (CC_REGION_NAMES[LANG]||CC_REGION_NAMES.en)[code]
      || String(code).toUpperCase();
}
// The countries a career can be born in, and what each one costs in latency.
function ccCountriesHere(reg){
  const r=reg || ccCareerRegion();
  return (r==='EU' ? CC_COUNTRIES : CC_REGION_PINGS[r]) || CC_COUNTRIES;
}
function ccMapHere(reg){
  if(!CC_MAP) return null;
  const r=reg || ccCareerRegion();
  const key=CC_MAP_FOR[r];
  return key ? CC_REGION_MAPS[key] : CC_MAP;
}
function ccPingOf(code, reg){
  const e=ccCountriesHere(reg).find(x=>x.c===code);
  return e?e.ping:null;
}

// Ping is an edge you earn, not a fine you pay. A good connection is worth up to
// six points of close-range strength; a bad one is worth less of it, down to
// nothing. Nobody is ever pushed below the field for where they live — the worst
// country on the map simply gets no head start.
//
// The curve is bent rather than straight. Everything up to about 25 ms is the
// same game — the whole of western and central Europe — so a German gets no more
// than a Dane, and the edge only starts falling away where the distance is real.
//
//   Germany   1 ms  +6.0      Moscow    60 ms  +3.9
//   Britain  32 ms  +5.8      Georgia   82 ms  +1.6
//   Spain    45 ms  +5.1      Baku      89 ms  +0.8
// Age, and it is a different axis from ping. Ping only decides fights; age
// decides everything — reactions, and holding a level across eleven games in a
// night — so it moves the whole power number rather than just the close-range
// one.
//
// Full value to twenty, because that is what the scene looks like: FNCS is won
// by teenagers. Then a slow slide to thirty, and from thirty a straight 0.6 a
// year down to -4 at forty.
//
// Past forty it stops being a slide. Each further year multiplies what the last
// one cost, so the decline compounds the way an ageing player's actually does —
// a year at forty-one is not the same year as one at twenty-five. The floor
// exists only so a typo cannot produce nonsense.
//
//   13-20  +4.0     30  +2.0     40  -4.0     43   -8.8
//   25     +3.0     36  -1.6     41  -5.2     45  -14.9
const CC_AGE_EDGE=4, CC_AGE_PEAK=20, CC_AGE_FADE=30, CC_AGE_PER_YEAR=0.6;
const CC_AGE_CLIFF=40, CC_AGE_RATIO=1.3, CC_AGE_FLOOR=-20;
/* Ping and age edges are on, but only a created card carries _ageEdge/_pingEdge
   (careerCard sets them off the save, the creation screen on the preview). Roster
   cards have neither, so closeRangeEdge and ageEdgeOf add nothing for them.
   Curve check: 13-20 +4, 25 +3, 30 +2, 36 -1.6, 40 -4, steeper past forty.
   The ladder calibration assumes an edgeless duo, so a career on a good connection
   climbs faster than that table; re-measure the arc with the edge on. */
function ccAgeEdge(age){
  const a=Number(age);
  if(!(a>0)) return 0;
  if(a<=CC_AGE_PEAK) return CC_AGE_EDGE;
  // Twenty to thirty: the edge halves, a fifth of a point a year.
  if(a<=CC_AGE_FADE)
    return Math.round((CC_AGE_EDGE-(a-CC_AGE_PEAK)*(CC_AGE_EDGE/2)/(CC_AGE_FADE-CC_AGE_PEAK))*10)/10;
  // Thirty to forty: a flat 0.6 a year, straight through zero.
  const at30=CC_AGE_EDGE/2;
  if(a<=CC_AGE_CLIFF)
    return Math.round((at30-(a-CC_AGE_FADE)*CC_AGE_PER_YEAR)*10)/10;
  // Past forty it compounds: the first year costs twice the flat rate and each
  // one after multiplies by CC_AGE_RATIO.
  let v=at30-(CC_AGE_CLIFF-CC_AGE_FADE)*CC_AGE_PER_YEAR, step=CC_AGE_PER_YEAR*2;
  for(let y=CC_AGE_CLIFF+1; y<=a && v>CC_AGE_FLOOR; y++){ v-=step; step*=CC_AGE_RATIO; }
  return Math.round(Math.max(CC_AGE_FLOOR, v)*10)/10;
}

/* Ping, the same way: the country picks the number and the number decides the
   close fights. Free up to 25ms — a European on a European server is not
   fighting the connection — and worth nothing at all by 95, with the fall
   bending rather than running straight, because the difference between 30 and
   40 is felt and the difference between 80 and 90 is not. */
/* Anchors 14 and 57 rebased to the ping table (60 km per ms, from the server, Europe 3..91 ms; old table 13..148).
   Picked so each country keeps its old edge: Germany 7ms +6.0, Britain 11ms +6.0, Spain 24ms +5.3,
   Russia 34ms +4.1 (was 3.7), Georgia 49ms +1.6, Saudi 72ms +0.0. Total drift 1.2, mostly Azerbaijan.
   Without moving both anchors the smaller scale would have handed everyone a free edge. */
const CC_PING_FREE=14, CC_PING_MAX=57, CC_PING_EDGE=6, CC_PING_BEND=1.5;
function ccPingEdge(ms){
  // No ping is not a ping of zero: a card nobody measured gets nothing, and
  // Number(null) is 0, which would have handed it the full edge.
  if(ms==null || ms==='') return 0;
  const v=Number(ms);
  if(!(v>=0)) return 0;
  const t=clamp((v-CC_PING_FREE)/(CC_PING_MAX-CC_PING_FREE), 0, 1);
  return Math.round(CC_PING_EDGE*(1-Math.pow(t, CC_PING_BEND))*10)/10;
}

// What a division is worth on the card. Choosing a division is choosing how much
// of the ladder you want to climb, so it sets the starting rating rather than
// being set by it — and the bands line up with ccDivisionFor, so an existing
// card taken at 82 lands in Division 2 exactly where a rookie who picked
// Division 2 starts.
//
// Division 1 used to start at 90 — legendary, and with a good country and a young
// age the card read 100 before playing a game, which is the best player in Europe.
// That was wrong about what Division 1 is. Everybody who plays a Major Play-In is
// in Division 1, thousands of them, and hardly any hold a gold card. Division 1 is
// where the good players are, not where the best ones are.
//
// So the whole ladder drops and Division 1 tops out epic instead of legendary. A
// thirteen-year-old German starting there now reads 92 rather than 100 — still the
// ideal profile in EU, which is honest, but no longer the finished article.
//
// This costs the one-colour-per-rung property: there are only four bands below
// legendary, so Divisions 3 and 4 share green. Being right about the ladder beats
// being tidy about the palette.
/* Полоса рунга: шаг 7 на рунг (см. CC_DUO_BEHIND), верх 82. От ccBand(1) же
   считаются потолок Д2, классификация карточки и потолок генерации.
   Измеренная комната Д1 (квалификация через Плей-Ин/Ласт Ченс, сезонный рейтинг)
   читается 78, медиана 77, максимум 97, но 78 сюда не ставить: Д2 прижимается к Д1
   (разрыв 2 вместо 7), ловит check-career-divisions. Число комнаты живёт в окнах
   check-career-field и check-career-pools, не здесь. */
const CC_DIV_RATING={1:82, 2:75, 3:68, 4:61, 5:54};
/* Сколько ступеней у региона. У Epic дивизионные капы 4 и 5 идут только в
   Европе и NA Central — в остальных пяти регионах лестница кончается третьим
   (проверено по id событий: 177 капов в архиве Tracker, D1-D3 везде, D4-D5
   только EU и NAC). */
const CC_DIV_DEEP=['EU','NAC'];
function ccDivCount(reg){
  const r=reg || (typeof ccCareerRegion==='function' ? ccCareerRegion() : 'EU');
  // 2023-й: Elite, Contender, Challenger — три везде.
  if(typeof ccIs2023==='function' && (ccIs2023() || ccIs2022())) return 3;
  /* 2025-й: трио-лестница FNCS (S33–S37) — Д1–Д3 во всех семи регионах, FNCS Trial садил только в них
     (его слово 23.10: «делай как в фортнайте 25 год»). Д4–Д5 у Epic появились с дуо-капами S37 и в 2026-м. */
  if(typeof ccIs2025==='function' && ccIs2025()) return 3;
  return CC_DIV_DEEP.indexOf(r)>=0 ? 5 : 3;
}
/* Три ступени держат ту же полосу, что и пять: верх остаётся верхом, низ —
   входом. Отрезать 4 и 5 было нельзя: тогда третий дивизион Мидл Иста стал бы
   на четырнадцать очков выше входа, то есть вход в карьеру там оказался бы
   сильнее, чем в Европе. Решение проекта. */
const CC_DIV_RATING_3={1:82, 2:68, 3:54};
function ccDivShift(reg){
  const r=reg || (typeof ccCareerRegion==='function' ? ccCareerRegion() : 'EU');
  const top=REGION_TOP[r];
  return (top==null ? 0 : top-REGION_TOP.EU);
}
// Every band in the mode reads through here, so a region's ladder is its own.
function ccBand(div, reg){
  const tbl=ccDivCount(reg)===3 ? CC_DIV_RATING_3 : CC_DIV_RATING;
  return (tbl[div]||54)+ccDivShift(reg);
}
// And the line nothing invented may cross moves with it: a generated 80 in
// Oceania would be a name at the top of the region, which is the same thing
// CC_GEN_TOP exists to stop in Europe.
function ccGenTop(reg){ return CC_GEN_TOP+ccDivShift(reg); }

// Role is a choice here, but the game reads it off the attributes — roleFromProfile
// compares aim/clutch/consistency against endgame/survival. So picking a role tilts
// the six numbers, and the tilt is what makes the role true. Experience starts low
// whatever you pick: a rookie has none, and the weighted mean is pulled back to the
// division's rating afterwards so the choice costs nothing in overall.
function ccRookieAttrs(rating, roleKey){
  const frg = roleKey==='roleFRG';
  const tilt = frg ? {aim:7, clu:6, con:4, end:-6, sur:-6, exp:-12}
                   : {aim:-6, clu:-5, con:-2, end:7, sur:7, exp:-12};
  const a={};
  ATTR_KEYS.forEach(k=>{ a[k]=clamp(rating+tilt[k], 35, 99); });
  const mean=()=>Math.round(ATTR_KEYS.reduce((s,k)=>s+a[k]*ATTR_W[k],0));
  let guard=0;
  while(mean()!==rating && guard++<40){
    const gap=rating-mean();
    ATTR_KEYS.forEach(k=>{ a[k]=clamp(Math.round(a[k]+gap), 35, 99); });
  }
  a.ovr=mean();
  // attrsFor only derives these on cards it has to lift, and a rookie is built
  // at its target already, so it returns before touching them. Set them here or
  // the card has no role at all — which is the whole point of choosing one.
  a.roleKey=roleFromProfile(a);
  a.bestAttr=bestPlayAttr(a);
  return a;
}

/* The player's own six, from the card they are actually playing.

   A built player carries them in the save from the day they were made. A taken
   card does not: its shape is the roster's, derived by attrsFor from the real
   standings and scaled onto whatever the career is rated today. So the first
   time one trains, the shape is copied out of the card and becomes theirs —
   which is what training a real player ought to mean anyway. From that day the
   six are the career's own rather than a record of somebody's season. */
function ccOwnAttrs(){
  const pl=CAREER.player;
  // raw: the player without the desk. See the gear note in careerCard.
  const c=careerCard(true), a=c?attrsFor(c):null;
  if(!a) return ccRookieAttrs(Math.round(pl.ovr), pl.role);
  const out={};
  ATTR_KEYS.forEach(k=>{ out[k]=a[k]; });
  out.ovr=Math.round(ATTR_KEYS.reduce((s,k)=>s+out[k]*ATTR_W[k],0));
  out.roleKey=a.roleKey; out.bestAttr=a.bestAttr;
  return out;
}

/* ---- Сменить роль посреди карьеры -----------------------------------------
   Сюда ходят все смены роли: кнопка в карьере, уход напарника с пересадкой и
   ссора. Роль это перекос профиля, а не уровень: шесть чисел сдвигаются на
   половину расстояния между шаблонами фраггера и IGL, рейтинг остаётся прежним.
   У настоящего игрока сдвигаются его собственные числа, шаблон не подставляется.
   Если своих чисел ещё нет, форма копируется с карточки, как при первой тренировке. */
const CC_ROLE_TILT={aim:6.5, clu:5.5, con:3, end:-6.5, sur:-6.5, exp:0};
// Роль, которой карьера играет сегодня: выбранная, если её выбирали, иначе та,
// что читается с карточки — настоящая у настоящего игрока, выведенная из шести
// чисел у построенного.
function ccRoleNow(){
  const pl=CAREER && CAREER.player;
  if(!pl) return null;
  if(pl.role) return pl.role;
  const c=careerCard(), a=c?attrsFor(c):null;
  return a ? a.roleKey : null;
}
function ccRoleOther(k){ return k==='roleFRG' ? 'roleIGL' : 'roleFRG'; }
function ccRoleSwitch(want){
  const pl=CAREER && CAREER.player;
  if(!pl || !want || want===ccRoleNow()) return false;
  const base=pl.attrs || ccOwnAttrs();
  const rating=Math.round(base.ovr!=null ? base.ovr
    : ATTR_KEYS.reduce((s,k)=>s+base[k]*ATTR_W[k],0));
  const sign=want==='roleFRG' ? 1 : -1;
  const out={};
  ATTR_KEYS.forEach(k=>{ out[k]=clamp(Math.round(base[k]+sign*(CC_ROLE_TILT[k]||0)), 35, 99); });
  const mean=()=>Math.round(ATTR_KEYS.reduce((s,k)=>s+out[k]*ATTR_W[k],0));
  let guard=0;
  while(mean()!==rating && guard++<40){
    const gap=rating-mean();
    ATTR_KEYS.forEach(k=>{ out[k]=clamp(Math.round(out[k]+gap), 35, 99); });
  }
  out.ovr=mean();
  out.roleKey=want;
  out.bestAttr=bestPlayAttr(out);
  pl.attrs=out;
  pl.role=want;
  // День смены — от него считается пауза до следующей (ccRoleCooldown).
  try{ if(CAREER.career) CAREER.career.roleDay=careerToday(); }catch(e){}
  return true;
}
/* РОЛЬ НЕ МЕНЯЮТ ТУДА-СЮДА (его слово 7.10: «просто так можно бесконечно спамить и роли»): сменил — следующая смена
   через CC_ROLE_SWAP_DAYS. Смена при подписании (двое одной роли) идёт своей дорогой и не запрещается, но паузу
   тоже ставит. Сколько дней осталось — 0, если можно. */
const CC_ROLE_SWAP_DAYS=14;
function ccRoleCooldown(){
  const d=CAREER && CAREER.career && CAREER.career.roleDay;
  if(!d) return 0;
  return Math.max(0, CC_ROLE_SWAP_DAYS-ccDaysBetween(d, careerToday()));
}
/* ---- Один ИГЛ на команду ---------------------------------------------------
 *
 * Правило: в команде всегда есть ИГЛ, и он один. Дуо — ИГЛ и
 * фраггер, трио — ИГЛ и два фраггера. Двух ИГЛов не бывает, команды без ИГЛа
 * не бывает тоже.
 *
 * Отсюда всё остальное: поиск предлагает только ту роль, которой не хватает;
 * выдуманные команды в лобби собираются по тому же правилу; и своя роль
 * меняется только тогда, когда после смены состав остаётся правильным — то
 * есть пока место рядом свободно. В собранном дуо кнопка гаснет: ты фраггер, а
 * рядом ИГЛ, и пересесть значит оставить команду с двумя ИГЛами.
 */
function ccSquadRoleFits(roles, seats){
  const igl=roles.filter(r=>r==='roleIGL').length;
  /* ИГЛ не больше одного — но и без него команда бывает (Notion «19.10», игрок: «сделай возможность играть с двумя
     или тремя фрагерами»; его: «пусть дают меньше силы, по логике так и должно быть»). Меньше силы уже есть:
     +ROLE_BONUS_STEP платится только составу ровно с одним ИГЛом (buildTeam), по данным гранд-финалов. */
  return igl<=1;
}
// Роли занятых мест: своя первой, дальше те, кто уже сидит рядом.
function ccSquadRoles(){
  const mine=ccRoleNow();
  const rest=careerMates().map(m=>attrsFor(m).roleKey).filter(Boolean);
  return (mine ? [mine] : []).concat(rest);
}
/* Какой роли команде не хватает, если искать ещё одного человека. null — можно
   брать любого: мест хватает на обе.

   seat — место, из-под которого открыли поиск: его сидельца считают уже
   ушедшим, потому что его и меняют. null — «любое свободное». */
function ccSeatRoleWanted(seat){
  const seats=careerSquadSize();
  const mine=ccRoleNow();
  // Кто уходит, тот уже не в составе: просить кого-то в собранную команду —
  // значит просить вместо кого-то. См. ccSeatLeaving, тот же ответ, что у
  // careerMateSeat, поэтому список и посадка не могут разойтись.
  const outAt=ccSeatLeaving(typeof seat==='number' ? seat : null);
  const roles=(mine ? [mine] : []).concat(
    careerMates().map((m,i)=>i===outAt ? null : attrsFor(m).roleKey).filter(Boolean));
  const free=seats-roles.length;
  if(free<=0) return null;
  if(roles.indexOf('roleIGL')>=0) return 'roleFRG';   // ИГЛ уже есть — только фраггеры
  return null;   // без ИГЛа можно (фраггеры без +4 за роли, см. ccSquadRoleFits) — подойдёт любой
}
function ccSquadRoleWanted(){ return ccSeatRoleWanted(null); }
// Какую роль показать первой (не запрет): обязательная, а без ИГЛа в составе — ИГЛ, он даёт +4 за роли.
function ccSeatRolePreferred(seat){
  const w=ccSeatRoleWanted(seat); if(w) return w;
  return ccSquadRoles().indexOf('roleIGL')<0 ? 'roleIGL' : null;
}
/* Чьё место освободится, если сесть сюда. То же правило, по которому сажает
   careerMateSeat: названное кресло — это оно, безымянная просьба — слабейший из
   сидящих, а если место свободно, никто не уходит вовсе. Роли считаются по
   этому же ответу, иначе состав проверялся бы против человека, который остаётся
   сидеть. */
function ccSeatLeaving(seat){
  const mates=careerMates();
  if(mates.length<careerMateSeats()) return -1;
  if(typeof seat==='number' && seat>=0 && seat<mates.length) return seat;
  let at=0, low=Infinity;
  mates.forEach((m,i)=>{ const o=(attrsFor(m)||{}).ovr; if(o<low){ low=o; at=i; } });
  return at;
}
/* Кого пересадить вместе с тобой при смене роли. Правило «один ИГЛ» запирало состав: ИГЛ не мог стать фраггером
   (команда без ИГЛа), а взять ИГЛа вместо фраггера не давал тот же счёт, кнопка гасла на dmRoleClash.
   Роль настоящего игрока посчитана по его результатам, её не трогаем. Выдуманный сосед пересаживается, и
   ccCastLadderRole пересобирает его статы. Кого двигать, решает та же прикидка, что в ccSquadCastRoles. */
/* Кто пересядет вместе с тобой — и настоящий игрок тоже.
 *
 * Здесь стояло `c.tier!=='ladder'` — то есть двигать мод соглашался только
 * выдуманного соседа. С настоящим кнопка просто гасла, и правку —
 * «предложить игроку, с которым ты играешь, сменить роль» — выполнить было
 * нечем.
 *
 * Односторонней пересадки при этом не бывает вовсе: ccSquadRoleFits держит
 * ровно одного ИГЛа, так что уйти из роли можно только отдав её. Любая смена
 * роли — обмен, и «предложить сменить роль» — это и есть вторая половина
 * твоей собственной. Поэтому настоящий сюда попадает, но помеченным: молча его
 * не пересаживают, у него спрашивают. См. careerRoleSwap. */
function ccRoleSwapMate(want){
  const recs=careerMateRecords();
  const need=want==='roleIGL' ? 'roleFRG' : 'roleIGL';
  const able=[];
  recs.forEach((pr,i)=>{
    const c=ccMateCardOf(pr);
    if(!c) return;
    const now=(attrsFor(c)||{}).roleKey;
    if(now===need) return;
    able.push({at:i, card:c, lean:ccRoleLean(c), real:c.tier!=='ladder'});
  });
  if(!able.length) return null;
  /* В ИГЛы — самого «оборонительного», во фраггеры — самого «стреляющего»; и
     выдуманного раньше настоящего, потому что выдуманного не надо уговаривать,
     а состав он держит так же. */
  able.sort((a,b)=>(a.real?1:0)-(b.real?1:0) ||
                   (need==='roleIGL' ? b.lean-a.lean : a.lean-b.lean));
  const pick=able[0];
  /* Напарник без карточки (после смены региона запись ещё старая) — пропуск,
     как в проходе выше; attrsFor(null) ронял весь экран карьеры. */
  const after=[want].concat(recs.map((pr,i)=>{
    if(i===pick.at) return need;
    const c=ccMateCardOf(pr);
    return c ? (attrsFor(c)||{}).roleKey : null;
  }).filter(Boolean));
  return ccSquadRoleFits(after, careerSquadSize())
    ? {at:pick.at, want:need, real:pick.real, card:pick.card} : null;
}
// Можно ли пересесть самому. Возвращает причину отказа, чтобы кнопка могла её
// сказать, а не просто погаснуть.
function ccRoleSwapCan(){
  const cool=ccRoleCooldown();
  if(cool>0) return {ok:false, want:ccRoleOther(ccRoleNow()), why:'cool', days:cool};
  const want=ccRoleOther(ccRoleNow());
  const roles=ccSquadRoles();
  if(!roles.length) return {ok:false, why:null};
  const after=[want].concat(roles.slice(1));
  const fits=ccSquadRoleFits(after, careerSquadSize());
  // Уйти из ИГЛов в полной команде — сначала предложить роль напарнику (так команда держит +4 за роли); некому — можно
  // остаться и без ИГЛа (фраггеры, Notion «19.10»).
  const leavesNoIgl=fits && after.length>=careerSquadSize() && after.indexOf('roleIGL')<0;
  if(fits && !leavesNoIgl) return {ok:true, want:want};
  const move=ccRoleSwapMate(want);
  if(move) return {ok:true, want:want, move:move};
  if(fits) return {ok:true, want:want};
  return {ok:false, want:want,
          why: after.filter(r=>r==='roleIGL').length>1 ? 'two' : 'none'};
}
// Кнопка в карьере. Ролей две, поэтому спрашивать «какую» не о чем — кнопка
// называет ту, в которую переходят, и переводит в неё.
function careerRoleSwap(){
  const can=ccRoleSwapCan();
  if(!can.ok) return;
  /* Настоящего игрока не пересаживают, у него спрашивают — и спрашивают до
     того, как пересесть самому. Иначе отказ оставлял бы команду без ИГЛа: ты
     уже ушёл из роли, а он в неё не сел. Спросил, услышал «нет» — не двинулся
     никто, и это единственный честный порядок. */
  if(can.move && can.move.real){
    const odds=careerMateRoleOdds(can.move.at, can.move.want);
    const who=(can.move.card||{}).handle||'', role=L()[can.move.want]||'';
    if(!odds || !odds.yes){
      careerNews('flat', 'ccNewsRoleNo', [who, role]);
      careerRenderHub();
      return;
    }
    careerNews('good', 'ccNewsRoleYes', [who, role]);
    careerEvent('tlRoleMoved', [who, role]);
  }
  if(!ccRoleSwitch(can.want)) return;
  /* Роль соседа живёт на его записи, а не на карточке: ccMateLift собирает
     карточку заново на каждый развитый рейтинг и стирает с неё _attrs, так что
     пересадка, записанная в карточку, не пережила бы ни одного турнира. */
  if(can.move){
    const pr=careerMateRecords()[can.move.at];
    if(pr){
      pr.role=can.move.want;
      const c=ccMateCardOf(pr);
      if(c && !can.move.real)
        careerNews('flat', 'ccNewsRoleMoved', [c.handle, L()[can.move.want]||'']);
    }
  }
  careerSave();
  /* Роль в команде значит больше, чем в одиночной: по ней разделены вопросы
     вечера (CC_MP_WHO) и по ней же стоит запрет на двух иглов (ccMpRolesWhy).
     Значит напарник должен увидеть новую роль сразу, а не перед вечером. */
  if(ccMpOn() && typeof MP!=='undefined' && MP.sendCard) MP.sendCard();
  careerRenderHub();
}

/* Просьба к напарнику сменить роль.
   ccSquadRoleFits держит в команде ровно одного ИГЛа, так что смена роли всегда обмен: просьба не отдельная кнопка, а вторая половина своей.
   Жмёшь «стать фраггером»: если рядом живой игрок, сначала спрашиваем его, бота пересаживаем молча. */
// Наклон карточки: положительный — человек и так играет ближе к вызову, чем к
// перестрелке. Те же четыре стата, что читает ccSquadCastRoles, когда ищет,
// кому звать.
function ccRoleLean(c){
  const a=attrsFor(c)||{};
  return (a.end+a.sur)/2-(a.aim+a.clu)/2;
}
/* Согласится ли он. Порог 50 (с него careerMoodKey перестаёт считать недовольным),
   каждый пункт наклона профиля в сторону просьбы двигает его на 4 вниз, против
   на 4 вверх; сравниваем с терпением rec.patience. Без броска нарочно: повторный
   вопрос в тот же день даёт тот же ответ, меняется он вместе с делами команды. */
function careerMateRoleOdds(at, want){
  const rec=careerMateRecords()[at], card=careerMates()[at];
  if(!rec || !card || !want) return null;
  const pat=rec.patience!=null ? rec.patience : CAREER_PATIENCE_START;
  const lean=ccRoleLean(card)*(want==="roleIGL" ? 1 : -1);
  const need=clamp(Math.round(50-lean*4), 5, 95);
  return {want:want, card:card, rec:rec, patience:pat, need:need,
          yes:pat>=need, lean:Math.round(lean*10)/10};
}

// flagImg keys on the roster's Russian country names. Our map keys on ISO codes,
// and a dozen of them — Montenegro, Iceland, Azerbaijan — never appear in the
// roster, so they have no name to look up. Fill the gaps once, using the map's
// own names, and every flag on the card works.
const CC_NAT_BY_CODE={};
(function(){
  Object.entries(FLAG_CODE).forEach(([nat,code])=>{ if(!CC_NAT_BY_CODE[code]) CC_NAT_BY_CODE[code]=nat; });
  Object.keys(CC_NAMES.ru).forEach(code=>{
    if(CC_NAT_BY_CODE[code]) return;
    const nat=CC_NAMES.ru[code];
    FLAG_CODE[nat]=code; CC_NAT_BY_CODE[code]=nat;
  });
})();
/* A state has a flag nowhere but on flagcdn, and the mode has no use for it:
   click California and the card, the bio and the move panel all fly the United
   States, because a state is a connection and not a nationality. The lookup is
   the country's, so `us-ca` finds "США" instead of finding nothing — which is
   what it found before, and why a career started in California wore no flag
   at all. */
function ccNatOf(code){ return CC_NAT_BY_CODE[ccCountryOf(code)]||null; }

// The rookie as the rest of the game sees them: a card object. _attrs short-
// circuits the leaderboard-derived builder, and _targetOvr stops attrsFor from
// lifting the card if the chosen nickname happens to match a real player in the
// rating floor table.
function ccMakePlayer(){
  // No stand-in name. An unnamed card is blank, and the portrait monogram falls
  // back to a question mark on its own — inventing a nickname would put a word
  // on the card that the player never chose.
  const nick=(document.getElementById('ccNick').value||'').trim();
  const band=ccBand(CC.div, CC.region);
  const a=ccRookieAttrs(band, CC.role);
  // Стартовые очки видны уже здесь: карточка-превью носит те же статы и тот же
  // овер, что лягут в сейв, — клик по «+ AIM» меняет её сразу.
  const rating=ccSpaApply(a);
  return {
    handle:nick, nat:ccNatOf(CC.country), region:CC.region||'EU', org:null,
    _pingEdge: ccNoEdgeNow() ? 0 : ccPingEdge(CC.country ? ccPingOf(CC.country, CC.region) : null),
    _ageEdge: ccNoEdgeNow() ? 0 : ccAgeEdge(parseInt(document.getElementById('ccAge').value,10)),
    _age: parseInt(document.getElementById('ccAge').value,10),
    _pingMs: CC.country ? ccPingOf(CC.country, CC.region) : null,
    tier:'ranked', event:L().ccDivEvent.replace('{N}', CC.div), placement:null,
    rating, _targetOvr:rating, _attrs:a, _photo:CC.photo||null
  };
}

const CC={mode:'rookie', country:null, photo:null, card:null, role:'roleFRG', div:5, region:'EU', born:null, sex:'m', year:2026};
/* Пол — его пункт 1 со страницы «ы», 22 августа. Выбор есть у построенного
   игрока; у взятой карточки это факт о человеке, как возраст, и кнопки
   закрыты (ростер FNCS — мужчины, вопрос не встаёт). Хранится 'm'|'f' на
   pl.sex; старые сейвы без поля читаются как 'm', и это ничего не меняет. */
function ccSexPick(s){
  if(CC.card) return;
  CC.sex = s==='f' ? 'f' : 'm';
  ccSexRender();
}
function ccSexRender(){
  const m=document.getElementById('ccSexM'), f=document.getElementById('ccSexF');
  if(!m || !f) return;
  m.classList.toggle('on', CC.sex!=='f');
  f.classList.toggle('on', CC.sex==='f');
  m.disabled=f.disabled=!!CC.card;
  m.style.opacity=f.style.opacity=CC.card?'0.45':'';
}
// Род для строк, которым он нужен грамматикой. Без карьеры — мужской.
function ccPlayerFem(){ return !!(CAREER && CAREER.player && CAREER.player.sex==='f'); }

function openCareerCreate(){
  try{ ccBindsPaint(); }catch(e){}
  CC_MAP_OPEN=false;
  show('screen-career-create');
  // Что здесь заводится — одиночная карьера или половина команды. См. CC_MP_NEW.
  ccMpNoteDraw();
  ccBornBounds();
  // По ссылке хозяина — его год и регион, остальные чипы заперты (ccMpLockedYear/Region).
  if(ccMpLockedYear()) CC.year=ccMpLockedYear();
  if(ccMpLockedRegion()) CC.region=ccMpLockedRegion();
  ccSetMode('rookie');
  ccRenderRegions();
  ccRenderChips();
  ccRenderCard();
  ccNoteTips();
}
/* Пояснения под полями создания — за значком ⓘ у подписи поля, как в шапке хаба (было много серого текста под
   каждым полем). Прячутся только постоянные тексты (data-i18n и подсказка статов); то, что меняется от выбора
   (строка года, «Age 16 → +4», пинг страны), остаётся на виду. Кнопка — соседом подписи, не внутри: подпись
   переписывает перевод (data-i18n), и кнопка внутри пропала бы при смене языка. */
function ccNoteTips(){
  const root=document.getElementById('screen-career-create'); if(!root) return;
  root.querySelectorAll('.cc-field').forEach((f, i)=>{
    const notes=[...f.querySelectorAll(':scope > .cc-note[data-i18n]:not(.cc-born-note), :scope > .cc-gain[data-i18n="ccBindsHint"], :scope > .cc-spa-note')];
    const lab=f.querySelector(':scope > label');
    if(!notes.length || !lab) return;
    let b=f.querySelector(':scope > .cc-ntip');
    if(!b){
      b=document.createElement('button'); b.type='button'; b.className='cc-ntip'; b.textContent='ⓘ';
      notes.forEach((n, k)=>{ n.classList.add('cc-ntip-body'); if(!n.id) n.id='ccNtip'+i+'_'+k; });
      b.setAttribute('aria-controls', notes.map(n=>n.id).join(' '));
      b.onclick=()=>{ const on=!f.classList.contains('cc-ntip-on'); f.classList.toggle('cc-ntip-on', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); };
      lab.insertAdjacentElement('afterend', b);
      f.classList.add('cc-ntip-f');
    }
    b.setAttribute('aria-expanded', f.classList.contains('cc-ntip-on') ? 'true' : 'false');
    b.setAttribute('aria-label', 'ⓘ '+lab.textContent.trim());
  });
}

function ccSetMode(m){
  /* Вкладка «Свои статы до 99» — тот же новичок, только статы без бюджета (CC.spaFree). */
  const freeTab = m==='free'; if(freeTab) m='rookie';
  if(!!CC.spaFree!==freeTab){ CC.spaFree=freeTab; CC.spa={}; CC.spaAbs={}; }
  // Hold the page still across the swap: the two panels are different heights, and
  // a browser reflowing under you looks like the screen jumped.
  const keep=window.scrollY;
  CC.mode=m; CC.card=null;
  // Every region has a map now, so building a player no longer drags the
  // choice back to Europe — it keeps whichever region is being looked at.
  if(!CC.region) CC.region='EU';
  ccSexRender();
  ccRenderRegions();
  document.getElementById('ccTabRookie').classList.toggle('on', m==='rookie' && !freeTab);
  const tf=document.getElementById('ccTabFree');
  if(tf) tf.classList.toggle('on', freeTab);
  document.getElementById('ccTabCard').classList.toggle('on', m==='card');
  const tc=document.getElementById('ccTabCreator');
  if(tc) tc.classList.toggle('on', m==='creator');
  CC.creator=null;
  const s=document.getElementById('ccSearch');
  s.value='';
  s.placeholder = m==='rookie' ? L().ccSearchCountry
                : m==='creator' ? L().ccSearchCreator : L().ccSearchCard;
  if(m==='rookie'){
    document.getElementById('ccNick').value='';
    document.getElementById('ccAge').value='16';
    ccBornSet(null);
    CC.photo=null;
  }
  // A taken card is somebody: you play as them and you do not rename them. The
  // age is theirs only where the roster knows it - ccPickCard decides that, so
  // switching mode leaves the box open until a card is actually chosen.
  // Именем креатора зовут его самого — как и взятую карточку, его не
  // переименовывают.
  document.getElementById('ccNick').disabled = m==='card' || m==='creator';
  document.getElementById('ccAge').disabled = false;
  ccRenderPhoto();
  ccRenderChips();
  ccRenderList();
  ccSync();
  window.scrollTo(0, keep);
}

// A number input takes any number you type — min and max only bind the spinner
// and native validation, so 87 sits in the field quite happily. The warning
// catches it while you type; this puts it back inside the range the moment you
// leave, so an impossible age can never simply stay there.
// Two digits, digits only. Enforced on the way in rather than left to the field:
// nothing else can end up in there, so every later read is a plain number.
function ccAgeInput(){
  const el=document.getElementById('ccAge');
  const clean=el.value.replace(/[^0-9]/g,'').slice(0,2);
  if(clean!==el.value) el.value=clean;
  ccSync();
}
function ccAgeClamp(){
  const el=document.getElementById('ccAge');
  const v=parseInt(el.value,10);
  el.value = isFinite(v) ? clamp(v, CC_AGE_MIN, CC_AGE_MAX) : 16;
  ccSync();
}
/* Дата рождения, если её ввели.

   Возраст остаётся тем, чем был — числом, которое выбирают, — а дата добавляет
   к нему день. Когда она стоит, возраст из неё и считается: поле с числом
   становится ведомым и запирается, как оно уже запирается у настоящей карточки
   с известным днём рождения (см. ccAgeKnown). Стереть дату — значит вернуть
   число себе.

   Считается на день старта карьеры, а не на сегодняшний: карьера начинается
   5 января 2026-го, и «шестнадцать» должно означать шестнадцать там, а не в
   том году, в котором сидит игрок. */
function ccBornInput(){
  const el=document.getElementById('ccBorn');
  const age=document.getElementById('ccAge');
  const iso=(el && el.value) || '';
  CC.born = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  if(age){
    const a=CC.born ? ccAgeOn(CC.born, careerStartDay()) : null;
    age.readOnly=!!CC.born;
    age.classList.toggle('cc-locked', !!CC.born);
    if(a!=null) age.value=String(a);
    else if(CC.born) age.value='';
  }
  ccSync();
}
/* Что дата может быть, а чего не может: границы те же, что у числа, только
   выраженные днями. Проставляются один раз, при открытии экрана, потому что
   день старта карьеры не двигается. */
/* Поставить дату снаружи — из выбора карточки или из сброса вкладки.

   Одной дверью с ccBornInput, чтобы «дата стоит» и «число ведомое и заперто»
   никогда не разъехались: это одно состояние, а не два. */
function ccBornSet(iso){
  const el=document.getElementById('ccBorn');
  if(el){ el.value=iso||''; el.disabled=false; }
  ccBornInput();
}
function ccBornBounds(){
  const el=document.getElementById('ccBorn');
  if(!el) return;
  const start=careerStartDay();
  const y=Number(start.slice(0,4)), md=start.slice(4);
  el.min=(y-CC_AGE_MAX)+md;
  el.max=(y-CC_AGE_MIN)+md;
}
/* Every region FNCS runs, and which of them a career can start in.

   It was Europe alone, and the reason given was the map: the country picker is
   European, the ping is measured to Frankfurt, and a rookie chooses a country.
   That reason only ever applied to a rookie. A taken card does not choose a
   country - it wears the one on the card - and carries no ping edge at all, so
   there is nothing European about starting as an American card except that the
   code used to say EU in eight places, and it no longer does.

   So: take a card, start anywhere. Build a player, start in Europe, because the
   map you would be choosing from is Europe. The chips say which is which rather
   than going quietly dead. */
const CC_REGIONS=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
/* Every region can be played from now. It used to be Europe only for a built
   player, because the country picker is a map and only Europe had one; the
   other six are in CC_REGION_MAPS. */
// Регионы года: в 2024-м NA West не было (Epic ввёл его в 2025-м) — отзыв: «NAW убери тогда с 24 года».
// NA West: в 2024-м его не было, в 2023-м он жил только до Мейджора 1 и влился в NA Central.
function ccYearRegions(){ return (ccPickedYear()===2024 || ccPickedYear()===2023) ? CC_REGIONS.filter(r=>r!=='NAW') : CC_REGIONS; }
function ccRegionReady(r){ return !!CC_MAP_FOR.hasOwnProperty(r) && ccYearRegions().indexOf(r)>=0; }
function ccRenderRegions(){
  const plate=document.getElementById('ccPingServer');
  if(plate) plate.textContent=L().ccPingServer(ccServerCity(CC.region));
  const box=document.getElementById('ccRegionChips'); if(!box) return;
  const lockR=ccMpLockedRegion();
  // У контент-мейкеров NA одна: двадцать имён — состав Про-Ама в Далласе, и на каком сервере каждый играет, в данных нет.
  // Отдельный чип NA West показывал тот же список, что NA Central.
  if(CC.mode==='creator' && CC.region==='NAW') CC.region='NAC';
  box.innerHTML=ccYearRegions().filter(r=>!(CC.mode==='creator' && r==='NAW')).map(r=>{
    const ready=ccRegionReady(r) && !(lockR && r!==lockR);
    return `<button class="cc-chip${CC.region===r?' on':''}${ready?'':' soon'}" `+
      `${ready?'':'disabled title="'+esc(lockR ? L().ccMpLockedBy : L().ccRegionSoon)+'"'} `+
      `onclick="ccPickRegion(\'${r}\', true)">${regionName(r)}</button>`;
  }).join('');
}
function ccPickRegion(r, byHand){
  if(!ccRegionReady(r)) return;
  if(byHand && CC.mode==='rookie') CC_MAP_OPEN=true;
  if(ccMpLockedRegion() && r!==ccMpLockedRegion()) return;   // регион задан хозяином комнаты
  CC.region=r;
  // A card from the region you just left is not a card in this one, so the pick
  // goes with it and the list is redrawn out of the new region's own people.
  CC.card=null; CC.country=null; CC.photo=null; CC.spa={};
  document.getElementById('ccNick').value='';
  document.getElementById('ccAge').value='16';
  ccRenderRegions();
  /* Чипы дивизиона зависят от региона дважды: сколько их (в Океании три
     ступени, в Европе пять) и какая полоса рейтинга под каждой. Без этой
     строки после смены региона оставались и лишние ступени, и чужие числа. */
  ccRenderChips();
  ccRenderPhoto();
  ccRenderList();
  ccSync();
}
function ccPickRole(k){ CC.role=k; ccRenderChips(); ccSync(); }
/* Значки устройства как в лобби Fortnite: белый силуэт клавиатуры с мышью и геймпада (currentColor). */
function ccInputIcon(k){
  const t=esc(L()['ccInput_'+k]||k);
  if(k==='mob') return '<svg class="cc-inico" viewBox="0 0 32 20" role="img" aria-label="'+t+'"><title>'+t+'</title><rect x="1.5" y="3" width="29" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="12.5" r="2.2" fill="currentColor"/><circle cx="24" cy="8" r="1.4" fill="currentColor"/><circle cx="21" cy="11.5" r="1.4" fill="currentColor"/><rect x="14" y="5" width="4" height="1.4" rx=".7" fill="currentColor"/></svg>';
  return k==='pad'
    ? '<svg class="cc-inico" viewBox="0 0 32 20" role="img" aria-label="'+t+'"><title>'+t+'</title><path fill="currentColor" fill-rule="evenodd" d="M8 3h16c4 0 6.5 3 7.4 8.2l.5 3.2c.4 2.8-1.6 4.6-3.8 4.6-1.6 0-2.6-.9-3.6-2.2l-1.6-2H9.1l-1.6 2c-1 1.3-2 2.2-3.6 2.2-2.2 0-4.2-1.8-3.8-4.6l.5-3.2C1.5 6 4 3 8 3zM8.5 7.6h2v2h2v2h-2v2h-2v-2h-2v-2h2zM21.95 8.3a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0zM24.35 10.6a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0zM19.55 10.6a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0zM21.95 12.9a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0z"/></svg>'
    : '<svg class="cc-inico" viewBox="0 0 34 20" role="img" aria-label="'+t+'"><title>'+t+'</title><rect x="1" y="5" width="22" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><g fill="currentColor"><rect x="3.8" y="7.8" width="2.2" height="2.2"/><rect x="7.6" y="7.8" width="2.2" height="2.2"/><rect x="11.4" y="7.8" width="2.2" height="2.2"/><rect x="15.2" y="7.8" width="2.2" height="2.2"/><rect x="19" y="7.8" width="2.2" height="2.2"/><rect x="3.8" y="11.2" width="2.2" height="2.2"/><rect x="7.6" y="11.2" width="2.2" height="2.2"/><rect x="11.4" y="11.2" width="2.2" height="2.2"/><rect x="15.2" y="11.2" width="2.2" height="2.2"/><rect x="19" y="11.2" width="2.2" height="2.2"/><rect x="7" y="14.6" width="10" height="1.8"/></g><rect x="25.5" y="3" width="7.5" height="15" rx="3.75" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M29.25 3v5.5" stroke="currentColor" stroke-width="1.6"/></svg>';
}
function ccPickInput(k){ CC.input=(k==='pad' || k==='mob') ? k : 'kbm'; ccRenderChips(); ccSync(); }
/* Кто из про-игроков играет на контроллере (ключ ника, hKey) — по проверенным источникам (prosettings.net и др.,
   tools/measured/controller-pros.json); у остальных клавиатура и мышь. */
// 687 игроков, ключ «ник@регион» (тёзки из других регионов не задеты); NA — обе половины. Fortnite Esports Wiki + ProSettings.
const CC_PRO_PAD=new Set(["00mikii@EU","1laika@BR","3jmy@ME","3r8@ME","3zix@ME","74vrk@EU","7lm@ME","7man@ME","abbaski@ME","adesito@EU","adniq@EU","adol@ME","adze@EU","aim@ASIA","aizen@ME","akekzu@EU","akiira@EU","akkk@EU","aknar@EU","aleccrr@OCE","alexcod@EU","alexii@EU","alexrr1x@BR","all piece no aim@NAC","all piece no aim@NAW","alliege@NAC","alliege@NAW","alphakhor@NAC","alphakhor@NAW","alyanz@EU","andyvencha@NAC","andyvencha@NAW","angrybunch@OCE","ansilexx@EU","aonza@EU","aoribtw@NAC","aoribtw@NAW","apollo@NAC","apollo@NAW","aras@EU","ardit@EU","ariana smg@EU","arman@EU","arrow@ME","aryan@EU","asppp@OCE","assault@NAC","assault@NAW","astralsq@EU","aveeva@ME","axeel@EU","axgel@EU","ayarbaffo@EU","aydan@NAC","aydan@NAW","ayjok@NAC","ayjok@NAW","az2m@ME","azek@EU","b1ur@NAC","b1ur@NAW","babayaga@EU","baily@OCE","banz@EU","barney rex@OCE","barrako@ME","benn@OCE","berki@EU","betterr@EU","biltz@ME","bizzyxivi@NAC","bizzyxivi@NAW","blaackfn@ME","blaazeerd@BR","blackie@EU","blade@EU","blankaa@EU","bluii@NAC","bluii@NAW","blzerd@NAC","blzerd@NAW","bobotambe@EU","bouperson@ASIA","bowtheg@EU","bqrbie@OCE","braxle@EU","broseyy@NAC","broseyy@NAW","brownеr@EU","bryzee@EU","btx phantom@NAC","btx phantom@NAW","buildz@NAC","buildz@NAW","buzz@EU","bxldiz@EU","bylah@NAC","bylah@NAW","calmessi10@NAC","calmessi10@NAW","cam@NAC","cam@NAW","can@EU","carrot@EU","carti@NAC","carti@NAW","chacorta@NAC","chacorta@NAW","chacortabtw@NAC","chacortabtw@NAW","chaosgaminglive@NAC","chaosgaminglive@NAW","chentetas@NAC","chentetas@NAW","chimp@NAC","chimp@NAW","chocoluv@ASIA","chrisjey@EU","chriskp@EU","cicciogamer89@EU","clapsy@ME","clasheroonie@NAC","clasheroonie@NAW","claw@NAC","claw@NAW","claww@ME","cloverfnx@NAC","cloverfnx@NAW","clzudz@NAC","clzudz@NAW","cmon@EU","co1azo@NAC","co1azo@NAW","cobiex@NAC","cobiex@NAW","connor@EU","controlfn@EU","convic@NAC","convic@NAW","coop@NAC","coop@NAW","cowjoww@EU","cozy1x@EU","cr1nge@EU","cr4zy@EU","crazyy@EU","crfrmatl@NAC","crfrmatl@NAW","crr4zy@EU","crr@EU","crxsys@EU","curve@NAC","curve@NAW","cvrby@EU","czr@NAC","czr@NAW","daan@EU","dalen@EU","dangdroll@EU","darkiizz@EU","darkpat@EU","darkxz@BR","dashh@NAC","dashh@NAW","deadrise@EU","death@NAC","death@NAW","degaz@EU","denby@EU","deny@OCE","deqzyy@EU","destru@EU","deutsh@NAC","deutsh@NAW","deyy@NAC","deyy@NAW","deyydodger@EU","diablo@EU","didzzz@EU","discard@EU","diztard@NAC","diztard@NAW","dks@EU","dokko@EU","donpapa@EU","dony@EU","doog@EU","dorito@NAC","dorito@NAW","drone@ME","droor@NAC","droor@NAW","drpahks@NAC","drpahks@NAW","duckie ll@NAC","duckie ll@NAW","durr@EU","dxnette@EU","dylzzz@EU","dynamic@NAC","dynamic@NAW","dyox@EU","elder@NAC","elder@NAW","energyfnbr@EU","enzoo8k@EU","enzouzzz@BR","eryx@NAC","eryx@NAW","essitam@EU","estevão@BR","etzo@NAC","etzo@NAW","exityrr@EU","eyedead@EU","f1lck@ME","f3xr@EU","fabiojit@NAC","fabiojit@NAW","fakie@NAC","fakie@NAW","fares@EU","farеs@ME","faxuty@NAC","faxuty@NAW","fay@EU","fecoy@NAC","fecoy@NAW","feehzin@BR","fenix@ME","fhd@ME","fidunboirr@EU","finejupiter@OCE","finn@EU","fishy@BR","flexpito@EU","flood@ME","flubbyy@EU","flxme@EU","flxzy@ME","flystract@EU","fox (italian player)@EU","foxjay@EU","foxman@NAC","foxman@NAW","franni@EU","freestyle@OCE","frelya@ASIA","freshiwnl@EU","frosty@BR","frxzifyx@EU","furiouss@ME","fusionz@NAC","fusionz@NAW","fylix@EU","fynn@EU","fzn@EU","gabe@NAC","gabe@NAW","gabix@EU","gabrish@EU","gejo@EU","gemai@EU","geny@EU","geo@NAC","geo@NAW","gerlaenco@EU","ghooslty@NAC","ghooslty@NAW","ghxxstay@BR","gianniz@EU","gibproo@EU","gino@EU","globa@EU","gmoney@NAC","gmoney@NAW","gntl@ME","gordete@EU","gordetee@EU","greek freak 7@OCE","griff@EU","grxy@NAC","grxy@NAW","gumon@BR","haledy@NAC","haledy@NAW","hardfind@EU","havre@EU","havе@EU","hedra@EU","henry@EU","hilly@EU","hisashi@BR","hound@NAC","hound@NAW","hssey@OCE","hugo@EU","huguex@EU","hyrax@EU","ialeex@EU","iineymar@ME","impumpz@EU","innocents@NAC","innocents@NAW","intrepid@EU","itzm7mdfn@ME","ivan@EU","jackyrr@EU","jacobbb@NAC","jacobbb@NAW","jae@EU","jaemon@ASIA","jafarr@EU","jamalali@EU","jammy@NAC","jammy@NAW","jamz@EU","janmannk@NAC","janmannk@NAW","jarvis@EU","jaus@NAC","jaus@NAW","jehrz@NAC","jehrz@NAW","jenks@EU","jeren@NAC","jeren@NAW","jinkundesu@ASIA","jit ter@NAC","jit ter@NAW","jkreet@ME","jmo@ME","joanee2k@EU","joe (na player)@NAC","joe (na player)@NAW","joeluk@EU","joexzy@NAC","joexzy@NAW","johku@EU","jokzz@EU","jomsr@OCE","joqqy@OCE","joreph@NAC","joreph@NAW","josue@BR","jxness7@BR","kaan@EU","kaande@EU","kacpixon@EU","kaidon@EU","kairuv2@ME","kakqin@OCE","kamo@EU","kana@ASIA","karax@EU","kayd@EU","kazie@EU","kc1rt@BR","kenjiwyd@EU","kero@ME","keyaan@EU","khangamerx@ME","kian@EU","kickz@NAC","kickz@NAW","kikoo@EU","kimkana@ASIA","kingaling@NAC","kingaling@NAW","kingz@EU","kirbty@NAC","kirbty@NAW","kiriszn@EU","klazyy@ME","klixey@NAC","klixey@NAW","klvztt@BR","knifer@EU","knogi@EU","koenfn@EU","kogane@ASIA","kortex@NAC","kortex@NAW","koukk@OCE","krimnl@OCE","krom@EU","kromatik@EU","kruttgutt@EU","kruyor@NAC","kruyor@NAW","kurama@EU","kurzanx@EU","kutt@NAC","kutt@NAW","kyal@OCE","kyziqx@EU","laiys@NAC","laiys@NAW","laizen@EU","lardl@ME","later@EU","launcher@EU","len@EU","leoks@EU","letshe@EU","lezzy@EU","lim0@EU","liwshe@EU","llobeti4@EU","loganzz@EU","loloo@EU","lolsaucy@NAC","lolsaucy@NAW","lorii@EU","lova@EU","lucien@EU","luisao@EU","luisitopixixi@EU","lukas (eu player)@EU","lyiix@EU","m1lo@EU","m2bk@ME","m7eyy@ME","mafioso@EU","magl@EU","malkawi@ME","maniac@NAC","maniac@NAW","manik@EU","mansour@ME","mansoureyy@ME","marco@EU","marcowhale1x@ME","martins (br player)@BR","marv@EU","mata@EU","matnight@EU","mattbszn@EU","mattranks@NAC","mattranks@NAW","maxgg@NAC","maxgg@NAW","mcberry@OCE","mefoo@NAC","mefoo@NAW","merfind@EU","mero@NAC","mero@NAW","mert@EU","mestree@EU","mezz@EU","mikey@NAC","mikey@NAW","minipiyo@ASIA","minori@EU","mitei@BR","modisk@ME","mohammedsr4@EU","moneymaker@EU","monа@EU","moon@EU","moussa@OCE","moxie@NAC","moxie@NAW","mshary@ME","mts@EU","muhq@EU","mustazico@EU","mvxrr@BR","mxciej@EU","n4оh@ME","n7@ME","nacharrio@EU","nafri@EU","napo@EU","natan@EU","nathan@NAC","nathan@NAW","nawqa@EU","nax@EU","nayroz@EU","naysu@EU","nayzer@EU","nazgul@EU","nbxfv@ME","nejiz@EU","nero@EU","neu@EU","neudtee@EU","nevado@EU","nevify@NAC","nevify@NAW","newton@EU","neymar@ME","nezak@EU","niasen@EU","niivzy@EU","niki (eu player)@EU","nipsy@EU","nizer@EU","nizo@ME","noa@EU","noahjr10@EU","noizy@NAC","noizy@NAW","nomis@EU","nomzz@EU","noobieplayer@EU","noulish@NAC","noulish@NAW","noxyhty@ASIA","nuwzh@EU","nxndolol@BR","nxthan@EU","nxtures@OCE","obito@EU","okis@NAC","okis@NAW","oltsu@EU","opt@EU","optszn@NAC","optszn@NAW","orbix@EU","outpld@EU","over@EU","owl@NAC","owl@NAW","papito@EU","parca@EU","parxc@NAC","parxc@NAW","patehk@NAC","patehk@NAW","patto@EU","pepoclip@ASIA","peppe@EU","perceval@EU","phyenix@EU","pietriin@BR","pila@EU","piontka@EU","pipbot@NAC","pipbot@NAW","pirozz@EU","pixovsky@EU","playify@NAC","playify@NAW","pluto@EU","plzzxnano@NAC","plzzxnano@NAW","prayy@EU","premfn@NAC","premfn@NAW","pretty@NAC","pretty@NAW","pro@ME","problem@NAC","problem@NAW","prodigyy@BR","puma@ME","purav@OCE","pvkz@NAC","pvkz@NAW","pxmp@NAC","pxmp@NAW","qb@EU","qeezy@EU","qhvst@OCE","qisi@ME","rabbit@ASIA","rainzz@EU","raizoo@ME","rakic@ME","rambo@EU","raregg@EU","raxqs@EU","rayxne@EU","razorx@NAC","razorx@NAW","react1x@NAC","react1x@NAW","redz@EU","reet@NAC","reet@NAW","reevers@EU","reez@EU","regs@NAC","regs@NAW","rehan@NAC","rehan@NAW","reinerz@ASIA","remixxx@EU","resypical@NAC","resypical@NAW","revised@NAC","revised@NAW","ricky@EU","rico@EU","ricy@EU","rifty@EU","riney@EU","rino@ME","rintaroudazo@ASIA","riquelme@BR","rise@EU","robott@BR","rockega@EU","rodeybros@NAC","rodeybros@NAW","rohunfn@NAC","rohunfn@NAW","roker@EU","ronnityy@EU","rooklol7@ME","rottentwinkies@NAC","rottentwinkies@NAW","rubanssx@EU","rubbx@EU","rupapad@ASIA","rushh@NAC","rushh@NAW","rusteryy@EU","rxlphy@NAC","rxlphy@NAW","rxman@EU","rxnny@EU","ryaic@NAC","ryaic@NAW","ryptidz@NAC","ryptidz@NAW","ryzeuh@EU","ryzon@EU","s0vzy@NAC","s0vzy@NAW","salt 22@ME","sami@ME","samkob@NAC","samkob@NAW","samux@EU","santi@EU","sanxzy@EU","sat@ME","scaryy@EU","schock@OCE","sciacqua@EU","scolleh@EU","scoped@NAC","scoped@NAW","scopexd@EU","sent@EU","sevenjosh@EU","sgaus@EU","shadox@EU","shadyy@NAC","shadyy@NAW","shiro@EU","shiwi@EU","shotty (br player)@BR","sigma3x@NAC","sigma3x@NAW","sinklol@ASIA","sirious@EU","skxyper ay@EU","skyjump@EU","slacss@NAC","slacss@NAW","slayyer1x@ME","sleezy@EU","slicehyper@EU","slurp@EU","snoopywyd@ME","spade@NAC","spade@NAW","spect@NAC","spect@NAW","spexx@EU","splasheyy@EU","squish@NAC","squish@NAW","sqyroo@EU","sr3@NAC","sr3@NAW","stakken@EU","stampz@NAC","stampz@NAW","star@ME","stefxm@BR","stiffaroonie@NAC","stiffaroonie@NAW","storms@NAC","storms@NAW","stormy@EU","stormy@NAC","stormy@NAW","stranger@ME","sulaiman@ME","sway@NAC","sway@NAW","swelucas@EU","swexey@NAC","swexey@NAW","swifty@EU","swiftylol@ME","swiiight@EU","swzzy@EU","sxdia@EU","sxxmii@EU","syaaz@EU","synrr@NAC","synrr@NAW","sythic@ME","t0ahh@EU","t3eny@EU","taintsy@EU","talls@BR","tauruz@ME","tawerkaxl@EU","tcevasive@EU","tchikito@EU","tcin@EU","teaguey@EU","technique@EU","teichifishy@EU","tekkers@ME","tequilaeater@NAC","tequilaeater@NAW","teyzen@EU","tiiger24@EU","tilt@NAC","tilt@NAW","timmme@EU","tkay@NAC","tkay@NAW","tofranks@BR","tokl@ME","tombik@EU","tooslowforyou@EU","totot@ASIA","trabzon@EU","trapped@OCE","trece@EU","troxzer@EU","tryhardd@EU","tweop@EU","twexy@NAC","twexy@NAW","twunti@NAC","twunti@NAW","twx@ME","tyrer74@EU","uckee@EU","uiabstrakt@NAC","uiabstrakt@NAW","umplify@EU","unknown@NAC","unknown@NAW","vainly@EU","vayz@NAC","vayz@NAW","vazzy@EU","vblazified@EU","vbqtify@NAC","vbqtify@NAW","velokyd@EU","veloyd@EU","veri@EU","vert@NAC","vert@NAW","vexifire@NAC","vexifire@NAW","vick@EU","viosk@EU","vipex@EU","vizual@EU","vohade@NAC","vohade@NAW","vortexia@EU","vosloww@EU","vovo@EU","vtera@ME","vxttor@BR","vyper@EU","watts (scottish player)@EU","wavyjacob@NAC","wavyjacob@NAW","weezle@NAC","weezle@NAW","wolfiez@EU","wolfiizz@ME","wqzzi@ME","xarcy@EU","xayrez@NAC","xayrez@NAW","xcon@OCE","xeve@EU","xeyler@ASIA","xha3o0@ME","xjam@ME","xjiuo@EU","xpert@ME","yaer@EU","yama@ASIA","yasir@NAC","yasir@NAW","yayouu@EU","yoda@EU","yonder@EU","yoosaltyy@NAC","yoosaltyy@NAW","yucky@ASIA","yuden@EU","yukii@EU","yuqii@EU","yzy@EU","zaf@EU","zangi@EU","zaxi@EU","zeerox@EU","zeldriss@EU","zelobud@OCE","zewfie@NAC","zewfie@NAW","zexfishy@EU","zhan@EU","zhy@NAC","zhy@NAW","zhаys@EU","zicti@NAC","zicti@NAW","ziggy@NAC","ziggy@NAW","zilo (european player)@EU","zmax@EU","zocian@EU","zohan@EU","zooxy@EU","zoshy@EU","zqcca@EU","zxmbie@ME","zxn@ME","zynox@EU","zypher@EU","zyra@OCE","zyvk@EU","авe@NAC","авe@NAW"]);
function ccProInput(card){ return card && CC_PRO_PAD.has(hKey(card)+'@'+(card.region||'')) ? 'pad' : 'kbm'; }
// Устройство карьеры: своё — выбранное при создании; взятая карточка — по данным; старый сейв — клавиатура.
function ccInputOf(pl){ return (pl && (pl.input==='pad' || pl.input==='kbm' || pl.input==='mob')) ? pl.input : 'kbm'; }
// Без прибавки за пинг и возраст: рейтинг своего игрока — ровно собранный (Notion «18.10»).
function ccPickEdge(off){ CC.noEdge=!!off; ccRenderChips(); if(typeof ccRenderCard==='function') ccRenderCard(); ccSync(); }
/* Прибавки нет: выключена переключателем — или это «Свои статы до 99» (CC.spaFree), там её нет всегда
   (его слово 18.10: «отключи эти +10, где игрок сам выбирает статы»). */
function ccNoEdgeNow(){ return !!(CC && (CC.noEdge || CC.spaFree)); }
// Прибавка у игрока карьеры выключена (pl.noEdge с экрана создания).
function ccEdgeOff(pl){ return !!(pl && pl.noEdge); }
/* СЕЗОН СТАРТА (18.10, тестер: «может в карьере дать выбор по сезонам ещё, а не по годам»). Сезоны года —
   те же снимки сцены, по которым карьера и так живёт (ccSnapshotNow); выбранный не первый пишется в сейв
   как cr.startFrom, и первый день карьеры — первая игровая неделя с этой даты (careerStartDay). Рейтинги
   сезона — ccRatingSnap. Командная карьера и гонка начинают год с начала: день у всех один. */
const CC_SEASON_LABEL={h1:'Season 9', g5:'OG · Season 5', g6:'OG · Season 6', g7:'OG · Season 7', h3:'Season X', h4:'C2S1', i0:'C2S1', i1:'C2S2', i3:'C2S4',
  j1:'C2S5', j2:'C2S6', j3:'C2S7', j4:'C2S8', k1:'C3S1', k2:'C3S2', k3:'C3S3',
  e1:'Major 1', e2:'Major 2', e3:'Major 3', f1:'Major 1', f2:'Major 2', f3:'Major 3',
  t1:'Major 1', t2:'Major 2', t3:'Major 3', m1:'Major 1', m2:'Major 2',
  s40:'Season 40 · Major 1', s41:'Season 41 · Major 2', s42:'Season 42 · FNCS Solos', s43:'Season 43 · Treasure Hunters', og:'Season OG', remix:'Chapter 2 Remix', sw:'Galactic Battle (Star Wars)', simpsons:'The Simpsons'};
const CC_SEASON_SUB={m1:'S39', s40:'S40', s41:'S41', s42:'S42', s43:'One Piece', og:'OG', remix:'Remix', sw:'Star Wars', simpsons:'Simpsons', e1:'C4S1', e2:'C4S2', e3:'C4S3', f1:'C5S1', f2:'C5S2', f3:'C5S3', t1:'C6S1', t2:'C6S2', t3:'C6S3'};
// Особые сезоны Epic — своей кнопкой старта на плитке года: OG и Remix (годы продлены до 30.11, ccYearTo) и
// Star Wars (Galactic Battle, C6, 2.05–6.06.2025: FNCS Showdown 4–6, Console Victory Cup, оценки).
// snap — снимок рейтинга того времени; без него рейтинг — итог года (ccRatingSnap на экране создания отдаёт null).
/* 2026 — по сезонам Fortnite, как карточки (Major 1 = S40, Major 2 = S41, Solos = S42), а не M1/M2: год идёт
   с S39 (снимок m1), дальше старт с первого дня S40/S41/S42/S43. Снимок m2 остаётся для составов (плей-ин 18.07),
   но своей кнопкой не показывается: его сезон S41 начинается 6 июня. */
const CC_START_EXTRA={2023:[{tag:'og', from:'2023-11-03'}], 2024:[{tag:'remix', from:'2024-11-02'}],
  2025:[{tag:'sw', from:'2025-05-02', snap:'t2'}, {tag:'simpsons', from:'2025-11-01'}],
  2026:[{tag:'s40', from:'2026-03-19', snap:'m1'}, {tag:'s41', from:'2026-06-06', snap:'m1'}, {tag:'s42', from:'2026-08-21', snap:'m2'}, {tag:'s43', from:'2026-11-01', snap:'m2'}]};
const CC_START_HIDE={2026:['m2']};
// Сначала сезоны Мейджоров, потом особые (OG, Remix, Star Wars). У 2026-го все кнопки — сезоны, поэтому по датам.
function ccStartSeasonsOf(y){
  const list=(CC_SNAPS_BY_YEAR()[y] || []).filter(s=>!(CC_START_HIDE[y] || []).includes(s.tag)).concat(CC_START_EXTRA[y] || []);
  return CC_START_HIDE[y] ? list.sort((a, b)=>String(a.from).localeCompare(String(b.from))) : list;
}
function ccStartSeasons(){ return ccStartSeasonsOf(ccPickedYear()); }
function ccStartSeasonAllowed(){ return !ccMpLockedYear() && !(typeof CC_MP_NEW!=='undefined' && CC_MP_NEW); }
function ccPickedStart(){
  const list=ccStartSeasons();
  if(!ccStartSeasonAllowed() || !CC.startTag) return null;
  const i=list.findIndex(s=>s.tag===CC.startTag);
  return i>0 ? list[i] : null;
}
// Короткая подпись кнопки на плитке: C5S1, Major 1 → M1, Season X → SX.
function ccSeasonShort(tag){ return CC_SEASON_SUB[tag] || String(CC_SEASON_LABEL[tag]||tag).replace(/^Major /, 'M').replace(/^Season /, 'S'); }
function ccPickStartSeason(tag){
  CC.startTag=tag;
  // Рейтинги в списке карточек — того сезона (ccRatingSnap на экране создания): взятая карточка — заново.
  if(CC.mode==='card'){ CC.card=null; if(typeof ccRenderList==='function') ccRenderList(); }
  ccRenderChips(); if(typeof ccRenderCard==='function') ccRenderCard(); ccSync();
}
function ccPickYearSeason(y, tag){
  if(ccMpLockedYear() && y!==ccMpLockedYear()) return;
  if((CC.year||2026)!==y) ccPickYear(y);
  ccPickStartSeason(tag);
}
// Сезон не выбрать (командная карьера, гонка) — выбор сбрасывается на начало года.
function ccRenderSeasonChips(){ if(!ccStartSeasonAllowed() || ccStartSeasons().length<2) CC.startTag=null; }
function ccPickDiv(d){ CC.div=d; ccRenderChips(); ccSync(); }
function ccPickDiff(id){ CC.diff=id; ccRenderChips(); ccSync(); }
// Год карьеры: 2026 (дуо, потом трио) или 2025 (трио, три Мейджора, Лион). См. ccCalYear.
// Год, выбранный чипом: 2024, 2025 или 2026 (сейв без чипа — 2026).
function ccPickedYear(){ return (CC && ccPastYear(CC.year)) ? CC.year : 2026; }
function ccPickYear(y){
  if(ccMpLockedYear() && y!==ccMpLockedYear()) return;   // год задан хозяином комнаты
  CC.year=ccPastYear(y) ? y : 2026;
  CC.startTag=null;   // сезон старта — свой у каждого года, со сменой года снова первый
  // NA West в 2024-м нет: выбранный — в NA Central, тем же путём, что кнопка.
  if(CC.region && ccYearRegions().indexOf(CC.region)<0){ ccPickRegion('NAC'); ccRenderChips(); ccRenderCard(); ccSync(); return; }
  ccRenderRegions();
  // Карточка, взятая в другом году, — уже не та карточка: список и превью собираются заново.
  if(CC.mode==='card'){ CC.card=null; if(typeof ccRenderList==='function') ccRenderList(); }
  ccRenderChips(); ccRenderCard(); ccSync();
}

// Role belongs to the card — it is read off the attributes and cannot be argued
// with. Division is a choice either way. A taken card starts wherever you put it,
// so you can drop vic0 into Division 5 and walk over it, or take a 60 into
// Division 1 and find out what that feels like.
function ccRenderChips(){
  const card = CC.mode==='card' ? CC.card : null;
  const lockRole = card ? attrsFor(card).roleKey : null;
  document.getElementById('ccRoleChips').innerHTML=['roleIGL','roleFRG'].map(k=>{
    const on=(lockRole||CC.role)===k;
    return `<button class="cc-chip${on?' on':''}" ${card?'disabled':''} `+
      `onclick="ccPickRole(\'${k}\')">${L()[k]}</button>`;
  }).join('');
  { const ic=document.getElementById('ccInputChips'), lockIn=card ? ccProInput(card) : null;
    if(ic) ic.innerHTML=['kbm','pad','mob'].map(k=>`<button class="cc-chip${(lockIn||CC.input||'kbm')===k?' on':''}" ${card?'disabled':''} `+
      `onclick="ccPickInput(\'${k}\')">${ccInputIcon(k)}</button>`).join(''); }
  /* Год без дивизионов (ccNoDivisions) оставляет эти чипы на месте, но зовёт
     их своим именем: лестницы в 2024-м нет, а вопрос «с чего ты начинаешь»
     есть — ccDivNote и так отвечал «Дивизион задаёт стартовый рейтинг». Само
     число в сейв не уходит: карьера такого года живёт без ступени вовсе
     (careerNewCareer пишет division 1), и полоса остаётся только стартом. */
  const noDiv=ccNoDivisions();
  const divLab=document.querySelector('#ccDivField label');
  if(divLab) divLab.textContent=noDiv ? L().ccStartOvr : L().ccDivision;
  const divNote=document.querySelector('#ccDivField .cc-note');
  if(divNote) divNote.textContent=noDiv ? L().ccStartOvrNote : L().ccDivNote;
  /* Ступеней столько, сколько их в выбранном регионе: в Океании нет ни
     четвёртого дивизиона, ни пятого. Выбор, оставшийся за краем (сменили
     регион с Европы на Азию), съезжает на нижнюю ступень. */
  const divN=ccDivCount(CC.region);
  if((CC.div||1)>divN) CC.div=divN;
  /* Года без дивизионов (2019–2022, 2024) выбора ступени не показывают вовсе: лестницы нет —
     нет и вопроса. Новичок стартует с нижней ступени, как по умолчанию. */
  const divField=document.getElementById('ccDivField');
  if(divField) divField.style.display=noDiv ? 'none' : '';
  if(noDiv && !card) CC.div=divN;
  const divList=[]; for(let d=1; d<=divN; d++) divList.push(d);
  document.getElementById('ccDivChips').innerHTML=divList.map(d=>{
    const on=CC.div===d;
    return `<button class="cc-chip${on?' on':''}" `+
      `onclick="ccPickDiv(${d})">${d}<small>${card?'':ccBand(d, CC.region)}</small></button>`;
  }).join('');
  // The chip says what it does: a number under a name, the way the divisions
  // carry their band. Easy is the mode as it has always played.
  const ychips=document.getElementById('ccYearChips');
  if(ychips){
    const lockY=ccMpLockedYear();
    /* Международка года — та, ради которой сезон и играется. Имена городов
       одинаковы на всех языках, поэтому строкой словаря не идут. */
    /* Арт — тот же файл, которым сезон подписан на лендинге (MODE_ART):
       2026 ключевой арт года, 2025 его Мейджор 1, 2024 остров Мейджора 1. */
    const YEAR_LOOK={2026:{lan:'Antwerp',    art:'art/fncs-2026.jpg'},
                     2025:{lan:'Lyon',       art:'art/mode-major1-2025.jpg'},
                     2024:{lan:'Fort Worth', art:'art/fncs-2024.jpg'},
                     // 2023 и 2022 — ключевые арты Epic своего года (новости fortnite.com: FNCS 2023, FNCS C3S1).
                     2023:{lan:'Copenhagen', art:'art/fncs-2023.jpg'},
                     2022:{lan:'Raleigh', art:'art/fncs-2022.jpg'},
                     // 2021 — онлайн, ключевой арт FNCS C2S5 (fortnite.com).
                     2021:{lan:'Online', art:'art/fncs-2021.jpg'},
                     // 2019 — ключевой арт Fortnite World Cup (fortnite.com).
                     2019:{lan:'New York', art:'art/fncs-2019.jpg'},
                     // 2020 — онлайн, арт FNCS C2S3 (fortnite.com).
                     2020:{lan:'Online', art:'art/fncs-2020.jpg'}};
    ychips.innerHTML=[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map(y=>{
      const on=(CC.year||2026)===y;
      const off=lockY && y!==lockY;
      const look=YEAR_LOOK[y]||{lan:''};
      // Сезоны года — кнопками на самой плитке (18.10): нажатие выбирает и год, и сезон.
      const ss=ccStartSeasonAllowed() ? ccStartSeasonsOf(y) : [];
      const curS=on ? (ccPickedStart()||ss[0]||{}).tag : null;
      // Кнопки сезонов — рядом с плиткой в общей обёртке, а не внутри неё: кнопка в кнопке не везде нажимается.
      const sHTML=ss.length>1 ? `<div class="cc-yt-seasons${on?' on':''}">${ss.map(s=>`<button type="button" class="cc-yt-s${s.tag===curS?' on':''}" `+
        `title="${esc((CC_SEASON_LABEL[s.tag]||s.tag)+' · '+ccHdrDate(s.from))}" onclick="ccPickYearSeason(${y},'${s.tag}')">${esc(ccSeasonShort(s.tag))}</button>`).join('')}</div>` : '';
      return `<div class="cc-yt-wrap" style="--sn:${ss.length>1 ? ss.length : 0}"><button class="cc-chip cc-year-tile${on?' on':''}${off?' soon':''}" style="--yr-art:url(${look.art})" ${off?'disabled title="'+esc(L().ccMpLockedBy)+'"':''} onclick="ccPickYear(${y})"><b>${y}</b><small>${L()['ccYear'+y]}</small><i>${look.lan}</i></button>${sHTML}</div>`;
    }).join('');
    const yn=document.getElementById('ccYearNote');
    if(yn) yn.textContent=(lockY ? L().ccMpLockedBy+' · ' : '')+L()['ccYearNote'+(CC.year||2026)]+
      (ccStartSeasonAllowed() && ccStartSeasons().length>1 ? ' '+L().ccStartSeasonNote : '');
  }
  ccRenderSeasonChips();
  const ef=document.getElementById('ccEdgeField'), ech=document.getElementById('ccEdgeChips');
  // В «Своих статах до 99» прибавки нет без выбора — переключатель только у обычного новичка.
  if(ef) ef.style.display=(CC.mode==='rookie' && !CC.spaFree) ? '' : 'none';
  if(ech) ech.innerHTML=[[false, L().ccEdgeOn], [true, L().ccEdgeOff]].map(([v, t])=>
    `<button class="cc-chip${!!CC.noEdge===v?' on':''}" onclick="ccPickEdge(${v})">${t}</button>`).join('');
  const dchips=document.getElementById('ccDiffChips');
  if(dchips) dchips.innerHTML=CC_DIFFS.map(d=>{
    const on=(CC.diff||'easy')===d.id;
    // Сложность в цветах редкостей Fortnite: синяя, фиолетовая, золотая, мифическая; названия прежние (его слово 29.09).
    return `<button class="cc-chip cc-rar cc-rar-${d.id}${on?' on':''}" title="${esc(L().ccDiffSpeed(d.age.toFixed(2))+(d.room ? ' · '+L().ccDiffRoomUp(d.room) : ''))}" `+
      `onclick="ccPickDiff(\'${d.id}\')">${L()['ccDiff'+d.id.charAt(0).toUpperCase()+d.id.slice(1)]}`+
      // Подпись короткая (рост ×N, у Мифической ещё +сила соперников), полная - в подсказке.
      `<small>×${d.age.toFixed(2)}${d.room ? ' · +'+d.room : ''}</small></button>`;
  }).join('');
}

/* В каком регионе играет креатор. Пул сгруппирован по сценам, и это ЕДИНСТВЕННОЕ,
   что про его регион известно наверняка. СНГ отдельным регионом в Фортнайте не
   существует — эти люди играют в европейском, поэтому CIS сводится к EU. */
/* Свой регион у креаторов Азии, Океании и Ближнего Востока (28.10, его «nac и naw одинаковые, когда кликаешь, и asia oce me»).
   Для Про-Ама они по-прежнему одна корзина (CC_PROAM_CREATORS_ASIA), а на экране выбора и в карьере — каждый в своём
   регионе по стране из инфобокса Liquipedia: Япония — Азия, Австралия — Океания, Саудовская Аравия — Ближний Восток.
   Winter — по комментарию у CC_PROAM_CREATORS_ASIA, Океания. */
const CC_CREATOR_HOME_APAC={ASIA:['Neckokun','Hamuppi','Nephrite','Shinck'],
  OCE:['AussieAntics','Chanzes','LazarBeam','Loserfruit','Overstrand','Winter','Worthy'],
  ME:['Boter','IMonkey D','Rudex']};
function ccCreatorRegion(name){
  const k=hKey(name);
  for(const reg of CC_PROAM_REGION_ORDER){
    if((CC_PROAM_CREATORS_BY_REGION[reg]||[]).some(n=>hKey(n)===k)){
      if(reg==='ASIA') return ['OCE','ME'].find(r=>CC_CREATOR_HOME_APAC[r].some(n=>hKey(n)===k)) || 'ASIA';
      return reg==='CIS' ? 'EU' : reg;
    }
  }
  return 'EU';
}
function ccPickCreator(name){
  if(ccProAmCreators().indexOf(name)<0) return;
  CC.creator=name; CC.card=null;
  // Регион — тот, в котором этот человек и правда играет; чипы остаются живыми,
  // это подсказка, а не замок (так же ведёт себя дивизион у взятой карточки).
  CC.region=ccCreatorRegion(name);
  CC.photo=null;
  document.getElementById('ccNick').value=name;
  CC.div=ccDivisionFor(CC_PROAM_CREATOR_OVR);
  ccRenderRegions();
  ccRenderChips();
  ccRenderList();
  ccSync();
}
// Карточка креатора для превью и для старта: рейтинг один на всех, редкость
// своя (см. shownRarity), аудитория настоящая.
function ccCreatorCard(name){
  const f=ccProAmFollowers(name), tw=ccProAmTwitch(name);
  return {handle:name, nick:name, nat:null, region:ccCreatorRegion(name), org:null,
          tier:'ladder', event:L().ccCreatorEvent, placement:null,
          rating:CC_PROAM_CREATOR_OVR, _targetOvr:CC_PROAM_CREATOR_OVR,
          _attrs:ccRookieAttrs(CC_PROAM_CREATOR_OVR, CC.role||'roleIGL'),
          // Лицо — с его канала: карьера за живого стримера играется его
          // портретом, а не инициалами. См. CC_PROAM_AVA.
          _photo:ccProAmAvatar(name),
          creator:true, tw:tw?tw[0]:null, followers:f};
}
function ccRenderCard(){
  const box=document.getElementById('ccCardBox'); if(!box) return;
  let card = CC.mode==='card' ? CC.card
           : CC.mode==='creator' ? (CC.creator ? ccCreatorCard(CC.creator) : null)
           : (CC.country ? ccMakePlayer() : null);
  if(CC.mode==='card' && card){
    // A taken card previews as the person it is. The ping is shown because the
    // career really will play on that connection, but it is worth nothing here
    // — the edges belong to a player who was built. See careerCard.
    const ms=CC.country ? ccPingOf(CC.country, CC.region) : null;
    card={...card, _pingEdge:0, _ageEdge:0, _pingMs:ms,
          _age:parseInt(document.getElementById('ccAge').value, 10)};
  }
  // The record under the card, for a taken one. A built player has no record -
  // that is the whole of what starting from nothing means.
  box.innerHTML = card ? futCardHTML(card) : `<div class="cc-empty">${L().ccCardEmpty}</div>`;
}

// The nationality on a card is a Russian country name; FLAG_CODE already knows
// how to turn one into an ISO code, which is the same key the ping table uses.
function ccCodeForNat(nat){ return FLAG_CODE[nat]||null; }
/* Где про живёт, когда это не страна его флага. Его список, 23 августа:
   «вот россияне которые живут в Сербии — NeFrizi, Malibuca, Panzer, Swizzy —
   чтоб дом был Сербия». Флаг и паспорт остаются российскими (NATIONALITY не
   трогается), а дом взятой карточки — «Живёт», пинг, аренда — сербский:
   правило панели переезда всегда говорило «взятая карточка живёт там, где
   живёт настоящий человек», просто дом читался по флагу. */
const CC_PRO_HOME={malibuca:'rs', swizzy:'rs', panzer:'rs', nefrizi:'rs'};
function ccProHomeOf(handle){ return CC_PRO_HOME[String(handle||'').toLowerCase()]||null; }

function ccRenderList(){
  try{ ccMapState(); }catch(e){}
  const q=(document.getElementById('ccSearch').value||'').trim().toLowerCase();
  const grid=document.getElementById('ccGrid'), cards=document.getElementById('ccCards');
  const plate=document.getElementById('ccPingPlate');
  if(plate) plate.style.display = CC.mode==='rookie' ? '' : 'none';
  // Очки прокачки — только построенному, и раздаются только здесь.
  const spf=document.getElementById('ccSpField');
  if(spf){ spf.style.display = CC.mode==='rookie' ? '' : 'none'; ccSpaRender(); }
  /* Контент-мейкеры — тот же список карточек, только собранный из живых людей
     с Twitch, а не из ростера сцены. Рейтинг у всех один (CC_PROAM_CREATOR_OVR),
     потому что играют они примерно одинаково; отличает их аудитория, поэтому
     под ником стоит она, а не клуб. */
  if(CC.mode==='creator'){
    grid.style.display='none'; cards.style.display='';
    /* Правка: «регионы не работают у контент-креаторов — жму, и там всех
       показывает; пусть от большего к меньшему по фолловерам». Список — только корзина
       выбранного региона (чип, а не регион старой карьеры), по фолловерам вниз. */
    // СНГ играет в Европе (ccCreatorRegion сводит CIS к EU) — европейский чип показывает и их.
    const all=(CC_PROAM_CREATORS_BY_REGION[CC.region||'EU']||[]).concat((CC.region||'EU')==='EU' ? (CC_PROAM_CREATORS_BY_REGION.CIS||[]) : [])
      .filter(n=>!CC_CREATOR_HOME_APAC[CC.region] || ccCreatorRegion(n)===CC.region)
      .filter(n=>ccProAmFollowers(n)>0)   // без подтверждённого канала Twitch не показываем (28.10, его «убери контент-мейкеров, у которых канал не подтверждён»)
      .filter((n,i,arr)=>arr.findIndex(x=>hKey(x)===hKey(n))===i)
      .sort((a,b)=>ccProAmFollowers(b)-ccProAmFollowers(a))
      .filter(n=>!q || n.toLowerCase().includes(q));
    cards.innerHTML = all.length ? all.map(n=>{
      const f=ccProAmFollowers(n), reg=ccCreatorRegion(n);
      const on = CC.creator===n ? ' on' : '';
      // Лицо канала — там же, где у карточек ростера портрет. См. CC_PROAM_AVA.
      const ava=ccProAmAvatar(n);
      return `<button class="cc-card cc-card-cre${on}" onclick="ccPickCreator('${jsq(n)}')">
        ${ava ? `<img class="cc-card-ph" src="${ava}" alt="" loading="lazy" onerror="this.remove()">`
              : `<span class="cc-card-ph"></span>`}
        <span class="cc-card-in">
          <span class="cc-card-n">${esc(n)}</span>
          <span class="cc-card-o">${esc(regionName(reg))}</span>
          ${ccCreatorMediaHTML(n) || `<span class="cc-card-mate">${L().ccCreatorNoTw}</span>`}
        </span>
        <span class="cc-card-r">${CC_PROAM_CREATOR_OVR}</span></button>`;
    }).join('') : `<div class="cc-note">${L().ccNoCards}</div>`;
    return;
  }
  if(CC.mode==='rookie'){
    cards.style.display='none'; grid.style.display='';
    const reg=CC.region||'EU';
    // The shapes are a separate file now. Say so and come back when it lands.
    if(!ccMapsReady(function(){ ccRenderList(); })){
      grid.dataset.reg=''; grid.innerHTML='<div class="cc-note">'+L().ccMapLoading+'</div>';
      return;
    }
    if(!grid.querySelector('.cc-map') || grid.dataset.lang!==LANG || grid.dataset.reg!==reg){
      grid.dataset.lang=LANG; grid.dataset.reg=reg;
      grid.innerHTML=ccBuildMap(null, reg);
    }
    ccPaintMap();
    return;
  }
  grid.style.display='none'; cards.style.display='';
  // Only cards whose country has a ping on the map can be taken: the career
  // runs out of Europe, and every division table we have is European.
  //
  // And only as they stand now: the newest 2026 card per person, the same
  // roster the career plays against. This used to walk the whole history —
  // one card per handle, whichever came first — and the user read the result
  // off the screen: Vico and Setty at 99 (peak cards from older seasons),
  // Kiryache who last played in 2021, and S1neD at the meme 101. A career
  // starts as somebody is, not as they once were.
  /* Берётся вся сцена региона, без фильтра по пингу.
     Пинг важен только созданному игроку, который выбирает страну. У взятой карточки своя страна и бонуса за пинг нет (_pingEdge:0, ccRegionReady).
     С фильтром из Европы в NA Central оставалось 34 из 601, в Бразилии 15 из 631, в Азии 21 из 538, без Peterbot и Clix.
     Страна тоже не обязательна: у 146 европейцев её в данных нет. */
  const list=[];
  careerRosterNowEU().forEach(p=>{
    list.push({p, code:ccCodeForNat(p.nat), ovr:p._ovr, mate:ccMateNow(p)});
  });
  list.sort((a,b)=>b.ovr-a.ovr);
  /* Вся сцена, а не первые двести двадцать.
     Потолок стоял ещё с тех пор, когда список был поиском по всей истории и
     упирался в тысячи карточек. Сейчас в нём одна карточка на человека за этот
     год, и потолок режет по живому: в дивизионе 1 Европы 346 человек, в окно
     помещался 171, за бортом оставалось 175 — включая тех, кто играл Плей-Ин.
     Его сообщение, 21 августа: «почему не все див 1 игроки и которые были в
     playin в выборе игроков». */
  const shown=list.filter(x=>!q || x.p.handle.toLowerCase().includes(q));
  cards.innerHTML = shown.length ? shown.map(x=>{
    const url=photoURL(x.p);
    const on = CC.card && CC.card.handle===x.p.handle ? ' on' : '';
    return `<button class="cc-card${on}" onclick="ccPickCard('${jsq(x.p.handle)}')">
      ${url?`<img class="cc-card-ph" src="${url}" alt="">`:`<span class="cc-card-ph"></span>`}
      <span class="cc-card-in">
        <span class="cc-card-n">${cardFlag(x.p,13)}${esc(x.p.handle)}<span class="cc-card-in-ico" title="${esc(L()['ccInput_'+ccProInput(x.p)]||'')}">${ccInputIcon(ccProInput(x.p))}</span>${ccTraitTag(x.p.handle)}</span>
        <span class="cc-card-o">${x.p.org ? esc(x.p.org) : L().ccFreeAgent}</span>
        ${x.mate ? `<span class="cc-card-mate">${L().ccMateNow(esc(x.mate))}</span>` : ''}
        ${ccProMediaHTML(x.p)}
      </span>
      <span class="cc-card-r">${x.ovr}</span></button>`;
  }).join('') : `<div class="cc-note">${L().ccNoCards}</div>`;
}

/* С кем этот человек играет сейчас.

   Правка: в поиске игрока рядом с рейтингом должно стоять и
   то, кто у него сейчас тиммейт. Выбирая, кем играть, ты выбираешь и состав,
   а список показывал только клуб и число.

   Берётся с САМОЙ карточки, а не из общей таблицы дуо: в наборах 137 ников
   заняты дважды, и таблица по голому нику отдала бы европейцу напарника его
   тёзки из другой сцены (см. tools/check-nat-namesakes.js). Карточка одна и
   принадлежит одному человеку.

   Стадия берётся самая глубокая из тех, что на карточке: гранд-финал говорит
   про состав вернее, чем плей-ин, — до финала доходят с тем, с кем играют. */
const CC_MATE_STAGE={Gf:6, Final:6, DivFinal:5, Lcq:4,
                     Heat4:3, Heat3:3, Heat2:3, Heat1:3, Playin:2, Open:1};
function ccMateNow(card){
  if(!card) return null;
  /* Состав — по всем картам человека за год и в размере сезона: в 2025-м это трио
     («не пишет в трио вот это» — скриншот: у Pollo стояло «Now with
     Peterbot», а он в трио с Peterbot и Acorn). Самая новая карта года (Лион) записей
     состава не несёт — читаются карты стадий. */
  const seats=(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create' && typeof CC!=='undefined' && CC)
    ? (ccYearRosterSize(CC.year)-1) : careerMateSeats();   // 2024 — дуо, как 2026
  const real=ccRealMatesOf(card, seats);
  if(real.length) return real.map(m=>m.handle).join(', ');
  let best=null, rank=-1;
  rosterEntriesOf(card).forEach(function(e){
    const r=CC_MATE_STAGE[e.stage]!=null ? CC_MATE_STAGE[e.stage] : 0;
    if(r<=rank) return;
    const other=(e.entry.duo||[]).filter(h=>hKey(h)!==hKey(card));
    if(!other.length) return;
    rank=r; best=other;
  });
  // В трио их двое — тогда через запятую, потому что это и есть состав.
  return best ? best.join(', ') : null;
}
function ccPickCountry(code){ CC.country=code; CC_MAP_OPEN=false; ccRenderList(); ccSync(); }
let CC_MAP_OPEN=false;
function ccMapState(){
  const p=document.getElementById('ccMapPanel'); if(!p) return;
  const on=CC.mode==='rookie';
  p.classList.toggle('cc-compact', on && !CC_MAP_OPEN);
  p.classList.toggle('cc-float', on && CC_MAP_OPEN);
  const scr=document.getElementById('screen-career-create'); if(scr) scr.classList.toggle('cc-mapopen', on && CC_MAP_OPEN);
  const b=document.getElementById('ccMapBtn'); if(!b) return;
  const T=L();
  b.innerHTML=CC.country
    ? ccFlagImgs(ccFlagEmoji(CC.country))+'<b>'+esc(ccCountryName(CC.country))+'</b><span>'+esc(T.ccMapChange||'')+'</span>'
    : '<b>'+esc(T.ccPickCountry||'')+'</b><span>'+esc(T.ccMapOpen||'')+'</span>';
}
function ccMapOpen(){ CC_MAP_OPEN=true; ccRenderList(); }
function ccMapClose(){ CC_MAP_OPEN=false; ccMapState(); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && CC_MAP_OPEN){ ccMapClose(); } });
/* СВОИ СТАТЫ НА СОЗДАНИИ (его просьба 29.09: «чтоб игрок мог себе сам статы, которые хочет
   поставить»). Было: десять очков по +0.5 к стату, только вверх. Стало: шесть строк «− число +»
   — любой стат можно опустить и отдать в другой, плюс небольшой запас сверху.

   Бюджет — в очках, цена «+1» у стата пропорциональна его весу в общем рейтинге (ATTR_W × 50:
   стрельба 11, выносливость и выживание по 10, опыт 5, клатч 6, стабильность 8). Поэтому
   переложить опыт в стрельбу — не бесплатный рост рейтинга: минус опыта возвращает 5, плюс
   стрельбы стоит 11. Запас CC_SP_START = 50 очков — это +1 к общему рейтингу, как и прежние
   десять очков по +0.5 (их среднее — +0.8…+1.1). Каждый стат — в пределах ±CC_SP_SPAN от
   шаблона роли и 35…99. CC.spa хранит сдвиг каждого стата (может быть отрицательным). */
/* 29.10 (его «поинтов распределения 50, мб просто дать 5 и всё»): пять очков, «+1» любому стату — одно очко, опущенный
   стат возвращает одно. Коридор ±5 к стату: при цене 1 и коридоре ±20 перекладка опыта в стрельбу давала до +3 к рейтингу,
   так — около +1,5, как прежние +1 с весами. */
const CC_SP_START=5, CC_SP_SPAN=5;
function ccSpaCost(k){ return 1; }
function ccSpaLeft(){
  const a=CC.spa||{};
  return CC_SP_START - ATTR_KEYS.reduce((s,k)=>s+(a[k]||0)*ccSpaCost(k), 0);
}
// Шаблон роли на текущей полосе — от него отсчитываются сдвиги (то же, что строит ccMakePlayer).
function ccSpaBase(){ return ccRookieAttrs(ccBand(CC.div, CC.region), CC.role); }
/* Без ограничений (его слово 29.09: «прям дать доступ, чтоб мог сделать игрок сразу 99 99 99
   99 99 99»). Переключатель CC.spaFree: бюджета и коридора ±20 нет, любой стат 35…99 — кнопками,
   числом в поле или «Все 99». Общий рейтинг считается из статов как обычно, то есть 99 везде —
   это 99 общего. По умолчанию выключено: обычная раздача с бюджетом остаётся. */
/* Во вкладке статы хранятся ЗНАЧЕНИЯМИ (CC.spaAbs), а не сдвигом от шаблона роли: смена
   дивизиона или роли их не двигает. После каждой правки дивизион встаёт по рейтингу
   (ccDivisionFor, как у взятой карточки): 99-му напарников ищут в Дивизионе 1, где живут
   настоящие 90+, — ниже потолок дивизиона (ccDivCeil) держит поиск около 60 (его вопрос 29.09
   «почему я 99 не могу тимейта найти по уровню»). Чип дивизиона можно сменить руками. */
function ccSpaFreeVal(k){ const a=CC.spaAbs||{}; return a[k]!=null ? a[k] : ccSpaBase()[k]; }
function ccSpaFreeDiv(){
  const a={}; ATTR_KEYS.forEach(k=>{ a[k]=ccSpaFreeVal(k); });
  const ovr=Math.round(ATTR_KEYS.reduce((s,k)=>s+a[k]*ATTR_W[k], 0));
  const d=ccNoDivisions() ? CC.div : ccDivisionFor(ovr);
  if(d!==CC.div){ CC.div=d; ccRenderChips(); }
}
function ccSpaSet(k, val){
  CC.spaAbs=CC.spaAbs||{}; CC.spaAbs[k]=clamp(Math.round(+val||0), 35, 99);
  ccSpaFreeDiv(); ccSpaRender(); ccSync();
}
function ccSpaAll(val){ CC.spaAbs={}; ATTR_KEYS.forEach(k=>{ CC.spaAbs[k]=clamp(val,35,99); }); ccSpaFreeDiv(); ccSpaRender(); ccSync(); }
function ccSpaAdd(k, d){
  if(CC.spaFree){ ccSpaSet(k, ccSpaFreeVal(k)+d); return; }
  CC.spa=CC.spa||{};
  const v=(CC.spa[k]||0)+d, base=ccSpaBase()[k];
  if(base+v<35 || base+v>99) return;
  if(!CC.spaFree && Math.abs(v)>CC_SP_SPAN) return;
  if(!CC.spaFree && d>0 && ccSpaLeft()<ccSpaCost(k)) return;
  CC.spa[k]=v;
  ccSpaRender();
  // Сдвиг ложится в карточку сразу: превью строится через ccMakePlayer, а тот
  // прогоняет статы сквозь ccSpaApply — клик виден на овере в ту же секунду.
  ccSync();
}
function ccSpaReset(){ CC.spa={}; CC.spaAbs={}; if(CC.spaFree) ccSpaFreeDiv(); ccSpaRender(); ccSync(); }
/* Сдвиги, вложенные в статы; овер и лучший стат пересчитаны. Одна арифметика на превью
   (ccMakePlayer) и на старт (ccStart) — карточка на экране и в сейве одним числом. */
function ccSpaApply(attrs){
  const a=CC.spa||{}, abs=CC.spaFree ? (CC.spaAbs||{}) : {};
  ATTR_KEYS.forEach(k=>{ if(abs[k]!=null) attrs[k]=abs[k]; else if(a[k]) attrs[k]=clamp(attrs[k]+a[k], 35, 99); });
  attrs.ovr=Math.round(ATTR_KEYS.reduce((s,k)=>s+attrs[k]*ATTR_W[k], 0));
  attrs.bestAttr=bestPlayAttr(attrs);
  return attrs.ovr;
}
function ccSpaRender(){
  const rows=document.getElementById('ccSpRows');
  if(!rows) return;
  CC.spa=CC.spa||{};
  const free=!!CC.spaFree, left=ccSpaLeft(), base=ccSpaBase(), T=L();
  const hint=document.querySelector('#ccSpField .cc-spa-note span');
  if(hint) hint.textContent = free ? T.ccSpFreeHint : T.ccSpCreateHint;
  const any=ATTR_KEYS.some(k=>CC.spa[k]) || (free && Object.keys(CC.spaAbs||{}).length>0);
  const head=free
    ? `<button type="button" class="cc-spa-reset" onclick="ccSpaAll(99)">${T.ccSpAll99}</button>`
    : `<em>${T.ccSpLeft} <b>${left}</b></em>`;
  rows.innerHTML=`<div class="cc-spa-head">${head}${any ? ` <button type="button" class="cc-spa-reset" onclick="ccSpaReset()">${T.ccSpReset}</button>` : ''}</div>
    <div class="cc-spa-grid">${ATTR_KEYS.map(k=>{
      const v=free ? ccSpaFreeVal(k) : clamp(base[k]+(CC.spa[k]||0), 35, 99), n=v-base[k], cost=ccSpaCost(k);
      // Полное название стата (его Notion 29.10: «мб полные названия сделать, место же хватает»); нет — сокращение.
      const K=k.charAt(0).toUpperCase()+k.slice(1), name=T['attr'+K+'Full'] || T['attr'+K];
      const canUp=v<99 && (free || (n<CC_SP_SPAN && left>=cost)), canDown=v>35 && (free || n>-CC_SP_SPAN);
      const val=free
        ? `<input class="cc-spa-in" type="number" inputmode="numeric" min="35" max="99" value="${v}" onchange="ccSpaSet('${k}',this.value)" aria-label="${name}">`
        : `<b class="cc-spa-val">${v}</b>`;
      return `<div class="cc-spa-row${n>0?' up':n<0?' down':''}">
        <span class="cc-spa-name">${name}</span>
        <button type="button" class="cc-spa-btn" onclick="ccSpaAdd('${k}',-1)"${canDown?'':' disabled'} aria-label="−1 ${name}">−</button>
        ${val}
        <button type="button" class="cc-spa-btn" onclick="ccSpaAdd('${k}',1)"${canUp?'':' disabled'} aria-label="+1 ${name}">+</button>
        <span class="cc-spa-cost"></span>
      </div>`;
    }).join('')}</div>`;
}

function ccPickCard(handle){
  const p=careerRosterNowEU().find(x=>x.handle===handle);
  if(!p) return;
  CC.card=p;
  CC.country=ccProHomeOf(p.handle) || ccCodeForNat(p.nat);
  CC.photo=null;
  // A suggestion, not a lock — the chips stay live.
  CC.div=ccCardStartDiv(p);
  document.getElementById('ccNick').value=p.handle;
  /* Their age, not the default sixteen.

     Sixteen is the right answer for a player who is being made up and the wrong
     one for somebody who exists: the screen was offering to start a career as
     Th0masHD, born in 2002, and printing 16 in the box next to his photograph.
     Worked out on the day the career would begin, from the table of real
     birthdays, and left at sixteen for the cards nobody has looked up.

     The field goes read-only with it, for the same reason the nickname does: you
     play as them, you do not decide how old they are. */
  const born=ccBornOf(p.handle);
  const real=born ? ccAgeOn(born, careerStartDay()) : null;
  const box=document.getElementById('ccAge');
  box.value = real!=null ? String(real) : '16';
  /* And where nobody knows, you decide.

     The table is eighty-one names out of nine hundred, because most of this
     roster has no public date of birth anywhere - it reaches down to whoever
     played one Reload Open. Locking those cards at sixteen would be inventing
     the same fact the table refuses to invent, only worse: silently, and always
     the same number.

     So a card the roster has a birthday for arrives with it and the box is
     theirs, not yours; a card nobody has written up arrives at sixteen with the
     box open, and the age is a thing you chose about a person you chose. */
  box.disabled = real!=null;
  /* И день рождения карточки виден там же, где его вводят себе.

     Он у неё уже есть — CC_BORN, восемьдесят один настоящий день, — и именно
     из него посчитано число в соседнем поле. Показать его честнее, чем прятать:
     иначе экран пишет «настоящая дата рождения» и не показывает какая. Поле
     закрыто по той же причине, что и число: это факт о человеке, а не выбор. */
  ccBornSet(real!=null ? born : null);
  const bornBox=document.getElementById('ccBorn');
  if(bornBox) bornBox.disabled = real!=null || !!p.handle;
  // Пол взятой карточки — не выбор. См. ccSexPick.
  CC.sex='m';
  ccSexRender();
  ccRenderPhoto();
  ccRenderChips();
  ccRenderList();
  ccSync();
}

function ccPickPhoto(){ document.getElementById('ccPhotoInput').click(); }
/* Portrait is downscaled before it goes into the save. A phone photo as a data
   URL is several MB, bigger than the whole localStorage quota, so the write threw
   QuotaExceededError and the career silently stopped saving. Long edge down to
   CC_PHOTO_MAX, re-encoded as JPEG on a canvas (CSS sizing would not change what
   is stored). If the canvas fails (format, tainted), keep the original. */
const CC_PHOTO_MAX=320, CC_PHOTO_Q=0.85;
function ccPhotoShrink(dataUrl, then){
  const img=new Image();
  img.onload=function(){
    try{
      const w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
      if(!(w>0 && h>0)) return then(dataUrl);
      const k=Math.min(1, CC_PHOTO_MAX/Math.max(w, h));
      const c=document.createElement('canvas');
      c.width=Math.max(1, Math.round(w*k)); c.height=Math.max(1, Math.round(h*k));
      const ctx=c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const out=c.toDataURL('image/jpeg', CC_PHOTO_Q);
      then(out && out.length<dataUrl.length ? out : dataUrl);
    }catch(e){ then(dataUrl); }
  };
  img.onerror=function(){ then(dataUrl); };
  img.src=dataUrl;
}
function ccPhotoChosen(input){
  const f=input.files && input.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ ccPhotoShrink(String(r.result||''), function(url){
    CC.photo=url; ccRenderPhoto(); }); };
  r.readAsDataURL(f);
  input.value='';
}
function ccRenderPhoto(){
  const el=document.getElementById('ccPhoto');
  const url = CC.photo || (CC.card ? photoURL(CC.card) : null);
  el.innerHTML = url ? `<img src="${url}" alt="">` : `<span>${L().ccPhotoHint}</span>`;
}

const CC_AGE_MIN=13, CC_AGE_MAX=50;
/* Что дают возраст и страна — словами, прямо у выбора (вместо строк PNG/AGE на карточке).
   Только построенному: взятой карточке и креатору прибавок нет (см. ccStart). */
function ccGainNotes(){
  const T=L(), built=CC.mode==='rookie' && !ccNoEdgeNow();
  const ag=document.getElementById('ccAgeGain'), pg=document.getElementById('ccPingGain');
  if(ag){
    const age=parseInt((document.getElementById('ccAge')||{}).value,10);
    const e=isFinite(age) ? ccAgeEdge(age) : 0;
    ag.style.display=built ? '' : 'none';
    ag.innerHTML=T.ccAgeGain(isFinite(age)?age:'-', (e>0?'+':'')+e, CC_AGE_EDGE, CC_AGE_PEAK, CC_AGE_FADE);
  }
  if(pg){
    pg.style.display=built ? '' : 'none';
    const ms=CC.country ? ccPingOf(CC.country, CC.region) : null;
    pg.innerHTML=CC.country && ms!=null
      ? T.ccPingGain2(esc(ccCountryName(CC.country)||CC.country), ms, '+'+ccPingEdge(ms), CC_PING_EDGE, CC_PING_FREE, CC_PING_MAX)
      : T.ccPingGainNone(CC_PING_EDGE, CC_PING_FREE, CC_PING_MAX);
  }
}
function ccSync(){
  ccGainNotes();
  const nick=(document.getElementById('ccNick').value||'').trim();
  const age=parseInt(document.getElementById('ccAge').value,10);
  const warn=document.getElementById('ccAgeWarn');
  if(warn){
    const bad = !isFinite(age) ? L().ccAgeEmpty
      // split/join, not replace: the too-old line names the limit twice and a
      // string replace would only fill the first one in.
      : age<CC_AGE_MIN ? L().ccAgeTooYoung.split('{N}').join(CC_AGE_MIN)
      : age>CC_AGE_MAX ? L().ccAgeTooOld.split('{N}').join(CC_AGE_MAX) : '';
    /* A locked box needs a reason and an open one on a real card needs one more:
       the player is about to choose a fact about somebody who exists, and should
       know that is what they are doing. */
    /* У креатора возраст тоже не выдуман: дат рождения у стримеров мод не
       держит, поэтому здесь та же строка, что у карточки без известной даты —
       «решаешь ты». */
    const note = bad ? bad
      : CC.mode==='creator' ? (CC.creator ? L().ccAgeUnknown : '')
      : CC.mode!=='card' || !CC.card ? ''
      : ccBornOf(CC.card.handle) ? L().ccAgeKnown
      : L().ccAgeUnknown;
    warn.textContent=note;
    warn.style.display = note ? 'block' : 'none';
    warn.classList.toggle('cc-warn-soft', !bad && !!note);
    document.getElementById('ccAge').classList.toggle('bad', !!bad);
  }
  /* Пинг меряется до сервера своего региона, а не всегда до европейского.
     ccPingOf принимает регион с тех пор, как играть стало можно из всех семи;
     эти вызовы про регион забыли, поэтому у американца пинг выходил null —
     и на экране стояло «null ms», а в сейве пустое поле. Всплыло, когда
     список выбора перестал прятать неевропейцев. */
  const ping=CC.country?ccPingOf(CC.country, CC.region):null;
  const ok = CC.mode==='creator'
    ? (!!CC.creator && age>=CC_AGE_MIN && age<=CC_AGE_MAX)
    : (nick.length>=2 && age>=CC_AGE_MIN && age<=CC_AGE_MAX && CC.country
       && (CC.mode==='rookie' || CC.card));
  document.getElementById('ccStart').disabled=!ok;
  const out=document.getElementById('ccReadout');
  ccRenderCard();
  /* Креатору страну не выбирают: он существует, страна у него своя, а прибавки
     за пинг у него нет — та же логика, что у взятой карточки. Строка под
     карточкой говорит про его аудиторию, потому что это и есть его отличие. */
  if(CC.mode==='creator'){
    const f=CC.creator ? ccProAmFollowers(CC.creator) : 0;
    out.innerHTML = CC.creator
      ? `<span><em>${L().ccRoRegion||''}</em>${esc(regionName(CC.region||'EU'))}</span>`+
        `<span><em>${L().xFollowers}</em>${f?ccNum(f):'-'}</span>`
      : `<span>${L().ccPickCreator}</span>`;
    return;
  }
  if(!CC.country){
    /* Взятая карточка без страны (у части игроков прошлых лет флага нет ни в одном источнике):
       карта стран в режиме карточек скрыта, и старт вставал намертво. Страну выбирают здесь. */
    if(CC.card){
      const opts=ccCountriesHere(CC.region).map(x=>`<option value="${esc(x.c)}">${esc(ccCountryName(x.c)||x.c)}</option>`).join('');
      out.innerHTML=`<span>${L().ccPickCountry}</span><select class="cc-country-sel" onchange="ccPickCountry(this.value)">`+
        `<option value="">-</option>${opts}</select>`;
      return;
    }
    out.innerHTML=`<span>${L().ccPickCountry}</span>`; return;
  }
  // What the two are worth, said before the career starts — and they are worth
  // nothing to a taken card, so the readout promises nothing there either.
  const built=CC.mode==='rookie' && !ccNoEdgeNow();
  const pingEdge=built?ccPingEdge(ping):0, ageEdge=built?ccAgeEdge(age):0;
  const plus=v=>(v>0?'+':'')+(Math.round(v*10)/10);
  out.innerHTML =
    `<span><em>${L().ccRoCountry}</em><img src="flags/w20/${ccCountryOf(CC.country)}.png" alt="" `+
      `style="width:18px;vertical-align:-2px;border-radius:2px;margin-right:6px;">${ccCountryName(CC.country)}</span>`+
    /* Пинг — только когда он измерен.
       У взятой карточки он не измерен и не может быть: она носит страну, а
       карта своего региона местами размечена не странами, а штатами — до «США»
       из таблицы NA Central расстояния нет. Прибавка за пинг у такой карточки и
       так ноль (см. строку выше), так что строка обещала бы «null ms» и ничего
       больше. У созданного игрока, который страну выбирает, всё как было. */
    (ping!=null
      ? `<span><em>${L().ccRoPing}</em>${ping} ms${pingEdge?` <b class="cc-ro-plus">${plus(pingEdge)}</b>`:''}</span>`
      : '')+
    `<span><em>${L().ccAge}</em>${isFinite(age)?age:'-'}${ageEdge?` <b class="cc-ro-plus${ageEdge<0?' bad':''}">${plus(ageEdge)}</b>`:''}</span>`+
    `<span><em>${L().ccRoRole}</em>${L()[CC.card?attrsFor(CC.card).roleKey:CC.role]}</span>`+
    // Taking a card takes their duo with it — said here, before the start.
    (CC.card ? (()=>{ const m=ccRealMateOf(CC.card);
      return m ? `<span><em>${L().ccRoDuo}</em>${esc(m.handle)} (${m._ovr})</span>` : ''; })() : '')+
    // Год без дивизионов ступени не показывает. См. ccNoDivisions.
    (ccNoDivisions() ? '' : `<span><em>${L().ccRoDiv}</em>${CC.div}</span>`);
  /* Рейтинга здесь больше нет, и это правка.

     Строка печатала attrsFor(card).ovr — базу, — а на лице карточки в
     полуметре выше стоит shownOvr, то есть та же база плюс прибавки за пинг и
     возраст. Одна карточка, два числа, и меньшее из них подписано словом
     «Рейтинг». У созданного игрока было ещё хуже: там стояла полоса дивизиона,
     то есть вообще не его число.

     Карточка своё число показывает сама и объясняет его подсказкой
     (cardOvrFull). Второму рядом сказать нечего. */
}

// The person a taken card actually plays with: the duo written on the card's
// own roster entries — the newest 2026 card, so the pairing is this season's —
// resolved to that partner's own newest card. Null when the card records no
// whole duo, and the auto-assignment then does what it always did.
/* Все, с кем карточка записана в составе — до seats человек. Дуо-запись даёт
   одного, трио-запись (наборы 2025-го) — двоих: отзыв, «когда в
   2025 выбираешь игрока, он без триоса сразу, не как в дуо». */
/* Карты человека по нику — индекс, а не PLAYERS.filter на каждый вызов.
   Отзыв: «лагает когда переключаю регионы в 2024 году». Замер: список
   Европы 2024-го — 1063 строки, ccMateNow на каждую → 1.2 с; в 2025/2026 та же секунда.
   Пересобирается, если ростер вырос (карты добавляются на старте страницы). */
let CC_CARDS_BY_KEY=null, CC_CARDS_BY_KEY_N=0;
function ccCardsByKey(){
  if(CC_CARDS_BY_KEY && CC_CARDS_BY_KEY_N===PLAYERS.length) return CC_CARDS_BY_KEY;
  const m=new Map();
  PLAYERS.forEach(p=>{ const k=hKey(p); const a=m.get(k); if(a) a.push(p); else m.set(k, [p]); });
  CC_CARDS_BY_KEY=m; CC_CARDS_BY_KEY_N=PLAYERS.length;
  return m;
}
// И сцена по нику — тем же индексом, пока массив сцены тот же.
const CC_NOW_BY_KEY=new WeakMap();
function ccNowByKey(roster){
  let m=CC_NOW_BY_KEY.get(roster);
  if(!m){ m=new Map(); roster.forEach(p=>{ const k=hKey(p); if(!m.has(k)) m.set(k, p); }); CC_NOW_BY_KEY.set(roster, m); }
  return m;
}
function ccRealMatesOf(card, seats){
  if(!card) return [];
  const me=hKey(card), out=[], seen=new Set([me]);
  const want=Math.max(1, seats||1);
  /* Записи состава лежат на карточках стадий (плей-ин, LCQ, финал — _t1/_m1…), а самая
     свежая карточка года может быть без них (Лион 2025 — отдельная карта). Поэтому
     смотрим все карточки этого человека за тот же год, от новейшего набора к старому. */
  const order=c=>({t3:3, t2:2, t1:1, m2:2, m1:1, f3:3, f2:2, f1:1}[String(c.cardSet||'')] || 0);
  const yr=ccCardYear(card);
  const mine=(ccCardsByKey().get(me)||[]).filter(p=>p!==card && (p.region||'')===(card.region||'') && ccCardYear(p)===yr)
    .sort((a,b)=>order(b)-order(a));
  const entries=[]; [card].concat(mine).forEach(c=>rosterEntriesOf(c).forEach(e=>entries.push(e)));
  const now=ccNowByKey(careerRosterNowEU());
  for(const {stage, entry} of entries){
    if(stage==='DivFinal') continue;
    if(entry.duo.length!==want+1) continue;
    entry.duo.map(h=>hKey(h)).forEach(k=>{
      if(seen.has(k) || out.length>=want) return;
      const mate=now.get(k);
      if(mate){ seen.add(k); out.push(mate); }
    });
    if(out.length>=want) break;
  }
  return out;
}
function ccRealMateOf(card){
  if(!card) return null;
  const me=hKey(card);
  for(const {stage, entry} of rosterEntriesOf(card)){
    /* Кроме финалов недель. Один вечер вместе — это не постоянное дуо: люди
       собираются на неделю и расходятся, и в дивизионе их четыре подряд. Когда
       они здесь считались, каждый в дивизионе 1 читался занятым, свободных не
       оставалось ни одного, и режим не мог посадить напарника вообще никому —
       кнопки «играть» не было. Сезон человека задаёт Мейджор, по нему и дуо. */
    if(stage==='DivFinal') continue;
    if(entry.duo.length!==2) continue;
    const other=entry.duo.map(h=>hKey(h)).find(k=>k!==me);
    if(!other) continue;
    const mate=careerRosterNowEU().find(p=>hKey(p)===other);
    if(mate) return mate;
  }
  return null;
}

// Where a taken card would naturally sit — the same bands the rookie table uses,
// read backwards. It is only a suggestion now: in card mode you may start
// anywhere, so a 92 can go down to Division 5 and walk over it.
/* Настоящий Дивизион 1 в 2026-м у тех, кого рейтинг ставит ниже: списков Д1 у Epic в открытом доступе нет,
   только топ-50 еженедельных финалов. Здесь люди, про которых это известно. */
const CC_REAL_D1_2026={'BR|jerok':1};
function ccCardStartDiv(p){
  if(ccPickedYear()===2026 && CC_REAL_D1_2026[p.region+'|'+String(p.handle||'').toLowerCase()]) return 1;
  return ccDivisionFor(attrsFor(p).ovr);
}
function ccDivisionFor(ovr){
  if(ovr>=ccBand(1)) return 1;
  if(ovr>=ccBand(2)) return 2;
  if(ovr>=ccBand(3)) return 3;
  if(ovr>=ccBand(4)) return 4;
  return 5;
}

function ccStart(){
  // A taken card keeps its name whatever the field holds.
  const nick=CC.mode==='card' && CC.card ? CC.card.handle
           : CC.mode==='creator' && CC.creator ? CC.creator
           : (document.getElementById('ccNick').value||'').trim();
  /* КАРЬЕРА ЗА КОНТЕНТ-МЕЙКЕРА (правка).

     Это не третий вид новичка, а третий вид ЛИЧНОСТИ: человек существует, его
     не переименовывают и ему не дарят статы — рейтинг у всех креаторов один и
     тот же (CC_PROAM_CREATOR_OVR), как и в Про-Аме. Прибавок за страну и
     возраст нет по той же причине, что и у взятой карточки.

     Аудитория переезжает НАСТОЯЩАЯ: подписчики Twitch — это снятое с самого
     Twitch число, а известность в сцене считается той же долей, которой мод уже
     меряет чужую аудиторию на коллабе (CC_PROAM_REACH_SHARE). Отсюда и выходит
     честная расстановка: у крупнейших каналов старт вдвое выше дивизиона 1,
     у маленьких — почти с нуля, и до приглашения на Про-Ам им ещё расти. */
  const creator = CC.mode==='creator' && CC.creator ? CC.creator : null;
  const age=parseInt(document.getElementById('ccAge').value,10);
  const ping=ccPingOf(CC.country, CC.region);
  const card=CC.card;
  let ovr = card ? attrsFor(card).ovr : creator ? CC_PROAM_CREATOR_OVR : ccBand(CC.div, CC.region);
  /* Ступень, на которой карьера СТОИТ, — не всегда та полоса, с которой она
     начинается. Год без дивизионов (ccNoDivisions) стоит на верху лестницы,
     которой нет: сцена целиком, настоящие имена, настоящие напарники. Полоса
     при этом сделала своё дело строкой выше — она задала стартовый рейтинг. */
  const startDiv = ccNoDivisions() ? 1 : CC.div;
  const role = card ? attrsFor(card).roleKey : CC.role;
  const attrs = card ? null : ccRookieAttrs(ovr, role);
  /* Статы, выставленные на этом экране, ложатся в сейв прямо сейчас — один раз и
     навсегда. Та же ccSpaApply, что красила превью, — сейв не может разойтись с экраном. */
  // Очки прокачки — только построенному: настоящему человеку статы не дарят.
  if(!card && !creator) ovr=ccSpaApply(attrs);
  const save={
    v:1,
    player:{
      nick, age, source:CC.mode,
      // Бинды построек HUD: стена, пол, лестница, конус (поле на экране создания, пустое — подсказка).
      binds: ccBindsRead(),
      // Пол: выбор построенного, факт взятого. См. ccSexPick.
      sex: (card || creator) ? 'm' : (CC.sex||'m'),
      // Флаг личности: по нему карточка красится в Exotic (см. shownRarity) и
      // по нему же видно, что это карьера за живого стримера.
      creator: !!creator,
      // Stored as zero for a taken card, so the save says the same thing the
      // screen did. careerCard decides this again on every read, off source
      // and handle, so an old save cannot keep an edge this rule withdrew.
      /* A state is picked for its connection and nothing else — his rule,
         20 August. Clicking California sets the milliseconds California has and
         leaves the player American: the country on the card, the flag beside the
         nickname, the rent and the passport are the United States, because a
         state is not a country and the mode has nowhere to put one. */
      country:ccCountryOf(CC.country), countryPing:ping,
      /* День рождения, если его ввели. Возраст рядом остаётся тем, чем был —
         числом, — а день превращает его в дату, на которую сцена умеет
         отвечать: см. careerBirthdays и ccPlayerAge. Пусто у всех, кто его не
         вводил, и у каждого старого сейва, и это ничего не меняет. */
      born: CC.born || null,
      closeRangeEdge: (card || creator || ccNoEdgeNow()) ? 0 : ccPingEdge(ping),
      // Прибавка за пинг и возраст выключена на экране создания — и на всю карьеру (ccEdgeOff).
      noEdge: (!card && !creator && ccNoEdgeNow()) ? true : undefined,
      // The region the career competes in. A rookie's is always Europe - the
      // country map is - and a taken card's is whichever one it was taken from.
      region: CC.region||'EU', ovr, role, attrs,
      input: card ? ccProInput(card) : ((CC.input==='pad' || CC.input==='mob') ? CC.input : 'kbm'),
      // «Свои статы до 99»: выставленное — нижний предел, ниже результаты статы не опускают
      // (его скрин 29.09: «я везде выбирал 99» — через пару вечеров стало 98.6). См. ccAttrFloor.
      attrsFloor: (!card && !creator && CC.spaFree && attrs) ? ATTR_KEYS.reduce((o,k)=>(o[k]=attrs[k], o), {}) : undefined,
      ageEdge: (card || creator || ccNoEdgeNow()) ? 0 : ccAgeEdge(age),
      // Where this career is from, which is what rent is measured against. A
      // career that starts in NA Central is not renting NA Central. See ccRentNow.
      homeRegion: CC.region||'EU',
      photo: CC.photo || null,
      // A taken card is stored by identity, not by copy, so the roster stays
      // the single source of truth for its attributes.
      handle: card?card.handle:null, cardRegion: card?card.region:null, nat: card?card.nat:null
    },
    // A career starts in the duo year; the trio one is season two. See
    // careerSquadSize for why the shape is written down rather than derived.
    career:{season:1, size:(ccYearRosterSize(CC.year)), year:ccPickedYear(), year0:ccPickedYear(),
            diff:(CC.diff||'easy'), day:null,
            // Сезон старта внутри года (ccPickedStart): первый день — с него, см. careerStartDay.
            startFrom:(ccPickedStart()||{}).from || undefined,
            // Год без лестницы заводится на её верху: соперники, имена и
            // напарники — сцена целиком, как в Дивизионе 1. См. ccNoDivisions.
            // Чип при этом остаётся стартовым рейтингом и в ovr уже учтён.
            division: startDiv,
            // A career that starts in Division 1 starts known: that room is
            // 300 people the scene watches, and nobody is in it unread.
            // Известность — по выбранной полосе, а не по ступени без лестницы:
            // новичок 2024-го начинается никем, как начинался бы в пятой.
            reach: creator ? Math.round((ccCreatorSocialAt(creator, ccPickedYear())[0]||0)*CC_PROAM_REACH_SHARE)
                  : Math.max(ccProSocialStart(card)[2]||0, CC.div===1 ? CC_REACH_D1 : 0),   // про 2026 — его настоящие подписчики X
            // Подписчики Twitch у креатора — настоящие, снятые с самого Twitch; в прошлом году — числа того года (ccCreatorSocialAt).
            twitch: creator ? (ccCreatorSocialAt(creator, ccPickedYear())[0]||0) : ccProSocialStart(card)[0],
            // И YouTube про 2026 года — его настоящий канал (ccProSocialStart, CC_PRO_SOCIAL).
            yt: creator ? ccCreatorYt(creator) : ccProSocialYt(card),
            // Очки прокачки в карьере не живут: они розданы на экране
            // создания и уже лежат в статах. Правка.
            earnings:0, wages:0, tokens:[], log:[],
            /* Своя соль этой карьеры — см. ccCareerSeed. Без неё первые, кто
               написал в инбокс, были одни и те же в каждой новой карьере:
               бросок сеялся сезоном и днём, а они у всех одинаковые. */
            seed:Math.random().toString(36).slice(2,10)},
    // Taking a card takes the duo with it: you start with the partner they
    // really play with, off the card's own roster entries. A rookie, or a card
    // whose pairing the roster does not hold whole, starts alone and gets the
    // usual assignment at the first cup.
    // Состав приходит целиком: в трио-год (2025) — двое настоящих напарников по записи трио.
    partners:(()=>{
      if(!card) return [];
      const seats=(ccYearRosterSize(CC.year))-1;
      const mates=ccRealMatesOf(card, seats);
      return mates.map(m=>({handle:m.handle, cardRegion:m.region, patience:CAREER_PATIENCE_START,
                            since:ccAddDays(careerStartDay(), -CC_CHEM_DAYS)}));
    })(),
    partner:(()=>{
      const mate=card ? ccRealMateOf(card) : null;
      // A taken card arrives with the duo it really plays in, and that duo has
      // been one for a while: it starts on a season of chemistry rather than none.
      return mate ? {handle:mate.handle, cardRegion:mate.region, patience:CAREER_PATIENCE_START,
                     since:ccAddDays(careerStartDay(), -CC_CHEM_DAYS)} : null;
    })()
  };
  /* The jersey comes with the card.

     Taking Sky is playing Sky, and Sky is on All Gamers - the roster has carried
     the club since the Majors were read off their own standings, the card draws
     the crest, and the career started him as a free agent anyway. "Picked a
     player with an organisation and it is not there" is the screen saying so.

     The contract is the mode's own, not an invented one: careerOrgSalary at
     their rating, on the main roster because they are already on it, with the
     division's own objective. What it is not is an academy deal - an academy is
     for somebody unproven, and this is somebody the club already plays. */
  if(card && card.org){
    const tier=(careerOrgPool().find(o=>o.name===card.org)||{}).tier || Math.round(ovr);
    save.org={name:card.org, tier:tier, academy:false,
              salary:careerOrgSalary(tier, startDiv, save.career.reach, ovr),
              goal:careerOrgGoal(startDiv), cut:careerOrgCutFor(tier),
              since:1, paid:0, perk:null};
    save.career.orgs=[card.org];
  }
  /* Into the slot that was chosen, not into the first one.

     A player's report, 18 August: "when I try to make a second save it always
     overlaps my first save, so I always end up losing the 1st slot". This line
     was the whole of it. LS_CAREER is not the save key, it is slot one's key —
     LS_SLOT maps 1 to it and gives the others their own — and every other read
     and write in the mode goes through LS_SLOT(ccSlot()). Only the moment a
     career is created wrote the raw constant.

     careerSlotNew sets the active slot before opening creation, so the choice
     was already recorded correctly and this ignored it: starting a career in
     slot two saved it over slot one and left slot two empty. Two careers were
     never possible, and the first was destroyed by trying. */
  /* Первый день — по календарю ВЫБРАННОГО года: careerStartDay читает год с
     живой карьеры, поэтому сейв на миг становится ею. */
  { const was=CAREER; CAREER=save; save.career.day=careerStartDay();
    if(save.partner) save.partner.since=ccAddDays(save.career.day, -CC_CHEM_DAYS);
    (save.partners||[]).forEach(p=>{ p.since=ccAddDays(save.career.day, -CC_CHEM_DAYS); });
    // Пустой список — как его отсутствие: careerMigratePartners тогда возьмёт partner.
    if(!save.partners.length) delete save.partners;
    CAREER=was; }
  try{ ccLzDrop(LS_SLOT(ccSlotMine())); localStorage.setItem(LS_SLOT(ccSlotMine()), JSON.stringify(save)); }catch(e){}
  try{ ccSaveMarkAdopt(); }catch(e){}
  openCareerHub();
  /* И если карьеру заводили ради команды — сразу в лобби. Намерение ставит
     кнопка на карточке карьеры (careerMpNew / careerMpJoinNew) и сбрасывает
     оно же: одна попытка, дальше карьера обычная. Не дозвонились — ccMpEnter
     откатит командное состояние, и это останется одиночная карьера, о чём
     скажет плитка. */
  if(CC_MP_NEW){
    const want=CC_MP_NEW; CC_MP_NEW=null;
    // Гонка карьер — своя дверь: каждый играет СВОЮ карьеру, лобби только
    // сравнивает. См. careerRaceCreate / careerRaceJoin.
    if(want.race) (want.role==='b') ? careerRaceJoin(want.code) : careerRaceCreate();
    else if(want.role==='b') careerMpJoin(want.code);
    else careerMpCreate();
  }
}

/* ===== CAREER — the hub ====================================================
   The screen a career lives on between events. Layout follows the football
   career dashboard the design references: who you are along the top, a tab
   strip, a wide band for what is coming, tiles underneath.

   Everything on it is real. The calendar is generated from the season shape
   Epic actually runs — four cup weeks, a Major, four more, a Major, the Global
   Championship — and the Division 1 weeks carry the Performance Evaluation
   because that event is Division 1 only. Nothing here is a placeholder number:
   where a system does not exist yet the tile says so rather than inventing a
   figure. */

let CAREER=null;

/* ---- Three careers instead of one -------------------------------------------

   The mode held exactly one save, so trying a different player — a different
   country, a different starting division, an older beginner — meant deleting
   the career you had. Three slots, each a whole career, and the one you played
   last is the one the tile opens.

   The save that already exists is the first slot. Not copied into it, not
   migrated — the first slot's key IS the key the mode has always written, and
   the new ones sit beside it. A career somebody has played a season into is not
   something to move and hope, and the cheapest way to not lose it is to leave
   it exactly where it is. */
/* Шесть карьер, а было три. Отзыв: «может сделать больше
   сохранений». Слот №1 по-прежнему лежит в старом ключе (LS_SLOT), поэтому
   число можно менять, ничего не переписывая: новые слоты просто пустые. */
// 10 карьер (его слово 9.10: «может больше слотов для карьер сделать», «до 10 давай»; было 6). Место не упирается: не влезший сейв
// сжимается lz-string (~7×, см. careerSave), список слотов — строки и одна строка «новая».
const CC_SLOTS=10;
const LS_SLOT=n=>n===1 ? LS_CAREER : 'fncsdraft_career_s'+n;
/* Сейв бывает обычным JSON и сжатым (метка 'LZ1' + lz-string, см. careerSave). Читается одним путём. */
const CC_SAVE_LZ='LZ1';
function ccSaveParse(str){
  if(!str) return null;
  if(str.slice(0, 3)===CC_SAVE_LZ){ const raw=(typeof LZString!=='undefined') ? LZString.decompressFromUTF16(str.slice(3)) : null; return raw ? JSON.parse(raw) : null; }
  return JSON.parse(str);
}
const LS_ACTIVE='fncsdraft_career_active';
