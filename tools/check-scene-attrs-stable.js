// Сцена, собранная дважды, даёт одни и те же числа движку.
//
// Движок читает у команды attrs (skill/seek/power в createSquads), а сверка
// поля в гонке равняет только ники и силу — и сила округлена. Значит две
// вкладки могут собрать одинаковое на вид поле с разными числами внутри, и
// вечер разойдётся при РАВНОМ числе бросков (его скрин 10.09, годовая проба:
// «z2=3665/108524 vs z2=3665/437179»).
//
// Первый подозреваемый — кэш карточки: attrsFor пишет шесть чисел прямо в
// объект, ccSceneLift поднимает рейтинг тем же способом, а кэши сцены живут во
// вкладке. Если пересборка мира (ccWorldReset) даёт другие числа, то у двоих с
// разной историей вкладки они разные тем более.
//
//   node tools/check-scene-attrs-stable.js
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
      player:{nick:'Alpha', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
              region:'EU', ovr:92, role:'roleIGL', attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0,
              photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-08', division:1, earnings:0, balance:0, reach:9000,
              tokens:[], log:[], news:[], size:2,
              // Развитие сцены — то, чем гонка делится книгой мира: подъём рейтинга
              // у части народа. Именно оно ходит через ccSceneLift.
              dev:{}},
      gear:{own:[], conf:0}, partners:[]
    }));
    careerLoad();
    CARD_MODE = true; squadSize = 2;
    // Немного развития, как у живой карьеры к февралю.
    const cr = CAREER.career;
    const roster = careerRosterNowEU();
    roster.slice(0, 40).forEach((c, i) => { cr.dev[hKey(c)] = (i % 5) - 2; });
    ccWorldReset();

    const sig = f => f.map(t => (t.squad || []).map(c => c.handle).sort().join('+') + ':' +
                               Math.round(t.pow || 0)).join('|');
    const deep = f => f.map(t => {
      const a = t.attrs || {};
      return (t.squad || []).map(c => c.handle).sort().join('+') + ':' + Math.round(t.pow || 0) +
             ':' + [a.END, a.SUR, a.AIM, a.CLU].join('.') + ':' + Math.round((t.closeEdge || 0) * 100);
    }).join('|');
    const build = () => {
      const me = careerCard();
      const mates = [careerRosterNowEU()[7]];
      return careerCupField(cr, [me].concat(mates), 60, null, true);
    };

    const f1 = build(), s1 = sig(f1), d1 = deep(f1);
    ccWorldReset();
    const f2 = build(), s2 = sig(f2), d2 = deep(f2);
    ccWorldReset();
    const f3 = build(), s3 = sig(f3), d3 = deep(f3);

    out.notes.size = [f1.length, f2.length, f3.length];
    check('состав поля тот же после пересборки мира', s1 === s2 && s2 === s3);
    check('ЧИСЛА ДЛЯ ДВИЖКА те же после пересборки мира', d1 === d2 && d2 === d3);
    if(d1 !== d2 || d2 !== d3){
      const a = d1.split('|'), b = d2.split('|'), c = d3.split('|');
      const bad = [];
      for(let i = 0; i < Math.max(a.length, b.length, c.length); i++)
        if(a[i] !== b[i] || b[i] !== c[i]) bad.push('#' + (i + 1) + ' ' + a[i] + ' / ' + b[i] + ' / ' + c[i]);
      out.notes.diff = bad.slice(0, 8);
      out.notes.diffN = bad.length;
    }
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccattrs-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('сцена собирается одинаково: пересборка мира не двигает числа движка');
