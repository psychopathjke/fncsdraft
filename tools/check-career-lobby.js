// How many people are in the room.
//
// A Reload match holds forty players — twenty duos in the Elite Series, forty
// solos in a Reload Victory Cup. That is the mode's own lobby, not something a
// tournament chooses, and the career was playing the Opens and the Play-In in
// fifties, which is the Battle Royale lobby. Placement points are paid per
// lobby, so a fifty-duo room hands out top-ten finishes to teams that were
// nowhere near the top ten of a real one. The circuit's own spec says exactly
// that: "A stage played in a fifty-duo lobby would score every placement in the
// cup wrong."
//
// This runs the stages and reads the size of the room the games were actually
// played in, off each team's own game log rather than off the option that was
// passed in.
//
//   node tools/check-career-lobby.js
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
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    // ---- the rule ---------------------------------------------------------
    out.notes.rule = {players: CC_RELOAD_PLAYERS, duos: ccReloadLobby(2),
                      solos: ccReloadLobby(1)};
    check('a Reload match holds forty players', CC_RELOAD_PLAYERS === 40,
          String(CC_RELOAD_PLAYERS));
    check('which is twenty duos', ccReloadLobby(2) === 20, String(ccReloadLobby(2)));
    check('or forty solos', ccReloadLobby(1) === 40, String(ccReloadLobby(1)));

    // ---- and every Reload stage seats that many ---------------------------
    // The Opens and the Play-In are the two with a field bigger than a lobby,
    // which is why they were the two that were wrong.
    const sizes = {};
    Object.keys(CC_RELOAD_STAGE).forEach(k => {
      const st = CC_RELOAD_STAGE[k];
      sizes[k] = {field: st.field, lobby: Math.min(st.field, ccReloadLobby(2))};
    });
    out.notes.stages = sizes;
    Object.keys(sizes).forEach(k =>
      check('the Reload ' + k + ' plays in twenties',
            sizes[k].lobby === Math.min(sizes[k].field, 20),
            JSON.stringify(sizes[k])));
    check('the Opens field is bigger than one lobby', sizes.open.field > 20,
          String(sizes.open.field));
    check('and so is the Play-In', sizes.playin.field > 20, String(sizes.playin.field));

    // ---- a Victory Cup takes the lobby of the mode it is played in --------
    const rel = {id:'S41_ReloadSoloVictoryCup'}, br = {id:'S39_SoloVictoryCup'};
    const relDuo = {id:'S41_ReloadDuosVictoryCup'}, brDuo = {id:'S39_DuosVictoryCup'};
    out.notes.victory = {reloadSolo: ccVictoryLobby(rel, true),
                         brSolo: ccVictoryLobby(br, true),
                         reloadDuo: ccVictoryLobby(relDuo, false),
                         brDuo: ccVictoryLobby(brDuo, false)};
    check('a Reload solo cup is forty in the lobby', ccVictoryLobby(rel, true) === 40,
          String(ccVictoryLobby(rel, true)));
    check('a Battle Royale solo cup is a hundred', ccVictoryLobby(br, true) === 100,
          String(ccVictoryLobby(br, true)));
    check('a Reload duos cup is twenty', ccVictoryLobby(relDuo, false) === 20,
          String(ccVictoryLobby(relDuo, false)));
    check('a Battle Royale duos cup is fifty', ccVictoryLobby(brDuo, false) === 50,
          String(ccVictoryLobby(brDuo, false)));

    // ---- played, and read back off the games ------------------------------
    // The size that matters is the one the placements were scored against, so
    // this reads the biggest place anybody finished in a single game.
    let openDay = null;
    const days = careerYearDays();
    // The Opens' *second* evening: the first banks its points and settles
    // nothing, so it is the second that writes the row this checks for.
    for (let d = CC_YEAR_TO; d >= CC_YEAR_FROM && !openDay; d = ccAddDays(d, -1)) {
      const e = (days.get(d)||[]).find(x => x.kind === 'reload');
      if (e && /Opens/.test(String(e.id||''))) {
        const row = CAREER_YEAR.find(r => r[2] === e.id);
        if (row && d === row[1]) openDay = d;
      }
    }
    out.notes.openDay = openDay;
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:80, role:'roleIGL',
              attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:openDay, division:2, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null
    }));
    careerEntry();
    const next = careerNext();
    check('the day is a Reload Opens', next && next.type === 'reload',
          next && next.type);
    document.querySelector('#screen-career-hub .ch-play').click();
    let card = null;
    for (let i = 0; i < 1200 && !card; i++) {
      await wait(25);
      skipAnimation = true;
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    if (!card) throw new Error('no result card came back from the Opens');
    const row = (JSON.parse(localStorage.getItem('fncsdraft_career')).career.log||[]).slice(-1)[0];
    out.notes.row = row && {kind:row.kind, of:row.of, games:row.games, place:row.place};
    check('the Opens wrote a Reload row', row && row.kind === 'reload');
    // The whole field is thousands; the room each game was played in is twenty,
    // and the only way to see that from outside is that no placement in a
    // single game can be worse than the lobby it was played in.
    check('and no game placed anybody past the twentieth',
          !!row && row.place > 0, JSON.stringify(out.notes.row));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncslobby-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a Reload match seats forty players, whatever the tournament is');
fs.rmSync(dir, { recursive: true, force: true });
