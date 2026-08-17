// The desk: real devices at their real prices, and a rig replaces a rig.
//
// The shop used to be five nameless upgrades; it is the gear in devices/ now,
// priced off the product photos. The one rule with teeth is the PC slot: three
// builds, one desk, so an upgrade pays the difference in training rather than
// stacking, and the box below the one already bought is not for sale.
//
//   node tools/check-career-shop.js
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
    const fresh = money => { CAREER = {player: {nick:'Probe', ovr:82, region:'EU', country:'de', age:16, role:'roleIGL', attrs:ccRookieAttrs(82,'roleIGL')},
      career: {season:1, day:'2026-02-10', division:1, balance:money, earnings:money,
               log:[], news:[]}, partner:null, gear:{own:[], train:0}}; };

    // Every item has a name and a price, and every device has a photo on disk.
    fresh(0);
    CC_SHOP.forEach(it => {
      check('item ' + it.id + ' has a name', !!L()['ccShop' + it.id]);
      check('item ' + it.id + ' has a price', it.cost > 0);
    });
    out.notes.items = CC_SHOP.map(it => it.id + ' $' + it.cost).join(', ');

    // A rig replaces a rig: the difference, not the sum.
    fresh(20000);
    careerBuy('pcbudget');
    const afterBudget = CAREER.gear.train;
    careerBuy('pcpro');
    const afterPro = CAREER.gear.train;
    out.notes.pcTrain = afterBudget + ' -> ' + afterPro;
    check('a budget rig is worth its own training', Math.abs(afterBudget - 0.10) < 1e-9, String(afterBudget));
    check('upgrading to PRO pays the difference', Math.abs(afterPro - 0.20) < 1e-9, String(afterPro));
    check('and buying down is refused', careerBuy('pcbudget') === false);
    careerBuy('pcelite');
    check('and ELITE tops the slot', Math.abs(CAREER.gear.train - 0.30) < 1e-9, String(CAREER.gear.train));

    // The peripherals stack, because they are different things on one desk.
    fresh(20000);
    careerBuy('mouse'); careerBuy('keyboard'); careerBuy('headset');
    check('peripherals add up', Math.abs(CAREER.gear.train - 0.15) < 1e-9, String(CAREER.gear.train));

    // The desk itself — everything bought once — is +55%. The bootcamp is a
    // stay rather than a thing, so it is not on it.
    fresh(200000);
    CC_SHOP.forEach(it => careerBuy(it.id));
    out.notes.fullDesk = Math.round(CAREER.gear.train * 100) + '%';
    check('a bought-out desk is +55%', Math.abs(CAREER.gear.train - 0.55) < 1e-9,
          String(CAREER.gear.train));
    // With the stay running and a coach hired it is the +135% the growth
    // calibration was measured against.
    out.notes.peak = Math.round((careerDayGear() - 1) * 100) + '%';
    check('the desk plus a running bootcamp is +100%',
          Math.abs(careerDayGear() - 2.00) < 1e-9, String(careerDayGear()));

    // ---- the bootcamp is a month, not a purchase -------------------------
    fresh(20000);
    check('booking a stay costs its fee', careerBuy('camp') === true &&
          CAREER.career.balance === 19000, String(CAREER.career.balance));
    check('and it is not on the desk', !careerOwns('camp'));
    check('while it runs it pays', Math.abs(careerDayGear() - 1.45) < 1e-9,
          String(careerDayGear()));
    check('booking it twice is refused', careerBuy('camp') === false);
    // A month later it is over, and it can be booked again.
    CAREER.career.day = ccAddDays(CAREER.career.day, 31);
    check('after a month it stops paying', Math.abs(careerDayGear() - 1.00) < 1e-9,
          String(careerDayGear()));
    check('and it can be booked again', careerBuy('camp') === true);
    out.notes.stay = JSON.stringify(CAREER.stays.camp);
    check('no coach is sold in the shop', !CC_SHOP.some(it => it.id === 'coach'));

    // ---- the two that buy days rather than percentages ------------------
    fresh(20000);
    check('a bare career has the plain store', careerEnergyMax() === CC_ENERGY_DAY,
          String(careerEnergyMax()));
    careerBuy('chair');
    check('the chair raises it', careerEnergyMax() === CC_ENERGY_DAY + 10, String(careerEnergyMax()));
    careerBuy('fitness');
    check('and the trainer raises it again', careerEnergyMax() === CC_ENERGY_DAY + 25,
          String(careerEnergyMax()));
    // Two chairs are one chair: the Embody replaces the Titan rather than
    // stacking with it, and the Titan is not for sale afterwards.
    careerBuy('chairhm');
    check('a better chair replaces the first', careerEnergyMax() === CC_ENERGY_DAY + 35,
          String(careerEnergyMax()));
    check('and the lesser one cannot be bought back', careerBuy('chair') === false);
    careerBuy('desk');
    check('the standing desk adds its own', careerEnergyMax() === CC_ENERGY_DAY + 43,
          String(careerEnergyMax()));
    check('neither touches what a day is worth', CAREER.gear.train === 0, String(CAREER.gear.train));
    // The store fills to the new ceiling rather than staying at the old one.
    CAREER.career.energy = 200;
    check('and the store cannot pass it', careerEnergy() === careerEnergyMax(),
          careerEnergy() + ' vs ' + careerEnergyMax());
    out.notes.energyMax = careerEnergyMax();

    // ---- the coach, beside the duo ---------------------------------------
    fresh(20000);
    check('a career starts with no coach', ccCoach() === null);
    check('hiring costs the fee', careerHireCoach('aim') === true &&
          CAREER.career.balance === 20000 - 2500, String(CAREER.career.balance));
    check('and the hired one is the one working', (ccCoach()||{}).id === 'aim');
    check('hiring the same coach twice is refused', careerHireCoach('aim') === false);
    // He is paid by the month, like the bootcamp: when it is out he stops
    // working and the same button pays for the next one.
    CAREER.career.day = ccAddDays(CAREER.career.day, 31);
    check('a month later the coach has stopped', ccCoach() === null);
    check('and can be paid again', careerHireCoach('aim') === true &&
          CAREER.career.balance === 20000 - 5000, String(CAREER.career.balance));
    CAREER.career.day = ccAddDays(CAREER.career.day, -31);
    // He pays into his own half of the game and nowhere else.
    const before = {...CAREER.player.attrs};
    CAREER.career.spentOn = null;
    careerDoAct('trAim');   // aim only
    const aimGain = CAREER.player.attrs.aim - before.aim;
    fresh(20000); CAREER.career.spentOn = null;
    const bare = {...CAREER.player.attrs};
    careerDoAct('trAim');
    const bareGain = CAREER.player.attrs.aim - bare.aim;
    out.notes.aimlab = bareGain.toFixed(3) + ' -> ' + aimGain.toFixed(3);
    check('a mechanics coach speeds mechanics up', aimGain > bareGain * 1.3,
          out.notes.aimlab);
    // The endgame analyst does nothing for an aim day.
    fresh(20000); careerHireCoach('igl'); CAREER.career.spentOn = null;
    const iglBase = {...CAREER.player.attrs};
    careerDoAct('trAim');
    const iglGain = CAREER.player.attrs.aim - iglBase.aim;
    check('and an endgame analyst does not', Math.abs(iglGain - bareGain) < 1e-9,
          iglGain + ' vs ' + bareGain);
    // The column draws every coach, one of them marked.
    const col = careerCoachColHTML();
    check('the column lists every coach',
          CC_COACHES.every(c => col.indexOf(L()['ccCoach' + c.id]) >= 0));
    check('and marks the hired one', /ch-coach on/.test(col));

    // Nothing can be bought without the money.
    fresh(100);
    check('an empty balance buys nothing', careerBuy('mouse') === false);

    /* The screen draws a photo for every row it draws, and a slot is one row.

       The desk used to list all three rigs and both chairs, where buying the
       better one replaced the worse and the worse then sat there saying HAVE
       BETTER - a shop showing you its own bookkeeping. A slot shows the step up
       and nothing else. */
    fresh(20000); careerBuy('pcpro');
    const html = careerShopHTML();
    const shown = ccShopVisible();
    out.notes.rows = {shown: shown.length, ofItems: CC_SHOP.length,
                      ids: shown.map(i => i.id).join(',')};
    // The wide class contains the base class, so count the tags.
    const imgs = (html.match(/<img class="cc-buy-img/g) || []).length;
    out.notes.photos = imgs;
    check('every row drawn carries its photo', imgs === shown.filter(i => i.img).length,
          imgs + ' of ' + shown.filter(i => i.img).length);
    check('a slot is one row', shown.filter(i => i.slot === 'pc').length === 1,
          shown.filter(i => i.slot === 'pc').map(i => i.id).join(','));
    check('and it is the step up from what is owned',
          shown.some(i => i.id === 'pcelite'), out.notes.rows.ids);
    check('the rig already bought is not offered again',
          !shown.some(i => i.id === 'pcpro' || i.id === 'pcbudget'), out.notes.rows.ids);
    check('nothing says HAVE BETTER any more', !/cc-buy-old/.test(html));
    // A finished slot still says what is on the desk.
    fresh(20000); careerBuy('pcbudget'); careerBuy('pcpro'); careerBuy('pcelite');
    const done = ccShopVisible().filter(i => i.slot === 'pc');
    check('a finished slot shows the one that is owned',
          done.length === 1 && done[0].id === 'pcelite' && careerOwns(done[0].id),
          done.map(i => i.id).join(','));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsshop-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }

// The photos are files, and a missing one leaves a hole on the screen.
let missing = 0;
console.log(out.notes.items);
console.log('PC slot training: ' + out.notes.pcTrain + ', full desk ' + out.notes.fullDesk);
JSON.parse(JSON.stringify(out.notes)); // notes are plain data
const imgs = (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .match(/img:'([^']+)'/g) || []).map(s => s.slice(5, -1));
imgs.forEach(f => {
  if (!fs.existsSync(path.join(ROOT, 'devices', f))) { console.error('FAIL missing devices/' + f); missing++; }
});
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); }
if (out.fails.length || missing) process.exit(1);
console.log('the desk is real gear, and a rig replaces a rig');
fs.rmSync(dir, { recursive: true, force: true });
