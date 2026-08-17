// Duos change at the turn of a Fortnite season, not at the turn of the career
// year — the wiki's own season infoboxes put S40 on 19 March 2026 and S41 on
// 6 June, and a career year holds two of those turns.
//
// A duo holds unless the season went badly: careerMoodKey already draws the line
// at 45, and a partner below it at the break leaves. So does one who has outgrown
// the player by more than CAREER_DM_REACH.
//
//   node tools/check-career-duo.js
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
  const seed = (day, patience, mateOvr) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Duoman', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:2, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:{card:{handle:'Buddy', region:'EU', rating:mateOvr, _ovr:mateOvr,
                     nat:'de', tier:'ladder', event:'ladder', placement:null,
                     rarity:'common', partner:null},
               patience:patience}}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(80, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
  };
  const mate = () => { const c = careerPartnerCard(); return c ? c.handle : null; };
  const feed = () => (CAREER.career.news||[]).map(n => ccText(n));

  try{
    // ---- the dates are the wiki's, not the cups' -------------------------
    const s40 = CC_SEASONS.find(x=>x.id==='S40'), s41 = CC_SEASONS.find(x=>x.id==='S41');
    if (s40.from !== '2026-03-19') fail('S40 begins 19 March 2026, table says ' + s40.from);
    if (s41.from !== '2026-06-06') fail('S41 begins 6 June 2026, table says ' + s41.from);
    // and they are not the cup dates
    const cupRow = CC_CUP_WEEKS.find(r => r[0] === 'S40_FNCSDivisionalCup');
    if (cupRow[1] === s40.from) fail('the season start and the first cup are the same date — check the source');
    out.steps.push('S40 opens ' + s40.from + ', its first cup is ' + cupRow[1] + ' — a duo forms at the season');
    if (careerFncsSeason('2026-03-18').id !== 'S39') fail('18 March should still be S39');
    if (careerFncsSeason('2026-03-19').id !== 'S40') fail('19 March should be S40');
    out.steps.push('the boundary falls between 18 and 19 March');

    // ---- a happy duo runs it back ----------------------------------------
    seed('2026-03-18', 70, 80);
    const before = mate();
    careerAdvanceTo('2026-03-19');
    if (mate() !== before) fail('a happy duo was broken up: ' + before + ' -> ' + mate());
    const f1 = feed();
    if (!f1.some(t => /running it back|тем же составом/i.test(t)))
      fail('a duo that held said nothing: ' + f1.slice(0,3).join(' | '));
    out.steps.push('patience 70: held — "' + f1.find(t=>/running it back|тем же составом/i.test(t)) + '"');

    /* ---- and an ordinary one is a decision rather than a formality ------- */
    // His year, 17 August: a Division 5 career simulated a whole season and kept
    // the same partner the entire time. It could not have done anything else -
    // the only thing that moves a partner's patience is a result, by
    // (percentile - 0.5) * 12, so finishing mid-table moves it by exactly zero.
    // Forty-two cup nights, patience sixty at both ends, nobody unhappy, nobody
    // outgrown, three season turns all a formality. Duos change at the turn of a
    // season all the time without anybody falling out.
    let held = 0, split = 0;
    for (let n = 0; n < 40; n++) {
      seed('2026-03-18', 60, 80);
      CAREER.career.season = n + 1;              // a different career each time
      const was = mate();
      careerAdvanceTo('2026-03-19');
      if (mate() === was) held++; else split++;
    }
    out.notes = out.notes || {};
    out.notes.midTable = {held: held, split: split};
    if (!split) fail('a mid-table duo never changes, which is the bug');
    if (!held) fail('a mid-table duo always changes, which is the other one');
    out.steps.push('patience 60 over forty careers: ' + held + ' ran it back, ' +
                   split + ' moved on');

    // ---- an unhappy one leaves at the break ------------------------------
    seed('2026-03-18', 30, 80);
    const before2 = mate();
    careerAdvanceTo('2026-03-19');
    if (mate() === before2) fail('a partner below the unhappy line stayed');
    // The seat stays empty: who plays beside you is not handed out any more.
    // What arrives instead is somebody offering to take it.
    if (CAREER.partner) fail('the seat was refilled instead of left to the player');
    const offer = careerDms().find(t => t.state === 'offer' && !t.who.org && !t.who.brand);
    if (!offer) fail('nobody wrote to the empty seat');
    if (offer && !offer.msgs.some(m => m.from === 'them'))
      fail('the offer thread carries no message from them');
    const f2 = feed();
    if (!f2.some(t => /Parting ways|Расходимся/i.test(t))) fail('the split was not announced');
    // And taking the offer is one press, with no day of waiting in between.
    if (offer) careerDmAccept(offer.id);
    if (!CAREER.partner) fail('taking the offer did not seat them');
    // The player's own announcement, not one of the scene's — those carry an
    // author and are filed on top of it.
    const own = (CAREER.career.news||[]).find(n => n.k === 'ccNewsPartnerNew' && !n.by);
    if (!own) fail('the new duo was not announced by the player');
    if (own && own.a[0] !== mate())
      fail('the announcement names @' + own.a[0] + ' but the partner is ' + mate());
    out.steps.push('patience 30: ' + before2 + ' -> empty seat -> took ' + mate() + ' in one press');

    /* ---- and one you outgrew yourself --------------------------------- */
    // His career, 17 August: Division 5, a year fast-forwarded, he finished on 75
    // and his partner was 58, and the duo never changed. The rule only ever
    // asked whether the partner had outgrown the player - growing past your own
    // partner was not something this mode could notice, so a career could improve
    // by twenty points and drag the same duo through every cup of it.
    seed('2026-03-18', 90, 58);
    CAREER.player.ovr = 75; CAREER.player.ovrExact = 75;
    const behindWas = mate();
    careerAdvanceTo('2026-03-19');
    if (mate() === behindWas)
      fail('a 75 kept playing with a 58 because nobody asked the question');
    const f4 = feed();
    if (!f4.some(t => /somebody else|другим напарником/i.test(t)))
      fail('outgrowing a partner was not announced: ' + f4.slice(0,3).join(' | '));
    out.steps.push('75 beside a 58: ' + behindWas + ' -> ' + mate());
    // But one rung is not a gap: a 75 and a 70 are still the same division.
    seed('2026-03-18', 90, 70);
    CAREER.player.ovr = 75; CAREER.player.ovrExact = 75;
    const closeWas = mate();
    careerAdvanceTo('2026-03-19');
    if (mate() !== closeWas) fail('five points apart is not outgrowing anybody');
    out.steps.push('75 beside a 70: held');

    // ---- one who outgrew you goes too ------------------------------------
    seed('2026-03-18', 90, 80 + CAREER_DM_REACH + 2);
    const before3 = mate();
    careerAdvanceTo('2026-03-19');
    if (mate() === before3) fail('a partner far above the player stayed on a happy season');
    if (!feed().some(t => /moving up|уходит выше/i.test(t))) fail('the reason was not the right one');
    out.steps.push('a partner ' + (CAREER_DM_REACH+2) + ' above the player moves up, however happy');

    // ---- the rest of the scene announces on the same day ------------------
    seed('2026-03-18', 70, 80);
    careerAdvanceTo('2026-03-19');
    const others = (CAREER.career.news||[]).filter(n => n.by && n.k === 'ccNewsDuoAnnounce');
    if (others.length < 2) fail('only ' + others.length + ' other duos announced at the season turn');
    out.steps.push('others announced: ' + others.map(n => ccPostAuthor(n).name + ' — ' + ccText(n)).join(' | '));

    // ---- and it happens once ---------------------------------------------
    seed('2026-03-18', 70, 80);
    careerAdvanceTo('2026-03-19');
    const n1 = (CAREER.career.news||[]).length;
    careerSeasonTurn(s40);
    if ((CAREER.career.news||[]).length !== n1) fail('the season turned twice');
    out.steps.push('a season turns once, however many times the day is crossed');

    // ---- a jump across both turns still turns both ------------------------
    seed('2026-03-18', 70, 80);
    careerAdvanceTo('2026-06-10');
    if (CAREER.career.seasonTurn !== 'S41')
      fail('a jump from March to June left the career on ' + CAREER.career.seasonTurn);
    out.steps.push('jumping March to June lands on ' + CAREER.career.seasonTurn);
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccduo-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('duos turn over with the Fortnite season, and say so');
