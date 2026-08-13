// Is a Reload drop worth what its box says? Loads each cup's island the way the
// app does and reports what the landing picker would offer: the points on every
// spot, and whether the biggest box on the island is the one paying four.
//
//   node tools/check-reload-zones.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {sets: [], error: null};
  try{
    ['r1','r2','r3','r4','m2'].forEach(set => {
      useLandingSet(set);
      const zones = ALL_LANDING_ZONES.map(z => ({area: Math.round(z.w * z.h), pts: z.points}));
      const byPts = {};
      zones.forEach(z => { (byPts[z.pts] = byPts[z.pts] || []).push(z.area); });
      const biggest = zones.slice().sort((a, b) => b.area - a.area)[0];
      const smallest = zones.slice().sort((a, b) => a.area - b.area)[0];
      // does area order agree with points order?
      const sorted = zones.slice().sort((a, b) => a.area - b.area);
      let monotonic = true;
      for (let i = 1; i < sorted.length; i++) if (sorted[i].pts < sorted[i-1].pts) monotonic = false;
      out.sets.push({set: set, n: zones.length, biggest: biggest, smallest: smallest,
                     spread: Object.keys(byPts).sort().map(p => p + ':' + byPts[p].length).join(' '),
                     monotonic: monotonic});
    });
  }catch(e){ out.error = String(e && e.stack || e).slice(0, 500); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rzones-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=90000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

let bad = 0;
const say = (ok, line) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + line); if(!ok) bad++; };
console.log('set  spots  points spread        biggest box        smallest box');
out.sets.forEach(r => console.log(' ' + r.set.padEnd(4) + String(r.n).padStart(5) + '   ' +
  r.spread.padEnd(18) + ' area ' + String(r.biggest.area).padStart(4) + ' -> ' + r.biggest.pts + ' pts' +
  '     area ' + String(r.smallest.area).padStart(4) + ' -> ' + r.smallest.pts + ' pts'));
console.log('');
out.sets.filter(r => /^r\d$/.test(r.set)).forEach(r => {
  say(r.biggest.pts === 4, r.set + ': the biggest box on the island pays the most (' + r.biggest.pts + ')');
  say(r.smallest.pts === 1, r.set + ': the smallest pays the least (' + r.smallest.pts + ')');
  say(r.monotonic, r.set + ': a bigger box never pays less than a smaller one');
});
const fncs = out.sets.find(r => r.set === 'm2');
say(!fncs.monotonic, 'FNCS still rates a spot on its published eval, not on its size');
console.log('\n' + (bad ? bad + ' failing' : 'a Reload drop is worth the size of the box the circuit drew'));
process.exit(bad ? 1 : 0);
