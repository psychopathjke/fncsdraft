/*@@PART js/career-6.js@@*/
function careerBackToHub(){
  if(typeof MGR_ACTIVE!=='undefined' && MGR_ACTIVE && CAREER && CAREER._mgr){ mgrAfterNight(); return; }   // вечер менеджера — назад в клуб
  document.documentElement.classList.remove('ev-pal', 'ev-classic', 'ev-light');
  show('screen-career-hub');
  /* После матча — наверх (его слово 8.10: «после матча меня вниз скролит, нужно подниматься наверх к вкладкам»):
     перерисовка хаба восстанавливала прокрутку «как была», а была — низ экрана результатов. */
  CH_DREW=null;
  careerRenderHub('centre');
  try{ window.scrollTo(0, 0); const b=document.getElementById('chBody'); if(b){ b.scrollTop=0; if(b.parentElement) b.parentElement.scrollTop=0; } }catch(e){}
}

/* ---- History, in the shape of a player profile ----------------------------
   Modeled on a Fortnite Tracker profile: summary strip on top (main number with its
   curve, then totals), below it every event as a row, newest first: place, points,
   earnings, teammates, match stats. Only columns the career records. No K/D: cups
   count team elims, never deaths; average place is used instead. Earnings stays
   even when it's all zeros, the unpaid divisions are the point. */
/* Power Rankings board. Every event rates its whole field, fed from the eight runners that write the log and from
   the D1 week simulated without you.
   A row keeps its best 20 ratings and their days; decay is applied on read, so the player's row matches History.
   Only the best CC_PR_ROWS names are kept (below D1 lobbies are fresh weekly, otherwise ~4,000 names by August).
   The player is never pruned. */
const CC_PR_ROWS=200;
function careerPrTally(){
  const cr=CAREER.career;
  if(!cr.pr) cr.pr={rows:{}};
  ccPrYouMerge(cr.pr);
  return cr.pr;
}
// То же, что ccMoneyYouMerge: вечера под старым ником — в строку текущего.
function ccPrYouMerge(pr){
  const pl=CAREER && CAREER.player; if(!pl || pl.handle || !pl.nick) return;
  const yk=hKey(pl.nick), rows=pr.rows;
  const old=Object.keys(rows).filter(k=>rows[k] && rows[k].you && hKey(k)!==yk);
  if(!old.length) return;
  const b=rows[pl.nick] || (rows[pl.nick]={v:[], n:0});
  old.forEach(function(k){ const a=rows[k]; delete rows[k]; b.v=(b.v||[]).concat(a.v||[]); b.n=(b.n||0)+(a.n||0); });
  b.v.sort((x,y)=>x[1]-y[1]);
  ccPrRowTrim(b);
  b.you=true;
}
// Days since the career began, counting a career year as 365 so that year two's
// February is a year after year one's.
function ccAbsDay(season, iso){
  const d=(new Date((iso||ccYearFrom())+'T00:00:00Z')-new Date(ccYearFrom()+'T00:00:00Z'))/86400000;
  return Math.max(0, (season||1)-1)*365+Math.max(0, d);
}
/* Насколько велик этот турнир на самом деле.
 *
 * Отчёт: доска карьеры показала 743 626 у первого номера,
 * когда у самого Tracker вершина мира стоит около двухсот пятидесяти тысяч.
 * Отзыв: «не надо платить больше, надо как у трекера». Причина была не в
 * таблице очков — она снята с Tracker и проверена по их же строкам, — а в
 * поле, по которому место рейтинговалось. Карьера играет турниры выборкой:
 * кубок пятого дивизиона собирает тысячу дуо и играется комнатой в полторы
 * сотни. Место читалось в комнате, и последний в ней получал очки сотого
 * места мира — двести двадцать пять вместо тридцати.
 *
 * Настоящий размер не выдуман здесь заново: он берётся оттуда же, откуда его
 * берёт плитка дня (ccNextShape), чтобы «сколько человек в этом турнире» был
 * один ответ на весь файл. Париж и Ласт Ченс носят у неё вид 'gc'. */
const CC_PLOG_KEEP=24, CC_PLOG_NAMES=420;
function careerPlogAdd(name, meta, place, of, team, you){
  const cr=CAREER && CAREER.career; if(!cr || !name) return;
  if(!cr.plog) cr.plog={};
  const rows=cr.plog[name] || (cr.plog[name]=[]);
  const kind=String(meta.kind||'cup')+(meta.stage ? ':'+String(meta.stage) : '');
  rows.push([careerToday(), kind, place, of, team.wins||0, ccMemberKills(team, name), Math.round(team.stagePts||0), meta.div||null]);
  if(rows.length>CC_PLOG_KEEP) rows.splice(0, rows.length-CC_PLOG_KEEP);
  if(you) cr.plogYou=name;
  const names=Object.keys(cr.plog);
  if(names.length>CC_PLOG_NAMES*1.3){
    names.sort((a,b)=>cr.plog[a].length-cr.plog[b].length || (cr.plog[a][cr.plog[a].length-1][0]<cr.plog[b][cr.plog[b].length-1][0] ? -1 : 1));
    names.slice(0, names.length-CC_PLOG_NAMES).forEach(n=>{ if(n!==cr.plogYou) delete cr.plog[n]; });
  }
}
/* ЛИСТ СТАТИСТИКИ ИГРОКА СЦЕНЫ — как профиль на Tracker: ПР и место в нём, призовые за год,
   турниров/побед/килов, среднее и лучшее место, подиумы и последние вечера строками.
   Всё из cr.plog, ПР-доски и доски призовых; открывается из профиля в соцсети, из лупы на
   карточке и из таблицы вечера (имена кликаются, ccNamesPeekHTML). Пусто — не рисуется. */
/* СЧЁТЧИК FNCS У КАЖДОГО ИГРОКА СЦЕНЫ (5.10, Notion «05», испанский игрок: «mas contador de
   fncs de todos los jugadores»). Две половины и обе подписаны, чтобы настоящее не путалось с
   сыгранным:
   — НАСТОЯЩЕЕ: карточки игрока (PLAYERS — одна на этап турнира, с местом placement, из Tracker и
     Liquipedia) плюс строки финалов RANKED. Турнир = название до « — » («FNCS 2025 Major 3»), этапы
     одного турнира — один турнир; место берётся с самого глубокого этапа (финал > полуфинал/неделя >
     квалификация). Титул — 1-е место в Гранд-финале или на Глобалах. Ничего не досчитывается: чего
     нет в данных, того нет и в счётчике.
   — В ЭТОЙ КАРЬЕРЕ: вечера FNCS из cr.plog (Мейджоры, Саммит, Глобалы, финалы недели, ЛАН-этапы);
     журнал хранит последние CC_PLOG_KEEP вечеров на человека, о чём и сказано в подписи.
   Регион: тёзки в разных регионах — разные люди (см. память про тёзок), поэтому карточки берутся
   своего региона; не назван — регион, где у ника больше всего FNCS-карточек. */
const CC_FNCS_KINDS=['major','summit','globals','final','gc'];
function ccFncsStageRank(stage){
  const s=String(stage||'');
  if(/Grand Finals|Grand Royale|Lyon|Fort Worth|^Finals?$/i.test(s)) return 3;
  if(/Semi|Week( \d)? Finals|Group|Upper|Play-In|Heat|Event \d/i.test(s)) return 2;
  return 1;
}
function ccFncsRecord(h, reg){
  const k=hKey(h);
  const all=(typeof PLAYERS!=='undefined' ? PLAYERS : []).filter(p=>p && p.handle && hKey(p.handle)===k && /^FNCS /.test(String(p.event||'')));
  if(!reg && all.length){
    const n={}; all.forEach(p=>{ n[p.region]=(n[p.region]||0)+1; });
    reg=Object.keys(n).sort((a,b)=>n[b]-n[a])[0];
  }
  const ev={};
  const put=(name, stage, place)=>{
    if(!name) return;
    const r=ccFncsStageRank(stage), e=ev[name]||(ev[name]={name, rank:0, place:null, gf:false, gc:/Global Championship/.test(name)});
    const p=Number(place);
    if(r>e.rank || (r===e.rank && p>0 && (e.place==null || p<e.place))){ e.rank=r; e.place=p>0 ? p : e.place; }
    if(r===3) e.gf=true;
  };
  all.filter(p=>!reg || p.region===reg).forEach(p=>{
    const m=String(p.event).split(/\s+—\s+/);
    put(m[0].trim(), (m[1]||'').replace(/\s*\(.*$/,''), p.placement);
  });
  (typeof RANKED!=='undefined' ? RANKED : []).forEach(x=>{
    if((reg && x.region && x.region!==reg) || !String(x.duo||'').split(/\s*[&+]\s*/).some(n=>hKey(n)===k)) return;
    const m=String(x.event||'').split(/\s+—\s+/);
    if(/^FNCS /.test(m[0])) put(m[0].trim(), (m[1]||'').replace(/\s*\(.*$/,''), x.rank);
  });
  const list=Object.values(ev);
  const years=list.map(e=>+((e.name.match(/\b(20\d\d)\b/)||[])[1])).filter(Boolean);
  const gfs=list.filter(e=>e.gf && e.place>0);
  const titles=gfs.filter(e=>e.place===1).map(e=>e.name);
  const best=gfs.length ? gfs.slice().sort((a,b)=>a.place-b.place)[0] : null;
  return {region:reg||null, events:list.length, from:years.length ? Math.min(...years) : null, to:years.length ? Math.max(...years) : null,
          finals:gfs.length, best:best ? {place:best.place, name:best.name} : null, titles,
          gc:list.filter(e=>e.gc && e.gf && e.place>0).map(e=>({name:e.name, place:e.place}))};
}
// Вечера FNCS этой карьеры у ника — из его журнала (последние CC_PLOG_KEEP).
function ccFncsCareer(rows){
  const f=(rows||[]).filter(e=>CC_FNCS_KINDS.indexOf(String(e[1]).split(':')[0])>=0);
  return {n:f.length, best:f.length ? Math.min.apply(null, f.map(e=>e[2])) : null, wins:f.filter(e=>e[2]===1).length};
}
function ccFncsBlockHTML(h, reg, rows){
  const T=L(), rec=ccFncsRecord(h, reg), mine=ccFncsCareer(rows);
  if(!rec.events && !mine.n) return '';
  const cell=(a,b)=>'<div><span>'+a+'</span><b>'+b+'</b></div>';
  const short=n=>esc(String(n).replace(/^FNCS\s+/,''));
  const real=rec.events
    ? '<div class="cc-ps-sub">'+esc(T.ccPsFncsReal)+'</div><div class="cc-ps-grid">'+
        cell(T.ccPsFncsN, rec.events+(rec.from ? ' · '+(rec.from===rec.to ? rec.from : rec.from+'–'+rec.to) : ''))+
        cell(T.ccPsFncsGf, rec.finals)+
        (rec.best ? cell(T.ccPsFncsBest, '#'+rec.best.place+' · '+short(rec.best.name)) : '')+
        cell(T.ccPsFncsTitles, rec.titles.length)+
        (rec.gc.length ? cell(T.ccPsFncsGc, rec.gc.map(g=>'#'+g.place+' '+short(g.name).replace(/\s*Global Championship/,'')).join(', ')) : '')+
      '</div>'+
      (rec.titles.length ? '<div class="cc-ps-list"><div>🏆 '+rec.titles.map(short).join(' · ')+'</div></div>' : '')
    : '';
  const own=mine.n
    ? '<div class="cc-ps-sub">'+esc(T.ccPsFncsMine(CC_PLOG_KEEP))+'</div><div class="cc-ps-grid">'+
        cell(T.ccPsFncsNights, mine.n)+cell(T.ccPsBest, '#'+mine.best)+cell(T.ccPsFncsWon, mine.wins)+'</div>'
    : '';
  return '<div class="cc-ps-head">'+esc(T.ccPsFncs)+'</div>'+real+own;
}
function careerPlayerStatsHTML(h, reg){
  const cr=CAREER && CAREER.career; if(!cr || !h) return '';
  const T=L(), k=hKey(h);
  const key=Object.keys(cr.plog||{}).find(n=>hKey(n)===k);
  const rows=(key ? (cr.plog[key]||[]) : []).slice().sort((a,b)=>a[0]<b[0] ? 1 : -1);
  let prRank=null, pr=0;
  try{ const prs=careerPrRows(); for(let i=0;i<prs.length;i++) if(hKey(prs[i].name)===k){ prRank=i+1; pr=prs[i].pr; break; } }catch(e){}
  let money=null; try{ money=(careerMoneyRows('year')||[]).find(r=>hKey(r.name)===k)||null; }catch(e){}
  let fncs=''; try{ fncs=ccFncsBlockHTML(h, reg, rows); }catch(e){}
  if(!rows.length && !prRank && !money) return fncs ? '<div class="cc-ps">'+fncs+'</div>' : '';
  const sum=i=>rows.reduce((a,e)=>a+(e[i]||0), 0);
  const avg=rows.length ? (rows.reduce((a,e)=>a+e[2], 0)/rows.length).toFixed(1) : '-';
  const best=rows.length ? Math.min.apply(null, rows.map(e=>e[2])) : null;
  const podiums=rows.filter(e=>e[2]<=3).length;
  const cell=(a,b)=>'<div><span>'+a+'</span><b>'+b+'</b></div>';
  const grid=
    (prRank ? cell(T.ccPsPr, '#'+prRank+' · '+fmtNum(Math.round(pr))) : '')+
    (money ? cell(T.ccPsPrize, ccMoney(money.usd)) : '')+
    (rows.length ? cell(T.ccPsEvents, rows.length)+cell(T.ccPsWins, sum(4))+cell(T.ccPsElims, sum(5))+
                   cell(T.ccPsAvg, avg)+cell(T.ccPsBest, '#'+best)+cell(T.ccPsPodiums, podiums) : '');
  const line=e=>{ const kind=String(e[1]).split(':')[0]; let name=''; try{ name=ccLogName({kind:kind, day:e[0], div:e[7]}); }catch(x){ name=esc(kind); }
    return '<div><i>'+esc(ccDayLabel(e[0]))+'</i>'+name+' · <b>#'+e[2]+'</b>/'+e[3]+' · '+e[4]+' VR · '+e[5]+' E</div>'; };
  return '<div class="cc-ps"><div class="cc-ps-head">'+esc(T.ccPsTitle)+'</div><div class="cc-ps-grid">'+grid+'</div>'+
    (rows.length ? '<div class="cc-ps-head">'+esc(T.ccPsLast)+'</div><div class="cc-ps-list">'+rows.slice(0, 8).map(line).join('')+'</div>' : '')+fncs+'</div>';
}
// Имена команды в таблице вечера — ссылками на лист (только в карьере, только у кого есть карточки).
function ccNamesPeekHTML(t){
  if(!t) return '';
  const on=(typeof CAREER_RUN!=='undefined' && CAREER_RUN) && CAREER && CAREER.career && Array.isArray(t.squad) && t.squad.length && t.squad.every(c=>c && c.handle);
  if(!on) return String(t.name||'');
  // С флагом, как teamLabel, и span, а не <u>: у <u> в таблице своя рамка (скриншот: «ники вот так выглядят», флагов нет).
  const links=t.squad.map(c=>flagFor(c)+'<span class="cc-peek-nick" title="'+esc(L().cardPeekHint)+'" onclick="event.stopPropagation();ccPeekByHandle(\''+jsq(String(c.handle))+'\')">'+esc(String(c.handle))+'</span>').join(' &amp; ');
  // Свой состав подписан («Твой состав: …») — подпись остаётся, имена — ссылками.
  const m=String(t.name||'').match(/^([^:<]{1,40}:)\s*/);
  return (m ? esc(m[1])+' ' : '')+links;
}
/* ОЦЕНКА ЗА ВЕЧЕР И MVP — как в FIFA: 1.0–10.0 после каждого вечера.

   Считается из итоговой таблицы вечера (последний careerPrAdd дня — финальная комната):
   место в перцентилях комнаты — 60 %, элимы против медианы комнаты — 25 %, победы — 15 %.
   Веса — оценка режима, не чьё-то измерение. MVP вечера — у команды-победителя: сам игрок,
   если победил он и оценка от 8.5, иначе сильнейшая карточка победителей (кто из них был
   лучшим в той игре, журнал не хранит). В строку журнала вечера оценка приклеивается при
   сохранении (ccNightStamp), потому что строки пишут двадцать разных раннеров. */
let CC_NIGHT_RATE=null;
function ccNightRate(ranked){
  const you=ranked.find(t=>t && t.isYou);
  if(!you) return null;
  const of=ranked.length, place=ranked.indexOf(you)+1;
  const el=ranked.map(t=>t.stageElims||0).sort((a,b)=>a-b), med=el[Math.floor(el.length/2)]||0;
  // Оценка любой команды вечера — одна формула: место, элимы против медианы, победы.
  const rateOf=t=>{
    const pl=ranked.indexOf(t)+1, pct=of>1 ? 1-(pl-1)/(of-1) : 1;
    const elimS=Math.max(0, Math.min(1, 0.5+((t.stageElims||0)-med)/Math.max(2, med*3)));
    const winS=Math.min(1, (t.wins||0)/2);
    return Math.round(10*(1+9*(0.6*pct+0.25*elimS+0.15*winS)))/10;
  };
  const rating=rateOf(you);
  const top=ranked[0], sq=(top && top.squad)||[];
  let mvp=null, mvpYou=false, mvpCard=null;
  if(top===you && rating>=8.5){ mvp=(CAREER.player && (CAREER.player.handle||CAREER.player.nick))||null; mvpYou=true; mvpCard=(typeof careerCard==='function') ? careerCard() : null; }
  else if(sq.length){ const c=sq.slice().sort((a,b)=>((b&&b._ovr)||(b&&b.rating)||0)-((a&&a._ovr)||(a&&a.rating)||0))[0]; mvp=c && c.handle; mvpCard=c||null; }
  // Тройка вечера — для экрана итога (ccNightRateLine); в журнал не пишется.
  const podium=ranked.slice(0,3).map(t=>({n:String(t.name||'').replace(/<[^>]*>/g,''), p:Math.round(t.stagePts||0), r:rateOf(t), you:!!t.isYou}));
  return {day:careerToday(), rating, mvp, mvpYou, mvpCard, podium, place, of};
}
// Приклеить оценку вечера к его строке журнала (последняя строка этого дня без оценки).
function ccNightStamp(){
  const n=CC_NIGHT_RATE, cr=CAREER && CAREER.career;
  if(!n || !cr || !cr.log) return;
  for(let i=cr.log.length-1; i>=0; i--){
    const e=cr.log[i];
    if(e.day!==n.day) { if(e.day<n.day) break; continue; }
    if(e.rating==null){ e.rating=n.rating; if(n.mvp) e.mvp=n.mvp; if(n.mvpYou) e.mvpYou=true; CC_NIGHT_SHOWN=n; CC_NIGHT_RATE=null; }
    return;
  }
}
// Строка оценки вечера для карточки итога (CC_NIGHT_RATE или уже приклеенная — CC_NIGHT_SHOWN).
let CC_NIGHT_SHOWN=null;
function ccNightRateLine(){
  const n=CC_NIGHT_RATE || CC_NIGHT_SHOWN;
  if(!n) return '';
  /* Итог вечера крупно: плашка оценки (цвет по уровню), MVP с портретом и тройка вечера. */
  const cls=n.rating>=8 ? 'hi' : n.rating<5 ? 'lo' : 'mid';
  const face=(n.mvpCard && typeof portraitHTML==='function') ? portraitHTML(n.mvpCard, 46) : '';
  const mvp=n.mvp ? '<div class="nr-mvp">'+face+'<div><em>'+L().lfMvp+'</em><b>'+esc(n.mvp)+(n.mvpYou ? ' · '+L().lfYouTag : '')+'</b></div></div>' : '';
  // У тройки — своя оценка матча у каждого (как у MVP), очки — мелко рядом.
  const pod=(n.podium||[]).map((r,i)=>{ const rc=r.r==null ? '' : r.r>=8 ? 'hi' : r.r<5 ? 'lo' : 'mid';
    return '<li class="'+(r.you?'you':'')+'"><i>'+(i+1)+'</i><span>'+esc(r.n)+' <small>'+r.p+' '+esc(L().lfPtsShort)+'</small></span>'+
      (r.r!=null ? '<b class="nr-mini '+rc+'">'+r.r.toFixed(1)+'</b>' : '<b>'+r.p+'</b>')+'</li>'; }).join('');
  // «Твоя оценка» и место своей команды (его скрин 40: «они выиграли, но почему-то рейтинг такой» —
  // 4.4 была его, 11-е место, а стояла вплотную к MVP победителей под нейтральным «Match rating»).
  const where=n.place ? '<small>#'+n.place+(n.of ? ' / '+n.of : '')+'</small>' : '';
  return '<div class="nr-box"><div class="nr-rate '+cls+'"><b>'+n.rating.toFixed(1)+'</b><span>'+L().lfRateYou+'</span>'+where+'</div>'+mvp+
    (pod ? '<ol class="nr-top">'+pod+'</ol>' : '')+ccVodHTML(n)+'</div>';
}
/* РАЗБОР РЕПЛЕЯ после плохого вечера (оценка ниже 5.5): «в чём была ошибка?» — дроп,
   ротация или файты. Верный ответ читается из самого вечера (строка журнала): много смертей
   рано и мало элимов — дроп; элимы есть, а место плохое — ротация; мало элимов при
   среднем месте — файты. Верно — опыт +0.4 и шаг формы; раз за вечер. */
function ccVodTruth(){
  const e=(CAREER.career.log||[]).slice(-1)[0]; if(!e) return 'fight';
  const g=Math.max(1, e.games||1), perG=(e.elims||0)/g, avg=e.avg!=null ? e.avg : 50;
  const lobby=e.of>=90 ? 100 : 50;
  if(avg>lobby*0.6 && perG<1) return 'drop';
  if(perG>=1.5 && avg>lobby*0.35) return 'rot';
  return 'fight';
}
function ccVodHTML(n){
  const lf=(typeof ccLife==='function') ? ccLife() : {};
  if(!n || n.rating>=5.5 || (lf.vod && lf.vod===n.day)) return '';
  return '<div class="nr-vod" id="nrVod"><em>'+L().lfVod+'</em><div>'+
    ['drop','rot','fight'].map(k=>'<button class="cc-back" onclick="ccVodAnswer(\''+k+'\')">'+L()['lfVod_'+k]+'</button>').join('')+'</div></div>';
}
function ccVodAnswer(k){
  const lf=ccLife(), n=CC_NIGHT_RATE || CC_NIGHT_SHOWN; if(!n || lf.vod===n.day) return;
  lf.vod=n.day;
  const truth=ccVodTruth(), ok=k===truth;
  if(ok){ careerStatBump('exp', 0.4); const cr=CAREER.career; cr.form=Math.min(CC_FORM_MAX, (cr.form||0)+0.5); }
  careerNews(ok?'good':'flat', ok?'lfNewsVodOk':'lfNewsVodNo', [L()['lfVod_'+truth]]);
  careerSave();
  const box=document.getElementById('nrVod');
  if(box) box.innerHTML='<em>'+(ok ? L().lfVodOk : L().lfVodNo(L()['lfVod_'+truth]))+'</em>';
}
function careerPrAdd(ranked, meta){
  if(!ranked || ranked.length<2) return;
  try{
    const nr=ccNightRate(ranked);
    if(nr){
      // Ранг двигается раз за вечер: первая таблица дня двигает, следующие раунды — нет.
      if(!CC_NIGHT_RATE || CC_NIGHT_RATE.day!==nr.day){ ccChemBump(3); }
      CC_NIGHT_RATE=nr;
    }
  }catch(e){}
  const t=careerPrTally(), of=ranked.length;
  // Поле турнира спрашивается один раз на вечер, а не на каждую из полутора
  // сотен строк: ccNextShape перебирает календарь.
  /* ДЕНЬ ВЕЧЕРА, А НЕ ДЕНЬ ЗАПИСИ. Мир досчитывает вечера на шаге дня (финалы без игрока, финал недели), и у двоих
     в команде или гонке шаг идёт по-разному — перемотка одного, присланное состояние у другого: тот же вечер ложился
     в PR на 350-й день у одного и на 363-й у другого, а поле турнира (ccPrField) читалось с чужого дня (командный год
     20.10). День — тот, что назвал раннер (CC_PRIZE_DAY), иначе день старта вечера (копилка), иначе сегодня. */
  const nightDay=(typeof CC_PRIZE_DAY!=='undefined' && CC_PRIZE_DAY) || (CC_EV_DELTA && CC_EV_DELTA.day) || careerToday();
  const trueOf=Math.max(of, ccPrField({kind:meta.kind, day:nightDay}));
  const day=ccAbsDay(CAREER.career.season, nightDay);
  /* ПР — на человека, не на состав. Его пункт 13 со страницы «ы», 22 августа
     («ПР ТОЛЬКО ДЛЯ СОЛО»), и скриншот: доска держала «Твой состав:
     BOBRIK & Hris & Scaryy» первой строкой и «Твой состав: BOBRIK» четвёртой —
     один человек дважды, команды вперемешку с людьми. Epic считает Power
     Ranking игроку; вечер состава пишется каждому его участнику. Строки
     старых сейвов разъезжаются по людям в careerLoad (prV). */
  const yourKey=hKey((CAREER.player && (CAREER.player.handle || CAREER.player.nick))||'');
  ranked.forEach(function(team, i){
    if(ccBoardOnlyYou() && !team.isYou) return;
    const rating=ccEventPR({place:i+1, of:of, div:meta.div,
                            kind:meta.kind, stage:meta.stage}, trueOf);
    if(rating==null) return;
    const handles=(team.squad||[]).map(c=>c && c.handle).filter(Boolean);
    // Без squad имя состава режется на людей, как это делает доска призовых;
    // префикс «Твой состав:» уходит вместе с двоеточием.
    const raw=String(team.name||'').replace(/<[^>]*>/g,'').replace(/^[^:&+]{1,40}:\s*/, '');
    const who=handles.length ? handles
            : raw.split(/\s*[+&]\s*/).map(s=>s.trim()).filter(Boolean);
    // Твоя метка — на твоём нике; синтетический состав без него метит первое
    // кресло, которое и есть твоё по порядку сборки.
    const yourIdx = team.isYou ? Math.max(0, who.findIndex(h=>hKey(h)===yourKey)) : -1;
    who.forEach(function(h, idx){
      const name=String(h);
      if(!name) return;
      if(ccTeamPeerSkip(name)) return;
      const row=t.rows[name] || (t.rows[name]={v:[], n:0});
      row.v.push([rating, day]);
      // Резать до лучших двадцати больше нечего: считается всё сыгранное.
      // Хвост всё же ограничен, чтобы сейв не рос без края, — но щедро и по
      // сумме, а не по «двадцати лучшим».
      ccPrRowTrim(row);
      row.n++;
      if(idx===yourIdx) row.you=true;
      // И своя строка — тоже (см. careerMoneyAdd): у соседа по гонке она не своя.
      // Рейтинг вечера — как есть, без округления: свой счёт хранит дробь, и строка у соседа расходилась на единицы (командный год 20.10).
      if(CC_EV_DELTA){ (CC_EV_DELTA.pr[name]=CC_EV_DELTA.pr[name]||[]).push(rating);
        if(ccTeamSoloNight()) CC_EV_DELTA.alone=true; }
      /* И журнал вечеров игрока — для листа статистики (careerPlayerStatsHTML). Игрок,
         10.09: «Add players stats». Компактно: [день, вид[:этап], место, из, VR, килы, очки, див];
         последние CC_PLOG_KEEP вечеров на человека, имён не больше CC_PLOG_NAMES (лишние —
         у кого вечеров меньше — уходят, свой ник остаётся). В командный state не едет. */
      try{ careerPlogAdd(name, meta, i+1, of, team, idx===yourIdx); }catch(e){}
    });
  });
  // Prune on the way out, so the save never holds more than the board shows.
  if(!ccPrPruneOnStep()) ccPrPrune();
}
/* ОБРЕЗКА ХВОСТА — ОДИН РАЗ, НА СТЫКЕ СЕЗОНОВ. Хвост доски резался после каждого своего вечера, а копилки чужих
   вечеров (ccEvResApply) доезжают в своё время и не режут: у двоих хвост обрезался в разные моменты, и строка, срезанная
   у одного, потом снова росла с нуля — Hijoe 85 вечеров у одного и 74 у другого (командный год 20.10, 3800 строк PR).
   Шаг дня тоже не годится: после личного соло-вечера одного копилка доезжает до второго уже за его шагом. В команде и
   гонке хвост держится весь сезон (несколько тысяч строк) и режется в careerNewSeason — у всех в одной точке; при
   равенстве по нику. */
function ccPrPruneOnStep(){ return (typeof ccMpTeam==='function' && ccMpTeam()) || (typeof ccRaceOn==='function' && ccRaceOn()); }
function ccPrPrune(){
  const t=careerPrTally(), names=Object.keys(t.rows);
  if(names.length<=CC_PR_ROWS*1.5) return;
  const rows=careerPrRows().slice().sort((a,b)=>b.pr-a.pr || b.events-a.events || (a.name<b.name ? -1 : a.name>b.name ? 1 : 0));
  const keep=new Set(rows.slice(0, CC_PR_ROWS).map(r=>r.name));
  /* Люди онлайна (свой состав, напарник, соперники гонки и их составы) не режутся ни у кого: своя строка у себя
     помечена «ты», а у соседа она обычная — и у одного жила бы, а у другого срезалась. */
  const people=new Set();
  try{ const me=careerCard(); if(me) people.add(hKey(me)); careerMates().forEach(m=>{ if(m) people.add(hKey(m)); }); }catch(e){}
  try{ if(typeof MP!=='undefined' && MP.peer && ccMpTeam()) people.add(hKey(MP.peer)); }catch(e){}
  try{ if(typeof ccRaceOn==='function' && ccRaceOn()) ccRaceTakenKeys().forEach(k=>people.add(k)); }catch(e){}
  names.forEach(n=>{ if(!keep.has(n) && !t.rows[n].you && !people.has(hKey(n))) delete t.rows[n]; });
}
/* Результаты, которые ccPrDecay уже обнулил (старше 540 дней), из сейва долой (21.10, «карьера с временем лагает»: PR-доска
   доходила до 370 КБ к третьему сезону). Ни одна сумма не меняется — такие строки весят ноль; счётчик турниров (n)
   остаётся. Зовётся на смене сезона — у двоих онлайн в одной точке. */
function ccPrDropDead(){
  const t=careerPrTally(), now=ccAbsDay(CAREER.career.season, careerToday());
  Object.keys(t.rows).forEach(n=>{ const r=t.rows[n]; if(r && Array.isArray(r.v)) r.v=r.v.filter(e=>now-e[1]<540); });
}
// What a row is worth today: its own best twenty, faded by their age, summed
// over twenty slots — the same arithmetic as ccPrTable, so the player's row
// agrees with the History tab and a one-appearance ladder name reads like the
// one-event account it is.
function careerPrOf(row){
  const now=ccAbsDay(CAREER.career.season, careerToday());
  // Сумма всего сыгранного, а не среднее лучших двадцати: модель Tracker
  // накопительная, и именно поэтому два игрока с разными соло-результатами
  // расходятся навсегда. См. блок Power Rankings выше.
  return Math.round((row.v||[]).reduce(function(sum, e){
    return sum + e[0]*ccPrDecay(Math.max(0, now-e[1]));
  }, 0));
}
function careerPrRows(){
  const t=careerPrTally();
  return Object.keys(t.rows).map(function(name){
    const row=t.rows[name];
    return {name:name, pr:careerPrOf(row), events:row.n||0, you:!!row.you};
  }).filter(r=>r.pr>0).sort((a,b)=>b.pr-a.pr || b.events-a.events);
}
function careerPrPlace(){
  const rows=careerPrRows();
  for(let i=0;i<rows.length;i++) if(rows[i].you) return i+1;
  return null;
}
/* МОБИЛЬНЫЙ РЕЙТИНГ — таблица мобильной сцены региона (CC_MOBILE_ROSTER) с игроком по его мобильному рейтингу
   (ccMobileOvr). Тридцать строк, игрок внизу, если ниже. Без телефона и мобильных капов — подсказка, где взять телефон. */
function careerMobileRows(){
  const reg=ccCareerRegion(), list=(typeof CC_MOBILE_ROSTER!=='undefined' && (CC_MOBILE_ROSTER[reg] || CC_MOBILE_ROSTER.EU)) || [];
  const me={name:(CAREER.player.handle||CAREER.player.nick||'-'), nat:CAREER.player.country||null, r:ccMobileOvr(), you:true};
  return list.map(x=>({name:x[0], nat:x[1], r:ccMobileRate(x[0], x[2])})).concat([me]).sort((a,b)=>b.r-a.r || (a.you ? -1 : b.you ? 1 : 0));
}
// Флаг по двухбуквенному коду (мобильная сцена хранит коды, не названия); нет файла — флаг просто пропадает.
function ccIsoFlag(c){ return /^[a-z]{2}$/.test(String(c||'')) ? '<img src="flags/w40/'+c+'.png" alt="" width="20" height="15" style="vertical-align:-2px;border-radius:2px;margin-right:4px;" onerror="this.remove()">' : ''; }
/* Мобильный рейтинг виден из магазина (его «а где рейтинг мобилы посмотреть?»): плитка жила внизу «Таблицы», под ПР.
   Строка в плитке консолей и мобильных ведёт прямо к ней. */
function ccMobRateLineHTML(){
  const T=L(), cr=CAREER.career;
  if(!(ccMobileOwn() || (cr.mobN||0)>0)) return '';
  return '<div class="cc-mob-now"><span>'+esc(T.ccMobTitle)+': <b>'+(Math.round(ccMobileOvr()*10)/10)+'</b></span>'+
    '<button type="button" class="cc-platcal" onclick="ccGoMobRating()">'+esc(T.ccMobOpen)+'</button></div>';
}
function ccGoMobRating(){
  careerTab('table');
  try{ const el=document.getElementById('ccMobTile'); if(el) el.scrollIntoView({block:'start', behavior:'smooth'}); }catch(e){}
}
function careerMobileHTML(){
  const T=L(), cr=CAREER.career;
  const has=ccMobileOwn() || (cr.mobN||0)>0;
  if(!has) return '<div class="ch-tile"><h4>'+esc(T.ccMobTitle)+'</h4><div class="ch-empty">'+esc(T.ccMobNoPhone)+'</div></div>';
  const rows=careerMobileRows(), mine=rows.findIndex(r=>r.you)+1;
  const line=(r,n)=>'<tr class="'+(r.you?'you':'')+'"><td>'+n+'</td><td class="ct-name">'+ccIsoFlag(r.nat)+esc(r.name)+'</td>'+
    '<td class="cm-usd">'+(Math.round(r.r*10)/10)+'</td></tr>';
  const top=rows.slice(0, 30).map((r,i)=>line(r, i+1)).join('');
  const below=mine>30 ? line(rows[mine-1], mine) : '';
  return '<div class="ch-tile" id="ccMobTile"><h4>'+esc(T.ccMobTitle)+'</h4>'+
    '<div class="ch-hint">'+esc(T.ccMobHint(regionName(ccCareerRegion())))+'</div>'+
    '<table class="ct cm"><thead><tr><th>#</th><th>'+esc(T.ccMobPlayer)+'</th><th class="cm-usd">'+esc(T.ccMobRating)+'</th></tr></thead>'+
    '<tbody>'+top+below+'</tbody></table>'+
    '<div class="ct-note">'+esc(T.ccMobYou(mine, rows.length, Math.round(ccMobileOvr()*10)/10, cr.mobN||0))+'</div></div>';
}
/* The board, drawn like the money one beside it: thirty rows, and the player
   pinned underneath when they are not in them. */
function careerPrHTML(){
  const rows=careerPrRows();
  if(!rows.length)
    return `<div class="ch-tile"><h4>${L().ccPrTitle}</h4><div class="ch-empty">${L().ccPrEmpty}</div></div>`;
  const mine=careerPrPlace();
  const line=(r,n)=>`<tr class="${r.you?"you":""}"><td>${n}</td><td class="ct-name">${esc(r.name)}</td>`+
    `<td>${r.events}</td><td class="cm-usd">${ccNum(r.pr)}</td></tr>`;
  const top=rows.slice(0, 30).map((r,i)=>line(r, i+1)).join("");
  const below=(mine && mine>30) ? line(rows[mine-1], mine) : "";
  return `<div class="ch-tile"><h4>${L().ccPrTitle}</h4>
    <div class="ch-hint">${L().ccPrHint}</div>
    <table class="ct cm"><thead><tr><th>#</th><th>${L().ccTableTeam}</th>
      <th>${L().evEvents}</th><th class="cm-usd">${L().evPr}</th></tr></thead>
    <tbody>${top}${below}</tbody></table>
    <div class="ct-note">${mine ? L().ccPrYou(mine) : L().ccPrNotIn}</div>
  </div>`;
}

/* ===== CAREER — Power Rankings ===========================================

   Модель здесь — Fortnite Tracker'а, а не Epic'а, и почему так — расписано
   ниже, у самих констант. Здесь остаётся только то, что от старой модели
   пережило замену: как читается возраст результата и как строится таблица
   истории. Модель Epic (рейтинг поля, вес 0.8–1.6, лучшие двадцать, потолок
   40 000) снята 2 сентября 2026 — она склеивала верхнюю половину любого
   тяжёлого поля в одно число. */
/* Сколько результатов вообще хранить в строке. Не «лучшие двадцать» — их у
   Tracker нет, — а предел роста сейва: считается вся строка, но бесконечно
   длинной она не станет. Двести результатов это пять карьерных лет плотной
   игры. */
const CC_PR_KEEP=200;
/* Хвост строки режется по тому, сколько результат стоит СЕГОДНЯ, а не по сырому рейтингу (24.10, Notion «24.10.26», 2035:
   «самому себе PR не зачисляются или очень слабо, а тиммейты на первом месте»). Сортировка по сырому держала в двухстах
   местах старые сильные вечера, которые затухание уже обнулило, и новый вечер ниже двухсотого выпадал целиком: кто играл
   всё подряд годами (сам игрок), упирался в потолок первым и переставал набирать. Сумма (careerPrOf) порядка не читает. */
function ccPrRowTrim(row){
  if(!row || !Array.isArray(row.v)) return;
  let now=null;
  try{ now=ccAbsDay(CAREER.career.season, careerToday()); }catch(e){}
  const worth=e=>now==null ? e[0] : e[0]*ccPrDecay(Math.max(0, now-e[1]));
  row.v.sort((a,b)=>worth(b)-worth(a) || b[0]-a[0] || b[1]-a[1]);
  if(row.v.length>CC_PR_KEEP) row.v.length=CC_PR_KEEP;
}
/* ===== Power Rankings по модели Fortnite Tracker (fortnitetracker.com/article/921) =====
   Модель Epic (среднее лучших 20, вес 0.8–1.6, потолок 40 000) давала шаг в 1 пункт между соседними местами.
   1. Накопительно, сумма всего сыгранного. 2. База за место 1000·place^-0.5754: 1000 за 1-е, 265 за 10-е, 71 за
   100-е, 5 за 10 000-е.
   3. Важность ×1…×10 (кэш-кап ×1, квал Мирового кубка ×10), веса Epic растянуты с 0.8–1.6 на 1–10, дивизион кубка
   тоже здесь. 4. Затухание: 4 месяца ничего, потом −10% и до нуля к 18 месяцам.
   Потолка, топ-20 и рейтинга поля нет; числа как у Tracker (Sky 237 618 за карьеру). */
/* База за место: измеренная таблица Tracker, а не формула.
   Снято с профилей: 100 топ-игроков Европы, 12 422 результата, 1 673 окна, из powerRankingData (points, pointsNoDecay).
   Кривая не степенная, а кусочно-линейная и плоская наверху: 2-е место 90% от первого. Место абсолютное: 10-е = 0.625 и при 50, и при тысячах в поле.
   До 100-го места поместно, дальше медианы по полосам (точка в середине полосы). Хвост за тысячей на карьеру почти не влияет. */
const CC_PR_TABLE=[
  [1,1000],[2,900],[3,850],[4,825],[5,800],[6,775],[7,750],[8,725],[9,700],
  [10,625],[40,400],[50,350],[100,225],[140,205],[150,200],[170,189],[190,179.5],
  [225,163],[275,137.5],[350,116],[450,73.6],[550,48.3],[700,39.6],[900,26.2],
  [1250,19.2],[2000,17],[3750,12.8],[7500,8.4],[10000,5]
];
function ccPrBase(place){
  if(!(place>0)) return 0;
  if(place<=1) return CC_PR_TABLE[0][1];
  for(let i=1;i<CC_PR_TABLE.length;i++){
    if(place<=CC_PR_TABLE[i][0]){
      const a=CC_PR_TABLE[i-1], b=CC_PR_TABLE[i];
      return a[1]+(b[1]-a[1])*(place-a[0])/(b[0]-a[0]);
    }
  }
  return CC_PR_TABLE[CC_PR_TABLE.length-1][1];
}
/* Множитель события — тоже измеренный. Числа вышли круглыми сами, вот сколько
   строк за каждым: гранд-финал Мейджора ×10 (73), финал GC Last Chance ×5 (14),
   Reload Championship ×5 (19), верхняя сетка ×4.5 (78), нижняя ×4 (53), финал
   Reload Elite Series ×4 (35), недельный финал дивизиона ×3 (488), хиты
   Мейджора ×3 (37), его LCQ ×3 (28), групповой этап ×3 (55), финал Solo Series
   ×3 (23), квал-раунды Мейджора ×2.5 (405), плей-ины ×2 (99 и 117), обычный
   день кубка первого дивизиона ×1.5 (1420), второго ×1 (16).

   Дивизионы ниже второго в выборке не встречаются — это профили топ-100
   Европы, они туда не ходят. Полуторная ступень между первым и вторым
   продолжена вниз; это единственное место во всей модели, где стоит моя
   экстраполяция, а не их число. */
function ccPrMult(e){
  const st=e.stage||'', div=clamp(e.div||5, 1, 5);
  switch(e.kind){
    case 'globals': return 10;
    case 'summit':  return st==='final' ? 10 : (st==='upper' ? 4.5 : 4);
    case 'major':   return st==='final' ? 10 : (st==='heats' ? 3 : st==='lcq' ? 3 : 2);
    case 'rc':      return 5;
    case 'gclc':    return st==='final' ? 5 : 2;
    case 'reload':  return st==='final' ? 4 : (st==='heat' || st==='heats' ? 3 : 2);
    case 'solo':    return st==='final' ? 3 : 1.5;
    case 'final':   return 3;
    case 'victory': return 1;
    case 'eval':    return 1;
    case 'nations': return st==='final' ? 5 : st==='qual' ? 2.5 : 1;   // Кубок наций — выдумка режима, вес назначен
    default:        return [1.5, 1, 0.75, 0.5, 0.4][div-1];
  }
}
// Затухание — по их же анонсу: четыре месяца держит, потом сразу десятая часть,
// и к восемнадцати месяцам событие уходит совсем.
function ccPrDecay(age){
  if(age<=120) return 1;
  if(age>=540) return 0;
  return 0.9*(540-age)/420;
}
// Сколько стоит один результат до затухания.
/* Насколько велик этот турнир на самом деле.
 *
 * Отчёт: доска карьеры показала 743 626 у первого номера,
 * когда у самого Tracker вершина мира стоит около двухсот пятидесяти тысяч.
 * Отзыв: «не надо платить больше, надо как у трекера». Дело было не в
 * таблице очков — она снята с Tracker и сверена по их строкам, — а в поле, по
 * которому рейтинговалось место. Карьера играет турниры выборкой: кубок
 * пятого дивизиона собирает тысячу дуо, а играется комнатой в полторы сотни.
 * Место читалось в комнате, и последний в ней получал очки сотого места мира —
 * двести двадцать пять вместо тридцати.
 *
 * Настоящий размер не выдуман здесь заново: он берётся оттуда же, откуда его
 * берёт плитка дня (ccNextShape), чтобы «сколько человек в этом турнире» был
 * один ответ на весь файл. Париж и Ласт Ченс носят у неё вид 'gc'. */
function ccPrField(e){
  const cr=CAREER && CAREER.career;
  if(!cr) return 0;
  const k=(e && e.kind) || 'cup';
  const t=(k==='rc' || k==='gclc') ? 'gc' : k;
  const save=cr.day;
  /* Profile asks this for every logged night; a past day rebuilds careerPools for that day and evicts today's.
     Same day in the same career frame gives the same field, so it is memoised. Online keeps the direct path. */
  const solo=!(typeof ccMpTeam==='function' && ccMpTeam()) && !(typeof ccRaceOn==='function' && ccRaceOn());
  const mk=solo ? [t, (e && e.day) || save, cr.division, cr.season, cr.year, cr.year0, cr.size, CC_EVENT_SIZE||0,
    ccPoolRegion(), CC_REGION_AS||'', CC_NOW_YEAR_FORCE||0, PLAYERS.length].join('|') : null;
  const memo=ccPrField.m || (ccPrField.m=new Map());
  if(mk && memo.has(mk)) return memo.get(mk);
  /* Прошлый день пересобирает пул по своему снимку, а посев троек пишет в живую карьеру: показ «Профиля» стирал
     память троек. Здесь только размер поля, поэтому мир и кэш пула возвращаются как были. */
  const keepK=['trios','trioFilled','trioCores','triosSeeded','orphanMate'], keep={};
  keepK.forEach(k=>{ keep[k]=cr[k]===undefined ? undefined : JSON.stringify(cr[k]); });
  const pools0=CC_POOLS, away0=CC_POOLS_AWAY;
  try{
    if(e && e.day) cr.day=e.day;
    const sh=ccNextShape({type:t, day:cr.day});
    const of=(sh && sh.of>1) ? sh.of : 0;
    if(mk){ if(memo.size>4000) memo.clear(); memo.set(mk, of); }
    return of;
  }catch(err){ return 0; }
  finally{
    cr.day=save;
    if(e && e.day && e.day!==save){
      let moved=false;
      keepK.forEach(k=>{ const now=cr[k]===undefined ? undefined : JSON.stringify(cr[k]);
        if(now===keep[k]) return; moved=true; if(keep[k]===undefined) delete cr[k]; else cr[k]=JSON.parse(keep[k]); });
      CC_POOLS=pools0; CC_POOLS_AWAY=away0;
      if(moved && typeof careerSave==='function') careerSave();
    }
  }
}
/* Место рейтингуется в настоящем поле, а не в комнате.
 *
 * Здесь, а не в careerPrAdd, ровно по одной причине: доска считается из
 * копилки, «История» — из лога, и обе идут через эту функцию. Разведи правило
 * по двум местам — и они разойдутся числами, что проверка careerPrAdd и ловит.
 *
 * Двойного растяжения не бывает: строка, у которой of уже настоящий (опен
 * пишет showPlace/showOf), даёт k=1 и остаётся как есть. */
function ccEventPR(e, trueOf){
  if(!(e.of>1) || !(e.place>0)) return null;
  const of=Math.max(e.of, trueOf>0 ? trueOf : ccPrField(e));
  return Math.round(ccPrBase(ccStretchTo(e.place, e.of, of))*ccPrMult(e)*10)/10;
}
// How old a result is. A career year is walked as dates inside one calendar
// year and then starts again, so the years are counted before the days.
function ccPrAge(e){
  return Math.max(0, ccAbsDay(CAREER.career.season, careerToday())
                   - ccAbsDay(e.season, e.day||careerToday()));
}
/* The whole ledger: what each result is worth today, which twenty count, and
   the rating that comes out of them. Read off the log rather than stored, so a
   career that was played before any of this existed still has a PR — and so
   decay is answered at the moment it is asked rather than written down once. */
function ccPrTable(log){
  const rows=(log||[]).map(function(e){
    const raw=ccEventPR(e);
    return raw==null ? null : {e:e, pr:Math.round(raw*ccPrDecay(ccPrAge(e)))};
  }).filter(Boolean);
  const best=rows.slice().sort((a,b)=>b.pr-a.pr).slice(0, CC_PR_KEEP);
  const counted=new Set(best.map(r=>r.e));
  const by=new Map(rows.map(r=>[r.e, r.pr]));
  return {pr: Math.round(rows.reduce((s,r)=>s+r.pr,0)),
          counted:counted, by:by, of:rows.length};
}

/* Career timeline. The feed keeps only 40 posts, so milestones need a permanent home.
   It's the save's own history, not the card's (real tournaments of a taken card show on the creation screen).
     derived  wins, Major podiums, division changes: read from cr.log at render, so it can't disagree with the table.
     stored   everything that isn't a result: cr.events, written where it happens, effectively uncapped
              (two numbers and a key each). */
const CC_EVENTS_KEEP=150;
function careerEvent(kind, args){
  const cr=CAREER.career;
  cr.events=cr.events||[];
  // The timeline is written in the words of the season it happened in, the way
  // the feed and the inbox are. See ccSquadKey.
  cr.events.push({day:careerToday(), season:cr.season, k:ccSquadKey(kind), a:args||[]});
  if(cr.events.length>CC_EVENTS_KEEP) cr.events.splice(0, cr.events.length-CC_EVENTS_KEEP);
}
// Which finals are worth a line of their own when they go well.
const CC_TL_BIG={major:1, summit:1, globals:1, gc:1, rc:1};
function careerTimeline(){
  const cr=CAREER.career, log=cr.log||[];
  const out=(cr.events||[]).map(e=>({day:e.day, season:e.season, k:e.k, a:e.a}));
  let lastDiv=null;
  log.forEach(e=>{
    // The rung changing is the one thing a table of placements hides: it is the
    // row after the one that earned it.
    if(lastDiv!=null && e.div!=null && e.div!==lastDiv)
      out.push({day:e.day, season:e.season,
                k:e.div<lastDiv ? 'tlUp' : 'tlDown', a:[e.div]});
    if(e.div!=null) lastDiv=e.div;
    if(e.place===1) out.push({day:e.day, season:e.season, k:'tlWon', a:[e.of, e.div]});
    else if(e.place<=3 && CC_TL_BIG[e.kind])
      out.push({day:e.day, season:e.season, k:'tlPodium', a:[e.place, e.of]});
  });
  // Newest first, and a stable order inside a day: the events written that day
  // read after the result that caused them.
  return out.sort((a,b)=>a.day<b.day ? 1 : a.day>b.day ? -1 : 0);
}
function careerTimelineHTML(){
  const rows=careerTimeline();
  if(!rows.length) return '';
  return `<div class="ch-tile cc-tl">
    <h4>${L().ccTimeline}</h4>
    <div class="ch-hint">${L().ccTimelineHint}</div>
    ${rows.map(e=>`<div class="cc-tl-row">
      <span class="cc-tl-d">${ccStamp(e)}</span>
      <span class="cc-tl-t">${ccMentions(ccText(e))}</span>
    </div>`).join('')}
  </div>`;
}
/* ===== The seasons that already happened =================================

   His ask, 20 August: a history of past seasons — who won what, every event,
   and every region, because a career played in Europe should still be able to
   look up who took the Asian Major.

   Nothing here is stored. A season's winners are computed when the screen asks,
   off a seed that never changes for this career — so the archive reads the same
   on every visit without a byte added to the save, and an old career gets its
   whole past for free the first time it opens the tab. The player's own wins
   are the exception: those really happened, they are in the log, and they
   overwrite the generated name wherever the log says place one. */
// Тот же роастер, что видит карьера, только для чужого региона: архив рисует
// все семь сцен. Была отдельная копия — см. ccSceneRoster, там же и почему.
function ccArcRoster(reg){ return ccSceneRoster(reg); }
/* Настоящие пары в истории, во всех семи регионах. Ветка `if(lead.partner)` не срабатывала никогда (partner
   пуст у всех карточек: EU 911, NAC 600, ASIA 538), и ccPickThird выдумывал пары на каждый турнир: напарник между
   таблицами Мейджоров сохранялся у 19%, в трио-сезоне у 0%, призовые в истории платили выдуманным парам.
   Свой регион берёт тот же пул, что живые лобби (careerPools), так что история называет те же дуо. Остальные
   шесть: записанные пары ростера, сильнейшие первыми, никто в двух. Кэш CC_ARC_PAIRS объявлен рядом с CC_NOW_CARDS
   и чистится вместе с ним. */
/* Пары своего года (y, календарный год сезона архива). Пары чужого региона брались из всех лет и кэшировались
   без сезона, поэтому каждый сезон Истории побеждали одни и те же (tools/probe-arc-cont.js, NAC 2022–2024).
   Теперь сначала пары с карточками года этого сезона, потом остальные записанные. Свой регион в идущем году
   берётся из живого пула карьеры. */
function ccArcPairs(reg, y){
  if(reg===ccPoolRegion() && (y==null || y===ccArcCalYear(CAREER.career.season))){
    const pool=careerPools(), inPair=new Set();
    (pool.duos||[]).forEach(d=>d.cards.forEach(c=>inPair.add(hKey(c))));
    return {pairs:(pool.duos||[]).map(d=>({cards:d.cards.slice(), avg:d.avg})),
            singles:(pool.players||[]).filter(c=>!inPair.has(hKey(c)))
                      .slice().sort((a,b)=>ccCardOvr(b)-ccCardOvr(a))};
  }
  const ck=reg+'|'+(y||'');
  if(CC_ARC_PAIRS[ck]) return CC_ARC_PAIRS[ck];
  const roster=ccArcRoster(reg), by=new Map();
  roster.forEach(c=>by.set(hKey(c), c));
  const seen=new Map();
  const take=p=>{
    rosterEntriesOf(p).forEach(function(e){
      // Тройки 2025-го записаны в той же форме; здесь нужна пара.
      if(!e.entry || e.entry.duo.length!==2) return;
      const ks=e.entry.duo.map(h=>hKey(h)).sort(), id=ks.join('|');
      if(seen.has(id)) return;
      const a=by.get(ks[0]), b=by.get(ks[1]);
      if(!a || !b) return;
      seen.set(id, {cards:[a, b], avg:(ccCardOvr(a)+ccCardOvr(b))/2, yr:!!(y && ccCardYear(p)===y)});
    });
  };
  if(y) PLAYERS.forEach(p=>{ if((p.region||'')===reg && ccCardYear(p)===y) take(p); });
  PLAYERS.forEach(p=>{ if((p.region||'')===reg) take(p); });
  const taken=new Set(), pairs=[];
  [...seen.values()].sort((a,b)=>(b.yr-a.yr) || (b.avg-a.avg)).forEach(d=>{
    const ka=hKey(d.cards[0]), kb=hKey(d.cards[1]);
    if(taken.has(ka) || taken.has(kb)) return;
    taken.add(ka); taken.add(kb); pairs.push(d);
  });
  CC_ARC_PAIRS[ck]={pairs:pairs, singles:roster.filter(c=>!taken.has(hKey(c)))};
  return CC_ARC_PAIRS[ck];
}
// Третий к записанной паре — тем же броском, каким его сажает живое лобби:
// сезон, дивизион 1 и сами эти двое. См. coreRnd в careerCupField; ключ общий,
// поэтому и память карьеры (cr.trios) читается тем же ключом.
function ccArcCoreKey(cards){ return cards.map(c=>hKey(c)).sort().join('+'); }
function ccArcCoreRnd(sn, cards){
  return careerRng(hashStr('t'+(sn||1)+'d1|'+ccArcCoreKey(cards)));
}
// A champion team out of a region: a recorded pair off the top of the scene,
// and the seat beside it chosen for the pair it is joining.
function ccArcTeam(reg, size, rng, skip, y){
  const roster=ccArcRoster(reg);
  if(!roster.length) return null;
  const src=ccArcPairs(reg, y);
  const out=h=>(skip && skip.has(hKey(h)));
  const has=h=>team.some(c=>hKey(c)===hKey(h)) || out(h);
  /* Из верхней полосы сцены, а не из одной точки: полоса — это команды, из
     которых сезон вообще может выбрать чемпиона, а бросок решает, какая из них
     чемпион этого сезона. Раньше здесь стояла верхушка КАРТОЧЕК, и пара
     собиралась из двух соседей по рейтингу — то есть чемпионом сезона
     объявлялись двое, никогда вместе не игравшие. */
  const band=src.pairs.filter(d=>!d.cards.some(c=>out(c)));
  const pool=band.slice(0, Math.max(3, Math.min(12, Math.ceil(band.length/8))));
  const team=pool.length ? pool[Math.floor(rng()*pool.length)].cards.slice()
                         : (roster.filter(c=>!out(c)).slice(0,1));
  if(!team.length) return null;
  /* Третий — из тех, кто рядом по силе: свободные имена сцены и половинки пар
     ниже полосы. Кого именно, решает ccPickThird: с кем играл, чей флаг. */
  const near=src.singles.slice(0, Math.max(size*20, 60))
    .concat(band.slice(pool.length, pool.length+40).reduce((a,d)=>a.concat(d.cards), []));
  while(team.length<size){
    const free=near.filter(c=>!has(c));
    if(!free.length) break;
    const at=ccPickThird(team, free, rng, reg);
    team.push(free[at<0 ? 0 : at]);
  }
  let i=0;
  while(team.length<size && i<roster.length){
    const c=roster[i++];
    if(!has(c)) team.push(c);
  }
  return team.length>=Math.min(size, 1) ? team.slice(0, size) : null;
}
function ccArcName(team){ return team ? team.map(c=>c.handle).join(' & ') : '-'; }
// The regions a LAN's winner is drawn from, weighted the way the scene is.
const CC_ARC_LAN_W=[['EU',4],['NAC',3],['NAW',2],['BR',2],['ASIA',1],['ME',1],['OCE',1]];
function ccArcLanRegion(rng){
  const total=CC_ARC_LAN_W.reduce((s,w)=>s+w[1],0);
  let roll=rng()*total;
  for(const [reg,w] of CC_ARC_LAN_W){ roll-=w; if(roll<0) return reg; }
  return 'EU';
}
// Which major a final the log holds belongs to, read off its month: the year
// is the same measured calendar every season, so May is always Major 1's
// window and August Major 2's, and the trios year splits in thirds.
// Календарь сезона N: 2024, 2025 или 2026 (все годы после — по календарю 2026-го).
function ccArcCalYear(sn){ const y=(typeof ccSeasonYearOf==='function') ? ccSeasonYearOf(sn) : 2026; return y>=2026 ? 2026 : y; }
// Сколько Мейджоров в году того сезона: 2026 — два, 2025 и 2024 — три.
/* Годы 2019–2023 — у каждого свой набор: World Cup Solo/Duos, FNCS Season X и C2S1 (2019),
   три сезона C2 (2020), C2S5–C2S8 и Grand Royale (2021), C3S1–C3S3 (2022), три Мейджора и
   LCM (2023). Сколько и какой — по календарю года (Major<n>_<год>_…). */
function ccArcRowsOf(y){
  return y===2019 ? CAREER_YEAR_2019 : y===2020 ? CAREER_YEAR_2020 : y===2021 ? CAREER_YEAR_2021
       : y===2022 ? CAREER_YEAR_2022 : y===2023 ? CAREER_YEAR_2023 : null;
}
function ccArcOldMajors(y){
  const rows=ccArcRowsOf(y); if(!rows) return null;
  const re=new RegExp('^Major(\\d)_'+y+'_'), ns=new Set();
  rows.forEach(r=>{ const m=re.exec(r[2]); if(m) ns.add(+m[1]); });
  return ns.size ? [...ns].sort((a,b)=>a-b) : null;
}
// Размер состава Мейджора в году сезона: у 2019–2020 — по спеке турнира, 2021 — трио, 2022–2023 — дуо.
function ccArcMajorSize(sn, n, fallback){
  const y=ccArcCalYear(sn), sp=(typeof ccMXSpec==='function') ? ccMXSpec(y, n) : null;
  if(sp) return sp.size;
  if(y===2021) return 3;
  if(y===2022 || y===2023) return 2;
  return fallback;
}
function ccArcMajors(sn){
  const y=ccArcCalYear(sn);
  return ccArcOldMajors(y) || (y===2026 ? [1,2] : [1,2,3]);
}
// Имя Мейджора в Истории: у 2019–2023 — сезон FNCS своего года, дальше — «Мейджор N».
function ccArcMajorLabel(sn, n){
  const y=ccArcCalYear(sn);
  if(y===2023) return n===4 ? 'FNCS Last Chance Major' : 'FNCS Major '+n;
  if(y<=2022){ const nm=ccSeasonEvName(y, n); if(nm) return nm; }
  return L().ccSlotMajor(n);
}
function ccArcMajorOf(day, sn){
  const m=+String(day||'').slice(5,7)||1;
  const y=ccArcCalYear(sn);
  const rows=ccArcRowsOf(y);
  if(rows){
    const re=new RegExp('^Major(\\d)_'+y+'_');
    const hit=rows.find(r=>day>=r[0] && day<=r[1] && re.test(r[2]));
    if(hit) return +re.exec(hit[2])[1];
  }
  if(y===2025) return m<=2 ? 1 : m<=4 ? 2 : 3;       // финалы: февраль, апрель, август
  if(y===2024) return m<=2 ? 1 : m<=5 ? 2 : 3;       // февраль, май, июль
  if(y===2023) return m<=3 ? 1 : m<=5 ? 2 : 3;
  if(y===2022) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, август
  if(y===2021) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, сентябрь
  if(y===2019) return m<=7 ? 1 : m<=9 ? 2 : 3;       // Нью-Йорк, Season X, C2S1
  if(y===2020) return m<=4 ? 1 : m<=8 ? 2 : 3;       // C2S2, C2S3, C2S4       // март, май, август
  return m<=6 ? 1 : 2;                                // май, август
}
/* НАСТОЯЩИЙ ГРАНД-ФИНАЛ В ИСТОРИИ.

   Сезон, который играется людьми ТОГО ЖЕ года (первый сезон карьеры 2019–2025),
   — это настоящий год, и его Мейджоры у Epic уже сыграны: финальные таблицы
   лежат в наборах карточек (_T[set][reg].G — та самая доска, по которой
   считались рейтинги). Чужой регион мир карьеры не играет, и вместо выдуманного
   чемпиона сцены строка называет настоящего, а таблица открывается настоящей:
   Америка 2024-го — Acorn & Cold, потом дважды Peterbot & Pollo, как и было.
   Год, где люди другие (карьера дожила до него своим миром), — по-прежнему
   реконструкция: настоящих команд того года в таком мире нет. */
function ccArcRealSet(y, n){
  const sp=(typeof ccMXSpec==='function') ? ccMXSpec(y, n) : null;
  if(sp && sp.set) return sp.set;
  const pre={2021:'j', 2022:'k', 2023:'e', 2024:'f', 2025:'t'}[y];
  const set=pre ? pre+n : null;
  return set && T_SETS.indexOf(set)>=0 ? set : null;
}
function ccArcRealGf(sn, n, reg){
  const y=ccArcCalYear(sn);
  if(y>=2026 || ccNowYear()!==y) return null;
  const set=ccArcRealSet(y, n);
  const b=set && _T[set] && _T[set][reg] && _T[set][reg].G;
  if(!b || !b.length) return null;
  const rows=b.slice().sort((p,q)=>p.rank-q.rank);
  return {set:set, rows:rows, team:rows[0].duo.map(h=>ccStageCardFrom({h:h, r:reg}))};
}
/* Закрытый сезон не меняется — его История считается один раз (Notion 15.10, «лаги после первой
   церемонии»: вкладка пересобирала сцену сезона на каждую отрисовку, ~55 мс, ccPickThird по всем
   регионам). Кэш живёт на объекте карьеры: другой слот или перезагрузка читают заново; язык и
   журнал в ключе — подписи и строки игрока. Идущий сезон — в пределах дня: день тоже в ключе. */
const CC_ARC_SEASON=new WeakMap();
function careerArchiveSeason(sn){
  const cr=CAREER.career;
  let m=CC_ARC_SEASON.get(cr);
  if(!m){ m={}; CC_ARC_SEASON.set(cr, m); }
  const ck=sn+'|'+(sn<cr.season ? '' : cr.day+'|'+(cr.seasonOver?1:0))+'|'+(typeof LANG!=='undefined' ? LANG : '')+'|'+
           (CAREER.player.nick||'')+'|'+ccCareerRegion()+'|'+(cr.log||[]).length+'|'+Object.keys(cr.arcWorld||{}).length;
  if(sn<cr.season) return m[ck] || (m[ck]=careerArchiveSeasonRaw(sn));
  // Идущий сезон — одна последняя запись, а не по записи на каждый день.
  if(!m.live || m.live.ck!==ck) m.live={ck:ck, a:careerArchiveSeasonRaw(sn)};
  return m.live.a;
}
function careerArchiveSeasonRaw(sn){
  const cr=CAREER.career;
  // What that season was actually played in, not what its number implies.
  const size=careerSeasonSize(sn);
  const seed=tag=>careerRng(ccHashStr('arc|'+(CAREER.player.nick||'')+'|'+sn+'|'+tag));
  const mine=ccCareerRegion();
  /* What the player actually did that season, straight off the log.

     Not only what they won. The line on the tile is still first place and
     nothing else, but the table behind that line needs the player's row
     wherever it finished — so the entry itself is kept and `wins` is read back
     out of it. See careerArchiveFinal. */
  const me={majors:{}, summit:null, paris:null, gc:null, nations:null, solo:null};
  // The whole seat, where the entry recorded it; one handle is what a save
  // written before ccLogMates has, and it reads as it always did.
  const meTeam=e=>[CAREER.player.nick]
    .concat((e.mates && e.mates.length) ? e.mates : (e.mate?[e.mate]:[])).join(' & ');
  (cr.log||[]).forEach(e=>{
    if(e.season!==sn) return;
    if(e.kind==='major' && e.stage==='final') me.majors[ccArcMajorOf(e.day, sn)]=e;
    if(e.kind==='summit' && e.stage==='final') me.summit=e;
    if(e.kind==='rc' && e.stage==='final') me.paris=e;
    if(e.kind==='globals') me.gc=e;
    // Кубок наций и соло — просьба: «history пусть будет
    // national cap тоже там и соло, крупные турниры крч».
    if(e.kind==='nations' && e.stage==='final') me.nations=e;
    if(e.kind==='solo' && e.stage==='final') me.solo=e;
  });
  /* Финал своего Мейджора, до которого игрок не дошёл, мир всё равно сыграл
     (careerWorldFinals) — с победителем в ленте и деньгами в доске. Его запись
     (cr.arcWorld) встаёт на место записи журнала: История называет того же
     чемпиона и ту же таблицу, а не выдуманную сцену. */
  const aw=cr.arcWorld||{};
  Object.keys(aw).forEach(k=>{
    const m=/^(\d+)\|major(\d)$/.exec(k);
    if(m && +m[1]===sn && !me.majors[+m[2]]) me.majors[+m[2]]=aw[k];
  });
  const won=e=>(e && e.place===1) ? meTeam(e) : null;
  /* Что игрок ВИДЕЛ своими глазами.

     Его снимки, 26 августа: карьера отыграла Мировой чемпионат, финишировала
     25-й и смотрела, как его выигрывают SwizzY & Pixie, — а в Истории строка
     Глобала называла чемпионом Salko & Yumi и открывалась таблицей, где той
     пары нет вовсе. Потому что чемпион здесь ВЫЧИСЛЯЛСЯ из выдуманной верхушки
     сцены, а настоящий результат перекрывал его только в одном случае: когда
     турнир выиграл сам игрок.

     Теперь вечер оставляет в журнале состав своего победителя (ccStageSeatRow,
     пишется там же, где строка результата), и История читает его. Сейв без
     записи — старая карьера — работает как раньше: вычисленный чемпион на
     месте, ломать прошлые сезоны нечем. */
  const seenWin=e=>{
    if(!e || !Array.isArray(e.won) || !e.won.length) return null;
    const cards=e.won.map(ccStageCardFrom);
    if(!cards.length || !cards[0]) return null;
    return {name:ccArcName(cards), team:cards, reg:cards[0].region||null};
  };
  const wins={majors:{}, summit:won(me.summit), paris:won(me.paris), gc:won(me.gc),
              nations:won(me.nations), solo:won(me.solo)};
  Object.keys(me.majors).forEach(n=>{ const w=won(me.majors[n]); if(w) wins.majors[n]=w; });
  /* The season has a scene, and the scene persists.

     His correction, 20 August: три мейджора одного года не выигрывают три
     случайные тройки — команда, взявшая слот на LAN, доигрывает год тем же
     составом, чтобы слот не потерять. So each region gets ONE seeded top
     scene for the whole season — three standing teams — and every event's
     winner comes out of it, with the champion defending more often than not.
     The LANs are won by the teams that qualified for them: the Summit by
     some region's Major 1 champion, the Global Championship by a team that
     won its way there that same year. */
  const majors=ccArcMajors(sn);
  const scene={};
  REGIONS.forEach(r=>{
    const rng=seed('scene|'+r.code);
    const teams=[]; const used=new Set();
    for(let i=0;i<3;i++){
      const t=ccArcTeam(r.code, size, rng, used, ccArcCalYear(sn));
      if(t && t.length===size){ t.forEach(c=>used.add(hKey(c))); teams.push(t); }
    }
    // The champions of the year's majors, drawn from that one scene: the
    // winner defends the next major six times in ten, and loses it to the
    // second team of the same scene otherwise.
    const champs=[]; let hold=0;
    majors.forEach((n,i)=>{
      if(i===0){ champs.push(0); return; }
      const r2=rng();
      // Defends a little under half the time: squads persist, dynasties are rare.
      hold = r2<0.45 ? champs[i-1] : (champs[i-1]+1+Math.floor(r2*10)%Math.max(1,teams.length-1))%teams.length;
      champs.push(hold);
    });
    scene[r.code]={teams, champs};
  });
  // The team, and then its name: the table behind the line is built out of the
  // same eleven cards the line was named after, so the champion in the tile and
  // the champion in the standings are the same people.
  const teamOf=(reg,i)=>{const sc=scene[reg]; return sc.teams[Math.min(i, sc.teams.length-1)]||null;};
  const nameOf=(reg,i)=>ccArcName(teamOf(reg,i));
  const regional=majors.map((n,mi)=>{
    const perReg={};
    REGIONS.forEach(r=>{
      const own=r.code===mine && wins.majors[n];
      // Чемпион — составом САМОГО турнира: у World Cup Solo и C2S3 это один человек.
      const evSz=ccArcMajorSize(sn, n, size);
      const team0=teamOf(r.code, scene[r.code].champs[mi]);
      const team=(team0 && evSz<team0.length) ? team0.slice(0, evSz) : team0;
      // Свой мейджор игрок отыграл: чемпион там тот, кого он видел, а не
      // тот, кого вычислила сцена. См. seenWin.
      const mSeen=r.code===mine ? seenWin(me.majors[n]) : null;
      // Где был свой вечер (журнал или мир карьеры) — он и остаётся правдой.
      const real=(own || mSeen || (r.code===mine && me.majors[n])) ? null : ccArcRealGf(sn, n, r.code);
      perReg[r.code]=own ? {name:wins.majors[n], you:true, team}
                   : mSeen ? {name:mSeen.name, team:mSeen.team}
                   : real ? {name:ccArcName(real.team), team:real.team, real:real}
                         : {name:ccArcName(team), team};
    });
    return {label:ccArcMajorLabel(sn, n), perReg, mi, n, mine:me.majors[n]||null};
  });
  const global=[];
  /* Саммит и Париж стоят в архиве каждого сезона, не только дуо. Было
     `if(size===2)` по реальному 2025, но календарь карьеры один, и в трио-год
     Саммит тоже играется: без этого выигранный турнир пропадал из Истории, хотя
     деньги в careerMoneyAdd учитывались. Числа переводятся в состав сезона
     (ccArcCount, ccTeams), трио-Саммит садится в 33 команды. */
  /* ЛАН выигрывает чемпион мейджора — и именно тот, кого этой же строкой
     называет сам мейджор.

     Отзыв: «в истории не сходятся ФНКС и Саммиты». Так и было.
     Саммит брал имя из scene[reg].champs[0] — из выдуманной верхушки сцены, —
     а строка «Мейджор 1» того же региона умеет говорить другое: если мейджор
     выиграл сам игрок, она называет его. Две строки одной Истории про одного и
     того же чемпиона Европы называли двух разных чемпионов.

     Теперь имя читается из строки мейджора (majorName), а регион ЛАНа не
     выпадает на тот, чей мейджор игрок взял сам, — иначе пришлось бы объявить
     чемпионом ЛАНа человека, у которого в журнале за тот вечер стоит третье
     место. Если ЛАН он выиграл, строка и так его: ветка wins.* стоит первой. */
  const majorRow=(n, reg)=>{
    const r=regional.find(x=>x.n===n);
    return r ? (r.perReg[reg]||{}) : {};
  };
  const majorName=(n, reg)=>majorRow(n, reg).name;
  const lanRegion=(rng, n)=>{
    for(let i=0;i<8;i++){ const r=ccArcLanRegion(rng); if(!majorRow(n, r).you) return r; }
    const free=REGIONS.map(r=>r.code).filter(r=>!majorRow(n, r).you);
    return free[0] || mine;
  };
  /* Но только в году, где они ЕСТЬ.

     Тестер, 22 сентября, скрин Сезонов из карьеры 2024-го: Summit и Reload
     Championship стояли в списке «ещё впереди» — двумя турнирами, которых в
     том году не было и не будет. В календарях 2024-го и 2025-го
     (CAREER_YEAR_2024 / CAREER_YEAR_2025) из ЛАНов стоит один
     GlobalChampionship — Форт-Уэрт и Лион. Саммит и круг Reload — календарь
     2026-го, там они и показываются. */
  if(ccArcCalYear(sn)===2026){
    // The Summit is Major 1's LAN, so its champion IS somebody's Major 1
    // champion — the strongest scenes more often.
    const sSeen=seenWin(me.summit);
    const sr=wins.summit ? mine
           : (sSeen && sSeen.reg) ? sSeen.reg : lanRegion(seed('summit'), 1);
    global.push({slot:'summit', label:'Summit', mine:me.summit,
      win:{reg:sr,
           name:wins.summit || (sSeen && sSeen.name) ||
                majorName(1, sr) || nameOf(sr, scene[sr].champs[0]),
           you:!!wins.summit,
           team:(sSeen && sSeen.team) || teamOf(sr, scene[sr].champs[0])}});
    // Paris is the Reload circuit's own final — its winner is that scene's
    // second team as often as its first.
    const pr=wins.paris ? mine : ccArcLanRegion(seed('paris'));
    /* Париж — другой круг, и чемпион у него свой. Два ЛАНа выпадали на одну и
       ту же пару, когда броски совпадали регионом и номером; тогда берётся
       соседняя команда той же сцены. */
    let pi=seed('paris|i')()<0.5?0:1;
    if(!wins.paris && !wins.summit && pr===global[0].win.reg &&
       nameOf(pr, pi)===global[0].win.name) pi=pi?0:1;
    const pSeen=seenWin(me.paris);
    global.push({slot:'rc', label:'Reload Championship', mine:me.paris,
      win:{reg:(pSeen && pSeen.reg) || pr,
           name:wins.paris || (pSeen && pSeen.name) || nameOf(pr, pi),
           you:!!wins.paris, team:(pSeen && pSeen.team) || teamOf(pr, pi)}});
  }
  // The Global Championship is won by a team that won its way there that
  // year: the region's last major champion. До 2022-го его не было; в 2022-м —
  // FNCS Invitational в Роли.
  const arcY=ccArcCalYear(sn);
  const lastN=majors[majors.length-1];
  if(arcY>=2022){
  const gSeen=seenWin(me.gc);
  const gr=wins.gc ? mine
         : (gSeen && gSeen.reg) ? gSeen.reg : lanRegion(seed('gc'), lastN);
  const gi=scene[gr].champs[majors.length-1];
  global.push({slot:'gc', label:arcY===2022 ? 'FNCS Invitational' : 'Global Championship', mine:me.gc,
    win:{reg:gr,
         name:wins.gc || (gSeen && gSeen.name) || majorName(lastN, gr) || nameOf(gr, gi),
         you:!!wins.gc, team:(gSeen && gSeen.team) || teamOf(gr, gi)}});
  }
  /* КУБОК НАЦИЙ — ЛАН КАЖДОГО ГОДА.

     Просьба: «history пусть будет national cap тоже там и
     соло, крупные турниры крч». NationsFinal стоит во всех трёх календарях
     (2024, 2025, 2026), значит строка есть у любого сезона. Чемпион читается
     тем же правилом, что у остальных ЛАНов: сыграл сам и выиграл — ты;
     сыграл и видел победителя — он (ccStageSeatRow в журнале); не играл —
     верхушка сцены своего броска. */
  {
    /* Чемпион здесь — СТРАНА, а не пара из сцены: зал Кубка наций собирается
       из сборных по четыре (ccNationsBook), и строка обязана называть то же,
       что назовёт её таблица. Побеждает одна из пяти сильнейших сборных —
       бросок сезона, как у остальных ЛАНов. */
    const nSeen=seenWin(me.nations);
    const nats=ccArcNatRows();
    const ni=nats.length ? Math.floor(seed('nations|n')()*Math.min(5, nats.length)) : 0;
    const row=nats[ni]||null;
    const nr=wins.nations ? mine : (nSeen && nSeen.reg) ? nSeen.reg : ccArcLanRegion(seed('nations'));
    global.push({slot:'nations', label:L().ccNatCongrats, mine:me.nations,
      win:{reg:nr,
           name:wins.nations || (nSeen && nSeen.name) || (row ? natDisplay(row.nat) : '-'),
           nat:row ? row.nat : null,
           you:!!wins.nations, team:(nSeen && nSeen.team) || (row ? row.top : null)}});
  }
  /* СОЛО — ТОЛЬКО ТАМ, ГДЕ КРУПНЫЙ СОЛО-ТУРНИР ЕСТЬ.

     Отзыв: «соло самые крупные». Единый соло-финал есть у календаря
     2026-го (SoloSeries_Final); в 2025-м из соло только шестнадцать Solo Cash
     Cup — это кубки, а не чемпионат, — а в 2024-м нет и их. Так же, как
     Саммит и круг Reload не показываются в годах, где их не было. */
  if(ccArcCalYear(sn)===2026){
    const sSeen2=seenWin(me.solo);
    const sr2=wins.solo ? mine : (sSeen2 && sSeen2.reg) ? sSeen2.reg : ccArcLanRegion(seed('solo'));
    const si=seed('solo|i')()<0.5 ? 0 : 1;
    // Соло — один человек, не состав: из тройки берётся первая карточка.
    const one=(t)=>(t && t.length) ? t.slice(0,1) : t;
    const seenOne=sSeen2 ? one(sSeen2.team) : null;
    global.push({slot:'solo', label:(L().ccYearNames && L().ccYearNames.SoloSeries_Final) || 'Solo Series',
      mine:me.solo,
      win:{reg:sr2,
           name:wins.solo || (seenOne ? ccArcName(seenOne) : ccArcName(one(teamOf(sr2, si)))),
           you:!!wins.solo, team:seenOne || one(teamOf(sr2, si))}});
  }
  return {size, home:mine, regional, global, scene};
}
/* Archive final table: the field is built from that region's roster and played with the career engine
   (same games, scoring, purse). Math.random is a seeded stream during the sim, so reopening gives the same table.
   The season champion comes from the cheap tile above, so it swaps rows with whoever actually won the twelve
   games. The player's own row is copied from the log at its recorded place, others pushed down. */

// What a final of this kind is: the field it seats, the games it plays, what an
// elimination is worth in it and whether that is capped. Read off the constants
// the career's own runners read, so a change to the event changes its history
// with it rather than leaving the archive telling the old story.
/* Двадцать пять сильнейших сборных — тот же зал, что у настоящего финала
   Кубка наций (CC_NATIONS_FIELD). Книга строится из сцены региона за регионом
   и уже отбирает страны, у которых есть четверо (CC_NATIONS_SQUAD). */
function ccArcNatRows(){
  let book=null;
  try{ book=ccNationsBook(); }catch(e){ book=null; }
  const list=(book && book.list) ? book.list.slice() : [];
  return list.sort((a,b)=>b.pow-a.pow).slice(0, CC_NATIONS_FIELD);
}
/* Зал соло — сотня одиночек, по силе. Берётся та же сцена, из которой архив
   собирает всё остальное; регион по тому же весу, что у ЛАНов. */
