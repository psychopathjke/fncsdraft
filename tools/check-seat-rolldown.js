// Does a team that is already going to the LAN still eat one of its region's
// seats? Builds a real lobby for a set, ranks it, and reports how many of the
// teams above the cut already hold a seat and where the last seat actually lands.
//
//   node tools/check-seat-rolldown.js
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
  var SETS = [['m2', 2, 'cards'], ['t2', 3, 'cards2025major2'], ['t3', 3, 'cards2025major3']];
  SETS.forEach(function(cfg){
    var set = cfg[0], size = cfg[1];
    chooseMode(size, cfg[2]);
    CARD_SET = set; CARD_MODE = true; squadSize = size; isMajorMode = true;
    var roster = cardRosterPlayers(set).filter(function(p){ return p.region === 'EU'; })
                   .sort(function(a,b){ return b.rating - a.rating; });
    var slots = set === 'm2' ? MAJOR2_GC_SLOTS.EU : set === 't3' ? GC2025_M3_SEATS.EU : 0;
    var holders = lanSeatHoldersForSet().length;
    var trials = 200, rolled = 0, aboveCut = 0, seatCuts = {};
    for (var n = 0; n < trials; n++) {
      drafted = roster.slice(0, size);
      pool = roster;
      var teams = buildFullLobby();
      var you = teams.find(function(t){ return t.isYou; });
      // Rank them by power, which is what a played final ends up close to; the
      // question here is the seat arithmetic, not the tournament.
      var ranked = teams.slice().sort(function(a, b){ return b.pow - a.pow; }).slice(0, 33);
      if (!slots) continue;
      var seats = awardSeats(ranked, slots, holdsLanSeat);
      var cut = seats.length ? ranked.indexOf(seats[seats.length-1]) + 1 : slots;
      seatCuts[cut] = (seatCuts[cut] || 0) + 1;
      if (cut > slots) rolled++;
      aboveCut += ranked.slice(0, slots).filter(holdsLanSeat).length;
    }
    out[set] = {slots: slots, lockedTeamsKnown: holders,
                lobbiesWhereASeatRolled: Math.round(100 * rolled / trials) + '%',
                alreadyQualifiedInsideTopN: Math.round(100 * aboveCut / trials) / 100,
                seatCutSpread: seatCuts};
  });
  document.getElementById('__probe').textContent =
    'BEGINPROBE' + encodeURIComponent(JSON.stringify(out)) + 'ENDPROBE';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsseat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINPROBE([\s\S]*?)ENDPROBE/);
if (!m) { console.error('probe did not run'); process.exit(1); }
console.log(JSON.stringify(JSON.parse(decodeURIComponent(m[1])), null, 1));
