// Turns the Reload Elite Series leaderboards into rows for index.html.
//
// The circuit ran in seven regions and no single source has all of it, so this
// reads three and prefers them in this order for any one stage:
//
//   1. Epic's own payload, harvested by tools/fetch-ewc.js into ~/Desktop/ewc/api.
//      Complete — every match of every team, the elimination points as a column
//      rather than an inference, and the countries the entry carries. It holds
//      cup 4 in six regions and the European windows of cup 4 in full.
//   2. ~/Desktop/ewc/regions-raw.json — the same payload shape for cups 1-3
//      outside Europe, read out of Tracker in a browser tab, because Epic has
//      dropped those windows and Tracker refuses a server-side fetch.
//   3. The saved Tracker pages in ~/Desktop/ewc/1..3 — Tracker's rendered top
//      100, and what Europe's older cups otherwise have.
//
// Where a stage exists in more than one source the payload wins, and the two
// readings are reconciled first: a disagreement means the HTML parse is wrong
// and everything built on it is suspect.
//
//   node tools/build-ewc-rows.js                      # measure, reconcile, write nothing
//   node tools/build-ewc-rows.js tools/ewc-rows.generated.js
//
// Row shape, the 2025 sets' minus the third seat:
//   [rank, points, matches, wins, avgElims, avgPlace, elimPoints, p1, p2]
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = process.env.EWC_SRC || path.join(HOME, 'Desktop', 'ewc');
const API = path.join(SRC, 'api');
const OUT = process.argv[2] || null;

const ORDER = ['open', 'playin', 'heat1', 'heat2', 'heat3', 'heat4', 'final'];
const REGIONS = ['EU', 'NAC', 'NAW', 'BR', 'OCE', 'ASIA', 'ME'];
const round2 = v => Math.round(v * 100) / 100;
// Attachment A: two a kill in the Opens and the Play-Ins, three in the Heats
// and the Final.
const killAt = stage => (stage === 'open' || stage === 'playin') ? 2 : 3;

const cups = {};
const slot = (set, reg) => {
  const c = cups[set] || (cups[set] = {});
  return c[reg] || (c[reg] = {stages: {}, dates: {}, from: {}});
};

function stageOfWindow(id){
  const m = /ReloadEliteSeries(\d)(Open|PlayIn|Heat|Final)/.exec(id);
  if (!m) return null;
  const reg = (id.split('_').pop() || 'EU').replace('.json', '');
  const cup = 'r' + m[1];
  if (m[2] === 'Open') return {cup, reg, stage: 'open'};
  if (m[2] === 'PlayIn') return {cup, reg, stage: 'playin'};
  if (m[2] === 'Final') return {cup, reg, stage: 'final'};
  const h = /Heat(\d)/.exec(id);
  return {cup, reg, stage: 'heat' + (h ? h[1] : '1')};
}

function rowOfEntry(e){
  const s = e.sessionHistory || [];
  const stat = (x, k) => (x.trackedStats || {})[k] || 0;
  const matches = s.length || 1;
  const elims = s.reduce((n, x) => n + stat(x, 'TEAM_ELIMS_STAT_INDEX'), 0);
  const places = s.reduce((n, x) => n + stat(x, 'PLACEMENT_STAT_INDEX'), 0);
  // Epic carries two name fields and either seat can be blank in one of them,
  // so they are read per seat rather than one list or the other. A seat blank
  // in both is an account with no display name at all, and the row is dropped
  // below rather than carrying an empty half of a duo.
  const custom = e.customNames || [], display = e.teamAccountDisplayNames || [];
  // An account with no display name comes back as its own id — thirty-two hex
  // characters — which is not a handle and must not become a card.
  const real = v => { const t = String(v || '').trim(); return /^[0-9a-f]{30,}$/i.test(t) ? '' : t; };
  const names = (e.teamAccountIds || custom).map((_, i) => real(custom[i]) || real(display[i]) || '');
  return {rank: e.rank, points: e.pointsEarned, matches: s.length,
          wins: s.filter(x => stat(x, 'PLACEMENT_STAT_INDEX') === 1).length,
          avgElims: round2(elims / matches), avgPlace: round2(places / matches),
          elimPts: ((e.pointBreakdown || {})['TEAM_ELIMS_STAT_INDEX:1'] || {}).pointsEarned || 0,
          _elims: elims, _places: places,
          players: names.map((n, i) => ({handle: String(n).trim(),
                                         nat: (e.customCountries || [])[i] || null, org: null}))};
}

// A two-day stage arrives as two windows and the circuit adds the days up, the
// way FNCS scores a Play-In. Averages are recomputed off the totals rather than
// averaged with each other, so a three-game day cannot weigh like a long one.
function merge(prev, rows){
  const both = new Map();
  [...prev, ...rows].forEach(r => {
    const k = r.players.map(p => p.handle.toLowerCase()).sort().join('|');
    const had = both.get(k);
    if (!had){ both.set(k, Object.assign({}, r)); return; }
    had.points += r.points; had.matches += r.matches; had.wins += r.wins;
    had.elimPts += r.elimPts; had._elims += r._elims; had._places += r._places;
    had.players = had.players.map((p, i) => p.nat ? p : (r.players[i] || p));
  });
  return [...both.values()]
    .map(r => Object.assign(r, {avgElims: round2(r._elims / Math.max(r.matches, 1)),
                                avgPlace: round2(r._places / Math.max(r.matches, 1))}))
    .sort((a, b) => b.points - a.points || a.avgPlace - b.avgPlace)
    .map((r, i) => Object.assign(r, {rank: i + 1}));
}

function readApi(){
  if (!fs.existsSync(API)) return;
  for (const f of fs.readdirSync(API).filter(f => f.endsWith('.json'))){
    const where = stageOfWindow(f);
    if (!where) continue;
    const j = JSON.parse(fs.readFileSync(path.join(API, f), 'utf8'));
    // Epic keeps an old window's ranking long after it drops the match log
    // behind it: those rows come back with no sessions and no points, and a row
    // with no match in it is not a result.
    const entries = ((j.leaderboard || {}).entries || []).filter(e => (e.sessionHistory || []).length > 0);
    if (!entries.length) continue;
    const cup = slot(where.cup, where.reg);
    const all = entries.map(rowOfEntry);
    // A duo with a nameless half is not a duo the mode can deal, and inventing
    // a handle for the missing seat would be inventing a player.
    const rows = all.filter(r => r.players.length === 2 && r.players.every(p => p.handle))
                    .sort((a, b) => a.rank - b.rank);
    if (rows.length !== all.length)
      console.log('  ' + where.cup + ' ' + where.reg + ' ' + where.stage + ': dropped ' +
                  (all.length - rows.length) + ' row(s) with a seat Epic has no name for');
    cup.stages[where.stage] = cup.stages[where.stage] ? merge(cup.stages[where.stage], rows) : rows;
    cup.dates[where.stage] = (j.window || {}).date || cup.dates[where.stage] || null;
    cup.from[where.stage] = 'epic';
  }
}

// Cups 1-3 outside Europe, read out of Tracker in a browser tab: one line a
// team — rank, points, matches, wins, total elims, total placement, elimination
// points, then the handles.
function readBrowserHarvest(){
  const file = path.join(SRC, 'regions-raw.json');
  if (!fs.existsSync(file)) return;
  const store = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const id of Object.keys(store)){
    const where = stageOfWindow(id);
    if (!where) continue;
    const cup = slot(where.cup, where.reg);
    if (cup.stages[where.stage]) continue;
    const rows = store[id].map(line => {
      const p = String(line).split('~');
      const matches = Math.max(+p[2] || 1, 1);
      return {rank: +p[0], points: +p[1], matches: +p[2], wins: +p[3],
              avgElims: round2((+p[4]) / matches), avgPlace: round2((+p[5]) / matches),
              elimPts: +p[6], _elims: +p[4], _places: +p[5],
              players: p.slice(7).filter(Boolean).map(h => ({handle: h.trim(), nat: null, org: null}))};
    }).filter(r => r.players.length === 2);
    if (rows.length){
      cup.stages[where.stage] = rows;
      cup.from[where.stage] = 'tracker payload';
    }
  }
}

function stageOfFile(file){
  const n = file.replace(/ - Competitive Events.*$/, '');
  if (/Play-Ins/i.test(n)) return 'playin';
  if (/Opens/i.test(n)) return 'open';
  if (/Finals/i.test(n)) return 'final';
  if (/Heat/i.test(n)){ const h = /Heats?\s*(\d)/i.exec(n); return 'heat' + (h ? h[1] : '1'); }
  return null;
}

// Tracker takes the club off the player's own tag, so one org can arrive in two
// spellings. Zabo, Mxxi and 1P Jakobreyli wrote "Avora Gaming" while Shxrk and
// t3eny wrote "Aurora Gaming" in the same leaderboard — that shipped as two
// clubs, one of them without a crest, since only Aurora_Gaming.png is on disk.
const ORG_FIX = {'Avora Gaming': 'Aurora Gaming'};

const text = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
                   .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const num = s => {
  const v = parseFloat(String(s).replace(/,/g, '').replace(/[^\d.\-]/g, ''));
  return isNaN(v) ? null : v;
};

function parsePage(html, stage){
  const rows = html.match(/<tr[^>]*trn-lb-entry[\s\S]*?<\/tr>/g) || [];
  const out = [];
  for (const tr of rows){
    const stats = (tr.match(/<td[^>]*trn-lb-entry__stat[^>]*>([\s\S]*?)<\/td>/g) || []).map(c => text(c));
    const rank = num(text((/<td[^>]*trn-lb-entry__rank[\s\S]*?<\/td>/.exec(tr) || [''])[0]));
    const grab = cls => (tr.match(new RegExp(cls + '">([^<]*)<', 'g')) || [])
                          .map(m => text(m.slice(cls.length + 2, -1)));
    const names = grab('player-name'), orgs = grab('player-team');
    const nats = (tr.match(/<img[^>]*alt="([A-Z]{2})"/g) || []).map(m => (/alt="([A-Z]{2})"/.exec(m) || [])[1]);
    if (rank == null || !names.length) continue;
    const matches = num(stats[1]) || 1;
    out.push({rank, points: num(stats[0]), matches: num(stats[1]), wins: num(stats[2]),
              avgElims: num(stats[3]), avgPlace: num(stats[4]),
              elimPts: Math.round((num(stats[3]) || 0) * matches * killAt(stage)),
              players: names.map((n, i) => ({handle: n, org: ORG_FIX[orgs[i]] || orgs[i] || null,
                                            nat: nats[i] || null}))});
  }
  return out;
}

function readSavedPages(){
  const trn = {};
  for (const dir of fs.readdirSync(SRC).filter(d => /^\d$/.test(d))){
    const full = path.join(SRC, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full).filter(f => f.toLowerCase().endsWith('.html'))){
      const stage = stageOfFile(f);
      if (!stage) continue;
      (trn['r' + dir] = trn['r' + dir] || {})[stage] = parsePage(fs.readFileSync(path.join(full, f), 'utf8'), stage);
    }
  }
  return trn;
}

readApi();
readBrowserHarvest();
const saved = readSavedPages();          // Europe only: that is what was saved

let mismatches = 0;
for (const cup of Object.keys(saved)){
  for (const stage of ORDER){
    const a = ((cups[cup] || {}).EU || {stages: {}}).stages[stage], t = saved[cup][stage];
    if (!a || !t) continue;
    const key = r => r.players.map(p => p.handle.toLowerCase()).sort().join('|');
    const byKey = new Map(t.map(r => [key(r), r]));
    let checked = 0, off = 0;
    for (const r of a){
      const m = byKey.get(key(r));
      if (!m) continue;
      checked++;
      if (m.rank !== r.rank || m.points !== r.points || m.matches !== r.matches || m.wins !== r.wins) off++;
    }
    mismatches += off;
    if (checked) console.log('  ' + cup + ' EU ' + stage + ': both sources, ' + checked + ' rows matched, ' + off + ' disagree');
  }
}
console.log(mismatches ? mismatches + ' rows disagree — the HTML parse is suspect\n'
                       : 'the readings agree everywhere they overlap\n');

for (const cup of Object.keys(saved)){
  const eu = slot(cup, 'EU');
  for (const stage of ORDER){
    if (!eu.stages[stage] && saved[cup][stage] && saved[cup][stage].length){
      eu.stages[stage] = saved[cup][stage];
      eu.from[stage] = 'saved page';
    }
  }
}

// The wide stages are cut to a hundred, which is the shape Tracker gives and
// keeps one cup from being a different size from the rest.
const WIDE_KEEP = 100;
for (const set of Object.keys(cups))
  for (const reg of Object.keys(cups[set]))
    for (const stage of ['open', 'playin']){
      const rows = cups[set][reg].stages[stage];
      if (!rows || rows.length <= WIDE_KEEP) continue;
      console.log(set + ' ' + reg + ' ' + stage + ': keeping the top ' + WIDE_KEEP + ' of ' + rows.length);
      cups[set][reg].stages[stage] = rows.slice(0, WIDE_KEEP);
    }

// Epic spells a handle the way the player typed it, in capitals; Tracker prints
// what the scene uses. One spelling wins, and it is not the shout.
const spelling = new Map();
const eachRow = fn => Object.keys(cups).forEach(set => Object.keys(cups[set]).forEach(reg =>
  Object.keys(cups[set][reg].stages).forEach(st => cups[set][reg].stages[st].forEach(fn))));
eachRow(r => r.players.forEach(p => {
  const k = p.handle.toLowerCase();
  const seen = spelling.get(k) || {};
  seen[p.handle] = (seen[p.handle] || 0) + 1;
  spelling.set(k, seen);
}));
const canonical = new Map();
spelling.forEach((seen, k) => {
  const forms = Object.keys(seen);
  const mixed = forms.filter(f => f !== f.toUpperCase() || !/[A-Z]/.test(f));
  canonical.set(k, (mixed.length ? mixed : forms).sort((a, b) => seen[b] - seen[a] || a.localeCompare(b))[0]);
});
eachRow(r => r.players.forEach(p => { p.handle = canonical.get(p.handle.toLowerCase()) || p.handle; }));
console.log([...spelling.values()].filter(s => Object.keys(s).length > 1).length +
            ' handles were spelled more than one way; each now reads the way the scene spells it\n');

for (const set of Object.keys(cups).sort()){
  const line = [];
  for (const reg of REGIONS){
    const c = cups[set][reg];
    if (!c) continue;
    const stages = ORDER.filter(s => c.stages[s]);
    const rows = stages.reduce((n, s) => n + c.stages[s].length, 0);
    line.push(reg + ' ' + stages.length + '/' + rows);
  }
  console.log(set + '  ' + line.join('   '));
}

if (OUT){
  const rowOf = r => [r.rank, r.points, r.matches, r.wins, r.avgElims, r.avgPlace, r.elimPts,
                      ...r.players.map(p => p.handle)];
  const nats = {}, orgs = {}, dates = {};
  eachRow(r => r.players.forEach(p => {
    if (p.nat) nats[p.handle] = p.nat;
    if (p.org) orgs[p.handle] = p.org;
  }));
  const body = 'const EWC_RAW={\n' + Object.keys(cups).sort().map(set => {
    dates[set] = {};
    const regs = REGIONS.filter(r => cups[set][r]);
    return '  ' + set + ':{\n' + regs.map(reg => {
      Object.keys(cups[set][reg].dates || {}).forEach(k => {
        if (cups[set][reg].dates[k]) dates[set][k] = cups[set][reg].dates[k];
      });
      return '    ' + reg + ':{' + ORDER.filter(s => cups[set][reg].stages[s]).map(s =>
        s + ':' + JSON.stringify(cups[set][reg].stages[s].map(rowOf))).join(',\n      ') + '}';
    }).join(',\n') + '\n  }';
  }).join(',\n') + '\n};\n' +
    'const EWC_DATE=' + JSON.stringify(dates) + ';\n' +
    'const EWC_NAT=' + JSON.stringify(nats) + ';\n' +
    'const EWC_ORG=' + JSON.stringify(orgs) + ';\n';
  fs.writeFileSync(OUT, '// Generated by tools/build-ewc-rows.js — do not edit by hand.\n' + body);
  console.log('\nwrote ' + OUT + ' (' + Object.keys(nats).length + ' handles with a flag, ' +
              Object.keys(orgs).length + ' with an org)');
}
