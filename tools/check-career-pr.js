// Power Rankings, against Epic's own published description of them.
//
// The page this is checked against is
// fortnite.com/competitive/power-rankings-information, and the three rows that
// pin the whole model down are its own worked example: a Division 3 cup of
// 1,000 duos in a field rated about 20,000 rates 23,000 for 100th, about 20,000
// for 500th and 17,000 for 900th. If the divisional anchors or the spread ever
// move, those three stop landing and this fails.
//
//   node tools/check-career-pr.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    // A career has to exist for ccPrAge to know what day it is.
    CAREER = {player:{ovr:70}, career:{season:1, day:'2026-08-01', division:3, log:[]}, partner:null};
    const ev = (o) => Object.assign({season:1, day:'2026-08-01', div:3, place:1, of:150}, o);

    // ---- Epic's worked example -----------------------------------------
    const want = [[100, 23000], [500, 20000], [900, 17000]];
    for (const [place, target] of want) {
      const got = ccEventPR(ev({div:3, place:place, of:1000}));
      if (Math.abs(got - target) > 50)
        fail(place + 'th of 1,000 in a Division 3 field should rate ' + target + ', rates ' + got);
    }
    out.steps.push('Epic\\'s own example lands: 100th 23,000, 500th 20,000, 900th 17,000 in a Division 3 cup');

    // The anchors themselves: Division 1 is the measured leaderboard, Division 3
    // is Epic's example, and a mid-table finish rates the field it played.
    const mid = d => ccEventPR(ev({div:d, place:500, of:999}));
    if (Math.abs(mid(1) - 33658) > 60) fail('a mid finish in Division 1 should rate the measured 33,658, rates ' + mid(1));
    if (Math.abs(mid(3) - 20000) > 60) fail('a mid finish in Division 3 should rate 20,000, rates ' + mid(3));
    out.steps.push('the anchors hold: Division 1 rates ' + mid(1) + ', Division 3 ' + mid(3) +
                   ', Division 5 ' + mid(5));

    // ---- the event weights ---------------------------------------------
    // Epic's table, read back through this mode's own event kinds.
    const w = [
      [{}, 1.0, 'a divisional cup'],
      [{kind:'victory'}, 1.0, 'a Victory Cup'],
      [{kind:'eval'}, 1.0, 'the Performance Evaluation, which Epic does not list'],
      [{kind:'final'}, 1.2, 'a Division 1 Weekly Final'],
      [{kind:'reload', stage:'open'}, 1.0, 'a Reload Opens'],
      [{kind:'reload', stage:'heat'}, 1.0, 'a Reload Heat'],
      [{kind:'reload', stage:'final'}, 1.2, 'a Reload qualifier Final'],
      [{kind:'rc'}, 1.4, 'the Reload Championship'],
      [{kind:'major', stage:'playin'}, 1.0, 'a Major Play-In'],
      [{kind:'major', stage:'heats'}, 1.2, 'a Major Heat'],
      [{kind:'major', stage:'final'}, 1.4, 'a Major Final'],
      [{kind:'gclc'}, 1.2, 'the Global Championship Last Chance']
    ];
    for (const [e, mult, what] of w) {
      const got = ccPrWeight(ev(e));
      if (Math.abs(got - mult) > 1e-9) fail(what + ' should weigh x' + mult + ', weighs x' + got);
    }
    out.steps.push('all ' + w.length + ' event weights match Epic\\'s table');

    // A Major is rated against the region, not against the division the player
    // walked in from: the same placement is worth more there than in a Division
    // 5 cup, which is the point of the weighting.
    const fromD5 = ccEventPR(ev({div:5, place:50, of:100, kind:'major', stage:'final'}));
    const plainD5 = ccEventPR(ev({div:5, place:50, of:100}));
    if (!(fromD5 > plainD5 * 2))
      fail('a Major Final out of Division 5 rates ' + fromD5 + ' against a Division 5 cup\\'s ' + plainD5);
    out.steps.push('a Major is rated against the region: ' + fromD5 + ' where the same finish in a Division 5 cup is ' + plainD5);

    // And nothing rates past the top of Epic's own table, however the weight and
    // the field stack up.
    const huge = ccEventPR(ev({div:1, place:1, of:100, kind:'rc'}));
    if (huge !== CC_PR_CAP) fail('winning the Reload Championship rates ' + huge + ', past the ' + CC_PR_CAP + ' ceiling');
    out.steps.push('nothing rates past ' + CC_PR_CAP + ', the top of Epic\\'s own best-20 table');

    // ---- decay ----------------------------------------------------------
    const dec = [[0,1],[180,1],[450,0.5],[720,0],[900,0]];
    for (const [age, f] of dec) {
      const got = ccPrDecay(age);
      if (Math.abs(got - f) > 0.001) fail('a result ' + age + ' days old should keep ' + f + ', keeps ' + got);
    }
    out.steps.push('decay holds to 180 days, is half gone at 450 and nothing at 720');

    // ---- you cannot lose PR by playing — ever ----------------------------
    // Epic's page promises it, and the twenty slots are what make it hold for
    // a young career too: a weak sixth result fills an empty slot and adds.
    // The averaging this replaced broke exactly here — a bad cup pulled every
    // under-twenty career down.
    const young = [];
    for (let i = 0; i < 5; i++) young.push(ev({place: 20, of:150, day:'2026-03-01'}));
    const youngBefore = ccPrTable(young).pr;
    young.push(ev({place: 149, of:150, day:'2026-03-02'}));
    const youngAfter = ccPrTable(young).pr;
    if (!(youngAfter > youngBefore))
      fail('a weak result lowered a five-result career: ' + youngBefore + ' -> ' + youngAfter);
    out.steps.push('a weak sixth result still adds: ' + youngBefore + ' -> ' + youngAfter);

    // ---- the best twenty -------------------------------------------------
    // Twenty-one results, the last of them the worst: it must not count, and
    // adding it must not move the rating at all.
    const log = [];
    for (let i = 0; i < 20; i++) log.push(ev({place: 10 + i, of:150, day:'2026-03-01'}));
    const before = ccPrTable(log).pr;
    const worst = ev({place: 149, of:150, day:'2026-03-02'});
    log.push(worst);
    const after = ccPrTable(log);
    if (after.pr !== before) fail('a twenty-first, weaker result moved the rating ' + before + ' -> ' + after.pr);
    if (after.counted.has(worst)) fail('the weakest of twenty-one results is being counted');
    if (after.counted.size !== 20) fail('the counted set is ' + after.counted.size + ' results, not 20');
    out.steps.push('twenty-one results: the weakest is dropped and the rating does not move (' + before + ')');

    // And a stronger one does replace the weakest.
    const strong = ev({place:1, of:150, day:'2026-03-03'});
    log.push(strong);
    const grown = ccPrTable(log);
    if (!(grown.pr > before)) fail('a win did not raise the rating: ' + before + ' -> ' + grown.pr);
    if (!grown.counted.has(strong)) fail('a win is not in the best twenty');
    out.steps.push('and a win replaces the weakest of them: ' + before + ' -> ' + grown.pr);

    // ---- an old career year fades ----------------------------------------
    CAREER.career.season = 2;
    const old = ccPrTable([ev({place:1, of:150, season:1, day:'2026-03-01'})]);
    const now = ccPrTable([ev({place:1, of:150, season:2, day:'2026-03-01'})]);
    if (!(old.pr > 0 && old.pr < now.pr))
      fail('a result a career year old should have faded, reads ' + old.pr + ' against ' + now.pr);
    CAREER.career.season = 3;
    const older = ccPrTable([ev({place:1, of:150, season:1, day:'2026-03-01'})]);
    if (older.pr !== 0) fail('a result two career years old is past 720 days and should be gone, reads ' + older.pr);
    out.steps.push('a win a year ago has faded to ' + old.pr + ' from ' + now.pr + ', and two years ago to nothing');
    CAREER.career.season = 1;

    // ---- and nothing rates without a field --------------------------------
    if (ccEventPR(ev({of:1})) !== null) fail('a one-team event rated something');
    out.steps.push('an event with no field to beat rates nothing');

    // ---- the board -------------------------------------------------------
    // Every event rates its whole field, so there is a standing to stand in,
    // and the player's row on it has to be the same number the History tab
    // prints: same events, same ratings, same arithmetic.
    CAREER.career.pr = null; CAREER.career.log = [];
    const played = [];
    const play = (place, of, div) => {
      const ranked = [];
      for (let i = 1; i <= of; i++)
        ranked.push(i === place ? {name:'You & Mate', isYou:true} : {name:'Duo ' + i});
      careerPrAdd(ranked, {div: div});
      played.push(ev({place: place, of: of, div: div, day: CAREER.career.day}));
    };
    play(3, 150, 4); play(61, 150, 4); play(9, 150, 3);
    const board = careerPrRows();
    const mine = board.find(r => r.you);
    if (!mine) fail('the player is not on their own board');
    const fromLog = ccPrTable(played).pr;
    if (mine.pr !== fromLog)
      fail('the board reads ' + mine.pr + ' where the history reads ' + fromLog);
    if (mine.events !== 3) fail('three events played, the board counts ' + mine.events);
    out.steps.push('the board and the history agree on the player: ' + mine.pr + ' over ' + mine.events + ' events');

    // Everyone in the lobby is rated, and the order is the order they finished.
    if (board.length < 150) fail('only ' + board.length + ' of the field reached the board');
    const first = board[0];
    if (!(first.pr >= mine.pr)) fail('the board is not sorted by rating');
    out.steps.push(board.length + ' teams on the board, led by ' + first.name + ' on ' + first.pr.toLocaleString('en-US'));

    // A fresh lobby every week would fill a save with names, so the board keeps
    // the best CC_PR_ROWS and never prunes the player.
    for (let w = 0; w < 4; w++) {
      const ranked = [];
      for (let i = 1; i <= 150; i++) ranked.push({name: 'Week' + w + ' Duo ' + i});
      ranked.splice(140, 0, {name:'You & Mate', isYou:true});
      careerPrAdd(ranked, {div:4});
    }
    const kept = Object.keys(CAREER.career.pr.rows).length;
    if (kept > CC_PR_ROWS * 1.5) fail('the board kept ' + kept + ' names, past the prune');
    if (!careerPrRows().some(r => r.you)) fail('the player was pruned off their own board');
    out.steps.push('after five lobbies the save holds ' + kept + ' names, and the player is still one of them');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + '<base href="file:///' + ROOT + '/">' + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], { maxBuffer: 512*1024*1024, encoding:'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('PR is Epic\'s own model, on this mode\'s own events');
