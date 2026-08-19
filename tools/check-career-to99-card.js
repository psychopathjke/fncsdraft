// A stat that is trained has to be the stat that is shown.
//
// His screenshot, 18 August: END 99 and EXP 99 with AIM stuck on 94, SUR 96,
// CLU 95, CON 95, and days at the aim trainer moving none of it. The training
// itself is flat — half a point on the stat, clamped at 99 — so if the number on
// the card is not moving, the card is not showing the stat.
//
// attrsFor is where that could happen: a card carrying _targetOvr has every one
// of its six shifted by the same gap until the weighted total lands on the
// target, and the shift clamps at 99. Whatever is already at the ceiling stops
// absorbing, and the rest settle wherever the arithmetic leaves them.
//
// So this trains one stat to the top and asks both questions: what the career
// stored, and what the card prints.
//
//   node tools/check-career-to99-card.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  function done(){ document.title='PBEGIN'+encodeURIComponent(JSON.stringify(out))+'PEND'; }
  function check(what, ok, saw){ if(!ok) out.fails.push(what + (saw!==undefined ? ' — ' + saw : '')); }

  window.addEventListener('load', function(){
    try{
      localStorage.clear();
      careerEntry();
      ccPickRegion('EU');
      // A real card rather than a rookie: pick the strongest in the region, which
      // is the shape of the screenshot — a card whose six already touch the top.
      ccSetMode('card');
      const roster = careerRosterNowEU().slice().sort(function(a,b){ return b._ovr-a._ovr; });
      const take = roster[0];
      ccPickCard(take.handle);
      if(typeof ccSync==='function') ccSync();
      const btn = document.getElementById('ccStart');
      if (btn.disabled) { out.err = 'the card start stayed disabled'; return done(); }
      btn.click();
      out.notes.took = take.handle;

      const cr=CAREER.career, pl=CAREER.player;
      cr.balance=0;
      // Two hundred days at the aim trainer. Nothing else is spent, nothing else
      // is played: the only question is where aim ends up.
      for(let i=0;i<200;i++){
        cr.energy=CC_ENERGY_DAY; cr.did={};
        careerDoAct('trAim');
      }
      const stored = pl.attrs.aim;
      const card = careerCard();
      const shown = attrsFor(card);
      out.notes.stored = Math.round(stored*10)/10;
      out.notes.shown = {aim: shown.aim, sur: shown.sur, clu: shown.clu,
                         end: shown.end, exp: shown.exp, con: shown.con, ovr: shown.ovr};
      out.notes.storedAll = {aim: Math.round(pl.attrs.aim), sur: Math.round(pl.attrs.sur),
                             clu: Math.round(pl.attrs.clu), end: Math.round(pl.attrs.end),
                             exp: Math.round(pl.attrs.exp), con: Math.round(pl.attrs.con)};
      out.notes.targetOvr = card && card._targetOvr;

      check('two hundred days of aim reach the top of the scale', stored >= 98.9,
            String(stored));
      check('and the card shows what was trained',
            Math.abs(shown.aim - Math.round(stored)) <= 1,
            'stored ' + Math.round(stored) + ', card ' + shown.aim);

      done();
    }catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'to99-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,900',
  '--virtual-time-budget=90000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a taken card trains the way a built one does');
fs.rmSync(dir, {recursive: true, force: true});
