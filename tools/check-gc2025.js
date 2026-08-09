// Builds the Lyon field in a headless page and reports what came out: the size
// of the lobby, how many seats each Major supplied, whether anybody is seated
// twice, and whether the player's own team is in it. Also prints how many cards
// in each set carry a real in-game role rather than the guess-from-attributes
// fallback, which is the other thing the 2025 sets were short of.
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
    chooseMode(3, 'cards2025major3');
    CARD_SET = 't3'; CARD_MODE = true; squadSize = 3;
    var roster = cardRosterPlayers('t3');

    out.roles = {};
    ['t1','t2','t3','m1','m2'].forEach(function(set){
      var r = cardRosterPlayers(set);
      var real = r.filter(function(p){ return !!realRoleKey(p); }).length;
      out.roles[set] = {cards: r.length, real: real,
                        pct: r.length ? Math.round(1000*real/r.length)/10 : 0};
    });

    // Build a player team out of a real Europe trio, then run the field builder
    // the way the Major 3 branch does.
    var byRegion = {};
    roster.forEach(function(p){ (byRegion[p.region] = byRegion[p.region] || []).push(p); });
    out.fields = {};
    ['EU','NAC','OCE'].forEach(function(reg){
      var pool = (byRegion[reg] || []).slice().sort(function(a,b){ return b.rating - a.rating; });
      if (pool.length < 30) { out.fields[reg] = {error: 'pool too small: ' + pool.length}; return; }
      drafted = pool.slice(0, 3);
      var you = buildTeam(drafted);
      you.isYou = true; you.name = teamLabel(drafted);
      // A stand-in regional final: nine more teams from the same region, which is
      // more than any region's allocation needs.
      var others = [];
      for (var i = 3; i < 33; i += 3) {
        var sq = pool.slice(i, i + 3);
        if (sq.length < 3) break;
        var t = buildTeam(sq); t.name = teamLabel(sq); others.push(t);
      }
      var finalTeams = [you].concat(others);
      var field = buildGlobalChampionship2025Field(you, reg, finalTeams);
      var routes = {};
      field.forEach(function(t){ routes[t.gcRoute || '?'] = (routes[t.gcRoute || '?'] || 0) + 1; });
      var seen = {}, dupes = [];
      field.forEach(function(t){
        (t.squad || []).forEach(function(p){
          var k = String(p.handle || '').toLowerCase();
          if (seen[k]) dupes.push(p.handle); else seen[k] = 1;
        });
      });
      var sizes = {};
      field.forEach(function(t){ sizes[(t.squad||[]).length] = (sizes[(t.squad||[]).length]||0)+1; });
      out.fields[reg] = {size: field.length, routes: routes, teamSizes: sizes,
                         youIn: field.indexOf(you) >= 0, duplicatePlayers: dupes,
                         players: Object.keys(seen).length,
                         sample: field.slice(0, 3).map(function(t){ return t.name.replace(/<[^>]+>/g,''); })};
    });

    // The prize table has to pay every place in the lobby and add up to what
    // Epic published.
    var sum = 0, paid = 0;
    for (var pl = 1; pl <= 33; pl++) { var v = prizeFor('GC2025', pl); sum += v; if (v) paid++; }
    out.prize = {paidPlaces: paid, sum: sum, expected: 2001000, agrees: sum === 2001000};
    out.prize2025Regions = Object.keys(PRIZE_TABLES_2025).map(function(s){
      return s + ':' + Object.keys(PRIZE_TABLES_2025[s]).join('/');
    });
  } catch (e) {
    out.error = String(e && e.stack || e);
  }
  document.getElementById('__probe').textContent =
    'BEGINPROBE' + encodeURIComponent(JSON.stringify(out)) + 'ENDPROBE';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsgc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINPROBE([\s\S]*?)ENDPROBE/);
if (!m) { console.error('probe did not run'); process.exit(1); }
console.log(JSON.stringify(JSON.parse(decodeURIComponent(m[1])), null, 1));
