// Where the field lands, and who contests. Compares the simulation's own drop
// map against the real ones: on the FNCS 2025 Global Championship map, 33 trios
// took about 27 boxes — four of them shared, holding roughly ten teams, and the
// shared boxes are the named POIs rather than open field.
//
//   node tools/check-drop-contests.js [set]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SET = process.argv[2] || 't3';
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const SIZE = /^m[12]$/.test(SET) ? 2 : 3;
const BOOTSTRAP = `
<pre id="__p" style="display:none"></pre>
<script>
(function(){
  var out = {set: ${JSON.stringify(SET)}, trials: 300};
  try {
    CARD_SET = ${JSON.stringify(SET)}; CARD_MODE = true; squadSize = ${SIZE};
    useLandingSet(${JSON.stringify(SET)});
    var roster = cardRosterPlayers(${JSON.stringify(SET)}).filter(function(p){ return p.region === 'EU'; })
                   .sort(function(a,b){ return b.rating - a.rating; });
    var perZone = {}, contestedTeams = 0, teams = 0, zonesUsed = 0, rounds = 0;
    // Is the squad that contests a strong one? Measured as the average power
    // percentile of every team sharing a box.
    var contestPow = 0, contestN = 0, fieldPow = 0, fieldN = 0;
    // And is the box it contests a good one?
    var contestPts = 0, allPts = 0;
    for (var t = 0; t < out.trials; t++) {
      var built = [];
      for (var i = 0; i + ${SIZE} <= roster.length && built.length < 32; i += ${SIZE}) {
        var sq = roster.slice(i, i + ${SIZE});
        var team = buildTeam(sq); team.name = teamLabel(sq); built.push(team);
      }
      var res = buildBotLandingAssignment(built);
      rounds++;
      var groups = res.zoneGroups;
      groups.forEach(function(group, zone){
        zonesUsed++;
        perZone[group.length] = (perZone[group.length] || 0) + 1;
        allPts += zone.points;
        group.forEach(function(tm){
          teams++; fieldPow += tm.pow; fieldN++;
          if (group.length >= 2) { contestedTeams++; contestPow += tm.pow; contestN++; contestPts += zone.points; }
        });
      });
    }
    out.teamsPerLobby = Math.round(teams / rounds);
    out.boxesPerLobby = Math.round(zonesUsed / rounds);
    out.contestedShare = Math.round(1000 * contestedTeams / teams) / 10 + '%';
    out.boxSizes = perZone;
    out.avgPowAll = Math.round(fieldPow / Math.max(fieldN, 1));
    out.avgPowContesting = Math.round(contestPow / Math.max(contestN, 1));
    out.avgZonePointsAll = Math.round(100 * allPts / Math.max(zonesUsed, 1)) / 100;
    out.avgZonePointsContested = Math.round(100 * contestPts / Math.max(contestN, 1)) / 100;
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__p').textContent = 'BEGINP' + encodeURIComponent(JSON.stringify(out)) + 'ENDP';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drops-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINP((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])+)ENDP/);
if (!m) { console.error('probe did not run'); process.exit(1); }
console.log(JSON.stringify(JSON.parse(decodeURIComponent(m[1])), null, 1));
