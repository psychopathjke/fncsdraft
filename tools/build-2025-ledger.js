// Builds the FNCS 2025 season ledger: for every region, a list of sources of the
// form {label, map: handle -> finishing rank, field: how many teams were in it}.
//
// The 2026 sets get their final rating from a ledger like this rather than from
// the band a single stage puts them in -- results across the season are averaged
// with weights and then stretched so the region's best lands on its ceiling.
// Without one, the 2025 cards keep their raw bands, which leaves the pool hollow
// between 70 and 89 and the AI field with a median of 68 against the player's 91.
//
// Sources: the Major's own stages for all seven regions, plus the five Division 1
// week finals for Europe, which are the only divisional cups the season exposes
// on Tracker -- Divisions 3 to 5 return 404 under every spelling.
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = path.join(HOME, 'Desktop', '2025');
const OUT = process.argv[2] || path.join(__dirname, '2025-ledger.generated.js');

const A = JSON.parse(fs.readFileSync(path.join(SRC, 'fncs-2025-major1.json'), 'utf8'));
const B = JSON.parse(fs.readFileSync(path.join(SRC, 'fncs-2025-major1-stages.json'), 'utf8')).stages;
const REG = ['EU','NAC','NAW','BR','ASIA','ME','OCE'];

// Saved Tracker pages carry Epic's payload in a `var imp_leaderboard` assignment.
function carve(file){
  const s = fs.readFileSync(file, 'utf8');
  const at = s.indexOf('var imp_leaderboard = ');
  if (at < 0) return null;
  let i = s.indexOf('{', at), d = 0, q = false, e = false, end = -1;
  for (let j = i; j < s.length; j++){
    const c = s[j];
    if (q){ if (e) e = false; else if (c === '\\') e = true; else if (c === '"') q = false; continue; }
    if (c === '"') q = true; else if (c === '{') d++;
    else if (c === '}'){ d--; if (!d){ end = j + 1; break; } }
  }
  return end < 0 ? null : JSON.parse(s.slice(i, end));
}

// handle -> best (lowest) rank in this event
const mapOf = rows => {
  const m = {};
  for (const r of rows){
    for (let i = 7; i < r.length; i++){
      // Lowercased because the lookup that reads this table lowercases the
      // card's handle before asking. Leaving them mixed-case silently matched
      // only the players who already wrote their name in lower case.
      const h = String(r[i]).toLowerCase();
      if (m[h] == null || r[0] < m[h]) m[h] = r[0];
    }
  }
  return m;
};

const out = {};
for (const reg of REG){
  const list = [];
  const add = (label, rows) => {
    if (!rows || !rows.length) return;
    list.push({ label, field: rows.length, map: mapOf(rows) });
  };
  add('Play-In',                A[reg + '_playin'] && A[reg + '_playin'].rows);
  add('Last Chance Qualifier',  B[reg + '_lcq']    && B[reg + '_lcq'].rows);
  ['g1','g2','g3'].forEach((g, i) => add('Group ' + (i + 1), B[reg + '_' + g] && B[reg + '_' + g].rows));
  add('Grand Finals',           A[reg + '_gf']     && A[reg + '_gf'].rows);
  out[reg] = list;
}

// Division 1 week finals, Europe. Saved to disk rather than fetched: these are
// the pages already in the source folder.
let cups = 0;
for (let wk = 1; wk <= 5; wk++){
  const f = path.join(SRC, 'FNCS Division 1 in Europe_ Week ' + wk +
                           ' Finals - Competitive Events - Fortnite Tracker.html');
  if (!fs.existsSync(f)) continue;
  const lb = carve(f);
  if (!lb || !(lb.entries || []).length) continue;
  const acc = lb.internal_Accounts || {};
  const rows = lb.entries.map(e => {
    const names = (e.teamAccountIds || []).map(id => {
      const a = acc[id] || {};
      return a.esportsNickname || a.nickname || id.slice(0, 8);
    });
    return [e.rank, e.pointsEarned, 0, 0, 0, 0, 0].concat(names);
  });
  out.EU.push({ label: 'Division 1 Cup, week ' + wk, field: rows.length, map: mapOf(rows) });
  cups++;
}

const q = s => JSON.stringify(String(s));
const body = REG.map(reg =>
  '  ' + reg + ':[\n' + out[reg].map(s =>
    '    {label:' + q(s.label) + ',field:' + s.field + ',map:{' +
    Object.keys(s.map).map(h => q(h) + ':' + s.map[h]).join(',') + '}}'
  ).join(',\n') + '\n  ]').join(',\n');

fs.writeFileSync(OUT, 'const S33_LEDGER={\n' + body + '\n};\n');

console.log('regions: ' + REG.length + ', Division 1 cup finals folded in: ' + cups);
REG.forEach(reg => {
  const names = new Set();
  out[reg].forEach(s => Object.keys(s.map).forEach(h => names.add(h)));
  console.log('  ' + reg.padEnd(5) + ' sources ' + String(out[reg].length).padStart(2) +
              '  players ' + String(names.size).padStart(4) +
              '   [' + out[reg].map(s => s.label.replace('Division 1 Cup, week ', 'cup')).join(', ') + ']');
});
