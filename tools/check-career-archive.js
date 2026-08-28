// A past season is read off what was played, not off its number.
//
// The archive worked the format out from the parity of the season number —
// season two is even, so season two was trios. That rule is a day younger than
// the saves: a career that played its second year in a duo opened the tile and
// read "a trios season", with its own Major won by two people printed under the
// line saying so. His screenshot, 20 August: "тут написано что сезон трио, а я
// был в дуо?".
//
// So the size is recorded at the season boundary and read back per season, and
// a season with no record reads as duos — the same reading careerSquadSize
// already gives a save from before the rule. The other half of the same tile:
// a log entry carried one handle, so the player's own winning team came out a
// duo in a season of threes. It carries the whole seat now.
//
//   node tools/check-career-archive.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // A career standing in season \`now\`, with \`log\` behind it and whatever the
    // save happens to have recorded about the years it played.
    const seed = (now, log, sizes, size) => { CAREER = {
      player:{nick:'Gbzin', ovr:93, ovrExact:93, region:'EU', role:'roleIGL',
              country:'de', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
      career:{season:now, day:'2026-02-02', division:1, earnings:0, balance:0,
              tokens:[], log:log||[], news:[], form:0, grind:0,
              size:(size||2), sizes:sizes, seasonOver:true},
      dms:[], partners:[], gear:{own:[], train:0}}; };
    // The format row of the archive tile, as the screen draws it.
    const formatRow = sn => { CH_ARC_S=sn;
      const m=careerArchiveHTML().match(/<div class="ch-row"><em>([^<]*)<\\/em><b>([^<]*)<\\/b><\\/div>/);
      return m ? {label:m[1].trim(), value:m[2].trim()} : null; };

    // ---- a save from before the rule: every season it played was duos -----
    seed(3, [], undefined, 2);
    check('a season with no record reads as duos, whatever its number',
          careerSeasonSize(2) === 2, 'season 2 read as ' + careerSeasonSize(2));
    const r2 = formatRow(2);
    out.notes.oldSave = r2;
    check('and the tile says so', r2 && r2.value === L().ccSeasonDuos,
          r2 ? r2.value : 'no row drawn');
    check('the row is labelled for what it is, not for the hub tab',
          r2 && r2.label === L().ccSeasonFormat, r2 ? r2.label : '-');

    // ---- what the boundary writes down ------------------------------------
    seed(1, [], undefined, 2);
    CAREER.career.seasonOver = true;
    careerNewSeason();
    out.notes.recorded = {sizes: JSON.parse(JSON.stringify(CAREER.career.sizes||{})),
                          season: CAREER.career.season, size: CAREER.career.size};
    check('the year that ended is written down', CAREER.career.sizes[1] === 2,
          String(CAREER.career.sizes[1]));
    check('and so is the one that starts', CAREER.career.sizes[2] === 3,
          String(CAREER.career.sizes[2]));
    check('the new year is the alternating rule', careerSquadSize() === 3,
          String(careerSquadSize()));

    // ---- and the archive reads it back ------------------------------------
    seed(3, [], {1:2, 2:3}, 2);
    check('a recorded trios season reads as trios', careerSeasonSize(2) === 3,
          String(careerSeasonSize(2)));
    const r3 = formatRow(2);
    out.notes.recordedTrios = r3;
    check('and the tile says trios', r3 && r3.value === L().ccSeasonTrios,
          r3 ? r3.value : 'no row drawn');
    // The season standing now is read off the career, not off the record.
    seed(2, [], {}, 3);
    check('the season being played reads off the career itself',
          careerSeasonSize(2) === 3, String(careerSeasonSize(2)));

    // ---- the player's own team is the whole seat --------------------------
    // A trios season won by three people, recorded the way the log records it.
    const won = (season, day, mates) => ({season:season, day:day, div:1, place:1,
      of:33, pts:400, passed:true, ovr:93, games:6, wins:2, elims:20, avg:5,
      mate:mates[0]||null, mates:mates, prize:1000, kind:'major', stage:'final'});
    seed(3, [won(2, '2026-04-11', ['Cr1nge','Twi'])], {2:3}, 2);
    const a3 = careerArchiveSeason(2);
    const mineRow = a3.regional.map(ev => ev.perReg[ccCareerRegion()]).find(w => w.you);
    out.notes.trioTeam = mineRow ? mineRow.name : null;
    check('a trios season prints the whole seat',
          mineRow && mineRow.name === 'Gbzin & Cr1nge & Twi',
          mineRow ? mineRow.name : 'the player won nothing the archive found');

    // ---- a save written before that still reads ---------------------------
    const old = won(2, '2026-04-11', ['Cr1nge']);
    delete old.mates;
    seed(3, [old], {2:2}, 2);
    const a4 = careerArchiveSeason(2);
    const oldRow = a4.regional.map(ev => ev.perReg[ccCareerRegion()]).find(w => w.you);
    out.notes.oldTeam = oldRow ? oldRow.name : null;
    check('an entry with one handle reads as it always did',
          oldRow && oldRow.name === 'Gbzin & Cr1nge',
          oldRow ? oldRow.name : 'the player won nothing the archive found');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccarc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a past season is read off what was played');
fs.rmSync(dir, { recursive: true, force: true });
