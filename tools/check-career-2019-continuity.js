// Мир карьеры 2019-го (сквад): 2020 (трио, формат на вечер), 2021 (трио), 2022–2024 (дуо), 2025 (трио),
// 2026 (дуо) скипом — размер состава по годам, год без ошибок.
//
//   node tools/check-career-2019-continuity.js
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
      career:{season:1, size:4, year:2019, year0:2019, day:CC_YEAR_2019_TO, seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'cont19'},
      partner:{card:card('M1',90), patience:60, since:'2018-11-01', dev:0},
      partners:[{card:card('M1',90), patience:60, since:'2018-11-01', dev:0}, {card:card('M2',89), patience:60, since:'2018-11-01', dev:0}, {card:card('M3',88), patience:60, since:'2018-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(92,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    const cr=CAREER.career;
    const years=[[2020,3],[2021,3],[2022,2],[2023,2],[2024,2],[2025,3],[2026,2]];
    out.notes.years=[];
    for(let i=0; i<years.length; i++){
      careerNewSeason();
      const [y, sz]=years[i];
      check('сезон '+(i+2)+' — '+y+', размер '+sz, cr.season===i+2 && cr.year===y && careerSquadSize()===sz, cr.season+'/'+cr.year+'/'+cr.size);
      if(i===0){
        check('люди — 2019-го', ccNowYear()===2019 && ccContinuity());
        const pool=careerPools();
        out.notes.pool2020={duos:pool.duos.length, real:pool.duos.filter(d=>d._real).length};
      }
      let guard=0; const t0=Date.now();
      while(!cr.seasonOver && guard++<400) careerSkipWeek();
      out.notes.years.push(y+':'+guard+'d/'+(Date.now()-t0)+'ms');
      check('год '+y+' прошёл', cr.seasonOver, 'дней '+guard);
      check('без ошибок JS ('+y+')', out.errs.length===0, out.errs.slice(0,3).join(' | '));
      if(out.errs.length) break;
    }
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc19c-'));
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
console.log('OK check-career-2019-continuity');
