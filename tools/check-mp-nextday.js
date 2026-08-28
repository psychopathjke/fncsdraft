// «Следующий день» в команде — голосование: 0/2, 1/2, и день у обоих от второго голоса.
//
// Его отчёт, 28 августа: «СЛЕДУЮЩИЙ ДЕНЬ не нажимается» — в команде день
// двигал только сервер, кнопка молчала. Его слово: «пусть там тоже будет 0/2».
//
//   node tools/check-mp-nextday.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nexty', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-03', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'nd'},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    // Подставной сервер: эхо act всем, с именем отправителя.
    const sent=[];
    MP.send=function(m){ if(m && m.t==='act'){ sent.push(m.kind); MP.say({t:'act', kind:m.kind, by:ccMpId(), n:sent.length, payload:Object.assign({}, m.payload||{})}); } };
    await ccMpEnter({code:'NEXT01', role:'a'});
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90, _attrs:null, _roleKey:'roleFRG'};
    const day0=careerToday();
    careerRenderHub('centre');
    check('до голоса на кнопке 0/2', ccMpNextTag().trim()==='0/2', ccMpNextTag());
    careerNextDay();
    check('голос ушёл на сервер', sent.indexOf('nextday')>=0, sent.join(','));
    check('после своего голоса — 1/2', ccMpNextTag().trim()==='1/2', ccMpNextTag());
    check('день ещё не сдвинулся', careerToday()===day0, careerToday());
    careerNextDay();
    check('повторный клик голос не дублирует', sent.filter(k=>k==='nextday').length===1);
    // Голос напарника — эхо сервера.
    MP.say({t:'act', kind:'nextday', by:'peer', n:9, payload:{by:'peer', day:day0}});
    check('два голоса — день сдвинулся на один', careerToday()===ccAddDays(day0, 1), careerToday());
    check('и счётчик обнулился на новый день', ccMpNextTag().trim()==='0/2', ccMpNextTag());
    // Голос за ВЧЕРА не считается.
    MP.say({t:'act', kind:'nextday', by:'peer', n:10, payload:{by:'peer', day:day0}});
    check('голос за прошлый день глух', ccMpNextTag().trim()==='0/2' && careerToday()===ccAddDays(day0, 1));
    // Контроль одиночной: без лобби кнопка двигает день сразу.
    delete CAREER.career.mp;
    const d1=careerToday(); careerNextDay();
    check('в одиночной — сразу завтра', careerToday()===ccAddDays(d1, 1), careerToday());
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccnext-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('«следующий день» в команде — 0/2, 1/2, и день у обоих от второго голоса');
