// Plays whole Major 3 runs in a headless page until one earns a seat in Lyon,
// then reports the stage cards the run produced. The landing picker is the only
// thing stubbed out — it waits for a click, and there is nobody to click — so
// everything else is the real tournament: the real draft, the real bracket, the
// real Grand Final and the real Global Championship.
//
//   node tools/check-gc2025-run.js [attempts]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ATTEMPTS = +(process.argv[2] || 12);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const BOOTSTRAP = `
<pre id="__probe" style="display:none"></pre>
<script>
(function(){
  var out = {attempts: []};
  function finish(){
    document.getElementById('__probe').textContent =
      'BEGINPROBE' + encodeURIComponent(JSON.stringify(out)) + 'ENDPROBE';
  }
  // The two places a run stops for a human. Neither decides anything the rest of
  // the tournament reads back, so a run without them is still the real run.
  showFinalsLandingPicker = function(){ return Promise.resolve(new Map()); };
  pickInitialZone = function(){ return Promise.resolve(new Map()); };
  offerSquadChoice = function(){ return Promise.resolve('a'); };

  chooseMode(3, 'cards2025major3');
  CARD_SET = 't3'; CARD_MODE = true; squadSize = 3; isMajorMode = true;
  skipAnimation = true;
  var roster = cardRosterPlayers('t3').filter(function(p){ return p.region === 'EU'; })
                 .sort(function(a,b){ return b.rating - a.rating; });

  function once(n){
    drafted = roster.slice(0, 3);
    skipAnimation = true;
    return runMajorTournament().then(function(){
      var cards = [].slice.call(document.querySelectorAll('#majorStages .stage-card'))
        .map(function(c){ var h = c.querySelector('h4'); return h ? h.textContent.trim() : '(no title)'; });
      var reachedLyon = cards.some(function(t){ return /Лион|Lyon/.test(t); });
      var summary = cards.some(function(t){ return /Итоги симуляции|Your run, stage by stage/.test(t); });
      out.attempts.push({run: n, cards: cards, reachedLyon: reachedLyon, summaryCard: summary,
                         places: runPlaces.map(function(p){ return p.title + ' #' + p.rank + '/' + p.total; }),
                         earnings: runEarnings.map(function(e){ return e.label + ' = ' + e.amount; }),
                         totalEarned: runEarnings.reduce(function(s,e){ return s+e.amount; }, 0)});
      if (reachedLyon || n >= ${ATTEMPTS}) { finish(); return; }
      return once(n + 1);
    }).catch(function(e){
      out.error = String(e && e.stack || e);
      finish();
    });
  }
  once(1);
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsrun-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINPROBE([\s\S]*?)ENDPROBE/);
if (!m) { console.error('probe did not run'); process.exit(1); }
const res = JSON.parse(decodeURIComponent(m[1]));
if (res.error) { console.error(res.error); process.exit(1); }
res.attempts.forEach(a => {
  console.log('run ' + a.run + ': ' + a.cards.length + ' stage cards, Lyon=' + a.reachedLyon +
              ', summary=' + a.summaryCard + ', earned $' + a.totalEarned);
});
const last = res.attempts[res.attempts.length - 1];
console.log('\nstages of the last run:');
last.places.forEach(p => console.log('  ' + p));
console.log('earnings:');
(last.earnings.length ? last.earnings : ['  (none)']).forEach(e => console.log('  ' + e));
process.exit(last.reachedLyon ? 0 : 2);
