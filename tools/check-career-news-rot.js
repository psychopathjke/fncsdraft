// Лента новостей хаба не падает без карьеры.
//
// Его скрин 7 сентября 2026: «Uncaught TypeError: Cannot read properties of null
// (reading 'career') @65944» — ccNewsLeadOf в таймере ротации ленты
// (careerNewsRotStart). Таймер проверял лишь, что #nhLead на месте, а после выхода
// из карьеры (careerEnd → CAREER=null, show('screen-mode')) экран хаба только
// прячется классом active, элемент остаётся, и тик шёл в CAREER=null.
//
// Проверяется: ccNewsLeadOf / careerNewsShow молчат при CAREER=null; careerEnd
// гасит таймер; таймер, заставший спрятанный хаб или пустую карьеру, снимает себя.
//
//   node tools/check-career-news-rot.js
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
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Rot', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:3, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[{id:'n1', t:'x', text:'one'}, {id:'n2', t:'x', text:'two'}, {id:'n3', t:'x', text:'three'}]},
      partner:null}));
    careerEntry();
    if(!CAREER || !CAREER.career) fail('career did not open');
    if(!ccNewsLeadOf('n1')) fail('a news lead is not found while the career is open');
    careerNewsRotStart(['n1','n2','n3']);
    if(!CC_NEWS_ROT) fail('the rotation did not start');
    out.steps.push('career open: leads found, rotation running');

    // Выход из карьеры: таймер снят, лента молчит, ошибок нет.
    careerEnd();
    if(CAREER!==null) fail('careerEnd left the career in place');
    if(CC_NEWS_ROT) fail('careerEnd left the news rotation ticking');
    if(ccNewsLeadOf('n1')!==null) fail('ccNewsLeadOf returned a lead without a career');
    careerNewsShow('n1');   // не должно бросать
    out.steps.push('after careerEnd: rotation stopped, lead lookup and show are silent');

    // Таймер, оставшийся с прежней карьеры, снимает себя на первом тике.
    CC_NEWS_IDS=['n1','n2']; CH_NEWS_PICK=null;
    CC_NEWS_ROT=setInterval(function(){}, 100000);   // «чужой» таймер, чтобы Start не вышел рано
    careerNewsRotStart(['n1','n2']);
    await new Promise(r=>setTimeout(r, CC_NEWS_ROT_MS+400));
    if(CC_NEWS_ROT) fail('the rotation kept ticking with no career');
    out.steps.push('a stale rotation removes itself on the first tick without a career');
    if(window.__errs.length) fail('page errors: '+window.__errs.join(' | '));
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccnews-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAIL: ' + out.fail); process.exit(1); }
console.log('the hub news rotation goes quiet when the career is gone');
