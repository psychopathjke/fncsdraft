// «Откатиться на день» онлайн — по голосам всех в комнате, каждый к своему снимку того же дня.
//
// Его слово, 22 октября: «кнопка отката на один игровой день… можно онлайн сделать тоже».
//
//   node tools/check-mp-undo.js
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
        region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-04', division:2, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'undo'},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    const sent=[], pushed=[];
    MP.send=function(m){ if(m && m.t==='act'){ sent.push(m.kind+':'+JSON.stringify(m.payload||{})); MP.say({t:'act', kind:m.kind, by:ccMpId(), n:sent.length, payload:Object.assign({}, m.payload||{})}); } };
    MP.push=function(t){ pushed.push(t); };
    await ccMpEnter({code:'UNDOVOTE', role:'a'});
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:80, _targetOvr:80, _attrs:null, _roleKey:'roleFRG'};
    ccAsk=function(q, yes){ yes(); };
    let restored=null;
    ccUndoRestore=function(u){ restored=u.day; };
    const day0=careerToday();
    // 1. Снимок в команде снимается, кнопка есть.
    check('в команде откат разрешён', ccUndoOk() && ccUndoShared());
    ccUndoSnap();
    CAREER.career.day=ccAddDays(day0, 1);
    check('снимок дня есть', !!ccUndoInfo() && ccUndoInfo().day===day0, JSON.stringify(ccUndoInfo() && ccUndoInfo().day));
    check('кнопка «Переиграть» в команде', careerFfButtonsHTML().indexOf('ccUndoAskRestore()')>=0);
    // 2. Свой голос — 1/2, отката ещё нет.
    ccUndoAskRestore();
    check('голос ушёл', sent.some(s=>s.indexOf('undo:')===0), sent.join(' | '));
    check('ждём остальных', CC_MP_UNDO.mine && ccUndoVotes()===1 && restored===null);
    check('строка ожидания 1/2', ccUndoOfferHTML().indexOf('1/2')>=0, ccUndoOfferHTML().slice(0,160));
    // 3. Отказ напарника снимает.
    MP.say({t:'act', kind:'undono', by:'peer', n:50, payload:{by:'peer', day:day0}});
    check('отказ снял голос', CC_MP_UNDO.day===null && ccUndoOfferHTML()==='');
    // 4. Предложение напарника — плашка, согласие — откат.
    MP.say({t:'act', kind:'undo', by:'peer', n:51, payload:{by:'peer', day:day0}});
    check('плашка предложения', ccUndoOfferHTML().indexOf('ccUndoDecline')>=0 && ccUndoOfferHTML().indexOf('ccUndoAskRestore')>=0);
    check('без своего голоса отката нет', restored===null);
    ccUndoAskRestore();
    check('согласие обоих — откат к снимку', restored===day0, String(restored));
    // 5. Предложение на день, которого у нас нет, — отказ «нет снимка».
    sent.length=0; CC_MP_UNDO={day:null, mine:false, who:{}, err:false};
    MP.say({t:'act', kind:'undo', by:'peer', n:52, payload:{by:'peer', day:'2026-01-20'}});
    check('нет снимка — undono', sent.some(s=>s.indexOf('undono:')===0 && s.indexOf('nosnap')>=0), sent.join(' | '));
    // 6. После перезагрузки: новое состояние сервера не берётся, хозяин шлёт своё.
    CAREER.career.day=day0;
    localStorage.setItem(ccUndoKey()+'go', day0);
    const newer=ccTeamState(); newer.day=ccAddDays(day0, 1);
    pushed.length=0;
    check('состояние новее отката не берётся', ccMpStateOk(newer, true)===false);
    await new Promise(r=>setTimeout(r, 20));
    check('хозяин отправил своё', pushed.length===1 && pushed[0].day===day0, JSON.stringify(pushed.map(p=>p.day)));
    check('метка одноразовая', localStorage.getItem(ccUndoKey()+'go')===null && ccMpStateOk(newer, true)===true);
    // 7. Одиночная — без голосования.
    delete CAREER.career.mp; restored=null; sent.length=0;
    CAREER.career.day=ccAddDays(day0, 1);
    ccUndoAskRestore();
    check('в одиночной — сразу', restored===day0 && sent.length===0, String(restored)+' '+sent.join(','));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccundo-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('«Откатиться на день» онлайн — по голосам, каждый к своему снимку, сервер не перетирает');
