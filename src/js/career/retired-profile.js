/*@@PART js/career/retired-profile.js@@*/
/* ЗАВЕРШИЛИ КАРЬЕРУ (его «да» 20.10 на предложение после «а куда игрок, которого он регенет»): заметные ушедшие со сцены
   (рейтинг 75+, ccRegenYear пишет в cr.regen.past) — год, возраст, рейтинг, регион и реген, что пришёл на смену. */
const CC_REGEN_PAST_MIN=75, CC_REGEN_PAST_MAX=400;
function ccRetiredOf(handle){
  const R=CAREER && CAREER.career && CAREER.career.regen; if(!R || !R.past) return null;
  return R.past.find(p=>hKey(p.h)===hKey(handle)) || null;
}
function ccRetiredHTML(){
  const T=L(), R=CAREER && CAREER.career && CAREER.career.regen;
  const list=((R && R.past)||[]).slice().sort((a,b)=>b.y-a.y || b.ovr-a.ovr);
  if(!list.length) return '';
  const yr=y=>2026+y;
  const rows=list.slice(0, 120).map(p=>'<tr><td>'+(p.nat ? flagImg(p.nat, 12)+' ' : '')+'<a href="#" onclick="ccPeekByHandle(\''+esc(String(p.h)).replace(/'/g, '')+'\');return false;">'+esc(p.h)+'</a></td>'+
    '<td class="ev-num">'+yr(p.y)+'</td><td class="ev-num">'+(p.age!=null ? p.age : '–')+'</td><td class="ev-num">'+p.ovr+'</td><td>'+esc(p.reg||'')+'</td>'+
    '<td>'+(p.by ? '<a href="#" onclick="ccPeekByHandle(\''+esc(String(p.by)).replace(/'/g, '')+'\');return false;">'+esc(p.by)+'</a>' : '–')+'</td></tr>').join('');
  return '<div class="ch-tile cc-retired"><h4>'+esc(T.ccRetiredTitle||'Retired')+'</h4><div class="ch-hint">'+esc(T.ccRetiredHint||'')+'</div>'+
    '<div class="cc-retired-wrap"><table class="cc-retired-t"><tr><th>'+esc(T.ccRetiredWho||'Player')+'</th><th>'+esc(T.ccRetiredYear||'Year')+'</th><th>'+esc(T.ccRetiredAge||'Age')+'</th>'+
    '<th>OVR</th><th>'+esc(T.ccRetiredReg||'Region')+'</th><th>'+esc(T.ccRetiredBy||'Regen')+'</th></tr>'+rows+'</table></div></div>';
}
function careerProfileHTML(){
  const log=(CAREER.career.log||[]).slice().reverse();
  /* Сортировка по призам — его пункт 19 со страницы «ы», 22 августа. Клик по
     шапке «Приз» строит журнал от больших чеков к пустым; клик по «Событию»
     или повторный по «Призу» возвращает хронологию. */
  if(CH_LOG_SORT==='prize') log.sort((a,b)=>(b.prize||0)-(a.prize||0));
  const pl=CAREER.player;
  if(!log.length) return `<div class="ch-grid" style="grid-template-columns:1fr;">`+
    `<div class="ch-tile"><h4>${L().chLogTitle}</h4><div class="ch-empty">${L().chLogEmpty}</div></div></div>`;

  const sum=(k)=>log.reduce((s,e)=>s+(e[k]||0),0);
  const games=sum('games'), wins=sum('wins'), elims=sum('elims');
  const withAvg=log.filter(e=>e.avg!=null);
  const avg=withAvg.length ? (withAvg.reduce((s,e)=>s+e.avg,0)/withAvg.length).toFixed(1) : '-';
  const promos=log.filter(e=>e.passed).length;

  const pr=ccPrTable(CAREER.career.log||[]);
  const rows=log.map(e=>{
    const podium=e.place<=3, cut=e.passed;
    const rating=pr.by.get(e);
    return `<tr>
      <td class="ev-name"><div class="ev-name-in">${ccLogArtHTML(e)}<div><b>${ccLogName(e)}</b>
        <small>${ccStamp(e)}</small></div></div></td>
      <td class="ev-num"><span class="ev-place${podium?' top':(cut?' cut':'')}">#${e.place}</span>
        <small>/${e.of}</small></td>
      <td class="ev-num ev-pts">${e.pts}</td>
      <td class="ev-num ev-rate${e.rating>=8?' hi':e.rating!=null&&e.rating<5?' lo':''}">${e.rating!=null ? e.rating.toFixed(1)+(e.mvpYou?' ★':'') : '-'}</td>
      <td class="ev-num ev-pr${pr.counted.has(e)?' in':''}"
          title="${esc(pr.counted.has(e)?L().evPrIn:L().evPrOut)} · ×${ccPrMult(e)}">${
        rating!=null ? ccNum(rating) : '-'}</td>
      <td class="ev-num ev-cash">${e.prize ? ccMoney(e.prize) : '-'}</td>
      <td class="ev-mate">${e.mate?esc(e.mate):'-'}</td>
      <td class="ev-num">${e.games!=null?e.games:'-'}</td>
      <td class="ev-num">${e.wins!=null?e.wins:'-'}</td>
      <td class="ev-num">${e.elims!=null?e.elims:'-'}</td>
      <td class="ev-num">${e.avg!=null?e.avg:'-'}</td>
      <td class="ev-num ev-ovr">${e.ovr}</td>
    </tr>`;
  }).join('');

  // Сезоны и лента переехали в свою вкладку — см. careerHistoryHTML выше.
  return `<div class="ev-wrap">
    <div class="ev-head">
      <div class="ev-hero">
        <em>${L().ccRoOvr}</em>
        <b>${ccMyShownOvr()}</b>
        ${careerRatingCurve(log)}
      </div>
      <div class="ev-totals">
        <div><em>${L().evPr}</em><b class="ev-pr-total">${ccNum(pr.pr)}</b></div>
        ${(ccMobileOwn() || (CAREER.career.mobN||0)>0) ? `<div><em>${L().ccMobRating} · ${L().ccMobShort}</em><b>${Math.round(ccMobileOvr()*10)/10}</b></div>` : ''}
        <div><em>${L().evEvents}</em><b>${log.length}</b></div>
        <div><em>${L().evPromos}</em><b>${promos}</b></div>
        <div><em>${L().matchesWord}</em><b>${games}</b></div>
        <div><em>${L().winsWord}</em><b>${wins}</b></div>
        <div><em>${L().killsHeader}</em><b>${elims}</b></div>
        <div><em>${L().evAvg}</em><b>${avg}</b></div>
        <div><em>${L().chEarnings}</em><b>${ccMoney(CAREER.career.earnings||0)}</b></div>
        ${ccRateTotalsHTML(log)}
      </div>
    </div>
    ${ccAwardsShelfHTML()}
    <div class="ev-tablewrap">
      <table class="ev-table">
        <thead><tr>
          <th style="cursor:pointer;" onclick="careerLogSort(null)">${L().evEvent}${CH_LOG_SORT?'':' ▾'}</th><th class="ev-num">${L().rankHeader}</th>
          <th class="ev-num">${L().ptsHeader}</th><th class="ev-num">${L().lfRateShort}</th><th class="ev-num">${L().evPr}</th>
          <th class="ev-num" style="cursor:pointer;" onclick="careerLogSort(\'prize\')">${L().prizeHeader}${CH_LOG_SORT==='prize'?' ▾':''}</th>
          <th>${L().ccResPartner}</th><th class="ev-num">${L().matchesWord}</th>
          <th class="ev-num">${L().winsWord}</th><th class="ev-num">${L().killsHeader}</th>
          <th class="ev-num">${L().evAvg}</th><th class="ev-num">${L().ccRoOvr}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

/* Оценки вечеров в итогах профиля: средняя, число MVP и последние двенадцать столбиками
   (зелёный — 8+, красный — ниже 5). Журнал — от новых к старым, график — слева направо. */
function ccRateTotalsHTML(log){
  const r=log.filter(e=>e.rating!=null);
  if(!r.length) return '';
  const avg=r.reduce((a,e)=>a+e.rating,0)/r.length, mvp=r.filter(e=>e.mvpYou).length;
  const last=r.slice(0,12).reverse();
  const bars=last.map(e=>'<i class="ev-rbar'+(e.rating>=8?' hi':e.rating<5?' lo':'')+'" style="height:'+Math.max(8, Math.round(e.rating*10))+'%" title="'+e.rating.toFixed(1)+'"></i>').join('');
  return '<div><em>'+L().lfAvgRateAll+'</em><b>'+avg.toFixed(1)+'</b></div>'+
         '<div><em>'+L().lfMvpAll+'</em><b>'+mvp+'</b></div>'+
         '<div class="ev-rspark"><em>'+L().lfLastNights+'</em><span>'+bars+'</span></div>';
}
/* Полка наград: игрок месяца, игрок года и номинации сезона, которые взял сам игрок
   (careerAwards().won с you) — с месяцами и сезонами, а не одним числом. */
/* ГДЕ Я САЖУСЬ: каждая твоя игра в карьере пишет точку высадки (остров + координаты) и
   место. Карта острова, где высадок больше всего: кружок на точке, размер — сколько раз,
   цвет — среднее место (зелёный — выше середины). Пишется из accumulateMatchStats. */
function ccDropRec(t, place, total){
  if(!t || !t.isYou || !CC_DROP_STAGE || !t.landingZone || !CAREER || !CAREER.career) return;
  const lf=ccLife(), z=t.landingZone, set=ACTIVE_LANDING_SET;
  const d=lf.drops||(lf.drops={}), k=set+'|'+z.x+','+z.y;
  const r=d[k]||(d[k]={n:0, pct:0, w:0});
  r.n++; r.pct+=total>1 ? 1-(place-1)/(total-1) : 1; if(place===1) r.w++;
}
/* ПРОФИЛЬ (30.10, его «карьера/компетитив/профиль, в профиле подробная статистика карьер, драфт дейли, ачивки»).
   Третья вкладка шапки. Всё с этого устройства, без входа: слоты карьер (LS_SLOT 1..CC_SLOTS), драфт дня (fd_daily,
   последние 30 дней), забеги драфта (fncsdraft_history, до 100), достижения (fncsdraft_achievements). */
const CC_ME_TX={
  ru:{nav:'Аккаунт', title:'Аккаунт', device:'Всё с этого устройства', careers:'Карьеры', none:'Пока пусто',
      season:'Сезон', div:'Дивизион', earn:'Призовые', ev:'Турниров', wins:'Побед', firsts:'Первых мест', vr:'Королевских побед', top10:'Топ-10', titles:'Титулы FNCS', potm:'Игрок месяца',
      best:'Лучший результат', daily:'Драфт дня', played:'Сыграно', bestPlace:'Лучшее место', avgPlace:'Среднее место', bestScore:'Лучшие очки',
      streak:'Дней подряд', last:'Последние', draft:'Драфт', runs:'Забегов', bestGrade:'Лучшая оценка', majors:'Чемпион ALL FNCS',
      ach:'Достижения', mgr:'Менеджер', clubs:'Клубов', creator:'Креатор', open:'Открыть'},
  en:{nav:'Account', title:'Account', device:'Everything from this device', careers:'Careers', none:'Nothing yet',
      season:'Season', div:'Division', earn:'Earnings', ev:'Events', wins:'Wins', firsts:'First places', vr:'Victory Royales', top10:'Top 10', titles:'FNCS titles', potm:'Player of the month',
      best:'Best result', daily:'Daily draft', played:'Played', bestPlace:'Best place', avgPlace:'Average place', bestScore:'Best score',
      streak:'Day streak', last:'Recent', draft:'Draft', runs:'Runs', bestGrade:'Best grade', majors:'ALL FNCS champion',
      ach:'Achievements', mgr:'Manager', clubs:'Clubs', creator:'Creator', open:'Open'}
};
function ccMeT(){ return CC_ME_TX[(typeof LANG!=='undefined' && LANG)] || CC_ME_TX.en; }
Object.assign(CC_ME_TX.ru, {edit:'Изменить', save:'Сохранить', cancel:'Отмена', nickPh:'Никнейм', upload:'Загрузить фото', skinPh:'Найти скин Fortnite',
  cloudOn:'Сохраняется в облако', cloudOff:'Включи облако на экране карьеры, чтобы профиль был на всех устройствах', achCareer:'Достижения карьеры', achDaily:'Достижения драфта дня', more:'ещё',
  achDraft:'Достижения драфта', achMgr:'Достижения менеджера', achCareerS:'Ачивки карьеры', achDraftS:'Ачивки драфта', achMgrS:'Ачивки менеджера'});
Object.assign(CC_ME_TX.en, {edit:'Edit', save:'Save', cancel:'Cancel', nickPh:'Nickname', upload:'Upload photo', skinPh:'Find a Fortnite skin',
  cloudOn:'Saved to the cloud', cloudOff:'Turn on the cloud on the career screen to have your profile on every device', achCareer:'Career achievements', achDaily:'Daily draft achievements', more:'more',
  achDraft:'Draft achievements', achMgr:'Manager achievements', achCareerS:'Career', achDraftS:'Draft', achMgrS:'Manager'});
/* Свой профиль (30.10, его «пусть никнейм можно будет выбрать и аватарку и сохранить это все в облако»): ключ
   fncsdraft_profile {nick, ava:{t:'skin', id} | {t:'img', d:dataURL 128px}} — в облаке рядом с карьерами (CC_CLOUD_KEY). */
const CC_ME_LS='fncsdraft_profile';
function ccMeProf(){ try{ return JSON.parse(localStorage.getItem(CC_ME_LS)||'{}')||{}; }catch(e){ return {}; } }
function ccMeProfSave(o){ try{ localStorage.setItem(CC_ME_LS, JSON.stringify(Object.assign(o, {at:Date.now()}))); }catch(e){} try{ ccCloudSoon(); }catch(e){} }
function ccMeAvaURL(p){ const a=p && p.ava; if(!a) return null; return a.t==='img' ? a.d : a.t==='skin' ? ccFnImg(a.id) : null; }
let CC_ME_EDIT=null;   // {nick, ava, q} — открытый редактор
function ccMeEditOpen(){ const p=ccMeProf(); CC_ME_EDIT={nick:p.nick||'', ava:p.ava||null, q:'', banner:p.banner||'lobby', frame:p.frame||'yellow', show:(p.show||[]).slice()}; ccMeRedraw(); }
function ccMeEditClose(){ CC_ME_EDIT=null; ccMeRedraw(); }
function ccMeEditSave(){
  if(!CC_ME_EDIT) return;
  const nick=String(CC_ME_EDIT.nick||'').replace(/[<>]/g, '').trim().slice(0, 24);
  const p=ccMeProf();   // бинды и прочее, что редактор не трогает, остаются
  ccMeProfSave(Object.assign(p, {nick, ava:CC_ME_EDIT.ava, banner:CC_ME_EDIT.banner, frame:CC_ME_EDIT.frame, show:(CC_ME_EDIT.show||[]).slice(0, 3)}));
  CC_ME_EDIT=null; ccMeRedraw();
}
function ccMeRedraw(){ const b=document.getElementById('meBody'); if(!b) return; ccMeCloudHome(); b.innerHTML=ccMeHTML(); ccMeCloudMount(); }
function ccMePhoto(inp){
  const f=inp && inp.files && inp.files[0]; if(!f || !CC_ME_EDIT) return;
  const im=new Image(), url=URL.createObjectURL(f);
  im.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
    const s=Math.min(im.width, im.height); g.drawImage(im, (im.width-s)/2, (im.height-s)/2, s, s, 0, 0, 128, 128);
    let d=''; try{ d=c.toDataURL('image/webp', .85); }catch(e){}
    if(!/^data:image\/webp/.test(d)) d=c.toDataURL('image/jpeg', .85);   // Safari старых версий не пишет webp
    URL.revokeObjectURL(url); CC_ME_EDIT.ava={t:'img', d}; ccMeRedraw(); };
  im.src=url;
}
function ccMeSkinFind(q){
  if(!CC_ME_EDIT) return; CC_ME_EDIT.q=q;
  const draw=()=>{ const el=document.getElementById('meSkins'); if(el) el.innerHTML=ccMeSkinsHTML(); };
  if(typeof CC_FN_SHOP==='undefined') ccFnShopLoad(draw); else draw();
}
function ccMeSkinsHTML(){
  if(!CC_ME_EDIT || typeof CC_FN_SHOP==='undefined') return '';
  const q=String(CC_ME_EDIT.q||'').trim().toLowerCase(); if(q.length<2) return '';
  return CC_FN_SHOP.items.filter(i=>i[2]==='o' && String(i[1]).toLowerCase().indexOf(q)>=0).slice(0, 30).map(i=>
    '<button type="button" class="me-skin" title="'+esc(i[1])+'" onclick="CC_ME_EDIT.ava={t:\'skin\',id:\''+esc(i[0])+'\'};ccMeRedraw()"><img src="'+esc(ccFnImg(i[0], true))+'" alt="" loading="lazy" onerror="this.remove()"><small>'+esc(i[1])+'</small></button>').join('');
}
/* ДОСТИЖЕНИЯ ПРОФИЛЯ (30.10, «новые ачивки для карьеры и для драфта, которые сейчас подходят для сайта»). Считаются
   из того, что уже лежит на устройстве (все слоты карьер, fd_daily), — ничего не хранят и открываются задним числом. */
const CC_ME_ACH_TX={
  ru:{c_win:['Первая победа','Выиграй любой турнир в карьере'], c_major:['Чемпион Мейджора','Выиграй финал Мейджора FNCS'],
      c_lan:['Король ЛАНа','Выиграй финал на ЛАНе'], c_globals:['Чемпион мира','Выиграй Global Championship'], c_reload:['Reload-чемпион','Выиграй финал Reload'],
      c_potm:['Игрок месяца','Стань игроком месяца'], c_potm5:['Звезда сезона','Стань игроком месяца 5 раз'],
      c_100k:['Шестизначные','Заработай $100 000 призовых в одной карьере'], c_1m:['Миллионер','Заработай $1 000 000 призовых в одной карьере'],
      c_div1:['Дивизион 1','Дойди до первого дивизиона'], c_ev100:['Сотня турниров','Сыграй 100 турниров в одной карьере'],
      c_top50:['Стабильность','50 раз попади в топ-10'], c_s3:['Ветеран сцены','Доиграй до третьего сезона'], c_creator:['Из стримеров в про','Начни карьеру за креатора'],
      c_yt:['Ютубер','Набери 100 000 подписчиков на YouTube'], c_multi:['Многостаночник','Веди три карьеры сразу'],
      d_first:['Ежедневный','Сыграй драфт дня'], d_win:['Лучший за день','Выиграй драфт дня'], d_top3:['Подиум дня','Займи топ-3 в драфте дня'],
      d_streak7:['Неделя без пропусков','Играй драфт дня 7 дней подряд'], d_30:['Месяц драфтов','Сыграй 30 драфтов дня'], d_win3:['Трижды лучший','Выиграй драфт дня 3 раза'],
      m_first:['Главный тренер','Возглавь клуб в режиме менеджера'], m_own:['Владелец','Создай свой клуб'], m_win:['Первый кубок клуба','Игрок твоего клуба выигрывает турнир'],
      m_win10:['Машина побед','Игроки клуба выигрывают 10 турниров'], m_trophy:['Трофей сезона','Получи награду сезона'], m_trophy5:['Полка трофеев','Собери 5 наград сезона'],
      m_1m:['Миллион в кассе','Клуб зарабатывает $1 000 000'], m_s3:['Династия','Проведи с клубами три сезона'], m_clubs2:['Новый вызов','Поработай в двух разных клубах'],
      m_fired:['Ничего личного','Тебя уволили из клуба']},
  en:{c_win:['First win','Win any event in a career'], c_major:['Major champion','Win an FNCS Major final'],
      c_lan:['LAN king','Win a LAN final'], c_globals:['World champion','Win the Global Championship'], c_reload:['Reload champion','Win a Reload final'],
      c_potm:['Player of the month','Be named player of the month'], c_potm5:['Star of the season','Be player of the month 5 times'],
      c_100k:['Six figures','Earn $100,000 in one career'], c_1m:['Millionaire','Earn $1,000,000 in one career'],
      c_div1:['Division 1','Reach the first division'], c_ev100:['A hundred events','Play 100 events in one career'],
      c_top50:['Consistency','Finish top 10 fifty times'], c_s3:['Scene veteran','Reach season three'], c_creator:['Streamer to pro','Start a career as a creator'],
      c_yt:['YouTuber','Reach 100,000 YouTube subscribers'], c_multi:['Juggler','Run three careers at once'],
      d_first:['Daily','Play a daily draft'], d_win:['Best of the day','Win a daily draft'], d_top3:['Daily podium','Finish top 3 in a daily draft'],
      d_streak7:['No days off','Play the daily draft 7 days in a row'], d_30:['A month of drafts','Play 30 daily drafts'], d_win3:['Three-time best','Win the daily draft 3 times'],
      m_first:['Head coach','Take charge of a club in manager mode'], m_own:['Owner','Found your own club'], m_win:['First club cup','A player of your club wins an event'],
      m_win10:['Winning machine','Your club players win 10 events'], m_trophy:['Season trophy','Win a season award'], m_trophy5:['Trophy shelf','Collect 5 season awards'],
      m_1m:['A million in the bank','Your club earns $1,000,000'], m_s3:['Dynasty','Manage clubs for three seasons'], m_clubs2:['New challenge','Work at two different clubs'],
      m_fired:['Nothing personal','Get sacked by a club']}
};
const CC_ME_ACH_ICO={c_win:'🏆', c_major:'👑', c_lan:'🏟️', c_globals:'🌍', c_reload:'🔁', c_potm:'🏅', c_potm5:'🌟', c_100k:'💵', c_1m:'💰',
  c_div1:'🥇', c_ev100:'💯', c_top50:'📈', c_s3:'🧓', c_creator:'🎥', c_yt:'▶️', c_multi:'🗂️',
  d_first:'📅', d_win:'🥇', d_top3:'🥉', d_streak7:'🔥', d_30:'🗓️', d_win3:'👑',
  m_first:'📋', m_own:'🏢', m_win:'🏆', m_win10:'⚙️', m_trophy:'🎖️', m_trophy5:'🗄️', m_1m:'🏦', m_s3:'🏰', m_clubs2:'🔄', m_fired:'📦'};
// Сейвы менеджера — прямо по ключам (mgrSlotRead в куске mgr.js): клуб, трофеи, история сезонов, результаты.
function ccMeMgrSaves(){
  const out=[];
  for(let n=1;n<=10;n++){ try{ const m=ccSaveParse(localStorage.getItem(n===1 ? 'fncsdraft_manager' : 'fncsdraft_manager_s'+n)); if(m && m.club) out.push(m); }catch(e){} }
  return out;
}
function ccMeAch(saves, dr){
  const all=saves.map(s=>(s.career||{}));
  const wins=[].concat(...all.map(c=>(c.log||[]).filter(e=>e && e.place===1)));
  const fin=(re)=>wins.some(e=>re(e));
  const potm=all.reduce((a,c)=>a+((c.aw||{}).won||[]).filter(x=>x && x.you && x.kind==='month').length, 0);
  let maxStreak=0, run=0, prev=null;
  dr.map(r=>r.day).sort().forEach(d=>{ run=(prev && ccAddDays(prev, 1)===d) ? run+1 : 1; prev=d; if(run>maxStreak) maxStreak=run; });
  const has={
    c_win:wins.length>0, c_major:fin(e=>{ try{ return !!ccFncsTitle(e); }catch(x){ return false; } }),
    c_lan:fin(e=>/^(summit|rc)$/.test(e.kind) && e.stage==='final'), c_globals:fin(e=>e.kind==='globals'), c_reload:fin(e=>e.kind==='reload' && e.stage==='final'),
    c_potm:potm>=1, c_potm5:potm>=5, c_100k:all.some(c=>(c.earnings||0)>=100000), c_1m:all.some(c=>(c.earnings||0)>=1000000),
    c_div1:all.some(c=>c.division===1), c_ev100:all.some(c=>(c.log||[]).filter(e=>e && e.place).length>=100),
    c_top50:all.reduce((a,c)=>a+(c.log||[]).filter(e=>e && e.place && e.place<=10).length, 0)>=50, c_s3:all.some(c=>(c.season||1)>=3),
    c_creator:saves.some(s=>(s.player||{}).creator), c_yt:all.some(c=>((c.yt||{}).subs||0)>=100000), c_multi:saves.length>=3,
    d_first:dr.length>0, d_win:dr.some(r=>r.place===1), d_top3:dr.some(r=>r.place<=3), d_streak7:maxStreak>=7, d_30:dr.length>=30,
    d_win3:dr.filter(r=>r.place===1).length>=3
  };
  const ms=ccMeMgrSaves();
  const mWins=ms.reduce((a,m)=>a+(m.results||[]).filter(r=>!/#/.test(String(r.id||'')) && (r.rows||[]).some(x=>x && x.mine && x.place===1)).length, 0);
  const mTro=ms.reduce((a,m)=>a+(m.trophies||[]).length, 0);
  const mHist=[].concat(...ms.map(m=>m.history||[]));
  Object.assign(has, {
    m_first:ms.length>0, m_own:ms.some(m=>m.club && m.club.own), m_win:mWins>=1, m_win10:mWins>=10,
    m_trophy:mTro>=1, m_trophy5:mTro>=5, m_1m:ms.some(m=>(m.club.earned||0)>=1000000) || mHist.some(h=>(h.earned||0)>=1000000),
    m_s3:mHist.length>=3, m_clubs2:new Set(mHist.map(h=>h.club).concat(ms.map(m=>m.club.name))).size>=2, m_fired:mHist.some(h=>h.fired)
  });
  return has;
}
function ccMeAchHTML(has, pre){
  const T=CC_ME_ACH_TX[(typeof LANG!=='undefined' && LANG)] || CC_ME_ACH_TX.en;
  return Object.keys(has).filter(k=>k.indexOf(pre)===0).map(k=>'<div class="achv-card '+(has[k] ? 'unlocked' : 'locked')+'"><div class="achv-icon">'+CC_ME_ACH_ICO[k]+'</div><div><div class="achv-title">'+
    esc(T[k][0])+'</div><div class="achv-desc">'+esc(T[k][1])+'</div></div></div>').join('');
}
Object.keys(I18N).forEach(l=>{ I18N[l].navGrpProfile=(CC_ME_TX[l]||CC_ME_TX.en).nav; });
function ccMeCareer(s){
  const cr=(s && s.career)||{}, pl=(s && s.player)||{};
  const log=(cr.log||[]).filter(e=>e && e.place);
  let titles=0; log.forEach(e=>{ if(e.place===1){ try{ if(ccFncsTitle(e)) titles++; }catch(x){} } });
  const best=log.filter(e=>e.of>1).sort((a,b)=>(a.place/a.of)-(b.place/b.of) || a.place-b.place)[0]||null;
  let bestName=''; if(best){ try{ bestName=ccLockerPlain(ccLogName(best)); }catch(x){ bestName=best.name||''; } }
  // Кубки карьеры — выигранные финалы FNCS (как на полке наград), по порядку.
  const big=e=>{ try{ if(ccFncsTitle(e)) return true; }catch(x){} return e.kind==='globals' || (/^(summit|rc|reload)$/.test(e.kind) && e.stage==='final'); };
  const cups=log.filter(e=>e.place===1 && big(e)).sort((a,b)=>String(a.day)<String(b.day) ? -1 : 1);
  let flag=''; try{ flag=ccFlagImgs(ccFlagEmoji(pl.country||pl.nat||'')); }catch(x){ flag=''; }
  return {nick:pl.nick||pl.handle||'?', creator:!!pl.creator, y0:cr.year0||cr.year, y:cr.year, season:cr.season||1, div:cr.division,
    ovr:Math.round(pl.ovr||0), earn:Math.round(cr.earnings||0), ev:log.length, wins:log.filter(e=>e.place===1).length,
    vr:log.reduce((a,e)=>a+(e.wins||0), 0), top10:log.filter(e=>e.place<=10).length, titles, potm:((cr.aw||{}).won||[]).filter(a=>a && a.you && a.kind==='month').length,
    best:best ? '#'+best.place+' · '+bestName : '', photo:pl.photo||null, cups, flag};
}
Object.assign(CC_ME_TX.ru, {level:'Уровень', xp:'опыт', banner:'Баннер', frame:'Рамка', locked:'с уровня', showcase:'Витрина', showPick:'Выбери до трёх для витрины',
  people:'Люди', mates:'Напарники', nights:'вечеров', avgP:'ср. место', bestMate:'Лучший напарник', rival:'Главный соперник', rivalNote:'чаще всех MVP твоих вечеров',
  cal:'Последние 30 дней', settings:'Настройки', lang:'Язык', binds:'Бинды построек', bindsNote:'Действуют во всех карьерах, на HUD над хотбаром', bindsSaved:'Сохранено'});
Object.assign(CC_ME_TX.en, {level:'Level', xp:'XP', banner:'Banner', frame:'Frame', locked:'from level', showcase:'Showcase', showPick:'Pick up to three for the showcase',
  people:'People', mates:'Teammates', nights:'nights', avgP:'avg place', bestMate:'Best teammate', rival:'Main rival', rivalNote:'most often MVP of your nights',
  cal:'Last 30 days', settings:'Settings', lang:'Language', binds:'Build binds', bindsNote:'Used in every career, shown on the HUD above the hotbar', bindsSaved:'Saved'});
/* Уровень аккаунта: опыт за всё, что лежит на устройстве. Порог уровня n: 150·n·(n−1), то есть 2 = 300, 5 = 3000,
   10 = 13 500, 20 = 57 000. Баннеры (фон шапки) и рамки аватара открываются по уровню. */
function ccMeXp(cars, dr, hist, achOpen){
  let xp=0;
  cars.forEach(([,c])=>{ xp+=c.ev*10+c.wins*60+c.titles*400+c.potm*150; });
  xp+=dr.length*40+dr.filter(r=>r.place===1).length*150;
  xp+=hist.length*15+hist.filter(h=>h.place===1).length*60;
  xp+=achOpen*50;
  let lv=1; while(150*(lv+1)*lv<=xp) lv++;
  const from=150*lv*(lv-1), to=150*(lv+1)*lv;
  return {xp, lv, pct:Math.round((xp-from)/(to-from)*100), next:to};
}
const CC_ME_BANNERS=[[1,'lobby'],[3,'sunset'],[5,'storm'],[8,'tilted'],[12,'gold'],[16,'ice'],[20,'champ']];
const CC_ME_FRAMES=[[1,'yellow'],[4,'silver'],[7,'gold'],[10,'storm'],[15,'rainbow']];
// Витрина: выигранные финалы FNCS из всех карьер и открытые достижения. id: cup:<слот>:<день>:<вид>, a:<id>, p:<ключ>.
function ccMeShowItems(cars, ach, has){
  const out=[];
  cars.forEach(([n, c])=>c.cups.forEach(e=>{ let art=null, nm=''; try{ art=ccLogArt(e); }catch(x){}
    if(e.kind==='globals') nm='Global Championship'; else { try{ nm=ccLockerPlain(ccLogName(e)); }catch(x){} }
    out.push({id:'cup:'+n+':'+e.day+':'+e.kind, art, icon:'🏆', name:nm, sub:String(e.day||'').slice(0,4)}); }));
  const PT=CC_ME_ACH_TX[(typeof LANG!=='undefined' && LANG)] || CC_ME_ACH_TX.en;
  Object.keys(has).filter(k=>has[k]).forEach(k=>out.push({id:'p:'+k, icon:CC_ME_ACH_ICO[k], name:PT[k][0]}));
  // В названиях ачивок бывает флаг тегом <img>; в плитке нужен только текст.
  ACHIEVEMENTS.filter(a=>ach.has(a.id)).forEach(a=>out.push({id:'a:'+a.id, icon:a.icon, name:String(L()['achv_'+a.id+'_title']||a.id).replace(/<[^>]*>/g, '').trim()}));
  return out;
}
function ccMeShowTile(it){
  return '<div class="me-show-t">'+(it.art ? '<img src="'+esc(it.art)+'" alt="" loading="lazy" onerror="this.remove()">' : '<i>'+it.icon+'</i>')+
    '<b>'+esc(it.name)+'</b>'+(it.sub ? '<small>'+esc(it.sub)+'</small>' : '')+'</div>';
}
function ccMeShowToggle(id){
  if(!CC_ME_EDIT) return;
  const s=(CC_ME_EDIT.show=CC_ME_EDIT.show||[]), i=s.indexOf(id);
  if(i>=0) s.splice(i, 1); else if(s.length<3) s.push(id);
  ccMeRedraw();
}
// Люди: напарники из записей вечеров (e.mates) по всем карьерам; соперник — чаще всех MVP твоих вечеров, кроме тебя.
function ccMePeople(saves){
  const by=new Map(), mvp=new Map();
  saves.forEach(s=>{ const me=hKey(String((s.player||{}).nick||''));
    ((s.career||{}).log||[]).forEach(e=>{ if(!e || !e.place) return;
      (e.mates||(e.mate ? [e.mate] : [])).forEach(m=>{ const k=hKey(m); if(!k || k===me) return;
        const b=by.get(k)||{name:m, n:0, sum:0, firsts:0, prize:0}; b.n++; b.sum+=e.place; if(e.place===1) b.firsts++; b.prize+=e.prize||0; by.set(k, b); });
      if(e.mvp && !e.mvpYou && hKey(e.mvp)!==me){ const k=hKey(e.mvp); const r=mvp.get(k)||{name:e.mvp, n:0}; r.n++; mvp.set(k, r); } }); });
  const mates=[...by.values()].sort((a,b)=>b.n-a.n);
  const best=mates.filter(m=>m.n>=5).sort((a,b)=>a.sum/a.n-b.sum/b.n)[0]||null;
  const rival=[...mvp.values()].sort((a,b)=>b.n-a.n)[0]||null;
  return {mates:mates.slice(0, 6), best, rival};
}
// Бинды аккаунта главнее бинд карьеры (ccBindsOf): настоящие клавиши у человека одни на все карьеры.
function ccMeBindSet(el, k, v){
  v=ccBindOk(v); if(!v) return false;
  const p=ccMeProf(), b=(p.binds||CC_BIND_DEFAULT.slice()).slice(0, 4);
  if(b.some((x,i)=>i!==k && x===v)){ el.classList.add('bad'); setTimeout(()=>el.classList.remove('bad'), 700); return false; }
  b[k]=v; p.binds=b; ccMeProfSave(p);
  el.value=v; const m=document.getElementById('meBindsOk'); if(m) m.hidden=false;
  return true;
}
function ccMeBindKey(e, k){
  if(e.key==='Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
  if(!e.key || e.key==='Unidentified' || e.key==='Process') return;   // экранная клавиатура телефона: разберёт ccMeBindInput
  e.preventDefault();
  if(e.key.length===1) ccMeBindSet(e.target, k, e.key);
}
function ccMeBindInput(el, k){
  const ch=String(el.value||'').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
  const p=ccMeProf(), was=(p.binds||CC_BIND_DEFAULT)[k];
  if(!ch || !ccMeBindSet(el, k, ch)) el.value=was;
}
// Панель облака одна (#ccCloud, со своими id полей), поэтому на время аккаунта переезжает в него и возвращается обратно.
let CC_ME_CLOUD_HOME=null;
function ccMeCloudMount(){
  const cl=document.getElementById('ccCloud'), slot=document.getElementById('meCloudSlot'); if(!cl || !slot) return;
  if(!CC_ME_CLOUD_HOME) CC_ME_CLOUD_HOME={parent:cl.parentNode, next:cl.nextSibling};
  slot.appendChild(cl); try{ ccCloudDraw(); }catch(e){}
}
function ccMeCloudHome(){
  const cl=document.getElementById('ccCloud'); if(!cl || !CC_ME_CLOUD_HOME || cl.parentNode===CC_ME_CLOUD_HOME.parent) return;
  CC_ME_CLOUD_HOME.parent.insertBefore(cl, CC_ME_CLOUD_HOME.next);
}
function ccMeHTML(){
  const T=ccMeT(), stat=(v,l)=>'<div class="me-st"><b>'+v+'</b><small>'+esc(l)+'</small></div>';
  // Карьеры по слотам.
  const cars=[], saves=[];
  for(let n=1;n<=CC_SLOTS;n++){ const s=ccSlotRead(n); if(s && s.career){ cars.push([n, ccMeCareer(s)]); saves.push(s); } }
  // Менеджер — прямо по ключам: mgrSlotRead живёт в куске mgr.js и до входа в менеджер на сайте не загружен.
  let mgrN=0; try{ for(let n=1;n<=10;n++) if(localStorage.getItem(n===1 ? 'fncsdraft_manager' : 'fncsdraft_manager_s'+n)) mgrN++; }catch(e){}
  const tot=cars.reduce((a,[,c])=>{ a.earn+=c.earn; a.ev+=c.ev; a.wins+=c.wins; a.vr+=c.vr; a.titles+=c.titles; return a; }, {earn:0, ev:0, wins:0, vr:0, titles:0});
  // Драфт дня.
  const days=(dailyStore().days)||{}, dk=Object.keys(days).sort(), dr=dk.map(k=>Object.assign({day:k}, days[k])).filter(r=>r.place);
  let streak=0; { let d=dailyDay(); if(!days[d]) d=ccAddDays(d, -1); while(days[d] && days[d].place){ streak++; d=ccAddDays(d, -1); } }
  // Драфт и достижения.
  const hist=loadHistory(), ach=loadAchievements();
  const gradeOrder='SABCD', bestGrade=hist.map(h=>h.grade).filter(Boolean).sort((a,b)=>gradeOrder.indexOf(a)-gradeOrder.indexOf(b))[0]||'—';
  const placed=hist.filter(h=>h.place!=null);
  // Ник и аватар: свой профиль (fncsdraft_profile) первым, потом первая карьера и ник драфта дня.
  const prof=ccMeProf(), E=CC_ME_EDIT;
  const nick=(E ? E.nick : prof.nick) || (cars[0] && cars[0][1].nick) || dailyNick() || '—';
  let ph=E ? ccMeAvaURL(E) : ccMeAvaURL(prof);
  if(!ph){ try{ ph=CAREER && careerCard() ? photoURL(careerCard()) : null; }catch(e){ ph=null; } }
  /* Два отдельных набора (30.10, его «отдельные достижения для карьеры и отдельные для драфта»): карьера — c_*;
     драфт — 76 старых ACHIEVEMENTS (забеги) и d_* (драфт дня). */
  const has=ccMeAch(saves, dr);
  const cKeys=Object.keys(has).filter(k=>k[0]==='c'), dKeys=Object.keys(has).filter(k=>k[0]==='d'), mKeys=Object.keys(has).filter(k=>k[0]==='m');
  const cOpen=cKeys.filter(k=>has[k]).length, dOpen=dKeys.filter(k=>has[k]).length, mOpen=mKeys.filter(k=>has[k]).length;
  const cloud=!!(typeof ccCloudCode==='function' && ccCloudCode());
  // Уровень, баннер, рамка, витрина.
  const lv=ccMeXp(cars, dr, hist, ach.size+cOpen+dOpen+mOpen);
  const okB=k=>CC_ME_BANNERS.some(([l,n])=>n===k && l<=lv.lv), okF=k=>CC_ME_FRAMES.some(([l,n])=>n===k && l<=lv.lv);
  const bn=okB(E ? E.banner : prof.banner) ? (E ? E.banner : prof.banner) : 'lobby';
  const fr=okF(E ? E.frame : prof.frame) ? (E ? E.frame : prof.frame) : 'yellow';
  const showAll=ccMeShowItems(cars, ach, has), showIds=(E ? E.show : prof.show)||[];
  const shown=showIds.map(id=>showAll.find(x=>x.id===id)).filter(Boolean);
  const ava='<span class="me-fr me-fr-'+fr+'">'+(ph ? '<img class="me-ava" src="'+esc(ph)+'" alt="" onerror="this.remove()">' : '<span class="me-ava me-ava-0">'+esc(String(nick).slice(0,1).toUpperCase())+'</span>')+'</span>';
  const pick=(list, cur, key)=>list.map(([l,n])=>'<button type="button" class="me-pick me-pick-'+key+' me-'+key+'-'+n+(cur===n ? ' on' : '')+'"'+
    (l>lv.lv ? ' disabled title="'+esc(T.locked+' '+l)+'"' : ' onclick="CC_ME_EDIT.'+(key==='bn' ? 'banner' : 'frame')+'=\''+n+'\';ccMeRedraw()"')+'>'+(l>lv.lv ? '🔒'+l : '')+'</button>').join('');
  const editor=E ? '<div class="me-edit">'+
      '<input class="me-nick-in" maxlength="24" placeholder="'+esc(T.nickPh)+'" value="'+esc(E.nick)+'" oninput="CC_ME_EDIT.nick=this.value">'+
      '<label class="cc-back me-up">'+esc(T.upload)+'<input type="file" accept="image/*" hidden onchange="ccMePhoto(this)"></label>'+
      '<input class="me-skin-in" placeholder="'+esc(T.skinPh)+'" value="'+esc(E.q)+'" oninput="ccMeSkinFind(this.value)">'+
      '<div class="me-skins" id="meSkins">'+ccMeSkinsHTML()+'</div>'+
      '<div class="me-row"><small>'+esc(T.banner)+'</small>'+pick(CC_ME_BANNERS, bn, 'bn')+'</div>'+
      '<div class="me-row"><small>'+esc(T.frame)+'</small>'+pick(CC_ME_FRAMES, fr, 'fr')+'</div>'+
      (showAll.length ? '<div class="me-row me-row-show"><small>'+esc(T.showPick)+' · '+showIds.length+'/3</small><div class="me-show-pick">'+
        showAll.map(it=>'<button type="button" class="me-show-o'+(showIds.indexOf(it.id)>=0 ? ' on' : '')+'" onclick="ccMeShowToggle(\''+esc(it.id)+'\')">'+ccMeShowTile(it)+'</button>').join('')+'</div></div>' : '')+
      '<div class="me-edit-b"><button class="cc-back me-open" onclick="ccMeEditSave()">'+esc(T.save)+'</button><button class="cc-back" onclick="ccMeEditClose()">'+esc(T.cancel)+'</button></div>'+
      '<small>'+esc(cloud ? T.cloudOn : T.cloudOff)+'</small></div>' : '';
  const head='<div class="ch-tile me-head me-bn-'+bn+'">'+ava+
    '<div class="me-id"><h2>'+esc(nick)+'</h2>'+
      '<div class="me-lv"><b>'+esc(T.level)+' '+lv.lv+'</b><span><i style="width:'+lv.pct+'%"></i></span><small>'+ccNum(lv.xp)+' / '+ccNum(lv.next)+' '+esc(T.xp)+'</small></div>'+
      '<small>'+esc(T.device)+(cloud ? ' · ☁ '+esc(T.cloudOn) : '')+'</small>'+
      (E ? '' : '<button class="cc-back me-editbtn" onclick="ccMeEditOpen()">'+esc(T.edit)+'</button>')+'</div>'+
    (shown.length && !E ? '<div class="me-show">'+shown.map(ccMeShowTile).join('')+'</div>' : '')+
    '<div class="me-sts">'+stat(cars.length, T.careers)+stat('$'+ccNum(tot.earn), T.earn)+stat(tot.wins, T.firsts)+stat(tot.vr, T.vr)+stat(tot.titles, T.titles)+
      stat(dr.length, T.daily)+stat(cOpen+'/'+cKeys.length, T.achCareerS)+stat((ach.size+dOpen)+'/'+(ACHIEVEMENTS.length+dKeys.length), T.achDraftS)+
      stat(mOpen+'/'+mKeys.length, T.achMgrS)+'</div>'+editor+'</div>';
  const cupsHTML=c=>{ if(!c.cups.length) return '';
    const shown=c.cups.slice(-6), rest=c.cups.length-shown.length;
    return '<div class="me-cups">'+shown.map(e=>{ let art=null; try{ art=ccLogArt(e); }catch(x){}
      let nm=''; if(e.kind==='globals') nm='Global Championship'; else { try{ nm=ccLockerPlain(ccLogName(e)); }catch(x){ nm=''; } }
      return '<span class="me-cup'+(e.kind==='globals' ? ' g' : '')+'" title="'+esc(nm+' · '+e.day)+'">'+(art ? '<img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'<b>🏆</b></span>'; }).join('')+
      (rest>0 ? '<span class="me-cup-more">+'+rest+' '+esc(T.more)+'</span>' : '')+'</div>'; };
  const carHTML=cars.length ? cars.map(([n, c])=>'<div class="me-car">'+
      '<div class="me-car-h">'+(c.flag ? '<span class="me-flag">'+c.flag+'</span>' : '')+'<b>'+esc(c.nick)+'</b>'+(c.creator ? '<em>'+esc(T.creator)+'</em>' : '')+'<span>'+esc(String(c.y0||''))+(c.y && c.y!==c.y0 ? '–'+c.y : '')+'</span>'+
        '<i class="me-ovr">'+c.ovr+'</i></div>'+cupsHTML(c)+
      '<div class="me-sts">'+stat(c.season, T.season)+(c.div ? stat(c.div, T.div) : '')+stat('$'+ccNum(c.earn), T.earn)+stat(c.ev, T.ev)+stat(c.wins, T.firsts)+stat(c.vr, T.vr)+
        stat(c.top10, T.top10)+stat(c.titles, T.titles)+stat(c.potm, T.potm)+'</div>'+
      (c.best ? '<div class="me-best"><small>'+esc(T.best)+'</small> '+esc(c.best)+'</div>' : '')+
      '<button class="cc-back me-open" onclick="ccSlotUse('+n+');careerEntry()">'+esc(T.open)+'</button></div>').join('')
    : '<div class="ch-empty">'+esc(T.none)+'</div>';
  // Календарь драфта дня: 30 клеток до сегодня, сыграно / топ-3 / победа.
  const calHTML=(()=>{ let d=dailyDay(), cells=[];
    for(let i=0;i<30;i++){ const r=days[d]; cells.unshift('<i class="'+(r && r.place ? (r.place===1 ? 'w' : r.place<=3 ? 'p' : 'y') : '')+'" title="'+esc(d+(r && r.place ? ' · #'+r.place : ''))+'"></i>'); d=ccAddDays(d, -1); }
    return '<div class="me-cal"><small>'+esc(T.cal)+'</small><div>'+cells.join('')+'</div></div>'; })();
  const dailyHTML=dr.length ? '<div class="me-sts">'+stat(dr.length, T.played)+stat(dr.filter(r=>r.place===1).length, T.wins)+
      stat('#'+Math.min.apply(null, dr.map(r=>r.place)), T.bestPlace)+stat('#'+(dr.reduce((a,r)=>a+r.place,0)/dr.length).toFixed(1), T.avgPlace)+
      stat(ccNum(Math.max.apply(null, dr.map(r=>r.score||0))), T.bestScore)+stat(streak, T.streak)+'</div>'+
      '<div class="me-last"><small>'+esc(T.last)+'</small>'+dr.slice(-10).reverse().map(r=>'<span class="'+(r.place===1 ? 'w' : r.place<=3 ? 'p' : '')+'" title="'+esc(r.day)+'">#'+r.place+'</span>').join('')+'</div>'+
      calHTML
    : '<div class="ch-empty">'+esc(T.none)+'</div>';
  const draftHTML=hist.length ? '<div class="me-sts">'+stat(hist.length, T.runs)+stat(placed.filter(h=>h.place===1).length, T.wins)+
      stat(placed.length ? '#'+Math.min.apply(null, placed.map(h=>h.place)) : '—', T.bestPlace)+stat(bestGrade, T.bestGrade)+
      stat(hist.filter(h=>h.championMajor).length, T.majors)+'</div>' : '<div class="ch-empty">'+esc(T.none)+'</div>';
  const achHTML='<div class="me-ach">'+ACHIEVEMENTS.map(a=>'<div class="achv-card '+(ach.has(a.id) ? 'unlocked' : 'locked')+'"><div class="achv-icon">'+a.icon+'</div><div><div class="achv-title">'+
      (L()['achv_'+a.id+'_title']||a.id)+'</div><div class="achv-desc">'+(L()['achv_'+a.id+'_desc']||'')+'</div></div></div>').join('')+'</div>';
  const sec=(h, body)=>'<div class="ch-tile me-sec"><h4>'+esc(h)+'</h4>'+body+'</div>';
  // Достижения свёрнуты: заголовок со счётом, список по нажатию.
  const secAch=(h, body)=>'<details class="ch-tile me-sec me-det"><summary><h4>'+esc(h)+'</h4></summary>'+body+'</details>';
  // Драфт дня первыми в наборе драфта: они свежие и про то, во что играют каждый день.
  const draftAch='<div class="me-ach">'+ccMeAchHTML(has, 'd_')+achHTML.replace(/^<div class="me-ach">/, '');
  // Три отдельных набора: карьера под карьерами, драфт под драфтом, менеджер в конце.
  // Люди: напарники, лучший напарник (от 5 вечеров), главный соперник.
  const ppl=ccMePeople(saves);
  const pplHTML=ppl.mates.length ? '<div class="me-sts">'+
      (ppl.best ? stat(esc(ppl.best.name)+' · #'+(ppl.best.sum/ppl.best.n).toFixed(1), T.bestMate) : '')+
      (ppl.rival ? stat(esc(ppl.rival.name)+' · '+ppl.rival.n, T.rival+' ('+T.rivalNote+')') : '')+'</div>'+
      '<div class="me-mates"><small>'+esc(T.mates)+'</small>'+ppl.mates.map(m=>'<div class="me-mate"><b>'+esc(m.name)+'</b><span>'+m.n+' '+esc(T.nights)+' · '+esc(T.avgP)+' #'+(m.sum/m.n).toFixed(1)+
        (m.firsts ? ' · 🏆 '+m.firsts : '')+(m.prize ? ' · $'+ccNum(m.prize) : '')+'</span></div>').join('')+'</div>'
    : '<div class="ch-empty">'+esc(T.none)+'</div>';
  // Настройки: облако (панель #ccCloud переезжает сюда), язык, бинды аккаунта.
  const pb=ccMeProf().binds||CC_BIND_DEFAULT, langs=['en','ru','fr','it','pt','de','es'];
  const setHTML='<div class="me-set"><div id="meCloudSlot"></div>'+
    '<div class="me-row"><small>'+esc(T.lang)+'</small>'+langs.map(l=>'<button type="button" class="me-lang'+(LANG===l ? ' on' : '')+'" onclick="setLang(\''+l+'\');ccMeRedraw()">'+l.toUpperCase()+'</button>').join('')+'</div>'+
    '<div class="me-row"><small>'+esc(T.binds)+'</small>'+['Wall','Floor','Stairs','Cone'].map((n,k)=>'<span class="me-bind"><i class="me-bico">'+(CC_KIT_BUILD_ICON[n.toLowerCase()]||'')+'</i><input maxlength="3" value="'+esc(pb[k]||CC_BIND_DEFAULT[k])+'" autocomplete="off" spellcheck="false" onkeydown="ccMeBindKey(event,'+k+')" oninput="ccMeBindInput(this,'+k+')"></span>').join('')+
      '<em id="meBindsOk" hidden>✓ '+esc(T.bindsSaved)+'</em></div><small class="me-note">'+esc(T.bindsNote)+'</small></div>';
  return head+sec(T.careers, '<div class="me-cars">'+carHTML+'</div>')+
    secAch(T.achCareer+' · '+cOpen+'/'+cKeys.length, '<div class="me-ach">'+ccMeAchHTML(has, 'c_')+'</div>')+
    sec(T.people, pplHTML)+
    sec(T.daily, dailyHTML)+sec(T.draft, draftHTML)+
    secAch(T.achDraft+' · '+(ach.size+dOpen)+'/'+(ACHIEVEMENTS.length+dKeys.length), draftAch)+
    sec(T.mgr, mgrN ? '<div class="me-sts">'+stat(mgrN, T.clubs)+'</div>' : '<div class="ch-empty">'+esc(T.none)+'</div>')+
    secAch(T.achMgr+' · '+mOpen+'/'+mKeys.length, '<div class="me-ach">'+ccMeAchHTML(has, 'm_')+'</div>')+
    sec(T.settings, setHTML);
}
function openProfileScreen(){
  ccMeRedraw();
  show('screen-profile');
  try{ if(location.hash!=='#me') history.replaceState(null, '', '#me'); }catch(e){}
  window.scrollTo(0, 0);
}
// /#me открывается, как только код готов: после DOMContentLoaded (язык и главная уже собраны), не дожидаясь картинок.
(function(){
  const go=()=>setTimeout(()=>{ try{ if(location.hash==='#me') openProfileScreen(); }catch(e){} document.documentElement.classList.remove('boot-me'); }, 0);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
// Медальоны боссов Fortnite с вики (items/medallions), по одному на месяц.
const CC_AW_MEDALS=['nisha', 'peter', 'valeria', 'oscar'];
/* У каждого месяца свой медальон: январь → peter, … декабрь → godzilla.
   Нет файла месяца: onerror ставит один из скачанных (CC_AW_MEDALS). Положил картинку в папку, месяц её берёт. */
const CC_AW_MEDAL_MONTH=['peter', 'nisha', 'oscar', 'montague', 'valeria', 'megalodon', 'shogunx', 'nightrose', 'doombot', 'emmafrost', 'mysterio', 'godzilla'];
/* Настоящие кубки ЛАНов, фото с сайтов производителей и Epic: World Cup 2019 (Нью-Йорк), FNCS Invitational 2022
   (Swarovski), Global Championship 2023 и 2024 (Swarovski, один дизайн), Глобалы с 2025-го и Pro-Am (Thomas Lyte).
   Остальные финалы остаются табличкой с артом турнира. */
function ccAwTrophy(e){
  if(!e) return null;
  const y=String(e.day||'').slice(0,4);
  if(e.kind==='major' && (e.day==='2019-07-27' || e.day==='2019-07-28')) return 'wc-2019';
  if(e.kind==='globals') return y==='2022' ? 'inv-2022' : y<'2025' ? 'gc-2023' : y==='2025' ? 'gc-2025' : 'gc-2026';
  if(e.kind==='proam') return 'proam';
  // EWC: диск на кристалле, один на все игры; Reload Championship тоже на EWC.
  if(ccAwEwc(e) || (e.kind==='rc' && e.stage==='final')) return 'ewc';
  return null;
}
function ccAwEwc(e){ return !!(e && e.ewc && /Esports World Cup/.test(e.lan||'')); }
function ccAwardsShelfHTML(){
  if(typeof careerAwards!=='function') return '';
  const won=(careerAwards().won||[]).filter(a=>a.you);
  const month=won.filter(a=>a.kind==='month'), season=won.filter(a=>a.kind==='season'), cat=won.filter(a=>a.kind==='cat');
  /* 30.10, его «награды чет сделать мб кубки фнксы какие-то как в игрок месяца в футболе» (скрин: шесть одинаковых
     звёзд, месяцы вперемешку). Теперь две полки: КУБКИ — выигранные финалы FNCS из лога (Мейджоры, ЛАНы, Глобалы,
     Reload), кубок с названием и датой, финалы недели одной строкой ×N; ИГРОК МЕСЯЦА — карточки как в футболе:
     твоё фото, плашка, месяц и год, очки PR и турниры (у наград до 30.10 их нет — только месяц). Всё по порядку. */
  const item=(ico, name, sub)=>'<div class="aw-item"><i>'+ico+'</i><b>'+esc(name)+'</b><small>'+esc(sub)+'</small></div>';
  const log=((CAREER.career||{}).log||[]).filter(e=>e && e.place===1);
  const big=e=>{ try{ if(ccFncsTitle(e)) return true; }catch(x){}
    return e.kind==='globals' || e.kind==='proam' || ccAwEwc(e) || (/^(summit|rc|reload)$/.test(e.kind) && e.stage==='final'); };
  const cups=log.filter(big).sort((a,b)=>String(a.day)<String(b.day) ? -1 : 1);
  const weekly=log.filter(e=>e.kind==='final' && !big(e)).length;
  // Глобалы полным именем: ccLogName даёт календарное сокращение «ГЧ» (его «что такое ГЧ», 30.10).
  const cupName=e=>{ const t=ccAwTrophy(e);
    if(t==='wc-2019') return 'World Cup '+(e.day==='2019-07-28' ? 'Solo' : 'Duos');
    if(t==='inv-2022') return 'FNCS Invitational';
    if(t==='proam') return 'Pro-Am';
    if(t==='ewc') return e.kind==='rc' ? 'EWC · Reload' : 'Esports World Cup';
    if(e.kind==='globals') return 'Global Championship';
    try{ return ccLockerPlain(ccLogName(e)); }catch(x){ return e.name||''; } };
  const cupDay=e=>{ try{ return ccDayLabel ? ccDayLabel(e.day) : e.day; }catch(x){ return e.day||''; } };
  /* 30.10 (2), его «слопно; кубки пусть лого фнкса, который он выиграл»: кубок — заставка того самого турнира
     (ccLogArt, те же картинки, что на стене истории) в рамке с табличкой: название и год. */
  const cupHTML=e=>{
    const t=ccAwTrophy(e);
    if(t) return '<div class="aw-plq aw-plq-t"><img src="items/trophies/'+t+'.png" alt="" loading="lazy">'+
      '<div class="aw-plq-plate"><b>'+esc(cupName(e))+'</b><small>'+esc(String(cupDay(e)))+' '+esc(String(e.day||'').slice(0,4))+'</small></div></div>';
    let art=null; try{ art=ccLogArt(e); }catch(x){ art=null; }
    return '<div class="aw-plq'+(e.kind==='globals' ? ' aw-plq-g' : '')+'">'+
      (art ? '<img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+
      '<div class="aw-plq-plate"><b>'+esc(cupName(e))+'</b><small>'+esc(String(cupDay(e)))+' '+esc(String(e.day||'').slice(0,4))+'</small></div></div>';
  };
  /* Игрок месяца — медаль на ленте (30.10, «игрок месяца чет другое» после карточек): золотой круг с выбитым месяцем,
     лента цветов FNCS, год и очки под ней. */
  const potm=month.slice().sort((a,b)=>String(a.key)<String(b.key) ? -1 : 1).map((a, ai)=>{
    const mName=typeof ccMonthName==='function' ? ccMonthName(a.key) : a.key;
    /* 30.10, его «чет с фортнайтом связанное… мб медальки из фортнайта»: медальоны боссов Главы 5 (вики Fortnite,
       items/medallions). Свой у каждого месяца (CC_AW_MEDAL_MONTH), недостающие подменяются скачанными. */
    const mi=Math.max(0, Math.min(11, Number(String(a.key).slice(5,7))-1));
    const med=CC_AW_MEDAL_MONTH[mi], alt=CC_AW_MEDALS[mi%CC_AW_MEDALS.length];
    return '<div class="aw-medal"><span class="aw-medal-glow"><img class="aw-medal-i" src="items/medallions/'+med+'.webp" alt="" loading="lazy"'+
      (alt!==med ? ' onerror="this.onerror=null;this.src=\'items/medallions/'+alt+'.webp\'"' : '')+'></span>'+
      '<b class="aw-medal-m">'+esc(mName)+'</b><span class="aw-medal-y">'+esc(String(a.key).slice(0,4))+'</span>'+
      (a.pts ? '<small>'+esc(ccNum(a.pts))+' '+esc(L().lfAwPts)+' · '+a.ev+' '+esc(L().lfAwEv)+'</small>' : '')+'</div>';
  });
  const items=[]
    .concat(season.map(a=>item('🏆', L().lfAwYear, L().ccMoneySeason(a.season))))
    .concat(cat.map(a=>item('🎖️', (typeof ccAwCatLabel==='function' ? ccAwCatLabel(a.cat) : a.cat), L().ccMoneySeason(a.season))));
  const any=cups.length || weekly || potm.length || items.length;
  return '<div class="ch-tile aw-shelf"><h4>'+L().lfAwards+'</h4>'+
    (!any ? '<div class="ch-empty">'+L().lfAwNone+'</div>' :
      ((cups.length || weekly) ? '<div class="aw-sub">'+esc(L().lfAwCups)+'</div><div class="aw-cups">'+cups.map(cupHTML).join('')+
        (weekly ? (()=>{ const we=log.filter(e=>e.kind==='final' && !big(e)).slice(-1)[0]; let art=null; try{ art=ccLogArt(we); }catch(x){}
          return '<div class="aw-plq aw-plq-s">'+(art ? '<img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+
            '<div class="aw-plq-plate"><b>'+esc(L().lfAwWeekly)+'</b><small>×'+weekly+'</small></div></div>'; })() : '')+'</div>' : '')+
      (items.length ? '<div class="aw-grid">'+items.join('')+'</div>' : '')+
      (potm.length ? '<div class="aw-sub">'+esc(L().lfAwMonths)+'</div><div class="aw-potms">'+potm.join('')+'</div>' : ''))+'</div>';
}
// The rating over the career, drawn from the log itself. The reference puts the
// number's own curve behind it, and it is the one chart a career has: eleven
// points a season, and the shape of them is the whole story of the mode.
function careerRatingCurve(log){
  const pts=log.slice().reverse().map(e=>e.ovr).filter(v=>isFinite(v));
  if(pts.length<2) return '';
  // A bare line across an empty box reads as a stray diagonal rather than as a
  // chart, which is why the reference fills under its curve. Same here: the
  // fill is what says "this is the shape of something", and the top and bottom
  // of the range are printed so the slope has a scale.
  const w=100, h=34, pad=2;
  const lo=Math.min(...pts), hi=Math.max(...pts), span=Math.max(1, hi-lo);
  const xy=pts.map((v,i)=>[(i/(pts.length-1))*w, h-pad-((v-lo)/span)*(h-pad*2)]);
  const line=xy.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');
  const area=`0,${h} ${line} ${w},${h}`;
  return `<div class="ev-chart">
    <svg class="ev-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#35e0ff" stop-opacity=".42"/>
        <stop offset="1" stop-color="#35e0ff" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon points="${area}" fill="url(#evGrad)"/>
      <polyline points="${line}" fill="none" stroke="#35e0ff" stroke-width="1.6"
        vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    </svg>
    <span class="ev-chart-hi">${hi}</span><span class="ev-chart-lo">${lo}</span>
  </div>`;
}

/* =====================================================================
   3 сентября 2026 — девять пунктов из разбора «чего не хватает карьере».
   Выбор: 2 (события-развилки), 3 (статистика), 4 (зал славы по слотам),
   5 (контракт с бонусом и уход клуба), 8 (ЛАН как поездка), 9 (план на игру),
   11 (план недели), 12 (мета сезона).
   Всё, что трогает силу игры (8, 9), меняет только РАЗБРОС своей команды и
   ни разу не среднее — см. tools/career-spread-probe.js.
   ===================================================================== */

/* План на вечер («на место» / «на элимы») и нервы первого ЛАНа: замерены и не выпущены.
   tools/career-spread-probe.js, 600 игр на режим, комната Д1 на 50:
   1. Ширина броска формы (gameForm) ×0.3..×2.0 ничего не сдвигает, дуэли по _pc решают мало.
   2. Агрессия (zone-sim seek × _seekMul, хук оставлен), очки = место + элимы×4 (кап 10):
      рейтинг 86: ×0.5 25.2, ×0.7 26.7, ×1 24.8, ×1.4 23.2, ×2 19.7;
      рейтинг 78: ×0.5 18.2, ×0.7 18.0, ×1 17.5, ×1.4 15.7, ×2 14.5; σ не растёт (27.6 → 26.6 при ×2).
   Агрессия только штраф, у такого выбора один правильный ответ. Не возвращать без нового рычага и замера. */

/* ---- 8. ЛАН как поездка ----

   Перелёт стоит энергии (день дороги), приезд — свой пост из города. Раз за
   ЛАН в сезоне. */
const CC_LAN_TRAVEL=25;
function careerLanArrive(kind, ev){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  cr.lan=cr.lan||{};
  // Про-Ам: своя остановка — свой город и свой прилёт (Даллас в июле, Сан-Паулу в сентябре).
  const pa=(kind==='proam') ? ccProAmEvent(ccProAmKey(ev)) : null;
  const key=kind+'|'+cr.season+(pa ? '|'+ccProAmKey(ev) : '');
  if(cr.lan[key]) return false;
  cr.lan[key]=careerToday();
  const city=pa ? (((L().ccCity||{})[pa.city])||pa.city) : ccLanCity(kind, cr.season);
  careerSpend(CC_LAN_TRAVEL);
  careerNews('good', 'ccPostLanArrive', [city]);
  careerSave();
  return true;
}

/* ---- Уведомления как в X ----

   Скриншот ленты уведомлений X (): «ASP wheat and 11 others liked
   your post», под именем — кусок самого поста, справа его картинка. У нас
   стояло «Твой пост лайкнули: 549» без единого лица. Кто именно — берётся из
   уже записанного, как и комментарии (ccPostComments): напарник, клуб,
   друзья, подписки, люди из таблицы под постом. Никого не выдумываем. */
function ccNoteWho(n, salt){
  const pool=[];
  const add=h=>{ if(h && !pool.some(x=>hKey(x)===hKey(h))) pool.push(String(h)); };
  const mate=careerPartnerCard();
  if(mate) add(mate.handle);
  if(CAREER.org) add(CAREER.org.name);
  (CAREER.career.friends||[]).forEach(add);
  (ccFollows()||[]).forEach(add);
  ((n && n.tbl && n.tbl.rows)||[]).forEach(r=>String(r.n||'')
    .split(/\s*[+&]\s*/).forEach(x=>add(x.trim())));
  const me=CAREER.player && (CAREER.player.handle||CAREER.player.nick);
  const list=pool.filter(h=>!me || hKey(h)!==hKey(me));
  if(!list.length) return '';
  const rnd=careerRng(ccHashStr((salt||'')+'|'+((n&&n.id)||'')+'|'+((n&&n.day)||'')));
  return list[Math.floor(rnd()*list.length)];
}
function careerNoteRowHTML(t){
  const h=jsq(t.who||'');
  const who=t.who ? ccHandle(t.who) : '';
  const rest=Math.max(0, (t.n||0)-1);
  const head = t.kind==='follow' ? L().ccNoteFollow(who)
     : !who ? (t.kind==='like' ? L().ccNoteLike(ccFollowers(t.n||0))
             : t.kind==='repost' ? L().ccNoteRepost(ccFollowers(t.n||0))
             : L().ccNoteReply(ccFollowers(t.n||0)))
     : (t.kind==='like'   ? L().ccNoteLikeBy(who, ccFollowers(rest))
      : t.kind==='repost' ? L().ccNoteRepostBy(who, ccFollowers(rest))
      :                     L().ccNoteReplyBy(who, ccFollowers(rest)));
  // Сам пост под строкой — как в X, куском текста и его же картинкой.
  const post=t.post ? (CAREER.career.news||[]).find(n=>n.id===t.post) : null;
  const card=ccWhoCard(t.who||'');
  const av=t.who ? ccAvatar({name:t.who, handle:who, card:card}) : '';
  const art=post && post.art ? (CAREER_EV_ART[post.art]||'') : '';
  const glyph=t.kind==='like' ? CC_X_LIKE : t.kind==='repost' ? CC_X_REPOST
            : t.kind==='reply' ? CC_X_REPLY : CC_X_USER;
  return `<div class="x-note x-note-${t.kind}">
    <span class="x-note-g">${glyph}</span>
    <span class="x-note-av">${av}</span>
    <div class="x-note-in">
      <b>${esc(head)}</b>
      ${post ? `<span class="x-note-post">${esc(ccText(post))}</span>` : ''}
    </div>
    ${art ? `<span class="x-note-art" style="background-image:url(${art})"></span>` : ''}
    <em>${ccStamp(t)}</em>
    ${t.kind==='follow' ? (ccFollowing(t.who)
        ? `<span class="x-act-done">${L().ccFollowingBtn}</span>`
        : `<button class="x-act" onclick="careerFollow(\'${h}\')">${L().ccFollowBack}</button>`) : ''}
  </div>`;
}

/* ---- Разговор с напарником ----

   Просьба: «можно еще отдельную переписку с тимейтом сделать и
   какое-то общение там». Ветка напарника в инбоксе была и раньше — но только
   как канал, по которому он сам пишет после вечера (careerMateDm). Ответить
   было нечем.

   Здесь ветка есть всегда, пока сидит напарник, и в ней четыре темы, каждая
   из чего-то уже записанного: разбор вчерашнего вечера (журнал), точка
   высадки (careerSpots), кто на кого играет (роли), и просто поговорить.
   Настрой двигается тем же careerTalkMove, что и день «поговорить», и по тем
   же правилам не становится краном: повторный разговор в CC_TALK_GAP дешевле.
   Энергию НЕ тратит — это переписка, а не занятие; день не закрывается. */
/* «Про роли» сняли (его слово 7.10: «про роли лишнее будто, заменить») — ответ был один и тот же на все случаи.
   Вместо неё «Про соперников»: напарник называет самого сильного по Power Ranking, кроме вас двоих, и его место —
   то, что действительно меняется от недели к неделе. Старые ключи dm*role оставлены: они лежат в сохранённых
   переписках. */
const CC_MATE_TOPICS=['night','spot','rival','life'];
function ccMateRival(){
  try{
    const mate=careerPartnerCard(), mk=mate ? hKey(mate.handle) : null;
    const rows=careerPrRows()||[];
    for(let i=0; i<rows.length; i++){
      const r=rows[i]; if(!r || r.you || (mk && hKey(r.name)===mk)) continue;
      return {name:r.name, place:i+1, mine:(typeof careerPrPlace==='function' ? careerPrPlace() : null)||0};
    }
  }catch(e){}
  return null;
}
function careerMateThread(){
  const mate=careerPartnerCard();
  if(!mate || !mate.handle) return null;
  const t=careerDmFind(mate.handle);
  if(t) return t;
  const a=attrsFor(mate)||{};
  return careerDmThread({handle:mate.handle, ovr:(mate._ovr!=null?mate._ovr:a.ovr),
    nat:mate.nat, role:a.roleKey, roster:mate.tier!=='ladder',
    cardRegion:mate.region, club:mate.org||null, pay:ccPlayerPay(mate), mate:true});
}
// О чём можно поговорить сегодня: тема отпадает, когда говорить не о чем.
/* КАЖДАЯ ТЕМА — РАЗ В ДЕНЬ (его скрин в Notion 7.10: «одинаковые сообщения просто с тимейтом и можно спамить»):
   «Как сам?» жалось без конца, ответ повторялся, а каждое нажатие в тот же день добавляло терпения. Теперь тема,
   о которой сегодня уже говорили, пропадает до завтра; настрой — только от первого разговора за день. */
function ccMateTalkedToday(rec){
  const d=rec && rec.talkDay;
  return (d && d.day===careerToday()) ? (d.topics||[]) : [];
}
/* Последний вечер, сыгранный ВМЕСТЕ с этим напарником (строка журнала знает, с кем: r.mate / r.mates). Вечер до него —
   не его вечер: разбирать с ним нечего. */
function ccMateLastWith(mate){
  const last=((CAREER.career||{}).log||[]).slice(-1)[0];
  if(!last || !mate) return null;
  const k=hKey(mate.handle||mate);
  const with_=(last.mate && hKey(last.mate)===k) || (Array.isArray(last.mates) && last.mates.some(h=>hKey(h)===k));
  return with_ ? last : null;
}
function careerMateTopics(){
  const mate=careerPartnerCard(); if(!mate) return [];
  const cr=CAREER.career;
  const last=ccMateLastWith(mate);
  const done=ccMateTalkedToday(careerMateRec());
  const extra=[];
  // Разбор — после плохого вечера, один раз на этот вечер.
  if(last && ccMateBadNight(last) && (careerMateRec()||{}).revDay!==last.day) extra.push('review');
  // План — в день, когда есть что играть, один раз.
  if(ccMateHasNightToday() && !(cr.matePlan && cr.matePlan.day===careerToday())) extra.push('plan');
  return extra.concat(CC_MATE_TOPICS.filter(k=>{
    if(done.indexOf(k)>=0) return false;
    if(k==='night') return !!last;
    if(k==='spot')  return !!careerSpotOn();
    if(k==='rival') return !!ccMateRival();
    return true;
  }));
}
/* ТРИ НОВЫХ РАЗГОВОРА С ТИММЕЙТОМ (его «делай» 7.10 на список «что ещё добавить»). Числа — оценка режима.
   1) РАЗБОР ПЛОХОГО ВЕЧЕРА — каким тоном: поддержать / разобрать ошибки / наехать. Отклик зависит от характера
      («голос» ccVoiceOf: 1 сдержанный, 2 тёплый, 3 дерзкий, 4 сухой): тёплому нужна поддержка, сухому — разбор,
      наезд не любит никто, дерзкий — меньше всех.
   2) ПЛАН НА ВЕЧЕР — «агрессивно» (W-key) или «от зоны» (спокойно). Играешь вечер тем стилем, о котором
      договорились, — плюс к настрою; другим — минус (careerMatePlanAfter после вечера).
   3) ЧЕСТНО О ПЕРЕМАНИВАНИИ — если его зовут, а настроя чуть не хватает, он сначала говорит тебе. «Останься,
      договоримся» поднимает настрой и держит его; «решай сам» — уходит (см. careerMatePoach). */
const CC_REV_TONE={support:{0:5,1:4,2:8,3:2,4:3}, analyze:{0:5,1:6,2:3,3:-2,4:7}, blame:{0:-6,1:-4,2:-8,3:-10,4:-3}};
const CC_PLAN_KEPT=4, CC_PLAN_BROKEN=-4, CC_HEADSUP_BAND=15, CC_HEADSUP_KEEP=12;
function ccMateBadNight(r){ return !!r && !r.passed && r.of>1 && r.place>r.of*0.5; }
function ccMateHasNightToday(){
  try{ return (careerEvents().get(careerToday())||[]).some(e=>e && e.kind && e.kind!=='nations'); }catch(e){ return false; }
}
function careerMateReview(tone){
  const rec=careerMateRec(), t=careerMateThread(), cr=CAREER.career; if(!rec || !t || !CC_REV_TONE[tone]) return;
  const last=ccMateLastWith(careerPartnerCard()); if(!last || rec.revDay===last.day) return;
  rec.revDay=last.day; t.revAsk=false;
  const mate=careerPartnerCard(), v=mate ? ccVoiceOf(mate.handle) : 0;
  const by=CC_REV_TONE[tone][v]!=null ? CC_REV_TONE[tone][v] : CC_REV_TONE[tone][0];
  careerDmPush(t, 'you', 'dmRevYou_'+tone, [last.place, last.of]);
  careerDmPush(t, 'them', by>=5 ? 'dmRevGood' : by>0 ? 'dmRevOk' : 'dmRevBad', [last.place, last.of]);
  careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+by, 0, 100); });
  careerSave(); careerRenderHub('social');
}
function careerMatePlanSet(style){
  const t=careerMateThread(), cr=CAREER.career; if(!t || (style!=='aggr' && style!=='zone')) return;
  cr.matePlan={day:careerToday(), style, done:false}; t.planAsk=false;
  careerDmPush(t, 'you', 'dmPlanYou_'+style);
  careerDmPush(t, 'them', 'dmPlanOk_'+style);
  careerSave(); careerRenderHub('social');
}
// После вечера: сыграли тем стилем, о котором договорились?
function careerMatePlanAfter(){
  const cr=CAREER.career, p=cr && cr.matePlan; if(!p || p.done || p.day!==careerToday()) return;
  const t=careerMateThread(); if(!t) return;
  p.done=true;
  const st=(typeof ccPlayStyle==='function') ? ccPlayStyle() : 'norm';
  const kept=(p.style==='aggr' && st==='key') || (p.style==='zone' && st==='chill');
  careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+(kept ? CC_PLAN_KEPT : CC_PLAN_BROKEN), 0, 100); });
  careerDmPush(t, 'them', kept ? 'dmPlanKept' : 'dmPlanBroken');
}
function careerMateHeadsUp(stay){
  const t=careerMateThread(); if(!t || t.state!=='headsup') return;
  const mate=careerPartnerCard(); if(!mate){ t.state='open'; return; }
  if(stay){
    careerDmPush(t, 'you', 'dmHeadsUpStayYou');
    careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+CC_HEADSUP_KEEP, 0, 100); });
    careerDmPush(t, 'them', 'dmHeadsUpStays');
    t.state='open';
  } else {
    careerDmPush(t, 'you', 'dmHeadsUpGoYou');
    careerDmPush(t, 'them', 'dmMatePoachGo', [t.headsPlace||0]);
    careerMateDrop(mate.handle);
    t.state='declined'; t.left=careerToday();
    careerNews('bad', 'ccNewsMateLeftFor', [mate.handle]);
    careerEvent('tlDuoPoached', [mate.handle]);
  }
  careerSave(); careerRenderHub('social');
}
function careerMateTalk(kind){
  const mate=careerPartnerCard(); if(!mate) return false;
  if(kind==='review' || kind==='plan'){
    const t0=careerMateThread(); if(!t0) return false;
    if(kind==='review') t0.revAsk=true; else t0.planAsk=true;
    careerSave(); careerRenderHub('social'); return true;
  }
  const rec=careerMateRec(); if(!rec) return false;
  const cr=CAREER.career, t=careerMateThread(); if(!t) return false;
  if(ccMateTalkedToday(rec).indexOf(kind)>=0) return false;
  const firstToday=!ccMateTalkedToday(rec).length;
  rec.talkDay={day:careerToday(), topics:ccMateTalkedToday(rec).concat([kind])};
  const last=ccMateLastWith(mate);
  const args={
    night: last ? [last.place, last.of] : [0, 0],
    spot:  [careerSpotOn() ? (careerSpotOn().i+1) : 0, careerSpotOn() ? (careerSpotOn().aura||0) : 0],
    role:  [L()[(attrsFor(mate)||{}).roleKey]||'', L()[(CAREER.player.attrs&&CAREER.player.role)||CAREER.player.role]||''],
    rival: (r=>r ? [r.name, r.place, r.mine] : ['', 0, 0])(kind==='rival' ? ccMateRival() : null),
    life:  []
  }[kind]||[];
  careerDmPush(t, 'you', 'dmMeTalk'+kind, args);
  const alt=ccMateReplyAlt(kind, args, rec);
  if(alt) careerDmPush(t, 'them', 'dmMateSay', alt); else careerDmPush(t, 'them', 'dmMateTalk'+kind, args);
  /* Настрой — тем же правилом, что и день «поговорить»: разговор подряд
     стоит вдвое и вчетверо меньше. Разница в том, что этот не берёт день. */
  const by=firstToday ? careerTalkMove(rec, careerToday()) : 0;
  if(by){
    careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+by, 0, 100); });
    rec.talked=careerToday();
  }
  t.unread=false;
  careerSave();
  careerRenderHub('social');
  return true;
}
/* Ответ напарника от обстановки, а не одна строка на тему: вечер хороший, средний или плохой, есть ли точка и аура,
   какой у него настрой. Строка выбирается днём, чтобы перерисовка её не меняла. Нет набора в языке: английский. */
const CC_MATE_V={
  ru:{night_none:['Пока разбирать нечего, ещё не играли вместе. Вечером посмотрим','Сначала сыграем, потом разберём. Я готов'],
      night_good:['Вот это вечер. Держим так же, ничего не меняем','Видел? Мы в зону заходили первыми. Повторим','Хороший вечер. Только в конце жадничали, можно было больше'],
      night_mid:['Средне. Две игры отдали на ровном месте','Не плохо, не хорошо. В середине вечера просели, надо держать концентрацию'],
      night_bad:['Плохо, честно. Я тоже накосячил, извини','Пересмотрел. Дропали слишком жадно, давай спокойнее','Забудем. Один вечер ничего не решает, завтра заново'],
      spot_none:['Своей точки у нас нет. Может, возьмём? Без неё каждый вечер лотерея','Каждый раз падаем куда придётся. Давай закрепимся'],
      spot_weak:['Точка норм, но нас там ещё не боятся. Надо постоять','Лут есть, но соседи лезут. Пару вечеров и отстанут'],
      spot_strong:['Наша точка, все знают. Никто не лезет','Там нам спокойно. Лут ровный, выходим полными'],
      role:['Норм. Ты зовёшь ротации, я беру первый контакт','Меня устраивает. Только зови раньше, я не всегда вижу зону','Давай так. Если что, поменяемся, мне не принципиально'],
      life_up:['Отлично. Настрой боевой, жду вечера','Всё хорошо. Потренил утром, руки тёплые','Норм, даже кайфую. Давно так не хотелось играть'],
      life_down:['Честно, так себе. Устал немного','Не очень. Последние вечера выбили, но я соберусь','Средне. Давай сегодня без лишнего давления']},
  en:{night_none:['Nothing to review yet, we have not played together. Tonight we will see','Play first, review after. I am ready'],
      night_good:['What a night. Keep it exactly like this','Saw that? We were first into every zone. Again','Good night. We got greedy at the end though, could have been more'],
      night_mid:['Average. We threw two games for nothing','Not bad, not good. We dipped mid evening, need to stay focused'],
      night_bad:['Bad, honestly. I messed up too, sorry','Rewatched it. We dropped too greedy, let us play calmer','Forget it. One night decides nothing, fresh start tomorrow'],
      spot_none:['We have no spot of our own. Shall we take one? Without it every night is a lottery','We land wherever every time. Let us settle somewhere'],
      spot_weak:['Spot is fine, but nobody fears us there yet. We need to hold it','There is loot, but the neighbours keep coming. A couple of nights and they stop'],
      spot_strong:['Our spot, everyone knows it. Nobody contests','We are calm there. Steady loot, we leave full'],
      role:['Fine. You call rotations, I take first contact','Works for me. Just call earlier, I do not always see the zone','Let us do it. We can swap if needed, I do not mind'],
      life_up:['Great. In the mood, can not wait for tonight','All good. Warmed up this morning, hands are ready','Fine, enjoying it even. Have not wanted to play this much in a while'],
      life_down:['Honestly, meh. A bit tired','Not great. The last nights got to me, but I will pull it together','So so. Let us keep the pressure low today']},
  fr:{night_none:['Rien à analyser, on n’a pas encore joué ensemble. Ce soir on verra','On joue d’abord, on analyse après. Je suis prêt'],
      night_good:['Quelle soirée. On garde exactement ça','T’as vu ? On rentrait premiers dans chaque zone. On remet ça','Bonne soirée. Un peu gourmands à la fin quand même, on pouvait faire plus'],
      night_mid:['Moyen. On a lâché deux games pour rien','Ni bien ni mal. On a baissé en milieu de soirée, faut rester concentrés'],
      night_bad:['Mauvais, honnêtement. J’ai raté aussi, désolé','J’ai revu. On a drop trop gourmand, jouons plus calme','On oublie. Une soirée ne décide rien, demain on repart'],
      spot_none:['On n’a pas de spot à nous. On en prend un ? Sans ça chaque soirée est une loterie','On atterrit n’importe où à chaque fois. Posons nous quelque part'],
      spot_weak:['Le spot est correct, mais personne ne nous craint encore. Faut tenir','Il y a du loot, mais les voisins viennent. Deux soirées et ils arrêtent'],
      spot_strong:['Notre spot, tout le monde le sait. Personne ne conteste','On est tranquilles là bas. Loot stable, on sort full'],
      role:['Ça va. Tu appelles les rotations, je prends le premier contact','Ça me va. Appelle juste plus tôt, je ne vois pas toujours la zone','Faisons comme ça. On peut échanger si besoin, ça m’est égal'],
      life_up:['Top. Motivé, j’attends ce soir','Tout va bien. Échauffé ce matin, les mains sont prêtes','Ça va, je kiffe même. Ça faisait longtemps que je n’avais pas autant envie de jouer'],
      life_down:['Franchement, bof. Un peu fatigué','Pas terrible. Les dernières soirées m’ont touché, mais je vais me reprendre','Moyen. Allons y sans trop de pression aujourd’hui']},
  it:{night_none:['Ancora niente da rivedere, non abbiamo giocato insieme. Stasera vediamo','Prima giochiamo, poi analizziamo. Sono pronto'],
      night_good:['Che serata. Teniamola così','Visto? Entravamo primi in ogni zona. Di nuovo','Bella serata. Un po’ ingordi alla fine però, si poteva fare di più'],
      night_mid:['Nella media. Abbiamo buttato due partite per niente','Né bene né male. Calati a metà serata, serve concentrazione'],
      night_bad:['Male, onestamente. Ho sbagliato anche io, scusa','Rivista. Drop troppo ingordo, giochiamo più calmi','Dimentichiamola. Una serata non decide niente, domani si riparte'],
      spot_none:['Non abbiamo un posto nostro. Ne prendiamo uno? Senza ogni serata è una lotteria','Atterriamo ovunque ogni volta. Fermiamoci da qualche parte'],
      spot_weak:['Il posto va bene, ma lì nessuno ci teme ancora. Bisogna tenerlo','Il loot c’è, ma i vicini arrivano. Un paio di serate e smettono'],
      spot_strong:['È il nostro posto, lo sanno tutti. Nessuno contesta','Lì siamo tranquilli. Loot stabile, usciamo pieni'],
      role:['Va bene. Tu chiami le rotazioni, io prendo il primo contatto','Per me va bene. Chiama solo prima, non sempre vedo la zona','Facciamo così. Se serve ci scambiamo, per me è uguale'],
      life_up:['Benissimo. Carico, aspetto stasera','Tutto bene. Riscaldato stamattina, le mani sono pronte','Bene, anzi mi diverto. Non avevo così voglia di giocare da tempo'],
      life_down:['Sinceramente, così così. Un po’ stanco','Non benissimo. Le ultime serate mi hanno pesato, ma mi riprendo','Insomma. Oggi niente pressione extra']},
  pt:{night_none:['Ainda nada para rever, não jogamos juntos. À noite a gente vê','Primeiro joga, depois analisa. Tô pronto'],
      night_good:['Que noite. Mantém assim','Viu? A gente entrava primeiro em toda zona. De novo','Boa noite. Mas ficamos gananciosos no fim, dava pra mais'],
      night_mid:['Mediano. Entregamos duas partidas à toa','Nem bom nem ruim. Caímos no meio da noite, precisa de foco'],
      night_bad:['Ruim, sinceramente. Eu errei também, foi mal','Revi. Drop ganancioso demais, vamos jogar mais calmos','Esquece. Uma noite não decide nada, amanhã de novo'],
      spot_none:['Não temos um ponto nosso. Vamos pegar um? Sem isso toda noite é loteria','Toda vez caímos em qualquer lugar. Vamos fixar um ponto'],
      spot_weak:['O ponto é bom, mas ninguém tem medo da gente lá ainda. Precisa segurar','Tem loot, mas os vizinhos aparecem. Umas duas noites e eles param'],
      spot_strong:['Nosso ponto, todo mundo sabe. Ninguém disputa','Lá é tranquilo. Loot estável, saímos cheios'],
      role:['Beleza. Você chama as rotações, eu pego o primeiro contato','Por mim tudo bem. Só chama antes, nem sempre vejo a zona','Vamos assim. Se precisar a gente troca, tanto faz'],
      life_up:['Ótimo. No clima, esperando a noite','Tudo certo. Aqueci de manhã, mãos prontas','De boa, curtindo até. Fazia tempo que não tinha tanta vontade de jogar'],
      life_down:['Sinceramente, mais ou menos. Meio cansado','Não muito bem. As últimas noites pesaram, mas vou me recuperar','Mais ou menos. Hoje sem pressão extra']}
};
function ccMateReplyAlt(kind, args, rec){
  const set=CC_MATE_V[(typeof LANG!=='undefined' && LANG) || 'en'] || CC_MATE_V.en;
  let k=null;
  if(kind==='night'){ const p=args[0]||0, of=args[1]||0;
    k=!p ? 'night_none' : (p<=Math.max(5, of*0.1) ? 'night_good' : p<=of*0.5 ? 'night_mid' : 'night_bad'); }
  else if(kind==='spot') k=!args[0] ? 'spot_none' : (args[1]||0)>=50 ? 'spot_strong' : 'spot_weak';
  else if(kind==='role') k='role';
  else if(kind==='life') k=((rec && rec.patience!=null ? rec.patience : 60)>=50 && careerEnergy()>=40) ? 'life_up' : 'life_down';
  const list=k && set[k];
  if(!list || !list.length) return null;
  return [k, Math.abs(ccHashStr('mate|'+kind+'|'+careerToday()))%list.length];
}
function careerMateOpen(){
  const t=careerMateThread(); if(!t) return;
  CH_SOCIAL='dms';
  careerDmOpen(t.id);
}

/* Стримы: вкладка и эфиры. Расчёт прежний (зрители от аудитории, донаты, спонсор, баннер), но у эфира есть вид:
     вид        энергия  охват  деньги  подписчики  цена
     ранкед       30      1.0    1.0     1.0       база
     общение      30      0.6    1.6     0.8       растёшь медленнее
     коллаб       40      1.0    1.0     1.0       + аудитория креатора
     марафон      55      1.8    1.8     1.8       день и перегруз
   Коллаб считается как у Про-Ама (ccProAmReachFrom), так что креаторы Про-Ама работают весь год. Марафон добавляет перегруз (cr.grind). */
/* hours — сколько часов идёт эфир. Нужно партнёрской программе, которая
   считает наработанные часы за месяц; марафон в своём же тексте обещает
   «вдвое дольше», отсюда восемь против четырёх. */
const CC_STREAM_KINDS=[
  {id:'grind', energy:30, reach:1,   cash:1,   subs:1,   grind:0, hours:4},
  {id:'chat',  energy:30, reach:0.6, cash:1.6, subs:0.8, grind:0, hours:4},
  {id:'colab', energy:40, reach:1,   cash:1,   subs:1,   grind:0, mate:true, hours:4},
  {id:'long',  energy:55, reach:1.8, cash:1.8, subs:1.8, grind:2, hours:8},
  // Тренировка в эфире: половина дня тренировки (train — доля прироста trPit), зрителей и денег меньше, чем у ранкеда.
  {id:'train', energy:45, reach:0.6, cash:0.6, subs:0.6, grind:1, hours:4, train:0.5}
];
/* Эфир с турнира: вид вечера, а не дня. Включается на панели дня рядом с «Играть», вечер
   симулируется как обычно, поверх идёт трансляция (careerPlayLive, ccTv*).
   Цена: своя команда слабее на CC_STREAM_POW (10, больше формы ±3 и химии +5 вместе).
   Энергия 20 против 30 у обычного эфира, перегруз выше, охват 0.7 (место уже платит охватом),
   подписчики и донаты ×1.3 / ×1.1, после вечера бонус за результат (ccStreamCupAfter). */
const CC_STREAM_CUP={id:'cup', energy:20, reach:0.7, cash:1.1, subs:1.3, grind:1, hours:4};
