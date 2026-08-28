// Вход в лобби: код вместо аккаунтов.
//
// Ни почты, ни паролей — шесть знаков, которые один пересылает другому. Здесь
// проверяется, что код годится для этого (шесть знаков, разные), что создание
// делает тебя владельцем, а вход по чужому коду — вторым, и что открытие уже
// командной карьеры подключается само.
//
// И обратная сторона: одиночная карьера в сеть не ходит вовсе.
//
//   node tools/check-mp-join.js
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
    // Код — он же приглашение: шесть знаков, без почты и паролей.
    const codes = [];
    for (let i = 0; i < 200; i++) codes.push(ccMpCode());
    check('код из шести знаков', codes.every(c => /^[A-Z0-9]{6}$/.test(c)), codes[0]);
    check('коды разные', new Set(codes).size > 190, String(new Set(codes).size));
    /* И без пар, которые не продиктовать голосом: код читают вслух, а «ноль
       или о» — это потерянный вечер. */
    check('без похожих знаков', codes.every(c => !/[O0I1]/.test(c)),
          codes.find(c => /[O0I1]/.test(c)) || '');

    // Создание: роль владельца, код записан, подключение состоялось.
    seed('EU', 2);
    let asked = null;
    MP.connect = function(code, id){ asked = {code:code, id:id}; return Promise.resolve(); };
    await careerMpCreate();
    check('карьера стала командной', ccMpOn() === true);
    check('роль владельца', CAREER.career.mp.role === 'a', CAREER.career.mp.role);
    check('подключились по своему коду', asked && asked.code === CAREER.career.mp.code,
          JSON.stringify(asked));
    check('и у клиента есть свой идентификатор', asked && !!asked.id);
    const id1 = asked.id;

    // Вход вторым.
    seed('EU', 2);
    asked = null;
    await careerMpJoin('abc123');
    check('вошли по чужому коду', CAREER.career.mp.code === 'ABC123', CAREER.career.mp.code);
    check('роль второго', CAREER.career.mp.role === 'b', CAREER.career.mp.role);
    check('подключились', asked && asked.code === 'ABC123');
    check('идентификатор тот же самый, что был', asked.id === id1, asked.id + ' / ' + id1);

    // Вход в режим на уже командной карьере подключается сам.
    asked = null;
    await ccMpBoot();
    check('открытие командной карьеры подключается', asked && asked.code === 'ABC123');

    // А одиночная не трогает сеть вовсе.
    delete CAREER.career.mp;
    asked = null;
    await ccMpBoot();
    check('одиночная карьера в сеть не ходит', asked === null, JSON.stringify(asked));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpjoin-'));
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
console.log('в лобби входят по коду, а одиночная карьера в сеть не ходит');
fs.rmSync(dir, { recursive: true, force: true });
