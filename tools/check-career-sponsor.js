// Followers are worth money, and thirty is the retirement age.
//
// The audience grew off streams and results and was read by nothing but a
// club's wage offer, so a stream day cost a day of training and bought nothing
// spendable. A sponsor is what it is worth: a rung of CC_SPONSORS read off the
// follower count (девять брендов с 23 августа, было три архетипа), paid on the
// nights there is a stream to put the slot in — and below Division 1, where the
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
  /* Ступень лесенки по охвату — тем же правилом, каким её берёт ccSponsorOffer.
     Раньше здесь стояли имена архетипов ('gear', 'isp', 'brand'); 23 августа
     спонсоров стало девять и у каждого своё имя, а проверка осталась мерить
     трёх — и падала на первом же careerSignSponsor, потому что подписать
     несуществующий id нельзя. Читаем ступень с самой лесенки: тогда добавление
     десятого бренда ничего здесь не ломает. */
  const tier = reach => CC_SPONSORS.filter(s => reach >= s.need).slice(-1)[0] || null;
  try {
    const fresh = (reach, div) => { CAREER = {player:{nick:'Probe', ovr:70, region:'EU',
      role:'roleIGL', country:'de', age:16, attrs:ccRookieAttrs(70,'roleIGL')},
      career:{season:1, day:'2026-01-05', division:div||4, balance:0, earnings:0, wages:0,
              reach:reach, log:[], news:[]}, partner:null, gear:{own:[], train:0}};
      // A brand is sold to now, not attracted: an offer only exists while
      // somebody is out there working the brands. See CC_MARKETING. The plain
      // one, so the rate is the audience's own and nothing is multiplied.
      CAREER.mkt = {id:'probe', name:'Probe', at:null, photo:null, cost:0, rate:1,
                    from:'2026-01-05', until:'2026-12-31'}; };

    // Without one, nothing is on the table however big the audience is.
    fresh(200000);
    CAREER.mkt = null;
    check('no marketing manager, no offer', ccSponsorOffer() === null);
    check('and nothing can be signed', careerSignSponsor(tier(200000).id) === false);

    // Nobody offers to an unknown career.
    fresh(0);
    check('an unknown career has no offer', ccSponsorOffer() === null);
    check('and cannot sign one anyway', careerSignSponsor(CC_SPONSORS[0].id) === false);

    // Each tier opens on its own follower count.
    fresh(10000);
    check('ten thousand brings its rung', (ccSponsorOffer()||{}).id === tier(10000).id);
    fresh(50000);
    check('fifty thousand brings the provider', (ccSponsorOffer()||{}).id === tier(50000).id);
    fresh(150000);
    check('a hundred and fifty brings a higher rung', (ccSponsorOffer()||{}).id === tier(150000).id);

    /* Signing pays per stream night, not per month.

       It used to be a cheque on the first for a follower count that goes up on
       its own, which made it the second thing converting an audience into money
       and the worse of the two: nothing anybody decided. A brand buys a slot in
       front of an audience, and the slot exists on the nights there is a
       stream. */
    fresh(50000, 4);
    check('signing works', careerSignSponsor(tier(50000).id) === true);
    // A save signed under the old name still finds its deal.
    CAREER.sponsor.id = 'drink';
    check('an old save keeps its deal', (ccSponsor()||{}).id === tier(50000).id);
    check('and it is the one working', (ccSponsor()||{}).id === tier(50000).id);
    const idle = CAREER.career.balance;
    // A month in which nobody streamed: a brand pays for slots, and there were
    // none.
    careerAdvanceTo('2026-02-05');
    out.notes.monthIdle = CAREER.career.balance - idle;
    check('a month with no streams pays no brand',
          CAREER.career.balance === idle, String(CAREER.career.balance - idle));
    // And a night that does stream pays the slot on top of the subs — и донаты
    // с эфира: с 22 августа у стрима свой твич и своя аудитория в комнате
    // (пункт 8 страницы «ы»), и её донаты падают в тот же баланс. Твич берётся
    // ДО эфира: сам эфир его растит.
    const before = CAREER.career.balance;
    const twBefore = CAREER.career.twitch || 0;
    careerDoAct('stream');
    const paid = CAREER.career.balance - before;
    out.notes.streamPaid = paid;
    const subs = Math.round(careerReach() / CC_STREAM_PER);
    const viewers = Math.max(3, Math.round(twBefore * 0.06 + careerReach() * 0.008));
    const dono = Math.round(viewers * 0.04);
    out.notes.streamParts = {subs: subs, slot: ccSponsor().pay, dono: dono};
    check('a stream night pays the subs, the slot and the donations',
          paid === subs + ccSponsor().pay + dono,
          paid + ' vs ' + JSON.stringify(out.notes.streamParts));
    check('and the tile counts what the brand paid',
          CAREER.sponsor.paid === ccSponsor().pay, String(CAREER.sponsor.paid));
    check('the sponsor money is kept apart from the club wage',
          CAREER.career.sponsored === ccSponsor().pay && !CAREER.career.wages,
          CAREER.career.sponsored + ' / ' + CAREER.career.wages);

    /* ---- the slot is priced on the people in front of it ------------------ */
    // His words, 17 August: they offer very little. They did, and they went on
    // offering the same very little - the fee was written next to a tier, so
    // four times the audience was the same cheque.
    fresh(10000, 3);
    const rate = r => { CAREER.career.reach = r; return (ccSponsorOffer()||{}).pay; };
    const curve = [10000, 25000, 49000].map(rate);
    out.notes.gearCurve = curve;
    check('a bigger audience is worth a bigger slot',
          curve[0] < curve[1] && curve[1] < curve[2], JSON.stringify(curve));
    check('and the first deal is not an insult', curve[0] >= 50, String(curve[0]));
    // The tier is a ceiling as well as a doorway, so a channel that grows into
    // the millions does not quietly out-earn the whole of Division 1.
    CAREER.career.reach = 5000000;
    check('a brand deal has a top', (ccSponsorOffer()||{}).pay === tier(5000000).cap,
          String((ccSponsorOffer()||{}).pay));
    // A signed deal keeps the rate it was signed at, because that is a deal.
    fresh(20000, 3);
    careerSignSponsor(tier(20000).id);
    const signed = ccSponsor().pay;
    CAREER.career.reach = 40000;
    check('a signed rate does not drift with the audience',
          ccSponsor().pay === signed, signed + ' -> ' + ccSponsor().pay);
    // But somebody writes again once it has been outgrown by a clear margin.
    check('and growing brings a better offer from the same brand',
          (ccSponsorOffer()||{}).pay >= signed * CC_AD_STEP,
          signed + ' vs ' + JSON.stringify(ccSponsorOffer()));
    CAREER.career.reach = 21000;
    check('a rate barely better than the signed one is not news',
          ccSponsorOffer() === null, JSON.stringify(ccSponsorOffer()));

    // An audience that outgrows its deal gets the better one offered.
    fresh(50000, 4);
    careerSignSponsor(tier(50000).id);
    CAREER.career.reach = 150000;
    check('outgrowing the deal brings a better one', (ccSponsorOffer()||{}).id === tier(150000).id);
    CAREER.career.reach = 50000;
    check('and a smaller one is not offered back', ccSponsorOffer() === null);

    // A club pays on the first and a brand pays on the night, and the two
    // land in one balance without being the same money.
    fresh(150000, 1);
    careerSignSponsor(tier(150000).id);
    CAREER.org = {name:'FOKUS', tier:88, salary:1200, goal:{type:'place',target:20},
                  since:1, paid:0};
    const b2 = CAREER.career.balance;
    careerAdvanceTo('2026-02-05');
    // A monthly wage is a month's money. It used to be divided by the year's
    // paydays before any of it was handed over, so a club that said 1200 a month
    // paid a hundred and nine - which is what 'they offer very little' was.
    const clubMonth = 1200;
    check('the club pays on the first and the brand does not',
          CAREER.career.balance - b2 === clubMonth,
          (CAREER.career.balance - b2) + ' vs ' + clubMonth);
    careerDoAct('stream');
    out.notes.bothPaid = CAREER.career.balance - b2;
    check('and each source is counted where it belongs',
          CAREER.career.wages === clubMonth && CAREER.career.sponsored === ccSponsor().pay,
          CAREER.career.wages + ' / ' + CAREER.career.sponsored);
    const tile = careerSponsorTileHTML();
    check('the tile names the deal', tile.indexOf(L()['ccSponsor'+tier(150000).id]) >= 0);
    fresh(0);
    // Первая ступень лесенки, а не «10 000» словом: их девять, и нижняя
    // с 23 августа — пять тысяч.
    check('and with no deal it says what would bring one',
          careerSponsorTileHTML().indexOf(ccFollowers(CC_SPONSORS[0].need)) >= 0,
          ccFollowers(CC_SPONSORS[0].need));

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
