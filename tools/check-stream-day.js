// Обычный эфир в свободный день идёт НА ЭКРАНЕ, а не превращается в статистику.
//
// Его отчёт 8 сентября 2026: «когда жмёшь стрим в свободный день, не турнир, после
// нажатия показывается статистика». Так и было: день списывался молча, вкладка
// перерисовывалась, и человек оставался смотреть на список каналов и числа.
//
// Проверяется:
//   * нажатие вида эфира поднимает рамку трансляции (ccTvFrame, body.cc-onair);
//   * строка эфира называет вид и часы, а не «ждём первую игру»;
//   * эфир кончается сам: рамка снимается, встаёт сводка;
//   * числа сводки — ТЕ ЖЕ, что посчитал день (streamLast): ничего не начисляется
//     дважды, энергия списана один раз;
//   * под пропуском и в симуляции рамки нет вовсе.
//
//   node tools/check-stream-day.js
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
  const fail=m=>{ out.fail=m; throw new Error(m); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const save=()=>localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Streamer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-05', division:3, earnings:0, balance:500, reach:5000,
              tokens:[], log:[], news:[]}, partner:null}));
  try{
    save(); careerEntry();
    careerTab('streams'); await wait(400);
    const kind='grind', k=ccStreamKind(kind);
    const energy0=careerEnergy();
    const go=[...document.querySelectorAll('.tv-go')]
      .find(b=>(b.getAttribute('onclick')||'').indexOf("careerStreamGo('"+kind+"')")>=0);
    if(!go) fail('на плеере нет кнопки обычного эфира');
    if(go.disabled) fail('кнопка обычного эфира выключена в свободный день');
    go.click();
    await wait(700);
    const box=document.getElementById('ccTvFrame');
    if(!box) fail('после нажатия эфира рамки нет — вкладка просто перерисовалась');
    if(!document.body.classList.contains('cc-onair')) fail('страница не помечена как «в эфире»');
    const run=(document.getElementById('ccTvRun')||{textContent:''}).textContent;
    if(run.indexOf(L()['ccStream_'+kind])<0) fail('строка эфира не называет вид: '+run);
    if(!/\\d/.test(run)) fail('строка эфира без часов: '+run);
    if(run.indexOf(L().ccTvWait)>=0) fail('обычный эфир ждёт первую игру, которой не будет');
    if(document.getElementById('ccTvSum')) fail('сводка встала, не дав эфиру пройти');
    out.steps.push('эфир идёт: рамка на месте, строка «'+run.replace(/\\s+/g,' ').trim().slice(0,60)+'»');
    // Энергия списана ровно один раз — рамка не платит второй.
    const spent=energy0-careerEnergy();
    if(spent!==k.energy) fail('списано '+spent+' энергии вместо '+k.energy);
    out.steps.push('день оплачен один раз: '+spent+' энергии');
    // Эфир кончается сам.
    for(let i=0;i<80 && document.getElementById('ccTvFrame');i++) await wait(400);
    if(document.getElementById('ccTvFrame')) fail('эфир не кончился сам');
    const sum=document.getElementById('ccTvSum');
    if(!sum) fail('после эфира нет сводки');
    if(document.body.classList.contains('cc-onair')) fail('страница осталась «в эфире» после конца');
    const cr=CAREER.career, last=cr.streamLast;
    if(!last || !last.sum) fail('сводка не записана в сейв');
    if(last.sum.fol!==(last.a&&last.a[2])) fail('фолловеры в сводке ('+last.sum.fol+') не те, что посчитал день ('+(last.a&&last.a[2])+')');
    if(last.sum.cash!==last.m) fail('деньги в сводке ('+last.sum.cash+') не те, что посчитал день ('+last.m+')');
    if(last.sum.hours!==(k.hours||4)) fail('часы в сводке '+last.sum.hours+', у вида '+(k.hours||4));
    if(!(last.sum.avg>0) || !(last.sum.peak>=last.sum.avg)) fail('онлайн в сводке: '+JSON.stringify(last.sum));
    out.steps.push('сводка после эфира: онлайн '+last.sum.avg+', пик '+last.sum.peak+', +'+last.sum.fol+' фолловеров, $'+last.sum.cash+', '+last.sum.hours+' ч');
    ccTvSummaryClose();

    // Под пропуском рамки нет: перемотка не должна упираться в эфир.
    localStorage.removeItem('fncsdraft_career'); save(); careerEntry();
    skipAnimation=true;
    const ok=careerStreamGo('grind');
    if(!ok) fail('под пропуском эфир не состоялся вовсе');
    if(document.getElementById('ccTvFrame')) fail('под пропуском поднялась рамка');
    skipAnimation=false;
    out.steps.push('под пропуском эфир считается без рамки');
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccstr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=180000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('обычный эфир идёт на экране и кончается сводкой');
