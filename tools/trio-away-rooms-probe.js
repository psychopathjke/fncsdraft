// Тестер, 21 сентября 2026 (Notion «bags»): «на Европе триосы пофиксились, но
// на остальных регионах они очень странные, не по силе составляются».
// Проба: в трио-год собираем комнату Дивизиона 1 КАЖДОГО региона тем же путём,
// что лента чужих регионов (careerRegionsWeek → ccAsRegion → careerWorldD1),
// и меряем у каждой тройки разрыв «третий − средняя пары» и долю троек с
// разрывом больше пяти.
//
//   node tools/trio-away-rooms-probe.js
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
  const out={rows:[], err:null};
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, sizes:{1:2}, day:'2026-02-10', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'away'},
      partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0},{card:card('M2',87), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize(); ccTrioMarket(CAREER.career, true);
    const ovrOf=c=>c ? (c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr) : null;
    CC_REGIONS.forEach(reg=>{
      let room=null;
      try{ room=ccAsRegion(reg, ()=>careerCupField(Object.assign({}, CAREER.career, {division:1}), [], ccTeams(50), 'probe|'+reg, false, 0)); }catch(e){ out.rows.push({reg, err:String(e).slice(0,120)}); return; }
      const gaps=[]; let wide=0, n=0; const ex=[];
      room.forEach(t=>{
        const sq=(t.squad||[]).map(ovrOf).filter(v=>v!=null); if(sq.length<3) return;
        const sorted=sq.slice().sort((a,b)=>b-a); const pair=(sorted[0]+sorted[1])/2, third=sorted[2];
        const gap=third-pair; gaps.push(gap); n++; if(gap<-5) wide++;
        if(ex.length<3 && gap<-6) ex.push((t.squad||[]).map(c=>c.handle+' '+Math.round(ovrOf(c))).join(' / '));
      });
      const avg=gaps.length ? gaps.reduce((a,b)=>a+b,0)/gaps.length : 0;
      out.rows.push({reg, teams:n, avgGap:+avg.toFixed(1), wide, widePct:n?Math.round(wide/n*100):0, ex});
    });
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccaway-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 600000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
console.log('регион  троек  разрыв(третий−пара)  шире 5: n  %   примеры');
out.rows.forEach(r => console.log(r.err ? r.reg + ' ERR ' + r.err : [r.reg.padEnd(6), String(r.teams).padEnd(6), String(r.avgGap).padEnd(20), String(r.wide).padEnd(10), String(r.widePct).padEnd(4), (r.ex||[]).join(' | ')].join(' ')));
