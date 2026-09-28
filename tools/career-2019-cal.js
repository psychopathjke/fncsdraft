/* ---- 2019 в карьере --------------------------------------------------------------
   Формат меняется по ходу года: World Cup (недели Online Open — соло по нечётным, дуо по
   чётным; финалы в Нью-Йорке 27–28 июля), FNCS Season X (трио, август — сентябрь), FNCS
   Chapter 2 Season 1 (сквады, октябрь — декабрь). Состав года — сквад; вечер — в своём
   формате (см. runCareerMajorMX). Даты и квоты — окна Epic с Tracker
   (tools/measured/tracker-2019.json), финалы Нью-Йорка — Liquipedia; спека —
   docs/superpowers/specs/2026-09-27-career-year-2019-2020-design.md. */
const CC_YEAR_2019_FROM='2019-01-21', CC_YEAR_2019_TO='2019-12-29';
const CAREER_YEAR_2019=[
  // World Cup Solo («Мейджор 1»): суббота — открытый раунд, воскресенье — финал недели (3000).
  ['2019-04-13','2019-04-13','Major1_2019_W1R1','major'], ['2019-04-14','2019-04-14','Major1_2019_W1R2','major'],
  ['2019-04-20','2019-04-20','Major2_2019_W2R1','major'], ['2019-04-21','2019-04-21','Major2_2019_W2R2','major'],
  ['2019-04-27','2019-04-27','Major1_2019_W3R1','major'], ['2019-04-28','2019-04-28','Major1_2019_W3R2','major'],
  ['2019-05-04','2019-05-04','Major2_2019_W4R1','major'], ['2019-05-05','2019-05-05','Major2_2019_W4R2','major'],
  ['2019-05-11','2019-05-11','Major1_2019_W5R1','major'], ['2019-05-12','2019-05-12','Major1_2019_W5R2','major'],
  ['2019-05-18','2019-05-18','Major2_2019_W6R1','major'], ['2019-05-19','2019-05-19','Major2_2019_W6R2','major'],
  ['2019-05-25','2019-05-25','Major1_2019_W7R1','major'], ['2019-05-26','2019-05-26','Major1_2019_W7R2','major'],
  ['2019-06-01','2019-06-01','Major2_2019_W8R1','major'], ['2019-06-02','2019-06-02','Major2_2019_W8R2','major'],
  ['2019-06-08','2019-06-08','Major1_2019_W9R1','major'], ['2019-06-09','2019-06-09','Major1_2019_W9R2','major'],
  ['2019-06-20','2019-06-20','Major2_2019_W10R1','major'], ['2019-06-21','2019-06-21','Major2_2019_W10R2','major'],
  // Финалы World Cup, Arthur Ashe Stadium: дуо 27 июля, соло 28 июля.
  ['2019-07-27','2019-07-27','Major2_2019_Final','major'],
  ['2019-07-28','2019-07-28','Major1_2019_Final','major'],
  // FNCS Season X («Мейджор 3», трио): суббота — раунды 1 и 2, воскресенье — финал недели.
  ['2019-08-17','2019-08-17','Major3_2019_W1R12','major'], ['2019-08-18','2019-08-18','Major3_2019_W1R3','major'],
  ['2019-08-24','2019-08-24','Major3_2019_W2R12','major'], ['2019-08-25','2019-08-25','Major3_2019_W2R3','major'],
  ['2019-08-31','2019-08-31','Major3_2019_W3R12','major'], ['2019-09-01','2019-09-01','Major3_2019_W3R3','major'],
  ['2019-09-07','2019-09-07','Major3_2019_W4R12','major'], ['2019-09-08','2019-09-08','Major3_2019_W4R3','major'],
  ['2019-09-14','2019-09-14','Major3_2019_W5R12','major'], ['2019-09-15','2019-09-15','Major3_2019_W5R3','major'],
  ['2019-09-20','2019-09-20','Major3_2019_Heat1','major'], ['2019-09-21','2019-09-21','Major3_2019_Heat2','major'],
  ['2019-09-22','2019-09-22','Major3_2019_Final','major'],
  // FNCS Chapter 2 Season 1 («Мейджор 4», сквады): разминка (неделя 0) и четыре недели.
  ['2019-10-26','2019-10-26','Major4_2019_W0R12','major'], ['2019-10-27','2019-10-27','Major4_2019_W0R3','major'],
  ['2019-11-02','2019-11-02','Major4_2019_W1R1','major'], ['2019-11-03','2019-11-03','Major4_2019_W1R23','major'],
  ['2019-11-09','2019-11-09','Major4_2019_W2R12','major'], ['2019-11-10','2019-11-10','Major4_2019_W2R3','major'],
  ['2019-11-16','2019-11-16','Major4_2019_W3R12','major'], ['2019-11-17','2019-11-17','Major4_2019_W3R3','major'],
  ['2019-11-23','2019-11-23','Major4_2019_W4R12','major'], ['2019-11-24','2019-11-24','Major4_2019_W4R3','major'],
  ['2019-12-06','2019-12-06','Major4_2019_Heat1','major'], ['2019-12-07','2019-12-07','Major4_2019_Heat2','major'],
  ['2019-12-08','2019-12-08','Major4_2019_Final','major'],
  // Кубок наций — после FNCS C2S1 (выдумка режима, см. ccNationsBook).
  ['2019-12-14','2019-12-14','NationsTrial','nations'],
  ['2019-12-21','2019-12-21','NationsQual','nations'],
  ['2019-12-28','2019-12-28','NationsFinal','nations']
];
const CC_SEASONS_2019=[
  {id:'S8', from:'2019-02-28', to:'2019-05-08'},
  {id:'S9', from:'2019-05-09', to:'2019-07-31'},
  {id:'S10', from:'2019-08-01', to:'2019-10-12'},
  {id:'S11', from:'2019-10-13', to:'2019-12-31'}
];
CAREER_YEAR_2019.forEach(r=>{
  const m=/^Major(\d)_2019_/.exec(r[2]);
  // World Cup (Solo и Duos) — ключевой арт World Cup, как у квалов турнира; FNCS — остров сезона.
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]=(m[1]==='1' || m[1]==='2') ? 'art/fncs-2019.jpg' : 'art/map-h'+m[1]+'.jpg';
});
const CC_SNAPSHOTS_2019=[
  {tag:'h1', from:CC_YEAR_2019_FROM, playIn:/2019 (World Cup (Solo|Duos)|Season X|C2S1) . Grand Finals/, lcq:/2019 (World Cup (Solo|Duos)|Season X|C2S1) . (Semi-Finals|Qualifier|Online Open)/}
];
/* Сезоны 2019-го для машины runCareerMajorMX. rounds — раунды недели по порядку (open — зал
   из лестницы, без записи); у World Cup последний раунд — финал недели, верх по квоте региона
   (WC2019_QUOTA) едет в Нью-Йорк. heats — хиты финальной недели: день и квота. Число игр в
   раундах — своя оценка режима (в окнах Epic его нет). */
var CC_MX_SPEC=CC_MX_SPEC||{};
CC_MX_SPEC[2019]={
  1:{set:'h1', name:'World Cup Solo', size:1, kind:'wc', weeks:[1,3,5,7,9],
     rounds:[{games:10, cut:3000, open:true}, {games:10, cut:0, open:true}], finalGames:6, island:'h1'},
  2:{set:'h2', name:'World Cup Duos', size:2, kind:'wc', weeks:[2,4,6,8,10],
     rounds:[{games:10, cut:1500, open:true}, {games:10, cut:0, open:true}], finalGames:6, island:'h1'},
  3:{set:'h3', name:'FNCS Season X', size:3, weeks:[1,2,3,4,5],
     rounds:[{games:10, cut:1000, open:true}, {games:6, cut:150, open:true}, {games:6, cut:0}],
     heats:[{day:1, cut:8}, {day:2, cut:8}, {day:2, cut:8}, {day:2, cut:8}], heatGames:6, finalGames:6, island:'h3'},
  4:{set:'h4', name:'FNCS Chapter 2 Season 1', size:4, weeks:[0,1,2,3,4],
     rounds:[{games:10, cut:500, open:true}, {games:6, cut:25, open:true}, {games:6, cut:0}],
     heats:[{day:1, cut:6}, {day:2, cut:6}, {day:2, cut:6}, {day:2, cut:6}], heatGames:6, finalGames:6, island:'h4'}
};
