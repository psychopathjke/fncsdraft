// Напарник уже стоит на барьере — свой показ перематывается.
//
// Его слово, 30 августа: «почему-то долго после выбора тимейта другой ждёт».
// Проверяется: без прихода напарника в очереди показ идёт как шёл (sleep
// ждёт, кадры играют); с его приходом на барьер ('game@' и адресный
// 'loot:…@') sleep отпускает сразу и реплей обрезается; свой же приход и
// обычные ответы (без @) ничего не перематывают; вопрос человеку ccShowOff
// не читает.
//
//   node tools/check-mp-hurry.js
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
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Hurry', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-11', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'hurry',
              mp:{code:'ABC123', role:'a'}}, partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.send=function(){};
    await ccMpEnter({code:'ABC123', role:'a'});
    skipAnimation=false;
    const took=async fn=>{ const t0=performance.now(); await fn(); return performance.now()-t0; };
    // 1. Пусто — показ идёт.
    check('без прихода — не спешим', ccMpHurry()===false && ccShowOff()===false);
    const slow=await took(()=>sleep(300));
    check('sleep ждёт', slow>=250, String(Math.round(slow)));
    // 2. Свой приход и обычный ответ напарника — не повод.
    MP.say({t:'act', kind:'loot', by:'peer', n:1, payload:{by:'peer', v:'take', q:3}});
    check('ответ без @ не перематывает', ccMpHurry()===false);
    // 3. Приход напарника на барьер.
    MP.say({t:'act', kind:'game@', by:'peer', n:2, payload:{by:'peer', sum:'x', q:1, g:2}});
    check('приход напарника — спешим', ccMpHurry()===true && ccShowOff()===true);
    const fast=await took(()=>sleep(300));
    check('sleep отпускает сразу', fast<100, String(Math.round(fast)));
    // Реплей обрезается: сторож показа читает ccShowOff через isSkipped.
    const opts={};
    const play=ZoneReplay.play;
    ZoneReplay.play=function(h, tl, o){ return new Promise(r=>setTimeout(()=>r(!(o.isSkipped && o.isSkipped())), 20)); };
    const shown=await playReplayGuarded(null, [], opts);
    ZoneReplay.play=play;
    check('реплей обрезан', shown===false && opts.isSkipped()===true);
    // Забрали приход барьером — снова не спешим.
    MP.take('game@', 1);
    check('после барьера — не спешим', ccMpHurry()===false);
    // 4. Адресный барьер тоже считается.
    MP.say({t:'act', kind:'loot:zed@', by:'peer', n:3, payload:{by:'peer', sum:'x', q:4, g:1}});
    check('адресный барьер — спешим', ccMpHurry()===true);
    MP.take('loot:zed@', 4);
    // 5. Вопрос человеку ccShowOff не читает.
    const src=String(ccChoiceBox);
    check('окно выбора не смотрит на ccShowOff', src.indexOf('ccShowOff')<0 && src.indexOf('ccMpHurry')<0);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cchurry-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('напарник на барьере — свой показ перематывается, вопросы остаются');
