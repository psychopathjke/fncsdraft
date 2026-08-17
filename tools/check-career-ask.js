// Asking a club for more.
//
// An offer was take-it-or-leave-it: the club named a wage and the only two
// moves were signing it or not. A contract is the one place in this mode where
// the player has something the other side wants, and none of it was on the
// table.
//
// What this holds: an ask changes the deal that gets signed rather than a number
// on a screen, the odds are leverage and not a coin, a club takes days to answer
// and stops waiting after a fortnight, two asks are allowed and the second is
// harder, and a club that was reaching down to sign you can walk away.
//
//   node tools/check-career-ask.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (ovr) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:ovr, role:'roleIGL',
              attrs:ccRookieAttrs(ovr,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', division:2, earnings:0, balance:0,
              reach:5000, tokens:[], log:[], news:[]},
      partner:null
    }));
    careerLoad();
  };
  // An offer on the table, as careerOrgDm builds one.
  const offer = (tier, salary, perk) => {
    CAREER.offers = [{name:'Probe Esports', salary:salary, academy:false,
                      tier:tier, goal:{type:'cut'}, perk:perk||null}];
    return careerOrgDm(CAREER.offers[0], 0);
  };
  // A club answers on the clock, not in the same breath. Moved through
  // careerOrgDays rather than careerAdvanceTo so this measures the negotiation
  // and not the wages, the awards and Division 1's week.
  const days = n => {
    const from = CAREER.career.day, to = ccAddDays(from, n);
    CAREER.career.day = to;
    careerOrgDays(from, to);
    return to;
  };
  const answer = () => days(CC_ASK_DAYS);
  try {
    // ---- the odds are leverage -------------------------------------------
    seed(80);
    const same = careerAskOdds({tier:80});
    const over = careerAskOdds({tier:75});
    const under = careerAskOdds({tier:85});
    out.notes.odds = {atTheirStandard: same, fiveOver: over, fiveUnder: under};
    check('at a club\\u2019s own standard it is about even', same === 50, String(same));
    check('above it they want you more', over > same, over + ' vs ' + same);
    check('below it they are doing you a favour', under < same, under + ' vs ' + same);
    check('and it never reaches certainty either way',
          careerAskOdds({tier:0}) <= 95 && careerAskOdds({tier:200}) >= 5,
          careerAskOdds({tier:0}) + '/' + careerAskOdds({tier:200}));

    // ---- a yes changes the contract, not just the message ----------------
    // Rated far above the club, so the ask lands.
    seed(95);
    let t = offer(70, 1000);
    careerAskMore(t.id);
    // Nothing has happened yet: a negotiation takes days, and this is the day
    // it was sent.
    check('the club does not answer in the same breath',
          t.offer.salary === 1000 && !!t.pending,
          t.offer.salary + '/' + JSON.stringify(t.pending));
    check('and the offer says how long it stands', !!t.offer.until, String(t.offer.until));
    answer();
    check('and it is answered once the days have passed', !t.pending);
    out.notes.raise = {salary: t.offer && t.offer.salary,
                       onTable: (CAREER.offers[0]||{}).salary};
    check('asking for more got more', t.offer && t.offer.salary > 1000,
          String(t.offer && t.offer.salary));
    check('and the offer on the table moved with it',
          (CAREER.offers[0]||{}).salary === (t.offer||{}).salary,
          JSON.stringify(out.notes.raise));
    // What gets signed is the improved deal, not the one that arrived.
    const better = t.offer.salary;
    careerSignFromDm(t.id);
    out.notes.signed = CAREER.org && {salary: CAREER.org.salary};
    check('and the contract signed is the one negotiated',
          CAREER.org && CAREER.org.salary === better,
          JSON.stringify(out.notes.signed));

    // ---- two asks per offer, and the second is harder ---------------------
    seed(95);
    t = offer(70, 1000);
    careerAskMore(t.id);
    check('a second ask while the first is out is refused',
          t.asks === 1, String(t.asks));
    answer();
    const after = t.offer.salary;
    careerAskMore(t.id);
    answer();
    check('a second ask is allowed once the first is answered',
          t.asks === 2, String(t.asks));
    check('and it can move the wage again', t.offer.salary >= after,
          after + ' -> ' + t.offer.salary);
    const twice = t.offer.salary;
    careerAskMore(t.id);
    check('a third does nothing', t.offer.salary === twice && !t.pending,
          twice + ' -> ' + t.offer.salary);
    check('and the thread says the conversation is over', t.asked === true);
    // Read at the club's own standard, where the odds are not against a clamp:
    // a 95 asking a club that signs 95s is the even case the curve is built on.
    out.notes.secondIsHarder = {first: careerAskOdds({tier:95}, 0),
                                second: careerAskOdds({tier:95}, 1)};
    check('pushing twice costs you the odds',
          careerAskOdds({tier:95}, 1) < careerAskOdds({tier:95}, 0),
          JSON.stringify(out.notes.secondIsHarder));

    // ---- and a club stops waiting ----------------------------------------
    seed(95);
    t = offer(70, 1000);
    days(CC_OFFER_DAYS + 1);
    out.notes.expired = {offer: t.offer, state: t.state, onTable: (CAREER.offers||[]).length};
    check('an offer nobody signed runs out', !t.offer, JSON.stringify(t.offer));
    check('and it comes off the table with it', (CAREER.offers||[]).length === 0,
          String((CAREER.offers||[]).length));
    check('and the thread says so',
          t.msgs.some(m => m.k === 'dmOrgExpired'),
          t.msgs.map(m => m.k).join(','));
    // Rebuilding the offers after a cup must not renew a deadline or reset a
    // negotiation already under way.
    seed(95);
    t = offer(70, 1000);
    const until = t.offer.until;
    careerAskMore(t.id); answer();
    const negotiated = t.offer.salary;
    offer(70, 1000);
    check('an offer already on the table is not re-made',
          t.offer.until === until && t.offer.salary === negotiated,
          t.offer.until + '/' + t.offer.salary);

    // ---- the gear ask ----------------------------------------------------
    seed(95);
    t = offer(70, 1000);
    check('an offer without gear can be asked for it', !t.offer.perk);
    careerAskPerk(t.id);
    answer();
    out.notes.perk = t.offer && t.offer.perk;
    check('and a yes puts it in the contract', t.offer.perk === 'gear',
          String(t.offer && t.offer.perk));
    // An offer that already covers gear has nothing to ask for.
    seed(95);
    t = offer(70, 1000, 'coach');
    careerAskPerk(t.id);
    answer();
    check('an offer that already has a perk is not asked twice',
          t.offer.perk === 'coach' && !t.asked, t.offer.perk + '/' + !!t.asked);

    // ---- a club can walk -------------------------------------------------
    // Far under their standard: the refusal can end it. Run it until both
    // outcomes have been seen, so this is the rule and not one lucky seed.
    let walked = 0, stayed = 0;
    for (let i = 0; i < 60 && (!walked || !stayed); i++) {
      seed(60);
      CAREER.career.day = '2026-02-' + String(10 + (i % 18)).padStart(2, '0');
      t = offer(90, 1000);            // thirty points under: no leverage at all
      careerAskMore(t.id);
      answer();
      if (t.offer) stayed++; else walked++;
    }
    out.notes.walk = {walked: walked, stayed: stayed};
    check('a club reaching down can withdraw the offer', walked > 0, String(walked));
    check('but a refusal is not always the end', stayed > 0, String(stayed));

    // ---- and a strong player is never punished for asking ----------------
    let lost = 0;
    for (let i = 0; i < 40; i++) {
      seed(95);
      CAREER.career.day = '2026-03-' + String(1 + (i % 28)).padStart(2, '0');
      t = offer(70, 1000);
      careerAskMore(t.id);
      answer();
      if (!t.offer) lost++;
    }
    out.notes.strongLost = lost;
    check('asking from above their standard never costs the offer', lost === 0,
          String(lost));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsask-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a contract can be argued with, and arguing has a price');
fs.rmSync(dir, { recursive: true, force: true });
