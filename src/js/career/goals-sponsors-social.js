/*@@PART js/career/goals-sponsors-social.js@@*/
/* ЦЕЛЬ СЕЗОНА — НА ВЫБОР (его слово 20.10, вслед за целями месяца: «сам выбирает реалистичные цели… не в любом кубке,
   а FNCS»). Клуб предлагает три, выбор — до конца сезона один раз; не выбрал — остаётся средняя. Выполнена —
   продление с прибавкой по сложности (+10% / +15% / +30%), провал — клуб расторгает, как и было.
     Дивизион 2+: надёжная — топ-20 в кубке; средняя — подняться на дивизион; амбициозная — на два (со 2-го —
       подняться и взять топ-5 в сессии FNCS Divisional Cup).
     Дивизион 1 (и годы без дивизионов): надёжная — топ-20 в Финале недели FNCS (если их в году нет — в кубке);
       средняя — дойти до финала Мейджора FNCS; амбициозная — топ-10 в финале Мейджора FNCS. */
const CC_ORG_GOAL_RAISE=[0.10, 0.15, 0.30];
function careerOrgGoalOpts(div){
  const noDiv=typeof ccNoDivisions==='function' && ccNoDivisions();
  if(!noDiv && div>1){
    return [{type:'place', target:20},
            {type:'promote', target:div-1},
            div>2 ? {type:'promote', target:div-2} : {type:'promote', target:div-1, plus:{cat:'fncsCup', how:'place', n:5}}];
  }
  let wf=false; try{ careerEvents().forEach(evs=>{ if((evs||[]).some(e=>e.kind==='final')) wf=true; }); }catch(e){}
  return [wf ? {type:'cat', cat:'fncsFinal', how:'place', n:20} : {type:'place', target:20},
          {type:'cat', cat:'majorFinal', how:'reach'},
          {type:'cat', cat:'majorFinal', how:'place', n:10}];
}
// Цель по умолчанию — средняя, с вариантами внутри: выбрать можно до конца сезона (careerOrgGoalPick).
function careerOrgGoal(div){
  const opts=careerOrgGoalOpts(div).map((o, i)=>Object.assign(o, {tier:i}));
  return Object.assign({}, opts[1], {opts:opts, pick:null});
}
function careerOrgGoalPick(i){
  const org=CAREER && CAREER.org; if(!org || org.own || !org.goal || !org.goal.opts || org.goal.pick!=null) return;
  const o=org.goal.opts[i]; if(!o) return;
  org.goal=Object.assign({}, o, {opts:org.goal.opts, pick:i});
  careerSave(); if(typeof careerRenderHub==='function') careerRenderHub();
}
function careerOrgGoalText(goal){
  // Цели может не быть вовсе: свой клуб задач себе не ставит. См. careerClubFound.
  if(!goal || !goal.type) return '-';
  const T=L();
  if(goal.type==='cat'){
    if(goal.how==='reach') return (T.ccGoalReach||{})[goal.cat] || T.ccGoalPlace(10);
    const f=(T.ccMgPlaceOf||{})[goal.cat]; return f ? f(goal.n) : T.ccGoalPlace(goal.n);
  }
  const base=goal.type==='promote' ? T.ccGoalPromote(goal.target) : T.ccGoalPlace(goal.target);
  if(goal.plus){ const f=(T.ccMgPlaceOf||{})[goal.plus.cat]; return base+' + '+(f ? f(goal.plus.n) : T.ccGoalPlace(goal.plus.n)); }
  return base;
}
function ccOrgGoalPickHTML(){
  /* 23.10, его слово (Notion): «про проценты можно убрать». Выбор цели сезона с +10/+15/+30% больше не показывается:
     цель остаётся средней, как и было без выбора. careerOrgGoalPick оставлен для старых сейвов. */
  return '';
  const org=CAREER && CAREER.org, g=org && org.goal;
  if(!g || org.own || !g.opts || g.pick!=null) return '';
  const T=L();
  return '<div class="cc-mg-pick"><small>'+esc(T.ccOrgGoalPickHint)+'</small>'+g.opts.map((o, i)=>
    '<button type="button" class="cc-mg-opt cc-mg-t'+i+'" onclick="event.stopPropagation();careerOrgGoalPick('+i+')">'+
      '<em>'+esc((T.ccMgTier||[])[i]||'')+'</em><b>'+esc(careerOrgGoalText(o))+'</b><i>+'+Math.round(CC_ORG_GOAL_RAISE[i]*100)+'%</i></button>').join('')+'</div>';
}
// Whether the season's log has already done it. Promotion is read off the
// division you are standing in, a placement off the best finish of the season.
function careerOrgGoalMet(){
  /* СВОЙ КЛУБ НЕ СТАВИТ СЕБЕ ЗАДАЧ, и цели у него нет. Скриншот: основал
     организацию по ссылке с деньгами, открыл вкладку «карьера» — «Cannot read properties
     of undefined (reading 'type')». Читалось org.goal.type у контракта, которого нет:
     careerClubFound ставит CAREER.org сам, без зарплаты, доли и цели. */
  const org=CAREER.org; if(!org || !org.goal) return false;
  const cr=CAREER.career;
  const rows=(cr.log||[]).filter(e=>e.season===cr.season);
  const catOk=(c)=>rows.some(r=>ccMgCat(r)===c.cat && (c.how==='reach' ? true : c.how==='cut' ? !!r.passed : (r.place||999)<=c.n));
  if(org.goal.type==='cat') return catOk(org.goal);
  if(org.goal.type==='promote') return cr.division<=org.goal.target && (!org.goal.plus || catOk(org.goal.plus));
  const best=(cr.log||[]).filter(e=>e.season===cr.season).reduce((b,e)=>Math.min(b, e.place), 999);
  return best<=org.goal.target;
}

/* Клуб, подписавший состав, подписывает и напарника.

   Возвращает ник первого из подписанных вместе с тобой — им и называется пост,
   — или null, если контракт был личным. Больше ничего в карьере не меняется:
   зарплата остаётся твоей, цели — твои, а у напарника появляется клуб, который
   виден в составе и в ленте. Именно это и просили: «чтоб их сразу подписали». */
function careerOrgSignMates(offer){
  if(!offer || !offer.duo) return null;
  const recs=careerMateRecords();
  if(!recs.length) return null;
  recs.forEach(r=>{ if(r) r.org=offer.name; });
  const first=recs[0];
  const card=ccMateCardOf(first);
  return ccHandle((card && card.handle) || (first && first.handle) || '');
}
function careerSign(i){
  const offer=(CAREER.offers||[])[i];
  if(!offer) return;
  CAREER.org={name:offer.name, tier:offer.tier, salary:offer.salary,
              goal:offer.goal, cut:offer.cut!=null?offer.cut:careerOrgCutFor(offer.tier),
              since:CAREER.career.season, paid:0, perk:offer.perk||null,
              bonus:careerOrgBonusFor(offer.salary), to:CAREER.career.season+(offer.term||1)-1};
  CAREER.offers=null;
  careerReachAdd(ccOrgMediaSign(offer.name, offer.tier, offer.academy), true);
  const withMates=careerOrgSignMates(offer);
  if(withMates) careerNews('good', 'ccNewsSignedDuo', [offer.name, withMates], {by:ccOrgBy(offer.name)});
  else careerNews('good', 'ccNewsSigned', [offer.name, offer.salary], {by:ccOrgBy(offer.name)});
  // What they promised, delivered the day it is signed rather than owed.
  if(offer.perk==='gear'){
    careerOrgKitOut();
    careerNews('good', 'ccNewsOrgKit', [offer.name]);
  } else if(offer.perk==='coach'){
    careerNews('good', 'ccNewsOrgCoach', [offer.name]);
  }
  careerSave();
  careerRenderHub();
}
/* Saying no to what is on the table, not to the rest of the year.

   This wrote the season number and the rebuild was skipped for as long as the
   season lasted — forty-three weeks of silence from one press. A player's
   report, 18 August: "you decline and they never appear again, I could not
   believe it", and then the part that shows how bad it is — he won a LAN, left
   his club to be signed for more, and nobody wrote.

   Which also contradicts this file's own decision: careerWindowNow returns true
   because in this scene clubs write all year. A no cannot mean more than a no.

   So it quiets the ones who asked, for a month, and a real result reopens it
   immediately — because a club that passed in February is a different club after
   you win something. */
const CC_OFFER_QUIET=30;
function careerDeclineOffers(){
  CAREER.offers=null;
  CAREER.offersDeclined={day:careerToday()};
  careerSave();
  careerRenderHub();
}
// Whether clubs may write again after this result.
function ccOffersOpen(place, of){
  const d=CAREER.offersDeclined;
  if(!d) return true;
  // An old save carries the season number this used to store; a career that
  // declined under the old rule is not held to it for the rest of the year.
  const day=(typeof d==='object' && d.day) ? d.day : null;
  if(!day) return true;
  if(ccDaysBetween(day, careerToday())>=CC_OFFER_QUIET) return true;
  // Anything the room would talk about: a win, a podium, a LAN seat.
  return place<=3;
}

/* Wages arrive on the first of the month, the way a club actually pays.

   They used to be a slice of the season divided by its weeks, which is a number
   no contract has ever quoted. With a date for a clock the career can pay the
   way the deal reads: a payday is the first of a month, and a season of them
   adds up to the season's salary — so the instalment is the contract over how
   many paydays this career year has left, rather than a twelfth of anything.
   Derived, so it stays right when the career's start moves.

   They are not earnings. A Fortnite career is measured publicly in prize money —
   the number a player puts in their own bio — and a club wage is not part of it.
   cr.earnings is what events paid, cr.wages is what clubs did. */
function careerWagePaydays(){
  const out=[];
  for(let d=ccAddDays(careerStartDay(),1); d<=ccYearTo(); d=ccAddDays(d,1))
    if(d.slice(8)==='01') out.push(d);
  return out;
}
// Paid for the days a move crosses rather than for the day it lands on: a week
// that steps over the 1st still pays, and the clock mostly will not land on it.
function careerPayWages(fromISO, toISO){
  const org=CAREER.org;
  const pays=careerWagePaydays();
  if(!pays.length) return 0;
  const months=pays.filter(d=>d>fromISO && d<=toISO).length;
  try{ if(typeof careerClubMonth==='function') careerClubMonth(months); }catch(e){}   // свой клуб: спонсор, содержание, зарплаты
  try{ if(typeof careerMerchMonth==='function') careerMerchMonth(months); }catch(e){}   // свой мерч: доля аудитории
  let paid=0;
  if(org && org.salary){
    /* A monthly wage is paid monthly.

       careerOrgSalary is a month's money and says so - "Division 1 pays $500 to
       $15,000 a month", his call on 14 August - the offer prints it with "/ мес"
       beside it, and this divided it by the eleven paydays in a year before
       handing any of it over. So a club offered a Division 1 player seven and a
       half thousand a month and paid six hundred and eighty, which is the whole
       of "they offer very little": the number in the message was true and the
       money was a eleventh of it. */
    paid+=org.salary*months;
    // Клуб постит тебя каждый месяц — медийка от его аудитории (ccOrgMediaMonth).
    if(months && !org.own) careerReachAdd(ccOrgMediaMonth(org.name, org.tier, org.academy)*months, true);
    if(paid){
      CAREER.career.wages=(CAREER.career.wages||0)+paid;
      org.paid=(org.paid||0)+paid;
    }
  }
  /* The sponsor used to pay here, on the first, for existing.

     Which made it the second thing in the mode converting followers into money
     - the stream day is the other - and the worse of the two: a monthly cheque
     for a number that goes up on its own is a notification, not a decision. A
     brand is not paying for an audience, it is paying for a slot in front of
     one, and the slot only exists on a night somebody actually streams.

     So it pays per stream now, in careerDoAct, and this day is the club and the
     rent alone. */
  if(paid){
    // The agent's share of a month's wage, taken the way it is taken off a
    // prize: the club paid what the club paid, and the cut is a line of its own.
    const cut=Math.round(paid*careerAgentTerms().cut);
    if(cut){
      CAREER.career.agentPaid=(CAREER.career.agentPaid||0)+cut;
    }
    CAREER.career.balance=(CAREER.career.balance||0)+(paid-cut);
  }
  /* And what the month costs. A career that has moved pays the rent of the
     country it moved to on the same day the wages land, so the first of the
     month is one row and not two — money in, money out, one balance.

     Paid after the wages rather than before them: the point of a wage is that it
     covers the rent, and charging first would evict a player on the morning
     their salary arrived. A month that still cannot be covered ends the lease
     rather than running a debt — this mode has no debt, and inventing one to
     punish a bad season would be a system nobody asked for. */
  const rent=ccRentNow()*months;
  if(rent){
    if((CAREER.career.balance||0)>=rent){
      CAREER.career.balance-=rent;
      CAREER.career.rent=(CAREER.career.rent||0)+rent;
    } else careerMoveEvict();
  }
  return paid;
}

/* ---- Sponsors ----
   Followers turn into money. Three tiers by audience: peripheral brand 10k, provider 50k, brand deal 150k. Paid
   monthly on wage day.
   Kept small vs Division 1 (top deal is about a Weekly Final 4th a month) so careers are won on the ladder. The
   point is the bottom: below D1 nothing pays, so sponsors make coach and desk reachable early. */
/* What a brand pays, and what it is paying for.

   It was a monthly cheque against a follower count, which made it the second
   thing in this mode turning an audience into money and the worse of the two:
   the number goes up on its own, so the money arrived for nothing anybody
   decided. A brand is not buying an audience, it is buying a slot in front of
   one, and the slot exists on the nights somebody streams.

   So the fee is per stream night. The sizes are set against what the monthly
   cheque used to be at a normal amount of streaming - ten nights a month puts
   the gear deal at $600 and the brand deal at $5,000, near enough where they
   were - except that now a career that never streams is paid nothing, which is
   also what would happen. */
/* Brand deals priced per thousand readers ($6 per 1k, the scene's creator-slot rate), so offers grow
   with the audience; a fixed fee per tier stayed at $60/night from 10k to 49k readers.
   Tier decides who writes and the budget ceiling, which keeps deals below Division 1 earnings.
   A brand re-offers once the audience is worth 25% more than the signed rate. */
/* The order the shop draws people in: biggest account first, smallest last.

   His call, 19 August. Three lists here are priced off a follower count — the
   manager, the marketing manager and the SMM — and they were drawn in three
   different orders: marketing and SMM biggest-first, and the managers in the
   order the people were added to the file. One rule for all three now, and it is
   the one the other two already had — the window opens on the name worth wanting
   and runs down to the one anybody can get.

   Sorted where it is drawn rather than in the tables, because the tables carry
   their own order — CC_AGENTS is written in the order the people arrived, and
   the notes on those rows are the history of it. Coaches are not in this: they
   have no follower count and their list is deliberately grouped, heads first
   and then the specialists, who are all one price on purpose. */
/* The order the four windows run in, his own, off the two screenshots.

   It has been three things now: the follower count, then his hand-written
   order, then the alphabet. This is the hand-written one back, because it is
   the one he keeps writing out — and this time the numbers follow it rather
   than argue with it. See ccRankPull.

   One list for all four, keyed by handle, because a person moves between them:
   an SMM who starts managing is one line moved rather than a row rewritten.

   Anybody not named falls to the end keeping their own table’s order. A person
   added to the data and forgotten here shows up at the bottom of the window
   rather than somewhere in the middle of it, and last is a visible thing to fix.
*/
const CC_SHOP_ORDER=[
  // Managers. Yeekzie last, his call — placed rather than left to fall there,
  // so the end of this list is a decision and not an omission.
  // Razia is placed on the one thing this list is allowed to be placed on when
  // there is no hand-written order for a new row: his account is larger than the
  // two under him and smaller than the one over him. Move him if he belongs
  // somewhere else — the position is the whole price.
  'alhasarda','JoaovEU','ElyxxM','F0C8S','IdziU97','RemssMNG','AlybiSaCE',
  'Th0masNL','ZedroxMNG','DamlosMNG','ClapMNG','errieMNG','PixelzMNG',
  'Raziaa_','NaaxoMNG','Kiinywz0','Yeekzie7',
  // Socials. Sweety second and Lumos beside Ugo under Sandora, both his call:
  // his own list writes those two on a single line.
  'v1nteroFN','SweetyyFN','SandoraFN','CmLumos','UgoComm','Pyp4ingS','veltrixx10','Lair_Fn',
  // Marketing
  'PyraxMGMT','Goalkikermng','KaizenMNG','murlotron',
  // Coaches — ПО РЕЙТИНГУ КОУЧА (его слова 8.10: «по фоловерам твитера» → «или по результатам» → «вот и сделай зп и
  // рейтинг их»): сначала подтверждённые результаты, ниже — по подписчикам. Рейтинг — ccCoachRatingOf, цена от него.
  'RazZzero0oFN','Thomas5x_','BloodxEU','SvenSE_','Gripeyy','PeanutBrainTS','tallami1','Coach_F0x','Flaireeeee','CoachDashura','BoopNL_','stormyrite','diaspaulin_','Rabidfn','At0m_GG','kha0rz','EgeXJerG','ZykomaTV','xpl0t','ValentaynL','spidryx','CoachEsteh','CoachNassimm','coachAchille'
];
/* Подписчики коучей в X, сняты 8.10.2026 через api.fxtwitter.com по их же адресам (at) — каждый сверен по имени и
   описанию; у Boop, Stormyrite, Gripey, Spidryx, Zykoma тёзки отброшены. */
const CC_COACH_X={DestinysJesus:112065, RazZzero0oFN:418315, BoopNL_:127598, stormyrite:98460, BloodxEU:82759, SvenSE_:26955, Gripeyy:22316, diaspaulin_:18474, tallami1:17589, Rabidfn:13220, At0m_GG:12350, Coach_F0x:9342, kha0rz:9246, PeanutBrainTS:6675, Thomas5x_:6498, EgeXJerG:4403, ZykomaTV:4329, xpl0t:3852, ValentaynL:3072, spidryx:2609, CoachEsteh:2343, Flaireeeee:742, CoachDashura:1065, CoachNassimm:478, coachAchille:56};
const CC_SHOP_RANK=(function(){
  const m={};
  CC_SHOP_ORDER.forEach((h,i)=>{ m[String(h).toLowerCase()]=i; });
  return m;
})();
function ccShopKey(x){ return String((x&&x.at)||(x&&x.id)||'').toLowerCase(); }
/* Position in the list as a 0..1 value for the four agent windows (manager cut/reach/wage,
   marketer ask/land, SMM ask/boost). Top = 1, bottom = 0, evenly spread; ranges are unchanged,
   only the order now follows the list instead of a log curve on followers.
   Matched by handle since a signed agent is a copy in the save; not in the list gives null (plain terms). */
/* РЕЙТИНГ ЛЮДЕЙ ИЗ МАГАЗИНА — менеджеры, SMM, маркетинг (его «может и с другими так сделать, менеджеры, смм», 8.10;
   коучи — ccCoachRatingOf). Результат человека — его клиенты: средний рейтинг четырёх лучших игроков, которых он
   ведёт, по его же описанию в X (сняты 8.10.2026) и картам этой базы; рейтинг = p − 6, от 60 до 95. У кого клиенты
   не названы или их нет в базе — по подписчикам: 60 + 6·lg(подписчики/1000), не выше 76. Условия (доля, охват,
   прибавка, цена) идут от рейтинга, а не от места в списке; порядок окна — по рейтингу. Формула — оценка режима. */
const CC_STAFF_X={"roxogg":3007, "ZeyroxMNG1":380, "JoaovEU":2874, "ElyxxM":16729, "alhasarda":3166, "NaaxoMNG":853, "PixelzMNG":2439, "Kiinywz0":822, "Yeekzie7":3076, "F0C8S":4581, "ClapMNG":4144, "AlybiSaCE":3366, "IdziU97":3200, "Th0masNL":2363, "RemssMNG":2150, "DamlosMNG":1674, "ZedroxMNG":1364, "errieMNG":1304, "Raziaa_":953, "LC7_MNG":931, "ArtinMNG":866, "yaleblan":787, "DrazoxMNG":702, "Skyforcemng272":525, "Zerkomng":516, "Lou1sMNG":385, "askebott":294, "v1nteroFN":2137, "SweetyyFN":1991, "SandoraFN":1014, "baderwtw":885, "Pyp4ingS":613, "UgoComm":548, "Lair_Fn":594, "veltrixx10":481, "CmLumos":357, "MetiDark_":49, "murlotron":3007, "Goalkikermng":1104, "KaizenMNG":785, "PyraxMGMT":433, "loicmng_":565, "wyzefn6":1893};
const CC_STAFF_RES={
  "roxogg":{p:91, who:["Phzin","Edson","916Gon","Night"]},   // 23.10: в X — phzin, edson, 916gon, blxckoutz, night, seeyun, pardal; четыре лучшие карты
  "PixelzMNG":{p:77, who:["Matice","Shadox","Seili","Th3ioF"]},   // 23.10: matice, Shadox, Seili, Th3io, Sobyy, Berre (двух последних в базе нет)
  "ClapMNG":{p:90.5, who:["Twek","Salko","Kyzen","Artskill"]},   // 23.10: Kyzen, Lame (BR, не EU Lame), Girlybella, Artskill, salko, twek, Turtl3
  "IdziU97":{p:92.5, who:["Shadow","Blacha","Nxthan","G13ras"]},   // 23.10: Nathan, Shadow, Blacha, Kombek, Pixovsky, Predage, cheatiin, G13ras
  "SweetyyFN":{p:95.8, who:["Flickzy","Pixie","MariusCOW","Tjino"]},
  "SandoraFN":{p:96, who:["Vanyak3kk"]},
  "baderwtw":{p:95, who:["Eomzo","PXMP"]},
  "veltrixx10":{p:89.7, who:["SkyJump","Werex","Akiira"]},
  "Goalkikermng":{p:89.7, who:["Upl","F1n4ik","Predage"]},
  "PyraxMGMT":{p:92, who:["SkyJump"]},
  "JoaovEU":{p:96, who:["Vanyak3kk","Ajerss"]},   // 23.10: JV Agency — Vanyak3kk и Ajerss
  "wyzefn6":{p:62.7, who:["Rz Verifvǃ","fa wiverǃ","Rz Pruzen 10"]},   // capri в базе нет
  "loicmng_":{p:52, who:["Galaxyache 32"]},   // 23.10: konect.gg/loicmng — 23 клиента; в базе только Galaxyache (Louis 92 и voz OCE — тёзки)
  /* 23.10 вечер (его слово: «пусть от игроков зависит рейтинг, а не от подписчиков»): составы агентств — сайты агентств,
     konect.gg, linktree, твиты игроков «contact @…». Тёзки из чужого региона отброшены (Magma NAC, Raz ME, Noa ASIA,
     Jax OCE, Hugo OCE, Centro NAW). Четыре лучшие карты базы. */
  "alhasarda":{p:98, who:["Kami","SwizzY","JannisZ","Flickzy"]},   // onlygrp.com/clients: + charyy, Chap, Kaan
  "ElyxxM":{p:97, who:["Setty","Sky","Scroll","TaySon"]},   // «agent for Sky and Scroll» (24.09), TaySon и Setty — contact в твитах
  "AlybiSaCE":{p:92.8, who:["EpikWhale","Braydz","Aoxy","Kraez"]},   // Proxy: + Vazen, Twunti, crylix (contact в твитах 2026)
  "Yeekzie7":{p:92.3, who:["P1ng","Howly","1Lusha","Minori"]},   // questmind.gg/fr/esport: + Darkos, Syaaz, Ghonzo, iFr0zi, Aiden, NeFrizi, Tylio
  "RemssMNG":{p:92, who:["Momsy","Izzi","Darkos","Minori"]},   // konect.gg/RemssMNG: + Tisma, Tylio, Frost, Th3ioF, Sweey
  "F0C8S":{p:92, who:["Bacca","Curve","Ozone","Dolzeur"]},   // CreedTalent: + Channce, Wolvax, Wheat, Hedra, catman
  "Th0masNL":{p:87.5, who:["Repairs","Robin"]},   // contact в твитах 2026; Hiizix в базе нет
  "ArtinMNG":{p:83, who:["karmy","Akiira","glubfnbr","3R8"]},   // Beyond Agency (konect.gg/Artin, теги агентства)
  "DamlosMNG":{p:81, who:["Noia","Ve1ryy","Seekk","Zyyron"]},   // almanagement.fr/talents
  "NaaxoMNG":{p:77, who:["Tisma","Skyz"]},   // naaxo.netlify.app, konect.gg/NaaxoMNG
  "askebott":{p:67, who:["noah","Poweer","DANYA"]},   // konect.gg/AskeyMNG
  // Игроки названы, а карт в базе нет (или только тёзки) — рейтинг 65.
  "Zerkomng":{p:null, who:["insaneebtw","cuhkifn","eonshh","snekgery"]},   // шапка X
  "LC7_MNG":{p:null, who:["toryzenfv","maddingooo"]},   // шапка X
  "Lou1sMNG":{p:null, who:["Timur11x","Worizome180"]},   // шапка X
  "yaleblan":{p:null, who:["rexivski","Hugo","Linqish","dkay","arvid","Meltz","ozarxo","Atome","Da1ko","dzeq"]},   // linktr.ee/YaleblanFN
  "Raziaa_":{p:null, who:["Noaggs","Hazyache","squadir23","noa"]},   // шапка X 21.08, konect.gg/raziaa
  "Skyforcemng272":{p:null, who:["joyyfnrr","NATEKFN1","Karotek_"]},   // шапка X 29.09
  "apolinmng":{p:null, who:["crunkezz","jayzfnn"]}   // шапка X 27.09 (аккаунт 23.10 заблокирован)
};
function ccStaffRating(x){
  if(!x) return 60;
  // Коуч узнаётся по своим полям: обращение к CC_COACHES отсюда падает на загрузке (константа ниже по файлу, TDZ).
  if(x.train!=null && x.keys){ try{ return ccCoachRatingOf(x); }catch(e){ return x.rating||60; } }
  const r=CC_STAFF_RES[x.at];
  // Один-два клиента — ещё не результат: −2 за каждого недостающего до четырёх.
  // Есть хоть один свой игрок — не ниже 65 (его слово 23.10); p:null — игроки названы, но карт в базе нет.
  if(r) return r.p==null ? 65 : Math.max(65, Math.min(95, Math.round(r.p-6-2*Math.max(0, 4-(r.who||[]).length))));
  /* Менеджер — только от игроков (его слово 23.10: «пусть от игроков зависит рейтинг, а не от подписчиков»). Без найденных
     игроков — низ шкалы; подписчики решают лишь порядок равных (ccByHand). SMM и маркетинг — по-прежнему по аудитории. */
  let agent=false; try{ agent=CC_AGENTS.some(a=>a.at===x.at); }catch(e){}
  if(agent) return 60;
  const f=CC_STAFF_X[x.at]!=null ? CC_STAFF_X[x.at] : (x.x||500);
  return Math.max(60, Math.min(76, Math.round(60+6*Math.log10(Math.max(1000, f)/1000))));
}
function ccRankPull(list, item){
  if(!item || !list || list.length<2) return null;
  // Не из списка (вписанный руками, чужой) — без места, обычные условия, как было.
  const key=ccShopKey(item); if(!list.some(r=>ccShopKey(r)===key)) return null;
  return Math.max(0, Math.min(1, (ccStaffRating(item)-60)/35));
}
function ccByHand(list){
  /* Равный рейтинг — по подписчикам (его слово 20.10). Коучи держат подписчиков в CC_COACH_X, а читался только
     CC_STAFF_X — у коучей одного рейтинга порядок был файловый (Boop 128K стоял ниже 98K). */
  const fol=x=>CC_STAFF_X[x.at]!=null ? CC_STAFF_X[x.at] : (typeof CC_COACH_X!=='undefined' && CC_COACH_X[x.at]!=null) ? CC_COACH_X[x.at] : (x.x||0);
  const rank=x=>-ccStaffRating(x)*1e7-fol(x);
  // Index carried alongside, so everyone unplaced keeps their own table’s order
  // rather than whatever the sort happens to do with equal keys.
  return list.map((x,i)=>({x:x,i:i}))
             .sort((a,b)=>(rank(a.x)-rank(b.x)) || (a.i-b.i))
             .map(o=>o.x);
}


const CC_AD_PER=6, CC_AD_STEP=1.25;
const CC_MKT_DAYS=30;
const CC_MARKETING=[
  {id:'murlotron',name:'Murlo',          at:'murlotron',   photo:'murlotron.jpg',   x:3057},
  {id:'goalkiker',name:'Lyost Goalkiker',at:'Goalkikermng',photo:'Goalkikermng.jpg',x:1056},
  {id:'kaizen',   name:'Kaizen',         at:'KaizenMNG',   photo:'KaizenMNG.jpg',   x:738},
  {id:'pyrax',    name:'Paul',           at:'PyraxMGMT',   photo:'PyraxMGMT.jpg',   x:378}
];
function ccMktOf(id){ return CC_MARKETING.find(m=>m.id===id) || null; }
/* What one asks for a month, and what they land. Both off the account, on the
   same curve the player's manager is priced on — see ccAgentPull. A month costs
   what the smallest of them asks when nothing has been read yet. */
const CC_MKT_BASE=600;
const CC_MKT_X_FLOOR=250, CC_MKT_X_TOP=3500;
function ccMktTermsOf(m){
  const k=ccRankPull(CC_MARKETING, m);
  // Цена — та же кривая штаба, $250…3 000 (17.10, его «а другой стафф»); без места в списке — CC_MKT_BASE.
  return {cost: m && m.cost!=null ? m.cost
                : (k==null ? CC_MKT_BASE : ccStaffCostCurve(250, 3000, k)),
          rate: m && m.rate!=null ? m.rate : (1+(k==null?0:k*0.6))};
}
function ccMkt(){
  const m=CAREER && CAREER.mkt;
  if(!m || careerToday()>m.until) return null;
  return m;
}
function careerHireMkt(id, months){
  months=months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1;
  const cr=CAREER.career, who=ccMktOf(id);
  if(!who || ccMkt()) return false;
  const t=ccMktTermsOf(who), due=ccStaffTermCost(t.cost, months);
  if((cr.balance||0)<due) return false;
  cr.balance-=due;
  CAREER.mkt={id:who.id, name:who.name, at:who.at, photo:who.photo,
              cost:t.cost, rate:t.rate, months,
              from:careerToday(), until:ccAddDays(careerToday(), ccStaffTermDays(months))};
  ccMktPickClose();
  careerSave();
  careerRenderHub();
  return true;
}
function careerEndMkt(){
  if(!CAREER.mkt) return false;
  CAREER.mkt=null;
  careerSave();
  careerRenderHub();
  return true;
}
function ccMktPickOpen(){
  const cr=CAREER.career, on=ccMkt();
  const rows=ccByHand(CC_MARKETING).map(m=>{
    const t=ccMktTermsOf(m);
    const mine=on && on.id===m.id;
    const can=!on && (cr.balance||0)>=t.cost;
    return `<div class="cc-buy${mine?' own':''}">
      ${m.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(m.photo)}" alt=""
           loading="lazy" onerror="this.remove()">` : ''}
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(m.name)}</span> ${ccStaffBadge(ccStaffRating(m)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${m.x ? '👥 '+ccFollowers(m.x)+' · ' : ''}@${esc(m.at)}</i>
        <span class="cc-buy-chips"><em class="up">${L().ccMktRate} +${Math.round((t.rate-1)*100)}%</em></span></div>
      ${mine ? `<span class="cc-owned">${L().ccAgentYours}</span>`
             : ccHireBtns(can, t.cost, "careerHireMkt('"+m.id+"')", "careerHireMkt('"+m.id+"',12)")}
    </div>`;
  }).join('');
  document.getElementById('mktPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccMkt}</h4>
     <div class="ch-hint">${L().ccMktHint}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('mktPickModal').style.display='flex';
  document.addEventListener('keydown', ccMktPickKey);
}
function ccMktPickClose(){
  const m=document.getElementById('mktPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccMktPickKey);
}
function ccMktPickKey(e){ if(e.key==='Escape') ccMktPickClose(); }
/* Спонсоры — по именам, не по архетипам. Отзыв: «делай и с
   логотипами чтоб… и сделай, чтоб каждый по-разному давал». Имена свои — те
   же узнаваемые аналоги, что DreamCup и баннеры стрима: чужую марку в проект
   не кладём (правило макдака). Лесенка по аудитории, и у каждого бренда своя
   щедрость: rate — множитель ставки, cap — его потолок за эфир. Девять. */
/* Отзыв вторым заходом: «а можешь настоящие названия?» —
   можешь. Имена настоящие, ids прежние (сейвы не трогаются), а вот логотипы
   НЕ их: чужой товарный знак не рисуем, на плашке — монограмма в фирменном
   цвете. Если бренд однажды напишет письмо — имена откатываются одной
   правкой этого блока и трёх словарных строк. */
/* ЛИНЕЙКА ШИРЕ (его слова 8.10: «мало спонсоров будто», «от 50к нет ни одного спонсора»). Было девять, и между 50 и
   120 тыс. — два. Теперь 23 настоящих бренда, которые спонсируют киберспорт (логотипы — photos/sp_*.png, у новых id =
   имя файла), ступенька каждые 1,2–1,5 раза по подписчикам. Пороги и потолки ставок — оценка режима, не данные. */
const CC_SPONSORS=[
  {id:'progrip',    need:5000,   cap:250,  rate:0.8,  c:'#00b8fc'}, // Logitech G
  {id:'steelseries',need:8000,   cap:300,  rate:0.9,  c:'#ff5200'},
  {id:'crankd',     need:10000,  cap:400,  rate:1.0,  c:'#e21836'}, // OMEN
  {id:'gfuel',      need:15000,  cap:450,  rate:1.0,  c:'#e4002b'},
  {id:'vyper',      need:25000,  cap:600,  rate:1.1,  c:'#44d62c'}, // Razer
  {id:'corsair',    need:35000,  cap:750,  rate:1.05, c:'#ffd400'},
  {id:'fiberx',     need:50000,  cap:900,  rate:1.0,  c:'#e60000'}, // Vodafone
  {id:'prime',      need:60000,  cap:1000, rate:1.1,  c:'#3b82f6'},
  {id:'thronelab',  need:80000,  cap:1200, rate:1.15, c:'#f04e23'}, // Secretlab
  {id:'kitkat',     need:100000, cap:1400, rate:1.1,  c:'#d6001c'},
  {id:'ggenergy',   need:120000, cap:1600, rate:1.25, c:'#95d600'}, // Monster Energy
  {id:'amd',        need:150000, cap:1900, rate:1.2,  c:'#000000'},
  {id:'alienware',  need:180000, cap:2000, rate:1.15, c:'#00a3e0'},
  {id:'dripwear',   need:200000, cap:2200, rate:1.2,  c:'#111111'}, // Nike
  {id:'lenovo',     need:220000, cap:2400, rate:1.2,  c:'#e2231a'}, // Lenovo Legion — 24-й, чтобы сетка брендов была ровной
  {id:'intel',      need:250000, cap:2700, rate:1.3,  c:'#0071c5'},
  {id:'samsung',    need:300000, cap:3000, rate:1.3,  c:'#1428a0'},
  {id:'redbolt',    need:350000, cap:3200, rate:1.4,  c:'#d5001c'}, // Red Bull
  {id:'nvidia',     need:400000, cap:3600, rate:1.4,  c:'#76b900'},
  {id:'dhl',        need:450000, cap:3800, rate:1.3,  c:'#ffcc00'},
  {id:'mastercard', need:500000, cap:4200, rate:1.45, c:'#eb001b'},
  {id:'kosmo',      need:600000, cap:4500, rate:1.5,  c:'#f40009'}, // Coca-Cola
  {id:'bmw',        need:750000, cap:5200, rate:1.5,  c:'#0066b1'},
  {id:'mercedes',   need:900000, cap:6000, rate:1.55, c:'#222222'}
];
/* Логотип — свой на каждого: монограмма с фирменным знаком, инлайн-SVG,
   потому что сайт — один файл и чужих картинок в нём нет. */
/* Настоящие логотипы (его выбор 8.10: «настоящие названия и логотипы» — для менеджера, и «в карьеру игрока добавь
   настоящих спонсоров»). Файлы — photos/sp_*.png из инфобоксов их статей в Википедии. HyperX своего логотипа там не
   имеет (статья ведёт на HP OMEN, HyperX — бренд HP), поэтому этот спонсор теперь OMEN. Без файла — монограмма, как было. */
const CC_SPONSOR_LOGO={progrip:'logitech', crankd:'hyperx', vyper:'razer', fiberx:'vodafone', thronelab:'secretlab',
  ggenergy:'monster', dripwear:'nike', redbolt:'redbull', kosmo:'cocacola'};
CC_SPONSORS.forEach(b=>{ if(!CC_SPONSOR_LOGO[b.id]) CC_SPONSOR_LOGO[b.id]=b.id; });
function ccBrandLogo(id, px){
  const f=CC_SPONSOR_LOGO[id];
  if(f){ const h=px||18; return '<span class="cc-sponsor-logo cc-sp-img" style="height:'+h+'px;width:'+Math.round(h*2.4)+'px;"><img src="'+PHOTO_DIR+'sp_'+f+'.png" alt="" loading="lazy"></span>'; }
  const s=CC_SPONSORS.find(x=>x.id===id);
  const c=(s&&s.c)||'#444';
  const size=px||18;
  // Монограммы, не их логотипы: буква бренда на его цвете.
  const T=(t,fs)=>'<text x="16" y="'+(t.length>1?21:22)+'" text-anchor="middle" '+
    'font-family="Arial Black,Arial" font-size="'+(fs||(t.length>1?12:16))+'" font-weight="900" fill="#fff">'+t+'</text>';
  const M={
    progrip:  T('L'),         // Logitech
    crankd:   T('HX'),        // HyperX
    vyper:    T('R'),         // Razer
    fiberx:   T('V'),         // Vodafone
    thronelab:T('S'),         // Secretlab
    ggenergy: T('M'),         // Monster Energy
    dripwear: T('N'),         // Nike
    redbolt:  T('RB'),        // Red Bull
    kosmo:    T('CC')         // Coca-Cola
  };
  // Не cc-brand: этот класс уже носит угловой бейдж «Fortnite Championship
  // Series» с position:absolute — логотипы улетали в правый верхний угол.
  return '<svg class="cc-sponsor-logo" width="'+size+'" height="'+size+'" viewBox="0 0 32 32" '+
    'style="vertical-align:-3px;margin-right:5px;"><rect width="32" height="32" rx="8" fill="'+c+'"/>'+
    (M[id]||'')+'</svg>';
}
function ccSponsorRate(s, reach){
  return Math.max(20, Math.min(s.cap,
    Math.round((reach||0)/1000*CC_AD_PER*(s.rate||1))));
}
/* НЕСКОЛЬКО СПОНСОРОВ (как в менеджере): слоты по подписчикам — 1 / 2 от 50 тыс. / 3 от 150 тыс. / 4 от 400 тыс. /
   5 от 800 тыс. Бренд подписывается сам из списка на «Клубе» или из письма; маркетолог больше не обязателен — без него
   ставка ×0.8, с ним ×его rate (он торгуется). Оценка режима. CAREER.sponsors = [{id, pay, since, paid}];
   старый одиночный CAREER.sponsor переезжает первым слотом. */
const CC_SP_NOMKT=0.8;
function ccSpSlots(){ const f=careerReach(); return f>=8e5 ? 5 : f>=4e5 ? 4 : f>=1.5e5 ? 3 : f>=5e4 ? 2 : 1; }
function ccSpNextSlotAt(){ const f=careerReach(); return [5e4,1.5e5,4e5,8e5].find(x=>x>f)||null; }
function ccSponsorsAll(){
  if(!CAREER) return [];
  if(!CAREER.sponsors){
    CAREER.sponsors=[];
    const s=CAREER.sponsor;
    if(s){ const LEGACY={drink:'fiberx', isp:'fiberx', gear:'progrip', brand:'kosmo'}; if(LEGACY[s.id]) s.id=LEGACY[s.id];
      const e=CC_SPONSORS.find(x=>x.id===s.id); if(e) CAREER.sponsors.push({id:e.id, pay:(s.pay!=null ? s.pay : ccSponsorRate(e, careerReach())), since:s.since, paid:s.paid||0}); }
  }
  CAREER.sponsors=CAREER.sponsors.filter(x=>CC_SPONSORS.some(b=>b.id===x.id));
  CAREER.sponsor=CAREER.sponsors[0]||null;
  return CAREER.sponsors;
}
function ccSponsor(){
  const s=ccSponsorsAll()[0]; if(!s) return null;
  const e=CC_SPONSORS.find(x=>x.id===s.id);
  return {id:e.id, need:e.need, cap:e.cap, pay:s.pay};
}
/* РЕКЛАМНЫЙ ПОСТ (его слово 8.10: «со спонсорами ещё, может, не только стримы — может, пост в соцсети или ещё что»).
   Каждый подписанный бренд раз в CC_SP_POST_DAYS дней ждёт пост: кнопка «📣 Пост» в окне спонсоров кладёт в ленту
   твой пост с брендом и #ad и платит CC_SP_POST_SHARE ставки за стрим. Числа — оценка режима, не замер. */
const CC_SP_POST_DAYS=7, CC_SP_POST_SHARE=0.6;
function ccSpPostPay(x){ return Math.max(10, Math.round((x.pay||0)*CC_SP_POST_SHARE)); }
/* 23.10, баг от игрока (Notion): «подпиши бренд, сделай пост, расторгни, подпиши снова — и так бесконечно». День поста
   жил только в записи контракта и пропадал вместе с ней. Теперь он ещё и в cr.spPost[бренд], который расторжение не трогает:
   один пост на бренд в CC_SP_POST_DAYS дней, сколько ни переподписывай. */
function ccSpPostDay(x){
  const m=CAREER && CAREER.career && CAREER.career.spPost, d=m && x && m[x.id];
  return [x && x.postDay, d].filter(Boolean).sort().slice(-1)[0] || null;
}
function ccSpPostWait(x){ const d=ccSpPostDay(x); if(!x || !d) return 0; return Math.max(0, CC_SP_POST_DAYS-ccDaysBetween(d, careerToday())); }
function ccSpPostsReady(){ return ccSponsorsAll().filter(x=>!ccSpPostWait(x)).length; }
function careerSponsorPost(id){
  const x=ccSponsorsAll().find(y=>y.id===id); if(!x || ccSpPostWait(x)) return;
  const T=L(), cr=CAREER.career, pay=ccSpPostPay(x), name=T['ccSponsor'+id]||id;
  const lines=T.ccSpPostTexts||I18N.en.ccSpPostTexts;
  const k=Math.abs(hashStr(id+'|'+careerToday()))%lines.length;
  careerNews('flat', null, null, {text:lines[k](name)+' #ad', sp:id});
  x.postDay=careerToday(); x.paid=(x.paid||0)+pay;
  cr.spPost=Object.assign({}, cr.spPost, {[id]:careerToday()});
  cr.balance=(cr.balance||0)+pay; cr.sponsored=(cr.sponsored||0)+pay;
  careerSave();
  try{ ccSpPickRefresh(); }catch(e){}
  try{ careerRenderHub(CH_TAB); }catch(e){}
}
function ccSponsorPayNow(b){ const mkt=ccMkt(); return Math.round(ccSponsorRate(b, careerReach())*(mkt ? (mkt.rate||1) : CC_SP_NOMKT)); }
// Лучший бренд, который сейчас подпишет: есть свободный слот — самый крупный открытый из неподписанных;
// слоты заняты — только если он платит заметно больше самого слабого (тогда заменит его).
function ccSponsorOffer(){
  const reach=careerReach(), all=ccSponsorsAll();
  const open=CC_SPONSORS.filter(b=>reach>=b.need && !all.some(x=>x.id===b.id));
  const best=open.slice(-1)[0]; if(!best) return null;
  const pay=ccSponsorPayNow(best);
  if(all.length>=ccSpSlots()){
    const weak=all.reduce((m,x)=>!m || x.pay<m.pay ? x : m, null);
    if(!weak || pay<weak.pay*CC_AD_STEP) return null;
    return {id:best.id, need:best.need, cap:best.cap, pay:pay, replaces:weak.id};
  }
  return {id:best.id, need:best.need, cap:best.cap, pay:pay};
}
/* A brand writes to you, because that is how this actually happens.

   The deal was a button on a tile that appeared when a number crossed a line -
   the mode announcing to itself that you were now worth something. Nobody has
   ever been sponsored by a tile. They write, they say what they want on the
   stream and what the slot pays, and it sits in the inbox with the clubs, which
   is where offers live. */
/* ---- The agent ----
   10% cut (real range is 10-20%), taken off money as it lands, as its own expense line; winnings on the board and
   log stay as won.
   Gives what playing can't: clubs look 3 points further down (CAREER_ORG_REACH + CC_AGENT_REACH, a 71 gets seen by
   clubs signing 80s) and offers are a fifth better.
   Signed and ended in the inbox like other deals; ending is free and immediate. */
const CC_AGENT_CUT=0.1, CC_AGENT_REACH=3, CC_AGENT_WAGE=1.2, CC_AGENT_FROM=68;
/* Сильный менеджер берёт не всех (его «1» 23.10 на «агент Kami и SwizzY не возьмёт игрока 70»): с рейтинга игрока
   на 10 ниже своего, но не ниже общего порога CC_AGENT_FROM. Менеджеры на 60–65 берут всех от 68. Слабому игроку
   остаются слабые менеджеры, и к сильному он дорастает. */
function ccAgentMinOvr(a){ return Math.max(CC_AGENT_FROM, ccStaffRating(a)-10); }
function ccAgentTakes(a, ovr){ return ovr>=ccAgentMinOvr(a); }
function careerAgent(){ return (CAREER && CAREER.agent) || null; }
/* The agent is a real person from the scene, not a generated name. Only the
   name, handle and flag are borrowed (public professional identity); the deal is
   this mode's own table (CC_AGENTS), no bio or opinions. One line per person.
   Picked per season, so the same agent all year. Empty list falls back to the
   generator. */
/* Agents are different deals: cut, reach and wage per person, and a weighted draw.
   All four come from one measure, the account's published follower count. Cuts stay
   in the scene's real 10-20% range; bigger accounts open more doors and charge more,
   so it's a trade, not an upgrade. The numbers are the mode's fiction, not quotes.
   weight is how often a career hears from them. */
/* Agents. All nine follower counts read off x.com in one sitting so they're comparable. X rounds above 10k, so Elyxx and Fifty carry the printed figure.
   No hand-written terms on any row. ccAgentTermsOf and ccAgentWeight still let written-in fields win if someone needs it.
   photo is a filename in PHOTO_DIR, falls back to the initials circle. */
const CC_AGENTS=[
  // Founder of JV Agency, Seixal. Manages Vanyak3k and Ajerss, both of whom are
  // on this roster, so he arrives inside a scene the mode already describes.
  {name:'João Venes',   at:'JoaovEU',       nat:'pt', photo:'JoaovEU.jpg',       x:2767},
  /* The rest of them, 18 August: only the ones with a face.

     It stood at sixteen with nine of them drawn as an initials circle, and half
     an inbox of monograms beside half an inbox of people reads as something
     broken. So the nine came out rather than being given a stand-in picture —
     Krish, Zenko, Loripasto76 and Michxsh, who were never more than a working
     name, and the Legacy Agency four and Coach Timmy, who have published handles
     and no portrait that was sent here. Any of them goes back in as one line the
     moment a photograph exists. */
  // Raphael Di Giuseppe, Global Partnerships at G2. X prints 16.3K and no more.
  {name:'G2 Elyxx',     at:'ElyxxM',        nat:null, photo:'ElyxxM.jpg',        x:16300},
  {name:'Arda A',       at:'alhasarda',     nat:null, photo:'alhasarda.jpg',     x:3115},
  // Head of Fortnite for Poyo Esports, Bordeaux.
  {name:'Poyo Naaxo',   at:'NaaxoMNG',      nat:null, photo:'NaaxoMNG.jpg',      x:749},
  // Fortnite manager for Lyost, agent of Belgian talent, Marseille.
  {name:'Lyost Pixelz', at:'PixelzMNG',     nat:null, photo:'PixelzMNG.jpg',     x:2430},
  // Fortnite manager for Lyost, agent of Belgian talent. The account name is
  // the handle until a profile with a name on it arrives.
  {name:'Kiinywz0',     at:'Kiinywz0',      nat:null, photo:'Kiinywz0.jpg',      x:841},
  // Talent manager for Questmind, agent of talents, Pau. Named the way his own
  // profile names him, without the club in front of it.
  {name:'Yeekzie',      at:'Yeekzie7',      nat:'fr', photo:'Yeekzie.jpg',       x:3088},
  /* Eight more, 20 August, off his own screenshots. Every number is the follower
     count the profile showed on the day it was saved, read the same way the nine
     above were — nothing here is hand-priced, so ccAgentWeight still does the
     arithmetic for the cut and for how far above a career the clubs look. */
  /* x.com/F0C8S, 4 584 фолловера, 1 октября. «Focus» — Head of Fortnite в CreedTalent
     (@CreedTalent), affiliated with @ParagonTweaks; «Representing top talent in gaming».
     Страны в профиле нет — nat пустой; значок у имени — бейдж аффилиации, не флаг.
     Имя — просто «Focus», без тега клуба (его слово 1.10). Над Lyost Clap по фолловерам. */
  {name:'Focus',        at:'F0C8S',         nat:null, photo:'F0C8S.jpg',         x:4584},
  // Partnership manager and agent at Lyost.
  {name:'Lyost Clap',   at:'ClapMNG',       nat:'rs', photo:'ClapMNG.jpg',       x:4100},
  // Talent agent at Proxy: EpikWhale, anonzr and Crylix are his.
  {name:'aCE',          at:'AlybiSaCE',     nat:null, photo:'AlybiSaCE.jpg',     x:3114},
  // Fortnite manager at Lyost.
  {name:'IdziU',        at:'IdziU97',       nat:'pl', photo:'IdziU97.jpg',       x:3110},
  // Esports talent agent, and the only one here whose own line is a management
  // service rather than a roster of names.
  /* x.com/roxogg, 2 989 фолловеров, 8 октября (его просьба «добавить менеджера»). «Roxo» — агент в @oneshotmidia, раньше
     @futesportsgg; ведёт phzinfps1, edsonmalado, 916gon, blxckoutz, nightftn, seeyun5, pardalflexlolo «& more» —
     бразильская сцена. Страны в профиле нет — nat пустой. По фолловерам — перед Th0masNL. */
  {name:'Roxo',         at:'roxogg',        nat:null, photo:'roxogg.jpg',        x:2989},
  {name:'Th0masNL',     at:'Th0masNL',      nat:'nl', photo:'Th0masNL.jpg',      x:2311},
  // Head of Fortnite for Lyost.
  {name:'Remss',        at:'RemssMNG',      nat:null, photo:'RemssMNG.jpg',      x:2085},
  // Fortnite-менеджер K13esport, ведёт Verif, wiver, pruzen10 и capri. Страны в профиле нет.
  {name:'K13 Wyze',     at:'wyzefn6',       nat:null, photo:'wyzefn6.jpg',       x:1893},
  // Founder of AL Management, Lille.
  {name:'Adam',         at:'DamlosMNG',     nat:'fr', photo:'DamlosMNG.jpg',     x:1654},
  // Head of Fortnite at MGA.
  {name:'MGA Alexi',    at:'ZedroxMNG',     nat:'fr', photo:'ZedroxMNG.jpg',     x:1376},
  // Head of Fortnite at GLORE.
  {name:'GLORE errie',  at:'errieMNG',      nat:'pl', photo:'errieMNG.jpg',      x:1184},
  // 21 August. Head of Fortnite for Cloud Esport, Carcassonne; Noaggs, Hazyache
  // and squadir23 are his.
  {name:'CLD Razia',    at:'Raziaa_',       nat:'fr', photo:'Raziaa_.jpg',       x:932},
  /* x.com/LC7_MNG, 910 фолловеров, 27 сентября. «Fortnite Manager for ??» —
     клуб в шапке буквально не назван, поэтому имя без тега; агент toryzenfv,
     maddingooo «and more». Страны в профиле нет — nat пустой. Над Artin: у
     новичков вне ручного порядка таблица идёт по фолловерам. */
  {name:'LC7',          at:'LC7_MNG',       nat:null, photo:'LC7_MNG.jpg',       x:910},
  /* x.com/ArtinMNG, 836 фолловеров. Основатель Beyond Agency, в шапке его
     игроки поимённо: Karmyzzz, 7Polish7, GlubFNBR, PligzFN, Trikshotz, Domler_fn.
     Страны в профиле нет — флаг 🇧🇪 в шапке стоит у клуба @rec_2027, а не у
     него, — поэтому nat пустой. Стоит над yaleblan: среди новичков вне ручного
     порядка (CC_SHOP_ORDER) таблица идёт по фолловерам. */
  {name:'Artin',        at:'ArtinMNG',      nat:null, photo:'ArtinMNG.jpg',      x:836},
  /* Ссылка и его число, 24 сентября: x.com/yaleblan, 749 фолловеров;
     портрет — аватарка оттуда же, круглым кропом на белом (в интерфейсе она
     всё равно режется в круг). Имя — хендл, как у Kiinywz0 выше, и по той же
     причине: профиля с именем сюда не приезжало, а выдумывать его нельзя. */
  {name:'X6 Yaleblan',  at:'yaleblan',      nat:null, photo:'yaleblan.jpg',      x:749},
  /* Ссылка и его число, 25 сентября: x.com/DrazoxMNG, 681 фолловер, то
     есть он встаёт последним — список отсортирован по ним, и ccRankPull
     ранжирует менеджеров по месту в нём. Тег организации перед именем — как у
     GLORE errie и CLD Razia выше; FLC — бельгийский клан. Страны в профиле
     нет, поэтому nat пустой, как у yaleblan. Портрет — аватарка оттуда же. */
  {name:'Drazox',       at:'DrazoxMNG',     nat:null, photo:'DrazoxMNG.jpg',     x:681},
  /* x.com/Apolinmng2, 601 фолловер, 27 сентября. «Management at ✧» — клуб в
     шапке не назван, поэтому имя без тега; агент crunkezz, jayzfnn «& more».
     Страны в профиле нет — nat пустой. Между Drazox и Vira Askey: у новичков
     вне ручного порядка таблица идёт по фолловерам. */
  // Тег — @apolinmng: так он сам попросил 29.09 («for the @, you can just use apolinmng»).
  {name:'Apolin',       at:'apolinmng',     nat:null, photo:'Apolinmng2.jpg',    x:601},
  /* x.com/loicmng_, 565 фолловеров, 23 октября (сам попросил в ЛС, страница Notion 22–23.10). «Loïcmng» —
     Head of Fortnite в @NafeOfficiel, менеджер Galaxyache, Gabusg67, 7destroyy, Rezpaaaan, FnKeran «& more».
     Флаг 🇫🇷 в шапке. Между Apolin и BS Skyforce по фолловерам. */
  {name:'Loïcmng',      at:'loicmng_',      nat:'fr', photo:'loicmng_.jpg',      x:565},
  /* x.com/Skyforcemng272, 463 фолловера, 29 сентября. «BS Skyforce» — Head of Fortnite
     в Team Blindspot (@_Team_BS), агент joyyfnrr, NATEKFN1, Karotek_ «& more», staff
     @REC_2027. Страны в профиле нет — nat пустой. Между Apolin и FA ZERKO по фолловерам. */
  {name:'BS Skyforce',  at:'Skyforcemng272', nat:null, photo:'Skyforcemng272.jpg', x:463},
  /* x.com/Zerkomng, 461 фолловер, 27 сентября. Имя — как в профиле, «FA
     ZERKO»; «Head of Fortnite for @?» — клуб не назван. Агент insaneebtw,
     cuhkifn, eonshh «& more». В шапке два флага, 🇫🇷🇵🇹, — берётся первый. */
  {name:'FA ZERKO',     at:'Zerkomng',      nat:'fr', photo:'Zerkomng.jpg',      x:461},
  /* x.com/Lou1sMNG, 385 фолловеров. D.E в RG22 (@RG22ESP), игроки Timur11x и Worizome180.
     Флаги 🇫🇷🇧🇪, берётся первый. */
  {name:'RG22 Lou1s',   at:'Lou1sMNG',      nat:'fr', photo:'Lou1sMNG.jpg',      x:385},
  /* x.com/ZeyroxMNG1, 380 фолловеров. «ancien manager & ceo esport», клиенты не названы, поэтому рейтинг 60.
     Флаги 🇮🇹🇫🇷, берётся первый. */
  {name:'ZEY',          at:'ZeyroxMNG1',    nat:'it', photo:'ZeyroxMNG1.jpg',    x:380},
  /* Скриншот профиля: x.com/askebott — Vira Askey, Марокко,
     Head of Fortnite в Vira Esport, 252 фолловера. Агент семерых, и все семеро
     названы у него в шапке поимённо (zbidak3kk, CyranKids, Litr07, 2Kixu,
     kylxz8, ROITFN, phrygienfnbr) — то же, чем João выше заслужил первую
     строку: человек приезжает внутрь сцены, которую мод уже описывает. */
  {name:'Askey',        at:'askebott',      nat:'ma', photo:'askebott.jpg',      x:252}
];
// The fallback, for a row added before anybody has read its account: fifteen per
// cent, which is the middle of the real range, and one draw like everybody else.
// Nothing on the list is on it today — every row above carries a count.
const CC_AGENT_PLAIN={cut:0.15, reach:2, wage:1.10, weight:1};
const CC_AGENT_X_FLOOR=500, CC_AGENT_X_TOP=25000;
// Where an account sits between the floor and the ceiling, 0 to 1, log-spaced.
function ccAgentPull(x){
  if(!(x>0)) return null;
  const lo=Math.log(CC_AGENT_X_FLOOR), hi=Math.log(CC_AGENT_X_TOP);
  return clamp((Math.log(x)-lo)/(hi-lo), 0, 1);
}
// The three terms an account buys. A written-in term always wins: see the note.
function ccAgentTermsOf(a){
  const k=ccRankPull(CC_AGENTS, a);
  const base = k==null ? CC_AGENT_PLAIN : {
    cut:  Math.round((0.12+k*0.06)*100)/100,
    reach: 2+Math.round(k*3),
    wage: Math.round((1.10+k*0.20)*100)/100
  };
  return {cut:  a && a.cut!=null  ? a.cut  : base.cut,
          reach:a && a.reach!=null? a.reach: base.reach,
          wage: a && a.wage!=null ? a.wage : base.wage};
}
/* How often a career hears from somebody at all, which is the other half of
   what an account is worth.

   The terms were taken off the follower count on 18 August and this was not: it
   stayed at one apiece with a hand-written three on João, so a 3,000-follower
   manager wrote as often as one nobody has read. His ask, 19 August — the size
   of the account is what makes a manager a catch, so it decides both halves.
   Same curve the terms are on, so the two cannot drift apart: an unread account
   is the ordinary one draw, the biggest is five, and a written-in weight still
   wins where one exists, the same as a written-in term does. */
function ccAgentWeight(a){
  if(a && a.weight!=null) return a.weight;
  const k=ccRankPull(CC_AGENTS, a);
  return k==null ? CC_AGENT_PLAIN.weight
                 : Math.round((1+k*4)*10)/10;
}
// The deal a career is actually on, which is the signed one. An agent signed
// before the terms were his own keeps the mode's old numbers rather than being
// quietly moved onto somebody else's.
/* Менеджер, которого попросили обойти клубы.

   Правка: «дать возможность не только читать от менеджера
   орги, но и самому попросить менеджера написать организатору, чтоб подписали
   игрока». До этого менеджер был односторонним: он приносил, ты читал.

   Просьба стоит две недели и делает ровно то, за что менеджеру и платят —
   расширяет круг клубов, которые вообще смотрят (CAREER_ORG_REACH + reach в
   careerOrgOffers). Не гарантия контракта: клуб всё равно решает сам, и выше
   потолка своей полосы игрок не прыгнет. Пока просьба в работе, кнопки нет —
   иначе это была бы кнопка «дай контракт», нажимаемая каждый день. */
/* 60, не 14: просьба должна дожить до ПЕРВОГО окна предложений. Между Solo Series в январе и
   первым дивизионным кубком (2 февраля) проходит больше двух недель, и просьба
   истекала за день до того, как клуб мог написать (скриншот: «expect their offer this
   window» — и три клуба без Shimo). Просьба закрывается, когда клуб сел в окно (pitch.done),
   а 60 дней — только потолок на случай, когда окон нет вовсе. */
const CC_PITCH_DAYS=60, CC_PITCH_REACH=3;
function careerPitchOn(){
  const p=CAREER && CAREER.pitch;
  return !!(p && p.until && !p.done && careerToday() <= p.until);
}
function careerPitchClub(){
  return careerPitchOn() ? (CAREER.pitch.club||null) : null;
}
function careerPitchReach(){ return careerPitchOn() ? CC_PITCH_REACH : 0; }
/* До какого дня «идут переговоры» на плитке: до ближайшей сессии кубка дивизиона — окно
   предложений открывается после неё (см. runCareerCup → careerOrgOffers). Потолок просьбы
   (pitch.until, 60 дней) показывается только там, где кубков впереди нет. */
function careerPitchDue(){
  const p=CAREER && CAREER.pitch; if(!p) return null;
  const today=careerToday();
  let due=null;
  (typeof ccCupWeeks==='function' ? ccCupWeeks() : []).forEach(w=>{
    [w[1], w[2]].forEach(d=>{ if(d && d>=today && d<=p.until && (!due || d<due)) due=d; });
  });
  // Письмо приходит, когда день уже сдвинут за сессию — назавтра после неё.
  return due ? ccAddDays(due, 1) : p.until;
}
/* Кому написать — выбирает игрок.

   Правка поверх первой версии: «именно спросить, клуб который
   хочет игрок, например Спирит, чтоб выбор был». Просьба «обойди клубы» была
   про всех сразу и ничем не отличалась от ожидания; адресная — это решение.

   Список — те, до кого менеджер вообще может дотянуться: разрыв уровня клуба и
   рейтинга игрока в пределах общего охвата плюс то, что добавляет сама просьба
   (CC_PITCH_REACH). Клуб, в котором игрок уже стоит, из списка выпадает. */
/* Список — ВСЕ клубы сцены, кроме своего. Отзыв: «где игрок
   просит менеджера найти организацию, чтоб там все были». Раньше список резался
   охватом менеджера и шестью строками — и клубов, о которых игрок знает, в нём
   не было. Дотянется ли менеджер — по-прежнему решает сама просьба
   (careerAgentPitch: разрыв уровня и рейтинга против охвата); список только
   показывает выбор и честно пишет разрыв под каждым клубом. */
function careerPitchClubs(){
  const pl=CAREER && CAREER.player;
  if(!pl) return [];
  const mine=(CAREER.org && CAREER.org.name)||null;
  return careerOrgPool()
    .filter(o=>o.name!==mine)
    .sort((a,b)=>b.tier-a.tier);
}
/* Та же просьба, но нажатая с плитки менеджера.

   Диалог для неё заводится сам (ccAgentThreadOf), потому что просьба обязана
   лечь именно в переписку с ним — отзыв: «это сообщение автоматически
   пишется в лс менеджеру». Клуб по-прежнему выбирает игрок: список открывает
   тот же ccClubPickOpen, что и в самом диалоге. */
function careerPitchAsk(){
  const on=careerAgent();
  if(!on || careerPitchOn()) return;
  const t=ccAgentThreadOf(on.name, true);
  if(!t) return;
  careerSave();
  ccClubPickOpen(t.id);
}
function careerAgentPitch(id, club){
  if(!careerAgent() || careerPitchOn() || !club) return;
  const t=careerDms().find(x=>x.id===id);
  const o=careerOrgPool().find(x=>x.name===club);
  if(!o) return;
  CAREER.pitch={club:o.name, since:careerToday(), until:ccAddDays(careerToday(), CC_PITCH_DAYS)};
  if(t){
    careerDmPush(t, 'you', 'dmPitchAskClub', [o.name]);
    careerDmPush(t, 'them', 'dmPitchOkClub', [o.name]);
  }
  /* Ответ клуба — сразу, а не «когда-нибудь». Разрыв решает: в пределах охвата
     менеджера клуб готов посмотреть (и его предложение принудительно попадает
     в это окно, см. careerOrgOffers), выше — вежливый отказ, и просьба
     закрывается, чтобы можно было написать другому. */
  const gap=o.tier-CAREER.player.ovr;
  const ok=gap<=CAREER_ORG_REACH+careerAgentTerms().reach+CC_PITCH_REACH*0.5;
  /* Сначала — что он съездил и поговорил, и только потом чем кончилось.
     Правка: «что переговоры провёл». Без этой строки клуб
     отвечал будто сам по себе, и работа менеджера не была видна вовсе. */
  if(t){ careerDmPush(t, 'them', 'dmPitchTalked', [o.name]);
         careerDmPush(t, 'them', ok ? 'dmPitchYes' : 'dmPitchNo', [o.name]); }
  /* Клуб готов, но игрок ещё не показал результат (правило 2.10, ccOrgProven: два вечера в топ-10) — менеджер говорит
     это прямо, просьба остаётся в силе (9.10: ответ был «жди предложение», а оно молча не приходило). */
  if(ok && t && !ccOrgProven()){
    const have=(CAREER.career.log||[]).filter(ccOrgResult).length;
    careerDmPush(t, 'them', 'dmPitchProve', [o.name, Math.max(1, CC_ORG_PROOF-have)]);
  }
  if(!ok) CAREER.pitch=null;
  careerSave();
  careerRenderHub('social');
}
function careerAgentTerms(){
  const on=careerAgent();
  if(!on) return {cut:0, reach:0, wage:1};
  // Agreed terms are stored on the deal, so a career signed under an old list
  // keeps what it signed. Anything missing is read off the account.
  const of=ccAgentTermsOf(CC_AGENTS.find(a=>a.name===on.name) || on);
  return {cut: on.cut!=null ? on.cut : of.cut,
          reach: on.reach!=null ? on.reach : of.reach,
          wage: on.wage!=null ? on.wage : of.wage};
}
/* Who somebody is, as opposed to what they agreed to.

   The deal belongs to the contract — a cut signed last season stays signed —
   but the face and the handle belong to the person, and looking them up on the
   save meant a career that signed before a photo existed never got one. His
   report, 18 August: the tile still showed the initials. So presentation is read
   off the roster by name every time it is drawn, and only the terms are read off
   what was signed. Anybody not on the list any more keeps whatever the save has. */
function ccAgentCard(name){
  return CC_AGENTS.find(a=>a.name===name) || null;
}
function ccAgentFace(on){
  const card=on ? ccAgentCard(on.name) : null;
  return {photo:(card && card.photo) || (on && on.photo) || null,
          at:(card && card.at) || (on && on.at) || null};
}
function ccAgentPick(){
  const rnd=careerRng(ccHashStr('agent|'+(CAREER.career.season||1)));
  if(!CC_AGENTS.length)
    return {name:careerLadderPlayer(rnd, 60, new Set()).handle, at:null, nat:null};
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const pool=CC_AGENTS.filter(a=>ccAgentTakes(a, ovr)), list=pool.length ? pool : CC_AGENTS;
  const total=list.reduce((s,a)=>s+ccAgentWeight(a), 0);
  let n=rnd()*total;
  for(const a of list){ n-=ccAgentWeight(a); if(n<0) return a; }
  return list[0];
}
function careerAgentDm(){
  if(careerAgent()) return null;
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  // Nobody represents a career nobody is looking at. The line is the one the
  // clubs already use for looking at all — see careerOrgOffers.
  if(ovr<CC_AGENT_FROM) return null;
  const have=careerDms().find(t=>t.who && t.who.agent);
  if(have) return have;
  const who=ccAgentPick();
  // org:true keeps the thread in the clubs pile, where the business is; the
  // agent flag is what stops it being drawn as a club. See the inbox row.
  const t=careerDmThread({handle:who.name, at:who.at||null, nat:who.nat||null,
                          photo:who.photo||null,
                          ovr:null, role:'roleIGL', roster:false,
                          org:true, agent:true});
  t.state='agent';
  /* His own terms, in his own opening line: two agents no longer say the same
     sentence, and the one worth signing says a better number in it.

     Off the account, like everything else about him. This read ccAgentTerms,
     which was the written-in term or the ordinary deal and never looked at the
     follower count — so every manager but João opened with 15% and +2 whoever
     he was, while the list beside the message and the contract he actually
     signed were both priced off his account. The same man quoted two different
     deals depending on which screen you read him on. */
  const terms=ccAgentTermsOf(who);
  t.who.cut=terms.cut; t.who.reach=terms.reach; t.who.wage=terms.wage;
  careerDmPush(t, 'them', 'dmAgent', [Math.round(terms.cut*100), terms.reach]);
  careerSave();
  return t;
}
/* Диалог КОНКРЕТНОГО менеджера — по имени, а не «любого со значком».

   Правка: «я взял его... но пишет он, пусть пишет мой
   менеджер». Подпись искала тред первым попавшимся `find(x=>x.who.agent)`, и
   «с этого дня разговариваю с клубами я» уходило в диалог того, кто просто
   написал раньше. А если взятый менеджер в почту не писал вовсе (его выбрали
   из списка), треда у него не было — и согласие ложилось в чужой навсегда.

   Поэтому: находим по имени, а нет — заводим. Диалог с тем, кто на тебя
   работает, существовать обязан: в нём стоят и просьба найти клуб, и разрыв. */
function ccAgentThreadOf(name, make){
  if(!name) return null;
  const have=careerDms().find(x=>x.who && x.who.agent && hKey(x.who.handle)===hKey(name));
  if(have || !make) return have || null;
  const a=CC_AGENTS.find(x=>x.name===name) || {name:name};
  const t=careerDmThread({handle:a.name, at:a.at||null, nat:a.nat||null,
                          photo:a.photo||null,
                          ovr:null, role:'roleIGL', roster:false,
                          org:true, agent:true});
  const terms=ccAgentTermsOf(a);
  t.who.cut=terms.cut; t.who.reach=terms.reach; t.who.wage=terms.wage;
  return t;
}
/* И чужие письма закрываются, когда своё подписано.

   «Пусть не пишут, когда есть менеджер» — отзыв. Новых писем не будет
   (careerAgentDm выходит на careerAgent), но уже лежащее предложение так и
   висело с кнопкой «подписать», а под ним рисовались действия ТВОЕГО
   менеджера — чужой диалог предлагал разорвать контракт с другим человеком. */
function ccAgentOthersOff(name){
  careerDms().forEach(function(t){
    if(!t.who || !t.who.agent) return;
    if(hKey(t.who.handle)===hKey(name)) return;
    if(t.state==='agent') t.state='agentPast';
  });
}
function careerSignAgent(name){
  const cr=CAREER.career;
  if(careerAgent()) return false;
  const who=CC_AGENTS.find(a=>a.name===name);
  if(!who) return false;
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  // Nobody represents a career nobody is looking at — the same line the letter
  // is gated on, see careerAgentDm. И свой порог у каждого: ccAgentMinOvr.
  if(ovr<CC_AGENT_FROM || !ccAgentTakes(who, ovr)) return false;
  const terms=ccAgentTermsOf(who);
  CAREER.agent={name:who.name, at:who.at||null, photo:who.photo||null,
                cut:terms.cut, reach:terms.reach, wage:terms.wage,
                since:careerToday()};
  // Whatever he was going to say in the inbox, he has said it in person now —
  // и говорит это ОН, в своём диалоге. См. ccAgentThreadOf.
  const t=ccAgentThreadOf(who.name, true);
  if(t){ t.state='agentOn'; careerDmPush(t, 'them', 'dmAgentYes'); }
  ccAgentOthersOff(who.name);
  ccAgentPickClose();
  careerSave();
  careerRenderHub();
  return true;
}
/* All of them behind a press, priced per person: the cut they take, how much
   further clubs look, and what that does to an offer. */
function ccAgentPickOpen(){
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const on=careerAgent();
  const rows=ccByHand(CC_AGENTS).map(a=>{
    const t=ccAgentTermsOf(a);
    const cut=t.cut, reach=t.reach, wage=t.wage;
    const mine=on && on.name===a.name;
    const need=ccAgentMinOvr(a), can=!on && ovr>=CC_AGENT_FROM && ovr>=need;
    return `<div class="cc-buy${mine?' own':''}">
      ${a.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(a.photo)}" alt=""
           loading="lazy" onerror="this.remove()">` : ''}
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(a.name)}</span> ${ccStaffBadge(ccStaffRating(a)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${a.x ? '👥 '+ccFollowers(a.x)+' · ' : ''}${a.at ? '@'+esc(a.at) : ''}</i>
        <span class="cc-buy-chips"><em>${L().ccAgentCutRow} ${Math.round(cut*100)}%</em><em class="up">${L().ccAgentReachRow} +${reach}</em><em class="up">${L().ccAgentWageRow} +${Math.round((wage-1)*100)}%</em></span></div>
      ${mine ? `<span class="cc-owned">${L().ccAgentYours}</span>`
             : `<button class="ch-sign"${can?'':' disabled'} onclick="careerSignAgent('${
                 jsq(a.name)}')">${!on && ovr<need && need>CC_AGENT_FROM ? esc(L().ccAgentNeed(need)) : L().ccAgentSign}</button>`}
    </div>`;
  }).join('');
  document.getElementById('agentPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccAgentTag}</h4>
     <div class="ch-hint">${ovr<CC_AGENT_FROM ? L().ccAgentFrom(CC_AGENT_FROM) : L().ccAgentPickHint}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('agentPickModal').style.display='flex';
  document.addEventListener('keydown', ccAgentPickKey);
}
/* Меню «кому написать». Строки — те клубы, до кого менеджер дотягивается
   (careerPitchClubs): герб, название, уровень и разрыв с твоим рейтингом.
   Нажал — он пошёл говорить.

   Правка: «а менеджера как попросить, чтоб оргу нашёл — добавь
   в менюшке, типа какую игрок хочет». Раньше клубы стояли шестью узкими
   фишками в подвале переписки: на телефоне это ряд обрезанных названий, и что
   это вообще выбор — не читалось.

   Открывается из переписки с менеджером и оттуда же берёт id ветки: ответ
   клуба приходит в тот же разговор, а не отдельным уведомлением. */
function ccClubPickOpen(id){
  if(!careerAgent() || careerPitchOn()) return;
  const pl=CAREER && CAREER.player;
  const q=s=>jsq(s);
  const rows=careerPitchClubs().map(o=>`<div class="cc-buy">
      <div class="cc-buy-in"><b>${clubLogoHTML(o.name, true)}${esc(o.name)}</b>
        <span>${L().ccPitchTier(o.tier)}${
          pl ? ' · '+L().ccPitchGap(Math.max(0, Math.round(o.tier-pl.ovr))) : ''} · 👥 ${ccOrgFolText(ccOrgFollowers(o.name, o.tier))}</span></div>
      <button class="ch-sign" onclick="ccClubPickAsk('${q(id)}','${q(o.name)}')">${
        L().ccPitchAskBtn}</button>
    </div>`).join('');
  document.getElementById('clubPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccPitchPickTitle}</h4>
     <div class="ch-hint">${L().ccPitchPickHint}</div>
     <div class="cc-buys">${rows || '<div class="ch-hint">'+L().ccPitchNone+'</div>'}</div>`;
  document.getElementById('clubPickModal').style.display='flex';
  document.addEventListener('keydown', ccClubPickKey);
}
function ccClubPickAsk(id, club){
  ccClubPickClose();
  careerAgentPitch(id, club);
  // Ответ клуба лежит в переписке — туда и возвращаемся.
  careerTab('social');
  careerDmOpen(id);
}
function ccClubPickClose(){
  const m=document.getElementById('clubPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccClubPickKey);
}
function ccClubPickKey(e){ if(e.key==='Escape') ccClubPickClose(); }
function ccAgentPickClose(){
  const m=document.getElementById('agentPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccAgentPickKey);
}
function ccAgentPickKey(e){ if(e.key==='Escape') ccAgentPickClose(); }
function careerSignAgentFromDm(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.who || !t.who.agent || careerAgent()) return;
  // The deal is stored with the man, so changing the table later cannot rewrite
  // a contract somebody already signed. The thread carries the three numbers he
  // opened with, so this reads them back rather than pricing him again.
  const terms=ccAgentTermsOf(t.who);
  CAREER.agent={name:t.who.handle, at:t.who.at||null, photo:t.who.photo||null,
                cut:terms.cut, reach:terms.reach, wage:terms.wage,
                since:careerToday()};
  t.state='agentOn';
  careerDmPush(t, 'them', 'dmAgentYes');
  // Остальные письма менеджеров закрываются: работает один. См. ccAgentOthersOff.
  ccAgentOthersOff(t.who.handle);
  careerSave();
  careerRenderHub('social');
}
function careerEndAgentFromDm(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !careerAgent()) return;
  CAREER.agent=null;
  t.state='agentOff';
  careerDmPush(t, 'you', 'dmAgentEnd');
  careerSave();
  careerRenderHub('social');
}
// The same ending, pressed from the tile on the centre instead of from inside
// the conversation — the line still lands in the thread, because that is where
// it was said.
function careerEndAgent(){
  const t=careerDms().find(x=>x.who && x.who.agent);
  if(t) return careerEndAgentFromDm(t.id);
  CAREER.agent=null;
  careerSave();
  careerRenderHub();
}
// What lands in the hand, and what the agent takes out of it on the way. The
// winnings are untouched: a board of prize money is a board of prize money.
function ccPayIn(mine, now){
  const cr=CAREER.career;
  if(!(mine>0)) return 0;
  cr.earnings=(cr.earnings||0)+mine;
  /* The club's share of what was won, which used to be the manager's.

     His correction, 19 August. A manager is paid out of the wage he negotiated —
     see careerPayWages, where his cut still is — and the club is paid out of the
     board, which is what a contract actually says. */
  const cut=Math.round(mine*careerOrgCut());
  if(cut){
    cr.orgCut=(cr.orgCut||0)+cut;
  }
  /* ВЫПЛАТА НЕ СРАЗУ (16.10, его «4»: «задержка призовых»). Epic платит призовые через несколько недель после турнира —
     до этого они «ожидаются»: видны под балансом, на баланс приходят в день выплаты (careerPayTick), с письмом.
     В игре вдвоём — сразу: там балансы сверяются между браузерами (ccMpOn). Заработок (earnings) пишется сразу. */
  if(!now && !(typeof ccMpOn==='function' && ccMpOn())){
    cr.payQ=(cr.payQ||[]).concat([{amt:mine-cut, day:careerToday(), due:ccAddDays(careerToday(), CC_PAY_DELAY)}]);
    return mine-cut;
  }
  cr.balance=(cr.balance||0)+(mine-cut);
  return mine-cut;
}
const CC_PAY_DELAY=30;
/* Когда придут призовые (17.10, его вопрос «где посмотреть, когда призовые придут?»): под балансом — сумма
   и ближайшая дата, по нажатию — весь список выплат с датами. */
let CC_PAY_OPEN=false;
function ccPayPendHTML(){
  const q=((CAREER.career.payQ)||[]).slice().sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0);
  if(!q.length) return '';
  const rows=CC_PAY_OPEN ? '<span class="ch-pend-list">'+q.map(x=>'<span>'+ccMoney(x.amt)+' — '+esc(ccDayLabel(x.due))+'</span>').join('')+'</span>' : '';
  return '<small class="ch-pend" role="button" tabindex="0" onclick="CC_PAY_OPEN=!CC_PAY_OPEN;careerRenderHub()" title="'+esc(L().ccPayPendAll)+'">+'+
    ccMoney(ccPayPending())+' · '+esc(ccDayLabel(q[0].due))+(q.length>1 ? ' ▾' : '')+rows+'</small>';
}
function ccPayPending(){ const q=(CAREER && CAREER.career && CAREER.career.payQ)||[]; return q.reduce((a,x)=>a+(x.amt||0), 0); }
const CC_PAY_WHO={handle:'Epic Payouts', verified:true, roster:false, staff:'pay'};
function careerPayTick(){
  const cr=CAREER && CAREER.career; if(!cr || !(cr.payQ||[]).length) return 0;
  const today=careerToday(), due=cr.payQ.filter(x=>x.due<=today);
  if(!due.length) return 0;
  const sum=due.reduce((a,x)=>a+(x.amt||0), 0);
  cr.payQ=cr.payQ.filter(x=>x.due>today);
  cr.balance=(cr.balance||0)+sum;
  try{ careerDmPush(ccStaffThread(CC_PAY_WHO), 'them', 'ccDmPayout', [ccNum(sum), due.length]); }catch(e){}
  return sum;
}
/* ХОТФИКС ПОСРЕДИ СЕЗОНА (16.10, его «1»). Раз в 4+ недели, не раньше двух недель от начала сезона и не больше двух
   за сезон: Epic выключает в соревновательном одно оружие — до конца сезона его нет ни в сундуках, ни в наборах
   (ccLootPool). Последний автомат и последний дробовик не трогаются. Пост от аккаунта сцены, реакция — как на мету. */
const CC_HOTFIX_GAP=28, CC_HOTFIX_ODDS=0.08;
function careerHotfixTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const m=cr.meta, today=careerToday();
  if(!m || !m.from || ccDaysBetween(m.from, today)<14) return;
  const h=(cr.hotfix && cr.hotfix.sid===m.id) ? cr.hotfix : null;
  if(h && (h.n>=2 || ccDaysBetween(h.day, today)<CC_HOTFIX_GAP)) return;
  const rnd=careerRng(ccHashStr('hotfix|'+today+'|'+m.id));
  if(rnd()>CC_HOTFIX_ODDS) return;
  const k=ccLootSet(), pool=(CC_LOOT_BY_SET[k]||{}).weapons||[];
  const out=new Set((h && h.vault)||[]);
  const names=[...new Set(pool.map(w=>w.name))].filter(n=>!out.has(n));
  const cand=names.filter(n=>{ const ic=(pool.find(w=>w.name===n)||{}).icon;
    return pool.some(w=>w.icon===ic && w.name!==n && !out.has(w.name)); });
  if(!cand.length) return;
  const pick=cand[Math.floor(rnd()*cand.length)];
  cr.hotfix={sid:m.id, set:k, vault:[...out, pick], n:((h && h.n)||0)+1, day:today};
  careerNews('flat', 'ccNewsHotfix', [pick, Math.floor(rnd()*3)]);
}
/* ПРОБЛЕМЫ СО СВЯЗЬЮ (16.10, его «2»). В день онлайн-турнира с шансом CC_TECH_ODDS «интернет лагает с утра» — минус
   CC_TECH_PEN к форме на этот день (careerForm), видно в шапке и постом. На ЛАНе (gc) не бывает. Бросок посеян днём:
   перезагрузка не перебросит. После крупного вечера сцена иногда пишет о перехосте игры или дисквалификации команды
   за тиминг (ccTechSceneAfterNight) — новости, без чисел. */
const CC_TECH_ODDS=0.05, CC_TECH_PEN=0.6;
function ccTechToday(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  if(typeof ccMpOn==='function' && ccMpOn()) return null;
  const today=careerToday();
  if(cr.tech && cr.tech.day===today) return cr.tech.kind ? cr.tech : null;
  let on=[]; try{ on=(careerYearDays().get(today)||[]).filter(e=>e && e.kind!=='gc'); }catch(e){}
  const hit=on.length>0 && careerRng(ccHashStr('tech|'+today+'|'+(cr.season||1)))()<CC_TECH_ODDS;
  cr.tech={day:today, kind:hit ? 'net' : null};
  if(hit) careerNews('bad', 'ccPostTechNet', [ccHashStr(today)%3]);
  return hit ? cr.tech : null;
}
function ccTechPen(){ try{ return ccTechToday() ? CC_TECH_PEN : 0; }catch(e){ return 0; } }
function ccTechSceneAfterNight(total){
  const cr=CAREER && CAREER.career; if(!cr || !(total>=30)) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const today=careerToday();
  let big=false; try{ big=(careerYearDays().get(today)||[]).some(e=>e && (e.kind==='major' || e.kind==='gc' || e.kind==='final')); }catch(e){}
  if(!big) return;
  const rnd=careerRng(ccHashStr('techscene|'+today));
  const r=rnd();
  if(r<0.12) careerNews('flat', 'ccNewsRehost', [2+Math.floor(rnd()*4)]);
  else if(r<0.18){
    let duos=[]; try{ duos=(careerPools().duos||[]).filter(d=>d && d.cards && d.cards.length>=2); }catch(e){}
    if(duos.length>20){ const d=duos[10+Math.floor(rnd()*(duos.length-10))];
      careerNews('flat', 'ccNewsTeamingDq', [ccHandle(d.cards[0].handle), ccHandle(d.cards[1].handle)]); }
  }
}
function careerSponsorDm(){
  const offer=ccSponsorOffer();
  if(!offer) return null;
  /* Found by which brand it is, not by what the brand is called today.

     His screenshot, 17 August: "Провайдер" and "Internet provider" sitting in
     the club list as two different companies, and the same again for the
     peripheral brand. A thread is found by its handle and the handle was the
     translated name, so a career that switched language stopped recognising the
     brand it had already heard from and a second one wrote in. The name is
     display, and display is decided when the screen is drawn - the rule the rest
     of this file already follows for every sentence in the inbox. */
  const name=L()['ccSponsor'+offer.id];
  const t=careerDms().find(x=>x.who && x.who.brand===offer.id)
       || careerDmFind(name)
       || careerDmThread({handle:name, ovr:null, role:'roleIGL',
                          roster:false, org:true, brand:offer.id});
  // An older thread carries brand:true and its name in whichever language it
  // arrived in. Give it the id, so it is never mistaken for a second company.
  t.who.brand=offer.id;
  // The same brand can come back with a better rate, which is the point of the
  // rate moving at all - so it is the terms that decide whether this is news.
  // Тот же бренд пишет снова, только если ставка выросла заметно (CC_AD_STEP), а не на каждый новый подписчик.
  if(t.sponsor && t.sponsor.id===offer.id && offer.pay<t.sponsor.pay*CC_AD_STEP) return t;
  if(t.state==='signed' && ccSponsorsAll().some(x=>x.id===offer.id)) return t;
  t.sponsor={id:offer.id, pay:offer.pay};
  t.state='sponsor';
  careerDmPush(t, 'them', 'dmSponsor', [name, ccNum(offer.pay)]);
  careerSave();
  return t;
}
function careerSignSponsorFromDm(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.sponsor) return;
  if(!careerSignSponsor(t.sponsor.id)) return;
  t.state='signed';
  careerDmPush(t, 'them', 'dmSponsorYes');
  t.sponsor=null;
  careerSave();
  careerRenderHub('social');
}
function careerSignSponsor(id){
  const s=CC_SPONSORS.find(x=>x.id===id); if(!s) return false;
  if(careerReach()<s.need) return false;
  const all=ccSponsorsAll(); if(all.some(x=>x.id===id)) return false;
  if(all.length>=ccSpSlots()){
    const offer=ccSponsorOffer();
    if(!offer || offer.id!==id || !offer.replaces) return false;
    CAREER.sponsors=all.filter(x=>x.id!==offer.replaces);
  }
  const pay=ccSponsorPayNow(s);
  CAREER.sponsors.push({id:s.id, pay:pay, since:careerToday(), paid:0});
  ccSponsorsAll();
  careerNews('good', 'ccNewsSponsor', [L()['ccSponsor'+s.id], ccNum(pay)]);
  careerEvent('tlSponsor', [L()['ccSponsor'+s.id]]);
  careerSave();
  careerRenderHub();
  ccSpPickRefresh();
  return true;
}
function careerDropSponsor(id){
  CAREER.sponsors=ccSponsorsAll().filter(x=>x.id!==id); ccSponsorsAll();
  careerSave(); careerRenderHub(); ccSpPickRefresh();
}

/* Monthly club objective. The yearly contract goal gave no week any weight, so the club also asks for one thing
   per month (a cut, a top 20, a podium, sized on the current division) and pays a bonus of one month's wage.
   Nothing is tracked: results already carry day, place and pass, so the month is just the rows dated inside it. */
function ccMonthKey(iso){ return String(iso||careerToday()).slice(0,7); }
function ccMonthName(key){ return L().calMonths[Number(String(key).slice(5,7))-1]||key; }

/* Player of the month / season: sum of a name's rated results (Power Rankings, Epic's multiplier table) dated
   inside the month, at least two to qualify.
   Read off the same board as History, which keeps each name's best 20 of the year. Fine here: a winning month
   survives the prune by definition.
   Who posts it is ccPressWorthy's call: scene account for Division 1, the player's own post below. */
const CC_AWARD_MIN=2;
// Сколько человек стоит в церемонии игрока года. Пять — как в футбольной
// пятёрке номинантов: победитель и те, кто был рядом. См. careerAwardSeason.
const CC_AWARD_TOP=5;
function careerAwardBoard(fromDay, toDay){
  const t=careerPrTally();
  const out=[];
  Object.keys(t.rows).forEach(function(name){
    const row=t.rows[name];
    const inside=(row.v||[]).filter(e=>e[1]>=fromDay && e[1]<toDay);
    if(inside.length<CC_AWARD_MIN) return;
    out.push({name:name, pts:inside.reduce((s,e)=>s+e[0],0),
              events:inside.length, you:!!row.you});
  });
  return out.sort((a,b)=>b.pts-a.pts || b.events-a.events);
}
function careerAwards(){
  const cr=CAREER.career;
  if(!cr.aw) cr.aw={last:ccMonthKey(careerToday()), won:[]};
  return cr.aw;
}
// How many of each the career has, which is what a summary wants to print.
function careerAwardsWon(kind){
  return (careerAwards().won||[]).filter(a=>a.you && (!kind || a.kind===kind)).length;
}
// Called wherever the clock moves. A month that has ended is judged once.
function careerAwardCheck(){
  const cr=CAREER.career, aw=careerAwards();
  const now=ccMonthKey(careerToday());
  if(aw.last===now) return null;
  const past=aw.last;
  aw.last=now;
  // The month that just ended, in the career's own absolute days.
  const from=ccAbsDay(cr.season, past+'-01');
  const board=careerAwardBoard(from, from+31);
  if(!board.length) return null;
  const win=board[0];
  aw.won=aw.won||[];
  aw.won.push({kind:'month', key:past, season:cr.season, name:win.name, you:!!win.you, pts:Math.round(win.pts||0), ev:win.events||0});
  if(win.you){
    careerReachAdd(CC_REACH_DIV(cr.division)*8);
    careerNews('good', 'ccNewsAwardYou', [ccMonthName(past)]);
  } else {
    careerNews('flat', 'ccNewsAward', [win.name, ccMonthName(past)]);
  }
  careerSave();
  return win;
}
/* НАГРАДЫ СЕЗОНА — четыре номинации рядом с игроком года. Отзыв («8 делай»: «награды
   года: голосование сцены после Глобалов — лучший игл, фраггер, новичок, дуо»). Всё читается из
   того, что карьера уже пишет: игл и новичок — по ПР сезона среди карточек с ролью игла / не
   старше CC_AW_ROOKIE_AGE; фраггер — по килам в журнале вечеров (cr.plog); дуо — пара сцены с
   наибольшей суммой ПР (плюс твоя пара). «Голоса сцены» — доли метрики среди тройки номинантов:
   не выдумка, а та же таблица в процентах. Тройки пишутся в саму награду (aw.won, kind 'cat'),
   чтобы церемония не пересчитывалась по изменившемуся ростеру. */
const CC_AW_ROOKIE_AGE=17, CC_AW_TOP=3;
/* В трио-сезон (2021, 2025, трио-главы продолжения) номинация — «Трио года», а не «Дуо года»
   (17.10, Notion «fncsdraft 15.10»: «25 год и в трио сезоны номинация была дуо года»). Состав —
   пара пула и её третий из cr.trios, сумма ПР всех троих; своя тройка — ты и оба напарника. */
const CC_AW_CATS=['igl','frag','rookie','duo','trio'];
function ccAwCatLabel(cat){ const T=L(); return {igl:T.ccAwIgl, frag:T.ccAwFrag, rookie:T.ccAwRookie, duo:T.ccAwDuo, trio:T.ccAwTrio||'Trio of the Year'}[cat]||cat; }
function careerAwardCats(){
  const cr=CAREER.career, s=cr.season;
  const from=Math.max(0, (s||1)-1)*365;
  const board=careerAwardBoard(from, from+365);
  const me=careerCard(), meKey=me ? hKey(me) : '';
  const cardOf=n=>(meKey && hKey(n)===meKey) ? me : ccWhoCard(n);
  // Роль карточки сцены — из опубликованного списка ролей (realRoleKey: I/F), у своей — из карьеры.
  const roleOf=c=>{ if(!c) return null; if(c===me) return (CAREER.player && CAREER.player.role)||c._roleKey||null; let r=null; try{ r=realRoleKey(c); }catch(e){} return r||c._roleKey||c.role||null; };
  const ageOf=c=>!c ? 99 : (c===me ? ccPlayerAge() : (c.age||99));
  const share=rows=>{ const top=rows.slice(0, CC_AW_TOP); const sum=top.reduce((a,r)=>a+r.v, 0)||1;
    return top.map(r=>({n:r.name, p:Math.round(r.v), pct:Math.round(r.v/sum*100), you:!!r.you})); };
  const byPr=f=>board.filter(r=>f(cardOf(r.name))).map(r=>({name:r.name, v:r.pts, you:r.you}));
  const igl=byPr(c=>roleOf(c)==='roleIGL');
  const rookie=byPr(c=>ageOf(c)<=CC_AW_ROOKIE_AGE);
  const frag=Object.keys(cr.plog||{}).map(n=>{ const rows=cr.plog[n]||[];
      return {name:n, v:rows.reduce((a,e)=>a+(e[5]||0), 0), n:rows.length, you:n===cr.plogYou}; })
    .filter(x=>x.n>=CC_AWARD_MIN && x.v>0).sort((a,b)=>b.v-a.v || b.n-a.n);
  const pts={}; board.forEach(r=>{ pts[hKey(r.name)]=r; });
  const pair=(a,b)=>{ const ra=a && pts[hKey(a)], rb=b && pts[hKey(b)]; if(!ra || !rb) return null;
    return {name:String(a.handle||a)+' & '+String(b.handle||b), v:ra.pts+rb.pts, you:!!(ra.you||rb.you)}; };
  const trio=careerSquadSize()>=3;
  // Тройка: пара и третий (ключ hKey) — имя третьего с доски сезона.
  const team=(a, b, k3)=>{ const p=pair(a, b), r3=k3 && pts[k3]; if(!p || !r3) return null;
    return {name:p.name+' & '+r3.name, v:p.v+r3.pts, you:!!(p.you||r3.you)}; };
  const trios=(CAREER.career.trios)||{};
  let duos=[]; try{ duos=(careerPools().duos||[]).map(d=>trio
      ? team(d.cards[0], d.cards[1], trios[d.cards.map(c=>hKey(c)).sort().join('+')])
      : pair(d.cards[0], d.cards[1])).filter(Boolean); }catch(e){ duos=[]; }
  try{ const ms=careerMates()||[];
    const mine=!me ? null : trio ? (ms[0] && ms[1] ? team(me, ms[0], hKey(ms[1])) : null) : (ms[0] ? pair(me, ms[0]) : null);
    if(mine && !duos.some(d=>d.you)) duos.push(mine); }catch(e){}
  duos.sort((a,b)=>b.v-a.v);
  const out={igl:share(igl), frag:share(frag), rookie:share(rookie)};
  out[trio ? 'trio' : 'duo']=share(duos);
  return out;
}
function careerAwardCatsWon(season){
  return (careerAwards().won||[]).filter(a=>a.kind==='cat' && a.season===season);
}
// And the year, at the boundary the season ends on.
function careerAwardSeason(){
  const cr=CAREER.career, aw=careerAwards();
  if((aw.won||[]).some(a=>a.kind==='season' && a.season===cr.season)) return null;
  const from=Math.max(0, (cr.season||1)-1)*365;
  const board=careerAwardBoard(from, from+365);
  if(!board.length) return null;
  const win=board[0];
  aw.won=aw.won||[];
  /* И ПЯТЁРКА НОМИНАНТОВ рядом с победителем — идея игрока 4 сентября:
     «чтоб в конце главы выбирали лучшего игрока за год, типо как в футболе
     золотой мяч». Игрок года в моде был и раньше, но приходил одной строкой в
     ленту; у «золотого мяча» же главное — церемония: список тех, кто на него
     претендовал, и кто из них взял. Пятёрка пишется в саму награду, чтобы
     таблица не пересчитывалась потом по изменившемуся ростеру. */
  aw.won.push({kind:'season', key:String(cr.season), season:cr.season,
               name:win.name, you:!!win.you,
               top:board.slice(0, CC_AWARD_TOP).map(r=>({n:r.name, p:Math.round(r.pts),
                                                         e:r.events, you:!!r.you}))});
  if(win.you){
    careerReachAdd(CC_REACH_DIV(cr.division)*20);
    careerNews('good', 'ccNewsAwardSeasonYou', [cr.season]);
  } else {
    careerNews('flat', 'ccNewsAwardSeason', [win.name, cr.season]);
  }
  // И четыре номинации — той же церемонией (careerAwardCats).
  try{ const cats=careerAwardCats();
    CC_AW_CATS.forEach(cat=>{ const top=cats[cat]||[]; if(!top.length) return;
      const w=top[0];
      aw.won.push({kind:'cat', cat:cat, key:String(cr.season)+':'+cat, season:cr.season, name:w.n, you:!!w.you, top:top});
      if(w.you){ careerReachAdd(CC_REACH_DIV(cr.division)*8); careerNews('good', 'ccNewsAwardCatYou', [ccAwCatLabel(cat), cr.season]); }
      else careerNews('flat', 'ccNewsAwardCat', [ccAwCatLabel(cat), w.n, cr.season]);
    }); }catch(e){}
  careerSave();
  return win;
}
/* ЦЕЛЬ МЕСЯЦА — ВЫБИРАЕТ ИГРОК (его слово 20.10: «может цели от орг пусть сам выбирает реалистичные цели, за
   которые может получить бонусы, и топ 3 не в любом кубке, а FNCS там например или квал FNCS и т.д.»).

   Было: клуб бросал одну цель на месяц — «топ-3 в кубке», «топ-10», «пройти отбор» — по дивизиону, и годилось любое
   событие. Теперь клуб предлагает три, и все три — из того, что в этом месяце правда стоит в календаре:
     надёжная   — кэш-кап (Victory Cup, Perf Eval) или пройти сессию FNCS Divisional Cup;
     средняя    — квал FNCS: пройти этап Мейджора (Play-In, Heats, Last Chance) или место в Финале недели;
     амбициозная — место в финале Мейджора или в Финале недели, если нет — высоко в кэш-капе.
   Планка места — по своим же последним местам в событиях этого вида (доля поля, квантиль 0.7 / 0.4 / 0.15, круглое
   число из CC_MG_NICE), без истории — по всем вечерам. Бонус растёт со сложностью (×1 / ×2 / ×4). Пока не выбрано, цель
   не засчитывается; не выбрал до вечера — клуб ставит среднюю сам (и в перемотке). Засчитывается вечер с дня выбора. */
const CC_MG_NICE=[1,2,3,5,10,15,20,25,30,40,50,75,100,150,200,250,300,500,1000];
const CC_MG_FIELD={cash:500, fncsCup:180, fncsFinal:50, majorFinal:50};
const CC_MG_MUL=[1, 2, 4];
// Вид строки журнала по меркам цели: сессия Divisional Cup пишется без kind.
function ccMgCat(r){
  const k=(r && r.kind) || 'cup';
  if(k==='victory' || k==='eval') return 'cash';
  if(k==='cup') return 'fncsCup';
  if(k==='final') return 'fncsFinal';
  if(k==='major') return r.stage==='final' ? 'majorFinal' : 'majorQual';
  return k;
}
function ccMgNice(x){ for(const v of CC_MG_NICE) if(v>=x) return v; return CC_MG_NICE[CC_MG_NICE.length-1]; }
// Планка места: доля поля по своим строкам этого вида (последние 12), квантиль q, умноженная на поле вида.
/* Где ты по силе в поле кэш-капа (Notion «20.10»: «очень слабые цели для игрока у которого рейтинг 95» — без истории
   планка бралась от размера поля, топ-200 из 2470 для 95-го). Поле региона той же сборкой, что у Victory Cup
   (careerCupField), твой состав — careerYouTeam; место = сколько составов сильнее + 1. Считается раз в месяц. */
function ccMgExpect(){
  const cr=CAREER.career, key=ccMonthKey(careerToday())+'|'+Math.round((CAREER.player&&CAREER.player.ovr)||0);
  if(cr._mgExp && cr._mgExp.key===key) return cr._mgExp;
  let out=null;
  try{
    const solo=careerSquadSize()===1, mine=[careerCard()].concat(solo ? [] : (careerMates()||[]).filter(Boolean)), n=careerVictoryField(solo);
    const pm=CARD_MODE, ps=squadSize, pd=drafted; CARD_MODE=true; squadSize=careerSquadSize(); drafted=mine;
    let field=[], you=null;
    try{ field=careerCupField(Object.assign({}, cr), mine, n, 'mgexp|'+key, true)||[]; you=careerYouTeam(mine); }
    finally{ CARD_MODE=pm; squadSize=ps; drafted=pd; }
    if(field.length && you && you.pow!=null){ const better=field.filter(t=>(t.pow||0)>you.pow).length; out={key, rank:better+1, n:field.length+1}; }
  }catch(e){ out=null; }
  Object.defineProperty(cr, '_mgExp', {value:out||{key, rank:0, n:0}, enumerable:false, configurable:true, writable:true});
  return cr._mgExp;
}
// Множитель к ожидаемому месту по сложности: надёжная — в 2.5 раза хуже ожидания, средняя — само ожидание, амбициозная — в 2.5 раза лучше.
function ccMgPriorMul(q){ return q>=0.7 ? 2.5 : q>=0.4 ? 1 : 0.4; }
function ccMgTarget(cat, q){
  const tHist=ccMgTargetHist(cat, q);
  if(cat!=='cash' && cat!=='any') return tHist;
  const ex=ccMgExpect(); if(!ex || !ex.rank) return tHist;
  const prior=ccMgNice(Math.max(1, Math.round(ex.rank*ccMgPriorMul(q))));
  // Своя история есть — середина между ней и силой (геометрически), нет — по силе.
  const log=(CAREER.career.log||[]).filter(r=>r && r.place && r.of && ccMgCat(r)===cat);
  const v=log.length>=3 ? Math.sqrt(prior*tHist) : prior;
  // Амбициозная — круглое число вниз (6 → 5), остальные — вверх.
  const r=Math.max(1, Math.round(v)), dn=CC_MG_NICE.filter(x=>x<=r).pop()||1;
  return Math.min(tHist, q<0.4 ? dn : ccMgNice(r));
}
function ccMgTargetHist(cat, q){
  const log=(CAREER.career.log||[]).filter(r=>r && r.place && r.of);
  let rows=log.filter(r=>ccMgCat(r)===cat).slice(-12);
  if(rows.length<3) rows=log.slice(-12);
  // Поле — медиана своих полей этого вида (у кэш-капов это и 19 на ЛАНе, и 2470 в Victory Cup).
  const own=rows.filter(r=>ccMgCat(r)===cat).map(r=>r.of).sort((a,b)=>a-b);
  const field=own.length ? own[own.length>>1] : (CC_MG_FIELD[cat]||100);
  // Пол планки по сложности: «топ-1» в кубке на тысячу — не цель, а лотерея.
  const floor=q>=0.7 ? 10 : q>=0.4 ? 5 : 3;
  if(!rows.length) return Math.min(ccMgNice(Math.max(floor, field*q*0.5)), ccMgNice(field/2));
  const fr=rows.map(r=>r.place/r.of).sort((a,b)=>a-b);
  const v=fr[Math.min(fr.length-1, Math.floor(q*fr.length))];
  return Math.min(ccMgNice(Math.max(floor, v*field)), ccMgNice(field/2));
}
// Что ещё стоит в календаре карьеры в этом месяце, по видам (с сегодняшнего дня). «Пустят ли» не спрашивается: до квала
// в Мейджор и Финал недели не пускает никто, а цель как раз в том, чтобы туда пройти.
function ccMgMonthKinds(key){
  const out={}, today=careerToday();
  try{
    careerEvents().forEach((evs, day)=>{
      if(ccMonthKey(day)!==key || day<today) return;
      (evs||[]).forEach(e=>{
        const fin=e.kind==='major' && /final/i.test(String(e.id||'')) && !/lcq|last/i.test(String(e.id||''));
        const c=e.kind==='major' ? (fin ? 'majorFinal' : 'majorQual') : ccMgCat({kind:e.kind});
        out[c]=(out[c]||0)+1;
      });
    });
  }catch(e){}
  return out;
}
function ccMgOptions(key, base){
  const has=ccMgMonthKinds(key), o=[];
  const pl=(cat, q)=>({type:'place', cat, n:ccMgTarget(cat, q)});
  // Надёжная.
  o.push(has.cash ? pl('cash', 0.7) : has.fncsCup ? {type:'cut', cat:'fncsCup'} : has.fncsFinal ? pl('fncsFinal', 0.7) : {type:'place', cat:'any', n:ccMgTarget('any', 0.7)});
  // Средняя — квал FNCS.
  o.push(has.majorQual ? {type:'cut', cat:'majorQual'} : has.fncsFinal ? pl('fncsFinal', 0.4) : has.fncsCup ? pl('fncsCup', 0.4) : has.solo ? {type:'cut', cat:'solo'} : has.cash ? pl('cash', 0.4) : {type:'place', cat:'any', n:ccMgTarget('any', 0.4)});
  // Амбициозная — FNCS.
  o.push(has.majorFinal ? pl('majorFinal', 0.15) : has.fncsFinal ? pl('fncsFinal', 0.15) : has.majorQual ? pl('fncsCup', 0.15) : has.cash ? pl('cash', 0.15) : {type:'place', cat:'any', n:ccMgTarget('any', 0.15)});
  // Одно и то же дважды — не выбор: средняя и амбициозная одного вида должны отличаться планкой.
  if(o[2].cat===o[1].cat && o[2].type===o[1].type && o[2].n>=o[1].n) o[2].n=Math.max(1, CC_MG_NICE[Math.max(0, CC_MG_NICE.indexOf(o[1].n)-2)]||1);
  if(o[1].cat===o[0].cat && o[1].type===o[0].type && o[1].n>=o[0].n) o[1].n=Math.max(1, CC_MG_NICE[Math.max(0, CC_MG_NICE.indexOf(o[0].n)-2)]||1);
  return o.map((g, i)=>Object.assign(g, {tier:i, bonus:Math.round(base*CC_MG_MUL[i]/10)*10}));
}
function careerMonthGoal(){
  const cr=CAREER.career, org=CAREER.org;
  // Свой клуб задач хозяину не ставит и премий за месяц не платит.
  if(!org || org.own) return null;
  const key=ccMonthKey();
  if(cr.mg && cr.mg.key===key) return cr.mg;
  const base=Math.max(100, Math.round((org.salary||400)/Math.max(1,careerWagePaydays().length)/10)*10);
  cr.mg={key:key, opts:ccMgOptions(key, base), pick:null, from:null, type:null, cat:null, n:0, bonus:0, paid:false};
  careerSave();
  return cr.mg;
}
// Выбор: цель становится этой (type/cat/n/bonus сверху — их читают ячейки и проверка), засчитывается с сегодняшнего дня.
function careerMonthGoalPick(i, quiet){
  const g=careerMonthGoal(); if(!g || g.pick!=null || !g.opts || !g.opts[i]) return;
  const o=g.opts[i];
  g.pick=i; g.from=careerToday(); g.type=o.type; g.cat=o.cat; g.n=o.n||0; g.bonus=o.bonus;
  careerSave();
  if(!quiet && typeof careerRenderHub==='function') careerRenderHub();
}
// Не выбрал до вечера — клуб ставит среднюю (вызывается перед проверкой после вечера и в перемотке).
function careerMonthGoalAuto(){
  const g=careerMonthGoal(); if(!g || g.pick!=null || !g.opts) return;
  careerMonthGoalPick(Math.min(1, g.opts.length-1), true);
  // Вечер, на котором выбрал клуб, тоже идёт в зачёт — он мог быть первым вечером месяца.
  const last=(CAREER.career.log||[]).slice(-1)[0];
  if(last && ccMonthKey(last.day)===g.key && last.day<g.from) g.from=last.day;
  // Без поста в ленте (его слово 20.10: «посты про клуб новые не надо»): цель видна в плитке клуба.
}
function careerMonthGoalMet(){
  const g=careerMonthGoal(); if(!g) return false;
  // Старые сейвы: цель без вариантов — как раньше, любое событие месяца.
  if(!g.opts) return (CAREER.career.log||[]).some(r=>ccMonthKey(r.day)===g.key &&
    (g.type==='cut' ? !!r.passed : (r.place||99)<=g.n));
  if(g.pick==null) return false;
  return (CAREER.career.log||[]).some(r=>ccMonthKey(r.day)===g.key && r.day>=(g.from||'') &&
    (g.cat==='any' || ccMgCat(r)===g.cat) &&
    (g.type==='cut' ? !!r.passed : (r.place||99)<=g.n));
}
// Judged where a result lands, so the money arrives with the night that earned
// it rather than at some later boundary.
function careerMonthGoalCheck(){
  careerMonthGoalAuto();
  const g=careerMonthGoal(); if(!g || g.paid) return 0;
  if(!careerMonthGoalMet()) return 0;
  const cr=CAREER.career;
  g.paid=true;
  cr.balance=(cr.balance||0)+g.bonus;
  cr.wages=(cr.wages||0)+g.bonus;
  careerSave();
  return g.bonus;
}
function careerMonthGoalText(g){
  if(!g) return '-';
  if(g.opts && g.pick==null) return L().ccMgChoose;
  return ccMgGoalLine(g);
}
function ccMgGoalLine(g){
  const T=L();
  if(!g.cat) return g.type==='cut' ? T.ccMgCut : T.ccMgPlace(g.n);
  if(g.type==='cut') return (T.ccMgCutOf||{})[g.cat] || T.ccMgCut;
  const f=(T.ccMgPlaceOf||{})[g.cat];
  return f ? f(g.n) : T.ccMgPlace(g.n);
}
// Три кнопки выбора: цель, бонус, сложность.
function ccMgPickHTML(){
  const g=careerMonthGoal(); if(!g || !g.opts || g.pick!=null) return '';
  const T=L();
  return '<div class="cc-mg-pick"><small>'+esc(T.ccMgPickHint)+'</small>'+g.opts.map((o, i)=>
    '<button type="button" class="cc-mg-opt cc-mg-t'+o.tier+'" onclick="event.stopPropagation();careerMonthGoalPick('+i+')">'+
      '<em>'+esc(T.ccMgTier[o.tier]||'')+'</em><b>'+esc(ccMgGoalLine(o))+'</b><i>+'+esc(ccMoney(o.bonus))+'</i></button>').join('')+'</div>';
}

// The season boundary is where a contract is judged. One season, one objective:
// met and they extend with a raise, missed and you are a free agent again.
/* Контракт на год, продлевать или уходить решает игрок. Условия (текущие и предложенные) прямо
   в вопросе, уход снова открывает скаутинг, чтобы свободного агента видели клубы.
   Не спрашиваем, если цель провалена (решает клуб), и под перемоткой: там продлеваем,
   как и на остальные вопросы. */
function careerOrgSeasonEnd(){
  const org=CAREER.org; if(!org) return;
  /* СВОЙ КЛУБ НЕ РАСТОРГАЕТ КОНТРАКТ С ХОЗЯИНОМ. Цели у него нет (careerClubFound), и
     careerOrgGoalMet на нём честно отвечает «нет» — а эта строка читала «нет» как
     провал сезона: «клуб расторгает контракт: задача не выполнена», CAREER.org=null,
     при этом cr.club оставался, и careerOrgOffers из-за него молчал весь следующий
     год. Игрок: «ты как бы ушёл из клуба потому что он не
     выполнил цели, то есть твой клуб, но он есть. И после этого, когда ты пытаешься
     найти новый клуб, тебе никто не пишет». Сейв с этой дырой чинит careerMigrateOwnClub. */
  if(org.own) return;
  if(!careerOrgGoalMet()){
    careerNews('bad', 'ccNewsReleased', [org.name], {by:ccOrgBy(org.name)});
    /* И слово самого игрока: у настоящих расставание с клубом это ДВА поста —
       объявление клуба и длинное «спасибо за эти годы» от человека (Sylkaos и
       HavoK by Vitality, 30 августа). Раньше клуб говорил, а игрок молчал. */
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null;
    // «Не искать клуб», нажатое в клубе, относилось к тому клубу: без сброса после расторжения не писал никто.
    CAREER.scoutOff=false; delete CAREER.scoutOffFree;
    return;
  }
  // Контракт идёт и дальше — продлевать нечего: та же зарплата, новая задача на сезон.
  if(ccOrgSeasonsLeft(org)>0){
    org.goal=careerOrgGoal(CAREER.career.division);
    careerNews('good', 'ccNewsOrgYear', [org.name, org.to-(CAREER.career.season||1)], {by:ccOrgBy(org.name)});
    careerSave();
    return;
  }
  const was=org.salary;
  const sal=org.salary, grain=sal>=2000 ? 50 : sal>=200 ? 10 : 1;
  const raise=Math.max(sal+grain, Math.round(sal*(1+CC_ORG_GOAL_RAISE[(org.goal && org.goal.tier!=null) ? org.goal.tier : 1])/grain)*grain);
  const stay=function(){
    org.salary=raise;
    org.to=(CAREER.career.season||1)+1;   // продление — на следующий сезон (сезон ещё не сменился)
    org.goal=careerOrgGoal(CAREER.career.division);
    careerNews('good', 'ccNewsExtended', [org.name, org.salary], {by:ccOrgBy(org.name)});
    careerSave();
  };
  const leave=function(){
    careerNews('flat', 'ccNewsLeftOrg', [org.name], {by:ccOrgBy(org.name)});
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null;
    // Ушёл искать лучше — значит клубы снова смотрят. См. careerOrgOffers.
    CAREER.scoutOff=false;
    careerSave();
    if(typeof careerRenderHub==='function') careerRenderHub('centre');
  };
  if((typeof CC_FF!=='undefined' && CC_FF) || skipAnimation){ stay(); return; }
  ccAsk(L().ccOrgEndText(org.name, was, raise), stay,
        {yes:L().ccOrgStay, no:L().ccOrgLeave, onNo:leave});
}

/* ---- Morale ---------------------------------------------------------------
   The partner can walk away and patience is what drives it. The scale is invented,
   the line it is scored against is the middle of the field. Scoring against the
   promotion cut drained patience for anyone outside the top third: partners left
   in 22% of cups (teen) / 46% (veteran). Now a hold is safe, promoting is better,
   and three-four weeks in the bottom third empties the seat. */
const CAREER_PATIENCE_START=60, CAREER_PATIENCE_QUIT=18;
/* Тот, чей переезд оплачен, не уходит сам. Правило: «не
   проблема что тимейт может бросить тебя если оплатишь ему переезд? запрети».
   И оно держится на том же, на чём loyal в careerDuoHolds: уехавший за тобой
   на другой континент уехал от всех, к кому мог бы уйти. Запрет — только на
   его сторону решения: твой отрыв на ступень ('behind') и смена напарника
   твоей рукой остались как были. Настроение тоже живёт как жило — он может
   быть недоволен и говорить об этом, он не может только уйти. */
function ccMateStays(pr){ return !!(pr && pr.movedWith); }
/* В команде настрой — ОБЩИЙ: от стажа дуо (chemSince — ключ команды), а не
   от терпения бота-напарника из личного списка. Отзыв:
   «настрой ещё не общий у тимейтов» — «общую делай». Растёт с днями вместе,
   от стартового значения до ста за CC_CHEM_DAYS; одинаков у обоих по
   построению. Одиночная карьера — как была. */
function careerPatience(){
  if(typeof ccMpTeam==='function' && ccMpTeam()){
    const d=careerChemDays();
    const base=CAREER_PATIENCE_START+(100-CAREER_PATIENCE_START)*Math.min(1, d/CC_CHEM_DAYS);
    return Math.round(Math.min(100, base+ccGiftMood()));
  }
  const pr=careerMateRec();
  if(!pr) return CAREER_PATIENCE_START;
  if(pr.patience==null) pr.patience=CAREER_PATIENCE_START;
  return pr.patience;
}
/* Whichever seat is closest to a decision.

   The messages after a night and the people who come for your partner both used
   to mean chair one, so a trio's second seat could not be unhappy out loud and
   could not be taken. The least patient of them is the one with something to
   say — in a duo that is the only one there is, so nothing about a duo season
   moves. */
function ccMateAtRisk(){
  const recs=careerMateRecords(), cards=careerMates();
  if(!recs.length) return null;
  const pat=r=>(r && r.patience!=null) ? r.patience : CAREER_PATIENCE_START;
  let at=0;
  recs.forEach((r,i)=>{ if(pat(r)<pat(recs[at])) at=i; });
  return {rec:recs[at], card:cards[at], at:at, patience:pat(recs[at])};
}
function careerMoodKey(p){
  return p<25 ? 'ccMoodEdge' : p<45 ? 'ccMoodUnhappy' : p<70 ? 'ccMoodSteady' : 'ccMoodHappy';
}
// Returns what happened to the partner, so the news can report it and the result
// card can say the duo is over.
/* What the night did to the people in the seats.

   Every seat, not the first one. This read careerMateRec — which means chair one
   — so in a trio season the second partner sat through a whole year of bad
   nights at the mood he arrived with: he never got happier, never got tired of
   the player, and could not walk out. The same half-written shape as the poach
   and the messages beside it, and his report of 20 August is all three at once.

   The return is still chair one's, because the result card prints one number and
   that is the number it has always printed. Whoever actually left is in the feed
   and in the timeline, the way a departure always was. */
function careerApplyMorale(place, total, passed){
  const recs=careerMateRecords();
  const mates=careerMates();
  // Половина квалифицированного состава не уходит и после плохого вечера:
  // место — пары, и пара его доигрывает. Та же строка, что в careerMatePoach
  // и careerMateDm; терпение при этом тратится как тратилось — он может быть
  // недоволен, он не может только уйти. См. careerDuoHolds, правило.
  const held=careerSlotHeld();
  if(recs.length>1){
    const perfAll = total>1 ? 1-(place-1)/(total-1) : 0.5;
    const moveAll = clamp(Math.round((perfAll-0.5)*12) + (passed?2:0), -5, 6);
    // Backwards, so dropping one does not renumber the seats still to be read.
    for(let i=recs.length-1; i>=1; i--){
      const rec=recs[i];
      const was=rec.patience!=null ? rec.patience : CAREER_PATIENCE_START;
      rec.patience=clamp(was+moveAll, 0, 100);
      if(rec.patience<CAREER_PATIENCE_QUIT && !ccMateStays(rec) && !held){
        const card=mates[i];
        careerMateDrop(rec.handle || (card && card.handle));
        careerMateLeftMark(rec.handle || (card && card.handle));
        careerRepAdd(-2);
        careerEvent('tlDuoQuit', [card ? card.handle : '']);
        careerNews('bad', 'ccNewsMateLeftFor', [card ? card.handle : '']);
      }
    }
  }
  const pr=careerMateRec();
  if(!pr) return null;
  const perf = total>1 ? 1-(place-1)/(total-1) : 0.5;
  // Scaled with everything else that was tuned per cup. These figures were set
  // when a season held eight of them; the measured year holds forty-two below
  // Division 1, and unchanged they emptied the seat almost every week — the arc
  // harness went from 128 partners walking out to 743 across the same careers,
  // for no reason but that the calendar got longer.
  //
  // A duo is supposed to hold for a season and go at the turn of it. This is not
  // that rule yet — patience still drains from any bad night — but at this size
  // it drains at the speed it was measured at rather than five times it.
  const move = clamp(Math.round((perf-0.5)*12) + (passed?2:0), -5, 6);
  const before=careerPatience();
  pr.patience=clamp(before+move, 0, 100);
  const left = pr.patience<CAREER_PATIENCE_QUIT && !ccMateStays(pr) && !held;
  const who = careerPartnerCard();
  // A partner walking out costs more than one you left, because this is the one
  // the room heard about from the other side.
  if(left){ if(pr){ careerMateDrop(pr.handle); careerMateLeftMark(pr.handle); } careerRepAdd(-2); careerEvent('tlDuoQuit', [who?who.handle:'']); }
  return {move, before, after:pr.patience, left, name:who?who.handle:''};
}

/* ---- The feed -------------------------------------------------------------
   What a career sounds like from the outside. Every line is built from
   something that actually happened in the run — the placement, who won the cup,
   what the rating did, what the partner thinks — rather than from a bank of
   flavour text, so the feed can never say something the standings do not. */
/* Сколько записей лента вообще помнит.

   Было сорок, и этого не хватало: отзыв — «будто не все посты в
   твитере». Так и есть, только теряются они не при показе, а при записи —
   careerNews режет хвост, и сорок первая запись выталкивает первую навсегда.
   Один турнирный вечер пишет пять-семь строк (результат, поздравление сцены,
   пост клуба, объявленные точки высадки), то есть сорок — это неделя. Лента
   карьеры, в которой не видно прошлого месяца, перестаёт быть историей.

   Сто двадцать — примерно сезон плотной игры, и в сейве это десятки килобайт:
   запись это ключ, пара аргументов и дата, а не текст. Чтобы длинная лента не
   стоила отрисовки, посты за экраном пропускаются (content-visibility у
   .x-post ниже). */
const CAREER_NEWS_KEEP=120;

/* A saved line is a key and its numbers, never a sentence.

   It used to be the sentence: careerNews was handed L().ccNewsRating(56, 57),
   already built in whatever language was on at the time, and the feed printed
   it back. So a career played in Russian stayed Russian in its feed, its
   history and its inbox after the player switched to English — every dictionary
   key present and correct, and half the screen in the wrong language.

   Storing {k:'ccNewsRating', a:[56,57]} instead means the sentence is built at
   the moment it is drawn, in the language that is on then. The numbers are the
   part worth keeping; the words were never the save's to own. */
/* Имя зоны для строк ленты. Номер превращается в «зона 9» / «zone 9» на
   показе, то есть в языке, который стоит СЕЙЧАС. Старые сейвы хранят уже
   собранное имя строкой — оно проходит насквозь: переводить его нечем, но и
   ломать пост из-за этого незачем. См. ccPostDropCall. */
function ccZoneName(z){
  return (typeof z==='number' && isFinite(z)) ? L().landingZoneSuffix(z) : String(z==null?'':z);
}
/* Название турнира в аргументах поста. Ключ поста переводится на показе, а имя вечера раннеры отдают уже готовой
   строкой (ccBoardAfter(ranked, you, ev.label) — «Дуо Виктори Кап 1»), и после смены языка пост читался
   «Дуо Виктори Кап 1 — stats leaders» (сторож check-language-switch, 9.10). Строка, которая начинается со строки словаря
   любого загруженного языка (дальше — конец, пробел, «·», двоеточие, запятая или цифра), получает её перевод на текущий,
   хвост («1», «· Даллас») остаётся как есть. Индекс — по первым трём буквам, самое длинное совпадение первым. */
let CC_ARG_REV=null;
function ccArgLive(a){
  if(typeof a!=='string' || a.length<6 || a.length>120 || a.charAt(0)==='@') return a;
  const nLang=Object.keys(I18N).length;
  if(!CC_ARG_REV || CC_ARG_REV.n!==nLang){
    const key=new Map(), by=new Map();
    Object.keys(I18N).forEach(lg=>{ const d=I18N[lg]||{}; Object.keys(d).forEach(k=>{ const v=d[k];
      if(typeof v!=='string' || v.length<6 || v.length>60 || v.indexOf('<')>=0 || key.has(v)) return;
      key.set(v, k); const p=v.slice(0, 3); (by.get(p)||by.set(p, []).get(p)).push(v); }); });
    by.forEach(list=>list.sort((x,y)=>y.length-x.length));
    CC_ARG_REV={n:nLang, key, by};
  }
  const list=CC_ARG_REV.by.get(a.slice(0, 3)); if(!list) return a;
  const cur=L();
  for(const v of list){
    if(a.length<v.length || a.slice(0, v.length)!==v) continue;
    const nx=a.charAt(v.length); if(nx && !/[\s·:,\d]/.test(nx)) continue;
    const now=cur[CC_ARG_REV.key.get(v)];
    return (typeof now==='string' && now!==v) ? now+a.slice(v.length) : a;
  }
  return a;
}
function ccText(e){
  if(e && e.k){
    const args=(e.a||[]).map(ccArgLive);
    // Вариант реплики (m.vi от careerDmPush): 0 — исходная, дальше — CC_LINES_MORE.dm своего языка.
    if(e.vi!=null){
      const ex=((CC_LINES_MORE[LANG]||{}).dm||{})[e.k];
      if(ex && ex.length){ const i=e.vi%(ex.length+1); if(i>0) return ccNoDash(ccMoreFill(ex[i-1], args)); }   // варианты из lines-more.js идут мимо L() — тире чистятся здесь
    }
    const line=L()[e.k];
    if(typeof line==='function') return line.apply(null, args);
    if(typeof line==='string') return line;
  }
  /* Строка без ключа: либо написанная игроком (careerPostWrite), либо
     оставшаяся от сейва, который писали до словаря. И та и другая — не наш
     текст, поэтому экранируется: пост рисуется как разметка, и единственное
     место, куда в эту ленту попадает чужой текст, — здесь. */
  return (e && e.text) ? esc(e.text) : '';
}
// What an entry says it happened on. Entries written before the clock became a
// date carry a week and no day, and they still have to read — a save is not
// worth breaking over a label.
function ccStamp(e){
  if(!e || !e.day) return L().chWeek+' '+((e&&e.week)||1);
  const t=new Date(e.day+'T00:00:00Z');
  // calDows starts on Monday; getUTCDay starts on Sunday.
  return L().calDows[(t.getUTCDay()+6)%7]+' '+t.getUTCDate()+' '+L().calMonthsShort[t.getUTCMonth()];
}
/* opt carries the two things a post can have beyond its words:

   by  — the account that posted it, when it is not the player, their partner or
         the scene's own feed. A cup winner posts their own result.
   tbl — a picture of the standings. {t: caption, rows: [{p, n, s}], me: handle}

   A like is stored on the entry rather than counted, because the reader can only
   ever add one. */
function careerNews(kind, key, args, opt){
  const cr=CAREER.career;
  cr.news=cr.news||[];
  // In the words of the season it is posted in. See ccSquadKey.
  // Ключа может и не быть: строку, которую игрок написал сам, не из чего
  // переводить — она едет в записи как есть. См. careerPostWrite.
  key=key ? ccSquadKey(key) : undefined;
  // Ушёл твой напарник — окно в хабе (ccMateGoneMaybe). В команде места двигают вместе — там окна нет.
  try{ if(CC_MATE_GONE_KEYS.test(key||'') && !(typeof ccMpOn==='function' && ccMpOn())) cr.mateGone={who:String((args||[])[0]||''), day:careerToday()}; }catch(e){}
  // Вариант фразы — и от автора: иначе шесть победителей недели подряд писали одно «W @… 🐐» (9.10).
  if((key==='ccPostPlaced' || key==='ccPostWon' || key==='ccPostPodium') && opt && opt.by && opt.by.name && args){
    const vi=key==='ccPostPlaced' ? 3 : key==='ccPostWon' ? 2 : 3;
    if(typeof args[vi]==='number') args=args.slice(0, vi).concat([args[vi]+ccHashStr(String(opt.by.name))%7], args.slice(vi+1));
  }
  // Годы без дивизионов — посты без «Дивизиона» (вариант Nd, как у реплик в личке, см. careerDmPush).
  try{ if(key && typeof ccNoDivisions==='function' && ccNoDivisions() && L()[key+'Nd']) key=key+'Nd'; }catch(e){}
  // The division the line was written in, stamped on the entry: the press gate
  // reads it, and a post from a Division 4 week must not change its author
  // because the career has since climbed.
  // Dated today unless the caller knows better. One advance can cross a week,
  // and a birthday belongs on the day it fell rather than on the day the clock
  // happened to stop.
  // CC_POST_DAY — то же самое для целого блока записей, которые пишет не игрок,
  // а прошедшая мимо неделя. См. careerD1Posts.
  const day=(opt&&opt.day)||CC_POST_DAY||careerToday();
  /* Одна и та же таблица в ленте один раз за вечер. Вечер дивизиона пишет три поста с местами плюс поздравление
     сцены, и каждый прикладывал копию того же топ-5, в ленте это выглядело как четыре турнира.
     Картинка остаётся у последнего (он сверху, записи кладутся наверх): игрок на подиуме или аккаунт сцены. Места
     остаются текстом.
     Сравниваем строки, а не подпись. careerD1TablePost не попадает, у неё другие строки. Окно 24 записи, вечер пишет
     6-7. */
  const tbl=(opt&&opt.tbl)||undefined;
  // Вид таблицы вечера (ccShotLook) — в запись: скрин рисуется так, как таблица выглядела в симуляции.
  if(tbl && tbl.rows && !tbl.lk){ const lk=ccShotLook(); if(lk) tbl.lk=lk; }
  if(tbl && tbl.rows){
    const sig=t=>((t&&t.rows)||[]).map(r=>r.p+':'+r.n+':'+r.s).join(',');
    const mine=sig(tbl);
    for(let i=0; i<cr.news.length && i<24; i++){
      const e=cr.news[i];
      if(e && e.day===day && e.tbl && sig(e.tbl)===mine) e.tbl=undefined;
    }
  }
  cr.news.unshift({season:cr.season, day, kind, k:key, a:args||[], f:cr.reach||0,
                   dv:cr.division, id:'n'+(cr.newsN=(cr.newsN||0)+1),
                   by:(opt&&opt.by)||undefined, tbl,
                   // Доска лидеров вечера — вложение того же рода, что и tbl.
                   lead:(opt&&opt.lead)||undefined,
                   // Объявленная точка: номер клетки и остров, на котором она.
                   zone:(opt&&opt.zone!=null)?opt.zone:undefined,
                   set:(opt&&opt.set)||undefined,
                   // Арт события под постом и цитируемая запись — см. ccArtHTML
                   // и ccQuoteHTML.
                   art:(opt&&opt.art)||undefined,
                   // Постер турнира этого дня, если он свой (см. ccNewsArtOf).
                   evArt:(opt&&opt.evArt)||(()=>{ try{ return ccEventArtOwn((careerYearDays().get(day)||[])[0])||undefined; }catch(e){ return undefined; } })(),
                   q:(opt&&opt.q)||undefined,
                   // Ник, чья карточка (био + PR) висит под постом. Хранится
                   // ник, а не сама карточка: числа считаются на показ, и
                   // вчерашняя копия соврала бы. См. ccCardShotHTML.
                   card:(opt&&opt.card)||undefined,
                   // Ник, с которым идёт ссора: по нему пост знает, что под ним
                   // стоят две кнопки, и кому адресован ответ. См. careerBeefAnswer.
                   beef:(opt&&opt.beef)||undefined,
                   sp:(opt&&opt.sp)||undefined,   // рекламный пост бренда (careerSponsorPost)
                   poll:(opt&&opt.poll)||undefined,   // опрос (careerPollTick, 16.10)
                   text:(opt&&opt.text)||undefined});
  if(cr.news.length>CAREER_NEWS_KEEP) cr.news.length=CAREER_NEWS_KEEP;
}
// One line a headline, the way an inbox reads.
//
// It used to be two: a stamp above every entry saying which season and week it
// was. Five entries came to two hundred and forty pixels of a column that has a
// ladder and a club in it as well, and four of those five stamps said the same
// week as the one above them — the feed is written when something happens, and
// several things happen on the same night.
//
// So the stamp moves onto the end of the line it belongs to, where it costs no
// height at all, and it says only what is not already on the screen: the week,
// and the season only when it is not the season you are standing in.
//
// It is printed on every line rather than only where the week changes. Under a
// wide screen the strip runs the headlines across three or four columns, and a
// stamp that appears only on a change lands wherever the flow happens to put it
// — a boundary that reads as one in a single column reads as an accident in
// four. The same rule has to hold in both, and this one does.
/* Who posted it.

   A feed line used to be a fact with nobody attached: "Rating: 56 -> 57" is
   something that happened, not something anybody said. The reference is X, and
   in X a post has an author — and the shot itself shows who posts FNCS results
   in real life: competitive news accounts, @FNCompetitive and @CompAwardsFN.

   So the author comes off the key the save already stores. A result is reported
   by the scene's own account, a rating is something you post about yourself, and
   a partner's mood is the partner speaking. Nothing new is stored for this: the
   key was already there, and it always knew whose line it was. */
const CC_POST_BY={
  // Your own placing is your own post, in every division. The scene's account
  // reports titles, the table and who moved clubs — not that somebody finished
  // 103rd of 150, which is what it was doing and what a real one never does.
  ccNewsResult:'you', ccNewsResultWeek:'you',
  // Жизнь между турнирами (cr.life): Арена, ранг, Noble, травма, жалоба и бан, цель, своя карта,
  // икон-скин, место в Trial, замена — строки о самом игроке. Бан кого-то из сцены — пресса.
  lfNewsArena:'you', lfNewsArenaChamp:'you', lfNewsBanned:'you', lfNewsCase:'you', lfNewsCleared:'you',
  lfNewsFined:'you', lfNewsGoal:'you', lfNewsHealed:'you', lfNewsIcon:'you', lfNewsMapOut:'you',
  lfNewsMapPay:'you', lfNewsMapUpd:'you', lfNewsNoble:'you', lfNewsPlaced:'you', lfNewsRankUp:'you',
  lfNewsStandin:'you', lfNewsSceneBan:'press',
  // Разошедшийся вечер командной игры — своя строка о своём вечере.
  ccNewsMpSplit:'you',
  ccNewsMpPaySync:'you',
  ccPostEvKilled:'arg0', ccPostEvVR:'you', ccPostEvKills:'you',
  // Пресс-конференции (16.10): цитату и исход обещания пишет пресса, на провокацию отвечает названный игрок.
  ccPostPress:'press', ccPostPressKept:'press', ccPostPressBroke:'press', ccPostPressRival:'arg0',
  // Слухи и опросы (16.10) пишут выдуманные медиа-аккаунты — автор едет в opt.by; здесь — на случай записи без него.
  ccPostRumorPair:'press', ccPostRumorYou:'press', ccPostRumorDrama:'press', ccPostRumorTrue:'press', ccPostPollWin:'press', ccPostBreakout:'press',
  // Удача зон, спор «кто лучше», серия страны (28.10): свой пост о зонах — твой, остальное пишут медиа (автор в opt.by).
  ccPostZoneLuck:'you', ccNewsZoneLuck:'press', ccPostDebate:'press', ccNewsNatStreak:'press',
  ccNewsHotfix:'press', ccNewsRehost:'press', ccNewsTeamingDq:'press', ccPostTechNet:'you',
  // LFD is the player saying it out loud. Nobody else posts that for you.
  ccNewsLfd:'you',
  // And so is an injury: a wrist is the player's own week, not a transfer the
  // scene reports. The room finds out because they said so.
  // Who represents you and what they took: the player's own week again.
  ccNewsPromoted:'press', ccNewsWinner:'press',
  ccNewsKinch:'analyst',
  ccNewsStatBoard:'analyst',
  ccNewsEliteFlop:'analyst',
  // The Performance Evaluation is a Division 1 night, so the press gate let
  // these through — but what they say is where the player finished, and a
  // scene account does not post "I went out in Round 1". Same rule that moved
  // ccNewsResult across: a placing is the player's own line.
  ccNewsEvalCash:'you', ccNewsEvalPlace:'you', awNewsDivUp:'you', ccNewsMobSer:'you', ccNewsEvalNoWin:'you', ccNewsEvalOut:'you',
  // Поздравление сверху приносит лента сцены; подарок — твоя строка.
  // Эти строки говорят люди сцены — автором стоит тот, чьё имя первым
  // аргументом. См. 'arg0' в ccPostAuthor.
  ccPostBdayPro:'arg0', ccNewsBdayGift:'you',
  ccPostBanSad1:'arg0', ccPostBanSad2:'arg0', ccPostBanSad3:'arg0',
  ccPostDuoSplitBy:'arg0', ccPostDuoSplitByt:'arg0', ccPostTrioLF:'arg0',
  // Анкету свободного агента пишет он сам — как и всё остальное про себя.
  // Точку высадки объявляет тоже он.
  ccPostLfdWant:'arg0', ccPostLfdWantAny:'arg0', ccPostDropCall:'arg0',
  // Квал из хитов: свой — свой, прошедший бот — от своего имени (первый аргумент).
  ccPostQualGrands:'you', ccPostBotQualGrands:'arg0',
  // Кастомка — свой вечер и своя строка о нём. Пост про титул подписывает
  // клуб: он назван первым аргументом, и его берёт CC_ORG_POST_ARG, но автор
  // должен быть решён и здесь — иначе ключ считается забытым (check-career-feed).
  // Клуб приезжает автором записи (opt.by), а 'press' — страховка на случай,
  // когда клуба в пуле уже нет: тогда титул объявляет лента сцены.
  // Воуч — твоя рекомендация и твоя строка.
  // Благодарность за турнир — своя строка после ЛАНа.
  ccDayEvcustomTake:'you', ccPostOrgWin:'press', ccPostVouch:'you', ccPostThanks:'you', ccPostOneOff:'you', ccPostTriedBest:'you',
  ccPostBye:'you', ccPostAskYes:'you', ccPostAskNo:'you',
  ccNewsAnnounce:'press', ccNewsRoadmap:'press', ccPostHype:'arg0', ccPostDates:'arg0', ccPostCustomsOpen:'press',
  ccPostHosted:'you',
  // Свой клуб говорит своим гербом (by), подписка и SAC — свои строки. Ключи с 11.09,
  // ловил check-career-feed.
  ccNewsClubAcad:'by', ccNewsClubBuy:'by', ccNewsClubFound:'by', ccNewsClubLeft:'by', ccNewsClubSign:'by',
  ccNewsClubSold:'by', ccNewsClubSour:'by', ccNewsClubUnpaid:'by', ccNewsClubUp:'by', ccNewsClubWant:'by',
  ccNewsSacPay:'you', ccNewsTwSubbed:'you', ccNewsClubClosed:'by',
  ccNewsLeftOrg:'press',
  ccNewsSigned:'press', ccNewsReleased:'press', ccNewsExtended:'press', ccNewsTransfer:'press', ccNewsOrgYear:'press', ccNewsRumor:'press',
  /* Парный контракт заведён 25 августа, когда клубы уже постили сами, поэтому
     ему не нужен запасной автор из прошлого: его пишет тот, кто подписал, и
     запись всегда приходит с ним ('by'). */
  ccNewsSignedDuo:'by',
  // A move between clubs is announced rather than confessed, and coming up out
  // of an academy is the club's news about its own roster: the account that
  // posts a signing posts these two as well.
  ccNewsLeft:'press', ccNewsPromotedRoster:'press', ccNewsRaise:'press',
  // What the club paid and what it bought are the player's own week, not the
  // scene's business. These were reaching the feed under the scene's name only
  // because nothing had named an author for them.
  ccNewsOrgKit:'you', ccNewsOrgCoach:'you',
  ccNewsRating:'you', ccNewsCeiling:'you', ccNewsCoach:'you',
  // A stream night is the player's own post, the same as the unpaid one.
  ccNewsStreamPaid:'you', ccNewsScrim:'you',
  /* Семь строк, которые попадали сюда по умолчанию и потому нигде не были
     названы, — check-career-feed требует решения на каждую, и красным он
     стоял именно на них. Все семь — своя жизнь, а не сцена: спарринг и 1v1,
     простуда, ответ на запрос в друзья, отказ от читов и бан за них. Даже
     бан: строка написана про свой аккаунт («карьера завершена»), а не про
     чужой, и постит её тот, чья карьера кончилась. */
  /* Ссора. Первый пост пишет соперник, и он приходит со своим автором в
     opt.by — карта для него не читается вовсе. Но названным он быть обязан:
     проверка требует решения на каждый ключ, и «у него автор свой» — это
     тоже решение, а не пропуск. Значение 'by' именно это и говорит; если
     когда-нибудь позовут без by, ccPostAuthor отдаст пост игроку, как и
     всякую неназванную строку. Ответ и отказ — твои собственные слова. */
  ccBeefStart:'by',
  ccBeefHit:'you', ccBeefQuiet:'you',
  ccNewsSp:'you', ccNews1v1:'you', ccNewsSick:'you', ccNewsLocker:'you', ccNewsFnGift:'you', ccNewsSacOwn:'you', ccNewsSacPaid:'you', ccNewsSacPromo:'you', ccNewsMgAuto:'by', ccNewsFnWin:'you', ccNewsFnOut:'you',
  ccNewsFriendYes:'you', ccNewsFriendNo:'you',
  ccNewsCheatPaid:'you', ccNewsBanned:'you',
  // Moving is the player's own news in all three directions — the flight, the
  // way back, and the month that could not be covered. The scene does not
  // report where somebody lives, and a career saying it itself is what the
  // timeline actually looks like when a player relocates.
  ccNewsMoved:'you', ccNewsMovedHome:'you', ccNewsRentGone:'you',
  ccNewsMovedRegion:'you', ccNewsLeftRegionClub:'you', ccNewsRentGoneRegion:'you',
  ccNewsSponsor:'you',
  // The player's own placement post, and their stream announcement. A post with
  // an author on it (see e.by) never reaches this map — a cup winner is not one
  // of the three fixed accounts.
  ccPostPlaced:'you', ccNewsStream:'you',
  // The title and the podium are the player's own post, with the table on it.
  ccPostWon:'you', ccPostPodium:'you',
  // Giving a qualification away is the player's own week, loudly.
  // A birthday in the scene is the scene's account; the player's own is theirs.
  ccPostBday:'press', ccPostBdayMe:'you', ccPostBdayEpic:'press',
  ccNewsVicCash:'you', ccNewsVicNoWin:'you', ccNewsVicOut:'you',
  ccNewsRelThrough:'you', ccNewsRelOut:'you', ccNewsRelSeat:'you',
  // Место, которое ты не занял, потому что оно у тебя уже есть, — тоже твоя
  // собственная строка: путёвку отдаёшь ты. См. ccRelSeatPass.
  ccNewsRelSeatPass:'you',
  // What a Reload run paid is the same kind of line as where it finished, and
  // it was the one key in the set nobody had named an author for.
  ccNewsRelCash:'you',
  /* Ключи 29.09–8.10 без решённого автора (полный прогон 9.10, check-career-feed): свой клуб —
     гербом, титул EWC — лента сцены, путёвка, MVP, штаб, оплата клуба и отказ клуба взять
     напарника — своя неделя. */
  ccNewsClubStaff:'by', ccNewsClubBuyback:'by', ccNewsEwc24Champ:'press',
  ccNewsEwc24Ticket:'you', ccNewsEwc24Mvp:'you', ccNewsOrgPays:'you', ccNewsOrgPaysNo:'you',
  ccNewsStaffGone:'you', ccNewsStaffRenew:'you', roClubNo:'you',
  // Leaving a region hands the seat down, and that is the player's own line.
  ccNewsSlotRegion:'you',
  // Подарок напарнику — и полученный, и отправленный — своя строка: вещь
  // покупаешь и получаешь ты, а не сцена о тебе пишет. Пришло с командной
  // карьерой (ccGiftBuy/ccGiftSaw) и стояло без автора — красное
  // check-career-feed.
  ccNewsGiftSent:'you', ccNewsGiftGot:'you',
  // Магазин богатых (15.10): свой кап, мерч, взнос и покупка — всё пишет сам игрок.
  ccNewsOwnCup:'you', ccNewsMerch:'you', ccNewsCharity:'you', ccNewsLux:'you',
  ccNewsWfIn:'you', ccNewsWfCash:'you', ccNewsWfNoCash:'you',
  // ccNewsRelegated больше не пишется — из первого дивизиона не вылетают, см.
  // careerNewSeason, — но ключ остаётся ради старых сейвов, чья лента его уже
  // держит: без автора такая строка ушла бы под имя сцены задним числом.
  ccNewsRelegated:'press', ccNewsKeptD1:'press', ccNewsKeptD1Low:'press',
  ccNewsRetired:'press', ccNewsRetiredForced:'press', ccNewsSceneRetire:'press', ccNewsRegen:'press',
  ccNewsDuoAgain:'you', ccNewsDuoSplit:'you', ccNewsDuoOutgrown:'you',
  ccNewsDuoAnnounce:'you',
  ccNewsMajThrough:'you', ccNewsMajOut:'you', ccNewsMajCash:'you', ccNewsMajNoCash:'you', ccNewsEvCash:'you', ccNewsEvNoCash:'you',
  ccNewsSumThrough:'you', ccNewsSumOut:'you', ccNewsSumCash:'you', ccNewsSumNoCash:'you',
  ccNewsSoloThrough:'you', ccNewsSoloOut:'you', ccNewsSoloCash:'you',
  ccNewsRcThrough:'you', ccNewsRcDrop:'you', ccNewsRcOut:'you', ccNewsRcCash:'you', ccNewsRcChamp:'you',
  ccNewsRcMvp:'you',
  ccNewsGcThrough:'you', ccNewsGcIn:'you', ccNewsGcOut:'you', ccNewsGcCash:'you', ccNewsGcNoCash:'you',
  ccNewsGcSeat:'you',
  ccNewsGlobCash:'you', ccNewsGlobNoCash:'you', ccNewsGlobChamp:'you',
  // An award is the scene's to hand out, so it is the scene's to announce —
  // and below Division 1, where the scene does not report, ccPressWorthy turns
  // the same line into the player's own post.
  // An answer is the player's own words, so it is the player's own post. The
  // key carries which wording was used, so all four of each are listed.
  ccIvSaidduo1:'you', ccIvSaidduo2:'you', ccIvSaidduo3:'you', ccIvSaidduo4:'you',
  ccIvSaidboast1:'you', ccIvSaidboast2:'you', ccIvSaidboast3:'you', ccIvSaidboast4:'you',
  ccIvSaidblame1:'you', ccIvSaidblame2:'you', ccIvSaidblame3:'you', ccIvSaidblame4:'you',
  // And the trio wordings of the same three, which are the same post.
  ccIvSaidduot1:'you', ccIvSaidduot2:'you', ccIvSaidduot3:'you', ccIvSaidduot4:'you',
  ccIvSaidblamet1:'you', ccIvSaidblamet2:'you', ccIvSaidblamet3:'you', ccIvSaidblamet4:'you',
  ccNewsAward:'press', ccNewsAwardYou:'press',
  // Снятие команды перед ЛАНом (ccLanDqRoll) — новость сцены.
  ccNewsDqSeat:'press', ccNewsDqOther:'press',
  ccNewsAwardSeason:'press', ccNewsAwardSeasonYou:'press', ccNewsAwardCat:'press', ccNewsAwardCatYou:'press',
  ccNewsPartnerNew:'you', ccNewsSquadNew:'you', ccNewsDropped:'you', ccNewsPairFreed:'you', ccNewsRoleMoved:'you', ccNewsRoleYes:'you', ccNewsRoleNo:'you', ccNewsTalkFix:'you', ccNewsTalkKeep:'you', ccNewsTalkFine:'you', ccNewsTalkAgain:'you',
  // Переезд вдвоём — это твой пост: платил за него ты. Автора ему не завели,
  // когда добавляли саму кнопку; check-career-feed поймал.
  ccNewsMovedTogether:'you',
  // The seat beside you changing hands is the player's own news, both ways.
  ccNewsMateLeftFor:'you', ccNewsTrialGone:'you',
  ccNewsBoughtOut:'you',
  ccNewsStreamAd:'you',
  // The rivalry is the player's own running commentary on their season.
  ccNewsRivalWon:'you', ccNewsRivalLost:'you',
  // A scrim score and a bootcamp are the player's own week, not the scene's.
  ccNewsCampReady:'you',
  // 3 сентября: поездка на ЛАН, нервы, мета, бонус и уход клуба,
  // развилки дня — свои строки о своём дне, клубные — с by клуба.
  ccPostLanArrive:'you', ccNewsMetaNew:'press', ccNewsResultWf:'you', ccNewsResultWeekWf:'you',
  // Трансфер объявляет сам человек (by приходит с постом), рост и спад — пресса.
  ccNewsSceneDuo:'by', ccNewsSceneRise:'press', ccNewsSceneFall:'press',
  ccNewsProAmCash:'you', ccNewsProAmOut:'you', ccNewsProAmReach:'you',
  // Коллаб-стрим — свой вечер, свой пост. См. careerStreamGo.
  ccNewsStreamColab:'you', ccNewsColabYes:'you', ccNewsColabNo:'you',
  // И эфир с турнира — тоже свой. Денег в строке нет намеренно: правка 23
  // августа сняла из ленты денежные твиты эфира, отчёт вечера с заработком
  // живёт в панели дня. См. ccStreamCupAfter.
  ccNewsStreamCup:'you',
  ccNewsTwAffiliate:'you', ccNewsTwPartner:'you',
  ccNewsOrgBonus:'by', ccNewsOrgGone:'by', ccPostLft:'you',
  ccDayEvmateSpotRmove:'you', ccDayEvmateSpotRkeep:'you', ccDayEvmateSpotRtrial:'you',
  ccDayEvorgLateRwait:'you', ccDayEvorgLateRpublic:'you', ccDayEvorgLateRleave:'you',
  ccDayEvleakRdeny:'you', ccDayEvleakRconfirm:'you', ccDayEvleakRsilent:'you',
  ccDayEvhouseRgo:'you', ccDayEvhouseRno:'you',
  ccDayEvcoachFreeRtake:'you', ccDayEvcoachFreeRpass:'you',
  ccDayEvtiltRblame:'you', ccDayEvtiltRown:'you', ccDayEvtiltRtalk:'you',
  ccDayEvorgQuitRfa:'you', ccDayEvorgQuitRquiet:'you',
  // Answering a hater is the player's own decision and their own post.
  // The partner's mood stays with the press account, even though it is about
  // them. Every line in this feed is written as a report — "Rimo is unhappy with
  // the week" — and a report about somebody, posted from their own account,
  // reads as a person talking about themselves in the third person. Moving them
  // to the partner needs the copy rewritten in the first person first, and that
  // is a change to the words rather than to who says them.
  ccNewsPartnerHappy:'press', ccNewsPartnerCross:'press', ccNewsPartnerLeft:'press',
  ccNewsCongrats:'press', ccNewsD1Table:'press',
  ccNewsWorldWon:'press',   // финал без игрока — пишет пресса, как таблицу Д1 (16.09)
  // Ранкед и Арена, свой буткемп, свой турнир: строки о самом игроке.
  rkNewsArenaReset:'you', rkNewsReset:'you', rkNewsDown:'you', rkNewsPlaced:'you', rkNewsTop100:'you', rkNewsTop1:'you',
  ccNewsHomeCamp:'you', ownNewsAnnounce:'you', ownNewsQualOut:'you'
};
/* What the scene's account covers: Division 1, the Majors, the Reload circuit
   — the rooms with real names in them — and congratulating whoever won. Real
   competitive accounts do not report the ladder's middle, and this one did: a
   Division 4 cup result, a Division 3 signing, all filed under the scene's
   banner. Anything the gate turns away is the player's own post instead,
   which is who actually announces those things. */
function ccPressWorthy(e){
  if(e.k==='ccNewsCongrats') return true;
  // Расписание года — анонс Epic для всех, в каком бы дивизионе ни читали.
  if(e.k==='ccNewsRoadmap') return true;
  // A birthday is the scene's own account posting about the scene, whatever
  // division the career reading it happens to be standing in — and the same
  // holds for the one it sends the player, which is the whole reason a career
  // is given somewhere to write a date of birth down. See careerBirthdays.
  if(e.k==='ccPostBday' || e.k==='ccPostBdayEpic') return true;
  if(e.k==='ccNewsPromoted') return !!(e.a && e.a[0]===1);
  /* Дивизион у записи, а если его нет — у карьеры. КАРЬЕРЫ МОЖЕТ НЕ БЫТЬ:
     Скриншот, красная плашка «Cannot read properties of null
     (reading 'career')» — лента дорисовывается после выхода из карьеры, а
     разбор автора поста лезет сюда. Тогда запись читается как не-первый
     дивизион: её напишет игрок, а не пресса, и это безопасный ответ. */
  const cr=CAREER && CAREER.career;
  return (e.dv!=null ? e.dv : (cr ? cr.division : 5))===1;
}
// The scene's own account — the name the real one goes by, which is what the
// user asked for: @FNCompetitive is who posts FNCS results.
/* av — аватарка аккаунта, правка: «в Notion добавил аватарку
   для твитера фортнайт». До неё единственный аккаунт ленты, который не игрок,
   сидел под кружком с двумя буквами: у игрока и у напарника лица берутся с
   карточки, а у сцены карточки нет и взять было неоткуда. Файл лежит там же,
   где портреты, — это лицо в ленте, а не эмблема клуба. */
/* Аналитик сцены: свой аккаунт, как у прессы, со своим лицом. */
const CC_ANALYST={name:'Kinch Analytics', handle:'KinchAnalytics', verified:true,
                  av:'KinchAnalytics.jpg'};
const CC_PRESS={name:'Fortnite Competitive', handle:'FNCompetitive', verified:true,
                av:'FNCompetitive.png'};
// The action row's glyphs, drawn rather than lettered so they read at 13px and
// do not depend on an emoji font being present.
const CC_X_REPLY='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.8L3 21l1.9-4.6A8.3 8.3 0 0 1 3.6 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8.4 8.4z"/></svg>';
const CC_X_REPOST='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M17 2l4 4-4 4"/><path d="M3 12V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v3a3 3 0 0 1-3 3H3"/></svg>';
const CC_X_LIKE='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3z"/></svg>';
const CC_X_HOME='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/></svg>';
const CC_X_CHAT='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.8L3 21l1.9-4.6A8.3 8.3 0 0 1 3.6 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8.4 8.4z"/></svg>';
const CC_X_DISCORD='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M7 6.5c3.3-1.3 6.7-1.3 10 0 1.6 2.6 2.4 5.6 2.2 9-1.4 1.1-2.9 1.8-4.5 2.3l-1-1.7M7 6.5C5.4 9.1 4.6 12.1 4.8 15.5c1.4 1.1 2.9 1.8 4.5 2.3l1-1.7"/><circle cx="9.5" cy="12.5" r="1.2"/><circle cx="14.5" cy="12.5" r="1.2"/></svg>';
const CC_X_USER='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>';
const CC_X_VIEWS='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 20V10M10 20V4M16 20v-7M22 20V8"/></svg>';
/* Followers. Invented, nothing in the roster data measures it. Anchored so a career starts unknown and a streaming
   Division 1 regular reaches tens of thousands in a year.
   Moved by stream days (more reach higher up), results (steep in placement: a D1 win is worth six stream days,
   mid-table half of one) and signing for a club (a slice of its audience). Nothing takes followers away. */
const CC_REACH_DIV = d => 20 + (5-clamp(d,1,5))*40;
// What an evening on stream is worth: one dollar per two thousand readers, so
// fifty thousand is twenty-five dollars a night. Small on purpose - see the day
// loop, where it is paid.
const CC_STREAM_PER=2000;
/* Followers for a night on stream, by rung. Measured against CC_XFOLLOW rather
   than drawn as a line: nobody is watching Division 5, and Division 1 is watched
   every week. At roughly 150 stream nights a year this is 750 / 1,800 / 3,750 /
   9,000 / 27,000 from the bottom up. */
const CC_STREAM_BY_DIV={1:180, 2:60, 3:25, 4:12, 5:5};
function CC_STREAM_REACH(d){ return CC_STREAM_BY_DIV[clamp(d,1,5)] || CC_REACH_DIV(d); }
// A scrim is a set, and a set is twelve rounds.
function careerReach(){ return (CAREER.career.reach||0); }
const CC_SMM_DAYS=30;
const CC_SMM_X_FLOOR=250, CC_SMM_X_TOP=2500;
const CC_SMM=[
  {id:'v1ntero',  name:'v1ntero77',       at:'v1nteroFN',  photo:'v1nteroFN.jpg',  x:2152},
  // Social media manager and editor. His own line names who he has worked with,
  // and most of them are on this roster — Sky, Scroll, Tjino, Pablowingu, Pixie —
  // so he arrives inside the scene the mode already describes, the way João does
  // among the managers. Count read off x.com on 19 August 2026.
  {id:'sweety',   name:'Sweety',          at:'SweetyyFN',  photo:'SweetyyFN.jpg',  x:1827},
  {id:'sandora',  name:'SandoraFN',       at:'SandoraFN',  photo:'SandoraFN.jpg',  x:1006},
  // x.com/baderwtw (Notion «02», 2.10): «w/w @creedtalent | Co-Own @Forceesportss», ведёт
  // eomzo1, regsita, channcefn и других. 855 фолловеров по api.fxtwitter.com 2 октября 2026.
  {id:'bader',    name:'bader',           at:'baderwtw',   photo:'baderwtw.jpg',   x:855},
  {id:'pyp4ing',  name:'Pyp4ingS',        at:'Pyp4ingS',   photo:'Pyp4ingS.jpg',   x:602},
  {id:'ugo',      name:'Lyost Ugo',       at:'UgoComm',    photo:'UgoComm.jpg',    x:543},
  {id:'lair',     name:'LairFN',          at:'Lair_Fn',    photo:'Lair_Fn.jpg',    x:456},
  {id:'veltrixx', name:'Lyost zVeltrixx', at:'veltrixx10', org:'zVeltrixx',
                  photo:'veltrixx10.jpg', x:427},
  {id:'lumos',    name:'MGA Lumos',       at:'CmLumos',    photo:'CmLumos.jpg',    x:296},
  /* Скриншот профиля: x.com/MetiDark_ — NOW MetiDark, Франция,
     Community Manager у Noww_eSport и REC_2027, TikTok у WyckerTv, 46
     фолловеров. CM, а не SMM по названию, но работа та же, и список это уже
     знает: MGA Lumos строчкой выше — тоже CM (CmLumos), как и Lyost Ugo
     (UgoComm).

     Сорок шесть — это НИЖЕ пола шкалы (CC_SMM_X_FLOOR=250), поэтому ccSmmPull
     зажимает его тягу в ноль: самый слабый СММ из возможных. Так и должно
     быть, и это не повод опускать пол — аккаунту четыре месяца. */
  {id:'metidark', name:'NOW MetiDark',    at:'MetiDark_',  photo:'MetiDark_.jpg',  x:46}
];
// Подписчики в окнах — свежие (CC_STAFF_X, 8.10.2026), где снимок есть.
[CC_AGENTS, CC_SMM, CC_MARKETING].forEach(list=>list.forEach(x=>{ if(CC_STAFF_X[x.at]!=null) x.x=CC_STAFF_X[x.at]; }));
// Where an account sits between the smallest of them and the biggest, 0 to 1.
function ccSmmPull(x){
  if(!(x>0)) return null;
  const lo=Math.log(CC_SMM_X_FLOOR), hi=Math.log(CC_SMM_X_TOP);
  return clamp((Math.log(x)-lo)/(hi-lo), 0, 1);
}
/* What a month of them costs and what it does. A written-in number still wins,
   the way it does for the player's manager, so one of them can be tuned by hand
   without the curve arguing back. */
function ccSmmTermsOf(m){
  const k=ccRankPull(CC_SMM, m);
  // Цена — та же кривая штаба, $150…3 000 (17.10, его «а другой стафф»); прирост — прежний.
  const t=(k==null) ? {cost:600, boost:0.22}
                    : {cost:ccStaffCostCurve(150, 3000, k), boost:+(0.18+k*0.42).toFixed(2)};
  return {cost: m && m.cost!=null ? m.cost : t.cost,
          boost: m && m.boost!=null ? m.boost : t.boost};
}
// What the cheapest of them asks, which is what the tile prints before anybody
// is hired.
const CC_SMM_FROM=Math.min.apply(null, CC_SMM.map(m=>ccSmmTermsOf(m).cost));
function ccSmmOf(id){ return CC_SMM.find(x=>x.id===id) || null; }
function ccSmm(){
  const m=CAREER && CAREER.smm;
  if(!m || careerToday()>m.until) return null;
  return m;
}
function ccSmmBoost(){
  const m=ccSmm();
  if(!m) return 0;
  // Stored on the month, so terms agreed under an old price list still stand.
  return m.boost!=null ? m.boost : ccSmmTermsOf(ccSmmOf(m.id)).boost;
}
/* Staff bring their own audience on top of the boost.
   The boost is a share of what a result paid, and CC_REACH_DIV is 20/night in Division 5 vs 180 in Division 1, so at the bottom it was close to nothing.
   An editor posts regardless of results: a month of work brings a quarter of their follower count (from the roster), delivered per day rather than in a lump.
   Also counted into cr.smmGot so the tile can show what the hire actually did. */
const CC_SMM_OWN=0.25;
function ccSmmWork(nights){
  const m=ccSmm();
  if(!m || !(nights>0)) return 0;
  const card=ccSmmOf(m.id) || m;
  const own=(card && card.x) || 0;
  if(!own) return 0;
  // Their own audience, spread across the month they are hired for. Raw, so the
  // boost does not pay itself a percentage of its own work.
  const per=own*CC_SMM_OWN/CC_SMM_DAYS;
  const got=careerReachAdd(per*nights, true);
  const cr=CAREER.career;
  cr.smmGot=(cr.smmGot||0)+got;
  return got;
}
// What the month has actually brought, for the tile to print instead of a
// percentage nobody could check.
function ccSmmGot(){ return Math.round((CAREER && CAREER.career && CAREER.career.smmGot) || 0); }
function careerHireSmm(id, months){
  months=months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1;
  const cr=CAREER.career;
  const who=ccSmmOf(id) || CC_SMM[0];
  // Смена, как у коуча и маркетолога: отзыв — «СММ сделай такую же кнопку, чтоб мог выбирать».
  if(ccSmm() && ccSmm().id===who.id) return false;
  const t=ccSmmTermsOf(who), due=ccStaffTermCost(t.cost, months);
  if((cr.balance||0)<due) return false;
  cr.balance-=due;
  CAREER.smm={id:who.id, name:who.name, at:who.at, photo:who.photo,
              cost:t.cost, boost:t.boost, x:who.x, months,
              from:careerToday(), until:ccAddDays(careerToday(), ccStaffTermDays(months))};
  // The count starts at nought with the month, so the tile reads what this hire
  // has brought rather than what every hire ever has.
  cr.smmGot=0;
  careerSave();
  ccSmmPickClose();
  careerRenderHub();
  return true;
}
/* The three of them behind a press, the same shape the coaches are picked in:
   a face, what they are for, and one button. */
function ccSmmPickOpen(){
  const cr=CAREER.career;
  const rows=ccByHand(CC_SMM).map(m=>{
    const t=ccSmmTermsOf(m);
    const on=!!ccSmm() && ccSmm().id===m.id;
    const can=!on && (cr.balance||0)>=t.cost;
    return `<div class="cc-buy${on?' own':''}">
      <img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(m.photo)}" alt=""
           loading="lazy" onerror="this.remove()">
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(m.name)}</span> ${ccStaffBadge(ccStaffRating(m)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${m.x ? '👥 '+ccFollowers(m.x)+' · ' : ''}@${esc(m.at)}${m.org ? ' · '+esc(m.org) : ''}</i>
        <span class="cc-buy-chips"><em class="up">${L().ccSmmGain} +${Math.round(t.boost*100)}%</em></span></div>
      ${on ? `<span class="cc-owned">${L().ccShopUntil(ccDayLabel(CAREER.smm.until))}</span>`
           : ccHireBtns(can, t.cost, "careerHireSmm('"+m.id+"')", "careerHireSmm('"+m.id+"',12)")}
    </div>`;
  }).join('');
  document.getElementById('smmPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccSmm}</h4>
     <div class="ch-hint">${L().ccSmmHint}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('smmPickModal').style.display='flex';
  document.addEventListener('keydown', ccSmmPickKey);
}
function ccSmmPickClose(){
  const m=document.getElementById('smmPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccSmmPickKey);
}
function ccSmmPickKey(e){ if(e.key==='Escape') ccSmmPickClose(); }
/* НАЁМ НА ТУРНИР (29.10, идея игрока из Notion 27.10 скрин 27: «чтобы ты мог заплатить игрокам на голову
   сильнее, чтобы они пошли с тобой турнир»; его выбор «наём на турнир»). В день турнира — кнопка на Центре:
   топ-100 сцены твоего региона по рейтингу (сверху сильнейшие), плата сразу. Нанятый садится в первое кресло на ЭТОТ день (careerMates/careerPartnerCard): поле турнира
   убирает его из своей пары, как убирает любого из твоего состава (careerCupField, mine). Призы — как с
   напарником. Отменить до игры — деньги назад. Цена — ccHireFee ниже (заработок за вечер).
   В команде и в гонке найма нет: первое кресло там занято человеком. */
/* ЦЕНА ПО ЗАРАБОТКАМ (29.10, его «цены нереалистичные, слишком мало»). Было 150 × 1,15^(r−85): Sky 95 — $610 за вечер,
   при его $277 тыс. призовых за 2026. Замер (scratchpad hire-fit.js): заработок 2026 из Liquipedia (HOME_EARN_LQ, 49 игроков
   с карточкой) против рейтинга карточки — log(e) = CC_HIRE_FIT_A + CC_HIRE_FIT_B·r (r² 0,30; шаг ×1,147 за очко — тот же,
   что был, ошибалась база). Цена — заработок игрока за один дуо-вечер года: свой из Liquipedia, если он есть и год 2026,
   иначе по кривой; делитель CC_HIRE_DAYS — дни дуо-турниров карьеры 2026 (кубки 34, финалы 19, Мейджоры 18, Victory 23,
   Reload 24, Саммит 5, GC 11, Глобалы 2). Что турнир платит больше или меньше среднего, цена не знает — это оценка. */
/* 29.10 вечером (его «цены больше, чёт слишком мало»): делитель — не все 136 дуо-дней года, а около 40 турниров, в которых
   топ-игрок за год реально играет и берёт призы (кубки, финалы, Мейджоры, Глобалы). 40 — оценка, не замер. */
const CC_HIRE_FIT_A=-1.110, CC_HIRE_FIT_B=0.1371, CC_HIRE_DAYS=40, CC_HIRE_TOP=100;
let CC_HIRE_MEMO=null;
function ccHireAllowed(){
  return !!(CAREER && CAREER.career) && !(typeof ccMpOn==='function' && ccMpOn()) &&
    !(typeof ccRacePairOn==='function' && ccRacePairOn()) && !(typeof ccRaceLock==='function' && ccRaceLock()) &&
    careerMateSeats()>0;
}
/* Нанятые на сегодня — список (cr.hire.list), по одному на кресло напарника: в трио двое, в скваде трое. Старый сейв
   хранил одного ({handle, region, fee}) — читается как список из одного. */
function ccHireList(){
  const h=CAREER && CAREER.career && CAREER.career.hire;
  if(!h || h.day!==careerToday()) return [];
  if(Array.isArray(h.list)) return h.list;
  return h.handle ? [{handle:h.handle, region:h.region, fee:h.fee||0}] : [];
}
function ccHireActive(){ return ccHireList().length>0 && ccHireAllowed(); }
function ccHireCards(){
  const list=ccHireList(), day=careerToday(), key=list.map(x=>x.handle).join('|')+'|'+day;
  if(CC_HIRE_MEMO && CC_HIRE_MEMO.key===key) return CC_HIRE_MEMO.cards;
  const cards=list.map(x=>{ try{ return ccMateCardOf({handle:x.handle, cardRegion:x.region}); }catch(e){ return null; } }).filter(Boolean);
  CC_HIRE_MEMO={key, cards};
  return cards;
}
// Ключи нанятых сегодня — их команды в мире не пересобираются (ccTrioRefill): наём на один кап, а не переход.
function ccHireKeys(){ return new Set(ccHireActive() ? ccHireList().map(x=>hKey(x.handle)) : []); }
function ccHireOvr(c){ return Math.round(c ? (c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr||c.rating||0)) : 0); }
function ccHireEarn(c, ovr){
  if(c && c.handle && (CAREER && CAREER.career && CAREER.career.year)===2026 && typeof HOME_EARN_LQ!=='undefined'){
    const k=hKey(c.handle), r=HOME_EARN_LQ.find(x=>hKey(x.n)===k); if(r && r.e>0) return r.e;
  }
  return Math.exp(CC_HIRE_FIT_A+CC_HIRE_FIT_B*ovr);
}
/* Медийка в цене (29.10, его «пусть медийка тоже влияет на цену игры»): подписчики в X (CC_XFOLLOW — настоящие у 343 про,
   иначе кривая по рейтингу ccReachOf). 50 тыс. — ×1; каждый десятикратный рост — +25%, в пределах ×0,8…×1,6: Clix (2,9 млн)
   ×1,44, Peterbot (805 тыс.) ×1,30, Sky (42 тыс.) ×0,98. Шкала — оценка режима, данных о гонорарах нет. */
function ccHireMedia(c, ovr){
  const fl=(typeof ccReachOf==='function') ? ccReachOf(ovr, c && c.handle) : 0;
  return fl>0 ? clamp(1+0.25*Math.log10(fl/50000), 0.8, 1.6) : 1;
}
function ccHireFee(ovr, c){ return Math.max(50, Math.round(ccHireEarn(c, ovr)/CC_HIRE_DAYS*ccHireMedia(c, ovr)/10)*10); }
function ccHireCands(){
  const reg=ccCareerRegion();
  const roster=(typeof ccSceneRoster==='function' && reg!=='EU') ? ccSceneRoster(reg) : careerRosterNowEU();
  const own=careerMateRecords().map(ccMateCardOf).filter(Boolean);
  const mine=new Set([hKey(CAREER.player.handle||CAREER.player.nick||'')].concat(own.map(c=>hKey(c))));
  /* Все игроки региона, не только сильнее напарника (29.10, его «пусть все игроки региона твоего будут в этом списке»):
     сверху сильнейшие, один ник — одна строка; потом — только топ CC_HIRE_TOP региона (его «возьми топ 100 каждого региона»). */
  const seen=new Set();
  return (roster||[]).filter(c=>{ if(!c || !c.handle || mine.has(hKey(c))) return false; const k=hKey(c); if(seen.has(k)) return false; seen.add(k); return true; })
    .sort((a,b)=>ccHireOvr(b)-ccHireOvr(a)).slice(0, CC_HIRE_TOP);
}
function ccHireOpen(){
  if(!ccHireAllowed()) return;
  const cr=CAREER.career, T=L(), list=ccHireCands(), got=ccHireList(), seats=careerMateSeats();
  const hired=new Set(got.map(x=>hKey(x.handle))), full=got.length>=seats;
  const rows=list.map((c, i)=>{
    const ovr=ccHireOvr(c), fee=ccHireFee(ovr, c), on=hired.has(hKey(c)), can=on || (!full && (cr.balance||0)>=fee);
    return '<div class="cc-buy'+(on ? ' own' : '')+'"><div class="cc-buy-in"><b>'+cardFlag(c, 14)+'<span class="cc-buy-nm">'+esc(c.handle)+'</span> <span class="cc-staff-rt mgf-rt">'+ovr+'</span></b>'+
      '<i class="cc-buy-who">'+esc(c.org||T.ccHireFree||'')+' · X '+esc(ccFollowText(c.handle, ovr))+'</i></div>'+
      '<span class="cc-buy-btns"><button class="'+(on ? 'cc-back' : 'ch-sign')+'"'+(can?'':' disabled')+' onclick="careerHire('+i+')">'+(on ? esc(T.ccHireCancel) : ccMoney(fee))+'</button></span></div>';
  }).join('');
  const count=seats>1 && T.ccHireCount ? '<div class="ch-hint"><b>'+esc(T.ccHireCount(got.length, seats))+'</b></div>' : '';
  document.getElementById('hirePickBody').innerHTML='<h4 class="cc-pick-h">'+esc(T.ccHireT)+'</h4>'+
    '<div class="ch-hint">'+esc(T.ccHireHint)+'</div>'+count+(rows ? '<div class="cc-buys">'+rows+'</div>' : '<p class="ch-empty">'+esc(T.ccHireNone)+'</p>');
  document.getElementById('hirePickModal').style.display='flex';
  document.addEventListener('keydown', ccHireKey);
}
function ccHireClose(){
  const m=document.getElementById('hirePickModal'); if(m) m.style.display='none';
  document.removeEventListener('keydown', ccHireKey);
}
function ccHireKey(e){ if(e.key==='Escape') ccHireClose(); }
/* Нажатие на строку: свободное кресло есть — нанять (платишь сразу, каждому своё); уже нанят — отпустить с возвратом.
   Кресла заняты все — новых не берёт, пока кого-то не отпустишь. Окно остаётся открытым, пока мест больше одного. */
function careerHire(i){
  const cr=CAREER.career; if(!ccHireAllowed()) return;
  const c=ccHireCands()[i]; if(!c) return;   // номер в том же списке, что показан в окне
  const list=ccHireList().slice(), at=list.findIndex(x=>hKey(x.handle)===hKey(c));
  if(at>=0){ cr.balance=(cr.balance||0)+(list[at].fee||0); list.splice(at, 1); }
  else {
    if(list.length>=careerMateSeats()) return;
    const fee=ccHireFee(ccHireOvr(c), c);
    if((cr.balance||0)<fee) return;
    cr.balance=(cr.balance||0)-fee;
    list.push({handle:c.handle, region:ccCareerRegion(), fee});
  }
  cr.hire=list.length ? {day:careerToday(), list} : null;
  CC_HIRE_MEMO=null;
  careerSave();
  if(careerMateSeats()>1 && list.length<careerMateSeats()) ccHireOpen(); else ccHireClose();
  careerRenderHub();
}
function careerHireCancel(){
  const cr=CAREER.career; if(!ccHireActive()) return;
  cr.balance=(cr.balance||0)+ccHireList().reduce((s,x)=>s+(x.fee||0), 0); cr.hire=null; CC_HIRE_MEMO=null;
  careerSave(); careerRenderHub();
}
/* АНАЛИТИК И ПСИХОЛОГ (его слова 8.10: «1 2 6 какие есть примеры» → «поищи ещё психологов и аналитиков» →
   «youenn не надо», «и аналитикам сделай рейтинги»). Люди настоящие, найдены 8.10.2026:
   аналитики — категория Analysts на Liquipedia и состав официальной трансляции FNCS (Liquipedia: Major 1 Summit 2026,
   GC 2025; пост @FNCompetitive о составе GC 2024), Kinch — «Official FNCS Data Provider», Osirion — сервис данных;
   психологи — AlwyzPAPPIE («Mental-life-performance mentor», бывший коуч Falcons EU), Val («Préparateur Mental &
   Physique diplômé»), Mia Stellberg (лицензированный психолог и психотерапевт, OG / SK / ENCE; аккаунта X не нашёл).
   РЕЙТИНГ. Аналитик: 60 + работа на FNCS + свои призовые + 1.5·lg(подписчики/1000) (см. CC_ANALYST_ROLE); потолок 95. Психолог: по известным фактам, а не по аудитории — у этой профессии её почти нет
   (Mia 90: лицензия и 19 лет, топ-клубы; AlwyzPAPPIE 80: про-клиенты, бывший коуч Falcons; Val 72: диплом).
   ЭФФЕКТ (оценка режима). Аналитик — разбор соперников перед вечером: +1…+3 к силе своей команды (только в одиночной
   карьере — в командной у двоих сила должна сходиться, как с эфиром, ccStreamPow). Психолог — работа с тильтом: шаг
   формы вниз после плохого вечера мягче на 25…50%. Цена в месяц от рейтинга: аналитик $1 000…2 500, психолог $800…2 500. */
const CC_STAFF2_DAYS=30;
/* Без ведущих и стола трансляции FNCS (его слово 8.10: «Leven и бродкаст FNCS убрать будто можно»): остались те, чья
   работа — анализ: официальная статистика, независимые аналитики, сервис данных. */
const CC_ANALYSTS=[
  {id:'kinch',    name:'Kinch Analytics',at:'KinchAnalytics', photo:'KinchAnalytics.jpg', x:96473,  role:'data', earn:0,  why:'Official FNCS Data Provider'},
  {id:'reisshub', name:'Reisshub',       at:'Reisshub',       photo:'Reisshub.jpg',       x:65644,  role:'indie', earn:2367, why:'Fortnite analyst'},
  {id:'osirion',  name:'Osirion',        at:'osirion_gg',     photo:'osirion_gg.jpg',     x:39270,  role:'service', earn:0, why:'Fortnite data & AI coach'}
];
const CC_PSYCHS=[
  {id:'stellberg',name:'Mia Stellberg', at:null,          photo:'MiaStellberg.jpg',              x:0,     rating:90, why:'licensed psychologist, OG / SK / ENCE'},
  {id:'pappie',   name:'AlwyzPAPPIE',   at:'AlwyzPAPPIE', photo:'AlwyzPAPPIE.jpg', x:17004, rating:80, why:'mental performance mentor, ex-coach Falcons EU'},
  {id:'val',      name:'Val',           at:'ValentaynL',  photo:'ValentaynL.jpg',  x:3072,  rating:72, why:'certified mental & physical trainer'}
];
/* Рейтинг аналитика — по результатам (его слова 8.10: «leven не настолько аналитик жёсткий», «упор на результаты»).
   Работа: официальная статистика FNCS +20, стол аналитиков трансляции FNCS +12, сервис данных +8, кастер или ведущий
   трансляции +6, независимый аналитик +4. Своя игра: 4·lg(призовые/10 000$) по Liquipedia (Vivid 26k, Blakeps 83k,
   Tocata 6k). Аудитория — 1.5·lg(подписчики/1000), почти ничего. */
const CC_ANALYST_ROLE={data:20, desk:12, service:8, host:6, indie:4};
/* Цены штаба — как у коучей (17.10, его «а другой стафф» после «цены коучей поменять»): от рейтинга по квадрату,
   дешёвый низ по карману со второго-третьего дивизиона, верх как хорошая зарплата первого. Аналитик $300…6 000
   (+1…+3 к силе — эффект сильный), психолог $250…4 000. См. ccStaffCostCurve. */
const CC_STAFF2={analyst:{list:CC_ANALYSTS, cost:[300,6000]}, psych:{list:CC_PSYCHS, cost:[250,4000]}};
function ccStaffCostCurve(lo, hi, k){
  const c=lo+(hi-lo)*k*k;
  return c<1000 ? Math.round(c/50)*50 : Math.round(c/100)*100;
}
function ccStaff2Rating(kind, p){
  if(!p) return 60;
  if(p.rating!=null) return p.rating;
  // Упор на результаты (его слово 8.10): работа на FNCS + собственные призовые (Liquipedia), аудитория — почти ничего.
  const play=p.earn>10000 ? 4*Math.log10(p.earn/10000) : 0;
  return Math.max(60, Math.min(95, Math.round(60+(CC_ANALYST_ROLE[p.role]||0)+play+1.5*Math.log10(Math.max(1000, p.x||0)/1000))));
}
function ccStaff2K(kind, p){ return Math.max(0, Math.min(1, (ccStaff2Rating(kind, p)-60)/35)); }
function ccStaff2Cost(kind, p){ const c=CC_STAFF2[kind].cost; return ccStaffCostCurve(c[0], c[1], ccStaff2K(kind, p)); }
function ccStaff2List(kind){ return CC_STAFF2[kind].list.slice().sort((a,b)=>ccStaff2Rating(kind, b)-ccStaff2Rating(kind, a) || (b.x||0)-(a.x||0)); }
function ccStaff2(kind){ const m=CAREER && CAREER[kind]; return (!m || careerToday()>m.until) ? null : m; }
function ccAnalystPow(){ const m=ccStaff2('analyst'); return (!m || ccMpOn() || ccRaceOn()) ? 0 : Math.round(1+2*Math.max(0, Math.min(1, (m.rating-60)/35))); }
function ccPsychSoft(){ const m=ccStaff2('psych'); return !m ? 0 : Math.round((0.25+0.25*Math.max(0, Math.min(1, (m.rating-60)/35)))*100)/100; }
function careerHireStaff2(kind, id, months){
  months=months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1;
  const cr=CAREER.career, who=CC_STAFF2[kind].list.find(p=>p.id===id); if(!who) return false;
  if(ccStaff2(kind) && ccStaff2(kind).id===id) return false;
  const cost=ccStaff2Cost(kind, who), due=ccOrgPays(kind) ? 0 : ccStaffTermCost(cost, months); if((cr.balance||0)<due) return false;
  cr.balance-=due;
  CAREER[kind]={id:who.id, name:who.name, at:who.at, photo:who.photo, cost, rating:ccStaff2Rating(kind, who), months,
                from:careerToday(), until:ccAddDays(careerToday(), ccStaffTermDays(months))};
  careerSave(); ccStaff2PickClose(); careerRenderHub(); return true;
}
function careerEndStaff2(kind){ if(!CAREER[kind]) return false; CAREER[kind]=null; careerSave(); careerRenderHub(); return true; }
function ccStaff2Effect(kind, rating){
  const k=Math.max(0, Math.min(1, ((rating||60)-60)/35));
  return kind==='analyst' ? L().ccAnalystPow(Math.round(1+2*k)) : L().ccPsychSoft(Math.round((0.25+0.25*k)*100));
}
function careerStaff2TileHTML(kind){
  const m=ccStaff2(kind), T=L(), K=kind==='analyst' ? 'ccAnalyst' : 'ccPsych';
  if(m) return `<div class="ch-tile">
    <h4>${T[K]}</h4>
    <div class="ch-orghead">${m.photo ? `<img class="ch-coach-av" src="${PHOTO_DIR}${esc(m.photo)}" alt="" onerror="this.remove()">` : ''}
      <b>${esc(m.name)}</b>${m.at ? `<em class="ch-agent-at">@${esc(m.at)}</em>` : ''}</div>
    <div class="ch-row"><em>${T.ccRoOvr}</em><b>${m.rating}</b></div>
    <div class="ch-row"><em>${T[K+'Does']}</em><b class="ch-goal-met">${ccStaff2Effect(kind, m.rating)}</b></div>
    <div class="ch-row"><em>${T.ccWage}</em><b>${ccNum(m.cost)}${T.ccPerSeason}</b></div>
    <div class="ch-row"><em>${T.ccCoachUntil}</em><b>${ccDayLabel(m.until)}</b></div>
    <button class="ch-swap" onclick="ccStaff2PickOpen('${kind}')">${T.ccStaffChange}</button>
    <button class="ch-swap" onclick="careerEndStaff2('${kind}')">${T.ccAgentEnd}</button>
  </div>`;
  return `<div class="ch-tile">
    <h4>${T[K]}</h4>
    <div class="ch-hint">${T[K+'Hint']}</div>
    <div class="ch-empty">${T[K+'None']}</div>
    <button class="ch-swap" onclick="ccStaff2PickOpen('${kind}')">${T[K+'Hire']}</button>
  </div>`;
}
function ccStaff2PickOpen(kind){
  const cr=CAREER.career, T=L(), K=kind==='analyst' ? 'ccAnalyst' : 'ccPsych', on=ccStaff2(kind);
  const rows=ccStaff2List(kind).map(p=>{
    const r=ccStaff2Rating(kind, p), paid=ccOrgPays(kind), cost=ccStaff2Cost(kind, p), mine=!!on && on.id===p.id, can=!mine && (paid || (cr.balance||0)>=cost);
    return `<div class="cc-buy${mine?' own':''}">
      ${p.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(p.photo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(p.name)}</span> ${ccStaffBadge(r).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${p.x ? '👥 '+ccFollowers(p.x)+' · ' : ''}${p.at ? '@'+esc(p.at) : ''}</i>
        <span class="cc-buy-chips"><em class="up">${ccStaff2Effect(kind, r)}</em><em>${esc(p.why)}</em></span></div>
      ${mine ? `<span class="cc-owned">${T.ccShopUntil(ccDayLabel(on.until))}</span>`
             : ccHireBtns(can, paid ? 0 : cost, "careerHireStaff2('"+kind+"','"+p.id+"')", "careerHireStaff2('"+kind+"','"+p.id+"',12)", paid ? L().ccOrgPays(esc(CAREER.org.name)) : null)}
    </div>`;
  }).join('');
  document.getElementById('staff2PickBody').innerHTML=`<h4 class="cc-pick-h">${T[K]}</h4><div class="ch-hint">${T[K+'Hint']}</div><div class="cc-buys">${rows}</div>`;
  document.getElementById('staff2PickModal').style.display='flex';
  document.addEventListener('keydown', ccStaff2PickKey);
}
function ccStaff2PickClose(){ const m=document.getElementById('staff2PickModal'); if(m) m.style.display='none'; document.removeEventListener('keydown', ccStaff2PickKey); }
function ccStaff2PickKey(e){ if(e.key==='Escape') ccStaff2PickClose(); }
function careerEndSmm(){
  if(!CAREER.smm) return false;
  CAREER.smm=null;
  careerSave();
  careerRenderHub();
  return true;
}
/* raw is for a figure that is a floor rather than a gain: see the note above. */
function careerReachAdd(n, raw){
  const cr=CAREER.career;
  const was=cr.reach||0;
  // Репутация двигает рост аудитории: +25 репутации = на 25% больше новых, -25 = на 25% меньше (22.11, ccRepReachMult).
  const add=raw ? n : n*(1+ccSmmBoost())*(n>0 ? ccRepReachMult() : 1);
  cr.reach=Math.max(0, Math.round(was+add));
  // Часть новых читателей X идёт и на Twitch, см. CC_TW_FROM_X.
  const got=cr.reach-was;
  if(got>0) cr.twitch=Math.min(CC_TW_CEIL, (cr.twitch||0)+Math.round(got*CC_TW_FROM_X));
  return got;
}
/* What a result is worth to the audience.

   Results always fed this — the cup, the Weekly Final, the Majors, Paris — but
   the curve was cubed, so it paid for a near-win and for nothing else: a
   Division 5 night in the middle of the room was fifteen followers against
   twenty for a day of streaming, and the player's own reading was that only
   streams grow it.

   Softer, and worth more. At 2.2 a third of the way up the room still pays,
   and the nine puts a good night ahead of a day at the desk rather than level
   with it: in Division 5 a win is 180 against a stream's 20, the cut is 150,
   a third of the room is 74. Which is the shape it should have — a career is
   followed for playing well, and the stream is what fills the days between. */
/* Audience multiplier by what the event pays:
     div cup x1, Victory Cup / Perf Eval x0.5, Reload stage x1.5, Weekly Final ($10k) x2.5, Major final ($120k) x5,
     GC Last Chance x6, Reload Championship ($260k of $1.02M) x8, Summit final ($250k of $1.29M) x9, Globals ($2M) x14.
   Summit and Globals are not in a career year yet (year ends 23 Aug, Antwerp is 26-27 Sep) but are weighted already. */
const CC_REACH_EVENT={cup:1, final:2.5, victory:0.5, eval:0.5, reload:1.5,
                      major:5, gc:6, rc:8, summit:9, globals:14,
                      // Про-Ам — показательный вечер: смотрят его много, но
                      // главное там не место, а с кем ты сидишь (см. ccProAmReachFrom).
                      proam:4};
function careerReachResult(place, of, div, kind){
  if(!(of>1)) return 0;
  const beat=clamp(1-(place-1)/(of-1), 0, 1);
  const w=CC_REACH_EVENT[kind]!=null ? CC_REACH_EVENT[kind] : 1;
  return Math.round(Math.pow(beat,2.2)*CC_REACH_DIV(div)*9*w);
}
// Going up a rung is the thing people actually follow you for, and it happened
// silently: the cup that promoted you paid its own placing and nothing for the
// promotion. A rung is worth a fortnight of streaming in the room it lands in.
//
// And Division 1 carries a floor. Nobody is in that room unknown — it is 300
// people the scene watches every week — so arriving there tops the count up to
// ten thousand if a quiet career got there on results alone. Nothing is ever
// taken away again: falling out of the division does not unfollow anybody,
// which is the same rule the rest of this number lives by.
const CC_REACH_D1=10000;
function careerReachPromote(newDiv){
  const got=careerReachAdd(CC_REACH_DIV(newDiv)*12);
  if(newDiv===1 && careerReach()<CC_REACH_D1) return got+careerReachAdd(CC_REACH_D1-careerReach(), true);
  return got;
}
// K and M, the way a profile writes them.
/* Money and counts, written the way the reader’s own language writes them.

   Every amount in this file was built as "$" + n.toLocaleString("en-US"), which
   is right in English and wrong in French: there a sum is 120 000 $, with a
   space between the thousands and the sign after the number. Eighty-eight places
   did it by hand, so they now go through here instead.

   Russian is left on the English shape deliberately. It has been reading
   $120,000 since the mode was built and nobody asked for that to move; changing
   it would be a change to a language that is already finished, made in passing
   while adding a third. One line here does it whenever it is wanted. */
function ccMoney(n){
  const v=Math.round(Number(n)||0);
  return LANG==="fr" ? v.toLocaleString("fr-FR")+" $" : "$"+v.toLocaleString("en-US");
}
// A plain count — no currency, same grouping rule.
// Очки в кадре: сумма недель бывает дробной (57.599999999999994), показываем до десятых.
function ccShotPts(v){ return typeof v==='number' ? ccNum(Math.round(v*10)/10) : (v==null ? '' : v); }
function ccNum(n){
  return (Number(n)||0).toLocaleString(LANG==="fr" ? "fr-FR" : "en-US");
}
function ccFollowers(n){
  n=Math.max(0, Math.round(n||0));
  if(n<1000) return String(n);
  if(n<100000) return String(Math.round(n/100)/10).replace(/\.0$/,'')+'K';
  if(n<1000000) return Math.round(n/1000)+'K';
  return String(Math.round(n/100000)/10).replace(/\.0$/,'')+'M';
}
// A number that is the same every time the same post is drawn.
function ccHashStr(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return Math.abs(h);
}
/* The numbers under a post.

   Derived rather than dealt out: views come off the audience the account had on
   the day it posted, and everything else comes off views in the proportions a
   real timeline holds — a couple of percent of the people who see something like
   it, a tenth of those repost, slightly more reply.

   The follower count is stamped onto the entry when it is written, so a post
   from February keeps February's audience instead of growing every time the
   screen is redrawn. Entries written before followers existed read the count as
   it stands now, which is the only answer available to them.

   The scene's own account has its own audience and does not care how big the
   player is. */
const CC_PRESS_REACH=120000;
// What a name on the roster is read by. Invented like the player's own count and
// on the same scale, so that a career catching up with Division 1 catches up
// with its audience too: a 96 sits around fifty thousand, a 70 around twelve.
/* Followers: real X numbers where known, otherwise the rating curve.
   Audience doesn't track rating: Sky 31k, Scroll 39k, Malibuca 403k while rated 5 lower;
   Cr1nge is 95 with ~6k, Mongraal ~2.5M.
   Read in August 2026, rounded to the hundred like the source; static, never updated. */
/* 8.10.2026 (его слово «у игроков тоже можно писать фоловеров»): +321 человек и свежие числа у
   прежних. Адрес X — из инфобокса игрока на Liquipedia (tools/fetch-liqui-twitter.js: ссылка с его же страницы —
   доказательство, что аккаунт его, а не тёзки), число — api.fxtwitter.com в тот же день. Топ-420 по рейтингу:
   у 367 адрес есть, у 343 профиль ответил. */
const CC_XFOLLOW={
  "1lusha":17606, "4zr":197248, "916gon":42447, "acorn":582685, "ajay":4790, "ajerss":115746, "aminished":9889,
  "anas":283485, "andilex":261658, "aoxy":2610, "ark":22761, "arkhram":202881, "artor":63337, "asianjeff":147641,
  "aspect":76804, "assault":88647, "astrosmz":39921, "av":45746, "avery":5772, "avivv":33544, "axeforce":13761,
  "ayarbaffo":57822, "baackup":321, "bacca":7504, "badsniper":144008, "barroso":79667, "belaeu":4917,
  "belusi":28931, "benjyfishy":2250255, "bevvys":19407, "bizzle":600143, "blake":236181, "blakeps":236180,
  "boltz":423586, "boyer":63099, "braydz":19507, "brycx":8527, "bucke":669972, "bugha":1968808, "bully":78552,
  "bylah":12818, "cadu":101961, "casperinovic":5121, "cazz":28641, "ceice":185618, "cented":822979,
  "chap":578409, "chapix":185622, "charyy":25401, "cheapz":6880, "chico":29770, "chimp":6727, "chris":8641,
  "chubs":10266, "cinxz":656, "cizlucky":8571, "clement":76759, "clix":2862623, "cofts":815, "cold":504903,
  "commandment":131505, "convic":3902, "coop":119806, "cooper":453714, "cr1nge":10265, "cringe":21690,
  "crr":487872, "crue":29633, "crunchy":5695, "curly":13395, "curve":31270, "czb":5605, "dabuel":7107,
  "darkos":4090, "darm":26466, "death":27614, "decyptos":98012, "degen":54854, "demus":27432, "deroller":18974,
  "derox":8497, "deyy":303081, "diguera":143577, "dks":44156, "domentos":32475, "domo":2102, "dubs":683013,
  "edgey":300023, "edroadtoglory":111608, "edson":34631, "elitxe":10709, "elokratz":11393, "endretta":253063,
  "enough":5673, "eomzo":468786, "epikwhale":822027, "f1n4ik":6822, "faded":16021, "falconer":29576,
  "fastroki":60011, "fatch":14109, "favs":42738, "fazer":73742, "fishy":58687, "flickzy":65734, "flikk":150943,
  "focus":18900, "fredoxie":62842, "frenzyfishy":4377, "froggy":6069, "fryst":24651, "g13ras":25299,
  "gabzera":17459, "glubschi":10170, "gmoney":44574, "golden":3670, "gripey":22316, "grolzz":12353,
  "hazthagreat":31968, "hellfire":32484, "hen":255218, "higgs":481951, "hijoe":29254, "hottie":8447,
  "howly":9959, "hris":16275, "ibooohai":19251, "idrop":449550, "inact":4622, "itemm":33073, "izzi":10705,
  "jahlyn":12423, "jahq":62003, "jamper":115601, "jannisz":426130, "japko":40621, "jaxenj":1843, "jayrosez":2114,
  "jayse1x":4118, "joji":54372, "jojofishy":1977, "josh":31411, "justice":14078, "juu":44020, "k1ng":571598,
  "k1nzell":147187, "kacpi":1514, "kami":269341, "kaxie":4270, "kbr":48476, "kefyy":25383, "khanada":888117,
  "kiduoo":17474, "king":239077, "kingaling":11145, "kiox":959, "kiro":12564, "kiryache32":106911,
  "kitoz":116773, "klass":15957, "klown":7932, "knight":50167, "kraez":16971, "krisp":6220, "kubx":97434,
  "kwah":11433, "kwanti":268001, "kylie":64020, "larson":33635, "letw1k3":4, "lewa":16742, "louis":38845,
  "m0ne":2121, "mackwood":282346, "malibuca":639254, "mappi":18302, "mariuscow":70761, "matsoe":140,
  "megga":566083, "mero":443652, "merstach":532789, "mikson":46036, "milan":114795, "minori":4800, "miro":66766,
  "mitr0":918573, "momsy":21212, "mongraal":2615770, "motor":229015, "mrsavage":1886231, "muz":578082,
  "mydro":2441, "naekoz":33693, "nanolite":15778, "nate":10784, "nayte":243112, "nebs":44035, "night":28693,
  "nikof":406390, "noahreyli":364458, "noxy":13065, "npen":62730, "nxthan":19589, "nyhrox":308687, "okis":122488,
  "oliverog":93178, "on1":19, "opai":81546, "osp":25, "osydd":7036, "ozone":7403, "p1ng":30128,
  "pablowingu":60143, "pamstou":24819, "panzer":39636, "paper":138544, "parz":9717, "persa":175512,
  "peterbot":805096, "pgod":312807, "phoenix":3282, "phzin":119557, "pingu":28566, "pinq":224042, "pixie":100549,
  "pixx":27374, "plege":9378, "podasai":111700, "pollo":183263, "prism":9961, "psalm":68866, "pulga":293533,
  "putrick":58384, "pxmp":61377, "queasy":401056, "raifla":49189, "rakso":50217, "rapid":389520, "ratgun":1256,
  "rax":31688, "rays":7209, "redlee":39797, "redrush":5339, "reet":372242, "refsgaard":187404, "rehx":87373,
  "resypical":7050, "retro":3137, "reverse2k":162592, "revised":11747, "rezon ay":534695, "rhux":11011,
  "rise":128868, "ritual":416839, "rocaine":22768, "rogueshark":33539, "rojo":37060, "romero":15617,
  "ronaldo":6972, "s1ned":12965, "saf":353310, "salko":7616, "salt":2524, "sangild":7072, "scarpa":29637,
  "scroll":45286, "setty":622813, "seyyto":23947, "shadow":17652, "shamokiy":20745, "shxrk":129755,
  "silxzys":2191, "skite":252193, "skqttles":41715, "skram":63951, "skvii":8998, "sky":42471, "skyjump":19414,
  "slackes":50413, "smite":9817, "snap":277, "snayzy":144419, "source":4036, "spayde":30266, "sphinx":35834,
  "stompy":134797, "stormyrite":98461, "stretch":425748, "stryker":14166, "swag":14109, "swizzy":140033,
  "sxhool":5897, "t3eny":95612, "tabzg":23970, "tahi":55943, "tayson":572204, "tchub":2088, "teeq":100809,
  "teqqz":4037, "teyo":11137, "th0mashd":687295, "thevic":189496, "threats":70163, "till":5783, "tisco":13895,
  "tjino":52628, "tohaj":9794, "toose":90947, "tragix":4965, "trashy":14227, "trippernn":81417, "trulex":89830,
  "tschinken":113375, "turtle":4605, "twainz":434, "twek":5164, "twi":18335, "umplify":63929, "upl":12787,
  "userz":11692, "vadeal":387242, "vanyak3kk":78594, "veno":301038, "vergo":36380, "verox":116069, "vert":24256,
  "vexi":5507, "vic0":499090, "victerv":21988, "visxals":14681, "volko":13315, "whofishy":54466,
  "wolfiez":511075, "wox":36015, "xavi":1112, "xccept":10262, "xeat":45055, "xenon":553, "xoonies":14177,
  "xsweeze":117052, "yumi":15650, "zandy":63379, "zayt":511800, "zookez":4754
};
function ccFollowOf(handle){
  const v=CC_XFOLLOW[String(handle||'').toLowerCase()];
  return v>0 ? v : null;
}
function ccReachOf(ovr, handle){
  const real=ccFollowOf(handle);
  if(real) return real;
  const o=Math.max(55, Math.min(99, ovr||72));
  /* Выдуманный игрок рейтинга 80 — ≈5 тыс. подписчиков, 90 — ≈8 тыс. (было 25 и 41 тыс.: LFD-твит неизвестного собирал
     по 300 лайков). У настоящих — их настоящее число из CC_XFOLLOW выше. 16.10. */
  return Math.round(40*Math.pow(o-55, 1.5));
}
/* Подписчики человека на экране (его слово 8.10: «у игроков тоже можно писать фоловеров»): настоящее число из
   CC_XFOLLOW, иначе — та же кривая по рейтингу, что считает просмотры ленты, со знаком «≈». */
function ccFollowText(handle, ovr){
  const real=ccFollowOf(handle);
  return real ? ccFollowers(real) : '≈'+ccFollowers(ccReachOf(ovr, null));
}
const CC_POST_W={good:1, flat:0.42, bad:0.72};
function ccPostStats(e, who){
  const f = who.you ? (e.f!=null ? e.f : careerReach())
          : who.f>0 ? who.f   // свой счёт подписчиков у аккаунта (слухи, опросы — 16.10)
          : who.verified ? CC_PRESS_REACH
          : ccReachOf(who.ovr, who.name);
  const w = CC_POST_W[e.kind]!=null ? CC_POST_W[e.kind] : 0.5;
  const jit = 0.82 + (ccHashStr((e.k||'')+'|'+(e.day||'')+'|'+((e.a||[]).join(','))+'|'+(e.text||''))%37)/100;
  /* ОХВАТ ПАДАЕТ С РАЗМЕРОМ АККАУНТА (16.10, «сделай реалистичней»). Было f×(0.35…1.5): у Merstach (530 тыс.) недельный
     кап собирал 660 тыс. просмотров и 14,6 тыс. лайков, подкол Chap'а — 395 тыс. и 8,7 тыс. На живом X маленький
     аккаунт добирает до своего числа подписчиков, большой — 10–30 %: 0.9 × (f/5000)^−0.35, не ниже 0.08. */
  const share = Math.max(0.08, Math.min(0.9, 0.9*Math.pow(Math.max(1, f)/5000, -0.35)));
  const views = Math.round(f*share*(0.35+1.15*w)*jit);
  const likes = Math.round(views*0.022);
  /* Ответов — одна двадцатая от лайков, репостов — одна двенадцатая.

     Стояло 16% и 12%: у Малибуки под победой выходило две тысячи ответов на
     двенадцать тысяч лайков, у аккаунта сцены семьсот под «happy birthday».
     На живом X (сентябрь 2026, @MalibucaFN, @FNCompetitive, посты LFD) на
     десять тысяч лайков приходится сто-триста ответов, под LFD в двести лайков
     — десять-двадцать. Пост, который собрал хоть немного лайков, получает
     хотя бы один ответ: иначе у молодой карьеры под постом пусто. */
  const replies = likes>=3 ? Math.max(1, Math.round(likes*0.05)) : 0;
  return {views, likes, reposts:Math.round(likes*0.08), replies};
}
/* Клуб как автор поста.

   Правка двумя строками: «фортнайт не должен ниче писать про
   орги» и «когда подписывают тебя, орга постит это от своего ника со своей
   аватаркой». Раньше подписания, продления, увольнения и повышения выходили
   под именем Fortnite Competitive — аккаунт сцены, который в жизни про
   ростер-муву чужого клуба не пишет; пишет сам клуб.

   Галочка у клуба стоит: это официальный аккаунт организации. Герб берётся тем
   же путём, что и на карточках (clubLogoFile), и если файла нет — кружок
   останется с инициалами, как у всякого автора без картинки. */
function ccOrgBy(name){
  if(!name) return null;
  return {name:String(name), handle:ccHandle(String(name)), verified:true,
          logo:clubLogoFile(String(name))};
}
/* Имя клуба из аргумента старой записи — если это действительно клуб.

   Аргумент приходит из сейва, то есть из чего угодно: числа, пустой строки,
   тега. Клубом он считается, только если такой клуб в сцене есть — иначе пост
   уйдёт по общему правилу, а не подпишется выдумкой. */
function ccPostOrgName(v){
  const s=(v==null ? '' : String(v)).trim();
  if(!s) return null;
  const pool=(typeof careerOrgPool==='function') ? careerOrgPool() : [];
  const hit=(pool||[]).find(o=>String(o && o.name).toLowerCase()===s.toLowerCase());
  return hit ? hit.name : null;
}
/* Строки, которые пишет клуб, и в каком аргументе стоит его имя.

   Записи о трансферах приходят с автором (opt.by, см. ccOrgBy) — но только те,
   что написаны ПОСЛЕ того, как клубы научились постить сами. В сейве, который
   играется с тех пор, лежат старые записи без автора, и они падали на карту
   CC_POST_BY, где эти ключи помечены 'press'. Отсюда скриншот:
   Fortnite Competitive с галочкой пишет «BIG продлевает контракт», и отзыв
   к нему — «фортнайт не должен ниче писать про орги».

   Имя клуба в такой записи никуда не девалось: оно стоит в аргументах строки,
   потому что строка его печатает. Значит автора можно достать оттуда же и
   старым записям — герб и ник подтянутся как у новых. У ccNewsLeft клуб,
   который подписал, стоит вторым: первым идёт тот, откуда ушли. */
const CC_ORG_POST_ARG={
  ccNewsSigned:0, ccNewsSignedDuo:0, ccNewsSignedAcademy:0,
  ccNewsReleased:0, ccNewsExtended:0, ccNewsPromotedRoster:0, ccNewsRaise:0,
  ccNewsLeft:1, ccNewsTransfer:1, ccNewsOrgYear:0,
  // Победу своего человека клуб празднует сам — см. careerD1Posts.
  ccPostOrgWin:0
};
function ccPostAuthor(e){
  if(e.by) return {name:e.by.name, handle:e.by.handle||ccHandle(e.by.name),
                   verified:!!e.by.verified, card:e.by.card||null, ovr:e.by.ovr, f:e.by.f||0,
                   // Герб клуба едет с автором: без этой строки аватарка
                   // организации оставалась кружком с инициалами.
                   logo:e.by.logo||null};
  // Запись клуба без автора — это запись, написанная до правки. Клуб в ней
  // назван, и подписать её им же честнее, чем отдать прессе.
  {
    const at=CC_ORG_POST_ARG[e.k];
    if(at!=null){
      const org=ccPostOrgName((e.a||[])[at]);
      if(org) return ccOrgBy(org);
    }
  }
  /* A line nobody assigned belongs to the player, not to the scene.

     This defaulted to 'press', which is the wrong way round and kept being
     wrong: every key added since — the day events, the interviews, anything
     built at run time like 'ccDayEv'+id+'Take' — turned up under Fortnite
     Competitive's name the moment it was written, and the account ended up
     posting "scrimmed the evening with a stronger squad" and "Evaluation:
     #79 in Round 1" as if it were reporting on itself.

     The scene's account is an opt-in list. CC_POST_BY names what it covers;
     everything else is somebody talking about their own week, which is who
     actually posts those things. */
  let who=CC_POST_BY[e.k]||'you';
  /* 'arg0' — говорит человек сцены, и его имя лежит первым аргументом строки.

     Отзыв скриншотом: пост «@jut: я больше не в дуо с @lr8.
     LFD 🙏» стоял под аккаунтом Fortnite Competitive — «это не должны фортнайт
     писать, игроки только». Строка написана от первого лица и начиналась с
     собственного ника, потому что автором была сцена; теперь автор — сам jut,
     а ник из текста убран (см. локали). То же у поздравлений с днём рождения и
     у трёх строк про бан: их тоже говорят люди, а не аккаунт. */
  if(who==='arg0'){
    const h=String(((e.a||[])[0])||'').trim();
    if(h){
      /* По индексам ника, а не перебором: PLAYERS.find по шестидесяти тысячам карточек
         на каждый такой пост и на каждую перерисовку вешал хаб на телефоне на секунду
         (профиль при CPU ×6: ccPostAuthor — 1,9 с из 2 с отрисовки «Центра»). */
      const hk=hKey(h);
      const card=ccNowByKey(ccSceneRoster(ccCareerRegion())).get(hk) ||
                 ((ccCardsByKey().get(hk)||[])[0]) || null;
      return {name:h, handle:ccHandle(h), verified:false, card:card,
              ovr: card ? (card._ovr!=null?card._ovr:(attrsFor(card)||{}).ovr) : null};
    }
    who='you';
  }
  // 'by' значит «автор приходит с записью». Записи без него здесь уже нет
  // (её перехватил бы e.by выше), так что это страховка: пост без автора —
  // пост игрока, как и всякая неназванная строка.
  if(who==='by') who='you';
  // Разбор пишет аналитик и только он: это его формат, не пресса и не игрок.
  if(who==='analyst') return Object.assign({}, CC_ANALYST);
  if(who==='press' && !ccPressWorthy(e)) who='you';
  if(who==='you'){
    const pl=CAREER.player;
    // A career player uploads their own portrait; photoURL reads it off _photo.
    // A career played as a taken card wears that card's portrait instead —
    // careerCard is the roster card, so the photo is the one on the card.
    return {name:pl.nick, handle:ccHandle(pl.nick), verified:false, you:true,
            card: pl.photo ? {_photo:pl.photo} : careerCard()};
  }
  if(who==='mate'){
    const mate=careerPartnerCard();
    if(mate) return {name:mate.handle, handle:ccHandle(mate.handle), verified:false, card:mate,
                     ovr:(mate._ovr!=null?mate._ovr:(attrsFor(mate)||{}).ovr)};
  }
  return {name:CC_PRESS.name, handle:CC_PRESS.handle, verified:true, av:CC_PRESS.av};
}
/* An @ off a nickname. It used to be replace(/s+/g,''), which strips the letter
   s rather than the spaces — Ghost posted as @ghot.

   Reduced to what an @ can actually hold, because roster names carry things no
   handle ever does: "flc sǃ", "ihminen ʕᵒᴥᵒʔ", "Phaпtom2x". A mention is picked
   out of a finished post as far as the first character that cannot be in one, so
   leaving them in printed half a blue name with a loose symbol trailing it.
   A name that is nothing but such characters keeps what it had — better a
   strange handle than an empty one. */
function ccHandle(nick){
  const h=String(nick||'').toLowerCase().replace(/[^a-z0-9_]+/g,'');
  return h || String(nick||'').replace(/\s+/g,'').toLowerCase();
}
// The person out of the pair. Team names in this app are "A + B".
function ccOneOf(team){ return String(team||'').split(/\s*[+&]\s*/)[0].trim() || String(team||''); }
// The initials stay under the photo rather than instead of it: a portrait that
// fails to load removes itself and leaves the letters that were always there.
function ccAvatar(a){
  // Лицо берётся с карточки, а у аккаунта сцены карточки нет — у него свой
  // файл (CC_PRESS.av). Инициалы под картинкой остаются: если файл не отдался,
  // <img> снимает себя сам и кружок читается, как читался.
  /* У клуба лица нет — у него герб, и лежит он в другой папке. Правка: «когда подписывают тебя, орга постит это от своего ника со
     своей аватаркой». Поэтому автор может принести logo вместо card. */
  const url=a.card ? photoURL(a.card)
          : a.logo ? LOGO_DIR+a.logo
          : (a.av ? PHOTO_DIR+a.av : null);
  return `<span class="x-av${a.you?' x-av-you':''}">`+
    (url ? `<img src="${esc(url)}" alt="" onerror="this.remove()">` : '')+
    `${esc((a.name||'?').slice(0,2).toUpperCase())}</span>`;
}
// The standings as an attachment. Five rows is what fits in a screenshot before
// anybody stops reading, and the poster's own row is pinned in if it falls below
// them — the point of posting a table is being in it.
/* Доска лидеров как ВЛОЖЕНИЕ, а не строкой текста.
   Отзыв: «делай как у кинча реал». У Кинча это картинка-таблица: слева
   показатель, справа число и ник. Здесь та же карточка, что уже носит таблицу
   этапа (.x-shot), только колонки свои. Своя строка подсвечивается — как и в
   таблице этапа: смысл доски в том, чтобы искать на ней себя. */
function ccLeadHTML(lead){
  if(!lead || !lead.rows || !lead.rows.length) return '';
  const me=ccHandle((CAREER.player && CAREER.player.nick) || '');
  const rows=lead.rows.map(r=>{
    const who=String(r[2]||'');
    /* Своя карточка (lead.mine): справа не лидер, а место в лобби, и
       подсвечено то, где игрок первый. */
    const mine=lead.mine ? !!r[4] : who.toLowerCase()===String(me).toLowerCase();
    const ico=CC_LEAD_ICO[r[0]] || '';
    const flag=r[3] ? flagImg(r[3], 11) : '';
    return `<div class="x-shot-r x-lead-r${mine?' me':''}">`+
           `<b><span class="x-lead-ico">${ico}</span>${esc(L()[r[0]]||r[0])}</b>`+
           `<em>${esc(String(r[1]))}</em><i>${lead.mine ? esc(who) : flag+'@'+esc(who)}</i></div>`;
  }).join('');
  return `<div class="x-shot"><div class="x-shot-h"><span>${esc(lead.cap||'')}</span>`+
         `<span>${lead.mine ? '@'+esc(me) : '<span class="x-lead-ico">🔥</span>'+esc(L().ccLeadCap)}</span></div>${rows}</div>`;
}
/* ВИД СКРИНА ТАБЛИЦЫ (Notion 27.10, его «сделай эту таблицу как в игре и как в симуляции, смотря какой турнир»).
   Скрин в посте рисуется тем же видом, что живая таблица этого вечера (ccEvPaletteApply): 2026-й — бирюзовая таблица
   симуляции, прошлые годы — экран турнира из игры тех лет в палитре события. Вид пишется в запись в момент поста:
   год карьеры потом сменится, а скрин останется таким, каким был. Старые записи без вида — прежний тёмный скрин. */
function ccShotLook(){
  try{
    if(typeof CAREER==='undefined' || !CAREER || !CAREER.career) return null;
    if(ccCalYear()>=2026) return {k:'sim'};
    const root=document.documentElement, s=root.style;
    let l=s.getPropertyValue('--ev-l').trim(), r=s.getPropertyValue('--ev-r').trim(), h=s.getPropertyValue('--ev-h').trim(),
        lt=root.classList.contains('ev-light');
    if(!root.classList.contains('ev-classic') || !l){
      const d=careerToday(), n=ccSeasonNumOn(d);
      const p=ccEvPalette({id:''}, d) || (n<=9 ? ccEvPalOf('OnlineOpen_Week1') : null);
      if(!p) return {k:'sim'};
      l='#'+p[0]; r='#'+p[1]; h='#'+(p[2]||'FFE600'); lt=ccEvLight(p);
    }
    let rg=''; try{ rg=regionName(ccCareerRegion()); }catch(e){}
    return {k:'cl', l, r, h, lt:lt?1:0, rg};
  }catch(e){ return null; }
}
// Скрин в виде таблицы вечера: колонки как в симуляции (место, команда, очки, матчи, победы, киллы), без сводки Tracker.
function ccShotLookHTML(tbl){
  const lk=tbl.lk, cl=lk.k==='cl';
  const flags=r=>(r.f||[]).map(n=>flagImg(n, 12)).join('');
  const meK=tbl.me ? hKey(tbl.me) : null;
  const line=(r, extra)=>{
    const cls=(r.p===1?' win':'')+(meK && hKey(r.n)===meK ? ' me' : '')+(tbl.cut && r.p===tbl.cut ? ' cut' : '')+(extra||'');
    return `<div class="x-shot-r${cls}"><i>#${r.p}</i><b>${flags(r)}${esc(r.n)}</b><em>${ccShotPts(r.s)}</em>`+
      `<u>${r.m!=null?r.m:''}</u><u>${r.w!=null?r.w:''}</u><u>${r.e!=null?r.e:''}</u></div>`;
  };
  // Своя строка внизу — только когда её нет в кадре, как в живой таблице.
  const pinIn=tbl.pin && tbl.rows.some(r=>r.p===tbl.pin.p);
  const rows=tbl.rows.map(r=>line(r, '')).join('')+(tbl.pin && !pinIn ? line(tbl.pin, ' pin') : '');
  const sty=cl ? ` style="--sl:${esc(lk.l)};--sr:${esc(lk.r)};--sh:${esc(lk.h||'#FFE600')}"` : '';
  const cap=esc(tbl.cap||L().ccShotCap(tbl.div))+(tbl.mode?' · '+esc(tbl.mode):'');
  const cut=tbl.cut && tbl.cutPts!=null ? esc(L().ccShotCut(tbl.cut, ccNum(tbl.cutPts))) : '';
  const head=cl
    ? `<div class="x-lk-cap"><b>${cap}</b>${lk.rg ? `<span>(${esc(lk.rg)})</span>` : ''}${cut ? `<small>${cut}</small>` : ''}</div>`
    : `<div class="x-shot-h"><span>${cap}</span><span>${cut || L().ccShotPts}</span></div>`;
  return `<div class="x-shot x-lk x-lk-${cl?'cl':'sim'}${cl && lk.lt?' x-lk-lt':''}"${sty}>${head}
    <div class="x-shot-rows">
      <div class="x-shot-r x-shot-head"><i>#</i><b>${L().ccTableTeam}</b><em>${L().ptsHeader}</em>
        <u>${L().matchesWord}</u><u>${L().winsWord}</u><u>${L().killsHeader}</u></div>
      ${rows}
    </div>
  </div>`;
}
function ccShotHTML(tbl){
  if(!tbl || !tbl.rows || !tbl.rows.length) return '';
  if(tbl.lk && tbl.rows.some(r=>r.m!=null)) return ccShotLookHTML(tbl);
  /* Старые записи в сейве несут только место, имя и очки — у них колонок
     меньше, и таблица просто рисуется без них. */
  const wide=tbl.rows.some(r=>r.m!=null);
  /* Строка как в таблице игры: флаги перед ником (по картам состава), очки
     сразу за ником, потом матчи, победы, элимы. Своя строка — жёлтой рамкой и
     ещё раз внизу (pin), как в кадре из твита Th0masHD, 3 сентября. */
  const flags=r=>(r.f||[]).map(n=>flagImg(n, 12)).join('');
  const line=(r, extra)=>{
    const cls=(r.p===1?' win':'')+(tbl.me && hKey(r.n)===hKey(tbl.me) ? ' me' : '')+(extra||'');
    return `<div class="x-shot-r${cls}"><i>#${r.p}</i><b>${flags(r)}${esc(r.n)}</b>`+
      (wide ? `<u>${r.m!=null?r.m:''}</u><u>${r.w!=null?r.w:''}</u><u>${r.e!=null?r.e:''}</u>` : '')+
      `<em>${ccShotPts(r.s)}</em></div>`;
  };
  const rows=tbl.rows.map(r=>line(r, '')).join('')+
    (tbl.pin ? line(tbl.pin, ' pin') : '');
  /* Сводка справа — та же, что на странице Tracker: большое число очков и под
     ним шесть строк. Есть она только тогда, когда есть журнал игр. */
  const s=tbl.sum;
  const side=s ? `<div class="x-shot-side">
      <div class="x-shot-pts"><b>${ccNum(tbl.pts||0)}</b><span>${L().ptsHeader}</span></div>
      <div class="x-shot-sum">
        <span>${L().ccShotVr}<b>${s.vr}</b></span>
        <span>${L().ccShotTop5}<b>${s.t5}</b></span>
        <span>${L().ccShotTop10}<b>${s.t10}</b></span>
        <span>${L().killsHeader}<b>${s.e}</b></span>
        <span>${L().avgElimsWord}<b>${s.ae}</b></span>
        <span>${L().avgPlaceWord}<b>${s.ap}</b></span>
      </div></div>` : '';
  // A screenshot of a Major carries the Major's name, not a division caption.
  /* Широкая сетка колонок включается по КОЛОНКАМ, а не по сводке: у поста без
     журнала игр сводки нет, а матчи, победы и киллы есть — и заголовок тогда
     ехал по узкой сетке, обрезая «MATCHES» до «MATC…». */
  return `<div class="x-shot x-shot-g${wide?' x-shot-wide':''}${s?' x-shot-sum-on':''}">
    <div class="x-shot-h"><span>${esc(tbl.cap||L().ccShotCap(tbl.div))}${
      tbl.mode?' · '+esc(tbl.mode):''}</span><span>${
      tbl.cut && tbl.cutPts!=null ? esc(L().ccShotCut(tbl.cut, ccNum(tbl.cutPts))) : L().ccShotPts}</span></div>
    <div class="x-shot-body">
      <div class="x-shot-rows">
        ${wide ? `<div class="x-shot-r x-shot-head"><i>#</i><b>${L().ccTableTeam}</b>
          <u>${L().matchesWord}</u><u>${L().winsWord}</u><u>${L().killsHeader}</u>
          <em>${L().ptsHeader}</em></div>` : ''}
        ${rows}
      </div>
      ${side}
    </div>
  </div>`;
}
/* Статус, био и PR-карточка, как в живой ленте про-сцены (@ScrollSZN, LFD/LFT, доска LFP у Tracker).
   Статус живёт в нике («F/A Zhelix 🇫🇷 (lfd div 1)»), к объявлению прикладывается PR-карточка или таблица
   вечера, био = карточка карьеры («17 🇩🇰 | Fortnite for @AGGlobalEsports | 2x FNCS WINNER | 350k$+»).
   Всё из сейва: CAREER.splits, CAREER.lft, ростер сезона, CAREER.titles (пишет careerD1Posts),
   careerPrTally. */
function ccWhoCard(handle){
  if(!handle) return null;
  const k=hKey(handle);
  const pl=CAREER && CAREER.player;
  if(pl && pl.handle && hKey(pl.handle)===k) return null;   // свой — не из ростера
  // Индексами ника, а не перебором всех карточек (см. ccPostAuthor).
  return ccNowByKey(ccSceneRoster(ccCareerRegion())).get(k) ||
         ((ccCardsByKey().get(k)||[])[0]) || null;
}
// Когда человек остался один: последняя запись о его разводе. Ключ книги —
// «а+б» из ccSeatKey, поэтому ищется вхождение половинки.
function ccWhoAloneSince(handle, memo){
  const k=hKey(handle);
  let last=null;
  Object.keys(memo||{}).forEach(function(key){
    if(key.split('+').indexOf(k)<0) return;
    if(!last || memo[key]>last) last=memo[key];
  });
  return last;
}
/* С кем человек играет СЕГОДНЯ.

   Не ccRealMateOf: тот читает ростер Epic, то есть пару, с которой человек
   начал год, и про разводы не знает вовсе — по нему свободных агентов в мире
   не бывает. Настоящий ответ у careerPools: там пары уже пересобраны, половинки
   распавшихся стоят врозь, а трансферы сведены заново. */
function ccPairMateOf(handle){
  return ccSquadMatesOf(handle)[0] || null;
}
/* Весь состав человека, а не только пара.

   Тестер, страница «05» (5.10): «малибука без сквада почему-то, когда из 5 главы
   в 6 переходишь». В трио-год карьеры, перешедшей из 2024-го, Malibuca —
   ТРЕТИЙ у P1ng & Wox (настоящая тройка 2025-го, cr.trios), а список «Кому
   написать», статус в ленте и объявления спрашивали только пары пула — и
   третий читался свободным. Теперь третий — в составе своей пары, а у пары
   в составе её третий. */
function ccSquadMatesOf(handle){
  const k=hKey(handle);
  let duos=[];
  try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return []; }
  const trios=(careerSquadSize()===3 && CAREER && CAREER.career && CAREER.career.trios) || {};
  const keyOf=d=>(d.cards||[]).map(c=>hKey(c)).sort().join('+');
  for(let i=0;i<duos.length;i++){
    const cs=duos[i].cards||[];
    if(!cs.some(c=>hKey(c)===k)) continue;
    const out=cs.filter(c=>c && hKey(c)!==k);
    const third=trios[keyOf(duos[i])];
    if(third && third!==k){ const tc=ccWhoCard(third); if(tc) out.push(tc); }
    return out;
  }
  const core=Object.keys(trios).find(key=>trios[key]===k);
  if(core){
    const d=duos.find(x=>keyOf(x)===core);
    if(d) return (d.cards||[]).filter(Boolean);
  }
  return [];
}
/* Статус человека на сегодня. Свободен — только если он И правда один: пара
   могла собраться обратно, и тогда старая запись о разводе ничего не значит. */
function ccWhoStatus(handle){
  const card=ccWhoCard(handle);
  if(!card) return null;
  if(ccPairMateOf(handle)) return card.org ? {kind:'org', text:card.org} : null;
  const trio=careerSquadSize()===3;
  const since=ccWhoAloneSince(handle, trio ? CAREER.lft : CAREER.splits);
  if(since) return {kind:trio?'lft':'fa', text:trio ? L().ccWhoLft : L().ccWhoFa};
  return card.org ? {kind:'org', text:card.org} : null;
}
function ccWhoChipHTML(handle){
  const st=ccWhoStatus(handle);
  if(!st) return '';
  return `<i class="x-who x-who-${st.kind}">${esc(st.text)}</i>`;
}
// PR-строка человека лежит под его ником — тем же, каким она пишется в
// careerPrAdd, поэтому сравнение по hKey, а не по строке.
function ccPrRowOf(handle){
  const rows=careerPrTally().rows||{}, k=hKey(handle);
  const name=Object.keys(rows).find(n=>hKey(n)===k);
  return name ? rows[name] : null;
}
/* Карточка Power Ranking — то же, что показывает Tracker: сколько всего,
   какое место, сколько набрано за этот сезон и за последний год, и кривая. */
function ccPrCardOf(handle){
  const row=ccPrRowOf(handle);
  if(!row || !(row.v||[]).length) return null;
  const now=ccAbsDay(CAREER.career.season, careerToday());
  const seasonFrom=Math.max(0, (CAREER.career.season-1)*365);
  const sum=(from)=>(row.v||[]).reduce((s,e)=>s+(e[1]>=from ? e[0] : 0), 0);
  const rows=careerPrRows(), k=hKey(handle);
  let rank=null;
  for(let i=0;i<rows.length;i++) if(hKey(rows[i].name)===k){ rank=i+1; break; }
  // Кривая — накопленный PR по месяцам года, как на их графике. Точек всегда
  // хотя бы две: у карьеры, которой месяц от роду, окно короче месяца, и
  // одной точкой кривая не рисуется вовсе — а пустое место под числом
  // читается как «данных нет», хотя они есть.
  const step=30, pts=[];
  for(let d=Math.max(0, now-365); d<=now; d+=step)
    pts.push((row.v||[]).reduce((s,e)=>s+(e[1]<=d ? e[0]*ccPrDecay(Math.max(0, d-e[1])) : 0), 0));
  if(pts.length<2) pts.unshift(0);
  return {pr:careerPrOf(row), rank:rank, events:row.n||0,
          season:Math.round(sum(seasonFrom)), year:Math.round(sum(Math.max(0, now-365))), pts:pts};
}
// Кривая под числом — та же, что у рейтинга в истории, только своими точками.
function ccSparkSVG(pts){
  if(!pts || pts.length<2) return '';
  const w=100, h=26, pad=2;
  const lo=Math.min(...pts), hi=Math.max(...pts);
  // Ровная линия рисуется ПОСЕРЕДИНЕ, а не по нижнему краю: у карьеры, где
  // все точки равны, кривая ложилась на дно и читалась как «ноль», хотя это
  // «не менялось».
  const flat=hi===lo, span=Math.max(1, hi-lo);
  const xy=pts.map((v,i)=>[(i/(pts.length-1))*w,
                           flat ? h/2 : h-pad-((v-lo)/span)*(h-pad*2)]);
  const line=xy.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  return `<svg class="x-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <polygon points="0,${h} ${line} ${w},${h}" fill="rgba(126,240,221,.14)"/>
    <polyline points="${line}" fill="none" stroke="#7ef0dd" stroke-width="1.4"
      vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}
/* Био человека СЦЕНЫ. Своё уже есть — careerBioHTML собирает его из журнала
   по образцу настоящих профилей, и второй копии тут не будет: свой человек
   уходит туда же.

   Про чужого известно ровно то, что видит сцена: возраст, флаг, клуб, кубки,
   которые он взял на глазах у карьеры (их считает CAREER.titles), место в PR и
   сколько турниров он сыграл. Ключи те же, что у своего био, — «×3 победитель
   кубка» читается одинаково, о ком бы ни шла речь. */
function ccBioLine(handle){
  const pl=CAREER.player;
  if(pl && pl.handle && hKey(pl.handle)===hKey(handle)) return careerBioHTML();
  const card=ccWhoCard(handle);
  const bits=[];
  const age=ccAgeShown(handle);
  if(age) bits.push(String(age));
  if(card && card.nat) bits.push(esc(natDisplay(card.nat)||card.nat));
  if(card && card.org) bits.push(L().ccBioPro+' '+esc(card.org));
  const titles=(CAREER.titles||{})[hKey(handle)]||0;
  if(titles) bits.push(L().ccBioCups(titles));
  const pr=ccPrCardOf(handle);
  if(pr && pr.rank) bits.push(L().ccBioPrRank(pr.rank));
  if(pr && pr.events) bits.push(L().ccBioEvents(pr.events));
  return bits.filter(Boolean).join(' · ');
}
// Кубок, взятый на глазах у карьеры, остаётся в био победителя. Пишет
// careerD1Posts — он и так знает, кто выиграл неделю наверху.
function ccTitleAdd(handle){
  if(!handle) return;
  const t=CAREER.titles=CAREER.titles||{}, k=hKey(handle);
  t[k]=(t[k]||0)+1;
}
/* Приложение к посту: био строкой и PR-карточка под ним. Это ровно тот скрин,
   который настоящие прикладывают к объявлению, только собранный из сейва. */
function ccCardShotHTML(handle){
  if(!handle) return '';
  const bio=ccBioLine(handle), pr=ccPrCardOf(handle);
  if(!bio && !pr) return '';
  /* Числа PR — ПОЛНОСТЬЮ, а не «3K»: у Tracker на карточке стоит 10 257, и
     разница между 1 954 и 2 946 — это и есть то, ради чего её показывают.
     Сжатие остаётся там, где числа большие и точность не нужна: фолловеры,
     просмотры, лайки. */
  const nums=pr ? `<div class="x-card-num"><b>${ccNum(pr.pr)}</b>
      <span>${L().ccCardPr}${pr.rank?' · '+L().ccBioPrRank(pr.rank):''}</span></div>
    <div class="x-card-cols"><span><i>${ccNum(pr.season)}</i>${L().ccCardSeason}</span>
      <span><i>${ccNum(pr.year)}</i>${L().ccCardYear}</span></div>
    ${ccSparkSVG(pr.pts)}` : '';
  return `<div class="x-card"><div class="x-card-bio">${esc(handle)}${bio?' — '+bio:''}</div>${nums}</div>`;
}
/* ---- Кто куда садится, вслух ----------------------------------------------

   Перед крупным вечером про постят свою точку: «Solo FNCS 🔥» и карта со
   стрелками (@ScrollSZN, 2 сентября 2026). Смысл не в картинке — в том, что
   намерение объявлено ЗАРАНЕЕ, и соседи решают, лететь туда или нет.

   Здесь то же самое и из тех же чисел: комната уже распределена (pre в
   careerLandingPick считается ДО твоего выбора), поэтому объявление ничего не
   выдумывает и ни одного лишнего броска не делает — оно просто говорит вслух
   то, что уже решено. Два имени, не больше: это подсказка к своему решению, а
   не сводка. Пишется один раз за этап — на первой игре.

   Возвращает строку для подсказки в окне выбора; посты кладёт сам. */
function ccDropCalls(pre, you, stage){
  if(!pre || !pre.forEach) return '';
  const bare=t=>String((t&&t.name)||'').replace(/<[^>]*>/g,'');
  const out=[];
  pre.forEach(function(list, zone){
    (list||[]).forEach(function(t){
      if(!t || t===you || t.isYou || t.isMate) return;
      const at=ALL_LANDING_ZONES.indexOf(zone);
      if(at<0) return;
      out.push({t:t, at:at, pow:Number(t.pow)||0,
                h:((t.squad||[])[0]||{}).handle || bare(t)});
    });
  });
  if(!out.length) return '';
  // Громко говорят сильные: две верхние команды комнаты.
  out.sort((a,b)=>b.pow-a.pow);
  const said=out.slice(0, 2);
  const first=!((you.stageLog||[]).length);
  said.forEach(function(c){
    /* К объявлению приложена КАРТА с обведённой точкой — так это и выглядит у
       настоящих: «north side in solos» у @RitualFPS, 2 сентября, и картинка
       острова с закрашенной областью. Хранится номер зоны и остров, а не
       картинка: рисуется она на показ, как и всё остальное. */
    /* Уезжает НОМЕР зоны, а не готовое «зона 9»: имя строится на показе, в
       том языке, который стоит сейчас. Со строкой пост оставался русским в
       английской ленте — это же правило записано у ccText: «числа — то, что
       стоит хранить, слова никогда не были собственностью сейва». */
    if(first && c.h) careerNews('flat', 'ccPostDropCall',
                                [ccHandle(c.h), c.at+1],
                                {day:careerToday(), zone:c.at, set:ACTIVE_LANDING_SET});
  });
  return said.map(c=>'@'+ccHandle(c.h)+' → '+L().landingZoneSuffix(c.at+1)).join(' · ');
}
/* «qual grands, land X» — посты после хитов.

   Отзыв: «во время хитов в сошиал ещё можно писать qual grands
   land туда, где метка стоит у игрока… также и боты, которые квальнулись,
   могут писать». Так это и выглядит у настоящих после хитов: «QUALIFIED TO
   GRANDS» и следом точка, куда сядут в финале.

   Точка — та, где команда САДИЛАСЬ в последней игре хитов (landingZone): у
   игрока это его метка, у бота — его место в комнате. Как и у объявления
   точки (ccDropCalls), уезжает НОМЕР зоны и остров, имя строится на показе.
   Пишут не все прошедшие, а трое сильнейших: лента после хитов — это несколько
   громких постов, а не сорок пять одинаковых. `what` — grands у Мейджора,
   finals у соло-серии: словарь ставит нужное слово сам. */
function ccGrandsCalls(what, you, through, passers){
  const zoneNo=t=>{
    const at=ALL_LANDING_ZONES.indexOf(t && t.landingZone);
    return at>=0 ? at+1 : null;
  };
  const opt=z=>z ? {zone:z-1, set:ACTIVE_LANDING_SET} : {};
  if(through){ const z=zoneNo(you); careerNews('good', 'ccPostQualGrands', [z, what], opt(z)); }
  const bots=(passers||[]).filter(t=>t && t!==you && !t.isYou && !t.isMate)
    .sort((a,b)=>(Number(b.pow)||0)-(Number(a.pow)||0)).slice(0, 3);
  bots.forEach(t=>{
    const h=((t.squad||[])[0]||{}).handle;
    if(!h) return;
    const z=zoneNo(t);
    careerNews('flat', 'ccPostBotQualGrands', [ccHandle(h), z, what], opt(z));
  });
  return bots.length+(through?1:0);
}
/* Картинка под постом — арт события.

   Титул уходил в ленту таблицей, а у настоящих это фотография со сцены и
   подпись в два слова («BIG and thomas», @MalibucaFN, 20 тысяч лайков). Своих
   фотографий с ЛАНов у нас нет и взяться им неоткуда, зато есть арты событий —
   те же, что носят клетки недели и новостной хаб. Ставится только туда, где
   повод громкий: титул, чемпионство, ЛАН. */
function ccArtHTML(n){
  if(!n || !n.art) return '';
  const src=CAREER_EV_ART[n.art] || CAREER_EV_ART.cup;
  return src ? `<div class="x-art" style="background-image:url(${src})"></div>` : '';
}
/* Цитата — пост внутри поста.

   Половина настоящей ленты устроена так: анонс Epic и под ним реплика игрока,
   чужой результат и «W» сверху. У нас счётчик репостов стоял, а самого
   действия не было, и лента читалась как стопка монологов. Хранится ссылка на
   запись (её id), а не копия текста: цитируемый пост живёт своей жизнью и
   переводится вместе со всей лентой. */
function ccQuoteHTML(n){
  if(!n || !n.q) return '';
  const src=(CAREER.career.news||[]).find(x=>x.id===n.q);
  if(!src) return '';
  const who=ccPostAuthor(src);
  return `<div class="x-quote">
    <div class="x-quote-h">${ccAvatar(who)}<b>${esc(who.name)}</b>
      <span>@${esc(who.handle)}</span><span class="x-dot">·</span><span>${ccStamp(src)}</span></div>
    <p>${ccMentions(ccText(src))}</p>
    ${ccShotHTML(src.tbl)+ccLeadHTML(src.lead)}${ccArtHTML(src)}</div>`;
}
/* Карта с обведённой точкой — картинка под объявлением высадки.

   Снято с настоящего поста (@RitualFPS, 2 сентября: «north side in solos» и
   остров с закрашенной областью). Рисуется из того же, из чего рисуется пикер:
   клетки — проценты этой самой картинки, поэтому рамка ложится точно.

   Набор клеток берётся из записи, а не из текущего острова: вечер давно
   кончился, ACTIVE_LANDING_SET уехал на другой Мейджор, а пост в ленте
   остался — и показывать он должен ту карту, о которой говорил. */
/* Объявленная точка высадки — ВЫРЕЗКОЙ вокруг коробки, а не целым островом.

   Правка со ссылкой на пост @MalibucaFN («карта слишком
   большая, вот пример поста»): у настоящих под таким постом кадр 627×570
   вокруг своей точки — видно название POI, рельеф и жёлтую рамку, а не весь
   остров, на котором коробку не разглядеть. У нас карта шла фоном во всю
   ширину поста с отношением 16/9, то есть занимала полэкрана и показывала
   в основном воду.

   Арифметика та же, что у careerSpotShotHTML (плитка дома): слой — вся карта,
   растянутая в zoom раз, внутри него координаты ZONE_SETS, и translate
   подводит центр коробки к центру кадра. Отличий два: набор берётся тот, что
   записан в посте (без careerSpotGrid — индекс коробки принадлежит именно
   ему), и заполнение мягче, чтобы вокруг точки осталась узнаваемая местность. */
const CC_DROP_SHOT_RATIO=11/10, CC_DROP_SHOT_FILL=58;
function ccDropMapHTML(n){
  if(!n || n.zone==null) return '';
  const set=(n.set && ZONE_SETS[n.set]) ? n.set : ACTIVE_LANDING_SET;
  const z=(ZONE_SETS[set]||[])[n.zone];
  const art=MAP_ART[set];
  if(!z || !art) return '';
  const asp=MAP_ASPECT[set]||'1100/970';
  const ar=String(asp).split('/');
  const hOverW=(Number(ar[1])||970)/(Number(ar[0])||1100);
  const byW=CC_DROP_SHOT_FILL/Math.max(z.w, 3);
  const byH=CC_DROP_SHOT_FILL/(Math.max(z.h, 3)*hOverW*CC_DROP_SHOT_RATIO);
  const zoom=Math.max(1.2, Math.min(9, Math.min(byW, byH)));
  // Кадр прижимается к краю острова, а не выезжает за него: у береговых точек
  // иначе в угол заезжает пустота. См. ту же правку в careerSpotShotHTML.
  const halfW=Math.min(50, 50/zoom);
  const halfH=Math.min(50, 50/(zoom*hOverW*CC_DROP_SHOT_RATIO));
  const cx=clamp(z.x+z.w/2, halfW, 100-halfW);
  const cy=clamp(z.y+z.h/2, halfH, 100-halfH);
  return `<div class="x-map x-map-shot">
    <div class="x-map-in" style="width:${(zoom*100).toFixed(0)}%;aspect-ratio:${asp};
      background-image:url('${art}');
      transform:translate(${(-cx).toFixed(2)}%, ${(-cy).toFixed(2)}%);">
      <i style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%"></i>
    </div></div>`;
}
/* Скрин таблицы к посту о вечере.

   Так это и выглядит у настоящих: подпись в две строки, а под ней картинка со
   стандингами, где своя строка подсвечена (@ScrollSZN, 31 августа 2026:
   «Reality's Reign In Finals» и таблица под ней). Кубок дивизиона и вечер
   Дивизиона 1 так и постили, остальные девять вечеров — нет, и Мейджор с ЛАНом
   уходили в ленту голой строчкой. Собирается в одном месте, потому что правило
   одно: пятёрка сверху и своя строка под ней, если она ниже. */
/* Скрин стандингов — тот самый, который постят.

   Правка: «а такие же таблицы можешь сделать, как игроки
   постят». У них это скриншот таблицы Tracker, и в нём всегда одно и то же:
   слева места с очками, матчами, победами и киллами, справа — большое число
   очков и сводка (виктори, топ-5, топ-10, всего киллов, средние киллы и место),
   внизу полоска кнопок. Смотрел живьём у @MalibucaFN, @darmfn, @RitualFPS,
   @Tjino9 — layout один в один у всех, потому что это одна и та же страница.

   Всё это у вечера уже посчитано: журнал игр (stageLog) есть у каждой команды,
   очки, победы и киллы тоже. Сводка считается по журналу того, чья строка
   подсвечена, — то есть автора поста. */
// Строка скрина таблицы: место, имя, очки, матчи, победы, киллы, флаги по картам состава (рисуются при показе, flagImg).
function ccShotRow(t, i){
  return {p:i+1, n:String((t&&t.name)||'').replace(/<[^>]*>/g,''), s:Math.round(t.stagePts||0),
          // Второй вечер кубка: игры первого у остальных лежат в _carryGames, свои уже склеены в лог (Notion 27.10: 11 против 22).
          m:(t.stageLog||[]).length+(t._carryGames||0), w:t.wins||0, e:Math.round(t.stageElims||0),
          f:((t&&t.squad)||[]).map(p=>p&&p.nat).filter(Boolean)};
}
function ccStageShot(ranked, you, div, cap, cut){
  if(!ranked || !ranked.length || !you) return undefined;
  const bare=t=>String((t&&t.name)||'').replace(/<[^>]*>/g,'');
  const row=ccShotRow;
  const place=ranked.indexOf(you)+1;
  /* Как в таблице самой игры — его твит 3 сентября (Th0masHD на #33, в
     кадре #29–#36, своя строка ещё раз приколота внизу, справа «Points to
     qualify Top 50: 371 pts»). Окно вокруг своей строки, в восьмёрке —
     просто верх; своя строка всегда повторена внизу (pin). */
  // Топ-10 (его «пусть топ 10 пишет», 28.10): в десятке просто верх, ниже окно из десяти вокруг своей строки.
  const from=place<=10 ? 0 : Math.max(0, place-6);
  const rows=ranked.slice(from, from+10).map((t,i)=>row(t, from+i));
  const pin=place>0 ? row(you, place-1) : null;
  const cutPts=(cut && ranked[cut-1]) ? Math.round(ranked[cut-1].stagePts||0) : undefined;
  const log=(you.stageLog||[]);
  const sum=log.length ? {
    vr:log.filter(g=>g.place===1).length,
    t5:log.filter(g=>g.place<=5).length,
    t10:log.filter(g=>g.place<=10).length,
    e:Math.round(log.reduce((s,g)=>s+(g.elims||0),0)),
    ae:Math.round(log.reduce((s,g)=>s+(g.elims||0),0)/log.length*10)/10,
    ap:Math.round(log.reduce((s,g)=>s+(g.place||0),0)/log.length*10)/10
  } : null;
  return {div:div||CAREER.career.division, cap:cap||undefined, rows:rows, me:bare(you),
          pts:Math.round(you.stagePts||0), sum:sum, pin:pin||undefined,
          cut:cut||undefined, cutPts:cutPts, of:ranked.length,
          // «Дуо» или «Трио» — тем же словом, каким режим называет их везде.
          mode:careerSquadSize()===3 ? L().modeTrioTitle : L().modeDuoTitle};
}
function careerNewsHTML(limit){
  const news=(CAREER.career.news||[]);
  if(!news.length) return `<div class="ch-empty">${L().ccNewsEmpty}</div>`;
  return news.slice(0, limit||6).map(ccPostHTML).join('');
}
/* ---- Лента: всё или только подписки ---------------------------------------

   Подписка обязана что-то менять, иначе кнопка «подписаться» — украшение.
   «Подписки» показывают тех, на кого подписан игрок, и его самого: своя строка
   в своей же ленте стоит везде, где такая вкладка есть. */
let CH_FEED='all', CH_WHO=null, CH_FEED_Q=null;
function careerFeedMode(m){ CH_FEED=m; careerRenderHub('social'); }
/* ПОСТЫ ТИММЕЙТА (29.10, игрок из Франции: «pouvoir voir les tweet du mate ?»). В командной карьере напарник шлёт свои
   последние посты с карточкой (MP.card → posts); здесь они встают в ленту под его ником — до следующего вечера,
   когда карточка приедет заново. Лайк и ответ на них не пишутся: пост живёт у него. */
const CC_MATE_POSTS_N=12;
function ccMatePostsWire(){
  try{
    return (CAREER.career.news||[]).filter(e=>{ try{ return ccPostAuthor(e).you; }catch(x){ return false; } })
      .slice(0, CC_MATE_POSTS_N).map(e=>({id:e.id, day:e.day, k:e.k, a:e.a, text:e.text, kind:e.kind, likes:e.likes||0, rts:e.rts||0,
        res:(e.res||[]).slice(-CC_REPLY_MAX)}));
  }catch(e){ return null; }
}
/* Ответ под постом напарника в команде. Сервер пропускает только известные сообщения, поэтому ответ едет в своей карточке
   (reMate), а напарник вписывает его под свой пост (ccMateReMerge). Свои хранятся в cr.mateRe — у себя видны сразу. */
const CC_MATE_RE_N=40;
function ccMateReWire(){ const a=(CAREER && CAREER.career && CAREER.career.mateRe)||[]; return a.slice(-CC_MATE_RE_N); }
function ccMateReMerge(){
  try{
    const p=(typeof MP!=='undefined') && MP.peer;
    if(!p || !Array.isArray(p.reMate) || !(typeof ccMpOn==='function' && ccMpOn())) return false;
    const news=CAREER.career.news||[]; let got=false;
    p.reMate.forEach(r=>{
      if(!r || r.id==null || !r.k || !r.t) return;
      const n=news.find(x=>String(x.id)===String(r.id));
      if(!n || (n.res||[]).some(x=>x.k===r.k)) return;
      n.res=(n.res||[]).concat([{t:String(r.t).slice(0, CC_POST_MAX), day:r.day, by:p.handle, k:r.k}]).slice(-CC_REPLY_MAX);
      got=true;
    });
    if(got) careerSave();
    return got;
  }catch(e){ return false; }
}
function ccMpSendCardSoon(){ try{ if(typeof ccMpOn==='function' && ccMpOn() && typeof MP!=='undefined' && MP.sendCard) MP.sendCard(); }catch(e){} }
/* Посты живого соседа приезжают по сети как есть, а лента рисует их разметкой: из каждой строки поста убираются
   знаки, которыми можно открыть тег, атрибут или строку JS. Свои посты и посты сцены сюда не ходят. */
function ccPeerStr(s){ return String(s==null?'':s).replace(/[<>"`\\\u0000-\u001f]/g, ''); }
function ccPeerSafe(o, d){
  if(typeof o==='string') return ccPeerStr(o);
  if(!o || typeof o!=='object' || (d||0)>6) return (typeof o==='number' || typeof o==='boolean') ? o : null;
  if(Array.isArray(o)) return o.slice(0, 200).map(v=>ccPeerSafe(v, (d||0)+1));
  const r={};
  Object.keys(o).slice(0, 60).forEach(k=>{ if(k!=='__proto__' && k!=='constructor' && k!=='prototype') r[ccPeerStr(k)]=ccPeerSafe(o[k], (d||0)+1); });
  return r;
}
function ccMatePosts(){
  try{
    // Гонка: посты соперников-людей приезжают в их строке (careerRaceCard posts), на них можно ответить.
    if(typeof ccRaceOn==='function' && ccRaceOn() && !(typeof ccMpOn==='function' && ccMpOn())){
      const out=[];
      (typeof ccRaceRivals==='function' ? ccRaceRivals() : []).forEach(p=>{
        if(!p || !p.card || !Array.isArray(p.posts)) return;
        const c=p.card, by={name:ccPeerStr(c.handle), handle:ccHandle(ccPeerStr(c.handle)), card:c, ovr:c._ovr};
        p.posts.map(x=>ccPeerSafe(x)).forEach(x=>{ if(x && x.id!=null) out.push(Object.assign({}, x, {id:'race:'+hKey(c)+':'+x.id, by:by, mate:true})); });
      });
      return out;
    }
    if(!(typeof ccMpOn==='function' && ccMpOn()) || typeof MP==='undefined' || !MP.peer || !Array.isArray(MP.peerPosts)) return [];
    const p=MP.peer, by={name:ccPeerStr(p.handle), handle:ccHandle(ccPeerStr(p.handle)), card:p, ovr:p._ovr};
    // Под постом: ответы, что он получил (свои мои — из cr.mateRe, чтобы не задваивать), и мои.
    const myK=hKey(careerCard()||{handle:''}), mine=(CAREER.career.mateRe||[]);
    return MP.peerPosts.map(x=>ccPeerSafe(x)).map(x=>{
      const theirs=(x.res||[]).filter(r=>!(r.by && hKey(r.by)===myK)).map(r=>r.by ? r : Object.assign({}, r, {by:ccPeerStr(p.handle)}));
      const res=theirs.concat(mine.filter(r=>String(r.id)===String(x.id)).map(r=>({t:r.t, day:r.day})));
      return Object.assign({}, x, {id:'mate:'+x.id, by:by, mate:true, res:res});
    });
  }catch(e){ return []; }
}
function careerFeedHTML(){
  const mp=ccMatePosts();
  // Свои и тиммейта — одной лентой, новые сверху (у своих порядок записи сохраняется).
  const news=mp.length ? (CAREER.career.news||[]).concat(mp).map((e,i)=>[e,i]).sort((x,y)=>(x[0].day<y[0].day?1:x[0].day>y[0].day?-1:x[1]-y[1])).map(x=>x[0])
                       : (CAREER.career.news||[]);
  let list=CH_FEED==='subs'
    ? news.filter(n=>{ const w=ccPostAuthor(n); return w.you || ccFollowing(w.handle); })
    : news;
  // Нажатый тренд (ccTrendsHTML) — лента по нему, с крестиком сверху.
  let chip='';
  if(CH_FEED_Q){ const q=CH_FEED_Q.toLowerCase(); list=list.filter(n=>{ try{ return (ccText(n)+' '+ccPostAuthor(n).handle).toLowerCase().indexOf(q.replace(/^[#@]/,''))>=0; }catch(e){ return false; } });
    chip='<div class="x-trend-on"><b>'+esc(CH_FEED_Q)+'</b><button class="x-act" onclick="careerTrend(null)">✕</button></div>'; }
  if(!list.length) return `<div class="ch-empty">${
    CH_FEED==='subs' ? L().ccFeedSubsEmpty : L().ccNewsEmpty}</div>`;
  return chip+list.slice(0, CAREER_NEWS_KEEP).map(ccPostHTML).join('');
}
/* ---- Чужой профиль --------------------------------------------------------

   По нику можно нажать — и это главный способ ходить по X. Всё, что нужно, уже
   считается: био (ccBioLine), карточка PR, статус F/A и посты этого человека в
   ленте. Здесь они просто собраны на один экран, плюс три действия: подписаться,
   написать и поручиться. */
function careerWho(h){ CH_WHO=String(h||''); CH_SOCIAL='who'; careerRenderHub('social'); }
function careerWhoHTML(h){
  if(!h) return `<div class="ch-tile"><div class="ch-empty">${L().ccNewsEmpty}</div></div>`;
  const card=ccWhoCard(h), esh=jsq(h);
  const who={name:h, handle:ccHandle(h), card:card, logo:null};
  // Живой напарник: его посты едут с карточкой (ccMatePosts), в своей ленте их нет.
  const matePosts=ccMatePosts().filter(x=>x.by && hKey(x.by.name)===hKey(h));
  const posts=matePosts.concat((CAREER.career.news||[]).filter(n=>hKey(ccPostAuthor(n).handle)===hKey(ccHandle(h))));
  const ad=(typeof ccAdOf==='function') ? ccAdOf(h) : null;
  return `<div class="ch-tile x-profile">
    <div class="x-profile-head">
      ${ccAvatar(who)}
      <div><b>${esc(h)}</b>${ccWhoChipHTML(h)}${ccRegChipHTML(card)}<span>@${esc(ccHandle(h))} · 👥 ${ccFollowText(h, card ? ccCardOvr(card) : null)}</span>
        <span class="x-bio">${ccBioLine(h)}</span></div>
    </div>
    <div class="x-acts2">
      ${ccFollowing(h)
        ? `<button class="x-act" onclick="careerUnfollow(\'${esh}\')">${L().ccFollowingBtn}</button>`
        : `<button class="x-act" onclick="careerFollow(\'${esh}\')">${L().ccFollowBtn}</button>`}
      <button class="x-act" onclick="careerPostDm(\'${esh}\')">${L().ccPostDmBtn}</button>
      ${ad ? (ccVouched(h)
        ? `<span class="x-act-done">${L().ccPostVouched}</span>`
        : `<button class="x-act" onclick="careerVouch(\'${esh}\')">${L().ccPostVouchBtn}</button>`) : ''}
    </div>
    ${ccCardShotHTML(h)}
    ${careerPlayerStatsHTML(h, card && card.region)}
    <div class="x-timeline">${posts.length
      ? posts.slice(0, 20).map(ccPostHTML).join('')
      : `<div class="ch-empty">${L().xNoPostsWho}</div>`}</div>
  </div>`;
}

/* ---- Новостной хаб на центре ----
   Одна новость крупно и список заголовков с датами рядом, вместо ленты из 12 одинаковых постов. Ничего не пишется
   заново: заголовок это текст поста, картинка это арт события по виду турнира (CAREER_EV_ART, как на клетках
   недели) или фото человека. Полная лента с лайками и ответами в соцсети, кнопка ведёт туда. */
let CH_NEWS_CAT='all', CH_NEWS_PICK=null;
/* Три полки, как четыре вкладки у них: что сделал ты, что делает сцена и кто
   куда перешёл. Полка выводится из ключа записи — своего поля у неё нет и не
   нужно: ключ всегда знал, о чём строка. */
const CC_NEWS_MOVE=/^(ccPostDuoSplitBy|ccPostTrioLF|ccPostLfdWant|ccNewsSigned|ccNewsSignedDuo|ccNewsSignedAcademy|ccNewsReleased|ccNewsLeft|ccNewsLeftOrg|ccNewsExtended|ccNewsPromotedRoster|ccNewsDuoAnnounce|ccNewsDuoSplit|ccNewsDuoWorldSplit|ccNewsPartnerNew|ccNewsPartnerLeft|ccNewsMateLeftFor|ccNewsLfd)/;
function ccNewsCat(n){
  if(ccPostAuthor(n).you) return 'you';
  return CC_NEWS_MOVE.test(String(n.k||'')) ? 'moves' : 'scene';
}
/* Картинка новости. Сначала — арт турнира, о котором она: ключи вечеров
   называют свой вид сами. Потом — лицо человека, если новость про человека.
   Ничего не нашлось — карточка идёт без картинки, а не с заглушкой. */
const CC_NEWS_KIND=[[/^ccNewsMaj/, 'major'], [/^ccNewsRel|^ccNewsRc/, 'reload'],
  [/^ccNewsSolo/, 'solo'], [/^ccNewsGlob|^ccNewsGc/, 'gc'], [/^ccNewsSum/, 'summit'],
  [/^ccNewsVic/, 'victory'], [/^ccNewsEval/, 'eval'], [/^ccNewsWf|^ccNewsResultWeek/, 'final'],
  [/^ccNewsResult|^ccPostWon|^ccPostPodium|^ccNewsCongrats|^ccPostOrgWin|^ccNewsWinner|^ccNewsD1Table/, 'cup']];
/* Обложка новости — в оформлении того, что игралось (его правка 28.09, скрин поста Kinch
   про ESL Katowice 2019 с гербом FNCS 2026): свой постер у турнира дня (n.evArt, пишется в
   careerNews), иначе постер сезона FNCS, в котором вышел пост; 2026-й — как раньше, по виду. */
/* Картинка под панелью дня — своего сезона (ccSeasonArtOn), а не кап 2026-го на любом году (Notion «19.10», скрин 32:
   «кап 26 года на превью не того года»). С ноября 2025-го своей картинки сезона нет — тогда кап этого года. */
function ccDayArt(){ return ccSeasonArtOn(careerToday()) || CAREER_EV_ART.cup; }
function ccSeasonArtOn(day){
  const d=String(day||'');
  if(!d || d>='2025-11-29') return '';
  const all=[].concat(CC_SEASONS_2019, CC_SEASONS_2020, CC_SEASONS_2021, CC_SEASONS_2022,
                      CC_SEASONS_2023, CC_SEASONS_2024, CC_SEASONS_2025);
  const s=all.find(x=>d>=x.from && d<=x.to);
  const num=s ? +String(s.id).slice(1) : 0;
  if(!num) return d<'2019-12-31' ? 'art/fncs-2019.jpg' : 'art/fncs-'+d.slice(0,4)+'.jpg';
  if(num<=9) return 'art/fncs-2019.jpg';
  if(num===22) return 'art/cups/f22inv.jpg';
  if(num<=25) return 'art/cups/f'+num+'.jpg';
  if(num<=27) return 'art/fncs-2023.jpg';
  if(num<=31) return 'art/cups/f28.jpg';
  return num<=33 ? 'art/mode-major1-2025.jpg' : num<=35 ? 'art/mode-major2-2025.jpg' : 'art/mode-major3-2025.jpg';
}
// Свой постер события (сезон FNCS, id, постер капа) — без запасной обложки по виду.
function ccEventArtOwn(ev){
  if(!ev) return '';
  const own=ccOwnLogoOf(ev); if(own) return own;
  return ccFncsPoster(ev.id||ev.eid) || CAREER_EV_ART_ID[ev.id||ev.eid||''] || ccCupPoster(ev.id||ev.eid) || '';
}
function ccNewsArtOf(n){
  const k=String(n.k||'');
  for(let i=0;i<CC_NEWS_KIND.length;i++)
    if(CC_NEWS_KIND[i][0].test(k)){
      const art=n.evArt || ccSeasonArtOn(n.day) || CAREER_EV_ART[CC_NEWS_KIND[i][1]] || CAREER_EV_ART.cup;
      if(art) return {src:art, kind:'art'};
    }
  const who=ccPostAuthor(n);
  // Герб лежит в своей папке, лицо — в своей: те же две двери, что у ccAvatar.
  if(who.logo) return {src:LOGO_DIR+who.logo, kind:'crest'};
  if(who.card){ const u=photoURL(who.card); if(u) return {src:u, kind:'face'}; }
  if(who.you){ const u=photoURL(careerCard()); if(u) return {src:u, kind:'face'}; }
  /* Картинка есть ВСЕГДА — отзыв: «чтоб новости там были и картинки
     фортнайт». Новость без арта на этом экране выглядит как пустая карточка,
     поэтому последним рубежом стоит афиша сезона. */
  return {src:n.evArt || ccSeasonArtOn(n.day) || CAREER_EV_ART.cup, kind:'art'};
}
function careerNewsCat(c){ CH_NEWS_CAT=c; CH_NEWS_PICK=null; careerRenderHub('centre'); }
/* Выбранная руками новость останавливает карусель: игрок читает то, что открыл,
   и карточка не должна уезжать у него из-под глаз. */
function careerNewsPick(id){ CH_NEWS_PICK=id; careerNewsShow(id); }
/* ---- Карусель новостей ----------------------------------------------------

   Правка, со скриншотом точек под панелью FIFA: «хочу чтоб тут
   менялись картинки раз в какое-то время как на референсе». Каждые шесть секунд
   карточка показывает следующую новость, снизу — точки, по ним можно кликнуть.

   Перерисовывается ТОЛЬКО карточка, а не весь центр: центр — это неделя,
   календарь, панель дня и магазин, и гонять их каждые шесть секунд значит
   отдать батарею телефона за смену картинки.

   Уважение к prefers-reduced-motion здесь особое: смена новости — это не
   анимация, а содержимое, и её мы не отключаем (иначе игрок с включённым
   reduced-motion не увидит фичу вовсе). Отключается плавность: при reduced
   карточка меняется мгновенно, без затухания. */
const CC_NEWS_ROT_MS=6000;
let CC_NEWS_ROT=null, CC_NEWS_IDS=[], CC_NEWS_AT=0;
function ccNewsLeadOf(id){
  /* Карьеры может уже не быть: скриншот — «Cannot read properties of
     null (reading 'career')» на этой строке. Таймер ленты (careerNewsRotStart)
     проверял только, что элемент #nhLead на месте, а после выхода из карьеры экран
     хаба лишь прячется, элемент остаётся — и тик шёл в CAREER=null. */
  const cr=CAREER && CAREER.career;
  const all=(cr && cr.news)||[];
  return all.find(n=>n.id===id) || null;
}
function careerNewsShow(id){
  const box=document.getElementById('nhLead');
  const n=ccNewsLeadOf(id);
  if(!box || !n) return;
  box.innerHTML=ccNewsLeadHTML(n);
  box.classList.remove('nh-in');
  // Пересборка стиля, чтобы затухание проигралось заново.
  void box.offsetWidth;
  box.classList.add('nh-in');
  const list=document.querySelectorAll('#screen-career-hub .nh-row');
  list.forEach(el=>el.classList.toggle('on', el.dataset.id===id));
  document.querySelectorAll('#screen-career-hub .nh-dot')
    .forEach(el=>el.classList.toggle('on', el.dataset.id===id));
  CC_NEWS_AT=Math.max(0, CC_NEWS_IDS.indexOf(id));
}
function careerNewsRotStop(){
  if(CC_NEWS_ROT){ clearInterval(CC_NEWS_ROT); CC_NEWS_ROT=null; }
}
function careerNewsRotStart(ids){
  careerNewsRotStop();
  CC_NEWS_IDS=ids||[];
  if(CH_NEWS_PICK || CC_NEWS_IDS.length<2) return;
  CC_NEWS_ROT=setInterval(function(){
    // Экран сменился — таймер снимает себя сам, без подписки на переходы.
    if(!document.getElementById('nhLead')){ careerNewsRotStop(); return; }
    if(CH_NEWS_PICK){ careerNewsRotStop(); return; }
    // Карьеры нет или хаб спрятан (выход из карьеры, другая вкладка) — таймеру нечего листать.
    const hub=document.getElementById('screen-career-hub');
    if(!CAREER || !CAREER.career || !hub || !hub.classList.contains('active')){ careerNewsRotStop(); return; }
    CC_NEWS_AT=(CC_NEWS_AT+1)%CC_NEWS_IDS.length;
    careerNewsShow(CC_NEWS_IDS[CC_NEWS_AT]);
  }, CC_NEWS_ROT_MS);
}
function careerNewsHubHTML(){
  const all=(CAREER.career.news||[]);
  const list=(CH_NEWS_CAT==='all' ? all : all.filter(n=>ccNewsCat(n)===CH_NEWS_CAT)).slice(0, 14);
  const cats=['all','scene','moves','you'];
  const tabs=cats.map(c=>`<button class="nh-tab${CH_NEWS_CAT===c?' on':''}"
      onclick="careerNewsCat(\'${c}\')">${L()['ccNewsCat'+c]}</button>`).join('');
  if(!list.length)
    return `<div class="ch-tile ch-newsbar"><h4>${L().ccNewsHub}</h4>
      <div class="nh-tabs">${tabs}</div>
      <div class="ch-empty">${L().ccNewsEmpty}</div></div>`;
  const lead=list.find(n=>n.id===CH_NEWS_PICK) || list[0];
  const rows=list.map(n=>{
    const w=ccPostAuthor(n);
    return `<button class="nh-row${n===lead?' on':''}" data-id="${esc(n.id||'')}"
        onclick="careerNewsPick('${n.id||''}')">
      <em>${ccStamp(n)}</em><b>${esc(ccText(n))}</b>
      <span>${esc(w.name)}</span></button>`;
  }).join('');
  /* Точки — как под панелью новостей у них: сколько новостей в карусели и на
     какой она сейчас. Первые шесть, дальше карусель не ходит: это витрина
     свежего, а весь список и так стоит слева. */
  const ids=list.slice(0, 6).map(n=>n.id).filter(Boolean);
  const dots=ids.map(id=>`<button class="nh-dot${id===lead.id?' on':''}" data-id="${esc(id)}"
      onclick="careerNewsPick(\'${id}\')" aria-label="${esc(L().ccNewsHub)}"></button>`).join('');
  // Карусель заводится после того, как разметка попала в документ.
  setTimeout(function(){ careerNewsRotStart(ids); }, 0);
  return `<div class="ch-tile ch-newsbar">
    <h4>${L().ccNewsHub}</h4>
    <div class="nh-tabs">${tabs}</div>
    <div class="nh-wrap">
      <div class="nh-list">${rows}</div>
      <div class="nh-side">
        <article class="nh-lead nh-in" id="nhLead">${ccNewsLeadHTML(lead)}</article>
        ${ids.length>1 ? `<div class="nh-dots">${dots}</div>` : ''}
      </div>
    </div>
  </div>`;
}
// Одна новость крупно. Вынесено отдельно, потому что карусель меняет только её.
function ccNewsLeadHTML(lead){
  const art=ccNewsArtOf(lead), who=ccPostAuthor(lead);
  return `${art ? `<div class="nh-art nh-art-${art.kind}" style="background-image:url(${art.src})"></div>` : ''}
    <div class="nh-lead-in">
      <em class="nh-kicker">${L()['ccNewsCat'+ccNewsCat(lead)]} · ${ccStamp(lead)}</em>
      <h5>${ccMentions(ccText(lead))}</h5>
      <div class="nh-by">${ccAvatar(who)}<span><b>${esc(who.name)}</b>@${esc(who.handle)}</span></div>
      ${ccShotHTML(lead.tbl)+ccLeadHTML(lead.lead)}
      ${ccCardShotHTML(lead.card)}
      <button class="cc-back nh-open" onclick="careerOpenFeed()">${L().ccNewsOpen}</button>
    </div>`;
}
// One post. The feed and the profile draw the same thing, so a like put on a
// post in one place is the same like in the other.
/* Mentions.

   Pulled out of the text after it is built rather than assembled into it, so a
   translation can put the @ wherever the sentence wants it and the renderer
   never has to know which argument was a handle. A club like Virtus.pro keeps
   its dot; a sentence's full stop does not get eaten, because a dot only counts
   when something follows it. */
function ccMentions(t){
  return String(t==null?'':t)
    .replace(/@([A-Za-z0-9_\-]+(?:\.[A-Za-z0-9_\-]+)*)/g, '<span class="x-at">@$1</span>');
}
/* Комментарии под постом. Не хранятся, собираются из самого поста, как и
   ccPostStats: лента держит CAREER_NEWS_KEEP записей, и пять строк на каждую
   раздули бы сейв впятеро. Рисовальщик ничего не меняет: прибавку к форме за
   похвалу даёт конец вечера (ccProNod), иначе форма росла бы от листания ленты.
   Только под своими постами. Пишут болельщики с никами из генератора ладдера,
   сверху настоящий профи, если его записал ccProNod. */
const CC_CO_MAX=5;
/* Настроение поста — по ключу, и только потом по месту.

   Раньше банк выбирался по первым двум аргументам как по «место из скольких»,
   а у половины ключей там лежит не это: у ccPostPlaced вторым идёт дивизион,
   у ccNewsWfCash — деньги. Отсюда выгрузка ленты 3 сентября: «deserved» и
   «congrats» под «Evaluation: Round 2 without a win», «good run» под 33-м
   местом финала недели (33 из $400 — это 92% «побитых»). Ключ говорит, о чём
   пост, и решает первым; место читается только там, где оно правда место. */
const CC_CO_BY_KIND=[
  [/^ccPostDuoSplitBy|^ccPostTrioLF|^ccNewsDuoWorldSplit|^ccNewsDuoSplit|^ccNewsMateLeftFor|^ccNewsPartnerLeft|^ccPostMateLeft|^ccNewsDuoOutgrown/, 'Sad'],
  [/^ccPostLfdWant|^ccNewsLfd/, 'Lfd'],
  [/Bday/, 'Bday'],
  [/^ccNewsAnnounce|^ccNewsRoadmap|^ccPostHype|^ccPostDates/, 'Hype'],
  [/^ccNewsDuoAnnounce|^ccNewsDuoAgain|^ccNewsSquadNew|^ccNewsPartnerNew|^ccNewsSceneDuo/, 'Duo'],
  /* Свои банки (16.10, «посмотри твиттер и сделай реалистичней»): под таблицей статистики Kinch, анонсом сезона и
     подколом писали ответы на средний вечер («mid but fine», «could be worse») — у них не было своего вида. */
  [/^ccNewsStatBoard|^ccNewsKinch/, 'Stat'],
  [/^ccNewsMetaNew|^ccNewsHotfix|^ccNewsRehost/, 'Meta'],
  [/^ccPostTechNet/, 'Bad'],
  [/^ccNewsTeamingDq/, 'Rumor'],
  [/^ccPostEvKilled|^ccPostPressRival/, 'Taunt'],
  [/^ccPostPress$/, 'Press'],
  [/^ccPostRumor/, 'Rumor'],
  [/^ccPostPoll/, 'Poll'],
  [/^ccPostDebate/, 'Poll'],
  [/^ccNewsZoneLuck/, 'Stat'],
  [/^ccPostZoneLuck/, 'Bad'],
  [/^ccPostPressBroke/, 'Bad'],
  [/^ccNewsSigned|^ccNewsExtended|^ccNewsPromotedRoster|^ccNewsRaise/, 'Sign'],
  [/^ccNewsReleased|^ccNewsLeft|^ccPostBye/, 'Left'],
  [/^ccNewsD1Table/, 'Table'],
  [/^ccNewsStream|^ccPostStreamD1/, 'Stream'],
  [/^ccPostDropCall/, 'Drop'],
  [/^ccPostQualGrands|^ccPostBotQualGrands/, 'Pod'],
  [/^ccPostCustomsOpen|^ccPostHosted/, 'Cust'],
  [/^ccNewsRetired/, 'Bye'],
  [/^ccNewsBanned|^ccPostBanSad/, 'Ban'],
  [/^ccNewsCongrats|^ccPostOrgWin|^ccNewsWinner|^ccPostWon|^ccNewsGlobChamp|^ccNewsRcChamp|^ccNewsAward|^ccNewsPromoted$/, 'Win'],
  [/^ccPostPodium|Through$|^ccNewsWfIn|^ccNewsGcIn|^ccPostWins|^ccNewsEvalCash|^ccNewsVicCash/, 'Pod'],
  [/Out$|NoWin$|NoCash$|^ccPostClose|^ccPostOneOff|^ccPostTriedBest|^ccNewsRcDrop|^ccNewsRelegated|^ccNewsMpSplit|^ccNewsRentGone/, 'Bad']
];
/* ОТВЕТЫ ПОД СВОИМ ПОСТОМ ПО СМЫСЛУ (17.10, Notion «fncsdraft 15.10», его «реплаи не по теме»: под «ищу дуо на сезон 🙏
   лс открыты» и «форма есть 📈» писали «best 🔥», «earned», «congrats» — любая своя строка словами считалась новостью
   и брала банк поздравлений). Теперь тема — по словам поста: ищу дуо/трио → «V», «dm'd»; форма, готовность, буткемп,
   скримы → «посмотрим в субботу», «👀»; победа → поздравления; тильт и плохой вечер → поддержка; вопрос → ответы на
   вопрос; остальное — разговорное «real», «fr», без поздравлений. */
const CC_CO_TEXT=[
  [/(^|[^a-zа-яё])(lf[dts]|looking for|ищу|ищем|нужен (дуо|тиммейт|трио)|лс открыт|dms? open|need a (duo|trio|mate))/i, 'Lfd'],
  [/(выиграл|выиграли|победил|победа|we won|i won|won the|#1\b|топ[- ]?1\b|\bgg wp\b|🏆)/i, 'Win'],
  [/(тильт|tilt|плохо|ужасн|rough|awful|сгорел|бросаю|quit|😔|😞|💀)/i, 'Bad'],
  [/(форм|ready|готов|bootcamp|буткемп|grind|гринд|тренир|scrim|скрим|📈|cook|in form|locked in|настрой|голоден|hungry)/i, 'Ready'],
  [/\?\s*$/, 'Ask']
];
function ccCoTextMood(t){
  for(let i=0;i<CC_CO_TEXT.length;i++) if(CC_CO_TEXT[i][0].test(t)) return CC_CO_TEXT[i][1];
  return 'Talk';
}
function ccCoMood(n){
  const k=String((n&&n.k)||'');
  for(let i=0;i<CC_CO_BY_KIND.length;i++) if(CC_CO_BY_KIND[i][0].test(k)) return CC_CO_BY_KIND[i][1];
  const a=(n&&n.a)||[];
  const p=+a[0];
  // Место — там, где строка про место: своё место в комнате, финал недели,
  // призовые за этап. Где размер комнаты не записан, он берётся за пятьдесят —
  // это финал недели и любой финал круга.
  if(/^ccPostPlaced|^ccNewsResult|^ccNewsWfCash|Cash$/.test(k) && p>0){
    const of=(/^ccNewsResult/.test(k) && +a[1]>1) ? +a[1] : 50;
    const beat=1-(p-1)/Math.max(1, of-1);
    return p===1 ? 'Win' : (p<=3 || beat>=0.9) ? 'Pod' : beat<=0.3 ? 'Bad' : 'Mid';
  }
  if(!k) return ccCoTextMood(String((n && n.text) || ''));   // своя строка словами — по смыслу (ccCoTextMood)
  return n.kind==='bad' ? 'Bad' : n.kind==='good' ? 'News' : 'Mid';
}
/* Главный свой пост вечера.

   Вечер пишет четыре-пять строк подряд — место в комнате, проход в финал,
   призовые, рейтинг, — и напарник с кивнувшим профи стояли под каждой: в
   выгрузке 3 сентября vic0 четыре раза за вечер хвалил один и тот же кап.
   Настоящие пишут под одним постом — под тем, где скрин. Якорь — самый свежий
   свой пост о результате того же дня; под остальными строками вечера люди
   сцены появляются редко. Поста может не быть в ленте вовсе (проверки рисуют
   запись отдельно) — тогда якорь он сам. */
const CC_CO_RESULT=/^ccPostPlaced|^ccPostWon|^ccPostPodium|^ccNewsResult|^ccNewsWfIn|^ccNewsWfCash|Cash$|Out$|NoWin$|NoCash$|Through$|^ccNewsPromoted$|^ccNewsRelSeat|^ccNewsGcIn|^ccNewsGcSeat|^ccNewsCup/;
function ccCoAnchor(n){
  const list=(CAREER && CAREER.career && CAREER.career.news)||[];
  const top=list.find(x=>x && x.day===n.day && !x.by && CC_CO_RESULT.test(String(x.k||'')) &&
                          (CC_POST_BY[x.k]||'you')==='you');
  return !top || top.id===n.id;
}
/* Кто пишет под постом. Как на X: под победой про первым напарник, потом клуб, потом другие про из комнаты
   («W», «deserved»), потом зрители; под LFD настоящие пишут «V», именинник отвечает «ty», под плохим вечером «washed».
   Настоящие берутся из уже записанного: напарник (careerPartnerCard), клуб (CAREER.org), друзья, подписки, ссора
   (careerBeefHot); у человека сцены его пара (ccPairMateOf), клуб (ccWhoCard), соседи по таблице и упомянутые.
   Ничего не хранится: тот же хэш, тот же разговор. Под постом сцены автор иногда отвечает веткой. Под своим постом
   за игрока никто не отвечает. */
function ccPostComments(n, who, st){
  /* Свои реплики под чужим постом: короткая кнопочная и всё, что написано
     словами (n.res). Обе видны всегда — они написаны игроком. См. careerReply. */
  const meAt=esc(ccHandle((CAREER.player||{}).nick||''));
  /* Ответ КОНКРЕТНОМУ человеку под своим постом — игрок из Notion, 8 сентября:
     «we could reply to the people in our own tweet». Такой ответ несёт адресата
     (r.to) и рисуется веткой под его строкой; ответ без адресата — как раньше,
     внизу. Строки под своим постом не хранятся (тот же хэш — тот же разговор),
     поэтому адресат ищется по нику среди нарисованных; если его строка не
     собралась (сменился напарник, подписки), ответ уходит вниз с «@кому». */
  const res=((n&&n.res)||[]);
  const toKey=r=>r.to ? hKey(r.to) : '';
  // r.by — ответ живого напарника (ccMateReMerge), рисуется его ником.
  const mineRow=r=>'<div class="x-co-r'+(r.by?'':' x-co-mine')+(r.to?' sub':'')+'"><b>@'+(r.by?esc(ccHandle(r.by)):meAt)+'</b>'+
      '<span>'+(r.to?'<u>@'+esc(ccHandle(r.to))+'</u> ':'')+esc(r.t||'')+'</span></div>';
  const mine=((n && n.re)
      ? '<div class="x-co-r x-co-mine"><b>@'+meAt+'</b><span>'+esc(L()['ccRe'+n.re]||'')+'</span></div>'
      : '')+
    res.filter(r=>!r.to).map(mineRow).join('');
  const placed=new Set();
  const orphans=()=>res.filter(r=>r.to && !placed.has(toKey(r))).map(mineRow).join('');
  const onlyMine=()=>{ const s=mine+orphans(); return s ? '<div class="x-co">'+s+'</div>' : ''; };
  if(!n || !who) return onlyMine();
  const replies=(st && st.replies)||0;
  if(replies<1) return onlyMine();
  const cr=(CAREER&&CAREER.career)||{};
  const seed=ccHashStr('co|'+(n.id||'')+'|'+(n.k||'')+'|'+(n.day||'')+'|'+(n.text||''));
  const rnd=careerRng(seed);
  const mood=ccCoMood(n);
  // Банк по сезону: в трио про дуо писать нечего — см. ccSquadKey.
  const bankOf=name=>{ const b=L()[ccSquadKey(name)]||L()[name]; return (Array.isArray(b)&&b.length) ? b : null; };
  const fanBank=bankOf('ccCo'+mood)||L().ccCoNews;
  const good=(mood==='Win'||mood==='Pod'||mood==='Duo'||mood==='Sign');
  // Под анонсом дуо профи желают удачи, а не «earned 🐐» (16.10) — у анонса свой банк.
  const proBank=mood==='Duo' ? fanBank : good ? bankOf('ccCoProWin') : mood==='Bad' ? bankOf('ccCoProBad')
              : mood==='Lfd' ? bankOf('ccCoProLfd') : (mood==='Ready'||mood==='Talk'||mood==='Ask') ? (bankOf('ccCoPro'+mood)||fanBank) : fanBank;
  // «🐐» от напарника под сорок третьим местом — нет; под серединой он пишет
  // то же, что под плохим вечером: «вернёмся», «в следующий раз».
  const mateBank=bankOf(mood==='Duo' ? 'ccCoDuo' : (mood==='Bad'||mood==='Mid') ? 'ccCoMateDown'
                 : (mood==='Ready'||mood==='Talk'||mood==='Ask') ? 'ccCoMate'+mood : 'ccCoMateUp');
  // Напарник пишет под вечером, а не под анонсом Epic или скрином таблицы.
  const resulty=good || mood==='Bad' || mood==='Mid' || mood==='News';
  const rows=[], seenH=new Set(), seenT=new Set();
  const authorK=hKey(who.handle||who.name||'');
  const myK=hKey(ccHandle((CAREER.player||{}).nick||''));
  if(authorK) seenH.add(authorK);
  if(myK) seenH.add(myK);
  // Одна и та же строка под одним постом два раза — это уже не два человека.
  const pick=bank=>{
    if(!bank||!bank.length) return null;
    for(let g=0; g<8; g++){ const c=bank[Math.floor(rnd()*bank.length)]; if(!seenT.has(c)){ seenT.add(c); return c; } }
    return null;
  };
  const add=(h, bank, opt)=>{
    const k=hKey(h);
    if(!h||!k||seenH.has(k)||rows.length>=CC_CO_MAX+1) return false;
    const t=pick(bank);
    if(t==null) return false;
    seenH.add(k);
    rows.push(Object.assign({h:String(h), t:t}, opt||{}));
    return true;
  };
  const ovrOf=c=>c ? ((c._ovr!=null?c._ovr:(attrsFor(c)||{}).ovr)||0) : 0;
  // Под постом из другого региона комната — того региона: европейские про под
  // победой в Северной Америке не сидят. См. careerRegionsWeek.
  const away=ccAwayRegionOf(who.card);
  let roster=[];
  try{ roster=(away ? ccSceneRoster(away) : careerRosterNowEU())||[]; }catch(e){ roster=[]; }
  const realOf=h=>{ const k=hKey(h); return k ? (roster.find(c=>hKey(c)===k)||null) : null; };
  // Кто был в той же комнате — по таблице под постом; кого пост упоминает —
  // по тексту. И те и другие — настоящие имена, иначе они не считаются.
  const room=[];
  ((n.tbl&&n.tbl.rows)||[]).forEach(r=>String(r.n||'').split(/\s*[+&]\s*/).forEach(x=>{
    const c=realOf(x.trim()); if(c && hKey(c)!==authorK) room.push(c.handle); }));
  const mentioned=[];
  try{
    String(ccText(n)||'').replace(/@([A-Za-z0-9_]+)/g, (m,h)=>{ const c=realOf(h); if(c && hKey(c)!==authorK) mentioned.push(c.handle); return m; });
  }catch(e){}
  const sad=(mood==='Sad'), hush=(mood==='Ban');
  let hater=false;
  if(who.you){
    const anchor=ccCoAnchor(n);
    // Кивок профи — первым, и только под главным постом того самого дня.
    if(anchor && cr.nod && cr.nod.day===n.day && cr.nod.who) add(cr.nod.who, bankOf('ccCoPro')||L().ccCoPro, {pro:true});
    // Напарник — почти всегда под главным постом вечера, редко под остальными.
    let mate=null; try{ mate=careerPartnerCard(); }catch(e){}
    const mateP=(anchor && resulty) ? (good?0.85:mood==='Bad'?0.6:0.35) : 0.15;
    if(mate && mate.handle && !sad && !hush && rnd()<mateP) add(mate.handle, mateBank, {pro:true});
    // Клуб — под тем, чем можно хвастаться, и только под главным.
    const org=CAREER.org;
    if(anchor && org && org.name && good && rnd()<0.5) add(ccOrgAt(org.name)||ccHandle(org.name), bankOf('ccCoOrg'), {pro:true, org:true});
    // Друзья и те, на кого подписан, — настоящие имена сцены.
    const near=[].concat(cr.friends||[], cr.follows||[]).filter(h=>realOf(h));
    if(near.length && rnd()<(anchor?0.5:0.2)) add(near[Math.floor(rnd()*near.length)], proBank, {pro:true});
    // Живая ссора: соперник приходит и под хороший вечер, и под плохой.
    let hot=[]; try{ hot=careerBeefHot(); }catch(e){}
    if(hot.length && hot[0].h && rnd()<(anchor?0.6:0.2)) add(hot[0].h, bankOf('ccCoTroll'), {pro:true});
    // Хейтер — тем чаще, чем хуже вечер и чем громче карьера.
    const hateP=hush ? 0 : mood==='Bad' ? 0.5 : mood==='Mid' ? 0.25 : good ? 0.12 : 0.08;
    hater=rnd()<hateP*Math.min(1, 0.4+(careerReach()||0)/20000);
  } else if(!who.verified && !who.f){
    // Человек сцены: его пара, его клуб, кто был в комнате, кого он упомянул.
    let mate=null; try{ mate=ccPairMateOf(who.handle); }catch(e){}
    if(mate && mate.handle && resulty && rnd()<(good?0.6:0.3)) add(mate.handle, mateBank, {pro:true});
    let card=null; try{ card=ccWhoCard(who.handle); }catch(e){}
    if(card && card.org && good && rnd()<0.4) add(ccOrgAt(card.org)||ccHandle(card.org), bankOf('ccCoOrg'), {pro:true, org:true});
    /* Кого пост упоминает: бывшая половина под разводом говорит «спасибо за
       всё», новая — под анонсом пары — «🐐», остальные — как сцена. Кто
       упомянут и промолчал, в общий пул не попадает: под «playing with
       @maloyache» сам maloyache писал «ez lobby». */
    mentioned.forEach(h=>{
      // Под постом о вечере отмеченный — это напарник по этому вечеру, даже
      // если пул пар знает его за другим: «top 2 @swizzy» отвечает swizzy как
      // половина, а не как посторонний про.
      if(rnd()<0.5) add(h, sad ? bankOf('ccCoLeft') : (mood==='Duo'||resulty) ? mateBank : proBank, {pro:true});
      else seenH.add(hKey(h));
    });
    const mine=who.ovr||ovrOf(card)||80;
    const pros=room.length ? room : roster.filter(c=>Math.abs(ovrOf(c)-mine)<=8).map(c=>c.handle);
    const nPro=1+Math.floor(rnd()*2);
    for(let i=0; i<nPro && pros.length; i++) add(pros[Math.floor(rnd()*pros.length)], proBank, {pro:true});
  } else {
    // Пресса или клуб: отвечают те, о ком пост, и верх сцены.
    // Тот, о ком пост, либо благодарит, либо молчит — «monster» под
    // поздравлением с собственной победой он не пишет.
    // Под слухом о себе не благодарят — отмалчиваются или отшучиваются (16.10).
    mentioned.forEach(h=>{ if(rnd()<0.6) add(h, bankOf(mood==='Rumor' ? 'ccCoRumorMe' : 'ccCoTy'), {pro:true}); else seenH.add(hKey(h)); });
    const top=roster.slice().sort((a,b)=>ovrOf(b)-ovrOf(a)).slice(0, 60);
    const nPro=(mood==='Table'||mood==='Hype') ? 1 : 1+Math.floor(rnd()*2);
    for(let i=0; i<nPro && top.length; i++) add(top[Math.floor(rnd()*top.length)].handle, proBank, {pro:true});
  }
  // Зрители — сколько под постом принято показывать, минус те, кто уже сказал.
  const want=Math.min(CC_CO_MAX, Math.max(1, Math.min(replies, 2+Math.floor(rnd()*4))));
  const fanHandle=()=>{
    // 30.10, его «никнеймы чет не популярные» (скрин ответов @krisbot, @lenrss): больше половины пишущих — известные
    // про региона (ccPopularHandles), остальное — люди с кубков, как раньше.
    const pop=ccPopularHandles();
    if(pop.length && rnd()<0.55) return pop[Math.floor(rnd()*pop.length)];
    // Настоящие люди региона, которые играют кубки (CC_LADDER_REAL), — выдуманный ник только когда их нет.
    const rp=ccLadderRealPick(rnd, new Set(), 0); if(rp) return rp[0];
    // Тем же составителем, что и ладдер: зритель под постом и выдуманный из
    // лобби — одна и та же сцена, и ники у них должны быть одной породы.
    const a=CC_LAD_A[Math.floor(rnd()*CC_LAD_A.length)];
    const b=CC_LAD_B[Math.floor(rnd()*CC_LAD_B.length)];
    let h=a.charAt(0).toUpperCase()+a.slice(1)+b;
    const r=rnd();
    if(r<0.35) h+=String(10+Math.floor(rnd()*89));
    else if(r<0.55) h+=['fn','_fn','ttv','yt','_'][Math.floor(rnd()*5)];
    return h;
  };
  let guard=0;
  while(rows.length<want && guard++<40) add(fanHandle(), fanBank, {});
  if(hater) add(fanHandle(), bankOf((mood==='Bad'||mood==='Mid') ? 'ccCoHateBad' : 'ccCoHate'), {hate:true});
  /* ВЕТКИ И РАТИО (16.10, его «3»): под хейтером за тебя вступаются — напарник, если есть, иначе зритель, — и хейтер
     иногда огрызается; под чужими постами зрители спорят с первым ответом. У каждого ответа свои лайки (доля лайков
     поста по роли), а хейтер под твоим слабым вечером иногда собирает больше лайков, чем пост, — «Ratio». */
  {
    const hi=rows.findIndex(r=>r.hate);
    if(hi>=0){
      const hr=rows[hi];
      hr.ratio=!!who.you && (mood==='Bad'||mood==='Mid') && rnd()<0.25;
      let mh=null; try{ const m=who.you ? careerPartnerCard() : ccPairMateOf(who.handle); mh=m && m.handle; }catch(e){}
      const dh=(mh && hKey(mh)!==authorK) ? mh : fanHandle();
      const dt=pick(bankOf('ccCoDefend'));
      if(dt){
        rows.splice(hi+1, 0, {h:dh, t:dt, pro:dh===mh, sub:true, def:true});
        if(rnd()<0.45){ const bt=pick(bankOf('ccCoHateBack')); if(bt) rows.splice(hi+2, 0, {h:hr.h, t:bt, hate:true, sub:true}); }
      }
    }
    if(!who.you && rows.length>=2 && rnd()<0.3){
      const i=rows.findIndex(r=>!r.sub && !r.hate);
      const bt=i>=0 ? pick(bankOf('ccCoBanter')) : null;
      if(bt) rows.splice(i+1, 0, {h:fanHandle(), t:bt, sub:true});
    }
    const pl=Math.max(1, (st && st.likes)||1);
    rows.forEach(r=>{ const k=r.ratio ? 1.1+rnd()*0.9 : r.pro ? 0.04+rnd()*0.25 : r.def ? 0.05+rnd()*0.3 : r.hate ? 0.01+rnd()*0.06 : 0.005+rnd()*0.08;
      r.likes=Math.round(pl*k); });
  }
  /* Автор отвечает одному из написавших — только человек сцены, и не в
     каждом посте: под своим за игрока не пишет никто, аккаунт сцены и клуб
     в комментариях не сидят. */
  if(!who.you && !who.verified && !who.f && who.handle && rows.length && !hush && rnd()<0.4){
    const at=rows.findIndex(r=>r.pro && !r.org);
    const i=at>=0 ? at : Math.floor(rnd()*rows.length);
    const t=pick(bankOf('ccCoTy'));
    if(t!=null) rows.splice(i+1, 0, {h:who.handle, t:t, pro:true, sub:true});
  }
  if(!rows.length) return onlyMine();
  const left=Math.max(0, replies-rows.length);
  const idAt=esc(n.id||'');
  const rowHTML=r=>{
    const hAt=esc(ccHandle(r.h));
    let s='<div class="x-co-r'+(r.pro?' pro':'')+(r.org?' org':'')+(r.hate?' hate':'')+(r.sub?' sub':'')+'">'+
        '<b>@'+hAt+(r.org?'<i class="x-tick">✓</i>':'')+'</b><span>'+esc(r.t)+'</span>'+
        (r.ratio ? '<i class="x-ratio">Ratio</i>' : '')+(r.likes>0 ? '<em class="x-co-l">♥ '+ccFollowers(r.likes)+'</em>' : '')+
        // Под своим постом у каждой строки — «Ответить»: см. careerReplyTo.
        (who.you && !r.sub ? '<button class="x-co-re" onclick="careerReplyTo(\''+idAt+'\',\''+
           jsq(r.h)+'\')">'+esc(L().ccReplyBtn)+'</button>' : '')+
      '</div>';
    if(!who.you) return s;
    const k=hKey(r.h);
    const thread=res.filter(x=>x.to && toKey(x)===k);
    if(thread.length){
      placed.add(k);
      s+=thread.map(mineRow).join('');
      /* И он отвечает в ответ — коротко, из того же банка благодарностей, что и
         под прессой. Посеяно от поста и ника: перерисовка не меняет разговор.
         Хейтер не отвечает — с ним разговора нет. */
      if(!r.hate){
        const back=bankOf('ccCoTy');
        const rb=careerRng(ccHashStr('back|'+(n.id||'')+'|'+k));
        if(back && back.length && rb()<0.6)
          s+='<div class="x-co-r'+(r.pro?' pro':'')+' sub"><b>@'+hAt+'</b><span>'+
             esc(back[Math.floor(rb()*back.length)])+'</span></div>';
      }
    }
    if(CC_REPLY_OPEN===n.id && CC_REPLY_TO && hKey(CC_REPLY_TO)===k)
      s+='<div class="x-replybox x-replybox-sub">'+
         '<textarea id="ccReplyBox'+idAt+'" rows="2" maxlength="'+CC_POST_MAX+'" placeholder="'+
           esc(L().ccReplyPh)+' @'+hAt+'"></textarea>'+
         '<button class="ch-sign" onclick="careerReplyWrite(\''+idAt+'\')">'+esc(L().ccReplySend)+'</button></div>';
    return s;
  };
  return '<div class="x-co">'+rows.map(rowHTML).join('')+
    mine+orphans()+
    (left?'<div class="x-co-more">'+esc(L().ccCoMore(ccFollowers(left)))+'</div>':'')+
  '</div>';
}
/* Регион автора, если он не свой. Карточка автора несёт регион с записи
   (by.card.region — так ищется и портрет); свой регион и всё, что не регион,
   читается как «дома». */
function ccAwayRegionOf(card){
  const reg=card && card.region;
  if(!reg || reg===ccCareerRegion() || CC_REGIONS.indexOf(reg)<0) return null;
  return reg;
}
function ccRegChipHTML(card){
  const reg=ccAwayRegionOf(card);
  return reg ? '<i class="x-reg" title="'+esc(regionName(reg))+'">'+esc(ccRegShort(reg))+'</i>' : '';
}
/* Две кнопки под чужим постом — единственное место в ленте, где игрок отвечает
   не лайком. Стоят только под постом ссоры и только пока на него не ответили:
   отвеченный биф — это уже история, и предлагать выбрать заново нечего. */
/* ---- ПОДПИСКИ, УВЕДОМЛЕНИЯ И ЧТО МОЖНО СДЕЛАТЬ ПОД ПОСТОМ -----------------

   Правка: «уведомления добавил, чтоб видел скок лайков ему
   ставят или если игрок подписался на него ты можешь в ответ подписаться…
   подписки зависят от самого игрока он сам жмёт… если лфд или лфт человек, на
   твите будет кнопка написать в лс… или воуч написать, что игроку нужно дать
   шанс… чтоб в сошиал у игрока был выбор разный в комментариях».

   Пять вещей, и все — про одно: лента до сих пор была только для чтения. Здесь
   она становится местом, где можно ответить.

   Ничего не выдумывается заново: лайки берутся из ccPostStats (те же числа, что
   и под постом), подписчики — из охвата, который и есть аудитория карьеры, а
   личка и поиск дуо уже умеют всё, к чему ведут кнопки. */
function ccFollows(){ const cr=CAREER.career; return (cr.follows=cr.follows||[]); }
/* Кого показать из чужого региона: четверо из сорока сильнейших его ростера,
   без тех, на кого уже подписан, перетасованные неделей — чтобы список не стоял
   одной и той же четвёркой весь год. Форма записи — как у инбокса (careerDmPool):
   аватарка читает roster/cardRegion, чтобы взять портрет из папки региона. */
let CH_SUG_REG=null;
function careerSugRegion(r){ CH_SUG_REG=String(r||''); careerRenderHub('social'); }
function ccAwaySuggest(reg){
  let list=[];
  try{ list=(ccSceneRoster(reg)||[]).slice(0, 40); }catch(e){ list=[]; }
  list=list.filter(c=>c && c.handle && !ccFollowing(c.handle));
  let week=1; try{ week=careerWeekIndex(careerToday()); }catch(e){}
  const rnd=careerRng(ccHashStr('sug|'+reg+'|'+week));
  for(let i=list.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=list[i]; list[i]=list[j]; list[j]=t; }
  return list.slice(0, 4).map(c=>({handle:c.handle, ovr:c._ovr, nat:c.nat,
    role:(attrsFor(c)||{}).roleKey, roster:true, cardRegion:reg}));
}
function ccFollowing(h){ return ccFollows().some(x=>hKey(x)===hKey(h)); }
function careerFollow(h){
  if(!h || ccFollowing(h)) return;
  ccFollows().push(String(h));
  careerSave(); careerRenderHub('social');
}
function careerUnfollow(h){
  const f=ccFollows(), at=f.findIndex(x=>hKey(x)===hKey(h));
  if(at<0) return;
  f.splice(at,1);
  careerSave(); careerRenderHub('social');
}
/* Уведомления. Хранятся как события, а не как готовые строки: текст собирается
   на показ, поэтому смена языка переписывает и их. Больше CC_NOTES_KEEP не
   копится — это лента уведомлений, а не журнал. */
const CC_NOTES_KEEP=40;
// Каждая тысяча охвата — это новый человек, который на тебя подписался.
const CC_NOTE_REACH_STEP=1000;
function careerNotes(){ const cr=CAREER.career; return (cr.notes=cr.notes||[]); }
function careerNoteAdd(kind, who, extra){
  const cr=CAREER.career, list=careerNotes();
  list.unshift(Object.assign({id:'t'+(cr.noteN=(cr.noteN||0)+1), kind:kind,
                              who:who||'', day:careerToday()}, extra||{}));
  if(list.length>CC_NOTES_KEEP) list.length=CC_NOTES_KEEP;
}
function careerNotesNew(){
  const seen=CAREER.career.noteSeen||0;
  return careerNotes().filter(t=>Number(String(t.id).slice(1))>seen).length;
}
/* Имя нарочно НЕ careerNotesSeen: так уже называется отметка ленты
   прочитанной (cr.newsSeen), и вторая функция с тем же именем молча
   переопределила бы первую — счётчик уведомлений тогда не гаснет вовсе.
   Поймано сторожем: «seen=undefined». */
function careerNoteMarkSeen(){
  const list=careerNotes();
  if(list.length) CAREER.career.noteSeen=Number(String(list[0].id).slice(1));
}
/* День приносит уведомления. Два повода, оба — из уже посчитанного:

   ЛАЙКИ. Свежий свой пост собирает их по ccPostStats — те же числа, что стоят
   под ним в ленте. Уведомление приходит один раз на пост, иначе один вечер
   писал бы их каждый день.

   ПОДПИСЧИКИ. Охват вырос через тысячу — значит на тебя подписался кто-то из
   сцены. Кто именно — берётся из комнаты, а не выдумывается, и на него можно
   подписаться в ответ. */
/* ---- Анонсы Epic и что сцена о них думает ---------------------------------

   У настоящих это самые громкие посты года: «wait but there's more :) FNCS
   SOLO. RELOAD. NOVEMBER. Details soon.» — 514 тысяч просмотров, и следом
   сотни ответов от игроков: «omggggg», «Plz dont be in the 4-9th november plz».

   У нас пресс-аккаунт писал только результаты. Теперь он объявляет и то, что
   будет: за две недели до крупного вечера — анонс с артом события, а двое из
   комнаты отвечают на него цитатой. Календарь мод знает наперёд, поэтому
   ничего не выдумывается: берётся ближайшее событие и его же арт. */
const CC_ANNOUNCE_DAYS=14;
/* РАСПИСАНИЕ ГОДА ОДНИМ ПОСТОМ — как у Epic. Отзыв: «анонсы капов пусть
   будут такие же, как у эпиков, они же там на год всё расписывают». Так и есть: у Epic
   в начале сезона выходит дорожная карта — все Мейджоры, Reload, Соло и ЛАНы с датами
   на весь год, а тизеры («wait but there's more :)») идут уже по ходу. Здесь то же:
   один раз на сезон пресс-аккаунт выкладывает весь календарь (собранный из CAREER_YEAR:
   событие — первый и последний день его блоков), а анонсы за две недели остались.
   Событие называется именем серии без стадии: «Мейджор 1», «Reload · кап 3», «Саммит»,
   у ЛАНов — с городом (ccYearLabel). Сцена отвечает цитатой, как под любым анонсом. */
function ccRoadmapLines(){
  const groups=new Map();
  const keyOf=id=>String(id).replace(/_(PlayIn|Heats|LCQ|Final|Upper|Lower|Qualifier|Q\dRound\d|FastTrack|LCQRound\d|LCQFinal)$/,'')
                          .replace(/(Opens|PlayIn|Heats|Final)$/,'');
  ccYearRows().forEach(row=>{
    const from=row[0], to=row[1], id=row[2], kind=row[3];
    const k=keyOf(id);
    const g=groups.get(k)||{from:from, to:to, id:id, kind:kind, n:0};
    if(from<g.from) g.from=from;
    if(to>g.to){ g.to=to; g.id=id; }
    g.n++;
    groups.set(k, g);
  });
  const name=g=>{
    let s=ccYearLabel(g.id, g.from, g.from);
    if(g.n>1){
      // Стадию с конца долой: «Reload · кап 1, финал» → «Reload · кап 1», «Мейджор 1 · финал» → «Мейджор 1».
      if(/,\s*[^,]+$/.test(s)) s=s.replace(/,\s*[^,]+$/,'');
      else if(/\s·\s[^·]+$/.test(s)) s=s.replace(/\s·\s[^·]+$/,'');
    }
    return s;
  };
  return [...groups.values()].sort((a,b)=>a.from<b.from?-1:1).map(g=>
    '• '+esc(name(g))+' — '+esc(ccDayLabel(g.from))+(g.to!==g.from ? ' – '+esc(ccDayLabel(g.to)) : ''));
}
/* РАСПИСАНИЯ ГОДА В ЛЕНТЕ БОЛЬШЕ НЕТ. Слово со скрином «FNCS 2026 — the year at a
   glance» и репостом «please not those exact dates»: «не надо подобные посты про даты». Пост
   не выходит, а тот, что уже лежит в старом сейве, вычищается вместе с ответами на него.
   Календарь года у игрока остаётся на вкладке календаря; анонс ближайшего Мейджора за две
   недели (careerAnnounceTick) остаётся — это одно событие, а не список дат. */
function careerRoadmapTick(){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const news=cr.news||[];
  // И продление стаффа (16.10, его слово «стафф когда продление не нужно писать в сошиал») — тем же путём из старых сейвов.
  const gone=new Set(news.filter(n=>n && (n.k==='ccNewsRoadmap' || n.k==='ccNewsStaffRenew')).map(n=>n.id));
  if(gone.size) cr.news=news.filter(n=>!(n && (gone.has(n.id) || (n.q && gone.has(n.q)))));
  return false;
}
// Двое из комнаты отвечают анонсу цитатой — так это выглядит в ленте.
function ccAnnounceReact(top){
  const pool=(typeof careerDmPool==='function') ? careerDmPool() : [];
  pool.slice(0, 2).forEach(function(w, i){
    if(!w || !w.handle || !top) return;
    careerNews('flat', i===0 ? 'ccPostHype' : 'ccPostDates', [ccHandle(w.handle)], {q:top.id});
  });
}
function careerAnnounceTick(){
  const cr=CAREER.career, days=careerYearDays();
  careerRoadmapTick();
  const at=ccAddDays(careerToday(), CC_ANNOUNCE_DAYS);
  /* Только по-настоящему крупное и НЕ ЧАЩЕ РАЗА В МЕСЯЦ.

     Первая версия звала анонсом каждый вечер Мейджора и каждую сессию Reload —
     сорок анонсов за год, то есть один в девять дней. Epic объявляет пять-шесть
     раз в год, и именно поэтому такой пост читается как событие. Ключ — месяц,
     а не дата: так один анонс закрывает всю серию. */
  const on=(days.get(at)||[]).filter(e=>e && (e.kind==='major'||e.kind==='gc'));
  if(!on.length) return;
  const ev=on[0], key='an|'+at.slice(0,7);
  cr.told=cr.told||{};
  if(cr.told[key]) return;
  cr.told[key]=1;
  careerNews('good', 'ccNewsAnnounce', [ev.label||'', ccDayLabel(at)],
             {art:(ev.kind==='gc'?'gc':ev.kind)});
  // И реакция сцены — цитатой, как это и выглядит в ленте.
  ccAnnounceReact((cr.news||[])[0]);
}
function careerNotesTick(){
  /* Карьеры может не быть вовсе: скриншот — красная плашка
     «Cannot read properties of null (reading 'career')» ровно на этой строке.
     Тик зовётся из careerAdvanceBody и из ленты, а обе дороги можно застать
     после выхода из карьеры (careerWipe оставляет CAREER=null, а перерисовка
     ещё идёт). Молчим — уведомлять некого. */
  const cr=CAREER && CAREER.career;
  if(!cr) return;
  (cr.news||[]).slice(0, 6).forEach(function(n){
    if(!n || !n.id || n.liked===undefined && false) return;
    if(n.noted) return;
    const who=ccPostAuthor(n);
    if(!who.you) return;
    const st=ccPostStats(n, who);
    if(!(st.likes>0)) return;
    n.noted=1;
    // Кто лайкнул — настоящий человек из комнаты, как в уведомлениях X
    // («ASP wheat and 11 others liked your post»). См. ccNoteWho.
    careerNoteAdd('like', ccNoteWho(n, 'l'), {post:n.id, n:st.likes});
    if(st.reposts>0) careerNoteAdd('repost', ccNoteWho(n, 'r'), {post:n.id, n:st.reposts});
  });
  /* И ответы под своими постами — их видно по счётчику, который лента и так
     рисует. Одно уведомление на пост, как и у лайков. */
  (cr.news||[]).slice(0, 6).forEach(function(n){
    if(!n || !n.id || n.notedRe) return;
    const who=ccPostAuthor(n);
    if(!who.you) return;
    const st=ccPostStats(n, who);
    if(!(st.replies>0)) return;
    n.notedRe=1;
    careerNoteAdd('reply', ccNoteWho(n, 'c'), {post:n.id, n:st.replies});
  });
  const step=Math.floor(careerReach()/CC_NOTE_REACH_STEP);
  const was=cr.noteReach||0;
  if(step>was){
    cr.noteReach=step;
    const pool=(typeof careerDmPool==='function') ? careerDmPool() : [];
    const pick=pool.filter(w=>w && w.handle && !ccFollowing(w.handle))
                   .sort((a,b)=>(b.ovr||0)-(a.ovr||0))[Math.min(2, Math.max(0, step%3))];
    if(pick) careerNoteAdd('follow', pick.handle, {});
  }
}
/* Что можно сделать прямо под постом.

   Свободному агенту — написать в личку и поручиться за него; своему посту —
   ответить тем, кто под ним написал. Обе кнопки ведут туда, где действие
   по-настоящему живёт: первая открывает диалог, вторая пишет твою строку. */
function careerPostDm(h){
  CH_SOCIAL='dms';
  careerDmWrite(h);
}
/* Воуч — публичное «дайте ему шанс». Стоит он не денег, а имени: сцена читает
   это как твою рекомендацию, и тот, за кого поручились, отвечает теплее (та же
   прибавка, что и у дружбы, — см. CAREER.dmBoost в careerFriendAsk). */
function careerVouch(h){
  const cr=CAREER.career;
  cr.vouch=cr.vouch||{};
  const k=hKey(h);
  if(cr.vouch[k]) return;
  cr.vouch[k]=careerToday();
  careerNews('good', 'ccPostVouch', [ccHandle(h)]);
  careerReachAdd(1);
  careerSave();
  careerRenderHub('social');
}
function ccVouched(h){ return !!((CAREER.career.vouch||{})[hKey(h)]); }
/* Ответ игрока только под чужим постом, под своим отвечать незачем. Как у настоящих (@ScrollSZN, Replies):
   одно-два слова, «V» это воуч, «Hbd goat», «I did». Ответы предлагаются там, где есть повод, и короткие.
   Ответ пишется в сам пост и показывается последней строкой комментариев. */
const CC_RE_BY_KIND=[
  // Ищет напарника — ему поручаются буквой «V» или желают удачи.
  [/^ccPostLfdWant|^ccPostTrioLF|^ccPostDuoSplitBy|^ccNewsLfd/, ['v','gl']],
  // День рождения — «hbd goat», как под настоящим.
  [/^ccPostBday|^ccNewsBday/, ['hbd']],
  // Взятый титул — «W» и аплодисменты.
  [/^ccNewsCongrats|^ccPostOrgWin|^ccNewsWinner|^ccPostWon|^ccPostPodium/, ['w','clap']]
];
function ccReplyOpts(n){
  const k=String((n&&n.k)||'');
  for(let i=0;i<CC_RE_BY_KIND.length;i++)
    if(CC_RE_BY_KIND[i][0].test(k)) return CC_RE_BY_KIND[i][1];
  return null;
}
function careerReply(id, re){
  const n=(CAREER.career.news||[]).find(x=>x.id===id);
  if(!n || n.re) return;
  const opts=ccReplyOpts(n);
  if(!opts || opts.indexOf(re)<0) return;
  n.re=re;
  /* «V» — это и есть воуч: та же запись и та же прибавка, только сказанная так,
     как её говорят на самом деле. Остальные ответы стоят строчку внимания и
     ничего больше: сцена их читает, но карьеру они не двигают. */
  if(re==='v'){
    const who=ccPostAuthor(n);
    if(who && who.handle) careerVouch(who.handle);
    return;                                   // careerVouch сам сохранит и перерисует
  }
  careerReachAdd(1);
  careerSave();
  careerRenderHub('social');
}
/* ---- Репост, цитата и свой ответ словами ----------------------------------

   Три действия, которых в ленте не было, а в настоящей они и есть лента.

   РЕПОСТ — своя запись без текста, которая показывает чужую. ЦИТАТА — она же,
   но со своей строкой сверху: так отвечают на анонсы («omggggg» под «FNCS SOLO.
   RELOAD. NOVEMBER»). ОТВЕТ — обычный комментарий под чужим постом, сколько
   угодно раз и любыми словами, а не пятью заготовками.

   Цитата пишется через тот же композер, что и свой пост: нажатие запоминает,
   что цитируется, и следующая отправленная строка уезжает с ссылкой. */
let CC_QUOTE=null;
function careerRepost(id){
  const src=(CAREER.career.news||[]).find(x=>x.id===id);
  if(!src || src.reposted) return;
  src.reposted=1;
  careerNews('flat', null, null, {q:id});
  careerReachAdd(1);
  careerSave();
  careerRenderHub('social');
}
function careerQuote(id){
  CC_QUOTE=id;
  CH_SOCIAL='feed';
  careerRenderHub('social');
  const box=document.getElementById('ccPostBox');
  if(box) box.focus();
}
function careerQuoteCancel(){ CC_QUOTE=null; careerRenderHub('social'); }
/* Ответ словами. Живёт в самой записи списком, потому что это ответы на неё;
   пятнадцать штук под одним постом — уже разговор, дальше не копится. */
const CC_REPLY_MAX=15;
function careerReplyWrite(id){
  const box=document.getElementById('ccReplyBox'+id);
  if(!box) return;
  const text=String(box.value||'').replace(/\s+/g,' ').trim().slice(0, CC_POST_MAX);
  if(!text) return;
  if(/^mate:/.test(String(id))){
    const cr=CAREER.career, k=hKey(careerCard()||{handle:''})+':'+Date.now().toString(36);
    cr.mateRe=(cr.mateRe||[]).concat([{id:String(id).slice(5), t:text, day:careerToday(), k:k}]).slice(-CC_MATE_RE_N);
    box.value='';
    careerSave(); ccMpSendCardSoon();
    careerRenderHub('social');
    return;
  }
  const n=(CAREER.career.news||[]).find(x=>x.id===id);
  if(!n) return;
  // Адресат — только если поле открыто именно ему под этим постом.
  const to=(CC_REPLY_TO && CC_REPLY_OPEN===id) ? String(CC_REPLY_TO) : null;
  n.res=(n.res||[]).concat([to ? {t:text, day:careerToday(), to:to} : {t:text, day:careerToday()}]);
  if(n.res.length>CC_REPLY_MAX) n.res.length=CC_REPLY_MAX;
  if(to){ CC_REPLY_OPEN=null; CC_REPLY_TO=null; }
  careerSave(); ccMpSendCardSoon();
  careerRenderHub('social');
}
let CC_REPLY_OPEN=null, CC_REPLY_TO=null;
function careerReplyOpen(id){ CC_REPLY_OPEN=(CC_REPLY_OPEN===id?null:id); CC_REPLY_TO=null; careerRenderHub('social'); }
/* Ответить человеку под СВОИМ постом. Игрок: «I think
   u should add more things like we could reply to the people in our own tweet».
   Правило («зачем под свой твит чет писать») остаётся про пост
   целиком — под своим постом нет общего поля; есть «Ответить» у каждой строки,
   и это ответ человеку, а не себе. Поле встаёт под его строкой, запись уходит
   с адресатом (см. careerReplyWrite и ветка в ccPostComments). */
function careerReplyTo(id, h){
  if(!id || !h) return;
  if(CC_REPLY_OPEN===id && CC_REPLY_TO && hKey(CC_REPLY_TO)===hKey(h)){ CC_REPLY_OPEN=null; CC_REPLY_TO=null; }
  else { CC_REPLY_OPEN=id; CC_REPLY_TO=String(h); }
  careerRenderHub('social');
  const box=document.getElementById('ccReplyBox'+id);
  if(box) box.focus();
}
function ccPostActsHTML(n, who, st){
  if(who.you){
    // Под своим постом отвечать некому, но свои ответы под ним видны.
    return '';
  }
  const bits=[];
  const id=esc(n.id||'');
  bits.push(`<button class="x-act" onclick="careerReplyOpen(\'${id}\')">${L().ccReplyBtn}</button>`);
  bits.push(n.reposted
    ? `<span class="x-act-done">${L().ccRepostDone}</span>`
    : `<button class="x-act" onclick="careerRepost(\'${id}\')">${L().ccRepostBtn}</button>`);
  bits.push(`<button class="x-act" onclick="careerQuote(\'${id}\')">${L().ccQuoteBtn}</button>`);
  // Под постом набора в кастомку — «попроситься», пока не попросился.
  if(n.k==='ccPostCustomsOpen') bits.push(n.asked
    ? `<span class="x-act-done">${L().ccAskDone}</span>`
    : `<button class="x-act" onclick="careerCustomAsk(\'${id}\')">${L().ccAskBtn}</button>`);
  /* Свободный агент — тот, у кого открыта анкета: ему и пишут. Кнопка стоит
     под его же объявлением, где решение и принимается. */
  if(who.handle && typeof ccAdOf==='function' && ccAdOf(who.handle))
    bits.push(`<button class="x-act" onclick="careerPostDm('${
      jsq(who.handle)}')">${L().ccPostDmBtn}</button>`);
  // И короткий ответ, если под этим постом есть что сказать. См. careerReply.
  const opts=ccReplyOpts(n);
  if(opts){
    if(n.re) bits.push(`<span class="x-act-done">${L().ccReDone(L()['ccRe'+n.re])}</span>`);
    else opts.forEach(a=>bits.push(`<button class="x-act x-act-re" onclick="careerReply('${
      esc(n.id||'')}','${a}')"${a==='v'?` title="${esc(L().ccPostVouchWhat)}"`:''}>${
      L()['ccRe'+a]}</button>`));
  }
  // Поле ответа открывается по кнопке и стоит прямо под ней.
  const box=(CC_REPLY_OPEN===n.id)
    ? `<div class="x-replybox">
        <textarea id="ccReplyBox${esc(n.id||'')}" rows="2" maxlength="${CC_POST_MAX}"
          placeholder="${esc(L().ccReplyPh)}"></textarea>
        <button class="ch-sign" onclick="careerReplyWrite('${esc(n.id||'')}')">${L().ccReplySend}</button>
      </div>`
    : '';
  return bits.length ? `<div class="x-acts2">${bits.join('')}</div>`+box : box;
}
function ccBeefActsHTML(n){
  if(!n || !n.beef) return '';
  if(n.beefDone) return `<div class="x-beef-done">${
    n.beefDone==='hit' ? L().ccBeefDoneHit : L().ccBeefDoneQuiet}</div>`;
  return `<div class="x-beef">
    <button class="x-beef-hit" onclick="careerBeefAnswer('${esc(n.id||'')}','hit')">${
      L().ccBeefBtnHit}</button>
    <button class="x-beef-quiet" onclick="careerBeefAnswer('${esc(n.id||'')}','quiet')">${
      L().ccBeefBtnQuiet}</button></div>`;
}
function ccPostHTML(n){
  const stamp=ccStamp(n);
  const who=ccPostAuthor(n);
  const st=ccPostStats(n, who);
  return `<article class="x-post x-post-${n.kind}">`+
      `${ccAvatar(who)}`+
      `<div class="x-post-in">`+
        // По нику можно нажать и попасть в его профиль — так ходят по X.
        `<header>${who.you
          ? `<b>${esc(who.name)}</b>`
          : `<b class="x-who-link" onclick="careerWho('${jsq(who.name)}')">${
              esc(who.name)}</b>`}${who.verified?'<i class="x-tick">✓</i>':''}`+
        // Статус — на самом человеке, как в настоящей ленте: «F/A», «LFT» или
        // клуб. См. ccWhoStatus.
        `${who.you?'':ccWhoChipHTML(who.handle)}`+
        // Из другого региона — с его кодом рядом с ником. См. careerRegionsWeek.
        `${who.you?'':ccRegChipHTML(who.card)}`+
        `<span>@${esc(who.handle)}</span><span class="x-dot">·</span><span>${stamp}</span></header>`+
        `<p>${ccFlagImgs(ccMentions(ccText(n)))}</p>`+
        ccShotHTML(n.tbl)+ccLeadHTML(n.lead)+
        ccDropMapHTML(n)+
        ccArtHTML(n)+
        ccQuoteHTML(n)+
        ccCardShotHTML(n.card)+
        ccPollHTML(n)+
        (n.sp ? `<div class="x-sp"><img src="${PHOTO_DIR}sp_${esc(CC_SPONSOR_LOGO[n.sp]||n.sp)}.png" alt="" onerror="this.remove()"><span>${esc(L()["ccSponsor"+n.sp]||n.sp)}</span></div>` : "")+
        `<div class="x-acts"><span>${CC_X_REPLY}<b>${ccFollowers(st.replies)}</b></span>`+
        `<span>${CC_X_REPOST}<b>${ccFollowers(st.reposts)}</b></span>`+
        `<button class="x-like${n.liked?' on':''}" onclick="careerPostLike('${n.id||''}')"`+
        ` title="${esc(L().xLike)}" aria-pressed="${n.liked?'true':'false'}">`+
        `${CC_X_LIKE}<b>${ccFollowers(st.likes+(n.liked?1:0))}</b></button>`+
        `<span>${CC_X_VIEWS}<b>${ccFollowers(st.views)}</b></span></div>`+
        ccBeefActsHTML(n)+
        ccPostActsHTML(n, who, st)+
        ccPostComments(n, who, st)+
      `</div></article>`;
}
/* ---- Свой пост -------------------------------------------------------------
 *
 * Просьба: писать в ленту самому. Всё остальное в ней написано
 * режимом — под твоим ником, но твоими словами о твоём вечере, — и одной
 * строки, которую действительно написал игрок, там не было.
 *
 * Двести сорок знаков, потому что это одна мысль, а лента карьеры держит
 * последние CAREER_NEWS_KEEP записей и своя строка вытесняет чужие наравне со
 * всеми. Текст ложится в запись как есть — careerNews умеет запись без ключа, —
 * и ccText отдаёт его экранированным: единственный текст в этой ленте, который
 * пришёл не из словаря.
 */
const CC_POST_MAX=240;
function ccPostLeft(){
  const box=document.getElementById('ccPostBox'), left=document.getElementById('ccPostLeft');
  if(!box || !left) return;
  left.textContent=String(CC_POST_MAX-(box.value||'').length);
}
/* ЧТО НАПИСАТЬ (16.10, Notion 15.10 скрин 13: «варианты ответов что написать, смотря что происходит в карьере»). Под полем
   поста — до четырёх готовых строк из того, что с карьерой сейчас: свежий результат, новый напарник или его нет, турнир
   завтра, форма, новый сезон, обещание с пресс-конференции. Клик ставит строку в поле — её можно поправить. Языки, где
   строк нет, берут английский: в X сцена пишет так. */
const CC_IDEAS={
  ru:{win:m=>['W'+(m?' @'+m:'')+' 🐐','взяли 🏆 спасибо всем кто болел','1st. едем дальше'],
      pod:(m,p)=>['#'+p+'. близко, следующий наш','топ-'+p+(m?' с @'+m:'')+' 🔥'],
      bad:p=>['не наш день. разберём и вернёмся','#'+p+'. тяжело. go next'],
      mid:p=>['#'+p+' — нормально, но можем лучше','средний вечер, завтра лучше'],
      mate:m=>['играю с @'+m+' 🤝','новый сезон, новое дуо — @'+m+' 🔥'],
      lfd:d=>['LFD. дивизион '+d+'+, пишите в лс','ищу дуо на сезон 🙏 лс открыты'],
      next:e=>['завтра: '+e+'. let’s go','завтра турнир 🎯 фокус'],
      hot:['форма есть 📈','лучшая неделя за сезон'], cold:['тяжёлая неделя. обратно на скримы','не сдаёмся. гринд'],
      meta:s=>['новый сезон '+s+' — мнения по пулу?',''+s+': ищем новую точку 👀'],
      promise:g=>['цель — '+g+'. посмотрите','сказал '+g+' — значит '+g],
      code:c=>['код '+c+' в магазине предметов 💙 #ad','поддержите кодом '+c+' в Item Shop, это правда помогает 🙏 #ad','новый скин в магазине? вводите '+c+' #ad']},
  en:{win:m=>['W'+(m?' @'+m:'')+' 🐐','we won 🏆 thanks for the support','1st. on to the next'],
      pod:(m,p)=>['#'+p+'. so close, next one is ours','top '+p+(m?' with @'+m:'')+' 🔥'],
      bad:p=>['not our day. we review and come back','#'+p+'. rough one. go next'],
      mid:p=>['#'+p+' — fine, but we can do better','mid night, tomorrow better'],
      mate:m=>['playing with @'+m+' 🤝','new season, new duo — @'+m+' 🔥'],
      lfd:d=>['LFD. div '+d+'+, dms open','looking for a duo this season 🙏 dms open'],
      next:e=>['tomorrow: '+e+'. let’s go','tournament tomorrow 🎯 locking in'],
      hot:['in form rn 📈','best week of the season'], cold:['rough week. back to scrims','we don’t stop. grind'],
      meta:s=>['new season '+s+' — thoughts on the pool?',s+': looking for a new spot 👀'],
      promise:g=>['goal is '+g+'. watch','said '+g+', meant '+g],
      code:c=>['use code '+c+' in the Item Shop 💙 #ad','support with code '+c+' in the Item Shop, it really helps 🙏 #ad','new skin in the shop? type '+c+' #ad']}};
function ccPostIdeas(){
  const T=CC_IDEAS[typeof LANG!=='undefined' ? LANG : 'en'] || CC_IDEAS.en, cr=CAREER.career, out=[];
  const rnd=careerRng(ccHashStr('ideas|'+careerToday()));
  const one=a=>a && a.length ? a[Math.floor(rnd()*a.length)] : null;
  const mate=careerMateRec(), mh=mate && mate.card ? mate.card.handle : '';
  // Свежий свой результат — из журнала карьеры (cr.log), последние три дня: место и размер комнаты.
  const last=(cr.log||[]).slice().reverse().find(x=>x && x.day && x.place>0 && ccDaysBetween(x.day, careerToday())<=3);
  if(last){
    const p=last.place, of=Math.max(2, last.of||50), beat=1-(p-1)/(of-1);
    if(p===1) out.push(one(T.win(mh)));
    else if(p<=3 || beat>=0.9) out.push(one(T.pod(mh, p)));
    else if(beat<=0.3) out.push(one(T.bad(p)));
    else out.push(one(T.mid(p)));
  }
  if(mh && mate.since && ccDaysBetween(mate.since, careerToday())<=7) out.push(one(T.mate(mh)));
  if(!mh && !(typeof ccMpOn==='function' && ccMpOn())) out.push(one(T.lfd(cr.division||1)));
  try{ const nx=ccHdrNext(); if(nx && nx.n===1 && nx.ev && nx.ev.label) out.push(one(T.next(nx.ev.label))); }catch(e){}
  const f=careerForm();
  if(f>=1.5) out.push(one(T.hot)); else if(f<=-1.5) out.push(one(T.cold));
  try{ if(ccMetaOpen()) out.push(one(T.meta(ccSeasonTag(careerToday()).short||''))); }catch(e){}
  if(cr.pressPromise){ const g=(ccPressT().goalName||{})[cr.pressPromise.goal]||cr.pressPromise.goal; out.push(one(T.promise(g))); }
  // Свой код — первой идеей, пока промо этого месяца не набрано и сегодня его ещё не было.
  try{ const code=ccSacOwnCode(), p=code && ((CAREER.sacOwn.promo||{})[ccMonthKey()]||{n:0, days:[]});
    if(code && ccSacOwnOn() && p.n<CC_SAC_PROMO_MAX && p.days.indexOf(careerToday())<0 && T.code) out.unshift(one(T.code(code))); }catch(e){}
  return out.filter(Boolean).slice(0, 4);
}
function ccPostIdeasHTML(){
  let ideas=[]; try{ ideas=ccPostIdeas(); }catch(e){ return ''; }
  if(!ideas.length) return '';
  return '<div class="x-ideas">'+ideas.map(t=>'<button type="button" class="x-idea" data-t="'+esc(t)+'" onclick="ccPostIdea(this)">'+esc(t)+'</button>').join('')+'</div>';
}
function ccPostIdea(b){
  const box=document.getElementById('ccPostBox'); if(!box || !b) return;
  box.value=String(b.dataset.t||'').slice(0, CC_POST_MAX); box.focus(); ccPostLeft();
}
function careerPostWrite(){
  const box=document.getElementById('ccPostBox');
  if(!box) return;
  const text=String(box.value||'').replace(/\s+/g,' ').trim().slice(0, CC_POST_MAX);
  if(!text) return;
  box.value='';
  // Если строка пишется как цитата — к ней едет ссылка на цитируемый пост.
  careerNews('flat', null, null, {text:text, q:CC_QUOTE||undefined});
  CC_QUOTE=null;
  try{ if(ccSacPromoPost(text)) careerNews('good', 'ccNewsSacPromo', [ccSacOwnCode(), Math.round(CC_SAC_PROMO*100*ccSacPromoOf(ccMonthKey()))]); }catch(e){}
  careerSave(); ccMpSendCardSoon();   // напарник видит пост сразу, а не после вечера
  careerRenderHub(CH_TAB);
}
// A reader's one contribution to a post. It is stored, so the heart survives a
// redraw and a reload, and it is the only thing on this screen the player can do
// to somebody else's post.
function careerPostLike(id){
  const e=(CAREER.career.news||[]).find(n=>n.id===id);
  if(!e) return;
  e.liked=!e.liked;
  careerSave();
  careerRenderHub(CH_TAB);
}

/* ---- Unread on the main screen ----
   The inbox and the Division 1 feed both sat behind the socials tab, the feed with no dot at all. So the hub lists
   what's unread, who from, one press to open it.
   Messages keep their own unread flag (read when opened); the feed has one mark, cleared by opening socials. Only
   other people's posts count, never your own. */
function ccNewsNum(id){ const n=Number(String(id||'').slice(1)); return n>0?n:0; }
function careerNewsNew(){
  // Та же дорога, что у ccPressWorthy: без карьеры непрочитанного нет.
  const cr=CAREER && CAREER.career;
  if(!cr) return [];
  const seen=cr.newsSeen||0;
  return (cr.news||[]).filter(e=>ccNewsNum(e.id)>seen && !ccPostAuthor(e).you);
}
function careerNotesN(){ return careerDmUnread()+careerNewsNew().length; }
function careerNotesSeen(){
  const cr=CAREER.career;
  cr.newsSeen=cr.newsN||0;
  careerSave();
}
// A save that predates the mark starts level rather than announcing forty posts
// it has already scrolled past.
function careerNotesMigrate(){
  const cr=CAREER && CAREER.career;
  if(cr && cr.newsSeen==null) cr.newsSeen=cr.newsN||0;
}
function careerOpenNote(id){
  const t=careerDms().find(x=>x.id===id);
  if(t) t.unread=false;
  // Pressing a notification opens that conversation, so the inbox it lands in
  // has to be one the conversation is in: whichever tab was left open, this
  // goes to all of them.
  CH_DMKIND=null;
  CH_DM=id; CH_SOCIAL='dms';
  careerSave();
  careerTab('social');
}
function careerOpenFeed(){
  CH_SOCIAL='feed';
  careerTab('social');
}
const CC_NOTES_ROWS=6;
function careerNotesHTML(){
  const dms=careerDms().filter(t=>t.unread);
  const posts=careerNewsNew();
  const total=dms.length+posts.length;
  if(!total) return '';
  const kindKey=t=>t.who.org ? 'club' : t.who.hater ? 'hater' : t.who.fan ? 'fan' : 'duo';
  // An agent is filed with the clubs, because that is the business pile — but he
  // is not one, and this strip was calling him ORGANISATION over a line that
  // reads "I represent players, I take ten per cent". The inbox row and the
  // thread header already say Agent; this is the third place that names him.
  const kindOf=t=>(t.who.agent || t.who.viaAgent) ? L().ccAgentTag
                : t.who.org ? (t.offer ? L().ccOffers : L().ccOrg)
                : t.who.hater ? L().dmSechaters
                : t.who.fan ? L().dmSecfans : L().dmSecduos;
  /* One of each before three of any.

     It took the first three unread threads, which is fine until a night that
     produces four different kinds of message - a club with an offer on it, a
     duo answering, a viewer, and somebody being unpleasant. Three of them
     showed and the contract could be the one that did not, because it happened
     to arrive last. A notification list that can hide the only item with a
     decision on it is not doing the job.

     So the first pass takes one thread per kind, in the order they matter -
     a club with terms on the table, then somebody who wants to play, then the
     room - and the rest fill whatever is left. */
  const CC_NOTE_ORDER=['club','duo','hater','fan'];
  const seen={}, picked=[];
  CC_NOTE_ORDER.forEach(k=>{
    const first=dms.find(t=>kindKey(t)===k);
    if(first){ picked.push(first); seen[first.id]=true; }
  });
  dms.forEach(t=>{ if(!seen[t.id] && picked.length<CC_NOTES_ROWS) picked.push(t); });
  const rows=[];
  // Messages first: a person waiting on an answer outranks a result somebody
  // else posted.
  picked.slice(0, CC_NOTES_ROWS-1).forEach(t=>{
    const last=t.msgs[t.msgs.length-1];
    rows.push(`<button class="cc-note cc-note-dm cc-note-${kindKey(t)}" onclick="careerOpenNote(\'${t.id}\')">
      <i>${kindOf(t)}</i><b>${esc(ccDmName(t.who))}</b>
      <span>${esc(last?ccText(last):'')}</span></button>`);
  });
  posts.slice(0, CC_NOTES_ROWS-rows.length).forEach(e=>{
    const who=ccPostAuthor(e);
    rows.push(`<button class="cc-note" onclick="careerOpenFeed()">
      <i>${who.verified?L().ccNoteScene:L().ccNoteFeed}</i><b>${esc(who.name)}</b>
      <span>${esc(ccText(e))}</span></button>`);
  });
  const more=total-rows.length;
  return `<div class="ch-tile cc-notes">
    <h4>${L().ccNotes}<i class="cc-note-n">${total}</i></h4>
    ${rows.join('')}
    <button class="ch-swap" onclick="careerOpenFeed()">${
      more>0 ? L().ccNotesMore(more) : L().ccNotesOpen}</button>
  </div>`;
}
/* The same thing as a row of icons, which is his reference of 18 August: a mail
   glyph, a speech bubble, a badge, each with the count of what is waiting on it.

   The list version above says who wrote and what they said, which is a lot of
   the screen for something that is read in half a second — "is anything waiting
   for me". This says exactly that and nothing else, and a press goes straight
   to the pile it counted rather than to the top of the inbox.

   Four piles, in the order they cost you something: a club with terms on the
   table, somebody who wants the seat, the room, and whoever is being unpleasant.
   A pile with nothing in it is drawn flat rather than hidden, so the row does
   not move about as the week goes on. */
const CC_NOTE_ICONS={
  clubs:'<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Zm2.2.5 6.8 5 6.8-5H5.2Z"/></svg>',
  duos: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z"/></svg>',
  fans: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8L12 3Z"/></svg>',
  haters:'<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 2 1.5 20.5h21L12 2Zm0 6.5 1 6h-2l1-6Zm0 8.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"/></svg>'
};
function careerNoteBarHTML(){
  const dms=careerDms().filter(t=>t.unread);
  const pile=t=>(t.who.org || t.who.staff) ? 'clubs' : t.who.hater ? 'haters' : t.who.fan ? 'fans' : 'duos';
  const n={clubs:0, duos:0, fans:0, haters:0};
  dms.forEach(t=>{ n[pile(t)]++; });
  const posts=careerNewsNew().length;
  const btn=k=>`<button class="cc-nb cc-nb-${k}${n[k]?' on':''}" onclick="careerOpenPile(\'${k}\')"
      title="${esc(L()['dmSec'+k])}" aria-label="${esc(L()['dmSec'+k])}">
      ${CC_NOTE_ICONS[k]}<span class="cc-nb-l">${esc(L()['dmSec'+k])}</span>${n[k]?`<i>${n[k]>99?'99+':n[k]}</i>`:''}</button>`;
  return `<div class="cc-notebar">
    ${['clubs','duos','fans','haters'].map(btn).join('')}
    <button class="cc-nb cc-nb-feed${posts?' on':''}" onclick="careerOpenFeed()"
      title="${esc(L().ccNews)}" aria-label="${esc(L().ccNews)}">
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M4 4h13a1 1 0 0 1 1 1v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Zm2 3v3h9V7H6Zm0 5v2h9v-2H6Zm0 4v2h6v-2H6Z"/></svg><span class="cc-nb-l">${esc(L().ccNews)}</span>
      ${posts?`<i>${posts>99?'99+':posts}</i>`:''}</button>
    ${(dms.length || posts) ? `<button class="cc-nb cc-nb-clear" onclick="ccBellClearAll(event)" title="${esc(L().ccBellClear)}" aria-label="${esc(L().ccBellClear)}">✓</button>` : ''}
  </div>`;
}
/* Колокольчик в шапке: сумма всего непрочитанного, по нажатию — те же пять кнопок
   (клубы, напарники, фанаты, хейтеры, лента) выпадающим списком с подписями. */
let CC_BELL_OPEN=false;
function ccBellHTML(){
  const dms=careerDms().filter(t=>t.unread).length, posts=careerNewsNew().length, n=dms+posts;
  return '<button class="ch-bell'+(n?' on':'')+'" onclick="ccBellToggle(event)" aria-label="'+esc(L().lfInbox)+'" title="'+esc(L().lfInbox)+'">'+
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'+
    (n ? '<i>'+(n>99?'99+':n)+'</i>' : '')+'</button>'+
    (CC_BELL_OPEN ? '<div class="ch-bell-pop">'+careerNoteBarHTML()+
      (n ? '<button class="ch-bell-clear" onclick="ccBellClearAll(event)">'+esc(L().ccBellClear)+'</button>' : '')+'</div>' : '');
}
/* «Прочитать всё» (его правка 29.09: «нет кнопки, чтоб все уведомления убрать»): все личные
   сообщения — прочитаны, лента — просмотрена. Сами сообщения и посты остаются на месте. */
function ccBellClearAll(e){
  if(e) e.stopPropagation();
  careerDms().forEach(t=>{ t.unread=false; });
  careerNotesSeen();
  CC_BELL_OPEN=false;
  const el=document.getElementById('chBell'); if(el) el.innerHTML=ccBellHTML();
  if(typeof careerRenderHub==='function') careerRenderHub(CH_TAB||'centre');
}
function ccBellToggle(e){
  if(e) e.stopPropagation();
  CC_BELL_OPEN=!CC_BELL_OPEN;
  const el=document.getElementById('chBell'); if(el) el.innerHTML=ccBellHTML();
}
document.addEventListener('click', function(e){
  if(!CC_BELL_OPEN) return;
  const el=document.getElementById('chBell');
  if(el && el.contains(e.target)) return;
  CC_BELL_OPEN=false; if(el) el.innerHTML=ccBellHTML();
});
// A press on one of them opens the socials already filtered to that pile,
// rather than at the top of everything.
function careerOpenPile(kind){
  CC_BELL_OPEN=false;
  CH_DMKIND=kind; CH_SOCIAL='dms';
  careerRenderHub('social');
}

/* Career DMs: duos are found by writing to each other, not on a transfer market.
   Every line is built from something on screen (the result that prompted it, the other player's
   division); no small-talk bank. Acceptance: within 3 rating points says yes, clearly above says no,
   a good result adds a couple of points of persuasion. */
const CAREER_DM_REACH=3, CAREER_DM_KEEP=14;

/* Reputation: whether anybody wants to play next to you, separate from rating. Built from what already happens:
   blaming a partner in public (big), dropping a partner (smaller, leaving is normal), a partner walking out on you
   (costs more than leaving them, the room heard about it).
   Read in one place only, careerDmWouldAccept: 3 rep = 1 rating point, so +10 asks like +1.5 and -20 needs to be
   seven points better. Clubs ignore it and sign on results. */
const CC_REP_MAX=25, CC_REP_PER_OVR=3;
/* 22.11: репутация не только для лички. Рост подписчиков ×(1+rep/100), и сцена уважает результат: победа +2, подиум +1
   (поле от 20). Числа - решение, не замер. */
const CC_REP_WIN=2, CC_REP_POD=1;
function ccRepReachMult(){ return 1+careerRep()/100; }
function ccRepFromResult(place, total){
  if(!CAREER || !(total>=20) || !(place>0)) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  if(place===1) careerRepAdd(CC_REP_WIN); else if(place<=3) careerRepAdd(CC_REP_POD);
}
// Снимок формы и репутации на начало дня: стрелка в шапке говорит, сколько сдвинулось сегодня.
function ccFrDay(){
  const cr=CAREER.career, t=careerToday();
  if(!cr.fr0 || cr.fr0.day!==t) cr.fr0={day:t, f:careerForm(), r:careerRep()};
  return cr.fr0;
}
function ccFrDelta(d, dp){
  const v=dp ? Math.round(d*10)/10 : Math.round(d);
  if(!v) return '';
  return ' <i class="ch-fr-d '+(v>0 ? 'up' : 'down')+'">'+(v>0 ? '▲' : '▼')+Math.abs(v)+'</i>';
}
// Шкала от -max до +max с нулём посередине.
function ccFrMeterHTML(v, max){
  const p=Math.min(50, Math.abs(v)/max*50);
  return '<span class="ch-meter" aria-hidden="true"><i class="'+(v<0 ? 'neg' : 'pos')+'" style="'+(v<0 ? 'right:50%' : 'left:50%')+';width:'+p.toFixed(1)+'%"></i><s></s></span>';
}
// Что стоит титул, когда ты зовёшь человека к себе. См. careerDmMargin.
const CC_DM_CROWN_WIN=6, CC_DM_CROWN_POD=3, CC_DM_CROWN_TOP=1;
function careerRep(){ return clamp((CAREER.career.rep||0), -CC_REP_MAX, CC_REP_MAX); }
function careerRepAdd(n){
  const cr=CAREER.career;
  const was=careerRep();
  cr.rep=clamp((cr.rep||0)+n, -CC_REP_MAX, CC_REP_MAX);
  return careerRep()-was;
}
// Which word the hub puts on it. Four bands, because a number nobody can read
// is not a reputation.
function careerRepKey(){
  const r=careerRep();
  return r>=10 ? 'ccRepLoved' : r>=3 ? 'ccRepLiked'
       : r<=-10 ? 'ccRepToxic' : r<=-3 ? 'ccRepAwkward' : 'ccRepUnknown';
}
function careerDms(){ return (CAREER.dms=CAREER.dms||[]); }
function careerDmUnread(){ return careerDms().filter(t=>t.unread).length; }

// Who is around this week: real cards off the roster, matched on your rating,
// from whatever division they stand in.
//
// The pool is the same six people every time it is asked, all week. It used to
// exclude anyone you had already written to and then top itself back up to
// eight, which meant a new stranger appeared for every message sent and the list
// never ran out — you could sit there writing to an endless queue of people. A
// week has a finite number of people in it. Writing to one takes them off the
// list until the week turns over.
const CAREER_DM_POOL=6;
/* The week's list on a rung the roster does not reach into.

   Six of them, spread around the player's own rating on the same curve a cup
   field is banded on, so the list reads like the division it is in: mostly
   people at your level, one or two better, one or two worse. They carry the
   card they were generated as, because accepting one has to hand the duo seat
   something to play with - careerDmAccept stores `card` for anybody who is not
   off the roster.

   No club and no wage: a generated player on a rung where nothing pays has
   neither, and quoting one would be inventing a contract for somebody who does
   not exist. */
/* The spread is built rather than rolled, because both doors have to exist.

   A week's list is only a decision if it holds people who will say no. Rolled on
   the cup's own band the six came out inside three points of each other, every
   one of them a yes, and the inbox lost the thing it is for: somebody better
   than you writing first, which is the one way up that does not depend on you
   being good enough to ask. CAREER_DM_REACH is 3, so two of the six sit above
   it, two sit around you and two sit under. */
/* Real birthdays from ProSettings, kept only where the country matches the card's nationality (a handle isn't a
   person: their Chap is US, ours is Swiss). Mismatches dropped, hence 13 names. tools/fetch-player-dob.js extends
   it.
   Stored as birthday, not age, since a career walks the year. Display only: the age curve applies just to the
   player's own chosen age. */
const CC_BORN={
  sky:'2009-05-23', scroll:'2009-07-28', th0mashd:'2002-05-30',
  cr1nge:'2009-01-12', flickzy:'2006-05-09', kami:'2005-01-28',
  malibuca:'2005-10-14', tjino:'2007-09-27', pablowingu:'2007-10-04',
  charyy:'2007-11-11', nebs:'2004-07-28', nxthan:'2005-08-09',
  t3eny:'2008-09-11', shxrk:'2011-06-14', swizzy:'2006-04-17',
  pixie:'2007-08-10', rax:'2011-02-24', darm:'2008-12-04',
  demus:'2008-10-01', ghonzo:'2009-10-11', pixx:'2008-04-19',
  volko:'2006-01-22', idrop:'2004-10-27', repairs:'2006-08-16',
  twi:'2009-05-06', jannisz:'2005-04-23', vic0:'2007-05-22',
  shur4:'2006-10-12', kurama:'2007-08-03', wox:'2006-08-27',
  prax:'2007-07-05', tidi:'2008-02-04', hris:'2009-02-05',
  sxdia:'2007-04-03', faki:'2004-10-22', curve:'2010-12-23',
  trippernn:'2004-01-03', vexi:'2007-02-13', artskill:'2006-05-24',
  werex:'2007-01-11', podasai:'2005-07-29', seyyto:'2007-06-30',
  f1n4ik:'2009-08-18', lixium:'2006-07-13', rad3on:'2005-10-04',
  trulex:'2002-09-24', hijoe:'2006-01-04', kyry:'2006-04-02',
  // Quoted: a key that starts with a digit is not an identifier.
  '1lusha':'2004-07-22',
  czb:'2004-11-30', nomzz:'2009-02-02', kikoo:'2006-09-21',
  marco:'2006-12-01', arc:'2003-03-19', ardi:'2004-03-04',
  asa:'2006-03-26', momsy:'2007-03-29', akiira:'2008-05-30',
  mrsavage:'2004-11-12', japko:'2006-09-16', bevvys:'2005-12-26',
  waiz:'2004-02-25', mikson:'2006-04-30', p1ng:'2004-08-25',
  mariuscow:'2006-11-14', noahreyli:'2005-06-30', kiro:'2005-05-08',
  vanyak3kk:'2005-03-02', merstach:'2007-03-27', juu:'2006-07-22',
  vadeal:'2005-01-11', setty:'2003-09-08', skvii:'2003-11-17',
  ricbor:'2006-11-29', kombek:'2006-08-17', toose:'2002-07-29',
  queasy:'2002-04-17', minori:'2011-03-01', jarko:'2007-07-07',
  /* Семьдесят девять дат с Liquipedia, 22 августа — дивизион 1 Европы.
     Сверены по стране так же, как портреты выше; тёзки отсеяны.

     Fnajen, Moneymaker и Zenox найдены и подтверждены, но сюда не попали:
     ключ этой таблицы — голый ник без региона, а этих троих в файле носят
     по два человека из разных регионов. Их дата ушла бы чужому. */
  adrixx:'2007-06-03', akiira:'2008-05-30', ardi:'2004-03-04',
  art1st:'2005-07-12', artskill:'2006-05-24', asa:'2006-03-27',
  auvahalo:'2006-12-01', axeforce:'2006-05-18', birk:'2009-05-06',
  blacha:'2005-03-31', cheapz:'2002-03-18', cheetiin:'2004-10-22',
  clement:'2003-02-17', cxshy:'2007-10-16', deckzee:'2006-05-22',
  eclipse:'2007-04-16', f1n4ik:'2009-08-18', f1shyx:'2008-07-20',
  faded:'2006-06-21', fant:'2007-03-25', fastroki:'2006-04-17',
  firen:'2009-02-02', fito:'2009-08-29', floki:'2002-12-17',
  franek:'2009-07-14', g13ras:'2005-11-20', ghonzo:'2009-10-11',
  hellfire:'2004-09-26', hijoe:'2006-01-04', hlechis:'2006-03-21',
  huty:'2005-11-17', jannisz:'2005-04-23', jarko:'2007-07-07',
  jurdy:'2003-12-29', kiro:'2005-05-08', kizers:'2008-09-19',
  kovaaksxd:'2006-01-26', kulb:'2005-11-16', kyry:'2006-04-04',
  kyto:'2008-05-29', lu984:'2005-10-11', maciak:'2008-10-23',
  marco:'2006-11-30', mikson:'2006-04-30', nebs:'2004-07-28',
  nxthan:'2005-08-09', peshka:'2008-05-17', pinq:'2004-07-18',
  pixovsky:'2008-02-06', podasai:'2005-07-29', prism:'2007-05-08',
  purchawa:'2006-04-04', rax:'2011-02-24', repairs:'2006-08-16',
  ricbor:'2006-11-29', ricky:'2006-07-30', robban:'2006-09-17',
  robin:'2009-04-18', sangild:'2006-07-17', seren:'2004-02-11',
  seyyto:'2007-06-30', shaykoz:'2004-01-02', shur4:'2006-10-12',
  shxrk:'2011-06-14', skvii:'2003-11-16', spexx:'2007-06-06',
  srapt:'2006-10-09', sxdia:'2007-04-03', tarpz:'2007-06-09',
  trexer:'2005-02-03', triix:'2008-05-26', turtle:'2006-11-04',
  twek:'2009-12-11', upl:'2008-06-27', vexi:'2007-02-13',
  wheat:'2004-11-24', wolvax:'2008-12-15', zarbeh:'2007-03-10',
  zayni:'2008-12-08',
  /* Ключ с регионом — для тех, чей ник носят двое.

     Эти трое подтверждены по стране так же, как остальные, но Fnajen и
     Moneymaker живут и в Европе, и в Северной Америке, а Zenox — в Европе и
     на Ближнем Востоке. Голым ключом их дата ушла бы обоим. */
  'EU|fnajen':'2004-10-11', 'EU|moneymaker':'2009-01-03',
  'EU|zenox':'2009-06-30'
};
/* День рождения по нику — и по региону, если он известен.

   Ключ «РЕГИОН|ник» проверяется первым, голый ник остаётся значением по
   умолчанию. Ровно тот же приём, что у PLAYER_PHOTO, и заведён он по той же
   причине: в файле 137 ников заняты двумя разными людьми, и голый ключ отдаёт
   день рождения европейца его тёзке из другого региона.

   Из-за этого три подтверждённые даты — Fnajen, Moneymaker и Zenox — лежали
   непоставленными: подтвердить их удалось, а положить было некуда. Теперь есть
   куда.

   Регион необязателен: старые вызовы, которым он неоткуда взять, работают
   как работали. */
const CC_BORN_LQ={"7ssk7":"1999-02-26","4zr":"2004-10-24","4drstorm":"2003-05-23","7tor":"2005-03-15","1lusha":"2004-07-22","7man":"2005-12-25","2sngnl":"2003-06-10","3mory":"2007-08-31","3boood":"2003-09-03","5aald":"2008-06-02","2un":"2006-01-23","1vanjkee":"2008-09-30","3peace":"2010-04-25","32wanted":"2004-04-17","6tn":"2004-03-02","acorn":"2004-06-14","EU|adn":"2003-08-13","advise":"2002-10-14","97default":"2006-10-04","adapter":"2002-08-10","abufal7":"2002-06-15","a7mdrqx":"2006-05-14","a7med":"2001-11-15","a1ms0nz":"2001-10-11","aaron":"2007-10-16","adonis":"2001-03-30","abodk":"2006-05-09","916gon":"2008-01-07","a1alex":"2005-10-08","adc":"2004-12-05","aboo6y":"1998-03-30","adity":"2003-09-16","addison":"2004-05-09","NAC|acrian":"2002-11-01","EU|acrian":"2002-11-01","adrixx":"2007-06-03","airwaks":"1994-09-01","akusto":"2003-10-31","airknn":"2000-12-18","ajay":"2002-06-20","ajerss":"2005-11-19","aim":"2003-09-21","aircool":"1997-05-14","agholor":"2001-01-10","agro":"2002-10-31","akiira":"2008-05-30","airow":"2004-07-12","aimhero_o":"1999-05-14","aimbot.exe":"2002-03-05","ais":"2003-12-26","ME|akai":"2007-01-26","agpro":"1995-08-14","w6nu":"1995-08-14","akau":"2005-09-01","NAC|afonsowkeys":"2006-11-23","alliege":"2005-04-23","alpha":"2002-07-22","alecc":"2003-07-09","OCE|alex":"2008-08-09","NAW|alex":"2008-08-09","NAC|alex":"2008-08-09","EU|alex":"2008-08-09","albedo":"2005-03-29","allen":"2005-04-19","alithy":"2004-08-18","aminished":"2005-05-26","ale":"2005-01-31","alabi":"2003-10-24","aloe":"2007-01-31","EU|alvinir":"2007-10-09","amozz":"2005-05-20","animal":"1998-05-01","aqua":"2002-07-14","andilex":"2003-01-31","anas":"2002-12-11","anon":"2006-12-15","anddone":"2003-12-24","antorak":"2002-03-12","apar":"2006-01-08","aoxy":"2007-03-04","anchor":"2006-01-05","EU|ankido":"2006-06-17","arkhram":"2003-10-12","ardit":"2006-09-14","NAC|arab":"1997-04-30","artskill":"2006-05-24","arrow":"2003-04-08","ardi":"2004-03-04","OCE|arab":"2006-05-18","armond":"2000-07-20","archie":"2000-03-04","aryan":"2006-07-01","aryanly":"2006-07-01","arion":"2005-06-26","asfit":"2005-04-26","EU|asa":"2006-03-27","art1st":"2005-07-12","arrest":"2005-06-26","EU|arc":"2003-03-19","BR|arc":"2003-03-19","artem":"2004-09-17","arisakaaa":"1998-03-02","ark":"2002-10-10","assault":"2002-02-13","astrosmz":"2002-06-11","NAC|av":"2003-01-11","avery":"2004-04-16","ayarbaffo":"2005-09-07","awaer":"2007-06-15","avivv":"2007-04-05","asianjeff":"2005-10-23","ME|asta":"2000-02-08","axeforce":"2006-05-18","astonish":"2000-09-16","astoh":"2001-11-09","axadasz":"2005-06-08","avlr":"2002-05-25","OCE|aspect":"2008-11-06","NAC|aspect":"2008-11-06","autm0":"2005-08-28","astra":"2003-08-17","asuka":"2007-02-18","athiel":"2005-08-29","astell":"2003-08-26","aurero":"2006-07-07","aurerofiez":"2006-07-07","asudifshy":"2001-10-18","auvahalo":"2006-12-01","aurum":"2003-08-02","axeddy":"2003-06-11","aydan":"2000-04-25","baltic":"1999-12-02","badsniper":"2002-09-29","baily":"2006-03-10","baza":"2006-03-10","balor":"2005-03-19","bankteller":"2003-07-14","backho":"2003-11-25","bacca":"2004-12-28","bacon":"2007-04-19","az2m":"2003-12-18","bantis":"2004-11-23","azze":"2001-06-30","bahiense":"2004-08-17","azizz":"1997-12-17","baackup":"2004-09-12","badger":"2003-12-13","aziz":"2002-12-05","baysoldier":"1993-04-03","belaeu":"1998-04-24","basil":"2004-04-25","higgs":"2007-02-23","batman bugha":"2007-02-23","banw1se19":"2005-06-02","bathan":"2004-09-08","barl":"2002-11-08","bd":"2006-07-01","banxiu":"2000-11-17","barq":"2008-07-06","takobel":"2006-06-01","battercry":"2006-08-11","battal":"2010-01-13","NAW|bateristam":"2005-06-19","batmanjoe":"2009-06-29","bear":"2008-12-26","bizzle":"1998-05-08","benjyfishy":"2004-04-02","blacky":"2003-06-30","belusi":"2005-02-23","bell":"2003-12-20","blacha":"2005-03-31","betto":"2004-07-20","NAC|bfo":"2003-02-10","bhronos":"2002-03-29","birchh":"2001-09-19","bioo":"2009-09-14","bizzyxivi":"2002-11-06","birk":"2009-05-06","NAW|blind":"1996-04-03","blax":"2001-09-13","bobo":"2001-01-26","blastr":"2002-12-15","bleed":"2006-05-14","ASIA|bob":"2004-10-08","bloomy":"1998-08-03","boltz":"2007-03-20","boaz":"2006-07-21","blootea":"1995-09-22","blizy":"2003-11-19","bluzro":"2004-04-26","bola":"2003-01-29","blzerd":"2009-10-23","blyss":"1999-05-02","blazified":"2002-07-21","boyer":"1999-02-23","browner":"2005-01-21","bqrbie":"2006-07-16","braydz":"2007-03-12","brd":"2007-02-02","regularbrd":"2007-02-02","broken igl":"2006-06-26","bravo":"2005-02-10","ME|broken":"2001-09-01","br1ckzl":"2004-08-08","bowcros":"2007-05-14","braden":"2008-01-16","NAC|broken":"2008-06-05","branchies":"2000-08-30","borsuk":"2011-08-12","bucke":"2003-06-23","bugha":"2002-12-30","bubak":"2005-09-14","cadu":"2005-07-04","bylah":"2003-09-26","buyuriru":"2006-02-11","cafe":"2005-01-21","brycx":"2004-09-30","brush":"1998-03-13","bully":"2003-01-06","byzic":"2003-03-04","bucktee":"2001-04-16","buzz":"2002-01-25","cadrent":"2005-06-04","bryanvyy":"2005-12-26","ryle":"2007-02-19","bullyslayrr":"2007-10-31","caio":"2008-02-17","NAW|bryan":"2004-04-18","BR|bryan":"2004-04-18","cuh":"2004-04-18","buzzo":"2003-04-27","burga":"2008-11-06","ceice":"2000-09-20","castery":"2003-07-25","caryion":"2003-09-27","cazz":"2003-08-17","cam":"2007-07-16","NAW|caleb":"2005-04-07","OCE|caleb":"2005-04-07","cazi":"2005-11-09","casqer":"2003-03-26","cat":"2005-11-12","caspersa":"2001-05-23","EU|casperinovic":"2006-12-05","cauee":"2008-06-26","carlin":"2007-05-01","cazorla":"1997-02-13","captainy":"2005-06-15","harsh":"2001-10-09","cauzerz":"2009-09-28","cazo":"2007-05-13","catman":"2008-01-04","NAC|chap":"1994-10-21","cented":"2001-11-10","chapix":"2004-06-04","charyy":"2007-11-11","cheatiin":"2004-10-22","cheetiin":"2004-10-22","chickenitza":"2003-09-18","chaotic":"2003-06-26","chicken":"2003-11-20","cerbs":"2005-06-02","ceneto":"2005-01-26","ceres":"2001-06-26","EU|chap":"2009-03-25","channce":"2008-03-07","cheapz":"2002-03-18","chashy":"2004-11-26","chele":"2010-01-12","chicha":"2004-08-24","BR|chap":"2006-02-15","centro":"2010-10-27","clarityg":"2000-11-19","chimp":"2007-08-30","chocoluv":"2003-09-09","NAC|chris":"2004-01-16","NAW|chris":"2004-01-16","OCE|chris":"2004-01-16","chukky":"2006-06-09","claven":"2004-11-30","clapsy":"2008-04-07","claw":"2002-08-12","cillic":"2004-04-10","chiffon":"2004-04-24","circ":"2007-04-04","cinxz":"2005-06-07","chipi":"2000-07-10","chip":"2003-07-27","clix":"2005-01-07","commandment":"2005-01-17","clement":"2003-02-17","NAC|cold":"2007-05-23","NAW|cold":"2007-05-23","clemens":"2004-10-16","cobolt":"2005-09-03","codgenesis":"2005-03-09","cloud":"2003-01-30","connor":"2006-12-23","connoreo":"1999-08-15","coach chad":"2005-03-07","clouted":"2004-02-06","clips":"2005-07-14","cliqahh":"2001-12-09","clone":"2006-04-17","closr":"2003-03-14","clyfen":"1999-11-18","compalomp":"2005-03-02","colheart7":"1998-11-05","cleevlund":"2002-10-02","compton":"2009-10-05","coldy":"2007-09-11","crimz":"2003-01-24","coop":"2003-06-09","coope":"2006-02-01","cooper":"2003-11-29","NAW|criizux":"2005-06-08","cookie":"2004-01-15","controller":"2007-11-28","convic":"2006-12-02","creepwtf":"2005-04-05","cosmo":"2003-12-18","contest":"2002-12-15","corni":"2004-06-15","cringe":"2007-06-18","cr1nge":"2009-01-12","coolkid":"2004-10-23","cotal":"1994-07-05","crank":"2010-07-25","criz":"1993-05-05","crr":"2000-03-13","crow vii":"2006-04-21","crusti":"2005-03-07","crunchy":"2004-08-17","crumble":"2004-02-17","cryp":"2001-07-01","cvrby":"2005-01-18","curney":"1993-09-30","cynical":"2004-08-08","crypty":"2005-09-26","cursive":"2002-12-02","curve":"2010-12-23","NAC|curly":"2008-06-19","EU|curly":"2008-06-19","BR|curly":"2008-06-19","cxshy":"2007-10-16","cyfare":"2003-08-02","crmzn":"2006-11-23","crps":"2007-01-23","cyclops":"2007-12-24","cylow":"2008-05-09","cwintrr":"2005-02-24","cyriz":"2007-01-24","danath":"2003-09-15","darkiizz":"2006-04-18","daan":"2003-02-20","darker":"2002-04-14","czr":"2004-10-03","dabuel":"2003-07-15","dandir":"2004-04-03","darkxz":"2008-05-21","daddy":"2006-03-03","dandepuzo":"2007-08-14","danielbieje":"1999-12-09","dade":"2002-07-06","darkorino":"2003-08-05","dangoms":"2002-08-23","darkos":"2008-01-22","deadra":"2001-05-11","degen":"2002-06-12","decyptos":"2003-10-26","defiable":"2005-04-13","daxor":"2002-12-14","dbree":"1999-09-16","daruma":"1998-10-31","deez":"1999-05-04","deckzee":"2006-05-22","dashh":"2007-06-28","darm":"2008-12-04","darts":"2007-05-14","dcawesomer":"2006-11-03","death":"2009-01-01","decay":"2009-04-12","daxthon":"2005-07-14","NAC|darky":"2008-07-11","devious":"2000-10-06","diggy":"1998-04-25","diegogb":"1999-10-06","deniiss":"2001-01-08","deqzyy":"2006-04-15","deyy":"2007-01-06","deroller":"2006-04-30","derox":"2004-07-05","diegoplayz":"2007-07-15","desway":"2006-04-12","diablo":"2005-10-30","dela":"2005-03-13","dictating":"2004-05-25","dequented":"2006-02-05","deymo":"2007-04-11","demon x":"2007-07-29","didzzz":"2004-12-23","deside16":"2003-05-16","demus":"2008-10-01","dexteriity":"2003-03-25","deyydodger":"2004-10-17","dementia":"2004-01-06","ME|demon":"2004-06-14","domentos":"2000-07-14","dks":"2007-11-09","diguera":"2005-07-15","dokn":"2004-11-11","NAC|doniee":"2005-11-16","NAW|dom":"2004-01-02","NAC|dom":"2005-10-13","dog":"2002-12-23","ditrxx":"2001-01-10","diocese":"2004-09-27","divine":"2005-03-21","dmur":"2004-08-16","domo":"2002-08-07","dio":"2003-05-21","district":"2003-12-30","dolzeur":"2007-06-27","digital":"2003-02-04","dolla":"2005-07-07","dinus":"2009-08-06","dngy":"2004-01-28","donkslul":"2005-07-14","dna":"2006-04-02","donguri":"2009-05-06","dubs":"2002-11-21","drg":"2003-08-04","drakonz":"1997-05-02","dragonrg":"2004-03-23","downs2k":"2005-02-01","dopi":"2002-10-03","doomy":"2007-08-28","NAC|doxy":"2004-11-01","doolesworth":"1999-08-14","dpchew":"2002-06-13","ME|doom":"2001-12-02","dorito":"2007-05-24","drizzlx":"2007-10-24","drpahks":"2005-02-11","drew":"2010-03-11","duhvera":"2000-04-17","doxey":"2010-12-25","edgey":"2003-02-14","dylan":"2001-01-25","NAC|dukez":"2005-08-12","EU|dyox":"2005-12-05","BR|dyox":"2005-12-05","edison":"2004-06-30","eclipse":"2007-04-16","edroadtoglory":"2005-02-10","edson":"2007-03-05","eclipsae":"2003-05-15","dyrvig":"2003-03-04","edan":"2006-02-22","durr":"2006-09-29","dylxn":"2007-08-11","NAW|echo":"2007-08-10","dylangodoy9":"2005-10-13","enigma":"1999-12-29","endretta":"2005-06-06","emxxrr":"2002-05-07","elokratz":"1996-02-14","eomzo":"2006-09-21","egrm":"2002-03-28","NAC|elevate":"2002-01-08","envy":"2001-12-20","elitxe":"2004-03-02","ensar":"2006-04-25","eggroll":"2005-03-22","enzinho":"2006-06-13","enquz":"2005-02-21","emqu":"2003-09-02","ekko":"2005-10-11","encrypted":"2005-07-07","ender":"2005-04-11","emeraldgl":"2009-01-20","NAC|enough":"2010-12-01","electro":"2007-08-22","epikwhale":"2002-08-03","eshz":"2005-04-10","ess":"2006-09-09","escdark":"2006-12-16","esty":"2003-01-10","etq":"2004-08-03","exuhz":"1999-07-02","exe":"2004-12-27","exoph":"1999-03-14","extinct":"2004-04-04","evasion":"2005-02-19","euzey":"2004-01-31","eraser":"1997-03-27","erima":"2002-12-18","eshouu":"2008-10-06","evolved":"2008-07-15","extaticbt":"2000-09-17","eulogy":"2006-11-14","falconer":"1999-03-24","falconly":"2003-03-04","favs":"2003-06-25","fatch":"2003-09-18","fastroki":"2006-04-17","fa1zzy":"2002-03-04","faxfox":"2001-09-14","ME|fares":"2003-06-26","faki":"2004-10-22","fab":"2004-02-13","ezzi":"2003-03-07","falex":"2004-07-23","fatim":"2004-06-23","fant":"2007-03-25","f1shyx":"2008-07-20","f1n4ik":"2009-08-18","BR|fabin":"2004-06-01","faded":"2006-06-21","ezezinn":"2003-03-27","faca":"2005-07-15","faris":"2004-01-30","fiber":"2000-03-13","filipe":"2004-02-03","fhd":"2005-10-15","fir3hunter":"2005-08-10","fire228":"2005-08-10","OCE|fisher":"2003-10-13","ASIA|fire":"2004-07-07","fazer":"2004-06-16","ferrrnando":"2002-03-15","feezle":"1999-09-27","ferticz":"2003-05-26","filipmonk":"2007-02-05","firen":"2009-02-02","fenix":"2005-01-12","fenjamie":"2004-01-27","feared":"2005-07-27","fiscoo":"2004-05-07","finnex":"2003-02-27","felixgen":"2004-07-29","fex":"2002-01-19","felpsz":"2010-10-31","flowis":"2005-12-01","flikk":"2003-07-04","floriixn":"2001-12-19","floki":"2002-12-17","flecken":"2005-08-24","flickzy":"2006-05-09","fks":"2006-05-17","fledermoys":"2001-05-29","fleder":"2004-07-27","flodax":"2005-02-04","fishy":"2004-07-31","NAW|fjaa":"2005-07-06","flenny":"2006-12-23","flexah":"2002-10-12","flobby":"2008-04-05","flk":"2002-01-15","flamors":"2003-11-09","fito":"2009-08-29","freemok":"2003-03-25","frapai":"2003-06-05","EU|force":"2005-12-26","ASIA|force":"2005-12-26","fray":"2001-06-15","fram":"2005-07-07","fortik":"2001-11-30","fnajen":"2004-10-11","fredoxie":"2004-10-12","fork":"2003-12-10","flyy":"2004-02-28","EU|focus":"2009-04-09","OCE|focus":"2009-04-09","ME|focus":"2009-04-09","fraanticc":"2006-12-18","forzen":"2009-04-19","NAW|freeze":"2005-03-30","NAC|freeze":"2005-03-30","folnet":"2005-02-06","franek":"2009-07-14","former":"2002-01-22","france":"2004-04-16","foczka":"2008-02-25","funk":"1995-08-12","funkbomb":"1995-08-12","frosty":"2005-04-12","EU|fwexy":"2003-01-02","furious":"2004-03-11","fryst":"2005-06-01","fury legendary":"2005-04-08","fuzzy":"1998-08-08","fulltrolling":"2005-04-03","fresht":"2000-11-28","g13ras":"2005-11-20","frost":"2003-06-23","g0ldx2":"2006-04-06","frenzyfishy":"2006-08-31","fuzettin":"2006-12-19","furium":"2006-10-13","ASIA|frenzy":"2006-02-07","fzn":"2007-09-02","fuzeac":"2000-04-18","fuzz":"2009-01-24","frostty":"2007-06-25","froggy":"2005-03-22","ft":"2006-09-23","fw":"2004-07-21","freuzi":"2007-05-27","gheez":"2004-05-08","EU|gabix":"2007-03-23","gabzera":"2005-04-10","geanzha":"2003-10-04","gazer":"2005-04-19","gawid":"2004-05-21","gary":"2007-01-28","ggeez":"2004-10-23","EU|ghost":"2010-07-05","gancheto":"2002-02-08","ghonzo":"2009-10-11","gabx":"2010-05-12","gooboz":"2003-06-24","gntl":"2002-09-24","NAC|glace":"2004-07-30","goku":"2005-12-07","goosh":"2004-05-12","goatt":"2002-11-21","gmoney":"2008-06-20","goromaru":"2004-08-07","NAC|golden":"2003-02-23","NAW|golden":"2003-02-23","goofy":"2008-12-19","goki":"2008-01-15","gosh":"2005-01-10","grolzz":"2004-05-27","gudn":"2004-10-03","gxt":"2004-09-30","grayinjo":"2004-06-01","grazca":"2003-02-10","grandmateets":"1997-08-26","NAC|h4nssen":"1998-07-26","griff":"2005-05-10","grav":"2004-09-03","BR|grx":"2007-10-16","h1ghsky1":"2007-04-01","h.man":"2002-03-04","gustyx":"2004-10-13","guygoose":"2003-01-20","guccibrow":"2005-07-29","h2nt":"2004-11-03","gutinho":"2007-09-03","hayato":"2010-02-18","harmful":"2001-02-21","harukiyo":"2004-10-13","hamuppi":"2003-07-29","halfdumb":"2003-06-13","happed":"2003-12-24","haanzer":"1999-07-24","NAW|hajuu":"2006-10-23","haman":"2006-01-08","EU|hen":"2005-07-03","hellfire":"2004-09-26","ME|hero":"2004-04-03","hellonsteam":"2006-03-02","hellon":"2006-03-02","hijoe":"2006-01-04","hazthagreat":"2002-01-01","NAC|heart":"1998-06-22","hedra":"2007-04-19","highr":"2006-06-24","hbn":"2001-09-27","herk":"2007-07-08","hezzaar":"2008-03-12","he-stin":"2011-04-04","hayden830":"2005-08-30","hogman":"1995-08-16","EU|hunter":"1999-11-07","histtory":"2001-08-16","hottie":"2006-01-17","huty":"2005-11-17","hood.j":"2004-11-26","hornet":"1996-09-29","howly":"2007-06-21","hoon":"2001-04-07","hlechis":"2006-03-21","ASIA|hiro":"2002-05-22","hizixx":"2004-11-16","hris":"2009-02-05","humbugha":"2009-02-23","horaace":"2002-11-18","hop":"2008-01-26","hurtyn":"2005-12-21","hysteria":"1992-02-24","idrop":"2004-10-27","ibooohai":"2002-07-10","icy":"2002-06-10","coolpenguin48":"2002-06-10","EU|hycr1s":"2003-02-20","igo":"2001-06-17","NAW|hyper":"2006-06-27","hyrax":"2006-04-21","EU|hype":"2005-03-28","OCE|hype":"2005-03-28","hynei":"2005-02-07","igna":"2003-09-25","icetzy":"2004-04-30","ifly":"2004-06-28","hxvac":"2009-04-11","ifr0zi":"2006-02-08","hwxrren":"2005-02-15","EU|icee":"2008-03-17","ib":"2009-07-17","icyfai":"2010-09-16","irezumi":"2004-01-05","illest":"2004-09-16","inspyre":"2001-04-25","itrol":"2007-12-01","irewq":"2002-07-20","OCE|insight":"2006-12-26","inxnct":"2008-06-11","itshi":"2008-03-29","inact":"2007-01-28","itay":"2008-05-26","imsdalo":"2000-07-23","jamside":"2001-06-20","jannisz":"2005-04-23","jahq":"2004-03-18","jace":"2004-04-12","jamper":"2004-09-02","japko":"2006-09-16","jaemon":"2005-11-20","jakei":"2001-10-17","jaggy":"2004-06-03","j4chu":"2000-10-20","izo":"2006-07-19","janik":"2003-04-16","jadenshotz":"2005-08-21","jae":"2007-06-23","jakebuca":"2009-05-05","javix":"2004-06-01","jabr":"2005-06-14","jai":"2007-10-09","jairo":"2006-06-12","jafet":"2004-09-24","jango":"2002-07-06","izzi":"2009-12-04","jagareet":"2009-05-08","jayrosez":"2004-07-24","jay":"2005-09-15","jarkos":"2002-03-19","jayth":"1999-11-08","jenks":"2002-06-06","jarvis":"2001-11-11","jaspaay":"2003-05-03","hazzense":"2008-04-20","jarko":"2007-07-07","jargue":"2008-10-25","jawad":"2000-01-19","jaqck":"2008-08-25","jayagu":"2007-01-31","jarritos":"2004-09-27","jeffers":"2005-05-05","jayse1x":"2010-03-15","jesse":"2000-05-28","joefn":"2004-11-23","joji":"2006-03-05","jimke":"2003-01-22","jkreet":"2007-02-25","joe":"2007-08-03","joey":"2004-10-05","jivi":"2003-11-22","jay j":"2007-12-21","jokzz":"2005-07-20","job":"2008-03-12","jiren":"2003-04-09","johku":"2005-07-19","jeulzz":"2010-06-30","OCE|jordan":"2000-05-28","justice":"2005-09-23","jur3ky":"2004-11-22","juliancom":"2005-03-05","joseeh":"2006-06-27","juu":"2006-07-22","clxxer":"2006-10-06","jozya":"2002-06-28","jurdy":"2003-12-29","joshh":"2001-10-07","jupiter":"2004-11-09","jonny":"2001-12-15","josh":"2008-12-30","joshreyli":"2008-12-30","jpfk1ng":"2011-10-31","kamo":"1999-09-17","kami":"2005-01-28","jynx":"2001-08-23","k1nzell":"2002-05-12","kai":"2003-09-22","k1ng":"2006-04-21","kaande":"2005-12-15","kakarot":"2001-03-03","kaboo":"2005-07-26","kana":"2007-04-25","kaidon":"2007-01-06","jxsn":"2001-09-20","jxness":"2009-05-22","jxao":"2006-04-07","kaduzinrr":"2009-01-27","kabuto":"2005-07-14","juxe":"2005-08-02","juzry":"2001-04-19","kalco":"2009-11-24","kalvinn":"2004-03-16","kametin":"2010-06-19","kaliper":"2007-01-18","juvzy":"2007-11-12","kaf":"2009-02-03","kayuun":"1998-07-07","kaxie":"2004-06-12","EU|karma":"2005-03-25","OCE|karma":"2005-03-25","EU|karmy":"2004-07-13","kbr":"2003-05-18","karhu":"2004-06-12","kayky":"2005-11-25","kaykygames":"2005-11-25","kchorro":"2006-01-12","keemo":"2007-06-24","katoo":"2000-01-29","kebo":"2003-07-31","daydus":"2007-10-29","kayez":"2000-03-31","kappa":"2001-08-05","kantri":"2007-04-11","karn":"2003-11-03","karmaa":"2008-01-09","kasz":"2011-08-09","kauazinwyy":"2011-12-12","kenshi":"2003-12-03","khanada":"2004-10-15","kefyy":"2007-04-04","kentach":"2006-02-21","keolys":"2002-02-23","keziix":"2005-07-11","kewl":"2005-11-22","NAC|keys":"2000-08-09","keicox":"2005-07-04","kickz":"2005-05-15","kiandr0":"2004-07-31","keith":"1997-11-10","keqzu":"2003-07-22","kenty":"2004-11-11","kezzaa":"2003-11-27","keyaan":"2006-05-03","kehnys":"2003-09-19","keenbot":"2009-04-14","kell":"2001-08-13","kelfy":"2002-10-29","kinstaar":"2000-02-17","kiryache32":"2005-01-29","kitoz":"2006-05-10","kikoo":"2006-09-21","kiritokun":"2002-06-24","kiro":"2005-05-08","kiduoo":"2005-10-13","kirb1":"2006-03-24","BR|king":"2004-12-30","ME|king":"2004-12-30","kiujy":"2004-05-27","kiox":"2003-06-29","kika":"2002-11-22","teitei":"2007-08-08","kimkana":"2007-08-08","kingaling":"2008-02-06","kilua":"2002-11-08","kielba":"2008-09-13","kinqver":"2002-02-01","killerbxy":"2004-09-23","killerboy":"2004-09-23","kimmy":"2001-04-16","kimchi":"2005-03-09","kix":"1997-04-12","kizers":"2008-09-19","kirillian":"2008-02-22","knight":"2000-02-23","korol1k":"2006-07-24","klass":"2002-07-09","EU|klown":"2002-12-07","kombek":"2006-08-17","NAC|kolorful":"2004-02-13","knzo":"2006-04-18","klinberi":"2003-07-27","kogane":"2003-10-16","kn1pher":"2003-04-14","kooptrain":"1998-11-17","kodex":"2006-09-15","kodi":"1998-12-22","klopz":"2001-03-26","koa":"2004-08-21","kjs":"2005-09-23","klixey":"2008-09-30","kojo":"2010-05-12","kubx":"2003-07-08","kruyor":"2006-09-03","krizzii":"2007-03-11","koyota":"2007-12-11","kovaaksxd":"2006-01-26","krisp":"2002-12-17","krejz":"2004-04-27","EU|kris":"2002-11-21","kquid":"2006-03-25","kuda":"2004-10-11","kryfalse":"2005-07-21","kovolski":"2003-11-12","kramsu":"2008-07-22","krreon":"2007-11-21","kraez":"2008-07-14","kpzet":"1998-11-05","kube":"2004-01-12","kyzen":"2002-07-05","EU|l1nk":"2004-09-05","EU|kylie":"2001-05-23","NAC|kylie":"2001-05-23","kyzui":"2002-10-17","kwanti":"2004-05-20","kurtz":"2004-11-12","kuren":"2005-09-04","ME|kuki":"2006-04-18","kwah":"2004-07-21","kytrex":"2000-07-14","kxunai":"2005-11-20","kylix":"2001-07-24","kyry":"2006-04-04","kyrha":"2003-09-04","kurama":"2007-08-03","kwolit":"2005-08-02","kurara":"1998-06-28","kurukuru":"2001-11-08","kyto":"2008-05-29","kygo":"1999-12-26","kulb":"2005-11-16","kxvin1x":"2006-10-01","kumo":"2011-02-01","lasers":"2001-07-06","larson":"2005-10-30","lawrence":"2005-11-19","NAC|lazarp":"2003-12-08","lareez":"2002-08-14","lanson":"2003-04-04","lapex":"2002-03-06","lame":"2001-03-20","lardl":"2005-10-08","lazy":"2006-10-12","layn":"2007-03-07","latte":"2007-12-14","lbworks":"2009-06-17","laxus":"2005-01-17","lacat0r":"2002-09-14","lacator":"2002-09-14","larccoz":"2008-07-23","lauta":"2001-10-15","leech":"2005-07-14","letw1k3":"2005-04-08","leleo":"2002-05-28","lettuce":"2002-10-31","leyyner":"2005-01-23","legedien":"1999-04-02","leobas":"2001-07-28","leojayt":"2000-05-06","leo2004":"2004-01-18","lewa":"2005-09-05","letz":"2008-08-31","EU|leonflares":"2004-01-14","lequy":"2005-09-26","lezix":"2004-11-24","legend":"2003-06-04","lgndrybanana":"2007-05-24","ASIA|leo":"2010-11-29","leonzhett":"1997-07-24","lnuef":"2002-07-15","liwshe":"2007-03-14","lime":"2005-01-04","limev2":"2005-01-04","lodstk":"2006-11-06","litzinio":"2002-09-03","NAW|little":"2003-12-30","BR|little":"2003-12-30","local":"2007-03-08","loadist":"2002-09-25","loco":"2003-03-02","lily":"2010-03-14","lofi":"2005-03-09","ME|loki":"2004-12-20","liamtfup":"2008-11-13","lixium":"2006-07-13","llobeti4":"1999-11-05","EU|loki":"2004-12-20","linjy":"2004-11-20","listen":"2008-06-01","EU|luki":"2003-08-31","BR|luki":"2003-08-31","louis":"2004-07-02","looter":"2004-08-26","lolb0om":"2001-05-29","luluzito":"2003-06-16","lotiix":"2006-05-09","lowless":"2005-03-14","lozer":"2004-08-22","lordnm":"2003-02-04","loxxx":"2006-10-01","lu984":"2005-10-11","lucci":"2006-04-19","lucx":"2010-11-06","lollicker":"2005-02-17","losted":"1998-07-15","lucks":"2003-10-29","lucas":"2003-10-21","loqqty":"2005-07-25","NAW|lucid":"2005-04-28","ME|lord":"2002-04-30","mackwood":"2002-03-04","m11z":"1996-11-25","lyght":"2005-10-31","macheew":"2006-03-19","lyricen":"2001-11-08","luneze":"1998-08-02","macyfishy":"2002-11-19","lxdesman":"2003-04-14","mace":"2006-10-24","m0untain":"2004-12-17","lyejax":"1998-03-31","OCE|lunr":"2004-06-20","lupien":"1998-02-09","m0ne":"2009-03-14","maciak":"2008-10-23","lush":"2004-01-26","maa-san":"2009-02-09","m2bk":"2002-08-10","magnus":"2004-02-25","magl":"2000-11-04","mansour":"2004-12-05","malibuca":"2005-10-14","maestro":"2004-01-09","mania":"2003-04-19","maesar":"2005-09-27","NAC|magnolia":"2005-10-05","mainly":"2006-01-11","mana":"2007-04-25","magyk":"2005-04-13","mage":"2005-10-04","mannii14":"2010-04-01","mald1s":"2007-04-18","magma":"2007-06-07","martoz":"1997-12-12","matsoe":"2002-02-11","marteen":"2004-10-21","marco":"2006-11-30","mason":"2007-10-12","mariuscow":"2006-11-14","marz":"2004-06-04","mashiron":"2005-03-15","OCE|mase":"2010-03-02","mariolo":"2005-04-03","mateoz":"2001-10-15","marinn":"2007-03-18","megga":"2004-10-15","mawakha":"2001-08-22","mechton":"2005-11-12","maufin":"2003-11-03","medusa":"2001-01-25","maw":"2005-07-29","meip":"2007-08-10","megadan":"2005-07-27","meah":"2008-06-20","melody":"2003-04-18","mayo":"1998-01-23","maxyzxz":"2005-04-15","maxo":"2004-06-22","mayhem":"1997-06-22","EU|maxiking":"2006-06-22","maximoe":"2004-05-05","mck":"2004-10-21","meltze":"2002-06-02","mejxck":"2001-12-24","maximus":"2003-02-10","meakin":"2002-06-27","mexe":"2002-08-24","mero":"2004-09-18","merijn":"2004-06-19","merstach":"2007-03-27","EU|michael":"2005-05-06","mikson":"2006-04-30","merem":"2008-02-20","middi":"2005-07-08","michael.":"2007-09-26","mesportt":"2007-01-30","miknup":"2004-07-27","mikey":"2000-08-09","mev":"2001-06-25","milito":"2003-08-30","mikan":"2008-08-12","ME|milo":"2006-11-23","milaniwnl":"2002-12-26","metotya":"2009-05-04","minas":"2004-07-01","mitr0":"2002-06-06","minzho":"2004-09-13","mlody":"2004-07-02","xmipoli":"2004-09-02","minipiyo":"2007-11-12","miro":"2002-09-28","minny":"2005-05-14","ASIA|minty":"2001-02-19","EU|misha":"2008-03-02","ME|misha":"2008-03-02","miyu":"2005-04-14","minit":"2009-05-14","minnn":"2000-08-20","mk":"2003-10-12","minori":"2011-03-01","zagouの弟":"2008-01-05","mongraal":"2004-08-13","morgausse":"1999-07-13","motor":"1998-05-22","monster":"2006-02-04","moneymaker":"2009-01-03","mojo":"2006-02-09","mooseggs":"2008-02-12","moo":"2003-11-23","mony":"2003-07-07","mojak":"2005-06-17","ME|moon":"2002-02-19","momsy":"2007-03-29","moter":"2003-10-24","NAC|monty":"2007-04-25","mofu":"2011-11-03","mrfreshasian":"2002-03-04","mrsavage":"2004-11-12","muz":"2005-04-14","mshary":"2009-01-04","ME|msg":"2005-01-29","EU|mr.j":"2003-09-27","moxie":"2004-08-11","mv":"2005-01-31","mrdom":"1999-10-07","munk":"2006-05-08","mxsty":"2011-12-23","mtb":"2004-12-11","mxfia":"2009-06-20","naekoz":"2004-02-21","nanolite":"2002-03-23","nani":"2003-04-24","nachiiri":"2005-01-14","naetor":"2005-03-30","nach":"2004-01-28","nakoo":"2004-03-13","nahue":"2003-08-16","NAC|naevz":"2006-03-13","mygoute":"2002-02-23","n0va":"2007-01-13","n7r":"2008-12-08","nagipipi":"2007-03-09","nalu":"2009-03-19","n3wghoost":"2005-09-25","naifma7":"2007-11-17","mythic":"2005-09-30","mystxtz":"2006-10-03","nahuxwq":"2009-06-10","EU|nayte":"2002-09-09","nebs":"2004-07-28","neeqo":"2004-03-10","nefrizi":"2004-11-08","netlov":"2005-10-22","narwhal":"2005-08-16","nathes":"2006-07-12","nayker":"2005-02-16","EU|nate":"2005-02-15","NAW|nate":"2005-02-15","NAC|nate":"2005-02-15","neon":"2004-12-03","natee":"2004-08-25","natanyo":"2005-02-03","nephrite":"1995-05-28","neken":"2004-03-17","nemutaiyo":"2000-07-27","nekko":"2006-03-21","nemz":"2002-04-23","naranj1t0":"2000-08-17","natmozs":"2007-06-30","nef":"2001-04-24","nikof":"2000-02-04","nicks":"2005-07-12","niasen":"2002-11-09","njby":"2005-01-12","nexy":"2005-02-25","nipsy":"2003-04-07","newbatoon":"2006-04-11","night":"2005-05-06","nightsck":"2003-08-09","nikkeva":"2002-12-13","nigetinn":"2004-11-14","ningdo":"2002-08-14","nezar":"1999-09-14","niivzy":"2004-12-22","nexxs":"2004-09-23","neyx":"2005-03-02","noward":"1996-02-19","noahreyli":"2005-06-30","NAC|nosh":"2004-04-28","nov1ce":"2006-07-10","nm7":"2002-03-09","noizy":"2005-07-02","notpandda":"2002-12-25","noahwplays":"2004-03-24","nolbertoez":"2003-09-13","NAC|noxy":"2008-01-08","nomfu":"2003-08-15","nomzz":"2009-02-02","noa":"2005-06-03","notebook":"2002-05-22","nothing":"1997-12-17","noia":"2008-03-23","nociff":"2007-05-04","noel":"2010-07-28","nyhrox":"2002-09-08","oatley":"2005-12-16","ME|nyle":"2005-12-23","okis":"2003-08-04","nyx":"2005-12-31","nutifps":"2006-04-27","nqru":"2007-01-27","nuggison":"1997-09-15","oethrieum":"2001-10-10","oasis":"1996-06-22","nunker":"2004-11-24","nxthan":"2005-08-09","nvtylerh":"2009-07-16","nurface":"2004-11-18","nxtures":"2007-05-30","nozzey":"2005-08-29","nyndee":"2004-11-30","nut":"2011-02-22","opai":"2001-11-09","oreo":"2005-03-14","oliverog":"2001-11-04","on1":"2007-04-30","overstun":"2003-10-20","ops":"1999-06-06","OCE|osiris":"2002-04-06","osydd":"2007-06-03","omaar":"2006-12-15","optimal":"2005-04-20","orb":"2004-01-22","olui":"1997-09-11","pablowingu":"2007-10-05","pamstou":"2005-11-23","p5ek":"2004-05-20","panka":"2004-03-15","paper":"2002-12-27","packo":"2005-07-21","p0ul":"2007-06-25","EU|p1ng":"2004-08-25","ASIA|p1ng":"2004-08-25","NAC|owl":"2002-02-28","palermo":"2000-12-24","ozirvo":"2004-02-02","paivers":"2001-08-27","pandush":"2003-02-11","panzer":"2006-01-25","papi blast":"2004-11-21","pardal":"2009-09-08","ozone":"2007-05-22","paddy":"2003-11-17","pans":"2004-07-13","parca":"2005-07-04","owen":"2006-04-13","paceve":"2002-11-11","parpy":"2001-03-16","passivq":"2004-11-04","persa":"2001-02-10","pepoclip":"2006-05-28","pepo":"2006-05-28","payna":"2005-03-21","peach":"2002-12-28","past":"2005-12-22","pdplague":"2004-09-01","EU|pepper":"2001-02-21","NAW|pepper":"2005-04-01","peak":"1996-11-21","parkyn":"2005-04-30","pega":"2006-02-22","paulinyache32":"2005-07-18","parur":"2002-03-06","penta":"2006-07-04","partygirl":"2007-03-16","penguwingu":"2005-10-25","pedrin":"2008-09-16","pinq":"2004-07-18","ME|phantom":"2006-12-01","phzin":"2007-03-10","phyenix":"2005-11-07","peterbot":"2007-06-20","peterpan":"2002-05-13","pgod":"2000-09-05","pingu":"2005-11-28","BR|pina":"2003-07-14","ASIA|pina":"2003-07-14","OCE|phluxzy":"2004-03-13","pickiss":"2001-04-22","pigle":"2006-06-08","peshka":"2008-05-17","frostipeshka":"2008-05-17","phoenix":"2009-06-27","ME|pika":"2008-08-24","NAW|pika":"2008-08-24","NAC|pika":"2008-08-24","physicss":"2006-08-12","OCE|phantom":"2008-07-05","podasai":"2005-07-29","plege":"2005-05-08","pkr29":"2005-09-13","playify":"2003-06-01","polly":"2007-11-11","pollyy":"2007-11-11","pnkayy":"2004-04-26","pixie":"2007-08-10","pircolino":"2000-02-17","posick":"2000-10-25","pnr":"2004-03-09","NAC|pollo":"2008-05-08","NAW|pollo":"2008-05-08","pixovsky":"2008-02-06","plpe dj":"2002-05-13","pizza4k":"2006-02-28","pixx":"2008-04-19","poppin":"2004-02-13","pony":"2008-01-22","pluey":"2006-08-10","psalm":"1995-02-06","pr0vokd":"2002-10-12","prisi0n3r0":"2000-07-11","prhzy":"2004-12-06","predator":"2002-08-27","prien":"1998-11-19","EU|predage":"2003-10-01","prbk":"2006-11-25","prism":"2007-05-08","propz":"2005-02-20","pruzen":"2006-01-09","prodigy":"2003-07-11","psy":"2003-05-30","praidyy":"2006-10-24","prollo":"2004-08-01","prax":"2007-07-05","punisher":"1995-08-12","putrick":"2004-10-12","qjac":"2004-08-08","pumpkin":"2004-03-19","puma":"2007-12-30","pulga":"1998-06-25","qndx":"2004-06-17","pxlarized":"2004-03-25","qb":"2005-11-13","NAW|pxmp":"2005-02-07","NAC|pxmp":"2005-02-07","purchawa":"2006-04-04","EU|qroll":"2003-10-18","punga":"2005-02-04","qhvst":"2009-10-29","puzera":"2005-04-13","purd1ales":"2002-03-15","quala":"2000-01-17","purav":"2005-03-25","quadra":"2002-04-01","purebx":"2006-02-25","pumpz":"2007-08-04","qasruh":"2006-10-22","qkay":"2010-07-13","radius":"2003-06-29","raifla":"2006-05-17","queasy":"2002-04-17","qvado":"2004-08-30","rakso":"2004-01-04","raizen":"2005-05-26","ASIA|rainy":"2006-07-08","ragis":"2006-10-07","rabid":"2001-07-20","OCE|raiku":"2005-11-28","rabbit":"2007-07-14","ragna":"2001-08-22","raito":"2009-05-17","rakirye":"2009-02-16","rad3on":"2005-10-04","OCE|rainy":"2008-08-04","rai":"2010-06-10","ral":"2008-04-25","rain":"2010-12-09","rafast":"2009-09-11","ME|rapit":"2003-01-06","raru":"2007-01-12","randu":"2003-08-02","EU|raze":"2003-05-31","NAC|rapid":"2007-01-11","NAW|rapid":"2009-07-15","razl":"2007-08-13","ratatouille":"2005-03-02","raxi":"2006-02-16","rawden":"2006-10-17","raygun":"2007-05-08","ratgun":"2007-05-08","rax":"2011-02-24","ASIA|reaper":"2009-07-10","EU|reaper":"2009-07-10","rayy":"1999-06-04","ME|reaper":"2007-03-01","OCE|raxy":"2008-04-21","rehx":"2004-12-30","refsgaard":"2005-01-20","reet":"2006-05-16","EU|redrush":"2003-11-25","reducs":"2004-07-21","rekins":"2000-05-14","rejek":"2003-06-13","repairs":"2006-08-16","ren":"2005-10-24","regan":"2005-09-30","reptix":"2003-03-22","reo":"2010-01-21","remsy":"2005-04-05","rek":"2006-10-11","rezon ay":"2006-07-05","reverse2k":"2000-11-21","rhux":"1994-09-08","rifty":"2004-02-28","richhomiequinn":"2000-09-07","rialy":"2005-09-07","retake":"2007-04-04","riam":"2007-11-21","revised":"2005-09-18","rijasr":"2003-09-26","riftmull":"2005-11-24","ricky":"2006-07-30","resignz":"2007-08-13","ASIA|riki":"2003-08-27","ria":"2008-01-02","ricyszn":"2009-04-12","ricbor":"2006-11-29","retro":"2010-10-17","rezoy":"2009-12-04","riemu":"2010-01-25","rifupen":"2011-03-18","NAC|rise":"2002-07-22","ASIA|rise":"2005-10-03","ritual":"2005-08-29","rivlee":"2004-03-26","rip":"2003-01-22","rlluka":"2002-05-15","river":"2007-07-13","rizza":"2004-11-19","rivo":"2003-09-25","EU|rise":"2002-04-05","ritsu":"2009-03-12","rojo":"1998-01-08","rocaine":"2002-01-20","rocca":"2005-10-26","rotory":"2005-04-08","robabz":"2004-07-12","robban":"2006-09-17","rui":"2006-02-12","romero":"2006-10-05","ronin":"2005-04-24","robnic":"2001-02-15","robin":"2009-04-18","rojocasa":"2007-06-20","rucien":"2001-06-15","rqzrim3":"2009-02-05","NAC|saf":"2002-05-29","NAW|saf":"2002-05-29","saevid":"2003-09-13","safik":"2003-07-17","ruri":"2003-06-07","runa":"2007-07-28","s1ned":"2007-03-07","mkmkpapa":"2007-09-07","vrxthless":"2001-02-13","rupa":"2003-10-27","rxtr":"2006-03-08","ryucyan":"2007-08-10","rura":"2009-03-18","saad":"2008-09-29","s3d":"2008-09-29","ryoit":"2009-10-20","s6nti":"2002-07-08","sangild":"2006-07-17","salva":"2006-05-28","salvatore":"2006-05-28","zazi":"2006-11-12","salko":"2007-11-01","sanjog":"2005-05-19","sane":"2004-08-14","saiu":"2006-10-27","samppa":"1996-07-19","sandman":"2006-07-03","saltloverr":"2006-02-16","sails":"2004-11-24","sakee":"2007-07-05","sahara":"2005-02-24","scoped":"2004-01-16","scriwy":"2004-04-27","scarebear":"2007-10-17","scammed":"2003-09-14","sceptic":"2004-04-30","ME|saud":"2003-11-29","scolleh":"2002-02-23","sapiros":"2004-10-27","saqo":"2003-01-08","sciacqua":"2005-06-20","saruzy":"2002-03-20","scroll":"2009-07-28","sayara":"2007-10-05","scrub":"2002-07-04","setty":"2003-09-08","shady":"2006-10-17","seanvp":"2003-11-01","seeyun":"2003-11-21","shadow":"2008-03-13","NAC|seek":"2006-02-15","EU|sebby":"2003-09-29","shad0w":"2005-03-15","seyyto":"2007-06-30","seren":"2004-02-11","sfa7":"2004-02-05","shadox":"2006-07-13","sevn":"2005-10-14","seals":"2007-08-27","seven":"2006-09-08","sepz":"2010-06-30","seawave":"2008-07-18","shmeky":"2002-12-15","shunsyan":"2004-10-06","shamokiy":"2005-01-11","shaykoz":"2004-01-02","sharkman":"2005-12-02","shinck":"2004-09-11","NAC|shaedess":"2002-02-22","sheco":"2003-09-16","shhneider":"1996-11-03","shelom":"2008-01-15","shuga":"2004-09-27","shu":"2006-02-22","shur4":"2006-10-12","shxrk":"2011-06-14","shuzeyy":"2005-05-29","shaz":"2002-09-01","sharpztw":"2005-02-10","skite":"1999-11-23","skailer":"2002-09-24","skits":"2004-12-19","sinooh":"2002-05-29","siren":"2005-09-30","ASIA|seek":"2006-03-16","skivex":"2006-06-25","sickerz":"2004-12-12","skayter":"2008-05-06","NAW|silent":"2000-02-04","NAC|silent":"2000-02-04","sirence":"2008-02-05","OCE|slaya":"2001-12-19","skram":"2001-10-11","slix":"2003-06-07","slick":"2000-12-30","slovay":"2007-02-23","slender":"2003-12-22","skydeun":"2003-12-31","slim":"2006-06-20","slays":"2003-12-01","skvii":"2003-11-16","skvts":"2004-08-13","skyjump":"2008-08-23","sky":"2009-05-23","slaitz":"2006-04-19","skyzouw":"2006-08-12","skyzou":"2006-08-12","slimey":"2004-03-07","slimezey":"2005-01-22","skvdoosh":"2003-07-12","ME|slay":"2006-04-12","slapiin":"2005-09-17","slepzi":"2010-02-04","snayzy":"2003-04-25","NAW|snacky":"2006-06-05","smite":"2006-02-23","snowvaks":"2003-01-12","smeef":"2000-10-23","smqcked":"2000-08-28","EU|snap":"2004-02-22","snaz":"2005-05-31","snagged":"2004-02-08","NAC|snow":"2002-04-30","NAW|snow":"2002-04-30","BR|snow":"2002-07-24","ME|27q8":"2009-09-11","snowy":"2008-03-02","sloxzay":"2007-03-09","snirot":"2002-11-14","snadr":"2004-08-01","sneaky":"2010-02-11","spades":"2001-11-07","EU|sp1aash":"2004-08-03","soaked":"2008-01-19","spayde":"2002-03-19","sorif":"2003-02-13","sommerset":"2003-08-09","source":"2007-09-21","sparebow":"2005-10-29","somin":"2002-02-08","solvey":"2010-10-02","soul":"2006-06-14","souzyy":"2008-10-16","speedynd":"1997-10-13","spy":"2002-02-26","spitflow":"2002-12-06","sphinx":"2008-08-07","spideyy":"1999-08-26","spirok":"1999-04-01","spex":"2004-06-04","spayed":"2003-12-04","spookz":"2009-06-10","spen":"2003-02-19","spicy":"1999-06-15","spexx":"2007-06-06","spinz":"2011-10-12","stompy":"2001-07-11","stork":"2006-04-26","4drstork":"2006-04-26","stenno":"2004-02-09","staqi":"2005-06-18","steptr":"2003-04-07","stain":"2007-07-16","sto":"2002-03-19","strendd":"2004-01-28","steanzz":"1998-06-01","stranger":"2007-03-29","sqyve":"2005-02-10","ssdouble":"2004-01-08","srapt":"2006-10-09","ME|steady":"2004-09-07","stevinfn":"2008-04-24","stax":"2007-02-23","starkus":"2009-01-19","star":"2010-02-09","stohkd":"2004-10-25","steg":"2004-04-07","swag":"2004-03-08","stryker":"2006-09-08","suns":"2004-11-23","styrsix":"2006-05-19","sunz":"2005-05-10","superevan":"1998-03-01","swapz":"2003-11-18","sunddely":"2004-02-20","styler":"2001-09-06","surprise":"2003-03-26","strodles":"2000-12-05","summr":"2004-08-05","swaggi":"2003-07-14","sutea":"2007-10-25","sure":"1998-06-28","strix":"2004-09-26","NAC|sway":"2004-01-27","tabzg":"2003-02-10","sync":"1997-03-05","symetrical":"2003-06-19","swizzy":"2006-04-17","t3eny":"2008-09-11","sxhool":"2006-03-16","symfuhny":"1999-12-21","OCE|syn":"2007-02-02","swarm":"2003-01-07","swerl":"2004-06-21","syamu":"2003-04-01","syaaz":"2007-11-30","sxdia":"2007-04-03","synxufy":"2003-11-28","synix":"2008-08-31","synez":"2005-01-22","sync cool":"2004-09-14","syaz":"2004-10-10","swizz":"2010-07-15","tavern":"2001-10-17","tahi":"2002-10-19","tade":"2003-01-16","takii":"2006-01-31","taielboticat":"2008-01-23","tackyy":"2004-12-22","tarpz":"2007-06-09","taive":"2008-06-18","tairany":"2003-02-05","tamakii":"2008-02-20","tarzan":"2003-12-01","OCE|tanman":"2007-04-02","takeru":"2007-03-21","tfue":"1998-01-02","tayson":"2004-06-09","teeq":"2003-02-06","tchypss":"2005-09-28","teuzz":"2006-04-12","OCE|tekmarr":"2005-04-17","tayler":"2007-04-18","taytan":"2002-02-07","teroq":"2008-05-20","tdapp":"2003-06-29","tendy":"2002-10-08","technique":"2003-07-13","teaguey":"2004-03-19","teramcrazy":"2007-04-17","teqqz":"2008-07-30","thevic":"2001-12-24","thwifo":"2002-08-30","thiefs":"1996-05-21","th0mashd":"2002-05-30","threats":"2004-10-21","thorik":"2007-05-11","thor":"2007-05-11","tickrss":"2000-03-25","till":"2003-05-15","taiya":"2007-11-23","tiekko":"2004-12-11","thiagin":"2005-11-03","tiggz":"2008-01-21","tidi":"2008-02-04","tigg":"1999-09-20","tibbah":"2006-08-30","tigerr":"2011-03-23","thetik":"2006-10-23","tohaj":"1994-10-10","toff":"2003-11-11","tisco":"2005-12-07","tinkerbell":"2005-06-10","tinka":"2008-02-05","tonbocub":"1997-01-24","tjino":"2007-09-27","tjohnso":"2007-12-16","tleq":"2003-10-27","toggle":"2004-05-18","tiny":"2002-12-18","tipe shotzz":"2005-07-21","tisora":"2003-05-19","tomat":"2012-02-28","toose":"2002-07-29","trippernn":"2004-01-23","triggy":"1999-03-10","trashy":"2004-11-02","tragix":"2004-09-03","tori":"2004-09-09","ME|trikshotz":"2006-04-07","trey":"2003-09-14","trapped":"1999-11-15","trexer":"2005-02-03","tossily":"2002-02-28","totot":"2003-07-09","trimmers":"2004-06-30","toxxen":"2005-07-28","toraa":"2008-11-01","tooke":"2002-01-31","trippn":"2008-07-06","triix":"2008-05-26","toukii":"2004-03-08","topgun":"1997-09-03","tracer":"2001-03-16","tossy":"2009-02-16","tschinken":"2001-01-29","trulex":"2002-09-24","tuckz":"1998-09-24","tuii":"2002-07-03","EU|tuna":"2003-09-24","ME|tuna":"2003-09-24","troqz":"2001-11-21","tuexy":"2003-04-23","tropex":"2004-01-20","trixy":"2003-04-30","trunks":"2000-06-09","tsunami":"1998-06-10","twi":"2009-05-06","turtle":"2006-11-04","trixiaga":"2004-06-24","turtl3":"2010-04-19","trose":"1998-09-30","twiko":"1997-06-03","twek":"2009-12-11","trixou":"2003-09-17","twistnator":"2005-10-05","tups":"2008-09-30","tyler15":"1997-10-01","unknown":"2004-03-22","umplify":"2002-07-29","unit":"1998-11-10","iiuniit":"1998-11-10","userz":"2005-03-12","ASIA|tzuyu":"2003-12-17","twunti":"2005-07-05","tyraxe":"2004-05-15","unsightly":"2004-04-19","uyuriru":"1997-04-27","upl":"2008-06-27","unosuke":"2003-06-03","txrm":"2009-06-21","ty":"2004-11-22","uxsif":"2007-03-17","vato":"1999-05-05","veno":"2004-11-26","vanyak3kk":"2005-03-02","vanyak3k":"2005-03-02","vanillaz":"2006-11-08","vaske1x":"2006-03-08","vayne":"2000-08-03","vacan":"2005-06-15","vaxsr":"2005-09-26","venihcy":"2004-01-25","vanilla":"2000-12-21","EU|ve1ryy":"2007-03-14","vader":"2007-07-12","vanhe":"2005-03-29","vagera":"2006-11-03","vediits":"2008-06-04","velofps":"2009-08-21","veer":"2008-07-28","venor":"2005-01-20","vinny1x":"2001-07-25","verox":"2001-12-09","vert":"2002-11-30","EU|vetle":"2005-01-19","vic0":"2007-05-22","vic0try0na":"2007-05-22","viiroos":"2002-03-07","virsuh":"2005-10-26","EU|vexi":"2007-02-13","visxals":"2005-07-13","victerv":"2011-09-18","vitaminsuu":"2010-02-06","vexy":"2008-03-02","NAC|vergo":"2009-04-17","NAW|vergo":"2009-04-17","vexzcy":"2003-10-21","EU|viper":"2003-04-19","vibefiez":"2005-06-16","vorwenn":"1999-12-20","wakie":"2004-06-24","volx":"2003-02-15","vortexm":"2004-02-22","EU|vortex":"2005-07-23","vortexia":"2004-12-08","voidd":"2005-07-09","vortexers":"2005-01-14","voxe":"2005-08-17","voil":"2002-05-06","walay":"2004-10-14","vysi":"2003-11-16","voxie":"2003-02-11","vitinho":"2004-12-18","vujcich":"2003-07-11","volko":"2006-01-22","voltiax":"2005-08-02","void":"2009-12-08","vleccks":"2008-03-23","vyperzk":"2004-12-30","voz":"2010-06-18","wickesyuk":"1998-11-25","wavyjacob":"2003-09-20","whofishy":"2003-01-05","wildhawk":"2004-10-05","wickesy":"2006-08-08","wcarey":"2001-04-30","wanlast":"2001-03-26","NAW|wheels":"1998-12-20","will":"2003-06-22","wheat":"2004-11-24","weeb":"2003-07-01","walver":"2004-08-05","werex":"2007-01-11","walla":"2002-07-26","winther":"2009-06-20","wolfiez":"2003-12-11","wox":"2006-08-27","wraxx":"2003-10-20","xccept":"2003-08-12","wrigley":"2004-07-06","xcells":"1996-02-19","EU|wulfee":"2004-02-22","wisheydp":"2004-12-22","guardiao bjj 22":"2004-12-22","wood":"2001-05-25","wyggs":"1998-01-02","OCE|xavier":"2009-08-08","wreckless":"2006-07-25","woodsy":"2004-10-22","wisa":"2001-04-08","wiqciz":"2006-11-12","wolvax":"2008-12-15","ME|wolf":"2006-06-03","wokes":"2007-12-30","xsweeze":"2005-08-03","ME|xx731":"2003-04-25","xkumu":"2003-08-05","xsterioz":"2003-08-28","xeat":"2007-08-17","xenolith":"2004-11-04","xjam":"2006-11-21","yagsou":"2002-05-31","xoonies":"2003-01-25","xnb":"2006-02-06","xerx":"2005-10-31","xper":"2004-08-31","xetiq":"2004-12-16","xpon":"2005-11-16","xenon":"2002-05-14","xplash":"1999-12-13","xjiuo":"1999-10-12","yonx":"2004-04-11","yama":"2005-04-21","yasir":"2004-08-30","yoosaltyy":"2006-04-20","yasenoppo":"1999-11-23","yiyan":"2008-07-04","yassen":"2009-11-24","yoda":"2001-10-19","zanz":"2003-08-27","zandy":"2006-01-17","yusea":"2003-02-08","yunseopp":"2002-11-11","zagou":"2005-12-27","EU|zara":"2003-09-01","NAW|yumi":"2004-11-02","yung calculator":"2005-02-25","zangi":"2007-06-21","zarby":"2001-09-04","ASIA|yuma":"2008-05-10","yuz":"2005-10-26","yuleys":"2006-05-16","zarbeh":"2007-03-10","zayni":"2008-12-08","zays":"2007-05-02","zayt":"2000-03-02","zeston":"2004-12-18","zedox":"2006-05-09","zeykoo":"2003-01-11","zebre":"2003-02-23","kame":"2005-01-26","zehlo":"2004-02-15","zeus":"2004-04-30","zepher":"2001-02-10","zemo":"2007-06-16","zeerox":"2004-06-21","NAC|zelo":"2005-12-26","OCE|zelo":"2004-05-27","ME|zenox":"2002-04-20","EU|zenox":"2009-06-30","zdog":"2009-05-12","zeeyadx":"1999-02-27","zeeom":"1999-01-07","zesty":"2004-04-30","zenn":"2007-05-05","zerua":"2007-04-27","zeph":"2010-05-15","znappy":"2003-10-12","zoreh":"2003-02-25","zq":"2003-07-24","zno":"2008-09-08","ASIA|zotax":"2002-10-15","zlem":"2004-03-18","zino":"2002-12-03","zh1ny":"2004-12-30","zmax":"2005-01-05","zohea":"2005-04-26","zlink":"2006-08-21","zonuq":"2004-04-19","zoom3rx":"2008-01-23","zoommba":"2003-06-25","johnny":"2003-12-01","zpxy":"2004-04-07","zinxii":"2008-10-11","zire":"2009-04-30","zuko":"2004-08-01","bot":"2007-01-17","zum":"2005-03-03","zukoxf":"2006-10-25","zuity":"2004-01-25","zqcca":"2005-03-06","zscary":"2006-12-12","zuusboy":"1999-08-10","zsdr":"2003-09-11","zyyron":"2006-01-07"};   // даты рождения с Liquipedia (tools/build-liqui-dob.js), страна страницы = страна карточки
function ccBornOf(handle, region){
  const h=String(handle||'').toLowerCase();
  if(!h) return null;
  const rg=ccRegenBorn(h); if(rg) return rg;
  if(region){ const hit=CC_BORN[String(region)+'|'+h]; if(hit) return hit; }
  if(CC_BORN[h]) return CC_BORN[h];
  // Даты с Liquipedia (его слово 7.10: «найди возраста каждого игрока на ликвидпедии»), сверены по стране карточки.
  if(typeof CC_BORN_LQ!=='undefined'){ if(region && CC_BORN_LQ[String(region)+'|'+h]) return CC_BORN_LQ[String(region)+'|'+h]; if(CC_BORN_LQ[h]) return CC_BORN_LQ[h]; }
  return null;
}
/* Career age. A made-up player starts at 16 and ages a year per season; a taken real card uses
   its birthday against the career's current day (so the birthday falls mid-season).
   Matters for development and retirement. The age edge still applies only to a built player
   who chose an age. */
function ccPlayerAge(){
  const cr=CAREER && CAREER.career, pl=CAREER && CAREER.player;
  if(!pl) return 0;
  /* Plus the years the career has run, which is not the same as the date.

     A second career year is the measured 2026 again - only 2026 was measured
     and a 2027 does not exist to copy - so the clock goes back to January every
     season. Reading a birthday against that clock froze a taken card at the age
     they were in the first year: five seasons as Sky and he is still sixteen,
     while a built player next to him is twenty-one. The seasons are the thing
     that actually passed. */
  const real = pl.handle ? ccAgeNow(pl.handle) : null;
  if(real!=null) return real;
  /* И у созданного игрока может быть день рождения.

     Раньше его возраст был только счётчиком: плюс год на границе сезона, и
     день, в который это случилось, — 5 января, общий для всех. Теперь дату
     можно ввести на экране создания, и тогда возраст считается как у настоящей
     карточки: по дню, против того дня, в котором карьера стоит, плюс прожитые
     сезоны. Отсюда же берётся и то, ради чего дата вводится, — день, в который
     сцена поздравляет. См. careerBirthdays. */
  const own = pl.born ? ccAgeOn(pl.born, careerToday()) : null;
  // Только сезоны после 2026: до него дата сама идёт вперёд, счётчик сезонов прибавлял тот же год второй раз.
  if(own!=null) return own+ccYearShift();
  return pl.age||0;
}
// How old they are on the day the career is standing in, which is the only day
// an age is true on.
function ccAgeOn(born, iso){
  if(!born || !iso) return null;
  let a=Number(iso.slice(0,4))-Number(born.slice(0,4));
  if(iso.slice(5)<born.slice(5)) a--;
  return a>0 && a<60 ? a : null;
}
function ccAgeOf(handle, iso){
  return ccAgeOn(ccBornOf(handle), iso||careerToday());
}
/* How many years this career has run, which the calendar cannot say.

   Every season replays the measured 2026, so the clock goes back to January and
   a birthday read against it is the age somebody was in year one, for ever. The
   career itself already carried the correction — see ccPlayerAge — and nobody
   else did: Scroll was born in July 2009, so a ninth season, played out under
   2034 on the hub, still printed sixteen over the seat beside the player and
   developed him on a sixteen-year-old's curve. His report, 20 August.

   So the correction is one function and everybody reads it: the scene ages at
   the same rate the career does, which is a season a season. */
function ccSeasonsIn(){
  const cr=CAREER && CAREER.career;
  return Math.max(0, ((cr && cr.season) || 1)-1);
}
// The age of somebody on the roster, in the season the career is standing in.
function ccAgeNow(handle, iso){
  const a=ccAgeOf(handle, iso);
  // Сезоны после 2026 (ccYearShift): в 2019–2025 календарь идёт вперёд сам, иначе +2 года за сезон.
  return a!=null ? a+ccYearShift() : null;
}
/* Возраст для карточек и ухода со сцены. Слово 19.10: «без известной даты рождения пусть у них будет 18 сразу» —
   в первом сезоне 18, дальше стареет вместе со сценой. Рост рейтинга по-прежнему берёт ccAgeNow и средний возраст сцены. */
function ccAgeShown(handle){
  const a=ccAgeNow(handle);
  return a!=null ? a : 18+ccSeasonsIn();
}
const CC_DM_LADDER_OFF=[7, 4, 1, -1, -3, -6];
/* And what the rung can hold.

   Teammates are found by rating - his rule - and a rating is not a room. A
   career walking Division 5 on a taken card reads 96, so a list built on the
   rating alone offered it strangers rated 99 in Division 5, which is the same
   complaint as the real names were: the room has to be possible.

   The ceiling is the band of the rung above, because that is what standing in
   this room means. Anybody holding that rating is not in Division 5 any more,
   they were promoted out of it. And when the career itself is over the ceiling,
   the spread turns one-sided: in Division 5 a 96 has nobody above them, and
   pretending otherwise is the invented 99 again. */
function ccDivCeil(div){
  return Math.min(div>1 ? ccBand(div-1) : 99, ccGenTop());
}
const CC_DM_LADDER_UNDER=[0, -2, -4, -6, -9, -12];
/* Потолок рейтинга в комнате: ступень дивизиона или свой рейтинг, что выше.
   Иначе игрок с 80 в Дивизионе 5 видел вокруг только 61 и звать было некого, а подняться можно только через кубок вдвоём.
   Выдуманного 99 в Д5 это не возвращает: предел то, чего ты сам достиг. */
function ccDmLadderPool(rnd, mine){
  const div=CAREER.career.division;
  const rung=ccDivCeil(div);
  const ceil=Math.max(rung, Math.round(CAREER.player.ovr||0));
  const over=CAREER.player.ovr>ceil;
  const band=Math.min(CAREER.player.ovr, ceil), taken=new Set([...mine]);
  const offs=over ? CC_DM_LADDER_UNDER : CC_DM_LADDER_OFF;
  const out=offs.slice(0, CAREER_DM_POOL).map(off=>{
    const ovr=clamp(Math.round(band+off+(rnd()*2-1)), 35, ceil);
    const card=careerLadderPlayer(rnd, ovr, taken, null, ccSquadRoleWanted(), null, div>=2);
    return {handle:card.handle, ovr, nat:card.nat, role:attrsFor(card).roleKey,
            roster:false, card, club:null, pay:0};
  });
  // The ones who would actually consider you come first, the way the roster
  // list puts the people without a seat at the top: on this rung that is simply
  // who is nearest your own level.
  out.sort((a,b)=>Math.abs(a.ovr-band)-Math.abs(b.ovr-band));
  return out;
}
function careerDmPool(){
  const cr=CAREER.career, me=careerCard();
  const rnd=careerRng(careerSeed(cr,'dm'));
  // Only the two seats that are actually filled are excluded here. Existing
  // conversations are filtered out where the list is drawn, so that removing
  // somebody cannot change who the other five are.
  const mine=new Set([hKey(me)]);
  // The whole squad, not the first seat. A trio's second partner was not in
  // this set, so he could be drawn as the rival the player was chasing.
  careerMates().forEach(function(m){ if(m) mine.add(hKey(m)); });
  // Гонка: напарников соперника не предлагать (одинаковых ботов брать нельзя).
  if(typeof ccRaceOn==='function' && ccRaceOn()) ccRaceTakenKeys().forEach(function(k){ mine.add(k); });
  /* Below Division 1 this is the ladder, not the roster.

     It was the roster at every rung for a while, matched on rating, and the
     reasoning was that the roster reaches down to the Reload Opens' 45s so even
     a rookie's list could be real people. What that missed is the photograph:
     photos/ is Division 1, so a real handle in a Division 5 inbox arrives
     wearing a Major player's face. Real names live where the real rooms are.

     Generated at your own rating, which is the part the earlier complaint was
     really about - an invented stranger reading 96 in Division 5 - so nobody
     down here is offered somebody who has no business answering. */
  if(!ccRealNamesHere()) return ccDmLadderPool(rnd, mine);
  /* Кто пишет — решают они, а не твой состав: человек той же половины дуо
     тоже пишет, и разговор с ним — это разговор о том, что кто-то пересядет
     (аргумент 'role' в careerDmArgs). Но первым в списке идёт тот, кого
     можно посадить прямо сейчас, потому что команде нужен ровно один ИГЛ. */
  const pool=careerRosterNowEU().filter(p=>!mine.has(hKey(p)));
  const near=pool.filter(p=>Math.abs(p._ovr-CAREER.player.ovr)<=8);
  for(let i=near.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=near[i]; near[i]=near[j]; near[j]=t; }
  // The list is headed "looking for a duo", so the people actually looking come
  // first: no standing pair, then pairs whose season has soured, then the rest
  // — writable, but they will say who they already play with.
  // Through the scene's eyes, not the roster's: a seat held by the player's own
  // card is a free seat. See ccSceneMateOf — и по СЕГОДНЯШНИМ парам, как и ответ
  // в личке (careerDmMateOf), иначе развёдшийся стоял бы в хвосте как занятый.
  /* Ранг — один раз на человека, а не на каждое сравнение сортировки (Notion 15.10, «лаги после
     первой церемонии»): каждый вызов — careerDmMateOf → ccSquadMatesOf по всем парам пула, и
     n·log n таких проходов стоили «Соцсети» и каждому «Следующему дню» ~80 мс. */
  const rankOf=new Map();
  const seatRank=p=>{ if(rankOf.has(p)) return rankOf.get(p);
    const m=careerDmMateOf({handle:p.handle});
    const r=!m ? 0 : careerDuoBeatsYou({handle:p.handle}) ? 2 : 1;
    rankOf.set(p, r); return r; };
  near.sort((a,b)=>seatRank(a)-seatRank(b));
  /* Two seats held for the best people in the window, whatever their seat.

     Sorting on "who is actually looking" alone is what the heading promises and
     it turned Division 1's inbox into a vending machine: everybody good already
     plays with somebody, so the six free agents left are all rated under the
     career reading them, every one of them says yes, and the one thing an inbox
     is for - somebody above you deciding about you - could not happen on the one
     rung where it matters. Found by the division sweep: at the Division 1 band,
     nobody in the list would have refused.

     Held rather than sorted in, so the other four are still the people with an
     empty seat. This is the same shape the generated list is built to: two above
     the reach, the rest around and under. */
  const strong=near.slice().sort((a,b)=>b._ovr-a._ovr).slice(0, 2);
  const rest=near.filter(p=>strong.indexOf(p)<0);
  near.length=0;
  strong.concat(rest).forEach(p=>near.push(p));
  // A rating the roster is thin around widens to the closest people there are
  // rather than inventing somebody.
  if(near.length<CAREER_DM_POOL){
    const seen=new Set(near.map(hKey));
    pool.filter(p=>!seen.has(hKey(p)))
        .sort((a,b)=>Math.abs(a._ovr-CAREER.player.ovr)-Math.abs(b._ovr-CAREER.player.ovr))
        .slice(0, CAREER_DM_POOL-near.length).forEach(p=>near.push(p));
  }
  /* Недостающая половина — выше в списке, остальные под ней. Порядок
     наводится уже внутри шестёрки: если сортировать до отбора, роль решала бы,
     кто вообще напишет, и сильные исчезли бы из инбокса. */
  const want=ccSeatRolePreferred(null);
  /* Одно место из шести держится за недостающую роль.
     Роль сортирует уже внутри шестёрки (иначе сильные пропадали бы из инбокса), но если в шестёрке нет нужной роли, писать некому: careerSeatDm не предлагает место, которое нельзя занять.
     Берётся первый подходящий по near (он уже «сначала свободные») и только тот, кого можно позвать: половину пары с ЛАНа не увести (ccLanLocked).
     Без этого у ИГЛа на 88 в Д1 оба фраггера в окне были Sky и Scroll (96, в паре), предложений не было вообще, и в финал недели было не войти. */
  if(want){
    const lan=ccLanLocked();
    const ok=p=>attrsFor(p).roleKey===want && !lan.has(hKey(p));
    const head=near.slice(0, CAREER_DM_POOL);
    if(!head.some(ok)){
      const fill=near.find(ok) ||
                 pool.filter(ok)
                     .sort((a,b)=>Math.abs(a._ovr-CAREER.player.ovr)-
                                  Math.abs(b._ovr-CAREER.player.ovr))[0];
      if(fill){
        const at=near.indexOf(fill);
        if(at>=0) near.splice(at, 1);
        near.splice(CAREER_DM_POOL-1, 0, fill);
      }
    }
  }
  const six=near.slice(0, CAREER_DM_POOL);
  if(want) six.sort((a,b)=>(attrsFor(a).roleKey===want?0:1)-(attrsFor(b).roleKey===want?0:1));
  /* Рейтинг — тот же, что у карточки, а не голый _ovr.

     Тут стояло `ovr:p._ovr`, и это единственное место в файле, где число берут
     без запасного пути: везде рядом написано `p._ovr!=null ? p._ovr :
     attrsFor(p).ovr` — на карточке, в напарнике, в списке сцены. Причина у
     запасного пути простая: _ovr появляется только там, где карточку уже
     подняли (ccSceneLift, сезонный рейтинг), а до подъёма его нет вовсе.

     Инбокс из-за этого писал число не той карточки: игрок видел Scroll 89
     при настоящих 96 и Tjino 87 при 93. Замерено — в пуле _ovr приходил пустым,
     а attrsFor на тех же людях давал 96 и 93.

     Пишется один раз при создании треда, поэтому чинить надо здесь: строка
     разговора живёт дальше сама и запомнит то, что ей дали. */
  return six.map(p=>({handle:p.handle,
    ovr:(p._ovr!=null ? p._ovr : (attrsFor(p)||{}).ovr), nat:p.nat,
    role:attrsFor(p).roleKey, roster:true, cardRegion:p.region, age:ccAgeShown(p.handle),
    // `club`, not `org`: a thread with org set on it IS a club writing to you,
    // and the inbox sorts by that. This is the jersey the person is wearing.
    club:p.org||null, pay:ccPlayerPay(p)}));
}

/* Org and estimated wage of a roster player.
   Org comes from M1_ORG and siblings (each Major's standings). Wage is careerOrgSalary at their rating and the division it belongs to, so 92 reads like Division 1 pay.
   Shown as "about": real salaries aren't published. No org means no wage, a free agent lives on prize money. */
function ccPlayerPay(card){
  if(!card || !card.org) return 0;
  const ovr=card._ovr!=null ? card._ovr : (attrsFor(card)||{}).ovr;
  if(!(ovr>0)) return 0;
  // Which division that rating lives in, off the same bands the ladder uses.
  let div=5;
  for(let d=1; d<=5; d++) if(ovr>=ccBand(d)-2){ div=d; break; }
  return careerOrgSalary(Math.round(ovr), div, 0, ovr);
}
// "about $2,400 a season" — one place, so the list, the thread and the duo tile
// cannot quote three different numbers for the same person.
function ccPayLabel(pay){
  return pay ? L().ccPayAbout(ccNum(pay)) : '';
}

// Whether the person you are writing to is standing in a duo of their own, and
// whether that duo's season has gone badly. The duo is the card's own roster
// entry; the bad season is measurable only where the world plays out a season —
// Division 1's table — and it means the bottom third of it.
/* Current form when picking a partner: their Division 1 season standing, from careerTableAdd which plays the D1
   table every week with or without you. So it's this career's standing, not real life.
   Only D1 (the only rung with a table) and only after a few weeks; below that nothing is shown. */
function ccDuoForm(handle){
  const rows=careerTableRows();
  const t=careerTable();
  if(!rows.length || (t.weeks||0)<3) return null;
  const k=hKey({handle:handle});
  // Указатель «ник → место» — тоже один раз на перерисовку (см. CC_RENDER_MEMO).
  let idx=CC_RENDER_MEMO && CC_RENDER_MEMO.get('tblIdx');
  if(!idx){ idx=new Map(); rows.forEach((r,j)=>String(r.name||'').split(/\s*[+&]\s*/).forEach(h=>{ const kk=hKey({handle:h}); if(!idx.has(kk)) idx.set(kk, j); })); if(CC_RENDER_MEMO) CC_RENDER_MEMO.set('tblIdx', idx); }
  const i=idx.has(k) ? idx.get(k) : -1;
  if(i<0) return null;
  const r=rows[i];
  return {place:i+1, of:rows.length, pts:r.pts, weeks:r.weeks, best:r.best, wins:r.wins};
}
// One line of it, for a row in a list.
function ccDuoFormLabel(handle){
  const f=ccDuoForm(handle);
  if(!f) return '';
  return L().ccFormTable(f.place, f.of)+(f.best!=null ? ' · '+L().ccFormBest(f.best) : '');
}
/* The roster's answer, minus you.

   ccRealMateOf reads the 2026 pairings, and a career played as a taken card is
   standing inside them: take Sky, write to Scroll, and the roster says Scroll's
   duo is Sky — so Scroll turned the player down with "I play with Sky. We are
   fine as we are", said to Sky. His screenshot, 20 August: refused in your own
   name, for your own seat.

   So anywhere the scene asks "who do they already play with", the answer is
   never the player himself. That seat is not taken, it is this conversation. */
function ccSceneMateOf(card){
  const m=card ? ccRealMateOf(card) : null;
  if(!m) return null;
  const pl=CAREER && CAREER.player;
  if(pl && pl.handle && hKey(m)===hKey(pl.handle)) return null;
  return m;
}
/* С кем он играет СЕГОДНЯ, а не с кем начал год.

   Стояло на ccSceneMateOf, то есть на ростере Epic, — а статус F/A в ленте и
   строка «свободен» в поиске дуо читаются по careerPools (ccPairMateOf), где
   разводы, трансферы и рынок трио уже учтены. Два ответа на один вопрос: список
   говорил «свободен», а ответ в личке — «я играю с @x, нам и так хорошо». Игрок: «игроки, которые ищут игроков, ты им пишешь, а они пишут
   занято». Половинка, которую забрал сам игрок, тоже не пара — то кресло и
   есть этот разговор (см. ccSceneMateOf). */
function careerDmMateOf(who){
  let m=null;
  try{ m=ccPairMateOf(who.handle); }catch(e){ m=null; }
  if(!m) return null;
  const k=hKey(m), pl=CAREER && CAREER.player;
  if(pl && pl.handle && hKey(pl.handle)===k) return null;
  if(careerMates().some(c=>c && hKey(c)===k)) return null;
  return m;
}
/* Whether the duo somebody is already in is better than the one you are
   offering — which is the whole of the question, from their side.

   His rule, 17 August: a player looks at results, or at the rating when there
   are no results to look at, and if the pair they are in is going better than
   you are there is nothing for them to think about.

   The old answer was the bottom third of the season table, which said a duo in
   eleventh place is unhappy and one in tenth is not, whoever happened to be
   asking. It never compared the two things a person actually compares. This
   does: their table place against yours where a table exists, and their
   partner's rating against yours where it does not. With neither, the seat
   stays where it is — a standing duo is not for sale to a stranger. */
function careerDuoBeatsYou(who){
  const theirs=ccDuoForm(who.handle);
  const mine=careerTablePlace();
  if(theirs && mine) return theirs.place < mine;
  const mate=careerDmMateOf(who);
  const his=mate ? (mate._ovr!=null ? mate._ovr : (attrsFor(mate)||{}).ovr) : null;
  return isFinite(his) ? his>=CAREER.player.ovr : true;
}
// Would they play with you. The seat first: a player standing in a real duo
// does not leave it for a stranger with a better number — the user's rule —
// unless the season that duo is having has gone badly enough to change
// something. Then rating, then what you have just done: a cut or a podium is
// worth a couple of points of persuasion, because it is the only argument you
// have that the number does not already make.
// One truth, read two ways: careerDmMargin is the same arithmetic as a number,
// and this is the yes or no the rest of the mode asks for. They cannot disagree
// because this is that.
function careerDmWouldAccept(who){ return careerDmMargin(who)>=0; }

/* People who just watched.

   The audience was a number in the corner: it grew, it priced a sponsor, and
   nobody ever heard from it. A fan writes after a night worth writing about, and
   what they write is not another negotiation - it is the room being loud.

   How often is the audience's own size: a career nobody follows hears from
   nobody, and a Division 1 regular with fifty thousand readers hears something
   after most good nights. Names are the ladder's own generator, because a fan
   is not somebody on the roster, they are the person watching it. */
const CC_FAN_KEEP=6;

/* Fan messages. Topics are only what's true tonight (partner, club, how long they've watched),
   and many are questions the player answers in their own words. The topic a reader picks is fixed
   per handle, like their voice. Bad nights get supportive messages too, not only haters.
   Used to be one subject and 12 sentences, so the inbox repeated itself. */
const CC_FAN_Q=['Improve','Win','Nerve','Loss','Start','Sens'];
function ccFanSubjects(place, of, beat, passed){
  const cr=CAREER.career, out=[];
  const add=(k,a,w)=>{ for(let i=0;i<(w||1);i++) out.push({k:k, a:a||[]}); };
  if(passed || beat>=0.85){
    // The night itself, still what most of them write about.
    add(place===1 ? 'dmFanWin' : beat>=0.94 ? 'dmFanTop' : 'dmFanCut', [place, of], 4);
    if(careerMateRec() && careerMateRec().handle) add('dmFanMate', [careerMateRec().handle]);
    if(CAREER.org && CAREER.org.name) add('dmFanClub', [CAREER.org.name]);
    if(careerReach()>=4000) add('dmFanClip', [Math.max(2, Math.round(careerReach()/220))]);
  } else {
    add('dmFanChin', [place, of], 2);
    add('dmFanStay', [], 2);
  }
  // Watching since the bottom, if there is a bottom to have watched from.
  const worst=(cr.log||[]).reduce((w,r)=>Math.max(w, r.div||0), 0);
  if(worst>cr.division) add('dmFanSince', [worst]);
  CC_FAN_Q.forEach(q=>add('dmQ'+q));
  return out;
}
function ccFanSubject(handle, place, of, beat, passed){
  const subs=ccFanSubjects(place, of, beat, passed);
  return subs[ccHashStr('fansub|'+String(handle||''))%subs.length];
}
function careerFanDm(place, of, passed){
  const cr=CAREER.career;
  if(!(of>1)) return null;
  const beat=1-(place-1)/(of-1);
  const good=passed || beat>=0.85;
  const rnd=careerRng(ccHashStr('fan|'+cr.season+'|'+careerToday()+'|'+place));
  // One in ten thousand readers writes, near enough, and never more than one a
  // night, so a big audience is louder rather than spammier. A bad night is
  // quieter but not silent: the few who were watching anyway still write.
  const chance=clamp(careerReach()/40000, 0, 0.85)*(good ? 1 : 0.34);
  if(rnd()>=chance) return null;
  const taken=new Set(careerDms().map(t=>hKey(t.who.handle)));
  // Фан — зритель, а зрители пишут строчными без цифр (то же правило, что в чате).
  const c=careerLadderPlayer(rnd, 40+Math.floor(rnd()*40), taken, null, null, null, true);
  const who={handle:c.handle, ovr:null, nat:c.nat, role:null, roster:false, fan:true};
  const t=careerDmThread(who);
  const sub=ccFanSubject(who.handle, place, of, beat, passed);
  careerDmPush(t, 'them', sub.k, sub.a);
  // A question is a thread that is waiting on the player rather than one that is
  // finished, and the thread remembers which question it was.
  if(sub.k.indexOf('dmQ')===0) t.q=sub.k.slice(3);
  // The wall does not grow forever: the oldest fan letters fall off first, and
  // never a club or a duo.
  const fans=careerDms().filter(x=>x.who && x.who.fan);
  if(fans.length>CC_FAN_KEEP){
    const drop=new Set(fans.slice(CC_FAN_KEEP).map(x=>x.id));
    CAREER.dms=careerDms().filter(x=>!drop.has(x.id));
  }
  careerSave();
  return t;
}
/* Haters. Same rules as fan letters: tied to a real result, at most one per night, no buttons,
   never move a number (a morale cost would punish having an audience). Rarer than fans and only
   once there's an audience to have watched: nobody writes to a Division 5 nobody. */
const CC_HATE_KEEP=4;

/* What a hater says. Each handle has its own subject, picked like a voice: the better half of the duo, a rating
   that looks wrong, the money, the viewer count, a better past season. Each subject gets its own reply, see
   careerHaterReply. */
const CC_HATE_CLAP={dmHateMate:'Mate', dmHateFraud:'Fraud', dmHateQuit:'Quit',
                    dmHateOld:'Old', dmHateReach:'Reach', dmHateMoney:'Money'};
function ccHaterSubjects(place, of, beat){
  const cr=CAREER.career, out=[];
  const add=(k,a,w)=>{ for(let i=0;i<(w||1);i++) out.push({k:k, a:a||[]}); };
  // The night itself, and being on a roster is what makes a bad one public.
  add(beat<=0.15 ? 'dmHateBottom' : 'dmHateFlop', [place, of], 3);
  if(CAREER.org && CAREER.org.name) add('dmHateOrg', [place, of, CAREER.org.name], 2);
  if(careerMateRec() && careerMateRec().handle) add('dmHateMate', [careerMateRec().handle]);
  add('dmHateFraud', [Math.round(CAREER.player.ovr||0)]);
  add('dmHateQuit', []);
  if(cr.season>1) add('dmHateOld', [cr.season-1]);
  // Only somebody nobody watches gets told how few are watching.
  if(careerReach()<3000) add('dmHateReach', [Math.max(1, careerReach())]);
  if((cr.earnings||0)>0) add('dmHateMoney', [ccNum(cr.earnings||0)]);
  return out;
}
function ccHaterSubject(handle, place, of, beat){
  const subs=ccHaterSubjects(place, of, beat);
  return subs[ccHashStr('hatesub|'+String(handle||''))%subs.length];
}

/* And people change their minds.

   Somebody who was loud after a bad night, and who got answered rather than
   ignored, can come back after a good one having changed it. That is the whole
   of the arc and it needs no new machinery: the thread is still there, it is
   already answered, and one more message closes it.

   It only happens to a hater the player actually replied to, which makes the
   clapback worth something beyond the reach it buys, and only after a night
   nobody could argue with. */
function careerHaterTurn(place, of){
  if(!(of>1)) return null;
  const beat=1-(place-1)/(of-1);
  if(!(place===1 || beat>=0.94)) return null;
  const t=careerDms().find(x=>x.who && x.who.hater && x.answered && !x.turned);
  if(!t) return null;
  const rnd=careerRng(ccHashStr('turn|'+t.id+'|'+careerToday()));
  if(rnd()>=0.5) return null;
  t.turned=true;
  careerDmPush(t, 'them', 'dmHateTurn');
  careerSave();
  return t;
}
function careerHaterDm(place, of, passed){
  const cr=CAREER.career;
  if(!(of>1)) return null;
  const beat=1-(place-1)/(of-1);
  // Worth being loud about: the cut was missed, and the night was in the bottom
  // half of the room. Somebody who missed it by two places is left alone.
  if(passed || beat>=0.5) return null;
  const rnd=careerRng(ccHashStr('hate|'+cr.season+'|'+careerToday()+'|'+place));
  const chance=clamp(careerReach()/60000, 0, 0.6);
  if(rnd()>=chance) return null;
  // Open threads and everybody blocked: a blocked hater must not respawn under
  // the same name the day after the button was pressed.
  const taken=new Set([...careerDms().map(t=>hKey(t.who.handle)), ...ccBlockedSet()]);
  const c=careerLadderPlayer(rnd, 40+Math.floor(rnd()*40), taken);
  const who={handle:c.handle, ovr:null, nat:c.nat, role:null, roster:false, hater:true};
  const t=careerDmThread(who);
  const sub=ccHaterSubject(who.handle, place, of, beat);
  careerDmPush(t, 'them', sub.k, sub.a);
  const hs=careerDms().filter(x=>x.who && x.who.hater);
  if(hs.length>CC_HATE_KEEP){
    const drop=new Set(hs.slice(CC_HATE_KEEP).map(x=>x.id));
    CAREER.dms=careerDms().filter(x=>!drop.has(x.id));
  }
  careerSave();
  return t;
}
/* What a thread is called, decided when it is drawn.

   A brand's name is a translation, so storing it on the thread froze it in
   whichever language it first wrote in - see careerSponsorDm. Everybody else is
   a handle, and a handle is the same word in both. */
function ccDmName(who){
  // A club that came through a manager is the manager talking. See careerOrgDm.
  if(who && who.viaAgent) return who.viaAgent.name;
  if(who && who.brand && L()['ccSponsor'+who.brand]) return L()['ccSponsor'+who.brand];
  return (who && who.handle) || '';
}
function careerDmThread(who){
  const t={id:'t'+careerDms().length+'_'+hKey(who.handle), who, msgs:[], unread:false, state:'open'};
  /* Заблокированному дают куда писать и не дают, куда попасть.

     Блок держался на одном фильтре — на списке тех, кто может позвать в дуо, —
     а всё остальное открывало ветку заново: клуб, менеджер, зритель. Менеджер
     писал каждый день, и каждый день это было новое уведомление. Жалоба игрока.

     Поэтому запрет стоит здесь, в единственном месте, где ветка вообще
     заводится. Объект возвращается настоящий, чтобы всё, что уже собралось
     писать, дописало без единой проверки у себя, — просто он никуда не
     положен: его нет в списке, нет в сейве и нет на экране. */
  if(who && who.handle && ccBlocked(who.handle)) return t;
  careerDms().unshift(t);
  if(careerDms().length>CAREER_DM_KEEP) careerDms().length=CAREER_DM_KEEP;
  return t;
}
function careerDmFind(handle){ return careerDms().find(t=>hKey(t.who.handle)===hKey(handle)); }
/* Several voices per line. Which one a person uses is hashed off the handle, so it's stable and never stored
   (Sky is always curt). The voice is chosen when the message is pushed, so the save keeps the sentence; the language
   is still resolved at render. A key without variants is used as is. */
const CC_VOICES=4;
function ccVoiceOf(handle){
  return (ccHashStr('voice|'+String(handle||''))%CC_VOICES)+1;
}
/* A club's line, said by whoever is actually saying it.

   His rule, 18 August: all of it through the manager. The name and the face on
   a relayed thread were already his — see careerOrgDm — but the words were still
   the club's, so a wage came back as "we will see you soon" from a man who is
   not the club. Every line a club sends has an agent-voiced twin; where one
   exists it is used on a relayed thread, and where it does not the club's own
   line stands, so nothing has to be written twice to keep working. */
function ccOrgSay(t, key, args){
  const relayed=!!(t && t.who && t.who.viaAgent);
  const alt=key+'Agent';
  careerDmPush(t, 'them', relayed && L()[alt] ? alt : key, args);
}
function careerDmPush(t, from, key, args){
  const cr=CAREER.career;
  // Their line in their own voice. Only what they say - the player's own
  // messages are the player's, and there is only one of them.
  let k=key;
  if(from==='them' && t && t.who){
    const v=ccVoiceOf(t.who.handle);
    if(L()[key+v]) k=key+v;
  }
  // And in the season's own words: a trio year does not ask anybody to duo. The
  // voice is chosen first, so a duo season keeps all four of them. See ccSquadKey.
  k=ccSquadKey(k, t && t.fmt);
  /* Годы без дивизионов (2019–2021 и 2022 до осени, ccNoDivisions) — реплики без слова «дивизион»
     (его скрин 1.10, 2019: «я 71 и играю в Дивизионе 1»). Вариант с хвостом Nd, где он есть. */
  try{ if(typeof ccNoDivisions==='function' && ccNoDivisions() && L()[k+'Nd']) k=k+'Nd'; }catch(e){}
  const msg={from, k:k, a:args||[], season:cr.season, day:careerToday()};
  // Стафф написал — у ветки открыты варианты ответа (ccStaffReply), как у тиммейта.
  if(from==='them' && t && t.who && t.who.staff && CC_STAFF_OPTS[t.who.staff] && !/^dmStHi_/.test(key)) t.ask={key:key, day:careerToday()};
  // Вариант реплики — жребий от переписки и дня, одинаковый у обоих в командной игре (см. ccText).
  if(from==='them') msg.vi=ccHashStr((t.id||(t.who && t.who.handle)||'')+'|'+t.msgs.length+'|'+k+'|'+careerToday())%997;
  t.msgs.push(msg);
  /* Unread means you have not seen it, and a conversation open on the screen has
     been seen. Their answer used to raise the badge under the player's own eyes:
     you wrote a line, they replied in the same thread you were reading, and it
     came back marked new. The only way to clear it was to close the conversation
     and open it again — after every single message. Reported by a tester on
     18 August, and it is the same rule careerOpenNote already applies from the
     other side. */
  const watching = CH_TAB==='social' && CH_SOCIAL==='dms' && CH_DM===t.id;
  if(from==='them' && !watching) t.unread=true;
}

// The messages that arrive on their own. Each one is tied to the thing that
// caused it, which is why they are built here, right after a cup, rather than
// dealt out at random when the screen opens.
/* Somebody else wants your partner. Decided by patience, the number the duo already runs on: happy says no,
   unhappy goes. Only after a night worth poaching, and only for a partner rated where a club or better duo would
   look. The message comes from the partner. */
const CC_POACH_SAFE=70;      // patience at or above this and they stay
// Шанс перехвата за удачный вечер. Было 0.35; отзыв: «10 % шанс» — годовая проба
// теряла напарника у пятерых из шести, и это читалось как правило, а не как событие.
const CC_POACH_ODDS=0.10;
/* A slot belongs to the pair that won it.

   His rule, 17 August: if the two of you qualified for a LAN or for a Major's
   Heats, you cannot split up - the seat is the duo's and it has to be played
   out. Which is how the real thing works and is the one obligation this mode was
   missing: a partner could be poached out from under a Major ticket, or walk on
   a Tuesday holding half a LAN seat, and the career would arrive at the biggest
   night of its year alone.

   Every live commitment, and only live ones. A Major that has already played its
   Final is not a commitment, and neither is a Reload cup that has ended - what
   locks the duo is a stage still to come that the pair of them are already in.

   Returns what the pair are committed to, for the sentence that says why. */
function careerSlotHeld(){
  const cr=CAREER.career;
  const m=cr.major;
  // Through the Play-In, out of the Heats, or through the Last Chance: all of
  // them are a place in a Major that has not finished.
  /* A place in a Major, not a Major you turned up to.

     His screenshot: Division 4, told he was holding a slot at Major 2 and that
     his duo could not change because of it. He had played the Last Chance -
     the one stage open to every division - and gone out of it. What commits a
     duo is a stage still ahead of them that they have already come through, or
     a ticket to the Final. */
  const gone=k=>(cr.gaveUp||[]).indexOf(k)>=0;
  // Keyed to the tournament, not to the word: giving up Major 1's seat says
  // nothing about Major 2, which has not been played yet.
  if(m && m.n && !gone('major:'+m.n) && (m.ticket || (m.pass && m.pass!=='final')))
    return {key:'major:'+m.n, what:L().ccSlotMajor(m.n)};
  // A seat at the Summit, until the Summit is played out.
  if(!gone('lan') && ccSummitSeat() && (cr.summit||{}).got!=='final')
    return {key:'lan', what:L().ccSlotLan};
  // The Reload circuit, inside a cup that is still running.
  if(cr.reload && cr.reload.got && cr.reload.got!=='final' &&
     !gone('reload:'+cr.reload.series))
    return {key:'reload:'+cr.reload.series, what:L().ccSlotReload(cr.reload.series)};
  // And the Global Championship, once you are in it.
  if(!gone('gc') && cr.gclc && cr.gclc.through && !cr.gclc.done)
    return {key:'gc', what:L().ccSlotGc};
  // The one every other seat leads to. Held until it has been played.
  if(!gone('rc') && cr.rc && cr.rc.ticket && (cr.rc.got!=='final'))
    return {key:'rc', what:L().ccSlotRc};
  if(!gone('globals') && !cr.globals && ccGlobalsSeat())
    return {key:'globals', what:L().ccSlotGlobals};
  return null;
}
/* Куда именно квалифицировался — на календаре и на карточке дня.

   careerSlotHeld знает, что место есть, и умеет его назвать. Но названо оно
   было только там, где место ТЕРЯЮТ: в предупреждениях. Пока ничего не рвёшь,
   узнать, что впереди уже занятое тобой место, было неоткуда.

   Правка: «можно ещё написать где-то в карьере, куда
   квальнулись, и в календаре цветом пометить».

   Ключ места переводится в идентификаторы дней года. Мейджор, Саммит и Релоад
   опознаются приставкой (у каждого несколько этапов), а три ЛАНа — точным
   именем: GlobalChampionship и GlobalChampionshipLastChance начинаются
   одинаково, и приставка спутала бы их между собой. */
function ccQualIds(key){
  const k=String(key||'');
  const m=k.match(/^major:(\d+)$/);
  if(m) return {pre:'Major'+m[1]+'_'};
  if(k==='lan') return {pre:'Summit_'};
  const r=k.match(/^reload:(\d+)$/);
  if(r) return {pre:'ReloadEliteSeries'+r[1]};
  if(k==='gc') return {id:'GlobalChampionshipLastChance'};
  if(k==='rc') return {id:'ReloadChampionshipParis'};
  if(k==='globals') return {id:'GlobalChampionship'};
  return null;
}
// Принадлежит ли эта строка календаря тому месту, которое сейчас держится.
function ccQualOn(e){
  const held=careerSlotHeld();
  if(!held || !e) return false;
  const m=ccQualIds(held.key);
  if(!m) return false;
  return m.id ? e.id===m.id : String(e.id||'').indexOf(m.pre)===0;
}
// Ближайший впереди день этого события — то, что стоит на карточке рядом с
// названием. Прошедшие этапы не считаются: место ведёт вперёд, а не назад.
/* Строка «ты уже там» на карточке дня.

   Пустая, когда места нет: полоса, которая висит всегда, перестаёт что-либо
   значить. Дата — ближайший впереди день этого события, чтобы было видно не
   только КУДА, но и КОГДА. */
function careerQualHTML(){
  const held=careerSlotHeld();
  if(!held) return '';
  const day=ccQualNextDay();
  return '<div class="ch-qual"><b>'+L().ccQualTag+'</b><span>'+esc(held.what)+
         (day ? ' · '+esc(ccDayLabel(day)) : '')+'</span></div>';
}
function ccQualNextDay(){
  if(!careerSlotHeld()) return null;
  const days=careerYearDays();
  const keys=[...days.keys()].sort();
  const today=careerToday();
  for(let i=0;i<keys.length;i++)
    if(keys[i]>=today && (days.get(keys[i])||[]).some(ccQualOn)) return keys[i];
  return null;
}
/* Giving it up, which is the other half of his rule.

   17 August: let the player change partner anyway, and then the slot goes to the
   team below and is taken off the player. That is better than the lock I wrote
   first, and it is what actually happens - a qualification belongs to the pair
   that won it, so breaking the pair forfeits it and the next duo in the standings
   moves up into the seat.

   Recorded rather than deleted: the result that won the seat is still in the log
   and still true, so what is stored is that the pair gave the seat up. */
function careerSlotGiveUp(mate){
  const cr=CAREER.career, held=careerSlotHeld();
  if(!held) return null;
  cr.gaveUp=(cr.gaveUp||[]).concat([held.key]);
  careerEvent('tlSlotGone', [held.what]);
  return held;
}
function careerMatePoach(place, of, passed){
  const cr=CAREER.career;
  // Whichever seat is likeliest to go, not chair one. See ccMateAtRisk.
  const risk=ccMateAtRisk();
  const mate=risk && risk.card;
  if(!mate || !(of>1)) return null;
  // Nobody takes half of a qualified duo: the seat is the pair's and the pair
  // has to play it out. See careerSlotHeld.
  if(careerSlotHeld()) return null;
  // И никто не хантит того, кто только что пересёк океан за свои — точнее, за
  // твои. См. ccMateStays.
  if(ccMateStays(risk.rec)) return null;
  const beat=1-(place-1)/(of-1);
  if(!(place<=3 || (passed && beat>=0.8))) return null;
  const rnd=careerRng(ccHashStr('poach|'+cr.season+'|'+careerToday()+'|'+place));
  if(rnd()>=CC_POACH_ODDS) return null;
  const t=careerDmFind(mate.handle) || careerDmThread({
    handle:mate.handle, ovr:(mate._ovr!=null?mate._ovr:(attrsFor(mate)||{}).ovr),
    nat:mate.nat, role:attrsFor(mate).roleKey, roster:true, cardRegion:mate.region,
    club:mate.org||null, pay:ccPlayerPay(mate)});
  // Their own patience, which is the seat's rather than the squad's.
  const patience=risk.patience;
  const stays=patience>=CC_POACH_SAFE;
  // Чуть не хватило — он не уходит молча, а говорит тебе (раз в сезон, только напарник с перепиской).
  if(!stays && patience>=CC_POACH_SAFE-CC_HEADSUP_BAND && risk.rec && risk.rec.headsUp!==cr.season && !ccMpOn() &&
     careerPartnerCard() && hKey(careerPartnerCard().handle)===hKey(mate.handle)){
    risk.rec.headsUp=cr.season;
    careerDmPush(t, 'them', 'dmHeadsUp', [place]);
    t.state='headsup'; t.headsPlace=place;
    careerSave();
    return t;
  }
  careerDmPush(t, 'them', stays ? 'dmMatePoachStay' : 'dmMatePoachGo', [place]);
  if(!stays){
    careerMateDrop(mate.handle);
    t.state='declined';
    // The day they walked, kept on the thread. Without it the conversation had
    // no memory of its own ending: a duo poached away on the Tuesday answered
    // "free, when do we play" on the Thursday, in the same thread, two lines
    // under "I am leaving, thanks for the games". His report, 18 August.
    t.left=careerToday();
    careerNews('bad', 'ccNewsMateLeftFor', [mate.handle]);
    careerEvent('tlDuoPoached', [mate.handle]);
  }
  careerSave();
  return t;
}
/* Messages from your duo partner after a night, driven by patience:
     happy       says something good, +a couple of points;
     unhappy     complains, no cost, just a warning;
     nearly out  says he's thinking of playing with someone else, and you can answer.
   Otherwise the seat emptied silently between cups. */
const CC_MATE_HAPPY=70, CC_MATE_CROSS=38;
function careerMateDm(place, of, passed){
  const cr=CAREER.career;
  // The seat with something to say, which in a trio is not always the first.
  const risk=ccMateAtRisk();
  const mate=risk && risk.card;
  if(!mate || !(of>1)) return null;
  const pr=risk.rec;
  const p=risk.patience;
  const beat=1-(place-1)/(of-1);
  const rnd=careerRng(ccHashStr('mate|'+cr.season+'|'+careerToday()+'|'+place));
  // Not every night is worth a message. A good one from a happy partner and a
  // bad one from an unhappy partner are; the middle is people getting on with it.
  // An unhappy partner holding half a Major seat is still unhappy, and still
  // there: they can say the bad-night line, they cannot say they are leaving.
  const held=careerSlotHeld();
  const kind = (p<CAREER_PATIENCE_QUIT+10 && !held && !ccMateStays(pr)) ? 'leaving'
             : p>=CC_MATE_HAPPY && beat>=0.6 ? 'good'
             : (p<=CC_MATE_CROSS && beat<0.4) || ((held || ccMateStays(pr)) && p<CAREER_PATIENCE_QUIT+10) ? 'bad' : null;
  if(!kind) return null;
  if(kind!=='leaving' && rnd()>=0.55) return null;
  const t=careerDmFind(mate.handle) || careerDmThread({
    handle:mate.handle, ovr:(mate._ovr!=null?mate._ovr:(attrsFor(mate)||{}).ovr),
    nat:mate.nat, role:attrsFor(mate).roleKey, roster:mate.tier!=='ladder',
    cardRegion:mate.region, club:mate.org||null, pay:ccPlayerPay(mate)});
  if(kind==='good'){
    careerDmPush(t, 'them', 'dmMateGood', [place]);
    pr.patience=clamp(p+2, 0, 100);
  } else if(kind==='bad'){
    careerDmPush(t, 'them', 'dmMateBad', [place, of]);
  } else {
    // The one that is a decision. Said once: the flag is cleared the moment the
    // duo is repaired or the moment he goes.
    if(t.state==='leaving') return t;
    careerDmPush(t, 'them', 'dmMateLeaving');
    t.state='leaving'; t.kept={};
  }
  careerSave();
  return t;
}
/* Talking him round, and what each answer costs.

   Three things, and they are the three a real duo argues about: a promise, the
   role, and money. The promise is free and worth the least. The role is the
   expensive one - it rebuilds your six numbers - and the bootcamp is the first
   thing in this mode that money can fix rather than buy.

   One of each, and they stack: a partner far enough gone needs more than one.
   If patience clears the line he stays; if it runs out of arguments before it
   does, he goes, and there is nothing left to say because you have said it. */
// Роль отсюда ушла вместе с самим предложением: её меняет игрок и только
// себе, кнопкой в профиле. См. careerRoleSwap.
const CC_MATE_KEEP={promise:10, camp:22};
const CC_MATE_CAMP_COST=1000;
function careerMateKeepable(t){
  if(!t || t.state!=='leaving') return [];
  const kept=t.kept||{};
  const out=[];
  if(!kept.promise) out.push('promise');
  /* Роль сюда больше не входит — правило: свою половину игры
     карьера меняет сама, кнопкой в профиле, и не потому, что кто-то собрался
     уходить. Уговаривают обещанием и сборами; пересаживаться — это решение, а
     не уступка. См. careerRoleSwap. */
  if(!kept.camp && (CAREER.career.balance||0)>=CC_MATE_CAMP_COST) out.push('camp');
  return out;
}
function careerMateKeep(id, how){
  const t=careerDms().find(x=>x.id===id);
  if(!t || careerMateKeepable(t).indexOf(how)<0) return;
  const cr=CAREER.career;
  t.kept=t.kept||{}; t.kept[how]=true;
  if(how==='promise') careerDmPush(t, 'you', 'dmKeepPromise');
  else {
    cr.balance-=CC_MATE_CAMP_COST;
    CAREER.stays=CAREER.stays||{};
    CAREER.stays.camp={from:careerToday(), until:ccAddDays(careerToday(), 30)};
    careerDmPush(t, 'you', 'dmKeepCamp', [ccNum(CC_MATE_CAMP_COST)]);
  }
  if(careerMateRec()) careerMateRec().patience=clamp(careerPatience()+CC_MATE_KEEP[how], 0, 100);
  if(careerPatience()>=CAREER_PATIENCE_QUIT+14){
    careerDmPush(t, 'them', 'dmKeepStay');
    t.state='partner';
  } else if(!careerMateKeepable(t).length){
    careerDmPush(t, 'them', 'dmKeepGo');
    t.state='declined';
    // Same as the poach: the thread remembers the day it ended. See careerMatePoach.
    t.left=careerToday();
    careerMateDrop(t.who.handle);
    careerRepAdd(-1);
    careerNews('bad', 'ccNewsMateLeftFor', [t.who.handle]);
  } else careerDmPush(t, 'them', 'dmKeepMaybe');
  careerSave();
  careerRenderHub('social');
}
function careerDmInbound(place, total, passed, from){
  const cr=CAREER.career;
  // The room writes first: neither a fan letter nor a hater is an offer, and
  // neither uses up the one player approach a night can carry. A bad night can
  // now bring both, which is what a bad night is actually like - the people
  // telling you so and the people telling you they are still watching.
  careerFanDm(place, total, passed);
  careerHaterDm(place, total, passed);
  // And a good one can bring back somebody who was loud after the last bad one.
  careerHaterTurn(place, total);
  // And the seat beside you, which is the one thing on this screen that can be
  // taken from you rather than offered to you.
  careerMatePoach(place, total, passed);
  try{ careerMatePlanAfter(); }catch(e){}
  // And the one sitting next to you, who has more to say than anybody.
  careerMateDm(place, total, passed);
  /* Who writes to you, and the door that was shut.

     This only ever asked people who would have said yes to you — so the inbox
     could never do anything the player could not already do by writing first,
     and somebody better than you never appeared in it at all.

     Somebody above your level writing first is the whole point of an inbox:
     they have already decided, and it is the one way up that does not depend on
     you being good enough to ask. It is earned rather than free — the better
     the night, the further up it reaches — and it is still their message, so
     the reach rule does not get a second vote on it. */
  const pool=careerDmPool();
  const mine=pool.filter(w=>careerDmWouldAccept(w));
  const beat=total>1 ? 1-(place-1)/(total-1) : 0;
  // A title reaches eight points above you, a podium six, a cut three, and an
  // ordinary night none. Nobody is watching a mid-table Tuesday.
  const up = place===1 ? 8 : place<=3 ? 6 : passed ? 3 : beat>=0.9 ? 2 : 0;
  const above=up ? pool.filter(w=>!careerDmWouldAccept(w) &&
                                  w.ovr>CAREER.player.ovr &&
                                  w.ovr<=CAREER.player.ovr+up) : [];
  // The seed is the night, so the same result does not reroll on a redraw.
  const rnd=careerRng(ccHashStr('up|'+cr.season+'|'+careerToday()+'|'+place));
  const reachUp = above.length && rnd()<clamp(0.15+beat*0.5, 0, 0.65);
  const pool2 = reachUp ? above : mine;
  if(!pool2.length) return;
  const pick=pool2[0];
  let line=null;
  // Who writes, and why — the answer has to be in the message. A free agent
  // writes to a player with an empty seat; a player with a duo only hears from
  // somebody after a podium, and that somebody says who they are and what they
  // saw, because "I am free" from a stranger to a full duo read as noise.
  if(!careerMateRec()) line=(passed && from>1) ? ['dmPromoted', [from-1, pick.ovr]]
                                              : ['dmNoPartner', [pick.ovr]];
  else if(place<=3) line=['dmProps', [place, total]];
  // Somebody above you writing first is an offer whoever they are: they opened
  // the conversation, so the reach rule has already been answered and does not
  // get to refuse them at the button.
  // Unless you are standing on a podium with a partner, where it is the same
  // recruitment in a better suit.
  if(reachUp && !(careerMateRec() && place<=3)) line=['dmReachUp', [pick.ovr, place]];
  if(!line) return;
  const t=careerDmFind(pick.handle) || careerDmThread(pick);
  careerDmPush(t, 'them', line[0], line[1]);
  // An offer is an offer whoever sent it. Somebody free writing to an empty seat
  // has already answered the only question the button asks, and making them
  // wait for you to write back and then for them to think it over is asking it
  // twice — see careerSeatDm.
  if(line[0]!=='dmProps' && (reachUp || (!careerMateRec() && !careerDmMateOf(pick))))
    t.state='offer';
  careerSave();
}

/* Free players offer you a seat first (one press to accept), since an empty seat can't enter a cup
   (careerNoMate). Same gate as writing first: no duo of their own, would say yes anyway
   (careerDmMargin), nobody above your reach. The role you don't cover comes first: buildTeam gives
   +4 team power for both roles, and two IGLs placed 99th of 150 at band.
   Three open at once, one new per day. */
const CC_SEAT_DMS=3;
// How long a "no" stands before the person will hear you out again.
const CC_ASK_AGAIN_DAYS=14;
/* LFD post. While it stands, careerDmMargin's line moves by 3, the same as CAREER_DM_REACH, so it is worth
   exactly one reach. Lasts a week. Only allowed with the seat empty. */
const CC_LFD_DAYS=7, CC_LFD_REACH=CAREER_DM_REACH;
function careerLfdUntil(){
  const d=CAREER && CAREER.career && CAREER.career.lfd;
  return d ? ccAddDays(d, CC_LFD_DAYS) : null;
}
function careerLfdOn(){
  const u=careerLfdUntil();
  return !!u && u>=careerToday() && !careerPartnerCard();
}
function careerLfdPost(){
  if(!CAREER || careerPartnerCard() || careerLfdOn()) return;
  const cr=CAREER.career;
  cr.lfd=careerToday();
  careerNews('good', 'ccNewsLfd', [cr.division, (typeof ccMyShownOvr==='function' ? Math.round(ccMyShownOvr()) : CAREER.player.ovr)]);
  // Somebody is reading it the same evening.
  careerSeatDm('lfd|'+careerToday());
  careerSave();
  careerRenderHub('social');
}
function careerSeatDmOpen(){
  return careerDms().filter(t=>t.state==='offer' && !t.who.org && !t.who.brand).length;
}
/* Тот, чья пара уже выиграла место на ЛАНе, — не кандидат ни на какое кресло.

   Место в Дюссельдорфе принадлежит паре, и увести половину такой пары в июне
   значит стереть её оттуда: пятнадцать мест с Саммита на Глобалах становились
   четырнадцатью. careerMatePoach запрещает это в обратную сторону, и здесь то
   же правило с той же стороны.

   Одним списком, потому что спрашивают в двух местах — кого держать в инбоксе
   и кому писать, — а расходиться эти два ответа не должны. */
function ccLanLocked(){
  const s=new Set();
  /* Места Саммита — сыгранного в этой карьере (summitSeed.gc или симуляция ccLanSummitSim), а не настоящий
     список GC_SUMMIT_DUOS (его слово 12.10: «все турниры от симуляции»). Саммит ещё не сыгран — мест нет. */
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  const sum=(typeof ccSummitCarry==='function') ? ccSummitCarry() : null;
  const sim=(cr && cr.lanSim && cr.lanSim.season===cr.season && cr.lanSim['summit|all']) || null;
  const rows=(sum && Array.isArray(sum.gc) && sum.gc.length) ? sum.gc
           : sim ? sim.slice(0, ccTeams(SUMMIT_GC_SLOTS)).map(p=>{ const q=String(p); return ccLanSimUnpack(q.slice(q.indexOf('#')+1), null); }) : [];
  rows.forEach(r=>{ if(Array.isArray(r)) r.forEach(x=>{ const h=(x && x.h) || x; if(h) s.add(hKey({handle:h})); }); });
  return s;
}
/* Соль карьеры: то, чем один сейв отличается от другого при одинаковых входных
   данных.

   Просьба игрока (через него): «чтобы при создании новой карьеры не
   одни и те же каждый раз предлагали дуо, а менялись первые тиммейты с
   предложением». Так и было: бросок в careerSeatDm сеялся сезоном и днём, а у
   новой карьеры это всегда сезон 1 и один и тот же стартовый день — значит и
   первые три письма всегда от одних и тех же людей.

   Соль ставится ОДИН РАЗ при создании и живёт в сейве, поэтому внутри карьеры
   ничего не пляшет: перезагрузка отдаёт тот же инбокс. Старый сейв соли не
   имеет — ему достаётся ник, он тоже свой и тоже не меняется. */
function ccCareerSeed(){
  const cr=CAREER && CAREER.career;
  if(!cr) return '';
  if(!cr.seed) cr.seed=String((CAREER.player && CAREER.player.nick) || 'x');
  return cr.seed;
}
/* Чем человек хвастается, когда пишет про место. Отзыв:
   «когда игрок пишет о результатах в лс, пусть там будут результаты с крупных
   турниров, с ЛАНов и т.д., или див-капы — смотря какой лучший в прошлом
   сезоне». Читается в этом порядке:
     1) прошлый сезон карьеры — архив (careerArchiveFinal): Мировой, Саммит,
        Париж, Мейджоры своего региона — строка с его ником, лучший турнир;
     2) настоящая карточка ростера — её опубликованные результаты (PLAYERS):
        Мировой > ЛАН > Мейджор, потом место;
     3) игрок лестницы — кубок своего дивизиона: место от силы против полосы
        дивизиона, с посеянным разбросом (сезон и ник), чтобы не менялось
        от письма к письму. */
function ccDmResumeRank(ev){
  const e=String(ev||'');
  const tier = /Global|Мировой/i.test(e) ? 0
             : /Summit|Саммит|Invitational|LAN|Reload Championship/i.test(e) ? 1
             : /Major|Мейджор/i.test(e) ? 2 : 3;
  // Внутри турнира финал выше хитов, хиты выше плей-ина: «топ-6 плей-ина»
  // не должен перебивать «топ-20 гранд-финала».
  const stage = /Grand Finals|Гранд/i.test(e) ? 0 : /Heats|Хиты/i.test(e) ? 1 : /Play-?In|Плей-ин/i.test(e) ? 2 : 0;
  return tier*10+stage;
}
function ccDmResume(who){
  if(!who || !who.handle) return null;
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const hk=hKey({handle:who.handle});
  const inRow=name=>String(name||'').split(' & ').some(n=>hKey({handle:n.trim()})===hk);
  // 1. Архив прошлого сезона.
  if((cr.season||1)>1 && typeof careerArchiveFinal==='function'){
    const sn=cr.season-1, reg=ccCareerRegion();
    const keys=['g|gc','g|summit','g|rc','m|1|'+reg,'m|2|'+reg,'m|3|'+reg];
    let best=null;
    keys.forEach((key, i)=>{
      let tbl=null; try{ tbl=careerArchiveFinal(sn, key); }catch(e){ tbl=null; }
      if(!tbl || !tbl.rows) return;
      const row=tbl.rows.find(r=>inRow(r.name));
      if(!row) return;
      const rank=i<3 ? i : 3;
      if(!best || rank<best.rank || (rank===best.rank && row.p<best.place))
        best={rank:rank, ev:tbl.cap, place:row.p};
    });
    if(best) return {ev:best.ev, place:best.place};
  }
  // 2. Настоящая карточка: опубликованные результаты.
  if(who.roster && typeof PLAYERS!=='undefined'){
    const mine=(ccCardsByKey().get(hk)||[]).filter(p=>p.placement>0);
    const pick=list=>list.slice().sort((a,b)=>ccDmResumeRank(a.event)-ccDmResumeRank(b.event) || a.placement-b.placement)[0];
    const fresh=mine.filter(p=>/2026/.test(String(p.event||'')+' '+String(p.date||'')));
    const b=pick(fresh.length ? fresh : mine);
    if(b) return {ev:String(b.event||'').replace(/\s*\(.*\)\s*$/, ''), place:b.placement};
  }
  // 3. Лестница — кубок дивизиона.
  const div=cr.division||5;
  const rnd=careerRng(ccHashStr('rec|'+who.handle+'|'+(cr.season||1)));
  const edge=(Number(who.ovr)||0)-ccBand(div);
  const place=clamp(Math.round(4-edge/2+rnd()*4), 1, 12);
  return {div:div, place:place};
}
function ccDmSeatResume(t, who){
  const r=ccDmResume(who);
  if(!r) return;
  if(r.ev) careerDmPush(t, 'them', 'dmSeatRec', [r.ev, r.place]);
  else careerDmPush(t, 'them', 'dmSeatRecDiv', [r.div, r.place]);
}
function careerSeatDm(tag){
  if(!CAREER || !CAREER.career) return false;
  /* В командной карьере кресло напарника ботам не отдаём: у двоих разошёлся бы состав (сила, синергия, роли),
     и вечер развалился бы на первой игре. Все письма про кресло проходят здесь (careerSeatDms, careerSeatTopUp).
     Исключение трио: третье кресло можно взять. Пишут владельцу лобби, садится третий только с согласия
     напарника (ccMpThirdAsk), запись едет обоим (CC_TEAM_KEYS.mates). Второму такие письма не шлём. */
  if(ccMpOn()){
    if((CAREER.career.mp.role||'a')!=='a') return false;
    if(ccMpMateRecs().length >= ccMpBotSeats()) return false;
  }
  // Full, not merely seated: a trio with one chair open is still short a person.
  if(careerMates().length >= careerMateSeats()) return false;
  // A post that stands brings more people in than a quiet week does — otherwise
  // a career already holding three hellos gets nothing at all for posting.
  const lfd=careerLfdOn();
  // The ceiling is per empty chair. Held at three for the whole career it meant a
  // trio short of two people heard exactly as much as a duo short of one, and the
  // second chair could sit empty behind a full inbox about the first.
  const chairs=Math.max(1, careerMateSeats()-careerMates().length);
  if(careerSeatDmOpen() >= chairs*(lfd ? CC_SEAT_DMS+2 : CC_SEAT_DMS)) return false;
  /* Who would come, which careerDmMargin already answers: somebody standing in
     a duo whose season is going fine is -99 and never appears here, so "would
     accept" is the same thing as "is available" and asking both would be asking
     twice. It matters most in Division 1, where 887 of the 901 people on the
     roster are in a recorded pair — filter to free agents there and a career
     that lost its partner hears from nobody at all, which is the one thing this
     must never do now that an empty seat cannot enter a tournament. */
  // And the post moves that line by one reach while it stands.
  const line=lfd ? -CC_LFD_REACH : 0;
  const rnd=careerRng(ccHashStr('seat|'+ccWorldSeed()+'|'+CAREER.career.season+'|'+tag));
  /* Somebody the rung does not hold, reading a post.

     Below Division 1 the week's list is generated and capped at the band of the
     division above — his rule, and the reason a post changed nothing there when
     it only moved the acceptance line: everybody in the list was already under
     it, so the button did nothing at all. Measured over twenty careers at 66 in
     Division 4: not one offer above the reach, posted or quiet.

     A post is read outside your rung, so it draws its own reader — one reach
     above what the list can hold, never further, and never past the ceiling
     nothing generated may cross. That is the whole of what it buys. */
  if(lfd && !ccRealNamesHere() && rnd()<0.5){
    const div=CAREER.career.division;
    const top=Math.min(ccGenTop(), ccDivCeil(div)+CC_LFD_REACH);
    const ovr=clamp(Math.round(CAREER.player.ovr+CAREER_DM_REACH+1+rnd()*CC_LFD_REACH), 35, top);
    if(ovr>CAREER.player.ovr+CAREER_DM_REACH){
      const card=careerLadderPlayer(rnd, ovr, new Set(careerDms().map(t=>hKey(t.who.handle))),
                                    null, ccSquadRoleWanted());
      const who={handle:card.handle, ovr:ovr, nat:card.nat, role:attrsFor(card).roleKey,
                 roster:false, card:card, club:null, pay:0};
      const t=careerDmThread(who);
      careerDmPush(t, 'them', 'dmLfd', [ovr]);
      ccDmSeatResume(t, who);
      t.state='offer';
      return true;
    }
  }
  // Blocked stays blocked: no thread, no fresh hello. See careerDmBlock.
  const open=careerDmPool().filter(w=>!ccBlocked(w.handle) &&
                                      !careerDmFind(w.handle) && careerDmMargin(w)>=line);
  if(!open.length) return false;
  const me=careerCard();
  /* И пишет тот, кого можно посадить: команде нужен ровно один ИГЛ, а место,
     предложенное второму, — это место, которого нет. Предложить его и потом не
     дать принять хуже, чем не предлагать: инбокс тише, но в нём нет кнопок,
     которые не работают. Написать такому человеку самому по-прежнему можно —
     см. careerDuoSearchPool и аргумент про роль в careerDmArgs. */
  const want = ccSquadRoleWanted();
  let use = want ? open.filter(w=>w.role===want) : open;
  /* Если нужной роли среди свободных нет, пишет всё равно кто-то: карьера без напарника
     не должна остаться без предложений. Уступает доступность, а не роль: человек из чужого дуо
     пишет строкой dmSeatSour. Без этого после записанных пар финалов недели в Д1 почти все ИГЛы
     оказались «в дуо», margin ушёл ниже нуля, и дуо-предложения пропали совсем. */
  /* Если свободных нужной роли нет вовсе, пишет тот, кого можно уговорить: careerDmMargin отвечает про
     пустое кресло числом (см. careerDmArgs), а карьера с пустым креслом в турнир не заходит.
     Кроме тех, чья пара выиграла место на ЛАНе: место у пары, и это то же, что запрещает careerMatePoach.
     Без этого уводили чемпиона Саммита и мест на Глобалах становилось 14 вместо 15 (check-career-globals). */
  if(!use.length && want){
    const lan=ccLanLocked();
    use = careerDmPool()
      .filter(w=>!ccBlocked(w.handle) && !careerDmFind(w.handle) &&
                 w.role===want && !lan.has(hKey(w.handle)))
      .sort((a,b)=>careerDmMargin(b)-careerDmMargin(a))
      .slice(0, 2);
  }

  if(!use.length) return false;
  /* The ones with an empty seat write before the ones leaving somebody, and the
     one who plays the half you do not writes before the one who plays yours.

     While the post stands, the one furthest above you writes first — that is
     what it was posted for, and a post that keeps producing the same 54 the
     quiet week already produced is a button that does nothing. */
  const rank=w=>(careerDmMateOf(w)?2:0)+(w.role===want?0:1)+
                (lfd ? Math.max(0, Math.round(careerDmMargin(w)))*4 : 0);
  const best=Math.min.apply(null, use.map(rank));
  const from=use.filter(w=>rank(w)===best);
  const pick=from[Math.floor(rnd()*from.length)];
  const mate=careerDmMateOf(pick);
  const t=careerDmThread(pick);
  /* What they say is why they are writing: somebody who read the post says so,
     a free agent is free, and somebody leaving a pair says whose. The post's
     own line is used for the people it actually reached — anybody the reach
     would have refused — so a career that posted still hears the ordinary
     hello from the ordinary free agent. */
  if(lfd && careerDmMargin(pick)<0) careerDmPush(t, 'them', 'dmLfd', [pick.ovr]);
  else if(mate) careerDmPush(t, 'them', 'dmSeatSour', [pick.ovr, mate.handle]);
  else          careerDmPush(t, 'them', 'dmNoPartner', [pick.ovr]);
  ccDmSeatResume(t, pick);
  t.state='offer';
  return true;
}
// Every day a career moves through brings one, up to the three that stand at
// once — a week skipped is not a week nobody wrote in.
/* ИЩУТ СОСТАВ НА КАП ДРУГОГО ФОРМАТА (идея игрока 30.09: «игроки могли бы сами связываться, когда ищут
   тиммейта — дуо ищет третьего на трио»). За неделю до ближайшего трио/сквад/дуо-капа, пока состав этого
   формата не полон, раз в день пишет кто-то своего уровня: свободный — «сыграем?», а стоящая пара — «мы
   вдвоём, нужен третий» (согласился — садятся оба, t.fmtPair). Садятся в состав формата (t.fmt,
   CAREER.rosters), состав года не трогается. В игре вдвоём — нет: состав формата общий, решает пара. */
const CC_FMT_DMS=2;
function ccFmtWord(f){ return String(({2:L().lfRosterDuo, 3:L().lfRosterTrio, 4:L().lfRosterSquad})[f]||'').toLowerCase(); }
function careerFmtSeatDms(fromISO, toISO){
  if(!CAREER || !CAREER.career || !CAREER.player) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  if(!ccRealNamesHere()) return;
  const cur=careerSquadSize();
  const NAME={2:L().lfRosterDuo, 3:L().lfRosterTrio, 4:L().lfRosterSquad};
  for(let d=ccAddDays(fromISO,1); d<=toISO; d=ccAddDays(d,1)){
    [2,3,4].forEach(f=>{
      if(f===cur) return;
      const next=ccFormatNext(f);
      if(!next || ccDaysBetween(d, next)>CC_ROSTER_WEEK || ccDaysBetween(d, next)<0) return;
      const have=ccFmtRoster(f).length;
      if(have>=f-1) return;
      if(careerDms().filter(t=>t.fmt===f && t.state==='offer').length>=CC_FMT_DMS) return;
      const rnd=careerRng(ccHashStr('fmtseat|'+ccWorldSeed()+'|'+d+'|'+f));
      const me=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
      const reg0=CC_DUO_REG; CC_DUO_REG='';   // свой регион, а не тот, что оставлен в поиске
      let pool0=[]; try{ pool0=careerDuoSearchPool(true); } finally { CC_DUO_REG=reg0; }
      // Уже написавший вторым в паре (t.fmtPair) и уже сидящий в составе формата — не пишут ещё раз.
      const busy=new Set(careerDms().map(t=>t.fmtPair).filter(Boolean).map(hKey)
        .concat(ccFmtRoster(f).concat(CAREER.partners||[]).map(r=>{ const c=r && ccMateCardOf(r); return c ? hKey(c.handle) : ''; })));
      const pool=pool0.filter(w=>w && w.handle && w.ovr>=me-6 && w.ovr<=me+2 &&
        !busy.has(hKey(w.handle)) && !ccBlocked(w.handle) && !careerDmFind(w.handle));
      if(!pool.length) return;
      const pick=pool[Math.floor(rnd()*pool.length)];
      const mate=(f-1-have>=2 && f>2) ? ccPairMateOf(pick.handle) : null;
      const mateOk=mate && mate.handle && !careerDmFind(mate.handle) && !ccMyPeople().has(hKey(mate.handle));
      const t=careerDmThread(pick);
      t.fmt=f; t.seat=null;
      const word=String(NAME[f]||'').toLowerCase(), when=ccDayLabel(next);
      if(mateOk){ t.fmtPair=mate.handle; careerDmPush(t, 'them', 'dmFmtPair', ['@'+ccHandle(mate.handle), word, when]); }
      else careerDmPush(t, 'them', 'dmFmtAsk', [word, when]);
      t.state='offer';
    });
  }
}

/* Кнопки медиа справа в полосе вкладок хаба (Notion «20.11», его «сюда медиа добавить, а эти вкладки в другое место,
   вместо красного твич ютуб дискорд»): соцсеть с числом непрочитанного, Twitch, YouTube, Discord - переход сразу в
   свою вкладку. Папки входящих (клубы, игроки, зрители, хейтеры, лента) переехали наверх вкладки соцсети. */
const CC_MQ_ICONS={
  social:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
  streams:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.3 2 3 5.4v13.5h4.6V21h2.6l2.4-2.1h3.7l5-4.9V2H4.3Zm15.2 11.2-2.9 2.8H12l-2.4 2.1V16H5.8V3.8h13.7v9.4ZM16 7.1h-1.8v5.1H16V7.1Zm-4.9 0H9.3v5.1h1.8V7.1Z"/></svg>',
  youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15.1V8.9l5.8 3.1-5.8 3.1Z"/></svg>',
  tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.3 6.2V8.6a7.9 7.9 0 0 0 4.4 1.4V6.7a4.5 4.5 0 0 1-4.4-4.7Z"/></svg>',
  discord:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1a15.7 15.7 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17 17 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3c-.6.3-1.1.6-1.7.8l1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7ZM8.7 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm6.6 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z"/></svg>'
};
function ccMediaQuickHTML(){
  const T=L();
  let n=0; try{ n=careerDms().filter(t=>t.unread).length+careerNewsNew().length; }catch(e){}
  const tab=typeof CH_TAB!=='undefined' ? CH_TAB : '';
  const item=(k, label, badge)=>'<button type="button" class="cc-mq cc-mq-'+k+(tab===k ? ' on' : '')+'" onclick="careerTab(\''+k+'\')" title="'+esc(label)+'" aria-label="'+esc(label)+(badge ? ' ('+badge+')' : '')+'">'+
    CC_MQ_ICONS[k]+'<span>'+esc(label)+'</span>'+(badge ? '<i>'+(badge>99 ? '99+' : badge)+'</i>' : '')+'</button>';
  return '<div class="cc-mq-row">'+item('social', T.chTabSocial, n)+item('streams', 'Twitch', 0)+item('youtube', 'YouTube', 0)+item('tiktok', 'TikTok', 0)+item('discord', 'Discord', 0)+'</div>';
}

/* ===== ТИЛЬТ, СОПЕРНИК СЕЗОНА, ИТОГИ ГОДА (22.11, его «делай» на список «что ещё в карьере») ===== */

/* Тильт: вечер намного хуже ожидания (доля обойдённых ниже ожидаемой на CC_TILT_GAP) ставит тильт, второй такой подряд -
   второй уровень. Сразу минус форма, и пока держится, тренировки дают меньше (ccTrainDayMult). Снимают отдых, разговор,
   войс и игра с друзьями из Discord (careerDoAct), хороший вечер, или он сам проходит через CC_TILT_DAYS. Числа - решение,
   не замер. В команде и гонке не ставится: вечер общий, а тильт свой. */
const CC_TILT_GAP=0.3, CC_TILT_DAYS=3, CC_TILT_FORM=0.3, CC_TILT_TRAIN=0.15;
function ccTilt(){
  const t=CAREER && CAREER.career && CAREER.career.tilt;
  if(!t || !t.lvl) return 0;
  if(ccDaysBetween(t.day, careerToday())>CC_TILT_DAYS) return 0;
  return t.lvl;
}
function ccTiltMult(){ return 1-CC_TILT_TRAIN*ccTilt(); }
function ccTrainDayMult(){ return careerDayGear()*ccTiltMult(); }
function ccTiltAfterNight(place, total, expected){
  if(!CAREER || !CAREER.career || !(total>=10)) return;
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRaceOn==='function' && ccRaceOn())) return;
  const cr=CAREER.career, beat=1-(place-1)/(total-1);
  if(beat>=expected){ if(cr.tilt) delete cr.tilt; return; }
  if(beat>=expected-CC_TILT_GAP) return;
  const lvl=Math.min(2, ccTilt()+1);
  cr.tilt={lvl, day:careerToday()};
  cr.form=clamp((cr.form||0)-CC_TILT_FORM, -CC_FORM_MAX, CC_FORM_MAX);
}
function ccTiltClear(){ const cr=CAREER && CAREER.career; if(cr && cr.tilt) delete cr.tilt; }
function ccTiltNoteHTML(){
  const lvl=ccTilt(); if(!lvl) return '';
  return '<div class="cc-tilt"><b>'+esc(L().tiltTitle(lvl))+'</b><span>'+esc(L().tiltNote(Math.round(CC_TILT_TRAIN*lvl*100)))+'</span></div>';
}

/* Соперник сезона: один игрок твоего региона и уровня (ближайший по рейтингу в ±4, не напарник), выбирается при первом
   взгляде на сезон и держится до конца года. Каждый вечер, где вы оба в таблице, идёт в счёт (первая таблица дня), а
   заметный - постом в ленту. Строка счёта - в составах на Центре. */
const CC_RIVAL_BAND=4;
function ccRival(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  if(cr.rival && cr.rival.s===cr.season) return cr.rival.h ? cr.rival : null;
  let pool=[]; try{ pool=(careerRosterNowEU()||[]).slice(); }catch(e){}
  const me=(CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr)||0;
  const mates=new Set((careerMates()||[]).filter(Boolean).map(c=>hKey(c)));
  const myKey=hKey((CAREER.player.handle||CAREER.player.nick)||'');
  const ovrOf=p=>(p._ovr!=null ? p._ovr : p.rating)||0;
  pool=pool.filter(p=>p && p.handle && !mates.has(hKey(p)) && hKey(p)!==myKey && Math.abs(ovrOf(p)-me)<=CC_RIVAL_BAND);
  if(!pool.length){ cr.rival={s:cr.season, h:null}; return null; }
  pool.sort((a, b)=>Math.abs(ovrOf(a)-me)-Math.abs(ovrOf(b)-me));
  const near=pool.slice(0, 5), r=careerRng(ccHashStr('rival|'+cr.season+'|'+myKey))();
  const p=near[Math.floor(r*near.length)];
  cr.rival={s:cr.season, h:p.handle, w:0, l:0, last:null};
  return cr.rival;
}
function ccRivalAfterTable(ranked){
  if(!CAREER || !CAREER.career || !ranked || ranked.length<10) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const rv=ccRival(); if(!rv) return;
  const day=careerToday(); if(rv.last && rv.last.day===day) return;
  const k=hKey(rv.h);
  let me=-1, him=-1;
  ranked.forEach((t, i)=>{
    if(t.isYou && me<0) me=i;
    if(him<0 && (t.squad||[]).some(c=>c && hKey(c)===k)) him=i;
  });
  if(me<0 || him<0 || me===him) return;
  if(me<him) rv.w=(rv.w||0)+1; else rv.l=(rv.l||0)+1;
  rv.last={day, me:me+1, him:him+1, of:ranked.length};
  // В ленту - когда разница заметная (десять мест и больше) или это первая встреча.
  if(Math.abs(me-him)>=10 || (rv.w+rv.l)===1){
    try{ careerNews(me<him ? 'good' : 'bad', me<him ? 'ccNewsRivalW' : 'ccNewsRivalL', [ccHandle(rv.h), me+1, him+1, rv.w, rv.l]); }catch(e){}
  }
}
function ccRivalHTML(){
  let rv=null; try{ rv=ccRival(); }catch(e){}
  if(!rv) return '';
  const T=L(), last=rv.last;
  return '<div class="ch-ro ch-ro-rival"><em>'+esc(T.rvTitle)+'</em>'+
    '<span class="rv-row"><b>'+esc(ccHandle(rv.h))+'</b><i class="rv-score'+((rv.w||0)>(rv.l||0) ? ' up' : (rv.w||0)<(rv.l||0) ? ' down' : '')+'">'+(rv.w||0)+' : '+(rv.l||0)+'</i></span>'+
    '<small>'+esc(last ? T.rvLast(last.me, last.him) : T.rvNone)+'</small></div>';
}

/* Итоги года: карточки по одной, как Wrapped (кнопка «Итоги года» на «Карьере» и в конце сезона). Всё из журнала сезона
   (cr.log), лички напарников и cr.did: ни одного придуманного числа. */
let CC_WRAP=null;
function ccWrapData(season){
  const cr=CAREER.career, pl=CAREER.player, s=season||cr.season;
  const rows=(cr.log||[]).filter(r=>r && r.season===s);
  const sum=k=>rows.reduce((n, r)=>n+(+r[k]||0), 0);
  let best=null;
  rows.forEach(r=>{ if(!(r.place>0)) return; const sc=r.place/Math.max(1, r.of||100);
    if(!best || r.place<best.place || (r.place===best.place && sc<best.place/Math.max(1, best.of||100))) best=r; });
  const mates={};
  rows.forEach(r=>{ (r.mates && r.mates.length ? r.mates : (r.mate ? [r.mate] : [])).forEach(m=>{ const h=typeof m==='string' ? m : (m && m.handle); if(h) mates[h]=(mates[h]||0)+1; }); });
  const mate=Object.keys(mates).sort((a, b)=>mates[b]-mates[a])[0]||null;
  const days=rows.map(r=>r.day).filter(Boolean).sort();
  let train=0; const by={};
  Object.keys(cr.did||{}).forEach(d=>{ if(days.length && (d<days[0] || d>careerToday())) return;
    (cr.did[d]||[]).forEach(id=>{ const a=ccActById(id); if(a && String(a.id).indexOf('tr')===0 && a.gain){ train++; Object.keys(a.gain).forEach(k=>{ by[k]=(by[k]||0)+1; }); } }); });
  const topStat=Object.keys(by).sort((a, b)=>by[b]-by[a])[0]||null;
  const ovr0=rows.length ? (rows[0].ovr||null) : null, ovr1=Math.round(pl.ovrExact!=null ? pl.ovrExact : pl.ovr);
  const yr=String(days[0]||careerToday()).slice(0, 4);
  return {season:s, year:yr, events:rows.length, games:sum('games'), wins:sum('wins'), elims:sum('elims'), money:sum('prize'),
          best, mate, mateN:mate ? mates[mate] : 0, train, topStat, ovr0, ovr1, reach:cr.reach||0, rival:ccRival()};
}
function ccWrapCards(d){
  const T=L(), out=[];
  out.push({k:'year', big:String(d.year), t:T.wrTitle(d.year), s:d.ovr0!=null ? T.wrRating(Math.round(d.ovr0), d.ovr1) : T.wrRatingNow(d.ovr1)});
  out.push({k:'events', big:String(d.events), t:T.wrEvents, s:T.wrGames(d.games, d.wins, d.elims)});
  if(d.best) out.push({k:'best', big:'#'+d.best.place, t:T.wrBest, s:(typeof ccLogName==='function' ? ccLogName(d.best) : '')+(d.best.of ? ' · '+T.wrOf(d.best.of) : '')});
  out.push({k:'money', big:ccMoney(d.money), t:T.wrMoney, s:d.money>0 ? T.wrMoneySub : T.wrMoneyNone});
  if(d.mate) out.push({k:'mate', big:ccHandle(d.mate), t:T.wrMate, s:T.wrMateSub(d.mateN)});
  out.push({k:'train', big:String(d.train), t:T.wrTrain, s:d.topStat ? T.wrTopStat(T['ccAttr'+d.topStat.toUpperCase()]||d.topStat.toUpperCase()) : ''});
  if(d.rival && d.rival.h) out.push({k:'rival', big:(d.rival.w||0)+' : '+(d.rival.l||0), t:T.wrRival(ccHandle(d.rival.h)), s:(d.rival.w||0)>=(d.rival.l||0) ? T.wrRivalUp : T.wrRivalDown});
  out.push({k:'fans', big:ccNum(d.reach), t:T.wrFans, s:T.wrEnd});
  return out;
}
function ccWrapOpen(season){
  const d=ccWrapData(season);
  CC_WRAP={d, cards:ccWrapCards(d), i:0};
  let el=document.getElementById('ccWrap');
  if(!el){ el=document.createElement('div'); el.id='ccWrap'; el.className='cc-wrap'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.onclick=e=>{ if(e.target===el) ccWrapClose(); }; document.body.appendChild(el); }
  el.hidden=false; ccWrapDraw();
}
function ccWrapClose(){ const el=document.getElementById('ccWrap'); if(el) el.hidden=true; CC_WRAP=null; }
function ccWrapGo(n){ if(!CC_WRAP) return; CC_WRAP.i=clamp(CC_WRAP.i+n, 0, CC_WRAP.cards.length-1); ccWrapDraw(); }
function ccWrapText(){
  const T=L(); if(!CC_WRAP) return '';
  return T.wrTitle(CC_WRAP.d.year)+'\n'+CC_WRAP.cards.slice(1).map(c=>c.t+': '+c.big).join('\n')+'\nfncsdraft.com';
}
function ccWrapCopy(){
  const txt=ccWrapText(); const b=document.getElementById('ccWrapCopy');
  const ok=()=>{ if(b) b.textContent=L().wrCopied; };
  try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, ()=>{}); }catch(e){}
}
function ccWrapDraw(){
  const el=document.getElementById('ccWrap'); if(!el || !CC_WRAP) return;
  const T=L(), c=CC_WRAP.cards[CC_WRAP.i], n=CC_WRAP.cards.length, last=CC_WRAP.i===n-1;
  el.innerHTML='<div class="cc-wrap-card k-'+c.k+'">'+
    '<button type="button" class="cc-wrap-x" onclick="ccWrapClose()" aria-label="'+esc(T.wrClose)+'">×</button>'+
    '<div class="cc-wrap-dots">'+CC_WRAP.cards.map((x, i)=>'<i'+(i<=CC_WRAP.i ? ' class="on"' : '')+'></i>').join('')+'</div>'+
    '<div class="cc-wrap-in"><span class="cc-wrap-t">'+esc(c.t)+'</span><b class="cc-wrap-big">'+esc(c.big)+'</b><span class="cc-wrap-s">'+esc(c.s||'')+'</span></div>'+
    '<div class="cc-wrap-nav">'+(CC_WRAP.i>0 ? '<button type="button" class="cc-wrap-b ghost" onclick="ccWrapGo(-1)">'+esc(T.wrPrev)+'</button>' : '<span></span>')+
      (last ? '<button type="button" class="cc-wrap-b" id="ccWrapCopy" onclick="ccWrapCopy()">'+esc(T.wrCopy)+'</button>'
            : '<button type="button" class="cc-wrap-b" onclick="ccWrapGo(1)">'+esc(T.wrNext)+'</button>')+'</div></div>';
}
function ccWrapBtnHTML(){
  if(!CAREER || !CAREER.career) return '';
  const cr=CAREER.career, rows=(cr.log||[]).filter(r=>r && r.season===cr.season);
  if(!rows.length) return '';
  return '<button type="button" class="cc-wrap-open" onclick="ccWrapOpen()"><b>'+esc(L().wrBtn)+'</b><span>'+esc(cr.seasonOver ? L().wrBtnDone : L().wrBtnSoFar)+'</span></button>';
}

/* ===== TIKTOK, КОУЧИНГ, НАСТАВНИЧЕСТВО (22.11, его «156» на список «чего не хватает в карьере») ===== */

/* TikTok. Канал стартует с доли аудитории (CC_TT_SEED от большего из X и Twitch), как YouTube. Клип - из заметной игры журнала
   (победа, подиум, топ-10): СММ выкладывает сам, без СММ - кнопкой, один в день. Просмотры клипа = (подписчики·0.08 + 200) × вид ×
   разброс, и с шансом CC_TT_VIRAL клип «залетает» ×15; доходят за несколько дней (CC_TT_DECAY). Подписывается 0.4 % посмотревших
   (у большого меньше), «залетевший» приводит людей и в X. Монетизация с 10 тыс. подписчиков, $0.4 за тысячу просмотров.
   Все числа - решение, не замер. */
const CC_TT_SEED=0.15, CC_TT_VIRAL=0.06, CC_TT_VIRAL_X=15, CC_TT_DECAY=0.45, CC_TT_FUND={fol:10000, rpm:0.4}, CC_TT_KIND={win:2, podium:1.4, top:1};
function ccTt(){
  const cr=CAREER.career; cr.tt=cr.tt||{fol:0, views:0, usd:0, clips:[]};
  const t=cr.tt;
  if(!t.seed){ t.seed=1; t.fol=Math.max(t.fol||0, Math.round(Math.max(cr.twitch||0, cr.reach||0)*CC_TT_SEED)); }
  return t;
}
function ccTtKind(e){ const p=e && e.place; return !p ? null : p===1 ? 'win' : p<=3 ? 'podium' : p<=10 ? 'top' : null; }
function ccTtKey(e){ return e.day+'|'+(e.kind||'cup')+'|'+(e.stage||''); }
function ccTtFresh(){
  const cr=CAREER.career, t=ccTt(), from=ccAddDays(careerToday(), -7), used=new Set(t.clips.map(c=>c.ev));
  return (cr.log||[]).filter(e=>e && e.day && e.day>from && e.day<=careerToday() && ccTtKind(e) && !used.has(ccTtKey(e))).slice(-3).reverse();
}
function ccTtEvName(e){ try{ return String(ccLogName(e)).replace(/<[^>]+>/g, ''); }catch(err){ return ''; } }
function ccTtPublish(e){
  const t=ccTt(), kind=ccTtKind(e); if(!kind) return null;
  const id=ccTtKey(e); if(t.clips.some(c=>c.ev===id)) return null;
  const rnd=careerRng(ccHashStr('tt|'+id+'|'+(CAREER.player.nick||'')));
  const viral=rnd()<CC_TT_VIRAL, spread=Math.exp((rnd()-0.5)*1.4);
  const total=Math.max(50, Math.round(((t.fol||0)*0.08+200)*CC_TT_KIND[kind]*spread*(viral ? CC_TT_VIRAL_X : 1)));
  const clip={ev:id, day:careerToday(), on:e.day, kind, place:e.place, name:ccTtEvName(e), total, v:0, viral,
    ekind:e.kind||'cup', div:e.div, prize:e.prize||0, mate:e.mate||'', elims:e.elims||0, skin:((typeof ccYtSkin==='function' && ccYtSkin()) || ccTtSkinFallback()), cap:Math.floor(rnd()*6)};
  t.clips.unshift(clip); if(t.clips.length>40) t.clips.length=40;
  return clip;
}
// Ручная публикация: один клип в день, из самой заметной свежей игры.
function ccTtPostToday(){ const t=ccTt(); return t.clips.some(c=>c.day===careerToday() && c.manual); }
function ccTtPost(){
  if(ccTtPostToday()) return false;
  const e=ccTtFresh()[0]; if(!e) return false;
  const c=ccTtPublish(e); if(c) c.manual=true;
  careerSave(); careerRenderHub('tiktok'); return !!c;
}
// Дневной тик (рядом с ccYtTick): СММ выкладывает свежее, просмотры доходят, подписчики и деньги.
function ccTtTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccSmm==='function' && ccSmm()) ccTtFresh().filter(e=>e.day<careerToday()).forEach(e=>ccTtPublish(e));
  if(!cr.tt) return;
  const t=cr.tt, today=careerToday();
  let got=0, gotViral=0;
  t.clips.forEach(c=>{
    const age=Math.max(0, ccDaysBetween(c.day, today));
    const want=Math.round(c.total*(1-Math.pow(CC_TT_DECAY, Math.min(10, age)+1)));
    const add=Math.max(0, want-(c.v||0)); if(!add) return;
    c.v=(c.v||0)+add; got+=add; if(c.viral) gotViral+=add;
  });
  if(!got) return;
  const fund=(t.fol||0)>=CC_TT_FUND.fol;
  t.views=(t.views||0)+got;
  t.fol=(t.fol||0)+Math.round(got*0.004/Math.sqrt(1+(t.fol||0)/200000));
  if(gotViral) try{ careerReachAdd(Math.round(gotViral*0.0005)); }catch(e){}
  if(fund){ const usd=got/1000*CC_TT_FUND.rpm; t.usd=Math.round(((t.usd||0)+usd)*100)/100; t.owe=(t.owe||0)+usd;
    const whole=Math.floor(t.owe); if(whole>0){ cr.balance=(cr.balance||0)+whole; t.owe-=whole; } }
}
/* Превью клипа как в TikTok про (его «превью другие мб со скинами и байт названия, посмотри как в тиктоке называют»):
   вертикальный кадр, размытый фон события (ccLogArt), скин из шкафчика на день клипа (как у превью YouTube, ccYtSkin),
   сверху крупная подпись-крючок белым по чёрной плашке, строчными, по-английски - так пишут про в TikTok; без эмодзи.
   Подпись выбирается из корзины вида клипа (c.cap - бросок при публикации), числа - из самого вечера. */
const CC_TT_HOOKS={
  win:   [(c,m)=>c.prize>0 ? 'this play won us $'+ccNum(Math.round(c.prize)) : 'how we won '+m.ev, ()=>'they really thought they had me', ()=>'1 hp and still won',
          (c,m)=>'the endgame that won '+m.ev, ()=>'biggest clutch of my career', (c,m)=>c.mate ? 'me and '+c.mate+' cooked the whole lobby' : 'i cooked the whole lobby'],
  podium:[(c,m)=>'#'+c.place+' at '+m.ev+' and this was the moment', (c,m)=>'so close to winning '+m.ev, ()=>'my duo was dead so i did this',
          ()=>'they really thought they had me', ()=>'never piece control a pro', (c,m)=>c.prize>0 ? 'this fight was worth $'+ccNum(Math.round(c.prize)) : 'the fight that got us top 3'],
  top:   [(c,m)=>'pov: you play '+m.ev, ()=>'the cleanest 1v3 you will ever see', ()=>'got third partied and still lived', ()=>'why is nobody talking about this',
          (c,m)=>c.elims ? c.elims+' kills in '+m.ev : 'top '+c.place+' in '+m.ev, ()=>'he did not expect that']
};
// Образ не надет - на превью скин из «потных» скинов сцены (база магазина CC_FN_SHOP), постоянный для игрока.
const CC_TT_SKINS=['CID_397_Athena_Commando_F_TreasureHunterFashion','CID_493_Athena_Commando_F_JurassicArchaeology','CID_452_Athena_Commando_F_CyberFu','CID_102_Athena_Commando_M_Raven','CID_108_Athena_Commando_M_Fishhead','CID_315_Athena_Commando_M_TeriyakiFish','CID_044_Athena_Commando_F_SciPop','CID_257_Athena_Commando_M_SamuraiUltra','CID_297_Athena_Commando_F_Math','CID_028_Athena_Commando_F'];
function ccTtSkinFallback(){ return CC_TT_SKINS[Math.abs(ccHashStr('ttskin|'+((CAREER.player||{}).nick||'')))%CC_TT_SKINS.length]; }
function ccTtHook(c){
  const bank=CC_TT_HOOKS[c.kind]||CC_TT_HOOKS.top, i=(c.cap!=null ? c.cap : Math.abs(ccHashStr(String(c.ev)))) % bank.length;
  const ev=String(c.name||'').replace(/^(Div(ision)?s*d+s*)/i, m=>m).toLowerCase();
  return String(bank[i](c, {ev:ev})).toLowerCase();
}
function ccTtThumbHTML(c, T){
  const art=(typeof ccLogArt==='function') ? ccLogArt({day:c.on, kind:c.ekind||'cup', div:c.div}) : '';
  const sk=c.skin || (typeof ccYtSkin==='function' && ccYtSkin()) || ccTtSkinFallback();
  const fig=sk ? '<img class="tt-fig" src="'+esc(ccFnFull(sk))+'" data-alt="'+esc(ccFnImg(sk))+'" alt="" loading="lazy" onerror="ccYtSkinErr(this)">' : '';
  return (art ? '<img class="tt-bg" src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'<i class="tt-shade"></i>'+fig+
    '<span class="tt-hook">'+esc(ccTtHook(c))+'</span>'+(c.viral ? '<i class="tt-viral">'+esc(T.ttViral)+'</i>' : '');
}
function ccTtClipTitle(c){ const T=L(); return c.kind==='win' ? T.ttClipWin(c.name) : c.kind==='podium' ? T.ttClipPod(c.name, c.place) : T.ttClipTop(c.name, c.place); }
function careerTtHTML(){
  const T=L(), t=ccTt(), me=CAREER.player||{}, today=careerToday();
  const sm=typeof ccSmm==='function' ? ccSmm() : null, smc=sm ? ((typeof ccSmmOf==='function' && ccSmmOf(sm.id))||sm) : null;
  const fund=(t.fol||0)>=CC_TT_FUND.fol, fresh=ccTtFresh(), posted=ccTtPostToday();
  const head='<div class="tt-head"><span class="tt-logo" aria-hidden="true">♪</span><div class="tt-ch"><b>@'+esc(me.nick||'')+'</b><small>'+
    esc(T.ttFol(ccNum(t.fol||0)))+' · '+esc(T.ttViews(ccNum(t.views||0)))+'</small></div>'+
    '<div class="tt-earn"><em>'+esc(T.ttEarned)+'</em><b>'+ccMoney(Math.round(t.usd||0))+'</b><small>'+esc(fund ? T.ttFundOn : T.ttFund)+'</small></div></div>';
  const how='<div class="ch-tile tt-how"><p class="yt-sub">'+esc(smc ? T.ttBySmm(smc.name||'') : T.ttNoSmm)+'</p>'+
    (smc ? '' : '<button class="ch-play" '+(posted || !fresh.length ? 'disabled' : '')+' onclick="ccTtPost()">'+esc(posted ? T.ttPostDone : T.ttPost)+'</button>')+'</div>';
  let face=''; try{ const cd=careerCard(); face=cd ? (photoURL(cd)||'') : ''; }catch(e){}
  const grid=t.clips.length ? '<div class="tt-grid">'+t.clips.map(c=>{
      const age=Math.max(0, ccDaysBetween(c.day, today));
      return '<div class="tt-clip k-'+c.kind+(c.viral ? ' viral' : '')+'">'+ccTtThumbHTML(c, T)+'<div class="tt-clip-in">'+
        '<b>'+esc(ccTtClipTitle(c))+'</b><small class="tt-tags">#fortnite #fncs #fortnitecompetitive</small><small>▶ '+ccNum(c.v||0)+' · '+esc(T.ttAgo(age))+'</small></div></div>'; }).join('')+'</div>'
    : '<p class="ch-empty">'+esc(T.ttNone)+'</p>';
  return '<div class="tt-wrap">'+head+how+grid+'</div>';
}

/* Коучинг за деньги: урок игроку пониже, 20 энергии, не больше CC_LESSON_DAY в день. Цена - от твоего рейтинга и известности,
   в порядке платных уроков про на сайтах коучинга (решение, не замер). Не в день турнира (общее правило ccPreEvent). */
const CC_LESSON_DAY=2;
function ccLessonPay(){ const o=Math.round(ccMyShownOvr ? ccMyShownOvr() : (CAREER.player.ovr||70)); const fame=Math.min(1, (careerReach()||0)/500000);
  return Math.max(20, Math.round((20+Math.max(0, o-70)*3)*2*(1+fame)/5)*5); }
function ccLessonsToday(){ const d=(CAREER.career.did||{})[careerToday()]||[]; return d.filter(x=>x==='lesson').length; }
function ccLessonRun(){
  const cr=CAREER.career, pay=ccLessonPay();
  cr.balance=(cr.balance||0)+pay; cr.lessons=cr.lessons||{n:0, usd:0}; cr.lessons.n++; cr.lessons.usd+=pay;
  CC_LESSON_LAST={day:careerToday(), pay:pay};
}
let CC_LESSON_LAST=null;
function ccLessonGo(){
  if(ccLessonsToday()>=CC_LESSON_DAY) return false;
  const r=careerDoAct('lesson'); careerSave(); careerRenderHub('train'); return !!r;
}
function ccLessonTileHTML(){
  const T=L(), cr=CAREER.career, act=CC_DAY_ACTS.find(a=>a.id==='lesson'); if(!act) return '';
  const full=ccLessonsToday()>=CC_LESSON_DAY, pre=!!ccPreEvent(), can=!full && !pre && careerEnergy()>=act.energy && !careerDayClosed();
  const last=CC_LESSON_LAST && CC_LESSON_LAST.day===careerToday() ? '<p class="mg-note">'+esc(T.lsDone(ccMoney(CC_LESSON_LAST.pay)))+'</p>' : '';
  return '<div class="ch-tile cc-lesson"><h4>'+esc(T.ccLsTitle)+'</h4><p class="yt-sub">'+esc(T.lsNote(ccMoney(ccLessonPay())))+'</p>'+last+
    '<button class="ch-play"'+(can ? '' : ' disabled')+' onclick="ccLessonGo()">'+esc(full ? T.lsLimit : pre ? T.crNotTourDay : T.lsBtn(ccMoney(ccLessonPay()), act.energy))+'</button>'+
    (cr.lessons && cr.lessons.n ? '<p class="yt-sub">'+esc(T.lsTotal(cr.lessons.n, ccMoney(cr.lessons.usd)))+'</p>' : '')+'</div>';
}

/* Наставничество: с рейтинга CC_MENTOR_MIN берёшь в ученики молодого (до 19 лет) игрока своего региона, ниже тебя на
   CC_MENTOR_GAP и больше. Занятие - 20 энергии: ученику +CC_MENTOR_STEP к сдвигу рейтинга в книге развития сцены (CAREER.dev,
   её читает careerDevOf), до +CC_MENTOR_CAP за сезон; тебе репутация +1 каждые три занятия; каждые +2 ученика - его пост.
   В командной карьере и гонке нельзя: книга развития - общий мир двоих. */
const CC_MENTOR_MIN=85, CC_MENTOR_GAP=6, CC_MENTOR_STEP=0.4, CC_MENTOR_CAP=6;
function ccMentorOff(){ return (typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRaceOn==='function' && ccRaceOn()); }
function ccMentor(){ const cr=CAREER.career, m=cr.mentee; return (m && m.season===cr.season) ? m : null; }
function ccMentorCands(){
  const me=Math.round(ccMyShownOvr ? ccMyShownOvr() : (CAREER.player.ovr||70)), mine=hKey(CAREER.player.handle||CAREER.player.nick||'');
  let list=[]; try{ list=careerRosterNowEU(); }catch(e){}
  return list.filter(p=>{ if(!p || !p.handle || hKey(p)===mine) return false;
      const a=ccAgeOf(p.handle); const o=(p._ovr!=null ? p._ovr : (attrsFor(p)||{}).ovr)||0;
      return a!=null && a<=19 && o && o<=me-CC_MENTOR_GAP; })
    .sort((a,b)=>((b._ovr||0)-(a._ovr||0))).slice(0, 6);
}
function ccMentorPick(h){ if(ccMentorOff()) return; const cr=CAREER.career; cr.mentee={h:h, season:cr.season, n:0, d:0}; careerSave(); careerRenderHub('train'); }
function ccMentorDrop(){ CAREER.career.mentee=null; careerSave(); careerRenderHub('train'); }
function ccMentorRun(){
  const m=ccMentor(); if(!m || ccMentorOff()) return;
  m.n++;
  const step=Math.min(CC_MENTOR_STEP, Math.max(0, CC_MENTOR_CAP-m.d));
  if(step>0){ const k=hKey(m.h); CAREER.dev=CAREER.dev||{}; CAREER.dev[k]=Math.min(CC_SCENE_DEV_MAX, (CAREER.dev[k]||0)+step); m.d=Math.round((m.d+step)*10)/10; }
  if(m.n%3===0) try{ careerRepAdd(1); }catch(e){}
  const shown=Math.floor(m.d/2)*2;
  if(shown>=2 && shown>(m.told||0)){ m.told=shown; try{ careerNews('good', 'ccNewsMentor', [ccHandle(m.h), shown], {by:{name:m.h}}); }catch(e){} }
}
function ccMentorGo(){ const r=careerDoAct('mentor'); careerSave(); careerRenderHub('train'); return !!r; }
function ccMentorTileHTML(){
  const T=L(), me=Math.round(ccMyShownOvr ? ccMyShownOvr() : (CAREER.player.ovr||70)), act=CC_DAY_ACTS.find(a=>a.id==='mentor'); if(!act) return '';
  let body='';
  if(ccMentorOff()) body='<p class="yt-sub">'+esc(T.mtMp)+'</p>';
  else if(me<CC_MENTOR_MIN) body='<p class="yt-sub">'+esc(T.mtLocked(CC_MENTOR_MIN))+'</p>';
  else { const m=ccMentor();
    if(m){ const pre=!!ccPreEvent(), can=!pre && careerEnergy()>=act.energy && !careerDayClosed();
      body='<p class="yt-sub">'+esc(T.mtCur(ccHandle(m.h), m.n, m.d))+'</p><button class="ch-play"'+(can ? '' : ' disabled')+' onclick="ccMentorGo()">'+esc(pre ? T.crNotTourDay : T.mtBtn(act.energy))+'</button>'+
        ' <button class="cc-back" onclick="ccMentorDrop()">'+esc(T.mtEnd)+'</button>'; }
    else { const c=ccMentorCands();
      body=c.length ? '<div class="cc-mentor-list">'+c.map(p=>'<div class="cc-mentor-row"><b>'+esc(ccHandle(p.handle))+'</b><em>'+((p._ovr!=null ? p._ovr : (attrsFor(p)||{}).ovr)||'')+' · '+ccAgeOf(p.handle)+'</em>'+
          '<button class="dc-btn sm" onclick="ccMentorPick(\''+jsq(p.handle)+'\')">'+esc(T.mtPick)+'</button></div>').join('')+'</div>' : '<p class="yt-sub">'+esc(T.mtNone)+'</p>'; } }
  return '<div class="ch-tile cc-mentor"><h4>'+esc(T.mtTitle)+'</h4><p class="yt-sub">'+esc(T.mtNote)+'</p>'+body+'</div>';
}

/* ===== СЛУХИ, РЕЙТИНГ МЕДИА, МЕЖСЕЗОНЬЕ, ПРОГНОЗ С ЧАТОМ, ПАТЧИ, ФИЗИО, ИНВЕСТИЦИИ, ГИФТ-САБЫ (22.11, его «12456 12») =====
   Один дневной тик ccLife22Tick (рядом с ccTtTick). Все числа - решение, не замер. */
const CC_INSIDER={name:'FNCS Insider'};
function ccL22(){ const cr=CAREER.career; cr.l22=cr.l22||{}; return cr.l22; }
function ccLife22Tick(){
  const cr=CAREER && CAREER.career; if(!cr || cr.seasonOver) return;
  const x=ccL22(), today=careerToday();
  try{ ccRumorTick(x, today); }catch(e){ console.warn('rumor', e); }
  try{ ccMediaRankTick(x, today); }catch(e){ console.warn('media rank', e); }
  try{ ccVacApply(x); }catch(e){ console.warn('vac', e); }
  try{ ccPredResolve(x, today); }catch(e){ console.warn('pred', e); }
  try{ ccPatchTick(x, today); }catch(e){ console.warn('patch', e); }
  try{ ccInvMonth(x, today); }catch(e){ console.warn('inv', e); }
}
function ccL22Rng(tag){ return careerRng(ccHashStr('l22|'+tag+'|'+(CAREER.player.nick||'')+'|'+careerToday())); }
function ccL22Orgs(){
  const seen=new Set(), out=[];
  try{ careerRosterNowEU().forEach(p=>{ const o=p && p.org; if(o && !seen.has(o)){ seen.add(o); out.push(o); } }); }catch(e){}
  return out;
}

/* 1. Слухи. Раз в неделю инсайдер пишет о переходе кого-то со сцены; про тебя - когда есть предложение от орги в личке или ты
   без клуба и силён (рейтинг от 85), шанс 35 % в неделю. Ответ: опровергнуть (репутация +1), промолчать, подогреть (охват +0.3 %). */
function ccRumorTick(x, today){
  if(x.rumDay && ccDaysBetween(x.rumDay, today)<7) return;
  x.rumDay=today;
  const rnd=ccL22Rng('rum'), orgs=ccL22Orgs(); if(!orgs.length) return;
  try{ const pool=careerRosterNowEU().filter(p=>p && p.handle).slice(0, 40); const p=pool[Math.floor(rnd()*pool.length)];
    const to=orgs.filter(o=>o!==p.org)[Math.floor(rnd()*Math.max(1, orgs.length-1))];
    if(p && to) careerNews('flat', 'rmOther', [ccHandle(p.handle), to], {by:CC_INSIDER}); }catch(e){}
  let offer=null; try{ offer=(careerDms()||[]).find(t=>t && t.state==='offer' && t.who && t.who.org); }catch(e){}
  const strong=!CAREER.org && (CAREER.player.ovr||0)>=85;
  if(!(offer || strong) || rnd()>0.35) return;
  const org=offer ? (offer.who.org.name||offer.who.org) : orgs[Math.floor(rnd()*orgs.length)];
  if(!org || (CAREER.org && CAREER.org.name===org)) return;
  careerNews('flat', 'rmAbout', [CAREER.player.nick||'', String(org)], {by:CC_INSIDER});
  x.rumor={day:today, org:String(org), done:false};
}
function ccRumorAnswer(k){
  const x=ccL22(), r=x.rumor; if(!r || r.done) return;
  r.done=k;
  if(k==='deny'){ try{ careerRepAdd(1); }catch(e){} careerNews('flat', 'rmDenyPost', []); }
  else if(k==='tease'){ try{ careerReachAdd(Math.round((careerReach()||0)*0.003)); }catch(e){} careerNews('flat', 'rmTeasePost', []); }
  careerSave(); careerRenderHub('social');
}
function ccRumorTileHTML(){
  const r=ccL22().rumor, T=L(); if(!r || ccDaysBetween(r.day, careerToday())>7) return '';
  if(r.done) return '';
  return '<div class="ch-tile cc-rumor"><h4>'+esc(T.rmTitle)+'</h4><p class="yt-sub">'+esc(T.rmNote(r.org))+'</p><div class="cr-replies">'+
    [['deny', T.rmDeny], ['quiet', T.rmQuiet], ['tease', T.rmTease]].map(([k, t])=>'<button type="button" class="dc-btn sm'+(k==='quiet' ? ' ghost' : '')+'" onclick="ccRumorAnswer(\''+k+'\')">'+esc(t)+'</button>').join('')+'</div></div>';
}

/* 2. Рейтинг медиа: первого числа - топ-10 региона прошлого месяца по таблице PR (careerPrRows). Ты в нём - свой пост с местом;
   был близко (до 30-го) - пост «работаем». */
function ccMediaRankTick(x, today){
  const m=today.slice(0, 7); if(x.mrMonth===m) return;
  const first=!x.mrMonth; x.mrMonth=m; if(first) return;   // первый день карьеры - без поста
  const rows=careerPrRows(); if(rows.length<10) return;
  const prev=new Date(today+'T00:00:00Z'); prev.setUTCMonth(prev.getUTCMonth()-1);
  let mon=''; try{ mon=prev.toLocaleString(typeof LANG!=='undefined' ? LANG : 'en', {month:'long', timeZone:'UTC'}); }catch(e){ mon=String(prev.getUTCMonth()+1); }
  const reg=ccCareerRegion(), top=rows.slice(0, 10);
  careerNews('flat', 'mrPost', [reg, mon, top.map((r, i)=>(i+1)+'. '+(r.you ? (CAREER.player.nick||'') : ccHandle(r.name))).join(', ')], {by:CC_INSIDER});
  const me=rows.findIndex(r=>r.you);
  if(me>=0 && me<10) careerNews('good', 'mrYou', [reg, mon, me+1]);
  else if(me>=10 && me<30) careerNews('flat', 'mrOut', [mon]);
}

/* 4. Межсезонье: выбор отпуска на итогах сезона; бонус - в первый день нового сезона (ccVacApply). */
const CC_VAC={home:{cost:0, form:0}, trip:{cost:3000, form:0.4, places:['Barcelona', 'Tokyo', 'Dubai', 'Bali', 'Miami']},
              lux:{cost:15000, form:0.8, places:['the Maldives', 'Monaco', 'Bora Bora']}};
function ccVacPick(k){
  const cr=CAREER.career, v=CC_VAC[k], x=ccL22(); if(!v || !cr.seasonOver) return;
  if(x.vac && x.vac.season===cr.season) return;
  if((cr.balance||0)<v.cost) return;
  cr.balance-=v.cost;
  const rnd=ccL22Rng('vac'), place=v.places ? v.places[Math.floor(rnd()*v.places.length)] : '';
  x.vac={season:cr.season, k:k, place:place, applied:false};
  careerSave(); careerRenderHub('me');
}
function ccVacApply(x){
  const cr=CAREER.career, v=x.vac; if(!v || v.applied || v.season>=cr.season) return;
  v.applied=true;
  const t=CC_VAC[v.k]; if(!t) return;
  if(t.form){ cr.form=(cr.form||0)+t.form; try{ cr.energy=careerEnergyMax(); }catch(e){} }
  if(v.place) careerNews('good', 'vcPost', [v.place]);
}
function ccVacTileHTML(){
  const cr=CAREER.career, T=L(), x=ccL22(); if(!cr.seasonOver) return '';
  const chosen=x.vac && x.vac.season===cr.season ? x.vac : null;
  const lbl={home:[T.vcHome, T.vcHomeN], trip:[T.vcTrip, T.vcTripN], lux:[T.vcLux, T.vcLuxN]};
  return '<div class="ch-tile cc-vac"><h4>'+esc(T.vcTitle)+'</h4><p class="yt-sub">'+esc(T.vcNote)+'</p>'+
    (chosen ? '<p class="yt-sub"><b>'+esc(T.vcDone(lbl[chosen.k][0]+(chosen.place ? ', '+chosen.place : '')))+'</b></p>'
      : '<div class="cc-vac-row">'+Object.keys(CC_VAC).map(k=>{ const v=CC_VAC[k], can=(cr.balance||0)>=v.cost;
          return '<button type="button" class="cc-vac-b"'+(can ? '' : ' disabled')+' onclick="ccVacPick(\''+k+'\')"><b>'+esc(T.vcBtn(lbl[k][0], v.cost ? ccMoney(v.cost) : '$0'))+'</b><small>'+esc(lbl[k][1])+'</small></button>'; }).join('')+'</div>')+'</div>';
}

/* 5. Прогноз с чатом: в день чужого финала (ccStreamWatchEvent) - выбор победителя из шести сильнейших региона.
   Итог - по новости ccNewsWorldWon за три дня: угадал - Twitch +1 % (не меньше 50) и пост. */
function ccPredCands(){ try{ return careerRosterNowEU().filter(p=>p && p.handle).slice().sort((a,b)=>((b._ovr||0)-(a._ovr||0))).slice(0, 6); }catch(e){ return []; } }
function ccPredPick(h){ const ev=(typeof ccStreamWatchEvent==='function') ? ccStreamWatchEvent() : null; if(!ev) return;
  ccL22().pred={day:careerToday(), ev:String(ev.label||ev.title||''), h:h}; careerSave(); careerRenderHub('streams'); }
function ccPredResolve(x, today){
  const p=x.pred; if(!p || p.done) return;
  const won=(CAREER.career.news||[]).find(n=>n && n.k==='ccNewsWorldWon' && n.day && n.day>=p.day && ccDaysBetween(p.day, n.day)<=3);
  if(!won){ if(ccDaysBetween(p.day, today)>3) p.done='gone'; return; }
  const w=String((won.a||[])[1]||'').replace(/<[^>]+>/g, ''), ev=String((won.a||[])[0]||p.ev).replace(/<[^>]+>/g, '');
  const hit=w.toLowerCase().indexOf(String(ccHandle(p.h)).toLowerCase())>=0;
  p.done=hit ? 'win' : 'lose';
  if(hit){ const cr=CAREER.career, add=Math.max(50, Math.round((cr.twitch||0)*0.01)); cr.twitch=(cr.twitch||0)+add; careerNews('good', 'pdWin', [ccHandle(p.h), ev, ccNum(add)]); }
  else careerNews('flat', 'pdLose', [ccHandle(p.h), w, ev]);
}
function ccPredTileHTML(){
  const ev=(typeof ccStreamWatchEvent==='function') ? ccStreamWatchEvent() : null; if(!ev) return '';
  const T=L(), p=ccL22().pred, mine=p && p.day===careerToday() ? p : null, name=String(ev.label||ev.title||'');
  return '<div class="ch-tile cc-pred"><h4>'+esc(T.pdTitle)+'</h4><p class="yt-sub">'+esc(T.pdNote(name))+'</p>'+
    (mine ? '<p class="yt-sub"><b>'+esc(T.pdYour(ccHandle(mine.h)))+'</b></p>'
      : '<div class="cc-mentor-list">'+ccPredCands().map(c=>'<div class="cc-mentor-row"><b>'+esc(ccHandle(c.handle))+'</b><em>'+(c._ovr||'')+'</em><button class="dc-btn sm" onclick="ccPredPick(\''+jsq(c.handle)+'\')">'+esc(T.pdPick)+'</button></div>').join('')+'</div>')+'</div>';
}

/* 6. Патчи: каждые 21 день сезона. Ослабляют агрессию (дробовики, мобильность) или игру на место (шторм, хил). Твой стиль -
   по киллам за игру в последних десяти турнирах (от 1.0 - агрессия). Задел - форма −0.5, пока не разберёшь патч (занятие
   «Разбор патча», 20 энергии, возвращает форму). */
const CC_PATCH_EVERY=21, CC_PATCH_FORM=0.5;
function ccMyStyle(){ const L10=(CAREER.career.log||[]).slice(-10); let el=0, g=0; L10.forEach(e=>{ el+=e.elims||0; g+=e.games||0; }); return g && el/g>=1 ? 'wkey' : 'place'; }
function ccPatchTick(x, today){
  if(!x.patchNext){ x.patchNext=ccAddDays(today, CC_PATCH_EVERY); return; }
  if(today<x.patchNext) return;
  x.patchNext=ccAddDays(today, CC_PATCH_EVERY);
  const rnd=ccL22Rng('patch'), type=rnd()<0.5 ? 'wkey' : 'place', n=(x.patchN||0)+1; x.patchN=n;
  const v='v'+(30+(CAREER.career.season||1))+'.'+(n*10);
  const hit=(CAREER.career.log||[]).length>=3 && ccMyStyle()===type;
  x.patch={day:today, v:v, type:type, hit:hit, adapted:false};
  careerNews('flat', 'ptNews', [v, type==='wkey' ? L().ptWkey : L().ptPlace]);
  if(hit) CAREER.career.form=(CAREER.career.form||0)-CC_PATCH_FORM;
}
function ccPatchAdapt(){ const p=ccL22().patch; if(!p || !p.hit || p.adapted) return; p.adapted=true; CAREER.career.form=(CAREER.career.form||0)+CC_PATCH_FORM; }
function ccPatchGo(){ careerDoAct('patch'); careerSave(); careerRenderHub('train'); }
function ccPatchTileHTML(){
  const p=ccL22().patch, T=L(); if(!p || ccDaysBetween(p.day, careerToday())>CC_PATCH_EVERY) return '';
  const act=CC_DAY_ACTS.find(a=>a.id==='patch'), can=act && careerEnergy()>=act.energy && !careerDayClosed() && !ccPreEvent();
  return '<div class="ch-tile cc-patch"><h4>'+esc(T.ptTitle)+' · '+esc(p.v)+'</h4><p class="yt-sub">'+esc(p.type==='wkey' ? T.ptWkey : T.ptPlace)+'</p>'+
    (!p.hit ? '<p class="yt-sub">'+esc(T.ptSafe)+'</p>' : p.adapted ? '<p class="yt-sub"><b>'+esc(T.ptAdapted)+'</b></p>'
      : '<p class="yt-sub">'+esc(T.ptHit)+'</p><button class="ch-play"'+(can ? '' : ' disabled')+' onclick="ccPatchGo()">'+esc(ccPreEvent() ? T.crNotTourDay : T.ptAdaptBtn(act ? act.energy : 20))+'</button>')+'</div>';
}

/* 12б. Инвестиции: три проекта. Раз в месяц доход (rate) или крах (bust) - вложение пропадает. Забрать можно в любой день. */
const CC_INV={drink:{rate:0.01, bust:0.005}, org:{rate:0.025, bust:0.02}, start:{rate:0.06, bust:0.08}};
function ccInv(){ const x=ccL22(); x.inv=x.inv||{}; return x.inv; }
function ccInvStep(){ const b=CAREER.career.balance||0; return Math.max(1000, Math.floor(b*0.1/1000)*1000); }
function ccInvBuy(k){ const cr=CAREER.career, s=ccInvStep(); if(!CC_INV[k] || (cr.balance||0)<s) return; cr.balance-=s; const i=ccInv(); i[k]=i[k]||{amt:0, ret:0}; i[k].amt+=s; careerSave(); careerRenderHub('me'); }
function ccInvSell(k){ const i=ccInv(); if(!i[k] || !i[k].amt) return; CAREER.career.balance=(CAREER.career.balance||0)+i[k].amt; i[k].amt=0; careerSave(); careerRenderHub('me'); }
function ccInvMonth(x, today){
  const m=today.slice(0, 7); if(x.invMonth===m) return; const first=!x.invMonth; x.invMonth=m; if(first) return;
  const T=L(), i=ccInv(), rnd=ccL22Rng('inv');
  Object.keys(i).forEach(k=>{ const v=i[k], c=CC_INV[k]; if(!v || !v.amt || !c) return;
    if(rnd()<c.bust){ v.amt=0; careerNews('bad', 'ivBust', [T['iv'+(k==='drink' ? 'Drink' : k==='org' ? 'Org' : 'Start')]]); return; }
    const pay=Math.round(v.amt*c.rate); CAREER.career.balance=(CAREER.career.balance||0)+pay; v.ret=(v.ret||0)+pay; });
}
function ccInvTileHTML(){
  const T=L(), i=ccInv(), cr=CAREER.career, s=ccInvStep();
  const rows=[['drink', T.ivDrink, T.ivDrinkN], ['org', T.ivOrg, T.ivOrgN], ['start', T.ivStart, T.ivStartN]].map(([k, n, d])=>{ const v=i[k]||{amt:0, ret:0};
    return '<div class="cc-inv-row"><div class="cc-inv-in"><b>'+esc(n)+'</b><small>'+esc(d)+'</small>'+(v.amt || v.ret ? '<small>'+esc(T.ivHave(ccMoney(v.amt||0), ccMoney(v.ret||0)))+'</small>' : '')+'</div>'+
      '<button class="dc-btn sm"'+((cr.balance||0)>=s ? '' : ' disabled')+' onclick="ccInvBuy(\''+k+'\')">'+esc(T.ivBuy(ccMoney(s)))+'</button>'+
      (v.amt ? '<button class="dc-btn ghost sm" onclick="ccInvSell(\''+k+'\')">'+esc(T.ivSell(ccMoney(v.amt)))+'</button>' : '')+'</div>'; }).join('');
  // Свёрнуто (22.11, «надо вниз скролить»): в заголовке - сколько вложено сейчас.
  const tot=Object.keys(i).reduce((s0,k)=>s0+((i[k]||{}).amt||0), 0);
  return '<details class="ch-tile cc-inv"><summary><h4>'+esc(T.ivTitle)+(tot ? ' · '+ccMoney(tot) : '')+'</h4></summary><p class="yt-sub">'+esc(T.ivNote)+'</p>'+rows+'</details>';
}

/* 12в. Гифт-сабы креатору: $50 (десять сабов по $5). Каждый подарок +5 % к шансу, что он согласится на коллаб (до +25 %). */
const CC_GIFT_COST=50;
function ccGiftOf(name){ const g=ccL22().gift||{}; return g[hKey(name)]||0; }
function ccGiftSubs(name){
  const cr=CAREER.career; if((cr.balance||0)<CC_GIFT_COST) return;
  cr.balance-=CC_GIFT_COST; const x=ccL22(); x.gift=x.gift||{}; x.gift[hKey(name)]=(x.gift[hKey(name)]||0)+1;
  careerSave(); careerRenderHub('streams');
}
function ccGiftBonus(name){ return Math.min(0.25, 0.05*ccGiftOf(name)); }


