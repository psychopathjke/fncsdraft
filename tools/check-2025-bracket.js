// Runs the real bracket functions -- seedHeats, simulateGamesStopOnWin,
// heatQualifiers, computeQuietLCQWinners -- over a synthetic field, per region,
// and checks the field that comes out the far end against the Grand Finals row
// count actually published. This exercises the tournament pipeline without the
// draft UI in the way.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const BOOTSTRAP = `
<pre id="__br" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    var REG = ['EU','NAC','NAW','BR','ASIA','ME','OCE'];
    var published = {EU:33, NAC:33, NAW:33, BR:33, ASIA:33, ME:30, OCE:32};
    REG.forEach(function(reg){
      var FMT = majorFormat(reg, 't1');
      var pool = cardRosterPlayers('t1').filter(function(p){ return p.region===reg; });
      // The app's own team builder, so the teams carry every field the
      // simulation reads -- a hand-rolled {squad:[...]} is missing name and
      // dies inside the kill feed.
      var teams = [];
      fillFieldTeams(pool.slice(), Math.min(160, Math.floor(pool.length/3)), 3, teams);
      var advanced = teams.slice(0, Math.min(FMT.playInCut, teams.length));
      var heats = seedHeats(advanced, FMT.heats.length);
      var through = [];
      heats.forEach(function(heatTeams, hi){
        heatTeams.forEach(function(t){ t.stagePts=0; t.stageElims=0; t.gotVR=false; });
        simulateGamesStopOnWin(heatTeams, FMT.heats[hi].games, heatsScoreForPlace, 3);
        var q = heatQualifiers(heatTeams, FMT.heats[hi].cut);
        through = through.concat(Array.from(q));
      });
      var slots = (FMT.lcqWinners==null) ? FMT.lclGames : FMT.lcqWinners;
      var rest = teams.filter(function(t){ return through.indexOf(t) < 0; });
      rest.forEach(function(t){ t.stagePts=0; t.stageElims=0; t.gotVR=false; });
      var lcqWinners = computeQuietLCQWinners(rest, slots);
      out[reg] = {
        playInCut: FMT.playInCut,
        groups: FMT.heats.length,
        fieldEntering: advanced.length,
        fromGroups: through.length,
        fromLastChance: lcqWinners.length,
        finalField: through.length + lcqWinners.length,
        published: published[reg],
        gfGames: FMT.gfGames,
        ok: (through.length + lcqWinners.length) === published[reg]
      };
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__br').textContent =
    'BEGINBR' + encodeURIComponent(JSON.stringify(out)) + 'ENDBR';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsbr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINBR([\s\S]*?)ENDBR/);
if (!m) { console.error('bracket probe did not run; page copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

if (out.error) { console.error(out.error); process.exit(1); }
console.log('region  cut  groups  entering  fromGroups  lastChance  field  published');
let bad = 0;
for (const r of ['EU','NAC','NAW','BR','ASIA','ME','OCE']) {
  const o = out[r];
  if (!o.ok) bad++;
  console.log('  ' + r.padEnd(6) + String(o.playInCut).padStart(4) + String(o.groups).padStart(8) +
    String(o.fieldEntering).padStart(10) + String(o.fromGroups).padStart(12) +
    String(o.fromLastChance).padStart(12) + String(o.finalField).padStart(7) +
    String(o.published).padStart(11) + (o.ok ? '  OK' : '  MISMATCH'));
}
process.exit(bad ? 1 : 0);
