// Twitch grows with X (CC_TW_FROM_X), and a stream still has its raids without the frame.
//
//   node tools/check-career-twitch-x.js
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
  function fresh(){
    localStorage.clear();
    careerEntry();
    ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('fr');
    const n=document.getElementById('ccNick');
    n.value='Streamer'; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();
  }
  function nextDay(cr, i){ const d=new Date(cr.day+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+1); cr.day=d.toISOString().slice(0,10); cr.energy=CC_ENERGY_DAY; cr.did={}; }
  window.addEventListener('load', function(){
    try{
      fresh();
      const cr=CAREER.career;
      // 1. old save: X far ahead of Twitch is lifted once
      cr.reach=95200; cr.twitch=443; delete cr.twX;
      check('the save is lifted', careerMigrateTwitchFromX()===true);
      check('to half of X', cr.twitch===47600, cr.twitch);
      check('once', careerMigrateTwitchFromX()===false);
      // 2. new X readers bring Twitch along
      const tw0=cr.twitch; careerReachAdd(1000, true);
      check('a thousand on X is five hundred on Twitch', cr.twitch-tw0===500, cr.twitch-tw0);
      // 3. sim mode: no frame, but raids/clips/pros still happen
      cr.sim=true; let haps=0, frames=0, raids=0;
      for(let i=0;i<40;i++){
        nextDay(cr, i);
        careerStreamGo('grind');
        if(document.getElementById('ccTvFrame')) frames++;
        const sum=cr.streamLast && cr.streamLast.day===cr.day && cr.streamLast.sum;
        if(sum && sum.hap){ haps+=sum.hap.length; raids+=sum.hap.filter(h=>/Raid|Рейд/i.test(h)).length; }
      }
      out.notes.sim={haps:haps, raids:raids, frames:frames};
      check('sim opens no frame', frames===0, frames);
      check('sim streams still get happenings', haps>=5, haps);
      check('and raids among them', raids>=1, raids);
      // 4. a skip left over from last evening does not hide a free-day stream
      cr.sim=false; nextDay(cr, 99);
      skipAnimation=true; CC_SKIP_RUN=true; CAREER_RUN=false;
      careerStreamGo('grind');
      check('stale skip: the frame opens', !!document.getElementById('ccTvFrame'));
      check('and the skip is off', !skipAnimation && !CC_SKIP_RUN);
      ccTvClose(); CC_TV_PLAIN=null;
    }catch(e){ out.err=String(e && e.stack || e); }
    done();
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'twx-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,900',
  '--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('twitch follows X, and raids happen without the frame');
fs.rmSync(dir, {recursive: true, force: true});
