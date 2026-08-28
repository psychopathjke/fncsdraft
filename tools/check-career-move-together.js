// The one thing a continent takes that can be bought back.
//
// His ask, 21 August: move to another region with the partner and pay their way,
// and have it lift their mood. A region move is the only decision in the mode
// that throws away what a career built — the club, the rival, the people, the
// seat beside it — and the seat is the one loss with a price on it.
//
// What has to hold: paying takes them with you; the bill is the flight and a
// first month each on top of your own; somebody you paid for and who crossed an
// ocean with you sits down with more patience than they had; going alone still
// empties the seat; and a career that cannot cover both does not move at all
// rather than moving and leaving them behind.
//
//   node tools/check-career-move-together.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const made = (handle, ovr) => ({handle:handle, nat:'de', region:'EU', org:null,
    tier:'ladder', event:'', date:'-', placement:null, rating:ovr, _targetOvr:ovr,
    _attrs:ccRookieAttrs(ovr, 'roleIGL')});
  // A career in Europe with somebody beside it and money in the bank.
  const seed = (cash, mates) => { CAREER = {
    player:{nick:'Mover', ovr:80, ovrExact:80, region:'EU', role:'roleFRG',
            country:'de', age:18, attrs:ccRookieAttrs(80,'roleFRG')},
    career:{season:1, day:'2026-03-02', division:3, size:mates>1?3:2, diff:'easy',
            earnings:0, balance:cash, rent:0, tokens:[], log:[], news:[], newsN:0},
    dms:[], gear:{own:[], train:0},
    partners:Array.from({length:mates}, (_,i)=>({card:made('Matey'+i, 78),
      handle:'Matey'+i, patience:50, since:'2026-01-05', dev:0}))}; };

  const done = () => {
    try {
      // ---- what it costs -------------------------------------------------
      seed(100000, 1);
      const rent = CC_REGION_RENT.OCE;
      out.notes.bill = {mine: rent, theirs: careerMoveMatesCost(rent),
                        flight: CC_MOVE_FLIGHT};
      check('their side is a flight and a month, per head',
            careerMoveMatesCost(rent) === CC_MOVE_FLIGHT + rent,
            String(careerMoveMatesCost(rent)));

      // ---- paying takes them with you ------------------------------------
      const before = {balance: CAREER.career.balance, patience: careerPatience(),
                      mate: careerMates()[0].handle};
      const ok = careerMoveRegion('OCE', null, true);
      out.notes.together = {ok: ok, region: CAREER.player.region,
                            mates: careerMates().map(m => m.handle),
                            paid: before.balance - CAREER.career.balance,
                            patience: careerPatience(), was: before.patience};
      check('the move happens', ok === true && CAREER.player.region === 'OCE',
            String(CAREER.player.region));
      check('and the seat travels with it',
            careerMates().length === 1 && careerMates()[0].handle === before.mate,
            careerMates().map(m => m.handle).join(','));
      check('the bill is both sides at once',
            out.notes.together.paid === rent + CC_MOVE_FLIGHT + rent,
            String(out.notes.together.paid));
      check('somebody who crossed an ocean for you is happier',
            careerPatience() === before.patience + CC_MOVE_MATE_MOOD,
            before.patience + ' -> ' + careerPatience());
      // The season they have had together is not restarted by a flight.
      check('and it is the same duo, not a new one',
            CAREER.partners[0].since === '2026-01-05', String(CAREER.partners[0].since));

      // ---- going alone still empties the seat ----------------------------
      seed(100000, 1);
      careerMoveRegion('OCE', null);
      out.notes.alone = {mates: careerMates().length, region: CAREER.player.region};
      check('moving alone leaves them behind', careerMates().length === 0,
            String(careerMates().length));

      // ---- a trio pays for both seats ------------------------------------
      seed(100000, 2);
      const paidFor2 = careerMoveMatesCost(rent);
      const bal2 = CAREER.career.balance;
      careerMoveRegion('OCE', null, true);
      out.notes.trio = {mates: careerMates().length, paid: bal2 - CAREER.career.balance,
                        theirs: paidFor2};
      check('a trio takes both of them', careerMates().length === 2,
            String(careerMates().length));
      check('and pays for both', paidFor2 === 2 * (CC_MOVE_FLIGHT + rent),
            String(paidFor2));

      // ---- and it is all or nothing --------------------------------------
      // Enough for your own month, not enough for theirs: the move does not
      // happen at all rather than happening without them.
      seed(rent + 10, 1);
      const poor = careerMoveRegion('OCE', null, true);
      out.notes.poor = {ok: poor, region: CAREER.player.region,
                        mates: careerMates().length, balance: CAREER.career.balance};
      check('a career that cannot cover them does not move', poor === false &&
            CAREER.player.region === 'EU' && careerMates().length === 1,
            JSON.stringify(out.notes.poor));
      check('and is not charged for a move it did not make',
            CAREER.career.balance === rent + 10, String(CAREER.career.balance));
    } catch (e) { out.err = String(e && e.stack || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmovet-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the seat can be brought along, and it costs what it costs');
fs.rmSync(dir, { recursive: true, force: true });
