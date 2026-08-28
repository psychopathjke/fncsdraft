// Клетка недели не повторяет себя вслух.
//
// Его снимок, 26 августа: полоса недели, пятница — «Reload», под ней «Reload —
// кап 2, отборы»; суббота — «Финал недели», под ней «Финал недели». У финала
// имя события и есть его вид, и мелкая строка переписывала заголовок.
//
// Здесь стережётся ровно это: в каждой клетке нижняя строка либо говорит новое,
// либо молчит, — и при этом дни, которым есть что сказать (Reload, мейджор),
// говорить не перестают.
//
//   node tools/check-career-week-strip.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
// Необязательный первый аргумент — папка сборки: тем же прогоном проверяется
// то, что уезжает на сайт, и старый билд, когда нужен отрицательный контроль.
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
  const seed = (day) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Strip', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:86, role:'roleIGL',
              attrs:ccRookieAttrs(86,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  // Разбор полосы: для каждой клетки — слово и строка под ним.
  const strip = () => {
    const box=document.createElement('div');
    box.innerHTML=careerCentreHTML();
    return [].slice.call(box.querySelectorAll('.ch-day')).map(el=>({
      что:(el.querySelector('.ch-day-what')||{}).textContent||'',
      под:(el.querySelector('.ch-day-sub')||{}).textContent||''
    }));
  };
  try {
    // Неделя 9-15 февраля: пятница Reload, суббота — финал недели.
    seed('2026-02-09');
    const week=strip();
    out.notes.неделя=week;
    const echo=week.filter(c=>c.под && c.под.trim()===c.что.trim());
    check('ни одна клетка не переписывает заголовок мелким шрифтом',
          echo.length===0, JSON.stringify(echo));
    // Контроль: строка под словом не исчезла у всех — там, где ей есть что
    // сказать, она говорит. Иначе проверка выше зелёная от пустой полосы.
    const spoken=week.filter(c=>c.под && c.под.trim().length>2);
    out.notes.говорящих=spoken.length;
    check('контроль: у дней с настоящей подписью она осталась',
          spoken.length>0, JSON.stringify(week.map(c=>c.что+' / '+c.под)));
    // И субботний финал в этой неделе действительно есть — иначе проверка
    // измеряет не тот день.
    check('финал недели в полосе назван',
          week.some(c=>c.что.indexOf(L().calWeeklyFinal)>=0),
          week.map(c=>c.что).join(' | '));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-'));
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
console.log('клетка недели говорит каждое слово один раз');
fs.rmSync(dir, { recursive: true, force: true });
