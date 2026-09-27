/* ---- 2020 в карьере -----------------------------------------------------------------
   Формат меняется по ходу года: FNCS C2S2 — дуо, C2S3 — соло, C2S4 — трио. Состав года — трио,
   вечер — в своём формате (runCareerMajorMX). Даты — страницы Liquipedia (на Tracker этих
   сезонов нет), квота хита — финал Европы поровну на хиты; генерируется tools/build-2020-cal.js. */
const CC_YEAR_2020_FROM='2020-01-06', CC_YEAR_2020_TO='2020-11-29';
const CAREER_YEAR_2020=[
  ['2020-03-21','2020-03-21','Major1_2020_W1R1','major'],
  ['2020-03-22','2020-03-22','Major1_2020_W1R2','major'],
  ['2020-03-28','2020-03-28','Major1_2020_W2R1','major'],
  ['2020-03-29','2020-03-29','Major1_2020_W2R2','major'],
  ['2020-04-04','2020-04-04','Major1_2020_W3R1','major'],
  ['2020-04-05','2020-04-05','Major1_2020_W3R2','major'],
  ['2020-04-11','2020-04-11','Major1_2020_W4R1','major'],
  ['2020-04-12','2020-04-12','Major1_2020_W4R2','major'],
  ['2020-04-17','2020-04-17','Major1_2020_Heat1','major'],
  ['2020-04-18','2020-04-18','Major1_2020_Heat2','major'],
  ['2020-04-19','2020-04-19','Major1_2020_Final','major'],
  ['2020-08-01','2020-08-01','Major2_2020_W1R12','major'],
  ['2020-08-02','2020-08-02','Major2_2020_W2R12','major'],
  ['2020-08-08','2020-08-08','Major2_2020_W3R12','major'],
  ['2020-08-09','2020-08-09','Major2_2020_W4R12','major'],
  ['2020-08-14','2020-08-14','Major2_2020_Heat1','major'],
  ['2020-08-15','2020-08-15','Major2_2020_Heat2','major'],
  ['2020-08-16','2020-08-16','Major2_2020_Final','major'],
  ['2020-10-09','2020-10-09','Major3_2020_W1R1','major'],
  ['2020-10-11','2020-10-11','Major3_2020_W1R2','major'],
  ['2020-10-16','2020-10-16','Major3_2020_W2R1','major'],
  ['2020-10-18','2020-10-18','Major3_2020_W2R2','major'],
  ['2020-10-23','2020-10-23','Major3_2020_W3R1','major'],
  ['2020-10-25','2020-10-25','Major3_2020_W3R2','major'],
  ['2020-10-29','2020-10-29','Major3_2020_Heat1','major'],
  ['2020-10-31','2020-11-01','Major3_2020_Final','major'],
  ['2020-11-08','2020-11-08','NationsTrial','nations'], ['2020-11-15','2020-11-15','NationsQual','nations'], ['2020-11-22','2020-11-22','NationsFinal','nations']
];
const CC_SEASONS_2020=[{id:'S11', from:'2019-10-15', to:'2020-02-19'}, {id:'S12', from:'2020-02-20', to:'2020-06-16'}, {id:'S13', from:'2020-06-17', to:'2020-08-26'}, {id:'S14', from:'2020-08-27', to:'2020-12-01'}];
CAREER_YEAR_2020.forEach(r=>{ const m=/^Major(\d)_2020_/.exec(r[2]); if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-i'+m[1]+'.jpg'; });
const CC_SNAPSHOTS_2020=[{tag:'i1', from:CC_YEAR_2020_FROM, playIn:/2020 C2S[234] . Grand Finals/, lcq:/2020 C2S[234] . (Semi-Finals|Qualifier)/}];
var CC_MX_SPEC=CC_MX_SPEC||{};
CC_MX_SPEC[2020]={1:{set:'i1',name:'FNCS Chapter 2 Season 2',size:2,qual:false,weeks:[1,2,3,4],rounds:[{games:10,cut:50,open:true},{games:6,cut:0}],heats:[{day:1,cut:12},{day:1,cut:12},{day:2,cut:12},{day:2,cut:12}],heatGames:6,finalGames:12,island:'i1'},2:{set:'i2',name:'FNCS Chapter 2 Season 3',size:1,qual:true,weeks:[1,2,3,4],rounds:[{games:10,cut:100,open:true},{games:6,cut:0}],heats:[{day:1,cut:25},{day:1,cut:25},{day:2,cut:25},{day:2,cut:25}],heatGames:6,finalGames:12,island:'i2'},3:{set:'i3',name:'FNCS Chapter 2 Season 4',size:3,qual:false,weeks:[1,2,3],rounds:[{games:10,cut:33,open:true},{games:6,cut:0}],heats:[{day:1,cut:8},{day:1,cut:8},{day:1,cut:8},{day:1,cut:8}],heatGames:6,finalGames:12,island:'i3'}};
