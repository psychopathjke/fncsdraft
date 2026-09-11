// Перемотка не должна молча съедать турниры, когда играть некем.
//
// Годовой прогон 11 сентября: у одной из двух карьер 19 марта ушёл напарник, и
// дальше она доехала до конца года одна — 60 турниров вместо 128. Каждый парный
// вечер перемотка спрашивала «можно ли играть», получала «нет, не с кем» и шагала
// дальше молча; узнать об этом можно было только по пустому журналу в октябре.
//
// Здесь проверяется само правило (ccFfNoMateWhy), а не цикл перемотки: цикл живёт
// в асинхронном коде с экранами, а правило — одна строка, и спросить её можно прямо.
//
//   node tools/check-ff-nomate.js
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
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Boss', age:22, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
              region:'EU', ovr:92, role:'roleIGL', attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0,
              photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-02', division:1, earnings:50000, balance:50000, reach:30000,
              tokens:[], log:[], news:[], size:2},
      gear:{own:[], conf:0}, partners:[]
    }));
    careerLoad();
    CARD_MODE = true; squadSize = 2;

    // ---- без напарника парный вечер называет причину ------------------------
    const cup = {type:'cup', id:'S40_FNCSDivisionalCup'};
    out.notes.short = careerMatesShort();
    check('без напарника состав неполон', careerMatesShort() > 0, String(careerMatesShort()));
    const why = ccFfNoMateWhy(cup);
    out.notes.why = why;
    check('перемотка встаёт с причиной', !!why, JSON.stringify(why));
    check('причина — та самая строка', why === L().ccFfNoMate, String(why));

    // ---- с напарником не встаёт ---------------------------------------------
    const pool = careerDuoSearchPool(true) || [];
    const pick = pool.find(p => p && p.handle);
    check('есть кого посадить', !!pick, String(pool.length));
    check('напарник сел', careerMateSeat({handle: pick.handle,
      cardRegion: (pick.card && pick.card.region) || 'EU', dev: 0, since: careerToday()}, 0));
    out.notes.mate = careerMates().map(m => m && m.handle);
    check('состав полон', careerMatesShort() === 0, String(careerMatesShort()));
    check('с напарником перемотка не встаёт', !ccFfNoMateWhy(cup), String(ccFfNoMateWhy(cup)));

    // ---- вечер, который и не требует пары, не останавливает ------------------
    /* Соло-серия играется одному: останавливать перемотку на ней было бы враньём. */
    CAREER.partners = [];
    check('соло не требует напарника', !ccFfNoMateWhy({type:'solo', id:'SoloSeries_Qualifier'}),
          String(ccFfNoMateWhy({type:'solo', id:'SoloSeries_Qualifier'})));
    check('пустой день ничего не говорит', !ccFfNoMateWhy(null));
    check('не-турнир ничего не говорит', !ccFfNoMateWhy({type:'free'}));
  } catch (e) { out.err = String(e && (e.stack || e.message) || e); }
  document.getElementById('__out').textContent = 'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ffnomate-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], {maxBuffer: 256 * 1024 * 1024, encoding: 'utf8'});
fs.rmSync(dir, {recursive: true, force: true});

const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('страница не ответила'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error('ОШИБКА: ' + out.err); process.exit(2); }
if (out.fails.length) { out.fails.forEach(f => console.log(' FAIL ' + f)); process.exit(1); }
console.log('перемотка встаёт, когда играть некем, и не встаёт, когда есть с кем');
