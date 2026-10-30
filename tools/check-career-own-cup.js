// Свой турнир: объявить, дождаться дня, сыграть через интерфейс; инвайт и квалы, отмена с возвратом фонда.
//
//   node tools/check-career-own-cup.js
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
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"); if(document.getElementById("ccAskYes") && document.getElementById("ccAskYes").textContent===L().ccSpotGateSet){ careerSpotEnsure(); document.getElementById("ccAskModal").style.display="none"; careerPlay(); return; } } const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  // The seat is the player's to fill now: somebody free wrote, and the button
  // under their message seats them. Same door a player goes through.
  const ccProbeSeat = () => {
    if (careerPartnerCard()) return;
    const s = careerDms().find(x => x.state === 'offer' && !x.who.org && !x.who.brand);
    if (s) { careerDmAccept(s.id); careerRenderHub('centre'); }
  };
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  const seed = (div, day, ovr) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeMan', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:ovr, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], life:{rp:500}},   // ранг Diamond: порог капа проверяет check-career-life
      partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(ovr, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
  };
  // Press skip as soon as it exists and keep pressing: every stage re-enables it.
  const skipping = () => setInterval(() => {
    const b = document.getElementById('majorSkipBtn');
    if (b && !b.disabled) b.click();
  }, 20);
  const playThrough = async (what) => {
    const play = document.querySelector('#screen-career-hub .ch-play');
    if (!play || play.disabled) fail(what + ': the play button is not usable');
    if ((play.getAttribute('onclick')||'').indexOf('careerPlay') < 0)
      fail(what + ': the button skips the week instead of playing it — ' + play.getAttribute('onclick'));
    const sk = skipping();
    play.click();
    let card = null;
    for (let i = 0; i < 6000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail(what + ': no result card came back');
    return card;
  };

  try{
    // Свой турнир: объявить с баланса, дождаться дня, сыграть, увидеть строку в истории и выплату.
    const hostOne = async (draft, label) => {
      seed(4, '2026-03-02', 72);
      const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
      s.career.balance = 200000; s.career.reach = 50000;
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      careerEntry(); ccProbeSeat();
      if (ccOwnWhy()) fail(label + ': hosting refused: ' + ccOwnWhy());
      ccOwnOpen();
      const free = ccOwnFreeDays();
      if (!free.length) fail(label + ': no free days to host on');
      Object.assign(CC_OWN_DRAFT, draft, {day: free[0]});
      const bal0 = CAREER.career.balance;
      const c = ccOwnCreate();
      if (!c) fail(label + ': the tournament was not created');
      if (CAREER.career.balance !== bal0 - draft.pool) fail(label + ': the pool did not leave the balance');
      if (!(careerYearDays().get(c.day)||[]).some(e => e.kind === 'victory' && e.id === c.id))
        fail(label + ': ' + c.day + ' is not on the calendar');
      out.steps.push(label + ': announced for ' + c.day + ', pool $' + draft.pool);
      careerSkipTo(c.day);
      ccProbeSeat();
      const next = careerNext();
      if (next.type !== 'victory') fail(label + ': the hub on ' + c.day + ' offers ' + next.type);
      if (careerVictoryOn(c.day).id !== c.id) fail(label + ': another cup took the day');
      if (!careerCanPlayKind('victory')) fail(label + ': the host cannot enter their own cup');
      const card = await playThrough(label);
      card.querySelector('button[onclick*="careerBackToHub"]').click();
      const row = (JSON.parse(localStorage.getItem('fncsdraft_career')).career.log||[]).filter(r => r.day === c.day).slice(-1)[0];
      if (!row || row.kind !== 'victory') fail(label + ': no history row for the night');
      out.steps.push(label + ': #' + row.place + ' of ' + row.of + ', ' + row.games + ' games, $' + (row.prize||0));
      return row;
    };
    const inv = await hostOne({name:'Probe Invitational', mode:'solo', entry:'invite', size:50, games:4, pool:10000, split:'top10'}, 'invite solo');
    if (inv.of !== 50) fail('invite lobby of 50 played with ' + inv.of);
    if (inv.games !== 4) fail('invite with 4 games played ' + inv.games);
    await hostOne({name:'Probe Open', mode:'solo', entry:'open', pool:5000, split:'top3'}, 'open qualifier');
    // Отмена до дня возвращает фонд.
    seed(4, '2026-03-02', 72);
    { const s = JSON.parse(localStorage.getItem('fncsdraft_career')); s.career.balance = 20000; s.career.reach = 50000; localStorage.setItem('fncsdraft_career', JSON.stringify(s)); }
    careerEntry();
    ccOwnOpen(); Object.assign(CC_OWN_DRAFT, {pool:5000});
    const c = ccOwnCreate(); ccOwnCancel(c.id);
    if (CAREER.career.balance !== 20000) fail('cancelling did not refund the pool: ' + CAREER.career.balance);
    if ((careerYearDays().get(c.day)||[]).some(e => e.id === c.id)) fail('a cancelled cup stayed on the calendar');
    out.steps.push('cancel refunds the pool and clears the day');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccowncup-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('OK check-career-own-cup');
