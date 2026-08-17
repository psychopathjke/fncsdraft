// What a big rating gap is actually worth over one cup.
//
// The ladder calibration measures a career sitting at, near or a little over its
// division's band - the range a career actually walks through. It never measures
// the other case: a card taken out of Division 1 and dropped into Division 4,
// where the gap is not four points but thirty-five.
//
// One screenshot asked the question. Sky and Scroll, 96 and 93, played a
// Division 4 cup of 500 and finished third behind two generated duos rated about
// 61 - "how can somebody in Division 4 be above the best duo in the world".
// This reports where that duo actually lands over many cups, so the answer is a
// distribution rather than an impression.
//
// Run: node tools/career-gap-calibration.js [runs] [division]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = parseInt(process.argv[2] || '30', 10);
const DIV = parseInt(process.argv[3] || '4', 10);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {runs: ${RUNS}, div: ${DIV}, rows: [], error: null};
  try{
    CARD_MODE = true; squadSize = 2;
    const mk = (ovr, nick, role) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'gap', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, role || 'roleIGL')});

    // The pairs worth reading: the screenshot's own duo, the same gap without a
    // weaker partner, and the band itself as the control.
    const band = CC_DIV_RATING[${DIV}];
    const PAIRS = [[96, 93], [96, 96], [band + 7, band + 7], [band, band]];
    for (const [a, b] of PAIRS) {
      const row = {you: a + '/' + b, places: [], won: 0, top3: 0, missedCut: 0};
      for (let r = 0; r < ${RUNS}; r++) {
        const me = mk(a, 'GAP_YOU', 'roleIGL');
        const mate = mk(b, 'GAP_MATE', 'roleFRG');
        CAREER = {player: {}, career: {season: 1, week: (r % 4) + 1, division: ${DIV}}, partner: null};
        const you = careerTeam([me, mate]);
        you.isYou = true; you.name = 'you';
        const field = [you].concat(careerCupField(CAREER.career, [me, mate], careerCupSize(${DIV})));
        if (!row.fieldSize) {
          const ovrs = [];
          field.forEach(t => t.squad.forEach(p => { if (p.handle.indexOf('GAP_') !== 0) ovrs.push(attrsFor(p).ovr); }));
          row.fieldSize = field.length;
          row.fieldOvr = Math.round(ovrs.reduce((s, v) => s + v, 0) / ovrs.length * 10) / 10;
          row.fieldTop = Math.max.apply(null, ovrs);
        }
        await simulateGamesRandomLobbies(field, CAREER_CUP_GAMES, 50, pointsForPlace, 4);
        const ranked = field.slice().sort((x, y) => y.stagePts - x.stagePts || y.stageElims - x.stageElims);
        const place = ranked.indexOf(you) + 1;
        row.places.push(place);
        if (place === 1) row.won++;
        if (place <= 3) row.top3++;
        if (place > careerCupCut(${DIV})) row.missedCut++;
      }
      const s = row.places.slice().sort((x, y) => x - y);
      row.best = s[0]; row.worst = s[s.length - 1];
      row.median = s[Math.floor(s.length / 2)];
      row.mean = Math.round(s.reduce((t, v) => t + v, 0) / s.length * 10) / 10;
      delete row.places;
      out.rows.push(row);
    }
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BE' + 'GIN' + encodeURIComponent(JSON.stringify(out)) + 'E' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsgap-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }
const r0 = out.rows[0];
console.log('Division ' + out.div + ': ' + r0.fieldSize + ' duos, field mean OVR ' +
            r0.fieldOvr + ', best in the room ' + r0.fieldTop + ' - ' + out.runs + ' cups each');
console.log('duo        best  median  mean  worst   won   top3   missed the cut');
out.rows.forEach(r => {
  const pct = n => (100 * n / out.runs).toFixed(0) + '%';
  console.log(String(r.you).padEnd(11) + String(r.best).padStart(4) +
    String(r.median).padStart(8) + String(r.mean).padStart(6) +
    String(r.worst).padStart(7) + pct(r.won).padStart(6) +
    pct(r.top3).padStart(7) + pct(r.missedCut).padStart(17));
});
fs.rmSync(dir, { recursive: true, force: true });
