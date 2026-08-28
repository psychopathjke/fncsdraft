// Three things his tester found, 20 August, and what they are now.
//
//   1. Morale could only fall. The scrim day — thirty-eight energy, a quarter
//      step into four attributes, six points of the partner's mood — had been
//      dropped from CC_DAY_ACTS while everything that reads it stayed: the
//      comments inside careerDoAct, the ccGiveMood label, the act.morale
//      branch. The only `morale:` left in the file was the −4 on the scrimup
//      event, so a player had no way at all to raise a partner's mood.
//
//   2. The difficulty throttled the way up and not the way down. It scaled the
//      age curve and the training day; what a result is worth was left at full
//      strength, so on Legend a good day paid a tenth and a bad night cost the
//      whole. The term is self-correcting on top of that — expectation is read
//      off the field — so a career sat pinned at its own level and could still
//      sink. "An hour and a half, and the last thirty minutes moved nothing."
//
//   3. Every club of a size named the same number. careerOrgSalary is a pure
//      function of tier and rating, so the best offer on the table was always
//      the biggest badge — HavoK twice running — and asking for more was
//      exactly a fifth, every club, every time.
//
//   node tools/check-career-feedback.js
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
  try {
    const seed = (div, diff, ovr) => { CAREER = {
      player:{nick:'Probe', ovr:ovr||70, ovrExact:ovr||70, region:'EU', role:'roleIGL',
              country:'de', age:18, attrs:ccRookieAttrs(ovr||70,'roleIGL')},
      career:{season:1, day:'2026-02-02', division:div, earnings:0, balance:5000,
              tokens:[], log:[], news:[], form:0, grind:0, size:2, diff:diff||'easy',
              reach:20000},
      partners:[{card:{handle:'Matey', nat:'de', region:'EU', org:null, tier:'ladder',
                       event:'', date:'-', placement:null, rating:70, _targetOvr:70,
                       _attrs:ccRookieAttrs(70,'roleFRG')},
                 patience:40, since:'2026-01-05', dev:0}],
      dms:[], gear:{own:[], train:0}}; };

    // ---- 1. a day that raises a partner's mood ---------------------------
    seed(3, 'easy');
    const scrim=CC_DAY_ACTS.find(a=>a.id==='scrim');
    check('the scrim is a day again', !!scrim);
    check('and it is the day that pays morale', !!(scrim && scrim.morale>0),
          scrim ? String(scrim.morale) : '-');
    const before=careerPatience();
    const did=careerDoAct('scrim');
    const after=careerPatience();
    out.notes.scrim={was:before, now:after, set:did && did.scrim
      ? did.scrim.who + ' ' + did.scrim.mine + '-' + did.scrim.theirs : null,
      worth:did && did.scrim ? did.scrim.mult : null};
    check('a scrim raises the partner', after>before, before + ' -> ' + after);
    check('and it is played against somebody, with a score',
          !!(did && did.scrim && did.scrim.who &&
             did.scrim.mine+did.scrim.theirs===CC_SCRIM_ROUNDS),
          did && did.scrim ? JSON.stringify(did.scrim) : 'no set');
    check('a stronger opponent is worth more than a weaker one',
          ccScrimSet({handle:'Up', ovr:80}, 70).mult >
          ccScrimSet({handle:'Down', ovr:60}, 70).mult,
          ccScrimSet({handle:'Up', ovr:80}, 70).mult + ' vs ' +
          ccScrimSet({handle:'Down', ovr:60}, 70).mult);
    // The evening does not re-roll itself when the screen redraws.
    const a1=ccScrimSet({handle:'Same', ovr:75}, 70), a2=ccScrimSet({handle:'Same', ovr:75}, 70);
    check('the same evening reads the same twice', a1.mine===a2.mine,
          a1.mine + ' then ' + a2.mine);

    // ---- 2. the difficulty is on the whole of the arithmetic -------------
    /* The strongest team in the room, finishing last and finishing first: the
       gap between those two nights IS what a result is worth, with the age
       curve — which both nights carry equally — cancelled out of it. */
    const night = (diff, place) => {
      seed(1, diff, 90);
      const you={pow:90, closeEdge:0}, field=[you];
      for(let i=0;i<50;i++) field.push({pow:70-i*0.1, closeEdge:0});
      return careerApplyGrowth(place==='last' ? field.length : 1, field.length, you, field);
    };
    const worth = diff => night(diff,'first').delta - night(diff,'last').delta;
    const easyRes=worth('easy'), eliteRes=worth('elite');
    const badEasy=night('easy','last').delta, badElite=night('elite','last').delta;
    out.notes.result={whatANightIsWorthOnEasy:+easyRes.toFixed(3),
                      onElite:+eliteRes.toFixed(3),
                      ratio:+(eliteRes/easyRes).toFixed(3),
                      eliteSettingIs:ccDiffOf('elite').age};
    out.notes.badNight={easy:+badEasy.toFixed(3), elite:+badElite.toFixed(3)};
    check('what a result is worth is scaled by the setting, like everything else',
          Math.abs(eliteRes/easyRes - ccDiffOf('elite').age) < 0.02,
          (eliteRes/easyRes).toFixed(3) + ' against ' + ccDiffOf('elite').age);
    check('so a bad night never costs an Elite career more than an Easy one',
          badElite >= badEasy - 1e-9, badEasy.toFixed(3) + ' vs ' + badElite.toFixed(3));
    check('and an Elite career is not walked backwards by standing still',
          night('elite','last').delta > -careerGrowthMax()*0.5,
          night('elite','last').delta.toFixed(3));

    // ---- 3. two clubs of a size are two clubs ----------------------------
    seed(1, 'easy', 88);
    const pool=careerOrgPool().slice(0, 40);
    const same={};
    pool.forEach(o=>{ const k=Math.round(o.tier);
      (same[k]=same[k]||[]).push(Math.round(careerOrgSalary(o.tier, 1, 20000)*ccOrgWageNoise(o.name))); });
    const tiers=Object.keys(same).filter(k=>same[k].length>1);
    let varied=0;
    tiers.forEach(k=>{ if(new Set(same[k]).size>1) varied++; });
    out.notes.wages={tiersWithMoreThanOneClub:tiers.length, ofThemVarying:varied,
      example:tiers.length ? {tier:tiers[0], said:same[tiers[0]]} : null};
    check('clubs on one tier do not all name the same number',
          tiers.length===0 || varied===tiers.length, varied + ' of ' + tiers.length);
    // And the number holds still while the offer is on the table.
    const twice=[ccOrgWageNoise('Team HavoK'), ccOrgWageNoise('Team HavoK')];
    check('a club says the same thing twice in a week', twice[0]===twice[1],
          twice.join(' / '));
    const spread=pool.map(o=>ccOrgWageNoise(o.name));
    out.notes.spread={low:+Math.min.apply(null,spread).toFixed(3),
                      high:+Math.max.apply(null,spread).toFixed(3)};
    check('and the spread stays inside the band it says it does',
          Math.min.apply(null,spread) >= 1-CC_ORG_WAGE_SPREAD-0.001 &&
          Math.max.apply(null,spread) <= 1+CC_ORG_WAGE_SPREAD+0.001,
          JSON.stringify(out.notes.spread));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccfb-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=90000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('morale can be raised, the setting is on the whole arithmetic, and a club is a club');
fs.rmSync(dir, { recursive: true, force: true });
