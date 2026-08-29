// Закрытый календарь возвращается на сегодняшний месяц.
//
// Его слово, 29 августа: «когда закрываешь календарь, пусть всегда перемещает
// на то место, где ты сейчас». Пролистанный вперёд календарь открывался там же,
// где его бросили, и «Сейчас» приходилось жать каждый раз.
//
//   node tools/check-career-calendar-now.js
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nexty', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:80, role:'roleIGL', ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-03', division:5, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[], seed:'cal'},
      partners:[]}));
    openCareerHub();
    careerTab('calendar');
    const month0=JSON.stringify(CH_MONTH);
    // Листаем вперёд на три месяца — как это делает игрок стрелкой.
    careerMonthShift(3);
    careerRenderHub('calendar');
    out.notes.listed=JSON.stringify(CH_MONTH);
    check('стрелка листает календарь', CH_MONTH && JSON.stringify(CH_MONTH)!==month0, out.notes.listed);
    // Уходим на другую вкладку — это и есть «закрыть календарь».
    careerTab('centre');
    check('уход с календаря возвращает его на сегодня', CH_MONTH===null, JSON.stringify(CH_MONTH));
    // И открытый снова показывает текущий месяц.
    careerTab('calendar');
    const here=new Date(careerToday()+'T00:00:00Z');
    check('открывается там, где карьера стоит сейчас',
          CH_MONTH && CH_MONTH.y===here.getUTCFullYear() && CH_MONTH.m===here.getUTCMonth(),
          JSON.stringify(CH_MONTH)+' vs '+here.getUTCFullYear()+'/'+here.getUTCMonth());
    // Уход с хаба целиком — тоже закрытие.
    careerMonthShift(2);
    careerRenderHub('calendar');
    show('screen-mode');
    openCareerHub();
    check('вход в карьеру открывает календарь на сегодня', CH_MONTH===null, JSON.stringify(CH_MONTH));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccal-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('календарь закрывается на сегодняшнем месяце, каким бы его ни листали');
