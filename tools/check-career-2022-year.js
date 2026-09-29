// Год 2022: скипом (мир играет три Гранд-финала и Роли сам, осенью ступень дивизиона),
// потом своими руками — квалификатор, два раунда одним вечером, полуфинал, финал, Invitational.
//
//   node tools/check-career-2022-year.js
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
      career:Object.assign({season:1, size:2, year:2022, year0:2022, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y22y'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2021-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2021-11-01', dev:0}]}));
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
    const k=PLAYERS.filter(p=>/^k[123]$/.test(p.cardSet));
    out.notes.cards=k.length;
    check('карточки 2022-го есть', k.length>8000, String(k.length));
    seed(CC_YEAR_2022_FROM);
    check('год — 2022', ccCalYear()===2022 && ccIs2022(), String(ccCalYear()));
    check('в январе дивизионов нет', ccNoDivisions());
    check('NA West в 2022-м есть', ccYearRegions().indexOf('NAW')>=0);
    const days=careerYearDays();
    const has=id=>[...days.values()].some(l=>l.some(e=>e.id===id));
    check('календарь: квалы, полуфиналы, финалы, Роли',
      ['Major1_2022_Q1R1','Major1_2022_Q1R23','Major2_2022_Q2R34','Major1_2022_Semi3','Major3_2022_Final','Invitational2022'].every(has));
    check('ярлык двух раундов', ccYearLabel('Major1_2022_Q1R23','2022-02-18','2022-02-18').indexOf('2–3')>=0, ccYearLabel('Major1_2022_Q1R23','2022-02-18','2022-02-18'));
    check('капы 2022-го в календаре', [...days.values()].some(l=>l.some(e=>e.kind==='victory')));
    check('кубковые недели C3S4', [...days.values()].some(l=>l.some(e=>e.kind==='cup')));
    // 1. Год целиком, скипом — мир играет всё сам.
    let guard=0; const t0=Date.now();
    while(!CAREER.career.seasonOver && guard++<400) careerSkipWeek();
    out.notes.days=guard; out.notes.ms=Date.now()-t0;
    check('год кончился', CAREER.career.seasonOver, 'дней '+guard);
    check('стоит на конце года', CAREER.career.day===CC_YEAR_2022_TO, CAREER.career.day);
    check('без ошибок JS за год', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const cr=CAREER.career;
    const paid=Object.keys(cr.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл три Гранд-финала и Роли', ['1|major1','1|major2','1|major3','1|globals'].every(k=>paid.indexOf(k)>=0), paid.join(','));
    check('осенью ступень поставлена', cr.div22===1, String(cr.div22));
    check('после кубков дивизионов нет', ccNoDivisions() && cr.division===1, String(cr.division));
    check('ЛАН года — Роли', ccLanHostKey('globals')==='Rdu', ccLanHostKey('globals'));
    // 2. Осень: в день кубков дивизионы есть, ступень по рейтингу.
    seed('2022-09-28');
    careerAdvanceTo('2022-09-28');
    check('осенью дивизионы есть', !ccNoDivisions() && CAREER.career.div22===1, CAREER.career.division+'/'+CAREER.career.div22);
    // 2б. Placement Cup 24.09.2022: итог — ступень, карточки пишут посев, а не «не прошёл / без денег» (аудит 29.09).
    seed('2022-09-24');
    const pv=careerVictoryOn('2022-09-24');
    check('Placement Cup в календаре', pv && pv.placement, JSON.stringify(pv));
    const ph=await playThrough('Placement Cup');
    const pc=JSON.parse(localStorage.getItem('fncsdraft_career')).career;
    const stagesTxt=document.getElementById('majorStages').innerText;
    check('Placement Cup: ступень поставлена', pc.placed===pc.season && pc.division>=1, JSON.stringify({div:pc.division, placed:pc.placed}));
    check('Placement Cup: карточки пишут посев', stagesTxt.indexOf(L().lfNewsPlaced(pc.division))>=0, stagesTxt.slice(-400));
    check('Placement Cup: нет «без денег»', stagesTxt.indexOf(L().ccWfNoCash)<0 && stagesTxt.indexOf(L().ccResNoMoney)<0);
    out.steps.push('Placement: '+ph+' · div '+pc.division);
    // 3. Квалификатор 1 Мейджора 1, раунд 1 — своими руками.
    seed('2022-02-17');
    const q1=await playThrough('Major 1 Q1 R1');
    const l1=lastLog();
    check('раунд 1 записан', l1 && l1.kind==='major' && l1.stage==='q', JSON.stringify(l1));
    out.steps.push('Q1R1: '+q1+' · #'+(l1&&l1.place)+' of '+(l1&&l1.of));
    // 4. Раунды 2 и 3 одним вечером — игрок прошёл раунд 1.
    seed('2022-02-18', {major22:{n:1, season:1, got:{}, q:{1:{r1:['you']}}, series:{}, seriesRows:{}, direct:[], semi:{}, youKey:null, ticket:false}});
    const ev23=careerMajorOn('2022-02-18');
    check('вечер двух раундов открыт', ev23 && ev23.rounds.join()==='2,3' && careerMajorCan(ev23), JSON.stringify(ev23));
    const q23=await playThrough('Major 1 Q1 R2-3');
    const l2=lastLog();
    check('вечер раундов 2–3 записан', l2 && l2.stage==='q', JSON.stringify(l2));
    out.steps.push('Q1R23: '+q23+' · #'+(l2&&l2.place)+' of '+(l2&&l2.of));
    // 5. Полуфинал, сессия 1 — место по серии.
    seed('2022-02-25', {major22:{n:1, season:1, got:{}, q:{}, series:{X:5000}, seriesRows:{X:'you'}, direct:[], semi:{}, youKey:'X', ticket:false}});
    const sEv=careerMajorOn('2022-02-25');
    check('полуфинал: место по серии', sEv && sEv.stage==='semi' && careerMajorCan(sEv), JSON.stringify(sEv));
    const sm=await playThrough('Major 1 Semi 1');
    const ls=lastLog();
    check('полуфинал записан', ls && ls.stage==='semi' && ls.of===50 && ls.games===5, JSON.stringify(ls));
    out.steps.push('Semi1: '+sm+' · #'+(ls&&ls.place));
    // 6. Гранд-финал с билетом.
    seed('2022-03-05', {major22:{n:1, season:1, got:{}, q:{}, series:{}, seriesRows:{}, direct:[], semi:{}, youKey:'X', ticket:true}});
    const gfEv=careerMajorOn('2022-03-05');
    check('финал: билет', careerMajorCan(gfEv), JSON.stringify(gfEv));
    const gf=await playThrough('Major 1 final');
    const lg=lastLog();
    check('финал записан', lg && lg.stage==='final' && lg.of===50 && lg.games===12, JSON.stringify(lg));
    check('призовые финала — таблица Европы C3S1', majorPrize(1)===300000, String(majorPrize(1)));
    out.steps.push('GF: '+gf+' · #'+(lg&&lg.place)+' $'+(lg&&lg.prize));
    // Роли из симуляции: твой финал сезона в книге, и его верх (кроме тебя) — среди приглашённых своего региона.
    const kp=(CAREER.career.gfKeep||{})['2022|1'];
    check('финал 2022 записан для Роли', !!kp && kp.rows.length>=10, JSON.stringify(kp && kp.rows.length));
    // 7. Invitational — приглашение с Гранд-финала C3S3.
    seed('2022-11-12', {log:[{kind:'major', stage:'final', day:'2022-08-13', place:1, of:50, games:12, season:1, passed:true}]});
    const seat=ccGlobalsSeat();
    check('приглашение в Роли', seat && seat.via==='major2', JSON.stringify(seat));
    check('поле Роли — 50', careerGlobalsField(careerYouTeam([careerCard()].concat(careerMates())), null, 'major2').length===50);
    const inv=await playThrough('Invitational');
    const li=lastLog();
    check('Invitational записан', li && li.kind==='globals' && li.of===50, JSON.stringify(li));
    check('призовые Роли за первое', gcPrize(1)>=100000, String(gcPrize(1)));
    out.steps.push('INV: '+inv+' · #'+(li&&li.place));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc22y-'));
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
console.log('OK check-career-2022-year');
