// Does the roster hold enough real European duos to fill a Division 1 cup?
//
// Division 1 is the real roster, but until now it was real *players* paired by
// rating — the pairs were invented. This measures the other thing: the duos the
// roster actually played, how good they are, and how many of them survive the
// Division 2 rating floor the field already applies. A field is 149 teams; if
// the answer is smaller than that, the rest has to be paired the old way.
//
//   node tools/career-real-duos.js
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
  const out = {};
  const roster = careerRosterEU();
  const byKey = new Map();
  roster.forEach(p => { if(!byKey.has(hKey(p))) byKey.set(hKey(p), p); });
  // Every real duo the roster can field whole, once each.
  const seen = new Map();
  let missing = 0, wrongSize = 0;
  roster.forEach(p => {
    rosterEntriesOf(p).forEach(({entry}) => {
      if(entry.duo.length !== 2) { wrongSize++; return; }
      const keys = entry.duo.map(h => hKey(h)).sort();
      const id = keys.join('|');
      if(seen.has(id)) return;
      const cards = keys.map(k => byKey.get(k));
      if(cards.some(c => !c)) { missing++; return; }
      const avg = (cards[0]._ovr + cards[1]._ovr) / 2;
      seen.set(id, {avg: avg, lo: Math.min(cards[0]._ovr, cards[1]._ovr), hi: Math.max(cards[0]._ovr, cards[1]._ovr)});
    });
  });
  const duos = [...seen.values()].sort((a,b) => b.avg - a.avg);
  out.duos = duos.length;
  out.missing = missing;
  out.wrongSize = wrongSize;
  out.floors = {};
  [82, 78, 75, 70, 65, 0].forEach(f => {
    out.floors[f] = {byAvg: duos.filter(d => d.avg >= f).length,
                     byBoth: duos.filter(d => d.lo >= f).length};
  });
  out.top149 = duos.slice(0, 149);
  const mean = a => a.reduce((s,x)=>s+x, 0) / a.length;
  out.avgOfTop149 = Math.round(mean(duos.slice(0,149).map(d=>d.avg)) * 10) / 10;
  out.avgAbove75 = Math.round(mean(duos.filter(d=>d.avg>=75).map(d=>d.avg)) * 10) / 10;
  out.weakestOfTop149 = duos[Math.min(148, duos.length-1)];
  out.bands = {};
  duos.forEach(d => { const b = Math.floor(d.avg/5)*5; out.bands[b] = (out.bands[b]||0)+1; });
  // What the field looks like today: real cards over the Division 2 floor,
  // paired by rating rather than by who they played with.
  const floor = CC_DIV_RATING[2];
  out.pairablePlayers = roster.filter(p => p._ovr >= floor).length;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsduos-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log('real European duos: ' + out.duos +
            '  (dropped: ' + out.missing + ' with a member off the roster, ' + out.wrongSize + ' not duos)');
console.log('players over the Division 2 floor: ' + out.pairablePlayers + ' — ' +
            Math.floor(out.pairablePlayers / 2) + ' invented pairs');
console.log('duos surviving a floor, by duo average and by the weaker member:');
Object.keys(out.floors).forEach(f => {
  console.log('  ' + String(f).padStart(3) + '  avg ' + String(out.floors[f].byAvg).padStart(4) +
              '   both ' + String(out.floors[f].byBoth).padStart(4));
});
console.log('bands ' + JSON.stringify(out.bands));
console.log('top 149 duos average ' + out.avgOfTop149 +
            ', weakest of them ' + JSON.stringify(out.weakestOfTop149));
console.log('every duo averaging 75+ averages ' + out.avgAbove75);
fs.rmSync(dir, { recursive: true, force: true });
