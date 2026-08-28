// Вечер переживает обрыв и перезагрузку: свои ответы — из ленты, старт и закрытие — из состояния.
//
// Его слово, 29 августа: «нужно добавить 3» — обрыв посреди вечера.
//
//   node tools/check-mp-resume.js
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
      career:{season:1, day:'2026-01-12', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'rs'},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    const sent=[];
    MP.send=function(m){ sent.push(m); };
    await ccMpEnter({code:'RESUME', role:'a'});
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90, _attrs:null, _roleKey:'roleFRG'};
    const me=ccMpId(), day=careerToday();
    // 1. Свой ответ из ленты — без вопроса и без повтора по проводу.
    ccMpSeedOn('seed-x');
    MP.preload([{t:'act', n:3, kind:'loot', by:me, payload:{v:'swap', by:me, q:1}}],
               [{t:'act', n:2, kind:'loot@', by:'peer', payload:{by:'peer', q:1, g:1}}]);
    let asked=0; const acts0=sent.length;
    const r=await Promise.race([ccMpChoose('loot', async function(){ asked++; return 'take'; }, null, 'x'), new Promise((_,rej)=>setTimeout(()=>rej(new Error('повисло: первый вопрос')), 8000))]);
    check('свой ответ взят из ленты', r && r.v==='swap' && r.mine===true, JSON.stringify(r));
    check('вопрос не задавался', asked===0);
    check('и по проводу не повторён', !sent.slice(acts0).some(m=>m.t==='act' && m.kind==='loot'), JSON.stringify(sent.slice(acts0).map(m=>m.kind)));
    // 2. Догон гасит показ, пока свои ответы есть; кончились — показ вернулся.
    CC_MP_REPLAY=true;
    check('на догоне показ выключен', ccShowOff()===true);
    const race=(p,ms,what)=>Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error('повисло: '+what)), ms||8000))]);
    const r2p=race(ccMpChoose('loot', async function(){ asked++; return 'take'; }, null, 'y'), 8000, 'второй вопрос');
    // барьер late@ ждёт напарника — эхо ленты
    await new Promise(r=>setTimeout(r, 30));
    MP.say({t:'act', n:5, kind:'loot@', by:'peer', payload:{by:'peer', q:2, g:1}});
    const r2=await r2p;
    check('без своего ответа в ленте — спросили', asked===1 && r2.v==='take', asked+' '+JSON.stringify(r2));
    check('и догон кончился', CC_MP_REPLAY===false && ccShowOff()===false);
    ccMpSeedOff();
    // 3. Состояние с идущим вечером у вкладки в гейте — старт из состояния.
    let started=null; const off=MP.on('start', m=>{ started=m; });
    MP.gate=true;
    MP.say({t:'state', team:{day:day, division:1}, seed:'team-rs', peer:MP.peer,
            evening:{seed:'team-rs|'+day, n:7, day:day}, feed:[], closed:null});
    check('гейт получил старт из состояния', started && started.resume===true && started.seed==='team-rs|'+day, JSON.stringify(started));
    off(); MP.gate=false;
    // 4. Состояние с идущим вечером у пустой вкладки — вечер запускается заново.
    let played=0; const play0=careerPlay; careerPlay=async function(){ played++; };
    MP.say({t:'state', team:{day:day, division:1}, seed:'team-rs', peer:MP.peer,
            evening:{seed:'team-rs|'+day, n:7, day:day},
            feed:[{t:'act', n:8, kind:'drop', by:me, payload:{v:{id:'home'}, by:me, q:1}}], closed:null});
    await new Promise(r=>setTimeout(r, 20));
    check('вечер запущен заново', played===1, String(played));
    check('на догоне', CC_MP_REPLAY===true);
    check('свой ответ лежит в ленте', !!MP.own('drop', 1));
    careerPlay=play0; CC_MP_REPLAY=false;
    // Вечер другого дня не трогает вкладку.
    MP.say({t:'state', team:{day:day, division:1}, seed:'team-rs', peer:MP.peer,
            evening:{seed:'s', n:9, day:'2025-01-01'}, feed:[], closed:null});
    await new Promise(r=>setTimeout(r, 20));
    check('чужой день не запускает вечер', played===1);
    // 5. Пропущенное закрытие — из состояния, но только если его ждали.
    let closed=null; const off2=MP.on('close', m=>{ closed=m; });
    MP.closing=false;
    MP.say({t:'state', team:{day:day, division:1}, seed:'team-rs', peer:MP.peer, evening:null, feed:[], closed:{team:{day:'2026-01-13', division:1}, n:12}});
    check('без ожидания закрытие не подсовывается', closed===null);
    MP.closing=true;
    MP.say({t:'state', team:{day:day, division:1}, seed:'team-rs', peer:MP.peer, evening:null, feed:[], closed:{team:{day:'2026-01-13', division:1}, n:12}});
    check('ждавший закрытие получил его', closed && closed.late===true && closed.team.day==='2026-01-13', JSON.stringify(closed));
    off2(); MP.closing=false;
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccresume-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('вечер переживает обрыв и перезагрузку: свои ответы из ленты, старт и закрытие из состояния');
