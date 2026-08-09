// Compares two card-rating dumps. Exits non-zero if anything moved, so it can
// gate a commit. An optional third argument narrows the check to one card set.
const fs = require('fs');

const a = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const b = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const only = process.argv[4];

const keys = Object.keys(a).filter(k => !only || k.startsWith(only + '|'));
let moved = 0, missing = 0;

for (const k of keys) {
  if (!(k in b)) { missing++; if (missing <= 10) console.log('MISSING ' + k); continue; }
  const x = a[k], y = b[k];
  if (x.rating !== y.rating || x.rarity !== y.rarity || x.ovr !== y.ovr) {
    moved++;
    if (moved <= 10) console.log('MOVED   ' + k + '  ' + JSON.stringify(x) + ' -> ' + JSON.stringify(y));
  }
}

console.log((only || 'all') + ': ' + keys.length + ' checked, ' + moved + ' moved, ' + missing + ' missing');
process.exit(moved || missing ? 1 : 0);
