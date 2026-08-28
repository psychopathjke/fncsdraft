// Плитка команды: кто в лобби и как оттуда выйти.
//
// Показывает ровно то, что напарнику и так видно по спеке — ник, флаг, овер,
// роль — и код лобби, который и есть приглашение. Деньги, контракт и инбокс
// личные: в плитку они не попадают, и это здесь проверяется, а не
// подразумевается.
//
//   node tools/check-mp-tile.js
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
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:48000,
              reach:9000, tokens:[], log:[], news:[], size:size},
      partners:[]
    }));
    careerLoad();
  };
  try {
    seed('EU', 2);
    check('в одиночной карьере плитки нет', careerMpTileHTML() === '',
          careerMpTileHTML().slice(0, 80));

    CAREER.career.mp = {code:'ABC123', role:'a'};
    MP.peer = null;
    const alone = careerMpTileHTML();
    check('код лобби виден', alone.indexOf('ABC123') >= 0, alone.slice(0, 200));
    check('и сказано, что напарника нет', alone.indexOf(L().ccMpAlone) >= 0);
    check('кнопка разрыва на месте', alone.indexOf('careerPartAsk()') >= 0);

    MP.peer = {handle:'howly', nat:'ru', ovr:91, role:'roleFRG'};
    const two = careerMpTileHTML();
    out.notes.tile = two.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 160);
    check('ник напарника виден', two.indexOf('howly') >= 0, two.slice(0, 240));
    check('и его овер', two.indexOf('91') >= 0);
    check('и роль', two.indexOf(L().roleFRG) >= 0, L().roleFRG);
    check('чужое в плитку не течёт', two.indexOf('balance') < 0 && two.indexOf('48000') < 0);

    // Плитка стоит на хабе, а не только существует функцией.
    careerRenderHub('centre');
    const onHub = (document.getElementById('chBody') || {}).innerHTML || '';
    check('плитка нарисована в центре хаба', onHub.indexOf('ABC123') >= 0,
          onHub.slice(0, 120));
    delete CAREER.career.mp;
    careerRenderHub('centre');
    const solo = (document.getElementById('chBody') || {}).innerHTML || '';
    check('а в одиночной её на хабе нет', solo.indexOf('ABC123') < 0);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mptile-'));
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
console.log('плитка команды говорит, кто в лобби, и не выдаёт личного');
fs.rmSync(dir, { recursive: true, force: true });
