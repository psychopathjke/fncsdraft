// Год 2025: все денежные капы сезона, не только FNCS. Его слово, 21 сентября
// 2026: «чет очень мало капов, добавляй все призовые, которые были».
// Снято с архива Tracker: Performance Evaluation (31 вечер + 6 Reload), Solo
// Cash Cup (16 капов по два раунда), FNCS Showdown (3 капа, дивизионы 1–2),
// Squid Grounds Cash Cup (3) и Reload Quick Cup (1); финал недели платит
// таблицей 2025-го.
//
//   node tools/check-career-2025-cash.js
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
  const seed=(div, day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Cashman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:3, year:2025, year0:2025, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y25c'}, extra||{}),
      partners:[{card:card('M1',93), patience:60, since:'2024-12-01', dev:0},
                {card:card('M2',92), patience:60, since:'2024-12-01', dev:0}]}));
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
    for(let i=0;i<20000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card came back');
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const save=()=>JSON.parse(localStorage.getItem('fncsdraft_career')).career;
  try{
    seed(1, '2024-12-11');
    const days=careerYearDays(); const kinds={};
    days.forEach(list=>list.forEach(e=>{ kinds[e.kind]=(kinds[e.kind]||0)+1; }));
    out.notes.kinds=kinds;
    check('оценка: 31 вечер + 6 Reload', kinds.eval===37, String(kinds.eval));
    check('Solo Cash Cup: 16 × 2 раунда', kinds.solo===32, String(kinds.solo));
    check('дуо-капы с деньгами: 3 Squid + 1 Reload Quick', kinds.victory===4, String(kinds.victory));
    check('Мейджоры 27 дней + Showdown 6', kinds.major===33, String(kinds.major));
    check('Reload-оценка 17 марта на острове Reload', careerNightSet({type:'eval', day:'2025-03-17'})==='r1', careerNightSet({type:'eval', day:'2025-03-17'}));
    check('обычная оценка — на острове сезона', careerNightSet({type:'eval', day:'2025-03-18'})==='t1', careerNightSet({type:'eval', day:'2025-03-18'}));
    check('оценка: 7 игр, $1 200 за победу на трио', ccEvalR1Games()===7 && ccEvalWinCash()===1200, ccEvalR1Games()+'/'+ccEvalWinCash());
    check('финал недели 2025: $22 500 трио за первое, $450 за 25-е', wfPrize(1)===22500 && wfPrize(25)===450 && wfPrize(26)===0, wfPrize(1)+'/'+wfPrize(25));
    const lbl=id=>ccYearLabel(id, '2025-01-10', '2025-01-10');
    check('ярлык Solo Cash Cup', /Solo Cash Cup 3/.test(lbl('SoloCash3_R1')), lbl('SoloCash3_R1'));
    check('ярлык Showdown', /Showdown 1/.test(lbl('Showdown4_2025_LCQ')), lbl('Showdown4_2025_LCQ'));
    check('Squid Grounds в календаре по имени', /Squid Grounds Cash Cup 2/.test((days.get('2025-07-25')||[]).map(e=>e.label).join(' ')), (days.get('2025-07-25')||[]).map(e=>e.label).join(' '));
    check('Reload Quick Cup 5 сентября', /Reload Quick Cup/.test((days.get('2025-09-05')||[]).map(e=>e.label).join(' ')));
    // Solo Cash Cup 3: раунд 1 (10 января) → раунд 2 (12 января).
    seed(1, '2025-01-10');
    const ev1=careerSoloSeriesOn('2025-01-10');
    check('10 января — Solo Cash Cup 3 раунд 1', ev1 && ev1.stage==='sc3r1' && ev1.spec && ev1.spec.open, JSON.stringify(ev1 && {stage:ev1.stage}));
    check('раунд 1 открыт', careerSoloSeriesCan(ev1));
    check('раунд 2 без раунда 1 закрыт', !careerSoloSeriesCan(careerSoloSeriesOn('2025-01-12')));
    const h1=await playThrough('solo cash r1');
    let s=save();
    const r1=(s.log||[]).slice(-1)[0];
    check('раунд 1 записан: 10 игр, соло', r1 && r1.kind==='solo' && r1.games===10, JSON.stringify(r1 && {kind:r1.kind, games:r1.games, place:r1.place, of:r1.of}));
    check('раунд 1 — открытое поле (сотни игроков)', r1 && r1.of>=600, String(r1 && r1.of));
    out.steps.push('solo cash r1: '+h1+' · #'+(r1&&r1.place)+' of '+(r1&&r1.of)+' · state '+JSON.stringify(s.solos));
    if(s.solos && s.solos.seat==='sc3r2'){
      CAREER.career.day='2025-01-12'; careerSave(); careerRenderHub('centre');
      check('раунд 2 открыт прошедшему', careerSoloSeriesCan(careerSoloSeriesOn('2025-01-12')));
      const h2=await playThrough('solo cash r2');
      s=save(); const r2=(s.log||[]).slice(-1)[0];
      check('раунд 2: 600 игроков, 10 игр', r2 && r2.of===600 && r2.games===10, JSON.stringify(r2 && {games:r2.games, place:r2.place, of:r2.of}));
      check('раунд 2 платит таблицей Solo Cash Cup', (r2.place<=25)===((s.earnings||0)>0), 'place '+r2.place+' $'+s.earnings);
      out.steps.push('solo cash r2: '+h2+' · #'+(r2&&r2.place)+' · $'+(s.earnings||0));
      check('после капа место сброшено — следующий кап открыт заново', careerSoloSeriesCan(careerSoloSeriesOn('2025-01-17')), JSON.stringify(s.solos));
    } else out.steps.push('solo cash r1: вылетел, раунд 2 не проверялся');
    // FNCS Showdown 1: дивизион 2 играет, дивизион 3 — нет.
    seed(3, '2025-05-13');
    check('Showdown закрыт дивизиону 3', !careerMajorCan(careerMajorOn('2025-05-13')));
    seed(2, '2025-05-13');
    const sh=careerMajorOn('2025-05-13');
    check('13 мая — Showdown как «Мейджор 4», стадия LCQ', sh && sh.n===4 && sh.stage==='lcq', JSON.stringify(sh));
    check('Showdown открыт дивизиону 2', careerMajorCan(sh));
    const st1=ccScaleStage(ccMajorStageSpec('lcq', 4)), st2=ccScaleStage(ccMajorStageSpec('final', 4));
    check('Showdown: раунд 1 — 10 игр, 300 трио, топ-33; раунд 2 — 6 игр на 33', st1.games===10 && st1.field===300 && st1.cut===33 && st2.games===6 && st2.field===33, JSON.stringify([st1.games, st1.field, st1.cut, st2.games, st2.field]));
    const h3=await playThrough('showdown r1');
    s=save(); const r3=(s.log||[]).slice(-1)[0];
    check('Showdown раунд 1 записан', r3 && r3.kind==='major' && r3.stage==='lcq' && r3.games===10, JSON.stringify(r3 && {stage:r3.stage, games:r3.games, place:r3.place, of:r3.of}));
    out.steps.push('showdown r1: '+h3+' · #'+(r3&&r3.place)+' of '+(r3&&r3.of)+' · ticket '+(s.major && s.major.ticket));
    if(!(s.major && s.major.ticket)){ out.steps.push('showdown r1: не прошёл — раунд 2 по сиду'); seed(2, '2025-05-14', {major:{n:4, got:'lcq', pass:'lcq', ticket:true}}); s=save(); }
    if(s.major && s.major.ticket){
      CAREER.career.day='2025-05-14'; careerSave(); careerRenderHub('centre');
      check('раунд 2 открыт по билету', careerMajorCan(careerMajorOn('2025-05-14')));
      check('раунд 2 платит таблицей Showdown: $9 000 трио за первое', majorPrize(1)===9000 && majorPrize(25)===450 && majorPrize(26)===0, majorPrize(1)+'/'+majorPrize(25));
      const h4=await playThrough('showdown r2');
      s=save(); const r4=(s.log||[]).slice(-1)[0];
      check('Showdown раунд 2: 33 трио, 6 игр', r4 && r4.stage==='final' && r4.of===33 && r4.games===6, JSON.stringify(r4 && {stage:r4.stage, games:r4.games, place:r4.place, of:r4.of}));
      check('Showdown не даёт места в Лион', !ccGlobalsSeat(), JSON.stringify(ccGlobalsSeat()));
      out.steps.push('showdown r2: '+h4+' · #'+(r4&&r4.place)+' · $'+(s.earnings||0));
    } else out.steps.push('showdown r1: не прошёл, раунд 2 не проверялся');
    // Performance Evaluation, 7 января.
    seed(1, '2025-01-07');
    const h5=await playThrough('eval');
    s=save(); const r5=(s.log||[]).slice(-1)[0];
    check('оценка записана: 7 или 11 игр', r5 && r5.kind==='eval' && (r5.games===7 || r5.games===11), JSON.stringify(r5 && {kind:r5.kind, games:r5.games, place:r5.place}));
    out.steps.push('eval: '+h5+' · games '+(r5&&r5.games)+' · $'+(s.earnings||0));
    // Squid Grounds Cash Cup, 18 июля — дуо-кап, играет состав сезона.
    seed(1, '2025-07-18');
    const v=careerVictoryOn('2025-07-18');
    check('18 июля — Squid Grounds, $100 на игрока', v && v.cash===100 && v.mode==='duo', JSON.stringify(v));
    const h6=await playThrough('squid');
    s=save(); const r6=(s.log||[]).slice(-1)[0];
    check('Squid записан как victory', r6 && r6.kind==='victory', JSON.stringify(r6 && {kind:r6.kind, games:r6.games}));
    check('карточка вечера зовёт кап по имени', /Squid Grounds/.test(h6), h6);
    out.steps.push('squid: '+h6+' · $'+(s.earnings||0));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc25c-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2025-cash');
