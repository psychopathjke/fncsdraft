// Drafting a Major out of several regions, and playing it in one.
//
// His user's request, 17 August: "It would be cool if I could choose multiple
// regions for each fncs like the other modes are". Which opens the question he
// asked straight back - draft EU and NA, and whose tournament do you turn up to?
//
// It always had an answer and the answer was an accident: myPrizeRegion and the
// Grand Final's own region both read drafted[0].region, so the region deciding
// the field, the prize table and the LAN allocation was whichever card happened
// to be opened first. Harmless while the pool was one region; not harmless the
// moment two are allowed.
//
// So the pool is a multi-select in every mode now, and the event is its own
// question. This holds both halves: the packs offer every region that was
// ticked, and everything about the tournament reads the one that was chosen.
//
//   node tools/check-multi-region.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
window.addEventListener('load', function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    /* ---- the path a player actually walks ---------------------------------- */
    // Everything below reads the globals directly. This presses the buttons.
    chooseMode(2, 'cards1');
    buildPreRegionChecks();
    const plate=(sel,code)=>[...document.querySelectorAll(sel+' .rf-btn')]
      .find(b=>b.dataset.region===code);
    const shown=()=>document.getElementById('homeRegionBlock').style.display!=='none';
    out.notes.screen={pool:[...document.querySelectorAll('#preRegionChecks .rf-btn')]
                        .map(b=>b.dataset.region),
                      event:[...document.querySelectorAll('#homeRegionChecks .rf-btn')]
                        .map(b=>b.dataset.region)};
    check('the pool offers every region and an all-regions plate',
          out.notes.screen.pool.length===8 && out.notes.screen.pool[0]==='ALL',
          out.notes.screen.pool.join(','));
    check('and the event is asked before anything is ticked', shown());
    check('with every region on it, not only the ticked ones',
          out.notes.screen.event.length===7, out.notes.screen.event.join(','));
    plate('#preRegionChecks','EU').click();
    check('ticking one region defaults the event to it', preHomeRegion==='EU',
          String(preHomeRegion));
    plate('#homeRegionChecks','OCE').click();
    confirmRegionsAndStart();
    out.notes.walked={pool:preSelectedRegions.slice(), event:preHomeRegion,
                      packs:[...new Set((generatePack()||[]).map(p=>p.region))]};
    check('a European squad in the Oceanic Major comes out of the screen',
          preSelectedRegions.join()==='EU' && ccHomeRegion()==='OCE',
          JSON.stringify(out.notes.walked));
    check('and the packs deal the squad that was asked for',
          out.notes.walked.packs.join()==='EU', out.notes.walked.packs.join(','));

    /* ---- every set the tiles can start has every region --------------------- */
    // Five Majors and the four EWC cups. If one of them were a single-region set
    // the screen would simply not ask, which is right, but it is worth knowing
    // that none of them are.
    const sets = ['m1','m2','t1','t2','t3','r1','r2','r3','r4'];
    const spread = {};
    sets.forEach(k => {
      const list = cardRosterPlayers(k);
      if (!list.length) return;
      spread[k] = new Set(list.map(p => p.region)).size;
    });
    out.notes.regionsPerSet = spread;
    Object.keys(spread).forEach(k =>
      check(k + ' spans more than one region', spread[k] > 1, String(spread[k])));
    check('every tile set exists', Object.keys(spread).length === sets.length,
          Object.keys(spread).join(','));

    /* ---- the packs offer every region that was ticked ---------------------- */
    CARD_MODE = true; CARD_SET = 'm1'; squadSize = 2; REALISTIC = false;
    pendingCards = true; pendingCardSet = 'm1';
    // generatePack reads the draft pool off the global that startDraft fills.
    pool = cardRosterPlayers('m1').slice();
    const eu = pool.filter(p => p.region === 'EU')[0];
    preSelectedRegions = ['EU','NAC'];
    preHomeRegion = 'NAC';
    drafted = [eu];
    const offered = new Set();
    for (let i = 0; i < 12; i++)
      (generatePack()||[]).forEach(p => offered.add(p.region));
    out.notes.offered = [...offered];
    check('a second region is offered once the first card is in',
          offered.has('NAC'), [...offered].join(','));
    check('and a region nobody ticked is not',
          !offered.has('BR') && !offered.has('OCE'), [...offered].join(','));

    /* ---- and the ALL plate means all of them -------------------------------- */
    // His call, 17 August: let every region be an option. ALL leaves
    // preSelectedRegions empty, which used to fall back to locking the packs to
    // the first card opened - so ticking every region got you one.
    preSelectedRegions = [];
    const everywhere = new Set();
    for (let i = 0; i < 30; i++)
      (generatePack()||[]).forEach(p => everywhere.add(p.region));
    out.notes.allPlate = [...everywhere];
    check('ticking every region offers every region', everywhere.size >= 5,
          [...everywhere].join(','));

    /* ---- one region ticked behaves exactly as it always did ---------------- */
    preSelectedRegions = ['EU'];
    const onlyEu = new Set();
    for (let i = 0; i < 8; i++)
      (generatePack()||[]).forEach(p => onlyEu.add(p.region));
    check('one region ticked offers one region', onlyEu.size === 1,
          [...onlyEu].join(','));

    /* ---- and the tournament is the region that was chosen ------------------ */
    preSelectedRegions = ['EU','NAC'];
    preHomeRegion = 'NAC';
    const na = pool.filter(p => p.region === 'NAC')[0];
    drafted = [eu, na];                       // the EU card opened first, on purpose
    out.notes.run = {squad: drafted.map(p => p.handle + ' (' + p.region + ')'),
                     home: ccHomeRegion(), prize: myPrizeRegion()};
    check('the event is the one that was chosen, not the first card opened',
          ccHomeRegion() === 'NAC', ccHomeRegion());
    check('and the prize table follows it', myPrizeRegion() === 'NAC', myPrizeRegion());
    const teams = [];
    fillFieldTeams(pool.filter(p => p !== eu && p !== na), 20, 2, teams);
    const fieldRegions = new Set();
    teams.forEach(t => t.squad.forEach(p => fieldRegions.add(p.region)));
    out.notes.field = [...fieldRegions];
    check('and the whole field is that region', fieldRegions.size === 1 &&
          fieldRegions.has('NAC'), [...fieldRegions].join(','));

    /* ---- a European squad in the Oceanic Major ----------------------------- */
    // His question, 17 August: what if I want an EU squad and Oceania's
    // tournament? The screen only asked which event when the pool spanned more
    // than one region, so ticking EU alone answered Europe for both. They are
    // separate questions about separate things.
    preSelectedRegions = ['EU'];
    preHomeRegion = 'OCE';
    drafted = [eu, pool.filter(p => p.region === 'EU')[1]];
    out.notes.euInOce = {squad: drafted.map(p => p.region), home: ccHomeRegion(),
                         prize: myPrizeRegion()};
    check('an EU squad can play the Oceanic Major', ccHomeRegion() === 'OCE',
          ccHomeRegion());
    check('and it pays the Oceanic table', myPrizeRegion() === 'OCE', myPrizeRegion());
    const oceTeams = [];
    fillFieldTeams(pool.slice(), 20, 2, oceTeams);
    const oceRegions = new Set();
    oceTeams.forEach(t => t.squad.forEach(p => oceRegions.add(p.region)));
    check('against an Oceanic field', oceRegions.size === 1 && oceRegions.has('OCE'),
          [...oceRegions].join(','));
    // The packs still deal from the pool that was ticked, not from the event.
    drafted = [eu];
    const stillEu = new Set();
    for (let i = 0; i < 10; i++)
      (generatePack()||[]).forEach(p => stillEu.add(p.region));
    check('and the packs still deal the squad you asked for',
          stillEu.size === 1 && stillEu.has('EU'), [...stillEu].join(','));

    /* ---- nothing chosen falls back to what it did before ------------------- */
    preHomeRegion = null;
    check('with no answer it is the first card, as it always was',
          ccHomeRegion() === 'EU', ccHomeRegion());
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
});
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'multireg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], {maxBuffer: 512*1024*1024, encoding: 'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a Major drafts from many regions and is played in one');
fs.rmSync(dir, {recursive: true, force: true});
