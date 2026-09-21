// Год 2025 на выбор: календарь, сезоны, размер состава и стык в 2026-й.
//
// Его слово, 20 сентября 2026: «сделай карьеру как для выбора с расписанием
// 2025 года полностью и игроки тоже из того года». Календарь 2025 был измерен
// 19 августа (CAREER_YEAR_2025, CC_CUP_WEEKS_2025) и лежал непрочитанным; теперь
// его читает карьера с cr.year=2025.
//
//   node tools/check-career-2025-calendar.js
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
    // 1. Экран создания: чип года есть, 2025 выбирается, сейв выходит с годом.
    openCareerCreate();
    const chips=document.getElementById('ccYearChips');
    check('на экране создания есть чипы года', chips && chips.querySelectorAll('button').length===3);
    ccPickYear(2025);
    check('чип 2025 включён', chips.querySelector('button.on') && /2025/.test(chips.querySelector('button.on').textContent));
    check('подпись года меняется', /2025|Lyon|Лион/.test(document.getElementById('ccYearNote').textContent));
    document.getElementById('ccNick').value='Nexty';
    CC.country='de';
    ccStart();
    const cr=CAREER.career;
    check('сейв: year=2025', cr.year===2025, String(cr.year));
    check('сейв: year0=2025', cr.year0===2025);
    check('сейв: трио весь год', careerSquadSize()===3, String(cr.size));
    check('первый день — в 2025-м календаре', cr.day>=careerMonday(CC_YEAR_2025_FROM) && cr.day<='2024-12-31', cr.day);
    out.notes.day=cr.day;
    // 2. Календарь года — 2025-й целиком и ничего из 2026-го.
    const days=careerYearDays();
    const keys=[...days.keys()].sort();
    check('дни года в границах 2025', keys[0]>=CC_YEAR_2025_FROM && keys[keys.length-1]<=CC_YEAR_2025_TO, keys[0]+'…'+keys[keys.length-1]);
    const kinds={}; days.forEach(list=>list.forEach(e=>{ kinds[e.kind]=(kinds[e.kind]||0)+1; }));
    out.notes.kinds=kinds;
    check('нет Reload-серии / Summit / Про-Ама / LCQ Глобалов', !kinds.reload && !kinds.summit && !kinds.proam && !kinds.gclc, JSON.stringify(kinds));
    check('оценка есть: 31 вечер (Reload-оценки в 2025-м нет — его слово 21.09)', kinds.eval===31, String(kinds.eval));
    check('три Мейджора × 9 дней + Showdown 6 = 33', kinds.major===33, String(kinds.major));
    check('Лион — 6–7 сентября', (days.get('2025-09-06')||[]).some(e=>e.kind==='globals') && (days.get('2025-09-07')||[]).some(e=>e.kind==='globals'));
    check('двенадцать кубковых недель', ccCupWeeks().length===12);
    const cupDays=keys.filter(k=>(days.get(k)||[]).some(e=>e.kind==='cup'));
    check('кубок в среду 11 декабря 2024', cupDays[0]==='2024-12-11', cupDays[0]);
    check('гала стоит на последнем дне года', (careerEvents().get(CC_YEAR_2025_TO)||[]).some(e=>e.kind==='gala'));
    // 3. Сезоны Fortnite 2025.
    check('10 марта 2025 — S34', (careerFncsSeason('2025-03-10')||{}).id==='S34', JSON.stringify(careerFncsSeason('2025-03-10')));
    check('20 июня 2025 — S36', (careerFncsSeason('2025-06-20')||{}).id==='S36');
    check('год на экране — 2025', ccSeasonYear()===2025, String(ccSeasonYear()));
    // 4. Стык: после Лиона — 2026-й, дуо, номера сезонов без сдвига.
    cr.day=CC_YEAR_2025_TO; cr.seasonOver=true;
    careerNewSeason();
    check('после стыка год 2026', cr.year===2026, String(cr.year));
    check('сезон 2 — дуо (как было в жизни)', careerSquadSize()===2, String(cr.size));
    check('день — в календаре 2026', cr.day>=CC_YEAR_FROM && cr.day<=CC_YEAR_TO, cr.day);
    check('сезон 2026-го начинается с S39, не с S43', (careerFncsSeason('2026-01-10')||{}).id==='S39', JSON.stringify(careerFncsSeason('2026-01-10')));
    check('год на экране — 2026', ccSeasonYear()===2026, String(ccSeasonYear()));
    const days2=careerYearDays(); const k2=[...days2.keys()].sort();
    check('дни второго года — 2026-е', k2[0]>=CC_YEAR_FROM, k2[0]);
    // 5. Ещё стык: сезон 3 — снова трио.
    cr.day=CC_YEAR_TO; cr.seasonOver=true;
    careerNewSeason();
    check('сезон 3 — трио', careerSquadSize()===3, String(cr.size));
    check('сезон 3 — S43', (careerFncsSeason('2026-01-10')||{}).id==='S43', JSON.stringify(careerFncsSeason('2026-01-10')));
    // 6. Старый сейв без поля года — 2026, как и был.
    delete cr.year; delete cr.year0;
    check('сейв без года читается как 2026', ccCalYear()===2026 && ccYearFrom()===CC_YEAR_FROM);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc2025-'));
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
console.log('OK check-career-2025-calendar');
