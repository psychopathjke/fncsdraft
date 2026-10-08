// Кубок наций: последнее место через отбор страны — выиграл отбор, играешь квалификацию вчетвером (его вопрос 8.10).
//   node tools/check-career-nat-trial.js
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
  const out={fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(ovr, country, day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Natman', age:20, source:'rookie', country:country, countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:ovr, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:2, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'nat'+ovr}, extra||{}),
      partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(ovr, 'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const playThrough=async what=>{
    careerRenderHub('centre');
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button');
    if((play.getAttribute('onclick')||'').indexOf('careerPlay')<0) throw new Error(what+': button skips: '+play.textContent.trim());
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card');
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  try{
    // Последнее место в сборной — через отбор страны (его вопрос 8.10: «nation квалификацию точно работают сейчас? для
    // последнего игрока»): выиграл отбор — четвёртый в составе, квалификация открыта и играется вчетвером.
    seed(85, 'de', '2026-10-28');
    const m=ccNationsMine(); out.notes.seat=m && {seat:m.seat, inSquad:m.inSquad, cap:m.captain};
    check('85 из Германии — место через отбор', m && m.seat==='trial' && !m.inSquad, JSON.stringify(out.notes.seat));
    careerAdvanceTo('2026-10-31');
    check('отбор открыт', careerCanPlayKind('nations')===true, ccNatWhyLocked && ccNatWhyLocked());
    out.notes.trialHead=await playThrough('trial');
    const N=CAREER.career.nations; out.notes.trial=N.trial;
    const lt=(CAREER.career.log||[]).find(r=>r.kind==='nations' && r.stage==='trial'); out.notes.trialPlace=lt && (lt.place+'/'+lt.of);
    if(N.trial!=='won'){ out.notes.forced=true; N.trial='won'; careerSave(); }
    const m2=ccNationsMine(); out.notes.after={inSquad:m2.inSquad, squad:(m2.squad||[]).map(p=>p ? (p.handle||p.name||'?') : '—')};
    check('после выигранного отбора — в составе', m2.inSquad===true, JSON.stringify(out.notes.after));
    check('состав — четыре места', (m2.squad||[]).length===4, JSON.stringify(out.notes.after));
    careerAdvanceTo('2026-11-07');
    check('квалификация открыта для игрока с отбора', careerCanPlayKind('nations')===true, ccNatWhyLocked && ccNatWhyLocked());
    out.notes.qualHead=await playThrough('qual');
    const lq=(CAREER.career.log||[]).find(r=>r.kind==='nations' && r.stage!=='trial'); out.notes.qual=lq && {stage:lq.stage, place:lq.place, of:lq.of, mates:lq.mates, nat:lq.nat};
    check('квалификация записана в журнал', !!lq, '');
    check('играли вчетвером — трое рядом', lq && (lq.mates||[]).length===3, JSON.stringify(out.notes.qual));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccnat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1200000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 300)));
if (out.err) { out.fails.forEach(f => console.log('FAIL ' + f)); console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-nat-trial');
