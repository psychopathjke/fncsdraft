// Как история зовёт свои строки. Его скрин, 23 августа: финал релоада лежал в
// журнале как «Кубок Див 1» — колонка «Событие» звала кубком всё подряд.
// Проба кормит ccLogName строкой каждого вида на его календарный день и
// смотрит, что напечатает таблица: релоад — релоадом, мейджор — мейджором,
// дримкап — своим именем, а день вне календаря — хотя бы словом за тип.
//
//   node tools/career-log-name-probe.js
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
(async function(){
  const out = {errs:null, fail:null, names:{}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeLog', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-05', division:3, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const gclcDay=(typeof CC_GCLC!=='undefined' && CC_GCLC[0]) ? CC_GCLC[0].day : null;
    const wf=(CC_CUP_WEEKS.find(w=>w[3])||[])[3] || null;
    const rows=[
      ['cup',     {day:'2026-01-10', div:3}],
      ['wf',      {day:wf,           div:1, kind:'final'}],
      ['eval',    {day:(typeof CC_EVAL_NIGHTS!=='undefined'?CC_EVAL_NIGHTS[0]:null), div:1, kind:'eval'}],
      ['reload',  {day:'2026-02-07', div:1, kind:'reload', stage:'final'}],
      ['major',   {day:'2026-04-25', div:1, kind:'major', stage:'final'}],
      ['summit',  {day:'2026-05-31', div:1, kind:'summit', stage:'final'}],
      ['rc',      {day:'2026-08-20', div:1, kind:'rc', stage:'group'}],
      ['gclc',    {day:gclcDay,      div:1, kind:'gclc'}],
      ['globals', {day:'2026-09-26', div:1, kind:'globals', stage:'final'}],
      ['victory', {day:'2026-02-22', div:2, kind:'victory'}],
      ['offYear', {day:'2027-02-07', div:1, kind:'reload', stage:'final'}]
    ];
    rows.forEach(([k,e])=>{ out.names[k]= e.day ? ccLogName(e) : 'no day in schedule'; });
    // И сквозь саму таблицу: одна релоадная строка в журнале — что видно на экране.
    CAREER.career.log=[{season:1, day:'2026-02-07', div:1, place:3, of:100, pts:50,
      passed:true, ovr:90, games:12, wins:1, elims:20, avg:5, mate:null, prize:5000,
      kind:'reload', stage:'final'}];
    const html=careerHistoryHTML();
    const m=html.match(/<td class="ev-name"><b>([^<]*)<\\/b>/);
    out.tableSays = m ? m[1] : 'no row rendered';
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclogname-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out, null, 2));
if (out.fail) process.exit(1);
