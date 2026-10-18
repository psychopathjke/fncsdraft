/* Новая глава — настоящий год (Notion «17.10»: «команды не все как в жизни в новых главах»,
   «типы на европе фнкс выиграли, а у них 70 рейтинга»).
   1) Сейв, стоящий в новой главе по старому правилу (люди года старта), при загрузке переходит
      на сцену года календаря: книги роста сжаты (половина, не дальше ±3), тройки пересеяны.
   2) Стык свежей карьеры сжимает книги ровно один раз — повторная загрузка их не трогает.
   3) Рейтинг в сцене новой главы — настоящий рейтинг года, ±3 за прошлую главу.
   Запуск: node tools/check-career-new-chapter.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const pl={nick:'Chap', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
// 1) Старый сейв: карьера 2021-го в 2023-м, книги большие, тройки посеяны из людей 2021-го.
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
  career:{season:3, size:2, year:2023, year0:2021, day:'2023-03-01', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'nc',
    triosSeeded:'old', trioCores:[['a','b']], trios:{'a+b':'c'}},
  partners:[], dev:{'malibuca':8, 'th0mashd':-6, 'pinq':1}, devL:{'zzbot':5}, devV:2}));
careerLoad();
check('год сцены — 2023', ccNowYear()===2023 && ccChapterMoved(), ccNowYear());
check('книга: +8 → +3, −6 → −3, +1 → +0.5', CAREER.dev.malibuca===3 && CAREER.dev.th0mashd===-3 && CAREER.dev.pinq===0.5, JSON.stringify(CAREER.dev));
check('книга выдуманных: +5 → +2.5', CAREER.devL.zzbot===2.5, JSON.stringify(CAREER.devL));
check('тройки пересеваются', CAREER.career.triosSeeded!=='old' && !(CAREER.career.trioCores||[]).some(c=>c[0]==='a'), CAREER.career.triosSeeded);
check('глава записана', CAREER.career.chapterY===2023, CAREER.career.chapterY);
careerSave(); careerLoad();
check('повторная загрузка не сжимает снова', CAREER.dev.malibuca===3 && CAREER.dev.pinq===0.5, JSON.stringify(CAREER.dev));
// 2) Свежая карьера 2022-го на стыке: книга сжимается один раз.
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
  career:{season:1, size:2, year:2022, year0:2022, day:'2022-11-01', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'nc2'},
  partners:[], dev:{'malibuca':4}, devV:2}));
careerLoad();
check('до стыка книга целая', CAREER.dev.malibuca===4, JSON.stringify(CAREER.dev));
careerNewSeason();
check('после стыка — половина', CAREER.dev.malibuca===2, JSON.stringify(CAREER.dev));
careerSave(); careerLoad();
check('и не дважды', CAREER.dev.malibuca===2, JSON.stringify(CAREER.dev));
// 3) Рейтинги сцены — настоящие года, ±3.
CC_POOLS=null; const P=careerPools();
// 18.10: внутри своего года — рейтинг сезона того же дня (ccRatingSnap), как у свежей карьеры того дня.
const SO=ccRatingSnap() ? ccSeasonOvr() : null;
const T=SO ? new Map([...P.players].map(c=>[c._k||hKey(c), SO.get(ccSeasonKey(c))]).filter(e=>e[1]!=null)) : ccRealTargets(ccCalYear());
let n=0, worst=0, who='';
P.players.forEach(c=>{ const t=T.get(c._k||hKey(c)); if(t==null) return; n++; const g=Math.abs(c._ovr-t); if(g>worst){ worst=g; who=c.handle+' '+c._ovr+'/'+t; } });
notes.players=n; notes.worst=worst;
check('рейтинг сцены = настоящий ±3', n>200 && worst<=3.01, n+' человек, худший '+who);
const top=[...P.players].sort((a,b)=>b._ovr-a._ovr)[0];
check('сильнейший сцены — настоящий топ года', top && top._ovr>=90, top && (top.handle+' '+top._ovr));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cnc-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-new-chapter'); process.exit(res.fails.length?1:0);
