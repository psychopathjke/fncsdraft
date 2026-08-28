// A trio season scores like trios.
//
// The career had one FNCS ladder — nine for the win, four a step to fifth, two
// a step to twenty-fifth — which is PLACEMENT_POINTS_DUO written as arithmetic.
// The trio season shrank the rooms, the cuts and the purses and never came back
// for the points, so a trio Major was scored on the duo table while the lobbies
// around it were already on Epic's trio one. His call, 21 August: 2025's trio
// scoring, and the Reload circuit carried across the same way.
//
//   node tools/check-career-trio-points.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  const same=(a,b)=>a.length===b.length && a.every((v,i)=>v===b[i]);
  const ladder=(fn, n)=>Array.from({length:n}, (_,i)=>fn(i+1));
  const done=()=>{
    try{
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Scorer'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();
      const cr=CAREER.career;

      // ---- FNCS, the duo year ------------------------------------------
      cr.size=2;
      const duo=ladder(wfPoints, 26);
      out.notes.fncsDuo=duo.slice(0,8).join(',');
      check('a duo season keeps the duo ladder',
            same(duo.slice(0,25), PLACEMENT_POINTS_DUO), duo.slice(0,6).join(','));
      check('and 26th is worth nothing', duo[25]===0, String(duo[25]));

      // ---- FNCS, the trio year -----------------------------------------
      cr.size=3;
      const trio=ladder(wfPoints, 18);
      out.notes.fncsTrio=trio.slice(0,8).join(',');
      check('a trio season scores on Epic 2025 trios',
            same(trio.slice(0,17), PLACEMENT_POINTS_TRIO), trio.slice(0,6).join(','));
      // The rules page, read straight: VR 65, then 54, 48, 44, 40, 36.
      check('which is 65, 54, 48, 44, 40, 36',
            same(trio.slice(0,6), [65,54,48,44,40,36]), trio.slice(0,6).join(','));
      check('and 18th is worth nothing', trio[17]===0, String(trio[17]));
      // The one thing both formats agree on, and the reason the carry-across
      // rule below anchors on it.
      check('a Victory Royale is worth the same in both', trio[0]===duo[0],
            trio[0]+' vs '+duo[0]);

      // ---- the Heats pay their own win on top of second place -----------
      check('the Heats win is 944 over a trio second place',
            majorHeatPoints(1)===CC_MAJOR_HEAT_VR+54,
            String(majorHeatPoints(1)-CC_MAJOR_HEAT_VR));
      cr.size=2;
      check('and over a duo second place in a duo year',
            majorHeatPoints(1)===CC_MAJOR_HEAT_VR+56,
            String(majorHeatPoints(1)-CC_MAJOR_HEAT_VR));

      // ---- the divisional cup was already right ------------------------
      const wasSize=squadSize;
      squadSize=3;
      check('a divisional trio cup was already on the trio table',
            same(ladder(pointsForPlace, 17), PLACEMENT_POINTS_TRIO));
      squadSize=wasSize;

      // ---- Reload, carried across --------------------------------------
      cr.size=2;
      const rDuo=ladder(reloadCareerPoints('r2'), 16);
      out.notes.reloadDuo=rDuo.slice(0,6).join(',');
      check('a duo Reload keeps the published table',
            same(rDuo.slice(0,15), R_PLACEMENT.r2), rDuo.slice(0,5).join(','));
      cr.size=3;
      const rTrio=ladder(reloadCareerPoints('r2'), 12);
      out.notes.reloadTrio=rTrio.slice(0,11).join(',');
      check('a trio Reload pays the trio room, ten places',
            rTrio[9]>0 && rTrio[10]===0, rTrio.slice(9,11).join(','));
      check('and the win is still worth sixty', rTrio[0]===60, String(rTrio[0]));
      check('and it is 60, 48, 41, 34, 27, 20, 16, 12, 8, 4',
            same(rTrio.slice(0,10), [60,48,41,34,27,20,16,12,8,4]),
            rTrio.slice(0,10).join(','));
      // Cup 1 is the steeper one, in trios as in duos.
      const r1=ladder(reloadCareerPoints('r1'), 10);
      out.notes.reloadTrioCup1=r1.join(',');
      check('cup 1 stays the steeper ladder', r1[1]<rTrio[1], r1[1]+' vs '+rTrio[1]);
      check('and it pays its own sixty too', r1[0]===60, String(r1[0]));

      // ---- the rule itself ----------------------------------------------
      /* Run over the FNCS duo ladder, the carry-across should land near Epic's
         own trio table. It is not used for FNCS — that one is measured — but if
         it drifts far from the only measured pair there is, the rule is wrong.  */
      const modelled=ccTrioLadder(PLACEMENT_POINTS_DUO);
      out.notes.modelled=modelled.slice(0,8).join(',');
      check('the carry-across is the right length',
            modelled.length===PLACEMENT_POINTS_TRIO.length,
            modelled.length+' vs '+PLACEMENT_POINTS_TRIO.length);
      const drift=modelled.map((v,i)=>Math.abs(v-PLACEMENT_POINTS_TRIO[i]));
      out.notes.worstDrift=Math.max.apply(null, drift);
      check('and it lands within a few points of Epic own trio table',
            Math.max.apply(null, drift)<=5, String(Math.max.apply(null, drift)));
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triopts-'));
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
console.log('a trio season scores like trios');
fs.rmSync(dir, { recursive: true, force: true });
