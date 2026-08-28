// Division 1's Weekly Final: the first thing in the mode that pays.
//
// Checks the scoring and the payout against Tracker's Division 1 Europe page —
// fifty teams, six matches, a Victory Royale worth 9, second through fifth 4
// apiece, sixth through twenty-fifth 2, cumulative so a win is 65, and an
// elimination worth 4; $10,000 for first down to $400 at fortieth and nothing
// after — then plays one: clears the week's cut in a Division 1 cup, walks to
// Saturday, and presses Play.
//
//   node tools/check-career-weekly-final.js
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
  const seed = (day, wfMonday) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Finalist', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:95, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], wf: wfMonday ? {monday:wfMonday} : undefined},
      partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(95, 'roleIGL');
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
    for (let i = 0; i < 8000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail(what + ': no result card came back');
    const head = card.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    const body = card.querySelector('.stage-detail').textContent.replace(/\\s+/g,' ').trim();
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    return head + ' — ' + body;
  };
  const save = () => JSON.parse(localStorage.getItem('fncsdraft_career')).career;

  try{
    // ---- scoring, against the event page ---------------------------------
    const want = {1:65, 2:56, 5:44, 6:40, 25:2, 26:0};
    const bad = Object.keys(want).filter(p => wfPoints(+p) !== want[p]);
    if (bad.length) fail('the final scores ' + wfPoints(+bad[0]) + ' at place ' + bad[0] +
                         ', should be ' + want[bad[0]]);
    if (CC_WF_GAMES !== 6) fail('the final is six matches');
    if (CC_WF_KILL !== 4) fail('an elimination in the final is worth 4');
    out.steps.push('scoring: win 65, second 56, fifth 44, sixth 40, twenty-fifth 2, nothing after — 6 games, kill 4');

    // ---- the payout, rank by rank ----------------------------------------
    const pay = {1:10000, 2:5000, 3:3000, 4:2000, 5:1500, 6:1000, 7:1000,
                 8:800, 10:800, 11:600, 20:600, 21:400, 40:400, 41:0, 50:0};
    const wrongPay = Object.keys(pay).filter(r => wfPrize(+r) !== pay[r]);
    if (wrongPay.length) fail('rank ' + wrongPay[0] + ' pays ' + wfPrize(+wrongPay[0]) +
                              ', Epic paid ' + pay[wrongPay[0]]);
    out.steps.push('payout matches: $10,000 first, $600 through twentieth, $400 through fortieth, nothing after');

    // ---- the final is on a Saturday, three times a year it is not --------
    // Epic's own schedule pages, per week rather than per rhythm: twelve of the
    // fifteen are Saturdays, the first of the year is Sunday 8 February, S40's
    // second week ends Thursday 2 April and the last of all is Friday 17 July.
    const days = careerYearDays();
    const finals = [];
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1))
      if ((days.get(d)||[]).some(e => e.kind === 'final')) finals.push(d);
    if (!finals.length) fail('the year holds no Weekly Final at all');
    const notSat = finals.filter(d => new Date(d+'T00:00:00Z').getUTCDay() !== 6);
    if (notSat.join() !== '2026-02-08,2026-04-02,2026-07-17')
      fail('the finals off a Saturday should be 8 Feb, 2 Apr and 17 Jul, got ' + notSat.join(', '));
    out.steps.push(finals.length + ' Weekly Finals, first ' + finals[0] +
                   ', and ' + notSat.length + ' of them off a Saturday as measured');

    // ---- without the week's cut it is not yours --------------------------
    seed(finals[0], null);
    if (careerCanPlay(careerNext())) fail('the final opened to a team that missed the week\\'s cut');
    seed(finals[0], careerMonday(ccAddDays(finals[0], -7)));
    if (careerCanPlay(careerNext())) fail('last week\\'s cut opened this week\\'s final');
    out.steps.push('locked without this week\\'s top fifty, and last week\\'s does not count');

    // ---- clearing the cut in a cup earns it ------------------------------
    let cupDay = null;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO && !cupDay; d = ccAddDays(d,1))
      if ((days.get(d)||[]).some(e => e.kind === 'cup')) cupDay = d;
    // Division 1's Monday banks its points and settles nothing; Tuesday adds the
    // two together and cuts. Both have to be played to earn Saturday.
    seed(cupDay, null);
    if (careerNext().type !== 'cup') fail(cupDay + ' should be a cup day');
    out.steps.push('session 1: ' + await playThrough('the Monday session'));
    const banked = save();
    if (!banked.d1) fail('the Monday session banked nothing');
    if (banked.day !== ccAddDays(cupDay, 1)) fail('the clock did not reach Tuesday');
    careerEntry(); ccProbeSeat();
    if (careerNext().type !== 'cup') fail('Tuesday should be the second session');
    out.steps.push('session 2: ' + await playThrough('the Tuesday session'));
    const afterCup = save();
    if (afterCup.d1) fail('the banked points were not cleared after the table was drawn');
    const cupRow = (afterCup.log||[]).slice(-1)[0];
    if (cupRow.passed && !afterCup.wf) fail('clearing the cut in Division 1 earned no seat');
    if (!cupRow.passed && afterCup.wf) fail('missing the cut earned a seat anyway');
    if (afterCup.division !== 1) fail('Division 1 promoted itself to ' + afterCup.division);
    out.steps.push('cup #' + cupRow.place + ' of ' + cupRow.of +
                   (afterCup.wf ? ' — seat at Saturday earned' : ' — no seat'));

    // ---- and play it -----------------------------------------------------
    seed(finals[0], careerMonday(finals[0]));
    if (careerNext().type !== 'final') fail(finals[0] + ' should be a Weekly Final');
    out.steps.push('final: ' + await playThrough('the Weekly Final'));
    const s2 = save();
    const row = (s2.log||[]).slice(-1)[0];
    if (!row || row.kind !== 'final') fail('the final wrote no row to the history');
    if (row.of !== 50) fail('the final seated ' + row.of + ' teams, should be 50');
    if (row.games !== 6) fail('the final ran ' + row.games + ' games, should be 6');
    // Epic pays a team and a duo is two people, so a career takes half.
    if (row.prize !== Math.round(wfPrize(row.place)/2))
      fail('#' + row.place + ' was paid ' + row.prize + ', half the table says ' + Math.round(wfPrize(row.place)/2));
    if ((s2.earnings||0) !== row.prize) fail('prize money did not reach earnings');
    if ((s2.balance||0) !== row.prize) fail('prize money did not reach the balance');
    if (s2.wf) fail('the seat was not spent');
    out.steps.push('final #' + row.place + ' of ' + row.of + ' — $' + row.prize +
                   ', earnings $' + s2.earnings + ', seat spent');
    // The table pays in public: the last standings drawn carry a money column
    // and the winner's cell is the table's own top prize.
    const tables = [...document.querySelectorAll('#majorStages .lobby-table')];
    const last = tables[tables.length - 1];
    const tableHTML = last ? last.innerHTML : '';
    if (tableHTML.indexOf(L().prizeHeader) < 0) fail('the standings drew no prize column');
    if (tableHTML.indexOf(fmtMoney(wfPrize(1))) < 0)
      fail('the winner row does not show ' + fmtMoney(wfPrize(1)));
    out.steps.push('the standings show the money, top prize ' + fmtMoney(wfPrize(1)));
    const feed = [...document.querySelectorAll('#chBody .x-post-in p')].map(b=>b.textContent.trim());
    if (!feed.length) fail('the feed is empty after a Weekly Final');
    out.steps.push('feed: ' + feed.slice(0,2).join(' / '));

    // ---- and nobody below Division 1 ever sees it ------------------------
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Lower', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:70, role:'roleIGL', attrs:ccRookieAttrs(70,'roleIGL'),
        ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:finals[0], division:3, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]}, partner:null}));
    careerEntry(); ccProbeSeat();
    if (careerNext().type === 'final') fail('a Division 3 player was shown the Weekly Final');
    out.steps.push('below Division 1 the final is not on the calendar');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccwf-'));
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
console.log('the Weekly Final pays, and only to the fifty who earned it');
