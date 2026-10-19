/* Регены (Notion «19.10», тестер: «как в фифе добавить регенов… реген месси»).
   1) До 2027-го (настоящие данные) никто не уходит и регенов нет.
   2) С 2027-го часть сцены уходит, свои напарники — нет; на месте ушедших звёзд — регены той же страны и региона.
   3) Решение лежит в сейве: перезагрузка даёт ту же сцену, повторно не считается.
   4) Ушедших нет ни в сцене, ни в пуле лобби; регены — в сцене и в парах Дивизиона 1.
   5) Регену 16–17 в год появления, на год старше через год; в профиле — «Реген X», без чужой истории.
   6) Ники регенов не совпадают с настоящими и проходят фильтр таблицы дня.
   Запуск: node tools/check-career-regens.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const {badNick}=require('../server/src/nick-filter.js');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const pl={nick:'Rgn', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:87, role:'roleIGL', attrs:ccRookieAttrs(87,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
const mate={card:{handle:'Queasy', region:'EU', rating:95, _ovr:95, nat:'de', tier:'ladder', event:'ladder'}, patience:60, since:'2026-01-01', dev:0};
const seed=(season)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
  career:{season:season, size:2, year:2026, year0:2026, day:'2026-03-01', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'rg'},
  partners:[mate]})); careerLoad(); };
// 1) Первый сезон 2026-го.
seed(1); ccSceneRoster('EU');
check('2026: регенов нет', !CAREER.career.regen && !ccSceneRoster('EU').some(c=>c._regen));
// 2) Третий сезон (2028).
// Без даты рождения в 2026 — 18 (его слово 19.10), до 30 уходят единицы: в 2028 сцена почти та же.
seed(3); ccSceneRoster('EU'); notes.out2028=Object.keys((CAREER.career.regen||{out:{}}).out).length;
check('2028: почти никто не ушёл', notes.out2028<100, notes.out2028);
// 2) Тринадцатый сезон (2038): неизвестным по 30, уходят массово.
seed(13); const eu=ccSceneRoster('EU'); const R=CAREER.career.regen;
check('посчитано до 2038', R && R.y===12, R && R.y);
const out=Object.keys(R.out).length, list=R.list.length;
notes.out=out; notes.regens=list; notes.euRegens=eu.filter(c=>c._regen).length;
check('часть сцены ушла', out>300 && out<20000, out);
check('регены есть', list>100, list);
check('напарник не ушёл', !R.out.queasy);
check('ушедших нет в сцене', !eu.some(c=>R.out[hKey(c)] && !c._regen));
check('ушедших нет в пуле лобби', !ccEuCards().some(c=>R.out[hKey(c)] && !c._regen));
const stars=R.list.filter(g=>g.of && g.o0>=75);
check('у регена звезды — страна и регион исходника', stars.length>0 && stars.every(g=>g.nat!==undefined && g.reg), stars.length);
// Ник: не настоящий, без повторов.
const real=new Set(PLAYERS.map(p=>hKey(p)));
check('ники регенов не совпадают с настоящими', !R.list.some(g=>real.has(hKey(g.h))), R.list.filter(g=>real.has(hKey(g.h))).map(g=>g.h).slice(0,3).join());
check('ники регенов без повторов', new Set(R.list.map(g=>hKey(g.h))).size===R.list.length);
notes.names=R.list.map(g=>g.h);
// 5) Возраст.
const g1=R.list.find(g=>g.y===11), g2=R.list.find(g=>g.y===12);
check('реген прошлого года стал на год старше', g1 && ccAgeNow(g1.h)===g1.a+1, g1 && (g1.h+' '+ccAgeNow(g1.h)+' / '+g1.a));
check('реген этого года — 16–17', g2 && ccAgeNow(g2.h)===g2.a && g2.a>=16 && g2.a<=17, g2 && ccAgeNow(g2.h));
// Профиль.
const top=eu.filter(c=>c._regen && c.regenOf).sort((a,b)=>b._ovr-a._ovr)[0];
ccPeekByHandle(top.handle);
const peek=document.getElementById('cardPeekBody').innerText;
check('в профиле — чей реген', peek.toLowerCase().indexOf(String(top.regenOf).toLowerCase())>=0, peek.slice(0,80));
check('в профиле нет чужих финалов', !/Grand Finals|Гранд-финал|real data/i.test(peek), peek.slice(0,200));
// Лента.
check('в ленте есть регены', (CAREER.career.news||[]).some(n=>n.k==='ccNewsRegen'));
// 4) Пары Дивизиона 1.
CC_POOLS=null; const P=careerPools();
const rk=new Set(R.list.map(g=>hKey(g.h)));
notes.regenInDuos=P.duos.reduce((n,d)=>n+d.cards.filter(c=>rk.has(hKey(c))).length, 0);
check('регены играют в парах', notes.regenInDuos>0, notes.regenInDuos);
check('ушедших нет в парах', !P.duos.some(d=>d.cards.some(c=>R.out[hKey(c)] && !rk.has(hKey(c)))));
// 3) Перезагрузка — то же самое, без пересчёта.
const snap=JSON.stringify(R);
careerSave(); careerLoad(); ccSceneRoster('EU');
check('перезагрузка — та же сцена', JSON.stringify(CAREER.career.regen)===snap);
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'crg-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
const bad=(res.notes.names||[]).filter(badNick);
if(bad.length) res.fails.push('ник регена не проходит фильтр таблицы: '+bad.slice(0,5).join(', '));
delete res.notes.names;
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-regens'); process.exit(res.fails.length?1:0);
