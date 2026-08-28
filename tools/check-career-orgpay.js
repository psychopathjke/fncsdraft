// A better club is simply a better contract, and a hired SMM can be seen.
//
// His call, 20 August. The club used to be a nudge at the edges of an offer
// built out of the player's own rating — 0.85 to 1.15, so the biggest club in
// Europe paid a third more than the smallest one that would sign you — while
// the cut it took off every prize ran 5% to 20%. For anybody who actually won
// boards in Division 1 that made a big club the worse deal, which is the
// opposite of what a big club is.
//
// And the SMM was a percentage of a number that is nine times smaller below
// Division 1: a fifth of twenty followers a night is four people, so his tester
// hired one in Division 5 and correctly saw nothing. They bring their own
// audience now, measured off the follower count on their own card.
//
//   node tools/check-career-orgpay.js
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
  try {
    const seed = (div, ovr) => { CAREER = {
      player:{nick:'Probe', ovr:ovr, ovrExact:ovr, region:'EU', role:'roleIGL',
              country:'de', age:20, attrs:ccRookieAttrs(ovr,'roleIGL')},
      career:{season:1, day:'2026-02-02', division:div, earnings:0, balance:9000,
              tokens:[], log:[], news:[], form:0, grind:0, size:2, diff:'easy',
              reach:5000},
      partners:[], dms:[], gear:{own:[], train:0}}; };

    // ---- the wage climbs with the club, all the way up --------------------
    seed(1, 88);
    const tiers=[55, 65, 75, 85, 96];
    const paid=tiers.map(t=>careerOrgSalary(t, 1, 5000));
    out.notes.wageByTier={}; tiers.forEach((t,i)=>{ out.notes.wageByTier[t]=paid[i]; });
    for(let i=1;i<paid.length;i++)
      check('a bigger club pays more, at tier ' + tiers[i], paid[i] > paid[i-1],
            paid[i-1] + ' -> ' + paid[i]);
    out.notes.bestOverWorst=+(paid[paid.length-1]/paid[0]).toFixed(2);
    check('and the top of the pool is worth about three of the bottom',
          paid[paid.length-1]/paid[0] > 2.4, out.notes.bestOverWorst + 'x');

    // The top of the range is still his own number, and still reachable.
    seed(1, 96);
    const top=careerOrgSalary(96, 1, 5000);
    out.notes.topOfTheRange=top;
    check('the best player at the best club is at the top of the band',
          top >= 11000 && top <= 15000, String(top));
    /* And the floor still holds — inside the branch that has one. Below the
       Division 1 rating band the wage is a share of CC_WAGE_CAP, which is $100
       at Division 3 and $300 at Division 2 on purpose, so the $500 floor is a
       Division 1 term and is checked as one. */
    seed(1, 85);
    const floor=careerOrgSalary(50, 1, 0);
    out.notes.floor={division1AtTheSmallestClub:floor,
                     division2:careerOrgSalary(50, 2, 0, 76)};
    check('and the Division 1 floor is still the floor', floor >= 500, String(floor));

    // ---- and it is not eaten by the cut ----------------------------------
    // A Division 1 year with real boards in it: what is left after the club's
    // share, at a small club and at a big one.
    seed(1, 88);
    const year=200000;   // prize money over a season, before the club's share
    const small={wage:careerOrgSalary(65, 1, 5000)*12, cut:careerOrgCutFor(65)};
    const big={wage:careerOrgSalary(96, 1, 5000)*12, cut:careerOrgCutFor(96)};
    small.total=Math.round(small.wage + year*(1-small.cut));
    big.total=Math.round(big.wage + year*(1-big.cut));
    out.notes.overAYear={small:small, big:big};
    check('over a winning season the big club is still the better deal',
          big.total > small.total, small.total + ' vs ' + big.total);
    out.notes.cutRange={low:careerOrgCutFor(55), high:careerOrgCutFor(96)};
    check('the cut is still a real term', careerOrgCutFor(96) > careerOrgCutFor(55),
          JSON.stringify(out.notes.cutRange));

    // ---- the SMM does something a player can see -------------------------
    seed(5, 70);
    const before=careerReach();
    const who=CC_SMM[0];
    careerHireSmm(who.id);
    ccSmmWork(30);
    const after=careerReach();
    out.notes.smm={who:who.name, theirOwn:who.x, month:after-before,
                   printed:ccSmmGot()};
    check('a month of an SMM brings a number a player can see',
          after-before > 200, String(after-before));
    check('and it is a share of their own audience, not of nothing',
          Math.abs((after-before) - who.x*CC_SMM_OWN) < who.x*0.05,
          (after-before) + ' against ' + Math.round(who.x*CC_SMM_OWN));
    check('the tile prints what actually arrived', ccSmmGot() === after-before,
          ccSmmGot() + ' vs ' + (after-before));
    // Nobody hired, nothing delivered.
    seed(5, 70);
    const flat=careerReach();
    ccSmmWork(30);
    check('and nothing arrives when nobody is hired', careerReach()===flat,
          careerReach() + ' vs ' + flat);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpay-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=90000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a better club is a better contract, and the SMM can be seen');
fs.rmSync(dir, { recursive: true, force: true });
