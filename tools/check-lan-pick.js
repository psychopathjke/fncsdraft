// Picking last at the LAN — what does it cost?
//
// Everyone in Lyon holds a seat, but not from the same day: the Major 1
// qualifiers were booked while Major 2 was still being played. gcRoute records
// which Major sent a team, and the room picks in the order it filled, so a
// player arriving out of the last regional final chooses after all of them.
//
// That is the right shape and it is also a handicap, so it gets measured rather
// than assumed: what spot the player ends up with, and where they finish.
//
//   node tools/check-lan-pick.js
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
<pre id="__lp" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], modes: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    CARD_MODE = true; CARD_SET = 't3'; squadSize = 3; isMajorMode = true;
    useLandingSet('t3');
    var poolAll = cardRosterPlayers('t3').slice();

    // A Lyon field: 32 seats filled through the three Majors, plus the player
    // arriving from the last regional final with no route of their own.
    function lanField(){
      pool = poolAll.slice(); drafted = poolAll.slice(0, 3);
      var teams = [];
      fillFieldTeams(poolAll.slice(3), TEAM_TARGET[3] - 1, 3, teams);
      teams.forEach(function(t, i){
        t._uid = i; if(!t.name) t.name = 'T' + i;
        t.gcRoute = i < 8 ? 'm1' : (i < 21 ? 'm2' : 'm3');
      });
      var you = buildTeam(drafted);
      you.isYou = true; you.name = 'YOU'; you._uid = teams.length;
      return {teams: teams, you: you};
    }

    // Two worlds: the player picking last as the route order says, and the
    // player picking on power as they used to.
    [["M3, won my final", "top"], ["M3, scraped in", "bottom"], ["with the Major 1 seats", "m1"]].forEach(function(mode){
      var how = mode[1];
      var spot = 0, alone = 0, place = 0, wins = 0, top3 = 0, RUNS = 120;
      for (var r = 0; r < RUNS; r++) {
        var f = lanField();
        var you = f.you, teams = f.teams;
        // Booked through Major 3, like the rest of that block — which is what
        // buildGlobalChampionship2025Field stamps on you.
        you.gcRoute = (how === 'm1') ? 'm1' : 'm3';
        // Where the regional final left you, which is the tiebreak inside a block.
        teams.forEach(function(t, i){ t.stagePts = 200 + (i % 50); });
        you.stagePts = (how === 'top') ? 400 : 0;
        var all = teams.concat([you]);
        var order = all.slice().sort(byQualOrder);
        var ahead = order.slice(0, order.indexOf(you));
        var behind = order.slice(order.indexOf(you) + 1);
        var groups = buildBotLandingAssignment(ahead).zoneGroups;
        // The player takes the best box still free, which is the best a player
        // reading the map can do.
        var best = null, bestPts = -Infinity;
        ALL_LANDING_ZONES.forEach(function(z){
          var occupied = (groups.get(z) || []).length;
          var value = z.points - occupied * 3;
          if (value > bestPts) { bestPts = value; best = z; }
        });
        you.landingZone = best; applyLandingPow(you, best.points);
        if (!groups.has(best)) groups.set(best, []);
        groups.get(best).push(you);
        buildBotLandingAssignment(behind, {into: groups});

        spot += best.points;
        if ((groups.get(best) || []).length === 1) alone++;

        // Twelve games on that board.
        all.forEach(function(t){ t.totalPts = 0; t.totalElims = 0; });
        for (var g = 0; g < 12; g++) {
          var ord = simulateGame(all.slice());
          ord.forEach(function(t, i){ t.totalPts += pointsForPlace(i + 1) + (t._elims || 0) * 4; });
        }
        var table = all.slice().sort(function(x, y){ return y.totalPts - x.totalPts; });
        var p = table.indexOf(you) + 1;
        place += p;
        if (p === 1) wins++;
        if (p <= 3) top3++;
      }
      out.modes.push({mode: mode[0], spot: +(spot / RUNS).toFixed(2),
        alonePct: +(100 * alone / RUNS).toFixed(1), place: +(place / RUNS).toFixed(1),
        titlePct: +(100 * wins / RUNS).toFixed(1), top3Pct: +(100 * top3 / RUNS).toFixed(1), runs: RUNS});
    });

    var route = out.modes[0], scraped = out.modes[1], power = out.modes[2];
    // The lever the player actually holds. Which Major sent you sets your block;
    // how you finished sets your place inside it, and that is worth more than
    // the block is. Winning your regional final buys a quiet box 95% of the
    // time; scraping in means landing on somebody every single game.
    check('winning your regional final is worth more than which Major sent you',
      (route.place < scraped.place) && (route.place - power.place) < (scraped.place - route.place),
      'won my final ' + route.place + ', scraped in ' + scraped.place + ', Major 1 block ' + power.place);
    check('scraping in is punished, not merely noted',
      scraped.alonePct < 20 && scraped.top3Pct < route.top3Pct,
      'scraped in lands alone ' + scraped.alonePct + '% and makes the podium ' + scraped.top3Pct + '%');
    check('picking last costs the player a worse spot',
      route.spot < power.spot, 'route ' + route.spot + ' pts against ' + power.spot);
    // A title is a handful of events at this sample size and reads as noise;
    // the podium has enough of them to mean something.
    check('the player can still reach the podium at the LAN',
      route.top3Pct >= 10, 'top 3 in ' + route.top3Pct + '% of ' + route.runs + ' runs, title ' + route.titlePct + '%');
    check('the handicap is a handicap, not a wall',
      route.place - power.place < 8,
      'average finish ' + route.place + ' against ' + power.place);
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__lp').textContent =
    'BEGINLP' + encodeURIComponent(JSON.stringify(out)) + 'ENDLP';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-lan-pick.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINLP([\s\S]*?)ENDLP/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

console.log('the player at the LAN, ' + (out.modes[0] || {}).runs + ' runs of 12 games in a 33-team lobby\n');
console.log('  picking' + ' '.repeat(19) + 'spot   landed alone   avg finish   top3   title');
out.modes.forEach(m2 => console.log('  ' + m2.mode.padEnd(24) +
  String(m2.spot).padStart(5) + String(m2.alonePct + '%').padStart(14) +
  String(m2.place).padStart(13) + String(m2.top3Pct + '%').padStart(7) + String(m2.titlePct + '%').padStart(8)));

let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
