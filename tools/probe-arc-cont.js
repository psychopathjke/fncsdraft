// Проба: карьера, начатая в Y0, стоит в сезоне S (сезон закончен) — История по сезонам для NAC/EU.
//   node tools/probe-arc-cont.js REG Y0 S
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
const SL = String.fromCharCode(92);
const REG = process.argv[2] || 'NAC', Y0 = +(process.argv[3] || 2021), S = +(process.argv[4] || 4);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  try{
    const reg='${REG}', y0=${Y0}, S=${S};
    const card=(h, o)=>({handle:h, region:reg, rating:o, _ovr:o, nat:'us', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'us', countryPing:15, closeRangeEdge:6,
        region:reg, ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:y0, year0:y0, day:y0+'-09-08', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'arcc'},
      partner:{card:card('M1',80), patience:60, since:'2018-11-01', dev:0},
      partners:[{card:card('M1',80), patience:60, since:'2018-11-01', dev:0}], dev:{}}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    for(let k=1;k<S;k++){ CAREER.career.seasonOver=true; careerNewSeason(); }
    CAREER.career.seasonOver=true;
    out.notes.at=CAREER.career.season+' cal '+ccCalYear()+' people '+ccNowYear();
    out.notes.pairs={}; ['NAC','NAW','EU'].forEach(g=>{ const p=ccArcPairs(g); out.notes.pairs[g]=p.pairs.length; });
    for(let n=1;n<=S;n++){
      const a=careerArchiveSeason(n), r={};
      ['NAC','EU'].forEach(g=>{ r[g]=a.regional.map(ev=>{ const t=careerArchiveFinal(n, 'm|'+ev.n+'|'+g);
        return ev.label+': '+(ev.perReg[g]||{}).name+' | '+(t ? t.rows.slice(1,4).map(x=>x.name).join(' ; ') : '-'); }); });
      out.notes['s'+n+' '+ccArcCalYear(n)]=r;
    }
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('no result'); process.exit(1); }
console.log(JSON.stringify(JSON.parse(decodeURIComponent(m[1])), null, 1));
