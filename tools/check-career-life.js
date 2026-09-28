// Жизнь между турнирами: ранг и порог капа, травма, бан, сессия Noble, поездка с визой и джетлагом,
// икон-скин, оценка вечера в журнале и на карточке.
//
//   node tools/check-career-life.js
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
    const setY=(d,y,extra)=>{ seed(d, extra); const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.career.year=y; s.career.year0=y; localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); careerRenderHub('centre'); };
    // 1. Ранг: 2026, соло Victory Cup 8 марта. Ниже Diamond — закрыт, от Diamond — открыт.
    setY('2026-03-08', 2026);
    const lf=ccLife();
    lf.rp=250;
    check('ранг ниже Diamond закрывает кап', !careerCanPlayKind('victory') && ccLifeWhy(careerToday(),'victory')==='lfWhyRank', ccLifeWhy(careerToday(),'victory'));
    lf.rp=450;
    check('Diamond открывает кап', careerCanPlayKind('victory'), ccLifeWhy(careerToday(),'victory'));
    // 2. Травма закрывает вечер и тренировки.
    lf.hurt={k:'wrist', until:ccAddDays(careerToday(), 3)};
    check('травма закрывает вечер', !careerCanPlayKind('victory'));
    check('травма закрывает тренировку', careerDoAct('trAim')===null);
    lf.hurt=null;
    // 3. Бан закрывает открытые турниры.
    lf.ban=ccAddDays(careerToday(), 5);
    check('бан закрывает кап', !careerCanPlayKind('victory'));
    lf.ban=null;
    // 4. Noble: день — сессия, строка недели.
    setY('2026-03-10', 2026);
    const r=careerDoAct('noble');
    check('сессия Noble сыграна', !!r && ccLife().noble && ccLife().noble.n===1, JSON.stringify(ccLife().noble||null).slice(0,200));
    out.notes.noble=(CAREER.career.news||[]).find(n=>n.k==='lfNewsNoble');
    check('новость Noble', !!out.notes.noble);
    out.notes.tile=ccLifeTileHTML().replace(/<[^>]+>/g,' ').replace(/ +/g,' ').slice(0,400);
    // 5. Поездка: DreamHack Winter 2022 (Йёнчёпинг) из NA — оформить билет.
    setY('2022-11-10', 2022, {region:'NAC'});
    CAREER.player.region='NAC'; if(CAREER.career) CAREER.career.region='NAC';
    const ev=ccVictoryList().find(v=>v.day==='2022-11-27');
    out.notes.trip=JSON.stringify(ccTripOf(ev));
    check('без билета закрыт', ccTripWhy(ev)==='lfTripNone', ccTripWhy(ev));
    CAREER.career.balance=5000;
    careerTripBook(ev.id, ev.day);
    check('с билетом за 17 дней открыт', ccTripWhy(ev)===null, ccTripWhy(ev));
    ccLife().trips={}; ccLife().trips[ev.id+'|'+ev.day]={day:'2022-11-24', cost:900};
    // Визы в режиме нет: поздний билет всё равно пускает, только с джетлагом.
    check('поздний билет пускает', ccTripWhy(ev)===null, ccTripWhy(ev));
    check('джетлаг при позднем билете', ccTripJetlag(ev)===true);
    // 6. Икон-скин: миллион призовых.
    setY('2026-04-01', 2026);
    CAREER.career.earnings=1200000; const bal=CAREER.career.balance||0;
    ccLife().tick=ccAddDays(careerToday(), -1);
    ccLifeTick();
    check('икон-скин выдан', !!ccLife().icon && (CAREER.career.balance||0)>bal, JSON.stringify(ccLife().icon));
    // 7. Оценка вечера приклеивается к строке журнала.
    setY('2026-03-08', 2026);
    ccLife().rp=600; careerPrPlace=careerPrPlace;
    const play=document.querySelector('#screen-career-hub .ch-play');
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null; for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    const last=(CAREER.career.log||[]).slice(-1)[0];
    check('оценка в журнале', last && last.rating>=1 && last.rating<=10, JSON.stringify(last).slice(0,200));
    check('оценка на карточке', !!c && /Оценка за вечер|Match rating/.test(c.textContent));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclife-'));
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
console.log('OK check-career-life');
