// Наём на турнир (ccHireOpen, 29.10): нанятый садится в первое кресло на день турнира, в поле его нет,
// вечер играется и пишется с ним, отмена до игры возвращает деньги, назавтра состав снова свой.
//
//   node tools/check-career-hire.js
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
  const seed=(day, extra, who)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Yearman', age:20, source:'rookie', country:(who&&who.c)||'de', countryPing:15, closeRangeEdge:6,
        region:(who&&who.r)||'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:4, year:+day.slice(0,4), year0:+day.slice(0,4), day:day, division:1, earnings:0, balance:0, reach:0,
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
    seed('2026-02-02', {size:2, balance:100000}, {c:'de'});
    CAREER.partners=CAREER.partners.slice(0, 1); CAREER.partners[0].card=card('M1', 82); careerSave(); careerRenderHub('centre');
    { const nd=careerSkipTarget(); out.notes.day=nd; if(nd){ CAREER.career.day=(typeof nd==='string' ? nd : nd.day); careerSave(); careerRenderHub('centre'); } }
    const hubHas=!!document.querySelector('#screen-career-hub button[onclick="ccHireOpen()"]');
    check('кнопка найма на Центре в день турнира', hubHas);
    const cands=ccHireCands();
    out.notes.cands=cands.slice(0,12).map(c=>c.handle+':'+ccHireOvr(c)+':'+ccHireFee(ccHireOvr(c), c)); out.notes.n=cands.length;
    check('есть кого нанять', cands.length>0);
    const mateOvr=ccHireOvr(careerMateRecords().map(ccMateCardOf)[0]);
    check('топ-100 региона, сверху сильнейшие', cands.length===CC_HIRE_TOP && cands.every((c,i)=>!i || ccHireOvr(cands[i-1])>=ccHireOvr(c)) && cands.some(c=>ccHireOvr(c)<mateOvr), 'напарник '+mateOvr+' n '+cands.length);
    const bal0=CAREER.career.balance, fee=ccHireFee(ccHireOvr(cands[0]), cands[0]), who=cands[0].handle;
    careerHire(0);
    check('деньги списаны', CAREER.career.balance===bal0-fee, bal0+' → '+CAREER.career.balance+' за '+fee);
    check('нанятый в первом кресле', careerMates()[0] && careerMates()[0].handle===who, JSON.stringify((careerMates()[0]||{}).handle));
    check('careerPartnerCard тоже он', careerPartnerCard() && careerPartnerCard().handle===who);
    const mine=[careerCard()].concat(careerMates());
    const field=careerCupField(CAREER.career, mine, 100, 'hire', true);
    const dup=field.some(t=>(t.cards||t.squad||[]).some(c=>c && hKey(c)===hKey(who)));
    check('нанятого нет в поле', !dup);
    careerHireCancel();
    check('отмена вернула деньги', CAREER.career.balance===bal0, String(CAREER.career.balance));
    check('после отмены — свой напарник', careerMates()[0] && careerMates()[0].handle!==who);
    // Два кресла (трио): двое нанятых, платишь каждому, третий не встаёт, отпускаешь по одному с возвратом.
    { const seats0=careerMateSeats; careerMateSeats=()=>2;
      CAREER.partners=CAREER.partners.concat([{card:card('M2', 81), patience:60, since:'2025-11-01', dev:0}]);
      const b0=CAREER.career.balance, f0=ccHireFee(ccHireOvr(cands[0]), cands[0]), f1=ccHireFee(ccHireOvr(cands[1]), cands[1]);
      careerHire(0); careerHire(1); careerHire(2);
      const ms=careerMates().map(c=>c && c.handle);
      check('трио: двое нанятых в двух креслах', ms[0]===cands[0].handle && ms[1]===cands[1].handle, JSON.stringify(ms));
      check('трио: заплачено обоим, третьего нет', CAREER.career.balance===b0-f0-f1 && ccHireList().length===2, b0+' → '+CAREER.career.balance+' за '+f0+'+'+f1);
      const fld=careerCupField(CAREER.career, [careerCard()].concat(careerMates()), 100, 'hire2', true);
      check('трио: нанятых нет в поле', !fld.some(t=>(t.cards||t.squad||[]).some(c=>c && (hKey(c)===hKey(cands[0]) || hKey(c)===hKey(cands[1])))));
      check('наём не уход: ключи нанятых видны ccTrioRefill', ccHireKeys().has(hKey(cands[0])) && ccHireKeys().has(hKey(cands[1])));
      careerHire(0);
      check('трио: отпустил одного — его деньги вернулись', ccHireList().length===1 && CAREER.career.balance===b0-f1, String(CAREER.career.balance));
      careerHireCancel();
      check('трио: отмена вернула всё', CAREER.career.balance===b0 && !ccHireActive(), String(CAREER.career.balance));
      CAREER.partners=CAREER.partners.slice(0, 1); careerMateSeats=seats0; CC_HIRE_MEMO=null; }
    careerHire(0);
    try{ careerRenderHub('centre'); }catch(e){ out.notes.renderErr=String(e && e.stack || e).slice(0,400); }
    out.notes.hubBtns=[...document.querySelectorAll('#screen-career-hub button')].map(b=>(b.className+'|'+(b.getAttribute('onclick')||'')).slice(0,40)).slice(12,40); out.notes.body=(document.getElementById('chBody')||{}).innerHTML ? document.getElementById('chBody').innerHTML.replace(/<[^>]+>/g,' ').replace(/s+/g,' ').slice(0,600) : 'нет chBody';
    const h=await playThrough('кап с нанятым');
    const l=lastLog();
    out.steps.push(h+' · #'+(l&&l.place)+' $'+(l&&l.prize)+' mate '+(l&&(l.mate||(l.mates||[]).join('+'))));
    check('вечер записан с нанятым', l && ((l.mate && hKey(l.mate)===hKey(who)) || (l.mates||[]).some(m=>hKey(m)===hKey(who))), JSON.stringify(l && {mate:l.mate, mates:l.mates}));
    CAREER.career.day=ccAddDays(CAREER.career.day, 1);
    check('назавтра состав снова свой', careerMates()[0] && careerMates()[0].handle!==who);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cchire-'));
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
console.log('OK check-career-hire');
