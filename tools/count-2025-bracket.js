// Counts what each leg of a 2025 Major actually sent to its Grand Final, so the
// simulated bracket is read off the results rather than off the bracket graphic.
//
//   node tools/count-2025-bracket.js t2
//
// The rule, unchanged from the Major 1 work: a finalist came through Last Chance
// if and only if it appears in that region's Last Chance Lobby carrying the
// advancement flag. Everything else came out of a group.
//
// The flag is not inferred. A Lobby leaderboard scores exactly 1000 for a team
// that advanced and exactly 0 for one that did not -- placement and Victory
// Royale are worth nothing there, so the total IS the flag.
//
// Roster matching is deliberately not used to settle the leg. Teams change a
// player between stages, so exact matching loses real qualifiers, and loosening
// to "any two of three" credits teams that scored nothing in the Lobby. It is
// reported below only as a cross-check on the flag, never as the source.
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = path.join(HOME, 'Desktop', '2025');
const SET = process.argv[2] || 't2';
const SEASON = {t1: 'S33', t2: 'S34', t3: 'S36'}[SET];
if (!SEASON) throw new Error('unknown set: ' + SET);
const REG = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];

const read = f => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
const A = read('fncs-2025-major2-major3.json');
const B = read('fncs-2025-major2-major3-stages.json').stages;

const key = row => row.slice(7).map(s => String(s).toLowerCase()).sort().join('|');
const members = row => new Set(row.slice(7).map(s => String(s).toLowerCase()));

let bad = 0;
const table = {};

for (const reg of REG) {
  const gf = A[SEASON + '_' + reg + '_gf'];
  const lobby = B[SEASON + '_' + reg + '_lobby'];
  const groups = ['g1', 'g2', 'g3'].map(g => B[SEASON + '_' + reg + '_' + g]).filter(Boolean);
  if (!gf || !lobby || !groups.length) {
    console.log(reg + ': MISSING SOURCE — gf ' + !!gf + ', lobby ' + !!lobby + ', groups ' + groups.length);
    bad++;
    continue;
  }

  const advanced = lobby.rows.filter(r => r[1] === 1000);
  const advancedKeys = new Set(advanced.map(key));

  // Cross-check only: how many finalists the flag's rosters actually match.
  const gfKeys = gf.rows.map(key);
  const exact = gfKeys.filter(k => advancedKeys.has(k)).length;
  let loose = 0;
  for (const row of gf.rows) {
    const m = members(row);
    if (advanced.some(a => [...members(a)].filter(n => m.has(n)).length >= 2)) loose++;
  }

  const field = gf.rows.length;
  const fromGroups = field - advanced.length;
  const perGroup = fromGroups / groups.length;
  const gamesPerGroup = groups.map(g => Math.max(...g.rows.map(r => r[2])));

  table[reg] = {
    groups: groups.length,
    groupSizes: groups.map(g => g.rows.length),
    games: gamesPerGroup,
    fromGroups: fromGroups,
    perGroup: perGroup,
    lcqWinners: advanced.length,
    field: field,
    matchedExact: exact,
    matchedLoose: loose
  };

  const flag = Number.isInteger(perGroup) ? '' : '   <-- does not divide evenly';
  if (flag) bad++;
  console.log(reg.padEnd(5) +
    ' groups ' + groups.length + ' [' + groups.map(g => g.rows.length).join(',') + ']' +
    ' games [' + gamesPerGroup.join(',') + ']' +
    '  from groups ' + String(fromGroups).padStart(2) + ' (' + perGroup + ' each)' +
    '  last chance ' + advanced.length +
    '  final ' + field +
    '   flag-roster match ' + exact + ' exact / ' + loose + ' loose' + flag);
}

console.log('\nlcqWinners for majorFormat: ' +
  JSON.stringify(Object.fromEntries(REG.map(r => [r, table[r] ? table[r].lcqWinners : null]))));
console.log('groups per region:          ' +
  JSON.stringify(Object.fromEntries(REG.map(r => [r, table[r] ? table[r].groups : null]))));
console.log('cut per group:              ' +
  JSON.stringify(Object.fromEntries(REG.map(r => [r, table[r] ? table[r].perGroup : null]))));
console.log('games per group:            ' +
  JSON.stringify(Object.fromEntries(REG.map(r => [r, table[r] ? table[r].games.join('/') : null]))));

process.exit(bad ? 1 : 0);
