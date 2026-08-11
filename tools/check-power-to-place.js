// Does power turn into placement?
//
// check-power-gap.js answers "how strong is the best draft before a shot is
// fired". This answers the next question, the one a player actually feels: a
// team that is the strongest in the lobby — where does it finish?
//
// It runs the app's own simulateGame on the app's own field, hundreds of games,
// and prints placement by power rank. If the number-one power finishes near the
// middle, the engine is flat and no draft can win.
//
//   node tools/check-power-to-place.js            duos, card set m2
//   node tools/check-power-to-place.js m1 400     set and game count
'use strict';

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const SET = process.argv[2] || 'm2';
const GAMES = Number(process.argv[3]) || 300;
const SIZE = SET[0] === 't' ? 3 : 2;

const BOOTSTRAP = `
<pre id="__pp" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    CARD_MODE = true; CARD_SET = ${JSON.stringify(SET)}; squadSize = ${SIZE}; isMajorMode = false;
    var pool = cardRosterPlayers(CARD_SET).slice();

    // The player takes the strongest team the board allows — not the top cards
    // by overall, which can be two of the same role and throw the role bonus
    // away, but the best-powered combination among the top of the pool. This is
    // the ceiling: nobody can draft better than this.
    var byOvr = pool.slice().sort(function(a,b){ return attrsFor(b).ovr - attrsFor(a).ovr; });
    var top = byOvr.slice(0, 30);
    var mine = byOvr.slice(0, squadSize), minePow = -Infinity;
    var combo = function(picked, from){
      if (picked.length === squadSize) {
        var p = buildTeam(picked).pow;
        if (p > minePow) { minePow = p; mine = picked.slice(); }
        return;
      }
      for (var i = from; i < top.length; i++) { picked.push(top[i]); combo(picked, i + 1); picked.pop(); }
    };
    combo([], 0);
    out.yourSquad = mine.map(function(p){ return p.handle + ' ' + attrsFor(p).ovr + ' ' + attrsFor(p).roleKey; });
    var rest = pool.filter(function(p){ return mine.indexOf(p) < 0; });
    var raw = [];
    fillFieldTeams(rest, 49, squadSize, raw);
    var teams = [buildTeam(mine)].concat(raw.map(function(t){
      return t.pow != null ? t : buildTeam(t.squad || t);
    }));
    teams[0].isYou = true;
    teams.forEach(function(t, i){ t.name = 'T' + i; t._uid = i; t.totalPts = 0; });

    // Power rank, best first — the yardstick every placement is measured against.
    var byPow = teams.slice().sort(function(a,b){ return b.pow - a.pow; });
    byPow.forEach(function(t, i){ t._powRank = i + 1; });

    var acc = teams.map(function(t){
      return {powRank: t._powRank, pow: t.pow, isYou: !!t.isYou, sum: 0, wins: 0, top3: 0, top10: 0, elims: 0};
    });
    var byUid = {}; acc.forEach(function(a, i){ byUid[i] = a; });

    for (var g = 0; g < ${GAMES}; g++) {
      // The app re-picks landing spots every game; without a picker each squad
      // falls back to its own grid rectangle, which is the Heats' behaviour.
      teams.forEach(function(t){ t.landingZone = null; });
      var order = simulateGame(teams.slice());
      order.forEach(function(t, i){
        var a = byUid[t._uid];
        a.sum += i + 1;
        if (i === 0) a.wins++;
        if (i < 3) a.top3++;
        if (i < 10) a.top10++;
        a.elims += t._elims || 0;
      });
    }
    out.games = ${GAMES};
    out.size = squadSize;
    out.rows = acc;

    // The number a player actually feels: a whole tournament, scored on the
    // app's own table, run over and over. Where do you finish?
    var TOURNEYS = ${Math.max(60, Math.round(GAMES / 2))}, TG = 12;
    var finishes = [], titles = 0;
    for (var s = 0; s < TOURNEYS; s++) {
      teams.forEach(function(t){ t.totalPts = 0; t.totalElims = 0; t.wins = 0; });
      for (var g = 0; g < TG; g++) {
        teams.forEach(function(t){ t.landingZone = null; });
        var ord = simulateGame(teams.slice());
        ord.forEach(function(t, i){
          t.totalPts += pointsForPlace(i + 1) + (t._elims || 0) * 4;
          t.totalElims += t._elims || 0;
          if (i === 0) t.wins++;
        });
      }
      var table = teams.slice().sort(function(a,b){
        return b.totalPts - a.totalPts || b.totalElims - a.totalElims || (b.wins||0) - (a.wins||0); });
      var place = table.findIndex(function(t){ return t.isYou; }) + 1;
      finishes.push(place);
      if (place === 1) titles++;
    }
    out.tourneys = TOURNEYS;
    out.finishes = finishes;
    out.titles = titles;
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__pp').textContent =
    'BEGINPP' + encodeURIComponent(JSON.stringify(out)) + 'ENDPP';
})();
<\/script>`;

// Beside index.html, not in a temp directory: the page loads zone-sim.js with a
// relative src, and without it the app falls back to the round-based engine the
// zone engine replaced — which measures the wrong thing entirely.
const tmp = path.join(ROOT, '.probe-power-to-place.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINPP([\s\S]*?)ENDPP/);
if (!m) { console.error('probe did not run; page at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(tmp, { force: true });
if (out.error) { console.error(out.error); process.exit(2); }

const rows = out.rows.slice().sort((a, b) => a.powRank - b.powRank);
const N = rows.length, G = out.games;
console.log(`set ${SET}, ${out.size}-player squads, ${N} teams, ${G} games\n`);
console.log('pow rank   pow   avg place   win%   top3%   top10%   elims/game');
const show = r => console.log(
  String(r.powRank).padStart(5) + (r.isYou ? ' YOU' : '   ') +
  String(r.pow).padStart(6) +
  (r.sum / G).toFixed(1).padStart(12) +
  (100 * r.wins / G).toFixed(1).padStart(7) +
  (100 * r.top3 / G).toFixed(1).padStart(8) +
  (100 * r.top10 / G).toFixed(1).padStart(9) +
  (r.elims / G).toFixed(1).padStart(13));
rows.slice(0, 6).forEach(show);
console.log('  ...');
[Math.floor(N / 2), N - 1].forEach(i => show(rows[i]));

const you = rows.find(r => r.isYou);
console.log(`\nyour draft: ${out.yourSquad.join(', ')}`);
console.log(`you: power rank ${you.powRank} of ${N}, finish ${(you.sum / G).toFixed(1)} on average, ` +
  `${(100 * you.wins / G).toFixed(1)}% of games won`);
console.log(`a random team would average ${((N + 1) / 2).toFixed(1)} and win ${(100 / N).toFixed(1)}%`);

const f = out.finishes.slice().sort((a, b) => a - b);
const med = f[Math.floor(f.length / 2)];
const pct = n => (100 * f.filter(v => v <= n).length / f.length).toFixed(0) + '%';
console.log(`\n${out.tourneys} full 12-game tournaments with the best draft on the board:`);
console.log(`  titles ${out.titles}/${out.tourneys} (${(100 * out.titles / out.tourneys).toFixed(1)}%)` +
  `   top3 ${pct(3)}   top10 ${pct(10)}   median finish #${med}` +
  `   best #${f[0]}   worst #${f[f.length - 1]}`);
