// Who posts what.
//
// The feed has three voices — the scene's account, the player, the partner —
// and the author comes off the key the save already stores. The default was the
// scene's account, which is the wrong way round: every key added since turned
// up under Fortnite Competitive's name the moment it was written, so it ended up
// posting "scrimmed the evening with a stronger squad" and "Evaluation: #79 in
// Round 1" as if it were reporting on itself.
//
// What this holds: the default is the player, the scene's account is an opt-in
// list, every line the code can post has a decided author, and the two kinds of
// line that keep getting this wrong — a placing and a day the player spent —
// are the player's own.
//
//   node tools/check-career-feed.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// Every key the code hands to careerNews, read off the page rather than listed
// here — a list would go stale the first time somebody adds a line.
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const EMITTED = [...new Set([...src.matchAll(/careerNews\(\s*[^,]+,\s*'([A-Za-z][\w]*)'\s*[,)]/g)]
  .map(m => m[1]))].sort();
const DYNAMIC = [...new Set([...src.matchAll(/careerNews\([^,]+,\s*'([A-Za-z][\w]*)'\s*\+/g)]
  .map(m => m[1]))].sort();

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (div) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:86, role:'roleIGL',
              attrs:ccRookieAttrs(86,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', division:div, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  const author = (k, args, div) => {
    seed(div || 1);
    careerNews('flat', k, args || []);
    const e = CAREER.career.news[0];
    const a = ccPostAuthor(e);
    return a.you ? 'you' : a.verified ? 'press' : 'other';
  };
  try {
    // ---- the default is the player ---------------------------------------
    check('a line nobody assigned is the player\\u2019s own',
          author('ccNothingIsMappedToThisKey') === 'you',
          author('ccNothingIsMappedToThisKey'));

    // ---- the two that were wrong on the screenshot -----------------------
    // A day the player spent is theirs. The key is built at run time, which is
    // exactly how it slipped past the map in the first place.
    const day = author('ccDayEvscrimupTake');
    out.notes.dayEvent = day;
    check('a day the player spent is the player\\u2019s post', day === 'you', day);
    // And a Performance Evaluation placing. It is a Division 1 night, so the
    // press gate let it through — but what it says is where you finished.
    const evalOut = author('ccNewsEvalOut', [79]);
    out.notes.evalOut = evalOut;
    check('an evaluation placing is the player\\u2019s post', evalOut === 'you', evalOut);
    check('so is an evaluation that paid', author('ccNewsEvalCash', [1, 400]) === 'you');
    check('and a divisional placing still is',
          author('ccNewsResult', [103, 150, 4, 380], 4) === 'you');

    // ---- the scene still says what the scene says ------------------------
    check('the scene congratulates a champion',
          author('ccNewsCongrats', ['@a @b', 'the cup']) === 'press');
    check('the scene posts the Division 1 table',
          author('ccNewsD1Table', [7]) === 'press');
    check('the scene reports a signing', author('ccNewsSigned', ['Org', '500']) === 'press');
    check('the scene reports a move between clubs',
          author('ccNewsLeft', ['A', 'B']) === 'press');
    check('and a promotion out of the academy',
          author('ccNewsPromotedRoster', ['Org', '500']) === 'press');
    check('the scene hands out the award',
          author('ccNewsAwardYou', ['February']) === 'press');
    // But not below Division 1, where it does not report at all.
    check('below Division 1 the award is the player\\u2019s',
          author('ccNewsAwardYou', ['February'], 4) === 'you');

    // ---- money is not the scene's business -------------------------------
    check('a wage is not scene news', author('ccNewsWage', ['500']) === 'you');
    check('nor is a monthly bonus', author('ccNewsMonthBonus', ['300']) === 'you');
    check('nor is the club buying you a desk', author('ccNewsOrgKit', ['Org']) === 'you');

    // ---- every key the code can post has a decided author ----------------
    // Not "does not crash" — decided. A key missing from the map now falls to
    // the player, which is the safe answer, but a line the scene ought to post
    // would be silently wrong, so the list is checked rather than trusted.
    const emitted = ${JSON.stringify(EMITTED)};
    const dynamic = ${JSON.stringify(DYNAMIC)};
    const unmapped = emitted.filter(k => CC_POST_BY[k] === undefined && dynamic.indexOf(k) < 0);
    out.notes.emitted = emitted.length;
    out.notes.dynamic = dynamic;
    out.notes.unmapped = unmapped;
    check('every line the code posts has an author on purpose',
          unmapped.length === 0, unmapped.join(', '));
    // And the dynamic families are covered: a day event by the default, an
    // interview answer by being listed one wording at a time.
    check('the interview answers are all listed',
          ['duo','boast','blame'].every(a =>
            [1,2,3,4].every(v => CC_POST_BY['ccIvSaid'+a+v] === 'you')));

    // ---- what the scene's account is allowed to cover --------------------
    // Its own rule, unchanged: Division 1, and congratulating a winner.
    const line = (k, dv) => ({k:k, dv:dv, a:[]});
    check('the scene covers Division 1', ccPressWorthy(line('ccNewsWinner', 1)) === true);
    check('and not the middle of the ladder',
          ccPressWorthy(line('ccNewsWinner', 4)) === false);
    check('but it congratulates a champion from anywhere',
          ccPressWorthy(line('ccNewsCongrats', 5)) === true);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsfeed-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the scene posts what the scene posts, and the rest is the player');
fs.rmSync(dir, { recursive: true, force: true });
