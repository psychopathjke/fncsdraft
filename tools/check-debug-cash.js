// Деньги по ссылке (?cash=) ставятся на отладочном адресе и только на нём.
//
// Его просьба 11 сентября: «сделай мне баланс 2 миллиона, чтоб посмотреть
// функционал». Ссылка проходит через загрузку карьеры, а входов в карьеру
// несколько (плитка, список слотов, ссылка лобби) — поэтому проверяется сама
// загрузка, а не какой-то один вход.
//
//   node tools/check-debug-cash.js
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
      career:{season:1, day:'2026-03-02', division:1, earnings:48000, balance:1234, reach:30000,
              tokens:[], log:[], news:[], size:2},
      gear:{own:[], conf:0}, partners:[]
    }));
    careerLoad();
    out.notes.search = String(location.search||'');
    out.notes.balance = CAREER.career.balance;
    check('баланс поставлен по ссылке', CAREER.career.balance === 2000000, String(CAREER.career.balance));
    check('заработанное не тронуто', CAREER.career.earnings === 48000, String(CAREER.career.earnings));
    // Сохранилось, а не только в памяти.
    const saved = JSON.parse(localStorage.getItem('fncsdraft_career')||'{}');
    check('записано в сейв', saved.career && saved.career.balance === 2000000,
          String(saved.career && saved.career.balance));
    // И боевой адрес про параметр не знает.
    CAREER.career.balance = 7;
    check('на боевом адресе не работает', !ccDebugCash('fncsdraft.com') && CAREER.career.balance === 7,
          String(CAREER.career.balance));
    check('и на поддомене боевого тоже', !ccDebugCash('www.fncsdraft.com') && CAREER.career.balance === 7);
    check('а на отладочном работает', ccDebugCash('debug.fncsdraft.pages.dev') && CAREER.career.balance === 2000000,
          String(CAREER.career.balance));
  } catch (e) { out.err = String(e && (e.stack || e.message) || e); }
  document.getElementById('__out').textContent = 'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbgcash-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/') + '?cash=2000000'],
  {maxBuffer: 256 * 1024 * 1024, encoding: 'utf8'});
fs.rmSync(dir, {recursive: true, force: true});

const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('страница не ответила'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error('ОШИБКА: ' + out.err); process.exit(2); }
if (out.fails.length) { out.fails.forEach(f => console.log(' FAIL ' + f)); process.exit(1); }
console.log('ссылка с деньгами работает на отладке и молчит на боевом адресе');
