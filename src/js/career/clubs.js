/*@@PART js/career/clubs.js@@*/
/* ПОДПИСЧИКИ КЛУБОВ В X (его слова 8.10: «добавь фоловеров оргам», «пусть фоловеры рядом с клубом пишет, типо даёт
   клуб медийку»). Основной аккаунт клуба: число и месяц снимка. Сняты 8.10.2026 через api.fxtwitter.com (профиль X
   без входа), каждый сверен по имени и описанию — у многих клубов есть чужие тёзки (Wave, BIG, Valiant…), их нет.
   NRG и Gambit — последние найденные (2023-07). Клуб без числа получает ОЦЕНКУ (на экране «≈»), подобранную по этим
   же клубам: с призовыми топ-100 — lg f = 1.963 + 0.607·lg(призовые) (50 клубов), без них — lg f = −4.654 +
   0.1068·уровень клуба (41 клуб). Общие для карьеры и менеджера. */
const CC_ORG_FOL={"FUT Esports":[171728,'2026-10'],"100 Thieves":[1204938,'2026-10'],"7VEN CLUB":[49700,'2026-10'],"9z Team":[310905,'2026-10'],"A2":[22277,'2026-10'],"AIGHT":[34700,'2026-10'],"Absolute First":[6421,'2026-10'],"Agent Gaming":[26400,'2026-10'],"Armour Esports":[2322,'2026-10'],"Become Legends":[92685,'2026-10'],"Bravado Gaming":[14700,'2026-10'],"COOLER Esport":[22615,'2026-10'],"Chiefs Esports Club":[29120,'2026-10'],"Cloud9":[1114040,'2026-10'],"Complexity Gaming":[268957,'2026-10'],"Copenhagen Flames":[22666,'2026-10'],"Crazy Raccoon":[1241481,'2026-10'],"Delta Esports":[414,'2026-10'],"DetonatioN FocusMe":[190098,'2026-10'],"Dignitas":[260599,'2026-10'],"Dynamind":[478,'2026-10'],"Elite Esports":[60951,'2026-10'],"Enterprise Gaming":[23669,'2026-10'],"EvozA eSport":[11300,'2026-10'],"Executors One":[1052,'2026-10'],"F4TALITY":[9932,'2026-10'],"FOKUS":[60760,'2026-10'],"FOKUS CLAN":[60760,'2026-10'],"FURIA Esports":[621200,'2026-10'],"FaZe Clan":[5300000,'2026-10'],"Falcons Esports":[703512,'2026-10'],"Fluxo W7M":[433323,'2026-10'],"Fnatic":[1662760,'2026-10'],"G2 Esports":[1623788,'2026-10'],"Galaxy Racer":[196952,'2026-10'],"Gambit Esports":[138400,'2023-07'],"Gen.G Esports":[223300,'2026-10'],"Gentle Mates":[344900,'2026-10'],"Ghost Gaming":[246051,'2026-10'],"Glory Esports":[1063,'2026-10'],"Godsent":[92805,'2026-10'],"Grizi Esport":[60469,'2026-10'],"Guild Esports":[107603,'2026-10'],"HEROIC":[191282,'2026-10'],"HarD Gaming Pro":[1999,'2026-10'],"Hero Base":[102231,'2026-10'],"JFT Esports":[13445,'2026-10'],"Karmine Corp":[568236,'2026-10'],"LND Esports":[2381,'2026-10'],"LOUD":[1814509,'2026-10'],"LYNX e-sports":[53400,'2026-10'],"Lestream Esport":[32574,'2026-10'],"Leviatán":[176200,'2026-10'],"Loyal Esports":[5410,'2026-10'],"Lyost Esport":[17300,'2026-10'],"M10 eSports":[56466,'2026-10'],"Manchester City Esports":[53874,'2026-10'],"NRG":[868144,'2023-07'],"Natus Vincere":[876741,'2026-10'],"Newbee":[47550,'2026-10'],"Ninjas in Pyjamas":[514855,'2026-10'],"Northern Star Gaming":[5358,'2026-10'],"OBI E-sports":[3526,'2026-10'],"Optimal Ambition":[17835,'2026-10'],"Ovation eSports":[33575,'2026-10'],"Overt":[10383,'2026-10'],"Raised By Kings":[13800,'2026-10'],"Renegades":[57607,'2026-10'],"Ry2 Esports":[2052,'2026-10'],"SCYTES":[4023,'2026-10'],"Sentinels":[1053314,'2026-10'],"ShindeN":[30800,'2026-10'],"Siko Esports":[7072,'2026-10'],"SmokeSolid Gaming":[1591,'2026-10'],"Solary":[333644,'2026-10'],"Spectrum Esc":[2450,'2026-10'],"Supremacy":[38467,'2026-10'],"T1":[369435,'2026-10'],"TSM":[1899008,'2026-10'],"TT9 Esports":[19800,'2026-10'],"Team Atlantic":[12342,'2026-10'],"Team Envy":[517448,'2026-10'],"Team Falcons":[703512,'2026-10'],"Team Heretics":[1059691,'2026-10'],"Team Liquid":[737797,'2026-10'],"Team SAQR":[19300,'2026-10'],"Team Secret":[576689,'2026-10'],"Team TRIBE":[1726,'2026-10'],"Team Vitality":[853862,'2026-10'],"Tempo Storm":[164235,'2026-10'],"Ultimate Warriors":[2764,'2026-10'],"Virtus.pro":[247989,'2026-10'],"XSET":[200049,'2026-10'],"ZETA DIVISION":[640793,'2026-10']};
let CC_ORG_FOL_KEYS=null;
function ccOrgFollowers(name, tier){
  if(!CC_ORG_FOL_KEYS){ CC_ORG_FOL_KEYS=new Map(); Object.keys(CC_ORG_FOL).forEach(k=>CC_ORG_FOL_KEYS.set(ccOrgEarnKey(k), CC_ORG_FOL[k])); }
  const hit=CC_ORG_FOL_KEYS.get(ccOrgEarnKey(name));
  if(hit) return {n:hit[0], est:false, asOf:hit[1]};
  const earn=ccOrgEarn(name);
  const lg=earn ? 1.963+0.607*Math.log10(earn) : -4.654+0.1068*(tier||78);
  return {n:Math.max(500, Math.min(400000, Math.round(Math.pow(10, lg)/100)*100)), est:true, asOf:null};
}
function ccOrgFolText(f){ return (f.est ? '≈' : '')+ccFollowers(f.n); }
/* Медийка клуба для игрока (оценка режима): объявление о подписании — 1.5% аудитории клуба (от 500 до 50 000),
   дальше клуб постит тебя каждый месяц — 0.2% (от 50 до 8 000). Академия — вдвое меньше: её постят реже.
   Было 0.3% и 0.05% — его слово 8.10: «подписчики в месяц нереалистично мало, и когда анонсят игрока, подпишутся же
   сколько-то». Замера нет (сколько людей приходит к игроку с поста клуба, никто не публикует) — это оценка. */
function ccOrgMediaSign(name, tier, academy){
  const f=ccOrgFollowers(name, tier).n;
  return Math.round(Math.max(500, Math.min(50000, f*0.015))*(academy ? 0.5 : 1));
}
function ccOrgMediaMonth(name, tier, academy){
  const f=ccOrgFollowers(name, tier).n;
  return Math.round(Math.max(50, Math.min(8000, f*0.002))*(academy ? 0.5 : 1));
}
/* Ростерный уровень + призовые → уровень клуба. n — сколько людей в снимке.

   Правка 8.10 (его «почему BIG так далеко» → «делай» для карьеры): BIG 2026 (vic0 + Malibuca) выходил ≈85 —
   два человека считались «малым составом», а $31.5k призовых (клуб в Fortnite недавно, последнее место топ-100)
   тянули ядро к 78. Теперь как в менеджере (mgrClubLevel):
   — срез к полу 78 (половина лишнего) — только когда людей МЕНЬШЕ, чем выходит на турнир (дуо 2, трио 3);
   — призовые — история клуба: смешиваются пополам, но только поднимают (Sentinels с одним Bugha — да,
     действующий сильный дуэт без истории — не опускают). */
function ccOrgTier(name, roster, n){
  const usd=ccOrgEarn(name);
  const size=(typeof careerSquadSize==='function' && CAREER && CAREER.career) ? careerSquadSize() : 2;
  let t=roster;
  if(n<size) t-=Math.max(0, roster-CC_ORG_EARN_FLOOR)*0.5;
  if(usd!=null) t=Math.max(t, (t+ccOrgEarnLevel(usd))/2);
  return Math.min(96, Math.round(t));
}
/* Контракты годичные: каждый год игрок по броску продлевает или уходит. Бросок не хранится, с 2-го года до
   текущего пересчитывается тот же посоленный бросок, так что переходы копятся, перезагрузка их не меняет,
   а сейв не растёт. Первый сезон не трогаем, снимок играет как записан. Клубы берём из базовых карточек:
   careerOrgPool выводится из ростера, читать его отсюда значит замкнуть круг. */
const CC_ORG_MOVE=0.25;
let CC_ORG_NAMES={};
function ccOrgNamesOf(reg){
  if(CC_ORG_NAMES[reg]) return CC_ORG_NAMES[reg];
  const seen=new Map();
  PLAYERS.forEach(p=>{
    if((p.region||'')!==reg || !p.org) return;
    const k=clubLogoFile(p.org)||p.org;
    if(!seen.has(k)) seen.set(k, p.org);
  });
  CC_ORG_NAMES[reg]=[...seen.values()];
  return CC_ORG_NAMES[reg];
}
function ccSeasonOrg(card, reg){
  const cr=CAREER && CAREER.career;
  if(!cr || !card || !card.org) return null;
  const s=Math.max(1, cr.season||1);
  if(s<=1) return null;
  const list=ccOrgNamesOf(reg||card.region||ccCareerRegion());
  if(list.length<2) return null;
  let org=card.org;
  for(let y=2; y<=s; y++){
    const r=careerRng(ccHashStr('orgYear|'+ccWorldSeed()+'|'+y+'|'+hKey(card)));
    if(r()>=CC_ORG_MOVE) continue;             // контракт продлён
    const pick=list[Math.floor(r()*list.length)];
    if(pick) org=pick;
  }
  return org;
}
function careerOrgPool(){
  const reg=ccCareerRegion();
  if(CC_ORG_POOL[reg]) return CC_ORG_POOL[reg];
  const by=new Map();
  careerRosterNowEU().forEach(p=>{
    if(!p.org) return;
    const key=clubLogoFile(p.org)||p.org;
    if(!by.has(key)) by.set(key, {names:new Map(), ovrs:[]});
    const g=by.get(key);
    g.names.set(p.org, (g.names.get(p.org)||0)+1);
    g.ovrs.push(p._ovr);
  });
  /* Уровень клуба — то, что он ВЫСТАВЛЯЕТ, а не среднее по списку.

     Средним арифметическим клуб с одним игроком 95 выходил ровно 95 («Aurora
     tier 95 будто точно» — отзыв), а Team HavoK с восемью
     людьми от 94 до 77 — 88, ниже клуба из двух 96-х. Глубина состава
     наказывалась, а одна звезда делала «клуб мирового уровня».

     Теперь: средняя двух сильнейших (дуо, которое клуб реально сажает), минус
     два у клуба с одним игроком (непроверенный), плюс глубина — +1 от четырёх
     человек, +2 от восьми. Потолок 96, как у верха сцены.

     Это ростерная половина. Вторая — призовые клуба по Fortnite, ccOrgTier
     над CC_ORG_EARN: там же сказано, почему двух звёзд мало для уровня Liquid.
     `roster` в строке клуба — ростерная половина без призовых, для проверок. */
  CC_ORG_POOL[reg]=[...by.values()].map(g=>{
    const o=g.ovrs.slice().sort((a,b)=>b-a);
    const top=o.length>=2 ? (o[0]+o[1])/2 : o[0]-2;
    const depth=o.length>=8 ? 2 : o.length>=4 ? 1 : 0;
    const name=[...g.names.entries()].sort((a,b)=>b[1]-a[1])[0][0];
    const roster=Math.min(96, Math.round(top+depth));
    return {name, n:o.length, roster, tier:ccOrgTier(name, roster, o.length), earn:ccOrgEarn(name)};
  });
  // A newcomer only enters if the roster has not already produced it — Falcons
  // and Virtus.pro do have Fortnite players, so they are derived, not typed, and
  // must not appear twice.
  const have=new Set(CC_ORG_POOL[reg].map(o=>clubLogoFile(o.name)||o.name));
  CC_ORG_POOL[reg]=CC_ORG_POOL[reg]
    .concat(CC_ORG_NEW.filter(o=>!have.has(clubLogoFile(o.name)||o.name)))
    .sort((a,b)=>b.tier-a.tier);
  return CC_ORG_POOL[reg];
}

// What a club pays for a season. Invented, and anchored to the one salary-shaped
// number the app already holds: a Division 1 Weekly Final pays its winning duo
// $5,000. A wage should sit under what winning outright is worth, so the scale
// runs from about £1,500 at the bottom club to eight thousand at the very top.
/* A wage is a month's wage, and the division decides its ceiling.

   Set by the user, 14 August: up to $100 a month in Division 3, up to $300 in
   Division 2, and no ceiling in Division 1, where it scales with how big the
   player is rather than with which rung they are on. That last one is the point
   where the ladder stops paying and the audience starts.

   It used to be one number for the whole season, off the club's own standard —
   $1,400 a season for a Division 3 player, which is not a wage anybody in this
   scene is paid at that level. */
// С какого дивизиона клубы вообще смотрят. Одним числом, потому что об этом
// говорит и подсказка в плитке, и правило ниже: разъехаться им нельзя.
const CC_CLUBS_FROM=3;
const CC_WAGE_CAP={5:0, 4:0, 3:100, 2:300};
// Платят — значит не меньше $50 в месяц (его слово 9.10: Дивизион 3 предлагал $37 — «можно 50 я думаю»).
const CC_WAGE_FLOOR=50;
/* ovrOf names whose contract this is. Left out it is the player's own, which
   was every call this had until the roster started quoting what its own people
   are on: a card is not a career — no ovrExact, no log — so asking for somebody
   else's wage would have priced them at the player's rating and the player's
   recent form. */
/* Wage cap is looked up by the rating's band, not the current rung; the rung is only a fallback when there's no
   rating. Otherwise T1 offers a 96 walking Division 3 $100 a month. The numbers don't change: a D3 standard is still
   $100 because it's a rating of ~68. Same rule ccPlayerPay already uses for roster players. */
function ccWageDiv(ovr){
  if(!(ovr>0)) return null;
  for(let d=1; d<=5; d++) if(ovr>=ccBand(d)-2) return d;
  return 5;
}
/* What the club takes off prize money. Bigger clubs take more, from nothing up
   to a fifth of the board, so an offer is a trade: money up front vs money you win.
   The spread is the mode's own, not a real contract. Terms live on the deal, so a
   contract signed before this keeps a zero cut. See careerOrgCut. */
/* Narrowed with the wage, 20 August, and for the same reason.

   Five to twenty per cent against a wage that moved by a third meant a big club
   in Division 1 was a worse deal than a small one for anybody who actually won
   boards: more money up front, fifteen points more off every prize. His call is
   that a better club is simply better, so the cut stays a real term — a club
   takes a share, that is what a contract is — without being able to swallow
   what the club pays for you. */
const CC_ORG_CUT_MIN=0.05, CC_ORG_CUT_MAX=0.10;
function careerOrgCutFor(tier){
  const k=clamp((tier-64)/26, 0, 1);
  return Math.round((CC_ORG_CUT_MIN+k*(CC_ORG_CUT_MAX-CC_ORG_CUT_MIN))*100)/100;
}
// The cut the career is actually on: what was signed, and nothing for a contract
// that predates the term.
/* Своя организация. Деньги уходят трижды:
     основать   CC_CLUB_COST разово. Из текущего клуба уходишь, зато доли с призовых никто не берёт
     содержать  CC_CLUB_KEEP в месяц, пустой клуб чистый убыток
     зарплаты   за каждое подписанное дуо, по их рейтингу
   Приходит доля CC_CLUB_CUT с призовых состава (по доске призовых) и спонсор CC_CLUB_SPONSOR за каждое дуо. Не хватило на зарплату: состав уходит, пишем в ленту. */
const CC_CLUB_COST=1000000;    // основать — его цена, 11.09: «создать миллион долларов нужно». Цель на несколько сезонов: лучшие карьеры берут за год 300-500 тысяч
const CC_CLUB_KEEP=2500;       // содержание в месяц
const CC_CLUB_SEATS=3;         // сколько дуо держит клуб
const CC_CLUB_CUT=0.2;         // доля клуба с призовых состава
const CC_CLUB_SPONSOR=1000;    // спонсор за дуо в месяц
function careerClub(){ const cr=CAREER && CAREER.career; return (cr && cr.club) || null; }
/* ===== УСТРОЙСТВО СВОЕЙ ОРГАНИЗАЦИИ: деньги, направление, штат, отделы ===============
   Его просьба 29.09: «улучшить вариативность в создании орги, управление, нанять менеджеров,
   SMM и т. д., как в реальной организации».

   ДЕНЬГИ ПРИ ОСНОВАНИИ. Свои — миллион, клуб целиком твой. С инвестором — вносишь
   CC_CLUB_FUND.investor.pay, остальное даёт он и забирает долю share со всего дохода клуба
   (спонсоры и доля с призовых), пока долю не выкупишь.
   НАПРАВЛЕНИЕ. Киберспорт — классика (20% с призовых). Контент — спонсоры и охват выше, доля
   с призовых ниже. Академия — своя академия с первого дня и больше мест в ней, спонсор ниже.
   ШТАТ — реальные люди сцены из тех же списков, что личный найм: менеджеры (CC_AGENTS),
   SMM (CC_SMM), тренеры (CC_COACHES). Уровень 1–3 — от их веса: подписчики или цена тренера.
   ОТДЕЛЫ — постройка разово и содержание в месяц, по уровням.
   Все числа здесь — оценка режима: открытых зарплат штата киберспортивных клубов нет. */
const CC_CLUB_FUND={
  self:    {pay:CC_CLUB_COST, share:0},
  investor:{pay:350000, share:0.3, buyback:900000}
};
const CC_CLUB_FOCUS={
  comp:   {cut:0.20, sponsor:1.0, reach:1.0},
  content:{cut:0.10, sponsor:1.6, reach:1.6},
  academy:{cut:0.15, sponsor:0.8, reach:1.0, acadFree:true, acadSeats:5}
};
function ccClubFocus(club){ return CC_CLUB_FOCUS[(club && club.focus)||'comp'] || CC_CLUB_FOCUS.comp; }
function ccClubCut(club){ return ccClubFocus(club).cut; }
function ccClubShare(club){ return (club && club.investor && !club.investor.bought) ? (club.investor.share||0) : 0; }
function ccClubAcadMax(club){ return ccClubFocus(club).acadSeats || CC_CLUB_ACAD_SEATS; }
// Штат.
const CC_CLUB_ROLES=['manager', 'smm', 'coach'];
function ccStaffPool(role){
  if(role==='manager') return (typeof CC_AGENTS!=='undefined' ? CC_AGENTS : []).map(a=>({id:a.at, name:a.name, at:a.at, photo:a.photo, x:a.x||0}));
  if(role==='smm')     return (typeof CC_SMM!=='undefined' ? CC_SMM : []).map(a=>({id:a.at, name:a.name, at:a.at, photo:a.photo, x:a.x||0}));
  return (typeof CC_COACHES!=='undefined' ? CC_COACHES : []).map(c=>({id:c.id, name:c.name, at:c.at, photo:c.photo, cost:c.cost}));
}
function ccStaffTier(p){
  if(!p) return 0;
  if(p.cost) return p.cost>=3500 ? 3 : p.cost>=3000 ? 2 : 1;
  const x=p.x||0; return x>=5000 ? 3 : x>=1500 ? 2 : 1;
}
function ccStaffPay(p){
  if(!p) return 0;
  if(p.cost) return p.cost;
  return Math.round((700+Math.min(3300, (p.x||0)*0.2))/50)*50;
}
function ccClubStaff(role){ const c=careerClub(); return (c && c.staff && c.staff[role]) || null; }
function ccStaffT(role){ const s=ccClubStaff(role); return s ? (s.t||1) : 0; }
function careerClubHire(role, id){
  const club=careerClub(); if(!club || CC_CLUB_ROLES.indexOf(role)<0) return false;
  const p=ccStaffPool(role).find(x=>x.id===id); if(!p) return false;
  club.staff=club.staff||{};
  club.staff[role]={id:p.id, name:p.name, at:p.at||null, photo:p.photo||null, t:ccStaffTier(p), pay:ccStaffPay(p), since:careerToday()};
  careerNews('good', 'ccNewsClubStaff', [club.name, p.name, L()['ccStaff_'+role]], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
function careerClubFire(role){
  const club=careerClub(); if(!club || !club.staff || !club.staff[role]) return false;
  delete club.staff[role];
  careerSave();
  return true;
}
// Отделы.
const CC_CLUB_DEPTS={
  sponsor:{build:[60000, 150000, 300000], keep:[800, 1600, 2800]},   // +$500 спонсора за состав на уровень
  scout:  {build:[40000, 100000, 200000], keep:[500, 1000, 1800]},   // академия: талант ближе к тебе, список шире
  house:  {build:[250000], keep:[3500]}                              // геймхаус: буткемп у всех составов
};
function ccDeptLv(k){ const c=careerClub(); return (c && c.dept && c.dept[k]) || 0; }
function ccDeptNextCost(k){ const d=CC_CLUB_DEPTS[k], lv=ccDeptLv(k); return (d && lv<d.build.length) ? d.build[lv] : 0; }
function ccClubDeptKeep(club){
  let s=0; const dp=(club && club.dept)||{};
  Object.keys(CC_CLUB_DEPTS).forEach(k=>{ const lv=dp[k]||0; if(lv) s+=CC_CLUB_DEPTS[k].keep[lv-1]; });
  return s;
}
function careerClubDeptUp(k){
  const club=careerClub(), cr=CAREER && CAREER.career; if(!club || !cr || !CC_CLUB_DEPTS[k]) return false;
  const cost=ccDeptNextCost(k); if(!cost) return false;
  // Платит касса клуба, недостающее — твой баланс.
  const fromClub=Math.min(cost, Math.max(0, club.cash||0)), rest=cost-fromClub;
  if((cr.balance||0)<rest) return false;
  club.cash=(club.cash||0)-fromClub; cr.balance=(cr.balance||0)-rest;
  club.dept=club.dept||{}; club.dept[k]=(club.dept[k]||0)+1;
  careerSave();
  return true;
}
function careerClubBuyback(){
  const club=careerClub(), cr=CAREER && CAREER.career; if(!club || !cr || !ccClubShare(club)) return false;
  const cost=CC_CLUB_FUND.investor.buyback;
  const fromClub=Math.min(cost, Math.max(0, club.cash||0)), rest=cost-fromClub;
  if((cr.balance||0)<rest) return false;
  club.cash=(club.cash||0)-fromClub; cr.balance=(cr.balance||0)-rest;
  club.investor.bought=careerToday();
  careerNews('good', 'ccNewsClubBuyback', [club.name], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
// Спонсор за один наёмный состав в месяц — база, отдел, направление, SMM.
function ccClubSponsorPer(club){
  return Math.round((CC_CLUB_SPONSOR+500*ccDeptLv('sponsor'))*ccClubFocus(club).sponsor*(1+0.15*ccStaffT('smm')));
}
function ccClubStaffPay(club){ return CC_CLUB_ROLES.reduce((s, r)=>s+(((club && club.staff && club.staff[r])||{}).pay||0), 0); }
/* Плитка клуба — на вкладке магазина, там же, где тратятся деньги. Пока клуба нет:
   строка с ценой и поле для названия. Есть: касса, состав с зарплатами и что каждое
   дуо принесло, и список свободных пар. */
/* ГЕРБ СВОЕГО КЛУБА — отзыв: «можно сделать лого орги название».

   Две дороги, обе без файлов на сервере. Первая — собрать: четыре формы, восемь
   цветов и до трёх букв; рисуется SVG, весит десяток байт в сейве и одинаково
   выглядит везде, где рисуются гербы настоящих клубов. Вторая — своя картинка:
   она ужимается до 64 точек ещё в браузере и ложится в сейв строкой, поэтому
   сейв не пухнет (CC_CLUB_LOGO_MAX — потолок, сторож сейва его и держит).

   Подставляется в careerCrestImg: свой клуб рисуется своим гербом ВЕЗДЕ —
   в шапке, в таблицах, в ленте и в переписке, — потому что все они зовут её. */
const CC_CLUB_SHAPES=['shield','circle','hex','rhomb'];
const CC_CLUB_HUES=[210, 150, 95, 45, 20, 340, 275, 0];
const CC_CLUB_LOGO_MAX=24000;   // столько знаков картинки терпит сейв
function ccClubTag(club){
  const c=club||careerClub(); if(!c) return '';
  if(c.crest && c.crest.tag) return String(c.crest.tag).slice(0, 3).toUpperCase();
  const w=String(c.name||'').split(/[\s.\-]+/).filter(x=>/[A-Za-z0-9]/.test(x));
  return ((w.length>1 ? w[0].charAt(0)+w[1].charAt(0) : String(c.name||'').slice(0,2))).toUpperCase();
}
function ccClubHue(club){
  const c=club||careerClub(); if(!c) return 210;
  if(c.crest && c.crest.hue!=null) return c.crest.hue;
  return CC_CLUB_HUES[hashStr(String(c.name||''))%CC_CLUB_HUES.length];
}
function ccClubShape(club){
  const c=club||careerClub();
  return (c && c.crest && c.crest.shape) || 'shield';
}
// Контур формы в квадрате 48×48 — один путь на форму.
function ccClubPath(shape){
  if(shape==='circle') return 'M24 2a22 22 0 1 0 .1 0z';
  if(shape==='hex')    return 'M24 2 43 13v22L24 46 5 35V13z';
  if(shape==='rhomb')  return 'M24 2 46 24 24 46 2 24z';
  return 'M24 2 44 8v18c0 11-9 18-20 20C13 44 4 37 4 26V8z';   // щит
}
function careerClubCrest(px, cls, club){
  const c=club||careerClub(); if(!c) return '';
  if(c.logo) return '<img class="'+(cls||'')+'" src="'+c.logo+'" alt="" style="height:'+px+'px;width:'+px+
    'px;object-fit:contain;border-radius:6px;">';
  const hue=ccClubHue(c), tag=esc(ccClubTag(c));
  const fs2=Math.round(px*(tag.length>2 ? 0.34 : 0.42));
  return '<svg class="'+(cls||'')+'" viewBox="0 0 48 48" width="'+px+'" height="'+px+'" aria-hidden="true" '+
    'style="vertical-align:middle;flex:none;">'+
    '<path d="'+ccClubPath(ccClubShape(c))+'" fill="hsl('+hue+' 45% 24%)" stroke="hsl('+hue+' 55% 55%)" stroke-width="2.5"/>'+
    '<text x="24" y="24" text-anchor="middle" dominant-baseline="central" '+
      'style="font:800 '+Math.round(48*(tag.length>2?0.34:0.42))+'px Oswald,system-ui,sans-serif;fill:hsl('+hue+' 70% 84%);letter-spacing:.5px;">'+tag+'</text>'+
    '</svg>';
}
function careerClubCrestSet(what, val){
  const club=careerClub(); if(!club) return false;
  club.crest=club.crest||{};
  if(what==='tag') club.crest.tag=String(val||'').replace(/[^A-Za-z0-9]/g,'').slice(0, 3).toUpperCase();
  else if(what==='hue') club.crest.hue=Number(val)||0;
  else if(what==='shape' && CC_CLUB_SHAPES.indexOf(val)>=0) club.crest.shape=val;
  else return false;
  careerSave();
  return true;
}
/* Своя картинка: ужимается до 64 точек прямо здесь, в сейв уходит строкой.
   Не влезла в потолок — не берём вовсе, сейв важнее картинки. */
/* Готовая картинка — в сейв, если влезла в потолок. Отдельно от загрузки, потому что
   загрузка это браузерная механика (FileReader и декодирование), а потолок — наше правило,
   и проверять его надо без картинки на диске. */
function careerClubLogoSet(url){
  const club=careerClub();
  if(!club || String(url||'').slice(0, 11)!=='data:image/') return false;
  if(String(url).length>CC_CLUB_LOGO_MAX) return false;
  club.logo=String(url); careerSave();
  return true;
}
/* Картинка ужимается до 64 точек в квадрате, с полями, чтобы не тянуть пропорции.
   Отдельной функцией — её зовёт и кнопка выбора файла, и сторож. */
function careerClubLogoFrom(src, done){
  const club=careerClub(); if(!club || !src){ if(done) done(false); return; }
  const img=new Image();
  img.onload=function(){
    let ok=false;
    try{
      const cv=document.createElement('canvas'); cv.width=cv.height=64;
      const x=cv.getContext('2d');
      const k=Math.min(64/(img.width||1), 64/(img.height||1));
      const w=Math.max(1, Math.round(img.width*k)), h=Math.max(1, Math.round(img.height*k));
      x.drawImage(img, Math.round((64-w)/2), Math.round((64-h)/2), w, h);
      ok=careerClubLogoSet(cv.toDataURL('image/png'));
    }catch(e){}
    if(ok && typeof careerRenderHub==='function' && document.getElementById('chBody')) careerRenderHub('shop');
    if(done) done(ok);
  };
  img.onerror=function(){ if(done) done(false); };
  img.src=String(src);
}
function careerClubLogoPick(input){
  if(!careerClub() || !input || !input.files || !input.files[0]) return;
  const rd=new FileReader();
  rd.onload=function(){ careerClubLogoFrom(String(rd.result||'')); };
  rd.readAsDataURL(input.files[0]);
}
function careerClubLogoClear(){ const c=careerClub(); if(!c) return; delete c.logo; careerSave(); careerRenderHub('shop'); }
/* СТЕНА ГЕРБОВ НА ПРЕВЬЮ. Отзыв: «добавь на превью множество лого организаций».
   Плитка до основания объясняла клуб словами и ценой, и ни одного клуба на ней не было.
   Берём те орги, что игрок и так видит в таблицах своего региона — это его сцена, а не
   случайный набор, — и ставим их в ряд приглушёнными: место, куда встанет твой герб. */
function ccClubWall(){
  let names=[];
  try{ names=[...new Set((ccSceneRoster(ccCareerRegion())||[]).map(c=>c && c.org).filter(Boolean))]; }
  catch(e){ names=[]; }
  const imgs=names.slice(0, 20).map(n=>careerCrestImg(n, 24, 'cc-club-wall-i')).filter(Boolean);
  if(imgs.length<4) return '';
  return '<div class="cc-club-wall">'+imgs.join('')+'</div>';
}
function careerClubHTML(){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const T=L(), club=careerClub();
  /* ЭКРАН СВОЕЙ ОРГАНИЗАЦИИ — плитками хаба (его скрин 41, 29.09: «сделай дизайн в нашем
     стиле, то чет странно выглядит»): вместо длинных строк на всю ширину — карточки. */
  const pips=(n, of)=>'<i class="og-pips">'+Array.from({length:of}, (_, i)=>'<b class="'+(i<n?'on':'')+'"></b>').join('')+'</i>';
  const money=v=>'$'+ccNum(Math.round(v||0));
  if(!club){
    const buyout=careerClubBuyout(), left=(CAREER.org && !CAREER.org.own) ? CAREER.org.name : null;
    const P=CC_CLUB_PICK, price=CC_CLUB_FUND[P.fund].pay+buyout;
    const can=(cr.balance||0)>=price;
    const choice=(k, v, title, sub, extra)=>'<button class="og-choice'+(P[k]===v?' on':'')+'" onclick="careerClubPick(\''+k+'\',\''+v+'\')">'+
      '<b>'+esc(title)+'</b>'+(extra ? '<i>'+extra+'</i>' : '')+'<em>'+esc(sub)+'</em></button>';
    return '<div class="ch-tile cc-club cc-club-pre og og-pre"><h4>'+esc(T.ccClubTitle)+'</h4>'+
      ccClubWall()+
      '<div class="ch-hint">'+esc(T.ccClubHint)+'</div>'+
      '<h5 class="og-sec">'+esc(T.ogFundH)+'</h5>'+
      '<div class="og-choices">'+
        choice('fund', 'self', T.ogFundSelf, T.ogFundSelfSub, money(CC_CLUB_FUND.self.pay))+
        choice('fund', 'investor', T.ogFundInv, T.ogFundInvSub(Math.round(CC_CLUB_FUND.investor.share*100), ccNum(CC_CLUB_FUND.investor.buyback)), money(CC_CLUB_FUND.investor.pay))+
      '</div>'+
      '<h5 class="og-sec">'+esc(T.ogFocusH)+'</h5>'+
      '<div class="og-choices og-choices-3">'+
        choice('focus', 'comp', T.ogFocusComp, T.ogFocusCompSub)+
        choice('focus', 'content', T.ogFocusContent, T.ogFocusContentSub)+
        choice('focus', 'academy', T.ogFocusAcad, T.ogFocusAcadSub)+
      '</div>'+
      '<div class="og-kv"><span>'+esc(T.ccClubKeep)+'</span><b>'+money(CC_CLUB_KEEP)+' '+esc(T.ccClubMonth)+'</b></div>'+
      (left ? '<div class="og-kv"><span>'+esc(T.ccClubQuit(left))+'</span><b>'+money(buyout)+'</b></div>' : '')+
      '<div class="og-found">'+
        '<input id="ccClubName" maxlength="24" placeholder="'+esc(T.ccClubNamePh)+'">'+
        '<button class="og-btn og-btn-go"'+(can?'':' disabled')+' onclick="careerClubNew()">'+esc(T.ogFound)+' · '+money(price)+'</button>'+
      '</div>'+
      (can ? '' : '<div class="ch-hint">'+esc(T.ccClubNoCash)+'</div>')+'</div>';
  }
  const roster=club.roster||[];
  const focus=club.focus||'comp', share=ccClubShare(club);
  // ---- финансы месяца
  const hired=roster.filter(r=>!r.mine).length;
  const sponsor=ccClubSponsorPer(club)*hired, inv=Math.round(sponsor*share);
  const wages=roster.reduce((a,r)=>a+(r.salary||0)+careerClubPerkCost(r), 0);
  const staffPay=ccClubStaffPay(club);
  const keep=CC_CLUB_KEEP+(club.acad ? CC_CLUB_ACAD_KEEP : 0)+ccClubDeptKeep(club);
  const net=sponsor-inv-wages-staffPay-keep;
  const stat=(label, v, cls)=>'<div class="og-stat'+(cls?' '+cls:'')+'"><em>'+esc(label)+'</em><b>'+v+'</b></div>';
  const head='<div class="og-head">'+careerClubCrest(56, 'cc-club-big')+
    '<div class="og-head-t"><b>'+esc(club.name)+'</b>'+
      '<span><i class="og-pill">'+esc(T['ogFocus'+({comp:'Comp', content:'Content', academy:'Acad'})[focus]])+'</i>'+
      (share ? '<i class="og-pill og-pill-inv">'+esc(T.ogInvPill(Math.round(share*100)))+'</i>' : '')+'</span></div>'+
    '<div class="og-cash"><em>'+esc(T.ccClubCash)+'</em><b class="'+((club.cash||0)<0?'neg':'')+'">'+money(club.cash)+'</b>'+
      ((club.cash||0)>0 ? '<button class="og-btn og-btn-sm" onclick="careerClubTake2()">'+esc(T.ccClubOut2)+'</button>' : '')+'</div></div>';
  const fin='<div class="og-stats">'+
    stat(T.ogSponsors, '+'+money(sponsor-inv), 'up')+
    stat(T.ogWages, '−'+money(wages))+
    stat(T.ogStaffPay, '−'+money(staffPay))+
    stat(T.ogUpkeep, '−'+money(keep))+
    stat(T.ogNet, (net>=0?'+':'−')+money(Math.abs(net)), net>=0?'up':'down')+
    stat(T.ogCutRow, Math.round(ccClubCut(club)*100)+'%')+
  '</div>'+
  (share ? '<div class="og-inv"><span>'+esc(T.ogInvLine(Math.round(share*100), ccNum(Math.round(club.inv||0))))+'</span>'+
    '<button class="og-btn og-btn-sm" onclick="careerClubBuybackBtn()">'+esc(T.ogBuyback)+' · '+money(CC_CLUB_FUND.investor.buyback)+'</button></div>' : '');
  // ---- бренд (герб) — свёрнут
  const brand='<details class="og-brand"><summary>'+esc(T.ogBrand)+'</summary><div class="cc-club-crest-box">'+careerClubCrest(64, 'cc-club-big')+
    '<div class="cc-club-pick">'+
      '<div class="cc-club-shapes">'+CC_CLUB_SHAPES.map(sh=>
        '<button class="cc-club-sh'+(ccClubShape(club)===sh?' on':'')+'" onclick="careerClubSet(\'shape\',\''+sh+'\')">'+
        '<svg viewBox="0 0 48 48" width="16" height="16"><path d="'+ccClubPath(sh)+'" fill="currentColor"/></svg></button>').join('')+'</div>'+
      '<div class="cc-club-hues">'+CC_CLUB_HUES.map(h=>
        '<button class="cc-club-hue'+(ccClubHue(club)===h?' on':'')+'" style="background:hsl('+h+' 55% 45%)" onclick="careerClubSet(\'hue\','+h+')"></button>').join('')+'</div>'+
      '<div class="cc-club-tagrow">'+
        '<input id="ccClubTag" maxlength="3" value="'+esc(ccClubTag(club))+'" oninput="careerClubSet(\'tag\', this.value)">'+
        '<label class="og-btn og-btn-sm cc-club-file">'+esc(T.ccClubLogo)+'<input type="file" accept="image/*" hidden onchange="careerClubLogoPick(this)"></label>'+
        (club.logo ? '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubLogoClear()">'+esc(T.ccClubLogoOff)+'</button>' : '')+
      '</div></div></div></details>';
  // ---- штат
  const face=p=>p && p.photo ? '<img class="og-face" src="'+PHOTO_DIR+esc(p.photo)+'" alt="" loading="lazy" onerror="this.remove()">' : '<span class="og-face og-face-none"></span>';
  const staffCard=role=>{
    const s=ccClubStaff(role), open=CC_CLUB_STAFF_OPEN===role;
    const eff=T['ogEff_'+role](s ? s.t : 0);
    let body;
    if(s){
      body='<div class="og-person">'+face(s)+'<div><b>'+esc(s.name)+'</b>'+(s.at ? '<em>@'+esc(s.at)+'</em>' : '')+pips(s.t, 3)+'</div></div>'+
        '<div class="og-kv"><span>'+esc(T.ogPay)+'</span><b>'+money(s.pay)+' '+esc(T.ccClubMonth)+'</b></div>'+
        '<div class="og-eff">'+esc(eff)+'</div>'+
        '<div class="og-acts"><button class="og-btn og-btn-sm" onclick="careerClubStaffOpen(\''+role+'\')">'+esc(T.ogReplace)+'</button>'+
        '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubFireBtn(\''+role+'\')">'+esc(T.ogFire)+'</button></div>';
    } else {
      body='<div class="og-eff og-eff-off">'+esc(T['ogWhy_'+role])+'</div>'+
        '<div class="og-acts"><button class="og-btn og-btn-go og-btn-sm" onclick="careerClubStaffOpen(\''+role+'\')">'+esc(T.ogHire)+'</button></div>';
    }
    const list=open ? '<div class="og-cands">'+ccStaffPool(role)
      .filter(p=>!s || p.id!==s.id)
      .sort((a,b)=>ccStaffTier(b)-ccStaffTier(a) || ccStaffPay(a)-ccStaffPay(b))
      .map(p=>'<div class="og-cand">'+face(p)+'<div class="og-cand-t"><b>'+esc(p.name)+'</b>'+pips(ccStaffTier(p), 3)+
        '<em>'+money(ccStaffPay(p))+' '+esc(T.ccClubMonth)+'</em></div>'+
        '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubHireBtn(\''+role+'\',\''+esc(p.id)+'\')">'+esc(T.ogHire)+'</button></div>').join('')+'</div>' : '';
    return '<div class="og-card'+(s?' on':'')+'"><h6>'+esc(T['ccStaff_'+role])+'</h6>'+body+list+'</div>';
  };
  const staff='<h5 class="og-sec">'+esc(T.ogStaffH)+'</h5><div class="og-grid">'+CC_CLUB_ROLES.map(staffCard).join('')+'</div>';
  // ---- отделы
  const deptCard=k=>{
    const d=CC_CLUB_DEPTS[k], lv=ccDeptLv(k), max=d.build.length, cost=ccDeptNextCost(k);
    const can=cost && ((club.cash||0)+(cr.balance||0))>=cost;
    return '<div class="og-card'+(lv?' on':'')+'"><h6>'+esc(T['ogDept_'+k])+'</h6>'+pips(lv, max)+
      '<div class="og-eff'+(lv?'':' og-eff-off')+'">'+esc(T['ogDeptEff_'+k](lv))+'</div>'+
      (lv ? '<div class="og-kv"><span>'+esc(T.ogUpkeep)+'</span><b>'+money(d.keep[lv-1])+' '+esc(T.ccClubMonth)+'</b></div>' : '')+
      '<div class="og-acts">'+(cost
        ? '<button class="og-btn og-btn-sm og-btn-go"'+(can?'':' disabled')+' onclick="careerClubDeptBtn(\''+k+'\')">'+esc(lv?T.ogUpgrade:T.ogBuild)+' · '+money(cost)+'</button>'
        : '<i class="og-max">'+esc(T.ogMax)+'</i>')+'</div></div>';
  };
  const depts='<h5 class="og-sec">'+esc(T.ogDeptH)+'</h5><div class="og-grid">'+Object.keys(CC_CLUB_DEPTS).map(deptCard).join('')+'</div>';
  // ---- составы
  const perk=r=>[(r.camp||ccClubCampAll())?T.ccClubCamp:'', (r.coach||ccClubCoachAll())?T.ccClubCoach:''].filter(Boolean);
  const tag=(t, cls)=>'<i class="og-tag'+(cls?' '+cls:'')+'">'+esc(t)+'</i>';
  const rosterCard=r=>'<div class="og-card og-duo">'+
      '<div class="og-duo-top"><b>'+esc((r.who||[]).join(' & '))+'</b><i class="og-ovr">'+r.ovr+'</i></div>'+
      '<div class="og-tags">'+(r.mine?tag(T.ccClubMine, 'mine'):'')+(r.acad?tag(T.ccClubYoung):'')+perk(r).map(p=>tag(p, 'perk')).join('')+
        (r.offer?tag(T.ccClubPoach(r.offer.org), 'buy'):'')+'</div>'+
      '<div class="og-kv"><span>'+esc(T.ogPay)+'</span><b>'+money((r.salary||0)+careerClubPerkCost(r))+' '+esc(T.ccClubMonth)+'</b></div>'+
      (r.won ? '<div class="og-kv"><span>'+esc(T.ccClubWon)+'</span><b>'+money(r.won)+'</b></div>' : '')+
      '<div class="og-acts">'+(r.offer
        ? '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubLet(\''+esc(r.id)+'\')">'+esc(T.ccClubLet)+' '+money(r.offer.sum)+'</button>'+
          '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubNo(\''+esc(r.id)+'\')">'+esc(T.ccClubStay)+'</button>'
        : (r.acad && careerClubSeats()<CC_CLUB_SEATS ? '<button class="og-btn og-btn-sm" onclick="careerClubUp(\''+esc(r.id)+'\')">'+esc(T.ccClubUp)+'</button>' : '')+
          '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubOut(\''+esc(r.id)+'\')">'+esc(T.ccClubDrop)+'</button>')+'</div></div>';
  // ---- рынок: те же разговоры и галочки, что были (id полей сохранены)
  const talks=careerClubTalks();
  const say=t=>!t ? '' : t.state==='yes' ? '' :
    t.state==='ask' ? tag(T.ccClubSayAsk(ccNum(t.ask))) :
    t.state==='no'  ? tag(T.ccClubSayNo, 'no') : tag(T.ccClubSayWait, 'no');
  const deal=d=>{
    const t=talks[d.id], base=(t && t.ask) ? t.ask : d.salary;
    const perks=CC_CLUB_PERKS[d.id]||{};
    const ck=(k, on, all)=>all ? '' : '<label class="og-toggle'+(on?' on':'')+'"><input type="checkbox" id="ccClub'+k+'_'+esc(d.id)+'"'+(on?' checked':'')+
      ' onchange="careerClubPerk(\''+esc(d.id)+'\')">'+esc(k==='Camp'?T.ccClubCamp:T.ccClubCoach)+'</label>';
    const ask=careerClubAsking(base, perks);
    return '<div class="og-card og-duo">'+
      '<div class="og-duo-top"><b>'+esc(d.who.join(' & '))+'</b><i class="og-ovr">'+d.ovr+'</i></div>'+
      '<div class="og-tags">'+(d.mine?tag(T.ccClubMine, 'mine'):'')+(d.org?tag(T.ccClubBuyout(d.org)+' '+money(d.buyout), 'buy'):'')+say(t)+'</div>'+
      '<div class="og-toggles">'+ck('Camp', !!perks.camp, ccClubCampAll())+ck('Coach', !!perks.coach, ccClubCoachAll())+'</div>'+
      '<div class="og-offer"><span>'+money(ask)+' '+esc(T.ccClubMonth)+'</span>'+
        '<input class="cc-club-sum" id="ccClubSum_'+esc(d.id)+'" value="'+ask+'" inputmode="numeric">'+
        '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubAsk(\''+esc(d.id)+'\')">'+esc(T.ccClubTalk)+'</button></div></div>';
  };
  const mate=careerClubMateFree();
  const free=(careerClubSeats()<CC_CLUB_SEATS ? careerClubFree(CC_CLUB_Q) : []).map(deal).join('');
  const acadMax=ccClubAcadMax(club);
  return '<div class="ch-tile cc-club og">'+head+fin+brand+staff+depts+
    '<h5 class="og-sec">'+esc(T.ogRosterH)+' <i>'+careerClubSeats()+'/'+CC_CLUB_SEATS+'</i></h5>'+
    (roster.length ? '<div class="og-grid">'+roster.map(rosterCard).join('')+'</div>' : '<div class="ch-empty">'+esc(T.ccClubEmpty)+'</div>')+
    (mate ? '<div class="ch-hint">'+esc(T.ccClubMateHint)+'</div><div class="og-grid">'+deal(mate)+'</div>' : '')+
    (careerClubSeats()<CC_CLUB_SEATS
      ? '<h5 class="og-sec">'+esc(T.ogMarketH)+'</h5>'+
        '<div class="og-search"><input id="ccClubQ" value="'+esc(CC_CLUB_Q)+'" placeholder="'+esc(T.ccClubFind)+'" oninput="careerClubSearch(this.value)"></div>'+
        '<div class="og-grid">'+free+'</div>'
      : '')+
    '<h5 class="og-sec">'+esc(T.ccClubAcad)+(club.acad ? ' <i>'+careerClubAcadSeats()+'/'+acadMax+'</i>' : '')+'</h5>'+
    (club.acad
      ? (careerClubAcadSeats()<acadMax ? '<div class="og-grid">'+careerClubYoung(CC_CLUB_Q).map(deal).join('')+'</div>' : '')
      : '<div class="og-card og-wide"><div class="og-eff">'+esc(T.ccClubAcadHint)+'</div><div class="og-acts">'+
          '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubAcad()">'+esc(T.ccClubAcadBuild)+' · '+money(CC_CLUB_ACAD)+'</button></div></div>')+
    '<div class="og-close"><div class="ch-hint">'+esc(T.ccClubCloseHint)+'</div>'+
    '<button class="ch-decline" onclick="careerClubCloseAsk()">'+esc(T.ccClubClose)+'</button></div>'+
    '</div>';
}
/* ЗАКРЫТЬ СВОЙ КЛУБ. До 13 сентября дороги назад не было вовсе: основал — и чужие
   клубы молчат навсегда (careerOrgOffers). Состав отпускается, касса возвращается,
   миллион — нет; CAREER.org снимается, и скаутинг снова открыт. Вопрос — на клике,
   действие — отдельно, чтобы харнессы не упирались в модалку. */
function careerClubCloseAsk(){
  const club=careerClub(); if(!club) return;
  ccAsk(L().ccClubCloseAsk(club.name), careerClubClose, {yes:L().ccClubClose, no:L().ccAskNo});
}
function careerClubClose(){
  const cr=CAREER && CAREER.career, club=careerClub(); if(!cr || !club) return false;
  const people=(club.roster||[]).reduce((n,r)=>n+((r.who||[]).length||1), 0);
  if((club.cash||0)>0){ cr.balance=(cr.balance||0)+Math.round(club.cash); }
  careerNews('flat', 'ccNewsClubClosed', [club.name, people], {by:ccOrgBy(club.name)});
  delete cr.club;
  if(CAREER.org && CAREER.org.own) CAREER.org=null;
  CAREER.offers=null; CAREER.scoutOff=false;
  careerSave();
  if(typeof careerRenderHub==='function') careerRenderHub('shop');
  return true;
}
let CC_CLUB_PICK={fund:'self', focus:'comp'};
function careerClubPick(k, v){ CC_CLUB_PICK[k]=v; const el=document.getElementById('ccClubName'); const nm=el ? el.value : ''; careerRenderHub('shop'); const e2=document.getElementById('ccClubName'); if(e2) e2.value=nm; }
function careerClubNew(){
  const el=document.getElementById('ccClubName');
  if(careerClubFound(el && el.value, CC_CLUB_PICK.fund, CC_CLUB_PICK.focus)) careerRenderHub('shop');
}
function careerClubHireBtn(role, id){ if(careerClubHire(role, id)) careerRenderHub('shop'); }
function careerClubFireBtn(role){ if(careerClubFire(role)) careerRenderHub('shop'); }
function careerClubDeptBtn(k){ if(careerClubDeptUp(k)) careerRenderHub('shop'); }
function careerClubBuybackBtn(){ if(careerClubBuyback()) careerRenderHub('shop'); }
let CC_CLUB_STAFF_OPEN=null;
function careerClubStaffOpen(role){ CC_CLUB_STAFF_OPEN=(CC_CLUB_STAFF_OPEN===role) ? null : role; careerRenderHub('shop'); }
function careerClubSet(what, val){ if(careerClubCrestSet(what, val)) careerRenderHub('shop'); }
let CC_CLUB_Q='';
function careerClubSearch(q){
  CC_CLUB_Q=String(q||'');
  const box=document.querySelector('.cc-club');
  careerRenderHub('shop');
  const el=document.getElementById('ccClubQ'); if(el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
}
function careerClubTake2(){ const got=careerClubCashOut((careerClub()||{}).cash); if(got) careerRenderHub('shop'); }
/* Галочки живут до конца разговора, не в сейве: это черновик предложения.
   Подписали — условия переехали в строку состава и дальше живут там. */
let CC_CLUB_PERKS={};
function careerClubPerk(id){
  const camp=document.getElementById('ccClubCamp_'+id), coach=document.getElementById('ccClubCoach_'+id);
  CC_CLUB_PERKS[id]={camp:!!(camp && camp.checked), coach:!!(coach && coach.checked)};
  careerRenderHub('shop');
}
function careerClubAsk(id){
  const el=document.getElementById('ccClubSum_'+id);
  careerClubOffer(id, el ? el.value : 0, CC_CLUB_PERKS[id]);
  careerRenderHub('shop');
}
function careerClubOut(id){ if(careerClubDrop(id)) careerRenderHub('shop'); }
function careerClubLet(id){ if(careerClubRelease(id)) careerRenderHub('shop'); }
function careerClubNo(id){ if(careerClubRefuse(id)) careerRenderHub('shop'); }
function careerClubUp(id){ if(careerClubPromote(id)) careerRenderHub('shop'); }
function careerClubAcad(){ if(careerClubAcadBuild()) careerRenderHub('shop'); }
// Зарплата дуо в месяц — от их среднего рейтинга. Пара 90-х стоит как турнирный вечер.
function careerClubSalary(avg){ return Math.max(200, Math.round(Math.max(0, avg-70)*24)*10); }
function careerClubKey(d){ return (d.cards||[]).map(c=>hKey(c)).sort().join('+'); }
/* ГЕРБ НА ПОДПИСАННЫХ. Клуб заводят ради того, чтобы твой значок стоял рядом с их никами.
   Сцена карьеры — свои копии карточек (ccSceneRoster строит {...p} и кэширует), поэтому
   клуб проставляется на них, а не на общих: мир соседа по гонке от этого не двигается,
   а движок орг не читает вовсе. Кэш пересобирается каждый вечер — метка ставится заново. */
function ccClubOf(handle){
  const club=careerClub(); if(!club || !handle) return null;
  const k=hKey(handle);
  return (club.roster||[]).some(r=>(r.who||[]).some(h=>hKey(h)===k)) ? club.name : null;
}
function ccClubStamp(cards){
  const club=careerClub(); if(!club || !(club.roster||[]).length) return cards;
  (cards||[]).forEach(c=>{ const nm=c && ccClubOf(c.handle); if(nm) c.org=nm; });
  return cards;
}
/* Кого можно подписать: записанные пары сцены без клуба, не сильнее тебя самого —
   чемпион мира к новичку не пойдёт, — и не свои. Шесть верхних, как в поиске напарника. */
/* ПЕРЕГОВОРЫ. Отзыв: «потом можно писать игрокам, кому хочешь предлагать
   условия». Значит не кнопка с ценником, а разговор: кого искать — твоё дело, сколько
   предложить — тоже. Дуо держит в голове свою цену (careerClubSalary от рейтинга) и
   отвечает по ней: дал столько или больше — идут; дал чуть меньше — торгуются и называют
   своё число; дал мало — отказ, и следующий разговор с ними только завтра. */
const CC_CLUB_HAGGLE=0.75;     // ниже этой доли от цены даже не торгуются
const CC_CLUB_BUYIN=3;         // окладов отступных чужому клубу
/* УСЛОВИЯ В КОНТРАКТЕ. Отзыв: «буткемп тренера и тд можно обговаривать».
   Значит разговор не только про сумму: дом на сборы и тренер — это то, ради чего
   соглашаются на меньшие деньги. Клуб платит за них каждый месяц, а дуо за них
   держится — на этом и стоит верность (careerClubLoyal). */
const CC_CLUB_CAMP=1200;       // буткемп, в месяц
const CC_CLUB_COACH=900;       // тренер, в месяц
const CC_CLUB_CAMP_OFF=0.12;   // насколько дешевле просят за буткемп
const CC_CLUB_COACH_OFF=0.10;  // и за тренера
// Геймхаус даёт буткемп всем, главный тренер клуба — тренера всем: отдельно за них не платят.
function ccClubCampAll(){ return ccDeptLv('house')>0; }
function ccClubCoachAll(){ return !!ccClubStaff('coach'); }
function careerClubPerkCost(r){ return (r&&r.camp&&!ccClubCampAll()?CC_CLUB_CAMP:0)+(r&&r.coach&&!ccClubCoachAll()?CC_CLUB_COACH:0); }
// Менеджер команды держит людей: каждое его «очко» уровня — четверть к верности.
function careerClubLoyal(r){ return 1+((r&&r.camp)||ccClubCampAll()?0.5:0)+((r&&r.coach)||ccClubCoachAll()?0.4:0)+0.25*ccStaffT('manager'); }
function careerClubAsking(base, perks){
  const camp=(perks&&perks.camp)||ccClubCampAll(), coach=(perks&&perks.coach)||ccClubCoachAll();
  // Менеджер торгуется: минус 4% с просьбы за уровень.
  const off=(1-(camp?CC_CLUB_CAMP_OFF:0)-(coach?CC_CLUB_COACH_OFF:0))*(1-0.04*ccStaffT('manager'));
  return Math.max(100, Math.round(base*off/10)*10);
}
/* Своё дуо и академия мест в составе не занимают: места — про наёмных.
   Отзыв: «мой напарник в своём» — напарник живёт в клубе отдельной строкой.
   Ему платят как всем, а доля идёт с ЕГО призовых: свои в этой строке не считаются,
   иначе клуб брал бы двадцать процентов из твоего же кармана. */
function careerClubSeats(){ return (careerClub()&&careerClub().roster||[]).filter(r=>!r.mine && !r.acad).length; }
/* АКАДЕМИЯ. Отзыв: «академию тоже можно добавить». Академия — это ставка на
   тех, кого сцена ещё не считает: свободные дуо заметно слабее тебя стоят доли обычной
   зарплаты и мест в составе не занимают. Вырастут сами — сцена год за годом пересчитывает
   рейтинги, — и их можно поднять в состав уже своими. Не вырастут, значит не угадал. */
const CC_CLUB_ACAD=150000;       // построить академию
const CC_CLUB_ACAD_KEEP=600;     // её содержание в месяц
const CC_CLUB_ACAD_SEATS=3;      // сколько дуо в ней живёт
const CC_CLUB_ACAD_PAY=0.4;      // доля обычной зарплаты
const CC_CLUB_ACAD_GAP=10;       // насколько слабее тебя берут в академию
function careerClubAcadSeats(){ return (careerClub()&&careerClub().roster||[]).filter(r=>r.acad).length; }
function careerClubAcadBuild(){
  const club=careerClub(), cr=CAREER && CAREER.career;
  if(!club || !cr || club.acad) return false;
  // Платит клуб, добирая из кармана: стройка в долг не идёт, как и выкуп.
  if((club.cash||0)+Math.max(0, cr.balance||0)<CC_CLUB_ACAD) return false;
  if((club.cash||0)<CC_CLUB_ACAD){
    const fromMe=CC_CLUB_ACAD-(club.cash||0);
    cr.balance=(cr.balance||0)-fromMe; club.cash=(club.cash||0)+fromMe;
  }
  club.cash-=CC_CLUB_ACAD; club.paid=(club.paid||0)+CC_CLUB_ACAD; club.acad=true;
  careerNews('good', 'ccNewsClubAcad', [club.name], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
function careerClubYoung(q){
  const club=careerClub(); if(!club || !club.acad) return [];
  let duos=[]; try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return []; }
  const mine=new Set((careerMates()||[]).concat([careerCard()]).filter(Boolean).map(hKey));
  const have=new Set((club.roster||[]).map(r=>r.id));
  const me=(CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr)||80;
  return duos.filter(d=>{
      const cs=d.cards||[]; if(cs.length!==2) return false;
      if(cs.some(c=>!c || !c.handle || mine.has(hKey(c)) || c.org)) return false;   // из чужого клуба молодёжь не забирают
      const k=careerClubKey(d); if(have.has(k) || have.has('acad:'+k)) return false;
      // Скаутинг находит талант ближе к тебе по уровню: минус 3 к разрыву за уровень отдела.
      return d.avg<=me-Math.max(2, CC_CLUB_ACAD_GAP-3*ccDeptLv('scout'));
    })
    .filter(d=>{ const t=String(q||'').trim().toLowerCase();
      return !t || d.cards.some(c=>String(c.handle||'').toLowerCase().indexOf(t)>=0); })
    .sort((a,b)=>b.avg-a.avg).slice(0, 8+4*ccDeptLv('scout'))
    .map(d=>({id:'acad:'+careerClubKey(d), who:d.cards.map(c=>c.handle), ovr:Math.round(d.avg),
              salary:Math.max(100, Math.round(careerClubSalary(d.avg)*CC_CLUB_ACAD_PAY/10)*10),
              org:null, buyout:0, acad:true}));
}
/* Поднять из академии — в свободное место состава и на взрослую зарплату.
   Сколько он стоит теперь, считает сцена: рейтинг у неё за год мог и вырасти. */
function careerClubPromote(id){
  const club=careerClub(); if(!club) return false;
  const r=(club.roster||[]).find(x=>x.id===id && x.acad); if(!r) return false;
  if(careerClubSeats()>=CC_CLUB_SEATS) return false;
  let now=r.ovr;
  const key=id.slice(5);   // 'acad:' — это дверь, а не человек
  try{ const d=((careerPools()||{}).duos||[]).find(x=>careerClubKey(x)===key); if(d) now=Math.round(d.avg); }catch(e){}
  r.acad=false; r.ovr=now; r.salary=careerClubSalary(now);
  careerNews('good', 'ccNewsClubUp', [club.name, (r.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
function careerClubMateFree(){
  const club=careerClub(); if(!club) return null;
  const mates=(careerMates()||[]).filter(m=>m && m.handle); if(!mates.length) return null;
  const id='mine:'+mates.map(hKey).sort().join('+');
  if((club.roster||[]).some(r=>r.id===id)) return null;
  const ovr=Math.round(mates.reduce((a,m)=>a+(m._ovr||m.ovr||80), 0)/mates.length);
  const salary=careerClubSalary(ovr);
  const org=(mates.find(m=>m && m.org)||{}).org || null;
  return {id:id, who:mates.map(m=>m.handle), ovr:ovr, salary:salary, org:org,
          buyout:org ? salary*CC_CLUB_BUYIN : 0, mine:true};
}
function ccClubDuo(id){
  const m=careerClubMateFree();
  if(m && m.id===id) return m;
  if(String(id).indexOf('acad:')===0) return careerClubYoung('').find(d=>d.id===id) || null;
  return careerClubFree('', true).find(d=>d.id===id) || null;
}
/* ЗА ТВОИМИ ПРИХОДЯТ. Правило: «отпускать за отступные если хочет игрок».
   Раз ты выкупаешь чужих, чужие выкупают твоих: раз в месяц за кем-то приходят и
   называют сумму. Отпустил — деньги в кассе; отказал — это твоё право, но второй
   отказ подряд человек не прощает и уходит сам. Условия контракта (буткемп, тренер)
   тут и работают: за них держатся, и приходят за такими реже.
   Бросок свой, посеянный: общий счётчик трогать нельзя, по нему сверяется гонка. */
const CC_CLUB_POACH=0.3;         // с какой вероятностью за дуо приходят в месяц
function ccClubRivalOrg(rnd){
  let names=[];
  try{ names=[...new Set((((careerPools()||{}).duos)||[]).flatMap(d=>(d.cards||[]).map(c=>c && c.org).filter(Boolean)))]; }catch(e){}
  const club=careerClub();
  names=names.filter(n=>!club || n!==club.name);
  return names.length ? names[Math.floor(rnd()*names.length)%names.length] : null;
}
function careerClubPoach(){
  const club=careerClub(); if(!club) return 0;
  const day=careerToday(); let n=0;
  (club.roster||[]).filter(r=>!r.mine && !r.offer).forEach((r, i)=>{
    const rnd=careerRng(ccHashStr('poach|'+club.name+'|'+r.id+'|'+day+'|'+i));
    if(rnd()>=CC_CLUB_POACH/careerClubLoyal(r)) return;
    const org=ccClubRivalOrg(rnd); if(!org) return;
    // Менеджер выбивает за проданных больше: +10% за уровень.
    r.offer={org:org, sum:Math.round((r.salary||0)*CC_CLUB_BUYIN*(1+rnd()*0.8)*(1+0.1*ccStaffT('manager'))/10)*10, day:day};
    careerNews('flat', 'ccNewsClubWant', [org, (r.who||[]).join(' & ')], {by:ccOrgBy(org)});
    n++;
  });
  if(n) careerSave();
  return n;
}
function careerClubRelease(id){
  const club=careerClub(); if(!club) return false;
  const r=(club.roster||[]).find(x=>x.id===id); if(!r || !r.offer) return false;
  const sum=r.offer.sum||0, org=r.offer.org;
  club.cash=(club.cash||0)+sum; club.got=(club.got||0)+sum;
  careerNews('flat', 'ccNewsClubSold', [club.name, (r.who||[]).join(' & '), org], {by:ccOrgBy(club.name)});
  careerClubDrop(id);
  return true;
}
function careerClubRefuse(id){
  const club=careerClub(); if(!club) return false;
  const r=(club.roster||[]).find(x=>x.id===id); if(!r || !r.offer) return false;
  delete r.offer; r.sour=(r.sour||0)+1;
  careerSave();
  return true;
}
function careerClubTalks(){ const c=careerClub(); if(!c) return {}; if(!c.talks) c.talks={}; return c.talks; }
function careerClubOffer(id, sum, perks){
  const club=careerClub(); if(!club) return null;
  const duo=ccClubDuo(id); if(!duo) return null;
  if(duo.acad && (!club.acad || careerClubAcadSeats()>=ccClubAcadMax(club))) return null;
  if(!duo.mine && !duo.acad && careerClubSeats()>=CC_CLUB_SEATS) return null;
  const money=Math.max(0, Math.round(Number(sum)||0));
  const talks=careerClubTalks(), was=talks[id];
  // Отказ держится до следующего дня: нельзя давить одним и тем же вечером.
  if(was && was.state==='no' && was.day===careerToday()) return {state:'wait', ask:was.ask};
  const base=(was && was.ask) ? was.ask : duo.salary;
  // Условия сбивают цену: за дом и тренера идут дешевле.
  const ask=careerClubAsking(base, perks);
  if(money>=ask){
    talks[id]={state:'yes', ask:base, offer:money, day:careerToday()};
    careerClubSign(id, money, perks);
    return {state:'yes', ask:ask, offer:money};
  }
  if(money>=Math.round(ask*CC_CLUB_HAGGLE)){
    /* Торг: называют своё число, и оно ниже прежнего — разговор двигается.
       Ниже настоящей цены дуо не опускается. */
    const want=Math.max(duo.salary, Math.round((base+money)/2/10)*10);
    talks[id]={state:'ask', ask:want, offer:money, day:careerToday()};
    careerSave();
    return {state:'ask', ask:want, offer:money};
  }
  talks[id]={state:'no', ask:base, offer:money, day:careerToday()};
  careerSave();
  return {state:'no', ask:ask, offer:money};
}
function careerClubFree(q, all){
  const club=careerClub(); if(!club) return [];
  let duos=[]; try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return []; }
  const mine=new Set((careerMates()||[]).concat([careerCard()]).filter(Boolean).map(hKey));
  const have=new Set((club.roster||[]).map(r=>r.id));
  const me=(CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr)||80;
  return duos.filter(d=>{
      const cs=d.cards||[]; if(cs.length!==2) return false;
      if(cs.some(c=>!c || !c.handle || mine.has(hKey(c)))) return false;
      // Свой же состав вторым заходом не показываем — ни взрослый, ни академический.
      const k=careerClubKey(d); if(have.has(k) || have.has('acad:'+k)) return false;
      return d.avg<=me+2;
    })
    .filter(d=>{
      const s=String(q||'').trim().toLowerCase();
      return !s || d.cards.some(c=>String(c.handle||'').toLowerCase().indexOf(s)>=0);
    })
    .sort((a,b)=>b.avg-a.avg).slice(0, all ? 200 : 10)
    .map(d=>{
      /* ПОД КОНТРАКТОМ — ЧЕРЕЗ ВЫКУП. Правило: «они разрывают контракт или мы
         выкупаем или предлагаем свободному агенту». Свободный стоит только зарплаты; у
         чужого клуба человека выкупают — три оклада отступных, и платит их клуб. */
      const salary=careerClubSalary(d.avg);
      const org=(d.cards.find(c=>c && c.org)||{}).org || null;
      return {id:careerClubKey(d), who:d.cards.map(c=>c.handle), ovr:Math.round(d.avg),
              salary:salary, org:org, buyout:org ? salary*CC_CLUB_BUYIN : 0};
    });
}
/* РАСТОРЖЕНИЕ КОНТРАКТА. Правило: «если создаёшь, то должен расторгнуть с клубом
   контракт, если есть орга». Уйти посреди сезона нельзя бесплатно нигде: клуб отпускает за
   неустойку в два месячных оклада. Своя организация при этом не считается — из себя уходить
   некуда. */
const CC_CLUB_BUYOUT=2;        // месяцев оклада за расторжение
function careerClubBuyout(){
  const org=CAREER && CAREER.org;
  if(!org || org.own) return 0;
  return Math.round((org.salary||0)*CC_CLUB_BUYOUT);
}
function careerClubFound(name, fund, focus){
  const cr=CAREER && CAREER.career; if(!cr || cr.club) return false;
  const nm=String(name||'').replace(/<[^>]*>/g,'').trim().slice(0, 24);
  if(!nm) return false;
  const F=CC_CLUB_FUND[fund] ? fund : 'self', FO=CC_CLUB_FOCUS[focus] ? focus : 'comp';
  const price=CC_CLUB_FUND[F].pay;
  const buyout=careerClubBuyout(), left=(CAREER.org && !CAREER.org.own) ? CAREER.org.name : null;
  if((cr.balance||0)<price+buyout) return false;
  cr.balance-=price+buyout;
  if(left){
    // Контракт расторгнут — как при любом уходе: клуб объявляет, ты прощаешься.
    cr.wages=(cr.wages||0)-buyout;
    careerNews('flat', 'ccNewsLeftOrg', [left], {by:ccOrgBy(left)});
    careerNews('flat', 'ccPostBye', [ccHandle(left)]);
    try{ careerEvent('tlOrgLeft', [left]); }catch(e){}
  }
  cr.club={name:nm, since:careerToday(), cash:0, roster:[], paid:0, got:0, focus:FO, staff:{}, dept:{},
           investor: CC_CLUB_FUND[F].share ? {share:CC_CLUB_FUND[F].share, since:careerToday()} : null,
           acad: !!CC_CLUB_FOCUS[FO].acadFree};
  /* Свой клуб — это и есть твой клуб: CAREER.org читают герб, таблицы и лента,
     поэтому он ставится туда же, только без зарплаты и без доли. */
  CAREER.org={name:nm, salary:0, cut:0, tier:70, own:true, since:cr.season, paid:0};
  cr.orgs=cr.orgs||[]; if(cr.orgs.indexOf(nm)<0) cr.orgs.push(nm);
  CAREER.offers=[];
  careerNews('good', 'ccNewsClubFound', [nm], {by:ccOrgBy(nm)});
  careerSave();
  return true;
}
function careerClubSign(id, salary, perks){
  const club=careerClub(); if(!club) return false;
  const free=ccClubDuo(id); if(!free) return false;
  if(free.acad && (!club.acad || careerClubAcadSeats()>=ccClubAcadMax(club))) return false;
  if(!free.mine && !free.acad && careerClubSeats()>=CC_CLUB_SEATS) return false;
  // Зарплата — та, о которой договорились; без разговора берётся их цена.
  const pay=Math.max(1, Math.round(Number(salary)||free.salary));
  /* Отступные чужому клубу — сразу и из кассы. Нечем платить — сделки нет:
     выкуп в долг не берут. */
  const fee=free.buyout||0;
  if(fee){
    const have=(club.cash||0)+Math.max(0, CAREER.career.balance||0);
    if(have<fee+pay) return false;
    if((club.cash||0)<fee){
      const fromMe=fee-(club.cash||0);
      CAREER.career.balance=(CAREER.career.balance||0)-fromMe;
      club.cash=(club.cash||0)+fromMe;
    }
    club.cash-=fee; club.paid=(club.paid||0)+fee;
    careerNews('flat', 'ccNewsClubBuy', [club.name, free.who.join(' & '), free.org||''], {by:ccOrgBy(club.name)});
  }
  // Подпись стоит месяца зарплаты вперёд — из кассы клуба, а не из своего кармана.
  club.roster.push({id:free.id, who:free.who, ovr:free.ovr, salary:pay,
                    camp:!!(perks&&perks.camp), coach:!!(perks&&perks.coach), mine:!!free.mine,
                    acad:!!free.acad, since:careerToday(), won:0, seen:{}});
  club.cash=(club.cash||0)-pay;
  club.paid=(club.paid||0)+pay;
  careerNews('good', 'ccNewsClubSign', [club.name, free.who.join(' & ')], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
/* КАССА — В КАРМАН. Отзыв: «пусть копит клуб потом можно вывести себе». Клуб
   копит сам по себе, но деньги в нём твои: взять их можно в любой момент, и об этом
   остаётся строка — вывел кассу перед зарплатой, значит состав уйдёт. */
function careerClubCashOut(sum){
  const club=careerClub(), cr=CAREER && CAREER.career;
  if(!club || !cr) return 0;
  const take=Math.min(Math.max(0, Math.round(Number(sum)||0)), Math.max(0, Math.round(club.cash||0)));
  if(!take) return 0;
  club.cash-=take;
  cr.balance=(cr.balance||0)+take;
  cr.side=(cr.side||0)+take;
  careerSave();
  return take;
}
function careerClubDrop(id){
  const club=careerClub(); if(!club) return false;
  const i=(club.roster||[]).findIndex(r=>r.id===id); if(i<0) return false;
  const r=club.roster.splice(i, 1)[0];
  careerNews('bad', 'ccNewsClubLeft', [club.name, (r.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
/* Доля с призовых состава. Ничего заново не считается: доска призовых ведётся по
   людям и уже знает, сколько каждый взял за год. Клуб запоминает, сколько он
   видел, и берёт свою долю с прибавки. Зовётся в конце каждого вечера. */
function careerClubTake(){
  const club=careerClub(); if(!club || !(club.roster||[]).length) return 0;
  let got=0;
  const rows=careerMoney().rows||{};
  club.roster.forEach(r=>{
    r.seen=r.seen||{};
    (r.who||[]).forEach(h=>{
      // Свои призовые клубу не режут: это тот же карман.
      const now=Math.round((rows[h]||{}).usd||0);
      const was=r.seen[h];
      if(was==null){ r.seen[h]=now; return; }   // первый вечер после подписи — точка отсчёта
      if(now>was){ const cut=Math.round((now-was)*ccClubCut(club)*(1-ccClubShare(club))); got+=cut; r.won=(r.won||0)+(now-was); }
      r.seen[h]=now;
    });
  });
  if(got){ club.cash=(club.cash||0)+got; club.got=(club.got||0)+got; }
  return got;
}
/* Месяц клуба: спонсор платит за состав, содержание и зарплаты уходят. Касса в
   минусе — добираем из своего кармана; не хватило и там — уходит самое дорогое
   дуо, и об этом пишут. */
function careerClubMonth(months){
  const club=careerClub(); if(!club || !(months>0)) return 0;
  const cr=CAREER.career;
  /* Напарник в клубе — пока он напарник. Разошлись — контракт с ним кончился сам,
     держать в составе человека, с которым больше не играешь, клуб не станет. */
  (club.roster||[]).filter(r=>r.mine).forEach(r=>{
    const now=new Set((careerMates()||[]).filter(Boolean).map(hKey));
    if(!(r.who||[]).every(h=>now.has(hKey(h)))) careerClubDrop(r.id);
  });
  for(let m=0; m<months; m++){
    const roster=club.roster||[];
    // Спонсор платит за наёмных: своё дуо спонсору не состав, а ты сам.
    // Спонсор (база + отдел + направление + SMM), доля инвестора; штат и отделы — расходы.
    const sponsorAll=ccClubSponsorPer(club)*roster.filter(r=>!r.mine).length;
    const inv=Math.round(sponsorAll*ccClubShare(club)), sponsor=sponsorAll-inv;
    const wages=roster.reduce((a,r)=>a+(r.salary||0)+careerClubPerkCost(r), 0)+ccClubStaffPay(club);
    const keep=CC_CLUB_KEEP+(club.acad ? CC_CLUB_ACAD_KEEP : 0)+ccClubDeptKeep(club);
    club.cash=(club.cash||0)+sponsor-keep-wages;
    club.paid=(club.paid||0)+keep+wages;
    club.got=(club.got||0)+sponsor;
    club.inv=(club.inv||0)+inv;
    // SMM клуба растит и твою аудиторию: клуб постит тебя.
    const smm=ccStaffT('smm'); if(smm) careerReachAdd(Math.round(150*smm*ccClubFocus(club).reach), true);
    if(club.cash<0){
      const need=-club.cash;
      const have=Math.min(need, Math.max(0, cr.balance||0));
      cr.balance=(cr.balance||0)-have; club.cash+=have;
      if(club.cash<0 && roster.length){
        const worst=roster.slice().sort((a,b)=>(b.salary||0)-(a.salary||0))[0];
        careerClubDrop(worst.id);
        careerNews('bad', 'ccNewsClubUnpaid', [club.name, (worst.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
        club.cash=0;
      }
    }
  }
  /* Второго отказа подряд человек не прощает: он хотел уйти, ему не дали.
     Условия контракта это гасят — с буткемпом и тренером прощают. */
  (club.roster||[]).filter(r=>(r.sour||0)>=2 && careerClubLoyal(r)<1.4).forEach(r=>{
    careerNews('bad', 'ccNewsClubSour', [club.name, (r.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
    careerClubDrop(r.id);
  });
  careerClubPoach();
  careerSave();
  return 1;
}
function careerOrgCut(){
  const org=CAREER && CAREER.org;
  return (org && org.cut!=null) ? org.cut : 0;
}
/* Where a club sits inside the band the scene pays.

   Stable per club and per week, which is the clock the offers themselves are
   drawn on: the three clubs writing this week are the same three however many
   times the screen redraws, so the money they name has to be too. A contract
   already signed or already on the table carries the number it was written
   with — this only prices an offer as it is made. */
const CC_ORG_WAGE_SPREAD=0.12;
function ccOrgWageNoise(name){
  const cr=CAREER && CAREER.career;
  if(!name || !cr) return 1;
  const rnd=careerRng(ccHashStr('wage|'+name+'|'+(cr.season||1)+'|'+careerWeek()));
  return 1 + (rnd()*2-1)*CC_ORG_WAGE_SPREAD;
}
function careerOrgSalary(tier, div, reach, ovrOf){
  const rated=(ovrOf!=null) ? ovrOf
            : (CAREER && CAREER.player
                ? (CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr)
                : null);
  const cap=CC_WAGE_CAP[ccWageDiv(rated) || div];
  if(cap!=null){
    if(!cap) return 0;
    // Within the division's band, a better club pays nearer the top of it.
    const share=clamp((tier-64)/26, 0.35, 1);
    return Math.max(CC_WAGE_FLOOR, Math.round(cap*share/10)*10);
  }
  /* Division 1 pays $500 to $15,000 a month, and what moves it is how well you
     play — the user's call, 14 August.

     Rating carries it, because in this build a rating is already made of
     results: careerApplyGrowth moves it by how far a run beat or missed what the
     field expected, so it is the measured summary of how good somebody is. The
     Division 1 band runs about 75 to 96, and the money runs steeply across it —
     the difference between the bottom of the division and the top of the world
     is not a straight line, and neither is what clubs pay for it.

     Recent form nudges it either way. A player who has been finishing near the
     front is worth more this month than the same rating that has been finishing
     mid-table, which is the part a rating alone smooths over. */
  const mine=(ovrOf==null);
  const ovr=mine ? (CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr)
                 : ovrOf;
  const across=clamp((ovr-75)/21, 0, 1);
  // Scaled so that the base times the best club lands on the top of the range
  // rather than under it — see the club factor below.
  const base=500+Math.round(7800*Math.pow(across, 2.1));
  // The last four runs, as a share of the field beaten. Half is average — and
  // half is what somebody whose season this mode never simulates is worth,
  // because for them the honest answer is that there is no information.
  const log=mine ? (CAREER.career.log||[]).slice(-4) : [];
  const beat=log.length
    ? log.reduce((t,r)=>t+(r.of>1 ? 1-(r.place-1)/(r.of-1) : 0.5), 0)/log.length
    : 0.5;
  const form=clamp(0.7+beat*0.6, 0.7, 1.3);
  /* And what the club is decides most of what the offer is.

     It used to be a nudge at the edges — 0.85 to 1.15, so the biggest club in
     Europe paid a third more than the smallest one that would sign you, and the
     whole of the offer was really the player's own rating. His call, 20 August,
     after his tester read the market as fixed: a better club is simply a better
     contract, and it should be the loudest thing on the table.

     Three to one across the pool, which runs tier 50 to 96. The base is scaled
     back to match, so the top of the range is where it always was — his own
     number from 14 August, five hundred to fifteen thousand a month — rather
     than everybody good being pinned against the ceiling, which is the same
     mistake in the other direction: a cap nobody can see under is a club that
     stops mattering again at the top. */
  const club=0.6+clamp((tier-60)/36, 0, 1)*1.2;
  return clamp(Math.round(base*form*club/10)*10, 500, 15000);
}

// How close you have to be before a club looks at you. Six points under their
// own standard is the reach: enough that a club one rung above is a real target,
// not so much that the top of Europe signs a Division 4 player.
const CAREER_ORG_REACH=6;
/* Transfer windows. Offers used to be rebuilt after every cup, so turning one down cost nothing.
   Two windows off the calendar: December-January before the season, and the month after each Major, when the scene actually moves.
   Outside them nothing new arrives and existing offers live out their fortnight. The hub shows which it is, so the player knows it's the month and not them. */
const CC_WINDOWS=[
  ['2025-12-01','2026-01-31'],   // the year is built
  ['2026-04-25','2026-05-25'],   // after Major 1
  ['2026-08-01','2026-08-31']    // after Major 2 and Paris
];
/* His call, 17 August: leave it open, clubs write all year, in Fortnite that
   is normal. And it is - this scene has no registration deadline and no window
   to respect. A duo splits in March and both halves are signed by April; a
   Division 2 player wins one open and hears from three clubs the same week. The
   windows above were a football habit borrowed onto a game that does not have
   them, and what they actually did was leave a career unable to move for four
   months at a time for no reason it could see.

   The dates stay in the file because the shape they describe is still true -
   most of this scene moves after a Major - and that is worth something to read
   later. Nothing gates on them. */
function careerWindowNow(iso){ return true; }
// When the next one opens, for the tile to say so.
function careerWindowNext(iso){
  const d=iso||careerToday();
  const w=CC_WINDOWS.find(x=>x[0]>d);
  return w ? w[0] : null;
}
/* Доля предложений, которые берут весь состав, а не одного игрока.
   Четверть — на глаз это «иногда», а по смыслу столько, чтобы такой контракт
   был событием, а не нормой: в окне их два-три, и один из них парный. */
const CC_ORG_DUO_SHARE=0.25;
/* КЛУБ ЗОВЁТ ЗА РЕЗУЛЬТАТ, А НЕ ЗА ЦИФРУ НА КАРТОЧКЕ.

   Его слово 2.10: «как-то в оргу слишком быстро добавить можно». Так и было: ворота
   спрашивали только рейтинг, и новичок с 65+ получал три контракта после первого же
   капа, где он мог занять сотое место. Плитка свободного агента при этом давно
   обещает «предложение приходит после результата» — код этого не делал.

   Результат — то, о чём сцена говорит: топ-10 или верхние 5% поля. Нужно два таких
   вечера за карьеру. Кто уже играл за клуб (карточка настоящего игрока, прошлый
   контракт — cr.orgs), сцене известен и ждать не должен. */
const CC_ORG_PROOF=2;
function ccOrgResult(r){
  return !!(r && r.place>0 && (r.place<=10 || (r.of>0 && r.place<=r.of*0.05)));
}
function ccOrgProven(){
  const cr=CAREER && CAREER.career;
  if(!cr) return false;
  if((cr.orgs||[]).length) return true;
  return (cr.log||[]).filter(ccOrgResult).length>=CC_ORG_PROOF;
}
function careerOrgOffers(){
  // Свой клуб закрывает рынок: играть под своим флагом и получать чужую зарплату нельзя.
  if(typeof careerClub==='function' && careerClub()) return [];
  const pl=CAREER.player, cr=CAREER.career;
  // Nobody signs anybody below Division 3. The tile has said so for weeks —
  // "clubs start looking at about 65 rating, Division 3 and up" — but the code
  // only ever checked the rating, so a Division 5 player who had trained their
  // way to 82 was offered contracts worth nothing a month.
  /* Read at the rating, for the same reason the wage is. The gate used to be the
     rung, which was itself a fix: checking the rating alone had offered a
     Division 5 player who trained to 82 a contract worth nothing a month. The
     nothing was the bug - now that the wage follows the rating, the offer can
     too, and "clubs start looking at about 65 rating" is finally what the code
     does rather than what the tile says. */
  const wageDiv=ccWageDiv(pl.ovrExact!=null ? pl.ovrExact : pl.ovr) || cr.division;
  if(CC_WAGE_CAP.hasOwnProperty(wageDiv) && !CC_WAGE_CAP[wageDiv]) return [];
  /* And a player who said "stop looking" is not looked for.

     A viewer's ask, 20 August, relayed with the screenshot: signed with a club,
     every window still filled the inbox with offers he was never going to take,
     and each one arrived as an unread mark he had to go and clear. So the
     looking is a switch. Off, no new offer is generated — what is already on
     the table keeps its own deadline, exactly like the closed window below —
     and the signed club's own contract talk is untouched, because renewals and
     the goal do not come through this. On is the default: a career that never
     touches the switch behaves as it always has. */
  if(ccScoutOff()) return CAREER.offers||[];
  // And clubs are not signing in March. What is already on the table stays
  // there until its own deadline; this only stops new ones arriving.
  if(!careerWindowNow()) return CAREER.offers||[];
  if(!ccOrgProven()) return CAREER.offers||[];
  const rnd=careerRng(careerSeed(cr,'org'));
  // Somebody whose job it is gets you looked at by clubs that would not have
  // looked. See careerAgent.
  // Плюс то, что менеджер выходил по просьбе игрока — см. careerPitchOn.
  const reach=CAREER_ORG_REACH+careerAgentTerms().reach+careerPitchReach();
  /* Reach was a wall, and his point, 18 August, is that it should not be one:
     Team Spirit can take an 85, it just pays an 85 what an 85 is worth.

     The wall made the wage rule unreachable. A player at 85 topped out at BIG on
     91 — the thirteen clubs above that were not offering worse terms, they were
     not offering at all, so "the big club pays you less" never happened because
     the big club never wrote.

     It is not a straight opening either, or every career would collect the same
     five famous names in its first month and they would stop meaning anything.
     Inside the reach a club looks as it always did. Past it the chance falls
     away with the distance and runs out about seven above, so hearing from a
     club far over your head is a thing that happens rather than a thing you
     plan on — and what arrives is a real first-team offer at your own wage. */
  const mine=(CAREER.org && CAREER.org.name) || null;
  const bound=CAREER.org && !CAREER.org.own && ccOrgSeasonsLeft(CAREER.org)>0 ? (CAREER.org.tier||0)+CC_ORG_POACH_STEP : null;
  const eligible=careerOrgPool().filter(o=>{
    if(mine && o.name===mine) return false;
    if(bound!=null && o.tier<bound) return false;
    const gap=o.tier-pl.ovr;
    if(gap<=reach) return true;
    return rnd() < Math.max(0, 0.35-(gap-reach)*0.05);
  });
  /* Клуб, которому написал менеджер по просьбе игрока, стоит в окне всегда:
     он уже ответил «посмотрим» в диалоге (см. careerAgentPitch), и не найти
     его потом в почте значило бы, что просьба ничего не значит. */
  const asked=careerPitchClub();
  if(asked && !eligible.some(o=>o.name===asked)){
    const o=careerOrgPool().find(x=>x.name===asked);
    if(o && !(mine && o.name===mine)) eligible.unshift(o);
  }
  if(!eligible.length) return [];
  /* The best three that will have you, with a little noise so two careers at the
     same rating do not get the same three names.

     The eight were taken off the top of the pool, which quietly assumed the top
     was thin. Adding the crossover clubs made it dense — ten new names between
     88 and 96 — and every one of the eight ended up above the player, so the
     academy rule below fired on all of them. An 88-rated player was offered
     seven deals and not one was for a main roster: $3,000 where $6,470 was on
     the table the day before. The clubs were right; the window was wrong.

     So the candidates are drawn from both sides: the biggest that will have you,
     and the ones at your own level who will actually start you. */
  /* Three of them, drawn rather than taken off the top.

     His report, 20 August: the manager writes to the same three clubs every
     week. He was right and it was not the seed — that changes with the week. It
     was the shortlist: the five biggest that would have him and the three at his
     own level, off a pool sorted by tier, which at a settled rating is the same
     eight names every time. Three shuffled out of eight the same eight times
     over reads as a manager with three phone numbers.

     So every eligible club is in the draw, weighted toward the ones near the
     player — a club far above is a story rather than a weekly occurrence — and
     whoever wrote last week is weighted down hard, so the list turns over
     instead of circling. Nobody is excluded outright: a club that wants you can
     come back, it just does not come back first. */
  const lastWeek=(cr.orgRecent && cr.orgRecent.week!==careerWeek())
    ? (cr.orgRecent.names||[]) : [];
  const weightOf=o=>{
    const gap=Math.abs(o.tier-pl.ovr);
    return (1/(1+gap*0.35)) * (lastWeek.indexOf(o.name)>=0 ? 0.15 : 1);
  };
  const pool=eligible.slice();
  const shuffled=[];
  while(shuffled.length<3 && pool.length){
    const total=pool.reduce((s,o)=>s+weightOf(o), 0);
    let r=rnd()*total, at=0;
    for(; at<pool.length; at++){ r-=weightOf(pool[at]); if(r<=0) break; }
    shuffled.push(pool.splice(Math.min(at, pool.length-1), 1)[0]);
  }
  /* И клуб, которому написал менеджер, стоит в этой тройке обязательно.
     Держать его в списке кандидатов было мало: тройка тянется броском, и
     адресная просьба могла не выпасть. Вытесняется самый слабый — просьба
     игрока весит больше случайного письма. */
  if(asked && !shuffled.some(o=>o.name===asked)){
    const o=eligible.find(x=>x.name===asked);
    if(o){
      if(shuffled.length>=3) shuffled.sort((a,b)=>a.tier-b.tier).shift();
      shuffled.push(o);
    }
  }
  /* СЛУХИ (29.10, его «10»): за неделю до оффера в ленте «по слухам, X присматривается к тебе», как на сцене.
     Слух — про клуб из тех, кто мог бы написать, но не написал в этот раз; через 5–12 дней он садится в окно,
     и то не всегда: семь из десяти слухов сбываются, остальные просто гаснут. Один слух за раз. */
  const today=careerToday(), ru=cr.rumor;
  if(ru && ru.real && !ru.done && ccDaysBetween(ru.day, today)>=ru.wait){
    ru.done=1;
    const o=eligible.find(x=>x.name===ru.name);
    if(o && !shuffled.some(x=>x.name===o.name)){
      if(shuffled.length>=3) shuffled.sort((a,b)=>a.tier-b.tier).shift();
      shuffled.push(o);
    }
  } else if(!ru || (ru.done || !ru.real) && ccDaysBetween(ru.day, today)>=CC_RUMOR_GAP){
    // Не тот же клуб, что в трёх последних слухах: иначе лента пишет одно и то же имя месяцами.
    const past=cr.rumorPast||[];
    const pool2=eligible.filter(o=>!shuffled.some(x=>x.name===o.name) && o.tier>=pl.ovr-2 && past.indexOf(o.name)<0);
    if(pool2.length && rnd()<CC_RUMOR_ODDS){
      const o=pool2.slice().sort((a,b)=>weightOf(b)-weightOf(a))[Math.floor(rnd()*Math.min(3, pool2.length))];
      cr.rumor={name:o.name, day:today, wait:5+Math.floor(rnd()*8), real:rnd()<0.7};
      cr.rumorPast=past.concat(o.name).slice(-3);
      careerNews('flat', 'ccNewsRumor', [o.name, ccHandle(pl.nick||'')]);
    }
  }
  // Клуб сел в окно — просьба исполнена: менеджера можно просить о следующем.
  if(asked && shuffled.some(o=>o.name===asked) && CAREER.pitch) CAREER.pitch.done=careerToday();
  shuffled.sort((a,b)=>b.tier-a.tier);
  cr.orgRecent={week:careerWeek(), names:shuffled.map(o=>o.name)};
  return shuffled.map(o=>{
    /* A big club does not put an unproven player on its main roster — it signs
       them to the academy and moves them up when they earn it. So the gap
       between what the club is and what the player is decides which roster the
       offer is for: reaching well above yourself gets you the junior side.

       Except in Division 1, his call, 18 August: a player who is already there
       is not unproven, whoever is asking. The club will take any of them for the
       first team and says what it thinks of them with the wage instead — which
       needs no separate rule, because the wage is built from the player's own
       rating and form. Reaching above yourself in Division 1 now costs money
       rather than the seat. The academy stays what it was below it. */
    const academy = cr.division > 1 && o.tier - pl.ovr >= 4;
    /* And a club values a player slightly differently from the club next to it.

       careerOrgSalary is a pure function of the tier and the rating, so every
       club on the same tier named the identical number to the cent and the best
       offer on the table was always simply the biggest badge — his tester had
       HavoK top the list twice running and read the market as fixed, which it
       was. The band is the scene's; where a club sits inside it is the club's
       own business, so this is a stable ±12% per club per window: the same club
       says the same thing all fortnight, and a different one is worth going to
       look at. */
    // And asks for more than the player would have been offered cold.
    const wage = Math.round(careerOrgSalary(o.tier, cr.division, cr.reach)*
                            careerAgentTerms().wage*ccOrgWageNoise(o.name));
    return {
      name:o.name, tier:o.tier, academy:academy,
      // An academy deal pays the bottom of the band. It is a place to be seen,
      // not a job.
      salary: wage>0 ? Math.max(CC_WAGE_FLOOR, academy ? Math.round(wage*0.45/10)*10 : wage) : 0,
      goal: careerOrgGoal(cr.division),
      cut: careerOrgCutFor(o.tier),
      perk: ccOrgPerk(o.tier, academy, rnd),
      term: ccOrgTermRoll(o.tier, academy, rnd),
      // Под контрактом: новый клуб выкупает игрока у нынешнего — платит отступные он, не игрок.
      fee: (CAREER.org && !CAREER.org.own) ? careerBuyoutCost() : 0,
      /* Иногда клуб берёт не игрока, а состав.

         Правка: «пусть будет иногда приходить контракт двоим
         игрокам, чтоб их сразу подписали». В жизни это обычное дело — дуо
         подписывают парой, потому что порознь оно и не играет.

         Каждое четвёртое предложение и только когда напарник вообще есть;
         академия так не подписывает — туда берут поодиночке смотреть. */
      duo: !academy && careerMateRec() && rnd()<CC_ORG_DUO_SHARE
    };
  });
}
/* What a club puts on the table besides money.

   The two things a career actually spends on are the desk and the coach, and a
   club that wants you badly enough pays for one of them — which is what a real
   contract looks like: the org kits the player out, or carries their coach.

   The tier says what a club can afford — an academy deal is a place to be seen
   and carries nothing, a mid club can set you up with gear, and only the top of
   the pool can carry a coach — but affording it is not the same as offering it.
   Some do and some do not, drawn on the same seed the offers are, so a club
   that offered a setup this week is offering it every time that week is opened
   and a reload cannot shop for a better contract. Roughly one in three at the
   gear tier, one in four at the coach tier: rare enough that an offer with a
   coach on it is a reason to sign rather than the usual terms. */
const CC_ORG_GEAR_TIER=80, CC_ORG_COACH_TIER=88;
const CC_ORG_GEAR_CHANCE=0.35, CC_ORG_COACH_CHANCE=0.25;
function ccOrgPerk(tier, academy, rnd){
  if(academy) return null;
  const roll=rnd ? rnd() : 1;
  if(tier>=CC_ORG_COACH_TIER) return roll<CC_ORG_COACH_CHANCE ? 'coach'
                                   : roll<CC_ORG_COACH_CHANCE+CC_ORG_GEAR_CHANCE ? 'gear' : null;
  if(tier>=CC_ORG_GEAR_TIER)  return roll<CC_ORG_GEAR_CHANCE ? 'gear' : null;
  return null;
}
// The club's kit: the peripherals and a PRO rig, given rather than bought. A
// desk the player already owns better of is left alone, and the training it is
// worth is recomputed rather than added, so nothing is paid for twice.
const CC_ORG_KIT=['mouse','headset','keyboard','monitor','pcpro'];
function careerOrgKitOut(){
  CAREER.gear=CAREER.gear||{own:[], train:0};
  CC_ORG_KIT.forEach(id=>{
    const it=CC_SHOP.find(x=>x.id===id);
    if(!it || careerOwns(id)) return;
    if(it.slot && ccShopSlotRank(it.slot)>=it.rank) return;
    CAREER.gear.own=(CAREER.gear.own||[]).concat(id);
  });
  // The desk is worth its best of each thing, counted once.
  const slots={};
  CAREER.gear.train=CC_SHOP.reduce((s,it)=>{
    if(!careerOwns(it.id)) return s;
    if(!it.slot) return s+it.train;
    if((slots[it.slot]||0)>=it.train) return s;
    const gain=it.train-(slots[it.slot]||0);
    slots[it.slot]=it.train;
    return s+gain;
  }, 0);
  careerGearSkill();
}
/* What the desk is worth on the card: per slot the best rung owned, the same
   rule the training bonus uses, so an upgrade replaces rather than stacks.
   Recounted from scratch on every change — buying and being kitted out both
   come through here — and read by careerCard. */
// Девайсы (23.11): в месте шкафчика считается надетое (ccDevEff), мышь/клавиатура/коврик - не на контроллере, контроллер - только на нём.
const CC_DEV_SKILL_SLOTS=['mouse', 'keyboard', 'mpad', 'headset', 'monitor', 'pc', 'ctl'];
function careerGearSkill(){
  const bySlot={}, skill={};
  CC_SHOP.forEach(it=>{
    if(!it.skill || !careerOwns(it.id)) return;
    const key=it.slot||it.id;
    if(CC_DEV_SKILL_SLOTS.indexOf(key)>=0) return;
    if(!bySlot[key] || (it.rank||0)>(bySlot[key].rank||0)) bySlot[key]=it;
  });
  const inp=(CAREER.player && CAREER.player.input)||'kbm';
  CC_DEV_SKILL_SLOTS.forEach(k=>{
    if(inp==='pad' ? (k==='mouse' || k==='keyboard' || k==='mpad') : k==='ctl') return;
    let e=null; try{ e=ccDevEff(k); }catch(err){}
    if(e && e.skill) bySlot[k]=e;
  });
  Object.values(bySlot).forEach(it=>{
    Object.keys(it.skill).forEach(k=>{ skill[k]=(skill[k]||0)+it.skill[k]; });
  });
  CAREER.gear=CAREER.gear||{own:[], train:0};
  CAREER.gear.skill=skill;
  // And the confidence in the garage: the best car owned, nothing stacked.
  CAREER.gear.conf=CC_SHOP.reduce((v,it)=>
    (it.conf && careerOwns(it.id) && it.conf>v) ? it.conf : v, 0);
}
// Whether the club is paying for the coach this month.
function ccOrgPaysCoach(){ return !!(CAREER.org && (CAREER.org.perk==='coach' || (CAREER.org.pays||{}).coach)); }
/* ПОПРОСИТЬ КЛУБ ОПЛАТИТЬ ШТАБ (его слово 8.10: «в карьере игрока добавить возможность попросить оплатить оргу коуча,
   аналитика, психолога»). Просьба — к своему клубу (не к своей организации). Согласие — от того, насколько ты ему нужен:
   рейтинг против уровня клуба, шанс 25…90% (оценка режима), бросок на день и роль — одно и то же нажатие даёт один ответ.
   «Да» — клуб платит эту роль, пока ты в нём (найм и продления бесплатно). «Нет» — снова спросить через 30 дней. */
const CC_ORG_PAY_COOL=30;
function ccOrgPays(kind){
  const o=CAREER && CAREER.org; if(!o || o.own) return false;
  return kind==='coach' ? ccOrgPaysCoach() : !!((o.pays||{})[kind]);
}
function ccOrgPayAskUntil(kind){
  const o=CAREER && CAREER.org, m=o && o.payNo, d=m && m[kind];
  return (d && careerToday()<d) ? d : null;
}
function ccOrgPayChance(){
  const o=CAREER.org, pl=CAREER.player, ovr=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  return Math.max(0.25, Math.min(0.9, 0.5+(ovr-(o.tier||80))*0.05));
}
function careerOrgPayAsk(kind){
  const o=CAREER.org; if(!o || o.own || ccOrgPays(kind) || ccOrgPayAskUntil(kind)) return false;
  const ok=careerRng(ccHashStr('orgpay|'+o.name+'|'+kind+'|'+careerToday()))()<ccOrgPayChance();
  const role=L().ccStaffRole[kind];
  if(ok){ o.pays=o.pays||{}; o.pays[kind]=true; careerNews('good', 'ccNewsOrgPays', [o.name, role]); }
  else { o.payNo=o.payNo||{}; o.payNo[kind]=ccAddDays(careerToday(), CC_ORG_PAY_COOL); careerNews('bad', 'ccNewsOrgPaysNo', [o.name, role]); }
  careerSave(); careerRenderHub(); return ok;
}

// What they want for it. Below Division 1 a club wants the thing the ladder is
// for: get up a rung. In Division 1 there is no rung left, so they want a
// result — a top-20 finish in any cup this season.
