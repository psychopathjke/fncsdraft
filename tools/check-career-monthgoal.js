// What the club wants this month.
//
// A contract had one objective and a year to meet it, so no week mattered more
// than another. The club now asks for one thing a month — a cut, a top twenty,
// a podium, sized on the division — and pays a month of the wage for it. It is
// read off the history rather than tracked, judged where a result lands, and
// seeded on the month and the club so it cannot be rerolled.
//
//   node tools/check-career-monthgoal.js
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
    careerRenderHub = function(){};
    const fresh = (div, club) => { CAREER = {player:{nick:'Probe', ovr:75, region:'EU',
      role:'roleIGL', country:'de', age:16, attrs:ccRookieAttrs(75,'roleIGL')},
      career:{season:1, day:'2026-02-10', division:div, balance:0, earnings:0, wages:0,
              energy:CC_ENERGY_DAY, did:{}, log:[], news:[]}, partner:null,
      gear:{own:[], train:0},
      org: club===null ? null : {name:club||'FOKUS', tier:82, salary:1200,
        goal:{type:'promote', target:1}, since:1, paid:0}}; };

    // No club, nothing to ask.
    fresh(3, null);
    check('a free agent has no month goal', careerMonthGoal() === null);

    // One goal a month, the same one however often it is read.
    fresh(4);
    const g = careerMonthGoal();
    check('a club asks for something', !!g);
    check('and asks the same thing twice', JSON.stringify(careerMonthGoal()) === JSON.stringify(g));
    check('the low divisions are asked for a cut', g.type === 'cut', g.type);
    check('the bonus is a month of the wage',
          g.bonus === Math.max(100, Math.round(1200/careerWagePaydays().length/10)*10), String(g.bonus));
    out.notes.d4 = g.type + ' $' + g.bonus;

    // Division 1 is asked for a finish worth printing.
    fresh(1);
    const g1 = careerMonthGoal();
    check('Division 1 is asked for a placing', g1.type === 'place' && g1.n <= 10,
          g1.type + ' ' + g1.n);
    out.notes.d1 = g1.type + ' ' + g1.n;

    // A result inside the month meets it, and the money lands once.
    fresh(4);
    const goal = careerMonthGoal();
    check('nothing is met on an empty month', careerMonthGoalMet() === false);
    CAREER.career.log.push({season:1, day:'2026-02-17', div:4, place:12, of:500,
                            kind:'cup', passed:true, prize:0});
    check('a cut inside the month meets it', careerMonthGoalMet() === true);
    const paid = careerMonthGoalCheck();
    check('and it pays the bonus', paid === goal.bonus, String(paid));
    check('into the balance', CAREER.career.balance === goal.bonus, String(CAREER.career.balance));
    check('once', careerMonthGoalCheck() === 0);

    // Last month's result does not pay this month's bonus.
    fresh(4);
    CAREER.career.log.push({season:1, day:'2026-01-20', div:4, place:3, of:500,
                            kind:'cup', passed:true, prize:0});
    check('a result from another month does not count', careerMonthGoalMet() === false);

    // And the clock moving is what judges it, which is where every runner ends.
    fresh(4);
    CAREER.career.log.push({season:1, day:'2026-02-11', div:4, place:9, of:500,
                            kind:'cup', passed:true, prize:0});
    careerAdvanceTo('2026-02-12');
    check('advancing the day pays it', CAREER.career.balance > 0, String(CAREER.career.balance));
    out.notes.paidOnAdvance = CAREER.career.balance;
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsmg-'));
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
console.log('a club asks for something every month, and pays for it');
fs.rmSync(dir, { recursive: true, force: true });
