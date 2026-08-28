// Кого дают третьим сильным парам.
//
// Его игрок, 25 августа: «а нельзя ещё реалистичнее триосы сделать? просто у
// меня шарк с тини и храйсом играет, а пабловинго с пингом». Полоса силы
// (CC_TRIO_BAND) уже не даёт паре 94/94 третьего на 80 — но полоса про рейтинг,
// а он говорит про людей. Проба печатает верх комнаты как есть: ядро, третий,
// его рейтинг, разрыв с ядром и откуда он взялся.
//
//   node tools/career-trio-who-probe.js
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
  const out = {rows: [], stats: {}, err: null};
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:2, day:'2026-03-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:3},
      partners:[]
    }));
    careerLoad();
    const cr = CAREER.career;
    const me = careerCard();
    const field = careerCupField(cr, [me], careerCupSize(1), null);
    const ovr = c => { const a = attrsFor(c) || {}; return Math.round(c._ovr != null ? c._ovr : (a.ovr || 0)); };
    // Реальная пара снапшота: оба в одном записанном дуо.
    const pairs = careerRealDuos(new Set(), careerRng(1), 1, 400, null) || [];
    const pairKey = new Set();
    pairs.forEach(d => { if (d.cards.length === 2) pairKey.add(d.cards.map(c => hKey(c)).sort().join('+')); });
    const teams = field.map(t => {
      const s = (t.squad || []).slice().sort((a,b) => ovr(b) - ovr(a));
      if (s.length !== 3) return null;
      // Ядро — та пара из троих, которая записана вместе; третий — оставшийся.
      let core = null, third = null;
      for (let i = 0; i < 3 && !core; i++)
        for (let j = i+1; j < 3; j++) {
          const k = [s[i], s[j]].map(c => hKey(c)).sort().join('+');
          if (pairKey.has(k)) { core = [s[i], s[j]]; third = s.filter(c => c!==s[i] && c!==s[j])[0]; break; }
        }
      if (!core) { core = [s[0], s[1]]; third = s[2]; }
      const cAvg = (ovr(core[0]) + ovr(core[1])) / 2;
      return {
        core: core.map(c => c.handle).join(' & '),
        coreOvr: Math.round(cAvg),
        third: third.handle,
        thirdOvr: ovr(third),
        gap: Math.round(ovr(third) - cAvg),
        made: third.tier === 'ladder',
        pow: Math.round(t.pow || 0)
      };
    }).filter(Boolean);
    teams.sort((a,b) => b.coreOvr - a.coreOvr);
    out.rows = teams.slice(0, 15);
    const gaps = teams.map(t => t.gap);
    const below = gaps.filter(g => g < -CC_TRIO_BAND).length;
    out.stats = {
      teams: teams.length,
      band: CC_TRIO_BAND,
      madeUpThirds: teams.filter(t => t.made).length,
      worstGap: Math.min.apply(null, gaps),
      bestGap: Math.max.apply(null, gaps),
      avgGap: Math.round(gaps.reduce((s,g)=>s+g,0) / gaps.length * 10) / 10,
      outsideBand: below,
      top20worst: Math.min.apply(null, teams.slice(0,20).map(t => t.gap))
    };
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncstriowho-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.stats, null, 1));
out.rows.forEach(r => console.log(
  String(r.coreOvr).padStart(3) + '  ' + r.core.padEnd(28) +
  ' + ' + (r.third + (r.made ? ' (выдуман)' : '')).padEnd(22) +
  String(r.thirdOvr).padStart(3) + '  разрыв ' + String(r.gap).padStart(3)));
fs.rmSync(dir, { recursive: true, force: true });
