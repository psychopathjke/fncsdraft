// What a contested drop is actually worth, in odds.
//
// The picker warns that a spot already has one squad on it, or two, and leaves
// the player to guess what that means. This prints what it means: how often a
// squad on a shared spot is wiped there, how often it does the wiping, and how
// often the drop just ends with everybody walking away — which, since the fight
// moved onto the map, is most of the time.
//
// Run against the real engine and the app's own duel, so the numbers are the
// ones the game plays, not a model of them.
//
//   node tools/drop-odds.js
'use strict';

var fs = require('fs');
var path = require('path');
var ZoneSim = require('../zone-sim.js');

var src = fs.readFileSync(path.join(__dirname, 'zone-sim-test.js'), 'utf8');
var LAND = eval(src.match(/const LAND = (\[[\s\S]*?\n\];)/)[1].replace(/;$/, ''));
var ASPECT = 970 / 1100;
var DUEL_EXP = {2: 7, 3: 6, 4: 4};

// One lobby: the squads sharing the spot land on the same rectangle, everybody
// else is spread over the rest of the island so the lobby is a real one.
function play(seed, size, rivals, edge){
  var rng = ZoneSim.createRng(seed);
  var lobby = size === 2 ? 50 : size === 3 ? 33 : 25;
  var teams = [], i;
  var squad = function(){ var a = []; for(var k=0;k<size;k++) a.push({}); return a; };
  // You, and the squads on your spot. `edge` is your power advantage in points.
  teams.push({name:'you', pow: 100 + edge, squad: squad(),
              attrs:{END:70, SUR:70, AIM:70, CLU:70}, mine:true});
  for(i=0;i<rivals;i++){
    teams.push({name:'rival'+i, pow: 100, squad: squad(),
                attrs:{END:70, SUR:70, AIM:70, CLU:70}, rival:true});
  }
  for(i=teams.length;i<lobby;i++){
    var q = 1 - i/lobby, a = 30 + q*60;
    teams.push({name:'F'+i, pow: 80 + q*30, squad: squad(),
                attrs:{END:a, SUR:a, AIM:a, CLU:a}});
  }
  // The contested spot, then one rectangle each for everybody else.
  var spot = LAND[Math.floor(rng() * LAND.length)];
  var elsewhere = LAND.filter(function(r){ return r !== spot; });
  var at = teams.map(function(t, idx){
    if(idx <= rivals) return spot;
    return elsewhere[(idx - rivals - 1) % elsewhere.length];
  });
  var exp = DUEL_EXP[size] || 5;
  ZoneSim.simulateZoneGame(teams, {
    rng: rng, land: LAND, aspect: ASPECT,
    startOf: function(t){ var r = at[teams.indexOf(t)];
                          return {x: r.x + r.w/2, y: r.y + r.h/2}; },
    duel: function(a, b){
      var wa = Math.pow(a.pow, exp), wb = Math.pow(b.pow, exp);
      return rng() * (wa + wb) < wa ? a : b;
    },
    record: false
  });
  var you = teams[0];
  var killedARival = teams.some(function(t){
    return t.rival && t._droppedOut && t._deathCause === you.name;
  });
  return {lost: !!you._droppedOut, won: killedARival, place: you._zoneReached};
}

function odds(size, rivals, edge, runs){
  var fight = 0, youLost = 0, youWon = 0;
  for(var s=1; s<=runs; s++){
    var r = play(s * 31 + rivals * 7 + edge, size, rivals, edge);
    if(r.lost){ fight++; youLost++; }
    else if(r.won){ fight++; youWon++; }
  }
  return {fight: 100*fight/runs,
          winIfFight: fight ? 100*youWon/fight : 0,
          lost: 100*youLost/runs};
}

var RUNS = 3000;
console.log('');
console.log('  A contested drop, played on the map. ' + RUNS + ' lobbies each.');
console.log('');
console.log('  rivals   your edge   a fight breaks out   you win it   you are wiped');
[[1, 0], [1, 10], [1, -10], [2, 0], [2, 10], [2, -10]].forEach(function(c){
  var r = odds(2, c[0], c[1], RUNS);
  var edge = c[1] === 0 ? 'even' : (c[1] > 0 ? '+' + c[1] : String(c[1]));
  console.log('  ' + String(c[0]).padStart(6) + '   ' + edge.padStart(9) + '   ' +
              (r.fight.toFixed(1) + '%').padStart(18) + '   ' +
              (r.winIfFight.toFixed(0) + '%').padStart(10) + '   ' +
              (r.lost.toFixed(1) + '%').padStart(13));
});
console.log('');
console.log('  "A fight breaks out" is the share of games where somebody on the spot was');
console.log('  wiped there; "you win it" is your share of those. Power 100 against 100 is');
console.log('  an even squad, +10 a clearly better one.');
console.log('');
