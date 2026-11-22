/*@@PART js/career/slots-saves.js@@*/
/* СЛОТ ВКЛАДКИ. Указатель активного слота лежит в localStorage и общий на все вкладки, а
   careerSave читал его в момент записи: вторая вкладка того же браузера (его случай 22.09 —
   хозяин гонки открыл свою же ссылку приглашения и завёл карьеру в другом слоте) переставляла
   указатель, и первая вкладка со следующим же сохранением писала свою карьеру в чужой слот —
   у хозяина «пропадала кнопка гонки». Теперь вкладка помнит слот, из которого загрузилась, и
   пишет только в него; указатель меняет лишь сама вкладка, выбирая слот. */
let CC_SLOT_TAB=null;
function ccSlotMine(){ return CC_SLOT_TAB || ccSlot(); }
function ccSlot(){
  let n=1;
  try{ n=parseInt(localStorage.getItem(LS_ACTIVE)||'1', 10); }catch(e){}
  return (n>=1 && n<=CC_SLOTS) ? n : 1;
}
function ccSlotUse(n){
  CC_SLOT_TAB=n;
  try{ localStorage.setItem(LS_ACTIVE, String(n)); }catch(e){}
}
function ccSlotRead(n){
  try{ ccLzFlush(LS_SLOT(n)); return ccSaveParse(localStorage.getItem(LS_SLOT(n))); }catch(e){ return null; }
}
function ccSlotWipe(n){
  try{ ccLzDrop(LS_SLOT(n)); localStorage.removeItem(LS_SLOT(n)); }catch(e){}
}
// What a slot says about itself on the picker, without loading it.
// Старый сейв без флага: годы без дивизионных кубков по сезону дня — до S18 (2019–2021) и
// 2024-й (S28–S32); 2022 и 2023 — по своим окнам дивизионов.
function ccSlotNoDivGuess(day){
  const n=ccSeasonNumOn(day);
  if(n && n<=18) return true;
  if(n>=28 && n<=32) return true;
  if(n>=19 && n<=22) return day<CC_DIV_FROM_2022 || day>CC_DIV_END_2022;
  if(n>=23 && n<=27) return day>CC_DIV_END_2023;
  return false;
}
function ccSlotCard(n){
  const s=ccSlotRead(n);
  if(!s || !s.player || !s.career) return null;
  // The slot picker reads a save without loading it, so it cannot ask
  // ccPlayerAge - it works the same answer out off the save's own two fields.
  const born=s.player.handle ? ccBornOf(s.player.handle) : null;
  const onDay=s.career.day||CC_YEAR_FROM;
  // Plus the seasons that have run, which is the correction ccAgeNow makes for
  // everybody else: the clock goes back to January every year and a birthday
  // read against it stands still.
  const real=born ? ccAgeOn(born, onDay)+Math.max(0, (s.career.season||1)-1) : null;
  /* Лицо и флаг — чтобы плитку узнавали, не читая. Отзыв:
     «понятней, что за карьера, мб фото игрока и рейтинг». Портрет берётся
     так же, как везде: свой загруженный снимок, иначе — портрет карточки. */
  const face=s.player.photo
    || (s.player.handle ? photoURL({handle:s.player.handle,
                                    region:s.player.cardRegion||s.player.region,
                                    _photo:null}) : null);
  /* Напарник — чтобы карьеры различались не только ником своего игрока.
     Отзыв: «а тимейта можно указать, типо чтоб понимали».
     Живой напарник из лобби лежит в тех же CAREER.partners (см. ccMpBoot),
     поэтому читается одинаково; командную карьеру выдаёт cr.mp. */
  const held=(s.partners||[]).filter(Boolean);
  const mate=held[0] ? (held[0].handle||held[0].nick||null) : null;
  return {nick:s.player.nick||'', ovr:s.player.ovr||0, age:real!=null?real:(s.player.age||0),
          face:face, country:s.player.country||null,
          mate:mate, mates:held.length, team:!!(s.career && s.career.mp),
          div:s.career.division||5, season:s.career.season||1,
          day:s.career.day||CC_YEAR_FROM, earnings:s.career.earnings||0,
          org:(s.org&&s.org.name)||null, over:!!s.career.seasonOver,
          noDiv:s.career.noDiv!=null ? !!s.career.noDiv : ccSlotNoDivGuess(s.career.day||CC_YEAR_FROM),
          retired:!!s.career.retired};
}
/* ДЕНЬГИ ПО ССЫЛКЕ — ТОЛЬКО ТАМ, ГДЕ ИДЁТ ОТЛАДКА.
   Просьба: «сделай мне баланс 2 миллиона, чтоб посмотреть функционал».
   Клуб стоит миллион, и дойти до него честной игрой — несколько сезонов, а посмотреть
   надо сейчас. Ссылка удобнее консоли, но такая же ссылка на боевом сайте — это кнопка
   «выдать себе денег» для кого угодно, поэтому адрес проверяется: fncsdraft.com про
   ?cash не знает вовсе. Заработанным эти деньги не считаются — earnings не трогаем,
   иначе они поедут в доски призовых и в рейтинг. */
function ccDebugCash(host){
  try{
    // Адрес можно передать: подменить location.hostname сторож не может, он только для чтения.
    const h=String(host!=null ? host : (location.hostname||''));
    if(/(^|\.)fncsdraft\.com$/i.test(h)) return false;
    const m=String(location.search||'').match(/[?&]cash=([0-9]{1,12})/);
    if(!m || !CAREER || !CAREER.career) return false;
    CAREER.career.balance=Number(m[1]);
    careerSave();
    return true;
  }catch(e){ return false; }
}
/* СЕЙВ ЕСТЬ, НО НЕ ПРОЧИТАЛСЯ (Notion «0910», игрок: «обновил браузер — весь прогресс пропал, сохранения нет?»).
   Было: нечитаемый сейв = «карьеры нет», вход вёл на создание, и новая карьера ложилась поверх старой в тот же
   слот — потеря без следа. Теперь сырая строка откладывается рядом (<слот>_unread, один раз), а вход ведёт
   к списку карьер с объяснением, а не к созданию. */
let CC_LOAD_BAD=null;
function careerLoad(){
  CC_SLOT_TAB=ccSlotMine();   // слот этой вкладки — с первой загрузки
  CC_LOAD_BAD=null;
  let raw=null;
  try{ ccLzFlush(LS_SLOT(CC_SLOT_TAB)); raw=localStorage.getItem(LS_SLOT(CC_SLOT_TAB)); CAREER=ccSaveParse(raw); }catch(e){ CAREER=null; }
  try{ ccSaveMarkAdopt(); }catch(e){}   // отметка записи слота — своя с этой загрузки (см. ccSaveStale)
  if(raw && !CAREER){
    CC_LOAD_BAD={slot:CC_SLOT_TAB};
    console.error('career save in slot '+CC_SLOT_TAB+' could not be read; kept as '+LS_SLOT(CC_SLOT_TAB)+'_unread');
    try{ if(!localStorage.getItem(LS_SLOT(CC_SLOT_TAB)+'_unread')) localStorage.setItem(LS_SLOT(CC_SLOT_TAB)+'_unread', raw); }catch(e){}
  }
  // Раздутая книга высадок старых сейвов (до ccLobbyMine, 21.10) — сбросить: наберётся заново по лобби игрока.
  try{ const b=CAREER && CAREER.career && CAREER.career.dropBook; if(b && b.at && Object.keys(b.at).length>CC_DROP_BOOK_MAX) delete CAREER.career.dropBook; }catch(e){}
  // Снимок роастера носит на себе то, что с ним сделала карьера, которая
  // была открыта до этой. Другая карьера — другая сцена.
  CC_NOW_CARDS={}; CC_ARC_PAIRS={};
  /* И подписи года — тоже чужие.

     careerYearDays строит весь год один раз и держит в CC_YEAR_DAYS, потому что
     хаб спрашивает его на каждой перерисовке. Две строки в нём читают саму
     карьеру: имя Виктори Капа (ccVictoryCupName — дуо или трио) и город ЛАНа
     (ccLanCity — свой на каждый сезон). Кэш сбрасывался на смене языка и на
     смене сезона, а на смене КАРЬЕРЫ — нет: сейв, открытый из списка слотов,
     мимо careerNewSeason не проходит.

     Отсюда скриншот: заголовок «ТРИО ВИКТОРИ КАП 1», а строкой
     ниже «ДУО · ДИВИЗИОН 1». Подпись осталась от трио-карьеры, открытой до
     этой; слово рядом читается живьём и потому честное. Его пометка к скрину:
     «дуо играю режим». */
  CC_YEAR_DAYS=null;
  // Every load, not only the ones that come through careerEntry: a career opened
  // from the slot picker or by a harness has the same forty old posts in it.
  // The shape of the squad is the same kind of thing and belongs here for the
  // same reason: a save switched to from the slot picker never passes the entry
  // point, and one that still holds the old single `partner` field would arrive
  // at the hub with an empty seat and a person sat in it.
  if(CAREER){ careerNotesMigrate(); careerMigrateSize(); careerMigratePartners();
              careerMigrateHome(); careerMigrateDiff(); careerMigrateSpotIslands();
              careerMigrateNoDiv(); careerMigrateDivDepth();
              careerMigrateBeefsOff();
              // Новая глава — книги роста поправкой (ccChapterCarry); сейв в середине главы — один раз.
              if(ccChapterCarry()) careerSave();
              // Сейв, раздутый линейной формулой твича, — под потолок. См. CC_TW_CEIL.
              careerMigrateTwitch();
              if(careerMigrateTwitchFromX()) careerSave();
              // Про 2026 года: настоящие Twitch и YouTube в сейв, начатый до 28.10 (один раз). См. CC_PRO_SOCIAL.
              if(ccMigrateProSocial()) careerSave();
              // A save from before the desk touched the card owns the devices
              // and not the skill they now carry. Recounted, not migrated: the
              // same recount every purchase runs. See careerGearSkill.
              careerGearSkill();
              // And a save written while somebody in the squad still had an open
              // offer standing carries it. See careerDmSquadTidy.
              careerDmSquadTidy();
              /* Книга роста сцены, написанная сломанной формулой, сжигается
                 один раз. До 22 августа careerGrowField сливал верх ростера
                 системно: ожидание сильнейшего стояло на первом месте, тейпер
                 резал его возрастной плюс до центрирования — и Malibuca ходил
                 92 при своих 96 («опять рейтинги падают, малибука был 96»).
                 Формула починена, но накопленный минус лежит в сейве. Отличить
                 в этих числах честно наигранное от слитого нельзя — они одна
                 сумма, — поэтому книга открывается заново: роастер возвращается
                 к измеренным рейтингам и растёт уже честной формулой. */
              if(CAREER.dev && !CAREER.devV){ delete CAREER.dev; }
              if(!CAREER.devV) CAREER.devV=2;
              /* И доска ПР — на людей, один раз. Старый сейв держит строки
                 составов («NOCIF & Izzi & Kaki22», «Твой состав: BOBRIK»):
                 вечера составной строки уезжают каждому её участнику, сама
                 она удаляется. См. careerPrAdd — новые вечера пишутся людям
                 сразу. */
              if(!CAREER.prV){
                const t=CAREER.career && CAREER.career.pr;
                if(t && t.rows){
                  const yk=hKey((CAREER.player && (CAREER.player.handle || CAREER.player.nick))||'');
                  Object.keys(t.rows).forEach(function(k){
                    const bare=k.replace(/^[^:&+]{1,40}:\s*/, '');
                    const who=bare.split(/\s*[+&]\s*/).map(s=>s.trim()).filter(Boolean);
                    if(who.length<2 && bare===k) return;
                    const src=t.rows[k];
                    who.forEach(function(h){
                      const row=t.rows[h] || (t.rows[h]={v:[], n:0});
                      row.v=(row.v||[]).concat(src.v||[]);
                      ccPrRowTrim(row);
                      row.n+=src.n||0;
                      if(src.you && hKey(h)===yk) row.you=true;
                    });
                    delete t.rows[k];
                  });
                }
                CAREER.prV=2;
              } }
  /* Дом уехавшего из России про — Сербия и в старом сейве. См. CC_PRO_HOME:
     карьера, взятая за Малибуку до этой таблицы, «жила» по флагу. Только пока
     дом так и читается по флагу ('ru') и своя рука его не трогала — переезд,
     сделанный игроком, сейв не переписывает. */
  try{
    const pl=CAREER.player;
    const home=pl && pl.source==='card' ? ccProHomeOf(pl.nick) : null;
    if(home && pl.country==='ru' && !pl.livesIn){
      pl.country=home;
      // Пинг в ЕС без переезда читается из сейва (см. ccPingNow) — переезжает
      // вместе с домом.
      const p=ccPingOf(home, pl.region||'EU');
      if(p!=null) pl.countryPing=p;
    }
  }catch(e){}
  // A different career is a different place to live. What the last one was
  // looking at in the flat list belongs to the last one. See CH_FLAT_PLACE.
  CH_FLAT_PLACE=null;
  /* Деньги по ссылке ставятся ЗДЕСЬ, а не на входе в карьеру: входов несколько
     (плитка, список слотов, ссылка лобби), и все они проходят через загрузку. */
  try{ ccDebugCash(); }catch(e){}
  return CAREER;
}
// A save that cannot be written is the career quietly ceasing to exist, and this
// used to swallow the reason without a word - a banked Opens once wrote a
// megabyte of team names, blew the quota, and every night after it was played on
// a save that was never being written. It still must not throw, because failing
// to save is not a reason to stop the tournament on screen, but it says so.
let CC_SAVE_FAIL=null;
/* What a career can lose without losing the career.

   In order, cheapest first. The feed's attached tables are screenshots of nights
   that have already been read; the feed itself is forty posts of which the last
   twenty-five are history; the banked Opens evening is one evening's carry; the
   inbox keeps its threads but not every line of them. The log is never touched —
   it is the honours, the money, the Power Ranking and the qualification routes,
   and a career without it is a career that did not happen.

   Each step returns whether it actually freed anything, so the retry loop stops
   the moment there is nothing left to give rather than spinning. */
const CC_SAVE_TRIM=[
  // Книга высадок (ccDropBook) — первой: потеря стоит лишь того, что боты выберут точки заново.
  function(cr){ if(!cr.dropBook) return false; delete cr.dropBook; return true; },
  function(cr){ let n=0; (cr.news||[]).forEach(function(e){ if(e.tbl){ delete e.tbl; n++; } }); return n>0; },
  function(cr){ if(!(cr.news||[]).length || cr.news.length<=15) return false;
                cr.news.length=15; return true; },
  function(cr){ if(!cr.rel) return false; delete cr.rel; return true; },
  function(cr){ let n=0;
                (CAREER.dms||[]).forEach(function(t){
                  if((t.msgs||[]).length>4){ t.msgs=t.msgs.slice(-4); n++; } });
                return n>0; },
  function(cr){ if(!(cr.news||[]).length) return false; cr.news.length=0; return true; },
  /* И только потом — то, что сцена наиграла себе за эти сезоны. Это
     девятьсот чисел, самый большой кусок сейва после ленты, и терять его
     жалко: роастер вернётся к своим измеренным рейтингам. Но карьера,
     которую негде сохранить, теряется целиком. */
  /* Сначала выдуманные: их книга ограничена (ccDevLTrim), но под квотой она
     всё равно дешевле настоящей сцены — терять нечего, кроме пары рейтинга у
     людей с выдуманными никами. */
  function(){ if(!CAREER.devL) return false; delete CAREER.devL; return true; },
  function(){ if(!CAREER.dev) return false; delete CAREER.dev; return true; }
];
/* Что принадлежит команде, а что человеку.

   Список закрытый и перечислен в спеке мультиплеерной карьеры. Всё, чего в нём
   нет, — личное: энергия, форма, деньги, контракт, квартира, спонсоры, девайсы,
   инбокс, охват. Оно лежит в localStorage у каждого своё и на расчёт вечера не
   влияет — это не удобство, а условие локстепа, и его стережёт
   tools/check-lockstep.js.

   `mp` держит код лобби и роль; он командный, потому что разрыв дуо обязан
   доехать до обоих. Граница целиком — tools/check-mp-split.js. */
/* Метка этой сборки. Ставится tools/stamp-build.js, сверяется
   tools/check-mp-build.js. Лобби не пускает клиента с чужой меткой: локстеп
   держится на том, что обе стороны считают ОДНИМ И ТЕМ ЖЕ кодом. */
const CC_BUILD='3eb1a993';
/* `region` — командный, и это не мелочь.

   Регион живёт в CAREER.player, то есть личный, а читает его пул, из которого
   строится ЛОББИ (ccPoolRegion), и сетка хитов Мейджора. Двое из разных
   регионов посчитали бы разные комнаты — расхождение, которого не видно до
   самой таблицы. Команда играет в одном регионе, как и настоящее дуо на
   доске; регион команды ставит тот, кто её создал, и он же едет напарнику
   вместе с днём. Личный region игрока при этом остаётся его: он про то, где
   человек живёт (аренда, пинг, переезд). */
/* `mates` — третий (и любой не-живой), и он тоже командный.

   Правка: «в три разреши брать». В трио-сезоне кресел три:
   двое живых и один взятый. Но взятый обязан быть ОБЩИМ — наберёт каждый
   своего, и у двоих снова разные составы, то есть ровно то расхождение, ради
   которого случайных и запретили в дуо. Поэтому запись о нём едет в командном
   состоянии, а берёт его владелец лобби. В одиночной карьере поле не
   используется вовсе: там напарники лежат в CAREER.partners, как лежали. */
/* `spots` — метки на картах, и они тоже командные.

   Отчёт: «выбрал спот, у тимейта не показывается сразу» —
   у одного три дома из трёх, у второго ноль. Дом не может быть личным:
   команда садится в ОДНУ коробку, дом решает, куда, а аура на нём — то, что
   комната знает про эту команду. Разные метки у двоих — это разные комнаты,
   то есть расхождение вечера, а не только пустая плитка. */
/* Мир, который у двоих обязан совпадать. Если сюда не внести состояние, которое решает исход вечера, двое молча
   считают разный мир, и локстеп ловит уже разъехавшееся.
   diff: сложность умножает рост сцены (careerDevelopNow -> careerGrowField), на разной сложности вырастут разные люди.
   duoSplits: какие настоящие дуо распались. majorSeed, summitSeed, relSeed, gcSeed: посевы между стадиями.
   table, d1, events, major…ewc: результат команды в каждом турнире.
   Личное сюда не кладём: деньги, ирнинг, форма, энергия, контракт, менеджер, инбокс, охват, твич, соцсеть.
   Граница проверяется tools/check-mp-split.js. */
/* 'beefs' — командный ключ с 28 августа. Биф читает careerSpotFearOn
   (CC_BEEF_SET) и через landingScore решает, кто из ботов падает на твой дом,
   — то есть входит в раздачу дропа СВОЕГО лобби. Пока он был личным, двое
   раскладывали своё лобби по-разному, а чужие — одинаково: скриншот (страница «neeww») ровно такой — чужие строки таблицы совпадают
   до очка, своя строка разная. И «после смерти на локации всё ломается» —
   это оно: биф рождается в стычке дома (careerBeefNight). */
// year/year0 — общие (30.09): друг по ссылке хозяина, который уже перешёл в следующий год, оставался
// в году начала — день приезжал 2021-й, а календарь года стоял 2019-й.
const CC_TEAM_KEYS=['seed','day','year','year0','mxDone','mxCan','vpick','season','division','diff','tokens','seasonOver','chemSince','beefs',
                    'sizes','trios','orphanMate','log','mp','region','mates','spots','seasonTurn',
                    'majorSeed','summitSeed','relSeed','gcSeed','duoSplits','exMates','table',
                    'events','d1','major','summit','globals','reload','rel','wf','rc',
                    'gclc','solo','soloBy','solos','solosBy','solosRl','solosRlBy','gifts','ewc','fmtPick','mobDev'];
/* Командное, которое лежит прямо в CAREER, а не в CAREER.career.
   Книга роста сцены живёт в CAREER.dev; если читать ключ 'dev' как CAREER.career.dev, выходит undefined и у двоих
   растут разные сцены. Коуч общий.
   duoStreak, splits, lft: память о чужих парах (серии в нижней трети, распады, поиск третьего). Копится в
   careerGrowField из результатов вечера, так что расходится, если один зашёл с другого устройства, вплоть до
   сезонного оборота в cr.duoSplits. Личного тут нет. */
// devL — книга роста придуманных ботов: после личных соло-вечеров у двоих расходилась, и поле следующего
// общего вечера собиралось из разных ботов (живой прогон 2019, 30.09).
const CC_TEAM_TOP=['dev','devL','coach','duoStreak','splits','lft'];
/* Сколько кресел в командной карьере занимают живые: ты и напарник. Всё, что
   сверх — кресла для взятых. В дуо-сезоне их ноль, в трио одно. */
const CC_MP_HUMANS=2;
function ccMpBotSeats(){
  return ccMpOn() ? Math.max(0, careerSquadSize()-CC_MP_HUMANS) : careerMateSeats();
}
/* Взятые на один вечер другого формата (трио-кап в дуо-год, сквад-кап): филлы, одинаковые у обоих. Ставит
   ccMpFmtBegin, снимает ccEventRosterEnd; общий состав команды (cr.mates) не трогается. */
let CC_MP_FMT_MATES=null, CC_MP_FMT_FP='', CC_MP_FMT_PICKS=0;   // FP — отпечаток памяти троек на входе, в строке расхождения
// Записи взятых: в команде они общие, в одиночной — свои.
function ccMpMateRecs(){
  const cr=(CAREER && CAREER.career) || {};
  if(!ccMpOn()) return careerMateRecords();
  if(CC_MP_FMT_MATES) return CC_MP_FMT_MATES.slice(0, ccMpBotSeats());
  if(!Array.isArray(cr.mates)) cr.mates=[];
  return cr.mates.filter(Boolean).slice(0, ccMpBotSeats());
}
/* Команда есть (лобби в сейве) — и команда СЧИТАЕТ вечер (локстеп). Это
   почти всегда одно и то же; расходятся они на один случай — см. CC_MP_ALONE. */
function ccMpTeam(){
  return !!(CAREER && CAREER.career && CAREER.career.mp && CAREER.career.mp.code);
}
/* Вечер, который в команде играет ОДИН.

   Solo Series — личный турнир: в хиты и финал каждый проходит сам. Прошёл
   один — второму в этот день играть нечего, а локстеп ждёт обоих: гейт ждёт
   «готов», барьеры ждут хеш, вопросы ждут ответ. Поэтому такой вечер
   считается как одиночный — без сида, без барьеров, без закрытия, — а итог
   (день, журнал, проход) уезжает напарнику обычным состоянием команды.
   Ставится раннером Solo Series на вход и снимается перед сохранением. */
let CC_MP_ALONE=false;
/* Вечер команды, разошедшийся на границе раундов: соло-кап вдвоём, во второй раунд прошёл один
   (ccTeamNightApart). Дальше вечер его личный — для копилки и роста мира как CC_MP_ALONE, но
   локстеп не трогается (напарник уже закрыл вечер, барьеры отпускает «peer done»). Снимается
   на старте и в конце каждого вечера (careerPlayRun0). */
let CC_TEAM_NIGHT_APART=false;
function ccTeamSoloNight(){ return ccMpTeam() && ((typeof CC_MP_ALONE!=='undefined' && CC_MP_ALONE) || CC_TEAM_NIGHT_APART || ccTeamSplitNight()); }
