/*@@PART js/career/focus-posts-charity.js@@*/
/* ФОКУС НЕДЕЛИ: один атрибут на неделю, его занятия дают +15% (CC_FOCUS_BONUS — выбор
   режима, не замер). Выбранный держится до конца недели — сменить нельзя.
   ЦЕЛЬ: атрибут и число, полоса прогресса; дошёл — новость и шаг формы. */
const CC_FOCUS_BONUS=0.15;
function ccFocusMult(k){
  const lf=(typeof ccLife==='function' && CAREER && CAREER.career) ? ccLife() : null;
  return (lf && lf.focus && lf.focus.wk===ccWeekTag() && lf.focus.k===k) ? 1+CC_FOCUS_BONUS : 1;
}
function ccFocusSet(k){
  const lf=ccLife(); if(lf.focus && lf.focus.wk===ccWeekTag()) return;
  lf.focus={wk:ccWeekTag(), k:k}; careerSave(); careerRenderHub('train');
}
function ccGoalSet(k, to){
  const lf=ccLife(), six=CAREER.player.attrs||ccOwnAttrs();
  lf.goal={k:k, from:Math.round((six[k]||50)*10)/10, to:to, set:careerToday()}; careerSave(); careerRenderHub('train');
}
function ccGoalCheck(){
  const lf=ccLife(), g=lf.goal; if(!g || g.done) return;
  const v=(CAREER.player.attrs||{})[g.k]||0;
  if(v>=g.to){ g.done=careerToday(); const cr=CAREER.career; cr.form=Math.min(CC_FORM_MAX, (cr.form||0)+0.5);
    careerNews('good', 'lfNewsGoal', [ccAttrFull(g.k), g.to]); }
}
function ccTrainPlanHTML(){
  const lf=ccLife(), six=CAREER.player.attrs||ccOwnAttrs(), wk=ccWeekTag();
  const f=(lf.focus && lf.focus.wk===wk) ? lf.focus.k : null;
  const chips=ATTR_KEYS.map(k=>'<button class="tp-chip'+(f===k?' on':'')+'"'+(f?' disabled':'')+' onclick="ccFocusSet(\''+k+'\')">'+
    (CC_ATTR_ICON[k]||'')+' '+esc(ccAttrFull(k))+'</button>').join('');
  const g=lf.goal;
  let goal;
  if(g && !g.done){
    const v=six[g.k]||0, pct=Math.max(0, Math.min(100, (v-g.from)/Math.max(0.1, g.to-g.from)*100));
    goal='<div class="tp-goal"><span>'+(CC_ATTR_ICON[g.k]||'')+' '+esc(ccAttrFull(g.k))+' <b>'+(Math.round(v*10)/10).toFixed(1)+' / '+g.to+'</b></span>'+
      '<u><s style="width:'+pct.toFixed(0)+'%"></s></u><button class="tp-x" onclick="ccLife().goal=null;careerSave();careerRenderHub(\'train\')">×</button></div>';
  } else {
    const done=g && g.done ? '<div class="tp-done">✓ '+esc(L().lfGoalDone(ccAttrFull(g.k), g.to))+'</div>' : '';
    goal=done+'<div class="tp-goalpick">'+ATTR_KEYS.map(k=>{ const to=Math.min(99, Math.ceil(((six[k]||50)+0.1)/5)*5);
      return '<button class="tp-chip" onclick="ccGoalSet(\''+k+'\','+to+')">'+(CC_ATTR_ICON[k]||'')+' '+(L()['ccAttr'+k.toUpperCase()]||k)+' → '+to+'</button>'; }).join('')+'</div>';
  }
  /* Фокус и цель — по желанию, и двенадцать кнопок всегда раскрытыми были самым шумным местом вкладки (27.10, «слишком
     много информации»). Свёрнуто в одну строку: что выбрано (или что это вообще), раскрывается по нажатию. */
  const parts=[];
  if(f) parts.push(L().lfFocusH+': '+ccAttrFull(f)+' +'+Math.round(CC_FOCUS_BONUS*100)+'%');
  if(g && !g.done) parts.push(L().lfGoalH+': '+ccAttrFull(g.k)+' '+(Math.round((six[g.k]||0)*10)/10).toFixed(1)+' / '+g.to);
  return '<details class="ch-tile tp-plan tp-fold"'+(CC_TP_OPEN ? ' open' : '')+' ontoggle="CC_TP_OPEN=this.open">'+
    '<summary><h4>'+esc(L().lfPlanH)+'</h4><span>'+esc(parts.length ? parts.join(' · ') : L().lfPlanOff(Math.round(CC_FOCUS_BONUS*100)))+'</span></summary>'+
    '<div class="tp-body"><div class="tp-col"><h4>'+esc(L().lfFocusH)+'</h4><div class="ch-hint">'+
    esc(f ? L().lfFocusOn(ccAttrFull(f), Math.round(CC_FOCUS_BONUS*100)) : L().lfFocusPick(Math.round(CC_FOCUS_BONUS*100)))+'</div>'+
    '<div class="tp-chips">'+chips+'</div></div>'+
    '<div class="tp-col"><h4>'+esc(L().lfGoalH)+'</h4><div class="ch-hint">'+esc(L().lfGoalHint)+'</div>'+goal+'</div></div></details>';
}
let CC_TP_OPEN=false;
// The day only moves once it has been spent. A day nobody decided may as well
// not be in the calendar, so there is no button to leave one undecided.
/* Division 1 Weekly Final played in weeks the player isn't in it, so the feed shows the scene.
   Same simulator, points table and roster duos; field CAREER_CUP_CUT, length CAREER_CUP_GAMES,
   ordered by rating (not careerRealDuos' shuffle). The top three post it.
   Played once when the clock crosses Sunday and saved; not reproducible from the date, and doesn't need to be. */
function careerWorldD1(iso){
  const rnd=careerRng(ccHashStr('d1|'+iso));
  /* The player and everybody in their squad were not in it — they played this
     week themselves, in their own room.

     It held back the first seat alone, so a trio's second partner turned up in
     the world's own Division 1 night playing the same Weekly Final beside
     somebody else, and the season table carried both rows. His report,
     20 August. See ccMyPeople. */
  const taken=ccMyPeople();
  // The fifty who came through this week, not the fifty best on paper: drawn
  // from the eighty strongest duos and shuffled on the date, so a season table
  // built out of these nights has more than fifty names in it and the regulars
  // rise to the top of it rather than being handed the top.
  const pool=careerRealDuos(taken, rnd, 1).slice().sort((a,b)=>b.avg-a.avg).slice(0, 80);
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  const duos=pool.slice(0, CAREER_CUP_CUT);
  if(duos.length<8) return null;
  /* ТРИО-ГОД — ТРОЙКИ И В ЛЕНТЕ. Комната выше игрока и комнаты чужих регионов собирались из пар
     и в трио-год: третьих здесь никто не сажал, и таблица «финала недели» стояла на двоих. Третий —
     тот же, что весь сезон (память cr.trios по ключу пары); нет записи — ближайший по силе из
     свободных пула (у кого своей пары нет), и запись делается один раз, как в careerCupField. */
  const thirdOf=(function(){
    if(careerSquadSize()!==3) return null;
    const all=careerPools();
    const cr=CAREER && CAREER.career; const memo=(cr && (cr.trios=cr.trios||{}))||{};
    const pairedK=new Set(); (all.duos||[]).forEach(p=>(p.cards||[]).forEach(c=>pairedK.add(c._k||hKey(c))));
    const free=(all.players||[]).filter(c=>!pairedK.has(c._k||hKey(c))).slice().sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
    const used=new Set();
    // Чужой запомненный третий свободным не считается: иначе две пары делили бы одного человека,
    // и на ЛАНе (где память рассаживается первой) одна из них ехала бы с новым.
    const taken=new Set(Object.keys(memo).map(k=>memo[k]));
    return function(cards){
      const key=cards.map(c=>hKey(c)).sort().join('+');
      const want=memo[key];
      let c=want ? free.find(x=>(x._k||hKey(x))===want && !used.has(x._k||hKey(x))) : null;
      if(!c){
        const avg=(ccCardOvr(cards[0])+ccCardOvr(cards[1]))/2;
        let best=null, gap=Infinity;
        free.forEach(x=>{ const k=x._k||hKey(x); if(used.has(k) || pairedK.has(k) || taken.has(k)) return; const g=Math.abs(ccCardOvr(x)-avg); if(g<gap){ gap=g; best=x; } });
        c=best;
        if(c && !memo[key] && !ccRaceOn()) memo[key]=c._k||hKey(c);
      }
      if(c) used.add(c._k||hKey(c));
      return c;
    };
  })();
  // Память первой, свежие выборы потом — как в careerCupField: иначе ранняя пара уводила бы
  // запомненного третьего поздней.
  const thirds=new Map();
  if(thirdOf){
    const cr0=CAREER && CAREER.career, memo0=(cr0 && cr0.trios)||{};
    const keyOf=d=>d.cards.map(c=>hKey(c)).sort().join('+');
    duos.filter(d=>memo0[keyOf(d)]).forEach(d=>{ const x=thirdOf(d.cards); if(x) thirds.set(d, x); });
    duos.filter(d=>!thirds.has(d)).forEach(d=>{ const x=thirdOf(d.cards); if(x) thirds.set(d, x); });
  }
  const teams=duos.map(d=>{
    if(thirds.has(d)) d={cards:d.cards.concat([thirds.get(d)]), avg:d.avg};
    const t=careerTeam(d.cards);
    t.name=teamLabel(d.cards);
    t._cards=d.cards;
    return t;
  });
  simulateGames(teams, CAREER_CUP_GAMES, pointsForPlace, 4);
  return teams.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
}
// Who posts, and in what order. careerNews files each line on top, so the table
// is written from third place upwards and the winner ends up first.
//
// The same three posts whichever division played, because a cup in Division 4
// is a cup: the people in it post their places and attach the table, exactly as
// the people in Division 1 do. Only the names differ — Division 1 is real cards
// with portraits, everything below is the ladder, which has handles and no
// faces, so those posts fall back to initials.
// The press account congratulating whoever took a title — only in the rooms it
// covers: a Division 1 cup, the Weekly Final, a Major final, the Reload
// circuit's finals. The winners are tagged the way a real account tags them,
// the player's own duo included, and the post carries the standings screenshot
// with the event's name on it.
/* Разбор вечера цифрами. Считается по журналу игр, который уже собран
   вечером: места, элимы и разложение очков. Лобби меряется тем же полем,
   что стоит в таблице, поэтому «по элимам в лобби» — не оценка, а место.
   Одна игра — не разбор: вечер, оборванный на первой, промолчит. */
function ccKinchPost(ranked, you, label){
  if(!you || !ranked || !ranked.length) return;
  const log=(you.stageLog||[]).filter(g=>g && g.place!=null);
  if(log.length<2) return;
  const games=log.length;
  const place=ranked.indexOf(you)+1;
  if(place<1) return;
  const avg=log.reduce((s,g)=>s+g.place, 0)/games;
  const elims=log.reduce((s,g)=>s+(g.elims||0), 0);
  const elimPts=log.reduce((s,g)=>s+(g.elimPts||0), 0);
  const pts=(you.stagePts!=null ? you.stagePts : log.reduce((s,g)=>s+(g.pts||0), 0));
  const placePts=Math.max(0, pts-elimPts);
  const better=ranked.filter(t=>t!==you && (t.stageElims||0)>elims).length;
  // С 16.10 разбор — в личку, со сравнением внутри состава (ccKinchDm). В игре вдвоём — как раньше, постом.
  try{ if(ccKinchDm(ranked, you, label)) return; }catch(e){ console.error('kinch dm', e); }
  careerNews('flat', 'ccNewsKinch', [label, place, games, avg.toFixed(1), elims,
             (elims/games).toFixed(1), ccNum(placePts), ccNum(elimPts), better+1],
             (function(){ const rows=ccStatMine(ranked, you);
               return rows.length>=4 ? {lead:{cap:label, rows:rows, mine:true}} : undefined; })());
}
/* Лидеры вечера — доска в формате самого Kinch Analytics.
   Пост Кинча за Global Champs 2026, день 1: «Damage: 4128 @Koyota0 ·
   Elims: 16 · Assists: 26 · Damage Ratio: 2.67 · Net Damage: 2063 · Damage Per
   Minute: 41.28 · Builds · Farmed · Distance · Storm Time». Отзыв: «все
   статистики можно добавить как-то».
   Ничего для этого считать не пришлось: матчевая статистика в моде уже есть —
   accumulateMatchStats ведёт по каждой команде урон нанесённый и полученный,
   ассисты, метсы, время в живых, время в шторме и пройденное расстояние. Доска
   просто достаёт из неё лидера по каждой строке.
   Двух строк Кинча здесь нет, и это честнее, чем подделать: ПОСТРОЕК движок не
   считает вовсе (есть только метсы), а Solo Clutch Points — метрика Epic про
   очки, набранные последним выжившим в команде, которой у нас нет. */
/* Значки строк — те же, что в посте Кинча. Языка у них нет, поэтому они
   живут в коде, а не в словарях. */
const CC_LEAD_ICO={s_dmgTo:'💥', s_elims:'🎯', s_assists:'💁',
  s_dmgRatio:'👍', s_dmgNet:'📈', s_dpm:'⏰',
  s_matsFarmed:'⛏️', s_distance:'🏃', s_timeStorm:'🌧️'};
/* Флаг лидера — его собственный, с карточки: доску читают по людям, а
   человек в этой сцене узнаётся по флагу раньше, чем по нику. */
// Человек строки — тот же, чьей долей считаются элимы и урон (ccStatSeat): главный по дракам в отряде.
function ccStatWho(t){
  const sq=((t && (t.squad||t._cards||t.cards)) || []).filter(Boolean);
  const sp=sq.length>=2 ? ccStatSeat(t) : null;
  return sp ? sq[sp.seat] : sq.slice().sort((a,b)=>((b.rating||b._ovr)||0)-((a.rating||a._ovr)||0))[0];
}
/* ДОСКА ЛИДЕРОВ В КОМАНДЕ — ОДНА НА ДВОИХ (Notion 21.10, двое играли командой: «кинч у всех не одинаковые статы
   пишет»). Строку своей команды каждый подписывал собой и считал долю элимов и урона по своему месту в составе — у одного
   «64 @wolfixx», у другого «64 @gzabor». Пока считается доска (ccStatLeaders), своя команда в командной карьере — как
   любая: главный по дракам, при равенстве — меньший ник. Личная карточка (ccStatMine) остаётся своей. */
let CC_STAT_NEUTRAL=false;
function ccStatYouSeat(t){ return !!(t && t.isYou) && !(CC_STAT_NEUTRAL && typeof ccMpTeam==='function' && ccMpTeam()); }
function ccStatNat(t){
  const best=ccStatWho(t);
  if(ccStatYouSeat(t)){ const c=(typeof careerCard==='function') ? careerCard() : null; return (c && c.nat) || (best && best.nat) || null; }
  return (best && best.nat) || null;
}
function ccStatFace(t){
  if(ccStatYouSeat(t)) return ccHandle(CAREER.player.nick);
  const best=ccStatWho(t);
  return ccHandle((best && best.handle) || ccOneOf(t && t.name) || '');
}
function ccMmSs(sec){
  const s=Math.max(0, Math.round(sec||0));
  return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
/* Девять показателей доски — один список на две карточки: лидеров вечера и
   свою. Отношения (урон к полученному, урон в минуту) меряются только среди
   тех, кто прожил не меньше среднего по лобби: максимум дроби иначе вытягивает
   не сильнейший, а тот, кто рано умер с удачной перестрелкой — у Кинча лидер по
   урону и лидер по урону в минуту один и тот же человек.
   НА ИГРОКА, а не на команду: объёмы делятся на размер состава, а время в
   живых, в шторме и расстояние — нет, их пара проживает вместе (то же правило,
   что в playerShares). Урон в минуту делится вместе с уроном. */
/* ДОЛЯ ЧЕЛОВЕКА, А НЕ ПОЛОВИНА (Notion 13.10: «в самой катке реалистично киллы распределяются,
   но в подсчётах общие киллы просто на 2 делятся»). Элимы и урон отряда делятся тем же правилом,
   что и в катке (ccKillWeights + killShare): у себя — своё место в составе, у чужой команды — главный по дракам
   (наибольший вес), его ник и флаг и стоят в строке доски (ccStatWho). Ассисты и маты — поровну, как было. */
function ccStatSeat(t){
  const sq=((t && (t.squad||t._cards||t.cards))||[]).filter(Boolean);
  if(sq.length<2) return null;
  let seat=-1;
  if(ccStatYouSeat(t)){ const sp=ccYouKillSplit(t); seat=sp ? sp.seat : -1; }
  /* Своя команда на общей доске в команде: веса — по составу в порядке ников (вес зависит от места в составе, а у двоих
     своя карточка стоит первой), потом обратно в порядок команды. Равные веса — тоже по нику. */
  const canon=(t.isYou && !ccStatYouSeat(t)) ? sq.slice().sort((a,b)=>hKey(a)<hKey(b) ? -1 : hKey(a)>hKey(b) ? 1 : 0) : sq;
  let w=null; try{ w=ccKillWeights(canon); }catch(e){ return null; }
  if(canon!==sq) w=sq.map(c=>w[canon.indexOf(c)]);
  if(seat<0) w.forEach((v,i)=>{ if(seat<0 || v>w[seat] || (v===w[seat] && hKey(sq[i])<hKey(sq[seat]))) seat=i; });
  return {seat:Math.max(0, seat), w};
}
function ccStatMetrics(){
  const num=v=>ccNum(Math.round(v));
  const mates=t=>Math.max(1, ((t.squad||t._cards||t.cards)||[]).length||1);
  const per=(f)=>(s,t)=>f(s)/mates(t);
  const seats=new WeakMap();
  const seatOf=t=>{ if(!seats.has(t)) seats.set(t, ccStatSeat(t)); return seats.get(t); };
  const frac=t=>{ const sp=seatOf(t); if(!sp) return 1/mates(t);
    const sum=sp.w.reduce((a,v)=>a+Math.max(0.01, v||0), 0);
    return sum>0 ? Math.max(0.01, sp.w[sp.seat]||0)/sum : 1/mates(t); };
  const own=(f)=>(s,t)=>f(s)*frac(t);
  const ownElims=(s,t)=>{ const sp=seatOf(t), e=Math.round(s.elims||0);
    if(!sp || typeof ZoneReplay==='undefined' || !ZoneReplay.killShare) return (s.elims||0)/mates(t);
    const v=ZoneReplay.killShare(e, sp.w, sp.seat); return v==null ? 0 : v; };
  return [
    {key:'s_dmgTo',      val:own(s=>s.dmgTo), fmt:num},
    {key:'s_elims',      val:ownElims, fmt:num},
    {key:'s_assists',    val:per(s=>s.assists), fmt:num},
    {key:'s_dmgRatio',   val:s=>s.dmgFrom>0 ? s.dmgTo/s.dmgFrom : 0, fmt:v=>v.toFixed(2), deep:true},
    {key:'s_dmgNet',     val:(s,t)=>s.dmgTo*frac(t)-s.dmgFrom/mates(t), fmt:num},
    {key:'s_dpm',        val:own(s=>s.timeAlive>0 ? s.dmgTo/(s.timeAlive/60) : 0), fmt:v=>v.toFixed(2), deep:true},
    {key:'s_matsFarmed', val:per(s=>s.wood+s.stone+s.metal), fmt:num},
    {key:'s_distance',   val:s=>s.dist, fmt:v=>(v/1000).toFixed(2)+' km'},
    {key:'s_timeStorm',  val:s=>s.inStorm, fmt:ccMmSs}
  ];
}
function ccStatPools(ranked){
  const all=(ranked||[]).filter(t=>t && t.mstats && t.mstats.games>0);
  const a=all.map(t=>t.mstats.timeAlive).sort((x,y)=>x-y);
  const aliveMid=a[Math.floor(a.length/2)]||0;
  return {all, deep:all.filter(t=>t.mstats.timeAlive>=aliveMid)};
}
function ccStatLeaders(ranked){
  const rows=[];
  const P=ccStatPools(ranked);
  if(P.all.length<3) return rows;
  const was=CC_STAT_NEUTRAL; CC_STAT_NEUTRAL=true;
  try{
    ccStatMetrics().forEach(m=>{
      let best=null, bv=-Infinity;
      (m.deep ? P.deep : P.all).forEach(t=>{ const v=m.val(t.mstats, t); if(v!=null && isFinite(v) && v>bv){ bv=v; best=t; } });
      if(!best || bv<=0) return;
      rows.push([m.key, m.fmt(bv), ccStatFace(best), ccStatNat(best)||'']);
    });
  } finally { CC_STAT_NEUTRAL=was; }
  return rows;
}
/* Своя карточка. Отзыв: «after every grands and cash cup, ewc etc
   you should see how your player played» — после каждого финала видно, как
   сыграл ИМЕННО твой игрок, а не только кто был лучшим в лобби. Те же девять
   строк, что у лидеров, но число — своё, а справа вместо ника лидера — место
   в лобби по этому показателю. Лобби для отношений то же, что у доски; если
   игрок сам в него не попал (умер рано), место считается по всему лобби. */
function ccStatMine(ranked, you){
  const rows=[];
  if(!you || !you.mstats || !(you.mstats.games>0)) return rows;
  const P=ccStatPools(ranked);
  if(P.all.length<3) return rows;
  ccStatMetrics().forEach(m=>{
    const v=m.val(you.mstats, you);
    if(v==null || !isFinite(v)) return;
    const pool=(m.deep && P.deep.indexOf(you)>=0) ? P.deep : P.all;
    const rank=1+pool.filter(t=>t!==you && m.val(t.mstats, t)>v).length;
    rows.push([m.key, m.fmt(v), '#'+rank+' / '+pool.length, null, rank===1]);
  });
  return rows;
}
/* Один вызов на конец турнира: личный разбор и доска лидеров.
   Зовётся из каждого раннера, чей вечер — финал. */
function ccBoardAfter(ranked, you, label){
  ccKinchPost(ranked, you, label);
  ccStatBoardPost(ranked, label);
  ccEliteFlopPost(ranked, label);
  ccZoneLuckPost(ranked, label);
  ccMyStatsButton(ranked, you, label);
}
/* Кнопка под итогом вечера. Отзыв: после каждого финала — грандов,
   кэш-капа, EWC — видно, как сыграл твой игрок; и: «чтоб он нажал
   кнопку после игры посмотреть стату». Встаёт в последнюю карточку этапа,
   раскрывает ту же карточку, что прикреплена к разбору в ленте. */
function ccMyStatsButton(ranked, you, label){
  const rows=ccStatMine(ranked, you);
  if(rows.length<4) return;
  const cards=document.querySelectorAll('#majorStages .stage-card');
  const card=cards[cards.length-1];
  if(!card || card.querySelector('.cc-mystats')) return;
  const d=document.createElement('details');
  d.className='cc-mystats';
  d.innerHTML=`<summary>${esc(L().ccMyStatsBtn)}</summary>`+ccLeadHTML({cap:label, rows:rows, mine:true});
  card.appendChild(d);
}
/* ПРОВАЛ ЭЛИТЫ (5.10, Notion «05», испанский игрок: «flops de la elite»). После вечера
   аналитик называет фаворита, который провалился: команда из первых CC_FLOP_FAV по силе
   поля (t.pow — то, с чем она вышла) закончила ниже max(CC_FLOP_MIN_PLACE, доли поля).
   Один пост на вечер — самый большой разрыв ожидания и места; не больше CC_FLOP_WEEK за
   семь дней и одна и та же команда — не чаще раза в неделю. Своя команда и люди гонки
   (isYou/isRival) не в счёт: свой вечер игрок разбирает сам (ccKinchPost).
   Замер (check-career-elite-flops, 120 полей Д1 по 50, 12 игр): фаворит в нижней половине —
   22% вечеров; при 0.4 поля было 27% — «неожиданно» читалось как каждый четвёртый вечер. */
const CC_FLOP_FAV=3, CC_FLOP_MIN_PLACE=15, CC_FLOP_SHARE=0.5, CC_FLOP_WEEK=2;
function ccEliteFlop(ranked){
  const n=(ranked||[]).length;
  if(n<20) return null;
  const bare=t=>String(t.name||'').replace(/<[^>]*>/g,'').trim();
  const byPow=ranked.slice().sort((a,b)=>(b.pow||0)-(a.pow||0));
  const cut=Math.max(CC_FLOP_MIN_PLACE, Math.ceil(n*CC_FLOP_SHARE));
  let best=null;
  byPow.slice(0, CC_FLOP_FAV).forEach(function(t, i){
    if(!t || t.isYou || t.isRival || !bare(t)) return;
    const cards=(t._cards||t.cards||t.squad||[]).filter(c=>c && c.handle);
    if(!cards.length) return;
    const place=ranked.indexOf(t)+1, exp=i+1;
    if(place<cut) return;
    if(!best || place-exp>best.place-best.exp) best={t, place, exp, n, name:bare(t), cards};
  });
  return best;
}
function ccEliteFlopPost(ranked, label){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const f=ccEliteFlop(ranked); if(!f) return;
  const today=careerToday(), from=ccAddDays(today, -6);
  const recent=(cr.news||[]).filter(e=>e && e.k==='ccNewsEliteFlop' && e.day>=from && e.day<=today);
  if(recent.length>=CC_FLOP_WEEK) return;
  if(recent.some(e=>(e.a||[])[1]===f.name)) return;
  const tags=f.cards.map(c=>'@'+ccHandle(c.handle)).join(' ');
  careerNews('flat', 'ccNewsEliteFlop', [label, f.name, f.place, f.n, f.exp, tags]);
}
/* ПОСТ КИНЧА — ПРОСТО ТЕКСТ (28.10, Notion 27.10 скрин 14: «посмотри как у кинча выглядит, у него вроде просто посты»).
   Настоящий @KinchAnalytics (снято 28.10 с его X, FNCS Solos) пишет без картинок, строками:
     🏆 FNCS Solos - BR 🏆 / 🔥 Stats Leaders 🔥 / 💥 Damage: 7207 🇧🇷 @edsonmalado / 🎯 Elims: 31 🇧🇷 @lucxfn1 / …
   Доска-картинка под постом снята; строки те же (ccStatLeaders), язык — его английский. */
const CC_KINCH_LBL={s_dmgTo:'Damage', s_elims:'Elims', s_assists:'Assists', s_dmgRatio:'Damage Ratio', s_dmgNet:'Net Damage',
  s_dpm:'Damage Per Minute', s_matsFarmed:'Farmed', s_distance:'Distance', s_timeStorm:'Storm Time'};
const CC_KINCH_ICO={s_assists:'💁‍♂️'};
function ccFlagEmoji(nat){
  let c='';
  try{ c=String((typeof FLAG_CODE!=='undefined' && FLAG_CODE[nat]) || (typeof ccCountryOf==='function' && ccCountryOf(nat)) || nat || '').toLowerCase(); }catch(e){ c=''; }
  if(!/^[a-z]{2}$/.test(c)) return '';
  return String.fromCodePoint(0x1F1E6+c.charCodeAt(0)-97, 0x1F1E6+c.charCodeAt(1)-97);
}
// Флаг-эмодзи в тексте поста — картинкой сайта: на Windows эмодзи-флаги видны буквами («DK»).
function ccFlagImgs(html){
  return String(html||'').replace(/([🇦-🇿])([🇦-🇿])/gu, (m, a, b)=>{
    const c=String.fromCharCode(97+a.codePointAt(0)-0x1F1E6, 97+b.codePointAt(0)-0x1F1E6);
    return '<img class="x-flag" src="flags/w20/'+c+'.png" alt="'+m+'" onerror="this.replaceWith(this.alt)">';
  });
}
function ccKinchBoardText(ev, rows){
  const head=(ev!=null && ev!=='' ? '🏆 '+String(ev)+' 🏆\n' : '')+'🔥 Stats Leaders 🔥\n';
  const lines=(rows||[]).filter(r=>r && CC_KINCH_LBL[r[0]]).map(r=>{
    const fl=ccFlagEmoji(r[3]);
    return (CC_KINCH_ICO[r[0]]||CC_LEAD_ICO[r[0]]||'')+' '+CC_KINCH_LBL[r[0]]+': '+String(r[1]).replace(/(\d)[\s  ,](?=\d{3}\b)/g, '$1')+(fl ? ' '+fl : '')+' @'+String(r[2]||'');
  });
  return head+'\n'+lines.join('\n');
}
function ccStatBoardPost(ranked, label){
  const rows=ccStatLeaders(ranked);
  if(rows.length<4) return;
  careerNews('flat', 'ccNewsStatBoard', [label, rows]);
}
/* УДАЧА ЗОН ТОПА (28.10, X: «Solo FNCS EU Grand Finals Cumulative Zone Luck Accountability Post»). После финала аккаунт
   считает топ-10: в скольких эндгеймах зона пришла к команде (mstats.zpN из _zonePull движка, zpG — эндгеймы). Только
   команды, дожившие хотя бы до CC_ZL_MIN эндгеймов (лобби на карте), пост не чаще раза в CC_ZL_GAP дней. */
const CC_ZL_BY={name:'Zone Watch FN', handle:'zonewatchfn', f:31000}, CC_ZL_MIN=3, CC_ZL_GAP=5;
function ccZoneLuckPost(ranked, label){
  const cr=CAREER && CAREER.career; if(!cr || !ranked) return;
  const today=careerToday(), from=ccAddDays(today, -(CC_ZL_GAP-1));
  if((cr.news||[]).some(e=>e && e.k==='ccNewsZoneLuck' && e.day>=from && e.day<=today)) return;
  const me=hKey(ccHandle((CAREER.player && CAREER.player.nick)||''));
  const list=[];
  ranked.slice(0, 10).forEach(function(t, i){
    const s=t && t.mstats;
    if(!s || !(s.zpG>=CC_ZL_MIN)) return;
    const hs=(t.isYou ? [CAREER.player.nick].concat((careerMates()||[]).map(c=>c && c.handle))
                      : (t._cards||t.cards||t.squad||[]).map(c=>c && c.handle)).filter(Boolean);
    if(!hs.length) return;
    list.push([i+1, hs.map(h=>'@'+ccHandle(h)).join(' & '), s.zpN||0, s.zpG]);
  });
  if(list.length<5) return;
  careerNews('flat', 'ccNewsZoneLuck', [label, list], {by:CC_ZL_BY});
}
/* СЕРИЯ СТРАНЫ (28.10, X: «The last 5 FNCS's on EU have been won by a Danish player. Is Denmark the best nation?»).
   Крупные финалы (всё, что поздравляет careerCongrats, кроме недельного) пишут страны победителей в cr.natFin;
   страна, у которой CC_NAT_RUN финала подряд есть игрок в составе победителя, получает пост. Один пост на финал. */
const CC_NAT_BY={name:'FN Comp Stats', handle:'fncompstats', f:54000}, CC_NAT_RUN=3;
function ccNatStreakNote(w, you, label){
  const cr=CAREER && CAREER.career; if(!cr || !w) return;
  let nats;
  if(you && w===you){
    const P=CAREER.player||{};
    nats=[P.nat||P.country].concat((careerMates()||[]).map(c=>c && (ccWhoCard(c.handle)||c).nat));
  } else nats=(w._cards||w.cards||w.squad||[]).map(c=>c && (c.nat || (ccWhoCard(c.handle)||{}).nat));
  // В карточках — название страны («Дания»), у своего игрока бывает код; к одному виду.
  nats=nats.filter(Boolean).map(x=>/^[a-z]{2}(-[a-z]+)?$/i.test(x) ? (ccNatOf(x.toLowerCase())||'') : x)
    .filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);
  cr.natFin=(cr.natFin||[]).concat([{d:careerToday(), l:label, n:nats}]).slice(-12);
  const run=nat=>{ let k=0; for(let i=cr.natFin.length-1; i>=0 && cr.natFin[i].n.indexOf(nat)>=0; i--) k++; return k; };
  let best=null, bk=0;
  nats.forEach(n=>{ const k=run(n); if(k>bk){ bk=k; best=n; } });
  if(!best || bk<CC_NAT_RUN) return;
  careerNews('flat', 'ccNewsNatStreak', [best, bk, label, bk%2], {by:CC_NAT_BY});
}
function careerCongrats(ranked, you, label){
  if(!ranked || !ranked.length) return;
  ccKinchPost(ranked, you, label);
  ccStatBoardPost(ranked, label);
  ccEliteFlopPost(ranked, label);
  ccZoneLuckPost(ranked, label);
  ccMyStatsButton(ranked, you, label);
  const w=ranked[0];
  if(label!==L().calWeeklyFinal){ try{ ccNatStreakNote(w, you, label); }catch(e){ console.error('natstreak', e); } }
  const bare=t=>String(t.name||'').replace(/<[^>]*>/g,'');
  let handles;
  if(you && w===you){
    // Everybody who won it, which in a trio season is three names.
    handles=[CAREER.player.nick].concat(careerMates().map(c=>c && c.handle));
  } else {
    handles=(w._cards||w.cards||w.squad||[]).map(c=>c && c.handle);
  }
  const tags=handles.filter(Boolean).map(h=>'@'+ccHandle(h)).join(' ');
  const rows=ranked.slice(0,10).map(ccShotRow);
  /* Взятый титул остаётся в био победителя — тем же способом, каким своё био
     считает выигранные кубки по журналу. Без этого сцена растёт только в
     числах, а читается она именно по строке под ником. См. ccBioLine. */
  handles.filter(Boolean).forEach(ccTitleAdd);
  /* Недельный финал — не повод для аккаунта сцены (16.10, «посмотри твиттер и сделай реалистичней»: за полтора
     месяца шесть поздравлений Fortnite Competitive с недельными событиями). В жизни он поздравляет с FNCS, Мейджорами,
     ЛАНами; недельный финал празднуют сами победители и их клуб — это остаётся. */
  if(label!==L().calWeeklyFinal)
    careerNews('good', 'ccNewsCongrats', [tags || bare(w), label],
               {tbl:{div:1, cap:label, rows, me:bare(w)}, art:'final'});
  /* И КЛУБ ГОВОРИТ СВОИМ ГОЛОСОМ.

     У аккаунта организации в жизни своя лента: «THE WORLD CHAMPIONS. We came.
     We conquered.» — @AGGlobalEsports, 23 августа 2026, поверх победы своего
     же игрока. У нас клуб до сих пор молчал: он подписывал, отпускал и платил,
     а праздновал за него аккаунт сцены. Теперь вечер своего человека клуб
     отмечает сам — одним постом на вечер, не по посту на каждого. */
  const orgs=[];
  handles.filter(Boolean).forEach(function(h){
    const c=ccWhoCard(h);
    if(c && c.org && orgs.indexOf(c.org)<0) orgs.push(c.org);
  });
  if(orgs.length) careerNews('good', 'ccPostOrgWin', [orgs[0], tags || bare(w), label],
                             {by:ccOrgBy(orgs[0]), art:'final'});
  /* And the player posts it themselves.

     His words, 17 August: post the table when the player wins something. The
     weekly divisional cup already worked this way and nothing above it did, so
     the biggest nights a career has - a Weekly Final, a Major, a Reload cup, a
     Global Championship - went onto the timeline as a press report about the
     player and nothing from the player. A screenshot of the standings with your
     own row in it is what winning something actually looks like on a timeline.

     A title always. A podium at these, because the rooms careerCongrats is
     called from are the ones where third is a result and not a near miss. */
  if(you && ranked.indexOf(you)>=0 && ranked.indexOf(you)<3){
    const place=ranked.indexOf(you)+1;
    // The seats beside you, all of them. See ccMateTagArg.
    const at=ccMateTagArg() || null;
    const v=careerWeek();
    careerNews('good', place===1 ? 'ccPostWon' : 'ccPostPodium',
               place===1 ? [label, at, v] : [place, label, at, v],
               {tbl:{div:1, cap:label, rows, me:bare(you)}});
  }
}
/* The other thing the account posts: the season table, as a screenshot, on the
   nights Division 1 plays for it. A congratulation is one night; the table is
   the year, and it is the picture the division is actually followed by — who
   is inside the fifty that stay up.

   Read off careerTableRows, which is the same table the hub draws, so the shot
   and the tab can never disagree. Silent until the table has a few weeks in it,
   because a standings post after one night is a results post with a longer
   name. */
function careerD1TablePost(){
  const rows=careerTableRows();
  const t=careerTable();
  if(!rows.length || (t.weeks||0)<3) return;
  const shot=rows.slice(0,5).map((r,i)=>({p:i+1, n:r.name, s:r.pts}));
  careerNews('flat', 'ccNewsD1Table', [t.weeks],
             {tbl:{div:1, cap:L().ccCongratsTable, rows:shot,
                   me:(rows.find(r=>r.you)||{}).name||null}});
}
function careerCupPosts(ranked, div, v){
  if(!ranked || ranked.length<3) return;
  const bare=t=>String(t.name||'').replace(/<[^>]*>/g,'');
  const rows=ranked.slice(0,10).map(ccShotRow);
  for(let i=2; i>=0; i--){
    const t=ranked[i], pair=(t._cards||t.squad||[]);
    const c=pair[0], mate=pair[1];
    const ovr=c ? (c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr) : null;
    // Nobody posts a result alone: the other half of the duo gets tagged. The
    // variant is offset per place so the top three do not all say "W" together.
    // Деньги места — как у настоящих: «2nd div 1 finals +$2,500 @…» (ленты Malibuca, Th0masHD, Peterbot, 9.10).
    let pz=0; try{ pz=(typeof wfPrize==='function') ? (wfPrize(i+1)||0) : 0; }catch(e){ pz=0; }
    careerNews(i===0?'good':'flat', 'ccPostPlaced',
      [i+1, div, mate?ccHandle(mate.handle):null, (v||0)+i, pz], {
      by:{name: c ? c.handle : ccOneOf(bare(t)), ovr:ovr,
          card: c && c.region ? {handle:c.handle, region:c.region} : null},
      tbl:{div, rows, me:bare(t)}
    });
  }
}
/* The rest of what people say after a cup.

   A feed of nothing but placements is a results page. Every line here is still
   tied to the week that was just played — the team that finished a place short,
   whoever took the most Victory Royales, the club whose duo went deep — because
   a post that cannot be traced to something on the screen behind it is filler,
   and this file has a rule about that.

   Two a week, rotated on the date, so the same three faces are not saying the
   same thing every Sunday. */
/* Люди сцены постят вечер ТАК ЖЕ, как игрок: со скрином таблицы.

   Правка: «фоток таблиц ещё нет в ленте у игроков, как у них
   можно, у нас же такой же дизайн». И правда: свои результаты уходили в ленту
   с картинкой стандингов, а точно такие же посты людей сцены — голым текстом.
   У настоящих наоборот: скрин таблицы под своим результатом это и есть пост
   (@MalibucaFN, @Th0masHD, @darmfn — у всех одинаково).

   Таблица собирается тем же ccStageShot, только своей строкой отмечен автор
   поста, а не игрок. */
function careerD1Extras(ranked, iso, label){
  const bare=t=>String(t.name||'').replace(/<[^>]*>/g,'');
  // Отсечка финала недели — те же пятьдесят, что и в самом вечере (CC_WF_SEATS).
  const shotOf=t=>ccStageShot(ranked, t, 1, label,
    (typeof careerCupCut==='function') ? careerCupCut(1) : undefined);
  const cardOf=t=>(t._cards||t.squad||[])[0]||null;
  const mateOf=t=>{ const m=(t._cards||t.squad||[])[1]; return m?ccHandle(m.handle):null; };
  const by=t=>{ const c=cardOf(t); return c
    ? {name:c.handle, ovr:c._ovr!=null?c._ovr:(attrsFor(c)||{}).ovr,
       card:c.region?{handle:c.handle, region:c.region}:null}
    : {name:ccOneOf(bare(t))}; };

  const out=[];
  // Fourth: the place nobody posts a screenshot of.
  if(ranked[3]) out.push(['flat','ccPostClose',[4, mateOf(ranked[3])], {by:by(ranked[3]), tbl:shotOf(ranked[3])}]);
  // Most Victory Royales of the night, which is its own thing to be proud of and
  // is not the same team as the winner more often than not.
  const most=ranked.slice(0,20).reduce((b,t)=>(t.wins||0)>(b&&b.wins||0)?t:b, null);
  if(most && most.wins>0) out.push(['good','ccPostWins',[most.wins, mateOf(most)], {by:by(most), tbl:shotOf(most)}]);
  // A club whose duo went deep. The org is on the card, so this names a real one.
  const withOrg=ranked.slice(0,10).map(cardOf).find(c=>c&&c.org);
  if(withOrg) out.push(['good','ccPostOrg',[ccHandle(withOrg.org)],
    {by:{name:withOrg.handle, ovr:withOrg._ovr,
         card:withOrg.region?{handle:withOrg.handle, region:withOrg.region}:null}}]);
  // And somebody going back over it on stream.
  if(ranked[1]) out.push(['flat','ccPostStreamD1',[], {by:by(ranked[1]), tbl:shotOf(ranked[1])}]);
  /* Как пишут настоящие после вечера (ленты Queasy, Peterbot, Th0masHD, Malibuca, Veno, 9.10): кто-то из низа таблицы
     ругает мету и @FNCompetitive, кто-то ищет состав на следующий турнир. */
  { const wk=(typeof careerWeek==='function') ? careerWeek() : 0;
    const low=ranked[Math.min(ranked.length-1, 30+(wk%10))], need=ranked[Math.min(ranked.length-1, 40+(wk%7))];
    if(low) out.push(['flat','ccPostMeta',[wk], {by:by(low)}]);
    if(need && need!==low) out.push(['flat','ccPostNeed',[wk], {by:by(need)}]); }

  if(!out.length) return [];
  // Rotated on the week number rather than a hash of the date: a hash only has
  // to be spread out on average, and over four Sundays it picked the same pair
  // three times. Counting means every kind of post comes round in turn.
  const at=(careerWeekIndex(iso)-1)%out.length;
  return [out[at], out[(at+1)%out.length]].filter((v,i,a)=>a.indexOf(v)===i);
}
/* Дата для записей недели, сыгранной миром. careerWorldTurns вызывается из careerAdvanceTo до cr.day=iso,
   и careerNews видел careerToday(), то есть день отъезда: субботний финал выходил в ленту пятничным числом
   и читался как второй турнир. Ставим на весь блок (часть строк приходит парами из careerD1Extras,
   по одной легко пропустить), снимаем в finally, чтобы упавшая неделя не подписала записи игрока чужим днём. */
let CC_POST_DAY=null;
function careerD1Posts(iso){
  const ranked=careerWorldD1(iso);
  if(!ranked) return;
  careerTableAdd(ranked);
  // День финала, а не день шага (см. careerPrAdd).
  const wasDay=CC_PRIZE_DAY; CC_PRIZE_DAY=iso;
  try{
  careerMoneyAdd(ranked, wfPrize);
  // The room above plays its week whether the player is in it or not, and the
  // board has to move on those weeks too.
  careerPrAdd(ranked, {div:1, kind:'final'});
  } finally { CC_PRIZE_DAY=wasDay; }
  CC_POST_DAY=iso;
  try{
    // Written before the placements so the placements land above them.
    /* Подпись под таблицами этих постов — та же, что у поздравления строкой
       ниже. Здесь стояло `label`, которой в этой функции нет: переменная жила в
       другой (careerCongrats), и вечер Дивизиона 1 падал с «label is not
       defined» каждое воскресенье. Поймал полный прогон. */
    careerD1Extras(ranked, iso, L().calWeeklyFinal).forEach(e=>careerNews(e[0], e[1], e[2], e[3]));
    careerCupPosts(ranked, 1, careerWeekIndex(iso));
    careerCongrats(ranked, null, L().calWeeklyFinal);
    careerD1TablePost();
  } finally { CC_POST_DAY=null; }
}
/* Лента других регионов. Каждое воскресенье шесть чужих регионов играют свой Финал недели тем же careerWorldD1
   с переключённым пулом (ccAsRegion). В ленту: победитель постит «TOP 1» со скрином таблицы, плюс все, на кого
   игрок подписан в этом регионе, постят своё место. Не топ-3 каждого: 18 чужих таблиц утопили бы свою.
   В таблицу сезона, призовые и PR чужая неделя не идёт. Титул в био победителя идёт (ccWhoCard читает PLAYERS
   целиком).
   Помечено днём финала, а не флагом: careerWorldTurns может вызваться на один диапазон дважды (см. его комментарий
   про [откуда, куда)). */
function careerRegionsWeek(iso){
  const cr=CAREER && CAREER.career;
  if(!cr || !iso || cr.awayWeek===iso) return;
  cr.awayWeek=iso;
  const home=ccCareerRegion();
  const follows=(cr.follows||[]).map(h=>hKey(h));
  const followed=c=>c && follows.indexOf(hKey(c))>=0;
  const label=L().calWeeklyFinal, v=careerWeekIndex(iso);
  const cut=(typeof careerCupCut==='function') ? careerCupCut(1) : undefined;
  CC_POST_DAY=iso;
  try{
    CC_REGIONS.forEach(reg=>{
      if(reg===home) return;
      let ranked=null;
      // Посев — с регионом: один и тот же день в семи комнатах не должен
      // тасовать семь пулов одной и той же лентой чисел.
      /* Чужие регионы — быстрой моделью (16.10, лаги: 75% перехода дня уходило на полный движок зоны для кубков,
         которых игрок не смотрит — только таблица и лента). Свой регион и свои вечера — полным движком, как были. */
      CC_WORLD_FAST=true;
      try{ ranked=ccAsRegion(reg, ()=>careerWorldD1(iso+'|'+reg)); }catch(e){ ranked=null; }
      finally{ CC_WORLD_FAST=false; }
      if(!ranked || ranked.length<3) return;
      const cap=regionName(reg)+' · '+label;
      const post=(t, i)=>{
        const pair=(t._cards||t.squad||[]);
        // Говорит тот, на кого подписан, — иначе его место приходило бы под
        // ником напарника с ним самим в теге.
        const c=pair.find(followed)||pair[0], mate=pair.find(x=>x!==c);
        if(!c || !c.handle) return;
        const ovr=c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr;
        careerNews(i<3?'good':'flat', 'ccPostPlaced',
          [i+1, 1, mate?ccHandle(mate.handle):null, v+i], {
          by:{name:c.handle, ovr:ovr, card:{handle:c.handle, region:reg}},
          tbl:ccStageShot(ranked, t, 1, cap, cut)
        });
      };
      // Снизу вверх, чтобы победитель лёг выше остальных — careerNews кладёт наверх.
      for(let i=ranked.length-1; i>=1; i--){
        const pair=(ranked[i]._cards||ranked[i].squad||[]);
        if(pair.some(followed)) post(ranked[i], i);
      }
      post(ranked[0], 0);
      (ranked[0]._cards||ranked[0].squad||[]).forEach(c=>{ if(c && c.handle) ccTitleAdd(c.handle); });
    });
  } finally { CC_POST_DAY=null; }
}

// Only the most recent Sunday crossed is played out. A career that skips a month
// should not spend a minute replaying every week it missed, and the feed has room
// for the last of them anyway.
/* Birthday posts from CC_BORN. Only people with a known date who are in this season's division,
   at most two a day. The player's own birthday too if the career is a real card, posted from their account. */
const CC_BDAY_MAX=1, CC_BDAY_TOP=60;
function careerBirthdays(fromISO, toISO){
  if(!(toISO>fromISO)) return;
  const pool=careerPools().players;
  const mine=CAREER.player && CAREER.player.handle;
  /* Своя дата — с карточки, а если карточки нет, то своя же, введённая.

     Поздравление существовало ровно для взятых карточек: дата бралась из
     CC_BORN по хэндлу, а у созданного игрока хэндла нет, поэтому его день
     рождения не наступал никогда. Просьба: дать вводить дату,
     чтобы Fortnite поздравлял. Вводится она на экране создания, лежит на
     pl.born, и здесь ей нужна одна строка. */
  const myBorn=(mine ? ccBornOf(mine) : null) || (CAREER.player && CAREER.player.born) || null;
  let bdayTop=0;
  for(let d=ccAddDays(fromISO,1); d<=toISO; d=ccAddDays(d,1)){
    const md=d.slice(5);
    if(myBorn && myBorn.slice(5)===md){
      /* Возраст на тот день, а не на сегодняшний.

         careerAdvanceTo зовёт нас до того, как переставит cr.day, поэтому
         ccPlayerAge() здесь ответил бы «сколько было вчера» — и поздравление
         называло возраст на год меньше того, в который поздравляют. Роастер
         так и считался с самого начала (ccAgeOn(born, d)), своя строка — нет. */
      const myAge=ccAgeOn(myBorn, d)+ccYearShift();
      careerNews('good', 'ccPostBdayMe', [myAge], {day:d});
      /* И сцена поздравляет в ответ.

         Ради этого дату и вводят: не чтобы число было точнее, а чтобы в этот
         день пришло поздравление. Своя строка — своя, а эта от аккаунта
         соревновательного Fortnite, того же, что пишет про чужие дни рождения
         и про вылеты из дивизиона. */
      careerNews('good', 'ccPostBdayEpic',
                 [ccHandle(CAREER.player.nick), myAge], {day:d});
      /* Подарки и поздравления сверху — его пункт 7 со страницы «ы»,
         22 августа: «подарки на др, комментарии под др от про игроков».
         Подарок падает на баланс, а двое настоящих игроков сильнее тебя
         пишут поздравление — тем же отбором, каким ccProNod выбирает, кто
         заметит хороший вечер. Бросок посеян от даты: перерисовка ленты
         никого не передобавляет, потому что вечер случается в advanceTo. */
      const gift=200;
      CAREER.career.balance=(CAREER.career.balance||0)+gift;
      careerNews('good', 'ccNewsBdayGift', [gift], {day:d});
      const rndB=careerRng(ccHashStr('bday|'+(CAREER.career.season||1)+'|'+d));
      const mineOvr=CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr;
      const over=careerRosterNowEU().filter(p=>(attrsFor(p)||{}).ovr>mineOvr);
      for(let g=0; g<2 && over.length; g++){
        const who=over.splice(Math.floor(rndB()*over.length), 1)[0];
        careerNews('good', 'ccPostBdayPro',
                   [ccHandle(who.handle), ccHandle(CAREER.player.nick)], {day:d});
      }
    }
    /* Дни рождения сцены — как в X (ленты Peterbot «19🎂🥳» и др., 9.10): пишет сам именинник, и только из верха
       сцены (CC_BDAY_TOP по рейтингу), не больше одного в день. С датами Liquipedia (7.10, 1931 человек) прежнее
       «двое в день от аккаунта Fortnite» давало два десятка поздравлений подряд. */
    if(!bdayTop){ const r=pool.map(p=>ccCardOvr(p)||0).sort((a,b)=>b-a); bdayTop=r[Math.min(r.length-1, CC_BDAY_TOP-1)]||0; }
    const seen=new Set();
    let n=0;
    for(const p of pool){
      if(n>=CC_BDAY_MAX) break;
      const born=ccBornOf(p.handle);
      if(!born || born.slice(5)!==md) continue;
      const k=hKey(p);
      if(seen.has(k) || (mine && hKey({handle:mine})===k)) continue;
      if((ccCardOvr(p)||0)<bdayTop) continue;
      seen.add(k); n++;
      // The scene's birthdays age with the career, for the reason ccAgeNow gives.
      careerNews('good', 'ccPostBdayMe', [ccAgeOn(born, d)+ccYearShift()],
                 {day:d, by:{name:p.handle, ovr:ccCardOvr(p), card:p.region?{handle:p.handle, region:p.region}:null}});
    }
  }
}
function careerWorldTurns(fromISO, toISO){
  if(!(toISO>fromISO)) return;
  try{ ccMobileWorld(fromISO, toISO); }catch(e){}   // мобильная сцена играет свои капы и без игрока
  const days=careerYearDays();
  let lastFinal=null;
  /* Неделя комнаты играется по уже пройденным дням: [откуда, куда), а не (откуда, куда].
     С днём прибытия в диапазоне careerWorldTurns считал субботу пройденной, сцена играла финал с призовыми, а потом игрок играл его второй раз. Сторож `played` не помогал, записи ещё нет.
     Сыграл финал и шагнул: суббота в диапазоне, `played` находит запись. Пропустил: сцена играет её за мир. Пришёл на субботу: в диапазоне только будни. */
  for(let d=fromISO; d<toISO; d=ccAddDays(d,1)){
    const list=days.get(d);
    if(list && list.some(e=>e.kind==='final')) lastFinal=d;
  }
  // A Fortnite season can turn inside the days a single advance crosses.
  for(let d=ccAddDays(fromISO,1); d<=toISO; d=ccAddDays(d,1)){
    const st=careerSeasonStartsOn(d);
    if(st) careerSeasonTurn(st);
  }
  // Division 1 only. The divisions underneath were played here for a while too,
  // which doubled the feed and told a Division 4 player about a Division 4 cup
  // they had just played themselves. What the feed is for is the room above.
  // If the player played the Weekly Final themselves, that was the Weekly Final:
  // simulating a second one would put two Division 1 tables on one Saturday and
  // count the week twice in the season standing.
  const played=(CAREER.career.log||[]).some(r=>r.kind==='final' && r.day===lastFinal);
  /* ГОНКА: финал недели сыграли соседи — их копилка (ключ этого вечера) уже в досках, мир второй раз его не играет.
     Копилка уходит в конце вечера, раньше голоса за следующий день, так что к этому шагу она здесь (прогон 2025, 20.10:
     «nokey|2025-01-11» — мировой финал у того, кто не играл, поверх настоящего у сыгравших). */
  let byPeers=false;
  if(lastFinal && !played && typeof ccRaceOn==='function' && ccRaceOn()){
    const ids=((days.get(lastFinal)||[]).filter(e=>e.kind==='final').map(e=>String(e.id||'final'))).concat(['final']);
    byPeers=Object.keys(ccEvSeen()).some(k=>{ const p=k.split('|'); return p[0]===lastFinal && ids.indexOf(p[1])>=0; });
  }
  /* …А ЕСЛИ ФИНАЛ НЕДЕЛИ НЕ ИГРАЛ НИКТО ИЗ ЛЮДЕЙ, его в гонке считает старший комнаты, остальные берут копилку. Комната
     финала собирается из СВОЕЙ таблицы сезона (cr.table), а она у каждого своя: прогон 2025 (20.10, окно 20.03–10.04) —
     мировой финал 31.03 у троих с тремя разными полями и деньгами («nokey|2025-03-31»). Ключ копилки — «день|wfinal|d1». */
  if(lastFinal && !played && !byPeers){
    const peerIds=(typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceLive==='function' && ccRaceLive() && typeof CC_RACE_PEERS!=='undefined')
      ? Object.keys(CC_RACE_PEERS).filter(k=>CC_RACE_PEERS[k]) : [];
    if(peerIds.length){
      const elder=[ccMpId()].concat(peerIds).sort()[0]===ccMpId();
      if(elder){
        const was=CC_EV_DELTA;
        ccEvDeltaStart(lastFinal+'|wfinal|d1');
        if(CC_EV_DELTA) CC_EV_DELTA.day=lastFinal;   // день PR у соседей — день финала, как у старшего (CC_PRIZE_DAY)
        try{ careerD1Posts(lastFinal); } finally { ccEvDeltaSend(); CC_EV_DELTA=was; }
      } else ccEvSeen();   // копилка старшего доедет актом 'res' (ccEvResApply)
    } else if(typeof ccMpTeam==='function' && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn())){
      /* КОМАНДА — так же: финал считает хозяин лобби (роль a), второй берёт копилку. Командный год 20.10 за Pixie и
         SwizzY: мировой финал 21.02 у двоих разошёлся на поле и деньгах (у каждого своя таблица сезона на момент шага). */
      if(ccMpRole()==='a'){
        const was=CC_EV_DELTA;
        ccEvDeltaStart(lastFinal+'|wfinal|d1');
        if(CC_EV_DELTA){ CC_EV_DELTA.day=lastFinal; CC_EV_DELTA.alone=true; }
        try{ careerD1Posts(lastFinal); } finally { ccEvDeltaSend(); CC_EV_DELTA=was; }
      }
    } else careerD1Posts(lastFinal);
  }
  // Чужие регионы играют свой финал в любом случае — свой вечер их не отменяет.
  if(lastFinal) careerRegionsWeek(lastFinal);
  // Хиты Мейджора идут по одному в день, и те, что не твои, играет мир.
  // Ласт Ченс — там же: если игрок прошёл раньше, день у него пустой.
  for(let d=fromISO; d<toISO; d=ccAddDays(d,1)){ ccMajorWorldHeats(d); ccMajorWorldLcq(d); }
  // Соседние хиты круга Reload — в любой из дней до финала, но не в твой вечер.
  ccRelWorldHeats();
  // И финалы, в которых игрока нет, — играются и платят. См. careerWorldFinals.
  careerWorldFinals(fromISO, toISO);
}
/* Мир играет и платит финалы без игрока: финал Мейджора, финалы Reload, Саммит,
   Париж, Ласт Ченс Глобалов и Глобалы. Иначе их денег не было в доске призовых.
   Пройденный день с таким вечером без своей записи в журнале играется комнатой:
   те же сборщики поля с заглушкой вместо игрока (как ccMajorWorldHeats), те же
   очки, выплаты, ПР-доска и строка о победителе. Один раз на день и вид
   (cr.worldPaid[день|вид]); журнал игрока не пишется. */
/* ВЕЧЕР МИРА СЧИТАЕТСЯ ОДИНАКОВО У ВСЕХ.

   Турниры, в которых игрока нет, мир играет сам — и играл их НЕСЕЯНЫМ броском:
   у каждой вкладки свои победители и свои призовые. В гонке это видно прямо на
   доске: прогон 2024 на шестерых, 22 сентября, — Chico за 22 турнира $91 475 у
   одного и $9 475 у другого при одинаковом числе вечеров, и так 444 строки из
   616. Жалоба («доска призовых расходится») — про это же.

   Финал недели Д1 рядом (careerWorldD1) уже сеется датой; здесь то же самое,
   только соль — общий сид мира (ccWorldSeed: в гонке он от старшего комнаты) и
   ключ турнира. Бросок остаётся тем же по распределению — меняется только его
   источник, — зато один и тот же у всех шестерых и переживает перезагрузку.
   Общий поток вечера (CC_MP_SEED) при этом не тратится: мир считает своим. */
function ccWorldRun(key, fn){
  const rnd=careerRng(ccHashStr('world|'+((typeof ccWorldSeed==='function') ? ccWorldSeed() : '')+'|'+key));
  const was=Math.random;
  Math.random=rnd;
  try{ return fn(); } finally{ Math.random=was; }
}
function careerWorldFinals(fromISO, toISO){
  const cr=CAREER && CAREER.career; if(!cr) return 0;
  const me=(typeof careerCard==='function') ? careerCard() : null; if(!me) return 0;
  const log=cr.log||[];
  const paid=cr.worldPaid=cr.worldPaid||{};
  const drafted=[me].concat(careerMates().filter(Boolean));
  const stubOf=()=>({name:'-', pow:0, squad:[], _stub:true, isYou:true, stagePts:0});
  const rank=f=>f.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0));
  let played=0;
  /* Ключ — турнир, а не день: финал мейджора и Глобалы идут два дня, платят раз.
     «Свой» вечер — запись того же вида и того же сезона в трёх днях от этого. */
  const play=(day, id, kind, label, build, games, pts, kill, prize, meta, done)=>{
    const key=cr.season+'|'+id;
    if(paid[key]) return;
    if(log.some(r=>r.kind===kind && r.season===cr.season && (r.stage==null || r.stage==='final') &&
                   Math.abs(ccDaysBetween(r.day, day))<=3)){ paid[key]=1; return; }
    /* ГОНКА: этот финал сыграл сосед — его копилка уже в досках (уходит в конце вечера, раньше голоса за день).
       Мир второй раз его не играет: прогон 2025 (20.10) — финал Мейджора 1 15.02 сыграли двое, третий досчитал
       его за мир и принял обе копилки сверху, «nokey|2025-02-15» на 50 строк. */
    /* И В КОМАНДЕ: соло-финал Мейджора 2020 года сыграл один из двоих (личный вечер, копилка напарнику), а второй
       досчитывал тот же финал за мир сам — со своим полем, и Power Ranking у двоих разошёлся на сотню строк (онлайн-прогон
       2020 года, 21.10, Major 2 16.08). */
    if((typeof ccRaceOn==='function' && ccRaceOn()) || (typeof ccMpTeam==='function' && ccMpTeam())){
      const days=careerYearDays();
      const byPeers=Object.keys(ccEvSeen()).some(k=>{ const p=k.split('|'); if(!p[0] || Math.abs(ccDaysBetween(p[0], day))>3) return false;
        if(p[1]==='wfin') return false;
        // Reload Championship: в календаре 'gc', у мира 'rc' — сравнение видом её не узнавало (гонка 2026, 21.08).
        if(kind==='rc') return ccFinalKindOf(p[0], p[1])==='rc';
        /* У Мейджора — только сам финал: хиты и недели той же недели — тоже 'major', и сыгранный соседом хит выдавал
           финал за сыгранный (онлайн-прогон 2019 года, 21.10: финал Season X 22.09 мир досчитал только у одного —
           «nokey|2019-09-22», 63 строки досок). */
        return (days.get(p[0])||[]).some(e=>e && String(e.id||'')===p[1] && e.kind===kind &&
          (['globals','gclc','rc'].indexOf(kind)>=0 || e.stage==='final' || /Final|_GF|Grand/i.test(String(e.id||'')))); });   // Саммит: верхняя/нижняя сетка за день-два до финала тоже не финал
      if(byPeers){ paid[key]=1; return; }
    }
    /* Копенгаген-2023: сетки пишут строки 'upper'/'lower', и мир, не найдя 'final', играл второй
       финал с выплатой всем (аудит 29.09). Финал за игроком, пока он в нём (gc23.you 'final'/'done'). */
    if(kind==='globals' && cr.gc23 && cr.gc23.season===cr.season && cr.gc23.you){
      const g=cr.gc23.you;
      if(g==='done') { paid[key]=1; return; }
      // В сетке — ждём: финал сыграет игрок. Ушёл с дня финала, не сыграв, — тогда мир.
      let lastGc=null; careerYearDays().forEach((l, iso)=>{ if(l.some(x=>x.kind==='globals') && (!lastGc || iso>lastGc)) lastGc=iso; });
      if(g!=='out' && day!==lastGc) return;
    }
    /* ОДИН РАСЧЁТ НА ВСЕХ ЛЮДЕЙ. Поле финала собирается из личной таблицы недель (ccMXGfRows и др.), и у каждого клиента
       выходил свой финал мира (онлайн-прогон 2019 года, 21.10: Season X 22.09, «nokey» — разные чемпионы и деньги). Как у
       финала недели Д1: в гонке считает старший по адресу, в команде — хозяин лобби (роль a), итог уезжает копилкой
       (ccEvResApply), остальные отмечают финал и ждут её. */
    let shareKey=null, payNo=false;
    { const raceIds=(typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceLive==='function' && ccRaceLive() && typeof CC_RACE_PEERS!=='undefined')
        ? Object.keys(CC_RACE_PEERS).filter(k=>CC_RACE_PEERS[k]) : [];
      const team=!raceIds.length && typeof ccMpTeam==='function' && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn());
      if(raceIds.length || team){
        const lead=raceIds.length ? [ccMpId()].concat(raceIds).sort()[0]===ccMpId() : ccMpRole()==='a';
        /* Финал с раскладкой после себя (Саммит → места на Глобалы, summitDone) считает каждый — раскладка нужна всем,
           но платит, как и любой финал мира, только ведущий (копилкой). Платили все, каждый своим полем: онлайн-прогон
           гонки 2026 (22.10), Summit 31.05 — oSydd $125000 у одного и ничего у другого. */
        if(!lead){ if(!done){ paid[key]=1; return; } payNo=true; }
        else shareKey=day+'|wfin|'+id;
      } }
    let room=null;
    try{ room=(build()||[]).filter(t=>t && !t._stub); }catch(e){ room=null; }
    if(!room || room.length<2) return;
    paid[key]=1;
    const wasDelta=CC_EV_DELTA;
    if(shareKey){ ccEvDeltaStart(shareKey); if(CC_EV_DELTA){ CC_EV_DELTA.day=day; CC_EV_DELTA.wkind=kind; if(typeof ccMpTeam==='function' && ccMpTeam()) CC_EV_DELTA.alone=true; } }
    let ranked=null;
    try{
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWorldRun('fin|'+key, ()=>simulateGames(room, games, pts, kill));
      ranked=rank(room);
      CC_PRIZE_DAY=day;
      if(!payNo) try{ careerMoneyAdd(ranked, prize); careerPrAdd(ranked, meta); } finally { CC_PRIZE_DAY=null; }
      CC_PRIZE_DAY=null;
    } finally { if(shareKey){ if(CC_EV_DELTA) ccWfinKeep(CC_EV_DELTA); ccEvDeltaSend(); CC_EV_DELTA=wasDelta; } }
    const w=ranked[0];
    // Финал своего Мейджора без игрока — в Историю тем, кем он сыгран (careerArchiveSeason).
    if(kind==='major' && w){
      const aw=cr.arcWorld=cr.arcWorld||{};
      aw[key]={day:day, won:ccStageSeatRow(w), top:ccStageTop(ranked, null)};
    }
    CC_POST_DAY=day;   // лента датируется днём вечера, а не днём, с которого ушёл игрок
    try{
      if(w && typeof L().ccNewsWorldWon==='function')
        careerNews('flat', 'ccNewsWorldWon', [label, ccBoardName(w.name)], {tbl:(typeof ccStageShot==='function') ? ccStageShot(ranked, w, 1, label, 0) : undefined});
    } finally { CC_POST_DAY=null; }
    if(done) try{ done(ranked); }catch(e){}
    played++;
  };
  /* Саммит, сыгранный миром, оставляет после себя те же места на Глобалы, что и сыгранный
     игроком (runCareerSummit → summitSeed.gc). Без записи Глобалы сажали статический список
     GC_SUMMIT_DUOS — без региона, с третьими с европейской доски: Acorn & Boltz приезжали в
     Антверпен с SkyJump из Европы, а не с тем, с кем ездили на Саммит. Тестер 21.09:
     «в конце второго сезона просто все триосы перемешались на глобалах». */
  const summitDone=ranked=>{
    const ok=cr.summitSeed && cr.summitSeed.season===cr.season && cr.summitSeed.size===careerSquadSize();
    const s=ok ? cr.summitSeed : (cr.summitSeed={season:cr.season, size:careerSquadSize()});
    if(!Array.isArray(s.gc) || !s.gc.length) s.gc=ranked.slice(0, ccTeams(SUMMIT_GC_SLOTS)).map(ccStageSeatRow);
  };
  const lobbyCr=Object.assign({}, cr, {division:1});
  for(let d=fromISO; d<toISO; d=ccAddDays(d,1)){
    // Кубок наций: квалификации всех зон и финал — без игрока тоже. См. ccNatWorldPlay.
    if(typeof ccNatWorldPlay==='function') try{ ccNatWorldPlay(d, play, stubOf); }catch(e){}
    // Финал мейджора — из тех, кто прошёл хиты и Ласт Ченс (мир их уже сыграл).
    const mj=careerMajorOn(d);
    if(mj && mj.yx && mj.stage==='final'){
      const spx=ccMXSpec(mj.yx, mj.n);
      ccWithEventSize(spx.size, ()=>play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccMXWorldFinalRoom(mj.yx, mj.n, drafted, lobbyCr),
           spx.finalGames||12, majorPoints, CC_M24_KILL, p=>ccMXPrize(mj.yx, mj.n, p), {div:1, kind:'major', stage:'final'}));
    }
    else if(mj && mj.y21 && mj.stage==='final'){
      play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccM21WorldFinalRoom(ccM21Of(mj.n), drafted, lobbyCr, mj.n),
           CC_M21.final.games, majorPoints, CC_M24_KILL, majorPrize, {div:1, kind:'major', stage:'final'});
    }
    else if(mj && mj.y22 && mj.stage==='final'){
      play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccM22WorldFinalRoom(ccM22Of(mj.n), drafted, lobbyCr),
           CC_M22.final.games, majorPoints, CC_M24_KILL, majorPrize, {div:1, kind:'major', stage:'final'});
    }
    else if(mj && mj.y23 && mj.stage==='final'){
      play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccM23WorldFinalRoom(ccM23Of(mj.n), drafted, lobbyCr),
           CC_M23.final.games, majorPoints, CC_M24_KILL, majorPrize, {div:1, kind:'major', stage:'final'});
    }
    else if(mj && mj.y24 && mj.stage==='final'){
      play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccM24WorldFinalRoom(ccM24Of(mj.n), drafted, lobbyCr),
           CC_M24.final.games, majorPoints, CC_M24.final.kill, majorPrize, {div:1, kind:'major', stage:'final'});
    }
    else if(mj && mj.stage==='final'){
      const st=ccScaleStage(ccMajorStageSpec('final', mj.n));
      // Финал Мейджора 2 без игрока раздаёт места на Глобалы своему региону так же, как с ним (cr.gcSeed, runCareerMajor).
      const gcDone=mj.n!==2 ? null : ranked=>{
        const slots=ccTeams(MAJOR2_GC_SLOTS[ccCareerRegion()]||0);
        if(slots && !(cr.gcSeed && cr.gcSeed.season===cr.season))
          cr.gcSeed={season:cr.season, size:careerSquadSize(), reg:ccCareerRegion(), m2:ranked.slice(0, slots).map(ccMajorSeatRow)};
      };
      play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccMajorFinalRoom(stubOf(), lobbyCr, drafted, mj, st, CC_FIELD_SHARP.final),
           st.games, st.pts||majorPoints, st.kill, ccMajorIsShowdown(mj.n) ? showdownPrize : majorPrize, {div:1, kind:'major', stage:'final'}, gcDone);
    }
    // Финал круга Reload — из тех, кто вышел из хитов (ccRelWorldHeats).
    const rl=careerReloadOn(d);
    if(rl && rl.stage==='final'){
      const st=ccScaleStage(CC_RELOAD_STAGE.final);
      play(d, 'reload'+rl.series, 'reload', rl.label||'Reload', ()=>ccRelRoom(stubOf(), drafted, lobbyCr, rl, st, false, CC_FIELD_SHARP.heats),
           st.games, reloadCareerPoints(rl.set), st.kill, p=>relStagePrize('final', p), {div:1, kind:'reload', stage:'final'});
    }
    // Саммит — финал, зал по своим досок регионов.
    const sm=careerSummitOn(d);
    if(sm && sm.stage==='final'){
      const st=ccScaleStage(CC_SUMMIT_STAGE.final);
      play(d, 'summit', 'summit', sm.label||'Summit', ()=>careerSummitField('final', stubOf(), drafted),
           st.games, st.pts||majorPoints, st.kill, summitPrize, {div:1, kind:'summit', stage:'final'}, summitDone);
    }
    // Глобалы — один зал на весь мир.
    const gl=careerGlobalsOn(d);
    if(gl){
      play(d, 'globals', 'globals', gl.label||'Global Championship', ()=>careerGlobalsField(stubOf(), drafted, null),
           CC_GLOB_GAMES, majorPoints, CC_GLOB_KILL, gcPrize, {div:1, kind:'globals', stage:'final'});
    }
    // Ласт Ченс Глобалов — финал.
    const lc=careerGclcOn(d);
    if(lc && lc.final){
      const st=ccScaleStage(CC_GCLC_FINAL);
      play(d, 'gclc', 'gclc', lc.label||'Last Chance', ()=>careerCupField(lobbyCr, drafted, ccTeams(CC_GCLC_FINAL.teams), null, false, CC_FIELD_SHARP.globals),
           st.games, majorPoints, st.kill, gclcPrize, {div:1, kind:'gclc', stage:'final'});
    }
    // Париж — финал Reload Championship.
    const rc=careerRcOn(d);
    if(rc && rc.stage==='final'){
      play(d, 'rc', 'rc', rc.label||'Reload Championship', ()=>ccRcField(cr, lobbyCr, drafted, 'final', ccTeams(CC_RC_FINAL.teams)),
           CC_RC_FINAL.games, rcPoints, CC_RC_KILL, rcPrize, {div:1, kind:'rc', stage:'final'});
    }
  }
  return played;
}
/* «Следующий день» в команде — голос, как «играть» и «пропустить».

   Отчёт (страница «neeww»): «СЛЕДУЮЩИЙ ДЕНЬ не нажимается» —
   в команде день двигает только сервер, и кнопка молча делала ничего. Отзыв тем же вечером: «пусть там тоже будет 0/2». Так и сделано: нажатие
   — голос за сегодняшний день, на кнопке n/2, и день сдвигается у обоих от
   одного и того же второго голоса (эхо сервера, как у пропуска). Второй
   клиент к этому моменту может ещё не дойти до кнопки — его голос догонит.

   Голос за ДЕНЬ, а не «готов»: у 'ready' сервер заводит вечер с сидом, и
   пара «один хочет спать, второй хочет играть» столкнулась бы двумя разными
   действиями от одного 'start'. */
let CC_MP_NEXT={day:null, mine:false, theirs:false};
/* Перемотка календаря в команде — по ДВУМ подтверждениям.

   Отзыв: «в календаре можно сделать, чтоб мотать для двоих
   два подтверждения». Раньше перемотка в команде была закрыта целиком
   (ccMpNoFf): день двигает только сервер, а вечер ждёт обоих. Теперь это
   голос за дату: один выбирает день, второй видит предложение и
   подтверждает — и перемотка запускается у обоих на одну и ту же дату.
   Внутри неё всё как в живой игре: турнирные вечера идут через гейт и
   барьеры (оба «готовы» автоматически, оба под общим пропуском, ответы —
   первый вариант, как в одиночной перемотке), а пустые дни оба шагают сами
   по одному и тому же календарю — окно CC_MP_DAY_DUE открывается на каждый
   такой шаг. Предложение живёт один день: голос за вчерашнюю дату глух. */
let CC_MP_FF={day:null, until:null, mine:false, theirs:false, who:{}};
/* И В ГОНКЕ ТОЖЕ — по голосам всех в комнате. Отчёт: «нажал календарь
   промотать карьеру, у одного только матается и нет подтверждения 0/3». Дверь
   перемотки в гонке была одиночной: день в гонке общий (ccRaceHold), а перемотка
   уходила одна, и комната разъезжалась по дням. Теперь голос за дату — тот же, что
   у команды, только считает по одному на человека (who), как пропуск. */
/* КТО ОТСТАЛ ПО КАЛЕНДАРЮ. Перемотка ждала комнату только в СВОЙ турнирный день, а пустые
   дни каждый шагал сам. У кого турниров в эти тридцать дней меньше, тот убегал вперёд:
   Скриншот — на телефоне сводка «30 дней пропущено» уже на экране, а на компьютере
   в это время идёт пятая игра вечера трёхнедельной давности. Теперь календарь один: день
   закрывается, когда комната на нём или дальше. Ушедшего насовсем ждём не дольше потолка,
   как и на турнирном дне. */
function ccRaceFfBehind(){
  if(typeof ccRaceFfOn!=='function' || !ccRaceFfOn()) return 0;
  const today=careerToday();
  return ccRaceRivals().filter(p=>p && p.day && p.day<today && ccRacePeerAlive(p)).length;
}
function ccRaceFfOn(){
  return !ccMpOn() && typeof ccRaceLive==='function' && ccRaceLive() &&
         typeof ccRaceRivals==='function' && ccRaceRivals().length>0;
}
/* Голосуют ВСЕ, кто в гонке (прислал строку и не вышел), а не только «живые по пульсу»:
   вкладка соседа в фоне получает пульс раз в минуту и дольше, за 90 с считалась ушедшей — и
   единственный голос уводил перемотку одному (отчёт: «первый в том дне, второй там,
   где был»). Ушедший по-настоящему приходит как bye и из списка выпадает. */
function ccMpFfHumans(){ return ccMpOn() ? CC_MP_HUMANS : (1+ccRacePeers().filter(p=>p && p.card).length); }
function ccMpFfVotes(){ return (CC_MP_FF.mine?1:0)+Object.keys(CC_MP_FF.who||{}).length; }
function ccMpFfPending(){
  return (CC_MP_FF.day===careerToday() && CC_MP_FF.until) ? CC_MP_FF : null;
}
function ccMpFfPropose(until){
  if(!(ccMpOn() || ccRaceFfOn()) || typeof MP==='undefined' || !MP.act || !until) return false;
  const p=ccMpFfPending();
  if(p && p.mine && p.until===until) return true;      // уже голосовал
  MP.act('ff', {by:ccMpId(), day:careerToday(), until:until});
  return true;
}
function ccMpFfDecline(){
  if(!(ccMpOn() || ccRaceFfOn()) || typeof MP==='undefined' || !MP.act) return;
  MP.act('ffno', {by:ccMpId(), day:careerToday()});
}
function ccMpFfSaw(p){
  if(!p || !p.day || p.day!==careerToday() || !p.until) return;
  if(CC_MP_FF.day!==p.day || CC_MP_FF.until!==p.until)
    CC_MP_FF={day:p.day, until:p.until, mine:false, theirs:false, who:{}};
  if(p.by===ccMpId()) CC_MP_FF.mine=true;
  else { CC_MP_FF.theirs=true; CC_MP_FF.who=CC_MP_FF.who||{}; if(p.by) CC_MP_FF.who[p.by]=true; }
  if(CC_MP_FF.mine && ccMpFfVotes()>=ccMpFfHumans()){
    const until=CC_MP_FF.until;
    CC_MP_FF={day:null, until:null, mine:false, theirs:false, who:{}};
    CH_FF_ASK=null;
    careerFastForward(ccFfDays(until), until);
    return;
  }
  careerRenderHub();
}
function ccMpFfNoSaw(p){
  if(!p || p.day!==careerToday()) return;
  CC_MP_FF={day:null, until:null, mine:false, theirs:false, who:{}};
  CH_FF_ASK=null;
  careerRenderHub();
}
/* Предложение напарника — плашка с двумя кнопками; своё ожидание — строка. */
/* Напарник впереди по календарю (по пульсу), а мы не в вечере — можно
   догнать: попросить его состояние команды, в нём и день. */
function ccMpCatchUpHTML(){
  const hb=(typeof MP!=='undefined' && MP.peerHb) || null;
  if(!hb || !hb.day || !ccMpOn() || CC_MP_RAND || !(hb.day>careerToday())) return '';
  return '<div class="cal-ask cc-mp-ff"><span>'+esc(L().ccMpCatchUp(ccDayLabel(hb.day)))+'</span>'+
         '<button class="ch-sign" onclick="ccMpCatchUp()">'+esc(L().ccMpCatchUpBtn)+'</button></div>';
}
function ccMpCatchUp(){
  if(!ccMpOn() || typeof MP==='undefined' || !MP.act) return;
  MP.act('syncreq', {by:ccMpId(), day:careerToday()});
}
function ccMpFfOfferHTML(){
  const p=ccMpFfPending();
  if(!p || (typeof CC_FF!=='undefined' && CC_FF)) return '';
  if(p.theirs && !p.mine)
    return '<div class="cal-ask cc-mp-ff"><span>'+esc(L().ccMpFfOffer(ccDayLabel(p.until)))+'</span>'+
           '<button class="ch-sign" onclick="careerFfToDay(\''+p.until+'\')">'+esc(L().ccMpFfYes)+'</button>'+
           '<button class="cc-back" onclick="ccMpFfDecline()">'+esc(L().ccMpFfNo)+'</button></div>';
  if(p.mine && ccMpFfVotes()<ccMpFfHumans()){
    // «1/2» в строке — счёт голосов; на N человек он свой (гонка втроём: 1/3, 2/3).
    const txt=String(L().ccMpFfWait(ccDayLabel(p.until))).replace('1/2', ccMpFfVotes()+'/'+ccMpFfHumans());
    return '<div class="cal-ask cc-mp-ff"><span>'+esc(txt)+'</span>'+
           '<button class="cc-back" onclick="ccMpFfDecline()">'+esc(L().ccDecline)+'</button></div>';
  }
  return '';
}
function ccMpNextTag(){
  // В гонке та же подпись: день закрывается вдвоём, значит и счёт голосов
  // на кнопке тот же. См. ccRaceHold.
  if(typeof ccRaceLive==='function' && ccRaceLive() && !ccMpOn())
    return ' '+ccRaceVotes()+'/'+ccRaceOf();
  if(!ccMpOn() || typeof MP==='undefined') return '';
  const v=(CC_MP_NEXT.day===careerToday()) ? ((CC_MP_NEXT.mine?1:0)+(CC_MP_NEXT.theirs?1:0)) : 0;
  return ' '+v+'/'+CC_MP_HUMANS;
}
function ccMpNextSaw(p){
  if(!p || !p.day || p.day!==careerToday()) return;
  if(CC_MP_NEXT.day!==p.day) CC_MP_NEXT={day:p.day, mine:false, theirs:false};
  if(p.by===ccMpId()) CC_MP_NEXT.mine=true; else CC_MP_NEXT.theirs=true;
  if(CC_MP_NEXT.mine && CC_MP_NEXT.theirs){
    CC_MP_NEXT={day:null, mine:false, theirs:false};
    CC_MP_DAY_DUE=true;                    // окно на один шаг, как после close
    careerAdvanceTo(ccAddDays(careerToday(), 1));
  }
  // Голос напарника и сам шаг дня не уводят с вкладки, где ты сейчас.
  careerRenderHub((typeof CH_TAB!=='undefined' && CH_TAB) || 'centre');
}
function careerNextDay(){
  if(ccMpOn() && typeof MP!=='undefined' && MP.act){
    if(CC_MP_NEXT.day===careerToday() && CC_MP_NEXT.mine) return;   // уже голосовал
    MP.act('nextday', {by:ccMpId(), day:careerToday()});
    return;
  }
  /* Ошибка дня не должна вешать страницу — см. CC_DAY_ERR в панели дня. */
  const was=careerToday();
  try{
    careerAdvanceTo(ccAddDays(careerToday(), 1));
    CC_DAY_ERR=null;
  }catch(e){
    CC_DAY_ERR={day:was, text:String((e && e.message) || e)};
    console.error('careerNextDay сломался на '+was+':', e);
  }
  careerRenderHub('centre');
  // Новый день начинается сверху страницы: перерисовка хранит прокрутку, и шапка с днём оставалась за краем.
  ccHubToTop();
}
/* Нажатие «Следующий день». Тестер 10.10: «нажимаю следующий день и у меня
   просто сайт зависает» (телефон, 2023-й, все шесть по 99). Некоторые дни
   тяжёлые: 13.10.2023 мир доигрывает весь отборочный год под поле Global
   Championship (ccGcSimYear) — 1,8 с на десктопе, на телефоне во много раз
   дольше, а экран всё это время стоял как был, без ответа на нажатие. Каждое
   следующее нажатие вставало в очередь и считало ещё один день. Теперь кнопка
   сразу гаснет с подписью, расчёт идёт следующим тиком (чтобы подпись успела
   нарисоваться), повторные нажатия до конца шага не принимаются.
   careerNextDay остаётся синхронным — его зовут харнессы и перемотка. */
let CC_DAY_BUSY=false;
function careerNextDayTap(btn){
  if(CC_DAY_BUSY) return;
  if(ccMpOn()) return careerNextDay();             // голос мгновенный, держать нечего
  CC_DAY_BUSY=true;
  if(btn){ btn.disabled=true; btn.classList.add('ch-busy'); btn.textContent=L().ccDayBusy; }
  setTimeout(function(){
    try{ careerNextDay(); }
    finally{ CC_DAY_BUSY=false; }
  }, 40);
}
// Последняя упавшая попытка шагнуть день: {day, text}. Живёт до следующего
// удачного шага и нарочно не сохраняется — это состояние экрана, а не карьеры.
let CC_DAY_ERR=null;

/* The shop.

   Prize money buys the things that make a training day worth more. Which is
   where separating prize money from wages finally pays: below Division 1 a
   career lives on its contract and buys nothing, and the first desk is the first
   sign the winning has started.

   train is a multiplier on every day activity, read from one place so a new
   item never has to be wired into seven of them. Nothing here touches a
   tournament directly — gear does not win games, it makes practice count. */
/* The desk is real gear at its real price, and the prices are the ones on the
   photos in devices/ — a player who knows what a 360Hz Zowie costs should find
   the same number here. What each is worth to a career is scaled off that
   price rather than invented per item: the whole desk, bought out, is the
   +135% it always was.

   The three PCs are one slot, not three purchases: a rig replaces a rig, so
   buying the PRO build after the budget one pays the difference in training,
   and the budget box reads "have better" once something above it is in. */
/* Device skill on the card. The four devices are slots like the chair, each rung adds a small skill (1-2 points)
   to the attribute it serves: mouse AIM, monitor CLU, keyboard endgame builds, headset hearing, PC consistency.
   Points show on the attributes and feed the engine but don't move the rating.
   The step up is skill only: rank 2 keeps rank 1's training bonus so progression doesn't speed up; check-career-shop
   holds the full desk at +55%. */
const CC_SHOP=[
  /* Shop desk items as ladders, one per device, priced and ranked by the product-shot filenames;
     items without a picture were dropped. Training stays flat so the desk still sums to +55%
     (check-career-shop). Each rung adds a point of its device's skill; chairs give stamina,
     stream gear audience, cars only reach. Old ids are reused so existing saves keep their items. */
  // Mice — AIM. The hand's half of the game.
  {id:'mouse',    cost:160,   train:0.05, img:'mouse-sl2.png',        slot:'mouse', rank:1, skill:{aim:1}, tier:'m'},
  {id:'mouse2',   cost:180,   train:0.05, img:'mouse-viper4.webp',    slot:'mouse', rank:2, skill:{aim:2}, tier:'m'},
  {id:'mouse3',   cost:200,   train:0.05, img:'mouse-ultralightx.jpg',slot:'mouse', rank:3, skill:{aim:3}, tier:'f'},
  // Keyboards — END. The builds that decide an endgame.
  {id:'keyboard', cost:200,   train:0.05, img:'keyboard-apex.jpg',    slot:'keyboard', rank:1, skill:{end:1}, tier:'m'},
  {id:'keyboard2',cost:220,   train:0.05, img:'keyboard-w80he.webp',  slot:'keyboard', rank:2, skill:{end:2}, tier:'m'},
  {id:'keyboard3',cost:250,   train:0.05, img:'keyboard-w60he2.webp', slot:'keyboard', rank:3, skill:{end:3}, tier:'f'},
  {id:'keyboard4',cost:400,   train:0.05, img:'keyboard-custom.webp', slot:'keyboard', rank:4, skill:{end:4}, tier:'f'},
  // Headsets — SUR. Hearing the fight before seeing it.
  {id:'headset',  cost:200,   train:0.05, img:'headset-bsv3.jpg',     slot:'headset', rank:1, skill:{sur:1}, tier:'m'},
  {id:'headset2', cost:400,   train:0.05, img:'headset-maxwell.webp', slot:'headset', rank:2, skill:{sur:2}, tier:'f'},
  {id:'headset3', cost:900,   train:0.05, img:'headset-lcdgx.jpg',    slot:'headset', rank:3, skill:{sur:3}, tier:'f'},
  {id:'headset4', cost:2000,  train:0.05, img:'headset-lcd3.webp',    slot:'headset', rank:4, skill:{sur:4}, tier:'f'},
  // Monitors — CLU. What you can actually see in a clutch.
  {id:'monitor',  cost:500,   train:0.10, img:'monitor-2566k.webp',   slot:'monitor', rank:1, skill:{clu:1}, tier:'m'},
  {id:'monitor2', cost:650,   train:0.10, img:'monitor-2566xp.webp',  slot:'monitor', rank:2, skill:{clu:2}, tier:'m'},
  {id:'monitor3', cost:1000,  train:0.10, img:'monitor-2586xp.webp',  slot:'monitor', rank:3, skill:{clu:3}, tier:'f'},
  {id:'monitor4', cost:1200,  train:0.10, img:'monitor-pg248qp.jpg',  slot:'monitor', rank:4, skill:{clu:4}, tier:'f'},
  // PCs — CON. Frames are consistency.
  {id:'pcbudget', cost:500,   train:0.10, img:'pc-budget.jpg', slot:'pc', rank:1, skill:{con:1}, tier:'b'},
  {id:'pcpro',    cost:1500,  train:0.20, img:'pc-pro.jpg',    slot:'pc', rank:2, skill:{con:2}, tier:'m'},
  {id:'pcelite',  cost:3000,  train:0.30, img:'pc-elite.jpg',  slot:'pc', rank:3, skill:{con:3}, tier:'f'},
  /* Консоли и мобильные — лесенкой, как ПК: одно устройство на платформу, следующая ступень заменяет прежнюю. Любая
     ступень открывает капы своей платформы (ccConsoleOk); con — сила на консольном вечере, mob — на мобильном (кадры
     и экран). Цены магазинные, con/mob решение, не замер. Фото с сайтов производителей. */
  {id:'ps4',     cost:300, img:'console-ps4-shop.jpg',     slot:'ps',   rank:1, unlock:'ps',   con:0, tier:'b'},
  {id:'ps5',     cost:500, img:'console-ps5-shop.jpg',     slot:'ps',   rank:2, unlock:'ps',   con:1, tier:'m'},
  {id:'ps5pro',  cost:700, img:'console-ps5pro-shop.jpg',  slot:'ps',   rank:3, unlock:'ps',   con:2, tier:'f'},
  {id:'xboxone', cost:300, img:'console-xboxone-shop.jpg', slot:'xbox', rank:1, unlock:'xbox', con:0, tier:'b'},
  {id:'xboxs',   cost:380, img:'console-xboxs-shop.jpg',   slot:'xbox', rank:2, unlock:'xbox', con:1, tier:'m'},
  {id:'xbox',    cost:500, img:'console-xbox-shop.jpg',    slot:'xbox', rank:3, unlock:'xbox', con:2, tier:'f'},
  /* Мобильные двумя ветками, как PlayStation и Xbox (его «разделение андроид или айфон»): любая открывает мобильные капы,
     сила на мобиле — лучшая из купленных (ccMobileDevBonus). Последние модели ноября 2026, цены США: S26 Ultra и
     iPhone 18 Pro Max по $1299, iPad Pro M5 13" $1499 после июньского подорожания. */
  {id:'phonebase', cost:449,  img:'phone-android-shop.jpg',  slot:'android', rank:1, unlock:'mobile', mob:0, tier:'b'},
  {id:'s26u',      cost:1299, img:'phone-s26u-shop.jpg',     slot:'android', rank:2, unlock:'mobile', mob:2, tier:'f'},
  // Планшет Android (его «а планшет андроид»): Galaxy Tab S12 Ultra, в продаже с 7.10.2026 за $1399. Фото S12 на Commons
  // ещё нет, на картинке S11 Ultra того же корпуса (без таблички с названием).
  {id:'tabultra',  cost:1399, img:'tablet-tabultra-shop.jpg', slot:'android', rank:3, unlock:'mobile', mob:3, tier:'f'},
  {id:'phone',     cost:1299, img:'phone-iphone18-shop.jpg', slot:'ios',     rank:1, unlock:'mobile', mob:2, tier:'f'},
  {id:'ipad',      cost:1499, img:'tablet-ipadm5-shop.jpg',  slot:'ios',     rank:2, unlock:'mobile', mob:3, tier:'f'},
  /* Стартовый набор (его слово 23.11: «стандартные самые дешёвые девайсы в начале карьеры»): у всех с первого дня, без
     силы и без тренировки (CC_DEV_STARTER), в магазине не продаются. */
  {id:'mouse0',    cost:0, img:'mouse-g102-shop.jpg',      slot:'mouse',    rank:0, starter:true, tier:'b'},
  {id:'keyboard0', cost:0, img:'keyboard-k120-shop.jpg',   slot:'keyboard', rank:0, starter:true, tier:'b'},
  {id:'mpad0',     cost:0, img:'mpad-g240-shop.jpg',       slot:'mpad',     rank:0, starter:true, tier:'b'},
  {id:'headset0',  cost:0, img:'headset-stinger2-shop.jpg',slot:'headset',  rank:0, starter:true, tier:'b'},
  {id:'monitor0',  cost:0, img:'monitor-office-shop.jpg',  slot:'monitor',  rank:0, starter:true, tier:'b'},
  {id:'pc0',       cost:0, img:'pc-old-shop.jpg',          slot:'pc',       rank:0, starter:true, tier:'b'},
  {id:'ctl0',      cost:0, img:'ctl-ds4-shop.jpg',         slot:'ctl',      rank:0, starter:true, tier:'b'},
  {id:'mctl0',     cost:0, img:'mctl-ipega-shop.jpg',      slot:'mctl',     rank:0, starter:true, tier:'b'},
  {id:'mcool0',    cost:0, img:'mcool-memo-shop.jpg',      slot:'mcool',    rank:0, starter:true, tier:'b'},
  {id:'chair00',   cost:0, img:'chair-frosta-shop.jpg',    slot:'chair',    rank:0, starter:true, tier:'b'},
  {id:'stream0',   cost:0, img:'stream-c270-shop.jpg',     slot:'stream',   rank:0, starter:true, tier:'b'},
  // Больше моделей ПК-девайсов, каталогом (cat): тренировка как у первой ступени слота, навык по классу. Решение, не замер.
  {id:'mg305',     cost:50,  train:0.05, img:'mouse-g305-shop.jpg',  slot:'mouse', rank:1, cat:true, tier:'b', skill:{aim:1}},
  {id:'mda3',      cost:90,  train:0.05, img:'mouse-da3-shop.jpg',   slot:'mouse', rank:2, cat:true, tier:'m', skill:{aim:2}},
  {id:'mx2v2',     cost:95,  train:0.05, img:'mouse-x2v2-shop.jpg',  slot:'mouse', rank:2, cat:true, tier:'m', skill:{aim:2}},
  {id:'mec2cw',    cost:150, train:0.05, img:'mouse-ec2cw-shop.jpg', slot:'mouse', rank:2, cat:true, tier:'m', skill:{aim:2}},
  {id:'kg413',     cost:60,  train:0.05, img:'keyboard-g413-shop.jpg',     slot:'keyboard', rank:1, cat:true, tier:'b', skill:{end:1}},
  {id:'ka75',      cost:90,  train:0.05, img:'keyboard-a75-shop.jpg',      slot:'keyboard', rank:1, cat:true, tier:'b', skill:{end:1}},
  {id:'kk70max',   cost:230, train:0.05, img:'keyboard-k70max-shop.jpg',   slot:'keyboard', rank:2, cat:true, tier:'m', skill:{end:2}},
  {id:'khuntsman', cost:250, train:0.05, img:'keyboard-huntsman-shop.jpg', slot:'keyboard', rank:2, cat:true, tier:'m', skill:{end:2}},
  {id:'hcloud3',   cost:100, train:0.05, img:'headset-cloud3-shop.jpg',  slot:'headset', rank:1, cat:true, tier:'b', skill:{sur:1}},
  {id:'hdt990',    cost:160, train:0.05, img:'headset-dt990-shop.jpg',   slot:'headset', rank:2, cat:true, tier:'m', skill:{sur:2}},
  {id:'hgprox2',   cost:250, train:0.05, img:'headset-gprox2-shop.jpg',  slot:'headset', rank:2, cat:true, tier:'m', skill:{sur:2}},
  {id:'hnovapro',  cost:350, train:0.05, img:'headset-novapro-shop.jpg', slot:'headset', rank:2, cat:true, tier:'m', skill:{sur:2}},
  {id:'mo24g2',    cost:180, train:0.10, img:'monitor-24g2-shop.jpg',    slot:'monitor', rank:1, cat:true, tier:'b', skill:{clu:1}},
  {id:'movg259',   cost:250, train:0.10, img:'monitor-vg259-shop.jpg',   slot:'monitor', rank:1, cat:true, tier:'b', skill:{clu:1}},
  {id:'moxl2546x', cost:500, train:0.10, img:'monitor-xl2546x-shop.jpg', slot:'monitor', rank:2, cat:true, tier:'m', skill:{clu:2}},
  {id:'moaw2524h', cost:650, train:0.10, img:'monitor-aw2524h-shop.jpg', slot:'monitor', rank:3, cat:true, tier:'f', skill:{clu:3}},
  /* Каталог девайсов (его слово 23.11: «больше выбор, разные компании и ценовые категории»). Покупаются в любом порядке,
     на турнир идёт выбранный во вкладке «Девайсы» или лучший. Цены США на конец 2026, сила решение, не замер. */
  {id:'ps4pro',   cost:350,  img:'console-ps4pro-shop.jpg',   slot:'ps',   rank:1, unlock:'ps',   con:0, tier:'b'},
  {id:'ps5dig',   cost:450,  img:'console-ps5dig-shop.jpg',   slot:'ps',   rank:2, unlock:'ps',   con:1, tier:'m'},
  {id:'xboxonex', cost:350,  img:'console-xboxonex-shop.jpg', slot:'xbox', rank:1, unlock:'xbox', con:0, tier:'b'},
  {id:'xboxsxd',  cost:600,  img:'console-xboxsxd-shop.jpg',  slot:'xbox', rank:3, unlock:'xbox', con:2, tier:'f'},
  {id:'a56',      cost:499,  img:'phone-a56-shop.jpg',        slot:'android', rank:1, unlock:'mobile', mob:1, tier:'b'},
  {id:'pixel10',  cost:799,  img:'phone-pixel10-shop.jpg',    slot:'android', rank:2, unlock:'mobile', mob:1, tier:'m'},
  {id:'oneplus15',cost:899,  img:'phone-oneplus15-shop.jpg',  slot:'android', rank:2, unlock:'mobile', mob:2, tier:'m'},
  {id:'rog9',     cost:1199, img:'phone-rog9-shop.jpg',       slot:'android', rank:3, unlock:'mobile', mob:3, tier:'f'},
  {id:'xpad7',    cost:399,  img:'tablet-xpad7-shop.jpg',     slot:'android', rank:1, unlock:'mobile', mob:1, tier:'b'},
  {id:'tabs10fe', cost:499,  img:'tablet-tabs10fe-shop.jpg',  slot:'android', rank:1, unlock:'mobile', mob:1, tier:'b'},
  {id:'legion',   cost:549,  img:'tablet-legion-shop.jpg',    slot:'android', rank:2, unlock:'mobile', mob:2, tier:'m'},
  {id:'iphone16e',cost:599,  img:'phone-iphone16e-shop.jpg',  slot:'ios', rank:1, unlock:'mobile', mob:1, tier:'b'},
  {id:'iphone17', cost:799,  img:'phone-iphone17-shop.jpg',   slot:'ios', rank:1, unlock:'mobile', mob:1, tier:'m'},
  {id:'iphoneair',cost:999,  img:'phone-iphoneair-shop.jpg',  slot:'ios', rank:1, unlock:'mobile', mob:2, tier:'m'},
  {id:'ipada16',  cost:349,  img:'tablet-ipada16-shop.jpg',   slot:'ios', rank:1, unlock:'mobile', mob:1, tier:'b'},
  {id:'ipadmini', cost:499,  img:'tablet-ipadmini-shop.jpg',  slot:'ios', rank:1, unlock:'mobile', mob:2, tier:'m'},
  {id:'ipadair',  cost:599,  img:'tablet-ipadair-shop.jpg',   slot:'ios', rank:2, unlock:'mobile', mob:2, tier:'m'},
  /* Коврики, контроллеры и аксессуары для телефона - каталогом (cat), покупаются в любом порядке, на место ставятся во
     вкладке «Девайсы». Коврик - AIM на клавиатуре, контроллер - AIM и END на контроллере, аксессуар телефона - сила на
     мобиле (acc). Цены США, числа решение, не замер. */
  {id:'mpqck',     cost:30,  img:'mpad-qck-shop.jpg',       slot:'mpad', rank:1, cat:true, tier:'b', skill:{aim:1}},
  {id:'mpg640',    cost:40,  img:'mpad-g640-shop.jpg',      slot:'mpad', rank:1, cat:true, tier:'b', skill:{aim:1}},
  {id:'mpgigantus',cost:35,  img:'mpad-gigantus-shop.jpg',  slot:'mpad', rank:1, cat:true, tier:'b', skill:{aim:1}},
  {id:'mpsaturn',  cost:60,  img:'mpad-saturn-shop.jpg',    slot:'mpad', rank:2, cat:true, tier:'m', skill:{aim:2}},
  {id:'mphien',    cost:70,  img:'mpad-hien-shop.jpg',      slot:'mpad', rank:2, cat:true, tier:'f', skill:{aim:2}},
  {id:'ctlxbox',   cost:65,  img:'ctl-xbox-shop.jpg',       slot:'ctl', rank:1, cat:true, tier:'b', skill:{aim:1, end:1}},
  {id:'ctlds',     cost:75,  img:'ctl-dualsense-shop.jpg',  slot:'ctl', rank:1, cat:true, tier:'b', skill:{aim:1, end:1}},
  {id:'ctlelite',  cost:180, img:'ctl-elite-shop.jpg',      slot:'ctl', rank:2, cat:true, tier:'m', skill:{aim:3, end:2}},
  {id:'ctlwolv',   cost:200, img:'ctl-wolverine-shop.jpg',  slot:'ctl', rank:2, cat:true, tier:'m', skill:{aim:3, end:2}},
  {id:'ctledge',   cost:200, img:'ctl-edge-shop.jpg',       slot:'ctl', rank:2, cat:true, tier:'m', skill:{aim:3, end:3}},
  {id:'ctlbfg',    cost:180, img:'ctl-bfg-shop.jpg',        slot:'ctl', rank:3, cat:true, tier:'f', skill:{aim:4, end:3}},
  {id:'ctlscuf',   cost:300, img:'ctl-scuf-shop.jpg',       slot:'ctl', rank:3, cat:true, tier:'f', skill:{aim:5, end:4}},
  {id:'mctlg8',    cost:80,  img:'mctl-g8-shop.jpg',        slot:'mctl', rank:1, cat:true, tier:'b', acc:1},
  {id:'mctlbb',    cost:100, img:'mctl-backbone-shop.jpg',  slot:'mctl', rank:1, cat:true, tier:'m', acc:1},
  {id:'mctlkishi', cost:150, img:'mctl-kishi-shop.jpg',     slot:'mctl', rank:2, cat:true, tier:'f', acc:2},
  {id:'mcoolbs',   cost:40,  img:'mcool-blackshark-shop.jpg', slot:'mcool', rank:1, cat:true, tier:'b', acc:1},
  {id:'mcoolrz',   cost:60,  img:'mcool-razer-shop.jpg',    slot:'mcool', rank:1, cat:true, tier:'m', acc:1},
  /* Сетап каталогом (его слово 23.11: «и для сетапа тоже выбор»): ПК, кресла и стрим разных брендов. Ранг идёт по силе,
     чтобы «лучший купленный» оставался лучшим. Цены США, числа решение, не замер. */
  {id:'pcvictus', cost:900,  train:0.10, img:'pc-victus-shop.jpg',     slot:'pc', rank:1, tier:'b', skill:{con:1}},
  {id:'pccyber',  cost:1000, train:0.10, img:'pc-cyberpower-shop.jpg', slot:'pc', rank:1, tier:'b', skill:{con:1}},
  {id:'pclegion', cost:1400, train:0.20, img:'pc-legion-shop.jpg',     slot:'pc', rank:2, tier:'m', skill:{con:2}},
  {id:'pcstrix',  cost:1600, train:0.20, img:'pc-strix-shop.jpg',      slot:'pc', rank:2, tier:'m', skill:{con:2}},
  {id:'pcaurora', cost:2200, train:0.20, img:'pc-aurora-shop.jpg',     slot:'pc', rank:2, tier:'m', skill:{con:2}},
  {id:'pctrident',cost:3500, train:0.30, img:'pc-trident-shop.jpg',    slot:'pc', rank:3, tier:'f', skill:{con:3}},
  {id:'chtc100',  cost:300,  cap:6,  img:'chair-tc100-shop.jpg',   slot:'chair', rank:2.2, tier:'b'},
  {id:'chdx',     cost:350,  cap:7,  img:'chair-dxracer-shop.jpg', slot:'chair', rank:2.4, tier:'b'},
  {id:'chnoble',  cost:430,  cap:8,  img:'chair-noble-shop.jpg',   slot:'chair', rank:2.6, tier:'m'},
  {id:'chkaiser', cost:500,  cap:10, img:'chair-kaiser-shop.jpg',  slot:'chair', rank:2.9, tier:'m'},
  {id:'chiskur',  cost:650,  cap:12, img:'chair-iskur-shop.jpg',   slot:'chair', rank:3.4, tier:'m'},
  {id:'stkiyo',   cost:150,  reach:0.50, img:'stream-kiyo-shop.jpg',     slot:'stream', rank:1.4, tier:'b'},
  {id:'stface',   cost:170,  reach:0.60, img:'stream-facecam-shop.jpg',  slot:'stream', rank:1.6, tier:'b'},
  {id:'stwave3',  cost:150,  reach:0.80, img:'stream-wave3-shop.jpg',    slot:'stream', rank:2,   tier:'b'},
  {id:'stmv7',    cost:280,  reach:0.95, img:'stream-mv7-shop.jpg',      slot:'stream', rank:2.5, tier:'m'},
  {id:'sta6700',  cost:1400, reach:1.70, img:'stream-a6700-shop.jpg',    slot:'stream', rank:4.4, tier:'f'},
  // Chairs — stamina, from a $20 start to the one people buy with prize money.
  {id:'chair0',   cost:20,    cap:2,  img:'chair-old.jpg',    slot:'chair', rank:1, tier:'b'},
  {id:'chair1',   cost:150,   cap:5,  img:'chair-ikea.jpg',   slot:'chair', rank:2, tier:'b'},
  {id:'chair',    cost:550,   cap:10, img:'chair-titan.webp', slot:'chair', rank:3, tier:'m'},
  {id:'chairvm',  cost:1000,  cap:15, img:'chair-vantum.jpg', slot:'chair', rank:4, tier:'f'},
  {id:'chairhm',  cost:2000,  cap:20, img:'chair-embody.webp',slot:'chair', rank:5, tier:'f'},
  // The desk that stands and the rooms that are not products.
  {id:'desk',     cost:700,   cap:8,  img:'desk.jpg'},
  {id:'camp',     cost:1000,  train:0.45, img:'camp.jpg', wide:true, days:30},
  {id:'fitness',  cost:2000,  cap:15, img:'gym.jpg', wide:true},
  // The stream corner — audience, from a webcam to a cinema camera.
  {id:'streamcam', cost:70,   reach:0.35, img:'stream-c920.jpg',     slot:'stream', rank:1, tier:'b'},
  {id:'streamkit', cost:150,  reach:0.80, img:'stream-quadcast.webp',slot:'stream', rank:2, tier:'b'},
  {id:'streamdeck',cost:150,  reach:1.10, img:'stream-deck.jpg',     slot:'stream', rank:3, tier:'b'},
  {id:'streamlab', cost:1000, reach:1.50, img:'stream-zve10.jpg',    slot:'stream', rank:4, tier:'m'},
  {id:'streamfx',  cost:3900, reach:2.20, img:'stream-fx3.jpg',      slot:'stream', rank:5, tier:'f'},
  /* The cars — confidence, his word for it. A car does not make anybody aim
     better, so it pays into nothing a training day touches. What it does is
     hold the floor: form runs from -3 to +3 and lands straight on the team's
     strength, and a bad fortnight used to take the whole -3. Confidence lifts
     the bottom of that — a Revuelto owner never tilts below -0.5 — and never
     the top, because the car stops the spiral and wins nothing itself. */
  {id:'car1', cost:8000,   conf:0.5, img:'car-golf-used.avif', slot:'car', rank:1, wide:true},
  {id:'car2', cost:35000,  conf:1.0, img:'car-gti.png',        slot:'car', rank:2, wide:true},
  {id:'car3', cost:80000,  conf:1.5, img:'car-m3.jpg',         slot:'car', rank:3, wide:true},
  {id:'car4', cost:250000, conf:2.0, img:'car-911.webp',       slot:'car', rank:4, wide:true},
  {id:'car5', cost:600000, conf:2.5, img:'car-revuelto.png',   slot:'car', rank:5, wide:true}
];
/* Coaches are people you hire, not shop items, and get their own tile beside the duo.
   Three of them, each pays only into his own attributes, so the choice is which half of the game to grow.
   Paid monthly like the bootcamp: the best is $2,500/month vs $600 for 10th in a Weekly Final, and below Division 1 nothing pays. When the month runs out, training drops back to the desk alone. */
const CC_COACH_DAYS=30;
/* Coaches are real people from the scene (20, with handle and who they work with). Specialty is read off their
   own description: rotations/endgame gets the endgame pair, mechanics/VOD review the aim pair, a list of champions
   all six (head coach).
   Prices are the mode's, $2,500-$3,500 a month, ordered by pedigree (8 FNCS + 2 Globals top, Grand Finals middle,
   specialist bottom); not real fees.
   chem: a duo coach speeds how the pair gels, see careerChem. `at` is the handle, `photo` a file in PHOTO_DIR,
   null until it exists (falls back to initials). */
const CC_COACHES=[
  /* Первый по списку, и это не оценка на глаз: 82 100 подписчиков и ростер,
     перечисленный в его же шапке — Kami, charyy, Rapid, Clix, Rise, Muz, Kaan,
     Faded, Peterbot, Pollo. Условия ему, как и всем, назначит место
     (ccCoachRankTerms); чему учит — строки нет, значит все шесть. */
  {id:'bloodx', name:'Bloodx',     at:'BloodxEU',     reg:'EU',    cost:3500, train:0.35, keys:ATTR_KEYS.slice(), chem:0.4, photo:'BloodxEU.jpg'},
  // The top of the list: eight FNCS and two Globals, and the roster of people
  // he works with is most of Division 1.
  {id:'raz',    name:'RazZzero0o', at:'RazZzero0oFN', reg:'EU',    cost:3500, train:0.30, keys:ATTR_KEYS.slice(), chem:0.4, photo:'RazZzero0oFN.jpg'},
  {id:'f0x',    name:'Coach F0x',  at:'Coach_F0x',    reg:'EU',    cost:3500, train:0.30, keys:ATTR_KEYS.slice(), chem:0.3, photo:'Coach_F0x.jpg'},
  {id:'sven',   name:'Sven',       at:'SvenSE_',      reg:'EU',    cost:3500, train:0.28, keys:ATTR_KEYS.slice(), chem:0.4, photo:'SvenSE_.jpg'},
  {id:'tallami',name:'Tallami',    at:'tallami1',     reg:'LATAM', cost:3000, train:0.28, keys:ATTR_KEYS.slice(), chem:0.3, photo:'tallami1.jpg'},
  // Specialists: what their own line says they teach.
  // The duo record is his own line — an FNCS duo win and five seconds, and the
  // pairs he works with — so he sits with the heads rather than the specialists.
  {id:'dias',   name:'Coach Dias', at:'diaspaulin_',  reg:'BR',    cost:3000, train:0.30, keys:ATTR_KEYS.slice(), photo:'diaspaulin_.jpg'},
  {id:'rabid',  name:'Rabid',      at:'Rabidfn',      reg:'NA',    cost:3000, train:0.30, keys:ATTR_KEYS.slice(), photo:'Rabidfn.jpg'},
  /* Ссылка: x.com/Thomas5x_. Сама страница X снаружи не
     читается; что о нём известно из поисковой выдачи по профилю — канадец,
     19 лет, «1x Globals champion», «pro coaching in bio». Игрок-коуч без
     строки о том, что именно он учит, — значит, всё шесть, как у остальных
     генералистов, и без химии: пар, с которыми он работает, нигде не названо.
     Регион по стране — NA. Аватарка снята с X (unavatar) 3 сентября. */
  // Отзыв («добавляй у всех»): стоит на плитке в любой карьере — pin, см. ccCoachShortlist.
  {id:'thomas5x',name:'Thomas5x',  at:'Thomas5x_',    reg:'NA',    cost:3000, train:0.30, keys:ATTR_KEYS.slice(), photo:'Thomas5x_.jpg', pin:true},
  /* The specialists, and every one of them costs the same.

     His call, 18 August. Which means the rate has to be the same too: at one
     price a coach worth +35% simply beats a coach worth +28%, and a list where
     one row is strictly better than another is not a choice, it is a right
     answer with decoration around it. So they are one price and one rate, and
     what separates them is the only thing that should — which two of the six
     they teach. That is also where this file started: the original pair of
     specialists were both $2,500 at +35%. */
  {id:'storm',  name:'Stormyrite', at:'stormyrite',   reg:'EU',    cost:2500, train:0.35, keys:['aim','clu'], photo:'stormyrite.jpg'},
  {id:'spidryx',name:'Spidryx',    at:'spidryx',      reg:'NA',    cost:2500, train:0.35, keys:['aim','con'], photo:'spidryx.jpg'},
  {id:'boop',   name:'Boop',       at:'BoopNL_',      reg:'EU',    cost:2500, train:0.35, keys:['end','sur'], photo:'BoopNL_.jpg'},
  {id:'esteh',  name:'Esteh',      at:'CoachEsteh',   reg:'LATAM', cost:2500, train:0.35, keys:['con','exp'], photo:'CoachEsteh.jpg'},
  {id:'zykoma', name:'Zykoma',     at:'ZykomaTV',     reg:'NA',    cost:2500, train:0.35, keys:['aim','exp'], photo:'ZykomaTV.jpg'},
  {id:'at0m',   name:'At0m',       at:'At0m_GG',      reg:'EU',    cost:2500, train:0.35, keys:['clu','con'], photo:'At0m_GG.jpg'},   // EU-коуч (его поправка 7.10: «атом это EU коач»), раньше стоял ME
  /* His own bio, 18 August: "Aim guy, Fortnite coach/analyst" — which is the
     two halves of what he teaches, said by him. No region on the profile and no
     picture in what was saved, so both are left empty rather than guessed; the
     tile draws initials until a file turns up. */
  {id:'tsknows',name:'TSknows',    at:'PeanutBrainTS',reg:null,    cost:2500, train:0.35, keys:['aim','exp'], photo:'PeanutBrainTS.jpg'},
  // Organisational rather than individual: he ran a roster at the EWC, which is
  // the duo half of the job.
  /* Five more coaches, specialisms read off their own bios.
     Gripey lists three duos he coaches: chemistry plus team breadth. Egexjerg names one duo: same, one duo deep.
     Val ("Coach Performance, Mental & Physical Trainer"): the trainer archetype, stamina and nerve.
     kha0rz and Xplot say nothing specific, so they get the standard specialist price/rate on their scenes' known strengths until they publish more. */
  {id:'gripey', name:'Coach Gripey',at:'Gripeyy',    reg:'EU',    cost:3000, train:0.28, keys:ATTR_KEYS.slice(), chem:0.4, photo:'Gripeyy.jpg'},
  {id:'val',    name:'Val',        at:'ValentaynL',  reg:'EU',    cost:2500, train:0.35, keys:['con','sur'], photo:'ValentaynL.jpg'},
  {id:'egex',   name:'Egexjerg',   at:'EgeXJerG',    reg:'EU',    cost:2500, train:0.35, keys:['aim','sur'], chem:0.2, photo:'EgeXJerG.jpg'},
  {id:'khaorz', name:'kha0rz',     at:'kha0rz',      reg:'EU',    cost:2500, train:0.35, keys:['aim','clu'], photo:'kha0rz.jpg'},
  {id:'xplot',  name:'Xplot',      at:'xpl0t',       reg:'EU',    cost:2500, train:0.35, keys:['end','exp'], photo:'xpl0t.jpg'},
  /* Ссылка: x.com/Flaireeeee. Европа и генералист — отзыв. Значит цена и ставка как у Rabid и Thomas5x, и все шесть
     характеристик: строки о том, ЧЕМУ именно он учит, сюда не приезжало, а
     выдумывать её нельзя — то же правило, по которому её не выдумали kha0rz и
     Xplot выше. Химии нет по нему же: пар, с которыми он работает, не названо.

     Аватарка у него не своя — на ней Пеп Гвардиола. Спросил 25 сентября,
     ответ: «ставь как есть». Лицо с иксов, как у всех на этом списке. */
  {id:'flaire', name:'Flaire',     at:'Flaireeeee',  reg:'EU',    cost:3000, train:0.30, keys:ATTR_KEYS.slice(), photo:'Flaireeeee.jpg'},
  /* Ссылка: x.com/CoachNassimm, Европа — отзыв. Строки о
     том, чему именно он учит, сюда не приезжало, значит все шесть и без химии,
     по тому же правилу, что у Flaire, kha0rz и Xplot выше. Цену и ставку ему,
     как и всем, назначит место в списке (ccCoachRankTerms). */
  {id:'nassim', name:'Coach Nassim', at:'CoachNassimm', reg:'EU', cost:3000, train:0.30, keys:ATTR_KEYS.slice(), photo:'CoachNassimm.jpg'},
  /* DestinysJesus — категория Coaches на Liquipedia, курс «Solos Masterclass FNCS Edition» про файты (его слово 8.10).
     Учеников и титулов в описании нет — рейтинг по подписчикам (ccCoachRatingOf). Учит стрельбе и клатчам. */
  {id:'destiny', name:'DestinysJesus', at:'DestinysJesus', reg:'NA', cost:3000, train:0.30, keys:['aim','clu'], photo:'DestinysJesus.jpg'},
  /* x.com/coachAchille — сам попросился (Notion 12.10). В описании: «coach 🇮🇹 | Coach for Encar | I work/ed with
     raffabozz_, robymasterato, kijarssf» — Италия, Европа. Чему учит, не сказано — все шесть и без химии, как Flaire
     и Nassim; рейтинг по подписчикам (56 на 12.10.2026). Аватарка 400×400 оттуда же. */
  {id:'achille', name:'Achille', at:'coachAchille', reg:'EU', cost:2500, train:0.28, keys:ATTR_KEYS.slice(), photo:'coachAchille.jpg'},
  /* x.com/CoachDashura (Notion 20.10, его «ещё нужно добавить коуча»). Описание: «18 · Fortnite Coach @PoyoEsports · @PixelzMNG»,
     раньше Head Academy во FLC, работал с FataL — Европа. Чему учит, не сказано — все шесть и без химии, как Nassim и Achille;
     рейтинг по подписчикам (1 065 на 20.10.2026). Аватарка 400×400 оттуда же.
     21.10 (Notion, его «обнови рейтинг коуча»): прислал, с кем работает — Wozah и Nova_fnr (финал дивизиона 1, июнь 2026),
     Quix (вышел в heats, январь 2026). Теперь рейтинг по результатам (CC_COACH_RES): p — карточки Мейджора 2 2026 у троих
     (Quix 81, Nova 79, Wozah 78 → 79.3), титулов как коуча нет; FataL в базе только тёзка из NAW 2020 — не считается. */
  {id:'dashura', name:'Dashura', at:'CoachDashura', reg:'EU', cost:2500, train:0.28, keys:ATTR_KEYS.slice(), photo:'CoachDashura.jpg'}
];
/* Coaches follow list order too. Their numbers live in their own rows and get copied into the save
   on hire, so the rows are set here once before anything reads them. Ranges as before:
   $3,500 to $2,500, 35% to 28%, duo chemistry 0.4 to 0. What each coach teaches comes from
   his own line and isn't touched. */
/* РЕЙТИНГ КОУЧА — из результатов, а где их нет — из аудитории (его «вот и сделай зп и рейтинг их», 8.10).
   Результаты — по его же описанию в X (сняты 8.10.2026): t — титулы как коуча (FNCS 1, Global/LAN/EWC 2),
   p — средний рейтинг четырёх лучших, с кем он работает сейчас, по картам этой базы. Рейтинг = p + t/2 − 6
   (у F0x игроков в описании нет — p берётся 85), от 60 до 95. Без результатов — 60 + 6·lg(подписчики/1000),
   не выше 76: коуч без подтверждённых результатов не встаёт выше того, у кого они есть. Формула — оценка режима. */
const CC_COACH_RES={RazZzero0oFN:{t:12, p:95.3}, Thomas5x_:{t:7, p:97.3}, SvenSE_:{t:2, p:96}, BloodxEU:{t:0, p:98.3}, Gripeyy:{t:2, p:94}, PeanutBrainTS:{t:0, p:94.5}, tallami1:{t:3, p:91}, Coach_F0x:{t:3, p:null}, Flaireeeee:{t:0, p:83.8}, CoachDashura:{t:0, p:79.3}};
function ccCoachRatingOf(c){
  const r=c && CC_COACH_RES[c.at];
  if(r) return Math.max(60, Math.min(95, Math.round((r.p!=null ? r.p : 85)+r.t*0.5-6)));
  const f=(c && CC_COACH_X[c.at])||500;
  return Math.max(60, Math.min(76, Math.round(60+6*Math.log10(Math.max(1000, f)/1000))));
}
/* ЦЕНА ПО РЕЙТИНГУ, ШИРОКО (17.10, его «цены коучей нужно поменять»). Было $2 500…3 500 у всех: при зарплате
   дивизиона 3 в $100 и дивизиона 2 в $300 коуч внизу недоступен вовсе, а в первом дивизионе ($500…15 000) копеечный,
   и лучший коуч был всего на 40% дороже самого слабого. Теперь $300 (рейтинг 60) … $8 000 (95) по квадрату: слабый
   коуч по карману со второго-третьего дивизиона, топовый стоит как хорошая зарплата первого. Сила и химия — прежние. */
const CC_COACH_TOP={cost:8000, train:0.35, chem:0.4};
const CC_COACH_LOW={cost:300, train:0.28, chem:0};
(function ccCoachRankTerms(){
  const span=(a,b,k)=>b+(a-b)*k;
  // Зарплата и сила — от рейтинга (60 → нижняя, 95 → верхняя), а не от места в списке.
  CC_COACHES.forEach(c=>{
    c.rating=ccCoachRatingOf(c);
    const k=Math.max(0, Math.min(1, (c.rating-60)/35));
    const cost=span(CC_COACH_TOP.cost, CC_COACH_LOW.cost, k*k);
    c.cost  = cost<1000 ? Math.round(cost/50)*50 : Math.round(cost/100)*100;
    c.train = Math.round(span(CC_COACH_TOP.train, CC_COACH_LOW.train, k)*100)/100;
    const chem=Math.round(span(CC_COACH_TOP.chem, CC_COACH_LOW.chem, k)*10)/10;
    if(chem>0) c.chem=chem; else delete c.chem;
  });
})();

/* Three of them on the tile, not twenty.

   The screen shows the choice side by side because the choice is the point, and
   a wall of twenty buttons is not a choice. Drawn on the season and the career's
   own region, so the shortlist is stable all year and a career sees the people
   who work where it plays — with one from outside, because the best coach in the
   world takes a call from anywhere. */
function ccCoachShortlist(){
  const cr=CAREER.career;
  const on=ccCoach();
  const rnd=careerRng(ccHashStr('coach|'+(cr.season||1)+'|'+ccCareerRegion()));
  const reg=ccCareerRegion()==='EU' ? 'EU' : ccCareerRegion()==='BR' ? 'BR'
          : ccCareerRegion()==='NAC'||ccCareerRegion()==='NAW' ? 'NA' : null;
  const pick=[], seen=new Set();
  const take=list=>{ const p=list.slice();
    for(let i=p.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; }
    p.forEach(c=>{ if(pick.length<3 && !seen.has(c.id)){ pick.push(c); seen.add(c.id); } }); };
  // The one already hired always stays on the tile, or paying him again would
  // mean hunting for him.
  if(on){ pick.push(on); seen.add(on.id); }
  // Закреплённые (pin) — на плитке у всех, в любом регионе; остальные два места — по жребию.
  CC_COACHES.filter(c=>c.pin && !seen.has(c.id)).forEach(c=>{ if(pick.length<3){ pick.push(c); seen.add(c.id); } });
  if(reg) take(CC_COACHES.filter(c=>c.reg===reg));
  take(CC_COACHES);
  return pick.slice(0,3);
}
// The coach working today: hired, and inside his month.
function ccCoach(){
  const c=CAREER && CAREER.coach;
  if(!c || careerToday()>c.until) return null;
  return CC_COACHES.find(x=>x.id===c.id)||null;
}
function careerHireCoach(id, months){
  months=months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1;
  const c=CC_COACHES.find(x=>x.id===id); if(!c) return false;
  const cr=CAREER.career;
  // The one already working is not re-hired mid-month; when his month is out
  // the same button pays for the next one.
  if(ccCoach() && ccCoach().id===id) return false;
  // A club that promised to carry your coach pays the month; you still choose
  // which one, because that is your career and not theirs.
  const pays=ccOrgPaysCoach();
  const due=ccStaffTermCost(c.cost, months);
  if(!pays && (cr.balance||0)<due) return false;
  if(!pays) cr.balance-=due;
  CAREER.coach={id:c.id, from:careerToday(), until:ccAddDays(careerToday(), ccStaffTermDays(months)), months, cost:c.cost};
  careerNews('good', 'ccNewsCoach', [L()['ccCoach'+c.id]]);
  careerSave();
  careerRenderHub();
  return true;
}
const CC_DEVICE_DIR='devices/';
// Консоли и мобильные по порядку плитки: PS4 и Xbox One, PS5, PS5 Pro, Series S, Series X, Android, S26 Ultra, Tab S12 Ultra, iPhone 18 Pro Max, iPad Pro M5.
// What a slot already holds, by rank: a rig replaces a rig.
function ccShopSlotRank(slot){
  return CC_SHOP.reduce((r,it)=>(it.slot===slot && careerOwns(it.id) && it.rank>r) ? it.rank : r, 0);
}
// Стартовые девайсы (его слово 23.11): самые дешёвые консоли и телефон есть у всех с первого дня.
const CC_DEV_STARTER=['ps4', 'xboxone', 'phonebase', 'mouse0', 'keyboard0', 'mpad0', 'headset0', 'monitor0', 'pc0', 'ctl0', 'mctl0', 'mcool0', 'chair00', 'stream0'];
// Девайс из каталога (окно выбора, любой порядок покупки): консоли, телефоны, cat-вещи и ПК-девайсы кроме самого ПК.
const CC_DEV_CAT_SLOTS=['mouse', 'keyboard', 'headset', 'monitor', 'pc', 'chair', 'stream'];
// Кресло и стрим не надеваются: работает лучшее купленное (энергия и охват так и считались).
function ccDevWearable(key){ return key!=='chair' && key!=='stream'; }
function ccDevCatItem(x){ return !!(x && (x.unlock || x.cat || x.starter || CC_DEV_CAT_SLOTS.indexOf(x.slot)>=0)); }
function careerOwns(id){ return CC_DEV_STARTER.indexOf(id)>=0 || !!(CAREER.gear && CAREER.gear.own && CAREER.gear.own.indexOf(id)>=0); }
// Куплено ли в группе что-то кроме стартового: от этого зависит, идут ли капы платформы в календарь по умолчанию.
function ccDevBought(g){ const own=(CAREER && CAREER.gear && CAREER.gear.own)||[];
  return CC_SHOP.some(x=>own.indexOf(x.id)>=0 && CC_DEV_STARTER.indexOf(x.id)<0 && (g==='mobile' ? x.unlock==='mobile' : (x.unlock==='ps' || x.unlock==='xbox'))); }
// A career date the way the calendar writes one: "14 мар" / "14 Mar".
/* The year on screen is the season the career is in.

   His report, 17 August: he simulated into a second year and the calendar still
   said 2026. It did, and it will: only 2026 was measured, so a second career
   year replays the same calendar - the clock goes back to January and cr.season
   becomes 2, which is the note ccPlayerAge already carries. Everything internal
   is right and the one thing on screen was wrong, because the label printed the
   date's own year rather than the career's.

   So the label counts seasons: season 1 is 2026, season 2 is 2027. The dates
   underneath never move, and nothing reads this back. */
function ccShowYear(y){
  // Сдвиг — по прожитым 2026-м годам: карьера, начатая в 2025-м, во второй сезон пишет 2026, а не 2027.
  return Number(y)+ccYearShift();
}
/* The day, said the way a person says it: "пятница, 5 сентября". The mode is
   played on a calendar whose whole shape is weekdays — the cups are Monday and
   Tuesday, the Weekly Final is Saturday — and until his screenshot of 17 August
   the only place a career could read the date was the calendar screen. */
function ccDayOfWeek(iso){
  // Monday first, because the week this mode is played in starts there.
  const d=new Date(iso+'T00:00:00Z');
  return (L().calDowsFull||L().calDows||[])[(d.getUTCDay()+6)%7] || '';
}
function ccDayFull(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||''))) return String(iso||'');
  const d=new Date(iso+'T00:00:00Z');
  const month=(L().calMonthsOf||L().calMonthsShort||[])[d.getUTCMonth()]||'';
  // The comma is English and Russian; French writes "lundi 20 juillet" straight
  // through. So the join is a string the language owns, like everything else here.
  return ccDayOfWeek(iso)+L().ccDayJoin+d.getUTCDate()+' '+month;
}
function ccDayLabel(iso){
  // A save written before the messages stored days rather than labels carries
  // "7 янв" where the day should be. It is already a label: print it.
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||''))) return String(iso||'');
  const d=new Date(iso+'T00:00:00Z');
  return d.getUTCDate()+' '+L().calMonthsShort[d.getUTCMonth()];
}
// A stay that is running today, and what it is worth while it runs.
function ccStayOf(id){
  const s=CAREER && CAREER.stays ? CAREER.stays[id] : null;
  return (s && careerToday()<=s.until) ? s : null;
}
function ccStayTrain(){
  return CC_SHOP.reduce((s,it)=>s+(it.days && ccStayOf(it.id) ? it.train : 0), 0);
}
/* Bootcamp: a stay still running on the day of a Major, Global Championship, Reload final or the
   Paris Championship gives +1 form for that event (once per event, marked on the stay).
   Used to be a flat +45% on training days, which made timing irrelevant. */
const CC_CAMP_EVENTS=['major','gc','globals','summit','rc'];
const CC_CAMP_FORM=1;
function careerCampBonus(kind, tag){
  const s=ccStayOf('camp');
  if(!s || CC_CAMP_EVENTS.indexOf(kind)<0) return 0;
  s.used=s.used||{};
  const key=kind+'|'+(tag||careerToday());
  if(s.used[key]) return 0;
  s.used[key]=true;
  const cr=CAREER.career;
  cr.form=clamp((cr.form||0)+CC_CAMP_FORM, -CC_FORM_MAX, CC_FORM_MAX);
  careerNews('good', 'ccNewsCampReady', []);
  careerSave();
  return CC_CAMP_FORM;
}
function careerBuy(id, price){
  const item=CC_SHOP.find(x=>x.id===id);
  if(!item || careerOwns(id)) return false;
  const cr=CAREER.career;
  // Цена витрины дня (ccDealsToday) — только ниже обычной; без неё — как было.
  const cost=(price!=null && ccDealPrice(id)===price) ? price : item.cost;
  if((cr.balance||0)<cost) return false;
  const delta=ccShopDelta(item), name=L()['ccShop'+id]||id;
  // A stay is booked rather than bought: it runs its days and then it is over,
  // and paying again books the next one. Nothing goes onto the desk.
  if(item.days){
    if(ccStayOf(id)) return false;
    cr.balance-=cost;
    CAREER.stays=CAREER.stays||{};
    CAREER.stays[id]={from:careerToday(), until:ccAddDays(careerToday(), item.days)};
    ccShopJust('item:'+id, name, delta);
    careerSave();
    careerRenderHub('shop');
    return true;
  }
  // An upgrade in a slot pays only the difference: the old rig is replaced, not
  // stacked, so a desk cannot be worth more than the best thing standing on it.
  if(item.starter) return false;
  if(item.slot && !ccDevCatItem(item) && ccShopSlotRank(item.slot)>=item.rank) return false;   // девайсы - каталог, любой порядок
  cr.balance-=cost;
  // Купленный девайс сразу на своём месте в «Девайсах».
  if(ccDevCatItem(item) && ccDevWearable(ccDevKey(item))){ CAREER.gear=CAREER.gear||{own:[], train:0}; CAREER.gear.use=CAREER.gear.use||{}; CAREER.gear.use[ccDevKey(item)]=id; }
  careerGearAdd(item);
  // Консоль открывает консольные капы: календарь года собирается заново (ccVictoryList, CC_YEAR_DAYS).
  if(item.unlock){ CC_VICTORY_LIST=null; CC_YEAR_DAYS=null; }
  ccShopJust(item.slot ? 'slot:'+item.slot : 'item:'+id, name, delta);
  careerSave();
  careerRenderHub('shop');
  try{ ccDevModalSync(); }catch(e){}
  return true;
}
/* Вещь ложится на стол — своя покупка или подарок напарника, одним кодом. */
function careerGearAdd(item){
  const id=item.id;
  if(careerOwns(id)) return false;
  const heldOf=key=>item.slot
    ? CC_SHOP.reduce((v,x)=>(x.slot===item.slot && careerOwns(x.id) && (x[key]||0)>v) ? x[key] : v, 0)
    : 0;
  const held=heldOf('train');
  const gain=Math.max(0, (item.train||0)-held);   // слабее того, что стоит, - тренировку не убавляет
  const reachGain=Math.max(0, (item.reach||0)-heldOf('reach'));
  CAREER.gear=CAREER.gear||{own:[], train:0};
  CAREER.gear.own=(CAREER.gear.own||[]).concat(id);
  CAREER.gear.train=Math.max(0,(CAREER.gear.train||0)+gain);
  CAREER.gear.reach=Math.max(0,(CAREER.gear.reach||0)+reachGain);
  careerGearSkill();
  return true;
}
/* ПОДАРОК НАПАРНИКУ. Отзыв: «в магазине можно было в подарок
   купить что-то тимейту — купить для себя и рядом кнопка в подарок; и
   настрой может поднимать». Платит даритель, вещь едет по проводу (act
   'gift') и ложится напарнику на стол тем же careerGearAdd; в командном
   состоянии остаётся запись (cr.gifts), из которой у обоих одинаково
   считается прибавка к настрою — см. careerPatience. */
const CC_GIFT_MOOD=10, CC_GIFT_DAYS=30, CC_GIFT_MOOD_CAP=25;
function ccPeerOwns(id){
  const p=(typeof MP!=='undefined' && MP.peer) || null;
  return !!(p && Array.isArray(p.gear) && p.gear.indexOf(id)>=0);
}
function ccGiftMood(){
  const cr=CAREER && CAREER.career; if(!cr || !Array.isArray(cr.gifts)) return 0;
  const today=careerToday();
  let sum=0;
  cr.gifts.forEach(g=>{
    if(!g || !g.day) return;
    const d=ccDaysBetween(g.day, today);
    if(d<CC_GIFT_DAYS) sum+=CC_GIFT_MOOD*(1-d/CC_GIFT_DAYS);
  });
  return Math.min(CC_GIFT_MOOD_CAP, Math.round(sum));
}
function careerGift(id, sure){
  const item=CC_SHOP.find(x=>x.id===id);
  if(!item || item.days || !ccMpOn() || typeof MP==='undefined' || !MP.act) return false;
  const cr=CAREER.career;
  if((cr.balance||0)<item.cost || ccPeerOwns(id)) return false;
  // Сначала вопрос с ценником — деньги уходят только после «Подарить · $…».
  if(!sure){
    ccAsk(L().ccGiftAsk(item.name||id, ccNum(item.cost)), function(){ careerGift(id, true); },
          {yes:L().ccGiftYes(ccNum(item.cost))});
    return 'ask';
  }
  cr.balance-=item.cost;
  cr.gifts=(cr.gifts||[]).concat({day:careerToday(), by:hKey(careerCard()), item:id});
  if(cr.gifts.length>40) cr.gifts=cr.gifts.slice(-40);
  MP.act('gift', {by:ccMpId(), item:id, day:careerToday()});
  if(MP.peer && Array.isArray(MP.peer.gear) && MP.peer.gear.indexOf(id)<0) MP.peer.gear=MP.peer.gear.concat(id);
  careerNews('good', 'ccNewsGiftSent', [item.name||id]);
  try{ ccMpTell(L().ccGiftSent(item.name||id)); }catch(e){}
  careerSave();
  careerRenderHub('shop');
  return true;
}
function ccGiftSaw(p){
  if(!p || !p.item || p.by===ccMpId()) return;
  const item=CC_SHOP.find(x=>x.id===p.item);
  if(!item) return;
  careerGearAdd(item);
  careerNews('good', 'ccNewsGiftGot', [item.name||p.item]);
  try{ ccMpTell(L().ccGiftGot(item.name||p.item)); }catch(e){}
  if(typeof MP!=='undefined' && MP.sendCard) MP.sendCard();   // у напарника теперь видно, что вещь есть
  careerSave();
  careerRenderHub();
}
/* What is newly within reach: on the desk, not owned, and costing more than
   the balance stood at the last time the shop was open. So a payday that puts
   the first rig in reach marks itself, and nothing is marked twice — the mark
   is cleared by looking, which is what careerTab does when the tab opens. */
function careerShopNew(){
  const cr=CAREER.career, bal=cr.balance||0, seen=cr.shopSeen||0;
  return CC_SHOP.filter(it=>{
    if(careerOwns(it.id)) return false;
    if(it.days && ccStayOf(it.id)) return false;
    if(it.slot && ccShopSlotRank(it.slot)>=it.rank) return false;
    return it.cost<=bal && it.cost>seen;
  });
}
function careerShopSeen(){
  const cr=CAREER.career;
  cr.shopSeen=Math.max(cr.shopSeen||0, cr.balance||0);
  careerSave();
}
/* Newly affordable item on the main screen: photo, name, effect, price vs balance, marked NEW. One item, the best
   affordable, otherwise it's a shop again.
   Must work without motion: the player runs Chrome with reduced motion, so the shine sits behind a no-preference
   guard and the tile is fine without it. */
function careerShopPeek(){
  const fresh=careerShopNew();
  if(!fresh.length) return null;
  // The best of them: what a career would actually walk towards. Cost is the
  // honest ordering — the shop is priced by what a thing is worth.
  const pick=fresh.slice().sort((a,b)=>b.cost-a.cost)[0];
  return {item:pick, more:fresh.length-1};
}
function careerShopPeekHTML(){
  const peek=careerShopPeek();
  if(!peek) return '';
  const it=peek.item, cr=CAREER.career;
  const shot=it.img ? '<img class="cc-peek-img'+(it.wide?' cc-peek-img-wide':'')+
    '" src="'+CC_DEVICE_DIR+it.img+'" alt="" loading="lazy" onerror="this.remove()">' : '';
  const gain=it.cap ? L().ccShopCap+' +'+it.cap
                    : L().ccShopTrain+' +'+Math.round((it.train||0)*100)+'%';
  return '<button class="ch-tile cc-peek" onclick="careerTab(\'shop\')">'+
    '<span class="cc-peek-tag">'+L().ccShopNew+'</span>'+
    shot+
    '<div class="cc-peek-in">'+
      '<em>'+L().ccPeekKicker+'</em>'+
      '<b>'+L()['ccShop'+it.id]+'</b>'+
      '<i>'+gain+'</i>'+
      '<div class="cc-peek-buy"><span>$'+ccNum(it.cost)+'</span>'+
        '<u>'+L().ccPeekOf(ccNum(cr.balance||0))+'</u></div>'+
      (peek.more>0 ? '<div class="cc-peek-more">'+L().ccPeekMore(peek.more)+'</div>' : '')+
    '</div></button>';
}
/* Moving: buy a shorter ping to Frankfurt (Baku is 89ms, ~6 points of close-range edge).
   livesIn is where the career lives, country is where it's from; cards, roster and leaderboards
   read country, a move never changes it. Price is monthly rent charged on the 1st beside wages;
   going home is free. Only offered to a built player: careerCard gives the ping edge to nobody else. */
/* ---- Which region a career competes in --------------------------------------

   The mode was Europe with the word EU written into eight functions: the cards,
   the roster, the snapshot pools, the clubs, the list of real names. Every one
   of the other six regions is in PLAYERS already and always was - Epic runs the
   same season in all of them, so North America has its own 299-player Play-In,
   its own clubs and its own ladder sitting in this file untouched.

   So the region is the career's, and every one of those caches is keyed by it.
   A save with no region is Europe, which is every save that exists, so nothing
   about a career already in progress changes. */
function ccCareerRegion(){
  // Чужая неделя играется как чужая: см. ccAsRegion.
  if(CC_REGION_AS) return CC_REGION_AS;
  /* While the creation screen is up it is the one asking, so the card list, the
     clubs and the pools follow the region being chosen there rather than the
     region of whatever career happens to still be in memory. Read off the screen
     rather than off a flag, because that is the same thing the player is looking
     at and it cannot fall out of step with it. */
  if(typeof document!=='undefined'){
    const cs=document.getElementById('screen-career-create');
    if(cs && cs.classList.contains('active') && typeof CC!=='undefined' && CC && CC.region)
      return CC.region;
  }
  /* В командной карьере регион — командный: лобби у обоих одно, и строится
     оно из пула ОДНОГО региона. Ставит его создатель команды, напарнику он
     приезжает вместе с днём (см. CC_TEAM_KEYS). Личный region игрока при этом
     остаётся его — он про жильё, пинг и переезд. */
  if(CAREER && CAREER.career && CAREER.career.mp && CAREER.career.mp.code &&
     CAREER.career.region) return CAREER.career.region;
  if(CAREER && CAREER.player && CAREER.player.region) return CAREER.player.region;
  return 'EU';
}
function ccLivesIn(){ const pl=CAREER.player; return pl.livesIn || pl.country; }
/* What a region costs to live in, and what it does to a connection.

   The rents are the same class of number CC_RENT holds - an average month,
   approximate and said so. The ping is not a number at all: the ping table is
   Europe measured to Frankfurt, and a career that has moved to North America is
   not far from Frankfurt, it is playing on a different server. Living in the
   region you compete in is a local connection, which is what CC_PING_HOME is,
   and it is deliberately not Germany's one millisecond - being in the region is
   not being next to the building.

   So moving region is never the cheap way to buy a connection: Germany is
   $1,000 for the same edge and keeps the roster you know. What it buys is a
   different scene - another 2,900 cards, another set of clubs, another ladder -
   and it costs you the one you had. */
/* Six under the ruler: living in the region you compete in is a local
   connection, not a rack in the building.

   It was ten against a table whose best country read 1, which made "home"
   quietly the worst connection anybody could have. On the ruler the best
   country reads 1 to 3 and the median of a region is around twenty, so six is
   what being local is worth — better than almost everywhere and not better than
   next door to the datacentre. */
const CC_PING_HOME=6;
const CC_REGION_RENT={NAC:1500, NAW:2000, BR:400, ASIA:900, ME:1200, OCE:1500};
// Выезд на кап чужого региона (ccAwayPlay): {reg, ms, pen} на один вечер, иначе null.
let CC_AWAY=null;
function ccPingNow(){
  if(CC_AWAY) return CC_AWAY.ms;   // на чужом сервере пинг до него, а не до своего
  const pl=CAREER.player;
  /* Outside Europe the ping used to be one number for the whole continent,
     because a region move never said where in it you lived. Now it can — his
     ask, 20 August: pick a country inside the region and go there — so a
     career that chose one plays on that country's own ping, read off the
     region's own table. One that never chose keeps the old regional number. */
  if((pl.region||'EU')!=='EU'){
    const p=pl.livesIn ? ccPingOf(pl.livesIn, pl.region) : null;
    return p!=null ? p : CC_PING_HOME;
  }
  return pl.livesIn ? ccPingOf(pl.livesIn) : pl.countryPing;
}
/* Bought once, in one place. See the note above careerFlatBuy. */
const CC_FLATS=[
  // Фото — Wikimedia Commons, свободные лицензии; авторы подписаны под плиткой (ccFlatCredit).
  {id:'studio', m2:30,  mult:40,  cap:0,  img:'flat-studio.jpg'},
  {id:'one',    m2:45,  mult:70,  cap:5,  img:'flat-one.jpg'},
  {id:'two',    m2:70,  mult:110, cap:10, img:'flat-two.jpg'},
  {id:'three',  m2:100, mult:170, cap:16, img:'flat-three.jpg'},
  /* Дом и вилла — его просьба 15.10: «что ещё добавить в магазин, у людей много денег» (верх «Игроков сайта»
     держит по $10M, а дороже трёшки за $68–340K тратить было не на что). Цена тем же правилом — месяцы аренды
     места: дом $0,3–1,4M, вилла $1,2–6M. Запас сил растёт ступенями поменьше, чем деньги: дом на 4 больше трёшки,
     вилла ещё на 4 — это роскошь, а не тренировка. */
  {id:'house',  m2:250, mult:700,  cap:20, img:'flat-house.jpg'},
  {id:'villa',  m2:600, mult:3000, cap:24, img:'flat-villa.jpg'}
];
function ccFlatOf(id){ return CC_FLATS.find(f=>f.id===id) || null; }
// Where the career is living, as one key: a country inside Europe, a region
// outside it. What a flat is bought against, and what it is checked against.
function ccPlaceNow(){
  const pl=CAREER.player, reg=pl.region||'EU';
  // Where you live, which outside Europe is the country you picked when you
  // flew out — his line, 20 August: где живёшь, там квартира. A career that
  // moved to the continent without naming a country still buys against it.
  return reg==='EU' ? (ccLivesIn()||'de') : (pl.livesIn||reg);
}
// The month this place asks for, whether or not the career is being charged it.
function ccRentBase(place){
  const p=place||ccPlaceNow();
  return CC_REGION_RENT.hasOwnProperty(p) ? CC_REGION_RENT[p] : (ccRentOf(p)||0);
}
function ccFlatPrice(it, place){ return (it.mult||0)*ccRentBase(place); }
function ccFlat(){ return (CAREER && CAREER.flat) || null; }
// The one you are standing in, which is the only one that stops a rent.
function ccFlatHere(){ const f=ccFlat(); return f && f.place===ccPlaceNow() ? f : null; }
function ccFlatCap(){ const f=ccFlat(); return f ? ((ccFlatOf(f.id)||{}).cap||0) : 0; }
function careerFlatBuy(id){
  const it=ccFlatOf(id); if(!it) return false;
  const cr=CAREER.career, place=ccFlatPlace();
  // What is already owned in that place, which is what a bigger one replaces.
  const any=ccFlat();
  const have=any && any.place===place ? any : null;
  // A bigger place replaces the one you are in; the same one twice is nothing.
  if(have && (ccFlatOf(have.id)||{}).mult >= it.mult) return false;
  const price=ccFlatPrice(it, place);
  if((cr.balance||0)<price) return false;
  const e0=careerEnergyMax();
  cr.balance-=price;
  cr.spentOnFlat=(cr.spentOnFlat||0)+price;
  CAREER.flat={id:it.id, place:place, paid:price, on:careerToday()};
  ccShopJust('flat:'+it.id, L()['ccFlat'+it.id], careerEnergyMax()!==e0 ? [L().ccShopCap+' '+e0+' → '+careerEnergyMax()] : []);
  careerSave();
  careerRenderHub('shop');
  return true;
}
/* Career home region, written at creation; rent is what living away from it costs. Charging rent to anyone outside
   Europe broke new careers: nothing to pay by the first wage day (1 Feb), and careerMoveEvict sent them to Europe
   with the duo, club and rival.
   Named for the career because ccHomeRegion is already the draft mode's; a second function with the same name in
   this file silently replaces the first (check-multi-region catches an Oceanic Major paying EU prizes). */
function ccCareerHomeRegion(){
  const pl=CAREER && CAREER.player;
  return (pl && (pl.homeRegion || pl.cardRegion)) || 'EU';
}
function ccRentNow(){
  const pl=CAREER.player;
  // Nothing to pay in a place you own. See careerFlatBuy.
  if(ccFlatHere()) return 0;
  const reg=pl.region||'EU';
  // At home there is no lease to lose, wherever home is.
  // At home there is no lease to lose — unless you took one: an Australian
  // living in New Zealand pays New Zealand, now that a home region is a map
  // you can move around rather than one free address.
  if(reg===ccCareerHomeRegion()) return pl.livesIn ? (ccRentOf(pl.livesIn)||0) : 0;
  // A country chosen inside the region pays that country's rent; a career
  // that only ever moved to the continent keeps paying the flat.
  if(reg!=='EU') return pl.livesIn ? (ccRentOf(pl.livesIn)||CC_REGION_RENT[reg]||0)
                                   : (CC_REGION_RENT[reg]||0);
  return pl.livesIn ? (ccRentOf(pl.livesIn)||0) : 0;
}
/* Кто вообще может переехать.

   Было — только свой созданный игрок: взятая карточка живёт там, где живёт
   настоящий человек, и прибавки за пинг у неё всё равно не было, так что
   переезд ничего бы ей не дал. Оставалось только уехать на другой континент,
   и получалось странное: карточка могла перебраться в Азию, но не могла
   переехать из Франции в Германию.

   Правило: дать возможность. Переезжать может любая карьера,
   у которой есть страна, а прибавку за связь взятая карточка получает ровно
   за переезд и ровно в размере разницы — см. careerCard. */
/* Родина взятой карточки — страна настоящего человека.

   Переезд был только у построенного игрока: country/countryPing писались лишь
   на создании. Просьба игрока: «допустим из России можно
   переехать, а из Франции уже нет» — из России уезжал построенный, из Франции
   не мог уехать взятый. Гражданство на карточке и есть родина, и от неё
   переезд считается тем же путём, что у построенного (см. moved в careerCard):
   дома разница нулевая, после переезда — то, что переезд купил или отнял.
   Заполняется лениво, чтобы старые сейвы получили то же самое; страна вне
   карты пинга оставляет всё как было. */
function ccMoveHomeFill(){
  const pl=CAREER.player;
  if(!pl || pl.country!=null || !pl.nat) return;
  const ping=ccPingOf(pl.nat, pl.homeRegion||pl.region||'EU');
  if(ping==null) return;
  pl.country=pl.nat;
  pl.countryPing=ping;
}
function ccMoveMatters(){
  ccMoveHomeFill();
  const pl=CAREER.player;
  return pl && pl.country!=null;
}
// What a move is worth, in the points the card prints: the edge there against
// the edge here.
function ccMoveGain(code){
  if(ccEdgeOff(CAREER && CAREER.player)) return 0;
  return Math.round((ccPingEdge(ccPingOf(code))-ccPingEdge(ccPingNow()))*10)/10;
}
/* Which region the screen is showing, as against which one the career is in.

   His ask, 19 August: choosing where to move should light the map for the region
   you are choosing. The map could always do it — ccBuildMap takes a region and
   every one of the seven has its own — the move screen simply never passed one,
   so it drew where you already were whatever you clicked.

   And it turned the click into a look rather than a departure. A region move is
   the only thing in this mode that takes something away — the squad, the club,
   the rival — and it ran off one click of a row with nothing in between. Now the
   row shows you the place and the button under the map is the one that goes. */
let CH_MOVE=false, CH_MOVE_PICK=null, CH_MOVE_REG=null;
// Открытое превью недели в полосе сезона; клик по тому же квадратику закрывает.
let CH_WEEK_PEEK=null;
function careerWeekPeek(w){
  CH_WEEK_PEEK = (w && CH_WEEK_PEEK!==w) ? w : null;
  careerRenderHub('centre');
}
// Сортировка личного журнала; повторный клик возвращает хронологию.
let CH_LOG_SORT=null;
function careerLogSort(k){
  CH_LOG_SORT = (k && CH_LOG_SORT!==k) ? k : null;
  careerRenderHub('log');
}
/* ПЕРЕЕЗД — ОТДЕЛЬНЫМ ОКНОМ (его слово 20.10: «может при выборе страны сделать, чтоб показывало в отдельном окне,
   как вот стафф показывает»). Ряды регионов, карта стран и панель ответа стояли прямо во вкладке «Магазин» и
   раздували её на экран вниз; теперь это окно поверх, как выбор коуча (#movePickModal, та же рамка и цвета
   сезона). Содержимое собирает плитка, как и раньше, — careerRenderHub('shop') после клика по региону
   перерисовывает и окно (ccMoveModalLater), а клик по стране меняет только #ccMovePanel внутри него. */
function ccMoveModalLater(html){
  // Сразу, а не таймером: окно лежит на body, отдельно от плитки, и вставлять его можно, пока плитка ещё строится.
  ccMoveModalSync(html);
  return '';
}
function ccMoveModalSync(html){
  let m=document.getElementById('movePickModal');
  if(html==null){ if(m) m.style.display='none'; return; }
  if(!m){
    m=document.createElement('div'); m.id='movePickModal';
    m.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:230;align-items:center;justify-content:center;padding:16px;';
    m.onclick=function(e){ if(e.target===m) ccMoveModalClose(); };
    m.innerHTML='<div style="width:100%;max-width:980px;max-height:90vh;overflow-y:auto;border-radius:14px;background:var(--panel);border:1px solid var(--line);padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.6);">'+
      '<div id="movePickBody"></div><button type="button" class="cc-move-x" onclick="ccMoveModalClose()"></button></div>';
    document.body.appendChild(m);
  }
  const T=L();
  m.querySelector('.cc-move-x').textContent=T.closeBtn || T.ccMoveClose;
  document.getElementById('movePickBody').innerHTML='<h4 class="cc-pick-h">'+esc(T.ccMoveTitle)+'</h4>'+html;
  m.style.display='flex';
}
function ccMoveModalClose(){
  CH_MOVE=false; CH_MOVE_PICK=null; CH_MOVE_REG=null;
  ccMoveModalSync(null);
  careerRenderHub('shop');
}
function careerMoveOpen(){
  CH_MOVE=true;
  CH_MOVE_PICK=null;
  CH_MOVE_REG=null;
  careerRenderHub('shop');
}
// Looking at a region. The country pick belongs to the region it was made in, so
// it is dropped when the map changes underneath it.
function careerMoveShowRegion(r){
  CH_MOVE_REG = (r===ccCareerRegion() || r===CH_MOVE_REG) ? null : r;
  CH_MOVE_PICK=null;
  careerRenderHub('shop');
}
// The region the screen is drawing, which defaults to the one being lived in.
function ccMoveShownRegion(){ return CH_MOVE_REG || ccCareerRegion(); }
/* What leaving costs, under the map of the place you would be leaving for.

   The rows above price a region; this says it again beside the button that does
   it, because between the two of them is where a player decides. The warning is
   the one the rows already carry — the rating and the money come with you and
   nothing else does — said at the moment it stops being a description. */
function careerMoveGoHTML(){
  const r=CH_MOVE_REG, cr=CAREER.career;
  const rent = r==='EU' ? 0 : (CC_REGION_RENT[r]||0);
  const can = !rent || (cr.balance||0)>=rent;
  return `<div class="cc-move-go">
    <div class="ch-row"><em>${L().ccMoveRegion}</em><b>${esc(regionName(r))}</b></div>
    <div class="ch-row"><em>${L().ccMoveRent}</em><b>${
      rent?ccMoney(rent)+L().ccPerMonth:L().ccMoveHome}</b></div>
    <div class="ch-hint">${L().ccMoveRegionHint}</div>
    <button class="ch-sign"${can?'':' disabled'}
      onclick="careerMoveAsk(\'${r}\')">${L().ccMoveGo(regionName(r))}</button>
  </div>`;
}
/* Clicking a country repaints two things and rebuilds nothing.

   It used to re-render the whole tab, which is the one thing this screen cannot
   afford: the map is 45 flags fetched over the network, so a click blanked it
   and drew it again, and the panel that answered the click sat below nine
   hundred pixels of map, off the bottom of the screen. From the chair it looked
   like the map did not work at all.

   So the outline is painted onto the SVG that is already standing, and only the
   panel's contents are swapped. The panel is sticky to the bottom of the window
   while the map is open, so the answer is on screen wherever you clicked. */
function ccMoveMapClick(ev){
  if(ccMapDragged(ev)) return;
  const el=ev.target.closest('[data-code]');
  if(!el) return;
  CH_MOVE_PICK=el.getAttribute('data-code');
  ccPaintMoveMap();
  const box=document.getElementById('ccMovePanel');
  if(!box){ careerRenderHub('shop'); return; }
  box.innerHTML=careerMovePanelHTML();
  // The belt to the sticky braces: if anything ever clips this panel again, the
  // click still ends with the answer on screen. Nearest, so a panel already in
  // view does not move the page under the cursor.
  if(box.scrollIntoView) box.scrollIntoView({block:'nearest'});
}
// The selection is painted onto the built SVG rather than built into it, for the
// same reason the creation screen does it: rebuilding re-fetches 45 flags.
function ccPaintMoveMap(){
  const svg=document.querySelector('.cc-movemap .cc-map'); if(!svg) return;
  const here=ccLivesIn();
  svg.querySelectorAll('[data-code]').forEach(el=>{
    const c=el.getAttribute('data-code');
    el.classList.toggle('cc-here', c===here);
    el.classList.toggle('on', c===CH_MOVE_PICK);
  });
}
function careerMoveTo(code){
  const pl=CAREER.player, cr=CAREER.career;
  // The ping is read off the region the career actually plays in. It read the
  // EU table by name, so a career born in Oceania clicked Sydney's neighbours
  // and the button silently did nothing — every code came back null.
  const reg=pl.region||'EU';
  if(!ccMoveMatters() || ccPingOf(code, reg)==null) return false;
  if(code===ccLivesIn()) return false;
  // Your passport is home on whichever map holds it — an Australian going
  // back to Australia ends the lease the same way a German going home does.
  const home = code===pl.country;
  const rent = home ? 0 : (ccRentOf(code)||0);
  // A month up front, the way a lease is signed. It is also the guard: a career
  // that cannot cover the first month cannot cover the twelfth either.
  if(rent && (cr.balance||0)<rent) return false;
  if(rent){
    cr.balance-=rent;
    cr.rent=(cr.rent||0)+rent;
  }
  pl.livesIn = home ? null : code;
  careerNews(home?'flat':'good', home?'ccNewsMovedHome':'ccNewsMoved',
             [ccCountryName(code), ccPingOf(code, reg)]);
  careerEvent('tlMoved', [ccCountryName(code), ccPingOf(code, reg)]);
  CH_MOVE=false; CH_MOVE_PICK=null;
  careerSave();
  careerRenderHub('shop');
  return true;
}
/* The month the rent was not there. Nothing is confiscated and no debt is kept:
   the lease ends, the career is back on its own connection, and the card says so
   the same afternoon. Called from the payday, because that is where the money
   for it was supposed to be. */
/* Leaving the continent.

   Not a bigger version of the move screen - a different decision, and the only
   one in this mode that throws away what a career has built rather than adding
   to it. The people you know, the club that signed you, the duo beside you and
   the one you were racing are all Europe's, and none of them come. What arrives
   instead is a scene of the same size that has never heard of you.

   The rating comes, because that is you. The division comes, because the ladder
   is the same ladder everywhere - Epic runs one season in seven regions. And the
   money comes, because prize money is prize money.

   The first month is paid on the way in, the same as any move. */
/* Moving to a region can now name the country inside it.

   His ask, 20 August: choosing a region to move to should let you choose a
   country and go there — the way Europe already works. The country decides the
   rent and the ping (each region carries its own ping table); everything a
   region move costs a career — the squad, the club, the rival, the seat — it
   still costs, because the continent changed whatever city you landed in.
   Without a country it is the move it always was: the flat regional rent and
   the regional connection. */
/* Переезд с напарником. Карьера платит за него билет и первый месяц, как за себя, плюс перелёт,
   и он садится с настроем выше на CC_MOVE_MATE_MOOD (между обещанием, 10, и месяцем сборов, 22).
   Регион карточки не меняется: это турниры, которые он реально сыграл. Место жизни читается с карьеры. */
const CC_MOVE_FLIGHT=750, CC_MOVE_MATE_MOOD=16;
// Сколько стоит увезти команду: за каждого перелёт и его первый месяц.
function careerMoveMatesCost(rentEach){
  const n=careerMates().length;
  return n ? n*(CC_MOVE_FLIGHT+(rentEach||0)) : 0;
}
function careerMoveRegion(code, country, withMates){
  const pl=CAREER.player, cr=CAREER.career;
  const to=code==='EU' ? 'EU' : code;
  if(!CC_REGION_RENT.hasOwnProperty(to) && to!=='EU') return false;
  if(to===(pl.region||'EU')) return false;
  // A named country must be real in that region, and going home to your own
  // passport inside Europe is not a lease.
  const place=country && ccPingOf(country, to)!=null
              && !(to==='EU' && country===pl.country) ? country : null;
  const rent=to==='EU' ? (place ? (ccRentOf(place)||0) : 0)
                       : (place ? (ccRentOf(place)||CC_REGION_RENT[to]||0)
                                : (CC_REGION_RENT[to]||0));
  // Свой месяц и, если решили ехать вместе, их билеты и месяцы — одной суммой:
  // уехать с командой, но без денег на неё, значит уехать одному.
  // Онлайн напарника-человека не оставишь: переезд всегда командой, иначе регион турниров оставался прежним.
  const take=(!!withMates || ccMpTeam()) && careerMates().length>0;
  const forThem=take ? careerMoveMatesCost(rent) : 0;
  const bill=rent+forThem;
  if(bill && (cr.balance||0)<bill) return false;
  if(bill){ cr.balance-=bill; cr.rent=(cr.rent||0)+bill; }
  const from=pl.region||'EU';
  /* Место теряет тот, кто уехал один.

     Правило было проще и потому неверное: пересёк океан — место сгорело, и не
     важно, с кем. Но горит оно не из-за океана, а из-за пары: квалификацию
     выиграли двое, и лишается её тот, кто эту пару разорвал (см.
     careerSlotGiveUp, то же правило у смены напарника). Уехать вместе — это
     ровно то, за что здесь платят перелёт и первый месяц за каждого: пара
     цела, значит и место при ней.

     Правило. И оно же объясняет молчаливую пропажу, на которую
     жаловался игрок: он увёз команду с собой, а Саммит на следующий день
     оказался закрыт, причём плитка объясняла общий порядок отбора вместо того,
     что место сожгли. */
  const seat=(!take && careerSlotHeld()) ? careerSlotGiveUp() : null;
  if(seat) careerNews('bad', 'ccNewsSlotRegion', [seat.what, regionName(from)]);
  pl.region=to;
  cr.relSeed=null;   // прошедшие хит Reload — люди старого региона (см. ccRelRoom)
  // The city inside the continent, when one was named. See the note above.
  pl.livesIn=place;
  /* В команде регион ВЕЧЕРОВ — командный (cr.region, см. ccCareerRegion), и
     переезд менял только личный: «я переезжаю на другой регион с тимейтом, но
     играю на ЕУ» — отзыв. Уехали вместе — переехала команда:
     регион команды едет напарнику состоянием, кэши сцены пересобираются под
     новый пул. Уехал один — команда осталась, где играла, а переезд остаётся
     тем, чем и был: жильё и пинг. */
  if(take && ccMpTeam() && cr.region!==to){
    cr.region=to;
  }
  // Пулы сцены, клубы, лестница — под новый регион и в одиночной карьере тоже (раньше — только в команде), и
  // замены чужих ников Мейджора (ccMajorRegionSub) считаются заново.
  cr.majSub=null;
  if(typeof ccWorldReset==='function') ccWorldReset();
  // Everything that was a relationship with Europe. The duo and the rival are
  // redrawn on the next cup out of the new region's own people; the club is a
  // contract in a place you no longer live.
  const moved=take ? careerMateRecords().map(pr=>pr) : [];
  if(take){
    // Они едут теми же, кем были: та же химия, тот же счёт вечеров вместе, и
    // настрой выше — за них заплатили и они согласились.
    moved.forEach(pr=>{
      pr.patience=clamp((pr.patience==null?CAREER_PATIENCE_START:pr.patience)+CC_MOVE_MATE_MOOD, 0, 100);
      pr.movedWith=(pr.movedWith||0)+1;
    });
    CAREER.partners=moved;
    const who=careerMates().map(m=>m.handle).filter(Boolean);
    careerNews('good', 'ccNewsMovedTogether', [who.join(', '), ccNum(forThem)]);
    // И сказано это тем, за кого заплатили: разговор — там, где он живёт.
    careerMateRecords().forEach(pr=>{
      const t=pr.handle ? careerDmFind(pr.handle) : null;
      if(t) careerDmPush(t, 'them', 'dmMovedWith', [regionName(to)]);
    });
  }else{
    CAREER.partners=[];
  }
  CAREER.offers=null;
  cr.rival=null;
  if(CAREER.org){ careerNews('bad', 'ccNewsLeftRegionClub', [CAREER.org.name]); CAREER.org=null; }
  careerNews('good', 'ccNewsMovedRegion', [regionName(to), regionName(from)]);
  careerEvent('tlRegion', [regionName(to), regionName(from)]);
  CH_MOVE=false; CH_MOVE_PICK=null; CH_MOVE_REG=null;
  careerSave();
  careerRenderHub('shop');
  return true;
}
function careerMoveEvict(){
  const pl=CAREER.player;
  // A career that cannot cover the month abroad goes all the way home, which for
  // a region move means back to the continent it came from — its own, not
  // Europe's. A career from NA Central that could not afford Oceania goes back to
  // NA Central. See ccCareerHomeRegion.
  const home=ccCareerHomeRegion();
  if((pl.region||'EU')!==home){
    const was=pl.region;
    pl.region=home; pl.livesIn=null; CAREER.career.relSeed=null;
    CAREER.partners=[]; CAREER.offers=null; CAREER.career.rival=null;
    if(CAREER.org) CAREER.org=null;
    careerNews('bad', 'ccNewsRentGoneRegion', [regionName(was)]);
    return;
  }
  if(!pl.livesIn) return;
  const was=pl.livesIn;
  pl.livesIn=null;
  careerNews('bad', 'ccNewsRentGone', [ccCountryName(was), ccCountryName(pl.country)]);
}
/* Which place the flat list is being read against, when it is not the one the
   career is standing in.

   It is null almost always, and null means here. Browsing what a place costs
   somewhere else is a thing this list is for — the rents are the reason a career
   moves at all — but the browsing is a look, and a look should not outlive the
   visit: left set, it followed the player out of the shop, across a move, and
   into the next career, so the panel opened on NA West for somebody living in
   Germany and offered to buy him a flat four thousand miles from where he
   sleeps. His report, 20 August. See careerTab and careerLoad, which both put it
   back to here. */
let CH_FLAT_PLACE=null;
// One answer now: the place the career lives. The browser that let this differ
// is gone — правило, 20 August: где живёшь, там квартира.
function ccFlatPlace(){ return ccPlaceNow(); }
// Everywhere a career can hold a lease: the countries of the map, then the
// regions, each with the month it asks for. Cheapest first, because the list is
// read to find somewhere affordable.
function ccPlaceName(code){
  return CC_REGION_RENT.hasOwnProperty(code) ? regionName(code) : (ccCountryName(code)||code);
}
// Охват за объявленный фонд: фонд/20 подписчиков (через СММ, как любой охват). Трата, а не вклад.
const CC_OWN_CUP_REACH=1/20;
// В магазине — дверь в настоящий турнир (ccOwnOpen): дата, режим, допуск и фонд выбираются там, вечер играется.
function careerOwnCupHTML(){
  const T=L(), cr=CAREER.career, c=cr.ownCup||null, why=ccOwnWhy();
  const next=(cr.ownCups||[]).filter(x=>!x.off && x.day>=careerToday()).sort((a,b)=>a.day<b.day?-1:1)[0];
  // Карточка: текст и кнопка слева, кубок на свечении справа.
  return `<div class="ch-tile cc-shop own-door">
    <div class="own-door-txt">
      <h4>${T.ccOwnCupTitle}</h4>
      <p>${esc(T.ownLead)}</p>
      ${next ? `<div class="own-door-chip"><b>${esc(next.name)}</b> ${ccDayLabel(next.day)} · $${ccNum(next.pool)}</div>` : ''}
      ${c ? `<div class="own-door-chip"><b>${T.ccOwnCupLast}</b> ${ccDayLabel(c.last)} · $${ccNum(c.fund||0)}</div>` : ''}
      ${why ? `<div class="own-why">${esc(why)}</div>` : `<button class="own-door-go" onclick="ccOwnOpen()">${esc(T.ownNew)}</button>`}
    </div>
    <img class="own-door-cup" src="items/trophies/gc-2025.png" alt="" loading="lazy">
  </div>`;
}
// Фото — Wikimedia Commons, по ступени фонда: ЛАН-зал, сцена, арена. Авторы под плиткой.
const CC_CUP_CREDIT='Photos: Toffelginkgo (CC BY-SA 3.0), DJTechYT (CC BY-SA 4.0), Paul Chaloner (CC BY 2.0) — Wikimedia Commons';
/* ДЕНЬГИ БОГАТЫХ КАРЬЕР — его «делай» 15.10 на список «что ещё добавить»: мерч, благотворительность, роскошь.
   Ни одно не даёт силы (правило «баланс только по данным»): мерч — немного денег и подписчиков в месяц,
   благотворительность — подписчиков, роскошь — полку в профиле и строку «Потрачено» в «Игроках сайта». */

/* МЕРЧ. Запуск — разовая цена, дальше каждое первое число платит доля аудитории (подписчики × ставка, с потолком
   ступени) и приходит немного подписчиков. Окупается годами, а не неделями: бренд за $1M при 300K подписчиков
   даёт $30K в месяц — почти три года. Ступень заменяет ступень, как стол. */
const CC_MERCH=[
  {id:'capsule', cost:100000,  rate:0.02, cap:5000,  reach:300},
  {id:'line',    cost:400000,  rate:0.05, cap:20000, reach:1000},
  {id:'brand',   cost:1000000, rate:0.10, cap:60000, reach:3000}
];
function ccMerchOf(id){ return CC_MERCH.find(m=>m.id===id) || null; }
function ccMerchNow(){ const m=CAREER.career.merch; return m ? ccMerchOf(m.id) : null; }
function ccMerchMonthPay(){ const m=ccMerchNow(); return m ? Math.min(m.cap, Math.round(careerReach()*m.rate)) : 0; }
function careerMerchBuy(id, sure){
  const it=ccMerchOf(id), cr=CAREER.career, now=ccMerchNow();
  if(!it || (now && now.cost>=it.cost) || (cr.balance||0)<it.cost) return false;
  if(!sure){
    ccAsk(L().ccMerchAsk(L()['ccMerch_'+id], ccNum(it.cost)), function(){ careerMerchBuy(id, true); }, {yes:'$'+ccNum(it.cost)});
    return 'ask';
  }
  cr.balance-=it.cost;
  cr.merch={id:id, since:careerToday(), earned:(cr.merch&&cr.merch.earned)||0, spent:((cr.merch&&cr.merch.spent)||0)+it.cost, last:0};
  careerNews('good', 'ccNewsMerch', [L()['ccMerch_'+id]]);
  ccShopJust('merch:'+id, L()['ccMerch_'+id], ['+$'+ccNum(ccMerchMonthPay())+L().ccPerMonth]);
  careerSave();
  careerRenderHub('shop');
  return true;
}
// Первое число: зовёт careerPayWages, months — сколько первых чисел пересёк шаг.
function careerMerchMonth(months){
  const cr=CAREER && CAREER.career, m=ccMerchNow();
  if(!m || !(months>0)) return 0;
  const pay=ccMerchMonthPay()*months;
  cr.balance=(cr.balance||0)+pay;
  cr.merch.earned=(cr.merch.earned||0)+pay;
  cr.merch.last=pay/months;
  careerReachAdd(m.reach*months);
  return pay;
}
function careerMerchHTML(){
  const T=L(), cr=CAREER.career, now=ccMerchNow();
  const rows=CC_MERCH.map(it=>{
    const own=now && now.id===it.id, under=now && now.cost>it.cost;
    const can=!own && !under && (cr.balance||0)>=it.cost;
    return `<div class="cc-buy${own?' own':''}${under?' cc-buy-old':''}">
      <img class="cc-flat-img" src="${CC_DEVICE_DIR}merch-${it.id}.jpg" alt="" loading="lazy" onerror="this.remove()">
      <div class="cc-buy-in"><b>${T['ccMerch_'+it.id]}</b>
        <span>${T.ccMerchRate(Math.round(it.rate*1000)/10, ccNum(it.cap))} · +${ccFollowers(it.reach)} ${T.xFollowers}${T.ccPerMonth}</span></div>
      ${own ? `<span class="cc-owned">${T.ccFlatYours}</span>`
       : under ? `<span class="cc-owned">${T.ccShopOwnedBetter}</span>`
       : `<button class="ch-sign"${can?'':' disabled'} onclick="careerMerchBuy('${it.id}')">$${ccNum(it.cost)}</button>`}
    </div>`;
  }).join('');
  return `<div class="ch-tile cc-shop">
    <h4>${T.ccMerchTitle}</h4>
    <div class="ch-hint">${T.ccMerchHint}</div>
    ${now ? `<div class="ch-row"><em>${T.ccMerchMonth}</em><b>$${ccNum(ccMerchMonthPay())}</b></div>
             <div class="ch-row"><em>${T.ccMerchEarned}</em><b>$${ccNum(cr.merch.earned||0)}</b></div>` : ''}
    <div class="cc-buys">${rows}</div>
    <div class="cc-photo-credit">${CC_MERCH_CREDIT}</div>
  </div>`;
}
const CC_MERCH_CREDIT='Photos: Christian Heilmann (CC BY 2.0), Nielsoncaetanosalmeron (CC BY 4.0), InSapphoWeTrust (CC BY-SA 2.0) — Wikimedia Commons';

/* БЛАГОТВОРИТЕЛЬНОСТЬ. Как свой кап, только деньги уходят фонду: подписчики — взнос/25 (чуть меньше, чем кап,
   у которого есть сам турнир), новость, счётчик в профиле. Раз в 30 дней. */
const CC_CHARITY_FUNDS=[50000, 250000, 1000000];
const CC_CHARITY_DAYS=30, CC_CHARITY_REACH=1/25;
function ccCharityNext(){ const c=CAREER.career.charity; return (c && c.last) ? ccAddDays(c.last, CC_CHARITY_DAYS) : null; }
function ccCharityReady(){ const n=ccCharityNext(); return !n || careerToday()>=n; }
function careerCharity(sum, sure){
  const cr=CAREER.career;
  if(CC_CHARITY_FUNDS.indexOf(sum)<0 || (cr.balance||0)<sum || !ccCharityReady()) return false;
  if(!sure){
    ccAsk(L().ccCharityAsk(ccNum(sum)), function(){ careerCharity(sum, true); }, {yes:L().ccCharityYes(ccNum(sum))});
    return 'ask';
  }
  cr.balance-=sum;
  const got=careerReachAdd(Math.round(sum*CC_CHARITY_REACH));
  const was=cr.charity||{};
  cr.charity={last:careerToday(), n:(was.n||0)+1, spent:(was.spent||0)+sum};
  careerNews('good', 'ccNewsCharity', [ccNum(sum), ccFollowers(got)]);
  careerSave();
  careerRenderHub('shop');
  return true;
}
function careerCharityHTML(){
  const T=L(), cr=CAREER.career, c=cr.charity||null, ready=ccCharityReady();
  const rows=CC_CHARITY_FUNDS.map((sum, i)=>{
    const can=ready && (cr.balance||0)>=sum;
    return `<div class="cc-buy">
      <img class="cc-flat-img" src="${CC_DEVICE_DIR}${CC_CHARITY_IMG[i]}" alt="" loading="lazy" onerror="this.remove()">
      <div class="cc-buy-in"><b>${T.ccCharityGive('$'+ccNum(sum))}</b>
        <span>+${ccFollowers(Math.round(sum*CC_CHARITY_REACH))} ${T.xFollowers}</span></div>
      <button class="ch-sign"${can?'':' disabled'} onclick="careerCharity(${sum})">$${ccNum(sum)}</button>
    </div>`;
  }).join('');
  return `<div class="ch-tile cc-shop">
    <h4>${T.ccCharityTitle}</h4>
    <div class="ch-hint">${T.ccCharityHint}</div>
    ${c ? `<div class="ch-row"><em>${T.ccCharityTotal(c.n||1)}</em><b>$${ccNum(c.spent||0)}</b></div>` : ''}
    ${ready ? '' : `<div class="ch-row"><em>${T.ccOwnCupNext}</em><b>${ccDayLabel(ccCharityNext())}</b></div>`}
    <div class="cc-buys">${rows}</div>
    <div class="cc-photo-credit">${CC_CHARITY_CREDIT}</div>
  </div>`;
}
const CC_CHARITY_IMG=['give-1b.jpg', 'give-2.jpg', 'give-3.jpg'];
const CC_CHARITY_CREDIT='Photos: MTA New York (CC BY 2.0), Gage Skidmore (CC BY-SA 2.0), Joe Mabel (CC BY-SA 3.0) — Wikimedia Commons';

/* РОСКОШЬ. Только престиж: вещь встаёт на полку в профиле («Коллекция») и в сумму «Потрачено», которую видно
   в «Игроках сайта». Силы, энергии и подписчиков не даёт — для этого есть остальной магазин. */
const CC_LUX=[
  {id:'watch', cost:1000000,  ico:'⌚', img:'lux-watch.jpg'},
  {id:'hyper', cost:3000000,  ico:'🏎️', img:'lux-hyper.jpg'},
  {id:'yacht', cost:10000000, ico:'🛥️', img:'lux-yacht.jpg'},
  {id:'jet',   cost:25000000, ico:'✈️', img:'lux-jet.jpg'}
];
// Фото — Wikimedia Commons; авторы под плиткой (CC BY-SA требует подписи). Значок остаётся полке в профиле.
const CC_LUX_CREDIT='Photos: Alesili (CC BY-SA 3.0), MrWalkr (CC BY-SA 4.0), Benoît Prieur (CC0), Bene Riobó (CC BY-SA 4.0) — Wikimedia Commons';
function ccLuxOwns(id){ const x=CAREER.career.lux; return !!(x && (x.ids||[]).indexOf(id)>=0); }
function careerLuxBuy(id, sure, price){
  const it=CC_LUX.find(x=>x.id===id), cr=CAREER.career;
  const cost=(price!=null && ccDealPrice(id)===price) ? price : (it||{}).cost;
  if(!it || ccLuxOwns(id) || (cr.balance||0)<cost) return false;
  if(!sure){
    ccAsk(L().ccLuxAsk(L()['ccLux_'+id], ccNum(cost)), function(){ careerLuxBuy(id, true, cost); }, {yes:'$'+ccNum(cost)});
    return 'ask';
  }
  cr.balance-=cost;
  const x=cr.lux||{ids:[], spent:0};
  cr.lux={ids:(x.ids||[]).concat(id), spent:(x.spent||0)+cost};
  ccShopJust('lux:'+id, L()['ccLux_'+id], [L().ccLuxNote]);
  careerNews('good', 'ccNewsLux', [L()['ccLux_'+id]]);
  careerSave();
  careerRenderHub('shop');
  return true;
}
function careerLuxHTML(){
  const T=L(), cr=CAREER.career;
  const rows=CC_LUX.map(it=>{
    const own=ccLuxOwns(it.id), can=!own && (cr.balance||0)>=it.cost;
    return `<div class="cc-buy${own?' own':''}">
      ${it.img ? `<img class="cc-flat-img" src="${CC_DEVICE_DIR}${it.img}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="cc-lux-ico" aria-hidden="true">${it.ico}</span>`}
      <div class="cc-buy-in"><b>${T['ccLux_'+it.id]}</b><span>${T.ccLuxNote}</span></div>
      ${own ? `<span class="cc-owned">${T.ccFlatYours}</span>`
            : `<button class="ch-sign"${can?'':' disabled'} onclick="careerLuxBuy('${it.id}')">$${ccNum(it.cost)}</button>`}
    </div>`;
  }).join('');
  return `<div class="ch-tile cc-shop">
    <h4>${T.ccLuxTitle}</h4>
    <div class="ch-hint">${T.ccLuxHint}</div>
    <div class="cc-buys">${rows}</div>
    <div class="cc-photo-credit">${CC_LUX_CREDIT}</div>
  </div>`;
}
// Сколько ушло на дорогое — то, что видно в «Игроках сайта» и на полке профиля.
function ccSpentBig(){
  const cr=(CAREER && CAREER.career) || {};
  return Math.round((cr.spentOnFlat||0)+((cr.ownCup||{}).spent||0)+((cr.charity||{}).spent||0)+
                    ((cr.merch||{}).spent||0)+((cr.lux||{}).spent||0));
}
// Полка в профиле: роскошь значками, плюс благотворительность и свои капы строками. Пусто — плитки нет.
function careerCollectionHTML(){
  const T=L(), cr=CAREER.career, have=CC_LUX.filter(x=>ccLuxOwns(x.id));
  const cup=cr.ownCup, ch=cr.charity, merch=ccMerchNow();
  if(!have.length && !cup && !ch && !merch) return '';
  const row=(k, v)=>`<div class="ch-row"><em>${k}</em><b>${v}</b></div>`;
  return `<div class="ch-tile"><h4>${T.ccCollTitle}</h4>
    ${have.length ? `<div class="cc-coll">${have.map(x=>`<span title="${esc(T['ccLux_'+x.id])}">${x.ico}</span>`).join('')}</div>` : ''}
    ${merch ? row(T.ccMerchTitle, esc(T['ccMerch_'+merch.id])) : ''}
    ${cup ? row(T.ccOwnCupSpent(cup.n||1), '$'+ccNum(cup.spent||0)) : ''}
    ${ch ? row(T.ccCharityTotal(ch.n||1), '$'+ccNum(ch.spent||0)) : ''}
    ${row(T.ccCollSpent, '$'+ccNum(ccSpentBig()))}
  </div>`;
}
function careerFlatHTML(){
  const cr=CAREER.career, place=ccFlatPlace(), here=ccFlatHere(), any=ccFlat();
  const rent=ccRentBase(place);
  const living=place===ccPlaceNow();
  // What is owned in the place being looked at, which is not always the place
  // the career is standing in.
  const ownedHere=any && any.place===place ? any : null;
  const rows=CC_FLATS.map(it=>{
    const price=ccFlatPrice(it, place);
    const own=ownedHere && ownedHere.id===it.id;
    const under=(ownedHere && (ccFlatOf(ownedHere.id)||{}).mult >= it.mult) && !own;
    const can=!own && !under && (cr.balance||0)>=price;
    return `<div class="cc-buy${own?' own':''}${under?' cc-buy-old':''}">
      ${it.img ? `<img class="cc-flat-img" src="${CC_DEVICE_DIR}${it.img}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div class="cc-buy-in"><b>${L()['ccFlat'+it.id]}</b>
        <i>${L().ccFlatM2(it.m2)}${rent?' · '+L().ccFlatPays(Math.round(it.mult))+'':''}</i>
        <span>${L().ccFlatNoRent}${it.cap?' · '+L().ccShopCap+' +'+it.cap:''}</span></div>
      ${own ? `<span class="cc-owned">${L().ccFlatYours}</span>`
       : under ? `<span class="cc-owned">${L().ccShopOwnedBetter}</span>`
       : `<button class="ch-sign"${can?'':' disabled'} onclick="careerFlatBuy(\'${it.id}\')">$${
           ccNum(price)}</button>`}
    </div>`;
  }).join('');
  const away=any && !here;
  return `<div class="ch-tile cc-shop">
    <h4>${L().ccFlatTitle}</h4>
    <div class="ch-hint">${L().ccFlatHint}</div>
    <!-- One place, the one you live in. The browser this used to be offered a
         lease in every country on earth, and his call, 20 August, is the rule
         the panel already preached: где живёшь — там квартира. Moving is what
         changes where that is. -->
    <div class="ch-row"><em>${L().ccMoveWhere}</em><b>${esc(ccPlaceName(place))}</b></div>
    <div class="ch-row"><em>${L().ccMoveRent}</em><b>${
      rent ? ccMoney(rent)+L().ccPerMonth : L().ccMoveHome}</b></div>
    ${away ? `<div class="ch-hint" style="margin:6px 0 0;">${
      L().ccFlatElsewhere(L()['ccFlat'+any.id], regionName(any.place)||ccCountryName(any.place))}</div>` : ''}
    <div class="cc-buys">${rows}</div>
    ${ccHomeCampHTML()}
    <div class="cc-photo-credit">${CC_FLAT_CREDIT}</div>
  </div>`;
}
/* Буткемп у себя дома: напарники живут у тебя неделю за твой счёт. Дешевле сборов из магазина (CC_SHOP camp, $1000),
   и даёт не тренировку и не форму, а сыгранность: +7 дней к стажу пары (ccChemBump, тот же счёт, что у совместных вечеров).
   Числа заданы, не замерены. Только в своей квартире там, где живёшь; в командном онлайне сыгранность общая, его нет. */
const CC_HOME_CAMP={cost:300, chem:7, every:14};
function ccHomeCampWhy(){
  const cr=CAREER && CAREER.career, T=L();
  if(!cr) return '';
  if(typeof ccMpOn==='function' && ccMpOn()) return T.ccHomeCampMp;
  if(!ccFlatHere()) return T.ccHomeCampNoFlat;
  if(!careerMateRecords().filter(p=>p && !p.standin).length) return T.ccHomeCampNoMate;
  if(cr.homeCamp && ccDaysBetween(cr.homeCamp, careerToday())<CC_HOME_CAMP.every) return T.ccHomeCampAgain(ccDayLabel(ccAddDays(cr.homeCamp, CC_HOME_CAMP.every)));
  if((cr.balance||0)<CC_HOME_CAMP.cost) return T.ccHomeCampMoney;
  return '';
}
function ccHomeCampHTML(){
  const T=L(), why=ccHomeCampWhy();
  return '<div class="cc-buy"><div class="cc-buy-in"><b>'+esc(T.ccHomeCamp)+'</b><i>'+esc(T.ccHomeCampWhat(CC_HOME_CAMP.chem, CC_HOME_CAMP.every))+'</i>'+
    (why ? '<span>'+esc(why)+'</span>' : '')+'</div>'+
    '<button class="ch-sign"'+(why ? ' disabled' : '')+' onclick="careerHomeCamp()">$'+ccNum(CC_HOME_CAMP.cost)+'</button></div>';
}
function careerHomeCamp(){
  if(ccHomeCampWhy()) return false;
  const cr=CAREER.career;
  cr.balance=(cr.balance||0)-CC_HOME_CAMP.cost;
  cr.homeCamp=careerToday();
  ccChemBump(CC_HOME_CAMP.chem);
  careerNews('good', 'ccNewsHomeCamp', [CC_HOME_CAMP.chem]);
  careerSave();
  careerRenderHub(CH_TAB);
  return true;
}
Object.assign(I18N.ru, {ccHomeCamp:'Буткемп у себя дома', ccHomeCampWhat:(d,e)=>'Напарники живут у тебя неделю за твой счёт: +'+d+' дней сыгранности. Раз в '+e+' дней',
  ccHomeCampMp:'В командном онлайне сыгранность общая', ccHomeCampNoFlat:'Нужна своя квартира там, где живёшь', ccHomeCampNoMate:'Нет напарника',
  ccHomeCampAgain:d=>'Снова с '+d, ccHomeCampMoney:'Не хватает денег', ccNewsHomeCamp:d=>'Неделя буткемпа дома: +'+d+' дней сыгранности'});
Object.assign(I18N.en, {ccHomeCamp:'Bootcamp at home', ccHomeCampWhat:(d,e)=>'Your teammates stay with you for a week at your cost: +'+d+' days of chemistry. Once every '+e+' days',
  ccHomeCampMp:'In online team play chemistry is shared', ccHomeCampNoFlat:'You need your own flat where you live', ccHomeCampNoMate:'No teammate',
  ccHomeCampAgain:d=>'Again from '+d, ccHomeCampMoney:'Not enough money', ccNewsHomeCamp:d=>'A week of bootcamp at home: +'+d+' days of chemistry'});
Object.assign(I18N.fr, {ccHomeCamp:'Bootcamp à la maison', ccHomeCampWhat:(d,e)=>'Tes mates vivent chez toi une semaine à tes frais : +'+d+' jours de cohésion. Une fois tous les '+e+' jours',
  ccHomeCampMp:'En équipe en ligne, la cohésion est commune', ccHomeCampNoFlat:'Il faut ton propre logement là où tu vis', ccHomeCampNoMate:'Pas de mate',
  ccHomeCampAgain:d=>'De nouveau le '+d, ccHomeCampMoney:'Pas assez d’argent', ccNewsHomeCamp:d=>'Une semaine de bootcamp à la maison : +'+d+' jours de cohésion'});
Object.assign(I18N.it, {ccHomeCamp:'Bootcamp a casa', ccHomeCampWhat:(d,e)=>'I compagni stanno da te una settimana a tue spese: +'+d+' giorni di intesa. Una volta ogni '+e+' giorni',
  ccHomeCampMp:'Online in squadra l’intesa è condivisa', ccHomeCampNoFlat:'Serve una casa tua dove vivi', ccHomeCampNoMate:'Nessun compagno',
  ccHomeCampAgain:d=>'Di nuovo dal '+d, ccHomeCampMoney:'Soldi insufficienti', ccNewsHomeCamp:d=>'Una settimana di bootcamp a casa: +'+d+' giorni di intesa'});
Object.assign(I18N.pt, {ccHomeCamp:'Bootcamp em casa', ccHomeCampWhat:(d,e)=>'Seus parceiros ficam na sua casa por uma semana por sua conta: +'+d+' dias de entrosamento. Uma vez a cada '+e+' dias',
  ccHomeCampMp:'No online em equipe o entrosamento é compartilhado', ccHomeCampNoFlat:'Precisa de casa própria onde você mora', ccHomeCampNoMate:'Sem parceiro',
  ccHomeCampAgain:d=>'De novo a partir de '+d, ccHomeCampMoney:'Dinheiro insuficiente', ccNewsHomeCamp:d=>'Uma semana de bootcamp em casa: +'+d+' dias de entrosamento'});
// Подпись авторов фото жилья — CC BY / BY-SA требуют имени и лицензии рядом со снимком.
const CC_FLAT_CREDIT='Photos: Aaaatu (CC BY-SA 4.0), Lo (CC0), Corey Taratuta (CC BY 2.0), Shixart1985 (CC BY 2.0), w_lemay (CC BY-SA 2.0), Rio Ubatay (CC BY-SA 4.0) — Wikimedia Commons';
function careerMoveHTML(){
  // A taken card gets the regions and not the map: see the note above.
  /* A taken card gets the regions and not the country map: see the note above.

     It gets the region map too, now that picking a region is a look before it is
     a departure — that map is display-only for everybody, so it shows the place
     without offering the ping-shopping the rule denies them. Without this the
     rows set a region and nothing on the screen ever acted on it, which took the
     move away from taken cards entirely. */
  /* A taken card cannot ping-shop inside Europe — that rule stands. What it can
     do now is what the region rows always offered, said properly: pick a
     country inside the region it is leaving for. His report, 20 August, playing
     as Sky: "нельзя выбрать страну, не континент". The map for another region
     takes the click and the same panel answers it; the card's own region shows
     no map at all, exactly as before. */
  if(!ccMoveMatters()) return `<div class="ch-tile cc-shop cc-move">
    <h4>${L().ccMoveTitle}</h4>
    <div class="ch-hint">${L().ccMoveOnlyBuilt}</div>
    <div class="ch-row"><em>${L().ccMoveRegion}</em><b>${
      esc(regionName(ccCareerRegion()))}</b></div>
    <button class="ch-swap" onclick="careerMoveOpen()">${L().ccMoveOpen}</button>
    ${ccMoveModalLater(CH_MOVE ? careerRegionRowsHTML()+(CH_MOVE_REG ? (ccMapsReady(function(){ careerRenderHub('shop'); })
        ? `<div class="cc-movemap">${ccBuildMap('ccMoveMapClick(event)', CH_MOVE_REG)}</div>` : '')+
        `<div id="ccMovePanel">${CH_MOVE_PICK ? careerMovePanelHTML() : careerMoveGoHTML()}</div>` : '') : null)}
  </div>`;
  const cr=CAREER.career, pl=CAREER.player;
  const here=ccLivesIn(), ping=ccPingNow(), rent=ccRentNow();
  const away=!!pl.livesIn;
  const flag=c=>flagImg(ccNatOf(c), 15);
  return `<div class="ch-tile cc-shop cc-move">
    <h4>${L().ccMoveTitle}</h4>
    <div class="ch-hint">${L().ccMoveHint}</div>
    <div class="ch-row"><em>${L().ccMoveWhere}</em><b>${flag(here)}${esc(ccCountryName(here))}${
      away?'':' · '+L().ccMoveHome}</b></div>
    <div class="ch-row"><em>${L().ccMovePing}</em><b>${ping} ms · ${
      L().ccMoveEdge((Math.round(ccPingEdge(ping)*10)/10))}</b></div>
    <div class="ch-row"><em>${L().ccMoveRent}</em><b>${
      rent?ccMoney(rent)+L().ccPerMonth:'-'}</b></div>
    ${cr.rent ? `<div class="ch-row"><em>${L().ccMovePaid}</em><b>$${
      ccNum((cr.rent||0))}</b></div>` : ''}
    <div class="ch-row"><em>${L().ccMoveRegion}</em><b>${esc(regionName(ccCareerRegion()))}</b></div>
    <button class="ch-swap" onclick="careerMoveOpen()">${
      away ? L().ccMoveAgain : L().ccMoveOpen}</button>
    ${ccMoveModalLater(CH_MOVE ? careerRegionRowsHTML()+(function(){
      /* For your own region the row shows your own map, live. Region rows have a display-only map, fine for other
         continents (moving there is one price), but for your own it killed the country map and showed a "move to Europe"
         button, so you couldn't pick a country and pay its rent. */
      const elsewhere = CH_MOVE_REG && CH_MOVE_REG!==ccCareerRegion();
      /* Another region's map takes clicks now too — his ask, 20 August: pick a
         country inside the region and go there. The panel starts as the
         whole-region move it always was, and a click swaps it for the country. */
      const map = ccMapsReady(function(){ careerRenderHub('shop'); })
        ? `<div class="cc-movemap">${ccBuildMap('ccMoveMapClick(event)', ccMoveShownRegion())}</div>`
        : `<div class="cc-note">${L().ccMapLoading}</div>`;
      return map + `<div id="ccMovePanel">${
        (elsewhere && !CH_MOVE_PICK) ? careerMoveGoHTML() : careerMovePanelHTML()}</div>`;
    })() : null)}
  </div>`;
}
/* The other continents, under the map of this one.

   A list rather than a map, because there is no map of the world in this file
   and drawing one to hold seven rows would be a week of work for a row of
   buttons. Each says the rent and what it costs you, and the cost is the part
   that matters: a region move is the only thing in this mode that takes
   something away. */
function careerRegionRowsHTML(){
  const cr=CAREER.career, here=ccCareerRegion();
  const rows=['EU'].concat(Object.keys(CC_REGION_RENT)).map(r=>{
    const on=r===here, rent=r==='EU' ? 0 : CC_REGION_RENT[r];
    const can=!on && (!rent || (cr.balance||0)>=rent);
    const shown=r===CH_MOVE_REG;
    return `<button class="cc-move-reg${on?' on':''}${shown?' shown':''}"${can?'':' disabled'}
      onclick="careerMoveShowRegion(\'${r}\')">
      <b>${esc(regionName(r))}</b>
      <span>${rent ? ccMoney(rent)+L().ccPerMonth : L().ccMoveHome}</span>
      ${on ? `<i>${L().ccMoveAlready}</i>` : ''}</button>`;
  }).join('');
  return `<div class="cc-move-regions">
    <div class="dm-side-h">${L().ccMoveRegion}</div>
    <div class="ch-hint">${L().ccMoveRegionHint}</div>
    ${rows}</div>`;
}
/* The answer to a click: what it costs, what it is worth, and the button. Its
   own function because the click swaps this and nothing else - rebuilding the
   tile around it would take the map down with it. */
function careerMovePanelHTML(){
  const cr=CAREER.career, pl=CAREER.player;
  const here=ccLivesIn(), ping=ccPingNow();
  const flag=c=>flagImg(ccNatOf(c), 15);
  if(!CH_MOVE_PICK) return `<div class="ch-hint cc-move-hint">${L().ccMovePickHint}</div>`;
  /* Which region's map the click landed on. Inside your own it is the move this
     panel has always sold; on another continent's map it is the same panel with
     the bigger button — the country's ping off that region's own table, the
     country's rent, and a move that costs what a region move costs. His ask,
     20 August: pick a country and go there. */
  const reg=ccMoveShownRegion(), abroad=reg!==ccCareerRegion();
  const c=CH_MOVE_PICK;
  const home=!abroad && c===pl.country;
  const on=!abroad && c===((pl.region||'EU')==='EU' ? here : (pl.livesIn||null));
  const cost=home?0:(ccRentOf(c)||0);
  const gain=ccEdgeOff(pl) ? 0 : Math.round((ccPingEdge(ccPingOf(c, reg))-ccPingEdge(ping))*10)/10;
  const can=!on && (!cost || (cr.balance||0)>=cost);
  return `<div class="cc-move-pick">
    <div class="cc-move-pick-h">${flag(c)}<b>${esc(ccCountryName(c))}${
      abroad ? ' · '+esc(regionName(reg)) : ''}</b>
      ${home?`<em>${L().ccMoveHome}</em>`:''}</div>
    <div class="ch-row"><em>${L().ccMovePing}</em><b>${ping} ms → ${ccPingOf(c, reg)} ms</b></div>
    <div class="ch-row"><em>${L().ccMoveGain}</em><b class="${
      gain>0?'ch-goal-met':gain<0?'cc-pen bad':''}">${gain>0?'+':''}${gain}</b></div>
    <div class="ch-row"><em>${L().ccMoveRent}</em><b>${
      cost?ccMoney(cost)+L().ccPerMonth:'-'}</b></div>
    ${abroad ? `<div class="ch-hint">${L().ccMoveRegionHint}</div>` : ''}
    ${on ? `<div class="ch-empty">${L().ccMoveAlready}</div>`
         : abroad
           ? (ccMpTeam() ? '' : `<button class="ch-sign"${can?'':' disabled'}
                onclick="careerMoveAsk('${reg}','${c}')">${
                L().ccMoveGoCity(ccCountryName(c), regionName(reg))}</button>`)+
             /* И вторая кнопка — уехать не одному.

                Континент забирает у карьеры всё, что она построила рядом с
                собой, и место рядом — единственное, что можно выкупить: билет
                и первый месяц за каждого. Кнопки две, а не галочка, потому что
                это два разных решения с двумя разными ценами, и обе цены
                написаны на них. См. careerMoveRegion. */
             (()=>{ const mates=careerMates();
               if(!mates.length) return '';
               const forThem=careerMoveMatesCost(cost);
               const okBoth=(cr.balance||0)>=cost+forThem;
               return `<button class="ch-sign cc-move-together"${okBoth?'':' disabled'}
                 onclick="careerMoveRegion('${reg}','${c}',true)">${
                 L().ccMoveWithMate(mates.length, ccNum(cost+forThem))}</button>`+
                 `<div class="ch-hint">${L().ccMoveWithMateHint(ccNum(forThem))}</div>`; })()
           : `<button class="ch-sign"${can?'':' disabled'} onclick="careerMoveTo(\'${c}\')">${
               home ? L().ccMoveGoHome : L().ccMoveDo(ccNum(cost))}</button>`}
    ${!on && !can ? `<div class="ch-hint">${L().ccMoveNoCash}</div>` : ''}
  </div>`;
}
/* A slot is one row, not three.

   The desk lists twelve things and four of them are the same decision written
   twice: three rigs in one slot and two chairs in another, where buying the
   better one replaces the worse and the worse then sits there saying HAVE
   BETTER. That is a shop showing you its own bookkeeping.

   A slot shows the next step up and nothing else - what you would buy if you
   bought - and the ones behind it are gone rather than crossed out. The one at
   the top of a slot you have finished shows as owned, so the row still says what
   is on your desk. Nothing about what anything costs or is worth changes; this
   is the list, not the ladder. */
function ccShopVisible(){
  const seen={};
  return CC_SHOP.filter(function(it){
    if(ccDevCatItem(it)) return false;   // девайсы - в окне выбора, не строкой
    if(!it.slot) return true;   // девайсы - каталогом, видны все
    const have=ccShopSlotRank(it.slot);
    // The next rung up, or the top one when the slot is finished.
    const top=CC_SHOP.reduce((r,x)=>(x.slot===it.slot && x.rank>r) ? x.rank : r, 0);
    const want = have>=top ? top : have+1;
    if(it.rank!==want || seen[it.slot]) return false;
    seen[it.slot]=true;
    return true;
  });
}
/* Пасхалка с читами — его пункт 6 со страницы «ы», 22 августа: подозрительный
   файл в самом низу магазина, цепочка табличек отговаривает, предпоследняя
   предлагает $100 за то, чтобы одуматься, — а скачавшего банят, и карьера
   завершается тем же экраном, что и уход на пенсию (careerRetire): легаси,
   «начать новую карьеру». */
let CH_CHEAT=null;
function careerCheatStep(s){
  if(s==='paid'){
    CAREER.career.balance=(CAREER.career.balance||0)+100;
    careerNews('good', 'ccNewsCheatPaid', []);
    /* Один раз — правка: взял сотню за здравый смысл, и файл
       пропадает из магазина навсегда. Второго предложения не бывает — за это
       и платили. Метка в сейве, не в CH_CHEAT: та живёт до перерисовки. */
    CAREER.career.cheatGone=true;
    CH_CHEAT=null;
    careerSave();
    careerRenderHub('shop');
    return;
  }
  if(s==='ban'){
    careerNews('bad', 'ccNewsBanned', []);
    /* И сцена под этим пишет — правка: «пусть в комментариях
       пишут, что разочарованы, не ожидали, грустят». Трое настоящих, тем же
       отбором и с тем же сидом от даты, что поздравления на др: перерисовка
       ленты никого не передобавляет. */
    const rndS=careerRng(ccHashStr('bansad|'+(CAREER.career.season||1)+'|'+careerToday()));
    const folks=careerRosterNowEU().slice();
    ['ccPostBanSad1','ccPostBanSad2','ccPostBanSad3'].forEach(k=>{
      if(!folks.length) return;
      const who=folks.splice(Math.floor(rndS()*folks.length), 1)[0];
      careerNews('bad', k, [ccHandle(who.handle), ccHandle(CAREER.player.nick)]);
    });
    CH_CHEAT=null;
    careerSave();
    careerRetire(true, 'ban');
    return;
  }
  CH_CHEAT=s;
  careerRenderHub('shop');
}
function careerCheatHTML(){
  if(CAREER.career.cheatGone) return '';
  const step=CH_CHEAT;
  const box=(t, sub, yes, yesGo, no)=>`<div class="cc-cheat-ask">
      <b>${esc(t)}</b><span>${esc(sub)}</span>
      <div><button class="ch-decline" onclick="careerCheatStep(${yesGo})">${esc(yes)}</button>
      <button class="ch-sign" onclick="careerCheatStep(null)">${esc(no)}</button></div>
    </div>`;
  return `<div class="ch-tile cc-cheat">
    <h4>aimbot_2026.exe</h4>
    ${(()=>{
      /* Пять причин одуматься — правка: «пусть еще будет
         причин 5». Реплеи, спонсоры, люди рядом — и только после всех пяти
         предпоследняя табличка достаёт свои $100. */
      const R=[[L().ccCheat1,   L().ccCheat1Sub,   L().ccCheatYes],
               [L().ccCheat2,   L().ccCheat2Sub,   L().ccCheatStill],
               [L().ccCheatR3,  L().ccCheatR3Sub,  L().ccCheatStill],
               [L().ccCheatR4,  L().ccCheatR4Sub,  L().ccCheatStill],
               [L().ccCheatR5,  L().ccCheatR5Sub,  L().ccCheatStill]];
      if(step==null) return `<div class="ch-row"><em>${L().ccCheatRow}</em><b>$9.99</b></div>
        <button class="ch-swap cc-cheat-btn" onclick="careerCheatStep(1)">${L().ccCheatDl}</button>`;
      if(step>=1 && step<=5){
        const r=R[step-1];
        return box(r[0], r[1], r[2], step===5?'6':String(step+1),
                   step===1?L().ccCheatNo:L().ccCheatBack);
      }
      return `<div class="cc-cheat-ask"><b>${esc(L().ccCheat3)}</b><span>${esc(L().ccCheat3Sub)}</span>
          <div><button class="ch-sign" onclick="careerCheatStep(\'paid\')">${esc(L().ccCheatTake)}</button>
          <button class="ch-decline" onclick="careerCheatStep(\'ban\')">${esc(L().ccCheatDl)}</button></div>
        </div>`;
    })()}
  </div>`;
}
