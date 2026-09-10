// Две карьеры с одним миром собирают одну комнату — и одни числа движка.
//
// В гонке книга мира уравнивает сцену (dev, splits, duoSplits, trios, cseed), а
// сверка поля равняет ник и силу. Но движок читает у команды attrs (skill, seek,
// power в createSquads) и край ближнего боя, и сила при этом округлена. Здесь
// две карьеры с ОДНИМ миром и разной личной жизнью строят поле одного вечера, и
// у каждой команды, которая есть у обеих, сверяются не только ник и сила, но и
// шесть чисел.
//
//   node tools/check-two-careers-field.js
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
    CARD_MODE = true; squadSize = 2;
    const dev = {};
    const seed = (nick, life) => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1,
        player:{nick:nick, age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
                region:'EU', ovr:92, role:'roleIGL', attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0,
                photo:null, handle:null, cardRegion:null, nat:null},
        career:Object.assign({season:1, day:'2026-02-08', division:1, earnings:0, balance:0,
                reach:9000, tokens:[], log:[], news:[], size:2, dev:dev}, life.career||{}),
        gear:life.gear||{own:[], conf:0}, partners:life.partners||[]
      }));
      careerLoad();
      ccWorldReset();
    };
    // Мир один: то же развитие сцены у обеих карьер (книга мира в гонке кладёт его целиком).
    seed('Alpha', {});
    careerRosterNowEU().slice(0, 60).forEach((c, i) => { dev[hKey(c)] = (i % 7) - 3; });

    const deepOf = t => {
      const a = t.attrs || {};
      return Math.round(t.pow || 0) + ':' + [a.END, a.SUR, a.AIM, a.CLU].join('.') +
             ':' + Math.round((t.closeEdge || 0) * 100) + ':' + ((t.squad || []).length || 1);
    };
    const keyOf = t => (t.squad || []).map(c => hKey(c)).sort().join('+');
    const buildAs = (nick, life) => {
      seed(nick, life);
      const cr = CAREER.career, me = careerCard();
      const mate = careerRosterNowEU()[life.mateAt || 7];
      const field = careerCupField(cr, [me, mate], 80, null, true);
      const m = new Map();
      field.forEach(t => { const k = keyOf(t); if(k && !m.has(k)) m.set(k, deepOf(t)); });
      return m;
    };
    const A = buildAs('Alpha', {mateAt: 7, career:{log:[], earnings:0}});
    const B = buildAs('Bravo', {mateAt: 11,
      career:{log:[{place:3, wins:1}, {place:12, wins:0}], earnings:14000},
      partners:[]});

    let common = 0, powBad = [], attrBad = [];
    A.forEach((va, k) => {
      const vb = B.get(k); if(!vb) return;
      common++;
      if(va === vb) return;
      const pa = va.split(':')[0], pb = vb.split(':')[0];
      (pa !== pb ? powBad : attrBad).push(k + ' ' + va + ' / ' + vb);
    });
    out.notes.common = common;
    out.notes.powBadN = powBad.length; out.notes.powBad = powBad.slice(0, 5);
    out.notes.attrBadN = attrBad.length; out.notes.attrBad = attrBad.slice(0, 8);
    check('общих команд хватает для сверки', common > 20, String(common));
    check('СИЛА ОДНА У ОБЕИХ КАРЬЕР', powBad.length === 0, powBad.length + ' команд');
    check('ЧИСЛА ДВИЖКА ОДНИ ПРИ РАВНОЙ СИЛЕ', attrBad.length === 0, attrBad.length + ' команд');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctwocar-'));
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
console.log('две карьеры с одним миром дают комнате одни и те же числа');
