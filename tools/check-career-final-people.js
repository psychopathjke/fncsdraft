// Финал Мейджора садит человека один раз: та же тройка с разными четвёртыми в записи прошедших (после «Переиграть
// день») не садится трижды, и запись прошедших не копит её повторно.
//   node tools/check-career-final-people.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found, set CHROME to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'FinPpl', age:17, source:'rookie', country:'de', countryPing:7,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:2, day:'2026-04-10', division:1, size:4, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    const lad=h=>({h, n:null, o:70, k:'roleFRG'});
    // Запись прошедших, как после «Переиграть день»: одна тройка с тремя разными четвёртыми.
    cr.majorSeed={n:1, season:cr.season, size:4, rows:[], world:true, through:[
      ['Crue','Pez1x','Hanckee',lad('Teekzie')], ['Crue','Pez1x','Hanckee',lad('Gosa .')], ['Crue','Pez1x','Hanckee',lad('kamiki9x')]]};
    const you={name:'ME', pow:90, squad:[careerCard()].filter(Boolean), isYou:true};
    const pm=CARD_MODE, ps=squadSize; CARD_MODE=true; squadSize=4;
    const room=ccMajorFinalRoom(you, cr, you.squad, {n:1, stage:'final'}, {field:50}, 0);
    CARD_MODE=pm; squadSize=ps;
    const cnt={}; room.forEach(t=>(t.squad||[]).forEach(c=>{ const k=hKey(c); cnt[k]=(cnt[k]||0)+1; }));
    const twice=Object.keys(cnt).filter(k=>cnt[k]>1);
    if(twice.length) fail('people seated twice: '+twice.slice(0,5).join(', '));
    const crue=room.filter(t=>(t.squad||[]).some(c=>hKey(c)==='crue')).length;
    if(crue!==1) fail('Crue sits in '+crue+' teams');
    out.steps.push('final room '+room.length+' teams, Crue in one, nobody twice');
    cr.majorSeed.through=[];
    ccMajorSeedThrough(cr, [['Crue','Pez1x','Hanckee',lad('Teekzie')]], 1);
    ccMajorSeedThrough(cr, [['Crue','Pez1x','Hanckee',lad('Gosa .')]], 2);
    if(cr.majorSeed.through.length!==1) fail('through kept the trio twice: '+cr.majorSeed.through.length);
    out.steps.push('through record keeps a person once');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccfinppl-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('OK final room seats a person once');
