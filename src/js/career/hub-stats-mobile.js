/*@@PART js/career/hub-stats-mobile.js@@*/
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
  // Счёт с соперником сезона - по первой таблице дня (ccRivalAfterTable).
  try{ ccRivalAfterTable(ranked); }catch(e){}
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
function ccArcSoloSeats(n, champ){
  const out=[], seen=new Set();
  const champKey=(champ && champ[0]) ? hKey(champ[0]) : null;
  if(champ && champ[0]){ seen.add(champKey); out.push({cards:[champ[0]], reg:champ[0].region||'EU', champ:true}); }
  const total=CC_ARC_LAN_W.reduce((s,w)=>s+w[1], 0);
  CC_ARC_LAN_W.forEach(w=>{
    const want=Math.max(1, Math.round(n*w[1]/total));
    let ro=[]; try{ ro=ccArcRoster(w[0]); }catch(e){ ro=[]; }
    let got=0;
    ro.forEach(p=>{
      if(got>=want || out.length>=n || !p) return;
      const k=hKey(p); if(!k || seen.has(k)) return;
      seen.add(k); out.push({cards:[p], reg:w[0], champ:false}); got++;
    });
  });
  return out.slice(0, n);
}
function ccArcEvent(kind){
  // Кубок наций — сборные по четыре, двенадцать игр; соло — сотня одиночек.
  if(kind==='nations') return {field:CC_NATIONS_FIELD, games:CC_NATIONS.final.games,
                               kill:CC_NATIONS.final.kill, pts:pointsForPlace, cap:0};
  if(kind==='solo')    return {field:CC_SOLOS_STAGES.final.field, games:CC_SOLOS_STAGES.final.games,
                               kill:CC_SOLOS_STAGES.final.kill, pts:pointsForPlace, cap:0};
  if(kind==='rc')     return {field:CC_RC_FINAL.teams, games:CC_RC_FINAL.games,
                              kill:CC_RC_KILL, pts:rcPoints, cap:CC_RELOAD_KILL_CAP};
  if(kind==='summit') return {field:CC_SUMMIT_STAGE.final.field, games:CC_SUMMIT_STAGE.final.games,
                              kill:CC_SUMMIT_STAGE.final.kill, pts:majorPoints, cap:0};
  if(kind==='gc')     return {field:CC_GLOB_FIELD, games:CC_GLOB_GAMES,
                              kill:CC_GLOB_KILL, pts:majorPoints, cap:0};
  return {field:CC_MAJOR_STAGE.final.field, games:CC_MAJOR_STAGE.final.games,
          kill:CC_MAJOR_STAGE.final.kill, pts:majorPoints, cap:0};
}
/* The purse, place by place.

   Every one of these is the table the event itself pays out of, so a row in
   the archive is the cheque that was really written — except that a regional
   Major reads the region of the row rather than the region of the player.
   majorPrize cannot: it answers for the career's own cheque and takes its
   region off the save. Asia's Major pays Asia's table here. */
function ccArcPrize(kind, reg){
  if(kind==='rc') return rcPrize;
  if(kind==='summit'){ const t=(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES.SUMMIT)||{};
                       return p=>t[String(p)]||0; }
  if(kind==='gc') return gcPrize;
  const tb=(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES) || {};
  const t=tb[reg] || tb.EU || {};
  return p=>t[String(p)]||0;
}
// A count written in duos, read in the squad the season was actually played in.
// ccTeams cannot be used: it answers for the season standing now, and this is
// a season that has already finished. See careerSeasonSize.
function ccArcCount(size, duos){ return size===3 ? Math.round(duos*2/3) : duos; }

/* The room, off the region's own roster.

   The champion is seated first so nobody else can be built out of their cards,
   then the seats go down the ratings: the strongest card left leads, their
   recorded partner sits beside them when the roster holds one and is free, and
   a trio's third seat is chosen for the pair it is joining rather than dealt
   off the front of the queue. Which is careerCupField's own rule — see
   ccPickThird — because a Grand Finals field and a cup field are the same
   question asked twice. */
function ccArcField(reg, size, n, rng, champ, skip, sn){
  const roster=ccArcRoster(reg), src=ccArcPairs(reg, sn!=null ? ccArcCalYear(sn) : null);
  const taken=new Set(), teams=[];
  // The player's own seat, where they were in this one. It is spoken for: the
  // room had a partner of yours in it playing beside somebody else otherwise,
  // three rows under the row the two of you finished on.
  if(skip) skip.forEach(k=>taken.add(k));
  /* Чемпион не садится второй раз, если это и есть команда игрока.

     Его снимок, 26 августа: в таблице «Malibuca & vic0» стоит первой строкой с
     подписью «это ты» и ВТОРОЙ строкой — та же пара ещё раз. Игрок назвался
     ником, который есть в ростере, напарник у него настоящий, и вычисленный
     чемпион сезона сошёлся с его же составом. Список skip держит его ник и его
     напарника — но действовал он только на выдуманные пары, а чемпион садился
     мимо него. Своя строка потом вставляется отдельно, и пара двоилась.

     Теперь чемпион проверяется тем же списком: совпал — место остаётся за
     собственной строкой игрока, она и есть та победа. */
  if(champ && champ.length===size && !(skip && champ.some(c=>skip.has(hKey(c))))){
    champ.forEach(c=>taken.add(hKey(c)));
    teams.push({reg:reg, cards:champ.slice(), champ:true});
  }
  // Записанные пары, сильнейшие первыми — та же очередь, какой садится лобби.
  const free=src.pairs.filter(d=>!d.cards.some(c=>taken.has(hKey(c))));
  const cores=free.slice(0, Math.max(0, n-teams.length));
  /* Третьи — свободные имена сцены, и только когда те кончатся, половинки пар
     за отсечкой. Порядок обратный тому, что в careerCupField, и намеренно:
     свободные — список, один и тот же для региона, а хвост пар зависит от
     размера комнаты и от того, кто в ней уже сидит. Через хвост третий у одной
     и той же пары получался разный в разных таблицах одного сезона (замер: 70%
     совпадений), через свободных — один и тот же. Разбивать пару ради третьего
     всё равно нельзя: в Европе свободных имён 575 на 168 пар. */
  const spare=[];
  if(size>2){
    src.singles.forEach(c=>{ if(!taken.has(hKey(c))) spare.push(c); });
    free.slice(cores.length).forEach(d=>d.cards.forEach(c=>spare.push(c)));
  }
  /* Кого эта карьера уже видела третьим у этой пары — тот и садится, и место
     ему держат ДО того, как комната разберёт свободных. Тот же порядок, что в
     careerCupField, и по той же причине: запомненный третий может стоять в
     паре за отсечкой, и пара, севшая раньше, уводила его молча. Замер до
     резерва: третий у одной пары совпадал в двух таблицах сезона в 70%
     случаев, потому что граница «пара играет / пара разбита» гуляла от
     чемпиона к чемпиону. */
  const memo=(CAREER && CAREER.career && CAREER.career.trios) || null;
  const reserved=new Map();
  if(size>2 && memo){
    cores.forEach(d=>{
      const key=ccArcCoreKey(d.cards), want=memo[key];
      if(!want || d.cards.some(c=>taken.has(hKey(c)))) return;
      const c=spare.find(x=>!taken.has(hKey(x)) && (x._k||hKey(x))===want)
            || roster.find(x=>(x._k||hKey(x))===want && !taken.has(hKey(x)));
      if(!c) return;
      reserved.set(key, c); taken.add(hKey(c));
    });
  }
  /* Пары идут подряд, пока комната не заполнится, а не ровно первые n: пара,
     у которой резерв увёл половинку в третьи, места не занимает, и его берёт
     СЛЕДУЮЩАЯ пара, а не двое случайных из остатка. Отсюда же и устойчивость
     на границе комнаты: чемпион сезона сдвигает очередь на одну строку, и
     раньше на этом месте собиралась выдуманная тройка. */
  free.forEach(d=>{
    if(teams.length>=n) return;
    if(d.cards.some(c=>taken.has(hKey(c)))) return;
    const team=d.cards.slice();
    team.forEach(c=>taken.add(hKey(c)));
    while(team.length<size){
      const key=ccArcCoreKey(team);
      const held=reserved.get(key);
      if(held){ reserved.delete(key); team.push(held); continue; }
      const open=spare.filter(c=>!taken.has(hKey(c)));
      if(!open.length) break;
      const k=ccPickThird(team, open, ccArcCoreRnd(sn, team), reg);
      const pick=spare.splice(spare.indexOf(open[k<0 ? 0 : k]), 1)[0];
      if(!pick) break;
      taken.add(hKey(pick)); team.push(pick);
    }
    if(team.length<size) return;
    teams.push({reg:reg, cards:team, champ:false});
  });
  /* Пары кончились раньше комнаты — дальше идут те, кто остался, по силе.
     Так добирается регион, где записанных пар меньше, чем мест в лобби. */
  let i=0;
  while(teams.length<n){
    const team=[];
    while(team.length<size && i<roster.length){
      const c=roster[i++];
      if(taken.has(hKey(c))) continue;
      taken.add(hKey(c)); team.push(c);
    }
    if(team.length<size) break;
    teams.push({reg:reg, cards:team, champ:false});
  }
  return teams;
}
/* A LAN's room, which is every region's.

   Antwerp and the Summit are not drawn from one roster and cannot be: the
   seats are allocated by region and the allocation is the scene's own weight,
   the same one that decides which region a LAN's winner comes out of. What the
   rounding leaves over is Europe's, which is also true of the real allocation.
   See CC_ARC_LAN_W. */
function ccArcLanField(size, n, rng, champ, champReg, skip, sn){
  const total=CC_ARC_LAN_W.reduce((s,w)=>s+w[1], 0);
  const per={}; let sum=0;
  CC_ARC_LAN_W.forEach(w=>{ per[w[0]]=Math.max(1, Math.round(n*w[1]/total)); sum+=per[w[0]]; });
  per.EU=Math.max(1, per.EU+(n-sum));
  const out=[];
  CC_ARC_LAN_W.forEach(w=>{
    const reg=w[0];
    ccArcField(reg, size, per[reg], rng, reg===champReg ? champ : null, skip, sn).forEach(t=>out.push(t));
  });
  return out.slice(0, n);
}
/* Twelve games of a real lobby, played the way the career plays them.

   The four globals are the same four every career runner sets before a stage
   and puts back after it — CARD_MODE for the power model, squadSize for the
   lobby, the kill cap for the circuit that has one — plus the random source
   itself, which is what makes the same click give the same table. Restored in
   a finally, because a throw inside the engine leaving the page on a seeded
   Math.random would quietly freeze every draw in the app. */
function ccArcPlay(teams, cfg, size, rng){
  const rand=Math.random, mode=CARD_MODE, ss=squadSize, cap=CC_KILL_CAP;
  Math.random=rng; CARD_MODE=true; squadSize=size; CC_KILL_CAP=cfg.cap||0;
  try{ simulateGames(teams, cfg.games, cfg.pts, cfg.kill); }
  finally{ Math.random=rand; CARD_MODE=mode; squadSize=ss; CC_KILL_CAP=cap; }
}
/* Moving a stretch of generated rows clear of one real number.

   The rows are in order already; what they are not is on the right side of the
   line the player's own score draws through the table. The row nearest that
   line is pinned a point clear of it and every row behind it moves by the same
   ratio, so the column keeps its shape — which is the engine's — while being
   anchored to a result, which is the save's. Scaled rather than shifted
   because a shift walks the tail of a fifty-team table past zero. A stretch
   already clear of the line is left exactly as it was played. */
function ccArcFit(rows, pts, dir){
  if(!rows.length) return;
  const near=rows[dir>0 ? rows.length-1 : 0].pts;
  if(!(near>0)) return;
  if(dir>0 ? near>pts : near<pts) return;
  const k=(pts+dir)/near;
  rows.forEach(r=>{ r.pts=Math.max(0, Math.round(r.pts*k)); });
}
/* Built once per row and kept for as long as the page is open — a hub render
   asks for the open table again on every tab, every chip and every day that
   passes, and twelve games of fifty teams is not a thing to do on a redraw.
   The log's own length is in the key: the player's row is read out of it, so a
   result written after the table was built has to rebuild it. */
let CH_ARC_TBL={};
function careerArchiveFinal(sn, key){
  const cr=CAREER.career;
  const ck=sn+'|'+key+'|'+(CAREER.player.nick||'')+'|'+((cr.log||[]).length);
  if(CH_ARC_TBL[ck]) return CH_ARC_TBL[ck];
  const a=careerArchiveSeason(sn), size=a.size, p=String(key).split('|');
  let kind, reg, champ, mine=null, label;
  if(p[0]==='m'){
    const ev=a.regional.find(r=>r.n===+p[1]);
    if(!ev) return null;
    kind='major'; reg=p[2];
    const w=ev.perReg[reg];
    if(!w) return null;
    champ=w.team; label=ev.label+' · '+regionName(reg);
    if(reg===a.home) mine=ev.mine;
  } else {
    const ev=a.global.find(g=>g.slot===p[1]);
    if(!ev) return null;
    kind=ev.slot; reg=ev.win.reg; champ=ev.win.team; mine=ev.mine; label=ev.label;
  }
  let cfg=ccArcEvent(kind);
  /* Финалы прошлых лет — в своём формате, а не в составе сезона: World Cup Solo — сотня
     одиночек, Duos — пятьдесят дуо, FNCS Season X — трио, C2S1 — сквады (CC_MX_SPEC); у
     2021–2023 — лобби и таблица призов своего года (CC_MAJOR_PAY_<год>, по региону строки). */
  const arcY=ccArcCalYear(sn);
  let evSize=size, evPrize=null;
  if(kind==='major'){
    const mn=+p[1], sp=(typeof ccMXSpec==='function') ? ccMXSpec(arcY, mn) : null;
    const tier=tb=>{ const t=tb && (tb[reg] || (reg==='NAW' && tb.NAC) || tb.EU); return t ? (pl=>{ const r=t.find(x=>pl<=x[0]); return r ? r[1] : 0; }) : null; };
    if(sp){
      evSize=sp.size;
      cfg=Object.assign({}, cfg, {field:ccMXLobby(sp.size), games:sp.finalGames||cfg.games});
      evPrize=pl=>ccMXPrize(arcY, mn, pl);
    } else if(arcY>=2021 && arcY<=2023){
      evSize=arcY===2021 ? 3 : 2;
      const tb=({2021:CC_MAJOR_PAY_2021, 2022:CC_MAJOR_PAY_2022, 2023:CC_MAJOR_PAY_2023})[arcY];
      const t=tb && tb[mn];
      cfg=Object.assign({}, cfg, {field:arcY===2021 ? 33 : 50});
      evPrize=tier(t);
    }
  }
  // Настоящий Гранд-финал (см. ccArcRealGf) — доска Epic как есть, без переигровки.
  const realW=kind==='major' && a.regional.find(r=>r.n===+p[1]).perReg[reg].real;
  if(realW){
    const prz=evPrize || ccArcPrize(kind, reg);
    // Ник — как его пишет сцена (тот же, что в строке чемпиона), а не как его набрала доска.
    const rows=realW.rows.map((e,i)=>({p:i+1, name:e.duo.map(h=>ccStageCardFrom({h:h, r:reg}).handle).join(' & '), reg:reg, pts:e.pts||0, wins:e.wins||0,
      elims:Math.round((e.avgElims||0)*(e.matches||0)), prize:prz(i+1)}));
    const ws=realW.rows[0].duo.length;
    const word=ws===1 ? L().lfWordSolo : ws===4 ? L().lfWordSquads : ws===3 ? L().ccWordTrios : L().ccWordDuos;
    const games=Math.max.apply(null, realW.rows.map(e=>e.matches||0)) || cfg.games;
    const out={cap:label, sub:L().arcTable(ccNum(rows.length), word, games), lan:false, rows};
    CH_ARC_TBL[ck]=out;
    return out;
  }
  /* РАЗМЕР СОСТАВА У ЭТИХ ДВУХ — СВОЙ, А НЕ СЕЗОНА.

     Кубок наций играется сборными по четыре, соло — одиночками, и ни то ни
     другое не переводится в дуо/трио года: ccArcCount тут промолчит, иначе
     зал из двадцати пяти стран превратился бы в семнадцать. */
  const seatSize = kind==='nations' ? CC_NATIONS_SQUAD : (kind==='solo' || evSize===1) ? 1 : evSize;
  const n = (kind==='nations' || kind==='solo' || evSize!==size)
    ? Math.max(2, cfg.field)
    : Math.max(2, ccArcCount(size, cfg.field));
  const rng=careerRng(ccHashStr('arcT|'+(CAREER.player.nick||'')+'|'+sn+'|'+key));
  const skip = mine ? new Set([CAREER.player.nick].concat(
      (mine.mates && mine.mates.length) ? mine.mates : (mine.mate?[mine.mate]:[]))
      .filter(Boolean).map(h=>String(h).toLowerCase())) : null;
  /* Зал Кубка наций — книга сборных целиком, и чемпион в ней уже стоит:
     строка назвала страну (см. careerArchiveSeason), таблица сажает её же
     четвёрку. Соло — сотня одиночек по силе. */
  const seats = kind==='nations'
      /* Регион — у самой сборной, а не у чемпиона: он тут один на всю
         таблицу, и датская четвёрка получала флаг Океании. Берётся с её же
         сильнейшей карточки, как берётся и всё остальное в строке. */
      ? ccArcNatRows().map(r=>({cards:r.top,
                                reg:(r.top[0] && r.top[0].region) || reg,
                                champ: !!(champ && champ[0] && r.top[0] && hKey(r.top[0])===hKey(champ[0]))}))
    : (kind==='solo' || evSize===1) ? ccArcSoloSeats(n, champ && champ.slice(0,1))
    : kind==='major' ? ccArcField(reg, evSize, n, rng, champ && champ.slice(0, evSize), skip, sn)
                     : ccArcLanField(size, n, rng, champ, reg, skip, sn);
  if(seats.length<2) return null;
  const bare=s=>String(s==null?'':s).replace(/<[^>]*>/g, '').trim();
  const teams=seats.map(s=>{
    const t=careerTeam(s.cards);
    t.name=teamLabel(s.cards); t._reg=s.reg; t._champ=!!s.champ;
    return t;
  });
  ccArcPlay(teams, cfg, seatSize, rng);
  const ranked=teams.slice().sort((x,y)=>
    y.stagePts-x.stagePts || (y.wins||0)-(x.wins||0) || y.stageElims-x.stageElims);
  // The champion of the season and the winner of the twelve games trade rows.
  const ci=ranked.findIndex(t=>t._champ);
  if(ci>0){
    const A=ranked[0], B=ranked[ci];
    ['name','_reg','_champ'].forEach(k=>{ const v=A[k]; A[k]=B[k]; B[k]=v; });
  }
  const prize=evPrize || ccArcPrize(kind, reg);
  const rows=ranked.map((t,i)=>({p:i+1, name:bare(t.name), reg:t._reg,
    pts:t.stagePts||0, wins:t.wins||0, elims:t.stageElims||0}));
  /* And the row that really happened goes in at the place it really finished.

     Which is the one row in this table that is not a reconstruction, so the
     reconstruction is fitted to it rather than the other way round. Without
     that, a career that finished fourth on 377 read as fourth above two teams
     on 432 and 402 — and a standings table that does not descend is one nobody
     believes the rest of. */
  /* Верхушка таблицы — записанная, а не переигранная.

     Его снимки, 26 августа: пост в ленте про финал Мейджора 1 называет топ-5 с
     очками 667 / 566 / 539 / 531 / 517, а таблица того же турнира в Истории
     открывалась на 529 / 524 / 478 / 476 / 472 и с другими командами на местах
     со второго по пятое. Разошлись они потому, что здесь турнир ИГРАЛСЯ заново
     своим броском: от настоящего вечера в сейве лежала одна строка — своя.

     Теперь вечер оставляет пять верхних строк (ccStageTop, пишется рядом с
     результатом), и они садятся как есть — с именами, очками, победами и
     элимами того вечера. Всё, что ниже, остаётся реконструкцией и прижимается
     под пятую строку, чтобы таблица читалась сверху вниз.

     Сейв без записи — старая карьера — рисуется как прежде. */
  const top=(mine && Array.isArray(mine.top) && mine.top.length)
    ? mine.top : ccArcTopFromNews(mine, rows);
  if(top){
    const key=s=>String(s==null?'':s).toLowerCase().replace(/\s+/g,'');
    const seen=new Set(top.map(r=>key(r.n)));
    const rest=rows.filter(r=>!seen.has(key(r.name)));
    const head=top.map(r=>({p:0, name:String(r.n||''), reg:r.r||a.home,
                            pts:r.p||0, wins:r.w||0, elims:r.e||0,
                            you:r.you?true:undefined}));
    ccArcFit(rest, head[head.length-1].pts, -1);
    rows.length=0;
    rows.push.apply(rows, head.concat(rest));
    if(rows.length>n) rows.length=n;
  }
  // Своя строка вставляется отдельно только если её нет среди записанных.
  if(mine && mine.place>0 && !(top && top.some(r=>r.you))){
    const at=Math.min(Math.max(1, mine.place), rows.length+1)-1;
    ccArcFit(rows.slice(0, at), mine.pts||0, 1);
    ccArcFit(rows.slice(at), mine.pts||0, -1);
    rows.splice(at, 0, {p:0, name:[CAREER.player.nick].concat(
        (mine.mates && mine.mates.length) ? mine.mates : (mine.mate?[mine.mate]:[])).join(' & '),
      reg:a.home, pts:mine.pts||0, wins:mine.wins||0, elims:mine.elims||0, you:true});
    if(rows.length>n) rows.length=n;
  }
  rows.forEach((r,i)=>{ r.p=i+1; r.prize=prize(i+1); });
  const ws=kind==='major' ? evSize : size;
  const word=ws===1 ? L().lfWordSolo : ws===4 ? L().lfWordSquads : ws===3 ? L().ccWordTrios : L().ccWordDuos;
  const out={cap:label, sub:L().arcTable(ccNum(rows.length), word, cfg.games),
             lan:kind!=='major', rows};
  CH_ARC_TBL[ck]=out;
  return out;
}
// Which row is open, if any. One at a time: two fifty-line tables inside one
// tile is a screen nobody can find their way back up.
let CH_ARC_OPEN=null;
function careerArcOpen(key){
  CH_ARC_OPEN = CH_ARC_OPEN===key ? null : key;
  // Архив живёт во вкладке Истории, а не Профиля: перерисовка возвращает
  // туда же, откуда нажали, иначе клик по сезону уносил на другую вкладку.
  careerRenderHub('hist');
}
function careerArcTableHTML(sn, key){
  const t=careerArchiveFinal(sn, key);
  if(!t) return `<div class="arc-wrap"><div class="arc-cap">${L().arcNoTable}</div></div>`;
  // A LAN carries where each team came from, and it carries it under the name
  // rather than in a column of its own: six columns and a region is wider than
  // a phone, and the first thing to fall off the right of it is the prize.
  const head=`<th class="arc-h">#</th><th>${L().teamHeader}</th>`+
    `<th class="ev-num">${L().ptsHeader}</th><th class="ev-num">${L().winsWord}</th>`+
    `<th class="ev-num">${L().killsHeader}</th>`;
  const body=t.rows.map(r=>`<tr class="${r.you?'arc-me':''}">
      <td><span class="ev-place${r.p<=3?' top':(r.you?' cut':'')}">${r.p}</span></td>
      <td class="arc-n">${esc(r.name)}${r.prize?`<span class="st-prize">${ccMoney(r.prize)}</span>`:''}${r.you?` <i>${L().arcYou}</i>`:''}${
        t.lan?`<small>${esc(regionName(r.reg))}</small>`:''}</td>
      <td class="ev-num arc-pts">${ccNum(r.pts)}</td>
      <td class="ev-num">${r.wins||'-'}</td>
      <td class="ev-num">${ccNum(r.elims)}</td>
    </tr>`).join('');
  return `<div class="arc-wrap">
    <div class="arc-cap">${esc(t.cap)}<span>${esc(t.sub)}</span></div>
    <div class="arc-scroll"><table class="arc-t">
      <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
  </div>`;
}
// A line of the tile, and the table it opens.
/* Обложка турнира к строке архива — правка: «мб понятные
   турниры сделай с логотипами, чтоб люди понимали, что можно кликать там на
   глобал, мейджор и т. д.». Строка и раньше открывалась по клику, но выглядела
   как строка таблицы, а подсказка про это стояла одна на весь блок. Картинка
   отвечает на оба вопроса разом: и что это за турнир, и что на него смотрят,
   а не читают. Ключ строки уже несёт слот ('g|gc', 'm|1|EU'), другого источника
   не нужно. */
/* Обложка строки — турнира СВОЕГО года: у 2019–2024 постер сезона FNCS (ccFncsPoster), у 2025 —
   постеры Мейджоров, у Глобалов — свой город года; где своего нет — ключевой арт года. */
function ccArcArt(key, sn){
  const k=String(key||'');
  const y=sn!=null && typeof ccArcCalYear==='function' ? ccArcCalYear(sn) : ccCalYear();
  if(y<2026){
    const m=/^m\|(\d)/.exec(k);
    if(m){ const id='Major'+m[1]+'_'+y; return ccFncsPoster(id) || CAREER_EV_ART_ID[id+'_Final'] || (y<=2024 ? 'art/fncs-'+y+'.jpg' : CAREER_EV_ART.cup); }
    if(k.indexOf('g|gc')===0) return y===2022 ? ccFncsPoster('Invitational2022') : (CAREER_EV_ART_ID['GlobalChampionship'+y] || CAREER_EV_ART.gc);
    if(k.indexOf('g|nations')===0) return CAREER_EV_ART_ID.nations || CAREER_EV_ART.gc;
  }
  if(k.indexOf('g|summit')===0) return 'art/fncs-2026-major1.jpg';
  if(k.indexOf('g|rc')===0)     return CAREER_EV_ART.reload;
  if(k.indexOf('g|gc')===0)     return CAREER_EV_ART.gc;
  // Кубок наций — ЛАН, обложка та же, что у Глобалов; у соло своя.
  if(k.indexOf('g|nations')===0) return CAREER_EV_ART.gc;
  if(k.indexOf('g|solo')===0)    return CAREER_EV_ART.solo;
  if(k.indexOf('m|1')===0)      return 'art/fncs-2026-major1.jpg';
  if(k.charAt(0)==='m')         return CAREER_EV_ART.cup;
  return '';
}
function ccArcRow(sn, key, label, valueHTML, you){
  const open=CH_ARC_OPEN===key;
  const art=ccArcArt(key, sn);
  return `<div class="ch-row arc-row${open?' arc-on':''}" onclick="careerArcOpen(\'${key}\')">
      <em>${art?`<img class="arc-logo" src="${art}" alt="" loading="lazy" onerror="this.remove()">`:''}${esc(label)}</em>
      <b class="${you?'ch-goal-met':''}">${valueHTML}<i class="arc-caret">${open?'▾':'▸'}</i></b>
    </div>`+(open ? careerArcTableHTML(sn, key) : '');
}
let CH_ARC_S=null, CH_ARC_R=null;
function careerArcPick(sn){ CH_ARC_S=sn; CH_ARC_OPEN=null; careerRenderHub('hist'); }
function careerArcReg(r){ CH_ARC_R=r; CH_ARC_OPEN=null; careerRenderHub('hist'); }
/* Разыгран ли финал этого слота к сегодняшнему дню сезона. По id в календаре,
   а не по дате из головы: у каждого слота день свой, и после сыгранного вечера
   часы уже стоят за ним. Слот, которого в календаре нет (третий Мейджор
   трио-архива), не разыгран, пока сезон не кончится. */
function ccArcDoneBy(id){
  let day=null;
  // Финал Мейджора в календарях 2025/2024 зовётся Major<n>_2025_Final / Major<n>_2024_Final.
  /* Тестер, 22 сентября: «в истории не то» — в карьере 2024-го КАЖДАЯ строка
     Сезонов стояла «ещё впереди», даже отыгранная. Регулярка ловила букву «d»
     вместо цифры, alt всегда был null, и id календаря 2024/2025
     (Major1_2024_Final) не искался вовсе — а под именем 2026-го
     (Major1_Final) в этих годах нет ни одного дня. */
  const alt=/^Major(\d)_Final$/.exec(String(id||''));
  const ids=alt ? [id].concat([2025,2024,2023,2022,2021,2020,2019].map(y=>'Major'+alt[1]+'_'+y+'_Final')) : [id];
  if(id==='GlobalChampionship') ids.push('GlobalChampionship2025', 'GlobalChampionship2024', 'GlobalChampionship2023', 'Invitational2022');
  careerYearDays().forEach((list, iso)=>{
    if(list.some(e=>ids.indexOf(e.id)>=0) && (!day || iso>day)) day=iso;
  });
  return !!day && careerToday()>day;
}
// Неразыгранный слот — та же строка с той же обложкой, только без победителя:
// турнир этого сезона существует и до него ещё дойдут, а строка без картинки
// рядом со строками с картинками читалась бы как другая порода.
function ccArcSoonRow(label, key, sn){
  const art=ccArcArt(key, sn!=null ? sn : CH_ARC_S);
  return `<div class="ch-row arc-row"><em>${
      art?`<img class="arc-logo" src="${art}" alt="" loading="lazy" onerror="this.remove()">`:''
    }${esc(label)}</em>
    <b style="color:var(--ink-dimmer);">${L().arcSoon}</b></div>`;
}
// Формат сезона: у 2019–2023 — как шёл год (дуо → трио → сквады), у остальных — состав сезона.
function ccArcFormat(sn, size){
  const y=ccArcCalYear(sn), t=y<=2023 && L()['ccYear'+y];
  return t ? t.charAt(0).toUpperCase()+t.slice(1) : ccSeasonWord(size);
}
// Подпись сезона по размеру состава: соло, дуо, трио, сквад.
function ccSeasonWord(n){ const T=L(); return n===1 ? (T.ccSeasonSolo||T.ccSeasonDuos) : n===3 ? T.ccSeasonTrios : n===4 ? (T.ccSeasonSquads||T.ccSeasonDuos) : T.ccSeasonDuos; }
function careerArchiveHTML(){
  const cr=CAREER.career;
  const doneSeasons=[];
  for(let n=1;n<=cr.season;n++) if(n<cr.season || cr.seasonOver) doneSeasons.push(n);
  /* И идущий сезон тоже — игрок, 22 августа: «чтобы можно было в середине
     сезона смотреть, кто выиграл квалы евс и фнкс, не только после завершения
     сезона». Мир сезона посеян от его номера, так что чемпион, показанный в
     июле, в декабре останется тем же; несыгранные слоты стоят «ещё впереди». */
  const live=!cr.seasonOver;
  if(live) doneSeasons.push(cr.season);
  if(!doneSeasons.length)
    return `<div class="ch-tile"><h4>${L().arcTitle}</h4>
      <div class="ch-empty">${L().arcNone}</div></div>`;
  const sn=doneSeasons.indexOf(CH_ARC_S)>=0 ? CH_ARC_S : doneSeasons[doneSeasons.length-1];
  const partial=live && sn===cr.season;
  const reg=CH_ARC_R || ccCareerRegion();
  const a=careerArchiveSeason(sn);
  const chipsS=doneSeasons.map(n=>`<button class="cc-back${n===sn?' cc-on':''}"
    onclick="careerArcPick(${n})">${esc(L().ccMoneySeason(n))}</button>`).join('');
  const chipsR=REGIONS.map(r=>`<button class="cc-back${r.code===reg?' cc-on':''}"
    onclick="careerArcReg(\'${r.code}\')">${esc(regionName(r.code))}</button>`).join('');
  const rowsR=a.regional.map(ev=>{const w=ev.perReg[reg];
    if(partial && !ccArcDoneBy('Major'+ev.n+'_Final')) return ccArcSoonRow(ev.label, 'm|'+ev.n+'|'+reg, sn);
    return ccArcRow(sn, 'm|'+ev.n+'|'+reg, ev.label,
      esc(w.name)+(w.you?' · '+L().arcYou:''), w.you);}).join('');
  const CC_ARC_GID={summit:'Summit_Final', rc:'ReloadChampionshipParis', gc:'GlobalChampionship',
                    nations:'NationsFinal', solo:'SoloSeries_Final'};
  const rowsG=a.global.map(ev=>{
    if(partial && !ccArcDoneBy(CC_ARC_GID[ev.slot]||'')) return ccArcSoonRow(ev.label, 'g|'+ev.slot, sn);
    return ccArcRow(sn, 'g|'+ev.slot, ev.label,
      esc(ev.win.name)+' · '+esc(regionName(ev.win.reg))+(ev.win.you?' · '+L().arcYou:''),
      ev.win.you);}).join('');
  return `<div class="ch-tile"><h4>${L().arcTitle}</h4>
    <div class="ch-hint">${L().arcHint}. ${L().arcTapHint}</div>
    ${partial ? `<div class="ch-hint">${L().arcLive}</div>` : ''}
    <div class="cc-chips cc-chips-seasons">${chipsS}</div>
    <!-- The label is what the row is, not what the hub tab is called: chSquad is
         the word "Duo" on the tab strip, and a trios season read "Duo · a trios
         season". His report, 20 August. -->
    <div class="ch-row"><em>${L().ccSeasonFormat}</em><b>${ccArcFormat(sn, a.size)}</b></div>
    ${(cr.log||[]).some(e=>e.season===sn) ? `<div class="cc-chips"><button class="cc-back" onclick="ccGalaShare(${sn})">${esc(L().ccShareSeason||'Share season')}</button></div>` : ''}
    ${rowsG}
    <div class="cc-chips cc-chips-reg">${chipsR}</div>
    ${rowsR}
  </div>`;
}
/* Колонка «Событие» звала каждую строку кубком дивизиона, чем бы вечер ни был —
   Скриншот: финал релоада читался как «Кубок Див 1». Имя не
   хранится в строке — его знает календарь, и он же держит его на языке экрана,
   поэтому строка спрашивает свой день у календаря. День вне календаря (сейв
   другого года) получает хотя бы слово за тип турнира. */
/* Обложка события в строке профиля — как у Fortnite Tracker в списке турниров игрока (его
   просьба 29.09: «добавь картинки к эвентам, как на фортнайттрекере»). Та же картинка, что
   в календаре и на карточке дня: событие этого дня того же вида → ccEventArt. */
function ccLogArt(e){
  if(!e) return '';
  const ID={rc:'ReloadChampionshipParis', gclc:'GlobalChampionshipLastChance'};
  const kind=e.kind||'cup';
  let ev=null;
  try{ ev=(careerYearDays().get(e.day)||[]).find(x=>ID[kind] ? x.id===ID[kind] : x.kind===(kind==='scq' ? 'summit' : kind)); }catch(x){}
  return (ev && ccEventArt(ev)) || CAREER_EV_ART[kind] || CAREER_EV_ART.cup || '';
}
function ccLogArtHTML(e){
  const a=ccLogArt(e);
  return a ? '<img class="ev-thumb" src="'+esc(a)+'" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">'
           : '<span class="ev-thumb"></span>';
}
function ccLogName(e, noLabel){
  if(e.kind && e.kind!=='cup'){
    // Париж и Last Chance делят на календаре один kind 'gc' — различает id.
    const ID={rc:'ReloadChampionshipParis', gclc:'GlobalChampionshipLastChance'};
    const onDay=(careerYearDays().get(e.day)||[])
      .find(x=>ID[e.kind] ? x.id===ID[e.kind] : x.kind===(e.kind==='scq' ? 'summit' : e.kind));
    if(onDay && onDay.label && !noLabel) return esc(onDay.label);
    const W={final:L().calWeeklyFinal, eval:L().calPerfEval, victory:ccWkVictoryWord(),
             major:ccWkMajorWord(), gclc:L().chWkGC, globals:L().chWkGC,
             reload:L().chWkReload, summit:L().brk_lan, rc:L().brk_rc,
             solo:'Solo Series'};
    if(W[e.kind]) return W[e.kind];
  }
  return L().chCupWeek(e.div);
}
/* Две разные вкладки, а не одна длинная.

   Правка шла в два приёма: сначала «вот эту таблицу нужно как
   отдельный столбик в лобби, после центра profile мб» — это лист результатов,
   — а следом «вот это добавь в историю» со скрином сезонов и ленты карьеры.
   То есть Профиль отвечает на «какой я игрок», История — на «что было»: кто
   что выиграл по сезонам и чем кончился каждый вечер. Раньше обе половины
   стояли одной простынёй под одной вкладкой, и вторая начиналась там, где у
   первой кончались строки. */
function careerHistoryHTML(){
  return careerArchiveHTML()+careerTimelineHTML()+ccRetiredHTML();
}
