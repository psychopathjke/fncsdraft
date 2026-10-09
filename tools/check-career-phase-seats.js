// Стык этапа года 2019–2020 (дуо → трио → сквад): пустое кресло садится само, «До турнира» не
// пролистывает вечера с пустым креслом; слово Victory Cup до 2023-го. Notion «0910».
//
//   node tools/check-career-phase-seats.js
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
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"), yes=document.getElementById("ccAskYes");
      if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; }
      if(yes && yes.textContent===L().ccSpotGateSet){ careerSpotEnsure(); am.style.display="none"; careerPlay(); return; } }
    const cb=document.querySelector(".cc-choice-btn"); if(cb){ cb.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out={steps:[], fails:[], notes:{rooms:[]}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const orig=simulateGamesLive;
  simulateGamesLive=function(teams){ try{
    const h={}; teams.forEach(t=>{ const n=(t.players||t.squad||t.members||[]).length; h[n]=(h[n]||0)+1; });
    out.notes.rooms.push({tag:window.__tag, n:teams.length, sizes:h, squadSize:squadSize, drafted:drafted.length, keys:Object.keys(teams[1]||{}).join(',')});
  }catch(e){ out.notes.rooms.push('rec err '+e); } return orig.apply(this, arguments); };
  const seed=(year, day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Yearman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:3, year:year, year0:year, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y21y'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2019-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2019-11-01', dev:0}, {card:card('M2',93), patience:60, since:'2019-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const playThrough=async what=>{
    window.__tag=what;
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button');
    out.steps.push(what+' btn: '+(play.getAttribute('onclick')||''));
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card');
    out.steps.push(what+': '+c.querySelector('h4').textContent.replace(/\s+/g,' ').trim());
    c.querySelector('button[onclick*="careerBackToHub"]').click();
  };
  try{
    const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
    const one=()=>{ const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.partners=s.partners.slice(0,1); localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); };
    // 2019: дуо → трио 1 августа — третий садится сам, Season X не пролистывается.
    seed(2019, '2019-07-30', {size:2}); one();
    careerSkipWeek(); careerSkipWeek();
    check('1.08.2019: трио', careerSquadSize()===3, String(careerSquadSize()));
    check('1.08.2019: кресло не пустое', careerMatesShort()===0 && careerMates().filter(Boolean).length===2, careerMates().map(m=>m&&m.handle).join('+'));
    check('1.08.2019: один ИГЛ', ccSquadRoleFits(ccSquadRoles(), 3), ccSquadRoles().join(','));
    check('«До турнира» — на Season X 17.08', careerSkipTarget().day==='2019-08-17', careerSkipTarget().day);
    // Убрал третьего сам — режим не садит его обратно.
    CAREER.partners=CAREER.partners.slice(0,1); careerSave(); careerRenderHub('centre');
    check('убранный третий не возвращается', careerMatesShort()===1);
    check('пустое кресло — «До турнира» встаёт на вечер', careerSkipTarget().day==='2019-08-17', careerSkipTarget().day);
    // 13 октября — сквад.
    careerAdvanceTo('2019-10-14'); careerRenderHub('centre');
    check('14.10.2019: сквад полный', careerSquadSize()===4 && careerMatesShort()===0, careerSquadSize()+' short '+careerMatesShort());
    // 2020: трио 27 августа.
    seed(2020, '2020-08-25', {size:2}); one();
    careerSkipWeek(); careerSkipWeek(); careerSkipWeek();
    check('28.08.2020: трио полное', careerSquadSize()===3 && careerMatesShort()===0, careerSquadSize()+' short '+careerMatesShort());
    // Вне стыка (2021, ушёл напарник) — не досаживает, но и мимо квала не прыгает.
    seed(2021, '2021-02-08'); one();
    check('2021: вне стыка не досаживает', careerMatesShort()===1);
    check('2021: «До турнира» — на квал C2S5', careerSkipTarget().day==='2021-02-12', careerSkipTarget().day);
    // Слово «Victory Cup» — только с 2023-го.
    seed(2019, '2019-08-05', {size:3});
    check('2019: кубок, не Victory Cup', ccWkVictoryWord()===L().chWkCup);
    // Менеджер 2019: этап года ставится и в теневой карьере — трио-капы и Season X в списке, составы добирают третьего.
    MGR_NEW_YEAR=2019; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2019); mgrTake(0);
    CAREER.career.day='2019-08-02'; mgrPhaseSync();
    check('менеджер 2.08.2019: трио', careerSquadSize()===3, String(careerSquadSize()));
    check('менеджер: составы по трое', MGR.teams.every(t=>mgrTeamSize(t)===3), MGR.teams.map(t=>mgrTeamSize(t)).join(','));
    const mev=mgrEvents().slice(0,3).map(e=>e.mode+' '+e.name).join(' | ');
    check('менеджер: ближайшие — Season X и трио-кап', /trio FNCS Season X/.test(mev) && /Trios Cash Cup/.test(mev), mev);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phseat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1800000 }).toString();
fs.rmSync(dir, { recursive: true, force: true });
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-phase-seats');
