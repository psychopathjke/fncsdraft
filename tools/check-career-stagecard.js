// One table on the page, and a winners plate only where something was won.
//
// A skipped stage keeps its live card so the player can read what they skipped
// to; the stage card that follows draws the same standings again, and the page
// carried both. And the plate said WINNERS under every ordinary Tuesday, which
// is a word a career should only see at the end of a tournament.
//
//   node tools/check-career-stagecard.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    const days = careerYearDays();
    let cupDay = null;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO && !cupDay; d = ccAddDays(d, 1))
      if ((days.get(d)||[]).some(e => e.kind === 'cup')) cupDay = d;
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:16, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:70, role:'roleIGL',
              attrs:ccRookieAttrs(70,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:cupDay, division:3, earnings:0, balance:0, tokens:[], log:[]},
      partner:null
    }));
    careerEntry();
    document.querySelector('#screen-career-hub .ch-play').click();
    let card = null;
    for (let i = 0; i < 600 && !card; i++) {
      await wait(25);
      skipAnimation = true;
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    if (!card) throw new Error('no result card came back');

    // One standings table on the page: the live one came down when the stage
    // card went up.
    const live = document.querySelectorAll('#majorStages .lobby-live').length;
    // The card carries two tables on purpose and they are different things:
    // the game-by-game log, folded away behind its own summary, and the
    // standings. What must not be there twice is the standings.
    const standings = [...document.querySelectorAll('#majorStages .lobby-table')]
      .filter(t => !t.closest('.stage-games')).length;
    const logs = [...document.querySelectorAll('#majorStages .stage-games .lobby-table')].length;
    // Rows the log numbers as games: the drop-fight row the map writes carries
    // a parachute instead of a number, and it is not a game.
    const logRows = [...document.querySelectorAll('#majorStages .stage-games tbody tr')]
      .filter(r => new RegExp('^' + L().gameWord + ' \\\\d+')
        .test(r.textContent.replace(/\\s+/g, ' ').trim())).length;
    out.notes.liveTables = live; out.notes.standings = standings;
    out.notes.logs = logs; out.notes.logRows = logRows;
    check('the live table is gone once the stage card is drawn', live === 0, String(live));
    check('and the standings are on the page once', standings === 1, String(standings));
    check('with the game log folded away beside them', logs === 1, String(logs));
    check('and the log holds the evening it played', logRows === CAREER_CUP_GAMES,
          String(logRows));

    // An ordinary cup night crowns nobody.
    const plates = document.querySelectorAll('#majorStages .win-card').length;
    out.notes.plates = plates;
    check('a divisional cup draws no winners plate', plates === 0, String(plates));

    // The plate is still what a final ends with, in the mode that is all
    // finals: a draft run is untouched by the career gate.
    check('a draft run still ends on the plate', CAREER_RUN === true);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsstage-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('one table on the page, and WINNERS only where something was won');
fs.rmSync(dir, { recursive: true, force: true });
