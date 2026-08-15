// The Major, stage by stage, through the real interface.
//
// Measured off Tracker's FNCS Major 2 Europe pages:
//   Play-In  Division 1 only ("Reach FNCS Division 1 to unlock this event"),
//            22 matches, a kill worth 2.
//   Heats    5 matches, a kill worth 3, top 10 of a group — and a Victory Royale
//            is worth 944, which is Epic writing "instantly qualified" as a
//            number, so a heat win scores 1,000.
//   LCQ      open to all five divisions, four matches in the Last Chance Lobby,
//            and only a win takes a ticket.
//   Finals   50 duos, 12 matches, a kill worth 4, and Epic's European payout —
//            $120,000 for first, which the app already holds as PRIZE_TABLES.EU.
//
//   node tools/check-career-major.js
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
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  const seed = (div, day, major) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Majorman', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], major:major}, partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
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
  const dayOf = (n, want) => {
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1)) {
      const ev = careerMajorOn(d);
      if (ev && ev.n === n && ev.stage === want) return d;
    }
    return null;
  };

  try{
    // ---- the numbers, against the event pages ---------------------------
    const S = CC_MAJOR_STAGE;
    if (S.playin.games !== 22 || S.playin.kill !== 2) fail('the Play-In is 22 matches at 2 a kill');
    if (S.heats.games !== 5  || S.heats.kill !== 3)  fail('the Heats are 5 matches at 3 a kill');
    if (S.heats.cut !== 10) fail('ten of a group come through the Heats in Europe');
    if (S.lcq.games !== 4) fail('the Last Chance Lobby is four matches');
    if (S.final.games !== 12 || S.final.kill !== 4) fail('the Final is 12 matches at 4 a kill');
    if (majorPoints(1) !== 65 || majorPoints(25) !== 2 || majorPoints(26) !== 0)
      fail('the FNCS ladder pays 65 for a win and 2 at twenty-fifth');
    if (majorHeatPoints(1) !== 1000) fail('a heat win is 944 + 56 = 1000, got ' + majorHeatPoints(1));
    if (majorHeatPoints(2) !== majorPoints(2)) fail('only the win differs in the Heats');
    out.steps.push('stages: 22/2, 5/3 top 10, lobby of 4, final 12/4 — heat win 1000, everything else 65');
    if (majorPrize(1) !== 120000 || majorPrize(50) !== 1000 || majorPrize(51) !== 0)
      fail('the Final pays $120,000 first and $1,000 at fiftieth');
    out.steps.push('final payout: $120,000 first, $1,000 fiftieth, nothing after');

    // ---- who may enter what ---------------------------------------------
    const d = {playin:dayOf(1,'playin'), heats:dayOf(1,'heats'), lcq:dayOf(1,'lcq'), final:dayOf(1,'final')};
    if (!d.playin || !d.heats || !d.lcq || !d.final) fail('Major 1 is missing a stage: ' + JSON.stringify(d));
    out.steps.push('Major 1: play-in ' + d.playin + ', heats ' + d.heats + ', lcq ' + d.lcq + ', final ' + d.final);

    // Asked of the Major rule itself rather than of the day's headline: 6 April
    // is also a divisional cup Monday, so a Division 3 player's Play button is
    // legitimately live that day — for the cup, not for the Major.
    const can = (div, day, major) => { seed(div, day, major); return careerMajorCan(careerMajorOn(day)); };
    if (can(3, d.playin)) fail('a Division 3 player was let into the Major Play-In');
    if (!can(1, d.playin)) fail('Division 1 cannot enter its own Play-In');
    out.steps.push('play-in: Division 1 only');
    if (!can(4, d.lcq))
      fail('the Last Chance is open to all five divisions and a Division 4 player was refused');
    out.steps.push('last chance: open to Division 4');
    if (can(1, d.heats)) fail('the Heats opened to somebody who never played the Play-In');
    if (!can(1, d.heats, {n:1, got:'playin', ticket:false})) fail('the Play-In did not open the Heats');
    if (can(1, d.final, {n:1, got:'heats', ticket:false})) fail('the Final opened to a team with no ticket');
    if (!can(1, d.final, {n:1, got:'heats', ticket:true})) fail('a ticket did not open the Final');
    out.steps.push('heats need the play-in, the final needs a ticket');
    if (can(1, d.heats, {n:1, got:'heats', ticket:true})) fail('a stage already played was offered again');
    if (can(1, d.heats, {n:2, got:'playin', ticket:true})) fail('Major 2 progress opened Major 1\\'s heats');
    out.steps.push('a stage is played once, and the chain is per Major');

    // ---- play the Play-In ------------------------------------------------
    seed(1, d.playin, undefined);
    out.steps.push('play-in: ' + await playThrough('the Play-In'));
    const s1 = save();
    const r1 = (s1.log||[]).slice(-1)[0];
    if (!r1 || r1.kind !== 'major' || r1.stage !== 'playin') fail('the Play-In wrote no row');
    if (r1.games !== 22) fail('the Play-In logged ' + r1.games + ' games');
    if (!s1.major || s1.major.got !== 'playin') fail('the Play-In recorded no progress');
    out.steps.push('logged #' + r1.place + ' of ' + r1.of + ', ' + r1.games + ' games' +
                   (r1.passed ? ', through to the Heats' : ', out'));

    // ---- the Last Chance, from Division 4 --------------------------------
    seed(4, d.lcq, undefined);
    out.steps.push('last chance: ' + await playThrough('the Last Chance'));
    const s2 = save();
    const r2 = (s2.log||[]).slice(-1)[0];
    if (r2.stage !== 'lcq') fail('the Last Chance wrote the wrong row');
    if (r2.passed !== !!(s2.major && s2.major.ticket))
      fail('the ticket and the row disagree about whether it was won');
    out.steps.push('division 4 in the lobby: ' + (s2.major && s2.major.ticket
      ? 'won a match — ticket to the Major Finals' : 'no win, no ticket') +
      ' (' + r2.wins + ' wins)');

    // ---- and the Final ---------------------------------------------------
    seed(1, d.final, {n:1, got:'heats', ticket:true});
    out.steps.push('final: ' + await playThrough('the Major Final'));
    const s3 = save();
    const r3 = (s3.log||[]).slice(-1)[0];
    if (r3.stage !== 'final') fail('the Final wrote the wrong row');
    if (r3.of !== 50) fail('the Final seated ' + r3.of + ' duos, should be 50');
    if (r3.games !== 12) fail('the Final ran ' + r3.games + ' games');
    if (r3.prize !== majorPrize(r3.place))
      fail('#' + r3.place + ' was paid ' + r3.prize + ', the table says ' + majorPrize(r3.place));
    if ((s3.earnings||0) !== r3.prize) fail('the Major prize did not reach earnings');
    out.steps.push('final #' + r3.place + ' of 50 — $' + r3.prize.toLocaleString('en-US') +
                   ', earnings $' + (s3.earnings||0).toLocaleString('en-US'));
    const feed = [...document.querySelectorAll('#chBody .x-post-in p')].map(b=>b.textContent.trim());
    if (!feed.length) fail('the feed is empty after a Major Final');
    out.steps.push('feed: ' + feed.slice(0,2).join(' / '));
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmajor-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=420000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the Major plays, and the Last Chance really is open to everybody');
