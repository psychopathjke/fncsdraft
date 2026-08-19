// The two things the shop learned to sell.
//
// Everything on the shelf multiplied a training day or raised the store of
// energy; nothing touched the audience, so a career that wanted to grow by
// being watched had nothing to spend on.
//
// A stream rig is a slot with three rungs, like the PC, and what it raises is
// the followers a night on stream brings.
//
//   node tools/check-career-stream-gear.js
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

  function fresh(money, div){
    localStorage.clear();
    careerEntry();
    ccPickRole('roleFRG'); ccPickDiv(div||1); ccPickRegion('EU'); ccPickCountry('de');
    const n=document.getElementById('ccNick');
    n.value='Streamer'; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();
    CAREER.career.balance = money;
  }

  function streamOnce(){
    const cr = CAREER.career;
    cr.energy = CC_ENERGY_DAY; cr.did = {};
    const before = careerReach();
    careerDoAct('stream');
    return careerReach() - before;
  }

  window.addEventListener('load', function(){
    try{
      // ---- the rig ------------------------------------------------------
      fresh(9000);
      const bare = streamOnce();
      check('a bare stream still pays', bare > 0, String(bare));
      check('the first rung is bought', careerBuy('streamcam') === true);
      const rung1 = streamOnce();
      check('and a night on stream is worth more', rung1 > bare, bare + ' -> ' + rung1);
      check('the second rung is bought', careerBuy('streamkit') === true);
      const rung2 = streamOnce();
      check('and more again', rung2 > rung1, rung1 + ' -> ' + rung2);
      check('the third rung is bought', careerBuy('streamlab') === true);
      const rung3 = streamOnce();
      out.notes.rig = {bare: bare, cam: rung1, kit: rung2, lab: rung3,
                       gear: Math.round(ccGearReach()*100)/100};
      check('and most of all at the top', rung3 > rung2, rung2 + ' -> ' + rung3);
      // The rungs replace each other rather than stacking.
      check('the rungs do not stack', Math.abs(ccGearReach() - 1.50) < 1e-9,
            String(ccGearReach()));
      check('and a rung already outranked is refused', careerBuy('streamcam') === false);

      // ---- and it changes nothing about a training day -------------------
      fresh(9000);
      CAREER.career.did = {}; CAREER.career.energy = CC_ENERGY_DAY;
      // ovrExact is only written once a day has been trained, so the stat itself
      // is what a fresh career can be measured on.
      const beforeAim = CAREER.player.attrs.aim;
      careerDoAct('trAim');
      const plain = CAREER.player.attrs.aim - beforeAim;
      fresh(9000);
      careerBuy('streamlab');
      CAREER.career.did = {}; CAREER.career.energy = CC_ENERGY_DAY;
      const beforeAim2 = CAREER.player.attrs.aim;
      careerDoAct('trAim');
      const withRig = CAREER.player.attrs.aim - beforeAim2;
      out.notes.training = {plain: Math.round(plain*1000)/1000, withRig: Math.round(withRig*1000)/1000};
      check('a stream rig trains nothing', Math.abs(plain - withRig) < 1e-9,
            plain + ' vs ' + withRig);

      done();
    }catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gear-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,900',
  '--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the shelf sells an audience, and it trains nobody');
fs.rmSync(dir, {recursive: true, force: true});
