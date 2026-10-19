// OG-сезоны в карьере: Season OG 2023 (OG Skirmish креаторов, Victory Cash Cup, остров Главы 1, сезон 27) и
// Chapter 2 Remix 2024 (Trios Cash Cup, Solo Victory, Reload, остров Главы 2 Сезона 2, сезон 32). Только капы с деньгами.
//   node tools/check-career-og.js
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
      career:Object.assign({season:1, size:2, year:+day.slice(0,4), year0:+day.slice(0,4), day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'og23'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}]}));
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
    { const ms=document.getElementById('majorStages'); if(ms) ms.innerHTML=''; }
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
    // Season OG (Notion: его «OG сезоны… добавляй капы, где есть призы»): денежные OG Skirmish креаторов ноября 2023-го.
    seed(1, '2023-11-03');
    const days=careerYearDays();
    const og=[...days.entries()].filter(([d,l])=>l.some(e=>e.kind==='victory' && /OG Skirmish/.test(e.label))).map(([d])=>d).sort();
    out.notes.og=og;
    check('OG Skirmish в календаре: 5, 6, 17, 18, 19 ноября', ['2023-11-05','2023-11-06','2023-11-17','2023-11-18','2023-11-19'].every(d=>og.includes(d)), og.join(','));
    check('год 2023 идёт до 30 ноября', ccYearTo()==='2023-11-30', ccYearTo());
    { const alts=ccVictoryAlts('2023-11-22').map(v=>v.id);
      check('22 ноября — Solo Victory Cash Cup и ZB Duos Victory', alts.includes('S27_SoloVictoryCashCup') && alts.includes('S27_DuosZBVictoryCashCup'), alts.join(',')); }
    check('сезон OG — 27-й, глава OG', ccSeasonNumOn('2023-11-17')===27 && ccChapterOf(27).name==='OG' && /OG/.test(JSON.stringify(ccSeasonTag('2023-11-17'))), ccSeasonNumOn('2023-11-17')+' '+JSON.stringify(ccSeasonTag('2023-11-17')));
    check('Кубок наций остался 4 ноября', ccNatDays().final==='2023-11-04', JSON.stringify(ccNatDays()));
    seed(1, '2023-11-17');
    const v=careerVictoryOn('2023-11-17');
    check('17 ноября — OG Skirmish с деньгами', v && /OG Skirmish/.test(v.name) && ccVictoryPayOf(v, 1)>0, JSON.stringify(v && {name:v.name, id:v.id, p1:ccVictoryPayOf(v,1), p25:ccVictoryPayOf(v,25), p26:ccVictoryPayOf(v,26)}));
    check('остров Главы 1 (h1)', careerBrSet()==='h1' && careerNightSet({type:'victory', day:'2023-11-17'})==='h1', careerBrSet()+' / '+careerNightSet({type:'victory', day:'2023-11-17'}));
    const h=await playThrough('og skirmish');
    const s=save(); const r=(s.log||[]).slice(-1)[0];
    check('кап сыгран и записан', r && r.kind==='victory', JSON.stringify(r && {kind:r.kind, place:r.place, of:r.of, prize:r.prize}));
    check('карточка вечера зовёт OG Skirmish', /OG Skirmish/.test(h), h);
    out.steps.push('og: '+h+' · #'+(r&&r.place)+' of '+(r&&r.of)+' · $'+(r&&r.prize));
    // Chapter 2 Remix: год 2024 идёт до 30 ноября, октябрьские капы Главы 5 Сезона 4 и ноябрьские Remix — в календаре.
    seed(1, '2024-11-02');
    check('год 2024 идёт до 30 ноября', ccYearTo()==='2024-11-30', ccYearTo());
    { const alt=d=>ccVictoryAlts(d).map(v=>v.id);
      check('6 октября 2024 — Trios Cash Cup Главы 5 Сезона 4', alt('2024-10-06').includes('S31_TriosCashCup'), alt('2024-10-06').join(','));
      check('Remix: Trios Cash Cup 7, 9, 14, 16, 21, 23 ноября', ['2024-11-07','2024-11-09','2024-11-14','2024-11-16','2024-11-21','2024-11-23'].every(d=>alt(d).includes('S32_TriosCashCup')), ['2024-11-07','2024-11-23'].map(d=>d+':'+alt(d).join('+')).join(' '));
      check('Remix: Solo Victory 8, 15, 22, 25 ноября', ['2024-11-08','2024-11-15','2024-11-22','2024-11-25'].every(d=>alt(d).includes('S32_SoloVictoryCashCup'))); }
    check('сезон Remix — 32-й', ccSeasonNumOn('2024-11-09')===32 && /Remix/.test(JSON.stringify(ccSeasonTag('2024-11-09'))), JSON.stringify(ccSeasonTag('2024-11-09')));
    seed(1, '2024-11-09');
    check('Remix — остров Главы 2 Сезона 2 (i1)', careerBrSet()==='i1', careerBrSet());
    seed(1, '2024-11-08');
    { const v=careerVictoryOn('2024-11-08'); check('8 ноября — Solo Victory Cash Cup Remix', v && v.id==='S32_SoloVictoryCashCup', JSON.stringify(v && v.id));
      const hr=await playThrough('remix solo victory'); const r2=(save().log||[]).slice(-1)[0];
      check('кап Remix сыгран', r2 && r2.kind==='victory', JSON.stringify(r2 && {kind:r2.kind, place:r2.place, prize:r2.prize}));
      out.steps.push('remix: '+hr+' · #'+(r2&&r2.place)+' · $'+(r2&&r2.prize)); }
    seed(1, '2024-11-09');
    { const v=careerVictoryOn('2024-11-09'); out.notes.nov9=v && v.id+' '+v.mode;
      const hr=await playThrough('remix trios'); const r3=(save().log||[]).slice(-1)[0];
      check('Trios Cash Cup Remix в дуо-год сыгран', r3 && r3.kind==='victory', JSON.stringify(r3 && {kind:r3.kind, place:r3.place, of:r3.of, prize:r3.prize}));
      out.steps.push('remix 9.11: '+hr+' · #'+(r3&&r3.place)+' of '+(r3&&r3.of)+' · $'+(r3&&r3.prize)); }
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccog-'));
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
console.log('OK check-career-og');
