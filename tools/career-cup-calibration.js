// Division cup calibration: does the ladder actually behave the way the design
// claims? It runs the app's own careerCupField and its own lobby simulation —
// no reimplementation — for a player sitting at each division's rating, and
// reports how often that player lands inside the cut.
//
// What the design predicts, and what this is here to confirm or refute:
//   - the band spread is Epic's own (CC_BAND_SD, calibrated against the
//     Power Rankings example), so the top 8% quota sits ~4.5 over the band:
//     at the band a cup is nearly unwinnable, and the odds grow with every
//     point of rating a career earns — that curve is what the offsets read
//   - a player who just arrived from the rung below almost never promotes
//   - Division 1's field is real roster cards, everything below it is ladder
//
// Run: node tools/career-cup-calibration.js [runsPerDivision]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = parseInt(process.argv[2] || '40', 10);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {runs: ${RUNS}, divisions: [], error: null};
  try{
    CARD_MODE = true; squadSize = 2;
    const mkPlayer = (ovr, nick) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'calibration', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, 'roleIGL')});

    // Readings per division along the growth a career actually makes: fresh
    // from the rung below, at the band, half-grown, and fully outgrown.
    for (const div of [5, 4, 3, 2, 1]) {
      const band = CC_DIV_RATING[div];
      const below = CC_DIV_RATING[div + 1] || band;
      const row = {div: div, band: band, atBand: 0, fromBelow: 0, mid: 0, grown: 0,
                   fieldOvr: 0, realCards: 0, places: []};
      for (let r = 0; r < ${RUNS}; r++) {
        for (const [key, ovr] of [['atBand', band], ['fromBelow', below],
                                  ['mid', band + 3.5], ['grown', band + 7]]) {
          // A career duo covers both roles — careerEnsurePartner assigns the
          // role the player does not have — so the calibration pair does too,
          // or it measures a duo the mode never actually fields.
          const me = mkPlayer(ovr, 'CAL_YOU');
          const mate = mkPlayer(ovr, 'CAL_MATE');
          mate._attrs = ccRookieAttrs(ovr, 'roleFRG');
          CAREER = {player: {}, career: {season: 1, week: (r % 4) + 1, division: div}, partner: null};
          const you = careerTeam([me, mate]);
          you.isYou = true; you.name = 'you';
          const field = [you].concat(careerCupField(CAREER.career, [me, mate], careerCupSize(div)));
          if (key === 'atBand' && r === 0) {
            const ovrs = [];
            field.forEach(t => t.squad.forEach(p => { if (p.handle.indexOf('CAL_') !== 0) ovrs.push(attrsFor(p).ovr); }));
            row.fieldOvr = Math.round(ovrs.reduce((s, v) => s + v, 0) / ovrs.length * 10) / 10;
            row.realCards = field.reduce((s, t) => s + t.squad.filter(p => p.tier !== 'ladder' && p.handle.indexOf('CAL_') !== 0).length, 0);
            row.fieldSize = field.length; row.cut = careerCupCut(div);
          }
          await simulateGamesRandomLobbies(field, CAREER_CUP_GAMES, 50, pointsForPlace, 4);
          const ranked = field.slice().sort((a, b) => b.stagePts - a.stagePts || b.stageElims - a.stageElims);
          const place = ranked.indexOf(you) + 1;
          if (place <= careerCupCut(div)) row[key]++;
          if (key === 'atBand') row.places.push(place);
        }
      }
      row.medianPlace = row.places.sort((a, b) => a - b)[Math.floor(row.places.length / 2)];
      delete row.places;
      out.divisions.push(row);
    }
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncscup-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

const pct = n => (100 * n / out.runs).toFixed(0).padStart(3) + '%';
console.log('cup, per division: ' + out.divisions.map(r => 'D' + r.div + ' ' + r.fieldSize + '/' + r.cut).join(', ') + ' — ' + out.runs + ' runs each');
console.log('div  band  field OVR  real cards  from below  at band  +3.5  +7  median place at band');
out.divisions.forEach(r => {
  console.log('  ' + r.div + '    ' + String(r.band).padStart(2) +
    String(r.fieldOvr).padStart(11) + String(r.realCards).padStart(12) +
    pct(r.fromBelow).padStart(12) + pct(r.atBand).padStart(9) +
    pct(r.mid).padStart(6) + pct(r.grown).padStart(5) +
    String(r.medianPlace).padStart(15));
});
fs.rmSync(dir, { recursive: true, force: true });
