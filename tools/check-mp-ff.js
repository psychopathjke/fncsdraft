// Перемотка календаря в команде — по двум подтверждениям; пустые дни шагают оба.
//
// Его слово, 29 августа: «в календаре можно сделать, чтоб мотать для двоих два
// подтверждения». Раньше в команде перемотка была закрыта (ccMpNoFf).
//
//   node tools/check-mp-ff.js
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
    // Дивизион 2: перфоманс четверга не играется — три пустых дня подряд.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nexty', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-04', division:2, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ff'},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    const sent=[];
    MP.send=function(m){ if(m && m.t==='act'){ sent.push(m.kind); MP.say({t:'act', kind:m.kind, by:ccMpId(), n:sent.length, payload:Object.assign({}, m.payload||{})}); } };
    await ccMpEnter({code:'FFVOTE', role:'a'});
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:80, _targetOvr:80, _attrs:null, _roleKey:'roleFRG'};
    const day0=careerToday();
    // 1. Кнопки перемотки в команде есть, и панель без предложения пуста.
    const html=careerFfButtonsHTML();
    check('кнопки неделя/месяц в команде на месте', html.indexOf('careerFfConfirm(')>=0);
    check('без предложения плашки нет', ccMpFfOfferHTML()==='');
    // 2. Свой голос — 1/2, перемотка не идёт.
    const ff0=careerFastForward; let ran=null;
    careerFastForward=async function(days, agreed){ ran={days:days, agreed:agreed}; return ff0.call(this, days, agreed); };
    careerFfToDay('2026-02-06');
    check('голос ушёл', sent.indexOf('ff')>=0, sent.join(','));
    check('после своего голоса — ждём', !!ccMpFfPending() && ccMpFfPending().mine && !ccMpFfPending().theirs);
    check('перемотка ещё не пошла', ran===null && careerToday()===day0);
    check('строка ожидания на панели', ccMpFfOfferHTML().indexOf('ccMpFfDecline')>=0);
    // 3. Отказ напарника снимает предложение.
    MP.say({t:'act', kind:'ffno', by:'peer', n:9, payload:{by:'peer', day:day0}});
    check('отказ снял предложение', ccMpFfPending()===null);
    // 4. Предложение напарника — плашка с «доиграть вместе».
    MP.say({t:'act', kind:'ff', by:'peer', n:10, payload:{by:'peer', day:day0, until:'2026-02-06'}});
    const offer=ccMpFfOfferHTML();
    check('плашка предложения', offer.indexOf("careerFfToDay('2026-02-06')")>=0, offer.slice(0,120));
    check('своего голоса ещё нет', ccMpFfPending().theirs && !ccMpFfPending().mine);
    // 5. Подтверждение — перемотка у обоих, пустые дни шагают.
    careerFfToDay('2026-02-06');
    for(let i=0;i<200 && CC_FF;i++) await new Promise(r=>setTimeout(r, 50));
    check('перемотка пошла по согласию', !!ran && ran.agreed==='2026-02-06' && ran.days===2, JSON.stringify(ran));
    check('два пустых дня пройдены в команде', careerToday()==='2026-02-06', careerToday());
    check('окно шага закрыто после перемотки', CC_MP_DAY_DUE===false);
    check('предложение снято', ccMpFfPending()===null);
    // 6. Голос за вчерашнюю дату глух.
    MP.say({t:'act', kind:'ff', by:'peer', n:11, payload:{by:'peer', day:day0, until:'2026-02-09'}});
    check('вчерашний голос не считается', ccMpFfPending()===null);
    // 7. Одиночная — как была: сразу перемотка.
    delete CAREER.career.mp; ran=null;
    careerFfToDay('2026-02-07');
    for(let i=0;i<200 && CC_FF;i++) await new Promise(r=>setTimeout(r, 50));
    check('в одиночной — сразу', !!ran && ran.agreed===undefined && careerToday()==='2026-02-07', JSON.stringify(ran)+' '+careerToday());
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccff-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('перемотка в команде — по двум подтверждениям, пустые дни шагают оба');
