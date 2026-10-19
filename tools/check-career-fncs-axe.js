/* Кирки в карьере (Notion «19.10», скрины 37–38).
   1) Дефолты в шкафчике у всех: Default Pickaxe и Recruit; Recruit Главы 2 — только с её начала.
   2) Победа в FNCS даёт кирку чемпиона своего сезона (ccFncsAxeFor) и надевает её; строка в шкафчике своя.
   3) Сейв со старой строкой «Axe of Champions» перечитывается молча, кирка своего сезона в шкафчике, баннеры не двоятся.
   4) В матче слот кирки — надетая кирка, без неё — дефолтная.
   Запуск: node tools/check-career-fncs-axe.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const ax=d=>ccFncsAxeFor(d).name;
notes.axes={'2019-09-22':ax('2019-09-22'), '2020-08-30':ax('2020-08-30'), '2022-05-29':ax('2022-05-29'),
  '2024-11-24':ax('2024-11-24'), '2025-08-30':ax('2025-08-30'), '2026-09-27':ax('2026-09-27')};
check('2019: первая кирка FNCS', ax('2019-09-22')==='The Axe of Champions', ax('2019-09-22'));
check('C3S2: Axe of Champions 2.0', ax('2022-05-29')==='The Axe of Champions 2.0', ax('2022-05-29'));
check('Remix: Blade of Champions', ax('2024-11-24')==='Blade of Champions', ax('2024-11-24'));
check('C6S4-5 конец августа 2025: Axe 3.0', ax('2025-08-30')==='The Axe of Champions 3.0', ax('2025-08-30'));
const pl={nick:'Axer', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
const seed=(day, extra)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify(Object.assign({v:1, player:pl,
  career:{season:1, size:2, year:2026, year0:2026, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ax'},
  partners:[]}, extra||{}))); careerLoad(); };
// 1) Дефолты.
seed('2019-07-01'); ccFnDefaults();
let own=CAREER.fnOwn||{};
check('дефолтная кирка есть', own.DefaultPickaxe && own.DefaultPickaxe.t==='p');
check('Recruit Главы 1 есть', own.CID_001_Athena_Commando_F_Default && own.CID_001_Athena_Commando_F_Default.t==='o');
check('Recruit Главы 2 до её начала нет', !own.CID_556_Athena_Commando_F_RebirthDefaultA);
seed('2026-04-20'); ccFnDefaults(); own=CAREER.fnOwn;
check('Recruit Главы 2 в 2026 есть', !!own.CID_556_Athena_Commando_F_RebirthDefaultA);
// 4a) Без надетой — в матче дефолтная.
CAREER_RUN=true;
const kitAxe=()=>{ const x=ccKitAxe(); return x.n+' | '+x.src; };
let k=kitAxe(); notes.kitDefault=k;
check('в матче без надетой — Default Pickaxe', /^Default Pickaxe \| .*defaultpickaxe/.test(k), k);
// 2) Победа в финале Мейджора.
const cr=CAREER.career;
ccLockerCheck();
cr.log.push({season:1, day:'2026-04-26', kind:'major', stage:'final', place:1, of:100, div:1, pts:400});
careerRenderHub('centre');
const want=ccFncsAxeFor('2026-04-26'); notes.won=want.name;
check('кирка в шкафчике', CAREER.fnOwn[want.id] && CAREER.fnOwn[want.id].t==='p');
check('кирка надета', CAREER.fnEq.p===want.id, CAREER.fnEq.p);
check('строка шкафчика своя', cr.locker.some(x=>x.id==='axe|'+want.id && x.name===want.name));
check('пост о награде', (cr.news||[]).some(n=>n.k==='ccNewsLocker'));
k=kitAxe(); notes.kitWon=k;
check('в матче — кирка из шкафчика', k.indexOf(want.name)===0 && k.toLowerCase().indexOf(want.id.toLowerCase())>=0, k);
// Victory Umbrella: первая победа сезона — зонтик сезона, один на сезон.
cr.log.push({season:1, day:'2026-05-10', kind:'victory', place:3, of:100, div:1, pts:200, wins:1});
cr.log.push({season:1, day:'2026-05-11', kind:'victory', place:1, of:100, div:1, pts:250, wins:2});
careerRenderHub('centre');
const um=ccUmbrellaFor('2026-05-10'); notes.umbrella=um.n+' '+um.name;
check('зонтик сезона в шкафчике', CAREER.fnOwn[um.id] && CAREER.fnOwn[um.id].t==='g', um.id);
check('зонтик — одна строка на сезон', cr.locker.filter(x=>x.id==='umb|'+um.id).length===1 && cr.locker.find(x=>x.id==='umb|'+um.id).x===1);
check('зонтик S11 — Downpour', ccUmbrellaFor('2020-01-10').name==='Downpour', ccUmbrellaFor('2020-01-10').name);
// 3) Старый сейв.
seed('2026-10-01', {});
CAREER.career.log=[{season:1, day:'2025-08-30', kind:'globals', place:1, of:50, div:1, lan:true},
                   {season:1, day:'2026-04-26', kind:'major', stage:'final', place:1, of:100, div:1}];
CAREER.career.locker=[{id:'axe', kind:'pickaxe', name:'Axe of Champions', x:2}, {id:'gf1', kind:'banner', name:'FNCS Grand Finalist', x:1}];
CAREER.career.lockSeen=2; CAREER.career.news=[];
careerRenderHub('centre');
const L2=CAREER.career.locker;
notes.migrated=L2.map(x=>x.id+' x'+x.x);
check('старая строка снята', !L2.some(x=>x.id==='axe'));
check('кирки сезонов выданы', L2.filter(x=>x.kind==='pickaxe').length===2, L2.filter(x=>x.kind==='pickaxe').length);
check('баннер не задвоен', (L2.find(x=>x.id==='gf1')||{x:0}).x===1, JSON.stringify(L2.find(x=>x.id==='gf1')));
check('перечитано молча', !(CAREER.career.news||[]).some(n=>n.k==='ccNewsLocker'));
CAREER_RUN=false;
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cax-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-fncs-axe'); process.exit(res.fails.length?1:0);
