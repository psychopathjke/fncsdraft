// When is the lobby supposed to die?
//
// The three logged Grand Finals in real-matches.json answer it exactly: every
// team's timeAlive against every zone update's timestamp is the survival curve,
// team by team and zone by zone. Nothing here is reasoned about — the target
// column is counted out of the log.
//
// It is worth its own tool because the endgame is where a wrong curve shows up
// and the wrong place to fix it. "С 10 зоны дёргаться начинается" and a map that
// could name four squads out of nine are both the same debt: a lobby that does
// not thin out on schedule arrives at circle 10 with twice the field it should
// have, standing on ground the size of a coin.
//
//   node tools/survival-calibration.js            measure the curve as it is
//   node tools/survival-calibration.js --sweep KNOB   try a range of one constant
//
// The lobby is built the way drop-calibration builds one — off the app's own
// landing grid, so squads that pick the same box land on each other — because
// the drop is the first point on the curve and a scattered lobby has no drop.
'use strict';

var fs = require('fs');
var path = require('path');
var ZoneSim = require('../zone-sim.js');

var ROOT = path.join(__dirname, '..');
var LOG = require('./real-matches.json');

function landingGrid(){
  var src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  var from = src.indexOf('const ZONE_SETS={');
  var to = src.indexOf('const ALL_LANDING_ZONES');
  var body = src.slice(from, to);
  var rects = [], re = /\{x:([\d.]+),y:([\d.]+),w:([\d.]+),h:([\d.]+)\}/g, m;
  var m2 = body.indexOf('m2:[');
  while((m = re.exec(body))){
    if(m.index < m2) continue;
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

function field(n){
  var teams = [], c = function(v){ return Math.max(5, Math.min(99, v)); };
  for(var i=0;i<n;i++){
    var q = 1 - i/(n-1), a = 25 + q*70, tilt = (i % 2 ? 1 : -1) * 12;
    teams.push({name:'F'+i, pow:83 + q*21, squad:[{},{}], attrs:{
      END: c(a - tilt), SUR: c(a - tilt*0.6), AIM: c(a + tilt), CLU: c(a + tilt*0.6)}});
  }
  return teams;
}

function duel(a, b){
  var pa = Math.pow(Math.max(a.pow,1), 3), pb = Math.pow(Math.max(b.pow,1), 3);
  return Math.random() * (pa + pb) < pa ? a : b;
}

// Squads still standing when each zone update lands, per fifty, averaged over
// the three logged matches. A match of 49 is scaled to 50 so the three can be
// averaged against each other and against a 50-squad lobby.
function logged(){
  var rows = LOG.matches.map(function(m){
    return m.zones.map(function(z){
      var n = 0;
      for(var i=0;i<m.teams.length;i++) if(m.teams[i].timeAlive >= z.t) n++;
      return n * 50 / m.teamCount;
    });
  });
  return rows[0].map(function(_, i){
    var s = 0;
    for(var r=0;r<rows.length;r++) s += rows[r][i];
    return s / rows.length;
  });
}

// The engine's phases are numbered one higher than the log's circles: its zone
// 1 is the drop, before any circle exists, so its zone N begins at the moment
// the log's circle N-1 lands. Checked rather than assumed — the engine's phase
// starts fall on 112, 320, 464, 624, 768, 880, 992, 1088, 1168, 1232, 1280
// seconds against logged circle times of 125, 320, 470, 620, 775, 885, 995,
// 1090, 1170, 1225, 1276. Comparing the rows as they are numbered was worth
// five squads of imaginary error.
var PHASE_OFFSET = 1;

// The same count off a simulated game, read from the recorded timeline: the
// first frame of each phase is the moment that phase begins.
function simulate(games, grid){
  var sums = {}, seen = {}, finished = 0, lastZone = 0;
  for(var g=0; g<games; g++){
    var rng = rng32(1000 + g);
    var teams = field(50);
    var spots = grid.slice();
    for(var si=spots.length-1; si>0; si--){
      var sj = Math.floor(rng() * (si + 1));
      var tmp = spots[si]; spots[si] = spots[sj]; spots[sj] = tmp;
    }
    var picks = teams.map(function(_, i){ return spots[i % spots.length]; });
    var res = ZoneSim.simulateZoneGame(teams, {
      rng: rng, land: grid, aspect: ASPECT,
      startOf: function(t){
        var r = picks[teams.indexOf(t)];
        return {x: r.x + r.w/2, y: r.y + r.h/2};
      },
      duel: duel, record: true
    });
    var first = {};
    res.timeline.forEach(function(f){ if(first[f.zone] == null) first[f.zone] = f.alive; });
    Object.keys(first).forEach(function(z){
      sums[z] = (sums[z] || 0) + first[z];
      seen[z] = (seen[z] || 0) + 1;
      if(Number(z) > lastZone) lastZone = Number(z);
    });
    finished++;
  }
  var out = [];
  for(var z=1; z<=lastZone; z++) out[z-1] = seen[z] ? sums[z]/seen[z] : null;
  return {curve: out, games: finished};
}

// How far off the logged curve a run is. Squared, so one zone that is wildly
// out cannot be traded against eleven that are nearly right, and only over the
// zones the log actually has — anything past zone 11 is the collapse, which the
// log records as a placement rather than as a circle.
function simAt(sim, i){ return sim[i + PHASE_OFFSET]; }

function miss(sim, real){
  var s = 0, n = 0;
  for(var i=0;i<real.length;i++){
    var v = simAt(sim, i);
    if(v == null) continue;
    s += (v - real[i]) * (v - real[i]); n++;
  }
  return Math.sqrt(s / n);
}

function report(sim, real, games){
  console.log('');
  console.log('  when the lobby dies, against ' + LOG.matches.length +
              ' logged Grand Finals and ' + games + ' simulated games');
  console.log('');
  console.log('  circle   logged   sim     gap');
  for(var i=0;i<real.length;i++){
    var r = real[i], s = simAt(sim, i);
    console.log('  ' + String(i+1).padEnd(8) +
      (r == null ? '  -   ' : r.toFixed(1).padEnd(9)) +
      (s == null ? '  -   ' : s.toFixed(1).padEnd(8)) +
      (r == null || s == null ? '' : (s - r >= 0 ? '+' : '') + (s - r).toFixed(1)));
  }
  console.log('');
  console.log('  off by ' + miss(sim, real).toFixed(2) + ' squads, root mean square');
  console.log('');
}

var grid = landingGrid();
var real = logged();
var GAMES = Number(process.env.GAMES) || 40;

var SWEEPS = {
  PRESSURE_EXP:  [0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1.0, 1.2],
  PRESSURE_MAX:  [3, 4, 5, 6, 8, 10, 14, 20],
  PRESSURE_BASE: [0.15, 0.20, 0.25, 0.30, 0.35, 0.40],
  ENGAGE_CHANCE: [0.02, 0.03, 0.04, 0.06, 0.08, 0.12],
  DROP_PRESSURE: [0.08, 0.12, 0.15, 0.18, 0.22, 0.30],
  NOWHERE_ROOM:  [0.12, 0.15, 0.18, 0.21, 0.24, 0.28]
};

var sweep = process.argv.indexOf('--sweep');
if(sweep !== -1){
  var knob = process.argv[sweep + 1];
  if(!SWEEPS[knob]){
    console.error('  --sweep needs one of: ' + Object.keys(SWEEPS).join(', '));
    process.exit(2);
  }
  var base = ZoneSim.tune({});
  console.log('');
  console.log('  ' + knob.padEnd(15) + 'off by      circle 7   circle 10  circle 11');
  console.log('  ' + 'logged'.padEnd(15) + '            ' + real[6].toFixed(1) + '       ' +
              real[9].toFixed(1) + '        ' + real[10].toFixed(1));
  SWEEPS[knob].forEach(function(p){
    var one = {};
    one[knob] = p;
    ZoneSim.tune(one);
    var r = simulate(GAMES, grid);
    console.log('  ' + String(p).padEnd(15) + miss(r.curve, real).toFixed(2).padEnd(12) +
      simAt(r.curve,6).toFixed(1).padEnd(11) + simAt(r.curve,9).toFixed(1).padEnd(11) +
      simAt(r.curve,10).toFixed(1));
  });
  ZoneSim.tune(base);
  console.log('');
} else {
  var run = simulate(GAMES, grid);
  report(run.curve, real, run.games);
}
