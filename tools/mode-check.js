// Does the zone engine hold up at every squad size the app plays?
//
// It was written for duos and calibrated on duo telemetry. Trios and squads
// change one thing that matters a great deal: the number of players in the
// lobby. Storm Surge is a player count, not a squad count, so a table read off
// a hundred-player duo lobby fires far too early in a two-hundred-player squad
// lobby unless it is scaled with the field.
//
//   node tools/mode-check.js
'use strict';

var fs = require('fs');
var path = require('path');
var ZoneSim = require('../zone-sim.js');

var src = fs.readFileSync(path.join(__dirname, 'zone-sim-test.js'), 'utf8');
var LAND = eval(src.match(/const LAND = (\[[\s\S]*?\n\];)/)[1].replace(/;$/, ''));
var ASPECT = 970 / 1100;

function field(n, size){
  var teams = [], c = function(v){ return Math.max(5, Math.min(99, v)); };
  for(var i=0;i<n;i++){
    var q = 1 - i/(n-1), a = 25 + q*70, tilt = (i % 2 ? 1 : -1) * 12;
    var squad = [];
    for(var p=0;p<size;p++) squad.push({});
    teams.push({name:'T'+i, pow:83 + q*21, squad:squad, attrs:{
      END: c(a - tilt), SUR: c(a - tilt*0.6), AIM: c(a + tilt), CLU: c(a + tilt*0.6)}});
  }
  return teams;
}

var REAL = [0.95, 0.85, 0.81, 0.81, 0.75, 0.69, 0.60, 0.47, 0.37, 0.28, 0.18];

function run(size, squads, runs){
  var alive = new Array(11).fill(0), causes = {storm:0, surge:0, fight:0}, deaths = 0, unfinished = 0;
  for(var s=1; s<=runs; s++){
    var rng = ZoneSim.createRng(500 + s);
    var teams = field(squads, size);
    var picks = teams.map(function(){ return LAND[Math.floor(rng() * LAND.length)]; });
    var duel = function(a, b){
      var e = size === 2 ? 7 : size === 3 ? 6 : 4;
      var wa = Math.pow(a.pow, e), wb = Math.pow(b.pow, e);
      return rng() * (wa + wb) < wa ? a : b;
    };
    var res = ZoneSim.simulateZoneGame(teams, {rng: rng, land: LAND, aspect: ASPECT,
      startOf: function(t){ var r = picks[teams.indexOf(t)];
                            return {x: r.x + r.w/2, y: r.y + r.h/2}; },
      duel: duel, record: false});
    if(res.order.length !== squads) unfinished++;
    for(var z=1; z<=11; z++){
      alive[z-1] += teams.filter(function(t){ return t._deathCause === null || t._zoneReached > z; }).length / squads;
    }
    teams.forEach(function(t){
      if(t._deathCause === null) return;
      deaths++;
      if(t._deathCause === 'storm') causes.storm++;
      else if(t._deathCause === 'surge') causes.surge++;
      else causes.fight++;
    });
  }
  return {curve: alive.map(function(v){ return v/runs; }),
          storm: causes.storm/deaths, surge: causes.surge/deaths, unfinished: unfinished};
}

// The real lobby sizes: Fortnite seats a hundred players whatever the mode, so
// a trio lobby is 33 teams and a squad lobby 25. TEAM_TARGET in index.html says
// the same. That is also why the published Storm Surge table needs no scaling —
// it is a player count, and the player count barely moves.
var MODES = [{size:2, squads:50, label:'duos   (100 players)'},
             {size:3, squads:33, label:'trios  (99 players)'},
             {size:4, squads:25, label:'squads (100 players)'}];

console.log('');
console.log('  share of the lobby alive when each circle closes, by squad size');
console.log('  the real column is the duo telemetry — the others have no telemetry of');
console.log('  their own, so it stands as the shape all three should broadly hold');
console.log('');
console.log('  zone            ' + REAL.map(function(_, i){ return String(i+1).padStart(5); }).join(''));
console.log('  real (duos)     ' + REAL.map(function(v){ return (Math.round(v*100) + '%').padStart(5); }).join(''));
MODES.forEach(function(m){
  var r = run(m.size, m.squads, 20);
  console.log('  ' + m.label.padEnd(16) + r.curve.map(function(v){ return (Math.round(v*100) + '%').padStart(5); }).join(''));
  console.log('  ' + ''.padEnd(16) + 'storm ' + (100*r.storm).toFixed(0) + '%, surge ' +
              (100*r.surge).toFixed(0) + '%' + (r.unfinished ? ', UNFINISHED ' + r.unfinished : ''));
});
console.log('');
