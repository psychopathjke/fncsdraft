// Сборные стран: сколько стран с полным складом (4+ человека в сцене) в каждом регионе и
// какой силы их верхняя четвёрка — чтобы квоты регионам на 25 слотов считать, а не выдумывать.
//
//   node tools/nations-count-probe.js [2026|2025|2024]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const YEAR = +(process.argv[2] || 2026);
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
(function(){
  const out={regions:{}, countries:{}, err:null};
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:${YEAR}, year0:${YEAR}, day:'${YEAR}-06-01', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'nat'}, partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
    const by={};   // nat → {reg → [ovr]}
    CC_REGIONS.forEach(reg=>{
      let ro=[]; try{ ro=ccSceneRoster(reg); }catch(e){ out.regions[reg]={err:String(e).slice(0,80)}; return; }
      out.regions[reg]={people:ro.length, noNat:ro.filter(p=>!p.nat).length};
      ro.forEach(p=>{ if(!p.nat) return; const k=String(p.nat).toLowerCase(); (by[k]=by[k]||{}); (by[k][reg]=by[k][reg]||[]).push(Math.round(ccCardOvr(p))); });
    });
    Object.keys(by).forEach(nat=>{
      const all=[]; let home=null, best=0;
      Object.keys(by[nat]).forEach(reg=>{ by[nat][reg].forEach(v=>all.push(v)); if(by[nat][reg].length>best){ best=by[nat][reg].length; home=reg; } });
      all.sort((a,b)=>b-a);
      out.countries[nat]={n:all.length, home, top4:all.length>=4 ? Math.round(all.slice(0,4).reduce((a,b)=>a+b,0)/4*10)/10 : null, byReg:Object.keys(by[nat]).map(r=>r+':'+by[nat][r].length).join(' ')};
    });
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
console.log('регионы:', JSON.stringify(out.regions));
const rows = Object.keys(out.countries).map(k => Object.assign({nat: k}, out.countries[k])).filter(r => r.n >= 4).sort((a, b) => b.top4 - a.top4);
console.log('стран с четвёркой: ' + rows.length);
const perReg = {};
rows.forEach(r => { (perReg[r.home] = perReg[r.home] || []).push(r); });
Object.keys(perReg).forEach(reg => {
  console.log('\n' + reg + ' — стран: ' + perReg[reg].length);
  perReg[reg].forEach(r => console.log('  ' + r.nat.padEnd(4) + ' людей ' + String(r.n).padStart(3) + '  топ-4 ' + r.top4 + '  (' + r.byReg + ')'));
});
