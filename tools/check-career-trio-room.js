// In a trios season everything in the room is a trio, and the room is the size
// a trios room is.
//
// check-career-trio guards the season and the field sizes. This guards what
// happens once the field is built and handed to the simulator, which is where
// the duo kept surviving: the lobby the live screen is told to draw, the rival
// seated before anybody else, and who actually grows out of the week.
//
// All three were his, 20 August. The counter read 27/50 over 149 players in a
// season of threes; the rival sat in that lobby as two men; and the second seat
// of his own squad had not improved in a year of playing.
//
//   node tools/check-career-trio-room.js
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
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  const card = (h, o) => ({handle:h, region:'EU', rating:o, _ovr:o, nat:'de',
    tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed = size => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Threeman', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', size:size, division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partners:[{card:card('M1',85), patience:60, since:'2026-01-01', dev:0},
                {card:card('M2',84), patience:60, since:'2026-01-01', dev:0}]}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(88, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
  };

  try{
    // ---- the room the live screen is told to draw ------------------------
    // Nine of these were the literal 50 a duos season plays, so the counter in
    // the corner said /50 while the field held 33 teams.
    seed(3);
    if (careerSquadSize() !== 3) fail('the seeded season is not a trios one');
    const trio = {weekly: ccTeams(50), paris: ccTeams(20),
                  reload: ccReloadLobby(careerSquadSize()),
                  victory: ccVictoryLobby({id:'x'}, false)};
    seed(2);
    const duo  = {weekly: ccTeams(50), paris: ccTeams(20),
                  reload: ccReloadLobby(careerSquadSize()),
                  victory: ccVictoryLobby({id:'x'}, false)};
    Object.keys(duo).forEach(k => {
      if (!(trio[k] < duo[k]))
        fail('the ' + k + ' room is ' + trio[k] + ' in trios and ' + duo[k] +
             ' in duos — a trios room holds fewer teams, not the same number');
    });
    if (duo.weekly !== 50) fail('a duos weekly final should still be 50, it is ' + duo.weekly);
    if (trio.weekly !== 33) fail('a trios weekly final should be 33, it is ' + trio.weekly);
    out.steps.push('rooms — weekly ' + duo.weekly + '→' + trio.weekly +
                   ', Paris ' + duo.paris + '→' + trio.paris +
                   ', Reload ' + duo.reload + '→' + trio.reload +
                   ', Victory ' + duo.victory + '→' + trio.victory);

    // ---- the rival is a team, not a pair ---------------------------------
    seed(3);
    const rv = careerRivalMake();
    if (!rv) fail('no rival was drawn at all');
    const squad = [rv.card].concat((rv.mates && rv.mates.length) ? rv.mates
                                   : (rv.mate ? [rv.mate] : [])).filter(Boolean);
    if (squad.length !== careerSquadSize())
      fail('the rival is ' + squad.length + ' in a season of ' + careerSquadSize() +
           ': ' + squad.map(c => c.handle).join(' & '));
    const uniq = new Set(squad.map(c => hKey(c)));
    if (uniq.size !== squad.length) fail('the rival has the same person twice');
    out.steps.push('the rival is a ' + squad.length + ': ' + squad.map(c => c.handle).join(' & '));

    // ---- and he arrives in the field at that size ------------------------
    const you = [careerCard()].concat(careerMates());
    const field = careerCupField(CAREER.career, you, careerSquadSize(), 'trioroom|1', false);
    const wrong = field.filter(t => (t.squad || []).length !== careerSquadSize());
    if (wrong.length)
      fail(wrong.length + ' of ' + field.length + ' teams in the field are not ' +
           careerSquadSize() + '-handed: ' +
           wrong.slice(0, 3).map(t => (t.squad || []).length + ' [' + t.name + ']').join(', '));
    out.steps.push('every one of the ' + field.length + ' teams drawn is a ' + careerSquadSize());

    // ---- and none of them is somebody already in your own squad ----------
    const mine = new Set(you.filter(Boolean).map(c => hKey(c)));
    const clash = [];
    field.forEach(t => (t.squad || []).forEach(c => { if (c && mine.has(hKey(c))) clash.push(c.handle); }));
    if (clash.length) fail('your own squad is in the field against you: ' + clash.join(', '));
    out.steps.push('nobody from your own squad is drawn against you');

    // ---- both seats grow out of the week ---------------------------------
    seed(3);
    careerMateGrow(0.85, 0.5);
    const devs = careerMateRecords().map(p => p.dev || 0);
    if (devs.length !== 2) fail('a trio should hold two records, it holds ' + devs.length);
    if (!devs.every(d => d > 0))
      fail('a seat did not move: ' + devs.join(' / ') + ' — the second one is the bug');
    out.steps.push('both seats grew: ' + devs.map(d => d.toFixed(2)).join(' / '));

    // And a duo is untouched by that, which is how we know nothing was rebalanced.
    seed(2);
    careerMateGrow(0.85, 0.5);
    const one = careerMateRecords().map(p => p.dev || 0);
    if (one.length !== 1) fail('a duo should hold one record, it holds ' + one.length);
    if (Math.abs(one[0] - devs[0]) > 1e-9)
      fail('the duo seat moved by ' + one[0] + ' where it used to move by ' + devs[0]);
    out.steps.push('a duo seat still grows by exactly what it did: ' + one[0].toFixed(3));
    // ---- the year turns back to duos, and the player says who stays --------
    // His mechanic, 20 August: after the trios year you have to drop a
    // teammate, and it has to be a choice. Until it is made, nothing that
    // needs a squad can be entered; making it announces the one who leaves.
    seed(3);
    CAREER.career.season = 2; CAREER.career.seasonOver = true;
    careerNewSeason();
    if (careerSquadSize() !== 2) fail('season 3 should be duos, size says ' + careerSquadSize());
    if (careerMatesOver() !== 1) fail('two held in a duos year should overflow by 1, got ' + careerMatesOver());
    if (!careerNoMate('cup')) fail('a cup was enterable while the squad was oversized');
    careerMateChoose(1);
    const left = (CAREER.partners || []).filter(Boolean).map(p => p.card.handle);
    if (left.length !== 1 || left[0] !== 'M2')
      fail('kept seat 1 (M2) and the squad is ' + left.join(' / '));
    if (careerNoMate('cup')) fail('the cup is still locked after the choice was made');
    const said = (CAREER.career.news || []).some(n => n.k === 'ccNewsDuoSplit' &&
      n.a && String(n.a[0]).toLowerCase() === 'm1');
    if (!said) fail('the one who left was not announced');
    out.steps.push('back to duos: both shown, cup locked, kept M2, M1 announced out');

  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent =
    'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trioroom-'));
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
console.log('a trios season puts trios in a trios room');
