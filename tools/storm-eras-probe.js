// Шторм и сюрдж по годам (ZoneSim.phasesFor): одно и то же лобби 50 дуо по правилам каждой эпохи.
// Смотрим, что эпоха меняет: длина игры, смерти от шторма и сюрджа, место сильнейших.
//
//   node tools/storm-eras-probe.js        200 игр на эпоху
//   node tools/storm-eras-probe.js 500
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

var GAMES = Number(process.argv[2]) || 200;
var ERAS = [['2019', '2019-08-01'], ['2021', '2021-06-01'], ['2022 H2', '2022-09-01'], ['2023', '2023-06-01'],
            ['2025', '2025-06-01'], ['2026', '2026-06-01'], ['без даты', null]];

ERAS.forEach(function(era){
  var phases = era[1] ? ZoneSim.phasesFor(era[1], 2) : undefined;
  var st = {sec:0, storm:0, surge:0, fight:0, top5:0, n:0};
  for(var g=0; g<GAMES; g++){
    var rng = ZoneSim.createRng(1 + g);
    var teams = field(50);
    var picks = teams.map(function(){ return LAND[Math.floor(rng() * LAND.length)]; });
    var duel = function(a, b){
      var wa = Math.pow(a.pow, 7), wb = Math.pow(b.pow, 7);
      return rng() * (wa + wb) < wa ? a : b;
    };
    var r = ZoneSim.simulateZoneGame(teams, {
      rng: rng, land: LAND, aspect: ASPECT, phases: phases,
      startOf: function(t){ var p = picks[teams.indexOf(t)]; return {x: p.x + p.w/2, y: p.y + p.h/2}; },
      duel: duel, record: false
    });
    // order — команды по местам, первая — победитель.
    r.order.forEach(function(x, i){
      var cause = x._deathCause;
      if(cause === 'storm') st.storm++; else if(cause === 'surge') st.surge++; else if(cause) st.fight++;
      if(+x.name.slice(1) < 5) st.top5 += i + 1;
    });
    st.sec += r.timeline && r.timeline.length ? (r.timeline[r.timeline.length-1].t || 0) : 0;
    st.n++;
  }
  console.log(era[0].padEnd(9), 'кругов', (phases || ZoneSim.PHASES).length, 'net', phases ? phases.net : true,
    '| смертей за игру: шторм', (st.storm/st.n).toFixed(2), 'сюрдж', (st.surge/st.n).toFixed(2), 'бой', (st.fight/st.n).toFixed(1),
    '| место пяти сильнейших', (st.top5/st.n/5).toFixed(1));
});
