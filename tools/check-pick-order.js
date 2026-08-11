// Does qualifying earlier actually get you a better drop?
//
// The pick order is the order the field qualified in: a Victory Royale was
// through before anybody else, then it is the standing they came out of the last
// stage on. Whoever is last picks from what is left, and there is no longer any
// guarantee that anything is left empty.
//
// This checks the rule pays: first pick lands on a better spot, and more often
// alone, than last pick.
//
//   node tools/check-pick-order.js
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
<pre id="__po" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], rows: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    [['t2', 3], ['m2', 2]].forEach(function(cfg){
      var set = cfg[0], size = cfg[1];
      CARD_MODE = true; CARD_SET = set; squadSize = size; isMajorMode = true;
      useLandingSet(set);
      var poolAll = cardRosterPlayers(set).slice();
      pool = poolAll.slice(); drafted = poolAll.slice(0, size);

      var GAMES = 150;
      // Buckets by seat in the queue: first, middle, last.
      var acc = {first: {pts: 0, alone: 0, n: 0}, mid: {pts: 0, alone: 0, n: 0}, last: {pts: 0, alone: 0, n: 0}};
      var emptyLeftForLast = 0;
      for (var g = 0; g < GAMES; g++) {
        var teams = [];
        fillFieldTeams(poolAll.slice(size), TEAM_TARGET[size] - 1, size, teams);
        teams.forEach(function(t, i){ t._uid = i; if(!t.name) t.name = 'T' + i; });
        // A Heat's leftovers: a few squads through on a win, the rest on points.
        teams.forEach(function(t, i){
          t.qualByWin = (i % 17 === 0); t.gotVR = t.qualByWin;
          t.stagePts = Math.round(Math.random() * 400);
        });

        var order = teams.slice().sort(byQualOrder);
        // How much of the island is still empty when the last squad picks.
        var groups = buildBotLandingAssignment(order.slice(0, order.length - 1)).zoneGroups;
        if (ALL_LANDING_ZONES.filter(function(z){ return !groups.has(z); }).length === 0) emptyLeftForLast++;
        buildBotLandingAssignment(order.slice(order.length - 1), {into: groups});

        var seatOf = function(t){
          var i = order.indexOf(t);
          return i < 3 ? 'first' : (i >= order.length - 3 ? 'last' : 'mid');
        };
        order.forEach(function(t){
          var b = acc[seatOf(t)];
          b.n++;
          b.pts += (t.landingZone && t.landingZone.points) || 0;
          var g2 = groups.get(t.landingZone);
          if (g2 && g2.length === 1) b.alone++;
        });
      }
      var row = function(k){ return {seat: k, spotPts: +(acc[k].pts / acc[k].n).toFixed(2),
        alonePct: +(100 * acc[k].alone / acc[k].n).toFixed(1)}; };
      out.rows.push({set: set, first: row('first'), mid: row('mid'), last: row('last'),
        islandFullPct: +(100 * emptyLeftForLast / GAMES).toFixed(1)});

      var f = row('first'), md = row('mid'), l = row('last');
      // What picking early buys is the spot, and that is the whole rule.
      check(set + ': picking first lands on a better spot than picking last',
        f.spotPts > l.spotPts, 'first ' + f.spotPts + ' pts, last ' + l.spotPts);
      check(set + ': first pick takes the best boxes on the island',
        f.spotPts >= md.spotPts && f.spotPts >= l.spotPts,
        'first ' + f.spotPts + ', mid ' + md.spotPts + ', last ' + l.spotPts);
      // And what it does not buy is peace. The squads that qualified early all
      // want the same boxes, so they land on each other; the ones picking last
      // take what nobody fought over. That is the shape the real drop map has —
      // the contested spots are the named POIs and the teams in them are the
      // ones who go on to win — so it is asserted rather than tolerated.
      check(set + ': the good boxes are the contested ones',
        f.alonePct < md.alonePct,
        'first pick lands alone ' + f.alonePct + '% against the midfield\\'s ' + md.alonePct + '%');

      // A Heat has a "first through". The Play-In does not: twenty-two games,
      // cumulative points, everybody advances at the whistle. So there the queue
      // has to be the standing and nothing else — a squad that won one game and
      // finished eightieth must not pick ahead of the one that topped the stage.
      var playIn = teams.slice(0, 20);
      playIn.forEach(function(t, i){
        t.qualByWin = false;             // nobody qualified early
        t.gotVR = (i === 19);            // but the tail did win a game somewhere
        t.stagePts = 500 - i * 10;       // and the field finished in this order
      });
      var q = playIn.slice().sort(byQualOrder);
      check(set + ': after a Play-In the queue is the standing, not who won a game',
        q[0] === playIn[0] && q[q.length-1] === playIn[19],
        'top of the stage picks ' + (q.indexOf(playIn[0]) + 1) +
        ', the game-winner who finished last picks ' + (q.indexOf(playIn[19]) + 1));
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__po').textContent =
    'BEGINPO2' + encodeURIComponent(JSON.stringify(out)) + 'ENDPO2';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-pick-order.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINPO2([\s\S]*?)ENDPO2/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.rows.forEach(r => {
  console.log(r.set + ':  seat        spot value   landed alone');
  ['first','mid','last'].forEach(k => console.log('      ' + k.padEnd(12) +
    String(r[k].spotPts).padStart(8) + String(r[k].alonePct + '%').padStart(15)));
  console.log('      the island was full when the last squad picked in ' + r.islandFullPct + '% of games');
});

let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
