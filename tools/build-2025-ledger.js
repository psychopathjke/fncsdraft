// Builds an FNCS 2025 season ledger: for every region, a list of sources of the
// form {label, map: handle -> finishing rank, field: how many teams were in it}.
//
// The 2026 sets get their final rating from a ledger like this rather than from
// the band a single stage puts them in -- results across the season are averaged
// with weights and then stretched so the region's best lands on its ceiling.
// Without one, the 2025 cards keep their raw bands, which leaves the pool hollow
// between 70 and 89 and the AI field with a median of 68 against the player's 91.
//
// The season is an argument, the same way it is for build-2025-rows.js:
//
//   node tools/build-2025-ledger.js t1 tools/2025-ledger.generated.js
//   node tools/build-2025-ledger.js t2 tools/2025-ledger-t2.generated.js
//   node tools/build-2025-ledger.js t3 tools/2025-ledger-t3.generated.js
//
// Sources are the Major's own stages for all seven regions, plus the Division 1
// week finals for Europe -- the only divisional cups these seasons expose on
// Tracker, since Divisions 3 to 5 return 404 under every spelling.
//
// The number of cup weeks is not levelled across the Majors. Major 1 and Major 2
// ran five, Major 3 ran two, and a shorter ledger there is the season being
// reported rather than a hole in the harvest.
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = path.join(HOME, 'Desktop', '2025');
const SET = process.argv[2] || 't1';
const OUT = process.argv[3] || path.join(__dirname, '2025-ledger.generated.js');
const REG = ['EU','NAC','NAW','BR','ASIA','ME','OCE'];

const read = f => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

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

// Major 1 reads its groups from one file and its cups off saved HTML pages;
// Majors 2 and 3 read both out of the browser harvest. The shapes below hide
// that difference from the builder underneath.
const SEASONS = {
  t1: {
    constName: 'S33_LEDGER',
    stages(){
      const A = read('fncs-2025-major1.json');
      const B = read('fncs-2025-major1-stages.json').stages;
      return reg => ({
        playin: A[reg + '_playin'] && A[reg + '_playin'].rows,
        lcq:    B[reg + '_lcq']    && B[reg + '_lcq'].rows,
        groups: ['g1','g2','g3'].map(g => B[reg + '_' + g] && B[reg + '_' + g].rows),
        gf:     A[reg + '_gf']     && A[reg + '_gf'].rows
      });
    },
    cups(){
      // Saved to disk rather than fetched: these are the pages already in the
      // source folder when this season was built.
      const out = [];
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
        out.push({week: wk, rows: rows});
      }
      return out;
    }
  }
};

for (const [set, season] of [['t2','S34'], ['t3','S36']]){
  SEASONS[set] = {
    constName: season + '_LEDGER',
    stages(){
      const A = read('fncs-2025-major2-major3.json');
      const B = read('fncs-2025-major2-major3-stages.json').stages;
      const rows = k => B[k] && B[k].rows;
      return reg => ({
        playin: A[season + '_' + reg + '_playin'] && A[season + '_' + reg + '_playin'].rows,
        lcq:    A[season + '_' + reg + '_lcq']    && A[season + '_' + reg + '_lcq'].rows,
        groups: ['g1','g2','g3'].map(g => rows(season + '_' + reg + '_' + g)),
        gf:     A[season + '_' + reg + '_gf']     && A[season + '_' + reg + '_gf'].rows
      });
    },
    cups(){
      const B = read('fncs-2025-major2-major3-stages.json').stages;
      return Object.keys(B)
        .filter(k => k.startsWith(season + '_cup_w'))
        .map(k => ({week: +k.replace(season + '_cup_w', ''), rows: B[k].rows}))
        .sort((a, b) => a.week - b.week);
    }
  };
}

const CFG = SEASONS[SET];
if (!CFG) throw new Error('unknown set: ' + SET + ' (expected t1, t2 or t3)');

// The Global Championship, on all three Majors. It is the last thing the 2025
// season played and the strongest field it ever put in one lobby, and every one
// of its thirty-three trios earned the seat at a Major -- eight at Major 1,
// thirteen at Major 2, twelve at Major 3. A card from any of them is a card of
// somebody who went to Lyon, so it counts on all three.
//
// The standings are not copied here. GC2025_RANKED already carries all 33
// placements in index.html; a second copy is a second thing to drift, so it is
// read out of the page at build time.
function globalChampionship(){
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const at = html.indexOf('const GC2025_RANKED=[');
  if (at < 0) return null;
  const end = html.indexOf('\n];', at);
  const body = html.slice(at, end);
  const map = {};
  let n = 0;
  for (const m of body.matchAll(/\{trio:'([^']+)',\s*rank:(\d+)\}/g)){
    const rank = +m[2];
    m[1].split('&').forEach(h => { map[h.trim().toLowerCase()] = rank; });
    n++;
  }
  return n ? { label: 'Global Championship', field: 33, map: map, teams: n } : null;
}
const GC = globalChampionship();

const stagesFor = CFG.stages();
const out = {};
for (const reg of REG){
  const s = stagesFor(reg);
  const list = [];
  const add = (label, rows) => {
    if (!rows || !rows.length) return;
    list.push({ label, field: rows.length, map: mapOf(rows) });
  };
  add('Play-In', s.playin);
  add('Last Chance Qualifier', s.lcq);
  s.groups.forEach((rows, i) => add('Group ' + (i + 1), rows));
  add('Grand Finals', s.gf);
  // The LAN is one global lobby, but a ledger is per region and the stretch that
  // reads it works on the players inside one. So each region gets the LAN entries
  // of its own players and nobody else's -- otherwise Europe's table would
  // suddenly contain seventy players who never competed in Europe, and the
  // stretch would rescale the region against them.
  if (GC){
    // Liquipedia writes a clean nickname; Tracker's is the in-game name, which
    // often carries a tag or a trailing space. The two are matched with
    // everything but letters and digits stripped -- but the entry is written
    // under Tracker's spelling, because that is the key the card is looked up
    // by. Normalising the key itself would break every handle that has a space
    // in it, which is most of them.
    const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
    const known = new Map();
    list.forEach(src => Object.keys(src.map).forEach(h => {
      const k = norm(h);
      if (k && !known.has(k)) known.set(k, h);
    }));
    const mine = {};
    Object.keys(GC.map).forEach(h => {
      const key = known.get(norm(h));
      if (key !== undefined) mine[key] = GC.map[h];
    });
    if (Object.keys(mine).length) list.push({ label: GC.label, field: GC.field, map: mine });
  }
  out[reg] = list;
}

let cups = 0;
for (const cup of CFG.cups()){
  out.EU.push({ label: 'Division 1 Cup, week ' + cup.week, field: cup.rows.length, map: mapOf(cup.rows) });
  cups++;
}

const q = s => JSON.stringify(String(s));
const body = REG.map(reg =>
  '  ' + reg + ':[\n' + out[reg].map(s =>
    '    {label:' + q(s.label) + ',field:' + s.field + ',map:{' +
    Object.keys(s.map).map(h => q(h) + ':' + s.map[h]).join(',') + '}}'
  ).join(',\n') + '\n  ]').join(',\n');

fs.writeFileSync(OUT, 'const ' + CFG.constName + '={\n' + body + '\n};\n');

console.log('set: ' + SET + ' -> ' + CFG.constName +
            ', regions: ' + REG.length + ', Division 1 cup finals folded in: ' + cups);
REG.forEach(reg => {
  const names = new Set();
  out[reg].forEach(s => Object.keys(s.map).forEach(h => names.add(h)));
  console.log('  ' + reg.padEnd(5) + ' sources ' + String(out[reg].length).padStart(2) +
              '  players ' + String(names.size).padStart(4) +
              '   [' + out[reg].map(s => s.label.replace('Division 1 Cup, week ', 'cup')).join(', ') + ']');
});
