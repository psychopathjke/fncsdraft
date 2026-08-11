// What the drop column actually says after a stage.
//
// It has been added and pulled twice. Both removals were for the same reason: a
// drop that ended in a body once in ten produced "1-0" after twelve games, which
// reads as though the spot was empty all stage when the truth was the opposite.
// Now that squads landing on each other settle it, this checks the column is
// worth its width — most rows carrying a real record rather than a dash.
//
//   node tools/check-drop-record.js
'use strict';

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__dr" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], sets: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    [['t2', 3], ['m2', 2]].forEach(function(cfg){
      var set = cfg[0], size = cfg[1];
      CARD_MODE = true; CARD_SET = set; squadSize = size; isMajorMode = true;
      useLandingSet(set);
      var poolAll = cardRosterPlayers(set).slice();
      pool = poolAll.slice(); drafted = poolAll.slice(0, size);

      var teams = [];
      fillFieldTeams(poolAll.slice(size), TEAM_TARGET[size] - 1, size, teams);
      teams.forEach(function(t, i){ t._uid = i; if(!t.name) t.name = 'T' + i;
        t.landingWins = 0; t.landingLosses = 0; t.landingContests = 0; });

      // A stage: twelve games, spots re-picked each one, the way a stage runs.
      var GAMES = 12;
      for (var g = 0; g < GAMES; g++) {
        buildBotLandingAssignment(teams);
        var shared = new Map();
        teams.forEach(function(t){ if(t.landingZone) shared.set(t.landingZone, (shared.get(t.landingZone)||0)+1); });
        teams.forEach(function(t){ if(t.landingZone && shared.get(t.landingZone) > 1) t.landingContests++; });
        simulateGame(teams.slice());
        // The same read the live stage does: a squad flagged as dropping out lost
        // its drop, and whoever is named as its cause won that fight.
        var byName = new Map(teams.map(function(t){ return [t.name, t]; }));
        teams.forEach(function(t){
          if(!t._droppedOut) return;
          t.landingLosses++;
          var killer = byName.get(t._deathCause);
          if(killer) killer.landingWins++;
        });
      }

      var records = teams.map(function(t){ return landingRecord(t); });
      var withRecord = records.filter(Boolean).length;
      var decided = teams.filter(function(t){ return (t.landingWins + t.landingLosses) > 0; }).length;
      var sample = teams.slice(0, 6).map(function(t){ return landingRecord(t) || '—'; });
      out.sets.push({set: set, squads: teams.length, games: GAMES,
        withRecord: withRecord, decided: decided, sample: sample,
        totalFights: teams.reduce(function(s,t){ return s + t.landingWins; }, 0)});

      check(set + ': most rows carry a record rather than a dash',
        withRecord >= teams.length * 0.8,
        withRecord + ' of ' + teams.length + ' rows');
      check(set + ': the record says something after twelve games',
        decided >= teams.length * 0.5,
        decided + ' of ' + teams.length + ' squads won or lost at least one drop');
      check(set + ': wins and losses balance',
        teams.reduce(function(s,t){ return s + t.landingWins; }, 0) ===
        teams.reduce(function(s,t){ return s + t.landingLosses; }, 0),
        'wins ' + teams.reduce(function(s,t){ return s + t.landingWins; }, 0) +
        ' vs losses ' + teams.reduce(function(s,t){ return s + t.landingLosses; }, 0));
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__dr').textContent =
    'BEGINDR' + encodeURIComponent(JSON.stringify(out)) + 'ENDDR';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-drop-record.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINDR([\s\S]*?)ENDDR/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.sets.forEach(s => console.log(s.set + ': ' + s.squads + ' squads over ' + s.games + ' games — ' +
  s.withRecord + ' rows with a record, ' + s.decided + ' squads won or lost one, ' +
  s.totalFights + ' drops decided\n    first rows: ' + s.sample.join('  ')));

let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
