// Turns the harvested FNCS 2025 leaderboards into literal rows for index.html.
// Nothing here is hand-typed: every number comes out of Epic's own payload,
// which is what makes another Major a URL change rather than a week of copying.
//
// That promise is now cashed. The season is an argument:
//
//   node tools/build-2025-rows.js t1 tools/2025-rows.generated.js
//   node tools/build-2025-rows.js t2 tools/2025-rows-t2.generated.js
//   node tools/build-2025-rows.js t3 tools/2025-rows-t3.generated.js
//
// Row shape: [rank, points, matches, wins, avgElims, avgPlace, elimPoints, p1, p2, p3]
// elimPoints is the measured elimination half of the score, so the endgame
// share can be read instead of inferred.
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = path.join(HOME, 'Desktop', '2025');
const SET = process.argv[2] || 't1';
const OUT = process.argv[3] || path.join(__dirname, '2025-rows.generated.js');

const read = f => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

// Major 1 keeps its Last Chance Qualifier in a second file, while Majors 2 and 3
// carry all three stages in one, so the picker is a function per season rather
// than a key template.
const SEASONS = {
  t1: {prefix:'T1', season:'S33', load:() => ({
         A: read('fncs-2025-major1.json'),
         B: read('fncs-2025-major1-stages.json').stages}),
       pick:(s, reg, st) => ({P:s.A[reg + '_playin'], L:s.B[reg + '_lcq'], G:s.A[reg + '_gf']})[st]},
  t2: {prefix:'T2', season:'S34', load:() => ({A: read('fncs-2025-major2-major3.json')}),
       pick:(s, reg, st) => s.A['S34_' + reg + '_' + {P:'playin', L:'lcq', G:'gf'}[st]]},
  t3: {prefix:'T3', season:'S36', load:() => ({A: read('fncs-2025-major2-major3.json')}),
       pick:(s, reg, st) => s.A['S36_' + reg + '_' + {P:'playin', L:'lcq', G:'gf'}[st]]}
};
const CFG = SEASONS[SET];
if (!CFG) throw new Error('unknown set: ' + SET + ' (expected t1, t2 or t3)');
const SRCS = CFG.load();
const P = CFG.prefix;

const REG = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const STAGES = [
  ['PLAYIN', r => CFG.pick(SRCS, r, 'P')],
  ['LCQ',    r => CFG.pick(SRCS, r, 'L')],
  ['GF',     r => CFG.pick(SRCS, r, 'G')]
];

// Stage dates come off the window metadata rather than anyone's memory. The two
// hand-typed ones already in index.html disagree with the tile above them, which
// is what this replaces.
const MONTH_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
function stageDates() {
  let meta;
  try { meta = read('fncs-2025-major2-major3-stages.json').meta; }
  catch (e) { return null; }
  const out = {};
  for (const st of ['P', 'L', 'G']) {
    const m = meta[CFG.season + '_' + st];
    if (!m) return null;
    const d = new Date(m.begin);
    out[st] = MONTH_RU[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  return out;
}

// Countries appearing in the 2025 field that no earlier set carried.
const NEW_CC = {
  aq: ['Антарктида', 'Antarctica'],
  ax: ['Аландские острова', 'Åland Islands'],
  bg: ['Болгария', 'Bulgaria'],
  cd: ['ДР Конго', 'DR Congo'],
  dj: ['Джибути', 'Djibouti'],
  je: ['Джерси', 'Jersey'],
  kn: ['Сент-Китс и Невис', 'Saint Kitts and Nevis'],
  ky: ['Каймановы острова', 'Cayman Islands'],
  lu: ['Люксембург', 'Luxembourg'],
  me: ['Черногория', 'Montenegro'],
  mu: ['Маврикий', 'Mauritius'],
  sb: ['Соломоновы Острова', 'Solomon Islands'],
  sk: ['Словакия', 'Slovakia'],
  tg: ['Того', 'Togo'],
  tj: ['Таджикистан', 'Tajikistan'],
  vi: ['Виргинские острова (США)', 'U.S. Virgin Islands'],
  vu: ['Вануату', 'Vanuatu'],
  // Brought in by the Major 2 and Major 3 fields. A code with no name renders a
  // blank flag, so the set that first uses one has to carry it.
  bq: ['Бонэйр, Синт-Эстатиус и Саба', 'Caribbean Netherlands'],
  bw: ['Ботсвана', 'Botswana'],
  et: ['Эфиопия', 'Ethiopia'],
  fo: ['Фарерские острова', 'Faroe Islands'],
  ht: ['Гаити', 'Haiti'],
  mc: ['Монако', 'Monaco'],
  mg: ['Мадагаскар', 'Madagascar'],
  mh: ['Маршалловы Острова', 'Marshall Islands'],
  mp: ['Северные Марианские Острова', 'Northern Mariana Islands'],
  mv: ['Мальдивы', 'Maldives'],
  re: ['Реюньон', 'Réunion'],
  st: ['Сан-Томе и Принсипи', 'São Tomé and Príncipe'],
  sx: ['Синт-Мартен', 'Sint Maarten'],
  va: ['Ватикан', 'Vatican City']
};

const q = s => JSON.stringify(String(s));
const num = n => (Number.isInteger(n) ? String(n) : String(+Number(n).toFixed(2)));

const lines = [];
const nat = {};
const odd = [];
const counts = {};
let total = 0;

for (const reg of REG) {
  for (const [tag, get] of STAGES) {
    const src = get(reg);
    if (!src) throw new Error('missing leaderboard: ' + reg + ' ' + tag);
    Object.assign(nat, src.nat);

    const rows = src.rows.map(r => {
      const names = r.slice(7);
      if (names.length !== 3) odd.push(reg + ' ' + tag + ' rank ' + r[0] + ': ' + names.join(' + '));
      total++;
      return '[' + [num(r[0]), num(r[1]), num(r[2]), num(r[3]), num(r[4]), num(r[5]), num(r[6])]
        .concat(names.map(q)).join(',') + ']';
    });

    counts[tag] = (counts[tag] || 0) + rows.length;
    lines.push('const CARD_' + P + reg + '_' + tag + '_RAW=[\n' + rows.join(',\n') + '\n];');
  }
}

const natPairs = Object.keys(nat).sort().map(n => q(n) + ':' + q(nat[n]));
lines.push('const ' + P + '_NAT={' + natPairs.join(',') + '};');

const used = new Set(Object.values(nat));
const ruPairs = [], enPairs = [], unnamed = [];
for (const code of Object.keys(NEW_CC).sort()) {
  if (!used.has(code)) continue;
  ruPairs.push(q(code) + ':' + q(NEW_CC[code][0]));
  enPairs.push(q(code) + ':' + q(NEW_CC[code][1]));
}
for (const code of used) if (!NEW_CC[code]) unnamed.push(code);

lines.push('const CC_RU_EXTRA_' + P + '={' + ruPairs.join(',') + '};');
lines.push('const CC_EN_EXTRA_' + P + '={' + enPairs.join(',') + '};');

// Emitted last so the rows above stay byte-comparable with the previous run.
const dates = stageDates();
if (dates) lines.push('const ' + P + '_STAGE_DATE=' + JSON.stringify(dates) + ';');

fs.writeFileSync(OUT, lines.join('\n') + '\n');

console.log('set                 : ' + SET + '  (' + CFG.season + ')');
console.log('stage dates         : ' + (dates ? JSON.stringify(dates) : 'NOT AVAILABLE — window metadata missing'));
console.log('rows written        : ' + total + '   (' +
  Object.keys(counts).map(k => k + ' ' + counts[k]).join(', ') + ')');
console.log('players with a nat  : ' + natPairs.length);
console.log('country names added : ' + ruPairs.length);
console.log('codes left to index : ' + unnamed.length + ' (already named in index.html)');
console.log('teams not of size 3 : ' + odd.length);
odd.forEach(s => console.log('  ' + s));
