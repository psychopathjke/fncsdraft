// A day of training is worth half a point of the attribute it trains.
//
// His number, 17 August, and meant literally: +0.5 on the stat, not half a point
// of rating spread into it. What that is worth in rating is the stat's own
// weight — 0.11 on aim, 0.05 on experience — so the six sessions are no longer
// interchangeable and a card is a season of choices. This holds the arithmetic:
// every session moves its own stat by 0.5, the rating by that stat's weight, the
// taper still slows a career near the top of the scale, and the desk and the
// coach still multiply it.
//
//   node tools/check-career-day-value.js
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
    const DAY = 0.5;
    // Half a point of the stat, whichever stat the session is for. The scrim is
    // the one that splits it, a quarter into each of the four it plays.
    const moved = {};
    CC_DAY_ACTS.filter(a => Object.keys(a.gain||{}).length).forEach(a => {
      const total = Object.keys(a.gain).reduce((s,k) => s + a.gain[k], 0);
      const rating = Object.keys(a.gain).reduce((s,k) => s + a.gain[k]*ATTR_W[k], 0);
      moved[a.id] = {stat: Math.round(total*1000)/1000, rating: Math.round(rating*1000)/1000};
      check('a ' + a.id + ' day moves half a point of stat', Math.abs(total - DAY) < 0.005,
            String(total));
    });
    out.notes.moved = moved;
    check('and a session is the same half point whichever stat it is for',
          Math.abs(ccStep('aim') - ccStep('exp')) < 1e-9,
          ccStep('aim') + ' vs ' + ccStep('exp'));

    // And a day actually spent moves the rating by it, well below the ceiling.
    const fresh = (ovr, pot) => { CAREER = {player:{nick:'P', ovr:ovr, ovrExact:ovr, region:'EU',
      role:'roleIGL', country:'de', age:16, attrs:ccRookieAttrs(ovr,'roleIGL'), potential:pot},
      career:{season:1, day:'2026-02-10', division:3, balance:0, log:[], news:[]},
      partners:[], gear:{own:[], train:0}};
      // ccRookieAttrs builds the six around the rating; read the rating back off
      // them first so the first day is measured from where the card really is.
      CAREER.player.ovrExact = ATTR_KEYS.reduce((s,k)=>s+CAREER.player.attrs[k]*ATTR_W[k], 0);
      CAREER.career.energy = CC_ENERGY_DAY; CAREER.career.did = {}; };
    // The cap is the room's, so a Division 3 probe trains toward 72; measured
    // from well below it.
    fresh(60, 96);
    let before = CAREER.player.ovrExact;
    const aimBefore = CAREER.player.attrs.aim;
    careerDoAct('trAim');
    const gain = CAREER.player.ovrExact - before;
    out.notes.dayAt60 = {stat: Math.round((CAREER.player.attrs.aim - aimBefore)*1000)/1000,
                         rating: Math.round(gain*1000)/1000};
    check('a day well below the top moves the stat by half a point',
          Math.abs((CAREER.player.attrs.aim - aimBefore) - DAY) < 0.005, String(gain));
    check('and the rating by that stat’s weight',
          Math.abs(gain - DAY*ATTR_W.aim) < 0.005, String(gain));

    /* The only ceiling left is the scale's own.

       His call, 17 August, with the ladder tile's line ringed in red: take the
       ceiling off. Training used to stop at the division's band plus four, so a
       Division 1 player on 84 was told the six buttons were nearly finished with
       him. The taper against 99 stays - the last ten points come slowly whether
       they come from a day at the aim trainer or from a Major - and the
       division's part of it is gone. */
    check('the ceiling is the top of the scale, not the division',
          careerTrainCap() === CAREER_SCALE_TOP, String(careerTrainCap()));
    fresh(72, 96);
    before = CAREER.player.ovrExact;
    careerDoAct('trAim');
    out.notes.dayPastOldCap = Math.round((CAREER.player.ovrExact - before)*1000)/1000;
    check('a day four points over the division band still pays',
          Math.abs(out.notes.dayPastOldCap - DAY*ATTR_W.aim) < 0.005,
          String(out.notes.dayPastOldCap));
    // And the last ten points before 99 are slow, wherever they come from.
    fresh(95, 96);
    before = CAREER.player.ovrExact;
    careerDoAct('trAim');
    const late = CAREER.player.ovrExact - before;
    out.notes.dayNearNinetyNine = Math.round(late*1000)/1000;
    check('and the last stretch to 99 pays less', late > 0 && late < DAY*ATTR_W.aim*0.6,
          String(late));
    // ---- one store, spent by days and refilled by nights ----------------
    fresh(60, 96);
    check('a career starts rested', careerEnergy() === CC_ENERGY_DAY, String(careerEnergy()));
    careerDoAct('trAim');
    check('a training day spends its cost',
          careerEnergy() === CC_ENERGY_DAY - ccActById('trAim').energy, String(careerEnergy()));
    // His question, 17 August: a hundred energy and a session costs thirty, so
    // what is the rest of it for. The store is the limit now, not the calendar.
    check('a second session is allowed while the store can pay',
          careerDoAct('trCon') !== null);
    check('and a third', careerDoAct('trClu') !== null);
    check('until it cannot', careerDoAct('trSur') === null,
          'energy ' + careerEnergy());
    // The three that are not an hour still take the whole day.
    // A night off is refused when there is nothing to sleep off — see the rest
    // branch in careerDoAct and the ccRestFull line it puts on the screen — so
    // the day this is asked of has to be a day with some of it spent.
    CAREER.career.energy = 20; CAREER.career.did = {};
    check('resting closes the day', careerDoAct('rest') !== null,
          'energy ' + careerEnergy() + '/' + careerEnergyMax());
    check('and nothing follows it', careerDoAct('trAim') === null);
    CAREER.career.energy = CC_ENERGY_DAY; CAREER.career.did = {};
    check('a stream closes it too', careerDoAct('stream') !== null);
    check('and nothing follows that either', careerDoAct('trAim') === null);
    const beforeNight = careerEnergy();
    careerAdvanceTo(ccAddDays(CAREER.career.day, 1));
    check('a night gives some back', careerEnergy() === beforeNight + CC_ENERGY_NIGHT,
          beforeNight + ' -> ' + careerEnergy());
    // Run it down and the store, not the day, is what stops the work.
    CAREER.career.energy = 10;
    check('an empty store cannot train', careerDoAct('trAim') === null);
    check('but it can rest', careerDoAct('rest') !== null);
    check('and resting refills', careerEnergy() === 10 + CC_ENERGY_REST, String(careerEnergy()));
    out.notes.rested = careerEnergy();
    // A tired day is worth exactly as much as a fresh one — the store is what
    // runs out, not the value of the work.
    fresh(60, 96); CAREER.career.energy = 100;
    let b1 = CAREER.player.ovrExact; careerDoAct('trAim');
    const fresh1 = CAREER.player.ovrExact - b1;
    fresh(60, 96); CAREER.career.energy = 31;
    b1 = CAREER.player.ovrExact; careerDoAct('trAim');
    const low = CAREER.player.ovrExact - b1;
    out.notes.freshVsLow = [Math.round(fresh1*1000)/1000, Math.round(low*1000)/1000];
    check('a day is a day whatever the store holds', Math.abs(fresh1 - low) < 1e-9,
          fresh1 + ' vs ' + low);

    // The desk and the coach still multiply it.
    fresh(60, 96);
    CAREER.career.balance = 20000;
    CAREER.gear = {own:['mouse','headset','keyboard','monitor','pcelite'], train:0.55};
    const COACH = CC_COACHES.filter(function(c){ return c.keys.indexOf('aim') >= 0; })[0];
    if (!careerHireCoach(COACH.id)) check('the probe could hire a coach', false);
    before = CAREER.player.ovrExact;
    careerDoAct('trAim');
    const kitted = CAREER.player.ovrExact - before;
    out.notes.dayKitted = Math.round(kitted*1000)/1000;
    check('a full desk and a coach are worth more than a bare day', kitted > gain*1.8,
          kitted + ' vs ' + gain);
    // ---- the seat next to you teaches ---------------------------------
    // A partner above you drags you up, one below does not, and neither can
    // replace playing well: the pull is capped both ways and touches only the
    // development half of a result's growth.
    fresh(70, 96);
    check('no partner is no pull', Math.abs(careerMateFactor(70) - 1) < 1e-9);
    const seat = ovr => { CAREER.partners = [{card: {handle:'Mate', region:'EU', tier:'trSur',
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr,'roleFRG')}}]; };
    seat(80); const up = careerMateFactor(70);
    seat(70); const same = careerMateFactor(70);
    seat(60); const down = careerMateFactor(70);
    seat(99); const cap = careerMateFactor(40);
    seat(40); const floor = careerMateFactor(99);
    out.notes.mate = {up: Math.round(up*100)/100, same: same,
                      down: Math.round(down*100)/100, cap: cap, floor: floor};
    check('ten above is worth half again', Math.abs(up - 1.5) < 1e-9, String(up));
    check('the same rating teaches nothing extra', Math.abs(same - 1) < 1e-9, String(same));
    check('ten below costs a third', Math.abs(down - 0.7) < 1e-9, String(down));
    check('and the pull is capped both ways', cap === CC_MATE_MAX && floor === CC_MATE_MIN,
          cap + ' / ' + floor);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsday-'));
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
console.log('a day of training is half a point, and the ceiling still slows it');
fs.rmSync(dir, { recursive: true, force: true });
