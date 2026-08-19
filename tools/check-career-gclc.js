// The Global Championship Last Chance — the widest door in the year and, until
// now, the only event in it nobody could enter at all.
//
// Measured off Tracker's own windows:
//   Round 1  3 and 7 August    10 matches, a kill worth 1, top 1,000 of 16,922
//   Round 2  4 and 8 August     9 matches, a kill worth 1, top 300 of 1,255
//   Round 3  5 and 9 August    11 matches, a kill worth 2, top 25 of 299
//   Finals   14 August          6 matches, a kill worth 4, fifty teams
// Two qualifiers of twenty-five is exactly the fifty in the Final.
//
//   node tools/check-career-gclc.js
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
  const seed = (div, day, gclc) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Lastchance', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], gclc:gclc}, partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(88, 'roleIGL');
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
    // ---- the seven days are on the calendar ------------------------------
    const days = careerYearDays();
    const missing = CC_GCLC.filter(v => !(days.get(v.day)||[]).some(e => e.kind === 'gc'));
    if (missing.length) fail(missing.length + ' Last Chance days never reached the calendar');
    if (CC_GCLC.length !== 7) fail('the event is seven days, the table holds ' + CC_GCLC.length);
    out.steps.push('seven days: ' + CC_GCLC.map(v => v.day).join(', '));
    // and the old two-day row is gone
    if (CAREER_YEAR.some(r => r[2] === 'GlobalChampionshipLastChance'))
      fail('the old two-day year row is still there and will double the days');
    out.steps.push('the old two-day row is gone');

    // ---- the format ------------------------------------------------------
    const R = CC_GCLC_ROUND;
    if (R[1].games !== 10 || R[1].kill !== 1) fail('Round 1 is ten matches at 1 a kill');
    if (R[2].games !== 9  || R[2].kill !== 1) fail('Round 2 is nine matches at 1 a kill');
    if (R[3].games !== 11 || R[3].kill !== 2) fail('Round 3 is eleven matches at 2 a kill');
    if (R[3].cut !== 25) fail('twenty-five come out of Round 3');
    if (CC_GCLC_FINAL.games !== 6 || CC_GCLC_FINAL.kill !== 4 || CC_GCLC_FINAL.teams !== 50)
      fail('the Final is fifty teams over six matches at 4 a kill');
    if (R[3].cut * 2 !== CC_GCLC_FINAL.teams)
      fail('two qualifiers of ' + R[3].cut + ' should fill a Final of ' + CC_GCLC_FINAL.teams);
    out.steps.push('10/1, 9/1, 11/2 then a final of 6/4 — and 25 twice is the fifty in it');
    const pay = {1:40000, 2:25000, 5:12000, 20:1200, 21:1000, 31:600, 41:400, 50:400, 51:0};
    const bad = Object.keys(pay).filter(r => gclcPrize(+r) !== pay[r]);
    if (bad.length) fail('place ' + bad[0] + ' pays ' + gclcPrize(+bad[0]) + ', Epic paid ' + pay[bad[0]]);
    out.steps.push('purse read back against Tracker: $40,000 first, $400 at fiftieth');

    // ---- who starts where -------------------------------------------------
    const can = (div, day, g) => { seed(div, day, g); return careerGclcCan(careerGclcOn(day)); };
    if (!can(3, '2026-08-03')) fail('Round 1 is open to everybody and Division 3 was refused');
    if (can(1, '2026-08-03')) fail('Division 1 should skip Round 1');
    if (!can(1, '2026-08-04')) fail('Division 1 should start at Round 2');
    if (can(3, '2026-08-04')) fail('Round 2 opened to somebody who never played Round 1');
    if (!can(3, '2026-08-04', {q:1, round:1})) fail('clearing Round 1 did not open Round 2');
    if (can(3, '2026-08-05', {q:1, round:1})) fail('Round 3 opened straight off Round 1');
    if (!can(3, '2026-08-05', {q:1, round:2})) fail('clearing Round 2 did not open Round 3');
    out.steps.push('Round 1 for everybody but Division 1, which enters at Round 2');
    // a missed qualifier leaves the other one open, from the start
    if (!can(3, '2026-08-07', {q:1, round:0})) fail('the second qualifier did not reopen Round 1');
    if (can(3, '2026-08-08', {q:1, round:2}))
      fail('progress in qualifier 1 carried into qualifier 2 — they are separate runs');
    out.steps.push('the second qualifier starts again from Round 1, carrying nothing');
    // and a place in the Final closes the qualifiers
    if (can(3, '2026-08-07', {q:1, round:3, through:true}))
      fail('a team already in the Final was sent back to a qualifier');
    if (!can(3, '2026-08-14', {q:1, round:3, through:true})) fail('a place in the Final did not open it');
    if (can(3, '2026-08-14', {q:1, round:3})) fail('the Final opened without a place in it');
    out.steps.push('a place in the Final ends the qualifying and opens the day');

    // ---- play a round and the final --------------------------------------
    seed(3, '2026-08-03', undefined);
    if (careerNext().type !== 'gc') fail('3 August should be a Last Chance day');
    out.steps.push('round 1: ' + await playThrough('Round 1'));
    const s1 = save();
    const r1 = (s1.log||[]).slice(-1)[0];
    if (r1.kind !== 'gclc' || r1.stage !== 'q1r1') fail('Round 1 wrote the wrong row');
    if (r1.games !== 10) fail('Round 1 logged ' + r1.games + ' games');
    out.steps.push('logged #' + r1.place + ' of ' + r1.of + ', ' + r1.games + ' games' +
      (r1.passed ? ', through' : ', out'));

    seed(3, '2026-08-14', {q:2, round:3, through:true});
    out.steps.push('final: ' + await playThrough('the Last Chance Finals'));
    const s2 = save();
    const r2 = (s2.log||[]).slice(-1)[0];
    if (r2.stage !== 'final') fail('the Final wrote the wrong row');
    if (r2.of !== 50) fail('the Final seated ' + r2.of + ', should be 50');
    if (r2.games !== 6) fail('the Final ran ' + r2.games + ' games');
    // Epic pays a team and a duo is two people, so a career takes half.
    if (r2.prize !== Math.round(gclcPrize(r2.place)/2))
      fail('#' + r2.place + ' was paid ' + r2.prize + ', half the table says ' + Math.round(gclcPrize(r2.place)/2));
    if ((s2.earnings||0) !== r2.prize) fail('the money did not reach earnings');
    out.steps.push('final #' + r2.place + ' of 50 — $' + r2.prize.toLocaleString('en-US'));

    /* What the Final is for, which is not the money.

       Europe's table pays all fifty places, so "was anybody paid" was true for
       everybody and the Final called every finish a pass — green card, "through"
       on the result card, passed in the log — while the seat itself was never
       mentioned. A player read that as qualifying and then found Antwerp locked.
       The row is the seat now, and the calendar has to agree with it. */
    const slots = ccGcSlots(GCLC_GC_SLOTS);
    const wonSeat = r2.place <= slots;
    if (r2.passed !== wonSeat)
      fail('#' + r2.place + ' of ' + slots + ' seats was logged ' +
           (r2.passed ? 'passed' : 'failed'));
    if (!!ccGlobalsSeat() !== wonSeat)
      fail('the Final said ' + (wonSeat?'seat':'no seat') + ' and the calendar disagrees');
    out.steps.push(wonSeat
      ? 'top ' + slots + ' — the seat, and Antwerp opens'
      : 'paid but no seat, and the row says so rather than calling it a pass');

    // ---- and Paris still works, on the same kind --------------------------
    const parisRow = CAREER_YEAR.find(r => r[2] === 'ReloadChampionshipParis');
    seed(1, parisRow[0], undefined);
    CAREER.career.ewc = [{series:1, place:1}];
    if (!careerCanPlayKind('gc')) fail('Paris stopped being enterable when the Last Chance moved in');
    if (careerGclcOn(parisRow[0])) fail('Paris was mistaken for a Last Chance day');
    out.steps.push('Paris and the Last Chance share the kind and do not collide');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccgclc-'));
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
console.log('the Last Chance plays, both qualifiers and the final');
