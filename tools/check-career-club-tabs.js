// Основал свой клуб — хаб обязан рисоваться целиком, на каждой вкладке.
//
// Его скрин 11 сентября: основал организацию по ссылке с деньгами, открыл
// вкладку «карьера» — красный экран, «Cannot read properties of undefined
// (reading type)». Плитка клуба читала org.goal.type у контракта, которого нет:
// свой клуб ставится в CAREER.org сам, без зарплаты, доли и задачи сезона.
//
// Здесь карьера основывает клуб и проходит по всем вкладкам подряд.
//
//   node tools/check-career-club-tabs.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {tabs: {}, err: null};
  try{
    LANG='ru'; CC_L_CACHE={};
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Sky', age:16, source:'card', country:'dk', countryPing:12, closeRangeEdge:0,
              region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:0,
              photo:null, handle:'Sky', cardRegion:'EU', nat:'dk'},
      career:{season:1, day:'2026-01-08', division:1, earnings:906460, balance:906460, reach:10000,
              tokens:[], log:[], news:[], size:2},
      gear:{own:[], conf:0}, partners:[{handle:'Scroll', cardRegion:'EU', dev:0, since:'2025-12-01'}]
    }));
    careerLoad(); CARD_MODE=true; squadSize=2;
    var ce=console.error; console.error=function(){ try{ out.stack=out.stack||[...arguments].map(x=>(x&&x.stack)?String(x.stack):String(x)).join(' | ').slice(0,900); }catch(e){} return ce.apply(console, arguments); };
    // Как у него: основал свой клуб по ссылке с деньгами и пошёл по вкладкам.
    CAREER.career.balance=2000000;
    careerClubFound('Loyalty Gamer');
    ['centre','log','me','calendar','social','streams','table','shop','hist','stats'].forEach(function(t){
      try{ careerTab(t); out.tabs[t]='ok'; }
      catch(e){ out.tabs[t]='ERR '+String(e && (e.stack||e.message) || e).slice(0,400); }
      try{ const box=document.getElementById('chBody');
           const bad=box && box.textContent && box.textContent.indexOf('не нарисовался')>=0;
           if(bad) out.tabs[t]='КРАСНЫЙ ЭКРАН: '+box.textContent.replace(/\\s+/g,' ').slice(0,300); }catch(e){}
    });
  }catch(e){ out.err=String(e && (e.stack||e.message) || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabs-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], {maxBuffer: 256 * 1024 * 1024, encoding: 'utf8'});
fs.rmSync(dir, {recursive: true, force: true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('страница не ответила'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.tabs, null, 1));
if (out.err) { console.error('ОШИБКА: ' + out.err); process.exit(2); }
if (out.stack) console.log('стек: ' + out.stack);
const bad = Object.keys(out.tabs).filter(t => out.tabs[t] !== 'ok');
if (bad.length) { bad.forEach(t => console.log(' FAIL вкладка ' + t + ': ' + out.tabs[t])); process.exit(1); }
console.log('со своим клубом рисуются все вкладки хаба');
