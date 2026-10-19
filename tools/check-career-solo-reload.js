// FNCS Solo Reload, November 2026: Epic's two brackets from the 19 October post
// (x.com/FNCompetitive/status/2112236444211429766). Checked here:
//   * six evenings — Round 2 (7 Nov), Round 3 (8 Nov), Heats (14-15), LCQ
//     Round 1 (16), LCQ Final (17), Finals (21-22), and the year reaches them;
//   * the Nations Cup no longer sits on any of them;
//   * October's FNCS Solos does not lock November out (its own state);
//   * Round 2 cuts 500 of 5000 EU / 3000 NAC / 2000 elsewhere, Round 3 80 of 500;
//   * a heat is 40 over 8 matches, 16th-25th fall to the LCQ Final;
//   * the LCQ Final and the Finals are rooms of 40 (5 and 10 matches);
//   * every stage is played on the Reload island.
//
//   node tools/check-career-solo-reload.js
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
  // Every closed room asks where to land; the harness answers with the first
  // zone the moment a picker appears, so a run never waits on a click.
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"); if(document.getElementById("ccAskYes") && document.getElementById("ccAskYes").textContent===L().ccSpotGateSet){ careerSpotEnsure(); document.getElementById("ccAskModal").style.display="none"; careerPlay(); return; } if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } } const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
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
      career:{season:1, day:'2026-11-07', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career;
    const days={rlr2:'2026-11-07', rlr3:'2026-11-08', rlheats:'2026-11-14', rllcq1:'2026-11-16',
                rllcqf:'2026-11-17', rlfinal:'2026-11-21'};
    Object.keys(days).forEach(function(st){
      const ev=careerSoloSeriesOn(days[st]);
      if(!ev || ev.series!=='solos' || ev.stage!==st) fail(days[st]+' is '+(ev ? ev.stage : 'nothing')+', not '+st);
      if(!/^r\\d$/.test(ccSoloFncsSet(ev))) fail(st+' is played on '+ccSoloFncsSet(ev)+', not a Reload island');
    });
    if(CC_YEAR_TO < '2026-11-22') fail('the year ends '+CC_YEAR_TO+', before the Solo Reload finals');
    ['2026-11-07','2026-11-08','2026-11-14','2026-11-15','2026-11-16','2026-11-17','2026-11-21','2026-11-22'].forEach(function(d){
      if((careerEvents().get(d)||[]).some(e=>e.kind==='nations')) fail('the Nations Cup sits on '+d);
    });
    out.steps.push('calendar: six evenings 7-22 Nov on the Reload island, no Nations Cup on them');

    // October's final does not close November.
    cr.solos={got:'final', seat:null};
    if(!careerSoloSeriesCan(careerSoloSeriesOn(days.rlr2))) fail('the October final locked Solo Reload Round 2');
    ['rlr3','rlheats','rllcqf','rlfinal','rllcq1'].forEach(function(st){
      if(careerSoloSeriesCan(careerSoloSeriesOn(days[st]))) fail(st+' let somebody in without a seat');
    });
    out.steps.push('gates: Round 2 open after the October final, the rest only with a seat');

    const cutAt=(reg)=>{ const keep=CAREER.player.region; CAREER.player.region=reg;
      const v=soloReloadR2Cut(); CAREER.player.region=keep; return v; };
    if(cutAt('EU')!==10 || cutAt('NAC')!==17 || cutAt('OCE')!==25)
      fail('the Round 2 cut is wrong: EU '+cutAt('EU')+', NAC '+cutAt('NAC')+', OCE '+cutAt('OCE'));
    out.steps.push('round 2 cut: EU 10, NAC 17, the rest 25');

    // Epic's finals table (Notion «19.10», screen 35).
    const at=(reg,p)=>{ const keep=CAREER.player.region; CAREER.player.region=reg;
      const v=soloReloadPrize(p); CAREER.player.region=keep; return v; };
    if(at('EU',1)!==60000 || at('EU',16)!==1250 || at('EU',26)!==750 || at('EU',40)!==750 || at('EU',41)!==0) fail('the EU table is wrong');
    if(at('NAC',1)!==50000 || at('NAC',21)!==500 || at('NAC',40)!==400) fail('the NAC table is wrong');
    if(at('NAW',1)!==15000 || at('BR',11)!==500 || at('BR',40)!==300 || at('NAW',10)!==750) fail('the NAW/BR table is wrong');
    if(at('ASIA',1)!==7000 || at('ME',20)!==300 || at('OCE',21)!==200 || at('OCE',41)!==0) fail('the ASIA/ME/OCE table is wrong');
    const pot=(reg)=>{ let s=0; for(let p=1;p<=40;p++) s+=at(reg,p); return s; };
    out.steps.push('prizes: EU pot '+pot('EU')+', NAC '+pot('NAC')+', NAW/BR '+pot('BR')+', ASIA/ME/OCE '+pot('OCE'));

    const run=async function(st, state, room, games){
      cr.solosRl=state; cr.day=days[st]; careerSave();
      if(careerNext().type!=='solo') fail(days[st]+' offers '+careerNext().type+' instead of Solo Reload');
      await runCareerSoloSeries();
      const l=cr.log[cr.log.length-1];
      if(!l || l.stage!==st) fail(st+' did not run');
      if(room && l.of!==room) fail(st+' was a room of '+l.of+', not '+room);
      if(!room && l.of<=100) fail(st+' was a room of '+l.of+', it is meant to be open');
      if(l.games!==games) fail(st+' played '+l.games+' matches, not '+games);
      out.steps.push(st+': '+l.place+' of '+l.of+' over '+games+' to '+((cr.solosRl||{}).seat||'out'));
      return l;
    };
    await run('rlr2', null, 100, 11);
    if(cr.solosRl.seat && cr.solosRl.seat!=='rlr3') fail('Round 2 seated outside Round 3');
    if(cr.solos.got!=='final') fail('Solo Reload wrote over the October state');
    await run('rlr3', {got:'rlr2', seat:'rlr3'}, 100, 11);
    const lh=await run('rlheats', {got:'rlr3', seat:'rlheats'}, 40, 8);
    const seat=cr.solosRl.seat;
    if(seat==='rllcqf' && (lh.place<16 || lh.place>25)) fail('the LCQ Final took heat place '+lh.place);
    if(seat && seat!=='rllcqf' && seat!=='rlfinal') fail('the heat handed out '+seat);
    await run('rllcq1', {got:'rlheats', seat:null}, 0, 11);
    await run('rllcqf', {got:'rllcq1', seat:'rllcqf'}, 40, 5);
    const lz=await run('rlfinal', {got:'rllcqf', seat:'rlfinal'}, 40, 10);
    if(lz.prize!==soloReloadPrize(lz.place)) fail('the cheque does not match the table');
    if(careerSoloSeriesCan(careerSoloSeriesOn(days.rlfinal))) fail('a played final replays');
    cr.seasonOver=true; careerNewSeason();
    if(CAREER.career.solosRl) fail('a new season kept Solo Reload');
    out.steps.push('played once, and the new season opens the road again');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  // Сентинел склеен из кусков нарочно: --dump-dom печатает и текст самого
  // скрипта, и целая строка "BEGIN" в исходнике ловилась регуляркой раньше
  // настоящего вывода — тогда падение пробы читалось как «сломанный JSON».
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsolorl-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=1800000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('FNCS Solo Reload runs its whole November road on the Reload island');
