/* Рейтинг сезона и старт карьеры с сезона (Notion «18.10»: «у Chap в 5 главе рейтинг маленький»,
   «может в карьере дать выбор по сезонам ещё, а не по годам»; его выбор — старт + составы + рейтинг сезона).
   1) Карьера 2024-го: рейтинг идёт за снимком сезона (ccRatingSnap). Chap в C5S1 (полуфинал Мейджора 1,
      слабый 2023-й) ниже, чем в C5S3; в последнем сезоне — рейтинг года; t3eny с ним в паре с C5S2.
   2) Шкала сезона — шкала года: середина сцены в начале 2026-го не проседает (Д1 читается Д1).
   3) Старт с сезона (cr.startFrom): первый день не раньше даты сезона, снимок — выбранный; год
      доигрывается до конца, следующий год — с начала.
   4) Годы после 2026-го и рейтинг «как у свежей карьеры» (CC_NOW_YEAR_FORCE) — весь год.
   5) Экран создания: чипы сезона есть у года, в командной карьере их нет.
   Запуск: node tools/check-career-season-start.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const save=(y, size, day, extra)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:Object.assign({season:1, size:size, year:y, year0:y, day:day, seasonOver:false, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ss'+y}, extra||{}),
  partner:{card:card('M1',80), patience:60, since:'2023-11-01', dev:0}, partners:[{card:card('M1',80), patience:60, since:'2023-11-01', dev:0}]}));
  CC_POOLS=null; careerLoad(); careerMigrateSize(); careerMigrateClock(); };
const rateOf=h=>{ const c=careerRosterNowEU().find(x=>hKey(x)===h); return c ? c.rating : null; };
const mateOf=h=>{ const d=careerPools().duos.find(d=>(d.cards||[]).some(x=>hKey(x)===h)); return d ? d.cards.filter(x=>hKey(x)!==h).map(x=>hKey(x)).join('+') : null; };
// 1) 2024 по сезонам.
const r24={};
for(const [tag, day] of [['f1','2024-02-10'], ['f2','2024-05-01'], ['f3','2024-07-01']]){
  save(2024, 2, day);
  r24[tag]={snap:ccSnapshotNow().tag, rs:ccRatingSnapTag(), chap:rateOf('chap'), t3eny:rateOf('t3eny'), mate:mateOf('chap')};
}
notes.y2024=r24;
check('снимки 2024: f1, f2, f3', r24.f1.snap==='f1' && r24.f2.snap==='f2' && r24.f3.snap==='f3', JSON.stringify(r24));
check('последний сезон — рейтинг года', r24.f3.rs==='Y' && r24.f1.rs==='f1', r24.f1.rs+'/'+r24.f3.rs);
check('Chap в C5S1 заметно ниже, чем в C5S3', r24.f1.chap!=null && r24.f3.chap!=null && r24.f3.chap-r24.f1.chap>=10, r24.f1.chap+' → '+r24.f3.chap);
check('Chap растёт по сезонам', r24.f1.chap<=r24.f2.chap && r24.f2.chap<=r24.f3.chap, [r24.f1.chap, r24.f2.chap, r24.f3.chap].join(' → '));
check('с C5S2 Chap в паре с t3eny', r24.f2.mate==='t3eny' && r24.f3.mate==='t3eny', r24.f2.mate+' / '+r24.f3.mate);
// 2) Шкала сезона = шкала года: распределение региона одно и то же, меняется порядок.
save(2026, 2, '2026-01-20');
const so=[...ccSeasonOvr().entries()].filter(e=>e[0].indexOf('EU|')===0).map(e=>e[1]).sort((a,b)=>a-b);
const yr=[...CC_SEASON_WORK.year.entries()].filter(e=>e[0].indexOf('EU|')===0).map(e=>e[1]).sort((a,b)=>a-b);
const q=(a,f)=>a[Math.floor(f*(a.length-1))];
notes.scale={season:[q(so,.5), q(so,.9), q(so,.99)], year:[q(yr,.5), q(yr,.9), q(yr,.99)], snap:ccRatingSnapTag()};
check('2026 в Major 1 — сезон, не год', ccRatingSnapTag()==='m1', ccRatingSnapTag());
check('шкала сезона — шкала года (медиана, 90-й и 99-й процентиль ±1)', [.5,.9,.99].every(f=>Math.abs(q(so,f)-q(yr,f))<=1), JSON.stringify(notes.scale));
// 3) Старт с сезона: 2024 с C5S3.
save(2024, 2, null, {startFrom:'2024-06-14'});
const cr=CAREER.career;
notes.start={day:cr.day, snap:ccSnapshotNow().tag};
check('первый день — не раньше C5S3', cr.day>='2024-06-14' && cr.day<'2024-06-24', cr.day);
check('снимок старта — f3', ccSnapshotNow().tag==='f3', ccSnapshotNow().tag);
let g=0; while(!cr.seasonOver && g++<400) careerSkipWeek();
check('год доигран', cr.seasonOver, 'шагов '+g+', день '+cr.day);
careerNewSeason();
notes.next={season:cr.season, year:cr.year, day:cr.day, snap:ccSnapshotNow().tag};
check('следующий год — с начала (2025, t1)', cr.year===2025 && cr.day<'2025-01-01' && ccSnapshotNow().tag==='t1', JSON.stringify(notes.next));
// 4) 2027 и рейтинг года под CC_NOW_YEAR_FORCE.
save(2026, 2, '2026-12-20', {season:2, year0:2026});
check('2027 (второй 2026-й) — весь год', ccRatingSnap()===null, ccRatingSnapTag()+' shift '+ccYearShift());
save(2026, 2, '2026-01-20');
CC_NOW_YEAR_FORCE=2026; const forced=ccRatingSnap(); CC_NOW_YEAR_FORCE=null;
check('рейтинг «как у свежей карьеры» — весь год', forced===null, JSON.stringify(forced));
// 5) Экран создания.
localStorage.clear(); CAREER=null;
openCareerCreate(); ccPickYear(2025);
// Сезоны — кнопками на плитках годов (его набросок «18.10»): у 2024-го три, нажатие ставит и год, и сезон.
const wrap24=[...document.querySelectorAll('#ccYearChips .cc-yt-wrap')].find(w=>/^2024/.test(w.querySelector('.cc-year-tile').textContent));
const sb=wrap24 ? [...wrap24.querySelectorAll('.cc-yt-s')] : [];
notes.tile24=sb.map(b=>b.textContent);
check('на плитке 2024 три сезона: C5S1 C5S2 C5S3', sb.map(b=>b.textContent).join(' ')==='C5S1 C5S2 C5S3', notes.tile24.join(' '));
sb[2] && sb[2].click();
check('нажатие C5S3 на плитке ставит 2024 и C5S3', CC.year===2024 && ccPickedStart() && ccPickedStart().from==='2024-06-14', CC.year+' '+JSON.stringify(ccPickedStart()));
const onNow=[...document.querySelectorAll('#ccYearChips .cc-yt-s.on')].map(b=>b.textContent);
check('подсвечен выбранный сезон', onNow.join()==='C5S3', onNow.join());
// Список карточек на экране создания — рейтинги выбранного сезона.
const chapAt=tag=>{ ccPickStartSeason(tag); const c=careerRosterNowEU().find(x=>hKey(x)==='chap'); return c ? c._ovr : null; };
const cf1=chapAt('f1'), cf3=chapAt('f3');
notes.create={f1:cf1, f3:cf3};
check('на экране создания Chap в C5S1 ниже, чем в C5S3', cf1!=null && cf3!=null && cf3-cf1>=10, cf1+' → '+cf3);
ccPickYear(2025);
check('смена года сбрасывает сезон на первый', ccPickedStart()===null, JSON.stringify(ccPickedStart()));
CC_MP_NEW={role:'a'}; ccRenderChips();
check('в командной карьере сезонов на плитках нет', document.querySelectorAll('#ccYearChips .cc-yt-s').length===0 && ccPickedStart()===null, String(document.querySelectorAll('#ccYearChips .cc-yt-s').length));
CC_MP_NEW=null;
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'css-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '900000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-season-start'); process.exit(res.fails.length?1:0);
