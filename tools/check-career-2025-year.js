// Год 2025 целиком, день за днём: мир играет три Мейджора (плей-ин, три группы,
// LCQ, лобби, финал) и Лион, год кончается 7 сентября, а карьера с места в Лион
// играет его сама — на 33 трио, по кошельку 2025-го.
//
//   node tools/check-career-2025-year.js
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
      career:Object.assign({season:1, size:3, year:2025, year0:2025, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y25y'}, extra||{}),
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
    for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card came back');
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  try{
    // 1. Год целиком, скипом, из Дивизиона 1 — мир играет всё сам.
    seed(CC_YEAR_2025_FROM);
    let guard=0; const t0=Date.now();
    while(!CAREER.career.seasonOver && guard++<400) careerSkipWeek();
    out.notes.days=guard; out.notes.ms=Date.now()-t0;
    check('год кончился', CAREER.career.seasonOver, 'дней '+guard);
    check('стоит на 7 сентября', CAREER.career.day===CC_YEAR_2025_TO, CAREER.career.day);
    check('без ошибок JS за год', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const cr=CAREER.career;
    const kinds={}; (cr.log||[]).forEach(r=>{ const k=r.kind+(r.stage?':'+r.stage:''); kinds[k]=(kinds[k]||0)+1; });
    out.notes.kinds=kinds;
    const paid=Object.keys(cr.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл финалы трёх Мейджоров', ['1|major1','1|major2','1|major3'].every(k=>paid.indexOf(k)>=0), paid.join(','));
    check('мир не играл Reload / Саммит / LCQ Глобалов', !paid.some(k=>/reload|summit|gclc|rc/i.test(k)), paid.join(','));
    check('снимок к осени — t3', ccSnapshotNow().tag==='t3', ccSnapshotNow().tag);
    check('остров к осени — t3', careerBrSet()==='t3', careerBrSet());
    check('ЛАН года — Лион', ccLanHostKey('globals')==='Lyo', ccLanHostKey('globals'));
    // 2. Лион — своими руками, с места из финала Мейджора 3.
    seed('2025-09-06', {log:[{kind:'major', stage:'final', day:'2025-08-02', place:1, of:33, games:12, season:1, passed:true}]});
    check('место в Лион с финала Мейджора 3', !!ccGlobalsSeat(), JSON.stringify(ccGlobalsSeat()));
    check('Лион открыт', careerGlobalsCan((careerEvents().get('2025-09-06')||[]).find(e=>e.kind==='globals')));
    const head=await playThrough('Lyon');
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')).career;
    const rg=(s.log||[]).find(r=>r.kind==='globals');
    check('Лион записан', !!rg, JSON.stringify((s.log||[]).slice(-1)[0]));
    check('Лион — 33 трио', rg && rg.of===33, String(rg && rg.of));
    check('Лион — 12 игр', rg && rg.games===12, String(rg && rg.games));
    check('кошелёк Лиона: $450 000 за первое', gcPrize(1)===450000 && gcPrize(33)>0, gcPrize(1)+'/'+gcPrize(33));
    out.steps.push('Lyon: '+head+' · #'+(rg&&rg.place)+' of '+(rg&&rg.of)+' · $'+(s.earnings||0));
    check('после Лиона год над', s.day>='2025-09-06', s.day);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc25y-'));
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
console.log('OK check-career-2025-year');
