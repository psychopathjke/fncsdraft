/* Главы по кругу и формат года после 2026 (Notion «24.10.26», игрок: «после 7 главы главы (карты) идут по кругу
   6-7-6-7»; его ответ: «после 7 главы были другие карты… чтоб игрок выбирал мод, в котором играть»).
   1) 2026 — как было (m1/m2/s42 в дуо, t1–t3 в трио).
   2) 2027 — Глава 1 при любом размере, 2028 — Глава 2, 2034 — Глава 7 и в трио, 2035 — снова Глава 1.
   3) Подпись лобби — глава острова; даты прошлых лет (кирки FNCS) своих сезонов не меняют.
   4) На стыке в 2027 открывается выбор формата; сквад садит троих и играет неделю.
   Запуск: node tools/check-career-chapter-cycle.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const pl={nick:'Cyc', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
const mate={card:{handle:'Queasy', region:'EU', rating:95, _ovr:95, nat:'de', tier:'ladder', event:'ladder'}, patience:60, since:'2026-01-01', dev:0};
const seed=(season, size, day)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
  career:{season:season, size:size, year:2026, year0:2026, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'cy'},
  partners:size===3 ? [mate, {card:{handle:'Vadeal', region:'EU', rating:90, _ovr:90, tier:'ladder', event:'ladder'}, patience:60, since:'2026-01-01', dev:0}] : [mate]})); careerLoad(); };
const at=(season, size, day)=>{ seed(season, size, day); return careerBrSet(); };
check('2026 дуо весной — m1', at(1, 2, '2026-02-01')==='m1', at(1, 2, '2026-02-01'));
check('2026 трио летом — t3', at(1, 3, '2026-07-15')==='t3', at(1, 3, '2026-07-15'));
check('2027 дуо зимой — g5', at(2, 2, '2026-02-01')==='g5', at(2, 2, '2026-02-01'));
check('2027 трио летом — g7', at(2, 3, '2026-07-01')==='g7', at(2, 3, '2026-07-01'));
check('2027 осень — h1', at(2, 2, '2026-10-01')==='h1', at(2, 2, '2026-10-01'));
check('2028 весна — i1', at(3, 3, '2026-04-01')==='i1', at(3, 3, '2026-04-01'));
check('2031 — Глава 4', at(6, 2, '2026-04-01')==='e2', at(6, 2, '2026-04-01'));
check('2034 трио — Глава 7', at(9, 3, '2026-07-01')==='m2', at(9, 3, '2026-07-01'));
check('2035 — снова Глава 1', at(10, 2, '2026-02-01')==='g5', at(10, 2, '2026-02-01'));
// Подпись и сезон.
seed(4, 2, '2026-07-01');
notes.lobby2029=ccLobbySeasonName(careerToday()).a;
check('2029 лето — Глава 2 сезон 7', ccSeasonNumOn(careerToday())===17 && /CHAPTER 2/.test(notes.lobby2029), notes.lobby2029);
check('соло-вечер года — на острове главы', careerSoloSet()==='j3', careerSoloSet());
check('кирка FNCS прошлых лет — своего сезона', ccSeasonNumOn('2019-07-28')!==ccSeasonNumOn('2026-07-01'));
// Формат года: стык 2026 → 2027.
seed(1, 2, '2026-11-30');
careerNewSeason();
const cr=CAREER.career;
check('2027: выбор открыт', ccFmtYearCan(), cr.fmtOpen+' '+cr.season);
ccFmtYearOpen();
const fm=document.getElementById('ccFmtModal');
check('окно формата: три кнопки, текущий отмечен', fm && fm.querySelectorAll('button').length===3 && fm.querySelector('button.on'), fm && fm.innerHTML.slice(0,200));
ccFmtYearSet(4);
check('окно закрылось', !document.getElementById('ccFmtModal'));
check('сквад выбран', careerSquadSize()===4 && cr.sizes[cr.season]===4, careerSquadSize());
check('выбор закрыт после выбора', !ccFmtYearCan());
notes.squad=careerMates().map(c=>c && c.handle);
check('в скваде трое напарников', careerMates().filter(Boolean).length===3, notes.squad.join());
check('остров сквада — Глава 1', careerBrSet()==='g5', careerBrSet());
const before=(cr.log||[]).length;
await careerFastForward(45);
for(let i=0;i<200 && typeof CC_FF!=='undefined' && CC_FF; i++) await new Promise(r=>setTimeout(r, 50));
const mine=(cr.log||[]).slice(before);
notes.played=mine.map(e=>e.day+' '+(e.kind||e.type||'')+' #'+e.place+'/'+e.of);
check('сквад сыграл вечера', mine.length>0, mine.length);
check('место в поле у каждого вечера', mine.every(e=>e.place>0 && e.of>1), notes.played.join(' | '));
check('ошибок вечера нет', !document.querySelector('.cc-ffo-err'), (document.querySelector('.cc-ffo-err')||{}).textContent);
// Перезагрузка помнит формат.
careerSave(); careerLoad();
check('после перезагрузки — сквад', careerSquadSize()===4);
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'ccy-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '900000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log(JSON.stringify(res.notes, null, 1));
res.fails.forEach(f=>console.log('  FAIL '+f));
console.log(res.fails.length ? res.fails.length+' failing' : 'ok');
process.exit(res.fails.length ? 1 : 0);
