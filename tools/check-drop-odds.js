// How much a contested drop is worth to the stronger squad.
//
// Off the spawn nobody has a loadout, a position or any information, so the spot
// is close to a coin flip: power is allowed to favour a squad and never to hand
// it the spot. LANDING_ODDS_CAP is the ceiling; this measures what the game
// actually pays, both on the picker's own quote and in a played game.
//
//   node tools/check-drop-odds.js
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
<pre id="__do" style="display:none"></pre>
<script>
(function(){
  var out = {quoted: [], played: [], checks: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    CARD_MODE = true; CARD_SET = 'm2'; squadSize = 2; isMajorMode = false;
    out.cap = LANDING_ODDS_CAP;

    // What the picker quotes, across the whole range of power gaps a lobby holds.
    [[104,104],[108,104],[112,104],[109,86],[120,80],[99,60]].forEach(function(pair){
      out.quoted.push({you: pair[0], rival: pair[1],
        chance: +(100 * landingWinChanceVs({pow: pair[0]}, {pow: pair[1]})).toFixed(1)});
    });
    check('no matchup is quoted above the cap',
      out.quoted.every(function(q){ return q.chance <= LANDING_ODDS_CAP * 100 + 0.05; }),
      'highest quote ' + Math.max.apply(null, out.quoted.map(function(q){ return q.chance; })) + '%');
    check('more power is still worth something',
      out.quoted[1].chance > out.quoted[0].chance,
      '104 v 104 = ' + out.quoted[0].chance + '%, 108 v 104 = ' + out.quoted[1].chance + '%');

    // And what a played game pays. Counted on the duel itself rather than on
    // who ended up dead: a drop-window death can also come from chip damage or
    // the storm, and those are not the spot being contested. Every call the
    // engine makes inside the first forty seconds is tallied here, so the sample
    // is every fight rather than the few that ended in a body.
    var pool = cardRosterPlayers('m2').slice();
    var byOvr = pool.slice().sort(function(a,b){ return attrsFor(b).ovr - attrsFor(a).ovr; });
    // Two squads alone on an island produce about forty drop fights in six
    // hundred games, and forty is ±8 points — enough to make this read pass or
    // fail on the shuffle. A crowded spot settles it: twenty squads on one
    // rectangle fight constantly, and only strong-versus-weak pairings are
    // counted, so the sample is hundreds and the number holds still.
    var tally = null;
    var realDrop = resolveDropDuel;
    window.resolveDropDuel = function(a, b){
      var w = realDrop(a, b);
      if (tally && a._tier !== b._tier) {
        tally.n++;
        if (w._tier === 'strong') tally.strong++;
      }
      return w;
    };
    [[0, 'even'], [1, 'wide']].forEach(function(mode){
      var strongCards = byOvr.slice(0, 20);
      var weakCards = mode[0] ? byOvr.slice(-20) : byOvr.slice(20, 40);
      var teams = [], u = 0;
      for (var k = 0; k < 10; k++) {
        var s = buildTeam(strongCards.slice(k * 2, k * 2 + 2));
        var w2 = buildTeam(weakCards.slice(k * 2, k * 2 + 2));
        s._tier = 'strong'; w2._tier = 'weak';
        s.name = 'S' + k; w2.name = 'W' + k;
        teams.push(s, w2);
      }
      teams.forEach(function(t){ t._uid = u++; });
      var strongPow = Math.round(teams.filter(function(t){ return t._tier === 'strong'; })
        .reduce(function(a2, t){ return a2 + t.pow; }, 0) / 10);
      var weakPow = Math.round(teams.filter(function(t){ return t._tier === 'weak'; })
        .reduce(function(a2, t){ return a2 + t.pow; }, 0) / 10);
      tally = {n: 0, strong: 0};
      for (var g = 0; g < 120; g++) {
        teams.forEach(function(t){ t.landingZone = ALL_LANDING_ZONES[0]; });
        simulateGame(teams.slice());
      }
      out.played.push({gap: mode[1], strong: strongPow, weak: weakPow, decided: tally.n,
        strongWinPct: tally.n ? +(100 * tally.strong / tally.n).toFixed(1) : null});
    });
    tally = null;
    // Each read is a few hundred coin flips, so it carries about four points of
    // sampling error. The assertions are written wide enough to survive that and
    // narrow enough to fail if the cap is removed: without it the wide gap pays
    // better than 95%, which no tolerance here would let through.
    out.played.forEach(function(p){
      if (p.strongWinPct == null) return;
      check('the sample is big enough to read (' + p.gap + ' gap)',
        p.decided >= 300, p.decided + ' drop fights');
      if (p.gap === 'even') {
        // Two squads three power apart is a coin flip, and is supposed to be.
        check('a near-even matchup lands near even (' + p.strong + ' v ' + p.weak + ')',
          Math.abs(p.strongWinPct - 50) <= 7,
          'stronger squad won ' + p.strongWinPct + '% of ' + p.decided + ' drop fights');
      } else {
        // The widest gap in any lobby pays the cap and no more.
        check('the widest gap pays about the cap (' + p.strong + ' v ' + p.weak + ')',
          p.strongWinPct >= 53 && p.strongWinPct <= LANDING_ODDS_CAP * 100 + 4,
          'stronger squad won ' + p.strongWinPct + '% of ' + p.decided +
          ' drop fights, cap ' + (LANDING_ODDS_CAP * 100) + '%');
      }
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__do').textContent =
    'BEGINDO' + encodeURIComponent(JSON.stringify(out)) + 'ENDDO';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-drop-odds.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINDO([\s\S]*?)ENDDO/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

console.log('cap: the stronger squad never takes a spot more than ' + (out.cap * 100).toFixed(0) + '% of the time\n');
console.log('quoted by the picker');
out.quoted.forEach(r => console.log('  ' + String(r.you).padStart(4) + ' v ' + String(r.rival).padEnd(4) + '  ' + r.chance + '%'));
console.log('\nplayed on the map');
out.played.forEach(r => console.log('  ' + r.gap.padEnd(5) + ' ' + r.strong + ' v ' + r.weak +
  '   stronger squad won ' + r.strongWinPct + '% of ' + r.decided + ' drop fights'));

let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
