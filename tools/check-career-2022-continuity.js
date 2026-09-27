// Мир карьеры 2022-го после Роли: 2023-й (дуо) на людях 2022-го — пары 2023-го как в жизни,
// дебютанты 2023-го; годы скипом не падают; потом 2024-й (дуо), 2025-й (трио), 2026-й.
//
//   node tools/check-career-2022-continuity.js
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
  const out={fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nextyear', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:2022, year0:2022, day:CC_YEAR_2022_TO, seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'cont22'},
      partner:{card:card('M1',90), patience:60, since:'2021-11-01', dev:0},
      partners:[{card:card('M1',90), patience:60, since:'2021-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(92,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    careerNewSeason();
    const cr=CAREER.career;
    check('сезон 2 — 2023, дуо', cr.season===2 && cr.year===2023 && ccCalYear()===2023 && careerSquadSize()===2, cr.season+'/'+cr.year+'/'+cr.size);
    check('люди — 2022-го (свой мир)', ccNowYear()===2022 && ccContinuity());
    check('год на карточке', ccSeasonYearOf(2)===2023 && ccSeasonYearOf(3)===2024 && ccSeasonYearOf(4)===2025 && ccSeasonYearOf(5)===2026);
    check('ЛАН второго года — Копенгаген', ccLanHostKey('globals')==='Cph', ccLanHostKey('globals'));
    const pool=careerPools();
    const real=pool.duos.filter(d=>d._real);
    const deb=pool.duos.reduce((n,d)=>n+d.cards.filter(c=>c._debut===2023).length, 0);
    out.notes.pool={duos:pool.duos.length, real:real.length, debutants:deb};
    check('пары 2023-го — как в жизни', real.length>=40, String(real.length));
    check('дебютанты 2023-го в парах', deb>=20, String(deb));
    const bad=pool.duos.filter(d=>d.cards.some(c=>!c._debut && ccCardYear(c)!==2022));
    check('остальные — карточки 2022-го', bad.length===0, bad.slice(0,3).map(d=>d.cards.map(c=>c.handle+'|'+ccCardYear(c)).join('&')).join(' ; '));
    let guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
    check('год 2023 прошёл', cr.seasonOver, 'дней '+guard);
    check('без ошибок JS (2023)', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    careerNewSeason();
    check('сезон 3 — 2024, дуо', cr.season===3 && cr.year===2024 && careerSquadSize()===2, cr.season+'/'+cr.year+'/'+cr.size);
    check('ЛАН третьего года — Форт-Уэрт', ccLanHostKey('globals')==='Ftw', ccLanHostKey('globals'));
    guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
    check('год 2024 прошёл', cr.seasonOver, 'дней '+guard);
    careerNewSeason();
    check('сезон 4 — 2025, трио', cr.season===4 && cr.year===2025 && careerSquadSize()===3, cr.season+'/'+cr.year+'/'+cr.size);
    guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
    check('год 2025 прошёл', cr.seasonOver, 'дней '+guard);
    careerNewSeason();
    check('сезон 5 — 2026, дуо', cr.season===5 && cr.year===2026 && careerSquadSize()===2, cr.season+'/'+cr.year+'/'+cr.size);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc22c-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1800000 }).toString();
fs.rmSync(dir, { recursive: true, force: true });
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2022-continuity');
