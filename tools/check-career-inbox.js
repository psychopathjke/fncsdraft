// Three piles in the inbox, and the third one is the room.
//
// A club's contract, a duo's answer and a stranger's hello sat in one list
// sorted by arrival. They are read for three different reasons, so the side
// splits: Clubs, Players, Viewers. Viewers are new — they write after a night
// worth writing about, they carry nothing to press, and how often they write
// is the size of the audience.
//
//   node tools/check-career-inbox.js
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
    careerRenderHub = function(){};
    const fresh = reach => { CAREER = {player:{nick:'Probe', ovr:82, region:'EU', role:'roleIGL',
      country:'de', age:16, attrs:ccRookieAttrs(82,'roleIGL')},
      career:{season:1, day:'2026-02-10', division:1, balance:0, earnings:0, reach:reach,
              energy:CC_ENERGY_DAY, did:{}, log:[], news:[]},
      partner:null, gear:{own:[], train:0}, dms:[]}; };

    // A career nobody watches hears from nobody.
    fresh(0);
    let fans = 0;
    for (let i = 0; i < 60; i++) {
      CAREER.career.day = ccAddDays('2026-01-05', i);
      if (careerFanDm(1, 150, true)) fans++;
    }
    out.notes.unknownCareer = fans;
    check('an unwatched career hears from nobody', fans === 0, String(fans));

    // A watched one hears something after good nights, and not after bad ones.
    fresh(50000);
    let good = 0, bad = 0;
    for (let i = 0; i < 60; i++) {
      CAREER.career.day = ccAddDays('2026-01-05', i);
      CAREER.dms = [];
      if (careerFanDm(2, 150, true)) good++;
      CAREER.dms = [];
      if (careerFanDm(140, 150, false)) bad++;
    }
    out.notes.good = good; out.notes.bad = bad;
    check('a good night is written about often', good > 20, String(good));
    check('a bad one is not written about at all', bad === 0, String(bad));

    // A fan thread is a fan thread: no rating, nothing to press, and it never
    // counts as somebody who would play with you.
    fresh(50000);
    CAREER.career.day = '2026-02-10';
    let t = null;
    for (let i = 0; i < 40 && !t; i++) {
      CAREER.career.day = ccAddDays('2026-01-05', i);
      t = careerFanDm(1, 150, true);
    }
    check('a fan letter arrives', !!t);
    check('and is marked as one', !!(t && t.who.fan));
    check('with no rating on it', t && t.who.ovr === null);
    check('and it is unread until opened', !!(t && t.unread));

    // The wall does not grow forever, and it never eats a club or a duo.
    fresh(150000);
    CAREER.dms = [];
    careerDmThread({handle:'FOKUS', ovr:82, org:true});
    careerDmThread({handle:'Mate', ovr:88, roster:true});
    for (let i = 0; i < 40; i++) {
      CAREER.career.day = ccAddDays('2026-01-05', i);
      careerFanDm(1, 150, true);
    }
    const kinds = careerDms().reduce((a,x)=>{ const k=x.who.org?'club':x.who.fan?'fan':'duo';
      a[k]=(a[k]||0)+1; return a; }, {});
    out.notes.kinds = kinds;
    check('fan letters are capped', (kinds.fan||0) <= CC_FAN_KEEP, String(kinds.fan));
    check('the club thread survives', kinds.club === 1);
    check('and so does the player thread', kinds.duo === 1);

    // The screen draws the three sections.
    CH_DM = careerDms()[0].id;
    const html = careerSocialHTML();
    ['clubs','duos','fans'].forEach(k =>
      check('the inbox draws the ' + k + ' section', html.indexOf(L()['dmSec'+k]) >= 0));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsinbox-'));
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
console.log('clubs, players and viewers, and the viewers are the room');
fs.rmSync(dir, { recursive: true, force: true });
