// Разрыв дуо — аварийная дверь, а не фича.
//
// «День ждёт обоих» означает, что исчезнувший напарник запирает карьеру
// навсегда. Дверь превращает команду обратно в одиночную: история и деньги
// остаются, место напарника занимает бот с его последней карточкой — той самой
// ночной, которая и так обменивалась перед каждым вечером.
//
// Проверяется и то, ради чего дверь нужна: после разрыва день снова двигается
// сам, без сервера.
//
//   node tools/check-mp-break.js
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
  const seed = (region, size) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:region, ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:size},
      partners:[]
    }));
    careerLoad();
  };
  try {
    seed('EU', 2);
    CAREER.career.mp = {code:'ABC123', role:'a'};
    CAREER.career.balance = 48000;
    CAREER.career.log = [{season:1, day:'2026-02-02', place:4, kind:'cup'}];
    CAREER.partners = [];
    // Напарник — тот, чья карточка сейчас в лобби: именно он и должен остаться
    // ботом на своём месте.
    MP.peer = {handle:'howly', nat:'ru', age:20, ovr:91, role:'roleFRG', attrs:{},
               org:null, form:0, tired:0, sick:false, camp:null, gear:[]};
    let told = false;
    MP.part = function(){ told = true; };

    careerPart();
    check('серверу сказали', told === true);
    check('карьера снова одиночная', ccMpOn() === false);
    check('деньги на месте', CAREER.career.balance === 48000, String(CAREER.career.balance));
    check('история на месте', (CAREER.career.log || []).length === 1);
    check('место напарника занято ботом с его карточкой',
          careerPartnerCard() && careerPartnerCard().handle === 'howly',
          JSON.stringify(careerPartnerCard()));
    // И день снова двигается сам.
    const was = careerToday();
    careerAdvanceTo(ccAddDays(was, 1));
    check('день пошёл', careerToday() !== was, careerToday());

    // Спрашивают перед тем, как рвать: подтверждение — это ccAsk, и у него
    // свои подписи кнопок во всех пяти локалях.
    seed('EU', 2);
    CAREER.career.mp = {code:'ABC123', role:'a'};
    careerPartAsk();
    const modal = document.getElementById('ccAskModal');
    check('окно подтверждения открылось', modal && modal.style.display === 'flex',
          modal && modal.style.display);
    check('и оно ещё не разорвало дуо', ccMpOn() === true);
    check('на кнопке написано, что она делает',
          (document.getElementById('ccAskYes')||{}).textContent === L().ccPartYes,
          (document.getElementById('ccAskYes')||{}).textContent);
    document.getElementById('ccAskYes').click();
    check('нажатие рвёт', ccMpOn() === false);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpbreak-'));
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
console.log('дуо можно разорвать, и карьера остаётся при своём');
fs.rmSync(dir, { recursive: true, force: true });
