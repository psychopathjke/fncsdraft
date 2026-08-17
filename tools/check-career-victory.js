// Plays a Victory Cup and a Performance Evaluation through the real interface,
// the way check-career-cup plays a divisional cup: writes a save landed on the
// day, opens the hub, presses Play, skips the animation, and checks that a
// result card comes back and that the save moved.
//
// It also checks the scoring against the numbers on Epic's own event page,
// because the two rounds score nothing like each other and nothing else in the
// project would notice if one of them drifted:
//
//   Round 1 — six matches. Victory Royale +7, Top 2 +4, Top 3 +2, then +1 for
//             every tier down to Top 50, awarded cumulatively, so a win is 60
//             and fiftieth is 1. Each elimination +2.
//   Round 2 — three matches, and only a win scores: +100, and $100 in the hand
//             ($200 for a duo).
//
//   node tools/check-career-victory.js
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
  const seed = (div, day, ovr) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeMan', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:ovr, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(ovr, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
  };
  // Press skip as soon as it exists and keep pressing: every stage re-enables it.
  const skipping = () => setInterval(() => {
    const b = document.getElementById('majorSkipBtn');
    if (b && !b.disabled) b.click();
  }, 20);
  const playThrough = async (what) => {
    const play = document.querySelector('#screen-career-hub .ch-play');
    if (!play || play.disabled) fail(what + ': the play button is not usable');
    if ((play.getAttribute('onclick')||'').indexOf('careerPlay') < 0)
      fail(what + ': the button skips the week instead of playing it — ' + play.getAttribute('onclick'));
    const sk = skipping();
    play.click();
    let card = null;
    for (let i = 0; i < 6000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail(what + ': no result card came back');
    return card;
  };

  try{
    // ---- the scoring, against Epic's published table --------------------
    const want = {1:60, 2:53, 3:49, 4:47, 50:1, 51:0};
    const got = {};
    Object.keys(want).forEach(p => { got[p] = victoryR1Points(+p); });
    const wrong = Object.keys(want).filter(p => got[p] !== want[p]);
    if (wrong.length)
      fail('Round 1 scoring is off Epic\\'s table at place ' + wrong[0] +
           ': ' + got[wrong[0]] + ', should be ' + want[wrong[0]]);
    out.steps.push('round 1 points match the event page: 1→60, 2→53, 3→49, 4→47, 50→1, 51→0');
    if (victoryR2Points(1) !== 100 || victoryR2Points(2) !== 0)
      fail('Round 2 should score 100 for a win and nothing else');
    out.steps.push('round 2 scores a win and nothing else');
    if (CC_VICTORY_R1_GAMES !== 6 || CC_VICTORY_R2_GAMES !== 3)
      fail('match counts drifted: ' + CC_VICTORY_R1_GAMES + ' and ' + CC_VICTORY_R2_GAMES + ', should be 6 and 3');
    if (CC_VICTORY_R1_KILL !== 2) fail('an elimination is worth 2 in Round 1');
    out.steps.push('six matches then three, a kill worth two');

    // ---- every day Epic ran one is on the calendar ----------------------
    const days = careerYearDays();
    const listed = CC_VICTORY.filter(v => (days.get(v.day)||[]).some(e => e.kind === 'victory'));
    if (listed.length !== CC_VICTORY.length)
      fail('only ' + listed.length + ' of ' + CC_VICTORY.length + ' Victory Cup days reached the calendar');
    out.steps.push(CC_VICTORY.length + ' Victory Cup days on the calendar, ' +
      CC_VICTORY.filter(v=>v.mode==='duo').length + ' of them duos');

    // ---- a solo lobby is people, not pairs ------------------------------
    seed(4, '2026-03-22', 70);
    careerLoad();
    const solo = careerSoloField(CAREER.career, []);
    if (!solo.every(t => (t.squad||[]).length === 1))
      fail('the solo lobby was built out of pairs');
    if (solo.length !== CAREER_CUP_FIELD - 1)
      fail('the solo lobby holds ' + solo.length + ', should be ' + (CAREER_CUP_FIELD-1));
    out.steps.push('solo lobby: ' + (solo.length+1) + ' players, one card each');

    // ---- play a solo Victory Cup ----------------------------------------
    seed(4, '2026-03-22', 70);
    careerEntry(); ccProbeSeat();
    const next = careerNext();
    if (next.type !== 'victory') fail('22 March is a Solo Victory Cup, the hub says ' + next.type);
    out.steps.push('hub on 22 March: ' + next.title);
    const card = await playThrough('solo Victory Cup');
    out.steps.push('result: ' + card.querySelector('h4').textContent.replace(/\\s+/g,' ').trim());
    card.querySelector('button[onclick*="careerBackToHub"]').click();

    const save = JSON.parse(localStorage.getItem('fncsdraft_career'));
    const row = (save.career.log||[]).slice(-1)[0];
    if (!row || row.kind !== 'victory') fail('the Victory Cup wrote no row to the history');
    if (!row.solo) fail('a solo cup was logged as a duos one');
    if (row.mate) fail('a solo cup logged a partner: ' + row.mate);
    if (row.prize && row.prize % 100) fail('prize money is not a multiple of $100: ' + row.prize);
    out.steps.push('logged: #' + row.place + ' of ' + row.of + ', ' + row.games + ' games, ' +
      row.wins + ' wins, $' + row.prize);
    if (save.career.day !== '2026-03-23') fail('the clock did not move a day: ' + save.career.day);
    out.steps.push('clock moved to ' + save.career.day);
    if ((save.career.earnings||0) !== (row.prize||0))
      fail('prize money did not reach earnings');
    const feed = [...document.querySelectorAll('#chBody .x-post-in p')].map(b=>b.textContent.trim());
    if (!feed.length) fail('the feed is empty after a Victory Cup');
    out.steps.push('feed: ' + feed.slice(0,2).join(' / '));

    // ---- play the duos one, which does seat a partner --------------------
    seed(4, '2026-01-12', 70);
    careerEntry(); ccProbeSeat();
    if (careerNext().type !== 'victory') fail('12 January is a Duos Victory Cup');
    const card2 = await playThrough('duos Victory Cup');
    card2.querySelector('button[onclick*="careerBackToHub"]').click();
    const row2 = JSON.parse(localStorage.getItem('fncsdraft_career')).career.log.slice(-1)[0];
    if (row2.solo) fail('the duos cup was logged as solo');
    if (!row2.mate) fail('the duos cup logged no partner');
    if (row2.prize && row2.prize % 200) fail('a duo win should pay $200 a time: ' + row2.prize);
    out.steps.push('duos: #' + row2.place + ' of ' + row2.of + ' with ' + row2.mate + ', $' + row2.prize);

    // ---- the Performance Evaluation, which had no way in -----------------
    seed(1, '2026-03-05', 88);
    careerEntry(); ccProbeSeat();
    const ev = careerNext();
    if (ev.type !== 'eval') fail('5 March is an evaluation night in Division 1, the hub says ' + ev.type);
    const card3 = await playThrough('Performance Evaluation');
    out.steps.push('evaluation result: ' + card3.querySelector('h4').textContent.replace(/\\s+/g,' ').trim());
    card3.querySelector('button[onclick*="careerBackToHub"]').click();
    const row3 = JSON.parse(localStorage.getItem('fncsdraft_career')).career.log.slice(-1)[0];
    if (!row3 || row3.kind !== 'eval') fail('the evaluation wrote no row to the history');
    out.steps.push('evaluation logged: #' + row3.place + ' of ' + row3.of + ', $' + row3.prize);
    // The evening is spent: the clock moved past the night, and the hub does
    // not offer the same evaluation again — the user played it on a loop once.
    const after = JSON.parse(localStorage.getItem('fncsdraft_career')).career.day;
    if (!(after > '2026-03-05')) fail('the evaluation did not spend its evening — day still ' + after);
    if (careerNext().type === 'eval') fail('the played evaluation is offered again');
    out.steps.push('the evening is spent: day moved to ' + after);

    // ---- and it stays Division 1's -------------------------------------
    seed(4, '2026-03-05', 70);
    careerEntry(); ccProbeSeat();
    if (careerNext().type === 'eval') fail('a Division 4 player was offered the evaluation');
    out.steps.push('below Division 1 the evaluation is not offered');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccvictory-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the Victory Cup and the Performance Evaluation both play');
