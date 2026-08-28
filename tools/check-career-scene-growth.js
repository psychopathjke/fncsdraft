// The room grows off its own results, not only the career reading it.
//
// His rule, 21 August: everybody grows from results. Until then the roster was a
// photograph — a real player's rating is measured off what he actually did, and
// nothing in a career could move it, so eight seasons of climbing happened in a
// room where no familiar name ever had a year.
//
// What has to hold: the nights move the people who played them; who goes up is
// who beat what the room expected of them; the room does not inflate, because
// that expectation is read off the room itself; the movement is a shift stored
// on this career's save rather than something written into the measured cards;
// and a second career starts on a scene of its own.
//
//   node tools/check-career-scene-growth.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const build = nick => {
    localStorage.clear();
    CAREER = null;
    careerEntry();
    ccSetMode('rookie');
    ccPickRegion('EU');
    ccPickRole('roleFRG'); ccPickDiv(1); ccPickCountry('rs');
    const n = document.getElementById('ccNick');
    n.value = nick; n.dispatchEvent(new Event('input', {bubbles:true}));
    if (typeof ccSync === 'function') ccSync();
    document.getElementById('ccStart').click();
  };
  // What the roster reads today, by handle — the same snapshot every screen in a
  // career reads, so a change here is a change the player would see.
  const snapshot = () => {
    const m = {};
    careerRosterNowEU().forEach(p => { m[p.handle] = attrsFor(p).ovr; });
    return m;
  };

  const done = () => {
    try {
      build('SceneProbe');
      const was = snapshot();

      const me = careerYouTeam([careerCard()]);
      const field = [me].concat(careerCupField(CAREER.career, [careerCard()], 24, 'probe'));
      const real = t => (t.squad||[]).filter(c => c && c.tier !== 'ladder' && c.handle);
      out.notes.room = {teams: field.length, realTeams: field.filter(t => real(t).length).length};
      check('a Division 1 room is real people', out.notes.room.realTeams > 10,
            String(out.notes.room.realTeams));

      /* A season of nights with the same story in each: the weakest team in the
         room wins it and the strongest finishes last. Both beat and miss what
         the room expected of them by as much as the room allows, which is what
         the growth is built to read. */
      const strength = t => t.pow + (t.closeEdge||0);
      const pool = field.slice(1).filter(t => real(t).length).slice()
                        .sort((a,b) => strength(b)-strength(a));
      const strong = pool[0], weak = pool[pool.length-1];
      const up = real(weak)[0].handle, down = real(strong)[0].handle;
      field.forEach((t, i) => { t.stagePts = 200 - i * 3; t.wins = 0; t.stageElims = 0; });
      weak.stagePts = 1000; strong.stagePts = -1000;
      for (let i = 0; i < 30; i++) careerGrowEvent(12, field.length, me, field);

      const book = CAREER.dev || {};
      const keys = Object.keys(book);
      out.notes.book = {people: keys.length, up: book[up.toLowerCase()],
                        down: book[down.toLowerCase()]};
      check('a season of nights moved the room', keys.length > 10, String(keys.length));
      check('the team that kept beating the room came up',
            (book[up.toLowerCase()]||0) > 1, String(out.notes.book.up));
      check('and the one the room kept beating went down',
            (book[down.toLowerCase()]||0) < -1, String(out.notes.book.down));
      check('nobody moves further than the mode allows',
            keys.every(k => Math.abs(book[k]) <= 25), String(keys.length));

      // Nobody invented is in the book: their names are gone tomorrow.
      const made = new Set();
      field.forEach(t => (t.squad||[]).forEach(c => {
        if (c && c.tier === 'ladder' && c.handle) made.add(hKey(c)); }));
      out.notes.madeInBook = keys.filter(k => made.has(k)).length;
      check('and nobody invented is in it', out.notes.madeInBook === 0,
            String(out.notes.madeInBook));

      // ---- the room does not inflate -------------------------------------
      // Expectation is read off the room itself, so the ups and the downs have
      // to roughly cancel. What is left over is the age curve, which is meant
      // to be there.
      const sum = keys.reduce((s,k) => s + book[k], 0);
      out.notes.perHead = +(sum / Math.max(1, keys.length)).toFixed(2);
      out.notes.perNight = +(sum / Math.max(1, keys.length) / 30).toFixed(3);
      check('a season of nights is worth well under a rating a head',
            Math.abs(out.notes.perHead) < 0.6, String(out.notes.perHead));

      // ---- the shift is worn by the card, not written into it ------------
      const now = snapshot();
      out.notes.lift = {who: up, was: was[up], now: now[up], dev: book[up.toLowerCase()]};
      check('the roster card carries the movement', now[up] > was[up],
            JSON.stringify(out.notes.lift));
      check('and carries exactly the movement',
            Math.abs(now[up] - (was[up] + book[up.toLowerCase()])) <= 1,
            JSON.stringify(out.notes.lift));
      out.notes.drop = {who: down, was: was[down], now: now[down], dev: book[down.toLowerCase()]};
      check('and the one who went down reads lower', now[down] < was[down],
            JSON.stringify(out.notes.drop));

      // ---- a second career starts on a scene of its own ------------------
      careerSave();
      build('Second');
      const fresh = snapshot();
      out.notes.second = {book: Object.keys(CAREER.dev||{}).length,
                          up: fresh[up], down: fresh[down]};
      check('a new career does not inherit the old scene',
            !Object.keys(CAREER.dev||{}).length &&
            fresh[up] === was[up] && fresh[down] === was[down],
            JSON.stringify(out.notes.second));
    } catch (e) { out.err = String(e && e.stack || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccscene-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the room grows off its own nights');
fs.rmSync(dir, { recursive: true, force: true });
