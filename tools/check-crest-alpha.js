// Which club logos carry a background they cannot get rid of — and whether the
// page still agrees with them.
//
// A JPEG has no alpha channel at all, so every .jpg on the shelf is a solid
// rectangle. A PNG has alpha only if its colour type says so: 4 is grey+alpha,
// 6 is truecolour+alpha, and 3 is a palette, which can still carry a tRNS chunk.
//
// Those five are drawn as badges rather than floated as cut-outs, because a
// white rectangle on a dark panel reads as a mistake. The list lives in
// CC_LOGO_SOLID, and a hand-kept list drifts: replace one with a transparent
// export and it keeps a plate it no longer needs; drop a new opaque one in and it
// shows a raw white rectangle. So the list is checked against the files.
//
//   node tools/check-crest-alpha.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'logos');

function opaque(f) {
  const ext = path.extname(f).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'jpg — no alpha at all';
  if (ext !== '.png') return null;
  const b = fs.readFileSync(path.join(DIR, f));
  const colourType = b[25];               // IHDR starts at byte 8; colour type is byte 25
  if (colourType === 4 || colourType === 6) return null;
  if (colourType === 3 && b.includes(Buffer.from('tRNS'))) return null;
  return 'png, opaque (colour type ' + colourType + ')';
}

const files = fs.readdirSync(DIR);
const solid = new Map();
for (const f of files) { const why = opaque(f); if (why) solid.set(f, why); }

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const m = src.match(/CC_LOGO_SOLID=\[([^\]]*)\]/);
if (!m) { console.error('CC_LOGO_SOLID is not in index.html'); process.exit(2); }
const listed = new Set((m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)));

console.log('logos: ' + files.length + ', with a painted-in background: ' + solid.size);
for (const [f, why] of solid) console.log('  ' + f.padEnd(30) + why);

const fails = [];
for (const f of solid.keys())
  if (!listed.has(f)) fails.push(f + ' has a background and is not in CC_LOGO_SOLID — it will show as a raw rectangle');
for (const f of listed)
  if (!solid.has(f)) fails.push(f + ' is in CC_LOGO_SOLID but is transparent now — drop it and let it float');

if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('every crest that carries a background is drawn as one, and no other is');
