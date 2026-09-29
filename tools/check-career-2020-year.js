// Год 2020 (FNCS онлайн, формат на вечер): скипом, потом соло-квалификатор C2S3, дуо-хит C2S2, трио-финал C2S4.
//
//   node tools/check-career-2020-year.js
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
      career:Object.assign({season:1, size:3, year:2020, year0:2020, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y20y'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, {card:card('M2',93), patience:60, since:'2020-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    // Состав по этапу года: лишние тиммейты сверх мест этапа отпускаются (как сделал бы игрок).
    careerRenderHub('centre');
    if((CAREER.partners||[]).length>careerMateSeats()){ CAREER.partners=CAREER.partners.slice(0, careerMateSeats()); careerSave(); careerRenderHub('centre'); }
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
    const k=PLAYERS.filter(p=>/^i[123]$/.test(p.cardSet));
    out.notes.cards=k.length;
    check('карточки 2020-го есть', k.length>3000, String(k.length));
    seed(CC_YEAR_2020_FROM);
    check('год — 2020', ccCalYear()===2020 && ccIs2020(), String(ccCalYear()));
    careerRenderHub('centre');
    check('весной состав — дуо (C2S2)', careerSquadSize()===2, String(careerSquadSize()));
    const days=careerYearDays();
    const has=id=>[...days.values()].some(l=>l.some(e=>e.id===id));
    check('календарь: C2S2, C2S3, C2S4', ['Major1_2020_W1R1','Major1_2020_Final','Major2_2020_W1R12','Major2_2020_Heat2','Major3_2020_W3R2','Major3_2020_Final'].every(has));
    check('ярлык', /FNCS Chapter 2 Season 3/.test(ccYearLabel('Major2_2020_W1R12','2020-08-01','2020-08-01')), ccYearLabel('Major2_2020_W1R12','2020-08-01','2020-08-01'));
    let guard=0; const t0=Date.now();
    while(!CAREER.career.seasonOver && guard++<400) careerSkipWeek();
    out.notes.days=guard; out.notes.ms=Date.now()-t0;
    check('год кончился', CAREER.career.seasonOver, 'дней '+guard);
    check('без ошибок JS за год', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const paid=Object.keys(CAREER.career.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл три финала', ['1|major1','1|major2','1|major3'].every(x=>paid.indexOf(x)>=0), paid.join(','));
    // Соло-квалификатор C2S3.
    seed('2020-08-01');
    const q=await playThrough('C2S3 qualifier');
    const lq=lastLog();
    check('соло-квалификатор записан', lq && lq.size===1 && lq.kind==='major', JSON.stringify(lq));
    out.steps.push('C2S3 Q: '+q+' · #'+(lq&&lq.place)+' of '+(lq&&lq.of));
    // Дуо-хит C2S2.
    seed('2020-04-17', {majorx:{y:2020, n:1, season:1, got:{}, q:{1:{done:true},2:{done:true},3:{done:true},4:{done:true}}, series:{X:5000}, seriesRows:{X:'you'}, heats:null, heatRes:{}, youKey:'X', ticket:false}});
    const h=await playThrough('C2S2 heat');
    const lh=lastLog();
    check('дуо-хит записан', lh && lh.stage==='heat' && lh.of===50 && lh.size===2, JSON.stringify(lh));
    out.steps.push('C2S2 heat: '+h+' · #'+(lh&&lh.place)+' $'+(lh&&lh.prize));
    // Хит платит тем, кто не прошёл (Liquipedia: EU C2S2 — $1 800 на дуо за 13–50-е), прошедшим — ноль.
    check('хит: не прошёл — деньги, прошёл — ноль', lh && (lh.place<=12 ? !(lh.prize>0) : lh.prize===900), JSON.stringify(lh && {place:lh.place, prize:lh.prize}));
    const hp=ccMXHeatPrize(ccMXSpec(2020, 1), 1, 0, 12);
    check('таблица хита C2S2: 12-е 0, 13-е $1 800 на дуо', !!hp && hp(12)===0 && hp(13)===1800 && hp(50)===1800, String(hp && [hp(12), hp(13), hp(50)]));
    // Недели 2020-го: своя таблица, а не строка Season X 2019-го (C2S4 — n=3, как Season X).
    const w1=ccMXWeekPrize(ccMXSpec(2020, 1), 1, 2, 1), w2=ccMXWeekPrize(ccMXSpec(2020, 2), 1, 2, 2), w3=ccMXWeekPrize(ccMXSpec(2020, 3), 1, 2, 3);
    check('неделя C2S2: $5 000 первой дуо', !!w1 && w1(1)===5000, String(w1 && w1(1)));
    check('квалификатор C2S3: $5 000 первому, $200 сотому', !!w2 && w2(1)===5000 && w2(100)===200, String(w2 && [w2(1), w2(100)]));
    check('неделя C2S4: $12 000 первой тройке, $600 33-й', !!w3 && w3(1)===12000 && w3(33)===600 && w3(5)!==w3(1), String(w3 && [w3(1), w3(5), w3(33)]));
    check('раунд 1 недели 2020 не платит', ccMXWeekPrize(ccMXSpec(2020, 1), 1, 1, 1)===null);
    check('2019 не задет: Season X раунд 2 — $960', ccMXWeekPrize(ccMXSpec(2019, 3), 3, 2, 3)(22)===960);
    // Трио-финал C2S4.
    seed('2020-10-31', {majorx:{y:2020, n:3, season:1, got:{}, q:{}, series:{}, seriesRows:{}, heats:null, heatRes:{}, youKey:'X', ticket:true}});
    const f=await playThrough('C2S4 final');
    const lf=lastLog();
    check('трио-финал записан', lf && lf.stage==='final' && lf.of===33 && lf.size===3, JSON.stringify(lf));
    out.steps.push('C2S4 final: '+f+' · #'+(lf&&lf.place)+' $'+(lf&&lf.prize));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc20y-'));
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
console.log('OK check-career-2020-year');
