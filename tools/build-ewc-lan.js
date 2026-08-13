// Who is at the Reload Elite Series Championship, and how the forty seats fill.
//
// The rules decide it off each cup's Finals leaderboard: Europe sends its top
// three, NA Central two, and Oceania, Asia, the Middle East, Brazil and NA West
// one each — ten a cup, forty in all. A duo cannot hold two seats, so a repeat
// winner's second seat passes down that same leaderboard.
//
// Two sources, both harvested:
//   - Europe and all of cup 4 from Epic's payload / the saved Tracker pages,
//     via tools/ewc-rows.generated.js and ~/Desktop/ewc/api
//   - cups 1-3 outside Europe from Tracker's payload, read in a browser tab and
//     kept in ~/Desktop/ewc/regions-finals.txt
//
//   node tools/build-ewc-lan.js                       # print the field
//   node tools/build-ewc-lan.js tools/ewc-lan.generated.js
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = process.env.EWC_SRC || path.join(HOME, 'Desktop', 'ewc');
const OUT = process.argv[2] || null;

// Attachment: how many seats a region takes from each cup.
const SEATS = {EU: 3, NAC: 2, NAW: 1, BR: 1, OCE: 1, ASIA: 1, ME: 1};
const REGIONS = Object.keys(SEATS);

// ---- Europe, out of the rows the mode already ships ------------------------
const rowsFile = fs.readFileSync(path.join(__dirname, 'ewc-rows.generated.js'), 'utf8');
const { EWC_RAW } = new Function(rowsFile + '; return {EWC_RAW};')();
const finals = {EU: {}};
[1, 2, 3, 4].forEach(cup => {
  const f = (EWC_RAW['r' + cup] || {}).final || [];
  finals.EU[cup] = f.map(r => ({rank: r[0], pts: r[1], matches: r[2], wins: r[3],
                                avgElims: r[4], avgPlace: r[5], duo: r.slice(7)}));
});

// ---- cups 1-3 elsewhere, out of the browser harvest ------------------------
const text = fs.readFileSync(path.join(SRC, 'regions-finals.txt'), 'utf8');
text.split('\n').slice(1).filter(l => l.trim()).forEach(line => {
  const p = line.split('~');
  const cup = +p[0], reg = p[1];
  const rec = {rank: +p[2], pts: +p[3], matches: +p[4], wins: +p[5],
               avgElims: Math.round(+p[6] / Math.max(+p[4], 1) * 100) / 100,
               avgPlace: Math.round(+p[7] / Math.max(+p[4], 1) * 100) / 100,
               duo: [p[9], p[10]].filter(Boolean)};
  ((finals[reg] = finals[reg] || {})[cup] = (finals[reg][cup] || [])).push(rec);
});

// ---- cup 4 elsewhere, out of Epic's payload --------------------------------
const API = path.join(SRC, 'api');
if (fs.existsSync(API)) {
  for (const f of fs.readdirSync(API)) {
    const m = /ReloadEliteSeries4Final_([A-Z]+)\.json$/.exec(f);
    if (!m || m[1] === 'EU') continue;
    const entries = (JSON.parse(fs.readFileSync(path.join(API, f), 'utf8')).leaderboard || {}).entries || [];
    const rows = entries.filter(e => (e.sessionHistory || []).length > 0).map(e => {
      const s = e.sessionHistory;
      const stat = (x, k) => (x.trackedStats || {})[k] || 0;
      return {rank: e.rank, pts: e.pointsEarned, matches: s.length,
              wins: s.filter(x => stat(x, 'PLACEMENT_STAT_INDEX') === 1).length,
              avgElims: Math.round(s.reduce((n, x) => n + stat(x, 'TEAM_ELIMS_STAT_INDEX'), 0) / s.length * 100) / 100,
              avgPlace: Math.round(s.reduce((n, x) => n + stat(x, 'PLACEMENT_STAT_INDEX'), 0) / s.length * 100) / 100,
              duo: (e.customNames && e.customNames.length ? e.customNames : e.teamAccountDisplayNames) || []};
    }).sort((a, b) => a.rank - b.rank);
    if (rows.length) (finals[m[1]] = finals[m[1]] || {})[4] = rows;
  }
}

// ---- the seats ------------------------------------------------------------
const key = duo => duo.map(h => String(h).trim().toLowerCase()).sort().join('|');
const held = new Set();
const field = [];
const shortfall = [];
for (const cup of [1, 2, 3, 4]) {
  for (const reg of REGIONS) {
    const table = (finals[reg] || {})[cup] || [];
    let taken = 0, passed = 0;
    for (const row of table) {
      if (taken >= SEATS[reg]) break;
      if (!row.duo.length) continue;
      // A duo already going to Riyadh cannot take a second seat; it falls to
      // the next team on the same leaderboard.
      if (held.has(key(row.duo))) { passed++; continue; }
      held.add(key(row.duo));
      field.push({cup, region: reg, seat: taken + 1, passedTo: passed, ...row});
      taken++;
    }
    if (taken < SEATS[reg]) shortfall.push('cup ' + cup + ' ' + reg + ': ' + taken + ' of ' + SEATS[reg] +
      (table.length ? ' (leaderboard ran out after ' + table.length + ' rows)' : ' (no leaderboard harvested)'));
  }
}

console.log('The Reload Elite Series Championship — Riyadh, 18-21 August 2026\n');
console.log('cup  region  seat  duo                                    points  wins');
field.forEach(f => console.log('  ' + f.cup + '   ' + f.region.padEnd(6) + '  #' + f.seat + '    ' +
  f.duo.join(' & ').padEnd(38) + String(f.pts).padStart(5) + String(f.wins).padStart(6) +
  (f.passedTo ? '   (passed down ' + f.passedTo + ')' : '')));
console.log('\n' + field.length + ' of 40 seats filled, ' + new Set(field.map(f => f.region)).size + ' regions');
if (shortfall.length) console.log('short:\n  ' + shortfall.join('\n  '));

if (OUT) {
  const body = 'const EWC_LAN=' + JSON.stringify(field.map(f => [f.cup, f.region, f.rank, f.pts,
    f.matches, f.wins, f.avgElims, f.avgPlace].concat(f.duo))) + ';\n';
  fs.writeFileSync(OUT, '// Generated by tools/build-ewc-lan.js — do not edit by hand.\n' +
    '// [cup, region, rank in that final, points, matches, wins, avgElims, avgPlace, ...duo]\n' + body);
  console.log('\nwrote ' + OUT);
}
