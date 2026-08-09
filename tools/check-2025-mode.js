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
  var TILES = {t1:'cards2025', t2:'cards2025major2', t3:'cards2025major3'};
  try {
    Object.keys(TILES).forEach(function(set){
      var o = out[set] = {};
      chooseMode(3, TILES[set]);
      o.pendingSize = pendingSize;
      o.pendingCards = pendingCards;
      o.pendingCardSet = pendingCardSet;
      o.themeKey = modeThemeKey(true);
      o.themeDefined = !!MODE_THEME[modeThemeKey(true)];
      var roster = cardRosterPlayers(set);
      o.rosterSize = roster.length;
      o.pendingPool = pendingPool().length;

      var regions = {};
      roster.forEach(function(p){ regions[p.region] = (regions[p.region]||0)+1; });
      o.regions = regions;

      var fmt = {};
      ['EU','NAC','NAW','BR','ASIA','ME','OCE'].forEach(function(r){
        var f = majorFormat(r, set);
        fmt[r] = { groups: f.heats.length,
                   fromGroups: f.heats.reduce(function(s,h){ return s+h.cut; }, 0),
                   lcq: f.lcqWinners, gfGames: f.gfGames,
                   field: f.heats.reduce(function(s,h){ return s+h.cut; }, 0) + f.lcqWinners };
      });
      o.format = fmt;

      // Team sizes actually recorded for the set.
      var sizes = {};
      CARD_TRIOS_BY_SET[set].forEach(function(t){ sizes[t.handles.length] = (sizes[t.handles.length]||0)+1; });
      o.teamSizes = sizes;

      // Rating spread in decades: a set with no middle is the failure the
      // season ledger exists to prevent, and it does not show up in a mean.
      var decades = {};
      roster.forEach(function(p){ var d = Math.floor(p.rating/10)*10; decades[d] = (decades[d]||0)+1; });
      o.decades = decades;
      o.ratingMax = Math.max.apply(null, roster.map(function(p){ return p.rating; }));
      o.over99 = roster.filter(function(p){ return p.rating > 99; }).length;
      o.atFloor = roster.filter(function(p){ return p.rating === 30; }).length;

      // A sample card, to confirm attributes resolve rather than throw.
      var sample = roster.filter(function(p){ return p.region==='EU'; })
                    .sort(function(a,b){ return b.rating-a.rating; })[0];
      if (sample) {
        var a = attrsFor(sample);
        o.sample = { handle: sample.handle, rating: sample.rating, rarity: sample.rarity,
                     nat: sample.nat, event: sample.event, date: sample.date,
                     ovr: a.ovr, role: a.roleKey,
                     attrs: [a.aim,a.end,a.sur,a.exp,a.clu,a.con] };
      }
      var withNat = roster.filter(function(p){ return !!p.nat; }).length;
      o.natCoverage = Math.round(100 * withNat / o.rosterSize) + '%';
      o.withOrg = roster.filter(function(p){ return !!p.org; }).length;

      // Each Major was played on its own Chapter 6 season, so each has to draw
      // its own loot. CARD_SET is what the getters switch on, so it is set here
      // rather than passed.
      var wasSet = CARD_SET, wasMode = CARD_MODE;
      CARD_SET = set; CARD_MODE = true;
      o.loot = {season: lootPoolSeasonName(),
                weapons: activeWeaponPool().length,
                weaponNames: new Set(activeWeaponPool().map(function(w){ return w.name; })).size,
                consumables: T_CONSUMABLE_POOLS[set].length,
                withArt: T_CONSUMABLE_POOLS[set].concat(activeWeaponPool())
                          .filter(function(w){ return T_ART[set][w.name] || T1_ART[w.name] ||
                                                      T2_ART[w.name] || T3_ART[w.name]; })
                          .map(function(w){ return w.name; })
                          .filter(function(v, i, a){ return a.indexOf(v) === i; }).length};
      CARD_SET = wasSet; CARD_MODE = wasMode;
    });

    // Pool sizes only. Counting repeated trios would measure nothing: a trio
    // that reached the Grand Final is recorded at both stages it played, and the
    // same three people playing two Majors together is a fact about them rather
    // than a leak between the sets.
    out.trioPools = {t1: CARD_TRIOS_BY_SET.t1.length,
                     t2: CARD_TRIOS_BY_SET.t2.length,
                     t3: CARD_TRIOS_BY_SET.t3.length};
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
