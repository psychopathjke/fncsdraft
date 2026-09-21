// Год 2024 на выбор: календарь, сезоны, дуо весь год и стык в 2025-й (трио) и дальше в 2026-й.
//
// Его слово, 21 сентября 2026: «добавь 2024 год и рейтинги карточек этого года»,
// «и календарь все как и прошлые». Календарь снят с архива Tracker (EU, 2024:
// tools/measured/tracker-2024-eu.json, выплаты по регионам — tracker-2024-regions.json).
//
//   node tools/check-career-2024-calendar.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    // 1. Экран создания: три чипа года, 2024 выбирается, сейв выходит с годом.
    openCareerCreate();
    const chips=document.getElementById('ccYearChips');
    check('на экране создания три чипа года', chips && chips.querySelectorAll('button').length===3, chips && String(chips.querySelectorAll('button').length));
    ccPickYear(2024);
    check('чип 2024 включён', chips.querySelector('button.on') && /2024/.test(chips.querySelector('button.on').textContent));
    check('подпись года меняется', /2024|Fort Worth|Форт/.test(document.getElementById('ccYearNote').textContent), document.getElementById('ccYearNote').textContent);
    // Карточки на экране — 2024-го: Merstach в 2024-м стоит рядом с Malibuca, рейтинг — его года.
    CC.mode='card'; ccRenderList();
    const now=careerRosterNowEU();
    const yrs=new Set(now.map(ccCardYear));
    check('список карточек — только 2024-й', yrs.size===1 && yrs.has(2024), [...yrs].join(','));
    const mer=now.find(p=>p.handle==='Merstach');
    check('Merstach в списке 2024-го', !!mer);
    if(mer){ out.notes.mer={ovr:attrsFor(mer).ovr, ev:mer.event, mate:ccMateNow(mer)}; check('состав Merstach — Malibuca (2024)', /Malibuca/.test(ccMateNow(mer)||''), ccMateNow(mer)); ccPickCard('Merstach'); check('карточка выбрана', CC.card && CC.card.handle==='Merstach'); }
    CC.mode='rookie'; CC.card=null; ccRenderList();
    document.getElementById('ccNick').value='Nexty';
    CC.country='de';
    ccStart();
    const cr=CAREER.career;
    check('сейв: year=2024', cr.year===2024, String(cr.year));
    check('сейв: year0=2024', cr.year0===2024);
    check('сейв: дуо весь год', careerSquadSize()===2, String(cr.size));
    check('первый день — в 2024-м календаре', cr.day>=careerMonday(CC_YEAR_2024_FROM) && cr.day<='2023-12-31', cr.day);
    out.notes.day=cr.day;
    // 2. Календарь года — 2024-й целиком.
    const days=careerYearDays();
    const keys=[...days.keys()].sort();
    check('дни года в границах 2024', keys[0]>=CC_YEAR_2024_FROM && keys[keys.length-1]<=CC_YEAR_2024_TO, keys[0]+'…'+keys[keys.length-1]);
    const kinds={}; days.forEach(list=>list.forEach(e=>{ kinds[e.kind]=(kinds[e.kind]||0)+1; }));
    out.notes.kinds=kinds;
    check('нет кубков дивизионов / финалов недели / Reload-серии / Summit / Про-Ама', !kinds.cup && !kinds.final && !kinds.reload && !kinds.summit && !kinds.proam && !kinds.gclc && !kinds.solo, JSON.stringify(kinds));
    check('оценка есть: 29 вечеров (Европа)', kinds.eval===29, String(kinds.eval));
    check('три Мейджора × (6 квал + 3 полуфинала + 2 финала) = 33', kinds.major===33, String(kinds.major));
    check('Форт-Уэрт — 7–8 сентября', (days.get('2024-09-07')||[]).some(e=>e.kind==='globals') && (days.get('2024-09-08')||[]).some(e=>e.kind==='globals'));
    check('капы с деньгами: Duos Cash Cup 18 + Solo Victory Cup 28 + Reload Duos Cash Cup 1 = 47', kinds.victory===47, String(kinds.victory));
    check('кубковых недель нет', ccCupWeeks().length===0);
    check('гала стоит на последнем дне года', (careerEvents().get(CC_YEAR_2024_TO)||[]).some(e=>e.kind==='gala'));
    // Подписи: квалификатор, полуфинал, финал.
    const lab=id=>{ let r=null; days.forEach(l=>l.forEach(e=>{ if(e.id===id) r=r||e.label; })); return r; };
    out.notes.labels={q:lab('Major1_2024_Q1R1'), s:lab('Major1_2024_Semi2'), f:lab('Major1_2024_Final'), g:lab('GlobalChampionship2024')};
    check('подпись квала называет Мейджор и раунд', /1/.test(lab('Major1_2024_Q1R1')||''), lab('Major1_2024_Q1R1'));
    check('подпись Глобалов называет Форт-Уэрт', /Fort|Форт/.test(lab('GlobalChampionship2024')||''), lab('GlobalChampionship2024'));
    check('день квала читается как этап Мейджора', (careerMajorOn('2024-01-26')||{}).stage==='q' && careerMajorOn('2024-01-26').y24 && careerMajorOn('2024-01-26').r===1);
    check('день финала читается как финал', (careerMajorOn('2024-02-25')||{}).stage==='final' && careerMajorOn('2024-02-25').nth===2);
    // 3. Сезоны Fortnite 2024.
    check('10 января 2024 — S28', (careerFncsSeason('2024-01-10')||{}).id==='S28', JSON.stringify(careerFncsSeason('2024-01-10')));
    check('20 июня 2024 — S30', (careerFncsSeason('2024-06-20')||{}).id==='S30');
    check('год на экране — 2024', ccSeasonYear()===2024, String(ccSeasonYear()));
    // Деньги: финал Мейджора Европы — $85 000 на игрока, на дуо вдвое.
    cr.day='2024-02-25';
    check('первое место финала Мейджора — $170 000 на дуо', majorPrize(1)===170000, String(majorPrize(1)));
    check('оценка до апреля платит топ-5 по $200', ccEvalWinCash()===0 && ccEvalTop5Cash()===400, ccEvalWinCash()+'/'+ccEvalTop5Cash());
    cr.day='2024-06-04';
    check('оценка с июня — $400 за победу на игрока', ccEvalWinCash()===800, String(ccEvalWinCash()));
    // 4. Стык: после Форт-Уэрта — 2025-й, трио, люди 2024-го.
    cr.day=CC_YEAR_2024_TO; cr.seasonOver=true;
    careerNewSeason();
    check('после стыка год 2025', cr.year===2025, String(cr.year));
    check('сезон 2 — трио (календарь 2025-го)', careerSquadSize()===3, String(cr.size));
    check('день — в календаре 2025', cr.day>=careerMonday(CC_YEAR_2025_FROM) && cr.day<=CC_YEAR_2025_TO, cr.day);
    check('карточки — по-прежнему 2024-го', ccNowYear()===2024, String(ccNowYear()));
    check('это свой мир', ccContinuity()===true);
    check('год на экране — 2025', ccSeasonYear()===2025, String(ccSeasonYear()));
    // 5. Ещё стык: сезон 3 — 2026-й, дуо.
    cr.day=CC_YEAR_2025_TO; cr.seasonOver=true;
    careerNewSeason();
    check('сезон 3 — 2026', cr.year===2026 && careerSquadSize()===2, cr.year+'/'+cr.size);
    check('сезон 3 — S39, не S43', (careerFncsSeason('2026-01-10')||{}).id==='S39', JSON.stringify(careerFncsSeason('2026-01-10')));
    check('год на экране — 2026', ccSeasonYear()===2026, String(ccSeasonYear()));
    cr.day=CC_YEAR_TO; cr.seasonOver=true;
    careerNewSeason();
    check('сезон 4 — трио, S43', careerSquadSize()===3 && (careerFncsSeason('2026-01-10')||{}).id==='S43', cr.size+'/'+JSON.stringify(careerFncsSeason('2026-01-10')));
    check('год на экране — 2027', ccSeasonYear()===2027, String(ccSeasonYear()));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc2024-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2024-calendar');
