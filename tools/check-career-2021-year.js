// Год 2021 (трио): скипом (мир играет четыре финала и Grand Royale сам), потом своими руками —
// квалификатор, раунд 4, хит полуфинала, Reboot Round, финал, Grand Royale.
//
//   node tools/check-career-2021-year.js
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
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Yearman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:3, year:2021, year0:2021, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y21y'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, {card:card('M2',93), patience:60, since:'2020-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const playThrough=async what=>{
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button at all');
    if((play.getAttribute('onclick')||'').indexOf('careerPlay')<0) throw new Error(what+': the button skips instead of playing: '+play.outerHTML.slice(0,200));
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card came back');
    const head=c.querySelector('h4').textContent.replace(/[ ]+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const lastLog=()=>{ const s=JSON.parse(localStorage.getItem('fncsdraft_career')).career; return (s.log||[]).slice(-1)[0]||null; };
  try{
    // 0. Карточки года и календарь.
    const k=PLAYERS.filter(p=>/^j[1234]$/.test(p.cardSet));
    out.notes.cards=k.length;
    check('карточки 2021-го есть', k.length>7000, String(k.length));
    seed(CC_YEAR_2021_FROM);
    check('год — 2021', ccCalYear()===2021 && ccIs2021(), String(ccCalYear()));
    check('трио', careerSquadSize()===3 && ccTeams(50)===33, String(careerSquadSize()));
    check('дивизионов нет', ccNoDivisions());
    const days=careerYearDays();
    const has=id=>[...days.values()].some(l=>l.some(e=>e.id===id));
    check('календарь: квалы, хиты, Reboot, финалы, Grand Royale',
      ['Major1_2021_Q1R1','Major1_2021_Q1R23','Major1_2021_Q1R4','Major1_2021_Semi2','Major1_2021_Reboot','Major4_2021_Final','Major5_2021_Final'].every(has));
    check('капы 2021-го в календаре', [...days.values()].some(l=>l.some(e=>e.kind==='victory')));
    // 1. Год целиком, скипом — мир играет всё сам.
    let guard=0; const t0=Date.now();
    while(!CAREER.career.seasonOver && guard++<400) careerSkipWeek();
    out.notes.days=guard; out.notes.ms=Date.now()-t0;
    check('год кончился', CAREER.career.seasonOver, 'дней '+guard);
    check('стоит на конце года', CAREER.career.day===CC_YEAR_2021_TO, CAREER.career.day);
    check('без ошибок JS за год', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const cr=CAREER.career;
    const paid=Object.keys(cr.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл четыре финала и Grand Royale', ['1|major1','1|major2','1|major3','1|major4','1|major5'].every(k=>paid.indexOf(k)>=0), paid.join(','));
    // 2. Раунд 1 квалификатора 1.
    seed('2021-02-12');
    const q1=await playThrough('Major 1 Q1 R1');
    const l1=lastLog();
    check('раунд 1 записан', l1 && l1.kind==='major' && l1.stage==='q', JSON.stringify(l1));
    out.steps.push('Q1R1: '+q1+' · #'+(l1&&l1.place)+' of '+(l1&&l1.of));
    // 3. Раунд 4 — прошёл 3-й.
    seed('2021-04-25', {major21:{n:2, season:1, got:{}, q:{1:{r3:['you']}}, series:{}, seriesRows:{}, direct:[], heats:null, heatRes:{}, reboot:null, youKey:null, ticket:false}});
    const e4=careerMajorOn('2021-04-25');
    check('раунд 4 открыт', e4 && e4.rounds.join()==='4' && careerMajorCan(e4), JSON.stringify(e4));
    const q4=await playThrough('Major 2 Q1 R4');
    const l4=lastLog();
    check('раунд 4 записан', l4 && l4.stage==='q' && l4.of>=30, JSON.stringify(l4));
    out.steps.push('Q1R4: '+q4+' · #'+(l4&&l4.place)+' of '+(l4&&l4.of));
    // 4. Хит полуфинала — первый в серии.
    seed('2021-05-22', {major21:{n:2, season:1, got:{}, q:{1:{done:true},2:{done:true},3:{done:true}}, series:{X:5000}, seriesRows:{X:'you'}, direct:[], heats:null, heatRes:{}, reboot:null, youKey:'X', ticket:false}});
    const sEv=careerMajorOn('2021-05-22');
    check('хит: место по серии', sEv && sEv.stage==='semi' && careerMajorCan(sEv), JSON.stringify(sEv));
    const sm=await playThrough('Major 2 heat');
    const ls=lastLog();
    check('хит записан', ls && ls.stage==='semi' && ls.of===33 && ls.games===6, JSON.stringify(ls));
    out.steps.push('Heat: '+sm+' · #'+(ls&&ls.place));
    // 5. Reboot Round — если хит не прошёл.
    const st=CAREER.career.major21;
    if(!st.ticket){
      careerAdvanceTo('2021-05-23');
      const rEv=careerMajorOn('2021-05-23');
      check('Reboot Round открыт после хита', rEv && rEv.stage==='reboot' && careerMajorCan(rEv), JSON.stringify(rEv));
    }
    // 6. Гранд-финал с билетом.
    seed('2021-05-29', {major21:{n:2, season:1, got:{}, q:{}, series:{}, seriesRows:{}, direct:[], heats:null, heatRes:{}, reboot:null, youKey:'X', ticket:true}});
    const gf=await playThrough('Major 2 final');
    const lg=lastLog();
    check('финал записан', lg && lg.stage==='final' && lg.of===33 && lg.games===12, JSON.stringify(lg));
    check('призовые финала — таблица Европы C2S6 на трио', majorPrize(1)===300000, String(majorPrize(1)));
    out.steps.push('GF: '+gf+' · #'+(lg&&lg.place)+' $'+(lg&&lg.prize));
    // 7. Grand Royale — пускает финал сезона.
    seed('2021-11-20', {log:[{kind:'major', stage:'final', day:'2021-10-30', place:12, of:33, games:12, season:1, passed:true}]});
    const grEv=careerMajorOn('2021-11-20');
    check('Grand Royale открыт', grEv && grEv.n===5 && careerMajorCan(grEv), JSON.stringify(grEv));
    const gr=await playThrough('Grand Royale');
    const lr=lastLog();
    check('Grand Royale записан', lr && lr.stage==='final' && lr.of===33, JSON.stringify(lr));
    check('Grand Royale: $200 000 первому на игрока', majorPrize(1)===600000, String(majorPrize(1)));
    out.steps.push('GR: '+gr+' · #'+(lr&&lr.place));
    seed('2021-11-20');
    check('без финала сезона — на Grand Royale нет', !careerMajorCan(careerMajorOn('2021-11-20')));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc21y-'));
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
console.log('OK check-career-2021-year');
