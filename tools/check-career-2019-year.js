// Год 2019 (World Cup и первые FNCS, формат на вечер): скипом, потом соло-неделя, финал недели,
// финал World Cup Duos, хит FNCS Season X (трио), финал C2S1 (сквады).
//
//   node tools/check-career-2019-year.js
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
      career:Object.assign({season:1, size:4, year:2019, year0:2019, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y19y'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, {card:card('M2',93), patience:60, since:'2020-11-01', dev:0}, {card:card('M3',92), patience:60, since:'2020-11-01', dev:0}]}));
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
    const k=PLAYERS.filter(p=>/^h[1234]$/.test(p.cardSet));
    out.notes.cards=k.length;
    check('карточки 2019-го есть', k.length>3000, String(k.length));
    seed(CC_YEAR_2019_FROM);
    check('год — 2019', ccCalYear()===2019 && ccIs2019(), String(ccCalYear()));
    careerRenderHub('centre');
    check('весной состав — дуо (World Cup)', careerSquadSize()===2, String(careerSquadSize()));
    const soloField=ccWithEventSize(1, ()=>careerCupField(CAREER.career, [careerCard()], 200, 'solo-probe', true, 0));
    check('в соло-поле нет пар', soloField.length>50 && soloField.every(t=>(t.squad||[]).length===1), soloField.filter(t=>(t.squad||[]).length!==1).length+' of '+soloField.length);
    check('дивизионов нет', ccNoDivisions());
    const days=careerYearDays();
    const has=id=>[...days.values()].some(l=>l.some(e=>e.id===id));
    check('календарь: World Cup, Нью-Йорк, FNCS X, C2S1',
      ['Major1_2019_W1R1','Major2_2019_W2R2','Major1_2019_Final','Major2_2019_Final','Major3_2019_W1R12','Major3_2019_Heat2','Major4_2019_W0R12','Major4_2019_Final'].every(has));
    check('ярлык недели', /World Cup Solo/.test(ccYearLabel('Major1_2019_W1R1','2019-04-13','2019-04-13')), ccYearLabel('Major1_2019_W1R1','2019-04-13','2019-04-13'));
    // 1. Год целиком, скипом.
    let guard=0; const t0=Date.now();
    while(!CAREER.career.seasonOver && guard++<400) careerSkipWeek();
    out.notes.days=guard; out.notes.ms=Date.now()-t0;
    check('год кончился', CAREER.career.seasonOver, 'дней '+guard);
    check('без ошибок JS за год', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const paid=Object.keys(CAREER.career.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл оба финала World Cup и два FNCS', ['1|major1','1|major2','1|major3','1|major4'].every(x=>paid.indexOf(x)>=0), paid.join(','));
    check('в декабре состав — сквад (C2S1)', careerSquadSize()===4 && CC_EVENT_SIZE===0, String(careerSquadSize()));
    // 2. World Cup Solo, неделя 1, суббота — соло.
    seed('2019-04-13');
    const w1=await playThrough('WC Solo W1 R1');
    const l1=lastLog();
    check('соло-вечер записан', l1 && l1.kind==='major' && l1.stage==='q' && l1.size===1 && !l1.mate, JSON.stringify(l1));
    out.steps.push('WC Solo R1: '+w1+' · #'+(l1&&l1.place)+' of '+(l1&&l1.of));
    // 3. Воскресенье — финал недели, квота региона.
    seed('2019-04-14', {majorx:{y:2019, n:1, season:1, got:{}, q:{1:{r1:['you']}}, series:{}, seriesRows:{}, heats:null, heatRes:{}, youKey:null, ticket:false}});
    const e2=careerMajorOn('2019-04-14');
    check('финал недели открыт', e2 && careerMajorCan(e2), JSON.stringify(e2));
    const w2=await playThrough('WC Solo W1 R2');
    const l2=lastLog();
    check('финал недели записан', l2 && l2.stage==='q', JSON.stringify(l2));
    out.steps.push('WC Solo R2: '+w2+' · #'+(l2&&l2.place)+' of '+(l2&&l2.of)+' ticket '+CAREER.career.majorx.ticket+' prize '+(l2&&l2.prize));
    check('финал недели платит призовые (Online Open)', !!l2 && (l2.place>2000 || (l2.prize||0)>0), JSON.stringify(l2 && {place:l2.place, prize:l2.prize}));
    // 4. Финал World Cup Duos с билетом — 50 дуо, $3 000 000 первым.
    seed('2019-07-27', {majorx:{y:2019, n:2, season:1, got:{}, q:{}, series:{}, seriesRows:{}, heats:null, heatRes:{}, youKey:'X', ticket:true}});
    const d=await playThrough('WC Duos final');
    const ld=lastLog();
    check('финал дуо записан', ld && ld.stage==='final' && ld.of===50 && ld.size===2, JSON.stringify(ld));
    check('призовые дуо: $3 000 000 за первое', ccMXPrize(2019, 2, 1)===3000000, String(ccMXPrize(2019, 2, 1)));
    check('призовые соло: $3 000 000 за первое', ccMXPrize(2019, 1, 1)===3000000, String(ccMXPrize(2019, 1, 1)));
    out.steps.push('WC Duos final: '+d+' · #'+(ld&&ld.place));
    // 5. Хит FNCS Season X — трио, из серии.
    seed('2019-09-20', {majorx:{y:2019, n:3, season:1, got:{}, q:{1:{done:true},2:{done:true},3:{done:true},4:{done:true},5:{done:true}}, series:{X:5000}, seriesRows:{X:'you'}, heats:null, heatRes:{}, youKey:'X', ticket:false}});
    const hEv=careerMajorOn('2019-09-20');
    check('хит FNCS X открыт', hEv && careerMajorCan(hEv), JSON.stringify(hEv));
    const h=await playThrough('FNCS X heat');
    const lh=lastLog();
    check('хит трио записан', lh && lh.stage==='heat' && lh.of===33 && lh.size===3, JSON.stringify(lh));
    out.steps.push('FNCS X heat: '+h+' · #'+(lh&&lh.place));
    // 6. Финал FNCS C2S1 — сквады.
    seed('2019-12-08', {majorx:{y:2019, n:4, season:1, got:{}, q:{}, series:{}, seriesRows:{}, heats:null, heatRes:{}, youKey:'X', ticket:true}});
    const f4=await playThrough('C2S1 final');
    const l4=lastLog();
    check('финал сквадов записан', l4 && l4.stage==='final' && l4.of===25 && l4.size===4, JSON.stringify(l4));
    out.steps.push('C2S1 final: '+f4+' · #'+(l4&&l4.place)+' $'+(l4&&l4.prize));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc19y-'));
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
console.log('OK check-career-2019-year');
