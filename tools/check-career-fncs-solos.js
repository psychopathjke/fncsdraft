// FNCS Solos 2026: the second solo road of the year, and a different tournament
// from January's Solo Series.
//
// Epic's own rules, published 1 September 2026 (rules-library,
// fortnite-championship-series-fncs-solos-2026-official-rules). What is checked
// here is what those rules say, not what felt right:
//   * nine evenings on the calendar — Qualifier 1 Round 2 and Round 3 (3 and 4
//     Oct), Fast Track and Qualifier 2 Round 2 (both 10 Oct), Qualifier 2
//     Round 3 (11 Oct), the Heats (17-18 Oct), LCQ Round 1 (19 Oct), the LCQ
//     Final (20 Oct) and the Finals (26-27 Oct);
//   * 10 October carries two of them at once, and the day hands back the one
//     this player may actually play;
//   * Round 2's cut is Epic's thousand against Epic's Round 1 advancement:
//     1000 of 8000 in Europe, of 4000 in NAC, of 2000 elsewhere;
//   * the second qualifier refuses anybody who already holds a seat, and the
//     last chance wants a played qualifier behind it and no seat;
//   * Fast Track sends its top 8 to the Finals and the rest to the Heats — from
//     there nobody goes home;
//   * a Heat counts its 29 among the players who did NOT take a Victory Royale,
//     and 36th-50th fall to the LCQ Final;
//   * the LCQ Final is a room of 70 and the Finals a room of 100, over 12
//     matches, paying the region's own table: the EU pot is 253,500 and NAC's
//     174,750;
//   * a stage is played once and a new season hands the road back.
//
//   node tools/check-career-fncs-solos.js
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
      career:{season:1, day:'2026-10-03', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career;

    // ---- the calendar carries Epic's own days ------------------------------
    const days={q1r2:'2026-10-03', q1r3:'2026-10-04', q2r3:'2026-10-11',
                heats:'2026-10-17', lcq1:'2026-10-19', lcqf:'2026-10-20',
                final:'2026-10-26'};
    Object.keys(days).forEach(function(st){
      const ev=careerSoloSeriesOn(days[st]);
      if(!ev) fail(days[st]+' carries no solo evening at all');
      if(ev.series!=='solos') fail(days[st]+' belongs to the January series, not FNCS Solos');
      if(ev.stage!==st) fail(days[st]+' is '+ev.stage+', not '+st);
    });
    // The year has to reach the final, or the tournament stops before its own end.
    if(CC_YEAR_TO < '2026-10-27') fail('the year ends '+CC_YEAR_TO+', before the Solos final');
    out.steps.push('calendar: nine evenings, 3 Oct to 27 Oct, and the year reaches them');

    /* 10 October carries two of Epic's evenings at once — Fast Track and the
       second round of the second qualifier. They are mutually exclusive for one
       player, so the day must hand back the one this player may play. */
    delete cr.solos;
    if(careerSoloSeriesOn('2026-10-10').stage!=='q2r2')
      fail('10 Oct gave a seatless player Fast Track instead of the second qualifier');
    cr.solos={got:'q1r3', seat:'fast'};
    if(careerSoloSeriesOn('2026-10-10').stage!=='fast')
      fail('10 Oct handed a Fast Track seat the other qualifier');
    delete cr.solos;
    out.steps.push('10 Oct holds two evenings, and each player is given their own');

    // ---- the gates ---------------------------------------------------------
    if(!careerSoloSeriesCan(careerSoloSeriesOn(days.q1r2))) fail('the open qualifier refused a rookie');
    ['q1r3','heats','lcqf','final'].forEach(function(st){
      if(careerSoloSeriesCan(careerSoloSeriesOn(days[st]))) fail(st+' let somebody in without a seat');
    });
    // The last chance wants a played qualifier behind it, not just an empty seat.
    if(careerSoloSeriesCan(careerSoloSeriesOn(days.lcq1))) fail('the LCQ took a player who never played a qualifier');
    cr.solos={got:'q2r3', seat:null};
    if(!careerSoloSeriesCan(careerSoloSeriesOn(days.lcq1))) fail('the LCQ refused a player who fell out of the qualifier');
    cr.solos={got:'q1r3', seat:'fast'};
    if(careerSoloSeriesCan(careerSoloSeriesOn(days.lcq1))) fail('the LCQ took a player who already has a seat');
    if(!careerSoloSeriesCan(careerSoloSeriesOn('2026-10-10'))) fail('Fast Track refused its own seat');
    delete cr.solos;
    out.steps.push('gates: qualifier open, second chance and last chance only without a seat');

    // ---- the region tables pay Attachment C --------------------------------
    const at=(reg,p)=>{ const keep=CAREER.player.region; CAREER.player.region=reg;
      const v=solosPrize(p); CAREER.player.region=keep; return v; };
    if(at('EU',1)!==60000 || at('EU',15)!==1500 || at('EU',100)!==300 || at('EU',101)!==0)
      fail('the EU table is wrong');
    if(at('NAC',1)!==50000 || at('NAC',26)!==400 || at('NAC',100)!==200) fail('the NAC table is wrong');
    if(at('NAW',1)!==12500 || at('NAW',76)!==150) fail('the NAW table is wrong');
    if(at('BR',1)!==15000 || at('BR',3)!==7500) fail('the BR table is wrong');
    if(at('ASIA',1)!==7000 || at('ME',10)!==400 || at('OCE',100)!==100 || at('OCE',101)!==0)
      fail('the ASIA/ME/OCE table is wrong');
    // Brazil and NAW share a table in January and part ways in this one.
    if(at('BR',1)===at('NAW',1)) fail('BR and NAW were given the same table');
    const pot=(reg)=>{ let s=0; for(let p=1;p<=100;p++) s+=at(reg,p); return s; };
    if(pot('EU')!==253500) fail('the EU pot is wrong: '+pot('EU')+' against Attachment C 253500');
    if(pot('NAC')!==174750) fail('the NAC pot is wrong: '+pot('NAC')+' against Attachment C 174750');
    out.steps.push('prizes: EU pot 253,500, NAC 174,750, every region its own table');

    /* Round 2's cut is Epic's own thousand against Epic's own Round 1
       advancement: 1000 of 8000 in Europe, of 4000 in NAC, of 2000 elsewhere. */
    const cutAt=(reg)=>{ const keep=CAREER.player.region; CAREER.player.region=reg;
      const v=solosR2Cut(); CAREER.player.region=keep; return v; };
    if(cutAt('EU')!==13 || cutAt('NAC')!==25 || cutAt('OCE')!==50)
      fail('the Round 2 cut is wrong: EU '+cutAt('EU')+', NAC '+cutAt('NAC')+', OCE '+cutAt('OCE'));
    out.steps.push('round 2 cut: EU 13, NAC 25, the rest 50 — a thousand over Epic own field');

    // ---- Qualifier 1, Round 2: a room of 100 over 11 matches ---------------
    if(careerNext().type!=='solo') fail('3 Oct offers '+careerNext().type+' instead of FNCS Solos');
    await runCareerSoloSeries();
    const lr2=cr.log[cr.log.length-1];
    if(!lr2 || lr2.kind!=='solo' || lr2.stage!=='q1r2') fail('Round 2 wrote no log row');
    if(lr2.of!==100) fail('Round 2 was a room of '+lr2.of+', the career plays a hundred');
    if(lr2.games!==11) fail('Round 2 played '+lr2.games+' matches, Epic says 11');
    if(!cr.solos || cr.solos.got!=='q1r2') fail('Round 2 left no state');
    if(cr.solos.seat && cr.solos.seat!=='q1r3') fail('Round 2 seated somebody outside Round 3');
    out.steps.push('qualifier 1 round 2: '+lr2.place+' of 100 over 11 matches — '+(cr.solos.seat||'out'));

    // ---- Qualifier 1, Round 3 ----------------------------------------------
    cr.solos={got:'q1r2', seat:'q1r3'};
    cr.day='2026-10-04'; careerSave();
    await runCareerSoloSeries();
    const lq=cr.log[cr.log.length-1];
    if(!lq || lq.stage!=='q1r3') fail('Round 3 did not run');
    if(lq.of!==100) fail('Round 3 was a room of '+lq.of+', Epic carries a thousand to a hundred');
    if(cr.solos.seat && cr.solos.seat!=='fast') fail('Round 3 seated somebody outside Fast Track');
    out.steps.push('qualifier 1 round 3: '+lq.place+' of 100 — '+(cr.solos.seat||'out'));

    // ---- Fast Track: nobody goes home --------------------------------------
    cr.solos={got:'q1r3', seat:'fast'};
    cr.day='2026-10-10'; careerSave();
    await runCareerSoloSeries();
    const lf=cr.log[cr.log.length-1];
    if(!lf || lf.stage!=='fast') fail('Fast Track did not run');
    if(lf.games!==4) fail('Fast Track played '+lf.games+' matches, Epic says 4');
    if(!cr.solos.seat) fail('Fast Track sent somebody home; Epic seats all 100');
    if(lf.place<=8 ? cr.solos.seat!=='final' : cr.solos.seat!=='heats')
      fail('Fast Track seated '+lf.place+' as '+cr.solos.seat);
    out.steps.push('fast track: '+lf.place+' of 100 over 4 matches to '+cr.solos.seat);

    // ---- the Heats: three exits, and the 29 counted among the winless ------
    cr.solos={got:'fast', seat:'heats'};
    cr.day='2026-10-17'; careerSave();
    await runCareerSoloSeries();
    const lh=cr.log[cr.log.length-1];
    if(!lh || lh.stage!=='heats' || lh.of!==100) fail('the heat was not a room of 100');
    if(lh.games!==6) fail('the heat played '+lh.games+' matches, Epic says 6');
    const seat=cr.solos.seat;
    if(seat!=='final' && seat!=='lcqf' && seat!==null && seat!==undefined)
      fail('the heat handed out an unknown seat: '+seat);
    // Виктори — билет, и после него вечер для тебя кончен (stopOnWin с 13.09): такой
    // игрок может стоять и 53-м с одним сыгранным матчем — место ему всё равно дают.
    if(lh.place>50 && seat && !(lh.wins>0 && seat==='final')) fail('a heat place of '+lh.place+' still got a seat');
    if(seat==='lcqf' && (lh.place<36 || lh.place>50))
      fail('the LCQ Final took place '+lh.place+', Epic says 36th-50th');
    out.steps.push('heats: '+lh.place+' of 100 over 6 matches to '+(seat||'out'));

    // ---- LCQ Round 1: an open room, Epic's own seventy through -------------
    cr.solos={got:'heats', seat:null};
    cr.day='2026-10-19'; careerSave();
    if(!careerSoloSeriesCan(careerSoloSeriesOn('2026-10-19'))) fail('the LCQ refused a player knocked out of the heat');
    await runCareerSoloSeries();
    const l1=cr.log[cr.log.length-1];
    if(!l1 || l1.stage!=='lcq1') fail('LCQ Round 1 did not run');
    if(l1.of<=100) fail('LCQ Round 1 was a room of '+l1.of+', it is meant to be the open one');
    if(l1.games!==11) fail('LCQ Round 1 played '+l1.games+' matches, Epic says 11');
    if(cr.solos.seat && cr.solos.seat!=='lcqf') fail('LCQ Round 1 seated somebody outside the LCQ Final');
    out.steps.push('LCQ round 1: '+l1.place+' of '+l1.of+' over 11 matches to '+(cr.solos.seat||'out'));

    // ---- the LCQ Final: a room of 70 ---------------------------------------
    cr.solos={got:'lcq1', seat:'lcqf'};
    cr.day='2026-10-20'; careerSave();
    await runCareerSoloSeries();
    const ll=cr.log[cr.log.length-1];
    if(!ll || ll.stage!=='lcqf') fail('the LCQ Final did not run');
    if(ll.of!==70) fail('the LCQ Final was a room of '+ll.of+', Epic says 70');
    if(ll.games!==5) fail('the LCQ Final played '+ll.games+' matches, Epic says 5');
    out.steps.push('LCQ final: '+ll.place+' of 70 over 5 matches to '+(cr.solos.seat||'out'));

    // ---- the Finals: 12 matches, and the room banks the whole pot ----------
    cr.solos={got:'lcqf', seat:'final'};
    cr.day='2026-10-26'; careerSave();
    const before=Object.keys(careerMoney().rows).reduce((s,k)=>s+careerMoney().rows[k].usd,0);
    await runCareerSoloSeries();
    const lz=cr.log[cr.log.length-1];
    if(!lz || lz.stage!=='final' || lz.of!==100) fail('the final was not a room of 100');
    if(lz.games!==12) fail('the final played '+lz.games+' matches, Epic says 6+6');
    const after=Object.keys(careerMoney().rows).reduce((s,k)=>s+careerMoney().rows[k].usd,0);
    if(after-before!==253500)
      fail('the final banked '+(after-before)+' across the room, the EU pot is 253500');
    if(lz.prize!==solosPrize(lz.place)) fail('the cheque does not match the table');
    out.steps.push('final: '+lz.place+' of 100, cheque '+(lz.prize||0)+' — the room banked the whole pot');

    // ---- played once, and a new season hands the road back -----------------
    if(careerSoloSeriesCan(careerSoloSeriesOn('2026-10-26'))) fail('a played final replays');
    cr.seasonOver=true; careerNewSeason();
    if(CAREER.career.solos) fail('a new season kept FNCS Solos');
    out.steps.push('a stage is played once, and the new season opens the road again');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  // Сентинел склеен из кусков нарочно: --dump-dom печатает и текст самого
  // скрипта, и целая строка "BEGIN" в исходнике ловилась регуляркой раньше
  // настоящего вывода — тогда падение пробы читалось как «сломанный JSON».
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsolos-'));
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
console.log('FNCS Solos 2026 runs its whole road, and pays by region');
