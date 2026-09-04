// Метка, поставленная одним, видна второму — и после одиночного соло-вечера тоже.
//
// Его слово, 30 августа: «у тимейта не показывает spot, который выбрал
// тимейт для дуо». Закрытие вечера поднимает CC_MP_HOLD, снимает его шаг дня;
// в соло «один играет, второй ждёт» шага дня нет, пока не отыграл второй, и
// всё это время careerSave не отправлял ничего — ни итог соло, ни метку.
// Проверяется:
//   1) метка уезжает состоянием (push) и у напарника встаёт на плитку вечера;
//   2) под CC_MP_HOLD push не уходит (так задумано между close и шагом дня);
//   3) хвост соло-раннера снимает HOLD перед careerSave;
//   4) чужое состояние с меткой применяется и хаб её рисует.
//
//   node tools/check-mp-spot-sync.js
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
      player:{nick:'Spotter', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-12', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'spot-sync',
              mp:{code:'ABC123', role:'a'}}, partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    const pushed=[];
    MP.send=function(m){ if(m && m.t==='team') pushed.push(m.team); };
    await ccMpEnter({code:'ABC123', role:'a'});
    MP.peer={handle:'Zed', nat:'ru', region:'EU', rating:88, _targetOvr:88, _attrs:null, _roleKey:'roleFRG'};
    const cr=CAREER.career;
    const set=careerBrSet();
    // 1. Метка уезжает состоянием.
    pushed.length=0;
    check('метка ставится', careerSpotSet(4, set)===true);
    const last=pushed[pushed.length-1];
    check('состояние ушло наверх', !!last, String(pushed.length));
    check('и несёт метку', !!(last && last.spots && JSON.stringify(last.spots).indexOf('"i":4')>=0), JSON.stringify(last && last.spots));
    // 2. Под HOLD — не уходит (между close и шагом дня так и задумано).
    careerSpotClear(set); pushed.length=0;
    CC_MP_HOLD=true;
    careerSpotSet(5, set);
    check('под HOLD push не уходит', pushed.length===0, String(pushed.length));
    CC_MP_HOLD=false;
    // 3. Хвост соло-раннера снимает HOLD перед careerSave.
    const src=String(runCareerSoloSeries);
    const at=src.indexOf('CC_MP_ALONE=false;');
    const tail=src.slice(at, at+900);
    check('соло-раннер: HOLD снят до careerSave в одиночном хвосте', /CC_MP_HOLD=false;[\\s\\S]{0,40}careerSave\\(\\);[\\s\\S]{0,80}ccSoloTeamSettle/.test(tail), tail.slice(0,200));
    // 4. Чужое состояние с меткой применяется и рисуется.
    careerSpotClear(set);
    const theirs=ccTeamState();
    theirs.spots={}; theirs.spots[careerSpotKey(set)]=[{i:7, aura:0, won:0, day:careerToday()}];
    ccMpApplyRemote(theirs);
    check('метка напарника применилась', !!(careerSpotOn(set) && careerSpotOn(set).i===7), JSON.stringify(careerSpotOn(set)));
    careerRenderHub('centre');
    const next=careerNext();
    out.notes.next=next && next.type;
    const html=String(careerNightSpotHTML(next)||'');
    check('плитка вечера показывает её', html.indexOf('ch-spot')>=0 && html.indexOf(L().landingZoneSuffix(8))>=0, html.slice(0,160));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccspotsync-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('метка едет напарнику, и после одиночного соло тоже · '+JSON.stringify(out.notes));
