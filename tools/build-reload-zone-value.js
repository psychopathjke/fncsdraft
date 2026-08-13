// What a Reload drop spot is worth, measured off the box the circuit drew.
//
// The Battle Royale islands carry published drop-spot evals and the Chapter 6
// one carries counted wiki loot; nothing of the sort exists for a Reload island.
// What does exist is the drop map itself, and the size of the box a caster drew
// around a POI is a statement about that POI: the big rectangles are the towns
// and the small ones are a fuel stop. So a spot is rated by its own area, which
// is what this game's landing zones were rated on before the evals arrived —
// `LANDING_POINTS_MAX` still turns that rating into 1 to 4 points by percentile,
// so the biggest box on an island is worth four and the smallest one.
//
//   node tools/build-reload-zone-value.js            # print, change nothing
//   node tools/build-reload-zone-value.js --write     # write it into index.html
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', 'index.html');
const WRITE = process.argv.includes('--write');
const SETS = ['r1', 'r2', 'r3', 'r4'];

let s = fs.readFileSync(F, 'utf8').replace(/\r/g, '');

// the grids, straight out of what ships
const zoneStart = s.indexOf('const ZONE_SETS={');
const grids = {};
for (const set of SETS) {
  const at = s.indexOf('\n  ' + set + ':[\n', zoneStart);
  if (at < 0) throw new Error('no grid for ' + set);
  const end = s.indexOf('\n  ]', at);
  grids[set] = s.slice(at, end).split('\n').filter(l => l.trim().startsWith('{x:')).map(l => {
    const o = {};
    l.trim().replace(/[{},]/g, ' ').trim().split(/\s+/).forEach(kv => {
      const [k, v] = kv.split(':'); if (k) o[k] = parseFloat(v);
    });
    return o;
  });
}

// The rating is the area of the box as a share of the map, times a hundred so
// it reads like the other islands' numbers rather than like a decimal.
const stats = {};
for (const set of SETS) stats[set] = grids[set].map(z => ({r: Math.round(z.w * z.h)}));

// What the app will make of it: the same percentile ramp useLandingSet runs.
const MAX = 4;
for (const set of SETS) {
  const rated = stats[set].map(z => z.r).sort((a, b) => a - b);
  const pts = stats[set].map(z => {
    const pct = rated.filter(v => v < z.r).length / rated.length;
    return Math.max(1, Math.min(MAX, 1 + Math.floor(pct * MAX)));
  });
  const spread = {};
  pts.forEach(p => spread[p] = (spread[p] || 0) + 1);
  console.log(set + ': ' + grids[set].length + ' spots, area ' + rated[0] + '-' + rated[rated.length - 1] +
              ', points ' + JSON.stringify(spread));
}

if (WRITE) {
  const block = SETS.map(set =>
    '  ' + set + ':[' + stats[set].map(z => '{r:' + z.r + '}').join(',') + ']').join(',\n');
  const marker = '  // The Reload islands are rated by the size of the box the circuit drew';
  const from = s.indexOf(marker);
  const zoneStatsEnd = s.indexOf('\n};', s.indexOf('const ZONE_STATS={'));
  if (from >= 0) {
    const oldEnd = s.indexOf('\n};', from);
    s = s.slice(0, from) + marker + '\n' +
        '  // around each POI — see tools/build-reload-zone-value.js.\n' + block + s.slice(oldEnd);
  } else {
    s = s.slice(0, zoneStatsEnd) + ',\n' + marker + '\n' +
        '  // around each POI — see tools/build-reload-zone-value.js.\n' + block + s.slice(zoneStatsEnd);
  }
  fs.writeFileSync(F, s.replace(/\n/g, '\r\n'));
  console.log('\nwritten into index.html');
}
