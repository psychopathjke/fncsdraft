// The real-team list that the realistic simulation is built on: it has to be
// every real roster in the Major's data, each one once, ordered by the rating
// of its cards, with nobody in it whose teammate is missing from the pool.
//
//   node tools/check-realistic.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__real" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    // Major 2, Europe, duos — the set the numbers in the spec were measured on.
    pendingSize = 2; pendingMajor = false; pendingCards = true;
    pendingCardSet = 'm2'; pendingMapSet = 'm2';
    preSelectedRegions = ['EU']; preSelectedYears = [];
    REALISTIC = true;
    startDraft(2, false);

    var built = realTeamsFor(pool);
    var teams = built.teams;
    out.dropped = built.dropped;
    out.count = teams.length;
    out.top = teams.slice(0, 3).map(function(t){
      return {who: t.handles.join(' & '), avg: Math.round(t.avg), stage: t.stage, rank: t.rank};
    });
    // Ordered, high to low — and where two teams average the same rating, the
    // better finish comes first. Ties are not hypothetical here: pairwise
    // averages of integer ratings collide constantly, and the top of this very
    // list has one.
    out.ordered = teams.every(function(t, i){ return i === 0 || teams[i-1].avg >= t.avg; });
    out.tiesBroken = teams.every(function(t, i){
      return i === 0 || teams[i-1].avg !== t.avg || teams[i-1].rank <= t.rank;
    });
    out.tieCount = teams.filter(function(t, i){ return i > 0 && teams[i-1].avg === t.avg; }).length;
    // Every roster once.
    var seen = {}, dupes = 0;
    teams.forEach(function(t){
      var k = t.handles.slice().sort().join('|');
      if (seen[k]) dupes++; else seen[k] = 1;
    });
    out.dupes = dupes;
    // Every listed team is complete and its members really are in the pool.
    var inPool = {};
    pool.forEach(function(p){ inPool[p.handle] = 1; });
    out.incomplete = teams.filter(function(t){
      return t.cards.length !== t.handles.length || t.handles.some(function(h){ return !inPool[h]; });
    }).length;
    // Every team is the right size for the mode.
    out.wrongSize = teams.filter(function(t){ return t.handles.length !== 2; }).length;
    // The drop rule, exercised rather than hoped for: hold one player of the
    // top team back and that team must vanish from the list.
    var stranded = teams[0].handles[0];
    var thinner = pool.filter(function(p){ return p.handle !== stranded; });
    var reduced = realTeamsFor(thinner);
    out.dropOnePool = {
      count: reduced.teams.length,
      dropped: reduced.dropped,
      strandedListed: reduced.teams.some(function(t){
        return t.handles.indexOf(stranded) >= 0;
      })
    };
    // Taking a team fills the squad with that whole roster and nothing else.
    renderTeamPicker();
    var target = teamPickList[0];
    pickTeam(target);
    out.draftedHandles = drafted.map(function(p){ return p.handle; });
    out.targetHandles = target.handles.slice();
    out.poolStillHasThem = target.handles.filter(function(h){
      return pool.some(function(p){ return p.handle === h; });
    }).length;
    // The field the tournament plays: real rosters, the player's team not
    // among them twice, and the lobby the right size.
    var you = buildTeam(drafted); you.isYou = true;
    var field = [you];
    var leftover = fillRealFieldTeams(pool, 49, 2, field);
    out.fieldSize = field.length;
    out.fieldNames = field.map(function(t){ return t.name; });
    var realKeys = {};
    realTeamsFor(PLAYERS_BASE.filter(function(p){ return p.cardSet === 'm2' && p.region === 'EU'; }))
      .teams.forEach(function(t){ realKeys[t.handles.slice().sort().join('|')] = 1; });
    out.assembled = field.slice(1).filter(function(t){
      return !realKeys[t.squad.map(function(p){ return p.handle; }).sort().join('|')];
    }).length;
    out.mineDuplicated = field.slice(1).filter(function(t){
      return t.squad.some(function(p){ return drafted.some(function(d){ return d.handle === p.handle; }); });
    }).length;
    // No player may be in two rival teams at once. realTeamsFor keys a team by
    // its roster, and eleven players in this data legitimately appear in two
    // different real rosters across stages, so the field builder guards against
    // it.
    function countDoubleBooked(teams){
      var seen = {}, n = 0;
      teams.forEach(function(t){
        t.squad.forEach(function(p){
          if (seen[p.handle]) n++;
          seen[p.handle] = 1;
        });
      });
      return n;
    }
    out.doubleBooked = countDoubleBooked(field.slice(1));

    // And the same guard where it can actually be seen working. At a 49-team
    // lobby it never fires: every colliding pair's two rosters sit more than
    // forty-nine places apart in the rating order — the nearest are ranks 29 and
    // 77 — so the scan meets only one of each and removing the guard changes
    // nothing. Measured at ninety: two collisions without the guard, none with
    // it. Ninety is not a lobby size; it is the depth at which this guard is
    // testable, and a guard that has never been seen to fail is not yet tested.
    var wideField = [];
    fillRealFieldTeams(pool, 90, 2, wideField);
    out.wideFieldSize = wideField.length;
    out.doubleBookedWide = countDoubleBooked(wideField);

    // The shortfall path, which the full pool never reaches: ask for a lobby
    // larger than the supply of whole rosters and the padding must happen AND
    // say so.
    var said = [], realLog = console.log;
    console.log = function(){ said.push(Array.prototype.join.call(arguments, ' ')); };
    var thinField = [];
    fillRealFieldTeams(pool.slice(0, 60), 49, 2, thinField);
    console.log = realLog;
    out.shortField = thinField.length;
    out.shortLogged = said.some(function(s){ return s.indexOf('[realistic]') >= 0; });
    // The loot rounds, which are the reason draftedEnough() counts rounds
    // instead of players. A realistic duo must get two of them: rivals roll a
    // weapon and a consumable per player, so one round would hand the player
    // half the lobby's loadout on every run, and nothing on screen would say so.
    out.roundsAfterPick = round;
    pickWeapon(currentWeaponOptions[0]);
    pickHeal(currentHealOptions[0]);
    out.roundAfterFirstLoot = round;
    out.draftDoneAfterOne = draftIsComplete();
    pickWeapon(currentWeaponOptions[0]);
    pickHeal(currentHealOptions[0]);
    out.weaponsTaken = draftedWeapons.length;
    out.healsTaken = draftedHeals.length;
    out.draftDoneAfterTwo = draftIsComplete();
  } catch (e) { out = {error: String(e && e.stack || e)}; }
  document.getElementById('__real').textContent =
    'BEGINREAL' + encodeURIComponent(JSON.stringify(out)) + 'ENDREAL';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsreal-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINREAL([\s\S]*?)ENDREAL/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

console.log('\nMajor 2 . Europe, duos');
console.log('  teams offered      ' + out.count);
console.log('  dropped, roster incomplete ' + out.dropped);
console.log('  ties on rating            ' + out.tieCount);
out.top.forEach(t => console.log('  ' + String(t.avg).padStart(3) + '  ' + t.who +
  '  [' + t.stage + ' #' + t.rank + ']'));

const fails = [];
// Measured twice, headless, on this branch: 179 real duos behind Major 2
// Europe's 250 rows, and with no era filter every one of them is whole. A
// number that moves means the card data moved or the builder is dropping teams
// it should not. (An earlier draft of the plan said 178 and 1 dropped; that came
// from a browser session whose pool was one player short and does not reproduce.)
if (out.count !== 179) fails.push('offered ' + out.count + ' teams, expected 179');
if (out.dropped !== 0) fails.push('dropped ' + out.dropped + ' teams, expected 0');
// The drop rule matters more than the count, and the full pool never exercises
// it. So it is exercised on purpose: take one player out and his team must
// leave the list rather than be completed from somewhere else.
if (out.dropOnePool.count !== 178)
  fails.push('with one player held back the list has ' + out.dropOnePool.count + ' teams, expected 178');
if (out.dropOnePool.dropped !== 1)
  fails.push('with one player held back ' + out.dropOnePool.dropped + ' teams were dropped, expected 1');
if (out.dropOnePool.strandedListed)
  fails.push('the team missing a player was listed anyway');
if (!out.ordered) fails.push('the list is not ordered by rating, high to low');
if (!out.tiesBroken) fails.push('two teams on the same rating are not ordered by their finish');
// A tiebreak nothing exercises is a tiebreak nobody is testing.
if (!out.tieCount) fails.push('no two teams share a rating, so the tiebreak went unexercised — ' +
  'the ordering check is weaker than it looks');
if (out.dupes) fails.push(out.dupes + ' rosters appear more than once');
if (out.incomplete) fails.push(out.incomplete + ' listed teams have a member missing from the pool');
if (out.wrongSize) fails.push(out.wrongSize + ' teams are not duos in a duo Major');
if (out.top[0] && out.top[0].who !== 'Sky & Scroll')
  fails.push('the top of the list is ' + out.top[0].who + ', not the team that won');
if (out.draftedHandles.join('|') !== out.targetHandles.join('|'))
  fails.push('taking ' + out.targetHandles.join(' & ') + ' drafted ' + out.draftedHandles.join(' & '));
if (out.poolStillHasThem)
  fails.push(out.poolStillHasThem + ' of the taken players are still in the pool for somebody else');
if (out.draftDoneAfterOne)
  fails.push('a realistic duo finished drafting after one loot round — it must get one per player, ' +
    'or it goes into every tournament with half the lobby\'s loadout');
if (out.weaponsTaken !== 2 || out.healsTaken !== 2)
  fails.push('a realistic duo took ' + out.weaponsTaken + ' weapons and ' + out.healsTaken +
    ' consumables, expected 2 and 2');
if (!out.draftDoneAfterTwo)
  fails.push('a realistic duo had not finished drafting after two full rounds');
if (out.fieldSize !== 50) fails.push('the lobby has ' + out.fieldSize + ' teams, expected 50');
if (out.mineDuplicated) fails.push('your own players turn up in ' + out.mineDuplicated + ' rival teams');
if (out.assembled) fails.push(out.assembled + ' teams in a realistic lobby are assembled, not real');
if (out.doubleBooked) fails.push(out.doubleBooked + ' players are in two rival teams in the lobby');
if (out.doubleBookedWide)
  fails.push(out.doubleBookedWide + ' players are in two rival teams once the field is deep ' +
    'enough to reach a shared roster — the double-booking guard is not holding');
if (out.wideFieldSize <= 49)
  fails.push('the deep field only reached ' + out.wideFieldSize + ' teams, which is not past the ' +
    'shallow scan, so the double-booking guard went unexercised again');
if (!out.shortLogged) fails.push('a lobby padded with assembled teams said nothing about it');
if (!out.shortField) fails.push('a short real field produced no lobby at all');

if (fails.length) { fails.forEach(f => console.error('  FAIL ' + f)); process.exit(1); }
console.log('\n  every real roster, once each, best first\n');
