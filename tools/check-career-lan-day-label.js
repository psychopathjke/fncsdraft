// Второго Форт-Уэрта не существует.
//
// Его скрин, 25 августа: две плитки календаря за 26 и 27 сентября — «Мировой
// чемпионат · Форт-Уэрт» и «Мировой чемпионат · Форт-Уэрт 2». Счётчик дня
// многодневного блока приписывался к строке хвостом, а строка у двух событий
// года кончается ГОРОДОМ — и номер читался как часть названия города.
//
//   node tools/check-career-lan-day-label.js
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
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-09-26', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();

    // ---- то, что было на скрине -------------------------------------------
    const city = ccLanCity('globals');
    const d1 = ccYearLabel('GlobalChampionship', '2026-09-26', '2026-09-26');
    const d2 = ccYearLabel('GlobalChampionship', '2026-09-27', '2026-09-26');
    out.notes.city = city;
    out.notes.gc = [d1, d2];
    check('первый день называет город', d1.indexOf(city) >= 0, d1);
    check('второй день тоже', d2.indexOf(city) >= 0, d2);
    check('и второй день — не «город 2»',
          d2.indexOf(city + ' 2') < 0, d2);
    check('он назван сессией', d2.indexOf(L().calSession.replace('{N}','2')) >= 0, d2);

    // ---- Париж, четыре дня подряд -----------------------------------------
    const par = ['2026-08-19','2026-08-20','2026-08-21','2026-08-22']
      .map(d => ccYearLabel('ReloadChampionshipParis', d, '2026-08-19'));
    out.notes.paris = par;
    const rcCity = ccLanCity('rc');
    check('ни один день Парижа не приписывает номер городу',
          !par.some(s => new RegExp(rcCity.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&') + ' \\\\d').test(s)),
          par.join(' | '));
    check('и все четыре дня различимы', new Set(par).size === 4, par.join(' | '));

    // ---- блоки без города считаются как считались -------------------------
    // Хиты — три дня подряд, города в строке нет, и хвостовой номер там читается
    // ровно как «второй день», а не как часть имени.
    const heats = ['2026-04-17','2026-04-18','2026-04-19']
      .map(d => ccYearLabel('Major1_Heats', d, '2026-04-17'));
    out.notes.heats = heats;
    check('первый день хитов без номера', heats[0] === (L().ccYearNames||{}).Major1_Heats,
          heats[0]);
    check('второй — с номером', heats[1] === heats[0] + ' 2', heats[1]);
    check('третий тоже', heats[2] === heats[0] + ' 3', heats[2]);

    // ---- и то же самое в другой локали ------------------------------------
    // calSession переведена везде; правка не должна была уронить это на ключ.
    const was = LANG;
    setLang('en');
    const en = ccYearLabel('GlobalChampionship', '2026-09-27', '2026-09-26');
    out.notes.en = en;
    check('в английской локали тоже не «город 2»',
          en.indexOf(ccLanCity('globals') + ' 2') < 0, en);
    check('и это не голый ключ', en.indexOf('{N}') < 0 && en.indexOf('calSession') < 0, en);
    setLang(was);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncslanday-'));
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
console.log('a second day of a LAN is a session, not a second city');
fs.rmSync(dir, { recursive: true, force: true });
