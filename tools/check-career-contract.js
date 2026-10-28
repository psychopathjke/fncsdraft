// Leaving a club.
//
// A career could be signed by anybody and released by anybody, and the one move
// it could not make was walking away - poaching existed, but that is somebody
// else deciding to want you.
//
//   node tools/check-career-contract.js
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
    const seed = (money, day, country) => {
      CAREER = {player:{nick:'Probe', age:18, source:'rookie', country:country||'de',
                        countryPing:ccPingOf(country||'de'), region:'EU', ovr:84, ovrExact:84,
                        role:'roleIGL', attrs:ccRookieAttrs(84,'roleIGL'), handle:null},
        career:{season:1, day:day||'2026-02-10', division:1, earnings:0, balance:money,
                reach:0, rep:0, tokens:[], log:[], news:[], events:[]},
        partner:null, gear:{own:[], train:0}, dms:[]};
    };
    const club = () => { CAREER.org = {name:'Probe Esports', tier:84, academy:false,
      salary:1200, goal:{type:'place', target:20}, since:1, paid:0}; };

    /* ---- buying out of a contract ---------------------------------------- */
    seed(50000); club();
    const cost = careerBuyoutCost();
    const pays = careerWagePaydays().filter(d => d > careerToday()).length;
    const each = Math.round(1200 / careerWagePaydays().length);
    out.notes.buyout = {cost: cost, paydaysLeft: pays, perPayday: each};
    check('a contract has a price to leave', cost > 0, String(cost));
    check('and it is half of what they would still have paid',
          Math.abs(cost - each * pays * CC_BUYOUT_SHARE) <= 50,
          cost + ' vs ' + (each * pays * CC_BUYOUT_SHARE));
    const before = CAREER.career.balance, rep = careerRep();
    check('leaving works when it can be paid for', careerLeaveOrg() === true);
    check('and it costs the money', before - CAREER.career.balance === cost,
          String(before - CAREER.career.balance));
    check('the seat is empty afterwards', !CAREER.org);
    check('and the scene remembers it', careerRep() < rep, rep + ' -> ' + careerRep());
    check('the career keeps it in its own history',
          (CAREER.career.events||[]).some(e => e.k === 'tlBoughtOut'),
          JSON.stringify((CAREER.career.events||[]).map(e => e.k)));

    // A career that cannot cover it cannot go, which is what a contract is for.
    seed(10); club();
    check('a thin balance cannot buy out', careerLeaveOrg() === false);
    check('and the club still has them', !!CAREER.org);
    check('and the tile says the price', careerOrgTileHTML().indexOf(
      careerBuyoutCost().toLocaleString('en-US')) >= 0);

    /* ---- a contract with a term (29.10: «срок, отступные, выкуп другим клубом») ---- */
    seed(50000); club();
    const one = careerBuyoutCost();
    CAREER.org.to = 2;
    const two = careerBuyoutCost();
    out.notes.term = {one: one, two: two};
    check('a second season on the contract raises the buyout by half a season of wage',
          Math.abs(two - one - 1200 * CC_BUYOUT_SHARE) <= 50, one + ' -> ' + two);
    check('the tile says how long it runs', careerOrgTileHTML().indexOf(L().ccOrgTermLeft(1)) >= 0);
    // Season end with a season left: no renewal question, same wage, the club stays.
    CAREER.career.log = [{kind:'major', place:1, season:1}];
    careerOrgSeasonEnd();
    check('a running contract is not renegotiated at season end', !!CAREER.org && CAREER.org.salary === 1200 && CAREER.org.to === 2,
          JSON.stringify(CAREER.org));
    // Bound by contract: only clubs well above may write, and they pay the buyout.
    seed(50000, '2026-06-20'); club(); CAREER.org.to = 2; CAREER.career.orgs = ['Probe Esports'];   // уже играл за клуб — рынок его видит (ccOrgProven)
    const offers = careerOrgOffers();
    out.notes.offers = offers.map(o => o.name + ' ' + o.tier + ' fee ' + o.fee + ' term ' + o.term);
    check('under contract only bigger clubs come in', offers.every(o => o.tier >= 84 + CC_ORG_POACH_STEP), out.notes.offers.join(' | '));
    check('and their offer carries the buyout', offers.every(o => o.fee > 0), out.notes.offers.join(' | '));
    if (offers.length) {
      CAREER.offers = offers; careerOrgOffersToDms();
      const t = careerDms().find(x => x.offer && x.offer.name === offers[0].name);
      const bal = CAREER.career.balance;
      careerSignFromDm(t.id);
      check('signing from a contract moves the player', CAREER.org && CAREER.org.name === offers[0].name);
      check('the new club pays, not the player', CAREER.career.balance === bal, bal + ' -> ' + CAREER.career.balance);
      check('and it is announced as a transfer', (CAREER.career.news||[]).some(n => n.k === 'ccNewsTransfer' || n.key === 'ccNewsTransfer'),
            JSON.stringify((CAREER.career.news||[]).slice(-3)));
      check('the new contract has its own term', CAREER.org.to >= 1, String(CAREER.org.to));
    }

  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncscon-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a contract can be left, and leaving costs what leaving costs');
fs.rmSync(dir, { recursive: true, force: true });
