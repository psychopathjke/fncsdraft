// How big does a division's room actually have to be?
//
// His question, 17 August: or even smaller - how much is enough for each
// division. It is a measurable question, not a taste one, so this measures it.
//
// A room is big enough when making it bigger stops changing the answers. The
// cut is a share (Epic's 8%), so difficulty is the same at every size by
// construction - what a small room costs is resolution. Twelve duos qualifying
// out of a hundred and fifty is decided by fewer games than eighty out of a
// thousand, so the same duo's result swings further from week to week, and a
// ladder made of coin flips is a ladder nobody can climb deliberately.
//
// Three readings per size, at a fixed rating lead:
//   - promote%   how often the duo lands inside the share
//   - median     where it finishes, as a percentile of the field (lower better)
//   - swing      the spread of that percentile across runs, in percentage points
//                - this is the noise, and it is the number that decides "enough"
//
// Run: node tools/career-room-size.js [runs] [division]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = parseInt(process.argv[2] || '30', 10);
const DIV = parseInt(process.argv[3] || '4', 10);
const SIZES = (process.argv[4]||"100,250,500,1000,2000").split(",").map(Number);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {runs: ${RUNS}, div: ${DIV}, sizes: [], err: null};
  try{
    CARD_MODE = true; squadSize = 2;
    const mk = (ovr, nick, role) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'roomsize', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, role||'roleIGL')});
    const band = CC_DIV_RATING[${DIV}];
    // The share the whole ladder calibration stands on, held constant so the
    // only thing changing between rows is how big the room is.
    const SHARE = careerCupCut(${DIV}) / careerCupSize(${DIV});
    out.share = Math.round(SHARE * 10000) / 10000;
    for (const size of ${JSON.stringify(SIZES)}) {
      const cut = Math.max(1, Math.round(size * SHARE));
      const row = {size: size, cut: cut, at: {}, ms: 0};
      const t0 = Date.now();
      // Two readings: standing at the division's own band, and seven points
      // over it, which is one rung and the point the ladder is tuned at.
      for (const [key, ovr] of [['atBand', band], ['plus7', band + 7]]) {
        const pcts = [];
        let made = 0;
        for (let r = 0; r < ${RUNS}; r++) {
          const me = mk(ovr, 'RS_YOU'), mate = mk(ovr, 'RS_MATE', 'roleFRG');
          CAREER = {player: {}, career: {season: 1, week: (r % 4) + 1, division: ${DIV}},
                    partner: null};
          const you = careerTeam([me, mate]);
          you.isYou = true; you.name = 'you';
          const field = [you].concat(careerCupField(CAREER.career, [me, mate], size));
          await simulateGamesRandomLobbies(field, CAREER_CUP_GAMES, 50, pointsForPlace, 4);
          const ranked = field.slice().sort((a,b) => b.stagePts - a.stagePts || b.stageElims - a.stageElims);
          const place = ranked.indexOf(you) + 1;
          if (place <= cut) made++;
          pcts.push(100 * place / field.length);
        }
        pcts.sort((a,b) => a-b);
        const mean = pcts.reduce((s,v) => s+v, 0) / pcts.length;
        const sd = Math.sqrt(pcts.reduce((s,v) => s + (v-mean)*(v-mean), 0) / pcts.length);
        row.at[key] = {promote: Math.round(1000 * made / ${RUNS}) / 10,
                       median: Math.round(pcts[Math.floor(pcts.length/2)] * 10) / 10,
                       swing: Math.round(sd * 10) / 10};
      }
      row.ms = Date.now() - t0;
      out.sizes.push(row);
    }
  } catch(e){ out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'roomsize-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + src + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=3600000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], {maxBuffer: 512*1024*1024, encoding: 'utf8'});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }

console.log('Division ' + out.div + ', cut share ' + (out.share*100).toFixed(1) + '%, ' +
            out.runs + ' cups a row');
console.log('room   cut |  at band: promote  median  swing |  +7: promote  median  swing');
out.sizes.forEach(r => {
  const f = a => String(a.promote).padStart(6) + '%' + String(a.median).padStart(8) +
                 String(a.swing).padStart(7);
  console.log(String(r.size).padStart(4) + String(r.cut).padStart(6) + ' |' +
              f(r.at.atBand) + ' |' + f(r.at.plus7) + '  ' + Math.round(r.ms/1000) + 's');
});
fs.rmSync(dir, {recursive: true, force: true});
