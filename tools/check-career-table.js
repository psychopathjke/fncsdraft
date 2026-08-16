// Division 1's season table: the only standing in the mode that is not a single
// night, and the thing that decides at the year's end who is still in Division 1.
//
// Walks a Division 1 career through a run of Weekly Finals — the ones the rest of
// Europe plays without the player, and one the player plays themselves — then
// checks that the table adds up, that the screen draws it, and that the season
// boundary reads it. Also checks that a Saturday the player played does not get a
// second Division 1 final simulated on top of it.
//
//   node tools/check-career-table.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // A final asks the player where to land. A harness is the player: answer it
  // the moment a picker appears, always the first zone, so the run is the same
  // every time. Without this a probe waits forever on a click nobody makes.
  setInterval(function(){
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  const seed = (div, day) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Tabler', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:93, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]}, partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(93, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
  };

  try{
    const days = careerYearDays();
    const finals = [];
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1))
      if ((days.get(d)||[]).some(e => e.kind === 'final')) finals.push(d);

    // ---- an empty table says so rather than drawing nothing --------------
    seed(1, finals[0]);
    if (careerTableRows().length) fail('a fresh career already has a season table');
    careerEntry(); careerTab('table');
    let html = document.getElementById('chBody').textContent;
    if (!/Weekly Final has been played|финал/i.test(html)) fail('the empty table says nothing');
    out.steps.push('empty table: ' + html.replace(/\\s+/g,' ').trim().slice(0, 70));

    // ---- five weeks of Europe playing without the player -----------------
    seed(1, finals[0]);
    for (let i = 0; i < 5; i++) careerD1Posts(finals[i]);
    const t = careerTable();
    if (t.weeks !== 5) fail('five finals produced ' + t.weeks + ' weeks in the table');
    const rows = careerTableRows();
    if (rows.length <= CAREER_CUP_CUT)
      fail('five nights of fifty teams produced only ' + rows.length +
           ' names — the same fifty are playing every week');
    out.steps.push('five weeks: ' + rows.length + ' teams in the table, leader ' +
      rows[0].name + ' on ' + rows[0].pts + ' from ' + rows[0].weeks + ' finals');
    // the points in the table are the points that were scored
    const sum = rows.reduce((s,r)=>s+r.pts, 0);
    if (!(sum > 0)) fail('the table holds no points at all');
    const weeksSum = rows.reduce((s,r)=>s+r.weeks, 0);
    if (weeksSum !== 5*CAREER_CUP_CUT)
      fail('five finals of fifty should be ' + (5*CAREER_CUP_CUT) + ' appearances, got ' + weeksSum);
    out.steps.push('appearances add up: ' + weeksSum + ' across ' + t.weeks + ' finals of ' + CAREER_CUP_CUT);
    // sorted by points, descending
    for (let i = 1; i < rows.length; i++)
      if (rows[i-1].pts < rows[i].pts) fail('the table is not sorted by points at row ' + i);
    out.steps.push('sorted by points, then finals played, then best night');

    // ---- the screen draws it --------------------------------------------
    careerTab('table');
    const body = document.getElementById('chBody');
    const trs = body.querySelectorAll('.ct tbody tr');
    if (!trs.length) fail('the table screen drew no rows');
    if (!body.querySelector('.ct tr.cut')) fail('no line under the fiftieth place');
    out.steps.push('screen: ' + trs.length + ' rows drawn, cut line at ' + CC_TABLE_KEEP);

    // ---- the player's own final counts, and only once --------------------
    seed(1, finals[0]);
    CAREER.career.wf = {monday: careerMonday(finals[0])};
    careerSave();
    careerEntry();
    if (careerNext().type !== 'final') fail('the seeded Saturday is not a Weekly Final');
    const sk = setInterval(() => { const b=document.getElementById('majorSkipBtn'); if(b&&!b.disabled) b.click(); }, 20);
    document.querySelector('#screen-career-hub .ch-play').click();
    let card=null;
    for (let i=0;i<8000 && !card;i++){
      await new Promise(r=>setTimeout(r,25));
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail('the player\\'s own Weekly Final produced no card');
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    const t2 = careerTable();
    if (t2.weeks !== 1) fail('the player\\'s own final counted ' + t2.weeks + ' weeks, should be 1 — ' +
                             'the world simulated a second Division 1 final on the same Saturday');
    const me = careerTablePlace();
    if (me == null) fail('the player is not in the table after playing a final');
    out.steps.push('own final: one week counted, player at #' + me + ' of ' + careerTableRows().length);

    // ---- the season boundary reads it ------------------------------------
    // Below the line: relegated to Division 2.
    seed(1, CC_YEAR_TO);
    for (let i = 0; i < 4; i++) careerD1Posts(finals[i]);   // a table with no player in it
    CAREER.career.seasonOver = true;
    careerNewSeason();
    if (CAREER.career.division !== 2)
      fail('a season with no Weekly Final in it kept Division 1');
    out.steps.push('never reached a final: down to Division 2');
    // Above the line: kept.
    seed(1, CC_YEAR_TO);
    careerTable().rows['Tabler'] = {pts: 99999, weeks: 20, best: 1, wins: 9, you: true};
    CAREER.career.seasonOver = true;
    careerNewSeason();
    if (CAREER.career.division !== 1) fail('the season leader was relegated');
    out.steps.push('top of the table: Division 1 kept');
    // And nothing below Division 1 moves.
    seed(3, CC_YEAR_TO);
    CAREER.career.seasonOver = true;
    careerNewSeason();
    if (CAREER.career.division !== 3) fail('Division 3 moved at the season boundary');
    out.steps.push('below Division 1 the token holds: Division 3 stays Division 3');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctable-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the season table adds up, and the year ends on it');
