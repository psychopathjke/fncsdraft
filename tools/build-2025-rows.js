// Turns the harvested FNCS 2025 Major 1 leaderboards into literal rows for
// index.html. Nothing here is hand-typed: every number comes out of Epic's own
// payload, which is what makes a future Major a URL change rather than a week
// of copying.
//
// Row shape: [rank, points, matches, wins, avgElims, avgPlace, elimPoints, p1, p2, p3]
// elimPoints is the measured elimination half of the score, so the endgame
// share can be read instead of inferred.
const fs = require('fs'), path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const SRC = process.argv[2] || path.join(HOME, 'Desktop', '2025');
const OUT = process.argv[3] || path.join(__dirname, '2025-rows.generated.js');

const A = JSON.parse(fs.readFileSync(path.join(SRC, 'fncs-2025-major1.json'), 'utf8'));
const B = JSON.parse(fs.readFileSync(path.join(SRC, 'fncs-2025-major1-stages.json'), 'utf8')).stages;

const REG = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const STAGES = [
  ['PLAYIN', r => A[r + '_playin']],
  ['LCQ',    r => B[r + '_lcq']],
  ['GF',     r => A[r + '_gf']]
];

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
  vu: ['Вануату', 'Vanuatu']
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
    lines.push('const CARD_T1' + reg + '_' + tag + '_RAW=[\n' + rows.join(',\n') + '\n];');
  }
}

const natPairs = Object.keys(nat).sort().map(n => q(n) + ':' + q(nat[n]));
lines.push('const T1_NAT={' + natPairs.join(',') + '};');

const used = new Set(Object.values(nat));
const ruPairs = [], enPairs = [], unnamed = [];
for (const code of Object.keys(NEW_CC).sort()) {
  if (!used.has(code)) continue;
  ruPairs.push(q(code) + ':' + q(NEW_CC[code][0]));
  enPairs.push(q(code) + ':' + q(NEW_CC[code][1]));
}
for (const code of used) if (!NEW_CC[code]) unnamed.push(code);

lines.push('const CC_RU_EXTRA_T1={' + ruPairs.join(',') + '};');
lines.push('const CC_EN_EXTRA_T1={' + enPairs.join(',') + '};');

fs.writeFileSync(OUT, lines.join('\n') + '\n');

console.log('rows written        : ' + total + '   (' +
  Object.keys(counts).map(k => k + ' ' + counts[k]).join(', ') + ')');
console.log('players with a nat  : ' + natPairs.length);
console.log('country names added : ' + ruPairs.length);
console.log('codes left to index : ' + unnamed.length + ' (already named in index.html)');
console.log('teams not of size 3 : ' + odd.length);
odd.forEach(s => console.log('  ' + s));
