// The four Division 1 Weekly Finals of 2026, out of the pages Tracker saves.
//
// Every other 2026 set in this app was typed off a Tracker board. These four
// were saved as whole pages instead — divs/ on the desktop — and the board is
// in them twice: once as Epic's own leaderboard payload (ranks, points, the
// per-match session history) and once as an account map keyed by the same
// account ids, carrying each player's esports nickname and country. Joining the
// two is the whole job.
//
//   node tools/build-div-finals.js            > prints the block
//   node tools/build-div-finals.js --write    > writes tools/div-finals.generated.js
//
// The row shape is the one every 2026 set uses, so rowEntry reads it unchanged:
//   [rank, points, matches, wins, avgElims, avgPlace, player1, player2]
const fs = require('fs'), path = require('path');

const DIR = process.env.DIVS_DIR ||
  path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop', 'divs');

// A balanced slice of JSON starting at the first `open` at or after `from`.
// Tracker inlines these blobs into markup, so a regex would stop at the first
// nested brace and a full HTML parse would be a dependency for four files.
function chunk(h, from, open, close){
  const s = h.indexOf(open, from);
  if (s < 0) return null;
  let depth = 0;
  for (let k = s; k < h.length; k++){
    const c = h[k];
    if (c === open) depth++;
    else if (c === close){ depth--; if (!depth) return h.slice(s, k + 1); }
  }
  return null;
}

function readWeek(file){
  const h = fs.readFileSync(file, 'utf8');
  // id -> {name, nat}. The map is emitted per player, keyed by account id.
  const who = new Map();
  const key = /"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})":\s*\{\s*"nickname"/g;
  for (const m of h.matchAll(key)){
    const obj = chunk(h, m.index + m[1].length + 3, '{', '}');
    if (!obj) continue;
    try {
      const o = JSON.parse(obj);
      // The esports nickname is the one the rest of this app keys on: Tracker's
      // plain nickname carries the org tag and the season's decorations, so the
      // same person reads "AG Scroll 10ǃ" here and "Scroll" everywhere else.
      who.set(m[1], {name: o.esportsNickname || o.nickname, nat: o.countryCode || null});
    } catch(e){}
  }
  const raw = chunk(h, h.indexOf('"entries"'), '[', ']');
  if (!raw) throw new Error('no leaderboard in ' + path.basename(file));
  const entries = JSON.parse(raw);
  const window = String(entries[0] && entries[0].eventWindowId || '');
  const week = (window.match(/Week(\d+)Final/) || [])[1];
  if (!week) throw new Error('not a weekly final: ' + window);

  const rows = entries.map(e => {
    const duo = (e.teamAccountIds || []).map(id => who.get(id)).filter(Boolean);
    const st = e.sessionStats || {};
    return {
      row: [e.rank, e.pointsEarned, st.matches, st.wins, st.avgElims, st.avgPlace,
            ...duo.map(d => snap(d.name))],
      nats: duo.map(d => d.nat)
    };
  });
  /* The day it was played, off the payload rather than off a calendar: every
     match carries an endTime, and the earliest of them is the evening. Written
     the way the other 2026 sets write a date, because ccCardDay reads that
     shape and ccCardYear reads it in turn — a card whose date does not parse
     falls out of "this year" and the career would never see it. */
  const days = new Set();
  for (const m of h.matchAll(/"endTime":\s*"(20\d\d-\d\d-\d\d)/g)) days.add(m[1]);
  const day = [...days].sort()[0] || null;
  const MON = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  const date = day
    ? Number(day.slice(8, 10)) + ' ' + MON[Number(day.slice(5, 7)) - 1] + ' ' + day.slice(0, 4)
    : '';
  return {week: Number(week), window, rows, day, date};
}

/* The spelling the app already uses, and why this cannot just be a trim.
 *
 * Tracker hands back esports nicknames with trailing spaces on them — "Mаtez "
 * and "Twek " came through that way. hKey lowercases but does not trim, so the
 * app read those as different people from the "Mаtez" already in the roster:
 * one man in two seats of the same fifty-duo table, which is what
 * check-career-final-table caught.
 *
 * Trimming everything would break the other direction. Some handles in this
 * roster really do end in a space — "3jmy " is one — and trimming would take
 * those off their own cards. So a name is snapped to the spelling index.html
 * already holds when there is one, trimmed only when there is not.
 */
function rosterSpellings(){
  const idx = path.join(__dirname, '..', 'index.html');
  const h = fs.readFileSync(idx, 'utf8');
  const seen = new Map();
  const keep = n => {
    const k = n.trim().toLowerCase();
    if (!k) return;
    // Первое написание выигрывает, и это осознанно: наборы идут в файле в
    // порядке появления, а первым лежит Мейджор — самая полная таблица года.
    if (!seen.has(k)) seen.set(k, n);
  };
  // Имена в сырых строках наборов: [...числа, "игрок1", "игрок2"].
  for (const m of h.matchAll(/,"([^"]{1,24})","([^"]{1,24})"\]/g)){ keep(m[1]); keep(m[2]); }
  for (const m of h.matchAll(/handle:\s*"([^"]{1,24})"/g)) keep(m[1]);
  return seen;
}
const spelling = rosterSpellings();
const snap = n => spelling.get(String(n).trim().toLowerCase()) || String(n).trim();

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
if (!files.length) throw new Error('no saved pages in ' + DIR);
const weeks = files.map(f => readWeek(path.join(DIR, f))).sort((a, b) => a.week - b.week);

// Nothing half-read: a row with a missing name or a missing stat would build a
// card off a hole, and the hole would only show up as a wrong number later.
const bad = [];
weeks.forEach(w => w.rows.forEach((r, i) => {
  const [rank, pts, matches, wins, elims, place, ...names] = r.row;
  if (names.length !== 2) bad.push('week ' + w.week + ' rank ' + rank + ': ' + names.length + ' names');
  [['points', pts], ['matches', matches], ['wins', wins],
   ['avgElims', elims], ['avgPlace', place]].forEach(([k, v]) => {
    if (typeof v !== 'number' || !isFinite(v)) bad.push('week ' + w.week + ' rank ' + rank + ': ' + k);
  });
}));
/* И ни одного имени, которое расходится с роастером только пробелом: после
   snap такого быть не может, но проверка стоит здесь, потому что именно эта
   ошибка уже один раз посадила человека на два места. */
 weeks.forEach(w => w.rows.forEach(r => r.row.slice(6).forEach(n => {
   if (n !== n.trim() && !spelling.has(n.toLowerCase()))
     bad.push('week ' + w.week + ': "' + n + '" has stray whitespace');
 })));
if (bad.length){
  console.error('incomplete rows:\n  ' + bad.slice(0, 8).join('\n  '));
  process.exit(1);
}

const nat = new Map();
weeks.forEach(w => w.rows.forEach(r => {
  const names = r.row.slice(6);
  names.forEach((n, i) => { if (r.nats[i] && !nat.has(n)) nat.set(n, r.nats[i]); });
}));

const num = v => Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
const line = row => '[' + row.slice(0, 6).map(num).join(',') + ',' +
  row.slice(6).map(n => JSON.stringify(n)).join(',') + ']';

let out = '';
out += '// ---------- Card set: FNCS 2026 Division 1 Weekly Finals (Europe) ----------\n';
out += '// Built by tools/build-div-finals.js off the saved Tracker pages. Fifty duos\n';
out += '// a week, four weeks, and every figure is Epic\'s own leaderboard payload.\n';
out += '// [rank, points, matches, wins, avgElims, avgPlace, player1, player2]\n';
weeks.forEach(w => {
  out += 'const CARD_DIV_W' + w.week + '_RAW=[\n' +
         w.rows.map(r => line(r.row)).join(',\n') + '];\n';
});
out += '// countryCode per player, which no other 2026 set carries — Tracker prints it\n';
out += '// beside the account and it is the same two-letter code FLAG_CODE keys on.\n';
out += 'const DIV_DATE=' + JSON.stringify(Object.fromEntries(weeks.map(w => [w.week, w.date]))) + ';\n';
out += 'const DIV_NAT=' + JSON.stringify(Object.fromEntries(nat)) + ';\n';

if (process.argv.includes('--write')){
  const dest = path.join(__dirname, 'div-finals.generated.js');
  fs.writeFileSync(dest, out);
  console.error('wrote ' + dest + ' (' + out.length + ' bytes)');
  weeks.forEach(w => console.error('  week ' + w.week + ': ' + w.rows.length + ' duos, ' +
    'winner ' + w.rows[0].row.slice(6).join(' & ') + ' on ' + w.rows[0].row[1]));
  console.error('  ' + nat.size + ' players with a country');
  weeks.forEach(w => console.error('  week ' + w.week + ' played ' + w.day + ' -> ' + w.date));
} else {
  process.stdout.write(out);
}
