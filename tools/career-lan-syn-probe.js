// Из чего сложена сила ЛАН-поля по регионам — его подозрение, 23 августа:
// «слишком много синергия дает и язык мб, чет Америка всегда доминирует».
// Проба строит поле Саммита и раскладывает pow: голый рейтинг против
// синергии (дуо/гражданство/язык) — у кого сколько.
//
//   node tools/career-lan-syn-probe.js
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
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'SynProbe', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:95, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-29', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry(); CARD_MODE=true; squadSize=2;
    const me=careerCard();
    const field=careerSummitField('final', {isYou:true, squad:[me,me]}, [me,me]);
    const byReg={};
    field.filter(t=>!t.isYou).forEach(t=>{
      const reg=(t.squad&&t.squad[0]&&t.squad[0].region)||'?';
      const r=byReg[reg]=byReg[reg]||{n:0, pow:0, syn:0, duo:0, natLang:0};
      r.n++; r.pow+=t.pow||0;
      const links=(t.syn&&t.syn.links)||[];
      const duo=links.filter(l=>l.type==='partner').reduce((s,l)=>s+(l.val||0),0);
      const bonus=(t.syn&&t.syn.bonus)||0;
      r.syn+=bonus; r.duo+=duo; r.natLang+=Math.max(0, bonus-duo);
    });
    out.regions={};
    Object.keys(byReg).forEach(k=>{
      const r=byReg[k];
      out.regions[k]={n:r.n, avgPow:Math.round(r.pow/r.n*10)/10,
        avgSyn:Math.round(r.syn/r.n*10)/10, avgDuo:Math.round(r.duo/r.n*10)/10,
        avgNatLang:Math.round(r.natLang/r.n*10)/10};
    });
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsyn-'));
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
