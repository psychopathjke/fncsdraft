// A career changes language when the player does, feed and inbox included.
//
// The feed used to keep whatever language it was written in. careerNews was
// handed a finished sentence — L().ccNewsRating(56, 57), built at the moment
// the cup ended — and printed it back for ever, so a career played in Russian
// stayed Russian in its feed, its history and its inbox after the switch to
// English. Every dictionary key present and correct, half the screen in the
// wrong language, and tools/i18n-check.js passing throughout: it compares
// dictionaries, and this was never a dictionary problem.
//
// So the save holds a key and its numbers now, and the sentence is built when
// it is drawn. This plays a cup in Russian, switches to English, and reads the
// screen back.
//
//   node tools/check-language-switch.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BASE = '<base href="file:///' + ROOT + '/">';
const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  const CYR = /[\\u0410-\\u044F\\u0401\\u0451]/;
  const LAT = /[A-Za-z]/;
  const feedText = () => [...document.querySelectorAll('#chBody .x-post-in p')]
    .map(b => b.textContent.trim()).filter(Boolean);
  // What is left of a post once the parts that are the same in every language
  // are gone. An @handle is somebody's name and stays Latin in Russian; so do
  // the two tokens the scene writes the same way wherever it is writing from —
  // a player posts "W" and "TOP 1", not a translation of them.
  //
  // Anything else Latin in a Russian feed is still a failure. This exempts a
  // named list, not a shape, so a line that genuinely did not translate cannot
  // slip through by carrying an emoji.
  const SAME_IN_BOTH = /\\b(W|TOP)\\b/g;
  const translatable = t => String(t)
    .replace(/@[^\\s]+/g, ' ')
    .replace(SAME_IN_BOTH, ' ');
  try{
    // ---- play a cup with the interface in Russian ----------------------
    localStorage.setItem('fncsdraft_lang', 'ru');
    setLang('ru');
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Switch', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, week:1, division:5, earnings:0, tokens:[], log:[]}, partner:null
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));

    careerEntry();
    const skipper = setInterval(() => {
      const b = document.getElementById('majorSkipBtn');
      if (b && !b.disabled) b.click();
    }, 20);
    document.querySelector('#screen-career-hub .ch-play').click();
    let card = null;
    for (let i = 0; i < 6000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(skipper);
    if (!card) fail('the cup never finished');
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    await wait(200);

    const ru = feedText();
    out.steps.push('feed in Russian: ' + ru.slice(0, 3).join(' / '));
    if (!ru.length) fail('the cup left an empty feed');
    if (!ru.some(t => CYR.test(t))) fail('a career played in Russian produced no Russian feed');

    // Write to somebody, so a thread exists to check as well.
    careerTab('social');
    await wait(120);
    const write = document.querySelector('#chBody .dm-new');
    if (write) { write.click(); await wait(150); }
    const dmRu = [...document.querySelectorAll('#chBody .dm-msg span')].map(x => x.textContent.trim());
    out.steps.push('inbox in Russian: ' + dmRu.length + ' messages');

    // ---- switch, and read it back --------------------------------------
    setLang('en');
    await wait(60);
    careerTab('centre');
    await wait(200);
    const en = feedText();
    out.steps.push('feed in English: ' + en.slice(0, 3).join(' / '));
    if (en.length !== ru.length) fail('the feed changed length across the switch: ' + ru.length + ' -> ' + en.length);
    const stillRu = en.filter(t => CYR.test(t));
    if (stillRu.length) fail('these stayed Russian after switching: ' + stillRu.slice(0,3).join(' | '));
    if (!en.some(t => LAT.test(t))) fail('the English feed has no Latin text in it at all');
    out.steps.push('every feed line moved to English');

    careerTab('social');
    await wait(200);
    const dmEn = [...document.querySelectorAll('#chBody .dm-msg span')].map(x => x.textContent.trim());
    const dmStillRu = dmEn.filter(t => CYR.test(t));
    if (dmStillRu.length) fail('inbox stayed Russian: ' + dmStillRu.slice(0,2).join(' | '));
    out.steps.push('inbox moved too: ' + dmEn.length + ' messages, none Russian');

    careerTab('log');
    await wait(200);
    const logRu = [...document.querySelectorAll('#chBody')]
      .map(x => x.textContent).filter(t => CYR.test(t));
    if (logRu.length) fail('the history screen stayed Russian');
    out.steps.push('history moved too');

    // ---- and back again, so the switch is not one-way -------------------
    setLang('ru');
    await wait(60);
    careerTab('centre');
    await wait(200);
    const back = feedText();
    const leftEnglish = back.filter(t => !CYR.test(t) && LAT.test(translatable(t)));
    if (leftEnglish.length)
      fail('switching back left English in the feed: ' + leftEnglish.slice(0,2).join(' | '));
    out.steps.push('and back to Russian');

    // ---- a save written before this change still reads ------------------
    const old = JSON.parse(localStorage.getItem('fncsdraft_career'));
    old.career.news = [{season:1, week:1, kind:'good', text:'Старая запись без ключа'}];
    localStorage.setItem('fncsdraft_career', JSON.stringify(old));
    careerLoad();
    setLang('en');
    careerEntry();
    await wait(200);
    const legacy = feedText();
    if (!legacy.some(t => t.indexOf('Старая запись') >= 0))
      fail('an entry written before the keys was dropped instead of shown as it was');
    out.steps.push('an entry from an older save still reads: ' + legacy[0]);
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'langswitch-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('a career changes language when the player does');
fs.rmSync(dir, { recursive: true, force: true });
