// The Solo Series: an open solo road in every region, prized by its region.
//
// His two Tracker saves, 23 August (Solo Series Heats / Finals EU), plus the
// other six regions' payout pages read the same evening. The career plays the
// last qualifier session (11 Jan), one heat (17 Jan) and the final (24 Jan):
//   * the qualifier is open to every division and needs no partner;
//   * the Heats want the qualifier cleared, the Final wants the Heats;
//   * a stage is played once, and a new season hands the road back;
//   * the Final pays the region's own table — the whole EU pot is $121,500
//     and every cheque lands in the money book;
//   * NAW/BR and ASIA/ME/OCE share tables, Epic's own grouping.
//
//   node tools/check-career-solo-series.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // The Heats and the Final ask where to land; a harness answers with the
  // first zone the moment a picker appears, so a run never waits on a click.
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"); if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } } const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Soloist', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-11', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career;

    // ---- the calendar knows the three days, and the gates hold ------------
    const q=careerSoloSeriesOn('2026-01-11'), h=careerSoloSeriesOn('2026-01-17'),
          f=careerSoloSeriesOn('2026-01-24');
    if(!q || q.stage!=='qual')  fail('11 Jan is not the qualifier');
    if(!h || h.stage!=='heats') fail('17 Jan is not the heats');
    if(!f || f.stage!=='final') fail('24 Jan is not the final');
    if(!careerSoloSeriesCan(q)) fail('an open qualifier refused a Division 3 rookie');
    if(careerSoloSeriesCan(h))  fail('the heats let somebody in without a qualifier');
    if(careerSoloSeriesCan(f))  fail('the final let somebody in without the heats');
    out.steps.push('calendar and gates: qualifier open, heats and final locked');

    // ---- the region tables pay what Tracker says ---------------------------
    const at=(reg,p)=>{ const keep=CAREER.player.region; CAREER.player.region=reg;
      const v=soloSeriesPrize(p); CAREER.player.region=keep; return v; };
    if(at('EU',1)!==15000 || at('EU',100)!==250 || at('EU',101)!==0)
      fail('the EU table is wrong');
    if(at('NAC',1)!==10000 || at('NAC',76)!==200) fail('the NAC table is wrong');
    if(at('NAW',1)!==4000 || at('BR',25)!==400) fail('the NAW/BR table is wrong');
    if(at('ASIA',1)!==2500 || at('ME',10)!==375 || at('OCE',50)!==150 || at('OCE',51)!==0)
      fail('the ASIA/ME/OCE table is wrong');
    const pot=(reg)=>{ let s=0; for(let p=1;p<=100;p++) s+=at(reg,p); return s; };
    if(pot('EU')!==121500) fail('the EU pot is $'+pot('EU')+', Tracker says $121,500');
    out.steps.push('every region pays its own table; EU pot $121,500 to the dollar');

    // ---- the qualifier plays, one press, no partner ------------------------
    if(careerNext().type!=='solo') fail('11 Jan offers '+careerNext().type+' instead of the Solo Series');
    await runCareerSoloSeries();
    if(cr.day!=='2026-01-12') fail('the qualifier did not advance the day');
    const lq=cr.log[cr.log.length-1];
    if(!lq || lq.kind!=='solo' || lq.stage!=='qual') fail('the qualifier wrote no log row');
    if(!cr.solo || cr.solo.got!=='qual') fail('the qualifier left no state');
    out.steps.push('qualifier: '+lq.place+' of '+lq.of+' — '+(cr.solo.pass==='qual'?'through':'out'));

    // ---- the heats and the final, with the road forced open ----------------
    cr.solo={got:'qual', pass:'qual'};
    cr.day='2026-01-17'; careerSave();
    if(!careerCanPlayKind('solo')) fail('a cleared qualifier still cannot enter the heats');
    await runCareerSoloSeries();
    const lh=cr.log[cr.log.length-1];
    if(!lh || lh.stage!=='heats' || lh.of!==100) fail('the heats were not a room of 100');
    out.steps.push('heats: '+lh.place+' of '+lh.of);

    cr.solo={got:'heats', pass:'heats'};
    cr.day='2026-01-24'; careerSave();
    const before=Object.keys(careerMoney().rows).reduce((s,k)=>s+careerMoney().rows[k].usd,0);
    await runCareerSoloSeries();
    const lf=cr.log[cr.log.length-1];
    if(!lf || lf.stage!=='final' || lf.of!==100) fail('the final was not a room of 100');
    const after=Object.keys(careerMoney().rows).reduce((s,k)=>s+careerMoney().rows[k].usd,0);
    if(after-before!==121500)
      fail('the final banked $'+(after-before)+' across the room, the pot is $121,500');
    if(lf.prize!==soloSeriesPrizeAt(lf.place)) fail('the cheque does not match the table');
    function soloSeriesPrizeAt(p){ return soloSeriesPrize(p); }
    out.steps.push('final: '+lf.place+' of 100, $'+(lf.prize||0)+' — the room banked the whole pot');

    // ---- played once, and a new season hands the road back -----------------
    if(careerSoloSeriesCan(careerSoloSeriesOn('2026-01-24'))) fail('a played final replays');
    cr.seasonOver=true; careerNewSeason();
    if(CAREER.career.solo) fail('a new season kept the Solo Series');
    out.steps.push('a stage is played once, and the new season opens the road again');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsolo-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the Solo Series runs its whole road, and pays by region');
