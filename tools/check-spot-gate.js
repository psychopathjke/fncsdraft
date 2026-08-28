// Вечер без метки спрашивает, а не молчит.
//
// Его вопрос 24 августа: «а как работает, если человек не выбрал метку
// высадки? может запретить начинать игру и сказать, чтоб поставили, или
// окошко, после которого он попадёт туда».
//
// Проверяется всё, что делает это ответом, а не помехой:
//   1) без метки вечер не стартует молча — встаёт окно;
//   2) «поставить» уводит на карту ЭТОГО острова;
//   3) «сыграть без метки» действительно играет, а не отменяет вечер;
//   4) с меткой окна нет вовсе;
//   5) под перемоткой окна нет — ей некому отвечать.
//
//   node tools/check-spot-gate.js
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
  const modal=()=>document.getElementById('ccAskModal');
  const open=()=>modal() && modal().style.display==='flex';
  const seed=(day)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Marker', age:20, source:'rookie', country:'de', countryPing:15,
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
    useLandingSet(careerBrSet());
  };
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }

    // ---- 1. без метки вечер не стартует молча -----------------------------
    seed(day);
    if(careerSpotList(careerBrSet()).length) fail('на чистой карьере уже стоит метка');
    let ran=0;
    const realRun=careerPlayRun;
    careerPlayRun=function(n){ ran++; return; };
    careerPlay();
    if(!open()) fail('вечер без метки стартовал без вопроса');
    if(ran) fail('раннер запустился до ответа');
    const txt=document.getElementById('ccAskText').textContent||'';
    const label=(careerSpotSets()[0]||{}).label||'';
    if(label && txt.indexOf(label)<0) fail('в окне не названа карта: '+txt);
    if(document.getElementById('ccAskYes').textContent!==L().ccSpotGateSet)
      fail('кнопка не про метку: '+document.getElementById('ccAskYes').textContent);
    out.steps.push('без метки: окно с названием карты, раннер ждёт');

    // ---- 2. «поставить» уводит на карту этого острова ---------------------
    ccAskGo(true);
    await wait(30);
    if(ran) fail('после «поставить метку» вечер всё равно стартовал');
    if(!CC_SPOT_OPEN) fail('карта острова не открылась');
    if(careerSpotShown()!==careerSpotKey(careerBrSet()))
      fail('открылся не тот остров: '+careerSpotShown());
    out.steps.push('«поставить метку» открывает карту своего острова, вечер отложен');

    // ---- 3. «сыграть без метки» действительно играет ----------------------
    seed(day);
    ran=0;
    careerPlay();
    if(!open()) fail('второй раз окно не встало');
    ccAskGo(false);
    await wait(30);
    if(ran!==1) fail('«сыграть без метки» не запустил вечер (ran='+ran+')');
    out.steps.push('«сыграть без метки» запускает вечер');

    // ---- 4. с меткой окна нет ---------------------------------------------
    seed(day);
    careerSpotSet(4, careerBrSet());
    ran=0;
    careerPlay();
    if(open()) fail('окно встало при поставленной метке');
    if(ran!==1) fail('с меткой вечер не стартовал');
    out.steps.push('с меткой окна нет, вечер идёт сразу');

    // ---- 5. под перемоткой окна нет ---------------------------------------
    seed(day);
    ran=0;
    CC_FF={until:ccAddDays(careerToday(),7), played:[], trained:0,
           from:{day:careerToday(), div:3, balance:0, earnings:0, reach:0, ovr:92}};
    careerPlay();
    CC_FF=null;
    if(open()) fail('перемотка упёрлась в окно про метку');
    if(ran!==1) fail('под перемоткой вечер не стартовал');
    out.steps.push('под перемоткой окна нет — вечер играется сам');
    careerPlayRun=realRun;
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccgate-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=90000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('вечер без метки спрашивает, и у вопроса есть оба выхода');
