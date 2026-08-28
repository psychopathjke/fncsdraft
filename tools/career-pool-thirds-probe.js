// Сколько в пуле реальных дуо, игроков и НЕспаренных игроков — потолок данных
// для третьих мест трио-сезона. Жалоба игрока, 22 августа: «опять рандомные
// ники в таблице» — третьи у реальных пар выдуманные.
//
//   node tools/career-pool-thirds-probe.js
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

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'P', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, day:'2026-01-05', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry(); CARD_MODE=true; squadSize=3;
    const pool=careerPools();
    out.duos=(pool.duos||[]).length;
    out.players=(pool.players||[]).length;
    const inDuo=new Set();
    (pool.duos||[]).forEach(d=>d.cards.forEach(c=>inDuo.add(c._k||hKey(c))));
    out.unpaired=(pool.players||[]).filter(p=>!inDuo.has(p._k||hKey(p))).length;
    // И как выглядит верх открытого поля: у скольких реальных пар третий выдуман.
    const field=careerCupField(CAREER.career, [], careerVictoryField(false), 'poolprobe', true, 0);
    let realCore=0, genThird=0;
    field.forEach(t=>{
      const real=(t.squad||[]).filter(c=>c && c.handle && c.tier!=='ladder');
      if(real.length===2 && (t.squad||[]).length===3){ realCore++; genThird++; }
      if(real.length===3) realCore++;
    });
    out.teamsInField=field.length;
    out.realCores=realCore;
    out.realCoresWithGenThird=genThird;
  }catch(e){ out.fail=String(e && e.message || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpoolth-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
console.log(m ? decodeURIComponent(m[1]) : 'no output');
