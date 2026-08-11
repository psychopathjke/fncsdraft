// How many squads should lose their drop?
//
// The landing fight is played on the map now, inside the first DROP_SEC of the
// game, and how often it ends in a wipe is one constant: DROP_PRESSURE. This
// script measures that constant against the only number the real matches give
// us about the drop — 7 of 149 duos are already out when the first circle
// closes, which is 4.7% of the lobby, and the survival curve puts 95% of the
// field alive at that moment.
//
// The lobby is built the way the app builds one: every squad picks a spot off
// the same rectangle grid the picker uses, and squads that pick the same spot
// stand on the same ground. That is what makes a drop contested, and it is why
// this cannot be measured with the uniformly scattered lobby the other tools
// use — there, nobody lands on anybody.
//
//   node tools/drop-calibration.js               measure the current constant
//   node tools/drop-calibration.js --sweep       try a range of them
'use strict';

var fs = require('fs');
var path = require('path');
var ZoneSim = require('../zone-sim.js');

var ROOT = path.join(__dirname, '..');

// The picker's own rectangles, read out of the app rather than copied, so this
// measurement cannot drift away from the map the game is actually played on.
function landingGrid(){
  var src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  var from = src.indexOf('const ZONE_SETS={');
  var to = src.indexOf('const ALL_LANDING_ZONES');
  var body = src.slice(from, to);
  var rects = [];
  var re = /\{x:([\d.]+),y:([\d.]+),w:([\d.]+),h:([\d.]+)\}/g, m;
  var m2 = body.indexOf('m2:[');
  while((m = re.exec(body))){
    if(m.index < m2) continue;              // m2 is the current card set
    rects.push({x:+m[1], y:+m[2], w:+m[3], h:+m[4]});
  }
  return rects;
}

var ASPECT = 1080 / 1920;

function rng32(seed){
  var a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The same graded field the reference harness uses — a real lobby is not fifty
// equal squads, and `seek` is read straight off AIM and CLU, so a flat field
// would measure the drop at one aggression instead of across the range.
function field(n){
  var teams = [], c = function(v){ return Math.max(5, Math.min(99, v)); };
  for(var i=0;i<n;i++){
    var q = 1 - i/(n-1), a = 25 + q*70, tilt = (i % 2 ? 1 : -1) * 12;
    teams.push({name:'F'+i, pow:83 + q*21, squad:[{},{}], attrs:{
      END: c(a - tilt), SUR: c(a - tilt*0.6), AIM: c(a + tilt), CLU: c(a + tilt*0.6)}});
  }
  return teams;
}

// A power-weighted duel, the same shape index.html hands the engine.
function duel(a, b){
  var pa = Math.pow(Math.max(a.pow,1), 3), pb = Math.pow(Math.max(b.pow,1), 3);
  return Math.random() * (pa + pb) < pa ? a : b;
}

function run(games, squadCount, grid, dropPressure){
  if(dropPressure != null) ZoneSim.tune({DROP_PRESSURE: dropPressure});
  var lostDrop = 0, contested = 0, aliveAtOne = 0, total = 0;
  for(var g=0; g<games; g++){
    var rng = rng32(1000 + g);
    var teams = field(squadCount);
    // Every squad picks a spot; sharers stand on the same ground. Spots go round
    // a shuffled grid rather than being drawn at random, because that is the
    // shape the app's picker produces: it gives each squad the best box still
    // worth taking, so the island fills before anybody doubles up. Drawing at
    // random put 45% of the field on a shared box against the app's 30%, and
    // every toll measured here ran high because of it.
    var spots = grid.slice();
    for(var si=spots.length-1; si>0; si--){
      var sj = Math.floor(rng() * (si + 1));
      var tmp = spots[si]; spots[si] = spots[sj]; spots[sj] = tmp;
    }
    var picks = teams.map(function(_, i){ return spots[i % spots.length]; });
    var seen = {};
    picks.forEach(function(r, i){
      var key = r.x + ',' + r.y;
      if(seen[key] != null) contested++;
      else seen[key] = i;
    });
    ZoneSim.simulateZoneGame(teams, {
      rng: rng, land: grid, aspect: ASPECT,
      startOf: function(t){
        var r = picks[teams.indexOf(t)];
        return {x: r.x + r.w/2, y: r.y + r.h/2};
      },
      duel: duel, record: false
    });
    teams.forEach(function(t){
      total++;
      if(t._droppedOut) lostDrop++;
      if(t._zoneReached > 1) aliveAtOne++;
    });
  }
  return {lostDrop: lostDrop/total, contested: contested/(games*squadCount),
          pastZoneOne: aliveAtOne/total};
}

var grid = landingGrid();
var GAMES = 40, SQUADS = 50;
console.log('');
console.log('  the drop, measured on the app\'s own landing grid');
console.log('  ' + grid.length + ' spots, ' + SQUADS + ' duos, ' + GAMES + ' games each');
console.log('');
console.log('  real: 4.7% of duos are out before the first circle closes, 95% alive at it');
console.log('');

if(process.argv.indexOf('--sweep') >= 0){
  console.log('  DROP_PRESSURE   share of duos   share still');
  console.log('                  losing a drop   past zone 1');
  [0.04, 0.06, 0.08, 0.1, 0.15, 0.25, 0.4, 1, 4, 60].forEach(function(p){
    var r = run(GAMES, SQUADS, grid, p);
    console.log('  ' + String(p).padStart(11) + '   ' +
                (r.lostDrop*100).toFixed(1).padStart(12) + '%   ' +
                (r.pastZoneOne*100).toFixed(1).padStart(10) + '%');
  });
} else {
  var r = run(GAMES, SQUADS, grid, null);
  console.log('  squads sharing a spot   ' + (r.contested*100).toFixed(1) + '%');
  console.log('  losing their drop       ' + (r.lostDrop*100).toFixed(1) + '%   (real 4.7%)');
  console.log('  still alive past zone 1 ' + (r.pastZoneOne*100).toFixed(1) + '%   (real 95%)');
}
console.log('');
