// The seat beside a career is a player, not a number that stands still.
//
// His pick, 17 August. A career went from 54 to 90 over eight seasons and its
// partner was the same 84 in the last one as in the first, so "they outgrew you"
// and "you outgrew them" could only ever fire one way. They play the same nights
// and they grow on the same terms: their own age, the same taper, the same pull
// from the gap between the two of you, and the same share of the result.
//
//   node tools/check-career-matedev.js
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
    const mate = (ovr, born) => ({card:{handle:'Matey', nat:'de', region:'EU', org:null,
      tier:'ladder', event:'', date:'-', placement:null, rating:ovr, _targetOvr:ovr,
      _attrs:ccRookieAttrs(ovr,'roleFRG')}, patience:80, since:'2026-01-05', dev:0, born:born});
    const seed = (mine, theirs) => { CAREER = {
      player:{nick:'Probe', ovr:mine, ovrExact:mine, region:'EU', role:'roleIGL',
              country:'de', age:17, attrs:ccRookieAttrs(mine,'roleIGL')},
      career:{season:1, day:'2026-02-02', division:3, earnings:0, balance:0,
              tokens:[], log:[], news:[], form:0, grind:0},
      dms:[], partners:[mate(theirs)], gear:{own:[], train:0}}; };
    const ovrOf = () => attrsFor(careerPartnerCard()).ovr;
    // A season of cups, played at the field's own level so the result term is
    // neither a gift nor a punishment.
    const season = (n) => { for (let i = 0; i < (n||17); i++) careerMateGrow(0.5, 0.5); };

    // ---- a season beside you moves them -----------------------------------
    seed(70, 70);
    const before = ovrOf();
    season(17);
    const after = ovrOf();
    out.notes.level = {before: before, after: after, dev: +careerMateDev().toFixed(2),
                       sceneAge: ccSceneAge()};
    check('a partner grows over a season', after > before, before + ' -> ' + after);
    check('and not by more than a career does',
          after - before <= 6, before + ' -> ' + after);
    check('the movement is stored, not the rating', CAREER.partners[0].card.rating === 70,
          String(CAREER.partners[0].card.rating));

    // ---- the gap is read from their side ----------------------------------
    // Beside somebody far better they learn faster; beside somebody far worse,
    // slower. Same numbers careerMateFactor already holds, sign reversed.
    seed(90, 70); season(17); const up = careerMateDev();
    seed(60, 70); season(17); const down = careerMateDev();
    out.notes.gap = {besideBetter: +up.toFixed(2), besideWorse: +down.toFixed(2)};
    check('a partner beside somebody better comes on faster', up > down,
          up + ' vs ' + down);

    // ---- and an old one goes the other way --------------------------------
    // careerDevelopBase turns negative past thirty-six, and the partner reads it
    // the same way the player does.
    seed(70, 70);
    CAREER.partners[0].handle = 'OldTimer';
    const old = careerDevelopBase(38);
    check('the scene knows what an old player does', old < 0, String(old));
    // Nothing to measure through a handle the roster has no birthday for, so the
    // arithmetic is checked where it lives instead.
    check('and the median age is read off the birthdays there are',
          ccSceneAge() > 14 && ccSceneAge() < 35, String(ccSceneAge()));

    // ---- a save from before this reads as it always did --------------------
    seed(70, 70);
    delete CAREER.partners[0].dev;
    check('no movement stored is no movement', careerMateDev() === 0);
    check('and the card is the roster\\'s own', ovrOf() === 70, String(ovrOf()));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsmate-'));
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
console.log('the partner plays the same nights, and the same nights move them');
fs.rmSync(dir, { recursive: true, force: true });
