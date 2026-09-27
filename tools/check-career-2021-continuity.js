// Мир карьеры 2021-го (трио) после Grand Royale: 2022-й (дуо) на людях 2021-го — пары 2022-го
// как в жизни, дебютанты 2022-го; потом 2023, 2024 (дуо), 2025 (трио), 2026 (дуо) скипом.
//
//   node tools/check-career-2021-continuity.js
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
      career:{season:1, size:3, year:2021, year0:2021, day:CC_YEAR_2021_TO, seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'cont21'},
      partner:{card:card('M1',90), patience:60, since:'2020-11-01', dev:0},
      partners:[{card:card('M1',90), patience:60, since:'2020-11-01', dev:0}, {card:card('M2',89), patience:60, since:'2020-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(92,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    careerNewSeason();
    const cr=CAREER.career;
    check('сезон 2 — 2022, дуо', cr.season===2 && cr.year===2022 && ccCalYear()===2022 && careerSquadSize()===2, cr.season+'/'+cr.year+'/'+cr.size);
    check('люди — 2021-го (свой мир)', ccNowYear()===2021 && ccContinuity());
    check('год на карточке', ccSeasonYearOf(2)===2022 && ccSeasonYearOf(5)===2025 && ccSeasonYearOf(6)===2026);
    check('ЛАН второго года — Роли', ccLanHostKey('globals')==='Rdu', ccLanHostKey('globals'));
    const pool=careerPools();
    const real=pool.duos.filter(d=>d._real);
    const deb=pool.duos.reduce((n,d)=>n+d.cards.filter(c=>c._debut===2022).length, 0);
    out.notes.pool={duos:pool.duos.length, real:real.length, debutants:deb};
    check('пары 2022-го — как в жизни', real.length>=40, String(real.length));
    check('дебютанты 2022-го в парах', deb>=20, String(deb));
    const bad=pool.duos.filter(d=>d.cards.some(c=>!c._debut && ccCardYear(c)!==2021));
    check('остальные — карточки 2021-го', bad.length===0, bad.slice(0,3).map(d=>d.cards.map(c=>c.handle+'|'+ccCardYear(c)).join('&')).join(' ; '));
    const years=[[2022,2],[2023,2],[2024,2],[2025,3],[2026,2]];
    for(let i=0; i<years.length; i++){
      let guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
      check('год '+years[i][0]+' прошёл', cr.seasonOver, 'дней '+guard);
      check('без ошибок JS ('+years[i][0]+')', out.errs.length===0, out.errs.slice(0,3).join(' | '));
      if(i===years.length-1) break;
      careerNewSeason();
      const [y, sz]=years[i+1];
      check('сезон '+(i+3)+' — '+y+', '+(sz===3?'трио':'дуо'), cr.season===i+3 && cr.year===y && careerSquadSize()===sz, cr.season+'/'+cr.year+'/'+cr.size);
    }
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc21c-'));
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
console.log('OK check-career-2021-continuity');
