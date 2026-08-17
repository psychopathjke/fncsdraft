// A LAN is not in the same country two years running, or three.
//
// His question, 17 August, and then his instruction three times over: the career
// replays the measured 2026 calendar every season, so a player in their eighth
// year had flown to Düsseldorf and Antwerp eight times each. A new city is not
// enough, because Lyon after Paris is still France. And the cities do not have to
// be ones the circuit has already visited — Japan, Serbia, and wherever else a
// hall and a crowd exist.
//
// So: season one is what really happened and never moves, which is the line he
// finished on — главное чтоб первый год был как в реальной жизни. Every season
// after it draws three of twenty-one countries, none of which held anything in
// the last two seasons, and then a city inside each. Nine of the rooms are real
// ones — New York 2019, Raleigh 2022, Copenhagen 2023, Fort Worth 2024, Lyon
// 2025, Düsseldorf and Antwerp 2026, Paris for the Reload Championship, Riyadh
// for the Esports World Cup — and the rest are his.
//
//   node tools/check-career-lan.js
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
    CAREER = {player:{nick:'Probe', ovr:80, ovrExact:80, region:'EU', role:'roleIGL',
                      country:'de', age:18, attrs:ccRookieAttrs(80,'roleIGL')},
      career:{season:1, day:'2026-05-29', division:1, earnings:0, balance:0,
              tokens:[], log:[], news:[]}, dms:[], partner:null};

    // ---- the first year is the one that was measured -----------------------
    check('the Summit is in Düsseldorf', ccLanHostKey('summit', 1) === 'Dus');
    check('the Global Championship is in Antwerp', ccLanHostKey('globals', 1) === 'Ant');
    check('and the Reload Championship is in Paris', ccLanHostKey('rc', 1) === 'Par');

    // ---- and then it moves --------------------------------------------------
    const years = [];
    for (let s = 1; s <= 12; s++)
      years.push({s: s, summit: ccLanHostKey('summit', s), globals: ccLanHostKey('globals', s),
                  rc: ccLanHostKey('rc', s)});
    const natsOf = y => ['summit','globals','rc'].map(k => ccLanNat(k, y.s));
    out.notes.years = years.map(y => y.s + ': ' + y.summit + ' / ' + y.globals + ' / ' + y.rc +
                                     '  (' + natsOf(y).join(' ') + ')');
    // His rule, 17 August: a new country every year, not merely a new city — and
    // with twenty-one of them in the pool the memory reaches back two seasons.
    for (let i = 1; i < years.length; i++) {
      const now = natsOf(years[i]);
      const was = [];
      for (let b = 1; b <= CC_LAN_LOOKBACK && i - b >= 0; b++) was.push.apply(was, natsOf(years[i-b]));
      check('a year does not go back to a country it has just been in',
            now.every(n => was.indexOf(n) < 0),
            'season ' + years[i].s + ': ' + now.join(',') + ' after ' + was.join(','));
    }
    years.forEach(function(y){
      const three = [y.summit, y.globals, y.rc];
      check('three events in a year are three cities',
            new Set(three).size === 3, 'season ' + y.s + ': ' + three.join(','));
      check('and three countries',
            new Set(natsOf(y)).size === 3, 'season ' + y.s + ': ' + natsOf(y).join(','));
      three.forEach(function(k){
        check('every city is one the pool holds',
              CC_LAN_HOSTS.some(h => h.key === k), k);
      });
    });
    // Over a dozen seasons the pool is actually used rather than three cities
    // being shuffled between three events.
    const seen = new Set();
    years.forEach(y => { seen.add(y.summit); seen.add(y.globals); seen.add(y.rc); });
    out.notes.citiesSeen = seen.size;
    check('and the pool is not a handful of cities in a loop', seen.size >= 12, String(seen.size));
    // The first year is the one that really happened, and stays that way however
    // wide the pool gets — his line, 17 August: главное чтоб первый год был как в реальной жизни.
    check('season one is still the measured year',
          years[0].summit === 'Dus' && years[0].globals === 'Ant' && years[0].rc === 'Par',
          JSON.stringify(years[0]));

    // ---- a save reads the same twice ---------------------------------------
    check('the draw is the season, not the moment',
          ccLanHostKey('globals', 7) === ccLanHostKey('globals', 7));

    // ---- and the words follow it -------------------------------------------
    CAREER.career.season = 4;
    const city = ccLanCity('globals');
    out.notes.season4 = {city: city, inCity: ccLanCityIn('globals'),
                         label: ccYearLabel('GlobalChampionship', '2026-09-26', '2026-09-26')};
    check('the city has a name in this language', !!city && city.length > 2, String(city));
    check('and the calendar row carries it',
          out.notes.season4.label.indexOf(city) >= 0, out.notes.season4.label);
    check('so does the line that says who goes',
          L().ccGlobLocked(city).indexOf(city) >= 0);
    check('and the one that congratulates you',
          L().ccCongratsGlobals(ccLanCityIn('globals')).indexOf(ccLanCityIn('globals')) >= 0);
    // Nothing left holding last year's city by hand.
    check('no sentence still says Antwerp on its own',
          String(L().ccGlobLocked(city)).indexOf('Антверпен') < 0 &&
          String(L().ccGlobLocked(city)).indexOf('Antwerp') < 0,
          L().ccGlobLocked(city));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncslan-'));
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
console.log('the LAN moves every year, and the first year is the one that happened');
fs.rmSync(dir, { recursive: true, force: true });
