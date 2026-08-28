// Пост о чужой неделе датируется днём, когда она игралась.
//
// careerWorldTurns гоняет неделю Дивизиона 1 ДО того, как careerAdvanceTo
// сдвинет часы: `cr.day=iso` стоит ниже вызова. А careerNews по умолчанию
// ставит на запись careerToday() — то есть день, с которого игрок уходил.
//
// Отсюда его скрин 25 августа: твит «ДИВИЗИОН 1 · КУБОК» с топ-5 и подписью
// «Пт 13 фев». Тринадцатое февраля — это отборы Reload кап 2 (CAREER_YEAR),
// финала недели в этот день нет вовсе; финал стоял в субботу 14-го
// (CC_CUP_WEEKS). Игрок ушёл с пятницы на понедельник, симуляция сыграла
// субботу — и подписала её пятницей. Его слова: «написано, что какие-то челы
// якобы выиграли див кап, хотя в это число был отбор на релоуд кап и не было
// финалов див капа», и дальше — «два финала див капа на одной неделе, хотя
// второй даже не отображается, и призовые за него начисляются». Финал один,
// призовые начисляются один раз; двумя его делает дата на посте.
//
//   node tools/check-career-post-day.js
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
  const seed = (day) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:86, role:'roleIGL',
              attrs:ccRookieAttrs(86,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  try {
    // ---- какие дни года вообще несут финал --------------------------------
    const days = careerYearDays();
    const finals = [...days.keys()].filter(d =>
      (days.get(d)||[]).some(e => e.kind==='final')).sort();
    out.notes.febFinals = finals.filter(d => d >= '2026-02-09' && d <= '2026-02-15');
    check('в неделе 9-15 февраля ровно один финал недели',
          out.notes.febFinals.length === 1, out.notes.febFinals.join(','));
    check('и стоит он в субботу 14-го',
          out.notes.febFinals[0] === '2026-02-14', out.notes.febFinals[0]);
    // Тринадцатое — это Reload, и финалом оно не является ни в каком смысле.
    out.notes.feb13 = (days.get('2026-02-13')||[]).map(e => e.kind + ':' + e.id);
    check('13 февраля финала нет',
          !(days.get('2026-02-13')||[]).some(e => e.kind==='final'),
          out.notes.feb13.join(' '));

    // ---- уход с пятницы на понедельник ------------------------------------
    // Симуляция играет субботу. Все записи, которые она напишет, обязаны
    // стоять субботним числом, а не тем, с которого игрок ушёл.
    seed('2026-02-13');
    careerAdvanceTo('2026-02-16');
    const news = (CAREER.career.news||[]).map(e => ({day:e.day, k:e.k, tbl:!!e.tbl}));
    out.notes.wrote = news.length;
    out.notes.days = [...new Set(news.map(e => e.day))].sort();
    out.notes.sample = news.slice(0, 6);
    const off = news.filter(e => e.day !== '2026-02-14');
    check('неделя Дивизиона 1 подписана днём, когда она игралась',
          off.length === 0,
          off.map(e => e.k + '@' + e.day).join(', '));
    // И таблица под постом — тоже: это скрин того самого вечера.
    const tbl = news.filter(e => e.tbl);
    out.notes.tables = tbl.length;
    check('таблица под постом есть', tbl.length > 0, String(tbl.length));

    // ---- а свой собственный пост по-прежнему сегодняшний ------------------
    // Правка не должна была сделать CC_POST_DAY липким: то, что игрок пишет
    // сам после перехода, датируется днём, в котором он стоит.
    seed('2026-02-13');
    careerAdvanceTo('2026-02-16');
    careerNews('flat', 'ccNewsLfd', [1, 86]);
    out.notes.mine = CAREER.career.news[0].day;
    check('своя строка после перехода датируется сегодняшним днём',
          CAREER.career.news[0].day === '2026-02-16', out.notes.mine);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncspostday-'));
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
console.log('a week the player watched is dated the day it was played');
fs.rmSync(dir, { recursive: true, force: true });
