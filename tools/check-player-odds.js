// What a real run is worth.
//
// check-power-to-place.js measures the ceiling — the best team the board allows.
// A player never gets that: they are dealt packs of four and keep one, the same
// deal the AI gets. This measures the run a player actually plays: draft from
// real packs, play the twelve games, read off the final table. Repeat.
//
// The number to look at is the title rate. In a fifty-team lobby, 2% is chance:
// if a drafted run lands there, the draft is not a decision, it is a die roll.
//
//   node tools/check-player-odds.js            duos, card set m2, 150 runs
//   node tools/check-player-odds.js m1 200
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
const RUNS = Number(process.argv[3]) || 150;
const SIZE = SET[0] === 't' ? 3 : 2;
// How many candidates an AI slot weighs before keeping the best. The app ships
// PACK_SIZE (4) — the same look the player gets. Pass a list to sweep it.
const LOOKS = (process.argv[4] || '').split(',').filter(Boolean).map(Number);
// The engine's READ_NOISE — how much of a squad's storm read is luck. The
// comment on it in zone-sim.js calls it the main lever on how far apart good and
// bad squads finish. Pass a list to sweep it; the app ships 8.
const NOISE = (process.argv[5] || '').split(',').filter(Boolean).map(Number);
// Reproduces what shipped before buildTeam carried attributes: every team reads
// as a default 50 to the engine. Kept so the fix can be measured, not asserted.
const STRIP = process.argv.includes('--no-attrs');

const BOOTSTRAP = `
<pre id="__po" style="display:none"></pre>
<script>
(function(){
  var out = {sweeps: []};
  try {
    CARD_MODE = true; CARD_SET = ${JSON.stringify(SET)}; squadSize = ${SIZE}; isMajorMode = false;

    // The AI's draw, with the number of looks made adjustable so it can be
    // swept. Structure copied from weightedPick's card-mode branch.
    var AI_LOOKS = PACK_SIZE;
    var realWeightedPick = weightedPick;
    window.weightedPick = function(fromList){
      if (!CARD_MODE) return realWeightedPick(fromList);
      var weighted = fromList.map(function(p){ return {p: p, w: packWeightFor(p)}; });
      var total = weighted.reduce(function(s,x){ return s + x.w; }, 0);
      var draw = function(){
        var r = Math.random() * total, i = 0;
        for (; i < weighted.length; i++) { r -= weighted[i].w; if (r <= 0) break; }
        return Math.min(i, weighted.length - 1);
      };
      var best = -1, bestOvr = -Infinity;
      for (var k = 0; k < AI_LOOKS; k++) {
        var i = draw(), v = attrsFor(fromList[i]).ovr;
        if (v > bestOvr) { bestOvr = v; best = i; }
      }
      return best;
    };

    var LOOK_LIST = ${LOOKS.length ? JSON.stringify(LOOKS) : '[PACK_SIZE]'};
    var NOISE_LIST = ${NOISE.length ? JSON.stringify(NOISE) : '[null]'};
    LOOK_LIST.forEach(function(looks){
    NOISE_LIST.forEach(function(noise){
    AI_LOOKS = looks;
    if (noise != null) ZoneSim.tune({READ_NOISE: noise});
    var out2 = {looks: looks, noise: noise, runs: []};
    out.sweeps.push(out2);

    for (var r = 0; r < ${RUNS}; r++) {
      // Draft the way a player who is trying to win drafts: take every pack the
      // app deals, and out of the four keep whichever card leaves the strongest
      // team once it is added. That is the best a human can do with what they
      // are shown — no foresight of later packs, no access to the whole pool.
      pool = cardRosterPlayers(CARD_SET).slice();
      drafted = []; draftedWeapons = []; draftedHeals = [];
      // Both rerolls are spent, the way a player chasing a win spends them: on
      // a pack whose best card is not elite. Rerolling replaces the pack, so
      // what came before is gone — no keeping the best across three packs.
      var rerollsLeftLocal = 2;
      var bestOf = function(pack){
        var best = pack[0], bestScore = -Infinity;
        for (var i = 0; i < pack.length; i++) {
          // A part-built squad still has a power: buildTeam averages, so this
          // ranks candidates sensibly at every round.
          var sc = buildTeam(drafted.concat([pack[i]])).pow;
          if (sc > bestScore) { bestScore = sc; best = pack[i]; }
        }
        return best;
      };
      while (drafted.length < squadSize) {
        var pack = generatePack();
        if (!pack.length) break;
        var best = bestOf(pack);
        while (rerollsLeftLocal > 0 && attrsFor(best).ovr < 93) {
          rerollsLeftLocal--;
          var again = generatePack();
          if (!again.length) break;
          pack = again; best = bestOf(pack);
        }
        drafted.push(best);
        pool = pool.filter(function(p){ return hKey(p) !== hKey(best); });

        // Every draft round also deals a weapon pack and a heal pack. The AI
        // rolls its loadout at random; the player picks, so the player takes the
        // best modifier on offer. Leaving this out understates the player.
        var top = function(pack){
          return pack.reduce(function(a,b){ return b.mod > a.mod ? b : a; }, pack[0]);
        };
        var wp = generateWeaponPack(), hp = generateHealPack();
        if (wp.length) draftedWeapons.push(top(wp));
        if (hp.length) draftedHeals.push(top(hp));
      }
      if (drafted.length < squadSize) continue;

      var mine = buildTeam(drafted);
      mine.loadout = loadoutBonus();
      mine.pow += mine.loadout;
      var raw = [];
      fillFieldTeams(pool.slice(), 49, squadSize, raw);
      var teams = [mine].concat(raw.map(function(t){
        return t.pow != null ? t : buildTeam(t.squad || t); }));
      teams[0].isYou = true;
      teams.forEach(function(t, i){ t.name = 'T' + i; t._uid = i; });
      if (${STRIP}) teams.forEach(function(t){ delete t.attrs; });

      var stronger = teams.filter(function(t){ return t.pow > mine.pow; }).length;
      // Which engine is about to run. If this is ever false the numbers below
      // describe the round-based model, not the one the app plays on.
      out.zoneEngine = useZoneSim(teams);

      teams.forEach(function(t){ t.totalPts = 0; t.totalElims = 0; t.wins = 0; });
      for (var g = 0; g < 12; g++) {
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

      out2.runs.push({
        pow: mine.pow,
        powRank: stronger + 1,
        bestAI: Math.max.apply(null, teams.slice(1).map(function(t){ return t.pow; })),
        place: table.findIndex(function(t){ return t.isYou; }) + 1,
        pts: mine.totalPts,
        gameWins: mine.wins,
        squad: drafted.map(function(p){ return attrsFor(p).ovr; })
      });
    }
    });
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__po').textContent =
    'BEGINPO' + encodeURIComponent(JSON.stringify(out)) + 'ENDPO';
})();
<\/script>`;

// The page loads zone-sim.js with a relative src, so the probe has to live
// beside it — copied to a temp directory the engine never loads and the app
// silently falls back to the round-based model it replaced, which is not the
// thing being measured.
const tmp = path.join(ROOT, '.probe-player-odds.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINPO([\s\S]*?)ENDPO/);
if (!m) { console.error('probe did not run; page at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(tmp, { force: true });
if (out.error) { console.error(out.error); process.exit(2); }

if (!out.zoneEngine) {
  console.error('the zone engine did not run — this measured the round-based fallback');
  process.exit(2);
}
console.log(`set ${SET}, ${SIZE}-player squads, ${RUNS} drafted runs of 12 games in a 50-team lobby`);
console.log(`the player drafts from real packs and spends both rerolls\n`);
console.log('noise   your pow   best AI   your rank   title   top3   top10   median   wins/12');
out.sweeps.forEach(s => {
  const R = s.runs, n = R.length;
  if (!n) { console.log(String(s.noise).padStart(5) + '   no runs'); return; }
  const avg = f => R.reduce((a, x) => a + f(x), 0) / n;
  const pct = p => (100 * R.filter(p).length / n).toFixed(1) + '%';
  const places = R.map(x => x.place).sort((a, b) => a - b);
  console.log(
    String(s.noise == null ? 'ship' : s.noise).padStart(5) + '   ' +
    avg(x => x.pow).toFixed(1).padStart(8) +
    avg(x => x.bestAI).toFixed(1).padStart(10) +
    avg(x => x.powRank).toFixed(1).padStart(12) +
    pct(x => x.place === 1).padStart(8) +
    pct(x => x.place <= 3).padStart(7) +
    pct(x => x.place <= 10).padStart(8) +
    ('#' + places[Math.floor(n / 2)]).padStart(9) +
    avg(x => x.gameWins).toFixed(2).padStart(10));
});
console.log(`\nchance in a 50-team lobby is a 2.0% title and a median of #25.5.`);
console.log(`the app ships AI looks = PACK_SIZE = 4.`);
