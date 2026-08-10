// What "Start FNCS Major" costs before the first frame appears.
//
// Pressing it runs every stage that is not played on the map — the Play-In, the
// Heats, the qualifiers — headless, back to back, before anything is drawn. The
// button is therefore exactly as fast as this number, and nothing else about it
// matters.
//
//   node tools/sim-bench.js            time a Major's worth of games
//   node tools/sim-bench.js 220        time that many games
'use strict';

var fs = require('fs');
var path = require('path');
var ZoneSim = require('../zone-sim.js');

var src = fs.readFileSync(path.join(__dirname, 'zone-sim-test.js'), 'utf8');
var LAND = eval(src.match(/const LAND = (\[[\s\S]*?\n\];)/)[1].replace(/;$/, ''));
var ASPECT = 970 / 1100;

function field(n){
  var teams = [], c = function(v){ return Math.max(5, Math.min(99, v)); };
  for(var i=0;i<n;i++){
    var q = 1 - i/(n-1), a = 25 + q*70, tilt = (i % 2 ? 1 : -1) * 12;
    teams.push({name:'F'+i, pow:83 + q*21, squad:[{},{}], attrs:{
      END: c(a - tilt), SUR: c(a - tilt*0.6), AIM: c(a + tilt), CLU: c(a + tilt*0.6)}});
  }
  return teams;
}

var GAMES = Number(process.argv[2]) || 110;
var SQUADS = 50;

var t0 = Date.now();
var ticks = 0;
for(var g=0; g<GAMES; g++){
  var rng = ZoneSim.createRng(1 + g);
  var teams = field(SQUADS);
  var picks = teams.map(function(){ return LAND[Math.floor(rng() * LAND.length)]; });
  var duel = function(a, b){
    var wa = Math.pow(a.pow, 7), wb = Math.pow(b.pow, 7);
    return rng() * (wa + wb) < wa ? a : b;
  };
  ZoneSim.simulateZoneGame(teams, {
    rng: rng, land: LAND, aspect: ASPECT,
    startOf: function(t){ var r = picks[teams.indexOf(t)];
                          return {x: r.x + r.w/2, y: r.y + r.h/2}; },
    duel: duel, record: false
  });
}
var ms = Date.now() - t0;
console.log('');
console.log('  ' + GAMES + ' headless games of ' + SQUADS + ' duos: ' + ms + 'ms  (' +
            (ms/GAMES).toFixed(1) + 'ms a game)');
console.log('');
