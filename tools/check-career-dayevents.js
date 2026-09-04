// A day that arrives with something on it.
//
// The day loop was seven buttons and no events: every day the same seven and
// the optimum obvious. About one free day in six now carries an offer — a
// stronger duo short a player, a showmatch, a sponsor wanting a video, the
// line going down — with two answers, both of which spend the day. Drawn on
// the date, so opening the same day twice offers the same thing.
//
//   node tools/check-career-dayevents.js
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
    const fresh = () => { CAREER = {player:{nick:'Probe', ovr:70, region:'EU', role:'roleIGL',
      country:'de', age:16, attrs:ccRookieAttrs(70,'roleIGL')},
      career:{season:1, day:CC_YEAR_FROM, division:3, balance:0, earnings:0, reach:60000,
              energy:CC_ENERGY_DAY, did:{}, log:[], news:[], school:'in'},
      partners:[{card:{handle:'Mate', region:'EU', tier:'ranked', rating:70, _targetOvr:70,
                     _attrs:ccRookieAttrs(70,'roleFRG')}, patience:60}],
      gear:{own:[], train:0}, sponsor:{id:'drink', since:1, paid:0}}; };

    // How often, and only on days the calendar leaves alone.
    /* Бросок дня теперь случайный (cr.luck, его правка 23 августа: «может в
       случайно день эти события пусть происходят»), и одного года мало: на
       163 свободных днях доля гуляет на ±3 события чистым шумом. Год
       проходится двенадцать раз — каждый проход кидает заново — и доля
       встаёт на место. Порог не двигаем, двигаем выборку. */
    fresh();
    /* Кастомка приходит только тем, кого зовут: порог по PR (CC_CUSTOM_PR) —
       это и есть её условие, ровно как у промо условие «есть спонсор». Чтобы
       проверка ниже видела все виды, у пробной карьеры PR набран. */
    careerPrTally().rows[CAREER.player.nick] = {v: [[CC_CUSTOM_PR + 5000, 5]], n: 1, you: true};
    let free = 0, withEv = 0, onEventDay = 0;
    const kinds = {};
    for (let pass = 0; pass < 12; pass++)
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1)) {
      CAREER.career.day = d;
      const busy = (careerYearDays().get(d)||[]).length > 0;
      const ev = ccDayEventOn(d);
      if (busy) { if (ev) onEventDay++; continue; }
      free++;
      if (ev) { withEv++; kinds[ev.id] = (kinds[ev.id]||0) + 1; }
    }
    out.notes.free = free; out.notes.withEv = withEv; out.notes.kinds = kinds;
    check('nothing lands on a tournament day', onEventDay === 0, String(onEventDay));
    check('about one free day in six carries something',
          Math.abs(withEv/free - 1/6) < 0.05, (withEv/free).toFixed(3));
    /* Виды с условием (when) и принудительные (forced) в жребии не участвуют
       или гаснут без своего условия — их проверяют ниже по одному. Здесь —
       всё, что приходит просто так. */
    const plain = CC_DAY_EVENTS.filter(e => !e.forced && !e.when).map(e => e.id);
    check('and every plain kind shows up', plain.every(id => kinds[id] > 0),
          JSON.stringify(kinds));

    /* Развилки с условием, 3 сентября: у каждой своё «когда». Условие
       выставляется руками, бросок подсаживается, и событие обязано прийти —
       а без условия обязано не прийти. */
    const gated = CC_DAY_EVENTS.filter(e => !e.forced && typeof e.when === 'function');
    const arrange = {
      mateSpot: () => { CAREER.career.spots = {m2:[{i:3, aura:2, won:1, day:CC_YEAR_FROM}]}; },
      orgLate:  () => { CAREER.org = {name:'Probe Org', salary:500, goal:{type:'promote', target:2}, since:1, paid:0}; },
      leak:     () => { CAREER.org = {name:'Probe Org', salary:500, goal:{type:'promote', target:2}, since:1, paid:0}; },
      house:    () => { CAREER.career.reach = 60000; },
      coachFree:() => { CAREER.coach = null; },
      tilt:     () => { CAREER.career.log.push({season:1, day:ccAddDays(someFree(), -1), div:3, place:40, of:50, kind:'cup', pts:10}); }
    };
    const disarm = {
      mateSpot: () => { CAREER.career.spots = {}; },
      orgLate:  () => { CAREER.org = null; },
      leak:     () => { CAREER.org = null; },
      house:    () => { CAREER.career.reach = 100; },
      coachFree:() => { CAREER.coach = {id:CC_COACHES[0].id, until:'2099-01-01'}; },
      tilt:     () => { CAREER.career.log = []; }
    };
    function someFree(){ for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1))
      if (!(careerYearDays().get(d)||[]).length) return d; return CC_YEAR_FROM; }
    gated.forEach(e => {
      fresh(); const d = someFree(); CAREER.career.day = d;
      if (arrange[e.id]) arrange[e.id]();
      CAREER.career.luck = {day:d, woe:null, ev:e.id};
      check('gated "' + e.id + '" arrives when its condition holds',
            (ccDayEventOn(d)||{}).id === e.id, JSON.stringify(ccDayEventOn(d)||null));
      fresh(); CAREER.career.day = d;
      if (disarm[e.id]) disarm[e.id]();
      CAREER.career.luck = {day:d, woe:null, ev:e.id};
      check('and stays away without it: ' + e.id, ccDayEventOn(d) === null);
    });
    check('every gated kind has an arrangement here',
          gated.every(e => arrange[e.id] && disarm[e.id]), gated.map(e => e.id).join(','));

    /* Школа приходит по делу: шестнадцать лет, вопрос не задан — первый же
       свободный день, и только один раз. Ответ снимает его навсегда. */
    fresh(); delete CAREER.career.school;
    const d0 = someFree(); CAREER.career.day = d0;
    check('a sixteen-year-old is asked about school on the first free day',
          (ccDayEventOn(d0)||{}).id === 'school');
    careerRenderHub = function(){};
    check('answering it works', careerDayEvent('school', 'online') === true);
    check('and the answer is written down', CAREER.career.school === 'online');
    const d1 = ccAddDays(d0, 1); CAREER.career.day = d1;
    check('and the question does not come back', (ccDayEventOn(d1)||{}).id !== 'school');
    check('online school costs five, not ten', ccSchoolCap(16) === 5);
    CAREER.career.school = 'out';
    check('dropping out costs nothing', ccSchoolCap(16) === 0);
    fresh();

    // The same day offers the same thing, twice: the roll is stored in
    // cr.luck, not thrown again on every open.
    const someDay = (() => { for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1)) {
      CAREER.career.day = d; if (ccDayEventOn(d)) return d; } return null; })();
    CAREER.career.day = someDay;
    check('a day carries the same offer every time it is opened',
          ccDayEventOn(someDay).id === ccDayEventOn(someDay).id);
    out.notes.someDay = someDay + ' ' + ccDayEventOn(someDay).id;

    // The hub is not open in this probe, so the redraw at the end of a choice
    // has nothing to draw into: stub it the way the other harnesses do.
    careerRenderHub = function(){};

    // Taking one spends the day and pays what it says. КАКОЙ день приносит
    // оффер — теперь случайность; ЧТО делает взятый оффер — нет. Поэтому
    // бросок подсаживается в cr.luck руками, и меряется механика.
    const ev = CC_DAY_EVENTS.find(e => e.id === 'show');
    fresh(); CAREER.career.day = someDay;
    CAREER.career.luck = {day:someDay, woe:null, ev:'show'};
    check('the planted offer is on the day',
          (ccDayEventOn(someDay)||{}).id === 'show');
    const beforeE = careerEnergy(), beforeCash = CAREER.career.balance;
    check('taking it works', careerDayEvent(ev.id, true) === true);
    check('and the day is spent', careerDayDone() === true);
    check('so nothing else can be done today', careerDoAct('aimlab') === null);
    if (ev.take.energy) check('it costs the energy it says',
      careerEnergy() === beforeE - ev.take.energy + (ev.take.restore||0), String(careerEnergy()));
    if (ev.take.cash) check('and pays the cash it says',
      CAREER.career.balance === beforeCash + ev.take.cash, String(CAREER.career.balance));

    // Turning one down also spends the day, and the offer is gone.
    fresh(); CAREER.career.day = someDay;
    CAREER.career.luck = {day:someDay, woe:null, ev:'show'};
    check('passing works', careerDayEvent(ev.id, false) === true);
    check('the day is spent either way', careerDayDone() === true);
    check('and the offer does not come back', ccDayEventOn(someDay) === null);

    // A stand-in offer needs a partner; a video needs a sponsor.
    fresh(); CAREER.partners = []; CAREER.sponsor = null;
    let scrim = 0, promo = 0;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1)) {
      CAREER.career.day = d;
      const e = ccDayEventOn(d);
      if (e && e.id === 'scrimup') scrim++;
      if (e && e.id === 'promo') promo++;
    }
    check('no partner, no stand-in offers', scrim === 0, String(scrim));
    check('no sponsor, no video requests', promo === 0, String(promo));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsdayev-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a day can arrive with something on it, and both answers spend it');
fs.rmSync(dir, { recursive: true, force: true });
