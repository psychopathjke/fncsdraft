// A feed you can write to.
//
// His ask, 21 August. Every line in a career's feed was written by the mode —
// under the player's own handle, in the player's own voice, about the player's
// own evening — and there was no way to say anything that had not happened in a
// lobby. This is the box: two hundred and forty characters, posted under the
// career's name, sitting in the timeline and counted in the profile.
//
// What has to hold: the post lands in the feed and in the profile; it is the
// player's own words rather than a dictionary key; the words are escaped,
// because this is the one text in that feed that did not come from us; an empty
// box posts nothing; and the post survives a save.
//
//   node tools/check-career-post.js
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
  const write = text => {
    // The composer lives on the feed side of the socials tab, which is where a
    // player types into it; an unread inbox opens the other side by default.
    CH_SOCIAL = 'feed';
    careerRenderHub('social');
    const box = document.getElementById('ccPostBox');
    if (!box) { out.fails.push('the composer is not on the socials tab'); return null; }
    box.value = text;
    careerPostWrite();
    return (CAREER.career.news || [])[0];
  };

  const done = () => {
    try {
      localStorage.clear();
      CAREER = null;
      careerEntry();
      ccSetMode('rookie');
      ccPickRegion('EU');
      ccPickRole('roleFRG'); ccPickDiv(3); ccPickCountry('rs');
      const nick = document.getElementById('ccNick');
      nick.value = 'Poster'; nick.dispatchEvent(new Event('input', {bubbles:true}));
      if (typeof ccSync === 'function') ccSync();
      document.getElementById('ccStart').click();

      const before = (CAREER.career.news || []).length;
      const said = 'scrims all week and the endgames finally hold';
      const post = write(said);
      out.notes.post = post && {text: post.text, k: post.k, day: post.day};
      check('a post lands in the feed', !!post && post.text === said,
            JSON.stringify(out.notes.post));
      check('and it is the player, not the mode', !!post && !post.k && ccPostAuthor(post).you,
            String(post && post.k));
      check('the feed grew by exactly one', (CAREER.career.news||[]).length === before + 1,
            (CAREER.career.news||[]).length + ' vs ' + before);

      // The composer empties itself, or a second press posts the same line twice.
      const box = document.getElementById('ccPostBox');
      check('the box is emptied after posting', !box || !box.value, box && box.value);

      // It reads as what was typed, and it is on the screen.
      const html = ccPostHTML(post);
      out.notes.html = html.indexOf(said) >= 0;
      check('the post reads back as what was typed', html.indexOf(said) >= 0);
      CH_SOCIAL = 'feed';
      careerRenderHub('social');
      check('and it is drawn in the feed',
            (document.getElementById('chBody').innerHTML || '').indexOf(said) >= 0);

      // ---- somebody else's markup is not markup --------------------------
      const nasty = 'gg <img src=x onerror=alert(1)> wp';
      const bad = write(nasty);
      const badHtml = ccPostHTML(bad);
      out.notes.escaped = {stored: bad.text, drawnRaw: badHtml.indexOf('<img src=x') >= 0};
      check('what the player types is text and not markup',
            badHtml.indexOf('<img src=x') < 0 && badHtml.indexOf('&lt;img') >= 0,
            badHtml.slice(badHtml.indexOf('<p>'), badHtml.indexOf('</p>')));

      // ---- an empty box says nothing -------------------------------------
      const n0 = (CAREER.career.news||[]).length;
      write('   ');
      check('an empty box posts nothing', (CAREER.career.news||[]).length === n0,
            String((CAREER.career.news||[]).length));

      // ---- one thought, and it is counted --------------------------------
      const long = write('x'.repeat(CC_POST_MAX + 80));
      out.notes.length = long.text.length;
      check('a post is cut to one thought', long.text.length === CC_POST_MAX,
            String(long.text.length));
      const mine = (CAREER.career.news||[]).filter(n => ccPostAuthor(n).you && n.text);
      out.notes.mine = mine.length;
      check('the profile counts them as posts', mine.length === 3, String(mine.length));

      // ---- and it is in the save -----------------------------------------
      careerSave();
      CAREER = null;
      careerLoad();
      const back = (CAREER.career.news||[]).find(n => n.text === said);
      check('the post survives a save', !!back, said);
    } catch (e) { out.err = String(e && e.stack || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpost-'));
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
console.log('the feed can be written to');
fs.rmSync(dir, { recursive: true, force: true });
