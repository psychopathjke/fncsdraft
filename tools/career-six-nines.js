// Can a career finish with 99 across all six?
//
// His question, 18 August. career-energy-budget.js measured the day the answer
// rests on: about one session a day once rest days are counted, and a hundred
// days of nothing else took aim from 62 to 99. This asks the same of all six at
// once, with the same loop shape, because the first attempt at simulating it
// used a different one and reported a quarter of the sessions a day actually
// pays for — worth remembering before trusting any number out of a walker.
//
//   node tools/career-six-nines.js [days]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const DAYS = parseInt(process.argv[2], 10) || 900;

const BOOT = `
<script>window.SIXDAYS = ${DAYS};</script>
<script>
(function(){
  const out = {runs: {}, err: null};
  function done(){ document.title='PBEGIN'+encodeURIComponent(JSON.stringify(out))+'PEND'; }
  const ACT = {aim:'trAim', sur:'trSur', clu:'trClu', con:'trCon', exp:'trExp', end:'trEnd'};

  function start(){
    localStorage.clear();
    careerEntry();
    ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
    const n=document.getElementById('ccNick');
    n.value='Sixer'; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();
    if(!CAREER.player.attrs) CAREER.player.attrs=ccOwnAttrs();
  }

  function walk(kitted){
    start();
    const cr=CAREER.career, pl=CAREER.player;
    const from={}; ATTR_KEYS.forEach(function(k){ from[k]=Math.round(pl.attrs[k]); });
    if(kitted){
      cr.balance=999999;
      ['mouse','headset','keyboard','monitor','desk','chair','chairhm','fitness','pcelite']
        .forEach(function(id){ careerBuy(id); });
    }
    const best = CC_COACHES.slice().sort(function(a,b){ return b.train-a.train; })[0];
    function lowest(){
      let k=ATTR_KEYS[0];
      ATTR_KEYS.forEach(function(x){ if(pl.attrs[x]<pl.attrs[k]) k=x; });
      return k;
    }
    function allNine(){ return ATTR_KEYS.every(function(k){ return pl.attrs[k]>=98.999; }); }

    let sessions=0, rests=0, day=0, doneOn=null, stuck=0, frozen=0, frozenAt=null, seasons=0;
    for(day=0; day<window.SIXDAYS && !allNine(); day++){
      if(kitted){ cr.balance=999999; if(!ccCoach()) careerHireCoach(best.id); }
      let did=false;
      for(let s=0; s<6; s++){
        if(allNine()) break;
        const k=lowest(), a=ccActById(ACT[k]);
        if(careerDayClosed() || careerEnergy() < a.energy) break;
        if(careerDoAct(ACT[k])===null) break;
        sessions++; did=true;
      }
      if(!did && !careerDayClosed() && careerDoAct('rest')!==null) rests++;
      if(!did) stuck++;
      const was=careerToday();
      careerAdvanceTo(ccAddDays(careerToday(), 1));
      if(careerToday()===was && cr.seasonOver){ seasons++; careerNewSeason(); }
      else if(careerToday()===was){ frozen++; if(!frozenAt) frozenAt={day:day, on:was,
        closed:careerDayClosed(), energy:careerEnergy(), over:!!cr.seasonOver}; }
      if(allNine() && doneOn===null) doneOn=day+1;
    }
    const to={}; ATTR_KEYS.forEach(function(k){ to[k]=Math.round(pl.attrs[k]*10)/10; });
    return {days: day, sessions: sessions, rests: rests,
            perDay: Math.round(sessions/Math.max(1,day)*100)/100,
            reachedOnDay: doneOn, years: Math.round(day/365*10)/10,
            seasonsCrossed: seasons, idleDays: stuck, clockFrozenDays: frozen, firstFreeze: frozenAt,
            lastDay: careerToday(), seasonOver: !!cr.seasonOver,
            from: from, to: to};
  }

  window.addEventListener('load', function(){
    try{
      out.runs.bare = walk(false);
      out.runs.kitted = walk(true);
      done();
    }catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'six-'));
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
