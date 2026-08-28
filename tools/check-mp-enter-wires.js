// Вход в лобби вешает обработчики решений сразу — без перезагрузки.
//
// Живой сторож 28 августа (check-mp-live-two): оба голоса «пропустить» лежат
// в ленте, а skipAnimation false. ccMpThirdWire (в нём и голос пропуска, и
// предложение третьего) звал только ccMpBoot при загрузке сохранённой
// карьеры; ccMpEnter — создание/вход в лобби с экрана — не звал.
//
//   node tools/check-mp-enter-wires.js
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
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Wire', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[]},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.send=function(){};
    check('до входа обработчик не висит', !ccMpThirdWire.done);
    const ok=await ccMpEnter({code:'WIRE01', role:'a'});
    check('вход состоялся', ok===true);
    check('обработчики повешены входом', ccMpThirdWire.done===true);
    // И голос пропуска считается: свой и чужой — от эха сервера.
    CAREER_RUN=true; ccMpSeedOn('wire-seed'); ccMpSkipReset();
    MP.say({t:'act', kind:'skip', by:ccMpId(), n:1, payload:{by:ccMpId()}});
    MP.say({t:'act', kind:'skip', by:'peer', n:2, payload:{by:'peer'}});
    check('два голоса — пропуск включён', skipAnimation===true && ccMpSkipBoth(), 'skip '+skipAnimation);
    ccMpSeedOff(); CAREER_RUN=false;
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccwire-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(String.fromCharCode(92)).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('вход в лобби вешает обработчики сразу, и голос пропуска считается');
