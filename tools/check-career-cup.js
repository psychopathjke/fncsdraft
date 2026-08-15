// Drives a career cup through the real interface, not around it: writes a save,
// opens the hub, presses Play, skips the animation the way a player would, and
// checks that a result card comes back and that the save moved.
//
// The calibration harnesses call careerCupField and the simulation directly, so
// they would not notice a broken button, a missing string or a render that
// throws. This would.
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
  const out = {steps: [], errs: null, save: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const ccFirstCupDay = () => {
    const days = careerYearDays();
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
      if ((days.get(d)||[]).some(e => e.kind === 'cup')) return d;
    throw new Error('the year holds no divisional cup at all');
  };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v: 1,
      player: {nick: 'ProbeMan', age: 16, source: 'rookie', country: 'de',
               countryPing: 15, closeRangeEdge: 6, region: 'EU',
               ovr: 54, role: 'roleIGL', attrs: null, ageEdge: 4, photo: null,
               handle: null, cardRegion: null, nat: null},
      // The first divisional cup day, not the career's first day. Those were the
      // same date until the Victory Cup made 5 January enterable, and this
      // harness is about the divisional cup specifically.
      career: {season: 1, day: ccFirstCupDay(), division: 5, earnings: 0, tokens: [], log: []},
      partner: null
    }));
    // The save above leaves attrs null the way an old save might; the hub has to
    // survive that, so build them the way ccStart does before opening.
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));

    careerEntry();
    out.steps.push('hub open: ' + (document.getElementById('screen-career-hub').classList.contains('active')));
    const play = document.querySelector('#screen-career-hub .ch-play');
    out.steps.push('play button: ' + (play ? play.textContent.trim() : 'MISSING') + (play && play.disabled ? ' (disabled)' : ''));
    if (!play || play.disabled) { out.fail = 'play button is not usable'; throw new Error(out.fail); }

    // Press the skip button as soon as it exists and keep pressing: every stage
    // re-enables it, and a probe that watched the whole thing would take minutes.
    const skipper = setInterval(() => {
      const b = document.getElementById('majorSkipBtn');
      if (b && !b.disabled) b.click();
    }, 20);

    play.click();

    let card = null;
    for (let i = 0; i < 4000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(skipper);
    if (!card) { out.fail = 'no result card after the cup'; throw new Error(out.fail); }
    out.steps.push('result card: ' + card.querySelector('h4').textContent.replace(/\\s+/g, ' ').trim());
    // "New draft" restarts a one-off run and means nothing in a career.
    const nd = document.querySelector('.new-draft-btn');
    if (!nd) { out.fail = 'the new-draft button is gone from the page entirely'; throw new Error(out.fail); }
    if (nd.style.display !== 'none') { out.fail = 'new draft is still offered inside a career cup'; throw new Error(out.fail); }
    out.steps.push('new draft hidden during the cup: true');
    out.steps.push('result body: ' + card.querySelector('.stage-detail').textContent.replace(/\\s+/g, ' ').trim());

    card.querySelector('button[onclick*="careerBackToHub"]').click();
    out.steps.push('back on hub: ' + document.getElementById('screen-career-hub').classList.contains('active'));
    const feed = [...document.querySelectorAll('#chBody .x-post-in p')].map(b => b.textContent.trim());
    // Who the feed says posted each line. A result is the scene's own account, a
    // rating is you, a partner's mood is the partner — all off the key the save
    // stores, so a feed where everything came from one account means the mapping
    // is not firing.
    const authors = [...document.querySelectorAll('#chBody .x-post-in header b')].map(b => b.textContent.trim());
    out.steps.push('post authors: ' + [...new Set(authors)].join(', '));
    if (new Set(authors).size < 2)
      { out.fail = 'every post came from the same account: ' + authors[0]; throw new Error(out.fail); }
    if (!feed.length) { out.fail = 'the feed is empty after a cup'; throw new Error(out.fail); }
    out.steps.push('feed: ' + feed.slice(0, 4).join(' / '));
    careerTab('log');
    out.steps.push('log tab: ' + document.getElementById('chBody').textContent.replace(/\\s+/g, ' ').trim().slice(0, 160));

    // The DMs: a cup result should have produced one, and taking the person up
    // on it should actually change who you play with.
    careerTab('social');
    // The social screen has two halves now and opens on whichever the player
    // needs; the messages are the half this checks, so it says so rather than
    // hoping. Without this the whole DM section passed by finding nothing.
    careerSocialTab('dms');
    const rows = [...document.querySelectorAll('#chBody .dm-item')];
    out.steps.push('dm threads + candidates: ' + rows.length);
    if (!rows.length) { out.fail = 'the inbox is empty after a cup — nothing to check'; throw new Error(out.fail); }
    const before = JSON.parse(localStorage.getItem('fncsdraft_career')).partner;
    const beforeName = before && (before.handle || (before.card && before.card.handle));
    const take = document.querySelector('#chBody .dm-foot .ch-sign');
    if (take && take.getAttribute('onclick').indexOf('careerDmAccept') === 0) {
      take.click();
      const after = JSON.parse(localStorage.getItem('fncsdraft_career')).partner;
      const afterName = after && (after.handle || (after.card && after.card.handle));
      if (afterName === beforeName) { out.fail = 'taking a DM duo did not change the partner'; throw new Error(out.fail); }
      out.steps.push('dm duo taken: ' + beforeName + ' -> ' + afterName);
    } else {
      out.steps.push('dm duo: no open offer to take this run');
    }
    // The week has a finite number of people in it. Writing to everyone in the
    // list has to empty the list rather than conjure a replacement each time —
    // that bug let you sit there messaging an endless queue of strangers.
    let guard = 0;
    while (guard++ < 30) {
      const next = document.querySelector('#chBody .dm-new');
      if (!next) break;
      next.click();
    }
    const left = document.querySelectorAll('#chBody .dm-new').length;
    const convos = document.querySelectorAll('#chBody .dm-item:not(.dm-new)').length;
    out.steps.push('wrote to everyone in ' + (guard - 1) + ' clicks, candidates left: ' + left +
      ', conversations: ' + convos);
    if (left !== 0 || guard > 12) { out.fail = 'the duo list never ran out (' + (guard-1) + ' clicks, ' + left + ' left)'; throw new Error(out.fail); }
    careerTab('centre');

    // ...and it has to come back for the modes that do have a next draft.
    show('screen-mode');
    const ndBack = document.querySelector('.new-draft-btn');
    if (ndBack.style.display === 'none') { out.fail = 'new draft stayed hidden after leaving the career'; throw new Error(out.fail); }
    out.steps.push('new draft back outside the career: true');
    careerEntry();

    const saved = JSON.parse(localStorage.getItem('fncsdraft_career'));
    out.save = {day: saved.career.day, division: saved.career.division,
                ovr: saved.player.ovr, potential: saved.player.potential,
                logged: (saved.career.log || []).length,
                partner: saved.partner && (saved.partner.handle || (saved.partner.card && saved.partner.card.handle))};
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncscupui-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, HEAD + src + BOOT);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.save) console.log('  save: ' + JSON.stringify(out.save));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('career cup plays through the interface');
fs.rmSync(dir, { recursive: true, force: true });
