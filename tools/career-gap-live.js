// The same question as career-gap-calibration, asked of the simulation the
// career actually runs.
//
// A career cup is not simulateGamesRandomLobbies: it is simulateGamesLive with
// the map replay on and stopOnYourDeath set, which puts the player's own lobby
// through the zone simulation instead of the round-based model. Measuring the
// batch path and reasoning about the live one is how a screenshot ends up
// disagreeing with a calibration table.
//
// Run: node tools/career-gap-live.js [runs] [division]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = parseInt(process.argv[2] || '12', 10);
const DIV = parseInt(process.argv[3] || '4', 10);
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
  const out = {runs: ${RUNS}, div: ${DIV}, rows: [], error: null};
  try{
    CARD_MODE = true; squadSize = 2;
    skipAnimation = true; CC_SKIP_RUN = true; CAREER_RUN = true;
    const mk = (ovr, nick, role) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'gap', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, role || 'roleIGL')});
    const band = CC_DIV_RATING[${DIV}];
    const PAIRS = [[96, 93], [band, band]];
    for (const [a, b] of PAIRS) {
      const row = {you: a + '/' + b, places: [], won: 0, top3: 0, avgPlaces: [], wins: []};
      for (let r = 0; r < ${RUNS}; r++) {
        const me = mk(a, 'GAP_YOU', 'roleIGL');
        const mate = mk(b, 'GAP_MATE', 'roleFRG');
        CAREER = {player: {}, career: {season: 1, week: (r % 4) + 1, division: ${DIV},
                                       day: '2026-02-1' + (r % 9)}, partner: null};
        drafted = [me, mate];
        const you = careerYouTeam(drafted);
        you.name = 'you'; you.isYou = true;
        const field = [you].concat(careerCupField(CAREER.career, drafted, careerCupSize(${DIV})));
        if (!row.fieldSize) row.fieldSize = field.length;
        await simulateGamesLive(field, CAREER_CUP_GAMES, pointsForPlace, 4, 'stage', 0, null, null,
          {lobbySize: 50, stageName: 'probe', mapReplay: true, stopOnYourDeath: true,
           cutAt: careerCupCut(${DIV})});
        document.getElementById('majorStages').innerHTML = '';
        const ranked = field.slice().sort((x, y) => y.stagePts - x.stagePts || y.stageElims - x.stageElims);
        const place = ranked.indexOf(you) + 1;
        row.places.push(place);
        row.wins.push(you.wins || 0);
        const log = you.stageLog || [];
        if (log.length) row.avgPlaces.push(Math.round(
          log.reduce((s, g) => s + (g.place || 0), 0) / log.length * 10) / 10);
        if (place === 1) row.won++;
        if (place <= 3) row.top3++;
      }
      const s = row.places.slice().sort((x, y) => x - y);
      row.best = s[0]; row.worst = s[s.length - 1];
      row.median = s[Math.floor(s.length / 2)];
      row.meanWins = Math.round(row.wins.reduce((t, v) => t + v, 0) / row.wins.length * 10) / 10;
      row.meanAvgPlace = row.avgPlaces.length ? Math.round(
        row.avgPlaces.reduce((t, v) => t + v, 0) / row.avgPlaces.length * 10) / 10 : null;
      row.sample = s.join(',');
      delete row.places; delete row.wins; delete row.avgPlaces;
      out.rows.push(row);
    }
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BE' + 'GIN' + encodeURIComponent(JSON.stringify(out)) + 'E' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsgaplive-'));
const tmp = path.join(dir, 'index.html');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
fs.writeFileSync(tmp, BASE + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }
console.log('Division ' + out.div + ', the live path - ' + out.runs + ' cups each');
out.rows.forEach(r => {
  const pct = n => (100 * n / out.runs).toFixed(0) + '%';
  console.log(r.you.padEnd(8) + ' field ' + r.fieldSize +
    ' | best ' + r.best + ' median ' + r.median + ' worst ' + r.worst +
    ' | won ' + pct(r.won) + ' top3 ' + pct(r.top3) +
    ' | VRs/cup ' + r.meanWins + ' avg place ' + r.meanAvgPlace);
  console.log('         places: ' + r.sample);
});
fs.rmSync(dir, { recursive: true, force: true });
