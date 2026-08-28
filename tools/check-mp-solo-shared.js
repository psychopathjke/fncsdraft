// Solo Series в команде — одно лобби на двоих, каждый за себя; фоновая вкладка не голосует за пропуск.
//
// Его отчёты, 28 августа («neeww»): «solo series тоже разные лобби играют»
// (красная строка: field … vs …) — его выбор: «одно лобби на двоих»;
// «я пошёл в другое окно, и у меня поломалось».
//
//   node tools/check-mp-solo-shared.js
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
      career:{season:1, day:'2026-01-17', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ss'},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.send=function(){};
    await ccMpEnter({code:'SOLO01', role:'a'});
    MP.peer={handle:'Zed', nat:'ru', region:'EU', rating:88, _targetOvr:88, _attrs:null, _roleKey:'roleFRG', formPow:2};
    const me=careerCard();
    // 1. Вопрос с адресатом.
    check('свой адресный вопрос — мой', ccMpMine('drop:'+hKey(me))===true);
    check('чужой адресный вопрос — не мой', ccMpMine('loot:'+hKey(MP.peer))===false);
    check('вопрос без адресата — по роли, как был', ccMpMine('drop')===true && ccMpMine('late')===false);
    // 2. Проход — на каждого.
    const ev=careerSoloSeriesOn('2026-01-17');
    check('день хитов найден', !!ev && ev.stage==='heats', JSON.stringify(ev));
    check('без прохода хиты закрыты', careerSoloSeriesCan(ev)===false);
    ccSoloSet(MP.peer, {got:'qual', pass:'qual'});
    check('проход напарника мне хитов не открывает', careerSoloSeriesCan(ev)===false);
    check('но у напарника открывает', careerSoloSeriesCanFor(ev, ccSoloOf(MP.peer))===true);
    ccSoloSet(me, {got:'qual', pass:'qual'});
    check('свой проход открывает', careerSoloSeriesCan(ev)===true);
    check('лежит под ником в soloBy', !!(CAREER.career.soloBy && CAREER.career.soloBy[hKey(me)]) && !CAREER.career.solo);
    check('soloBy — ключ команды', CC_TEAM_KEYS.indexOf('soloBy')>=0);
    // 3. Двое в одной сотне.
    const mk=n=>({name:'t'+n});
    const A=mk('A'), B=mk('B');
    const lobbies=[[mk(1), mk(2), A, mk(3)], [mk(4), B, mk(5)], [mk(6)]];
    ccLobbiesTogether(lobbies, [A, B]);
    check('второй перешёл в лобби первого', lobbies[0].indexOf(A)>=0 && lobbies[0].indexOf(B)>=0, JSON.stringify(lobbies.map(l=>l.map(t=>t.name))));
    check('размеры лобби не поменялись', lobbies[0].length===4 && lobbies[1].length===3, JSON.stringify(lobbies.map(l=>l.length)));
    check('бот ушёл на место второго', lobbies[1].map(t=>t.name).indexOf('t3')>=0, JSON.stringify(lobbies[1].map(t=>t.name)));
    const same=[[A, B, mk(7)]]; ccLobbiesTogether(same, [A, B]);
    check('уже вместе — без изменений', same[0][0]===A && same[0][1]===B);
    // 3б. Настрой в команде — общий: от стажа дуо, не от бота из личного списка.
    CAREER.partners=[{handle:'bot', patience:13, since:'2026-01-01'}];
    CAREER.career.chemSince=ccAddDays(careerToday(), -45);
    const p1=careerPatience();
    CAREER.partners=[{handle:'other', patience:77, since:'2025-01-01'}];
    check('настрой в команде не зависит от личного списка', careerPatience()===p1, p1+' / '+careerPatience());
    check('и растёт со стажем дуо', p1>CAREER_PATIENCE_START && p1<100, String(p1));
    CAREER.career.chemSince=careerToday();
    check('в день сбора — стартовый', careerPatience()===CAREER_PATIENCE_START, String(careerPatience()));
    // 4. Фоновая вкладка: паузы нулевые, сторож реплея не голосует за пропуск.
    Object.defineProperty(document, 'hidden', {get:()=>true, configurable:true});
    skipAnimation=false;
    const t=Date.now(); await sleep(3000);
    check('в фоне пауза не ждётся', Date.now()-t<500, (Date.now()-t)+' мс');
    check('пропуск при этом не включён', skipAnimation===false);
    REPLAY_GUARD_MS=50;
    const hang={};
    ZoneReplay.play=function(){ return new Promise(()=>{}); };
    const v=await playReplayGuarded(hang, [], {isSkipped:()=>false});
    check('сторож обрезал показ', v===false);
    check('но общий пропуск не тронул', skipAnimation===false);
    // Одиночная: сторож ставит пропуск, как ставил.
    delete CAREER.career.mp;
    const v2=await playReplayGuarded(hang, [], {isSkipped:()=>false});
    check('в одиночной сторож ставит пропуск', v2===false && skipAnimation===true);
    skipAnimation=false;
    Object.defineProperty(document, 'hidden', {get:()=>false, configurable:true});
    check('одиночная: solo как был', (ccSoloSet(me, {got:'qual', pass:'qual'}), CAREER.career.solo && CAREER.career.solo.got==='qual'));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccsolo-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('соло в команде: адресные вопросы, проход на каждого, одна сотня на двоих; фон не голосует за пропуск');
