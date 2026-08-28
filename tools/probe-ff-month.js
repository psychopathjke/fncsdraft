// На каком дне встаёт перемотка месяца.
//
// check-career-ff после правки 24 августа стал ловить «месяц отыграл не больше
// недели»: раньше упавший день выбрасывал исключение наружу, теперь он ловится
// и перемотка честно останавливается — то есть поломка была и раньше, просто
// её никто не видел. Проба вытаскивает саму ошибку и её день.
//
//   node tools/probe-ff-month.js [дней]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DAYS = +(process.argv[2] || 30);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], errs:null, err:null, played:0, from:null, to:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Monther', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
    }
    // Дайджест получает объект перемотки целиком — из него и берётся ошибка.
    let caught=null;
    const realDigest=careerFfDigest;
    careerFfDigest=function(ff){ caught=ff; };
    out.from=careerToday();
    await careerFastForward(${DAYS});
    careerFfDigest=realDigest;
    out.to=careerToday();
    out.played=(caught && caught.played && caught.played.length)||0;
    out.err=(caught && caught.err)||null;
  }catch(e){ out.err={day:'-', kind:'-', text:String((e&&(e.stack||e.message))||e)}; }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ffmonth-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log('  дни: ' + out.from + ' → ' + out.to + ', турниров отыграно: ' + out.played);
if ((out.errs||[]).length) console.log('  ошибки страницы: ' + out.errs.join(' | '));
if (out.err) { console.error('ВСТАЛА на ' + out.err.day + ' (' + out.err.kind + '):\n  ' + out.err.text); process.exit(1); }
console.log('месяц прошёл целиком, ни один день не упал');
