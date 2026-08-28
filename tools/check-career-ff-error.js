// Упавший день перемотки называет себя.
//
// Его правка 24 августа: «не скипается почему-то» и скрин — «0 дней
// пропущено», а ниже «турниров в эти дни нет». Так выглядела УПАВШАЯ
// перемотка: исключение улетало из цикла, дайджест рисовался по нетронутым
// числам, и вместо ошибки игрок читал вежливое «ничего не произошло».
//
// Воспроизвести настоящую поломку не вышло ни на одном типе вечера
// (probe-ff-throw.js), поэтому здесь она подстроена нарочно: раннер кубка
// заменяется на бросающий. Проверяется то, что после этого видит игрок.
//
//   node tools/check-career-ff-error.js
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
  const out={steps:[], fail:null};
  const fail=m=>{ if(!out.fail) out.fail=m; throw new Error(m); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Breaker', age:20, source:'rookie', country:'de', countryPing:15,
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
    const started=careerToday();

    // Ломаем ровно один вечер — тот, что стоит сегодня.
    const MARK='подстроенная поломка вечера';
    runCareerCup=async function(){ throw new Error(MARK); };

    await careerFastForward(7);
    // Дайджест рисуется в finally, дать ему кадр.
    for(let i=0;i<80 && !document.getElementById('ccFfOver'); i++) await wait(20);

    const over=document.getElementById('ccFfOver');
    if(!over) fail('дайджест перемотки не появился вовсе');
    const txt=over.textContent||'';
    if(txt.indexOf(MARK)<0) fail('в дайджесте нет текста ошибки: '+txt.slice(0,180));
    if(!over.querySelector('.cc-ffo-err')) fail('нет плашки упавшего дня');
    out.steps.push('дайджест называет упавший день и печатает ошибку');

    // Перемотка останавливается на этом дне, а не идёт дальше вслепую.
    if(careerToday()!==started)
      fail('перемотка пошла дальше упавшего дня: '+started+' → '+careerToday());
    out.steps.push('перемотка останавливается на упавшем дне ('+started+')');

    // И сама фича не окирпичивается: CC_FF снят, хаб на экране.
    if(typeof CC_FF!=='undefined' && CC_FF) fail('CC_FF остался выставленным — вторая перемотка не запустится');
    if(!document.getElementById('screen-career-hub').classList.contains('active'))
      fail('после падения игрок остался не в хабе');
    out.steps.push('CC_FF снят, игрок в хабе — вторая попытка возможна');
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccfferr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('упавшая перемотка говорит, на чём встала, и не ломает вторую попытку');
