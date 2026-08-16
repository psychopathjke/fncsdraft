// The prize-money table: who has won the most, read three ways — the Fortnite
// season being played, this career year, and everything the career has seen.
//
// Checks that the money in the table is the money the payout tables paid, that
// the three scopes slice the same cheques rather than counting different ones,
// and that a second career year replaying S40 does not add to the first one's.
//
//   node tools/check-career-money.js
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
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  const seed = (day, season) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Banker', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:94, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:season||1, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]}, partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(94, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
  };
  const total = scope => careerMoneyRows(scope).reduce((s,r)=>s+r.usd, 0);

  try{
    // ---- an empty table says so ------------------------------------------
    seed('2026-03-20');
    if (careerMoneyRows('all').length) fail('a fresh career already has prize money in it');
    careerEntry(); careerTab('table');
    if (!/Nobody has won|никто ничего/i.test(document.getElementById('chBody').textContent))
      fail('the empty money table says nothing');
    out.steps.push('empty: says so');

    // ---- a Weekly Final pays the whole room ------------------------------
    seed('2026-03-20');
    const sunday = (function(){
      const days = careerYearDays();
      for (let d = '2026-03-20'; d <= CC_YEAR_TO; d = ccAddDays(d,1))
        if ((days.get(d)||[]).some(e => e.kind === 'final')) return d;
      return null;
    })();
    if (!sunday) fail('no Weekly Final after 20 March');
    careerD1Posts(sunday);
    const rows = careerMoneyRows('all');
    if (!rows.length) fail('a Weekly Final paid nobody');
    // Epic's table pays down to fortieth and nothing after, so forty rows.
    if (rows.length !== 40)
      fail('one Weekly Final should pay forty teams, the table holds ' + rows.length);
    let want = 0; for (let i = 1; i <= 50; i++) want += wfPrize(i);
    if (total('all') !== want)
      fail('the table holds $' + total('all') + ', the payout table paid $' + want);
    out.steps.push('one Weekly Final: ' + rows.length + ' teams paid, $' +
      total('all').toLocaleString('en-US') + ' — the whole purse, to the dollar');
    if (rows[0].usd !== wfPrize(1)) fail('the leader is not on the winner\\'s cheque');
    out.steps.push('leader ' + rows[0].name + ' on $' + rows[0].usd.toLocaleString('en-US'));

    // ---- the three scopes slice the same money ----------------------------
    if (total('season') !== total('all')) fail('one season of money is not all of it yet');
    if (total('year') !== total('all')) fail('one year of money is not all of it yet');
    out.steps.push('season, year and all-time agree while there is only one of each');

    // ---- a second Fortnite season is a different slice --------------------
    CAREER.career.day = '2026-06-10';           // S41
    const s41 = (function(){
      const days = careerYearDays();
      for (let d = '2026-06-10'; d <= CC_YEAR_TO; d = ccAddDays(d,1))
        if ((days.get(d)||[]).some(e => e.kind === 'final')) return d;
      return null;
    })();
    careerD1Posts(s41);
    if (careerFncsSeason('2026-06-10').id !== 'S41') fail('10 June should be S41');
    if (total('all') !== want*2) fail('two finals should hold two purses');
    if (total('season') !== want)
      fail('S41 alone should hold one purse, holds $' + total('season'));
    if (total('year') !== want*2) fail('both finals fell in career year 1');
    out.steps.push('after a second final in S41: season $' + total('season').toLocaleString('en-US') +
      ', year $' + total('year').toLocaleString('en-US') +
      ', all time $' + total('all').toLocaleString('en-US'));

    // ---- and a second career year replaying S41 does not add to it --------
    CAREER.career.season = 2;
    careerD1Posts(s41);
    if (total('season') !== want)
      fail('career year 2 replaying S41 added to year 1\\'s S41: $' + total('season'));
    if (total('year') !== want) fail('year 2 should hold one purse, holds $' + total('year'));
    if (total('all') !== want*3) fail('all time should hold three');
    out.steps.push('career year 2, same Fortnite season: season $' +
      total('season').toLocaleString('en-US') + ', year $' + total('year').toLocaleString('en-US') +
      ', all time $' + total('all').toLocaleString('en-US'));

    // ---- the player's own row is their own earnings -----------------------
    // The first Weekly Final of the year is Sunday 8 February — the one final
    // in S39 that is not on a Saturday, which is why this is not the 7th.
    seed('2026-02-08');
    CAREER.career.wf = {monday: careerMonday('2026-02-08')};
    careerSave();
    careerEntry();
    if (careerNext().type !== 'final') fail('7 February should be a Weekly Final');
    const sk = setInterval(() => { const b=document.getElementById('majorSkipBtn'); if(b&&!b.disabled) b.click(); }, 20);
    document.querySelector('#screen-career-hub .ch-play').click();
    let card=null;
    for (let i=0;i<9000 && !card;i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail('the Weekly Final produced no card');
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    const me = careerMoneyRows('all').find(r=>r.you);
    const earned = CAREER.career.earnings||0;
    if (earned && (!me || me.usd !== earned))
      fail('the player earned $' + earned + ' but their row says $' + (me?me.usd:0));
    out.steps.push('own row and cr.earnings agree: $' + earned.toLocaleString('en-US') +
      (me ? ' at #' + careerMoneyPlace('all') : ' (unpaid, not in the table)'));

    // ---- the screen draws, and both standings share the tab ---------------
    careerTab('table');
    const body = document.getElementById('chBody');
    if (!body.querySelector('.cm')) fail('the money table did not draw');
    if (!body.querySelector('.ct:not(.cm)')) fail('the season table left the tab');
    // Two windows, not three: the tally still keeps an all-time figure and the
    // header reads it, but a standing that never resets is not shown.
    const tabs = body.querySelectorAll('.cm-tab').length;
    if (tabs !== 2) fail('two readings, ' + tabs + ' buttons');
    careerMoneyTab('year');
    if (!document.querySelector('#chBody .cm-tab.on')) fail('switching scope drew nothing');
    careerMoneyTab('all');
    if (document.querySelectorAll('#chBody .cm-tab.on').length !== 1)
      fail('an all-time scope should fall back to the season, and exactly one button should be lit');
    out.steps.push('screen: both standings on one tab, ' + tabs + ' scope buttons, switching redraws');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmoney-'));
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
console.log('the money adds up, and slices three ways without double-counting');
