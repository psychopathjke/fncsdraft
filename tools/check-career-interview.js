// The question after the match.
//
// The feed writes about the player all year and the player never says a word
// back. After a night worth asking about, somebody asks — and the three answers
// are three ways of being a professional, none of them free.
//
// What this holds: the question follows the result rather than appearing at
// random, an answer moves the three things a career actually runs on, blaming a
// duo you do not have is not offered, and a question is asked once.
//
//   node tools/check-career-interview.js
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
  const row = (place, of, passed, kind, stage) => ({season:1, day:'2026-02-03', div:2,
    place:place, of:of, kind:kind||'cup', stage:stage||null, passed:!!passed,
    games:11, prize:0});
  const seed = (log, withMate) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:78, role:'roleIGL',
              attrs:ccRookieAttrs(78,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-04', division:2, earnings:0, balance:0,
              reach:5000, form:0, tokens:[], log:log||[], news:[]},
      partner:null
    }));
    careerLoad();
    if (withMate) careerEnsurePartner();
    else CAREER.partner = null;
  };
  try {
    // ---- the question follows the result ---------------------------------
    seed([]);
    check('nothing to ask about after nothing', careerInterview() === null);
    seed([row(1, 150, true)]);
    out.notes.win = careerInterview() && careerInterview().id;
    check('winning is asked about', careerInterview() && careerInterview().id === 'win');
    seed([row(3, 150, true)]);
    check('a podium is asked about', careerInterview() && careerInterview().id === 'podium');
    seed([row(40, 150, true)]);
    check('so is getting through', careerInterview() && careerInterview().id === 'pass');
    seed([row(140, 150, false)]);
    check('and so is a bad night', careerInterview() && careerInterview().id === 'miss');
    seed([row(80, 150, false)]);
    out.notes.middle = careerInterview();
    check('an ordinary night in the middle is not', careerInterview() === null,
          JSON.stringify(careerInterview()));

    // ---- and only after a tournament that settles something --------------
    // Somebody asking after every open night is not press, it is a pop-up.
    const asked = {};
    ['cup','final','major','summit','globals','rc','eval','victory','reload','gclc']
      .forEach(k => { seed([row(1, 150, true, k)]); asked[k] = !!careerInterview(); });
    out.notes.kinds = asked;
    check('the divisional cup is asked about', asked.cup);
    check('so is the Weekly Final', asked.final);
    check('so is every stage of a Major', asked.major);
    check('and so are the three LANs', asked.summit && asked.globals && asked.rc,
          [asked.summit, asked.globals, asked.rc].join(','));
    check('the Performance Evaluation is not', !asked.eval);
    check('nor is a Victory Cup', !asked.victory);
    check('nor a night of the Reload circuit', !asked.reload);
    check('nor a Last Chance qualifier', !asked.gclc);

    // ---- answering it ----------------------------------------------------
    // Credit to the duo: your partner reads it.
    seed([row(1, 150, true)], true);
    const mate0 = CAREER.partner.patience;
    const reach0 = careerReach();
    careerInterviewSay('duo');
    out.notes.duo = {reach: reach0 + ' -> ' + careerReach(),
                     patience: mate0 + ' -> ' + CAREER.partner.patience,
                     form: careerForm()};
    check('crediting the duo is worth an audience', careerReach() > reach0);
    check('and your partner stays longer for it',
          CAREER.partner.patience > mate0, JSON.stringify(out.notes.duo));

    // The boast travels furthest, and it is the one that costs nothing.
    seed([row(1, 150, true)], true);
    const reachB = careerReach();
    careerInterviewSay('boast');
    const gotBoast = careerReach() - reachB;
    seed([row(1, 150, true)], true);
    const reachD = careerReach();
    careerInterviewSay('duo');
    const gotDuo = careerReach() - reachD;
    out.notes.reach = {boast: gotBoast, duo: gotDuo};
    check('the boast reaches further than the modest line', gotBoast > gotDuo,
          gotBoast + ' vs ' + gotDuo);
    check('and it is worth some confidence', careerForm() >= 0, String(careerForm()));

    // Blame costs the partner, which is the whole point of it being offered.
    seed([row(140, 150, false)], true);
    const mateB = CAREER.partner.patience;
    careerInterviewSay('blame');
    out.notes.blame = {patience: mateB + ' -> ' + CAREER.partner.patience};
    check('blaming your duo costs you your duo',
          CAREER.partner.patience < mateB, JSON.stringify(out.notes.blame));

    // ---- what is offered -------------------------------------------------
    seed([row(1, 150, true)], true);
    let html = careerInterviewHTML();
    check('with a partner all three answers are offered',
          /careerInterviewSay\\('duo'\\)/.test(html) &&
          /careerInterviewSay\\('boast'\\)/.test(html) &&
          /careerInterviewSay\\('blame'\\)/.test(html));
    seed([row(1, 150, true)], false);
    html = careerInterviewHTML();
    check('without one there is nobody to blame',
          !/careerInterviewSay\\('blame'\\)/.test(html));
    check('but the question is still asked', /careerInterviewSay\\('boast'\\)/.test(html));

    // ---- asked once ------------------------------------------------------
    seed([row(1, 150, true)], true);
    careerInterviewSay('duo');
    check('the same night is not asked about twice', careerInterview() === null);
    const after = careerReach();
    careerInterviewSay('boast');
    check('and answering again changes nothing', careerReach() === after,
          after + ' -> ' + careerReach());
    // Saying nothing also ends it.
    seed([row(1, 150, true)], true);
    const quiet = careerReach();
    careerInterviewPass();
    check('no comment is an answer too', careerInterview() === null);
    check('and it is worth nothing, which is the point', careerReach() === quiet);

    // ---- every wording exists, in both languages -------------------------
    // The keys are built at run time — 'ccIvQ' + kind + variant — so check-i18n
    // cannot see them and a missing one would reach the screen as a blank line
    // or the literal word undefined. This is the check that does see them.
    const missing = [];
    ['ru','en'].forEach(lang => {
      LANG = lang;
      ['win','podium','pass','miss'].forEach(kind => {
        for (let v = 1; v <= CC_IV_VARIANTS; v++) {
          const q = ccIvLine('ccIvQ', kind, v, [3, 150]);
          if (!q || /undefined/.test(q)) missing.push(lang + ' q ' + kind + v);
          CC_IV_ANSWERS.forEach(a => {
            const line = ccIvLine('ccIvA' + a.id, kind, v, ['Rimo', 3]);
            if (!line || /undefined/.test(line)) missing.push(lang + ' a ' + a.id + kind + v);
            const post = L()['ccIvSaid' + a.id + v];
            const said = typeof post === 'function' ? post('Rimo', 3) : post;
            if (!said || /undefined/.test(said)) missing.push(lang + ' post ' + a.id + v);
            if (CC_POST_BY['ccIvSaid' + a.id + v] !== 'you')
              missing.push(lang + ' author ' + a.id + v);
          });
        }
      });
    });
    LANG = 'en';
    out.notes.missing = missing.slice(0, 8);
    out.notes.wordings = 4 * CC_IV_VARIANTS * (1 + CC_IV_ANSWERS.length * 2);
    check('every question, answer and post is written in both languages',
          missing.length === 0, missing.slice(0, 5).join(', '));

    // ---- and two nights do not read the same -----------------------------
    // The wording is picked off the night itself, so it is stable across a
    // redraw and different across two wins.
    const seenQ = new Set();
    for (let d = 1; d <= 12; d++) {
      const r = row(1, 150, true);
      r.day = '2026-02-' + String(d).padStart(2, '0');
      seed([r], true);
      const iv = careerInterview();
      seenQ.add(ccIvLine('ccIvQ', iv.id, iv.v, [iv.row.place, iv.row.of]));
    }
    out.notes.distinctQuestions = seenQ.size;
    check('twelve wins do not all ask the same question', seenQ.size > 1,
          String(seenQ.size));
    // Stable: asking the same night twice gives the same wording.
    seed([row(1, 150, true)], true);
    const a1 = careerInterview().v, a2 = careerInterview().v;
    check('and the same night keeps its wording', a1 === a2, a1 + '/' + a2);

    // ---- the answer is the player's own post -----------------------------
    seed([row(1, 150, true)], true);
    careerInterviewSay('boast');
    const news = (CAREER.career.news||[])[0];
    out.notes.news = news && news.k;
    check('the answer reaches the feed', !!news && /^ccIvSaid/.test(news.k),
          news && news.k);
    check('in the player\\u2019s own voice',
          CC_POST_BY[news.k] === 'you', CC_POST_BY[news.k]);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsiv-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('somebody asks, and what you say costs something');
fs.rmSync(dir, { recursive: true, force: true });
