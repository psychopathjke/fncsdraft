// Барьер, пройденный в одиночку, называет причину — и обрыв своей связи отпускает его
// не через 40 с, а через 150.
//
// Скрин тестера 21 сентября 2026: «Вечера разошлись на игре 1 · peer ahead · game@#2 g2» —
// напарник прошёл барьер первой игры один, а почему — по строке не видно. Теперь причина
// (lost / cap / max / left / done / leave) записывается в CC_MP_PASSED, уезжает с приходом
// (game@ … why) и печатается у напарника: «peer passed: lost @g1». И самая частая дверь —
// обрыв своей связи — стала шире: телефон с погасшим экраном переподключается дольше сорока
// секунд, а приход напарника всё равно доедет очередью.
//
//   node tools/check-mp-passed.js
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
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:2},
      partners:[]
    }));
    careerLoad();
    // ---- 1. обрыв связи: барьер стоит 40 с и отпускается к 150 -------------
    MP.state = 'lost';
    ccMpWaitReset(); CC_MP_PASSED = null;
    let released = 0;
    CC_MP_WAITERS.push(function(){ released++; });
    ccMpLinkLost();
    await wait(60000);
    check('через минуту обрыва барьер ещё стоит', released === 0, String(released));
    check('и причины прохода ещё нет', CC_MP_PASSED == null, String(CC_MP_PASSED));
    await wait(100000);
    check('к 150 секундам барьер отпущен', released === 1, String(released));
    check('и причина названа — обрыв', /^lost @g\\d+$/.test(String(CC_MP_PASSED)), String(CC_MP_PASSED));
    check('окно обрыва — 150 секунд', CC_MP_LOST_RELEASE_MS === 150000, String(CC_MP_LOST_RELEASE_MS));
    // ---- 2. связь вернулась раньше — барьер не трогают ---------------------
    ccMpWaitReset(); CC_MP_PASSED = null; released = 0;
    CC_MP_WAITERS.push(function(){ released++; });
    ccMpLinkLost();
    await wait(30000);
    MP.state = 'live';
    await wait(150000);
    check('связь вернулась — барьер не отпущен по обрыву', released === 0, String(released));
    check('и причины нет', CC_MP_PASSED == null, String(CC_MP_PASSED));
    // ---- 3. «он досчитал» и выход из вечера — свои причины -----------------
    ccMpWaitReset(); CC_MP_PASSED = null;
    ccMpPeerDone();
    check('«он досчитал» — done', /^done @g/.test(String(CC_MP_PASSED)), String(CC_MP_PASSED));
    // ---- 4. новый вечер стирает причину -------------------------------------
    MP.act = function(){};
    ccMpSeedOn('probe-seed');
    check('новый вечер — причина стёрта', CC_MP_PASSED == null, String(CC_MP_PASSED));
    ccMpSeedOff();
    // ---- 5. текст красной строки несёт причину напарника --------------------
    const src = String(ccMpSync);
    check('приход везёт why', src.indexOf('why:CC_MP_PASSED||undefined') >= 0);
    check('и «peer ahead» печатает его', src.indexOf("' · peer passed: '") >= 0);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\u002fscript>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mppass-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('барьер, пройденный в одиночку, называет причину; обрыв отпускает его через 150 с');
