// A Division 1 week end to end, through the real interface.
//
// Division 1's cup is one tournament over two evenings — eleven games Monday,
// eleven Tuesday, and the sum decides the fifty who play Saturday's Weekly
// Final. This plays both nights and holds the arithmetic: Monday banks and
// writes nothing to the history, Tuesday's table starts from Monday's points
// rather than from zero, and the row that lands in the history is the
// tournament's — 22 games, both nights' points, one placement.
//
//   node tools/check-career-d1-week.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    // A Division 1 career standing on a cup Monday.
    const days = careerYearDays();
    let monday = null;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO && !monday; d = ccAddDays(d, 1))
      if ((days.get(d)||[]).some(e => e.kind === 'cup') && careerMonday(d) === d) monday = d;
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:16, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:88, role:'roleIGL',
              attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:monday, division:1, earnings:0, balance:0, tokens:[], log:[]},
      partner:null
    }));
    careerEntry(); ccProbeSeat();
    out.notes.monday = monday;

    const play = async () => {
      const btn = document.querySelector('#screen-career-hub .ch-play');
      btn.click();
      for (let i = 0; i < 400; i++) {
        await wait(25);
        skipAnimation = true;
        const card = [...document.querySelectorAll('#majorStages .stage-card')]
          .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
        if (card) return card;
      }
      throw new Error('no result card came back');
    };

    const mondayCard = await play();
    const mondayTxt = mondayCard.textContent.replace(/\\s+/g, ' ');
    out.notes.mondayCard = mondayTxt.slice(0, 160);
    const save1 = JSON.parse(localStorage.getItem('fncsdraft_career'));
    check('Monday banked instead of settling', !!save1.career.d1, JSON.stringify(save1.career.d1||null).slice(0,60));
    check('Monday wrote no history row', (save1.career.log||[]).length === 0);
    // Monday's field is packed now — one string of "name|pts|elims|games|wins"
    // rows rather than a map per column. ccRelUnpack gives back the old shape.
    const banked = save1.career.d1 ? ccRelUnpack(save1.career.d1.rows) : null;
    const myMonday = banked ? Object.keys(banked.pts)
      .filter(n => /Probe/.test(n)).map(n => banked.pts[n])[0] : null;
    out.notes.mondayPts = myMonday;
    check('and the banked card says what carries', /идут|go into the week/.test(mondayTxt));

    mondayCard.querySelector('button[onclick*="careerBackToHub"]').click();
    await wait(60);

    const tuesdayCard = await play();
    const tueTxt = tuesdayCard.textContent.replace(/\\s+/g, ' ');
    out.notes.tuesdayCard = tueTxt.slice(0, 200);
    const save2 = JSON.parse(localStorage.getItem('fncsdraft_career'));
    const row = (save2.career.log||[])[0];
    out.notes.row = row && {place: row.place, of: row.of, pts: row.pts, games: row.games};
    check('Tuesday wrote the week to the history', !!row);
    check('the row is 22 games', row && row.games === 22, row && String(row.games));
    check('and its points hold Monday', row && myMonday != null && row.pts > myMonday,
          row && (row.pts + ' vs ' + myMonday));
    // The week's card lists the week's games: Monday's eleven in front of
    // tonight's, numbered 1 to 22, with the running total carried across them.
    const gameRows = [...document.querySelectorAll('#majorStages table tr')]
      .map(r => r.textContent.replace(/\\s+/g, ' ').trim())
      .filter(t => new RegExp('^(' + L().gameWord + ') \\\\d+').test(t));
    out.notes.gameRows = gameRows.length;
    out.notes.firstRow = gameRows[0];
    out.notes.lastRow = gameRows[gameRows.length - 1];
    if (gameRows.length !== 22)
      fail('the week card lists ' + gameRows.length + ' games, it should list 22');
    const stagesTxt = document.getElementById('majorStages').textContent.replace(/\s+/g,' ');
    check('the stage card is titled the week', /итог недели|week total/.test(stagesTxt), stagesTxt.slice(0,120));
    // The live table's own line — "the week's standings, Monday already in
    // them" — belongs to the table while it plays, and that card is taken down
    // when the stage card replaces it, so it cannot be read here. What can be
    // read here is the week the card ended on, which the two checks above and
    // the twenty-two rows below already hold.
    check('Monday is spent once the week settles', !save2.career.d1);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsweek-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a Division 1 week is one tournament over two evenings');
fs.rmSync(dir, { recursive: true, force: true });
