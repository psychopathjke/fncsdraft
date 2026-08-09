// Starts the 2025 mode in a headless page and reports what the app thinks it is:
// the roster it would draft from, the squad size, the theme it picked, and the
// bracket every region resolves to. Catches wiring mistakes that a rating dump
// cannot see.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
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
  var out = {};
  try {
    chooseMode(3, 'cards2025');
    out.pendingSize = pendingSize;
    out.pendingCards = pendingCards;
    out.pendingCardSet = pendingCardSet;
    out.themeKey = modeThemeKey(true);
    out.themeDefined = !!MODE_THEME[modeThemeKey(true)];
    out.rosterSize = cardRosterPlayers('t1').length;
    out.pendingPool = pendingPool().length;

    var regions = {};
    cardRosterPlayers('t1').forEach(function(p){ regions[p.region] = (regions[p.region]||0)+1; });
    out.regions = regions;

    var fmt = {};
    ['EU','NAC','NAW','BR','ASIA','ME','OCE'].forEach(function(r){
      var f = majorFormat(r, 't1');
      fmt[r] = { groups: f.heats.length,
                 fromGroups: f.heats.reduce(function(s,h){ return s+h.cut; }, 0),
                 lcq: f.lcqWinners, gfGames: f.gfGames,
                 field: f.heats.reduce(function(s,h){ return s+h.cut; }, 0) + f.lcqWinners };
    });
    out.format = fmt;

    // Team sizes actually recorded for the set.
    var sizes = {};
    CARD_TRIOS_T1.forEach(function(t){ sizes[t.handles.length] = (sizes[t.handles.length]||0)+1; });
    out.teamSizes = sizes;

    // A sample card, to confirm attributes resolve rather than throw.
    var sample = cardRosterPlayers('t1').filter(function(p){ return p.region==='EU'; })
                  .sort(function(a,b){ return b.rating-a.rating; })[0];
    if (sample) {
      var a = attrsFor(sample);
      out.sample = { handle: sample.handle, rating: sample.rating, rarity: sample.rarity,
                     nat: sample.nat, event: sample.event, ovr: a.ovr, role: a.roleKey,
                     attrs: [a.aim,a.end,a.sur,a.exp,a.clu,a.con] };
    }
    var withNat = cardRosterPlayers('t1').filter(function(p){ return !!p.nat; }).length;
    out.natCoverage = Math.round(100 * withNat / out.rosterSize) + '%';
    var withOrg = cardRosterPlayers('t1').filter(function(p){ return !!p.org; }).length;
    out.withOrg = withOrg;
    out.over99 = cardRosterPlayers('t1').filter(function(p){ return p.rating > 99; }).length;
  } catch (e) {
    out.error = String(e && e.stack || e);
  }
  document.getElementById('__probe').textContent =
    'BEGINPROBE' + encodeURIComponent(JSON.stringify(out)) + 'ENDPROBE';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsprobe-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINPROBE([\s\S]*?)ENDPROBE/);
if (!m) { console.error('probe did not run; page copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
console.log(JSON.stringify(out, null, 2));
process.exit(out.error ? 1 : 0);
