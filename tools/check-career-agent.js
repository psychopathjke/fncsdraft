// Somebody whose job it is to work on the player's behalf.
//
// His pick, 17 August. Everything a career earned it earned by winning it and
// every club offer arrived cold, so nobody in the mode ever spoke for the
// player. An agent takes ten per cent of the money as it lands — the winnings on
// the board stay the winnings, the cut is an expense with its own line, the way
// the rent is — and in exchange clubs three points above look at you and what
// they put on the table is a fifth better.
//
//   node tools/check-career-agent.js
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
    const seed = (ovr) => { CAREER = {
      player:{nick:'Probe', ovr:ovr, ovrExact:ovr, region:'EU', role:'roleIGL', country:'de',
              age:18, attrs:ccRookieAttrs(ovr,'roleIGL')},
      career:{season:1, day:'2026-02-02', division:2, earnings:0, balance:0, wages:0,
              reach:50000, tokens:[], log:[], news:[], form:0, grind:0},
      dms:[], partner:null, org:null, agent:null, gear:{own:[], train:0}}; };

    // ---- nobody represents a career nobody is looking at --------------------
    seed(60);
    check('too early and nobody writes', careerAgentDm() === null);
    seed(75);
    const t = careerAgentDm();
    check('a career worth representing hears from one', !!t);
    check('and it arrives as a message with terms in it',
          !!t && t.msgs.some(m => m.from === 'them' && /^dmAgent/.test(m.k)),
          t ? t.msgs.map(m => m.k).join(',') : '');
    check('twice is still once', careerAgentDm() === t);
    check('and nothing is signed by arriving', !careerAgent());

    // ---- the cut comes off the hand, not off the winnings -------------------
    seed(75);
    const gross = 10000;
    ccPayIn(gross);
    const plain = {earn: CAREER.career.earnings, bal: CAREER.career.balance};
    seed(75);
    careerSignAgentFromDm(careerAgentDm().id);
    check('signing is what makes an agent', !!careerAgent());
    ccPayIn(gross);
    const repped = {earn: CAREER.career.earnings, bal: CAREER.career.balance,
                    paid: CAREER.career.agentPaid};
    out.notes.money = {plain: plain, repped: repped};
    check('what you won is what you won', repped.earn === plain.earn,
          repped.earn + ' vs ' + plain.earn);
    check('and a tenth of it never reaches the balance',
          plain.bal - repped.bal === Math.round(gross * CC_AGENT_CUT),
          plain.bal + ' vs ' + repped.bal);
    check('which is written down where it went', repped.paid === Math.round(gross * CC_AGENT_CUT),
          String(repped.paid));

    // ---- and the wage is money too -----------------------------------------
    seed(75);
    CAREER.org = {name:'Probe Club', salary:1000, goal:null, tier:80, since:1, paid:0};
    const wagePlain = (careerPayWages('2026-01-25', '2026-02-05'), CAREER.career.balance);
    seed(75);
    CAREER.org = {name:'Probe Club', salary:1000, goal:null, tier:80, since:1, paid:0};
    careerSignAgentFromDm(careerAgentDm().id);
    careerPayWages('2026-01-25', '2026-02-05');
    out.notes.wage = {plain: wagePlain, repped: CAREER.career.balance};
    check('the agent takes their share of the wage as well',
          wagePlain > CAREER.career.balance,
          wagePlain + ' vs ' + CAREER.career.balance);

    // ---- what it buys ------------------------------------------------------
    // Clubs three points further up look at you, and they offer more. Measured
    // against the same career without one, on the same seed.
    const offersAt = (withAgent) => {
      seed(75);
      CAREER.career.division = 2;
      CAREER.career.day = '2026-01-05';   // inside a transfer window
      if (withAgent) careerSignAgentFromDm(careerAgentDm().id);
      const o = careerOrgOffers() || [];
      return {n: o.length, top: o.length ? Math.max.apply(null, o.map(x=>x.tier)) : 0,
              pay: o.length ? Math.max.apply(null, o.map(x=>x.salary)) : 0};
    };
    const cold = offersAt(false), warm = offersAt(true);
    out.notes.offers = {cold: cold, warm: warm};
    check('an agent is worth reaching further or being paid more',
          warm.top > cold.top || warm.pay > cold.pay,
          JSON.stringify(cold) + ' vs ' + JSON.stringify(warm));

    // ---- and it can be ended ------------------------------------------------
    seed(75);
    const t2 = careerAgentDm();
    careerSignAgentFromDm(t2.id);
    careerEndAgentFromDm(t2.id);
    check('ending it is one press', !careerAgent());
    ccPayIn(1000);
    check('and the money is whole again', CAREER.career.balance === 1000,
          String(CAREER.career.balance));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsagent-'));
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
console.log('an agent takes a tenth and gets you spoken for');
fs.rmSync(dir, { recursive: true, force: true });
