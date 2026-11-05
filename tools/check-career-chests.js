// Пиратские сундуки S43: плитка только в S43 и второй в сетке, открыть можно все сундуки дня, энергия один раз, настоящие точки
// на острове, Math.random не тратит, перезагрузка не перебрасывает, монета включает токен на 14 дней и больше не падает.
//   node tools/check-career-chests.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const save=day=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null},
  career:{season:1, size:2, year:2026, year0:2026, day:day, seasonOver:false, division:5, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'chest'},
  partner:{card:card('M1',80), patience:60, since:'2026-01-01', dev:0}, partners:[{card:card('M1',80), patience:60, since:'2026-01-01', dev:0}]}));
  CC_POOLS=null; careerLoad(); careerMigrateSize(); careerMigrateClock(); };
const tiles=()=>{ const d=document.createElement('div'); d.innerHTML=careerTrainTabHTML(); return [...d.querySelectorAll('.cc-disc .cc-dt b')].map(b=>b.textContent); };
const T=ccChestT();
check('точки сундуков на месте', CC_S43_CHESTS.n.length/2>700 && CC_S43_CHESTS.r.length/2>=30, CC_S43_CHESTS.n.length/2+' '+CC_S43_CHESTS.r.length/2);
save('2026-08-21');
check('в S42 плитки нет', tiles().indexOf(T.map)<0, tiles().join());
ccChestOpen(); check('в S42 нельзя открыть', !document.getElementById('ccChestOv'));
save('2026-11-03');
check('в S43 плитка вторая', tiles()[1]===T.map, tiles().join());
const day=careerToday(), spots=ccChestSpots(day);
notes.spots=spots.length;
check('18 сундуков на карте, 2 редких', spots.length===18 && spots.filter(s=>s.rare).length===2, spots.length);
check('по каждому можно попасть пальцем', spots.every((s,i)=>spots.every((q,j)=>i===j || Math.hypot(s.x-q.x,s.y-q.y)>=9)));
check('внутри карты', spots.every(s=>s.x>=2 && s.x<=98 && s.y>=2 && s.y<=98));
// Частота монеты за месяц: 2 редких и 3 обычных в день.
{ let month=0, month20=0; const N=800;
  for(let t=0; t<N; t++){ CAREER.player.nick='P'+t; let hit=false, hit20=false;
    for(let d=1; d<=30; d++){ const k='2026-11-'+String(d).padStart(2,'0');
      const got=[0,1].map(i=>ccPirateChestRoll(k,i,1)).concat([...Array(16).keys()].map(i=>ccPirateChestRoll(k,i+2,0)));
      if(got.some(x=>x.coin)){ hit=true; if(d<=20) hit20=true; } }
    if(hit) month++; if(hit20) month20++; }
  CAREER.player.nick='Probe'; CC_POOLS=null;
  notes.month=month/N; notes.days20=month20/N;
  check('за месяц примерно 2 из 3', month/N>0.55 && month/N<0.8, month/N); }
// Открытие: энергия один раз, все сундуки, без Math.random, тот же итог.
const realRandom=Math.random; let drawn=0; Math.random=function(){ drawn++; return realRandom(); };
const a=JSON.stringify(ccChestSpots(day)), b=JSON.stringify(ccPirateChestRoll(day,3,0));
Math.random=realRandom;
check('сундуки и лут не тратят Math.random', drawn===0, drawn);
check('сундуки дня те же', a===JSON.stringify(ccChestSpots(day)) && b===JSON.stringify(ccPirateChestRoll(day,3,0)));
const en0=careerEnergy(); let vb=CAREER.vb||0;
ccChestOpen();
check('карта с маркерами', document.querySelectorAll('#ccChestOv .cc-chm').length===18);
check('открыть карту бесплатно', careerEnergy()===en0);
ccChestPick(2);
check('первый сундук 20 энергии', en0-careerEnergy()===CC_CHEST_COST, en0-careerEnergy());
check('сцена открытия', !!document.getElementById('ccChestStage'));
const first=JSON.parse(localStorage.getItem('fncsdraft_career')).pirate.chest;
check('итог сохранён сразу', first.day===day && first.opened[0]===2, JSON.stringify(first));
ccChestPick(3); check('пока идёт сцена, второй не открыть', ccChestToday().opened.length===1);
CC_CHEST_BUSY=false; const st=document.getElementById('ccChestStage'); if(st) st.remove();
const en1=careerEnergy();
const vbBefore=CAREER.vb, wantAll=spots.reduce((a,s,i)=>a+(ccChestToday().opened.indexOf(i)>=0 ? 0 : (ccPirateChestRoll(day,i,s.rare).vb||0)),0);
CC_CHEST_BUSY=false; ccChestOpenAll();
check('кнопка открыла все', ccChestToday().opened.length===18 && ccChestLeft()===0, ccChestToday().opened.length);
check('сумма V-Bucks сошлась', CAREER.vb-vbBefore===wantAll, (CAREER.vb-vbBefore)+' '+wantAll);
check('дальше энергия не списывается', careerEnergy()===en1, careerEnergy()+' '+en1);
check('сцена суммы', !!document.getElementById('ccChestStage'));
CC_CHEST_BUSY=false; { const s=document.getElementById('ccChestStage'); if(s) s.remove(); }
const n5=CAREER.vb; ccChestPick(7); ccChestOpenAll();
check('больше нечего открывать', CAREER.vb===n5);
CC_CHEST_BUSY=false; ccChestClose();
check('плитка на сегодня погашена', (()=>{ const d=document.createElement('div'); d.innerHTML=careerTrainTabHTML(); const x=d.querySelector('.cc-dt.did b'); return x && x.textContent===T.map; })());
careerLoad();
check('после перезагрузки закрыто', ccChestLeft()===0);
ccChestOpen(); check('окно не открыть', !document.getElementById('ccChestOv'));
// Монета.
let cd=null, ci=-1, cr=0;
for(let d=1; d<=30 && !cd; d++){ const k='2026-11-'+String(d).padStart(2,'0'), sp=ccChestSpots(k);
  for(let i=0; i<sp.length; i++) if(ccPirateChestRoll(k,i,sp[i].rare).coin){ cd=k; ci=i; cr=sp[i].rare; break; } }
check('нашёлся день с монетой', !!cd);
if(cd){ CAREER.career.day=cd; CAREER.pirate.chest=null; if(careerEnergy()<CC_CHEST_COST) careerRestore(100);
  const v0=CAREER.vb; ccChestOpen(); ccChestPick(ci);
  check('монета нашлась', CAREER.pirate.found===cd, JSON.stringify(CAREER.pirate));
  check('монета не даёт V-Bucks', CAREER.vb===v0);
  check('токен ещё не включён', !ccPirateOn());
  CC_CHEST_BUSY=false; ccChestCoin();
  check('баннер монеты', !!document.querySelector('#ccChestOv .cc-chb-card') && /PIRATE SHOP ACCESS/.test(document.querySelector('#ccChestOv .cc-chb-bar').textContent));
  await new Promise(r=>ccFnShopLoad(r));
  ccPirateActivate();
  check('14 дней пошли', ccPirateLeft()===14, ccPirateLeft());
  check('анимация включения', !!document.querySelector('#ccChestOv .cc-ch-stamp'));
  ccChestClose();
  check('монета больше не падает', !ccPirateChestRoll(cd,ci,cr).coin); }
check('лут матча не тронут', typeof ccChestRoll==='function' && ccChestRoll.length!==ccPirateChestRoll.length, String(ccChestRoll.length));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'chest-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
if(res.fails.length){ res.fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-career-chests');
