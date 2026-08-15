// A day that arrives with something on it.
//
// The day loop was seven buttons and no events: every day the same seven and
// the optimum obvious. About one free day in six now carries an offer — a
// stronger duo short a player, a showmatch, a sponsor wanting a video, the
// line going down — with two answers, both of which spend the day. Drawn on
// the date, so opening the same day twice offers the same thing.
//
//   node tools/check-career-dayevents.js
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
    const fresh = () => { CAREER = {player:{nick:'Probe', ovr:70, region:'EU', role:'roleIGL',
      country:'de', age:16, attrs:ccRookieAttrs(70,'roleIGL')},
      career:{season:1, day:CC_YEAR_FROM, division:3, balance:0, earnings:0, reach:60000,
              energy:CC_ENERGY_DAY, did:{}, log:[], news:[]},
      partner:{card:{handle:'Mate', region:'EU', tier:'ranked', rating:70, _targetOvr:70,
                     _attrs:ccRookieAttrs(70,'roleFRG')}, patience:60},
      gear:{own:[], train:0}, sponsor:{id:'drink', since:1, paid:0}}; };

    // How often, and only on days the calendar leaves alone.
    fresh();
    let free = 0, withEv = 0, onEventDay = 0;
    const kinds = {};
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1)) {
      CAREER.career.day = d;
      const busy = (careerYearDays().get(d)||[]).length > 0;
      const ev = ccDayEventOn(d);
      if (busy) { if (ev) onEventDay++; continue; }
      free++;
      if (ev) { withEv++; kinds[ev.id] = (kinds[ev.id]||0) + 1; }
    }
    out.notes.free = free; out.notes.withEv = withEv; out.notes.kinds = kinds;
    check('nothing lands on a tournament day', onEventDay === 0, String(onEventDay));
    check('about one free day in six carries something',
          Math.abs(withEv/free - 1/6) < 0.05, (withEv/free).toFixed(3));
    check('and every kind shows up', Object.keys(kinds).length === CC_DAY_EVENTS.length,
          JSON.stringify(kinds));

    // The same day offers the same thing, twice.
    const someDay = (() => { for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1)) {
      CAREER.career.day = d; if (ccDayEventOn(d)) return d; } return null; })();
    CAREER.career.day = someDay;
    check('a day carries the same offer every time it is opened',
          ccDayEventOn(someDay).id === ccDayEventOn(someDay).id);
    out.notes.someDay = someDay + ' ' + ccDayEventOn(someDay).id;

    // The hub is not open in this probe, so the redraw at the end of a choice
    // has nothing to draw into: stub it the way the other harnesses do.
    careerRenderHub = function(){};

    // Taking one spends the day and pays what it says.
    fresh(); CAREER.career.day = someDay;
    const ev = ccDayEventOn(someDay);
    const beforeE = careerEnergy(), beforeCash = CAREER.career.balance;
    check('taking it works', careerDayEvent(ev.id, true) === true);
    check('and the day is spent', careerDayDone() === true);
    check('so nothing else can be done today', careerDoAct('aimlab') === null);
    if (ev.take.energy) check('it costs the energy it says',
      careerEnergy() === beforeE - ev.take.energy + (ev.take.restore||0), String(careerEnergy()));
    if (ev.take.cash) check('and pays the cash it says',
      CAREER.career.balance === beforeCash + ev.take.cash, String(CAREER.career.balance));

    // Turning one down also spends the day, and the offer is gone.
    fresh(); CAREER.career.day = someDay;
    check('passing works', careerDayEvent(ev.id, false) === true);
    check('the day is spent either way', careerDayDone() === true);
    check('and the offer does not come back', ccDayEventOn(someDay) === null);

    // A stand-in offer needs a partner; a video needs a sponsor.
    fresh(); CAREER.partner = null; CAREER.sponsor = null;
    let scrim = 0, promo = 0;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1)) {
      CAREER.career.day = d;
      const e = ccDayEventOn(d);
      if (e && e.id === 'scrimup') scrim++;
      if (e && e.id === 'promo') promo++;
    }
    check('no partner, no stand-in offers', scrim === 0, String(scrim));
    check('no sponsor, no video requests', promo === 0, String(promo));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsdayev-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a day can arrive with something on it, and both answers spend it');
fs.rmSync(dir, { recursive: true, force: true });
