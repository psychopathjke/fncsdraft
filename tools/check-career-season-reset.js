// A year's tournaments belong to that year.
//
// careerNewSeason clears the fields that answer "have you already been here",
// because a new season is the same measured year again and every one of those
// gates would otherwise stay shut for ever. The list was written on 17 August
// off a report that read "in the same career all the LANs were there in year
// two and by year three they were gone" — and it missed two keys.
//
// cr.major is keyed by the Major's number, and there are two of those every
// year, so last season's finished Major 1 is this season's Major 1 as far as
// careerMajorCan can tell. cr.gclc holds "already through the Last Chance",
// which locks its qualifier rounds and holds a Global Championship slot open
// forever. His player, 21 August, playing the same trio all year: qualified and
// could not enter.
//
//   node tools/check-career-season-reset.js
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
  const fresh=()=>{
    localStorage.clear();
    careerEntry();
    ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
    const n=document.getElementById('ccNick');
    n.value='Yearly'; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();
    CAREER.career.balance=99999;
  };
  const daysOf=(pred)=>{
    const list=[];
    careerYearDays().forEach((es, iso)=>{
      (es||[]).forEach(e=>{ if(pred(e)) list.push({iso, id:e.id, kind:e.kind}); });
    });
    return list.sort((a,b)=>a.iso<b.iso?-1:1);
  };
  // A season boundary without playing the year out: the boundary itself is what
  // is under test, not what leads up to it.
  const turnSeason=()=>{
    CAREER.career.seasonOver=true;
    CAREER.career.day=CC_YEAR_TO;
    careerNewSeason();
    /* Division 1 is kept by last season standing, and a probe that never played
       a Weekly Final is relegated out of it — which would refuse a Play-In for
       a reason that has nothing to do with what is under test here. */
    CAREER.career.division=1;
  };
  const done=()=>{
    try{
      const majorDays=daysOf(e=>e.kind==='major');
      const m1=majorDays.filter(d=>/^Major1_/.test(d.id));
      const m1PlayIn=m1.find(d=>/PlayIn$/.test(d.id));
      const m1Final=m1.find(d=>/Final$/.test(d.id));
      out.notes.calendar={m1PlayIn:m1PlayIn&&m1PlayIn.iso, m1Final:m1Final&&m1Final.iso};
      check('the calendar has a Major 1', !!m1PlayIn && !!m1Final);

      // ---- the Major ----------------------------------------------------
      fresh();
      // Season one, played to the end of Major 1: this is what the runner writes.
      CAREER.career.major={n:1, got:'final', pass:'final', ticket:false};
      const before=careerMajorCan(careerMajorOn(m1PlayIn.iso));
      check('a Major already finished is not replayed inside its own year',
            before===false, String(before));
      turnSeason();
      out.notes.afterTurn={season:CAREER.career.season, major:CAREER.career.major,
                           gclc:CAREER.career.gclc};
      CAREER.career.day=m1PlayIn.iso;
      const canPlayIn=careerMajorCan(careerMajorOn(m1PlayIn.iso));
      check('but a new year is a new Major 1', canPlayIn===true,
            JSON.stringify(out.notes.afterTurn));
      check('and the season does not start holding a seat at it',
            !CAREER.career.major, JSON.stringify(CAREER.career.major));

      // ---- the Last Chance ----------------------------------------------
      fresh();
      // Through the qualifier, into the Final: what careerRunGclc writes.
      CAREER.career.gclc={q:1, round:3, through:true, done:false};
      out.notes.heldBefore=(careerSlotHeld()||{}).key||null;
      check('being through it is a seat you hold',
            (careerSlotHeld()||{}).key==='gc', String(out.notes.heldBefore));
      turnSeason();
      out.notes.gclcAfter=CAREER.career.gclc;
      check('and the new year does not start already through it',
            !CAREER.career.gclc, JSON.stringify(CAREER.career.gclc));
      check('nor holding last year seat', careerSlotHeld()===null,
            String((careerSlotHeld()||{}).key));
      // Which is what let the rounds be played again.
      const gcDays=daysOf(e=>e.kind==='gc');
      const round=gcDays.map(d=>({d:d, g:careerGclcOn(d.iso)}))
                        .filter(x=>x.g && !x.g.final && x.g.round===2)[0];
      out.notes.round=round && {day:round.d.iso, q:round.g.q, round:round.g.round};
      if(round){
        CAREER.career.day=round.d.iso;
        check('and its rounds are open again', careerGclcCan(round.g)===true,
              JSON.stringify(out.notes.round));
      }

      // ---- and the ones that were already cleared stay cleared ----------
      fresh();
      const cr=CAREER.career;
      cr.summit={got:'final', ticket:true};
      cr.globals={done:true};
      cr.gaveUp=['lan'];
      cr.wf={monday:'2026-03-02'};
      turnSeason();
      out.notes.rest={summit:cr.summit, globals:cr.globals, gaveUp:cr.gaveUp, wf:cr.wf};
      check('the rest of the year is cleared as it always was',
            !cr.summit && !cr.globals && !cr.gaveUp && !cr.wf,
            JSON.stringify(out.notes.rest));
      // The ladder and the division are what a career keeps.
      check('and the division is kept', cr.division>=1 && cr.division<=5,
            String(cr.division));
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seasonreset-'));
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
console.log("a year's tournaments belong to that year");
fs.rmSync(dir, { recursive: true, force: true });
