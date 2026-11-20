// index.html <-> src/: the page is cut into source files at marker lines, and put back byte for byte.
//
//   node tools/parts.js split      index.html -> src/ (and src/PARTS.txt, the order)
//   node tools/parts.js assemble   src/ -> index.html
//   node tools/parts.js check      exit 1 if index.html and src/ disagree
//
// A part starts at a line holding @@PART <path>@@ (inside a comment of whatever language is around it)
// and runs to the next such line. Everything before the first marker is src/head.html. The marker line
// belongs to the part it opens, so the page is the plain concatenation of the parts in PARTS.txt order.
//
// Why both directions: ~360 checks and ~80 builders read and write index.html directly, and they keep
// doing so. Edit either side, run split or assemble, and check (CI runs it) catches the two drifting.
// Line endings: parts are written with the bytes index.html has; check compares with CRLF folded to LF,
// so a Windows checkout and a Mac checkout agree.
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'index.html');
const SRC = path.join(ROOT, 'src');
const ORDER = path.join(SRC, 'PARTS.txt');
const MARK = /@@PART ([A-Za-z0-9_\/.-]+)@@/;

function cut(text) {
  const parts = [];
  let name = 'head.html', start = 0, pos = 0;
  while (pos < text.length) {
    let end = text.indexOf('\n', pos);
    end = end < 0 ? text.length : end + 1;
    const line = text.slice(pos, end);
    const m = MARK.exec(line);
    if (m && pos > 0) {
      parts.push([name, text.slice(start, pos)]);
      name = m[1]; start = pos;
    }
    pos = end;
  }
  parts.push([name, text.slice(start)]);
  const seen = new Set();
  for (const [n] of parts) {
    if (seen.has(n)) throw new Error('part named twice: ' + n);
    if (n.includes('..') || path.isAbsolute(n)) throw new Error('bad part path: ' + n);
    seen.add(n);
  }
  return parts;
}

function readParts() {
  const order = fs.readFileSync(ORDER, 'utf8').split(/\r?\n/).filter(Boolean);
  return order.map(n => [n, fs.readFileSync(path.join(SRC, n), 'utf8')]);
}

const fold = s => s.replace(/\r\n/g, '\n');
const cmd = process.argv[2];

if (cmd === 'split') {
  const parts = cut(fs.readFileSync(PAGE, 'utf8'));
  const old = fs.existsSync(ORDER) ? fs.readFileSync(ORDER, 'utf8').split(/\r?\n/).filter(Boolean) : [];
  for (const [n, body] of parts) {
    const f = path.join(SRC, n);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== body) fs.writeFileSync(f, body);
  }
  // A part whose marker was removed from the page is removed from src/ too.
  const now = new Set(parts.map(p => p[0]));
  for (const n of old) if (!now.has(n) && fs.existsSync(path.join(SRC, n))) fs.unlinkSync(path.join(SRC, n));
  fs.writeFileSync(ORDER, parts.map(p => p[0]).join('\n') + '\n');
  console.log('split: ' + parts.length + ' parts into src/');
} else if (cmd === 'assemble') {
  const parts = readParts();
  fs.writeFileSync(PAGE, parts.map(p => p[1]).join(''));
  console.log('assemble: index.html from ' + parts.length + ' parts');
} else if (cmd === 'check') {
  const page = fold(fs.readFileSync(PAGE, 'utf8'));
  const built = fold(readParts().map(p => p[1]).join(''));
  if (page === built) { console.log('parts: index.html and src/ agree (' + readParts().length + ' parts)'); process.exit(0); }
  // Say where: the first part whose text differs from the same stretch of the page.
  const mine = cut(page), theirs = readParts();
  const names = mine.map(p => p[0]).join(','), order = theirs.map(p => p[0]).join(',');
  if (names !== order) console.error('parts differ in order or names: page has ' + mine.length + ', src/ has ' + theirs.length);
  else for (let i = 0; i < mine.length; i++) if (mine[i][1] !== fold(theirs[i][1])) { console.error('first difference in ' + mine[i][0]); break; }
  console.error('index.html and src/ disagree: run "node tools/parts.js split" after editing index.html, or "assemble" after editing src/');
  process.exit(1);
} else {
  console.error('usage: node tools/parts.js split|assemble|check');
  process.exit(2);
}
