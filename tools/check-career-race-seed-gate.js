// В гонке своя строка в записи прошедших пишется никами (ccSeedRow), а не 'you'. Проверки допуска на следующий
// раунд искали только 'you': FNCS C2S1 2019, неделя 2, #11 на раундах 1–2, а раунд 3 на следующий день закрыт.
// Проверка: раунд 3 недели открыт и для 'you', и для строки с моим ником; без меня — закрыт.
//
//   node tools/check-career-race-seed-gate.js
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
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const day='2019-11-10';
    check('день раунда 3 недели 2 есть в календаре', !!day, String(day));
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'fr', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Gateman', age:20, source:'rookie', country:'fr', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90, 'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:4, year:2019, year0:2019, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'gate19'},
      partner:{card:card('M1',88), patience:60, since:'2019-10-01', dev:0}, partners:[{card:card('M1',88), patience:60, since:'2019-10-01', dev:0}]}));
    careerEntry();
    out.notes.today=careerToday(); out.notes.yr=ccCalYear();
    const ev=careerMajorOn(careerToday());
    if(!ev) throw new Error('no event: '+JSON.stringify(out.notes)+' '+out.fails.join(';'));
    check('сегодня вечер C2S1, раунд 3', ev && ev.yx===2019 && ev.n===4 && ev.stage==='q' && ev.rounds[0]===3, JSON.stringify(ev && {yx:ev.yx, n:ev.n, stage:ev.stage, rounds:ev.rounds, w:ev.w}));
    const me=hKey(careerCard()), other=[{h:'Someone1'}, {h:'Someone2'}];
    const m=ccMXState(2019, 4);
    const gate=r2=>{ m.q[ev.w]={r1:['you'], r2:r2}; return careerMajorCan(ev); };
    check('раунд 3: открыт по записи с you', gate(['you', other])===true);
    check('раунд 3: открыт по записи с моим ником (гонка)', gate([other, [{h:careerCard().handle}, {h:'M1'}]])===true, me);
    check('раунд 3: закрыт без меня', gate([other])===false);
    out.notes.me=me;
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccseedgate-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 600000 }).toString();
fs.rmSync(dir, { recursive: true, force: true });
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-race-seed-gate');
