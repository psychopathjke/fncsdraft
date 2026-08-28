// Почему перемотка проходит ноль дней.
//
// Его скрин 24 августа: «0 дней пропущено», сегодня — Duos Victory Cup 1,
// дивизион 1. Перемотка ловит любую ошибку дня в finally и отдаёт дайджест как
// есть, поэтому упавший первый день выглядит как «ничего не пропустилось».
// Проба зовёт ровно то, что зовёт перемотка, и НЕ глотает исключение.
//
//   node tools/probe-ff-throw.js [kind]     kind: victory|cup|final|eval|solo
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const KIND = process.argv[2] || 'victory';
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
window.addEventListener('unhandledrejection', e=>window.__errs.push('promise: '+
  String((e.reason&&(e.reason.stack||e.reason.message))||e.reason)));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], errs:null, threw:null, days:null};
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind===${JSON.stringify(KIND)})){ day=d; break; }
    out.steps.push('день ${KIND}: '+day);
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Ffer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:1000, reach:10000,
              tokens:[], log:[], news:[], wf:{monday:careerMonday(day)}},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
    }
    const next=careerNext();
    out.steps.push('careerNext: '+JSON.stringify(next && {type:next.type, day:next.day})+
      ', можно играть: '+(next?careerCanPlay(next):'-'));
    // Так это делает перемотка: скип зажат, CC_FF выставлен.
    CC_FF={until:ccAddDays(careerToday(),7), played:[], trained:0,
           from:{day:careerToday(), div:1, balance:0, earnings:0, reach:0, ovr:96}};
    const hold=setInterval(()=>{ skipAnimation=true; }, 10);
    const was=careerToday();
    try{ await careerPlay(); }
    catch(e){ out.threw=String((e && (e.stack||e.message)) || e); }
    clearInterval(hold);
    CC_FF=null;
    out.days=was+' → '+careerToday();
    out.steps.push('строк в журнале: '+((CAREER.career.log||[]).length));
  }catch(e){ out.threw=out.threw||String((e && (e.stack||e.message))||e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ffthrow-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
console.log('  день: ' + out.days);
if((out.errs||[]).length) console.error('ОШИБКИ СТРАНИЦЫ:\n    ' + out.errs.join('\n    '));
if(out.threw){ console.error('БРОСИЛО:\n' + out.threw); process.exit(1); }
console.log('день ' + KIND + ' отыгрался под перемоткой без исключения');
