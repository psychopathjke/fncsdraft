// Followers are worth money, and thirty is the retirement age.
//
// The audience grew off streams and results and was read by nothing but a
// club's wage offer, so a stream day cost a day of training and bought nothing
// spendable. A sponsor is what it is worth: three tiers on the follower count,
// paid monthly on the same day wages land — and below Division 1, where the
// ladder pays nothing at all, it is the first money a career ever sees.
//
//   node tools/check-career-sponsor.js
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
    const fresh = (reach, div) => { CAREER = {player:{nick:'Probe', ovr:70, region:'EU',
      role:'roleIGL', country:'de', age:16, attrs:ccRookieAttrs(70,'roleIGL')},
      career:{season:1, day:'2026-01-05', division:div||4, balance:0, earnings:0, wages:0,
              reach:reach, log:[], news:[]}, partner:null, gear:{own:[], train:0}}; };

    // Nobody offers to an unknown career.
    fresh(0);
    check('an unknown career has no offer', ccSponsorOffer() === null);
    check('and cannot sign one anyway', careerSignSponsor('gear') === false);

    // Each tier opens on its own follower count.
    fresh(10000);
    check('ten thousand brings the gear brand', (ccSponsorOffer()||{}).id === 'gear');
    fresh(50000);
    check('fifty thousand brings the provider', (ccSponsorOffer()||{}).id === 'isp');
    fresh(150000);
    check('a hundred and fifty brings the brand', (ccSponsorOffer()||{}).id === 'brand');

    // Signing pays monthly, through the same payday the wages use.
    fresh(50000, 4);
    check('signing works', careerSignSponsor('isp') === true);
    // A save signed under the old name still finds its deal.
    CAREER.sponsor.id = 'drink';
    check('an old save keeps its deal', (ccSponsor()||{}).id === 'isp');
    check('and it is the one working', (ccSponsor()||{}).id === 'isp');
    const before = CAREER.career.balance;
    // A month of the career year, with no club at all: every cent is the
    // sponsor's, which is the point below Division 1.
    careerAdvanceTo('2026-02-05');
    const paid = CAREER.career.balance - before;
    out.notes.monthPaid = paid;
    check('a month pays the fee with no club', paid === 1200, String(paid));
    check('and the tile counts it', CAREER.sponsor.paid === paid, String(CAREER.sponsor.paid));
    check('the sponsor money is kept apart from the club wage',
          CAREER.career.sponsored === paid && !CAREER.career.wages,
          CAREER.career.sponsored + ' / ' + CAREER.career.wages);

    // An audience that outgrows its deal gets the better one offered.
    CAREER.career.reach = 150000;
    check('outgrowing the deal brings a better one', (ccSponsorOffer()||{}).id === 'brand');
    CAREER.career.reach = 50000;
    check('and a smaller one is not offered back', ccSponsorOffer() === null);

    // A club and a sponsor both pay, and the tile draws.
    fresh(150000, 1);
    careerSignSponsor('brand');
    CAREER.org = {name:'FOKUS', tier:88, salary:1200, goal:{type:'place',target:20},
                  since:1, paid:0};
    const b2 = CAREER.career.balance;
    careerAdvanceTo('2026-02-05');
    out.notes.bothPaid = CAREER.career.balance - b2;
    // The club's own month is its season salary split over the year's paydays.
    const clubMonth = Math.round(1200 / careerWagePaydays().length);
    check('and each source is counted where it belongs',
          CAREER.career.wages === clubMonth && CAREER.career.sponsored === 4000,
          CAREER.career.wages + ' / ' + CAREER.career.sponsored);
    check('the club and the sponsor both pay',
          CAREER.career.balance - b2 === 4000 + clubMonth,
          (CAREER.career.balance - b2) + ' vs ' + (4000 + clubMonth));
    const tile = careerSponsorTileHTML();
    check('the tile names the deal', tile.indexOf(L().ccSponsorbrand) >= 0);
    fresh(0);
    check('and with no deal it says what would bring one',
          careerSponsorTileHTML().indexOf('10') >= 0);

    // ---- the audience follows results, not only streams -----------------
    // The curve used to be cubed, which paid for a near-win and nothing else:
    // a Division 5 night in the middle of the room was worth less than a day
    // of streaming. A good night should beat a day at the desk.
    fresh(0);
    const stream = CC_REACH_DIV(5);
    check('a Division 5 win beats a stream day',
          careerReachResult(1, 1000, 5) > stream * 5,
          careerReachResult(1, 1000, 5) + ' vs ' + stream);
    check('and so does making the cut',
          careerReachResult(80, 1000, 5) > stream * 5,
          String(careerReachResult(80, 1000, 5)));
    check('a third of the way up still pays something',
          careerReachResult(333, 1000, 5) >= stream * 3,
          String(careerReachResult(333, 1000, 5)));
    check('the middle of the room pays little',
          careerReachResult(500, 1000, 5) < stream * 3,
          String(careerReachResult(500, 1000, 5)));
    check('and the bottom pays nothing at all',
          careerReachResult(1000, 1000, 5) === 0,
          String(careerReachResult(1000, 1000, 5)));
    // A rung is the thing people follow you for.
    fresh(0);
    const wasReach = careerReach();
    careerReachPromote(4);
    check('a promotion is worth a fortnight of streaming',
          careerReach() - wasReach === CC_REACH_DIV(4) * 12,
          String(careerReach() - wasReach));
    // What an event is worth is what its money says: a night at the Victory
    // Cup is half a cup, a Major final five, Paris eight.
    check('a cup win is worth more than a Victory Cup night',
          careerReachResult(1, 150, 1, 'cup') > careerReachResult(1, 150, 1, 'victory'));
    check('a Major final is worth more than a cup',
          careerReachResult(1, 150, 1, 'major') > careerReachResult(1, 150, 1, 'cup') * 4);
    check('and Paris is the loudest night of the year',
          careerReachResult(1, 40, 1, 'rc') > careerReachResult(1, 150, 1, 'major'));
    out.notes.events = {cupD5: careerReachResult(1, 1000, 5, 'cup'),
      cupD1: careerReachResult(1, 150, 1, 'cup'),
      wf: careerReachResult(1, 50, 1, 'final'),
      victory: careerReachResult(1, 4200, 1, 'victory'),
      major: careerReachResult(1, 150, 1, 'major'),
      paris: careerReachResult(1, 40, 1, 'rc')};

    // Division 1 is not a room anybody is in unread.
    fresh(0); CAREER.career.division = 2;
    careerReachPromote(1);
    check('arriving in Division 1 tops the count up', careerReach() >= CC_REACH_D1,
          String(careerReach()));
    // A career that was already bigger keeps what it had.
    fresh(60000); CAREER.career.division = 2;
    careerReachPromote(1);
    check('and a bigger audience is not cut back to it', careerReach() > CC_REACH_D1,
          String(careerReach()));
    out.notes.d1floor = CC_REACH_D1;
    out.notes.reach = {win: careerReachResult(1, 1000, 5), cut: careerReachResult(80, 1000, 5),
                       third: careerReachResult(333, 1000, 5), stream: stream,
                       promote: CC_REACH_DIV(4) * 12};

    // ---- retirement at thirty -------------------------------------------
    check('the retirement age is thirty', careerRetireAge() === 30, String(careerRetireAge()));
    fresh(0); CAREER.player.age = 29;
    check('at twenty-nine a career carries on', careerMayRetire() === false);
    CAREER.player.age = 30;
    check('at thirty it may end', careerMayRetire() === true);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsspon-'));
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
console.log('an audience pays, and a career may end at thirty');
fs.rmSync(dir, { recursive: true, force: true });
