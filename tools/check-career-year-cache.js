// Календарь принадлежит той карьере, которая открыта сейчас.
//
// careerYearDays строит весь год один раз и держит в CC_YEAR_DAYS: хаб
// спрашивает его на каждой перерисовке. Две строки года читают саму карьеру —
// имя Виктори Капа (дуо или трио) и город ЛАНа (свой на каждый сезон). Кэш
// сбрасывался на смене языка и на смене сезона, а на смене КАРЬЕРЫ не
// сбрасывался: сейв, открытый из списка слотов, мимо careerNewSeason не идёт.
//
// Его скрин, 25 августа: «ТРИО ВИКТОРИ КАП 1», а строкой ниже «ДУО · ДИВИЗИОН
// 1». Подпись осталась от предыдущей карьеры, слово рядом читалось живьём.
// Его пометка: «дуо играю режим».
//
//   node tools/check-career-year-cache.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
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
  const seed = (size, season) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:season, day:'2026-03-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:size},
      partners:[]
    }));
    careerLoad();
  };
  // Все подписи года одной строкой — по ним и видно, чей это календарь.
  const labels = () => {
    const all = [];
    careerYearDays().forEach(list => list.forEach(e => all.push(e.label)));
    return all;
  };
  const has = (arr, s) => arr.some(x => String(x).indexOf(s) >= 0);
  try {
    // ---- трио-карьера строит год, и он трио --------------------------------
    seed(3, 1);
    const trio = labels();
    out.notes.trioName = ccVictoryCupName();
    out.notes.trioCity = ccLanCity('globals');
    check('трио-карьера называет кап по-своему',
          has(trio, L().calVictoryTrio), out.notes.trioName);
    check('и дуо-имени в её календаре нет', !has(trio, L().calVictoryDuo));

    // ---- следом открывается дуо-карьера ------------------------------------
    // Ровно то, что делает список слотов: careerLoad без смены сезона.
    seed(2, 1);
    const duo = labels();
    out.notes.duoName = ccVictoryCupName();
    check('дуо-карьера называет кап дуо', ccVictoryCupName() === L().calVictoryDuo,
          ccVictoryCupName());
    check('и календарь говорит то же самое',
          has(duo, L().calVictoryDuo), duo.filter(s => /Victory|Виктори/.test(s)).join(' | '));
    check('трио-подпись из прошлой карьеры не осталась',
          !has(duo, L().calVictoryTrio),
          duo.filter(s => String(s).indexOf(L().calVictoryTrio) >= 0).join(' | '));

    // ---- и обратно ---------------------------------------------------------
    seed(3, 1);
    check('обратно тоже перестраивается',
          has(labels(), L().calVictoryTrio) && !has(labels(), L().calVictoryDuo));

    // ---- город ЛАНа — вторая строка, читающая карьеру ----------------------
    // Сезон другой — город другой; календарь обязан назвать город ЭТОГО сейва.
    seed(2, 1);
    const c1 = ccLanCity('globals'), l1 = labels();
    seed(2, 4);
    const c4 = ccLanCity('globals'), l4 = labels();
    out.notes.cities = [c1, c4];
    check('сезоны разводят город', c1 !== c4, c1 + ' / ' + c4);
    check('и календарь первого сейва назвал его город', has(l1, c1), c1);
    check('и календарь второго — свой', has(l4, c4), c4);
    check('чужой город в календаре не остался', !has(l4, c1), c1 + ' in season 4');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsyearcache-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the calendar belongs to the career that is open');
fs.rmSync(dir, { recursive: true, force: true });
