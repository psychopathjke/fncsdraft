// Turns the Reload Elite Series leaderboards into rows for index.html.
//
// Two sources, because no single one covers the circuit:
//
//   - Epic's own payload, harvested by tools/fetch-ewc.js into ~/Desktop/ewc/api.
//     Authoritative and complete — every match of every team, the elimination
//     points as a column rather than an inference, and the handles and countries
//     the entry carries. It holds all of cup 4 and the finals of cups 1-3;
//     Epic has dropped every other older window.
//   - The saved Fortnite Tracker pages in ~/Desktop/ewc/1..3, which is Tracker's
//     rendered top 100 and is what the first three cups otherwise have.
//
// Epic wins wherever both have a stage, and the two are reconciled first: the
// three finals exist in both, so the Tracker reader is checked against the
// payload rather than trusted. A disagreement there means the HTML parse is
// wrong, and everything built from it is suspect.
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
const round2 = v => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- Epic payload
// Which stage a window is. Cup 4 played its Opens and Play-Ins over two days
// each, and a stage is the stage: the two windows are merged below, added up
// the way the circuit scores them.
function stageOfWindow(id){
  const m = /ReloadEliteSeries(\d)(Open|PlayIn|Heat|Final)/.exec(id);
  if (!m) return null;
  // The set keys the app uses: r for Reload, one per cup.
  const cup = 'r' + m[1];
  if (m[2] === 'Open') return {cup, stage: 'open'};
  if (m[2] === 'PlayIn') return {cup, stage: 'playin'};
  if (m[2] === 'Final') return {cup, stage: 'final'};
  const h = /Heat(\d)/.exec(id);
  return {cup, stage: 'heat' + (h ? h[1] : '1')};
}

// One entry of Epic's payload as a row. Everything here is counted off the
// entry's own match log rather than read off a rendered table: eight sessions
// is eight matches, a Victory Royale is PLACEMENT_STAT_INDEX 1, and the
// elimination points are the column Epic publishes.
function rowOfEntry(e){
  const s = e.sessionHistory || [];
  const stat = (x, k) => (x.trackedStats || {})[k] || 0;
  const matches = s.length || 1;
  const elims = s.reduce((n, x) => n + stat(x, 'TEAM_ELIMS_STAT_INDEX'), 0);
  const places = s.reduce((n, x) => n + stat(x, 'PLACEMENT_STAT_INDEX'), 0);
  const wins = s.filter(x => stat(x, 'PLACEMENT_STAT_INDEX') === 1).length;
  const elimPts = ((e.pointBreakdown || {})['TEAM_ELIMS_STAT_INDEX:1'] || {}).pointsEarned || 0;
  const names = (e.customNames && e.customNames.length ? e.customNames : e.teamAccountDisplayNames) || [];
  return {rank: e.rank, points: e.pointsEarned, matches: s.length, wins: wins,
          avgElims: round2(elims / matches), avgPlace: round2(places / matches),
          elimPts: elimPts,
          // The totals the averages came from, kept so a stage played over two
          // days can be added up exactly rather than by averaging averages.
          _elims: elims, _places: places,
          players: names.map((n, i) => ({handle: String(n).trim(),
                                         nat: (e.customCountries || [])[i] || null, org: null}))};
}

function readApi(){
  const cups = {};
  if (!fs.existsSync(API)) return cups;
  for (const f of fs.readdirSync(API).filter(f => f.endsWith('.json'))){
    const where = stageOfWindow(f);
    if (!where) continue;
    const j = JSON.parse(fs.readFileSync(path.join(API, f), 'utf8'));
    const entries = ((j.leaderboard || {}).entries || [])
      // Epic keeps the ranking of an old window long after it drops the match
      // log behind it: the three older finals come back as twenty teams with
      // no sessions, no points and no handles. A row with no match in it is
      // not a result, so those stages fall through to the Tracker pages.
      .filter(e => (e.sessionHistory || []).length > 0);
    if (!entries.length) continue;
    const cup = cups[where.cup] || (cups[where.cup] = {stages: {}, dates: {}});
    const rows = entries.map(rowOfEntry).sort((a, b) => a.rank - b.rank);
    // Two-day stages arrive as two windows, and the circuit scores them the way
    // FNCS scores a Play-In: the days add up. So a team's two rows are summed —
    // points, matches, wins, eliminations and the elimination points — and the
    // averages are recomputed off those totals rather than averaged with each
    // other, which would weight a three-game day like a twelve-game one.
    // Measured: summing puts cup 4's Play-In field on 19-24 matches a team,
    // which is what Tracker's own Play-In rows read for the first three cups.
    const prev = cup.stages[where.stage];
    if (prev){
      const both = new Map();
      [...prev, ...rows].forEach(r => {
        const k = r.players.map(p => p.handle.toLowerCase()).sort().join('|');
        const had = both.get(k);
        if (!had){ both.set(k, Object.assign({}, r)); return; }
        had.points += r.points;
        had.matches += r.matches;
        had.wins += r.wins;
        had.elimPts += r.elimPts;
        had._elims += r._elims;
        had._places += r._places;
        // Whichever day carried a nationality keeps it for the pair.
        had.players = had.players.map((p, i) => p.nat ? p : (r.players[i] || p));
      });
      cup.stages[where.stage] = [...both.values()]
        .map(r => Object.assign(r, {avgElims: round2(r._elims / Math.max(r.matches, 1)),
                                    avgPlace: round2(r._places / Math.max(r.matches, 1))}))
        .sort((a, b) => b.points - a.points || a.avgPlace - b.avgPlace)
        .map((r, i) => Object.assign(r, {rank: i + 1}));
    } else {
      cup.stages[where.stage] = rows;
    }
    cup.dates[where.stage] = (j.window || {}).date || cup.dates[where.stage] || null;
  }
  return cups;
}

// ------------------------------------------------------------- Tracker pages
function stageOfFile(file){
  const n = file.replace(/ - Competitive Events.*$/, '');
  if (/Play-Ins/i.test(n)) return 'playin';
  if (/Opens/i.test(n)) return 'open';
  if (/Finals/i.test(n)) return 'final';
  if (/Heat/i.test(n)){ const h = /Heats?\s*(\d)/i.exec(n); return 'heat' + (h ? h[1] : '1'); }
  return null;
}

const text = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
                   .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const num = s => {
  const v = parseFloat(String(s).replace(/,/g, '').replace(/[^\d.\-]/g, ''));
  return isNaN(v) ? null : v;
};

const killAt = stage => (stage === 'open' || stage === 'playin') ? 2 : 3;

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
              // Tracker prints no elimination column, so the published rate turns the
              // average into the same number Epic does. The rate is the stage's, not the
              // circuit's: Attachment A of the official rules pays 2 a kill in the Opens
              // and the Play-Ins and 3 in the Heats and the Final, which is what Epic's
              // own payload for cup 4 measures out to.
              elimPts: Math.round((num(stats[3]) || 0) * matches * killAt(stage)),
              players: names.map((n, i) => ({handle: n, org: orgs[i] || null, nat: nats[i] || null}))});
  }
  return out;
}

function readTracker(){
  const cups = {};
  for (const dir of fs.readdirSync(SRC).filter(d => /^\d$/.test(d))){
    const full = path.join(SRC, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full).filter(f => f.toLowerCase().endsWith('.html'))){
      const stage = stageOfFile(f);
      if (!stage) continue;
      const cup = cups['r' + dir] || (cups['r' + dir] = {stages: {}});
      cup.stages[stage] = parsePage(fs.readFileSync(path.join(full, f), 'utf8'), stage);
    }
  }
  return cups;
}

// -------------------------------------------------------------- reconciliation
const api = readApi(), trn = readTracker();

console.log('Reload Elite Series — Epic where it answers, Tracker where it does not\n');
let mismatches = 0;
for (const cup of Object.keys(trn)){
  for (const stage of ORDER){
    const a = (api[cup] || {stages: {}}).stages[stage], t = trn[cup].stages[stage];
    if (!a || !t) continue;
    const key = r => r.players.map(p => p.handle.toLowerCase()).sort().join('|');
    const byKey = new Map(t.map(r => [key(r), r]));
    let checked = 0, off = [];
    for (const r of a){
      const m = byKey.get(key(r));
      if (!m) continue;
      checked++;
      if (m.rank !== r.rank || m.points !== r.points || m.matches !== r.matches || m.wins !== r.wins)
        off.push(key(r) + ' epic ' + [r.rank, r.points, r.matches, r.wins].join('/') +
                 ' tracker ' + [m.rank, m.points, m.matches, m.wins].join('/'));
    }
    mismatches += off.length;
    console.log('  ' + cup + ' ' + stage.padEnd(6) + ' both sources: ' + checked + ' of ' + a.length +
                ' matched, ' + off.length + ' disagree' + (off.length ? '\n     ' + off.slice(0, 4).join('\n     ') : ''));
  }
}
console.log(mismatches ? '\n' + mismatches + ' rows disagree — the HTML parse is suspect\n'
                       : '\nthe two readings agree everywhere they overlap\n');

// ------------------------------------------------------------------- the build
const cups = {};
for (const cup of new Set([...Object.keys(trn), ...Object.keys(api)])){
  cups[cup] = {stages: {}, dates: (api[cup] || {}).dates || {}};
  for (const stage of ORDER){
    const a = (api[cup] || {stages: {}}).stages[stage];
    const t = (trn[cup] || {stages: {}}).stages[stage];
    const rows = a || t;
    if (rows) cups[cup].stages[stage] = {rows, from: a ? 'epic' : 'tracker'};
  }
}

for (const cup of Object.keys(cups).sort()){
  console.log(cup);
  for (const stage of ORDER){
    const s = cups[cup].stages[stage];
    if (!s) { console.log('  ' + stage.padEnd(7) + '   —'); continue; }
    const games = Math.max(...s.rows.map(r => r.matches || 0));
    const seats = s.rows.reduce((n, r) => n + r.players.length, 0);
    const nat = s.rows.reduce((n, r) => n + r.players.filter(p => p.nat).length, 0);
    console.log('  ' + stage.padEnd(7) + String(s.rows.length).padStart(5) + ' teams   games ' +
                String(games).padStart(2) + '   flags ' + String(Math.round(100 * nat / seats)).padStart(3) +
                '%   from ' + s.from + (cups[cup].dates[stage] ? '   ' + cups[cup].dates[stage] : ''));
  }
}

// Cup 4's Play-Ins come back whole — 1936 duos, where Tracker showed the other
// three cups' hundred. A card set of two thousand qualifier-level players would
// be one cup shaped unlike the rest of the circuit, so the wide stages are cut
// to the same hundred everywhere. The cut is printed rather than silent, and
// the full harvest stays on disk.
const WIDE_KEEP = 100;
for (const cup of Object.keys(cups)){
  for (const stage of ['open', 'playin']){
    const s = cups[cup].stages[stage];
    if (!s || s.rows.length <= WIDE_KEEP) continue;
    console.log('\n' + cup + ' ' + stage + ': keeping the top ' + WIDE_KEEP + ' of ' + s.rows.length +
                ' — the rest stay in the harvest, out of the card set');
    s.rows = s.rows.slice(0, WIDE_KEEP);
  }
}

// Epic's `customNames` are the handles a player typed in capitals — SHXRK,
// T3ENY — while Tracker prints the spelling the scene uses. The same person
// must not be one card in cup 1 and a shoutier one in cup 4, so every handle is
// spelled the way it is most often spelled, and an all-caps spelling only wins
// when it is the only one there is.
const spelling = new Map();
Object.values(cups).forEach(c => Object.values(c.stages).forEach(s => s.rows.forEach(r =>
  r.players.forEach(p => {
    const k = p.handle.toLowerCase();
    const seen = spelling.get(k) || {};
    seen[p.handle] = (seen[p.handle] || 0) + 1;
    spelling.set(k, seen);
  }))));
const canonical = new Map();
spelling.forEach((seen, k) => {
  const forms = Object.keys(seen);
  const mixed = forms.filter(f => f !== f.toUpperCase() || !/[A-Z]/.test(f));
  const pick = (mixed.length ? mixed : forms).sort((a, b) => seen[b] - seen[a] || a.localeCompare(b))[0];
  canonical.set(k, pick);
});
Object.values(cups).forEach(c => Object.values(c.stages).forEach(s => s.rows.forEach(r =>
  r.players.forEach(p => { p.handle = canonical.get(p.handle.toLowerCase()) || p.handle; }))));
const respelt = [...spelling.values()].filter(seen => Object.keys(seen).length > 1).length;
console.log('\n' + respelt + ' handles were spelled more than one way across the circuit; ' +
            'each now reads the way the scene spells it');

if (OUT){
  const rowOf = r => [r.rank, r.points, r.matches, r.wins, r.avgElims, r.avgPlace, r.elimPts,
                      ...r.players.map(p => p.handle)];
  const nats = {}, orgs = {};
  Object.values(cups).forEach(c => Object.values(c.stages).forEach(s => s.rows.forEach(r =>
    r.players.forEach(p => {
      if (p.nat) nats[p.handle] = p.nat;
      if (p.org) orgs[p.handle] = p.org;
    }))));
  const body = 'const EWC_RAW={\n' + Object.keys(cups).sort().map(cup =>
      '  ' + cup + ':{\n' + ORDER.filter(s => cups[cup].stages[s]).map(s =>
        '    ' + s + ':' + JSON.stringify(cups[cup].stages[s].rows.map(rowOf))).join(',\n') +
      '\n  }').join(',\n') + '\n};\n' +
    'const EWC_DATE=' + JSON.stringify(Object.fromEntries(Object.entries(cups).map(([k, c]) => [k, c.dates]))) + ';\n' +
    'const EWC_NAT=' + JSON.stringify(nats) + ';\n' +
    'const EWC_ORG=' + JSON.stringify(orgs) + ';\n';
  fs.writeFileSync(OUT, '// Generated by tools/build-ewc-rows.js — do not edit by hand.\n' + body);
  console.log('\nwrote ' + OUT + ' (' + Object.keys(nats).length + ' handles with a flag, ' +
              Object.keys(orgs).length + ' with an org)');
}
