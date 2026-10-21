/* Магазин предметов в карьере (Notion «18.10»): настоящий магазин Fortnite дня (fn-shop.js), V-Bucks за деньги
   карьеры по цене Epic региона и времени, покупка, образ в шкафчике, скин значком в таблице матча, кирка в ленте.
   Запуск: node tools/check-career-item-shop.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const seed=(day, region, bal)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Shop', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:region, ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, size:2, year:+day.slice(0,4), year0:+day.slice(0,4), day:day, division:1, earnings:0, balance:bal, reach:0, tokens:[], log:[], news:[], seed:'shop'},
  partner:{card:card('M1',80), patience:60, since:'2023-11-01', dev:0}, partners:[{card:card('M1',80), patience:60, since:'2023-11-01', dev:0}]}));
  careerLoad(); };
await new Promise(r=>ccFnShopLoad(r));
check('данные магазина загрузились', typeof CC_FN_SHOP!=='undefined' && CC_FN_SHOP.items.length>5000, typeof CC_FN_SHOP);
// 1) Настоящий магазин дня: 10.03.2024 — Raven's Stare (Icon) в магазине; разные дни — разные витрины.
const d1=ccFnShopDay('2024-03-10'), d2=ccFnShopDay('2024-03-11');
notes.day={n1:d1.length, n2:d2.length, first:d1.slice(0,3).map(x=>x.name)};
check('10.03.2024: в витрине Raven’s Stare', d1.some(x=>/Raven's Stare/.test(x.name)), d1.slice(0,8).map(x=>x.name).join(', '));
check('витрина меняется по дням', d1.map(x=>x.id).join()!==d2.map(x=>x.id).join());
check('скины первыми', d1[0].t==='o', d1[0].t);
const fut=ccFnShopDay('2027-05-20');
check('дата позже данных — тот же день недели годом раньше, витрина не пуста', fut && fut.length>10, String(fut&&fut.length));
// 2) Наборы V-Bucks: эпоха и регион.
seed('2019-08-01', 'NAC', 5000); const p19=ccVbPacks();
seed('2022-05-01', 'NAC', 5000); const p22=ccVbPacks();
seed('2026-05-01', 'NAC', 5000); const p26=ccVbPacks();
seed('2026-05-01', 'EU', 5000); const p26eu=ccVbPacks();
seed('2026-05-01', 'BR', 5000); const p26br=ccVbPacks();
notes.packs={p19:p19[0], p22:p22[0], p26:p26[0], eu:p26eu[0], br:p26br[0]};
check('2019: 1000 за $9.99', p19[0].vb===1000 && p19[0].usd===9.99, JSON.stringify(p19[0]));
check('2022: 1000 за $7.99', p22[0].vb===1000 && p22[0].usd===7.99, JSON.stringify(p22[0]));
check('2026 после марта: 800 за $8.99', p26[0].vb===800 && p26[0].usd===8.99, JSON.stringify(p26[0]));
check('Европа дороже США, Бразилия дешевле', p26eu[0].usd>p26[0].usd && p26br[0].usd<p26[0].usd, p26eu[0].usd+' / '+p26br[0].usd);
// 3) Покупка: деньги → V-Bucks → предмет → образ.
seed('2024-03-10', 'EU', 100);
const bal0=CAREER.career.balance;
ccVbBuy(1);   // 2800 за $22.99 × 1.125
check('V-Bucks купились за деньги карьеры', CAREER.vb===2800 && Math.abs(CAREER.career.balance-(bal0-Math.round(22.99*1.125*100)/100))<0.01, CAREER.vb+' / '+CAREER.career.balance);
const sk=ccFnShopDay(careerToday()).find(x=>x.t==='o' && ccFnPrice(x)<=CAREER.vb);
ccFnBuy(sk.i);
check('скин куплен и надет', ccFnOwn()[sk.id] && ccFnEq().o===sk.id && CAREER.vb===2800-ccFnPrice(sk), JSON.stringify({own:!!ccFnOwn()[sk.id], eq:ccFnEq().o, vb:CAREER.vb}));
const pa=ccFnShopDay(careerToday()).find(x=>x.t==='p' && ccFnPrice(x)<=CAREER.vb);
if(pa){ ccFnBuy(pa.i); check('кирка куплена и надета', ccFnEq().p===pa.id, ccFnEq().p); check('кирка — в ленте убийств', window.CC_FN_AXE && window.CC_FN_AXE.indexOf(pa.id.toLowerCase())>0, String(window.CC_FN_AXE)); }
const vbNow=CAREER.vb; ccFnBuy(sk.i);
check('купленное второй раз не продаётся', CAREER.vb===vbNow, CAREER.vb+' vs '+vbNow);
const old=ccFnShopDay('2019-08-01').find(x=>!ccFnShopDay(careerToday()).some(y=>y.id===x.id));
ccFnBuy(old.i);
check('предмет не из сегодняшней витрины не продаётся', !ccFnOwn()[old.id], old.name);
careerSave(); careerLoad();
check('после сохранения всё на месте', CAREER.vb===vbNow && CAREER.fnEq && CAREER.fnEq.o===sk.id, JSON.stringify(CAREER.fnEq));
// 4) Экраны: раздел магазина, V-Bucks в шапке, образ в шкафчике.
openCareerHub(); ccFnShopOpen();
const shopTxt=(document.querySelector('#screen-career-hub')||document.body).innerHTML;
check('раздел «Магазин предметов» с карточками', /cc-fn-it/.test(shopTxt) && /cc-vb-pack/.test(shopTxt));
check('V-Bucks в шапке рядом с балансом', /ch-vb/.test(shopTxt));
const lock=ccLockerHTML();
check('образ в шкафчике со скином', /cc-fn-load/.test(lock) && lock.indexOf(sk.id.toLowerCase())>0);
ccFnPick('o'); check('выбор из купленного открывается', /cc-(fn|lk5)-pick/.test(ccLockerHTML()));
// Шкафчик своей вкладкой: выбор скина открыт сразу, купленный скин в нём.
CC_FN_PICK=null; careerTab('locker');
const lb=document.getElementById('chBody').innerHTML;
check('вкладка «Шкафчик»: образ и выбор скина сразу', /cc-fn-load/.test(lb) && /cc-(fn|lk5)-pick/.test(lb) && lb.indexOf(sk.id.toLowerCase())>0);
check('кнопка вкладки есть', !!document.querySelector('.ch-tab[data-tab="locker"]'));
// Item Shop — своя вкладка рядом со шкафчиком, в обычном магазине его раздела больше нет.
const tabs=[...document.querySelectorAll('#screen-career-hub .ch-tab')].map(b=>b.dataset.tab);
check('вкладка Item Shop перед шкафчиком', tabs.indexOf('items')>=0 && tabs.indexOf('items')+1===tabs.indexOf('locker'), tabs.join(','));
careerTab('items'); check('во вкладке Item Shop витрина дня', /cc-fn-it/.test(document.getElementById('chBody').innerHTML));
careerTab('shop'); check('в магазине нет раздела предметов', !/cc-fn-it/.test(document.getElementById('chBody').innerHTML) && !/ccShopSec\('items'\)/.test(document.getElementById('chBody').innerHTML));
// После покупки в магазине — кнопка «Надеть в шкафчике».
const em=ccFnShopDay(careerToday()).find(x=>x.t==='e' && !ccFnOwn()[x.id]);
if(em){ CAREER.vb=(CAREER.vb||0)+5000; ccFnBuy(em.i); check('после покупки кнопка «Надеть в шкафчике»', /cc-fn-tolock/.test(document.getElementById('chBody').innerHTML)); }
ccFnEquip('o', null); check('скин снимается', !ccFnEq().o);
// 5) Вид магазина по времени (ccFnShopEra.v, 21.10 — по скриншотам игры): a/b/c — «Рекомендуемые/Ежедневные», d — New Design,
//    e — осень 2023, og — Season OG, f — Глава 5+ (с 9.04.2024 без редкости), g — 2026 (баннер набора с середины апреля).
const eras={};
[['2019-06-01','c1',1,'a'],['2019-09-10','c1',1,'b'],['2020-06-01','c2',2,'c'],['2022-06-01','c3',3,'d'],['2023-06-01','c3',4,'d'],['2023-10-12','c3',4,'e'],['2023-11-10','c5',4,'og'],['2024-06-01','c5',5,'f'],['2026-05-01','c5',7,'g']].forEach(([d,k,ch,v])=>{
  seed(d, 'EU', 100); const e=ccFnShopEra(d); eras[d]=e.k+'/'+e.ch;
  check(d+': вид '+k+'/'+v+', глава '+ch, e.k===k && e.ch===ch && e.v===v, e.k+'/'+e.v+'/'+e.ch);
  const h=ccFnShopHTML(); check(d+': класс вида в разметке', h.indexOf('cc-fn-shop cc-fs-'+v)>0);
  if(v==='a' || v==='b' || v==='c') check(d+': разделы Featured/Daily', h.indexOf(L().ccFnFeatured)>0 && h.indexOf(L().ccFnDaily)>0);
});
notes.eras=eras;
// Баннер набора — только с середины апреля 2026.
{ seed('2026-05-01', 'EU', 100); const b=document.createElement('div'); b.innerHTML=ccFnShopHTML(); check('2026-05-01: баннер набора', !!b.querySelector('.cc-fn-hero-offer'));
  seed('2026-03-01', 'EU', 100); const c=document.createElement('div'); c.innerHTML=ccFnShopHTML(); check('2026-03-01: баннера ещё нет', !c.querySelector('.cc-fn-hero-offer')); }
// 6) Разделы по наборам, как в игре: 10.03.2024 — раздел «Eminem» со скином (большая плитка) и его рюкзаком/киркой рядом.
seed('2024-03-10', 'EU', 100);
const box=document.createElement('div'); box.innerHTML=ccFnShopHTML();
const secs=[...box.querySelectorAll('.cc-fn-sec')].map(s=>({h:(s.querySelector('h5 span')||s.querySelector('h5')).textContent, big:[...s.querySelectorAll('.cc-fn-it.big b')].map(b=>b.textContent), sm:[...s.querySelectorAll('.cc-fn-it.sm b')].map(b=>b.textContent)}));
notes.sets=secs.slice(0,4).map(s=>s.h+': '+s.big.length+'+'+s.sm.length);
const emi=secs.find(s=>s.h==='Eminem');
check('раздел набора «Eminem»', emi && emi.big.includes('Slim Shady') && emi.sm.includes("Raven's Stare") && emi.sm.includes("Axe 'Bout Me"), JSON.stringify(emi));
check('скины без набора не в куче с кирками', secs.every(s=>!(s.big.length && s.h===L().ccFnTypes_p)));
// Шкафчик в виде своей главы: класс главы, большой образ с надетым скином, разделы «Персонаж» и «Эмоции · Обёртки».
// С Главы 5 — шкафчик нынешнего Fortnite (cc-lk5): модель справа, CHARACTER (4 ячейки) и EMOTES (2).
{ const sk2=ccFnShopDay(careerToday()).find(x=>x.t==='o'); CAREER.vb=5000; ccFnBuy(sk2.i);
  const lk=document.createElement('div'); lk.innerHTML=ccFnLoadoutHTML();
  check('шкафчик 2024 — тёмный вид', !!lk.querySelector('.cc-fn-load.cc-fn-c5'));
  check('большой образ с надетым скином', !!lk.querySelector('.cc-lk5-stage img') && lk.querySelector('.cc-lk5-stage').innerHTML.indexOf(sk2.id.toLowerCase())>0);
  check('разделы шкафчика', lk.querySelectorAll('.cc-lk5-grid').length===2 && lk.querySelectorAll('.cc-lk5-grid .cc-lk5-slot').length===6); }
seed('2019-06-01', 'EU', 100); box.innerHTML=ccFnShopHTML();
check('шкафчик 2019 — вид Главы 1', /cc-fn-load cc-fn-c1/.test(ccFnLoadoutHTML()));
check('Глава 1: «Ежедневные» ровными квадратами', !!box.querySelector('.cc-fn-grid.daily') && !box.querySelector('.cc-fn-grid.daily .big'));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cis-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-item-shop'); process.exit(res.fails.length?1:0);
