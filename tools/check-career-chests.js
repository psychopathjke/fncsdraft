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
check('40 сундуков на карте, 4 редких', spots.length===40 && spots.filter(s=>s.rare).length===4, spots.length);
check('по каждому можно попасть пальцем', spots.every((s,i)=>spots.every((q,j)=>i===j || Math.hypot(s.x-q.x,s.y-q.y)>=6.5)));
check('внутри карты', spots.every(s=>s.x>=2 && s.x<=98 && s.y>=2 && s.y<=98));
// Частота монеты за месяц: 2 редких и 3 обычных в день.
{ let month=0, month20=0; const N=800;
  for(let t=0; t<N; t++){ CAREER.player.nick='P'+t; let hit=false, hit20=false;
    for(let d=1; d<=30; d++){ const k='2026-11-'+String(d).padStart(2,'0');
      const got=[0,1,2,3].map(i=>ccPirateChestRoll(k,i,1)).concat([...Array(36).keys()].map(i=>ccPirateChestRoll(k,i+4,0)));
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
const en0=careerEnergy(), vb0=CAREER.vb||0;
ccChestOpen();
check('карта с маркерами', document.querySelectorAll('#ccChestOv .cc-chm').length===40);
check('открыть карту бесплатно', careerEnergy()===en0);
const first0=ccPirateChestRoll(day,2,spots[2].rare);
ccChestPick(2);
check('первый сундук 20 энергии', en0-careerEnergy()===CC_CHEST_COST, en0-careerEnergy());
check(first0.none ? 'у пустого сундука сцены нет' : 'сцена открытия', !!document.getElementById('ccChestStage')===!first0.none, JSON.stringify(first0));
{ let k=-1; for(let i=3;i<40 && k<0;i++) if(ccPirateChestRoll(day,i,spots[i].rare).none) k=i; check('нашёлся пустой сундук', k>=0); CC_CHEST_BUSY=false; { const s=document.getElementById('ccChestStage'); if(s) s.remove(); } ccChestPick(k); check('пустой открылся без сцены', !document.getElementById('ccChestStage') && !CC_CHEST_BUSY && ccChestToday().opened.indexOf(k)>=0); }
const first=JSON.parse(localStorage.getItem('fncsdraft_career')).pirate.chest;
check('V-Bucks из сундука не падают', (CAREER.vb||0)===vb0, CAREER.vb);
check('итог сохранён сразу', first.day===day && first.opened[0]===2, JSON.stringify(first));
{ const n=ccChestToday().opened.length; CC_CHEST_BUSY=true; ccChestPick(39); check('пока идёт сцена, второй не открыть', ccChestToday().opened.length===n); CC_CHEST_BUSY=false; }
CC_CHEST_BUSY=false; const st=document.getElementById('ccChestStage'); if(st) st.remove();
const en1=careerEnergy();
CC_CHEST_BUSY=false; ccChestOpenAll();
check('кнопка открыла все', ccChestToday().opened.length===40 && ccChestLeft()===0, ccChestToday().opened.length);
check('V-Bucks и теперь те же', (CAREER.vb||0)===vb0, CAREER.vb);
check('дальше энергия не списывается', careerEnergy()===en1, careerEnergy()+' '+en1);
check('сцена суммы', !!document.getElementById('ccChestStage'));
CC_CHEST_BUSY=false; { const s=document.getElementById('ccChestStage'); if(s) s.remove(); }
{ const was=ccChestToday().opened.length; ccChestPick(7); ccChestOpenAll(); check('больше нечего открывать', ccChestToday().opened.length===was); CC_CHEST_BUSY=false; const s=document.getElementById('ccChestStage'); if(s) s.remove(); }
// Находки: 25% ничего, экраны и кирки в шкафчик.
{ const c={none:0,l:0,p:0,loot:0,coin:0}, names={}; for(let d=1;d<=30;d++) for(let i=0;i<2000;i++){ const x=ccPirateChestRoll('2026-11-'+String(d).padStart(2,'0'), i, 0); if(x.none) c.none++; else if(x.item) c[x.item.t]++; else if(x.coin) c.coin++; else if(x.loot){ c.loot++; names[x.loot.weapon.name]=1; } else c.bad=(c.bad||0)+1; }
  notes.drops=c; notes.guns=Object.keys(names).length; check('только оружие S43', Object.keys(names).every(n=>S43_WEAPON_NAMES.some(r=>r[0]===n)) && Object.keys(names).length===S43_WEAPON_NAMES.length, Object.keys(names).join()); check('нет ничего другого', !c.bad, c.bad); const N=60000; check('ничего около 25%', c.none/N>.22 && c.none/N<.28, c.none/N); check('экраны и кирки падают', c.l/N>.012 && c.p/N>.002, c.l+' '+c.p);
  const it=Object.assign({}, CC_CHEST_DROPS.l[0], {id:CC_CHEST_DROPS.l[0][0], t:'l', n:CC_CHEST_DROPS.l[0][1], r:CC_CHEST_DROPS.l[0][2]}); ccChestGive(it); check('предмет в шкафчике', ccFnOwn()[it.id] && ccFnOwn()[it.id].t==='l');
  check('баннер только у вещей', /cc-chf-bar/.test(ccChestFoundHTML({item:it})) && ccChestFoundHTML({none:1})===''); }
CC_CHEST_BUSY=false; ccChestClose();
check('плитка на сегодня погашена', (()=>{ const d=document.createElement('div'); d.innerHTML=careerTrainTabHTML(); const x=d.querySelector('.cc-dt.did b'); return x && x.textContent===T.map; })());
careerLoad();
check('после перезагрузки закрыто', ccChestLeft()===0);
ccChestOpen(); check('окно не открыть', !document.getElementById('ccChestOv'));
// Монета.
let cd=null, ci=-1, cr=0;
for(let t=0; t<60 && !cd; t++){ CAREER.player.nick='Coin'+t;
for(let d=1; d<=30 && !cd; d++){ const k='2026-11-'+String(d).padStart(2,'0'), sp=ccChestSpots(k);
  for(let i=0; i<sp.length; i++) if(ccPirateChestRoll(k,i,sp[i].rare).coin){ cd=k; ci=i; cr=sp[i].rare; break; } }
}
check('нашёлся день с монетой', !!cd);
if(cd){ CAREER.career.day=cd; CAREER.pirate.chest=null; if(careerEnergy()<CC_CHEST_COST) careerRestore(100);
  const v0=CAREER.vb; ccChestOpen(); ccChestPick(ci);
  check('монета нашлась', CAREER.pirate.found===cd, JSON.stringify(CAREER.pirate));
  check('монета не даёт V-Bucks', (CAREER.vb||0)===(v0||0));
  check('токен ещё не включён', !ccPirateOn());
  CC_CHEST_BUSY=false; ccChestCoin();
  check('баннер монеты', !!document.querySelector('#ccChestOv .cc-chb-card') && /PIRATE SHOP ACCESS/.test(document.querySelector('#ccChestOv .cc-chb-bar').textContent));
  await new Promise(r=>ccFnShopLoad(r));
  ccPirateActivate();
  check('14 дней пошли', ccPirateLeft()===14, ccPirateLeft());
  check('анимация включения', !!document.querySelector('#ccChestOv .cc-ch-stamp'));
  ccChestClose();
  check('монета больше не падает', !ccPirateChestRoll(cd,ci,cr).coin);
  // Два срока: первый использован, в этом году второго нет, в 2027 есть, третьего нет.
  check('первый срок занят', !ccPirateCanUse());
  CAREER.career.season=2; CAREER.career.day='2026-01-20';
  check('2027: прошлый срок кончился', ccPirateLeft()===0, ccPirateLeft());
  check('2027: второй срок доступен', ccPirateSlot()===2 && ccPirateCanUse());
  ccPirateActivate(); check('2027: 14 дней', ccPirateLeft()===14, ccPirateLeft()); ccChestClose();
  check('третьего нет', !ccPirateCanUse()); }
check('лут матча не тронут', typeof ccChestRoll==='function' && ccChestRoll.length!==ccPirateChestRoll.length, String(ccChestRoll.length));
{ const w=S43_WEAPON_POOL[0]; check('у стволов сезона есть иконки', S43_WEAPON_POOL.every(x=>/<img/.test(ccItemIconHTML(x,''))), S43_WEAPON_POOL.filter(x=>!/<img/.test(ccItemIconHTML(x,''))).map(x=>x.name).join()); check('карта лута', /cc-chl/.test(ccChestLootHTML({loot:{weapon:w,cons:S43_CONSUMABLE_POOL[0]}}))); }
// Магазин: при монете слово вместо нуля, без монеты обычная цена.
{ const pk=CAREER.pirate; CAREER.pirate=null; const off=ccFnTag(100); CAREER.pirate=pk; check('без монеты цена', /cc-vb-ic/.test(off) && /100/.test(off), off);
  if(ccPirateOn()){ const on=ccFnTag(0, 500); check('при монете слово', on.indexOf(ccChestT().freeW)>=0 && !/cc-vb-ic/.test(on) && /<s>/.test(on), on);
    const h=ccFnShopHTML(); notes.free=(h.match(/cc-fn-free/g)||[]).length; check('в витрине нет нулей', notes.free>10 && !/cc-vb-ic"><\/i>0</.test(h), notes.free); } }
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'chest-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
if(res.fails.length){ res.fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-career-chests');
