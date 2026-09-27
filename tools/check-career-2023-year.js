// Год 2023: скипом из дивизиона 1 (мир играет финалы Мейджоров и Копенгаген сам),
// потом своими руками — день недели Мейджора 1, Гранд-финал по серии, Копенгаген
// (верхняя сетка с места Мейджора и нижняя — с Last Chance Major).
//
//   node tools/check-career-2023-year.js
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
      career:Object.assign({season:1, size:2, year:2023, year0:2023, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y23y'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2022-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2022-11-01', dev:0}]}));
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
    check('карточки 2023-го есть', PLAYERS.filter(p=>/^e[123]$/.test(p.cardSet)).length>9000);
    seed(CC_YEAR_2023_FROM);
    check('год — 2023', ccCalYear()===2023 && ccIs2023(), String(ccCalYear()));
    check('дивизионов три', ccDivCount('EU')===3, String(ccDivCount('EU')));
    check('в январе дивизионы есть', !ccNoDivisions());
    const days=careerYearDays();
    const has=id=>[...days.values()].some(l=>l.some(e=>e.id===id));
    check('календарь: недели, Surge, финалы, LCM, Копенгаген',
      ['Major1_2023_W1D1','Major1_2023_W3F','Major1_2023_Surge','Major1_2023_Final','Major3_2023_Final','Major4_2023_W1F','GlobalChampionship2023'].every(has));
    check('капы 2023-го в календаре', [...days.values()].some(l=>l.some(e=>e.kind==='victory')));
    check('кубковые недели C4S1', [...days.values()].some(l=>l.some(e=>e.kind==='cup')));
    // 1. Год целиком, скипом, из дивизиона 1 — мир играет всё сам.
    let guard=0; const t0=Date.now();
    while(!CAREER.career.seasonOver && guard++<400) careerSkipWeek();
    out.notes.days=guard; out.notes.ms=Date.now()-t0;
    check('год кончился', CAREER.career.seasonOver, 'дней '+guard);
    check('стоит на конце года', CAREER.career.day===CC_YEAR_2023_TO, CAREER.career.day);
    check('без ошибок JS за год', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const cr=CAREER.career;
    const paid=Object.keys(cr.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл финалы трёх Мейджоров и Копенгаген', ['1|major1','1|major2','1|major3','1|globals'].every(k=>paid.indexOf(k)>=0), paid.join(','));
    check('после марта дивизионов нет', ccNoDivisions() && cr.division===1, String(cr.division));
    check('ЛАН года — Копенгаген', ccLanHostKey('globals')==='Cph', ccLanHostKey('globals'));
    // 2. День 1 недели 1 Мейджора 1 — своими руками (дивизион 1, Elite).
    seed('2023-02-02');
    const d1=await playThrough('Major 1 week 1 day 1');
    const l1=lastLog();
    check('день 1 недели записан', l1 && l1.kind==='major' && l1.stage==='d1', JSON.stringify(l1));
    out.steps.push('W1D1: '+d1+' · #'+(l1&&l1.place)+' of '+(l1&&l1.of));
    // Не Elite — в Мейджор 1 не пускают.
    seed('2023-02-02', {division:2});
    check('Мейджор 1 — только Elite', !careerMajorCan(careerMajorOn('2023-02-02')));
    // 3. Гранд-финал Мейджора 1 — билет по серии (игрок первый в серии, недели мира досчитаются).
    seed('2023-03-04', {major23:{n:1, season:1, got:{}, wk:{}, series:{X:5000}, seriesRows:{X:'you'}, surgeTop:null, youKey:'X'}});
    const gfEv=careerMajorOn('2023-03-04');
    check('финал: билет по серии', careerMajorCan(gfEv), JSON.stringify(gfEv));
    const gf=await playThrough('Major 1 final');
    const lg=lastLog();
    check('финал записан', lg && lg.stage==='final' && lg.of===50 && lg.games===12, JSON.stringify(lg));
    check('призовые финала — таблица Европы 2023-го', majorPrize(1)===200000 && majorPrize(50)===1000, majorPrize(1)+'/'+majorPrize(50));
    out.steps.push('GF: '+gf+' · #'+(lg&&lg.place)+' $'+(lg&&lg.prize));
    // 4. Копенгаген, день 1 — верхняя сетка с места с Мейджора 3.
    seed('2023-10-13', {log:[{kind:'major', stage:'final', day:'2023-08-12', place:1, of:50, games:12, season:1, passed:true}]});
    const seat=ccGlobalsSeat();
    check('место в Копенгаген с Мейджора 3', seat && seat.via==='major2', JSON.stringify(seat));
    const u=await playThrough('Copenhagen upper');
    const lu=lastLog();
    check('верхняя сетка записана', lu && lu.kind==='globals' && lu.stage==='upper' && lu.games===5, JSON.stringify(lu));
    out.steps.push('CPH upper: '+u+' · #'+(lu&&lu.place));
    // 5. Копенгаген, день 2 — нижняя сетка с места Last Chance Major.
    seed('2023-10-14', {log:[{kind:'major', stage:'lcm', day:'2023-08-20', place:1, of:50, games:6, season:1, passed:true}]});
    const seat2=ccGlobalsSeat();
    check('место с Last Chance Major — нижняя сетка', seat2 && seat2.via==='lcm', JSON.stringify(seat2));
    const lw=await playThrough('Copenhagen lower');
    const ll=lastLog();
    check('нижняя сетка записана', ll && ll.kind==='globals' && ll.stage==='lower', JSON.stringify(ll));
    out.steps.push('CPH lower: '+lw+' · #'+(ll&&ll.place));
    check('призовые Копенгагена: $1 000 000 за первое', gcPrize(1)===1000000, String(gcPrize(1)));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc23y-'));
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
console.log('OK check-career-2023-year');
