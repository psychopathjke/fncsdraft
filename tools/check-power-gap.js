// How far ahead of the lobby a good draft ends up, per card set.
//
//   node tools/check-power-gap.js
//
// The number that matters is not a card's rating but a team's power, which is
// what the simulation ranks on. A player who drafts the best three cards should
// finish near the top of the field, not above all of it: in the 2026 sets the
// best AI squad is deliberately a little stronger than the player's.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__pg" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    [['m1',2],['m2',2],['t1',3],['t2',3],['t3',3]].forEach(function(pair){
      var set = pair[0], size = pair[1];
      CARD_MODE = true; CARD_SET = set; squadSize = size; isMajorMode = false;
      var pool = cardRosterPlayers(set).slice();
      if (!pool.length) return;

      // A greedy draft: the best cards a player could take, by overall.
      var byOvr = pool.slice().sort(function(a,b){ return attrsFor(b).ovr - attrsFor(a).ovr; });
      var mine = byOvr.slice(0, size);
      var rest = pool.filter(function(p){ return mine.indexOf(p) < 0; });

      var teams = [];
      fillFieldTeams(rest, 32, size, teams);
      var pw = function(sq){ var t = buildTeam(sq); return t && t.pow; };
      var mineP = pw(mine);
      var field = teams.map(function(t){ return t.pow != null ? t.pow : pw(t.squad || t); }).filter(function(v){ return v != null; })
                       .sort(function(a,b){ return b-a; });
      out[set] = {
        size: size,
        you: mineP,
        best: field[0],
        median: field[Math.floor(field.length/2)],
        worst: field[field.length-1],
        gap: (mineP != null && field.length) ? +(mineP - field[0]).toFixed(1) : null,
        aheadOf: field.length ? Math.round(100 * field.filter(function(v){ return v < mineP; }).length / field.length) : null,
        squad: mine.map(function(p){ return p.handle + ' ' + attrsFor(p).ovr; })
      };
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__pg').textContent =
    'BEGINPG' + encodeURIComponent(JSON.stringify(out)) + 'ENDPG';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'power-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINPG([\s\S]*?)ENDPG/);
if (!m) { console.error('probe did not run; page at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

console.log('set  size   you   best AI   median   gap    ahead of');
['m1','m2','t1','t2','t3'].forEach(set => {
  const o = out[set];
  if (!o) { console.log(set + ': absent'); return; }
  console.log(set.padEnd(5) + String(o.size).padEnd(5) +
    String(o.you).padStart(6) + String(o.best).padStart(10) + String(o.median).padStart(9) +
    String(o.gap > 0 ? '+' + o.gap : o.gap).padStart(8) + String(o.aheadOf + '%').padStart(10));
});
console.log('\na positive gap means the best draft beats every AI team before a shot is fired');
['t1','t2','t3'].forEach(set => { if (out[set]) console.log('  ' + set + ' draft: ' + out[set].squad.join(', ')); });
