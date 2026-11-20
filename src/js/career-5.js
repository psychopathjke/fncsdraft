/*@@PART js/career-5.js@@*/
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
/* ИКОНКИ НАГРАД — предметы Fortnite вместо эмодзи (17.10, его «awards сделай логотипы, фортнайтовские»): игрок года —
   мифическая золотая рыбка (главный трофей острова), награда месяца — флоппер Мидаса, лучшее дуо — Chug Splash (лечит
   всю команду), новичок — Small Fry, фраггер — помпа, IGL — сканер разведки. Картинки — из items/ сайта. */
const CC_AW_ICON={goty:'items/m1-mythic-goldfish.png', month:'items/m1-midas-flopper.png', duo:'items/m1-chug-splash.png',
  rookie:'items/m1-small-fry.png', frag:'items/m1-iron-pump-shotgun.png', igl:'items/itm-recon-scanner.webp'};
function ccAwIcon(k){ const s=CC_AW_ICON[k] || CC_AW_ICON.igl; return '<img class="cc-aw-ic" src="'+s+'" alt="" loading="lazy">'; }
function careerSeasonCatsHTML(){
  const cr=CAREER.career, T=L();
  const won=careerAwardCatsWon(cr.season);
  if(!won.length) return '';
  const block=a=>{ const top=a.top||[]; if(!top.length) return ''; const w=top[0];
    const rest=top.slice(1).map((r,i)=>`<div class="ch-row cc-goty-row${r.you?' me':''}"><em><i>${i+2}</i>${esc(r.n)}</em><b>${r.pct}%</b></div>`).join('');
    return `<div class="cc-aw-cat"><h5>${esc(ccAwCatLabel(a.cat))}</h5>
      <div class="cc-goty-win${w.you?' me':''}"><span class="cc-goty-ball" aria-hidden="true">${ccAwIcon(a.cat)}</span>
        <div><b>${esc(w.n)}</b><em>${esc(T.ccAwVote(w.pct))}</em></div></div>${rest}</div>`; };
  return `<div class="ch-tile cc-goty cc-aw"><h4>${T.ccAwCatsH}</h4>${won.map(block).join('')}<div class="ch-hint">${T.ccAwHow}</div></div>`;
}
function careerSeasonAwardHTML(){
  const cr=CAREER.career;
  const aw=(careerAwards().won||[]).filter(a=>a.kind==='season' && a.season===cr.season)[0];
  if(!aw) return '';
  let top=aw.top;
  if(!top || !top.length){
    const from=Math.max(0, (cr.season||1)-1)*365;
    top=careerAwardBoard(from, from+365).slice(0, CC_AWARD_TOP)
        .map(r=>({n:r.name, p:Math.round(r.pts), e:r.events, you:!!r.you}));
  }
  if(!top.length) return '';
  const win=top[0];
  const rest=top.slice(1).map((r,i)=>`<div class="ch-row cc-goty-row${r.you?' me':''}">
      <em><i>${i+2}</i>${esc(r.n)}</em><b>${ccNum(r.p)}</b></div>`).join('');
  return `<div class="ch-tile cc-goty">
    <h4>${L().ccGotyTitle}</h4>
    <div class="cc-goty-win${win.you?' me':''}">
      <span class="cc-goty-ball" aria-hidden="true">${ccAwIcon('goty')}</span>
      <div><b>${esc(win.n)}</b>
        <em>${esc(L().ccGotyLine(ccNum(win.p), win.e))}</em></div>
    </div>
    ${rest}
    <div class="ch-hint">${L().ccGotyHow}</div>
  </div>`;
}

/* Церемония закрытия сезона, отдельный последний день года (careerEvents, вид 'gala'). Четыре экрана: год
   открывается, твои числа, вечера и награды, игрок года.
   Открывается только по кнопке: окно без спроса вешает headless-проверки (так было с confirm() и окном метки, см.
   careerSpotGate). Кнопка рядом с «Новым сезоном», а не вместо, путь «.ch-play и дальше» не тронут. */
const CC_GALA_SLIDES=6;   // + слайд «Твой год» (ccGalaYouSlide) после цифр года   // 10.09: слайд номинаций перед игроком года
let CC_GALA_STEP=0;
// Год, собранный из того, что карьера УЖЕ записала: журнал, доска PR и список
// наград. Церемония ничего не считает от себя — она читает.
function ccGalaYear(season){
  const cr=CAREER.career, s=season||cr.season;
  const log=(cr.log||[]).filter(r=>r.season===s);
  const placed=log.filter(r=>r.place);
  const best=placed.length ? placed.reduce((a,b)=>(b.place<a.place ? b : a)) : null;
  const from=Math.max(0, (s||1)-1)*365;
  const me=careerAwardBoard(from, from+365).filter(r=>r.you)[0];
  const card=careerCard(), a=card ? attrsFor(card) : null;
  // Прошлый сезон — рейтинг его последнего вечера, а не сегодняшний.
  const ovr = s!==cr.season && log.length && log[log.length-1].ovr ? log[log.length-1].ovr
            : a ? Math.round(a.ovr + (card._pingEdge||0) + (card._ageEdge||0))
                : CAREER.player.ovr;
  return {
    season:s, div:cr.division,
    events:log.length,
    wins:log.reduce((n,r)=>n+(r.wins||0), 0),
    elims:log.reduce((n,r)=>n+(r.elims||0), 0),
    prize:log.reduce((n,r)=>n+(r.prize||0), 0),
    pr: me ? Math.round(me.pts) : 0,
    best: best,
    ovr: ovr,
    // Рейтинг на первом вечере года — от него и считается рост. Вечеров не
    // было — роста тоже нет, а не «вырос на весь рейтинг».
    grew: placed.length ? Math.round(ovr - (placed[0].ovr||ovr)) : 0,
    runs: careerBigRuns(s),
    prev: ccGalaPrev(s),
    months: (careerAwards().won||[]).filter(x=>x.kind==='month' && x.season===s && x.you),
    goty: (careerAwards().won||[]).filter(x=>x.kind==='season' && x.season===s)[0] || null
  };
}
/* ИТОГИ ГОДА (17.10, его «8»): к церемонии — сравнение с прошлым годом и картинка, которой можно поделиться. */
function ccGalaPrev(s){
  const log=((CAREER.career.log)||[]).filter(r=>r.season===s-1);
  if(!log.length) return null;
  const placed=log.filter(r=>r.place);
  return {events:log.length, wins:log.reduce((n,r)=>n+(r.wins||0), 0), elims:log.reduce((n,r)=>n+(r.elims||0), 0),
          prize:log.reduce((n,r)=>n+(r.prize||0), 0), best:placed.length ? Math.min.apply(null, placed.map(r=>r.place)) : null};
}
function ccGalaDelta(now, was, money){
  if(was==null) return '';
  const d=now-was; if(!d) return '<i class="cc-gala-d">=</i>';
  return '<i class="cc-gala-d '+(d>0 ? 'up' : 'down')+'">'+(d>0 ? '▲' : '▼')+(money ? ccMoney(Math.abs(d)) : ccNum(Math.abs(d)))+'</i>';
}
function ccGalaShareLines(y){
  const cr=CAREER.career, log=(cr.log||[]).filter(e=>e.season===y.season);
  const mates={}; log.forEach(e=>(e.mates||(e.mate?[e.mate]:[])).forEach(m=>{ if(m) mates[m]=(mates[m]||0)+1; }));
  const top=Object.keys(mates).sort((a,b)=>mates[b]-mates[a])[0];
  const run=(y.runs||[])[0];
  return {tiles:[[ccNum(y.events), L().ccGalaEvents], [ccNum(y.wins), L().ccGalaWins], [ccNum(y.elims), L().ccGalaElims],
                 [ccMoney(y.prize), L().ccGalaPrize], [y.best ? '#'+y.best.place : '-', L().ccGalaBest], [String(y.ovr), L().ccGalaOvr]],
          rows:[run ? [careerRunLabel(run), L().ccBoardPlace(run.place, run.of)] : null,
                top ? [L().lfGalaTopMate, top+' · '+mates[top]] : null,
                (y.goty && y.goty.you) ? [L().ccGalaGotyYou, '🏆'] : null,
                y.prev ? [L().ccGalaPrevRow, ccMoney(y.prev.prize)+' · '+(y.prev.best ? '#'+y.prev.best : '-')] : null,
                ((CAREER.career.locker||[]).filter(it=>it.season===y.season && it.kind!=='spray').length)
                  ? [L().ccLockerTitle, (CAREER.career.locker||[]).filter(it=>it.season===y.season && it.kind!=='spray').map(it=>it.name).slice(0, 2).join(', ')] : null
               ].filter(Boolean).slice(0, 4)};
}
/* ПОДЕЛИТЬСЯ — ОКНОМ С КАРТИНКОЙ (17.10, его «поделиться результатами сезона нельзя»). Раньше кнопка
   молча отдавала файл: на ПК он тихо падал в загрузки (или открывалось окно Windows), в Safari
   navigator.share после await рисования терял жест нажатия и падал. Теперь картинка рисуется сразу,
   показывается, и уже по ГОТОВОМУ файлу: «Отправить» (share в том же нажатии), «Сохранить» (обычная
   ссылка download) и «Скопировать» (буфер обмена). Любой сезон — не только идущий: из Истории тоже. */
let CC_GALA_FILE=null;
async function ccGalaShare(season){
  let blob=null, name='';
  try{ ({blob, name}=await ccGalaShareBlob(season)); }
  catch(e){ console.warn('gala share', e); }
  ccGalaShareModal(blob, name);
}
function ccGalaShareModal(blob, name, title){
  const T=L();
  if(CC_GALA_FILE && CC_GALA_FILE.url) URL.revokeObjectURL(CC_GALA_FILE.url);
  CC_GALA_FILE=blob ? {blob:blob, name:name, url:URL.createObjectURL(blob), file:null} : null;
  try{ if(blob && typeof File==='function') CC_GALA_FILE.file=new File([blob], name, {type:'image/png'}); }catch(e){}
  const canSend=!!(CC_GALA_FILE && CC_GALA_FILE.file && navigator.canShare && (()=>{ try{ return navigator.canShare({files:[CC_GALA_FILE.file]}); }catch(e){ return false; } })());
  const canCopy=!!(blob && navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem==='function');
  let el=document.getElementById('ccGalaShareModal');
  if(!el){ el=document.createElement('div'); el.id='ccGalaShareModal'; el.className='cc-gala-wrap cc-share-wrap';
    el.addEventListener('click', e=>{ if(e.target===el) ccGalaShareClose(); }); document.body.appendChild(el); }
  el.innerHTML=`<div class="cc-share" role="dialog" aria-modal="true">
    <h4>${esc(title||T.ccGalaShare)}</h4>
    ${CC_GALA_FILE ? `<img class="cc-share-img" src="${CC_GALA_FILE.url}" alt="">` : `<div class="cc-gala-hint">${esc(T.ccShareFail||'Could not draw the picture')}</div>`}
    <div class="cc-share-cta">
      ${canSend ? `<button class="cstrip-btn cstrip-btn-go" onclick="ccGalaShareSend()">${esc(T.ccShareSend||'Send')}</button>` : ''}
      ${CC_GALA_FILE ? `<a class="cstrip-btn ${canSend ? 'cstrip-btn-code' : 'cstrip-btn-go'}" href="${CC_GALA_FILE.url}" download="${esc(name)}">${esc(T.ccShareSave||'Save image')}</a>` : ''}
      ${canCopy ? `<button class="cstrip-btn cstrip-btn-code" id="ccShareCopyBtn" onclick="ccGalaShareCopy()">${esc(T.ccShareCopy||'Copy')}</button>` : ''}
      <button class="cstrip-btn cstrip-btn-code" onclick="ccGalaShareClose()">${esc(T.ccShareClose||'Close')}</button>
    </div>
    <div class="cc-gala-hint" id="ccShareNote"></div>
  </div>`;
}
function ccGalaShareSend(){
  const f=CC_GALA_FILE; if(!f || !f.file) return;
  // Файл уже готов: share зовётся в том же нажатии, без await перед ним.
  navigator.share({files:[f.file]}).catch(e=>{
    if(e && e.name==='AbortError') return;
    const n=document.getElementById('ccShareNote'); if(n) n.textContent=L().ccShareSendFail||'Sharing did not open. Save the image instead';
  });
}
function ccGalaShareCopy(){
  const f=CC_GALA_FILE, n=document.getElementById('ccShareNote'); if(!f) return;
  navigator.clipboard.write([new ClipboardItem({'image/png':f.blob})])
    .then(()=>{ if(n) n.textContent=L().ccShareCopied||'Copied'; })
    .catch(()=>{ if(n) n.textContent=L().ccShareSendFail||'Sharing did not open. Save the image instead'; });
}
/* Картинка карточки для X/Twitter (25.10, его «делай» на «кнопка "Скачать карточку", PNG 1200×675»):
   про отмечают и ретвитят свою карточку, ссылка ведёт на /player/<ник>. Окно то же, что у итогов года
   (ccGalaShareModal): отправить, сохранить, скопировать. */
let CARD_SHARE_PL=null;
function cardShareWord(k){
  const W={btn:{ru:'Поделиться карточкой', fr:'Partager la carte', it:'Condividi la carta', pt:'Compartilhar carta', de:'Karte teilen', es:'Compartir carta', en:'Share card'},
    earn:{ru:'Призовые 2026', fr:'Gains 2026', it:'Guadagni 2026', pt:'Ganhos 2026', de:'Preisgeld 2026', es:'Ganancias 2026', en:'2026 earnings'},
    cards:{ru:'Карточек в игре', fr:'Cartes dans le jeu', it:'Carte nel gioco', pt:'Cartas no jogo', de:'Karten im Spiel', es:'Cartas en el juego', en:'Cards in the game'},
    sub:{ru:'Симулятор карьеры и драфта FNCS', fr:'Simulateur de carrière et de draft FNCS', it:'Simulatore di carriera e draft FNCS', pt:'Simulador de carreira e draft FNCS', de:'FNCS Karriere- und Draft-Simulator', es:'Simulador de carrera y draft FNCS', en:'FNCS career & draft simulator'}};
  return (W[k] && (W[k][LANG] || W[k].en)) || '';
}
function cardShareBtnHTML(pl){
  if(!pl || !pl.handle) return '';
  CARD_SHARE_PL=pl;
  return '<div style="text-align:center;margin:12px 0 2px;"><button class="cstrip-btn cstrip-btn-go" type="button" onclick="cardShareOpen()">'+esc(cardShareWord('btn'))+'</button></div>';
}
// Адрес страницы игрока — по тем же правилам, что build-player-pages.js (≥3 карточки, фото или призовые 2026).
function cardShareLink(pl){
  const h=String(pl.handle||'').trim(), k=h.toLowerCase();
  if(pl._regen || pl._photo || (typeof CAREER!=='undefined' && CAREER && CAREER.player && pl===careerCard())) return 'fncsdraft.com';
  const n=PLAYERS_BASE.filter(p=>p && p.tier!=='qualifier' && hKey(p)===k).length;
  const earn=(typeof HOME_EARN_LQ!=='undefined' ? HOME_EARN_LQ : []).some(r=>String(r.n).toLowerCase()===k);
  const slug=h.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (slug && (n>=3 || photoURLReal(pl) || earn)) ? 'fncsdraft.com/player/'+slug : 'fncsdraft.com';
}
function cardShareImg(src){
  return new Promise(r=>{ if(!src) return r(null);
    const im=new Image(); const t=setTimeout(()=>r(null), 4000);
    im.onload=()=>{ clearTimeout(t); r(im); }; im.onerror=()=>{ clearTimeout(t); r(null); }; im.src=src; });
}
async function cardShareBlob(pl){
  const W=1200, H=675, c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d'), font=(w, s)=>w+' '+s+'px Oswald, "Segoe UI", Roboto, sans-serif';
  try{ if(document.fonts && document.fonts.ready) await document.fonts.ready; }catch(e){}
  const shown=pl._regen && typeof ccRegenShown==='function' ? ccRegenShown(pl) : pl;
  const a=attrsFor(shown), skin=CARD_SKIN[shownRarity(shown)]||CARD_SKIN.common;
  const cols=(String(skin.bg).match(/#[0-9a-f]{6}/gi)||['#7c838c', '#3d424a']);
  const [photo, flag]=await Promise.all([cardShareImg(photoURLReal(shown)), cardShareImg(FLAG_CODE[shown.nat] ? 'flags/w40/'+FLAG_CODE[shown.nat]+'.png' : null)]);
  const g=x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#141a2e'); g.addColorStop(1, '#07090f');
  x.fillStyle=g; x.fillRect(0, 0, W, H);
  const glow=x.createRadialGradient(260, 340, 40, 260, 340, 420); glow.addColorStop(0, skin.glow+'55'); glow.addColorStop(1, skin.glow+'00');
  x.fillStyle=glow; x.fillRect(0, 0, W, H);
  // Карточка слева.
  const cx=70, cy=58, cw=380, ch=560;
  const cg=x.createLinearGradient(cx, cy, cx+cw, cy+ch);
  cols.forEach((col, i)=>cg.addColorStop(cols.length>1 ? i/(cols.length-1) : 0, col));
  roundRect(x, cx, cy, cw, ch, 26); x.fillStyle=cg; x.fill();
  x.save(); roundRect(x, cx, cy, cw, ch, 26); x.clip();
  if(photo){ const s=Math.max(330/photo.width, 400/photo.height), pw=photo.width*s, ph=photo.height*s, px=cx+cw-pw;
    x.drawImage(photo, px, cy, pw, ph);
    // Низ фото растворяется в карточке, а угол под рейтингом темнее, чтобы цифры читались на любом фото.
    const fb=x.createLinearGradient(0, cy+ph-120, 0, cy+ph); fb.addColorStop(0, cols[cols.length-1]+'00'); fb.addColorStop(1, cols[cols.length-1]);
    x.fillStyle=fb; x.fillRect(cx, cy+ph-120, cw, 120);
    const fl=x.createRadialGradient(cx, cy, 30, cx, cy, 300); fl.addColorStop(0, 'rgba(0,0,0,.6)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle=fl; x.fillRect(cx, cy, cw, ch); }
  else{ x.fillStyle='rgba(255,255,255,.18)'; x.font=font(800, 260); x.textAlign='right'; x.fillText(String(shown.handle||'?').trim().charAt(0).toUpperCase(), cx+cw-24, cy+300); x.textAlign='left'; }
  const shade=x.createLinearGradient(0, cy+250, 0, cy+ch); shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(.35, 'rgba(0,0,0,.55)'); shade.addColorStop(1, 'rgba(0,0,0,.8)');
  x.fillStyle=shade; x.fillRect(cx, cy+250, cw, ch-250);
  x.restore();
  x.fillStyle='#fff'; x.font=font(800, 104); x.fillText(String(a.ovr), cx+26, cy+112);
  x.font=font(700, 26); x.fillStyle='rgba(255,255,255,.85)'; x.fillText(String(shown.region||'').toUpperCase(), cx+30, cy+150);
  if(flag) x.drawImage(flag, cx+30, cy+166, 48, 36);
  let nm=String(shown.handle||'').trim(), ns=54; x.font=font(800, ns);
  while(ns>28 && x.measureText(nm).width>cw-40){ ns-=2; x.font=font(800, ns); }
  x.textAlign='center'; x.fillStyle='#fff'; x.fillText(nm, cx+cw/2, cy+392);
  x.fillStyle='rgba(255,255,255,.35)'; x.fillRect(cx+40, cy+412, cw-80, 2);
  ATTR_KEYS.forEach((k, i)=>{
    const col=i%3, row=Math.floor(i/3), ax=cx+70+col*120, ay=cy+462+row*58;
    x.fillStyle='#fff'; x.font=font(800, 34); x.fillText(String(a[k]!=null ? a[k] : ''), ax, ay);
    x.fillStyle='rgba(255,255,255,.7)'; x.font=font(600, 18); x.fillText(String(L()[ATTR_LABEL[k]]||k).toUpperCase(), ax, ay+22);
  });
  x.textAlign='left';
  // Справа: ник, турнир, цифры, адрес.
  const rx=510, rw=W-rx-60;
  x.fillStyle='#ffd23f'; x.fillRect(rx, 78, 10, 150);
  x.font=font(700, 30); x.fillText('FNCS DRAFT', rx+30, 108);
  let big=String(shown.handle||'').trim(), bs=84; x.font=font(800, bs);
  while(bs>40 && x.measureText(big).width>rw-30){ bs-=4; x.font=font(800, bs); }
  x.fillStyle='#f2f4fa'; x.fillText(big, rx+30, 214);
  const ev=String(shown.event||'').trim().replace(/\s*[—–]\s*/g, ' · '), yr=String(shown.date||'').slice(0, 4);
  const evFull=(shown.placement ? '#'+shown.placement+' · ' : '')+ev+(yr && ev.indexOf(yr)<0 ? ' '+yr : '');
  let evl=evFull;
  x.font=font(500, 28); x.fillStyle='#9aa3b8';
  while(evl.length>8 && x.measureText(evl+'…').width>rw-30) evl=evl.slice(0, -1);
  if(evl!==evFull) evl=evl.trim()+'…';
  x.fillText(evl, rx+30, 266);
  const rows=[], r=shown.real;
  if(r){ const lb=realStageLabel(r);
    if(r.rank!=null) rows.push([lb.rank, '#'+r.rank]);
    if(r.pts!=null) rows.push([L().realPts, fmtNum(r.pts)]);
    if(r.wins!=null) rows.push([L().realWins, String(r.wins)]); }
  const earn=(typeof HOME_EARN_LQ!=='undefined' ? HOME_EARN_LQ : []).find(e=>String(e.n).toLowerCase()===String(shown.handle||'').trim().toLowerCase());
  if(earn) rows.push([cardShareWord('earn'), '$'+fmtNum(earn.e)]);
  const nCards=shown._regen ? 0 : PLAYERS_BASE.filter(p=>p && p.tier!=='qualifier' && hKey(p)===hKey(shown)).length;
  if(nCards>1 && rows.length<4) rows.push([cardShareWord('cards'), String(nCards)]);
  rows.slice(0, 4).forEach((row, i)=>{
    const bx=rx+30+(i%2)*(rw/2), by=356+Math.floor(i/2)*112;
    x.fillStyle='rgba(255,255,255,.06)'; x.fillRect(bx, by-52, rw/2-24, 96);
    x.fillStyle='#f2f4fa'; x.font=font(800, 42); x.fillText(String(row[1]), bx+20, by);
    x.fillStyle='#9aa3b8'; x.font=font(600, 20); x.fillText(String(row[0]).toUpperCase().slice(0, 30), bx+20, by+30);
  });
  x.fillStyle='#ffd23f'; x.font=font(700, 36); x.fillText(cardShareLink(shown), rx+30, H-104);
  x.fillStyle='#5b6378'; x.font=font(600, 24); x.fillText(cardShareWord('sub'), rx+30, H-66);
  const blob=await new Promise(res=>c.toBlob(res, 'image/png'));
  if(!blob) throw new Error('toBlob gave nothing');
  const slug=String(shown.handle||'card').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'card';
  return {blob, name:'fncsdraft-'+slug+'.png'};
}
async function cardShareOpen(){
  const pl=CARD_SHARE_PL; if(!pl) return;
  let blob=null, name='';
  try{ ({blob, name}=await cardShareBlob(pl)); }
  catch(e){ console.warn('card share', e); }
  ccGalaShareModal(blob, name, cardShareWord('btn'));
  const el=document.getElementById('ccGalaShareModal'); if(el) el.style.zIndex='240';   // поверх окна карточки (220)
}
function ccGalaShareClose(){
  const el=document.getElementById('ccGalaShareModal'); if(el) el.remove();
  if(CC_GALA_FILE && CC_GALA_FILE.url) URL.revokeObjectURL(CC_GALA_FILE.url);
  CC_GALA_FILE=null;
}
async function ccGalaShareBlob(season){
  const y=ccGalaYear(season), S=ccGalaShareLines(y), pl=CAREER.player;
  const W=1080, H=1350, c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d'), font=(w, s)=>w+' '+s+'px Oswald, "Segoe UI", Roboto, sans-serif';
  const g=x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141a2e'); g.addColorStop(1, '#07090f');
  x.fillStyle=g; x.fillRect(0, 0, W, H);
  x.fillStyle='#ffd23f'; x.fillRect(72, 96, 12, 120);
  x.fillStyle='#ffd23f'; x.font=font(700, 40); x.fillText(L().ccGalaShareTag.toUpperCase(), 108, 136);
  x.fillStyle='#f2f4fa'; x.font=font(800, 88); x.fillText(String(pl.nick||'').slice(0, 18), 108, 214);
  x.fillStyle='#9aa3b8'; x.font=font(500, 38); x.fillText(L().ccGalaTitle(y.season)+' · '+ccSeasonYearOf(y.season), 108, 268);
  const cols=3, gap=24, tw=(W-144-gap*(cols-1))/cols, th=210, top=330;
  S.tiles.forEach((t, i)=>{
    const cx=72+(i%cols)*(tw+gap), cy=top+Math.floor(i/cols)*(th+gap);
    x.fillStyle='rgba(255,255,255,.06)'; x.fillRect(cx, cy, tw, th);
    let size=72; x.font=font(800, size); while(size>34 && x.measureText(t[0]).width>tw-40){ size-=4; x.font=font(800, size); }
    x.fillStyle='#f2f4fa'; x.fillText(t[0], cx+24, cy+108);
    x.fillStyle='#9aa3b8'; x.font=font(600, 30); x.fillText(String(t[1]).slice(0, 22), cx+24, cy+164);
  });
  let ry=top+2*(th+gap)+50;
  S.rows.forEach(r=>{
    x.fillStyle='#9aa3b8'; x.font=font(500, 32); x.fillText(String(r[0]).slice(0, 40), 72, ry);
    x.fillStyle='#ffd23f'; x.font=font(700, 40); x.fillText(String(r[1]).slice(0, 40), 72, ry+50);
    ry+=118;
  });
  x.fillStyle='#5b6378'; x.font=font(700, 34); x.fillText('fncsdraft.com', 72, H-64);
  const blob=await new Promise(r=>c.toBlob(r, 'image/png'));
  if(!blob) throw new Error('toBlob gave nothing');
  return {blob:blob, name:'fncsdraft-season-'+y.season+'.png'};
}
function ccGalaNum(v, label){
  return `<div class="cc-gala-num"><b>${v}</b><em>${label}</em></div>`;
}
/* «Твой год» — личное, чего нет в цифрах года: оценки вечеров, лучший вечер, MVP, с кем
   играл (и с кем чаще всего), ранг и сессии Noble. Из журнала сезона и cr.life. */
function ccGalaYouSlide(){
  const cr=CAREER.career, log=(cr.log||[]).filter(e=>e.season===cr.season);
  const rated=log.filter(e=>e.rating!=null);
  const avg=rated.length ? (rated.reduce((a,e)=>a+e.rating,0)/rated.length).toFixed(1) : '-';
  const best=rated.slice().sort((a,b)=>b.rating-a.rating)[0];
  const mvp=rated.filter(e=>e.mvpYou).length;
  const mates={}; log.forEach(e=>(e.mates||(e.mate?[e.mate]:[])).forEach(m=>{ if(m) mates[m]=(mates[m]||0)+1; }));
  const mateList=Object.keys(mates).sort((a,b)=>mates[b]-mates[a]);
  const lf=cr.life||{};
  return '<h4>'+L().lfGalaYouH+'</h4><div class="cc-gala-nums">'+
    ccGalaNum(avg, L().lfAvgRateAll)+ccGalaNum(ccNum(mvp), L().lfMvpAll)+
    ccGalaNum(ccNum(mateList.length), L().lfGalaMates)+
'</div>'+
    (best ? '<div class="cc-gala-row"><em>'+L().lfGalaBestNight+'</em><b>'+best.rating.toFixed(1)+' · '+ccLogName(best)+'</b></div>' : '')+
    (mateList.length ? '<div class="cc-gala-row"><em>'+L().lfGalaTopMate+'</em><b>'+esc(mateList[0])+' · '+mates[mateList[0]]+'</b></div>' : '')+
    (lf.icon ? '<div class="cc-gala-row me"><em>'+L().lfIcon+'</em><b>Icon Series</b></div>' : '');
}
function ccGalaSlide(i, y){
  if(i===0) return `<div class="cc-gala-open">
      <div class="cc-gala-big">${esc(String(y.season))}</div>
      <div class="cc-gala-line">${esc(L().ccGalaOpenLine(y.div, y.events))}</div>
      <div class="cc-gala-hint">${esc(L().ccGalaOpenHint)}</div>
    </div>`;
  if(i===1) return `<h4>${L().ccGalaYearH}</h4>
    <div class="cc-gala-nums">
      ${ccGalaNum(ccNum(y.events)+ccGalaDelta(y.events, y.prev && y.prev.events), L().ccGalaEvents)}
      ${ccGalaNum(ccNum(y.wins)+ccGalaDelta(y.wins, y.prev && y.prev.wins), L().ccGalaWins)}
      ${ccGalaNum(ccNum(y.elims)+ccGalaDelta(y.elims, y.prev && y.prev.elims), L().ccGalaElims)}
      ${ccGalaNum(ccMoney(y.prize)+ccGalaDelta(y.prize, y.prev && y.prev.prize, true), L().ccGalaPrize)}
      ${ccGalaNum(ccNum(y.pr), L().ccGalaPr)}
      ${ccGalaNum(y.best ? '#'+y.best.place : '-', L().ccGalaBest)}
    </div>
    <div class="cc-gala-row"><em>${L().ccGalaOvr}</em><b>${y.ovr} <i>${
      esc(L().ccGalaOvrUp(y.grew))}</i></b></div>
    ${y.prev ? `<div class="cc-gala-hint">${esc(L().ccGalaVsPrev)}</div>` : ''}`;
  if(i===2) return ccGalaYouSlide();
  if(i===3) return `<h4>${L().ccGalaRunsH}</h4>
    ${y.runs.length ? y.runs.map(r=>`<div class="cc-gala-row"><em>${esc(careerRunLabel(r))}</em><b>${
        L().ccBoardPlace(r.place, r.of)}${r.prize ? ' · '+ccMoney(r.prize) : ''}</b></div>`).join('')
      : `<div class="cc-gala-hint">${L().ccGalaRunsNone}</div>`}
    <h4 class="cc-gala-h2">${L().ccGalaAwardsH}</h4>
    ${(y.months.length || (y.goty && y.goty.you))
      ? (y.goty && y.goty.you ? `<div class="cc-gala-row me"><em>${
            esc(L().ccGalaGotyYou)}</em><b>${ccAwIcon('goty')}</b></div>` : '')+
        y.months.map(m=>`<div class="cc-gala-row"><em>${
            esc(L().ccGalaMonthWon(ccMonthName(m.key)))}</em><b>${ccAwIcon('month')}</b></div>`).join('')
      : `<div class="cc-gala-hint">${L().ccGalaAwardsNone}</div>`}`;
  // Номинации сезона — перед игроком года (careerSeasonCatsHTML).
  if(i===4) return careerSeasonCatsHTML() || `<div class="cc-gala-hint">${L().ccGalaAwardsNone}</div>`;
  // Последним — игрок года: ровно та же плитка, что стоит на экране конца
  // сезона, чтобы церемония и хаб не разошлись в числах.
  return careerSeasonAwardHTML() ||
    `<div class="cc-gala-hint">${L().ccGalaAwardsNone}</div>`;
}
function ccGalaDraw(){
  const el=document.getElementById('ccGalaModal');
  if(!el) return;
  const y=ccGalaYear(), i=CC_GALA_STEP, last=i>=CC_GALA_SLIDES-1;
  let dots='';
  for(let k=0;k<CC_GALA_SLIDES;k++) dots+=`<i class="${k===i?'on':''}"></i>`;
  el.innerHTML=`<div class="cc-gala" role="dialog" aria-modal="true">
    <div class="cc-gala-body">
      <div class="cc-gala-head">
        <div><div class="cc-gala-tag">${L().ccGalaDaySub}</div>
          <h3>${esc(L().ccGalaTitle(y.season))}</h3></div>
      </div>
      <div class="cc-gala-slide">${ccGalaSlide(i, y)}</div>
      <div class="cc-gala-dots">${dots}</div>
      <div class="cc-gala-cta">
        ${i>0 ? `<button class="cstrip-btn cstrip-btn-code" onclick="ccGalaGo(-1)">${L().ccGalaBack}</button>` : ''}
        ${i>=1 ? `<button class="cstrip-btn cstrip-btn-code" onclick="ccGalaShare(${y.season})">${L().ccGalaShare}</button>` : ''}
        ${last ? `<button class="cstrip-btn cstrip-btn-go" onclick="ccGalaFinish()">${L().ccNewSeason}</button>`
               : `<button class="cstrip-btn cstrip-btn-go" onclick="ccGalaGo(1)">${L().ccGalaNext}</button>`}
        <button class="cstrip-btn cstrip-btn-code" onclick="ccGalaClose()">${L().ccGalaSkip}</button>
      </div>
    </div>
    <div class="cc-gala-art" style="background-image:url(${CAREER_EV_ART.gala})"></div>
  </div>`;
}
function ccGalaOpen(){
  if(!CAREER || !CAREER.career) return;
  CC_GALA_STEP=0;
  let el=document.getElementById('ccGalaModal');
  if(!el){
    el=document.createElement('div');
    el.id='ccGalaModal';
    el.className='cc-gala-wrap';
    document.body.appendChild(el);
  }
  ccGalaDraw();
}
function ccGalaGo(n){
  CC_GALA_STEP=Math.max(0, Math.min(CC_GALA_SLIDES-1, CC_GALA_STEP+n));
  ccGalaDraw();
}
function ccGalaClose(){
  const el=document.getElementById('ccGalaModal');
  if(el) el.remove();
}
// Церемония кончается тем же, чем кончался экран конца сезона: новым годом.
// Только если сезон ещё не перевёрнут: вдвоём напарник мог уже начать новый, и кнопка церемонии перескакивала главу.
function ccGalaFinish(){ ccGalaClose(); if(CAREER && CAREER.career && CAREER.career.seasonOver) careerNewSeason(); }
function careerSeasonBoardHTML(){
  const cr=CAREER.career;
  const rows=careerBigRuns(cr.season);
  return `<div class="ch-tile cc-board">
    <h4>${L().ccBoardTitle}</h4>
    ${rows.length ? rows.map(r=>`<div class="ch-row"><em>${esc(careerRunLabel(r))}</em><b>${
        L().ccBoardPlace(r.place, r.of)}${r.prize ? ' · '+ccMoney(r.prize) : ''}</b></div>`).join('')
      : `<div class="ch-empty">${L().ccBoardNone}</div>`}
  </div>`;
}
/* What a career amounted to, read out of what it recorded rather than tallied
   as it went — every line below is already in the save, which is why there is
   no honours list kept anywhere: the log is the honours list. */
function careerSummary(){
  const cr=CAREER.career, pl=CAREER.player;
  const log=cr.log||[];
  const by=k=>log.filter(r=>r.kind===k);
  const best=rows=>rows.length ? Math.min.apply(null, rows.map(r=>r.place)) : null;
  const peak=log.reduce((m,r)=>Math.max(m, r.ovr||0), pl.ovr||0);
  const topDiv=log.reduce((m,r)=>Math.min(m, r.div||5), cr.division||5);
  const majors=by('major').filter(r=>r.stage==='final');
  const wf=by('final');
  return {
    seasons: cr.season,
    age: (CAREER.retired && CAREER.retired.age) || ccPlayerAge(),
    peak: Math.round(peak),
    topDiv: topDiv,
    events: log.length,
    wins: log.reduce((n,r)=>n+(r.wins||0), 0),
    earnings: cr.earnings||0,
    wages: cr.wages||0,
    reach: cr.reach||0,
    bestWf: best(wf),
    wfPlayed: wf.length,
    bestMajor: best(majors),
    majorsPlayed: majors.length,
    // The LANs, which the last screen used to leave out entirely. His report,
    // 20 August. Read the same way everything else here is: off the log.
    bestSummit: best(by('summit').filter(r=>r.stage==='final')),
    summitsPlayed: by('summit').filter(r=>r.stage==='final').length,
    bestGlobals: best(by('globals')),
    globalsPlayed: by('globals').length,
    bestGclc: best(by('gclc').filter(r=>r.stage==='final')),
    seats: (cr.ewc||[]).length,
    paris: best(by('rc').filter(r=>r.stage==='final')),
    orgs: (cr.orgs||[]).slice(),
    club: CAREER.org ? CAREER.org.name : null,
    /* What a career leaves behind that a rating cannot say.

       The rating is where you finished; these are the three things a scene
       actually repeats about somebody afterwards. Where you stood on Europe's
       Power Rankings at your best, because that is the public number this sport
       is ranked by. Where the money put you on the all-time board, because that
       is the number a player puts in their own bio. And whether anybody wanted
       to play with you, which is the one the rating is silent about and the one
       a career spends every interview deciding.

       All three are read off tallies the mode already keeps rather than tracked
       from here - a summary should not be the thing that measures. */
    pr: (()=>{ const rows=careerPrRows(); const me=rows.findIndex(r=>r.you);
               return me<0 ? null : {rank:me+1, of:rows.length, pr:rows[me].pr}; })(),
    money: (()=>{ const rows=careerMoneyRows('all'); const me=rows.findIndex(r=>r.you);
                  return me<0 ? null : {rank:me+1, of:rows.length}; })(),
    rep: careerRep(),
    repKey: careerRepKey(),
    streamed: cr.streamed||0,
    rent: cr.rent||0
  };
}

/* GC Last Chance, ~16,900 EU duos in Round 1. From Tracker windows:
   Round 1  3 and 7 Aug   10 matches, kill 1, top 1,000 through
   Round 2  4 and 8 Aug    9 matches, kill 1, top 300 through
   Round 3  5 and 9 Aug   11 matches, kill 2, top 25 through
   Finals   14 Aug         6 matches, kill 4, 50 teams
   Placement ladder is FNCS 2026 (win 65), purse GCLC_PRIZES_BY_REGION ($40,000 1st,
   $400 at 50th). Epic lets the PR top 2,000 skip Round 1; we have no PR, so Div 1
   starts at Round 2. Two qualifiers, the second restarts from Round 1. */
const CC_GCLC=[
  {day:'2026-08-03', q:1, round:1}, {day:'2026-08-04', q:1, round:2},
  {day:'2026-08-05', q:1, round:3},
  {day:'2026-08-07', q:2, round:1}, {day:'2026-08-08', q:2, round:2},
  {day:'2026-08-09', q:2, round:3},
  {day:'2026-08-14', q:0, round:0}          // the Finals
];
// Rounds run in a career-sized lobby the way every other stage does; only the
// last cut is a real count, because 25 of 299 and 25 of 150 mean the same thing
// — the twenty-five who go, and two qualifiers of them fill the Final.
const CC_GCLC_ROUND={
  1:{games:10, kill:1, cut:CAREER_CUP_CUT},
  2:{games:9,  kill:1, cut:CAREER_CUP_CUT},
  3:{games:11, kill:2, cut:25}
};
const CC_GCLC_FINAL={games:6, kill:4, teams:50};
function careerGclcOn(iso){
  const row=CC_GCLC.find(x=>x.day===iso);
  if(!row) return null;
  return {q:row.q, round:row.round, final:row.q===0,
          label: row.q===0 ? L().ccGcFinal : L().ccGcRound(row.q, row.round)};
}
/* Where a career is in it.

   cr.gclc holds the qualifier it is in and the deepest round cleared. A new
   qualifier resets that: the second one is not a continuation of the first, it
   is the same three rounds again for whoever did not get through. A place in the
   Final, once earned, survives both. */
function careerGclcCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, g=cr.gclc||{};
  if(ev.final) return !!g.through;
  if(g.through) return false;                       // already in, nothing to play
  const here = g.q===ev.q ? (g.round||0) : 0;
  if(here>=ev.round) return false;                  // this round is played
  if(ev.round===1) return cr.division!==1;          // Division 1 starts at Round 2
  if(ev.round===2 && here===0) return cr.division===1;
  return here===ev.round-1;
}
// The Last Chance is a regional event too, so it is paid on the career's own
// region rather than on Europe's. See careerPrizeRegion.
function gclcPrize(place){
  const t=(typeof GCLC_PRIZES_BY_REGION!=='undefined' && ccRegionTable(GCLC_PRIZES_BY_REGION)) || null;
  return t ? (t[String(place)]||0) : 0;
}

/* Reload Championship, Paris. Where the twelve EU seats from four Reload cups (three each, cr.ewc) go.
   Format off Liquipedia (docs/superpowers/specs/2026-08-13-ewc-reload-elite-series-design.md):
     Group Stage  40 teams, two groups of 20, 10 maps; top 7 to Finals, 8-17 to Survival, bottom 3 out.
     Survival     the 20 who dropped, 10 maps, 6 through.
     Finals       20 teams, match point: first past 350 who then wins a game; 15 games max.
   Scoring isn't published, so it uses R_PLACEMENT with the Heats' 3 per kill. The real event alternates two islands
   between games; here a run keeps one. */
// The day the Championship opens, so a seat won in February can say what it is
// a seat to rather than sitting in the save until August.
const CC_RC_DAY='2026-08-19';
const CC_RC_GROUP={teams:20, games:10, direct:7, drop:17};
const CC_RC_SURV ={teams:20, games:10, cut:6};
const CC_RC_FINAL={teams:20, games:15, line:350};
const CC_RC_KILL=3;
/* Чем состав опознаётся между этапами одного турнира.

   Не индексом в броске: у разных этапов броски разные, а команда переезжает из
   одного в другой. Ники состава, в нижнем регистре и по алфавиту, — это и есть
   «вот эти двое», и переживает и пересборку объекта, и перезагрузку сейва.
   См. ccRcField и ccMajorFinalRoom. */
function ccSeatKey(t){
  return ((t && (t.squad||t._cards||t.cards)) || [])
    .map(c=>c && c.handle).filter(Boolean)
    .map(h=>String(h).toLowerCase()).sort().join('+');
}
/* Кто сидит в лобби этапа Парижа.
   Париж один турнир в три этапа, а careerSeed сеется календарной неделей, так что careerCupField давал всем трём дням одну двадцатку, и вылетевшие сидели в финале.
   Теперь три воспроизводимых броска, помним только ключи составов (ccSeatKey): A групповой этап, B добор на сёрвайвл, C добор в финал.
   Из A на сёрвайвл 8-17, в финал 1-7, из сёрвайвла в финал топ-6, остальное из B и C. Выбывший не возвращается.
   Добор фиксирован (двадцатка), чтобы B повторялся и финал узнавал прошедших по ключу. Старый сейв без seats играет как раньше.
   Кого записывать, решает раннер (runCareerReloadChampionship). */
/* Сорок пар парижского ЛАНа 2026 года в порядке итогового места.
   Источник — liquipedia.net/fortnite/Reload_Elite_Series/2026 — Esports World Cup 2026, Paris, 19-22 авг.
   По регионам: EU 12, BR 4, NAW 4, ME 4, NAC 8, ASIA 4, OCE 4. */
const RC_TEAMS_2026=[
{p:"1",r:"EU",c:260000,d:["vic0","Malibuca"]},
{p:"2",r:"EU",c:150000,d:["Momsy","SkyJump"]},
{p:"3",r:"EU",c:90000,d:["shxrk","t3eny"]},
{p:"4",r:"EU",c:60000,d:["SwizzY","Pixie"]},
{p:"5",r:"BR",c:45000,d:["Lewa","Romero"]},
{p:"6",r:"EU",c:35000,d:["charyy","Kami"]},
{p:"7",r:"NAW",c:30000,d:["VicterV","Khanada"]},
{p:"8",r:"EU",c:28000,d:["Demus","Darm"]},
{p:"9",r:"EU",c:26000,d:["Faded","Kaan"]},
{p:"10",r:"ME",c:24000,d:["SaLva","Yassen"]},
{p:"11",r:"EU",c:22000,d:["Sky","Scroll"]},
{p:"12",r:"NAC",c:20000,d:["Peterbot","Pollo"]},
{p:"13",r:"EU",c:18000,d:["Tjino","PabloWingu"]},
{p:"14",r:"NAC",c:16000,d:["josh","Eomzo"]},
{p:"15",r:"ASIA",c:15000,d:["Minipiyo","FuuKun"]},
{p:"16",r:"EU",c:14000,d:["Nociff","Izzi"]},
{p:"17",r:"NAC",c:13000,d:["Muz","Sphinx"]},
{p:"18",r:"NAC",c:12000,d:["Cold","Rapid"]},
{p:"19",r:"OCE",c:11000,d:["Goofy","ZDog"]},
{p:"20",r:"NAC",c:10000,d:["Acorn","Boltz"]},
{p:"21",r:"ASIA",c:9500,d:["Koyota","yuma"]},
{p:"22",r:"NAC",c:9000,d:["Bugha","Braydz"]},
{p:"23",r:"BR",c:8500,d:["Night","916Gon"]},
{p:"24",r:"EU",c:8000,d:["Cringe","Volko"]},
{p:"25",r:"OCE",c:7500,d:["Oatley","Spookz"]},
{p:"26",r:"ASIA",c:7000,d:["Mofu","tomat"]},
{p:"27",r:"ME",c:6500,d:["Mshary","5aald"]},
{p:"28",r:"ME",c:6000,d:["Moda","Rew"]},
{p:"29",r:"OCE",c:5500,d:["Vazen","Anon"]},
{p:"30",r:"EU",c:5000,d:["panzer","Japko"]},
{p:"31",r:"BR",c:4500,d:["Edson","Phzin"]},
{p:"32",r:"NAC",c:4000,d:["Shadow","Vergo"]},
{p:"33",r:"NAC",c:3500,d:["Aoxy","Jojofishy"]},
{p:"34",r:"NAW",c:3000,d:["phoenix","Retro"]},
{p:"35-36",r:"ASIA",c:2500,d:["Rainy","Nalu"]},
{p:"35-36",r:"NAW",c:2500,d:["Inact","Salko"]},
{p:"37-38",r:"NAW",c:2250,d:["EpikWhale","PXMP"]},
{p:"37-38",r:"BR",c:2250,d:["axadasz","Seven"]},
{p:"39-40",r:"OCE",c:2000,d:["alex","Wreckless"]},
{p:"39-40",r:"ME",c:2000,d:["Henchman","Snowvaks"]}
];

/* Настоящее поле Парижа: те же сорок пар, что приехали на Esports World Cup.

   Отзыв игрока: ЛАН собирался людьми его же региона, а в жизни это
   один мировой турнир на сорок дуо — двенадцать европейских, восемь из NA
   Central, по четыре из остальных пяти регионов. Пары садятся тем же
   ccLanSeats, что и Саммит с Глобалами, поэтому регион приезжает вместе с парой
   и колонка «Регион» в таблице показывает её собственный, а не регион первой
   карточки.

   Кого нет в карточках — того пропускаем молча: список настоящий, а набор
   карточек своего года, и пара из чужого года просто не находится. Если
   осталось меньше половины, поле строится по-старому броском. */
/* Кэш — по сезону, размеру состава и своему составу (Notion 12.10, Kaizen: «trios and duos in the same
   tournament… still happens sometimes but for reload»). Был один на страницу: зал, собранный в одном сезоне
   (дуо), садился и в трио-сезон, а свой напарник прошлого сезона мог сидеть в зале чужой парой. */
let CC_RC_REAL=null, CC_RC_REAL_KEY='';
function ccRcRealTeams(seated){
  if(ccNowYear()!==2026) return null;
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || {};
  const key=[cr.season||0, careerSquadSize(), Array.from(seated||[]).sort().join('+')].join('|');
  if(CC_RC_REAL_KEY===key) return CC_RC_REAL;
  /* Его слово 12.10: «все турниры от симуляции». Из сорока настоящих пар берутся только КВОТЫ регионов
     (EU 12, NAC 8, по четыре остальным) — сами пары садит симулированный отбор Reload каждого региона
     (ccLanSimSeats 'rc'), в порядке силы, как посев. Настоящий список — запас вне карьеры. */
  const quota={};
  RC_TEAMS_2026.forEach(t=>{ quota[t.r]=(quota[t.r]||0)+1; });
  const room=new Set(seated||[]);
  let built=[];
  const mine=(typeof CAREER!=='undefined' && CAREER && CAREER.career) ? [careerCard()].concat(careerMates()).filter(Boolean) : [];
  Object.keys(quota).forEach(reg=>{
    const got=ccLanSimSeats(reg, ccTeams(quota[reg]), mine, room, 'rc');
    if(got) built=built.concat(got);
  });
  built.sort((x,y)=>(y.pow||0)-(x.pow||0));
  if(built.length<RC_TEAMS_2026.length/2){
    const rows=RC_TEAMS_2026.map(t=>({duo:t.d, reg:t.r}));
    built=ccLanSeats(rows, rows.length, null, new Set(seated||[]));
  }
  CC_RC_REAL=(built.length>=RC_TEAMS_2026.length/2) ? built : null;
  CC_RC_REAL_KEY=key;
  return CC_RC_REAL;
}
function ccRcField(cr, worldCr, drafted, stage, teams){
  const mine=new Set((drafted||[]).map(c=>hKey(c)));
  const real=ccRcRealTeams(mine);
  /* Настоящие сорок пар идут в том порядке, в каком они закончили турнир:
     группа берёт верх списка, сёрвайвл и финал — следующих, мимо уже взятых.
     Без списка (не 2026-й или карточек не хватило) — прежний бросок. */
  const draw=(n, salt, skip)=>{
    if(real){
      const used=new Set((skip||[]).map(c=>hKey(c)));
      return real.filter(t=>!((t.squad||[]).some(c=>used.has(hKey(c))))).slice(0, n);
    }
    return ccAsWorld(()=>careerCupField(worldCr,
      drafted.concat(skip||[]), n, salt, false, CC_FIELD_SHARP.globals));
  };
  const cards=t=>(t && (t.squad||t._cards||t.cards)) || [];
  // Соло-год: в группе 40 одиночек вместо 20 пар (ccTeams), иначе к двадцати ботам добавлялся ты, и выходил 21.
  const A=draw(Math.max(CC_RC_GROUP.teams, ccTeams(CC_RC_GROUP.teams)), null, null);
  /* Групповой этап играем в комнате этого сезона, обрезанной до размера этапа.
     В трио ccTeams(20) = 13, а сюда приходило 20 команд, движок резал их на два
     лобби, и каждая игра давала две победы (20 Виктори за 10 игр). Противоречило
     и правилу «ЛАН целиком в одно лобби». В дуо срез берёт все 19 строк.
     Остальные этапы уже считали по teams, см. need ниже. */
  if(stage==='group') return A.slice(0, Math.max(0, (teams||CC_RC_GROUP.teams)-1));
  const seenA=[].concat(...A.map(cards));
  const B=draw(Math.max(CC_RC_SURV.teams, ccTeams(CC_RC_SURV.teams)), 'rcSurv', seenA);
  const want=(cr.rc && cr.rc.seats && cr.rc.seats[stage]) || null;
  const room = stage==='survival' ? A : A.concat(B);
  /* B — вторая группа (полный прогон 9.10, check-career-rc-stages: в 2026-м из сорока настоящих пар мимо обеих групп
     не оставалось никого, и финал садился из двенадцати вместо двадцати). Её прямые путёвки едут в финал, остальные —
     на сёрвайвл, как на настоящем ЛАНе; свежий бросок — только добор сверху. */
  const bDirect=ccTeams(CC_RC_GROUP.direct);
  const fill = stage==='survival' ? B.slice(bDirect).concat(B.slice(0, bDirect))
             : B.slice(0, bDirect).concat(draw(CC_RC_FINAL.teams, 'rcFinal', seenA.concat([].concat(...B.map(cards)))), B.slice(bDirect));
  /* И здесь комната этого сезона, по той же причине, что этажом выше: без
     сохранённых мест keep — это весь бросок A, то есть двадцать дуо, а лобби
     сёрвайвла в трио тринадцать. need при этом уходил в ноль (двадцать уже
     больше тринадцати), добора не было, и вечер тихо разъезжался на два лобби
     с двумя победами за игру. Сторож — tools/check-career-rc-lobby.js. */
  const room1=Math.max(0, (teams||CC_RC_FINAL.teams)-1);
  const keep = (want ? room.filter(t=>want.indexOf(ccSeatKey(t))>=0) : A.slice()).slice(0, room1);
  const need=Math.max(0, room1-keep.length);
  return keep.concat(fill.filter(t=>keep.indexOf(t)<0).slice(0, need));
}
/* A Paris stage, counted in this season's teams.

   Twenty duos is a Reload lobby, and a Reload lobby is forty players — so a trio
   season plays the same room thirteen teams wide, with the group's two lines
   moving with it. ccScaleStage does the same job for the tables that name their
   field `field`; this one knows Paris's own names. `games` and `line` are not
   team counts and are left alone. */
function ccRcStage(st){
  if(!st) return st;
  const out=Object.assign({}, st);
  ['teams','direct','drop','cut'].forEach(k=>{ if(out[k]!=null) out[k]=ccTeams(out[k]); });
  return out;
}
/* The published purse, place by place. It steps: a thousand a place from
   fifteenth to twentieth, five hundred a place to thirtieth, then the tail. */
/* Награда MVP — сверх таблицы призовых: на настоящем ЛАНе 2026 года это
   $25 000 (Liquipedia, Reload Elite Series/2026). */
const CC_RC_MVP=25000;
function rcPrize(place){
  const top=[260000,150000,90000,60000,45000,35000,30000,28000,26000,24000,
             22000,20000,18000,16000,15000];
  if(place<=15) return top[place-1]||0;
  if(place<=20) return 15000-(place-15)*1000;
  if(place<=30) return 10000-(place-20)*500;
  if(place<=34) return [4500,4000,3500,3000][place-31];
  if(place<=36) return 2500;
  if(place<=38) return 2250;
  if(place<=40) return 2000;
  return 0;
}
function rcPoints(place){
  const t=R_PLACEMENT.r4;
  return place<=t.length ? t[place-1] : 0;
}
const CC_RC_ORDER=['group','survival','final'];
// Which day of the Paris block this is. The row is four days end to end; the
// tournament is three stages, so they sit on the first three.
function careerRcOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='gc' &&
        String(x.id||'')==='ReloadChampionshipParis');
  if(!e) return null;
  const row=ccYearRows().find(r=>r[2]==='ReloadChampionshipParis');
  if(!row) return null;
  let i=0;
  for(let d=row[0]; d<iso; d=ccAddDays(d,1)) i++;
  const stage=CC_RC_ORDER[i];
  return stage ? {stage:stage, label:e.label} : null;
}
function careerRcCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, rc=cr.rc;
  if(ccGaveUp('rc')) return false;
  if(rc && CC_RC_ORDER.indexOf(rc.got)>=CC_RC_ORDER.indexOf(ev.stage)) return false;
  // A seat is the entry, and the Reload finals are the only place one comes from.
  // Место этого сезона, а не прошлогоднее. См. ccRelMySeats.
  if(ev.stage==='group')    return !!ccRelMySeats(cr).length;
  if(ev.stage==='survival') return !!(rc && rc.got==='group' && rc.dropped);
  if(ev.stage==='final')    return !!(rc && rc.ticket);
  return false;
}
/* Match point.

   Nothing in this app has ever scored a run that stops early. The games are
   simulated the ordinary way and the stopping rule is applied afterwards, off
   each team's own per-game log: walk the games in order, keep every team's
   running total, and the first game whose winner was already past the line ends
   the tournament. Every score is then read as it stood at that game, which is
   exactly the table Epic would have printed — the games after it were never
   played. */
function rcMatchPoint(teams, line){
  const n=Math.max.apply(null, teams.map(t=>(t.stageLog||[]).length));
  const run=new Map();
  teams.forEach(t=>run.set(t, 0));
  for(let g=0; g<n; g++){
    let champ=null;
    teams.forEach(t=>{
      const e=(t.stageLog||[])[g];
      if(!e) return;
      const before=run.get(t);
      run.set(t, before+(e.pts||0));
      if(e.place===1 && before>=line && !champ) champ=t;
    });
    if(champ){
      const at=g+1;
      return {champ:champ, games:at,
              score:teams.map(t=>({team:t,
                pts:(t.stageLog||[]).slice(0,at).reduce((s,e)=>s+(e.pts||0),0)}))};
    }
  }
  return {champ:null, games:n,
          score:teams.map(t=>({team:t, pts:t.stagePts||0}))};
}

/* The Major, numbers from Tracker's FNCS Major 2 Europe pages.
   Placement ladder as in the Weekly Final (VR 9, 2–5 +4, 6–25 +2, win = 65), except a Heats VR is 944:
   Epic's instant qualification, a heat win is 1,000.
     Play-In  D1 only, 22 matches, kill 2, 150 of 848 EU duos go to Heats.
     Heats    3 groups, 5 matches, kill 3, top 10 per group plus any game winner.
     LCQ      all divisions, two sessions cut to 50, then a 4-match Last Chance Lobby, each winner a ticket.
     Finals   50 duos, 12 matches, kill 4, PRIZE_TABLES.EU ($120,000 first).
   Play-In runs at full size (CC_MAJOR_PI_FIELD); later stages use the cup/Reload compression. */
const CC_MAJOR_HEAT_VR=944;
/* Число хитов по региону. У Epic три хита только в Европе и NA Central (150 из плей-ина, змейка, 45 дальше),
   в остальных пяти два хита по 50, отбор 100, проходят 46. Тот же раскол, что DEEP_MAJOR_REGIONS в majorFormat.
   Карьера играет свой хит, но поле собирает на все, иначе весь верх региона садился в её комнату. */
function ccMajorHeats(){ if(ccIs2025()) return 3; return DEEP_MAJOR_REGIONS.has(ccCareerRegion()) ? 3 : 2; }
/* Один хит: сколько в нём игр и сколько из него проходит.

   Глубокий регион — пять игр, топ-15 (игрок, 26 августа: «in duos its top
   15 not top 10»). Остальные — пять игр и топ-23, кроме одного места: в
   Мейджоре 1 у Океании, Азии и Ближнего Востока второй хит шёл ШЕСТЬ игр, и
   проходило из него двадцать четыре. Это не подгонка под сумму — у Ближнего
   Востока Ласт Ченс Мейджора 1 дал ровно трёх победителей, и 47+3 остаётся
   единственным, что складывается в полсотни мест финала. Числа те же, что у
   majorFormat: один турнир — одна сетка, где бы её ни спрашивали.

   Номер хита известен только после посева, поэтому по умолчанию отвечает за
   первый; свой номер раннер подставляет сам. См. runCareerMajor. */
function ccMajorHeat(n, heatNo){
  const reg=ccCareerRegion();
  // 2025: групповой этап — пять игр, топ-10 группы: пять побед (944 очка ставят их наверх) и пять по очкам; счёт уже в трио (raw).
  if(ccIs2025()) return {games:CC_MAJOR_STAGE_2025.group.games, cut:CC_MAJOR_STAGE_2025.group.cut, raw:true};
  if(DEEP_MAJOR_REGIONS.has(reg)) return {games:5, cut:15};
  const six = (n===1 && heatNo===2 &&
               (reg==='OCE' || reg==='ASIA' || reg==='ME'));
  return six ? {games:6, cut:24} : {games:5, cut:23};
}
// The FNCS 2026 ladder, shared by every stage that is not the Heats. wfPoints is
// this curve; it was written for the Weekly Final and the Major uses the same one.
function majorPoints(place){ return wfPoints(place); }
function majorHeatPoints(place){
  // 944 replaces the win step, and everything below it is unchanged: the Heats
  // pay their own Victory Royale on top of what second place is worth, which is
  // 56 in duos and 54 in trios. Read rather than typed, so the trio ladder does
  // not quietly pay a duo second place. See wfPoints.
  return place===1 ? CC_MAJOR_HEAT_VR+wfPoints(2) : wfPoints(place);
}
/* The Last Chance is the one stage of a Major that anybody can enter.

   His screenshot, 17 August: the career's Last Chance was running 150 teams over
   four games, which is the Play-In's room and the lobby's game count wearing the
   wrong label. Every division plays this one — that is what makes it the back
   door — so the room is the whole ladder the opens draw, the same 2,480 duos a
   Victory Cup seats, and the qualifier is eleven games to a top fifty. The four
   games belong to what comes after it: the Last Chance Lobby, where the fifty
   who came through play for the ticket and only a win is worth anything.

   Which is Epic's own shape, and the draft mode already had it written down —
   lcqQualTitle says "11 games, top 50 advance" on the other side of this file. */
const CC_MAJOR_LC_GAMES=11, CC_MAJOR_LC_LOBBY_GAMES=5;   // Liquipedia 2026: «Teams have 5 set-lobby games» (было 4; сверка 7.10)
/* ЛОББИ ПОСЛЕДНЕГО ШАНСА — КТО БЕРЁТ МЕСТА (сверка с Liquipedia 7.10). 2026, Мейджор 1: «Scoring based on placement and
   eliminations… The top 5 teams qualify» — по очкам; Мейджор 2 и 2025-й: «Each Victory Royale qualifies a team» /
   «the winner of each game qualifying» — победы, победитель уходит. Мир и твой неудачный LCQ играют лобби так же,
   а не отдают места топу таблицы LCQ, как было. */
function ccLcByPoints(ev){ return !ccIs2025() && !!ev && ev.n===1; }
function ccLcLobbyGames(){ return ccIs2025() ? CC_MAJOR_STAGE_2025.lclobby.games : CC_MAJOR_LC_LOBBY_GAMES; }
/* Сколько мест даёт лобби по очкам — «The top 5 teams qualify», ровно пять. Считалось остатком зала (финал минус
   записанные), а победители хитов проходят СВЕРХ отсечки, и остаток падал до одного: Notion 25.10, #2 лобби с 241
   очком — «пас де тикет». */
function ccLcLobbySeats(ev, need){ return ccLcByPoints(ev) ? ccTeams(ccLcLobbyGames()) : need; }
function ccLcLobbySim(lobby, ev, kill){
  lobby.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  if(ccLcByPoints(ev)) simulateGames(lobby, ccLcLobbyGames(), majorPoints, kill);
  else simulateGamesStopOnWin(lobby, ccLcLobbyGames(), victoryR2Points, 0);
}
function ccLcLobbySort(lobby, ev){
  return lobby.slice().sort(ccLcByPoints(ev) ? ((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.stageElims||0)-(a.stageElims||0))
                                             : ((a,b)=>(b.wins||0)-(a.wins||0) || (b.stagePts||0)-(a.stagePts||0)));
}
function ccLcLobbyPick(lobby, need, ev){ return ccLcLobbySort(lobby, ev).slice(0, need); }
/* Плей-Ин в настоящей комнате: по Tracker в EU 848 команд, 22 матча, килл за 2, в Хиты 150. Сжатая версия (150
   с отсечкой 50) по доле была даже мягче (33% против 17.7%), но число на экране не совпадало с Epic.
   Цена: 848 команд собираются за 92 мс, 22 матча за 1.3 с (сжатая 0.4 с); Ласт Чанс уже крутит 2480 за 3.8 с.
   Хиты не трогаем: у Epic три группы по 50 с топ-10 из каждой, 50 с отсечкой 10 это одна группа, в которой играет
   карьера. */
/* Комната Плей-Ина: только те, кто в дивизионе 1, в Д1 ничего не выдумывается (см. ccD1FillOvr).
   С числами Epic (150 из 848) 641 место занимали придуманные: ниже по карточкам (77.6 против 82), но с полным ролевым
   бонусом от ccSquadCastRoles (4 против 1.57), то есть сильнее настоящих. Комната читается, как у Ласт Чанса
   (careerLadderEntrants).
   Отсечка = число мест в хитах, не доля: 17.7% от 300 пар дают 53 при одной комнате хитов на 50, и трое «проходят»,
   но не садятся. Обе стадии идут через ccScaleStage, в трио уменьшаются вместе.
   У Epic Плей-Ин раздаёт три комнаты хитов по 50, здесь одна. */
function careerD1Entrants(){
  const n=(careerPools().duos||[]).length;
  return Math.max(2, n+1);
}
const CC_MAJOR_STAGE={
  playin:{games:22, kill:2, pts:majorPoints,
          /* Комната Плей-Ина — не только записанные дуо дивизиона 1.

             Их сто семьдесят четыре, и когда отсечка стала честной (сто
             пятьдесят во все три хита), проходить стало 86% комнаты — это уже
             не отбор. У Epic Плей-Ин открыт всему региону, и сто пятьдесят
             выходят из тысяч. Поэтому комната достраивается лестницей до трёх
             хитовых полей на каждое место в хитах: реальные имена сидят
             первыми (careerCupField сажает их до лестницы), дальше — ладдер.
             Проход возвращается к трети, как и был до правки хитов.

             Цена замерена: 174 команды — 0.37 с, 520 — 0.65 с на десктопе,
             и Плей-Ин всё равно считается без показа. */
          get field(){ return Math.max(careerD1Entrants(),
                                       CC_MAJOR_STAGE.heats.field*ccMajorHeats()*3); },
          /* Плей-Ин отбирает во ВСЕ хиты, а не в один.

             Мой же регресс от 25 августа: комната хитов стала одной из трёх
             (см. ccMajorHeats — правка «в первом хите всегда все сильные»),
             а отсечка Плей-Ина по-прежнему читала размер ОДНОЙ комнаты и
             пускала дальше пятьдесят вместо ста пятидесяти. Игрок поймал
             это в ту же ночь: «плей ин мажора квал в хиты топ 50 почему-то
             вместо топ 150 остался». У Epic из плей-ина выходят сто пятьдесят
             и делятся змейкой на три хита — ровно это здесь и написано. */
          /* Считается в командах СЕЗОНА, а не в дуо, — отсюда cutScaled.

             Порядок округления решал одну команду: ccTeams(50×3) — это сто, а
             мест в трёх трио-хитах 3×ccTeams(50) = девяносто девять. Сотый
             проходил в этап, где для него не было стула. Правило записано
             строкой выше и в playInSeats режима драфта одинаково: плей-ин
             отбирает столько, сколько хиты могут посадить. */
          cutScaled:true,
          get cut(){ return ccTeams(CC_MAJOR_STAGE.heats.field)*ccMajorHeats(); }},
  /* Из хита проходят 15, не 10: так в драфте (majorFormat, Европа, три хита,
     cut:15), и «45 с хитов + 5 с LCQ» сходится только с 15. В трио ccTeams даёт
     15x2/3 = 10. 15 это отсечка глубокого региона, у остальных пяти два хита по 23
     (ccMajorHeat). Здесь геттеры, потому что регион известен только в рантайме;
     они про первый хит, номер своего раннер подставляет после посева. */
  heats :{kill:3, field:50, pts:majorHeatPoints,
          get games(){ return ccMajorHeat(0, 1).games; },
          get cut(){ return ccMajorHeat(0, 1).cut; }},
  // Read rather than typed, because the ladder's size is read rather than typed.
  lcq   :{games:CC_MAJOR_LC_GAMES, kill:2, cut:CAREER_CUP_CUT, pts:majorPoints,
          get field(){ return careerLadderEntrants(); }},
  final :{games:12, kill:4, field:50,               cut:0,              pts:majorPoints}
};
const CC_MAJOR_DAY={PlayIn:'playin', Heats:'heats', LCQ:'lcq', LCLobby:'lclobby', Final:'final'};
// Лобби последнего шанса — своя стадия только в 2025-м; в 2026-м оно идёт в день LCQ.
const CC_MAJOR_ORDER=['playin','heats','lcq','lclobby','final'];
/* Числа стадии — по году. 2025-й: плей-ин двадцать игр (два дня по десять,
   одной сессией — упрощение), отсечка 99 трио как есть; LCQ десять игр и 33
   трио; лобби три игры, победа — билет; финал двенадцать игр. Отсечки 2025-го
   уже в трио, поэтому cutScaled — чтобы ccScaleStage их не резал ещё раз. */
// Showdown 2025 — Мейджоры с номером 4 и выше (см. careerMajorOn).
function ccMajorIsShowdown(n){ return ccIs2025() && n>=4; }
// Лобби последнего шанса своим днём — только у настоящих Мейджоров 2025-го.
function ccMajLc2025(ev){ return ccIs2025() && !!ev && !ccMajorIsShowdown(ev.n); }
function ccMajorStageSpec(stage, n){
  const base=CC_MAJOR_STAGE[stage] || (stage==='lclobby' ? CC_MAJOR_STAGE.lcq : null);
  if(!ccIs2025()) return base;
  if(ccMajorIsShowdown(n)){
    // Раунд 1 — дивизионы 1–2 региона, десять игр, топ-33; раунд 2 — шесть игр на 33 трио.
    // Поля — в дуо-счёте, как вся таблица: ccScaleStage переведёт 450 → 300 и 50 → 33 трио.
    if(stage==='lcq')   return Object.assign({}, base, {games:10, cut:33, cutScaled:true, field:450});
    if(stage==='final') return Object.assign({}, base, {games:6, field:50});
    return base;
  }
  const y=CC_MAJOR_STAGE_2025;
  if(stage==='playin') return Object.assign({}, base, {games:y.playin.games*y.playin.days, cut:y.playin.cut, cutScaled:true});
  if(stage==='lcq')    return Object.assign({}, base, {games:y.lcq.games, cut:y.lcq.cut, cutScaled:true});
  if(stage==='lclobby')return {games:y.lclobby.games, kill:0, pts:victoryR2Points, cut:0, field:y.lcq.cut, cutScaled:true};
  if(stage==='final')  return Object.assign({}, base, {games:y.final.games*y.final.days});
  return base;
}
// Комната лобби последнего шанса 2025-го — те, кто прошёл вчерашний LCQ.
function ccMajorLcRoom(you, ev){
  const cr=CAREER.career, lc=cr.majorLc;
  if(!lc || lc.n!==ev.n || lc.season!==cr.season) return [you];
  const room=lc.rows.map(r=>r==='you' ? you : ccMajorTeamFrom(r)).filter(Boolean);
  /* Своя строка в записи могла не лечь (гонка 2025, 20.10: лобби 13.02 упало «you.stageLog is not iterable» —
     своей команды в комнате не было, и прогон её не завёл). Сам вечер открыт тем, кто прошёл, — значит, свой там
     есть: садится последним, как в хите (см. ccMajorRoom). */
  if(room.indexOf(you)<0){ if(room.length) room[room.length-1]=you; else room.push(you); }
  return room;
}

/* ---- Мейджор 2024-го: своя машина --------------------------------------------
   Формат — см. CAREER_YEAR_2024. Состояние живёт в cr.major24 (по номеру Мейджора и
   сезону): got — сыгранные дни; q[1|2].r1/r2 — прошедшие раунды квалификатора
   (строки посева, 'you' — свой состав); series — очки серии по ключу состава,
   seriesRows — как его посадить; upper/lower — сетки полуфинала (rows — комната
   первого дня, r1/r2/r3 — прошедшие каждого дня, tickets — победители матчей
   верхней сетки, rest — не прошедшие третьего дня); bracket — своя сетка;
   ticket — место в финале. Своя сетка играется вживую, чужая — тем же вечером
   молча (ccM24Settle), и то, чего игрок не доиграл, досчитывается перед финалом. */
/* ---- СЧЁТ 2024-го — ТАБЛИЦА EPIC ТОГО ГОДА ---------------------------------

   FNCS 2024: Victory Royale 65, второе 56, третье 52, пятое 44, двадцать пятое
   2, и четыре очка за элим. Это ровно та лестница, что лежит в PLAYIN_STEPS
   («9 + 4×4 + 2×20 = 65»), поэтому она читается оттуда, а не переписывается
   рядом третьей копией. До этой правки Мейджор 2024-го считался таблицей
   2026-го (majorPoints → wfPoints) и платил за элим два на квалификаторах.

   Второй день — ×1.5 на всё: VR 100, второе 84, третье 78, элим 6. Их и
   печатал лидерборд Форт-Уэрта. Какая игра идёт, знает только сам прогон,
   поэтому день ставит dropEachGame (он зовётся раз на игру), а читают его
   ccM24PointsGf и ccM24KillGf. */
const CC_M24_KILL=4, CC_M24_DAY2=1.5, CC_M24_DAY1_GAMES=6;
/* Квалификаторы 2024-го — два за элим: правила Epic S28–S30 FNCS_Major*_Qualifier1/2 (kill 2),
   а полуфиналы и Гранд-финалы — четыре (аудит 29.09 по CC_CUP_SCORE). Лестница мест та же. */
const CC_M24_KILL_Q=2;
let CC_M24_GAME=0;
function ccM24Day(){ return (CC_M24_GAME>CC_M24_DAY1_GAMES) ? CC_M24_DAY2 : 1; }
/* Таблица ДУО, а не текущего состава: 2024-й играется в дуо весь год, и
   спрашивать про это ambient squadSize незачем — он в этот момент может быть
   ещё сквадным (по умолчанию страницы), и тогда второе место читалось бы 42
   вместо 56. playInPointsForPlace как раз через squadSize и ходит. */
function ccM24Points(place){
  const t=PLAYIN_TABLE[2];
  return place<=t.length ? t[place-1] : 0;
}
function ccM24PointsGf(place){
  const d=ccM24Day();
  if(d===1) return ccM24Points(place);
  /* Второй день — ×1.5 на всё: второе 56→84, третье 52→78, элим 4→6. Кроме
     победы: 65×1.5 это 97.5, а лидерборд Форт-Уэрта печатал ровную сотню —
     Epic округлил её вверх, и бонус за Victory Royale во второй день выходит
     16 вместо девяти. */
  return (place===1) ? 100 : Math.round(ccM24Points(place)*d);
}
function ccM24KillGf(){ return CC_M24_KILL*ccM24Day(); }
/* Настоящее поле открытого квалификатора — та же измеренная лестница региона,
   которой читаются опены круга Reload (CC_LADDER_TRUE, 9 766 дуо). Карьера
   играет её ВЫБОРКОЙ (careerLadderEntrants), поэтому отсечка переводится в
   комнату, а место читается в настоящем размере — правило и помощники те же,
   что у опенов: ccStretchTo. */
const CC_M24={
  /* Отсечки квалификатора: форма Epic, размер нашей лестницы. Epic 2024, 10 матчей в раунде:
     EU и NAC 2000 → 1000 → 250 (четвёртый за серию), малые регионы 1000 → 250 (третий за серию).
     Малые у нас так же, глубокие 1000 → 500 → 250: лестница 2 360 дуо (CC_CUP_ENTRANTS, ради скорости,
     5000 дуо считались 7.2 с), и 2000 первым шагом сделало бы первый раунд бесплатным. Кончаться обязано на 250:
     полуфинал настоящего размера, 50 дуо в верхней сетке и 200 в нижней. Последний раунд без отсечки, он за серию. */
  q:    {1:{games:10, cut:1000, open:true}, 2:{games:10, cut:250}, 3:{games:10, cut:0}},
  /* Верхняя сетка не выбивает, а роняет в нижнюю: «Duos that place 26th-50th in Upper Rounds 1 and 2 will be
     relegated to Lower Rounds 2 and 3».
     keep: сколько остаётся наверху под билетчиками; остальные падают в день нижней с номером +1.
     Каждый день верхней 50 команд (Liquipedia, 2024 Major 1 Europe: Upper Round 1-3 и Lower Round 3, team_number=50).
     Места 1-25 без билетчиков остаются, 26-50 падают, пустые места верхней добирают лучшие нижней (ccM24Promo).
     Финал: до 5 + до 5 билетов, топ-25 третьего дня верхней, топ-15 нижней. */
  upper:{1:{games:5, vr:true, cut:0, keep:25}, 2:{games:5, vr:true, cut:0, keep:25}, 3:{games:3, cut:25}},
  lower:{1:{games:10, cut:100}, 2:{games:6, cut:50}, 3:{games:3, cut:15}},
  final:{games:12, cut:0, field:50},
  qDeep:{2:{games:10, cut:500}, 3:{games:10, cut:250}},
  upperSize:50, lowerSize:200, vrSeats:5
};
/* Карьера, у которой неделя стоит на первом квалификаторе ЭТОГО Мейджора.

   Не сама карьера, а её копия: seedWeek читает только careerSeed, и ничего,
   кроме броска комнаты, от неё не зависит. Нет строки в календаре (чужой
   сейв) — возвращается карьера как есть, и вечер играется как играл. */
function ccM24OpenCr(cr, n){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2024_Q1R1');
  if(!row) return cr;
  return Object.assign({}, cr, {seedWeek: careerWeekIndex(row[0])});
}
// Третий день полуфинала у Мейджоров 2 и 3 — «3 hours and 5 games limit» (у Мейджора 1 — «3 games»). Сверка 7.10.
function ccM24SemiSpec(n, bracket, r){ const sp=CC_M24[bracket][r]; return (r===3 && n>=2) ? Object.assign({}, sp, {games:5}) : sp; }
/* Очки серии квалификатора 2024-го (Liquipedia, сверка 7.10): 625, 600, дальше минус 5 — до 21-го (505) таблица
   опубликована; ниже её нет, и дальше своя оценка: минус 1 за место (250-е — 276), чтобы весь зал различался. */
function ccM24SeriesPts(p){ return p<=1 ? 625 : p<=21 ? 600-5*(p-2) : Math.max(1, 505-(p-21)); }
function ccM24Deep(){ return DEEP_MAJOR_REGIONS.has(ccCareerRegion()); }
function ccM24Spec(ev){
  /* Третий вечер квалификатора — очки серии в любом регионе: у глубоких это
     четвёртый раунд по счёту (суббота играется двумя подряд), у остальных
     третий. Отсечки у него нет ни там, ни там. */
  if(ev.stage==='q'){
    const sp=(ev.r===2 && ccM24Deep()) ? CC_M24.qDeep[2] : CC_M24.q[ev.r];
    // Мейджор 3: последний раунд квала — «6 set-lobby games» (Liquipedia, сверка 7.10), у 1 и 2 — десять.
    return (ev.n===3 && sp && !sp.cut && !sp.open) ? Object.assign({}, sp, {games:6}) : sp;
  }
  if(ev.stage==='semi'){ const m=ccM24Of(ev.n); return ccM24SemiSpec(ev.n, (m && m.bracket) || 'upper', ev.r); }
  return CC_M24.final;
}
function ccM24Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major24;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM24State(n){
  const cr=CAREER.career;
  let m=ccM24Of(n);
  if(!m) m=cr.major24={n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, youKey:null,
                       upper:null, lower:null, bracket:null, built:false, ticket:false};
  return m;
}
// Первый день полуфинала этого Мейджора — до него сетки не строятся.
function ccM24SemiDay(n){ const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2024_Semi1'); return row ? row[0] : null; }
/* Сетки — из таблицы серии: топ-50 в верхнюю, 51–250 в нижнюю. Строится раз, когда
   полуфинал уже на календаре (careerMajorCan спрашивает про будущие дни тоже). */
function ccM24Brackets(m){
  if(!m || m.built) return;
  const day=ccM24SemiDay(m.n);
  if(!day || careerToday()<day) return;
  /* В сетку садятся люди, а не строки таблицы. Правило Epic 2024: «qualified players for FNCS Semi-Finals can duo with any other qualified player (Upper with Upper, Lower with Lower)».
     Между квалификаторами состав можно сменить, и человек стоит в таблице серии дважды.
     Идём сверху: свободны оба, пара садится целой. Свободен один: половинка уходит в очередь и садится с ближайшей такой же.
     Без этого в полуфинале один и тот же игрок сидел дважды. */
  const taken=new Set(), rows=[];
  const hOf=c=>hKey((c && c.h) || c);
  let half=null;
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>{
    const row=m.seriesRows[k]; if(!row) return;
    const faces=String(k).split('+').filter(Boolean);
    // Своя строка — свой состав, и он не пересобирается: карьера играет вдвоём.
    if(row==='you'){
      if(faces.some(h=>taken.has(h))) return;
      faces.forEach(h=>taken.add(h));
      rows.push('you');
      return;
    }
    const seats=Array.isArray(row) ? row : [row];
    const free=seats.filter(c=>!taken.has(hOf(c)));
    if(!free.length) return;
    free.forEach(c=>taken.add(hOf(c)));
    if(free.length===seats.length){ rows.push(row); return; }
    free.forEach(c=>{ if(half){ rows.push([half, c]); half=null; } else half=c; });
  });
  m.upper={rows:rows.slice(0, CC_M24.upperSize), tickets:[]};
  m.lower={rows:rows.slice(CC_M24.upperSize, CC_M24.upperSize+CC_M24.lowerSize)};
  const at=rows.indexOf('you');
  m.bracket = at<0 ? null : at<CC_M24.upperSize ? 'upper' : at<CC_M24.upperSize+CC_M24.lowerSize ? 'lower' : null;
  m.built=true;
}
function ccM24SeriesRank(m, key){
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
const ccM24Rank=f=>f.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0));
/* Записать день сетки по его таблице. Верхняя сетка, дни 1–2: победители матчей —
   в билеты (не больше пяти, у Epic пять игр — пять билетов), остальные дальше;
   день 3 — топ-25. Нижняя: топ-100 → топ-50 → топ-15. */
function ccM24Write(m, bracket, r, ranked, you){
  const br=m[bracket]; if(!br) return;
  const row=t=>ccSeedRow(t, you, ccMajorSeatRow);
  const sp=ccM24SemiSpec(m.n, bracket, r);
  if(sp.vr){
    const winners=[]; const seen=new Set();
    ranked.forEach(t=>{ if((t.wins||0)>0 && winners.length<CC_M24.vrSeats && !seen.has(t)){ seen.add(t); winners.push(t); } });
    br.tickets=(br.tickets||[]).concat(winners.map(row));
    // Остаются места 1..keep по таблице дня (билетчики уходят в финал), ниже — вниз, днём позже.
    const keep=(sp.keep!=null) ? sp.keep : ranked.length;
    br['r'+r]=ranked.slice(0, keep).filter(t=>!seen.has(t)).map(row);
    br.down=br.down||{};
    br.down[r+1]=ranked.slice(keep).filter(t=>!seen.has(t)).map(row);
    return winners;
  }
  br['r'+r]=ranked.slice(0, sp.cut).map(row);
  if(r===3) br.rest=ranked.slice(sp.cut).map(row);
  return ranked.slice(0, sp.cut);
}
/* Комната дня НИЖНЕЙ сетки: прошедшие её вчерашнего дня плюс те, кого верхняя
   уронила этим утром (ccM24Write, br.down). Первый день нижней — только её
   собственный посев: ронять ещё некому. */
function ccM24LowerRoom(m, r){
  const br=m && m.lower; if(!br) return [];
  if(r===1) return br.rows||[];
  const up=new Set(ccM24Promo(m, r-1).map(x=>x==='you' ? 'you' : JSON.stringify(x)));
  const prev=(br['r'+(r-1)]||[]).filter(x=>!up.has(x==='you' ? 'you' : JSON.stringify(x)));
  const down=(m.upper && m.upper.down && m.upper.down[r])||[];
  return prev.concat(down);
}
/* Подъём из нижней: пустые места верхней на день r+1 (до upperSize) — лучшие
   прошедшие нижнюю в день r. Оба дня r должны быть записаны; нет — подъёма нет. */
function ccM24Promo(m, r){
  if(!m || !m.upper || !m.lower || r>=3) return [];
  const stay=m.upper['r'+r], low=m.lower['r'+r];
  if(!stay || !low) return [];
  return low.slice(0, Math.max(0, CC_M24.upperSize-stay.length));
}
// Комната дня r своей сетки — одна для игрока, для «Играть» и для молчаливого досчёта.
function ccM24Room(m, bracket, r){
  const br=m && m[bracket]; if(!br) return [];
  if(r>1){ ccM24Settle(m, 'upper', r-1); ccM24Settle(m, 'lower', r-1); }
  if(bracket==='lower') return ccM24LowerRoom(m, r);
  if(r===1) return br.rows||[];
  return (br['r'+(r-1)]||[]).concat(ccM24Promo(m, r-1));
}
// Досчитать день сетки молча — чужую сетку, или свою, если игрок из неё выбыл.
function ccM24Settle(m, bracket, r){
  const br=m[bracket]; if(!br) return;
  if(r>1) ccM24Settle(m, bracket, r-1);
  if(br['r'+r]) return;
  // День, в котором игрок ещё не сыграл, молча не досчитывается — его посев в нём живой.
  const day=(ccYearRows().find(x=>x[2]==='Major'+m.n+'_2024_Semi'+r)||[])[0];
  if(day && careerToday()<day) return;
  const prev=ccM24Room(m, bracket, r);
  // Не явившийся на свой день — выбыл: посева 'you' в молчаливой комнате нет.
  const room=prev.filter(x=>x!=='you').map(ccMajorTeamFrom);
  if(!room.length){ br['r'+r]=[]; if(r===3) br.rest=[]; return; }
  const sp=ccM24SemiSpec(m.n, bracket, r);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  // Дни верхней с билетом за победу: победитель уходит, как в живом вечере (stopOnWin), — иначе бот брал две победы.
  (sp.vr ? simulateGamesStopOnWin : simulateGames)(room, sp.games, ccM24Points, CC_M24_KILL);
  ccM24Write(m, bracket, r, ccM24Rank(room), null);
}
/* Финал — пятьдесят: билеты верхней сетки, топ-25 её третьего дня, топ-15 нижней;
   недобор — из оставшихся верхней, потом нижней. null — Мейджор без записи
   (игрок в него не заходил): мир соберёт финал сам, из лестницы. */
function ccM24GfRows(m){
  if(!m || !m.built || !m.upper || !m.lower) return null;
  ccM24Settle(m, 'upper', 3); ccM24Settle(m, 'lower', 3);
  const out=[], seen=new Set();
  const key=r=>r==='you' ? 'you' : JSON.stringify(r);
  const add=r=>{ const k=key(r); if(seen.has(k) || out.length>=CC_M24.final.field) return; seen.add(k); out.push(r); };
  (m.upper.tickets||[]).forEach(add);
  (m.upper.r3||[]).forEach(add);
  (m.lower.r3||[]).forEach(add);
  (m.upper.rest||[]).forEach(add);
  (m.lower.rest||[]).forEach(add);
  return out;
}
// Комната финала для мира (без игрока): из записи, а без неё — верх лестницы.
function ccM24WorldFinalRoom(m, drafted, lobbyCr){
  const rows=ccM24GfRows(m);
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M24.final.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M24.final.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M24.final.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M24.final.field);
}
/* Место в Форт-Уэрт — квота региона на финал каждого Мейджора (GC2024_M*_SEATS),
   NA West читает NA Central; занятые места переходят следующим — здесь это
   просто «место не выше квоты». */
function ccGc24Seats(n){
  const t={1:GC2024_M1_SEATS, 2:GC2024_M2_SEATS, 3:GC2024_M3_SEATS}[n]||GC2024_M3_SEATS;
  let r=careerPrizeRegion(); if(r==='NAW') r='NAC';
  return t[r]!=null ? t[r] : 1;
}
function careerMajorOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='major');
  if(!e) return null;
  let m=String(e.id||'').match(/^Major(\d)_(PlayIn|Heats|LCQ|Final)$/);
  /* 2019–2020: неделя w (раунды вечера), хиты (день r), финал — машина runCareerMajorMX. */
  const mx=String(e.id||'').match(/^Major(\d)_(2019|2020)_(?:W(\d+)R([1-4]+)|Heat([12])|(Final))$/);
  if(mx){
    const evx={n:+mx[1], yx:+mx[2], id:e.id, label:e.label, nth:1};
    if(mx[3]!=null) return Object.assign(evx, {stage:'q', w:+mx[3], rounds:mx[4].split('').map(Number)});
    if(mx[5]) return Object.assign(evx, {stage:'heat', r:+mx[5]});
    return Object.assign(evx, {stage:'final'});
  }
  /* 2021-й: квалификатор, полуфинал (день r), Reboot Round, финал — своя машина, runCareerMajor2021. */
  const m21=String(e.id||'').match(/^Major(\d)_2021_(?:Q([123])R([1-4]+)|Semi([12])|(Reboot)|(Final))$/);
  if(m21){
    let nth=0;
    const row21=ccYearRows().find(r=>r[2]===e.id);
    if(row21) for(let d=row21[0], i=1; d<=row21[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    const ev21={n:+m21[1], y21:true, id:e.id, label:e.label, nth:nth};
    if(m21[2]) return Object.assign(ev21, {stage:'q', q:+m21[2], rounds:m21[3].split('').map(Number)});
    if(m21[4]) return Object.assign(ev21, {stage:'semi', r:+m21[4]});
    if(m21[5]) return Object.assign(ev21, {stage:'reboot'});
    return Object.assign(ev21, {stage:'final'});
  }
  /* 2022-й: квалификатор (q, раунды вечера), полуфинал (сессия r), финал — своя машина, runCareerMajor2022. */
  const m22=String(e.id||'').match(/^Major(\d)_2022_(?:Q([123])R([1-4]+)|Semi([123])|(Final))$/);
  if(m22){
    let nth=0;
    const row22=ccYearRows().find(r=>r[2]===e.id);
    if(row22) for(let d=row22[0], i=1; d<=row22[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    const ev22={n:+m22[1], y22:true, id:e.id, label:e.label, nth:nth};
    if(m22[2]) return Object.assign(ev22, {stage:'q', q:+m22[2], rounds:m22[3].split('').map(Number)});
    if(m22[4]) return Object.assign(ev22, {stage:'semi', r:+m22[4]});
    return Object.assign(ev22, {stage:'final'});
  }
  /* 2023-й: недели (d1, d2, финал недели wf), Surge Week, финал — своя машина, runCareerMajor2023. */
  const m23=String(e.id||'').match(/^Major(\d)_2023_(?:W([123])(D1|D2|F)|(Surge)|(Final))$/);
  if(m23){
    let nth=0;
    const row23=ccYearRows().find(r=>r[2]===e.id);
    if(row23) for(let d=row23[0], i=1; d<=row23[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    const stage=m23[2] ? ({D1:'d1', D2:'d2', F:'wf'})[m23[3]] : m23[4] ? 'surge' : 'final';
    return {n:+m23[1], stage:stage, w:m23[2] ? +m23[2] : 0, y23:true, id:e.id, label:e.label, nth:nth};
  }
  /* 2024-й: квалификатор (q, раунд r), полуфинал (день r), финал — своя машина, runCareerMajor2024. */
  const m24=String(e.id||'').match(/^Major(\d)_2024_(?:Q([12])R([123])|Semi([123])|Final)$/);
  if(m24){
    let nth=0;
    const row24=ccYearRows().find(r=>r[2]===e.id);
    if(row24) for(let d=row24[0], i=1; d<=row24[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    if(m24[2]) return {n:+m24[1], stage:'q', q:+m24[2], r:+m24[3], y24:true, id:e.id, label:e.label, nth:nth};
    if(m24[4]) return {n:+m24[1], stage:'semi', r:+m24[4], y24:true, id:e.id, label:e.label, nth:nth};
    return {n:+m24[1], stage:'final', y24:true, id:e.id, label:e.label, nth:nth};
  }
  /* 2025-й: Major1_2025_Group2 — это хиты, и номер группы — это nth: свой
     день у каждой группы, как у Epic, а не блок подряд. */
  let m25=String(e.id||'').match(/^Major(\d)_2025_(PlayIn|Group([123])|LCQ|LCLobby|Final)$/);
  // FNCS Showdown 2025 — «Мейджоры 4–6»: раунд 1 = LCQ, раунд 2 = финал.
  if(!m25) m25=String(e.id||'').match(/^Showdown(\d)_2025_(LCQ|Final)$/);
  if(!m && m25){
    if(m25[3]) return {n:+m25[1], stage:'heats', id:e.id, label:e.label, nth:+m25[3], group:true};
    m=[m25[0], m25[1], m25[2]];
  }
  if(!m) return null;
  /* Какой это по счёту день блока — то есть КАКОЙ ХИТ идёт сегодня.

     Отзыв: «есть же два дня отдельных, где они проходят, тогда
     можно». И правда: Major1_Heats стоит в календаре с 17 по 19 апреля, три
     дня — три хита, ровно как у Epic. Раньше номер дня не читался вовсе, и
     хиты были одним событием на три одинаковых дня.

     Нужен он затем, чтобы каждый хит игрался в СВОЙ день: свой — тобой,
     соседние — миром. Тогда и вечер не дорожает: за день считается один хит,
     а не все сразу. */
  let nth=0;
  const row=ccYearRows().find(r=>r[2]===e.id);
  if(row) for(let d=row[0], i=1; d<=row[1]; d=ccAddDays(d,1), i++)
    if(d===iso){ nth=i; break; }
  return {n:+m[1], stage:CC_MAJOR_DAY[m[2]], id:e.id, label:e.label, nth:nth};
}
/* В каком хите сидит игрок — по той же змейке, которой их и раскладывают.

   Считается ДО вечера, из записи Плей-Ина: номер хита нужен, чтобы понять, в
   какой из трёх дней игроку выходить, а вечер к этому моменту ещё не начался.
   Нет записи — нет и номера, и тогда день не ограничивается ничем: старый сейв
   должен доиграть свой Мейджор, как играл. */
/* Хит, который сегодня играет МИР, а не игрок.

   Каждый день блока — свой хит. Тот, что достался игроку, играет он сам
   (careerMajorCan пускает его только в его день); остальные считаются здесь, по
   одному за день, тем же движком и тем же правилом — stopOnWin, потому что
   победа в игре билет, и heatQualifiers поверх. Не рисуются: смотреть некому.

   Прошедшие дописываются в ту же запись, которую читает финал
   (majorSeed.through), а сыгранные номера помечаются в majorSeed.played, чтобы
   один и тот же хит не сыграли дважды — перемотка ходит по дням, и день может
   быть пройден не один раз. */
function ccMajorWorldHeats(iso){
  const ev=careerMajorOn(iso);
  if(!ev || ev.stage!=='heats' || !ev.nth) return 0;
  const cr=CAREER && CAREER.career;
  const s=cr && cr.majorSeed;
  if(!s || s.n!==ev.n || s.season!==cr.season) return 0;
  s.played=s.played||[];
  if(s.played.indexOf(ev.nth)>=0) return 0;
  const mine=ccMajorMyHeat(ev);
  if(mine && ev.nth===mine) return 0;          // свой играет игрок
  const rows=ccMajorSeedRows(ev);
  if(!rows) return 0;
  const h=ccMajorHeat(ev.n, ev.nth);
  const st=Object.assign({}, ccScaleStage(CC_MAJOR_STAGE.heats),
                         {games:h.games, cut:h.raw ? h.cut : ccTeams(h.cut)});
  /* Место игрока в змейке занимает заглушка: сама раскладка обязана совпасть с
     той, по которой он вышел в свой день, иначе соседний хит соберётся из
     других людей. В комнату заглушка не идёт. */
  const stub={name:'-', pow:0, squad:[], _stub:true};
  const seeded=rows.map(r=>r==='you' ? stub : ccMajorTeamFrom(r));
  const heats=seedHeats(seeded, ccMajorHeats());
  const room=(heats[ev.nth-1]||[]).filter(t=>!t._stub).slice(0, st.field);
  if(room.length<2) return 0;
  // Хит без игрока — тоже мир: один бросок на всех (см. ccWorldRun).
  ccWorldRun('mheat|'+cr.season+'|'+ev.n+'|'+ev.nth,
             ()=>(winIsATicket() ? simulateGamesStopOnWin : simulateGames)(room, st.games, st.pts, st.kill));
  const q=heatQualifiers(room, st.cut, winIsATicket());
  // Та же дверь, что у своего хита — см. ccMajorSeedThrough.
  ccMajorSeedThrough(cr, room.slice().sort(heatsRank).filter(t=>q.has(t)).map(ccMajorSeatRow), ev.nth);
  return 1;
}
/* Последние места финала разыгрывает Ласт Ченс в свой день, а не посев из таблицы Плей-Ина.
   Сколько мест, не задано, а считается: что осталось в зале после хитов. Так сходится и где хиты режут иначе
   (Ближний Восток, Мейджор 1: 47+3).
   Не играем, пока игрок ещё может пройти сам: careerMajorCan отвечает точнее проверки билета. */
function ccMajorWorldLcq(iso){
  const ev=careerMajorOn(iso);
  if(!ev || ev.stage!=='lcq') return 0;
  const cr=CAREER && CAREER.career;
  ccMajorWorldSeat(ev);
  const s=cr && cr.majorSeed;
  if(!s || s.n!==ev.n || s.season!==cr.season) return 0;
  if(s.lcq) return 0;
  if(careerMajorCan(ev)) return 0;
  const me=careerCard(), mates=careerMates();
  if(!me) return 0;
  const drafted=[me].concat(mates.filter(Boolean));
  const fin=ccScaleStage(ccMajorStageSpec('final'));
  const seatsTaken=(s.through||[]).length;
  const need=Math.max(0, fin.field-seatsTaken);
  if(!ccLcLobbySeats(ev, need)) { s.lcq=[]; return 0; }
  const st=ccScaleStage(ccMajorStageSpec('lcq'));
  // И у мира то же правило: держащий место в финале Ласт Ченс не играет.
  /* Ласт Ченс РЕГИОНАЛЬНЫЙ (его слово 20.10: «там же у каждого региона свои, не?»). Комната собиралась через
     ccAsWorld — пул всего мира, как у Глобалса и Парижа, — и её победители (s.through) садились в финал
     Мейджора своего региона: в европейском финале 2026-го оказывались команды NAC, BR, ME (проба: 2469 команд
     семи регионов в одной комнате, лобби 50 — NAC 40 игроков из 100). Теперь — пул своего региона, как у
     Ласт Ченса, который играет сам игрок. */
  const room=careerCupField(Object.assign({}, cr, {division:1}),
                            drafted.concat(ccMajorSeatedHandles(ev)),
                            st.field, 'majLcq', true,
                            CC_FIELD_SHARP.heats);
  if(room.length<2){ s.lcq=[]; return 0; }
  simulateGames(room, st.games, st.pts, st.kill);
  const lob=room.slice().sort(heatsRank).slice(0, ccIs2025() ? st.cut : ccTeams(CAREER_CUP_CUT));
  ccLcLobbySim(lob, ev, st.kill);
  const rows=ccLcLobbyPick(lob, ccLcLobbySeats(ev, need), ev).map(ccMajorSeatRow);
  s.through=(s.through||[]).concat(rows);
  s.lcq=rows;
  return rows.length;
}
/* Кого в Ласт Ченсе быть не может — тех, у кого место в финале уже есть.

   Отзыв: «можно сделать, чтобы ласт ченс не могли играть те,
   кто уже квальнулся в финалы». Игроку это правило поставлено с 17 августа
   (careerMajorCan: есть билет — день пустой), а комната Ласт Ченса собиралась
   открытым полем из всего ладдера, и прошедшие хиты садились в неё наравне со
   всеми: карьера смотрела, как за последние пять мест финала играют те, кто в
   этом финале уже сидит.

   Кто прошёл — записано: majorSeed.through, тот самый список, из которого
   собирается зал финала. Отдаётся он ровно тем же аргументом, которым
   careerCupField не выдаёт тебе тебя самого, — одними никами. Тот же приём,
   что у круга Reload, см. ccRelRoom. */
/* МИР САЖАЕТ ФИНАЛ, КОГДА ИГРОК ПЛЕЙ-ИН НЕ ПРОШЁЛ (Notion 23.10, скрин 8: «в 6 главе почему-то все могут
   играть последний шанс»). Запись прошедших пишет только свой Плей-Ин, а Ласт Ченс как раз для тех, кто
   его не играл или не прошёл (2025: Д2–Д3 и выбывшие; 2026: все). Без записи комната LCQ собиралась из всей лестницы: Veno, Pixie, Queasy, Malibuca играли
   последний шанс рядом с игроком (проба t-lcqfield.js). Теперь в день LCQ мир один раз сажает в финал
   сильнейших региона (места групп: финал минус победы лобби), и их нет ни в LCQ, ни в добор финала. */
function ccMajorWorldSeat(ev){
  const cr=CAREER && CAREER.career;
  if(!cr || !ev || ev.stage!=='lcq' || ev.yx || ev.y21 || ev.y22 || ev.y23 || ev.y24 || ccMajorIsShowdown(ev.n)) return;
  const s=cr.majorSeed;
  if(s && s.n===ev.n && s.season===cr.season) return;
  const me=careerCard();
  if(!me) return;
  const drafted=[me].concat(careerMates().filter(Boolean));
  const fin=ccScaleStage(ccMajorStageSpec('final', ev.n));
  // Места финала минус те, что разыграет лобби Ласт Ченса (игра = место: 3 в 2025-м, 5 в 2026-м).
  const n=Math.max(0, fin.field-ccLcLobbyGames());
  const room=careerCupField(Object.assign({}, cr, {division:1}), drafted, n+1, 'majSeat', false, CC_FIELD_SHARP.heats);
  cr.majorSeed={n:ev.n, season:cr.season, size:careerSquadSize(), rows:[], world:true,
                through:room.slice().sort((a,b)=>(b.pow||0)-(a.pow||0)).slice(0, n).map(ccMajorSeatRow)};
}
function ccMajorSeatedHandles(ev){
  ccMajorWorldSeat(ev);
  const cr=CAREER && CAREER.career, s=cr && cr.majorSeed;
  if(!s || !ev || s.n!==ev.n || s.season!==cr.season) return [];
  if(!Array.isArray(s.through)) return [];
  const out=[];
  s.through.forEach(row=>{
    if(!Array.isArray(row)) return;             // 'you' — своя строка, она и так занята
    row.forEach(e=>{
      const h=(typeof e==='string') ? e : (e && e.h);
      if(h) out.push(h);
    });
  });
  return out;
}
/* Прошедшие хит дописываются в запись, а не замещают её.
   Было `majorSeed.through=rows`: блок хитов идёт три дня, соседние играет мир (ccMajorWorldHeats дописывает), и вечер игрока стирал уже прошедших.
   Тогда ccMajorSeatedHandles их не видел, они играли Last Chance, а финал добирался посевом.
   Идемпотентно: уже лежащая строка второй раз не ложится, номер хита не задваивается (перемотка может пройти день не раз). */
function ccMajorSeedThrough(cr, rows, heatNo){
  const s=cr && cr.majorSeed;
  if(!s) return;
  const seen=new Set(), ppl=new Set();
  // И по людям: та же тройка с другим четвёртым — уже записанная команда, а не новая (см. ccMajorFinalRoom).
  const who=r=>Array.isArray(r) ? r.map(e=>hKey(typeof e==='string' ? e : (e && e.h) || '')).filter(Boolean) : [];
  s.through=(s.through||[]).concat(rows||[])
    .filter(r=>{ const k=(r==='you') ? 'you' : JSON.stringify(r);
                 if(seen.has(k)) return false;
                 const ks=who(r); if(ks.some(x=>ppl.has(x))) return false;
                 seen.add(k); ks.forEach(x=>ppl.add(x)); return true; });
  // Помечается НОМЕР ХИТА, а не день: игрок может сыграть свой хит в любой
  // день блока, а мир не должен потом сыграть его второй раз. Номера соседних,
  // уже сыгранных миром, остаются на месте по той же причине.
  s.played=(s.played||[]).concat([heatNo||0])
    .filter((v,i,a)=>a.indexOf(v)===i);
}
function ccMajorMyHeat(ev){
  const rows=ccMajorSeedRows(ev);
  if(!rows) return 0;
  const at=rows.indexOf('you');
  if(at<0) return 0;
  const heats=ccMajorHeats();
  const lap=Math.floor(at/heats), pos=at%heats;
  return (lap%2 ? heats-1-pos : pos)+1;
}
/* Who may enter what. Play-In: Division 1 only (Epic: "Reach FNCS Division 1 to
   unlock this event"). Heats: whoever came through it. Last Chance: everyone,
   except those already through this Major. Final: ticket holders from Heats or LCQ.
   Don't confuse it with the Global Championship Last Chance (GCLC_PRIZES_BY_REGION,
   careerGclcCan), where qualified duos still play for money.
   The order guard above misses this: LCQ comes after Heats on the calendar but is
   not a later stage. Each stage is played once, on its first day. */
// Why the button is off today: a ticket-holder is not locked out of a Major,
// they are already through it, and being told the Heats have to be earned when
// you have just earned them reads as the mode losing track.
function ccMajWhyLocked(){
  const ev=careerMajorOn(careerToday()), m=CAREER.career.major;
  // Соло-Мейджор в команде: свой вечер сыгран, день ждёт напарника (ccMXTeamSettle).
  if(ev && ev.yx && ccMpTeam() && (ccMXSpec(ev.yx, ev.n)||{}).size===1){
    const d=CAREER.career.mxDone||{};
    if(d[hKey(careerCard())]===careerToday()) return L().ccMpSoloWait;
  }
  if(ev && ev.stage==='lcq' && m && m.n===ev.n && m.ticket) return L().ccMajHaveTicket;
  if(ev && ev.stage==='lcq' && ccMajLc2025(ev) && (CAREER.career.division||1)>3) return L().ccMajLcqDiv||L().ccMajLocked;
  return L().ccMajLocked;
}
function careerMajorCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, m=cr.major;
  const done = m && m.n===ev.n ? m.got : null;
  // A seat given up to change partner is a seat somebody else is sitting in.
  const gaveUp=(cr.gaveUp||[]).indexOf('major:'+ev.n)>=0;
  const ticket = !gaveUp && !!(m && m.n===ev.n && m.ticket);
  // 2023-й: см. ccM23CanStage.
  if(ev.y23) return ccM23CanStage(ev, cr, gaveUp);
  if(ev.y22) return ccM22CanStage(ev, cr, gaveUp);
  if(ev.y21) return ccM21CanStage(ev, cr, gaveUp);
  if(ev.yx) return ccMXCanStage(ev, cr, gaveUp);
  /* 2024-й: раунд 1 квалификатора открыт всем; дальше — тем, кто прошёл вчерашний;
     полуфинал — своей сетке, пока жив и без билета; финал — по билету. */
  if(ev.y24){
    const s=ccM24Of(ev.n);
    if(s && s.got[ev.id]) return false;
    if(ev.stage==='q'){
      if(ev.r===1) return true;
      const prev=s && s.q[ev.q] && s.q[ev.q]['r'+(ev.r-1)];
      return ccSeedHasMe(prev);
    }
    if(ev.stage==='semi'){
      if(!s) return false;
      ccM24Brackets(s);
      const br=s.bracket && s[s.bracket];
      if(!br || s.ticket) return false;
      /* Упавший из верхней сетки сидит в upper.down[r], а не в нижней сетке прошлого дня —
         комната нижней сетки собирается ccM24LowerRoom. Без этого «Играть» гасла после
         «падение в нижнюю сетку» (аудит 29.09). */
      const prev=ccM24Room(s, s.bracket, ev.r);
      return ccSeedHasMe(prev);
    }
    return !gaveUp && !!(s && s.ticket);
  }
  if(done && CC_MAJOR_ORDER.indexOf(done)>=CC_MAJOR_ORDER.indexOf(ev.stage)) return false;
  if(ev.stage==='playin') return cr.division===1;
  if(ev.stage==='lcq'){
    if(ccMajorIsShowdown(ev.n) && cr.division>2) return false;   // Showdown — дивизионы 1–2
    /* 2025: LCQ Мейджора у Epic открыт дивизионам 1, 2 и 3 (Notion 23.10, скрин 8: «в 6 главе почему-то все
       могут играть последний шанс»). В Европе и NA Central у карьеры пять ступеней, 4 и 5 сюда не входят. */
    if(ccMajLc2025(ev) && (cr.division||1)>3) return false;
    return !ticket && !(ccMajLc2025(ev) && m && m.n===ev.n && m.pass==='lcq');
  }
  // 2025: лобби — на следующий день после LCQ, для тех, кто прошёл его отсечку.
  if(ev.stage==='lclobby') return ccMajLc2025(ev) && !ticket && !!(m && m.n===ev.n && m.pass==='lcq');
  // Cleared, not merely played: finishing 140th in a Play-In is not a place in
  // the Heats. See the note where cr.major is written.
  /* День блока игрока НЕ ограничивает: у Epic твой хит в свой день, но хаб
     об этом пока не говорит ни слова, и запрет читался бы как «кнопка пропала».
     Днями расписан только МИР — см. ccMajorWorldHeats. */
  if(ev.stage==='heats'){
    if(!(!gaveUp && !!(m && m.n===ev.n && m.pass==='playin'))) return false;
    // 2025: группа играется в СВОЙ день. Своя группа — по той же змейке посева.
    if(ev.group){ const mine=ccMajorMyHeat(ev); if(mine && mine!==ev.nth) return false; }
    return true;
  }
  if(ev.stage==='final')  return ticket;
  return false;
}
/* Prize table by the career's region, not always EU. Epic pays Majors by region (EU $591,500,
   NAC $412,000, NAW and BR $137,000, ASIA/ME/OCE $75,000); both payouts used to read EU by name.
   Uses the career's region, not ccHomeRegion, which goes through drafted and the draft screen's
   globals. Rookies are EU anyway (CC.region). */
/* …И ГДЕ ТЫ ИГРАЕШЬ, А НЕ ОТКУДА КАРТОЧКА (Notion 20.10, скрин 13: «я переехал в Азию и куча европейских команд в
   финале», «и призы в Азии не те»). Регион карточки шёл первым, и карточка Европы после переезда в Азию получала
   европейские призы и европейские настоящие трио финала (GR2021_TRIOS[регион призов] — они и были на скрине). Теперь
   регион вечеров карьеры (ccCareerRegion: свой, командный или чужой недели), карточка — только запасной. */
function careerPrizeRegion(){
  try{ if(CAREER && CAREER.career && typeof ccCareerRegion==='function') return ccCareerRegion() || 'EU'; }catch(e){}
  const r=CAREER && CAREER.player &&
          (CAREER.player.region || CAREER.player.cardRegion);
  return r || 'EU';
}
function ccRegionTable(tables){
  return (tables && (tables[careerPrizeRegion()] || tables.EU)) || null;
}
// Epic's payout for a Major Final, read straight rather than through
// prizeTableFor, which branches on CARD_SET — a global the career does not set.
// Showdown 2025: на игрока №1 $3 000, №2 $1 000, №3 $750, 4–10 $300, 11–15 $250, 16–25 $150 — на трио втрое.
const CC_SHOWDOWN_PAY=[[1,3000],[2,1000],[3,750],[10,300],[15,250],[25,150]];
// По регионам (Tracker 20.10): EU и NAC — таблица выше, NAW/BR/ASIA/ME/OCE — №1 $600, №2 $300, №3 $200, 4–25 $100.
const CC_SHOWDOWN_PAYR={EU:CC_SHOWDOWN_PAY, NAC:CC_SHOWDOWN_PAY,
  NAW:[[1,600],[2,300],[3,200],[25,100]]};
['BR','ASIA','ME','OCE'].forEach(r=>{ CC_SHOWDOWN_PAYR[r]=CC_SHOWDOWN_PAYR.NAW; });
function showdownPrize(place){ return ccPay24(CC_SHOWDOWN_PAYR, place)*careerSquadSize(); }
/* День, за который платят: мир, доигрывая пропущенный финал, считает деньги в день того финала,
   а не в день, с которого ушёл игрок (иначе таблица бралась у другого Мейджора — аудит 29.09). */
let CC_PRIZE_DAY=null;
function majorPrize(place){
  const ev=careerMajorOn(CC_PRIZE_DAY || careerToday());
  if(ev && ccMajorIsShowdown(ev.n)) return showdownPrize(place);
  // 2024-й: таблица окна Day 2 Finals своего региона (Tracker), на игрока — на дуо вдвое.
  if(ccIs2024()) return ccPay24(CC_MAJOR_PAY_2024, place)*careerSquadSize();
  // 2023-й: своя таблица у каждого Мейджора (у NA в Мейджоре 1 — NA East).
  // 2022-й: таблица Гранд-финала своего сезона и региона (Tracker, на игрока).
  // 2019–2020: World Cup — призовые Нью-Йорка (одна таблица на мир), FNCS — финал сезона и региона.
  if(ev && ev.yx) return ccMXPrize(ev.yx, ev.n, place);
  // 2021-й: таблица финала своего сезона и региона (Tracker, на игрока); 5 — Grand Royale.
  if(ccIs2021()) return ccPay24(CC_MAJOR_PAY_2021[(ev && ev.y21) ? ev.n : 4], place)*careerSquadSize();
  if(ccIs2022()) return ccPay24(CC_MAJOR_PAY_2022[(ev && ev.y22) ? ev.n : 3], place)*careerSquadSize();
  if(ccIs2023()) return ccPay24(CC_MAJOR_PAY_2023[(ev && ev.y23 && ev.n<=3) ? ev.n : 3], place)*careerSquadSize();
  // 2025-й платит своей таблицей (Attachment C 2025, одна на все три Мейджора).
  const t=ccRegionTable(ccIs2025() ? P2025_PRIZES : PRIZE_TABLES) || null;
  return t ? (t[String(place)]||0) : 0;
}

/* Money table: every event this career has seen, the Weekly Finals Europe plays without the player plus every
   paying event the player enters (whole field's cheques come from the payout table). Skipped events nobody
   simulated are not in it. Filed by career year and Fortnite season together, so a second year replaying S40
   does not add to the first. Prize money only, no wages, same number as cr.earnings. */
/* Имя человека в доске — БЕЗ подписи состава. Своя команда зовётся «Твой состав: Malibuca &
   vic0», и доска призовых резала это на людей как есть: у себя строка звалась «Твой состав:
   Malibuca», у соседа по гонке тот же человек — «Malibuca». Две разные строки об одном, и
   доски у двоих не сходились никогда. Доска рейтинга подпись снимала (careerPrAdd), доска
   денег — нет. Скриншот: слева «Твой состав: Malibuca» 58 вечеров $553k, справа
   «Malibuca» 50 вечеров $324k. */
/* Значок региона (cardFlag без страны: <span class="reg-badge">EU</span>) уходит ЦЕЛИКОМ, с текстом. Иначе снятие
   тегов оставляло «EU» перед ником: у соседа по гонке я был «EULive2», у себя «Live2» — две строки одного человека
   (онлайн-прогон 2019 года, 21.10, «строка есть не у всех»). */
const ccBoardName=n=>String(n||'').replace(/<span class="reg-badge"[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]*>/g, '').replace(/^[^:&+]{1,40}:\s*/, '').trim();
/* Люди за именем состава. Сборная Кубка наций зовётся «Польша (Darm, demus, Pixx, FRANEK)», и
   доска делила имя только по «+»/«&» — сборная вставала строкой среди людей, а каждый новый
   порядок четвёрки давал ещё одну («Польша» трижды; Notion 13.10). Скобки со списком — это люди. */
function ccMoneyWho(name){
  const m=/\(([^()]*,[^()]*)\)\s*$/.exec(name);
  const list=m ? m[1].split(',') : name.split(/\s*[+&]\s*/);
  return list.map(x=>x.trim()).filter(Boolean);
}
function careerMoney(){
  const cr=CAREER.career;
  if(!cr.money) cr.money={rows:{}};
  /* Старые сейвы: строки с подписью сливаются в строку человека — один раз, при первом
     чтении. Без этого в доске стояли бы обе. */
  if(!cr.money.named){
    cr.money.named=1;
    Object.keys(cr.money.rows).forEach(function(k){
      const to=ccBoardName(k); if(!to || to===k) return;
      const a=cr.money.rows[k], b=cr.money.rows[to];
      delete cr.money.rows[k];
      if(!b){ cr.money.rows[to]=a; return; }
      b.usd=(b.usd||0)+(a.usd||0); b.events=(b.events||0)+(a.events||0); b.you=b.you||a.you;
      ['yr','fs'].forEach(function(w){ a[w]=a[w]||{}; b[w]=b[w]||{};
        Object.keys(a[w]).forEach(function(x){ b[w][x]=(b[w][x]||0)+a[w][x]; }); });
    });
  }
  // Старые сейвы: строки сборных («США (Curve, Peterbot, Ritual, Clix)») расходятся по людям поровну.
  if(!cr.money.nat){
    cr.money.nat=1;
    Object.keys(cr.money.rows).forEach(function(k){
      const who=ccMoneyWho(k); if(who.length<2) return;
      const a=cr.money.rows[k], n=who.length;
      delete cr.money.rows[k];
      who.forEach(function(h){
        const b=cr.money.rows[h] || (cr.money.rows[h]={usd:0, events:0, yr:{}, fs:{}});
        b.usd=(b.usd||0)+Math.round((a.usd||0)/n); b.events=(b.events||0)+(a.events||0); b.you=b.you||a.you;
        ['yr','fs'].forEach(function(w){ b[w]=b[w]||{};
          Object.keys(a[w]||{}).forEach(function(x){ b[w][x]=(b[w][x]||0)+Math.round(a[w][x]/n); }); });
      });
    });
  }
  /* Старые сейвы: «ты» стояло на всём своём составе (напарник, стэнд-ин капа). Остаётся на своём
     нике, если он среди помеченных; иначе не трогаем — лучше лишняя подсветка, чем никакой. */
  if(!cr.money.you1){
    cr.money.you1=1;
    const yk=ccMoneyYouKey();
    const marked=Object.keys(cr.money.rows).filter(k=>cr.money.rows[k].you);
    if(yk && marked.some(k=>hKey(k)===yk)) marked.forEach(function(k){ if(hKey(k)!==yk) delete cr.money.rows[k].you; });
  }
  ccMoneyYouMerge(cr.money);
  return cr.money;
}
/* Смена ника (careerNickSet) оставляла в доске строку старого ника отдельным игроком.
   Свои строки (you) под другим ником сливаются в строку текущего; напарники с меткой из старых сейвов не трогаются. */
function ccMoneyYouMerge(money){
  const pl=CAREER && CAREER.player; if(!pl || pl.handle || !pl.nick) return;
  const yk=hKey(pl.nick), rows=money.rows;
  const mates=new Set();
  try{ (CAREER.partners||[]).concat(CAREER.career.exMates||[]).forEach(r=>{ const c=r && (ccMateCardOf(r)||r.card||r); const h=c && (c.handle||c.h); if(h) mates.add(hKey(h)); }); }catch(e){}
  const old=Object.keys(rows).filter(k=>rows[k] && rows[k].you && hKey(k)!==yk && !mates.has(hKey(k)));
  if(!old.length) return;
  const b=rows[pl.nick] || (rows[pl.nick]={usd:0, events:0, yr:{}, fs:{}});
  old.forEach(function(k){
    const a=rows[k]; delete rows[k];
    b.usd=(b.usd||0)+(a.usd||0); b.events=(b.events||0)+(a.events||0);
    ['yr','fs'].forEach(function(w){ b[w]=b[w]||{}; Object.keys(a[w]||{}).forEach(function(x){ b[w][x]=(b[w][x]||0)+a[w][x]; }); });
  });
  b.you=true;
}
/* СВОЯ СТРОКА ДОСКИ — ТОЛЬКО СВОЙ НИК, как в Power Ranking (careerPrAdd).
   Метка «ты» на всём составе прятала напарника и стэнд-ина от чужих копилок (ccEvResApply не трогает
   свою строку): стэнд-ин, сыгравший с тобой один кап, дальше копил только у соседей. Прогон годов 20.10,
   2021: у каждого из троих не хватало строки ровно своего стэнд-ина. */
function ccMoneyYouKey(){
  return hKey((CAREER && CAREER.player && (CAREER.player.handle || CAREER.player.nick))||'');
}
function careerMoneyKeys(){
  const cr=CAREER.career;
  const fs=careerFncsSeason(careerToday());
  return {yr:String(cr.season), fs:cr.season+':'+((fs&&fs.id)||'-'),
          fsName:(fs&&fs.id)||'-'};
}
// prize(place, team) — the payout table of whatever just finished.
/* Prize money is split between the duo. Epic's tables are per team ($10,000 for a divisional cup is for the pair),
   and paying it all to one player doubles earnings against real per-player boards. Each handle takes half; an odd
   dollar is lost to rounding. The prize tables still say what Epic pays a team. */
function ccShareOf(cash, team){
  const n=(team && team.squad && team.squad.length) || 2;
  return Math.round((cash||0)/Math.max(1, n));
}
/* ДОСКИ ОДНИ НА ГОНКУ. Призовые и Power Ranking копятся из вечеров, которые карьера ВИДЕЛА:
   не прошёл в финал Мейджора — денег того финала в твоей доске нет вовсе, и у соседа по гонке
   доска другая (скриншот: у одного Sky 63 вечера и $642k, у другого тот же Sky — 60 и
   $349k). Вечера теперь общие, но сыграть их могут не все: у кого-то нет напарника, кто-то не
   квалифицировался. Поэтому каждый вечер складывается в копилку (CC_EV_DELTA) и уезжает в
   комнату актом 'res'; кто этот вечер не играл, добавляет его к себе один раз — по ключу дня и
   вида (cr.evSeen). Свои вечера помечаются тем же ключом, так что дважды не считается. */
let CC_EV_DELTA=null;
/* КЛЮЧ ВЕЧЕРА — ДЕНЬ, ВИД И ДИВИЗИОН. Ключ «день|вид» сталкивал ДВА РАЗНЫХ вечера: сосед
   играет тот же кубок в своём дивизионе, оба помечают один ключ, и каждый отказывается от
   чужой копилки как от своей собственной. Оба вечера в мире были, а в досках у каждого
   остался только свой. Годовая проба на двоих 11.09: 6 строк из 454 разошлись — три дуо,
   у одного клиента на пять-шесть вечеров меньше. Вместе играют ОДИН дивизион, значит
   ключ у них сходится по-прежнему; врозь — расходится, и копилки доезжают в обе стороны. */
function ccEvKey(next, day){
  const t=next && (next.id || next.type) || '?';
  const div=(CAREER && CAREER.career && CAREER.career.division) || 0;
  /* И ВРОЗЬ — ЭТО ДРУГОЙ ВЕЧЕР. Дивизиона мало: соло-серия у каждого своя, день и вид у неё
     общие, и два РАЗНЫХ вечера получали один ключ — каждый отказывался от чужой копилки как
     от своей. Вторая годовая проба на двоих 11.09: те же 6 строк из 446, три дуо. Вечер,
     сыгранный не вместе, метится своим ником: у общего ключ по-прежнему один на всех.
     ccRaceShared спрашивается ДО замка (CC_RACE_LOCK ставится позже), поэтому зовём её саму. */
  let alone='';
  try{ if(typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceShared==='function' && !ccRaceShared(next))
         alone='|s'+hKey(careerCard()||{handle:''}); }catch(e){}
  return String(day||careerToday())+'|'+String(t)+'|d'+div+alone;
}
function ccEvSeen(){ const cr=CAREER && CAREER.career; if(!cr) return {}; if(!cr.evSeen) cr.evSeen={}; return cr.evSeen; }
function ccEvSeenMark(key){
  const seen=ccEvSeen(); if(!key || seen[key]) return false;
  seen[key]=1;
  const ks=Object.keys(seen);
  if(ks.length>400) ks.slice(0, ks.length-400).forEach(k=>{ delete seen[k]; });
  return true;
}
/* КЛЮЧ МЕТИТСЯ НА ВХОДЕ.
   Метка стояла в конце вечера (ccEvDeltaSend), и между началом и концом оставалось окно:
   сосед, закончивший раньше, присылал свою копилку, а я в этот момент уже записал те же
   деньги своим ходом, но ключ ещё не пометил — и строки ложились дважды. Вечер, который я
   считаю сам, чужой копилки не ждёт, поэтому ключ метится там, где вечер начинается.
   Отмена вечера ничего не ломает: ccEvDeltaSend зовётся и на ошибке, из finally. */
function ccEvDeltaStart(key){
  /* Новый вечер (не хвост) — флаг «разошёлся на границе раундов» снимается здесь: перемотка запускает вечера мимо
     careerPlayRun0, и поднятый с соло-капа флаг делал личными все следующие общие вечера (их итоги ложились у
     напарника второй раз копилкой — командный год 20.10, Evaluation 29.01: Kami 800 против 400). */
  if(typeof CC_TEAM_NIGHT_APART!=="undefined" && !(key && /\|t[^|]*$/.test(key))) CC_TEAM_NIGHT_APART=false;
  CC_EV_DELTA=key ? {key:key, money:{}, ev:{}, pr:{}, yr:null, fs:null, day:careerToday()} : null;
  if(key) ccEvSeenMark(key);
}
/* ВЕЧЕР РАЗОШЁЛСЯ ПОСРЕДИ — ЗНАЧИТ У НЕГО ДВЕ ЧАСТИ.
   Границы раундов (Evaluation R2, Victory Cup R2, лобби LCQ) отпускают локстеп, когда
   прошли не все: дальше прошедший играет свою комнату, а вылетевший закрывает вечер. До
   этой минуты вечер был общий и посчитан одинаково, после — он у каждого свой.
   А ключ копилки один на весь вечер, и это и есть ответ на жалобу про
   разные доски: прошедший записывал призовые второго раунда себе, вылетевший помечал тот
   же ключ пустым и потому отказывался от присланных чисел как от уже учтённых. Разница
   в $800 на человека вставала навсегда (проба на двоих 11.09: Evaluation 9 января,
   Pixovsky и SereN — 5 вечеров и $2100 против 4 и $1300).
   Поэтому вечер закрывается дважды: общая часть уходит под общим ключом (у обоих она
   одинакова, каждый свою уже посчитал), а хвост — под своим, с ником. Так его принимает
   сосед, и оба видят один второй раунд. Ровно так же давно живут соло-серии: вечер,
   сыгранный не вместе, метится ником (см. ccEvKey). */
function ccRaceNightApart(){
  CC_RACE_LOCK=false; CC_RACE_NIGHT_APART=true;
  const d=CC_EV_DELTA; if(!d || !d.key) return;
  const key=d.key;
  ccEvDeltaSend();
  let me=''; try{ me=hKey(careerCard()||{handle:''}); }catch(e){}
  ccEvDeltaStart(key+'|t'+me);
}
/* И вопросы врозь: хвост вечера — одиночный (CC_MP_ALONE), иначе прошедший ждал ответа на высадку от вылетевшего (онлайн-
   прогон 2020 года, 21.10: Platform Cash Cup 11.05, «peer done · q drop#1» на первой игре второго раунда — красная строка).
   Снимается в конце вечера (careerPlayRun). */
let CC_TEAM_APART_ALONE=false;
function ccTeamNightApart(){
  CC_TEAM_NIGHT_APART=true;
  if(!CC_MP_ALONE){ CC_MP_ALONE=true; CC_TEAM_APART_ALONE=true; }
  const d=CC_EV_DELTA; if(!d || !d.key) return;
  const key=d.key;
  ccEvDeltaSend();
  let me=''; try{ me=hKey(careerCard()||{handle:''}); }catch(e){}
  ccEvDeltaStart(key+'|t'+me);
}
function ccEvDeltaSend(){
  try{ if(typeof careerClubTake==='function') careerClubTake(); }catch(e){}   // доля клуба с призовых состава
  const d=CC_EV_DELTA; CC_EV_DELTA=null;
  if(!d || !d.key) return;
  ccEvSeenMark(d.key);
  /* КОМАНДА: вечер, который сыграл один из двоих (CC_MP_ALONE, напарнику в этот день играть нечего),
     у напарника не считался вовсе — его призовых и рейтинга в досках второго не было (командный год
     20.10: доски разошлись на 454 строки). Общие вечера оба считают сами, им копилка не нужна. */
  if(d.alone && typeof ccMpTeam==='function' && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn())){
    if(!Object.keys(d.money).length && !Object.keys(d.pr).length) return;
    let me=''; try{ me=hKey(careerCard()||{handle:''}); }catch(e){}
    if(!/\|t[^|]*$/.test(d.key)) d.key=d.key+'|s'+me;
    ccEvSeenMark(d.key);
    try{ if(typeof MP!=='undefined' && MP.act){ d.by=ccMpId(); MP.act('res', d); } }catch(e){}
    return;
  }
  if(typeof ccRaceOn!=='function' || !ccRaceOn() || typeof ccRaceLive!=='function' || !ccRaceLive()) return;
  if(!Object.keys(d.money).length && !Object.keys(d.pr).length) return;
  try{ d.by=ccMpId(); MP.act('res', d); }catch(e){}
}
/* Чужой вечер в свои доски: те же строки, что записал бы свой (careerMoneyAdd/careerPrAdd),
   только числа приехали готовыми. Свою строку в них не трогаем — она своя по определению. */
/* СВОИ СТРОКИ — только из своих вечеров. Чужая копилка везёт всё поле, включая того, кто её
   прислал; моя собственная строка в ней стоять не может (я этот вечер не играл — иначе ключ
   уже помечен), но подстраховка дешевле разбирательства: строка, помеченная как своя, и мой
   собственный ник чужими числами не трогаются. */
function ccEvMine(){
  const s={};
  try{ const me=careerCard(); if(me && me.handle) s[hKey(me)]=1; }catch(e){}
  return s;
}
/* ФИНАЛ МИРА ПРОТИВ СЫГРАННОГО ФИНАЛА (гонка, онлайн-прогон 2026, 22.10). Финал, который сыграл один из людей,
   второй мог досчитать за мир раньше, чем пришла копилка сыгравшего (в гонке день у каждого свой) — и призы всего поля
   ложились дважды: Summit 31.05, 50 лишних строк. Выплату мира за финал помним (cr.wfinPaid); пришла копилка
   сыгранного финала того же вида в те же дни — сначала снимаем выплату мира. И наоборот: копилку мира за финал,
   который здесь уже сыгран (своим вечером или копилкой соседа), не принимаем. */
function ccFinalKindOf(day, id){
  const e=(careerYearDays().get(day)||[]).find(x=>x && String(x.id||'')===String(id||''));
  if(!e) return null;
  // Reload Championship в календаре идёт видом 'gc' (общая краска с Last Chance), а мир платит её видом 'rc' (ccLanKindOf).
  if(String(e.id||'')==='ReloadChampionshipParis') return 'rc';
  return (['globals','gclc','rc'].indexOf(e.kind)>=0 || e.stage==='final' || /Final|_GF|Grand/i.test(String(e.id||''))) ? e.kind : null;
}
function ccWfinKeep(d){
  try{
    if(!d || !d.wkind || !CAREER || !CAREER.career) return;
    const cr=CAREER.career, w=cr.wfinPaid=cr.wfinPaid||{};
    w[d.key]={kind:d.wkind, day:d.day||careerToday(), money:Object.assign({}, d.money||{}), ev:Object.assign({}, d.ev||{}), pr:JSON.parse(JSON.stringify(d.pr||{})), yr:d.yr||null, fs:d.fs||null};
    const ks=Object.keys(w); if(ks.length>40) ks.slice(0, ks.length-40).forEach(k=>{ delete w[k]; });
  }catch(e){}
}
function ccWfinPlayedHere(kind, day){
  const cr=CAREER.career;
  if((cr.log||[]).some(r=>r && r.kind===kind && r.season===cr.season && (r.stage==null || r.stage==='final') && Math.abs(ccDaysBetween(r.day, day))<=3)) return true;
  return Object.keys(ccEvSeen()).some(k=>{ if(/\|wfin\|/.test(k)) return false; const p=k.split('|');
    return p[0] && Math.abs(ccDaysBetween(p[0], day))<=3 && ccFinalKindOf(p[0], p[1])===kind; });
}
function ccWfinUndo(key){
  const cr=CAREER.career, w=cr.wfinPaid||{};
  const p=String(key||'').split('|'); if(!p[0] || /\|wfin\|/.test(key)) return;
  const kind=ccFinalKindOf(p[0], p[1]); if(!kind) return;
  Object.keys(w).forEach(wk=>{
    const r=w[wk]; if(!r || r.kind!==kind || Math.abs(ccDaysBetween(r.day, p[0]))>3) return;
    const m=careerMoney();
    Object.keys(r.money||{}).forEach(h=>{ const each=Math.round(r.money[h]||0), row=m.rows[h]; if(!each || !row || row.you) return;
      row.usd-=each; row.events=Math.max(0, (row.events||0)-Math.max(1, Math.round((r.ev && r.ev[h])||1)));
      if(r.yr && row.yr) row.yr[r.yr]=(row.yr[r.yr]||0)-each;
      if(r.fs && row.fs) row.fs[r.fs]=(row.fs[r.fs]||0)-each;
      if(row.usd<=0 && !row.events) delete m.rows[h]; });
    const t=careerPrTally(), ad=ccAbsDay(cr.season, r.day);
    Object.keys(r.pr||{}).forEach(name=>{ const row=t.rows[name]; if(!row || row.you) return;
      (r.pr[name]||[]).forEach(rating=>{
        let i=row.v.findIndex(v=>v[0]===rating && v[1]===ad); if(i<0) i=row.v.findIndex(v=>v[0]===rating);
        if(i>=0){ row.v.splice(i, 1); row.n=Math.max(0, (row.n||0)-1); } });
      if(!row.v.length && !row.n) delete t.rows[name]; });
    delete w[wk];
  });
}
function ccEvResApply(d){
  if(!d || !d.key || !CAREER || !CAREER.career) return false;
  if(d.wkind && ccWfinPlayedHere(d.wkind, d.day||careerToday())){ ccEvSeenMark(d.key); return false; }
  if(!ccEvSeenMark(d.key)) return false;
  if(d.wkind) ccWfinKeep(d); else try{ ccWfinUndo(d.key); }catch(e){}
  const mine=ccEvMine();
  const m=careerMoney(), k={yr:d.yr||careerMoneyKeys().yr, fs:d.fs||careerMoneyKeys().fs};
  Object.keys(d.money||{}).forEach(function(h){
    const each=Math.round(d.money[h]||0); if(!each) return;
    if(mine[hKey(h)] || (m.rows[h] && m.rows[h].you)) return;
    const row=m.rows[h] || (m.rows[h]={usd:0, events:0, yr:{}, fs:{}});
    row.usd+=each; row.events+=Math.max(1, Math.round((d.ev && d.ev[h])||1));
    row.yr[k.yr]=(row.yr[k.yr]||0)+each;
    row.fs[k.fs]=(row.fs[k.fs]||0)+each;
  });
  const t=careerPrTally(), day=ccAbsDay(CAREER.career.season, d.day||careerToday());
  Object.keys(d.pr||{}).forEach(function(name){
    if(mine[hKey(name)] || (t.rows[name] && t.rows[name].you)) return;
    (d.pr[name]||[]).forEach(function(rating){
      if(!(rating>0)) return;
      const row=t.rows[name] || (t.rows[name]={v:[], n:0});
      row.v.push([rating, day]);
      ccPrRowTrim(row);
      row.n++;
    });
  });
  careerSave();
  return true;
}
function careerMoneyAdd(ranked, prize){
  if(!ranked || !ranked.length) return;
  const m=careerMoney(), k=careerMoneyKeys();
  ranked.forEach(function(t, i){
    if(ccBoardOnlyYou() && !t.isYou) return;
    const usd=prize(i+1, t)||0;
    if(!usd) return;
    const name=ccBoardName(t.name);
    if(!name) return;
    // The board is a board of people, so a duo's prize lands on two rows.
    const who=ccMoneyWho(name);
    const parts=who.length || 1;
    const each=Math.round(usd/parts);
    // «ты» — свой ник в составе; не нашёлся (имя без людей) — вся строка, как раньше.
    const yk=t.isYou ? ccMoneyYouKey() : '';
    const youAll=t.isYou && !(who.length ? who : [name]).some(h=>hKey(h)===yk);
    (who.length ? who : [name]).forEach(function(h){
      if(ccTeamPeerSkip(h)) return;
      const row=m.rows[h] || (m.rows[h]={usd:0, events:0, yr:{}, fs:{}});
      row.usd+=each; row.events++;
      row.yr[k.yr]=(row.yr[k.yr]||0)+each;
      row.fs[k.fs]=(row.fs[k.fs]||0)+each;
      if(t.isYou && (youAll || hKey(h)===yk)) row.you=true;
      /* Копилка вечера — для тех, кто его не играет (см. ccEvDeltaSend). СВОЯ СТРОКА ТОЖЕ:
         своя она только у меня, а у соседа по гонке я — обычный человек сцены, и мои
         призовые за вечер, который он не играл, не попадали к нему ВООБЩЕ. Отсюда скриншот
         11.09: у себя 58 вечеров и $553k, у соседа тот же человек — 50 и $324k. Свою строку
         от чужой копилки бережёт приёмник (ccEvResApply). */
      if(CC_EV_DELTA){ CC_EV_DELTA.money[h]=(CC_EV_DELTA.money[h]||0)+each; CC_EV_DELTA.yr=k.yr; CC_EV_DELTA.fs=k.fs;
        if(ccTeamSoloNight()) CC_EV_DELTA.alone=true;
        // И сколько выплат: два раунда одного вечера — два турнира в доске (прогон годов 20.10, Solo Cash Cup 2023).
        if(CC_EV_DELTA.ev) CC_EV_DELTA.ev[h]=(CC_EV_DELTA.ev[h]||0)+1; }
    });
  });
}
// scope: 'season' — the Fortnite season being played, 'year' — this career year.
// careerMoneyRows still answers 'all' and the tally still keeps it — the header
// reads the career's own all-time earnings off it — but the standing is not
// shown over all time. A board that never resets is a board nobody can catch up
// on, and the two windows that reset are the ones a season is played inside.
/* Reading it.

   Two buttons over one list, because the same money answers two questions.
   Thirty rows, and if the player is below them their own row is pinned to the
   bottom — a leaderboard you are not on tells you nothing. */
/* Год, не сезон, открывается первым — скриншот: «перестали
   считаться призовые за фнкс и саммит». Деньги никуда не девались (проба
   money-scope-probe: сезонное окно пустеет на стыке, годовое держит всё) —
   но саммит стоит в S40, финал Мейджора в S41, и вкладка «Сезон S42»
   честно показывала таблицу без обоих. Окна остались те же, добавилось
   «За всё время» — careerMoneyRows отвечал на 'all' всегда, кнопки не было. */
let CH_MONEY='year';
function careerMoneyTab(v){ CH_MONEY=v; careerRenderHub(CH_TAB); }
function careerMoneyHTML(){
  const scope=CH_MONEY==='year' ? 'year' : CH_MONEY==='all' ? 'all' : 'season';
  const rows=careerMoneyRows(scope), k=careerMoneyKeys();
  const usd=n=>ccMoney(n||0);
  const tab=(id,label)=>`<button class="cm-tab${scope===id?" on":""}" onclick="careerMoneyTab(\'${id}\')">${label}</button>`;
  const head=`<div class="cm-head">${tab("season", L().ccMoneySeason(k.fsName))}${tab("year", L().ccMoneyYear(CAREER.career.season))}${tab("all", L().ccMoneyAll)}</div>`;
  if(!rows.length)
    return `<div class="ch-tile"><h4>${L().ccMoneyTitle}</h4>${head}<div class="ch-empty">${L().ccMoneyEmpty}</div></div>`;
  const mine=careerMoneyPlace(scope);
  const line=(r,n)=>`<tr class="${r.you?"you":""}"><td>${n}</td><td class="ct-name">${esc(r.name)}</td><td>${r.events}</td><td class="cm-usd">${usd(r.usd)}</td></tr>`;
  const top=rows.slice(0, 30).map((r,i)=>line(r, i+1)).join("");
  // Pinned only when they fell off the end of the list.
  const below=(mine && mine>30) ? line(rows[mine-1], mine) : "";
  return `<div class="ch-tile"><h4>${L().ccMoneyTitle}</h4>
    ${head}
    <table class="ct cm"><thead><tr><th>#</th><th>${L().ccTableTeam}</th><th>${L().evEvents}</th><th class="cm-usd">${L().chEarnings}</th></tr></thead>
    <tbody>${top}${below}</tbody></table>
    <div class="ct-note">${mine ? L().ccMoneyYou(mine) : L().ccMoneyNotIn}</div>
  </div>`;
}
function careerMoneyRows(scope){
  const m=careerMoney(), k=careerMoneyKeys();
  return Object.keys(m.rows).map(function(name){
    const r=m.rows[name];
    const usd = scope==='season' ? ((r.fs||{})[k.fs]||0)
              : scope==='year'   ? ((r.yr||{})[k.yr]||0)
              : r.usd;
    return {name:name, usd:usd, events:r.events, you:!!r.you};
  }).filter(function(r){ return r.usd>0; })
    .sort(function(a,b){ return b.usd-a.usd || b.events-a.events; });
}
function careerMoneyPlace(scope){
  const rows=careerMoneyRows(scope);
  for(let i=0;i<rows.length;i++) if(rows[i].you) return i+1;
  return null;
}

/* ===== Division 1's season table =====
   Every Weekly Final adds points; at year end it decides who stays in D1 (Epic: "Division 1 is kept only by last
   season's standing", no demotion mid-season). Only D1 has one, since only D1 has a Weekly Final.
   Top 50 stay, matching the Weekly Final's 50 seats. The one invented rule here: Epic publishes no relegation. */
const CC_TABLE_KEEP=50;
function careerTable(){
  const cr=CAREER.career;
  if(!cr.table || cr.table.season!==cr.season)
    cr.table={season:cr.season, weeks:0, rows:{}};
  return cr.table;
}
// One Weekly Final's worth. Called with the night's standings whether the player
// was in them or the rest of Europe played it without them.
function careerTableAdd(ranked){
  const t=careerTable();
  t.weeks++;
  ranked.forEach(function(team, i){
    const name=String(team.name||'').replace(/<[^>]*>/g,'');
    if(!name) return;
    /* Your own row is keyed on being you, not on what the team is called.

       The name is yourTeamPrefix plus the partner's handles, so it changed the
       moment the duo changed — and again if the language changed — and the week
       after wrote a second row. A season's points then stood in two places,
       careerTablePlace read whichever half sorted higher, and under a fifty-team
       cut that is a relegation nobody earned: the only way out of Division 1 is
       this line. Everybody else in the room is a snapshot pair whose name does
       not move, which is why nothing else showed it. His report, 20 August.

       Rows written before this fix keep their name as the key and stay where
       they are; the merge is not retroactive, because a split that already
       happened cannot be told from two teams. */
    /* И у тройки ключ — её ядро, а не имя.

       Тестер, страница «05» (5.10): «в 6 главе двое свиззи стало». Третий у
       настоящей тройки 2025-го меняется со снимком сезона (ccRealSnap), и
       «SwizzY & Queasy & Merstach» с «SwizzY & Queasy & Rad3on» вставали в
       таблицу двумя строками — замер года (tools/p05-ff.js): 33-я и 37-я, и
       так у каждого второго ядра сцены. Ядро — первые двое состава (пара
       пула, к ней садится третий), оно сезон и держит. */
    const sq=team.squad||[];
    const key=team.isYou ? '__you__'
            : (sq.length>=3 && sq[0] && sq[1]) ? 'core:'+[hKey(sq[0]), hKey(sq[1])].sort().join('+')
            : name;
    const row=t.rows[key] || (t.rows[key]={pts:0, weeks:0, best:null, wins:0});
    // The name is carried rather than keyed on, so the table still prints the
    // duo the player is in now.
    row.name=name;
    row.pts += team.stagePts||0;
    row.weeks++;
    row.wins += team.wins||0;
    if(row.best==null || i+1<row.best) row.best=i+1;
    if(team.isYou) row.you=true;
  });
}
// Sorted the way the standing is read: points, then how often you were there,
// then the best night you had.
/* Reading it.

   Fifty rows and a line under the fiftieth, because that line is the whole
   point of the table: everything above it is still in Division 1 next year.
   Below Division 1 there is nothing to show and the screen says why rather
   than drawing an empty table. */
/* Сезонной таблицы больше нет — отзыв: «убери эту таблицу и
   power ranking оставь». Плитка ТАБЛИЦА с очками финалов недели и правилом
   «первые N остаются в Дивизионе 1» удалена целиком (careerTableHTML и её
   ccTable*-строки — мёртвые ключи в словарях); вылет из Д1 был снят ещё
   22 августа, теперь снята и сама витрина правила. careerTableRows/Place
   живут: ими рисуются скриншоты таблиц в ленте (careerD1Posts). */
function careerTableRows(){
  if(CC_RENDER_MEMO){ if(!CC_RENDER_MEMO.has('tbl')) CC_RENDER_MEMO.set('tbl', careerTableRowsRaw()); return CC_RENDER_MEMO.get('tbl').slice(); }
  return careerTableRowsRaw();
}
function careerTableRowsRaw(){
  const t=careerTable();
  return Object.keys(t.rows).map(function(name){
    const r=t.rows[name];
    // The key is the name for everybody whose name cannot move, and a sentinel
    // for the one team whose name can — see careerTableAdd. A row from a save
    // written before that carries no name of its own and reads its key, which
    // is what it always was.
    return {name:r.name||name, pts:r.pts, weeks:r.weeks, best:r.best, wins:r.wins, you:!!r.you};
  }).sort(function(a,b){
    return b.pts-a.pts || b.weeks-a.weeks || (a.best||99)-(b.best||99);
  });
}
function careerTablePlace(){
  const rows=careerTableRows();
  for(let i=0;i<rows.length;i++) if(rows[i].you) return i+1;
  return null;
}

/* Division 1's Weekly Final, the first thing in a career that pays (below Division 1 the payout table is empty).
   From Tracker's Division 1 EU page: 50 teams, 6 matches, VR +9, 2nd-5th +4 each, 6th-25th +2, cumulative so a win is 65. Elimination 4.
   Entry is the top 50 across the week's two sessions, the cut the divisional cup already computes (Division 1 has nothing to promote into). */
const CC_WF_GAMES=6, CC_WF_KILL=4;
/* Season-aware FNCS placement points. Trio seasons use PLACEMENT_POINTS_TRIO (2025 trio rules:
   VR +11, Top 2 +6, Top 3-5 +4, Top 6-17 +3, VR still 65), otherwise PLACEMENT_POINTS_DUO
   (65, 56, 52, 48, 44 …). Same path as pointsForPlace so career and lobbies can't drift apart.
   Outside a career (mode tiles) it's duos, like real FNCS 2026. */
function wfPoints(place){
  const trio=(typeof CAREER!=='undefined') && CAREER && CAREER.career &&
             careerSquadSize()===3;
  const t=trio ? PLACEMENT_POINTS_TRIO : PLACEMENT_POINTS_DUO;
  return (place>0 && place<=t.length) ? t[place-1] : 0;
}
const CC_WF_PAY={1:10000, 2:5000, 3:3000, 4:2000, 5:1500, 6:1000, 7:1000,
                 8:800, 9:800, 10:800};
/* Финал Division 1 Practice платит по своей таблице — снята с Tracker
   (payoutTableV2 окна Week1Final_EU, S42) 23 августа, просьба
   «призовые достань как на фортнайттрекере»: №1 $2500, №2 $1250, №3 $625,
   №4 $500, №5 $375, 6–7 $250, 8–10 $200, 11–20 $150, 21–40 $100. На дуо. */
const CC_WF_PAY_S42={1:2500, 2:1250, 3:625, 4:500, 5:375, 6:250, 7:250,
                     8:200, 9:200, 10:200};
function ccWfIsPractice(){
  const w=ccCupWeeks().find(r=>r[3]===careerToday());
  return !!(w && /^S42_/.test(w[0]));
}
/* Финал недели Дивизиона 1 в 2025-м (Tracker, S33/S34/S36 Week Final EU, на игрока):
   №1 $7 500, №2 $4 500, №3 $3 000, №4 $2 100, №5 $1 650, 6–10 $1 200, 11–15 $600,
   16–20 $300, 21–25 $150 — на трио втрое. */
const CC_WF_PAY_2025=[[1,7500],[2,4500],[3,3000],[4,2100],[5,1650],[10,1200],[15,600],[20,300],[25,150]];
// Финал недели Elite, 2023-й (Tracker, S23_DivisionalCups_Elite_Finals, на игрока); NA — NA East.
const CC_WF_PAY_2023={EU:[[1,5000],[2,2700],[3,1800],[10,900],[25,450],[40,300]], NAC:[[1,2500],[2,1200],[3,800],[10,400],[40,200]],
  BR:[[1,1250],[2,600],[3,400],[40,200]], ASIA:[[1,1250],[2,600],[3,400],[40,200]], ME:[[1,1250],[2,600],[3,400],[40,200]], OCE:[[1,1250],[2,600],[3,400],[40,200]]};
/* ПО РЕГИОНАМ (его слово 20.10: «посмотри у каждого региона призы и сравнивай с Европой»). Таблицы 2025/2026 стояли
   одни на все регионы — европейские: Азия за первое место Финала недели получала $5 000 на игрока, как Европа. Снято с
   Tracker 20.10 (imp_event.Windows[].PayoutTable, окна S39/S40/S41/S42_FNCSDivisionalCup_Division1_Week1Final_<рег>,
   S33/S34/S36 — то же у 2025-го), на ИГРОКА, «до места N — сумма». NAW и BR платят одной таблицей, ASIA/ME/OCE — другой
   (группировка Epic). Европа совпадает с прежними числами до доллара (CC_WF_PAY ×2 у дуо). Практика S42 раньше платила
   свою сумму на всю команду — у Epic это сумма на игрока, теперь ×размер состава, как везде. */
const CC_WF_PAY_2026R={
  EU:  [[1,5000],[2,2500],[3,1500],[4,1000],[5,750],[7,500],[10,400],[20,300],[40,200]],
  NAC: [[1,3000],[2,1500],[3,900],[4,600],[5,450],[7,375],[10,300],[20,225],[40,150]],
  NAW: [[1,1500],[2,1000],[3,500],[4,300],[5,200],[10,150],[20,100]],
  ASIA:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]]};
CC_WF_PAY_2026R.BR=CC_WF_PAY_2026R.NAW; CC_WF_PAY_2026R.ME=CC_WF_PAY_2026R.ASIA; CC_WF_PAY_2026R.OCE=CC_WF_PAY_2026R.ASIA;
const CC_WF_PAY_S42R={
  EU:  [[1,2500],[2,1250],[3,625],[4,500],[5,375],[7,250],[10,200],[20,150],[40,100]],
  NAC: [[1,1500],[2,750],[3,450],[4,300],[5,225],[7,188],[10,150],[20,113],[40,75]],
  NAW: [[1,750],[2,500],[3,250],[4,150],[5,100],[10,75],[20,50]],
  ASIA:[[1,500],[2,250],[3,125],[4,100],[5,75],[20,50]]};
CC_WF_PAY_S42R.BR=CC_WF_PAY_S42R.NAW; CC_WF_PAY_S42R.ME=CC_WF_PAY_S42R.ASIA; CC_WF_PAY_S42R.OCE=CC_WF_PAY_S42R.ASIA;
const CC_WF_PAY_2025R={
  EU:  [[1,7500],[2,4500],[3,3000],[4,2100],[5,1650],[10,1200],[15,600],[20,300],[25,150]],
  NAC: [[1,5000],[2,3000],[3,2000],[4,1400],[5,1100],[10,800],[15,400],[20,200],[25,100]],
  NAW: [[1,2500],[2,1500],[3,1000],[4,850],[5,650],[10,400],[15,200],[20,100]],
  ASIA:[[1,2100],[2,1050],[3,700],[4,595],[5,455],[10,280],[15,140]]};
CC_WF_PAY_2025R.BR=CC_WF_PAY_2025R.NAW; CC_WF_PAY_2025R.ME=CC_WF_PAY_2025R.ASIA; CC_WF_PAY_2025R.OCE=CC_WF_PAY_2025R.ASIA;
function wfPrize(place){
  if(ccIs2023()) return ccPay24(CC_WF_PAY_2023, place)*careerSquadSize();
  if(ccIs2022()) return ccPay24(CC_WF_PAY_2022, place)*careerSquadSize();
  if(ccIs2025()) return ccPay24(CC_WF_PAY_2025R, place)*careerSquadSize();
  if(ccWfIsPractice()) return ccPay24(CC_WF_PAY_S42R, place)*careerSquadSize();
  return ccPay24(CC_WF_PAY_2026R, place)*careerSquadSize();
}
// Whether this Saturday is yours: the cut you cleared is stamped with the Monday
// of its own week, so a final can never be played on the back of last week's.
function careerWeeklyFinalOn(iso){
  const cr=CAREER.career;
  if(cr.division!==1) return false;
  if(!(careerYearDays().get(iso)||[]).some(e=>e.kind==='final')) return false;
  return !!(cr.wf && cr.wf.monday===careerMonday(iso));
}

/* Reload Elite Series: a second circuit beside the ladder and the only road out that skips FNCS. Four cups, each a
   chain: Opens are open to all divisions, later stages must be earned.
   Numbers from docs/superpowers/specs/2026-08-13-ewc-reload-elite-series-design.md: Opens and Play-Ins 2 per elim,
   Heats and Final 3; placement R_PLACEMENT (cup 1 steeper). Heat: 20 duos, 8 games, top 5 out; final 20 duos, 8 games.
   The final pays EWC seats, not money: EU top 3 per cup, twelve total.
   Opens field = the whole ladder summed (D1 field + entrants of all rungs below, 9,766 duos now). Cut is Epic's share,
   see ccReloadOpenCut. */
// Kept per region, because Division 1's rung is the region's own roster and a
// career that moves across the map takes a different ladder with it.
/* БЕЗ ВЕЧНОГО КЭША (errlog 23.10, команда на 23.10f: «field … n2470 vs n2390», «n2470 vs n2330» каждый вечер).
   Дивизион 1 в сумме — живой размер пула сезона (ccDiv1Size), а кэш был по одному региону: вкладка, где раньше
   открывали карьеру другого года, держала его лестницу (проба t-hist.js: сразу 2026 — 2470, сначала 2025 — 2560),
   и двое в одной команде садились в открытые поля разного размера. Сумма пяти чисел — считаем каждый раз. */
function careerLadderEntrants(){
  let n=0;
  Object.keys(CC_CUP_ENTRANTS).forEach(d=>{ n+=CC_CUP_ENTRANTS[d]; });
  return n;
}
/* A Reload match holds forty players.

   That is the mode's own lobby and not a choice a tournament makes: twenty duos
   in the Elite Series, forty solos in a Reload Victory Cup. The career was
   playing the Opens and the Play-In in fifties, which is the Battle Royale
   lobby — and the circuit's own spec says what that costs in as many words:
   "A stage played in a fifty-duo lobby would score every placement in the cup
   wrong." Placement points are paid per lobby, so a fifty-duo room hands out
   top-ten finishes to teams that were nowhere near the top ten of a real one.

   The heats and the final were already right, because their whole field is
   twenty and the lobby could not be bigger than the room. */
const CC_RELOAD_PLAYERS=40;
/* До какого круга в Reload возрождаются (движок: onDeath, respawnUntilZone). По
   реплеям первые выбывшие — к восьмому кругу, заметные потери с девятого. */
const CC_RELOAD_RESPAWN_ZONE=9;
function ccReloadLobby(teamSize){
  return Math.max(1, Math.round(CC_RELOAD_PLAYERS/(teamSize||2)));
}
/* Share of an Opens session that advances to the Play-In.
   Epic advances the top 1000 of ~9,766 EU duos, so one in ten. Stored as a share because the sim plays Opens in a room of careerLadderEntrants(): a flat 1000 out of ~2100 would move half the ladder.
   Replaces a derived 50 per session, which came from reading Tracker's top-100 display cap (tools/build-ewc-rows.js) as the field size.
   The Play-In then cuts to the 80 the heats seat (four heats of 20). */
/* And how many the Opens actually send, read off Epic's own event page on
   17 August rather than remembered: "the top players on the Open cumulative
   leaderboard will qualify for the Play-Ins — Top 2,000 EU; Top 1,000 NAC;
   Top 500 OCE, ASIA, ME, BR, NAW." The thousand that stood here was NAC's.
   The career can be played in any region now, so the number follows the region
   the way the roster does. */
const CC_LADDER_TRUE=9766;
const CC_OPEN_CUT={EU:2000, NAC:1000, NAE:1000, NAW:500, OCE:500, ASIA:500, ME:500, BR:500};
function ccOpenAdvance(){ return CC_OPEN_CUT[ccCareerRegion()] || 500; }
/* Open cut shown at Epic's scale. The real ladder is 9,766 duos (Tracker division sizes summed), ours is
   CC_CUP_ENTRANTS 1000/500/300/150, 2,100 in the open, because 5,000+ duos cost 7.2 s a stage.
   So the room is a 1-in-4.65 sample of the real open and places are scaled up: the card shows Epic's cut of 1000
   and field of 9,766 instead of 215. See ccOpenScale. */
/* Room size the Opens is actually simulated at. The ladder summed grows too big (4,200 duos x 12 games = 7.5 s a
   stage). Results are already scaled to the real open (9,766 duos vs Epic's thousand, ccOpenScale), so the room is a
   sample; 2,000 gives the same tournament in ~4 s.
   Measured one Chrome per size, page load subtracted (performance.now() under --virtual-time-budget reports 0):
     450 x 11: 948ms, 500 x 11: 1,016ms, 2,000 x 11: 3,745ms, 4,200 x 12: 7,527ms */
const CC_OPEN_ROOM=2100;
/* And what a phone can hold, which is not the same number.

   The room is already a sample of the real open — 9,766 duos read out of 2,100
   played, see ccOpenScale — so its size decides how finely that sample is cut
   and nothing else. On a desktop 2,100 is four seconds of work; on a phone the
   same twelve games are a stall long enough to look like the page has died, and
   his report of 20 August is exactly that. Two-fifths of the room is the same
   tournament at the same odds, read out at the same 9,766 and the same thousand,
   in a fraction of the time.

   Measured once and kept: a career does not move between devices mid-session,
   and asking matchMedia on every field build would be its own cost. */
const CC_OPEN_ROOM_SMALL=900;
let CC_SMALL_DEVICE=null;
function ccSmallDevice(){
  if(CC_SMALL_DEVICE!=null) return CC_SMALL_DEVICE;
  let small=false;
  try{
    small = (window.matchMedia && window.matchMedia('(max-width: 820px)').matches) ||
            (navigator.hardwareConcurrency>0 && navigator.hardwareConcurrency<=4) ||
            /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
  }catch(e){ small=false; }
  CC_SMALL_DEVICE=small;
  return small;
}
/* В КОМАНДНОЙ карьере комната не зависит от устройства.

   Скриншот квал Reload, игра 2: «Вечера разошлись на игре 1 —
   field …n2100h68 vs …n900h68». Двое считают один вечер шаг в шаг, а комнату
   один собрал на 2100 дуо (ноутбук), другой на 900 (телефон, или просто
   четыре ядра) — это два разных турнира с первой же игры. Размер комнаты
   решает, что покажет вечер, значит в команде он обязан быть у обоих одним,
   и выбирается тот, который потянет любой из двух телефонов: малый. Это тот же
   турнир при тех же шансах (см. выше), только считается быстрее.
   Одиночная карьера как выбирала по устройству, так и выбирает. */
function ccOpenRoom(){
  /* И в ГОНКЕ то же: скриншот (две вкладки, три гонщика) — «field …r1.15.n2100h106+106+114 vs
     …n900h106+106+114», одно окно узкое (max-width 820) — и у него комната 900 против 2100 у соседа.
     Годовая проба этого не ловила: шесть вкладок одной машины считают комнату одинаково. */
  const small = ccSmallDevice() || (typeof ccMpTeam==='function' && ccMpTeam()) || (typeof ccRaceOn==='function' && ccRaceOn());
  return Math.min(small ? CC_OPEN_ROOM_SMALL : CC_OPEN_ROOM, careerLadderEntrants());
}
function ccReloadOpenCut(){
  return Math.max(20, Math.round(ccOpenRoom()*ccOpenAdvance()/CC_LADDER_TRUE));
}
/* The real open and its cut, counted in this season's teams.

   Epic's 9,766 and Epic's thousand are duos, and the room they are read against
   is converted for a trio season by ccScaleStage — so without these two the
   sample was multiplied out against a duo-sized open and a trio's place in the
   Opens read half as good again as it was. The share is untouched: it is the
   same people either way, described in the unit the season plays in. */
function ccOpenTrue(){ return ccTeams(CC_LADDER_TRUE); }
function ccOpenAdvanceNow(){ return ccTeams(ccOpenAdvance()); }
// How much bigger the real open is than the room we play it in. Display only:
// the cut, the field size and a place read off it. Nothing decided by it.
function ccOpenScale(fieldSize){
  return (fieldSize>0) ? ccOpenTrue()/fieldSize : 1;
}
/* Первое место — первое, и последнее — последнее.
 *
 * Умножение места на размер выборки верно в середине поля и неверно на его
 * краю: выиграв комнату, игрок читал у себя «топ-11», второй — «топ-22»,
 * третий — «топ-33». Сообщение тестера, 21 августа: «i get 1st but after cup
 * its noted as a top 11 (same for top 2 n 3 22 33)». Одиннадцать — честное
 * матожидание лучшего из выборки, но человеку, который только что видел на
 * экране единицу, оно читается как ошибка, и по делу: кто-то этот опен всё же
 * выиграл.
 *
 * Поэтому отображение не пропорциональное, а линейное с закреплёнными концами:
 * первый в комнате — первый, последний в комнате — последний из настоящих
 * девяти с половиной тысяч, между ними та же равномерная растяжка. */
function ccOpenShow(n, fieldSize){
  return ccRankStretch(n, fieldSize);
}
function ccRankStretch(n, fieldSize){
  return ccStretchTo(n, fieldSize, ccOpenTrue());
}
/* То же правило, но настоящее поле называется вслух. Опен — не единственный
   турнир, который играется выборкой: дивизионный кубок собирает тысячу дуо и
   играется комнатой в полторы сотни, и место в нём тоже читается в тысяче.
   Концы закреплены так же: кто выиграл комнату, выиграл турнир. */
function ccStretchTo(n, roomOf, trueOf){
  const k=(roomOf>0 && trueOf>0) ? trueOf/roomOf : 1;
  if(!(k>1) || !(n>0)) return Math.max(1, Math.round(n));
  return Math.max(1, Math.round(1+(n-1)*k));
}
// Set for the length of one standings table and put straight back. Every rank a
// table prints is multiplied by it; nothing a table decides is.
let CC_RANK_SCALE=1;
// Тем же правилом, что и место игрока: концы закреплены, растянута середина.
// Иначе таблица печатала бы «11» напротив того, у кого в шапке стоит «1».
function ccRankShow(i){
  const k=CC_RANK_SCALE;
  if(!(k>1) || !(i>0)) return Math.max(1, Math.round(i));
  return Math.max(1, Math.round(1+(i-1)*k));
}
/* Reload circuit prizes: the qualifying series pays $1.5m of the $2.5m, only $1m is Paris.
   From saved Fortnite Tracker pages (Cash Prize column, EU Heats and Finals of cups 1-3). Per duo; ccShareOf halves it.
     Opens, Play-In  nothing
     Heats          top 5 advance unpaid; 6-10 $500, 11-15 $400, 16-20 $300 ($6,000 a heat, four a cup)
     Final          $30,000 down to $1,000 over 20 places, $122,000 a cup
   Other regions below come from Epic's own tables. A region with no table pays nothing; do not copy Europe's shape. */
const CC_REL_PRIZES={
  EU:{
    heat: {6:500, 7:500, 8:500, 9:500, 10:500,
           11:400, 12:400, 13:400, 14:400, 15:400,
           16:300, 17:300, 18:300, 19:300, 20:300},
    final:{1:30000, 2:20000, 3:14000, 4:10000, 5:8000, 6:7000, 7:6000, 8:5000,
           9:4000, 10:3000, 11:2000, 12:2000, 13:2000, 14:2000, 15:2000,
           16:1000, 17:1000, 18:1000, 19:1000, 20:1000}
  }
};
/* Остальные шесть регионов (29.09, Tracker: imp_event.Windows[].PayoutTable событий
   S39_ReloadEliteSeries1{Heat1,Final}_{REG} и S41_ReloadEliteSeries4 — таблицы одинаковы в сериях 1 и 4).
   У Epic Quantity — на игрока, «до места N»; здесь, как у Европы выше, — на дуо (×2). */
(function(){
  const duo=rows=>{ const t={}; let from=1; rows.forEach(([upTo, v])=>{ for(let p=from; p<=upTo; p++) if(v) t[p]=v*2; from=upTo+1; }); return t; };
  const F_NAC=[[1,10000],[2,7000],[3,5000],[4,4000],[5,3000],[6,2000],[7,1500],[8,1250],[9,1000],[10,750],[15,500],[20,250]];
  const F_NAW=[[1,3000],[2,2000],[3,1500],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250]];
  const F_SM=[[1,1500],[2,1000],[3,750],[4,600],[5,500],[6,400],[7,350],[8,300],[9,250],[10,200],[20,150]];
  CC_REL_PRIZES.NAC={heat:duo([[5,0],[10,200],[15,150],[20,100]]), final:duo(F_NAC)};
  CC_REL_PRIZES.NAW={heat:duo([[5,0],[10,150],[15,100]]), final:duo(F_NAW)};
  CC_REL_PRIZES.BR ={heat:duo([[5,0],[10,150],[15,100]]), final:duo(F_NAW)};
  ['ME','ASIA','OCE'].forEach(r=>{ CC_REL_PRIZES[r]={heat:duo([[5,0],[10,100]]), final:duo(F_SM)}; });
})();
function relStagePrize(stage, place){
  const byRegion=CC_REL_PRIZES[careerPrizeRegion()];
  const t=byRegion && byRegion[stage];
  return (t && t[place]) || 0;
}
const CC_RELOAD_ORDER=['open','playin','heat','final'];
const CC_RELOAD_STAGE={
  open:  {games:12, kill:2, get field(){ return ccOpenRoom(); },
                            get cut(){ return ccReloadOpenCut(); }},
  playin:{games:12, kill:2, get field(){ return ccReloadOpenCut(); }, cut:80},
  heat:  {games:8,  kill:3, field:20,               cut:5},
  final: {games:8,  kill:3, field:20,               cut:3}
};
// Насколько маленькой должна быть комната, чтобы её выбывших стоило запомнить.
// Лобби круга — двадцать дуо; сорок оставлены на то, чтобы правило пережило
// смену размера состава, и всё равно отсекают отбор с его сотнями. См. ccRelRoom.
const CC_REL_OUT_MAX=40;
const CC_RELOAD_DAY={Opens:'open', PlayIn:'playin', Heats:'heat', Final:'final'};
// Which cup and which stage a day belongs to, read off the calendar's own id.
function careerReloadOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='reload');
  if(!e) return null;
  const m=String(e.id||'').match(/^ReloadEliteSeries(\d)(Opens|PlayIn|Heats|Final)$/);
  if(!m) return null;
  return {series:+m[1], set:'r'+m[1], stage:CC_RELOAD_DAY[m[2]], id:e.id, label:e.label};
}
// You may enter the Opens whenever they run. Everything after them asks what you
// came through, and a new cup starts the chain again from nothing.
/* The Opens are two evenings and one tournament.

   His words, 16 August: the Opens are the sum of two tournaments and the top
   thousand goes to the Play-In. The calendar has always had the two dates - the
   generated year calls the row "Opens, two sessions" and this file marks it
   'pair' so only the endpoints run - but each evening was scored on its own and
   cut on its own, so a career got two independent shots at the same seat and the
   second one wiped the first.

   The same shape Division 1's Monday and Tuesday already use: the first evening
   settles nothing and banks its points, the second carries them in and the table
   at the end of it is the tournament's. A player who only turns up for one
   evening is scored on that evening, which is also true of the real thing. */
function careerReloadSession(ev){
  const row=ccYearRows().find(r=>r[2]===ev.id);
  if(!row || row[0]===row[1]) return 1;
  return careerToday()===row[1] ? 2 : 1;
}
function careerReloadBanking(ev){
  return !!ev && ev.stage==='open' && careerReloadSession(ev)===1;
}
/* What the first evening leaves behind, and why it is a string.

   The banked evening was four objects keyed by team name - points, elims, games,
   wins - which is fine for a Weekly Final's hundred and fifty duos and is not
   fine for an Opens. At the Opens' real size that is nine thousand seven hundred
   names written out four times, about a megabyte of JSON, and careerSave swallows
   a quota error without a word: the save simply stops happening and the career
   silently stops existing between sessions.

   So it is one row per team in one string. Same four numbers, the name written
   once, about a quarter of the size - and it is unpacked back into the four maps
   the field builder already reads, so nothing downstream knows the difference.
   A save banked in the old shape still opens, because the old shape is still
   read when it is the one that is there. */
/* And it is keyed on who they are, not on what the row says.

   A team's name is display markup - two flag images from flagcdn with widths and
   titles and inline styles around two handles - so keying the carry on it wrote
   about two hundred and fifty characters of HTML per duo. Nine thousand of those
   is the four megabytes that killed the save. The handles alone are twenty. */
function ccRelKey(t){
  const s=(t.squad||[]).map(p=>String(p&&p.handle||'')).join('&');
  return s || String(t.name||'').replace(/<[^>]*>/g, '').trim();
}
function ccRelPack(field){
  return field.map(t=>[ccRelKey(t).split(';').join(','), t.stagePts||0,
                       t.stageElims||0, (t.stageLog||[]).length,
                       t.wins||0].join('|')).join(';');
}
function ccRelUnpack(rows){
  const out={pts:{}, elims:{}, games:{}, wins:{}};
  String(rows||'').split(';').forEach(r=>{
    if(!r) return;
    const p=r.split('|'), n=p[0];
    out.pts[n]=+p[1]||0; out.elims[n]=+p[2]||0;
    out.games[n]=+p[3]||0; out.wins[n]=+p[4]||0;
  });
  return out;
}
function careerReloadCarry(ev){
  const r=CAREER.career.rel;
  if(!(ev && ev.stage==='open' && careerReloadSession(ev)===2 && r && r.id===ev.id))
    return null;
  if(!r.rows){ r.byName=true; return r; }
  const c=ccRelUnpack(r.rows);
  c.log=r.log;
  return c;
}
/* Пройденную стадию Reload больше не предлагать. Стадия идёт окном в несколько дней, и все дни календарь
   выдаёт её же; got растёт на ступень за успех, и прошедший снова попадал на вылет в той же стадии.
   Открыта, когда пройдена предыдущая и не пройдена она сама. Проигрыш got не двигает, повтор остаётся. */
function careerReloadCan(ev){
  if(!ev) return false;
  const r=CAREER.career.reload;
  const mine=(r && r.series===ev.series) ? r : null;
  if(mine && ccGaveUp('reload:'+mine.series)) return false;
  const at=mine ? CC_RELOAD_ORDER.indexOf(mine.got) : -1;
  return at === CC_RELOAD_ORDER.indexOf(ev.stage)-1;
}
// The placement ladder of the cup being played, without touching CARD_SET: that
// global also decides which cards exist, and a career must not have its roster
// swapped out from under it for the length of a tournament.
function reloadCareerPoints(set){
  /* И Reload в сезоне трио — по тому же правилу.

     Правило: «релоад сделай похожим образом». Похожим — потому
     что своей трио-таблицы у Reload Elite Series нет и быть не может: этот
     турнир никто и никогда не играл втроём. Поэтому опубликованная дуо-лестница
     переносится через ccTrioLadder — те же ступени, обрезанные там, где
     кончается трио-комната, и растянутые так, чтобы Victory Royale стоил свои
     шестьдесят. Кубок 1 остаётся круче трёх остальных, как и в дуо.

     Для r2: 60, 48, 41, 34, 27, 20, 16, 12, 8, 4 — десять мест вместо
     пятнадцати. */
  const duo=R_PLACEMENT[set]||R_PLACEMENT.r2;
  const key=(R_PLACEMENT[set] ? set : 'r2');
  const t=(CAREER && CAREER.career && careerSquadSize()===3)
          ? ccTrioLadderOf('rl3:'+key, duo) : duo;
  return function(place){ return place<=t.length ? t[place-1] : 0; };
}

/* Victory Cup: open to everybody, the only event paying players far from Division 1. Numbers from Tracker EU event pages per window.
   Round 1: 6 matches, VR +7, Top 2 +4, Top 3 +2, +1 per tier Top 4..Top 50, cumulative (win = 60). Elimination +2.
   Round 2: 3 matches, only a win scores: +100 points and $100 ($200 for a duo).
   Round 2 size: Tracker's S41_SoloVictoryCup R2 EU board runs 40 pages of 100, so 4000 players (CC_VICTORY_R2_PLAYERS).
   Field is the whole ladder: careerLadderEntrants() in duos, twice that in solo (it used to be 150 with the divisional cut).
   Not modelled: Epic's per-day Ranked gates (Platinum, Elite, Unreal). There's no Ranked ladder, so every day is open. */
const CC_VICTORY_R1_GAMES=6, CC_VICTORY_R1_KILL=2, CC_VICTORY_R2_GAMES=3;
// Three of the year's Victory Cups are played in Reload, and a Reload match
// seats forty players however the tournament pairs them up — so a Reload solo
// cup is forty in the lobby and a Battle Royale solo cup is a hundred.
function ccVictoryLobby(ev, solo){
  // Mobile Series: режим только для мобилы, 16 в лобби (страница серии Epic).
  if(ccIsMobSeries(ev)) return CC_MOBSER_LOBBY;
  if(ccIsReloadEv(ev)) return ccReloadLobby(solo?1:careerSquadSize());
  return solo ? 100 : ccTeams(50);
}
/* How many reach Round 2: four thousand, which is Epic's own number rather than
   a share of it — the same call the divisional quotas got. Tracker's leaderboard
   for S41_SoloVictoryCup Round 2 in Europe runs to 40 pages of 100.

   It is four thousand people, so a duos cup counts them as two thousand teams.
   Against the fields here that is one entrant in five either way, where Epic's
   own ninety thousand made it one in twenty-two — the room is the part this
   mode cannot hold, and the quota is the part it can. */
// Epic's 4,000 belonged to the 19,532-player room; the share is what carries
// to the user's smaller ladder: 20.5% of 4,200 solo players is 860.
const CC_VICTORY_R2_PLAYERS=860;
/* The room and the quota, in the teams this season plays in.

   careerLadderEntrants is the ladder counted in duos, and the quota is 860
   people: a solo cup is those people, a duo cup is half of them and a trio cup a
   third. Both were duo counts whatever season it was, so a trio Victory Cup ran
   a duo-sized room and advanced a duo-sized quota out of it. See ccTeams. */
function careerVictoryField(solo){
  return solo ? careerLadderEntrants()*2 : ccTeams(careerLadderEntrants());
}
function careerVictoryCut(solo){
  return solo ? CC_VICTORY_R2_PLAYERS : ccTeams(CC_VICTORY_R2_PLAYERS/2);
}
const CC_VICTORY_WIN_PTS=100, CC_VICTORY_CASH_SOLO=100, CC_VICTORY_CASH_DUO=200;
// Cumulative "reach top N", so the points for a place are every tier at or below
// it. Written as the sum rather than a 50-row table, because that is how Epic
// publishes it and a table would have to be checked row by row against this.
function victoryR1Points(place){
  if(!(place>0) || place>50) return 0;
  return (place<=1?7:0) + (place<=2?4:0) + (place<=3?2:0) + (50 - Math.max(place,4) + 1);
}
function victoryR2Points(place){ return place===1 ? CC_VICTORY_WIN_PTS : 0; }

/* The days it ran. One row per day rather than a span, because a Victory Cup
   does not keep a rhythm — Season 41's Reload cup ran on the 1st, the 11th and
   the 15th of August. Taken from the EU event pages:

     S39 Duos          5, 12, 19 January
     S39 Solo          8, 15 March
     S40 Solo          22, 29 March, 5, 12 April
     S41 Solo          13, 20 June, 18, 25 July
     S41 Solo Reload   1, 11, 15 August                                      */
/* Скин-капы: именные капы Epic с 2021-го (даты и формат: event-windows-eu, event-scoring-eu; tools/measured/skin-cups.json),
   скин по имени капа из fortnite-api. Денег не платят, награда скин сразу в шкафчик за верхнюю четверть первого раунда
   (порог наш: настоящие пороги у Epic свои, в архиве их нет). Только в настоящем году, 2027+ их нет. */
const CC_SKIN_CUPS=[
  {day:'2021-02-10',id:'S15_FlashCup',mode:'duo',n:1,fmt:true,name:"The Flash Cup",skin:'CID_A_010_Athena_Commando_M_Tar_46FMC',skinN:"The Flash"},
  {day:'2021-04-14',id:'S16_AloyCup',mode:'duo',n:1,fmt:true,name:"Aloy Cup",skin:'CID_A_062_Athena_Commando_F_Alchemy_XD6GP',skinN:"Aloy"},
  {day:'2021-04-28',id:'S16_NeymarJrCup',mode:'solo',n:1,fmt:true,name:"Neymar Jr Cup",skin:'CID_A_078_Athena_Commando_M_Bicycle',skinN:"Neymar Jr"},
  {day:'2021-05-12',id:'S16_TeenTitansCup',mode:'duo',n:1,fmt:true,name:"Teen Titans Cup",skin:'CID_A_092_Athena_Commando_M_Broccoli_PR297',skinN:"Beast Boy"},
  {day:'2021-05-27',id:'S16_DeathstrokeCup',mode:'solo',n:1,fmt:true,name:"Deathstroke Cup",skin:'CID_A_103_Athena_Commando_M_Grim_VM52M',skinN:"Deathstroke Zero"},
  {day:'2021-06-21',id:'S17_ThanosCup',mode:'duo',n:1,fmt:true,name:"Thanos Cup",skin:'CID_A_128_Athena_Commando_M_Menace',skinN:"Thanos"},
  {day:'2021-08-05',id:'S17_CammyCup',mode:'duo',n:1,fmt:true,name:"Cammy Cup",skin:'CID_A_162_Athena_Commando_F_Quarrel_E5D63',skinN:"Cammy"},
  {day:'2021-08-11',id:'S17_GamoraCup',mode:'duo',n:1,fmt:true,name:"Gamora Cup",skin:'CID_A_157_Athena_Commando_F_Stereo_3A08Z',skinN:"Gamora"},
  {day:'2021-08-18',id:'S17_WonderWomanCup',mode:'duo',n:1,fmt:true,name:"Wonder Woman Cup",skin:'CID_A_187_Athena_Commando_F_Monarch',skinN:"Wonder Woman"},
  {day:'2021-08-24',id:'S17_JBalvinCup',mode:'duo',n:1,fmt:true,name:"J Balvin Cup",skin:'CID_A_182_Athena_Commando_M_Vivid_LZGQ3',skinN:"J Balvin"},
  {day:'2022-02-07',id:'S19_SilkSonicCup',mode:'duo',n:1,fmt:true,name:"Silk Sonic Cup",skin:'CID_A_334_Athena_Commando_M_Sleek_U06KF',skinN:"Bruno Mars"},
  {day:'2022-03-24',id:'S20_ChloeKimCup',mode:'duo',n:1,fmt:true,name:"Chloe Kim Cup",skin:'CID_A_375_Athena_Commando_F_Snowfall_WXW2T',skinN:"Chloe Kim"},
  {day:'2022-05-18',id:'S20_AliaACup',mode:'duo',n:1,fmt:true,name:"Ali-A Cup",skin:'CID_A_415_Athena_Commando_M_Alfredo',skinN:"Ali-A"},
  {day:'2022-05-22',id:'S20_ObiWanCup',mode:'duo',n:1,fmt:true,name:"Obi-Wan Cup",skin:'CID_A_411_Athena_Commando_M_Noble',skinN:"Obi-Wan Kenobi"},
  {day:'2022-09-21',id:'S22_SypherPKIconCup',mode:'duo',n:1,fmt:true,name:"SypherPK Icon Cup",skin:'Character_Headset',skinN:"SypherPK"},
  {day:'2022-11-04',id:'S22_PoloStadiumCup',mode:'solo',n:1,fmt:true,name:"Polo Stadium Cup",skin:'Character_StallionAviator',skinN:"Polo Prodigy"},
  {day:'2023-01-24',id:'S23_thekidlaroi',mode:'duo',n:1,fmt:true,name:"The Kid LAROI Cup",skin:'Character_SunBurst',skinN:"The Kid LAROI"},
  {day:'2023-02-23',id:'S23_SuperFlakesCup',mode:'duo',n:1,fmt:true,name:"Super Flakes Cup",skin:'Character_OceanBreeze',skinN:"Flakes Power"},
  {day:'2023-03-01',id:'S23_CreedCup',mode:'solo',n:1,fmt:true,name:"Creed Cup",skin:'Character_InspireSpell',skinN:"Adonis Creed"},
  {day:'2023-04-12',id:'S24_RenegadeRunnerCupBuild',mode:'duo',n:1,fmt:true,name:"Renegade Runner Cup",skin:'Character_HeadhunterStar',skinN:"Renegade Runner"},
  {day:'2023-08-11',id:'S25_JJKCup',mode:'duo',n:1,fmt:true,name:"Jujutsu Kaisen Cup",skin:'Character_BirdNest',skinN:"Yuji Itadori"},
  {day:'2024-06-12',id:'S30_NickEh',mode:'duo',n:1,fmt:true,name:"Nick Eh 30 Cup",skin:'Character_WeaveHarbor',skinN:"Nick Eh 30"},
  {day:'2024-06-18',id:'S30_MetallicaCup',mode:'squad',n:1,fmt:true,name:"Metallica Cup",skin:'Character_GreatPool',skinN:"James Hetfield"},
  {day:'2024-09-21',id:'S31_RubiusIconCup',mode:'duo',n:1,fmt:true,name:"Rubius Icon Cup",skin:'Character_LivelyDomino',skinN:"Rubius"},
  {day:'2024-10-22',id:'S31_SymbioteCup',mode:'duo',n:1,fmt:true,name:"Symbiote Cup",skin:'Character_DoughDisk',skinN:"She-Venom"},
  {day:'2025-03-15',id:'S34_ShoheiOhtaniCup',mode:'solo',n:1,fmt:true,name:"Shohei Ohtani Cup",skin:'Character_VelvetDeskCam',skinN:"Shohei Ohtani"},
  {day:'2025-03-21',id:'S34_ClixIconCup',mode:'trio',n:1,fmt:true,name:"Clix Icon Cup",skin:'Character_TwilightSpotSpell',skinN:"Clix"},
  {day:'2025-08-06',id:'S36_RangerCup_Pink',mode:'solo',n:1,fmt:true,name:"Power Rangers Cup",skin:'Character_FumeFleeceJig',skinN:"Pink Ranger"},
  {day:'2025-08-06',id:'S36_RangerCup_Red',mode:'solo',n:1,fmt:true,name:"Power Rangers Cup",skin:'Character_FumeFleeceFade',skinN:"Red Ranger"},
  {day:'2025-08-15',id:'S37_AceWildCardCup',mode:'duo',n:1,fmt:true,name:"Aces Wild Card Cup",skin:'Character_HeistFNCS',skinN:"Aces Wild Card"},
  {day:'2025-08-17',id:'S37_ChampionCrystalCup',mode:'solo',n:1,fmt:true,name:"Champion Crystal Cup",skin:'Character_RowdyDevilFNCS',skinN:"Champion Crystal"},
  {day:'2025-08-31',id:'S37_SurfWitchCup',mode:'solo',n:1,fmt:true,name:"Surf Witch Cup",skin:'Character_PunkDevilSummerFNCS',skinN:"Champion Surf Witch"},
  {day:'2025-09-12',id:'S37_KaiCenatIconCup',mode:'solo',n:1,fmt:true,name:"Kai Cenat Icon Cup",skin:'Character_EssayViewMyth',skinN:"Kai Cenat"},
  {day:'2025-09-24',id:'S37_MrSavageIconCup',mode:'duo',n:1,fmt:true,name:"MrSavage Icon Cup",skin:'Character_PineTrimPack',skinN:"MrSavage"},
  {day:'2025-10-16',id:'S37_HauntedCupJason',mode:'duo',n:1,fmt:true,name:"Jason Cup",skin:'Character_GnatGala',skinN:"Jason "},
  {day:'2025-10-23',id:'S37_HauntedCupWednesday',mode:'duo',n:1,fmt:true,name:"Wednesday Cup",skin:'Character_PolkaSkate',skinN:"Wednesday Addams"},
  {day:'2025-11-21',id:'S38_StrangerThingsCup',mode:'solo',n:1,fmt:true,name:"Stranger Things Cup",skin:'Character_GroovyReader',skinN:"Eleven"},
  {day:'2025-12-19',id:'S39_BleachCup',mode:'solo',n:1,fmt:true,name:"Bleach Cup",skin:'Character_LatteStir',skinN:"Ichigo Kurosaki"},
  {day:'2026-01-13',id:'S39_KizunaAICup',mode:'duo',n:1,fmt:true,name:"KizunaAI Cup",skin:'Character_MarchTreatCup',skinN:"KizunaAI"},
  {day:'2026-02-06',id:'S39_KPDHCup',mode:'solo',n:1,fmt:true,name:"KPop Demon Hunters Cup",skin:'Character_LoanFloat',skinN:"Rumi (HUNTR/X)"},
  {day:'2026-02-19',id:'S39_SoloLevelingCup',mode:'solo',n:1,fmt:true,name:"Solo Leveling Cup",skin:'Character_RampCanal',skinN:"Sung Jinwoo"},
  {day:'2026-03-06',id:'S39_PickleRickCup',mode:'solo',n:1,fmt:true,name:"Pickle Rick Cup",skin:'Character_QuartzSqueak',skinN:"Pickle Rick"},
  {day:'2026-04-15',id:'S40_TripleThreatCup',mode:'trio',n:1,fmt:true,name:"Triple Threat Cup",skin:'Character_AlderOptic',skinN:"Triple Threat Sommerset"},
  {day:'2026-05-20',id:'S40_MandalorianCup',mode:'duo',n:1,fmt:true,name:"Mandalorian Cup",skin:'Character_ChiliAbide',skinN:"The Mandalorian (Pen & Ink)"},
  {day:'2026-05-26',id:'S40_TypicalGamerCup',mode:'solo',n:1,fmt:true,name:"Typical Gamer Cup",skin:'Character_QuarterClaspZoom',skinN:"Typical Gamer"},
  {day:'2026-06-10',id:'S41_ViniJr',mode:'trio',n:1,fmt:true,name:"Vini Jr. Cup",skin:'Character_ChewyStaveCurve',skinN:"Vini Jr."},
  {day:'2026-06-24',id:'S41_SupergirlCup',mode:'duo',n:1,fmt:true,name:"Supergirl Cup",skin:'Character_VowelSleep',skinN:"Supergirl"},
  {day:'2026-06-27',id:'S41_MongraalIconCup',mode:'duo',n:1,fmt:true,name:"Mongraal Icon Cup",skin:'Character_VigorKnackDill',skinN:"Mongraal"},
  {day:'2026-07-15',id:'S41_TheOdysseyCup',mode:'solo',n:1,fmt:true,name:"The Odyssey Cup",skin:'Character_HornetBerm',skinN:"Odysseus"},
  {day:'2026-07-17',id:'S41_DavidBeckham',mode:'trio',n:1,fmt:true,name:"David Beckham Cup",skin:'Character_CiderPetalClover',skinN:"David Beckham"},
  {day:'2026-08-28',id:'S42_CrashBandicootCup',mode:'duo',n:1,fmt:true,name:"Crash Bandicoot Cup",skin:'Character_SpruceBark',skinN:"Crash Bandicoot"},
  {day:'2026-09-08',id:'S42_MegaManCup',mode:'duo',n:1,fmt:true,name:"Mega Man Cup",skin:'Character_DuneBriefMerry',skinN:"Mega Man (Dual Override)"},
  {day:'2026-09-12',id:'S42_WeezyIconCup',mode:'solo',n:1,fmt:true,name:"Weezy Icon Cup",skin:'Character_NoiseClueGust',skinN:"Weezy"},
  {day:'2026-09-15',id:'S42_IronmouseIconCup',mode:'duo',n:1,fmt:true,name:"Ironmouse Icon Cup",skin:'Character_FeelUnionSki',skinN:"Ironmouse"},
  {day:'2026-09-18',id:'S42_KingdomHeartsCup',mode:'solo',n:1,fmt:true,name:"Kingdom Hearts Cup",skin:'Character_SpireTend',skinN:"Sora"},
  {day:'2026-09-24',id:'S42_MadisonBeerIconCup',mode:'duo',n:1,fmt:true,name:"Madison Beer Icon Cup",skin:'Character_MistTycoonLife',skinN:"Satin Angel Madison"},
  {day:'2026-09-25',id:'S42_Persona5Cup',mode:'solo',n:1,fmt:true,name:"Persona 5 Cup",skin:'Character_CosmicTrellis',skinN:"Joker (P5R)"},
  {day:'2026-11-06',id:'S43_OnePieceZoroCup',mode:'trio',n:1,fmt:true,name:"One Piece Zoro Cup",skin:'Character_BrandCreed',skinN:"Roronoa Zoro"}
];
const CC_S43_TRIOS_PAY={"EU":[[1,4000],[2,1250],[3,900],[10,400],[15,300],[25,150]],"OCE":[[1,625],[2,400],[3,300],[5,200],[25,100]],"BR":[[1,625],[2,400],[3,300],[5,200],[25,100]],"ASIA":[[1,625],[2,400],[3,300],[5,200],[25,100]],"ME":[[1,625],[2,400],[3,300],[5,200],[25,100]],"NAC":[[1,4000],[2,1250],[3,900],[10,400],[15,225],[25,100]]};
const CC_VICTORY=[
  /* Микро-ланы — его пункт 11 со страницы «ы», 22 августа: «дримхак». Два
     комьюнити-лана в год той же машинерией Victory Cup: вечер на два раунда,
     сотня за победу во втором. lan несёт своё имя вместо сезонного; торговую
     марку DreamHack не берём — DreamCup читается сам. */
  {day:'2026-02-22', id:'DreamCupWinter', mode:'duo', n:1, lan:'DreamCup Winter'},
  {day:'2026-09-06', id:'DreamCupAutumn', mode:'duo', n:1, lan:'DreamCup Autumn'},
  {day:'2026-01-05', id:'S39_DuosVictoryCup',        mode:'duo',  n:1},
  {day:'2026-01-12', id:'S39_DuosVictoryCup',        mode:'duo',  n:2},
  {day:'2026-01-19', id:'S39_DuosVictoryCup',        mode:'duo',  n:3},
  {day:'2026-03-08', id:'S39_SoloVictoryCup',        mode:'solo', n:1},
  {day:'2026-03-15', id:'S39_SoloVictoryCup',        mode:'solo', n:2},
  {day:'2026-03-22', id:'S40_SoloVictoryCup',        mode:'solo', n:1},
  {day:'2026-03-29', id:'S40_SoloVictoryCup',        mode:'solo', n:2},
  {day:'2026-04-05', id:'S40_SoloVictoryCup',        mode:'solo', n:3},
  {day:'2026-04-12', id:'S40_SoloVictoryCup',        mode:'solo', n:4},
  {day:'2026-06-13', id:'S41_SoloVictoryCup',        mode:'solo', n:1},
  {day:'2026-06-20', id:'S41_SoloVictoryCup',        mode:'solo', n:2},
  {day:'2026-07-18', id:'S41_SoloVictoryCup',        mode:'solo', n:3},
  {day:'2026-07-25', id:'S41_SoloVictoryCup',        mode:'solo', n:4},
  {day:'2026-08-01', id:'S41_ReloadSoloVictoryCup',  mode:'solo', n:1},
  {day:'2026-08-11', id:'S41_ReloadSoloVictoryCup',  mode:'solo', n:2},
  {day:'2026-08-15', id:'S41_ReloadSoloVictoryCup',  mode:'solo', n:3},
  // S43: Squads Victory Cup 9 и 23 ноября (календарь Epic, два раунда одним вечером). Состав на турнир — четвёрка (fmt).
  {day:'2026-11-09', id:'S43_SquadsVictoryCup',      mode:'squad', n:1, fmt:true, name:'Squads Victory Cup', cash:100},
  {day:'2026-11-23', id:'S43_SquadsVictoryCup',      mode:'squad', n:2, fmt:true, name:'Squads Victory Cup', cash:100},
  // S43: Trios Cash Cup, даты календаря Epic. Таблицы S43 в архиве нет, призы последнего Trios Cash Cup из архива Tracker (S31).
  {day:'2026-11-07', id:'S43_TriosCashCup', mode:'trio', n:1, fmt:true, name:'Trios Cash Cup', payT:CC_S43_TRIOS_PAY},
  {day:'2026-11-14', id:'S43_TriosCashCup', mode:'trio', n:2, fmt:true, name:'Trios Cash Cup', payT:CC_S43_TRIOS_PAY},
  {day:'2026-11-22', id:'S43_TriosCashCup', mode:'trio', n:3, fmt:true, name:'Trios Cash Cup', payT:CC_S43_TRIOS_PAY}
];
/* Дуо-капы с деньгами в 2025-м (с архива Tracker): Squid Grounds Cash Cup
   (S36, три капа, $100 на игрока за победу во втором раунде) и Reload Quick Cup
   (5 сентября, единственный до Лиона; $200 на игрока за победу в третьем
   раунде). Играются тем же составом, что и сезон, — как и Victory Cup в
   трио-год 2026-го. cash — на игрока; умножается на состав. */
const CC_VICTORY_2025=[
  {day:'2025-07-18', id:'S36_SquidGroundsCashCup', mode:'duo', n:1, name:'Squid Grounds Cash Cup', cash:100},
  {day:'2025-07-25', id:'S36_SquidGroundsCashCup', mode:'duo', n:2, name:'Squid Grounds Cash Cup', cash:100},
  {day:'2025-08-01', id:'S36_SquidGroundsCashCup', mode:'duo', n:3, name:'Squid Grounds Cash Cup', cash:100}
  // Reload Quick Cup 5.09 снят: Reload — только в 2026-м (отзыв).
];
// ==== Cups archive (tools/build-cups-archive.js) ====
const CC_CUPS_ARCH_PAY=[{EU:[[1,30000],[2,15000],[3,13750],[4,12500],[5,11250],[6,10000],[7,9250],[8,8500],[9,7750],[10,7000],[11,6250],[12,4750],[13,4500],[14,4250],[15,4000],[16,3750],[17,3500],[18,3250],[19,3000],[20,2750],[30,2500],[35,2000],[40,1750],[50,1000],[75,750],[100,500]]},{EU:[[1,2100],[2,1700],[3,1500],[4,1250],[5,1000],[6,850],[7,750],[8,650],[9,500],[20,400],[50,300],[100,200]],NAC:[[1,2000],[2,1500],[3,1300],[4,1200],[5,900],[6,800],[7,700],[8,600],[9,450],[20,350],[50,250]],NAW:[[1,1300],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,350],[9,300],[20,200]],OCE:[[1,1200],[2,900],[3,800],[4,650],[5,550]],BR:[[1,1300],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,350],[9,300],[20,200]],ASIA:[[1,1200],[2,900],[3,800],[4,650],[5,550]],ME:[[1,1200],[2,900],[3,800],[4,650],[5,550]]},{EU:[[1,6000],[2,5000],[3,4200],[4,3600],[5,3100],[6,2700],[7,2400],[8,2200],[9,2000],[10,1800],[20,1600],[30,1400],[40,1200],[50,1000],[75,800],[100,700],[125,600],[150,500]],NAC:[[1,5000],[2,4200],[3,3500],[4,3100],[5,2800],[6,2500],[7,2200],[8,1900],[9,1700],[10,1500],[20,1300],[30,1000],[40,900],[50,800],[75,600]],NAW:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],OCE:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]],BR:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],ASIA:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]]},{EU:[[1,5000],[2,4300],[3,3400],[4,3100],[5,2700],[6,2400],[7,2100],[8,1800],[9,1500],[10,1200],[20,1000],[30,900],[50,800],[75,600],[100,500],[200,400],[250,300],[275,200]],NAC:[[1,4000],[2,3300],[3,3000],[4,2700],[5,2400],[6,2000],[7,1800],[8,1500],[9,1200],[10,1000],[30,800],[50,600],[75,400],[150,300]],NAW:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],OCE:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]],BR:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],ASIA:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]]},{EU:[[1,3000],[3,1800],[5,1400],[8,1000],[10,600],[22,400],[30,200]],NAC:[[1,2500],[3,1500],[5,1000],[8,700],[10,500],[22,300],[30,100]],NAW:[[1,1300],[3,800],[5,500],[8,300],[10,100]],OCE:[[1,1000],[3,400],[5,200],[8,100]],BR:[[1,1300],[3,750],[5,325],[8,100]],ASIA:[[1,1300],[3,750],[5,325],[8,100]]},{EU:[[1,4500],[2,3500],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1600],[9,1500],[10,1400],[20,1300],[30,1200],[40,1100],[50,1000],[75,900],[100,700],[250,600],[500,300],[2500,200]],NAC:[[1,4000],[2,3250],[3,2750],[4,2250],[5,2000],[6,1700],[7,1600],[8,1500],[9,1400],[10,1300],[20,1200],[30,1100],[40,1000],[50,900],[75,800],[100,650],[250,450],[500,250],[1500,200]],NAW:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],OCE:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],BR:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],ASIA:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],ME:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]]},{EU:[[1,2500],[5,1500],[10,1000],[20,750],[30,400],[60,250],[90,150],[120,100]],NAC:[[1,2500],[5,1500],[10,1000],[20,500],[30,250],[60,200],[90,100]],NAW:[[1,1300],[5,800],[10,500],[20,200],[30,100]],OCE:[[1,1000],[5,500],[10,200],[20,100]],BR:[[1,1300],[5,800],[10,400],[20,100]],ASIA:[[1,1300],[5,800],[10,400],[20,100]]},{EU:[[1,1750],[5,1500],[10,1000],[16,500],[25,250]],NAC:[[1,1250],[5,1000],[10,750],[16,400],[25,150]],NAW:[[1,500],[5,400],[10,250],[25,100]],OCE:[[1,500],[5,400],[10,250],[25,100]],BR:[[1,500],[5,400],[10,250],[25,100]],ASIA:[[1,500],[5,400],[10,250],[25,100]]},{EU:[[1,10000],[2,8000],[3,7500],[4,7000],[5,6500],[6,6000],[7,5500],[8,5000],[9,4500],[10,4000],[15,2000],[20,1000],[25,500],[30,250]]},{EU:[[35,600],[400,400]],NAC:[[25,600],[250,400]],NAW:[[15,600],[95,400]],OCE:[[10,600],[45,400]],BR:[[15,600],[95,400]],ASIA:[[10,600],[45,400]],ME:[[10,600],[45,400]]},{EU:[[1,2000],[2,1750],[3,1500],[4,1350],[5,1300],[6,1250],[7,1200],[8,1150],[9,1100],[10,1000],[20,900],[30,750],[40,650],[50,550],[75,500],[100,450],[250,400],[500,300]],NAC:[[1,1750],[2,1500],[3,1350],[4,1300],[5,1250],[6,1200],[7,1150],[8,1050],[9,1000],[10,900],[20,750],[30,700],[40,550],[50,500],[75,475],[100,425],[250,375]],NAW:[[1,1500],[2,1250],[3,1150],[4,1000],[5,950],[6,900],[7,850],[8,800],[9,750],[10,700],[20,600],[30,500],[40,450],[50,425],[75,400],[100,375]],OCE:[[1,1250],[2,1000],[3,950],[4,900],[5,850],[6,800],[7,750],[8,700],[9,650],[10,600],[20,500],[30,450],[40,350],[50,250],[75,200]],BR:[[1,1500],[2,1250],[3,1150],[4,1000],[5,950],[6,900],[7,850],[8,800],[9,750],[10,700],[20,600],[30,500],[40,450],[50,425],[75,400],[100,375]],ASIA:[[1,1250],[2,1000],[3,950],[4,900],[5,850],[6,800],[7,750],[8,700],[9,650],[10,600],[20,500],[30,450],[40,350],[50,250],[75,200]],ME:[[1,1250],[2,1000],[3,950],[4,900],[5,850],[6,800],[7,750],[8,700],[9,650],[10,600],[20,500],[30,450],[40,350],[50,250],[75,200]]},{EU:[[1,12000],[2,7050],[3,5750],[4,4800],[5,3925],[6,2900],[7,2350],[8,2050],[9,1800],[10,1550],[15,1300],[20,900],[25,550],[35,400],[50,300]],NAC:[[1,7500],[2,4500],[3,3625],[4,2925],[5,2450],[6,1850],[7,1450],[8,1275],[9,1125],[10,950],[15,800],[20,500],[25,300],[35,250],[50,200]],NAW:[[1,3250],[2,2000],[3,1475],[4,1150],[5,950],[6,750],[7,625],[8,525],[9,450],[10,400],[15,300],[20,250],[25,225],[35,200]]},{EU:[[1,16000],[2,8000],[3,7400],[4,6700],[5,6100],[6,5400],[7,5000],[8,4600],[9,4100],[10,3750],[11,3300],[12,2500],[13,2400],[14,2300],[15,2100],[16,2000],[17,1900],[18,1700],[19,1600],[20,1500],[30,1300],[35,1050],[40,900],[75,400],[100,300]],NAC:[[1,10000],[2,5000],[3,4700],[4,4300],[5,3850],[6,3400],[7,3050],[8,2800],[9,2600],[10,2300],[11,2100],[12,1600],[13,1500],[14,1400],[15,1300],[16,1250],[17,1150],[18,1100],[19,1000],[20,900],[30,800],[35,650],[40,450],[75,250],[100,200]],NAW:[[1,4000],[2,2000],[3,1800],[4,1650],[5,1500],[6,1350],[7,1150],[8,1050],[9,950],[10,850],[11,750],[12,650],[13,600],[14,550],[15,500],[16,450],[17,400],[18,375],[19,350],[20,325],[30,275],[35,245],[40,225],[75,200]]},{EU:[[1,4000],[2,3500],[3,3000],[4,2000],[5,1500],[6,1200],[7,900],[8,700],[9,500],[10,400],[14,300],[30,200]],NAC:[[1,3000],[2,2500],[3,2000],[4,1500],[5,1200],[6,1000],[7,600],[8,500],[9,400],[10,300],[14,200]],NAW:[[1,1200],[2,1000],[3,800],[4,700],[5,600],[6,500],[7,400],[8,300],[9,250],[10,200]],OCE:[[1,600],[2,500],[3,500],[4,350],[5,300],[6,250],[7,200]],BR:[[1,1200],[2,1000],[3,800],[4,700],[5,600],[6,500],[7,400],[8,300],[9,250],[10,200]],ASIA:[[1,600],[2,500],[3,500],[4,350],[5,300],[6,250],[7,200]],ME:[[1,600],[2,500],[3,500],[4,350],[5,300],[6,250],[7,200]]},{EU:[[1,1800],[2,1600],[3,1400],[4,1200],[5,1000],[6,800],[7,600],[8,500],[9,400],[10,300],[20,200]],NAC:[[1,1500],[2,1200],[3,900],[4,700],[5,500],[6,400],[7,350],[8,300],[9,250],[10,200]],NAW:[[1,500],[2,400],[3,350],[4,300],[5,275],[6,250],[7,225],[8,200]],OCE:[[1,300],[2,250],[3,200]],BR:[[1,500],[2,400],[3,350],[4,300],[5,275],[6,250],[7,225],[8,200]],ASIA:[[1,300],[2,250],[3,200]],ME:[[1,300],[2,250],[3,200]]},{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[6,500],[7,400],[8,300],[9,250],[10,200]],NAC:[[1,700],[2,600],[3,500],[4,400],[5,350],[6,300],[7,250],[8,200]],NAW:[[1,400],[2,350],[3,300],[4,250],[5,200]],OCE:[[1,300],[2,250],[3,200]],BR:[[1,400],[2,350],[3,300],[4,250],[5,200]],ASIA:[[1,300],[2,250],[3,200]],ME:[[1,300],[2,250],[3,200]]},{EU:[[1,16000],[2,8000],[3,7400],[4,6700],[5,6100],[6,5400],[7,5000],[8,4600],[9,4100],[10,3750],[11,3300],[12,2500],[13,2400],[14,2300],[15,2100],[16,2000],[17,1900],[18,1700],[19,1600],[20,1500],[30,1300],[35,1050],[40,900],[50,500],[75,400],[100,300]],NAC:[[1,10000],[2,5000],[3,4700],[4,4300],[5,3850],[6,3400],[7,3050],[8,2800],[9,2600],[10,2300],[11,2100],[12,1600],[13,1500],[14,1400],[15,1300],[16,1250],[17,1150],[18,1100],[19,1000],[20,900],[30,800],[35,650],[40,450],[50,300],[75,250],[100,200]],NAW:[[1,4000],[2,2000],[3,1800],[4,1650],[5,1500],[6,1350],[7,1150],[8,1050],[9,950],[10,850],[11,750],[12,650],[13,600],[14,550],[15,500],[16,450],[17,400],[18,375],[19,350],[20,325],[30,275],[35,245],[40,225],[75,200]]},{EU:[[1,1333],[2,800],[3,600],[4,400],[5,200]]},{EU:[[1,750],[2,600],[3,550],[4,500],[5,450],[6,400],[7,375],[8,350],[9,325],[10,300],[14,275],[20,250],[30,225],[50,200]],NAC:[[1,600],[2,500],[3,450],[4,425],[5,400],[6,375],[7,350],[8,325],[9,300],[10,275],[14,250],[20,225],[30,200]],NAW:[[1,500],[2,450],[3,400],[4,375],[5,350],[6,325],[7,300],[8,275],[9,225],[10,200]],OCE:[[1,350],[2,300],[3,280],[4,260],[5,240],[6,220],[7,200]],BR:[[1,500],[2,450],[3,400],[4,375],[5,350],[6,325],[7,300],[8,275],[9,225],[10,200]],ASIA:[[1,350],[2,300],[3,280],[4,260],[5,240],[6,220],[7,200]],ME:[[1,350],[2,300],[3,280],[4,260],[5,240],[6,220],[7,200]]},{EU:[[1,300],[2,275],[3,250],[4,225],[14,200]],NAC:[[1,250],[2,225],[10,200]],NAW:[[1,250],[2,225],[4,200]],OCE:[[1,250],[2,225],[3,200]],BR:[[1,250],[2,225],[4,200]],ASIA:[[1,250],[2,225],[3,200]],ME:[[1,250],[2,225],[3,200]]},{EU:[[1,7000],[2,3250],[3,2000],[4,1500],[5,1250],[10,1000]],NAC:[[1,4375],[2,2050],[3,1250],[4,925],[5,775],[10,625]],NAW:[[1,1750],[2,825],[3,500],[4,375],[5,300],[10,250]],OCE:[[1,1250],[2,500],[3,325],[4,225],[5,200]],BR:[[1,1750],[2,825],[3,500],[4,375],[5,300],[10,250]],ASIA:[[1,1250],[2,500],[3,325],[4,225],[5,200]],ME:[[1,1250],[2,500],[3,325],[4,225],[5,200]]},{EU:[[1,14000],[2,6500],[3,4000],[4,3000],[5,2500],[10,2000]],NAC:[[1,8750],[2,4100],[3,2500],[4,1850],[5,1550],[10,1250]],NAW:[[1,3500],[2,1650],[3,1000],[4,750],[5,600],[10,500]],OCE:[[1,2500],[2,1000],[3,650],[4,450],[5,400]],BR:[[1,3500],[2,1650],[3,1000],[4,750],[5,600],[10,500]],ASIA:[[1,2500],[2,1000],[3,650],[4,450],[5,400]],ME:[[1,2500],[2,1000],[3,650],[4,450],[5,400]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1000],[6,700],[7,400],[8,200]]},{EU:[[10,250]]},{EU:[[1,400],[2,300],[3,200]],NAC:[[1,400],[2,300],[3,200]],NAW:[[1,400],[2,300],[3,200]],OCE:[[1,400],[2,300],[3,200]],BR:[[1,400],[2,300],[3,200]],ASIA:[[1,400],[2,300],[3,200]],ME:[[1,400],[2,300],[3,200]]},{EU:[[1,1334],[2,800],[3,600],[4,400],[5,200]]},{EU:[[1,5000],[2,3000],[3,2000]]},{EU:[[1,1500],[2,1300],[3,1100],[4,900],[5,800],[6,650],[7,600],[8,550],[9,530],[14,480],[25,420],[50,400]],NAC:[[1,1350],[2,1200],[3,1000],[4,800],[5,700],[6,650],[7,600],[8,550],[9,500],[14,450],[25,400]],NAW:[[1,1250],[2,1100],[3,950],[4,900],[5,800]],OCE:[[1,600],[2,550],[3,500],[4,450],[5,400]],BR:[[1,1250],[2,1100],[3,950],[4,900],[5,800]],ASIA:[[1,600],[2,550],[3,500],[4,450],[5,400]],ME:[[1,600],[2,550],[3,500],[4,450],[5,400]]},{EU:[[1,375]],NAC:[[1,375]],NAW:[[1,375]],OCE:[[1,375]],BR:[[1,375]],ASIA:[[1,375]],ME:[[1,375]]},{EU:[[1,3000],[2,2300],[3,2000],[4,1800],[5,1700],[6,1600],[7,1500],[8,1400],[9,1200],[10,1100],[20,900],[30,800],[40,700],[50,600],[75,500],[100,400],[250,350],[500,250],[1000,225],[1500,200]],NAC:[[1,2500],[2,2000],[3,1875],[4,1700],[5,1600],[6,1500],[7,1400],[8,1300],[9,1100],[10,900],[20,800],[30,700],[40,500],[50,400],[75,300],[100,275],[250,250],[500,225],[1000,200]],NAW:[[1,1200],[2,900],[3,715],[4,600],[5,550],[6,500],[7,450],[8,400],[9,375],[10,350],[20,325],[30,300],[40,275],[50,250],[75,230],[100,220],[250,210],[500,200]],OCE:[[1,500],[2,400],[3,300],[4,275],[5,265],[6,255],[7,250],[8,245],[9,240],[10,235],[20,230],[30,225],[40,220],[50,215],[75,210],[100,205],[250,200]],BR:[[1,1200],[2,900],[3,715],[4,600],[5,550],[6,500],[7,450],[8,400],[9,375],[10,350],[20,325],[30,300],[40,275],[50,250],[75,230],[100,220],[250,210],[500,200]],ASIA:[[1,500],[2,400],[3,300],[4,275],[5,265],[6,255],[7,250],[8,245],[9,240],[10,235],[20,230],[30,225],[40,220],[50,215],[75,210],[100,205],[250,200]],ME:[[1,500],[2,400],[3,300],[4,275],[5,265],[6,255],[7,250],[8,245],[9,240],[10,235],[20,230],[30,225],[40,220],[50,215],[75,210],[100,205],[250,200]]},{EU:[[1,750],[2,650],[3,550],[4,475],[5,400],[6,325],[7,300],[8,275],[9,265],[14,240],[25,210],[50,200]],NAC:[[1,675],[2,600],[3,500],[4,400],[5,350],[6,325],[7,300],[8,275],[9,250],[14,225],[25,200]],NAW:[[1,625],[2,550],[3,475],[4,450],[5,400]],OCE:[[1,300],[2,275],[3,250],[4,225],[5,200]],BR:[[1,625],[2,550],[3,475],[4,450],[5,400]],ASIA:[[1,300],[2,275],[3,250],[4,225],[5,200]],ME:[[1,300],[2,275],[3,250],[4,225],[5,200]]},{EU:[[1,11500],[2,7000],[3,5400],[4,4600],[5,3775],[6,2750],[7,2200],[8,1925],[9,1650],[10,1450],[15,1200],[20,850],[25,500],[35,375],[50,250]],NAC:[[1,6750],[2,4000],[3,3300],[4,2650],[5,2225],[6,1700],[7,1325],[8,1175],[9,1025],[10,850],[15,725],[20,450],[25,275],[35,225],[50,200]]},{EU:[[1,4667],[2,2167],[3,1334],[4,1000],[5,834],[6,667],[7,667],[8,667],[9,667],[10,667]],NAC:[[1,2917],[2,1367],[3,834],[4,617],[5,517],[6,417],[7,417],[8,417],[9,417],[10,417]],NAW:[[1,1167],[2,550],[3,334],[4,250],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],OCE:[[1,834],[2,334],[3,217],[4,200],[5,200]],BR:[[1,1167],[2,550],[3,334],[4,250],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ASIA:[[1,834],[2,334],[3,217],[4,200],[5,200]],ME:[[1,834],[2,334],[3,217],[4,200],[5,200]]},{EU:[[1,10000],[2,5000],[3,2500],[4,1500],[5,1000]],NAC:[[1,5000],[2,2500],[3,1250],[4,750],[5,500]],NAW:[[1,2500],[2,1500],[3,1000]],OCE:[[1,1500],[2,700],[3,300]],BR:[[1,4000],[2,2000],[3,1000],[4,500]],ASIA:[[1,1500],[2,700],[3,300]],ME:[[1,1500],[2,700],[3,300]]},{EU:[[1,300],[2,200],[3,200],[4,200]],NAW:[[1,200],[2,200]],OCE:[[1,200]],BR:[[1,200],[2,200]],ASIA:[[1,200],[2,200]],ME:[[1,200]]},{EU:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],NAC:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],NAW:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],OCE:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],BR:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ASIA:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ME:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]]},{EU:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],NAC:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],NAW:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],OCE:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],BR:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],ASIA:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],ME:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]]},{EU:[[1,400],[2,200],[3,200],[4,200],[5,200]],NAC:[[1,400],[2,200],[3,200],[4,200],[5,200]],NAW:[[1,400],[2,200],[3,200],[4,200],[5,200]],OCE:[[1,400],[2,200],[3,200],[4,200],[5,200]],BR:[[1,400],[2,200],[3,200],[4,200],[5,200]],ASIA:[[1,400],[2,200],[3,200],[4,200],[5,200]],ME:[[1,400],[2,200],[3,200],[4,200],[5,200]]},{EU:[[1,300],[4,200]],NAC:[[1,250],[4,200]],NAW:[[2,200]],OCE:[[1,200]],BR:[[2,200]],ASIA:[[2,200]],ME:[[1,200]]},{EU:[[1,12000],[2,6000],[3,5500],[4,5000],[5,4500],[6,4000],[7,3700],[8,3400],[9,3100],[10,2800],[11,2500],[12,1900],[13,1800],[14,1700],[15,1600],[16,1500],[17,1400],[18,1300],[19,1200],[20,1100],[30,1000],[35,800],[40,700],[50,400],[75,300],[100,200]]},{EU:[[5,200]],NAW:[[3,200]],OCE:[[2,200]],BR:[[3,200]],ASIA:[[3,200]],ME:[[2,200]]},{EU:[[5,600]],NAC:[[3,600]],NAW:[[3,600]],OCE:[[2,600]],BR:[[3,600]],ASIA:[[3,600]],ME:[[2,600]]},{EU:[[5,200]],NAC:[[4,200]],NAW:[[4,200]],OCE:[[2,200]],BR:[[4,200]],ASIA:[[4,200]],ME:[[2,200]]},{EU:[[100,100],[200,200],[300,300]],OCE:[[100,100],[200,200],[300,300]],BR:[[100,100],[200,200],[300,300]],ASIA:[[100,100],[200,200],[300,300]],ME:[[100,100],[200,200],[300,300]],NAC:[[100,100],[200,200],[300,300]]},{EU:[[3,500],[5,400],[10,300],[20,250],[25,200]]},{EU:[[3,250],[5,200],[10,150],[20,125],[25,100]]},{EU:[[1,1200]],OCE:[[1,250]],BR:[[1,400]],ASIA:[[1,400]],ME:[[1,250]]},{EU:[[1,200],[2,200],[3,200],[4,200],[5,200]],NAC:[[1,200],[2,200],[3,200],[4,200],[5,200]]},{EU:[[1,3000],[2,1800],[3,1200],[4,300],[5,300],[6,300],[7,300],[8,300],[9,300],[10,300],[11,300],[12,300],[13,300],[14,300],[15,300],[16,150],[17,150],[18,150],[19,150],[20,150],[21,150],[22,150],[23,150],[24,150],[25,150],[26,150],[27,150],[28,150],[29,150],[30,150]],NAC:[[1,2000],[2,1200],[3,800],[4,400],[5,400],[6,150],[7,150],[8,150],[9,150],[10,150],[11,150],[12,150],[13,150],[14,150],[15,150]],NAW:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],OCE:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],BR:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ASIA:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ME:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]]},{EU:[[1,1000],[2,750],[3,500],[4,300],[5,300],[6,300],[7,300],[8,300],[9,300],[10,300]],NAC:[[1,750],[2,500],[3,300],[4,300],[5,300],[6,300],[7,300],[8,300],[9,300],[10,300]],NAW:[[1,500],[2,300],[3,300],[4,300],[5,300]],OCE:[[1,500],[2,300],[3,300],[4,300],[5,300]],BR:[[1,500],[2,300],[3,300],[4,300],[5,300]],ASIA:[[1,500],[2,300],[3,300],[4,300],[5,300]],ME:[[1,500],[2,300],[3,300],[4,300],[5,300]]},{EU:[[1,3000],[2,1000],[3,750],[10,300],[15,250],[25,150]],OCE:[[1,600],[2,300],[3,200],[25,100]],BR:[[1,600],[2,300],[3,200],[25,100]],ASIA:[[1,600],[2,300],[3,200],[25,100]],ME:[[1,600],[2,300],[3,200],[25,100]],NAC:[[1,3000],[2,1000],[3,750],[10,300],[15,250],[25,150]]},{EU:[[1,600],[2,300],[10,200]],OCE:[[1,300],[2,200],[3,150],[10,100]],BR:[[1,300],[2,200],[3,150],[10,100]],ASIA:[[1,300],[2,200],[3,150],[10,100]],ME:[[1,300],[2,200],[3,150],[10,100]],NAC:[[1,600],[2,300],[10,200]]},{EU:[[1,1000],[2,750],[3,500],[8,250],[10,125]],OCE:[[1,375],[2,200],[3,150],[6,125],[10,100]],BR:[[1,375],[2,200],[3,150],[6,125],[10,100]],ASIA:[[1,375],[2,200],[3,150],[6,125],[10,100]],ME:[[1,375],[2,200],[3,150],[6,125],[10,100]],NAC:[[1,1000],[2,750],[3,500],[8,250],[10,125]]},{EU:[[1,4000],[2,1250],[3,900],[10,400],[15,300],[25,150]],OCE:[[1,625],[2,400],[3,300],[5,200],[25,100]],BR:[[1,625],[2,400],[3,300],[5,200],[25,100]],ASIA:[[1,625],[2,400],[3,300],[5,200],[25,100]],ME:[[1,625],[2,400],[3,300],[5,200],[25,100]],NAC:[[1,4000],[2,1250],[3,900],[10,400],[15,225],[25,100]]},{EU:[[100,250],[200,500],[300,750]],OCE:[[100,100],[200,200],[300,300]],BR:[[100,100],[200,200],[300,300]],ASIA:[[100,100],[200,200],[300,300]],ME:[[100,100],[200,200],[300,300]],NAC:[[100,250],[200,500],[300,750]]},{EU:[[100,100],[200,200],[300,300]],NAW:[[100,100],[200,200],[300,300]],OCE:[[100,100],[200,200],[300,300]],BR:[[100,100],[200,200],[300,300]],ASIA:[[100,100],[200,200],[300,300]],ME:[[100,100],[200,200],[300,300]],NAC:[[100,100],[200,200],[300,300]]},{EU:[[1,10000],[2,5000],[3,2500],[4,2000],[5,1500],[10,1000],[50,500],[100,250],[1000,100],[2000,50]],NAW:[[1,4000],[2,2000],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,150],[200,100],[500,50]],OCE:[[1,2500],[2,1500],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,100],[250,50]],BR:[[1,4000],[2,2000],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,150],[200,100],[500,50]],ASIA:[[1,2500],[2,1500],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,100],[250,50]],ME:[[1,2500],[2,1500],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,100],[250,50]],NAC:[[1,8000],[2,4000],[3,2000],[4,1500],[5,1000],[10,800],[50,400],[100,200],[600,100],[1200,50]]},{EU:[[100,200],[200,400],[300,600]],NAW:[[100,200],[200,400],[300,600]],OCE:[[100,200],[200,400],[300,600]],BR:[[100,200],[200,400],[300,600]],ASIA:[[100,200],[200,400],[300,600]],ME:[[100,200],[200,400],[300,600]],NAC:[[100,200],[200,400],[300,600]]},{EU:[[1,4000],[2,3000],[3,2000],[4,1500],[5,1250],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[50,300],[75,200],[100,100]],NAW:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],OCE:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],BR:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],ASIA:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],ME:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],NAC:[[1,2500],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,450],[8,400],[9,350],[10,300],[20,250],[30,200],[50,150],[75,100]]},{EU:[[1,4000],[2,2000],[3,1200],[4,800],[5,600],[7,500],[10,400],[20,300],[40,200]],NAW:[[1,1500],[2,1000],[3,500],[4,300],[5,200],[10,150],[20,100]],OCE:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]],BR:[[1,1500],[2,1000],[3,500],[4,300],[5,200],[10,150],[20,100]],ASIA:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]],ME:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]],NAC:[[1,3000],[2,1500],[3,900],[4,600],[5,450],[7,375],[10,300],[20,225],[40,150]]},{EU:[[1,15000],[2,10000],[3,9000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[25,1000],[50,750],[75,500],[100,250]],NAW:[[1,4000],[2,2000],[3,1000],[5,750],[10,500],[25,400],[50,300],[75,200]],OCE:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]],BR:[[1,4000],[2,2000],[3,1000],[5,750],[10,500],[25,400],[50,300],[75,200]],ASIA:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]],ME:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]],NAC:[[1,10000],[2,8000],[3,6000],[4,5000],[5,4000],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[25,750],[50,500],[75,300],[100,200]]},{EU:[[1,3750],[2,3000],[3,2200],[4,2000],[5,1800],[6,1700],[7,1600],[8,1500],[9,1400],[10,1300],[20,1100],[30,1000],[40,800],[50,700],[75,550],[100,450],[250,375],[500,250]],NAC:[[1,4000],[2,3250],[3,2750],[4,2250],[5,2000],[6,1700],[7,1600],[8,1500],[9,1400],[10,1300],[20,1200],[30,1100],[40,1000],[50,900],[75,800],[100,650],[250,450],[500,250],[1500,200]],NAW:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],OCE:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],BR:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],ASIA:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],ME:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]]},{EU:[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,700],[30,600],[40,500],[50,400],[75,350],[100,300],[250,250],[1000,200]],NAC:[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[1000,250],[1500,200]],NAW:[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,700],[30,600],[40,500],[50,400],[75,350],[100,300],[250,250],[750,200]],OCE:[[1,3500],[2,3000],[3,2500],[4,2250],[5,2000],[6,1800],[7,1500],[8,1300],[9,1000],[10,900],[20,700],[30,500],[40,400],[50,300],[75,250],[100,200]],BR:[[1,3500],[2,3000],[3,2500],[4,2250],[5,2000],[6,1800],[7,1500],[8,1300],[9,1000],[10,900],[20,700],[30,500],[40,400],[50,300],[75,250],[100,200]],ASIA:[[1,3500],[2,3000],[3,2500],[4,2250],[5,2000],[6,1800],[7,1500],[8,1300],[9,1000],[10,900],[20,700],[30,500],[40,400],[50,300],[75,250],[100,200]]},{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[6,500],[7,400],[8,350],[9,250],[15,200]],NAC:[[1,1600],[2,1100],[3,900],[4,700],[5,500],[10,300],[20,200]],NAW:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],OCE:[[1,500],[2,400],[3,300],[5,200]],BR:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],ASIA:[[1,500],[2,400],[3,300],[5,200]],ME:[[1,500],[2,400],[3,300],[5,200]]},{EU:[[1,1800],[2,1200],[3,800],[4,600],[5,400],[20,300],[40,200]],NAC:[[1,1600],[2,1100],[3,900],[4,700],[5,500],[10,300],[20,200]],NAW:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],OCE:[[1,500],[2,400],[3,300],[5,200]],BR:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],ASIA:[[1,500],[2,400],[3,300],[5,200]],ME:[[1,500],[2,400],[3,300],[5,200]]},{EU:[[1,3000],[2,2500],[3,2000],[4,1500],[5,1200],[6,900],[7,800],[8,700],[9,600],[10,500],[11,400],[12,350],[13,300],[14,250],[20,200]],NAC:[[1,2000],[2,1600],[3,1200],[4,900],[5,800],[6,700],[7,600],[8,500],[9,400],[10,300],[15,200]],NAW:[[1,700],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200]],OCE:[[1,600],[2,500],[3,400],[4,300],[5,200]],BR:[[1,700],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200]],ASIA:[[1,600],[2,500],[3,400],[4,300],[5,200]],ME:[[1,600],[2,500],[3,400],[4,300],[5,200]]},{EU:[[1,7200],[2,5500],[3,4500],[4,3000],[5,2500],[6,2000],[7,1750],[8,1500],[9,1000],[10,800],[20,400],[33,300]],NAC:[[1,3200],[2,2400],[3,2000],[4,1200],[5,900],[6,700],[7,600],[8,500],[9,400],[10,350],[20,300],[33,200]],NAW:[[1,1400],[2,1000],[3,900],[4,600],[5,500],[6,400],[7,350],[8,300],[9,250],[15,200]],OCE:[[1,750],[2,500],[5,200]],BR:[[1,1800],[2,1500],[3,1000],[4,800],[5,700],[6,500],[7,400],[8,350],[9,325],[10,300],[20,250],[25,200]],ASIA:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],ME:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},{EU:[[1,4200],[2,3000],[3,2200],[4,1600],[5,1400],[6,1200],[7,1000],[8,900],[9,800],[10,700],[11,600],[12,500],[13,400],[14,300],[20,200]],NAC:[[1,2500],[2,1400],[3,1150],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,450],[11,400],[12,350],[13,300],[14,250],[20,200]],NAW:[[1,1000],[2,600],[3,450],[4,400],[5,350],[6,300],[7,275],[8,225],[15,200]],OCE:[[1,450],[2,300],[3,275],[4,250],[5,225],[10,200]],BR:[[1,1000],[2,600],[3,450],[4,400],[5,350],[6,300],[7,275],[8,225],[15,200]],ASIA:[[1,450],[2,300],[3,275],[4,250],[5,225],[10,200]],ME:[[1,450],[2,300],[3,275],[4,250],[5,225],[10,200]]},{EU:[[1,5000],[2,3000],[3,1800],[4,1600],[5,1400],[6,1200],[7,1000],[8,800],[9,600],[10,400]],NAC:[[1,2600],[2,1800],[3,1200],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,400]],NAW:[[1,1100],[2,900],[3,700],[4,600],[5,500],[6,400]],OCE:[[1,900],[2,700],[3,500]],BR:[[1,1100],[2,900],[3,700],[4,600],[5,500],[6,400]],ASIA:[[1,900],[2,700],[3,500]],ME:[[1,900],[2,700],[3,500]]},{EU:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAC:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAW:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],OCE:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,300],[20,200]],BR:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],ASIA:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,300],[20,200]],ME:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,300],[20,200]]},{EU:[[1,7000],[2,5500],[3,4500],[4,3000],[5,2500],[6,2000],[7,1750],[8,1500],[9,1000],[10,800],[20,400],[33,300]],NAC:[[1,3500],[2,2800],[3,2300],[4,1500],[5,1000],[6,800],[7,600],[8,500],[9,400],[10,350],[20,300],[33,200]],NAW:[[1,1600],[2,1200],[3,1000],[4,650],[5,500],[6,400],[7,350],[8,300],[9,250],[10,225],[20,200]],OCE:[[1,750],[2,500],[5,200]],BR:[[1,1600],[2,1200],[3,1000],[4,650],[5,500],[6,400],[7,350],[8,300],[9,250],[10,225],[20,200]],ASIA:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],ME:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[100,200]],ASIA:[[1,1000],[2,850],[3,800],[4,750],[5,700],[6,650],[7,600],[8,550],[9,500],[10,450],[50,400],[100,200]]},{EU:[[1,6000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],NAC:[[1,2800],[2,2200],[3,2000],[4,1800],[5,1600],[6,1400],[7,1200],[8,1000],[9,800],[10,600],[20,500],[30,350],[40,250],[45,200]],NAW:[[1,1000],[2,900],[3,800],[4,600],[5,500],[6,450],[7,425],[8,400],[9,375],[10,350],[15,300],[20,250],[30,200]],OCE:[[1,700],[2,500],[3,300],[15,200]],BR:[[1,2000],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,475],[8,450],[9,425],[10,400],[15,350],[20,300],[30,250],[40,225]],ASIA:[[1,800],[2,600],[3,500],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[50,400]],NAC:[[1,1600],[2,1400],[3,1300],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400]],NAW:[[1,1400],[2,1200],[3,1100],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[15,400]],OCE:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400]],BR:[[1,1500],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[25,400]],ME:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400]]},{EU:[[1,7000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],NAC:[[1,3750],[2,2200],[3,2000],[4,1800],[5,1600],[6,1400],[7,1200],[8,1000],[9,800],[10,600],[20,500],[30,350],[40,250],[50,200]],NAW:[[1,1800],[2,1200],[3,900],[4,700],[5,600],[6,500],[7,450],[8,400],[9,375],[10,350],[15,300],[20,250]],OCE:[[1,750],[2,550],[3,450],[4,400],[5,400],[6,350],[7,300],[8,275],[9,225],[15,200]],BR:[[1,1800],[2,1200],[3,900],[4,700],[5,600],[6,500],[7,450],[8,400],[9,375],[10,350],[15,300],[20,250]],ASIA:[[1,1800],[2,1200],[3,900],[4,700],[5,600],[6,500],[7,450],[8,400],[9,375],[10,350],[15,300],[20,250]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[100,200]],NAC:[[1,1600],[2,1400],[3,1300],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[50,400],[100,200]],NAW:[[1,1400],[2,1200],[3,1100],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,450],[50,400],[100,200]],OCE:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]],BR:[[1,1500],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[100,200]],ME:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]]},{EU:[[1,2500],[2,1500],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200]],NAC:[[1,1300],[2,900],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200]],NAW:[[1,550],[2,450],[3,350],[4,300],[5,250],[6,200]],OCE:[[1,450],[2,350],[3,250]],BR:[[1,550],[2,450],[3,350],[4,300],[5,250],[6,200]],ASIA:[[1,450],[2,350],[3,250]],ME:[[1,450],[2,350],[3,250]]},{EU:[[10,200]],NAC:[[10,200]],NAW:[[10,200]],OCE:[[10,200]],BR:[[10,200]],ASIA:[[10,200]],ME:[[10,200]]},{EU:[[1,1000],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[50,200]],NAC:[[1,800],[2,700],[3,650],[4,600],[5,550],[6,500],[7,450],[8,400],[9,350],[10,300],[20,250],[30,200]],NAW:[[1,700],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[15,200]],OCE:[[1,500],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],BR:[[1,750],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[25,200]],ASIA:[[1,500],[2,425],[3,400],[4,375],[5,350],[6,325],[7,300],[8,275],[9,250],[10,225],[50,200]],ME:[[1,500],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},{EU:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAC:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAW:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],OCE:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[9,300],[20,200]],BR:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],ME:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[9,300],[20,200]]},{EU:[[1,975],[2,700],[3,650],[4,600],[5,550],[6,500],[7,400],[8,250],[9,200],[10,175],[15,125]],OCE:[[1,325],[2,225],[3,150],[4,125],[5,100]],BR:[[1,250],[2,200],[5,150],[7,125],[8,100]],ASIA:[[1,250],[2,200],[5,150],[7,125],[8,100]],ME:[[1,325],[2,225],[3,150],[4,125],[5,100]],NAC:[[1,975],[2,700],[3,650],[4,600],[5,550],[6,500],[7,400],[8,250],[9,200],[10,175],[15,125]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],OCE:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],BR:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ASIA:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ME:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],NAC:[[1,2500],[2,1500],[3,1200],[4,1000],[5,900],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[60,200],[75,150],[100,100]]},{EU:[[1,3500],[2,2750],[3,2500],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,600],[15,450],[20,375],[25,300],[30,250],[40,200],[50,175]],OCE:[[1,375],[2,275],[3,225],[4,200],[5,175],[7,150],[9,125],[15,100]],BR:[[1,900],[2,600],[3,450],[4,350],[5,300],[6,250],[7,225],[8,200],[10,175],[15,150],[20,125]],ASIA:[[1,900],[2,600],[3,450],[4,350],[5,300],[6,250],[7,225],[8,200],[10,175],[15,150],[20,125]],ME:[[1,375],[2,275],[3,225],[4,200],[5,175],[7,150],[9,125],[15,100]],NAC:[[1,2750],[2,1700],[3,1450],[4,1250],[5,1100],[6,950],[7,825],[8,700],[9,600],[10,475],[15,400],[20,375],[30,175],[50,125]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],ASIA:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],OCE:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],BR:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ME:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]]},{EU:[[1,5000],[2,4000],[3,2500],[4,2300],[5,2200],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[20,1000],[30,800],[60,600],[100,200]],ASIA:[[1,1000],[2,850],[3,800],[4,750],[5,700],[6,650],[7,600],[8,550],[9,500],[10,450],[50,400],[100,200]]},{EU:[[1,6000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],OCE:[[1,700],[2,500],[3,300],[15,200]],BR:[[1,2000],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,475],[8,450],[9,425],[10,400],[15,350],[20,300],[30,250],[40,225]],ASIA:[[1,800],[2,600],[3,500],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]],NAC:[[1,5550],[2,3400],[3,2900],[4,2500],[5,2200],[6,1900],[7,1650],[8,1400],[9,1175],[10,950],[15,800],[20,750],[30,350],[40,250],[50,200]]},{EU:[[1,6000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],OCE:[[1,700],[2,500],[3,300],[15,200]],BR:[[1,2000],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,475],[8,450],[9,425],[10,400],[15,350],[20,300],[30,250],[40,225]],ASIA:[[1,800],[2,600],[3,500],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]],NAC:[[1,5500],[2,3400],[3,2900],[4,2500],[5,2200],[6,1900],[7,1650],[8,1400],[9,1175],[10,950],[15,800],[20,750],[30,350],[40,250],[50,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[100,200]],NAC:[[1,1600],[2,1400],[3,1300],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[50,400],[100,200]],NAW:[[1,1400],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[100,200]],OCE:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]],BR:[[1,1500],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[100,200]],ASIA:[[1,1000],[2,850],[3,800],[4,750],[5,700],[6,650],[7,600],[8,550],[9,500],[10,450],[50,400],[100,200]],ME:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]]},{EU:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[50,1000],[100,750]],NAW:[[1,3000],[2,1750],[3,1250],[5,750],[40,500]],OCE:[[1,1500],[2,875],[3,625],[5,375],[40,250]],BR:[[1,3000],[2,1750],[3,1250],[5,750],[40,500]],ASIA:[[1,1500],[2,875],[3,625],[5,375],[40,250]],ME:[[1,1500],[2,875],[3,625],[5,375],[40,250]],NAC:[[1,5000],[2,3000],[3,2000],[5,1250],[10,1000],[50,750],[100,300]]},{EU:[[1,1500],[2,500],[3,300],[10,100]],OCE:[[1,300],[2,200],[3,150],[5,100],[10,50]],BR:[[1,300],[2,200],[3,150],[5,100],[10,50]],ASIA:[[1,300],[2,200],[3,150],[5,100],[10,50]],ME:[[1,300],[2,200],[3,150],[5,100],[10,50]],NAC:[[1,1500],[2,500],[3,300],[10,100]]},{EU:[[1,325],[2,200],[3,150]],OCE:[[1,325],[2,200],[3,150]],BR:[[1,325],[2,200],[3,150]],ASIA:[[1,325],[2,200],[3,150]],ME:[[1,325],[2,200],[3,150]],NAC:[[1,325],[2,200],[3,150]]},{EU:[[1,2500],[2,675],[3,450],[10,225]],OCE:[[1,325],[2,200],[3,150],[5,100],[10,50]],BR:[[1,325],[2,200],[3,150],[5,100],[10,50]],ASIA:[[1,325],[2,200],[3,150],[5,100],[10,50]],ME:[[1,325],[2,200],[3,150],[5,100],[10,50]],NAC:[[1,2500],[2,675],[3,450],[10,225]]},{EU:[[1,6000],[2,4000],[3,3000],[4,2400],[5,2200],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[20,1000],[30,800],[60,600],[75,300],[100,200]],OCE:[[1,1300],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[100,200]],BR:[[1,2000],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[75,300],[100,200]],ASIA:[[1,2000],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[75,300],[100,200]],ME:[[1,1300],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[100,200]],NAC:[[1,5000],[2,3000],[3,2400],[4,2000],[5,1800],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[75,300],[100,200]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],ASIA:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],NAC:[[1,2500],[2,1500],[3,1200],[4,1000],[5,900],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[60,200],[75,150],[100,100]]},{EU:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]],OCE:[[1,625],[2,400],[3,300],[5,200],[40,100]],BR:[[1,625],[2,400],[3,300],[5,200],[40,100]],ASIA:[[1,625],[2,400],[3,300],[5,200],[40,100]],ME:[[1,625],[2,400],[3,300],[5,200],[40,100]],NAC:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],OCE:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],BR:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ME:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],NAC:[[1,2500],[2,1500],[3,1200],[4,1000],[5,900],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[60,200],[75,150],[100,100]]},{EU:[[1,4000],[2,3000],[3,2250],[4,1250],[5,1000],[10,500],[15,400],[20,300]],NAW:[[1,1000],[2,750],[3,500],[4,400],[5,300],[6,250],[20,200]],OCE:[[1,750],[2,600],[3,450],[5,300],[7,250],[10,200]],BR:[[1,1000],[2,750],[3,500],[4,400],[5,300],[6,250],[20,200]],ASIA:[[1,750],[2,600],[3,450],[5,300],[7,250],[10,200]],ME:[[1,750],[2,600],[3,450],[5,300],[7,250],[10,200]],NAC:[[1,2000],[2,1250],[3,1000],[4,750],[5,500],[10,400],[15,300],[20,200]]},{EU:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],NAW:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],OCE:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],BR:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ASIA:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ME:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],NAC:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]]},{EU:[[1,5500],[2,3500],[3,2500],[4,1500],[5,1000],[50,800],[100,600]],NAW:[[1,2500],[2,1250],[3,1000],[4,750],[5,500],[40,400]],OCE:[[1,1250],[2,750],[3,500],[5,250],[40,200]],BR:[[1,2500],[2,1250],[3,1000],[4,750],[5,500],[40,400]],ASIA:[[1,1250],[2,750],[3,500],[5,250],[40,200]],ME:[[1,1250],[2,750],[3,500],[5,250],[40,200]],NAC:[[1,4000],[2,2500],[3,1500],[5,1000],[10,800],[50,600],[100,240]]},{EU:[[1,1500],[2,1000],[3,800],[4,600],[5,500],[6,450],[7,400],[8,350],[9,325],[10,300],[11,275],[12,250],[13,225],[14,200],[15,175],[16,150]],NAW:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],OCE:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],BR:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ASIA:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ME:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],NAC:[[1,1500],[2,1000],[3,800],[4,600],[5,500],[6,450],[7,400],[8,350],[9,325],[10,300],[11,275],[12,250],[13,225],[14,200],[15,175],[16,150]]},{EU:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[50,1000],[100,750]],ASIA:[[1,1500],[2,875],[3,625],[5,375],[40,250]],NAC:[[1,5000],[2,3000],[3,2000],[5,1250],[10,1000],[50,750],[100,300]]},{EU:[[1,20000],[2,16000],[3,12000],[4,8000],[5,6000],[6,6000],[7,4000],[8,4000],[9,4000],[10,4000],[11,2000],[12,2000],[13,2000],[14,2000],[15,2000],[16,2000],[17,1000],[18,1000],[19,1000],[20,1000]]},{EU:[[1,40000],[2,32000],[3,24000],[4,16000],[5,12000],[6,12000],[7,8000],[8,8000],[9,8000],[10,8000],[11,4000],[12,4000],[13,4000],[14,4000],[15,4000],[16,4000],[17,2000],[18,2000],[19,2000],[20,2000]]},{EU:[[1,39000],[2,32333],[3,29333],[4,29333],[5,26833],[6,23000],[7,20750],[8,20500],[9,17750],[10,12333],[11,11000],[12,9167],[13,8500],[14,8333],[15,6833],[16,4667],[17,4333],[18,4333],[19,4167],[20,3500],[21,2667],[22,2667],[23,2000],[24,2000],[25,1750],[26,1500],[27,1417],[28,1333],[29,1333],[30,1333]]},{EU:[[1,8000],[2,4000],[3,2500],[4,1500],[5,1000],[6,1000],[7,750],[8,750],[9,750],[10,750],[11,500],[12,500],[13,500],[14,500],[15,500],[16,300],[17,300],[18,300],[19,300],[20,300],[21,200],[22,200],[23,200],[24,200],[25,200]]},{EU:[[1,50000],[2,20000],[3,10000]]},{EU:[[1,125000],[2,75000],[3,50000],[4,37500],[5,25000],[6,20000],[7,15000],[8,12500],[9,10000],[10,7500],[11,5400],[12,5200],[13,5000],[14,4850],[15,4700],[16,4550],[17,4450],[18,4350],[19,4250],[20,4150],[21,4050],[22,3950],[23,3850],[24,3750],[25,3650],[26,3550],[27,3450],[28,3350],[29,3250],[30,3200],[31,3150],[32,3100],[33,3050],[34,3000],[35,2950],[36,2900],[37,2850],[38,2800],[39,2750],[40,2700],[41,2650],[42,2600],[43,2550],[44,2500]]},{EU:[[1,14000],[2,9000],[3,7000],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[11,1600],[12,1600],[13,1300],[14,1300],[15,1300],[16,1000],[17,1000],[18,1000],[19,1000],[20,1000]]},{EU:[[1,12000],[2,6000],[3,5500],[4,5000],[5,4500],[6,4000],[7,3700],[8,3400],[9,3100],[10,2800],[11,2500],[12,1900],[13,1800],[14,1700],[15,1600],[16,1500],[17,1400],[18,1300],[19,1200],[20,1100],[21,1000],[22,1000],[23,1000],[24,1000],[25,1000],[26,1000],[27,1000],[28,1000],[29,1000],[30,1000],[31,800],[32,800],[33,800],[34,800],[35,800],[36,700],[37,700],[38,700],[39,700],[40,700],[41,400],[42,400],[43,400],[44,400],[45,400],[46,400],[47,400],[48,400],[49,400],[50,400],[51,300],[52,300],[53,300],[54,300],[55,300],[56,300],[57,300],[58,300],[59,300],[60,300],[61,300],[62,300],[63,300],[64,300],[65,300],[66,300],[67,300],[68,300],[69,300],[70,300],[71,300],[72,300],[73,300],[74,300],[75,300],[76,200],[77,200],[78,200],[79,200],[80,200],[81,200],[82,200],[83,200],[84,200],[85,200],[86,200],[87,200],[88,200],[89,200],[90,200],[91,200],[92,200],[93,200],[94,200],[95,200],[96,200],[97,200],[98,200],[99,200],[100,200]]},{EU:[[1,12000],[2,6000],[3,5500],[4,5000],[5,4500],[6,4000],[7,3700],[8,3400],[9,3100],[10,2800],[11,2500],[12,1900],[13,1800],[14,1700],[15,1600],[16,1500],[17,1400],[18,1300],[19,1200],[20,1100],[21,1000],[22,1000],[23,1000],[24,1000],[25,1000],[26,1000],[27,1000],[28,1000],[29,1000],[30,1000],[31,800],[32,800],[33,800],[34,800],[35,800],[36,700],[37,700],[38,700],[39,700],[40,700],[41,400],[42,400],[43,400],[44,400],[45,400],[46,400],[47,400],[48,400],[49,400],[50,400],[51,300],[52,300],[53,300],[54,300],[55,300],[56,300],[57,300],[58,300],[59,300],[60,300],[61,300],[62,300],[63,300],[64,300],[65,300],[66,300],[67,300],[68,300],[69,300],[70,300],[71,300],[72,300],[73,300],[74,300],[75,300],[76,200],[77,200],[78,200],[79,200],[80,200],[81,200],[82,200],[83,200],[84,200],[85,200],[86,200],[87,200],[88,200],[89,200],[90,200],[91,200],[92,200],[93,200],[94,200],[95,200],[96,200],[97,200],[98,200],[99,200]]},{EU:[[1,21382],[2,15722],[3,11320],[4,8175],[5,6289],[6,5345],[7,4402],[8,3773],[9,3459],[10,3144],[11,2830],[12,2390],[13,2264],[14,2138],[15,2012],[16,1887],[17,1761],[18,1635],[19,1509],[20,1384],[21,943],[22,943],[23,943],[24,943],[25,943],[26,943],[27,943],[28,943],[29,943],[30,943],[31,943],[32,943],[33,943],[34,943],[35,943],[36,943],[37,943],[38,943],[39,943],[40,943],[41,440],[42,440],[43,440],[44,440],[45,440],[46,440],[47,440],[48,440],[49,440],[50,440]]},{EU:[[1,2500],[2,2400],[3,2300],[4,2200],[5,2200],[6,2100],[7,2100],[8,2100],[9,2100],[10,2000],[11,2000],[12,2000],[13,2000],[14,1900],[15,1900],[16,1900],[17,1900],[18,1900]]},{EU:[[1,25000],[2,22500],[3,20000],[4,17500],[5,15000],[6,12500],[7,12500],[8,12500],[9,12500],[10,12500],[11,10000],[12,10000],[13,10000],[14,10000],[15,10000],[16,7500],[17,7500],[18,7500],[19,7500],[20,7500]]},{EU:[[1,8710],[2,4645],[3,3484],[4,2207],[5,1162],[6,1045],[7,929],[8,697],[9,581],[10,349],[11,581],[12,581],[13,581],[14,2323],[15,581],[16,581]]},{EU:[[1,14460],[2,11568],[3,8676],[4,6940],[5,5784],[6,3470],[7,1736],[8,1446],[9,1156],[10,868]]},{EU:[[1,8000],[2,3000],[3,2000],[4,1200],[5,1000],[6,700],[7,650],[8,500],[9,500],[10,450]]},{EU:[[1,30000],[2,15000],[3,13750],[4,12500],[5,11250],[6,10000],[7,9250],[8,8500],[9,7750],[10,7000],[11,6250],[12,4750],[13,4500],[14,4250],[15,4000],[16,3750],[17,3500],[18,3250],[19,3000],[20,2750],[21,2500],[22,2500],[23,2500],[24,2500],[25,2500],[26,2500],[27,2500],[28,2500],[29,2500],[30,2500],[31,2000],[32,2000],[33,2000],[34,2000],[35,2000],[36,1750],[37,1750],[38,1750],[39,1750],[40,1750],[41,1000],[42,1000],[43,1000],[44,1000],[45,1000],[46,1000],[47,1000],[48,1000],[49,1000],[50,1000],[51,750],[52,750],[53,750],[54,750],[55,750],[56,750],[57,750],[58,750],[59,750],[60,750],[61,750],[62,750],[63,750],[64,750],[65,750],[66,750],[67,750],[68,750],[69,750],[70,750],[71,750],[72,750],[73,750],[74,750],[75,750],[76,500],[77,500],[78,500],[79,500],[80,500],[81,500],[82,500],[83,500],[84,500],[85,500],[86,500],[87,500],[88,500],[89,500],[90,500],[91,500],[92,500],[93,500],[94,500],[95,500],[96,500],[97,500],[98,500],[99,500],[100,500]]},{EU:[[1,22500],[2,12500],[3,9000],[4,7500],[5,6000],[6,5000],[7,4500],[8,4000],[9,3500],[10,3000],[11,2500],[12,2500],[13,2500],[14,2500],[15,2500],[16,2000],[17,2000],[18,2000],[19,2000],[20,2000],[21,1500],[22,1500],[23,1500],[24,1500],[25,1500],[26,1000],[27,1000],[28,1000],[29,1000],[30,1000],[31,750],[32,750],[33,750],[34,750],[35,750],[36,750],[37,750],[38,750],[39,750],[40,750],[41,500],[42,500],[43,500],[44,500],[45,500],[46,500],[47,500],[48,500],[49,500],[50,500]]},{EU:[[1,250000],[2,150000],[3,100000],[4,75000],[5,50000],[6,40000],[7,30000],[8,25000],[9,20000],[10,15000],[11,10650],[12,10150],[13,9850],[14,9550],[15,9300],[16,9100],[17,8900],[18,8700],[19,8500],[20,8300],[21,8100],[22,7900],[23,7700],[24,7500],[25,7300],[26,7150],[27,7000],[28,6850],[29,6700],[30,6550],[31,6400],[32,6250],[33,6100],[34,6000],[35,5900],[36,5800],[37,5700],[38,5600],[39,5500],[40,5400],[41,5300],[42,5200],[43,5100],[44,5000]]},{EU:[[1,2500],[2,1000],[3,675],[4,625],[5,575],[6,500],[7,450],[8,400],[9,350],[10,300],[11,250],[12,250],[13,250],[14,250],[15,250],[16,175],[17,175],[18,175],[19,175],[20,175],[21,125],[22,125],[23,125],[24,125],[25,125],[26,125],[27,125],[28,125],[29,125],[30,125],[31,100],[32,100],[33,100],[34,100],[35,100],[36,100],[37,100],[38,100],[39,100],[40,100],[41,75],[42,75],[43,75],[44,75],[45,75],[46,75],[47,75],[48,75],[49,75],[50,75]]},{EU:[[1,16002],[2,10668],[3,5334]]},{EU:[[1,100000],[2,40000],[3,20000],[4,20000],[5,10000],[6,10000],[7,10000],[8,10000],[9,5000],[10,5000],[11,5000],[12,5000],[13,2500],[14,2500],[15,2500],[16,2500]]},{EU:[[1,2500],[2,2000],[3,1500],[4,1250],[5,1125],[6,1000],[7,875],[8,750],[9,625],[10,500],[20,450],[30,350],[40,300],[50,250],[75,225],[100,200],[250,175],[500,150]],NAC:[[1,2250],[2,1750],[3,1375],[4,1125],[5,1000],[6,850],[7,750],[8,625],[9,500],[10,400],[20,350],[30,300],[40,250],[50,225],[75,200],[100,175],[250,125],[500,100]],NAW:[[1,1250],[2,1100],[3,1000],[4,900],[5,800],[6,725],[7,625],[8,500],[9,450],[10,400],[20,350],[30,300],[40,250],[50,200],[75,150],[100,100]],BR:[[1,1250],[2,1100],[3,1000],[4,875],[5,725],[6,600],[7,500],[8,450],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]],ASIA:[[1,1250],[2,1100],[3,1000],[4,875],[5,725],[6,600],[7,500],[8,450],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]],OCE:[[1,1250],[2,1100],[3,950],[4,800],[5,650],[6,500],[7,450],[8,400],[9,350],[10,300],[20,200],[30,150],[40,125],[50,100]]},{EU:[[1,67100],[2,26840],[3,16775],[4,12078],[5,7381],[6,6710],[7,5368],[8,4026],[9,3355],[24,2013],[90,1342]]},{EU:[[1,4000],[2,2800],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[11,450],[12,425],[13,400],[14,350],[15,325],[16,300],[17,275],[18,250],[19,225],[40,200]]},{EU:[[1,10000],[2,7500],[3,5500],[4,4000],[5,3000],[6,2000],[7,1500],[8,1250],[9,1000],[10,750],[89,175]]},{EU:[[1,2250],[2,2200],[3,2150],[4,2100],[5,2050],[6,2000],[7,1950],[8,1900],[9,1850],[10,1800],[15,1750],[20,1700]]},{EU:[[1,35000],[2,32500],[3,27500],[4,22500],[5,20000],[10,17500],[15,15000],[20,10000]]},{EU:[[1,25000],[2,8750],[3,6250],[4,4250],[5,2250],[6,1750],[7,1500],[8,1250],[10,750],[20,500]]},{EU:[[1,6250],[2,3750],[3,2500],[4,2000],[5,1750],[6,1500],[7,1250],[8,750]]},{EU:[[1,25000],[2,11000],[3,7000],[4,4500],[6,2500],[8,1500],[16,875]]},{EU:[[1,0]]}];
// Постеры этих капов — архив Tracker (tools/fetch-archive-posters.js).
Object.assign(CC_CUP_POSTER, {"S11_DreamhackWinter_BYOC":"cups/a-9868a28044","S11_CC_Contenders":"cups/a-ff2310d4d7","CashCup_Trios2":"cups/a-2bcf5fbd2c","CashCup_Trios1":"cups/a-e50eef7dd3","LuxeCup":"cups/a-1dc7cf8ed5","S11_WinterRoyale_PC":"cups/a-b34bf12bdc","BlackheartCup":"cups/a-7346a067bb","ScallywagCup":"cups/a-7c5745c6fb","S14_EUEncore":"cups/a-8db2611580","S15_FrostyFrenzy":"cups/a-af1008c05b","S14_MarvelSuperCup":"cups/a-3cfb0ee2e7","S15_Dreamhack_December":"cups/a-713e597735","S14_Dreamhack_November":"cups/a-713e597735","S14_Dreamhack_October":"cups/a-713e597735","S14_CC_Champions":"cups/a-76987e57b5","S14_WildWednesday":"cups/a-a6e39a8e20","S14_CC_Contenders":"cups/a-e6c53b00a5","S14_Dreamhack_September":"cups/a-713e597735","S13_LlobetiTriosCup":"cups/a-8db2611580","S13_CC_Champions":"cups/a-12d07029c8","S13_Dreamhack_August":"cups/a-713e597735","S13_CC_Contenders":"cups/a-e7c01b85f1","S13_AquaNyhroxThrowbackCup":"cups/a-8787e74bd2","S13_BughaThrowbackCup":"cups/a-d7bcdcb3b9","S13_MongraalSoloCup":"cups/a-8db2611580","S13_JacobSoloCup":"cups/a-bc725610c8","S13_DailyTrios":"cups/a-402a6ec6cb","S13_MrSavageTriosCup":"cups/a-8db2611580","S13_AmarTriosCup":"cups/a-8db2611580","S13_Dreamhack_July":"cups/a-713e597735","S12_BenjyFishyCup":"cups/a-7c5745c6fb","S12_CCV2_Contenders":"cups/a-12d07029c8","S12_DailyDuos":"cups/a-7987676c0e","S11_CelebrationCup":"cups/a-3f9583fe8d","S12_CC_Contenders":"cups/a-12d07029c8","S18_Dreamhack_October":"cups/a-be32eaada8","S17_Dreamhack_August":"cups/a-be32eaada8","S17_BlueCheese":"cups/a-f040c05fce","S16_UEFA_Euro_Cup_2020":"cups/a-f7f8c09c97","S16_Dreamhack_April":"cups/a-be32eaada8","S15_Dreamhack_January":"cups/a-713e597735","S22_QueasyCup":"cups/a-3380291c49","S21_LGSoloCashCup":"cups/a-e29b82f490","S22_ZBMCashCup":"cups/a-20616706ce","S21_LGTriosCashCup":"cups/a-ba3e72ce31","S21_PgodCup":"cups/a-ed9ad7cf4f","S21_DreamhackSummerZBM":"cups/a-d6d5f8e00b","S21_TriosCashCupZBM":"cups/a-a12d155672","S21_DreamhackSummer":"cups/a-56b324ab44","S21_TriosQuickCashCup":"cups/a-99f3c3f75d","S21_SommersetCup":"cups/a-bd073fb356","S28_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S27_SoloVictoryCashCup":"cups/a-094ae31bec","S28_SoloVictoryCashCup":"cups/a-094ae31bec","S27_OGGrefg_Duos":"cups/a-c0605bf346","S27_OGInoxtag_Duos":"cups/a-de1053a64f","S27_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S27_OGJacob_Duos":"cups/a-c0605bf346","S27_OGAmar_Duos":"cups/a-de1053a64f","S27_OGGrefg_Squads":"cups/a-c0605bf346","S26_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S25_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S24_TriosZBVictoryCashCup":"cups/a-891369eb47","S24_MamaBenjyFishy":"cups/a-6a11de2460","S23_ThunderCup":"cups/a-a309a3cdcd","S23_ZBMCashCup":"cups/a-f30171d854","S23_LGSoloCashCup":"cups/a-f6c3d6e933","S23_LGTriosCashCup":"cups/a-f6c3d6e933","S32_SoloVictoryCashCup":"cups/a-af2ca98c52","S32_SoloZBVictoryCashCup":"cups/a-af2ca98c52","S32_TriosCashCup":"cups/a-e85f02997e","S32_TriosCashCup_ZB":"cups/a-ca8ce3e4a5","S32_SquadsReloadCup":"cups/a-e7c00e1f68","S31_SquadsReloadCup":"cups/a-e7c00e1f68","S31_TriosCashCup":"cups/a-e85f02997e","S31_SoloVictoryCashCup":"cups/a-af2ca98c52","S31_SquadsReloadVictoryCashCup":"cups/a-02580158c4","S31_SoloZBVictoryCashCup":"cups/a-af2ca98c52","S31_InfluencerCup":"cups/a-be0811d2a0","S30_SoloVictoryCashCup":"cups/a-949fe3f249","S30_SoloZBVictoryCashCup":"cups/a-54c4266908","S30_SquadsVictoryCashCup":"cups/a-02580158c4","S29_DuosZBVictoryCashCup":"cups/a-02580158c4","S29_SoloVictoryCashCup":"cups/a-949fe3f249","S39_ReloadCashVictoryCup_Dec":"cups/a-c8b57e08bd","S39_1MillionUnrealCup":"cups/a-f654cf32bd","S38_SoloSeriesCup":"cups/a-76a72bc4f5","S39_NvidiaCup":"cups/a-34bffa5fc6","S38_SquadsVictoryCup":"cups/a-deef3060bd","S38_DuosVictoryCup":"cups/a-b395d6251b","S38_ReloadQuickCup":"cups/a-7017b7a983","S37_DuosDivisionalCup_Division1":"cups/a-4f7fa3e19e","S37_SoloSeriesCup":"cups/a-acb601afc8","S37_ReloadQuickCup":"cups/a-7017b7a983","S36_VictoryDuosCup":"cups/a-e3c5928e97","S35_VictoryDuosCup":"cups/a-e3c5928e97","S11_WinterRoyale_Mobile":"cups/a-b34bf12bdc","S11_WinterRoyale_Console":"cups/a-b34bf12bdc","XboxCup_Solo1":"cups/a-1819dd1c93","S11_PlatformCup_Mobile":"cups/a-45e7209a96","S11_PlatformCup_PC":"cups/a-5ab3929a99","S11_PlatformCup_Console":"cups/a-a61630c9c0","S14_CC_Platform":"cups/a-0f69f3fdf7","S18_ConsoleChampionsCup":"cups/a-a0517468ac","S13_CC_Platform":"cups/a-f50e743287","S12_CCV2_Platform":"cups/a-4fbe5ae85c","S18_PlaystationCup":"cups/a-6e2f82c5ec","S17_ConsoleChampionsCup":"cups/a-f3e50d2e05","S16_ConsoleChampionsCup":"cups/a-5c4d14af99","S22_PlaystationCupNov":"cups/a-31409ed971","S22_PlaystationCupOct":"cups/a-43544e9da2","S22_PlaystationCupSep":"cups/a-51d7cedc91","S22_ConsoleChampionsCup":"cups/a-d935fb890c","S21_PlaystationCupAug":"cups/a-442a4bf8e7","S21_ConsoleChampionsCup":"cups/a-79beeb3e6c","S21_PlaystationCupJuly":"cups/a-00c69620d6","S21_ConsoleChampionsCupZBM":"cups/a-79beeb3e6c","S12_CC_Platform":"cups/a-4fbe5ae85c","S21_PlaystationCupJune":"cups/a-00c69620d6","S21_SoloCashCupConsole":"cups/a-788260be90","S20_ConsoleChampionsCup":"cups/a-9df98ef7fe","S20_PlaystationCupMay":"cups/a-374c1f34c8","S19_PlaystationCup":"cups/a-0822b34fec","S19_ConsoleChampionsCup":"cups/a-02108ac805","S28_ConsoleCashCupsZB":"cups/a-82ad85e0fb","S28_ConsoleCashCups":"cups/a-82ad85e0fb","S28_PlaystationCupZBDecember":"cups/a-29973b0ab5","S28_PlaystationCupDecember":"cups/a-ec55627842","S26_ConsoleChampionsCupZB":"cups/a-e57c53b1a6","S26_PlaystationCupZBSeptember":"cups/a-e1d5e68884","S26_ConsoleChampionsCup":"cups/a-e57c53b1a6","S26_PlaystationCupSeptember":"cups/a-de1d835729","S25_PlaystationCupZBJune":"cups/a-e1d5e68884","S25_PlaystationCupJune":"cups/a-de1d835729","S24_PlaystationCupMar":"cups/a-6c2a19dea0","S25_ConsoleChampionsCup":"cups/a-e57c53b1a6","S23_PlaystationCupJan":"cups/a-31409ed971","S24_ConsoleChampionsCupMay":"cups/a-e57c53b1a6","S24_ConsoleChampionsCup":"cups/a-d935fb890c","S23_PlaystationCupFeb":"cups/a-31409ed971","S33_PlaystationCup":"cups/a-ec55627842","S32_PlatformReloadDuosCashCupConsole":"cups/a-0d94d108a2","S32_PlatformReloadDuosCashCupMobile":"cups/a-0d94d108a2","S32_PlatformReloadDuosCashCupPC":"cups/a-0d94d108a2","S31_PlatformReloadDuosCashCupConsole":"cups/a-0d94d108a2","S31_PlatformReloadDuosCashCupPC":"cups/a-0d94d108a2","S31_PlatformReloadDuosCashCupMobile":"cups/a-0d94d108a2","S31_PlaystationSypherPKCup":"cups/a-77f6e44b4b","S30_PlaystationCupJune":"cups/a-ec55627842","S30_ConsoleCashCups":"cups/a-d5c03535eb","S30_PlaystationCupZBJune":"cups/a-29973b0ab5","S29_ConsoleCashCupsZB":"cups/a-1a3827e19f","S29_ConsoleCashCups":"cups/a-d5c03535eb","S29_PlaystationCupMarch":"cups/a-ec55627842","S29_PlaystationCupZBMarch":"cups/a-29973b0ab5","S38_PlayStationCupReload":"cups/a-e66ff6746d","S38_TouchOnlyMobileCup":"cups/a-91b673ebee","S37_PlayStationCup":"cups/a-8dc0a9a594","S38_BlitzMobileCup":"cups/a-7de3db9692","S37_ConsoleDuosCashCups":"cups/a-e3c5928e97","S34_PlaystationCup":"cups/a-e66ff6746d","S36_PlayStationCup":"cups/a-e66ff6746d"});
const CC_CUPS_ARCH=[
  {day:'2019-03-01',id:'LAN_ESL_Katowice_Royale_International_Edition_Solos',mode:'solo',n:1,name:"ESL Katowice Royale Solos",payT:CC_CUPS_ARCH_PAY[102],lan:"ESL Katowice Royale Solos · Katowice",invite:100},
  {day:'2019-03-02',id:'LAN_ESL_Katowice_Royale_International_Edition_Duos',mode:'duo',n:1,name:"ESL Katowice Royale Duos",payT:CC_CUPS_ARCH_PAY[103],lan:"ESL Katowice Royale Duos · Katowice",invite:100},
  {day:'2019-03-17',id:'ScallywagCup',mode:'duo',n:1,name:"Scallywag Cup",payT:CC_CUPS_ARCH_PAY[7]},
  {day:'2019-03-24',id:'BlackheartCup',mode:'solo',n:1,name:"Blackheart Cup",payT:CC_CUPS_ARCH_PAY[6]},
  {day:'2019-03-31',id:'LuxeCup',mode:'duo',n:1,name:"Luxe Cup",payT:CC_CUPS_ARCH_PAY[4]},
  {day:'2019-04-07',id:'ONL_Fortnite_World_Cup_2019_Warmup',mode:'duo',n:1,name:"World Cup Warmup",payT:CC_CUPS_ARCH_PAY[123]},
  {day:'2019-07-14',id:'CashCup_Trios1',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[3]},
  {day:'2019-07-21',id:'CashCup_Trios2',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[2]},
  {day:'2019-07-21',id:'XboxCup_Solo1',mode:'solo',n:1,name:"Xbox Cup",payT:CC_CUPS_ARCH_PAY[62]},
  {day:'2019-09-27',id:'LAN_Twitch_Rivals_TwitchCon_Fortnite_Showdown',mode:'trio',n:1,name:"Twitch Rivals TwitchCon Fortnite Showdown",payT:CC_CUPS_ARCH_PAY[104],lan:"Twitch Rivals TwitchCon Fortnite Showdown · San Diego",invite:90},
  {day:'2019-10-30',id:'S11_PlatformCup_Mobile',mode:'solo',n:1,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-10-30',id:'S11_PlatformCup_PC',mode:'solo',n:1,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-10-30',id:'S11_PlatformCup_Console',mode:'solo',n:1,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-10-31',id:'S11_CC_Contenders',mode:'solo',n:1,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-06',id:'S11_PlatformCup_Mobile',mode:'solo',n:2,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-06',id:'S11_PlatformCup_PC',mode:'solo',n:2,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-06',id:'S11_PlatformCup_Console',mode:'solo',n:2,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-07',id:'S11_CC_Contenders',mode:'solo',n:2,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-13',id:'S11_PlatformCup_Mobile',mode:'solo',n:3,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-13',id:'S11_PlatformCup_PC',mode:'solo',n:3,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-13',id:'S11_PlatformCup_Console',mode:'solo',n:3,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-14',id:'S11_CC_Contenders',mode:'solo',n:3,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-18',id:'S11_CC_Contenders',mode:'solo',n:4,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-20',id:'S11_PlatformCup_Mobile',mode:'solo',n:4,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-20',id:'S11_PlatformCup_PC',mode:'solo',n:4,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-20',id:'S11_PlatformCup_Console',mode:'solo',n:4,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-21',id:'S11_CC_Contenders',mode:'solo',n:5,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-27',id:'S11_PlatformCup_Mobile',mode:'solo',n:5,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-27',id:'S11_PlatformCup_PC',mode:'solo',n:5,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-27',id:'S11_PlatformCup_Console',mode:'solo',n:5,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-28',id:'S11_CC_Contenders',mode:'solo',n:6,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-01',id:'S11_DreamhackWinter_BYOC',mode:'solo',n:1,name:"DreamHack Winter 19 Featuring Fortnite",payT:CC_CUPS_ARCH_PAY[0]},
  {day:'2019-12-04',id:'S11_PlatformCup_Mobile',mode:'solo',n:6,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-12-04',id:'S11_PlatformCup_PC',mode:'solo',n:6,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-04',id:'S11_PlatformCup_Console',mode:'solo',n:6,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-05',id:'S11_CC_Contenders',mode:'solo',n:7,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-11',id:'S11_PlatformCup_Mobile',mode:'solo',n:7,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-12-11',id:'S11_PlatformCup_PC',mode:'solo',n:7,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-11',id:'S11_PlatformCup_Console',mode:'solo',n:7,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-16',id:'S11_CC_Contenders',mode:'solo',n:8,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-18',id:'S11_PlatformCup_Mobile',mode:'solo',n:8,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-12-18',id:'S11_PlatformCup_PC',mode:'solo',n:8,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-18',id:'S11_PlatformCup_Console',mode:'solo',n:8,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-19',id:'S11_CC_Contenders',mode:'solo',n:9,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-20',id:'S11_WinterRoyale_PC',mode:'duo',n:1,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-20',id:'S11_WinterRoyale_Mobile',mode:'duo',n:1,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[61]},
  {day:'2019-12-20',id:'S11_WinterRoyale_Console',mode:'duo',n:1,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-21',id:'S11_WinterRoyale_PC',mode:'duo',n:2,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-21',id:'S11_WinterRoyale_Mobile',mode:'duo',n:2,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[61]},
  {day:'2019-12-21',id:'S11_WinterRoyale_Console',mode:'duo',n:2,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-22',id:'S11_WinterRoyale_PC',mode:'duo',n:3,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-22',id:'S11_WinterRoyale_Mobile',mode:'duo',n:3,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[61]},
  {day:'2019-12-22',id:'S11_WinterRoyale_Console',mode:'duo',n:3,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2020-01-15',id:'S11_PlatformCup_Mobile',mode:'solo',n:9,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2020-01-15',id:'S11_PlatformCup_PC',mode:'solo',n:9,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-15',id:'S11_PlatformCup_Console',mode:'solo',n:9,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-16',id:'S11_CC_Contenders',mode:'solo',n:10,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2020-01-22',id:'S11_PlatformCup_Mobile',mode:'solo',n:10,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2020-01-22',id:'S11_PlatformCup_PC',mode:'solo',n:10,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-22',id:'S11_PlatformCup_Console',mode:'solo',n:10,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-23',id:'S11_CC_Contenders',mode:'solo',n:11,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2020-01-29',id:'S11_PlatformCup_Mobile',mode:'solo',n:11,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2020-01-29',id:'S11_PlatformCup_PC',mode:'solo',n:11,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-29',id:'S11_PlatformCup_Console',mode:'solo',n:11,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-30',id:'S11_CC_Contenders',mode:'solo',n:12,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2020-02-02',id:'LAN_Australian_Open_Summer_Smash_2020',mode:'solo',n:1,name:"Australian Open Summer Smash 2020",payT:CC_CUPS_ARCH_PAY[124],lan:"Australian Open Summer Smash 2020 · Melbourne",invite:90,region:'OCE'},
  {day:'2020-02-16',id:'S11_CelebrationCup',mode:'solo',n:1,name:"Celebration Cup",payT:CC_CUPS_ARCH_PAY[29]},
  {day:'2020-02-21',id:'LAN_DreamHack_2020_Anaheim',mode:'solo',n:1,name:"DreamHack Anaheim 2020",payT:CC_CUPS_ARCH_PAY[117],lan:"DreamHack Anaheim 2020 · Anaheim",invite:100,region:'NAC'},
  {day:'2020-03-18',id:'S12_CC_Contenders',mode:'duo',n:1,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-03-19',id:'S12_CC_Platform',mode:'solo',n:1,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-03-25',id:'S12_DailyDuos',mode:'duo',n:1,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-25',id:'S12_CC_Contenders',mode:'duo',n:2,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-03-26',id:'S12_DailyDuos',mode:'duo',n:2,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-26',id:'S12_CC_Platform',mode:'solo',n:2,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-03-27',id:'S12_DailyDuos',mode:'duo',n:3,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-28',id:'S12_DailyDuos',mode:'duo',n:4,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-29',id:'S12_DailyDuos',mode:'duo',n:5,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-30',id:'S12_DailyDuos',mode:'duo',n:6,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-31',id:'S12_DailyDuos',mode:'duo',n:7,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-01',id:'S12_DailyDuos',mode:'duo',n:8,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-01',id:'S12_CC_Contenders',mode:'duo',n:3,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-04-02',id:'S12_DailyDuos',mode:'duo',n:9,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-02',id:'S12_CC_Platform',mode:'solo',n:3,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-04-03',id:'S12_DailyDuos',mode:'duo',n:10,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-04',id:'S12_DailyDuos',mode:'duo',n:11,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-05',id:'S12_DailyDuos',mode:'duo',n:12,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-06',id:'S12_DailyDuos',mode:'duo',n:13,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-07',id:'S12_DailyDuos',mode:'duo',n:14,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-08',id:'S12_DailyDuos',mode:'duo',n:15,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-08',id:'S12_CC_Contenders',mode:'duo',n:4,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-04-09',id:'S12_DailyDuos',mode:'duo',n:16,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-09',id:'S12_CC_Platform',mode:'solo',n:4,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-04-10',id:'S12_DailyDuos',mode:'duo',n:17,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-11',id:'S12_DailyDuos',mode:'duo',n:18,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-12',id:'S12_DailyDuos',mode:'duo',n:19,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-13',id:'S12_DailyDuos',mode:'duo',n:20,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-14',id:'S12_DailyDuos',mode:'duo',n:21,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-15',id:'S12_DailyDuos',mode:'duo',n:22,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-15',id:'S12_CC_Contenders',mode:'duo',n:5,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-04-16',id:'S12_DailyDuos',mode:'duo',n:23,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-16',id:'S12_CC_Platform',mode:'solo',n:5,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-04-17',id:'S12_DailyDuos',mode:'duo',n:24,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-18',id:'S12_DailyDuos',mode:'duo',n:25,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-19',id:'S12_DailyDuos',mode:'duo',n:26,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-20',id:'S12_DailyDuos',mode:'duo',n:27,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-21',id:'S12_DailyDuos',mode:'duo',n:28,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-26',id:'S12_DailyDuos',mode:'duo',n:29,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-27',id:'S12_DailyDuos',mode:'duo',n:30,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-28',id:'S12_DailyDuos',mode:'duo',n:31,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-29',id:'S12_DailyDuos',mode:'duo',n:32,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-30',id:'S12_DailyDuos',mode:'duo',n:33,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-05-01',id:'S12_CCV2_Platform',mode:'solo',n:1,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-04',id:'S12_CCV2_Contenders',mode:'duo',n:1,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-07',id:'S12_CCV2_Contenders',mode:'duo',n:2,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-11',id:'S12_CCV2_Platform',mode:'solo',n:2,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-14',id:'S12_CCV2_Contenders',mode:'duo',n:3,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-15',id:'S12_CCV2_Platform',mode:'solo',n:3,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-21',id:'S12_CCV2_Contenders',mode:'duo',n:4,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-22',id:'S12_CCV2_Platform',mode:'solo',n:4,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-27',id:'S12_BenjyFishyCup',mode:'solo',n:1,name:"Benjyfishy Cup",payT:CC_CUPS_ARCH_PAY[26]},
  {day:'2020-05-28',id:'S12_CCV2_Contenders',mode:'duo',n:5,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-29',id:'S12_CCV2_Platform',mode:'solo',n:5,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-06-27',id:'S13_AmarTriosCup',mode:'trio',n:1,name:"Amar Trios Cup",payT:CC_CUPS_ARCH_PAY[25]},
  {day:'2020-06-30',id:'S13_MrSavageTriosCup',mode:'trio',n:1,name:"MrSavage Cup",payT:CC_CUPS_ARCH_PAY[25]},
  {day:'2020-07-01',id:'S13_JacobSoloCup',mode:'solo',n:1,name:"Jacob Cup",payT:CC_CUPS_ARCH_PAY[23]},
  {day:'2020-07-14',id:'S13_MongraalSoloCup',mode:'solo',n:1,name:"Mongraal Cup",payT:CC_CUPS_ARCH_PAY[22]},
  {day:'2020-07-14',id:'S13_DailyTrios',mode:'trio',n:1,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-15',id:'S13_CC_Champions',mode:'trio',n:1,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-07-15',id:'S13_CC_Contenders',mode:'trio',n:1,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-07-15',id:'S13_DailyTrios',mode:'trio',n:2,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-16',id:'S13_DailyTrios',mode:'trio',n:3,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-16',id:'S13_CC_Platform',mode:'solo',n:1,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-07-17',id:'S13_DailyTrios',mode:'trio',n:4,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-18',id:'S13_DailyTrios',mode:'trio',n:5,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-19',id:'S13_DailyTrios',mode:'trio',n:6,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-19',id:'S13_Dreamhack_July',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[12]},
  {day:'2020-07-20',id:'S13_DailyTrios',mode:'trio',n:7,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-21',id:'S13_DailyTrios',mode:'trio',n:8,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-22',id:'S13_CC_Champions',mode:'trio',n:2,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-07-22',id:'S13_CC_Contenders',mode:'trio',n:2,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-07-22',id:'S13_DailyTrios',mode:'trio',n:9,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-23',id:'S13_DailyTrios',mode:'trio',n:10,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-23',id:'S13_CC_Platform',mode:'solo',n:2,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-07-24',id:'S13_DailyTrios',mode:'trio',n:11,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-25',id:'S13_DailyTrios',mode:'trio',n:12,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-26',id:'S13_DailyTrios',mode:'trio',n:13,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-27',id:'S13_DailyTrios',mode:'trio',n:14,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-28',id:'S13_DailyTrios',mode:'trio',n:15,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-29',id:'S13_DailyTrios',mode:'trio',n:16,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-30',id:'S13_DailyTrios',mode:'trio',n:17,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-31',id:'S13_BughaThrowbackCup',mode:'solo',n:1,name:"Bugha Throwback Cup",payT:CC_CUPS_ARCH_PAY[21]},
  {day:'2020-07-31',id:'S13_DailyTrios',mode:'trio',n:18,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-01',id:'S13_DailyTrios',mode:'trio',n:19,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-02',id:'S13_DailyTrios',mode:'trio',n:20,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-03',id:'S13_DailyTrios',mode:'trio',n:21,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-04',id:'S13_DailyTrios',mode:'trio',n:22,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-05',id:'S13_DailyTrios',mode:'trio',n:23,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-06',id:'S13_DailyTrios',mode:'trio',n:24,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-06',id:'S13_CC_Platform',mode:'solo',n:3,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-08-07',id:'S13_DailyTrios',mode:'trio',n:25,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-08',id:'S13_DailyTrios',mode:'trio',n:26,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-12',id:'S13_CC_Champions',mode:'trio',n:3,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-08-12',id:'S13_CC_Contenders',mode:'trio',n:3,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-08-12',id:'S13_AquaNyhroxThrowbackCup',mode:'duo',n:1,name:"Aqua & Nyhrox Throwback Cup",payT:CC_CUPS_ARCH_PAY[20]},
  {day:'2020-08-13',id:'S13_CC_Platform',mode:'solo',n:4,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-08-19',id:'S13_CC_Champions',mode:'trio',n:4,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-08-19',id:'S13_CC_Contenders',mode:'trio',n:4,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-08-20',id:'S13_CC_Platform',mode:'solo',n:5,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-08-23',id:'S13_Dreamhack_August',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[16]},
  {day:'2020-08-26',id:'S13_CC_Champions',mode:'trio',n:5,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-08-26',id:'S13_CC_Contenders',mode:'trio',n:5,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-09-13',id:'S13_LlobetiTriosCup',mode:'trio',n:1,name:"Llobeti Cup",payT:CC_CUPS_ARCH_PAY[17]},
  {day:'2020-09-15',id:'S14_CC_Champions',mode:'trio',n:1,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-09-15',id:'S14_CC_Contenders',mode:'trio',n:1,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-09-16',id:'S14_WildWednesday',mode:'solo',n:1,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-09-18',id:'S14_CC_Platform',mode:'solo',n:1,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-09-20',id:'S14_Dreamhack_September',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[16]},
  {day:'2020-09-21',id:'S14_CC_Platform',mode:'solo',n:2,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-09-22',id:'S14_CC_Champions',mode:'trio',n:2,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-09-22',id:'S14_CC_Contenders',mode:'trio',n:2,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-09-23',id:'S14_WildWednesday',mode:'solo',n:2,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-10-05',id:'S14_CC_Platform',mode:'solo',n:3,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-10-06',id:'S14_CC_Champions',mode:'trio',n:3,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-10-06',id:'S14_CC_Contenders',mode:'trio',n:3,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-10-07',id:'S14_WildWednesday',mode:'solo',n:3,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-10-12',id:'S14_CC_Platform',mode:'solo',n:4,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-10-21',id:'S14_WildWednesday',mode:'solo',n:4,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-10-22',id:'S14_Dreamhack_October',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[12]},
  {day:'2020-10-26',id:'S14_CC_Platform',mode:'solo',n:5,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-10-27',id:'S14_CC_Champions',mode:'trio',n:4,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-10-27',id:'S14_CC_Contenders',mode:'trio',n:4,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-11-02',id:'S14_CC_Platform',mode:'solo',n:6,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-11-08',id:'S14_Dreamhack_November',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[11]},
  {day:'2020-11-09',id:'S14_CC_Champions',mode:'trio',n:5,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-11-09',id:'S14_CC_Contenders',mode:'trio',n:5,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-11-16',id:'S14_CC_Champions',mode:'trio',n:6,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-11-16',id:'S14_CC_Contenders',mode:'trio',n:6,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-11-21',id:'S14_MarvelSuperCup',mode:'duo',n:1,name:"$1M Super Cup",payT:CC_CUPS_ARCH_PAY[10]},
  {day:'2020-11-22',id:'S14_EUEncore',mode:'trio',n:1,name:"EU Encore",payT:CC_CUPS_ARCH_PAY[8]},
  {day:'2020-12-12',id:'S15_FrostyFrenzy',mode:'trio',n:1,name:"Frosty Frenzy",payT:CC_CUPS_ARCH_PAY[9]},
  {day:'2020-12-13',id:'S15_FrostyFrenzy',mode:'trio',n:2,name:"Frosty Frenzy",payT:CC_CUPS_ARCH_PAY[9]},
  {day:'2020-12-20',id:'S15_Dreamhack_December',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[11]},
  {day:'2021-01-31',id:'S15_Dreamhack_January',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[11]},
  {day:'2021-05-16',id:'S16_ConsoleChampionsCup',mode:'trio',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[70]},
  {day:'2021-05-20',id:'S16_Dreamhack_April',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[31]},
  {day:'2021-06-17',id:'S16_UEFA_Euro_Cup_2020',mode:'solo',n:1,name:"UEFA Euro 2020™ Cup",payT:CC_CUPS_ARCH_PAY[33]},
  {day:'2021-07-25',id:'S17_ConsoleChampionsCup',mode:'trio',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[66]},
  {day:'2021-07-28',id:'S17_BlueCheese',mode:'trio',n:1,name:"Bugha's Late Game",payT:CC_CUPS_ARCH_PAY[32]},
  {day:'2021-08-19',id:'S17_Dreamhack_August',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[31]},
  {day:'2021-10-02',id:'S18_PlaystationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[69]},
  {day:'2021-10-10',id:'S18_Dreamhack_October',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[31]},
  {day:'2021-11-07',id:'S18_ConsoleChampionsCup',mode:'trio',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[66]},
  {day:'2021-11-14',id:'S18_PlaystationCup',mode:'solo',n:2,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[69]},
  {day:'2022-01-30',id:'LAN_Australian_Open_Summer_Smash_2022',mode:'duo',n:1,name:"Australian Open Summer Smash 2022",payT:CC_CUPS_ARCH_PAY[125],lan:"Australian Open Summer Smash 2022 · Online",invite:80,region:'OCE'},
  {day:'2022-02-12',id:'S19_PlaystationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[79]},
  {day:'2022-03-19',id:'S19_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[72]},
  {day:'2022-05-28',id:'S20_PlaystationCupMay',mode:'duo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[78]},
  {day:'2022-06-03',id:'S20_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[72]},
  {day:'2022-06-03',id:'LAN_DreamHack_Summer_2022_Dallas',mode:'solo',n:1,name:"DreamHack Dallas 2022 Final",payT:CC_CUPS_ARCH_PAY[105],lan:"DreamHack Dallas 2022 Final · Dallas",invite:100},
  {day:'2022-06-19',id:'S21_DreamhackSummer',mode:'solo',n:1,name:"Dreamhack Summer Battle Royale",payT:CC_CUPS_ARCH_PAY[39]},
  {day:'2022-06-20',id:'S21_DreamhackSummerZBM',mode:'solo',n:1,name:"Dreamhack Summer Zero Build",payT:CC_CUPS_ARCH_PAY[39],zb:true},
  {day:'2022-06-23',id:'S21_SommersetCup',mode:'duo',n:1,name:"Sommerset Cup",payT:CC_CUPS_ARCH_PAY[42]},
  {day:'2022-06-24',id:'S21_TriosCashCupZBM',mode:'trio',n:1,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-06-24',id:'S21_TriosQuickCashCup',mode:'trio',n:1,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-06-26',id:'S21_PlaystationCupJune',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[73]},
  {day:'2022-06-29',id:'S21_SoloCashCupConsole',mode:'solo',n:1,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-07-01',id:'S21_TriosCashCupZBM',mode:'trio',n:2,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-07-01',id:'S21_TriosQuickCashCup',mode:'trio',n:2,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-07-15',id:'S21_TriosCashCupZBM',mode:'trio',n:3,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-07-15',id:'S21_TriosQuickCashCup',mode:'trio',n:3,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-07-17',id:'LAN_TimTheTatman_s_Hoedown',mode:'solo',n:1,name:"TimTheTatman's Hoedown",payT:CC_CUPS_ARCH_PAY[106],lan:"TimTheTatman's Hoedown · Arlington",invite:100},
  {day:'2022-07-22',id:'S21_TriosCashCupZBM',mode:'trio',n:4,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-07-22',id:'S21_TriosQuickCashCup',mode:'trio',n:4,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-07-24',id:'S21_PlaystationCupJuly',mode:'duo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[75]},
  {day:'2022-07-28',id:'LAN_Gamers8_2022_Zero_Build',mode:'duo',n:1,name:"Gamers8 2022 - Zero Build",payT:CC_CUPS_ARCH_PAY[107],zb:true,lan:"Gamers8 2022 - Zero Build · Riyadh",invite:88},
  {day:'2022-07-30',id:'LAN_Gamers8_2022',mode:'duo',n:1,name:"Gamers8 2022",payT:CC_CUPS_ARCH_PAY[107],lan:"Gamers8 2022 · Riyadh",invite:88},
  {day:'2022-08-11',id:'S21_PgodCup',mode:'trio',n:1,name:"Pgod Cup",payT:CC_CUPS_ARCH_PAY[38]},
  {day:'2022-08-12',id:'S21_TriosCashCupZBM',mode:'trio',n:5,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-08-12',id:'S21_TriosQuickCashCup',mode:'trio',n:5,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-08-14',id:'S21_ConsoleChampionsCupZBM',mode:'duo',n:1,name:"Console Champions Cup Zero Build",payT:CC_CUPS_ARCH_PAY[74],zb:true},
  {day:'2022-08-17',id:'S21_SoloCashCupConsole',mode:'solo',n:2,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-08-19',id:'S21_TriosCashCupZBM',mode:'trio',n:6,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-08-19',id:'S21_TriosQuickCashCup',mode:'trio',n:6,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-08-21',id:'S21_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[74]},
  {day:'2022-08-24',id:'S21_SoloCashCupConsole',mode:'solo',n:3,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-08-26',id:'S21_TriosCashCupZBM',mode:'trio',n:7,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-08-26',id:'S21_TriosQuickCashCup',mode:'trio',n:7,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-08-28',id:'S21_PlaystationCupAug',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[73]},
  {day:'2022-08-31',id:'S21_SoloCashCupConsole',mode:'solo',n:4,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-09-02',id:'S21_TriosCashCupZBM',mode:'trio',n:8,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-09-02',id:'S21_TriosQuickCashCup',mode:'trio',n:8,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-09-07',id:'S21_SoloCashCupConsole',mode:'solo',n:5,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-09-08',id:'S21_LGTriosCashCup',mode:'trio',n:1,name:"Late Game Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[37]},
  {day:'2022-09-09',id:'S21_TriosCashCupZBM',mode:'trio',n:9,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-09-09',id:'S21_TriosQuickCashCup',mode:'trio',n:9,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-09-13',id:'S21_LGSoloCashCup',mode:'solo',n:1,name:"Late Game Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[35]},
  {day:'2022-09-14',id:'S21_SoloCashCupConsole',mode:'solo',n:6,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-09-16',id:'S21_LGSoloCashCup',mode:'solo',n:2,name:"Late Game Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[35]},
  {day:'2022-09-25',id:'S22_QueasyCup',mode:'trio',n:1,name:"Queasy Cup",payT:CC_CUPS_ARCH_PAY[34]},
  {day:'2022-09-25',id:'S22_PlaystationCupSep',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2022-10-01',id:'S22_ZBMCashCup',mode:'squad',n:1,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-08',id:'S22_ZBMCashCup',mode:'squad',n:2,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-09',id:'LAN_Twitch_Rivals_2022_San_Diego',mode:'trio',n:1,name:"Twitch Rivals Zero Build World Invitational",payT:CC_CUPS_ARCH_PAY[108],zb:true,lan:"Twitch Rivals Zero Build World Invitational · San Diego",invite:60},
  {day:'2022-10-15',id:'S22_ZBMCashCup',mode:'squad',n:3,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-22',id:'S22_ZBMCashCup',mode:'squad',n:4,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-27',id:'S22_PlaystationCupOct',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2022-10-29',id:'S22_ZBMCashCup',mode:'squad',n:5,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-05',id:'S22_ZBMCashCup',mode:'squad',n:6,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-19',id:'S22_ZBMCashCup',mode:'squad',n:7,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-20',id:'S22_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[72]},
  {day:'2022-11-20',id:'LAN_DreamHack_Atlanta_2022',mode:'solo',n:1,name:"DreamHack Atlanta 2022",payT:CC_CUPS_ARCH_PAY[109],lan:"DreamHack Atlanta 2022 · Atlanta",invite:100},
  {day:'2022-11-26',id:'S22_ZBMCashCup',mode:'squad',n:8,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-27',id:'LAN_DreamHack_Winter_2022',mode:'solo',n:1,name:"DreamHack Winter 2022",payT:CC_CUPS_ARCH_PAY[110],lan:"DreamHack Winter 2022 · Jönköping",invite:99},
  {day:'2022-11-29',id:'S22_PlaystationCupNov',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2023-01-07',id:'S23_ZBMCashCup',mode:'squad',n:1,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-14',id:'S23_ZBMCashCup',mode:'squad',n:2,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-21',id:'S23_ZBMCashCup',mode:'squad',n:3,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-22',id:'S23_PlaystationCupJan',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2023-01-26',id:'S23_ThunderCup',mode:'duo',n:1,name:"Thunder Cup",payT:CC_CUPS_ARCH_PAY[47]},
  {day:'2023-01-28',id:'S23_ZBMCashCup',mode:'squad',n:4,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-29',id:'S23_LGTriosCashCup',mode:'trio',n:1,name:"Late Game Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[49]},
  {day:'2023-01-29',id:'LAN_Australian_Open_Summer_Smash_2023',mode:'solo',n:1,name:"Australian Open Summer Smash 2023",payT:CC_CUPS_ARCH_PAY[126],lan:"Australian Open Summer Smash 2023 · Online",invite:89,region:'OCE'},
  {day:'2023-01-30',id:'S23_LGSoloCashCup',mode:'solo',n:1,name:"Late Game Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[48]},
  {day:'2023-02-04',id:'S23_ZBMCashCup',mode:'squad',n:5,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-02-06',id:'S23_ThunderCup',mode:'duo',n:2,name:"Thunder Cup",payT:CC_CUPS_ARCH_PAY[47]},
  {day:'2023-02-11',id:'S23_ZBMCashCup',mode:'squad',n:6,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-02-18',id:'S23_ZBMCashCup',mode:'squad',n:7,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-02-24',id:'S23_PlaystationCupFeb',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[88]},
  {day:'2023-02-25',id:'S23_ZBMCashCup',mode:'squad',n:8,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-03-04',id:'S23_ZBMCashCup',mode:'squad',n:9,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-03-17',id:'S24_MamaBenjyFishy',mode:'trio',n:1,name:"MamaBenjyFishy Creator Cup",payT:CC_CUPS_ARCH_PAY[46]},
  {day:'2023-03-19',id:'S24_ConsoleChampionsCup',mode:'duo',n:1,name:"March Console Champions Cup",payT:CC_CUPS_ARCH_PAY[87]},
  {day:'2023-03-26',id:'S24_PlaystationCupMar',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[85]},
  {day:'2023-04-02',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:1,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-09',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:2,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-09',id:'LAN_DreamHack_San_Diego_2023',mode:'duo',n:1,name:"DreamHack San Diego 2023",payT:CC_CUPS_ARCH_PAY[118],lan:"DreamHack San Diego 2023 · San Diego",invite:100,region:'NAC'},
  {day:'2023-04-16',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:3,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-23',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:4,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-30',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:5,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-05-07',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:6,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-05-26',id:'S24_ConsoleChampionsCupMay',mode:'duo',n:1,name:"May Console Champions Cup",payT:CC_CUPS_ARCH_PAY[86]},
  {day:'2023-05-28',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:7,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-06-04',id:'LAN_DreamHack_Dallas_2023',mode:'duo',n:1,name:"DreamHack Dallas 2023",payT:CC_CUPS_ARCH_PAY[118],lan:"DreamHack Dallas 2023 · Dallas",invite:100,region:'NAC'},
  {day:'2023-06-10',id:'LAN_Red_Bull_Contested',mode:'solo',n:1,name:"Red Bull Contested",payT:CC_CUPS_ARCH_PAY[111],lan:"Red Bull Contested · Edinburgh",invite:99},
  {day:'2023-06-18',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-06-18',id:'LAN_DreamHack_Summer_2023',mode:'duo',n:1,name:"DreamHack Summer 2023",payT:CC_CUPS_ARCH_PAY[118],lan:"DreamHack Summer 2023 · Jönköping",invite:100,region:'EU'},
  {day:'2023-06-19',id:'S25_PlaystationCupZBJune',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[83],zb:true},
  {day:'2023-06-19',id:'S25_PlaystationCupJune',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[84]},
  {day:'2023-06-25',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-06-30',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-07-07',id:'LAN_Gamers8_2023',mode:'duo',n:1,name:"Gamers8 2023",payT:CC_CUPS_ARCH_PAY[119],lan:"Gamers8 2023 · Riyadh",invite:88,qualFrom:["LAN_DreamHack_San_Diego_2023","LAN_DreamHack_Dallas_2023","LAN_DreamHack_Summer_2023"],qualTop:10,prInvite:18},
  {day:'2023-07-23',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-07-30',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-08-06',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-08-21',id:'S25_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[86]},
  {day:'2023-09-10',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-09-15',id:'S26_PlaystationCupZBSeptember',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[83],zb:true},
  {day:'2023-09-16',id:'S26_PlaystationCupSeptember',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[84]},
  {day:'2023-09-17',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-09-24',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-01',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-08',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-22',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-29',id:'S26_ConsoleChampionsCupZB',mode:'duo',n:1,name:"Zero Build Console Champions Cup",payT:CC_CUPS_ARCH_PAY[82],zb:true},
  {day:'2023-10-29',id:'S26_ConsoleChampionsCup',mode:'duo',n:1,name:"Battle Royale Console Champions Cup",payT:CC_CUPS_ARCH_PAY[82]},
  {day:'2023-11-05',id:'S27_OGJacob_Duos',mode:'duo',n:1,name:"Jacob's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-05',id:'S27_OGAmar_Duos',mode:'duo',n:1,name:"Amar's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-06',id:'S27_OGJacob_Duos',mode:'duo',n:2,name:"Jacob's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-06',id:'S27_OGAmar_Duos',mode:'duo',n:2,name:"Amar's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-13',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-17',id:'S27_OGGrefg_Duos',mode:'duo',n:1,name:"Grefg's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44]},
  {day:'2023-11-17',id:'S27_OGInoxtag_Duos',mode:'duo',n:1,name:"Inoxtag's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-18',id:'S27_OGInoxtag_Duos',mode:'duo',n:2,name:"Inoxtag's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-18',id:'S27_OGGrefg_Squads',mode:'squad',n:1,name:"Grefg's OG Skirmish",payT:CC_CUPS_ARCH_PAY[45],zb:true},
  {day:'2023-11-19',id:'S27_OGGrefg_Duos',mode:'duo',n:2,name:"Grefg's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44]},
  {day:'2023-11-19',id:'S27_OGInoxtag_Duos',mode:'duo',n:3,name:"Inoxtag's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-22',id:'S27_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-22',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-27',id:'S27_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-27',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-29',id:'S27_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-29',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-30',id:'S27_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-30',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-08',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-08',id:'S28_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-10',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-10',id:'S28_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-14',id:'S28_ConsoleCashCupsZB',mode:'duo',n:1,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2023-12-14',id:'S28_ConsoleCashCups',mode:'duo',n:1,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2023-12-15',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-15',id:'S28_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-15',id:'LAN_DreamHack_Atlanta_2023',mode:'duo',n:1,name:"DreamHack Atlanta 2023",payT:CC_CUPS_ARCH_PAY[120],lan:"DreamHack Atlanta 2023 · Atlanta",invite:100,region:'NAC'},
  {day:'2023-12-16',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-16',id:'S28_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-20',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-20',id:'S28_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-21',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-21',id:'S28_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-22',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:7,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-22',id:'S28_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-01-13',id:'S28_PlaystationCupZBDecember',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[81],zb:true},
  {day:'2024-01-14',id:'S28_PlaystationCupDecember',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[81]},
  {day:'2024-01-18',id:'S28_ConsoleCashCupsZB',mode:'duo',n:2,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-01-18',id:'S28_ConsoleCashCups',mode:'duo',n:2,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-01-19',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:8,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-01-19',id:'S28_SoloVictoryCashCup',mode:'solo',n:8,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-01-21',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:9,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-01-21',id:'S28_SoloVictoryCashCup',mode:'solo',n:9,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-02-09',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:10,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-02-09',id:'S28_SoloVictoryCashCup',mode:'solo',n:10,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-02-10',id:'S28_ConsoleCashCupsZB',mode:'duo',n:3,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-02-10',id:'S28_ConsoleCashCups',mode:'duo',n:3,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-02-11',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:11,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-02-11',id:'S28_SoloVictoryCashCup',mode:'solo',n:11,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-02-15',id:'S28_ConsoleCashCupsZB',mode:'duo',n:4,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-02-15',id:'S28_ConsoleCashCups',mode:'duo',n:4,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-03-17',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-17',id:'S29_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-03-22',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-22',id:'S29_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-03-28',id:'S29_ConsoleCashCupsZB',mode:'duo',n:1,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-03-28',id:'S29_ConsoleCashCups',mode:'duo',n:1,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-03-29',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-29',id:'S29_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-03-29',id:'S29_PlaystationCupZBMarch',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[81],zb:true},
  {day:'2024-03-30',id:'S29_PlaystationCupMarch',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[81]},
  {day:'2024-03-31',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-31',id:'S29_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-04-03',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-04-03',id:'S29_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-04-18',id:'S29_ConsoleCashCupsZB',mode:'duo',n:2,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-04-18',id:'S29_ConsoleCashCups',mode:'duo',n:2,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-04-24',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-04-24',id:'S29_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-05-05',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:7,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-05-05',id:'S29_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-05-09',id:'S29_ConsoleCashCupsZB',mode:'duo',n:3,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-05-09',id:'S29_ConsoleCashCups',mode:'duo',n:3,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-05-23',id:'S29_ConsoleCashCupsZB',mode:'duo',n:4,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-05-23',id:'S29_ConsoleCashCups',mode:'duo',n:4,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-06-01',id:'LAN_DreamHack_Dallas_2024',mode:'duo',n:1,name:"DreamHack Dallas 2024",payT:CC_CUPS_ARCH_PAY[131],lan:"DreamHack Dallas 2024 · Dallas",invite:148,ewc24:"dallas"},
  {day:'2024-06-02',id:'S30_SquadsVictoryCashCup',mode:'squad',n:1,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-03',id:'S30_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-03',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:1,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-09',id:'S30_SquadsVictoryCashCup',mode:'squad',n:2,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-10',id:'S30_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-10',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:2,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-17',id:'S30_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-17',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:3,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-24',id:'S30_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-24',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:4,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-29',id:'S30_PlaystationCupJune',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[94]},
  {day:'2024-06-29',id:'S30_ConsoleCashCups',mode:'duo',n:1,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[95]},
  {day:'2024-06-30',id:'S30_SquadsVictoryCashCup',mode:'squad',n:3,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-30',id:'S30_PlaystationCupZBJune',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[96],zb:true},
  {day:'2024-07-05',id:'LAN_Esports_World_Cup_2024_Qualifier',mode:'duo',n:1,name:"EWC 2024 Qualifier",payT:CC_CUPS_ARCH_PAY[132],lan:"EWC 2024 Qualifier · Online",invite:999,ewc24:"qual"},
  {day:'2024-07-15',id:'S30_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-07-15',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:5,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-07-22',id:'S30_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-07-22',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:6,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-07-29',id:'S30_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-07-29',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:7,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-08-03',id:'S30_ConsoleCashCups',mode:'duo',n:2,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[95]},
  {day:'2024-08-04',id:'S30_SquadsVictoryCashCup',mode:'squad',n:4,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-05',id:'S30_SoloVictoryCashCup',mode:'solo',n:8,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-05',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:8,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-08-08',id:'LAN_Esports_World_Cup_2024',mode:'duo',n:1,name:"Esports World Cup 2024",payT:CC_CUPS_ARCH_PAY[122],lan:"Esports World Cup 2024 · Riyadh",invite:64,ewc24:true},
  {day:'2024-08-10',id:'S30_ConsoleCashCups',mode:'duo',n:3,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[95]},
  {day:'2024-08-11',id:'S30_SquadsVictoryCashCup',mode:'squad',n:5,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-12',id:'S30_SoloVictoryCashCup',mode:'solo',n:9,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-12',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:9,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-08-30',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:1,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-08-30',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:1,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-08-30',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:1,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-09-01',id:'S31_SquadsReloadVictoryCashCup',mode:'squad',n:1,name:"Reload Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[54]},
  {day:'2024-09-01',id:'S31_PlaystationSypherPKCup',mode:'solo',n:1,name:"PlayStation SypherPK Cup",payT:CC_CUPS_ARCH_PAY[93]},
  {day:'2024-09-02',id:'S31_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-02',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:1,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-06',id:'S31_InfluencerCup',mode:'duo',n:1,name:"katoo FNCS Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-09',id:'S31_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-09',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:2,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-16',id:'S31_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-16',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:3,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-20',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:2,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-20',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:2,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-20',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:2,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-09-20',id:'LAN_Twitch_Rivals_Cracked_Cup',mode:'duo',n:1,name:"Twitch Rivals Cracked Cup",payT:CC_CUPS_ARCH_PAY[112],lan:"Twitch Rivals Cracked Cup · San Diego",invite:36},
  {day:'2024-09-22',id:'S31_SquadsReloadVictoryCashCup',mode:'squad',n:2,name:"Reload Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[54]},
  {day:'2024-09-23',id:'S31_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-23',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:4,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-27',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:3,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-27',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:3,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-27',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:3,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-09-28',id:'S31_SquadsReloadVictoryCashCup',mode:'squad',n:3,name:"Reload Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[54]},
  {day:'2024-09-30',id:'S31_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-30',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:5,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-04',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:4,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-04',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:4,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-04',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:4,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-06',id:'S31_SquadsReloadCup',mode:'squad',n:1,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-06',id:'S31_TriosCashCup',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-07',id:'S31_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-10-07',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:6,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-13',id:'S31_SquadsReloadCup',mode:'squad',n:2,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-13',id:'S31_TriosCashCup',mode:'trio',n:2,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-14',id:'S31_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-10-14',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:7,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-18',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:5,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-18',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:5,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-18',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:5,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-19',id:'S31_SquadsReloadCup',mode:'squad',n:3,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-19',id:'S31_TriosCashCup',mode:'trio',n:3,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-21',id:'S31_SoloVictoryCashCup',mode:'solo',n:8,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-10-21',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:8,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-26',id:'S31_SquadsReloadCup',mode:'squad',n:4,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-26',id:'S31_TriosCashCup',mode:'trio',n:4,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-28',id:'S31_SquadsReloadCup',mode:'squad',n:5,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-28',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:6,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-28',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:6,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-28',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:6,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-29',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:7,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-29',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:7,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-29',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:7,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-30',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:8,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-30',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:8,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-30',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:8,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-31',id:'S31_TriosCashCup',mode:'trio',n:5,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-11-07',id:'S32_TriosCashCup',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-07',id:'S32_TriosCashCup_ZB',mode:'trio',n:1,name:"ZB Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[51],zb:true},
  {day:'2024-11-08',id:'S32_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-08',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:1,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-11-09',id:'S32_TriosCashCup',mode:'trio',n:2,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-09',id:'S32_PlatformReloadDuosCashCupConsole',mode:'duo',n:1,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[90]},
  {day:'2024-11-09',id:'S32_PlatformReloadDuosCashCupMobile',mode:'duo',n:1,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-11-09',id:'S32_PlatformReloadDuosCashCupPC',mode:'duo',n:1,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[90]},
  {day:'2024-11-10',id:'S32_SquadsReloadCup',mode:'squad',n:1,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-11-14',id:'S32_TriosCashCup',mode:'trio',n:3,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-15',id:'S32_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-15',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:2,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-11-16',id:'S32_TriosCashCup',mode:'trio',n:4,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-18',id:'S32_TriosCashCup_ZB',mode:'trio',n:2,name:"ZB Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[51],zb:true},
  {day:'2024-11-21',id:'S32_TriosCashCup',mode:'trio',n:5,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-21',id:'S32_TriosCashCup_ZB',mode:'trio',n:3,name:"ZB Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[51],zb:true},
  {day:'2024-11-22',id:'S32_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-22',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:3,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-11-23',id:'S32_TriosCashCup',mode:'trio',n:6,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-25',id:'S32_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-25',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:4,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-12-08',id:'S33_PlaystationCup',mode:'solo',n:1,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[89]},
  {day:'2025-04-30',id:'S34_PlaystationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[101]},
  {day:'2025-05-10',id:'LAN_Fortnite_Champion_Series_Pro_Am_2025',mode:'duo',n:1,name:"FNCS 2025 Pro-Am",payT:CC_CUPS_ARCH_PAY[113],lan:"FNCS 2025 Pro-Am · Los Angeles",invite:40},
  {day:'2025-05-17',id:'S35_VictoryDuosCup',mode:'duo',n:1,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-05-24',id:'S35_VictoryDuosCup',mode:'duo',n:2,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-05-31',id:'S35_VictoryDuosCup',mode:'duo',n:3,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-05-31',id:'LAN_Twitch_Rivals_Cracked_Cup_TwitchCon_Europe_Reload',mode:'duo',n:1,name:"Twitch Rivals Cracked Cup 2025",payT:CC_CUPS_ARCH_PAY[127],lan:"Twitch Rivals Cracked Cup 2025 · Rotterdam",invite:40,region:'EU'},
  {day:'2025-06-13',id:'S36_VictoryDuosCup',mode:'duo',n:1,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-06-20',id:'S36_VictoryDuosCup',mode:'duo',n:2,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-06-27',id:'S36_VictoryDuosCup',mode:'duo',n:3,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-07-18',id:'S36_VictoryDuosCup',mode:'duo',n:4,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-07-25',id:'S36_VictoryDuosCup',mode:'duo',n:5,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-07-26',id:'S36_PlayStationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[99]},
  {day:'2025-08-01',id:'S36_VictoryDuosCup',mode:'duo',n:6,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-08-17',id:'S37_ConsoleDuosCashCups',mode:'duo',n:1,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-08-22',id:'LAN_Amar_x_Rohat_Cup_2',mode:'duo',n:1,name:"Amar x Rohat Cup #2",payT:CC_CUPS_ARCH_PAY[114],lan:"Amar x Rohat Cup #2 · Cologne",invite:32},
  {day:'2025-08-24',id:'S37_ConsoleDuosCashCups',mode:'duo',n:2,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-08-31',id:'S37_ConsoleDuosCashCups',mode:'duo',n:3,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-04',id:'S37_PlayStationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[99]},
  {day:'2025-09-05',id:'S37_ReloadQuickCup',mode:'duo',n:1,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-09-12',id:'S37_ReloadQuickCup',mode:'duo',n:2,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-09-14',id:'S37_ConsoleDuosCashCups',mode:'duo',n:4,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-19',id:'S37_ReloadQuickCup',mode:'duo',n:3,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-09-20',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:1,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-09-20',id:'S37_ConsoleDuosCashCups',mode:'duo',n:5,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-27',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:2,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-09-27',id:'S37_ConsoleDuosCashCups',mode:'duo',n:6,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-28',id:'S37_ReloadQuickCup',mode:'duo',n:4,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-04',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:3,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-10-04',id:'S37_ConsoleDuosCashCups',mode:'duo',n:7,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-10',id:'S37_ReloadQuickCup',mode:'duo',n:5,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-11',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:4,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-10-11',id:'S37_ConsoleDuosCashCups',mode:'duo',n:8,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-17',id:'S37_ReloadQuickCup',mode:'duo',n:6,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-18',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:5,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-10-18',id:'S37_ConsoleDuosCashCups',mode:'duo',n:9,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-25',id:'S37_ConsoleDuosCashCups',mode:'duo',n:10,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-26',id:'S37_SoloSeriesCup',mode:'solo',n:1,name:"Solo Series",payT:CC_CUPS_ARCH_PAY[60]},
  {day:'2025-10-26',id:'S37_ReloadQuickCup',mode:'duo',n:7,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-29',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:6,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-11-05',id:'S38_TouchOnlyMobileCup',mode:'solo',n:1,name:"Touch-Only Test Cup",payT:CC_CUPS_ARCH_PAY[98],zb:true},
  {day:'2025-11-07',id:'S38_ReloadQuickCup',mode:'duo',n:1,name:"Reload Quick Cup (Reload)",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-08',id:'S38_DuosVictoryCup',mode:'duo',n:1,name:"Duos Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-09',id:'S38_SquadsVictoryCup',mode:'squad',n:1,name:"Squads Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-14',id:'S38_ReloadQuickCup',mode:'duo',n:2,name:"Reload Quick Cup (Reload)",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-15',id:'S38_DuosVictoryCup',mode:'duo',n:2,name:"Duos Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-16',id:'S38_SquadsVictoryCup',mode:'squad',n:2,name:"Squads Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-16',id:'S38_BlitzMobileCup',mode:'solo',n:1,name:"Blitz Mobile Cup",payT:CC_CUPS_ARCH_PAY[100],zb:true},
  {day:'2025-11-21',id:'S38_ReloadQuickCup',mode:'duo',n:3,name:"Reload Quick Cup (Reload)",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-22',id:'S38_DuosVictoryCup',mode:'duo',n:3,name:"Duos Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-23',id:'S38_SquadsVictoryCup',mode:'squad',n:3,name:"Squads Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-23',id:'S38_BlitzMobileCup',mode:'solo',n:2,name:"Blitz Mobile Cup",payT:CC_CUPS_ARCH_PAY[100],zb:true},
  {day:'2025-11-24',id:'S38_SoloSeriesCup',mode:'solo',n:1,name:"Solo Series Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-25',id:'S38_PlayStationCupReload',mode:'duo',n:1,name:"PlayStation Reload Cup",payT:CC_CUPS_ARCH_PAY[97]},
  {day:'2025-12-05',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:1,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-09',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:2,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-13',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:3,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-14',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:4,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-16',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:5,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-20',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:6,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-20',id:'S39_1MillionUnrealCup',mode:'duo',n:1,name:"$1 Million Unreal Cup",payT:CC_CUPS_ARCH_PAY[56]},
  {day:'2025-12-21',id:'S39_NvidiaCup',mode:'solo',n:1,name:"NVIDIA GeForce RTX Cup",payT:CC_CUPS_ARCH_PAY[58]},
  {day:'2026-01-11',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:7,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2026-03-21',id:'LAN_Amar_Lost_Legends_European_Showdown',mode:'squad',n:1,name:"Lost Legends: European Showdown",payT:CC_CUPS_ARCH_PAY[129],zb:true,lan:"Lost Legends: European Showdown · Online",invite:88,region:'EU'},
  {day:'2026-04-22',id:'LAN_Saudi_eLeague_2026',mode:'duo',n:1,name:"Saudi eLeague 2026",payT:CC_CUPS_ARCH_PAY[121],lan:"Saudi eLeague 2026 · Riyadh",invite:40},
  {day:'2026-08-15',id:'LAN_Red_Bull_Red_Bull_Reshuffle_2026_Reload',mode:'solo',n:1,name:"Red Bull Reshuffle",payT:CC_CUPS_ARCH_PAY[115],lan:"Red Bull Reshuffle · Vienna",invite:40,reshuffle:true},
  {day:'2026-09-17',id:'LAN_Virtuocity_Battleground_Qatar_2026',mode:'duo',n:1,name:"Virtuocity Battleground Qatar 2026",payT:CC_CUPS_ARCH_PAY[130],lan:"Virtuocity Battleground Qatar 2026 · Doha",invite:40,region:'ME'},
  {day:'2026-09-21',id:'LAN_Amar_Rohat_Pro_Invitational',mode:'solo',n:1,name:"Amar x Rohat: Pro Invitational",payT:CC_CUPS_ARCH_PAY[116],lan:"Amar x Rohat: Pro Invitational · Online",invite:100}
];
// ==== /Cups archive ====
function ccVictoryBase(){ return ccIs2020() ? [] : ccIs2019() ? CC_VICTORY_2019 : ccIs2021() ? CC_VICTORY_2021 : ccIs2022() ? CC_VICTORY_2022 : ccIs2023() ? CC_VICTORY_2023 : ccIs2024() ? CC_VICTORY_2024 : ccIs2025() ? CC_VICTORY_2025
  : ccYearShift()>0 ? CC_VICTORY.concat(ccNextYearEvents()) : CC_VICTORY; }
/* СОБЫТИЯ 2027-ГО (17.10, его «2» из идей: Epic 27.09.2026 объявил на 2027 Reload Zero Build Championship и Arenas Fight Night —
   fortnitetracker.com/article/2437). Годы после 2026-го живут по календарю 2026-го (ccYearShift), поэтому дни — в датах 2026-го,
   на экране они уже с годом сдвига. Дни выбраны свободные (пятницы без FNCS/кубков, проба free.js). Расписания и призовых Epic
   ещё не публиковал — это наш расклад, а не измерение:
   · Reload Zero Build Championship — два открытых отбора (машина Victory Cup, без строек, лобби Reload) и финал на 40 человек
     по приглашению: топ-10 любого отбора (qualFrom), остальные — по PR.
   · Arenas Fight Night — вечер файтов 1 на 1 сеткой на 16 (runCareerFightNight), до пяти раундов, как дружеский 1v1.
   В игре вдвоём Fight Night нет: сетка не локстеп. */
const CC_Y27_ZBC_PAY={EU:[[1,1500],[2,1000],[3,800],[5,600],[10,400],[25,250],[50,150],[100,100]]};
const CC_Y27_ZBC_FINAL_PAY={EU:[[1,25000],[2,15000],[3,10000],[5,6000],[10,3000],[20,1500]]};
const CC_Y27_FN_PAY={EU:[[1,5000],[2,2500],[4,1000],[8,500]]};
const CC_NEXT_YEAR_EVENTS=[
  {day:'2026-01-30', id:'Y27_ArenasFightNight', mode:'solo', n:1, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY},
  {day:'2026-03-13', id:'Y27_ArenasFightNight', mode:'solo', n:2, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY},
  {day:'2026-04-03', id:'Y27_ReloadZBChampionship_Q', mode:'duo', n:1, name:'Reload Zero Build Championship · Qualifier', zb:true, payT:CC_Y27_ZBC_PAY},
  {day:'2026-04-10', id:'Y27_ReloadZBChampionship_Q', mode:'duo', n:2, name:'Reload Zero Build Championship · Qualifier', zb:true, payT:CC_Y27_ZBC_PAY},
  {day:'2026-04-24', id:'Y27_ReloadZBChampionship_Final', mode:'duo', n:1, name:'Reload Zero Build Championship · Final', zb:true, payT:CC_Y27_ZBC_FINAL_PAY,
   invite:40, qualFrom:['Y27_ReloadZBChampionship_Q'], qualTop:10, prInvite:20},
  {day:'2026-07-31', id:'Y27_ArenasFightNight', mode:'solo', n:3, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY},
  {day:'2026-10-09', id:'Y27_ArenasFightNight', mode:'solo', n:4, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY}
];
function ccNextYearEvents(){
  const mp=typeof ccMpOn==='function' && ccMpOn();
  return CC_NEXT_YEAR_EVENTS.filter(v=>!(mp && v.fight));
}
function ccVictoryListKey(){ let cn=''; try{ cn=(ccShopSlotRank('ps')?'p':'')+(ccShopSlotRank('xbox')?'x':'')+(ccMobileOwn()?'m':''); const ms=CAREER && CAREER.career && CAREER.career.mobSer; if(ms) cn+='|'+ms.next+ms.until+(ms.heat||'');
  const gs=CAREER && CAREER.career && CAREER.career.mobGS; if(gs) cn+='|'+gs.stage+(gs.grp||''); if(CAREER && CAREER.career && CAREER.career.mobLcq) cn+='|l'+CAREER.career.mobLcq; cn+='|'+(ccPlatCalOn('console')?1:0)+(ccPlatCalOn('mobile')?1:0); }catch(e){}
  return ccCalYear()+'|'+ccYearShift()+'|'+((typeof ccMpOn==='function' && ccMpOn()) ? 1 : 0)+'|'+ccOwnCupsVer()+'|z'+((CAREER && CAREER.career && CAREER.career.size)||2)+'|'+cn; }
/* Остальные денежные капы года — всё, что в архиве Tracker платило деньгами (ecomm в
   PayoutTable) и не вошло выше: DreamHack Online Open, Winter Royale, капы стримеров и
   т. п. (CC_CUPS_ARCH, tools/build-cups-archive.js). Вечер — машина Victory Cup, выплаты —
   таблица Epic региона (payT). День, где уже стоит FNCS, кубок дивизиона или другой кап,
   остаётся за ним: два вечера в один день карьера не играет. 2026-й свой список держит сам. */
/* КОНСОЛЬНЫЕ КАПЫ 2026 (его вопрос 14.11 «а консоль капы добавлены?»): PlayStation Cup, Clix/MrSavage, Console Victory и
   Cash Cups — окна Epic с выплатой, таблица по регионам (tools/build-console-2026.js). Играются с консолью (ccConsoleOk). */
const CC_CONSOLE_2026=[{"day":"2026-01-05","id":"S39_MobileSeriesJan","mode":"solo","n":1,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-06","id":"S39_MobileSeriesJan","mode":"solo","n":2,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-07","id":"S39_MobileSeriesJan","mode":"solo","n":3,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-10","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":1,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-01-10","id":"S39_MobileSeriesJan","mode":"solo","n":4,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-11","id":"S39_MobileSeriesJan","mode":"solo","n":5,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-12","id":"S39_MobileSeriesCupJanQual","mode":"solo","n":1,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":3,"plat":"mobile"},{"day":"2026-01-13","id":"S39_KizunaAICupMobile","mode":"solo","n":1,"name":"KizunaAI Mobile Cup","payT":{},"skin":"Character_MarchTreatCup","skinN":"KizunaAI","fmt":true,"plat":"mobile"},{"day":"2026-01-16","id":"S39_MobileSeriesJan","mode":"solo","n":6,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-17","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":2,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-01-17","id":"S39_MobileSeriesJan","mode":"solo","n":7,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-18","id":"S39_MobileSeriesJan","mode":"solo","n":8,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-23","id":"S39_MobileSeriesJan","mode":"solo","n":9,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-24","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":3,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-01-24","id":"S39_MobileSeriesJan","mode":"solo","n":10,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-25","id":"S39_MobileSeriesCupJanQual","mode":"solo","n":2,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":4,"plat":"mobile"},{"day":"2026-01-30","id":"S39_MobileSeriesFeb","mode":"solo","n":1,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-01-31","id":"S39_MobileSeriesFeb","mode":"solo","n":2,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-01","id":"S39_PlayStationCupZB","mode":"solo","n":1,"name":"PlayStation Cup (Zero Build)","payT":{"EU":[[1,8000],[2,4000],[3,3000],[4,2000],[5,1600],[6,1200],[7,1000],[8,800],[9,700],[10,600],[20,500],[30,300],[50,200]],"NAC":[[1,5000],[2,3000],[3,2000],[4,1600],[5,1200],[6,1000],[7,800],[8,600],[9,500],[10,400],[20,300],[30,200],[50,100]],"NAW":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"BR":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"ASIA":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"ME":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"OCE":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]]},"zb":true,"plat":"ps"},{"day":"2026-02-01","id":"S39_MobileSeriesFeb","mode":"solo","n":3,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-01","id":"S39_PlayStationCup","mode":"solo","n":1,"name":"PlayStation Cup (Battle Royale)","payT":{"EU":[[1,8000],[2,4000],[3,3000],[4,2000],[5,1600],[6,1200],[7,1000],[8,800],[9,700],[10,600],[20,500],[30,300],[50,200]],"NAC":[[1,5000],[2,3000],[3,2000],[4,1600],[5,1200],[6,1000],[7,800],[8,600],[9,500],[10,400],[20,300],[30,200],[50,100]],"NAW":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"BR":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"ASIA":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"ME":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]],"OCE":[[1,1500],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200],[25,100]]},"plat":"ps"},{"day":"2026-02-04","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":4,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-02-05","id":"S39_MobileTestCup","mode":"solo","n":1,"name":"Touch-Only Test Cup","payT":{"EU":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],"NAC":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]]},"plat":"mobile"},{"day":"2026-02-06","id":"S39_MobileSeriesFeb","mode":"solo","n":4,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-07","id":"S39_MobileSeriesFeb","mode":"solo","n":5,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-07","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":5,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-02-08","id":"S39_MobileSeriesCupFebQual","mode":"solo","n":1,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":5,"plat":"mobile"},{"day":"2026-02-12","id":"S39_MobileTestCup","mode":"solo","n":2,"name":"Touch-Only Test Cup","payT":{"EU":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],"NAC":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]]},"plat":"mobile"},{"day":"2026-02-13","id":"S39_MobileSeriesFeb","mode":"solo","n":6,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-14","id":"S39_MobileSeriesFeb","mode":"solo","n":7,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-14","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":6,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-02-15","id":"S39_MobileSeriesFeb","mode":"solo","n":8,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-19","id":"S39_MobileTestCup","mode":"solo","n":3,"name":"Touch-Only Test Cup","payT":{"EU":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],"NAC":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]]},"plat":"mobile"},{"day":"2026-02-19","id":"S39_SoloLevelingMobileCup","mode":"solo","n":1,"name":"Solo Leveling: Arise Mobile Cup","payT":{},"skin":"Character_RampCanal","skinN":"Sung Jinwoo","fmt":true,"plat":"mobile"},{"day":"2026-02-20","id":"S39_MobileSeriesFeb","mode":"solo","n":9,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-21","id":"S39_MobileSeriesFeb","mode":"solo","n":10,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-21","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":7,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-02-22","id":"S39_MobileSeriesCupFebQual","mode":"solo","n":2,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":6,"plat":"mobile"},{"day":"2026-02-26","id":"S39_MobileTestCup","mode":"solo","n":4,"name":"Touch-Only Test Cup","payT":{"EU":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],"NAC":[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]]},"plat":"mobile"},{"day":"2026-02-27","id":"S39_MobileSeriesMar","mode":"solo","n":1,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-28","id":"S39_MobileSeriesMar","mode":"solo","n":2,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-02-28","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":8,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-03-01","id":"S39_MobileSeriesMar","mode":"solo","n":3,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-03-06","id":"S39_MobileSeriesMar","mode":"solo","n":4,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-03-07","id":"S39_MobileSeriesMar","mode":"solo","n":5,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-03-07","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":9,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-03-08","id":"S39_MobileSeriesCupMarQual","mode":"solo","n":1,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":7,"plat":"mobile"},{"day":"2026-03-14","id":"S39_DuosConsoleVictoryCupZB_Jan","mode":"duo","n":10,"name":"Duos Console Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-03-22","id":"S40_PlayStationCupMrSavage_Final","mode":"solo","n":1,"name":"PlayStation MrSavage Cup (Battle Royale) Finals","payT":{"EU":[[100,750],[200,1500],[300,2250],[400,3000],[500,3750],[600,4500]],"NAC":[[100,750],[200,1500],[300,2250],[400,3000],[500,3750],[600,4500]],"NAW":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"BR":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ASIA":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ME":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"OCE":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]]},"plat":"ps"},{"day":"2026-03-27","id":"S40_MobileSeriesMar","mode":"solo","n":1,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-03-28","id":"S40_ConsoleVCC_SolosZB","mode":"solo","n":1,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-03-28","id":"S40_MobileSeriesMar","mode":"solo","n":2,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-03-29","id":"S40_MobileSeriesMar","mode":"solo","n":3,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-03","id":"S40_MobileSeriesMar","mode":"solo","n":4,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-04","id":"S40_MobileSeriesMar","mode":"solo","n":5,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-05","id":"S40_MobileSeriesCupQual","mode":"solo","n":1,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":8,"plat":"mobile"},{"day":"2026-04-05","id":"S40_ConsoleCC_TriosZB","mode":"trio","n":1,"name":"Console Trios Cash Cup (ZB)","payT":{"EU":[[1,500],[2,400],[3,300],[4,200],[5,100]],"NAC":[[1,500],[2,400],[3,300],[4,200],[5,100]],"NAW":[[1,300],[2,200],[3,100]],"BR":[[1,300],[2,200],[3,100]],"ASIA":[[1,300],[2,200],[3,100]],"ME":[[1,300],[2,200],[3,100]],"OCE":[[1,300],[2,200],[3,100]]},"zb":true,"plat":"any"},{"day":"2026-04-10","id":"S40_MobileSeriesApr","mode":"solo","n":1,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-11","id":"S40_MobileSeriesApr","mode":"solo","n":2,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-11","id":"S40_ConsoleVCC_SolosZB","mode":"solo","n":2,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-04-12","id":"S40_MobileSeriesApr","mode":"solo","n":3,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-15","id":"S40_TripleThreatMobileCup","mode":"solo","n":1,"name":"Triple Threat Mobile Cup","payT":{},"skin":"Character_AlderOptic","skinN":"Triple Threat Sommerset","fmt":true,"plat":"mobile"},{"day":"2026-04-17","id":"S40_MobileSeriesApr","mode":"solo","n":4,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-18","id":"S40_MobileSeriesApr","mode":"solo","n":5,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-19","id":"S40_MobileSeriesCupQual","mode":"solo","n":2,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":9,"plat":"mobile"},{"day":"2026-04-24","id":"S40_MobileSeriesApr","mode":"solo","n":6,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-25","id":"S40_MobileSeriesApr","mode":"solo","n":7,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-26","id":"S40_MobileSeriesApr","mode":"solo","n":8,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-04-26","id":"S40_ConsoleCC_TriosZB","mode":"trio","n":2,"name":"Console Trios Cash Cup (ZB)","payT":{"EU":[[1,500],[2,400],[3,300],[4,200],[5,100]],"NAC":[[1,500],[2,400],[3,300],[4,200],[5,100]],"NAW":[[1,300],[2,200],[3,100]],"BR":[[1,300],[2,200],[3,100]],"ASIA":[[1,300],[2,200],[3,100]],"ME":[[1,300],[2,200],[3,100]],"OCE":[[1,300],[2,200],[3,100]]},"zb":true,"plat":"any"},{"day":"2026-05-01","id":"S40_MobileSeriesApr","mode":"solo","n":9,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-05-02","id":"S40_PlayStationCupClix","mode":"solo","n":1,"name":"PlayStation Clix Cup (Battle Royale)","payT":{"EU":[[100,750],[200,1500],[300,2250],[400,3000],[500,3750],[600,4500]],"NAC":[[100,750],[200,1500],[300,2250],[400,3000],[500,3750],[600,4500]],"NAW":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"BR":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ASIA":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ME":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"OCE":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]]},"plat":"ps"},{"day":"2026-05-02","id":"S40_MobileSeriesApr","mode":"solo","n":10,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-05-03","id":"S40_MobileSeriesCupQual","mode":"solo","n":3,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":10,"plat":"mobile"},{"day":"2026-05-08","id":"S40_MobileSeriesMay","mode":"solo","n":1,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-05-09","id":"S40_MobileSeriesMay","mode":"solo","n":2,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-05-09","id":"S40_ConsoleVCC_SolosZB","mode":"solo","n":3,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-05-10","id":"S40_MobileSeriesMay","mode":"solo","n":3,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-05-15","id":"S40_MobileSeriesMay","mode":"solo","n":4,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-05-16","id":"S40_MobileSeriesMay","mode":"solo","n":5,"name":"Mobile Series","payT":{},"series":"round","plat":"mobile"},{"day":"2026-05-17","id":"S40_MobileSeriesCupQual","mode":"solo","n":4,"name":"Mobile Series","payT":{"EU":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAC":[[1,1000],[2,900],[3,800],[4,700],[8,500],[12,200],[16,100]],"NAW":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"BR":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ASIA":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"ME":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]],"OCE":[[1,700],[2,600],[3,500],[4,400],[8,250],[12,200],[16,100]]},"series":"cup","invite":16,"q":11,"plat":"mobile"},{"day":"2026-05-20","id":"S40_MandalorianMobileCup","mode":"solo","n":1,"name":"The Mandalorian Cup (Mobile)","payT":{},"skin":"Character_ChiliAbide","skinN":"The Mandalorian (Pen & Ink)","fmt":true,"plat":"mobile"},{"day":"2026-06-09","id":"S41_PSCupDaysOfPlay_ZB","mode":"solo","n":1,"name":"Days of Play PlayStation Cup (Zero Build)","payT":{"EU":[[1,4500],[2,3500],[3,2500],[4,2000],[5,1500],[6,1200],[7,1000],[8,900],[9,800],[10,700],[11,600],[12,500],[13,400],[15,300],[25,250],[35,200],[50,150],[100,100]],"NAC":[[1,3500],[2,2500],[3,2000],[4,1500],[5,1000],[6,600],[7,500],[8,400],[9,300],[10,250],[15,200],[50,150],[75,100],[100,50]],"NAW":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"BR":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"ASIA":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"ME":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"OCE":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]]},"zb":true,"plat":"ps"},{"day":"2026-06-10","id":"S41_PSCupDaysOfPlay","mode":"solo","n":1,"name":"Days of Play PlayStation Cup (Battle Royale)","payT":{"EU":[[1,4500],[2,3500],[3,2500],[4,2000],[5,1500],[6,1200],[7,1000],[8,900],[9,800],[10,700],[11,600],[12,500],[13,400],[15,300],[25,250],[35,200],[50,150],[100,100]],"NAC":[[1,3500],[2,2500],[3,2000],[4,1500],[5,1000],[6,600],[7,500],[8,400],[9,300],[10,250],[15,200],[50,150],[75,100],[100,50]],"NAW":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"BR":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"ASIA":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"ME":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]],"OCE":[[1,1000],[2,700],[3,600],[4,500],[5,400],[7,300],[9,250],[10,200],[20,150],[50,100]]},"plat":"ps"},{"day":"2026-06-10","id":"S41_ViniJr_Mobile","mode":"solo","n":1,"name":"Vini Jr Icon Cup Mobile","payT":{},"skin":"Character_ChewyStaveCurve","skinN":"Vini Jr.","fmt":true,"plat":"mobile"},{"day":"2026-06-13","id":"S41_MobileSeriesOpen","mode":"solo","n":1,"name":"Mobile Series Round Stage","payT":{},"series":"round","plat":"mobile"},{"day":"2026-06-14","id":"S41_ConsoleVCC_SolosZB","mode":"solo","n":1,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-06-14","id":"S41_MobileSeriesOpen","mode":"solo","n":2,"name":"Mobile Series Round Stage","payT":{},"series":"round","plat":"mobile"},{"day":"2026-06-15","id":"S41_ConsoleCC_DuosZB","mode":"duo","n":1,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-06-20","id":"S41_MobileSeriesHeat4","mode":"solo","n":1,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":4,"plat":"mobile"},{"day":"2026-06-20","id":"S41_MobileSeriesHeat3","mode":"solo","n":1,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":3,"plat":"mobile"},{"day":"2026-06-20","id":"S41_MobileSeriesHeat2","mode":"solo","n":1,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":2,"plat":"mobile"},{"day":"2026-06-20","id":"S41_MobileSeriesHeat1","mode":"solo","n":1,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":1,"plat":"mobile"},{"day":"2026-06-21","id":"S41_ConsoleVCC_SolosZB","mode":"solo","n":2,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-06-21","id":"S41_MobileVictoryCup_ReloadminiV","mode":"solo","n":1,"name":"Mobile Reload (Mini Venture) Victory Cup","payT":{"EU":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAC":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAW":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"BR":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ASIA":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ME":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"OCE":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]]},"plat":"mobile"},{"day":"2026-06-22","id":"S41_ConsoleCC_DuosZB","mode":"duo","n":2,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-06-24","id":"S41_SupergirlMobileCup","mode":"solo","n":1,"name":"Supergirl Cup Mobile","payT":{},"skin":"Character_VowelSleep","skinN":"Supergirl","fmt":true,"plat":"mobile"},{"day":"2026-06-27","id":"S41_MobileSeriesCupQual","mode":"solo","n":1,"name":"Mobile Series Qualifier","payT":{"EU":[[1,1500],[2,1200],[3,1000],[4,900],[5,800],[6,750],[7,700],[8,650],[10,600],[12,500],[14,400],[16,300]],"NAC":[[1,1500],[2,1200],[3,1000],[4,900],[5,800],[6,750],[7,700],[8,650],[10,600],[12,500],[14,400],[16,300]],"NAW":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"BR":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"ASIA":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"ME":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"OCE":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]]},"series":"cup","invite":16,"q":12,"plat":"mobile"},{"day":"2026-06-28","id":"S41_MobileVictoryCup_BR","mode":"solo","n":1,"name":"Mobile Battle Royale Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"plat":"mobile"},{"day":"2026-07-15","id":"S41_TheOdysseyCup_Mobile","mode":"solo","n":1,"name":"The Odyssey Cup Mobile","payT":{},"skin":"Character_HornetBerm","skinN":"Odysseus","fmt":true,"plat":"mobile"},{"day":"2026-07-18","id":"S41_MobileSeriesOpen","mode":"solo","n":3,"name":"Mobile Series Round Stage","payT":{},"series":"round","plat":"mobile"},{"day":"2026-07-19","id":"S41_ConsoleVCC_SolosZB","mode":"solo","n":3,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-07-19","id":"S41_MobileSeriesOpen","mode":"solo","n":4,"name":"Mobile Series Round Stage","payT":{},"series":"round","plat":"mobile"},{"day":"2026-07-20","id":"S41_ConsoleCC_DuosZB","mode":"duo","n":3,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-07-24","id":"S41_CashCup_DuosZB","mode":"duo","n":1,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-07-25","id":"S41_MobileSeriesHeat4","mode":"solo","n":2,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":4,"plat":"mobile"},{"day":"2026-07-25","id":"S41_MobileSeriesHeat3","mode":"solo","n":2,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":3,"plat":"mobile"},{"day":"2026-07-25","id":"S41_MobileSeriesHeat2","mode":"solo","n":2,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":2,"plat":"mobile"},{"day":"2026-07-25","id":"S41_MobileSeriesHeat1","mode":"solo","n":2,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":1,"plat":"mobile"},{"day":"2026-07-26","id":"S41_MobileVictoryCup_ZBReload","mode":"solo","n":1,"name":"Mobile Zero Build Reload (Elite Stronghold) Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"mobile"},{"day":"2026-07-26","id":"S41_ConsoleVCC_SolosZB","mode":"solo","n":4,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-07-27","id":"S41_ConsoleCC_DuosZB","mode":"duo","n":4,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-07-31","id":"S41_PSTypicalGamer","mode":"solo","n":1,"name":"PlayStation Typical Gamer Icon Cup Battle Royale","payT":{"EU":[[100,1500],[200,3000],[300,4500],[400,6000],[500,7500],[600,9000]],"NAC":[[100,1000],[200,2000],[300,3000],[400,4000],[500,5000],[600,6000]],"NAW":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"BR":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"ASIA":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ME":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"OCE":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]]},"plat":"ps"},{"day":"2026-08-01","id":"S41_MobileSeriesCupQual","mode":"solo","n":2,"name":"Mobile Series Qualifier","payT":{"EU":[[1,1500],[2,1200],[3,1000],[4,900],[5,800],[6,750],[7,700],[8,650],[10,600],[12,500],[14,400],[16,300]],"NAC":[[1,1500],[2,1200],[3,1000],[4,900],[5,800],[6,750],[7,700],[8,650],[10,600],[12,500],[14,400],[16,300]],"NAW":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"BR":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"ASIA":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"ME":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"OCE":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]]},"series":"cup","invite":16,"q":13,"plat":"mobile"},{"day":"2026-08-02","id":"S41_ConsoleVCC_SolosZB","mode":"solo","n":5,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-08-03","id":"S41_MobileVictoryCup_ZB","mode":"solo","n":1,"name":"Mobile Zero Build Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"mobile"},{"day":"2026-08-04","id":"S41_PSTypicalGamer_ZB","mode":"solo","n":1,"name":"PlayStation Typical Gamer Icon Cup Zero Build","payT":{"EU":[[100,1500],[200,3000],[300,4500],[400,6000],[500,7500],[600,9000]],"NAC":[[100,1000],[200,2000],[300,3000],[400,4000],[500,5000],[600,6000]],"NAW":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"BR":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"ASIA":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ME":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"OCE":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]]},"zb":true,"plat":"ps"},{"day":"2026-08-08","id":"S41_MobileSeriesOpen","mode":"solo","n":5,"name":"Mobile Series Round Stage","payT":{},"series":"round","plat":"mobile"},{"day":"2026-08-09","id":"S41_CashCup_DuosZB","mode":"duo","n":2,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-08-09","id":"S41_ConsoleVCC_SolosZB","mode":"solo","n":6,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-08-09","id":"S41_MobileSeriesOpen","mode":"solo","n":6,"name":"Mobile Series Round Stage","payT":{},"series":"round","plat":"mobile"},{"day":"2026-08-10","id":"S41_ConsoleCC_DuosZB","mode":"duo","n":5,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-08-15","id":"S41_MobileSeriesHeat4","mode":"solo","n":3,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":4,"plat":"mobile"},{"day":"2026-08-15","id":"S41_MobileSeriesHeat3","mode":"solo","n":3,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":3,"plat":"mobile"},{"day":"2026-08-15","id":"S41_MobileSeriesHeat2","mode":"solo","n":3,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":2,"plat":"mobile"},{"day":"2026-08-15","id":"S41_MobileSeriesHeat1","mode":"solo","n":3,"name":"Mobile Series Heats","payT":{"EU":[[8,200],[12,150],[16,100]],"NAC":[[8,200],[12,150],[16,100]],"NAW":[[8,150],[16,100]],"BR":[[8,150],[16,100]],"ASIA":[[8,150],[16,100]],"ME":[[8,150],[16,100]],"OCE":[[8,150],[16,100]]},"series":"heats","invite":16,"heat":1,"plat":"mobile"},{"day":"2026-08-16","id":"S41_MobileSeriesCupQual","mode":"solo","n":3,"name":"Mobile Series Qualifier","payT":{"EU":[[1,1500],[2,1200],[3,1000],[4,900],[5,800],[6,750],[7,700],[8,650],[10,600],[12,500],[14,400],[16,300]],"NAC":[[1,1500],[2,1200],[3,1000],[4,900],[5,800],[6,750],[7,700],[8,650],[10,600],[12,500],[14,400],[16,300]],"NAW":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"BR":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"ASIA":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"ME":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]],"OCE":[[1,1200],[2,1000],[3,800],[4,700],[6,600],[8,500],[10,400],[12,300],[14,250],[16,200]]},"series":"cup","invite":16,"q":14,"plat":"mobile"},{"day":"2026-08-16","id":"S41_ConsoleVCC_SolosZB","mode":"solo","n":7,"name":"Console Solo Victory Cup (ZB)","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-08-17","id":"S41_MobileVictoryCup_RES","mode":"solo","n":1,"name":"Mobile Reload (Elite Stronghold) Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"plat":"mobile"},{"day":"2026-08-17","id":"S41_ConsoleCC_DuosZB","mode":"duo","n":6,"name":"Console Duos ZB Cash Cup","payT":{"EU":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAC":[[1,600],[2,450],[3,300],[4,200],[5,150],[8,100]],"NAW":[[1,300],[2,250],[3,200],[4,150],[5,100]],"BR":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ASIA":[[1,300],[2,250],[3,200],[4,150],[5,100]],"ME":[[1,300],[2,250],[3,200],[4,150],[5,100]],"OCE":[[1,300],[2,250],[3,200],[4,150],[5,100]]},"zb":true,"plat":"any"},{"day":"2026-08-28","id":"S42_CrashBandicootMobileCup","mode":"solo","n":1,"name":"Override Series: Crash Bandicoot Mobile Cup Mobile","payT":{},"skin":"Character_SpruceBark","skinN":"Crash Bandicoot","fmt":true,"plat":"mobile"},{"day":"2026-08-29","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":1,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-09-05","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":2,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-09-05","id":"S42_MobileSeriesLCQ","mode":"solo","n":1,"name":"Mobile Series Last Chance Qualifier","payT":{},"series":"lcq1","plat":"mobile"},{"day":"2026-09-06","id":"S42_MobileSeriesLCQ","mode":"solo","n":2,"name":"Mobile Series Last Chance Qualifier","payT":{},"series":"lcq2","invite":160,"plat":"mobile"},{"day":"2026-09-08","id":"S42_MegaManCup_Mobile","mode":"solo","n":1,"name":"Override Series: Mega Man Mobile Cup","payT":{},"skin":"Character_DuneBriefMerry","skinN":"Mega Man (Dual Override)","fmt":true,"plat":"mobile"},{"day":"2026-09-12","id":"S42_MobileSeriesGroup2","mode":"solo","n":1,"name":"Mobile Series Group Stage","payT":{},"series":"group","invite":16,"grp":2,"plat":"mobile"},{"day":"2026-09-12","id":"S42_MobileSeriesGroup1","mode":"solo","n":1,"name":"Mobile Series Group Stage","payT":{},"series":"group","invite":16,"grp":1,"plat":"mobile"},{"day":"2026-09-12","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":3,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-09-13","id":"S42_MobileSeriesCupSemiFinal","mode":"solo","n":1,"name":"Mobile Series Semifinal","payT":{},"series":"semi","invite":16,"plat":"mobile"},{"day":"2026-09-18","id":"S42_KingdomHeartsCup_Mobile","mode":"solo","n":1,"name":"Override Series: KINGDOM HEARTS Mobile Cup Battle Royale","payT":{},"skin":"Character_SpireTend","skinN":"Sora","fmt":true,"plat":"mobile"},{"day":"2026-09-19","id":"S42_MobileVictoryCup_ReloadminiV","mode":"solo","n":1,"name":"Mobile Reload (Mini Venture) Victory Cup","payT":{"EU":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAC":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAW":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"BR":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ASIA":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ME":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"OCE":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]]},"plat":"mobile"},{"day":"2026-09-19","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":4,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-09-24","id":"S42_MadisonBeerIconCup_Mobile","mode":"solo","n":1,"name":"Madison Beer Icon Mobile Cup","payT":{},"skin":"Character_MistTycoonLife","skinN":"Satin Angel Madison","fmt":true,"plat":"mobile"},{"day":"2026-09-25","id":"S42_Persona5Cup_Mobile","mode":"solo","n":1,"name":"Override Series: Persona 5 Royal Mobile Cup","payT":{},"skin":"Character_CosmicTrellis","skinN":"Joker (P5R)","fmt":true,"plat":"mobile"},{"day":"2026-09-26","id":"S42_MobileVictoryCup_ReloadminiV","mode":"solo","n":2,"name":"Mobile Reload (Mini Venture) Victory Cup","payT":{"EU":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAC":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAW":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"BR":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ASIA":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ME":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"OCE":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]]},"plat":"mobile"},{"day":"2026-10-03","id":"S42_MobileVictoryCup_ReloadminiV","mode":"solo","n":3,"name":"Mobile Reload (Mini Venture) Victory Cup","payT":{"EU":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAC":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAW":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"BR":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ASIA":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ME":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"OCE":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]]},"plat":"mobile"},{"day":"2026-10-03","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":5,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-10-07","id":"S42_PSNickEh30","mode":"solo","n":1,"name":"PlayStation NickEh30 Icon Cup Battle Royale","payT":{"EU":[[100,1500],[200,3000],[300,4500],[400,6000],[500,7500],[600,9000]],"NAC":[[100,1000],[200,2000],[300,3000],[400,4000],[500,5000],[600,6000]],"NAW":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"BR":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"ASIA":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ME":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"OCE":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]]},"plat":"ps"},{"day":"2026-10-08","id":"S42_PSNickEh30_ZB","mode":"solo","n":1,"name":"PlayStation NickEh30 Icon Cup Zero Build","payT":{"EU":[[100,1500],[200,3000],[300,4500],[400,6000],[500,7500],[600,9000]],"NAC":[[100,1000],[200,2000],[300,3000],[400,4000],[500,5000],[600,6000]],"NAW":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"BR":[[100,500],[200,1000],[300,1500],[400,2000],[500,2500],[600,3000]],"ASIA":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"ME":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]],"OCE":[[100,250],[200,500],[300,750],[400,1000],[500,1250],[600,1500]]},"zb":true,"plat":"ps"},{"day":"2026-10-10","id":"S42_MobileVictoryCup_ReloadminiV","mode":"solo","n":4,"name":"Mobile Reload (Mini Venture) Victory Cup","payT":{"EU":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAC":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAW":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"BR":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ASIA":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ME":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"OCE":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]]},"plat":"mobile"},{"day":"2026-10-10","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":6,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-10-17","id":"S42_MobileVictoryCup_ReloadminiV","mode":"solo","n":5,"name":"Mobile Reload (Mini Venture) Victory Cup","payT":{"EU":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAC":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"NAW":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"BR":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ASIA":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"ME":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]],"OCE":[[100,50],[200,100],[300,150],[400,200],[500,250],[600,300]]},"plat":"mobile"},{"day":"2026-10-17","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":7,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-10-24","id":"S42_ConsoleVCC_SolosZB","mode":"solo","n":8,"name":"Console Zero Build Solo Victory Cup","payT":{"EU":[[100,100],[200,200],[300,300]],"NAC":[[100,100],[200,200],[300,300]],"NAW":[[100,100],[200,200],[300,300]],"BR":[[100,100],[200,200],[300,300]],"ASIA":[[100,100],[200,200],[300,300]],"ME":[[100,100],[200,200],[300,300]],"OCE":[[100,100],[200,200],[300,300]]},"zb":true,"plat":"any"},{"day":"2026-10-24","id":"MobileSeriesChampionship2026","mode":"solo","n":1,"name":"Mobile Series Championship","payT":{"EU":[[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],[11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]],"NAC":[[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],[11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]],"NAW":[[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],[11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]],"BR":[[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],[11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]],"ASIA":[[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],[11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]],"ME":[[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],[11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]],"OCE":[[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],[11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]]},"series":"champ","invite":16,"games":25,"day1":12,"plat":"mobile"}];
/* МОБИЛЬНАЯ СЦЕНА (его слово 14.11: «там же совсем другие игроки играют»): настоящие игроки мобильных таблиц Epic 2026 по
   регионам, рейтинг 62–92 по процентилю их очков в этих таблицах (tools/build-mobile-roster.js; порядок — данные, шкала — решение). Мобильный кап садит их, а не ПК-сцену. */
const CC_MOBILE_ROSTER={"OCE":[["mtrx dogeee",null,92],["Reo",null,91.7],["mtrx rises","um",91.5],["hardman","ru",91.2],["Selfish Girl.","us",90.9],["king luke99","au",90.6],["vediits","us",90.4],["Mohanad","ps",90.1],["Parca","it",89.8],["OPI EliBoi","aq",89.6],["zаyr0","gb",89.3],["あくりあ","jp",89.1],["hylnd amp","us",88.8],["FA Keyxity 203","co",88.5],["the big frz","au",88.3],["yotta guɿäʙöɴ-ɷ-","jp",88],["ghostofalltime","ca",87.8],["TT TAKEOVER 67","il",87.5],["REO","jp",87.1],["モバイル勢のまかろん","zw",87.1],["FnX IAmNoob.",null,86.7],["Smicho15","mx",86.5],["arxidz","au",86.2],["zig x copenhagen",null,86],["juxcyyǃ",null,85.7],["FLC Malinacr7","pl",85.5],["Brokenipad",null,85.2],["JаyOsama","us",84.9],["아무도 나를 건드릴 수 없어",null,84.9],["Zumifnm",null,84.5],["Slursxz",null,84.2],["JOGO Hardman",null,83.9],["Plahs!","us",83.9],["DIG Arsenic","us",83.5],["ARXIDZ","au",83.2],["Dark","us",83.2],["kiwix fv ǃ",null,82.8],["okt x fnm 2026","ru",82.6],["Shipski ","pl",82.3],["AMP","us",82],["f7712494944a4484b513036b29d74dec",null,82],["RowanFNM 67","be",81.5],["ˢʷᵉᵈᶦˢʰaura 67.",null,81.5],["RXB Lucka","sk",81.2],["Ololo 88",null,80.9],["synthreoiamnoob",null,80.7],["MMC KAAN BABA","jp",80.4],["ZNN Arnau ム","es",80.4],["Fuzion","pl",79.8],["가장 빠른 모바일",null,79.8],["ﾠﾠﾠ ﾠﾠﾠﾠﾠﾠﾠﾠ ﾠﾠ","kr",79.8],["Hawkeyedx","us",79.4],["BURNING UP FOR U","jp",78.7],["De_Tibbe","nl",78.7],["Twtr VestalixFN","nl",78.7],["gﱞhﱞоﱞst","ca",78.7],["we_hit_arsenic","us",78.7],["Kооmse","us",77.8],["VEDIITS","us",77.8],["ꌗꋖiꇙꏂꋖꂵꋖꎇ","ru",77.8],["ㅤLukeyㅤㅤ",null,77.4],["MTB Ultra","ae",77.1],["TT papier","nl",77.1],["GR zenith in blm",null,76.8],["antzguru 777",null,76.5],["апаңа айтпа",null,76.5],["Bobjrfv",null,75.7],["Gepardǃ","de",75.7],["PH rrit",null,75.7],["andreshterr444","it",75.7],["imneegy-_-",null,75.7],["BIG ADAHO SLAM",null,74.5],["Evil Fortnіte",null,74.5],["Unrealiana",null,74.5],["VPR Sabbia","co",74.5],["VPR snakko 67","ae",74.5],["ZRT Maioza","fr",74.5],["שًٍَِّ今際の際שًٍَِّ","us",74.5],["BACH","us",73.6],["Lotti Lotti구 구 구",null,73.6],["azeﱞn","kr",73.6],["LeGingAuraSweats",null,73],["cr67 Redeagle",null,73],["眠っているヤギ","br",73],["TikTok Clictro.","ro",72.4],["Zentox 7","cz",72.4],["alexitoz ayǃ","us",72.4],["Gardo 8.","it",71.8],["The Gugaa","pt",71.8],["VAMOS アレド 67","it",71.8],["rainbowpuppy67",null,71.8],["2KGHantel","de",71],["KorvaxNC","fr",71],["Prime Tykirwan",null,71],["Slaуzz 诶","pr",71],["ig tennishamios",null,71],["Foxjayyy",null,70.2],["Juvzy","ht",70.2],["King Kong ROOKI","be",70.2],["NTO alexii",null,70.2],["Plaplec",null,70.2],["DOMNU1NGINER","ro",69.5],["Zehnitsu",null,69.5],["Żayko",null,69.5],["MOHANAD","ps",68.8],["Omerzǃ","nl",68.8],["Tiktok Sudxylol","us",68.8],["efluxe",null,68.8],["most hated koda",null,68.8],["ѕуnth","pr",68.8],["Alex",null,67.9],["BROZO","pl",67.9],["CHŁOP.",null,67.9],["Gianbattista9-","it",67.9],["timez 燥",null,67.9],["와일드 포니",null,67.9],["IAMNOOB","gb",66.9],["MFX xilo","it",66.9],["MTB Pollo",null,66.9],["MoetyIceman",null,66.9],["S1neD","ua",66.9],["Tiktok Rashimfn",null,66.9],["klutzfnm","jp",66.9],["void vypex","ro",66.9],["DIG Sуnth","us",65.9],["EdzX-",null,65.9],["Fledermuesly",null,65.9],["GE ropey",null,65.9],["Olivarius9","pl",65.9],["flipmyburgerr",null,65.9],["4zn .",null,65.1],["DADDY CHILL KAMI","us",65.1],["Madolrr",null,65.1],["TGA Krbër 7ǃ","es",65.1],["TikTok.JonFNM","us",65.1],["mydro ","nl",65.1],["pepardoelpetardo","es",65.1],["tiktok bach87.","us",65.1],["Lyftfnm",null,64.5],["Mobile Fresco",null,64.5],["Dash1x6180Fan","se",64],["MFN Shadowxddddd",null,64],["Schmalibuca","de",64],["Triggerbot3x",null,64],["bonecracker101",null,64],["chilleadd","ch",64],["pottyfv returnsǃ",null,64],["вась двести вась",null,64],["A1ALEX","us",62.5],["AQURIA","jp",62.5],["AlbaXna","it",62.5],["CILLIC","us",62.5],["KDGᵗʷⁱᵗᵗʳSlayahw",null,62.5],["KROBER","es",62.5],["LurkFNM",null,62.5],["MYDRO","nl",62.5],["Ololo Aliǃ","gb",62.5],["RexizZ00","gr",62.5],["Tik tok polloǃ",null,62.5],["TikTok AlekFNM.",null,62.5],["User-9d82b63844","ru",62.5],["Youngstillz",null,62.5],["ZAYR0","gb",62.5],["arkcuit",null,62.5],["azen montana",null,62.5],["duyfv","gb",62.5],["foulѕ",null,62.5],["hass14k",null,62.5],["npc blxzzy","us",62.5],["og. .","us",62.5],["sabbia 8","it",62.5],["seanzfnm","au",62.5],["tiktok wtvdread",null,62.5],["x0vvp","us",62.5],["Артем Налбандян","es",62.5],["ѕwiiftz","ae",62.5],["ﾠﾠﾠﾠ67ﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠ",null,62.5]],"ASIA":[["モバイル勢のまかろん","zw",92],["Reo",null,91.7],["mtrx rises","um",91.5],["mtrx dogeee",null,91.2],["hardman","ru",91],["Selfish Girl.","us",90.7],["vediits","us",90.4],["king luke99","au",90.2],["Mohanad","ps",89.9],["DIG Arsenic","us",89.4],["FA Keyxity 203","co",89.4],["OPI EliBoi","aq",89.4],["FLC Malinacr7","pl",88.9],["Shipski ","pl",88.7],["RXB Lucka","sk",88.3],["Smicho15","mx",88.3],["Kооmse","us",87.5],["REO","jp",87.5],["TT TAKEOVER 67","il",87.5],["Unrealiana",null,87.5],["Juvzy","ht",86.7],["ghostofalltime","ca",86.7],["zig x copenhagen",null,86.7],["KorvaxNC","fr",86.1],["Parca","it",86.1],["RowanFNM 67","be",85.6],["hylnd amp","us",85.6],["שًٍَِّ今際の際שًٍَِّ","us",85.2],["GR zenith in blm",null,84.6],["MMC KAAN BABA","jp",84.6],["VEDIITS","us",84.6],["okt x fnm 2026","ru",84.6],["FnX IAmNoob.",null,84.1],["andreshterr444","it",83.8],["Brokenipad",null,83.1],["Dark Lion yhyh","us",83.1],["Twtr VestalixFN","nl",83.1],["the big frz","au",83.1],["yotta guɿäʙöɴ-ɷ-","jp",83.1],["JаyOsama","us",82.3],["あくりあ","jp",82.3],["NTO alexii",null,82],["Zehnitsu","us",81.8],["Hawkeyedx","us",81.3],["zаyr0","gb",81.3],["아무도 나를 건드릴 수 없어",null,81.3],["Mr.Devil Vladeal","ru",80.8],["we_hit_arsenic","us",80.8],["Plahs!","us",80.2],["imneegy-_-",null,80.2],["апаңа айтпа",null,80.2],["jqicyxz",null,79.7],["Żayko",null,79.7],["De_Tibbe","nl",79.3],["ѕуnth","pr",79.3],["ARXIDZ","au",78.5],["Alex",null,78.5],["f7712494944a4484b513036b29d74dec",null,78.5],["gﱞhﱞоﱞst","ca",78.5],["가장 빠른 모바일",null,78.5],["Ololo 88",null,77.6],["Ololo Aliǃ","gb",77.6],["alexitoz ayǃ","us",77.6],["tt dobfnm 67",null,77.6],["와일드 포니",null,77.1],["DIG Sуnth","us",76.6],["Gepardǃ","de",76.6],["YOTTAれぼりゅーしゅん","jp",76.6],["kiched",null,76.6],["2KGHantel","de",75.7],["Dark","us",75.7],["ZNN Arnau ム","es",75.7],["chilleadd",null,75.7],["swiiftz","sa",75.7],["AlbaXna","it",74.9],["Zentox 7","cz",74.9],["ㅤLukeyㅤㅤ",null,74.9],["TikTok.JonFNM","us",74.4],["Zumifnm",null,74.4],["かんくん警察出動",null,74.1],["CHŁOP.",null,73.6],["Foxjayyy",null,73.6],["Reeton120fps-",null,73.6],["azeﱞn","kr",73.6],["ювзыиссосчоппед",null,73.6],["AQURIA","jp",72.2],["BROZO","pl",72.2],["MAKARON","jp",72.2],["MTB Ultra","ae",72.2],["Samux 7","it",72.2],["cr67 Redeagle",null,72.2],["flipmyburgerr",null,72.2],["juxcyyǃ",null,72.2],["mtrx polloǃ","pa",72.2],["no country.",null,72.2],["BIG ADAHO SLAM",null,70.9],["Gardo 8.","it",70.9],["Slursxz",null,70.9],["VAMOS アレド 67","it",70.9],["antzguru 777",null,70.9],["mydro ","nl",70.9],["RektByDeny",null,70],["SHANCUZ","au",70],["Tik tok polloǃ","pa",70],["drizzon7","aq",70],["duyfv","gb",70],["azen montana",null,69.5],["Gyao mobile",null,69],["Magizz.",null,69],["Ololo Losty",null,69],["ardamazingǃ",null,69],["pottyfv returnsǃ","ae",69],["shimiez.",null,69],["Dodo Redry",null,68.1],["LeGingAuraSweats",null,68.1],["Lotti Lotti구 구 구",null,68.1],["cillic","us",68.1],["kiwix fv ǃ",null,68.1],["ˢʷᵉᵈᶦˢʰaura 67.",null,68.1],["AMP","us",67.1],["BURNING UP FOR U","jp",67.1],["DOMNU1NGINER","ro",67.1],["MTB Hashim",null,67.1],["SV brxzo 10ǃ","pl",67.1],["euro 2024 turkey","tr",67.1],["kunziteǃ",null,67.1],["レタス.","cn",67.1],["ARED","it",65.9],["Evil Fortnіte",null,65.9],["FV Angel0",null,65.9],["JOGO Hardman",null,65.9],["MOHANAD","ps",65.9],["Ololo ZiZooou BT","fr",65.9],["PH rrit",null,65.9],["VPR Sabbia","co",65.9],["bonecracker101",null,65.9],["nyc fv ǃ",null,65.9],["Buff Hyperbait","us",65.1],["El Psy Kongroó",null,65.1],["Winterzz.ツ",null,65.1],["arkcuit","us",65.1],["ﾠﾠﾠ ﾠﾠﾠﾠﾠﾠﾠﾠ ﾠﾠ","kr",65.1],["CR67 LA EKAM FV",null,64.5],["Epikbotǃǃ",null,64.5],["Plaplec",null,64.5],["Schmalibuca","de",64.5],["Tiktok Sudxylol","us",64.5],["ValzFPS",null,64.5],["Crouton Baptouzz",null,63.9],["KROBER","es",63.9],["MTB Pollo",null,63.9],["Yuan khan","pk",63.9],["sizzle kirk",null,63.9],["Elia 67.","de",63.5],["MadolFN_9","us",63.5],["User-9d82b63844","ru",63.5],["arxidz","au",63.5],["古い 若い 忘れられた 思い出さ","mx",63.5],["67AllecriXMiku69",null,62.4],["Anayanoe",null,62.4],["DESTROYER HALO",null,62.4],["DackelDavidネ","de",62.4],["Gianbattista9-","it",62.4],["JOS Hoshimiyaǃ",null,62.4],["KINGKONGROOKI",null,62.4],["KebabZB","cz",62.4],["LUCKA","sk",62.4],["MFN Shadowxddddd",null,62.4],["Nonno gamer2019",null,62.4],["Omerzǃ","nl",62.4],["Robby",null,62.4],["Twitter-Slayahw",null,62.4],["URZB まいとです",null,62.4],["UseCode PANDAMIE",null,62.4],["VYNX M5",null,62.4],["Zeepzed",null,62.4],["hass14k",null,62.4],["hazelita_FNM",null,62.4],["kebcio 75","pl",62.4],["keiFNM 馬狼",null,62.4],["og. .","us",62.4],["yapizdeclucky",null,62.4],["不組隊就贏不了的猴子x",null,62.4],["ꌗꋖiꇙꏂꋖꂵꋖꎇ",null,62.4]],"ME":[["FnX IAmNoob.",null,92],["Parca","it",91.7],["ㅤLukeyㅤㅤ",null,91.5],["Reo",null,91.2],["Gepardǃ","de",91],["FLC Malinacr7","pl",90.7],["RowanFNM 67","be",90.5],["TT TAKEOVER 67","il",90.1],["モバイル勢のまかろん","zw",90.1],["hardman","ru",89.7],["Mohanad","ps",89.5],["andreshterr444","it",89.2],["King Kong ROOKI","be",88.8],["VAMOS アレド 67","it",88.8],["KorvaxNC","fr",88.5],["mtrx rises","um",88.2],["RXB Lucka","sk",88],["ꌗꋖiꇙꏂꋖꂵꋖꎇ","ru",87.7],["Gardo 8.","it",87.4],["JаyOsama","us",87.4],["jqicyxz",null,87],["ZNN Arnau ム","es",86.8],["De_Tibbe","nl",86.5],["Mr.Devil Vladeal","ru",86.1],["NTO alexii",null,86.1],["Ololo Aliǃ","gb",86.1],["SV brxzo 10ǃ","pl",85.5],["zаyr0","gb",85.5],["Samux 7","it",85.1],["euro 2024 turkey","tr",84.8],["okt x fnm 2026","ru",84.8],["mtrx dogeee",null,84.4],["Fledermuesly",null,84.2],["Żayko",null,83.9],["arxidz","au",83.7],["Selfish Girl.","us",83.4],["duyfv","gb",83.4],["Ololo ZiZooou BT","fr",83],["ghostofalltime","ca",82.8],["LeGingAuraSweats",null,82.5],["REO","jp",82.5],["TT papier","nl",82.1],["MOHANAD","ps",81.7],["Schmalibuca","de",81.7],["VPR Sabbia","co",81.7],["AMP","us",81.3],["NoobPlans IPAD",null,80.9],["あくりあ","jp",80.9],["hylnd amp","us",80.5],["king luke99","au",80.5],["DackelDavidネ","de",80.1],["MTB Hashim",null,80.1],["DIG Arsenic","us",79.4],["DIG Sуnth","us",79.4],["IAMNOOB","gb",79.4],["f7712494944a4484b513036b29d74dec",null,79.4],["MTB Ultra","ae",78.7],["swiiftz","sa",78.7],["we_hit_arsenic","us",78.7],["kiched",null,78.3],["vediits","us",78.1],["2KGHantel","de",77.8],["Hudy1213",null,77.8],["Olivarius9","pl",77.1],["alexitoz ayǃ","us",77.1],["mydro ","nl",77.1],["the big frz","au",77.1],["שًٍَِّ今際の際שًٍَِّ",null,77.1],["Ololo Losty",null,76.5],["Smicho15","mx",75.8],["The Gugaa","pt",75.8],["TikTok.JonFNM","us",75.8],["Zentox 7","cz",75.8],["zig x copenhagen",null,75.8],["ﾠﾠﾠ ﾠﾠﾠﾠﾠﾠﾠﾠ ﾠﾠ","kr",75.8],["VPR snakko 67","ae",75],["ˢʷᵉᵈᶦˢʰaura 67.",null,75],["ALBAXNA","it",74.4],["GR zenith in blm",null,74.4],["What is this Gay",null,74.4],["cuiikzy",null,74.4],["ios Yagi Kureizu","no",74.4],["Evil Fortnіte",null,73.7],["Juvzy","ht",73.7],["autolock 9",null,73.7],["ZAYR0","gb",73.2],["payaamfn",null,73.2],["JOS Hoshimiyaǃ",null,72.6],["Magizz.",null,72.6],["TikTok AlekFNM.",null,72.6],["Twitch rxbin_321","de",72.6],["shimiez.",null,72.6],["BROZO","pl",71.6],["PH rrit",null,71.6],["Twitch Valkille_",null,71.6],["bonecracker101",null,71.6],["Артем Налбандян","es",71.6],["エッグロールです",null,71.6],["JOGO Hardman",null,70.3],["Nonno gamer2019",null,70.3],["SAMUX","it",70.3],["Slaуzz 诶","pr",70.3],["Zehnitsu","us",70.3],["bonjoür",null,70.3],["rainbowpuppy67",null,70.3],["sambo.exe","es",70.3],["tiktok bach87.","us",70.3],["vex 2xǃ",null,70.3],["Crouton Baptouzz",null,69],["KebabZB","cz",69],["LUCKA","sk",69],["TT-MØBILE Δrt",null,69],["hass14k",null,69],["sleepysoul YT","de",69],["tt dobfnm 67",null,69],["CHŁOP.",null,67.9],["DIG tye tye",null,67.9],["Geëkyǃ",null,67.9],["User-9d82b63844","ru",67.9],["azeﱞn","kr",67.9],["efluxe",null,67.9],["ig tennishamios",null,67.9],["ѕуnth","pr",67.9],["가장 빠른 모바일",null,67.9],["AQURIA","jp",66.7],["AlbaXna","it",66.7],["FA Keyxity 203","co",66.7],["MFX xilo","it",66.7],["Peterbøt Syndrom",null,66.7],["RektByDeny",null,66.7],["SCHMALI","de",66.7],["aura_slayzen",null,66.7],["MAKARON","jp",65.9],["MFN Shadowxddddd",null,65.9],["Shadowxddddddd",null,65.9],["Tiktok Rashimfn",null,65.9],["апаңа айтпа",null,65.9],["99 legaltitan",null,65.2],["Epikbotǃǃ",null,65.2],["Yuan khan","pk",65.2],["pottyfv returnsǃ",null,65.2],["rycho3009","pl",65.2],["tt alexwhoppa","gb",65.2],["不组队就赢不了的然子们",null,65.2],["没有任何东西能够阻挡我D-_-","it",65.2],["Bilaal M5 13inch",null,64.3],["FNX melon.","il",64.3],["Maximazing","se",64.3],["Ololo 88",null,64.3],["Omerzǃ","nl",64.3],["Twtr VestalixFN","nl",64.3],["tung tung sahere","ma",64.3],["yotta guɿäʙöɴ-ɷ-","jp",64.3],["Autolock Aziz",null,63.4],["Goodboy Kælniq","no",63.4],["OPI EliBoi","aq",63.4],["PH Chxse","us",63.4],["Ripiano_farinoso",null,63.4],["Shipski ","pl",63.4],["SneakyBello",null,63.4],["TGA Krbër 7ǃ","es",63.4],["antzguru 777",null,63.4],["azen montana",null,63.4],["dyktator crrǃ",null,63.4],["most hated koda",null,63.4],["sabbia 8","it",63.4],["BIG ADAHO SLAM",null,62.3],["Eagle Plozax","kp",62.3],["Foxjayyy",null,62.3],["Gianbattista9-",null,62.3],["KROBER","es",62.3],["Mossya.",null,62.3],["Plaplec",null,62.3],["Pxlm3","es",62.3],["Slursxz",null,62.3],["TonnoLoveYou",null,62.3],["Unrealiana",null,62.3],["VYNX M5",null,62.3],["flipmyburgerr",null,62.3],["heqzy akj","es",62.3],["kunziteǃ",null,62.3],["no country.",null,62.3],["rane_fnm",null,62.3],["tiktok wtvdread",null,62.3],["ttv Maybachina","us",62.3],["天神庇佑常勝不敗","es",62.3],["眠っているヤギ","br",62.3]],"EU":[["FnX IAmNoob.",null,92],["Gepardǃ","de",91.8],["FLC Malinacr7","pl",91.6],["Reo",null,91.5],["TT papier","nl",91.3],["ㅤLukeyㅤㅤ",null,91.1],["mtrx rises","um",90.9],["King Kong ROOKI","be",90.7],["mtrx dogeee",null,90.6],["TT TAKEOVER 67","il",90.4],["Ololo Aliǃ","gb",90.2],["euro 2024 turkey","tr",90],["Selfish Girl.","us",89.9],["RowanFNM 67","be",89.7],["Parca","it",89.5],["De_Tibbe","nl",89.3],["andreshterr444","it",89.2],["Mohanad","ps",88.9],["vediits","us",88.9],["hylnd amp","us",88.6],["hardman","ru",88.5],["DIG Arsenic","us",88.3],["Shadowxddddddd",null,88.1],["Gardo 8.","it",87.9],["KorvaxNC","fr",87.9],["okt x fnm 2026","ru",87.6],["Foxjayyy",null,87.4],["VAMOS アレド 67","it",87.3],["MTB Hashim",null,87.1],["JаyOsama","us",86.9],["ghostofalltime","ca",86.8],["아무도 나를 건드릴 수 없어",null,86.6],["Juvzy","ht",86.3],["Shipski ","pl",86.3],["jqicyxz",null,86.1],["Ololo Losty",null,85.8],["zig x copenhagen",null,85.8],["alexitoz ayǃ","us",85.5],["gﱞhﱞоﱞst","ca",85.5],["autolock 9",null,85.3],["IAMNOOB","gb",85],["yotta guɿäʙöɴ-ɷ-","jp",85],["Żayko",null,84.8],["Magizz.",null,84.4],["User-9d82b63844","ru",84.4],["duyfv","gb",84.4],["Ololo ZiZooou BT","fr",84.1],["Samux 7","it",83.9],["we_hit_arsenic","us",83.9],["Omerzǃ","nl",83.6],["Gianbattista9-","it",83.5],["Kооmse","us",83.2],["ˢʷᵉᵈᶦˢʰaura 67.",null,83.2],["Bobjrfv",null,82.8],["FA Keyxity 203","co",82.8],["Olivarius9","pl",82.8],["Goodboy Kælniq","no",82.4],["Plaplec",null,82.4],["ﾠﾠﾠ ﾠﾠﾠﾠﾠﾠﾠﾠ ﾠﾠ","kr",82.4],["Brokenipad",null,81.7],["DackelDavidネ","de",81.7],["Fledermuesly",null,81.7],["RXB Lucka","sk",81.7],["Zehnitsu","us",81.7],["Twtr VestalixFN","nl",81.1],["VPR snakko 67","it",81.1],["ZNN Arnau ム","es",81.1],["REO","jp",80.7],["hass14k",null,80.7],["2KGHantel","de",80.4],["MFN Shadowxddddd",null,80.4],["kiwix fv ǃ",null,80.4],["Dark","us",80],["king luke99","au",80],["DIG Sуnth","us",79.4],["FNX melon.",null,79.4],["rycho3009","pl",79.4],["shimiez.",null,79.4],["zаyr0","gb",79.4],["Ҝ丨尺 Y L_乃T山ᴼⁿ M5","ch",79.4],["MikaLva","nl",78.6],["PH Chxse","us",78.6],["RektByDeny",null,78.6],["SV brxzo 10ǃ","pl",78.6],["VPR Sabbia","co",78.6],["OPI EliBoi","aq",77.9],["chilleadd","ch",77.9],["Артем Налбандян","es",77.9],["שًٍَِّ今際の際שًٍَِّ","us",77.9],["モバイル勢のまかろん","zw",77.9],["LeGingAuraSweats",null,77.2],["S1NED","ua",77.2],["zenixFNM",null,77.2],["あくりあ","jp",77.2],["flipmyburgerr",null,76.7],["heqzy akj","es",76.7],["swiiftz","sa",76.7],["ѕуnth","pr",76.7],["CHŁOP.",null,75.9],["KebabZB","cz",75.9],["Unrealiana",null,75.9],["What is this Gay",null,75.9],["ZAYR0","gb",75.9],["ZRT Maioza","fr",75.9],["dumb and dumber.",null,75.9],["7VEN Parcafn ﾒ",null,75],["BIG ADAHO SLAM",null,75],["EdzX-",null,75],["VEDIITS","us",75],["final boss quart","il",75],["tt dobfnm 67",null,75],["yapizdeclucky",null,75],["Lotti Lotti구 구 구",null,74.3],["Mr.Devil Vladeal","ru",74.3],["TikTok AlekFNM.",null,74.3],["Twitch Valkille_",null,74.3],["azeﱞn","kr",73.8],["tiktok bach87.","us",73.8],["ꌗꋖiꇙꏂꋖꂵꋖꎇ","it",73.8],["50 usd 质量",null,73.2],["ARED","it",73.2],["BROZO","pl",73.2],["Ripiano_farinoso",null,73.2],["goata kuzo",null,73.2],["inshallahꫝ ꫝ",null,73.2],["twіtch myth1c","hr",73.2],["Nonno gamer2019",null,72.5],["Plahs!","us",72.5],["TikTok.JonFNM","us",72.5],["tt alexwhoppa","gb",72.5],["ibericoaim","es",72],["ig tennishamios",null,72],["kiched",null,72],["the big frz","au",72],["ﾠﾠﾠﾠ67ﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠ",null,72],["Dark Lion yhyh","us",70.8],["DetailedOwl1973",null,70.8],["NTO alexii",null,70.8],["Redry for Flacon",null,70.8],["SICKOLUCKY111",null,70.8],["Smicho15","mx",70.8],["TT FleeOnMobile","gb",70.8],["Tiktok Rashimfn",null,70.8],["Zumifnm",null,70.8],["controII.","se",70.8],["dyktator crrǃ",null,70.8],["trix_TeaTea",null,70.8],["不组队就赢不了的然子们",null,70.8],["天神庇佑常勝不敗","es",70.8],["TikTok Clictro.",null,69.6],["UseCode PANDAMIE","be",69.6],["Zentox 7","cz",69.6],["aleshawnn25.",null,69.6],["alle ㅤツ","it",69.6],["i misshertouch",null,69.6],["monto L1ttZ","ua",69.6],["没有任何东西能够阻挡我D-_-","it",69.6],["BigTönkaDlHǃ",null,68.6],["Crouton Baptouzz",null,68.6],["Elia 67.",null,68.6],["Flame on Ipad","de",68.6],["Ololo 88",null,68.6],["PLAHS","us",68.6],["The Gugaa",null,68.6],["ese Link","es",68.6],["most hated koda",null,68.6],["rainbowpuppy67",null,68.6],["가장 빠른 모바일",null,68.6],["1234HUD.",null,66.8],["AMP","us",66.8],["FnX ꓲAmNoob.",null,66.8],["GR zenith in blm",null,66.8],["MTB Ultra",null,66.8],["Madolrr",null,66.8],["Mossya.",null,66.8],["RAFAFNM","nl",66.8],["SAMUX","it",66.8],["TGA Krbër 7ǃ","es",66.8],["TikTok samuelmlh",null,66.8],["YOTTAれぼりゅーしゅん",null,66.8],["Yuan khan","pk",66.8],["Zaka刁",null,66.8],["azen montana",null,66.8],["c186a36411a94db4b4e61b9f7ce7c486",null,66.8],["cr67 Redeagle",null,66.8],["crwkfnrr",null,66.8],["elfuenkchen 007",null,66.8],["exyyǃ",null,66.8],["foulѕ","us",66.8],["k9 g4l4ctikoo",null,66.8],["kalsfn6",null,66.8],["monto apels1n.",null,66.8],["no country.",null,66.8],["저는발을좋아해요",null,66.8],["34nosoybuenoǃ","es",63.2],["43rxbin",null,63.2],["4zn .",null,63.2],["67 Drab 1x.",null,63.2],["67AllecriXMiku69",null,63.2],["ABZ FXBIOMAR 24ǃ",null,63.2],["ALBAXNA","it",63.2],["Alpix 360",null,63.2],["AyTrys IᔕᗷᒪEᗩᑕᕼ",null,63.2],["BMB KNDD","us",63.2],["BURNING UP FOR U","jp",63.2],["BrozoneG_G","es",63.2],["CR67 LA EKAM FV",null,63.2],["Chill_狗",null,63.2],["DOMNU1NGINER",null,63.2],["Dawid Jasperǃ",null,63.2],["Evil Fortnіte",null,63.2],["Gh0ztyу",null,63.2],["JOGO Hardman",null,63.2],["KOMIKS13",null,63.2],["KROBER","es",63.2],["Kanchfn6",null,63.2],["LUCKA","sk",63.2],["MAKARON","jp",63.2],["MFN need ascend","ru",63.2],["MYDRO","nl",63.2],["Mikey. 2","us",63.2],["MoetyIceman",null,63.2],["NOSCOPE68",null,63.2],["NoobPlans IPAD",null,63.2],["Ololo CousFishyy",null,63.2],["Ricky","it",63.2],["SS-RUFUS",null,63.2],["Schmalibuca","de",63.2],["SneakyBello",null,63.2],["Tekvshi Opti",null,63.2],["Thom08vh",null,63.2],["Tik tok polloǃ","pa",63.2],["TikTok JV STØƝƘS",null,63.2],["TonnoLoveYou",null,63.2],["Treeplanter42",null,63.2],["Twitter-Slayahw",null,63.2],["VYNX M5",null,63.2],["Wxaox",null,63.2],["amebaǃ",null,63.2],["antzguru 777",null,63.2],["bonecracker101",null,63.2],["cuiikzy",null,63.2],["drqkshterr-",null,63.2],["ios Yagi Kureizu","no",63.2],["lad1rǃ",null,63.2],["monto Smart",null,63.2],["mtrx polloǃ","pa",63.2],["sabbia 8","it",63.2],["sambo.exe",null,63.2],["sayonara 9","gb",63.2],["sleepysoul YT",null,63.2],["tiktok wtvdread",null,63.2],["vovundel 523 7",null,63.2],["xvatzinho",null,63.2],["zen mob1le",null,63.2],["Élity Skywalker",null,63.2],["СмертьXOXLAM",null,63.2],["ᴄʟᴀʀᴋ ᴋᴇɴᴛǃ",null,63.2],["ᴛᴛ DavxddFNM",null,63.2],["ⱽᶻ 67ǃ",null,63.2],["かんくん警察出動",null,63.2],["ザーセップ",null,63.2],["レタス.","cn",63.2],["不組隊就贏不了的猴子x",null,63.2],["私は失敗者です",null,63.2],["와일드 포니",null,63.2]],"BR":[["mtrx rises","um",92],["FnX IAmNoob.",null,91.7],["mtrx dogeee",null,91.5],["vediits","us",91.2],["ghostofalltime","ca",91],["TikTok AlekFNM.",null,90.7],["FA Keyxity 203","co",90.4],["hylnd amp","us",90.2],["JаyOsama","us",89.9],["Selfish Girl.","us",89.7],["Reo",null,89.3],["TT TAKEOVER 67","il",89.3],["we_hit_arsenic","us",88.9],["KorvaxNC","fr",88.7],["De_Tibbe","nl",88.4],["FLC Malinacr7","pl",88.2],["Parca","it",87.9],["DIG Arsenic","us",87.4],["Gepardǃ","de",87.4],["아무도 나를 건드릴 수 없어",null,87.4],["Plahs!","us",86.9],["Shipski ","pl",86.6],["ㅤLukeyㅤㅤ",null,86.6],["King Kong ROOKI","be",86.2],["AlbaXna","it",85.7],["NTO alexii",null,85.7],["VEDIITS","us",85.7],["Foxjayyy",null,85.2],["Mohanad","ps",84.8],["RowanFNM 67","be",84.8],["autolock 9",null,84.8],["NoobPlans IPAD",null,84.3],["2KGHantel","de",83.8],["Gardo 8.","it",83.8],["hardman","ru",83.8],["Kооmse","us",83.4],["AMP","us",83.1],["zig x copenhagen",null,82.9],["Zumifnm",null,82.6],["okt x fnm 2026","ru",82.6],["00 jayosama","us",82],["OPI EliBoi","aq",82],["VPR Sabbia","co",82],["Fledermuesly",null,81.4],["Ololo Losty",null,81.4],["GhostRift92",null,81],["MTB Hashim",null,81],["ShadowVex471",null,80.5],["alexitoz ayǃ","us",80.5],["jqicyxz",null,80],["Żayko",null,80],["ﾠﾠﾠ ﾠﾠﾠﾠﾠﾠﾠﾠ ﾠﾠ","kr",80],["PH rrit",null,79.5],["VAMOS アレド 67","it",79.5],["Dark Lion yhyh","us",79.1],["Ololo ZiZooou BT","fr",78.6],["SAMUX","it",78.6],["TikTok.JonFNM","us",78.6],["kiched",null,78.6],["Brokenipad",null,78],["LeGingAuraSweats",null,78],["ZAYR0","gb",77.7],["Twtr VestalixFN","nl",77.5],["Smicho15","mx",77.3],["Samux 7","it",77],["ѕуnth","pr",77],["Tiktok Sudxylol","us",76.6],["ꌗꋖiꇙꏂꋖꂵꋖꎇ","it",76.6],["와일드 포니",null,76.3],["REO","jp",75.8],["gﱞhﱞоﱞst","ca",75.8],["モバイル勢のまかろん","zw",75.8],["眠っているヤギ","br",75.8],["Dark","us",75.1],["andreshterr444","it",75.1],["あくりあ","jp",75.1],["Juvzy","ht",74.1],["Shadowxddddddd",null,74.1],["ZNN Arnau ム","es",74.1],["Zehnitsu","us",74.1],["dyktator crrǃ",null,74.1],["euro 2024 turkey","tr",74.1],["zаyr0","gb",74.1],["没有任何东西能够阻挡我D-_-","it",74.1],["Alex",null,72.5],["BURNING UP FOR U","jp",72.5],["MTB Pollo",null,72.5],["Madolrr","us",72.5],["TikTok JV STØƝƘS",null,72.5],["Void Studartz",null,72.5],["Wxaox","se",72.5],["final boss quart","il",72.5],["mydro ","nl",72.5],["ALBAXNA","it",71.2],["DIG Sуnth","us",71.2],["Hadous.",null,71.2],["IAMNOOB","gb",71.2],["pepardoelpetardo","es",71.2],["zen mob1le","br",71.2],["COLD Redryy",null,69.9],["Mr.Devil Vladeal","ru",69.9],["TT papier","nl",69.9],["Unrealiana",null,69.9],["duyfv","gb",69.9],["frymyburgerr",null,69.9],["king luke99","au",69.9],["vvs yuck9",null,69.9],["不組隊就贏不了的猴子x",null,69.9],["天神庇佑常勝不敗","es",69.9],["Bobjrfv",null,68.2],["FNX melon.","il",68.2],["Gianbattista9-","it",68.2],["MFN Shadowxddddd",null,68.2],["Ololo Aliǃ","gb",68.2],["RXB Lucka","sk",68.2],["TGA Krbër 7ǃ","es",68.2],["TT-MØBILE Δrt",null,68.2],["Twitter-Slayahw",null,68.2],["YOTTAれぼりゅーしゅん",null,68.2],["heqzy akj","es",68.2],["mtrx polloǃ","pa",68.2],["Danillo_oli YT",null,66.8],["Hawkeyedx","us",66.8],["MMC KAAN BABA","jp",66.8],["Omerzǃ","nl",66.8],["User-9d82b63844","ru",66.8],["hass14k",null,66.8],["most hated koda",null,66.8],["СмертьXOXLAM","ru",66.8],["Buff Hyperbait","us",65.6],["DOMNU1NGINER","ro",65.6],["Goodboy Kælniq","no",65.6],["LUCKA","sk",65.6],["MattDaUnc","us",65.6],["PLAHS","us",65.6],["Plaplec",null,65.6],["Prime Tykirwan",null,65.6],["ZRT Maioza","fr",65.6],["antzguru 777",null,65.6],["oskrfnz-","va",65.6],["99 legaltitan",null,64.6],["BRADEN","us",64.6],["DESTROYER HALO",null,64.6],["Giselle Montesﱞ",null,64.6],["MOHANAD","ps",64.6],["chilleadd","ch",64.6],["mtrx LuisFNM",null,64.6],["vovundel 523 7","ua",64.6],["CHŁOP.",null,64],["Elia 67.",null,64],["ˢʷᵉᵈᶦˢʰaura 67.",null,64],["Артем Налбандян","es",64],["DackelDavidネ","de",63.4],["GT Synth",null,63.4],["JXNSY 7",null,63.4],["Magizz.",null,63.4],["crwkfnrr",null,63.4],["drqk6xǃ","it",63.4],["edw1n130",null,63.4],["hazelita_FNM",null,63.4],["sayonara 9","gb",63.4],["CR67 LA EKAM FV",null,62.8],["FV Angel0",null,62.8],["Mikey. 2","us",62.8],["The Gugaa","pt",62.8],["Zentox 7","cz",62.8],["antisocial depe","it",62.8],["no brain no aim4",null,62.8],["rycho3009","pl",62.8],["A1ALEX","us",62.2],["BGG-JHONATAN",null,62.2],["BIG ADAHO SLAM",null,62.2],["DADDY CHILL KAMI","us",62.2],["Evil Fortnіte",null,62.2],["GR zenith in blm",null,62.2],["JOGO Hardman",null,62.2],["MadolFN_9","us",62.2],["MoetyIceman",null,62.2],["SCHMALI","de",62.2],["TikTok samuelmlh",null,62.2],["amebaǃ","sy",62.2],["fnm catboyǃ","ru",62.2],["вась двести вась",null,62.2],["ᵇᵐᶠSkib",null,62.2]],"NAC":[["mtrx dogeee",null,92],["mtrx rises","um",91.8],["00 jayosama","us",91.6],["FnX IAmNoob.",null,91.4],["hylnd amp","us",91.2],["Selfish Girl.","us",91],["JаyOsama","us",90.9],["jqicyxz",null,90.7],["Parca","it",90.5],["ghostofalltime","ca",90.3],["vediits","us",90.1],["FA Keyxity 203","co",89.9],["RowanFNM 67","be",89.7],["King Kong ROOKI","be",89.4],["Reo",null,89.4],["hardman","ru",89.2],["아무도 나를 건드릴 수 없어",null,89],["TT TAKEOVER 67","il",88.8],["DIG Arsenic","us",88.6],["Shipski ","pl",88.4],["Mohanad","ps",88.2],["Smicho15","mx",88.1],["De_Tibbe","nl",87.9],["Gepardǃ","de",87.7],["autolock 9",null,87.5],["ѕуnth","pr",87.3],["Dark","us",87],["Ololo Losty",null,87],["VAMOS アレド 67","it",87],["Plahs!","us",86.6],["gﱞhﱞоﱞst","ca",86.3],["mydro ","nl",86.3],["DIG Sуnth","us",85.8],["FLC Malinacr7","pl",85.8],["andreshterr444","it",85.8],["ㅤLukeyㅤㅤ",null,85.8],["KorvaxNC","fr",85.4],["TikTok.JonFNM","us",85.2],["we_hit_arsenic","us",85],["PH Chxse","us",84.8],["Tiktok Sudxylol","us",84.7],["NoobPlans IPAD",null,84.3],["alexitoz ayǃ","us",84.3],["zаyr0","gb",84.3],["duyfv","gb",84],["OPI EliBoi","aq",83.8],["Ololo Aliǃ","gb",83.6],["Juvzy","ht",83.5],["Zehnitsu","us",83.3],["Bobjrfv",null,83],["Kооmse","us",83],["Samux 7","it",83],["TT papier","nl",82.6],["Hawkeyedx","us",82.3],["Mr.Devil Vladeal","ru",82.3],["PH rrit",null,82.3],["Gardo 8.","it",81.8],["NTO alexii",null,81.8],["tt kenamii.fnm",null,81.8],["Foxjayyy",null,81.1],["Ololo ZiZooou BT","fr",81.1],["Unrealiana",null,81.1],["drizzon7","aq",81.1],["tt dobfnm 67",null,81.1],["AMP","us",80.6],["the big frz","au",80.6],["Brokenipad",null,79.9],["Dark Lion yhyh","us",79.9],["Madolrr",null,79.9],["REO","jp",79.9],["Twtr VestalixFN","nl",79.9],["ZRT Maioza","fr",79.9],["hass14k",null,79.9],["Zentox 7","cz",79.2],["Fledermuesly",null,78.9],["TikTok AlekFNM.",null,78.9],["azeﱞn","kr",78.9],["BROZO","pl",78.2],["MMC KAAN BABA","jp",78.2],["TGA Krbër 7ǃ","es",78.2],["Żayko",null,78.2],["あくりあ","jp",78.2],["ꌗꋖiꇙꏂꋖꂵꋖꎇ","it",78.2],["Babylion122","us",77.4],["MTB Hashim",null,77.4],["kiwix fv ǃ",null,77.4],["most hated koda",null,77.4],["percep 55.","us",77.4],["MFN Shadowxddddd",null,76.7],["azen montana",null,76.7],["okt x fnm 2026","ru",76.7],["zig x copenhagen",null,76.7],["Omerzǃ","nl",76],["ShadowVex471",null,76],["VPR snakko 67","ae",76],["rainbowpuppy67",null,76],["twis lyon",null,76],["ювзыиссосчоппед",null,76],["AlbaXna","it",74.9],["EarlyJBird",null,74.9],["SV brxzo 10ǃ","pl",74.9],["Schmalibuca","de",74.9],["Tik tok polloǃ","pa",74.9],["final boss quart","il",74.9],["pottyfv returnsǃ",null,74.9],["zen mob1le",null,74.9],["エッグロールです",null,74.9],["BMB KNDD","us",73.5],["El niño diosǃ","mx",73.5],["KINGKONGROOKI",null,73.5],["LeGingAuraSweats",null,73.5],["MoetyIceman",null,73.5],["PLAHS","us",73.5],["Peterbøt Syndrom",null,73.5],["Winterzz.ツ",null,73.5],["ab3_30",null,73.5],["heqzy akj","es",73.5],["vex 2xǃ",null,73.5],["CHŁOP.",null,72.3],["Evil Fortnіte",null,72.3],["Larp 67ﾠ",null,72.3],["RektByDeny",null,72.3],["Slaуzz 诶","pr",72.3],["YOTTAれぼりゅーしゅん","jp",72.3],["古い 若い 忘れられた 思い出さ","mx",72.3],["2KGHantel","de",71.4],["AQURIA","jp",71.4],["Buff Hyperbait","us",71.4],["IAMNOOB","gb",71.4],["Kanchfn6",null,71.4],["NASDAQ Nico",null,71.4],["User-9d82b63844","ru",71.4],["ﾠﾠﾠ ﾠﾠﾠﾠﾠﾠﾠﾠ ﾠﾠ","kr",71.4],["Flame on Ipad","de",70.4],["Gh0ztyу",null,70.4],["Venoxache32","cz",70.4],["mtrx polloǃ","pa",70.4],["sayonara 9","gb",70.4],["yotta guɿäʙöɴ-ɷ-","jp",70.4],["тянка 200",null,70.4],["眠っているヤギ","br",70.4],["COLD Redryy",null,69.3],["DackelDavidネ","de",69.3],["Gianbattista9-",null,69.3],["Goodboy Kælniq","no",69.3],["Plaplec",null,69.3],["RXB Lucka","sk",69.3],["Wxaox",null,69.3],["k9 g4l4ctikoo",null,69.3],["og. .","us",69.3],["שًٍَِّ今際の際שًٍَِّ","us",69.3],["モバイル勢のまかろん","zw",69.3],["ARED","it",68.4],["Ripiano_farinoso",null,68.4],["Treeplanter42",null,68.4],["euro 2024 turkey","tr",68.4],["no country.",null,68.4],["tt jo.FNM",null,68.4],["Cal Tropical","ca",67.5],["Magizz.",null,67.5],["VPR Sabbia","co",67.5],["flipmyburgerr",null,67.5],["king luke99","au",67.5],["nyc fv ǃ",null,67.5],["ˢʷᵉᵈᶦˢʰaura 67.",null,67.5],["ᵇᵐᶠSkib",null,67.5],["天神庇佑常勝不敗",null,67.5],["没有任何东西能够阻挡我D-_-","it",67.5],["ﾠﾠﾠﾠ67ﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠ",null,67.5],["1234HUD.",null,66.4],["ItAnthon",null,66.4],["Nonno gamer2019",null,66.4],["Ololo 88",null,66.4],["ZNN Arnau ム","es",66.4],["Zumifnm",null,66.4],["bonecracker101",null,66.4],["chilleadd","ch",66.4],["pepardoelpetardo","es",66.4],["rауder","ae",66.4],["ˢᵃᵐᵘ ᵗʰᵉ ᵍᵒᵃᵗき",null,66.4],["와일드 포니",null,66.4],["7VEN Parcafn ﾒ",null,65.2],["BIG ADAHO SLAM",null,65.2],["Comeback Tangy",null,65.2],["FNX melon.","il",65.2],["GR zenith in blm",null,65.2],["MFX xilo","it",65.2],["Plozax",null,65.2],["Twitch Valkille_",null,65.2],["foulѕ",null,65.2],["washed seeker",null,65.2],["Élity Skywalker",null,65.2],["апаңа айтпа",null,65.2],["Ҝ丨尺 Y L_乃T山ᴼⁿ M5","ch",65.2],["主机机器人",null,65.2],["A1ALEX","us",62.9],["AG Vincent yt",null,62.9],["Anas 8ǃ",null,62.9],["BigTönkaDlHǃ",null,62.9],["Bilaal M5 13inch",null,62.9],["BrozoneG_G","es",62.9],["DCz0mbi3","us",62.9],["DESTROYER HALO",null,62.9],["Dawid Jasperǃ",null,62.9],["EdzX-",null,62.9],["Elia 67.","de",62.9],["GE ropey",null,62.9],["JOGO Hardman",null,62.9],["KROBER","es",62.9],["KebabZB",null,62.9],["Levis-03fn",null,62.9],["MAKARON","jp",62.9],["MYDRO","nl",62.9],["Mask Juuman",null,62.9],["Mikey. 2","us",62.9],["Mobile Fresco",null,62.9],["NOSCOPE68",null,62.9],["Niño ǃ",null,62.9],["SAMUX","it",62.9],["SS-RUFUS",null,62.9],["Shadowxddddddd",null,62.9],["Sly Faith",null,62.9],["The Gugaa","pt",62.9],["Tiktok Rashimfn",null,62.9],["Ttwkkk",null,62.9],["Twitter-Slayahw",null,62.9],["VEDIITS","us",62.9],["What is this Gay",null,62.9],["X7 NUT",null,62.9],["ali right nuh",null,62.9],["antzguru 777",null,62.9],["ardamazingǃ",null,62.9],["cr67 Redeagle",null,62.9],["cr67 rudeman 67.",null,62.9],["crwkfnrr",null,62.9],["dumb and dumber.",null,62.9],["hazelita_FNM",null,62.9],["ig tennishamios",null,62.9],["inshallahꫝ ꫝ",null,62.9],["kalsfn6",null,62.9],["kostenénok60hz",null,62.9],["mtrx LuisFNM",null,62.9],["rycho3009",null,62.9],["sabbia 8","it",62.9],["sfg а1alex",null,62.9],["slxzzǃ","ru",62.9],["speedydamechs",null,62.9],["storyǃ",null,62.9],["ℰuphorysm",null,62.9],["不組隊就贏不了的猴子x",null,62.9]],"NAW":[["mtrx dogeee",null,92],["vediits","us",91.8],["mtrx rises","um",91.5],["hylnd amp","us",91.3],["Selfish Girl.","us",91],["Reo",null,90.7],["ghostofalltime","ca",90.7],["FnX IAmNoob.",null,90.3],["zig x copenhagen",null,90.1],["JаyOsama","us",89.9],["Shipski ","pl",89.6],["OPI EliBoi","aq",89.4],["아무도 나를 건드릴 수 없어",null,89.2],["hardman","ru",88.9],["Hawkeyedx","us",88.7],["Kооmse","us",88.5],["autolock 9",null,88.2],["we_hit_arsenic","us",88],["FA Keyxity 203","co",87.4],["Plahs!","us",87.4],["Zehnitsu","us",87.4],["kiwix fv ǃ",null,87.4],["ѕуnth","pr",86.9],["ㅤLukeyㅤㅤ",null,86.6],["RowanFNM 67","be",86.4],["FLC Malinacr7","pl",86.1],["duyfv","gb",86.1],["Smicho15","mx",85.8],["モバイル勢のまかろん","zw",85.5],["REO","jp",85.3],["Brokenipad",null,85.1],["Tiktok Sudxylol","us",84.8],["sfg а1alex",null,84.8],["PH rrit",null,84.4],["NTO alexii",null,84.2],["Dark Lion yhyh","us",83.8],["De_Tibbe","nl",83.8],["Juvzy","ht",83.8],["AMP","us",83.3],["Twtr VestalixFN","nl",83.3],["yotta guɿäʙöɴ-ɷ-","jp",83],["DIG Arsenic","us",82.5],["Dark","us",82.5],["MoetyIceman",null,82.5],["Ololo ZiZooou BT","fr",82],["TT papier","nl",82],["TikTok.JonFNM","us",81.7],["Ololo Losty",null,81.2],["S1neD","ua",81.2],["VAMOS アレド 67","it",81.2],["あくりあ","jp",81.2],["andreshterr444","it",80.7],["Ololo Aliǃ","gb",80.5],["DIG Sуnth","us",80.3],["King Kong ROOKI","be",80],["שًٍَِّ今際の際שًٍَِّ","us",80],["00 jayosama","us",79.5],["ARXIDZ","au",79.5],["Bobjrfv",null,79.5],["Evil Fortnіte",null,78.5],["Ololo 88",null,78.5],["PH Chxse","us",78.5],["VEDIITS","us",78.5],["edw1n130",null,78.5],["ˢʷᵉᵈᶦˢʰaura 67.",null,78.5],["апаңа айтпа",null,78.5],["Buff Hyperbait","us",77.6],["Samux 7","it",77.6],["와일드 포니",null,77.6],["A1ALEX","us",76.8],["Parca","it",76.8],["TT TAKEOVER 67","il",76.8],["VPR snakko 67","ae",76.8],["mydro ","nl",76.8],["El Psy Kongroó",null,76.1],["TikTok AlekFNM.",null,76.1],["眠っているヤギ","br",76.1],["Alex",null,75.4],["antzguru 777",null,75.4],["most hated koda",null,75.4],["okt x fnm 2026","ru",75.4],["zаyr0","gb",75.4],["BIG ADAHO SLAM",null,74.2],["Foxjayyy",null,74.2],["MMC KAAN BABA","jp",74.2],["MikaLva","nl",74.2],["Muhleeky",null,74.2],["Treeplanter42",null,74.2],["final boss quart","il",74.2],["エッグロールです",null,74.2],["gﱞhﱞоﱞst","ca",73.5],["Goodboy Kælniq","no",73],["azeﱞn","kr",73],["f7712494944a4484b513036b29d74dec",null,73],["ꌗꋖiꇙꏂꋖꂵꋖꎇ","ru",73],["DACKELDAVID","de",72.4],["TGA Krbër 7ǃ","es",72.4],["Zumifnm",null,72.4],["Żayko",null,72.4],["BURNING UP FOR U","jp",71.4],["FV Angel0",null,71.4],["GR zenith in blm",null,71.4],["LeGingAuraSweats",null,71.4],["SV brxzo 10ǃ","pl",71.4],["User-9d82b63844","ru",71.4],["ValzFPS",null,71.4],["kiched",null,71.4],["GhostRift92",null,70.4],["KorvaxNC","fr",70.4],["heyy huzz",null,70.4],["i_dont_aim_lol",null,70.4],["rainbowpuppy67",null,70.4],["swiiftz","sa",70.4],["01Jax.","us",69.4],["FNX melon.","il",69.4],["ZNN Arnau ム","es",69.4],["bërry so big","us",69.4],["heqzy akj","es",69.4],["Артем Налбандян","es",69.4],["ﾠﾠﾠ ﾠﾠﾠﾠﾠﾠﾠﾠ ﾠﾠ","kr",69.4],["2KGHantel","de",68.3],["BigTönkaDlHǃ",null,68.3],["NoobPlans IPAD",null,68.3],["YOTTAれぼりゅーしゅん","jp",68.3],["alexitoz ayǃ","us",68.3],["drqk6xǃ","it",68.3],["kalsfn6",null,68.3],["レタス.","cn",68.3],["古い 若い 忘れられた 思い出さ","mx",68.3],["Gardo 8.","it",67.1],["JOGO Hardman",null,67.1],["MFX xilo","it",67.1],["Mobile Fresco",null,67.1],["Peterbøt Syndrom",null,67.1],["rane_fnm",null,67.1],["swishy シ",null,67.1],["void vypex","ro",67.1],["没有任何东西能够阻挡我D-_-","it",67.1],["67AllecriXMiku69",null,65.9],["Madolrr","us",65.9],["Mr.Devil Vladeal","ru",65.9],["PLAHS","us",65.9],["SICKOLUCKY111",null,65.9],["aleshawnn25.",null,65.9],["king luke99","au",65.9],["swagboy korofnm","br",65.9],["the big frz","au",65.9],["vex 2xǃ",null,65.9],["ᴛᴛ DavxddFNM",null,65.9],["Tik tok polloǃ",null,65.2],["euro 2024 turkey","tr",65.2],["ig tennishamios",null,65.2],["Gh0ztyу",null,64.5],["LUCKA","sk",64.5],["TikTok JV STØƝƘS",null,64.5],["TonnoLoveYou",null,64.5],["Twitter-Slayahw",null,64.5],["VPR Sabbia","co",64.5],["alphaseto",null,64.5],["jqicyxz",null,64.5],["rycho3009","pl",64.5],["x0vvp",null,64.5],["ᵇᵐᶠSkib",null,64.5],["7VEN Parcafn ﾒ",null,62.6],["ALEXITOZ","us",62.6],["AQURIA","jp",62.6],["BACH","us",62.6],["DackelDavidネ","de",62.6],["Eagle Plozax","kp",62.6],["El niño diosǃ","mx",62.6],["Elia 67.","de",62.6],["Epikbotǃǃ",null,62.6],["Fuzion","pl",62.6],["Gepardǃ","de",62.6],["KDGᵗʷⁱᵗᵗʳSlayahw",null,62.6],["MAKARON","jp",62.6],["MTB Hashim",null,62.6],["Olivarius9",null,62.6],["Ololo ChatPomme",null,62.6],["Poco x6 off",null,62.6],["RTZ_MINIJO",null,62.6],["SHANCUZ","au",62.6],["TikTok FNMAidan",null,62.6],["Unrealiana",null,62.6],["ZAYR0","gb",62.6],["controII.","se",62.6],["cuiikzy",null,62.6],["foulѕ",null,62.6],["hass14k",null,62.6],["hazelita_FNM",null,62.6],["iPad Kid 67ǃ",null,62.6],["mtrx LuisFNM",null,62.6],["npc blxzzy","us",62.6],["percep 55.","us",62.6],["samwbda",null,62.6],["tt kenamii.fnm",null,62.6],["СHOZEN",null,62.6],["коён кыз",null,62.6],["最強こたろうJAPAN",null,62.6],["ﾠﾠﾠﾠ67ﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠ",null,62.6]]};
let CC_VICTORY_LIST=null, CC_VICTORY_LIST_OF=null;
/* PLACEMENT CUP — посев в дивизионы (Tracker, S22_PlacementCup, все семь регионов одинаково):
   раунд 1 открытый, топ-1400 — во второй раунд того же дня; во втором топ-200 — Elite (Д1),
   до 1200 — Challenger (Д2), остальные — Contender (Д3). Денег нет. Комната карьеры меньше
   настоящей, поэтому доли те же: 200/1400 и 1200/1400 от прошедших во второй раунд.
   C4S1 (декабрь 2022) — той же схемой: выгрузки его сетки нет, формат повторён с C3S4. */
/* FNCS TRIAL — одна сессия, итог сразу ставит ступень. 2025 (S33, 7.12.2024, трио; описание события
   Epic на Tracker): топ-200 — Д1, 201–800 — Д2, остальные — Д3. 2026 (S39, 31.01.2026, дуо; tracker.gg
   checkpoint): в Д1 Trial не пускает — топ-1000 — Д2, 1001–3000 — Д3, 3001–13000 — Д4, остальные — Д5.
   Сколько команд было в поле, в данных нет: доли — от оценки поля (2025 ≈ 5 000 трио, 2026 ≈ 16 000 дуо
   в Европе). cuts — [доля комнаты, дивизион], по возрастанию. */
const CC_PLACEMENT_CUPS=[
  {day:'2022-09-24', id:'S22_PlacementCup', mode:'duo', n:1, name:'Placement Cup', placement:true},
  {day:'2022-12-16', id:'S23_PlacementCup', mode:'duo', n:1, name:'Placement Cup', placement:true},
  {day:'2024-12-07', id:'S33_FNCS_Trial', mode:'trio', n:1, name:'FNCS Trial', placement:true, single:true,
   cuts:[[200/5000, 1], [800/5000, 2], [1, 3]]},
  {day:'2026-01-31', id:'S39_FNCSDivisionalCupTrial', mode:'duo', n:1, name:'FNCS Trial', placement:true, single:true,
   cuts:[[1000/16000, 2], [3000/16000, 3], [13000/16000, 4], [1, 5]]}
];
function ccTrialDiv(ev, place, n){
  const p=place/Math.max(1, n), low=(typeof ccDivCount==='function' ? ccDivCount() : 5);
  const c=(ev.cuts||[]).find(x=>p<=x[0]); return Math.min(low, c ? c[1] : low);
}
const CC_PLACE_D1=200/1400, CC_PLACE_D2=1200/1400;
// Ступень по итогу вечера — без записи (карточки вечера пишут её до ccPlacementApply).
function ccPlacementDivOf(through, place2, r2n, ev, place1, n1){
  const cr=CAREER.career, low=(typeof ccDivCount==='function' ? ccDivCount() : 3);
  // Trial только поднимает: кто уже выше (Д1 по прошлому сезону), тот там и остаётся.
  return (ev && ev.single) ? Math.min(cr.division||low, ccTrialDiv(ev, place1, n1))
            : !through ? low : place2<=Math.max(1, Math.round(r2n*CC_PLACE_D1)) ? 1
            : place2<=Math.round(r2n*CC_PLACE_D2) ? Math.min(2, low) : low;
}
function ccPlacementApply(through, place2, r2n, ev, place1, n1){
  const cr=CAREER.career;
  const div=ccPlacementDivOf(through, place2, r2n, ev, place1, n1);
  cr.division=div; cr.placed=cr.season;
  careerNews(div===1 ? 'good' : 'flat', 'lfNewsPlaced', [div]);
  return div;
}
function ccVictoryList(){
  const y=ccCalYear(), yk=ccVictoryListKey();
  if(CC_VICTORY_LIST && CC_VICTORY_LIST_OF===yk) return CC_VICTORY_LIST;
  const base=ccVictoryBase();
  if(typeof CC_CUPS_ARCH==='undefined'){ CC_VICTORY_LIST=base; CC_VICTORY_LIST_OF=yk; return base; }
  const from=ccYearFrom(), to=ccYearTo(), busy=new Set(), hard=new Set();
  ccYearRows().forEach(r=>{ for(let d=r[0]; d<=r[1]; d=ccAddDays(d,1)){ busy.add(d); hard.add(d); } });
  ccCupWeeks().forEach(w=>{ [w[1], w[2], w[3]].forEach(d=>{ if(d) busy.add(d); }); });
  /* ЛАН по приглашению в свой день важнее любого капа той же даты, и своего списка года
     тоже; FNCS, кубки дивизионов и остальной календарь года — важнее ЛАНа. 2026-й держит
     свой список капов сам; из архива ему идут только ЛАНы. */
  const lans=CC_CUPS_ARCH.filter(v=>v.invite && v.day>=from && v.day<=to && !busy.has(v.day));
  const lanDays=new Set(lans.map(v=>v.day));
  const own=base.filter(v=>!lanDays.has(v.day))
    .concat(CC_PLACEMENT_CUPS.filter(v=>v.day>=from && v.day<=to && !lanDays.has(v.day)));
  own.forEach(v=>busy.add(v.day)); lanDays.forEach(d=>busy.add(d));
  /* Капы архива — все в свой день (идея игроков 30.09: «в C3S4 были сквад-ZB-капы, в C3S3 — квик-капы
     трио, жалко что их нет»). Стояло «один кап на день, кто первый»: пятничный квик-кап трио уступал
     трио-капу ZB того же вечера, а субботний сквад-ZB — финалу недели кубков, в который проходят не все.
     Теперь в дни кубков недели кап стоит рядом (не прошёл в финал — играешь кап, careerNext), а капов
     одного дня может быть несколько — какой играть, выбирается (careerVictoryOn, cr.vpick). FNCS,
     Мейджоры, свои события года и ЛАНы по-прежнему держат день целиком. */
  const ownDays=new Set(own.map(v=>v.day)), ownIds=new Set(own.map(v=>v.day+'|'+v.id));
  // Zero Build встаёт и в день своего капа года — выбором рядом (ZBM Squads по субботам начала 2023-го).
  const extra=y>=2026 ? [] : CC_CUPS_ARCH.filter(v=>!v.invite && v.day>=from && v.day<=to
    && !hard.has(v.day) && !lanDays.has(v.day) && (!ownDays.has(v.day) || (v.zb && !ownIds.has(v.day+'|'+v.id))));
  // Скин-капы встают рядом с капами дня (выбор кнопкой); дни FNCS и ЛАНов держат день целиком.
  const skins=ccYearShift()>0 ? [] : CC_SKIN_CUPS.filter(v=>v.day>=from && v.day<=to && !hard.has(v.day) && !lanDays.has(v.day) && !ownIds.has(v.day+'|'+v.id));
  /* Консольные и мобильные капы встают и в дни FNCS — выбором рядом (другая платформа, у Epic они в те же выходные); дни
     ЛАНов — нет. Раньше так было только у Mobile Series, и прогон за Малибуку 15.11 с PS5 Pro три консольных вечера из
     шести не нашёл в списке дня: PlayStation Cup ZB 1.02, Console VCC ZB 7.02, PlayStation Cup Clix 2.05. Без консоли
     такой день по-прежнему не показывается (фильтр pcDay ниже). */
  const cons=(y===2026 && !(ccYearShift()>0)) ? CC_CONSOLE_2026.filter(v=>v.day>=from && v.day<=to && (!hard.has(v.day) || !!v.series || !!ccConsoleNeed(v)) && !lanDays.has(v.day) && !ownIds.has(v.day+'|'+v.id)) : [];
  CC_VICTORY_LIST=own.concat(lans, extra, skins, cons).sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:0);
  /* Без консоли день, где только консольные капы, в календарь не идёт: был бы закрытым вечером. Рядом с обычным капом
     консольный остаётся серой кнопкой с причиной (ccVictoryAltsHTML). Купил консоль — ключ списка другой, дни вернулись. */
  { const pcDay=new Set(CC_VICTORY_LIST.filter(v=>!ccConsoleNeed(v)).map(v=>v.day));
    CC_VICTORY_LIST=CC_VICTORY_LIST.filter(v=>!ccConsoleNeed(v) || ccConsoleOk(v) || pcDay.has(v.day));
    // Платформа выключена в магазине — её капов в календаре нет совсем (и серыми кнопками тоже).
    CC_VICTORY_LIST=CC_VICTORY_LIST.filter(v=>{ const g=ccPlatGroup(ccConsoleNeed(v)); return !g || ccPlatCalOn(g); }); }
  /* Годы продолжения (2027+) играют календарь 2026-го со сдвигом дат, а в имени события стоял
     настоящий год: «Games of the Future 2025 - Abu Dhabi» в декабре 2027-го (17.10, Notion
     «fncsdraft 15.10», скрин 19). Год в имени и подписи ЛАНа сдвигается на тот же шаг. */
  const sh=ccYearShift();
  if(sh>0){
    const bump=t=>typeof t==='string' ? t.replace(/\b(20[12]\d)\b/g, m=>String(+m+sh)) : t;
    CC_VICTORY_LIST=CC_VICTORY_LIST.map(v=>(/\b20[12]\d\b/.test(v.name||'')||/\b20[12]\d\b/.test(v.lan||''))
      ? Object.assign({}, v, {name:bump(v.name), lan:bump(v.lan)}) : v);
    // Кап без своего формата играется составом года (ccVictoryFormat 0): и в имени формат года, а не 2026-го.
    const sz=(CAREER && CAREER.career && CAREER.career.size)||2;
    const W={1:['Solo','Solo'], 2:['Duo','Duos'], 3:['Trio','Trios'], 4:['Squad','Squads']}[sz];
    if(W) CC_VICTORY_LIST=CC_VICTORY_LIST.map(v=>(!v.fmt && !v.own && v.mode!=='solo' && /\b(Duo|Trio|Squad)s?\b/.test(v.name||''))
      ? Object.assign({}, v, {name:v.name.replace(/\b(Duo|Trio|Squad)(s?)\b/g, (m, a, p)=>W[p ? 1 : 0])}) : v);
  }
  const mine=ccOwnCups();
  if(mine.length) CC_VICTORY_LIST=CC_VICTORY_LIST.concat(mine).sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:0);
  CC_VICTORY_LIST_OF=yk;
  return CC_VICTORY_LIST;
}
// Остров Reload по году: 2026-й — четвёртый круг серии, 2025-й — первый (другого измеренного нет).
function ccReloadSetOfYear(){ return (ccIs2025() || ccIs2024()) ? (ZONE_SETS.r1 ? 'r1' : careerBrSet()) : (ZONE_SETS.r4 ? 'r4' : careerBrSet()); }
/* Мобильный Reload 2026: Mobile Series (раунды, хиты, квал) и Reload (Mini Venture) Victory Cup идут по правилам и луту Reload
   на мини-Venture (r6), страница Epic Mobile Series. Mobile BR/ZB остаются на острове сезона, ZBReload и RES на r4. */
function ccIsMobileReload(ev){ return /ReloadminiV|MobileSeries/.test(String((ev && ev.id)||'')); }
// _RES — Mobile Reload (Elite Stronghold): слова Reload в id нет, но это Reload на r4.
function ccIsReloadEv(ev){ return /Reload|_RES$/.test(String((ev && ev.id)||'')) || ccIsMobileReload(ev); }
function ccReloadSetOf(ev){ return (ccIsMobileReload(ev) && ZONE_SETS.r6) ? 'r6' : ccReloadSetOfYear(); }
function ccEvLandingSet(ev){ return ccIsReloadEv(ev) ? ccReloadSetOf(ev) : careerBrSet(); }
function ccVictoryAlts(iso){ return ccVictoryList().filter(v=>v.day===iso); }
/* Онлайн (гонка и команда вдвоём): кап дня один на всех, по умолчанию, без кнопок выбора. vpick синхронизируется
   с задержкой, и если один успел нажать, двое садились в разные капы одного дня (соло и дуо Luxe Cup 2019,
   разошлись на игре 1). */
function ccVictoryLocked(){
  return (typeof ccRaceOn==='function' && ccRaceOn()) || (typeof ccMpTeam==='function' && ccMpTeam());
}
/* СВОЙ ТУРНИР. Игрок сам устраивает кап: дату, режим, допуск, игры и призовой фонд выбирает он, а вечер
   играется той же машиной, что и капы Epic (ev.own в списке Victory). Инвайт — одна комната сильнейших
   региона, как ЛАН; квалы — открытый первый раунд и финал прошедших. Фонд снимается с баланса при
   создании, отмена до дня турнира возвращает его. Устраивать может тот, кто держит свою кастомку (ccHostWhy):
   аудитория, клуб или PR. Вдвоём не устраивается: календарь у двоих должен быть один. */
// Фонд — любой от CC_OWN_MIN; кнопки — быстрые суммы.
const CC_OWN_MIN=10000, CC_OWN_POOLS=[10000, 25000, 50000, 100000, 250000, 1000000], CC_OWN_STEP=5000;
/* Призовые получают все составы финала: на 100 человек это 100 соло, 50 дуо, 33 трио, 25 сквадов. Форма
   делёжки — вес места 1/место^k: «победителю больше» k=1.2, «ровнее» k=0.5, «поровну» k=0. */
/* Делёжка: head — доли фонда верхним местам, остальное хвосту по 1/место^k.
   top: победителю половина; podium: 35/20/12; top10: десятке 70% по убыванию; even: всем 1/√место. */
const CC_OWN_SHAPES={top:{head:[0.5], k:1}, podium:{head:[0.35, 0.2, 0.12], k:1},
  top10:{headN:10, headPart:0.7, k:1}, even:{head:[], k:0.5}};
// Квалы: в финал проходит 100 человек, финал — на следующий день.
const CC_OWN_FINAL=100;
let CC_OWN_DRAFT=null;
function ccOwnCupsVer(){ const cr=typeof CAREER!=='undefined' && CAREER && CAREER.career; return (cr && cr.ownV) || 0; }
function ccOwnSize(mode){ return mode==='solo' ? 1 : mode==='duo' ? 2 : mode==='trio' ? 3 : 4; }
function ccOwnCups(){
  const cr=typeof CAREER!=='undefined' && CAREER && CAREER.career;
  if(!cr || !cr.ownCups || (typeof ccMpOn==='function' && ccMpOn())) return [];
  const from=ccYearFrom(), to=ccYearTo();
  return cr.ownCups.filter(c=>c.day>=from && c.day<=to && !c.off);
}
// Составов в финале: инвайт — лобби, квалы — сотня прошедших.
function ccOwnField(d){
  const players=d.entry==='invite' ? d.size : CC_OWN_FINAL;
  return Math.max(2, Math.round(players/ccOwnSize(d.mode)));
}
function ccOwnPayT(d){
  const size=ccOwnSize(d.mode), n=ccOwnField(d), sh=CC_OWN_SHAPES[d.shape]||CC_OWN_SHAPES.top;
  const w=[]; for(let i=1;i<=n;i++) w.push(1/Math.pow(i, sh.k));
  const sumOf=(a, b)=>w.slice(a, b).reduce((x, y)=>x+y, 0);
  let share;
  if(sh.headN){
    const h=Math.min(sh.headN, n), part=h<n ? sh.headPart : 1;
    share=w.map((x, i)=>i<h ? part*x/sumOf(0, h) : (1-part)*x/sumOf(h, n));
  } else {
    const head=sh.head.slice(0, Math.max(0, n-1)), left=1-head.reduce((a, b)=>a+b, 0);
    share=w.map((x, i)=>i<head.length ? head[i] : left*x/sumOf(head.length, n));
  }
  // Круглые суммы: шаг от величины, перебор сверх фонда снимается снизу таблицы, порядок мест не ломается.
  const step=v=>v>=10000 ? 500 : v>=2000 ? 100 : v>=500 ? 50 : v>=100 ? 10 : v>=20 ? 5 : 1;
  const pay=share.map(f=>{ const v=d.pool*f/size; return Math.max(1, Math.round(v/step(v))*step(v)); });
  for(let i=1;i<pay.length;i++) if(pay[i]>pay[i-1]) pay[i]=pay[i-1];
  let over=pay.reduce((a, b)=>a+b, 0)*size-d.pool;
  for(let guard=0; over>0 && guard<20; guard++)
    for(let i=pay.length-1; i>=0 && over>0; i--){
      const st=step(pay[i]), floor=i<pay.length-1 ? pay[i+1] : 1;
      if(pay[i]-st>=floor){ pay[i]-=st; over-=st*size; }
    }
  return {EU:pay.map((v, i)=>[i+1, v])};
}
// Дни под турнир: свободный день, а квалам — два свободных подряд.
function ccOwnFreeDays(two){
  const cr=CAREER.career, today=careerToday(), days=careerYearDays(), out=[];
  const free=d=>!(days.get(d)||[]).length && !(cr.did||{})[d] && d<=ccYearTo();
  let last=ccAddDays(today, 60); if(last>ccYearTo()) last=ccYearTo();
  for(let d=ccAddDays(today, 2); d<=last; d=ccAddDays(d, 1))
    if(free(d) && (!two || free(ccAddDays(d, 1)))) out.push(d);
  return out;
}
function ccOwnWhy(){
  if(typeof ccMpOn==='function' && ccMpOn()) return L().ownWhyMp;
  if(CAREER.career.seasonOver) return L().ccSeasonOver;
  if(ccHostWhy()==='reach') return L().ccHostNeedReach(ccNum(CC_HOST_REACH));
  return '';
}
// Свободные игроки сцены своего региона для состава: сильнейшие первыми, без себя.
function ccOwnPool(){
  const me=hKey(CAREER.player.handle||CAREER.player.nick||'');
  return ccSceneRoster(ccCareerRegion()).filter(c=>c && c.handle && hKey(c)!==me)
    .sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
}
function ccOwnMyMates(fmt){
  return ccFmtRoster(fmt).map(r=>ccMateCardOf(r)).filter(Boolean).slice(0, fmt-1);
}
/* Аватарка турнира — только своя картинка: ужимается до 96 точек в jpeg и кладётся в сейв
   строкой; не влезла в потолок — не берём. */
const CC_OWN_LOGO_MAX=16000;
function ccOwnLogoHTML(){
  const T=L(), d=CC_OWN_DRAFT||{}, cur=d.logo||'';
  const up=cur.slice(0, 11)==='data:image/';
  return '<div class="own-logos">'+
    (up ? '<button class="on" onclick="ccOwnLogoSet(-2)"><img src="'+esc(cur)+'" alt=""></button>'+
      '<button class="own-logo-none" onclick="ccOwnLogoSet(-1)" title="'+esc(T.ownLogoNone)+'">✕</button>' : '')+
    '<label class="own-logo-up" title="'+esc(T.ownLogoUp)+'">+<input type="file" accept="image/*" style="display:none" onchange="ccOwnLogoPick(this)"></label>'+
    '</div>'+(d.logoBad ? '<small class="own-why">'+esc(T.ownLogoBig)+'</small>' : '');
}
function ccOwnLogoSet(i){
  const d=CC_OWN_DRAFT; if(!d) return;
  if(i===-2) return;
  d.logo=''; d.logoBad=false;
  ccOwnDraw();
}
// Квадрат по центру, тёмная подложка под прозрачные png.
function ccOwnLogoFrom(src, done){
  const img=new Image();
  img.onload=function(){
    let url='';
    try{
      const N=96, cv=document.createElement('canvas'); cv.width=cv.height=N;
      const x=cv.getContext('2d'); x.fillStyle='#0b1430'; x.fillRect(0, 0, N, N);
      const side=Math.min(img.width||1, img.height||1);
      x.drawImage(img, ((img.width||1)-side)/2, ((img.height||1)-side)/2, side, side, 0, 0, N, N);
      url=cv.toDataURL('image/jpeg', 0.82);
    }catch(e){ url=''; }
    const d=CC_OWN_DRAFT;
    if(d){ if(url && url.length<=CC_OWN_LOGO_MAX){ d.logo=url; d.logoBad=false; } else d.logoBad=true; ccOwnDraw(); }
    if(done) done(!!(d && d.logo===url));
  };
  img.onerror=function(){ if(CC_OWN_DRAFT){ CC_OWN_DRAFT.logoBad=true; ccOwnDraw(); } if(done) done(false); };
  img.src=String(src);
}
function ccOwnLogoPick(input){
  if(!input || !input.files || !input.files[0]) return;
  const rd=new FileReader();
  rd.onload=function(){ ccOwnLogoFrom(String(rd.result||'')); };
  rd.readAsDataURL(input.files[0]);
}
function ccOwnOpen(){
  CC_OWN_DRAFT={name:(String(CAREER.player.nick||'')+' Cup').trim(), day:'', mode:'solo', entry:'invite', size:100, games:6, pool:CC_OWN_MIN, shape:'top', team:'mine', roster:[]};
  CC_OWN_DRAFT.day=ccOwnFreeDays(false)[0]||'';
  ccOwnDraw();
}
function ccOwnSet(k, v){
  const d=CC_OWN_DRAFT; if(!d) return; d[k]=v;
  if(k==='entry'){ const f=ccOwnFreeDays(v==='open'); if(f.indexOf(d.day)<0) d.day=f[0]||''; }
  if(k==='mode') d.roster=[];
  ccOwnDraw();
}
function ccOwnPick(h){
  const d=CC_OWN_DRAFT; if(!d) return;
  const i=d.roster.indexOf(h), need=ccOwnSize(d.mode)-1;
  if(i>=0) d.roster.splice(i, 1); else if(d.roster.length<need) d.roster.push(h);
  ccOwnDraw();
}
function ccOwnClose(){ const el=document.getElementById('ccOwnModal'); if(el) el.style.display='none'; CC_OWN_DRAFT=null; }
function ccOwnDraw(){
  const T=L(), d=CC_OWN_DRAFT; if(!d) return;
  let el=document.getElementById('ccOwnModal');
  if(!el){ el=document.createElement('div'); el.id='ccOwnModal'; el.className='cc-sac-modal'; document.body.appendChild(el); }
  const keep=el.querySelector('.own-in') ? el.querySelector('.own-in').scrollTop : 0;
  const chips=(k, opts)=>'<div class="own-chips">'+opts.map(([v, lbl])=>'<button class="'+(d[k]===v ? 'on' : '')+'" onclick="ccOwnSet(\''+k+'\','+(typeof v==='number' ? v : '\''+v+'\'')+')">'+esc(lbl)+'</button>').join('')+'</div>';
  const row=(lbl, body)=>'<div class="own-row"><em>'+esc(lbl)+'</em>'+body+'</div>';
  const two=d.entry==='open', free=ccOwnFreeDays(two).slice(0, 24);
  const dayLbl=x=>two ? ccDayLabel(x)+'–'+ccDayLabel(ccAddDays(x, 1)) : ccDayLabel(x);
  const size=ccOwnSize(d.mode), need=size-1;
  let teamBody='';
  if(need>0){
    teamBody=chips('team', [['mine', T.ownTeamMine], ['auto', T.ownTeamAuto], ['pick', T.ownTeamPick]]);
    if(d.team==='mine'){ const m=ccOwnMyMates(size); teamBody+='<small class="own-note">'+esc(m.length ? m.map(c=>c.handle).join(', ')+(m.length<need ? ' · '+T.ownTeamFill(need-m.length) : '') : T.ownTeamFill(need))+'</small>'; }
    else if(d.team==='auto'){ teamBody+='<small class="own-note">'+esc(ccOwnPool().slice(0, need).map(c=>c.handle+' '+ccCardOvr(c)).join(', '))+'</small>'; }
    else teamBody+='<small class="own-note">'+esc(T.ownTeamPicked(d.roster.length, need))+'</small><div class="own-chips own-people">'+
      ccOwnPool().slice(0, 30).map(c=>{ const on=d.roster.indexOf(c.handle)>=0;
        return '<button class="'+(on ? 'on' : '')+'" onclick="ccOwnPick(\''+esc(c.handle).replace(/'/g, '')+'\')">'+esc(c.handle)+' <i>'+ccCardOvr(c)+'</i></button>'; }).join('')+'</div>';
  }
  el.innerHTML='<div class="cc-sac-in own-in"><h4>'+esc(T.ownTitle)+'</h4><button class="cc-sac-x" onclick="ccOwnClose()">✕</button>'+
    row(T.ownName, '<input class="cc-sac-q" maxlength="32" value="'+esc(d.name)+'" oninput="CC_OWN_DRAFT.name=this.value">')+
    row(T.ownLogo, ccOwnLogoHTML())+
    row(T.ownMode, chips('mode', [['solo', T.ownMode_solo], ['duo', T.ownMode_duo], ['trio', T.ownMode_trio], ['squad', T.ownMode_squad]]))+
    (need>0 ? row(T.ownTeam, teamBody) : '')+
    row(T.ownEntry, chips('entry', [['invite', T.ownInvite], ['open', T.ownOpenQ]]))+
    (two ? '<small class="own-note">'+esc(T.ownOpenNote)+'</small>' : row(T.ownSize, chips('size', [[50, '50'], [100, '100']])))+
    row(T.ownGames, chips('games', [[4,'4'],[6,'6'],[8,'8'],[10,'10'],[12,'12']]))+
    row(two ? T.ownDates : T.ownDate, free.length ? chips('day', free.map(x=>[x, dayLbl(x)])) : '<small>'+esc(T.ownNoDays)+'</small>')+
    row(T.ownPool, '<div class="own-step"><button onclick="ccOwnPoolStep(-1)">−</button>'+
      '<input class="cc-sac-q" id="ownPoolIn" type="text" inputmode="numeric" value="'+ccNum(d.pool)+'" oninput="ccOwnPoolIn(this.value)" onblur="this.value=ccNum(CC_OWN_DRAFT ? CC_OWN_DRAFT.pool : 0)">'+
      '<button onclick="ccOwnPoolStep(1)">+</button></div>'+chips('pool', CC_OWN_POOLS.map(p=>[p, '$'+ccNum(p)])))+
    row(T.ownShape, chips('shape', [['top', T.ownShapeTop], ['podium', T.ownShapePodium], ['top10', T.ownShapeTop10], ['even', T.ownShapeEven]]))+
    '<div id="ownPayBox">'+ccOwnPayBoxHTML()+'</div>'+
    '</div>';
  el.style.display='flex';
  const inn=el.querySelector('.own-in'); if(inn) inn.scrollTop=keep;
}
function ccOwnPoolStep(dir){
  const d=CC_OWN_DRAFT; if(!d) return;
  d.pool=Math.max(CC_OWN_MIN, Math.round(((d.pool||0)+dir*CC_OWN_STEP)/CC_OWN_STEP)*CC_OWN_STEP);
  ccOwnDraw();
}
// Ввод суммы не перерисовывает окно: только выплаты и кнопку, курсор остаётся в поле.
function ccOwnPoolIn(v){
  if(!CC_OWN_DRAFT) return;
  CC_OWN_DRAFT.pool=Math.max(0, Math.floor(Number(String(v).replace(/[^0-9]/g, ''))||0));
  const box=document.getElementById('ownPayBox'); if(box) box.innerHTML=ccOwnPayBoxHTML();
}
function ccOwnPayBoxHTML(){
  const T=L(), d=CC_OWN_DRAFT; if(!d) return '';
  const bal=CAREER.career.balance||0, why=ccOwnWhy(), size=ccOwnSize(d.mode), n=ccOwnField(d);
  const pay=d.pool>=CC_OWN_MIN ? ccOwnPayT(d).EU : [];
  const shown=pay.length>12 ? pay.slice(0, 10).concat([pay[pay.length-1]]) : pay;
  const short=d.team==='pick' && size>1 && d.roster.length<size-1;
  // Команде — суммы на игрока: у тройки круглой суммы на всех не бывает.
  return '<small class="own-note">'+esc(T.ownAllPaid(n, ccNum(d.pool)))+(size>1 ? ' · '+esc(T.ownPerPlayer) : '')+'</small>'+
    '<div class="own-pay">'+shown.map(([p, a], i)=>(pay.length>12 && i===10 ? '<span>…</span>' : '')+'<span><b>#'+p+'</b> $'+ccNum(a)+'</span>').join('')+'</div>'+
    (why ? '<div class="own-why">'+esc(why)+'</div>'
      : d.pool<CC_OWN_MIN ? '<div class="own-why">'+esc(T.ownMin(ccNum(CC_OWN_MIN)))+'</div>'
      : bal<d.pool ? '<div class="own-why">'+esc(T.ownNoCash(ccNum(d.pool-bal)))+'</div>'
      : short ? '<div class="own-why">'+esc(T.ownTeamPicked(d.roster.length, size-1))+'</div>'
      : !d.day ? '' : '<button class="ch-play own-go" onclick="ccOwnCreate()">'+esc(T.ownCreate(ccNum(d.pool)))+'</button>');
}
function ccOwnCreate(){
  const d=CC_OWN_DRAFT, cr=CAREER.career; if(!d || !d.day || ccOwnWhy()) return null;
  const two=d.entry==='open', size=ccOwnSize(d.mode);
  if(!(d.pool>=CC_OWN_MIN) || (cr.balance||0)<d.pool || ccOwnFreeDays(two).indexOf(d.day)<0) return null;
  const roster=size<2 ? [] : d.team==='pick' ? d.roster.slice(0, size-1)
    : d.team==='auto' ? ccOwnPool().slice(0, size-1).map(c=>c.handle) : null;
  if(d.team==='pick' && size>1 && roster.length<size-1) return null;
  const name=String(d.name||'').trim().slice(0, 32) || 'Cup';
  const n=(cr.ownN=(cr.ownN||0)+1), id='OWN_'+n;
  const base={own:true, mode:d.mode, n:'', pool:d.pool, entry:d.entry, shape:d.shape, roster:roster, games:d.games, logo:d.logo||''};
  const made=[];
  /* Квалы идут в первый день без хозяина: он сразу в финале, остальные места — сильнейшие со сцены
     (обычное поле ЛАНа). Старые сохранения с отдельной записью квал (finalOf) играются как раньше. */
  if(two){
    made.push(Object.assign({}, base, {day:ccAddDays(d.day, 1), id, name:name+' · '+L().ownFinalTag, lan:name+' · '+L().ownFinalTag,
      invite:CC_OWN_FINAL, qualDay:d.day, payT:ccOwnPayT(d), paid:ccOwnField(d)}));
  } else made.push(Object.assign({}, base, {day:d.day, id, name, lan:name, invite:d.size, payT:ccOwnPayT(d), paid:ccOwnField(d)}));
  cr.balance=(cr.balance||0)-d.pool;
  cr.hosted=(cr.hosted||0)+d.pool;
  cr.ownCups=(cr.ownCups||[]).concat(made);
  cr.ownV=(cr.ownV||0)+1;
  CC_VICTORY_LIST=null; CC_YEAR_DAYS=null;
  // Анонс разлетается: охват от фонда, как у прежнего капа из магазина (CC_OWN_CUP_REACH).
  careerReachAdd(Math.round(d.pool*CC_OWN_CUP_REACH));
  careerRepAdd(1);
  careerNews('good', 'ownNewsAnnounce', [name, two ? ccDayLabel(d.day)+'–'+ccDayLabel(ccAddDays(d.day, 1)) : ccDayLabel(d.day), ccNum(d.pool)]);
  careerSave();
  ccOwnClose();
  careerRenderHub('calendar');
  return made[made.length-1];
}
function ccOwnQualOf(ev){ const cr=CAREER.career; return (cr.ownCups||[]).find(x=>x.id===(ev && ev.finalOf)); }
// Итог квал: кто прошёл (составы ником, сильнейшие первыми) и прошёл ли хозяин. Возвращает отсечку в составах.
function ccOwnQualDone(ev, ranked, you){
  const cr=CAREER.career, rec=(cr.ownCups||[]).find(x=>x.id===ev.id);
  const cut=Math.max(2, Math.round((ev.cutPlayers||CC_OWN_FINAL)/(ccOwnSize(ev.mode)||1)));
  const top=ranked.slice(0, cut);
  const res={youIn:top.indexOf(you)>=0, teams:top.filter(t=>t!==you && !t.isYou).map(t=>(t.squad||[]).map(c=>c && c.handle).filter(Boolean))};
  if(rec){ rec.res=res; cr.ownV=(cr.ownV||0)+1; CC_VICTORY_LIST=null; CC_YEAR_DAYS=null; }
  if(!res.youIn) careerNews('flat', 'ownNewsQualOut', [String(ev.name||'').replace(/ · .*$/, '')]);
  return cut;
}
// Финал: составы, прошедшие квалы, — со сцены своего региона.
function ccOwnFinalField(ev, n){
  const q=ccOwnQualOf(ev); if(!q || !q.res) return null;
  const scene=ccSceneRoster(ccCareerRegion()), byKey=new Map(scene.filter(Boolean).map(c=>[hKey(c), c]));
  const out=[];
  q.res.teams.forEach(hs=>{ if(out.length>=n) return;
    const cards=hs.map(h=>byKey.get(hKey(h))).filter(Boolean);
    if(cards.length!==hs.length || !cards.length) return;
    const t=careerTeam(cards, false, true); if(!t.name) t.name=teamLabel(cards); out.push(t); });
  return out;
}
function ccOwnCancel(id){
  const cr=CAREER.career, c=(cr.ownCups||[]).find(x=>x.id===id);
  if(!c || c.off || c.day<=careerToday()) return;
  const q=c.finalOf ? (cr.ownCups||[]).find(x=>x.id===c.finalOf) : null;
  if(q && q.day<=careerToday()) return;
  if(q) q.off=true;
  c.off=true; cr.balance=(cr.balance||0)+c.pool; cr.hosted=Math.max(0, (cr.hosted||0)-c.pool);
  cr.ownV=(cr.ownV||0)+1; CC_VICTORY_LIST=null; CC_YEAR_DAYS=null;
  careerSave(); careerRenderHub('calendar');
}
function ccOwnCupPanelHTML(){
  if(!CAREER || !CAREER.career || (typeof ccMpOn==='function' && ccMpOn())) return '';
  const T=L(), cr=CAREER.career, today=careerToday();
  const list=(cr.ownCups||[]).filter(c=>!c.off && c.day>=today && !c.ownQual);
  const why=ccOwnWhy();
  return '<div class="ch-tile own-tile"><h4>'+esc(T.ownTitle)+'</h4>'+
    '<p class="own-lead">'+esc(T.ownLead)+'</p>'+
    list.map(c=>'<div class="own-item">'+(c.logo ? '<img class="own-ava" src="'+esc(c.logo)+'" alt="">' : '')+'<span><b>'+esc(c.name)+'</b><small>'+esc(ccDayLabel(c.day))+' · '+esc(T['ownMode_'+c.mode]||T.ownMode_solo)+' · '+
      esc(c.entry==='invite' ? T.ownInvite+' '+c.invite : T.ownOpenQ)+' · $'+ccNum(c.pool)+'</small></span>'+
      (c.day>today ? '<button class="ch-decline" onclick="ccOwnCancel(\''+c.id+'\')">'+esc(T.ownCancel)+'</button>' : '')+'</div>').join('')+
    (why ? '<div class="own-why">'+esc(why)+'</div>' : '<button class="ch-sign" onclick="ccOwnOpen()">'+esc(T.ownNew)+'</button>')+'</div>';
}
function careerVictoryOn(iso){
  const alts=ccVictoryAlts(iso);
  if(alts.length<2) return alts[0] || null;
  // Свой турнир в свой день — главный: его устраивал ты.
  const own=alts.find(v=>v.own); if(own) return own;
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  const raced=ccVictoryLocked();
  const pick=!raced && cr && cr.vpick && cr.vpick[iso];
  const hit=pick && alts.find(v=>v.id===pick);
  if(hit && ccConsoleOk(hit)) return hit;
  // По умолчанию — обычный кап на ПК: не мобильный, не консольный, не Zero Build.
  return alts.find(v=>!v.zb && !ccConsoleNeed(v) && !/Mobile|Console|Xbox|Playstation|ZB/i.test(v.id)) || alts[0];
}
function ccVictoryPick(id){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const day=careerToday();
  if(ccVictoryLocked()) return;
  // '__day' — старший турнир дня (Weekly Final), снимает выбор капа.
  if(id==='__day'){ if(cr.vpick) delete cr.vpick[day]; }
  else {
    const pv=ccVictoryAlts(day).find(v=>v.id===id);
    if(!pv || !ccConsoleOk(pv)) return;   // консольный кап без консоли не выбирается
    (cr.vpick=cr.vpick||{})[day]=id;
  }
  careerSave();
  careerRenderHub(CH_TAB||'centre');
}
// Капы этого дня — кнопками под названием вечера, если их больше одного.
/* У мобильного капа дня — мобильный рейтинг и путь к тренировке (игрок мобильной сцены 19.11: «every cup I just get destroyed
   cause there is no way to practice»): тренировка на телефоне и мобильные скримы живут во вкладке «Тренировка». */
function ccMobPrepHTML(next){
  try{
    if(!next || next.day!==careerToday() || !ccMobileOwn()) return '';
    const ev=careerVictoryOn(careerToday()); if(!ev || ccConsoleNeed(ev)!=='mobile') return '';
    return '<div class="cc-valts"><em>'+esc(L().ccMobTitle+' '+ccMobileOvr().toFixed(1))+'</em>'+
      '<button class="cc-valt" onclick="careerRenderHub(\'train\')">'+esc(L().ccMobPrep)+'</button></div>';
  }catch(e){ return ''; }
}
function ccVictoryAltsHTML(){
  const today=careerToday(), alts=ccVictoryAlts(today);
  if(ccVictoryLocked()) return '';
  if(!alts.length) return '';
  // Старший турнир того же дня (Weekly Final) — тоже кнопкой: кап рядом с ним играется только по выбору.
  const senior=(careerEvents().get(today)||[]).filter(e=>e.kind!=='victory')
    .sort((a,b)=>CC_KIND_RANK.indexOf(a.kind)-CC_KIND_RANK.indexOf(b.kind))[0] || null;
  if(alts.length<2 && !senior) return '';
  const cr=CAREER.career, vp=cr.vpick && cr.vpick[today];
  // Горит то, что сыграется (careerNext): ЛАН, ноябрьский Trios Cash Cup и выбранный кап бьют старший турнир.
  let nx=null; if(senior){ try{ nx=careerNext(); }catch(e){ nx=null; } }
  const cur=senior ? ((nx && nx.type==='victory') ? (alts.find(v=>v.id===nx.id) || alts.find(v=>v.id===vp) || null) : null) : careerVictoryOn(today);
  // Капы на разных платформах в один день называются одинаково — платформа из id.
  const plat=id=>/Mobile/i.test(id) ? 'Mobile' : /Console|Xbox|Playstation/i.test(id) ? 'Console' : /_PC\b|_PC$/.test(id) ? 'PC' : '';
  // У капов 2026-го в списке нет имени — то же, что в заголовке вечера (Соло Victory Cup / Victory Cup формата года).
  const name=v=>{ const n=v.lan ? v.lan : (v.name || (v.mode==='solo' ? L().calVictorySolo : ccVictoryCupName())), p=plat(v.id); return p && n.indexOf(p)<0 ? n+' · '+p : n; };
  return '<div class="cc-valts"><em>'+esc(L().ccVAltH)+'</em>'+
    (senior ? '<button class="cc-valt'+(cur ? '' : ' on')+'" onclick="ccVictoryPick(\'__day\')">'+esc(senior.label||'')+'</button>' : '')+
    // Консольный кап без консоли — серая кнопка с причиной (ccConsoleOk).
    alts.map(v=>{ const ok=ccConsoleOk(v);
      return '<button class="cc-valt'+(cur && v.id===cur.id ? ' on' : '')+'"'+(ok ? '' : ' disabled')+' onclick="ccVictoryPick(\''+esc(v.id)+'\')">'+esc(name(v)+(ok ? '' : ' · '+ccConsoleWhy(v)))+'</button>'; }).join('')+'</div>';
}
/* ЧУЖОЙ РЕГИОН. Кап дня можно сыграть и на сервере другого региона, в тот же день, что и свой: Epic пускает на любой
   сервер, а очки FNCS держит за своим регионом, поэтому выезд только на обычные капы (не ЛАН, не свой турнир, не
   инвайт). Каждый выезд стоит CC_AWAY_ENERGY энергии и не двигает день. Поле и призы того региона (ccAsRegion
   держит его на весь вечер). Пинг между серверами — замер cloudping.co (время туда-обратно между регионами AWS,
   среднее двух направлений, снято 15.11.2026): Франкфурт, Вирджиния, Орегон, Сан-Паулу, Бахрейн, Токио, Сидней. Штраф к силе —
   решение, не замер. */
const CC_AWAY_ENERGY=25;
// Расписание Epic по регионам (tools/build-away-schedule.js): «день EU|первое окно» -> время EU (UTC) и сдвиг регионов в минутах.
const CC_AWAY_SCHED={"2025-12-20|S39_1MillionUnrealCup":"18:00/180;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2025-12-19|S39_BleachCup":"18:00/180;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-02-04|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event10Round1":"18:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-02-07|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event11Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-02-14|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event12Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-02-21|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event13Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-02-28|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event14Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-03-07|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event15Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-03-14|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event16Round1":"13:00/240;NAC300,NAW420,BR180,ASIA-540,ME-180,OCE-660","2026-01-10|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event7Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-01-17|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event8Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-01-24|S39_DuosConsoleVictoryCupZB_Jan__S39_DuosConsoleVictoryCupZB_Event9Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-01-05|S39_DuosVictoryCup_Round1_Day1_January":"18:00/240;NAC360,NAW480,BR180,ASIA-540,OCE-660,ME-180","2026-01-12|S39_DuosVictoryCup_Round1_Day2_January":"18:00/240;NAC360,NAW480,BR180,ASIA-540,OCE-660,ME-180","2026-01-19|S39_DuosVictoryCup_Round1_Day3_January":"18:00/240;NAC360,NAW480,BR180,ASIA-540,OCE-660,ME-180","2026-02-08|S39_FNCSDivisionalCup_Division1_Week1Final":"18:00/160;NAC120,NAW120,ASIA-540,BR180,ME-180,OCE-660","2026-02-14|S39_FNCSDivisionalCup_Division1_Week2Final":"18:00/160;NAC360,NAW480,ASIA-540,BR180,ME-180,OCE-660","2026-02-21|S39_FNCSDivisionalCup_Division1_Week3Final":"18:00/160;NAC360,NAW480,ASIA-540,BR180,ME60,OCE-660","2026-02-28|S39_FNCSDivisionalCup_Division1_Week4Final":"17:00/160;NAC420,NAW540,ASIA-480,BR240,OCE-600","2026-03-07|S39_FNCSDivisionalCup_Division1_Week5Final":"18:00/160;NAC360,NAW480,ASIA-540,BR180,ME60,OCE-660","2026-03-14|S39_FNCSDivisionalCup_Division1_Week6Final":"18:00/160;NAC300,NAW420,ASIA-540,BR180,ME60,OCE-660","2026-02-02|S39_FNCSDivisionalCup_Division2_Event1":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-03-03|S39_FNCSDivisionalCup_Division2_Event10":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME60","2026-03-09|S39_FNCSDivisionalCup_Division2_Event11":"18:00/180;NAC300,BR180,ASIA-540,NAW420,OCE-660,ME60","2026-03-10|S39_FNCSDivisionalCup_Division2_Event12":"18:00/180;NAC300,BR180,ASIA-540,NAW420,OCE-660,ME60","2026-02-03|S39_FNCSDivisionalCup_Division2_Event2":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-02-09|S39_FNCSDivisionalCup_Division2_Event3":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-02-10|S39_FNCSDivisionalCup_Division2_Event4":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-02-16|S39_FNCSDivisionalCup_Division2_Event5":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-02-17|S39_FNCSDivisionalCup_Division2_Event6":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-02-23|S39_FNCSDivisionalCup_Division2_Event7":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME60","2026-02-24|S39_FNCSDivisionalCup_Division2_Event8":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME60","2026-03-02|S39_FNCSDivisionalCup_Division2_Event9":"18:00/180;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME60","2026-02-02|S39_FNCSDivisionalCup_Division3_Event1":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME-180,OCE-660","2026-03-03|S39_FNCSDivisionalCup_Division3_Event10":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME60,OCE-660","2026-03-09|S39_FNCSDivisionalCup_Division3_Event11":"18:00/180;BR180,NAW420,NAC300,ASIA-540,ME60,OCE-660","2026-03-10|S39_FNCSDivisionalCup_Division3_Event12":"18:00/180;BR180,NAW420,NAC300,ASIA-540,ME60,OCE-660","2026-02-03|S39_FNCSDivisionalCup_Division3_Event2":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME-180,OCE-660","2026-02-09|S39_FNCSDivisionalCup_Division3_Event3":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME-180,OCE-660","2026-02-10|S39_FNCSDivisionalCup_Division3_Event4":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME-180,OCE-660","2026-02-16|S39_FNCSDivisionalCup_Division3_Event5":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME-180,OCE-660","2026-02-17|S39_FNCSDivisionalCup_Division3_Event6":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME-180,OCE-660","2026-02-23|S39_FNCSDivisionalCup_Division3_Event7":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME60,OCE-660","2026-02-24|S39_FNCSDivisionalCup_Division3_Event8":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME60,OCE-660","2026-03-02|S39_FNCSDivisionalCup_Division3_Event9":"18:00/180;BR180,NAW480,NAC360,ASIA-540,ME60,OCE-660","2026-02-02|S39_FNCSDivisionalCup_Division4_Event1":"18:00/180;NAC360","2026-03-03|S39_FNCSDivisionalCup_Division4_Event10":"18:00/180;NAC360","2026-03-09|S39_FNCSDivisionalCup_Division4_Event11":"18:00/180;NAC300","2026-03-10|S39_FNCSDivisionalCup_Division4_Event12":"18:00/180;NAC300","2026-02-03|S39_FNCSDivisionalCup_Division4_Event2":"18:00/180;NAC360","2026-02-09|S39_FNCSDivisionalCup_Division4_Event3":"18:00/180;NAC360","2026-02-10|S39_FNCSDivisionalCup_Division4_Event4":"18:00/180;NAC360","2026-02-16|S39_FNCSDivisionalCup_Division4_Event5":"18:00/180;NAC360","2026-02-17|S39_FNCSDivisionalCup_Division4_Event6":"18:00/180;NAC360","2026-02-23|S39_FNCSDivisionalCup_Division4_Event7":"18:00/180;NAC360","2026-02-24|S39_FNCSDivisionalCup_Division4_Event8":"18:00/180;NAC360","2026-03-02|S39_FNCSDivisionalCup_Division4_Event9":"18:00/180;NAC360","2026-02-02|S39_FNCSDivisionalCup_Division5_Event1":"18:00/180;NAC360","2026-03-03|S39_FNCSDivisionalCup_Division5_Event10":"18:00/180;NAC360","2026-03-09|S39_FNCSDivisionalCup_Division5_Event11":"18:00/180;NAC300","2026-03-10|S39_FNCSDivisionalCup_Division5_Event12":"18:00/180;NAC300","2026-02-03|S39_FNCSDivisionalCup_Division5_Event2":"18:00/180;NAC360","2026-02-09|S39_FNCSDivisionalCup_Division5_Event3":"18:00/180;NAC360","2026-02-10|S39_FNCSDivisionalCup_Division5_Event4":"18:00/180;NAC360","2026-02-16|S39_FNCSDivisionalCup_Division5_Event5":"18:00/180;NAC360","2026-02-17|S39_FNCSDivisionalCup_Division5_Event6":"18:00/180;NAC360","2026-02-23|S39_FNCSDivisionalCup_Division5_Event7":"18:00/180;NAC360","2026-02-24|S39_FNCSDivisionalCup_Division5_Event8":"18:00/180;NAC360","2026-03-02|S39_FNCSDivisionalCup_Division5_Event9":"18:00/180;NAC360","2026-01-31|S39_FNCSDivisionalCupTrial__S39_FNCS_DivisionalCupTrial":"18:00/180;NAC360,NAW480,ASIA-540,BR180,ME-180,OCE-660","2026-02-06|S39_KPDHCup__S39_KPDH":"18:00/180;NAW480,NAC360,BR180,ASIA-540,OCE-660,ME-180","2026-01-13|S39_KizunaAICup":"18:00/180;NAW480,NAC360,ASIA-540,BR180,OCE-660,ME-180","2026-02-08|S39_MobileSeriesCupFebQual__S39_MobileSeriesCup_FebQualifier5":"17:00/80;NAW480,NAC360,ME-180,BR180,OCE-660","2026-02-22|S39_MobileSeriesCupFebQual__S39_MobileSeriesCup_FebQualifier6":"17:00/80;NAW480,NAC360,ASIA-540,ME-180,BR180,OCE-660","2026-01-12|S39_MobileSeriesCupJanQual__S39_MobileSeriesCup_JanQualifier3":"17:00/80;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-01-25|S39_MobileSeriesCupJanQual__S39_MobileSeriesCup_JanQualifier4":"17:00/80;NAC360,BR180,ASIA-540,NAW480,OCE-660,ME-180","2026-03-08|S39_MobileSeriesCupMarQual__S39_MobileSeriesCup_MarQualifier7":"17:00/80;NAC300,NAW420,BR180,ME-180,ASIA-540,OCE-660","2026-02-05|S39_MobileTestCup_Final":"20:00/105;NAC360","2026-02-12|S39_MobileTestCup_Final2":"20:00/105;NAC360","2026-02-19|S39_MobileTestCup_Final3":"20:00/105;NAC360","2026-02-26|S39_MobileTestCup_Final4":"20:00/105;NAC360","2026-02-05|S39_MobileTestCup_Round1":"17:00/360;NAC360","2025-12-21|S39_NvidiaCup":"18:00/180;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-02-19|S39_PerformanceEvaluation_Event10Round1":"17:00/300;NAC420","2026-02-26|S39_PerformanceEvaluation_Event11Round1":"17:00/300;NAC420","2026-03-05|S39_PerformanceEvaluation_Event12Round1":"17:00/300;NAC420","2026-03-12|S39_PerformanceEvaluation_Event13Round1":"17:00/300;NAC360","2025-12-04|S39_PerformanceEvaluation_Event1Round1":"17:00/300;NAC420","2025-12-11|S39_PerformanceEvaluation_Event2Round1":"17:00/300;NAC420","2025-12-18|S39_PerformanceEvaluation_Event3Round1":"17:00/300;NAC420","2026-01-09|S39_PerformanceEvaluation_Event4Round1":"17:00/300;NAC420","2026-01-15|S39_PerformanceEvaluation_Event5Round1":"17:00/300;NAC420","2026-01-22|S39_PerformanceEvaluation_Event6Round1":"17:00/300;NAC420","2026-01-29|S39_PerformanceEvaluation_Event7Round1":"17:00/300;NAC420","2026-02-05|S39_PerformanceEvaluation_Event8Round1":"17:00/300;NAC420","2026-02-12|S39_PerformanceEvaluation_Event9Round1":"17:00/300;NAC420","2026-03-06|S39_PickleRickCup":"18:00/180;NAW480,NAC360,BR180,ME60,ASIA-540,OCE-660","2026-02-01|S39_PlayStationCupZB_Final":"18:00/160;NAC360,BR180,NAW480,ASIA-540,ME-180,OCE-660","2026-01-30|S39_PlayStationCupZB_Qualifier1":"18:00/180;NAC360,BR180,NAW480,ASIA-540,ME-180,OCE-660","2026-01-31|S39_PlayStationCupZB_Qualifier2":"14:00/180;NAC360,BR180,NAW480,ASIA-540,ME-180,OCE-660","2026-02-01|S39_PlayStationCup_Final":"14:00/160;NAC360,ASIA-540,NAW480,OCE-660","2026-01-30|S39_PlayStationCup_Qualifier1":"18:00/180;NAC360,BR180,ASIA-540,NAW480,ME-180,OCE-660","2026-01-31|S39_PlayStationCup_Qualifier2":"14:00/180;NAC360,BR180,ASIA-540,NAW480,ME-180,OCE-660","2025-12-05|S39_ReloadCashVictoryCup_Dec__S39_ReloadCashVictoryCup_Event1Round1":"18:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2025-12-09|S39_ReloadCashVictoryCup_Dec__S39_ReloadCashVictoryCup_Event2Round1":"18:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2025-12-13|S39_ReloadCashVictoryCup_Dec__S39_ReloadCashVictoryCup_Event3Round1":"18:00/240;NAC360,NAW480,BR180,ASIA-540,OCE-660","2025-12-14|S39_ReloadCashVictoryCup_Dec__S39_ReloadCashVictoryCup_Event4Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,OCE-660","2025-12-16|S39_ReloadCashVictoryCup_Dec__S39_ReloadCashVictoryCup_Event5Round1":"18:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2025-12-20|S39_ReloadCashVictoryCup_Dec__S39_ReloadCashVictoryCup_Event6Round1":"13:00/240;NAC360,NAW480,BR180,ASIA-540,ME-180,OCE-660","2026-02-19|S39_SoloLevelingCup__S39_SoloLeveling":"18:00/180;NAC360,NAW480,BR180,ME60","2026-03-08|S39_SoloVictoryCup_Round1_Day1":"18:00/240;NAC300,NAW420,BR180,ASIA-540,ME60,OCE-660","2026-03-15|S39_SoloVictoryCup_Round1_Day2":"18:00/240;NAC300,NAW420,BR180,ASIA-540,ME60,OCE-660","2026-04-04|S40_ConsoleCC_TriosZB_Event1Round1":"13:00/360;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-600","2026-04-25|S40_ConsoleCC_TriosZB_Event2Round1":"13:00/360;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-03-28|S40_ConsoleVCC_SolosZB_Event1Round1":"13:00/240;NAC300,NAW420,BR180,ASIA-540,ME-180,OCE-660","2026-04-11|S40_ConsoleVCC_SolosZB_Event2Round1":"12:00/240;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-05-09|S40_ConsoleVCC_SolosZB_Event3Round1":"12:00/240;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-03-28|S40_FNCSDivisionalCup_Division1_Week1Final":"18:00/160;NAC300,NAW420,OCE-660,ASIA-540,BR180,ME-180","2026-04-02|S40_FNCSDivisionalCup_Division1_Week2Final":"17:00/160;NAC360,NAW480,ASIA-480,BR240,ME-120","2026-05-09|S40_FNCSDivisionalCup_Division1_Week3Final":"17:00/160;NAC360,NAW480,OCE-540,ASIA-480,BR240,ME-120","2026-05-16|S40_FNCSDivisionalCup_Division1_Week4Final":"17:00/160;NAC360,NAW480,OCE-540,ASIA-480,BR240,ME-120","2026-05-23|S40_FNCSDivisionalCup_Division1_Week5Final":"17:00/160;NAC360,NAW480,OCE-540,ASIA-480,BR240,ME-120","2026-03-23|S40_FNCSDivisionalCup_Division2_Event1":"18:00/180;NAW420,NAC300,BR180,ASIA-540,ME-180,OCE-660","2026-05-19|S40_FNCSDivisionalCup_Division2_Event10":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-540","2026-03-24|S40_FNCSDivisionalCup_Division2_Event2":"18:00/180;NAW420,NAC300,BR180,ASIA-540,ME-180,OCE-660","2026-03-30|S40_FNCSDivisionalCup_Division2_Event3":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-600","2026-03-31|S40_FNCSDivisionalCup_Division2_Event4":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120","2026-05-04|S40_FNCSDivisionalCup_Division2_Event5":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-540","2026-05-05|S40_FNCSDivisionalCup_Division2_Event6":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-540","2026-05-11|S40_FNCSDivisionalCup_Division2_Event7":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-540","2026-05-12|S40_FNCSDivisionalCup_Division2_Event8":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-540","2026-05-18|S40_FNCSDivisionalCup_Division2_Event9":"17:00/180;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-540","2026-03-23|S40_FNCSDivisionalCup_Division3_Event1":"18:00/180;NAW420,BR180,NAC300,ASIA-540,ME-180,OCE-660","2026-05-19|S40_FNCSDivisionalCup_Division3_Event10":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-540","2026-03-24|S40_FNCSDivisionalCup_Division3_Event2":"18:00/180;NAW420,BR180,NAC300,ASIA-540,ME-180,OCE-660","2026-03-30|S40_FNCSDivisionalCup_Division3_Event3":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-600","2026-03-31|S40_FNCSDivisionalCup_Division3_Event4":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120","2026-05-04|S40_FNCSDivisionalCup_Division3_Event5":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-540","2026-05-05|S40_FNCSDivisionalCup_Division3_Event6":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-540","2026-05-11|S40_FNCSDivisionalCup_Division3_Event7":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-540","2026-05-12|S40_FNCSDivisionalCup_Division3_Event8":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-540","2026-05-18|S40_FNCSDivisionalCup_Division3_Event9":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-540","2026-03-23|S40_FNCSDivisionalCup_Division4_Event1":"18:00/180;NAC300","2026-05-19|S40_FNCSDivisionalCup_Division4_Event10":"17:00/180;NAC360","2026-03-24|S40_FNCSDivisionalCup_Division4_Event2":"18:00/180;NAC300","2026-03-30|S40_FNCSDivisionalCup_Division4_Event3":"17:00/180;NAC360","2026-03-31|S40_FNCSDivisionalCup_Division4_Event4":"17:00/180;NAC360","2026-05-04|S40_FNCSDivisionalCup_Division4_Event5":"17:00/180;NAC360","2026-05-05|S40_FNCSDivisionalCup_Division4_Event6":"17:00/180;NAC360","2026-05-11|S40_FNCSDivisionalCup_Division4_Event7":"17:00/180;NAC360","2026-05-12|S40_FNCSDivisionalCup_Division4_Event8":"17:00/180;NAC360","2026-05-18|S40_FNCSDivisionalCup_Division4_Event9":"17:00/180;NAC360","2026-03-23|S40_FNCSDivisionalCup_Division5_Event1":"18:00/180;NAC300","2026-05-19|S40_FNCSDivisionalCup_Division5_Event10":"17:00/180;NAC360","2026-03-24|S40_FNCSDivisionalCup_Division5_Event2":"18:00/180;NAC300","2026-03-30|S40_FNCSDivisionalCup_Division5_Event3":"17:00/180;NAC360","2026-03-31|S40_FNCSDivisionalCup_Division5_Event4":"17:00/180;NAC360","2026-05-04|S40_FNCSDivisionalCup_Division5_Event5":"17:00/180;NAC360","2026-05-05|S40_FNCSDivisionalCup_Division5_Event6":"17:00/180;NAC360","2026-05-11|S40_FNCSDivisionalCup_Division5_Event7":"17:00/180;NAC360","2026-05-12|S40_FNCSDivisionalCup_Division5_Event8":"17:00/180;NAC360","2026-05-18|S40_FNCSDivisionalCup_Division5_Event9":"17:00/180;NAC360","2026-05-20|S40_MandalorianCup":"17:00/180;NAW480,NAC360,BR240,ASIA-480,OCE-540,ME-120","2026-05-20|S40_MandalorianCup_ZB":"17:00/180;NAC360,BR240,NAW480,ASIA-480,ME-120,OCE-540","2026-05-03|S40_MobileSeriesCupQual__S40_MobileSeriesCup_MarQualifier10":"16:00/80;NAC360,NAW480,ASIA-480,BR240,ME-120,OCE-600","2026-05-17|S40_MobileSeriesCupQual__S40_MobileSeriesCup_MarQualifier11":"16:00/80;NAC360,NAW480,ASIA-480,BR240,ME-120,OCE-600","2026-04-05|S40_MobileSeriesCupQual__S40_MobileSeriesCup_MarQualifier8":"16:00/80;NAC360,NAW480,ASIA-480,BR240,ME-120,OCE-570","2026-04-19|S40_MobileSeriesCupQual__S40_MobileSeriesCup_MarQualifier9":"16:00/80;NAC360,NAW480,ASIA-480,BR240,ME-120,OCE-600","2026-05-21|S40_PerformanceEvaluation_Event10Round1":"16:00/300;NAC420","2026-06-03|S40_PerformanceEvaluation_Event11Round1":"16:00/300;NAC420","2026-03-20|S40_PerformanceEvaluation_Event1Round1":"17:00/300;NAC360","2026-03-26|S40_PerformanceEvaluation_Event2Round1":"17:00/300;NAC360","2026-04-01|S40_PerformanceEvaluation_Event3Round1":"16:00/300;NAC420","2026-04-09|S40_PerformanceEvaluation_Event4Round1":"16:00/300;NAC420","2026-04-16|S40_PerformanceEvaluation_Event5Round1":"16:00/300;NAC420","2026-04-23|S40_PerformanceEvaluation_Event6Round1":"16:00/300;NAC420","2026-04-30|S40_PerformanceEvaluation_Event7Round1":"16:00/270;NAC420","2026-05-07|S40_PerformanceEvaluation_Event8Round1":"16:00/300;NAC420","2026-05-14|S40_PerformanceEvaluation_Event9Round1":"16:00/300;NAC420","2026-05-02|S40_PlayStationCupClix_Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-04-29|S40_PlayStationCupClix_Qualifier":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-03-22|S40_PlayStationCupMrSavage_Final":"18:00/160;NAC300,NAW420,BR180,OCE-660,ME-180","2026-03-22|S40_SoloVictoryCup_Round1_Day1":"13:00/240;NAC300,NAW420,BR180,ASIA-540,OCE-660","2026-03-29|S40_SoloVictoryCup_Round1_Day2":"17:00/240;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-600","2026-04-05|S40_SoloVictoryCup_Round1_Day3":"17:00/240;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-04-12|S40_SoloVictoryCup_Round1_Day4":"17:00/240;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-04-15|S40_TripleThreatCup__S40_TripleThreat":"17:00/180;BR240,NAW480,ASIA-480,NAC360,OCE-540,ME-120","2026-05-26|S40_TypicalGamerCup":"17:00/180;NAC360,NAW480,ASIA-480,ME-120,BR240,OCE-540","2026-07-18|S41_CashCup_DuosZB_Event1Round1":"13:00/360;NAW480,ASIA-480,BR240,ME-120,OCE-540,NAC360","2026-08-01|S41_CashCup_DuosZB_Event2Round1":"13:00/360;NAW480,ASIA-480,BR240,ME-120,OCE-540,NAC360","2026-06-13|S41_ConsoleCC_DuosZB_Event1Round1":"13:00/360;NAC360,BR240,NAW480,ASIA-480,ME-120,OCE-540","2026-06-20|S41_ConsoleCC_DuosZB_Event2Round1":"13:00/360;NAC360,BR240,NAW480,ASIA-480,ME-120,OCE-540","2026-07-18|S41_ConsoleCC_DuosZB_Event3Round1":"13:00/360;NAC360,BR240,NAW480,ASIA-480,ME-120,OCE-540","2026-07-25|S41_ConsoleCC_DuosZB_Event4Round1":"13:00/360;NAC360,BR240,NAW480,ASIA-480,ME-120,OCE-540","2026-08-08|S41_ConsoleCC_DuosZB_Event6Round1":"13:00/360;NAC360,BR240,NAW480,ASIA-480,ME-120,OCE-540","2026-08-15|S41_ConsoleCC_DuosZB_Event7Round1":"13:00/360;NAC360,BR240,NAW480,ASIA-480,ME-120,OCE-540","2026-06-14|S41_ConsoleVCC_SolosZB_Event1Round1":"12:00/240;NAC360,NAW480,BR240,OCE-540,ASIA-480,ME-120","2026-06-21|S41_ConsoleVCC_SolosZB_Event2Round1":"12:00/240;NAC360,NAW480,BR240,OCE-540,ASIA-480,ME-120","2026-07-19|S41_ConsoleVCC_SolosZB_Event3Round1":"12:00/240;NAC360,NAW480,BR240,OCE-540,ASIA-480,ME-120","2026-07-26|S41_ConsoleVCC_SolosZB_Event4Round1":"12:00/240;NAC360,NAW480,BR240,OCE-540,ASIA-480,ME-120","2026-08-02|S41_ConsoleVCC_SolosZB_Event5Round1":"12:00/240;NAC360,NAW480,BR240,OCE-540,ASIA-480,ME-120","2026-08-09|S41_ConsoleVCC_SolosZB_Event6Round1":"12:00/240;NAC360,NAW480,BR240,OCE-540,ASIA-480,ME-120","2026-08-16|S41_ConsoleVCC_SolosZB_Event7Round1":"12:00/240;NAC360,NAW480,BR240,OCE-540,ASIA-480,ME-120","2026-07-17|S41_DavidBeckham":"17:00/180;NAC360,NAW480,BR120,ASIA-480,OCE-540,ME-120","2026-07-17|S41_DavidBeckham_ZB":"17:00/180;NAW480,NAC360,BR120,ASIA-480,ME-120,OCE-540","2026-06-13|S41_FNCSDivisionalCup_Division1_Week1Final":"17:00/160;NAC360,NAW480,ASIA-480,ME-120,OCE-540","2026-06-20|S41_FNCSDivisionalCup_Division1_Week2Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-06-27|S41_FNCSDivisionalCup_Division1_Week3Final":"13:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-07-17|S41_FNCSDivisionalCup_Division1_Week4Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-06-08|S41_FNCSDivisionalCup_Division2_Event1":"17:00/180;NAC360,NAW480,ASIA-480,BR240,OCE-540,ME-120","2026-06-09|S41_FNCSDivisionalCup_Division2_Event2":"17:00/180;NAC360,NAW480,ASIA-480,BR240,OCE-540,ME-120","2026-06-15|S41_FNCSDivisionalCup_Division2_Event3":"17:00/180;NAC360,NAW480,ASIA-480,BR240,OCE-540,ME-120","2026-06-16|S41_FNCSDivisionalCup_Division2_Event4":"17:00/180;NAC360,NAW480,ASIA-480,BR240,OCE-540,ME-120","2026-06-22|S41_FNCSDivisionalCup_Division2_Event5":"17:00/180;NAC360,NAW480,ASIA-480,BR240,OCE-540,ME-120","2026-06-23|S41_FNCSDivisionalCup_Division2_Event6":"17:00/180;NAC360,NAW480,ASIA-480,BR240,OCE-540,ME-120","2026-07-13|S41_FNCSDivisionalCup_Division2_Event7":"17:00/180;NAC360,NAW480,ASIA-480,BR240,OCE-540,ME-120","2026-07-14|S41_FNCSDivisionalCup_Division2_Event8":"15:30/180;NAC450,NAW570,ASIA-390,BR330,OCE-450,ME-30","2026-06-08|S41_FNCSDivisionalCup_Division3_Event1":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-06-09|S41_FNCSDivisionalCup_Division3_Event2":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-06-15|S41_FNCSDivisionalCup_Division3_Event3":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-06-16|S41_FNCSDivisionalCup_Division3_Event4":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-06-22|S41_FNCSDivisionalCup_Division3_Event5":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-06-23|S41_FNCSDivisionalCup_Division3_Event6":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-07-13|S41_FNCSDivisionalCup_Division3_Event7":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-07-14|S41_FNCSDivisionalCup_Division3_Event8":"15:30/180;NAC450,NAW570,BR330,ME-30,ASIA-390,OCE-450","2026-06-08|S41_FNCSDivisionalCup_Division4_Event1":"17:00/180;NAC360","2026-06-09|S41_FNCSDivisionalCup_Division4_Event2":"17:00/180;NAC360","2026-06-15|S41_FNCSDivisionalCup_Division4_Event3":"17:00/180;NAC360","2026-06-16|S41_FNCSDivisionalCup_Division4_Event4":"17:00/180;NAC360","2026-06-22|S41_FNCSDivisionalCup_Division4_Event5":"17:00/180;NAC360","2026-06-23|S41_FNCSDivisionalCup_Division4_Event6":"17:00/180;NAC360","2026-07-13|S41_FNCSDivisionalCup_Division4_Event7":"17:00/180;NAC360","2026-07-14|S41_FNCSDivisionalCup_Division4_Event8":"15:30/180;NAC450","2026-06-08|S41_FNCSDivisionalCup_Division5_Event1":"17:00/180;NAC360","2026-06-09|S41_FNCSDivisionalCup_Division5_Event2":"17:00/180;NAC360","2026-06-15|S41_FNCSDivisionalCup_Division5_Event3":"17:00/180;NAC360","2026-06-16|S41_FNCSDivisionalCup_Division5_Event4":"17:00/180;NAC360","2026-06-22|S41_FNCSDivisionalCup_Division5_Event5":"17:00/180;NAC360","2026-06-23|S41_FNCSDivisionalCup_Division5_Event6":"17:00/180;NAC360","2026-07-13|S41_FNCSDivisionalCup_Division5_Event7":"17:00/180;NAC360","2026-07-14|S41_FNCSDivisionalCup_Division5_Event8":"15:30/180;NAC450","2026-06-27|S41_MobileSeriesCupQual__S41_MobileSeriesCup_MarQualifier12":"16:00/80;NAC360,NAW480,BR240,ASIA-480,OCE-600,ME-120","2026-08-01|S41_MobileSeriesCupQual__S41_MobileSeriesCup_MarQualifier13":"16:00/80;NAC360,NAW480,BR240,ASIA-480,OCE-600,ME-120","2026-08-16|S41_MobileSeriesCupQual__S41_MobileSeriesCup_MarQualifier14":"16:00/80;NAC360,NAW480,BR240,ASIA-480,OCE-600,ME-120","2026-06-19|S41_MobileVictoryCup_ReloadminiV__S41_MobileVictoryCup_Day1_Round1_ReloadminiV":"16:00/360;NAC360,NAW480,ASIA-480,ME-120,BR240,OCE-540","2026-06-27|S41_MobileVictoryCup_BR__S41_MobileVictoryCup_Day2_Round1_BR":"12:00/360;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-07-24|S41_MobileVictoryCup_ZBReload__S41_MobileVictoryCup_Day3_Round1_ZBReload":"16:00/360;NAC360,NAW480,ASIA-480,BR240,ME-120,OCE-540","2026-08-02|S41_MobileVictoryCup_ZB__S41_MobileVictoryCup_Day4_Round1_ZB":"16:00/360;NAW480,NAC360,BR240,ASIA-480,ME-120,OCE-540","2026-08-14|S41_MobileVictoryCup_RES__S41_MobileVictoryCup_Day5_Round1_RES":"16:00/360;NAC360,NAW480,ASIA-480,BR240,ME-120,OCE-540","2026-06-27|S41_MongraalIconCup":"17:00/150;NAC360,NAW480,BR240,OCE-540,ME-120,ASIA-480","2026-06-10|S41_PSCupDaysOfPlay_Final":"17:00/160;NAW480,NAC360,ASIA-480,ME-120,OCE-540,BR240","2026-06-07|S41_PSCupDaysOfPlay_Qualifier":"13:00/180;NAW480,NAC360,ASIA-480,ME-120,OCE-540,BR240","2026-06-09|S41_PSCupDaysOfPlay_ZB_Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-06-07|S41_PSCupDaysOfPlay_ZB_Qualifier":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-07-31|S41_PSTypicalGamer_Final":"17:00/160;NAC360,ASIA-480,NAW480,BR240,ME-120,OCE-540","2026-07-29|S41_PSTypicalGamer_Qualifier":"17:00/180;NAC360,ASIA-480,NAW480,BR240,ME-120,OCE-540","2026-08-04|S41_PSTypicalGamer_ZB_Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,OCE-540,ME-120","2026-07-29|S41_PSTypicalGamer_ZB_Qualifier":"17:00/180;NAC360,NAW480,BR240,ASIA-480,OCE-540,ME-120","2026-06-07|S41_PerformanceEvaluation_Event1Round1":"16:00/360;NAC420","2026-06-18|S41_PerformanceEvaluation_Event2Round1":"16:00/300;NAC420","2026-06-25|S41_PerformanceEvaluation_Event3Round1":"16:00/330;NAC420","2026-07-16|S41_PerformanceEvaluation_Event4Round1":"16:00/300;NAC420","2026-07-23|S41_PerformanceEvaluation_Event5Round1":"16:00/300;NAC420","2026-07-30|S41_PerformanceEvaluation_Event6Round1":"16:00/300;NAC420","2026-08-06|S41_PerformanceEvaluation_Event8Round1":"16:00/300;NAC420","2026-08-13|S41_PerformanceEvaluation_Event9Round1":"16:00/300;NAC420","2026-08-01|S41_ReloadSoloVictoryCup_Round1_Day1":"12:00/240;NAC360,NAW480,BR240,ASIA-480,OCE-540,ME-120","2026-08-11|S41_ReloadSoloVictoryCup_Round1_Day2":"17:00/240;NAC360,NAW480,BR240,ASIA-480,OCE-540,ME-120","2026-08-15|S41_ReloadSoloVictoryCup_Round1_Day3":"12:00/240;NAC360,NAW480,BR240,ASIA-480,OCE-540,ME-120","2026-06-13|S41_SoloVictoryCup_Round1_Day1":"12:00/240;NAC360,NAW480,ME-120,BR240,ASIA-480,OCE-540","2026-06-20|S41_SoloVictoryCup_Round1_Day2":"12:00/240;NAC360,NAW480,ME-120,BR240,ASIA-480,OCE-540","2026-07-18|S41_SoloVictoryCup_Round1_Day3":"12:00/240;NAC360,NAW480,ME-120,BR240,ASIA-480,OCE-540","2026-07-25|S41_SoloVictoryCup_Round1_Day4":"10:00/240;NAC360,NAW600,ME0,BR360,ASIA-360,OCE-420","2026-06-24|S41_SupergirlCup":"17:00/180;NAC360,BR120,NAW480,ME-120,OCE-540,ASIA-480","2026-06-24|S41_SupergirlCup_ZB":"17:00/180;NAC360,NAW480,BR120,ASIA-480,OCE-540,ME-120","2026-07-15|S41_TheOdysseyCup":"15:30/180;NAC450,NAW570,ASIA-390,BR390,ME-30,OCE-450","2026-07-15|S41_TheOdysseyCup_Mobile":"16:00/75;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-07-15|S41_TheOdysseyCup_ZB":"15:30/180;NAC450,NAW570,BR390,ME-30,ASIA-390,OCE-450","2026-06-10|S41_ViniJr":"17:00/180;NAC360,NAW480,BR240,ME-120,ASIA-480,OCE-540","2026-06-10|S41_ViniJr_Mobile":"16:00/75;NAC360,NAW480,BR240,OCE-540,ME-120,ASIA-480","2026-06-10|S41_ViniJr_ZB":"17:00/180;NAW480,BR240,NAC360,ASIA-480,ME-120,OCE-540","2026-08-29|S42_ConsoleVCC_SolosZB_Event1Round1":"17:00/240;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-540","2026-09-05|S42_ConsoleVCC_SolosZB_Event2Round1":"17:00/240;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-540","2026-09-12|S42_ConsoleVCC_SolosZB_Event3Round1":"17:00/240;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-540","2026-09-19|S42_ConsoleVCC_SolosZB_Event4Round1":"17:00/240;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-540","2026-10-03|S42_ConsoleVCC_SolosZB_Event5Round1":"12:00/360;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-540","2026-10-10|S42_ConsoleVCC_SolosZB_Event6Round1":"12:00/360;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-600","2026-10-17|S42_ConsoleVCC_SolosZB_Event7Round1":"17:00/240;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-600","2026-10-24|S42_ConsoleVCC_SolosZB_Event8Round1":"12:00/360;NAC360,ASIA-480,BR240,ME-120,NAW480,OCE-600","2026-08-28|S42_CrashBandicootCup":"17:00/150;BR240,NAC360,ASIA-480,OCE-540,ME-120,NAW480","2026-08-28|S42_CrashBandicootCup_ZB":"17:00/150;NAW480,BR240,NAC360,ASIA-480,OCE-540,ME-120","2026-08-25|S42_FNCSDivisionalCup_Division1_Event1":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-08-31|S42_FNCSDivisionalCup_Division1_Event2":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-07|S42_FNCSDivisionalCup_Division1_Event3":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-14|S42_FNCSDivisionalCup_Division1_Event4":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-08-29|S42_FNCSDivisionalCup_Division1_Week1Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-05|S42_FNCSDivisionalCup_Division1_Week2Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-12|S42_FNCSDivisionalCup_Division1_Week3Final":"13:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-19|S42_FNCSDivisionalCup_Division1_Week4Final":"13:00/360;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-08-25|S42_FNCSDivisionalCup_Division2_Event1":"17:00/180;NAW480,ASIA-480,BR240,NAC360,OCE-540,ME-120","2026-08-31|S42_FNCSDivisionalCup_Division2_Event2":"17:00/180;NAW480,ASIA-480,BR240,NAC360,OCE-540,ME-120","2026-09-07|S42_FNCSDivisionalCup_Division2_Event3":"17:00/180;NAW480,ASIA-480,BR240,NAC360,OCE-540,ME-120","2026-09-14|S42_FNCSDivisionalCup_Division2_Event4":"17:00/180;NAW480,ASIA-480,BR240,NAC360,OCE-540,ME-120","2026-08-25|S42_FNCSDivisionalCup_Division3_Event1":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-08-31|S42_FNCSDivisionalCup_Division3_Event2":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-07|S42_FNCSDivisionalCup_Division3_Event3":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-14|S42_FNCSDivisionalCup_Division3_Event4":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-08-25|S42_FNCSDivisionalCup_Division4_Event1":"17:00/180;NAC360","2026-08-31|S42_FNCSDivisionalCup_Division4_Event2":"17:00/180;NAC360","2026-09-07|S42_FNCSDivisionalCup_Division4_Event3":"17:00/180;NAC360","2026-09-14|S42_FNCSDivisionalCup_Division4_Event4":"17:00/180;NAC360","2026-08-25|S42_FNCSDivisionalCup_Division5_Event1":"17:00/180;NAC360","2026-08-31|S42_FNCSDivisionalCup_Division5_Event2":"17:00/180;NAC360","2026-09-07|S42_FNCSDivisionalCup_Division5_Event3":"17:00/180;NAC360","2026-09-14|S42_FNCSDivisionalCup_Division5_Event4":"17:00/180;NAC360","2026-09-15|S42_IronmouseIconCup":"17:00/150;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-15|S42_IronmouseIconCup_ZB":"17:00/150;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-18|S42_KingdomHeartsCup":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-18|S42_KingdomHeartsCup_Mobile":"16:00/75;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-18|S42_KingdomHeartsCup_ZB":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-24|S42_MadisonBeerIconCup":"17:00/150;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-24|S42_MadisonBeerIconCup_ZB":"17:00/150;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-08|S42_MegaManCup":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-08|S42_MegaManCup_Mobile":"16:00/75;NAC360,NAW480,BR240,ASIA-480,OCE-540,ME-120","2026-09-08|S42_MegaManCup_ZB":"17:00/180;NAC360,NAW480,ASIA-480,ME-120,BR240,OCE-540","2026-09-19|S42_MobileVictoryCup_ReloadminiV__S42_MobileVictoryCup_Event1_Round1":"16:00/190;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-26|S42_MobileVictoryCup_ReloadminiV__S42_MobileVictoryCup_Event2_Round1":"16:00/190;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-10-03|S42_MobileVictoryCup_ReloadminiV__S42_MobileVictoryCup_Event3_Round1":"16:00/190;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-10-10|S42_MobileVictoryCup_ReloadminiV__S42_MobileVictoryCup_Event4_Round1":"16:00/190;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-600","2026-10-17|S42_MobileVictoryCup_ReloadminiV__S42_MobileVictoryCup_Event5_Round1":"16:00/190;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-600","2026-10-07|S42_PSNickEh30_Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-600","2026-09-30|S42_PSNickEh30_Qualifier":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-10-08|S42_PSNickEh30_ZB_Final":"17:00/160;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-600","2026-09-30|S42_PSNickEh30_ZB_Qualifier":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-08-23|S42_PerformanceEvaluation_Event1Round1":"16:00/300;NAC420","2026-09-03|S42_PerformanceEvaluation_Event2Round1":"16:00/300;NAC420","2026-09-10|S42_PerformanceEvaluation_Event3Round1":"16:00/300;NAC420","2026-09-17|S42_PerformanceEvaluation_Event4Round1":"16:00/300;NAC420","2026-09-24|S42_PerformanceEvaluation_Event5Round1":"16:00/300;NAC420","2026-10-01|S42_PerformanceEvaluation_Event6Round1":"16:00/300;NAC420","2026-10-08|S42_PerformanceEvaluation_Event7Round1":"16:00/300;NAC420","2026-10-15|S42_PerformanceEvaluation_Event8Round1":"16:00/300;NAC420","2026-10-22|S42_PerformanceEvaluation_Event9Round1":"16:00/300;NAC420","2026-09-25|S42_Persona5Cup":"17:00/150;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-25|S42_Persona5Cup_ZB":"17:00/150;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-12|S42_WeezyIconCup":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-09-12|S42_WeezyIconCup_ZB":"17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540","2026-11-06|S43_OnePieceZoroCup":"18:00/180;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-06|S43_OnePieceZoroCup_Mobile":"17:00/75;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-06|S43_OnePieceZoroCup_MobileAll":"17:00/75;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-06|S43_OnePieceZoroCup_ZB":"18:00/180;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-05|S43_PerformanceEvaluation_Event1Round1":"17:00/300;NAC420","2026-11-12|S43_PerformanceEvaluation_Event2Round1":"17:00/300;NAC420","2026-11-19|S43_PerformanceEvaluation_Event3Round1":"17:00/300;NAC420","2026-11-26|S43_PerformanceEvaluation_Event4Round1":"17:00/300;NAC420","2026-11-09|S43_SquadsVictoryCup_Event1_Round1":"18:00/240;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-23|S43_SquadsVictoryCup_Event2_Round1":"18:00/240;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-07|S43_TriosCashCup_Event1":"14:00/180;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-14|S43_TriosCashCup_Event2":"14:00/180;OCE-660,ASIA-540,ME-180,BR180,NAC360,NAW480","2026-11-22|S43_TriosCashCup_Event3":"12:00/180;OCE-540,ASIA-420,ME-60,BR300,NAC480,NAW600"};
const CC_XREG_MS={'EU|NAC':92, 'EU|NAW':151, 'EU|BR':204, 'EU|ME':85, 'EU|ASIA':233, 'EU|OCE':251,
  'NAC|NAW':67, 'NAC|BR':114, 'NAC|ME':165, 'NAC|ASIA':148, 'NAC|OCE':206,
  'NAW|BR':178, 'NAW|ME':220, 'NAW|ASIA':104, 'NAW|OCE':145,
  'BR|ME':276, 'BR|ASIA':259, 'BR|OCE':317, 'ME|ASIA':166, 'ME|OCE':191, 'ASIA|OCE':110};
function ccXregMs(a, b){ return a===b ? 0 : (CC_XREG_MS[a+'|'+b] || CC_XREG_MS[b+'|'+a] || 150); }
// Свой пинг-бонус на чужом сервере пропадает (ccPingNow отдаёт межрегиональный пинг) и сверху минус сила:
// 1 за каждые 4 мс после 20, до 35. NAC -18, ME -16, NAW -33, дальше -35.
const CC_AWAY_PEN_MAX=35;
function ccAwayPen(ms){ return clamp(Math.round((ms-20)/4), 0, CC_AWAY_PEN_MAX); }
function ccAwayEv(reg, day){ day=day||careerToday(); try{ return ccAsRegion(reg, ()=>careerVictoryOn(day)); }catch(e){ return null; } }
/* Region lock по данным Epic (meta.RegionLockType в tracker-2025-eu.json, 143 события): у Мейджоров FNCS Season, у FNCS
   Trial и Duos Trial Window, у всех 130 капов (Cash, Victory, Solo Cash, Performance, OG, Icon) блокировки нет. Поэтому
   на выезд не идут FNCS и Trial (он же расставляет по дивизионам, placement). Дивизионные капы блокировки не имеют и
   идут (его слово 14.11): на выезде это одна сессия того же дивизиона, без перехода и путёвки (runCareerCup, CC_AWAY). */
const CC_AWAY_LOCKED=/Trial|FNCS(?!DivisionalCup)/i;
function ccAwayFits(ev){ return !!ev && !ev.own && !ev.lan && !ev.invite && !ev.fight && !ev.ewc24 && !ev.reshuffle && !ev.finalOf && !ev.ownQual
  && !ev.placement && !CC_AWAY_LOCKED.test(String(ev.id||'')); }
/* Что в этот день можно сыграть на выезде: 'victory' — кап дня, 'eval' — Performance Evaluation (у Epic без блокировки
   региона; в карьере только Дивизион 1, как и дома), '' — ничего. */
/* ДИВИЗИОН В ЧУЖОМ РЕГИОНЕ (его слово 14.11: «дивизионы я могу на разных регионах играть, в этом регионе точно»): у каждого
   региона своя лестница. Первый раз в регионе — нижний дивизион, переход вверх по той же отсечке, что дома. Свой
   дивизион это не трогает. cr.regDiv={NAC:3, ...}. Путёвки в финал недели из чужого Д1 нет: это отдельный вечер. */
function ccAwayDiv(reg){
  const cr=CAREER && CAREER.career, d=cr && cr.regDiv && cr.regDiv[reg], n=ccDivCount(reg);
  return d>=1 ? Math.min(d, n) : n;
}
function ccAwayKind(reg, day){
  day=day||careerToday();
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const vic=()=>ccAwayFits(ccAwayEv(reg, day));
  const ev=()=>cr.division===1 && ccEvalNights().indexOf(day)>=0 && ccAsRegion(reg, ()=>ccEvalNights().indexOf(day)>=0);
  // Кап дивизиона: в этот день у своего дивизиона кап (календарь общий у регионов).
  const cup=()=>{ try{ return (careerEvents().get(day)||[]).some(e=>e.kind==='cup'); }catch(e){ return false; } };
  // Сначала — того же вида, что свой вечер этого дня (сегодня — следующий вечер, вчера — сыгранный, cr.awayCarryKind).
  // Финал недели того региона — только с путёвкой из его Д1 на этой неделе (cr.regWf).
  const rw=reg===ccCareerRegion() ? cr.wf : (cr.regWf && cr.regWf[reg]);   // дома — своя путёвка
  if(rw && rw.monday===careerMonday(day) && (careerYearDays().get(day)||[]).some(e=>e.kind==='final')) return 'final';
  const hk=day===careerToday() ? ((careerNext()||{}).type) : cr.awayCarryKind;
  if(hk==='cup' && cup()) return 'cup';
  if(hk==='eval' && ev()) return 'eval';
  if(vic()) return 'victory';
  if(ev()) return 'eval';
  if(cup()) return 'cup';
  return '';
}
/* Вечер капа в регионе по расписанию Epic: Date старта с полем end (мс, конец последнего раунда); null — в этот вечер у
   региона капа не было (кнопки нет); undefined — расписания на этот день нет (прошлые годы, годы после 2026): регион
   открыт без времени и без часов. */
function ccAwaySlot(reg, day){
  if(typeof CC_AWAY_SCHED==='undefined') return undefined;
  day=day||careerToday();
  const kind=ccAwayKind(reg, day);
  let k=null;
  if(kind==='eval') k=Object.keys(CC_AWAY_SCHED).find(x=>x.indexOf(day+'|')===0 && x.indexOf('_PerformanceEvaluation_')>0);
  else if(kind==='final') k=Object.keys(CC_AWAY_SCHED).find(x=>x.indexOf(day+'|')===0 && /_FNCSDivisionalCup_Division1_Week\d+Final/.test(x));
  else if(kind==='cup'){ const dv='_FNCSDivisionalCup_Division'+(reg===ccCareerRegion() ? (CAREER.career.division||1) : ccAwayDiv(reg))+'_Event';
    k=Object.keys(CC_AWAY_SCHED).find(x=>x.indexOf(day+'|')===0 && x.indexOf(dv)>0); }
  else {
    const ev=careerVictoryOn(day); if(!ev) return undefined;
    const pre=day+'|'+ev.id;
    k=Object.keys(CC_AWAY_SCHED).find(x=>x===pre || x.indexOf(pre+'_')===0);
  }
  if(!kind) return undefined;
  /* Расписания этого дня нет (прошлые годы, годы после 2026, свои дни без окон Epic): обычный вечер по медианам того же
     расписания 2026 (245 вечеров): EU 17:00 UTC на 3 ч, ASIA -8 ч, OCE -9 ч, ME -2 ч, BR +4 ч, NAC +6 ч, NAW +8 ч. Без этого
     у таких дней не было часов: NAC стоял до своего капа, а после него ночной строки не было. */
  const sched=k ? CC_AWAY_SCHED[k] : '17:00/180;NAC360,NAW480,BR240,ASIA-480,ME-120,OCE-540';
  const parts=sched.split(';'), head=parts[0].split('/'), off={EU:0};
  (parts[1]||'').split(',').forEach(p=>{ const m=/^([A-Z]+)(-?\d+)$/.exec(p); if(m) off[m[1]]=Number(m[2]); });
  if(!(reg in off)) return null;
  const at=Date.parse(day+'T'+head[0]+':00Z')+off[reg]*60000, d=new Date(at);
  d.end=at+(Number(head[1])||180)*60000;
  return d;
}
/* ЧАСЫ ВЕЧЕРА (его «по расписанию должны играться капы»): сыгранный вечер — свой или выезд — занимает время до конца
   своего последнего раунда; всё, что стартует раньше, уже прошло. cr.awayClock={day, t}: день капа и конец последнего
   сыгранного. Свой вечер двигает день, поэтому поздние регионы того же вечера (BR, NAC, NAW — ночь по Европе)
   переезжают на следующий день строкой «Ночью ещё идут» (cr.awayCarry — день капа). Без расписания часов нет. */
function ccAwayClock(day){ const c=CAREER && CAREER.career && CAREER.career.awayClock; return c && c.day===day ? c.t : 0; }
function ccAwayClockSet(day, t){ const cr=CAREER.career; cr.awayClock={day, t:Math.max(t, ccAwayClock(day))}; }
// Свой вечер этого дня совпадает по времени с уже сыгранным выездом.
/* Свой вечер выезд не закрывает (его «нажал NAC, но не могу нажать EU потом»): до своего капа выезд открыт только туда, где
   вечер заканчивается до его начала (ccAwayWhy 'later'), поэтому пересечься им не с чем. Старые сейвы, где часы уже ушли
   за свой кап, тоже открываются. */
/* Свой кап выездом не закрывается: поздние регионы до него просто недоступны (ccAwayWhy 'later', серая кнопка). */
function ccAwayHomeBusy(day){ return false; }
// Старт своего вечера этого дня по расписанию, если он ещё не сыгран (день не сдвинулся), иначе null.
function ccAwayHomeStart(day){
  if(day!==careerToday()) return null;
  try{ const s=ccAwaySlot(ccCareerRegion(), day); return s instanceof Date ? s.getTime() : null; }catch(e){ return null; }
}
// Свой вечер сыгран: часы — до его конца, поздние регионы ждут ночью (следующий день карьеры).
function ccAwayHomeDone(day, kind){
  try{ const cr=CAREER.career; if(kind) cr.awayCarryKind=kind;
       const s=ccAwaySlot(ccCareerRegion(), day); if(!(s instanceof Date)) return;
       ccAwayClockSet(day, s.end); cr.awayCarry=day; cr.awayCarryKind=kind||cr.awayCarryKind||null; }catch(e){}
}
// День капа, чьи поздние регионы можно сыграть сегодня (вчерашний свой вечер), или null.
function ccAwayCarryDay(){
  const cr=CAREER && CAREER.career, d=cr && cr.awayCarry;
  return d && ccAddDays(d, 1)===careerToday() ? d : null;
}
// '' — можно; 'off' — кнопки нет; иначе причина на кнопке.
function ccAwayWhy(reg, day){
  const cr=CAREER && CAREER.career;
  day=day||careerToday();
  if(!cr || cr.seasonOver || CC_AWAY || ccVictoryLocked()) return 'off';
  const kind=ccAwayKind(reg, day);
  if(!kind) return 'off';
  const s=ccAwaySlot(reg, day);
  if(s===null) return 'off';   // по расписанию Epic в этот вечер у региона капа не было
  if(day!==careerToday() && !(s instanceof Date)) return 'off';   // ночью — только по расписанию
  if(((cr.away||{})[day]||[]).indexOf(reg)>=0) return 'done';
  if(s instanceof Date && s.getTime()<ccAwayClock(day)) return 'past';
  // Идёт позже своего капа или пересекается с ним — ждёт, пока сыгран свой (потом строкой «Ночью ещё идут»).
  { const hs=ccAwayHomeStart(day); if(hs!=null && s instanceof Date && s.end>hs) return 'later'; }
  if(careerEnergy()<CC_AWAY_ENERGY) return 'tired';
  if(careerNoMate(kind)) return 'mate';
  // Кап с платформой (консоль, телефон) — и на выезде только с устройством.
  if(kind==='victory'){ const v=ccAwayEv(reg, day); if(v && !ccConsoleOk(v)) return 'dev'; }
  return '';
}
// Список регионов одного дня капа. late — поздние регионы вчерашнего вечера (жёлтый блок «Ночью ещё идут»).
/* ВИД (его «с дизайном докрутить надо»): не таблетки в карточке вечера, а свой блок под ней. Строка региона: слева регион
   и время старта, под ним пинг, дивизион там и штраф; справа «Играть» или статус. Ниже — кто идёт после своего капа. */
function ccAwayRowHTML(day, late){
  const home=ccCareerRegion(), T=L();
  const slot={}; CC_REGIONS.forEach(r=>{ slot[r]=ccAwaySlot(r, day); });
  const byTime=(a,b)=>(slot[a] ? slot[a].getTime() : 0)-(slot[b] ? slot[b].getTime() : 0);
  const after=CC_REGIONS.filter(r=>r!==home && ccAwayWhy(r, day)==='later').sort(byTime);
  const afterHTML='';   // поздние регионы теперь сами в списке, с пометкой «после твоего капа»
  // Ночью — только то, что ещё можно сыграть; днём — и закрытые с причиной.
  // Поздние (после своего капа) — тоже строкой, но кнопка серая «после твоего капа»: их время ещё не настало.
  const regs=CC_REGIONS.filter(r=>{ const w=ccAwayWhy(r, day); return r!==home && w!=='off' && !(late && (w==='past' || w==='done' || w==='later')); }).sort(byTime);
  if(!regs.length && !afterHTML) return '';
  // Время старта по часам устройства.
  const hm=d=>{ try{ return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}); }catch(e){ return ''; } };
  const head='<div class="cc-aw-h">'+(late ? '<i class="cc-aw-live"></i>' : '')+'<b>'+esc(late ? T.awLateT : T.awHT)+'</b>'+
    '<small>'+esc(T.awCost(CC_AWAY_ENERGY))+'</small></div>';
  const rows=regs.map(r=>{
    const why=ccAwayWhy(r, day), ms=ccXregMs(home, r), cup=ccAwayKind(r, day)==='cup';
    const sub=esc(T.awMs(ms))+(cup ? ' · '+esc(T.awDivD(ccAwayDiv(r))) : '')+' · <em class="cc-aw-pen">'+esc(T.awPenT(ccAwayPen(ms)))+'</em>';
    // Время региона не настало (его слово 15.11: «просто не давать играть, если время не настало») — серая кнопка, без вопросов.
    const later=why==='later', closed=!!why;
    const st=later ? T.awAfterOwn : closed ? T['aw_'+why]+(why==='tired' ? ' '+Math.floor(careerEnergy())+'/'+CC_AWAY_ENERGY : '') : T.awGo;
    return '<div class="cc-aw-r'+(closed ? ' off' : '')+'"><div class="cc-aw-n"><b>'+esc(regionName(r))+(slot[r] ? ' <span class="cc-aw-t">'+esc(hm(slot[r]))+'</span>' : '')+'</b>'+
      '<span>'+sub+'</span></div>'+
      '<button class="cc-awayb cc-aw-go" type="button"'+(closed ? ' disabled' : '')+' onclick="ccAwayPlay(\''+r+'\',\''+day+'\')">'+esc(st)+'</button></div>';
  }).join('');
  return '<div class="cc-away cc-aw'+(late ? ' cc-away-late cc-aw-late' : '')+'">'+head+rows+afterHTML+'</div>';
}
function ccAwayHTML(){
  try{ if(ccVictoryLocked()) return ''; return ccAwayRowHTML(careerToday(), false); }catch(e){ return ''; }
}
/* Сразу после своего вечера (его «после EU хочу, чтоб игралось»): на карточке итога — те же кнопки «Ночью ещё идут», нажатие
   уходит с экрана итога (show сбрасывает CAREER_RUN) и запускает выезд. */
function ccAwayNow(reg, day){ try{ show('screen-career-hub'); careerRenderHub('centre'); }catch(e){} ccAwayPlay(reg, day); }
function ccAwayAfterAppend(box){
  try{
    if(CC_AWAY || !box || ccVictoryLocked()) return;
    const d=ccAwayCarryDay(); if(!d) return;
    const h=ccAwayRowHTML(d, true); if(!h) return;
    const w=document.createElement('div'); w.className='cc-away-card'; w.innerHTML=h.split('ccAwayPlay(').join('ccAwayNow(');
    const act=box.querySelector('.stage-actions'); if(act && act.parentNode===box) box.insertBefore(w, act); else box.appendChild(w);
  }catch(e){}
}
// Поздние регионы вчерашнего своего вечера — на хабе в любой день, даже без своего события.
function ccAwayLateHTML(){
  try{ if(ccVictoryLocked()) return ''; const d=ccAwayCarryDay(); return d ? ccAwayRowHTML(d, true) : ''; }catch(e){ return ''; }
}
async function ccAwayPlay(reg, day){
  day=day||careerToday();
  if(CAREER_RUN || ccAwayWhy(reg, day)) return;
  const cr=CAREER.career, today=careerToday(), home=ccCareerRegion(), ms=ccXregMs(home, reg);
  const kind=ccAwayKind(reg, day), ev=kind==='victory' ? ccAwayEv(reg, day) : null, slot=ccAwaySlot(reg, day);
  const n0=(cr.log||[]).length, was=CC_REGION_AS;
  let paid=false;
  CC_AWAY={reg, ms, pen:ccAwayPen(ms)}; CC_REGION_AS=reg;
  // Ночной выезд (вчерашний кап) играется в свой день: вечер читает дату карьеры, потом она возвращается.
  if(day!==today) cr.day=day;
  // Кап дивизиона — дивизионом того региона (ccAwayDiv); свой возвращается после вечера.
  const homeDiv=cr.division, homeWf=cr.wf;
  if(kind==='cup') cr.division=ccAwayDiv(reg);
  // Финал недели — путёвкой того региона, в его Д1; своя путёвка (cr.wf) возвращается после вечера.
  if(kind==='final'){ cr.division=1; cr.wf=cr.regWf[reg]; }
  try{
    const next=ev ? {type:'victory', day, id:ev.id, title:ev.lan||ev.name, label:ev.lan||ev.name}
             : kind==='cup' ? {type:'cup', day, title:L().ccCupLive, label:L().ccCupLive}
             : kind==='final' ? {type:'final', day, title:L().calWeeklyFinal, label:L().calWeeklyFinal}
                  : {type:'eval', day, title:L().calPerfEval, label:L().calPerfEval};
    if(ev){
      const f0=ccPickFormat(ev);
      if(await ccEventRosterPick(ev, f0)==='find'){ ccDuoFindOpen(null, f0); return; }
    }
    // Плата — когда вечер точно начинается: «позвать людей» выше энергию не тратит.
    careerSpend(CC_AWAY_ENERGY); paid=true;
    cr.away={[day]:((cr.away||{})[day]||[]).concat(reg)};   // хранится только день этого капа
    if(slot instanceof Date) ccAwayClockSet(day, slot.end);
    careerSave();
    useLandingSet((function(){ try{ const s=careerNightSet(next); return (s && ZONE_SETS[s]) ? s : careerBrSet(); }catch(e){ return careerBrSet(); } })());
    CC_MP_NIGHT=(ev ? 'victory:'+ev.id : kind)+':'+reg;
    await careerPlayRun(next);
  } finally {
    CC_REGION_AS=was; CC_AWAY=null;
    if(day!==today) cr.day=today;
    cr.division=homeDiv;
    if(kind==='final'){ if(paid && !cr.wf && cr.regWf) delete cr.regWf[reg]; cr.wf=homeWf; if(homeWf===undefined) delete cr.wf; }
    if(paid){ (cr.log||[]).slice(n0).forEach(e=>{ e.away=reg; }); careerSave(); }
  }
}

/* A lobby of one-card teams.

   careerCupField pairs everybody, which is right for a duos cup and wrong for a
   solo one — a solo lobby is a hundred and fifty people, not seventy-five pairs.
   Division 1 seats the snapshot; below it the ladder, banded the same way. */
// open — the same flag careerCupField takes, and it means the same thing here:
// the room is the region rather than the rung the player stands on, so the
// whole roster is in it and the ladder behind them comes from every band.
/* stage — стадия соло-серии ('qual' | 'heats' | 'final' | стадии FNCS Solos).
   Финал и хиты — не случайная сотня из снимка дивизиона, а СИЛЬНЕЙШИЕ: в
   финале сидят сто лучших из тысяч, в хитах — те, кто прошёл квал. Со
   случайной сотней медиана рейтинга поля была 67 при карточке игрока 92, и
   игрок каждую игру шёл первым по урону в лобби (проба
   tools/career-surge-you-probe.js, 7 сентября 2026: на седьмой зоне свой
   чистый урон 569 при медиане комнаты 138; в реплеях финала Solo Series
   победители идут на 200–470, а p90 поля — 350–450). Финал — top-need по
   рейтингу; хиты и LCQ — из удвоенного верха, перетасованного. */
function careerSoloField(cr, mine, size, open, stage){
  // Гонка: соперники и их напарники не попадают в сотню ботами (см. careerCupField).
  /* Общая комната: занятые — и СВОИ напарники тоже. В соло состав [me], а соседи вычитают моего
     напарника как «карточку соперника» — у меня он мог выйти настоящим соло-игроком, у них нет:
     соло Victory Cup 13.06, «diff 4816 of 4900» (проба 9.09 15:11). Одно множество у всех. */
  if(typeof ccRaceOn==='function' && ccRaceOn()) mine=(mine||[]).concat(ccRaceAllCards(), (typeof careerMates==='function' ? careerMates() : []).filter(Boolean));
  if(typeof mgrSeatedTaken==='function') mine=(mine||[]).concat(mgrSeatedTaken());   // менеджер: см. careerCupField
  const rnd=careerRng(careerSeed(cr,'solo'));
  const band=ccBand(cr.division);
  const taken=new Set((mine||[]).map(hKey));
  const need=(size||CAREER_CUP_FIELD)-1;
  const players=[];
  const st=String(stage||'');
  const tight = !open && /final|heats|lcq/.test(st) ? (/final/.test(st) ? 1 : 2) : 0;
  // The same pool the duo events seat, read as people. Division 1 and the open
  // events get the snapshot; below Division 1 this yields nothing.
  let real=careerRealPlayers(taken, rnd, open ? 'all' : cr.division);
  if(tight){
    const ovrOf=x=>(x._ovr!=null ? x._ovr : (attrsFor(x)||{}).ovr)||0;
    real=real.slice().sort((a,b)=>ovrOf(b)-ovrOf(a)).slice(0, need*tight);
    if(tight>1){ for(let i=real.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=real[i]; real[i]=real[j]; real[j]=t; } }
  }
  real.slice(0, need).forEach(x=>{ taken.add(hKey(x)); players.push(x); });
  while(players.length<need){
    const o = open ? ccOpenFillOvr(rnd)
            : cr.division===1 ? ccD1FillOvr(rnd)
                              : ccBand(cr.division)+careerGauss(rnd)*CC_BAND_SD;
    players.push(careerLadderPlayer(rnd, o, taken, null, null, null, !open && (cr.division||1)>=2));
  }
  return players.map(x=>{ const t=careerTeam([x]); t.name=teamLabel([x]); return t; });
}

const CC_EVAL_R1_GAMES=8, CC_EVAL_R1_KILL=1, CC_EVAL_CUT=50;
/* The win money, as a team wins it.

   Every prize figure in this file is what Epic pays a team, because that is the
   unit Epic publishes and ccShareOf halves it where it is won. This one was
   written as $400 — which is the per-player number, $400 each and $800 to the
   duo — so it was halved a second time and a win banked $200 while the hub tile
   beside it promised $400. His report, 17 August. Stated in the same unit as
   everything else it sits next to, and the two lines the player reads say their
   own half rather than the pair's. */
const CC_EVAL_R2_GAMES=4, CC_EVAL_WIN_PTS=100, CC_EVAL_WIN_CASH=800;
function evalRound2Points(place){ return place===1 ? CC_EVAL_WIN_PTS : 0; }

// The field is drawn from Division 1 the way the division cup draws it — real
// duos out of the roster, shuffled, a different fifty every week — because the
// evaluation is a Division 1 lobby and nothing else.
async function runCareerEval(){
  const cr=CAREER.career;
  if(cr.division!==1) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('eval') : null;
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
  // The evaluation's room and its cut are this season's, like every other night.
  const field=[you, ...careerCupField(cr, drafted, ccTeams(CAREER_CUP_FIELD))];
  const evalCut=ccTeams(CC_EVAL_CUT);

  // Round 1: the ordinary ladder, a kill worth one.
  /* Точка выбирается и здесь — вместе с кубком, 25 августа. Перфоманс это
     закрытая комната своего дивизиона, а не Опен, и правило «выбирают везде,
     кроме опенов» его накрывает; раньше он попадал под старую сноску кубка
     («дроп принадлежит финалу») и падал случайно все восемь игр. */
  const kindsForDrop=['eval'];
  /* null — вопрос задаётся внутри прогона, перед каждой игрой, включая
     первую (см. opts.dropEachGame). Раньше здесь стоял отдельный вызов до
     старта: карты ещё нет, и вопрос выходил карточкой в ленте — «первой
     табличкой», которую он попросил убрать 25 августа. */
  const zones=null;
  await simulateGamesLive(field, ccEvalR1Games(), pointsForPlace, CC_EVAL_R1_KILL, 'stage', 0, null, zones,
    {lobbySize:ccEvalLobby(), stageName:L().ccEvalR1Live, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, L().ccEvalR1Live, kindsForDrop)});
  const ranked1=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place1=ranked1.indexOf(you)+1;
  const through=place1<=evalCut;

  const shell1=createStageCardShell(L().ccEvalR1Title(field.length));
  await revealStageLog(you, shell1, true);
  finalizeStageCard(shell1, place1, field.length, you.stagePts, through, false,
    through ? L().ccEvalPass(evalCut) : L().ccEvalFail(evalCut));
  await revealStandings(shell1, ranked1, you, evalCut);
  careerPrAdd(ranked1, {div:1, kind:'eval'});
  // Итоговая таблица вечера оценки — второй раунд, он же последний.
  let evalFinal=ranked1;

  let wins=0, cash=0, place2=null;
  /* Гонка: второй раунд общий, только если ВСЯ комната прошла первый — как у Victory Cup.
     Иначе прошедшие ждали бы на барьере игры 1 второго раунда приходов тех, у кого вечер
     уже закончился (годовая проба 8.09: Evaluation 4.12, двое из шести прошли, 15 минут стоя). */
  if(typeof ccRaceLock==='function' && ccRaceLock()){
    const top=ranked1.slice(0, evalCut);
    const rivalOut=ccRaceNightRoom().some(p=>!top.some(t=>t.mpTag===':'+hKey(p.card)));
    if(!through || rivalOut) ccRaceNightApart();
  }
  if(through){
    // Round 2 is the fifty who came through, in one lobby, and only a win scores.
    const r2=ranked1.slice(0, evalCut);
    ccZoneTuneRound('eval', 2);   // комната прошедших — свои единицы (CC_ZONE_EVAL_R2)
    /* lobbySize — как у всех остальных вечеров. Раунд 2 был единственным
       этапом в файле, который шёл без него, то есть по другой ветке
       simulateGamesLive: комната ровно в одно лобби, так что результат тот же,
       а вот код — свой, и его никто не проверял на живых прогонах. Скриншот
       «просто зависло» пришёлся именно на этот раунд; воспроизвести не вышло,
       но одна общая дорога вместо двух — то, что стоит сделать в любом случае. */
    const zones2=null;
    await simulateGamesLive(r2, CC_EVAL_R2_GAMES, evalRound2Points, 0, 'stage', 0, null, zones2,
      {lobbySize:ccEvalLobby(), stageName:L().ccEvalR2Live, mapReplay:true, choices:true, stopOnYourDeath:true,
       roomOnly:true,   // комната прошедших: вылетевших людей в неё не досаживать (ccRaceFieldSync)
       dropEachGame:(g,room)=>careerLandingPick(room||r2, you, L().ccEvalR2Live, kindsForDrop)});
    /* Тем же ключом, каким считается любой другой вечер: очки, победы, элимы.
       Здесь стояло только «очки, победы» — а раунд платит ТОЛЬКО за победы, то
       есть у сорока с лишним команд из пятидесяти и очков ноль, и побед ноль.
       Сортировка стабильная, поэтому вся нижняя половина таблицы оставалась в
       том порядке, в каком её посадили в лобби: его снимок от 26 августа — два
       разных вечера, и в обоих одни и те же восемь дуо на местах 43-50 подряд,
       причём команда с шестью элимами стояла ниже команды с нулём. */
    const ranked2=careerRankField(r2);
    evalFinal=ranked2;
    // Вечер платит каждому, у кого есть победы, — и таблица призовых должна это
    // видеть, как видит Weekly Final. Кошелёк (ccPayIn ниже) — отдельный счёт.
    const top5=ccEvalTop5Cash();
    if(top5) careerMoneyAdd(ranked2, p=>p<=5 ? top5 : 0);
    else careerMoneyAdd(ranked2, (_p,t)=>(t.wins||0)*ccEvalWinCash());
    place2=ranked2.indexOf(you)+1;
    wins=you.wins||0;
    cash=top5 ? (place2<=5 ? top5 : 0) : wins*ccEvalWinCash();
    const shell2=createStageCardShell(L().ccEvalR2Title(r2.length));
    await revealStageLog(you, shell2, true);
    // Победа — зелёная плашка, отсутствие победы — никакой: раунд последний,
    // вылетать из него некуда. См. finalizeStageCard.
    finalizeStageCard(shell2, place2, r2.length, you.stagePts, cash>0 ? true : null, false,
      top5 ? (cash ? L().ccEvalTop5Cash(ccShareOf(cash, you)) : L().ccRelFail(5))
           : (wins ? L().ccEvalCash(wins, ccShareOf(cash, you)) : L().ccEvalNoWin));
    // Призы в таблице — тем же правилом, что кошелёк (Notion «19.10», скрин 45: «в таблице нет» — шапка «Top 5: $200», колонки не было).
    await revealStandings(shell2, ranked2, you, 0, null, null,
      top5 ? (p=>p<=5 ? top5 : 0) : (p=>((ranked2[p-1]||{}).wins||0)*ccEvalWinCash()), null, true);
  }
  const evalByPlace=!!ccEvalTop5Cash();   // до careerAdvanceTo: правило топ-5 зависит от дня
  removeSkipButton();
  ccBoardAfter(evalFinal, you, L().calPerfEval);

  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
    // Топ-5 платит за место: без победы строка «0 побед, $» читалась как выигрыш.
    if(evalByPlace) careerNews('good', 'ccNewsEvalPlace', [place2, mine]);
    else careerNews('good', 'ccNewsEvalCash', [wins, mine]);
  } else {
    if(through) careerNews('flat', 'ccNewsEvalNoWin');
    else careerNews('flat', 'ccNewsEvalOut', [place1]);
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place2||place1, through?evalCut:field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:place2||place1,
               of:through?evalCut:field.length, pts:you.stagePts, passed:through,
               ovr:CAREER.player.ovr, games:through?ccEvalR1Games()+CC_EVAL_R2_GAMES:ccEvalR1Games(),
               wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'eval'});
  // The evening is spent, the same way the Victory Cup spends its own. Without
  // this the calendar still stood on the evaluation's day and offered it again
  // — the user played it on a loop.
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked1);
  if(!CC_AWAY){ ccAwayHomeDone(careerToday(), 'eval'); careerAdvanceTo(ccAddDays(careerToday(), 1)); }   // выезд день не берёт (ccAwayPlay)
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:L().calPerfEval, place:place2||place1, through:through,
    wins:wins, cash:cash, cut:evalCut, byPlace:evalByPlace});
}

/* Playing one.

   The same two-round shape the Performance Evaluation already uses, which is not
   a coincidence — Epic runs both the same way, and Round 2 of either is a room
   where only winning a game is worth anything.

   A solo cup seats the player alone. squadSize goes to one, the partner is not
   drafted, and the lobby is a hundred and fifty people rather than seventy-five
   pairs. It is the one event in the year where the duo does not matter, which is
   why the partner's morale is not touched by it either. */
/* Playing a stage of it.

   One stage a day, which is what the calendar says: the Opens and the Play-Ins
   each run twice with a gap, and either session gets you through — the same two
   goes at one cut the divisional cup gives below Division 1.

   Clearing a stage is recorded on the career rather than inferred later, because
   the chain has to survive a reload of the page and a month of not playing. A
   new cup wipes it: the Reload circuit does not carry anything between cups. */
/* Playing a stage of a Major.

   Every stage is one press and one day. The Last Chance is the only one with two
   rounds inside it, because Epic's is two things on one page: a qualifier that
   cuts to fifty and then a Last Chance Lobby where the winner of each of four
   matches takes a ticket and everybody else goes home. */
/* Playing a day of it. */
async function runCareerGclc(){
  const cr=CAREER.career;
  const ev=careerGclcOn(careerToday());
  if(!ev || !careerGclcCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('gc') : null;
  // Read in the season's own unit: the cuts below are written in duos. See ccTeams.
  const st = ccScaleStage(ev.final ? CC_GCLC_FINAL : CC_GCLC_ROUND[ev.round]);
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('gc', ev.id||ev.label||'');
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
  // Round 1 is sixteen thousand duos of everybody, so it is the player's own
  // band. By the Final it is the fifty best left in Europe.
  const deep = ev.final || ev.round===3;
  const lobbyCr = deep ? Object.assign({}, cr, {division:1}) : cr;
  const size = ccTeams(ev.final ? CC_GCLC_FINAL.teams : CAREER_CUP_FIELD);
  const sharp = !deep ? 0
    : (ev.final ? CC_FIELD_SHARP.globals : CC_FIELD_SHARP.heats);
  const field=[you, ...careerCupField(lobbyCr, drafted, size, null, false, sharp)];

  // Квалификации Ласт Ченса — те же комнаты в одно лобби, что и финал: точка
  // выбирается везде. Правка: «нельзя только в опенах».
  const kindsForDrop=['gclc'];
  const zones=null;
  await simulateGamesLive(field, st.games, majorPoints, st.kill, 'stage', 0, null, zones,
    {twoDay:ev.stage==='final', lobbySize:ccTeams(50), stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, ev.label, kindsForDrop)});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  const through = ev.final ? false : place<=st.cut;
  removeSkipButton();

  const shell=createStageCardShell(ev.label+' — '+field.length);
  await revealStageLog(you, shell, true);
  const cash = ev.final ? gclcPrize(place) : 0;
  /* What the Last Chance Final is for, which is not the money.

     His report, 19 August: qualified for the Globals out of the Last Chance and
     then could not play them. The seat was never the thing being reported on.
     This Final pays every place in the room — fiftieth in Europe is $400 — so
     `cash>0` was true for everybody, and the card came up green, the result card
     said "through", and the log row was stamped passed. Nothing on the screen
     ever mentioned Antwerp. Then the calendar asked ccGlobalsSeat, which wants
     the region's top three, and the day it had already called a pass was locked
     with a line explaining a rule the player had been told they cleared.

     The seat is the pass. The money is still shown — it is real, and the room is
     paid whether or not the plane is — but it is no longer what decides the
     colour of the card, and both outcomes now say what happened to the seat. */
  const seatSlots = ev.final ? ccGcSlots(GCLC_GC_SLOTS) : 0;
  const wonSeat = ev.final && place<=seatSlots;
  const cashLine = cash ? L().ccWfCash(ccNum(cash)) : L().ccWfNoCash;
  finalizeStageCard(shell, place, field.length, you.stagePts, ev.final?wonSeat:through, false,
    ev.final ? (wonSeat ? L().ccGcSeatWon(seatSlots, ccLanCity('globals'))
                        : L().ccGcSeatMissed(seatSlots)) + ' · ' + cashLine
             : through ? L().ccRelPass(st.cut) : L().ccRelFail(st.cut));
  // Приз у ника — таблица финала Ласт Ченса (платит всем, аудит 29.09: чипа не было).
  await revealStandings(shell, ranked, you, ev.final ? seatSlots : st.cut,
    null, null, ev.final ? gclcPrize : null, null, !!ev.final);
  careerPrAdd(ranked, {div:CAREER.career.division, kind:'gclc'});
  if(ev.final) ccBoardAfter(ranked, you, ev.label);

  cr.gclc=cr.gclc||{};
  if(ev.final){
    careerMoneyAdd(ranked, gclcPrize);
    if(cash){ const mine=ccShareOf(cash, you);
      ccPayIn(mine); }
    careerReachAdd(careerReachResult(place, field.length, 1, 'gc'));
    cr.gclc={q:0, round:0, through:false, done:true};
    // The seat first, because that is the news. The money line is what a Final
    // nobody came out of is worth saying.
    if(wonSeat)
      careerNews('good', 'ccNewsGcSeat', [place, ccLanCity('globals')]);
    else
      careerNews(cash?'good':'flat', cash?'ccNewsGcCash':'ccNewsGcNoCash',
                 cash?[place, ccNum(cash)]:[place, field.length]);
  } else {
    // Clearing Round 3 is the place in the Final; anything else is just progress
    // inside this qualifier, and a missed round leaves the other qualifier open.
    const inFinal = through && ev.round===3;
    cr.gclc={q:ev.q, round:through?ev.round:0, through:inFinal};
    careerNews(through?'good':'flat',
               inFinal ? 'ccNewsGcIn' : through ? 'ccNewsGcThrough' : 'ccNewsGcOut',
               [ev.label, place, field.length]);
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place,
               of:field.length, pts:you.stagePts, passed:ev.final?wonSeat:through,
               ovr:CAREER.player.ovr, games:st.games, wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'gclc',
               stage: ev.final ? 'final' : ('q'+ev.q+'r'+ev.round)});
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:ev.label, place:place, of:field.length,
    through: ev.final ? wonSeat : through, cut:st.cut||CAREER_CUP_CUT, seat:wonSeat,
    seatText: wonSeat ? L().ccRelSeatGc(ccLanCity('globals')) : null,
    money: ev.final ? cash : null});
}

async function runCareerReloadChampionship(){
  const cr=CAREER.career;
  const ev=careerRcOn(careerToday());
  if(!ev || !careerRcCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('rc') : null;
  // Paris in this season's teams. Its three stages hold their counts under names
  // ccScaleStage does not know — the field is `teams`, the group cuts twice —
  // so they convert here, and the match point stays what it is: a points total.
  const RCG=ccRcStage(CC_RC_GROUP), RCS=ccRcStage(CC_RC_SURV), RCF=ccRcStage(CC_RC_FINAL);
  const st = ev.stage==='group' ? RCG : ev.stage==='survival' ? RCS : RCF;
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('rc', ev.id||ev.label||'');
  careerLanArrive('rc', ev);
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
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  const prevSet=ACTIVE_LANDING_SET;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // Paris is the same circuit, and the same ten. See ccKillPts.
  CC_KILL_CAP=CC_RELOAD_KILL_CAP;
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);
  /* And Paris is played on the circuit's island, not on the Major's.

     The Elite Series runner switches the map a line below the same comment —
     useLandingSet(ev.set) — and this one never did, so the Championship rebuilt
     whatever set happened to be active and dropped its duos onto the Battle
     Royale map. His report, 17 August: "Reload on the BR map". The crown of the
     circuit is played on the island its last two cups are played on, which is
     the one runCareerVictory already sends its own Reload cups to. */
  useLandingSet('r4');

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
  // Forty of the best duos in the world are in Paris; the room is the top of the
  // roster whatever division the player climbed out of — and the whole roster,
  // not the career's own region. See ccAsWorld.
  const worldCr=Object.assign({}, cr, {division:1});
  // Поле этапа — те, кто на него имеет право, а не двадцатка из ростера
  // заново. См. ccRcField.
  const field=[you, ...ccRcField(cr, worldCr, drafted, ev.stage, st.teams)];

  // ЛАН целиком в одно лобби — точка выбирается на каждом этапе, не только в
  // финале. Правка: «нельзя только в опенах выбирать».
  const kindsForDrop=['rc'];
  const zones=null;
  await simulateGamesLive(field, st.games, rcPoints, CC_RC_KILL, 'stage', 0, null, zones,
    {twoDay:ev.stage==='final', lobbySize:ccTeams(20), stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     // ЛАН круга идёт по двум островам, игра через игру. См. ccRelIsland.
     mapEach:(g)=>ccRelIsland('r4', g),
     // Финал кончается на матч-поинте: 350 очков и следующая победа — чемпион, дальше не играют.
     stopWhen: ev.stage==='final' ? (function(ts){ return !!rcMatchPoint(ts, CC_RC_FINAL.line).champ; }) : null,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, ev.label, kindsForDrop)});
  removeSkipButton();

  let place, ranked, champ=false, games=st.games;
  if(ev.stage==='final'){
    const mp=rcMatchPoint(field, CC_RC_FINAL.line);
    games=mp.games;
    /* Games after match point weren't played, so cut them from the rows too. rcMatchPoint's truncated
       table was only used for sorting, so rows still had all 15 games and the board could show 453 above 454.
       Write the truncation back onto the teams (log, points, elims, wins) so standings, header, money
       and career log all read one table. */
    if(mp.champ){
      field.forEach(t=>{
        const log=(t.stageLog||[]).slice(0, mp.games);
        t.stageLog=log;
        t.stagePts=log.reduce((s,e)=>s+(e.pts||0), 0);
        t.stageElims=log.reduce((s,e)=>s+(e.elims||0), 0);
        t.wins=log.filter(e=>e.place===1).length;
      });
    }
    ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
    // Whoever crossed the line and then won is champion whatever the totals say.
    if(mp.champ){
      ranked=[mp.champ].concat(ranked.filter(t=>t!==mp.champ));
      champ=(mp.champ===you);
    }
    place=ranked.indexOf(you)+1;
  } else {
    ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
    place=ranked.indexOf(you)+1;
  }

  const through = ev.stage==='group' ? place<=RCG.direct
                : ev.stage==='survival' ? place<=RCS.cut
                : false;
  const dropped = ev.stage==='group' && !through && place<=RCG.drop;

  /* The final says what its rule is.

     Match point is the one format in this mode where the winner is not the top
     of the table, and a board that shows a champion on 524 above a duo on 658 is
     the rule working — which nobody could tell, because nothing said so. The
     player's own words, 18 August: "I have more points than the person in first
     place, but I still end up in second". The rule is on the card now. */
  const shell=createStageCardShell(ev.label+' — '+field.length+
    (ev.stage==='final' ? ' · '+L().ccRcMatchPoint(CC_RC_FINAL.line) : ''));
  await revealStageLog(you, shell, true);
  const note = ev.stage==='final'
    ? (champ ? L().ccRcChamp : L().ccRcRanked(place))
    : through ? L().ccRelPass(ev.stage==='group'?RCG.direct:RCS.cut)
    : dropped ? L().ccRcDropped
    : L().ccRelFail(ev.stage==='group'?RCG.drop:RCS.cut);
  finalizeStageCard(shell, place, field.length, you.stagePts, through||champ, false, note);
  // В финале отсечки нет: «топ-4 проходят» на скриншоте — линия
  // сурвайвала, дорисованная финалу.
  await revealStandings(shell, ranked, you,
    ev.stage==='group' ? RCG.direct : ev.stage==='survival' ? RCS.cut : 0,
    null, null, ev.stage==='final' ? rcPrize : null, null, ev.stage==='final');
  careerPrAdd(ranked, {div:CAREER.career.division, kind:'rc', stage:ev.stage});

  let cash=0;
  if(ev.stage==='final'){
    // Paris is the only place in the year that pays on the world's table rather
    // than a region's, and it pays every one of the forty.
    careerMoneyAdd(ranked, rcPrize);
    cash=rcPrize(place);
    if(cash){ const mine=ccShareOf(cash, you);
      ccPayIn(mine); }
    careerReachAdd(careerReachResult(place, 40, 1, 'rc'));
    cr.rc={got:'final', ticket:false, dropped:false, seats:null};
    careerNews(champ?'good':cash?'good':'flat',
               champ?'ccNewsRcChamp':'ccNewsRcCash',
               champ?[ccNum(cash)]:[place, ccNum(cash)]);
    /* MVP турнира. Судить по игре некого: сим пишет киллы и очки команде, а
       не человеку, — поэтому награду берёт сильнейший по карточке игрок
       команды-чемпиона. Деньги личные и не делятся: ccShareOf здесь не место. */
    const champT=ranked[0];
    const mvpCard=((champT && (champT.squad||champT._cards||[])) || []).slice()
      .sort((a,b)=>((b&&(b.rating||b._ovr))||0)-((a&&(a.rating||a._ovr))||0))[0];
    if(mvpCard){
      const mvpMine = champT===you && !!mvpCard.isYou;
      if(mvpMine) ccPayIn(CC_RC_MVP);
      careerNews(mvpMine?'good':'flat', 'ccNewsRcMvp',
                 [mvpCard.handle||mvpCard.nick||'', ccNum(CC_RC_MVP)]);
    }
    // A proper noun, the same in every language, so no string carries it.
    careerCongrats(ranked, you, 'Reload Championship');
  } else {
    /* Кто едет дальше — не только ты.

       Групповой этап раскладывает лобби натрое: топ-7 сразу в финал, 8-17 на
       сёрвайвл, остальные домой. Сёрвайвл добавляет в финал свой топ-6. Своя
       строка сюда не пишется: игрок садится в поле первым и без списка. */
    const prev=(cr.rc && cr.rc.seats) || {survival:[], final:[]};
    const seats={survival:[], final:(prev.final||[]).slice()};
    if(ev.stage==='group'){
      seats.final=[];
      ranked.forEach((t,i)=>{
        if(t===you) return;
        const p=i+1;
        if(p<=RCG.direct) seats.final.push(ccSeatKey(t));
        else if(p<=RCG.drop) seats.survival.push(ccSeatKey(t));
      });
    }else{
      ranked.forEach((t,i)=>{ if(t!==you && i+1<=RCS.cut) seats.final.push(ccSeatKey(t)); });
    }
    cr.rc={got:ev.stage, ticket: through || !!(cr.rc && cr.rc.ticket), dropped:dropped,
           seats:seats};
    careerNews(through?'good':'flat', through?'ccNewsRcThrough':dropped?'ccNewsRcDrop':'ccNewsRcOut',
               [ev.label, place], {tbl:ccStageShot(ranked, you, 1, ev.label)});
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place,
               of:field.length, pts:you.stagePts, passed:through||champ,
               ovr:CAREER.player.ovr, games:games, wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'rc', stage:ev.stage,
               won: ev.stage==='final' ? ccStageSeatRow(ranked[0]) : undefined,
               top: ev.stage==='final' ? ccStageTop(ranked, you) : undefined});
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted;
  // Put the map back where it was, the way every other runner does.
  useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:ev.label, place:place, of:field.length,
    through:through||champ, cut:RCG.direct, seat:false,
    money: ev.stage==='final' ? cash : null});
}

/* ===== The drop, when it is a final ========================================
   Finals ask where to land, on the same picker as the draft mode. Ordinary
   divisional cups don't ask; you pick when you've qualified for something.
   You choose in qualification order: those through earlier have markers down,
   those behind can drop on you. At Antwerp the order is the route (Summit, then
   Major 2, then Last Chance), since careerGlobalsField stamps gcRoute and
   byQualOrder reads it. */
function ccSoloHomeZone(you){
  if(!you || !you.isYou) return null;                  // чужой дом нам не известен — придёт с голосом
  const s=careerSpotOn('solo');
  // Сетка соло-метки — по её ключу (careerSpotGrid → careerSoloSet), не сезонная.
  return s ? careerSpotZoneOf(s, 'solo') : null;
}
/* at — место в ALL_LANDING_ZONES, то есть в ДРОБЛЁНОЙ соло-сетке (58 коробок
   на 36 крупных). Запись дома живёт в индексах крупной сетки (careerSpotGrid),
   и голый индекс значил там другую коробку — или ничего, за 36-й. Поэтому
   дом пишется центром выбранной коробки, а индекс — крупной, которая её
   накрывает; читается по центру (careerSpotZoneOf). */
function ccSoloHomeSet(at){
  const z=ALL_LANDING_ZONES[at];
  if(!z){ careerSpotSet(at, 'solo'); return; }
  const cx=z.x+z.w/2, cy=z.y+z.h/2;
  const grid=ZONE_SETS[careerSpotGrid('solo')]||[];
  let i=grid.findIndex(b=>cx>=b.x && cx<=b.x+b.w && cy>=b.y && cy<=b.y+b.h);
  if(i<0) i=Math.min(at, Math.max(0, grid.length-1));
  careerSpotClear('solo');
  careerSpotSet(i, 'solo', {cx:cx, cy:cy});
}
/* Дом любого из людей в соло-сотне: свой — из careerSpots, напарника — из его
   карточки (MP.card кладёт soloHome с центром коробки: сетка у соло дроблёная,
   и точка вернее индекса). Нужен раздаче: см. careerLandingPick, соло. */
function ccSoloHomeZoneOf(t){
  if(!t) return null;
  if(t.isYou) return ccSoloHomeZone(t);
  if(t.isMate && typeof MP!=='undefined' && MP.peer && MP.peer.soloHome)
    return careerSpotZoneOf(MP.peer.soloHome, 'solo');
  return null;
}
/* Стиль игры своей команды (2.10, Notion «02»): спокойно / обычно / кейить. Хранится в карьере
   (cr.playStyle), ставится на команду перед каждой игрой. «Кейить» — агрессия CC_KEY_SEEK и лут с
   киллов CC_KEY_LOOT (см. ccKeyBoost); «спокойно» — CC_CHILL_SEEK.
   В командной карьере и в общей комнате гонки стиль ездит по проводу (5.10: «стиль игры не во всех
   режимах… wkey и тд»): свой — в MP.card (ps) и в строке гонки (ps), и оба клиента ставят каждой
   команде людей одно и то же — среднее по её людям (ccTeamStyles). Менять можно до вечера, не внутри:
   строка ушла на старте, и смена посреди вечера развела бы клиентов. */
let CC_STYLE_TEAM=null;
function ccStyleShared(){ return (typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRaceLock==='function' && ccRaceLock()) || (typeof ccRaceLive==='function' && ccRaceLive()); }
function ccStyleLocked(){ return ccStyleShared() && typeof CAREER_RUN!=='undefined' && !!CAREER_RUN; }
function ccPlayStyle(){ const cr=CAREER && CAREER.career; return (cr && cr.playStyle) || 'norm'; }
// Свой стиль для провода: мастерство округлено — у себя считается то же число, что видит сосед.
function ccStyleWire(){ return {s:ccPlayStyle(), m:Math.round(ccKeyMastery()*100)/100}; }
/* То, что ушло соседям последним (карточка или строка гонки). Набитая рука растёт с каждой игрой
   (keyGames), а сосед знает только отправленное: в общем вечере своя команда считается по нему. */
let CC_STYLE_SENT=null;   // ставит careerRaceSend; в дуо — CC_MP_MYCARD.ps (карточка, ушедшая на старте вечера)
function ccStyleOwnSent(){
  if(typeof ccRaceLock==='function' && ccRaceLock() && CC_STYLE_SENT) return CC_STYLE_SENT;
  if(typeof ccMpOn==='function' && ccMpOn() && typeof CC_MP_MYCARD!=='undefined' && CC_MP_MYCARD && CC_MP_MYCARD.ps) return CC_MP_MYCARD.ps;
  return null;
}
// Люди команды — их стили в проводном виде; null — команда без людей (стиль не трогается).
function ccTeamStyles(t){
  if(!t) return null;
  const row=id=>(id && typeof CC_RACE_PEERS!=='undefined' && CC_RACE_PEERS[id]) || null;
  const peerPs=()=>(typeof MP!=='undefined' && MP.peer && MP.peer.ps) || {s:'norm', m:0};
  if(t.isYou){
    const ws=[ccStyleOwnSent() || ccStyleWire()];
    if(typeof ccMpOn==='function' && ccMpOn() && careerSquadSize()>1) ws.push(peerPs());
    if(typeof ccRaceLock==='function' && ccRaceLock() && typeof ccRacePairOn==='function' && ccRacePairOn()){
      const r=row(ccRacePairId()); ws.push((r && r.ps) || {s:'norm', m:0}); }
    return ws;
  }
  if(t.isRival && t.raceId){
    const r=row(t.raceId); const ws=[(r && r.ps) || {s:'norm', m:0}];
    if(r && r.pair){ const q=row(r.pair); if(q && q.pair===r.id) ws.push(q.ps || {s:'norm', m:0}); }
    return ws;
  }
  if(t.isMate && typeof ccMpOn==='function' && ccMpOn()) return [peerPs()];   // соло вдвоём: напарник — своя команда
  return null;
}
/* НАБИТАЯ РУКА: «after you troll for so many games you get high kill wins» (тот же отзыв, вторая
   половина). Каждая игра в «кейить» — в cr.keyGames; за CC_KEY_MASTER_GAMES игр лут с килла растёт
   с CC_KEY_LOOT до CC_KEY_LOOT_MASTER. Замер 2.10 (career-spread-probe.js, 600 игр, очки · победы):
     97: обычно 39.1 · 4.5% | 0.01 44.6 · 6.5% | 0.015 46.1 · 8.3%
     86: обычно 29.4 · 0.5% | 0.01 25.9 · 0.7% | 0.015 29.3 · 1.7%
     78: обычно 19.1 · 0.2% | 0.01 16.7 · 0.0% | 0.015 20.1 · 0.0%
   Набитая агрессия — прибавка сильному и ноль в среднем слабому: не подарок всем (0.02 им был). */
const CC_KEY_MASTER_GAMES=100, CC_KEY_LOOT_MASTER=0.015;
function ccKeyGames(){ const cr=CAREER && CAREER.career; return (cr && cr.keyGames) || 0; }
function ccKeyMastery(){ return Math.min(1, ccKeyGames()/CC_KEY_MASTER_GAMES); }
/* ЧЕРТЫ ИГРОКОВ (29.10, идея игрока, Notion 27.10 скрин 19: «peterbot would have w keyer because he always fights»).
   Из настоящих таблиц (tools/build-player-traits.js): доля очков с киллов против своего лобби, среднее по турнирам.
   ≥ CC_TRAIT_HI — W-key (Peterbot 0.74), ≤ CC_TRAIT_LO — играет на место (Kami 0.32). В вечере карьеры команда ботов
   с такой чертой ищет драку так же, как игрок со стилем W-key (CC_KEY_SEEK и лут с киллов CC_KEY_LOOT, без набитой
   руки), или реже, как «Спокойно» (CC_CHILL_SEEK). Черта команды — по среднему её игроков. */
// ==== CC_PLAYER_TRAIT (tools/build-player-traits.js) ====
const CC_PLAYER_TRAIT={"0 earnt flooks":0.27,"123456789123abc1":0.65,"1438u4681":0.2,"1chances99loss":0.17,"1devon_":0.19,"1st vertz":0.31,"2 hundred":0.09,"22poraobolsonaro":0.67,"27q8":0.84,"2am aqt ϟ":0.16,"2eh ap 47":0.66,"2gunzsam":0.76,"2trash1zr":0.29,"30分睡眠":0.75,"33 favs3k.":0.67,"3zizfv":0.78,"47 matt":0.33,"4ce daibou":0.66,"4d chap":0.31,"4drstorm":0.3,"4fortik":0.66,"520 zombie":0.75,"5aald":0.78,"5kz dankame44":0.31,"6767dream7676767":0.71,"7 tz":0.07,"71nً":0.91,"7f la makina":0.78,"7f skies":0.26,"7kapipi":0.33,"7med":0.71,"7mood":0.29,"7snfps":0.81,"7x kimo":0.21,"918 spyderǃ":0.2,"9627ll6ll7ll7l77":0.96,"9amis":0.74,"a1 simple":0.72,"a7mdqt":0.66,"aatareet 201":0.79,"abasadasadgrggg":0.75,"abbo.":0.66,"abdullatif1 x":0.65,"abdurrehman 28":0.35,"abodeet fvǃ":0.78,"absntz 24":0.79,"abu tarf シ":0.66,"abusivestepdad.":0.32,"access.exe":0.69,"acris moze 飛躍":0.69,"acro":0.26,"adam":0.66,"adamlbǃ":0.65,"adol":0.66,"adolfwasright67":0.3,"adzyy":0.81,"adéla v2":0.32,"afd mainy 88":0.29,"ag rhys":0.34,"aguilarsiño":0.72,"aguszk.":0.75,"agusǃ":0.32,"aiizix うつろ":0.8,"aim":0.33,"aimer grizz 24":0.7,"aimuplayer":0.28,"alahna luvr":0.69,"aleex":0.23,"alessandro":0.28,"alex":0.65,"alexcod556":0.69,"alexx freecss":0.33,"alfﱞa":0.25,"ali primex":0.7,"allex tung 67":0.23,"alliege":0.66,"altria natural":0.19,"always on height":0.3,"always top 2":0.06,"alxnsofv":0.31,"ames44":0.7,"amg reyed":0.69,"aminished":0.67,"amoris ragna 狂剣王":0.74,"amplify":0.27,"anagennisi kaua":0.3,"ancheǃ":0.18,"andinio":0.72,"andrew igl":0.27,"andyvencha":0.21,"angel precks":0.74,"angrybunch-_-":0.66,"anix":0.18,"ankido":0.81,"anon":0.72,"ansilexx":0.34,"apar":0.33,"aposentado-_-":0.22,"appo 7":0.66,"arabuncut":0.31,"arcesd":0.28,"arctqrès":0.22,"arkhram":0.32,"arm pereznewera":0.25,"arrow":0.67,"arthurbc":0.83,"artor":0.33,"ary":0.75,"arzy fvǃ":0.69,"asf lulu":0.33,"asianzing x":0.26,"asna rairu":0.7,"asta":0.76,"astro wormy":0.21,"atheerψ":0.22,"atomsぁ":0.31,"atrct 時の戦士":0.32,"attay daql época":0.69,"audioz 47":0.34,"aur maxi 19ǃ":0.23,"aur t3eny 7ǃ":0.66,"autm0":0.65,"avenger":0.32,"avery":0.24,"avlr 友":0.7,"awtǃ":0.33,"axgisz 7":0.09,"b1urantics":0.68,"ba tuyo 7":0.69,"baby sneaky1k":0.89,"badex":0.3,"baily":0.82,"balafnn":0.74,"balor":0.69,"bananaapple fvǃ":0.16,"banw1se19":0.67,"barliana":0.28,"barney rexmas":0.7,"barroso":0.7,"bathan":0.33,"batman bugha":0.32,"batonho":0.77,"battal":0.7,"bbweewee":0.7,"bear":0.66,"bedin":0.25,"beef":0.81,"bellaquita remix":0.33,"ben ネ":0.66,"beαstfn":0.31,"bg final boss":0.18,"bg palmeirense":0.66,"bgdzin.":0.31,"bhegs":0.31,"bico sujo 157":0.88,"big kr4t4y 10ǃ":0.66,"biggtaro":0.29,"bigod":0.33,"bingle":0.2,"binmansoorǃ":0.68,"bioo":0.69,"birdyn":0.17,"biylox":0.75,"bizzie":0.72,"bizzle":0.35,"blaackish":0.78,"blakeps":0.19,"blanckz":0.24,"blazerd":0.76,"blazerway 神":0.11,"blind 001":0.19,"blits":0.33,"bludgansta47":0.8,"bluff gtfo":0.34,"blumecl mi amorr":0.35,"blynks":0.34,"boardzz1x-":0.31,"bobby":0.3,"bobyelbaynas 7":0.26,"bof べった":0.24,"boji":0.68,"bola":0.25,"bologn4":0.27,"bolsa de tusi":0.78,"bonzerǃ":0.21,"botboidrakey":0.21,"bowlcut oogway":0.67,"boxか":0.73,"bpro teku 74":0.72,"bqb なかよう":0.84,"bquuu":0.78,"braaaauuuuuu":0.33,"braden":0.73,"bravo":0.27,"braxlefn":0.33,"brian locz":0.34,"broken igl":0.33,"brook":0.09,"brunao":0.32,"buja xinelaxz.":0.72,"bumboy":0.3,"burga":0.29,"buster":0.33,"buzzo":0.68,"bwr bador":0.23,"bx1st":0.74,"bykn":0.32,"bylah":0.66,"bym7md":0.66,"bysalva":0.79,"büttowski":0.69,"c0ld104":0.66,"c10yyy":0.75,"callejr 88":0.66,"capcapcap":0.67,"carbone":0.72,"carrott":0.67,"carter":0.23,"caryion":0.25,"cash kissed you.":0.68,"cashǃ":0.74,"castro 19ǃ":0.34,"cat flobber":0.74,"catman":0.29,"cauzerz":0.71,"cc enczu":0.33,"ceaqul":0.69,"ceara":0.83,"ceeq":0.14,"ceice":0.34,"celis ひつじ":0.74,"ceno":0.31,"centro":0.35,"ceronnnn":0.68,"cesar":0.67,"cesars milizéǃ":0.32,"cesc fàbregas":0.72,"cest launcherr":0.34,"cg lucxzinn 1898":0.7,"ch.ネムタイヨ 姫":0.29,"chanzes":0.31,"chaosfvǃ -_-":0.22,"chap":0.74,"charlie":0.34,"chewy ebok":0.28,"chewybagodonuts":0.74,"chicha":0.22,"chinese.chicken.":0.66,"chip 8":0.67,"chipi ts3":0.28,"chiq.":0.21,"chivirimaxsteel8":0.77,"chizi":0.7,"chocoluv":0.35,"chrollo lucilfer":0.68,"chuckxz":0.7,"chunkymonkey543":0.69,"cizy909":0.21,"claim psy":0.32,"clarityg":0.29,"clawfv 7":0.34,"clayrixx":0.67,"clement":0.34,"clemxntǃ":0.68,"clextr":0.32,"cln 7":0.65,"cloud1k mini xyz":0.3,"clouds cc":0.7,"cloutzzy.":0.11,"clover":0.65,"clovr syren":0.21,"clw":0.24,"coast toxicǃ":0.31,"code spaghyt":0.29,"cofts":0.68,"cold fhd":0.66,"coldfvǃ ǃ":0.72,"cole":0.68,"colt kanox":0.34,"coltini jenkins":0.7,"comeback fynn":0.84,"commandment":0.25,"conin4k":0.68,"connor 74":0.7,"conor mcdavid":0.12,"conslebot001":0.76,"controllergoon67":0.77,"coolpenguin48":0.28,"coolsito 嬰兒":0.33,"corleoneexz":0.71,"cortex444":0.22,"corvalan":0.76,"cosmo1893":0.73,"coutinn愛":0.34,"covrezinn":0.27,"coxon":0.81,"coyes1k":0.32,"cr crr":0.26,"cr demon破壊しました":0.75,"cr huggy ういー":0.83,"cr7 ディーケイ":0.7,"crank":0.73,"craziest 7":0.34,"crisbuca":0.19,"crompz":0.7,"crow snohxxbot":0.67,"crunchy":0.32,"crusti":0.34,"cruz":0.33,"cryed":0.69,"crzy 23ǃち":0.31,"ctm":0.66,"cubix":0.78,"culture1x":0.27,"cup ヤ":0.65,"curious":0.68,"curve":0.74,"cuvey":0.11,"cwintrr":0.77,"cyluss":0.25,"cynical":0.65,"cynical421ǃ":0.66,"cyperzz":0.68,"cyrexブカ":0.32,"d1egobtw67":0.21,"d4stroy4r 神":0.81,"d7m ӝ":0.33,"da-ita 17.2":0.69,"dabuel":0.34,"daddysgirl823":0.34,"dana引退済":0.25,"danete do gonnet":0.35,"dang0ms":0.27,"danhope 1st":0.25,"dankline":0.84,"danyul":0.27,"darkos":0.29,"darkxz":0.67,"darm":0.67,"dashyy":0.15,"dawgslayerjohn92":0.74,"deadshotfnl":0.74,"deathstroke_ufc":0.84,"deejayy 67":0.88,"deez":0.76,"deftoneslover31":0.12,"deka tyson":0.66,"dekeltryr.":0.29,"demonnn pux1to.":0.67,"demus":0.7,"denis1k3":0.24,"dennys77_":0.79,"deqx 30":0.31,"deqzyy":0.79,"detect cavera":0.32,"dev0nhendryx":0.27,"devade":0.28,"devy9x":0.33,"deyydodger":0.84,"deﬁant milizé":0.85,"dgls 212":0.32,"dihmoo":0.26,"diktator vinq ム":0.69,"dinus":0.73,"divine":0.32,"dksking.f":0.18,"dl basel":0.65,"doctor9x":0.18,"dog":0.24,"dokan2700":0.28,"dominant":0.21,"domo":0.33,"doodle 32":0.79,"dopi 3":0.19,"dorapp1":0.34,"dragons ball zﾠ":0.35,"dragonzlfk.":0.33,"dreamrock":0.66,"dreus2":0.25,"drill pig":0.31,"drillexd.":0.27,"drizzo0":0.69,"drmd the fato ϟ":0.29,"drx zest":0.28,"dt peterbot":0.66,"dummygalloǃ":0.33,"dvs ttv adzy1x":0.33,"dwavyrex13":0.68,"dylan":0.26,"dylan aim":0.25,"dylangodoy9":0.24,"dyre doue":0.16,"e teddy":0.31,"echo":0.78,"edbertenjoyer":0.3,"edg jerryyokk":0.28,"eehnow":0.35,"egoist try":0.66,"egrm":0.35,"el filerovencha7":0.65,"elg adsrr":0.72,"eli get money":0.65,"elijah ityb":0.69,"elpulgaﾠ":0.84,"emberǃ":0.7,"emoboy09178":0.2,"emxxrr":0.32,"enbrevecorono777":0.21,"enough":0.32,"enquz":0.68,"ensar":0.74,"envy4tb":0.71,"enzobuca":0.32,"enzouzz 10":0.8,"epikpnp":0.21,"epiktuxe":0.84,"epsybotbotǃ":0.69,"equalz 444":0.34,"eshouu":0.67,"eshz":0.3,"esterotipo":0.74,"etzo":0.71,"evil salvatoreǃ":0.12,"evolved":0.68,"exoph":0.77,"exotic":0.29,"ezezinn.":0.21,"f3kserǃ":0.3,"f4bled_tacotv":0.25,"f5rﾠ":0.73,"fab":0.66,"faisal 17":0.66,"falcon":0.67,"falcon oathbotǃ":0.7,"falcon peterbotǃ":0.71,"falconer":0.29,"faluve":0.65,"fares":0.19,"fashers":0.25,"fatch":0.34,"fauquex":0.7,"favs":0.34,"fawaz 0.2":0.75,"faxfox":0.33,"faĩsal":0.3,"faひろ":0.25,"fct 波乗りペンギン":0.27,"fear fusionz":0.67,"febas banzaking":0.8,"feehzin go loko":0.72,"felipr.":0.82,"felix - -":0.32,"felpsz betrayed":0.75,"ferticeǃ":0.67,"fhoodi 12":0.69,"filipmonk":0.3,"finn":0.34,"firing boyzz":0.07,"fisher":0.71,"fkleyy":0.73,"fl envyfv":0.81,"fl tofpita":0.65,"flc dewayy190xd":0.31,"flex":0.31,"flexah_":0.27,"flicks":0.26,"flickzy":0.67,"flinty":0.67,"flipped":0.29,"flo xo":0.34,"flo キ":0.67,"floow":0.78,"flopytin":0.26,"fltrtxrodukanxpx":0.29,"flxqz_35":0.81,"fly":0.68,"fly carries":0.22,"fly darkyǃ":0.67,"flyzxbotǃ":0.69,"fmonraal fvǃ":0.66,"fnajen":0.67,"fnturtlesurfer":0.29,"folnet-":0.81,"forbes":0.18,"former":0.32,"foronezx":0.28,"fost1s":0.79,"fpg nanuǃ":0.33,"fpg アイライトではありません":0.34,"fpg ローグラクア 天蛾":0.34,"fragstage5":0.2,"france":0.7,"frans4b":0.82,"fraymy":0.31,"fredbotfn":0.7,"fredoxie":0.72,"free r kelly":0.28,"freemok":0.67,"freitas1x":0.67,"frixzbananǃ":0.17,"frost":0.27,"frox.7":0.72,"frxstyy":0.21,"ftc fleakz":0.67,"ftw あらきりょうすけ":0.2,"ftw しんぴよǃǃ":0.28,"full box46":0.68,"fulltrolling":0.78,"funizera":0.68,"funkbomb":0.22,"funkyhorse73":0.27,"fusionz":0.26,"fut phzin 伊万尔":0.74,"fuwa":0.71,"fuzettin":0.69,"fuzz":0.75,"förma cloudz 10ǃ":0.89,"g ay лол":0.67,"g5rc":0.35,"gabiruga jm":0.23,"gamex":0.23,"gandhi dabdabdab":0.34,"gary":0.65,"gary rain":0.33,"gatts x":0.68,"genie2rare":0.19,"genius くさちゃんǃ":0.26,"genius ばちこり":0.31,"gents quokka":0.27,"gents-c watchǃ":0.22,"georgefentfv":0.26,"germano":0.68,"ghost":0.88,"ghosty wanǃ":0.33,"ghsty":0.69,"glimsy ツ":0.21,"glm snow":0.68,"glowz":0.34,"glubschi":0.65,"gobawfvǃ":0.29,"god did ming":0.69,"gogos-":0.24,"goku":0.73,"goku 8x":0.24,"gold":0.34,"goldenboyy yk":0.33,"goliath travis":0.3,"gooboz":0.06,"goodguynani yt":0.67,"goon":0.82,"goonbag rotto":0.69,"gordete":0.71,"gordeteaim7 yx亗ǃ":0.71,"gosu_keith":0.13,"grandpa smoke":0.7,"grovr.":0.74,"gt montyy":0.16,"gter":0.66,"gudnbre":0.65,"guikzn":0.69,"gura":0.34,"guri de cwb":0.29,"gusnus333":0.86,"gutofps":0.24,"guuh shelby.":0.82,"gwooble":0.71,"gwxǃ":0.67,"gz faity 1":0.73,"had":0.72,"hadi":0.68,"haisenic":0.72,"hajuu":0.84,"hala μadridǃ":0.21,"halfdumb":0.26,"hallow4":0.66,"hames 200":0.16,"hamuppi":0.24,"hardin bacana":0.84,"harro":0.72,"hawk":0.27,"hawk!":0.21,"haze 14ǃ":0.89,"headtap33":0.75,"heartt":0.28,"heatzy":0.19,"hellfire":0.68,"henchman":0.76,"henphix":0.17,"henry30j":0.27,"hezzaar":0.66,"hiding 26":0.34,"hiro":0.32,"hisssbackkkkk":0.31,"hjapdpadpdagdap":0.71,"hmbox":0.22,"honguito n115":0.88,"honoᶻᶻ":0.29,"hopaim":0.72,"hornet":0.3,"houndz":0.26,"houndz x":0.27,"ho黒":0.29,"hris":0.68,"hunter":0.69,"hurtyn 花":0.66,"hussy":0.23,"hycken":0.81,"hype 7ǃ":0.68,"hyper":0.68,"hyperwallet ban":0.2,"hyrax malone":0.78,"hza3fv":0.73,"hàkuna matata":0.3,"i love doopie":0.28,"i4xpro":0.29,"i4xpro ǃ":0.31,"ian kewin s2.666":0.66,"ibp kro":0.22,"icee":0.67,"iceqo":0.33,"icy":0.31,"icyecle":0.65,"ignum rirksignzz":0.29,"ignum にかとツッパニャン":0.67,"igorlorens":0.2,"ikalifa pls":0.73,"illushxn 7ǃ":0.23,"im7 511":0.65,"imeyfishy":0.67,"imu 死":0.69,"inact":0.81,"india on top 7":0.67,"indian reaze":0.31,"insano":0.22,"insight":0.28,"invest in snp500":0.08,"iny れんこん":0.68,"its davasco":0.76,"itshi":0.81,"itsshighsky":0.32,"iv7rdo ᴶʳ":0.18,"izzi":0.71,"jack ϟ":0.28,"jackydee":0.01,"jackyjerky 17":0.28,"jacqwil":0.8,"jae igbbmn":0.73,"jahter all day":0.33,"jakebuca":0.31,"jakeocuh":0.67,"japko":0.69,"jara7 911":0.87,"jarritos":0.27,"jasper":0.71,"jaus":0.74,"javix":0.25,"jawsh":0.76,"jax1wnl":0.16,"jayz":0.79,"jbya":0.34,"jdw":0.34,"jeanz":0.31,"jeffy boby":0.88,"jellyiwnl":0.73,"jerema maxi":0.25,"jermfn":0.24,"jesse":0.15,"jesse 777":0.7,"jeulzz":0.32,"jezejearimǃ":0.73,"jg9-":0.3,"jinu-":0.33,"jjtwo.":0.72,"jo general":0.26,"job":0.67,"john":0.35,"johobo.":0.34,"jokzxzxz yhyh":0.67,"jonyfv":0.28,"jordan":0.21,"joseph":0.22,"joshbot":0.3,"joshuafnt":0.22,"jottax.":0.76,"jpsk1ng":0.28,"jsick":0.67,"jucy":0.34,"julle":0.73,"justice":0.22,"juu":0.67,"jxaco281":0.31,"jοnny.":0.87,"kaan":0.67,"kadenox":0.28,"kaf":0.71,"kaidon":0.76,"kairuv2ﱞ":0.75,"kaiz_-":0.35,"kakarot":0.67,"kal el":0.77,"kalki":0.72,"kami":0.32,"karmaa":0.66,"kashfv":0.23,"kauazin 11":0.91,"keemo 24ǃ":0.76,"keendryǃ":0.18,"keepitjeev":0.71,"kein callde":0.24,"kenn":0.29,"kenrop":0.19,"kenshi":0.34,"kenyto":0.32,"kerzuh":0.66,"khamisky":0.85,"khaxxz29":0.7,"khrawn is back":0.13,"killer queen":0.77,"king josh75 ψ":0.12,"kingaling":0.68,"kingston":0.32,"kioxx.":0.73,"kipp":0.68,"kippits":0.25,"kirb1":0.68,"kirwaǃ":0.77,"kisen":0.68,"kitkat":0.77,"klinberi":0.2,"klown":0.33,"knäcke 22":0.27,"kobyǃ":0.27,"kodex":0.66,"koexee grimes":0.83,"kolqz prime":0.7,"koox":0.32,"kov kirk pork":0.17,"kpi hello":0.17,"krabbs3k.":0.25,"kraez":0.73,"kreg 逝":0.33,"krreon":0.71,"kslayahh":0.72,"kubx":0.35,"kulb":0.34,"kumo":0.71,"kuren":0.2,"kwah":0.27,"kxyin":0.71,"kynsoul":0.24,"l7n":0.76,"labubu labubu 67":0.23,"lachsaim":0.25,"laizen.":0.68,"lame":0.81,"lamine vinkyǃ":0.69,"lancers":0.67,"laptic.":0.26,"lardl":0.65,"larynocap":0.82,"lasers":0.25,"layth":0.74,"lazarekツ":0.3,"lazzybaiano":0.32,"ldijdw8a2":0.35,"le danicush":0.68,"lefteye71":0.32,"legedien":0.26,"leif ﾒ":0.35,"lekmaluco7":0.73,"lengthylizard52":0.26,"leo messi 2012.":0.67,"leon142.":0.7,"lericx":0.31,"letshe00":0.66,"lezinǃ":0.69,"lezix":0.31,"lhz1n kalani2022":0.66,"liam":0.67,"lightlx":0.75,"liimaa":0.28,"lily":0.67,"limameyツ":0.66,"lime":0.75,"link":0.08,"linkaruni":0.26,"linxz 710":0.67,"lionz":0.2,"lit buyureyli":0.09,"lit erunfnz":0.76,"lixgoty7.exe":0.76,"lla scroll":0.27,"lnd fzklolǃ":0.75,"lnd maguire":0.74,"lofeo":0.76,"lol lmao rofling":0.26,"lomooca":0.35,"loneazzazzinator":0.89,"long live moo":0.66,"lorzizs":0.34,"louise frucci":0.83,"lovefas76":0.34,"lovero nah":0.3,"loxxit":0.7,"loyal ttvabstaau":0.29,"ltbfoidslayer63":0.72,"lucas":0.2,"lucid":0.22,"luckyali":0.17,"lucxss":0.68,"lucxss き":0.73,"lugganein":0.69,"luh motër":0.68,"lukxzzbuca":0.32,"lunex 11":0.68,"lupien":0.32,"lwxfn":0.14,"lxdesman":0.23,"lxmpgoty":0.78,"lyejax":0.28,"lzk_lzk":0.28,"lûkke":0.67,"m 亗亗亗亗亗":0.16,"m2bk 7x":0.33,"m7md_is_the_king":0.7,"m7trm_10":0.86,"m7xel tekkkǃ":0.31,"maatzera":0.2,"mace":0.67,"mack":0.74,"macyfishy":0.35,"mada 寬":0.73,"maddenv":0.7,"maestrofnbr91":0.82,"magevaks":0.76,"magicwnl":0.76,"magnum shaft":0.7,"mahi":0.75,"mainly":0.68,"majorcuh":0.31,"maken":0.27,"maku":0.83,"mald1s":0.18,"malibuca":0.71,"maloxty7 fvǃ":0.82,"malufvǃ":0.34,"mancity 1111":0.65,"mancity rtxy3kǃ":0.24,"maniac 5ǃ":0.26,"marcinward":0.79,"marco":0.33,"marco smallville":0.77,"marcylise 17":0.32,"mariuscow":0.68,"marvik is back":0.13,"mase":0.76,"mask fridge":0.18,"mason":0.66,"massimo":0.27,"matez":0.34,"matrx":0.75,"mattilsynet":0.34,"matuukdwiokaoid":0.67,"maxim1nn kt":0.66,"maxo":0.29,"mazenn74":0.26,"meah 31":0.74,"meki":0.78,"mellfart":0.71,"mely":0.13,"merman":0.35,"metrq":0.33,"mev":0.06,"mevǃ":0.31,"mexe":0.28,"mezega":0.74,"mfjzzz":0.19,"mi gloria a dios":0.69,"mia toretto.":0.33,"mikan":0.34,"mikebotǃ":0.26,"miknup亗":0.68,"milks shiesty":0.66,"milo":0.27,"mimic":0.23,"mimix kurosaki":0.14,"mina":0.73,"minit":0.75,"minty":0.26,"mirkσ":0.35,"misery":0.69,"misha":0.78,"mister":0.29,"mixer 001":0.32,"miyu":0.71,"mn3t":0.66,"mns hunterr ᵔᴥᵔ":0.23,"moda":0.24,"moet るるまる 723.":0.34,"mohanad":0.3,"monarch syco":0.19,"moomooonmilk":0.31,"morix":0.7,"moufa":0.34,"mouro 1803 愛":0.34,"mozart 10":0.74,"mpz çpn a私ajsek":0.77,"mshary":0.74,"mshhhhhhhhhhhhhh":0.73,"mstraw":0.67,"mtsfvǃ":0.26,"muath 10.":0.31,"muiticuh":0.72,"musa fvǃ":0.13,"musky":0.32,"mvx":0.7,"mvx 00":0.86,"mvxy":0.68,"mxnkey.exe":0.67,"mxrcio":0.26,"n8 imavov":0.71,"nacharrio ykǃ":0.09,"naekoz":0.34,"nagawithattitude":0.33,"nah righto champ":0.65,"nahhhh pa":0.25,"nahue507.":0.12,"nahuxwq":0.71,"nani":0.34,"nanolite.":0.32,"narwhal":0.27,"nasir":0.33,"navi h4kudo81":0.33,"nawaf":0.32,"neaxfnzǃ":0.13,"neeqo":0.34,"neohgay":0.35,"neos kira":0.79,"nero":0.33,"nerve focake":0.19,"nerzlah":0.66,"nex":0.27,"nextaaasz":0.82,"nexxsfortnitepl":0.11,"neyo":0.31,"neyto":0.2,"nhoulfv ǃ":0.75,"nhoulm10":0.69,"nic":0.68,"nickzrr":0.67,"nico":0.28,"nicobuca":0.33,"nicoliva1":0.34,"nightcore 2":0.66,"nigitiii":0.32,"niivzy":0.34,"nikola 75":0.68,"nikola jokic 15":0.67,"ninja":0.28,"nixxz":0.76,"njby":0.34,"nktǃㅤ":0.28,"nmaqttles":0.29,"noah281-_-":0.3,"noam":0.14,"nolifeispainted":0.32,"non fungible ark":0.29,"noodle neegy":0.69,"norcal nugz":0.68,"noseba 7":0.21,"nosh":0.26,"not dc its hk":0.73,"now king.":0.68,"noxy":0.66,"noxy1x":0.73,"nqz 19":0.28,"nrv ethyro":0.33,"ns top goon":0.24,"nsrfv":0.7,"nt adriaht":0.27,"ntz":0.33,"nutifyy":0.3,"nvs.g":0.17,"nx1xyfvǃ":0.09,"nxfz まいにちフロッパー":0.65,"nxndotheastro":0.69,"nxtftn":0.32,"nyhrox":0.65,"nyxlr":0.29,"o m oo m o":0.84,"o5 cyrzrǃ":0.8,"ob":0.69,"obi chamtor xd":0.35,"oce t3eny":0.65,"ofdylan":0.18,"ofix 7":0.34,"ogii":0.27,"olisykkes":0.67,"one callum 10ǃ":0.26,"onyx":0.29,"onyx katevolved":0.68,"oofersfvǃ":0.71,"ooh l1nкх":0.66,"optimal":0.35,"oreoraga":0.18,"orix on the dma":0.84,"ortopeda juzio":0.12,"osama 901":0.68,"osamabot ǃǃ":0.34,"osiris":0.65,"otazy":0.28,"ova ditrxx":0.67,"overstrand":0.31,"overstun.":0.74,"overt zanzjerss":0.33,"pachka .":0.67,"pacific fledi":0.22,"paco luciano":0.29,"paltbraaa":0.32,"pandore reelish":0.19,"pandushh":0.69,"panterr cs":0.18,"panzer 190":0.79,"papialka修":0.78,"papita iwnl-":0.66,"pardal":0.88,"paris":0.74,"parpy":0.26,"parur":0.75,"pat bellingham":0.66,"paul 117":0.78,"paulinn":0.68,"payna":0.69,"pegu":0.79,"pekgl":0.76,"pentexxxxxxx31":0.16,"pentium":0.66,"peppy":0.87,"pesal.xyz":0.29,"peta":0.32,"peterbot":0.74,"phaпtom2x":0.71,"phenom":0.68,"phluxzy":0.27,"physicss":0.23,"pietriinnn":0.71,"pietrofn6":0.72,"piggy bread":0.34,"pilat .":0.3,"pingu":0.66,"pipo 7ǃ":0.12,"pirozz":0.71,"piz":0.35,"plahs!":0.68,"pligz":0.1,"ploieyǃ":0.2,"pmb gohanbot κθ":0.29,"pnkayy":0.73,"po":0.78,"polar1z.":0.33,"polobcool.":0.75,"ponder":0.3,"pongio.":0.81,"potato":0.68,"powerbeshy":0.29,"powerofhaircutǃ":0.26,"poyart":0.74,"pq 9una k9ǃ":0.78,"pradabagsaucy":0.68,"praidyy":0.24,"prax":0.7,"predage":0.27,"predep":0.31,"prest222":0.34,"prime l2r2":0.3,"prime pluto.":0.86,"primodefausto":0.75,"procode metodos":0.68,"protoon":0.8,"provethemwrong.":0.71,"proxy 19":0.28,"prs dam1key":0.32,"psalm":0.29,"psw_s2":0.16,"pth reo breo":0.29,"ptt かいばぶ だっちゃろーǃ":0.35,"ptz cucurella":0.66,"pucchiǃ":0.73,"pudnara":0.71,"puello return":0.33,"pulse qzx":0.33,"pun cam slam":0.21,"punisher":0.22,"puremon":0.66,"puroboko":0.66,"puzera":0.71,"pvskybot.":0.07,"pxschoal":0.3,"pxzdun":0.29,"pzuhs":0.33,"qasruh":0.74,"qhvst":0.69,"quahbuca 62":0.69,"quann":0.24,"quaxzywtf":0.8,"quaлa":0.73,"quick stepǃ":0.29,"quickzy jane":0.82,"quinn":0.28,"r1ze":0.23,"r4c kevpieceyou":0.69,"r916fn":0.32,"rabbit day 1":0.21,"rafagoty":0.87,"rafast":0.72,"raiku":0.29,"rain":0.66,"raitex":0.32,"raito":0.8,"raizfv7ǃ":0.29,"rakirye":0.71,"rakso":0.34,"rakyu.":0.69,"ramadanyt":0.67,"ran":0.28,"rara":0.68,"raru 7ǃ":0.65,"ratgun":0.7,"raz":0.22,"razak":0.26,"razl":0.68,"raпger":0.79,"rbd rizquez":0.68,"realpro ネ":0.69,"rebel 英雄のヒーロー 轟":0.28,"reboot in motion":0.76,"red gt3 rs 992":0.84,"red ny":0.74,"redo botえもん -ω-":0.31,"reds rizen":0.66,"redz":0.83,"reevers":0.69,"refinefnx":0.31,"reflex":0.3,"reg コンビニ弁当がお袋の味":0.73,"regan":0.29,"regmosigndaptman":0.68,"regularbrd":0.34,"reguletor":0.27,"rel":0.28,"relit ryle 19ǃ":0.79,"rellvis":0.35,"relq 52":0.74,"relʚɞiz見沙織":0.27,"remi ihmo":0.24,"rempsosik":0.28,"remsy":0.69,"retired old man":0.84,"retnuhfv":0.16,"retro":0.66,"revised":0.65,"rexo":0.3,"rexx":0.34,"reyaxiereyli 14ǃ":0.22,"reyy":0.31,"rg22 insane":0.16,"rgl れーくんぺー":0.27,"rhay ʚïɞ":0.33,"rhythm":0.29,"riam":0.7,"rich humble king":0.68,"rich or dead 7ǃ":0.1,"richhomiequinn":0.34,"rickskrrrr":0.67,"rickycuh05":0.68,"rinconk1ng":0.27,"risk":0.69,"ritual":0.74,"rivbuca wins":0.79,"river":0.68,"rizart":0.33,"rl brocc3x":0.81,"robin":0.73,"rojocasa":0.79,"ronaldo":0.29,"ronin":0.13,"roqz":0.2,"roxxane":0.79,"royale7ezw7s cpx":0.78,"rqzrim3 喰":0.68,"rreflex.":0.79,"rube stunwear":0.21,"rubytanawp":0.7,"rucien":0.74,"rupaǃ":0.78,"rura":0.75,"ruri":0.26,"rutzmk":0.28,"ruva xl2r2":0.73,"rv":0.32,"rvl majedfv":0.27,"rvx":0.65,"rxin ǃǃ":0.78,"rykurr 9":0.27,"ryo":0.22,"ryze andyz":0.77,"rοchan":0.26,"s3fn":0.75,"saad":0.77,"saankspinppaauwu":0.25,"sabavell":0.25,"saf":0.34,"safik":0.67,"sails":0.66,"saku":0.33,"salko":0.67,"salt":0.35,"samkob.":0.33,"samnerb":0.77,"sapiros":0.32,"sasssssssssssski":0.35,"savaje":0.77,"schmalibuca":0.05,"scion holds w":0.74,"scythefntt":0.2,"seal 7":0.28,"sealmatt.":0.25,"sebassj7":0.16,"sekayg0d":0.8,"semo 0.2":0.7,"senz":0.35,"seven":0.34,"sg un1x":0.23,"sg4 asahi4.27end":0.65,"sh kairiϟﾋｴｰ":0.23,"sharp2k":0.27,"shawarma cat 1":0.65,"shifttykrpz 参":0.21,"shin0biiiiiiiiii":0.32,"shmecked":0.65,"shmeeb":0.71,"shoxy":0.22,"shuzeyy":0.21,"siempreleal32":0.72,"silent 女":0.66,"silxzys":0.75,"sinooh":0.25,"sio tzu":0.23,"sixx sevennn 35m":0.67,"skailereu":0.71,"skii":0.23,"skillet rwz":0.32,"skiper ay":0.3,"skvdoosh":0.65,"skw79_":0.27,"skylar 637":0.23,"skyy":0.25,"skyy 23":0.74,"skyz":0.23,"slapiin":0.69,"slender":0.29,"slide -207":0.77,"slix":0.34,"slowlybotǃ":0.25,"slq thomas":0.77,"sm1ly.":0.31,"smile":0.66,"snacky":0.01,"snak":0.76,"snake":0.34,"snakesǃ":0.21,"snakk":0.28,"sneaky":0.67,"snipez":0.27,"snoop":0.35,"snowvaks":0.16,"snowy":0.67,"snowzy welling":0.7,"soe":0.24,"softy abreu1x.":0.73,"sofyan 001":0.72,"sohib":0.3,"soleanäǃ":0.71,"solid":0.67,"solo vitin":0.35,"solution":0.29,"somali scammer":0.22,"sommerset":0.34,"soru1kk":0.67,"soul":0.25,"sound":0.26,"sout polish 7ǃ":0.67,"spacyx":0.2,"sparebow":0.31,"sparkz":0.81,"sparx":0.35,"spayed":0.33,"speckz bää":0.71,"spectral":0.67,"speed is here .":0.73,"speedybot fvǃ":0.25,"spider-rohun":0.7,"spideyy":0.23,"spiker":0.65,"spinelessschlump":0.22,"spooky":0.14,"spookz":0.69,"spraz":0.17,"spraz.":0.25,"squeakz":0.26,"squishy":0.31,"srw uchiha":0.67,"ssjassassin9":0.3,"ssjbobbfan":0.7,"stain":0.69,"stan 1st":0.33,"status":0.74,"steelix":0.19,"stekhnada fvǃ":0.2,"stelf batman":0.73,"sticks":0.33,"stiffaroonie":0.69,"stoopid":0.27,"stormysmz":0.28,"stravoox.":0.66,"stre4mless":0.32,"stretch":0.22,"strike smiky911":0.67,"string de sang":0.68,"subforpaula4ever":0.35,"sudds":0.8,"sully":0.71,"sultan":0.72,"sunekoneri":0.66,"supekey_":0.21,"supereye 11ǃ":0.69,"superman fawaz 人":0.7,"supremooooo back":0.29,"swaf destroyer":0.68,"sxcredǃ":0.71,"sxlo":0.34,"symetrical":0.29,"syopon":0.67,"syowl ᰔᩚ":0.71,"sythic":0.35,"szumich.":0.33,"sгмaтi 4刀":0.33,"t3ckyy":0.85,"t3eny":0.68,"t6 agustach":0.31,"t6 price":0.33,"tacsn 412":0.75,"tajinmangoo":0.68,"takii":0.68,"tako":0.16,"takumaikii":0.73,"talented aimerǃ":0.73,"tame":0.23,"tankslam":0.67,"tanmanǃ":0.68,"tarik skubal":0.77,"tatto":0.25,"tautai":0.33,"tavern":0.32,"tax.":0.32,"tbd":0.22,"teeq":0.31,"teitei":0.72,"tensa1x":0.69,"tenya":0.28,"teroq":0.67,"tfue":0.28,"th3iof":0.69,"thaitanks":0.27,"the big zeen":0.21,"the goat xa":0.73,"theonejit":0.8,"theqofnfnfnfnfn":0.7,"theux blessed":0.71,"thigashanma":0.7,"thorium":0.22,"thrtysevnn":0.7,"tickrss":0.13,"tidi":0.77,"tigg":0.75,"tik taker 73":0.23,"tik zeyad 73":0.25,"tiktk kiswanii1x":0.7,"tiktok aleczx":0.31,"tiktok aththat":0.76,"tiktok meatog":0.3,"tiktok sovzy4x":0.7,"tiktok vbqtify":0.66,"tiktok xamitos2":0.66,"tiktok のばぶか":0.15,"timelessqp":0.3,"timyoshi_":0.74,"tinytawn":0.29,"tippzylf":0.84,"tisma":0.34,"tito caideron":0.35,"tizi rabinovich":0.79,"tjaoki":0.27,"tjk 44 ネ":0.31,"tjorbenyeye 10":0.77,"tm abood":0.8,"tmsoki snoopy":0.33,"toba 〆":0.35,"toball.":0.18,"tobx":0.69,"tocata":0.7,"todynseu":0.79,"toff":0.29,"tomu -_-":0.28,"tonyfv":0.7,"toochh":0.21,"tootie":0.14,"topino quittino":0.34,"torifyx":0.75,"tossy":0.82,"totot":0.69,"toxic_gringo15":0.33,"toxicreoホンモノ":0.71,"traffikd by mika":0.68,"treatmxnt":0.71,"treebracnh67":0.18,"trg メロンキャッシュ 本物":0.16,"trickviv 7":0.8,"tristan hipp":0.33,"trixipuhǃ":0.69,"triz":0.28,"trueblackjew271":0.69,"truit":0.76,"trulex":0.33,"trusio":0.28,"trx 10ǃ":0.33,"try":0.81,"trzp":0.72,"trﱞﱞuth x":0.33,"ts4fo q8":0.34,"tschinken":0.29,"tt kingsauul":0.65,"tt stinkywhalee":0.69,"ttk indiaum":0.32,"ttv cornelius74":0.28,"ttv vbqtify":0.2,"tuedrip":0.73,"tups":0.66,"turbulence":0.24,"tutukuul17":0.34,"tw loidrehx":0.19,"tw unosukezz":0.35,"tweaker sow":0.83,"twicht aimxfer":0.29,"twitch angyyw23":0.7,"twitch bgftn":0.31,"twitch encilol":0.18,"twitch evagas":0.21,"twitch icyybtw":0.73,"twitch moakts ツ":0.33,"twitch peyyyszn":0.71,"twitch weeziefn":0.09,"twitch yodrexxiz":0.65,"twitch zpxyち":0.87,"twitch.strodles":0.3,"twitter blitzfn8":0.76,"twitter fnlofn":0.68,"twitter percntfn":0.34,"twitter sambtwfn":0.34,"twitter velqorz":0.67,"twitterzynoxfnbr":0.32,"twittr boazsn":0.26,"twx":0.68,"twzzk":0.28,"txrm":0.74,"txtuba":0.19,"typical gamer":0.3,"typo神":0.73,"tyt impail":0.27,"tzd mitski ټ":0.78,"tгonzi":0.31,"uc.2 ほちゃ":0.28,"uc.dttodot":0.31,"uc.negimaru 37":0.67,"uc.yama 橘":0.25,"uc.かえん":0.67,"uc.きな粉ばちぇǃǃ":0.71,"uc.そみー":0.16,"umzyǃ":0.35,"unicyy 212ǃ":0.26,"unit":0.14,"unknown army":0.74,"unrealiana":0.76,"unsolvedrr":0.77,"unsualhino 懶惰":0.67,"up the canes":0.32,"urmomsbig":0.83,"user-b4c5241967":0.71,"useг-7ccp28g505":0.27,"v comeback":0.93,"vaefo 852":0.76,"vagera":0.22,"valen 1940":0.32,"valunark 1":0.72,"vanixx midmidmid":0.73,"vaskee 67":0.32,"vavassori":0.26,"vaynle3k":0.75,"vazen":0.8,"vdxrek":0.23,"vediits":0.76,"veeq":0.25,"veer":0.66,"vehx":0.76,"veloso 360hz":0.29,"veno":0.72,"vent.":0.2,"vepz":0.32,"vermanzx":0.7,"verza":0.32,"vibefiez":0.26,"vibez juh":0.66,"vic0":0.72,"viei.":0.69,"villak3k":0.24,"vinizin":0.67,"viper d7nz31":0.33,"virus":0.21,"virus ǃ":0.82,"vjoy":0.3,"vleccks":0.66,"vluxt":0.27,"vmp dxnkz":0.2,"vohade":0.25,"void":0.76,"voil":0.33,"vokrat gosh":0.28,"volvest7":0.32,"vort 7":0.34,"voxe":0.65,"voz":0.69,"vtx quangtang":0.76,"vvflocka":0.22,"vwarwtf.":0.27,"vyruss .":0.33,"w estevin":0.33,"w6nu":0.24,"wakxj 999":0.22,"walver.":0.66,"war saw7 yhyh ǃ":0.66,"warbs.":0.3,"warrior":0.77,"waschsalon":0.85,"washed floriixn":0.73,"washedcollegekid":0.34,"wave":0.33,"wave juu aim7":0.27,"wavy":0.33,"wcr spiderman":0.27,"weeze":0.81,"westy.-":0.25,"wgs macchan":0.25,"wh imx":0.79,"wharfers":0.23,"what i chose.":0.33,"wheels":0.28,"wickesyv2":0.26,"wicxsy":0.73,"will":0.27,"willcuzz":0.18,"wings":0.69,"winther":0.66,"wolf":0.23,"wolf fvǃ":0.65,"wonderacute-.-":0.77,"woodzy 44":0.31,"wozah":0.69,"wp me proxen":0.26,"wqlz":0.75,"wqzzi":0.68,"wreckless":0.71,"wrigleyblue":0.35,"wtj milks clone":0.68,"x6 soby ǃ":0.99,"xaizz durden 1st":0.75,"xantaresʕᵒᴥᵒʔ":0.3,"xavier":0.85,"xavz":0.22,"xaxa":0.69,"xazr":0.86,"xcinik":0.35,"xenon":0.73,"xero":0.26,"xkovak":0.26,"xnb":0.21,"xnbシ":0.31,"xplo3k":0.73,"xrb ぺろぺおｒっぺろぺろぺろ":0.16,"xtra rystix":0.18,"xtremebumblebee4":0.31,"xx never gone di":0.35,"xx-madibha-xx":0.77,"xx360kirkscopexx":0.34,"xxp11pzz342xz":0.72,"xxtuexmanxx":0.65,"xyxy":0.71,"y1407":0.28,"yaakun":0.69,"yagi":0.88,"yagla hadron":0.14,"yampî":0.29,"yassen":0.73,"yb wavy":0.65,"ybenjassj 〆":0.79,"yerp":0.71,"yo7med":0.68,"yoda 91":0.29,"yoichi atreides":0.75,"yoicyﱞﱞ":0.78,"yonatz.":0.26,"yophantomau ttv":0.15,"yorozuya styler":0.71,"yotta 泥沼":0.25,"youngspirit5":0.71,"youngzayyski":0.7,"yousef 7.":0.33,"youtube vlfrosty":0.7,"yoyo":0.2,"yuazinho 7":0.81,"yung calculator":0.28,"yusuffǃ":0.65,"yuzon returns":0.3,"yvl rxvekz 28ms":0.76,"yyedge":0.65,"yzan":0.31,"z disaster":0.67,"zaczui":0.28,"zagouの弟":0.35,"zaikokame44":0.28,"zaire":0.69,"zarb":0.29,"zarbeh":0.73,"zayan":0.34,"zayt":0.22,"zdog":0.73,"zedox":0.26,"zeif oge":0.71,"zelofvǃ":0.26,"zen kobeネ":0.83,"zen ギア2ǃ":0.32,"zeng":0.69,"zenn":0.7,"zeph":0.74,"zeroo fvǃ":0.2,"zeta nisidera":0.06,"ziffy 73":0.66,"zinqxz":0.27,"zire":0.66,"zjacxb":0.17,"zlinkrain":0.8,"zoom 44":0.35,"zoom3rx 3 6 9":0.74,"zoreh":0.2,"ztibzrǃǃ":0.26,"zuccrr":0.72,"zugorow":0.68,"zxta2k":0.69,"zynbl prurun":0.3,"zyro":0.72,"zzmech 7":0.8,"zzmech fv":0.68,"ǃblur":0.76,"ǃzoomonster":0.3,"σπαρτιάτηςǃ":0.34,"ϋdanman":0.67,"гинатеамо fvǃ":0.32,"спасскдальний792":0.33,"тeıvann":0.28,"чекзе":0.76,"الحبابي rvl":0.66,"ح hitman ɪꜱ ɢᴏᴅ":0.19,"سكيبيدي":0.69,"َnightmare":0.33,"कदचटयचवनसगजचडदतत":0.66,"ᴅᴇᴠᴇꜱᴛᴜ":0.78,"ᴡᴀᴋᴇ ᴜᴘﾠ":0.34,"ᶠᵃᵏᵉあお":0.32,"ⓐⓢשٍّⓐⓢㅤㅤㅤㅤ":0.81,"ありす":0.69,"いくぜǃ":0.77,"えいぶか":0.85,"えのきたけのこのさとうのごはんǃ":0.69,"えるy7":0.91,"おかっぱがふ子":0.21,"こいる":0.71,"しこぴよフォートナイト":0.66,"ぜのぽったー":0.34,"ちきんぬーぶ.":0.29,"とまと":0.34,"どにやん":0.73,"どぶかすぶすごりら":0.87,"なにひりん":0.67,"なめとんき":0.3,"にんまりぬりぼう":0.27,"ばぶっち":0.25,"ぱんかすzz":0.15,"びくとろ ばうす":0.3,"ぴくぴくぴくぴくぴくぴくぴく":0.23,"まぁ":0.81,"まいきーくん888":0.31,"まぐろいち ﾇﾁｬﾈﾁｮｸﾞﾁｭ":0.23,"まもるよ47":0.71,"まよいマイマイ迷":0.84,"みかん":0.72,"めいる":0.69,"らいふ":0.66,"らりむ 配信中":0.2,"れんむz":0.24,"ガッツぴぐ":0.28,"クリープだぅ":0.67,"ナンデダロウコワい":0.77,"ハムちゃんchannelだにょん":0.26,"ハードスライム":0.65,"ボンバルディロクロコディロ鰐":0.12,"リョガタ":0.68,"ㅤ turbo ㅤ":0.23,"ㅤfranceㅤ":0.29,"不组队就能获胜的三好":0.35,"八月の夜.":0.28,"匿名.297":0.33,"壁の中に巨人がいるんですよ":0.67,"宇宙に行く兄弟募集":0.34,"岡副ヴァン智江トレア":0.66,"気合い入りまくりダニエル":0.32,"浪漫派マシュマロ":0.66,"瑠星.":0.7,"百男営業":0.26,"覚醒せいた":0.77,"ꮲd7":0.66,"고민서린":0.72,"ｉｔｚｂｌｏｏｐｙ":0.66,"ﾠkyro ǃ":0.22,"ﾠﾠﾠvǃﾠﾠﾠ":0.89};
// ==== /CC_PLAYER_TRAIT ====
const CC_TRAIT_HI=0.65, CC_TRAIT_LO=0.35;
function ccPlayerTraitScore(handle){ const v=CC_PLAYER_TRAIT[String(handle||'').toLowerCase()]; return v==null ? 0.5 : v; }
function ccPlayerTrait(handle){ const v=ccPlayerTraitScore(handle); return v>=CC_TRAIT_HI ? 'key' : v<=CC_TRAIT_LO ? 'chill' : null; }
function ccTeamTrait(t){
  const sq=(t && t.squad) || []; if(!sq.length) return null;
  const v=sq.reduce((a, c)=>a+ccPlayerTraitScore(c && c.handle), 0)/sq.length;
  return v>=CC_TRAIT_HI ? 'key' : v<=CC_TRAIT_LO ? 'chill' : null;
}
// Боту — один раз на вечер; что поставил менеджер клуба (mgr: _seekMul) или стиль людей — не трогается.
function ccTraitApply(t){
  if(!t || t.isYou || t.isMate || t.isRival || t.isClub || t._traitDone) return;
  t._traitDone=1;
  if(t._seekMul!=null) return;
  const tr=ccTeamTrait(t);
  if(tr==='key'){ t._seekMul=CC_KEY_SEEK; t._keyLoot=CC_KEY_LOOT; }
  else if(tr==='chill') t._seekMul=CC_CHILL_SEEK;
}
// Ярлык черты для экрана (разведка, карточки): пусто, если черты нет.
function ccTraitTag(handle){
  const tr=ccPlayerTrait(handle); if(!tr) return '';
  return '<span class="cc-trait cc-trait-'+tr+'" title="'+esc(tr==='key' ? L().ccTraitKeyNote : L().ccTraitChillNote)+'">'+esc(tr==='key' ? L().ccTraitKey : L().ccTraitChill)+'</span>';
}
function ccApplyPlayStyle(t){
  let ws=ccTeamStyles(t); if(!ws || !ws.length) return;
  // Стиль, выбранный на эту игру (ccStyleAskGame), — для всех людей команды; набитая рука у каждого своя.
  if(CC_STYLE_IDS.indexOf(t._styleGame)>=0) ws=ws.map(w=>({s:t._styleGame, m:w.m}));
  const seek=w=>w.s==='key' ? CC_KEY_SEEK : w.s==='chill' ? CC_CHILL_SEEK : 1;
  const loot=w=>w.s==='key' ? CC_KEY_LOOT+(CC_KEY_LOOT_MASTER-CC_KEY_LOOT)*Math.min(1, Math.max(0, Number(w.m)||0)) : 0;
  // Среднее в устойчивом порядке: сумма с плавающей точкой у обоих клиентов одна.
  const mean=f=>ws.map(f).sort((a,b)=>a-b).reduce((a,b)=>a+b, 0)/ws.length;
  t._seekMul=mean(seek); t._keyLoot=mean(loot);
}
function ccKeyNote(st){
  if(st==='key') return L().ccStyleKeyNote+' · '+L().ccStyleKeyHand(Math.min(CC_KEY_MASTER_GAMES, ccKeyGames()), CC_KEY_MASTER_GAMES);
  return st==='chill' ? L().ccStyleChillNote : '';
}
function ccSetPlayStyle(st, btn){
  const cr=CAREER && CAREER.career; if(!cr || ccStyleLocked()) return;
  cr.playStyle=st; ccApplyPlayStyle(CC_STYLE_TEAM);
  try{ careerSave(); }catch(e){}
  // Соседям — сразу: напарник и соперники ставят нашей команде то же, что и мы.
  if(ccStyleShared()){ try{ if(typeof MP!=='undefined' && MP.sendCard) MP.sendCard(); }catch(e){}
                       try{ if(typeof careerRaceSend==='function') careerRaceSend(); }catch(e){} }
  const row=btn && btn.closest('.cc-style'); if(row){ row.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.st===st));
    const n=row.querySelector('.cc-style-note'); if(n) n.textContent=ccKeyNote(st); }
}
/* ВОПРОС «СТИЛЬ ИГРЫ» ПЕРЕД КАЖДОЙ ИГРОЙ, ВЕЗДЕ. 5.10: «так раньше же перед каждой игрой писало это…
   пусть перед каждой игрой везде». Переключатель ездил в вопросе высадки, а его задают не везде
   (открытые раунды Кубка мира 2019, первый раунд капов). Теперь — свой вопрос, его зовёт
   simulateGamesLive перед каждой игрой карьеры, в любом режиме.
   В командной карьере и в общей комнате гонки — через ccMpChoose, как высадка: у каждой команды людей
   свой адрес ('style'+mpTag), отвечает тот, чей вопрос (ccMpMine), ответ едет остальным, и все ставят
   команде одно и то же (t._styleGame поверх ccTeamStyles). Набитая рука считается здесь же. */
const CC_STYLE_IDS=['chill', 'norm', 'key'];
function ccStyleLabel(s){ return ({chill:L().ccStyleChill, norm:L().ccStyleNorm, key:L().ccStyleKey})[s]||''; }
function ccTeamStyleNow(t){
  if(t && t.isYou) return ccPlayStyle();
  if(t && CC_STYLE_IDS.indexOf(t._styleGame)>=0) return t._styleGame;
  const ws=ccTeamStyles(t); return (ws && ws[0] && CC_STYLE_IDS.indexOf(ws[0].s)>=0) ? ws[0].s : 'norm';
}
async function ccStyleBox(cur){
  /* Значки — модели из игры (его «эти модельки тоже», 13.11; раньше «может W букву просто»): спокойно — щит-зелье,
     обычно — автомат, W-key — дробовик с клавишей W в углу. */
  const img=(src, extra)=>'<span class="cc-style-ic"><img src="'+src+'" alt="" width="26" height="26" decoding="async">'+(extra||'')+'</span>';
  const ico={
    chill:img('items/t3-shield-potion.webp'),
    norm:img('items/itm-assault-rifle.webp'),
    key:img('items/itm-pump-shotgun.webp', '<b>W</b>')};
  const o=await ccChoiceBox(L().ccStyleT, '', CC_STYLE_IDS.map(id=>({id:id, title:ccStyleLabel(id),
    note:id==='norm' ? '' : ccKeyNote(id), def:id===cur, icon:ico[id]})),
    // На острове, как высадка и остальные выборы игры (его «почему не на карте показывает»).
    (typeof CC_RUN_MAP!=='undefined' && CC_RUN_MAP && CC_RUN_MAP.isConnected) ? CC_RUN_MAP : null, null, 'style');
  return (o && o.id) || cur;
}
async function ccStyleAskGame(teams){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const shared=ccStyleShared();
  const tagOf=t=>String(t.mpTag||'');
  const hs=teams.filter(t=>t && (t.isYou || (shared && (t.isRival || t.isMate))))
                .sort((a,b)=>tagOf(a)<tagOf(b) ? -1 : tagOf(a)>tagOf(b) ? 1 : 0);
  for(const t of hs){
    const cur=ccTeamStyleNow(t);
    const r=await ccMpChoose('style'+tagOf(t), ()=>t.isYou ? ccStyleBox(cur) : cur, ccStyleLabel);
    const s=(r && CC_STYLE_IDS.indexOf(r.v)>=0) ? r.v : cur;
    t._styleGame=s; ccApplyPlayStyle(t);
    if(t.isYou){
      CC_STYLE_TEAM=t;
      // Выбор запоминается как стиль по умолчанию (переключатель на Центре показывает его же).
      cr.playStyle=s;
      // Игра в «кейить» — в счёт набитой руки (ccKeyMastery). Сила ставится ДО счёта: эта игра идёт с тем, что было.
      if(s==='key') cr.keyGames=(cr.keyGames||0)+1;
    }
  }
}
function ccPlayStyleHTML(){
  if(ccStyleLocked()) return '';
  const st=ccPlayStyle();
  return '<span class="cc-style" onclick="event.stopPropagation()"><em>'+esc(L().ccStyleT)+'</em>'+
    [['chill',L().ccStyleChill],['norm',L().ccStyleNorm],['key',L().ccStyleKey]].map(([k,t])=>'<button type="button" data-st="'+k+'" class="'+(st===k?'on':'')+'" onclick="ccSetPlayStyle(\''+k+'\', this)">'+esc(t)+'</button>').join('')+
    '<small class="cc-style-note">'+esc(ccKeyNote(st))+'</small></span>';
}
async function careerLandingPick(field, you, title, kinds, o){
  // Вышел из карьеры посреди вечера: вопроса о высадке больше нет, раскладка остаётся прошлой (errlog 24–28.10).
  if(!CAREER || !CAREER.career) return null;
  o=o||{};
  // Стиль на игру спрашивается отдельно, перед каждой игрой (ccStyleAskGame); здесь — только поставить его.
  { if(!o.tag) CC_STYLE_TEAM=you; ccApplyPlayStyle(you); }
  /* Общая комната гонки: две команды людей, у каждой свой дроп, и порядок вопросов
     один у обоих клиентов — по адресу (mpTag), как у двоих в соло (ccSoloDrops).
     Раннер зовёт пик для своей команды без адреса; здесь он превращается в два
     адресных пика подряд. Соперник отвечает у себя, ответ приходит по проводу. */
  if(typeof ccRaceLock==='function' && ccRaceLock() && !o.tag && you && you.mpTag){
    const rivals=(field||[]).filter(t=>t.isRival && t!==you && t.mpTag);
    // Своей команды в комнате может не быть: второй раунд Victory Cup у вылетевшего
    // в первом досчитывается зрителем (см. runCareerVictory). Спрашивать тогда
    // некого, а ответы соперников всё равно надо дождаться — по адресу.
    const inRoom=(field||[]).indexOf(you)>=0;
    if(rivals.length || !inRoom){
      const hs=(inRoom ? [you] : []).concat(rivals).sort((a,b)=>String(a.mpTag)<String(b.mpTag) ? -1 : 1);
      let groups=o.pre||null;
      for(const h of hs) groups=await careerLandingPick(field, h, title, kinds, {tag:h.mpTag, pre:groups});
      return groups;
    }
    o.tag=you.mpTag;
  }
  // The grid belongs to the island the stage is played on. Every career runner
  // sets its own before it starts; this is the guard for the one case where a
  // save opens straight into a final and nothing has picked a map yet.
  // Rebuilt rather than merely filled: see the note in the runners' preamble.
  // A picker drawn off a squad-thinned grid offers the player half an island.
  useLandingSet(ACTIVE_LANDING_SET);
  // Nobody is watching a fast-forward, so the drop is made the way the rest of
  // the room makes it: everybody takes their turn in the qualification queue and
  // the best spot still worth taking. The player is in that queue rather than
  // skipped, so the seat they earned is still worth what it was worth.
  // Свою точку перемотка тоже уважает: метка стоит весь год, и вечер, который
  // никто не смотрит, играется с той же карты, что и вечер, который смотрят.
  /* В ОБЩЕЙ КОМНАТЕ ГОНКИ короткого пути нет: он сажал КАЖДОГО человека комнаты на МОЮ
     домашнюю точку (careerSpotZone — свой сейв), то есть у шести клиентов команды людей
     стояли на шести разных раскладах, и вопросы про коробку («своя»/«стычка») расходились —
     годовая проба 8.09: Evaluation 18.12, игра 3, у одного лишний own:live6 и вечер стоит.
     Голос за высадку идёт проводом, как в живой игре; в перемотке владелец отвечает сам
     («домой», если дом есть, иначе «тихо») — см. chooser ниже. */
  /* И СОЛО ВДВОЁМ В КОМАНДЕ (вопрос с адресом, you.mpTag): короткий путь сажал каждого из двоих на КОМАНДНУЮ точку
     своего сейва и раскладывал комнату заново на каждого — у двоих высадка финала Solo Reload расходилась с первой игры
     и вечер вставал на вопросах (командный год 20.10, 21.11: «drop=39/179000 vs drop=39/168784», «mid:swizzy#2 vs
     late:pixie#1»). Там высадка идёт общим путём, как в гонке: голос с адресом, в перемотке отвечает сам владелец. */
  const soloPair=!!(you && you.mpTag && typeof ccMpOn==='function' && ccMpOn());
  if(CC_FF && !(typeof ccRaceLock==='function' && ccRaceLock()) && !soloPair){
    const mine=careerSpotZone(ccNightSpot(ACTIVE_LANDING_SET));
    careerSpotFearOn(you);
    const groups=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
    careerSpotFearOff();
    if(mine){
      you.landingZone=mine; you.landingResult=null; you.landingRival=null;
      applyLandingPow(you, mine.points);
      if(!groups.has(mine)) groups.set(mine, []);
      groups.get(mine).push(you);
    } else {
      buildBotLandingAssignment([you], {into:groups});
    }
    return groups;
  }
  /* Where in the queue this career stands. A career field is built fresh per
     stage with no points to sort by, so it fell back to power and the player
     (usually the strongest) always picked first.
     Очередь читается по месту, которое привело сюда, а не по последнему вечеру:
     между кубком и Финалом недели стоит Victory Cup, и победа в кубке выбирала
     дроп тридцатой по виктори. Каждый раннер называет свои строки (kinds),
     читаем последнюю из них; дивизионный кубок пишет строку без kind, его слово 'cup'. */
  const rows=(CAREER.career.log||[]);
  // Строки с адресатом (who) — чужие не считаются: у соло в команде журнал общий.
  const myKey=you && you.mpTag ? you.mpTag.slice(1) : hKey(careerCard());
  let last=null;
  if(kinds && kinds.length){
    for(let i=rows.length-1; i>=0 && !last; i--){
      if(rows[i].who && rows[i].who!==myKey) continue;
      const k=rows[i].kind;
      if(kinds.indexOf(k)>=0 || (k==null && kinds.indexOf('cup')>=0)) last=rows[i];
    }
  }
  if(!last) last=rows.slice(-1)[0];
  const seat=last && last.place>0 ? clamp(last.place, 1, field.length) : 0;
  /* Оффспавн — тоже решение, а не только карта. Его спека: «когда идёт
     оффспавн до 1 зоны даётся выбор: упасть на свою локацию, законить
     кого-то». Дом у карьеры уже есть (careerSpots), сильнейший сосед в
     комнате известен, — значит два самых частых намерения можно назвать
     словами и не заставлять каждый раз искать нужный прямоугольник среди
     полусотни. Третьей строкой остаётся сама карта: она никуда не делась и
     нужна, когда хочется именно выбирать.

     Панель показывается только когда дом на этом острове есть: без него
     выбирать не из чего, и открывается карта, как открывалась. */
  /* Спрашивается ВСЕГДА, а не только когда дом уже стоит — правка:
     «насчёт локации, почему нет в финалах, early game выбор игроку». Раньше
     панель молчала на карьере без метки, и как раз в финалах, куда доходят
     раньше, чем успевают обжиться, выбора не было вовсе. Без дома первая
     строка — тихое место: та же мысль («сесть и собраться»), только адрес
     выбирает алгоритм, потому что своего адреса ещё нет. */
  /* Два хода, не три — правка: «пусть будет 2 варианта: первый — фотка
     твоей мапы, а второй контест, и там всю карту показывают».

     Так и правильнее: третья кнопка («выбрать на карте») делала ровно то же,
     что контест, только другими словами. Контест открывает остров целиком,
     где на коробках написаны ники: смотришь, кто где сидит, и летишь.

     Картинок на кнопках больше нет — правка, скриншотом того,
     как это выглядело на большом экране: две плитки во всю ширину и пустое
     поле под ними, «этого не должно быть», рядом снимок компактной панели —
     «пусть вот также будет». Фотография своей точки узнаётся по названию не
     хуже, а вопрос теперь везде одного размера: и на карте, и в ленте перед
     первой игрой. */
  /* Solo Series в команде — не командный турнир: своя точка у КАЖДОГО. Отзыв: «для соло каждому игроку нужно свою локацию выбрать».
     Метки команды (cr.spots) тут не годятся — они общие. У соло-игрока своя
     точка личная (cr.soloHome, по острову): ставится первым выбором на карте
     («законтестить») и дальше предлагается как «своя». Напарнику свой дом
     не виден — его голос «домой» несёт номер коробки (at). */
  const solo=!!(you && you.mpTag);
  const spot=solo ? null : careerSpotOn(ccNightSpot(ACTIVE_LANDING_SET));
  const home=solo ? ccSoloHomeZone(you) : careerSpotZone(ccNightSpot(ACTIVE_LANDING_SET));
  const aura=solo ? 0 : careerSpotAura(ACTIVE_LANDING_SET);
  /* Кто летит к тебе — ДО того, как выбирать.

     Правка: «перед турниром игрок понимал, конят ли его или
     нет, и после этого выбор — на свою или конить». Раньше на кнопке дома
     стояла только аура, то есть репутация точки вообще, а не сегодняшний
     вечер: узнать, что к тебе прилетели двое, можно было уже в воздухе.

     Комната расставляется здесь один раз и передаётся дальше в careerDropQuick
     — иначе число на кнопке было бы от одной раздачи, а высадка от другой. */
  let pre=o.pre||null;
  if(pre){
    // Комната уже разложена первым вопросом; свой игрок снимается с бот-коробки.
    pre.forEach(function(list){ const at=list.indexOf(you); if(at>=0) list.splice(at, 1); });
  } else {
    careerSpotFearOn(you);
    if(solo){
      /* В соло свою точку занимаем до раздачи, чтобы боты выбирали, зная, кто там (landingScore взвешивает контест
         по силе). Ауры у соло-точки нет (aura=0), и если игрок садится последним, сильнейший падает в толпу.
         tools/career-solo-qual-probe.js (комната 4900, топ-100, 10 игр): без этого карта 96 гибла на дропе 4/10 и проходила
         37%, 78-я 0%; с точкой до раздачи 96 без смертей на дропе, медиана 5-е, проход 87%, 78-я 75%.
         Сажаются все люди с известным домом в порядке меток (напарник из карточки, ccSoloHomeZoneOf), у двоих комната
         одна. Свой игрок потом снимается, его посадит ответ (домой / тихо / контест). */
      pre=new Map();
      const seated=[];
      // В гонке никого не досаживаем заранее: чей дом известен, у каждого клиента своё (см. careerSpotFearOn).
      /* И в команде вдвоём (23.10, прогон 2022: DreamHack Winter 20.11 и 27.11, игра 2 — Pixie на 56 у себя и на 9 у
         напарника, бот teeq садился на её точку). Дом напарника должен был ехать в MP.peer.soloHome, но его никто
         не пишет: в игре 1 дома ещё нет у обоих, а после первого выбора он есть только у хозяина. */
      ((typeof ccRaceLock==='function' && ccRaceLock()) || (typeof ccMpOn==='function' && ccMpOn()) ? [] : field.filter(t=>t.isYou||t.isMate))
           .sort((a,b)=>String(a.mpTag||'')<String(b.mpTag||'') ? -1 : 1)
           .forEach(h=>{
             const hz=ccSoloHomeZoneOf(h); if(!hz) return;
             h.landingZone=hz; h.landingResult=null; h.landingRival=null;
             if(!pre.has(hz)) pre.set(hz, []);
             pre.get(hz).push(h); seated.push(h);
           });
      buildBotLandingAssignment(field.filter(t=>t!==you && seated.indexOf(t)<0), {into:pre});
      pre.forEach(function(list){ const at=list.indexOf(you); if(at>=0) list.splice(at, 1); });
    } else {
      pre=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
    }
    careerSpotFearOff();
  }
  // Метки книги бросков вокруг каждого шага высадки: скриншот
  // (плей-ин) разошёлся между «dv» и «drop» без чужих обращений — теперь
  // видно, на каком именно шаге.
  ccMpMark('pre'+(o.pre ? '!' : ''));
  // Кто уже объявил свою точку — та же комната, тот же расклад, без лишних
  // бросков. См. ccDropCalls.
  const calls=ccDropCalls(pre, you, title);
  // Карта высадок комнаты: перед первой игрой этапа — карточкой в ленте вечера, и кнопкой в окне выбора.
  CC_DROP_ROOM={d:ccDropRoomData(pre, you, home), title:title||''};
  // Перед первой игрой этапа вопрос высадки встаёт ПОВЕРХ экрана вместе с картой комнаты (его слово 19.11: «показать
  // поверх экрана и подтвердить точку, чтоб не скролить ниже»). Дальше — маленькое окошко на карте, как было.
  /* Перед первой игрой этапа — всегда поверх экрана, и когда карта боя уже открыта: на финале недели она стоит с
     «Игра 1 из 6» (его скрин 19.11), и окно с картой высадок не появлялось — вопрос уходил маленьким окошком. */
  const dmFirst=!((you && you.stageLog)||[]).length;
  const rivals=home ? (pre.get(home)||[]).length : 0;
  /* Где стоит вопрос — на карте, если карта уже идёт.

     Правка: «сделай так же, как в mid гейме и late: маленькое
     окошко, и потом перебрасывает, если хочешь конить, и там кликаешь». Лут и
     высокая земля спрашиваются панелью на острове, а высадка — карточкой в
     ленте с двумя картинками во всю ширину; перед второй и каждой следующей
     игрой это значит уехать взглядом с карты, на которой идёт вечер.

     Поэтому: карта есть (вторая игра и дальше) — маленькое окошко на ней, без
     картинок, ровно как у середины игры. Карты нет (первый вопрос вечера,
     он задаётся до старта прогона) — прежняя карточка с фотографией своей
     точки и миниатюрой острова. Ходы и их последствия одни и те же. */
  const onMap=(CC_RUN_MAP && CC_RUN_MAP.isConnected) ? CC_RUN_MAP : null;
  /* Решение принимает один, комнату раскладывают оба.

     По проводу уходит ОТВЕТ ЧЕЛОВЕКА — «домой», «тихо» или «на такую-то
     коробку», — а не разложенная комната: комната у обоих уже одна и та же,
     она посчитана из одного сида (pre выше). Отправь мы Map команд, второй
     клиент получил бы чужие объекты вместо своих и разошёлся бы на первой же
     ссылке.

     Коробка называется своим МЕСТОМ в ALL_LANDING_ZONES: собственного номера
     у зоны нет (человеку показывается i+1, см. landingZoneSuffix), а сетка у
     обоих одна — тот же остров, тот же размер лобби. */
  const pics=home ? ccDropSideHTML(home, ACTIVE_LANDING_SET) : null;
  const vote=await ccMpChoose('drop'+(o.tag||''), async function(){
    // Перемотка в общей комнате: ответ без окна — домой, если дом есть, иначе тихо.
    if(CC_FF) return home ? {id:'home', at:ALL_LANDING_ZONES.indexOf(home)} : {id:'quiet', at:-1};
    const dmOv=(dmFirst && !skipAnimation && !careerSimOn()) ? ccDropOverlay(CC_DROP_ROOM.d, title) : null;
    const p=await ccChoiceBox(L().ccDropTitle,
      // Чужие объявления — прямо в подсказке: решение принимается здесь.
      L().ccDropHint+(calls ? ' · '+L().ccDropCalls+' '+calls : '')+(dmOv ? '' : ' <button class="cc-dm-open" onclick="event.stopPropagation();ccDropRoomOpen()">'+esc(L().ccDropMap)+'</button>'),
      /* Картинки — ВНУТРИ кнопок, отзыв: «внутри квадратика
         типа картинки эти». У «своей локации» — квадратик своей точки, у
         «законтестить» — остров целиком с рамкой на ней. Маленькие, слева от
         названия: плитки во всю ширину он снял 25 августа. */
      [ home ? {id:'home', title:L().ccDropHome, note:L().ccDropHomeNote(aura, rivals),
                icon:(pics ? pics.left : CC_CHOICE_ICON.home), icoCls:(pics ? 'pic' : '')}
             : {id:'quiet', title:L().ccDropQuiet, note:L().ccDropQuietNote, icon:CC_CHOICE_ICON.quiet},
        {id:'contest', title:L().ccDropContest, note:L().ccDropContestNote,
         icon:(pics ? pics.right : CC_CHOICE_ICON.contest), icoCls:(pics ? 'pic pic-wide' : '')}], dmOv ? dmOv.host : onMap, null, 'drop');
    if(dmOv) dmOv.el.remove();
    if(p.id!=='contest') return {id:p.id, at:(p.id==='home' && home) ? ALL_LANDING_ZONES.indexOf(home) : -1};
    /* Та же комната, что и на кнопке. pre посчитан выше — им и показывается
       остров, иначе «к тебе летят двое» и карта были бы двумя разными
       бросками одного и того же вечера. */
    await showFinalsLandingPicker(field, you, title, seat, pre);
    // Пикер уже поставил метку на you — её место в сетке и есть решение.
    const at=ALL_LANDING_ZONES.indexOf(you.landingZone);
    if(solo && you.isYou && at>=0) ccSoloHomeSet(at);   // выбранная коробка становится своей точкой
    return {id:'contest', at:at};
  }, function(v){
    if(!v) return '';
    if(v.id==='contest') return L().ccDropContest;
    return v.id==='home' ? L().ccDropHome : L().ccDropQuiet;
  },
  /* Вопрос о высадке задаётся перед КАЖДОЙ игрой, и к этому моменту таблица
     уже содержит всё, что случилось раньше. Лучшего места для сверки нет:
     номер игры берётся из журнала своей команды. */
  ((you.stageLog||[]).length+1)+'|'+ccTableHash(field)+'|'+CC_MP_ROLLS);
  const said=vote.v;
  ccMpMark('dv:'+String(said.id)+(said.at!=null ? '@'+said.at : ''));
  // Свой дом в соло приезжает номером коробки — и у напарника, и у себя.
  /* Дом — ТОЛЬКО по номеру коробки из голоса, у владельца тоже: свой объект дома мог быть
     клеткой крупной сетки, которой нет в ALL_LANDING_ZONES (indexOf → -1), и тогда владелец
     садился домой, а соседи ставили его «тихо» — сила команды на коробку расходилась на
     единицу (годовая проба 9.09: play-in 23.01, игра 8, live1+sky:116 vs 117). */
  const homeZ=(solo && said.id==='home') ? (said.at>=0 ? ALL_LANDING_ZONES[said.at] : null) : home;
  if(said.id!=='contest'){
    const q=await careerDropQuick(field, you, said.id, homeZ, pre);
    ccMpMark('dq');
    return q;
  }
  /* Коробку нажимали ОБА, а сядет команда в одну.

     Пикер каждого уже поставил свою метку: pickInitialZone пишет landingZone,
     зовёт applyLandingPow и толкает команду в свою группу комнаты. Победил
     один голос — значит комнату надо привести к общему виду, и делается это
     ОДНИМ И ТЕМ ЖЕ кодом с обеих сторон: своя метка снимается отовсюду и
     ставится заново по месту в сетке. Ветки «а я ли выбирал» здесь нет
     нарочно — она и была бы тем местом, где двое разъезжаются.

     applyLandingPow это переживает: он сам снимает прошлую прибавку, прежде
     чем положить новую. А одиночная карьера проходит здесь же и приходит к
     тому же — её собственная метка снимается и ставится обратно. */
  /* Комнату перестраивает ОТВЕТ, а не тот, кто его дал.

     Пикер открывает один из двоих, и вместе с показом он перестраивал состав
     — выбрасывал тёзок и ставил тебя первым. У напарника этого не
     происходило, и дальше они играли разные вечера. Теперь перестройка
     зовётся с обеих сторон, ровно на том ответе, на котором она случается. */
  ccLandingNormalize(field, you);
  ccMpMark('nz');
  const z=(said.at>=0) ? ALL_LANDING_ZONES[said.at] : null;
  // Места в сетке нет — трогать нечего, метка пикера остаётся как была.
  if(!z) return pre;
  pre.forEach(function(list){
    const at=list.indexOf(you);
    if(at>=0) list.splice(at, 1);
  });
  you.landingZone=z; you.landingResult=null; you.landingRival=null;
  applyLandingPow(you, z.points);
  if(!pre.has(z)) pre.set(z, []);
  pre.get(z).push(you);
  // И дом на острове — тоже по ответу, у обоих.
  ccLandingSpot(z);
  return pre;
}
/* Высадка без карты: домой или в чужую коробку.

   Комната расставляется тем же алгоритмом, что и всегда, — сначала боты, потом
   мы садимся поверх. «Законтестить» ищет самую сильную занятую коробку: это и
   есть смысл контеста — не «к кому-нибудь», а к тем, кого надо выбить, чтобы
   вечер стал твоим. */
async function careerDropQuick(field, you, how, home, pre){
  /* Раздача приходит готовой, когда её уже посчитали для вопроса: число «к
     тебе летят двое» на кнопке и та комната, в которую садишься, обязаны быть
     одним и тем же броском. Без неё — считаем сами, как считали. */
  let zoneGroups=pre;
  if(!zoneGroups){
    careerSpotFearOn(you);
    zoneGroups=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
    careerSpotFearOff();
  }
  let zone=home;
  if(how==='contest') zone=await careerContestPick(zoneGroups) || home;
  /* Тихое место — самая ненаселённая коробка, а среди равных самая богатая.

     Не «первая свободная»: в дивизионной комнате полсотни команд на три
     десятка коробок, свободных не остаётся вовсе, и правило «ищи пустую»
     молча возвращало бы занятую. «Тихо» — это про число соседей, и оно
     считается всегда, сколько бы народу ни было на острове. */
  if(how==='quiet' || !zone){
    let best=null, bestBusy=Infinity, bestPts=-Infinity;
    ALL_LANDING_ZONES.forEach(z=>{
      const busy=(zoneGroups.get(z)||[]).length;
      if(busy<bestBusy || (busy===bestBusy && z.points>bestPts)){
        bestBusy=busy; bestPts=z.points; best=z;
      }
    });
    zone=best||ALL_LANDING_ZONES[0];
  }
  you.landingZone=zone; you.landingResult=null; you.landingRival=null;
  applyLandingPow(you, zone.points);
  if(!zoneGroups.has(zone)) zoneGroups.set(zone, []);
  zoneGroups.get(zone).push(you);
  return zoneGroups;
}
/* К кому лететь — выбирает игрок, по никам.

   Правка: «законтестим летим, куда хочешь — смотришь на ники и летишь».
   Контест это не «к сильнейшим вообще», а к конкретным людям: в комнате сидят
   Focus, Malibuca, Scroll, и лететь на них — разные вечера. Поэтому вместо
   автоматического выбора показывается короткий список занятых коробок с их
   составами; сортировка по силе, потому что верх списка — это те, ради кого
   контест вообще затевают.

   Список короткий нарочно: сорок девять чужих коробок — это уже карта, а карта
   есть отдельным ходом для тех, кому нужна именно она. */
const CC_CONTEST_SHOW=4;
function careerContestPick(zoneGroups){
  const spots=[];
  zoneGroups.forEach((group, z)=>{
    if(!group || !group.length) return;
    spots.push({zone:z, group:group,
                pow:group.reduce((m,t)=>Math.max(m, t.pow||0), 0)});
  });
  if(!spots.length) return Promise.resolve(null);
  spots.sort((a,b)=>b.pow-a.pow);
  const top=spots.slice(0, CC_CONTEST_SHOW);
  const names=g=>g.map(t=>String(t.name||'').replace(/<[^>]*>/g,'').trim())
                  .join(' · ').slice(0, 90);
  return ccChoiceBox(L().ccContestTitle, L().ccContestHint,
    top.map(s=>({id:'z', zone:s.zone,
                 title:names(s.group),
                 note:L().ccContestNote(Math.round(s.pow), s.zone.points)})), null, null, 'drop')
    .then(pick=>pick && pick.zone);
}

/* Who is in the room at a LAN. A LAN is where the other six regions show up, all real duos off real
   leaderboards, same tables the draft mode uses for Antwerp:
   the Summit  each region's Major 1 Grand Finals, top N by SUMMIT_SLOTS (EU 20,
   NAC 13, BR 5, NAW/ASIA/ME/OCE 3 each), SUMMIT_SCQ_SLOTS for Second Chance.
   Antwerp     GC_SUMMIT_DUOS (15 from the Summit), GC_MAJOR2_DUOS (25 from Major 2).
   Europe's seats are the duos the career actually played against (as in
   buildSummitField). Foreign duos go through careerTeam so they keep standing-pair
   synergy; otherwise every non-EU seat would lose 5 power. */
// A real duo's cards, at the ratings the roster holds for them. gcFindCard is
// the draft mode's lookup and it takes the strongest card a handle has, which
// for a LAN qualifier is their Grand Finals card.
// Null when either player is already in the room. The check is on the resolved
// cards as well as on the names that were asked for: Liquipedia and Tracker
// write four of these people differently and GC_HANDLE_ALIAS bridges them, so
// two different spellings can land on one card and seat somebody twice.
/* Third chair at a LAN in a trio season. LAN seats are real duos (GC_SUMMIT_DUOS, GC_MAJOR2_DUOS,
   gcRegionFinals per region), so without this the player plays 3v2.
   Same rule as careerCupField: the recorded pair stays whole and a third comes from the back of the region's
   queue, read bottom up, so a future core isn't used as filler. What the queue can't cover comes from the ladder.
   */
let CC_LAN_THIRD_POOL={};
function ccLanPool(reg){
  const key=String(reg||'EU');
  if(CC_LAN_THIRD_POOL[key]) return CC_LAN_THIRD_POOL[key];
  const out=[];
  // Major 2's leaderboard first because it is the more recent month, then Major
  // 1's for the regions whose Major 2 list is short. Reversed: the bottom of a
  // qualifier is who is left once the seats are taken.
  ['m2','m1'].forEach(set=>gcRegionFinals(set, key)
    .forEach(e=>(e.duo||[]).forEach(h=>out.push(h))));
  out.reverse();
  CC_LAN_THIRD_POOL[key]=out;
  return out;
}
/* Третьим на ЛАН не может быть тот, у кого есть своя пара. Иначе комната брала третьих с доски региона по силе,
   а сильнейшие там как раз в парах: Scroll & Sky не приезжали целиком, Scroll стоял третьим у Malibuca & vic0, Sky
   у Shxrk & t3eny (tools/career-lan-duos-probe.js).
   Доска для третьего читается без тех, кто в живой паре сцены (careerPools().duos, тот же список, что у кубков и
   Мейджоров). Половинки распавшихся пар идут третьими, как раньше. */
function ccLanPaired(){
  try{
    const s=new Set();
    (careerPools().duos||[]).forEach(d=>(d.cards||[]).forEach(c=>{
      if(c && c.handle) s.add(_gcNorm(c.handle));
    }));
    return s;
  }catch(e){ return new Set(); }
}
function ccLanThird(reg, seated, ovr){
  const pool=ccLanPool(reg);
  const paired=ccLanPaired();
  const want=(ovr==null?CC_LAN_OVR:ovr);
  /* Третьего на ЛАН берём ближайшего по рейтингу к средней пары, а не первого свободного по доске региона
     (порядок доски с силой не связан, чемпионам доставались ноунеймы). ЛАН собирается своим кодом, мимо ccPickThird
     и CC_TRIO_BAND. Без этого средний разрыв -15.6 и 84% троек за полосой (tools/trio-third-gap-probe.js).
     Разрыв 0: выходим сразу. */
  /* Сравниваются по силе только те, у кого карточка ЕСТЬ.

     Не по следам бага, а чтобы его не завести: gcFindCard, не найдя ник в пуле
     ЛАНа, выдумывает карточку с тем рейтингом, который ей передали запасным. А
     передаём мы сюда среднюю пары — значит у любого неизвестного ника разрыв
     выходил бы ровно ноль, он побеждал бы мгновенно и выходил на break раньше
     всех настоящих. Третьим вставал бы первый ник без карточки, проштампованный
     силой пары.

     На нынешнем поле ЛАНа таких нет — замер до и после этой строки совпал до
     десятой, — но правило дешёвое, а ловушка настоящая. Ник без карточки в
     перебор по силе не входит; за него отвечает выдуманный третий ниже, у
     которого рейтинг назван честно. */
  const idx=gcCardIndex(ccNowYear());
  const known=h=>{
    const k=_gcNorm(h);
    return !!(idx[k] || idx[_gcNorm(GC_HANDLE_ALIAS[k]||'')]);
  };
  let best=null, bestGap=Infinity;
  for(let i=0;i<pool.length;i++){
    const h=pool[i];
    if(seated.has(_gcNorm(h)) || paired.has(_gcNorm(h)) || !known(h)) continue;
    const c=gcFindCard(h, reg, want, ccNowYear());
    if(!c || seated.has(_gcNorm(c.handle)) || paired.has(_gcNorm(c.handle))) continue;
    const gap=Math.abs(ccCardOvr(c)-want);
    if(gap<bestGap){ bestGap=gap; best={h:h, c:c}; if(gap===0) break; }
  }
  if(best){
    seated.add(_gcNorm(best.h)); seated.add(_gcNorm(best.c.handle));
    return best.c;
  }
  // Nobody left on that region's boards. A made-up name is better than a duo in
  // a trio lobby, and it is what a cup field falls back to as well.
  const rnd=careerRng(careerSeed(CAREER.career, 'lan3:'+String(reg||'EU')));
  const taken=new Set(Array.from(seated));
  const c=careerLadderPlayer(rnd, want, taken, null, null, ccTrioGenTop(want));
  seated.add(_gcNorm(c.handle));
  return c;
}
/* Третий на ЛАНе тот же, с кем пара играет весь сезон.
   Кубки помнят состав в cr.trios, а Саммит, Глобалы и Париж звали ccLanThird, который каждый раз брал ближайшего по силе. По tools/career-trio-drift-probe.js: кубки 0-2% смен, ЛАН 9 из 9 с другим третьим.
   Внутри сезона состав стоит, разводит тройки только межсезонье (careerTriosCarry).
   Поэтому ЛАН сначала смотрит память, и только если её нет (или человек уже в другой команде комнаты) выбирает по силе и записывает выбор. */
function ccLanTrioThird(cards, reg, room, avg){
  const cr=CAREER && CAREER.career;
  // Память — про ПАРУ. Ключ тот же, что у careerCupField: ники, строчными,
  // по алфавиту через плюс.
  const memo=(cr && cr.trios && cards.length===2) ? cr.trios : null;
  const key=memo ? cards.map(c=>hKey(c)).sort().join('+') : null;
  if(memo){
    const want=memo[key];
    if(want && !room.has(_gcNorm(want))){
      // Тройка ездит вместе: если её третьего нет на доске этого региона,
      // карточку ему всё равно найдут — он приехал с ними.
      const c=gcFindCard(want, reg, avg, ccNowYear());
      if(c && !room.has(_gcNorm(c.handle))){
        room.add(_gcNorm(want)); room.add(_gcNorm(c.handle));
        return c;
      }
    }
  }
  /* Не сел — но состав от этого не меняется.

     На ЛАНе комната собрана из дуо-досок региона, и запомненный третий вполне
     может сидеть в ней СВОЕЙ парой: дважды одного человека в зал не посадишь.
     Тогда его место на этот вечер занимает ближайший по силе — но память об
     этом не переписывается, иначе один такой вечер уводил бы тройку и во всех
     кубках после него. Записываем только тогда, когда помнить было нечего. */
  const c=ccLanThird(reg, room, avg);
  if(c && memo && c.handle && !memo[key]) memo[key]=hKey(c);
  return c;
}
/* ПАРА НА ЛАНЕ — ТА, ЧТО НА СЦЕНЕ КАРЬЕРЫ, А НЕ ИЗ НАСТОЯЩЕГО СПИСКА.

   Notion 12.10: «в дуо свизи квалится с ванякеком на глобалы, а играет их всё равно с пикси… чтобы они
   реально сплитались». Места ЛАНа без записи сыгранного этапа садятся настоящими списками (GC_SUMMIT_DUOS,
   доски m1/m2, Форт-Уэрт): SwizzY & Pixie, хотя сцена карьеры (careerPools) свела SwizzY с Vanyak3kk.
   Теперь строка списка сверяется со сценой: если у первого есть пара на сцене и это не второй — едет он со
   своей парой; иначе так же по второму. Никого на сцене нет — строка как была. */
function ccLanSceneDuo(duo){
  if(!Array.isArray(duo) || duo.length!==2 || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return duo;
  let duos=[];
  try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return duo; }
  const mateOf=h=>{
    const k=hKey(h);
    for(let i=0;i<duos.length;i++){
      const cs=(duos[i].cards||[]).filter(Boolean);
      if(cs.length===2 && cs.some(c=>hKey(c)===k)) return cs.find(c=>hKey(c)!==k) || null;
    }
    return null;
  };
  const a=mateOf(duo[0]);
  if(a && hKey(a)===hKey(duo[1])) return duo;
  if(a && a.handle) return [duo[0], a.handle];
  const b=mateOf(duo[1]);
  if(b && b.handle && hKey(b)!==hKey(duo[0])) return [b.handle, duo[1]];
  return duo;
}
function ccLanTeam(duo, region, fallbackOvr, seated){
  duo=ccLanSceneDuo(duo);
  // Карьера играет свой год — и на ЛАНе тоже. См. gcCardIndex.
  const cards=duo.map(h=>gcFindCard(h, region, fallbackOvr, ccNowYear()));
  if(seated){
    const keys=duo.map(_gcNorm).concat(cards.map(c=>_gcNorm(c.handle)));
    if(keys.some(k=>seated.has(k))) return null;
    keys.forEach(k=>seated.add(k));
  }
  /* And in a trio season, the seats the season has.

     The region is the one the seat came through where the caller knows it; the
     Summit's fifteen are a list of all seven regions at once, so the card's own
     region answers for them. */
  const per=careerSquadSize();
  if(per>cards.length){
    // Тот же рынок, что у кубков: ЛАН может оказаться первой трио-комнатой
    // года. См. ccTrioMarket.
    if(typeof ccTrioMarket==='function') ccTrioMarket(null);
    const room=seated || new Set(cards.map(c=>_gcNorm(c.handle)));
    const reg=region || (cards[0] && cards[0].region) || 'EU';
    const avg=Math.round(cards.reduce((s,c)=>s+attrsFor(c).ovr,0)/cards.length);
    while(cards.length<per){
      // Через ccLanTrioThird — состав пары помнит сама карьера.
      const x=ccLanTrioThird(cards, reg, room, avg);
      if(!x) break;
      cards.push(x);
    }
  }
  const t=careerTeam(cards);
  t.name=teamLabel(cards);
  t.lanRegion=region;
  /* Регионы на ЛАНе не равны, а нормализация делала их равными — и даже
     наоборот. Рейтинг считается внутри региона («after the region is
     normalised»), так что верхушка НАК приезжала в Антверпен с европейскими
     числами: замер career-lan-region-probe.js — средняя сила НАК-состава
     101.8 против 99.8 у ЕС, 47% титулов при 28% мест, жалоба игрока «дуо
     с америки всё выигрывают». Его ориентир, 22 августа: «последние ланы
     выигрывали еу, они сильнее но не намного». Минус полтора — по той же
     пробе ЕС берёт около двух третей титулов, НАК около трети и стоит вторым,
     а их лучшие дуо остаются в верхушке списка победителей. Остальные регионы
     и так везут 70-87 силы и титулов не берут — их не трогаем. */
  const lanHome=region || (cards[0] && cards[0].region) || 'EU';
  /* И поправка считается НА КАРТОЧКУ, а не на команду: перекос в −1.5 меряли
     на дуо, а нормализация рейтинга внутри региона едет с каждым человеком —
     в тройке таких карточек три, и перекос растёт вместе с составом. Отсюда
     множитель per/2: у дуо всё как было, у трио −2.25. Замер того же дня
     (tools/trio-region-probe.js, зал Глобалов в трио-год): титулы 87/113 в
     пользу НАК до этой строки. */
  t.pow += (CC_LAN_REGION_EDGE[lanHome]||0)*(per/2);
  return t;
}
const CC_LAN_REGION_EDGE={NAC:-1.5};
// The top N duos of a leaderboard that are not already seated somewhere, built.
// In finishing order rather than drawn: who qualified is a fact, not a roll.
function ccLanSeats(entries, count, region, seated, ovr){
  const out=[];
  (entries||[]).forEach(e=>{
    if(out.length>=count) return;
    const duo=(e.duo||[]).slice(0, 2);
    if(duo.length<2) return;
    // Регион строки, когда список знает его сам (GC_SUMMIT_DUOS — все семь регионов разом).
    const t=ccLanTeam(duo, e.reg||region, ovr==null?CC_LAN_OVR:ovr, seated);
    if(t) out.push(t);
  });
  return out;
}
/* Регион пары по её карточкам — для списка, в котором семь регионов вперемешку. Без него
   ccLanTeam звал третьего с ЕВРОПЕЙСКОЙ доски (ccLanPool(null) — 'EU') к любой паре мира:
   Peterbot & Pollo ездили на Глобалы с европейцем. Тестер 21.09: «слишком много во втором
   сезоне европейцев переезжает на америку». */
function gcDuoRegion(duo){
  const cnt={};
  (duo||[]).forEach(h=>{ const c=gcFindCard(h, null, 0, ccNowYear()); const r=c && c.region; if(r) cnt[r]=(cnt[r]||0)+1; });
  const best=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  return best||'EU';
}
function ccLanRowsReg(list){ return (list||[]).map(d=>({duo:d, reg:gcDuoRegion(d)})); }
/* ЧУЖОЙ РЕГИОН В ТРИО-ГОД — СВОЕЙ СЦЕНОЙ, А НЕ СПИСКОМ 2026-ГО.

   Трио-год держит один снимок на весь сезон (ccSnapshotNow), тройки чужих регионов живут в
   cr.trios и в пулах ccAsRegion — их и показывает лента чужих регионов. ЛАН же сажал чужие
   регионы статическими списками дуо 2026-го (GC_MAJOR2_DUOS, доски m1/m2): пары, которые
   рынок сезона развёл (careerTrioRaids), на ЛАНе снова сидели вместе, их третьи ехали к
   другим, тёзки с чужих досок садились чужими картами. Замер (tools/trio-season2-lan-probe.js):
   7 команд из 32 на Глобалах из людей разных регионов, у 5 пар из 13 третий не тот, что на
   Саммите. Теперь чужой регион в трио-год садится своей комнатой — той же, что строит
   careerCupField под ccAsRegion (пул региона, память троек, подбор по силе), — как свой
   регион садится через ccGcOwnSeats. Дуо-год и годы 2024/2025 не тронуты: там списки
   настоящие. Просим с запасом: верх региона по большей части уже сидит в зале. Возвращает
   null там, где правило не действует, — вызывающий тогда идёт старой дорогой. */
function ccLanAwaySeats(reg, n, drafted, seated, tag){
  if(!(n>0)) return [];
  if(careerSquadSize()!==3 || ccCalYear()<2026 || ccNowYear()<2026) return null;
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const lanCr=Object.assign({}, cr, {division:1});
  const build=()=>careerCupField(lanCr, drafted||[], n+24, String(tag||'lan')+'|'+reg, false, CC_FIELD_SHARP.lan);
  let room=null;
  try{ room=(reg===ccCareerRegion()) ? build() : ccAsRegion(reg, build); }catch(e){ room=null; }
  if(!room) return null;
  // Занятыми помечаются только те, кто сел: помеченный, но не севший, пропал бы из зала.
  const out=[];
  for(const t of room){
    if(out.length>=n) break;
    const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
    if(keys.some(k=>seated.has(k))) continue;
    keys.forEach(k=>seated.add(k));
    t.summitRegion=reg;
    out.push(t);
  }
  return out;
}
/* ВСЕ ТУРНИРЫ — ОТ СИМУЛЯЦИИ, А НЕ ОТ НАСТОЯЩИХ ДАННЫХ (его слово 12.10).

   Чужие регионы садились на ЛАНы 2026-го настоящими досками (gcRegionFinals m1/m2, GC_MAJOR2_DUOS,
   GC_SUMMIT_DUOS, сорок пар Парижа RC_TEAMS_2026): кто прошёл в жизни, тот и ехал, как бы ни сложился
   год карьеры. Теперь у каждого региона свой квал, сыгранный симуляцией: комната региона — его сцена
   (careerCupField под ccAsRegion: пары карьеры, разводы, трансферы), десять игр движком, порядок финиша.
   ev — какой это квал: 'm1' (Мейджор 1 → Саммит), 'm2' (Мейджор 2 → Глобалы и добор), 'lcq' (Ласт
   Ченс), 'rc' (отбор в Париж). Итог пишется в сейв на сезон (cr.lanSim): Саммит идёт три дня, Глобалы
   два — зал не должен пересобираться между днями, а в гонке у всех один и тот же (ccWorldRun). */
const CC_LAN_SIM_KEEP=30, CC_LAN_SIM_GAMES=10;
/* В сейве строка — «ник~рейтинг» на человека (полная запись ccStageSeatRow весила 166 КБ за сезон). */
function ccLanSimPack(row){ return row.map(x=>String(x.h)+'~'+(x.o||0)).join('|'); }
function ccLanSimUnpack(str, reg){
  return String(str||'').split('|').filter(Boolean).map(p=>{ const i=p.lastIndexOf('~');
    return {h:i>0 ? p.slice(0, i) : p, o:i>0 ? (+p.slice(i+1)||0) : 0, r:reg}; });
}
function ccLanSimRanked(reg, ev, drafted){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const size=careerSquadSize();
  const box=cr.lanSim=(cr.lanSim && cr.lanSim.season===cr.season && cr.lanSim.size===size) ? cr.lanSim : {season:cr.season, size:size};
  const key=ev+'|'+reg;
  if(Array.isArray(box[key])) return box[key].map(p=>ccLanSimUnpack(p, reg));
  const lanCr=Object.assign({}, cr, {division:1});
  const n=ccTeams(50);
  const salt='lansim|'+cr.season+'|'+key;
  let rows=[];
  CC_BOT_EDGE_HOLD++;
  try{ ccWorldRun(salt, ()=>{
    const build=()=>careerCupField(lanCr, drafted||[], n, salt, false, CC_FIELD_SHARP.lan);
    const room=((reg===ccCareerRegion()) ? build() : ccAsRegion(reg, build)).filter(t=>t && !t.isYou && !t._stub);
    if(room.length<2) return;
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWithEventSize(size, ()=>simulateGames(room, CC_LAN_SIM_GAMES, majorPoints, CC_M24_KILL));
    rows=room.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0))
      .slice(0, CC_LAN_SIM_KEEP).map(t=>ccStageSeatRow(t).map(x=>Object.assign(x, {r:reg})));
  }); } finally { CC_BOT_EDGE_HOLD--; }
  box[key]=rows.map(ccLanSimPack);
  return rows;
}
// Верх симулированного квала региона, мимо тех, кто уже сидит в зале. null — правило не действует (не карьера).
function ccLanSimSeats(reg, n, drafted, seated, ev){
  if(!(n>0)) return [];
  let rows=null;
  try{ rows=ccLanSimRanked(reg, ev, drafted); }catch(e){ console.error('ccLanSimRanked', reg, ev, e); rows=null; }
  if(!rows || !rows.length) return null;
  const per=careerSquadSize(), out=[];
  for(const row of rows){
    if(out.length>=n) break;
    const keys=row.map(x=>_gcNorm(x.h));
    if(keys.some(k=>seated.has(k))) continue;
    const t=ccAsRegion(reg, ()=>ccStageTeamFrom(row));
    if(!t) continue;
    keys.forEach(k=>seated.add(k));
    t.summitRegion=reg; t.lanRegion=reg;
    t.pow+=(CC_LAN_REGION_EDGE[reg]||0)*(per/2);   // та же поправка региона, что у ccLanTeam
    out.push(t);
  }
  return out;
}
// Саммит, сыгранный симуляцией: финальный зал careerSummitField без игрока, восемь игр, порядок финиша.
function ccLanSummitSim(drafted){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const size=careerSquadSize();
  const box=cr.lanSim=(cr.lanSim && cr.lanSim.season===cr.season && cr.lanSim.size===size) ? cr.lanSim : {season:cr.season, size:size};
  // Строка Саммита — «регион#ник~рейтинг|…»: зал мировой, регион у каждой строки свой.
  if(Array.isArray(box['summit|all'])) return box['summit|all'].map(p=>{
    const s=String(p), i=s.indexOf('#'); return ccLanSimUnpack(s.slice(i+1), s.slice(0, i)||ccCareerRegion()); });
  let rows=[];
  CC_BOT_EDGE_HOLD++;
  try{
    ccWorldRun('lansim|'+cr.season+'|summit', ()=>{
      const stub={name:'-', pow:0, squad:[], _stub:true, isYou:true, stagePts:0};
      const room=(careerSummitField('final', stub, drafted||[])||[]).filter(t=>t && !t._stub && !t.isYou);
      if(room.length<2) return;
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWithEventSize(size, ()=>simulateGames(room, 8, majorPoints, CC_M24_KILL));
      rows=room.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0))
        .slice(0, CC_LAN_SIM_KEEP).map(t=>ccStageSeatRow(t).map(x=>Object.assign(x, {r:x.r||t.summitRegion||t.lanRegion||ccCareerRegion()})));
    });
  }catch(e){ console.error('ccLanSummitSim', e); return null; }
  finally { CC_BOT_EDGE_HOLD--; }
  if(!rows.length) return null;
  box['summit|all']=rows.map(r=>((r[0] && r[0].r) || ccCareerRegion())+'#'+ccLanSimPack(r));
  return rows;
}
// A written-down list of duos, read the same way a leaderboard is.
function ccLanRows(list){ return (list||[]).map(d=>({duo:d})); }
// Nobody plays a LAN they are not in. A room built from allocations can leave
// the player out of a stage they earned — the Grand Finals seats the Upper's
// top 25 and the career's own seed is not what decided that — so the seat is
// held open rather than hoped for.
function ccSeatYou(room, you){
  if(room.indexOf(you)<0) room[room.length-1]=you;
  return room;
}
const CC_LAN_OVR=88;

/* The Summit, Düsseldorf. Format is Epic's (see SUMMIT_SLOTS):
   Upper Bracket  50 Major 1 qualifiers, 6 games, top 25 to Grand Finals.
   Lower Bracket  25 dropped + 25 from Second Chance, 6 games, a Victory Royale
   advances instantly, the rest of 25 on points.
   Grand Finals   50 duos, 8 games. Отсечка нижней 25, не 19: иначе финал добирал
   6 мест посевом из вылетевших. См. careerSummitField, tools/check-career-summit-carry.js.
   EU: top 20 of Major 1 Grand Finals to Upper, next 8 to Second Chance, read off
   history. Purse PRIZE_TABLES.SUMMIT ($250,000 1st of $1,296,000), hence reach x9. */
const CC_SUMMIT_STAGE={
  scqplay:{games:10, kill:4, field:150, cut:15, pts:majorPoints},   // = CC_SCQ_PLAY (ниже), для карточки дня
  scq:{games:6, kill:4, field:50, cut:0, pts:majorPoints},          // = CC_SCQ_FINAL
  upper:{games:6, kill:3, field:50, cut:25, pts:majorPoints},
  lower:{games:6, kill:3, field:50, cut:25, pts:majorPoints},
  final:{games:8, kill:4, field:50, cut:0,  pts:majorPoints}
};
const CC_SUMMIT_DAY={Upper:'upper', Lower:'lower', Final:'final', SCQPlay:'scqplay', SCQ:'scq'};
/* Второй шанс. Открытый день у Epic — весь дивизион 1 без места на Саммите (в Европе около пятисот дуо), и в финал
   выходят пятьдесят. Карьера играет его своей комнатой на сто пятьдесят, поэтому черта та же доля: пятнадцать.
   Сколько игр в открытый день, Epic не пишет — десять, как в открытых раундах FNCS (оценка режима). Финал — как у
   Epic: пятьдесят дуо, шесть игр, счёт финалов (65 за победу, 4 за элим). */
const CC_SCQ_PLAY={games:10, kill:4, field:150, cut:15, pts:majorPoints};
const CC_SCQ_FINAL={games:6, kill:4, field:50, cut:0, pts:majorPoints};
// Призы финала по регионам — Liquipedia, FNCS 2026 Major 1 Summit: Second Chance Qualifier (EU/NAC $23 000, прочие $10 200).
const CC_SCQ_PRIZE_BIG=[1000,1000,1000,1000,1000,1000,1000,1000,1000,1000, 800,800,800,800,800, 600,600,600,600,600,
  400,400,400,400,400,400,400,400,400,400, 200,200,200,200,200,200,200,200,200,200];
const CC_SCQ_PRIZE_SMALL=[1000,1000,1000,800, 400,400,400,400,400,400, 200,200,200,200,200,200,200,200,200,200,
  100,100,100,100,100,100,100,100,100,100, 100,100,100,100,100,100,100,100,100,100];
function scqPrize(place){
  const reg=ccCareerRegion();
  const t=(reg==='EU' || reg==='NAC') ? CC_SCQ_PRIZE_BIG : CC_SCQ_PRIZE_SMALL;
  return t[place-1]||0;
}
// Запись Второго шанса этого сезона: {season, play:'pass'|'out', pass:true|false, place, rows}.
function ccScqOf(){
  const cr=CAREER && CAREER.career; const r=cr && cr.scq;
  return (r && r.season===cr.season) ? r : null;
}
const CC_SUMMIT_ORDER=['upper','lower','final'];
const CC_SUMMIT_EU_MAIN=20, CC_SUMMIT_EU_SCQ=28;
/* Сколько мест на Саммит даёт СВОЙ регион.

   Epic пишет квоты по регионам (SUMMIT_SLOTS / SUMMIT_SCQ_SLOTS): Европе
   двадцать в основную сетку и восемь во Второй шанс, Океании три и два. До
   26 августа карьера считала эти двадцать и восемь всем подряд — и в Океании
   на Саммит проходило четвёртое место, которого там не бывает.

   Возвращает и границу мест: main — до какого места дают основную сетку,
   scq — до какого Второй шанс. */
function ccSummitSlots(){
  const reg=ccCareerRegion();
  const main=SUMMIT_SLOTS[reg]!=null ? SUMMIT_SLOTS[reg] : CC_SUMMIT_EU_MAIN;
  const scq =SUMMIT_SCQ_SLOTS[reg]!=null ? SUMMIT_SCQ_SLOTS[reg]
            : (CC_SUMMIT_EU_SCQ-CC_SUMMIT_EU_MAIN);
  return {main:main, scq:scq, upTo:main+scq};
}
function careerSummitOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='summit');
  if(!e) return null;
  const m=String(e.id||'').match(/^Summit_(Upper|Lower|Final|SCQPlay|SCQ)$/);
  return m ? {stage:CC_SUMMIT_DAY[m[1]], id:e.id, label:e.label} : null;
}
// Where Major 1 left you: the placing in its European Grand Finals is the whole
// entry list. Read off the log, so a career that skipped the Major has nothing
// to show and stays home, which is what happens.
/* Что даёт финал этого Мейджора — одной строкой на его карточку.

   Числа не выдуманы: Мейджор 1 отправляет на Саммит топ-20 европейского
   гранд-финала и до 28-го во Второй шанс (CC_SUMMIT_EU_MAIN/SCQ, у Epic это
   места в финале на пятьдесят дуо), Мейджор 2 — по региональной квоте
   MAJOR2_GC_SLOTS. Обе цифры проходят через ccTeams, потому что трио-сезон
   играет финал на тридцать три команды, а не на пятьдесят, и доля региона
   должна ехать вместе с ним. */
function ccMajorSeatNote(ev){
  if(!ev || ev.stage!=='final') return '';
  if(ev.y24) return L().ccMajSeatGc24(ccGc24Seats(ev.n));
  if(ev.y23) return L().ccMajSeatGc23(ccGc23Seats('m'+ev.n));
  if(ev.y22) return L().ccMajSeatInv22(ccInv22Quota());
  if(ev.y21) return ev.n===5 ? '' : L().ccMajSeatGr21;
  if(ev.yx) return '';
  /* 2025: финал Мейджора везёт в Лион по квоте региона (GC2025_M*_SEATS, как ccGlobalsSeat); FNCS Showdown
     мест на ЛАН не давал. Раньше сюда шли строки 2026-го — Саммит и его квоты (аудит 29.09). */
  if(typeof ccIs2025==='function' && ccIs2025()){
    if(ccMajorIsShowdown(ev.n)) return '';
    return L().ccMajSeatGc25(ccGcSlots(({1:GC2025_M1_SEATS, 2:GC2025_M2_SEATS, 3:GC2025_M3_SEATS})[ev.n]||GC2025_M3_SEATS));
  }
  if(ev.n===1) return L().ccMajSeatSummit(ccTeams(CC_SUMMIT_EU_MAIN), ccTeams(CC_SUMMIT_EU_SCQ));
  if(ev.n===2) return L().ccMajSeatGc(ccGcSlots(MAJOR2_GC_SLOTS));
  return L().ccMajSeatNone;
}
function ccSummitSeat(){
  const cr=CAREER.career;
  // Саммит есть только в календаре 2026-го: в прошлых годах финал Мейджора (World Cup,
  // FNCS сезона) места на ЛАН не даёт — иначе пара «держала ЛАН», которого нет.
  if(ccCalYear()<2026) return null;
  /* Этого года, а не любого.

     cr.log копится через сезоны, а место на Саммит выдаётся за финал Мейджора 1
     этого года. Без фильтра сюда попадала прошлогодняя строка — и карьера,
     пропустившая Мейджор в этом сезоне, ехала в Дюссельдорф за прошлый. Строки
     носят season с самого начала, нужен один filter. Та же правка в
     ccGlobalsSeat, и она же — вторая половина того, что чинит careerNewSeason:
     турнир принадлежит своему году с обеих сторон, и по состоянию, и по
     журналу. */
  const row=(cr.log||[]).filter(r=>r.season===cr.season).reverse()
    .find(r=>r.kind==='major' && r.stage==='final');
  if(!row || !row.place) return null;
  // Epic's twenty and twenty-eight are places in a fifty-duo Grand Final. The
  // Major a trio season plays is thirty-three teams wide, so the two lines move
  // with it — otherwise the top twenty of thirty-three walked into Düsseldorf,
  // which is a third of the region rather than Epic's share of it. See ccTeams.
  // И границы — своего региона, а не всегда европейские. См. ccSummitSlots.
  const q=ccSummitSlots();
  if(row.place<=ccTeams(q.main)) return 'main';
  return ccSummitScqSeat(row);
}
/* Нижняя сетка — только через Второй шанс (его играют, а не получают за 21–28-е место в финале Мейджора). Сейв,
   прошедший 29 апреля до появления турнира, сидит по-старому: места финала до границы Второго шанса. */
function ccSummitScqSeat(row){
  const r=ccScqOf();
  if(r) return r.pass ? 'scq' : null;
  if(String(careerToday())>'2026-04-29' && row && row.place && row.place<=ccTeams(ccSummitSlots().upTo)) return 'scq';
  return null;
}
// Без места в основной сетке: финал Мейджора 1 не дал «main» (или его не было вовсе).
function ccSummitMainSeat(){
  const cr=CAREER.career;
  const row=(cr.log||[]).filter(r=>r.season===cr.season).reverse().find(r=>r.kind==='major' && r.stage==='final');
  return !!(row && row.place && row.place<=ccTeams(ccSummitSlots().main));
}
function careerSummitCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, s=cr.summit||{};
  // Второй шанс: дивизион 1 без места через Мейджор; финал — прошедшим открытый день.
  if(ev.stage==='scqplay' || ev.stage==='scq'){
    if(ccCalYear()!==2026 || cr.division!==1 || ccSummitMainSeat()) return false;
    if((cr.gaveUp||[]).indexOf('lan')>=0) return false;
    const r=ccScqOf();
    if(ev.stage==='scqplay') return !r;
    return !!(r && r.play==='pass' && r.pass==null);
  }
  if(s.got && CC_SUMMIT_ORDER.indexOf(s.got)>=CC_SUMMIT_ORDER.indexOf(ev.stage)) return false;
  // And the same for a LAN seat handed down the standings.
  const seat=((cr.gaveUp||[]).indexOf('lan')>=0) ? null : ccSummitSeat();
  if(ev.stage==='upper') return seat==='main';
  // The Lower Bracket is the Second Chance seats plus whoever dropped out of
  // the Upper: both are here for the same reason, one day later.
  if(ev.stage==='lower') return seat==='scq' || (s.got==='upper' && !s.through);
  if(ev.stage==='final') return !!s.ticket;
  return false;
}
/* The seventy-five duos in Düsseldorf, and which fifty are in tonight's room.

   Europe's twenty-eight are the career's own Division 1 — the region whose
   Major 1 it played — and the other six regions' forty-seven are the real top
   of their own Major 1 Grand Finals, by Epic's published allocation.

   The three rooms follow from that. The Upper Bracket is the fifty direct
   qualifiers. The Lower is the twenty-five from the Second Chance plus the
   twenty-five who dropped out of the Upper, and since the whole Upper is not
   simulated, the seeding stands in for who dropped: the bottom half of the
   direct fifty. The Grand Finals is the Upper's top twenty-five and the
   twenty-five who came through the Lower, by the same reading. */
function careerSummitField(stage, you, drafted){
  const cr=CAREER.career;
  const lanCr=Object.assign({}, cr, {division:1});
  const seated=new Set();
  drafted.forEach(c=>seated.add(_gcNorm(c.handle)));
  const main=[], scq=[];
  /* Every allocation here is Epic's, and Epic's are written in duos: fifty in
     the bracket, Europe's top twenty into the Upper and the next eight into the
     Second Chance. A trio season seats the same people in fewer teams, so the
     numbers convert on the way through rather than being written twice. See
     ccTeams; the room went on being fifty in a trio year until his report of
     20 August. */
  const stField=ccTeams(CC_SUMMIT_STAGE.upper.field);
  /* Своя квота — квота СВОЕГО региона, а не европейская.

     Жалоба игрока: «if you qual summit in major 1 oce there is
     like 15 oce teams and 0 eu teams in all of summit». Так и было: комната,
     которую карьера строит из своего пула, садилась в европейские двадцать и
     восемь, а Европа не получала мест вообще. Замер до правки: у карьеры из
     Океании 45 карточек OCE и одна EU, у американской — 69 NAC и ни одной EU.
     Для европейской карьеры это выглядело правильно, потому и дожило.

     Теперь так: свои места занимают те, против кого карьера играла весь сезон
     (это и есть её регион), а все остальные регионы — включая Европу —
     приезжают со своих досок ниже. Сторож — tools/check-career-summit-regions.js. */
  const mine=ccCareerRegion();
  const myMainN=ccTeams(ccSummitSlots().main), myScqN=ccTeams(ccSummitSlots().scq);
  const own=careerCupField(lanCr, drafted, myMainN+myScqN, 'summit', false, CC_FIELD_SHARP.lan);
  own.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle))));
  const mySeat=ccSummitSeat();
  const ownMain=own.slice(0, Math.max(0, myMainN-(mySeat==='main'?1:0)));
  let ownScq =own.slice(ownMain.length, myMainN+myScqN-(mySeat==='scq'?1:0));
  /* Сыгранный Второй шанс сажает тех, кто его прошёл (запись финала), а не следующих по силе. */
  { const r=ccScqOf(); if(r && Array.isArray(r.rows) && r.rows.length){
      const mainKeys=new Set(); drafted.forEach(c=>c && mainKeys.add(_gcNorm(c.handle)));
      ownMain.forEach(t=>(t.squad||[]).forEach(c=>c && mainKeys.add(_gcNorm(c.handle))));
      const from=r.rows.filter(x=>x!=='you').map(ccStageTeamFrom).filter(Boolean)
        .filter(t=>!(t.squad||[]).some(c=>c && mainKeys.has(_gcNorm(c.handle))));
      from.forEach(t=>(t.squad||[]).forEach(c=>c && seated.add(_gcNorm(c.handle))));
      const need=Math.max(0, myScqN-(mySeat==='scq'?1:0));
      if(from.length) ownScq=from.slice(0, need).concat(ownScq.filter(t=>!from.includes(t))).slice(0, need);
    } }
  main.push(...ownMain); scq.push(...ownScq);
  (mySeat==='scq' ? scq : main).push(you);
  // Everybody else: their own leaderboard, in the order it was finished in.
  // Свой регион пропускается, потому что он уже сел выше — и это ЛЮБОЙ свой,
  // а не всегда Европа.
  Object.keys(SUMMIT_SLOTS).forEach(reg=>{
    if(reg===mine) return;
    const n=ccTeams(SUMMIT_SLOTS[reg]||0), m=ccTeams(SUMMIT_SCQ_SLOTS[reg]||0);
    // Трио-год: своей сценой региона (ccLanAwaySeats); иначе — доска Мейджора 1.
    // Симулированный Мейджор 1 региона (ccLanSimSeats); доски — только запас вне карьеры.
    const teams=ccLanSimSeats(reg, n+m, drafted, seated, 'm1') || ccLanAwaySeats(reg, n+m, drafted, seated, 'summit') || ccLanSeats(gcRegionFinals('m1', reg), n+m, reg, seated);
    main.push(...teams.slice(0, n));
    scq.push(...teams.slice(n));
  });
  const seed=a=>a.slice().sort((x,y)=>(y.pow||0)-(x.pow||0));
  const M=seed(main), S=seed(scq);
  const half=Math.round(stField/2);
  if(stage==='upper') return ccSeatYou(M.slice(0, stField), you);
  const lower=S.concat(M.slice(half)).slice(0, stField);
  /* Второй день и финал Саммита собираются из прошедших (cr.summitSeed, пишет runCareerSummit), а не новым
     посевом по силе: нижняя сетка из вылетевших из верхней плюс Второй шанс, финал из прошедших обеих.
     Остаток зала добирается посевом (карьера видит одну комнату из семи регионов). Сейв без записи
     читается по-старому, иначе Саммит на середине остался бы без второго дня. */
  const carry=ccSummitCarry();
  const teamsOf=rows=>(rows||[]).filter(r=>r!=='you').map(ccStageTeamFrom);
  /* Комната: сначала те, кто её выиграл, потом добор посевом до полного зала.

     У добора одно правило — он не сажает обратно того, кого игрок видел
     вылетевшим. Иначе шесть свободных мест финала заполнялись бы теми, кто
     вчера не прошёл нижнюю сетку (замер: пять из шести). */
  const room=(first, rest, barred)=>{
    const seen=new Set([ccSeatKey(you)]), take=[];
    const bar=new Set((barred||[]).map(ccSeatKey));
    const add=t=>{ const k=ccSeatKey(t); if(seen.has(k)) return; seen.add(k); take.push(t); };
    first.forEach(add);
    rest.forEach(t=>{ if(take.length<stField-1 && !bar.has(ccSeatKey(t))) add(t); });
    return ccSeatYou([you, ...take.slice(0, stField-1)], you);
  };
  if(stage==='lower'){
    /* Добор нижней сетки не сажает тех, кто уже прошёл верхнюю: тот же барьер и тот же код, что у финала.
       Пока рейтинги разбросаны, граница «прошёл/вылетел» не плывёт. С ЛАНом из карточек года (gcCardIndex) верх
       сжимается, в посеве появляются равные, и без барьера прошедшая команда всплывает в нижней сетке.
       Ловит check-career-summit-carry. */
    const fell=teamsOf(carry && carry.fell);
    return fell.length
      ? room(fell.concat(S), lower, teamsOf(carry && carry.upper))
      : ccSeatYou(lower, you);
  }
  const seedFinal=M.slice(0, half).concat(lower.slice(0, half)).slice(0, stField);
  const up=teamsOf(carry && carry.upper), lo=teamsOf(carry && carry.lower);
  // Добор идёт по всему залу, а не по одной посевной полусотне: из неё после
  // запрета вылетевшим остаётся мало имён, и финал недосчитывался пяти команд.
  if(up.length || lo.length)
    return room(up.concat(lo), seedFinal.concat(M, S), teamsOf(carry && carry.out));
  return ccSeatYou(seedFinal, you);
}
/* Строка команды для записи между днями Саммита, и обратно.

   Отдельно от ccMajorSeatRow: там комната одного региона, и карточка ищется в
   своей сцене. Здесь зал из семи, поэтому регион пишется в строку — иначе
   океанийская пара воскресала бы европейской. */
/* ОДИН МИР НА ВСЮ ГОНКУ (отзыв: «делай»). Записи посева — кто прошёл Плей-Ин, кто вышел
   из хитов, кто сидит в сетках Саммита, кто взял места на Глобалы — карьера пишет своей строкой
   'you': к среде состав может смениться, а место в таблице нет. Но такую запись нельзя отдать
   соседу по гонке: у него 'you' — это ОН, и запись читается как чужая. Пока записи были личными,
   у каждого гонщика были свои финалы Мейджоров, свой Саммит и свои победители — отсюда скриншот
   10.09, где у двух вкладок разные чемпионы, разный ПР и разные награды.
   В гонке своя строка пишется НАСТОЯЩЕЙ (ник, регион, рейтинг), запись целиком уезжает соседям
   книгой мира (ccRaceWorldPack.seeds), и поле следующего этапа у всех одно. Себя в этом поле
   каждый находит по карточке — тем же hasCard, которым ccRaceFieldSync сажает соперников. */
function ccRaceSeeds(){ return typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceLive==='function' && ccRaceLive(); }
function ccSeedRow(t, you, rowFn){ return (t===you && !ccRaceSeeds()) ? 'you' : rowFn(t); }
// Есть ли я в записи прошедших: в гонке своя строка пишется никами (ccSeedRow), а не 'you'.
function ccSeedHasMe(rows){
  if(!rows || !rows.length) return false;
  if(rows.indexOf('you')>=0) return true;
  let mk=''; try{ mk=hKey(careerCard()||{handle:''}); }catch(e){}
  return !!mk && rows.some(r=>Array.isArray(r) && r.some(x=>hKey(typeof x==='string' ? x : (x && x.h) || '')===mk));
}
function ccStageSeatRow(t){
  return (t.squad||[]).map(function(c){
    const a=attrsFor(c)||{};
    return {h:c.handle, r:c.region||null, n:c.nat||null,
            o:Math.round((c._ovr!=null ? c._ovr : a.ovr)||0), k:a.roleKey||null};
  });
}
function ccStageCardFrom(rec){
  if(typeof rec==='string') rec={h:rec};
  const reg=rec.r||ccCareerRegion();
  const found=ccSceneRoster(reg).find(x=>hKey(x)===hKey(rec.h));
  if(found) return found;
  // Ника больше нет в сцене — человек всё равно играл, и место его не пустует.
  const r=clamp(Math.round(rec.o||ccBand(1)), 35, ccGenTop());
  return {handle:rec.h, nat:rec.n||null, region:reg, org:null,
          tier:'ladder', event:L().ccLadderEvent, date:'-', placement:null,
          rating:r, _targetOvr:r, _attrs:ccRookieAttrs(r, rec.k||'roleFRG')};
}
/* СБОРКА КОМАНДЫ ИЗ ЗАПИСИ — ВНЕ СЕЯНОГО ПОТОКА. Атрибуты выдуманной карточки, роли и химия
   тратят броски, а сколько именно — зависит от того, кого запись назвала: у одного гонщика
   строка ложится на карточку из своей сцены, у другого собирается заново. Скриншот
   («table,rolls @ #30 p3=6477 vs 6447», поле при этом сошлось) — ровно это. Та же обёртка, что
   у ccRaceRivalTeam. */
function ccStageTeamFrom(row){
  return ccRaceUnseeded(function(){
    const cards=row.map(ccStageCardFrom);
    const t=careerTeam(cards);
    t.name=teamLabel(cards);
    return t;
  });
}
/* Сохраняем всю таблицу сыгранного вечера: 50 строк по 4 числа, ~2 КБ на турнир, 4 турнира за сезон.
   Без этого История переигрывала турнир своим броском и расходилась и с постом в ленте, и с самим вечером.
   Читает careerArchiveFinal. n для вызова, которому нужна только верхушка. */
function ccStageTop(ranked, you, n){
  const bare=t=>String(t && t.name || '').replace(/<[^>]*>/g, '').trim();
  const mine=()=>[CAREER.player.nick].concat(careerMates().map(c=>c && c.handle))
    .filter(Boolean).join(' & ');
  return (ranked||[]).slice(0, n>0 ? n : (ranked||[]).length).map(t=>({
    n: t===you ? mine() : bare(t),
    p: Math.round(t.stagePts||0),
    w: t.wins||0,
    e: t.stageElims||0,
    // ЛАН пишет регион под именем, поэтому он тоже сохраняется.
    r: t===you ? ccCareerRegion() : ((t.squad||[])[0]||{}).region || null,
    you: t===you || undefined
  }));
}
/* Комната стадии Reload — те, кто вышел из предыдущей.

   Отзыв: «мне кажется, что на всех финалах так». Так и было:
   круг Reload собирал careerCupField ЗАНОВО на каждой стадии — отборы, плей-ин,
   хиты и финал, — то есть в финале сидели двадцать сильнейших дуо континента, а
   не те пятеро из хита игрока, чей проход он только что смотрел.

   Записываются только глубокие стадии: плей-ин отдаёт в хиты восемьдесят строк,
   хит в финал — пять. Отборы не пишутся никогда: их отсечка — сотни команд, а
   сейв уже однажды умер от такой строки (см. ccRelPack).

   Остаток комнаты добирается прежним полем: игрок видел один хит из четырёх,
   остальные пятнадцать мест финала приезжают со стороны, как и должны. */
/* Соседние хиты круга — их вечер, сыгранный миром.

   Отложены нарочно: хиты Reload стоят в календаре одним днём, а финал через
   шесть, и считать три чужие комнаты сразу после своего вечера значило бы
   удлинить его. Раскладку хиты оставили в relSeed.pending (см. runCareerReload),
   здесь она просто доигрывается — тем же движком и тем же правилом отсечки, что
   и твоя: победа в игре у круга билетом не является, поэтому heatQualifiers
   зовётся с false, ровно как в раннере. */
function ccRelWorldHeats(){
  const cr=CAREER && CAREER.career;
  const s=cr && cr.relSeed;
  if(!s || s.next!=='final' || !Array.isArray(s.pending) || !s.pending.length) return 0;
  if(s.season!==cr.season || s.size!==careerSquadSize()) return 0;
  const st=ccScaleStage(CC_RELOAD_STAGE.heat);
  const pts=reloadCareerPoints(s.set);
  let played=0;
  s.pending.forEach((rows, i)=>{
    const room=(rows||[]).map(ccStageTeamFrom);
    if(room.length<2) return;
    ccWorldRun('rheat|'+cr.season+'|'+s.set+'|'+i, ()=>simulateGames(room, st.games, pts, st.kill));
    const q=heatQualifiers(room, st.cut, false);
    s.through=(s.through||[]).concat(
      room.slice().sort(heatsRank).filter(t=>q.has(t)).map(ccStageSeatRow));
    played++;
  });
  s.pending=null;
  return played;
}
function ccRelRoom(you, drafted, lobbyCr, ev, st, open, sharp){
  const s=CAREER.career.relSeed;
  /* И того же региона (Notion 23.10: в европейском финале капа 2 Peterbot & Bylah, Clix & Higgs, Magma & Pollo).
     Переезд посреди капа оставлял прошедших хит старого региона, а добор шёл из нового: проба — хит EU, переезд в
     NAC, финал 5 пар EU + 14 NAC. Старый сейв без reg — по-прежнему (переезд его теперь и так стирает). */
  const ok=s && s.season===CAREER.career.season && s.size===careerSquadSize() &&
           s.set===ev.set && s.next===ev.stage && (!s.reg || s.reg===ccPoolRegion()) &&
           Array.isArray(s.through) && s.through.length;
  /* Из добора финала исключаем тех, кто проиграл твой хит. Хит 20 дуо с отсечкой 5,
     финал снова 20, и 15 мест добирал careerCupField тем же броском (careerSeed по
     неделе, хит и финал в одной): 12 из 20 команд финала вылетали из твоего хита
     (tools/check-career-reload-heat-cut.js). Чужие из других хитовых лобби законны.
     Выбывшие уходят в тот же аргумент, которым careerCupField исключает тебя самого,
     как у Парижа (ccRcField). */
  const gone=(ok && Array.isArray(s.out)) ? s.out : [];
  const fresh=n=>careerCupField(lobbyCr, drafted.concat(gone), n, null, open, sharp);
  if(!ok) return [you, ...fresh(st.field)];
  /* Хиты круга Reload рассаживаем змейкой по финишу отбора (seedHeats, как у Мейджора: 1, 8, 9, 16…
     в первый хит, 2, 7, 10… во второй), а не through.slice(0, 19), который сажал весь верх отбора
     в один хит с игроком. Число хитов считается от числа прошедших; своё лобби ищется по игроку,
     куда его положила змейка. */
  if(ev.stage==='heat' && s.through.length>st.field){
    const seeded=s.through.map(r=>r==='you' ? you : ccStageTeamFrom(r));
    const heats=seedHeats(seeded, Math.max(2, Math.round(seeded.length/st.field)));
    const rAt=ccRaceHeatTogether(heats, you);   // гонка: один хит на комнату
    const at=rAt>=0 ? rAt : heats.findIndex(h=>h.indexOf(you)>=0);
    const mine=(heats[at<0 ? 0 : at]||[]).slice(0, st.field);
    if(mine.indexOf(you)<0) mine[mine.length-1]=you;
    // Змейка делит нацело редко — недобор закрывается лестницей, как везде.
    if(mine.length<st.field){
      const seen=new Set(mine.map(ccSeatKey));
      fresh(st.field).forEach(t=>{
        if(mine.length<st.field && !seen.has(ccSeatKey(t))){ seen.add(ccSeatKey(t)); mine.push(t); }
      });
    }
    return mine;
  }
  const seen=new Set([ccSeatKey(you)]), take=[];
  const add=t=>{ const k=ccSeatKey(t); if(seen.has(k)) return; seen.add(k); take.push(t); };
  s.through.filter(r=>r!=='you').map(ccStageTeamFrom).forEach(add);
  fresh(st.field).forEach(t=>{ if(take.length<st.field-1) add(t); });
  return [you, ...take.slice(0, st.field-1)];
}
/* Вечер, которого нет в журнале, но который помнит лента.

   Его снимок, 27 августа: пост «Топ 2 на Саммит в Дюссельдорфе» называет
   Acorn & Boltz с 390 очками, а таблица того же Саммита в Истории открывается
   на 411 и с другими командами на местах с третьего по пятое. Карьера была
   сыграна ДО того, как вечер начал записывать свою комнату, — в её строках
   журнала комнаты нет, и таблица снова становилась пересчётом.

   Но пост поздравления несёт ту же пятёрку с очками, и он в сейве есть. Значит
   имена и очки верхних строк можно взять оттуда, а победы и элимы оставить от
   реконструкции: их лента не хранит, а пустые колонки читались бы как ноль
   побед и ноль килов у чемпиона. Новые карьеры сюда не заходят — у них есть
   своя запись, она точнее и полнее. */
function ccArcTopFromNews(mine, rows){
  if(!mine || !mine.day || !CAREER || !CAREER.career) return null;
  const news=(CAREER.career.news||[]).find(e=>e && e.day===mine.day && e.tbl &&
    Array.isArray(e.tbl.rows) && e.tbl.rows.length);
  if(!news) return null;
  const mineName=[CAREER.player.nick].concat(
    (mine.mates && mine.mates.length) ? mine.mates : (mine.mate?[mine.mate]:[])
  ).filter(Boolean).join(' & ');
  const key=s=>String(s==null?'':s).toLowerCase().replace(/\s+/g,'');
  return news.tbl.rows.map((r,i)=>{
    const from=(rows||[])[i]||{};
    return {n:String(r.n||''), p:+r.s||0, w:from.wins||0, e:from.elims||0,
            r:from.reg||null,
            you: key(r.n)===key(mineName) ? true : undefined};
  });
}
// Запись этого Саммита, если она оставлена ЭТИМ сезоном и в ЭТОМ составе.
function ccSummitCarry(){
  const s=CAREER && CAREER.career && CAREER.career.summitSeed;
  if(!s || s.season!==CAREER.career.season || s.size!==careerSquadSize()) return null;
  return s;
}
// Epic's published Summit purse, read straight rather than through
// prizeTableFor, which branches on CARD_SET — a global the career does not set.
function summitPrize(place){
  const t=(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES.SUMMIT) || null;
  return t ? (t[String(place)]||0) : 0;
}
/* ВТОРОЙ ШАНС — два вечера перед Саммитом (см. календарь 2026 и CC_SCQ_PLAY / CC_SCQ_FINAL).

   Открытый день: свой дивизион 1 без тех, кто уехал на Саммит из финала Мейджора 1 (основная сетка своего региона —
   тот же отбор, что сажает Саммит, careerSummitField), комната на сто пятьдесят, пятнадцать проходят. Финал: пятьдесят —
   прошедшие открытого дня и сильнейшие из оставшихся, шесть игр, квота региона (SUMMIT_SCQ_SLOTS) уезжает в нижнюю сетку
   Дюссельдорфа и садится там по записи финала (cr.scq.rows). Призы — таблица Liquipedia своего региона. */
async function runCareerScq(ev){
  const cr=CAREER.career;
  const final=ev.stage==='scq';
  const mpStart=ccMpLock() ? await ccMpGate('summit') : null;
  const st=ccScaleStage(final ? CC_SCQ_FINAL : CC_SCQ_PLAY);
  careerCampBonus('summit', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  useLandingSet(ACTIVE_LANDING_SET);
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
  const lobbyCr=Object.assign({}, cr, {division:1});
  // Кто уже на Саммите из своего региона — в этот турнир не идут (тот же отбор, что у careerSummitField).
  const q=ccSummitSlots();
  let mainCards=[];
  try{ const lanCr=Object.assign({}, cr, {division:1});
    mainCards=careerCupField(lanCr, drafted, ccTeams(q.main)+ccTeams(q.scq), 'summit', false, CC_FIELD_SHARP.lan)
      .slice(0, ccTeams(q.main)).flatMap(t=>(t.squad||[]).filter(Boolean)); }catch(e){ mainCards=[]; }
  const taken=drafted.concat(mainCards);
  let field;
  if(!final){
    field=[you, ...careerCupField(lobbyCr, taken, ccTeams(st.field)-1, 'scq', false, 0)];
  } else {
    const r=ccScqOf();
    const seen=new Set([ccSeatKey(you)]), take=[];
    const add=t=>{ if(!t) return; const k=ccSeatKey(t); if(seen.has(k)) return; seen.add(k); take.push(t); };
    ((r && r.through)||[]).filter(x=>x!=='you').map(ccStageTeamFrom).forEach(add);
    careerCupField(lobbyCr, taken, ccTeams(st.field), 'scq', false, CC_FIELD_SHARP.heats).forEach(t=>{ if(take.length<ccTeams(st.field)-1) add(t); });
    field=[you, ...take.slice(0, ccTeams(st.field)-1)];
  }
  const label=ev.label||L().liveScq;
  await simulateGamesLive(field, st.games, st.pts||majorPoints, st.kill, 'stage', 0, null, null,
    {lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, label, ['summit','major'])});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  const slots=final ? ccTeams(SUMMIT_SCQ_SLOTS[ccCareerRegion()]||0) : st.cut;
  const through=place<=slots;
  removeSkipButton();

  const shell=createStageCardShell(label+' — '+field.length);
  await revealStageLog(you, shell, true);
  const cash=final ? scqPrize(place) : 0;
  const cashLine=cash ? L().ccWfCash(ccNum(cash)) : L().ccWfNoCash;
  finalizeStageCard(shell, place, field.length, you.stagePts, through, false,
    final ? (through ? L().ccScqSeat : L().ccScqNoSeat(slots))+' · '+cashLine
          : through ? L().ccRelPass(slots) : L().ccRelFail(slots));
  await revealStandings(shell, ranked, you, slots, null, null, final ? scqPrize : null, null, final);
  careerPrAdd(ranked, {div:1, kind:'major', stage:'lcq'});

  if(final){
    careerMoneyAdd(ranked, scqPrize);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    const r=ccScqOf()||{season:cr.season, play:'pass'};
    cr.scq=Object.assign({}, r, {pass:through, place:place,
      rows:ranked.slice(0, Math.max(slots, ccTeams(SUMMIT_SCQ_SLOTS[ccCareerRegion()]||0))).map(t=>t===you ? 'you' : ccStageSeatRow(t))});
    careerNews(through?'good':'flat', through?'ccNewsSoloThrough':'ccNewsSoloOut', [label, place, field.length]);
  } else {
    cr.scq={season:cr.season, play:through?'pass':'out', pass:through?null:false, place:place,
            through:through ? ranked.slice(0, Math.max(st.cut, ccTeams(CC_SCQ_FINAL.field))).map(t=>t===you ? 'you' : ccStageSeatRow(t)) : null};
    careerNews(through?'good':'flat', through?'ccNewsSoloThrough':'ccNewsSoloOut', [label, place, field.length]);
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place,
               of:field.length, pts:you.stagePts, passed:through,
               ovr:CAREER.player.ovr, games:st.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'scq',
               stage: final ? 'final' : 'playin'});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:label, place:place, of:field.length, through:through, cut:slots, seat:final && through,
    seatText: final && through ? L().ccScqSeat : null, money: final ? cash : null});
}
async function runCareerSummit(){
  const cr=CAREER.career;
  const ev=careerSummitOn(careerToday());
  if(!ev || !careerSummitCan(ev)) return;
  if(ev.stage==='scqplay' || ev.stage==='scq') return runCareerScq(ev);
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('summit') : null;
  // In this season's teams, like every other stage a career plays. See ccTeams.
  const st=ccScaleStage(CC_SUMMIT_STAGE[ev.stage]);
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('summit', ev.id||ev.label||'');
  careerLanArrive('summit', ev);
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
  // A LAN is the world: Europe's seats are the season this career played, the
  // other six regions' are their own Grand Finals. See careerSummitField.
  const field=careerSummitField(ev.stage, you, drafted);

  // Все три вечера Саммита — комната в одно лобби, и точка выбирается в
  // каждом. Правка: «нельзя только в опенах выбирать».
  const kindsForDrop=['summit','major'];
  const zones=null;
  await simulateGamesLive(field, st.games, st.pts, st.kill, 'stage', 0, null, zones,
    {twoDay:ev.stage==='final', lobbySize:ccTeams(50), stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, ev.label, kindsForDrop)});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  let through = st.cut ? place<=st.cut : false;
  // In the Lower Bracket a Victory Royale is a seat on its own, the way the
  // Heats work: winning a game there is the whole point of the day.
  if(ev.stage==='lower' && (you.wins||0)>0) through=true;
  removeSkipButton();

  const shell=createStageCardShell(ev.label+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, st, place, ev.stage==='final' ? summitPrize : null), false,
    st.cut ? (through ? L().ccRelPass(st.cut) : L().ccRelFail(st.cut)) : '');
  /* The line across a Summit final is the seats it hands out.

     His count, 17 August: about fifteen duos go from the Summit to the Global
     Championship, and the card said ten. Ten was a fallback typed in when the
     stage has no cut of its own - a Summit final does not cut, it crowns - and
     it drew a line that meant nothing over the one number the room is played
     for. SUMMIT_GC_SLOTS is fifteen and it is what ccGlobalsSeat already reads,
     so the qualification was right all along and only the line was wrong. */
  await revealStandings(shell, ranked, you,
    st.cut || (ev.stage==='final' ? ccTeams(SUMMIT_GC_SLOTS) : 10), null, null,
    ev.stage==='final' ? summitPrize : null, null, ev.stage==='final');
  careerPrAdd(ranked, {div:1, kind:'summit', stage:ev.stage});

  let cash=0;
  if(ev.stage==='final'){
    careerMoneyAdd(ranked, summitPrize);
    cash=summitPrize(place);
    if(cash){ const mine=ccShareOf(cash, you);
      ccPayIn(mine); }
    careerReachAdd(careerReachResult(place, field.length, 1, 'summit'));
    careerNews(cash?'good':'flat', cash?'ccNewsSumCash':'ccNewsSumNoCash',
               cash?[place, ccNum(cash)]:[place, field.length],
               {tbl:ccStageShot(ranked, you, 1, ev.label)});
    /* И благодарность за турнир — обычный пост после ЛАНа: «thanks @redbull…
       for the event and my teammates throughout the tournament» (@MariusCOW,
       15 августа). Пишется только после ЛАНов, их в году три-четыре. */
    careerNews('flat', 'ccPostThanks', [ev.label]);
    careerCongrats(ranked, you, L().ccCongratsSummit(ccLanCityIn('summit')));
    ccGcKeepFinal(2026, 'summit', ranked.map(t=>ccSeedRow(t, you, ccMajorSeatRow)));   // для передачи мест Мейджора 2 (ccGcRolledSeat2026)
    cr.summit={got:'final', ticket:false, through:false};
  } else {
    cr.summit={got:ev.stage, through:through,
               ticket: through || !!(cr.summit && cr.summit.ticket)};
    /* И день оставляет после себя тех, кто из него вышел.

       Их места в следующей комнате не обсуждаются: игрок видел, как они их
       выиграли, и увидит их там же. Верхняя сетка пишет и вылетевших — из них
       собирается нижняя. См. careerSummitField. */
    if(ev.stage==='upper' || ev.stage==='lower'){
      const s=(cr.summitSeed && cr.summitSeed.season===cr.season &&
               cr.summitSeed.size===careerSquadSize())
        ? cr.summitSeed
        : (cr.summitSeed={season:cr.season, size:careerSquadSize()});
      const row=t=>ccSeedRow(t, you, ccStageSeatRow);
      /* В нижней сетке победа в игре — билет, ровно как у Хитов Мейджора: так
         написан сам формат («a Victory Royale advances instantly and the top 19
         on points fill the rest»), и так уже считается проход САМОГО игрока
         строкой выше. Комната обязана считаться тем же правилом, иначе из
         пятидесяти мест финала занято сорок четыре, а шесть добираются
         посевом — то есть теми, кто вчера вылетел. */
      const q=ev.stage==='lower' ? heatQualifiers(field, st.cut, winIsATicket()) : null;
      const passed=q ? ranked.filter(t=>q.has(t)) : ranked.slice(0, st.cut);
      const rest  =q ? ranked.filter(t=>!q.has(t)) : ranked.slice(st.cut);
      s[ev.stage]=passed.map(row);
      if(ev.stage==='upper') s.fell=rest.map(row);
      // Вылетевшие из нижней — это конец турнира для них. Записываются, чтобы
      // финал не добрал их посевом обратно в зал.
      if(ev.stage==='lower') s.out=rest.map(row);
      /* А финал Саммита оставляет тех, кто увёз с него места на Глобалы.

         Вопрос: «а глобалс и весь самит». Саммит-то как раз
         играется целиком — все три дня это одно лобби на пятьдесят, и каждый
         этап просчитан. А вот Глобалы его результат НЕ читали: пятнадцать мест
         «за Саммит» брались из GC_SUMMIT_DUOS, статического списка тех, кто
         прошёл в реальности. То есть можно было выиграть Саммит и увидеть в
         Антверпене не тех, кто в нём финишировал.

         Здесь запоминается ровно столько строк, сколько мест даёт Саммит
         (SUMMIT_GC_SLOTS), в порядке финиша. Читает их careerGlobalsField. */
      if(ev.stage==='final')
        s.gc=ranked.slice(0, ccTeams(SUMMIT_GC_SLOTS)).map(row);
    }
    careerNews(through?'good':'flat', through?'ccNewsSumThrough':'ccNewsSumOut',
               [ev.label, place, field.length]);
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:place, of:field.length,
               pts:you.stagePts, passed:through || cash>0, ovr:CAREER.player.ovr,
               games:st.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'summit', stage:ev.stage,
               won: ev.stage==='final' ? ccStageSeatRow(ranked[0]) : undefined,
               top: ev.stage==='final' ? ccStageTop(ranked, you) : undefined});
  careerMonthGoalCheck();
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:through||cash>0,
    wins:you.wins||0, cash:cash, cut:st.cut});
}

/* Global Championship, Antwerp. From Liquipedia, same numbers as the draft mode: offline Antwerp, 26-27 Sept 2026,
   50 duos, $2,000,000, one cumulative leaderboard. Twelve games, 6 per day, played
   as one stage like Heats and Play-In.
   Seats (Epic's allocation): Summit top 15 (SUMMIT_GC_SLOTS), Major 2 Final EU top 9
   (MAJOR2_GC_SLOTS.EU), Last Chance EU top 3 (GCLC_GC_SLOTS.EU), all read back off
   the career's history, not stored.
   Purse GC2026_PRIZES is the 2024 split: Epic gave only the total, and 2024 paid 50
   places summing exactly to $2,000,000. Field: careerGlobalsField. */
const CC_GLOB_GAMES=12, CC_GLOB_KILL=4, CC_GLOB_FIELD=50;
function careerGlobalsOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='globals');
  return e ? {id:e.id, label:e.label} : null;
}
/* The seat, and where it came from.

   Three separate reads of the log, in the order Epic fills the field. The Major
   row does not record which Major it was — nothing needed it until now — so the
   day it was played is asked instead, which is the calendar's own answer and
   cannot drift out of step with it. */
/* How many seats the career's own region carries down a route.

   Off the save, not off ccHomeRegion: that one resolves through `drafted`, and
   the hub asks this question with no lobby loaded at all. Both Antwerp routes
   used to read the EU column by name, so an Oceanic career needed a top three
   of a qualifier that seats one, and was handed the seat anyway on a number its
   own region never had. This is the same table the standings card draws its cut
   line from, which is the point: what the player was shown during the event and
   what the calendar checks afterwards have to be the same number. */
/* Epic's allocation is written in duos, like every other count in this file, so
   a trio season reads it in trios: nine European seats out of fifty duos is six
   out of thirty-three trios, and handing out nine would put a fifth of Europe's
   Major 2 field on the plane. See ccTeams. */
function ccGcSlots(table){
  const r=careerPrizeRegion();
  return ccTeams(table[r]!=null ? table[r] : (table.EU||0));
}
function ccGlobalsSeat(){
  /* 2025: в Лион везут финалы трёх Мейджоров, по квоте региона на каждый
     (GC2025_M1/M2/M3_SEATS — Epic'овы), и никакого последнего шанса. */
  if(ccIs2025()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const tables={1:GC2025_M1_SEATS, 2:GC2025_M2_SEATS, 3:GC2025_M3_SEATS};
    const hit=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && !ccMajorIsShowdown(ev.n) && ccGcRolledSeat(2025, ev.n, r.place, i=>ccGcSlots(tables[i]||GC2025_M3_SEATS));
    });
    return hit ? {via:'major2', place:hit.place, note:L().ccGlobSeatMajor25} : null;
  }
  // 2021: ЛАНа нет — Grand Royale идёт машиной сезона («Мейджор 5»).
  if(ccIs2021() || ccIs2020() || ccIs2019()) return null;
  // 2022: приглашение в Роли — место в Гранд-финале сезона не ниже ccInv22Quota.
  if(ccIs2022()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const hit=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && ev.y22 && r.place<=ccInv22Quota();
    });
    return hit ? {via:'major2', place:hit.place, note:L().ccMajSeatInv22(ccInv22Quota())} : null;
  }
  /* 2023: в Копенгаген — финалы трёх Мейджоров по квоте региона (верхняя сетка) и финал
     Last Chance Major (нижняя). Квоты — участники Liquipedia по дорогам (GC2023_SEATS). */
  if(ccIs2023()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const maj=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && ev.y23 && ev.n<=3 && ccGcRolledSeat(2023, ev.n, r.place, i=>ccGc23Seats('m'+i));
    });
    if(maj) return {via:'major2', place:maj.place, note:L().ccGlobSeatMajor25};
    const lcm=log.find(r=>r.kind==='major' && r.stage==='lcm' && r.place && r.place<=ccGc23Seats('lcm'));
    return lcm ? {via:'lcm', place:lcm.place, note:L().ccYr23LcmSeat(ccGc23Seats('lcm'))} : null;
  }
  /* 2024: в Форт-Уэрт везут финалы трёх Мейджоров по квоте региона (GC2024_M*_SEATS),
     последнего шанса не было. */
  if(ccIs2024()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const hit=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && ev.y24 && ccGcRolledSeat(2024, ev.n, r.place, ccGc24Seats);
    });
    return hit ? {via:'major2', place:hit.place, note:L().ccGlobSeatMajor25} : null;
  }
  // Этого года — см. ccSummitSeat.
  const cr=CAREER.career;
  const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
  const summit=log.find(r=>r.kind==='summit' && r.stage==='final');
  if(summit && summit.place && summit.place<=ccTeams(SUMMIT_GC_SLOTS))
    return {via:'summit', place:summit.place, note:L().ccGlobSeatSummit};
  const major=log.find(r=>{
    if(r.kind!=='major' || r.stage!=='final') return false;
    const ev=careerMajorOn(r.day);
    return !!ev && ev.n===2;
  });
  if(major && major.place && ccGcRolledSeat2026(major.place))
    return {via:'major2', place:major.place, note:L().ccGlobSeatMajor};
  const gclc=log.find(r=>r.kind==='gclc' && r.stage==='final');
  if(gclc && gclc.place && gclc.place<=ccGcSlots(GCLC_GC_SLOTS))
    return {via:'gclc', place:gclc.place, note:L().ccGlobSeatGclc};
  return null;
}
// Whether a seat of this kind has already been handed down. See careerSlotGiveUp.
function ccGaveUp(key){ return ((CAREER.career.gaveUp)||[]).indexOf(key)>=0; }
function careerGlobalsCan(ev){
  if(!ev) return false;
  if(CAREER.career.globals) return false;      // it is one tournament, played once
  // Копенгаген — три дня, у каждого свой допуск. См. ccGc23Can.
  if(ccIs2023()) return !ccGaveUp('globals') && ccGc23Can();
  // Forfeited with the duo that won it, or with the region that gave it.
  if(ccGaveUp('globals')) return false;
  return !!ccGlobalsSeat();
}
/* The fifty duos in Antwerp: GC_SUMMIT_DUOS (15, all regions) and GC_MAJOR2_DUOS
   (25 from Major 2 regional finals). The last ten are the GC Last Chance, which
   hasn't been played, so we take the top duos of each region's Major 2 leaderboard
   not already in, by Epic's per-region allocation. Your seat displaces one duo on
   the route you came through. */
/* Места своего региона на ЛАНе — из сцены карьеры, той же, что играет кубки.

   Комната собирается так же, как своя квота Саммита: careerCupField от лица
   Дивизиона 1 с ланской остротой, минус те, кто в зале уже сидит. Пары
   приезжают парами — это и есть ответ на «почему сильных трио я не вижу». */
function ccGcOwnSeats(n, drafted, seated, tag){
  if(n<=0) return [];
  const cr=CAREER.career;
  const lanCr=Object.assign({}, cr, {division:1});
  /* С запасом: часть команд отсеется теми, кто уже сидит в зале. Восьми не хватало — верх
     Европы почти весь уже едет с Саммита, и после сдвига рейтингов Глобалами-2026 (30.09)
     Мейджор 2 недосчитывался двух мест, а их добирал ласт ченс (check-career-globals).
     Тот же урок, что у Форт-Уэрта ниже: «из десяти предложенных девять уже сидят в зале». */
  return careerCupField(lanCr, drafted, n+40, tag, false, CC_FIELD_SHARP.lan)
    .filter(t=>{
      const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
      if(keys.some(k=>seated.has(k))) return false;
      keys.forEach(k=>seated.add(k));
      return true;
    })
    .slice(0, n);
}
/* Форт-Уэрт 2024: пятьдесят дуо — настоящие, по дорогам (GC2024_M1/M2/M3_DUOS, Liquipedia),
   карточками своего года (ccLanTeam → gcCardIndex(2024)); своё место вытесняет одно из них,
   и если кто-то из настоящих уже сидит в твоём составе — его дуо не летит. Недобор —
   верх своего региона (ccGcOwnSeats). */
function buildGlobalChampionship2024Field(you, drafted){
  const seated=new Set();
  (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const field=[];
  const seat=(duos, route, rating)=>duos.forEach(d=>{
    if(field.length>=CC_GLOB_FIELD-1) return;
    const t=ccLanTeam(d, null, rating, seated);
    if(t){ t.gcRoute=route; field.push(t); }
  });
  seat(ccGcList('GC2024_M1_DUOS', GC2024_M1_DUOS), 'm1', 90);
  seat(ccGcList('GC2024_M2_DUOS', GC2024_M2_DUOS), 'm2', 88);
  seat(ccGcList('GC2024_M3_DUOS', GC2024_M3_DUOS), 'm3', 86);
  /* Недобор (тёзки, вытесненные) — верх своего региона; просить надо с запасом: верх
     Европы и есть эти самые люди, и из десяти предложенных девять уже сидят в зале. */
  if(field.length<CC_GLOB_FIELD-1){
    const lanCr=Object.assign({}, CAREER.career, {division:1});
    careerCupField(lanCr, drafted, 80, null, false, CC_FIELD_SHARP.lan).forEach(t=>{
      if(field.length>=CC_GLOB_FIELD-1) return;
      const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
      if(keys.some(k=>seated.has(k))) return;
      keys.forEach(k=>seated.add(k));
      t.gcRoute='m3'; field.push(t);
    });
  }
  you.gcRoute='m3'; you.summitRegion=ccCareerRegion();
  const capped=field.slice(0, CC_GLOB_FIELD-1);
  capped.push(you);
  return capped;
}
/* GLOBAL CHAMPIONSHIP (и Invitational 2022) — ИЗ СИМУЛЯЦИИ, А НЕ ИЗ ИСТОРИИ (его слова 29.09: «пусть из
   нашей симуляции игроки попадают», «и так должно быть на всех турнирах»). Залы Роли, Копенгагена,
   Форт-Уэрта и Лиона собирались из настоящих списков прошедших (INV2022_DUOS, GC2023_DUOS,
   GC2024_M*_DUOS, GC2025_M*_TRIOS). В карьере они подменяются: сколько мест было у региона на этой
   дороге — столько и отдаётся, но кому — решает сыгранный финал Мейджора этого региона. Свой регион —
   твой финал (cr.gfKeep, пишется в конце финала Мейджора), чужие — комната финала из настоящих команд
   года этого региона (пары/трио — по одному событию и месту в карточках), сыгранная движком. Кто уже
   взял место на ранней дороге, дальше не занимает. Считается один раз за сезон (cr.gcSim). В драфте —
   настоящие списки, как было. */
let CC_GC_SIM_DEPTH=0;
function ccGcSimOn(fn){ CC_GC_SIM_DEPTH++; try{ return fn(); } finally{ CC_GC_SIM_DEPTH--; } }
/* МЕСТО НА GLOBAL CHAMPIONSHIP С ПЕРЕДАЧЕЙ ВНИЗ (Liquipedia, сверка 7.10: «If a duo has already qualified, their
   spot will be transferred to the closest placing duo that has not qualified»). По записанным финалам года
   (cr.gfKeep) идём Мейджор за Мейджором: квоту каждого добирают сверху те, кто ещё без места. Финала в записи
   нет — старое правило «место не ниже квоты». quotaOf(i) — квота Мейджора i. */
/* ДИСКВАЛИФИКАЦИЯ ПЕРЕД ЛАНОМ. Иногда одну из прошедших команд финала снимают (виза, бан за читы, напарник не
   может лететь), и её место уходит следующей по таблице: так места на Global Championship и передаются. Жребий
   от сезона и финала, одинаковый у обоих в командной игре. CC_LAN_DQ_OFF — сравнить «без снятия» для новости. */
let CC_LAN_DQ_ODDS=0.12;   // let — сторож check-career-lan-dq ставит 1 и 0
const CC_LAN_DQ_TOP=12, CC_LAN_DQ_WHY=['visa','cheat','mate'];
let CC_LAN_DQ_OFF=false;
const ccGcRowKey=r=>r==='you' ? 'you' : (Array.isArray(r) ? r : [r]).map(c=>hKey((c && c.h) || c)).sort().join('+');
const ccGcDqOf=kept=>(!CC_LAN_DQ_OFF && kept && kept.dq) ? kept.dq.key : null;
function ccGcRolledSeat(year, n, place, quotaOf){
  const k=(CAREER && CAREER.career && CAREER.career.gfKeep)||{}, season=CAREER.career.season;
  const rowKey=ccGcRowKey;
  const got=new Set();
  for(let i=1; i<=n; i++){
    const kept=k[year+'|'+i];
    if(!kept || kept.season!==season || !(kept.rows||[]).length){ if(i===n) return place<=quotaOf(n); continue; }
    let seats=quotaOf(i);
    const dq=ccGcDqOf(kept);
    for(const r of kept.rows){
      if(seats<=0) break;
      const key=rowKey(r); if(got.has(key) || key===dq) continue;
      got.add(key); seats--;
    }
    if(i===n) return got.has('you');
  }
  return false;
}
/* 2026: квота Мейджора 2 передаётся вниз мимо тех, кто уже едет с Саммита (его топ-15). Нет записей — старое правило. */
function ccGcRolledSeat2026(place){
  const k=(CAREER.career.gfKeep)||{}, season=CAREER.career.season, sum=k['2026|summit'], m2=k['2026|2'];
  const quota=ccGcSlots(MAJOR2_GC_SLOTS);
  if(!m2 || m2.season!==season) return place<=quota;
  const rowKey=ccGcRowKey, dq=ccGcDqOf(m2);
  const got=new Set((sum && sum.season===season) ? sum.rows.slice(0, ccTeams(SUMMIT_GC_SLOTS)).map(rowKey) : []);
  let seats=quota;
  for(const r of m2.rows){ if(seats<=0) break; const key=rowKey(r); if(got.has(key) || key===dq) continue; if(key==='you') return true; seats--; }
  return false;
}
function ccGcKeepFinal(year, n, rows){
  if(!CAREER || !CAREER.career) return;
  const cr=CAREER.career, k=cr.gfKeep=cr.gfKeep||{};
  k[year+'|'+n]={season:cr.season, reg:ccCareerRegion(), rows:(rows||[]).slice()};
  if(cr.gcSim && cr.gcSim.season===cr.season) delete cr.gcSim[year];
  try{ ccLanDqRoll(year, n); }catch(e){ console.error('ccLanDqRoll', e); }
}
// Квота «моего» финала для сравнения с дисквалификацией и без: тем же путём, что и ccGlobalsSeat.
function ccLanDqSeatYou(year, n){
  if(year===2026) return n===2 ? ccGcRolledSeat2026(Infinity) : null;
  if(year===2025) return ccGcRolledSeat(2025, n, Infinity, i=>ccGcSlots(({1:GC2025_M1_SEATS, 2:GC2025_M2_SEATS, 3:GC2025_M3_SEATS})[i]||GC2025_M3_SEATS));
  if(year===2024) return ccGcRolledSeat(2024, n, Infinity, ccGc24Seats);
  if(year===2023 && n<=3) return ccGcRolledSeat(2023, n, Infinity, i=>ccGc23Seats('m'+i));
  return null;
}
function ccLanDqRoll(year, n){
  const cr=CAREER.career, kept=cr.gfKeep && cr.gfKeep[year+'|'+n];
  if(!kept || kept.dq!==undefined || (year!==2026 && year!==2025 && year!==2024 && year!==2023) || (year===2026 && n!==2) || (year===2023 && !(n<=3))) return;
  const rnd=careerRng(ccHashStr('lanDq|'+cr.season+'|'+year+'|'+n));
  // Снимают только того, у кого место есть: ставим его на место «you» и спрашиваем ту же раздачу.
  const holds=r=>{
    const orig=kept.rows; let ok=false;
    kept.rows=orig.map(x=>x===r ? 'you' : (x==='you' ? '__me' : x)); kept.dq=null; CC_LAN_DQ_OFF=true;
    try{ ok=!!ccLanDqSeatYou(year, n); } finally{ kept.rows=orig; CC_LAN_DQ_OFF=false; delete kept.dq; }
    return ok;
  };
  const pool=(kept.rows||[]).slice(0, CC_LAN_DQ_TOP).filter(r=>r!=='you' && holds(r));
  if(!pool.length || rnd()>=CC_LAN_DQ_ODDS){ kept.dq=null; return; }
  const row=pool[Math.floor(rnd()*pool.length)];
  const why=CC_LAN_DQ_WHY[Math.floor(rnd()*CC_LAN_DQ_WHY.length)];
  const names=(Array.isArray(row) ? row : [row]).map(c=>(c && c.h) || c).filter(Boolean).join(' & ');
  kept.dq={key:ccGcRowKey(row), why:why, names:names};
  const withDq=ccLanDqSeatYou(year, n);
  CC_LAN_DQ_OFF=true; let without=null;
  try{ without=ccLanDqSeatYou(year, n); } finally{ CC_LAN_DQ_OFF=false; }
  if(withDq && !without){ kept.dq.you=true; careerNews('good', 'ccNewsDqSeat', [names, why]); }
  else careerNews('flat', 'ccNewsDqOther', [names, why]);
}
const CC_GC_SIM={
  INV2022_DUOS:{year:2022, size:2, sets:['k1','k2','k3'], n:0, keepAll:[1,2,3], keepTop:()=>ccInv22Quota(), seats:()=>INV2022_SEATS, order:0},
  'GC2023_DUOS.m1':{year:2023, size:2, sets:['e1'], n:1, list:()=>GC2023_DUOS.m1, order:1},
  'GC2023_DUOS.m2':{year:2023, size:2, sets:['e2'], n:2, list:()=>GC2023_DUOS.m2, order:2},
  'GC2023_DUOS.m3':{year:2023, size:2, sets:['e3'], n:3, list:()=>GC2023_DUOS.m3, order:3},
  'GC2023_DUOS.lcm':{year:2023, size:2, sets:['e3'], n:0, list:()=>GC2023_DUOS.lcm, order:4},
  GC2024_M1_DUOS:{year:2024, size:2, sets:['f1'], n:1, seats:()=>GC2024_M1_SEATS, order:1},
  GC2024_M2_DUOS:{year:2024, size:2, sets:['f2'], n:2, seats:()=>GC2024_M2_SEATS, order:2},
  GC2024_M3_DUOS:{year:2024, size:2, sets:['f3'], n:3, seats:()=>GC2024_M3_SEATS, order:3},
  GC2025_M1_TRIOS:{year:2025, size:3, sets:['t1'], n:1, seats:()=>GC2025_M1_SEATS, order:1},
  GC2025_M2_TRIOS:{year:2025, size:3, sets:['t2'], n:2, seats:()=>GC2025_M2_SEATS, order:2},
  GC2025_M3_TRIOS:{year:2025, size:3, sets:['t3'], n:3, seats:()=>GC2025_M3_SEATS, order:3}
};
// Регион настоящей строки списка — по карточке первого человека в наборах года.
function ccGcRowRegion(row, sets){
  const h=hKey(row[0]||'');
  const c=PLAYERS.find(p=>p && hKey(p.handle)===h && sets.indexOf(String(p.cardSet||''))>=0) || PLAYERS.find(p=>p && hKey(p.handle)===h);
  return (c && c.region) || 'EU';
}
function ccGcSeatsOf(spec){
  if(spec.seats) return Object.assign({}, spec.seats());
  const out={};
  (spec.list()||[]).forEach(r=>{ const g=ccGcRowRegion(r, spec.sets); out[g]=(out[g]||0)+1; });
  return out;
}
// Настоящие команды региона в наборах года: у тиммейтов одно событие и одно место.
function ccGcRegionTeams(spec, reg){
  const grp=new Map();
  spec.sets.forEach(set=>((typeof CARDS_BY_SETREG!=='undefined' && CARDS_BY_SETREG.get(set+'|'+reg))||[]).forEach(c=>{
    if(!c.placement) return;
    const k=set+'|'+(c.gfEvent||c.event||'')+'|'+c.placement;
    (grp.get(k)||grp.set(k, []).get(k)).push(c);
  }));
  const seen=new Set(), out=[];
  grp.forEach(cs=>{
    if(cs.length!==spec.size) return;
    const key=cs.map(c=>hKey(c.handle)).sort().join('+');
    if(seen.has(key)) return; seen.add(key);
    out.push({row:cs.map(c=>c.handle), pow:cs.reduce((s,c)=>s+(+c.rating||0), 0)/cs.length});
  });
  return out.sort((a,b)=>b.pow-a.pow);
}
function ccGcSimYear(year){
  const cr=CAREER.career;
  const box=cr.gcSim=(cr.gcSim && cr.gcSim.season===cr.season) ? cr.gcSim : {season:cr.season};
  if(box[year]) return box[year];
  const lists={}, taken=new Set();
  const names=Object.keys(CC_GC_SIM).filter(k=>CC_GC_SIM[k].year===year).sort((a,b)=>CC_GC_SIM[a].order-CC_GC_SIM[b].order);
  names.forEach(name=>{
    const spec=CC_GC_SIM[name], seats=ccGcSeatsOf(spec), rows=[];
    const F=spec.size===3 ? 33 : 50;
    Object.keys(seats).forEach(reg0=>{
      const reg=reg0==='?' ? 'EU' : reg0, need=seats[reg0];
      if(!need) return;
      const free=r=>!r.some(h=>taken.has(hKey(h)));
      let pick=[];
      // Снятая перед ЛАНом команда (ccLanDqRoll) в зал не едет.
      const ownOf=kept=>(kept && kept.season===cr.season && kept.reg===reg) ? (kept.rows||[]).filter(r=>r!=='you' && !(kept.dq && ccGcRowKey(r)===kept.dq.key)).map(r=>r.map(x=>typeof x==='string' ? x : x.h)) : [];
      if(spec.keepAll){
        // Роли: приглашение давал любой из трёх финалов сезона 2022 (верх по квоте ccInv22Quota) — берём их по порядку.
        spec.keepAll.forEach(k=>ownOf(cr.gfKeep && cr.gfKeep[year+'|'+k]).slice(0, spec.keepTop()).forEach(r=>{
          if(pick.length<need && free(r) && !pick.some(p=>p.join('+')===r.join('+'))) pick.push(r); }));
      } else if(spec.n){
        pick=ownOf(cr.gfKeep && cr.gfKeep[year+'|'+spec.n]).filter(free).slice(0, need);
      }
      // Квал региона — симуляцией по его сцене карьеры (его слово 12.10), не настоящими командами года.
      if(pick.length<need && spec.size===careerSquadSize()){
        let sim=null;
        try{ sim=ccLanSimRanked(reg, 'gc|'+name, [careerCard()].concat(careerMates()).filter(Boolean)); }catch(e){ sim=null; }
        (sim||[]).forEach(r=>{ const row=r.map(x=>x.h); if(pick.length<need && free(row)) pick.push(row); });
      }
      if(pick.length<need){
        const pool=ccGcRegionTeams(spec, reg).filter(t=>free(t.row) && !pick.some(p=>p.join('+')===t.row.join('+')));
        const rnd=careerRng(ccHashStr('gcsim|'+cr.season+'|'+name+'|'+reg));
        const top=pool.slice(0, F*2);
        for(let i=top.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=top[i]; top[i]=top[j]; top[j]=t; }
        const room=top.slice(0, F).map(t=>{ const tm=ccLanTeam(t.row, null, Math.round(t.pow), null); if(tm) tm._row=t.row; return tm; }).filter(Boolean);
        if(room.length){
          ccWithEventSize(spec.size, ()=>{
            room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
            ccWorldRun('gcsim|'+cr.season+'|'+name+'|'+reg, ()=>simulateGames(room, 12, ccM24Points, CC_M24_KILL));
          });
          ccM24Rank(room).forEach(t=>{ if(pick.length<need && free(t._row)) pick.push(t._row); });
        }
      }
      pick.forEach(r=>{ r.forEach(h=>taken.add(hKey(h))); rows.push(r); });
    });
    lists[name]=rows;
  });
  box[year]=lists;
  return lists;
}
// Список дороги: в карьере (внутри ccGcSimOn) — сыгранный, иначе — настоящий.
function ccGcList(name, real){
  if(!CC_GC_SIM_DEPTH || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return real;
  const spec=CC_GC_SIM[name]; if(!spec) return real;
  const l=ccGcSimYear(spec.year)[name];
  return (l && l.length) ? l : real;
}
function careerGlobalsField(you, drafted, via){
  if(ccIs2022()) return ccGcSimOn(()=>buildInvitational2022Field(you));
  if(ccIs2023()) return ccGcSimOn(()=>buildGlobalChampionship2023Field(you));
  if(ccIs2024()) return ccGcSimOn(()=>buildGlobalChampionship2024Field(you, drafted));
  /* 2025: Лион — 33 трио, поле уже собрано режимом драфта из настоящих
     составов Лиона (buildGlobalChampionship2025Field): места Мейджоров 1 и 2 —
     реальные трио, Мейджора 3 — по регионам; твоё место вытесняет одно. */
  if(ccIs2025()) return ccGcSimOn(()=>buildGlobalChampionship2025Field(you, ccCareerRegion(), null));
  /* ЗАЛ ОДИН НА КОМНАТУ ГОНКИ. Список занятых мест начинался со СВОЕГО состава: строка
     записи, в которой стоит мой человек, у меня из зала выпадала, а у соседа — нет, и
     Глобалы у двоих собирались разные (годовая проба на шестерых, 01.10: 17 строк из 50
     при одинаковом пуле). В гонке занято место КАЖДОГО человека комнаты — список у всех
     один, а сажает людей ccRaceFieldSync. careerCupField вычитает их сам (ccRaceAllCards).
     Одиночная карьера считает как считала. */
  const ccRace=(typeof ccRaceLock==='function' && ccRaceLock());
  const mineAll=ccRace ? drafted.concat((typeof ccRaceAllCards==='function' ? ccRaceAllCards() : []).filter(Boolean)) : drafted;
  const seated=new Set();
  mineAll.forEach(c=>{ if(c && c.handle) seated.add(_gcNorm(c.handle)); });
  const field=[];
  const add=(teams, route)=>teams.forEach(t=>{ t.gcRoute=route; field.push(t); });
  // The Summit's fifteen first, because the Summit happened first: a duo that
  // won its seat in May keeps it, and a later event's place rolls down to
  // somebody not going yet. That is the order the draft mode seats them in too.
  // Counted in this season's teams, so the three routes still add up to the
  // field rather than being cut off by the slice at the bottom. See ccTeams.
  /* Пятнадцать мест за Саммит — с ТОГО Саммита, который сыграли.

     Вопрос: «а глобалс и весь самит». Стоял статический список
     GC_SUMMIT_DUOS — те, кто прошёл в реальности, — и результат сыгранного
     Саммита в Антверпен не доезжал вовсе. Теперь финал Саммита оставляет свои
     пятнадцать строк (summitSeed.gc), и они читаются здесь.

     Список остаётся запасным: сейв, где Саммит ещё не играли (или играли до
     этой правки), должен собрать зал как собирал. */
  const sum=ccSummitCarry();
  const sumGc=(sum && Array.isArray(sum.gc) && sum.gc.length) ? sum.gc : null;
  if(sumGc){
    const teams=sumGc.filter(r=>r!=='you').map(ccStageTeamFrom)
      .filter(t=>{
        const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
        if(keys.some(k=>seated.has(k))) return false;
        keys.forEach(k=>seated.add(k));
        return true;
      });
    add(teams.slice(0, ccTeams(SUMMIT_GC_SLOTS)), 'summit');
  }
  /* Саммита в записи нет (карьера пришла после мая, или старый сейв) — места даёт Саммит, сыгранный
     симуляцией тем же залом, что у живого (careerSummitField), а не настоящий список GC_SUMMIT_DUOS
     (его слово 12.10: «все турниры от симуляции»). Список — запас вне карьеры. */
  const sumLeft=ccTeams(SUMMIT_GC_SLOTS)-field.length;
  const sumSim=sumLeft>0 ? ccLanSummitSim(drafted) : null;
  if(sumSim){
    const got=[];
    for(const row of sumSim){
      if(got.length>=sumLeft) break;
      const keys=row.map(x=>_gcNorm(x.h));
      if(keys.some(k=>seated.has(k))) continue;
      const t=ccStageTeamFrom(row); if(!t) continue;
      keys.forEach(k=>seated.add(k)); got.push(t);
    }
    add(got, 'summit');
  }
  else add(ccLanSeats(ccLanRowsReg(GC_SUMMIT_DUOS),
                 ccTeams(SUMMIT_GC_SLOTS)-field.length, null, seated), 'summit');
  /* Свой регион садится ТЕМ финалом Мейджора 2, который сыграли.

     Отзыв: «а глобалы все, мейджоры наверное можно добирать с
     регионов». Своё поле карьера играет сама, поэтому его девять мест берутся
     из записи (cr.gcSeed, пишет runCareerMajor). Чужие регионы читаются с их
     лидербордов, как читались: их Мейджоры нигде не играются.

     Записи нет — старый сейв или Мейджор 2 ещё впереди — и регион собирается
     прежним списком. */
  const gs=CAREER.career.gcSeed;
  const myGc=(gs && gs.season===CAREER.career.season &&
              gs.size===careerSquadSize() && Array.isArray(gs.m2)) ? gs : null;
  Object.keys(MAJOR2_GC_SLOTS).forEach(reg=>{
    const slots=ccTeams(MAJOR2_GC_SLOTS[reg]||0);
    if(myGc && myGc.reg===reg){
      const mine2=myGc.m2.filter(r=>r!=='you').map(ccMajorTeamFrom).filter(t=>{
        const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
        if(keys.some(k=>seated.has(k))) return false;
        keys.forEach(k=>seated.add(k));
        return true;
      }).slice(0, slots);
      add(mine2, 'm2');
      if(mine2.length<slots)
        add(ccLanSeats(gcRegionFinals('m2', reg), slots-mine2.length, reg, seated), 'm2');
      return;
    }
    /* Свой регион — сцена карьеры, даже когда Мейджор 2 ещё не сыгран.

       Продолжение того же вопроса: сильных трио на ЛАНе не
       видно. Замер (career-lan-duos-probe): из двадцати верхних пар сцены до
       Глобалов доезжало восемь, и первой пары — Scroll & Sky, 96 — среди них
       не было вовсе. Причина в списке: без записи (`gcSeed`) регион садился
       статическим GC_MAJOR2_DUOS — теми, кто прошёл в РЕАЛЬНОСТИ 2026 года, —
       а карьера весь сезон смотрит на свою сцену, где пары уже другие: год
       развёл кого-то (ccDuoBroken), кого-то развели результаты.

       Своё поле карьера играет сама, и то же правило уже стоит у Саммита
       (careerSummitField: своя квота — из careerCupField, чужие регионы — с
       их досок). Здесь оно теперь стоит и у Глобалов. Запись, когда она есть,
       по-прежнему главнее списка: сыгранный Мейджор 2 — это факт. */
    if(reg===ccCareerRegion()){
      add(ccLanSimSeats(reg, slots, drafted, seated, 'm2') || ccGcOwnSeats(slots, drafted, seated, 'gcM2'), 'm2');
      return;
    }
    // Симулированный Мейджор 2 региона (его слово 12.10: «все турниры от симуляции»). См. ccLanSimSeats.
    const sim=ccLanSimSeats(reg, slots, drafted, seated, 'm2');
    if(sim){ add(sim, 'm2'); return; }
    // Трио-год: своей сценой региона, а не списком 2026-го. См. ccLanAwaySeats.
    const away=ccLanAwaySeats(reg, slots, drafted, seated, 'gcM2');
    if(away){ add(away, 'm2'); return; }
    const real=ccLanSeats(ccLanRows(GC_MAJOR2_DUOS[reg]), slots, reg, seated);
    // A qualifier the career itself took — the player, or their partner — leaves
    // its region a seat short. It rolls down that region's own final, which is
    // what an unclaimed slot does.
    add(real, 'm2');
    if(real.length<slots)
      add(ccLanSeats(gcRegionFinals('m2', reg), slots-real.length, reg, seated), 'm2');
  });
  // The Last Chance, undecided: each region's own Major 2 leaderboard, top down —
  // и свой регион опять же своей сценой, а не доской 2026 года.
  Object.keys(GCLC_GC_SLOTS).forEach(reg=>{
    const n=ccTeams(GCLC_GC_SLOTS[reg]||0);
    // Ласт Ченс — свой симулированный квал у каждого региона, своего тоже.
    add(ccLanSimSeats(reg, n, drafted, seated, 'lcq') ||
        (reg===ccCareerRegion() ? ccGcOwnSeats(n, drafted, seated, 'gcLcq')
                                : (ccLanAwaySeats(reg, n, drafted, seated, 'gcLcq') || ccLanSeats(gcRegionFinals('m2', reg), n, reg, seated))), 'lcq');
  });
  // Your seat, taken off the route you won it on rather than added to the room.
  const route = via==='summit' ? 'summit' : via==='gclc' ? 'lcq' : 'm2';
  /* Место под себя выкупается у СВОЕГО маршрута — но только в одиночной карьере: маршрут у
     каждого свой, и в общей комнате у одного выпадала бы строка Саммита, у другого строка
     Мейджора. В гонке уходит последняя строка зала, одинаково у всех, а людей рассадит и
     подрежет ccRaceFieldSync. */
  const mine=ccRace ? [] : field.filter(t=>t.gcRoute===route);
  const drop=mine.length ? mine[mine.length-1] : field[field.length-1];
  if(drop) field.splice(field.indexOf(drop), 1);
  you.gcRoute=route;
  field.push(you);
  /* And the room is full.

     The three routes add up to the field on paper and not always in fact: a duo
     is skipped where the same person is already seated under another spelling —
     Liquipedia and Tracker write four of these people differently — and nothing
     replaced them, so Antwerp went out at forty-nine. His report, 20 August.

     What fills it is the same thing an unclaimed slot rolls down to: each
     region's own Major 2 board, then Major 1's, taken in finishing order across
     the regions until the plane is full. Marked 'lcq', because the Last Chance
     is the road that decides the seats nobody has claimed. */
  const want=ccGlobField();
  if(field.length<want){
    /* По кругу, по одному месту на регион за проход, — а не весь остаток
       первому в списке. Старая форма передавала want-field.length целиком в
       первый же вызов, и это была Европа: любая недостача самолёта улетала
       европейскими дуо с ярлыком Ласт Чанса. Жалоба игрока:
       «с ласт чанса одни ЕУ дуо без других регионов». */
    const regions=Object.keys(MAJOR2_GC_SLOTS);
    ['m2','m1'].forEach(set=>{
      let gave=true;
      while(field.length<want && gave){
        gave=false;
        regions.forEach(reg=>{
          if(field.length>=want) return;
          // Трио-год: добор из сцены региона (и своего тоже); дуо-год — с досок, как было.
          const got=ccLanSimSeats(reg, 1, drafted, seated, set) || ccLanAwaySeats(reg, 1, drafted, seated, 'gcFill') || ccLanSeats(gcRegionFinals(set, reg), 1, reg, seated);
          if(got.length){ add(got, 'lcq'); gave=true; }
        });
      }
    });
  }
  /* Лишние срезаются с хвоста, но не ты. Квоты регионов округляются ccTeams по отдельности, и в год
     сквадов (2027+, выбор формата) их сумма выходит больше 25: slice(0, want) отрезал последнюю строку,
     а последней стоял ты — «you.stageLog is not iterable» на Глобалах в Сингапуре (Notion 24.10.26). */
  while(field.length>want){
    let i=field.length-1;
    while(i>=0 && field[i]===you) i--;
    if(i<0) break;
    field.splice(i, 1);
  }
  return field;
}
// Antwerp's purse. GC2026_PRIZES rather than prizeTableFor('GC2026'), which
// branches on CARD_SET — a global the career does not set.
function gcPrize(place){
  const t=ccIs2022() ? INV2022_PRIZES : ccIs2023() ? GC2023_PRIZES : ccIs2024() ? GC2024_PRIZES : ccIs2025() ? GC2025_PRIZES : ((typeof GC2026_PRIZES!=='undefined' && GC2026_PRIZES) || null);
  return t ? (t[String(place)]||0) : 0;
}
async function runCareerGlobals(){
  const cr=CAREER.career;
  const ev=careerGlobalsOn(careerToday());
  if(!ev || !careerGlobalsCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('globals') : null;
  const seat=ccGlobalsSeat();
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('globals', ev.id||ev.label||'');
  careerLanArrive('globals', ev);
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
  // Fifty duos from all seven regions, off the three real qualification lists.
  const field=careerGlobalsField(you, drafted, seat && seat.via);

  const kindsForDrop=['summit','major','gclc'];
  const zones=null;
  // Форт-Уэрт 2024: «points multiplied by 1.5x on the second day» (Liquipedia, сверка 7.10) — как Гранд-финалы 2024-го.
  const gc24=ccCalYear()===2024;
  CC_M24_GAME=0;
  /* Финал — один на оба дня, все двенадцать игр разом. Метка календаря второго дня несёт «· Сессия 2», и над игрой
     читалось «Session 2: partie 12 sur 12» — как будто это вторая сессия по двенадцать (игрок, Notion 22.10). */
  const sessCut=' · '+L().calSession.split('{N}')[0];
  const stageNm=ev.label.lastIndexOf(sessCut)>0 ? ev.label.slice(0, ev.label.lastIndexOf(sessCut)) : ev.label;
  await simulateGamesLive(field, CC_GLOB_GAMES, gc24 ? ccM24PointsGf : majorPoints, gc24 ? ccM24KillGf : CC_GLOB_KILL,
    'stage', 0, null, zones,
    {twoDay:true, lobbySize:ccTeams(50), stageName:stageNm, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>{ CC_M24_GAME=g; return careerLandingPick(room||field, you, ev.label, kindsForDrop); }});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  removeSkipButton();

  const shell=createStageCardShell(ev.label+' — '+field.length);
  await revealStageLog(you, shell, true);
  // Призовое место Глобалов — зелёная плашка, как у карточки итога (было: только первое).
  finalizeStageCard(shell, place, field.length, you.stagePts, place===1 || gcPrize(place)>0, false,
    place===1 ? L().gcChampion : L().gcPlaceNote(place));
  // Из финала Глобалов не проходят никуда — «топ-10» здесь был той же ложной
  // линией, что и на финале Мейджора. Деньги показывает колонка призовых.
  await revealStandings(shell, ranked, you, 0, null, null, gcPrize, null, true);
  careerPrAdd(ranked, {div:1, kind:'globals'});

  careerMoneyAdd(ranked, gcPrize);
  const cash=gcPrize(place);
  if(cash){ const mine=ccShareOf(cash, you);
    ccPayIn(mine); }
  careerReachAdd(careerReachResult(place, field.length, 1, 'globals'));
  if(place===1) careerNews('good', 'ccNewsGlobChamp', []);
  careerNews(cash?'good':'flat', cash?'ccNewsGlobCash':'ccNewsGlobNoCash',
             cash?[place, ccNum(cash)]:[place, field.length],
             {tbl:ccStageShot(ranked, you, 1, ev.label)});
  careerNews('flat', 'ccPostThanks', [ev.label]);
  careerCongrats(ranked, you, L().ccCongratsGlobals(ccLanCityIn('globals')));
  cr.globals={place:place, of:field.length, via:seat?seat.via:null, cash:cash};

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:place, of:field.length,
               pts:you.stagePts, passed:cash>0, ovr:CAREER.player.ovr,
               games:CC_GLOB_GAMES, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'globals', stage:'final',
               won: ccStageSeatRow(ranked[0]), top: ccStageTop(ranked, you)});
  careerMonthGoalCheck();
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:place===1||cash>0,
    wins:you.wins||0, cash:cash, cut:0});
}

/* Посев хитов по местам Плей-Ина, как у Epic: змейка 1-2-3-3-2-1 по финишу, а не по силе.
   Пересчитать Плей-Ин нельзя: между ним и Хитами сцена подрастает и снимок может смениться, та же соль даст
   другой зал. Поэтому прошедшие пишутся в порядке финиша: настоящий ником (карточка берётся живая),
   выдуманный четырьмя числами, из которых собран. Около 150 строк, единицы КБ. Старый сейв сеется по силе. */
function ccMajorSeatRow(t){
  return (t.squad||[]).map(function(c){
    const a=attrsFor(c)||{};
    return (c && c.tier==='ladder')
      ? {h:c.handle, n:c.nat||null, o:Math.round(a.ovr||0), k:a.roleKey||null}
      : c.handle;
  });
}
/* ПОСЛЕ ПЕРЕЕЗДА (скрин 13): строки Мейджора, набранные на квалах в прошлом регионе, хранят ники того региона — в
   сцене нового их нет, и они становились безымянными заглушками («AS» вместо флага, рейтинг из полосы). Ник, который
   живёт в ДРУГОМ регионе, заменяется настоящим игроком сцены этого: по рейтингу сверху, без повторов, замена
   запоминается в сейве (cr.majSub) — перезагрузка и следующие этапы видят того же человека. Ушедшие из сцены совсем
   остаются, как были, заглушкой. Сбрасывается при переезде (careerMoveRegion). */
let CC_HANDLE_REGS=null;
function ccMajorRegionSub(handle){
  const cr=CAREER && CAREER.career, reg=ccCareerRegion(); if(!cr) return null;
  const k=hKey(handle);
  if(!CC_HANDLE_REGS){ CC_HANDLE_REGS=new Map(); (PLAYERS||[]).forEach(p=>{ const hk=hKey(p); if(!p.region) return; let st=CC_HANDLE_REGS.get(hk); if(!st) CC_HANDLE_REGS.set(hk, st=new Set()); st.add(p.region); }); }
  const regs=CC_HANDLE_REGS.get(k), elsewhere=!!regs && [...regs].some(r=>r!==reg);
  if(!elsewhere) return null;
  if(!cr.majSub || cr.majSub.reg!==reg) cr.majSub={reg:reg, map:{}, used:{}};
  const S=cr.majSub, roster=ccSceneRoster(reg);
  let h=S.map[k];
  if(!h){
    const taken=new Set(Object.keys(S.used));
    // И не свои: напарник в чужой команде — тот же человек дважды в лобби.
    try{ (careerMates()||[]).forEach(m=>taken.add(hKey(m))); taken.add(hKey(CAREER.player.handle||CAREER.player.nick||'')); }catch(e){}
    // Не тот, кто уже стоит в строках этого сезона живым ником: свой регион их и так покажет.
    const pick=roster.slice().sort((a,b)=>(b.rating||0)-(a.rating||0)).find(x=>!taken.has(hKey(x)) && !ccMajorRowHas(cr, hKey(x)));
    if(!pick) return null;
    h=pick.handle; S.map[k]=h; S.used[hKey(pick)]=1;
  }
  return roster.find(x=>hKey(x)===hKey(h)) || null;
}
// Стоит ли ник в каком-нибудь сохранённом состоянии Мейджоров сезона (поиском по JSON — состояния небольшие).
function ccMajorRowHas(cr, key){
  if(!cr.__majRowsAt || cr.__majRowsAt!==careerToday()){
    let blob='';
    Object.keys(cr).forEach(n=>{ if(/^major\d|^m2\d|^gr2|^summit|^gc/i.test(n)) try{ blob+=JSON.stringify(cr[n]); }catch(e){} });
    Object.defineProperty(cr, '__majRowsBlob', {value:blob.toLowerCase(), writable:true, configurable:true, enumerable:false});
    Object.defineProperty(cr, '__majRowsAt', {value:careerToday(), writable:true, configurable:true, enumerable:false});
  }
  return cr.__majRowsBlob.indexOf('"'+key+'"')>=0;
}
function ccMajorCardFrom(rec){
  if(typeof rec==='string'){
    const c=ccSceneRoster(ccCareerRegion()).find(x=>hKey(x)===hKey(rec));
    if(c) return c;
    const sub=ccMajorRegionSub(rec);
    if(sub) return sub;
    // Ника больше нет в сцене — человек всё равно играл, и его место не пустует.
    rec={h:rec, n:null, o:ccBand(1), k:null};
  }
  const r=clamp(Math.round(rec.o||ccBand(1)), 35, ccGenTop());
  return {handle:rec.h, nat:rec.n||null, region:ccCareerRegion(), org:null,
          tier:'ladder', event:L().ccLadderEvent, date:'-', placement:null,
          rating:r, _targetOvr:r, _attrs:ccRookieAttrs(r, rec.k||'roleFRG')};
}
// Тем же правилом, что ccStageTeamFrom: сборка из записи не берёт бросков вечера.
/* Записи прошедших -> команды раунда. В гонке своя строка пишется никами, а не 'you' (ccSeedRow при ccRaceSeeds:
   запись общая на всех), и при сборке следующего раунда она становилась отдельной командой-копией меня, а я добавлялся
   ещё раз: у каждого гонщика свой двойник, разная раскладка комнат, и сосед ждал ответов того, кого у себя не посадил
   (онлайн-прогон 2019 года, 21.10: Season X 3.11, третий раунд, «Your partner never reached the question»).
   Строка с моим ником — я, один раз. */
function ccStageRowsOf(rows, you){
  let mk=''; try{ mk=hKey(careerCard()||{handle:''}); }catch(e){}
  const mine=r=>!!mk && Array.isArray(r) && r.some(x=>hKey(typeof x==='string' ? x : (x && x.h) || '')===mk);
  let used=false;
  return (rows||[]).map(r=>{ if(r==='you' || mine(r)){ if(used) return null; used=true; return you; } return ccMajorTeamFrom(r); }).filter(Boolean);
}
function ccMajorTeamFrom(row){
  return ccRaceUnseeded(function(){
    const cards=row.map(ccMajorCardFrom);
    const t=careerTeam(cards);
    t.name=teamLabel(cards);
    return t;
  });
}
/* Финал Мейджора садится из тех же составов, что играли Плей-Ин и Хиты.
   careerSeed сеется неделей, а Хиты (24-26 июля) и финал (1-2 августа) в разных
   неделях, так что новый careerCupField перетасовывал пары, и призы уходили
   несуществующим командам. Берём cr.majorSeed (~150 составов в порядке финиша,
   см. ccMajorSeatRow): сначала прошедшие свой хит, остальное верх по силе.
   Сейв без записи (или вход через Ласт Ченс мимо Плей-Ина) играет по-старому. */
function ccMajorFinalRoom(you, lobbyCr, drafted, ev, st, sharp){
  const s=CAREER.career.majorSeed;
  const rows=ccMajorSeedRows(ev);
  // Финал, куда пришёл через Ласт Ченс без Плей-Ина: сидят те, кого мир посадил (ccMajorWorldSeat).
  const world=!rows && s && s.world && s.n===ev.n && s.season===CAREER.career.season;
  if(!rows && !world) return [you, ...careerCupField(lobbyCr, drafted, st.field, null, false, sharp)];
  const seen=new Set([ccSeatKey(you)]);
  /* Один человек — одна команда. Ключ всей команды пропускал ту же тройку с другим четвёртым (запись прошедших,
     дописанная до и после «Переиграть день», ладдер-четвёртый другой): Crue, Pez1x, Hanckee сидели в финале трижды. */
  const ppl=new Set((you.squad||[]).map(c=>hKey(c)));
  const take=[];
  const add=t=>{ const k=ccSeatKey(t); if(seen.has(k)) return;
    const ks=(t.squad||[]).map(c=>hKey(c)); if(ks.some(x=>ppl.has(x))) return;
    seen.add(k); ks.forEach(x=>ppl.add(x)); take.push(t); };
  ((s && s.through) || []).forEach(r=>{ if(r!=='you') add(ccMajorTeamFrom(r)); });
  const qual=take.length;
  (rows||[]).filter(r=>r!=='you').map(ccMajorTeamFrom)
      .sort((a,b)=>(b.pow||0)-(a.pow||0))
      .forEach(t=>{ if(take.length<st.field-1) add(t); });
  // Полуторасотни на пятьдесят мест хватает с запасом; если запись короче
  // (старый сейв трио-сезона), остаток добирается как раньше.
  const short=st.field-1-take.length;
  const fill=short>0 ? careerCupField(lobbyCr, drafted.concat(
      [].concat(...take.map(t=>t.squad||[]))), short+1, 'majFin', false, sharp) : [];
  CC_MAJOR_FIN_QUAL=qual;
  return [you, ...take, ...fill];
}
// Сколько мест финала занято теми, кто прошёл свой хит на глазах игрока.
// Читает только проверка — см. tools/check-career-major-final.js.
let CC_MAJOR_FIN_QUAL=0;
// Посев этого Мейджора, если он записан ЭТИМ сезоном и в ЭТОМ составе.
function ccMajorSeedRows(ev){
  const s=CAREER.career.majorSeed;
  if(!s || s.n!==ev.n || s.season!==CAREER.career.season) return null;
  if(s.size!==careerSquadSize()) return null;
  if(!Array.isArray(s.rows) || s.rows.length<ccMajorHeats()) return null;
  return s.rows.indexOf('you')>=0 ? s.rows : null;
}

// ==== FNCS 2019–2020 machine (tools/splice-2019.js) ====
/* ---- Сезоны 2019-го и 2020-го — формат меняется внутри года ------------------------
   2019: World Cup Solo и Duos (недели Online Open, финалы в Нью-Йорке), FNCS Season X (трио),
   FNCS Chapter 2 Season 1 (сквады). 2020: FNCS C2S2 (трио), C2S3 (соло), C2S4 (трио).
   Состав года — самый большой формат года; вечер идёт в своём формате (ccWithEventSize):
   соло — один, дуо — с первым тиммейтом. Спеки — CC_MX_SPEC (вклеивается с календарём).

   Неделя (или квалификатор) — раунды по вечерам: открытые раунды не хранят зал (только
   «прошёл»), закрытый — из записанного верха прошлого раунда. Последний раунд недели даёт
   очки серии (место в финале недели). У World Cup очков серии нет: верх недели по квоте
   региона (WC2019_QUOTA) — сразу в финал Нью-Йорка, и дальше недели уже не нужны.
   После недель — хиты из серии змейкой (план хитов в спеке), потом финал. */
/* Имя сезона-«Мейджора» для лет, когда Мейджоров не было: 2019–2020 — из спеки, 2021 — FNCS C2S5–C2S8
   и Grand Royale, 2022 — FNCS C3S1–C3S3. Для 2023+ — null (там это и есть Мейджоры). */
function ccSeasonEvName(y, n){
  if(y===2022) return 'FNCS C3S'+n;
  if(y===2021) return n===5 ? 'FNCS Grand Royale' : 'FNCS C2S'+(n+4);
  const sp=ccMXSpec(y, n); return sp ? sp.name : null;
}
function ccMXSpec(y, n){ return (CC_MX_SPEC[y]||{})[n] || null; }
function ccMXLobby(size){ return size===1 ? 100 : size===2 ? 50 : size===3 ? 33 : 25; }
/* Своё состояние у каждого турнира сезона (cr.majorxs[y|n]). Была одна ячейка cr.majorx на всех:
   недели World Cup Solo и Duos чередуются, и первая же сыгранная неделя Duos затирала состояние Solo
   вместе с билетом в Нью-Йорк (его правка 29.09: «квальнулся в финал ворлд капа и не сыграл его»).
   cr.majorx по-прежнему указывает на последний сыгранный — для старых сейвов и чтения. */
function ccMXOf(y, n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const all=cr.majorxs=cr.majorxs||{};
  const old=cr.majorx; if(old && old.y!=null && !all[old.y+'|'+old.n] && old.season===cr.season) all[old.y+'|'+old.n]=old;
  const m=all[y+'|'+n];
  return (m && m.season===cr.season) ? m : null;
}
function ccMXState(y, n){
  const cr=CAREER.career;
  let m=ccMXOf(y, n);
  if(!m){ m={y:y, n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, heats:null, heatRes:{}, youKey:null, ticket:false};
          cr.majorxs[y+'|'+n]=m;
          /* Сейв, где билет затёрла чужая неделя: журнал помнит пройденный финал недели World Cup
             (день воскресенья этой недели, тот же размер состава, «прошёл») — билет возвращается. */
          const sp=ccMXSpec(y, n);
          if(sp && sp.kind==='wc'){
            const days=new Set((sp.weeks||[]).map(w=>ccMXDayOf(y, n, 'W'+w+'R'+sp.rounds.length)).filter(Boolean));
            m.ticket=(cr.log||[]).some(e=>e && e.kind==='major' && e.passed && e.season===cr.season && e.size===sp.size && days.has(e.day));
          } }
  cr.majorx=m;
  return m;
}
function ccMXRowId(y, n, tail){ return 'Major'+n+'_'+y+'_'+tail; }
function ccMXDayOf(y, n, tail){
  const row=ccYearRows().find(r=>r[2]===ccMXRowId(y, n, tail));
  return row ? row[0] : null;
}
function ccMXWeekEnd(y, n, w){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf(ccMXRowId(y, n, 'W'+w+'R'))===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
// Команда — по никам, а не по всей записи: у игроков лестницы в записи рейтинг, и за неделю он сдвигается — одна команда
// выглядела двумя и могла сесть в хиты дважды (сверка 7.10).
const ccMXKey=r=>r==='you' ? 'you' : (Array.isArray(r) ? r : [r]).map(c=>hKey((c && c.h) || c)).sort().join('+');
/* ПРЯМЫЕ МЕСТА НЕДЕЛИ (Liquipedia, его вопрос 7.10 «2019 по очкам за несколько недель?»): финал каждой недели сам
   отправляет свой верх в хиты — Season X «Top 8 trios», C2S1 «Top 10 squads», C2S2 «Top 20 duos», C2S3 «Top 50
   players», C2S4 «Top 15 teams»; уже прошедший отдаёт место следующему. Остаток хитов — «top performers that didn't
   qualify», то есть сумма очков недель (m.series). Раньше всё поле хитов шло только по сумме. */
const CC_MX_WEEK_DIRECT={h3:8, h4:10, i1:20, i2:50, i3:15};
function ccMXSeriesAdd(m, ranked, rowOf, w){
  if(w!=null){ (m.wf=m.wf||{})[w]=ranked.map(rowOf); m.heats=null; }
  const n=ranked.length;
  ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+(n-i); if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t); });
}
/* ТАБЛИЦА НЕДЕЛИ = ФИНАЛ, ПОТОМ ПОЛУФИНАЛ (его вопрос 7.10 «а типо если не квал»). Очки недели — не только финалистам:
   «top performers» Epic — это и полуфиналисты. Без этого не прошедший полуфинал игрок получал за неделю ноль, а мир —
   очки. Финалисты — по месту в финале, дальше полуфиналисты по месту в полуфинале (Q.semi — твой настоящий
   полуфинал, если ты его играл), до размера ccMXWeekSize. */
function ccMXWeekCut(sp){ const R=sp.rounds.length, F=ccMXLobby(sp.size); return (R>1 && sp.rounds[R-2].cut) || F; }
function ccMXWeekSize(sp){ const F=ccMXLobby(sp.size); return Math.max(F, (sp.heats||[]).length*F, 2*ccMXWeekCut(sp)); }
function ccMXSemiTail(m, Q, keys, size, list){
  ((Q && Q.semi)||[]).forEach(r=>{
    if(list.length>=size) return;
    const key=r==='you' ? m.youKey : ccSeatKey(ccMajorTeamFrom(r));
    if(!key || keys.has(key)) return;
    keys.add(key); list.push({key, row:r});
  });
}
function ccMXSeriesAddList(m, list, w, nFinal){
  (m.wf=m.wf||{})[w]=list.slice(0, nFinal).map(x=>x.row); m.heats=null;
  const n=list.length;
  list.forEach((x,i)=>{ m.series[x.key]=(m.series[x.key]||0)+(n-i); if(!m.seriesRows[x.key]) m.seriesRows[x.key]=x.row; });
}
function ccMXSeriesRank(m, key){
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
// Квота World Cup: мест в Нью-Йорк с одной недели у региона карьеры.
function ccMXWcQuota(sp){
  const t=(typeof WC2019_QUOTA!=='undefined' && WC2019_QUOTA[sp.set]) || {};
  let r=careerPrizeRegion(); if(t[r]==null && r==='NAW') r='NAC';
  return Math.max(1, t[r]||1);
}
function ccMXWorld(y, n, size, salt){
  return ccWithEventSize(size, ()=>ccM23World(size+20, salt));
}
// Неделя, досчитанная молча: финал недели — сильные сцены; в серию (World Cup — без серии).
function ccMXSettleWeek(m, w){
  const sp=ccMXSpec(m.y, m.n), Q=m.q[w]=m.q[w]||{};
  if(Q.done || sp.kind==='wc') return;
  const end=ccMXWeekEnd(m.y, m.n, w);
  if(!end || careerToday()<=end) return;
  const R=sp.rounds.length, last=sp.rounds[R-1], F=ccMXLobby(sp.size);
  /* ФИНАЛ НЕДЕЛИ — ВЕСЬ, А НЕ ОДНО ЛОББИ (его вопрос 7.10 «а очки считаются у всех?»). Был срез до одного лобби (33
     трио), и почти каждую неделю — одни и те же сильнейшие: за пять недель Season X очки набрали 37 команд на 132
     места в хитах, остальные 95 добирались сценой без очков. У Epic в финал недели выходит отсечка полуфинала —
     Season X «Top 150 trios will advance to Finals», C2S1 — 25 сквадов; играется лобби по F, таблица общая. */
  /* И не меньше всего поля хитов: приглашённые — «top performers» сезона, их очки идут и из полуфиналов недели, а финал
     у C2S1/2020 — 25–100 команд. Без этого очки за недели были у 43 из 100 (C2S1), 58 из 200 (C2S2), 118 из 400 (C2S3),
     39 из 132 (C2S4), остальное поле хитов садилось без очков. Модель режима: таблица недели мира = полуфинал+финал. */
  const size=ccMXWeekSize(sp), cut=ccMXWeekCut(sp);
  ccWithEventSize(sp.size, ()=>{
    let finals=(Q['r'+(R-1)]||[]).filter(r=>r!=='you').map(ccMajorTeamFrom), semis=null;
    const seen=new Set(finals.map(ccSeatKey));
    if(!finals.length && !Q.semi){
      // Неделю не играл никто из людей: полуфинал мира (лобби по F), его верх — в финал.
      /* Зал недели — не одни и те же каждую неделю: верхняя половина — сильнейшие, остальное — жребий недели из круга
         втрое шире. Иначе в 2020 очки получали ровно 200/400 команд — ровно поле хитов, и проходил любой с очком. */
      const wide=ccM23World(size*3, 'mx|'+m.y+'|'+m.n+'|'+w), half=Math.ceil(size/2), rnd=careerRng(ccHashStr('mxpool|'+m.season+'|'+m.y+'|'+m.n+'|'+w));
      const rest=wide.slice(half);
      for(let i=rest.length-1; i>0; i--){ const j=Math.floor(rnd()*(i+1)); const tmp=rest[i]; rest[i]=rest[j]; rest[j]=tmp; }
      const pool=wide.slice(0, half).concat(rest).slice(0, size);
      pool.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWorldRun('mxs|'+m.season+'|'+m.y+'|'+m.n+'|'+w, ()=>splitIntoLobbies(pool, F).forEach(l=>simulateGames(l, sp.rounds[Math.max(0, R-2)].games, ccM24Points, CC_M24_KILL)));
      semis=ccM24Rank(pool); finals=semis.slice(0, cut); finals.forEach(t=>seen.add(ccSeatKey(t)));
    } else if(finals.length<cut){
      ccM23World(cut+20, 'mx|'+m.y+'|'+m.n+'|'+w).forEach(t=>{ if(finals.length>=cut || seen.has(ccSeatKey(t))) return; seen.add(ccSeatKey(t)); finals.push(t); });
    }
    finals.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWorldRun('mxq|'+m.season+'|'+m.y+'|'+m.n+'|'+w, ()=>splitIntoLobbies(finals, F).forEach(l=>simulateGames(l, last.games, ccM24Points, CC_M24_KILL)));
    const fr=ccM24Rank(finals), list=fr.map(t=>({key:ccSeatKey(t), row:ccMajorSeatRow(t)})), keys=new Set(list.map(x=>x.key));
    if(semis) semis.forEach(t=>{ const k=ccSeatKey(t); if(list.length>=size || keys.has(k)) return; keys.add(k); list.push({key:k, row:ccMajorSeatRow(t)}); });
    else ccMXSemiTail(m, Q, keys, size, list);
    if(list.length<size) ccM23World(size*2, 'mxt|'+m.y+'|'+m.n+'|'+w).forEach(t=>{ const k=ccSeatKey(t); if(list.length>=size || keys.has(k)) return; keys.add(k); list.push({key:k, row:ccMajorSeatRow(t)}); });
    ccMXSeriesAddList(m, list, w, fr.length);
  });
  Q.done=true;
}
function ccMXSettleWeeks(m){ (ccMXSpec(m.y, m.n).weeks||[]).forEach(w=>ccMXSettleWeek(m, w)); }
// Кто сейчас в поле хитов: прямые места недель по порядку недель, потом сумма очков. Без кэша — для плашки недели.
function ccMXHeatList(m){
  const sp=ccMXSpec(m.y, m.n), plan=sp.heats||[], F=ccMXLobby(sp.size);
  const need=plan.length*F, direct=CC_MX_WEEK_DIRECT[sp.set]||0;
  const list=[], seen=new Set();
  const push=r=>{ const key=ccMXKey(r); if(list.length>=need || seen.has(key)) return false; seen.add(key); list.push(r); return true; };
  if(direct) (sp.weeks||[]).forEach(w=>{ let got=0; ((m.wf||{})[w]||[]).forEach(r=>{ if(got<direct && push(r)) got++; }); });
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>push(m.seriesRows[k]));
  return {list, need};
}
function ccMXHeats(m){
  /* Сначала досчитать прошедшие недели, потом отдавать кэш: спрошенное посреди сезона поле хитов запоминалось без
     последних недель (замер 7.10: недели 3–5 Season X — 0 из 8 прямых мест). Новая неделя сбрасывает кэш
     (ccMXSeriesAdd с номером недели). */
  ccMXSettleWeeks(m);
  if(m.heats) return m.heats;
  const sp=ccMXSpec(m.y, m.n), plan=sp.heats||[], F=ccMXLobby(sp.size);
  const H=plan.length, need=H*F;
  const pre=ccMXHeatList(m), list=pre.list, seen=new Set(list.map(ccMXKey));
  const push=r=>{ const key=ccMXKey(r); if(list.length>=need || seen.has(key)) return; seen.add(key); list.push(r); };
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>push(m.seriesRows[k]));
  if(list.length<need) ccWithEventSize(sp.size, ()=>ccM23World(need*2, 'mxh|'+m.y+'|'+m.n).forEach(t=>push(ccMajorSeatRow(t))));
  const heats=plan.map(h=>({day:h.day, cut:h.cut, rows:[]}));
  list.forEach((r,i)=>{ const round=Math.floor(i/H), pos=i%H; heats[round%2 ? H-1-pos : pos].rows.push(r); });
  m.heats=heats; m.heatRes={};
  return heats;
}
function ccMXSettleHeats(m){
  const sp=ccMXSpec(m.y, m.n);
  if(!(sp.heats||[]).length) return;
  ccMXHeats(m).forEach((h,i)=>{
    if(m.heatRes[i] || !h.rows.length) return;
    const day=ccMXDayOf(m.y, m.n, 'Heat'+h.day);
    if(!day || careerToday()<=day) return;
    ccWithEventSize(sp.size, ()=>{
      const room=h.rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWorldRun('mxh|'+m.season+'|'+m.y+'|'+m.n+'|'+i, ()=>simulateGames(room, sp.heatGames||6, ccM24Points, CC_M24_KILL));
      const ranked=ccM24Rank(room);
      m.heatRes[i]={up:ranked.slice(0, h.cut).map(ccMajorSeatRow), rest:ranked.slice(h.cut).map(ccMajorSeatRow)};
    });
  });
}
function ccMXYourHeat(m, d){ return ccMXHeats(m).findIndex(h=>h.day===d && ccSeedHasMe(h.rows)); }
// Финал: World Cup — настоящие финалисты Нью-Йорка; FNCS — прошедшие хиты, недобор по серии.
/* ФИНАЛ WORLD CUP — ИЗ СЫГРАННЫХ НЕДЕЛЬ (его слово 29.09: «пусть из нашей симуляции игроки попадают,
   которые квальнутся недель», «и так должно быть на всех турнирах»). Был готовый список настоящих
   финалистов Нью-Йорка (WC2019_FIELD). Теперь каждая неделя Online Open каждого региона — комната
   финала недели из настоящих карточек World Cup этого региона (дуо — реальными парами из истории),
   сыгранная движком; путёвки — верх таблицы по квоте региона (WC2019_QUOTA, приведённой к размеру
   финала), уже прошедшие путёвку не занимают. Свой регион в сыгранную неделю — твоя таблица (ccMXRun).
   Комнаты считаются один раз после конца недели и лежат в сейве (m.wcq), так что финал не меняется. */
function ccMXWcRowKey(r){ return r==='you' ? 'you' : (Array.isArray(r) ? r : [r]).map(x=>hKey(typeof x==='string' ? x : x.h)).sort().join('+'); }
function ccMXWcTaken(m, before){
  const out=new Set(), W=m.wcq||{};
  Object.keys(W).forEach(w=>{ if(before!=null && +w>=before) return; Object.values(W[w]).forEach(rows=>(rows||[]).forEach(r=>out.add(ccMXWcRowKey(r)))); });
  return out;
}
function ccMXWcPool(sp, reg){
  const cards=(typeof CARDS_BY_SETREG!=='undefined' && CARDS_BY_SETREG.get(sp.set+'|'+reg)||[]).slice().sort((a,b)=>(b.rating||0)-(a.rating||0));
  const row=c=>({h:c.handle, n:c.nat||null, o:Math.round(c.rating||0), k:(attrsFor(c)||{}).roleKey||null});
  if(sp.size===1) return cards.map(c=>[row(c)]);
  // Дуо — настоящими парами World Cup: у пары в карточках одно событие и одно место (Benjyfishy и
  // MrSavage — оба 1-е в Online Open Europe). Остальные — соседями по рейтингу.
  const used=new Set(), out=[], grp=new Map();
  cards.forEach(c=>{ const k=(c.gfEvent||c.event||'')+'|'+(c.placement||''); if(!c.placement) return; (grp.get(k)||grp.set(k, []).get(k)).push(c); });
  grp.forEach(cs=>{ if(cs.length!==sp.size || cs.some(c=>used.has(hKey(c.handle)))) return; cs.forEach(c=>used.add(hKey(c.handle))); out.push(cs.map(row)); });
  const rest=cards.filter(c=>!used.has(hKey(c.handle)));
  for(let i=0; i+sp.size-1<rest.length; i+=sp.size) out.push(rest.slice(i, i+sp.size).map(row));
  return out.sort((a,b)=>b.reduce((s,x)=>s+x.o,0)-a.reduce((s,x)=>s+x.o,0));
}
function ccMXWcRows(m, sp){
  const Q=(typeof WC2019_QUOTA!=='undefined' && WC2019_QUOTA[sp.set]) || null;
  if(!Q || !sp.weeks) return null;
  const F=ccMXLobby(sp.size), regs=Object.keys(Q);
  const total=regs.reduce((s,r)=>s+Q[r], 0)*sp.weeks.length;
  const q=r=>Math.max(1, Math.round(Q[r]*F/total));
  const W=m.wcq=m.wcq||{};
  const R=sp.rounds.length, games=sp.rounds[R-1].games;
  const out=[];
  sp.weeks.forEach(w=>{
    const end=ccMXWeekEnd(m.y, m.n, w);
    if(!end || careerToday()<=end && !(W[w] && Object.keys(W[w]).length)) return;
    const Ww=W[w]=W[w]||{};
    regs.forEach(reg=>{
      if(!Ww[reg] && careerToday()>end){
        const taken=ccMXWcTaken(m, w);
        const pool=ccMXWcPool(sp, reg).filter(r=>!taken.has(ccMXWcRowKey(r)));
        const rnd=careerRng(ccHashStr('wcq|'+m.season+'|'+m.n+'|'+w+'|'+reg));
        const top=pool.slice(0, F*2);
        for(let i=top.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=top[i]; top[i]=top[j]; top[j]=t; }
        const room=top.slice(0, F).map(r=>{ const t=ccMajorTeamFrom(r); t._row=r; return t; });
        if(room.length){
          ccWithEventSize(sp.size, ()=>{
            room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
            ccWorldRun('wcq|'+m.season+'|'+m.n+'|'+w+'|'+reg, ()=>simulateGames(room, games, ccM24Points, CC_M24_KILL));
          });
          Ww[reg]=ccM24Rank(room).slice(0, q(reg)).map(t=>t._row);
        } else Ww[reg]=[];
      }
      (Ww[reg]||[]).forEach(r=>out.push(r));
    });
  });
  if(m.ticket && !out.includes('you')) out.unshift('you');
  return out.length ? out : null;
}
function ccMXGfRows(y, n, m){
  const sp=ccMXSpec(y, n), F=sp.finalN||ccMXLobby(sp.size), out=[], seen=new Set();
  const add=r=>{ const k=ccMXKey(r); if(!r || seen.has(k) || out.length>=F) return; seen.add(k); out.push(r); };
  // World Cup: финал — те, кто взял путёвки сыгранных недель (ccMXWcRows); без карьеры — настоящий список.
  if(sp.kind==='wc'){ ((m ? ccMXWcRows(m, sp) : null) || (typeof WC2019_FIELD!=='undefined' && WC2019_FIELD[sp.set]) || []).forEach(add); return out; }
  if(!m) return out;
  ccMXSettleWeeks(m); ccMXSettleHeats(m);
  ccMXHeats(m).forEach((h,i)=>((m.heatRes[i]||{}).up||[]).forEach(add));
  if(sp.wild){ const w=ccMXWildWinner(m, sp); if(w) add(w); }
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccMXWorldFinalRoom(y, n, drafted, lobbyCr){
  const sp=ccMXSpec(y, n), F=sp.finalN||ccMXLobby(sp.size);
  const rows=ccMXGfRows(y, n, ccMXOf(y, n));
  const room=rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<F){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, F+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=F || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, F);
}
function ccMXCanStage(ev, cr, gaveUp){
  const sp=ccMXSpec(ev.yx, ev.n); if(!sp) return false;
  const s=ccMXOf(ev.yx, ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    /* World Cup 2019: прошедшие в Нью-Йорк играли следующие недели Online Open ради призовых (его слово 29.09:
       «почему week 3 соло не играется, можно же играть, даже если квал»). Вторую путёвку неделя не даёт — она уже есть.
       FNCS-недели после путёвки закрыты, как было. */
    if(s && s.ticket && sp.kind!=='wc') return false;
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.w] && s.q[ev.w]['r'+(first-1)];
    return ccSeedHasMe(prev);
  }
  if(ev.stage==='heat'){
    if(!s || s.ticket || !s.youKey) return false;
    ccMXSettleHeats(s);
    return ccMXYourHeat(s, ev.r)>=0;
  }
  // Гранд-финал — с путёвкой; C2S4 — и с местом в Wildcard (9–16-е в хите): тот же вечер, сначала один матч.
  return !gaveUp && !!(s && (s.ticket || (sp.wild && s.wild && !s.wildRes)));
}
async function runCareerMajorMX(){
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.yx || !careerMajorCan(ev)) return;
  const sp=ccMXSpec(ev.yx, ev.n);
  const prevEv=CC_EVENT_SIZE;
  CC_EVENT_SIZE=sp.size;
  /* СОЛО-МЕЙДЖОР ВДВОЁМ — ЛИЧНЫЙ ВЕЧЕР (живой прогон двоих 30.09: неделя World Cup Solo 2019 не
     доигрывалась вовсе — каждый клиент ставил в поле себя одного, таблицы расходились с первой игры,
     вечер вставал). Открытые квалы World Cup и соло-FNCS 2020 каждый играет сам, как в жизни —
     в разных лобби; в хитах двое и так в разных комнатах. Итог (журнал, рост, деньги) — свой, день
     шагает, когда отыграли оба или второму сегодня нечего (ccMXTeamSettle). */
  /* КВАЛЫ СОЛО-НЕДЕЛИ ВДВОЁМ — ОДНО ЛОББИ (Notion 21.10, двое играли командой: «на квалах соло ворлд кап нет
     реализма, кнопка 0/2 не работает, ты соло запускаешься, таблицы всегда разные и непонятно, кто квальнулся»).
     Если сегодня квал недели могут играть оба (ccMXSharedOk), вечер общий, как соло-кап вдвоём: гейт «0/2», один сид,
     оба в одной сотне своими адресами, у каждого своя высадка; прошёл раунд один — дальше врозь (ccTeamNightApart).
     Хиты и финал Мейджора, и день, когда второму играть нечего, — как было, личным вечером. День после вечера
     шагает по-прежнему через mxDone (ccMXTeamSettle). */
  const soloTeam=sp.size===1 && ccMpTeam();
  // Отметка напарника на сегодня могла ещё не доехать (перемотка у одного быстрее) — решаем, дождавшись её.
  if(soloTeam && ev.stage==='q') await ccMXPeerFlagWait();
  const shared=soloTeam && ccMXSharedOk(ev);
  if(soloTeam){ if(!shared) CC_MP_ALONE=true; CC_MX_SOLO_RUN=true; CC_MX_SHARED=shared; CC_MX_GATE_OFF=false; }
  try{
    try{ await ccMXRun(ev, sp, soloTeam); }
    catch(e){
      /* Ворота общего квала отменены — напарник свой уже сыграл врозь (см. ccMpApplyRemote). Вечер не начинался
         (ворота — первая строка раннера): играем его тут же, лично. */
      if(!(shared && CC_MX_GATE_OFF)) throw e;
      CC_MX_GATE_OFF=false; CC_MX_SHARED=false; CC_MP_ALONE=true;
      await ccMXRun(ev, sp, soloTeam);
    }
  }
  finally{
    CC_EVENT_SIZE=prevEv;
    if(soloTeam){
      CC_MX_SOLO_RUN=false; CC_MP_ALONE=false; CC_MP_HOLD=false; CC_MX_SHARED=false;
      if(shared) CC_MP_DAY_DUE=false;   // общий вечер закрыт сервером, но день и тут двигает ccMXTeamSettle
      /* Разошлись посреди общего квала (прошёл один из двоих) — сервер вечер не закрывал (ccMpClose врозь пропускается),
         и сид вечера оставался включён: ccMXTeamSettle при нём не шагает, перемотка вставала (онлайн-прогон 2020, 22.10:
         FNCS C2S3 квал 1, раунды 1–2 в один вечер, 1.08). Вечер кончен — генератор вкладки возвращается себе. */
      if(shared) ccMpSeedOff();
      const cr=CAREER.career, me=hKey(careerCard());
      // Ворота отменены (напарник сыграл свой квал врозь) — вечера не было, отметки нет: «Играть» ещё раз — лично.
      if(!CC_MX_GATE_OFF) (cr.mxDone=cr.mxDone||{})[me]=careerToday();
      CC_MX_GATE_OFF=false;
      careerSave();
      ccMXTeamSettle();
    }
  }
}
let CC_MX_SHARED=false, CC_MX_GATE_OFF=false;
// Своя отметка «сегодня могу играть квал соло-недели» — в командное состояние (mxCan), чтобы напарник знал до «Играть».
function ccMXCanStamp(){
  try{
    if(!ccMpTeam() || (typeof ccRaceOn==='function' && ccRaceOn()) || !ccMXSoloTeamDay()) return;
    const ev=careerMajorOn(careerToday()), card=careerCard(); if(!card) return;
    const v=careerToday()+'|'+((ev && ev.stage==='q' && careerMajorCan(ev)) ? 1 : 0);
    const cr=CAREER.career, me=hKey(card);
    cr.mxCan=cr.mxCan||{};
    if(cr.mxCan[me]!==v){
      cr.mxCan[me]=v;
      // Напарнику — сразу, а не со следующим сохранением: он может решать прямо сейчас (ccMXPeerFlagWait).
      if(!CC_MP_RAND && typeof MP!=='undefined' && MP.push && MP.state==='live') setTimeout(function(){ try{ if(!CC_MP_RAND) MP.push(ccTeamState()); }catch(e){} }, 0);
    }
  }catch(e){}
}
// Ждём отметку напарника «могу/не могу» на сегодня (или его «сыграл») — не дольше CC_MX_FLAG_MS.
const CC_MX_FLAG_MS=8000;
async function ccMXPeerFlagWait(){
  try{
    if(typeof MP==='undefined' || MP.state!=='live' || !MP.peer) return;
    ccMXCanStamp();
    const pk=hKey(MP.peer), t0=Date.now();
    const known=()=>{ const cr=CAREER.career, today=careerToday();
      return String((cr.mxCan||{})[pk]||'').indexOf(today+'|')===0 || (cr.mxDone||{})[pk]===today; };
    while(!known() && Date.now()-t0<CC_MX_FLAG_MS){
      const w=new Promise(r=>setTimeout(r, 150));
      await ((typeof ccMpIdle==='function') ? ccMpIdle(w) : w);
    }
  }catch(e){}
}
// Квал соло-недели сегодня играют оба — вечер общий. Решают одни и те же общие отметки у обоих (mxCan, mxDone).
function ccMXSharedOk(ev){
  if(!ev || ev.stage!=='q' || !ccMpTeam() || (typeof ccRaceOn==='function' && ccRaceOn())) return false;
  /* Только вечер в один раунд (недели World Cup Solo 2019). Два раунда за вечер (соло-FNCS 2020, «round 1–2») — личным,
     как было: расход посреди такого вечера оставлял вылетевшего в общем вечере без закрытия, перемотка вставала
     (онлайн-прогон 2020, 22.10: FNCS C2S3 квал 1, 1.08). */
  if(!Array.isArray(ev.rounds) || ev.rounds.length!==1) return false;
  if(typeof MP==='undefined' || MP.state!=='live' || !MP.peer) return false;
  const me=careerCard(); if(!me || hKey(MP.peer)===hKey(me)) return false;
  ccMXCanStamp();
  const cr=CAREER.career, today=careerToday(), mk=hKey(me), pk=hKey(MP.peer), done=cr.mxDone||{}, can=cr.mxCan||{};
  if(done[mk]===today || done[pk]===today) return false;
  return can[mk]===today+'|1' && can[pk]===today+'|1';
}
/* Личные соло-вечера Мейджора в команде: кто сегодня отыграл (или играть нечего) — cr.mxDone по нику;
   день шагает, когда отмечены оба. Состояние напарника, приехавшее посреди своего вечера, ждёт
   (CC_MX_PENDING) — применить его посреди игры значит выбросить кэши мира. */
let CC_MX_SOLO_RUN=false, CC_MX_PENDING=null, CC_MX_SETTLING=false;
// Сегодня — соло-Мейджор в командной карьере (личные вечера, день от ведущего).
function ccMXSoloTeamDay(){
  if(!ccMpTeam()) return false;
  const ev=careerMajorOn(careerToday());
  return !!(ev && ev.yx && (ccMXSpec(ev.yx, ev.n)||{}).size===1);
}
// Перемотка ждёт, пока день сдвинет ведущий; не дождалась за пять минут — встаёт с причиной.
async function ccMXFfWait(day){
  for(let i=0; i<600 && careerToday()===day; i++){
    if(i%10===0) try{ ccMXTeamSettle(); }catch(e){}
    await new Promise(r=>setTimeout(r, 500));
  }
  if(careerToday()===day && typeof CC_FF!=='undefined' && CC_FF) CC_FF.stop={text:L().ccMpSoloWait};
}
function ccMXTeamSettle(){
  if(CC_MX_SETTLING || CC_MX_SOLO_RUN) return false;
  if(!ccMpTeam() || typeof MP==='undefined' || CC_MP_RAND) return false;
  if(CC_MX_PENDING){ const t=CC_MX_PENDING; CC_MX_PENDING=null; ccMpApplyRemote(t); }
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const today=careerToday(), ev=careerMajorOn(today);
  if(!ev || !ev.yx) return false;
  const sp=ccMXSpec(ev.yx, ev.n);
  if(!sp || sp.size!==1) return false;
  CC_MX_SETTLING=true;
  try{
    const me=hKey(careerCard()), peer=MP.peer ? hKey(MP.peer) : null;
    const done=cr.mxDone=cr.mxDone||{};
    // Сам сегодня не играю (не прошёл, уже сыграл) — отмечаюсь, чтобы напарник не ждал.
    if(done[me]!==today && !careerMajorCan(ev)){ done[me]=today; careerSave(); }
    if(done[me]!==today) return false;
    if(peer && done[peer]!==today) return false;
    /* День двигает ОДИН — тот, чей ник меньше; второй получает день его состоянием. Оба доиграли почти
       разом — и оба шагнули сами, каждый со своим состоянием; следующий общий вечер разошёлся с первой
       игры (живой прогон 2019, World Cup Duos неделя 2). */
    if(peer && me>peer) return false;
    CC_MP_ALONE=true;
    try{ careerAdvanceTo(ccAddDays(today, 1)); }
    finally{ CC_MP_ALONE=false; }
    careerSave();
    return true;
  } finally { CC_MX_SETTLING=false; }
}
async function ccMXRun(ev, sp, soloTeam){
  const cr=CAREER.career; let lastR=0;
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=sp.size; drafted=[me].concat(mates);
  // Клетки острова под формат вечера: соло-неделя дробит остров, как любое соло-лобби.
  const prevSet=ACTIVE_LANDING_SET; useLandingSet(ACTIVE_LANDING_SET);
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

  /* Общий квал соло-недели (CC_MX_SHARED, см. runCareerMajorMX): оба человека — своими соло-командами, как в соло-капе
     вдвоём (runCareerVictoryNight): карточка с провода, своя форма, свой адрес вопросов (mpTag), порядок — по нику. */
  const pc=(CC_MX_SHARED && typeof MP!=='undefined' && MP.peer && hKey(MP.peer)!==hKey(me)) ? MP.peer : null;
  const soloYouMX=function(card, form, label){
    const t=careerTeam([card], true);
    t.pow=Math.round(t.pow+form);
    t.summitRegion=ccCareerRegion();
    t.name=label; t.mpTag=':'+hKey(card);
    return t;
  };
  let you, mxMate=null;
  if(pc){
    { const self=ccSoloSelf(me); you=soloYouMX(self.card, self.form, L().yourTeamPrefix+teamLabel(drafted)); }
    mxMate=soloYouMX(pc, Number(pc.formPow)||0, teamLabel([pc])); mxMate.isMate=true;
  } else {
    you=careerYouTeam(drafted);
    you.name=L().yourTeamPrefix+teamLabel(drafted);
  }
  you.isYou=true;
  let humans=mxMate ? (hKey(me)<hKey(pc) ? [you, mxMate] : [mxMate, you]) : [you];
  const m=ccMXState(ev.yx, ev.n);
  const F=ccMXLobby(sp.size);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  // Закрытый раунд из своих записей: напарник в них — строкой своей карточки; на его место садится он сам.
  const mateIn=fld=>{
    if(!mxMate) return;
    const pk=hKey(pc), i=fld.findIndex(t=>t && t!==you && (t.squad||[]).some(c=>c && hKey(c)===pk));
    if(i>=0) fld[i]=mxMate;
    else { ccTeamNightApart(); mxMate=null; humans=[you]; }
  };
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0, heatPay=null, wildOut=false;
  const play=async (room, sp2, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    const pS=ccPastMajorScore(ev);
    await simulateGamesLive(room, sp2.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:F, stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       together: mxMate ? humans : null,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : mxMate ? ccSoloDrops(rm||room, humans, label, ['major']) : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp2.games;
    return ccM24Rank(room);
  };
  if(ev.stage==='q'){
    const Q=m.q[ev.w]=m.q[ev.w]||{};
    const R=sp.rounds.length;
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i]; lastR=r;
      spec=Object.assign({}, sp.rounds[r-1]);
      const wc=sp.kind==='wc' && r===R;
      if(wc) spec.cut=ccMXWcQuota(sp);
      const open=!!spec.open;
      // Вдвоём из поля вычитаются оба (и тёзки обоих), людей — столько же, сколько мест: поле того же размера.
      field=open ? [...humans, ...careerCupField(cr, mxMate ? [me, pc] : drafted, careerLadderEntrants()-(humans.length-1), 'mx|'+ev.yx+'|'+ev.n+'|'+ev.w+'|'+r, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      if(!open) mateIn(field);
      if(!open){
        const want=Math.min(sp.rounds[r-2].cut, F*2), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'mxq|'+ev.yx+'|'+ev.n+'|'+ev.w+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=ccYearLabel(ccMXRowId(ev.yx, ev.n, 'W'+ev.w+'R'+r), careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      let heatsNote=null;
      if(r===R){
        through=wc && place<=spec.cut;
        if(wc){
          if(through) m.ticket=true;
          // Кто из твоего региона взял путёвки этой недели — они и едут в Нью-Йорк (ccMXWcRows).
          const W=m.wcq=m.wcq||{}, done=ccMXWcTaken(m, ev.w);
          (W[ev.w]=W[ev.w]||{})[careerPrizeRegion()==='NAW' ? 'NAW' : careerPrizeRegion()]=
            ranked.map(seedOf).filter(r=>r==='you' || !done.has(ccMXWcRowKey(r))).slice(0, spec.cut);
        }
        else {
          m.youKey=ccSeatKey(you);
          const wl=ranked.map(t=>({key:ccSeatKey(t), row:seedOf(t)})), wk=new Set(wl.map(x=>x.key));
          ccMXSemiTail(m, Q, wk, ccMXWeekSize(sp), wl);
          ccMXSeriesAddList(m, wl, ev.w, ranked.length);
          /* Хиты берут верх серии: хитов × лобби (ccMXHeats). Карточка финала недели ставила «не
             прошёл» всегда — через неё шла только путёвка World Cup (его правка 29.09: «в финалах
             нет плашки, что квал в хиты»). В последнюю неделю место уже окончательное — «в хитах»,
             раньше — «в зоне хитов» по текущей серии. */
          if((sp.heats||[]).length){
            Q.done=true; ccMXSettleWeeks(m);
            const hl=ccMXHeatList(m), need=hl.need;
            const lastWeek=ev.w===(sp.weeks||[])[(sp.weeks||[]).length-1];
            through=ccSeedHasMe(hl.list);
            heatsNote=through ? (lastWeek ? L().ccYrXHeatsIn(need) : L().ccYrXHeatsZone(need)) : L().ccYrXHeatsOut(need);
          }
        }
        Q.done=true;
      } else {
        through=place<=spec.cut;
        // Следующий раунд открытый — зал не нужен, только отметка «прошёл».
        const nextOpen=!!(sp.rounds[r] && sp.rounds[r].open);
        Q['r'+r]=nextOpen ? (through ? ['you'] : []) : ranked.slice(0, spec.cut).map(seedOf);
        if(r===R-1 && sp.kind!=='wc'){ m.youKey=ccSeatKey(you); Q.semi=ranked.slice(0, ccMXWeekSize(sp)).map(seedOf); }
      }
      m.youKey=ccSeatKey(you);
      note = (r===R) ? (wc ? (through ? L().ccYrXWcIn(spec.cut) : L().ccRelFail(spec.cut))
                              : L().ccYr24Series(m.series[m.youKey]||0, ccMXSeriesRank(m, m.youKey))+(heatsNote ? ' · '+heatsNote : ''))
                     : (through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
      if(i<ev.rounds.length-1){
        // Раунд недели с призовыми (Season X: раунд 2 платит топ-150) — деньги сразу.
        const pf=ccMXWeekPrize(sp, ev.w, r, ev.n);
        if(pf){ careerMoneyAdd(ranked, pf); const c=pf(place); if(c){ ccPayIn(ccShareOf(c, you)); careerNews('good', 'ccNewsEvCash', [stageLabel, place, ccNum(c)], {tbl:ccStageShot(ranked, you, 1, stageLabel)}); } }
        const sh=createStageCardShell(stageLabel+' — '+field.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, place, field.length, you.stagePts, through, false, note);
        await revealStandings(sh, ranked, you, spec.cut||0, null, null, pf, null, !!pf);
        careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
        /* Следующий раунд — только у прошедших. Прошёл один из двоих — дальше врозь, как соло-кап вдвоём (общая часть уже
           посчитана обоими и закрыта общим ключом, хвост — свой). Не прошёл никто — оба заканчивают здесь. */
        if(mxMate && (ranked.indexOf(mxMate)+1<=spec.cut)!==through){ ccTeamNightApart(); mxMate=null; humans=[you]; }
        /* И в гонке — как второй раунд соло-капа (runCareerVictoryNight): кого-то из людей комнаты нет среди прошедших —
           дальше врозь. Онлайн-прогон гонки 2020 (22.10): неделя 2 Мейджора 2, 1.08 — прошедший играл раунд 2 один, а
           вылетевший ждал его ответа на вопрос («Your partner never reached the question»), доски разошлись. */
        if(typeof ccRaceLock==='function' && ccRaceLock()){
          const rivalOut=ranked.some((t, i)=>t && t.isRival && i>=spec.cut);
          if(!through || rivalOut) ccRaceNightApart();
        }
        if(!through) break;
      }
    }
  } else if(ev.stage==='heat'){
    ccMXSettleHeats(m);
    const hi=ccMXYourHeat(m, ev.r), heat=ccMXHeats(m)[hi];
    spec={games:sp.heatGames||6, cut:heat.cut};
    field=rowsOf(heat.rows);
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=L().ccYrXHeatN(ev.label, hi+1);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.heatRes[hi]={up:ranked.slice(0, heat.cut).map(seedOf), rest:ranked.slice(heat.cut).map(seedOf)};
    through=place<=heat.cut;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : L().ccRelFail(heat.cut);
    if(!through && sp.wild && place<=heat.cut+(sp.wild.to-sp.wild.from+1)){ m.wild=true; note=L().ccYrXWildIn; }
    // Хиты 2020-го платили не прошедшим (ccMXHeatPrize) — деньги идут той же веткой, что неделя.
    heatPay=ccMXHeatPrize(sp, ev.n, hi, heat.cut);
  } else {
    if(!m.ticket && m.wild && sp.wild && !m.wildRes){
      // Wildcard: один матч, проходит только победитель. Проиграл — вечер кончается здесь (wildOut).
      // 32 места: 8 с каждого хита, одно из них твоё.
      const wf=rowsOf(ccMXWildRows(m, sp).slice(0, (sp.heats||[]).length*(sp.wild.to-sp.wild.from+1)-1));
      if(wf.indexOf(you)<0) wf.unshift(you);
      const wl=L().ccYrXWildLabel(sp.name), wspec={games:sp.wild.games, cut:1};
      const wr=await play(wf, wspec, wl, false);
      const wp=wr.indexOf(you)+1;
      m.wildRes={win:seedOf(wr[0])};
      if(wp===1){
        m.ticket=true;
        const pf=ccMXWildPrize(sp);
        const sh=createStageCardShell(wl+' — '+wf.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, wp, wf.length, you.stagePts, true, false, L().ccYr22SemiUp);
        await revealStandings(sh, wr, you, 1, null, null, pf, null, !!pf);
        careerPrAdd(wr, {div:cr.division, kind:'major', stage:'wild'});
        if(pf) careerMoneyAdd(wr, pf);
        careerNews('good', 'ccNewsMajThrough', [wl, 1, wf.length], {tbl:ccStageShot(wr, you, 1, wl)});
      } else {
        wildOut=true; field=wf; ranked=wr; place=wp; spec=wspec; stageLabel=wl;
        through=false; note=L().ccRelFail(1); heatPay=ccMXWildPrize(sp);
      }
    }
  }
  if(ev.stage==='final' && !wildOut){
    spec={games:sp.finalGames||12, cut:0};
    field=rowsOf(ccMXGfRows(ev.yx, ev.n, m));
    // Отпечаток записи Мейджора — в сверку поля: разошлось поле финала — видно, на чём (хиты, их итоги, серия).
    try{ const h=v=>String(ccHashStr(JSON.stringify(v||null))).slice(0,6);
      CC_MP_FIELD_FP='mx h'+h(m.heats)+' r'+h(m.heatRes)+' s'+h(m.series)+' q'+h(m.q)+' w'+h(m.wf)+' tw'+CC_TW_APPLIED; }catch(e){}
    if(field.indexOf(you)<0) field.unshift(you);
    /* Недобор путёвок (квоты недель World Cup округляются — соло-финал 2019 был 93 из 100, 21.10) —
       добираем сильнейшими, как в финале без тебя (ccMXWorldFinalRoom). */
    if(field.length<F){
      const seen=new Set(field.map(ccSeatKey));
      careerCupField(cr, drafted, F+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
        if(field.length>=F || seen.has(ccSeatKey(t))) return;
        seen.add(ccSeatKey(t)); field.push(t);
      });
    }
    field=field.slice(0, F);
    if(field.indexOf(you)<0) field[field.length-1]=you;
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
  }
  m.got[ev.id]=true;
  removeSkipButton();
  const fin=ev.stage==='final' && !wildOut;
  // Неделя World Cup, сыгранная до финала недели, — платит по таблице недели своего региона.
  // Только за последний раунд вечера: промежуточные платятся в цикле (иначе вылет на раунде 2 платил бы дважды).
  const wcPrize=heatPay || ((!fin && ev.stage!=='heat' && lastR && ev.rounds && lastR===ev.rounds[ev.rounds.length-1]) ? ccMXWeekPrize(sp, ev.w, lastR, ev.n) : null);
  const wcWeek=!!wcPrize;
  const prizeFn=fin ? majorPrize : wcWeek ? wcPrize : null;
  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false, fin ? '' : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, prizeFn, null, fin || wcWeek);
  careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',
               cash?[sp.name, place, ccNum(cash)]:[sp.name, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsEv(sp.name));
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else if(wcWeek){
    careerMoneyAdd(ranked, wcPrize);
    cash=wcPrize(place);
    if(cash){ ccPayIn(ccShareOf(cash, you)); careerNews('good', 'ccNewsEvCash', [stageLabel, place, ccNum(cash)], {tbl:ccStageShot(ranked, you, 1, stageLabel)}); }
    // Неделя FNCS с призом — такой же этап, как без него: отметка о проходе не теряется.
    if(sp.kind!=='wc'){
      const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
      cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
    }
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
               mate: (sp.size>1 && mate) ? mate.handle : null, mates: ccLogMates(mates.slice(0, sp.size-1)), prize:ccShareOf(cash, you), kind:'major', stage:fin ? 'final' : wildOut ? 'wild' : ev.stage,
               size: sp.size, won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined,
               who: soloTeam ? hKey(me) : undefined, solo: soloTeam || undefined});
  await ccMpClose(ranked);
  // Личный соло-вечер в команде день не двигает сам — см. ccMXTeamSettle.
  if(!soloTeam) careerAdvanceTo(ccAddDays(careerToday(), 1));
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note, seat:false, seatText:null, money: (fin || wcWeek) ? cash : null});
}
/* Призовые недель Online Open World Cup 2019 — финал недели (Event2) платил до 2000-го места, своя
   таблица у каждого региона (Tracker imp_event.PayoutTable, tools/measured/wc2019-week-pay.json).
   Его правка 29.09: «и не пишет денег сколько выиграл». Доллары на игрока; NAC — NA East, ME — EU. */
const CC_WC_WEEK_PAY={"1":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"2":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"3":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"4":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"5":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"6":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"7":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"8":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"9":{"EU":[[1,10000],[2,8000],[3,6000],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1600],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,600],[500,500],[1000,400],[1500,300],[2000,200]],"NAE":[[1,10000],[2,8000],[3,6000],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1600],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,600],[500,500],[1000,300],[1500,200]],"NAW":[[1,8000],[2,7000],[3,6000],[4,5000],[5,4000],[6,3400],[7,3000],[8,2500],[9,2000],[10,1600],[20,1400],[30,1000],[40,900],[50,700],[75,500],[100,400],[250,300],[500,200]],"BR":[[1,6000],[2,5000],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1600],[10,1200],[20,1000],[30,800],[40,600],[50,400],[75,350],[100,300],[250,250],[500,200]],"ASIA":[[1,6000],[2,5000],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1600],[10,1200],[20,1000],[30,800],[40,600],[50,400],[75,350],[100,300],[250,250],[500,200]],"OCE":[[1,5000],[2,4500],[3,4000],[4,3500],[5,3000],[6,2500],[7,2000],[8,1500],[9,1000],[10,900],[20,800],[30,700],[40,600],[50,500],[75,400],[100,300],[250,200]]},"10":{"EU":[[1,10000],[2,8000],[3,6500],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1800],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,500],[500,350],[1000,200]],"NAE":[[1,10000],[2,8000],[3,6500],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1800],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,500],[500,350]],"NAW":[[1,6500],[2,5500],[3,4750],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[20,700],[30,600],[40,500],[50,400],[75,300],[100,250],[250,200]],"BR":[[1,6500],[2,5500],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[20,800],[30,700],[40,600],[50,500],[75,400],[100,200]],"ASIA":[[1,6500],[2,5500],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[20,800],[30,700],[40,600],[50,500],[75,400],[100,200]],"OCE":[[1,5000],[2,4500],[3,4000],[4,3500],[5,3000],[6,2500],[7,1750],[8,1250],[9,800],[10,700],[20,600],[30,500],[40,400],[50,300],[75,200]]}};
/* Призовые недель FNCS Season X (n=3) и Chapter 2 Season 1 (n=4): раунд → окно EventN Epic
   (tools/measured/fncs2019-week-pay.json). Season X платит раунд 2 и финал недели, C2S1 — финал недели. */
const CC_FNCS19_WEEK_PAY={"3":{"1":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"2":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"3":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"4":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"5":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}}},"4":{"1":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}},"2":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}},"3":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}},"4":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}}}};
/* Призовые недель, квалификаторов и хитов FNCS 2020 (C2S2/C2S3/C2S4): Liquipedia, tools/build-2020-week-pay.js.
   Доллары на игрока; week[n][неделя][регион] — финал недели (последний раунд), heat[n][регион][хит]. */
const CC_FNCS20_WEEK_PAY={"week":{"1":{"1":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]},"2":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]},"3":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]},"4":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]}},"2":{"1":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[100,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]},"2":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[100,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]},"3":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[97,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]},"4":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[100,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]}},"3":{"1":{"ASIA":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"BR":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"EU":[[1,4000],[2,3500],[3,3000],[4,2000],[5,1000],[6,800],[7,700],[8,600],[9,500],[10,400],[15,350],[20,300],[26,225],[33,200]],"ME":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"NAE":[[1,2500],[2,1500],[3,1000],[4,750],[5,660],[6,550],[7,450],[8,400],[9,350],[10,300],[15,275],[20,250],[26,200]],"NAW":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"OCE":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},"2":{"ASIA":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"BR":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"EU":[[1,4000],[2,3500],[3,3000],[4,2000],[5,1000],[6,800],[7,700],[8,600],[9,500],[10,400],[15,350],[20,300],[26,225],[33,200]],"ME":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"NAE":[[1,2500],[2,1500],[3,1000],[4,750],[5,660],[6,550],[7,450],[8,400],[9,350],[10,300],[15,275],[20,250],[26,200]],"NAW":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"OCE":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},"3":{"ASIA":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"BR":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"EU":[[1,4000],[2,3500],[3,3000],[4,2000],[5,1000],[6,800],[7,700],[8,600],[9,500],[10,400],[15,350],[20,300],[26,225],[33,200]],"ME":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"NAE":[[1,2500],[2,1500],[3,1000],[4,750],[5,660],[6,550],[7,450],[8,400],[9,350],[10,300],[15,275],[20,250],[26,200]],"NAW":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"OCE":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]}}},"heat":{"1":{"ASIA":{"1":[[25,0],[50,200]],"2":[[25,0],[50,200]]},"BR":{"1":[[12,0],[50,225]],"2":[[12,0],[50,225]],"3":[[12,0],[50,225]],"4":[[12,0],[50,225]]},"EU":{"1":[[12,0],[50,900]],"2":[[12,0],[50,900]],"3":[[12,0],[50,900]],"4":[[12,0],[50,900]]},"ME":{"1":[[25,0],[50,200]],"2":[[25,0],[50,200]]},"NAE":{"1":[[12,0],[50,560]],"2":[[12,0],[50,560]],"3":[[12,0],[50,560]],"4":[[12,0],[50,560]]},"NAW":{"1":[[12,0],[50,225]],"2":[[12,0],[50,225]],"3":[[12,0],[50,225]],"4":[[12,0],[50,225]]},"OCE":{"1":[[25,0],[50,250]],"2":[[25,0],[50,250]]}},"2":{"ASIA":{"1":[[50,0],[99,200]],"2":[[50,0],[100,200]]},"BR":{"1":[[25,0],[50,300],[100,250]],"2":[[25,0],[50,300],[100,250]],"3":[[25,0],[50,300],[100,250]],"4":[[25,0],[50,300],[100,250]]},"EU":{"1":[[25,0],[50,1250],[100,1000]],"2":[[25,0],[50,1250],[100,1000]],"3":[[25,0],[50,1250],[100,1000]],"4":[[25,0],[50,1250],[100,1000]]},"ME":{"1":[[50,0],[100,200]],"2":[[50,0],[100,200]]},"NAE":{"1":[[25,0],[50,800],[100,600]],"2":[[25,0],[50,800],[100,600]],"3":[[25,0],[50,800],[100,600]],"4":[[25,0],[50,800],[100,600]]},"NAW":{"1":[[25,0],[50,300],[100,250]],"2":[[25,0],[50,300],[100,250]],"3":[[25,0],[50,300],[100,250]],"4":[[25,0],[50,300],[100,250]]},"OCE":{"1":[[50,0],[100,200]],"2":[[50,0],[100,200]]}},"3":{"EU":{"1":[[16,0],[33,600]],"2":[[16,0],[33,600]],"3":[[16,0],[33,600]],"4":[[16,0],[33,600]]},"NAE":{"1":[[16,0],[33,400]],"2":[[16,0],[33,400]],"3":[[16,0],[33,400]],"4":[[16,0],[33,400]]}}}};
// Ближний Восток в 2019-м платился таблицей Европы (своей нет) — в 2020-м у него своя.
function ccRegPay(t){ let r=careerPrizeRegion(); r = r==='NAC' ? 'NAE' : r; return t[r] ? r : 'EU'; }
// Год турнира — по острову спеки: h* — 2019, i* — 2020. Номер сезона внутри года не уникален
// (C2S4 — n=3, как Season X), и таблица 2019-го по одному n платила C2S4 строкой Season X.
const ccMXIs2020=sp=>String(sp && sp.set || '').charAt(0)==='i';
function ccMXWeekPrize(sp, w, r, n){
  if(!sp) return null;
  if(sp.kind==='wc') return r===sp.rounds.length ? (p=>ccWcWeekPay(w, p)*sp.size) : null;
  // Номер сезона — с вечера (ev.n): в спеке его нет, и sp.n молча давал null (призов FNCS не было).
  const key=n!=null ? n : sp.n;
  let rows=null;
  if(ccMXIs2020(sp)){
    // 2020: платит финал недели / квалификатора — последний раунд вечера.
    if(r!==sp.rounds.length) return null;
    const t=(CC_FNCS20_WEEK_PAY.week[key]||{})[w]; if(!t) return null;
    rows=t[ccRegPay(t)];
  } else {
    const t=((CC_FNCS19_WEEK_PAY[key]||{})[w]); if(!t) return null;
    rows=(t[ccRegPay(t)]||{})[r];
  }
  if(!rows) return null;
  return p=>{ for(const x of rows) if(p<=x[0]) return x[1]*sp.size; return 0; };
}
/* Хиты 2020-го платили тем, кто дальше не прошёл (Liquipedia: прошедшие — $0). Порог прохода
   в карьере свой (spec.heats[].cut), поэтому за местом ниже него — первая выплата таблицы,
   даже если на Liquipedia это место ещё было «прошедшим» с нулём. */
/* Хиты 2019-го (Liquipedia, сверка 7.10): Season X — «$120,000» на хит, $4,800 трио за 9–33-е; C2S1 — «$68,400»,
   $3,600 скваду за 7–25-е. Прошедшие в финал из хита денег не берут. Сумма — на команду. */
const CC_MX_HEAT_PAY_2019={h3:{to:33, team:4800}, h4:{to:25, team:3600}};
function ccMXHeatPrize(sp, n, hi, cut){
  const p19=CC_MX_HEAT_PAY_2019[sp && sp.set];
  if(p19 && careerPrizeRegion()==='EU') return p=>(p>cut && p<=p19.to) ? p19.team : 0;
  if(!ccMXIs2020(sp)) return null;
  const t=CC_FNCS20_WEEK_PAY.heat[n]; if(!t) return null;
  const byHeat=t[ccRegPay(t)]||{}, rows=byHeat[hi+1]||byHeat[1]; if(!rows) return null;
  const firstPaid=(rows.find(x=>x[1]>0)||[0,0])[1];
  return p=>{ if(p<=cut) return 0; let v=0; for(const x of rows) if(p<=x[0]){ v=x[1]; break; }
    if(!v && p<=rows[rows.length-1][0]) v=firstPaid; return v*sp.size; };
}
function ccWcWeekPay(w, place){
  const t=CC_WC_WEEK_PAY[w]; if(!t) return 0;
  let r=careerPrizeRegion(); r = r==='NAC' ? 'NAE' : (r==='ME' || !t[r]) ? 'EU' : r;
  const rows=t[r]||[]; for(const x of rows) if(place<=x[0]) return x[1];
  return 0;
}
// Призовые финала сезона на команду: World Cup — таблица Нью-Йорка (одна на мир), FNCS — финал региона.
function ccMXPrize(y, n, place){
  const sp=ccMXSpec(y, n); if(!sp) return 0;
  const t=sp.kind==='wc' ? {EU:((typeof WC2019_PAY!=='undefined' && WC2019_PAY[sp.set])||[])}
        : y===2019 ? Object.assign({}, ((typeof CC_MX_PAY_2019_LQ!=='undefined' && CC_MX_PAY_2019_LQ[n])||{}), ((typeof CC_MX_PAY_2019!=='undefined' && CC_MX_PAY_2019[n])||{}))
        : (((typeof CC_MX_PAY_2020!=='undefined' && CC_MX_PAY_2020)||{})[n]||{});
  return ccPay24(t, place)*sp.size;
}
// ==== /FNCS 2019–2020 machine ====
// ==== FNCS 2021 machine (tools/splice-2021.js) ====
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
  // Раунды 2 и 3 — «3 hour limit & 10 match limit» на каждой странице квала (сверка с Liquipedia 7.10; было 6).
  q:{1:{games:10, cut:1500, open:true}, 2:{games:10, cut:250}, 3:{games:10, cut:33}, 4:{games:6, cut:3}},
  semi:{games:6}, reboot:{games:6}, final:{games:12, cut:0}
};
function ccM21Rounds(){ return 4; }
function ccM21Spec(n, r){
  const s=Object.assign({}, CC_M21.q[r]);
  if(r===2 && n===4) s.cut=300;
  // C2S7: «Top 300 trios will advance to Round 2» / «Top 150 trios will advance to Round 3».
  if(n===3 && r===1) s.cut=300;
  if(n===3 && r===2) s.cut=150;
  if(r===4) s.cut = n===1 ? 0 : n===4 ? 5 : 3;
  return s;
}
function ccM21Quals(n){ return n===4 ? 2 : 3; }
function ccM21Field(){ return ccTeams(50); }
// Хиты полуфинала: день и квота. prev — хит второго дня из не прошедших первый (C2S8).
function ccM21HeatPlan(n){
  if(n===1) return [{day:1, cut:8}, {day:1, cut:8}, {day:2, cut:8}, {day:2, cut:8}];
  // C2S8, день 2 — Reboot Round 1 и 2 (Liquipedia): 6 матчей, очки только за победу, топ-6 каждого.
  if(n===4) return [{day:1, cut:4}, {day:1, cut:4}, {day:2, cut:6, prev:true, winOnly:true}, {day:2, cut:6, prev:true, winOnly:true}];
  return [{day:1, cut:6}, {day:1, cut:6}, {day:1, cut:6}];
}
// C2S7 — «4 match limit … Scoring based Victory Royales. Top 4 trios will advance» (Liquipedia, сверка 7.10; было 6 и 6).
function ccM21RebootCut(n){ return n===1 ? 1 : n===2 ? 6 : n===3 ? 4 : 0; }
/* Reboot Round (Liquipedia): C2S5 — один матч, проходит победитель; C2S6/C2S7 — два раунда по три матча, проходят
   победители (у нас одним вечером — шесть матчей). Очки — правило Epic «только победа»: 10 за Victory Royale, 0 за элим. */
function ccM21RebootGames(n){ return n===1 ? 1 : n===3 ? 4 : 6; }
const CC_WIN_ONLY={pts:p=>p===1 ? 10 : 0, kill:0};
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
    const sc=h.winOnly ? CC_WIN_ONLY : {pts:ccM24Points, kill:CC_M24_KILL};
    ccWorldRun('m21h|'+m.season+'|'+m.n+'|'+i, ()=>simulateGames(room, CC_M21.semi.games, sc.pts, sc.kill));
    const ranked=ccM24Rank(room);
    m.heatRes[i]={up:ranked.slice(0, h.cut).map(ccMajorSeatRow), rest:ranked.slice(h.cut).map(ccMajorSeatRow)};
  });
}
// Хит игрока на день d (или -1).
function ccM21YourHeat(m, d){
  const heats=ccM21Heats(m);
  ccM21PrevHeats(m);
  return heats.findIndex(h=>h.day===d && ccSeedHasMe(h.rows));
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
  ccWorldRun('m21r|'+m.season+'|'+m.n, ()=>simulateGames(room, ccM21RebootGames(m.n), CC_WIN_ONLY.pts, CC_WIN_ONLY.kill));
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
    return ccSeedHasMe(prev);
  }
  if(ev.stage==='semi'){
    if(!s || s.ticket || !s.youKey) return false;
    ccM21SettleHeats(s);
    return ccM21YourHeat(s, ev.r)>=0;
  }
  if(ev.stage==='reboot'){
    if(!s || s.ticket || !s.youKey || !ccM21RebootCut(ev.n)) return false;
    return ccSeedHasMe(ccM21RebootRoom(s));
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
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0, shownOut=false, alive=false;
  const play=async (room, sp, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    const pS=ccPastMajorScore(ev);
    await simulateGamesLive(room, sp.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
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
      let heatsNote=null, semiSeat=false;
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
      stageLabel=ccYearLabel('Major'+ev.n+'_2021_Q'+ev.q+'R'+r, careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      if(r===R){
        // Раунд 4: топ прямо в финал (кроме C2S5), остальные — в серию.
        through=spec.cut>0 && place<=spec.cut;
        ranked.slice(0, spec.cut).forEach(t=>m.direct.push(seedOf(t)));
        ccM21SeriesAdd(m, ranked.slice(spec.cut), seedOf);
        if(through) m.ticket=true;
        Q.done=true;
        /* Не прямое место — ещё не вылет: полуфинал набирается из серии (ccM21Heats: хиты первого
           дня × лобби, без прямых). Плашка раньше горела красным всегда, хотя хит открывался. */
        if(!through){
          ccM21SettleQuals(m);
          const direct=new Set(m.direct.map(ccM21Key)), myKey=ccSeatKey(you);
          const order=Object.keys(m.series).filter(k=>!direct.has(ccM21Key(m.seriesRows[k]))).sort((a,b)=>m.series[b]-m.series[a]);
          const need=ccM21HeatPlan(ev.n).filter(h=>!h.prev).length*F, at=order.indexOf(myKey)+1;
          heatsNote=(at>0 && at<=need) ? L().ccYrXHeatsZone(need) : L().ccYrXHeatsOut(need);
          semiSeat=at>0 && at<=need;
        }
      } else {
        through=place<=spec.cut;
        Q['r'+r]=ranked.slice(0, spec.cut).map(seedOf);
      }
      m.youKey=ccSeatKey(you);
      note = (r===R) ? (through ? L().ccYr22Direct(spec.cut) : L().ccYr24Series(m.series[m.youKey]||0, ccM21SeriesRank(m, m.youKey))+(heatsNote ? ' · '+heatsNote : ''))
                     : (through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
      // Место в полуфинале по серии — тоже проход (плашка, журнал, cr.major), но не билет в финал.
      if(semiSeat) through=true;
      if(i<ev.rounds.length-1){
        const sh=createStageCardShell(stageLabel+' — '+field.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, place, field.length, you.stagePts, through, false, note);
        await revealStandings(sh, ranked, you, spec.cut||0);
        careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
        // Вылет посреди вечера: карточка уже показана — общий блок ниже её не повторяет.
        if(!through){ shownOut=true; break; }
      }
    }
  } else if(ev.stage==='semi'){
    ccM21SettleHeats(m);
    const hi=ccM21YourHeat(m, ev.r), heat=ccM21Heats(m)[hi];
    spec={games:CC_M21.semi.games, cut:heat.cut};
    field=rowsOf(heat.rows);
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=L().ccYrXHeatN(ev.label, hi+1);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.heatRes[hi]={up:ranked.slice(0, heat.cut).map(seedOf), rest:ranked.slice(heat.cut).map(seedOf)};
    through=place<=heat.cut;
    if(through) m.ticket=true;
    // C2S8: не прошедшие первый день играют хиты второго (ccM21HeatPlan, prev) — это не конец.
    const day2=!through && ccM21HeatPlan(ev.n).some(h=>h.prev) && !heat.prev;
    note=through ? L().ccYr22SemiUp : day2 ? L().ccYr21ToDay2 : (ccM21RebootCut(ev.n) ? L().ccYr21ToReboot : L().ccRelFail(heat.cut));
    if(day2) alive=true;
  } else if(ev.stage==='reboot'){
    const cut=ccM21RebootCut(ev.n);
    spec={games:ccM21RebootGames(ev.n), cut:cut};
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
  if(!shownOut){
    const shell=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, place, field.length, you.stagePts,
      ccStagePassed(through || alive, spec, place, fin ? majorPrize : null), false, fin ? ccMajorSeatNote(ev) : note);
    await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  }
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',
               cash?[ccSeasonEvName(2021, ev.n), place, ccNum(cash)]:[ccSeasonEvName(2021, ev.n), place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsEv(ccSeasonEvName(2021, ev.n)));
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
               passed: fin ? cash>0 : (through || alive), ovr:CAREER.player.ovr, games:games||spec.games, wins:you.wins||0, elims:you.stageElims||0,
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
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : (through || alive), cut:spec.cut||0,
    note: fin ? null : note, seat:false, seatText:null, money: fin ? cash : null});
}
// ==== /FNCS 2021 machine ====
// ==== FNCS 2022 machine (tools/splice-2022.js) ====
/* ---- Сезон FNCS 2022-го (Chapter 3) ---------------------------------------------
   Формат Epic (окна Tracker, Liquipedia; спека career-year-2022-design.md), дуо:
   квалификаторы — C3S1 два по три раунда (10 игр → топ-400, 7 игр → топ-50, 6 игр → топ-8
   прямо в финал), C3S2/C3S3 три по четыре раунда (10 → топ-2000, 10 → топ-500/250, 10 →
   топ-50, 6 → топ-5 в финал); очки серии — за два последних раунда. Полуфинал — три сессии
   по пять игр: пятьдесят лучших по серии (без прямых), в финал — победители матчей (до
   пяти) и лучшие по очкам до 11–12 (квоты сессий — окна Epic); оставшиеся садятся в следующую сессию,
   недобор — следующими по серии. Финал — 50 дуо, двенадцать игр. «Мейджор n» = сезон n.
   Два раунда в один вечер у Epic бывали часто — день календаря несёт свой список раундов. */
const CC_M22={
  q:{1:{games:10, cut:250, open:true}, 2:{games:7, cut:50}, 3:{games:6, cut:8}},   // C3S1 Q1/Q2: «Top 250 duos will advance to Round 2» (было 400)
  /* Открытый раунд — форма Epic, размер нашей лестницы, как у 2024-го (CC_M24): у Epic 2000 из ~10 000, у нас лестница ~2 330,
     и 2000 из неё — это 86 % прохода, то есть раунд бесплатный (сверка 7.10). Ополовинено до 1000; дальше числа Epic. */
  qDeep:{1:{games:10, cut:1000, open:true}, 2:{games:10, cut:500}, 3:{games:10, cut:50}, 4:{games:6, cut:5}},
  qDeep3:{2:{games:10, cut:250}},
  semi:{games:5, vr:5, cut:[11, 12, 12], cut1:[11, 11, 12], field:50},
  final:{games:12, cut:0}, field:50
};
/* Матч-поинт финалов 2022 (Liquipedia, Grand Finals Europe, сверка 20.10): C3S1 — «3 Victory Royales and 300 Points»,
   C3S2 и C3S3 — «first to have 3 Victory Royales and 475 points», иначе — больше очков после 12 игр. C3S4 — Invitational, без него. */
const CC_M22_MP={1:{vr:3, pts:300}, 2:{vr:3, pts:475}, 3:{vr:3, pts:475}};
function ccM22Rounds(n){ return n===1 ? 3 : 4; }
function ccM22Spec(n, r){
  if(n===1) return CC_M22.q[r];
  if(n===3 && CC_M22.qDeep3[r]) return CC_M22.qDeep3[r];
  return CC_M22.qDeep[r];
}
// C3S2/C3S3, сессии 2 и 3 — «6 match limit» и «6 duos who got a victory royale» (Liquipedia; окна Epic S20/S21 SemiFinals — 5, потом 6). Сверка 7.10.
function ccM22SemiSpec(n, s){ const six=n>=2 && s>=2; return {games:six ? 6 : CC_M22.semi.games, vr:six ? 6 : CC_M22.semi.vr}; }
function ccM22SemiCut(n, s){ return (n===1 ? CC_M22.semi.cut1 : CC_M22.semi.cut)[s-1]||11; }
function ccM22Quals(n){ return n===1 ? 2 : 3; }
function ccM22Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major22;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM22State(n){
  const cr=CAREER.career;
  let m=ccM22Of(n);
  if(!m) m=cr.major22={n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, direct:[], semi:{}, youKey:null, ticket:false};
  return m;
}
function ccM22Day(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2022_'+tail || (tail.charAt(0)==='Q' && r[2].indexOf('Major'+n+'_2022_'+tail)===0));
  return row ? row[0] : null;
}
// Последний день квалификатора q (его последний раунд).
function ccM22QualEnd(n, q){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf('Major'+n+'_2022_Q'+q+'R')===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
function ccM22SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
/* Очки серии за место в раунде: дошедший до последнего раунда стоит выше любого вылетевшего раньше.
   Было «weight×(n−i)» — у вылетевших на предпоследнем раунде n≈200, у последнего n≈42, и 51-е место
   второго раунда (≈200 очков) обгоняло 9-е место финального (84). Полуфинал (топ-50 серии) забирали
   вылетевшие раньше, и в C3S1 в финал было только «топ-8 в один из дней» (Notion «19.10», тестер).
   Теперь предпоследний раунд — 1…99, последний — 100 + 2×(n−i). */
function ccM22SeriesAdd(m, ranked, weight, rowOf){
  const n=ranked.length;
  ranked.forEach((t,i)=>{
    const k=ccSeatKey(t);
    const pts=weight===1 ? Math.max(1, Math.round(99*(n-i)/n)) : 100+weight*(n-i);
    m.series[k]=(m.series[k]||0)+pts; if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t);
  });
}
const ccM22Key=r=>r==='you' ? 'you' : JSON.stringify(r);
/* Квалификатор, досчитанный молча: его последние два раунда — пятьдесят сильных сцены.
   Прямые места (топ-8 / топ-5) уходят в финал, остальные — в серию. */
function ccM22SettleQual(m, q){
  const Q=m.q[q]=m.q[q]||{};
  if(Q.done) return;
  const end=ccM22QualEnd(m.n, q);
  if(!end || careerToday()<=end) return;
  const R=ccM22Rounds(m.n), last=ccM22Spec(m.n, R);
  let room=(Q['r'+(R-1)]||[]).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<CC_M22.field){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(CC_M22.field+20, 'm22|'+m.n+'|'+q).forEach(t=>{
      if(room.length>=CC_M22.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, CC_M22.field);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m22q|'+m.season+'|'+m.n+'|'+q, ()=>simulateGames(room, last.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  ranked.slice(0, last.cut).forEach(t=>m.direct.push(ccMajorSeatRow(t)));
  ccM22SeriesAdd(m, ranked.slice(last.cut), 2, ccMajorSeatRow);
  Q.done=true;
}
function ccM22SettleQuals(m){ for(let q=1; q<=ccM22Quals(m.n); q++) ccM22SettleQual(m, q); }
// Комната сессии s полуфинала: перенесённые из прошлой сессии + добор по серии до 50.
function ccM22SemiRoom(m, s){
  ccM22SettleQuals(m);
  for(let i=1; i<s; i++) ccM22SettleSemi(m, i);
  const direct=new Set(m.direct.map(ccM22Key));
  const done=new Set();
  for(let i=1; i<s; i++) ((m.semi[i]||{}).up||[]).forEach(r=>done.add(ccM22Key(r)));
  const prev=(s>1 && m.semi[s-1]) ? (m.semi[s-1].rest||[]) : [];
  const room=prev.filter(r=>!done.has(ccM22Key(r)));
  const seen=new Set(room.map(ccM22Key));
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>{
    if(room.length>=CC_M22.semi.field) return;
    const r=m.seriesRows[k], key=ccM22Key(r);
    if(direct.has(key) || done.has(key) || seen.has(key)) return;
    // Уже сыгравшие прошлую сессию и не прошедшие — в её остатке; остальные ещё не садились.
    let played=false; for(let i=1; i<s; i++) if(((m.semi[i]||{}).all||[]).some(x=>ccM22Key(x)===key)) played=true;
    if(played) return;
    seen.add(key); room.push(r);
  });
  // Серия короче полусотни (одни и те же дуо в двух квалификаторах) — добор сценой.
  if(room.length<CC_M22.semi.field){
    const sat=new Set(); for(let i=1; i<s; i++) ((m.semi[i]||{}).all||[]).forEach(x=>sat.add(ccM22Key(x)));
    ccM23World(CC_M22.semi.field*2, 'm22s|'+m.n+'|'+s).forEach(t=>{
      if(room.length>=CC_M22.semi.field) return;
      const r=ccMajorSeatRow(t), key=ccM22Key(r);
      if(direct.has(key) || done.has(key) || seen.has(key) || sat.has(key)) return;
      seen.add(key); room.push(r);
    });
  }
  return room;
}
// Записать сессию: победители матчей (до пяти) и лучшие по очкам — до квоты сессии.
function ccM22WriteSemi(m, s, ranked, rowOf){
  const quota=ccM22SemiCut(m.n, s);
  const up=[], seen=new Set();
  ranked.forEach(t=>{ if((t.wins||0)>0 && up.length<ccM22SemiSpec(m.n, s).vr && !seen.has(t)){ seen.add(t); up.push(t); } });
  ranked.forEach(t=>{ if(up.length<quota && !seen.has(t)){ seen.add(t); up.push(t); } });
  m.semi[s]={up:up.map(rowOf), rest:ranked.filter(t=>!seen.has(t)).map(rowOf), all:ranked.map(rowOf)};
  return up;
}
function ccM22SettleSemi(m, s){
  if(m.semi[s]) return;
  const day=ccM22Day(m.n, 'Semi'+s);
  if(!day || careerToday()<=day) return;
  if(s>1) ccM22SettleSemi(m, s-1);
  const room=ccM22SemiRoom(m, s).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.semi[s]={up:[], rest:[], all:[]}; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m22semi|'+m.season+'|'+m.n+'|'+s, ()=>simulateGames(room, ccM22SemiSpec(m.n, s).games, ccM24Points, CC_M24_KILL));
  ccM22WriteSemi(m, s, ccM24Rank(room), ccMajorSeatRow);
}
// Финал: прямые из квалификаторов и прошедшие полуфинал; недобор — следующими по серии.
function ccM22GfRows(m){
  if(!m) return null;
  ccM22SettleQuals(m); for(let s=1; s<=3; s++) ccM22SettleSemi(m, s);
  const out=[], seen=new Set();
  const add=r=>{ const k=ccM22Key(r); if(!r || seen.has(k) || out.length>=CC_M22.field) return; seen.add(k); out.push(r); };
  m.direct.forEach(add);
  for(let s=1; s<=3; s++) ((m.semi[s]||{}).up||[]).forEach(add);
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccM22WorldFinalRoom(m, drafted, lobbyCr){
  const rows=m ? ccM22GfRows(m) : null;
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M22.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M22.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M22.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M22.field);
}
function ccM22CanStage(ev, cr, gaveUp){
  const s=ccM22Of(ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    if(s && s.ticket) return false;                    // уже в финале — квалификаторы не нужны
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.q] && s.q[ev.q]['r'+(first-1)];
    return ccSeedHasMe(prev);
  }
  if(ev.stage==='semi'){
    if(!s || s.ticket || !s.youKey) return false;
    const room=ccM22SemiRoom(s, ev.r);
    return ccSeedHasMe(room);
  }
  return !gaveUp && !!(s && s.ticket);
}
async function runCareerMajor2022(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y22 || !careerMajorCan(ev)) return;
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
  const m=ccM22State(ev.n);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0, shownOut=false, alive=false;
  /* Место в полуфинале по серии (ccM22SemiRoom: топ-50 серии без прямых мест). Плашка последнего
     раунда горела красным всегда, хотя полуфинал открывался (аудит 29.09). */
  const semiZone=()=>{
    const direct=new Set(m.direct.map(ccM22Key)), myKey=ccSeatKey(you);
    const order=Object.keys(m.series).filter(k=>!direct.has(ccM22Key(m.seriesRows[k]))).sort((a,b)=>m.series[b]-m.series[a]);
    const at=order.indexOf(myKey)+1;
    return at>0 && at<=CC_M22.semi.field;
  };
  const play=async (room, sp, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    const pS=ccPastMajorScore(ev);
    // Матч-поинт финала (CC_M22_MP): первый, кто набрал и победы, и очки, — чемпион, финал кончается.
    const mp=(sp===CC_M22.final) ? CC_M22_MP[ev.n] : null;
    const mpOf=ts=>mp ? ts.find(t=>(t.wins||0)>=mp.vr && (t.stagePts||0)>=mp.pts) : null;
    await simulateGamesLive(room, sp.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       stopWhen: mp ? (ts=>!!mpOf(ts)) : null,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp.games;
    const ranked=ccM24Rank(room), champ=mpOf(room);
    if(champ && ranked[0]!==champ){ ranked.splice(ranked.indexOf(champ), 1); ranked.unshift(champ); }
    return ranked;
  };
  if(ev.stage==='q'){
    /* Раунды этого вечера подряд: прошёл — играешь следующий тем же вечером. Промежуточный
       раунд показывается своей карточкой, итог вечера — последним сыгранным. */
    const Q=m.q[ev.q]=m.q[ev.q]||{};
    const R=ccM22Rounds(ev.n);
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i];
      spec=ccM22Spec(ev.n, r);
      const open=(r===1);
      field=open ? [you, ...careerCupField(cr, drafted, careerLadderEntrants(), 'm22|'+ev.n+'|'+ev.q, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      // Записанный зал короче лобби (старый сейв, пустая запись) — добор сценой.
      if(!open){
        const want=Math.min(ccM22Spec(ev.n, r-1).cut, 100), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'm22q|'+ev.n+'|'+ev.q+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=ccYearLabel('Major'+ev.n+'_2022_Q'+ev.q+'R'+r, careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      if(r===R){
        // Последний раунд: топ прямо в финал, остальные — в серию (вдвое).
        through=place<=spec.cut;
        ranked.slice(0, spec.cut).forEach(t=>m.direct.push(seedOf(t)));
        ccM22SeriesAdd(m, ranked.slice(spec.cut), 2, seedOf);
        if(through) m.ticket=true;
        Q.done=true;
      } else {
        through=place<=spec.cut;
        Q['r'+r]=ranked.slice(0, spec.cut).map(seedOf);
        if(r===R-1) ccM22SeriesAdd(m, ranked.slice(spec.cut), 1, seedOf);
      }
      m.youKey=ccSeatKey(you);
      // Серию получают последний раунд и вылетевшие на предпоследнем — у них место в полуфинале решает она.
      const bySeries=!through && (r===R || r===R-1);
      const zone=bySeries && semiZone();
      note = (r===R) ? (through ? L().ccYr22Direct(spec.cut) : L().ccYr24Series(m.series[m.youKey]||0, ccM22SeriesRank(m, m.youKey)))
                     : (through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
      if(bySeries) note+=' · '+(zone ? L().ccYrSemiZone(CC_M22.semi.field) : L().ccYrSemiOut(CC_M22.semi.field));
      if(zone) alive=true;
      if(i<ev.rounds.length-1){
        const sh=createStageCardShell(stageLabel+' — '+field.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, place, field.length, you.stagePts, through || zone, false, note);
        await revealStandings(sh, ranked, you, spec.cut||0);
        careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
        // Вылет посреди вечера: карточка уже показана — общий блок ниже её не повторяет.
        if(!through){ shownOut=true; break; }
      }
    }
  } else if(ev.stage==='semi'){
    spec={games:ccM22SemiSpec(ev.n, ev.r).games, cut:ccM22SemiCut(ev.n, ev.r)};
    field=rowsOf(ccM22SemiRoom(m, ev.r));
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=ev.label;
    ranked=await play(field, ccM22SemiSpec(ev.n, ev.r), stageLabel, false);
    place=ranked.indexOf(you)+1;
    const up=ccM22WriteSemi(m, ev.r, ranked, seedOf);
    through=up.indexOf(you)>=0;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : (ev.r<3 ? L().ccYr22SemiNext : L().ccRelFail(spec.cut));
  } else {
    spec=CC_M22.final;
    field=rowsOf(ccM22GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M22.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
  }
  m.got[ev.id]=true;
  removeSkipButton();
  const fin=ev.stage==='final';
  if(!shownOut){
    const shell=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, place, field.length, you.stagePts,
      ccStagePassed(through || alive, spec, place, fin ? majorPrize : null), false, fin ? ccMajorSeatNote(ev) : note);
    await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  }
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',
               cash?[ccSeasonEvName(2022, ev.n), place, ccNum(cash)]:[ccSeasonEvName(2022, ev.n), place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsEv(ccSeasonEvName(2022, ev.n)));
    ccGcKeepFinal(2022, ev.n, ranked.map(seedOf));
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
               passed: fin ? cash>0 : (through || alive), ovr:CAREER.player.ovr, games:games||spec.games, wins:you.wins||0, elims:you.stageElims||0,
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
  const lanSeat = fin && ccGlobalsSeat() ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : (through || alive), cut:spec.cut||0,
    note: fin ? null : note, seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}
/* ---- FNCS Invitational 2022 (Роли) -----------------------------------------------
   50 приглашённых дуо со всего мира, двенадцать игр за два дня, $1 000 000 (Liquipedia).
   Зал — настоящие дуо (INV2022_DUOS) карточками 2022-го; своё место вытесняет одно.
   Приглашение карьеры — место в Гранд-финале сезона не ниже половины квоты региона
   (квоты — по настоящим участникам, INV2022_SEATS; у Epic — очки трёх сезонов). */
function ccInv22Quota(){
  let r=careerPrizeRegion();
  const n=(INV2022_SEATS[r]!=null ? INV2022_SEATS[r] : 1);
  return Math.max(1, Math.ceil(n/2));
}
function buildInvitational2022Field(you){
  const seated=new Set();
  const own=you && !you._stub ? you : null;
  if(own) (own.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const limit=CC_GLOB_FIELD-(own?1:0);
  const room=[];
  ccGcSimOn(()=>ccGcList('INV2022_DUOS', INV2022_DUOS)).forEach(d=>{ if(room.length>=limit) return; const t=ccLanTeam(d, null, 88, seated); if(t){ t.gcRoute='inv'; room.push(t); } });
  ccGc23Fill(room, limit, seated);
  if(own){ own.gcRoute='inv'; room.push(own); }
  return room;
}
/* Дивизионы C3S4: Placement Cup не играется — ступень по рейтингу против сцены региона.
   Своя оценка режима (у Epic: топ-200 кубка — Elite, до 1200 — Challenger, остальные —
   Contender): не ниже 30-го перцентиля сцены — Elite, не ниже 5-го — Challenger. */
function ccDiv22Place(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const d=careerToday();
  // День Placement Cup — его играют (ccPlacementApply); по рейтингу — только если кубок пропущен.
  if(d<=CC_DIV_FROM_2022 || d>CC_DIV_END_2022 || cr.div22===cr.season || cr.placed===cr.season) return;
  cr.div22=cr.season;
  const ovr=(CAREER.player && CAREER.player.ovr)||0;
  const pool=ccSceneRoster(ccCareerRegion()).map(c=>c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr||0)).sort((a,b)=>a-b);
  const at=q=>pool.length ? pool[Math.floor(q*(pool.length-1))] : 0;
  cr.division = ovr>=at(0.3) ? 1 : ovr>=at(0.05) ? 2 : 3;
}
/* C4S1: карьера, пришедшая из 2022-го, без сыгранного Placement Cup (16.12.2022) ставится по
   рейтингу против сцены региона той же меркой, что и C3S4 (ccDiv22Place). Свежая карьера 2023-го
   выбирает ступень на экране создания. */
function ccDiv23Place(){
  const cr=CAREER && CAREER.career; if(!cr || cr.placed===cr.season || cr.div23===cr.season) return;
  if(!(cr.year0<2023) || careerToday()<='2022-12-16') return;
  cr.div23=cr.season;
  const ovr=(CAREER.player && CAREER.player.ovr)||0;
  const pool=ccSceneRoster(ccCareerRegion()).map(c=>c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr||0)).sort((a,b)=>a-b);
  const at=q=>pool.length ? pool[Math.floor(q*(pool.length-1))] : 0;
  cr.division = ovr>=at(0.3) ? 1 : ovr>=at(0.05) ? 2 : 3;
}
// ==== /FNCS 2022 machine ====
async function runCareerMajor2024(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y24 || !careerMajorCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
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
  const m=ccM24State(ev.n);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let spec=ccM24Spec(ev);
  let field, stageLabel=ev.label;
  const openRound=(ev.stage==='q' && ev.r===1);
  if(ev.stage==='q'){
    // Первый раунд открыт всему региону — вся лестница, как Ласт Ченс 2026-го.
    /* Оба квалификатора Мейджора — одна и та же сцена.

       Комната открытого раунда сеется неделей ПЕРВОГО квалификатора этого
       Мейджора, а не сегодняшней: иначе февральский квалификатор пересобирал
       пары заново (см. careerSeed, seedWeek). */
    field=openRound ? [you, ...careerCupField(ccM24OpenCr(cr, ev.n), drafted, careerLadderEntrants(), null, true, 0)]
                    : rowsOf(m.q[ev.q]['r'+(ev.r-1)]);
  } else if(ev.stage==='semi'){
    const br=m[m.bracket];
    // Нижняя сетка садится своей вчерашней комнатой И теми, кого уронила верхняя.
    field=rowsOf(ccM24Room(m, m.bracket, ev.r));
    stageLabel=ev.label+' · '+L()[m.bracket==='upper' ? 'ccYr24Upper' : 'ccYr24Lower'];
  } else {
    field=rowsOf(ccM24GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M24.final.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
  }
  const fin0=(ev.stage==='final');
  CC_M24_GAME=0;
  await simulateGamesLive(field, spec.games, fin0 ? ccM24PointsGf : ccM24Points,
    fin0 ? ccM24KillGf : ev.stage==='q' ? CC_M24_KILL_Q : CC_M24_KILL, 'stage', 0, null, null,
    {days:fin0 ? CC_M24_DAY1_GAMES : 0, lobbySize:ccTeams(50), stageName:stageLabel, mapReplay:true, choices:true, stopOnYourDeath:true,
     stopOnWin:!!spec.vr, roomOnly:!openRound,
     // Второй день гранд-финала — ×1.5, и какая игра идёт, знает только этот вопрос.
     dropEachGame:(g,room)=>{ CC_M24_GAME=g;
       return openRound ? null : careerLandingPick(room||field, you, stageLabel, ['major']); }});
  let ranked=ccM24Rank(field);
  let place=ranked.indexOf(you)+1;
  let through=false, note='', twoRounds=false;
  m.got[ev.id]=true;
  /* Европа и NA Central, суббота: раунд 2 показан своей карточкой, прошедшие тут же играют
     раунд 3 — и дальше вечер считается по нему (в записи q[..].r2 лежит топ-250 третьего). */
  let shownOut=false, stay=false;
  if(ev.stage==='q' && ev.r===2 && ccM24Deep()){
    const pass2=place<=spec.cut;
    const sh1=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, sh1, true);
    finalizeStageCard(sh1, place, field.length, you.stagePts, pass2, false,
                      pass2 ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
    await revealStandings(sh1, ranked, you, spec.cut);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
    if(pass2){
      const room=ranked.slice(0, spec.cut);
      const sp3=CC_M24.qDeep[3];
      const label3=L().ccYr24Qual(ev.n, ev.q, 3);
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
      CC_M24_GAME=0;
      await simulateGamesLive(room, sp3.games, ccM24Points, CC_M24_KILL_Q, 'stage', 0, null, null,
        {lobbySize:ccTeams(50), stageName:label3, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:true,
         dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return careerLandingPick(rm||room, you, label3, ['major']); }});
      field=room; spec=sp3; stageLabel=label3; twoRounds=true;
      ranked=ccM24Rank(field); place=ranked.indexOf(you)+1;
    } else shownOut=true;   // вылет в раунде 2: его карточка уже показана — второй раз её не рисовать
  }
  if(ev.stage==='q'){
    if(ev.r<3){
      through=place<=spec.cut;
      m.q[ev.q]=m.q[ev.q]||{};
      m.q[ev.q]['r'+ev.r]=ranked.slice(0, spec.cut).map(seedOf);
      note=through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut);
    } else {
      // Очки серии: линейно по месту последнего раунда, за оба квалификатора.
      ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM24SeriesPts(i+1); m.seriesRows[k]=seedOf(t); });
      m.youKey=ccSeatKey(you);
      /* Серия решает полуфинал после второго квалификатора: верх — upperSize+lowerSize.
         Раньше плашка горела зелёным у всех (аудит 29.09). После первого — ещё не решено. */
      const semiSeats=CC_M24.upperSize+CC_M24.lowerSize, sr=ccM24SeriesRank(m, m.youKey);
      through=ev.q<2 || (sr>0 && sr<=semiSeats);
      note=L().ccYr24Series(m.series[m.youKey]||0, sr)+(ev.q>=2 ? ' · '+(through ? L().ccYrSemiZone(semiSeats) : L().ccYrSemiOut(semiSeats)) : '');
    }
  } else if(ev.stage==='semi'){
    const bracket=m.bracket;
    const passed=ccM24Write(m, bracket, ev.r, ranked, you)||[];
    through=passed.indexOf(you)>=0;
    if(spec.vr){
      m.ticket=m.ticket||through;
      /* Билета нет — значит одно из двух: остался наверху или упал в нижнюю.
         Считается тем же правилом, что и запись (ccM24Write): среди тех, кто
         не взял билет, первые keep остаются, остальные вниз. */
      const keep=(spec.keep!=null) ? spec.keep : ranked.length;
      const dropped=!through && ranked.indexOf(you)>=keep;
      if(dropped) m.bracket='lower';
      // Остался в верхней сетке — вечер пройден (зелёная плашка), хоть билета и нет.
      stay=!through && !dropped;
      note = through ? L().ccYr24VrTicket : dropped ? L().ccYr24Down : L().ccMajNoTicket;
    }
    else { if(ev.r===3) m.ticket=m.ticket||through; note=through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut); }
    // Чужая сетка играет тот же вечер.
    ccM24Settle(m, bracket==='upper' ? 'lower' : 'upper', ev.r);
    // Лучшие нижней поднимаются на пустые места верхней (ccM24Promo) — и ты тоже.
    if(bracket==='lower' && ccM24Promo(m, ev.r).indexOf('you')>=0){ m.bracket='upper'; note+=' · '+L().ccYr24Up; }
  }
  removeSkipButton();
  const fin=ev.stage==='final';
  if(!shownOut){
    const shell=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, place, field.length, you.stagePts,
      ccStagePassed(through || stay, spec, place, fin ? majorPrize : null), false,
      fin ? ccMajorSeatNote(ev) : note);
    await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:ev.stage});
  }
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));
    m.gf=ranked.map(seedOf);
    ccGcKeepFinal(ccCalYear(), ev.n, m.gf);
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews((through || stay)?'good':'flat', (through || stay)?'ccNewsMajThrough':'ccNewsMajOut',
               [ev.label, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(!through && spec.cut && place===spec.cut+1) careerNews('bad', 'ccPostOneOff', [ev.label]);
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division,
               place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : (through || stay),
               ovr:CAREER.player.ovr, games:spec.games*(twoRounds ? 2 : 1), wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:ev.stage,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined,
               top: fin ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  /* В 2024-м дивизионных кубков нет, а окно предложений клубов открывается только после кубка
     (runCareerCup) — то есть клубы писали бы раз в год, на стыке сезона. Здесь окно открывает
     вечер Мейджора: клуб смотрит на результат, как смотрел бы на кубок. */
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  const lanSeat = fin && (ccGlobalsSeat()||{}).via==='major2' ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length,
    through: fin ? cash>0 : (through || stay), cut:spec.cut||0,
    // Та же строка, что и на карточке этапа: очки серии, билет за победу в
    // матче, отсечка — смотря чем этот вечер кончается. См. careerReloadResultCard.
    note: fin ? null : note,
    seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}
/* ---- Мейджор 2023-го ----------------------------------------------------------
   Формат Epic (окна Tracker, Liquipedia; спека career-year-2023-design.md):
   неделя — Day 1 (открытый: вся лестница региона; у Мейджора 1 — только дивизион 1,
   Elite) → топ-200 → Day 2 → топ-50 → финал недели, шесть игр, очки серии по месту.
   После трёх недель — топ-40 серии в Гранд-финал, ещё десять — из Surge Week (у
   Мейджора 3 её нет: все 50 по серии). Гранд-финал — 50 дуо, двенадцать игр.
   «Мейджор 4» — Last Chance Major: одна неделя (топ-250 → топ-50 → финал), финал
   раздаёт места в нижнюю сетку Копенгагена по квоте региона.

   Недели, в которые игрок не играл (или вылетел), досчитываются молча: финал
   недели нужен серии целиком, иначе топ-40 решали бы только сыгранные вечера. */
const CC_M23={
  d1:{games:10, cut:200, open:true},
  d2:{games:10, cut:50},
  wf:{games:6, cut:0},
  // Surge Week (Liquipedia, сверка 7.10): «5 games limit»; «Top 10 … 5 Duos with a victory royale during the session, 5 best duos according to ranking».
  surge:{games:5, cut:10, vr:5},
  final:{games:12, cut:0},
  field:50, seriesTop:40,
  lcm:{d1:{games:10, cut:250, open:true}, d2:{games:10, cut:50}, wf:{games:6, cut:0}}
};
// Очки серии за место в финале недели (Liquipedia, FNCS 2023 Week Finals): 625, 600,
// дальше минус пять до 45-го (385), 46-е — 355 … 50-е — 335.
const CC_M23_SERIES=(function(){
  const t=[625];
  for(let p=2; p<=45; p++) t.push(600-5*(p-2));
  for(let p=46; p<=50; p++) t.push(355-5*(p-46));
  return t;
})();
function ccM23SeriesPts(place){ return (place>=1 && place<=CC_M23_SERIES.length) ? CC_M23_SERIES[place-1] : 0; }
function ccM23Spec(ev){ return ((ev.n===4) ? CC_M23.lcm : CC_M23)[ev.stage] || CC_M23.final; }
function ccM23Weeks(n){ return n===4 ? 1 : 3; }
function ccM23HasSurge(n){ return n===1 || n===2; }
function ccM23Top(n){ return ccM23HasSurge(n) ? CC_M23.seriesTop : CC_M23.field; }
function ccM23Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major23;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM23State(n){
  const cr=CAREER.career;
  let m=ccM23Of(n);
  if(!m) m=cr.major23={n:n, season:cr.season, got:{}, wk:{}, series:{}, seriesRows:{}, surgeTop:null, youKey:null};
  return m;
}
// День события по его id в календаре года (первый день строки).
// Десятка Surge: сначала до пяти победителей матчей (по месту в таблице), потом лучшие по очкам.
function ccM23SurgeTop(ranked){
  const up=[], seen=new Set();
  ranked.forEach(t=>{ if((t.wins||0)>0 && up.length<CC_M23.surge.vr){ seen.add(t); up.push(t); } });
  ranked.forEach(t=>{ if(up.length<CC_M23.surge.cut && !seen.has(t)){ seen.add(t); up.push(t); } });
  return up;
}
function ccM23Day(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2023_'+tail);
  return row ? row[0] : null;
}
function ccM23SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
// Карточки своего состава — чтобы мир не посадил тебя же в чужую комнату.
function ccM23Mine(){
  const me=(typeof careerCard==='function') ? careerCard() : null;
  return me ? [me].concat(careerMates().filter(Boolean)) : [];
}
// Мир для молчаливых комнат: сцена от лица дивизиона 1, острота финала.
function ccM23World(size, salt){
  const cr=CAREER.career;
  return careerCupField(Object.assign({}, cr, {division:1}), ccM23Mine(), size, salt, false, CC_FIELD_SHARP.final);
}
/* Финал недели, досчитанный молча. Комната — вчерашний топ-50 недели, если он записан
   (игрок был, но вылетел), иначе топ-50 первого дня, иначе сцена. */
function ccM23SettleWeek(m, w){
  const wk=m.wk[w]=m.wk[w]||{};
  if(wk.f) return;
  const day=ccM23Day(m.n, 'W'+w+'F');
  if(!day || careerToday()<day) return;          // неделя ещё не сыграна
  const src=(wk.d2 && wk.d2.length) ? wk.d2 : (wk.d1 && wk.d1.length) ? wk.d1.slice(0, CC_M23.field) : null;
  let room=src ? src.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M23.field){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(CC_M23.field+20, 'm23|'+m.n+'|'+w).forEach(t=>{
      if(room.length>=CC_M23.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, CC_M23.field);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m23wf|'+m.season+'|'+m.n+'|'+w, ()=>simulateGames(room, CC_M23.wf.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  if(m.n!==4) ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM23SeriesPts(i+1); m.seriesRows[k]=ccMajorSeatRow(t); });
  wk.f=ranked.map(ccMajorSeatRow);
}
function ccM23SettleWeeks(m){ for(let w=1; w<=ccM23Weeks(m.n); w++) ccM23SettleWeek(m, w); }
// Серия по порядку: ключи и записи от первого места.
function ccM23SeriesOrder(m){
  return Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).map(k=>({key:k, row:m.seriesRows[k]}));
}
// Комната Surge Week: места серии 41–90 (игрок — если он вне топ-40).
function ccM23SurgeRows(m){
  ccM23SettleWeeks(m);
  const top=ccM23Top(m.n);
  return ccM23SeriesOrder(m).slice(top, top+CC_M23.field).map(x=>x.row);
}
// Surge Week, досчитанная молча.
function ccM23SettleSurge(m){
  if(m.surgeTop || !ccM23HasSurge(m.n)) return;
  const day=ccM23Day(m.n, 'Surge');
  if(!day || careerToday()<day) return;
  const room=ccM23SurgeRows(m).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.surgeTop=[]; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m23surge|'+m.season+'|'+m.n, ()=>simulateGames(room, CC_M23.surge.games, ccM24Points, CC_M24_KILL));
  m.surgeTop=ccM23SurgeTop(ccM24Rank(room)).map(ccMajorSeatRow);
}
/* Гранд-финал — пятьдесят: топ серии (40, у Мейджора 3 — 50) и топ-10 Surge Week;
   недобор — следующими по серии. */
function ccM23GfRows(m){
  if(!m) return null;
  ccM23SettleWeeks(m); ccM23SettleSurge(m);
  const out=[], seen=new Set();
  const key=r=>r==='you' ? 'you' : JSON.stringify(r);
  const add=r=>{ const k=key(r); if(!r || seen.has(k) || out.length>=CC_M23.field) return; seen.add(k); out.push(r); };
  const order=ccM23SeriesOrder(m);
  order.slice(0, ccM23Top(m.n)).forEach(x=>add(x.row));
  (m.surgeTop||[]).forEach(add);
  order.forEach(x=>add(x.row));
  return out;
}
// Билет в Гранд-финал. До дня финала — по текущему месту в серии (подсказка календарю).
function ccM23Ticket(m){
  if(!m || !m.youKey) return false;
  const fin=ccM23Day(m.n, 'Final');
  if(fin && careerToday()>=fin){ const rows=ccM23GfRows(m); return ccSeedHasMe(rows); }
  const k=ccM23SeriesRank(m, m.youKey);
  return k>0 && k<=ccM23Top(m.n);
}
// Финал для мира (без игрока): из записи, без неё — верх сцены.
function ccM23WorldFinalRoom(m, drafted, lobbyCr){
  const rows=m ? ccM23GfRows(m) : null;
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M23.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M23.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M23.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M23.field);
}
// Квоты Копенгагена своего региона (участники Liquipedia по дорогам; NA West — в NAC).
function ccGc23Seats(route){
  let r=careerPrizeRegion(); if(r==='NAW') r='NAC';
  const t=GC2023_SEATS[route]||{};
  return t[r]!=null ? t[r] : 0;
}
function ccM23CanStage(ev, cr, gaveUp){
  const s=ccM23Of(ev.n);
  if(s && s.got[ev.id]) return false;
  const wk=s && s.wk[ev.w];
  if(ev.stage==='d1'){
    // Мейджор 1 — только Elite (дивизион 1), как токен EliteCupAccessS23 у Epic.
    if(ev.n===1 && !ccNoDivisions() && cr.division!==1) return false;
    // Last Chance Major — для тех, кто в Копенгаген ещё не едет.
    if(ev.n===4){ const seat=ccGlobalsSeat(); if(seat) return false; }
    return true;
  }
  if(ev.stage==='d2') return !!(wk && ccSeedHasMe(wk.d1));
  if(ev.stage==='wf') return !!(wk && ccSeedHasMe(wk.d2));
  if(ev.stage==='surge'){
    if(!s || !s.youKey) return false;
    ccM23SettleWeeks(s);
    const k=ccM23SeriesRank(s, s.youKey);
    return k===0 || k>ccM23Top(ev.n);
  }
  return !gaveUp && ccM23Ticket(s);
}
async function runCareerMajor2023(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y23 || !careerMajorCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
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
  const m=ccM23State(ev.n);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  const spec=ccM23Spec(ev);
  const wk=(ev.w ? (m.wk[ev.w]=m.wk[ev.w]||{}) : null);
  const stageLabel=ev.label;
  const open=(ev.stage==='d1');
  let field;
  if(open){
    // Мейджор 1 — комната Elite (дивизион 1), остальные — вся лестница региона.
    const elite=(ev.n===1 && !ccNoDivisions());
    field=[you, ...careerCupField(elite ? Object.assign({}, cr, {division:1}) : cr, drafted,
      elite ? careerCupSize(1) : careerLadderEntrants(), 'm23|'+ev.n+'|'+ev.w, !elite, 0)];
  } else if(ev.stage==='d2') field=rowsOf(wk.d1);
  else if(ev.stage==='wf') field=rowsOf(wk.d2);
  else if(ev.stage==='surge'){ field=rowsOf(ccM23SurgeRows(m)); if(field.indexOf(you)<0) field.push(you); }
  else {
    field=rowsOf(ccM23GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M23.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
  }
  CC_M24_GAME=0;
  const pS=ccPastMajorScore(ev);
  await simulateGamesLive(field, spec.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
    {lobbySize:ccTeams(50), stageName:stageLabel, mapReplay:true, choices:true, stopOnYourDeath:true,
     roomOnly:!open,
     dropEachGame:(g,room)=>{ CC_M24_GAME=g;
       return open ? null : careerLandingPick(room||field, you, stageLabel, ['major']); }});
  const ranked=ccM24Rank(field);
  const place=ranked.indexOf(you)+1;
  let through=false, note='';
  m.got[ev.id]=true;
  if(ev.stage==='d1' || ev.stage==='d2'){
    through=place<=spec.cut;
    wk[ev.stage]=ranked.slice(0, spec.cut).map(seedOf);
    note=through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut);
  } else if(ev.stage==='wf'){
    wk.f=ranked.map(seedOf);
    if(ev.n===4){
      const seats=ccGc23Seats('lcm');
      through=place<=seats;
      m.lcmPlace=place;
      note=L().ccYr23LcmSeat(seats);
    } else {
      ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM23SeriesPts(i+1); m.seriesRows[k]=seedOf(t); });
      m.youKey=ccSeatKey(you);
      // Недели до этой, которые игрок пропустил, — в серию тоже.
      for(let w=1; w<ev.w; w++) ccM23SettleWeek(m, w);
      const k=ccM23SeriesRank(m, m.youKey), top=ccM23Top(ev.n);
      through=k>0 && k<=top;
      note=L().ccYr24Series(m.series[m.youKey]||0, k);
    }
  } else if(ev.stage==='surge'){
    const sTop=ccM23SurgeTop(ranked);
    m.surgeTop=sTop.map(seedOf);
    through=sTop.indexOf(you)>=0;
    note=through ? L().ccYr23SurgeWon : L().ccRelFail(spec.cut);
  }
  removeSkipButton();
  const fin=ev.stage==='final';
  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false,
    fin ? ccMajorSeatNote(ev) : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
  careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));
    m.gf=ranked.map(seedOf);
    ccGcKeepFinal(ccCalYear(), ev.n, m.gf);
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut',
               [ev.label, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(!through && spec.cut && place===spec.cut+1) careerNews('bad', 'ccPostOneOff', [ev.label]);
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:false};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  /* Финал Last Chance Major пишется как 'lcm': место в нижнюю сетку Копенгагена
     читается отсюда (ccGlobalsSeat). */
  const stageRec=fin ? 'final' : (ev.n===4 && ev.stage==='wf') ? 'lcm' : ev.stage;
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division,
               place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : through,
               ovr:CAREER.player.ovr, games:spec.games, wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:stageRec,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined,
               top: fin ? ccStageTop(ranked, you) : undefined});
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
  const lanSeat=(fin || (ev.n===4 && ev.stage==='wf')) && ccGlobalsSeat() ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length,
    through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note,
    seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}

/* ---- Копенгаген 2023 -----------------------------------------------------------
   Royal Arena, 13–15 октября (Liquipedia): день 1 — верхняя сетка, 50 дуо с Мейджоров,
   пять игр, топ-25 в финал, остальные вниз; день 2 — нижняя: 25 упавших и 24 с Last
   Chance Major, пять игр, топ-25 в финал; день 3 — финал на 50, шесть игр.
   Залы — настоящие дуо по дорогам (GC2023_DUOS) карточками 2023-го; своё место
   вытесняет одно. Без игрока мир играет только финал (careerWorldFinals). */
/* Строка зала — ники: люди приезжают из всех регионов, и собрать их обратно по сцене
   своего региона (ccMajorTeamFrom) значило бы вернуть чужих игроков без рейтинга.
   ccLanTeam находит настоящую карточку года в любом регионе. */
function ccGc23Row(t){ return (t.squad||[]).map(c=>c && c.handle).filter(Boolean); }
function ccGc23Team(row){ return ccLanTeam(row, null, 85, null); }
const CC_GC23={upper:{games:5, cut:25}, lower:{games:5, cut:25}, final:{games:6, cut:0}, field:50};
function ccGc23Build(routes, rating, seated, limit){
  const out=[];
  routes.forEach(route=>(ccGcSimOn(()=>ccGcList('GC2023_DUOS.'+route, GC2023_DUOS[route]))||[]).forEach(d=>{
    if(out.length>=limit) return;
    const duo=d.length>=2 ? d : [d[0], d[0]];
    const t=ccLanTeam(duo.slice(0, 2), null, rating, seated);
    if(t){ t.gcRoute=route; out.push(t); }
  }));
  return out;
}
function ccGc23Fill(room, limit, seated){
  if(room.length>=limit) return room;
  const lanCr=Object.assign({}, CAREER.career, {division:1});
  careerCupField(lanCr, ccM23Mine(), 80, null, false, CC_FIELD_SHARP.lan).forEach(t=>{
    if(room.length>=limit) return;
    const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
    if(keys.some(k=>seated.has(k))) return;
    keys.forEach(k=>seated.add(k)); room.push(t);
  });
  return room;
}
// Мировой финал (без игрока) — пятьдесят дуо верхней сетки.
function buildGlobalChampionship2023Field(you){
  const seated=new Set();
  const own=you && !you._stub ? you : null;
  if(own) (own.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const room=ccGc23Fill(ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field-(own?1:0)), CC_GC23.field-(own?1:0), seated);
  if(own){ own.gcRoute='m3'; room.push(own); }
  return room;
}
function ccGc23State(){
  const cr=CAREER.career;
  if(!cr.gc23 || cr.gc23.season!==cr.season) cr.gc23={season:cr.season, finals:null, lower:null, lowerDone:false, you:null};
  return cr.gc23;
}
// Верхняя сетка без игрока (он пришёл через Last Chance Major): топ-25 — в финал, остальные вниз.
function ccGc23SettleUpper(st, you){
  if(st.lower) return;
  const seated=new Set(); ((you && you.squad)||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const room=ccGc23Fill(ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field), CC_GC23.field, seated);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('gc23up|'+st.season, ()=>simulateGames(room, CC_GC23.upper.games, majorPoints, CC_GLOB_KILL));
  const ranked=ccM24Rank(room);
  st.finals=ranked.slice(0, CC_GC23.upper.cut).map(ccGc23Row);
  st.lower=ranked.slice(CC_GC23.upper.cut).map(ccGc23Row);
}
// Нижняя сетка без игрока (он уже в финале): её топ-25 дописываются в финал.
function ccGc23SettleLower(st, you){
  if(st.lowerDone) return;
  const seated=new Set(); ((you && you.squad)||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  (st.finals||[]).forEach(r=>{ if(r!=='you') r.forEach(h=>seated.add(_gcNorm(h))); });
  let room=(st.lower||[]).filter(r=>r!=='you').map(ccGc23Team);
  room.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p && p.handle))));
  room=room.concat(ccGc23Build(['lcm'], 84, seated, CC_GC23.field-room.length));
  room=ccGc23Fill(room, CC_GC23.field, seated);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('gc23low|'+st.season, ()=>simulateGames(room, CC_GC23.lower.games, majorPoints, CC_GLOB_KILL));
  st.finals=(st.finals||[]).concat(ccM24Rank(room).slice(0, CC_GC23.lower.cut).map(ccGc23Row));
  st.lowerDone=true;
}
async function runCareerGlobals2023(){
  const cr=CAREER.career;
  const ev=careerGlobalsOn(careerToday());
  if(!ev || !careerGlobalsCan(ev)) return;
  const mpStart=ccMpLock() ? await ccMpGate('globals') : null;
  const seat=ccGlobalsSeat();
  careerCampBonus('globals', ev.id||ev.label||'');
  careerLanArrive('globals', ev);
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  useLandingSet(ACTIVE_LANDING_SET);
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
  const st=ccGc23State();
  const day=ccGc23DayOf(careerToday());          // 1 верхняя, 2 нижняя, 3 финал
  const seated=new Set(); (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const rowsOf=rows=>(rows||[]).map(r=>r==='you' ? you : ccGc23Team(r));
  const seedOf=t=>ccSeedRow(t, you, ccGc23Row);
  let field, spec;
  if(day===1){
    spec=CC_GC23.upper;
    field=ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field-1);
    field=ccGc23Fill(field, CC_GC23.field-1, seated);
    field.push(you);
  } else if(day===2){
    spec=CC_GC23.lower;
    // Пришёл через Last Chance Major — верхняя сетка вчера сыграна без него.
    ccGc23SettleUpper(st, you);
    // Упавшие из верхней (записаны вчера) и 24 с Last Chance Major.
    field=rowsOf(st.lower||[]);
    field.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p && p.handle))));
    const lcm=ccGc23Build(['lcm'], 84, seated, CC_GC23.field-field.length-(field.indexOf(you)<0 ? 1 : 0));
    field=field.concat(lcm);
    if(field.indexOf(you)<0) field.push(you);
    field=ccGc23Fill(field, CC_GC23.field, seated);
  } else {
    spec=CC_GC23.final;
    // Прошёл из верхней — нижняя вчера сыграна без него.
    ccGc23SettleLower(st, you);
    field=rowsOf(st.finals||[]);
    if(field.indexOf(you)<0) field.push(you);
    field=ccGc23Fill(field, CC_GC23.field, seated);
  }
  // Имя дня — сеткой, а не «сессией N»: у Копенгагена у каждого дня своё название.
  const row0=ccYearRows().find(r=>r[2]==='GlobalChampionship2023');
  const label=(row0 ? ccYearLabel(row0[2], row0[0], row0[0]) : ev.label)+' · '+L().ccYr23GcDay(day);
  await simulateGamesLive(field, spec.games, majorPoints, CC_GLOB_KILL, 'stage', 0, null, null,
    {twoDay:true, lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, label, ['summit','major','gclc'])});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  removeSkipButton();
  let through=false, note='';
  if(day===1){
    through=place<=spec.cut;
    st.finals=ranked.slice(0, spec.cut).map(seedOf);
    st.lower=ranked.slice(spec.cut).map(seedOf);
    note=through ? L().ccYr23GcUp : L().ccYr23GcDown;
  } else if(day===2){
    through=place<=spec.cut;
    st.finals=(st.finals||[]).concat(ranked.slice(0, spec.cut).map(seedOf));
    st.lowerDone=true;
    note=through ? L().ccRelPass(spec.cut) : L().ccYr23GcOut;
  }
  const fin=(day===3);
  const shell=createStageCardShell(label+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, fin ? place===1 : through, false,
    fin ? (place===1 ? L().gcChampion : L().gcPlaceNote(place)) : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? gcPrize : null, null, fin);
  careerPrAdd(ranked, {div:1, kind:'globals'});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, gcPrize);
    cash=gcPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'globals'));
    if(place===1) careerNews('good', 'ccNewsGlobChamp', []);
    careerNews(cash?'good':'flat', cash?'ccNewsGlobCash':'ccNewsGlobNoCash',
               cash?[place, ccNum(cash)]:[place, field.length], {tbl:ccStageShot(ranked, you, 1, label)});
    careerNews('flat', 'ccPostThanks', [ev.label]);
    careerCongrats(ranked, you, L().ccCongratsGlobals(ccLanCityIn('globals')));
    cr.globals={place:place, of:field.length, via:seat?seat.via:null, cash:cash};
  } else if(!through && day===2){
    // Вылет из нижней сетки — место за финалом (51+), со своими призовыми.
    const out=CC_GC23.field+(place-spec.cut);
    cash=gcPrize(out);
    if(cash) ccPayIn(ccShareOf(cash, you));
    cr.globals={place:out, of:73, via:seat?seat.via:null, cash:cash};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut', [label, place, field.length], {tbl:ccStageShot(ranked, you, 1, label)});
  }
  st.you=fin ? 'done' : through ? (day===1 ? 'final' : 'final') : (day===1 ? 'lower' : 'out');
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:fin ? place : (cr.globals ? cr.globals.place : place), of:fin ? field.length : 73,
               pts:you.stagePts, passed: fin ? cash>0 : through, ovr:CAREER.player.ovr,
               games:spec.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'globals',
               stage: fin ? 'final' : (day===1 ? 'upper' : 'lower'),
               won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined});
  careerMonthGoalCheck();
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:label, place:place, through: fin ? (place===1||cash>0) : through,
    wins:you.wins||0, cash:cash, cut:spec.cut||0});
}
// Какой это день Копенгагена (1–3) по календарю.
function ccGc23DayOf(iso){
  const row=ccYearRows().find(r=>r[2]==='GlobalChampionship2023');
  if(!row) return 3;
  return Math.min(3, Math.max(1, ccDaysBetween(row[0], iso)+1));
}
