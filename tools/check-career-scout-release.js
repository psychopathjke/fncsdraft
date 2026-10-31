/* «Не искать клуб» после конца контракта. Игрок с 99 нажал выключатель в клубе, клуб расторг контракт по итогам сезона,
   и больше не писал никто: выключатель переживал контракт. Теперь он действует, пока ты в клубе; свободным агентом
   выключил сам — держится.
   Запуск: node tools/check-career-scout-release.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const seed=()=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Scout', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:99, role:'roleIGL', attrs:ccRookieAttrs(99,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, size:2, year:2026, year0:2026, day:'2026-03-20', division:1, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[], orgs:['Team Vitality'], seed:'scout'},
  partner:{card:card('M1',90), patience:60, since:'2026-01-01', dev:0}, partners:[{card:card('M1',90), patience:60, since:'2026-01-01', dev:0}]}));
  careerEntry();
  CAREER.org={name:'Team Vitality', tier:92, salary:3000, to:1, since:'2026-01-05', goal:{tier:2, kind:'div', div:1, place:1}};
  CAREER.offers=[]; };
// 1) Выключил в клубе — в клубе новых нет.
seed(); careerScoutToggle();
check('в клубе выключатель держит', ccScoutOff() && !(careerOrgOffers()||[]).length);
// 2) Клуб расторг по итогам сезона — пишут снова.
careerOrgSeasonEnd();
const a=(careerOrgOffers()||[]).length; notes.release=a;
check('после расторжения клубы пишут', !CAREER.org && a>0, String(a));
// 3) Выкуп контракта, поиск был выключен — пишут.
seed(); careerScoutToggle(); CAREER.career.balance=1e7; careerLeaveOrg();
const b=(careerOrgOffers()||[]).length; notes.buyout=b;
check('после выкупа клубы пишут', !CAREER.org && b>0, String(b));
// 4) Старый сейв: выключено в клубе, контракта нет (флага свободного нет).
seed(); CAREER.scoutOff=true; CAREER.org=null; delete CAREER.scoutOffFree;
check('старый сейв без клуба: поиск включён', !ccScoutOff() && (careerOrgOffers()||[]).length>0);
// 5) Свободный агент выключил сам — не пишут, и кнопка включает обратно.
seed(); CAREER.org=null; careerScoutToggle();
check('свободный агент выключил сам — держится', ccScoutOff() && !(careerOrgOffers()||[]).length);
careerScoutToggle();
check('и включает обратно', !ccScoutOff() && (careerOrgOffers()||[]).length>0);
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'csr-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-scout-release'); process.exit(res.fails.length?1:0);
