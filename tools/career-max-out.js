// How long it takes to get all six to 99, and whether it is reachable at all.
//
// His question, 18 August: "то есть 99 99 99 99 99 99 возможно сделать".
// The day loop answers it — a session is half a point on one stat, it costs
// energy, and energy comes back at twelve a night. Everything else is the gear
// and the coach multiplying the session.
//
// This walks real days: advance the clock, take whatever session the energy pays
// for, always the stat that is furthest behind. No tournaments, no events — the
// pure ceiling, which is the optimistic answer to his question.
//
//   node tools/career-max-out.js [bare|kitted]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const MODE = (process.argv[2] || 'both');

const BOOT = `
<script>window.MAXMODE = ${JSON.stringify(MODE)};</script>
<script>
(function(){
  const out = {runs: {}, err: null};
  function done(){ document.title='PBEGIN'+encodeURIComponent(JSON.stringify(out))+'PEND'; }

  const ACT = {aim:'trAim', sur:'trSur', clu:'trClu', con:'trCon', exp:'trExp', end:'trEnd'};

  function run(kitted){
    localStorage.clear();
    careerEntry();
    ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
    const n=document.getElementById('ccNick');
    n.value='Maxer'; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();

    const cr=CAREER.career, pl=CAREER.player;
    if(!pl.attrs) pl.attrs=ccOwnAttrs();
    const start = {};
    ATTR_KEYS.forEach(function(k){ start[k]=Math.round(pl.attrs[k]); });

    if(kitted){
      // Everything the shop sells that touches a training day, and the best coach.
      cr.balance = 999999;
      ['mouse','headset','keyboard','monitor','desk','chair','chairhm','fitness','pcelite']
        .forEach(function(id){ careerBuy(id); });
      const best = CC_COACHES.slice().sort(function(a,b){ return b.train-a.train; })[0];
      careerHireCoach(best.id);
      out.runs[kitted?'kitted':'bare'] = out.runs[kitted?'kitted':'bare'] || {};
    }

    let days=0, sessions=0, rests=0;
    const maxDays = 365*6;
    function lowest(){
      let k=null;
      ATTR_KEYS.forEach(function(x){ if(k===null || pl.attrs[x]<pl.attrs[k]) k=x; });
      return k;
    }
    function allDone(){ return ATTR_KEYS.every(function(k){ return pl.attrs[k]>=98.999; }); }

    while(!allDone() && days<maxDays){
      // The coach is a month at a time; keep him working.
      if(kitted && !ccCoach()){
        const best = CC_COACHES.slice().sort(function(a,b){ return b.train-a.train; })[0];
        careerHireCoach(best.id);
      }
      let did=false;
      for(let s=0; s<6 && !allDone(); s++){
        const k2=lowest(), a2=ccActById(ACT[k2]);
        if(careerDayClosed() || careerEnergy() < a2.energy) break;
        if(careerDoAct(ACT[k2])===null) break;
        sessions++; did=true;
      }
      if(!did && !careerDayClosed() && !allDone()){
        if(careerDoAct('rest')!==null){ rests++; }
      }
      careerAdvanceTo(ccAddDays(careerToday(), 1));
      days++;
    }

    const end = {};
    ATTR_KEYS.forEach(function(k){ end[k]=Math.round(pl.attrs[k]*10)/10; });
    return {days: days, years: Math.round(days/365*10)/10, sessions: sessions, rests: rests,
            reached: allDone(), start: start, end: end,
            ageAtEnd: ccPlayerAge(), ovr: Math.round((pl.ovrExact||pl.ovr)*10)/10};
  }

  window.addEventListener('load', function(){
    try{
      if(window.MAXMODE!=='kitted') out.runs.bare = run(false);
      if(window.MAXMODE!=='bare')   out.runs.kitted = run(true);
      done();
    }catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'max-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,900',
  '--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.runs, null, 1));
fs.rmSync(dir, {recursive: true, force: true});
