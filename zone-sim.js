// Spatial storm simulation for All FNCS duos.
//
// Pure by contract: this file touches no DOM, no globals from index.html, and
// no clock. Everything variable is passed in. That is what lets the same code
// run in the browser and under node, and it is what makes the calibration run
// in tools/zone-sim-test.js meaningful — it exercises the real engine, not a
// copy of it.
(function(root){
  'use strict';

  var VERSION = '1.0.0';

  // mulberry32. Small, fast, and good enough that 100k draws average 0.5 to
  // three decimals — which is the only property the simulation needs from it.
  // Seeded rather than Math.random so a game can be replayed exactly, which is
  // how a balance regression gets pinned to a specific lobby instead of being
  // argued about.
  function createRng(seed){
    var a = (seed >>> 0) || 1;
    return function(){
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // The storm table, read off the telemetry of one real Grand Final — FNCS 2026
  // EU, session f017a3a9, 49 duos. `tools/real-match.json` holds the extract and
  // `node tools/real-match.js` reprints every number below from it.
  //
  // Wait and shrink are seconds; dps is health per second; radius is world units
  // (percent of map width); surgeAt is the number of players who have to be
  // alive before Storm Surge starts.
  //
  // Eleven zones, not twelve, and the radii are not the ones this file used to
  // carry. Both of those were read off screenshots, and screenshots turned out
  // to be good to about zone 4 and badly wrong after it: the guessed zone 6 was
  // 19% of the first circle where the real one is 10.5%, zone 7 13.6% against
  // 5.3%, zone 8 9.2% against 2.6%. The late circles were two to three times too
  // wide, so the endgame never got dense enough to kill anybody, and the engine
  // had been tuned to make up the difference by having the lobby brawl in zone 1
  // instead. That is the whole reason the leader could not hold a placement.
  //
  // Scale: the elimination coordinates span 200,000 game units across the
  // island, and the app's own land mask spans 83 units of map width, so one
  // world unit is 2,410 game units. Every radius below is the logged one through
  // that conversion.
  //
  //   zone      1     2     3     4     5     6    7    8    9   10   11
  //   logged 95000 75000 52500 32500 20000 10000 5000 2500 1650 1100 1000  game units
  //   share   100%   79%   55%   34%   21%  10.5% 5.3% 2.6% 1.7% 1.2% 1.1%  of zone 1
  //
  // Durations are the gaps between logged zone updates, split into wait and
  // shrink on the published table's ratio for that zone. Damage and the surge
  // thresholds are the published columns and are unchanged — the log does not
  // contradict them.
  var PHASES = [
    {zone:1,  waitSec:66, shrinkSec:59,  dps:1,  radius:39.43, surgeAt:Infinity},
    {zone:2,  waitSec:98, shrinkSec:97,  dps:1,  radius:31.13, surgeAt:90},
    {zone:3,  waitSec:75, shrinkSec:75,  dps:2,  radius:21.79, surgeAt:90},
    {zone:4,  waitSec:80, shrinkSec:70,  dps:5,  radius:13.49, surgeAt:74},
    {zone:5,  waitSec:70, shrinkSec:85,  dps:8,  radius:8.30,  surgeAt:60},
    {zone:6,  waitSec:37, shrinkSec:73,  dps:10, radius:4.15,  surgeAt:50},
    {zone:7,  waitSec:0,  shrinkSec:110, dps:10, radius:2.08,  surgeAt:40},
    {zone:8,  waitSec:0,  shrinkSec:95,  dps:10, radius:1.04,  surgeAt:36},
    {zone:9,  waitSec:0,  shrinkSec:80,  dps:10, radius:0.68,  surgeAt:26},
    {zone:10, waitSec:0,  shrinkSec:55,  dps:10, radius:0.46,  surgeAt:26},
    {zone:11, waitSec:0,  shrinkSec:51,  dps:10, radius:0.42,  surgeAt:26}
  ];

  // How far the centre of the circle moves from one phase to the next, in world
  // units.
  //
  // Three of them settled it, and the answer is that the storm is on rails.
  // From zone 5 down the distance is the same in all three matches to the unit —
  // 32500, 20000, 15000, 12000, 10000, 7350 and 7350 game units — while the
  // direction is different every time. The schedule is fixed; only where it goes
  // is drawn.
  //
  // Zones 2 to 4 are the exception, and they are drawn: 5.2, 8.2, 6.1 / 7.8,
  // 3.7, 7.9 / 0.5, 6.9, 8.2 world units across the three, every one of them
  // inside the gap between the old radius and the new one, and several of them
  // right up against it. That is the nesting rule the first design guessed at,
  // and it is right — for those three zones. So the early circle closes inside
  // the one it came from and rotating is a choice of where to stand; from zone 5
  // the circle is smaller than its own drift and lands somewhere else entirely.
  //
  // null means "draw it inside the nesting budget".
  var DRIFT = [null, null, null, null, 13.49, 8.30, 6.23, 4.98, 4.15, 3.05, 3.05];

  // Rejection-sample a point on the island. The landing rectangles already
  // describe where the playable ground is — they were placed POI by POI — so no
  // second map is needed. If the sampler cannot find land in 60 tries the
  // constraint is too tight to satisfy and the unconstrained point is returned;
  // that is rare and a circle centre slightly offshore is survivable.
  // `exact` picks the distance out of the caller's hands: the late storm moves a
  // measured distance and only chooses a direction, so the sampler turns rather
  // than reaches when it is looking for land.
  function sampleLand(rng, land, aspect, cx, cy, maxMove, exact){
    var fallbackX = cx, fallbackY = cy;
    for(var i=0;i<60;i++){
      var ang = rng() * Math.PI * 2;
      var rad = exact ? maxMove : Math.sqrt(rng()) * maxMove;  // sqrt for uniform area, not centre-heavy
      var x = cx + Math.cos(ang) * rad;
      var y = cy + Math.sin(ang) * rad;
      if(i === 0){ fallbackX = x; fallbackY = y; }
      var px = x, py = y / aspect;            // back to map percent to test the rectangles
      for(var j=0;j<land.length;j++){
        var r = land[j];
        if(px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return {x:x, y:y};
      }
    }
    return {x:fallbackX, y:fallbackY};
  }

  function generateZonePlan(opts){
    var rng = opts.rng, land = opts.land, aspect = opts.aspect;

    // Zone 0 is the whole island: the centre of the bounding box of the land,
    // with a radius that reaches its corners.
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    land.forEach(function(r){
      if(r.x < minX) minX = r.x;
      if(r.x + r.w > maxX) maxX = r.x + r.w;
      if(r.y * aspect < minY) minY = r.y * aspect;
      if((r.y + r.h) * aspect > maxY) maxY = (r.y + r.h) * aspect;
    });
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    var radius = Math.hypot(maxX - minX, maxY - minY) / 2;

    var plan = [];
    for(var i=0;i<PHASES.length;i++){
      var ph = PHASES[i];
      // The first circle is placed on the island rather than drifted onto it —
      // there is no previous circle to drift from, and the three logged ones
      // landed 14, 10 and 8 world units off the centre of the island, which is
      // the room inside the island's own radius. Zones 2 to 4 drift anywhere
      // inside the gap between the radii. From zone 5 the distance is the
      // measured one and only the bearing is drawn.
      var scheduled = DRIFT[i];
      var budget = i === 0 ? Math.max(0, radius - ph.radius)
                 : (scheduled == null ? Math.max(0, radius - ph.radius) : scheduled);
      var next = sampleLand(rng, land, aspect, cx, cy, budget, scheduled != null);
      plan.push({
        zone: ph.zone,
        cx: next.x, cy: next.y, radius: ph.radius,
        fromCx: cx, fromCy: cy, fromRadius: radius,
        waitSec: ph.waitSec, shrinkSec: ph.shrinkSec, dps: ph.dps, surgeAt: ph.surgeAt
      });
      cx = next.x; cy = next.y; radius = ph.radius;
    }
    return plan;
  }

  // World units per second, measured. Every team in the logged match reports the
  // ground distance it covered and how long it was alive; the median of the two
  // divided is 705 game units a second, which is 0.29 world units. The number
  // this file carried before the log arrived was 0.25, guessed from how long a
  // rotation ought to take, so this is a small correction to a good guess.
  //
  // It is net pace over a whole match, idling included, which is exactly what
  // the engine needs: the question here is when a squad arrives, not how fast it
  // can sprint. Everyone moves at it and nobody moves faster — in Fortnite
  // everybody has the same legs, and what separates squads is when they leave.
  // Making speed a skill would quietly turn END into "runs quicker".
  var SPEED = 0.29;

  // How many points a squad considers before committing to a rotation.
  var CANDIDATES = 12;

  // Weight of the crowding term against the travel term when scoring a
  // candidate. Crowding matters more: an empty spot you have to run to beats a
  // close spot with four squads already on it, which is the actual reasoning a
  // good team does.
  var CROWD_WEIGHT = 2.2;

  // Radius, as a fraction of the circle, inside which another squad counts as
  // crowding a candidate point.
  var CROWD_RADIUS = 0.4;

  // How far a squad's appetite for fights flips the crowding term from repulsion
  // to attraction. Zero in a final: there, empty ground is what everybody wants
  // and the leader's kills come from what walks into it.
  //
  // An open stage is the opposite. Its leader takes 9.8 to 12.8 eliminations a
  // match — six squads a game — and that is unreachable by engaging harder,
  // because after a kill or two there is simply nobody else within range. The
  // ceiling is spatial, not statistical. A squad that wants a kill race has to
  // rotate toward people, which is what this turns on.
  var CROWD_SEEK = 0;

  // How far a poor rotator's read of the map is smeared. Multiplied by
  // (1 - skill), so a perfect squad sees the map as it is and a hopeless one
  // sees noise. This is the main lever on how far apart good and bad squads
  // finish, and Task 8 of the plan is allowed to move it.
  var READ_NOISE = 8;

  function attr(team, key){
    var a = team.attrs || {};
    var v = a[key];
    return (typeof v === 'number') ? v : 50;
  }

  // One number in 0..1 standing for how well this squad rotates. END is the
  // share of points a team earns from placement rather than kills, so it is
  // already a measure of exactly this, and it carries the most weight. SUR is
  // average placement, which is the same thing observed from the other side.
  // Ping is deliberately absent: rotating and reading the storm play the same
  // on any connection, and ping's one job — winning trades — belongs to the
  // duel the caller injects.
  function rotationSkill(team){
    var end = attr(team, 'END'), sur = attr(team, 'SUR');
    return Math.max(0, Math.min(1, (end * 0.65 + sur * 0.35) / 100));
  }

  // How readily a squad goes looking for a fight. AIM is average eliminations
  // and CLU is Victory Royales per match — both are records of squads that took
  // fights and won them, which is exactly the disposition being modelled.
  function aggression(team){
    var aim = attr(team, 'AIM'), clu = attr(team, 'CLU');
    return Math.max(0, Math.min(1, (aim * 0.6 + clu * 0.4) / 100));
  }

  // How good this duo is overall, in 0..1 — all four attributes, because a duo
  // that rotates well and shoots well is one another squad would rather not
  // start something with. It decides who picks whom, never who wins: that stays
  // with the duel the caller injects.
  function strength(team){
    return Math.max(0, Math.min(1,
      (attr(team, 'END') + attr(team, 'SUR') + attr(team, 'AIM') + attr(team, 'CLU')) / 400));
  }

  function createSquads(teams, opts){
    var aspect = opts.aspect, startOf = opts.startOf;
    return teams.map(function(team){
      var p = startOf(team);
      return {
        team: team,
        x: p.x, y: p.y * aspect,
        hp: 100,
        alive: true,
        skill: rotationSkill(team),
        seek: aggression(team),
        power: strength(team),
        target: null,
        heading: 0,
        deathCause: null,
        zoneReached: 0,
        place: 0,
        elims: 0,
        dealt: 0,
        taken: 0,
        // Which squad surge takes first when several have done equally little.
        // A stable per-squad draw rather than array order, because the callers
        // hand teams over in rating order and array order would quietly mean
        // surge always starts at the top of the table. simulateZoneGame fills
        // it from the game's own seed; left at zero it falls back to order.
        surgeTie: 0,
        feed: []
      };
    });
  }

  function chooseTarget(squad, phase, squads, rng){
    var best = null, bestScore = -Infinity;
    for(var i=0;i<CANDIDATES;i++){
      var ang = rng() * Math.PI * 2;
      var rad = Math.sqrt(rng()) * phase.radius;
      var x = phase.cx + Math.cos(ang) * rad;
      var y = phase.cy + Math.sin(ang) * rad;

      // Crowding: how many other living squads are already near this point.
      var crowd = 0;
      for(var j=0;j<squads.length;j++){
        var o = squads[j];
        if(o === squad || !o.alive) continue;
        var ox = o.x - x, oy = o.y - y, cr = phase.radius * CROWD_RADIUS;
        if(ox*ox + oy*oy < cr * cr) crowd++;
      }

      // Travel: how far this squad has to go, normalised so the term is
      // comparable across zone 1 and zone 9.
      var travel = Math.hypot(squad.x - x, squad.y - y) / Math.max(phase.radius, 0.001);

      // Edge: how far out in the circle the point is. Positive, because the
      // edge is where you want to be — behind you is storm rather than an enemy,
      // so it is one direction you do not have to hold.
      var edge = rad / Math.max(phase.radius, 0.001);

      var score = -(CROWD_WEIGHT - CROWD_SEEK * squad.seek) * crowd - travel + edge;

      // Noise scaled by the inverse of skill. A perfect rotator reads the map
      // as it is; a poor one reads a smeared version of it and picks the
      // crowded, far, central spot often enough that it shows up in placement.
      score += (rng() - 0.5) * READ_NOISE * (1 - squad.skill);

      if(score > bestScore){ bestScore = score; best = {x:x, y:y}; }
    }
    return best;
  }

  // Move every squad toward its target, and — when a circle is given — no
  // further than the storm allows.
  //
  // Without that clamp a squad walks straight at where the next circle is going
  // to be and stands there while the storm is still on its way, which in the
  // late zones means crossing open ground that is on fire. It cost six squads a
  // game to the zone-8 storm in a match where the storm takes about one death in
  // twenty. Nobody plays that way: you rotate with the circle, holding its edge,
  // and you arrive when it does.
  //
  // A squad already outside is not clamped. It has to run for the circle, and
  // being late is exactly what it should cost.
  function stepMovement(squads, seconds, circle){
    var maxStep = SPEED * seconds;
    var live = circle && circle.radius > 0;
    for(var i=0;i<squads.length;i++){
      var s = squads[i];
      if(!s.alive || !s.target) continue;

      var tx = s.target.x, ty = s.target.y;
      if(live){
        // Where the squad can actually stand right now: the point closest to
        // where it is going that is still inside the circle as it stands this
        // second. A squad that is already outside is not redirected — it has to
        // run for the circle, and being late is what that costs.
        var gx = tx - circle.cx, gy = ty - circle.cy;
        var gd = Math.hypot(gx, gy);
        if(gd > circle.radius && Math.hypot(s.x - circle.cx, s.y - circle.cy) <= circle.radius){
          var keep = circle.radius * 0.98;
          tx = circle.cx + gx / gd * keep;
          ty = circle.cy + gy / gd * keep;
        }
      }

      var dx = tx - s.x, dy = ty - s.y;
      var d = Math.hypot(dx, dy);
      if(d < 1e-9) continue;
      var step = Math.min(d, maxStep);
      s.x += dx / d * step;
      s.y += dy / d * step;
    }
  }

  // Health a squad puts back per second while it is inside the circle.
  //
  // Measured, and it is not a small correction. Every team in the logged match
  // reports the damage it took and how often it healed: the median team absorbs
  // 1,547 damage across the match while a duo has 200 health to lose, and heals
  // 134 times and shields 52 times doing it. Nearly eight full bars, put back
  // one syringe at a time, roughly once every five seconds.
  //
  // This engine had no healing at all, so storm damage was permanent and
  // cumulative: forty health lost crossing zone 3 was still gone in zone 9, and
  // a squad that had been caught out twice was dead whatever it did afterwards.
  // With the fighting pulled back to the rate a real match runs at, that became
  // the thing killing the lobby — the storm was taking half the field by zone 5
  // in a game where it accounts for about one death in twenty.
  //
  // The rate is the measurement on the engine's own scale: the storm table's
  // damage figures are per player, so the squad's 100 points stand for one
  // player's bar, and 1,547 over two players across 1,007 seconds is 0.77 a
  // second put back.
  var HEAL_RATE = 0.8;

  function applyHealing(squads, circle, seconds){
    for(var i=0;i<squads.length;i++){
      var s = squads[i];
      if(!s.alive || s.hp >= 100) continue;
      // Only inside the circle. Out in the storm a squad is spending everything
      // it has just to stay standing, which is what makes being late expensive.
      var hx = s.x - circle.cx, hy = s.y - circle.cy;
      if(hx*hx + hy*hy > circle.radius * circle.radius) continue;
      s.hp = Math.min(100, s.hp + HEAL_RATE * seconds);
    }
  }

  function applyStorm(squads, circle, dps, seconds, onDeath){
    for(var i=0;i<squads.length;i++){
      var s = squads[i];
      if(!s.alive) continue;
      var wx = s.x - circle.cx, wy = s.y - circle.cy;
      if(wx*wx + wy*wy <= circle.radius * circle.radius) continue;
      s.hp -= dps * seconds;
      if(s.hp <= 0){
        s.hp = 0;
        s.alive = false;
        s.deathCause = 'storm';
        onDeath(s);
      }
    }
  }

  // How close two squads have to be to shoot at each other, in world units.
  // Measured: the logged match records where the killer and the victim were
  // standing for all 146 eliminations that had a killer, and 90% of them are
  // inside 54 metres — 2.2 world units. Half are inside five metres, because a
  // fight that starts at range ends at a shotgun, so the far tail is the honest
  // read of how close two squads have to be for a fight to be possible at all.
  // The 1.2 this file used to carry was a guess at "about sixty metres" that
  // worked out to twenty-nine.
  //
  // This is an absolute distance and not a fraction of the current circle, and
  // the difference is the whole late game. Scaled to the circle, the expected
  // number of squads within range works out to a constant times the number
  // still alive: density rises exactly as fast as the range falls, they cancel,
  // and because the lobby is emptying the endgame ends up with *fewer* contacts
  // than the mid-game. Backwards. In Fortnite the circle shrinks and weapon
  // range does not, so the range is fixed here, density rises as N/R-squared,
  // and the pile-up in zone 8 happens on its own.
  var CONTACT_RANGE = 2.2;

  // Ground a squad needs to itself before being near somebody turns into
  // shooting them, in square world units — about 35 metres square per duo.
  //
  // This is the mechanism the engine was missing, and the log is what shows it.
  // Take the deaths in the logged match per squad per second, against the ground
  // the circle was leaving each squad at the time:
  //
  //   zone            1     2     3     4     5     6     7     8     9    10
  //   ground/squad  108    71    36    15    5.7   1.7   0.5  0.18  0.11  0.07
  //   deaths/sq/s   7e-4  2e-4  2e-4  5e-4  2e-4  17e-4 21e-4 39e-4 58e-4 81e-4
  //
  // Across zones 1 to 5 the ground available falls by nineteen times and the
  // death rate does not move. Then it turns over, and from zone 6 down it climbs
  // with every circle. Proximity cannot explain that — squads are far closer in
  // zone 5 than in zone 1 — but running out of room can. In the mid-game there
  // is still somewhere else to stand, so two duos that can see each other hold
  // their own ground and wait. When the circle can no longer give everybody a
  // piece, the same proximity is a fight nobody chose.
  //
  // Without this the engine had contacts in proportion to density and had to be
  // tuned down until the endgame was empty, or up until zone 1 was a bloodbath.
  // It was set up, and the leader averaged tenth.
  var ROOM = 2.0;

  // The floor under the pressure term: fights that happen because somebody went
  // looking, not because the circle made them. It is what the flat stretch
  // across zones 1-5 is made of.
  var PRESSURE_BASE = 0.15;

  // How sharply running out of room turns into fighting. Half, so the pressure
  // follows the distance between squads rather than the area — fitted against
  // the logged curve by tools/real-match.js, and the one number in this
  // mechanism that is fitted rather than read off.
  var PRESSURE_EXP = 0.35;

  // Where crowding stops buying anything. Taking half the remaining ground away
  // from a lobby that already has none does not double how fast it can fight:
  // past this point the rate is set by how long a fight takes, not by how close
  // the next squad is. Without the cap the last two circles ran the whole
  // endgame on their own — the engine was finishing inside circle 11, where the
  // logged matches still have nine squads standing when it closes and settle
  // them in the collapse afterwards.
  var PRESSURE_MAX = 3;

  // How crowded the circle is right now, as a multiplier on every pair's chance
  // of trading. One when each squad has exactly ROOM to itself.
  function roomPerSquad(circle, aliveCount){
    if(!circle || !(circle.radius > 0) || aliveCount < 1) return Infinity;
    return Math.PI * circle.radius * circle.radius / aliveCount;
  }

  function pressure(room){
    if(!isFinite(room)) return 1;
    return PRESSURE_BASE +
           Math.min(PRESSURE_MAX, Math.pow(ROOM / Math.max(room, 1e-6), PRESSURE_EXP));
  }

  // Damage a squad is credited with per second of standing in contact with
  // somebody. Only the ordering it produces is used, so the scale is arbitrary;
  // this is the logged median of 1.5 a second, kept so the number reads like the
  // thing it stands for.
  var CHIP_RATE = 1.5;

  // And the distance it is traded across: twice the range a kill lands in.
  var CHIP_RANGE = 4.4;

  // What finishing a squad is worth against that, per player: a full bar.
  var KILL_DAMAGE = 100;

  // Rate at which two squads inside that range commit to a fight, per tick.
  // Not a probability despite the position it sits in: it is multiplied by two
  // sub-unit factors, one of them raised to ENGAGE_BIAS, so it has to be well
  // above 1 for anybody to fight at all. Squads standing near each other do not
  // trade every second — they hold, they rotate around, they wait for a third
  // party — and this is what buys that.
  var ENGAGE_CHANCE = 0.02;

  // How much a squad's rotation skill lets it decline a fight it does not want.
  // This is the zone engine's equivalent of SURVIVAL_BIAS in index.html, and it
  // is needed for the same reason: without it, being good bought nothing except
  // winning the trades you were already in, the field came out flat, and the
  // leader averaged 17th place — the exact failure the old engine's comment
  // records before that constant was raised.
  //
  // A pair's chance is scaled by both squads' exposure, so two good squads
  // circle each other and two poor ones brawl. EXPOSURE_FLOOR keeps even a
  // perfect squad reachable, because a squad that can never be forced into a
  // fight wins every tournament.
  var EXPOSURE_FLOOR = 0.18;
  var ENGAGE_BIAS = 8.5;

  // How hard a squad weighs the matchup before starting something. Zero would
  // be the old behaviour, taking any fight going; the higher it is, the more a
  // strong squad restricts itself to fights it expects to win and the more a
  // weak one is the only party still willing to start them.
  var PICK_EXP = 3;

  // Chance, scaled by the winner's own appetite, that a squad which has just
  // won carries straight on into the next one. Up to three in a row, same cap
  // index.html uses.
  var CHAIN_CHANCE = 0.7;

  // How many kills a streak can run to. index.html caps it at three, and that
  // is right for a final. An open stage is not a final: its leader takes 9.8 to
  // 12.8 eliminations a match, which is six squads a game, and no amount of
  // engaging gets there when every fight is a separate roll — the kills spread
  // across the lobby instead of piling onto the squad that is winning them.
  // Concentration is what a kill race is.
  var CHAIN_MAX = 3;

  // How much a squad's fragging attributes make it go and look for a fight.
  //
  // Exposure alone could not fit the real finals, and the reason was a missing
  // mechanism rather than a badly set number. Exposure governs being caught and
  // getting kills at once, because engaging is the only way to get a kill — so
  // turning it down bought a leader 7th place and no eliminations, and turning
  // it up bought eliminations and a flat table. Neither is a real final, where
  // the winner takes 4.6 eliminations a match *and* averages 7th.
  //
  // A real leader does not avoid fights. It picks them: third-parties, takes
  // the weak squad, declines the even one. So seeking is its own term, and it
  // is driven by AIM and CLU rather than END and SUR. That also makes the
  // fragger and the IGL genuinely different players inside the simulation
  // instead of two labels on the same behaviour.

  // The ground a squad needs before it can still decline a fight. Below this
  // there is nowhere to decline to, and the best rotator in the lobby is as
  // catchable as anybody. Square world units, the same measure as ROOM.
  var NOWHERE_ROOM = 0.06;

  function exposure(squad){
    return EXPOSURE_FLOOR + (1 - EXPOSURE_FLOOR) * (1 - squad.skill);
  }

  // Being hard to catch is bought with ground, and in the endgame there is none
  // to buy it with.
  //
  // Exposure on its own is a property of the squad and nothing else, so the best
  // rotator in the lobby was exactly as hard to corner inside a ten-metre circle
  // as it was across the whole island. It made the leader almost unkillable:
  // placement came out right at 7.85 and the same run had it winning half the
  // games it played, against two to four in twelve in a real Grand Final. A duo
  // that reads the map perfectly still cannot read its way out of a box with
  // nine other squads in it.
  //
  // So the same measured room that decides how hard the circle is pressing also
  // decides how much of a squad's edge survives. Across zones 1 to 6 almost all
  // of it does, which is what earns the placement. By zone 8 it is gone, and the
  // endgame is a fight the leader can lose — which is where the losses that make
  // up a real average placement come from.
  function caught(squad, room){
    var e = exposure(squad);
    // Measured in the same units as the room itself, so capping the pressure
    // cannot quietly switch this off — which is what happened when it was keyed
    // to the pressure instead: the cap held the pressure below the threshold
    // forever, the leader kept its edge into the last circle, and it won half
    // the tournaments it played.
    var nowhere = Math.max(0, Math.min(1, 1 - room / NOWHERE_ROOM));
    return e + (1 - e) * nowhere;
  }

  // The drop, in seconds from the start of the game.
  //
  // For this long, two squads on the same ground are fighting for a reason the
  // rest of the game never has: they chose it. The island is wide open and they
  // landed on each other anyway, so neither of the two things that hold the
  // mid-game apart applies — there is no room shortage, and there is nowhere to
  // decline to when somebody is on the same roof. Both are switched off and the
  // rate is high, which is what makes a contested drop settle in the first
  // seconds the way it does in a real match.
  //
  // Before this, contested drops were resolved by the app before the map ever
  // opened: a power-weighted coin flip, the losers deleted, and a game that
  // began with eighty-four of a hundred players already gone. The fight was
  // real, it was just happening somewhere nobody could see it.
  // What is switched off is the declining, not the rate — and the rate is low.
  // `tools/drop-calibration.js` measures it against the only thing the real
  // matches say about the drop: 7 of 149 duos are already out when the first
  // circle closes. Build the lobby the way the app builds one — every squad
  // picks a spot off the picker's own rectangles, and squads that pick the same
  // one stand on the same ground — and this value puts 4.2% of the field out on
  // the drop against a real 4.7%, with 95.2% still alive at the first circle
  // against a real 95%.
  //
  // The first guess was seven hundred times this, on the reasoning that two
  // duos on the same roof have to fight. They do — but a fight at the drop is
  // two duos with grey guns and no shields, and it ends far more often with one
  // of them leaving than with a wipe. At the high value nearly half the lobby
  // was gone before the first circle closed, which is the same mistake the app
  // made when it flipped a coin for every contested spot: the drop was being
  // treated as a decider when it is a filter. Nearly half the lobby shares its
  // ground with somebody; about one contested drop in ten produces a body.
  var DROP_SEC = 40;
  var DROP_PRESSURE = 0.08;

  function resolveContacts(squads, circle, rng, duel, onDeath, dropping){
    var alive = [];
    for(var i=0;i<squads.length;i++) if(squads[i].alive) alive.push(squads[i]);

    // How hard the circle is pressing right now. Computed once a tick rather
    // than per pair: it is a property of the lobby, not of who is standing next
    // to whom.
    // Both of the mid-game brakes are off during the drop. `room` is the space
    // the circle leaves each squad, and it is what caught() reads to decide
    // whether a squad can decline a fight — at zero, nobody can, which is the
    // point: two duos on the same roof are not negotiating.
    // Counted in duos, not in squads.
    //
    // The circle leaves a squad of four the same ground it leaves a duo, but
    // there are half as many squads in the lobby — Fortnite seats a hundred
    // players whatever the mode, so a squad lobby is 25 teams where a duo lobby
    // is 50. Dividing the circle by the number of teams therefore said a squad
    // lobby was twice as roomy as a duo one, and roominess is what decides how
    // often anybody fights: trios and squads played their early game almost
    // without deaths. Zone 2 sat at 96% and 97% of the field alive against 94%
    // in duos and 85% in the real matches, which is the screenshot of a second
    // circle with every single team still in it.
    //
    // So the count is players over two — what this lobby would be if it were
    // duos. A fifty-duo lobby is unchanged to the last decimal, which matters:
    // the pressure curve underneath is calibrated against duo telemetry and
    // nothing here is allowed to move it.
    var equivalent = 0;
    for(var pi=0; pi<alive.length; pi++){
      var sq = alive[pi].team.squad;
      equivalent += (sq && sq.length ? sq.length : 2) / 2;
    }
    var room = dropping ? 0 : roomPerSquad(circle, alive.length);
    // How much more often a squad has to start something for the lobby to lose
    // players at the rate a duo lobby does.
    //
    // A hundred players is a hundred players, but in fours they are 25 teams
    // where in twos they are 50 — and pairs go as the square of the count, so
    // a squad lobby offers a quarter of the meetings. Each meeting is worth
    // twice as many players, which leaves the lobby losing people half as fast:
    // exactly what the early zones looked like, 97% of squads still alive when
    // the second circle closed.
    //
    // Multiplying the rate by half the squad size cancels it precisely — one
    // for duos, one and a half for trios, two for squads — because that is the
    // same ratio the other way round. Duos are multiplied by one and do not
    // move at all, which is the point: the curve underneath them is pinned to
    // real telemetry.
    var sizeScale = alive.length ? equivalent / alive.length : 1;
    var press = dropping ? DROP_PRESSURE : pressure(room);

    // Shuffle so the pairing does not always favour whoever is earlier in the
    // array — with a fixed order the same squad would be first to every fight
    // in the lobby for the whole game.
    for(var k=alive.length-1;k>0;k--){
      var j = Math.floor(rng() * (k+1));
      var tmp = alive[k]; alive[k] = alive[j]; alive[j] = tmp;
    }

    // Damage traded just for being in contact, before anybody commits to
    // finishing it. The logged match makes it the main flow in the game: the
    // median team takes 1,547 damage and heals 134 times, against 200 health in
    // a duo, so almost all of the shooting is chip that gets healed back. This
    // engine only ever modelled the blow that killed, which left it with no
    // answer to the one question Storm Surge asks — who has been doing nothing.
    //
    // It is not applied to health, because the same log says it is healed back
    // as fast as it lands. What it leaves behind is the number, and the number
    // is what surge reads. A squad that has been near people is safe from surge;
    // a squad that has spent the game alone is not. That is the real rule, and
    // ranking on eliminations instead of this was killing the best squad in the
    // lobby one game in ten, because with almost nobody eliminated yet the whole
    // field was tied on zero and surge was picking at random.
    // Traded across a wider circle than a kill lands in — half the logged
    // eliminations end inside six metres, but the shooting that got them there
    // starts much further out, and the tail of that distribution runs past two
    // hundred. And scaled by the squad itself: put two duos on the same ground
    // and the better one does more of the damage, which is why in the logged
    // match the teams near the top of the table are also the ones with the
    // biggest damage numbers rather than the smallest.
    // Both sides of the trade are recorded, because Storm Surge is settled on
    // net damage — dealt minus taken — and not on dealt alone. Epic changed it
    // for a reason worth keeping in the model: under the old rule two squads
    // could stand in the open swapping shots and both came out safe, so the
    // mechanic that exists to punish sitting still was rewarding a ritual. On
    // net, the squad that loses the trade is exactly the one left exposed.
    //
    // Which is what falls out here: each side deals in proportion to how good
    // it is, so a contact between two squads nets the difference between them
    // and nets nothing between equals.
    for(var ci=0; ci<alive.length; ci++){
      for(var cj=ci+1; cj<alive.length; cj++){
        var cdx = alive[ci].x - alive[cj].x, cdy = alive[ci].y - alive[cj].y;
        if(cdx*cdx + cdy*cdy > CHIP_RANGE * CHIP_RANGE) continue;
        var hitA = CHIP_RATE * alive[ci].power * TICK_SEC;
        var hitB = CHIP_RATE * alive[cj].power * TICK_SEC;
        alive[ci].dealt += hitA; alive[cj].taken += hitA;
        alive[cj].dealt += hitB; alive[ci].taken += hitB;
      }
    }

    // A flag on the squad rather than an array to scan: this is the hottest
    // loop in the engine — every tick of every game of every calibration run
    // passes through it — and an indexOf inside a nested loop made it cubic in
    // the lobby size for no reason.
    for(var f=0;f<alive.length;f++) alive[f].busy = false;

    for(var a=0;a<alive.length;a++){
      var s = alive[a];
      if(!s.alive || s.busy) continue;
      for(var b=a+1;b<alive.length;b++){
        var o = alive[b];
        if(!o.alive || o.busy) continue;
        var fdx = s.x - o.x, fdy = s.y - o.y;
        if(fdx*fdx + fdy*fdy > CONTACT_RANGE * CONTACT_RANGE) continue;
        // Either squad can start it, and starting one is its own event. The
        // first version multiplied both squads' exposure, which made avoiding
        // fights and getting kills the same skill: a squad that learned not to
        // be caught stopped killing anybody, so the leader could have 7th place
        // or 4.6 eliminations and never both.
        //
        // A push is not something the target gets to decline. So each squad's
        // chance of starting it is its own appetite times how catchable the
        // other one is — never its own. An aggressive squad that rotates well
        // farms the squad that rotates badly, two good squads circle each other,
        // and two bad ones brawl. Which is the real shape of a lobby.
        // Declining the even fight. The design has always said a real leader
        // does not avoid fights, it picks them — third-parties, takes the weak
        // squad, declines the even one — and until now only half of that was in
        // the code: a squad picked on how catchable the other one was, never on
        // whether it would win. So the best duo in the lobby spent the endgame
        // starting coin flips, and lost three in ten of them. Its median finish
        // was eighth and its mean fifteenth, which is the signature of a squad
        // that either wins the game or throws it in one trade.
        //
        // One when the two are evenly matched, up toward two when the initiator
        // outguns the target, and toward zero when it is outgunned. It reads the
        // fragging attributes rather than the rating, because those are what the
        // engine is given and what the duel it hands off to broadly tracks.
        var pair = s.power + o.power;
        var eS = pair > 0 ? Math.pow(2 * s.power / pair, PICK_EXP) : 1;
        var eO = pair > 0 ? Math.pow(2 * o.power / pair, PICK_EXP) : 1;
        var pS = s.seek * Math.pow(caught(o, room), ENGAGE_BIAS) * eS;
        var pO = o.seek * Math.pow(caught(s, room), ENGAGE_BIAS) * eO;
        if(rng() >= ENGAGE_CHANCE * press * sizeScale * (pS + pO)) continue;

        var winnerTeam = duel(s.team, o.team);
        var winner = (winnerTeam === s.team) ? s : o;
        var loser  = (winner === s) ? o : s;
        var loserSize = (loser.team.squad && loser.team.squad.length) || 1;

        winner.elims += loserSize;
        winner.dealt += KILL_DAMAGE * loserSize;
        loser.taken += KILL_DAMAGE * loserSize;
        loser.alive = false;
        loser.hp = 0;
        loser.deathCause = winner.team.name;
        loser.busy = true;
        onDeath(loser);

        // Hot streak. index.html has this and documents it as how dominant real
        // squads rack up multi-kill games; moving the fight onto a map dropped
        // it, and dropping it showed up in the calibration as a leader who
        // could not out-kill the field. A squad that has just won is still
        // standing, still holding the ground, and the next squad to walk into
        // it walks into a fight already in progress.
        var streaker = winner, chains = 0;
        while(chains < CHAIN_MAX && rng() < CHAIN_CHANCE * streaker.seek){
          // Who the streak runs into next goes through the same reading of the
          // lobby as any other fight. It used to take the first squad in range,
          // whoever that was, which meant a squad on a heater could walk through
          // the one duo in the lobby that never gets caught — the streak was a
          // hole straight through the exposure model, and it was where the best
          // squad in the field was dying.
          var victim = null;
          for(var c=0;c<alive.length;c++){
            var v = alive[c];
            if(v === streaker || !v.alive || v.busy) continue;
            var sdx = streaker.x - v.x, sdy = streaker.y - v.y;
            if(sdx*sdx + sdy*sdy > CONTACT_RANGE * CONTACT_RANGE) continue;
            var vp = streaker.power + v.power;
            if(rng() >= Math.pow(caught(v, room), ENGAGE_BIAS) *
                        (vp > 0 ? Math.pow(2 * streaker.power / vp, PICK_EXP) : 1)) continue;
            victim = v; break;
          }
          if(!victim) break;
          var cwTeam = duel(streaker.team, victim.team);
          var cw = (cwTeam === streaker.team) ? streaker : victim;
          var cl = (cw === streaker) ? victim : streaker;
          var clSize = (cl.team.squad && cl.team.squad.length) || 1;
          cw.elims += clSize;
          cw.dealt += KILL_DAMAGE * clSize;
          cl.taken += KILL_DAMAGE * clSize;
          cl.alive = false; cl.hp = 0; cl.deathCause = cw.team.name; cl.busy = true;
          onDeath(cl);
          if(cw !== streaker) break;   // the streak broke — the streaker went down
          chains++;
        }
        winner.busy = true;
        break;
      }
    }
  }

  // Storm Surge damage. Lower than the storm's, because surge is not meant to
  // kill on its own — it is meant to make sitting still cost something, so a
  // squad that has done nothing has to come out and find a fight it will
  // probably lose. Without it, hiding is a strategy the simulation rewards and
  // the real game does not.
  var SURGE_DPS = 1;

  function applySurge(squads, surgeAt, seconds, onDeath){
    if(!isFinite(surgeAt)) return;
    var alive = [];
    var players = 0;
    for(var i=0;i<squads.length;i++){
      var s = squads[i];
      if(!s.alive) continue;
      alive.push(s);
      players += (s.team.squad && s.team.squad.length) || 1;
    }
    if(players <= surgeAt || !alive.length) return;

    // Surge is aimed at the excess, not at everybody under the average. The
    // average was what this used to use, and it had a hole underneath it: in a
    // lobby where nobody has killed anybody yet, nobody is under the average,
    // so the code fell back to damaging the whole field at once. That was
    // invisible while the engine was tuned to fight constantly, and the moment
    // the fighting was pulled back to the rate a real match runs at, surge went
    // from a footnote to the cause of three deaths in four — thirty-eight
    // squads wiped in zone 2, before the circle had done anything.
    //
    // The real mechanic sets a damage threshold so that roughly the players the
    // lobby is over by are the ones being pressured. That is what this does: the
    // squads that have done the least, and only as many of them as the count is
    // above the threshold. It cannot take the field, and it never has nothing to
    // aim at.
    var over = players - surgeAt;
    alive.sort(function(a, b){
      return ((a.dealt - a.taken) - (b.dealt - b.taken)) || (a.surgeTie - b.surgeTie);
    });

    var below = [], covered = 0;
    for(var b=0; b<alive.length && covered < over; b++){
      below.push(alive[b]);
      covered += (alive[b].team.squad && alive[b].team.squad.length) || 1;
    }

    for(var k=0;k<below.length;k++){
      var t = below[k];
      t.hp -= SURGE_DPS * seconds;
      if(t.hp <= 0){
        t.hp = 0;
        t.alive = false;
        t.deathCause = 'surge';
        onDeath(t);
      }
    }
  }

  // Simulation granularity. Two seconds is fine enough that nobody teleports
  // through a fight and coarse enough that a 21-minute game is ~630 ticks.
  var TICK_SEC = 2;

  // Frames actually kept for the replay. 630 ticks is far more than anyone can
  // watch, so every Nth is recorded; the simulation itself is unaffected.
  var RECORD_EVERY = 8;

  // After zone 9 the circle collapses to nothing, which guarantees the game
  // ends however passive the last squads are.
  var COLLAPSE_SEC = 60;

  // The largest share of a phase a squad will spend standing still before it
  // sets off, at zero rotation skill. Multiplied by (1 - skill) and jittered,
  // so a good squad leaves almost at once and a poor one leaves with the storm
  // already on top of it.
  var LINGER_MAX = 0.3;

  // Squads that have not reached their departure time yet stay where they are.
  // Implemented by parking the target on the spot rather than by a flag, so
  // stepMovement stays a single unconditional loop.
  function holdLate(squads, elapsed){
    for(var i=0;i<squads.length;i++){
      var s = squads[i];
      if(!s.alive || s.leaveAt == null) continue;
      if(elapsed < s.leaveAt){ s.held = s.held || s.target; s.target = {x: s.x, y: s.y}; }
      else if(s.held){ s.target = s.held; s.held = null; }
    }
  }

  function simulateZoneGame(teams, opts){
    var rng = opts.rng, aspect = opts.aspect, duel = opts.duel, record = !!opts.record;
    var plan = generateZonePlan({rng: rng, land: opts.land, aspect: aspect});
    var squads = createSquads(teams, {aspect: aspect, startOf: opts.startOf});
    for(var st=0; st<squads.length; st++) squads[st].surgeTie = rng();

    var eliminationOrder = [];   // first out, first in
    var pendingEvents = [];
    var timeline = [];
    var currentZone = 1;
    // True only inside the first DROP_SEC of the game. Deaths that happen then
    // are landing fights, and the app needs to be able to tell them apart from
    // the rest of zone 1 — it awards a bonus for winning your drop and it
    // writes a different line in the feed.
    var inDrop = false;

    function onDeath(sq){
      sq.zoneReached = currentZone;
      if(inDrop) sq.droppedOut = true;
      eliminationOrder.push(sq);
      // Where this squad finished, known the moment it goes down: as many
      // places from the bottom as there are squads already out. Recorded here
      // rather than worked out from the frames afterwards, because three squads
      // dying between two frames leaves the frames unable to say which of them
      // took sixth and which took eighth. The engine knows.
      sq.place = squads.length - eliminationOrder.length + 1;
      pendingEvents.push(sq.deathCause + ':' + sq.team.name);
    }

    function aliveCount(){
      var n = 0;
      for(var i=0;i<squads.length;i++) if(squads[i].alive) n++;
      return n;
    }

    // Players, not squads. The real overlay counts both — a lobby of 46 squads
    // and 88 players says something a squad count alone does not, because in
    // duos the two diverge the moment anybody is left playing alone.
    function alivePlayers(){
      var n = 0;
      for(var i=0;i<squads.length;i++){
        if(!squads[i].alive) continue;
        n += (squads[i].team.squad && squads[i].team.squad.length) || 1;
      }
      return n;
    }

    var tickIndex = 0;
    // force is for the closing frame: it has to be kept whatever the tick count
    // happens to be, because it is the one that shows a single squad left.
    function frame(circle, next, secondsLeft, force){
      tickIndex++;
      if(!record || (!force && (tickIndex % RECORD_EVERY) !== 0)){ pendingEvents = []; return; }
      timeline.push({
        zone: currentZone,
        secondsLeft: Math.max(0, Math.round(secondsLeft)),
        alive: aliveCount(),
        players: alivePlayers(),
        // World units, not map percent. World space is isotropic — that is the
        // whole reason it exists — so a circle drawn in it is round and a
        // rotated marker is not sheared. Converting back to percent-of-height
        // handed the renderer an anisotropic space and quietly made every zone
        // circle a slight ellipse. The caller sizes its viewBox to match by
        // taking the map's own aspect.
        circle: {cx: circle.cx, cy: circle.cy, radius: circle.radius},
        next: next ? {cx: next.cx, cy: next.cy, radius: next.radius} : null,
        dots: squads.map(function(s){
          // Which way the squad is facing: straight at wherever it is rotating
          // to. Held rather than reset when it is standing still, so a parked
          // squad keeps pointing the way it last travelled instead of snapping
          // north.
          var hx = s.target ? s.target.x - s.x : 0;
          var hy = s.target ? s.target.y - s.y : 0;
          if(hx || hy) s.heading = Math.atan2(hy, hx) * 180 / Math.PI;
          return {x: s.x, y: s.y, alive: s.alive, a: s.heading,
                  e: s.elims, p: s.alive ? 0 : (s.place || 0)};
        }),
        events: pendingEvents
      });
      pendingEvents = [];
    }

    // One phase: hold the old circle while everyone rotates, then close it onto
    // the new one. Damage is always taken against the circle as it is right now,
    // which is what makes leaving late expensive rather than merely untidy.
    function runPhase(from, to, phase){
      currentZone = phase.zone;
      var total = phase.waitSec + phase.shrinkSec;
      for(var i=0;i<squads.length;i++) if(squads[i].alive){
        var s0 = squads[i];
        s0.target = chooseTarget(s0, {cx: to.cx, cy: to.cy, radius: to.radius}, squads, rng);
        // When a squad leaves, which is the thing END was always supposed to
        // mean and did not. Everybody used to set off the instant the circle
        // appeared, so nobody was ever caught and the storm killed 0.3% of the
        // field — in a game where being caught out by a zone is a normal way to
        // die. A poor squad now sits on its ground, farms, takes one more fight,
        // and leaves with the storm already moving.
        s0.leaveAt = LINGER_MAX * total * (1 - s0.skill) * (0.5 + rng());
        // Nobody rotates out of their drop. The first circle is not even drawn
        // yet for most of this, and holdLate already knows how to keep a squad
        // on its ground — so the drop is expressed as "everyone is late for the
        // first forty seconds", which also keeps two squads that landed on the
        // same POI standing on it long enough to settle it.
        if(phase.zone === 1) s0.leaveAt = Math.max(s0.leaveAt, DROP_SEC);
      }

      var t;
      for(t = 0; t < phase.waitSec; t += TICK_SEC){
        inDrop = phase.zone === 1 && t < DROP_SEC;
        holdLate(squads, t);
        stepMovement(squads, TICK_SEC, from);
        applyHealing(squads, from, TICK_SEC);
        applyStorm(squads, from, phase.dps, TICK_SEC, onDeath);
        applySurge(squads, phase.surgeAt, TICK_SEC, onDeath);
        resolveContacts(squads, from, rng, duel, onDeath, inDrop);
        frame(from, to, phase.waitSec - t + phase.shrinkSec);
        if(aliveCount() <= 1) return;
      }
      inDrop = false;
      for(t = 0; t < phase.shrinkSec; t += TICK_SEC){
        holdLate(squads, phase.waitSec + t);
        var k = Math.min(1, t / Math.max(phase.shrinkSec, 1));
        var cur = {
          cx: from.cx + (to.cx - from.cx) * k,
          cy: from.cy + (to.cy - from.cy) * k,
          radius: from.radius + (to.radius - from.radius) * k
        };
        stepMovement(squads, TICK_SEC, cur);
        applyHealing(squads, cur, TICK_SEC);
        applyStorm(squads, cur, phase.dps, TICK_SEC, onDeath);
        applySurge(squads, phase.surgeAt, TICK_SEC, onDeath);
        resolveContacts(squads, cur, rng, duel, onDeath);
        frame(cur, to, phase.shrinkSec - t);
        if(aliveCount() <= 1) return;
      }
    }

    var circle = {cx: plan[0].fromCx, cy: plan[0].fromCy, radius: plan[0].fromRadius};
    for(var p=0; p<plan.length && aliveCount() > 1; p++){
      var ph = plan[p];
      runPhase(circle, {cx: ph.cx, cy: ph.cy, radius: ph.radius}, ph);
      circle = {cx: ph.cx, cy: ph.cy, radius: ph.radius};
    }

    // The collapse. Zone 9 is a box, but two squads can still both be standing
    // in it, so the circle closes to zero and the last contact settles it.
    var last = plan[plan.length-1];
    // The collapse is its own phase and is numbered as one. Counting its deaths
    // against the last circle made the two indistinguishable, and they are not:
    // the logged matches still have nine squads standing when circle 11 closes
    // and settle them afterwards. With them folded together the engine looked
    // like it was finishing the game two circles early when it was not.
    currentZone = plan.length + 1;
    for(var c=0; c < COLLAPSE_SEC && aliveCount() > 1; c += TICK_SEC){
      var f = 1 - (c / COLLAPSE_SEC);
      var shrinking = {cx: last.cx, cy: last.cy, radius: last.radius * f};
      for(var q=0;q<squads.length;q++) if(squads[q].alive){
        squads[q].target = {x: last.cx, y: last.cy};
      }
      stepMovement(squads, TICK_SEC, shrinking);
      applyHealing(squads, shrinking, TICK_SEC);
      applyStorm(squads, shrinking, last.dps, TICK_SEC, onDeath);
      resolveContacts(squads, shrinking, rng, duel, onDeath);
      frame(shrinking, null, COLLAPSE_SEC - c);
    }

    // Anyone still standing after the collapse is ordered by power, so a tie
    // cannot hand the win to whoever happened to be later in the array.
    var survivors = squads.filter(function(s){ return s.alive; });
    survivors.sort(function(a, b){ return (b.team.pow || 0) - (a.team.pow || 0); });

    // Nobody left. Storm and surge both sweep the whole field in a single call,
    // so the last two squads can die on the same tick and leave the game with
    // no winner at all. The one who went last took the win — that is how a real
    // lobby resolves it, and placement here is elimination order anyway.
    if(!survivors.length && eliminationOrder.length){
      var revived = eliminationOrder.pop();
      revived.alive = true;
      revived.deathCause = null;
      survivors = [revived];
    }
    for(var s2 = survivors.length - 1; s2 >= 1; s2--){
      survivors[s2].zoneReached = currentZone;
      survivors[s2].deathCause = survivors[0].team.name;
      survivors[s2].alive = false;
      eliminationOrder.push(survivors[s2]);
      survivors[s2].place = squads.length - eliminationOrder.length + 1;
    }
    var champion = survivors[0];
    champion.zoneReached = currentZone;
    champion.place = 1;
    if(record) frame({cx: last.cx, cy: last.cy, radius: last.radius}, null, 0, true);

    // Write the results back onto the caller's team objects, in the shape the
    // rest of the app already reads.
    squads.forEach(function(s){
      s.team._elims = s.elims;
      s.team._feed = s.feed;
      s.team._deathCause = s.deathCause;
      s.team._zoneReached = s.zoneReached;
      s.team._droppedOut = !!s.droppedOut;
    });

    var order = [champion.team];
    for(var e = eliminationOrder.length - 1; e >= 0; e--) order.push(eliminationOrder[e].team);

    // The roster is index-parallel with every frame's dots, so a name and a
    // colour are carried once rather than restamped onto fifty dots eighty-five
    // times. Sent even when nothing is recorded — it costs one small array and
    // it means a caller never has to reach back into the teams to label a dot.
    var totalSquads = squads.length, totalPlayers = 0;
    for(var tp=0; tp<squads.length; tp++){
      totalPlayers += (squads[tp].team.squad && squads[tp].team.squad.length) || 1;
    }
    var roster = squads.map(function(s){
      return {name: s.team.name, you: !!s.team.isYou,
              size: (s.team.squad && s.team.squad.length) || 1};
    });
    // These are what the header counts down from, and by default they are just
    // this call's own squads — which is wrong the moment a caller drops some of
    // the lobby before ever handing it to the engine. A landing-fight loser is
    // gone before simulateZoneGame is called, so `squads` only ever holds the
    // survivors, and the header would report the lobby as whatever is left
    // rather than what it started as. The caller knows the real lobby size, so
    // it can say so; a caller that does not is unaffected.
    roster.totalSquads = (opts.lobbySquads != null) ? opts.lobbySquads : totalSquads;
    roster.totalPlayers = (opts.lobbyPlayers != null) ? opts.lobbyPlayers : totalPlayers;
    return {order: order, timeline: timeline, roster: roster, aspect: aspect};
  }

  // Stage profiles. index.html already carries this idea for the engine being
  // replaced — it swaps SURVIVAL_BIAS and FORM_SPREAD depending on whether the
  // stage scores on placement — and it carries it because the real results
  // demand it. The same players behave completely differently by stage:
  //
  //                        elims/match   avg place
  //   Play-In leader          9.8-12.8   16.9-17.8
  //   Grand Finals leader      4.5-4.75    6.8-8.0
  //
  // An open stage is a kill race across a huge loose field where even the best
  // duo farms eliminations and dies mid-pack; a final is played for placement.
  // One setting fits one of them and wrecks the other. So the open profile
  // engages far more often and separates far less — nobody gets to sit out of
  // fights in a lobby that is trying to farm.
  var PROFILES = {
    finals: {ENGAGE_CHANCE: 0.02, ENGAGE_BIAS: 8.5, EXPOSURE_FLOOR: 0.18,
             CHAIN_CHANCE: 0.7, CHAIN_MAX: 3, CROWD_SEEK: 0},
    // The open profile used to run at ENGAGE_BIAS 2 and EXPOSURE_FLOOR 0.8,
    // which between them raised every pair's chance of trading by two orders of
    // magnitude — 0.8 squared against 0.18 to the eight and a half. It emptied
    // the lobby by zone 5: 21% of the field alive when the third circle closed
    // against 81% in a real match, and two of the three open stages showed it
    // on screen. The rate was never the lever; those two were.
    //
    // They now match the finals profile, and what makes this a kill race is
    // what should have been making it one all along: a higher engagement rate,
    // longer streaks, and rotating toward people instead of away from them.
    open:   {ENGAGE_CHANCE: 0.03, ENGAGE_BIAS: 8.5, EXPOSURE_FLOOR: 0.18,
             CHAIN_CHANCE: 0.85, CHAIN_MAX: 5, CROWD_SEEK: 8}
  };
  var CURRENT_PROFILE = 'finals';

  function profile(name){
    var p = PROFILES[name];
    if(!p) return CURRENT_PROFILE;
    CURRENT_PROFILE = name;
    ENGAGE_CHANCE = p.ENGAGE_CHANCE;
    ENGAGE_BIAS = p.ENGAGE_BIAS;
    EXPOSURE_FLOOR = p.EXPOSURE_FLOOR;
    CHAIN_CHANCE = p.CHAIN_CHANCE;
    CHAIN_MAX = p.CHAIN_MAX;
    CROWD_SEEK = p.CROWD_SEEK;
    return CURRENT_PROFILE;
  }

  // Calibration hook. The four constants below are the only ones tools may move
  // — the storm table, the move budgets and the surge thresholds are published
  // measurements and are deliberately not reachable from here.
  function tune(v){
    if(v.READ_NOISE     != null) READ_NOISE     = v.READ_NOISE;
    if(v.CROWD_WEIGHT   != null) CROWD_WEIGHT   = v.CROWD_WEIGHT;
    if(v.CROWD_SEEK     != null) CROWD_SEEK     = v.CROWD_SEEK;
    if(v.ENGAGE_CHANCE  != null) ENGAGE_CHANCE  = v.ENGAGE_CHANCE;
    if(v.ENGAGE_BIAS    != null) ENGAGE_BIAS    = v.ENGAGE_BIAS;
    if(v.CHAIN_CHANCE   != null) CHAIN_CHANCE   = v.CHAIN_CHANCE;
    if(v.CHAIN_MAX      != null) CHAIN_MAX      = v.CHAIN_MAX;
    if(v.EXPOSURE_FLOOR != null) EXPOSURE_FLOOR = v.EXPOSURE_FLOOR;
    if(v.LINGER_MAX     != null) LINGER_MAX     = v.LINGER_MAX;
    if(v.SURGE_DPS      != null) SURGE_DPS      = v.SURGE_DPS;
    if(v.ROOM           != null) ROOM           = v.ROOM;
    if(v.PRESSURE_BASE  != null) PRESSURE_BASE  = v.PRESSURE_BASE;
    if(v.PRESSURE_EXP   != null) PRESSURE_EXP   = v.PRESSURE_EXP;
    if(v.PRESSURE_MAX   != null) PRESSURE_MAX   = v.PRESSURE_MAX;
    if(v.DROP_SEC       != null) DROP_SEC       = v.DROP_SEC;
    if(v.DROP_PRESSURE  != null) DROP_PRESSURE  = v.DROP_PRESSURE;
    if(v.PICK_EXP       != null) PICK_EXP       = v.PICK_EXP;
    if(v.NOWHERE_ROOM   != null) NOWHERE_ROOM   = v.NOWHERE_ROOM;
    if(v.CHIP_RATE      != null) CHIP_RATE      = v.CHIP_RATE;
    if(v.HEAL_RATE      != null) HEAL_RATE      = v.HEAL_RATE;
    return {READ_NOISE:READ_NOISE, CROWD_WEIGHT:CROWD_WEIGHT, CROWD_SEEK:CROWD_SEEK, ENGAGE_CHANCE:ENGAGE_CHANCE,
            ENGAGE_BIAS:ENGAGE_BIAS, CHAIN_CHANCE:CHAIN_CHANCE, EXPOSURE_FLOOR:EXPOSURE_FLOOR,
            CHAIN_MAX:CHAIN_MAX, LINGER_MAX:LINGER_MAX, SURGE_DPS:SURGE_DPS,
            ROOM:ROOM, PRESSURE_BASE:PRESSURE_BASE, PRESSURE_EXP:PRESSURE_EXP,
            PICK_EXP:PICK_EXP, CHIP_RATE:CHIP_RATE, HEAL_RATE:HEAL_RATE,
            DROP_SEC:DROP_SEC, DROP_PRESSURE:DROP_PRESSURE};
  }

  var ZoneSim = {
    VERSION: VERSION,
    PROFILES: PROFILES,
    profile: profile,
    tune: tune,
    simulateZoneGame: simulateZoneGame,
    SURGE_DPS: SURGE_DPS,
    applySurge: applySurge,
    createRng: createRng,
    PHASES: PHASES,
    DRIFT: DRIFT,
    generateZonePlan: generateZonePlan,
    SPEED: SPEED,
    applyStorm: applyStorm,
    applyHealing: applyHealing,
    CONTACT_RANGE: CONTACT_RANGE,
    ENGAGE_CHANCE: ENGAGE_CHANCE,
    resolveContacts: resolveContacts,
    createSquads: createSquads,
    chooseTarget: chooseTarget,
    stepMovement: stepMovement
  };

  root.ZoneSim = ZoneSim;
  if(typeof module !== 'undefined' && module.exports) module.exports = ZoneSim;
})(typeof globalThis !== 'undefined' ? globalThis : this);
