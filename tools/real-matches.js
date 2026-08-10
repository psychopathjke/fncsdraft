// What real Grand Finals look like, and what the engine does beside them.
//
// The reference is tools/real-matches.json: three FNCS 2026 EU Grand Finals
// pulled out of their Match Details pages. It is the only hard evidence in this
// project about *when* squads die, which is the one thing a spatial simulation
// is for and the one thing no results table can tell you — a leaderboard says a
// squad came 14th, not that it was alive until the eighth circle.
//
// Run: node tools/real-matches.js            the reference and the engine, side by side
//      node tools/real-matches.js --zones    the storm the three of them agree on
//      node tools/real-matches.js --fit 0.01,0.02,0.05   engine curves at those rates
const P = require('path').join(__dirname, '..') + '/';
const Z = require(P + 'zone-sim.js');
const fs = require('fs');
const REF = JSON.parse(fs.readFileSync(P + 'tools/real-matches.json', 'utf8'));
const MATCHES = REF.matches;
const NZ = MATCHES[0].zones.length;

// Same land mask and field the calibration harness uses, read from it rather
// than copied, so the two can never drift apart.
const src = fs.readFileSync(P + 'tools/zone-sim-test.js', 'utf8');
const LAND = eval(src.match(/const LAND = (\[[\s\S]*?\n\];)/)[1].replace(/;$/, ''));
const ASPECT = 970/1100;

// One world unit in game units: the elimination coordinates span the island,
// and the app's land mask spans 83 units of map width.
const UNIT = 200000 / 83;

function finalsField(){
  const teams = [], c = v => Math.max(5, Math.min(99, v));
  for(let i=0;i<50;i++){
    const q = 1 - i/49, a = 25 + q*70, tilt = (i % 2 ? 1 : -1) * 12;
    teams.push({name:'F'+i, pow:83 + q*21, squad:[{},{}], attrs:{
      END: c(a - tilt), SUR: c(a - tilt*0.6), AIM: c(a + tilt), CLU: c(a + tilt*0.6)}});
  }
  return teams;
}

// The reference curve: the share of the lobby still alive when each circle
// finished closing, averaged over the three matches.
//
// A team's timeAlive is counted from the moment it lands and the zone updates
// are counted from the start of the session, so the two need the landing offset
// between them — about fifty seconds of bus and freefall, fitted per match by
// lining team death times up against the kill events. Without it every squad
// looks fifty seconds shorter-lived than it was, which drags the whole curve
// down and is exactly the mistake this file made when it had one match in it.
function realCurve(){
  const out = [];
  for(let z=0; z<NZ; z++){
    let sum = 0;
    for(const m of MATCHES){
      const at = m.zones[z].t - m.landingOffset;
      sum += m.teams.filter(t => t.timeAlive > at).length / m.teamCount;
    }
    out.push(sum / MATCHES.length);
  }
  return out;
}

// The same curve out of the engine. _zoneReached is the phase a squad died in,
// so everyone still going after zone n either died later or won. The final
// collapse counts as its own phase, which is what makes the last circle's
// number mean the same thing on both sides.
function engineCurve(runs){
  const alive = new Array(NZ).fill(0);
  let storm = 0, surge = 0, deaths = 0;
  for(let seed=1; seed<=runs; seed++){
    const rng = Z.createRng(seed), teams = finalsField();
    const duel = (a, b) => {
      const wa = Math.pow(a.pow, 7), wb = Math.pow(b.pow, 7);
      return rng() * (wa + wb) < wa ? a : b;
    };
    // Squads drop on named ground, not on random coordinates. Each one picks a
    // rectangle off the same mask the island is built from and lands in the
    // middle of it, so two squads that pick the same one land on each other —
    // which is the whole reason the first circle is not full when it closes.
    // Scattering them uniformly, as this harness used to, made the drop
    // unmeasurable: nobody ever landed near anybody, so zone 1 came out at 99%
    // against a real 95% and the deaths that belong there had to be borrowed
    // from later zones.
    const picks = teams.map(() => LAND[Math.floor(rng() * LAND.length)]);
    Z.simulateZoneGame(teams, {rng, land:LAND, aspect:ASPECT,
      startOf: t => { const r = picks[teams.indexOf(t)];
                      return {x: r.x + r.w/2, y: r.y + r.h/2}; }, duel, record:false});
    for(let z=1; z<=NZ; z++){
      alive[z-1] += teams.filter(t => t._deathCause === null || t._zoneReached > z).length / teams.length;
    }
    teams.forEach(t => {
      if(t._deathCause === null) return;
      deaths++;
      if(t._deathCause === 'storm') storm++;
      else if(t._deathCause === 'surge') surge++;
    });
  }
  return {curve: alive.map(v => v / runs), storm: storm/deaths, surge: surge/deaths};
}

const bar = v => '#'.repeat(Math.round(v * 40));

function report(runs){
  const real = realCurve(), eng = engineCurve(runs);
  console.log('\n  share of the lobby still alive when each circle closes');
  console.log('  ' + REF.source + ', ' + MATCHES.length + ' matches, ' +
              MATCHES.reduce((s, m) => s + m.teamCount, 0) + ' duos');
  console.log('\n  zone    real   engine   gap');
  let worst = 0, sum = 0;
  real.forEach((r, i) => {
    const e = eng.curve[i];
    if(e == null) return;
    const gap = Math.abs(e - r);
    worst = Math.max(worst, gap); sum += gap;
    console.log('   ' + String(i+1).padStart(2) + '     ' + (100*r).toFixed(0).padStart(3) + '%    ' +
      (100*e).toFixed(0).padStart(3) + '%   ' + (100*gap).toFixed(0).padStart(3) + '   ' +
      bar(r).padEnd(41) + '| ' + bar(e));
  });
  console.log('\n  mean gap ' + (100*sum/real.length).toFixed(1) + ' points, worst ' + (100*worst).toFixed(1));
  console.log('  deaths by storm ' + (100*eng.storm).toFixed(1) + '%, by surge ' + (100*eng.surge).toFixed(1) + '%');
  console.log('');
}

function zones(){
  console.log('\n  the storm the three matches agree on, and what the engine carries\n');
  console.log('  zone   logged r   world    engine r    phase   engine    drift, each match      engine');
  for(let i=0;i<NZ;i++){
    const r = MATCHES.map(m => m.zones[i].radius);
    const gaps = MATCHES.map(m => m.zones[i].t - (i ? m.zones[i-1].t : 0));
    const drift = i === 0 ? null : MATCHES.map(m =>
      Math.hypot(m.zones[i].cx - m.zones[i-1].cx, m.zones[i].cy - m.zones[i-1].cy) / UNIT);
    const ph = Z.PHASES[i];
    const same = a => a.every(v => Math.abs(v - a[0]) < 0.02) ? '' : ' *';
    console.log('   ' + String(i+1).padStart(2) + '   ' + String(r[0]).padStart(8) + '  ' +
      (r[0]/UNIT).toFixed(2).padStart(6) + '     ' + String(ph ? ph.radius : '-').padStart(6) + '   ' +
      (gaps.reduce((a,b)=>a+b,0)/gaps.length).toFixed(0).padStart(5) + 's   ' +
      String(ph ? ph.waitSec + ph.shrinkSec : '-').padStart(4) + 's   ' +
      (drift ? drift.map(d => d.toFixed(2).padStart(7)).join('') + same(drift) : '        —').padEnd(24) +
      (drift ? String(Z.DRIFT && Z.DRIFT[i] != null ? Z.DRIFT[i] : 'drawn') : ''));
  }
  console.log('\n  * means the three matches disagree. They disagree about zones 2 to 4 and');
  console.log('    about nothing else: every radius, every phase length and every drift from');
  console.log('    zone 5 down is identical in all three. The storm is on rails; only the');
  console.log('    direction it takes is drawn.\n');

  const kd = [];
  MATCHES.forEach(m => m.eliminations.forEach(e => {
    if(e.self || e.ix == null) return;
    kd.push(Math.hypot(e.vx - e.ix, e.vy - e.iy) / UNIT);
  }));
  kd.sort((a,b) => a-b);
  const q = p => kd[Math.floor(p*(kd.length-1))];
  console.log('  kill distance, ' + kd.length + ' of them: p50 ' + q(0.5).toFixed(2) +
    ', p90 ' + q(0.9).toFixed(2) + ' world units, against CONTACT_RANGE ' + Z.CONTACT_RANGE);

  const teams = [].concat(...MATCHES.map(m => m.teams));
  const med = a => { const s = a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  console.log('  ground pace: median ' + (med(teams.map(t => t.travel/t.timeAlive))/UNIT).toFixed(2) +
    ' world units a second, against SPEED ' + Z.SPEED);
  console.log('  damage taken: median ' + med(teams.map(t => t.taken)) + ' against 200 health in a duo, ' +
    'healed ' + med(teams.map(t => t.heals)) + ' times');
  console.log('  landing: ' + MATCHES.reduce((s, m) =>
    s + m.teams.filter(t => t.timeAlive <= m.zones[0].t - m.landingOffset).length, 0) +
    ' of ' + teams.length + ' duos are already out when the first circle closes');
  console.log('');
}

const argv = process.argv;
if(argv.indexOf('--zones') !== -1){ zones(); }
else if(argv.indexOf('--fit') !== -1){
  const rates = argv[argv.indexOf('--fit')+1].split(',').map(Number);
  const runs = Number(argv[argv.indexOf('--fit')+2]) || 30;
  const real = realCurve();
  console.log('\n  engagement rate against the real curve (' + runs + ' games each)\n');
  console.log('  rate    ' + real.map((r, i) => String(i+1).padStart(4)).join('') + '    mean gap');
  console.log('  real    ' + real.map(r => (100*r).toFixed(0).padStart(4)).join(''));
  rates.forEach(rate => {
    Z.tune({ENGAGE_CHANCE: rate});
    const e = engineCurve(runs);
    let sum = 0;
    real.forEach((r, i) => { sum += Math.abs(e.curve[i] - r); });
    console.log('  ' + String(rate).padEnd(6) + '  ' + e.curve.map(v => (100*v).toFixed(0).padStart(4)).join('') +
      '    ' + (100*sum/real.length).toFixed(1));
  });
  console.log('');
} else {
  report(Number(argv[2]) || 60);
}
