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
  // A seeded clock for the whole run, because this check was a coin flip.
  //
  // Drop contests need two squads to want the same box, and a trio lobby is 33
  // squads on 29 of them, so most of the field lands alone and the number of
  // decided drops comes out in single digits. Measured over eight runs of the
  // untouched file it was 11, 11, 11, 9, 9, 7, 5 and 4 against a threshold of
  // eight — three runs in eight failed, on code nobody had touched. A check
  // that fails a third of the time on a good tree teaches everyone to ignore
  // it, and then it is worse than no check at all.
  //
  // So the run is pinned. mulberry32, the same shape ZoneSim.createRng uses,
  // seeded once before anything reads Math.random. The thresholds below are
  // then real numbers about the app rather than a bet on the weather.
  (function(seed){
    Math.random = function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  })(20260813);
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

      // The cell prints the record and nothing else — no zone number in front.
      var cell = landingCellHTML(teams.filter(function(t){ return landingRecord(t); })[0] || teams[0]);
      out.cellSample = cell;
      var records = teams.map(function(t){ return landingRecord(t); });
      var withRecord = records.filter(Boolean).length;
      var decided = teams.filter(function(t){ return (t.landingWins + t.landingLosses) > 0; }).length;
      var sample = teams.slice(0, 6).map(function(t){ return landingRecord(t) || '—'; });
      out.sets.push({set: set, squads: teams.length, games: GAMES,
        withRecord: withRecord, decided: decided, sample: sample,
        totalFights: teams.reduce(function(s,t){ return s + t.landingWins; }, 0)});

      // A dash is a real answer, not a gap: it means nobody else dropped there
      // all stage. Since the pick order became the qualifying order, the squads
      // that fight over a box are the ones that qualified early and all wanted
      // the same POI, so in a trio lobby — 33 squads on 29 boxes — most of the
      // field lands alone and reads "—", while a duo lobby at 50 on 36 fights
      // nearly everywhere. Measured: about 13 of 32 rows in trios, 45 of 49 in
      // duos. What the column must not be is empty.
      check(set + ': the column carries real records, not a wall of dashes',
        withRecord >= teams.length * 0.25,
        withRecord + ' of ' + teams.length + ' rows');
      // What the record now counts is contested drops survived, not corpses, so
      // the question this check asks changed with it. Counting squads that had a
      // fight end in a body was the old measure and it is no longer what the
      // column reports — on the map that is about one and a half drops decided
      // per game across the whole lobby, which is exactly why the column read
      // "0-0" for everybody and why this was rewritten.
      //
      // The thing worth guarding now is that somebody's record is substantial
      // after a stage: if the busiest squad in the lobby cannot reach half the
      // games with a contested drop, either the drop stopped being contested or
      // the count stopped reaching the cell, and both are the failure this
      // check exists for. Seeded, the busiest squad is well clear of it.
      var busiest = teams.reduce(function(m, t){ return Math.max(m, t.landingContests || 0); }, 0);
      check(set + ': the record says something after twelve games',
        busiest >= GAMES / 2,
        'the busiest squad landed on somebody ' + busiest + ' times of ' + GAMES +
        ', and ' + decided + ' of ' + teams.length + ' squads had a drop end in a body');
      check(set + ': the cell carries no zone number',
        cell.indexOf('#') < 0, 'cell reads ' + cell.replace(/<[^>]+>/g, ''));
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
