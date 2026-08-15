// The seat won on the Reload circuit is the entry to the Championship.
//
// Three of the four Reload finals hand Europe a seat each, and the Championship
// — forty teams, ,025,000, 18-21 August — is where they are spent: without
// one its group stage cannot be entered at all. The seat used to sit in the
// save saying nothing between February and August, so the ladder tile now
// carries it with the date it is played on.
//
//   node tools/check-career-ewc-seat.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    const seed = (ewc, day) => { CAREER = {player:{nick:'Probe', ovr:88, region:'EU',
      role:'roleIGL', country:'de', age:16, attrs:ccRookieAttrs(88,'roleIGL')},
      career:{season:1, day:day||'2026-03-02', division:1, balance:0, earnings:0,
              reach:0, log:[], news:[], ewc:ewc}, partner:null, gear:{own:[], train:0}}; };

    // No seat, no Championship.
    seed([], CC_RC_DAY);
    const ev = careerRcOn(CC_RC_DAY);
    out.notes.stageOnOpeningDay = ev && ev.stage;
    check('the Championship opens with a group stage', ev && ev.stage === 'group');
    check('and without a seat it cannot be entered', careerRcCan(ev) === false);

    // A seat is the entry.
    seed([{series:2, place:1, day:'2026-03-01'}], CC_RC_DAY);
    check('with a seat it can', careerRcCan(careerRcOn(CC_RC_DAY)) === true);
    check('and the hub offers it', careerCanPlayKind('gc') === true);

    // And it is visible the day it is won, months before.
    seed([{series:2, place:1, day:'2026-03-01'}], '2026-03-02');
    const tile = careerCentreHTML(careerCard(), attrsFor(careerCard()));
    check('the ladder tile carries the seat', tile.indexOf(L().ccEwcSeat) >= 0);
    check('and says when it is played', tile.indexOf(ccDayLabel(CC_RC_DAY)) >= 0,
          ccDayLabel(CC_RC_DAY));
    seed([], '2026-03-02');
    check('a career without one is not told about it',
          careerCentreHTML(careerCard(), attrsFor(careerCard())).indexOf(L().ccEwcSeat) < 0);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsewc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a seat is the entry to the Championship, and it says so all year');
fs.rmSync(dir, { recursive: true, force: true });
