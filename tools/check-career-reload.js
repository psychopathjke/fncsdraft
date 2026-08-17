// Walks a Reload Elite Series cup end to end through the real interface: the
// Opens, then the Play-Ins, then a heat, then the final, checking at each step
// that the stage is only enterable once the one before it has been cleared.
//
// The bracket comes from the card sets' own measurement
// (docs/superpowers/specs/2026-08-13-ewc-reload-elite-series-design.md):
// Opens and Play-Ins are twelve games with a kill worth 2, a heat is twenty duos
// over eight games with a kill worth 3 and only the top five come out, the final
// is those twenty over eight, and Europe's top three take a seat at the Esports
// World Cup. Nothing here pays cash, because the circuit does not.
//
//   node tools/check-career-reload.js
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
  const seed = (day, got, series) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Reloader', age:18, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:3, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[],
              reload: got ? {series:series||1, got:got} : undefined},
      partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(92, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry(); ccProbeSeat();
  };
  const playThrough = async (what) => {
    const play = document.querySelector('#screen-career-hub .ch-play');
    if (!play) fail(what + ': no button at all');
    if ((play.getAttribute('onclick')||'').indexOf('careerPlay') < 0)
      fail(what + ': the button skips instead of playing — ' + play.getAttribute('onclick'));
    const sk = setInterval(() => {
      const b = document.getElementById('majorSkipBtn');
      if (b && !b.disabled) b.click();
    }, 20);
    play.click();
    let card = null;
    for (let i = 0; i < 8000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail(what + ': no result card came back');
    const head = card.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const save = () => JSON.parse(localStorage.getItem('fncsdraft_career')).career;
  // Find the day each stage of cup 1 runs on, off the calendar rather than a list.
  const dayOf = (want) => {
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1)) {
      const ev = careerReloadOn(d);
      if (ev && ev.series === 1 && ev.stage === want) return d;
    }
    return null;
  };

  try{
    // ---- the bracket is the measured one --------------------------------
    const st = CC_RELOAD_STAGE;
    if (st.open.games !== 12 || st.playin.games !== 12) fail('the Opens and Play-Ins are twelve games');
    if (st.heat.games !== 8 || st.final.games !== 8) fail('a heat and a final are eight games');
    if (st.open.kill !== 2 || st.playin.kill !== 2) fail('a kill is worth 2 before the heats');
    if (st.heat.kill !== 3 || st.final.kill !== 3) fail('a kill is worth 3 from the heats on');
    if (st.heat.field !== 20 || st.heat.cut !== 5) fail('a heat is twenty duos and five come out');
    if (st.final.field !== 20 || st.final.cut !== 3) fail('a final is twenty duos and three take seats');
    out.steps.push('bracket: 12 games at 2 a kill, then heats of 20 over 8 at 3 a kill, top 5, final of 20');

    // ---- an open is open --------------------------------------------------
    // The Opens advance what Epic's own event page says they advance - "Top
    // 2,000 EU; Top 1,000 NAC; Top 500 OCE, ASIA, ME, BR, NAW", read off the
    // page on 17 August - carried as a share of whatever the ladder holds. The
    // Play-In is exactly what they sent: the sessions are windows of one
    // tournament, not two tournaments feeding one room.
    if (st.playin.cut !== 80) fail('the Play-In has to fill four heats of twenty, not ' + st.playin.cut);
    if (st.open.cut !== st.playin.field)
      fail('the Play-In holds what the Opens sent: ' + st.open.cut + ' vs ' + st.playin.field);
    if (st.playin.field <= st.playin.cut)
      fail('a Play-In of ' + st.playin.field + ' cutting to ' + st.playin.cut + ' is not a stage');
    const openShare = st.open.cut / st.open.field;
    const want = ccOpenAdvance() / CC_LADDER_TRUE;
    out.steps.push('opens: ' + ccCareerRegion() + ' sends ' + ccOpenAdvance() + ' of ' +
                   CC_LADDER_TRUE + ' — ' + (openShare * 100).toFixed(1) + '% of the room');
    if (Math.abs(openShare - want) > 0.02)
      fail('the Opens advance ' + ccOpenAdvance() + ' of ' + CC_LADDER_TRUE + ', which is ' +
           (want * 100).toFixed(1) + '%, not ' + (openShare * 100).toFixed(1) + '%');
    if (ccOpenAdvance() !== 2000) fail('Europe sends two thousand, not ' + ccOpenAdvance());
    if (st.open.field < 400) fail('the Opens field is ' + st.open.field + ', which makes its cut a coin flip');
    out.steps.push('opens: ' + st.open.cut + ' of ' + st.open.field + ' (' +
                   (openShare * 100).toFixed(1) + '%), play-in ' + st.playin.field + ' to 80');
    // And the room is the region, not the player's own rung. This used to be a
    // Division 4 player's Opens: a hundred and fifty generated ladder duos, all
    // banded on Division 4, and not one real name in it.
    CARD_MODE = true; squadSize = 2;
    const mk = (ovr, nick) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'probe', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, 'roleIGL')});
    CAREER = {player: {}, career: {season: 1, day: '2026-01-08', division: 4}, partner: null};
    const mine = [mk(CC_DIV_RATING[4], 'CHK_YOU'), mk(CC_DIV_RATING[4], 'CHK_MATE')];
    const openField = careerCupField(CAREER.career, mine, st.open.field, null, true);
    const ladder = openField.filter(t => t.squad.some(p => p.tier === 'ladder')).length;
    const ovrs = [];
    openField.forEach(t => t.squad.forEach(p => ovrs.push(attrsFor(p).ovr)));
    ovrs.sort((a,b) => b-a);
    const spread = ovrs[0] - ovrs[ovrs.length-1];
    if (openField.length < st.open.field - 1)
      fail('the Opens drew ' + openField.length + ' of ' + (st.open.field-1));
    if (openField.length - ladder < 100)
      fail('only ' + (openField.length - ladder) + ' real duos in an open of ' + openField.length);
    if (ovrs[0] < 90) fail('the best card in the Opens is ' + ovrs[0] + ' — the region is not in the room');
    if (spread < 30) fail('the Opens spans ' + spread + ' points of rating, so it is still one band');
    out.steps.push('opens field: ' + openField.length + ' duos, ' + (openField.length - ladder) +
                   ' of them real, ratings ' + ovrs[ovrs.length-1] + ' to ' + ovrs[0]);
    CAREER = null;

    // ---- cup 1's placement ladder is its own -----------------------------
    const p1 = reloadCareerPoints('r1'), p2 = reloadCareerPoints('r2');
    if (p1(1) !== 60 || p1(3) !== 42 || p1(12) !== 4 || p1(13) !== 0)
      fail('cup 1 pays 60/50/42 down to 4 at twelfth and nothing after');
    if (p2(3) !== 45 || p2(15) !== 3 || p2(16) !== 0)
      fail('cups 2-4 pay 45 at third and 3 at fifteenth');
    out.steps.push('cup 1 scores its own steeper ladder, cups 2-4 the flatter one');

    const days = {open:dayOf('open'), playin:dayOf('playin'), heat:dayOf('heat'), final:dayOf('final')};
    if (!days.open || !days.playin || !days.heat || !days.final)
      fail('cup 1 is missing a stage from the calendar: ' + JSON.stringify(days));
    out.steps.push('cup 1 on the calendar: opens ' + days.open + ', play-ins ' + days.playin +
                   ', heats ' + days.heat + ', final ' + days.final);

    // ---- a stage you have not earned is not offered ----------------------
    seed(days.playin, null);
    if (careerCanPlay(careerNext())) fail('the Play-Ins opened to somebody who never played the Opens');
    // A stage this career cannot enter is a day it still spends: the hub draws
    // the day's own choices with the reason on top, rather than a skip button
    // that throws the day away.
    const panel = document.querySelector('#screen-career-hub .cc-day-in');
    if (!panel) fail('an unearned Reload day should draw the day panel');
    if (!document.querySelector('#screen-career-hub .cc-day-locked'))
      fail('and it should say which room is playing without you');
    if (document.querySelector('#screen-career-hub .ch-play[onclick*="careerPlay"]'))
      fail('an unearned Reload day offered the tournament');
    out.steps.push('play-ins without the opens: locked, the button skips');
    seed(days.final, 'heat');
    if (!careerCanPlay(careerNext())) fail('a team that came through its heat cannot enter the final');
    seed(days.final, 'heat', 2);
    if (careerCanPlay(careerNext())) fail('cup 2 progress opened cup 1\\'s final');
    out.steps.push('the chain is per cup: cup 2 progress does not open cup 1');

    // ---- play the Opens --------------------------------------------------
    seed(days.open, null);
    const n = careerNext();
    if (n.type !== 'reload') fail(days.open + ' should be a Reload day, the hub says ' + n.type);
    // Two evenings, one tournament: the first banks and settles nothing, the
    // second carries it in and the cut is read off the pair.
    out.steps.push('opens s1: ' + await playThrough('the Opens'));
    const banked = save();
    if ((banked.log||[]).some(r => r.stage === 'open'))
      fail('the first Opens evening wrote a row; it settles nothing');
    if (!banked.rel || banked.rel.id !== 'ReloadEliteSeries1Opens')
      fail('the first Opens evening banked nothing');
    if (banked.reload) fail('the first Opens evening recorded progress');
    // And it has to fit in a save. The Opens is the biggest room in the mode and
    // the banked evening carries a line for every duo in it, so this is the one
    // place a career can quietly stop being written: careerSave never throws, it
    // just does nothing, and every night after would be played on a save that no
    // longer existed.
    const raw = localStorage.getItem('fncsdraft_career') || '';
    out.notes = out.notes || {};
    const parsed = JSON.parse(raw);
    const big = {};
    Object.keys(parsed).forEach(k => { big[k] = Math.round(JSON.stringify(parsed[k]).length / 1024); });
    Object.keys(parsed.career || {}).forEach(k => {
      const n = Math.round(JSON.stringify(parsed.career[k]).length / 1024);
      if (n > 20) big['career.' + k] = n;
    });
    out.notes.bankedSave = {kb: Math.round(raw.length / 1024), parts: big,
                            carriedTeams: String(banked.rel.rows || '').split(';').length};
    if (CC_SAVE_FAIL) fail('the banked Opens did not fit in a save: ' + CC_SAVE_FAIL);
    if (raw.length > 2 * 1024 * 1024)
      fail('the banked Opens save is ' + Math.round(raw.length / 1024) + 'kb');
    if (out.notes.bankedSave.carriedTeams < ccOpenRoom())
      fail('the banked evening carried only ' + out.notes.bankedSave.carriedTeams +
           ' of ' + ccOpenRoom() + ' duos');
    const openRow = CAREER_YEAR.find(r => r[2] === 'ReloadEliteSeries1Opens');
    CAREER.career.day = openRow[1];
    careerSave();
    careerRenderHub('centre');
    out.steps.push('opens s2: ' + await playThrough('the Opens, second session'));
    const s1 = save();
    if (s1.day !== ccAddDays(openRow[1],1)) fail('the clock did not move a day after the Opens');
    const row = (s1.log||[]).slice(-1)[0];
    if (!row || row.kind !== 'reload' || row.stage !== 'open') fail('the Opens wrote no row');
    if (row.games !== 24) fail('the Opens logged ' + row.games + ' games, and two sessions are 24');
    if (row.prize) fail('the circuit pays no cash: ' + row.prize);
    /* An Opens is played in a sample and read out at the real thing's size.

       His question, 17 August: why does the cut line say 215 when the top
       thousand go through - and then, where would we get 9,766 duos from. Both
       right. The room is his, 2,100 since he shrank it on the 16th because a
       stage over five thousand measured 7.2 seconds; the real open is Tracker's
       9,766, and the number anybody can recite is Epic's thousand. So the room
       stays a sample and everything printed over it is multiplied out. */
    if (row.of !== CC_LADDER_TRUE)
      fail('an Opens result should read at the real open\\'s size, got ' + row.of);
    // The room is a sample of the real open and the card says the real open's
    // size, so the sample is capped where a stage stays watchable: 4,200 duos
    // over twelve games measured 7.5 seconds, which is the lag that shrank the
    // rooms in the first place.
    if (CC_RELOAD_STAGE.open.field !== ccOpenRoom())
      fail('the Opens is played in the sampled room, not ' + CC_RELOAD_STAGE.open.field);
    if (ccOpenRoom() > CC_OPEN_ROOM)
      fail('the Opens room is ' + ccOpenRoom() + ', which is a stage nobody waits through');
    if (row.place < Math.round(ccOpenScale(careerLadderEntrants())))
      fail('a place in an Opens should be multiplied out, got ' + row.place);
    if (CC_RANK_SCALE !== 1) fail('the display scale was left switched on');
    out.steps.push('logged: #' + row.place + ' of ' + row.of + ', ' + row.games + ' games' +
                   (row.passed ? ', through' : ', out'));
    if (row.passed && (!s1.reload || s1.reload.got !== 'open'))
      fail('coming through the Opens was not recorded');
    if (!row.passed && s1.reload) fail('missing the cut recorded progress anyway');

    // ---- and the final, seeded as if the heat had been cleared -----------
    seed(days.final, 'heat');
    out.steps.push('final: ' + await playThrough('the final'));
    const s2 = save();
    const row2 = (s2.log||[]).slice(-1)[0];
    if (row2.of !== 20) fail('the final seated ' + row2.of + ' duos, should be 20');
    if (row2.games !== 8) fail('the final ran ' + row2.games + ' games, should be 8');
    const seats = (s2.ewc||[]).length;
    if (row2.place <= 3 && !seats) fail('a top-three final took no seat at the Esports World Cup');
    if (row2.place > 3 && seats) fail('a seat was taken from outside the top three');
    out.steps.push('final: #' + row2.place + ' of ' + row2.of +
                   (seats ? ' — seat at the Esports World Cup taken' : ' — no seat'));
    const feed = [...document.querySelectorAll('#chBody .x-post-in p')].map(b=>b.textContent.trim());
    if (!feed.length) fail('the feed is empty after a Reload stage');
    out.steps.push('feed: ' + feed.slice(0,2).join(' / '));
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccreload-'));
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
if (out.notes) console.log(JSON.stringify(out.notes, null, 1));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the Reload Elite Series plays, stage by stage');
