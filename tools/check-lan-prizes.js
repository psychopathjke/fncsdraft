// Does the LAN pay, and does what it pays add up?
//
// Antwerp's per-place split was never published; the table is the 2024 Global
// Championship's, which pays the same fifty places for the same $2,000,000. The
// check that matters is that the two published facts still hold after anybody
// edits the numbers: fifty paid places, two million dollars.
//
//   node tools/check-lan-prizes.js
'use strict';

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__pz" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], lans: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    CARD_MODE = true;
    [{tag: 'GC2026', where: 'Antwerp', seats: 50, pool: 2000000, set: 'm2'},
     {tag: 'GC2025', where: 'Lyon',    seats: 33, pool: 2001000, set: 't3'}].forEach(function(lan){
      CARD_SET = lan.set; squadSize = lan.set[0] === 't' ? 3 : 2;
      var paid = 0, total = 0, last = Infinity, monotonic = true;
      for (var p = 1; p <= 60; p++) {
        var v = prizeFor(lan.tag, p);
        if (v > 0) { paid++; total += v; if (v > last) monotonic = false; last = v; }
      }
      out.lans.push({where: lan.where, paid: paid, total: total,
        first: prizeFor(lan.tag, 1), last: prizeFor(lan.tag, lan.seats)});

      check(lan.where + ': pays every seat and no more',
        paid === lan.seats, 'pays ' + paid + ' places, the field is ' + lan.seats);
      check(lan.where + ': the split adds up to the pool',
        total === lan.pool, '$' + total.toLocaleString('en-US') + ' against $' + lan.pool.toLocaleString('en-US'));
      check(lan.where + ': finishing higher never pays less',
        monotonic, 'a later place pays more than an earlier one');
      check(lan.where + ': one place past the field pays nothing',
        prizeFor(lan.tag, lan.seats + 1) === 0,
        'place ' + (lan.seats + 1) + ' is paid $' + prizeFor(lan.tag, lan.seats + 1));
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__pz').textContent =
    'BEGINPZ' + encodeURIComponent(JSON.stringify(out)) + 'ENDPZ';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-lan-prizes.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINPZ([\s\S]*?)ENDPZ/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.lans.forEach(l => console.log(l.where + ': ' + l.paid + ' places, $' + l.total.toLocaleString('en-US') +
  ', first $' + l.first.toLocaleString('en-US') + ', last $' + l.last.toLocaleString('en-US')));
let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
