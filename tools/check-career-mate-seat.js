// A chair is asked for by name, and the person sitting in it is the one who
// leaves. Before this there was one button above the whole squad: it asked for
// a partner without saying which of them it meant, and careerMateSeat answered
// by dropping whoever was rated lowest. In a trio that is the mode overruling
// the player — he looked at two cards and pointed at one of them.
//
// The seat has to survive the whole distance: the button sets it, the search
// carries it, the conversation stores it, and they answer days later. So this
// walks that distance rather than calling careerMateSeat directly.
//
//   node tools/check-career-mate-seat.js
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
  // A card of a stated rating, so which one is "weakest" is not a guess.
  const card = (handle, ovr) => ({handle:handle, region:'EU', rating:ovr, _ovr:ovr,
    nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  // A trio with two named people in it, seat 0 rated above seat 1.
  const seed = (size, mates) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Seatman', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-04-01', size:size, division:2, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partners: mates.map(m => ({card: card(m[0], m[1]), patience:60, since:'2026-03-19'}))}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(80, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
  };
  const seated = () => careerMates().map(c => c && c.handle);
  // Somebody from the region who is not already in the squad.
  const stranger = () => {
    const taken = seated().map(h => hKey(h));
    const w = careerDuoSearchPool().find(x => taken.indexOf(hKey(x.handle)) < 0);
    if (!w) fail('the region has nobody left to ask');
    return w;
  };
  // The whole distance: press the button under a card, write, and let them
  // answer. careerDmWrite is not called directly — the point is that the seat
  // survives the search and the close.
  const askFromSeat = (seat, handle) => {
    ccDuoFindOpen(seat);
    if (CC_DUO_SEAT !== seat) fail('the search did not remember seat ' + seat +
                                   ' (it holds ' + CC_DUO_SEAT + ')');
    ccDuoFindWrite(handle);
    const t = careerDmFind(handle);
    if (!t) fail('writing to ' + handle + ' opened no conversation');
    if (t.seat !== seat) fail('the conversation with ' + handle + ' carries seat ' +
                              t.seat + ', not ' + seat);
    t.state = 'offer';
    careerDmAccept(t.id);
    return t;
  };

  try{
    // ---- a trio: the named chair empties, the other one does not ----------
    // Seat 0 is rated 90 and seat 1 is rated 60, so the weakest-goes rule and
    // the player's choice point at different people. That is the whole test.
    seed(3, [['Keeper', 90], ['Weakest', 60]]);
    if (careerMateSeats() !== 2) fail('a trio should hold two mates, it holds ' + careerMateSeats());
    const inc = stranger().handle;
    askFromSeat(0, inc);
    const after = seated();
    if (after[0] !== inc) fail('asked from under seat 0 and seat 0 still holds ' + after[0]);
    if (after[1] !== 'Weakest')
      fail('seat 1 was disturbed: Weakest -> ' + after[1]);
    out.steps.push('trio, asked from under the 90: ' + inc + ' takes seat 0, the 60 keeps seat 1');

    // ---- and the reverse, which is the one the old rule got wrong ---------
    // Pointing at the WEAKER card is what the old rule would have done anyway,
    // so point at the stronger one from the other side: seat 1 is the 90 now.
    seed(3, [['Weakest', 60], ['Keeper', 90]]);
    const inc2 = stranger().handle;
    askFromSeat(1, inc2);
    const after2 = seated();
    if (after2[1] !== inc2)
      fail('asked from under seat 1 (the 90) and it went to ' + after2.join(' / ') +
           ' — the rating rule overruled the player');
    if (after2[0] !== 'Weakest')
      fail('the 60 in seat 0 was taken instead: ' + after2.join(' / '));
    out.steps.push('trio, asked from under the 90 in seat 1: it is the 90 who leaves, not the 60');

    // ---- an empty chair is filled, not swapped ---------------------------
    seed(3, [['Alone', 70]]);
    const inc3 = stranger().handle;
    askFromSeat(1, inc3);
    const after3 = seated();
    if (after3.length !== 2) fail('the squad holds ' + after3.length + ' after filling a chair');
    if (after3[0] !== 'Alone') fail('filling the empty chair dropped ' + after3[0]);
    out.steps.push('an open chair is filled: ' + after3.join(' + '));

    // ---- nobody named: the old rule, untouched ---------------------------
    // The day panel still asks without naming anybody, and it must keep working.
    seed(3, [['Keeper', 90], ['Weakest', 60]]);
    ccDuoFindOpen();
    if (CC_DUO_SEAT !== null) fail('opening the search with no seat left CC_DUO_SEAT at ' + CC_DUO_SEAT);
    const inc4 = stranger().handle;
    ccDuoFindWrite(inc4);
    const t4 = careerDmFind(inc4);
    if (t4.seat !== null) fail('an unnamed request carries seat ' + t4.seat);
    t4.state = 'offer'; careerDmAccept(t4.id);
    const after4 = seated();
    if (after4.indexOf('Weakest') >= 0)
      fail('with nobody named the 60 should have gone, squad is ' + after4.join(' / '));
    if (after4.indexOf('Keeper') < 0)
      fail('with nobody named the 90 was taken instead: ' + after4.join(' / '));
    out.steps.push('nobody named: the 60 goes, which is the rule this always had');

    // ---- closing the search forgets the chair ----------------------------
    // Left set, the next request from the day panel would quietly aim at it.
    ccDuoFindOpen(1);
    ccDuoFindClose();
    if (CC_DUO_SEAT !== null) fail('closing the search left the seat at ' + CC_DUO_SEAT);
    out.steps.push('closing the search forgets which chair it was opened from');

    // ---- the feed names the person who actually left ---------------------
    seed(3, [['Keeper', 90], ['Weakest', 60]]);
    const inc5 = stranger().handle;
    askFromSeat(0, inc5);
    // The wording follows the season now — see ccSquadKey — so the post is
    // ccNewsDropped in a duo year and ccNewsDroppedt in a trio one.
    const dropped = (CAREER.career.news||[]).filter(n => /^ccNewsDroppedt?$/.test(n.k));
    if (!dropped.length) fail('nobody was said to have left');
    const named = dropped[dropped.length-1].a[0];
    if (named !== 'Keeper')
      fail('the feed says @' + named + ' left, but the chair emptied was the 90 (Keeper)');
    out.steps.push('the feed names @' + named + ' — the one who really lost the chair');

    // ---- a duo still behaves like a duo ----------------------------------
    seed(2, [['OnlyOne', 70]]);
    if (careerMateSeats() !== 1) fail('a duo should hold one mate, it holds ' + careerMateSeats());
    const inc6 = stranger().handle;
    askFromSeat(0, inc6);
    if (seated().join('') !== inc6) fail('a duo ended up as ' + seated().join(' / '));
    out.steps.push('a duo has one chair and asking from under it swaps the one partner');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccseat-'));
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
console.log('a chair is asked for by name, and the named one is the one that empties');
