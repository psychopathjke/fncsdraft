// Which stages a card is allowed to have been rated on.
//
// A Major's card is built from that Major's own season — its cups, its groups,
// its Play-In, its Grand Finals. The Global Championship is not part of a Major;
// it is what the season ends with, and only Major 3 sent anybody there. It was
// being written into all three 2025 ledgers, the same event with the same ranks,
// so a card opened in Major 1 listed "Global Championship" as the heaviest line
// in its own rating — a result from months in the future.
//
//   node tools/check-card-stages.js
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
<pre id="__cs" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], stages: {}, sample: null};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    ['t1','t2','t3','m1','m2'].forEach(function(set){
      CARD_MODE = true; CARD_SET = set; squadSize = set[0]==='t' ? 3 : 2;
      var cards = cardRosterPlayers(set) || [];
      var labels = {}, withGC = 0;
      cards.forEach(function(p){
        var parts = p._ratingParts && p._ratingParts.parts;
        if (!parts) return;
        var sawGC = false;
        parts.forEach(function(pt){
          labels[pt.label] = (labels[pt.label] || 0) + 1;
          if (pt.label === 'Global Championship') sawGC = true;
        });
        if (sawGC) withGC++;
      });
      out.stages[set] = {cards: cards.length, labels: labels, withGlobalChampionship: withGC};
    });

    // The card from the report: P1NG, opened in Major 1.
    CARD_MODE = true; CARD_SET = 't1'; squadSize = 3;
    var p1ng = (cardRosterPlayers('t1') || []).filter(function(p){
      return String(p.handle).trim().toLowerCase() === 'p1ng'; })[0];
    if (p1ng) {
      var parts = (p1ng._ratingParts && p1ng._ratingParts.parts) || [];
      out.sample = {handle: p1ng.handle, rating: p1ng.rating,
                    stages: parts.map(function(pt){ return pt.label; })};
    }

    ['t1','t2'].forEach(function(set){
      check(set + ': no card is rated on the Global Championship',
        out.stages[set] && out.stages[set].withGlobalChampionship === 0,
        out.stages[set] ? out.stages[set].withGlobalChampionship + ' cards carry it' : 'no data');
    });
    check('t3: the Global Championship still counts, because Major 3 is what sent them',
      out.stages.t3 && out.stages.t3.withGlobalChampionship > 0,
      out.stages.t3 ? out.stages.t3.withGlobalChampionship + ' cards carry it' : 'no data');
    if (out.sample) {
      check('the reported card no longer lists it',
        out.sample.stages.indexOf('Global Championship') < 0,
        out.sample.handle + ' is rated on: ' + out.sample.stages.join(', '));
    }
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__cs').textContent =
    'BEGINCS' + encodeURIComponent(JSON.stringify(out)) + 'ENDCS';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-card-stages.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINCS([\s\S]*?)ENDCS/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

Object.keys(out.stages).forEach(set => {
  const s = out.stages[set];
  const ls = Object.keys(s.labels).sort();
  console.log(set + ': ' + s.cards + ' cards, ' + s.withGlobalChampionship + ' rated on the Global Championship');
  if (ls.length) console.log('    stages: ' + ls.join(', '));
});
if (out.sample) console.log('\n' + out.sample.handle + ' (' + out.sample.rating + ') in Major 1 is rated on:\n    ' +
  out.sample.stages.join('\n    '));

let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
