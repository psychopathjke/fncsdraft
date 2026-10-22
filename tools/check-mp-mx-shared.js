// Квал соло-недели Мейджора (World Cup Solo 2019, соло-FNCS 2020) в команде — общий вечер, если играть могут оба.
//
// Notion 21.10, двое играли командой: «на квалах соло ворлд кап… кнопка на соло кап 0/2 вообще перестала работать,
// ты соло запускаешься и играешь, следовательно таблицы всегда разные и понятия кто квальнул никакого».
// Решение — общие отметки «могу играть сегодня» (cr.mxCan, по нику, объединением) и ccMXSharedOk у обоих.
//
//   node tools/check-mp-mx-shared.js
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
        region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, year:2019, year0:2019, day:'2019-04-01', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'mxs'},
      partners:[]}));
    careerLoad();
    // Первый день квала соло-недели World Cup 2019.
    let day=null;
    for(let d='2019-04-01'; d<'2019-07-01'; d=ccAddDays(d, 1)){
      const ev=careerMajorOn(d); const sp=ev && ev.yx ? ccMXSpec(ev.yx, ev.n) : null;
      if(sp && sp.size===1 && ev.stage==='q'){ day=d; break; }
    }
    check('квал соло-недели World Cup 2019 найден', !!day);
    out.notes.day=day;
    CAREER.career.day=day;
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.send=function(){}; MP.push=function(){};
    await ccMpEnter({code:'MXSOLO', role:'a'});
    MP.state='live';
    MP.peer={handle:'Zed', nat:'ru', region:'EU', rating:84, _targetOvr:84, _attrs:null, _roleKey:'roleFRG', formPow:1};
    const me=careerCard(), mk=hKey(me), pk=hKey(MP.peer), ev=careerMajorOn(day);
    check('день соло-Мейджора в команде', ccMXSoloTeamDay()===true);
    check('mxCan — ключ команды', CC_TEAM_KEYS.indexOf('mxCan')>=0);
    // 1. Своя отметка ставится сохранением.
    careerSave();
    check('своя отметка «могу»', (CAREER.career.mxCan||{})[mk]===day+'|1', JSON.stringify(CAREER.career.mxCan));
    // 2. Без отметки напарника — личный вечер (как было).
    check('без отметки напарника — личный', ccMXSharedOk(ev)===false);
    // 3. Отметка напарника — общий.
    CAREER.career.mxCan[pk]=day+'|1';
    check('оба могут — общий', ccMXSharedOk(ev)===true);
    // 4. Напарнику играть нечего — личный.
    CAREER.career.mxCan[pk]=day+'|0';
    check('напарник не может — личный', ccMXSharedOk(ev)===false);
    CAREER.career.mxCan[pk]=ccAddDays(day, -1)+'|1';
    check('вчерашняя отметка напарника не считается', ccMXSharedOk(ev)===false);
    // 5. Кто-то уже сыграл сегодня врозь — личный.
    CAREER.career.mxCan[pk]=day+'|1';
    CAREER.career.mxDone={[pk]:day};
    check('напарник уже сыграл — личный', ccMXSharedOk(ev)===false);
    CAREER.career.mxDone={};
    // 6. Слияние: чужое берётся, своё остаётся своим (несвежая копия моей отметки у напарника её не затирает).
    const t=ccTeamState(); t.mxCan={[mk]:ccAddDays(day, -3)+'|0', [pk]:day+'|1', zzz:day+'|1'};
    ccApplyTeamState(t);
    const mc=CAREER.career.mxCan||{};
    check('своя отметка после слияния своя', mc[mk]===day+'|1', JSON.stringify(mc));
    check('чужие отметки приехали', mc[pk]===day+'|1' && mc.zzz===day+'|1', JSON.stringify(mc));
    // 7. Без связи — личный.
    MP.state='lost';
    check('без связи — личный', ccMXSharedOk(ev)===false);
    MP.state='live';
    // 8. Хиты и финал — не квал недели: личные, как были.
    check('не квал (stage≠q) — личный', ccMXSharedOk(Object.assign({}, ev, {stage:'heat'}))===false);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccmxs-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('квал соло-недели в команде — общий, когда оба могут '+JSON.stringify(out.notes));
