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
    /* С 20.10 (его «пусть сам выбирает реалистичные цели… FNCS там или квал FNCS») — три цели из календаря
       месяца: надёжная / средняя / амбициозная, бонус ×1/×2/×4 от месячной ставки; засчитывается с дня выбора;
       не выбрал до вечера — клуб ставит среднюю (careerMonthGoalCheck). */
    const base = Math.max(100, Math.round(1200/careerWagePaydays().length/10)*10);
    fresh(4);
    const g = careerMonthGoal();
    check('a club offers three goals', !!g && Array.isArray(g.opts) && g.opts.length === 3, g && JSON.stringify(g.opts));
    check('and asks the same thing twice', JSON.stringify(careerMonthGoal()) === JSON.stringify(g));
    check('nothing is picked yet', g.pick === null);
    check('the bonus grows with the goal', g.opts[0].bonus === Math.round(base/10)*10 && g.opts[1].bonus === Math.round(base*2/10)*10 && g.opts[2].bonus === Math.round(base*4/10)*10,
          g.opts.map(o=>o.bonus).join('/'));
    check('every goal is from the calendar or any event', g.opts.every(o=>['cash','fncsCup','fncsFinal','majorQual','majorFinal','solo','any'].indexOf(o.cat)>=0), g.opts.map(o=>o.cat).join(','));
    out.notes.d4 = g.opts.map(o=>o.type+':'+o.cat+':'+(o.n||'')).join(' | ');

    fresh(1);
    const g1 = careerMonthGoal();
    check('Division 1 gets an FNCS goal among the three', g1.opts.some(o=>/^fncs|^major/.test(o.cat)), g1.opts.map(o=>o.cat).join(','));
    out.notes.d1 = g1.opts.map(o=>o.type+':'+o.cat+':'+(o.n||'')).join(' | ');

    // Строка журнала, которая выполняет вариант o: вид по ccMgCat, место или проход.
    const rowFor = (o, day) => {
      const kind = {cash:'victory', fncsCup:undefined, fncsFinal:'final', majorQual:'major', majorFinal:'major', solo:'solo', any:'victory'}[o.cat];
      const r = {season:1, day:day, div:4, place:(o.type==='place' ? o.n : 30), of:500, passed:true, prize:0};
      if(kind) r.kind = kind;
      if(o.cat==='majorFinal') r.stage='final'; if(o.cat==='majorQual') r.stage='heats';
      return r;
    };

    fresh(4);
    const goal = careerMonthGoal();
    CAREER.career.log.push(rowFor(goal.opts[0], '2026-02-05'));
    check('nothing counts before a pick', careerMonthGoalMet() === false);
    careerMonthGoalPick(0, true);
    check('a result from before the pick does not count', careerMonthGoalMet() === false);
    CAREER.career.log.push(rowFor(goal.opts[0], '2026-02-17'));
    check('a result after the pick meets it', careerMonthGoalMet() === true);
    const paid = careerMonthGoalCheck();
    check('and it pays the bonus', paid === goal.opts[0].bonus, String(paid));
    check('into the balance', CAREER.career.balance === goal.opts[0].bonus, String(CAREER.career.balance));
    check('once', careerMonthGoalCheck() === 0);

    fresh(4);
    careerMonthGoal();
    CAREER.career.log.push(Object.assign(rowFor(careerMonthGoal().opts[1], '2026-01-20')));
    careerMonthGoalCheck();
    check('nobody picked — the club sets the middle one', careerMonthGoal().pick === 1, String(careerMonthGoal().pick));
    check('a result from another month does not count', careerMonthGoalMet() === false);

    fresh(4);
    const gm = careerMonthGoal();
    CAREER.career.log.push(rowFor(gm.opts[1], '2026-02-11'));
    careerAdvanceTo('2026-02-12');
    check('advancing the day picks the middle one and pays it', CAREER.career.balance === gm.opts[1].bonus, String(CAREER.career.balance));
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
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a club asks for something every month, and pays for it');
fs.rmSync(dir, { recursive: true, force: true });
