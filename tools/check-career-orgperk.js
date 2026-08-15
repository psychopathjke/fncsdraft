// What a club puts on the table besides the wage.
//
// The two things a career spends on are the desk and the coach, so a club that
// wants you badly enough pays for one: a mid club kits you out, and only the
// top of the pool carries your coach — the thing a career cannot afford until
// Division 1 starts paying. This holds the tiers, the delivery and the money:
// signing a gear deal puts the kit on the desk without charging for it, and a
// coach deal makes hiring free while the contract lasts.
//
//   node tools/check-career-orgperk.js
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
    const fresh = money => { CAREER = {player:{nick:'Probe', ovr:88, region:'EU', role:'roleIGL',
      country:'de', age:16, attrs:ccRookieAttrs(88,'roleIGL')},
      career:{season:1, day:'2026-02-10', division:1, balance:money, earnings:money,
              log:[], news:[], orgs:[]}, partner:null, gear:{own:[], train:0}}; };

    // Who can offer what, by tier — and whether they bother, which is a draw.
    const roll = v => () => v;
    check('an academy deal carries nothing', ccOrgPerk(92, true, roll(0)) === null);
    check('a small club carries nothing whatever it rolls',
          ccOrgPerk(74, false, roll(0)) === null && ccOrgPerk(74, false, roll(0.99)) === null);
    check('a mid club can provide the gear', ccOrgPerk(82, false, roll(0.10)) === 'gear');
    check('and often does not', ccOrgPerk(82, false, roll(0.90)) === null);
    check('the top of the pool can pay the coach', ccOrgPerk(90, false, roll(0.10)) === 'coach');
    check('or offer gear instead', ccOrgPerk(90, false, roll(0.40)) === 'gear');
    check('or nothing at all', ccOrgPerk(90, false, roll(0.90)) === null);
    // Over a lot of draws it lands near the stated odds.
    const tally = (tier, n) => { const t = {gear:0, coach:0, none:0};
      for (let i = 0; i < n; i++) {
        const r = Math.random();
        const p = ccOrgPerk(tier, false, () => r);
        t[p || 'none']++;
      }
      return t; };
    const top = tally(90, 4000), mid = tally(82, 4000);
    out.notes.top = top; out.notes.mid = mid;
    check('a coach is about one in four', Math.abs(top.coach/4000 - 0.25) < 0.05,
          JSON.stringify(top));
    check('gear about one in three at the gear tier', Math.abs(mid.gear/4000 - 0.35) < 0.05,
          JSON.stringify(mid));
    // Same week, same offers: the draw rides the offer seed, so re-reading the
    // week cannot shop for a better contract.
    fresh(0);
    const a = JSON.stringify((careerOrgOffers()||[]).map(o => o.name + ':' + o.perk));
    const b = JSON.stringify((careerOrgOffers()||[]).map(o => o.name + ':' + o.perk));
    check('the same week offers the same terms twice', a === b, a + ' vs ' + b);
    out.notes.week = a;

    // A gear deal delivers on signing, and costs the player nothing.
    fresh(0);
    CAREER.offers = [{name:'FOKUS', tier:82, academy:false, salary:900,
                      goal:{type:'place', target:20}, perk:'gear'}];
    careerSign(0);
    out.notes.kitTrain = CAREER.gear.train;
    check('the kit lands on the desk', CC_ORG_KIT.every(id => careerOwns(id)),
          JSON.stringify(CAREER.gear.own));
    check('and it is worth the desk it is', Math.abs(CAREER.gear.train - 0.45) < 1e-9,
          String(CAREER.gear.train));
    check('and nothing was charged', CAREER.career.balance === 0, String(CAREER.career.balance));
    check('the contract remembers the perk', CAREER.org.perk === 'gear');
    // An ELITE rig already on the desk is not downgraded by a club's PRO one.
    fresh(20000); careerBuy('pcelite');
    const eliteTrain = CAREER.gear.train;
    CAREER.offers = [{name:'FOKUS', tier:82, academy:false, salary:900,
                      goal:{type:'place', target:20}, perk:'gear'}];
    careerSign(0);
    check('a better rig is left alone', !careerOwns('pcpro'), JSON.stringify(CAREER.gear.own));
    // Three peripherals at 5% and the monitor at 10% — the rig's own 30% is
    // already there and is not paid for twice.
    check('and the desk grew by the peripherals and the monitor',
          Math.abs(CAREER.gear.train - (eliteTrain + 0.25)) < 1e-9, String(CAREER.gear.train));

    // A coach deal pays the months.
    fresh(0);
    CAREER.offers = [{name:'Falcons', tier:90, academy:false, salary:4000,
                      goal:{type:'place', target:20}, perk:'coach'}];
    careerSign(0);
    check('the club is paying', ccOrgPaysCoach() === true);
    check('and a broke career can hire', careerHireCoach('aim') === true);
    check('with no money taken', CAREER.career.balance === 0, String(CAREER.career.balance));
    check('and the coach is working', (ccCoach()||{}).id === 'aim');
    // The column says who is paying rather than a price.
    const col = careerCoachColHTML();
    check('the column names the payer', col.indexOf('Falcons') >= 0);
    // Without a club, a broke career cannot.
    fresh(0);
    check('and without a club it costs money', careerHireCoach('aim') === false);

    // The offer says what it carries, on the tile and in the DMs.
    fresh(0);
    CAREER.offers = [{name:'FOKUS', tier:90, academy:false, salary:4000,
                      goal:{type:'place', target:20}, perk:'coach'}];
    const tile = careerOrgTileHTML();
    check('the offer tile shows the perk', tile.indexOf(L().ccPerkcoach) >= 0);
    careerOrgDm(CAREER.offers[0], 0);
    CH_DM = careerDmFind('FOKUS').id;
    const social = careerSocialHTML();
    check('and the DM offer shows it too', social.indexOf(L().ccPerkcoach) >= 0);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsperk-'));
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
console.log('a club pays for the desk or the coach, and the offer says which');
fs.rmSync(dir, { recursive: true, force: true });
