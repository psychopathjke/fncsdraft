// A duo is not two ratings: it is two ratings and the time they have had.
//
// His pick, 17 August. The draft has always paid SYN_TEAMMATES to a pair the
// roster records as having actually played together; the career never did, so
// leaving a partner for somebody two points better was free and always right.
// This holds the shape of the answer: nothing on the night it forms, the same
// five points once it has played a Fortnite season, a straight line between, and
// zero again the moment the seat changes.
//
//   node tools/check-career-chem.js
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
    const mate = () => ({card:{handle:'Chemmate', nat:'de', region:'EU', org:null, tier:'ladder',
      event:'', date:'-', placement:null, rating:70, _targetOvr:70,
      _attrs:ccRookieAttrs(70,'roleFRG')}, patience:80, since:'2026-02-01'});
    const seed = day => { CAREER = {
      player:{nick:'Probe', ovr:70, ovrExact:70, region:'EU', role:'roleIGL', country:'de',
              age:17, attrs:ccRookieAttrs(70,'roleIGL')},
      career:{season:1, day:day||'2026-02-01', division:3, earnings:0, balance:0,
              tokens:[], log:[], news:[], form:0, grind:0},
      dms:[], partners:[mate()], gear:{own:[], train:0}}; };

    // ---- nothing on the first night, everything after a season -------------
    seed('2026-02-01');
    check('a pair formed today is worth nothing yet', careerChem() === 0, String(careerChem()));
    const walk = {};
    [0, 7, 30, 45, 91, 200].forEach(function(d){
      CAREER.career.day = ccAddDays('2026-02-01', d);
      walk[d] = careerChem();
    });
    out.notes.walk = walk;
    check('a week is worth something', walk[7] > 0, String(walk[7]));
    check('half a season is about half of it',
          Math.abs(walk[45] - CC_CHEM_MAX/2) <= 0.6, String(walk[45]));
    check('a Fortnite season is the whole of it', walk[91] === CC_CHEM_MAX, String(walk[91]));
    check('and it stops there', walk[200] === CC_CHEM_MAX, String(walk[200]));
    check('which is what the draft pays a real pair', CC_CHEM_MAX === SYN_TEAMMATES,
          CC_CHEM_MAX + ' vs ' + SYN_TEAMMATES);

    // ---- and it is in the lobby, not only on the tile ----------------------
    CAREER.career.day = '2026-02-01';
    const cold = careerYouTeam([careerCard(), careerPartnerCard()]).pow;
    CAREER.career.day = ccAddDays('2026-02-01', 91);
    const warm = careerYouTeam([careerCard(), careerPartnerCard()]).pow;
    out.notes.pow = {cold: cold, warm: warm};
    check('a season together is worth power in the room', warm - cold === CC_CHEM_MAX,
          cold + ' -> ' + warm);

    // ---- the seat changes and it is gone -----------------------------------
    const t = careerDmThread({handle:'Newer', ovr:74, roster:false,
                              card:{handle:'Newer', nat:'de', region:'EU', org:null, tier:'ladder',
                                    event:'', date:'-', placement:null, rating:74, _targetOvr:74,
                                    _attrs:ccRookieAttrs(74,'roleFRG')}});
    careerDmPush(t, 'them', 'dmNoPartner', [74]);
    t.state = 'offer';
    careerDmAccept(t.id);
    out.notes.afterSwap = {chem: careerChem(), since: CAREER.partners[0].since};
    check('a better card costs the season you had', careerChem() === 0, String(careerChem()));
    check('and the new pair starts today', CAREER.partners[0].since === careerToday(),
          String(CAREER.partners[0].since));

    // ---- a taken card arrives already played in ----------------------------
    // Those two have been a duo for a year before the career opened, so they do
    // not start as strangers: ccStart seats the real pairing with a season
    // already behind it, which is this date.
    seed(careerStartDay());
    CAREER.partners[0].since = ccAddDays(careerStartDay(), -CC_CHEM_DAYS);
    out.notes.taken = {since: CAREER.partners[0].since, day: careerToday(), chem: careerChem()};
    check('a taken card starts on a full season of it', careerChem() === CC_CHEM_MAX,
          String(careerChem()));
    // And a save from before any of this has no date on its duo, which must read
    // as a pair that has not played together rather than as a crash.
    delete CAREER.partners[0].since;
    check('an older save reads as no chemistry rather than breaking',
          careerChem() === 0 && careerChemDays() === 0, String(careerChem()));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncschem-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a duo is worth the time it has had, and a new seat starts at nothing');
fs.rmSync(dir, { recursive: true, force: true });
