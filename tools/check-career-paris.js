// The Reload Championship in Paris: where the Reload circuit has been sending
// people all year, and the first thing in this app scored on match point.
//
// Format off Liquipedia, in the Reload spec: 40 teams in two groups of twenty,
// ten maps a pool, top 7 straight to the Finals and 8th-17th down to Survival;
// Survival is ten maps and six through; the Finals are twenty teams and the
// first past 350 who then wins a game is champion, fifteen games at most.
//
//   node tools/check-career-paris.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // A final asks the player where to land. A harness is the player: answer it
  // the moment a picker appears, always the first zone, so the run is the same
  // every time. Without this a probe waits forever on a click nobody makes.
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"); if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } } const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  // The seat is the player's to fill now: somebody free wrote, and the button
  // under their message seats them. Same door a player goes through.
  const ccProbeSeat = () => {
    if (careerPartnerCard()) return;
    const s = careerDms().find(x => x.state === 'offer' && !x.who.org && !x.who.brand);
    if (s) { careerDmAccept(s.id); careerRenderHub('centre'); }
  };
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  const seed = (day, ewc, rc) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Parisian', age:21, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:97, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], ewc:ewc, rc:rc}, partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(97, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry(); ccProbeSeat();
  };
  const playThrough = async (what) => {
    const play = document.querySelector('#screen-career-hub .ch-play');
    if (!play) fail(what + ': no button at all');
    if ((play.getAttribute('onclick')||'').indexOf('careerPlay') < 0)
      fail(what + ': the button skips instead of playing');
    const sk = setInterval(() => {
      const b = document.getElementById('majorSkipBtn');
      if (b && !b.disabled) b.click();
    }, 20);
    play.click();
    let card = null;
    for (let i = 0; i < 12000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail(what + ': no result card came back');
    const head = card.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const save = () => JSON.parse(localStorage.getItem('fncsdraft_career')).career;

  try{
    // ---- the format and the purse ---------------------------------------
    if (CC_RC_GROUP.teams !== 20 || CC_RC_GROUP.games !== 10 || CC_RC_GROUP.direct !== 7 || CC_RC_GROUP.drop !== 17)
      fail('a group is twenty teams over ten maps, seven through and seventeenth the last to survive');
    if (CC_RC_SURV.games !== 10 || CC_RC_SURV.cut !== 6) fail('Survival is ten maps and six through');
    if (CC_RC_FINAL.games !== 15 || CC_RC_FINAL.line !== 350) fail('the Finals are match point at 350, fifteen maps');
    out.steps.push('format: groups of 20 over 10, top 7 through and 8-17 to Survival, final match point 350');
    const pay = {1:260000, 2:150000, 10:24000, 15:15000, 20:10000, 30:5000, 34:3000, 40:2000, 41:0};
    const bad = Object.keys(pay).filter(r => rcPrize(+r) !== pay[r]);
    if (bad.length) fail('place ' + bad[0] + ' pays ' + rcPrize(+bad[0]) + ', published ' + pay[bad[0]]);
    let total = 0; for (let i=1;i<=40;i++) total += rcPrize(i);
    out.steps.push('purse: $260,000 first down to $2,000 fortieth, $' + total.toLocaleString('en-US') + ' across the forty');

    // ---- match point, on a log built by hand -----------------------------
    const mk = (name, pts) => ({name:name, stagePts:pts.reduce((s,p)=>s+p.pts,0), stageLog:pts});
    const g = (place, pts) => ({place:place, pts:pts});
    // A is on 360 after two games and wins the third: the tournament ends there.
    const A = mk('A', [g(1,200), g(1,160), g(1,200), g(1,200)]);
    const B = mk('B', [g(2,50),  g(2,50),  g(2,50),  g(1,900)]);
    const mp = rcMatchPoint([A,B], 350);
    if (mp.champ !== A) fail('match point crowned the wrong team');
    if (mp.games !== 3) fail('the run should have ended at game 3, got ' + mp.games);
    const bScore = mp.score.find(x=>x.team===B).pts;
    if (bScore !== 150) fail('B should be read at 150, as it stood at game 3, got ' + bScore);
    out.steps.push('match point: ends on game 3, and the fourth game never counts');
    // Nobody past the line: the run goes the distance.
    const C = mk('C', [g(5,10), g(5,10)]);
    const D = mk('D', [g(1,60), g(1,60)]);
    const mp2 = rcMatchPoint([C,D], 350);
    if (mp2.champ) fail('a win under the line crowned somebody');
    if (mp2.games !== 2) fail('with no champion the run is every game');
    out.steps.push('no match point: the run goes the distance and nobody is crowned');

    // ---- who gets to Paris -----------------------------------------------
    const row = CAREER_YEAR.find(r => r[2] === 'ReloadChampionshipParis');
    const d0 = row[0], d1 = ccAddDays(d0,1), d2 = ccAddDays(d0,2);
    if (!careerRcOn(d0) || careerRcOn(d0).stage !== 'group') fail('day one of Paris is not the group stage');
    if (careerRcOn(d2).stage !== 'final') fail('day three of Paris is not the final');
    out.steps.push('Paris: group ' + d0 + ', survival ' + d1 + ', final ' + d2);
    seed(d0, [], undefined);
    if (careerRcCan(careerRcOn(d0))) fail('somebody with no seat got into Paris');
    seed(d0, [{series:1, place:2}], undefined);
    if (!careerRcCan(careerRcOn(d0))) fail('a seat from a Reload final did not open Paris');
    out.steps.push('a seat is the entry, and only a Reload final hands one out');
    seed(d1, [{series:1, place:2}], {got:'group', ticket:true, dropped:false});
    if (careerRcCan(careerRcOn(d1))) fail('a team already through was sent to Survival');
    seed(d1, [{series:1, place:2}], {got:'group', ticket:false, dropped:true});
    if (!careerRcCan(careerRcOn(d1))) fail('a dropped team could not enter Survival');
    seed(d2, [{series:1, place:2}], {got:'survival', ticket:false});
    if (careerRcCan(careerRcOn(d2))) fail('the final opened without a ticket');
    out.steps.push('survival is for the dropped, the final is for the ticketed');

    // ---- play the group and the final ------------------------------------
    seed(d0, [{series:1, place:1}], undefined);
    out.steps.push('group: ' + await playThrough('the group stage'));
    const s1 = save();
    const r1 = (s1.log||[]).slice(-1)[0];
    if (r1.kind !== 'rc' || r1.stage !== 'group') fail('the group stage wrote no row');
    if (r1.of !== 20) fail('the group seated ' + r1.of + ', should be 20');
    if (r1.games !== 10) fail('the group ran ' + r1.games + ' maps');
    out.steps.push('group #' + r1.place + ' of 20 — ' +
      (s1.rc.ticket ? 'straight to the final' : s1.rc.dropped ? 'down to Survival' : 'out'));

    seed(d2, [{series:1, place:1}], {got:'survival', ticket:true});
    out.steps.push('final: ' + await playThrough('the final'));
    const s2 = save();
    const r2 = (s2.log||[]).slice(-1)[0];
    if (r2.stage !== 'final') fail('the final wrote the wrong row');
    if (r2.games > 15) fail('the final ran ' + r2.games + ' maps, fifteen is the most');
    // Epic pays a team and a duo is two people, so a career takes half.
    if (r2.prize !== Math.round(rcPrize(r2.place)/2))
      fail('#' + r2.place + ' was paid ' + r2.prize + ', half the table says ' + Math.round(rcPrize(r2.place)/2));
    if ((s2.earnings||0) !== r2.prize) fail('Paris money did not reach earnings');
    out.steps.push('final #' + r2.place + ' of 20 over ' + r2.games + ' maps — $' +
      r2.prize.toLocaleString('en-US'));
    const feed = [...document.querySelectorAll('#chBody .x-post-in p')].map(b=>b.textContent.trim());
    if (!feed.length) fail('the feed is empty after Paris');
    out.steps.push('feed: ' + feed.slice(0,1).join(' / '));
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccparis-'));
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
console.log('Paris plays, and match point stops the run where it should');
