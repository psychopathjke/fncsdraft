// Which managers have a face, and whether the files they name are really there.
//
// CC_AGENTS is a list of real people, and since 18 August every one of them has
// to have a portrait: half an inbox of monograms beside half an inbox of faces
// reads as something broken. Two ways to fail, and they look identical on screen
// — no photo at all, and a photo naming a file that is not there.
//
//   node tools/check-agent-faces.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const block = src.match(/const CC_AGENTS=\[([\s\S]*?)\n\];/);
if (!block) { console.error('CC_AGENTS not found'); process.exit(2); }

// One entry per {...}, which is one line each in this list.
const entries = block[1].split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith('{name:'))
  .map(l => ({
    name: (l.match(/name:'([^']*)'/) || [])[1],
    at: (l.match(/at:'([^']*)'/) || [])[1] || null,
    photo: (l.match(/photo:'([^']*)'/) || [])[1] || null,
    note: (l.match(/\/\/\s*(.+)$/) || [])[1] || ''
  }));

const missing = [];
const withFace = entries.filter(e => e.photo);
const noFace = entries.filter(e => !e.photo);
withFace.forEach(e => {
  if (!fs.existsSync(path.join(ROOT, 'photos', e.photo)))
    missing.push(e.name + ' names photos/' + e.photo + ', which is not there');
});

console.log('managers: ' + entries.length + ' · with a face: ' + withFace.length +
            ' · without: ' + noFace.length);
console.log();
if (withFace.length) {
  console.log('WITH A FACE');
  withFace.forEach(e => console.log('  ' + (e.name || '?').padEnd(16) +
    (e.at ? '@' + e.at : '—').padEnd(18) + e.photo));
}
if (noFace.length) {
  console.log();
  console.log('STILL THE INITIALS CIRCLE');
  noFace.forEach(e => console.log('  ' + (e.name || '?').padEnd(16) +
    (e.at ? '@' + e.at : '—').padEnd(18) + e.note));
}

noFace.forEach(e => missing.push(e.name + ' has no photo — the list is faces only'));
if (missing.length) { missing.forEach(m => console.error('FAIL ' + m)); process.exit(1); }
console.log();
console.log('every face a manager names is a file that exists');
