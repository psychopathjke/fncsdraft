// Turns the saved Fortnite Tracker pages for the Reload Elite Series into rows.
//
// The FNCS sets came out of Epic's own JSON payload. This circuit has no such
// payload — what exists is the leaderboard Tracker renders, saved as HTML — so
// this reads the rendered table instead. Everything it takes is printed on the
// page: rank, points, matches, wins, average eliminations, average place, the
// cash prize, both players' handles, their orgs and the flags Tracker puts
// beside them.
//
//   node tools/build-ewc-rows.js                      # measure, print, write nothing
//   node tools/build-ewc-rows.js tools/ewc.generated.js
//
// Row shape, the same one the 2025 sets use minus the third seat:
//   [rank, points, matches, wins, avgElims, avgPlace, elimPoints, p1, p2]
// elimPoints is the elimination half of the score, which this circuit pays at
// three a kill — printed on every page under "Each Elimination".
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = process.env.EWC_SRC || path.join(HOME, 'Desktop', 'ewc');
const OUT = process.argv[2] || null;

// Which stage a saved file is, read off its name rather than a list of files,
// so a page saved later under Tracker's own title lands in the right place.
// The circuit spells its heats three ways across the four cups — "Heats 1",
// "Heats2", "3 Heat 4" — which is why this matches a digit near the word.
function stageOf(file){
  const n = file.replace(/ - Competitive Events.*$/, '');
  if (/Play-Ins/i.test(n)) return {stage: 'playin', heat: 0};
  if (/Opens/i.test(n)) return {stage: 'open', heat: 0};
  if (/Finals/i.test(n)) return {stage: 'final', heat: 0};
  const h = /Heats?\s*(\d)/i.exec(n) || /Heat\s*(\d)/i.exec(n);
  if (/Heat/i.test(n)) return {stage: 'heat', heat: h ? parseInt(h[1], 10) : 1};
  return null;
}

const text = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
                   .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const num = s => {
  const v = parseFloat(String(s).replace(/,/g, '').replace(/[^\d.\-]/g, ''));
  return isNaN(v) ? null : v;
};

function parsePage(html){
  const rows = html.match(/<tr[^>]*trn-lb-entry[\s\S]*?<\/tr>/g) || [];
  const out = [];
  for (const tr of rows){
    const cells = tr.match(/<td[^>]*trn-lb-entry__stat[^>]*>([\s\S]*?)<\/td>/g) || [];
    const stats = cells.map(c => text(c));
    const rank = num(text((/<td[^>]*trn-lb-entry__rank[\s\S]*?<\/td>/.exec(tr) || [''])[0]));
    // The handle is what sits between the tag and the next one. Trimmed of the
    // markup's own whitespace, unlike the 2025 sets, where a trailing space is
    // part of the handle Epic stores.
    const grab = (src, cls) => (src.match(new RegExp(cls + '">([^<]*)<', 'g')) || [])
                                 .map(m => text(m.slice(cls.length + 2, -1)));
    const names = grab(tr, 'player-name');
    const orgs = grab(tr, 'player-team');
    const nats = (tr.match(/<img[^>]*alt="([A-Z]{2})"/g) || [])
                   .map(m => (/alt="([A-Z]{2})"/.exec(m) || [])[1]);
    if (rank == null || !names.length) continue;
    out.push({
      rank: rank,
      points: num(stats[0]), matches: num(stats[1]), wins: num(stats[2]),
      avgElims: num(stats[3]), avgPlace: num(stats[4]),
      prize: stats[5] ? num(stats[5]) : 0,
      players: names.map((n, i) => ({handle: n, org: orgs[i] || null, nat: nats[i] || null}))
    });
  }
  return out;
}

// What a page says it pays. Printed on every stage page, and it is not the same
// across the four cups, so it is read rather than assumed.
function scoringOf(html){
  const block = /fne-scores[\s\S]*?<\/section>/.exec(html);
  const src = block ? block[0] : html;
  const out = {};
  const re = /fne-scores__entry">\s*<span>([^<]+)<\/span>\s*<span>\s*\+?\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) out[text(m[1])] = parseFloat(m[2]);
  return out;
}

const cups = fs.readdirSync(SRC).filter(d => /^\d$/.test(d) && fs.statSync(path.join(SRC, d)).isDirectory()).sort();
const data = {};
for (const cup of cups){
  const dir = path.join(SRC, cup);
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.html'));
  if (!files.length){ console.log('cup ' + cup + ': no saved pages'); continue; }
  data[cup] = {stages: {}, scoring: null};
  for (const f of files){
    const where = stageOf(f);
    if (!where){ console.log('cup ' + cup + ': cannot place ' + f); continue; }
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    const key = where.stage === 'heat' ? 'heat' + where.heat : where.stage;
    data[cup].stages[key] = parsePage(html);
    if (where.stage === 'final') data[cup].scoring = scoringOf(html);
  }
}

// ---- what the pages say, before anything is built out of them ----
const ORDER = ['open', 'playin', 'heat1', 'heat2', 'heat3', 'heat4', 'final'];
const key = p => p.handle.toLowerCase();
const duoKey = r => r.players.map(key).sort().join('|');

console.log('Reload Elite Series, as the saved pages have it\n');
for (const cup of Object.keys(data)){
  const st = data[cup].stages;
  console.log('cup ' + cup);
  for (const s of ORDER){
    if (!st[s]) continue;
    const rows = st[s];
    const games = [...new Set(rows.map(r => r.matches))].sort((a, b) => b - a);
    const paid = rows.filter(r => r.prize > 0).length;
    const nat = rows.reduce((n, r) => n + r.players.filter(p => p.nat).length, 0);
    const seats = rows.reduce((n, r) => n + r.players.length, 0);
    console.log('  ' + s.padEnd(7) + String(rows.length).padStart(4) + ' teams' +
                '   games ' + String(games[0]).padStart(2) +
                '   flags ' + String(Math.round(100 * nat / seats)).padStart(3) + '%' +
                (paid ? '   paid ' + paid : ''));
  }
  // How many of one stage's teams turn up in the next: the cut, counted rather
  // than read off a bracket.
  for (let i = 0; i + 1 < ORDER.length; i++){
    const a = st[ORDER[i]], b = st[ORDER[i + 1]];
    if (!a || !b) continue;
    const inB = new Set(b.map(duoKey));
    const survived = a.filter(r => inB.has(duoKey(r)));
    const deepest = survived.length ? Math.max(...survived.map(r => r.rank)) : 0;
    console.log('    ' + ORDER[i] + ' -> ' + ORDER[i + 1] + ': ' + survived.length + ' of ' +
                b.length + ' came through, the deepest seeded ' + deepest);
  }
  if (data[cup].scoring) console.log('    pays ' + JSON.stringify(data[cup].scoring));
  console.log('');
}

if (OUT){
  const rowOf = r => [r.rank, r.points, r.matches, r.wins, r.avgElims, r.avgPlace,
                      Math.round((r.avgElims || 0) * (r.matches || 0) * 3),
                      ...r.players.map(p => p.handle)];
  const nats = {};
  const orgs = {};
  Object.values(data).forEach(c => Object.values(c.stages).forEach(rows => rows.forEach(r =>
    r.players.forEach(p => {
      if (p.nat) nats[p.handle] = p.nat;
      if (p.org) orgs[p.handle] = p.org;
    }))));
  const body = 'const EWC_RAW={\n' + Object.keys(data).map(cup =>
      '  e' + cup + ':{\n' + ORDER.filter(s => data[cup].stages[s]).map(s =>
        '    ' + s + ':' + JSON.stringify(data[cup].stages[s].map(rowOf)) ).join(',\n') +
      '\n  }').join(',\n') + '\n};\n' +
    'const EWC_NAT=' + JSON.stringify(nats) + ';\n' +
    'const EWC_ORG=' + JSON.stringify(orgs) + ';\n';
  fs.writeFileSync(OUT, '// Generated by tools/build-ewc-rows.js — do not edit by hand.\n' + body);
  console.log('wrote ' + OUT + ' (' + Object.keys(nats).length + ' handles with a flag, ' +
              Object.keys(orgs).length + ' with an org)');
}
