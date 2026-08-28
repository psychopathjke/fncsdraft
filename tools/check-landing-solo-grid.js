// Соло-сетка: каждый остров делится мельче, и ни один кусок не уезжает.
//
// Его дроп-карта Solo Series, 23 августа: сотня падает поодиночке и точек на
// карте под шестьдесят против наших тридцати шести. splitLandingZonesForSolo
// режет самый крупный бокс надвое, пока сетка не дорастёт, — проверяется на
// ВСЕХ островах разом («сделай так же для других карт и для этой»):
//   * в соло боксов заметно больше, чем в дуо, на каждой карте;
//   * ни один кусок не вылезает за карту и не мельчает ниже читаемого;
//   * площадь острова сохраняется — деление, а не дорисовка;
//   * дуо, трио и сквад-сетки не тронуты.
//
//   node tools/check-landing-solo-grid.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {errs:null, fail:null, maps:{}};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    const area=()=>ALL_LANDING_ZONES.reduce((s,z)=>s+z.w*z.h, 0);
    Object.keys(ZONE_SETS).forEach(function(key){
      squadSize=2; useLandingSet(key);
      const duo=ALL_LANDING_ZONES.length, duoArea=area();
      squadSize=1; useLandingSet(key);
      const solo=ALL_LANDING_ZONES.length, soloArea=area();
      const small=ALL_LANDING_ZONES.filter(z=>Math.min(z.w,z.h)<2.4).length;
      const off=ALL_LANDING_ZONES.filter(z=>z.x<0||z.y<0||z.x+z.w>100||z.y+z.h>100).length;
      out.maps[key]={duo:duo, solo:solo, small:small, off:off,
                     areaKept:Math.abs(soloArea-duoArea)<0.01};
      if(solo<=duo) fail(key+': solo grid is '+solo+' boxes against duo\\'s '+duo);
      if(off) fail(key+': '+off+' solo boxes fall off the island');
      if(small) fail(key+': '+small+' solo boxes are too small to read');
      if(!out.maps[key].areaKept) fail(key+': splitting changed the island area');
    });
    // Дуо/трио/сквад — как были.
    squadSize=2; useLandingSet('m2'); const d=ALL_LANDING_ZONES.length;
    squadSize=3; useLandingSet('m2'); const t=ALL_LANDING_ZONES.length;
    squadSize=4; useLandingSet('m2'); const q=ALL_LANDING_ZONES.length;
    out.other={duo:d, trio:t, squad:q};
    if(!(q<t && t<d)) fail('the squad trims stopped thinning: '+d+'/'+t+'/'+q);
    squadSize=2;
  } catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccgrid-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
Object.keys(out.maps||{}).forEach(k => {
  const r = out.maps[k];
  console.log('  ' + k.padEnd(5) + ' duo ' + String(r.duo).padStart(3) + ' → solo ' + String(r.solo).padStart(3));
});
if (out.other) console.log('  m2 squads: duo ' + out.other.duo + ', trio ' + out.other.trio + ', squad ' + out.other.squad);
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('every island splits for solo, on the island and readable');
