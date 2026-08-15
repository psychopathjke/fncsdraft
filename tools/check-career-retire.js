// The end of a career: the door that opens when the growth stops, the one that
// opens under the ladder's floor whether or not the player wanted it, and the
// screen that says what the career amounted to.
//
//   node tools/check-career-retire.js
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
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  const seed = (age, ovr, extra) => {
    const cr = Object.assign({season:3, day:CC_YEAR_TO, division:1, earnings:250000,
      wages:9000, balance:250000, reach:41000, tokens:[], news:[],
      orgs:['Detect Esports','BIG'],
      ewc:[{series:2, place:1}],
      log:[
        {season:1, day:'2026-02-10', div:4, place:12, of:150, kind:'cup', ovr:71, wins:1, prize:0},
        {season:2, day:'2026-04-25', div:1, place:6,  of:50,  kind:'major', stage:'final', ovr:93, wins:2, prize:30000},
        {season:2, day:'2026-02-07', div:1, place:3,  of:50,  kind:'final', ovr:92, wins:1, prize:3000},
        {season:3, day:'2026-08-20', div:1, place:9,  of:20,  kind:'rc', stage:'final', ovr:95, wins:0, prize:26000}
      ]}, extra||{});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Veteran', age:age, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:ovr, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:cr, partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(ovr, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const save = () => JSON.parse(localStorage.getItem('fncsdraft_career'));

  try{
    // ---- the age is the scene's, not the curve's -------------------------
    // It used to be read off careerDevelopBase — the age development turns
    // negative at, which is 37, a footballer's arc. FNCS is played and won by
    // teenagers, so thirty is the number, and a career is still improving when
    // it gets there: retiring is a decision rather than the curve's verdict.
    const at = careerRetireAge();
    if (at !== 30) fail('the retirement age is ' + at + ', it should be thirty');
    out.steps.push('retirement opens at ' + at + ', the number the scene has');
    if (careerRetireFloor() !== CC_DIV_RATING[5]) fail('the floor is not the ladder\\'s own');
    out.steps.push('the floor is ' + careerRetireFloor() + ', the rating a career is created at');

    // ---- too young to be offered it --------------------------------------
    seed(at-1, 90, {seasonOver:true});
    if (careerMayRetire()) fail('a player under the age was offered retirement');
    careerTab('centre');
    if (document.querySelector('#chBody .ch-retire')) fail('the retire button is on screen too early');
    out.steps.push('at ' + (at-1) + ': no retire button');

    // ---- old enough, and the button is there beside a new season ---------
    seed(at, 90, {seasonOver:true});
    if (!careerMayRetire()) fail('an eligible player was not offered retirement');
    careerTab('centre');
    const rb = document.querySelector('#chBody .ch-retire');
    const nb = document.querySelector('#chBody .ch-play[onclick*="careerNewSeason"]');
    if (!rb) fail('no retire button at the boundary');
    if (!nb) fail('retiring replaced the option to play on — it should sit beside it');
    out.steps.push('at ' + at + ': "' + rb.textContent.trim() + '" beside "' + nb.textContent.trim() + '"');

    // ---- mid-season it is not offered at all -----------------------------
    seed(at, 90, {seasonOver:false, day:'2026-05-04'});
    careerTab('centre');
    if (document.querySelector('#chBody .ch-retire')) fail('retiring was offered in the middle of a season');
    out.steps.push('mid-season: not offered, a career stops at a boundary');

    // ---- retiring, and what the screen says ------------------------------
    seed(at, 90, {seasonOver:true});
    careerRetire(false);
    const s1 = save();
    if (!s1.retired) fail('retiring recorded nothing');
    if (s1.retired.forced) fail('a voluntary retirement was marked forced');
    careerTab('centre');
    const over = document.querySelector('#chBody .cc-over');
    if (!over) fail('the summary screen did not draw');
    const big = document.querySelector('#chBody .cc-over-big b').textContent.trim();
    const sm = careerSummary();
    if (+big !== sm.peak) fail('the headline number is ' + big + ', the peak is ' + sm.peak);
    if (sm.peak !== 95) fail('the peak should be 95, the best rating in the log, got ' + sm.peak);
    if (sm.topDiv !== 1) fail('the highest division should be 1, got ' + sm.topDiv);
    if (sm.bestMajor !== 6) fail('the best Major final should be #6, got ' + sm.bestMajor);
    if (sm.bestWf !== 3) fail('the best Weekly Final should be #3, got ' + sm.bestWf);
    if (sm.paris !== 9) fail('Paris should read #9, got ' + sm.paris);
    if (sm.seats !== 1) fail('one seat was earned, summary says ' + sm.seats);
    if (sm.orgs.length !== 2) fail('two clubs were played for, summary says ' + sm.orgs.length);
    out.steps.push('summary: peak ' + sm.peak + ', division ' + sm.topDiv + ', major #' + sm.bestMajor +
      ', weekly #' + sm.bestWf + ', Paris #' + sm.paris + ', ' + sm.orgs.length + ' clubs');
    const hon = document.querySelectorAll('#chBody .cc-hon').length;
    if (hon < 4) fail('only ' + hon + ' honours drawn from a career with five');
    out.steps.push('honours drawn: ' + hon);
    // the other tabs still open
    careerTab('log');
    if (!document.getElementById('chBody').textContent.trim()) fail('the history tab is empty after retiring');
    careerTab('social');
    if (!document.getElementById('chBody').textContent.trim()) fail('the feed is empty after retiring');
    out.steps.push('history and feed still open on a finished career');
    // and there is no next week to play
    careerTab('centre');
    if (document.querySelector('#chBody .ch-play[onclick*="careerPlay"]'))
      fail('a finished career still offers a tournament');
    if (!document.querySelector('#chBody .ch-play[onclick*="careerWipe"]'))
      fail('no way to start again');
    out.steps.push('no next week, and a new career is offered');

    // ---- under the floor the year does not start -------------------------
    seed(at-6, careerRetireFloor()-1, {seasonOver:true});
    if (!careerMustRetire()) fail('a rating under the floor did not force the end');
    careerNewSeason();
    const s2 = save();
    if (!s2.retired) fail('the season boundary let an under-floor career carry on');
    if (!s2.retired.forced) fail('a forced end was not marked as one');
    if (s2.career.season !== 3) fail('a forced end still started the next season');
    careerTab('centre');
    if (!document.querySelector('#chBody .cc-over-why')) fail('the summary does not say why it ended');
    out.steps.push('under the floor at ' + (at-6) + ': the year does not start, and the screen says why');

    // ---- above the floor the boundary behaves as it did ------------------
    seed(at-6, 90, {seasonOver:true, division:1});
    careerTable().rows['Veteran'] = {pts:99999, weeks:20, best:1, wins:9, you:true};
    careerNewSeason();
    const s3 = save();
    if (s3.retired) fail('a healthy career was retired at the boundary');
    if (s3.career.season !== 4) fail('the next season did not start');
    out.steps.push('above the floor: season ' + s3.career.season + ' starts as before');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccretire-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('a career can end, on its own terms or on the ladder\'s');
