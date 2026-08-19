// What a day is actually worth in energy.
//
// The constants say twelve a night and forty-five for a day given to rest, and a
// training session costs twenty-two to thirty. That arithmetic says a career can
// take a session every other day and walk all six stats to the top of the scale
// inside a couple of years. A first attempt at simulating it managed one session
// every ten days, which is a different mode entirely — so before answering "can
// you reach 99 across the board", measure the budget the answer rests on.
//
//   node tools/career-energy-budget.js
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
  const out = {notes: {}, err: null};
  function done(){ document.title='PBEGIN'+encodeURIComponent(JSON.stringify(out))+'PEND'; }

  window.addEventListener('load', function(){
    try{
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Budget'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      const cr=CAREER.career;
      out.notes.constants = {night: CC_ENERGY_NIGHT, rest: CC_ENERGY_REST,
                             day: CC_ENERGY_DAY, max: careerEnergyMax()};

      // A hundred nights, spending nothing: what does the clock hand back?
      cr.energy = 0;
      const from = careerToday();
      careerAdvanceTo(ccAddDays(from, 100));
      out.notes.hundredIdleNights = {energy: careerEnergy(), cappedAt: careerEnergyMax()};

      // And a hundred days spent as fast as they can be: always train the moment
      // the store covers a session, rest when it does not.
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
      const n2=document.getElementById('ccNick');
      n2.value='Budget'; n2.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      const cr2=CAREER.career;
      let sessions=0, rests=0, idle=0, spent=0;
      for(let d=0; d<100; d++){
        let did=false;
        for(let s=0; s<6; s++){
          const act=ccActById('trAim');
          if(careerDayClosed() || careerEnergy() < act.energy) break;
          const before=careerEnergy();
          if(careerDoAct('trAim')===null) break;
          spent += before-careerEnergy();
          sessions++; did=true;
        }
        if(!did && !careerDayClosed()){
          if(careerDoAct('rest')!==null){ rests++; did=true; }
        }
        if(!did) idle++;
        careerAdvanceTo(ccAddDays(careerToday(), 1));
      }
      out.notes.hundredDaysPlayed = {sessions: sessions, rests: rests, idle: idle,
                                     energySpent: spent,
                                     aim: Math.round(CAREER.player.attrs.aim*10)/10};
      out.notes.perDay = Math.round(spent/100*10)/10;

      done();
    }catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'budget-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,900',
  '--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
fs.rmSync(dir, {recursive: true, force: true});
