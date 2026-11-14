// Кап в чужом регионе (ccAwayPlay): кнопка на хабе, поле и призы того региона, пинг до чужого сервера и штраф
// к силе, 25 энергии, день не сдвигается и свой вечер того же дня остаётся.
//   node tools/check-career-away.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found, set CHROME to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const y=document.getElementById("ccAskYes"); if(y) y.click(); return; }
    const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    const DAY='2026-03-22';   // Solo Victory Cup: соло, напарник не нужен
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'AwayMan', age:17, source:'rookie', country:'de', countryPing:7,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:DAY, division:4, earnings:0, balance:0, reach:0, energy:100,
              tokens:[], log:[], news:[], life:{rp:500}},
      partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    if(careerNext().type!=='victory') fail(DAY+' is not a cup day: '+careerNext().type);

    // ---- числа ------------------------------------------------------------------
    if(ccXregMs('EU','NAC')!==90 || ccXregMs('NAC','EU')!==90) fail('EU-NAC ping is not symmetric 90');
    if(ccAwayPen(90)!==18 || ccAwayPen(95)!==19) fail('penalty: NAC '+ccAwayPen(90)+', ME '+ccAwayPen(95));
    if(ccAwayPen(400)!==CC_AWAY_PEN_MAX || ccAwayPen(10)!==0) fail('penalty is not clamped');
    out.steps.push('ping EU-NAC 90 ms, penalty NAC -18, ME -19, cap -'+CC_AWAY_PEN_MAX);

    // ---- кнопки на хабе -----------------------------------------------------------
    careerRenderHub('centre');
    const row=document.querySelector('#screen-career-hub .cc-away');
    if(!row) fail('no other-regions row on a cup day');
    const btns=[...row.querySelectorAll('button')];
    const nac=btns.find(b=>/onclick/.test(b.outerHTML) && (b.getAttribute('onclick')||'').indexOf("'NAC'")>=0);
    if(!nac || nac.disabled) fail('no usable NAC button: '+btns.map(b=>b.textContent).join(' | '));
    if(btns.some(b=>(b.getAttribute('onclick')||'').indexOf("'EU'")>=0)) fail('home region is offered as away');
    if(!/90/.test(nac.textContent) || !/-18/.test(nac.textContent)) fail('NAC button does not show ping and penalty: '+nac.textContent);
    if(/\u2014/.test(row.textContent)) fail('long dash on the row');
    out.steps.push('hub: '+btns.length+' regions, '+nac.textContent);

    // ---- вечер в NAC ---------------------------------------------------------------
    const en0=careerEnergy();
    let fieldReg=null, ping=null, youPow=null, basePow=null;
    const cyt=careerYouTeam; careerYouTeam=function(){ const t=cyt.apply(this, arguments); basePow=t.pow; ping=ccPingNow(); return t; };
    const csf=careerSoloField; careerSoloField=function(){ fieldReg=ccCareerRegion(); return csf.apply(this, arguments); };
    const sgl=simulateGamesLive; simulateGamesLive=function(field){ if(youPow==null){ const y=field.find(t=>t.isYou); youPow=y && y.pow; } return sgl.apply(this, arguments); };
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    const pr=ccAwayPlay('NAC');
    let card=null;
    for(let i=0; i<8000 && !card; i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')].find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    await pr;
    careerYouTeam=cyt; careerSoloField=csf; simulateGamesLive=sgl;
    if(!card) fail('no result card after the away cup');
    if(fieldReg!=='NAC') fail('the field was built for '+fieldReg);
    if(ping!==90) fail('ping during the night was '+ping);
    if(!(basePow-youPow===18)) fail('power penalty: '+basePow+' -> '+youPow);
    out.steps.push('night: field NAC, ping 90, power '+basePow+' -> '+youPow);
    const cr=CAREER.career;
    if(careerToday()!==DAY) fail('the day moved: '+careerToday());
    if(Math.round(en0-careerEnergy())!==CC_AWAY_ENERGY) fail('energy spent '+(en0-careerEnergy()));
    if(!(cr.away && (cr.away[DAY]||[]).indexOf('NAC')>=0)) fail('the away night is not remembered');
    const last=(cr.log||[]).slice(-1)[0];
    if(!last || last.away!=='NAC' || last.day!==DAY) fail('the log row is not tagged NAC: '+JSON.stringify(last));
    if(CC_REGION_AS!==null || CC_AWAY!==null) fail('the region switch leaked: '+CC_REGION_AS);
    if(ccCareerRegion()!=='EU') fail('home region changed: '+ccCareerRegion());
    if(ccAwayWhy('NAC')!=='done') fail('NAC can be played twice: '+ccAwayWhy('NAC'));
    out.steps.push('after: day '+careerToday()+', energy -'+CC_AWAY_ENERGY+', log #'+last.place+' $'+(last.prize||0));

    // ---- свой вечер того же дня остаётся ---------------------------------------------
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    await wait(50);
    if(careerNext().type!=='victory' || careerNext().day!==DAY) fail('the home cup of the day is gone');
    out.steps.push('home cup of '+DAY+' still on');

    // ---- нет сил -----------------------------------------------------------------------
    cr.energy=10;
    if(ccAwayWhy('ME')!=='tired') fail('a tired player can go away: '+ccAwayWhy('ME'));
    out.steps.push('with 10 energy: '+ccAwayWhy('ME'));

    // ---- пять языков ---------------------------------------------------------------------
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      if(!(typeof D.awH==='function' && D.awBtn('NA', 90, 18).indexOf('90')>=0 && D.aw_done && D.aw_tired && D.aw_mate)) fail(l+': away strings missing'); });
    out.steps.push('five languages');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccaway-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('OK a cup in another region: its field, its ping, 25 energy, the day stays');
