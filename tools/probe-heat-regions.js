// Как выглядит сетка хитов в каждом регионе — и что из этого знает карьера.
//
//   node tools/probe-heat-regions.js
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
(function(){
  const out = {draft:{}, career:{}, err:null};
  try {
    squadSize = 2;
    // Режим драфта: сетка на регион и набор карточек.
    ['m1','m2','t1'].forEach(set => {
      out.draft[set] = {};
      CC_REGIONS.forEach(r => {
        const f = majorFormat(r, set);
        out.draft[set][r] = {
          heats: (f.heats||[]).length,
          games: (f.heats||[]).map(h => h.games).join('/'),
          cuts:  (f.heats||[]).map(h => h.cut).join('/'),
          through: (f.heats||[]).reduce((s,h) => s + h.cut, 0),
          playIn: f.playInCut,
          lcl: f.lclGames,
          lcqW: f.lcqWinners == null ? null : f.lcqWinners
        };
      });
    });
    // Карьера: то же самое, но её собственными константами, в каждом регионе.
    CC_REGIONS.forEach(r => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1,
        player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
                closeRangeEdge:0, region:r, ovr:90, role:'roleIGL',
                attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
                handle:null, cardRegion:null, nat:null},
        career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
                reach:9000, tokens:[], log:[], news:[]},
        partners:[]
      }));
      careerLoad();
      const h = ccScaleStage(CC_MAJOR_STAGE.heats);
      const p = ccScaleStage(CC_MAJOR_STAGE.playin);
      const f = ccScaleStage(CC_MAJOR_STAGE.final);
      out.career[r] = {region: ccCareerRegion(), heats: ccMajorHeats(),
                       field: h.field, cut: h.cut,
                       through: h.cut * ccMajorHeats(),
                       playIn: p.cut, final: f.field};
    });
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsheatreg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
const row = (k, v) => console.log('  ' + k.padEnd(6) +
  String(v.heats).padStart(2) + ' хита  игры ' + String(v.games || '-').padEnd(6) +
  ' отсечки ' + String(v.cuts || v.cut).padEnd(8) +
  ' -> ' + String(v.through).padStart(3) +
  '  плей-ин ' + String(v.playIn).padStart(4) +
  (v.lcqW == null ? '' : '  LCQ ' + v.lcqW));
['m1','m2','t1'].forEach(set => {
  console.log('draft ' + set + ':');
  Object.keys(out.draft[set]).forEach(r => row(r, out.draft[set][r]));
});
console.log('career (CC_MAJOR_STAGE):');
Object.keys(out.career).forEach(r => row(r, out.career[r]));
fs.rmSync(dir, { recursive: true, force: true });
