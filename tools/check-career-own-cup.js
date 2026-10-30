// Свой турнир: инвайт, трио с выбранными тиммейтами, квалы и финал на два дня, призовые у всех, отмена.
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
    const fresh = (bal, ovr) => {
      seed(4, '2026-03-02', ovr || 72);
      const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
      s.career.balance = bal; s.career.reach = 50000;
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      careerEntry(); ccProbeSeat();
    };
    const announce = (draft, label) => {
      if (ccOwnWhy()) fail(label + ': hosting refused: ' + ccOwnWhy());
      ccOwnOpen();
      const free = ccOwnFreeDays(draft.entry === 'open');
      if (!free.length) fail(label + ': no free days to host on');
      Object.assign(CC_OWN_DRAFT, draft, {day: free[0]});
      const bal0 = CAREER.career.balance;
      const c = ccOwnCreate();
      if (!c) fail(label + ': the tournament was not created');
      if (CAREER.career.balance !== bal0 - draft.pool) fail(label + ': the pool did not leave the balance');
      if (!(careerYearDays().get(c.day)||[]).some(e => e.kind === 'victory' && e.id === c.id)) fail(label + ': ' + c.day + ' is not on the calendar');
      return c;
    };
    const playOn = async (day, id, label) => {
      careerSkipTo(day); ccProbeSeat();
      if (careerNext().type !== 'victory') fail(label + ': the hub on ' + day + ' offers ' + careerNext().type);
      if (careerVictoryOn(day).id !== id) fail(label + ': another cup took ' + day);
      if (!careerCanPlayKind('victory')) fail(label + ': cannot enter on ' + day);
      document.querySelectorAll('#majorStages .stage-card').forEach(c => c.remove());
      const card = await playThrough(label);
      const head = card.textContent.replace(/\s+/g, ' ').slice(0, 160);
      card.querySelector('button[onclick*="careerBackToHub"]').click();
      const row = (JSON.parse(localStorage.getItem('fncsdraft_career')).career.log||[]).filter(r => r.day === day).slice(-1)[0];
      if (!row || row.kind !== 'victory') { const lg=(JSON.parse(localStorage.getItem('fncsdraft_career')).career.log||[]).slice(-3).map(r=>r.day+':'+r.kind+':'+r.place+'/'+r.of); fail(label + ': no history row for ' + day + ' · card: ' + head + ' · log: ' + lg.join(' | ') + ' · today ' + careerToday()); }
      return {row, head};
    };

    // Инвайт соло: 50 человек, 4 игры, призовые у всех.
    fresh(200000);
    const inv = announce({name:'Probe Invitational', mode:'solo', entry:'invite', size:50, games:4, pool:10000, shape:'top'}, 'invite solo');
    if (inv.payT.EU.length !== 50) fail('a 50-player solo invite pays ' + inv.payT.EU.length + ' places, should be all 50');
    const r1 = (await playOn(inv.day, inv.id, 'invite solo')).row;
    if (r1.of !== 50 || r1.games !== 4) fail('invite played ' + r1.of + ' players, ' + r1.games + ' games');
    if (!(r1.prize > 0)) fail('everyone in the invite is paid, the host got $' + r1.prize);
    out.steps.push('invite solo: #' + r1.place + ' of 50, 4 games, $' + r1.prize);

    // Призовые на 100 человек: 100 соло, 50 дуо, 33 трио, 25 сквадов.
    const want = {solo:100, duo:50, trio:33, squad:25};
    Object.keys(want).forEach(m => { const n = ccOwnPayT({mode:m, entry:'open', pool:10000, shape:'even'}).EU.length;
      if (n !== want[m]) fail(m + ' final pays ' + n + ' teams, should be ' + want[m]); });
    out.steps.push('a 100-player final pays 100 solo / 50 duo / 33 trio / 25 squad');
    // «Победителю больше»: первый берёт половину, дальше строго по убыванию.
    { const t = ccOwnPayT({mode:'solo', entry:'open', pool:100000, shape:'top'}).EU;
      if (t[0][1] !== 50000) fail('the winner should take half of $100,000, got $' + t[0][1]);
      if (t.some((r, i) => i && r[1] > t[i-1][1])) fail('prizes go up somewhere down the table');
      out.steps.push('winner-takes-more: #1 $' + t[0][1] + ', #2 $' + t[1][1] + ', #100 $' + t[99][1]); }
    // Подиум 35/20/12 и топ-10 с 70%: суммы не больше фонда, по убыванию, платят всем.
    for (const shape of ['podium', 'top10', 'even']) {
      const t = ccOwnPayT({mode:'solo', entry:'open', pool:100000, shape}).EU, sum = t.reduce((x, r) => x + r[1], 0);
      if (t.length !== 100 || sum > 100000 || t.some((r, i) => i && r[1] > t[i-1][1]) || !(t[99][1] > 0)) fail(shape + ' table is off: sum ' + sum);
      if (sum < 97000) fail(shape + ' pays out only $' + sum + ' of $100,000');
      const odd = t.filter(r => r[1] >= 100 && r[1] % 10).map(r => r[1]); if (odd.length) fail(shape + ' has uneven amounts: ' + odd.slice(0, 5));
      if (shape === 'podium' && (t[0][1] !== 35000 || t[1][1] !== 20000 || t[2][1] !== 12000)) fail('podium is not 35/20/12: ' + t.slice(0, 3).map(r => r[1]));
      if (shape === 'top10') { const top = t.slice(0, 10).reduce((x, r) => x + r[1], 0); if (top < 69000 || top > 71000) fail('top 10 should share 70%, got $' + top); }
      out.steps.push(shape + ': #1 $' + t[0][1] + ', #10 $' + t[9][1] + ', #100 $' + t[99][1]);
    }

    // Трио в соло-году с выбранными тиммейтами.
    fresh(200000);
    const pool = ccOwnPool();
    const picks = [pool[3].handle, pool[7].handle];
    ccOwnOpen(); Object.assign(CC_OWN_DRAFT, {mode:'trio', team:'pick', roster:picks.slice(0, 1)});
    if (ccOwnCreate()) fail('a trio with one of two teammates picked was accepted');
    ccOwnClose();
    const tri = announce({name:'Probe Trios', mode:'trio', entry:'invite', size:50, games:4, pool:15000, shape:'even', team:'pick', roster:picks}, 'trio invite');
    const before = JSON.stringify({p:(CAREER.partners||[]).map(r => ccMateCardOf(r) && ccMateCardOf(r).handle), r:CAREER.rosters||{}, size:careerSquadSize()});
    const r2 = (await playOn(tri.day, tri.id, 'trio invite')).row;
    const after = JSON.stringify({p:(CAREER.partners||[]).map(r => ccMateCardOf(r) && ccMateCardOf(r).handle), r:CAREER.rosters||{}, size:careerSquadSize()});
    if (before !== after) fail('the own trio changed the regular roster: ' + before + ' -> ' + after);
    if ((CAREER.partners||[]).some(r => r && r.standin)) fail('a stand-in from the own cup stayed in the roster');
    out.steps.push('after the own trio the regular roster is back: ' + after);
    const mates = JSON.stringify(r2);
    if (!picks.every(h => mates.toLowerCase().indexOf(h.toLowerCase()) >= 0)) fail('picked teammates did not play: ' + mates + ' vs ' + picks.join(','));
    out.steps.push('trio with picked ' + picks.join(' + ') + ': #' + r2.place + ' of ' + r2.of + ', $' + r2.prize);

    // Квалы: хозяин сразу в финале на следующий день, квал для него не играется.
    fresh(200000);
    const fin = announce({name:'Probe Open', mode:'solo', entry:'open', games:6, pool:20000, shape:'even'}, 'open');
    if (fin.finalOf) fail('a new qualifier tournament still makes the host play the qualifier');
    if (fin.qualDay !== ccAddDays(fin.day, -1)) fail('the final is not the day after the qualifier: ' + fin.qualDay + ' / ' + fin.day);
    if ((careerYearDays().get(fin.qualDay)||[]).some(e => e.kind === 'victory' && String(e.id).indexOf(fin.id) === 0)) fail('the qualifier day offers the host a game');
    const f = await playOn(fin.day, fin.id, 'final');
    if (f.row.of !== 100) fail('the final lobby is ' + f.row.of + ', should be 100');
    if (!(f.row.prize > 0)) fail('the host played the final and got $0');
    out.steps.push('host goes straight to the final: #' + f.row.place + ' of 100, $' + f.row.prize);

    // Пул меньше минимума и отмена.
    fresh(50000);
    ccOwnOpen(); Object.assign(CC_OWN_DRAFT, {pool:9000});
    if (ccOwnCreate()) fail('a $9,000 pool was accepted'); ccOwnClose();
    const cx = announce({name:'Probe Cancel', mode:'solo', entry:'open', games:6, pool:10000, shape:'top'}, 'cancel');
    ccOwnCancel(cx.id);
    if (CAREER.career.balance !== 50000) fail('cancelling did not refund the pool: ' + CAREER.career.balance);
    if (CAREER.career.ownCups.some(x => !x.off)) fail('a cancelled cup left a day on the calendar');
    out.steps.push('pool under $10,000 refused; cancel refunds and clears both days');
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
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
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
