// Ten eliminations is what a Reload match pays for, however many you get.
//
// His rule, 17 August: "там же лимит по килам… максимум 10 — типа можно больше,
// но считает только за 10". Measured against Epic's own Opens leaderboards on
// the same day: shxrk & t3eny scored 991 over twenty-four matches with 351
// eliminations, and at two apiece uncapped that is 702 points of kills alone,
// leaving forty-nine for twenty non-winning matches at an eleventh-place
// average. With ten a match it leaves three hundred and eleven — fifteen and a
// half a match, which is what the placement table pays at eleventh. Three more
// duos on the same board close the same way.
//
// This holds the arithmetic itself rather than a career: the eliminations are
// still counted and still shown, and only what they are worth stops at ten.
//
//   node tools/check-career-killcap.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // Off the circuit, every elimination is worth what it is worth.
    CC_KILL_CAP = 0; CARD_MODE = false;
    check('a Major match pays for every elimination', ccKillPts(14, 2) === 28,
          String(ccKillPts(14, 2)));

    // On it, the tenth is the last one that pays.
    CC_KILL_CAP = CC_RELOAD_KILL_CAP;
    out.notes.cap = CC_RELOAD_KILL_CAP;
    check('the cap is ten', CC_RELOAD_KILL_CAP === 10, String(CC_RELOAD_KILL_CAP));
    check('nine pay nine', ccKillPts(9, 2) === 18, String(ccKillPts(9, 2)));
    check('ten pay ten', ccKillPts(10, 2) === 20, String(ccKillPts(10, 2)));
    check('eleven pay ten', ccKillPts(11, 2) === 20, String(ccKillPts(11, 2)));
    check('twenty pay ten', ccKillPts(20, 2) === 20, String(ccKillPts(20, 2)));
    check('and a heat pays three for each of the ten', ccKillPts(19, 3) === 30,
          String(ccKillPts(19, 3)));
    CC_KILL_CAP = 0;

    // Epic's own board, reconstructed. Four duos off the S39 cup 2 Opens in
    // Europe, read on 17 August: points, Victory Royales, matches, the sum of
    // their placements and their eliminations. With the cap the placement points
    // left over land on the table at the placement they actually averaged; with
    // no cap they do not land anywhere.
    const board = [
      {p:1039, w:8,  m:18, pl:82,  el:188},
      {p:1000, w:4,  m:22, pl:174, el:257},
      {p:991,  w:4,  m:24, pl:220, el:351},
      {p:984,  w:2,  m:18, pl:78,  el:158}
    ];
    const table = R_PLACEMENT.r2;
    const pays = place => place <= table.length ? table[place - 1] : 0;
    const rows = board.map(function(r){
      // Eliminations are spread evenly across the matches, which is the only
      // assumption here and the one the cap is least sensitive to.
      const per = r.el / r.m;
      const capped = Math.min(per, CC_RELOAD_KILL_CAP) * r.m;
      const rest = r.m - r.w;                       // matches that were not won
      const avgRest = (r.pl - r.w) / rest;          // and where they finished
      const left = (n) => (r.p - r.w * pays(1) - 2 * n) / rest;
      return {avgPlace: +avgRest.toFixed(1), tablePays: pays(Math.round(avgRest)),
              withCap: +left(capped).toFixed(1), noCap: +left(r.el).toFixed(1)};
    });
    out.notes.board = rows;
    rows.forEach(function(r, i){
      // Within a third of what the table pays at that placement: the elimination
      // spread is even here and it is not in life, so this is a shape check
      // rather than an equality.
      const near = Math.abs(r.withCap - r.tablePays) <= Math.max(6, r.tablePays * 0.35);
      check('row ' + (i+1) + ' closes with the cap', near,
            r.withCap + ' left a match at place ' + r.avgPlace + ', table pays ' + r.tablePays);
    });
    // And the row that made the cap visible: uncapped it leaves almost nothing.
    check('the twenty-four match row is impossible without it',
          rows[2].noCap < rows[2].tablePays / 2,
          rows[2].noCap + ' against a table that pays ' + rows[2].tablePays);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncscap-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a Reload match pays for ten eliminations, and you may have more');
fs.rmSync(dir, { recursive: true, force: true });
