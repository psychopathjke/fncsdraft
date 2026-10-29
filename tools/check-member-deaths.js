// Игроки отряда умирают и по одному (zone-sim MEMBER_LOSS). Сверка с реплеями финалов FNCS 2026 EU:
// доля дуо, где игрок умер отдельно от тиммейта (не в пределах 60 с и 40 м), там ≈ 0.25 (74 одиночные смерти
// на 149 дуо, tools/real-matches.json). Проба считает то же по движку и заодно — что неполный отряд не
// перевернул поле: место сильнейших и смертей от шторма.
//
//   node tools/check-member-deaths.js            200 игр
//   node tools/check-member-deaths.js 400 0.3    игр и MEMBER_LOSS
'use strict';

const fs = require('fs'), path = require('path');
const ZoneSim = require('../zone-sim.js');

// Реплеи: одиночные смерти (без пары в пределах 60 с и 4000 игровых единиц) на дуо.
function realShare(){
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-matches.json'), 'utf8'));
  let single = 0, teams = 0;
  for (const m of j.matches) {
    const D = m.eliminations.filter(e => !e.dbno).sort((a, b) => a.t - b.t), used = D.map(() => false);
    for (let i = 0; i < D.length; i++) {
      if (used[i]) continue; used[i] = true; let mate = -1;
      for (let k = i + 1; k < D.length && D[k].t - D[i].t <= 60; k++) {
        if (used[k]) continue;
        const dx = D[k].vx - D[i].vx, dy = D[k].vy - D[i].vy;
        if (dx * dx + dy * dy < 4000 * 4000) { mate = k; break; }
      }
      if (mate >= 0) used[mate] = true; else single++;
    }
    teams += m.teamCount;
  }
  return single / 2 / teams;
}

const src = fs.readFileSync(path.join(__dirname, 'zone-sim-test.js'), 'utf8');
const LAND = eval(src.match(/const LAND = (\[[\s\S]*?\n\];)/)[1].replace(/;$/, ''));
const ASPECT = 970 / 1100;
function field(n){
  const teams = [], c = v => Math.max(5, Math.min(99, v));
  for (let i = 0; i < n; i++) {
    const q = 1 - i / (n - 1), a = 25 + q * 70, tilt = (i % 2 ? 1 : -1) * 12;
    teams.push({name: 'F' + i, pow: 83 + q * 21, squad: [{handle: 'A' + i}, {handle: 'B' + i}], attrs: {
      END: c(a - tilt), SUR: c(a - tilt * 0.6), AIM: c(a + tilt), CLU: c(a + tilt * 0.6)}});
  }
  return teams;
}

const GAMES = Number(process.argv[2]) || 200;
function run(loss){
  if (loss != null) ZoneSim.tune({MEMBER_LOSS: loss});
  let partial = 0, teams = 0, top5 = 0, storm = 0, elims = 0;
  for (let g = 0; g < GAMES; g++) {
    const rng = ZoneSim.createRng(1 + g), T = field(50);
    const picks = T.map(() => LAND[Math.floor(rng() * LAND.length)]);
    const res = ZoneSim.simulateZoneGame(T, {
      rng, land: LAND, aspect: ASPECT, record: true,
      startOf: t => { const p = picks[T.indexOf(t)]; return {x: p.x + p.w / 2, y: p.y + p.h / 2}; },
      duel: (a, b) => { const wa = Math.pow(a.pow, 7), wb = Math.pow(b.pow, 7); return rng() * (wa + wb) < wa ? a : b; }
    });
    // Отдельная смерть игрока — строка ' ##' в ленте; по одной на отряд.
    const hit = new Set();
    res.timeline.forEach(f => (f.events || []).forEach(e => { if (e.indexOf(' ##') >= 0) hit.add(e.slice(e.indexOf(':') + 1).split(' ##')[0]); }));
    partial += hit.size; teams += T.length;
    res.order.forEach((t, i) => { if (+t.name.slice(1) < 5) top5 += i + 1; if (t._deathCause === 'storm') storm++; });
    elims += T.reduce((s, t) => s + (t._gElims || 0), 0);
  }
  return {partial: partial / teams, top5: top5 / GAMES / 5, storm: storm / GAMES, elims: elims / GAMES};
}

const DEF = ZoneSim.tune({}).MEMBER_LOSS;
const real = realShare();
const base = run(0), now = run(process.argv[3] != null ? Number(process.argv[3]) : DEF);
console.log('реплеи: дуо с отдельной смертью ' + real.toFixed(2));
console.log('без потерь:  отдельных ' + base.partial.toFixed(2) + '  место пяти сильнейших ' + base.top5.toFixed(1) +
  '  шторм ' + base.storm.toFixed(2) + '  элимов на лобби ' + base.elims.toFixed(1));
console.log('с потерями:  отдельных ' + now.partial.toFixed(2) + '  место пяти сильнейших ' + now.top5.toFixed(1) +
  '  шторм ' + now.storm.toFixed(2) + '  элимов на лобби ' + now.elims.toFixed(1));
const ok = Math.abs(now.partial - real) <= 0.06;
console.log(ok ? 'доля в пределах ±0.06 от реплеев' : 'FAIL: доля отдельных смертей далеко от реплеев');
process.exit(ok ? 0 : 1);
